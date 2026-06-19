# Iteration 8 — Admin/moderation upgrade (product catalog)

**Статус:** `done (repo-scope)`
**Родительская задача:** [task.md](./task.md), [implementation-task-breakdown.md](./implementation-task-breakdown.md)  
**Зависимости:** Iteration 4 (Brand/Media/Documents), Iteration 5 (Category attributes), Iteration 7 (seller wizard)  
**Язык:** документы на русском, technical terms на English  
**Рекомендуемый агент:** Codex 5.3 Medium / Composer 2.5 Fast

---

## Цель

Сделать Django admin удобным для **просмотра, модерации и редактирования** товаров, созданных через seller wizard (`/seller/seller-create`), по образцу moderation UX в `backend/sellers/admin.py` (`SellerOnboardingApplicationAdmin`).

---

## Контекст

### Seller-flow (что модератор должен видеть)

Страница `/seller/seller-create` (`Frontend/Frontend3`) собирает:

| Секция | Модели / API |
|--------|----------------|
| Категория | `Category` |
| Название, описание | `BaseProduct` |
| Фото | legacy `BaseProductImage` → `POST .../images/bulk_upload/` |
| Typed attributes | `ProductAttributeValue` → `PUT .../attributes/` |
| Свободные параметры | `ProductParameter` |
| Варианты, НДС | `ProductVariant`, `vat_rate` |
| Лицензия | `LicenseFile` |
| Доп. поля | `additional_details`, `country_of_origin`, `warranty_months`, `barcode`, `article`, `is_age_restricted` |

Товар создаётся со `status=pending`.

### Текущее состояние admin

Файл: `backend/product/admin.py`

**Есть:** базовые `ModelAdmin`, inlines для images/media/documents/parameters/variants/license, отдельные admin для Brand, attributes, media, documents.

**Нет (gap):**

- custom approve/reject workflow (поля `approved_by`, `approved_at`, `rejected_reason` заполняются только вручную);
- `ManagerOrAdminOnlyMixin` (в отличие от `sellers/admin.py`);
- `ProductAttributeValue` inline на карточке `BaseProduct`;
- очередь pending в list view (thumbnail, seller, counts);
- stock visibility (`WarehouseItem`) для модератора;
- `barcode`, `country_of_origin`, `warranty_months` в fieldsets `BaseProduct`;
- moderation panel по образцу onboarding;
- default pending filters на `ProductMedia` / `ProductDocument` / `Brand`.

См. также: [audit-dependency-map.md §10](./audit-dependency-map.md), [ADR-05 public visibility](./iteration-1-adr-05-public-visibility.md).

---

## Scope (MVP — обязательно в этой итерации)

### Фаза 1 — Сервис модерации

- `backend/product/services_moderation.py`:
  - `approve_product(product, moderator)`
  - `reject_product(product, moderator, reason)` — reason обязателен
- `transaction.atomic()`, валидация перед approve (category, ≥1 variant, business rules без ломания legacy products)
- Тесты: `backend/product/test_moderation.py`

### Фаза 2 — Очередь модерации (list view)

- Переработать `AdminBaseProduct`:
  - `list_display`: id, thumbnail/preview, name, seller, category, status, variants count, дата (id или `created_at` если добавите)
  - `list_filter`: status (default pending), seller, category, `is_age_restricted`
  - `search_fields`: name, article, barcode, seller, variant sku
  - bulk actions: approve, reject (с intermediate page для reason)
- `ManagerOrAdminOnlyMixin` на product admin classes (переиспользовать из `sellers/admin.py` или вынести в shared mixin)
- Queryset: `select_related`, `prefetch_related`, annotations

### Фаза 3 — Карточка товара для review

- Fieldsets по секциям seller wizard (см. план в чате / ниже)
- `ProductAttributeValueInline` на `BaseProduct`
- Moderation panel + custom URLs:
  - `/admin/product/baseproduct/<id>/approve/`
  - `/admin/product/baseproduct/<id>/reject/`
- Запретить прямое редактирование `status` в форме (только через actions)
- Stock column в `ProductVariantInline` (readonly, через `WarehouseItem`)
- Readonly preview cover image (через `product.compat.get_product_cover_image`)

### Фаза 4 — Nested resource queues

