# 07. Deployment

Документ описывает **целевую** архитектуру деплоя, health-check, backup, Sentry и **пошаговый runbook** для выпуска backend. Следование этому чеклисту **не заменяет** ручную приёмку на вашем контуре: фактическая верификация production/staging выполняется командой после каждого релиза.

## Среды (production / staging / local e2e)

| Среда | Назначение | Артефакты |
|-------|------------|-----------|
| **Production** | Боевой трафик, live PSP при включённой оплате | `docker-compose.yml`, `envs/backend.env`, `envs/database.env`, Nginx/TLS на сервере |
| **Staging** | Предпрод, тест оплаты без боевых лимитов (политика команды) | Отдельные хосты и **свои** env; те же проверки runbook, **не** подмешивать ключи production |
| **Local e2e** | Ручные smoke, Stripe/PayPal **test/sandbox**, Mailpit | [`docs/testing/e2e-local-contour.md`](./testing/e2e-local-contour.md), `docker-compose.e2e.yml`, `envs/*.e2e.env` — **не** выкатывать на сервер как production |

Локальные чеклисты провайдеров (доказательства smoke, **не** приёмка prod): [`docs/testing/stripe-e2e-checklist.md`](./testing/stripe-e2e-checklist.md), [`docs/testing/paypal-e2e-checklist.md`](./testing/paypal-e2e-checklist.md).

## Инфраструктура

| Компонент | Значение |
|-----------|----------|
| Сервер | `45.147.248.21` (TODO: провайдер?) |
| ОС | TODO |
| Рабочая директория | `/home/reli/reli.one/` |
| Домены | `reli.one`, `www.reli.one`, `info.reli.one` |
| TLS | Let's Encrypt (fullchain.pem / privkey.pem) |

## Схема деплоя

```
Internet
   │
   ▼
Nginx (порты 80, 443)
   │  TLS termination
   │  proxy_pass → backend:8081 (/api, /admin)
   │  static files → /data/www/onlineshop/ (/), /data/www/landing/ (info.*)
   │
   ▼
Docker network
   ├── frontend1   (Nginx-контейнер)
   ├── backend     (Gunicorn, 4 workers, 0.0.0.0:8081)
   └── postgres_db (PostgreSQL 17)
```

## Docker Compose

### Production

Файл: `docker-compose.yml`

| Сервис | Image / Build | Порты | Env-файлы |
|--------|---------------|-------|-----------|
| `postgres_db` | postgres:17 | — | envs/database.env |
| `backend` | ./backend/ | 8081:8081 | envs/database.env, envs/backend.env |
| `frontend1` | ./Frontend/ | 80:80, 443:443 | — |

**Тома:**
- `static_volume` — Django collectstatic → Nginx
- `/home/reli/reli.one/backend/media` → `/app/media` (bind mount)
- `./.reli_db/postgres` → PostgreSQL data

### Локальный e2e (не production)

Файл: **`docker-compose.e2e.yml`** — отдельный стек **только для локальной** ручной проверки (e2e, Postman, тестовый Stripe, Mailpit). Он **не** описывает и **не** заменяет production-деплой: другие контейнеры, порты (`8000`, `5434`, `8025`), env-файлы `envs/*.e2e.env`, тома `.reli_e2e_db/`, `media_e2e/`, `static_e2e/`. На сервер выкатывать этот compose не следует. Подробности: [`docs/testing/e2e-local-contour.md`](./testing/e2e-local-contour.md).

## Запуск бэкенда (startup command)

```bash
python3 manage.py createcachetable django_cache || true
python3 manage.py collectstatic --no-input
python3 manage.py migrate --noinput
gunicorn backend.wsgi:application -w 4 -b 0.0.0.0:8081
```

## Env-файлы

Реальные env-файлы не хранятся в репозитории. Шаблоны:
- `envs/database.env.example`
- `envs/backend.env.example`

> TODO: Описать процесс передачи env-файлов на сервер (scp / vault / secrets manager).

## TLS

Сертификаты монтируются в контейнер `frontend1` как:
- `/etc/nginx/fullchain.pem`
- `/etc/nginx/privkey.pem`

> TODO: Описать процесс обновления сертификата (certbot cron?).

## CI/CD

В репозитории: **GitHub Actions** (`.github/workflows/ci.yml`) — установка зависимостей, `makemigrations --check --dry-run`, `migrate`, `manage.py test`, `pytest`. Пайплайн **не** выполняет автоматический деплой на сервер; релиз на production/staging — по runbook ниже.

## Health-check

**URL:** `GET /health/` (корень сайта приложения Django, без префикса `/api`; за reverse proxy может выглядеть как `https://<domain>/health/`).

