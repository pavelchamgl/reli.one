# Task 001 — System Stabilization

**Priority:** P0  
**Complexity:** Medium  
**Status:** Pending

## Цель

Устранить критические сломанные функции, которые делают части системы нерабочими прямо сейчас, до начала любого рефакторинга.

## Контекст

Анализ кода выявил несколько мест, где код гарантированно падает с ошибкой при обычных пользовательских сценариях:
- `promocode/signal.py` — три `AttributeError` при любом сохранении промокода (BE-1)
- `reports/views.py` — использует несуществующее поле `supplier_id` на `OrderProduct` (BE-7)
- `accounts/views.py` — `CustomLogoutView` падает с 500 при невалидном refresh-токене (BE-4)
- Frontend: `?pk=16` захардкожен → утечка данных заказа (FE-2)
- Frontend: trailing space в `?status=not_closed ` → пустой список заказов (FE-6)
- Frontend: `onbordingStatus.js` вызывает эндпоинт сброса пароля вместо статуса онбординга (FE-5)

## Scope (область)

- `backend/promocode/signal.py` — отключение / исправление сигнала
- `backend/reports/views.py` — исправление фильтра по `seller_profile`
- `backend/accounts/views.py` — добавление `try/except TokenError` в logout
- `Frontend/Frontend3/src/api/orders.js` — удаление `?pk=16`, исправление пробела
- `Frontend/Frontend3/src/api/seller/onbordingStatus.js` — исправление эндпоинта
- `Frontend/Frontend3/src/api/productsApi.js` — исправление `get("")`

## Не входит в задачу

- Рефакторинг payment flow
- Изменение моделей / миграции
- Реализация Celery
- Полное переписывание `reports` как DRF view
- Изменение API-контрактов

## Зависимости

- Нет (эта задача — предпосылка для всех остальных)

## Риски

- `promocode/signal.py` при отключении может сломать Stripe-синхронизацию промокодов → нужно явно зафиксировать текущее поведение и убедиться, что Stripe купоны не используются активно
- Исправление `reports` требует понимания актуальной схемы `OrderProduct` (поле `seller_profile` vs `supplier_id`)

## Definition of Done

- [ ] `POST /api/promocodes/` или сохранение в Admin не падает с 500
- [ ] `GET /reports/report/` не падает с FieldError
- [ ] `POST /api/accounts/logout/` с невалидным токеном возвращает 205, не 500
- [ ] Страница «Мои заказы» загружает список текущих заказов
- [ ] Детальная страница заказа не показывает чужой заказ #16
- [ ] Страница статуса онбординга продавца загружает данные
- [ ] Поиск товаров не возвращает HTML

---

# Iterations

## Iteration 1 — Analysis

### Цель
Зафиксировать текущее поведение каждого сломанного места, подготовить список правок.

### Действия
- Прочитать `backend/promocode/signal.py` — определить три источника ошибок
- Прочитать `backend/reports/views.py` — найти все обращения к `supplier_id`
- Прочитать `backend/accounts/views.py` — найти `CustomLogoutView`
- Прочитать `Frontend/Frontend3/src/api/orders.js`
- Прочитать `Frontend/Frontend3/src/api/seller/onbordingStatus.js`
- Прочитать `Frontend/Frontend3/src/api/productsApi.js`

### Output
- Карточка каждого бага с точным местом в коде
- Минимальный план правки (1 баг = 1 изменение)

### Риски
- Низкие — только чтение кода

### Статус
- [ ] Analysis complete

---

## Iteration 2 — Tests

### Цель
Написать тесты, фиксирующие ожидаемое (корректное) поведение до правки.

### Тесты для написания

**Backend:**
```python
# backend/accounts/tests.py
class LogoutViewTests(TestCase):
    def test_logout_with_invalid_token_returns_205(self):
        # POST /api/accounts/logout/ с невалидным refresh_token
        # Ожидаем 205, не 500

# backend/promocode/tests.py
class PromocodeSignalTests(TestCase):
    def test_save_promocode_does_not_raise(self):
        # PromoCode.objects.create(...) не должен вызывать AttributeError
```

**Что мокировать:**
- `stripe.Coupon.create` — мокировать через `unittest.mock.patch`
- `settings.STRIPE_SECRET_KEY_TEST` — патчить в тесте

