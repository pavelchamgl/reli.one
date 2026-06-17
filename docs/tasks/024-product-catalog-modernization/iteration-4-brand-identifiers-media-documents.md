# Iteration 4 — Brand / identifiers / media / documents foundation

**Статус:** в работе  
**Scope:** product catalog modernization, backend foundation models, additive migrations  
**Язык:** документы на русском, technical terms оставлены на English

---

## Scope Iteration 4

Iteration 4 добавляет нормализованный foundation-слой каталога без переключения публичных API и seller frontend на новые модели.

В scope входят:

- `Brand` как справочник брендов со status и moderation-полями;
- `ProductExternalIdentifier` для внешних идентификаторов товара;
- `ProductMedia` для будущего слоя изображений/видео с `sort_order`, `is_main` и status;
- `ProductDocument` для будущего слоя документов товара;
- optional связь `BaseProduct.brand`, если она не меняет публичный контракт;
- constraints и indexes согласно ADR 07;
- reversible data migration `BaseProductImage -> ProductMedia`;
- focused backend tests для моделей, constraints и deterministic media migration.

---

## Что именно меняется

- В `backend/product/models.py` добавляются только additive-модели и nullable/additive связи.
- `ProductMedia` получает связь с legacy `BaseProductImage`, чтобы reverse migration могла удалить только строки, созданные автоматическим переносом.
- Старые изображения из `BaseProductImage` переносятся в `ProductMedia` детерминированно:
  - изображение с минимальным `id` внутри product получает `is_main=True`;
  - `sort_order` сохраняет порядок по `BaseProductImage.id`.
- Добавляются database constraints:
  - не более одного `ProductMedia.is_main=True` на product;
  - уникальность external identifier по принятому контракту `identifier_type + value` без учета регистра;
  - не более одного primary external identifier на `product + identifier_type`;
  - indexes под `product`, `status`, `sort_order`, `type`.
- Добавляются минимальные admin entries для просмотра foundation-моделей без полноценного moderation UI.

---

## Что запрещено менять

- Не менять frontend.
- Не менять checkout/payment/delivery/order/reservation logic.
- Не менять generation и смысл `ProductVariant.sku`.
- Не удалять и не переименовывать legacy `BaseProductImage`, `LicenseFile`, `barcode`, `article`.
- Не ломать related name `BaseProduct.images`.
- Не переключать public serializers/views/GMC feed полностью на новые модели.
- Не менять seller create/edit payload и текущий `article` contract.
- Не отдавать `pending/rejected` media/documents/brand в public API, если в этой или будущей итерации появятся nested resources.
- Не делать полноценный moderation UI.

---

## Acceptance criteria

- Новые модели существуют и не требуют обязательных данных от старых product payload.
- Старые `BaseProductImage/images`, `barcode`, `article`, `LicenseFile` остаются рабочими.
- `ProductMedia` допускает только один main media на product.
- `ProductExternalIdentifier` не допускает дубли по `identifier_type + value`.
- Media migration переносит старые изображения в стабильном порядке и делает oldest/min(id) image главным.
- Reverse migration безопасно удаляет только `ProductMedia`, созданные из legacy images.
- Existing compatibility helpers продолжают выбирать legacy cover image так же, как до Iteration 4.
- GMC compatibility tests из Iteration 2 проходят.
- `makemigrations --check --dry-run` не предлагает новых migrations после созданных файлов.

---

## Verification commands

```bash
python3 backend/manage.py makemigrations --check --dry-run
python3 backend/manage.py migrate --plan
python3 backend/manage.py test product.test_catalog_compat -v 1
python3 backend/manage.py test sellers.test_product_stock_api product.test_stock_availability_api warehouses.tests_reservation -v 1
git diff --check
```

Дополнительно для focused coverage Iteration 4:

```bash
python3 backend/manage.py test product.test_catalog_foundation -v 1
```

---

## Rollback / reversibility для migrations

- Schema migration additive: rollback удаляет только новые nullable fields, модели, indexes и constraints.
- Data migration требует backup перед production run:
  - сделать snapshot/backup БД до deploy;
  - выполнить dry-run на staging или копии production-like БД;
  - проверить количество `BaseProductImage` и созданных `ProductMedia`.
- `RunPython` reverse должен быть безопасным:
  - удалять только `ProductMedia`, у которых заполнен `legacy_image_id`;
  - не трогать legacy `BaseProductImage`;
  - не трогать новые `ProductMedia`, созданные вручную после migration.
- Destructive cleanup legacy image/document models запрещен в Iteration 4 и может быть только отдельной итерацией после snapshot-compatible периода.
