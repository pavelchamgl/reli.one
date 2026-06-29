# Task 033 — Оплата в CZK: валюта Stripe/PayPal-сессии + фиксация курса

**Priority:** P0 (бизнес-критичный домен: payment)
**Complexity:** High
**Status:** Planned
**ADR:** `docs/tasks/031-multi-currency-pricing-fx/adr-pricing-and-fx-policy.md`
**Зависит от:** 031 (pricing-сервис, маркап), 032 (валюта доставки, источник курса)

> Исполнитель: агент Cursor, модель **Composer 2.5 Fast**.
> Это платёжный flow. **Regression-first.** Идемпотентность вебхуков обязательна.
> Прочитать «Заметки для агента-исполнителя» в конце.

---

## Цель

Создавать checkout-сессию Stripe и PayPal в валюте заказа (**CZK по умолчанию**,
EUR по запросу), с суммами из канона CZK (CZK — напрямую, EUR — через маркап),
**зафиксировав курс на сессию** и сохранив его в `Payment`. Доставка берётся в той
же валюте (через 032). Контракты вебхуков и идемпотентность не ломаются.

## Контекст (где сейчас хардкод EUR)

- `payment/services/stripe_session.py`: `currency="eur"`, `unit_amount` в центах,
  строки доставки/итогов в EUR.
- `payment/services/paypal_checkout.py`, `paypal_session.py`: `"currency_code":"EUR"`.
- `payment/services/webhook_processing.py`: `currency` уже динамический
  (`currency.upper()`), сверка `gross_total`.
- `payment/services/stripe_webhook.py`, `paypal_webhook.py`: читают валюту из события.
- `payment/models.py`: `Payment.currency` есть; полей курса/сеттлмента **нет**.
- Канон цены — CZK (после 031): `ProductVariant.price_with_acquiring` теперь в CZK.

## Scope (область)

**Изменить (модель + миграция — задача это явно разрешает):**
- `backend/payment/models.py` — добавить в `Payment`: `fx_rate` (Decimal, null),
  `settlement_currency` (Char, null), `amount_settlement` (Decimal, null).
- `backend/payment/migrations/00XX_payment_fx_fields.py` — **новая** миграция
  (только добавление nullable-полей, без изменения существующих).

**Изменить (сервисы checkout):**
- `backend/payment/services/stripe_session.py` — валюта сессии из параметра;
  суммы из канона; фиксация курса; строки в нужной валюте.
- `backend/payment/services/paypal_checkout.py`, `paypal_session.py` — то же для PayPal.
- `backend/payment/services/checkout_metadata.py` — сохранить `fx_rate`,
  `settlement_currency`, `amount_settlement` в metadata.
- `backend/payment/views.py` — пробросить выбранную валюту (из market/`currency`) в билдеры.
- `backend/payment/services/webhook_processing.py` — записать новые поля в `Payment`
  при создании/обновлении (значения из metadata).

**Создать/расширить тесты:**
- `backend/payment/test_checkout_currency.py` — новые сценарии CZK + регресс EUR.
- Дополнить существующие при необходимости (не удаляя/не ослабляя проверки).

**Не редактировать другие файлы.**

## Не входит в задачу

- ❌ Frontend выбора/показа валюты — задача 034.
- ❌ Гео-определение market — задача 035 (здесь валюта приходит параметром/дефолт CZK).
- ❌ Изменение источника курса/доставки (готово в 032).
- ❌ Изменение бизнес-логики расчёта доставки, резерва склада, инвойс-нумерации.
- ❌ Удаление/ослабление существующих платёжных тестов.

## Зависимости

- 031 (`convert_canonical_amount`, `get_display_currency`/market currency, `FX_RATE_MARKUP`).
- 032 (валютный вывод доставки, источник курса).
- Stripe/PayPal принимают `CZK` (подтверждено); минорные единицы CZK = ×100 (Stripe).

## Риски (P0)

- **Идемпотентность вебхуков** не должна регрессировать
  (`UniqueConstraint(payment_system, session_id)`); покрыть тестом.
- **Расхождение сумм**: сумма line items (в валюте) должна точно совпадать с
  ожидаемой; курс фиксируется один раз на сессию и кладётся в metadata/`Payment`.
- **Минорные единицы**: CZK ×100 для Stripe; PayPal — строковое `value` с 2 знаками.
- **Регресс EUR-флоу**: все существующие EUR-тесты должны оставаться зелёными.
- **Миграция модели**: только добавление nullable-полей; без data-migration; обратима.
- **Округление**: CZK — целые кроны (как в 031/ADR); не плодить копейки в line items.

## Definition of Done

- [ ] `Payment` имеет `fx_rate`, `settlement_currency`, `amount_settlement` (nullable);
      миграция добавляет только их.
- [ ] Stripe-сессия создаётся в валюте заказа (CZK дефолт): line items, доставка,
      итоги — в этой валюте; `currency` соответствует.
- [ ] PayPal-сессия — то же (`currency_code`).
- [ ] Курс зафиксирован на сессию и сохранён в metadata и `Payment.fx_rate`
      (+ settlement-поля при оплате не в CZK).
