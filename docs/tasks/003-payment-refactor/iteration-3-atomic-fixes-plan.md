# Iteration 3 — Atomic Fixes (план)

**Связь с задачами:** атомарность payment/promo/invoice описана в **[Task 003 — Payment Refactor](./task.md)** (раздел *Iteration 3 — Atomic Fixes*).  
Файл `docs/tasks/007-frontend-critical-fixes/task.md` в своём *Iteration 3* касается **frontend** (чтение токена); к этому плану он не относится.

**Режим:** только план, без изменения кода.

---

## 1. `Payment.session_id` и идемпотентность

### 1.1 Текущая модель

Файл: `backend/payment/models.py`

```12:20:backend/payment/models.py
    payment_system = models.CharField(max_length=10, choices=PAYMENT_SYSTEM_CHOICES)
    session_id = models.CharField(max_length=100)
    session_key = models.CharField(max_length=50, null=True, blank=True)
    customer_id = models.CharField(max_length=100, blank=True, null=True)
    payment_intent_id = models.CharField(max_length=100)
    payment_method = models.CharField(max_length=50)
    amount_total = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10)
    customer_email = models.EmailField()
```

- **`session_id`:** обязательное поле: нет `null=True`, нет `blank=True` на модели → в БД NOT NULL (пустые строки технически возможны при ручном/старых данных — стоит проверить отдельно).
- **`unique`:** отсутствует — возможны несколько строк с одним `(payment_system, session_id)` в текущей схеме.

Черновик в `task.md` (пр. `max_length=255`) **не совпадает** с кодом: сейчас `max_length=100`.

### 1.2 Что использовать как ограничение уникальности

В коде идемпотентность уже завязана на пару **`(payment_system, session_id)`**:

```179:193:backend/payment/services/webhook_processing.py
def _replay_if_payment_exists(
    data: WebhookPaymentData,
    source: str,
) -> WebhookProcessingResult | None:
    ...
    existing = Payment.objects.filter(
        payment_system=data.payment_system,
        session_id=data.session_id,
    ).only("amount_total", "currency").first()
```

**Рекомендация для миграции:** `models.UniqueConstraint(fields=["payment_system", "session_id"], name="...")`, а не «голый» `unique=True` только на `session_id`:

- Stripe `cs_*` и PayPal order id — разные пространства имён; глобальная уникальность только по `session_id` избыточно жёсткая и расходится с бизнес-ключом в сервисе.
- Если **принято продуктовое решение** «один session_id только в одном payment_system навсегда», составной constraint это гарантирует явно.

DoD Task 003 сформулирован как «`session_id` unique» — перед реализацией имеет смысл **согласовать**: либо обновить DoD под составной ключ, либо обоснованно оставить только `session_id` (если гарантирован один провайдер / один формат id).

### 1.3 Проверка дублей перед миграцией

На **production/staging** (и на копии БД):

**По составному ключу (предпочтительно):**

```sql
SELECT payment_system, session_id, COUNT(*) AS cnt
FROM payment_payment
GROUP BY payment_system, session_id
HAVING COUNT(*) > 1;
```

**Только по `session_id` (если выбран unique на одном поле):**

```sql
SELECT session_id, COUNT(*) AS cnt
FROM payment_payment
GROUP BY session_id
HAVING COUNT(*) > 1;
```

Дополнительно полезно:

```sql
SELECT COUNT(*) FROM payment_payment WHERE session_id = '' OR trim(session_id) = '';
```

В Django-shell (прикидка без сырого SQL):

```python
from django.db.models import Count
from payment.models import Payment

Payment.objects.values("payment_system", "session_id").annotate(c=Count("id")).filter(c__gt=1)
```

Любая найденная группа должна быть **разобрана вручную** (какая запись истинная, связь с заказами) до `AddConstraint` / `UniqueConstraint`.

### 1.4 Безопасная migration strategy

1. **Freeze / окно деплоя:** минимизировать параллельные вебхуки на время деплоя (обычно достаточно обычного rolling deploy при корректной обработке `IntegrityError` в коде).
2. **Данные:** исправить или слить дубли; убедиться, что не остаётся противоречий с `Order.payment`.
3. **Миграция:** добавить `UniqueConstraint` (рекомендуется на `[payment_system, session_id]`). При только `unique=True` на `session_id` — `AlterField` + индекс уникальности (и отдельная проверка дублей по одному полю).
4. **Код после constraint:** см. ниже — обязательна обработка гонки «два вебхука до первого коммита».

Не полагаться на «одну миграцию без правки сервиса»: при TOCTOU (см. ниже) вторая транзакция получит ошибку от БД.

### 1.5 Поведение `create_orders_and_payment` после unique constraint

**Текущий поток:**

1. Вне транзакции: `_replay_if_payment_exists` — если запись уже есть → replay, без создания.
2. Внутри `_persist_checkout_in_atomic`: `Payment.objects.create(...)`.

