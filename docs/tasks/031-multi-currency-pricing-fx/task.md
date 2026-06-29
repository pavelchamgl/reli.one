# Task 031 — CZK как каноническая валюта: миграция цены + pricing-сервис + отображение в каталоге (backend)

**Priority:** P1
**Complexity:** High
**Status:** Planned
**ADR:** `docs/tasks/031-multi-currency-pricing-fx/adr-pricing-and-fx-policy.md`

> Исполнитель: агент Cursor, модель **Composer 2.5 Fast**.
> Перед началом прочитать **«Заметки для агента-исполнителя»** в конце.
> Это денежная миграция — действовать строго по итерациям, с бэкапом и dry-run.

---

## Цель

1. Сделать **CZK канонической валютой** хранения цены (`ProductVariant.price` —
   кроны, брутто с НДС), мигрировав существующие EUR-значения.
2. Ввести единый **pricing-сервис**: канон CZK → отображение в CZK (точно) или
   EUR (конвертация с маркапом к курсу).
3. Научить **read-API каталога** отдавать цену в выбранной валюте (**дефолт CZK**,
   EUR по запросу) + аддитивное поле `currency`.

Результат: клиент видит конечную цену (с эквайрингом; для EUR — с FX-маркапом)
**до корзины**. CZK-цена точная и стабильная.

## Контекст

- Эквайринг (`ACQUIRING_RATE = 1.04`) валютно-нейтрален — **не трогаем**.
- Курс `delivery.services.currency_converter.get_czk_to_eur_rate_cached()` (CZK за
  1 EUR, кеш 24 ч, fallback). В 031 используем **как есть**; смена источника на
  CNB JSON API и refresh 2×/день — задача 032 (сигнатура функции сохранится).
- Цена отдаётся в `ProductVariantSerializer` (detail: `price`, `price_without_vat`)
  и `BaseProductListSerializer` (list/search: `price` из `final_min_price`).
- БД-аннотации, фасеты min/max и сортировка остаются в канонической CZK; в EUR
  конвертируем **только на слое представления** (`to_representation`).

## Scope (область) — ровно эти файлы

**Создать:**
- `backend/product/services/__init__.py` — маркер пакета.
- `backend/product/services/pricing.py` — pricing-сервис.
- `backend/product/test_pricing.py` — unit + API тесты.
- `backend/product/management/commands/migrate_prices_eur_to_czk.py` — миграция
  данных (курс из CNB на дату, `--dry-run`, бэкап, audit-report, обратимость).
- `backend/product/test_price_migration.py` — тесты команды миграции.

**Изменить (для получения курса CNB по дате):**
- `backend/delivery/services/cnb_service.py` — добавить хелпер
  `get_czk_per_eur_for_date(date)` (CNB JSON API c `?date=`). Маленькое аддитивное
  дополнение; задача 032 потом переиспользует/расширит. Сигнатуру существующего
  `get_czk_per_eur()` не менять.

**Изменить (минимально, аддитивно):**
- `backend/backend/settings.py` — блок конфигурации валют/маркапа.
- `backend/product/serializers.py` — конвертация в `to_representation` + поле
  `currency` в двух сериализаторах.

**Больше никакие файлы не редактируются.**

## Не входит в задачу

- ❌ Checkout/оплата, валюта Stripe/PayPal, вебхуки, поля `Payment` — задача 033.
- ❌ Валюта доставки и периодический refresh курса 2×/день — задача 032.
  (В 031 добавляется только точечный хелпер `get_czk_per_eur_for_date` для миграции;
  полная замена операционного источника и cron — в 032.)
- ❌ Frontend, seller-формы, `Intl.NumberFormat`, замена `€`, i18n — задача 034.
- ❌ Гео-определение / market-bootstrap — задача 035.
- ❌ Изменение `ACQUIRING_RATE`, логики НДС, фасетов/сортировки, `favorites/*`.
- ❌ Изменение схемы `ProductVariant` (тип/precision поля не меняем — только данные).
- ❌ Рефакторинг «по пути».

## Зависимости

- `get_czk_to_eur_rate_cached` (только чтение операционного курса для display EUR).
- CNB JSON API `https://api.cnb.cz/cnbapi/exrates/daily?date=YYYY-MM-DD&lang=EN`
  (для курса миграции по дате).
- pytest-django (`backend/pytest.ini`), фикстуры `backend/conftest.py`.

## Риски

- **Денежная миграция (P0):** только с бэкапом, `--dry-run`, обратимостью, прогоном
  на staging. Курс берётся из CNB на `migration_date` и фиксируется в audit-report.
