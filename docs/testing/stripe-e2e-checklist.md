# Manual checklist: Stripe payment flow (локальный e2e-контур)

Пошаговая ручная проверка цепочки **Stripe Checkout → webhook → заказ / инвойс / почта** в Docker e2e. Предполагается знакомство с базовым контуром: [`e2e-local-contour.md`](./e2e-local-contour.md).

**Инструменты:** Postman (или аналог), браузер, Stripe **test mode**, Stripe CLI **или** ngrok + webhook в Dashboard.

**Важно:** всё ниже по чеклисту и зафиксированные прогоны относятся к **локальному e2e-контуру** (`docker-compose.e2e.yml`, test keys, Mailpit). Это **не** доказательство готовности или корректности **production**.

---

## Verification evidence — latest local smoke result

**Дата фиксации в документации:** 2026-05-11. Ниже зафиксирован **один успешный ручной smoke-прогон** (Postman → Stripe Checkout → webhook через публичный туннель), без секретов и без полных идентификаторов Stripe.

| Поле | Значение / наблюдение |
|------|------------------------|
| **Контур** | Локальный Docker e2e: `docker-compose.e2e.yml`; **Stripe test mode**; вход webhook на `POST /api/stripe-webhook/` через **ngrok** (или эквивалент); исходящая почта через **Mailpit** (письма не уходят наружу). |
| **create-stripe-payment** | HTTP **200**; получены `checkout_url`, `session_id` (формат `cs_test_…`, полное значение в репозиторий не копировать), `session_key`. |
| **Событие Stripe** | `checkout.session.completed` доставлено в endpoint **`/api/stripe-webhook/`**; в Stripe Dashboard у доставки указан ответ **200 OK**. |
| **Заказ** | В логах backend зафиксировано создание **Order** с id **75** (номер id относится к конкретному состоянию e2e-БД в момент прогона). |
| **Инвойс** | Создан **Invoice** с номером **20260000096** (серия/нумерация зависят от данных e2e окружения). |
| **Почта (Mailpit)** | Письмо **клиенту**, письмо **продавцу**, письмо **менеджерам** — все отображаются в Mailpit UI. |
| **Идемпотентность** | Повторная доставка / retry того же webhook обработаны как **идемпотентный replay**; повторных записей **Payment** / **Order** / **Invoice** не создано. |

Этот блок — **артефакт проверки процедуры**, а не контракт SLA. Для нового прогона обновите таблицу датой и фактическими id/номерами из **вашей** e2e БД.

---

## Webhook: негативные сценарии и HTTP (справочник)

Автопокрытие: `payment/tests.py` — `TestStripeWebhookService`, `TestStripeWebhookViewHttp`, `TestPayPalWebhookService`, `TestPayPalWebhookViewHttp`; интеграция happy-path/replay — `payment/test_checkout_flow.py`.

### Stripe (`POST /api/stripe-webhook/`)

| Сценарий | HTTP | Тело ответа | Retry Stripe |
|----------|------|-------------|--------------|
| Невалидная / отсутствующая подпись (`construct_event` → `SignatureVerificationError` или `ValueError`) | **400** | пустое | Stripe **повторит** 4xx (экспоненциальный backoff) |
| Тип события вне `checkout.session.completed` / `async_payment_succeeded` | **200** | пустое | Нет повторов как ошибки (успех для провайдера) |
| Нет `session_key` в `metadata` Checkout Session | **400** | `{"error": "Missing session_key"}` | Повтор того же payload малополезен без исправления данных |
| Нет строки `StripeMetadata` для `session_key` | **400** | `{"error": "Session metadata not found"}` | Аналогично |
| `create_orders_and_payment` → `None` (валидация / БД) | **500** | `{"error": "Order creation failed"}` | Stripe **будет ретраить** 5xx |
| Идемпотентный replay (платёж уже есть) | **200** | пустое | Уже обработано |

**Логи:** логгеры `payment`, `payment.services.stripe_webhook` пишут в `logs/payment.log` (не в `errors.log`, пока нет ERROR от root). В сообщениях об ошибке verify — только `%s` от исключения, **без** `whsec` и без сырого тела запроса.

