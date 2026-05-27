# Task 003 — Step 3.1: Cleanup после Metadata isolation (план)

**Режим:** только анализ и план. Код не менять в рамках этого документа.

**Контекст:** Step 3 вынес сборку metadata в `payment/services/checkout_metadata.py`. В `stripe_session.py` и `paypal_session.py` остались дубли `_check_cz_origin`, в dataclass контекстах — поле `variable_symbol`, не используемое во views; в `payment/views.py` накопились импорты и символы после выноса checkout-логики в сервисы.

---

## 1. Вынести `_check_cz_origin` в `checkout_shared.py`

### 1.1 Текущее состояние

- Идентичная логика (SKU → `variant_map` → проверка `default_warehouse.country == "CZ"`) в:
  - `backend/payment/services/stripe_session.py` — локальная `_check_cz_origin`, исключения `StripeSessionBuildError`
  - `backend/payment/services/paypal_session.py` — локальная `_check_cz_origin`, исключения `PayPalSessionBuildError`
- Тексты тел `{"error": ...}` и `{"origin": [...]}` **должны остаться побайтно теми же**, иначе меняется контракт 400-ответов API create-session.

### 1.2 Точные изменения (на этапе реализации)

| № | Файл | Действие |
|---|------|----------|
| 1 | `payment/services/checkout_shared.py` | Добавить функцию, например `check_cz_origin_for_checkout(variant_map, groups, *, error_cls)`, где `error_cls` — класс исключения с конструктором `__init__(self, detail: dict, http_status: int = 400)` как у `CheckoutSessionBuildError`. Внутри: та же логика, что сейчас в двух файлах; при missing SKU → `raise error_cls({"error": ...})`, при non-CZ → `raise error_cls({"origin": [...]})`. |
| 2 | `payment/services/stripe_session.py` | Удалить локальный `_check_cz_origin`; вызов заменить на `check_cz_origin_for_checkout(..., error_cls=StripeSessionBuildError)`. |
| 3 | `payment/services/paypal_session.py` | Аналогично с `error_cls=PayPalSessionBuildError`. |

### 1.3 Почему нельзя просто `raise CheckoutSessionBuildError`

Подклассы `StripeSessionBuildError` / `PayPalSessionBuildError` перехватываются во views как `except StripeSessionBuildError` / `except PayPalSessionBuildError`. Исключение **базового** типа `CheckoutSessionBuildError` этими `except` не ловится. Поэтому общий хелпер обязан поднимать **конкретный** класс через параметр `error_cls` (или эквивалент фабрики).

### 1.4 Риски

- **Регресс сообщений об ошибках:** опечатка в строке → изменение API (тесты на substring должны сохраниться).
- **Импорт-циклы:** `checkout_shared` не должен импортировать `stripe_session` / `paypal_session`; только передаваемый `error_cls` извне.

### 1.5 Что не трогать в этом шаге

- `payment/views.py`: функция `_check_cz_origin_for_groups` (возвращает `Response`, не исключение) — **отдельное решение** (см. раздел 4). На неё Step 3.1 не обязан мигрировать без явной задачи.

---

## 2. Убирать ли `variable_symbol` из `StripeCheckoutContext` / `PayPalCheckoutContext`

### 2.1 Факты

- `CreateStripePaymentView` / `CreatePayPalPaymentView` используют из контекста: `line_items`, `session_key`, `invoice_number`, PayPal ещё `gross_total`. **`ctx.variable_symbol` во views не читается.**
- Значение по-прежнему попадает в БД через `build_checkout_description_data` / `save_*_metadata_atomic`.
- Потребители dataclass сегодня: конструкторы в `stripe_session.py` / `paypal_session.py`, тесты (`payment/tests.py`: `test_returns_context_with_expected_fields`, `_make_ctx` с keyword-args), публичный реэкспорт в `payment/services/__init__.py`.

### 2.2 Стоит ли убирать

| Вариант | Плюсы | Минусы |
|---------|--------|--------|
| **Оставить** | Нет правок публичного типа; удобно при отладке/логах; ноль риска для внешних потребителей пакета. | «Шум» в dataclass; поле дублирует то, что уже в metadata. |
| **Убрать** | Узкий контракт контекста = только то, что нужно HTTP-слою. | Обновить `stripe_session`/`paypal_session` return, `payment/services/__init__.py` не обязателен к правке полей, но **все** места сборки `PayPalCheckoutContext`/`StripeCheckoutContext` и тесты; проверить внешний импорт `from payment.services import PayPalCheckoutContext` (позиционные аргументы сломаются). |

### 2.3 Рекомендация

- **По умолчанию оставить поле** в Step 3.1, если нет явной цели сузить публичный API сервисов.
- Если убирать — делать **отдельным маленьким PR** после grep по репозиторию на `StripeCheckoutContext` / `PayPalCheckoutContext` / `variable_symbol`; обновить тесты и при необходимости `step-2-paypal-plan.md` (описание полей контекста).

### 2.4 Что не трогать

- JSON metadata и ключ `variable_symbol` в `description_data`.
- Webhook и `Invoice.variable_symbol`.

---

## 3. Dead imports и мёртвый код в `payment/views.py`

### 3.1 Метод проверки (обязателен перед удалением)

1. В каталоге `backend`: `ruff check payment/views.py --select F401,F841` (или `pyflakes payment/views.py`), если в проекте принят ruff/pyflakes.
2. Ручной grep по каждому импортируемому имени в теле файла (исключая строки документации и schema).
3. Прогон тестов: `python manage.py test payment` и при наличии — `pytest payment/`.

### 3.2 Кандидаты на «только импорт, нет использования в теле» (по состоянию на анализ после выноса сессий)

