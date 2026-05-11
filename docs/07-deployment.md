# 07. Deployment

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

> TODO: Есть ли GitHub Actions / GitLab CI / другое?
> TODO: Описать pipeline: тесты → сборка образов → деплой.

## Процедура деплоя (ручной)

> TODO: Описать шаги ручного деплоя.

```bash
# TODO: примерный скрипт деплоя
git pull origin main
docker compose build
docker compose up -d --no-deps backend frontend1
```

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

## Production readiness checklist (ручная сверка)

Документ не заменяет `python manage.py check --deploy`; список — ориентир для ops и релиза. Конкретные значения задаются только через env/`envs/backend.env.example`, без копирования секретов в git.

| Тема | Что проверить |
|------|----------------|
| **DEBUG** | `DEBUG=False` в production (переменная окружения). |
| **SECRET_KEY** | Задана, не совпадает с dev-деволтом из примеров. |
| **ALLOWED_HOSTS** | Явный список хостов или корректный `ALLOWED_HOSTS` через env — не использовать `*` в production без понимания рисков. |
| **CSRF_TRUSTED_ORIGINS** | В `settings` заданы HTTPS-оригины публичного сайта; при новом домене — дополнить и задеплоить. |
| **HTTPS / proxy** | Nginx терминирует TLS (`SECURE_PROXY_SSL_HEADER`, `USE_X_FORWARDED_HOST` в коде уже ориентированы на работу за прокси); при смене схемы — сверить `SECURE_SSL_REDIRECT` при необходимости. |
| **Secure cookies** | При полном HTTPS за прокси убедиться, что браузерные cookie/CSRF соответствуют политике (явные `SESSION_COOKIE_SECURE` / `CSRF_COOKIE_SECURE` в коде можно добавить позже как отдельную задачу — сейчас зафиксируйте фактической конфиг nginx + Django при приёмке). |
| **Sentry backend** | `SENTRY_DSN` задан **и** `DEBUG=False`; иначе Django Sentry не инициализируется. |
| **Sentry frontend** | `VITE_SENTRY_DSN` на этапе сборки только если нужно событие в браузере. |
| **Логирование** | Ротация/объём логов на сервере, отсутствие DEBUG-шума в production. |
| **Health** | Проба `GET /health/` с балансировщика/мониторинга; при падении только БД — ожидать **503**. |
| **Спец. флаги** | Например `ENABLE_DELIVERY_DEV_ENDPOINTS=False` на production — см. `backend/backend/settings.py`. |

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

> TODO: Описать стратегию резервного копирования БД и медиафайлов.

## Rollback

> TODO: Описать процедуру отката при неуспешном деплое.
