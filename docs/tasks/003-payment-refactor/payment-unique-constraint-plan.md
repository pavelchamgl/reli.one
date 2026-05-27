# Execution plan: составной unique на `Payment` (`payment_system`, `session_id`)

**Режим:** план только, без изменения runtime-кода в этом документе.

**Решение:** `models.UniqueConstraint(fields=["payment_system", "session_id"], name="…")`, а не `unique=True` только на `session_id` — совпадает с идемпотентным ключом в `webhook_processing._replay_if_payment_exists` и допускает теоретическое пересечение строковых id между провайдерами.

---

## 1. `payment/models.py` и миграции (текущее состояние)

### Модель

Файл: `backend/payment/models.py`

- `Payment`: `payment_system` (`max_length=10`), `session_id` (`max_length=100`), без `Meta.constraints`, без `unique` на полях.
- Остальные модели приложения (`PayPalMetadata.session_key`, `StripeMetadata.session_key`) имеют **свои** `unique=True` — к составному ключу `Payment` не относятся.

### Миграции `payment`

| Файл | Содержание |
|------|------------|
| `0001_initial.py` | `Payment` с FK на `order` (исторически), поля вкл. `payment_system`, `session_id` без уникальных ограничений |
| `0002_remove_payment_order.py` | удалён FK `order` у `Payment` |
| `0003_payment_session_key.py` | добавлено поле `session_key` (nullable) |

**Вывод:** на таблице `payment_payment` **нет** `UNIQUE` / `UniqueConstraint` по `(payment_system, session_id)` или только по `session_id`. Следующая миграция должна быть **новой** (например `0004_...`) с `AddConstraint` + опционально дублирование в `Meta.constraints` на модели для согласованности state с БД.

---

## 2. Ограничения и индексы (ожидаемо в PostgreSQL)

После текущих миграций ожидается:

- PK на `id`
- Возможные индексы по FK (если появятся в других приложениях) — на `Payment` за пределами стандартного PK **уникальный индекс под constraint нет**.

Проверка на живой БД (до/после наката миграции):

```sql
-- Ограничения на payment_payment
SELECT conname, contype, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid = 'payment_payment'::regclass
ORDER BY conname;

-- Уникальные индексы (в т.ч. реализация UNIQUE)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'payment_payment';
```

---

## 3. Migration strategy

### 3.1 SQL: поиск дублей по `payment_system` + `session_id`

```sql
SELECT payment_system, session_id, COUNT(*) AS cnt, array_agg(id ORDER BY id) AS payment_ids
FROM payment_payment
GROUP BY payment_system, session_id
HAVING COUNT(*) > 1;
```

Дополнительно (качество данных, не обязательно для уникальности пары):

```sql
SELECT id, payment_system, session_id
FROM payment_payment
WHERE session_id = '' OR btrim(session_id) = '';
```

В Django-shell (эквивалент для отчёта):

```python
from django.db.models import Count
from payment.models import Payment

Payment.objects.values("payment_system", "session_id").annotate(c=Count("id")).filter(c__gt=1)
```

### 3.2 Если дубли найдены — до применения миграции

Автоматическое «слияние» **не планировать** в миграции без продуктового решения:

1. Для каждой группы `(payment_system, session_id)` определить **каноническую** строку `payment_payment`: обычно минимальный `id` или запись с фактической связью с `order_order` через `payment_id`.
2. Для неканонических строк:
   - либо перевесить FK заказов на канонический `Payment` (если на заказы ссылаются разные дубликаты),
   - либо удалить «лишние» `Payment` **только если** нет зависимых `Order` / `Invoice` и это подтверждено,
   - иначе — ручной разбор + бэкап.
3. Повторить запрос из §3.1 до **нулевого** числа строк в `HAVING`.

**NO-GO на `AddConstraint`**, пока дублей в проде/staging-копии не ноль.

### 3.3 Миграция: `AddConstraint`

1. В `Payment.Meta` добавить:

   ```python
   constraints = [
       models.UniqueConstraint(
           fields=["payment_system", "session_id"],
           name="payment_payment_system_session_id_uniq",
       ),
   ]
   ```

   Имя сократить при необходимости до лимита PostgreSQL (63 байта для идентификаторов).

2. Сгенерировать миграцию `AddConstraint` (предпочтительно `makemigrations`, без ручного `RunSQL`, если нет особых требований).

3. На **PostgreSQL** операция создаёт уникальный индекс; на больших таблицах выполнять в окне с приемлемой блокировкой (как правило `ACCESS EXCLUSIVE` на короткое время — оценить размер `payment_payment`).

4. Откат миграции: `RemoveConstraint` — заранее прописать обратную операцию.

---

## 4. План изменения кода (после появления constraint)

### 4.1 Проблема: TOCTOU

`_replay_if_payment_exists` выполняется **до** `transaction.atomic()` в `_persist_checkout_in_atomic`. Два параллельных webhook могут оба не увидеть `Payment` и зайти в создание → второй упадёт на `Payment.objects.create` с **`IntegrityError`** (нарушение уникальности).

Откат `atomic()` откатывает все заказы/строки, созданные во **второй** транзакции до ошибки — **двойных заказов от второго запроса не останется**, но без обработки ответ будет **`None`** → view отдаёт **500** и провайдер ретраит.

### 4.2 Где ловить `IntegrityError`

- **Основное место:** сразу вокруг `Payment.objects.create(...)` внутри `_persist_checkout_in_atomic` (`backend/payment/services/webhook_processing.py`), внутри того же `with transaction.atomic():`.
- Импорт: `from django.db import IntegrityError` (Django оборачивает драйвер).