- **Двойной пересчёт:** в каталоге EUR конвертируем один раз на представлении;
  канонические CZK-значения не трогаем при выдаче CZK.
- **Повторный запуск миграции:** защита через проверку report за дату + `--allow-rerun`,
  иначе кроны умножатся на курс повторно.
- **Курс на дату недоступен** (до ~14:30 Праги): команда падает с понятной
  ошибкой; **запустить повторно после 15:00 в тот же день** (курс всё равно «на сегодня»).
  На prod не использовать `--date` для подстановки прошлого дня.
- **Регресс сортировки/фильтра по цене:** они работают по канонической CZK —
  не менять. Конвертация EUR — display-only.
- **Сеть в тестах:** CNB (и операционный курс, и курс по дате) **всегда мокать**.
- **Артефакты миграции** (backup/report) содержат денежные данные — хранить вне git
  (`backend/_migration_artifacts/` в `.gitignore` или внешнее хранилище).
- **Контракт API:** `currency` — аддитивное поле; ничего не переименовываем.

## Definition of Done

- [ ] `migrate_prices_eur_to_czk`: курс берётся из CNB на **текущую дату запуска**
      (сегодня, TZ Europe/Prague; без `--date` на prod); `--dry-run` показывает
      план + курс без записи; реальный прогон делает бэкап, пересчёт
      `CZK = ceil(EUR × rate)`, пишет audit-report JSON; есть обратимость
      (reverse из backup или `--reverse`); повтор требует `--allow-rerun`.
- [ ] `get_czk_per_eur_for_date(date)` в `cnb_service.py` (CNB JSON API `?date=`),
      без изменения сигнатуры `get_czk_per_eur()`.
- [ ] `pricing.py`: `get_display_currency(request)`,
      `convert_canonical_amount(amount_czk, currency)` по спецификации.
- [ ] `settings.py`: `DEFAULT_DISPLAY_CURRENCY=CZK`, `SUPPORTED_DISPLAY_CURRENCIES`,
      `FX_RATE_MARKUP` (через `os.getenv`).
- [ ] Сериализаторы отдают цену в валюте запроса (дефолт CZK) + поле `currency`.
- [ ] CZK: `ceil` до целой кроны; EUR: `ceil(czk / (rate − markup), 0.01)`.
- [ ] Тесты `test_pricing.py` (unit + API) и `test_price_migration.py` зелёные;
      курс замокан.
- [ ] `cd backend && pytest product -q` — без регресса.
- [ ] Миграций схемы нет: `python manage.py makemigrations --check --dry-run` чисто
      (команда меняет **данные**, не схему).
- [ ] Документация: чекбоксы + раздел «Результаты (evidence)» заполнены.

---

## Спецификация `pricing.py`

```python
from __future__ import annotations
from decimal import Decimal, ROUND_CEILING
from django.conf import settings
from delivery.services.currency_converter import get_czk_to_eur_rate_cached

def get_display_currency(request) -> str:
    """query ?currency= → header X-Display-Currency → DEFAULT_DISPLAY_CURRENCY.
    Невалидная валюта → дефолт. Код в верхнем регистре из SUPPORTED."""
    default = getattr(settings, "DEFAULT_DISPLAY_CURRENCY", "CZK")
    supported = set(getattr(settings, "SUPPORTED_DISPLAY_CURRENCIES", ["CZK"]))
    if request is None:
        return default
    raw = (
        (request.query_params.get("currency") if hasattr(request, "query_params")
         else request.GET.get("currency"))
        or request.headers.get("X-Display-Currency") or ""
    )
    code = raw.strip().upper()
    return code if code in supported else default

def convert_canonical_amount(amount_czk, currency: str) -> Decimal:
    """Канон CZK → валюта показа.
    CZK → ceil до целой кроны.
    EUR → ceil(czk / (rate − FX_RATE_MARKUP), 0.01)."""
    amount = amount_czk if isinstance(amount_czk, Decimal) else Decimal(str(amount_czk))
    code = (currency or "CZK").upper()

    if code == "CZK":
        return amount.quantize(Decimal("1"), rounding=ROUND_CEILING)

    if code == "EUR":
        rate = get_czk_to_eur_rate_cached()                    # CZK за 1 EUR
        markup = Decimal(str(getattr(settings, "FX_RATE_MARKUP", "0.30")))
        eff = rate - markup
        if eff <= 0:                                           # защита от плохого курса
            eff = rate
        eur = (amount / eff).quantize(Decimal("0.01"), rounding=ROUND_CEILING)
        return eur

    return amount.quantize(Decimal("1"), rounding=ROUND_CEILING)
```

