# 06. Integrations

## Платёжные системы

**Полное описание архитектуры, последовательности вызовов, идемпотентности и troubleshooting:** [**Payment flow**](payment-flow.md).

Краткая справка по переменным и провайдерам:

### Stripe

| Параметр | Описание |
|----------|----------|
| Env-переменные | `STRIPE_API_SECRET_KEY`, `STRIPE_API_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_ENDPOINT_SECRET` |
| Режим | Задаётся ключами в Stripe Dashboard (test / live) |
| Checkout | `POST /api/create-stripe-payment/` |
| Webhook | `POST /api/stripe-webhook/` — см. [payment-flow.md](payment-flow.md) |

---

### PayPal

| Параметр | Описание |
|----------|----------|
| Env-переменные | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MODE` |
| API URL | при `PAYPAL_MODE=live` — `https://api-m.paypal.com`, иначе sandbox |
| Checkout | `POST /api/create-paypal-payment/` |
| Webhook | `POST /api/paypal-webhook/` — см. [payment-flow.md](payment-flow.md) |

---

## Службы доставки

### Packeta (Zásilkovna)

| Параметр | Описание |
|----------|----------|
| Env-переменная | `PACKETA_API_KEY` |
| Протокол | TODO: REST / SOAP (zeep?) |

> TODO: Описать создание отправления, получение трекинга.

---

### MyGLS

| Параметр | Описание |
|----------|----------|
| Env-переменная | `MYGLS_USERNAME`, `MYGLS_PASSWORD` |

> TODO

---

### DPD

| Параметр | Описание |
|----------|----------|
| Env-переменная | `DPD_TOKEN` |

> TODO

---

## Медиа

### Cloudinary

| Параметр | Описание |
|----------|----------|
| Env-переменная | `CLOUDINARY_URL` или `CLOUDINARY_CLOUD_NAME` + `API_KEY` + `API_SECRET` |
| Используется для | Изображения товаров, аватары пользователей |

> TODO: Описать политику папок, трансформации изображений.

---

## Аутентификация через OAuth

### Google

- Провайдер: `allauth.socialaccount.providers.google`
- Env-переменная: `clientID`, `clientSecret`
- TODO: Описать callback URL, настройку в Google Console.

### Facebook

- Провайдер: `allauth.socialaccount.providers.facebook`
- TODO

---

## Email

| Параметр | Описание |
|----------|----------|
| `EMAIL_TIMEOUT` | из env, default 10s |
| Backend | TODO: SMTP / SendGrid / другое? |

> TODO: Описать используемые email-уведомления (регистрация, заказ, сброс пароля).

---

## Telegram

> TODO: В коде упоминается `tg message` (коммит `edit tg message`). Описать назначение и конфигурацию.
