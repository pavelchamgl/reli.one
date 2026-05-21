# Test Coverage Snapshot

> Актуальность: май 2026. Файл описывает фактическое состояние тестов на момент анализа.
> Обновлять при добавлении новых тестов или закрытии пробелов.
>
> Смежные документы: [`08-testing-strategy.md`](08-testing-strategy.md), [`testing/`](testing/).

---

## Backend

### Конфигурация

| Файл | Содержание |
|---|---|
| `backend/pytest.ini` | `DJANGO_SETTINGS_MODULE = backend.settings`; паттерны `tests.py`, `test_*.py`, `tests_*.py`, `*_test.py`; `addopts = --tb=short -q` |
| `backend/conftest.py` | Фикстуры: `customer`, `seller_user`, `manager_user`, `seller_profile`, `warehouse`, `delivery_type`, `order_status`, `courier_service`, `delivery_address`, `base_product`, `product_variant`, `payment_obj`, `order` |

---

### Хорошо покрытые приложения

#### `payment` — наиболее полное покрытие

Файлы: `payment/tests.py`, `payment/test_checkout_flow.py`

| Сценарий | Тип |
|---|---|
| PayPal: получение access token, создание сессии | Unit |
| `set_conv_cache_after_commit` | Unit |
| `create_orders_and_payment`: idempotency, ранний выход, IntegrityError + replay | Unit |
| `build_paypal_checkout_context`, metadata builders | Unit |
| `build_stripe_checkout_context` | Unit |
| `CreatePayPalPaymentView` HTTP | API |
| `StripeWebhookService`, `PayPalWebhookService` | Unit |
| `StripeWebhookView`, `PayPalWebhookView` HTTP — статусы, ошибки | API |
| Stripe session: успех, невалидный GLS PUDO без delivery_mode | API |
| DPD-ветка: вызов DPD-калькулятора, не Packeta | API |
| Webhook idempotency: нет дублирования заказов (Stripe и PayPal) | Интеграция |
| Webhook: товары заказа и суммы | Интеграция |

#### `order` — сильный доменный уровень

Файлы: `order/tests.py`, `order/test_webhook_lifecycle.py`

| Сценарий | Тип |
|---|---|
| `Order.calculate_refund` — 6 сценариев | Unit |
| `OrderProduct.received_at` с таймзонами — 5 сценариев | Unit |
| `next_invoice_identifiers` — базовый + concurrency | Unit |
| `generate_order_number` — формат, уникальность | Unit |
| `OrderEvent` — создание, поля | Unit |
| `OrderStatusName` vs `SellerOrderActionsService` — консистентность | Unit |
| `SellerOrderActionsService`: confirm, shipped, cancel — 9 сценариев | Unit |
| Webhook lifecycle: адреса home delivery, Packeta PUDO, DPD PUDO | Интеграция |
| Webhook idempotency: нет дублирования заказов/инвойсов | Интеграция |

#### `sellers/onboarding` — покрыт полный путь

Файлы: `sellers/tests.py`, `sellers/test_onboarding_api_happy_path.py`, `sellers/test_onboarding_audit.py`, `sellers/test_onboarding_completeness.py`, `sellers/test_onboarding_stabilization.py`

| Сценарий | Тип |
|---|---|
| Happy path self-employed: полная REST-цепочка → `pending_verification` | API |
| Happy path company: полная REST-цепочка → `pending_verification` | API |
| EU-страна (DE) с country-полями | API |
| Негатив: неполная форма → 400 | API |
| Негатив: PUT после submit → 400 | API |
| `compute_completeness`: пустая форма, self-employed, company, документы, return address | Unit |
| `compute_next_step`, `compute_documents_summary_and_missing` | Unit |
| `log_onboarding_event` — прямые вызовы | Unit |
| `submit_application` — audit события | Unit |
| `approve_application`, `reject_application` — audit | Unit |
| `validate_before_submit` — негативные audit-события | Unit |
| `build_seller_onboarding_state_response` | Unit |
| State/review HTTP endpoints | API |
| Company documents replace | API |
| Warehouse и return address HTTP | API |
| `get_expected_company_account_holder`, `validate_before_submit` (account holder) | Unit |
| `submit_application`, `approve_application`, `reject_application` — переходы статусов | Unit |

#### `accounts`

