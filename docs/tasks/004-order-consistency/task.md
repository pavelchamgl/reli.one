# Task 004 — Order Consistency

**Priority:** P1  
**Complexity:** Medium  
**Status:** Pending

## Цель

Устранить проблемы консистентности данных в order domain: хрупкие строковые статусы, потеря заказов при удалении пользователя, некорректные временные метки.

## Контекст

Order domain содержит несколько структурных проблем, которые не ломают систему прямо сейчас, но создают риски при масштабировании и юридические риски:

- `Order.user` → `CASCADE` → при удалении покупателя удаляются все его заказы, нарушая требование 10-летнего хранения финансовых данных (GDPR + налоговое законодательство ЧР/СК)
- Статусы заказа — строки в справочной таблице без `unique=True` и без константизации → опечатка ломает переходы незаметно
- `OrderProduct.received_at = datetime.now()` создаёт timezone-naive datetime при `USE_TZ=True` → некорректные временные метки в инвойсах
- Статусы используются как raw strings в 4+ файлах без центрального справочника

## Scope (область)

- Миграция `Order.user` → `SET_NULL`
- Добавление `unique=True` на `OrderStatus.name`
- Создание `backend/order/constants.py` с константами статусов
- Исправление `OrderProduct.received_at = timezone.now()`
- Добавление DB-индексов на `Order.user_id`, `Order.order_status_id`, `OrderProduct.seller_profile_id`
- Рефакторинг всех сравнений статусов на использование констант

## Не входит в задачу

- Изменение бизнес-логики переходов статусов
- Добавление новых статусов
- Изменение API-контрактов
- Реализация history/event sourcing для статусов

## Зависимости

- **Task 002 (testing-foundation)** — Core завершён; расширенные тесты lifecycle — **Task 012**

## Риски

- Миграция `SET_NULL` на `Order.user`: если есть код проверяющий `order.user is not None` — может изменить поведение → нужен предварительный аудит кода
- `unique=True` на `OrderStatus.name`: если в БД уже есть дубли — миграция упадёт
- Добавление индексов: безопасно, но требует `CREATE INDEX CONCURRENTLY` в prod (не блокирует таблицу)

## Definition of Done

- [ ] `Order.user` → `on_delete=SET_NULL` (миграция)
- [ ] `OrderStatus.name` → `unique=True` (миграция)
- [ ] Создан `backend/order/constants.py` с константами статусов
- [ ] Все строковые сравнения статусов заменены на константы
- [ ] `OrderProduct.received_at` использует `timezone.now()`
- [ ] Добавлены индексы на `Order.user_id`, `Order.order_status_id`
- [ ] Все тесты order lifecycle проходят

---

# Iterations

## Iteration 1 — Analysis

### Цель
Найти все места использования строковых статусов и зависимостей от `Order.user`.

### Действия
- Найти все `order_status.name == "..."` и `order_status__name=` в коде
- Найти все обращения к `order.user` (для оценки влияния SET_NULL)
- Проверить `Order.user CASCADE` → какие ещё FK на Order (Payment, OrderProduct)?
- Прочитать `backend/order/models.py` — все FK relationships
- Прочитать `backend/order/services/seller_order_actions.py` — логика переходов
- Проверить `backend/reviews/permissions.py` — там тоже сравнение статусов

### Output
- Полный список мест со строковыми статусами
- Влияние SET_NULL на все views/serializers
- Migration plan с правильным порядком применения

### Карта затронутых мест (известные)
```
backend/order/services/seller_order_actions.py   → OrderStatus.objects.filter(name="Pending")
backend/reviews/permissions.py                   → order_status.name == "Closed"
backend/order/seller_views.py                    → статусы через строки
```

### Статус
- [ ] Analysis complete

---

## Iteration 2 — Tests

### Цель
Зафиксировать текущее поведение переходов статусов и удаления пользователей.

### Тесты для написания

**Lifecycle transitions:**
```python
# backend/order/tests_lifecycle.py (целевой трек: Task 012 — order lifecycle extended tests)
class OrderStatusTransitionTest(TestCase):
    def setUp(self):
        # Создать OrderStatus записи через фикстуры
        for name in ["Pending", "Processing", "Shipped", "Closed", "Cancelled"]:
            OrderStatus.objects.create(name=name)

    def test_status_names_are_case_sensitive(self):
        # Убедиться что "Pending" != "pending"
        # Документирует текущую хрупкость

    def test_confirm_order_transitions_pending_to_processing(self):
        ...

    def test_status_comparison_uses_exact_string(self):
        # Что сейчас сравнение идёт через строку
        # После task: будет через константу
```

