# Iteration 5.5 — Catalog Regression Smoke

**Статус:** в работе  
**Scope:** regression smoke перед Iteration 6, без новых catalog features  
**Язык:** документы на русском, technical terms оставлены на English

---

## Scope Iteration 5.5

Iteration 5.5 добавляет воспроизводимую проверку текущего состояния catalog/seller/product foundation после Iteration 3–5:

- ручной smoke checklist для seller/public/admin сценариев;
- backend automated regression smoke без frontend;
- короткий frontend/browser smoke поверх существующей Playwright-инфраструктуры `Frontend/Frontend3`.

Итерация не меняет продуктовую функциональность и не добавляет новые API/model contracts.

---

## Что именно проверяем

- Seller может иметь `default_warehouse` и задать stock для `ProductVariant` через существующий stock endpoint.
- Category schema endpoint возвращает effective schema с inherited attributes и child override.
- Typed product attributes endpoint принимает валидные значения и сохраняет typed rows.
- Legacy `BaseProductImage/images` cover helper остается источником cover image для совместимости.
- Foundation-модели `Brand`, `ProductExternalIdentifier`, `ProductMedia`, `ProductDocument` могут сосуществовать с legacy product data без переключения public API.
- Public list/detail сохраняют старый формат и не раскрывают `reserved_quantity`.
- Stock availability отражает `WarehouseItem`, а reservation использует тот же `WarehouseItem`.
- Legacy `ProductParameter` search fallback работает до Iteration 6.
- Frontend app/catalog routes монтируются без crash в существующем Playwright smoke-контуре.

---

## Что запрещено менять

- Не добавлять новые product/catalog features.
- Не менять модели и не создавать migrations.
- Не менять public filters/facets/search.
- Не менять frontend UI.
- Не менять checkout/payment/delivery/order/reservation logic.
- Не менять `ProductVariant.sku` generation.
- Не менять existing API contracts.
- Не исправлять найденные product bugs внутри Iteration 5.5; фиксировать их как follow-up.

---

## Ручной checklist

1. Seller login.
2. Создать или открыть товар продавца.
3. Проверить category schema/характеристики:
   - schema содержит inherited attributes;
   - child override отображается вместо parent definition;
   - required enum/text/number values можно заполнить в backend/API.
4. Проверить media/главное фото:
   - legacy `BaseProductImage` виден в старых seller/public местах;
   - new `ProductMedia` не ломает старый cover behavior.
5. Проверить stock:
   - stock задается через seller endpoint;
   - public stock fields показывают available quantity;
   - `reserved_quantity` не раскрывается public API.
6. Проверить public list/detail:
   - list открывается по category;
   - detail открывается по product id;
   - старые fields `images`, `product_parameters`, `variants` на месте.
7. Проверить корзину/checkout до payment session:
   - товар с stock можно положить в basket;
   - checkout доходит до создания payment session или ожидаемой PSP-boundary ошибки в e2e.
8. Проверить admin:
   - `Brand`;
   - `ProductMedia`;
   - `ProductDocument`;
   - `CategoryAttributeDefinition`;
   - `ProductAttributeValue`.
9. Найденные проблемы записывать как отдельные follow-up задачи с:
   - шагами воспроизведения;
   - ожидаемым/фактическим поведением;
   - affected files/API;
   - proposed iteration для фикса.

---

## Automated smoke scenarios

### Backend

Один focused scenario создает всю цепочку без external dependencies:

- seller user + `SellerProfile.default_warehouse`;
- category tree с parent attribute, child override, enum option и required attribute;
- `Brand`, `ProductExternalIdentifier`, `ProductMedia`, `ProductDocument`;
- `BaseProduct`, `ProductVariant`, legacy `BaseProductImage`, legacy `ProductParameter`;
- stock через `PUT /api/sellers/products/{product_pk}/variants/{pk}/stock/`;
- typed values через `PUT /api/sellers/products/{product_id}/attributes/`;
- checks:
  - schema endpoint возвращает inherited/overridden attributes;
  - typed endpoint сохраняет typed rows;
  - public list/detail не ломают старый формат;
  - public response не раскрывает `reserved_quantity`;
  - cover helper остается legacy-compatible;
  - stock availability отражает `WarehouseItem`;
  - reservation увеличивает `reserved_quantity`;
  - legacy search по `ProductParameter` работает.

### Frontend/browser

Существующая инфраструктура есть:

