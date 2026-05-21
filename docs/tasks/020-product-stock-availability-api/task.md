# Task 020 — Product Stock Availability API

**Priority:** P1  
**Status:** Implemented (2026-05-20)  
**Depends on:** Task 013 (`WarehouseItem.reserved_quantity`, reservation TTL)

> **Note:** folder slug `020-product-stock-availability-api` (renumbered from `014-…` to avoid collision with [`014-frontend3-stabilization-audit`](../014-frontend3-stabilization-audit/task.md)).

---

## Цель

Отдать фронтенду безопасные поля доступности остатков для list / search / category / detail, без раскрытия `reserved_quantity`. Checkout по-прежнему валидирует stock и может вернуть **409**.

---

## API contract

### Формула (не в ответе API)

```
available = max(0, quantity_in_stock - reserved_quantity)
```

- Агрегация **per variant**: сумма по всем `WarehouseItem` варианта.
- Агрегация **per BaseProduct** (list/search/category): сумма available по всем вариантам.
- Нет строки `WarehouseItem` → `available_quantity = 0`.

### `stock_status`

| Значение | Условие (`available`) |
|----------|------------------------|
| `out_of_stock` | `0` |
| `few_left` | `1 … STOCK_FEW_LEFT_THRESHOLD` (default **5**) |
| `in_stock` | `> STOCK_FEW_LEFT_THRESHOLD` |

Настройка: `STOCK_FEW_LEFT_THRESHOLD` в Django settings (optional).

### List / category / search — `BaseProductListSerializer`

Добавленные поля (read-only):

| Поле | Тип | Описание |
|------|-----|----------|
| `total_available_quantity` | int | Сумма available по всем вариантам |
| `is_available` | bool | `total_available_quantity > 0` |
| `stock_status` | string | `in_stock` / `few_left` / `out_of_stock` |

Эндпоинты:

- `GET /api/products/categories/<id>/`
- `GET /api/products/search/?q=...` → `results.products[]`

**Не менялись:** `id`, `name`, `price`, `rating`, `seller_id`, … — backward-compatible.

### Detail — `ProductVariantSerializer`

Добавленные поля на каждый элемент `variants[]`:

| Поле | Тип |
|------|-----|
| `available_quantity` | int |
| `is_available` | bool |
| `stock_status` | string |

Эндпоинт: `GET /api/products/<id>/`

**Не экспонируется:** `reserved_quantity`, `quantity_in_stock`.

---

## Backend implementation

| Файл | Роль |
|------|------|
| `product/stock_availability.py` | формула, `stock_status`, annotate helpers |
| `product/views.py` | `build_public_products_queryset()` + detail prefetch |
| `product/serializers.py` | list + variant serializers |
| `product/test_stock_availability_api.py` | regression tests |

Query pattern:

- List: `annotate_products_with_total_available()` — один Subquery на product, без N+1.
- Detail: `annotate_variant_queryset_with_available()` в `Prefetch("variants", ...)`.

---

## Frontend handoff

1. **List / search / category cards**
   - Показывать badge по `stock_status` или `is_available`.
   - `out_of_stock` → disable «В корзину» / CTA «Нет в наличии».
   - `few_left` → опционально «Осталось мало» (порог совпадает с backend).

2. **Product detail**
   - Per-variant selector: если у выбранного SKU `is_available === false`, блокировать добавление в корзину.
   - Не кэшировать availability дольше TTL страницы — другой пользователь мог зарезервировать stock (Task 013).

3. **Checkout**
   - API catalog — **информативный**, не authoritative.
   - При **409** на `create-stripe-payment` / `create-paypal-payment` показывать сообщение «товар закончился» (см. Task 013).

4. **Пример list item**

```json
{
  "id": 42,
  "name": "Sample",
  "price": "20.80",
  "total_available_quantity": 10,
  "is_available": true,
  "stock_status": "in_stock"
}
```

5. **Пример variant (detail)**

```json
{
  "id": 7,
  "sku": "123456789",
  "price": "20.80",
  "available_quantity": 3,
  "is_available": true,
  "stock_status": "few_left"
}
```

---

## Definition of Done

- [x] List/search/category: `total_available_quantity`, `is_available`, `stock_status`
- [x] Detail variants: `available_quantity`, `is_available`, `stock_status`
- [x] No public `reserved_quantity`
- [x] Missing `WarehouseItem` → 0 / out_of_stock
- [x] Backward-compatible existing fields
- [x] Tests: `product/test_stock_availability_api.py`
- [x] `pytest product/ warehouses/ -q` green

---

## Out of scope

- Favorites / seller storefront list (можно добавить тем же annotate позже)
- Filter `?in_stock=true`
- GMC feed real availability

---

## История

| Дата | Изменение |
|------|-----------|
| 2026-05-20 | Initial implementation + API contract |
| 2026-05-21 | Renumbered task docs `014` → `020` (collision with Frontend3 audit task 014) |
