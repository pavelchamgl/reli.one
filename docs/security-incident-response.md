# Security incident response — secrets & PII in git history (SEC-1 / Task 006)

Документ описывает **формальный план** реагирования на инцидент утечек в git-истории.  
**Фактическую** очистку истории, `force push` и ротацию production credentials **должны выполнить ops/команда** по этому чеклисту; сам по себе файл **не** заменяет выполнение процедур.

**Связанная задача:** [Task 006 — Security Hardening](./tasks/006-security-hardening/task.md).

---

## 1. Описание инцидента

| Поле | Значение |
|------|----------|
| **Тип** | Секреты и PII попали в **git history** (коммиты остаются доступны при клонировании до rewrite истории). |
| **Классы затронутых данных** | См. таблицу ниже. |
| **Статус на момент документа** | **HEAD** частично очищен (чувствительные файлы убраны из текущего дерева / политикой не коммитить env). **Git history** по-прежнему может содержать старые ревизии секретов. **Credentials** считаются скомпрометированными, пока не ротированы. **Production** требует согласованного обновления после ротации. |

### Затронутые классы данных (инвентаризация по аудиту)

- TLS private key (в т.ч. пути вида `backend/backend/www.solopharma.shop.key` в истории).
- Учётные данные БД (`envs/database.env` и аналоги в истории).
- Stripe (secret keys, webhook secret, данные сессий там, где фигурировали в репозитории / PII-файле).
- PayPal (client secret и связанные секреты).
- Google OAuth (client secret; clientId также не должен утекать в истории).
- SMTP (хост, пользователь, пароль).
- DPD / Packeta / GLS (API keys, пароли, учётные записи интеграций).
- **PII** в `Frontend/Frontend3/src/code/test.js` (имя, email, телефон, адрес, идентификаторы платёжных сессий и т.п.) — файл должен быть удалён из **истории**, даже если уже удалён из HEAD.

---

## 2. Фазы выполнения (ops / команда)

### Phase 0 — Freeze / coordination

1. Предупредить всю команду о предстоящем **history rewrite** и необходимости **fresh clone** после завершения.
2. На окне работ: **остановить merge в main/master** и неконтролируемый push (согласовать «freeze window»).
3. Назначить **ответственного** (DRI) за процедуру: clone mirror → filter-repo → push → коммуникация.
4. Сделать **backup зеркала** репозитория до перезаписи:
   ```bash
   git clone --mirror <REPO_URL> reli-one-backup-pre-filter-YYYYMMDD.git
   ```
5. Зафиксировать время начала окна и ссылку на backup в тикете / внутреннем журнале.

### Phase 1 — Inventory

1. Просмотр истории по известным путям:
   ```bash
   git log --all -- envs/database.env envs/backend.env \
     backend/backend/www.solopharma.shop.key \
     Frontend/Frontend3/src/code/test.js
   ```
2. Поиск по истории дополнительных артефактов (при необходимости):
   ```bash
   git log --all --stat
   git grep -n "BEGIN.*PRIVATE" "$(git rev-list --all)"
   ```
3. При наличии — прогон **secret scanner** (gitleaks, trufflehog, GitHub secret scanning и т.д.) по локальной копии / CI.
4. Утвердить **окончательный список путей** для `git filter-repo` и список секретов из Phase 2.

### Phase 2 — Rotate credentials

Выполнить ротацию **до или сразу после** публикации переписанной истории (согласовать с ops: минимизировать окно, когда старые секреты ещё валидны и уже «засвечены»).

Ротация (минимальный перечень):

- PostgreSQL password  
- Stripe Secret Key (test + production)  
- Stripe Webhook Secret  
- PayPal Client Secret  
- Google OAuth Client Secret  
- SMTP password  
- DPD API credentials  
- Packeta API key  
- GLS credentials  
- TLS certificate / private key — **если** ключ попадал в репозиторий (перевыпуск / установка на серверах)