- `ProductMediaAdmin`, `ProductDocumentAdmin`, `BrandAdmin`:
  - default filter `status=pending`
  - list columns для operational review
  - bulk approve/reject (если уместно в MVP)

---

## Не входит в задачу (явный out of scope)

- Изменения seller frontend (`Frontend/Frontend3`)
- Изменения seller/public API contracts (`ProductCreateSerializer`, `ProductDetailSerializer` fields)
- Миграции моделей без отдельного ADR и явного запроса (`created_at` на `BaseProduct`, `ProductModerationEvent` — **deferred**, описать в Completion notes если не сделано)
- Фаза 6 из плана: переключение `compat.get_product_cover_image` на approved `ProductMedia` и фильтрация nested resources в public serializers — **отдельная follow-up итерация**, только если явно включено в MVP чеклист исполнителем после согласования
- Удаление legacy `BaseProductImage` (Iteration 10)
- Custom admin SPA вне Django admin

---

## Риски

| Риск | Митигация |
|------|-----------|
| Двойной image path (legacy + ProductMedia) | В admin помечать legacy inline; cover preview через `compat` |
| Approve без валидации | Pre-approve checks в service + тесты |
| Путаница `ProductStatus` (product vs order) | Явные импорты `from product.models import ProductStatus` |
| Public API regression | Не менять public serializers в MVP без тестов visibility |

---

## Definition of Done (DoD)

### Документация

- [x] Этот файл обновлён: **Статус** → `in_progress` в начале, → `done (repo-scope)` в конце
- [x] Заполнен раздел **Completion log** (дата, агент, коммиты, что сделано / deferred)
- [x] В [implementation-task-breakdown.md](./implementation-task-breakdown.md) у Iteration 8 статус синхронизирован
- [x] Если менялось поведение admin/moderation — краткая запись в `docs/01-business-domains.md` (раздел product/admin) **или** ссылка на этот файл

### Код

- [x] `services_moderation.py` + unit/integration tests
- [x] `product/admin.py` refactored: queue, fieldsets, inlines, moderation panel
- [x] `ManagerOrAdminOnlyMixin` на product admin
- [x] Approve/reject: custom views + `RejectForm` (по образцу sellers)
- [x] `ProductAttributeValueInline` на карточке товара
- [x] Pending default filters на Media/Document/Brand admin
- [x] `status` на форме товара — readonly; смена только через actions

### Качество

- [x] `pytest backend/product/test_moderation.py -v` — green
- [x] `pytest backend/product -q` — green (без регрессий)
- [x] `pytest backend/sellers -q` — green
- [x] Нет секретов/PII в коде и логах
- [x] Public API contracts не изменены без тестов (MVP: не менять)

### Ручная проверка (чеклист для Completion log)

- [x] Admin list: фильтр pending показывает seller-created товары
- [x] Карточка: видны attributes, variants, images, license, barcode/article
- [x] Approve: заполняются `approved_by`, `approved_at`, очищается `rejected_reason`
- [x] Reject: обязателен reason; seller API отдаёт `rejected_reason` (существующий контракт)
- [x] Manager/Admin доступ; обычный staff без роли — по текущей политике проекта

---

## Verification commands

```bash
cd backend
python -m pytest product/test_moderation.py -v
python -m pytest product -q
python -m pytest sellers -q
```

---

## Completion log

| Дата | Исполнитель | Коммиты | Результат |
|------|-------------|---------|-----------|
| 2026-06-18 | Cursor Agent | (uncommitted) | MVP admin/moderation upgrade: `services_moderation.py`, `test_moderation.py`, refactor `product/admin.py` (queue, fieldsets, approve/reject URLs, bulk reject, stock inline, cover preview). Verification green via docker-compose.test.yml. |

**Deferred / follow-up:**

- `BaseProduct.created_at` — нет поля в модели; дата в list view через `id` (desc ordering).
- `ProductModerationEvent` — audit history отложена; используются `approved_by` / `approved_at` / `rejected_reason`.
- Переключение `compat.get_product_cover_image` на approved `ProductMedia` — отдельная follow-up итерация (ADR-05 Phase 6).
- Вынести `ManagerOrAdminOnlyMixin` в shared module (сейчас импорт из `sellers.admin`).

---

## Agent prompt (для исполнителя)

Скопируй блок ниже в новый чат Cursor Agent mode.

---

