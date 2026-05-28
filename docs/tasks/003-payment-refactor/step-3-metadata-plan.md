# Task 003 — Step 3: Metadata isolation (план)

**Режим:** только анализ и план. Код, модели, миграции, API, webhooks и order lifecycle **не менялись**.

**Контекст:** после Step 1 (Stripe) и Step 2 (PayPal) логика сессий живёт в `payment/services/stripe_session.py` и `payment/services/paypal_session.py`; общие примитивы — в `payment/services/checkout_shared.py`. Блоки «собрать три JSON-поля + `*Metadata.objects.create` внутри `transaction.atomic()`» дублируются и должны быть вынесены в `payment/services/checkout_metadata.py`.

---

## 1. Где сейчас формируются данные

| Артефакт | Место |
|----------|--------|
| `custom_data` | `backend/payment/services/stripe_session.py` (внутри `StripeMetadata.objects.create`, ~L401–408); то же в `backend/payment/services/paypal_session.py` (~L405–412) |
| `invoice_data` | Оба файла: ~`{"groups": groups, "invoice_number": invoice_number}` |
| `description_data` | Оба файла: ~`gross_total`, `delivery_total`, `variable_symbol` как строки |
| `StripeMetadata.objects.create(...)` | `stripe_session.py` ~L398–418, внутри `with transaction.atomic():` |
| `PayPalMetadata.objects.create(...)` | `paypal_session.py` ~L402–422, внутри `with transaction.atomic():` |

**Дополнительно (не create, но контракт провайдера):**

- **Stripe Checkout `metadata`** (ключи провайдера, не поля модели): `backend/payment/services/stripe_checkout.py` — `metadata={"session_key", "invoice_number"}` + `idempotency_key=session_key`.
- **PayPal `reference_id` / `invoice_id` / return URL:** `backend/payment/services/paypal_checkout.py` — привязка к `session_key` и `invoice_number` (исходные значения те же, что в `*Metadata`).

**Потребители сохранённых JSON после checkout:**

- Восстановление в webhook: `backend/payment/views.py` — `StripeWebhookView` / `PayPalWebhookView` читают `StripeMetadata` / `PayPalMetadata` и собирают `WebhookPaymentData`.
- Обработка заказа: `backend/payment/services/webhook_processing.py` — `create_orders_and_payment`.
- PDF после оплаты: `backend/order/services/invoice_data.py` — `prepare_invoice_data` (читает `invoice_number`, `delivery_total`, структуру заказов из БД; см. раздел про `variable_symbol` в PDF).

---

## 2. Сравнение Stripe vs PayPal (структуры metadata)

### 2.1 Поля `StripeMetadata` / `PayPalMetadata`

Сейчас **словари `custom_data`, `invoice_data`, `description_data` идентичны по ключам верхнего уровня** в обоих сервисах сессии.

### 2.2 Совпадающие ключи

| Область | Ключи | Значение |
|---------|--------|----------|
| `custom_data` | `user_id`, `email`, `first_name`, `last_name`, `phone`, `delivery_address` | Строка `user_id`, остальное как пришло из checkout |
| `invoice_data` | `groups`, `invoice_number` | `groups` — тот же список групп, **мутируемый** в цикле (`calculated_*` поля) |
| `description_data` | `gross_total`, `delivery_total`, `variable_symbol` | Все как `str(...)` от `Decimal` / счётчиков |

### 2.3 Отличия

- **Нет отличий в форме сохранённых JSON** между Stripe и PayPal в текущем коде.
- **Отличается только внешняя интеграция:** Stripe кладёт `session_key` в **metadata сессии** и сверяет `amount_total` с `description_data.gross_total` (warning); PayPal кладёт `session_key` в **reference_id** и **не** выполняет такую сверку в view.

### 2.4 Критично для webhook / восстановления заказа

| Ключ / данные | Назначение |
|---------------|------------|
| `custom_data.user_id` | Обязателен: загрузка `CustomUser` в `create_orders_and_payment` |
| `custom_data.delivery_address` | Корневой адрес; `country` → `root_country` для PUDO/адресов |
| `custom_data.first_name`, `last_name`, `email`, `phone` | `Order`, `DeliveryAddress`, события |
| `invoice_data.groups` | Обязателен непустой список; внутри групп используются `delivery_type`, `courier_service`, `calculated_delivery_cost`, `calculated_group_total`, `delivery_address`, `products`, `pickup_point_id`, `seller_id`, … |
| `invoice_data.invoice_number` | `Invoice.invoice_number`, PDF через `prepare_invoice_data` |
| `description_data.variable_symbol` | `Invoice.variable_symbol` (fallback: `invoice_number`) |
| `description_data.gross_total` | Stripe: опциональная проверка суммы в `StripeWebhookView` (не блокирует, но логирует расхождение) |
| `description_data.delivery_total` | `prepare_invoice_data`: сложение доставки к grand total в PDF |
| `session_key` (поле модели) | Связь `Payment.session_key`, поиск metadata в `prepare_invoice_data` |