**Follow-up:** если объект session в событии **битый** (нет `amount_total` и т.д.), `stripe_checkout_session_to_webhook_payment_data` может бросить `KeyError` → необработанный 500 Django — при необходимости обернуть и вернуть 400/500 с телом по политике; сейчас не менялось.

### PayPal (`POST /api/paypal-webhook/`)

| Сценарий | HTTP | Тело | Retry PayPal |
|----------|------|------|--------------|
| Невалидный JSON | **400** | `{"error": "Invalid JSON"}` | verify не вызывается |
| Неизвестный `event_type` | **200** | `{"status": "ignored"}` | Не ошибка |
| `verify_webhook` → false | **403** | `{"error": "Invalid webhook signature"}` | Обычно **не** transient; нужна корректная подпись / env |
| Ошибки разбора payload → `paypal_payload_to_webhook_payment_data` (early) | **400** / **500** | как в `early_body` | **500** (например capture fail) — провайдер может повторить |
| `create_orders_and_payment` → `None` | **500** | `{"error": "Order creation failed"}` | Retry возможен |
| Replay | **200** | `"0 order(s) created successfully"` при пустых orders | OK |

**Логи:** `payment.mixins` при **DEBUG** больше **не** логирует значение `paypal-transmission-sig` (только факт наличия). Токен PayPal в логи не пишется.

---

## Переменные окружения (плейсхолдеры, не копировать боевые ключи)

В `envs/backend.e2e.env` (локально, файл не в git) задайте как минимум:

| Переменная | Пример в документации | Назначение |
|------------|----------------------|------------|
| `STRIPE_API_SECRET_KEY` | `sk_test_xxx` | серверные вызовы Stripe API |
| `STRIPE_API_PUBLISHABLE_KEY` | `pk_test_xxx` | клиент Checkout (если нужен внешний фронт) |
| `STRIPE_WEBHOOK_ENDPOINT_SECRET` | `whsec_xxx` | верификация подписи webhook (должен совпадать с CLI или Dashboard endpoint) |

Ключи берутся из [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) (test mode). Секрет webhook — из вывода `stripe listen` или из настроек endpoint.

---

## Предусловия

- [ ] Запущен стек: `docker compose -f docker-compose.e2e.yml up --build`.
- [ ] Открываются: API `http://localhost:8000`, Swagger `http://localhost:8000/schema/swagger/`, Mailpit `http://localhost:8025`, Admin `http://localhost:8000/admin/`.
- [ ] В БД e2e есть валидные данные каталога (SKU, продавец, CZ-origin при необходимости) — тело `create-stripe-payment` должно соответствовать реальным правилам валидации (см. OpenAPI).
- [ ] Настроен приём webhook на `POST /api/stripe-webhook/`:
  - **Stripe CLI:** `stripe listen --forward-to http://localhost:8000/api/stripe-webhook/`
  - **ngrok:** публичный URL вида `https://<host>/api/stripe-webhook/` в Dashboard → Webhooks.
- [ ] `STRIPE_WEBHOOK_ENDPOINT_SECRET` в env совпадает с источником webhook; после правки `.env` выполнен **restart** сервиса `backend_e2e`.

---

## Postman-oriented flow (основной чеклист)

### 1. Регистрация и пользователь

- [ ] В Swagger найдите эндпоинты **accounts** для регистрации покупателя (или используйте уже существующего пользователя e2e-БД).
- [ ] **Expected result:** пользователь создан, ответ без ошибок валидации (конкретные коды и поля — по актуальной схеме API).

### 2. Получение JWT

- [ ] Выполните запрос **логина / выдачи токена** согласно Swagger (`token` / `jwt` — фактические пути в разделе **accounts**).
- [ ] Сохраните **`access`** (или эквивалент) для следующих шагов.
- [ ] **Expected result:** HTTP 200, в теле есть короткоживущий access token.

### 3. Создание Stripe Checkout session