### Сценарии для покрытия
1. Logout с невалидным refresh токеном → 205
2. Создание/сохранение PromoCode → нет исключений
3. GET /reports/report/ с валидными параметрами → 200 или 404, не 500

### Статус
- [ ] Tests written

---

## Iteration 3 — Fix

### Цель
Применить минимальные исправления для каждого сломанного места.

### Что менять

**`backend/accounts/views.py` — `CustomLogoutView`:**
```python
try:
    token = RefreshToken(refresh_token)
    token.blacklist()
except TokenError:
    pass  # токен уже невалиден — логаут всё равно успешен
return Response(status=status.HTTP_205_RESET_CONTENT)
```

**`backend/promocode/signal.py`:**
- Шаг 1: Обернуть весь сигнал в `try/except` с логированием (временная мера)
- Шаг 2 (отдельная задача): вынести Stripe-синхронизацию в сервис

**`backend/reports/views.py`:**
- Заменить `supplier_id` на актуальное поле (скорее всего `seller_profile_id` или `seller_profile__id`)
- Добавить `try/except ObjectDoesNotExist`

**Frontend `src/api/orders.js`:**
```js
// Было: get(`/orders/${id}/?pk=16`)
// Стало:
get(`/orders/${id}/`)

// Было: get("/orders/?status=not_closed ")
// Стало:
get("/orders/?status=not_closed")
```

**Frontend `src/api/seller/onbordingStatus.js`:**
```js
// Заменить POST /accounts/password/reset/confirmation/
// на GET /sellers/onboarding/state/
```

**Frontend `src/api/productsApi.js`:**
```js
// Исправить get("") → get(`/products/search/?q=${query}`)
```

### Ограничения
- Не менять API-контракты
- Не менять модели
- Каждое исправление — отдельный маленький PR

### Затрагиваемые файлы
| Файл | Тип правки |
|------|-----------|
| `backend/accounts/views.py` | try/except |
| `backend/promocode/signal.py` | безопасный wrapper |
| `backend/reports/views.py` | исправление поля + error handling |
| `Frontend/Frontend3/src/api/orders.js` | 2 однострочных правки |
| `Frontend/Frontend3/src/api/seller/onbordingStatus.js` | замена эндпоинта |
| `Frontend/Frontend3/src/api/productsApi.js` | исправление URL |

### Статус
- [ ] All fixes applied

---

## Iteration 4 — Validation

### Тесты для запуска
```bash
cd backend
python manage.py test accounts.tests -v 2
python manage.py test promocode.tests -v 2
```

### Сценарии для ручной проверки
- [ ] Logout с истёкшим токеном → 205 в браузере DevTools
- [ ] Сохранение PromoCode через Admin → нет 500 в логах
- [ ] Открытие `/reports/report/` → нет ошибки FieldError
- [ ] Страница «Мои заказы» → список отображается
- [ ] Страница онбординга продавца → состояние загружается

### Что должно работать
- Все исправленные эндпоинты возвращают ожидаемые статус-коды
- Нет новых 500-ошибок в Django-логах

### Статус
- [ ] Validation complete

---

## Привязка к коду

| Тип | Файлы |
|-----|-------|
| **Backend файлы** | `backend/accounts/views.py`, `backend/promocode/signal.py`, `backend/reports/views.py` |
| **Frontend файлы** | `src/api/orders.js`, `src/api/seller/onbordingStatus.js`, `src/api/productsApi.js` |
| **Модели** | Не затрагиваются |
| **API** | Не меняются контракты |
| **Интеграции** | Stripe (promocode signal), Django JWT blacklist |

## Связанные проблемы из docs/09-architecture-debt.md

- BE-1: `promocode/signal.py` гарантированно падает P0
- BE-4: `CustomLogoutView` — 500 при невалидном токене P1
- BE-7: `reports` app — не DRF, нет обработки ошибок P2
- FE-2: Хардкод `?pk=16` P1
- FE-3: `getSearchProducts` → `get("")` P1
- FE-5: `onbordingStatus.js` — неправильный эндпоинт P1
- FE-6: Пробел в `?status=not_closed ` P1
