# Task 006 — Security Hardening

**Priority:** P0/P1  
**Complexity:** Medium  
**Status:** Pending

## Цель

Устранить критические security-риски: секреты в git-истории, PII в исходниках, Google OAuth clientId в коде, добавить базовые защитные меры (rate limiting, env variables для frontend).

## Контекст

Аудит безопасности выявил:
- **SEC-1 (P0):** TLS-ключ, пароли БД, токены были зафиксированы в git-коммитах — история не очищена
- **SEC-2 (P0):** Реальные PII (имя, email, телефон, адрес покупателя + Stripe session_id) в `Frontend/Frontend3/src/code/test.js`
- **SEC-3 (P1):** Google OAuth `clientId` захардкожен в `src/main.jsx`
- **SEC-4 (P1):** Dev endpoints delivery в production → вынесены в Task 005
- **SEC-5 (P2):** JWT в `localStorage` (уязвим к XSS)
- **SEC-6 (P2):** Нет rate limiting на OTP и auth endpoints

## Scope (область)

- Инструкция по очистке git-истории (`git filter-repo`) и ротации credentials
- Удаление `Frontend/Frontend3/src/code/test.js`
- Вынос Google OAuth clientId в `VITE_GOOGLE_CLIENT_ID`
- Добавление DRF throttling для auth/OTP endpoints
- Создание `.env.example` для Frontend3
- Добавление базового CSP заголовка через nginx (краткосрочная защита от XSS)

## Не входит в задачу

- Полный переход JWT → httpOnly cookie (требует крупных изменений auth flow)
- Изменение структуры auth API
- Реализация WAF

## Зависимости

- Нет технических зависимостей — SEC-1 и SEC-2 должны быть выполнены НЕМЕДЛЕННО

## Риски

- `git filter-repo` + force push требует координации со всей командой (все должны сделать fresh clone)
- Ротация credentials (Stripe, DB, Google OAuth) требует согласования с ops
- DRF throttling может ограничить легитимных пользователей при неправильной настройке

## Definition of Done

- [ ] `Frontend/Frontend3/src/code/test.js` удалён
- [ ] Git-история очищена от секретов (или задокументирован план)
- [ ] Google clientId читается из `VITE_GOOGLE_CLIENT_ID`
- [ ] `Frontend/Frontend3/.env.example` создан
- [ ] DRF throttling настроен для OTP endpoint
- [ ] Все ротированные credentials обновлены в production

---

# Iterations

## Iteration 1 — Analysis

### Цель
Полная инвентаризация секретов и PII в репозитории.

### Действия
- Найти все захардкоженные значения похожие на credentials через git history
- Найти все `localStorage`, `STRIPE_`, `GOOGLE_CLIENT`, `PAYPAL_`, `DPD_` в исходниках
- Найти все `console.log` в Frontend3 (возможная утечка токенов)
- Прочитать `Frontend/Frontend3/src/code/test.js`
- Проверить `envs/backend.env.example` — все ли переменные задокументированы

### Output
- Полный список файлов с секретами/PII
- Список credentials для ротации
- Список переменных для `VITE_*.env`

### Статус
- [ ] Inventory complete

---

## Iteration 2 — Immediate Fixes (без git-истории)

### Цель
Устранить секреты из HEAD и добавить защитные меры.

### Что менять

**Немедленно: удалить PII файл:**
```bash
# В рамках git workflow — вынести в отдельный PR
git rm Frontend/Frontend3/src/code/test.js
```

**Frontend Google OAuth:**
```jsx
// ДО: main.jsx
<GoogleOAuthProvider clientId="123456789-abc.apps.googleusercontent.com">

// ПОСЛЕ:
<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
```