**Высокая вероятность избыточности** (проверить инструментом):

- `uuid`
- `django.db.transaction`
- `order.services.invoice_data.prepare_invoice_data`
- `order.services.invoice_generator.generate_invoice_pdf`
- `order.services.invoice_numbers.next_invoice_identifiers`
- `delivery.utils_async.async_parcels_and_seller_email`
- `accounts.models.CustomUser`
- `product.models.BaseProduct`, `ProductVariant`
- `warehouses.models.Warehouse`, `WarehouseItem`
- `order.models`: `Order`, `DeliveryType`, `OrderProduct`, `OrderStatus`, `ProductStatus`, `Invoice` — если grep не находит использований кроме импорта
- Блок доставки/валидации, если **никакой** символ из них не встречается вне строки `import`:  
  `calculate_order_shipping_dpd`, `calculate_gls_shipping_options`, `split_items_into_parcels_gls`, `resolve_country_from_local_pickup_point`, `split_items_into_parcels`, `combine_parcel_options`, `calculate_order_shipping`, `validate_phone_matches_country`, `uppercase_zip`, `ZipCodeValidator`

**Остаются нужными** (пример): `PromoCode`, `timezone`, `CourierService`, `_get_courier_code`, `resolve_country_code_from_group`, `OrderEvent`, `create_order_event`, `WebhookPaymentData`, сериализаторы views, Stripe/PayPal webhook и т.д. — перепроверить по факту.

### 3.3 Мёртвые определения (отдельно от импортов)

| Символ | Наблюдение |
|--------|------------|
| `_check_cz_origin_for_groups` | В репозитории есть только определение в `views.py`, **нет вызовов**. Логика дублирует сервисный CZ-check (через исключение). |
| `PaymentSessionValidator` | Класс не используется в коде (упоминается в docs). |

**Удаление** этих блоков меняет размер `views.py` и может потребовать правок `docs/08-testing-strategy.md`, `docs/03-backend-architecture.md`, `docs/tasks/003-payment-refactor/plan.md` — вынести в подшаг или отдельную задачу «документация + dead code», чтобы не смешивать с `_check_cz_origin` в сервисах.

### 3.4 Риски

- Ложное срабатывание: имя используется динамически или в закомментированном куске — только полный прогон тестов и линтера снимает сомнения.
- Удаление `PaymentSessionValidator` без обновления документации → расхождение с описанием архитектуры.

### 3.5 Что не трогать без отдельного решения

- Поведение любых **описанных в OpenAPI** view (только удаление неиспользуемых импортов и явно не вызываемого кода после проверки).
- Webhook views и вызовы `create_orders_and_payment`.

---

## 4. Тесты, которые должны пройти

После реализации пункта 1 (`_check_cz_origin`):

- `python manage.py test payment.tests` (включая `TestBuildStripeCheckoutContext`, `TestBuildPayPalCheckoutContext`, тесты `test_cz_origin_not_cz_raises` и сценарии с missing SKU).
- `pytest payment/tests.py` / полный `payment/`, как принято в CI.
- При наличии интеграционных: `payment/test_checkout_flow.py` (create Stripe session и metadata).

После правок только импортов в `views.py`:

- Минимум: `manage.py test payment` + любые тесты, которые импортируют `payment.views`.

После удаления `variable_symbol` из контекста (если выполняется):

- Обновить и прогнать тесты, конструирующие `PayPalCheckoutContext` / `StripeCheckoutContext`.

---

## 5. Жёсткие ограничения (не нарушать)

- Не менять webhook-обработчики и `webhook_processing.py` (кроме косвенного эффекта от неизменных сообщений ошибок).
- Не менять order lifecycle, модели, миграции, публичные JSON/API ответы create-session.
- Не менять ключи metadata и поведение `checkout_metadata`.

---

## 6. Порядок работ (рекомендуемый)

1. **P0:** Общий `_check_cz_origin` в `checkout_shared.py` + вызовы из `stripe_session` / `paypal_session` + прогон тестов payment.
2. **P1:** Запуск линтера на неиспользуемые импорты в `views.py`; удалить только подтверждённо мёртвые импорты (маленький diff).
3. **P2 (опционально):** Решение по `variable_symbol` в dataclass; при «убрать» — отдельный коммит.
4. **P3 (опционально):** Удаление `_check_cz_origin_for_groups`, `PaymentSessionValidator` + синхронизация docs — отдельная задача.

---

## 7. Риски сводно

| Риск | Митигация |
|------|-----------|
| Изменение текста 400 при CZ/SKU | Скопировать тела ответов дословно; сохранить существующие assert в тестах. |
| Непойманное исключение из shared-хелпера | Передавать `error_cls` подкласса, а не базового `CheckoutSessionBuildError`. |
| Удаление «лишнего» импорта в views | Линтер + полный test suite payment. |
| Расхождение с docs при удалении validator | Обновить docs в той же задаче или не удалять в Step 3.1. |

---

## 8. Commit message (для реализации пункта 1)

```
refactor(payment): share CZ-origin check across Stripe/PayPal checkout builders
```

Для импортов-only в `views.py`:

```
chore(payment): drop unused imports in payment.views
```

---

## Краткое резюме

Step 3.1 безопасно начинается с **одной общей функции CZ-origin** в `checkout_shared.py` с параметром класса исключения. **`variable_symbol` в контексте** — по желанию удалять отдельно; **views.py** — сначала автоматическая проверка F401, затем точечное удаление; функции `_check_cz_origin_for_groups` и класс `PaymentSessionValidator` помечены как неиспользуемые в коде, но затрагивают документацию — выносить в отдельный шаг при необходимости.
