# Task 006 — Security Hardening

**Priority:** P0/P1  
**Complexity:** Medium  
**Status:** In Progress (официальный план SEC-1 — [`docs/security-incident-response.md`](../../security-incident-response.md); выполнение rewrite/ротации — ops)

## Цель

Устранить критические security-риски: секреты в git-истории, PII в исходниках, Google OAuth clientId в коде, добавить базовые защитные меры (rate limiting, env variables для frontend).

## Контекст

Аудит безопасности выявил:
- **SEC-1 (P0):** TLS-ключ, пароли БД, токены были зафиксированы в git-коммитах — история не очищена
- **SEC-2 (P0):** Реальные PII (имя, email, телефон, адрес покупателя + Stripe session_id) в `Frontend/Frontend3/src/code/test.js`
- **SEC-3 (P1):** Google OAuth `clientId` захардкожен в `src/main.jsx`
- **SEC-4 (P1):** Dev endpoints delivery в production → вынесены в Task 005
- **SEC-5 (P2):** JWT в `localStorage` (уязвим к XSS) — частично смягчается **базовым CSP в nginx** (не замена httpOnly)
- **SEC-6 (P2):** Rate limiting на OTP **send/resend** — реализовано (см. [аудит OTP throttling](#audit-otp-throttling-drf-mvp)); прочие auth/OTP **verify** без отдельного scope-throttle

## Scope (область)

- Инструкция по очистке git-истории и ротации credentials — **[`docs/security-incident-response.md`](../../security-incident-response.md)** (Phase 0–5, чеклист ротации)
- Удаление `Frontend/Frontend3/src/code/test.js`
- Вынос Google OAuth clientId в `VITE_GOOGLE_CLIENT_ID`
- Добавление DRF throttling для auth/OTP endpoints
- Создание `.env.example` для Frontend3
- Добавление базового CSP заголовка через nginx (краткосрочная защита от XSS)

## Не входит в задачу

- Полный переход JWT → httpOnly cookie (требует крупных изменений auth flow)
- Изменение структуры auth API
- Реализация WAF

## Зависимости

- Нет технических зависимостей — SEC-1 и SEC-2 должны быть выполнены НЕМЕДЛЕННО

## Риски

- `git filter-repo` + force push требует координации со всей командой (все должны сделать fresh clone)
- Ротация credentials (Stripe, DB, Google OAuth) требует согласования с ops
- DRF throttling может ограничить легитимных пользователей при неправильной настройке
- **CSP MVP:** ложные срабатыванности в консоли/сломанные виджеты при узком whitelist; `unsafe-inline`/`unsafe-eval` слабее строгой политики — план ужесточения см. [аудит nginx](#audit-nginx-csp-baseline-mvp)

## Definition of Done

- [x] `Frontend/Frontend3/src/code/test.js` удалён
- [x] Git / SEC-1: **план** очистки истории и ротации задокументирован — [`docs/security-incident-response.md`](../../security-incident-response.md). **Фактический** history rewrite, `force push` и ротация credentials в production — **pending ops execution** (см. документ и чеклист ниже Iteration 3).
- [x] Google clientId читается из `VITE_GOOGLE_CLIENT_ID`
- [x] `Frontend/Frontend3/.env.example` создан
- [x] DRF throttling настроен: глобальные anon/user лимиты + узкий **`otp`** (5/min) на эндпоинтах выдачи OTP (см. [аудит](#audit-otp-throttling-drf-mvp))
- [x] Базовый **Content-Security-Policy** и вспомогательные security headers в **nginx** — `Frontend/nginx/default.conf` (см. [аудит nginx CSP](#audit-nginx-csp-baseline-mvp))
- [ ] Все ротированные credentials обновлены в production

---

# Iterations

## Iteration 1 — Analysis

### Цель
Полная инвентаризация секретов и PII в репозитории.

### Действия
- Найти все захардкоженные значения похожие на credentials через git history
- Найти все `localStorage`, `STRIPE_`, `GOOGLE_CLIENT`, `PAYPAL_`, `DPD_` в исходниках
- Найти все `console.log` в Frontend3 (возможная утечка токенов)
- Прочитать `Frontend/Frontend3/src/code/test.js`
- Проверить `envs/backend.env.example` — все ли переменные задокументированы

### Output
- Полный список файлов с секретами/PII
- Список credentials для ротации
- Список переменных для `VITE_*.env`

### Статус
- [ ] Inventory complete

---

## Iteration 2 — Immediate Fixes (без git-истории)

### Цель
Устранить секреты из HEAD и добавить защитные меры.

### Что менять

**Немедленно: удалить PII файл:**
```bash
# В рамках git workflow — вынести в отдельный PR
git rm Frontend/Frontend3/src/code/test.js
```

**Frontend Google OAuth:**
```jsx
// ДО: main.jsx
<GoogleOAuthProvider clientId="123456789-abc.apps.googleusercontent.com">

// ПОСЛЕ:
<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
```

**`Frontend/Frontend3/.env.example`** (новый файл):
```env
VITE_API_URL=https://reli.one/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**`Frontend/Frontend3/.gitignore`** (проверить/добавить):
```
.env
.env.local
.env.production
```

**DRF throttling (`backend/backend/settings.py`):**
```python
REST_FRAMEWORK = {
    # Добавить к существующим настройкам:
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "otp": "5/minute",
    },
}
```

**Для OTP endpoints (`accounts/views.py`):**
```python
from rest_framework.throttling import AnonRateThrottle

class OTPRateThrottle(AnonRateThrottle):
    scope = "otp"

class OTPResendView(APIView):
    throttle_classes = [OTPRateThrottle]
    ...
```

### Затрагиваемые файлы
| Файл | Изменение |
|------|-----------|
| `Frontend/Frontend3/src/code/test.js` | Удалить |
| `Frontend/Frontend3/src/main.jsx` | env variable |
| `Frontend/Frontend3/.env.example` | Новый |
| `backend/backend/settings.py` | DRF throttling |
| `backend/accounts/views.py` | OTPRateThrottle |
| `Frontend/nginx/default.conf` | CSP (MVP) + `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` |
| `envs/backend.env.example` | Проверить полноту |

### Статус
- [x] test.js deleted — подтверждено в коде, файл удалён
- [x] Google clientId in env — `import.meta.env.VITE_GOOGLE_CLIENT_ID` в main.jsx
- [x] .env.example created — `Frontend/Frontend3/.env.example` с VITE_API_URL, VITE_GOOGLE_CLIENT_ID, VITE_SENTRY_DSN
- [x] DRF throttling configured — `DEFAULT_THROTTLE_CLASSES` / `DEFAULT_THROTTLE_RATES` в `backend/settings.py`; `OTPRateThrottle` (`scope=otp`) на `SendOTPForEmailVerificationAPIView`, `SendOTPForPasswordResetAPIView` (`accounts/views.py`)
- [x] **Nginx CSP (MVP)** — `Frontend/nginx/default.conf`: оба HTTPS `server` (`reli.one`, `info.reli.one`); см. [аудит](#audit-nginx-csp-baseline-mvp)

<a id="audit-otp-throttling-drf-mvp"></a>

### Audit: OTP throttling (DRF, MVP)

**Глобально (`REST_FRAMEWORK`):** анонимные запросы — `100/hour`, аутентифицированные — `1000/hour` (остальные DRF views с дефолтными throttle-классами).

**Узкий лимит `otp` (5/minute), только выдача/ресенд кода (AnonRateThrottle по IP):**

| Метод | Path (prefix `api/accounts/`) | View |
|-------|-------------------------------|------|
| POST | `email/otp/resend/` | `SendOTPForEmailVerificationAPIView` |
| POST | `password/reset/otp/send/` | `SendOTPForPasswordResetAPIView` |

**Без отдельного OTP-throttle** (проверка кода, не генерация): `email/confirmation/`, `check-otp-password-reset/`, `password/reset/confirmation/`.

OTP по сигналу при регистрации не затрагивается (не HTTP).

**Аудит 2026-05-13:** Реализовано по коду выше.

<a id="audit-nginx-csp-baseline-mvp"></a>

### Audit: nginx CSP baseline (MVP)

**Файл:** `Frontend/nginx/default.conf` (в репозитории найдена эта конфигурация; отдельных `docker/nginx/` / `infra/` nginx snippets нет).

**Где:** блоки `server { server_name reli.one; ... }` и `server { server_name info.reli.one; ... }`, сразу после существующего `Strict-Transport-Security` (дубликатов HSTS не добавлялось).

**Добавленные заголовки (`add_header ... always`):**

| Header | Значение (смысл) |
|--------|------------------|
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Content-Security-Policy` | MVP-политика одной строкой: `default-src 'self'`; `script-src` с `'unsafe-inline'` `'unsafe-eval'` + Google / Facebook SDK / Stripe / Packeta widget; `style-src` + Google Fonts; широкие `img-src` (`https:`); `connect-src` — self, reli hosts, Google APIs, Facebook Graph, Stripe/PayPal/Sentry; `frame-src` — OAuth, Stripe, Facebook, DPD/GLS/Packeta виджеты; `media-src` для внешних видео; `object-src 'none'`; `base-uri` / `frame-ancestors` `'self'`. |

**Риски / TODO:**

- MVP допускает **`'unsafe-inline'`** и **`'unsafe-eval'`** ради Vite/React; после аудита production-бандла и отказа от inline — **ужесточить** `script-src`/`style-src`.
- Новые внешние домены (например Cloudinary, доп. PSP) могут потребовать расширения `connect-src` / `img-src` / `frame-src` — проверять в браузерной консоли при деплое.
- **JWT в `localStorage` CSP не лечит** — это лишь дополнительный слой; целевое решение — httpOnly (вне scope 006).

**Проверка после выката на прод:**

```bash
curl -sI https://reli.one | grep -i content-security-policy
curl -sI https://info.reli.one | grep -i content-security-policy
```

**Аудит:** nginx-конфиг обновлён в репозитории; факт наличия заголовков на живом контуре подтверждает ops после deploy.

---

## Iteration 3 — Git History Cleanup Plan

### Цель
Зафиксировать процесс очистки git-истории и ротации credentials в **отдельном каноническом документе**.

**Канонический план (Phase 0–5), инвентаризация, команды `filter-repo`, валидация и таблица ротации:** **[`docs/security-incident-response.md`](../../security-incident-response.md)**.

Краткая процедура ниже — **ссылка для удобства**; при расхождении приоритет у `security-incident-response.md`.

### Процедура (сводка)

```bash
# См. Phase 3 в ../../security-incident-response.md — работа из mirror, единый вызов:
# git filter-repo --force --invert-paths --path ... (несколько --path)
# Затем force push только после backup + freeze + уведомления команды.
```

### Credentials для ротации после очистки

Детальный чеклист с колонками Owner / Rotated at / Verified — в **[документе инцидента](../../security-incident-response.md#3-credentials-rotation-checklist)**. Кратко:

- [ ] PostgreSQL password
- [ ] Stripe Secret Key (test + production)
- [ ] Stripe Webhook Secret
- [ ] PayPal Client Secret
- [ ] Google OAuth Client Secret
- [ ] SMTP пароль
- [ ] DPD API credentials
- [ ] Packeta API key
- [ ] GLS credentials

### Создать `docs/security-incident-response.md`

- [x] Документ создан; описание инцидента, фазы 0–5, проверки, таблица ротации.

### Статус

- [x] **Plan documented** — [`docs/security-incident-response.md`](../../security-incident-response.md) (Step 4 Task 006)
- [ ] Team notified
- [ ] History cleaned (координация с ops; выполнение **вне** репозитория-документации)
- [ ] All credentials rotated (пункт DoD «production» — отдельно; не закрывать без ops)

**Audit Step 4 (2026-05-13):** Формальный incident response и план `git filter-repo` вынесены в `docs/security-incident-response.md`. SEC-1 остаётся **открытым по факту** до rewrite + ротации; документационная часть «план зафиксирован» закрыта.

**Аудит 2026-05-05 (исторический):** ранее SEC-1 был открытым; состояние выполнения ops см. актуальный чеклист в `security-incident-response.md`.

---

## Iteration 4 — Validation

### Тесты для запуска
```bash
cd backend && python manage.py check
pytest accounts/ -v
pytest accounts/ -k OTPThrottle -v
```

### Автоматические тесты throttling (OTP)

| Тест | Endpoint |
|------|----------|
| `OTPThrottleTests.test_email_otp_resend_fifth_allowed_sixth_returns_429` | `POST /api/accounts/email/otp/resend/` |
| `OTPThrottleTests.test_password_reset_otp_send_fifth_allowed_sixth_returns_429` | `POST /api/accounts/password/reset/otp/send/` |

Реализация: `accounts/tests.py`; `create_and_send_otp` замокан; перед каждым тестом `cache.clear()` (полная подмена `CACHES` в тесте **не** используется — в `settings` есть алиас `conv` для payment, иначе падает импорт urlconf).

### Сценарии для проверки
- [x] 6 запросов к `POST /api/accounts/email/otp/resend/` с одного IP за минуту → **429** на 6-м (scope `otp`, 5/min) — покрыто `OTPThrottleTests.test_email_otp_resend_fifth_allowed_sixth_returns_429`
- [x] Аналогично `POST /api/accounts/password/reset/otp/send/` — `OTPThrottleTests.test_password_reset_otp_send_fifth_allowed_sixth_returns_429`
- [ ] `src/code/test.js` → 404 (удалён)
- [ ] `VITE_GOOGLE_CLIENT_ID` не undefined в production build
- [ ] git log не содержит секретов (после cleanup)

### Что должно работать
- Все auth flows работают с throttling
- Google login работает с env-based clientId

### Статус
- [ ] Validation complete (прочие пункты чеклиста: test.js, Google env, git history)

**Аудит 2026-05-13:** Throttling в коде включён. **2026-05-13 (step 2):** добавлены авто-тесты OTP throttling — `OTPThrottleTests` в `accounts/tests.py` (2 теста); `pytest accounts/` — 10 passed.

---

## Привязка к коду

| Тип | Файлы |
|-----|-------|
| **Frontend** | `src/main.jsx`, `src/code/test.js` (удалить), `.env.example` |
| **Backend** | `backend/settings.py`, `accounts/views.py` |
| **Env** | `envs/backend.env.example` |
| **Инфраструктура** | git history; **`Frontend/nginx/default.conf`** (CSP для prod) |
| **Документация SEC-1** | [`docs/security-incident-response.md`](../../security-incident-response.md) |
| **Интеграции** | Google OAuth, Stripe, PayPal, DPD, Packeta |

## Связанные проблемы из docs/09-architecture-debt.md

- SEC-1: Секреты в git-истории P0
- SEC-2: PII в test.js P0
- SEC-3: Google OAuth clientId захардкожен P1
- SEC-4: Dev-эндпоинты в prod P1 → Task 005
- SEC-5: JWT в localStorage P2
- SEC-6: Нет rate limiting P2
