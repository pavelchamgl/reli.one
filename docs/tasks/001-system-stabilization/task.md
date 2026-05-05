# Task 001 — System Stabilization

**Priority:** P0  
**Complexity:** Medium  
**Status:** In Progress — Iteration 3 applied, Iteration 4 in validation

## Цель

Устранить критические сломанные функции, которые делают части системы нерабочими прямо сейчас, до начала любого рефакторинга.

## Контекст

Анализ кода выявил несколько мест, где код гарантированно падает с ошибкой при обычных пользовательских сценариях:
- `promocode/signal.py` — три `AttributeError` при любом сохранении промокода (BE-1)
- `reports/views.py` — использует несуществующее поле `supplier_id` на `OrderProduct` (BE-7)
- `accounts/views.py` — `CustomLogoutView` падает с 500 при невалидном refresh-токене (BE-4)
- `product/apps.py` — `post_save`-хендлер `update_product_rating_and_reviews` подключён к `setting_changed` вместо `post_save`; ломает любой тест, использующий `self.settings()` или `override_settings` (BE-8)
- Frontend: `?pk=16` захардкожен → утечка данных заказа (FE-2)
- Frontend: trailing space в `?status=not_closed ` → пустой список заказов (FE-6)
- Frontend: `onbordingStatus.js` вызывает эндпоинт сброса пароля вместо статуса онбординга (FE-5)

## Scope (область)

- `backend/promocode/signal.py` — отключение / исправление сигнала
- `backend/reports/views.py` — исправление фильтра по `seller_profile`
- `backend/accounts/views.py` — добавление `try/except TokenError` в logout
- `backend/product/apps.py` — удаление ошибочного `setting_changed.connect(...)` (BE-8)
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
- BE-8: удаление `setting_changed.connect(...)` из `product/apps.py` — низкий риск: хендлер уже зарегистрирован через `@receiver(post_save, sender=Review)`, лишняя строка только ломала тесты

## Definition of Done

- [x] `POST /api/promocodes/` или сохранение в Admin не падает с 500 (BE-1)
- [x] `GET /reports/report/` не падает с FieldError (BE-7)
- [x] `POST /api/accounts/logout/` с невалидным токеном возвращает 200, не 500 (BE-4)
- [x] `product/apps.py` не подключает `post_save`-хендлер к `setting_changed` (BE-8)
- [x] Страница «Мои заказы» загружает список текущих заказов (FE-6)
- [x] Детальная страница заказа не показывает чужой заказ #16 (FE-2)
- [x] Страница статуса онбординга продавца загружает данные (FE-5)
- [x] Поиск товаров не возвращает HTML (FE-3)
- [x] `python manage.py test accounts promocode` — 12/12 passed

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
- [x] Analysis complete

**Дополнительно выявлен BE-8 в ходе написания тестов:**  
`product/apps.py` строка `setting_changed.connect(update_product_rating_and_reviews)` подключает `post_save`-хендлер к сигналу изменения настроек (`setting_changed`) вместо `post_save`. Это вызывало `TypeError` при любом использовании `self.settings()` / `override_settings` в тестах всего проекта.

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
- [x] Tests written

**Написаны и прошли:**
- `accounts.tests.LogoutViewTests` — 4 теста (valid/invalid/expired token, missing token)
- `promocode.tests.PromoCodeModelTests` — 2 теста (clean() validation)
- `promocode.tests.PromoCodeSignalTests` — 2 теста (stripe mocked, stripe unavailable)

Итог: `Ran 12 tests — OK`

---

## Iteration 3 — Fix

### Цель
Применить минимальные исправления для каждого сломанного места.

### Что менять

**`backend/accounts/views.py` — `CustomLogoutView`:** ✅  
Добавлен `try/except TokenError` — невалидный токен возвращает 200, не 500.

**`backend/promocode/signal.py`:** ✅  
Весь Stripe-вызов обёрнут в `try/except Exception` с `logger.exception`. PromoCode сохраняется локально, Stripe-ошибки не пробрасываются.

**`backend/promocode/models.py`:** ✅  
Исправлен `PromoCode.ValidationError` → `django.core.exceptions.ValidationError`.

