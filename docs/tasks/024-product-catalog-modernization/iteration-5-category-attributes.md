# Iteration 5 — Category Attribute Schema и Typed Product Attributes

**Статус:** в работе  
**Scope:** product catalog modernization, backend foundation для category-driven характеристик  
**Язык:** документы на русском, technical terms оставлены на English

---

## Scope Iteration 5

Iteration 5 добавляет backend foundation для характеристик товара, завязанных на категорию:

- schema характеристик по категории;
- typed значения характеристик на уровне `BaseProduct`;
- inheritance schema по MPTT category tree;
- validation для required/filterable attributes при явной записи typed values;
- category schema endpoint для seller form/import templates.

Typed attributes в этой итерации только product-level. `ProductParameter` остается legacy fallback до отдельной миграции поиска и filters/facets.

---

## Что именно меняется

- Добавляются модели:
  - `CategoryAttributeDefinition`;
  - `CategoryAttributeOption`;
  - `ProductAttributeValue`.
- `Category` получает additive flag `allows_product_assignment`, чтобы явно описывать допустимость non-leaf category для seller create/import без изменения текущего legacy create flow.
- Добавляется service/helper для effective schema:
  - ancestors -> current category;
  - override по stable `code`;
  - `category=NULL` возвращает пустую schema;
  - deleted category через `SET_NULL` обрабатывается как `category=NULL`.
- Добавляется seller-facing endpoint:
  - `GET /api/sellers/categories/{category_id}/attribute-schema/`.
- Добавляется nested seller endpoint для typed product attributes:
  - `GET /api/sellers/products/{product_id}/attributes/`;
  - `PUT /api/sellers/products/{product_id}/attributes/`.
- Добавляются focused backend tests для inheritance, validation, endpoint и legacy compatibility.

---

## Что запрещено менять

- Не менять frontend.
- Не делать public filters/facets/search upgrade.
- Не делать admin/moderation upgrade.
- Не делать import/enrichment foundation.
- Не делать cleanup legacy моделей.
- Не удалять и не отключать `ProductParameter`.
- Не менять checkout/payment/delivery/order/reservation logic.
- Не менять `ProductVariant.sku` generation.
- Не добавлять variant-level attributes.
- Не делать старые товары invalid без explicit revalidation step.
- Не менять public API behavior без необходимости.

---

## Acceptance criteria

- Effective schema leaf category содержит inherited attributes от ancestors.
- Child override по `code` детерминированно заменяет parent definition.
- `category=NULL` и deleted category не вызывают validation crash.
- Non-leaf category behavior явно отражен через `category_allows_products`.
- Required validation применяется только при явной записи typed attributes.
- Type validation работает для `text`, `number`, `boolean`, `enum`.
- Enum value обязан принадлежать definition.
- Нельзя записать attribute, не входящий в effective schema `product.category`.
- Unique constraint запрещает больше одного `ProductAttributeValue` на `product + attribute_definition`.
- Legacy `ProductParameter` и search fallback остаются рабочими.
- Public list/detail не требуют typed attributes для старых approved products.

---

## Verification commands

```bash
python3 backend/manage.py makemigrations --check --dry-run
python3 backend/manage.py migrate --plan
python3 backend/manage.py test product -v 1
python3 backend/manage.py test sellers -v 1
git diff --check
```

---

## Rollback / reversibility notes

- Schema migration additive: rollback удаляет новые tables, constraints, indexes и nullable/additive category flag.
- Data migration отсутствует: legacy `ProductParameter` не переносится и не очищается.
- Старые товары не revalidate автоматически, поэтому rollback не требует восстановления product state.
- Если typed values были созданы после deploy и нужен rollback schema, перед rollback нужно экспортировать `ProductAttributeValue`, `CategoryAttributeDefinition`, `CategoryAttributeOption` как business data backup.
- Destructive cleanup legacy parameters запрещен до отдельной Iteration 10.
