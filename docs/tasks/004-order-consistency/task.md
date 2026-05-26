# Task 004 — Order Consistency

**Priority:** P1  
**Complexity:** Medium  

> **Именование:** обсуждаемое как «**Task 004 Payment Cleanup**» здесь сведено к **закрытию платежного контура по repo-scope**. Канон постановки и истории кода — **[Task 003 — Payment refactor](../003-payment-refactor/task.md)**. Этот файл исторически описывает **Order Consistency**; сверху зафиксирован **финальный аудит payment cleanup**, ниже — **финальное состояние structural Order Consistency** и сохранённый historical plan.

**Status:** **DONE (repo-scope)** для **Payment cleanup** и **DONE (repo-scope)** для **structural Order Consistency** — см. [Final DoD table](#final-dod-table) и [Order domain final state](#order-domain-final-state-and-historical-plan). **Production / live PSP acceptance** и **production migration verification** репозиторий **не** утверждает: это ручные ops/manual проверки на соответствующих контурах.

---

## Финальный аудит — Payment cleanup (repo-scope)

Критерии проверены по документам, тестам и локальному контенту в git (май 2026). **Согласовано с [Task 010 — DevOps](../010-devops-infrastructure/task.md):** промокоды и складской резерв (**Task 013**) **не** входят в scope платежного закрытия и **не** блокируют его (аналогично Deferred в Task 010).

### Final DoD table

| Item | Status | Evidence | Remaining action |
|------|--------|----------|------------------|
| Payment flow стабилизирован (checkout, webhook, уникальность `Payment`) | **Done** | [Task 003](../003-payment-refactor/task.md) → Done; `backend/payment/` | Боевая приёмка PSP — только вручную на контуре |
| Stripe / PayPal smoke (local/sandbox) | **Done** | [`stripe-e2e-checklist.md`](../../testing/stripe-e2e-checklist.md), [`paypal-e2e-checklist.md`](../../testing/paypal-e2e-checklist.md) | Production smoke — вне git |
| Webhook replay / идемпотентность | **Done** | Автотесты `payment/`; [`payment-flow.md`](../../payment-flow.md) | — |
| Negative webhook tests и документация | **Done** (с follow-up) | Task 003: матрица HTTP/verify; остаётся опциональный follow-up по ветке `api_get` CAPTURE — **не блокер** | Расширять ветки по желанию |
| Документация payment flow | **Done** | [`payment-flow.md`](../../payment-flow.md) → локальный e2e, Task 003 | Обновлять при смене контрактов |
| Full `pytest` backend | **Done** | `docker-compose.test.yml` → `pytest -q`; CI | Держать зелёным в PR |
| **PromoCode** в цепочке оплаты | **Исключено из scope** | Task 003 Deferred; Task 010 Deferred | Отдельная задача при возврате фичи |
| **Stock reservation / [Task 013](../013-stock-reservation/task.md)** | **Исключено из scope** | design-only / future; Task 010 | Не блокирует платежный контур |
| Order domain (структурная консистентность) | **Done (repo-scope)** | `backend/order/migrations/0009_order_consistency.py`, `backend/order/constants.py`, `backend/order/order_status_names.py`; DoD ниже | Production migration verification — manual/ops |

---

## Regression gate — Docker test matrix + e2e (2026-05-12)

Интеграционный regression pass по связке **payment ↔ order** (Docker test matrix). Цель — зафиксировать состояние репозитория перед закрытием payment cleanup; structural Order Consistency закрыта отдельным repo-scope evidence ниже.

### Commands run

Из корня репозитория (каталог с `docker-compose.test.yml`):

```bash
docker compose -f docker-compose.test.yml run --rm backend_test python manage.py check
docker compose -f docker-compose.test.yml run --rm backend_test pytest payment/ -q
docker compose -f docker-compose.test.yml run --rm backend_test pytest order/ -q
docker compose -f docker-compose.test.yml run --rm backend_test pytest -q
```

Проверка e2e-контура (ожидалось: migrate без ошибок, collectstatic, runserver):

```bash
docker compose -f docker-compose.e2e.yml up --build -d
# фактически выполнялся полный rebuild образа backend_e2e; см. Results
```

### Results

| Шаг | Результат |
|-----|-----------|
| `manage.py check` | OK — `System check identified no issues (0 silenced).`, exit 0 |
| `pytest payment/ -q` | OK, exit 0 |
| `pytest order/ -q` | OK, exit 0 |
| `pytest -q` (полный backend) | OK, exit 0 |
| `docker-compose.e2e.yml up --build` | См. блок **E2e follow-up** ниже |

### E2e follow-up (2026-05-12, после очистки Docker)

После `docker system prune` / освобождения места первая попытка `compose pull` дала сетевые `EOF` с Docker Hub (`postgres`, `mailpit`) — типичная нестабильность канала; образы докачались с повторными `docker pull`.

Выполнено:

```bash
docker pull postgres:17
docker pull axllent/mailpit:latest
# из корня репозитория:
docker compose -f docker-compose.e2e.yml build backend_e2e
docker compose -f docker-compose.e2e.yml up -d
docker compose -f docker-compose.e2e.yml logs backend_e2e --tail 150
```

**Лог `backend_e2e`:** миграции без ошибок (`No migrations to apply.`), `collectstatic` (`184 static files copied`), затем `Starting development server at http://0.0.0.0:8000/`. Контейнеры в статусе Up (postgres healthy, mailpit, backend на `:8000`).

### Known warnings

1. **Docker Compose — orphan containers:** при `docker-compose.test.yml` выводится предупреждение о контейнерах другого compose-проекта (`reli_backend_e2e`, `reli_postgres_e2e`, `reli_mailpit_e2e`). На результат проверок не влияет; при уборке: `docker compose -f docker-compose.test.yml up --remove-orphans` или остановить e2e stack.
2. **dj-rest-auth / django-allauth:** при импорте регистрационных serializer’ов — `UserWarning` про устаревшие `app_settings.USERNAME_REQUIRED` / `EMAIL_REQUIRED` (рекомендация перейти на `SIGNUP_FIELDS`). Источник — зависимости, не код приложения; дублируется в `manage.py check` и pytest warnings summary.
3. **E2e rebuild:** в логе сборки — стандартное предупреждение pip про установку от root в образе.
4. **Docker Hub:** после полной очистки локальных образов возможны обрывы (`EOF`) при `pull`; помогают повторы или отдельные `docker pull` до успеха.

### Remaining ops / manual actions

- После проверки при желании остановить стек: `docker compose -f docker-compose.e2e.yml down`.
- При сбоях pull с Hub — повторить `docker pull` или сменить сеть/VPN; не ошибка приложения.
- По желанию: `docker compose -f docker-compose.test.yml ... --remove-orphans`, чтобы убрать предупреждение про orphan containers.

### Артефакты вне этого gate

Уже зафиксированы отдельно (не перезапускались в этом прогоне): локальный e2e, Stripe/PayPal smoke, webhook lifecycle tests, актуальные docs по payment — см. связанные задачи и `docs/testing/*`.

---

## Order domain final state and historical plan

**Структурная часть Task 004 — закрыта repo-scope.** Фактическое состояние репозитория:

- `backend/order/migrations/0009_order_consistency.py` фиксирует `Order.user → SET_NULL`, `OrderStatus.name unique=True` и индексы на `Order` / `OrderProduct`.
- `backend/order/constants.py` и `backend/order/order_status_names.py` централизуют доменные статусы.
- `OrderProduct.received_at` использует timezone-aware значение.
- `order/` и `reviews/` тесты проходили по task evidence (`40 passed`, 2026-05-18).

Ниже сохранён historical plan по консистентности домена заказа. Production migration verification не утверждается этим документом без отдельного ops evidence.

## Цель

Устранить проблемы консистентности данных в order domain: хрупкие строковые статусы, потеря заказов при удалении пользователя, некорректные временные метки.

## Контекст

Заказы в домене **создаются в том числе после успешной оплаты** (webhook → `payment` → `order`). Архитектура платежей и типовый troubleshooting: **[`docs/payment-flow.md`](../../payment-flow.md)** (Stripe/PayPal, metadata, идемпотентность, письма, replay).

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

- [x] `Order.user` → `on_delete=SET_NULL, null=True, blank=True` (миграция 0009, 2026-05-18)
- [x] `OrderStatus.name` → `unique=True` (миграция 0009, 2026-05-18)
- [x] Создан `backend/order/constants.py` с константами статусов (2026-05-18)
- [x] Строковые сравнения статусов: delivery/utils.py исправлен; остальные raw-строки — документация/API-ключи (не бизнес-логика)
- [x] `OrderProduct.received_at` использует `timezone.now()` (было уже корректно)
- [x] Добавлены индексы: `(user, order_status)`, `(order_date)` на Order; `(seller_profile, status)` на OrderProduct (миграция 0009, 2026-05-18)
- [x] Все тесты order/ reviews/ проходят (40 passed, exit 0, 2026-05-18; +3 SET_NULL регрессии)

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
- [x] Analysis complete (минимальный артефакт в коде)

**Результат (2026-05):** добавлен класс **`OrderStatusStringFragilityTests`** в `backend/order/tests.py` — две строки статуса, отличающиеся регистром, создают **разные** строки БД (нет нормализации / `unique` на `OrderStatus.name`). Полный аудит списка мест со строковыми статусами — по мере итераций **Iteration 2** (миграции/константы).

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
- [x] Tests written (2026-05-18, Task 012 follow-up)

### Iteration 2 — Validation (2026-05-18)

Добавлен класс `OrderUserDeletionTests` в `backend/order/tests.py` (3 теста):

| Тест | Что проверяет |
|------|---------------|
| `test_order_survives_user_deletion` | `user.delete()` не каскадирует удаление заказа |
| `test_order_user_is_none_after_user_deletion` | `order.user is None` после удаления пользователя |
| `test_order_str_safe_after_user_deletion` | `str(order)` не бросает `AttributeError`; содержит `"deleted_user"` и `order_number` |

```bash
docker compose -f docker-compose.test.yml run --rm backend_test pytest order/ reviews/ -q
# → 40 passed, exit 0  (было 37 до добавления тестов)
```

---

## Iteration 3 — Migration & Constants

### Итерация 3a — Constants (2026-05-18)

**Аудит raw-строк (полный):**

| Место | Строка | Тип | Решение |
|-------|--------|-----|---------|
| `order/order_status_names.py` | все | определение констант | уже был, используется везде |
| `delivery/utils.py:156` | `"awaiting_shipment"` | DB-фильтр | **заменено** → `ProductStatus.AWAITING_SHIPMENT` |
| `order/seller_views.py` (enum/examples) | `"Pending"`, `"Shipped"` и др. | OpenAPI-документация | оставлено — не логика |
| `analytics/services.py` (dict keys) | `"awaiting_assembly"` и др. | ключи ответа API-контракта | оставлено — изменение нарушит контракт |
| `analytics/tests.py` | то же | тестовая фикстура | оставлено |

**Созданные артефакты:**

- `backend/order/constants.py` — единый модуль для всех констант домена:
  - `OrderStatusName` — re-export из `order.order_status_names` (backward compat)
  - `DeliveryStatusName` — новый класс (PENDING / IN_TRANSIT / DELIVERED / FAILED)
  - `OrderProductStatus` — re-export `ProductStatus` из `order.models`

**Изменённые файлы:**

| Файл | Изменение |
|------|-----------|
| `backend/order/constants.py` | **создан** |
| `backend/delivery/utils.py` | raw `"awaiting_shipment"` → `ProductStatus.AWAITING_SHIPMENT` |

**Не изменялось (intentional):**

- `order/order_status_names.py` — сохранён, всё ещё canonical import-path (10+ файлов)
- `order/models.py` — `ProductStatus` TextChoices остаётся в models; не дублируется
- Миграции — не создавались (не входит в scope итерации)
- Business logic — не изменялась

**Валидация:**

```bash
# Статическая (синтаксис + линтер):
python3 -c "import ast; ..." # OK — order/constants.py, order/order_status_names.py, delivery/utils.py
# Linter: 0 ошибок
```

```bash
# Docker-тесты (требуется запущенный Docker daemon, выполнить вручную):
docker compose -f docker-compose.test.yml run --rm backend_test pytest order/ reviews/ -q
```

**Статус:**
- [x] `constants.py` создан
- [x] Raw-строка в `delivery/utils.py` заменена на константу
- [x] Docker-тесты `order/ reviews/` — закрыто evidence в Iteration 2/3b (`40 passed`, 2026-05-18)
- [x] Миграции — закрыто `backend/order/migrations/0009_order_consistency.py`

---

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

### Итерация 3b — Migrations & Indexes (2026-05-18)

**Изменённые файлы:**

| Файл | Изменение |
|------|-----------|
| `backend/order/models.py` | `Order.user` → `SET_NULL, null=True, blank=True`; `Order.__str__` null-safe; `OrderStatus.name unique=True`; добавлены индексы |
| `backend/order/migrations/0009_order_consistency.py` | **создан** |

**Детали изменений в `models.py`:**

- `OrderStatus.name` → `unique=True` (защита от дублей)
- `Order.user` → `on_delete=SET_NULL, null=True, blank=True` (GDPR / финансовое хранение)
- `Order.__str__` → null-safe: `self.user.email if self.user_id else "deleted_user"`
- `Order.Meta.indexes` += `(user, order_status)`, `(order_date)`
- `OrderProduct.Meta.indexes` += `(seller_profile, status)`
- `OrderProduct.received_at` — уже использовал `timezone.now()`, не изменялся

**Миграция `0009_order_consistency`:**
- `AlterField` OrderStatus.name → unique
- `AlterField` Order.user → SET_NULL / null
- `AddIndex` order_user_status_idx
- `AddIndex` order_orderdate_idx
- `AddIndex` orderproduct_seller_status_idx

**Валидация (2026-05-18):**

```bash
docker compose -f docker-compose.test.yml run --rm backend_test \
  python manage.py makemigrations --check --dry-run
# → exit 0, "No changes detected"

docker compose -f docker-compose.test.yml run --rm backend_test \
  pytest order/ reviews/ -q
# → 37 passed, exit 0
```

**Предупреждения для production:**
- `unique=True` на `OrderStatus.name`: перед apply проверить дубли:
  `SELECT name, COUNT(*) FROM order_orderstatus GROUP BY name HAVING COUNT(*) > 1`
- `SET_NULL` на `Order.user`: применять в maintenance window или через `CONCURRENTLY`
- Индексы добавляются блокирующим `CREATE INDEX`; для prod большой таблицы использовать `RunSQL + CONCURRENTLY`

---

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
- [x] constants.py created (2026-05-18)
- [x] Raw-string в delivery/utils.py заменена на константу (2026-05-18)
- [x] All business-logic string comparisons updated; analytics dict keys / OpenAPI examples intentionally remain API/docs strings
- [x] timezone-aware `received_at` confirmed in models.py
- [x] Migrations written — `backend/order/migrations/0009_order_consistency.py`

---

## Iteration 4 — Validation

### Тесты для запуска
```bash
pytest backend/order/ -v
pytest backend/reviews/ -v
```

### Repo-scope validation
- [x] `OrderStatus.name` поиск по точной строке работает
- [x] Константы в `constants.py` совпадают с canonical `order_status_names.py`
- [x] `Order.user.delete()` → order сохраняется с `user=None`
- [x] `order.received_at` в создаваемых заказах — timezone-aware
- [x] Индексы для `Order` / `OrderProduct` добавлены миграцией `0009_order_consistency.py`

### Production/manual validation
- [ ] Проверить отсутствие дублей `OrderStatus.name` на production DB перед применением unique migration
- [ ] Проверить production migration apply и, при больших таблицах, стратегию индексов без долгих блокировок
- [ ] Подтвердить performance impact через production/staging `EXPLAIN ANALYZE`, если понадобится

### Статус
- [x] Repo-scope validation complete
- [ ] Production migration verification — manual/ops, не подтверждается git evidence

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
