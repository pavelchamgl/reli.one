# Task 010 — DevOps Infrastructure

**Priority:** P1  
**Complexity:** Medium  
**Status:** **DONE (репозиторий)** — deliverables ниже выполнены; детально см. **[Финальный аудит и таблица DoD](#финальный-аудит-и-таблица-dod)**. **OPEN / Partial (операционно):** боевые **staging/production** приёмка, `check --deploy`, активация Sentry/monitors/alerts только **вручную на контуре** (git **не** утверждает «production verified»).

## Цель
Закрепить эксплуатационный контур: health-check, Sentry, мониторинг/логи/алерты **в документации** ([`docs/operations/monitoring-alerts.md`](../../operations/monitoring-alerts.md), без навязывания observability‑стека в коде), документацию деплоя и безопасности, backup/restore, локальный e2e и шаблоны env, CI; без привязки к неиспользуемым в продукте доменам (промокоды — см. **Deferred** ниже). **Task 013** rollout **не** входит в DoD **010**, хотя repo-scope implementation уже есть.

## Контекст

Без мониторинга инциденты (падение webhook, 500 в payment) обнаруживаются только по жалобам пользователей. Схема БД версионируется файлами миграций в репозитории (`backend/*/migrations/`); восстановление **чистой** БД — через `migrate`. Техника **PostgreSQL dump/restore и перенос в e2e** задокументирована (`docs/operations/`); расписание **регулярных** боевых бэкапов, RTO/RPO и политика **медиа** описаны только частично (см. DoD‑таблицу ниже).

- **DEV-1 (P1):** Интеграция Sentry в коде **есть** (Iteration 3); runbook приёмки — [`07-deployment.md`](../../07-deployment.md) → **Sentry production verification**; включение и evidence на **staging/production** — см. колонку **Remaining action** в [таблице DoD](#финальный-аудит-и-таблица-dod)
- **DEV-2 (P1):** **`GET /health/`** — реализован (**Iteration 2**); контракт и production checklist описаны в **`docs/07-deployment.md`**; регрессия **`backend/test_health_endpoint.py`**. Привязка HEALTHCHECK в боевом compose/uptime — **по-прежнему на ops**
- **DEV-3 (P1):** Runbook **`pg_dump` / restore PostgreSQL → локальный e2e** есть — [`database-backup-restore.md`](../../operations/database-backup-restore.md); **регулярные бэкапы на production-сервере, RTO/RPO, Cloudinary/medиа** в `docs/07-deployment.md` — **ещё без полного описания**
- **Operational monitoring (документ):** runbook — [`monitoring-alerts.md`](../../operations/monitoring-alerts.md), вход из [`07-deployment.md`](../../07-deployment.md); **активация** правил на сервере — [таблица DoD](#финальный-аудит-и-таблица-dod) / [ручной раздел](#ручные-действия-на-staging--production-не-отменяют-done-репозитория)
- **DEV-4 (P2):** Исторически в `.gitignore` была строка `*/migrations` — она **не** матчит пути вида `backend/<app>/migrations/` (один `*` без `/`), поэтому миграции проектных apps **уже отслеживаются** в git; осмысленный DoD — поддерживать `makemigrations --check` без дрейфа и явный политический выбор ignore (см. Iteration 5)
- **DEV-5 (P2):** `DEBUG` не проверяется в production

## Scope (область)

- Интеграция Sentry для Django и React (и условия DSN / PII)
- `/health/` endpoint и регрессионные тесты
- Документация backup/restore PostgreSQL и восстановление в e2e-контур
- Шаблоны env для backend/e2e (`envs/*.example`)
- Локальный Docker e2e (`docker-compose.e2e.yml`) и чеклисты PSP (sandbox)
- Поддержание миграций без дрейфа (`makemigrations --check` в CI)
- CI: миграции, `manage.py test`, `pytest`
- `docs/07-deployment.md`: production readiness / security deployment checklist, ссылки на runbooks (deploy, [`monitoring-alerts.md`](../../operations/monitoring-alerts.md), backup, Sentry)
- Стартовая валидация env для production (по мере доработки Iteration 5)

## Deferred / Future (не входит в roadmap Task 010, не блокирует закрытие)

- **Промокоды:** в текущем продуктовом контуре **не используются**; тесты атомарности `PromoCode` / **Task 002 Extended** по промокодам **не** являются DoD для **010**. При возврате фичи — вынести в отдельную задачу / **003** по коду.
- **Складской резерв / stock reservation / Task 013:** **DONE repo-scope implementation** в коде; **OPEN ops rollout** (флаг на staging/prod, cron, monitoring). **010 не зависит** от rollout **013** и **не** требует включения `STOCK_RESERVATION_ENABLED` для своего repo-scope DoD. Git **не** утверждает production rollout.

## Не входит в задачу

- Настройка Prometheus/Grafana (долгосрочно)
- Настройка Celery (Task 005 + отдельная задача)
- Изменение nginx конфигурации (требует явного разрешения по docs/10-agent-workflow.md)
- Managed DB переход

## Зависимости

- Task 002 (testing-foundation) — в репозитории принят CI с тестами; **010** опирается на этот контур.
- **Нет зависимости** от Task 013, промокодов или складского резерва для целей DevOps/деплоя в рамках **010**.

## Риски

- Sentry может логировать PII если настроен неправильно → нужен `before_send` filter
- Смена `.gitignore`/политики по миграциям требует того, чтобы `makemigrations --check` и ревью графа миграций были согласованы (сейчас проектные миграции уже в git)
- `DEBUG` check при запуске может нарушить staging если там `DEBUG=True`

## Definition of Done

- [x] `GET /health/` → `{"status": "ok", "db": "ok"}` при живой БД — `backend/backend/urls.py`
- [x] Regression-тесты health: `pytest backend/test_health_endpoint.py` (200 + 503 при недоступной БД)
- [x] `docs/07-deployment.md` — контракт `/health/`; Sentry (**DSN + DEBUG=False**); **Sentry production verification (runbook)**; блок **Operational monitoring** со ссылкой на **[`docs/operations/monitoring-alerts.md`](../../operations/monitoring-alerts.md)**; раздел **Production deployment runbook** (A–G: pre-deploy, env, nginx/proxy, deploy, smoke, rollback, post-deploy — в **G** отсылка к monitoring runbook); таблица **среды** (production / staging / local e2e не смешивать); ссылки на backup/e2e/Stripe/PayPal docs; **не** заменяет `check --deploy` и **не** означает, что production уже принят без ручной верификации
- [x] **[`docs/operations/monitoring-alerts.md`](../../operations/monitoring-alerts.md)** — файловые логи (`LOGGING`), пост‑deploy чеклист, критичные симптомы (PSP webhook, платежный pipeline, почта, курьеры, **`/health/`** 503), **proposal** production‑алертов, минимальный ручной режим мониторинга, future observability/async; **нет** утверждения, что алерты в prod уже активны
- [x] Sentry DSN настроен для Django и React — settings.py (только при **DEBUG=False + SENTRY_DSN**), main.jsx (при **VITE_SENTRY_DSN**)
- [x] Runbook backup/restore PostgreSQL и restore в e2e — [`docs/operations/database-backup-restore.md`](../../operations/database-backup-restore.md); в `docs/07-deployment.md` раздел Backup ссылается на runbook (медиа/частота prod — вне runbook)
- [x] Миграции проектных apps в git — `backend/*/migrations/*.py` отслеживаются (в т.ч. `__init__.py`); паттерн `.gitignore` строка 30 (`*/migrations`) на эти пути **не действует**. **Аудит 2026-05-11:** `makemigrations --check --dry-run` → «No changes detected»; незакоммиченных изменений в `backend/*/migrations/` нет. Опционально: уточнить `.gitignore` (например `backend/*/migrations/*.pyc` уже покрывает bytecode) для ясности политики
- [x] CI запускает тесты и проверку миграций — `.github/workflows/ci.yml` содержит `makemigrations --check --dry-run` + `manage.py test` + `pytest`
- [x] `DEBUG` корректно парсится как bool — `settings.py` строка 32 исправлена (2026-05-05): `os.getenv("DEBUG", "False").lower() in ("1", "true", "yes")`. Startup validation остаётся pending.
- [x] **Cookie / session security (env):** `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`, SameSite, `SECURE_SSL_REDIRECT`, HSTS — задаются через env в `settings.py`; шаблоны `envs/backend.env.example`, `envs/backend.e2e.env.example`; runbook [`docs/07-deployment.md`](../../07-deployment.md) раздел B. `CSRF_COOKIE_HTTPONLY` не задан (дефолт Django, совместимость с фронтом). Ручная приёмка на контуре — по-прежнему обязательна.
- [x] **Финальный аудит документов Task 010:** сверены этот файл, [`README`](../README.md), [`docs/07-deployment.md`](../../07-deployment.md), [`docs/08-testing-strategy.md`](../../08-testing-strategy.md); **2026-05-11**. Репозиторий **не** утверждает боевую приёмку.

---

## Финальный аудит и таблица DoD

**Итог репозитория:** объём **implementation + документации** задачи выполнен (**DONE для git**). **Production / staging evidence** остаётся **pending**, если боевой контур ещё не проходился по runbook. Локальный **Docker e2e** и sandbox smoke Stripe/PayPal в чеклистах — **не** полноценная **production acceptance** (см. [`docs/07-deployment.md`](../../07-deployment.md) и раздел [«Прогресс: локальный e2e»](#прогресс-локальный-e2e-не-production) ниже).

| Item | Status | Evidence (ссылка / артефакт) | Remaining action (ops / вне git) |
|------|--------|-------------------------------|----------------------------------|
| Local e2e контур | **Done** | `docker-compose.e2e.yml`; [`e2e-local-contour.md`](../../testing/e2e-local-contour.md) | — |
| Env examples (`*.example`, e2e + prod‑oriented) | **Done** | `envs/backend.env.example`, `envs/database.env.example`, `envs/backend.e2e.env.example`, `envs/database.e2e.env.example`; `Frontend/Frontend3/.env.example` | Сверка с живыми `*.env` на сервере |
| Mailpit в e2e | **Done** | compose + [`e2e-local-contour.md`](../../testing/e2e-local-contour.md) | — |
| Stripe local e2e smoke (docs) | **Done** | [`stripe-e2e-checklist.md`](../../testing/stripe-e2e-checklist.md) | Не смешивать с prod acceptance |
| PayPal sandbox smoke (docs) | **Done** | [`paypal-e2e-checklist.md`](../../testing/paypal-e2e-checklist.md) | Не смешивать с prod acceptance |
| `/health/` + тесты + док | **Done** | [`backend/backend/urls.py`](../../../backend/backend/urls.py), [`test_health_endpoint.py`](../../../backend/test_health_endpoint.py), [`07-deployment.md`](../../07-deployment.md) § Health | После релиза: проверить с клиента на **staging/prod** |
| PostgreSQL backup/restore → e2e | **Done** | [`database-backup-restore.md`](../../operations/database-backup-restore.md) | Регламент **регулярных** prod‑бэкапов / полный RTO/RPO → см. строки ниже |
| Миграции + drift check в CI | **Done** | `backend/*/migrations/`; [.github/workflows/ci.yml](../../../.github/workflows/ci.yml) | Поддерживать при смене моделей |
| Deployment runbook A–G | **Done** | [`07-deployment.md`](../../07-deployment.md) | Пройти вручную на своём контуре, sign‑off ops |
| Cookie / HTTPS / session (env, раздел B) | **Done** | `settings.py`, `env_parse.py`, `envs/*.example`; [`07-deployment.md`](../../07-deployment.md) § B | Ручная приёмка после выката |
| Sentry код + verification runbook | **Docs Done / Ops pending** | Django/React init; [`07-deployment.md` → Sentry](../../07-deployment.md#sentry-production-verification-runbook) | Приёмка на staging/prod по runbook |
| Monitoring / alerts runbook | **Docs Done / Ops pending** | [`monitoring-alerts.md`](../../operations/monitoring-alerts.md) | Включить правила мониторинга по runbook |
| `manage.py check --deploy` на цели | **Manual pending** | — | По runbook перед релизом |
| Startup prod env validation (proposal Iter. 5) | **Не в этом закрытии** | см. ниже Iteration 5 — код опционально | Отдельный PR при нужде |
| RTO/RPO, backup медиа (Iteration 6) | **Не в этом закрытии** | `07-deployment.md`, Iteration 6 | Доп. док при продуктовой нужде |
| **PromoCode** | **Excluded** | [Deferred §](#deferred--future-не-входит-в-roadmap-task-010-не-блокирует-закрытие) | — |
| **Stock reservation / Task 013** | **Excluded from 010 DoD** | [Deferred §](#deferred--future-не-входит-в-roadmap-task-010-не-блокирует-закрытие); repo implementation **Done**, rollout **ops open** | Включение флага / cron / monitoring — см. Task 013 |

---

## Прогресс: локальный e2e (не production)

Ниже — фактическое состояние после появления изолированного Docker e2e. **Это не означает готовность production** (отдельные пункты ниже).

### Сделано

- [x] **`docker-compose.e2e.yml`** — PostgreSQL e2e, Mailpit, backend (`migrate`, `collectstatic`, `runserver --insecure`)
- [x] Шаблоны **`envs/backend.e2e.env.example`**, **`envs/database.e2e.env.example`**
- [x] **Mailpit** — локальная проверка SMTP без отправки писем наружу (`EMAIL_HOST=mailpit`)
- [x] **Статика / admin в e2e** — `STATIC_URL`, `STATIC_ROOT`, `MEDIA_URL`, `MEDIA_ROOT` читаются из env с production-compatible defaults; compose задаёт `/static/`, `/app/staticfiles`, `/media/`, `/app/media`
- [x] **Webhook / ngrok** — в e2e шаблоне `ALLOWED_HOSTS="*"` и документация Stripe CLI / ngrok (**только** для локального контура)
- [x] **Документация:** [`docs/testing/e2e-local-contour.md`](../../testing/e2e-local-contour.md), [`docs/testing/stripe-e2e-checklist.md`](../../testing/stripe-e2e-checklist.md), [`docs/testing/paypal-e2e-checklist.md`](../../testing/paypal-e2e-checklist.md); backup/restore: [`docs/operations/database-backup-restore.md`](../../operations/database-backup-restore.md); в [`docs/07-deployment.md`](../../07-deployment.md) зафиксировано, что e2e-compose **не** для production

### Артефакты e2e и runbooks (в репозитории выполнены)

- [x] **Backup / restore runbook (PostgreSQL + e2e)** — [`docs/operations/database-backup-restore.md`](../../operations/database-backup-restore.md); RTO/RPO и облачные политики на production — при необходимости доп. правка `docs/07-deployment.md`
- [x] **Stripe local e2e smoke с артефактами** — прогон через Postman/ngrok, Mailpit; evidence в [`stripe-e2e-checklist.md`](../../testing/stripe-e2e-checklist.md) (*Verification evidence*). **Не** равноценно production-приёмке.
- [x] **PayPal local e2e smoke с артефактами** — прогон **sandbox + e2e** (Postman, ngrok, Mailpit); итоги зафиксированы в [`paypal-e2e-checklist.md`](../../testing/paypal-e2e-checklist.md) → *Verification evidence — latest local smoke result* (**local/sandbox**, не prod; без сырых id/payload в репозитории). По политике команды точные номера заказов/инвоясов добавляются в тикеты отдельно.
- [x] **Production deployment runbook** — в [`docs/07-deployment.md`](../../07-deployment.md) (секции A–G); **выполнение** шагов на вашем контуре и sign-off production — по-прежнему **ручные** (см. Iteration 7).
- [x] **Operational monitoring/alerts/logs runbook** — [`monitoring-alerts.md`](../../operations/monitoring-alerts.md), вход через [`07-deployment.md`](../../07-deployment.md)

### Ручные действия на staging / production (не отменяют **DONE репозитория**)

Эти пункты **вне git**; чекбоксы ниже — памятка ops, а не DoD кода.

- [ ] **Мониторинг production — исполнение** — правила алертов, uptime/`/health/` и т.п. по [`monitoring-alerts.md`](../../operations/monitoring-alerts.md)
- [ ] **Sentry staging/production verification** — по [`07-deployment.md`](../../07-deployment.md#sentry-production-verification-runbook)
- [ ] Пройти **Iteration 7** чеклист на вашем контуре (см. [ниже](#iteration-7--validation-закрывающий-аудит-task-010))

### Next steps (кратко)

1. Iteration 7: пройти runbook в [`docs/07-deployment.md`](../../07-deployment.md) на **staging** (или контролируемом контуре), в т.ч. **[`monitoring-alerts.md`](../../operations/monitoring-alerts.md)**, раздел **Sentry production verification**, `check --deploy`, health/alerts; сохранить **ручное evidence** (см. чеклисты в документах).
2. Уточнить при приёмке **SECURE_SSL_REDIRECT** vs редиректы Nginx, при необходимости — HSTS/preload по политике.
3. Iteration 5: startup-проверка env для production (по желанию — фрагмент уже в задаче).
4. Iteration 6: RTO/RPO и backup медиа (Cloudinary) — при продуктовой необходимости.
5. Локальные smoke Stripe/PayPal — evidence в [`stripe-e2e-checklist.md`](../../testing/stripe-e2e-checklist.md), [`paypal-e2e-checklist.md`](../../testing/paypal-e2e-checklist.md).

---

# Iterations

## Iteration 1 — Analysis

### Цель
Понять текущую инфраструктуру и определить приоритеты.

### Действия
- Прочитать `backend/backend/settings.py` — как настроен logging, какие env vars
- Прочитать `.github/workflows/ci.yml` — текущий CI
- Прочитать `docs/07-deployment.md` — текущая deployment документация
- Проверить `.gitignore` — что именно исключено
- Проверить `backend/backend/urls.py` — есть ли health endpoint

### Output
- Список env vars которые нужно добавить в `backend.env.example`
- Текущий CI workflow — что уже настроено
- Пробелы в deployment документации

### Статус
- [x] Analysis complete (исторически; результат зафиксирован в последующих iterations)

---

## Iteration 2 — Health Check

### Цель
Добавить минимальный health-check endpoint.

### Что менять

**`backend/backend/urls.py`:**
```python
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    """Health check для Docker/load balancer."""
    try:
        connection.ensure_connection()
        db_status = "ok"
    except Exception:
        db_status = "error"

    status_code = 200 if db_status == "ok" else 503
    return JsonResponse(
        {"status": "ok" if db_status == "ok" else "error", "db": db_status},
        status=status_code
    )

urlpatterns = [
    path("health/", health_check, name="health"),
    # ... existing patterns
]
```

### Затрагиваемые файлы
- `backend/backend/urls.py`

### Статус
- [x] Health check added — `backend/backend/urls.py` строки 10–31, path `health/`
- [x] Regression tests — `backend/test_health_endpoint.py`

---

## Iteration 3 — Sentry Integration

### Цель
Настроить Sentry для мониторинга ошибок в Django и React.

### Django (`backend/backend/settings.py`):

```python
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

SENTRY_DSN = os.getenv("SENTRY_DSN", "")

if SENTRY_DSN and not DEBUG:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,  # НЕ отправлять PII
        before_send=lambda event, hint: filter_sensitive_data(event),
    )

def filter_sensitive_data(event):
    """Удалять чувствительные данные перед отправкой в Sentry."""
    # Удалить данные карт, IBAN, персональные данные из request body
    return event
```

**`requirements.txt`:**
```
sentry-sdk[django]>=2.0
```

### React (`Frontend/Frontend3/src/main.jsx`):

```jsx
import * as Sentry from "@sentry/react"

if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: 0.1,
        beforeSend(event) {
            // Не отправлять токены из localStorage
            delete event.extra?.token
            return event
        },
    })
}
```

**`Frontend/Frontend3/.env.example`** — добавить:
```env
VITE_SENTRY_DSN=
```

**`envs/backend.env.example`** — добавить:
```env
SENTRY_DSN=
```

### Установка
```bash
npm install @sentry/react --save
pip install sentry-sdk[django]
```

### Статус
- [x] Django Sentry configured — `settings.py` строки 550–589, PII-фильтр `_sentry_before_send`, активируется только при DEBUG=False
- [x] React Sentry configured — `main.jsx` строки 1–22, `beforeSend` удаляет token/access_token/refresh_token; `@sentry/react` установлен 2026-05-05
- [x] SENTRY_DSN in env.example — оба файла: `envs/backend.env.example` и `Frontend/Frontend3/.env.example`

---

## Iteration 4 — CI Pipeline

### Цель
Настроить полный CI pipeline с тестами, проверкой миграций и линтингом.

### Обновить `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_reli
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
        ports: ["5432:5432"]

    env:
      DB_NAME: test_reli
      DB_USER: postgres
      DB_PASSWORD: postgres
      DB_HOST: localhost
      DJANGO_SETTINGS_MODULE: backend.settings
      SECRET_KEY: test-secret-key-for-ci

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: pip

      - name: Install dependencies
        run: pip install -r backend/requirements.txt

      - name: Check migrations are up to date
        run: |
          cd backend
          python manage.py makemigrations --check --dry-run

      - name: Run tests with coverage
        run: |
          cd backend
          pytest --tb=short -q --cov=. --cov-report=term-missing --cov-fail-under=30

  frontend-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: Frontend/Frontend3/package-lock.json

      - name: Install deps
        run: npm ci
        working-directory: Frontend/Frontend3

      - name: Lint
        run: npm run lint
        working-directory: Frontend/Frontend3
```

### Статус
- [x] CI pipeline updated — `.github/workflows/ci.yml`: backend (migration check, `manage.py test`, `pytest`), frontend2 (lint, build), frontend3 (lint, build). Порог coverage — см. Scope (опционально в этой задаче).

---

## Iteration 5 — Migrations in Git & DEBUG Check

### Migrations in git

**Фактическое состояние (2026-05-11):** миграции Django apps под `backend/<app>/migrations/` уже **закоммичены**; шаблон `.gitignore` `*/migrations` не соответствует этим путям. Ниже — исторический чеклист; при смене политики ignore пересобрать граф и прогнать CI.

**Опционально уточнить `.gitignore`:**
```gitignore
# Убрать:
# */migrations/

# Оставить:
*/migrations/*.pyc
```

**Порядок действий:**
1. Убрать `*/migrations/` из `.gitignore`
2. Запустить `python manage.py makemigrations` для всех apps
3. Убедиться что нет конфликтов
4. Добавить все `migrations/` в git commit

### DEBUG check in production

**`backend/backend/settings.py`:**
```python
DEBUG = os.getenv("DEBUG", "False").lower() in ("1", "true", "yes")

# При запуске в production проверить
if not DEBUG and os.getenv("DJANGO_ENV") == "production":
    required_vars = ["SECRET_KEY", "DB_NAME", "DB_USER", "DB_PASSWORD"]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        raise RuntimeError(f"Missing required env vars: {missing}")
```

### Статус
- [x] Migrations in git — файлы миграций под `backend/<app>/migrations/` **в репозитории**; утверждение про полное исключение миграций `.gitignore` было **неточным** (шаблон `*/migrations` не покрывает `backend/.../migrations/`). **Аудит 2026-05-11:** без дрейфа моделей/миграций; локально при заданных в `envs/*` Postgres-переменных `makemigrations` может выдать предупреждение о недоступной БД, но проверка дрейфа остаётся валидной; в CI, как в `ci.yml`, без `DB_*` используется SQLite — предупреждения нет
- [ ] Startup production validation (`DJANGO_ENV=production`, обязательные env vars) — НЕ сделано (см. предложенный фрагмент выше). Парсинг **`DEBUG` как bool** уже исправлен в `settings.py` (см. Definition of Done).

---

## Iteration 6 — Backup Strategy Documentation

### Цель
Задокументировать backup стратегию.

### Обновить `docs/07-deployment.md`:

```markdown
## Backup Strategy

### PostgreSQL
- Частота: ежедневно в 2:00 UTC
- Метод: pg_dump + S3 bucket (или managed DB auto-backup)
- Retention: 30 дней
- Восстановление: pg_restore, тест каждые 30 дней

### Cloudinary Media
- Cloudinary auto-backup включён в план
- Дополнительно: periodic export через Cloudinary API

### Тест восстановления
- Ежемесячно: restore на staging DB и проверить целостность данных

### RTO/RPO
- RTO (Recovery Time Objective): 4 часа
- RPO (Recovery Point Objective): 24 часа (допустимая потеря данных)
```

### Статус
- [x] PostgreSQL backup/restore + e2e restore documented — [`docs/operations/database-backup-restore.md`](../../operations/database-backup-restore.md); `docs/07-deployment.md` → раздел Backup со ссылкой
- [ ] RTO/RPO и backup медиа (Cloudinary) в `docs/07-deployment.md` — при необходимости отдельным коммитом

---

## Iteration 7 — Validation (закрывающий аудит Task 010)

### Сценарии для проверки

> Чекбоксы ниже — только для **вашего живого** staging/production. **Локальный e2e / sandbox smoke не являются** их заменой ([`07-deployment.md`](../../07-deployment.md), [таблица DoD выше](#финальный-аудит-и-таблица-dod)).
- [ ] `GET /health/` → 200 `{"status": "ok", "db": "ok"}` на целевом production/stage
- [ ] Sentry: пройти **[Sentry production verification (runbook)](../../07-deployment.md#sentry-production-verification-runbook)** (test event, проверка фильтрации, UI, алерты, ownership); **предпочтительно staging**; production test event — по согласованию. Не отмечать как «готово», пока нет **ручного** evidence.
- [ ] CI pipeline проходит на основной ветке
- [ ] `makemigrations --check` в CI не падает при актуальных миграциях
- [ ] `python manage.py check --deploy` не выдаёт блокирующих предупреждений для целевого контура
- [ ] **Production deployment runbook** в `docs/07-deployment.md` пройден пунктно на целевом контуре (в т.ч. cookies/HSTS/env из раздела B)
- [ ] Мониторинг/алерты на критичные ошибки: **проектные** действия ops по **[`monitoring-alerts.md`](../../operations/monitoring-alerts.md)** (вкл. Sentry rules, uptime/`/health/`, наблюдение за `backend/logs`). Не считать закрытым только по наличию Sentry/SDK в коде или markdown в репозитории

### Статус
- [x] **Финальный аудит репозитория (документальный, 2026-05-11):** артефакты и ссылки согласованы; **не** равно проверке боевого сервера (см. чекбоксы ниже).
- [ ] **Применение чеклиста на целевом контуре + ручное evidence** (по готовности ops)

**Аудит 2026-05-05:** Iterations 2–4 выполнены (health-check, Sentry, CI). Iteration 5 (миграции в git) и Iteration 6 (частично: runbook PG + e2e в `docs/operations/`) — см. актуальные чекбоксы выше.

**Обновление 2026-05-11:** локальный e2e-контур и связанная документация добавлены (см. **«Прогресс: локальный e2e»**). **Миграции:** сверка `makemigrations --check --dry-run` и `migrate --plan` (SQLite при пустых `DB_*`) — дрейфа нет; см. DoD и Iteration 5.

**Закрытие задачи в git:** **DONE** по репозиторному scope; промокоды и **013** — **не** блокеры ([Deferred §](#deferred--future-не-входит-в-roadmap-task-010-не-блокирует-закрытие)). Эксплуатационная приёмка стоит в невыполненных чекбоксах ниже.

---

## Локальный e2e-контур (документация)

Для ручной проверки backend с изолированной БД, Mailpit и провайдерами оплаты (Stripe test mode, PayPal sandbox): compose **`docker-compose.e2e.yml`**, шаблоны **`envs/backend.e2e.env.example`**, **`envs/database.e2e.env.example`**.

| Документ | Содержание |
|----------|------------|
| [`docs/testing/e2e-local-contour.md`](../../testing/e2e-local-contour.md) | Запуск compose, порты, сброс БД, Mailpit, ngrok/webhook, безопасность |
| [`docs/testing/stripe-e2e-checklist.md`](../../testing/stripe-e2e-checklist.md) | Ручной Stripe: Postman, webhook, идемпотентность |
| [`docs/testing/paypal-e2e-checklist.md`](../../testing/paypal-e2e-checklist.md) | Ручной PayPal sandbox: Postman, ngrok, `PAYPAL_WEBHOOK_ID`, идемпотентность |
| [`docs/operations/database-backup-restore.md`](../../operations/database-backup-restore.md) | Backup/restore PostgreSQL, restore prod-копии в e2e, safety |
| [`docs/operations/monitoring-alerts.md`](../../operations/monitoring-alerts.md) | Логи `LOGGING`, пост‑deploy, критические симптомы, предложение по alerts, manual monitoring, без обязательного Prometheus |

## Привязка к коду

| Тип | Файлы |
|-----|-------|
| **Backend** | `backend/backend/settings.py`, `backend/backend/urls.py` |
| **Frontend** | `src/main.jsx`, `.env.example` |
| **CI** | `.github/workflows/ci.yml` |
| **Env** | `envs/backend.env.example`, `Frontend/Frontend3/.env.example` |
| **Docs** | `docs/07-deployment.md`, `docs/operations/database-backup-restore.md`, `docs/operations/monitoring-alerts.md`, `docs/testing/e2e-local-contour.md`, `docs/testing/stripe-e2e-checklist.md`, `docs/testing/paypal-e2e-checklist.md`, `docs/08-testing-strategy.md` |
| **Tests (health)** | `backend/test_health_endpoint.py` |
| **Git** | `.gitignore` (migrations, `backups/`, e2e volumes) |
| **Локальный e2e** | `docker-compose.e2e.yml`, `envs/*.e2e.env.example` |

## Связанные проблемы из docs/09-architecture-debt.md

- DEV-1: оставшийся эксплуатационный **gap** до полноценной системы наблюдаемости ослаблен **runbook**: [`monitoring-alerts.md`](../../operations/monitoring-alerts.md) и раздел **`07-deployment.md`**; **активация** правил мониторинга на production всё ещё на ops (см. [таблицу DoD](#финальный-аудит-и-таблица-dod)).
- DEV-2: ~~«Нет `/health/`»~~ — endpoint и регрессия есть (**Iteration 2**); см. архитектурный долг `docs/09-architecture-debt.md` для полного вычёркивания статуса
- DEV-3: ~~«Нет backup» как техники~~ — см. **[`database-backup-restore.md`](../../operations/database-backup-restore.md)** и **DEV-3** выше (**регулярные prod** процедуры / RTO — ещё вне задачи или Iteration 6)
- DEV-4: Политика `.gitignore` для `migrations` vs фактическое версионирование схемы — **актуализировано** в **010** (миграции apps в git; см. DoD)
- DEV-5: `DEBUG` не проверяется P2
