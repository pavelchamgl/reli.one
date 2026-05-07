"""
Обработка платёжных вебхуков: создание Orders, Payment, Invoice.

Единый сервисный слой для Stripe и PayPal.
HTTP-слой (верификация подписи, маршрутизация по event_type) остаётся в views.py.

Публичный контракт
------------------
WebhookPaymentData  — входные данные, формирует view из payload webhook.
WebhookProcessingResult — результат обработки (orders, флаги).
create_orders_and_payment(data) → WebhookProcessingResult | None
set_conv_cache_after_commit(...)  — запись conversion-payload в кэш после коммита.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP

from django.core.cache import caches
from django.db import transaction
from rest_framework.exceptions import ValidationError

from accounts.models import CustomUser
from delivery.models import DeliveryAddress
from delivery.utils_async import async_parcels_and_seller_email
from order.models import (
    CourierService,
    DeliveryType,
    Invoice,
    Order,
    OrderEvent,
    OrderProduct,
    OrderStatus,
    ProductStatus,
)
from order.services.invoice_data import prepare_invoice_data
from order.services.invoice_generator import generate_invoice_pdf
from payment.models import Payment
from payment.services_async import async_send_client_email
from product.models import ProductVariant
from warehouses.models import Warehouse, WarehouseItem

logger = logging.getLogger(__name__)

_conv_cache = caches["conv"]
_CONV_CACHE_TTL = 60 * 60 * 24  # 24 ч


# ---------------------------------------------------------------------------
# Входные / выходные типы
# ---------------------------------------------------------------------------


@dataclass
class WebhookPaymentData:
    """
    Нормализованные данные из webhook-события — одинаковый контракт для Stripe и PayPal.

    Поля:
        payment_system   — "stripe" | "paypal"
        payment_method   — "stripe" | "paypal"
        session_id       — Stripe checkout session ID или PayPal order ID;
                           используется как идемпотентный ключ (Payment.session_id)
        session_key      — внутренний UUID из нашей метаданных (PayPalMetadata.session_key
                           / StripeMetadata.session_key)
        conv_cache_id    — ID, используемый как ключ conversion-кэша;
                           для Stripe = session_id, для PayPal = session_key
        amount           — итоговая сумма в EUR (уже конвертирована из центов для Stripe)
        currency         — код валюты в верхнем регистре
        customer_id      — Stripe customer ID или str(user.id) для PayPal; nullable
        payment_intent_id— Stripe payment_intent или PayPal order_id
        custom_data      — dict из *Metadata.custom_data (пользователь, адрес)
        invoice_data     — dict из *Metadata.invoice_data (groups, invoice_number)
        description_data — dict из *Metadata.description_data (variable_symbol, …)
    """

    payment_system: str
    payment_method: str
    session_id: str
    session_key: str
    conv_cache_id: str
    amount: Decimal
    currency: str
    customer_id: str | None
    payment_intent_id: str
    custom_data: dict
    invoice_data: dict
    description_data: dict | None = field(default=None)


@dataclass
class WebhookProcessingResult:
    """
    Результат обработки webhook.

    Атрибуты:
        orders         — список созданных Order-объектов; [] при idempotent-повторе
        is_replay      — True если Payment с таким session_id уже существовал
        invoice_created— True если Invoice был создан успешно
        origin_blocked — True если CZ-origin check выявил не-чешские SKU
                         (посылки не генерируются, но заказ создаётся)
    """

    orders: list
    is_replay: bool = False
    invoice_created: bool = False
    origin_blocked: bool = False


@dataclass
class PreparedOrderCreationContext:
    """Снимок данных для `transaction.atomic()` — только pre-flight, без записи заказов."""

    user: CustomUser
    groups: list
    vmap: dict
    origin_blocked: bool
    not_cz: list[str]
    pending_status: OrderStatus
    root_country: str


@dataclass
class PersistCheckoutResult:
    """Результат успешного `transaction.atomic()` в вебхук-checkout."""

    orders_created: list
    payment: Payment
    invoice_created: bool


# ---------------------------------------------------------------------------
# Публичные утилиты
# ---------------------------------------------------------------------------


def set_conv_cache_after_commit(
    session_id: str,
    amount: Decimal,
    currency: str = "EUR",
    *,
    source: str = "Webhook",
) -> None:
    """
    Ставит в очередь запись conversion-payload в кэш ПОСЛЕ коммита транзакции
    (через transaction.on_commit). Должна вызываться внутри atomic()-блока.

    Ключ: ``conv:{session_id}``. Для Stripe это checkout session ID,
    для PayPal — внутренний session_key (именно эти ID фронт передаёт
    в query-параметре ``session_id`` на thank-you странице).
    """
    payload = {
        "ready": True,
        "transaction_id": str(session_id),
        "value": float(amount),
        "currency": (currency or "EUR").upper(),
    }

    def _write() -> None:
        _conv_cache.set(f"conv:{session_id}", payload, timeout=_CONV_CACHE_TTL)
        logger.info("[%s] Conversion cache WRITE done for %s", source, session_id)

    logger.info(
        "[%s] Conversion cache planned after-commit for %s: %s %s",
        source,
        session_id,
        amount,
        currency,
    )
    transaction.on_commit(_write)


# ---------------------------------------------------------------------------
# Pre-flight helpers (private)
# ---------------------------------------------------------------------------


def _replay_if_payment_exists(
    data: WebhookPaymentData,
    source: str,
) -> WebhookProcessingResult | None:
    """
    Pre-atomic idempotency: if Payment already exists for (payment_system, session_id),
    schedule conversion cache write and return replay result; otherwise None.

    When no active transaction is open, ``set_conv_cache_after_commit`` schedules
    an immediate write (Django ``on_commit`` behavior) — unchanged from inline logic.
    """
    existing = Payment.objects.filter(
        payment_system=data.payment_system,
        session_id=data.session_id,
    ).only("amount_total", "currency").first()

    if not existing:
        return None

    logger.info("[%s] Idempotent replay for session_id=%s", source, data.session_id)
    set_conv_cache_after_commit(
        data.conv_cache_id,
        existing.amount_total,
        existing.currency,
        source=source,
    )
    return WebhookProcessingResult(orders=[], is_replay=True)


def _prepare_order_creation_context(
    data: WebhookPaymentData,
    source: str,
) -> PreparedOrderCreationContext | None:
    """
    Pre-atomic: user, группы, варианты, CZ-origin, Pending status, root country.
    Те же early return None и логи, что при инлайн-логике до ``transaction.atomic()``.
    """
    # ------------------------------------------------------------------
    # 2. Загружаем пользователя
    # ------------------------------------------------------------------
    user_id = data.custom_data.get("user_id")
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        logger.error("[%s] CustomUser not found: %s", source, user_id)
        return None

    # ------------------------------------------------------------------
    # 3. Группы из метаданных
    # ------------------------------------------------------------------
    groups = data.invoice_data.get("groups", [])
    if not groups:
        logger.error("[%s] No groups in invoice_data for session_key=%s", source, data.session_key)
        return None

    # ------------------------------------------------------------------
    # 4. Вариантов товаров + CZ-origin check (non-blocking — только флаг)
    # ------------------------------------------------------------------
    all_skus = [str(p.get("sku")) for g in groups for p in g.get("products", [])]
    variants = (
        ProductVariant.objects
        .filter(sku__in=all_skus)
        .select_related("product__seller__default_warehouse")
    )
    vmap = {v.sku: v for v in variants}

    not_cz: list[str] = []
    for sku in all_skus:
        v = vmap.get(sku)
        if not v:
            continue
        seller = getattr(v.product, "seller", None)
        dw = getattr(seller, "default_warehouse", None) if seller else None
        if not (dw and dw.country == "CZ"):
            not_cz.append(sku)

    origin_blocked = bool(not_cz)
    if origin_blocked:
        logger.warning(
            "[%s] CZ-origin check: non-CZ SKUs %s — parcel generation will be skipped",
            source,
            not_cz,
        )

    # ------------------------------------------------------------------
    # 5. Справочные данные
    # ------------------------------------------------------------------
    try:
        pending_status = OrderStatus.objects.get(name="Pending")
    except OrderStatus.DoesNotExist:
        logger.error("[%s] OrderStatus 'Pending' not found in DB", source)
        return None

    root_addr = data.custom_data.get("delivery_address") or {}
    root_country = (root_addr.get("country") or "").upper()

    return PreparedOrderCreationContext(
        user=user,
        groups=groups,
        vmap=vmap,
        origin_blocked=origin_blocked,
        not_cz=not_cz,
        pending_status=pending_status,
        root_country=root_country,
    )


def _persist_checkout_in_atomic(
    data: WebhookPaymentData,
    ctx: PreparedOrderCreationContext,
    source: str,
) -> PersistCheckoutResult | None:
    """
    Один ``transaction.atomic()`` — заказы, продукты, платёж, события, conv cache, инвойс (best-effort).
    При ValidationError / неожиданной ошибке — те же логи и ``return None``, что при инлайн-коде.
    """
    user = ctx.user
    groups = ctx.groups
    vmap = ctx.vmap
    pending_status = ctx.pending_status
    root_country = ctx.root_country

    orders_created: list[Order] = []
    invoice_created = False

    try:
        with transaction.atomic():
            for idx, group in enumerate(groups, start=1):
                dt = DeliveryType.objects.filter(id=group.get("delivery_type")).first()
                if not dt:
                    raise ValidationError(f"DeliveryType {group.get('delivery_type')} not found")

                cs = CourierService.objects.filter(id=group.get("courier_service")).first()
                courier_code = (cs.code or "").lower() if cs and cs.code else ""

                delivery_cost = Decimal(
                    group.get("calculated_delivery_cost", "0.00")
                ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                group_total = Decimal(
                    group.get("calculated_group_total", "0.00")
                ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

                delivery_address = _build_delivery_address(
                    user=user,
                    custom_data=data.custom_data,
                    gaddr=group.get("delivery_address") or {},
                    root_country=root_country,
                    delivery_type_id=group.get("delivery_type"),
                    courier_code=courier_code,
                )

                order = Order.objects.create(
                    user=user,
                    first_name=data.custom_data.get("first_name", ""),
                    last_name=data.custom_data.get("last_name", ""),
                    customer_email=data.custom_data.get("email"),
                    delivery_type=dt,
                    delivery_address=delivery_address,
                    pickup_point_id=group.get("pickup_point_id"),
                    delivery_cost=delivery_cost,
                    courier_service=cs,
                    phone_number=data.custom_data.get("phone"),
                    total_amount=data.amount,
                    group_subtotal=group_total,
                    order_status=pending_status,
                )

                OrderEvent.objects.create(
                    order=order,
                    type=OrderEvent.Type.ORDER_CREATED,
                )

                for p in group.get("products", []):
                    sku = str(p.get("sku"))
                    qty = int(p.get("quantity", 0))
                    variant = vmap.get(sku)
                    if not variant:
                        raise ValidationError(f"Group {idx}: SKU {sku} not found")

                    wh_item = WarehouseItem.objects.filter(
                        product_variant=variant, quantity_in_stock__gte=qty
                    ).first()
                    warehouse = wh_item.warehouse if wh_item else Warehouse.objects.first()

                    OrderProduct.objects.create(
                        order=order,
                        product=variant,
                        quantity=qty,
                        product_price=variant.price_with_acquiring,
                        delivery_cost=Decimal("0.00"),
                        seller_profile_id=variant.product.seller_id,
                        warehouse=warehouse,
                        status=ProductStatus.AWAITING_SHIPMENT,
                    )

                orders_created.append(order)
                logger.info(
                    "[%s] Group %s: Order %s created (%s products)",
                    source, idx, order.id, len(group.get("products", [])),
                )

            if not orders_created:
                raise ValidationError("Order creation failed: no orders produced")

            # Single Payment per checkout session
            payment = Payment.objects.create(
                payment_system=data.payment_system,
                session_id=data.session_id,
                session_key=data.session_key,
                customer_id=data.customer_id,
                payment_intent_id=data.payment_intent_id,
                payment_method=data.payment_method,
                amount_total=data.amount,
                currency=data.currency,
                customer_email=data.custom_data.get("email"),
            )

            for order in orders_created:
                order.payment = payment
                order.save(update_fields=["payment"])
                OrderEvent.objects.create(
                    order=order,
                    type=OrderEvent.Type.PAYMENT_CONFIRMED,
                    meta=_payment_event_meta(data, payment),
                )

            # Conversion cache — записывается after-commit
            set_conv_cache_after_commit(
                data.conv_cache_id,
                data.amount,
                data.currency,
                source=source,
            )

            # Invoice — best-effort; ошибки не откатывают транзакцию
            # (ловим только не-DB исключения; DB-исключения всё равно пометят транзакцию)
            try:
                invoice_number = data.invoice_data.get("invoice_number")
                variable_symbol = (data.description_data or {}).get("variable_symbol") or invoice_number
                invoice_file = generate_invoice_pdf(prepare_invoice_data(data.session_id))
                Invoice.objects.create(
                    payment=payment,
                    invoice_number=invoice_number,
                    variable_symbol=variable_symbol,
                    file=invoice_file,
                )
                invoice_created = True
                logger.info("[%s] Invoice %s created for payment %s", source, invoice_number, data.session_id)
            except Exception as exc:
                logger.exception("[%s] Invoice creation failed (best-effort): %s", source, exc)

    except ValidationError as exc:
        logger.warning("[%s] Validation error: %s", source, exc)
        return None
    except Exception as exc:
        logger.exception("[%s] Unexpected error during order creation: %s", source, exc)
        return None

    return PersistCheckoutResult(
        orders_created=orders_created,
        payment=payment,
        invoice_created=invoice_created,
    )


def _schedule_post_commit_side_effects(
    data: WebhookPaymentData,
    orders_created: list,
    invoice_created: bool,
    origin_blocked: bool,
    not_cz: list[str],
    source: str,
) -> None:
    """
    После успешного commit checkout-транзакции: клиентское письмо, затем посылки/продавцы.
    Async-функции сами используют transaction.on_commit; здесь только планирование вызовов.
    """
    # ------------------------------------------------------------------
    # 7. Post-commit async tasks (используют on_commit внутри себя)
    # ------------------------------------------------------------------
    if invoice_created:
        async_send_client_email(data.session_id)
        logger.info("[%s] Planned async customer email for session %s", source, data.session_id)
    else:
        logger.warning("[%s] Skipped customer email — invoice not ready for session %s", source, data.session_id)

    if origin_blocked:
        logger.warning(
            "[%s] Parcel generation skipped for session %s (non-CZ SKUs: %s)",
            source, data.session_id, not_cz,
        )
    else:
        order_ids = [o.id for o in orders_created]
        async_parcels_and_seller_email(order_ids, data.session_id)
        logger.info("[%s] Planned async parcels+seller_email for orders %s", source, order_ids)


# ---------------------------------------------------------------------------
# Основная функция обработки
# ---------------------------------------------------------------------------


def create_orders_and_payment(
    data: WebhookPaymentData,
) -> WebhookProcessingResult | None:
    """
    Атомарно создаёт Order(s), Payment и Invoice по данным webhook.

    Идемпотентность: если Payment с (payment_system, session_id) уже существует,
    функция обновляет conversion-кэш и возвращает ``WebhookProcessingResult(orders=[],
    is_replay=True)`` без создания дублей.

    Транзакционность: Orders + OrderProducts + Payment создаются в одном
    ``transaction.atomic()`` блоке. Invoice создаётся best-effort внутри той же
    транзакции — ошибки логируются, но НЕ откатывают заказ.

    Возвращает:
        WebhookProcessingResult — при успехе или idempotent-повторе.
        None — при невосстановимой ошибке (метаданные не найдены, статус не настроен
                и т.п.).
    """
    source = f"{data.payment_system.capitalize()}Webhook"

    replay = _replay_if_payment_exists(data, source)
    if replay is not None:
        return replay

    ctx = _prepare_order_creation_context(data, source)
    if ctx is None:
        return None

    origin_blocked = ctx.origin_blocked
    not_cz = ctx.not_cz

    persist = _persist_checkout_in_atomic(data, ctx, source)
    if persist is None:
        return None

    orders_created = persist.orders_created
    invoice_created = persist.invoice_created

    _schedule_post_commit_side_effects(
        data,
        orders_created,
        invoice_created,
        origin_blocked,
        not_cz,
        source,
    )

    return WebhookProcessingResult(
        orders=orders_created,
        invoice_created=invoice_created,
        origin_blocked=origin_blocked,
    )


# ---------------------------------------------------------------------------
# Приватные хелперы
# ---------------------------------------------------------------------------


def _build_delivery_address(
    *,
    user,
    custom_data: dict,
    gaddr: dict,
    root_country: str,
    delivery_type_id: int | None,
    courier_code: str,
) -> DeliveryAddress:
    """
    Создаёт DeliveryAddress исходя из типа доставки и курьерского сервиса.

    Логика:
    - delivery_type == 2 (HD)        → адрес из группы
    - DPD PUDO + gaddr задан         → адрес из группы (координаты пункта выдачи)
    - Packeta / GLS / другие PUDO    → пустой адрес (pickup_point_id используется отдельно)
    """
    full_name = (
        f"{custom_data.get('first_name', '')} {custom_data.get('last_name', '')}".strip()
    )
    base = dict(
        user=user,
        full_name=full_name,
        phone=custom_data.get("phone"),
        email=custom_data.get("email"),
    )

    if delivery_type_id == 2:
        return DeliveryAddress.objects.create(
            **base,
            street=gaddr.get("street", ""),
            city=gaddr.get("city", ""),
            zip_code=gaddr.get("zip", ""),
            country=gaddr.get("country", root_country),
        )

    if courier_code == "dpd" and gaddr:
        return DeliveryAddress.objects.create(
            **base,
            street=gaddr.get("street", ""),
            city=gaddr.get("city", ""),
            zip_code=gaddr.get("zip", ""),
            country=gaddr.get("country", root_country),
        )

    return DeliveryAddress.objects.create(
        **base,
        street="",
        city="",
        zip_code="",
        country=root_country,
    )


def _payment_event_meta(data: WebhookPaymentData, payment: Payment) -> dict:
    """Формирует meta для OrderEvent.PAYMENT_CONFIRMED в зависимости от провайдера."""
    if data.payment_system == "stripe":
        return {"stripe_session_id": data.session_id, "payment_id": payment.id}
    return {"payment_id": payment.id, "paypal_order_id": data.payment_intent_id}
