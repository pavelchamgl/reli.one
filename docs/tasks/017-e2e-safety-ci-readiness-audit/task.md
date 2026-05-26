# Task 017 — E2E Safety & CI Readiness Audit

**Priority:** P1 (documentation / audit)  
**Complexity:** Low  
**Type:** Audit + documentation — без runtime-кода и без внедрения CI  
**Status:** **DONE (repo-scope documentation verification)** — safety audit PASS; production-risk при корректном деплое низкий; **CI proposal реализован в [Task 018](./018-full-stack-e2e-ci-implementation/task.md)** (`e2e_fullstack` job). External Stripe/PayPal sandbox acceptance — **manual/ops**, не утверждается git.

---

## Goal

Проверить безопасность test-only механизмов, появившихся после FS-003 (`ENABLE_E2E_ENDPOINTS`, `STRIPE_WEBHOOK_SKIP_SIGNATURE`, `/api/e2e/payment/*`), и определить готовность full-stack Playwright + Django e2e контура к CI.

Результат audit task — verdict по safety, CI readiness checklist и **proposal** CI job. **Реализация proposal** — **[Task 018](./018-full-stack-e2e-ci-implementation/task.md)** (не в scope Task 017).

---

## Context

После FS-001–FS-003 в репозитории появились:

| Механизм | Назначение |
|----------|------------|
| `ENABLE_E2E_ENDPOINTS` | Условная регистрация `/api/e2e/payment/*` |
| `STRIPE_WEBHOOK_SKIP_SIGNATURE` | Пропуск `stripe.Webhook.construct_event` в e2e |
| `backend/payment/e2e_views.py` | HTTP helpers для подготовки данных webhook-тестов |
| `envs/backend.e2e.env.example` | Явное включение e2e flags для локального контура |

Текущие CI jobs (`.github/workflows/ci.yml`):

| Job | Scope |
|-----|--------|
| `e2e_frontend3` | Playwright smoke/checkout/seller-onboarding **без** Django/Postgres |
| `e2e_fullstack` | FS-001–003 (`fullstack-*.spec.js`) против `docker-compose.e2e.yml` — **Task 018** |

Full-stack спеки **auto-skip**, если backend недоступен (локальный запуск без compose).

---

## Scope

- Аудит settings, urls, e2e views, stripe webhook skip-path
- Сверка env examples (e2e / test / production template)
- Обзор full-stack Playwright specs (skip-логика, зависимости)
- Сверка с `docker-compose.e2e.yml`, `playwright.config.js`, `docs/testing/e2e-local-contour.md`
- CI readiness checklist и proposal job (**реализация — Task 018**, вне scope Task 017)
- Документирование follow-ups при обнаружении рисков

---

## Out of Scope (Task 017 audit deliverable)

- Реализация CI job / изменение `.github/workflows/ci.yml` — **выполнено в [Task 018](./018-full-stack-e2e-ci-implementation/task.md)**
- Изменение runtime-кода (если не найден критический production defect — не найден)
- Новые full-stack e2e сценарии
- Обновление `docs/test-coverage-snapshot.md` (новые тесты не добавлялись)
- PayPal webhook skip (не реализован; PayPal остаётся с реальной верификацией)

---

## Safety Audit Checklist

