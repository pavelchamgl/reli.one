# Task 012 — Order lifecycle extended tests

**Priority:** P1  
**Complexity:** Medium  
**Status:** **Done (repo-scope)** — `SellerOrderActionsLifecycleTests` покрывает confirm, mark shipped / посылки, отмену staff из Pending/Shipped, отказ отмены при Delivered/Cancelled, негативы для не-staff; **`OrderStatusStringFragilityTests`** фиксирует хрупкость строк статусов (связь с **Task 004** backlog). Расширение под «delivered/closed/Manager» без изменения сервиса — только при появлении методов в `SellerOrderActionsService`.

## Цель

Добавить regression-тесты для **расширенного lifecycle заказа**: переходы статусов (например Pending → Processing → Shipped), правила отмены, зависимости от посылок / доставки — по сценариям, которые были в исходном плане **Task 002 (Extended)**, но не вошли в **Core**.

## Контекст

После закрытия Task 002 **Core** в репозитории есть базовые тесты `order` (`calculate_refund`, `OrderProduct.received_at`, `OrderEvent`, номер заказа). Нет выделенного набора тестов на **операционные переходы** и ограничения (отмена, parcel, права продавца/стаффа), как описывалось в историческом плане `tests_lifecycle` / `seller_order_actions`.

Исправление timezone для `received_at` — отдельно: **Task 011**.

## Scope

- Тесты против актуального кода: `backend/order/services/seller_order_actions.py`, views/serializers заказа продавца, при необходимости `delivery` / `DeliveryParcel`.
- Сценарии (примерный ориентир, уточнить по коду перед реализацией):
  - подтверждение заказа / смена статуса в сторону обработки;
  - ограничения на отгрузку без посылки (если зафиксировано в коде);
  - отмена: кто может / при каких статусах запрещено;
  - согласованность с существующими статусами в БД (`OrderStatus`).

## Не входит в задачу

- Изменение бизнес-логики переходов без отдельной продуктовой задачи (см. **Task 004** для структурных правок домена order).
- Дублирование интеграционных тестов webhook — они уже в payment.

## Зависимости

- **Task 002** — Core завершён; фикстуры и CI доступны.
- **Task 004** — при рефакторинге статусов / констант тесты Task 012 могут потребовать обновления; держать в синке.

## Definition of Done

- [x] Расширение `backend/order/tests.py` — класс `SellerOrderActionsLifecycleTests` (confirm, mark_shipped + parcels, cancel staff из Pending/Shipped, отмена запрещена для Delivered/Cancelled и для не-staff).
- [x] Регрессия строковых статусов — `OrderStatusStringFragilityTests`.
- [ ] Переходы, для которых в коде **ещё нет** публичных действий (например delivered через отдельный endpoint) — вне scope до расширения сервиса.
- [x] Без реальных вызовов внешних API.
- [x] `manage.py test order.tests.SellerOrderActionsLifecycleTests order.tests.OrderStatusStringFragilityTests` — зелёный (SQLite CI-совместимо).

## Связанные задачи

- **Task 002** — перенос Extended сюда.
- **Task 004** — консистентность order domain (статусы, `received_at`, индексы).
- **Task 011** — timezone для `OrderProduct.received_at`.