### 2.5 Frontend / conversion

- **Conversion cache** (`set_conv_cache_after_commit`): для Stripe ключ — `session_id` (checkout session id); для PayPal — **внутренний** `session_key`. Это уже зафиксировано в `webhook_processing` и комментариях в views — **менять нельзя** без смены фронта и контракта thank-you URL.
- Ответы create-session API отдают `session_key` (и для Stripe ещё `session_id` checkout). Формат ответа в Step 3 не трогаем.

---

## 3. Целевая структура `payment/services/checkout_metadata.py`

Цель модуля: **единая точка** для сборки трёх словарей и атомарного сохранения, без изменения содержимого ключей и типов значений.

### 3.1 Рекомендуемые функции

```text
build_checkout_custom_data(
    *,
    user,
    email: str,
    first_name: str,
    last_name: str,
    phone: str,
    delivery_address: dict,
) -> dict

build_checkout_invoice_data(*, groups: list, invoice_number: str) -> dict

build_checkout_description_data(
    *,
    gross_total: Decimal,
    delivery_total: Decimal,
    variable_symbol: str,
) -> dict
```

Опционально: тонкие алиасы `build_custom_data` / `build_invoice_data` / `build_description_data` как обёртки с тем же телом — если предпочтительнее короткие имена из задачи.

```text
save_stripe_metadata_atomic(
    *,
    session_key: str,
    custom_data: dict,
    invoice_data: dict,
    description_data: dict,
) -> StripeMetadata

save_paypal_metadata_atomic(
    *,
    session_key: str,
    custom_data: dict,
    invoice_data: dict,
    description_data: dict,
) -> PayPalMetadata
```

**Правила реализации (на этапе кодирования):**

- Внутри `save_*` — один `transaction.atomic()` на `objects.create`, как сейчас.
- Не объединять с вызовом Stripe/PayPal API: только БД-metadata.
- `groups` передаётся **после** полного цикла расчёта (уже с `calculated_*`), как сейчас — иначе webhook создаст заказы с нулевыми/несогласованными суммами.

### 3.2 Альтернатива (узкая)

Один `save_checkout_metadata_atomic(model, ...)` с передачей класса метаданных — допустимо, если снизит дублирование **без** смешивания Stripe/PayPal специфики (её нет в JSON).

---

## 4. Замороженный контракт (нельзя менять в Step 3)

| Область | Ограничение |
|---------|-------------|
| JSON keys | Все перечисленные ключи в `custom_data` / `invoice_data` / `description_data` сохраняют имена и вложенность (`groups` как список dict с ожидаемыми полями для webhook) |
| `session_key` | По-прежнему `str(uuid.uuid4())`, уникальность в БД; для Stripe — тот же ключ в `Stripe Checkout metadata.session_key` и `idempotency_key`; для PayPal — тот же в `reference_id` и return URL |
| `invoice_number` / `variable_symbol` | Источник — `next_invoice_identifiers()`; порядок вызова относительно транзакции metadata должен остаться логически тем же (нет второго потребителя между выдачей номера и записью, кроме будущих осознанных изменений вне Step 3) |
| `description_data` totals | `gross_total`, `delivery_total` — строки, согласованные с расчётом в сессии; формат должен оставаться сравнимым с `Decimal(...)` в Stripe warning и с `prepare_invoice_data` |
| Webhook compatibility | `WebhookPaymentData`, разбор в `create_orders_and_payment`, загрузка metadata по `session_key` / Stripe metadata — без изменений поведения |
| Stripe provider metadata | Ключи `session_key`, `invoice_number` в `stripe_checkout.Session.create(metadata=...)` |
| PayPal provider fields | `reference_id` == наш `session_key`, `invoice_id` == `invoice_number` |

---

## 5. Тесты, которые должны защитить формат metadata

### 5.1 Unit tests для builders

- Для `build_checkout_custom_data` / `build_checkout_invoice_data` / `build_checkout_description_data`:
  - точный набор ключей и типы (`user_id` — строка; totals — строки с ожидаемым количеством знаков после запятой согласно текущему `str(Decimal)` / `quantize` в сервисах);
  - `invoice_data["groups"]` — та же ссылка или глубокое равенство ожидаемой структуры после фиктивного цикла (можно подставить один групповой dict с `calculated_*`).

### 5.2 Regression: Stripe session metadata

- Добавить к зеркалу PayPal в `backend/payment/tests.py` класс для `build_stripe_checkout_context`:
  - аналог `test_metadata_saved_with_correct_keys`: проверка `StripeMetadata.objects.create` (mock) на полный набор ключей, включая **`first_name` и `last_name`** в `custom_data` (в текущем PayPal-тесте они не проверяются — расширить для симметрии).
- Сохранить/расширить интеграционные проверки в `backend/payment/test_checkout_flow.py` (если есть сценарий create Stripe session + чтение metadata).

### 5.3 Regression: PayPal session metadata

- Уже есть: `TestBuildPayPalCheckoutContext.test_metadata_saved_with_correct_keys` — после рефактора перепривязать патч к новому модулю или оставить вызов через `build_paypal_checkout_context` (поведение не должно измениться).

