# Task 032 — Валюта доставки (CZK/EUR) + единый источник курса CNB (JSON API, refresh 2×/день)

**Priority:** P1
**Complexity:** Medium
**Status:** Planned
**ADR:** `docs/tasks/031-multi-currency-pricing-fx/adr-pricing-and-fx-policy.md`
**Зависит от:** 031 (pricing-сервис, маркап, конфиг валют)

> Исполнитель: агент Cursor, модель **Composer 2.5 Fast**.
> Прочитать «Заметки для агента-исполнителя» в конце.

---

## Цель

1. Перевести источник курса CNB с парсинга `daily.txt` на **JSON API**
   `https://api.cnb.cz/cnbapi/exrates/daily`, сохранив публичную сигнатуру.
2. Добавить **management-команду обновления курса** для запуска по cron
   **2×/день в 09:00 и 15:00 Europe/Prague**.
3. Сделать вывод стоимости доставки **валютно-зависимым**: для CZK — нативные кроны
   (без конвертации), для EUR — конвертация с маркапом (через pricing-сервис 031).

## Контекст

- Сейчас курс парсится из `daily.txt`:
  ```11:42:backend/delivery/services/cnb_service.py
  def get_czk_per_eur() -> Decimal:
      ...
  ```
- Кеш/fallback в `delivery/services/currency_converter.py`
  (`get_czk_to_eur_rate_cached`, `convert_czk_to_eur`). **Сигнатуры сохраняем** —
  031 и 033 зависят от них.
- Доставка хранит тарифы в CZK (`ShippingRate`), конвертирует в EUR и начисляет VAT,
  отдаёт `currency:"EUR"` (`local_rates.py:_format_option`,
  `dpd_rates.py:_format_option_totals`). Параметр `currency` уже прокидывается в
  `calculate_*`, но реально игнорируется (всегда EUR).
- CNB публикует курс 1×/день ~14:30 Праги (см. ADR). 15:00 — свежий курс дня,
  09:00 — страховка доступности.

## Scope (область) — ровно эти файлы

**Изменить:**
- `backend/delivery/services/cnb_service.py` — функция получения курса через JSON API
  (`exrates/daily`), парсинг `EUR` (`rate`/`amount`/`validFor`). Оставить
  совместимый возврат `Decimal` (CZK за 1 EUR).
  > Если задача 031 уже смержена — в файле есть `get_czk_per_eur_for_date(date)`
  > (JSON API c `?date=`). Переиспользовать его: `get_czk_per_eur()` = курс на
  > сегодня через тот же парсинг (общий внутренний helper для разбора ответа CNB),
  > не дублировать HTTP/парсинг. Если 031 не смержена — создать оба согласованно.
- `backend/delivery/services/local_rates.py` — `_format_option` отдаёт валюту по
  параметру: CZK → нативно (CZK + VAT, без конвертации), EUR → как сейчас (через маркап).
- `backend/delivery/services/dpd_rates.py` — `_format_option_totals` аналогично.
- `backend/delivery/services/packeta.py` — провести `currency` до формата вывода.

**Создать:**
- `backend/delivery/management/commands/refresh_cnb_rate.py` — забор и кеширование курса.
- `backend/delivery/test_cnb_rate_source.py` — тесты JSON-парсинга и команды (мок HTTP).
- `backend/delivery/test_delivery_currency.py` — тесты валютного вывода доставки.

**Не редактировать другие файлы.**

## Не входит в задачу

- ❌ Выбор валюты заказа/передача её в checkout — задача 033 (здесь дефолт остаётся
  EUR, поведение не меняется, пока 033 не начнёт передавать CZK).
- ❌ Изменение тарифных данных `ShippingRate`, миграции.
- ❌ Frontend, форматирование, i18n — задача 034.
- ❌ Изменение `convert_czk_to_eur` сигнатуры; перенос функций между приложениями.

## Зависимости

- 031: `product.services.pricing.convert_canonical_amount` (для EUR-конвертации с маркапом),
  `FX_RATE_MARKUP`. Если 031 не смержен — согласовать порядок.
- pytest-django; `requests` уже используется.

## Риски

- **Сетевые тесты:** HTTP к CNB API **всегда мокать** (`requests`/responses).
- **Совместимость:** `get_czk_to_eur_rate_cached` не меняет сигнатуру/семантику
  (CZK за 1 EUR), иначе регресс 031/доставки/033.
- **Двойной маркап:** в доставке EUR-конвертацию делать через единый pricing-сервис,
  не дублировать формулу.
- **Регресс EUR-доставки:** при `currency="EUR"` значения должны совпадать с текущими
  (с точностью до округления); зафиксировать тестом.
- **Cron TZ:** команда не знает про TZ — расписание задаётся в cron (`Europe/Prague`).

## Definition of Done

- [ ] `cnb_service` получает курс из JSON API; при ошибке — прежний fallback-путь.
- [ ] `refresh_cnb_rate` обновляет кеш; документирован cron (09:00, 15:00 Праги).
- [ ] Доставка отдаёт `currency:"CZK"` с нативными кронами при запросе CZK и
      `currency:"EUR"` (как сейчас) при EUR.