Заметки:
- Для CZK сети нет (курс не запрашиваем).
- Возвращаемый `Decimal` форматирует сериализатор.

## Блок в `settings.py` (аддитивно)

```python
# Multi-currency (см. ADR pricing-and-fx-policy). Канон — CZK.
DEFAULT_DISPLAY_CURRENCY = os.getenv("DEFAULT_DISPLAY_CURRENCY", "CZK")
SUPPORTED_DISPLAY_CURRENCIES = [
    c.strip().upper()
    for c in os.getenv("SUPPORTED_DISPLAY_CURRENCIES", "CZK,EUR").split(",")
    if c.strip()
]
FX_RATE_MARKUP = os.getenv("FX_RATE_MARKUP", "0.30")  # CZK/EUR, аддит. маркап к курсу
```

## Правки в `serializers.py`

В `ProductVariantSerializer.to_representation` (расширить существующий):
```python
from product.services.pricing import get_display_currency, convert_canonical_amount
currency = get_display_currency(self.context.get("request"))
representation["currency"] = currency
representation["price"] = str(convert_canonical_amount(instance.price_with_acquiring, currency))
representation["price_without_vat"] = str(convert_canonical_amount(instance.price_without_vat, currency))
```
В `BaseProductListSerializer.to_representation` — аналогично для `price`
(из `final_min_price`) + `currency`.

> Канон теперь CZK, поэтому при `currency=CZK` значения = `ceil(canonical)`,
> при `currency=EUR` — конвертация. Поле `currency` добавляется в представление.

## Спецификация команды `migrate_prices_eur_to_czk`

**Назначение:** одноразовый перевод существующих `ProductVariant.price` из EUR в CZK
по курсу CNB **на дату запуска команды** (сегодня), с бэкапом, отчётом и обратимостью.

**Аргументы:**
- `--date=YYYY-MM-DD` — **только staging/тесты** (воспроизведение). На prod **не
  использовать**: курс всегда берётся на календарный день фактического запуска.
- `--dry-run` — печать плана и курса, без записи в БД.
- `--backup-path=PATH` — путь к backup JSON (дефолт:
  `backend/_migration_artifacts/price_migration_backup_<date>.json`).
- `--report-path=PATH` — путь к audit-report JSON (дефолт:
  `backend/_migration_artifacts/price_migration_report_<date>.json`).
- `--allow-rerun` — разрешить повторный прогон при существующем report за дату.
- `--reverse --backup-path=PATH` — откат: восстановить EUR-цены из backup.
- `--rate=NN.NN --force-manual-rate` — аварийный override курса (только если CNB
  недоступен); в отчёте `rate.source = "manual_override"`.

**Алгоритм (реальный прогон):**
1. `migration_date` = **сегодня** по календарю `Europe/Prague` (момент запуска).
   Если передан `--date` — только на staging/тестах; на prod команда должна
   завершаться ошибкой при наличии `--date` (или игнорировать с warning — выбрать
   один вариант в реализации и зафиксировать в evidence; **рекомендуется: ошибка на prod**).
2. Если report за `migration_date` существует и нет `--allow-rerun` → ошибка (идемпотентность).
3. Курс: `get_czk_per_eur_for_date(migration_date)` (или manual override). Если курс
   на сегодня ещё недоступен → ошибка «запустите после 15:00» (повтор в тот же день).
4. Для каждого `ProductVariant`: `price_czk = ceil(price_eur × rate)` (до целой кроны,
   `ROUND_CEILING`). Маркап и эквайринг **не применяются**.
5. Записать backup (полный список строк) до изменения БД.
6. В транзакции обновить `price`.
7. Записать audit-report JSON.
8. Лог одной строкой: `[MIGRATION] date=... rate=... (CNB) updated=N report=...` (без PII).