### 5.4 Webhook restore compatibility

- Существующие тесты `create_orders_and_payment` с `_make_webhook_data` — сохранить; при необходимости добавить кейс с полным `description_data` и проверкой, что при создании `Invoice` подставляется `variable_symbol` из `description_data` (уже логика в `webhook_processing`).
- Идемпотентность и сценарии без `groups` — без изменения ожиданий.

### 5.5 Stripe amount vs `gross_total` (опционально)

- Лёгкий тест на уровне view или сервиса сборки webhook data: при расхождении `amount_total` и `gross_total` сохраняется текущее поведение (warning, не 4xx из-за этого).

---

## 6. Отдельные вопросы (Step 3 vs Step 3.1)

### 6.1 `variable_symbol` в `StripeCheckoutContext` / `PayPalCheckoutContext`

- **В views не используется** — только `session_key`, `invoice_number`, line items, `gross_total` (PayPal).
- В тестах PayPal: `test_returns_context_with_expected_fields` проверяет `ctx.variable_symbol`.
- **Вывод:** убрать поле из dataclass можно как косметику, но это **меняет публичный тип контекста** и тесты; к metadata isolation отношения не имеет. Рекомендация: **не включать в Step 3**; при желании — **Step 3.1** «Checkout context cleanup» или оставить для совместимости/отладки.

### 6.2 Дублированный `_check_czOrigin` в `stripe_session.py` / `paypal_session.py`

- Логика совпадает; различается только класс исключения (`StripeSessionBuildError` vs `PayPalSessionBuildError`).
- Вынести в `checkout_shared.py` можно через параметр `error_cls` или общий базовый `CheckoutSessionBuildError` с подтипами — **ординарный DRY-рефакторинг**, не про metadata.
- **Рекомендация:** **Step 3.1** (или отдельный micro-PR после Step 3), чтобы не смешивать «контракт JSON» и «тип исключения» в одном ревью.

---

## 7. Риски

- **Семантика `groups`:** ссылка на тот же список, что мутируется в цикле; при копировании в builder ошибочно сделать shallow copy не там — webhook потеряет `calculated_*`.
- **Порядок операций:** `next_invoice_identifiers()` и `atomic` create должны остаться атомарными относительно бизнес-правил счётчика (уже оформлено в `invoice_numbers.py`).
- **Регресс формата строк:** смена `str(total_delivery)` vs `"0.00"` для нулевой доставки может затронуть сравнения в тестах и `prepare_invoice_data`; выравнивать только если явно зафиксирован текущий формат в тестах.
- **Двойной источник правды:** provider metadata (Stripe `invoice_number`) и `invoice_data` должны по-прежнему получать одно и то же значение из одного вызова `next_invoice_identifiers()`.

---

## 8. Порядок проверки после реализации (когда код будет меняться)

1. `pytest backend/payment/tests.py backend/payment/test_checkout_flow.py` (и полный payment scope по CI).
2. Ручная смок-проверка: создание Stripe и PayPal сессии, успешный webhook в sandbox (metadata находится, заказы создаются).
3. Убедиться, что thank-you / conversion для обоих провайдеров не требует изменений (ключи кэша как раньше).

---

## 9. Рекомендуемый execution prompt для Step 3 (для агента/разработчика)

Вставьте в задачу исполнителю:

```text
Реализуй Step 3 Task 003: вынеси сборку custom_data / invoice_data / description_data и атомарное сохранение StripeMetadata / PayPalMetadata в payment/services/checkout_metadata.py.

Требования:
- Поведение и ключи JSON идентичны текущим stripe_session.py и paypal_session.py (см. step-3-metadata-plan.md).
- Не менять webhook, views (кроме импортов при необходимости), models, API ответы, stripe_checkout/paypal_checkout контракты.
- save_*_metadata_atomic оборачивают objects.create в transaction.atomic() как сейчас.
- Обнови/добавь unit-тесты: symmetry Stripe/PayPal metadata keys; custom_data включает first_name и last_name.

Не делай в этом PR: вынесение _check_cz_origin, удаление variable_symbol из dataclass, изменение prepare_invoice_data для variable_symbol в PDF.
```

---

## 10. Commit message (для будущего PR)

```text
refactor(payment): isolate checkout metadata builders and atomic saves
```

---

## Краткое резюме

Сегодня три JSON-блока и `*Metadata.objects.create` **полностью дублируются** в `stripe_session.py` и `paypal_session.py`; структуры **совпадают**. Критичные для webhook и пост-обработки ключи: `user_id`, `groups`+`calculated_*`, `invoice_number`, `variable_symbol`, `gross_total`, `delivery_total`, плюс провайдер-специфичная привязка `session_key`. Целевой модуль `checkout_metadata.py` должен инкапсулировать сборку и `atomic` save, не изменяя замороженный контракт. Вынесение `_check_cz_origin` и очистка `variable_symbol` из context — **отложить в Step 3.1**.
