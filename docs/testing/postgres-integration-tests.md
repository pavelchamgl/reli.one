# PostgreSQL: интеграционные тесты backend в Docker

Отдельный стек от production: свой `docker-compose.test.yml`, свой том данных PostgreSQL и примеры env (`*.test.env.example`). Production `docker-compose.yml`, `envs/database.env`, `envs/backend.env` и каталог `.reli_db/postgres` не используются.

Ручной e2e-контур (Mailpit, Postman, Stripe test) — **другой** файл: `docker-compose.e2e.yml`; см. [`e2e-local-contour.md`](./e2e-local-contour.md).

## Зачем

Часть тестов (например, `payment/test_checkout_flow.py`, классы `*WebhookFlowTests`) ожидает реальный PostgreSQL: в `backend.settings` при заданных `DB_*` используется `django.db.backends.postgresql_psycopg2`. Локальный запуск pytest без доступного хоста `DB_HOST` приводит к ошибке резолва (типичный прод-хост `postgres_db` из Docker-сети недоступен с хоста macOS).

## Подготовка один раз

Из корня репозитория:

```bash
cp envs/database.test.env.example envs/database.test.env
cp envs/backend.test.env.example envs/backend.test.env
```

При необходимости поменяйте пароли в `database.test.env` (и согласованный `POSTGRES_PASSWORD`). Секреты не коммитить.

## Запуск

Команда по умолчанию в сервисе `backend_test` — pytest для `payment/test_checkout_flow.py`:

```bash
docker compose -f docker-compose.test.yml run --rm backend_test
```

Свой набор тестов или флаги:

```bash
docker compose -f docker-compose.test.yml run --rm backend_test pytest payment/test_checkout_flow.py::PayPalWebhookFlowTests -v
```

Зависимый сервис `postgres_test` поднимается автоматически при `run` (если не указан `--no-deps`). Данные кластера хранятся в `./.reli_test_db/postgres` (каталог в `.gitignore`).

## Остановка и очистка контейнеров

```bash
docker compose -f docker-compose.test.yml down
```

Полный сброс данных PostgreSQL для тестов: удалить каталог `.reli_test_db` на машине разработчика (контейнеры должны быть остановлены).

## Как это стыкуется с Django

В контейнере `backend_test` переменные задаются через `env_file` в Compose. В `settings` вызывается `load_dotenv` для `envs/database.env` и `envs/backend.env`, но **уже установленные** переменные окружения **не перезаписываются** (поведение python-dotenv по умолчанию). Поэтому `database.test.env` и `backend.test.env` остаются источником правды для CI/тестового compose без подмены production-файлов.

`MEDIA_ROOT` — каталог `backend/media` внутри смонтированного `./backend`; путей вида `/opt/reli/...` в test-compose нет.

## Файлы

| Файл | Назначение |
|------|------------|
| `docker-compose.test.yml` | `postgres_test`, `backend_test` |
| `envs/database.test.env.example` | пример БД для тестового стека |
| `envs/backend.test.env.example` | пример Django/сервисных переменных для тестов |
