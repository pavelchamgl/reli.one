# Iteration 6 — Public filters, facets и search upgrade

**Статус:** в работе  
**Scope:** public catalog filtering/facets/search поверх foundation-моделей Iteration 4–5  
**Язык:** документы на русском, technical terms оставлены на English

---

## Scope Iteration 6

Iteration 6 добавляет публичный backend foundation для фильтров и facet metadata в category/product listing:

- фильтры по `Brand`;
- фильтры по price/rating;
- фильтры по stock availability без раскрытия `reserved_quantity`;
- фильтры по typed product attributes из effective category schema;
- facet metadata endpoint для будущего frontend;
- additive typed attribute search при сохранении legacy `ProductParameter` fallback.

Frontend UI, seller create/edit wizard, admin/moderation, import/enrichment и cleanup legacy моделей не входят в scope.

---

## Public endpoints

### Existing endpoint: category product listing

`GET /api/products/categories/{category_id}/`

Добавляются optional query params:

- `brand_id=<id>` — фильтр по approved `Brand.id`;
- `brand=<slug-or-name>` — фильтр по approved `Brand.slug` или case-insensitive `Brand.name`;
- `min_price=<number>` — уже существующий фильтр по final price с acquiring fee;
- `max_price=<number>` — уже существующий фильтр по final price с acquiring fee;
- `rating=<number>` — existing alias для minimum rating;
- `min_rating=<number>` — новый явный alias для minimum rating;
- `in_stock=true|false` — фильтр по `total_available_quantity > 0`;
- `stock_status=in_stock|few_left|out_of_stock` — фильтр, согласованный с public `stock_status`;
- `attr[code]=value` — exact typed attribute filter для `enum`, `boolean`, `text`;
- `attr[code_min]=number` — minimum range для `number`;
- `attr[code_max]=number` — maximum range для `number`.

Правила `attr[...]`:

- attribute должен входить в effective schema категории;
- attribute должен быть `is_filterable=true`, `is_public=true`, `is_active=true`;
- `enum` принимает option `id`, `value` или `label`;
- `boolean` принимает `true/false`, `1/0`, `yes/no`;
- `number` поддерживает exact через `attr[code]` и range через `_min/_max`;
- `text` поддерживает exact case-insensitive match, без full-text facets.

### New endpoint: category facets

`GET /api/products/categories/{category_id}/facets/`

Response предназначен для будущей формы фильтров:

- `category.id/name`;
- `price.min/max`;
- `brands[]` только для approved brands;
- `stock.options[]`;
- `rating.min/max`;
- `attributes[]` только для effective schema definitions с `is_filterable=true`, `is_public=true`, `is_active=true`;
- enum options только active;
- boolean options `true/false`;
- number `min/max`;
- text facets не агрегируются, чтобы не превращать endpoint в heavy aggregation.

---

## Search upgrade

`GET /api/products/search/?q=...`

Search behavior остается additive:

- текущий поиск по `name`, `product_description`, `category.name` сохраняется;
- legacy `ProductParameter.name/value` fallback сохраняется;
- typed `text` values и typed `enum` option `value/label` участвуют в search только для public active definitions.

---

## Что запрещено менять

- Не менять frontend UI.
- Не менять seller create/edit wizard.
- Не делать admin/moderation upgrade.
- Не делать import/enrichment foundation.
- Не делать cleanup legacy моделей.
- Не удалять и не отключать `ProductParameter`.
- Не менять checkout/payment/delivery/order/reservation logic.
- Не менять `ProductVariant.sku` generation.
- Не менять seller stock endpoint.
- Не раскрывать `reserved_quantity` в public API.
- Не отдавать pending/rejected products в public API.
- Не отдавать pending/rejected brand/media/documents как public filter data.

---

## Acceptance criteria

- Facets endpoint доступен по category id.
- Facets возвращают только filterable/public typed attributes из effective category schema.
- Inherited category attributes участвуют в facets.
- Enum facet содержит active options.
- Number facet возвращает `min/max` по public products.
- Brand facet исключает pending/rejected brands.
- Category listing фильтрует по brand, price range, stock, rating, enum/boolean/number attributes.
- Multiple filters combined работают как пересечение.
- Legacy `ProductParameter` search fallback работает.
- Old products without typed attributes остаются в list/search, если typed filters не запрошены.
- Public responses не раскрывают `reserved_quantity`.
- Pending/inactive products исключены для public user.
- Existing public category/list/detail response shape сохраняется.
- Iteration 5.5 regression smoke продолжает проходить.

---

## Performance / query-count checks

- Listing строится поверх существующего `build_public_products_queryset`, где уже есть `final_min_price`, `ordered_quantity`, `total_available_quantity`.
- Для filters используются ORM joins/subqueries без per-product loops.
- Facets endpoint агрегирует только bounded набор:
  - brands по текущему category queryset;
  - price/rating aggregate;
  - enum/boolean/number aggregates по filterable/public definitions effective schema.
- Text facet aggregation намеренно отложена как потенциально heavy.
- В проекте не найден стабильный существующий query-count pattern, поэтому Iteration 6 покрывает correctness tests и фиксирует риск: отдельный query-count budget можно добавить после стабилизации общего performance test harness.

---

## Verification commands

```bash
python3 backend/manage.py makemigrations --check --dry-run
python3 backend/manage.py migrate --plan
python3 backend/manage.py test product -v 1
python3 backend/manage.py test product.test_catalog_regression_smoke -v 1
python3 backend/manage.py test sellers -v 1
git diff --check
```

Локально при env, указывающем на e2e Postgres, можно использовать overrides:

```bash
DB_NAME= DB_USER= DB_PASS= DB_HOST= DB_PORT= MEDIA_ROOT=/tmp/reli-media python3 backend/manage.py test product -v 1
```

---

## Rollback / compatibility notes

- Migrations не планируются: изменения additive на уровне views/helpers/tests/docs.
- Rollback — удалить new facets endpoint route/helper и вернуть category/search queryset к предыдущему виду.
- Existing serializers не меняются, поэтому public response shape остается совместимым.
- Legacy `ProductParameter`, `BaseProductImage/images`, `barcode/article`, seller stock endpoint и checkout/payment/reservation flows не меняются.
- Если позже потребуется index migration под production data volume, ее нужно добавить отдельным scoped changeset с `migrate --plan`, rollback notes и query plan evidence.