- [ ] **Метод / URL:** `POST http://localhost:8000/api/create-stripe-payment/`
- [ ] **Заголовки:** `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- [ ] **Тело:** JSON по схеме из Swagger (тег **Stripe**, пример `SessionInputSerializer`). Скопируйте структуру из OpenAPI, подставьте реальные для e2e SKU и адрес доставки.
- [ ] **Expected result:** HTTP **200**, в теле есть минимум:
  - `checkout_url` — URL Stripe Checkout;
  - `session_id` — id сессии Stripe;
  - `session_key` — внутренний ключ для связи с метаданными.

Зафиксируйте `session_id` и при необходимости `session_key` для проверок в админке и БД.

### 4. Оплата в Stripe Checkout

- [ ] Откройте `checkout_url` в браузере.
- [ ] Завершите оплату **тестовой картой** Stripe (например `4242 4242 4242 4242`, срок и CVC по подсказкам Stripe).
- [ ] **Expected result:** Stripe показывает успешное завершение; в Stripe Dashboard (test) у сессии статус успешной оплаты.

### 5. Доставка webhook на backend

- [ ] При использовании **Stripe CLI:** в терминале CLI видно перехваченное событие и forward на локальный URL.
- [ ] При **ngrok + Dashboard:** событие уходит на ваш публичный URL; в Dashboard → Webhooks смотрите лог доставки (успех / повтор).
- [ ] **Expected result:** HTTP **200** от `POST /api/stripe-webhook/` (в логах CLI или в записи события Stripe).

### 6. Убедиться, что webhook обработан

- [ ] В логах контейнера нет traceback при обработке этого события.
- [ ] Повторный ответ API webhook — см. раздел [Idempotency check](#idempotency-check).
- [ ] **Expected result:** одна связка «сессия → платёж → заказ(ы)» без необработанных 500 в момент webhook.

### 7. Проверка сущностей и побочных эффектов

Используйте **Django Admin** и при необходимости SQL к `localhost:5434`.

| Проверка | Где смотреть | Expected result |
|----------|----------------|-----------------|
| **Payment** | Admin → `payment` | Запись с ожидаемым `session_id` / связь с оплатой; нет дубликата на ту же сессию после одного успешного webhook. |
| **Order** | Admin → `order` | Один или несколько заказов по продавцам, суммы и статусы согласованы с сессией. |
| **OrderProduct** | Инлайн у Order или отдельный список | Строки по товарам из payload сессии; цены/количества ожидаемы. |
| **Invoice** | Admin → `order` (Invoices) | При успешной генерации — запись, ссылка на Payment; PDF при наличии файла. |
| **DeliveryAddress** | Admin → `delivery` (если модель зарегистрирована) или через связь **Order** | При сценарии с доставкой — адрес, согласованный с телом `create-stripe-payment`. |
| **Метаданные доставки** | Поля заказа / связанные модели по факту домена | Сохранены режим доставки, перевозчик, PUDO и т.д., если были в запросе (сверить с OpenAPI и админкой). |
| **Mailpit** | `http://localhost:8025` | При включённой отправке письма после оплаты — письмо(а) появились, тема/получатель правдоподобны; письма не ушли наружу. |

Если письмо не пришло: проверьте, что фоновая задача не падает тихо, и что сценарий реально шлёт email в этом окружении.

---

## Expected result (краткое резюме happy path)

После одной успешной оплаты и одного успешного webhook:

1. Stripe Dashboard: сессия оплачена (test mode).
2. Backend: ответ webhook **200**, в `payment.log` нет необработанной ошибки по этой сессии.
3. БД: ровно **один** релевантный **Payment** на эту checkout-сессию; **Order(s)** и **OrderProduct** отражают корзину; при генерации — **Invoice**; доставка и адрес — в соответствии с данными чекаута.
4. Mailpit: ожидаемые нотификации отображаются (если сценарий их шлёт).

---

## Idempotency check

Цель: повтор той же обработки **не** создаёт второй платёж / заказ / инвойс.

