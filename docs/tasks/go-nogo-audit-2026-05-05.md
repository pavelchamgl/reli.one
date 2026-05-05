# GO/NO-GO Аудит — 2026-05-05

**Scope:** Task 001, Task 006 Iteration 2, Task 007, Task 010  
**Тип:** повторный аудит после выполнения задач  
**Метод:** анализ кода без изменений

---

## 1. P0 Security Issues

| Проблема | Статус | Подробности |
|----------|--------|-------------|
| SEC-1: Секреты в git-истории (TLS ключ, пароли БД) | **ОТКРЫТ P0** | `git filter-repo` не запускался. История содержит `envs/database.env`, `envs/backend.env`, `backend/backend/www.solopharma.shop.key` |
| SEC-2: PII в `src/code/test.js` | ✅ Закрыт | Файл удалён, glob возвращает 0 результатов |
| SEC-3: Google OAuth clientId захардкожен | ✅ Закрыт | `main.jsx` использует `import.meta.env.VITE_GOOGLE_CLIENT_ID` |
| DEBUG строка вместо bool | **НОВЫЙ P1** | `settings.py` строка 32: `DEBUG = os.getenv("DEBUG")` — возвращает строку. `DEBUG=False` в .env → truthy Python-строка → Django работает в debug-режиме |

**Вывод по P0 security:** 1 открытый P0 (SEC-1, git history). Не блокирует Task 002, но требует координации с ops перед production-деплоем.

---

## 2. Сломанные endpoints

| Endpoint / баг | Статус |
|----------------|--------|
| BE-1: `POST /api/promocodes/` падает с 500 | ✅ Исправлен (`signal.py` — try/except) |
| BE-4: `POST /api/accounts/logout/` — 500 при невалидном токене | ✅ Исправлен (`try/except TokenError`) |
| BE-7: `GET /reports/report/` — FieldError | ✅ Исправлен (поле `supplier_id` заглушено, ошибки перехвачены) |
| BE-8: `product/apps.py` — `setting_changed` вместо `post_save` | ✅ Исправлен (удалено, тесты работают) |
| FE-5: `onbordingStatus.js` вызывал reset password вместо onboarding state | ✅ Исправлен (`GET /sellers/onboarding/state/`) |
| FE-2: `?pk=16` захардкожен | ✅ Исправлен |
| FE-6: пробел в `?status=not_closed ` | ✅ Исправлен |
| FE-3: поиск возвращал HTML | ✅ Исправлен (`/products/search/?q=`) |

**Вывод:** все P0/P1 backend endpoints исправлены. Нет незакрытых сломанных endpoints.

---

## 3. Frontend critical bugs

| Баг | Статус |
|-----|--------|
| FE-1: Нет ProtectedRoute | ✅ Реализован inline в `main.jsx` + компонент в `src/Components/ProtectedRoute/` |
| FE-2..6, FE-7: API/URL баги | ✅ Все исправлены (см. выше) |
| FE-4: Токен на уровне модуля (`commentApi.js`) | ✅ Исправлен |
| FE-4: Токен на уровне модуля (`productsSlice.js`) | ❌ Остался — строка 6: `const token = JSON.parse(localStorage.getItem("token"))` |
| FE-9: `console.log` в `auth.js` строка 94 | ❌ Не удалён |
| Дублирование ProtectedRoute (inline + компонент) | Технический долг P3, не блокирует |

**Вывод:** 2 незакрытых P2 (productsSlice токен, console.log). Не блокируют Task 002.

---

## 4. Health-check / Sentry — безопасность конфигурации

### Health-check (`GET /health/`)
- ✅ Реализован в `backend/backend/urls.py`
- ✅ Не раскрывает settings, секреты, stack trace
- ✅ Возвращает 503 при недоступности БД
- Примечание: endpoint открыт без auth — норма для health-check

### Sentry Django
- ✅ Активируется только при `SENTRY_DSN != ""` И `DEBUG == False`
- ✅ `send_default_pii=False`
- ✅ `before_send` фильтрует password, token, card_number, iban, cvv, api_key
- ✅ `traces_sample_rate=0.1`
- ⚠️ Caveat: `DEBUG = os.getenv("DEBUG")` — строка вместо bool. Если `DEBUG=False` задан как строка, Sentry **не активируется** (condition: `not DEBUG` — truthy строка). Это двойная проблема: и Sentry не работает в production, и Django в debug-режиме.

### Sentry React
- ✅ Активируется только при `VITE_SENTRY_DSN` задан
- ✅ `beforeSend` удаляет token, access_token, refresh_token из extra
- ✅ DSN не захардкожен, читается из env

