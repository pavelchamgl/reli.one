# Task 010 — DevOps Infrastructure

**Priority:** P1  
**Complexity:** Medium  
**Status:** In Progress (Iterations 2–4 выполнены, 5–6 не начаты)

## Цель

Добавить базовую DevOps инфраструктуру: мониторинг ошибок, health-check, стратегию backup, включить миграции в git-историю, настроить CI/CD pipeline.

## Контекст

Без мониторинга инциденты (падение webhook, 500 в payment) обнаруживаются только по жалобам пользователей. Нет health-check для Docker/load balancer. Миграции исключены из git → восстановление чистой БД сложно. Нет backup стратегии для PostgreSQL и медиа-файлов.

- **DEV-1 (P1):** Нет Sentry → payment/order ошибки незаметны в real-time
- **DEV-2 (P1):** Нет health-check endpoint
- **DEV-3 (P1):** Нет backup стратегии PostgreSQL + Cloudinary
- **DEV-4 (P2):** Миграции в `.gitignore` → нет version history схемы
- **DEV-5 (P2):** `DEBUG` не проверяется в production

## Scope (область)

- Интеграция Sentry для Django и React
- Добавление `/health/` endpoint
- Документирование backup стратегии
- Включение миграций в git
- Проверка `DEBUG=False` при запуске
- Обновление GitHub Actions CI

## Не входит в задачу

- Настройка Prometheus/Grafana (долгосрочно)
- Настройка Celery (Task 005 + отдельная задача)
- Изменение nginx конфигурации (требует явного разрешения по docs/10-agent-workflow.md)
- Managed DB переход

## Зависимости

- Task 002 (testing-foundation) — CI должен запускать тесты

## Риски

- Sentry может логировать PII если настроен неправильно → нужен `before_send` filter
- Включение миграций в git требует того чтобы сначала `makemigrations` вернул чистое состояние
- `DEBUG` check при запуске может нарушить staging если там `DEBUG=True`

## Definition of Done

- [x] `GET /health/` → `{"status": "ok", "db": "ok"}` в production — реализован в `backend/backend/urls.py`
- [x] Sentry DSN настроен для Django и React — settings.py (только при DEBUG=False + SENTRY_DSN), main.jsx (только при VITE_SENTRY_DSN)
- [ ] Документирована backup стратегия в `docs/07-deployment.md` — раздел содержит только TODO
- [ ] Миграции включены в git (`.gitignore` обновлён) — `.gitignore` строка 30: `*/migrations` по-прежнему исключает миграции
- [x] CI запускает тесты и проверку миграций — `.github/workflows/ci.yml` содержит `makemigrations --check --dry-run` + `manage.py test`
- [x] `DEBUG` корректно парсится как bool — `settings.py` строка 32 исправлена (2026-05-05): `os.getenv("DEBUG", "False").lower() in ("1", "true", "yes")`. Startup validation остаётся pending.

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
- [ ] Analysis complete

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
- [x] Health check added — `backend/backend/urls.py` строки 10–27, path `health/`

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
- [x] CI pipeline updated — `.github/workflows/ci.yml`: backend (migration check, `manage.py test`), frontend2 (lint, build), frontend3 (lint, build). Без coverage threshold — добавить в Task 002.

---

## Iteration 5 — Migrations in Git & DEBUG Check

### Migrations in git

**Обновить `.gitignore`:**
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
- [ ] Migrations in git — НЕ сделано. `.gitignore` строка 30: `*/migrations` по-прежнему исключает все миграции. CI-шаг `makemigrations --check` пройдёт только если в БД уже применены миграции (в CI используется SQLite fallback — проблема)
- [ ] DEBUG check added — НЕ сделано. `settings.py` строка 32: `DEBUG = os.getenv("DEBUG")` возвращает строку. Если в `.env` задано `DEBUG=False`, Python получит truthy-строку. Нужно: `DEBUG = os.getenv("DEBUG", "False").lower() in ("1", "true", "yes")`

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
- [ ] Backup strategy documented — `docs/07-deployment.md` строка 135: `> TODO: Описать стратегию резервного копирования`. Шаблон из Iteration 6 не добавлен.

---

## Iteration 7 — Validation

### Сценарии для проверки
- [ ] `GET /health/` → 200 `{"status": "ok", "db": "ok"}`
- [ ] Намеренно вызвать исключение в Django → появляется в Sentry
- [ ] CI pipeline проходит на feature branch
- [ ] `makemigrations --check` в CI не падает при актуальных миграциях
- [ ] `python manage.py check --deploy` не выдаёт предупреждений

### Статус
- [ ] Validation complete

**Аудит 2026-05-05:** Iterations 2–4 выполнены (health-check, Sentry, CI). Iterations 5–6 не начаты (миграции в git, DEBUG bool, backup docs).

---

## Привязка к коду

| Тип | Файлы |
|-----|-------|
| **Backend** | `backend/backend/settings.py`, `backend/backend/urls.py` |
| **Frontend** | `src/main.jsx`, `.env.example` |
| **CI** | `.github/workflows/ci.yml` |
| **Env** | `envs/backend.env.example`, `Frontend/Frontend3/.env.example` |
| **Docs** | `docs/07-deployment.md` |
| **Git** | `.gitignore` (migrations) |

## Связанные проблемы из docs/09-architecture-debt.md

- DEV-1: Нет мониторинга и алертинга P1
- DEV-2: Нет health-check endpoint P1
- DEV-3: Нет backup стратегии P1
- DEV-4: Миграции исключены из git P2
- DEV-5: `DEBUG` не проверяется P2
