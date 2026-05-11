# Локальный e2e-контур (Docker) для ручной проверки API

Отдельный стек от production и от **pytest**-стека (`docker-compose.test.yml`): собственные тома PostgreSQL и media, SMTP через **Mailpit**, Django на `runserver` со статикой. Назначение — end-to-end и ручные сценарии (Postman, браузер, Stripe test mode) без затрагивания боевой БД и без рассылки реальных писем.

## Назначение

- Проверка полной цепочки: аутентификация → создание Stripe Checkout → оплата в тестовом режиме → webhook → создание сущностей в БД → письма в Mailpit.
- Работа с **реальными тестовыми ключами** Stripe (и при необходимости других провайдеров) в изолированном окружении.
- Быстрая проверка OpenAPI-контрактов и админки на свежей миграции.
- Детальный ручной сценарий Stripe: [`stripe-e2e-checklist.md`](./stripe-e2e-checklist.md).

Production-стек (`docker-compose.yml`, `envs/database.env`, `envs/backend.env`, `.reli_db`) **не используется**.

## Сервисы

| Сервис (Compose) | Контейнер | Назначение |
|------------------|-----------|------------|
| `postgres_e2e` | `reli_postgres_e2e` | PostgreSQL 17, данные в `./.reli_e2e_db/postgres`, опционально `./backups` смонтирован в контейнер |
| `mailpit` | `reli_mailpit_e2e` | Ловушка SMTP + веб-UI просмотра писем |
| `backend_e2e` | `reli_backend_e2e` | Django: `migrate` → `collectstatic` → `runserver 0.0.0.0:8000 --insecure` |

Файл: `docker-compose.e2e.yml`.

## URL и порты (хост)

| Назначение | URL |
|------------|-----|
| Backend API | http://localhost:8000 |
| Django Admin | http://localhost:8000/admin/ |
| Swagger / OpenAPI | http://localhost:8000/schema/swagger/ |
| Mailpit (UI) | http://localhost:8025 |
| PostgreSQL (с хоста) | `localhost:5434` → `5432` в контейнере |

**Заметка:** в `docker-compose.e2e.yml` для `backend_e2e` задано `DEBUG: "True"` (перекрывает значение из env-файла), чтобы удобнее отлаживать; статика отдаётся через `collectstatic` + `--insecure`.

## Env-файлы (обязательно перед первым запуском)

Из **корня репозитория**:

```bash
cp envs/database.e2e.env.example envs/database.e2e.env
cp envs/backend.e2e.env.example envs/backend.e2e.env
```

Compose подключает именно **`envs/database.e2e.env`** и **`envs/backend.e2e.env`** (без суффикса `.example`). Примеры в репозитории — шаблоны; заполните тестовые ключи Stripe и остальное по необходимости. **Не коммитьте** заполненные файлы с секретами (они должны быть в `.gitignore`, если добавляете локально — проверьте правила игнора).

## Запуск

```bash
docker compose -f docker-compose.e2e.yml up --build
```

Первый старт может занять время из-за миграций и `collectstatic`.

Первый доступ в **Django Admin:** при необходимости создайте суперпользователя:

```bash
docker compose -f docker-compose.e2e.yml exec backend_e2e python manage.py createsuperuser
```

## Остановка

```bash
docker compose -f docker-compose.e2e.yml down
```

`down` удаляет контейнеры сети compose; **том данных PostgreSQL** (`./.reli_e2e_db/postgres`) по умолчанию сохраняется на диске.

## Полный сброс e2e-БД

1. Остановить стек: `docker compose -f docker-compose.e2e.yml down`.
2. Удалить каталог данных кластера на машине разработчика: **`./.reli_e2e_db/postgres`** (в корне репозитория, рядом с `docker-compose.e2e.yml`).
3. При следующем `up` PostgreSQL поднимется пустым, backend снова выполнит `migrate`.

При необходимости сбросить загруженные медиа e2e: каталог **`./media_e2e`**.

## Подключение к PostgreSQL

С хоста (например, `psql`, DBeaver, DataGrip):

- **Host:** `localhost`
- **Port:** `5434`
- **Database / User / Password:** как в скопированном `envs/database.e2e.env` (структура совпадает с `envs/database.e2e.env.example` в корне репозитория).

Внутри Docker-сети хост БД для backend — `postgres_e2e`, порт `5432` (уже прописан в env для контейнера).

## Mailpit

**Назначение:** весь исходящий SMTP из Django попадает в Mailpit, наружу письма не уходят.

В шаблоне `envs/backend.e2e.env.example` уже задан backend:

- `EMAIL_HOST=mailpit`
- `EMAIL_PORT=1025`

**Как пользоваться:**

1. Откройте http://localhost:8025 .
2. Выполните действие в приложении, которое шлёт письмо (например, завершение оплаты с генерацией инвойса — если включена рассылка).
3. Письма отображаются в списке; можно смотреть HTML/текст и заголовки.

SMTP-порт **1025** при необходимости проброшен на хост.

## Webhook Stripe: ngrok, Stripe CLI и хосты

