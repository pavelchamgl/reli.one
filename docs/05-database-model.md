# 05. Database Model

> TODO: Заполнить по каждому приложению — ключевые модели, поля, связи.
> Диаграммы — Mermaid ER.

## СУБД

PostgreSQL 17. Подключение через `psycopg2`. Миграции — Django ORM.

## Схема (верхний уровень)

```mermaid
erDiagram
    CustomUser ||--o{ Order : places
    CustomUser ||--o{ Review : writes
    CustomUser ||--o{ Favorite : has
    CustomUser ||--o{ Seller : becomes

    Seller ||--o{ Product : owns
    Product }o--|| Category : "belongs to"
    Product ||--o{ Review : receives
    Product ||--o{ Favorite : in

    Order ||--o{ OrderItem : contains
    OrderItem }o--|| Product : references
    Order ||--o{ Payment : paid_by
    Order ||--o{ Delivery : shipped_by

    Promocode ||--o{ Order : applied_to
```

> TODO: Уточнить реальные связи по коду моделей.

## accounts

| Модель | Ключевые поля | Примечания |
|--------|---------------|------------|
| `CustomUser` | TODO | Кастомная модель, `AUTH_USER_MODEL` |

## product

| Модель | Ключевые поля | Примечания |
|--------|---------------|------------|
| `Product` | TODO | |
| `Category` | TODO | MPTT (django-mptt) |

> TODO: Атрибуты, изображения (Cloudinary), вариации?

## order

| Модель | Ключевые поля | Примечания |
|--------|---------------|------------|
| `Order` | TODO | Статусы: TODO |
| `OrderItem` | TODO | |

## payment

| Модель | Ключевые поля | Примечания |
|--------|---------------|------------|
| TODO | | |

## delivery

| Модель | Ключевые поля | Примечания |
|--------|---------------|------------|
| TODO | | |

## sellers

| Модель | Ключевые поля | Примечания |
|--------|---------------|------------|
| TODO | | |

## reviews

| Модель | Ключевые поля | Примечания |
|--------|---------------|------------|
| TODO | | |

## promocode

| Модель | Ключевые поля | Примечания |
|--------|---------------|------------|
| TODO | | Типы: TODO |

## Остальные приложения

> TODO: banners, news, vacancies, analytics, warehouses, supplier, contactform.

## Миграции

Миграции исключены из git (`.gitignore: */migrations`).

> TODO: Описать процесс применения миграций при деплое (сейчас: `manage.py migrate --noinput` в docker-compose command).

## Фикстуры

Файл `backend/fixtures/all_data.json` — TODO: описать назначение, когда применяется.