Фиксацию дат и владельцев — в [таблице чеклиста](#3-credentials-rotation-checklist) ниже.

### Phase 3 — Rewrite git history

**Предупреждение:** `git filter-repo` **необратимо** переписывает коммиты для всех веток, которые включаются в зеркало. После `force push` все участники обязаны сделать **новый clone**. Старые SHA станут невалидными.

Работа из **bare mirror** (рекомендуется):

```bash
git clone --mirror <REPO_URL> reli-one-cleanup.git
cd reli-one-cleanup.git
```

Один вызов с несколькими путями (удалить файлы из всей истории):

```bash
git filter-repo --force --invert-paths \
  --path envs/database.env \
  --path envs/backend.env \
  --path backend/backend/www.solopharma.shop.key \
  --path Frontend/Frontend3/src/code/test.js
```

При необходимости добавить другие подтверждённые пути через дополнительные `--path`.

Публикация (только после согласования и backup):

```bash
git remote add origin <REPO_URL>   # если не сохранён при mirror clone
git push origin --force --all
git push origin --force --tags
```

**Не выполнять** эти шаги без backup, freeze и уведомления команды.

### Phase 4 — Team recovery

1. Все разработчики удаляют старые локальные клоны и выполняют **fresh clone**.
2. **Запретить** использование старых веток/форков без синхронизации с новой историей.
3. **Cherry-pick** коммитов со «старых» SHA — только после явной проверки, что они не тянут утечку; безопаснее переносить изменения патчем.
4. Обновить **CI/CD secrets** (GitHub Actions / GitLab / и т.д.) на новые значения после ротации.
5. Обновить **production / staging env** в согласовании с ops.

### Phase 5 — Validation

1. Убедиться, что чувствительные пути **не** встречаются в текущей истории:
   ```bash
   git log --all -- envs/database.env envs/backend.env \
     backend/backend/www.solopharma.shop.key \
     Frontend/Frontend3/src/code/test.js
   ```
   (ожидается пустой вывод после успешного filter-repo.)
2. Проверить **HEAD**:
   ```bash
   git grep -n "PRIVATE KEY" || true
   git grep -n "sk_live" || true
   ```
   (подставить проектные шаблоны при необходимости.)
3. Повторно запустить **secret scanner**, если доступен.
4. После ротации — проверить **production env** (нет ссылок на старые ключи).
5. **Smoke test:** backend (`manage.py check`, критичные endpoints), frontend сборка / базовый сценарий входа и оплаты в sandbox.

---

## 3. Credentials rotation checklist

| Secret / Credential | Owner | Rotated at | Updated in production | Verified | Notes |
|---------------------|-------|------------|------------------------|----------|-------|
| PostgreSQL password | | TBD | ☐ | ☐ | |
| Stripe Secret Key (test) | | TBD | ☐ | ☐ | |
| Stripe Secret Key (prod) | | TBD | ☐ | ☐ | |
| Stripe Webhook Secret | | TBD | ☐ | ☐ | |
| PayPal Client Secret | | TBD | ☐ | ☐ | |
| Google OAuth Client Secret | | TBD | ☐ | ☐ | |
| SMTP password | | TBD | ☐ | ☐ | |
| DPD API credentials | | TBD | ☐ | ☐ | |
| Packeta API key | | TBD | ☐ | ☐ | |
| GLS credentials | | TBD | ☐ | ☐ | |
| TLS private key (if exposed) | | TBD | ☐ | ☐ | Перевыпуск / установка |

---

## 4. История документа

| Дата | Событие |
|------|---------|
| 2026-05-13 | Создан документ (Task 006 Step 4): план и чеклисты без выполнения rewrite/push. |

---

## 5. Связанные материалы

- [Task 006](./tasks/006-security-hardening/task.md) — Iteration 3, Definition of Done.  
- [Architecture debt — SEC-1](./09-architecture-debt.md) (если упоминается).