**Назначение:** минимальный **liveness/readiness** без аутентификации для оркестраторов и балансировщиков.

**Что проверяется**

| Компонент | Проверяется? | Примечание |
|-----------|----------------|------------|
| Процесс приложения отвечает | да | любой успешный JSON-ответ уже означает, что Django обработал запрос |
| Подключение к основной БД | да | `connection.ensure_connection()` |
| Stripe, PayPal, почта, очереди, Cloudinary и пр. | **нет** | намеренно не дергаются из health (тяжёлые, flaky, секретные токены) |

**Контракт ответа:** только ключи `status` и `db`; значения — `"ok"` / `"error"`. Никаких переменных окружения, версий сборки или трассбеков в теле ответа (см. `backend/backend/urls.py`).

| Сценарий | HTTP | Тело |
|----------|------|------|
| Приложение и БД доступны | 200 | `{"status": "ok", "db": "ok"}` |
| БД недоступна (ошибка при `ensure_connection`) | 503 | `{"status": "error", "db": "error"}` |

Проверка:
```bash
curl -s https://reli.one/health/ | python3 -m json.tool
# или локально:
curl -s http://localhost:8081/health/
```

Docker Compose пример:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8081/health/"]
  interval: 30s
  timeout: 5s
  retries: 3
```

Тесты: `pytest backend/test_health_endpoint.py`.

## Production deployment runbook

Использовать как **последовательный чеклист** перед/после выката backend на **production** или **staging**. Не смешивать env и compose с [`docker-compose.e2e.yml`](../docker-compose.e2e.yml) ([`e2e-local-contour.md`](./testing/e2e-local-contour.md)). Этот runbook **не** сертифицирует, что production уже принят: финальная вывеска «готово» — решение команды после выполнения шагов.

Связанные материалы: [`database-backup-restore.md`](./operations/database-backup-restore.md), [`e2e-local-contour.md`](./testing/e2e-local-contour.md), [`stripe-e2e-checklist.md`](./testing/stripe-e2e-checklist.md), [`paypal-e2e-checklist.md`](./testing/paypal-e2e-checklist.md).

### A. Pre-deploy

| Шаг | Действие |
|-----|----------|
| Версия | Зафиксировать **git branch / commit SHA** или **tag** релиза; убедиться, что образ/код на сервере соответствует утверждённому артефакту. |
| Тесты | **CI зелёный** на этом коммите; локально при необходимости полный прогон: из `backend/` с venv — `pytest` (как минимум то же, что в `.github/workflows/ci.yml`: `makemigrations --check`, `migrate`, `manage.py test`, `pytest`). |
| Миграции | `python manage.py makemigrations --check --dry-run` — **без выходных миграций**. При необходимости прогнать с той же БД, что целевой контур, `python manage.py migrate --plan` и проверить ожидаемые операции (**осторожно** на production: план согласовать при рискованных миграциях). |
| Бэкап БД | Перед выкатом с миграциями или риском отката — **снимок БД** по [`database-backup-restore.md`](./operations/database-backup-restore.md); убедиться, что дамп создан и доступен для восстановления. |
| Env | Сверить **production/staging** `envs/backend.env` и `envs/database.env` с шаблонами `*.env.example`; нет плейсхолдеров `CHANGE_ME` / пустых обязательных ключей для включённых фич. |
| Секреты | Секреты **не** в git, **не** в логах деплоя; Stripe/PayPal — **live** только на production при осознанном включении (`PAYPAL_MODE`, ключи Stripe). |

### B. Env checklist

Сверять с **`envs/backend.env.example`**, **`envs/database.env.example`** и фактическими именами в `backend/backend/settings.py` (в т.ч. Stripe: в коде используются `STRIPE_API_PUBLISHABLE_KEY`, `STRIPE_API_SECRET_KEY`, `STRIPE_WEBHOOK_ENDPOINT_SECRET` — привязать к значениям в вашем `backend.env`).

| Группа | Переменные / тема |
|--------|-------------------|
| Ядро Django | `SECRET_KEY`, **`DEBUG=False`** на production. |
| Хосты / CSRF / CORS | `ALLOWED_HOSTS` (список через запятую или политика команды); в коде заданы `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS` — при новом домене/фронте **обновить код и задеплоить** вместе с backend. |
| БД | `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT` (`database.env`). |
| Почта | `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`/`EMAIL_USE_SSL`, учётные данные, `DEFAULT_FROM_EMAIL` / `SERVER_EMAIL` по необходимости. |
| Stripe | Секреты и publishable key, webhook signing secret; **test vs live** — отдельно для staging/prod. |
| PayPal | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, **`PAYPAL_MODE`** (`live` только на боевом контуре при готовности). |
| Курьеры / доставка | Packeta (`PACKETA_*`), MyGLS (`MYGLS_*`), DPD (`DPD_*`, при `DPD_ENABLED`) — только те провайдеры, что реально используются; без тестовых заглушек на prod без надобности. |
| Sentry | `SENTRY_DSN` при `DEBUG=False` для Django; фронт — `VITE_SENTRY_DSN` на **сборке** фронта. |
| Домены в приложении | `PUBLIC_DOMAIN` (env, см. `settings.py`). **`REDIRECT_DOMAIN`** в текущем коде задан в `settings.py` константой — смена основного домена может потребовать **правки кода** и релиза, не только env. |
| Статика / медиа | `STATIC_URL`, `STATIC_ROOT`, `MEDIA_URL`, `MEDIA_ROOT` согласованы с Nginx/volume (см. раздел C и `docker-compose.yml`). |
| Cloudinary | `CLOUDINARY_*` / `CLOUDINARY_URL`, если медиа через Cloudinary. |
| Прочее | `ENABLE_DELIVERY_DEV_ENDPOINTS=False` на production (см. `settings.py`). |

Документ не заменяет **`python manage.py check --deploy`** — выполнить на целевом контуре или образе перед финализацией релиза.

### C. Nginx / reverse proxy

| Тема | Проверка |
|------|----------|
| HTTPS | TLS termination на Nginx (сертификаты, автообновление — см. раздел **TLS** выше). |
| Заголовки прокси | Backend за прокси ожидает корректные **`X-Forwarded-Proto`**, при необходимости `X-Forwarded-Host`; в Django: `SECURE_PROXY_SSL_HEADER`, `USE_X_FORWARDED_HOST` (см. `settings.py`). |
| Статика | `collectstatic` → каталог, отдаваемый Nginx/volume согласно compose. |
| Медиа | При использовании локальных файлов — proxy/alias на каталог `MEDIA_ROOT` (bind/volume в compose). |
| Маршруты API / admin | `proxy_pass` на upstream Gunicorn (напр. `:8081`); префиксы `/api`, `/admin` и т.д. — как в текущей схеме. |
| Webhooks | Публичные URL Stripe/PayPal (и др.) достижимы снаружи по HTTPS; секреты подписи совпадают с PSP. |
| Health | `GET /health/` доступен с монитора/балансировщика (или внутренняя прова на контейнер). |

### D. Deploy steps (ориентир)

Команды зависят от того, **Docker** на сервере или bare-metal; ниже — типичный путь для compose из этого репозитория.

1. **Подтянуть код**: `git fetch` / `git checkout <tag|branch>` на целевой коммит.
2. **Зависимости**: пересобрать образ или обновить venv (`pip install -r requirements.txt` в контейнере/на хосте — по вашей схеме).
3. **`collectstatic`**: `python manage.py collectstatic --noinput` (пользователь/контейнер приложения).
4. **Простой (по политике)**: кратко вывести backend из приёма запросов или использовать rolling update.
5. **`migrate`**: `python manage.py migrate --noinput` после бэкапа (раздел A).
6. **Перезапуск**: `docker compose up -d` (или `restart` сервиса backend) — см. ваш `docker-compose.yml`.
7. **Логи старта**: убедиться в отсутствии traceback при подъёме Gunicorn.

Пример из графы «Запуск бэкенда» (startup) см. выше в этом файле: `createcachetable` → `collectstatic` → `migrate` → `gunicorn`.

### E. Smoke checks (после выката)

| Проверка | Примечание |
|----------|------------|
| **`GET /health/`** | 200 и `{"status":"ok","db":"ok"}` с внешнего или внутреннего клиента. |
| **OpenAPI / Swagger** | В коде: `GET /schema/`, UI `/schema/swagger/`, `/schema/redoc/` (`backend/backend/urls.py`). Если Swagger открыт в интернет — **ограничить** по IP/VPN; предпочтительно только internal/staging. |
| **Admin** | Вход в Django admin под сервисной учёткой; нет 500 после релиза. |
| **Оплата** | Реальные списания и тестовые карты — только на **staging/test** или тестовом режиме PSP. **Не** гонять тестовые платежи на production без процедуры. |
| **Webhooks** | Доставка тестового события от PSP к вашему URL (или сверка последних записей в провайдере) — без раскрытия секретов в доках. |
| **Почта** | Транзакционное письмо (например сброс пароля на тестовый ящик на **staging**). |
| **Sentry** | Одно **контролируемое** исключение на staging (или безопасный тестовый ивент), что события доходят; на production — только по согласованию, чтобы не засорять прод-проект. |

### F. Rollback

1. **Откат кода**: вернуть предыдущий образ/commit/tag; перезапустить приложение как при обычном деплое.
2. **Миграции**: если откат кода **без** отката миграций — приложение может не стартовать; иметь план **обратных миграций** только если они есть и протестированы; иначе предпочтительно **повторный выкат исправления вперёд**.
3. **База данных**: **не** восстанавливать дамп «вслепую» после того, как на новой версии уже были **успешные записи** в БД — риск потери данных. Restore — только при явном инциденте и процедуре из [`database-backup-restore.md`](./operations/database-backup-restore.md).
4. **Проверка после отката**: `/health/`, ключевые логи, Sentry — нет повторяющихся ошибок деплоя.

### G. Post-deploy monitoring

| Источник | Что смотреть |
|----------|----------------|
| Файловые логи backend | При логировании в файлы: `backend/logs/errors.log`, `backend/logs/payment.log` и др. — рост ошибок, tracebacks после релиза. |
| Sentry | Новые issues, регрессии по релизу; алерты по проекту. |
| Webhooks | Ответы 4xx/5xx на URL webhook у PSP; дашборды провайдера. |
| Почта | Очередь/доставка, bounce при массовых рассылках. |
| Курьерские API | Ошибки создания/печати этикеток (Packeta/GLS/DPD) в логах приложения. |

### Краткая сводка тем (пересекается с разделом B)

| Тема | Что проверить |
|------|----------------|
| **DEBUG** | `DEBUG=False` в production. |
| **SECRET_KEY** | Задана, не совпадает с примером из репозитория. |
| **ALLOWED_HOSTS** | Явный список; `*` в production — только осознанно. |
| **CSRF / CORS** | Ориджины в коде соответствуют реальным фронтам/доменам. |
| **HTTPS / proxy** | Nginx + `SECURE_PROXY_SSL_HEADER`; при необходимости политика `SECURE_SSL_REDIRECT` согласована с редиректами Nginx. |
| **Secure cookies** | Фактическая связка nginx + Django при приёмке; целевые флаги cookie — в roadmap Task 010. |
| **Sentry** | DSN + `DEBUG=False` на backend. |
| **Логирование** | Ротация, диск, уровень на production. |
| **Health** | Мониторинг `GET /health/`; БД down → **503**. |
| **Спец. флаги** | `ENABLE_DELIVERY_DEV_ENDPOINTS=False` на production. |

## Мониторинг и алерты

### Sentry

Интеграция для Django и React на backend стороне включается **одновременно** при выполнении **всех** условий: задан переменная `SENTRY_DSN` и **`DEBUG=False`**. Если DSN указан при `DEBUG=True` (локальная разработка), **Django не отправляет** события в Sentry по текущей логике `settings.py`. Фронт: отдельно через `VITE_SENTRY_DSN` при сборке (см. шаблоны env).

| Компонент | Env-переменная | Файл шаблона |
|-----------|---------------|--------------|
| Django backend | `SENTRY_DSN` | `envs/backend.env.example` |
| React frontend | `VITE_SENTRY_DSN` | `Frontend/Frontend3/.env.example` |

**Настройки безопасности (backend, см. код):**
- `send_default_pii=False`
- `before_send`: чувствительные ключи в теле запроса (напр. password, token, api_key, iban…) заменяются на `[Filtered]` — фильтрация точечная, не замена полному audit логирования
- `traces_sample_rate=0.1`

Получить DSN: Sentry → Project → Settings → Client Keys (DSN). DSN не коммитить.

## Backup

**Runbook:** [`docs/operations/database-backup-restore.md`](./operations/database-backup-restore.md) — `pg_dump` (custom / plain), безопасный перенос дампа, восстановление в **локальный e2e** (`docker-compose.e2e.yml`, `./backups` → `/backups`, порт **`5434`**), полный сброс e2e-тома, проверки, safety (PII/GDPR), `.gitignore`.

Стратегия **Cloudinary / медиа** на production и регламент частоты бэкапов на сервере — по-прежнему задаются командой эксплуатации (в этом файле детализируются только при необходимости отдельным обновлением).

## Rollback

Полная процедура — в **разделе F** ([Production deployment runbook](#production-deployment-runbook)). Кратко: откат кода/образа; восстановление БД из бэкапа — только при необходимости и осознанном риске (см. [`database-backup-restore.md`](./operations/database-backup-restore.md)); не затирать базу после успешных записей новой версией без анализа.
