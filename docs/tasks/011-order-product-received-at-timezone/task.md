# Task 011 — OrderProduct.received_at: timezone-aware timestamps

**Priority:** P2  
**Complexity:** Low  
**Status:** Pending

## Цель

Устранить запись **наивного** (`naive`) datetime в поле `OrderProduct.received_at` при `USE_TZ=True`: использовать **timezone-aware** время через `django.utils.timezone.now()`, чтобы соответствовать настройкам Django и убрать `RuntimeWarning` в тестах и в runtime.

## Контекст

- В `backend/order/models.py`, метод `OrderProduct.save()` при переходе `received` в `True` выставляет:

```python
self.received_at = datetime.now()
```

- При включённой поддержке часовых поясов Django это даёт предупреждение:

`RuntimeWarning: DateTimeField OrderProduct.received_at received a naive datetime … while time zone support is active.`

- Поведение бизнес-логики (флаг «получено», очистка `received_at` при снятии флага) **не меняется** — меняется только корректность типа времени.

## Scope (область)

- `backend/order/models.py` — в `OrderProduct.save()` заменить присвоение `received_at` на `timezone.now()` (и добавить импорт `from django.utils import timezone` при необходимости).
- Убрать использование `datetime.now()` **только** в контексте `received_at` (см. «Связанное, но не в этом тикете»).

## Не входит в задачу

- Изменение схемы БД и миграций (`received_at` остаётся `DateTimeField` как есть).
- Изменение API request/response (контракты REST не трогаем).
- Массовый backfill уже сохранённых строк в БД (если в проде есть «наивные» значения — отдельное решение при необходимости).
- Рефакторинг `generate_order_number()` — там тоже `datetime.now()`, но это **строковый** номер заказа, не поле `DateTimeField`; вынос в отдельный тикет при желании.

## Зависимости

- **Task 002 (testing-foundation)** — в `backend/order/tests.py` уже есть `OrderProductReceivedAtTests`; после правки прогнать `manage.py test order` и/или `pytest order/`.

## Риски

- **Низкий:** семантика «момент отметки получения» сохраняется; значения станут aware и корректно сериализуются/сравниваются в коде, ориентированном на Django TZ.

## Definition of Done

- [ ] В `OrderProduct.save()` для `received_at` используется `timezone.now()` (или эквивалент из `django.utils.timezone`).
- [ ] Нет новых предупреждений `naive datetime` для `OrderProduct.received_at` при прогоне тестов `order.tests.OrderProductReceivedAtTests`.
- [ ] Тесты: при необходимости дополнить один assert — `self.assertTrue(timezone.is_aware(op.received_at))` после `received=True` и `save()` (опционально, но желательно для регрессии).
- [ ] `python manage.py test order` и `pytest order/` проходят в окружении CI (SQLite / тот же runner, что в проекте).

---

# Iterations

## Iteration 1 — Уточнение и патч

### Цель
Зафиксировать одно изменение в модели без побочных правок.

### Действия
- Открыть `backend/order/models.py`, класс `OrderProduct`, метод `save`.
- Заменить `datetime.now()` на `timezone.now()` для ветки `elif self.received:`.
- Проверить импорты: не оставить неиспользуемый `datetime` только ради этой строки, если больше нигде в файле для `received_at` не нужен (в файле `datetime` всё ещё используется в `generate_order_number()` — импорт оставить).

### Output
- Минимальный diff в одном файле (при необходимости — второй файл: тесты).

### Статус
- [ ] Патч смержен

---

## Iteration 2 — Тесты и регрессия

### Цель
Убедиться, что предупреждения исчезли и поведение сохранилось.

### Действия
- Запустить:
  - `DB_NAME= DB_HOST= SECRET_KEY=<достаточно-длинный-ключ> DEBUG=1 python manage.py test order`
  - `pytest order/ -v` (с теми же переменными, что приняты в проекте для SQLite).
- Опционально: в `OrderProductReceivedAtTests.test_received_at_set_when_marked_received` добавить проверку `timezone.is_aware`.

### Статус
- [ ] Все целевые тесты зелёные, предупреждений по `received_at` нет

---

## Примечание для ревью

Это **не** смена бизнес-правил, а приведение типа времени к ожиданиям Django при `USE_TZ=True`. Публичные контракты API не меняются.
