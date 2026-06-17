# ADR 02 — Dimensions policy для товара, упаковки и доставки

**Статус:** принято для следующих итераций  
**Дата:** 2026-06-05  
**Scope:** product catalog modernization, delivery, payment, seller UI  
**Связанные итерации:** 2, 7

---

## Контекст

Seller-facing форма должна быть удобной: размеры в сантиметрах, вес в килограммах. Но текущие checkout, payment и delivery services читают delivery-critical dimensions с `ProductVariant`:

- `weight_grams`;
- `length_mm`;
- `width_mm`;
- `height_mm`.

DPD/GLS/Packeta/Stripe/PayPal уже завязаны на эти поля.

---

## Решение

1. Delivery-critical package dimensions остаются на `ProductVariant` в `mm/g`.
2. Seller UI может показывать `cm/kg`, но API/backend должны конвертировать значения в `mm/g`.
3. Product factual dimensions можно добавить отдельно позже, но они не заменяют package dimensions для delivery.
4. Любой перенос delivery dimensions с variant-level на product-level запрещен без отдельного adapter и regression tests.

---

## Последствия

- В seller wizard нужно явно разделить:
  - фактические размеры товара;
  - размеры упаковки для доставки;
  - variant package dimensions, которые реально использует checkout/delivery.
- Existing checkout payload и delivery calculation продолжают работать по SKU и `ProductVariant`.
- UI conversion должен быть loss-safe и валидировать нули/пустые значения.

---

## Acceptance criteria

- DPD/GLS/Packeta расчеты продолжают читать dimensions с `ProductVariant`.
- Stripe/PayPal session builders не регрессируют.
- Seller UI может принимать `cm/kg`, но backend хранит delivery values в `mm/g`.
- Нулевые или отсутствующие delivery dimensions блокируют соответствующие delivery flows так же, как сейчас.

---

## Не делаем сейчас

- Не переносим dimensions между моделями.
- Не меняем delivery/payment services.
- Не добавляем migrations.