Файл: `accounts/tests.py`

| Сценарий | Тип |
|---|---|
| OTP throttle: 5-й запрос — OK, 6-й → 429 (email и password reset) | API |
| Регистрация покупателя с телефоном — сохранение | API |
| Регистрация без телефона → 400 | API |
| Дублирующий телефон → 400 | API |
| Дублирующий email → 400 | API |
| Logout с валидным токеном → 200 | API |
| Logout с невалидным токеном → 200 (не 500) | API |
| Logout с просроченным токеном → 200 (не 500) | API |
| Logout без токена → 400 | API |

#### `delivery`

Файлы: `delivery/test_async_parcels_errors.py`, `delivery/test_dev_access.py`, `delivery/test_seller_shipping.py`

| Сценарий | Тип |
|---|---|
| `run_parcels_and_seller_email_after_commit`: изоляция ошибок generate/fetch/email — 5 сценариев | Unit |
| `async_parcels_and_seller_email`: соответствие sync-runner | Unit |
| `include_dev_courier_tooling`: DEBUG off/on, явный флаг | Unit |
| Seller shipping options: Packeta split+rate для zasilkovna | API |

#### `product` (catalog API)

Файл: `product/test_catalog_api.py`

| Сценарий | Тип |
|---|---|
| Category list → возвращает продукты | API |
| Product detail → варианты, изображения, параметры | API |
| Search → продукты | API |
| Search → категории без matching products | API |
| Search ordering по min_price | API |
| Search с пустым query → пустые buckets | API |

#### `analytics`

Файл: `analytics/tests.py`

| Сценарий | Тип |
|---|---|
| `get_stats_for_two_warehouses` | Unit |
| `zero_warehouse_order_stats` | Unit |
| Warehouse stats HTTP endpoint | API |

#### `promocode`

Файл: `promocode/tests.py`

| Сценарий | Тип |
|---|---|
| `PromoCode.clean` — 4 сценария | Unit |
| `increment_used_count` | Unit |
| Сигнал + Stripe mock — 2 сценария | Unit |

#### Общие тесты (корень `backend/`)

| Файл | Сценарий |
|---|---|
| `test_health_endpoint.py` | `GET /health/` → 200; недоступная БД → 503 |
| `test_env_parse.py` | `str_to_bool`, `cookie_samesite_from_env`, `int_from_env` |

---

### Пустые `tests.py` (нет тестов)

| Приложение | Статус |
|---|---|
| `product/tests.py` | Пустой шаблон |
| `favorites/tests.py` | Пустой |
| `reviews/tests.py` | Пустой |
| `reports/tests.py` | Пустой |
| `warehouses/tests.py` | Пустой |

---

### Пробелы в покрытых приложениях

| Приложение | Что не покрыто |
|---|---|
| `accounts` | JWT login, email confirmation, OTP verify, reset password, профиль, удаление аккаунта, Google/Facebook OAuth |
| `product` | CRUD продавца/админа, загрузка медиа, варианты и остатки через API, большинство фильтров каталога |
| `delivery` | Views клиентской доставки, реальные провайдерские интеграции (DPD/GLS/Packeta) |
| `promocode` | Применение при оформлении заказа, валидация использованного/истёкшего промокода |
| `payment` | Edge-cases частичного возврата, применение промокода в checkout |
| `favorites` | Добавление, удаление, список |
| `reviews` | Создание, модерация, агрегация рейтинга |
| `reports` | Всё приложение |
| `warehouses` | Прямые тесты складских операций и API |

---

## Frontend3

### Конфигурация Vitest

`Frontend/Frontend3/vite.config.js`:
- `environment: 'jsdom'`
- `setupFiles: ['./src/test/polyfill-localstorage.js', './src/test/setup.js']`
- E2E папка исключена из Vitest

---

### Unit/Component тесты (Vitest + RTL)

#### Redux

| Файл | Что тестируется | Покрытые сценарии |
|---|---|---|
| `src/redux/basketSlice.test.js` | Reducer корзины | `addToBasket`, `deleteFromBasket`, `selectProduct`, `selectAllProducts`, `deselectAllProducts`, `clearBasket`, `paymentEndBasket`, счётчики, поиск, `syncBasket`, доставка, `changeVariants` |

#### API-слой

