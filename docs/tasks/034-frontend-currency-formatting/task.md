# Task 034 — Frontend: форматирование валюты (`Intl.NumberFormat`), замена `€`, валюта из API

**Priority:** P1
**Complexity:** Medium
**Status:** Planned
**ADR:** `docs/tasks/031-multi-currency-pricing-fx/adr-pricing-and-fx-policy.md`
**Зависит от:** 031 (API отдаёт поле `currency`), желательно 033 (checkout-валюта)

> Исполнитель: агент Cursor, модель **Composer 2.5 Fast**.
> Только **Frontend3** (основной маркетплейс). Frontend2 (лендинг) — без цен, не трогаем.
> Прочитать «Заметки для агента-исполнителя» в конце.

---

## Цель

1. Ввести единый хелпер `formatMoney(amount, currency, locale)` на базе
   `Intl.NumberFormat` (CZK без копеек, EUR — 2 знака).
2. Брать валюту из ответа API (поле `currency` из 031), а не хардкодить `€`.
3. Заменить захардкоженный символ `€` во всех местах показа цены в Frontend3.
4. Seller-формы ввода цены подписать в кронах (CZK), т.к. канон — CZK.

## Контекст

- API теперь отдаёт `currency` рядом с ценой (задача 031); чек­аут — в валюте заказа (033).
- Символ `€` захардкожен ~в 23 файлах Frontend3 (список ниже).
- Уже есть локальный `formatCurrency` в
  `Frontend/Frontend3/src/Components/Seller/preview/SellerReviewProductLayout/SellerReviewProductInfo.jsx`
  (`return ${value} €`) — заменить на общий хелпер.
- i18n: `i18next` (`Frontend/Frontend3/language/i18next.js`), языки `en`/`cz`.

## Scope (область)

**Создать:**
- `Frontend/Frontend3/src/utils/formatMoney.js` — `formatMoney(amount, currency='CZK', locale)`
  через `Intl.NumberFormat`; маппинг currency→locale (`CZK`→`cs-CZ`, `EUR`→`en-IE`/`de-DE`),
  `minimumFractionDigits` (CZK: 0, EUR: 2).
- `Frontend/Frontend3/src/utils/formatMoney.test.js` — unit-тесты (Vitest).

**Изменить (замена `€` → `formatMoney`, читать `currency` из данных):**
Точки показа цены (по результатам Iteration 1 уточнить полный список; известные):
- `src/Components/Basket/BasketTotalBlock/BasketTotalBlock.jsx`
- `src/Components/Basket/BasketCard/BasketCard.jsx`
- `src/Components/Basket/BasketModalCard/BasketModalCard.jsx`
- `src/Components/Payment/PaymentDeliverySelect/PaymentDeliverySelect.jsx`
- `src/Components/Product/ProductNameRate/ProductNameRate.jsx`
- `src/Components/Product/ProdMobileComp/ProdImageAndName/ProductImageAndName.jsx`
- `src/Components/Orders/HistorySmallCard/HistorySmallCard.jsx`
- `src/Components/Orders/ActualOrdersCard/ActualOrdersCard.jsx`
- `src/Components/Orders/OrdersListAndDesc/OrdersListAndDesc.jsx`
- `src/Components/Seller/orderDetal/orderSummary/OrderSummary.jsx`
- `src/Components/Seller/orderDetal/productsTable/ProductsTable.jsx`
- `src/Components/Seller/orderDetal/productTableCard/ProductTableCard.jsx`
- `src/Components/Seller/newOrder/mobileOrderCard/MobileOrderCard.jsx`
- `src/Components/Seller/newOrder/tableItem/TableItem.jsx`
- `src/Components/Seller/goods/goodsCardModer/GoodsCardModer.jsx`
- `src/Components/Seller/goods/goodsCardNotModer/GoodsCardNotModer.jsx`
- `src/Components/Seller/goods/GoodsListCard/GoodsListCard.jsx`
- `src/Components/Seller/preview/SellerReviewProductLayout/SellerReviewProductInfo.jsx`
- `src/Components/Seller/home/SellerHomeGraphe/SellerHomeGraphe.jsx`
- `src/ui/Seller/preview/previewImageAndName/PreviewImageAndName.jsx`
- `src/ui/Seller/preview/previewProductNameRates/PreviewProductNameRate.jsx`
- Seller create/edit: подпись поля цены «Kč» (только лейбл/плейсхолдер).

**Не редактировать другие файлы** (полный список фиксируется в Iteration 1).

## Не входит в задачу