| # | Проверка | Результат | Доказательство |
|---|----------|-----------|----------------|
| S-01 | `ENABLE_E2E_ENDPOINTS` default = `False` | **PASS** | `backend/backend/settings.py`: `os.getenv(..., "False")` |
| S-02 | `STRIPE_WEBHOOK_SKIP_SIGNATURE` default = `False` | **PASS** | То же |
| S-03 | `/api/e2e/*` только при `ENABLE_E2E_ENDPOINTS=True` | **PASS** | `backend/backend/urls.py`: `if getattr(settings, "ENABLE_E2E_ENDPOINTS", False):` |
| S-04 | E2E views требуют `IsAuthenticated` | **PASS** | `backend/payment/e2e_views.py`: `permission_classes = [IsAuthenticated]` |
| S-05 | Production env example **не** включает e2e flags | **PASS** | `envs/backend.env.example` — нет `ENABLE_E2E_*` / `STRIPE_WEBHOOK_SKIP_*` |
| S-06 | Test env example **не** включает e2e flags | **PASS** | `envs/backend.test.env.example` — только placeholder PSP keys |
| S-07 | `backend.e2e.env.example` осознанно включает flags | **PASS** | `ENABLE_E2E_ENDPOINTS=true`, `STRIPE_WEBHOOK_SKIP_SIGNATURE=true` + комментарий NEVER in production |
| S-08 | Stripe skip невозможен без env flag | **PASS** | Ветка skip только в `construct_stripe_webhook_event` при `getattr(settings, "STRIPE_WEBHOOK_SKIP_SIGNATURE", False)` |
| S-09 | E2E env без реальных Stripe/PayPal ключей | **PASS** | `STRIPE_API_*`, `PAYPAL_*` пустые в `backend.e2e.env.example` |
| S-10 | Нет hardcoded secrets в e2e views / skip-path | **PASS** | `e2e_views.py`, `stripe_webhook.py` — только чтение settings |
| S-11 | E2E endpoints не в public OpenAPI при flag=False | **PASS** | URL не регистрируются; views без `@extend_schema` |
| S-12 | Заполненные env не коммитятся | **PASS** | `.gitignore`: `envs/*` с `!envs/*.example` |
| S-13 | Webhook view остаётся `AllowAny` (как у Stripe) | **INFO** | Штатно для webhook; риск только при S-08=true |
| S-14 | Skip-path принимает произвольный JSON event | **WARN (e2e-only)** | При flag=true любой POST на `/api/stripe-webhook/` с валидным JSON обрабатывается без подписи |
| S-15 | E2E metadata: любой auth user может указать чужой `user_id` | **WARN (e2e-only)** | `E2ECreateStripeMetadataView` не валидирует `custom_data.user_id == request.user.id` |
| S-16 | `ALLOWED_HOSTS="*"` в e2e example | **INFO (local contour)** | Допустимо для локального docker; не копировать в prod |
| S-17 | `DEBUG=True` в `docker-compose.e2e.yml` | **INFO (local contour)** | Override поверх env-файла; только для локального e2e |

---

## Findings

### Архитектура защиты (достаточна при правильном деплое)

1. **Двойной gate для e2e HTTP helpers:** флаг settings + отсутствие URL в urlpatterns, если флаг выключен. Код views остаётся в репозитории, но **недостижим** извне без `ENABLE_E2E_ENDPOINTS=true`.

2. **Stripe signature skip изолирован:** активируется только через `STRIPE_WEBHOOK_SKIP_SIGNATURE`. Production templates (`backend.env.example`) и pytest template (`backend.test.env.example`) этот флаг **не задают**.

3. **E2E endpoints не документируются как public API:** нет drf-spectacular декораторов; при выключенном флаге маршруты отсутствуют в Swagger.

### Production-risk (при misconfiguration)

| ID | Severity | Риск | Условие срабатывания | Митигация сейчас |
|----|----------|------|----------------------|------------------|
| **R-017-01** | **Critical** | Поддельные Stripe webhooks создают заказы | `STRIPE_WEBHOOK_SKIP_SIGNATURE=true` на боевом/staging с доступным `/api/stripe-webhook/` | Default `False`; флаг только в `backend.e2e.env.example` |
| **R-017-02** | **High** | Создание `StripeMetadata` через `/api/e2e/*` | `ENABLE_E2E_ENDPOINTS=true` на публичном стенде | Default `False`; URL не регистрируются |
| **R-017-03** | **Medium** | Auth user + skip + metadata → заказ от имени другого `user_id` | Оба флага + зарегистрированный пользователь | Только изолированный e2e DB; не production при S-05/S-06 |

**Вердикт:** при деплое с `backend.env` / `backend.test.env` шаблонами **критический риск не реализован в коде по умолчанию**. Риск **операционный**: случайное включение e2e flags на staging/prod.

### Нужны ли runtime fixes сейчас?

**Нет** — для закрытия Task 017 достаточно документации и follow-ups. Явного дефекта «флаги включены по умолчанию в production» нет.

Рекомендуемые **минимальные** follow-ups (отдельные PR, не блокируют roadmap):

