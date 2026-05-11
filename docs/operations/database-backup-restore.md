# PostgreSQL: backup, restore и локальный e2e

Runbook для **production-safe** резервного копирования и восстановления копии БД в **локальном** e2e-контуре (`docker-compose.e2e.yml`). Документ не содержит реальных хостов, паролей и путей к секретам.

**Не коммитьте:** дампы, `*.sql`/`*.dump` с продакшен-данными, заполненные `envs/*.env`, каталог `backups/` с копиями БД.

---

## Термины

| Имя | Значение |
|-----|-----------|
| **Сервис Compose `postgres_e2e`** | Контейнер PostgreSQL для e2e (`reli_postgres_e2e`). |
| **Имя базы данных e2e** | Берётся из **`DB_NAME`** в `envs/database.e2e.env`; в шаблоне [`envs/database.e2e.env.example`](../../envs/database.e2e.env.example) обычно **`postgres`**. |
| **`./backups` на хосте** | Смонтирован в контейнер как **`/backups`** (`docker-compose.e2e.yml`). |

Порт с хоста: **`localhost:5434`** → `5432` в контейнере.

---

## 1. Backup production PostgreSQL

Выполняется **на узле с доступом к production БД** (или через защищённый bastion VPN). Подставьте плейсхолдеры; пароль — через `PGPASSWORD` или `.pgpass`, **не** в командной строке в истории shell при возможности избежать.

### 1.1 Формат custom (`-Fc`) — рекомендуется для restore через `pg_restore`

```bash
export PGHOST="<production-db-host>"
export PGPORT="5432"
export PGUSER="<production-user>"
export PGDATABASE="<production-db-name>"
# export PGPASSWORD="..."   # или используйте .pgpass

pg_dump \
  --format=custom \
  --file="./reli_prod_backup_$(date +%Y%m%d_%H%M).dump" \
  --no-owner \
  --no-acl \
  "${PGDATABASE}"
```

Артефакт: файл **`*.dump`** (бинарный custom format).

### 1.2 Plain SQL — альтернатива для `psql`

```bash
export PGHOST="<production-db-host>"
export PGPORT="5432"
export PGUSER="<production-user>"
export PGDATABASE="<production-db-name>"

pg_dump \
  --format=plain \
  --file="./reli_prod_backup_$(date +%Y%m%d_%H%M).sql" \
  --no-owner \
  --no-acl \
  "${PGDATABASE}"
```

Артефакт: файл **`*.sql`** (текст; может быть очень большим).

**Замечания:**

- `--no-owner --no-acl` упрощают restore в другой кластер (e2e) без совпадения ролей.
- По политике организации добавьте сжатие (`gzip`), шифрование (`gpg`), или оба шага после дампа — не храните незашифрованные копии с PII на общих дисках.

---

## 2. Безопасная передача дампа локально

Цель — **шифрование в пути**, **минимальный круг доступа**, **не** загружать дампы в публичные репозитории или незащищённые чаты.

Примеры (выберите один, согласно политике):

```bash
# Пример: копирование с production-сервера на рабочую машину по SSH
scp -i ~/.ssh/<key> ./reli_prod_backup_YYYYMMDD_HHMM.dump <user>@<your-workstation-host>:~/secure-staging/

# Пример: с рабочей машины положить в каталог проекта (который в .gitignore)
mv ~/secure-staging/reli_prod_backup_YYYYMMDD_HHMM.dump /path/to/reli.one/backups/
```

Проверьте перед копированием:

- файл **не** попадёт под `git add` (см. [раздел 7](#7-gitignore));
- каталог назначения — только локальный диск / зашифрованный раздел команды.

---

## 3. Восстановление в e2e PostgreSQL

**Предварительное условие:** дамп лежит в **`./backups/`** от корня репозитория (виден внутри контейнера как `/backups/<имя_файла>`).

Убедитесь, что e2e-стек знает параметры подключения: `envs/database.e2e.env` (не коммитить секреты).

### 3.1 Остановка backend (рекомендуется при restore)

Чтобы Django не держал соединения к БД:

```bash
cd /path/to/reli.one
docker compose -f docker-compose.e2e.yml stop backend_e2e
```

### 3.2 Восстановление из custom (`.dump`) через `pg_restore`

Имя целевой БД ниже — **`$E2E_DB`**; должно совпадать с `DB_NAME` в `database.e2e.env` (часто `postgres`).

```bash
cd /path/to/reli.one

# Переменные для читаемости (подставьте имя файла дампа):
DUMP_FILE="/backups/reli_prod_backup_YYYYMMDD_HHMM.dump"
E2E_DB="postgres"   # как в DB_NAME вашего database.e2e.env

docker compose -f docker-compose.e2e.yml exec postgres_e2e \
  pg_restore \
    --username=postgres \
    --dbname="${E2E_DB}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    --verbose \
    "${DUMP_FILE}"
```

Если кластер **только что создан** после `rm -rf ./.reli_e2e_db/postgres` и первого `up`, а `pg_restore` с `--clean` ругается на отсутствие объектов — повторите без `--clean`, либо восстановите в пустую базу до запуска Django-`migrate`, если дамп уже содержит полную схему (избегайте двойного применения миграций).

### 3.3 Восстановление из plain SQL через `psql`

```bash
cd /path/to/reli.one
SQL_FILE="/backups/reli_prod_backup_YYYYMMDD_HHMM.sql"
E2E_DB="postgres"

docker compose -f docker-compose.e2e.yml exec -T postgres_e2e \
  psql --username=postgres --dbname="${E2E_DB}" -v ON_ERROR_STOP=1 \
  -f "${SQL_FILE}"
```

Для больших файлов можно с хоста:

```bash
docker compose -f docker-compose.e2e.yml exec -T postgres_e2e \
  psql --username=postgres --dbname="postgres" -v ON_ERROR_STOP=1 \
  < ./backups/reli_prod_backup_YYYYMMDD_HHMM.sql
```

### 3.4 Запуск backend снова

```bash
docker compose -f docker-compose.e2e.yml start backend_e2e
# или полный up, если контейнеры не подняты
```

---

## 4. Полный сброс локальной e2e-БД

Удаляет **все** данные кластера e2e на диске; после следующего запуска PostgreSQL инициализируется заново.

```bash
cd /path/to/reli.one
docker compose -f docker-compose.e2e.yml down
rm -rf ./.reli_e2e_db/postgres
docker compose -f docker-compose.e2e.yml up -d --build
```

При необходимости очистите также **`./media_e2e`** (медиа с копией прод-данных) и **`./static_e2e`**.

---

## 5. Проверка после restore

### 5.1 Подключение `psql` с хоста

Используйте значения из **`envs/database.e2e.env`** (порт **5434**):

```bash
psql "host=127.0.0.1 port=5434 user=postgres dbname=postgres password=<из_database.e2e.env>"
```

### 5.2 Пример запросов (Django / типичные таблицы)

Имена таблиц могут отличаться от версии миграций; ниже ориентиры:

```sql
SELECT COUNT(*) FROM accounts_customuser;
SELECT COUNT(*) FROM order_order;
SELECT COUNT(*) FROM payment_payment;
SELECT COUNT(*) FROM product_productvariant;
```

Сверка «ожидаемый порядок величин» — по внутренним ожиданиям команды после копирования prod (не публикуйте фактические count наружу).

### 5.3 Django Admin

1. Запущен **`backend_e2e`**: http://localhost:8000/admin/
2. При **новом** пустом суперпользователе после restore: возможно понадобится `createsuperuser`, либо учётная запись уже в импортированных данных — не используйте prod-пароли на машинах без политики; лучше сменить пароль админ-пользователя **локально**.

---

## 6. Не перепутать production и e2e

Чеклист перед **любым** destructive или restore-командом:

| Проверка | Production | E2e local |
|----------|------------|-----------|
| Файл env | `envs/database.env` (не в git) | `envs/database.e2e.env` |
| `DB_HOST` (с хоста вашей машины) | домен/IP сервера / `postgres_db` в Docker prod | **`127.0.0.1`** и порт **`5434`** |
| `DB_HOST` (из контейнера backend) | по prod compose | **`postgres_e2e`** |
| Compose | `docker-compose.yml` | **`docker-compose.e2e.yml`** |
| Порт PostgreSQL на хосте | как на сервере (часто не 5434) | **5434** |

**Золотое правило:** команды `pg_restore` / `psql` с `PGHOST=<production-host>` при одновременно открытом каталоге **`reli.one` с e2e** — частый источник инцидентов. Перед выполнением выполните:

```bash
# На своей машине — ручная проверка переменных (подставьте значения из envs/database.e2e.env):
echo "${DB_HOST:-unset}" "${DB_NAME:-unset}" "${DB_PORT:-unset}"
# Шаблон без секретов:
grep -E '^DB_' envs/database.e2e.env.example
```

**Никогда** не указывайте production `PGHOST`/`PGPORT`, когда целевая директория — `./backups` e2e и контейнер `postgres_e2e`.

---

## 7. `.gitignore`

В репозитории уже или должно быть исключено (не коммитить):

| Путь / шаблон | Зачем |
|---------------|--------|
| `envs/*` кроме `!envs/*.example` | Реальные env с паролями и ключами |
| `backups/` | Локальные дампы PostgreSQL |
| `.reli_e2e_db/` | Данные кластера e2e |
| `media_e2e/` | Медиа e2e (возможен PII) |
| `static_e2e/` | Собранная статика e2e |
| `*.dump`, `*.pgdump` | Дампы по расширению |

При добавлении новых каталогов с копией prod-данных — расширяйте `.gitignore` и этот документ.

---

## 8. Safety: PII, GDPR, секреты, удаление копий

### 8.1 Персональные и чувствительные данные

- Дамп production содержит **PII** (пользователи, адреса, заказы). Использование на локальной машине должно соответствовать **политике компании и GDPR** (правовые основания, минимизация, срок хранения, доступ).
- Не отправляйте дампы почтой, в Slack, в тикеты без контроля доступа.

### 8.2 Секреты внутри БД

- В таблицах могут сохраняться токены, хеши, идентификаторы платежей. Считайте дамп **конфиденциальным** независимо от наличия `SECRET_KEY` в файле.

### 8.3 Доступ к файлам дампа

- Права ОС: `chmod 600` на файлы дампа у пользователя-разработчика; необщие каталоги.
- Облако только с шифрованием и ограничением ACL.

### 8.4 После отладки

- Удалите дампы и лишние копии: `rm ./backups/reli_prod_backup_*` и безопасно затрите резервные копии по политике.
- При необходимости снесите том e2e: [раздел 4](#4-полный-сброс-локальной-e2e-бд).

### 8.5 Краткий чеклист перед началом работы

- [ ] Подтверждено юридически/продуктово право держать копию prod на этой машине.
- [ ] Выбран каталог **`./backups/`** внутри репозитория; каталог **`backups/`** в `.gitignore`.
- [ ] Проверены **`DB_*`** для цели restore — только **e2e** (`localhost:5434`, `postgres_e2e` внутри Compose).
- [ ] После завершения задачи — **удаление** дампов и при необходимости `docker compose … down` + `rm -rf .reli_e2e_db/postgres`.

---

## Связанные документы

- [`docs/testing/e2e-local-contour.md`](../testing/e2e-local-contour.md) — запуск e2e, порты, сброс тома (кратко).
- [`docs/07-deployment.md`](../07-deployment.md) — production compose; backup как часть эксплуатации.
- [`docs/tasks/010-devops-infrastructure/task.md`](../tasks/010-devops-infrastructure/task.md) — трек DevOps / backup documentation.