**Проблема:** между шагами 1 и 2 возможна **гонка**: два процесса оба видят отсутствие `Payment`, оба входят в `transaction.atomic()` и один из `Payment.objects.create` упадёт с **`IntegrityError`**.

После добавления уникального ограничения нужно:

- В **`_persist_checkout_in_atomic`** (или вокруг `Payment.objects.create`): перехватить `django.db.utils.IntegrityError`, залогировать, **повторить семантику replay** — например второй транзакцией прочитать существующий `Payment`, выставить conversion cache (`set_conv_cache_after_commit` с суммами из БД как в `_replay_if_payment_exists`) и вернуть результат уровня «replay» без второго набора заказов.
- Альтернатива уровня БД (сложнее): единственный вход через `INSERT ... ON CONFLICT` / raw SQL — в Django безопаснее explicit `IntegrityError` + та же replay-ветка.

**Не рекомендуется** простой `get_or_create(session_id=...)` без указания всего ключа уникальности и без учёта `payment_system`: не совпадёт с моделью и создаст дыры в идемпотентности.

**Важно:** при `IntegrityError` после частичного создания заказов в той же транзакции откатит **весь** `atomic()`-блок — двойные заказы из-за двух успешных коммитов не появятся; нужно только корректно на внешнем уровне вернуть успех вебхуку (часто 200) как при replay.

Итого: ограничение БД — **страховка**; код должен трактовать нарушение уникальности как **идемпотентный повтор**, аналогично `_replay_if_payment_exists`.

---

## 2. `PromoCode.increment_used_count`

### 2.1 Где вызывается сейчас

- Метод **определён** в `backend/promocode/models.py`.
- Прямой вызов **через обёртку** `increment_promo_usage` в `backend/payment/views.py`; поиск по кодовой базе **не показывает других вызовов** `increment_promo_usage` / `increment_used_count()` — обёртка фактически **мёртвый код** на момент анализа, но метод остаётся публичным API модели для будущего/админки/скриптов.

Документация (`docs/02-user-flows.md` и др.) упоминает инкремент при оплате — при появлении реального вызова из webhook/checkout **гонка сохранится**, пока не заменено на атомарный update.

Отдельно: **`apply_promo_code`** читает `used_count < max_usage` без блокировки — это **отдельный класс race** (лимит использований при параллельных чекаут-сессиях). Iteration 3 по Task 003 фокусируется на **`F()`-инкременте**, не обязано одним изменением закрыть лимит.

### 2.2 Безопасная замена на `F()`

Паттерн из `task.md`:

```python
from django.db.models import F

def increment_used_count(self):
    PromoCode.objects.filter(pk=self.pk).update(used_count=F("used_count") + 1)
    self.refresh_from_db(fields=["used_count"])
```

Замечания:

- **`update`** не вызывает `full_clean`/`save`-сигналы на модели — для счётчика обычно приемлемо.
- Если **когда-либо** понадобится инкремент с проверкой `max_usage`, безопаснее делать **`select_for_update()`** строки промокода в той же `transaction.atomic()`, что и списание, плюс `update` с условием (или один SQL `UPDATE … WHERE used_count < max_usage` с проверкой `cursor.rowcount` / `update()` возвращаемого числа).

### 2.3 Нужны ли тесты конкурентности

| Уровень | Нужность |
|---------|----------|
| **Юнит:** один вызов увеличивает счётчик на 1 | Да (минимум). |
| **Интеграционный под нагрузкой:** несколько потоков/процессов бьют в один промокод | Желательно (Task 003 Iteration 2 черновик: `promocode/tests_concurrent.py`), чтобы зафиксировать отсутствие потерянных инкрементов. |
| Строгое доказательство `used_count <= max_usage` без блокировки лимита | Только если в том же изменении закрывается и лимитирующая логика. |

Стресс-тесты с `ThreadPoolExecutor` или `multiprocessing` в CI могут быть флаки — допустима пометка `pytest.mark.stress` / запуск только в nightly.

---

## 3. `InvoiceSequence`

### 3.1 Текущая реализация

Файл: `backend/order/services/invoice_numbers.py`

```15:31:backend/order/services/invoice_numbers.py
@transaction.atomic
def next_invoice_identifiers() -> tuple[str, str]:
    series = _current_series()

    seq, _ = (InvoiceSequence.objects
              .select_for_update()
              .get_or_create(series=series, defaults={"last_number": 0}))

    InvoiceSequence.objects.filter(pk=seq.pk).update(last_number=F("last_number") + 1)
    seq.refresh_from_db(fields=["last_number"])

    num_str = f"{seq.last_number:0{INVOICE_NUMBER_PAD}d}"

    invoice_number = f"{series}{num_str}"   # пример: "20250001234"
    variable_symbol = f"{series}{num_str}"   # пример: "20250001234"

    return invoice_number, variable_symbol
```