- **FU-017-01:** startup warning в Django при `ENABLE_E2E_ENDPOINTS` или `STRIPE_WEBHOOK_SKIP_SIGNATURE` (log ERROR).
- **FU-017-02:** ограничить e2e views (`IsAdminUser` / dedicated `E2E_API_TOKEN`) — снижает R-017-03 в shared e2e/staging.
- **FU-017-03:** в `E2ECreateStripeMetadataView` принудительно `user_id = str(request.user.id)` — defense in depth.
- **FU-017-04:** deploy checklist в `docs/07-deployment.md`: «запрещено ENABLE_E2E_* / STRIPE_WEBHOOK_SKIP_* на prod».

### Full-stack Playwright specs

| Файл | Backend skip | E2E endpoints | Примечание |
|------|--------------|---------------|------------|
| `fullstack-seller-onboarding.spec.js` | health only | не требует | FS-001 |
| `fullstack-checkout-payment-session.spec.js` | health only | не требует | FS-002; PSP mock на Playwright route |
| `fullstack-payment-confirmation.spec.js` | health + 404 check on `/api/e2e/...` | **требует** | FS-003 |

Все три: `FULLSTACK_BACKEND_URL` default `http://localhost:8000`, `test.skip` без arbitrary sleep.

---

## CI Readiness Checklist

| # | Критерий | Статус | Комментарий |
|---|----------|--------|-------------|
| C-01 | Full-stack tests auto-skip без backend | **PASS** | `beforeEach` → `GET /health/` |
| C-02 | `docker-compose.e2e.yml` существует | **PASS** | postgres + mailpit + backend_e2e |
| C-03 | Playwright config + preview webServer | **PASS** | `playwright.config.js`, port 4173 |
| C-04 | Browser install в CI | **PASS (smoke job)** | `npx playwright install --with-deps chromium` уже в `e2e_frontend3` |
| C-05 | Отдельный CI job для full-stack | **IMPLEMENTED (Task 018)** | Job `e2e_fullstack` в `.github/workflows/ci.yml` |
| C-06 | Env files для CI | **PASS (Task 018)** | `envs/database.e2e.env` + `envs/backend.e2e.env` из examples в CI job |
| C-07 | Сервисы для job | **DEFINED** | postgres_e2e, mailpit, backend_e2e; опционально не поднимать frontend в compose (Playwright preview на runner) |
| C-08 | Время выполнения / стабильность | **RISK** | FS-003: PDF invoice (reportlab + fonts), фоновые ThreadPoolExecutor tasks |
| C-09 | FS-001 в CI | **IMPLEMENTED (Task 018)** | Не требует e2e flags |
| C-10 | FS-002 в CI | **IMPLEMENTED (Task 018)** | Backend + mocked PSP route |
| C-11 | FS-003 в CI | **IMPLEMENTED (Task 018)** | `ENABLE_E2E_ENDPOINTS` + `STRIPE_WEBHOOK_SKIP_SIGNATURE` в backend env job |
| C-12 | Stripe/PayPal sandbox | **MANUAL** | Вне CI — чеклисты `docs/testing/stripe-e2e-checklist.md`, `paypal-e2e-checklist.md` |

### Verdict (на момент закрытия audit + follow-up Task 018)

**Safety:** при деплое с production/test env templates e2e flags **не активны по умолчанию**; operational risk — misconfiguration на staging/prod (см. R-017-01..03).

**CI (historical → current):** на момент Task 017 full-stack e2e был **local-only + CI proposal**. **Task 018** реализовал job `e2e_fullstack` (FS-001–003 против `docker-compose.e2e.yml`). Job `e2e_frontend3` **намеренно** остаётся лёгким smoke без backend.

**External PSP:** Tier 3 (EXT-001/002) Stripe/PayPal sandbox — **manual/ops**; git **не** утверждает production/sandbox external acceptance.

---

## Recommended Follow-ups

### Safety (P2, отдельные маленькие PR)

| ID | Описание |
|----|----------|
| FU-017-01 | Log WARNING/ERROR при старте Django, если e2e flags включены |
| FU-017-02 | Ограничить `/api/e2e/*` ролью staff или static internal token |
| FU-017-03 | Bind `custom_data.user_id` к `request.user` в `E2ECreateStripeMetadataView` |
| FU-017-04 | Строка в production deploy checklist: запрет e2e flags |