- [ ] CZK-суммы целые; EUR — конвертация с маркапом (через pricing 031).
- [ ] Вебхуки пишут валюту/курс в `Payment`; идемпотентность сохранена (тест).
- [ ] Все существующие платёжные тесты зелёные; добавлены CZK-сценарии.
- [ ] `cd backend && pytest payment order -q` — без регресса.
- [ ] `makemigrations --check --dry-run` — нет незакоммиченных изменений схемы.
- [ ] Документация: чекбоксы + evidence; при изменении контракта — отметка в `docs/`.

---

# Iterations

## Iteration 1 — Analysis (read-only)
- Прочитать целиком: `stripe_session.py`, `paypal_checkout.py`, `paypal_session.py`,
  `checkout_metadata.py`, `webhook_processing.py`, `stripe_webhook.py`,
  `paypal_webhook.py`, `payment/models.py`, `payment/views.py`.
- Составить карту всех мест валюты/сумм/минорных единиц; путь фиксации курса.
- [ ]

## Iteration 2 — Regression tests (snapshot текущего EUR-поведения)
- Прогнать существующие `payment/tests.py`, `test_checkout_flow.py`,
  `tests_reservation_payment_ttl.py` — зафиксировать зелёный baseline.
- Добавить заготовки CZK-тестов (ожидаемо красные) в `test_checkout_currency.py`:
  - Stripe CZK: `currency=="czk"`, суммы целые, курс в metadata.
  - PayPal CZK: `currency_code=="CZK"`.
  - EUR-регресс: суммы как раньше.
  - Вебхук идемпотентность при CZK.
- [ ]

## Iteration 3 — Payment model + migration
- Добавить nullable-поля; сгенерировать миграцию (только эти поля).
- Проверить `makemigrations --check`, применить в тестовой БД.
- [ ]

## Iteration 4 — Stripe currency + rate snapshot
- Валюта из параметра билдера; суммы из канона (CZK напрямую / EUR через маркап);
  зафиксировать курс, положить в metadata.
- CZK-Stripe-тесты зелёные; EUR-регресс зелёный.
- [ ]

## Iteration 5 — PayPal currency + rate snapshot
- Аналогично для PayPal (`currency_code`, value-строки, минорные единицы).
- [ ]

## Iteration 6 — Views + webhook persistence
- Пробросить валюту из `views.py` в билдеры (источник: market/`currency`, дефолт CZK).
- В `webhook_processing` записать `fx_rate`/`settlement_*` в `Payment` из metadata.
- Идемпотентность — тест.
- [ ]

## Iteration 7 — Validation & Docs
- [ ] `cd backend && pytest payment order -q` — всё зелёное.
- [ ] `makemigrations --check --dry-run` чисто.
- [ ] Контракт checkout: отметить любые добавленные поля как аддитивные в `docs/`.
- [ ] Evidence заполнен.
- [ ]

---

## Результаты выполнения (evidence)
_Заполняется исполнителем._

## Привязка к коду
| Тип | Файлы |
|-----|-------|
| **Модель + миграция** | `backend/payment/models.py`, новая `payment/migrations/00XX_*.py` |
| **Stripe** | `backend/payment/services/stripe_session.py`, `stripe_webhook.py` |
| **PayPal** | `backend/payment/services/paypal_checkout.py`, `paypal_session.py`, `paypal_webhook.py` |
| **Metadata/webhook** | `backend/payment/services/checkout_metadata.py`, `webhook_processing.py` |
| **Views** | `backend/payment/views.py` |
| **Pricing/курс (reuse)** | `backend/product/services/pricing.py`, `backend/delivery/services/currency_converter.py` |
| **Тесты** | `backend/payment/test_checkout_currency.py` + существующие |

## Заметки для агента-исполнителя (Composer 2.5 Fast)
1. **Только файлы из Scope.** Frontend/гео не трогать (034/035).
2. **Regression-first:** сначала зелёный baseline существующих платёжных тестов,
   потом изменения. **Не удалять и не ослаблять** существующие проверки.
3. **Идемпотентность вебхуков** — обязательный тест; `UniqueConstraint` не трогать.
4. **Курс фиксируется один раз на сессию** и сохраняется; не дёргать курс повторно при capture/webhook.
5. **Минорные единицы:** Stripe CZK ×100; PayPal — строковое `value`. CZK-суммы целые кроны.
6. **EUR-конвертацию** делать только через pricing-сервис 031 (единый маркап), не дублировать формулу.
7. **Миграция — только nullable-поля**, без data-migration; проверять `makemigrations --check`.
8. **Идти 1→7 строго по порядку**, чекбокс + evidence после каждой итерации.
9. Сначала читать файл целиком; не рефакторить лишнее; не менять контракты сверх аддитивных полей.
10. Соблюдать `010-backend-django` (idempotency, транзакции), `030-testing`
    (мок Stripe/PayPal), `040-security` (не логировать платёжные данные/PII), `000-project-core`.