- Уже есть **`transaction.atomic`** и **`select_for_update()`** на queryset перед `get_or_create`.
- Инкремент через **`F("last_number") + 1`** — атомарно на строке после блокировки.

Утверждение Task 003 «InvoiceSequence без `select_for_update` (PAY-4)» **не совпадает с текущим кодом** — пункт Iteration 3 для invoice скорее **верификация + тесты + синхронизация документации**, а не слепое копирование примера из черновика `task.md` с `last_number += 1; save()` (такой вариант хуже уже существующего `F()`).

### 3.2 Нужно ли «добавлять» `select_for_update`

Практически: **убедиться**, что:

- нет второго пути выдачи номера, минуя `next_invoice_identifiers`;
- для PostgreSQL `get_or_create` под `atomic` + `select_for_update` ведёт себя ожидаемо; при гонке создания строки с тем же `series` срабатывает **unique на `series`** и одна транзакция откатывается/повторяется.

Опциональное усиление (если появятся багрепорты): вынести явный `get` + `create` с обработкой `IntegrityError` вместо `get_or_create` — редко нужно, если тесты уникальности зелёные.

### 3.3 Какие тесты нужны

- **Параллельные вызовы** `next_invoice_identifiers()` (несколько потоков в одном процессе или последовательные в транзакциях): все пары `(invoice_number, variable_symbol)` различны, `last_number` согласован с БД.
- **Смена года** (mock `timezone.now`): новая серия, счётчик с нуля или продолжение — по текущей бизнес-логике (`series` = год).
- **Регрессия вызовов:** `stripe_session` / `paypal_session` используют эту функцию — smoke через существующие payment-тесты с моком уже есть; отдельно тест в `order/` ближе к домену счётчика.

---

## Итоговая секция

### Рекомендуемый порядок выполнения

1. **PromoCode `F()`-инкремент** — низкий риск, без миграций, можно выкатывать отдельно + юнит-тест.
2. **InvoiceSequence** — только тесты/аудит путей (код уже с lock + `F()`); при необходимости минимальный рефактор без смены поведения.
3. **`Payment` unique constraint + обработка `IntegrityError`** — высокий контур; после проверки дублей на staging/prod-copy; затем код replay при конфликте; прогон `payment/tests`, `test_checkout_flow`.

### Что можно делать отдельно (независимые PR/коммиты)

- `PromoCode.increment_used_count` ↔ не трогает `payment_payment`.
- Документация Task 003 / PAY-4 (привести в соответствие с `invoice_numbers.py`).
- Тест конкурентности инвойсов ↔ тест промокода ↔ правка модели Payment — желательно разнести PR для ревью, но payment unique **должен** включать правку `_persist_checkout_in_atomic`.

### Какие миграции нужны

| Изменение | Миграция |
|-----------|----------|
| `UniqueConstraint(payment_system, session_id)` на `Payment` | Да, одна миграция `payment` |
| Только код PromoCode (`F()` в методе) | Нет |
| InvoiceSequence | Нет (поведение уже соответствует целевому) |

При смене DoD на `unique=True` только на `session_id` — **одна** `AlterField`/`RunSQL`-миграция под выбранный вариант (после отдельной проверки дублей по одному столбцу).

### Какие тесты обязательны

1. **Payment:** дубль вебхука / два параллельных создания одного `(payment_system, session_id)` → один коммит заказов, второй получает ограничение и обрабатывается как replay (HTTP 200, нет второго набора заказов). Уже есть задел в `test_checkout_flow` / `payment/tests.py` — **расширить** под `IntegrityError`-ветку, если её ещё нет.
2. **PromoCode:** хотя бы один тест атомарного инкремента; по возможности простой многопоточный сценарий.
3. **InvoiceSequence:** параллельные `next_invoice_identifiers()` → уникальные номера.

### GO / NO-GO

| Условие | Решение |
|---------|---------|
| Дубли `Payment` по выбранному ключу не очищены | **NO-GO** на миграцию unique |
| Нет обработки `IntegrityError` при `Payment.objects.create` после добавления constraint | **NO-GO** (гонка останется как 500/error вместо idempotent replay) |
| Продукт не согласовал: unique только `session_id` vs пара `(payment_system, session_id)` | **NO-GO** или **conditional GO** после явного решения |
| PromoCode только `F()` + юнит-тест | **GO** |
| InvoiceSequence: текущая реализация + недостающие тесты | **GO** |
| Обновить формулировки в `task.md` (max_length, invoice уже с `select_for_update`) перед исполнением | **GO** (рекомендуется как часть backlog документации) |

**Общее:** выполнение **GO** после пункта 1–2 возможно без DB- constraint; полный Scope Iteration 3 Task 003 — **GO** только при выполнении строк про миграцию `Payment` и тестах идемпотентности/конкурирующего создания.