### CI (реализовано в Task 018)

| ID | Описание | Статус |
|----|----------|--------|
| FU-017-CI-01 | Workflow job `e2e_fullstack` | **Done** — Task 018 |
| FU-017-CI-02 | compose up → health → playwright `fullstack-*.spec.js` | **Done** — Task 018 |
| FU-017-CI-03 | `*.e2e.env.example` → `*.e2e.env` в CI | **Done** — Task 018 |
| FU-017-CI-04 | Fonts в образе для FS-003 invoice PDF | **Done** — verify in Task 018 |
| FU-017-CI-05 | FS-001+002+003 в одном job | **Done** — Task 018 |

### Historical: proposal CI job (Task 017, superseded by Task 018)

```yaml
# Псевдо-спека для docs only — не коммитить как workflow в этой задаче
e2e_fullstack:
  runs-on: ubuntu-latest
  services:  # альтернатива: docker compose в steps
    # postgres_e2e + mailpit + backend_e2e из docker-compose.e2e.yml
  steps:
    - checkout
  # env: ENABLE_E2E_ENDPOINTS=true, STRIPE_WEBHOOK_SKIP_SIGNATURE=true (только в этом job)
    - run: cp envs/database.e2e.env.example envs/database.e2e.env
    - run: cp envs/backend.e2e.env.example envs/backend.e2e.env
    - run: docker compose -f docker-compose.e2e.yml up -d --build
    - run: curl -sf http://localhost:8000/health/
    - working-directory: Frontend/Frontend3
    - run: npm ci && npm run build
    - run: npx playwright install --with-deps chromium
    - run: npm run test:e2e -- e2e/fullstack-seller-onboarding.spec.js e2e/fullstack-checkout-payment-session.spec.js e2e/fullstack-payment-confirmation.spec.js
  env:
    CI: "true"
    FULLSTACK_BACKEND_URL: http://localhost:8000
```

**Тесты в CI job `e2e_fullstack` (Task 018):** FS-001, FS-002, FS-003.  
**Вне CI (ручные / manual ops):** Stripe sandbox, PayPal sandbox, external provider E2E (Task 015 Tier 3) — **не** утверждается git.

**Тесты в текущем `e2e_frontend3`:** `smoke`, `checkout`, `seller-onboarding` (без backend) — **оставить как есть**.

---

## Relation to Prior Tasks

| Task | Связь |
|------|-------|
| **015** | Full-stack design **Done**; FS-001–003 implemented; CI — **018** |
| **018** | Реализация CI proposal из Task 017 |
| **019** | Catalog fixture для e2e_fullstack job |
| **016** | Idempotency в backend tests; FS-003 не дублирует |
| **010** | E2e local contour, Mailpit; не смешивать e2e compose с production deploy |
| **006** | Secrets policy; e2e example без реальных ключей — соответствует |

---

## Definition of Done

- [x] Создан `docs/tasks/017-e2e-safety-ci-readiness-audit/task.md`
- [x] Safety audit checklist заполнен
- [x] Findings зафиксированы (PASS / WARN / operational risks)
- [x] CI readiness checklist заполнен (C-05..C-11 — **IMPLEMENTED** via Task 018)
- [x] Verdict: safety PASS; CI был proposal at audit time → **реализован в Task 018**; external PSP — manual/ops
- [x] Runtime fixes не потребовались (follow-ups описаны)
- [x] `docs/tasks/README.md` обновлён
- [ ] `docs/test-coverage-snapshot.md` — не обновлялся (новые тесты не добавлялись)

---

## Локальная проверка full-stack (напоминание)

См. `docs/testing/e2e-local-contour.md` и `docs/frontend/tasks/013-full-stack-payment-confirmation-e2e/task.md`.

Обязательно в `envs/backend.e2e.env` (из example):

```bash
ENABLE_E2E_ENDPOINTS=true
STRIPE_WEBHOOK_SKIP_SIGNATURE=true
```

**Никогда** не задавать эти переменные в production `backend.env`.
