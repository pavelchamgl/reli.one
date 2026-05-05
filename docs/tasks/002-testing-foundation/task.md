# Task 002 — Testing Foundation

**Priority:** P0  
**Complexity:** High  
**Status:** Pending

## Цель

Создать базовую инфраструктуру тестирования и написать regression-тесты для критических сценариев, чтобы сделать рефакторинг безопасным.

## Контекст

Текущее покрытие тестами ≈ 0% по критическим доменам (order, payment webhook, warehouses, delivery). Без тестов рефакторинг payment flow, order lifecycle и seller onboarding — неприемлемый риск регрессий. Эта задача — обязательное условие для tasks 003, 004, 005, 008.

Текущее состояние тестов:
| App | Тесты |
|-----|-------|
| payment | ~22 кейса (лучшее покрытие) |
| sellers | ~4 кейса (только onboarding validation) |
| accounts | ~4 кейса |
| delivery | 1 файл `test_seller_shipping.py` |
| order | 0 (пустой шаблон) |
| product | 0 (пустой шаблон) |
| warehouses | 0 |
| promocode | 0 |
| favorites, reviews, analytics, reports | 0 |

## Scope (область)

- Настройка `pytest-django` + `factory-boy` + `responses`
- Написание `conftest.py` с базовыми фикстурами
- Regression-тесты для payment webhook
- Regression-тесты для order lifecycle
- Regression-тесты для warehouse stock
- Regression-тесты для promocode concurrent usage
- Настройка GitHub Actions для запуска тестов
- Документация стратегии тестирования (`docs/08-testing-strategy.md`)

## Не входит в задачу

- Frontend тесты (отдельная задача)
- 100% coverage
- Performance tests
- E2E тесты

## Зависимости

- Task 001 (system-stabilization) — желательно завершить, чтобы тесты не проверяли сломанный код

## Риски

- Написание тестов может выявить новые P0 баги → они войдут в task 001 или отдельную задачу
- Сложные интеграционные тесты webhook требуют мокирования Stripe/PayPal SDK
- Фикстуры `OrderStatus` зависят от данных в БД — нужны фабрики с созданием lookup-записей

## Definition of Done

- [ ] `pytest.ini` или `pyproject.toml` настроен, тесты запускаются командой `pytest`
- [ ] `backend/conftest.py` с базовыми фикстурами (user, seller, product, order)
- [ ] Payment webhook: idempotency тест (дублирующий webhook не создаёт второй заказ)
- [ ] Order lifecycle: тест смены статуса Pending → Processing → Shipped
- [ ] Warehouse: тест конкурентного `decrease_stock` (overselling)
- [ ] PromoCode: тест атомарного `increment_used_count`
- [ ] CI: GitHub Actions workflow запускает тесты на каждый push
- [ ] `docs/08-testing-strategy.md` заполнен

---

# Iterations

## Iteration 1 — Analysis

### Цель
Понять текущую инфраструктуру тестирования и составить список необходимых фикстур.

### Действия
- Прочитать существующие тесты: `payment/tests.py`, `payment/test_checkout_flow.py`, `sellers/tests.py`, `delivery/test_seller_shipping.py`
- Изучить модели для создания фабрик: `CustomUser`, `Order`, `OrderProduct`, `Payment`, `WarehouseItem`, `PromoCode`
- Проверить наличие `pytest.ini` / `setup.cfg` / `pyproject.toml`
- Определить, какие `OrderStatus` записи требуются для тестов (зависимость от данных в БД)

### Output
- Список фикстур и фабрик для `conftest.py`
- Карта тестовых сценариев по приоритетам

### Статус
- [ ] Analysis complete

---

## Iteration 2 — Infrastructure Setup

### Цель
Настроить pytest-django, factory-boy и базовый conftest.

### Действия

**Установить зависимости** (добавить в `requirements.txt`):
```
pytest-django>=4.8
factory-boy>=3.3
faker>=25.0
responses>=0.25
freezegun>=1.4
pytest-cov>=5.0
```

**Создать `backend/pytest.ini`:**
```ini
[pytest]
DJANGO_SETTINGS_MODULE = backend.settings
python_files = tests.py test_*.py *_tests.py
python_classes = Test*
python_functions = test_*
addopts = --tb=short -q
```

**Создать `backend/conftest.py`:**
```python
import pytest
from django.test import TestCase

# Фикстуры:
# - user_customer: обычный покупатель
# - user_seller: верифицированный продавец
# - seller_profile: SellerProfile
# - base_product: BaseProduct с вариантом
# - warehouse_item: WarehouseItem
# - order_statuses: создание Pending/Processing/Shipped/Closed/Cancelled
# - stripe_metadata: StripeMetadata с populated basket
```

**Фабрики (`backend/factories.py`):**
```python
import factory
from accounts.models import CustomUser
from order.models import Order, OrderProduct, OrderStatus
from payment.models import Payment, StripeMetadata
from warehouses.models import Warehouse, WarehouseItem
from product.models import BaseProduct, ProductVariant
```