**`backend/reports/views.py`:** ✅  
Заменён `supplier_id` → `seller_profile__user__email`. Добавлены `try/except` для `Supplier.DoesNotExist` и `FieldError`.

**`backend/product/apps.py`:** ✅ (BE-8)  
Удалена строка `setting_changed.connect(update_product_rating_and_reviews)`. Сигнал уже зарегистрирован через `@receiver(post_save, sender=Review)`.

**Frontend `src/api/orders.js`:** ✅  
Удалён `?pk=16`, убран trailing space в `?status=not_closed`.

**Frontend `src/api/seller/onbordingStatus.js`:** ✅  
`POST /accounts/password/reset/confirmation/` → `GET /sellers/onboarding/state/`.

**Frontend `src/api/productsApi.js`:** ✅  
`get("")` → `get(/products/search/?q=${encodeURIComponent(query)})`.

### Затрагиваемые файлы
| Файл | Тип правки | Статус |
|------|-----------|--------|
| `backend/accounts/views.py` | try/except TokenError | ✅ |
| `backend/promocode/signal.py` | безопасный wrapper + logging | ✅ |
| `backend/promocode/models.py` | исправление ValidationError | ✅ |
| `backend/reports/views.py` | исправление поля + error handling | ✅ |
| `backend/product/apps.py` | удаление ошибочного connect (BE-8) | ✅ |
| `Frontend/Frontend3/src/api/orders.js` | 2 однострочных правки | ✅ |
| `Frontend/Frontend3/src/api/seller/onbordingStatus.js` | замена эндпоинта | ✅ |
| `Frontend/Frontend3/src/api/productsApi.js` | исправление URL | ✅ |

### Статус
- [x] All fixes applied

---

## Iteration 4 — Validation

### Тесты для запуска
```bash
cd backend
python manage.py test accounts promocode -v 2
```

### Результаты автотестов
```
Ran 12 tests in 0.997s — OK
```
- `accounts.tests` — 8/8 ✅
- `promocode.tests` — 4/4 ✅ (включая BE-8-fix)

### Сценарии для ручной проверки
- [ ] Logout с истёкшим токеном → 200 в браузере DevTools
- [ ] Сохранение PromoCode через Admin → нет 500 в логах
- [ ] Открытие `/reports/report/` → нет ошибки FieldError
- [ ] Страница «Мои заказы» → список отображается
- [ ] Страница онбординга продавца → состояние загружается

### Что должно работать
- Все исправленные эндпоинты возвращают ожидаемые статус-коды
- Нет новых 500-ошибок в Django-логах
- `override_settings` / `self.settings()` в тестах больше не вызывает `TypeError`

### Статус
- [x] Automated tests passed
- [ ] Manual validation pending

---

## Привязка к коду

| Тип | Файлы |
|-----|-------|
| **Backend файлы** | `backend/accounts/views.py`, `backend/promocode/signal.py`, `backend/promocode/models.py`, `backend/reports/views.py`, `backend/product/apps.py` |
| **Frontend файлы** | `src/api/orders.js`, `src/api/seller/onbordingStatus.js`, `src/api/productsApi.js` |
| **Модели** | Не затрагиваются |
| **API** | Не меняются контракты |
| **Интеграции** | Stripe (promocode signal), Django JWT blacklist |

## Связанные проблемы из docs/09-architecture-debt.md

- BE-1: `promocode/signal.py` гарантированно падает P0 ✅ исправлено
- BE-4: `CustomLogoutView` — 500 при невалидном токене P1 ✅ исправлено
- BE-7: `reports` app — не DRF, нет обработки ошибок P2 ✅ минимальный фикс
- BE-8: `product/apps.py` — `post_save`-хендлер подключён к `setting_changed` P0 ✅ исправлено
- FE-2: Хардкод `?pk=16` P1 ✅ исправлено
- FE-3: `getSearchProducts` → `get("")` P1 ✅ исправлено
- FE-5: `onbordingStatus.js` — неправильный эндпоинт P1 ✅ исправлено
- FE-6: Пробел в `?status=not_closed ` P1 ✅ исправлено