- `Frontend/Frontend3/package.json`;
- `Frontend/Frontend3/playwright.config.js`;
- `Frontend/Frontend3/e2e/*.spec.js`.

Добавляется короткий browser smoke без backend requirement:

- app root монтируется;
- `/search` открывается без crash;
- `/product/1` и `/product_category/1` монтируют SPA shell без crash;
- protected seller catalog route `/seller/goods-list` редиректит unauthenticated user на `/seller/login`.

Этот smoke не проверяет новые UI features и не требует test users.

---

## Команды запуска

Backend:

```bash
python3 backend/manage.py makemigrations --check --dry-run
python3 backend/manage.py test product.test_catalog_regression_smoke -v 1
python3 backend/manage.py test product -v 1
python3 backend/manage.py test sellers -v 1
python3 backend/manage.py test warehouses payment -v 1
git diff --check
```

Frontend smoke:

```bash
npm --prefix Frontend/Frontend3 run build
npx playwright test Frontend/Frontend3/e2e/catalog-regression-smoke.spec.js
```

Локально при env, указывающем на e2e Postgres, можно использовать overrides:

```bash
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product.test_catalog_regression_smoke -v 1
```

---

## Критерии готовности

- Нет новых migrations.
- Backend smoke проходит стабильно без network/external dependencies.
- Existing `product` и `sellers` suites проходят; `warehouses payment` либо проходит, либо известные локальные failures задокументированы как follow-up и не исправляются в Iteration 5.5.
- Frontend smoke spec собирается и проходит в существующей Playwright-инфраструктуре.
- `git diff --check` чистый.
- Все найденные product issues зафиксированы как follow-up, а не смешаны с Iteration 5.5.

---

## Как фиксировать найденные проблемы

Проблему фиксировать отдельной follow-up записью или task-документом:

- краткое название;
- severity;
- affected area;
- exact reproduction steps;
- expected result;
- actual result;
- logs/screenshots, если есть;
- рекомендуемая итерация для исправления.

В Iteration 5.5 допускается исправлять только сам test harness, если без этого smoke не воспроизводим.

---

## Найденные проблемы при локальном прогоне

### Payment/reservation regression suite

**Команда:**

```bash
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test warehouses payment -v 1
```

**Фактический результат:** suite не проходит: 134 tests, 19 failures, 2 errors, 3 skipped.

Основные группы падений:

- `payment.test_checkout_flow.*` — webhook/order/reservation сценарии не создают ожидаемый `Order`, reservation остается `pending`, stock не уменьшается;
- `payment.tests_reservation_payment_ttl.*` — late webhook сценарий возвращает неожиданный response shape;
- `payment.tests.*` — часть `SimpleTestCase` тестов вызывает DB queries через reservation/payment code path и падает с `DatabaseOperationForbidden`;
- `payment.tests.TestStripeWebhookService.*` — отличается ожидаемый early status для невалидных webhook payload.

В рамках Iteration 5.5 эти проблемы не исправлялись, потому что относятся к payment/reservation behavior и test isolation. Нужен отдельный follow-up по стабилизации payment regression suite перед полноценным release gate.

### Intermittent seller creation toast after successful product save

**Status:** не воспроизводится при ручной QA-перепроверке.

**Наблюдалось один раз:**

- seller preview показал toast: `Error while creating the product. Please check the entered data and try again.`;
- product при этом сохранился в DB;
- product появился в seller goods list;
- edit flow остался доступен.

**Ручная перепроверка:**

- product creation flow был повторен;
- отдельные Postman checks для product, parameters, variants, images и license вернули успешные responses;
- проблема повторно не воспроизвелась.

**Вероятная причина:** один из secondary frontend requests после успешного `POST /api/sellers/products/` мог завершиться ошибкой:

- `POST /api/sellers/products/{id}/parameters/bulk_create/`;
- `POST /api/sellers/products/{id}/variants/bulk_create/`;
- `POST /api/sellers/products/{id}/images/bulk_upload/`;
- `POST /api/sellers/products/{id}/license/`.

**Действие при повторном воспроизведении:**

- зафиксировать failed Network request URL;
- зафиксировать status code;
- зафиксировать request payload;
- зафиксировать response body;
- только после этого открыть bugfix task.

**Severity:** Low до повторного воспроизведения.

**Proposed iteration:** frontend/seller-flow cleanup перед Iteration 7 или во время Iteration 7.
