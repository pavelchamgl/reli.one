Ты работаешь как senior solution architect, backend lead, frontend lead, QA lead и product-minded technical lead для проекта reli.one.

Твоя задача:
1. Полностью проанализировать проект
2. Ответить на ключевые архитектурные вопросы
3. Разбить проект на конкретные задачи (tasks)
4. Для каждой задачи создать файл с итерациями
5. Использовать строгую структуру

---

# Этап 1. Анализ проекта

Проанализируй:

Backend:
- accounts
- product
- order
- payment
- delivery
- sellers
- favorites
- reviews
- promocode

Frontend:
- Frontend/Frontend3

Особое внимание:
- payment flow
- order lifecycle
- delivery calculation
- seller onboarding
- product/variant model

---

Ответь:

1. Есть ли достаточно тестов для безопасного рефакторинга
2. Какие критические сценарии НЕ покрыты
3. Какие P0 архитектурные риски существуют
4. Можно ли начинать рефакторинг или сначала нужны тесты

---

# Этап 2. Декомпозиция на задачи

Разбей все найденные проблемы на задачи.

Каждая задача должна:
- быть независимой
- иметь четкую цель
- быть реализуемой за несколько итераций

Примеры задач:
- system-stabilization
- payment-refactor
- order-consistency
- delivery-logic-cleanup
- product-model-fix
- seller-onboarding-stabilization

---

# Этап 3. Создание файлов задач

Для каждой задачи:

1. Создай папку:
docs/tasks/XXX-task-name/

2. Создай файл:
docs/tasks/XXX-task-name/task.md

3. Используй шаблон:

- цель
- контекст
- scope
- не входит
- зависимости
- риски
- definition of done

---

# Этап 4. Добавление итераций

Внутри каждой задачи создай итерации:

Iteration 1 — Analysis
Iteration 2 — Tests
Iteration 3 — Refactor
Iteration 4 — Validation

Каждая итерация должна содержать:

- цель
- действия
- output
- риски
- статус

---

# Этап 5. Связь с текущим проектом

Для каждой задачи укажи:

- какие файлы будут изменяться
- какие модели затрагиваются
- какие API участвуют
- какие тесты нужно добавить

---

# Этап 6. Ограничения

ОЧЕНЬ ВАЖНО:

- не менять код проекта
- не создавать миграции
- не делать рефакторинг
- только анализ и документация

---

# Этап 7. Итог

В конце выведи:

1. список созданных задач
2. приоритет (P0/P1/P2)
3. рекомендуемый порядок выполнения

---

Используй:
- architecture-audit skill
- database-model-audit skill
- regression-test-writer skill
- code-review skill

Сохрани все результаты в docs/tasks/