# Manual checklist: PayPal sandbox flow (локальный e2e-контур)

Пошаговая ручная проверка цепочки **PayPal Checkout (sandbox) → webhook → заказ / инвойс / почта** в Docker e2e. Базовый контур: [`e2e-local-contour.md`](./e2e-local-contour.md). Аналог по структуре: [`stripe-e2e-checklist.md`](./stripe-e2e-checklist.md).

**Инструменты:** Postman (или аналог), браузер, аккаунты [PayPal Sandbox](https://developer.paypal.com/dashboard/), **ngrok** (или аналог) для публичного URL webhook.

**Важно:** сценарий относится к **локальному e2e** (`docker-compose.e2e.yml`, sandbox credentials, Mailpit). Это **не** production-приёмка и **не** артефакт боевого контура PayPal Live.

---

## Verification evidence — latest local smoke result

**Дата фиксации в документе:** 2026-05-12  
**Не production.** Контур: Docker **e2e**, **PayPal Sandbox**, вход webhook через **публичный туннель** (например ngrok) на `POST /api/paypal-webhook/`, почта через **Mailpit**.

| Поле | Наблюдение / результат |
|------|-------------------------|
| **`POST …/create-paypal-payment/`** | HTTP **200**; в ответе присутствуют **`approval_url`**, **`session_key`**, **`order_id`** PayPal Sandbox (полные значения интеграции в этот файл **не копировать** — только логировать локально или во внутреннем тикете). |
| **Sandbox buyer approval** | Оплата/одобрение в UI **PayPal Sandbox** завершены успешно (аккаунт sandbox-покупателя). |
| **Webhook-доставка** | Событие доставлено на **`POST /api/paypal-webhook/`**; backend ответил **200** после верификации подписи; в журнале PayPal Developer Dashboard для webhook (при наличии) отображается успешная доставка того же профиля, что использует приложение Sandbox. |
| **Payment** | Создана/обновлена запись платежа, согласованная с успешным сценарием (без публикации внешних id в этом разделе). |
| **Order** | После успешного webhook создан **минимум один** релевантный заказ (**Order**) в локальной БД e2e; точный **`id`** смотреть в Django Admin локально (**не** включается в документ по умолчанию из-за возможной связки с пользовательскими данными). |
| **Invoice** | Сформирован **ровно один** инвойс на успешный сценарий (дубликата на ту же успешную оплату при одном webhook **нет**); **номер** счёт-фактуры — только локально / во внутреннем трекере при необходимости. |
| **Mailpit** | Письмо получателю **клиенту**, продавцу и в список **менеджеров** (`PROJECT_MANAGERS_EMAILS`) отображаются в интерфейсе Mailpit (**8025**). |
| **Идемпотентность / replay** | Повторная доставка (retry / второй запрос тем же содержимым в контролируемых условиях) обработана как **идемпотентный replay** — **нет** второго набора записей Payment/Order/Invoice; количества сущностей не растёт. |

Этот блок — **локальный sandbox-evidence процедуры**. Числовые **Order id**, **номера инвоясов**, сырые **PayPal resource id** при политике команды добавляются **локально копией файла или внутренней wiki**, если требуют строгое соответствие аудит-трейсу; репозиторий хранит минимально достаточное описание без PII/secrets payload.

---

## Webhook: негативные сценарии и HTTP

Подробная матрица HTTP и ссылка на автотесты: [`stripe-e2e-checklist.md`](./stripe-e2e-checklist.md) (раздел **Webhook: негативные сценарии и HTTP**).

- PayPal: **403** при невалидной верификации подписи; **200** + `ignored` для неизвестных `event_type`.
- Ошибки **capture** / **api_get** в сервисе — см. `payment/services/paypal_webhook.py` и `TestPayPalWebhookService` (`payment/tests.py`).

---

## Verification evidence — шаблон следующего прогона

Чтобы сохранять детальный след при следующих прогонах, скопируйте таблицу в тикет или локальную копию; в git по умолчанию не ссылайтесь на полные строки платежной интеграции.

| Поле | Значение / наблюдение |
|------|------------------------|
| Дата прогона | |
| Контур | e2e + sandbox + ngrok URL (без секретов в query) |
| `POST …/create-paypal-payment/` | HTTP код |
| PayPal `order_id` / `session_key` | локально только |
| Webhook доставка | HTTP от backend; статус в PayPal Dashboard при наличии |
| Payment / Orders / Invoice | id / номер — по политике |
| Mailpit | customer / seller / managers — да/нет |
| Идемпотентность | повтор webhook — дублей нет |

---

## 1. Переменные окружения (плейсхолдеры)

В **`envs/backend.e2e.env`** (локально, не в git) задайте как минимум:

| Переменная | Пример в документации | Назначение |
|------------|----------------------|------------|
| `PAYPAL_MODE` | `sandbox` | Должен быть **sandbox** для ручного прогона по этому чеклисту. В `settings.py` при любом значении, кроме `live`, используется sandbox API. |
| `PAYPAL_CLIENT_ID` | client id из Sandbox app | REST API, создание заказа Checkout |
| `PAYPAL_CLIENT_SECRET` | secret из Sandbox app | Серверный секрет; **не** копировать в репозиторий |
| `PAYPAL_WEBHOOK_ID` | id webhook-подписки sandbox | Участвует в **`verify-webhook-signature`** (`payment/mixins.py`); должен совпадать с webhook, зарегистрированным для вашего публичного URL |

Креденшелы и webhook id: [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/) → ваше **Sandbox** приложение → **REST API apps** / **Webhooks**.

Также нужны рабочие ключи доставки/каталога для тела запроса (Packeta и т.д.), как в Stripe-чеклисте.

---

## 2. Запуск e2e

Из корня репозитория:

```bash
docker compose -f docker-compose.e2e.yml up --build
```

После правок `envs/backend.e2e.env` перезапустите **`backend_e2e`**, чтобы Django подхватил переменные:

```bash
docker compose -f docker-compose.e2e.yml restart backend_e2e
```

---

## 3. Postman-oriented flow

### 3.1 Логин и JWT

- [ ] Зарегистрируйте или используйте пользователя e2e-БД (см. Swagger, **accounts**).
- [ ] Выполните login / выдачу JWT.
- [ ] **Expected:** HTTP **200**, в теле есть `access` (или эквивалент).

### 3.2 Создание PayPal-сессии

- [ ] **Метод / URL:** `POST http://localhost:8000/api/create-paypal-payment/`
- [ ] **Заголовки:** `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- [ ] **Тело:** JSON по схеме OpenAPI (тег **PayPal**, `SessionInputSerializer` / примеры из `CreatePayPalPaymentView`).
- [ ] **Expected:** HTTP **200**, в теле минимум:
  - `approval_url` — переход в PayPal для одобрения;
  - `order_id` — идентификатор заказа PayPal;
  - `session_key` — внутренний ключ метаданных;
  - `session_id` — в проекте совпадает с `session_key` (см. ответ API).

Сохраните `order_id` и `session_key` для проверок в админке и логах.

### 3.3 Браузер: approval в sandbox

- [ ] Откройте `approval_url` в браузере.
- [ ] Войдите под **Sandbox Personal** (покупатель); при необходимости создайте тестового покупателя в Developer Dashboard → **Sandbox** → **Accounts**.
- [ ] Подтвердите оплату в UI PayPal до успешного состояния заказа/capture (как предлагает sandbox).
- [ ] **Примечание:** после оплаты браузер может перенаправить на **`REDIRECT_DOMAIN`** из `backend/backend/settings.py` (по умолчанию production-подобный URL). Для проверки полноты потока webhook и БД достаточно успешного платежа в sandbox; при необходимости полностью локального return URL потребуется отдельное изменение конфигурации (вынесение `REDIRECT_DOMAIN` в env — вне этого чеклиста).

---

## 4. Webhook PayPal

### 4.1 Публичный URL (ngrok)

- [ ] Запустите туннель на backend e2e:  
  `ngrok http 8000`  
  (или ваш аналог.)
- [ ] Скопируйте HTTPS-базу, например `https://abcd-12-34-56-78.ngrok-free.app`.

### 4.2 Endpoint в проекте

**Путь для подписки в PayPal:**

```text
POST https://<your-ngrok-host>/api/paypal-webhook/
```

Определено в `backend/payment/urls.py` (`paypal-webhook/` под префиксом `api/`).

### 4.3 Регистрация в PayPal Dashboard

- [ ] Developer Dashboard → ваше **Sandbox** приложение → **Webhooks** → Add webhook.
- [ ] URL — как в разделе выше.
- [ ] Типы событий: как минимум **`PAYMENT.CAPTURE.COMPLETED`**, **`CHECKOUT.ORDER.COMPLETED`**, **`CHECKOUT.ORDER.APPROVED`** (см. `PAYPAL_HANDLED_EVENT_TYPES` в `payment/services/paypal_webhook.py`).
- [ ] Сохраните подписку и скопируйте **Webhook ID** в `PAYPAL_WEBHOOK_ID` в `envs/backend.e2e.env`.
- [ ] Перезапустите **`backend_e2e`**.

### 4.4 Верификация подписи

Backend вызывает PayPal **`POST /v1/notifications/verify-webhook-signature`** с телом, включая **`webhook_id`** = `settings.PAYPAL_WEBHOOK_ID` и заголовки `paypal-transmission-id`, `paypal-transmission-sig` и др. (`payment/mixins.py`).

Если **403** `Invalid webhook signature` — чаще всего неверный **`PAYPAL_WEBHOOK_ID`** (другая подписка), несовпадение URL с зарегистрированным, или не тот режим sandbox/live.

---

## 5. Expected result (happy path)

После успешной оплаты в sandbox и доставки webhook:

1. **HTTP** от `POST /api/paypal-webhook/` — **200** (или осмысленный ответ для проигнорированного типа события по коду; при ошибке — см. логи).
2. **БД / Admin:**
   - создан или обновлён **Payment** с привязкой к сессии / PayPal order id;
   - **Order** (возможно несколько по продавцам);
   - **OrderProduct** со строками заказа;
   - **Invoice** — **одна** на связку с платежом (нет дубликата при одном событии).
3. **Mailpit** (`http://localhost:8025`): письма **клиенту**, **продавцу**, **менеджерам** (если сценарий и настройки их отправляют).

---

## 6. Idempotency

- [ ] Зафиксируйте counts / id **Payment**, **Order**, **Invoice** до повтора.
- [ ] Повторите доставку того же события (Simulate / повтор в Dashboard, тестовый повтор POST с тем же телом — только в контролируемой среде).
- [ ] **Expected:** ответ **успешный**; в логах возможна пометка идемпотентного replay (`[PayPalWebhook] Idempotent replay…`); **нет** второго комплекта заказов/инвойсов/дубликата **Payment** на ту же бизнес-сущность.

См. автотесты: `payment/test_checkout_flow.py` (`PayPalWebhookFlowTests`).

---

## 7. Troubleshooting

| Симптом | Возможная причина | Действие |
|--------|-------------------|----------|
| Webhook **403** Invalid signature | Неверный **`PAYPAL_WEBHOOK_ID`** или webhook создан для другого URL / приложения | Пересоздать webhook в sandbox, скопировать новый ID, `restart backend_e2e`. |
| Ошибки при создании заказа PayPal | Sandbox **Client ID/Secret** или приложение не sandbox | Проверить пары ключей в Dashboard, `PAYPAL_MODE=sandbox`. |
| 400/500 при обработке после verify | Битое JSON-тело, отсутствует metadata / session_key | Сверить payload с `paypal_webhook.py`, логи `payment.log`; убедиться, что create-payment сохранил метаданные до оплаты. |
| ngrok домен → **400/403** Django | `Host` не входит в **ALLOWED_HOSTS** | В e2e по шаблону уже `ALLOWED_HOSTS="*"`; при кастомном compose — расширить или использовать заголовки прокси по политике Django. |
| После approval нет заказов | Webhook не доходит на локальный backend | Проверить URL в PayPal, что ngrok запущен, события в журнале webhook PayPal, firewall. |
| Mailpit пустой | Неверный SMTP в контейнере | Как в [`e2e-local-contour.md`](./e2e-local-contour.md): `EMAIL_HOST=mailpit`, порт **1025**. |

---

## 8. Логи

| Источник | Что смотреть |
|----------|----------------|
| `backend/logs/payment.log` | Создание PayPal сессии, verify webhook, обработка событий |
| `backend/logs/errors.log` | Ошибки при прогоне |
| `docker compose -f docker-compose.e2e.yml logs -f backend_e2e` | Traceback, ответы webhook |

---

## Do not commit

- `PAYPAL_CLIENT_SECRET`, полный `PAYPAL_CLIENT_ID` из реального приложения (в git — только пустые поля в `*.env.example`).
- `PAYPAL_WEBHOOK_ID` из вашей среды.
- Дампы БД, экспорты заказов с PII, содержимое `backups/` (см. [`docs/operations/database-backup-restore.md`](../operations/database-backup-restore.md)).

---

## См. также

- [`e2e-local-contour.md`](./e2e-local-contour.md)
- [`stripe-e2e-checklist.md`](./stripe-e2e-checklist.md)
- [`docs/08-testing-strategy.md`](../08-testing-strategy.md)
- OpenAPI: `PayPalWebhookView`, `CreatePayPalPaymentView`