**Формат audit-report JSON:**
```json
{
  "report_version": "1",
  "migration_id": "20260701-153012-prague",
  "executed_at": "2026-07-01T15:30:12+02:00",
  "migration_date": "2026-07-01",
  "timezone": "Europe/Prague",
  "rate": {
    "source": "cnb_json_api",
    "cnb_valid_for": "2026-07-01",
    "currency_pair": "EUR/CZK",
    "czk_per_eur": "25.05",
    "fetched_at": "2026-07-01T15:30:10+02:00",
    "api_url": "https://api.cnb.cz/cnbapi/exrates/daily?date=2026-07-01&lang=EN"
  },
  "policy": {
    "from_currency": "EUR",
    "to_currency": "CZK",
    "rounding": "ROUND_CEILING to whole CZK",
    "fx_markup_applied": false,
    "acquiring_applied": false
  },
  "summary": {
    "variants_total": 847,
    "variants_updated": 847,
    "variants_skipped": 0,
    "price_eur_min": "0.01", "price_eur_max": "9999.99",
    "price_czk_min": "1", "price_czk_max": "250499"
  },
  "artifacts": {
    "backup_path": "backend/_migration_artifacts/price_migration_backup_2026-07-01.json",
    "report_path": "backend/_migration_artifacts/price_migration_report_2026-07-01.json",
    "dry_run": false
  },
  "rows_sample": [
    {"sku": "ABC-001", "variant_id": 12345, "price_eur_before": "29.99", "price_czk_after": "752"}
  ],
  "rows_full_in_backup": true
}
```
> Полный перечень строк — в backup JSON. В report — metadata + summary + выборка.
> Папку `backend/_migration_artifacts/` добавить в `.gitignore` (денежные данные).

## Спецификация `get_czk_per_eur_for_date` (в `cnb_service.py`)
```python
def get_czk_per_eur_for_date(date) -> Decimal:
    """CNB fixing на конкретную дату: GET exrates/daily?date=YYYY-MM-DD&lang=EN.
    Возврат: CZK за 1 EUR (Decimal). Если на дату курса нет — исключение
    (вызывающий показывает понятную ошибку). Та же валидация диапазона, что и
    get_czk_per_eur(). Существующую функцию не менять."""
```

---

# Iterations

## Iteration 1 — Analysis (read-only)
### Цель
Подтвердить точки расчёта цены, формат `ProductVariant.price`, наличие данных для миграции.
### Действия
- Прочитать `serializers.py` (оба сериализатора), `models.py`
  (`price_with_acquiring`, `price_without_vat`), `views.py` (`final_min_price`),
  `delivery/services/currency_converter.py`, `delivery/services/cnb_service.py`.
- Оценить кол-во строк `ProductVariant` для миграции (read-only запрос/анализ).
- Уточнить формат CNB JSON API (`exrates/daily?date=`) для `get_czk_per_eur_for_date`.
### Output
- Список точек правки; подтверждение, что курс миграции берётся из CNB на дату
  (ручной курс — только аварийный override).
### Статус
- [ ]

## Iteration 2 — Tests-first
### Цель
Зафиксировать поведение pricing-сервиса и миграции до реализации.
### Действия — `test_pricing.py` (курс замокан, напр. `Decimal("25.00")`, markup `0.30`)
- `convert_canonical_amount(Decimal("599"), "CZK")` → `599`.
- `convert_canonical_amount(Decimal("598.10"), "CZK")` → `599` (ceil).
- EUR: `convert_canonical_amount(Decimal("2470"), "EUR")` → `100.00`
  (2470 / (25−0.30)=2470/24.70=100.00).
- EUR ceil: `convert_canonical_amount(Decimal("2471"), "EUR")` → `100.05`
  (2471/24.70=100.0405 → ceil 0.01).
- `get_display_currency`: `?currency=EUR`→EUR; header→EUR; нет→CZK; `XXX`→CZK.
### Действия — `test_price_migration.py` (CNB HTTP замокан по дате)
- `get_czk_per_eur_for_date`: мок JSON-ответа → корректный `Decimal`; дата без курса → исключение.
- `--dry-run` ничего не пишет в БД, печатает план + курс.
- прогон: `price 10.00 EUR × rate(25.05) = 250.50 → ceil 251 CZK`; бэкап создан;
  report JSON создан с полями `rate.source=cnb_json_api`, `cnb_valid_for`, `summary`.
- идемпотентность: повтор без `--allow-rerun` при существующем report → ошибка/exit.
- reverse из backup восстанавливает EUR-цены.
- manual override: `--rate --force-manual-rate` → `rate.source=manual_override`.
### Output
- Красные тесты до Iteration 3–4.
### Статус
- [ ]

## Iteration 3 — Pricing service + config
### Действия
- Создать `services/__init__.py`, `services/pricing.py`; добавить блок в `settings.py`.
### Ограничения
- Единственный кросс-импорт из delivery — `get_czk_to_eur_rate_cached`.
### Output
- Unit-тесты pricing зелёные.
### Статус
- [ ]

## Iteration 4 — CNB date helper + migration command
### Цель
Безопасно перевести `ProductVariant.price` EUR→CZK по курсу CNB на **дату запуска (сегодня)**.
### Действия
- Добавить `get_czk_per_eur_for_date(date)` в `cnb_service.py` (JSON API `?date=`),
  не меняя `get_czk_per_eur()`.
