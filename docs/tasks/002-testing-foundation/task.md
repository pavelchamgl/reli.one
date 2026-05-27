# Task 002 — Testing Foundation

**Priority:** P0  
**Complexity:** High  
**Status:** DONE (Testing Foundation Complete)

## Цель

Создать базовую инфраструктуру тестирования и написать regression-тесты для критических сценариев, чтобы **безопасно стартовать рефакторинг** критичных доменов.

## Контекст

**Core** закрыт: pytest-django, ключевые регрессии payment / order (базовый домен) / sellers (onboarding), CI, актуальная стратегия в `docs/08-testing-strategy.md`.

Часть исходно заявленного scope перенесена в **Extended** и отслеживается в **Task 009**, **Task 010** и **Task 012** (см. ниже).

**Снимок покрытия после закрытия Core:**

| App / область | Что есть |
|---------------|----------|
| payment | Webhook (идемпотентность, totals), PayPal checkout unit, checkout flow |
| order | `order/tests.py`: `calculate_refund`, `OrderProduct.received_at` lifecycle, `OrderEvent`, формат номера заказа |
| sellers | Валидация онбординга, API personal, **submit / approve / reject** |
| product | `test_catalog_api.py`: list, detail, search, sort |
| accounts | Регистрация (телефон), logout |
| delivery | `test_seller_shipping.py`: моки DPD / GLS / Packeta |
| promocode | Модель, `clean`, сигналы Stripe (без теста атомарности счётчика — **Task 010**) |
| warehouses | `tests.py` пустой; конкурентность склада — **Task 009** |

## Scope

### Core (обязательное для старта рефакторинга) — выполнено

- **pytest-инфраструктура:** `pytest-django` в зависимостях, `backend/pytest.ini`, `backend/conftest.py` с базовыми фикстурами.
- **Webhook:** регрессии Stripe (идемпотентность, создание order / payment / items) — `payment/tests.py` и смежные файлы.
- **Order — базовые тесты:** доменная логика без полного «lifecycle по переходам статусов через действия продавца» — `order/tests.py`.
- **Onboarding:** state transitions submit / approve / reject и существующие validation / API тесты — `sellers/tests.py`.
- **CI:** `.github/workflows/ci.yml` — `makemigrations --check`, `migrate`, `python manage.py test`, `pytest`.
- **Документация:** `docs/08-testing-strategy.md` синхронизирована с репозиторием.

### Extended (вынесено в отдельные задачи — не блокируют закрытие Core)

| Тема | Задача |
|------|--------|
| Конкурентность склада, `decrease_stock`, риск overselling | **Task 009** — DB Model Improvements |
| Атомарность / гонки `PromoCode.increment_used_count` | **Task 010** — DevOps Infrastructure (блок качества в пайплайне при необходимости) |
| Расширенный **order lifecycle** (Pending→Processing→Shipped, отмена, правила parcel и т.п. по исходному плану 002) | **Task 012** — Order lifecycle extended tests |

**Связь с другими тасками:** исправление naive datetime для `OrderProduct.received_at` — **Task 011** (`order-product-received-at-timezone`); она **не** заменяет Task 012 по сценариям lifecycle.

## Не входит в задачу (как и раньше)

- Frontend unit / E2E
- 100% coverage
- Performance tests

## Зависимости

- Task 001 (system-stabilization) — желательно для стабильного кода под тесты

## Риски

- До закрытия **009 / 010 / 012** остаются зоны регрессии: склад при конкуренции, промокод при гонках, операционный lifecycle заказа.

---

## Definition of Done

### Core (обязательное для старта рефакторинга) — ✅

- [x] `pytest.ini` настроен, тесты запускаются командой `pytest`
- [x] `backend/conftest.py` с базовыми фикстурами (user, seller, product, order и связанные сущности)
- [x] Payment webhook: идемпотентность (повтор не создаёт второй заказ / дубликат оплаты — покрыто в payment tests)
- [x] Order: базовые регрессии (`calculate_refund`, `received_at` в save(), `OrderEvent`, формат `order_number`)
- [x] Onboarding: submit / approve / reject + существующие validation / API тесты
- [x] CI: workflow запускает тесты на push / PR (`manage.py test` + `pytest`)
- [x] `docs/08-testing-strategy.md` отражает реальное состояние и команды запуска

### Extended — перенесено в другие задачи (не часть закрытия 002)

- [ ] Warehouse: конкурентный `decrease_stock` → **Task 009**
- [ ] PromoCode: атомарность `increment_used_count` → **Task 010**
- [ ] Order lifecycle расширенный (статусы, отмена, parcel, правила из исходного плана) → **Task 012**

**Исторически планировалось (не обязательно для Core):** `factory-boy`, `responses`, `freezegun`, `pytest-cov`, отдельный `backend/factories.py` — по мере необходимости или в рамках 010 (coverage).

---

# Iterations (архив)

| Iteration | Статус |
|-----------|--------|
| 1 — Analysis | ✅ |
| 2 — Infrastructure (pytest.ini, conftest, pytest-django) | ✅ |
| 3 — Critical tests (Core) | ✅ |
| 4 — CI + документация | ✅ |

---

## Привязка к коду (фактическая)

| Тип | Файлы |
|-----|-------|
| Инфра | `backend/pytest.ini`, `backend/conftest.py`, `requirements.txt` (`pytest-django`) |
| Тесты | `payment/tests.py`, `payment/test_checkout_flow.py`, `order/tests.py`, `sellers/tests.py`, `product/test_catalog_api.py`, `delivery/test_seller_shipping.py`, `accounts/tests.py`, `promocode/tests.py`, … |
| CI | `.github/workflows/ci.yml` |
| Документация | `docs/08-testing-strategy.md` |

## Связанные документы

- `docs/09-architecture-debt.md` — устаревшие фразы про «нет pytest / CI» не использовать как источник правды; ориентир — этот файл и `08-testing-strategy.md`.