При срабатывании уникального ограничения Django помечает транзакцию **broken**; дальнейшие запросы в том же `atomic()` невозможны — поэтому:

- либо **узкий** вложенный `atomic(savepoint=True)` только вокруг `Payment.objects.create`, чтобы перевести «конфликт» в откат savepoint без убийства всей транзакции создания заказов,
- либо (проще по объёму отладки): ловить `IntegrityError` **снаружи** внешнего `transaction.atomic()`, зная что **вся** транзакция откатилась (включая заказы второго конкурента) — затем выполнить **отдельный** путь «replay без повторного создания».

Рекомендация для плана: **второй вариант** — меньше вложенных savepoint-тонкостей с PostgreSQL и длинной транзакцией создания многих моделей:

1. Внутри текущего `try`/`except` обернуть `with transaction.atomic():` так, чтобы при `IntegrityError`, выброшенном из `Payment.objects.create`, внешний код получил управление после полного отката.
2. В `except IntegrityError:` (фильтр по уникальному constraint / опционально проверка `__cause__`):
   - залогировать предупреждение (без PCI-данных),
   - вызвать ту же семантику, что и успешный replay: загрузить существующий `Payment` по `(payment_system, session_id)`, вызвать `set_conv_cache_after_commit(data.conv_cache_id, amount, currency)` с суммой из БД,
   - вернуть `WebhookProcessingResult(orders=[], is_replay=True)`.

Уточнение: `set_conv_cache_after_commit` требует контекста `atomic` или сразу пишет при отсутствии открытой транзакции — как в `_replay_if_payment_exists`; после отката транзакции открытой транзакции нет → поведение `on_commit` как у существующего replay (уже документировано в коде).

### 4.3 Превратить конфликт в replay semantics

Идентично успешному сценарию «платёж уже есть»:

- `orders=[]`, `is_replay=True` (при необходимости уточнить флаг `invoice_created` — для replay сейчас не критичен для view).
- **Не** вызывать `_schedule_post_commit_side_effects` для «фальшивого» успеха второго запроса с пустым списком заказов (как при обычном replay) — иначе дубли email/посылок.

Вынести общий хелпер уровня `_replay_result_after_existing_payment(data, payment_row, source)` по желанию, чтобы не дублировать `_replay_if_payment_exists` и post-`IntegrityError` путь.

### 4.4 Сохранить поведение HTTP webhook (контракт ответов)

Текущее (`backend/payment/views.py`):

| View | `result is None` | `result.is_replay` | Успех (новый checkout) |
|------|------------------|-------------------|-------------------------|
| `StripeWebhookView` | 500 + `{"error": "Order creation failed"}` | **200**, **пустое тело** | 200 + `{"status": "N order(s) created successfully"}` |
| `PayPalWebhookView` | 500 + то же | **200** + **тело** `{"status": "0 order(s) created successfully"}` (длина `orders`) | 200 + то же с N > 0 |

После обработки `IntegrityError` как replay:

- `create_orders_and_payment` должен вернуть **`WebhookProcessingResult` с `is_replay=True`**, не `None`.
- **Не менять** ветвление в views (сохраняется существующий контракт): Stripe — пустой 200 при replay; PayPal — JSON с `0 order(s)...` при replay.

---

## 5. План тестов

Размещение: расширить `backend/payment/tests.py` и/или `backend/payment/test_checkout_flow.py` по стилю проекта; моки Stripe/PayPal как в существующих webhook-тестах.

| # | Сценарий | Ожидание |
|---|----------|----------|
| 1 | Два последовательных вызова обработки одного и того же `WebhookPaymentData` (или двойной POST webhook с тем же payload) | Один `Payment`, один набор заказов; второй ответ **200**; для Stripe — replay с пустым телом |
| 2 | **Simulated `IntegrityError`:** патч `Payment.objects.create` → первый вызов успех, второй — `IntegrityError`, либо один вызов с side_effect после того как pre-check «не нашёл» Payment | `create_orders_and_payment` возвращает **не** `None`, `is_replay is True`; conv-cache путь можно проверить моком `set_conv_cache_after_commit` |
| 3 | Конкурентные два потока/зелёный интеграционный тест (опционально, `TransactionTestCase`) с двумя параллельными `create_orders_and_payment` | В БД ровно один `Payment` на пару ключей и ровно один набор заказов для успешного коммита |
| 4 | Регрессия: успешный первый webhook по-прежнему создаёт заказы и возвращает тело со статусом (PayPal / Stripe) как сейчас | Без изменений |

Отдельно: после миграции прогнать полный **`pytest payment/`** в Docker (`docker-compose.test.yml`).

---

## 6. Краткий чеклист исполнения

1. Прогнать SQL дублей на целевой БД → при ненулевом результате — ручная чистка / NO-GO.
2. Добавить `UniqueConstraint` в модель + миграция `0004_…`.
3. Реализовать обработку `IntegrityError` в сервисе checkout (без изменения контрактов URL/тела, кроме уже описанной семантики replay).
4. Тесты: дубль webhook, патч IntegrityError→replay, отсутствие дубликатов Order/Payment.
5. Обновить `docs/tasks/003-payment-refactor/task.md` (DoD: составной ключ вместо «unique на session_id»), при необходимости `iteration-3-atomic-fixes-plan.md`.

---

## 7. Нужны ли изменения вне этого плана

- **Миграции:** да (одна).
- **Views:** только если семантику replay нужно унифицировать между Stripe и PayPal — **вне scope** этого constraint; по умолчанию **не трогать**.
- **Публичный API webhook:** без изменений путей и кодов успеха; тела ответов — как сейчас для replay vs success.
