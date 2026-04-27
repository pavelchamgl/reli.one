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

## Мониторинг и алерты

> TODO: Есть ли Sentry, Datadog, Prometheus, uptime-мониторинг?

## Backup

> TODO: Описать стратегию резервного копирования БД и медиафайлов.

## Rollback

> TODO: Описать процедуру отката при неуспешном деплое.