| Файл | Что тестируется | Покрытые функции |
|---|---|---|
| `src/api/productsApi.test.js` | Products API | `getSearchProducts`, `getProductsBySellerId`, `getProductsByCategory`, `getProductById`, `getProducts` — URL, параметры, ошибки |
| `src/api/orders.test.js` | Orders API | `getDetalOrders`, `getOrdersCurrent`, `getOrders` — endpoints, возврат, ошибки |
| `src/api/seller/onboarding.test.js` | Seller onboarding API | `handleError`, `getOnboardingStatus`, `postSubmitOnboarding`, `postSellerType`, `getReviewOnboarding` — ветки ошибок и успех |
| `src/api/seller/onbordingStatus.test.js` | `getOnboardingStatus` | Запрос к `/sellers/onboarding/state/` |
| `src/api/seller/orders.test.js` | Seller orders API | `getOrders`, `getOrderDetails`, `postOrderConfirm`, `postOrderShipped`, `postCencelOrder`, `postDownloadLabels`, `postExportLabels`, `getLabels`, `getShipmentLabel` |

#### Компоненты

| Файл | Компонент | Покрытые сценарии |
|---|---|---|
| `src/Components/ProtectedRoute/ProtectedRoute.test.jsx` | `ProtectedRoute` | Redirect без токена; children с токеном |
| `src/Components/Basket/BasketCardBlock/BasketCardBlock.test.jsx` | `BasketCardBlock` | Пустая корзина; список товаров; count; select-all; filteredBasket |
| `src/Components/Catalog/CatalogCard/CatalogCard.test.jsx` | `CatalogCard` | Рендер имени и фона; клик → dispatch |
| `src/Components/Seller/auth/sellerTypeContent/SellerTypeContent.test.jsx` | `SellerTypeContent` | Mount + fetch; кнопки; continue; `postSellerType`; ошибки; `pending_verification` |
| `src/pages/MyOrdersPage.test.jsx` | `MyOrdersPage` | Рендер; title; вкладки; переключение Actual/History |
| `src/pages/SearchPage.test.jsx` | `SearchPage` | Пустой результат; карточки; URL query; категория; loading |
| `src/test/renderWithProviders.test.jsx` | `renderWithProviders` | Smoke: Redux + router + i18n |

---

### E2E (Playwright, Chromium)

Конфиг: `playwright.config.js` — `baseURL: http://127.0.0.1:4173`, `webServer: npm run preview`

#### CI jobs (GitHub Actions)

| Job | Specs | Backend | Примечание |
|-----|-------|---------|------------|
| `e2e_frontend3` | все `e2e/*.spec.js` (smoke, checkout, seller-onboarding mock) | Нет | Full-stack specs **auto-skip** |
| `e2e_fullstack` | только `fullstack-*.spec.js` (FS-001/002/003, 7 тестов) | `docker-compose.e2e.yml` | e2e env flags; catalog via `loaddata e2e_categories.json` |

См. [`docs/tasks/018-full-stack-e2e-ci-implementation/task.md`](tasks/018-full-stack-e2e-ci-implementation/task.md).

#### `e2e/smoke.spec.js` — без бэкенда

| Сценарий |
|---|
| Root page загружается |
| App shell монтируется без краша |
| `/seller/login` — redirect для неавторизованного пользователя |
| Search page загружается |
| Unknown route → fallback на home |

#### `e2e/checkout.spec.js` (FE-009, в разработке)

| Сценарий |
|---|
| Пустая корзина → сообщение empty basket |
| Seed корзины через localStorage → корзина отображается |
| Continue → переход на `/payment` |
| Форма email присутствует на `/payment` |
| Нет реальных запросов к Stripe/PayPal |

#### `e2e/seller-onboarding.spec.js` — с mock state

| Сценарий |
|---|
| Login экран загружается |
| Create-account экран |
| Seller-type с mock onboarding state |
| `pending_verification` screen с mock state |

#### `e2e/fullstack-checkout-payment-session.spec.js` — FS-002, full-stack (требует backend)

Тесты автоматически **пропускаются**, если бэкенд недоступен.

Стратегия: `request` fixture → создание seller + product + customer через API; `page.route()` mock для PSP; Redux state seeded в localStorage (pageSection=3); JWT в localStorage.

