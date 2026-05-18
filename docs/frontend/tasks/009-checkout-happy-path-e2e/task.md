# FE-009 — Checkout Happy Path E2E

**Статус:** Done  
**Phase:** 4 — P3 Playwright / E2E Expansion  
**Priority:** P3  
**После:** FE-008 (Playwright Foundation)

---

## Цель

Добавить первый безопасный Playwright e2e smoke для checkout/cart flow во Frontend3:
- без реальных Stripe/PayPal платежей;
- без реального backend и order creation;
- проверить маршрут `/basket` → `/payment` на уровне UI.

---

## Реализация

### Файл

`Frontend/Frontend3/e2e/checkout.spec.js`

### Стратегия

| Аспект | Решение |
|--------|---------|
| Backend | Не поднимается. `page.on('requestfailed', () => {})` для страниц без API-вызовов при монтировании |
| Basket state | Сид через `page.addInitScript` → `localStorage.setItem('persist:root', ...)` в формате redux-persist (version=20) |
| Stripe / PayPal | Не вызываются — тест остаётся на section 1 (адресная форма). Мониторинг через `page.on('request', ...)` |
| Backend API | `blockBackendApi()` блокирует `**/reli.one/api/**` для тестов PaymentPage |

### Сценарии (6 тестов)

| # | Тест | Описание |
|---|------|----------|
| 1 | basket page: opens without crash | `/basket` монтируется без ошибок (пустая корзина) |
| 2 | basket page: shows empty-basket message | i18n-строка "The basket is still empty" видна |
| 3 | basket page: renders item count after Redux rehydration | `persist:root` с 1 товаром → "1 goods" видна после гидрации |
| 4 | basket → payment: Continue button enabled and navigates | Кнопка "Continue" активна (selectedProducts.length > 0) и переводит на `/payment` |
| 5 | payment page: section 1 (address form) loads | `input[name="email"]` видим — section 1 смонтирован |
| 6 | payment page: no Stripe/PayPal calls on section 1 | Нет ни одного запроса к stripe.com / paypal.com |

### Замоканные API

| Endpoint | Метод | Статус |
|----------|-------|--------|
| `**/reli.one/api/**` | `page.route(...)` abort | Только для PaymentPage-тестов |
| Stripe/PayPal URLs | Мониторинг (не абортируются, ожидаем 0 вызовов) | Тест 6 |

**На basket-тестах:** API не вызывается при монтировании (Redux state из localStorage), route mock не нужен.

---

## Результаты validation

Из `Frontend/Frontend3`:

| Команда | Результат |
|---------|-----------|
| `npm run lint` | ✅ 0 errors |
| `npm run test` | ✅ 122/122 passed |
| `npm run build` | ✅ OK |
| `npm run test:e2e` | ✅ 11/11 passed (6 checkout + 5 smoke) |

---

## Файлы

| Файл | Действие |
|------|----------|
| `Frontend/Frontend3/e2e/checkout.spec.js` | Создан |
| `docs/frontend/tasks/009-checkout-happy-path-e2e/task.md` | Создан |
| `docs/frontend/tasks/README.md` | Обновлён |
| `docs/frontend/test-matrix.md` | Обновлён |
| `docs/frontend/frontend3-roadmap.md` | Обновлён |
| `docs/frontend/frontend3-audit.md` | Обновлён |

---

## Ограничения / Follow-up

- `data-testid` **не добавлен**: `input[name="email"]` и `getByRole('button', { name: 'Continue' })` достаточно стабильны.
- Sections 2 (Delivery) и 3 (Payment/PSP) **не покрыты** в этом таске — требуют более сложного мокирования delivery API. Оформлено как отдельный follow-up FE-010.
- Тест 3 (rehydration) зависит от формата `persist:root` v20; при смене `PERSIST_VERSION` нужно обновить константу в тесте.

---

## Suggested commit

```
test(frontend): add checkout happy path e2e smoke
```