- ❌ Frontend2 (лендинг) — там нет цен.
- ❌ Логика расчёта цен/курса (это backend 031–033).
- ❌ Гео-определение / авто-переключение языка — задача 035.
- ❌ Перевод текстов/ключей i18n сверх подписи валюты.
- ❌ Изменение API-клиента/контрактов; рефактор роутинга/стейта.

## Зависимости

- 031: поле `currency` в ответах каталога. Если ещё не на бэке — `formatMoney`
  использует дефолт `CZK`, но место чтения `currency` должно быть заложено.
- Vitest + RTL (уже в проекте, см. существующие `*.test.jsx`).

## Риски

- **Разные источники цены**: где-то цена приходит с `currency`, где-то нет —
  дефолт `CZK`, но не «терять» EUR там, где бэк прислал EUR.
- **Локаль форматирования**: CZK — `cs-CZ` (пробел-разделитель, «Kč», без копеек).
- **Регресс отображения**: не менять числовые значения, только формат/символ.
- **Тесты-снапшоты**: существующие тесты, проверяющие `€`/`.toFixed(2)`, обновить
  согласованно (не ослабляя смысл).

## Definition of Done

- [ ] `formatMoney` покрыт unit-тестами (CZK без копеек + «Kč»; EUR 2 знака + «€»).
- [ ] Все перечисленные точки используют `formatMoney`, символ `€` не захардкожен.
- [ ] Валюта берётся из данных (`currency`), дефолт `CZK`.
- [ ] Seller-поле цены подписано в Kč.
- [ ] `npm run test` и `npm run lint` во Frontend3 зелёные.
- [ ] Документация: чекбоксы + evidence (список реально изменённых файлов).

---

# Iterations

## Iteration 1 — Inventory (read-only)
- Найти все вхождения `€` и `toFixed`-цен в `Frontend/Frontend3/src` (grep).
- Зафиксировать полный список точек и откуда берётся `currency` в каждой.
- [ ]

## Iteration 2 — Util + tests-first
- Создать `formatMoney.js` (заглушка) и `formatMoney.test.js` (красные):
  - `formatMoney(599, 'CZK')` → `"599 Kč"` (без копеек, `cs-CZ`).
  - `formatMoney(100, 'EUR')` → `"100,00 €"` (или по выбранной EUR-локали — зафиксировать).
  - дефолт валюты `CZK`; некорректный amount → безопасный возврат.
- [ ]

## Iteration 3 — Implement util
- Реализовать через `Intl.NumberFormat`; тесты зелёные.
- [ ]

## Iteration 4 — Replace `€` usages
- Заменить во всех точках на `formatMoney(amount, currency)`; `currency` из данных, дефолт CZK.
- Обновить затронутые компонентные тесты согласованно.
- [ ]

## Iteration 5 — Seller price label
- Подписать поле ввода цены в Kč (лейбл/плейсхолдер), без изменения валидации/логики.
- [ ]

## Iteration 6 — Validation & Docs
- [ ] `npm run test` (Frontend3) зелёный.
- [ ] `npm run lint` (Frontend3) без новых ошибок.
- [ ] Evidence: список изменённых файлов, скрин/пример формата.
- [ ]

---

## Результаты выполнения (evidence)
_Заполняется исполнителем._

## Привязка к коду
| Тип | Файлы |
|-----|-------|
| **Util** | `Frontend/Frontend3/src/utils/formatMoney.js` (+ `.test.js`) |
| **Показ цены** | компоненты Basket/Product/Orders/Seller (список выше) |
| **i18n (reference)** | `Frontend/Frontend3/language/i18next.js` |
| **Не трогаем** | Frontend2, API-клиент, расчёт цен/курса (backend) |

## Заметки для агента-исполнителя (Composer 2.5 Fast)
1. **Только Frontend3 и только файлы из Scope.** Backend и Frontend2 не трогать.
2. **Сначала инвентаризация (Iteration 1)** — grep по `€`/`toFixed`, зафиксировать
   полный список ДО правок; не пропускать места.
3. **Меняем только формат/символ**, не числовые значения и не логику расчёта.
4. **Валюта — из данных**, дефолт `CZK`; не «захардкодить» теперь уже `Kč` вместо `€`.
5. **Один общий хелпер** `formatMoney` — никаких локальных копий формата.
6. **Тесты-снапшоты обновлять согласованно**, не ослабляя смысл проверок.
7. Идти 1→6, чекбокс + evidence после каждой итерации.
8. Сначала читать файл целиком; не рефакторить соседний код; не менять роутинг/стейт/контракты.
9. Соблюдать `020-frontend-react` (переиспользовать компоненты, не ломать интеграции).
