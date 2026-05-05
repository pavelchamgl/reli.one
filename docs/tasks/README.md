# Tasks — Структурированный план разработки reli.one

> Результат полного аудита проекта. Дата: май 2026.  
> Все задачи следуют workflow из `docs/10-agent-workflow.md`.

---

## Архитектура проблем

```mermaid
graph TD
    subgraph P0["🔴 P0 — Критические (немедленно)"]
        T001["001 System Stabilization\nСломанный kod прямо сейчас"]
        T002["002 Testing Foundation\n0% покрытие = нельзя рефакторить"]
        T003P0["003 Payment Refactor\nDB-1: двойные заказы\nDB-6: race condition promo"]
        T009P0["009 DB Models\nDB-2: overselling warehouse"]
        T006P0["006 Security\nSEC-1: секреты в git\nSEC-2: PII в коде"]
    end

    subgraph P1["🟠 P1 — Высокие"]
        T003["003 Payment Refactor\nBE-2: views 2198 строк\nPAY-4: invoice race"]
        T004["004 Order Consistency\nDB-3,4,5,7"]
        T005["005 Delivery Cleanup\nSEC-4: dev endpoints\nPAY-2: нет retry"]
        T007["007 Frontend Fixes\nFE-1..7: утечки, баги API"]
        T008["008 Seller Onboarding\nBE-3: 1940 строк"]
        T010["010 DevOps\nSentry, health-check, backup"]
    end

    subgraph P2["🟡 P2 — Улучшения"]
        T009["009 DB Models\nAnalytics, pricing"]
        T006P2["006 Security\nRate limiting, CSP"]
    end

    T001 --> T002
    T002 --> T003
    T002 --> T008
    T003 --> T004
    T003 --> T005
    T006P0 --> T007
```

---

## Сводная таблица задач

| # | Задача | Priority | Complexity | Зависит от | GO/NO-GO |
|---|--------|----------|------------|------------|----------|
| 001 | [system-stabilization](./001-system-stabilization/task.md) | **P0** | Medium | — | GO |
| 002 | [testing-foundation](./002-testing-foundation/task.md) | **P0** | High | 001 | GO |
| 003 | [payment-refactor](./003-payment-refactor/task.md) | **P0/P1** | High | **002** | NO-GO без 002 |
| 004 | [order-consistency](./004-order-consistency/task.md) | P1 | Medium | 002 | NO-GO без 002 |
| 005 | [delivery-cleanup](./005-delivery-cleanup/task.md) | P1 | Medium | 002 | NO-GO без 002 |
| 006 | [security-hardening](./006-security-hardening/task.md) | **P0/P1** | Medium | — | GO (SEC-1,2 немедленно) |
| 007 | [frontend-critical-fixes](./007-frontend-critical-fixes/task.md) | P1 | Low | 006 | GO |
| 008 | [seller-onboarding-stabilization](./008-seller-onboarding-stabilization/task.md) | P1 | High | 002 | NO-GO без 002 |
| 009 | [db-model-improvements](./009-db-model-improvements/task.md) | **P0**/P2 | Medium | 002 | NO-GO без 002 |
| 010 | [devops-infrastructure](./010-devops-infrastructure/task.md) | P1 | Medium | 002 | GO параллельно |

---

## Рекомендуемый порядок выполнения

```mermaid
gantt
    title Рекомендуемый план (недели)
    dateFormat  YYYY-MM-DD
    section P0 — Немедленно
    006 Security SEC-1,2 (PII + git)     :crit, s006, 2026-05-05, 3d
    001 System Stabilization              :crit, s001, 2026-05-05, 5d
    section Foundation
    002 Testing Foundation                :crit, s002, after s001, 14d
    010 DevOps (health, sentry)           :s010, after s001, 7d
    section Critical Fixes
    007 Frontend Fixes                    :s007, after s006, 5d
    006 Security (rate limiting)          :s006b, after s007, 3d
    section Refactoring (требует тестов)
    003 Payment Refactor (atomic fixes)   :s003a, after s002, 7d
    009 DB: Warehouse lock                :s009a, after s002, 3d
    004 Order Consistency                 :s004, after s003a, 5d
    005 Delivery Cleanup                  :s005, after s003a, 4d
    008 Seller Onboarding                 :s008, after s002, 10d
    003 Payment Service Layer             :s003b, after s008, 7d
```