- [ ] Зафиксируйте `id` **Payment**, количество **Order**, **Invoice** (и при необходимости `order_number`) **до** повтора.
- [ ] Повторите доставку того же события одним из способов:
  - в **Stripe Dashboard** → Webhooks → событие → **Resend** (если доступно);
  - или второй раз вызовите forward тем же телом только в отладочных целях (обычно удобнее Resend / CLI).
- [ ] **Expected result:**
  - HTTP ответ webhook по-прежнему **успешный** (часто **200** при уже обработанной сессии — см. описание в OpenAPI `StripeWebhookView`);
  - количество записей **Payment**, **Order**, **OrderProduct**, **Invoice** **не увеличилось**;
  - нет второго инвойса с тем же платежом.

---

## Логи

| Источник | Что проверить |
|----------|----------------|
| `backend/logs/payment.log` | Сообщения о создании сессии, обработке webhook; нет необработанных исключений по вашей `session_id`. |
| `backend/logs/errors.log` | Нет новых записей, связанных с этим прогоном (при успешном сценарии). |
| `docker compose -f docker-compose.e2e.yml logs backend_e2e` | Нет traceback при обработке webhook; при `DEBUG=True` возможен подробный вывод — отфильтровать по времени и `session_id`. |

---

## Негативный сценарий: неверная подпись webhook

- [ ] Временно установите в `envs/backend.e2e.env` заведомо неверное значение, например `STRIPE_WEBHOOK_ENDPOINT_SECRET=whsec_wrong_placeholder`.
- [ ] Перезапустите `backend_e2e`.
- [ ] Отправьте на `POST http://localhost:8000/api/stripe-webhook/` корректное по Stripe тело с заголовком `Stripe-Signature` от **другого** секрета (или используйте реальный forward — подпись перестанет сходиться).
- [ ] **Expected result:**
  - ответ с **ошибкой верификации** (типично **400** для неверной подписи / payload — без детализации секретов наружу);
  - **не** появилось новых **Order** / **Payment** / **Invoice** от этого запроса.
- [ ] Верните корректный `whsec_xxx`, перезапустите backend и повторите happy path.

---

## Troubleshooting

| Симптом | Возможная причина | Действие |
|--------|-------------------|----------|
| Checkout создаётся, после оплаты заказа нет | Webhook не доходит или секрет неверный | Проверить CLI/ngrok, `STRIPE_WEBHOOK_ENDPOINT_SECRET`, логи webhook в Stripe. |
| Webhook 400 signature | Секрет не от того endpoint / не перезапущен контейнер | Синхронизировать secret, `docker compose restart backend_e2e`. |
| create-stripe-payment 401 | Просрочен или неверный JWT | Обновить токен через login. |
| create-stripe-payment 4xx валидации | SKU, адрес, режим доставки не проходят бизнес-правила | Сверить тело с Swagger, данные каталога и склады (CZ-origin и т.д.). |
| Письма не в Mailpit | Неверный `EMAIL_HOST` вне контейнера / не тот env | В e2e в контейнере должен быть `mailpit:1025` (см. `e2e-local-contour.md`). |
| Дубли заказов после одного платежа | Редкий сценарий гонки или баг | Зафиксировать `session_id`, логи, состояние БД; идемпотентность должна удерживать дубликат — завести задачу. |

---

## Do not commit

- Не коммитьте реальные `sk_live_`, `sk_test_` с полным значением, `whsec_` из вашего аккаунта, дампы e2e-БД с заказами и PII.
- В репозитории оставляйте только шаблоны `*.env.example` и эту документацию с плейсхолдерами **`sk_test_xxx`**, **`whsec_xxx`**.

---

## См. также

- [`e2e-local-contour.md`](./e2e-local-contour.md) — запуск compose, Mailpit, postgres, ngrok.
- [`paypal-e2e-checklist.md`](./paypal-e2e-checklist.md) — ручной PayPal **sandbox** (Postman, ngrok webhook).
- [`docs/08-testing-strategy.md`](../08-testing-strategy.md) — стратегия тестов и P0 webhook / идемпотентность.
