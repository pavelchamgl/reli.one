# 06. Integrations

## Платёжные системы

### Stripe

| Параметр | Описание |
|----------|----------|
| Env-переменная | `STRIPE_API_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Режим | TODO: live / test |
| Webhook endpoint | TODO: `/api/…` |
| Используется для | TODO |

> TODO: Описать флоу создания PaymentIntent / Checkout Session.
> TODO: Описать обработку webhook-событий (payment_intent.succeeded, …).

---

### PayPal

| Параметр | Описание |
|----------|----------|
| Env-переменная | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` |
| Режим | `PAYPAL_MODE` (sandbox / live) |
| API URL | sandbox: `api-m.sandbox.paypal.com` / live: `api-m.paypal.com` |

> TODO: Описать флоу создания ордера PayPal.

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
