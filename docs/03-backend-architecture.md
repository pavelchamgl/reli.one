# 03. Backend Architecture

## Обзор

Django 5.1 / DRF. Структура — набор независимых Django-приложений (apps), каждое отвечает за свой домен.

```
backend/
├── backend/          # Точка входа: settings.py, urls.py, wsgi.py
├── accounts/
├── analytics/
├── banners/
├── contactform/
├── delivery/
├── favorites/
├── news/
├── order/
├── payment/
├── product/
├── promocode/
├── reports/
├── reviews/
├── sellers/
├── supplier/
├── vacancies/
├── warehouses/
├── fixtures/
├── media/
├── static/
├── templates/
├── manage.py
└── requirements.txt
```

## Request lifecycle

```
Клиент → Nginx (TLS termination)
       → Gunicorn (4 workers, 0.0.0.0:8081)
       → Django WSGI
       → Middleware stack (CORS → Security → CSRF → Auth → …)
       → URL router
       → DRF View / ViewSet
       → Serializer
       → Model / ORM
       → PostgreSQL
```

## Аутентификация и авторизация

- **JWT** через `dj-rest-auth` + `simplejwt`: access 60 мин, refresh 20 дней
- **OAuth**: Google, Facebook (django-allauth)
- **OTP**: TODO — описать механизм
- **Роли**: TODO — описать permission-классы

## API

- **Формат:** REST, JSON
- **Версионирование:** TODO (сейчас нет?)
- **Документация:** drf-spectacular → `/schema/swagger/`, `/schema/redoc/`
- **Фильтрация:** django-filters
- **Пагинация:** TODO — описать тип и размер страницы

## Ключевые настройки (settings.py)

| Параметр | Значение | Примечание |
|----------|----------|-----------|
| `ALLOWED_HOSTS` | reli.one, www.reli.one, info.reli.one, … | Конкретные хосты |
| `CORS_ALLOW_ALL_ORIGINS` | False | Только явный список |
| `JWT_AUTH_SECURE` | True | Куки только по HTTPS |
| `DEBUG` | из env | TODO: убедиться что False в prod |
| `SECURE_SSL_REDIRECT` | False | TODO: проверить — SSL на nginx |

## Хранение медиа

- **Cloudinary** — изображения товаров и пользователей
- **Локальный `media/`** — TODO: что хранится локально?

## Фоновые задачи

> TODO: Есть ли Celery / cron? Опишите задачи.

## Кеширование

- `django_cache` таблица (createcachetable при старте)
> TODO: Описать что кешируется.

## Логирование

> TODO: Описать конфигурацию логирования Django.

## Структура URL

| Prefix | App |
|--------|-----|
| `/api/accounts/` | accounts |
| `/api/products/` | product |
| `/api/orders/` | order |
| `/api/` | payment, promocode, news, vacancies |
| `/api/delivery/` | delivery |
| `/api/banner/` | banners |
| `/api/reviews/` | reviews |
| `/api/favorites/` | favorites |
| `/api/sellers/` | sellers |
| `/api/sellers/orders/` | order (seller urls) |
| `/api/contact/` | contactform |
| `/admin/` | Django Admin |
| `/schema/swagger/` | drf-spectacular |
| `/reports/` | reports |