**User deletion:**
```python
class OrderUserDeletionTest(TestCase):
    def test_order_survives_user_deletion_after_migration(self):
        # После миграции SET_NULL:
        # user.delete() → order.user is None, order существует
        # (тест пишется для проверки ПОСЛЕ применения миграции)

    def test_order_without_user_still_accessible(self):
        # Order с user=None доступен по /api/orders/{id}/
```

### Статус
- [ ] Tests written

---

## Iteration 3 — Migration & Constants

### Цель
Применить миграции и создать централизованные константы.

### Шаг 1: Константы (без миграций)

**`backend/order/constants.py`** (новый файл):
```python
class OrderStatusName:
    PENDING = "Pending"
    PROCESSING = "Processing"
    SHIPPED = "Shipped"
    CLOSED = "Closed"
    CANCELLED = "Cancelled"

class DeliveryStatusName:
    PENDING = "Pending"
    IN_TRANSIT = "In Transit"
    DELIVERED = "Delivered"
    FAILED = "Failed"

class OrderProductStatus:
    AWAITING_ASSEMBLY = "awaiting_assembly"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELED = "canceled"
    CONTROVERSIAL = "controversial"
```

Обновить все места использования на импорт из `constants.py`.

### Шаг 2: Миграции (требуют review)

**`Order.user SET_NULL`:**
```python
# Migration plan:
# 1. ALTER TABLE order_order ALTER COLUMN user_id DROP NOT NULL
# 2. ALTER TABLE order_order ALTER COLUMN user_id
#    ADD CONSTRAINT ... FOREIGN KEY ... ON DELETE SET NULL
```

Migration strategy:
1. Написать migration файл
2. Протестировать на staging с реальными данными
3. Убедиться что user.delete() не каскадирует на заказы
4. Применить в prod в maintenance window

**`OrderStatus.name UNIQUE`:**
```python
class Migration(migrations.Migration):
    operations = [
        migrations.AlterField(
            model_name='orderstatus',
            name='name',
            field=models.CharField(max_length=100, unique=True),
        ),
    ]
```

**DB-индексы:**
```python
# Добавить в Order.Meta:
indexes = [
    models.Index(fields=["user_id", "order_status_id"]),
    models.Index(fields=["order_date"]),
]
# Добавить в OrderProduct.Meta:
indexes = [
    models.Index(fields=["seller_profile_id", "status"]),
]
```

### Шаг 3: timezone fix

```python
# backend/order/models.py
# ДО:
from datetime import datetime
self.received_at = datetime.now()

# ПОСЛЕ:
from django.utils import timezone
self.received_at = timezone.now()
```

### Затрагиваемые файлы
| Файл | Изменение |
|------|-----------|
| `backend/order/models.py` | SET_NULL, indexes, timezone fix |
| `backend/order/constants.py` | новый файл |
| `backend/order/services/seller_order_actions.py` | использование констант |
| `backend/reviews/permissions.py` | использование констант |
| `backend/order/seller_views.py` | использование констант |
| `backend/order/migrations/XXXX_*.py` | новые миграции |

### Статус
- [ ] constants.py created
- [ ] All string comparisons updated
- [ ] timezone.now() fix applied
- [ ] Migrations written

---

## Iteration 4 — Validation

### Тесты для запуска
```bash
pytest backend/order/ -v
pytest backend/reviews/ -v
```

### Сценарии для проверки
- [ ] `OrderStatus.name` поиск по точной строке работает
- [ ] Константы в `constants.py` совпадают с данными в БД
- [ ] `Order.user.delete()` → order сохраняется с `user=None`
- [ ] `order.received_at` в создаваемых заказах — timezone-aware
- [ ] Нет дублирующихся `OrderStatus` записей в БД
- [ ] Запросы списка заказов с индексами быстрее (EXPLAIN ANALYZE)

### Статус
- [ ] Validation complete

---

## Привязка к коду

| Тип | Файлы |
|-----|-------|
| **Модели** | `Order` (user SET_NULL, indexes), `OrderStatus` (unique), `OrderProduct` (timezone, indexes) |
| **Новые файлы** | `backend/order/constants.py` |
| **Изменяемые** | `seller_order_actions.py`, `reviews/permissions.py`, `seller_views.py` |
| **API** | Не меняются |
| **Интеграции** | Нет |

## Связанные проблемы из docs/09-architecture-debt.md

- DB-3: `Order.user` — CASCADE вместо SET_NULL P1
- DB-4: `OrderStatus` / raw strings P1
- DB-5: Нет критичных DB-индексов P1
- DB-7: `OrderProduct.received_at` timezone-naive P1