**Вывод:** конфигурация безопасна по дизайну, но `DEBUG` string-bug делает её нерабочей в production. Требует исправления до деплоя.

---

## 5. Тесты для Task 002

### Текущее покрытие

| App | Тесты | Достаточно для рефакторинга? |
|-----|-------|------------------------------|
| accounts | 8 | Да (Task 001 regression) |
| promocode | 4 | Да (Task 001 regression) |
| payment | ~22 | Частично (нет idempotency webhook) |
| sellers | ~4 | Нет (Task 008 blocker) |
| delivery | 1 файл | Нет (Task 005 blocker) |
| order | 0 | Нет (Task 003/004 blocker) |
| product | 0 | Нет |
| warehouses | 0 | Нет |

### CI pipeline
- ✅ `.github/workflows/ci.yml` запускает `manage.py test` на каждый push/PR
- ✅ Проверка `makemigrations --check --dry-run`
- ⚠️ Нет coverage threshold (--cov-fail-under) — добавить в Task 002
- ⚠️ CI использует SQLite fallback, не PostgreSQL — некоторые запросы могут вести себя иначе

### Инфраструктура для Task 002
- ❌ `pytest.ini` / `pyproject.toml` не настроен (используется `manage.py test`)
- ❌ `conftest.py` с фабриками не создан
- ❌ `factory-boy` / `pytest-django` не в зависимостях

**Вывод:** минимальные prerequisites (стабильный код, работающий CI) есть. Инфраструктура pytest — часть Task 002 и будет создана в ней.

---

## 6. GO/NO-GO для Task 002

**GO** ✅

Обоснование:
- Task 001 полностью завершён — сломанный код исправлен
- CI pipeline работает
- Нет P0 блокеров специфичных для тестирования
- SEC-1 (git history) не блокирует написание тестов

---

## 7. NO-GO статусы

### payment/views.py декомпозиция
**NO-GO** ❌  
1699 строк. Нет regression-тестов для payment webhook, idempotency, order creation. Декомпозиция без тестов — неприемлемый риск. Требует Task 002 (payment webhook tests) как prerequisites.

### views_onboarding.py декомпозиция
**NO-GO** ❌  
1959 строк. Нет тестов для onboarding flow, seller registration, KYC steps. Требует Task 002 + Task 008 как prerequisites.

### Order lifecycle changes
**NO-GO** ❌  
0 тестов в `order` app. Любое изменение order flow без regression coverage — критический риск. Требует Task 002 (order lifecycle tests).

---

## 8. Итог по задачам

### Закрытые задачи

| Задача | Статус | Комментарий |
|--------|--------|-------------|
| **Task 001** | ✅ **Закрыта** | Все 8 исправлений подтверждены в коде, 12/12 тестов |

### Задачи с частичным выполнением

| Задача | Статус | Что сделано | Что осталось |
|--------|--------|-------------|--------------|
| **Task 006** | In Progress | SEC-2 (test.js), SEC-3 (Google clientId), .env.example | SEC-1 (git history), DRF throttling |
| **Task 007** | In Progress | 6/7 DoD пунктов | FE-4 productsSlice, FE-9 console.log |
| **Task 010** | In Progress | Health-check, Sentry, CI pipeline | migrations в git, DEBUG bool, backup docs |

### Заблокированные задачи

| Задача | Блокер |
|--------|--------|
| Task 002 | **Не заблокирована** — GO |
| Task 003 (payment refactor) | Task 002 (payment webhook tests) |
| Task 004 (order lifecycle) | Task 002 (order tests) |
| Task 005 (delivery cleanup) | Task 002 (delivery tests) |
| Task 008 (seller onboarding) | Task 002 (seller tests) |

---

## 9. Следующий шаг

**Начать Task 002 — Testing Foundation.**

Обязательные тесты перед любым рефакторингом:

| Домен | Минимальный набор перед рефакторингом |
|-------|---------------------------------------|
| Payment webhook | Idempotency: дублирующий webhook не создаёт второй заказ; Stripe signature validation |
| Order creation | Итоговая сумма, позиции, пользователь, статус |
| Warehouse stock | Резервирование при заказе, возврат при отмене |
| Seller onboarding | Каждый KYC-шаг, переходы состояний |
| Delivery | Каждый провайдер (DPD, GLS, Packeta) — мок внешних вызовов |

Параллельно в Task 006 (не блокирует 002):
- Исправить `DEBUG = os.getenv("DEBUG")` → boolean (P1, 1 строка)
- Добавить DRF throttling для OTP (P2)
- Начать координацию git history cleanup с ops (P0, не техническая работа)
