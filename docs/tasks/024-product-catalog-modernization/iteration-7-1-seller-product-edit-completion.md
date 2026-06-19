# Iteration 7.1 — Seller Product Edit Completion

**Статус:** frontend follow-up  
**Scope:** точечное завершение edit-flow seller product wizard после Iteration 7  
**Язык:** русский, technical terms оставлены на English

---

## Scope

Iteration 7.1 закрывает недостающую frontend-часть edit-flow без изменений backend contract:

- редактирование category typed attributes на странице edit товара;
- загрузка category schema и текущих typed values при открытии edit страницы;
- client-side validation required typed attributes до save;
- очистка stale typed attributes при смене category;
- понятное отображение package dimensions для delivery в edit variants;
- конвертация package dimensions `kg/cm -> g/mm` при save и `g/mm -> kg/cm` при load;
- мгновенная frontend validation legacy `LicenseFile` при выборе файла.

---

## Что Исправлено

### Category Typed Attributes В Edit-Flow

Edit page загружает:

- `GET /api/sellers/categories/{category_id}/attribute-schema/`;
- `GET /api/sellers/products/{product_id}/attributes/`.

Typed attributes теперь редактируемые. При save выполняется validation по effective category schema:

- required attributes должны быть заполнены;
- `text`, `number`, `boolean`, `enum` валидируются на frontend;
- если schema не загружена, save блокируется до отправки backend requests;
- при успешной validation edit save отправляет `PUT /api/sellers/products/{product_id}/attributes/`.

При смене category frontend очищает старые `attributeSchema`, `attributeValues`, `attributeErrors` и статусы загрузки, чтобы не показывать значения от предыдущей category как актуальные.

### Package Dimensions Для Delivery

Backend fields остаются legacy-named:

- `ProductVariant.weight_grams`;
- `ProductVariant.length_mm`;
- `ProductVariant.width_mm`;
- `ProductVariant.height_mm`.

В UI edit-flow эти поля трактуются как **package dimensions for delivery**, а не physical product dimensions.

Mapping:

- `weight_grams -> package_weight_kg`;
- `length_mm -> package_length_cm`;
- `width_mm -> package_width_cm`;
- `height_mm -> package_height_cm`;
- `package_weight_kg -> weight_grams`;
- `package_length_cm -> length_mm`;
- `package_width_cm -> width_mm`;
- `package_height_cm -> height_mm`.

В edit-flow package dimensions optional для legacy/server variants:

- пустые поля не блокируют unrelated save;
- если поле заполнено, оно должно быть finite number больше `0`;
- пустое поле не отправляется как `null` или empty value в PATCH payload, чтобы не стереть существующие backend dimensions.

Product physical dimensions остаются category typed attributes или будущей отдельной моделью/итерацией.

### License Validation

Legacy `LicenseFile` write endpoint принимает PDF, JPG/JPEG и PNG по MIME:

- `application/pdf`;
- `image/jpeg`;
- `image/png`.

Frontend validation срабатывает сразу после выбора файла:

- JPG, JPEG, PNG, PDF разрешены;
- DOCX, DOC, WEBP и другие форматы блокируются;
- проверяются пустой файл и лимит 13 MB;
- ошибка показывается рядом с license field;
- invalid file не попадает в redux state и не отправляется в `POST /license/`;
- legacy input работает как single-file selection; если браузер или тестовый harness передает несколько файлов, frontend отклоняет весь selection при первом invalid file.

Existing edit delete endpoint используется только в рамках legacy `LicenseFile` flow. Переход на `ProductDocument` не входит в Iteration 7.1.

---

## Что Не Входит

- backend models/migrations;
- checkout/payment/delivery/order/reservation logic;
- seller stock endpoint;
- public filters/facets/search backend;
- `ProductVariant.sku` generation;
- variant-level typed attributes в backend;
- переход seller frontend на `ProductMedia`/`ProductDocument` write API;
- полный redesign create/edit wizard;
- удаление legacy `ProductParameter`, `BaseProductImage`, `LicenseFile`.

---

## Manual QA Checklist

1. Открыть существующий seller product в edit.
2. Проверить, что category schema загружается и typed attributes отображаются с текущими значениями.
3. Изменить typed attribute и сохранить товар; убедиться, что значение обновилось после повторного открытия edit.
4. Очистить required typed attribute и проверить, что save блокируется до backend request.
5. Сменить category и убедиться, что старые typed values исчезли, новая schema загружается заново.
6. Проверить edit variants:
   - labels показывают package dimensions for delivery;
   - UI единицы: length/width/height в cm, weight в kg;
   - сохранение не стирает dimensions, если поля не менялись.
7. В create-flow выбрать invalid license file (`.doc`, `.docx`, `.webp`) и убедиться, что ошибка показана сразу.
8. В edit-flow повторить invalid license file check.
9. В edit-flow удалить существующий legacy license, затем загрузить валидный JPG/PNG/PDF.
10. Проверить, что public catalog/list/detail и checkout flow не изменились.

---

## Verification Commands

```bash
npm --prefix Frontend/Frontend3 run test -- src/redux/sellerProductWizardSlices.test.js
npm --prefix Frontend/Frontend3 run build
cd Frontend/Frontend3 && npx playwright test e2e/catalog-regression-smoke.spec.js
python3 backend/manage.py test product.test_catalog_regression_smoke -v 1
python3 backend/manage.py test product.test_category_attributes -v 1
python3 backend/manage.py test sellers.test_product_stock_api sellers.test_category_attribute_api -v 1
git diff --check
```

---

## Known Follow-Ups

- Full UX для replacement legacy `LicenseFile` можно улучшить отдельной задачей: сейчас безопасный путь — удалить существующий файл и загрузить новый.
- Seller frontend пока не использует `ProductMedia`/`ProductDocument` write API.
- Product physical dimensions стоит окончательно закрепить либо как category typed attributes, либо как отдельную модель/итерацию.
- Full edit preview может получить отдельный step-level partial success panel, если edit secondary requests начнут давать воспроизводимые частичные ошибки.