- Реализовать команду `migrate_prices_eur_to_czk` по спецификации выше:
  `--date` (staging-only), `--dry-run`, `--backup-path`, `--report-path`, `--allow-rerun`,
  `--reverse`, аварийный `--rate --force-manual-rate`.
- Пересчёт `CZK = ceil(EUR × rate)`; бэкап до записи; запись в транзакции; audit-report JSON.
- Добавить `backend/_migration_artifacts/` в `.gitignore`.
### Ограничения
- Не менять схему/тип поля. Не запускать на проде в рамках задачи — только код + тесты + staging.
- Маркап и эквайринг к миграции не применять. Логировать без PII.
### Output
- Тесты миграции зелёные; команда идемпотентна (report + `--allow-rerun`); reverse работает.
### Статус
- [ ]

## Iteration 5 — Wire serializers
### Действия
- Обновить `to_representation` в обоих сериализаторах; добавить `currency`.
### Ограничения
- CZK-дефолт: значение = `ceil(canonical)`; не трогать `fields` сверх `currency`.
### Output
- API-тесты зелёные.
### Статус
- [ ]

## Iteration 6 — Validation & Docs
### Проверки
- [ ] `cd backend && pytest product/test_pricing.py product/test_price_migration.py -q`.
- [ ] `cd backend && pytest product -q` — без регресса.
- [ ] `python manage.py makemigrations --check --dry-run` — изменений схемы нет.
### Документация
- Чекбоксы + «Результаты (evidence)»: файлы, итоги тестов, курс миграции (дата + CNB-значение),
  пути backup/report.
### Статус
- [ ]

---

## Результаты выполнения (evidence)
_Заполняется исполнителем._
- Изменённые/созданные файлы:
- Курс миграции (дата + CNB CZK/EUR, source):
- Пути backup / report:
- Тесты (pricing / migration / product):
- makemigrations --check:
- Подтверждение: CZK-канон, EUR — конвертация с маркапом; checkout/delivery/frontend не затронуты.

---

## Привязка к коду
| Тип | Файлы |
|-----|-------|
| **Pricing-сервис** | `backend/product/services/pricing.py`, `services/__init__.py` |
| **Миграция данных** | `backend/product/management/commands/migrate_prices_eur_to_czk.py` |
| **Курс CNB по дате** | `backend/delivery/services/cnb_service.py` (`get_czk_per_eur_for_date`) |
| **Конфиг** | `backend/backend/settings.py` (блок multi-currency) |
| **Wiring** | `backend/product/serializers.py` |
| **Операц. курс (reference)** | `backend/delivery/services/currency_converter.py` |
| **Тесты** | `backend/product/test_pricing.py`, `backend/product/test_price_migration.py` |
| **Артефакты (gitignored)** | `backend/_migration_artifacts/` |
| **Не меняется** | `payment/*`, `order/*`, схема моделей, фасеты, `favorites/*`, frontend |

---

## Заметки для агента-исполнителя (Composer 2.5 Fast)
1. **Только файлы из Scope.** Нужно тронуть payment/frontend/схему — стоп, это 032–035.
2. **Идти 1→6 по порядку.** Тесты до реализации. Чекбокс + evidence после каждой итерации.
3. **Денежная миграция — максимально осторожно:** курс из CNB **на дату запуска**
   (сегодня, без `--date` на prod), бэкап, `--dry-run`, обратимость, audit-report.
   Повтор только с `--allow-rerun`. Запуск prod — после 15:00 Праги в рабочий день.
4. **Канон CZK:** при выдаче CZK не пересчитывать; конвертация только для EUR, один раз, на представлении.
5. **Сеть в тестах запрещена** — мокать и `get_czk_to_eur_rate_cached`, и
   `get_czk_per_eur_for_date` (никаких реальных запросов к CNB).
6. **Из delivery только чтение курса:** `get_czk_to_eur_rate_cached` (display EUR)
   и новый `get_czk_per_eur_for_date` (миграция). Полный refresh-источник 2×/день — НЕ здесь (032).
7. **Без миграций схемы** — только данные. Проверять `makemigrations --check`.
8. **Аддитивный контракт** — поле `currency` добавляем, остальное не трогаем.
9. **Сначала прочитать файл целиком, потом править.** Не рефакторить лишнее, не переформатировать неизменённые строки.
10. Соблюдать `040-security` (не логировать PII; не коммитить секреты) и `000-project-core` (не менять бизнес-поведение сверх описанного).