| # | Сценарий | Тип |
|---|---------|-----|
| FS-002a | API chain: input validation → SKU lookup → CZ origin → Packeta shipping → PSP boundary (500 Stripe expected) | Backend API |
| FS-002b | UI section 3 с seeded Redux state → mocked create-stripe-payment → верификация payload (seller_id + SKU + delivery) | Full-stack UI |

#### `e2e/fullstack-payment-confirmation.spec.js` — FS-003, full-stack (требует backend)

Тесты автоматически **пропускаются**, если бэкенд недоступен или `ENABLE_E2E_ENDPOINTS` не активен.

Стратегия: `STRIPE_WEBHOOK_SKIP_SIGNATURE=true` → webhook без реальной подписи; E2E endpoints (`/api/e2e/payment/*`) для setup данных; `page.route()` proxy + JWT seed для UI части.

Дополнительные backend изменения: `STRIPE_WEBHOOK_SKIP_SIGNATURE` setting, `ENABLE_E2E_ENDPOINTS` setting, `backend/payment/e2e_views.py` с двумя test-only views.

| # | Сценарий | Тип |
|---|---------|-----|
| FS-003a | Webhook lifecycle: StripeMetadata → POST /api/stripe-webhook/ → Order + Payment + Invoice в DB → conversion-payload ready | Backend API |
| FS-003b | UI: после webhook → /my_orders отображает заказ для customer (HistorySmallCard) | Full-stack UI |

---

#### `e2e/fullstack-seller-onboarding.spec.js` — FS-001, full-stack (требует backend)

Тесты автоматически **пропускаются**, если бэкенд недоступен.  
Запуск: `docker compose -f docker-compose.e2e.yml up --build` → `npm run build && npm run test:e2e`.

Стратегия: `request` fixture → прямые API-вызовы к Django; `page.route()` proxy → перенаправление `https://reli.one/api/*` → `http://localhost:8000/api/*`; JWT в localStorage через `addInitScript`.

| # | Сценарий | Тип |
|---|---------|-----|
| FS-001a | Полная API-цепочка self-employed онбординга → `pending_verification` | Backend API |
| FS-001b | Страница `/seller/application-sub` отображает `pending_verification` из реального бэкенда | Full-stack UI |
| FS-001c | Выбор `seller-type` через UI → навигация на `/seller/seller-info` → тип сохранён в БД | Full-stack UI |

---

### Пробелы во Frontend3

| Область | Что не покрыто |
|---|---|
| Checkout | Payment session — **покрыто FS-002 (PSP mocked)**. Webhook lifecycle — **покрыто FS-003** (Order/Invoice в DB + UI). Подробности заказа на `/payment_end` — follow-up (страница показывает только generic success) |
| Страница продукта | Выбор варианта, добавление в корзину |
| Профиль пользователя | Редактирование данных, смена пароля |
| Seller dashboard | Управление товарами, обработка заказов |
| Авторизация | Google OAuth, Facebook OAuth |
| i18n | Переключение языка, корректность переводов |
| Адаптивность | Mobile breakpoints |
| Страницы оплаты | Интеграция Stripe/PayPal в браузере |

---

## Frontend2

| Файл | Тип | Что тестируется |
|---|---|---|
| `src/landing-smoke.test.js` | Smoke | `it('runs vitest')` — только проверка что harness работает |

Реальных тестов компонентов и сценариев нет.

---

## Сводная таблица по приоритетам

| Зона | Покрытие | Приоритет добавления тестов |
|---|---|---|
| payment (backend) | Высокое | — |
| order (backend) | Высокое | — |
| sellers/onboarding (backend) | Высокое | — |
| accounts (backend) | Среднее | P1 — JWT login, OAuth |
| delivery views (backend) | Низкое | P1 |
| product CRUD (backend) | Низкое | P1 |
| favorites/reviews (backend) | Нет | P1 |
| reports/warehouses (backend) | Нет | P2 |
| basketSlice + API (frontend3) | Высокое | — |
| ProtectedRoute + компоненты (frontend3) | Среднее | P1 — добавить компоненты |
| Checkout E2E (frontend3) | Частично (FE-009) | P1 — happy path с бэком |
| Full-stack seller onboarding E2E (frontend3) | FS-001 (3 теста, skip без бэкенда) | — |
| Seller dashboard (frontend3) | Нет | P2 |
| Frontend2 | Нет | P2 |
