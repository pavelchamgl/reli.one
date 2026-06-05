# ADR 06 — Identifier compatibility для article, barcode и seller_sku

**Статус:** принято для следующих итераций  
**Дата:** 2026-06-05  
**Scope:** product catalog modernization, seller API, GMC feed  
**Связанные итерации:** 2, 4, 7

---

## Контекст

Текущий seller create/edit и GMC feed завязаны на legacy identifiers:

- `article` обязателен в seller serializers и используется как MPN fallback;
- `barcode` используется как GTIN fallback;
- будущий `seller_sku` нужен для удобства поставщика, но не должен заменить platform SKU.

---

## Решение

1. `ProductVariant.sku` остается platform SKU для checkout/order/payment.
2. `article` сохраняется как existing required contract до синхронной backend/frontend миграции.
3. `seller_sku` добавляется только как optional seller-facing identifier.
4. `barcode` сохраняется как GTIN fallback до готовности `ProductExternalIdentifier`.
5. GMC adapter должен читать новые identifiers с fallback на `barcode/article/static brand`.

---

## Последствия

- Старый seller payload продолжает работать.
- GMC feed не теряет `gtin/mpn/brand`.
- `seller_sku` нельзя использовать как checkout SKU.

---

## Acceptance criteria

- Existing product create payload с `article` валиден.
- `seller_sku` optional и не ломает старый frontend.
- GMC feed сохраняет fallback `barcode -> gtin`, `article -> mpn`.
- `ProductVariant.sku` не меняется.

---

## Не делаем сейчас

- Не ослабляем `article` contract.
- Не меняем seller serializers.
- Не добавляем identifier models.