---

## Ответы на ключевые вопросы аудита

### 1. Есть ли достаточно тестов для безопасного рефакторинга?

**НЕТ.** Текущее покрытие ≈ 0% по критическим доменам:

| Domain | Текущие тесты | Достаточно? |
|--------|--------------|-------------|
| payment | ~22 кейса | Частично (нет idempotency) |
| sellers | ~4 кейса | Нет |
| accounts | ~4 кейса | Нет |
| order | 0 | Нет |
| warehouse | 0 | Нет |
| delivery | 1 файл | Нет |
| product, favorites, reviews, promocode | 0 | Нет |

### 2. Какие критические сценарии НЕ покрыты?

- Дублирующийся Stripe webhook → создание двух заказов
- Конкурентный `decrease_stock` → overselling
- Конкурентный `increment_used_count` → превышение лимита промокода
- Параллельная генерация инвойсов → дублирующиеся номера
- Order lifecycle transitions (Pending → Processing → Shipped → Closed)
- Logout с невалидным токеном → 500

### 3. Какие P0 архитектурные риски существуют?

```
РИСК 1 (DB-1): Payment.session_id не уникален
→ Stripe может доставить webhook дважды → 2 заказа, 2 списания промокода

РИСК 2 (DB-2): WarehouseItem без select_for_update
→ Параллельные webhook-и → quantity_in_stock < 0 → overselling

РИСК 3 (DB-6): PromoCode.increment_used_count не атомарный
→ Промокод применяется больше max_usage раз

РИСК 4 (BE-1): promocode/signal.py — 3 AttributeError
→ Любое сохранение PromoCode через Admin → 500

РИСК 5 (SEC-1,2): Секреты и PII в git истории
→ При клоне репозитория — компрометация credentials
```

### 4. Можно ли начинать рефакторинг?

```
GO / NO-GO DECISION:

✅ GO — исправления без рефакторинга (Task 001):
   - Исправление сломанных endpoints
   - Добавление try/except
   - Исправление Frontend bagов

✅ GO — безопасные security fixes (Task 006 SEC-1,2):
   - Удаление PII файла
   - Очистка git истории (требует координации)

⚠️  GO с осторожностью — атомарные DB fixes (Task 003 Iter 3):
   - Unique на session_id + get_or_create
   - F() для promo increment
   - select_for_update для invoice
   (Можно делать параллельно с написанием тестов)

🔴 NO-GO — рефакторинг (декомпозиция payment/views.py, onboarding):
   - НЕЛЬЗЯ начинать без Task 002 (тесты)
   - Без regression tests рефакторинг монолитов неприемлем
```

---

## Итоговый вывод

**Рекомендуемый следующий шаг:**

1. **Сегодня:** Запустить Task 006 Iteration 2 — удалить `src/code/test.js` с PII
2. **Эта неделя:** Task 001 — исправить все сломанные endpoints
3. **Следующие 2 недели:** Task 002 — написать тесты (блокирует рефакторинг)
4. **Параллельно с Task 002:** Task 010 (health-check, Sentry), Task 007 (frontend bugs)
5. **После Task 002:** Task 003 Iter 3 (атомарные DB fixes), Task 009 (warehouse lock)

**Рефакторинг Payment и Onboarding монолитов — только после Task 002.**

---

## Файлы задач

```
docs/tasks/
├── README.md                              ← этот файл
├── _task_template.md                      ← шаблон задачи
├── 001-system-stabilization/task.md
├── 002-testing-foundation/task.md
├── 003-payment-refactor/task.md
├── 004-order-consistency/task.md
├── 005-delivery-cleanup/task.md
├── 006-security-hardening/task.md
├── 007-frontend-critical-fixes/task.md
├── 008-seller-onboarding-stabilization/task.md
├── 009-db-model-improvements/task.md
└── 010-devops-infrastructure/task.md
```
