# Task 012 — Order lifecycle extended tests

**Priority:** P1  
**Complexity:** Medium  
**Status:** In progress — добавлены регрессии `SellerOrderActionsLifecycleTests` в `backend/order/tests.py`; расширение сценариев по мере необходимости.

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

- [x] Расширение `backend/order/tests.py` — класс `SellerOrderActionsLifecycleTests` (confirm, mark_shipped + parcels, cancel права staff/seller).
- [ ] Дополнительные переходы (delivered, closed, права Manager и т.д.) по продуктовому scope.
- [x] Без реальных вызовов внешних API.
- [ ] Полный прогон CI локально подтверждён после изменений.

## Связанные задачи

- **Task 002** — перенос Extended сюда.
- **Task 004** — консистентность order domain (статусы, `received_at`, индексы).
- **Task 011** — timezone для `OrderProduct.received_at`.
