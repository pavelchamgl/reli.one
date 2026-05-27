# Мониторинг, алерты и логи (operational runbook)

Runbook описывает **минимальный** эксплуатационный контур **без** внедрения полноценного observability-stack (нет обязательного Prometheus/Grafana в рамках этой документации). Интеграция Sentry в код есть; **правила алертов в интерфейсе Sentry/Uptime‑провайдера нужно создать и включить самостоятельно** — этот документ **не** утверждает, что production‑алерты уже настроены.

Источник конфигурации файловых логов и привязки логгеров: [`backend/backend/settings.py`](../../backend/backend/settings.py), блок **`LOGGING`**.

Перекрёстные ссылки: [`docs/07-deployment.md`](../07-deployment.md) (deployment runbook, `/health/`, пост‑деплой), [Sentry production verification](../07-deployment.md#sentry-production-verification-runbook) — раздел того же файла про DSN/`before_send`/приёмку.

---

## 1. Какие лог‑файлы есть и где лежат

Каталог создаётся при старте приложения (`os.makedirs(..., "logs")`). Относительно корня приложения Django (в Docker prod‑образе обычно **`/app`**, монтируется из `./backend/`) это:

| Файл | Handler (уровень ротации) | Назначение (ориентир) |
|------|---------------------------|-------------------------|
| `logs/errors.log` | `RotatingFileHandler`, **уровень ERROR**, ~2.5 MiB × 6 файлов | Ошибки `django`, дубли ERROR из `delivery`; сводный канал серьёзных сбоев |
| `logs/debug.log` | `RotatingFileHandler`, **DEBUG** | Общая отладка: `django` (ниже ERROR — в том же файл), `accounts`, `sellers`; SQL‑бэкенд на **WARNING** |
| `logs/payment.log` | DEBUG | Логгер **`payment`** и дочерние модули (Stripe/PayPal webhook, создание заказа, почта клиентам/продавцам, счета — см. код `payment.services.*`) |
| `logs/otp.log` | DEBUG | Логгер **`otp`** |
| `logs/warehouse.log` | DEBUG | Логгер **`warehouse`** |
| `logs/currency.log` | DEBUG | `delivery.services.currency_converter`, `delivery.services.cnb_service` |
| `logs/georouting.log` | DEBUG (+ дубль в stdout для этого логгера) | `delivery.georouting` |

Формат строк по умолчанию: см. **`formatters.verbose`** и **`simple`** в том же блоке **`LOGGING`**.

**На хосте** при bind mount `./backend:/app` логи оказываются в **`backend/logs/`** репозитория на машине деплоя (путь может отличаться — сверять с вашим compose/volume).

---

## 2. Что смотреть после deploy (быстрый чеклист)

1. **`GET /health/`** → **200**, `{"status":"ok","db":"ok"}` — см. раздел Health в [`07-deployment.md`](../07-deployment.md).
2. **Sentry**: нет ли всплеска **новых Issues** после релиза (при включённом DSN и `DEBUG=False`).
3. **Хвосты файлов**: выборочно **`payment.log`** и **`errors.log`** на предмет ошибок webhook/оплаты в окне времени деплоя.
4. **`docker compose logs`** (или журнал процесса) на предмет падения worker’ов Gunicorn и traceback при старте — см. раздел deploy в **`07-deployment.md`**.
5. **Консоль PSP** (Stripe/PayPal): доставка webhook и коды ответов **4xx/5xx** для ваших URL за тот же период (**без** копирования секретов в тикеты).

---

## 3. Критичные симптомы (что искать по смыслу)

Ниже — **не** автоматический гарантированный паттерн каждого класса ошибки во всех путях кода; ориентир для ручной ревизии логов и внешних консолей.

| Симптом | Где искать первым делом |
|---------|--------------------------|
| **Webhook PSP 4xx/5xx** | Консоли Stripe/PayPal; `payment.log` (верификация подписи, обработчик); nginx/access при наличии; ответ приложения может дублироваться в **`errors.log`** при необработанных исключениях |
| **Сбой создания заказа после оплаты** | `payment.log` — сообщения webhook pipeline (напр. **`Unexpected error during order creation`**, см. [`webhook_processing.py`](../../backend/payment/services/webhook_processing.py)); при необработанном исключении — **Sentry** |
| **Сбой генерации/прикрепления инвойса (best‑effort)** | `payment.log` — строки вида **`Invoice creation failed`**; клиент может не получить письмо с инвойсом без полного падения заказа |
| **Не ушло письмо (клиент/менеджер/продавец)** | `payment.log` — префиксы вроде **`[CUSTOMER-MAIL]`**, **`[MANAGER-MAIL]`**, **`[SELLER-MAIL]`**, **`[EMAIL→CUSTOMER]`** (см. [`payment/services/base.py`](../../backend/payment/services/base.py), [`services_async.py`](../../backend/payment/services_async.py)) |
| **Курьер / отгрузка (Packeta, GLS, DPD и др.)** | **`delivery`** → записи **`debug.log`** и ERROR в **`errors.log`**; узкопрофильные логгеры см. приложение **`delivery`** |
| **`GET /health/` → 503** | Недоступна основная БД с точки зрения приложения; сочетать с логами DB/compose и мониторингом доступности Postgres |

Не полагаться только на текстовые логи при инцидентах платежей: статусы транзакций и ретраи webhook нужно сверять с **PSP** по регламенту команды.

---

## 4. Рекомендуемые production‑алерты (proposal, не статус факта)

Ниже список **целевого** набора правил мониторинга. Реализуется средствами Sentry Issue Alerts, uptime‑пингов, просмотра логов/диска по расписанию или будущего стека визуализации — **решение ops**.

| Область | Предложение |
|---------|--------------|
| **Sentry ERROR / новые issues** | Алерт на первое появление issue, регрессию или порог событий/мин для критичных тегов/окружений (когда будет задан **`environment`** в SDK — см. [`07-deployment.md`](../07-deployment.md)) |
| **Повторяющиеся сбои webhook** | По Sentry или по паттерну в **`payment.log`** (много ошибок за короткий интервал); дополнительно — доставка webhook в консолях PSP |
| **База недоступна | readiness** | **`/health/`** возвращает **503** или пинг недоступен N подряд; опционально — проверки Postgres с хоста/оркестратора |
| **Диск и ротация логов** | Порог занятости диска на томах с **`logs/`**, **медиа**, БД; при ротации Django **~6 × 2.5 MiB на каждый тип файла**, при высокой нагрузке оцените суммарный размер **`backend/logs/`** |
| **Почтовые сбои** | По наличию **`logger.exception`** / устойчивых **`[…-MAIL]`** ошибок в **`payment.log`** (или перевод ошибок отправки почты на отдельный алерт после доработки кода — вне задачи этого runbook) |
| **Courier API failures** | Всплеск **ERROR** в **`errors.log`**, связанных с **`delivery`**, или паттернов в **`debug.log`** по интеграциям перевозчиков |
| **Посылки после оплаты (заказ есть, этикеток нет)** | Строки **`[PARCELS]`** / смежные в логах; затем playbook — [`payment-flow.md` — Operational playbook](../payment-flow.md#operational-playbook-parcel-retry-and-follow-up) (ручной retry, без автоматики в текущем релизе) |

**Владение:** зафиксировать владельцев алертов и эскалации (см. раздел Alerts ownership в Sentry в **`07-deployment.md`**).

---

## 5. Ручной мониторинг без новых инструментов

| Действие | Когда / зачем |
|----------|----------------|
| **`docker compose logs -f backend`** (или `docker logs -f backend`) | Старт контейнера, немедленные traceback’и после деплоя |
| **`journalctl`** (если Gunicorn под systemd без Docker) | Аналогично для bare‑metal установок |
| **`tail -F backend/logs/payment.log`**, **`errors.log`** | Быстрая диагностика оплаты и почты после изменений в платежах |
| **Sentry — Issues / Discover** | Агрегированные ошибки, стектрейсы после релиза |
| **`curl`/браузер на `/health/`** | Периодический или перед/после релиза smoke доступности приложения и БД |

Секреты и токены **не** вставлять в команды журналирования для третьих лиц; не публиковать сырые тела webhook.

### Parcel generation — manual retry / follow-up

Пошаговый операционный процесс при сбое генерации посылок **после успешной оплаты** (логи, ручной повтор вызова `generate_parcels_for_order` / `fetch_and_store_labels_for_order`, эскалация) зафиксирован в **[Operational playbook: parcel retry and follow-up](../payment-flow.md#operational-playbook-parcel-retry-and-follow-up)** в `payment-flow.md`. Автоматический retry и Celery в коде **не** входят в минимальный контур текущего релиза. Статус задачи и таблица закрытия repo-scope — **[Task 005 — Final DoD](../tasks/005-delivery-cleanup/task.md#final-dod-table-task-005)**.

---

## 6. Связка с уже задокументированным деплоем

- Пост‑деплой: раздел **G** и smoke **E** в [`docs/07-deployment.md`](../07-deployment.md).
- Откат: раздел **F** того же документа.
- Приёмка ошибок через Sentry: [Sentry production verification](../07-deployment.md#sentry-production-verification-runbook).

---

## 7. Будущие улучшения (вне минимального runbook)

- **Структурированные JSON‑логи** для парсинга в log‑агентах без regex.
- **Prometheus/Grafana** (или управляемый аналог) для RED/USE‑метрик, HTTP и бизнес‑счётчиков — согласуется со строкой Scope в **`010`** («не входит» как обязательная реализация).
- **Асинхронные задачи очередью** (Celery/Task 005 и смежные задачи) — наблюдаемость ретраев и DLQ отдельно от HTTP‑запроса.
- **Единое маршрутирование алертов** (on‑call rotation, связка Slack/PagerDuty, подавление шума) поверх текущего Sentry + ручных проверок.

---

## Краткая отметка для Task 010

Наличие этого файла **документирует** эксплуатационные ожидания; подтверждение настроек алертов и регулярных проверок на **конкретном** production остаётся **ручным evidence**, не утверждением в git.