### Затрагиваемые файлы
- `backend/pytest.ini` (новый)
- `backend/conftest.py` (новый)
- `backend/factories.py` (новый)
- `requirements.txt` (обновить)

### Статус
- [ ] Infrastructure ready

---

## Iteration 3 — Critical Tests

### Цель
Написать regression-тесты для критических P0/P1 сценариев.

### Тесты: Payment Webhook Idempotency

**Файл:** `backend/payment/tests_webhook.py`

```python
class StripeWebhookIdempotencyTest(TestCase):
    """DB-1: session_id не уникален → двойной заказ"""

    def test_duplicate_stripe_webhook_creates_single_order(self):
        # 1. Создать StripeMetadata с populated корзиной
        # 2. POST /api/stripe-webhook/ с валидной подписью (мок)
        # 3. POST /api/stripe-webhook/ повторно с тем же session_id
        # Ожидаем: Order.objects.filter(session_id=...).count() == 1

    def test_duplicate_paypal_webhook_creates_single_payment(self):
        # Аналогично для PayPal
```

### Тесты: Order Lifecycle

**Файл:** `backend/order/tests_lifecycle.py`

```python
class OrderStatusTransitionTest(TestCase):
    """DB-4: статусы через строки в БД"""

    def test_confirm_order_pending_to_processing(self):
        # order.order_status.name == "Pending"
        # confirm_order(order, seller)
        # order.order_status.name == "Processing"

    def test_mark_as_shipped_requires_parcel(self):
        # order без DeliveryParcel → ValidationError

    def test_cancel_only_for_staff(self):
        # seller не может отменить → PermissionDenied

    def test_cancel_from_delivered_is_forbidden(self):
        # status Delivered → нельзя отменить
```

### Тесты: Warehouse Stock

**Файл:** `backend/warehouses/tests_stock.py`

```python
class WarehouseStockConcurrencyTest(TestCase):
    """DB-2: без select_for_update → overselling"""

    def test_decrease_stock_raises_on_insufficient(self):
        # quantity_in_stock = 5, qty = 10 → InsufficientStockError

    def test_decrease_stock_is_atomic(self):
        # Параллельный вызов двух decrease_stock(5) при quantity=8
        # Один должен упасть с ошибкой
```

### Тесты: PromoCode

**Файл:** `backend/promocode/tests_promo.py`

```python
class PromoCodeIncrementTest(TestCase):
    """DB-6: non-atomic increment"""

    def test_increment_used_count_is_atomic(self):
        # promo = PromoCode(max_usage=10, used_count=9)
        # Два параллельных increment → used_count == 11, не 10

    def test_promo_does_not_exceed_max_usage(self):
        # После used_count >= max_usage → нельзя применить
```

### Тесты: Accounts

**Файл:** `backend/accounts/tests_auth.py`

```python
class LogoutViewTest(TestCase):
    """BE-4: logout 500"""

    def test_logout_with_invalid_token_returns_205(self):
        # POST /api/accounts/logout/ с невалидным refresh_token
        # → 205

    def test_logout_with_valid_token_blacklists(self):
        # Нормальный logout → токен в blacklist
```

### Статус
- [ ] Critical tests written

---

## Iteration 4 — CI Setup & Documentation

### Цель
Интегрировать тесты в CI и задокументировать стратегию.

### GitHub Actions

**Файл:** `.github/workflows/ci.yml` (обновить существующий или создать `test.yml`):

```yaml
name: Backend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_reli
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    env:
      DB_NAME: test_reli
      DB_USER: postgres
      DB_PASSWORD: postgres
      DB_HOST: localhost
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install -r backend/requirements.txt
      - run: pytest backend/ --tb=short --cov=backend --cov-report=term-missing
```

### Документация

Заполнить `docs/08-testing-strategy.md`:
- Стек: pytest-django, factory-boy, responses, freezegun
- Структура тестов: unit / integration / e2e
- Правила написания тестов
- Как запускать локально
- Coverage цели: 80% для payment, order, warehouses

### Статус
- [ ] CI configured
- [ ] Documentation written

---

## Привязка к коду

| Тип | Файлы |
|-----|-------|
| **Новые файлы** | `backend/pytest.ini`, `backend/conftest.py`, `backend/factories.py` |
| **Тесты** | `payment/tests_webhook.py`, `order/tests_lifecycle.py`, `warehouses/tests_stock.py`, `promocode/tests_promo.py`, `accounts/tests_auth.py` |
| **CI** | `.github/workflows/ci.yml` |
| **Документация** | `docs/08-testing-strategy.md` |
| **Модели** | Читаются, не изменяются |

## Связанные проблемы из docs/09-architecture-debt.md

- TEST-1: Покрытие тестами ≈ 0% P0
- TEST-2: Нет CI-запуска тестов P1
- DOC-2: `08-testing-strategy.md` — полностью TODO P2