**`Frontend/Frontend3/.env.example`** (новый файл):
```env
VITE_API_URL=https://reli.one/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**`Frontend/Frontend3/.gitignore`** (проверить/добавить):
```
.env
.env.local
.env.production
```

**DRF throttling (`backend/backend/settings.py`):**
```python
REST_FRAMEWORK = {
    # Добавить к существующим настройкам:
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "otp": "5/minute",
    },
}
```

**Для OTP endpoints (`accounts/views.py`):**
```python
from rest_framework.throttling import AnonRateThrottle

class OTPRateThrottle(AnonRateThrottle):
    scope = "otp"

class OTPResendView(APIView):
    throttle_classes = [OTPRateThrottle]
    ...
```

### Затрагиваемые файлы
| Файл | Изменение |
|------|-----------|
| `Frontend/Frontend3/src/code/test.js` | Удалить |
| `Frontend/Frontend3/src/main.jsx` | env variable |
| `Frontend/Frontend3/.env.example` | Новый |
| `backend/backend/settings.py` | DRF throttling |
| `backend/accounts/views.py` | OTPRateThrottle |
| `envs/backend.env.example` | Проверить полноту |

### Статус
- [ ] test.js deleted
- [ ] Google clientId in env
- [ ] .env.example created
- [ ] DRF throttling configured

---

## Iteration 3 — Git History Cleanup Plan

### Цель
Задокументировать процесс очистки git-истории и ротации credentials.

**ВАЖНО:** Это требует координации с командой и согласования с DevOps/ops.

### Процедура

```bash
# 1. Установить git-filter-repo
pip install git-filter-repo

# 2. Очистить файлы из истории
git filter-repo --path envs/database.env --invert-paths
git filter-repo --path envs/backend.env --invert-paths
git filter-repo --path backend/backend/www.solopharma.shop.key --invert-paths
git filter-repo --path Frontend/Frontend3/src/code/test.js --invert-paths

# 3. Force push (требует координации!)
git push origin --force --all
git push origin --force --tags

# 4. Все разработчики должны:
git clone <repo> (fresh clone, НЕ git pull)
```

### Credentials для ротации после очистки
- [ ] PostgreSQL password
- [ ] Stripe Secret Key (test + production)
- [ ] Stripe Webhook Secret
- [ ] PayPal Client Secret
- [ ] Google OAuth Client Secret
- [ ] SMTP пароль
- [ ] DPD API credentials
- [ ] Packeta API key
- [ ] GLS credentials

### Создать `docs/security-incident-response.md`
- Фиксация инцидента
- Принятые меры
- Дата ротации credentials

### Статус
- [ ] Plan documented
- [ ] Team notified
- [ ] History cleaned (координация с ops)
- [ ] All credentials rotated

---

## Iteration 4 — Validation

### Тесты для запуска
```bash
pytest backend/accounts/ -k "otp" -v
# Проверить что throttle работает
```

### Сценарии для проверки
- [ ] 6 запросов к `/api/accounts/email/otp/resend/` за минуту → 429 на 6-м
- [ ] `src/code/test.js` → 404 (удалён)
- [ ] `VITE_GOOGLE_CLIENT_ID` не undefined в production build
- [ ] git log не содержит секретов (после cleanup)

### Что должно работать
- Все auth flows работают с throttling
- Google login работает с env-based clientId

### Статус
- [ ] Validation complete

---

## Привязка к коду

| Тип | Файлы |
|-----|-------|
| **Frontend** | `src/main.jsx`, `src/code/test.js` (удалить), `.env.example` |
| **Backend** | `backend/settings.py`, `accounts/views.py` |
| **Env** | `envs/backend.env.example` |
| **Инфраструктура** | git history, nginx CSP headers |
| **Интеграции** | Google OAuth, Stripe, PayPal, DPD, Packeta |

## Связанные проблемы из docs/09-architecture-debt.md

- SEC-1: Секреты в git-истории P0
- SEC-2: PII в test.js P0
- SEC-3: Google OAuth clientId захардкожен P1
- SEC-4: Dev-эндпоинты в prod P1 → Task 005
- SEC-5: JWT в localStorage P2
- SEC-6: Нет rate limiting P2
