# Stock reservation — staging rollout (Task 013 Phase 6)

Операционный runbook для включения `STOCK_RESERVATION_ENABLED=True` на **staging** (или staging-like).  
Код и миграции должны быть уже задеплоены с Phases 1–5; флаг до этого — `False`.

Связанные документы:

- [`docs/tasks/013-stock-reservation/task.md`](../tasks/013-stock-reservation/task.md) — дизайн и local Docker smoke
- [`docs/testing/stripe-e2e-checklist.md`](./stripe-e2e-checklist.md) — Stripe sandbox
- [`docs/testing/paypal-e2e-checklist.md`](./paypal-e2e-checklist.md) — PayPal sandbox
- [`docs/07-deployment.md`](../07-deployment.md) — общий деплой backend

---

## 1. Deploy + migrations

На сервере staging (рабочая директория обычно `/home/reli/reli.one/`):

```bash
cd /home/reli/reli.one
git pull   # нужный tag/branch с Task 013
docker compose build backend
docker compose up -d backend
docker compose exec backend python manage.py migrate --noinput
docker compose exec backend python manage.py makemigrations --check
```

Ожидание: миграция `warehouses.0002_stock_reservation` применена, ошибок нет.

---

## 2. Enable feature flag

В **staging** `envs/backend.env` (не коммитить):

```env
STOCK_RESERVATION_ENABLED=True
STOCK_RESERVATION_TTL_MINUTES=35
```

Перезапуск backend:

```bash
docker compose up -d --force-recreate backend
```

Проверка в контейнере:

```bash
docker compose exec backend python -c \
  "from django.conf import settings; print(settings.STOCK_RESERVATION_ENABLED)"
# ожидание: True
```

---

## 3. Cron — `release_expired_reservations`

Каждые 5 минут (хост или cron пользователя `reli`):

```cron
*/5 * * * * cd /home/reli/reli.one && docker compose exec -T backend python manage.py release_expired_reservations >> /var/log/reli-release-expired.log 2>&1
```

Проверка вручную:

```bash
docker compose exec backend python manage.py release_expired_reservations --dry-run
docker compose exec backend python manage.py release_expired_reservations
```

---

## 4. Automated smoke on staging DB

```bash
docker compose exec backend python manage.py migrate --noinput
docker compose exec backend python manage.py smoke_stock_reservation
```

Ожидание: `Stock reservation rollout smoke: all checks passed.`

> Команда создаёт тестовые seller/SKU в **staging БД**. Запускать на копии или в окне обслуживания; не гонять на production в часы пик.

---

## 5. Manual sandbox smoke (evidence)

Заполнить таблицу после прогона. PSP — только **test/sandbox** ключи из staging env.

| # | Сценарий | Шаги | Ожидание | OK / дата |
|---|----------|------|----------|-----------|
| 5.1 | Stripe checkout success | SKU stock≥2, оплата test card, webhook доставлен | Order + Payment; `StockReservation` → `confirmed`; `quantity_in_stock` −qty | |
| 5.2 | PayPal checkout success | Sandbox, capture webhook | То же | |
| 5.3 | Insufficient stock → 409 | SKU `quantity_in_stock=1`, два checkout подряд | Второй: HTTP **409**, body `{"stock":{sku,requested,available}}` | |
| 5.4 | Webhook replay | Повторить success webhook для того же `session_id` | Без второго Order; без второго списания stock | |
| 5.5 | Abandoned checkout | Начать checkout, не платить; дождать TTL+cron или `checkout.session.expired` | `StockReservation` → `expired` или `released`; `reserved_quantity` → 0 | |

### 5.1 Stripe (кратко)

1. Выбрать тестовый SKU с известным остатком (admin → Warehouse items).
2. Checkout через Frontend3 / API `POST /api/create-stripe-payment/`.
3. Оплатить в Stripe test mode.
4. Webhook: Stripe Dashboard → event delivery или `stripe listen --forward-to https://<staging-host>/api/stripe-webhook/`.
5. Admin: `Stock reservations` — статус `confirmed`; Warehouse item — остаток уменьшен на qty.

### 5.3 Insufficient stock

1. В admin выставить `quantity_in_stock=1`, `reserved_quantity=0`.
2. Первый checkout → 200 + PENDING reservation.
3. Второй checkout (тот же SKU, qty=1) → **409**.

### 5.5 Abandoned

- Подождать **>35 мин** и убедиться, что cron перевёл резерв в `expired`, **или**
- Отправить Stripe `checkout.session.expired` с `metadata.session_key` из metadata.

---

## 6. Monitoring

### Management command (рекомендуется)

```bash
docker compose exec backend python manage.py report_stock_reservation_health
# JSON для скриптов:
docker compose exec backend python manage.py report_stock_reservation_health --json
```

Смотреть:

- `pending_stale_expired` → должно быть **0** после cron (или кратковременно до следующего запуска)
- `warehouse_items_reserved_exceeds_in_stock` → **0**
- `pending_total` — низкий, без роста «пилой»

### SQL (PostgreSQL)

```sql
-- По статусам
SELECT status, COUNT(*) FROM warehouses_stockreservation GROUP BY status;

-- Просроченные PENDING (должны уходить cron'ом)
SELECT session_key, expires_at, created_at
FROM warehouses_stockreservation
WHERE status = 'pending' AND expires_at < NOW()
ORDER BY expires_at
LIMIT 50;

-- Несогласованность reserved vs in_stock
SELECT wi.id, pv.sku, wi.quantity_in_stock, wi.reserved_quantity
FROM warehouses_warehouseitem wi
JOIN product_productvariant pv ON pv.id = wi.product_variant_id
WHERE wi.reserved_quantity > wi.quantity_in_stock;
```

### HTTP 409

Логи backend / reverse proxy: доля 409 на:

- `POST /api/create-stripe-payment/`
- `POST /api/create-paypal-payment/`

При нормальном stock 409 — редкие (гонка двух покупателей на последний item). Устойчивый рост — проверить остатки и cron.

### Django admin

После деплоя доступны:

- **Stock reservations** — фильтр по status, `expires_at`
- **Warehouse items** — колонки `quantity_in_stock`, `reserved_quantity`

---

## 7. Rollback

При oversell, залипших PENDING, росте 409:

1. `STOCK_RESERVATION_ENABLED=False` в staging `backend.env`
2. `docker compose up -d --force-recreate backend`
3. **Оставить** cron `release_expired_reservations` включённым
4. `report_stock_reservation_health` — контроль затухания PENDING
5. Ручная сверка остатков в admin / WMS

Откат **кода** не обязателен, если достаточно выключить флаг.

---

## Evidence block (заполнить после rollout)

| Поле | Значение |
|------|----------|
| Дата | |
| Среда | staging URL |
| Git ref | |
| `smoke_stock_reservation` | pass / fail |
| Manual 5.1–5.5 | |
| Health после 24h | `pending_stale_expired=` |
| Решение | go prod / hold |
