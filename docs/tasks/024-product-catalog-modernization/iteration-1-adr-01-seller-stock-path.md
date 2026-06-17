# ADR 01 — Seller warehouse и stock path для товаров продавца

**Статус:** принято для следующих итераций  
**Дата:** 2026-06-05  
**Scope:** product catalog modernization, stock, checkout  
**Связанные итерации:** 3, 7

---

## Контекст

Новый товар продавца сейчас создается через seller-flow, но этот flow не создает `WarehouseItem`. Публичная доступность и reservation считают отсутствие `WarehouseItem` как `available=0`, поэтому товар без stock row непокупаем.

В коде уже есть связь seller со складами:

- `SellerProfile.default_warehouse` — основной склад продавца;
- `SellerProfile.warehouses` — дополнительные доступные склады продавца;
- checkout проверяет `CZ-origin` через `seller.default_warehouse.country`.

Поэтому stock path нельзя проектировать как независимую новую связь seller-to-warehouse.

---

## Решение

1. Источником остатка остается `WarehouseItem`.
2. Seller-facing stock path должен создавать/обновлять `WarehouseItem` только для:
   - `SellerProfile.default_warehouse`; или
   - склада из `SellerProfile.warehouses`.
3. Public stock status считается только по `WarehouseItem` и не должен учитывать `default_warehouse`.
4. Если у seller нет `default_warehouse`, товар с остатком может быть публично `in_stock`, но checkout должен блокироваться на `CZ-origin`.
5. Missing `WarehouseItem` остается валидным состоянием и означает `out_of_stock`.
6. Checkout eligibility остается отдельным слоем и завязан на `seller.default_warehouse.country` до отдельного решения.

---

## Последствия

- Iteration 3 должна добавить seller-facing stock API/service, а не прямую запись из frontend.
- Seller create wizard может принимать quantity, но backend должен сам выбрать допустимый warehouse.
- Товар с остатком на складе, не согласованном с seller profile, не должен проходить checkout.
- `default_warehouse=NULL` должен быть явным checkout-blocking состоянием, а не silent success.
- Менять `stock_availability.py` под origin-awareness нельзя без отдельного решения.

---

## Acceptance criteria

- Seller может задать stock только для своих вариантов.
- `WarehouseItem` создается на `default_warehouse` или разрешенном `warehouses`.
- Товар без `WarehouseItem` публично остается `out_of_stock`.
- Товар с `WarehouseItem` и `default_warehouse=NULL` не ломает public stock status.
- Checkout проходит для товара с CZ `default_warehouse`.
- Checkout behavior при `default_warehouse=NULL` покрыт тестом.

---

## Не делаем сейчас

- Не меняем модели.
- Не создаем migrations.
- Не меняем checkout logic.
- Не добавляем frontend stock UI в этой итерации.
