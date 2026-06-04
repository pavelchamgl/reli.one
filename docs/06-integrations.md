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

## Публичные реестры

### ARES CZ — seller onboarding assist

ARES используется только как вспомогательный публичный реестр для Czech seller onboarding assist.

| Параметр | Описание |
|----------|----------|
| Provider | `backend/sellers/providers/ares/` |
| API base | `ARES_API_BASE`, default `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest` |
| Endpoint | `GET /api/sellers/onboarding/company/ares-lookup/?ico=...` |
| Runtime use | Prefill/hint по Czech IČO; submit-time moderator hint для company и self-employed |
| Persistence | Только sanitized snapshot в `SellerAresVerification`; полный raw response не хранится |
| Moderation | Ручная: submit остаётся `pending_verification`; auto-approve в MVP отсутствует |

Lookup endpoint возвращает нормализованные поля для явного Apply: `company_name` / registry name, `business_id` / IČO, `legal_form` для company, registered address, `dic_hint`, `is_active` и warnings.

Self-employed MVP переиспользует этот stateless sanitized lookup endpoint на frontend: first-run assist modal и inline lookup показывают preview и применяют только пустые поля `ico`, `tax_country=cz`, `tin` из `dic_hint`, и primary self-employed address. Registry name остаётся preview-only и не заполняет personal identity fields.

ARES не заполняет и не подтверждает phone, bank account, representative identity, warehouse/return addresses или документы. DIČ из ARES не является VAT/DPH/VIES verification.

При submit backend повторно вызывает ARES по IČO/business ID и сохраняет результат как sanitized moderator hint:

- company: lookup по `company_info.business_id`, сравнение business ID, company name, legal form, registered address, active status;
- self-employed: lookup по `self_employed_tax.business_id`, сравнение business ID, registered/primary address, active status; registry/person name может отображаться как hint, но не используется как identity verification;
- `ARES_VERIFIED` audit event, если найденная активная запись совпадает по проверенным полям без warnings;
- `ARES_MISMATCH`, если есть расхождения, warnings, неактивная запись, not found/unavailable/error;
- при not found/unavailable/error submit не блокируется и заявка всё равно уходит на ручную модерацию.
- полный raw ARES response не хранится;
- ARES не является KYC или identity verification.

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