```
Ты — backend-разработчик проекта reli.one. Выполни Iteration 8: Admin/moderation upgrade для product catalog.

## Обязательно прочитай перед кодом

1. docs/tasks/024-product-catalog-modernization/iteration-8-admin-moderation-upgrade.md (этот файл — source of truth)
2. backend/product/admin.py — текущее состояние
3. backend/sellers/admin.py — эталон moderation UX (ManagerOrAdminOnlyMixin, moderation_tools, approve/reject URLs, RejectForm, services_onboarding)
4. backend/product/models.py — BaseProduct, ProductStatus, ProductAttributeValue, ProductMedia, ProductDocument, Brand
5. docs/tasks/024-product-catalog-modernization/iteration-1-adr-05-public-visibility.md
6. .cursor/rules/010-backend-django.mdc, 040-security.mdc

## Задача

Реализовать MVP из iteration-8-admin-moderation-upgrade.md:

1. services_moderation.py + test_moderation.py
2. Refactor product/admin.py: очередь pending, fieldsets как seller wizard, ProductAttributeValueInline, moderation panel, approve/reject URLs
3. ManagerOrAdminOnlyMixin на product admin
4. Pending filters на ProductMediaAdmin, ProductDocumentAdmin, BrandAdmin
5. Stock readonly в variants inline (WarehouseItem)

## Жёсткие ограничения

- НЕ менять seller/public API serializers и contracts
- НЕ менять Frontend
- НЕ добавлять migrations без явной необходимости и ADR (created_at, ProductModerationEvent — deferred)
- НЕ менять public serializers/views/compat для cover image в этой итерации
- Бизнес-логику модерации — только в services, admin — thin
- Маленькие reviewable коммиты; коммит только если пользователь попросит

## Workflow

1. Обнови в iteration-8-admin-moderation-upgrade.md: Статус → in_progress
2. Реализуй по фазам 1→4
3. Прогони verification commands из документа
4. Заполни Completion log и DoD чекбоксы в том же файле
5. Синхронизируй статус Iteration 8 в implementation-task-breakdown.md
6. В конце ответа выдай **Review prompt** для другого агента (шаблон ниже)

## Definition of Done

См. раздел DoD в iteration-8-admin-moderation-upgrade.md — все пункты должны быть отмечены или явно deferred с обоснованием.

## Review prompt (сгенерируй в конце своей работы)

После завершения напиши отдельным блоком промпт для review-агента со:
- списком изменённых файлов;
- ссылкой на task doc и DoD;
- командами verification;
- фокусом review: permissions, moderation audit fields, no public API regression, parity с seller wizard fields, тесты.
```

---

## Review prompt (шаблон для review-агента)

Исполнитель должен заполнить и приложить к финальному ответу. Review-агент работает в **readonly / Ask mode** или с skill `code-review`.

```
Проведи code review Iteration 8 — Admin/moderation upgrade (product catalog).

## Контекст

- Task doc: docs/tasks/024-product-catalog-modernization/iteration-8-admin-moderation-upgrade.md
- Эталон UX: backend/sellers/admin.py (SellerOnboardingApplicationAdmin)
- Seller wizard: Frontend/Frontend3/src/Components/Seller/create/sellerCreateForm/SellerCreateForm.jsx

## Изменённые файлы (заполнит исполнитель)

- 

## Что проверить

1. **DoD:** все чекбоксы в task doc закрыты или обоснованно deferred
2. **Moderation service:** approve/reject atomic, audit fields, reject без reason невозможен
3. **Admin permissions:** ManagerOrAdminOnlyMixin, нет утечки модерации неавторизованным
4. **Parity с seller-flow:** модератор видит category attributes, variants, images, license, barcode, article, VAT, age flag
5. **No regression:** public API / serializers / compat не изменены без тестов
6. **Tests:** test_moderation.py покрывает happy path и reject validation
7. **Security:** нет логирования PII, секретов, полных file paths в production logs
8. **Code style:** thin admin, логика в services, соответствие django-patterns проекта

## Команды

```bash
cd backend && python -m pytest product/test_moderation.py product -q && python -m pytest sellers -q
```

## Формат ответа

- Verdict: Approve / Approve with nits / Request changes
- P0 / P1 / P2 findings с file:line
- Пропущенные пункты DoD
- Рекомендации по follow-up (без реализации)
```