- [ ] EUR-вывод доставки не регрессировал (тест).
- [ ] Тесты `test_cnb_rate_source.py`, `test_delivery_currency.py` зелёные (HTTP замокан).
- [ ] `cd backend && pytest delivery -q` — без регресса.
- [ ] Миграций нет: `makemigrations --check --dry-run` чисто.
- [ ] Документация: чекбоксы + evidence; cron-строки в `docs/07-deployment.md`
      (только если файл уже описывает cron; иначе — в этом task.md).

---

## Спецификация источника курса (CNB JSON API)

`GET https://api.cnb.cz/cnbapi/exrates/daily?lang=EN` → JSON:
```json
{ "rates": [ { "currencyCode": "EUR", "amount": 1, "rate": 25.05, "validFor": "2026-06-29" }, ... ] }
```
`czk_per_eur = Decimal(rate) / Decimal(amount)`. Валидация диапазона (как сейчас 10–100),
квантование как раньше. Таймаут ≤5с. При исключении — текущий fallback в
`get_czk_to_eur_rate_cached` срабатывает без изменений.

## Команда `refresh_cnb_rate`
- Делает «горячий» забор: вызывает источник, кладёт в кеш по существующему `CACHE_KEY`.
- Лог: дата `validFor`, курс. Без PII.
- Cron (TZ Europe/Prague), только рабочие дни:
  ```
  0 9 * * 1-5  cd /app/backend && python manage.py refresh_cnb_rate
  0 15 * * 1-5 cd /app/backend && python manage.py refresh_cnb_rate
  ```

## Валютный вывод доставки
- `_format_option` / `_format_option_totals`: принять валюту (из уже существующего
  `currency` параметра расчёта).
  - `CZK`: `price`/`priceWithVat` — из CZK-тарифа напрямую (+VAT), `currency:"CZK"`,
    округление как в доставке сейчас.
  - `EUR`: как сейчас, но конвертацию EUR делать через
    `product.services.pricing.convert_canonical_amount(czk, "EUR")` (единый маркап),
    либо оставить текущую `convert_czk_to_eur`, если 031 ещё не смержен — выбрать
    один путь и зафиксировать в evidence.

---

# Iterations

## Iteration 1 — Analysis (read-only)
- Прочитать `cnb_service.py`, `currency_converter.py`, `local_rates.py`,
  `dpd_rates.py`, `packeta.py`, `delivery/serializers.py`, `delivery/views.py`.
- Зафиксировать, где `currency` уже прокидывается и где «прибит» EUR.
- [ ]

## Iteration 2 — Tests-first
- `test_cnb_rate_source.py`: мок ответа JSON API → корректный `Decimal`; ошибка → fallback;
  команда `refresh_cnb_rate` кладёт значение в кеш (мок источника).
- `test_delivery_currency.py`: CZK-запрос → `currency:"CZK"` и нативные кроны;
  EUR-запрос → прежние значения (регресс-гард).
- Красные до Iteration 3–4.
- [ ]

## Iteration 3 — CNB JSON API + refresh command
- Переписать получение курса на JSON API (сохранить сигнатуру), создать команду.
- Unit/HTTP-моки зелёные.
- [ ]

## Iteration 4 — Delivery currency-aware output
- Обновить `_format_option`, `_format_option_totals`, протянуть `currency` в packeta.
- Тесты доставки зелёные; EUR не регрессировал.
- [ ]

## Iteration 5 — Validation & Docs
- [ ] `cd backend && pytest delivery -q`.
- [ ] `makemigrations --check --dry-run` чисто.
- [ ] Cron задокументирован; evidence заполнен.
- [ ]

---

## Результаты выполнения (evidence)
_Заполняется исполнителем._

## Привязка к коду
| Тип | Файлы |
|-----|-------|
| **Источник курса** | `backend/delivery/services/cnb_service.py` |
| **Кеш/конвертация (сигнатуры неизменны)** | `backend/delivery/services/currency_converter.py` |
| **Refresh-команда** | `backend/delivery/management/commands/refresh_cnb_rate.py` |
| **Валюта доставки** | `local_rates.py`, `dpd_rates.py`, `packeta.py` |
| **Тесты** | `backend/delivery/test_cnb_rate_source.py`, `backend/delivery/test_delivery_currency.py` |
| **Маркап (reuse из 031)** | `backend/product/services/pricing.py` |

## Заметки для агента-исполнителя (Composer 2.5 Fast)
1. **Только файлы из Scope.** Checkout/оплату не трогать (033). Frontend не трогать (034).
2. **Сигнатуру `get_czk_to_eur_rate_cached` и `convert_czk_to_eur` не менять.**
3. **HTTP в тестах всегда мокать**, реальных запросов к CNB быть не должно.
4. **EUR-доставка не должна регрессировать** — фиксировать тестом.
5. **Идти 1→5**, тесты до кода, чекбокс + evidence после каждой итерации.
6. Без миграций; `makemigrations --check`. Не переносить функции между приложениями.
7. Сначала читать файл целиком, потом править; не рефакторить лишнее.
8. Соблюдать `040-security`, `000-project-core`, `010-backend-django`.