Локальный backend по умолчанию доступен только на `localhost`. Чтобы Stripe мог достучаться до **`POST /api/stripe-webhook/`**, нужен публичный URL.

**Варианты:**

1. **Stripe CLI** (часто удобнее для разработки): `stripe listen --forward-to http://localhost:8000/api/stripe-webhook/` — см. раздел про секрет ниже.
2. **ngrok (или аналог):** туннель на `http://localhost:8000`, в Dashboard Stripe указываете `https://<subdomain>.ngrok-free.app/api/stripe-webhook/`.

**ALLOWED_HOSTS:** в шаблоне e2e задано `ALLOWED_HOSTS="*"`, чтобы Django принимал запросы с произвольным `Host` (в т.ч. домен ngrok). Используйте это **только** в локальном e2e-контуре, не в production.

## Обновление `STRIPE_WEBHOOK_ENDPOINT_SECRET`

Переменная **`STRIPE_WEBHOOK_ENDPOINT_SECRET`** в `envs/backend.e2e.env` должна совпадать с секретом подписи для того канала, которым приходит webhook:

| Источник | Что сделать |
|----------|-------------|
| **Stripe CLI** | В выводе `stripe listen` показывается **webhook signing secret** (`whsec_...`). Скопируйте в `envs/backend.e2e.env`. |
| **Stripe Dashboard** | Developers → Webhooks → ваш endpoint → **Signing secret**. |

После изменения `.env` перезапустите контейнер backend, чтобы подхватить env (например, `docker compose -f docker-compose.e2e.yml up -d --build` или `restart` сервиса `backend_e2e`). Пока секрет не совпадает, `StripeWebhookView` вернёт ошибку верификации подписи (несмотря на успешную оплату в Checkout).

## Проверка `create-stripe-payment` (кратко)

Краткая последовательность; **полный пошаговый чеклист** (Postman, идемпотентность, логи, негативные кейсы): [`stripe-e2e-checklist.md`](./stripe-e2e-checklist.md).

1. Получите JWT (регистрация / логин — см. Swagger, раздел **accounts**).
2. `POST http://localhost:8000/api/create-stripe-payment/` с `Authorization: Bearer <token>` и телом из OpenAPI (тег **Stripe**).
3. Откройте `checkout_url` в браузере, оплатите тестовой картой.
4. Убедитесь, что webhook дошёл до `POST /api/stripe-webhook/` (Stripe CLI или ngrok + Dashboard).

Путь webhook: **`POST http://localhost:8000/api/stripe-webhook/`** (для туннеля — тот же путь на публичном базовом URL).

## Проверка Payment, Order, OrderProduct, Invoice

После успешного webhook:

1. **Django Admin:** http://localhost:8000/admin/  
   - **Payments** — приложение `payment` (в т.ч. связь с `session_id` Stripe).  
   - **Orders**, **Order products** — приложение `order` (строки заказа видны в инлайнах у заказа или отдельным списком).  
   - **Invoices** — приложение `order`; в списке есть ссылка на связанный Payment и скачивание PDF, если файл создан.
2. **Связность:** одна успешная сессия Checkout обычно соответствует одной записи **Payment** и одной или нескольким **Order** (по продавцам), строкам **OrderProduct**, при отработавшей генерации — **Invoice**.

Альтернатива: запросы к PostgreSQL на `localhost:5434` (см. выше).

## Безопасность: prod, backup, env и медиа

- **Не использовать** `docker-compose.e2e.yml` и e2e-env как образец для production: широкие `ALLOWED_HOSTS`, тестовые пароли БД в примерах и отладочный режим в compose предназначены только для локальной проверки.
- **Не коммить** заполненные `envs/backend.e2e.env` / `envs/database.e2e.env`, если в них появились реальные ключи; держите секреты вне репозитория (локально, vault, secret manager).
- **Не коммить** production-дампы БД, бэкапы с PII, выгрузки заказов/платежей с боевого сервера.
- **Не распространять** через git каталоги **`media_e2e`** / **`static_e2e`**, если туда попали загрузки с персональными данными (документы, адреса в файлах и т.д.).
- В репозитории допустимы только **`*.env.example`** с плейсхолдерами и документация без секретов.

## Файлы репозитория

| Файл | Назначение |
|------|------------|
| `docker-compose.e2e.yml` | `postgres_e2e`, `mailpit`, `backend_e2e` |
| `envs/database.e2e.env.example` | пример переменных PostgreSQL для e2e |
| `envs/backend.e2e.env.example` | пример Django / интеграций (в т.ч. Mailpit SMTP, Stripe) |

## Связанные документы

- `docs/testing/stripe-e2e-checklist.md` — **ручной чеклист Stripe** (Postman, webhook, идемпотентность, логи, негативные сценарии).
- `docs/08-testing-strategy.md` — общая стратегия тестов и ссылка на этот контур.
- `docs/07-deployment.md` — production compose; e2e **не** является деплоем.
- `docs/testing/postgres-integration-tests.md` — **другой** стек (`docker-compose.test.yml`) под pytest / integration tests.
