# Task 036 — Admin: schema-driven UX для category attributes на BaseProduct (moderation)

**Priority:** P2  
**Complexity:** Medium  
**Status:** Planned  

> **Исполнитель:** агент Cursor, модель **Composer 2.5 Fast**.  
> Перед началом прочитать **«Заметки для агента-исполнителя»** в конце.  
> Действовать **строго по итерациям 1→6 по порядку**. Не объединять итерации.

**Родительский контекст:** рекомендация **B + элементы A и C** (анализ admin BaseProduct, июнь 2026).  
**Follow-up к:** [Iteration 8 — Admin/moderation upgrade](../024-product-catalog-modernization/iteration-8-admin-moderation-upgrade.md) (MVP inline добавлен, schema-driven UX — deferred).

---

## Цель

Сделать блок **Product Attribute Values** на странице Django admin `BaseProduct` удобным для **модерации и правок**:

1. Модератор видит **сводку по схеме категории**: что обязательно, что заполнено, что отсутствует — без горизонтального скрола по 4 колонкам значений.
2. Редактирование атрибутов идёт **по схеме категории** (как у продавца), с одним полем значения на строку.
3. Сохранение использует **существующую бизнес-логику** (`validate_product_attribute_payload` / `replace_product_attribute_values`).
4. (Опционально, Iteration 5) Approve блокируется, если у товара уже есть typed attributes, но не хватает required — **без** retroactive блокировки legacy-товаров без attribute rows.

---

## Контекст

### Текущее состояние (проблема)

Файл: `backend/product/admin.py`

```python
class ProductAttributeValueInline(admin.TabularInline):
    model = ProductAttributeValue
    fields = (
        "attribute_definition",
        "value_text",      # TextField → огромный textarea
        "value_number",
        "value_boolean",
        "value_option",
        "source",
    )
```

| Проблема | Причина |
|----------|---------|
| 4 колонки value на каждой строке | EAV-модель, TabularInline показывает все поля |
| Технические labels `180: door_width_mm` | `CategoryAttributeDefinition.__str__` |
| Нет контекста required/unit/group | Admin не использует `get_effective_attribute_schema` |
| Autocomplete не ограничен схемой | Можно выбрать attribute не из категории |
| `ProductAttributeValueAdminForm` не подключён к inline | Form есть, inline его не использует |
| Approve не проверяет attributes | `validate_product_before_approve` — name, category, variants only |

### Эталон логики (переиспользовать, не дублировать)

| Модуль | Назначение |
|--------|------------|
| `backend/product/attribute_schema.py` | `get_effective_attribute_schema`, `validate_product_attribute_payload`, `replace_product_attribute_values` |
| `backend/product/models.py` | `ProductAttributeValue.clean()` |
| `backend/sellers/admin.py` | UX-паттерн moderation panel (HTML cards) |
| `Frontend/Frontend3/.../SellerCategoryAttributesFields.jsx` | Seller UX: required / optional, один control на тип |

### Существующие тесты (не ломать)

- `backend/product/test_category_attributes.py` — schema, validation, `test_admin_form_rejects_enum_option_from_another_definition`
- `backend/product/test_moderation.py` — approve/reject service
- `test_public_detail_does_not_require_typed_attributes_for_old_products` в `test_category_attributes.py` — legacy products без attributes остаются valid на public API

---

## Scope (область) — ровно эти файлы

**Создать:**

- `backend/product/admin_attributes.py` — helpers, form, formset (если нужен), HTML summary builder
- `backend/product/test_admin_attributes.py` — unit + admin integration tests
- `backend/product/templates/admin/product/baseproduct/change_form.html` — **только Iteration 4**, если нужны вкладки/collapse через template
- `backend/product/static/admin/css/product_attributes.css` — **только Iteration 4**, стили summary/inline

**Изменить:**

- `backend/product/admin.py` — `ProductAttributeValueInline`, `AdminBaseProduct`, `ProductAttributeValueAdminForm`
- `backend/product/services_moderation.py` — **только Iteration 5** (optional approve check)
- `backend/product/test_moderation.py` — **только Iteration 5** (если включена проверка approve)
- `docs/tasks/README.md` — строка Task 036 в таблице
- `docs/tasks/024-product-catalog-modernization/iteration-8-admin-moderation-upgrade.md` — ссылка в Deferred → Task 036
- `docs/tasks/024-product-catalog-modernization/implementation-task-breakdown.md` — follow-up после Iteration 8

**Больше никакие файлы не редактируются** (особенно: `models.py`, migrations, `serializers.py`, `views.py`, Frontend).

---

## Не входит в задачу

- ❌ Миграции моделей / изменение схемы БД
- ❌ Изменение seller/public API contracts (`serializers.py`, seller endpoints)
- ❌ Frontend (`Frontend/Frontend3`)
- ❌ Custom admin SPA вне Django admin
- ❌ Удаление legacy `BaseProductImage` inline
- ❌ `ProductModerationEvent` audit history
- ❌ Полноценные tabbed admin (отдельный backlog; в 036 — reorder + collapse достаточно)
- ❌ Рефакторинг всего `admin.py` «по пути»
- ❌ Retroactive invalidation старых **approved** товаров без `attribute_values`

---

## Зависимости

- Task 024 Iteration 5 — category attribute schema (`CategoryAttributeDefinition`, `ProductAttributeValue`)
- Task 024 Iteration 8 — admin moderation MVP (`services_moderation.py`, approve/reject URLs)
- Task 030 — mm attributes (display `800 mm`; БД уже в mm, менять не нужно)

---

## Риски

| Риск | Митигация |
|------|-----------|
| Двойное сохранение inline + `replace_product_attribute_values` | Iteration 3: перехватить `save_formset` только для `ProductAttributeValue` formset; не вызывать `super().save_formset` для deleted/changed rows дважды |
| Public API regression | Не трогать serializers/views; тесты `test_category_attributes.py` + `pytest product -q` |
| Legacy pending products без attributes | Iteration 5: approve check **только если** `product.attribute_values.exists()` |
| Admin formset validation vs model.clean | Использовать `validate_product_attribute_payload` как source of truth при save |
| Сломать существующий `test_admin_form_rejects_enum_option_from_another_definition` | Сохранить поведение; расширить тесты, не удалять |

---

## Definition of Done

### Функциональность

- [ ] На change form `BaseProduct` есть readonly **`attributes_summary`**: таблица по `get_effective_attribute_schema(product.category)` с колонками: name (+ unit), type, required, current value (formatted), status (filled / missing required / missing optional / extra).
- [ ] `ProductAttributeValueInline`: **2–3 видимые колонки** (attribute + одно value-поле + delete); нет пустых textarea для не-text атрибутов; `source` скрыт из inline.
- [ ] `attribute_definition` ограничен effective schema категории товара (на change form с сохранённым product).
- [ ] `value_text` — `TextInput`, не `Textarea`.
- [ ] Сохранение атрибутов через `validate_product_attribute_payload` + `replace_product_attribute_values` (Iteration 3).
- [ ] Ошибки валидации видны в summary и/или `moderation_tools` (Iteration 3).
- [ ] Inlines reordered; legacy images + license collapsed (Iteration 4).
- [ ] (Optional Iteration 5) Approve блокируется с понятным сообщением, если есть attribute rows, но не хватает required; товары **без** attribute rows — approve не блокируется.

### Качество

- [ ] `cd backend && pytest product/test_admin_attributes.py -v` — green
- [ ] `cd backend && pytest product/test_category_attributes.py product/test_moderation.py -q` — green
- [ ] `cd backend && pytest product -q` — без регресса
- [ ] `python manage.py makemigrations --check --dry-run` — изменений схемы нет
- [ ] Public API contracts не изменены
- [ ] Нет секретов/PII в логах и HTML admin

### Документация

- [ ] Этот `task.md`: статус → `Done (repo-scope)`, чекбоксы DoD, раздел «Результаты (evidence)»
- [ ] Cross-links в 024 iteration-8 deferred + `docs/tasks/README.md`

---

## Спецификация `admin_attributes.py`

Создать модуль с **чистыми функциями** (без import `django.contrib.admin` на уровне helpers, чтобы unit-тесты были лёгкими).

### Dataclass (пример)

```python
@dataclass(frozen=True)
class AttributeModerationRow:
    definition_id: int
    code: str
    name: str
    data_type: str
    unit: str
    group: str
    is_required: bool
    is_inherited: bool
    display_value: str          # "800 mm", "Wood", "—", "Yes/No"
    status: str                 # "filled" | "missing_required" | "missing_optional" | "extra"
    value_id: int | None        # ProductAttributeValue.pk if exists
```

### `format_attribute_value(value: ProductAttributeValue | None, *, definition: CategoryAttributeDefinition) -> str`

Правила форматирования (единый источник для summary и moderation_tools):

| data_type | Если значение есть | Если нет |
|-----------|-------------------|----------|
| `text` | stripped `value_text` | `—` |
| `number` | `format(value_number)` без лишних нулей + ` f"{unit}"` если unit не пуст | `—` |
| `boolean` | `"Yes"` / `"No"` | `—` |
| `enum` | `value_option.label` (fallback: `value_option.value`) | `—` |

Не использовать `__str__` моделей для display.

### `build_attributes_moderation_context(product: BaseProduct) -> dict`

Возвращает:

```python
{
    "rows": list[AttributeModerationRow],      # sorted by definition.sort_order, id
    "required_total": int,
    "required_filled": int,
    "missing_required_codes": list[str],
    "extra_rows": list[ProductAttributeValue], # values whose definition not in effective schema
    "has_schema": bool,
}
```

Алгоритм:

1. `schema = get_effective_attribute_schema(product.category)`
2. `values_by_def_id = {v.attribute_definition_id: v for v in product.attribute_values.select_related("attribute_definition", "value_option")}`
3. Для каждого `EffectiveAttribute` в schema — row со status filled/missing_*
4. `extra_rows` — values в БД, чей `attribute_definition_id` не в schema definition ids
5. Prefetch не обязателен в helper (admin queryset может prefetch отдельно)

### `render_attributes_summary_html(context: dict) -> str`

- Использовать `django.utils.html.format_html` / `format_html_join`
- Таблица с CSS class `product-attributes-summary` (стили в static)
- Missing required — визуально выделить (class `attr-missing-required`)
- Extra attributes — отдельная секция «Outside category schema»

### `build_attribute_payload_from_formset(formset) -> list[dict]`

Собрать payload для `validate_product_attribute_payload`:

```python
{"attribute_definition": int, "value_text"?: str, "value_number"?: Decimal, "value_boolean"?: bool, "value_option"?: int, "source": "manual"}
```

- Пропускать пустые строки (нет definition_id)
- Не включать deleted forms
- `source` всегда `"manual"` для admin edits

---

## Спецификация изменений `admin.py`

### `ProductAttributeValueAdminForm`

```python
class ProductAttributeValueAdminForm(forms.ModelForm):
    class Meta:
        model = ProductAttributeValue
        fields = ("attribute_definition", "value_text", "value_number", "value_boolean", "value_option")
        widgets = {"value_text": forms.TextInput(attrs={"size": 40})}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Скрыть нерелевантные поля по definition.data_type (HiddenInput)

    def clean(self):
        cleaned = super().clean()
        # Делегировать model.clean / full_clean
        ...
```

Подключить: `ProductAttributeValueInline.form = ProductAttributeValueAdminForm`

### `ProductAttributeValueInline`

- `form = ProductAttributeValueAdminForm`
- `fields` без `source`
- `formfield_for_foreignkey`: limit `attribute_definition` по `get_effective_attribute_schema(obj.category)`
- `get_extra`: строки для missing required (если реализуемо без custom formset — минимум summary показывает gaps)
- Human labels: `f"{name} ({code})"`, не глобальный `__str__`

**Важно:** если autocomplete конфликтует с queryset limit — заменить на `Select` **только в inline**.

### `AdminBaseProduct` — readonly summary

Fieldset **«Category attributes»** после «Category & seller»:

- `attributes_summary` в `readonly_fields`
- `@admin.display(description="Attributes summary")` → `render_attributes_summary_html(build_attributes_moderation_context(obj))`

### Iteration 3 — `save_formset`

```python
def save_formset(self, request, form, formset, change):
    if formset.model is ProductAttributeValue:
        product = form.instance
        payload = build_attribute_payload_from_formset(formset)
        replace_product_attribute_values(product, payload)
        return  # НЕ вызывать super для этого formset
    super().save_formset(...)
```

**Не** смешивать partial inline save с replace — replace удаляет все values и создаёт заново (существующее поведение API).

### Iteration 4 — порядок inlines

```python
inlines = [
    ProductAttributeValueInline,
    ProductMediaInline,
    ProductDocumentInline,
    ProductParameterInline,
    ProductVariantInline,
    BaseProductImageInline,   # classes = ("collapse",)
    LicenseFileInline,        # classes = ("collapse",)
]
```

### Iteration 4 — `moderation_tools`

Добавить строку:

```text
Required attributes: 3/5 ✓
Missing: door_material, opening_type
```

Или «No category schema» / «Legacy: no attribute rows».

---

## Iteration 5 (OPTIONAL) — Approve validation

**Включать только если в Completion log явно отмечено «Iteration 5 enabled».** Иначе пропустить и отметить deferred.

### Правило (не ломать legacy)

В `validate_product_before_approve(product)` **после** существующих checks:

```python
if product.attribute_values.exists():
    # Собрать payload из текущих rows и validate через validate_product_attribute_payload
    # При missing required → errors.append("Missing required attribute: {code}")
```

**Не блокировать** approve, если `product.attribute_values.count() == 0`.

Обновить `moderation_tools`: если validation errors содержат attribute missing — показать в approve_reason.

---

# Iterations

## Iteration 1 — Analysis & helpers (без UI)

### Цель
Подтвердить текущее состояние admin и создать helper-модуль + unit tests.

### Действия
1. Прочитать целиком: `backend/product/admin.py`, `attribute_schema.py`, `models.py` (`ProductAttributeValue`, `CategoryAttributeDefinition`).
2. Создать `backend/product/admin_attributes.py` с `format_attribute_value`, `build_attributes_moderation_context`, `render_attributes_summary_html`, `build_attribute_payload_from_formset`.
3. Создать `backend/product/test_admin_attributes.py`:
   - `test_format_attribute_value_number_with_unit`
   - `test_format_attribute_value_enum_uses_label`
   - `test_build_context_marks_missing_required`
   - `test_build_context_detects_extra_values_outside_schema`
   - `test_build_context_empty_when_no_category`
   - `test_build_payload_from_formset_skips_empty_rows`

### Ограничения
- Не менять `admin.py` на этом шаге.

### Output
- Helpers + green unit tests.

### Статус
- [ ]

---

## Iteration 2 — Readonly summary + compact inline (UI)

### Цель
Модератор видит summary; inline — без 4 пустых колонок и textarea.

### Действия
1. `AdminBaseProduct`: fieldset «Category attributes», `attributes_summary`, `readonly_fields`.
2. `ProductAttributeValueAdminForm`: dynamic hide irrelevant value fields; `TextInput` для text.
3. `ProductAttributeValueInline`: подключить form; убрать `source`; limit `attribute_definition` queryset по schema.
4. Human labels в inline — **не** менять model `__str__` глобально.
5. `get_extra`: добавить формы для missing required (если нужен custom formset — документировать в evidence).

### Ограничения
- Пока **не** менять `save_formset` (сохранение старое допустимо на этом шаге).
- Не трогать serializers.

### Output
- Admin UI улучшен; manual check на тестовом product с Doors attributes.

### Статус
- [ ]

---

## Iteration 3 — Save & validation wiring

### Цель
Единый save path через `replace_product_attribute_values`; ошибки видны модератору.

### Действия
1. `AdminBaseProduct.save_formset` — branch для `ProductAttributeValue`.
2. Mapping validation errors → `form.add_error(None, message)` или non-field errors на change form.
3. Обновить `attributes_summary` / `moderation_tools` для отображения `missing_required_codes` после save attempt.
4. Тесты в `test_admin_attributes.py`:
   - `test_admin_form_rejects_enum_option_from_wrong_definition`
   - `test_save_formset_replaces_values_atomically`
   - `test_attribute_definition_queryset_limited_to_category_schema`

### Output
- Save через service layer; tests green.

### Статус
- [ ]

---

## Iteration 4 — Page comfort (layout)

### Цель
Снизить cognitive load всей страницы BaseProduct.

### Действия
1. Reorder `inlines` (см. Scope).
2. `classes = ("collapse",)` для `BaseProductImageInline`, `LicenseFileInline`.
3. `moderation_tools`: строка `Required attributes: X/Y`.
4. (Optional) `change_form.html` extends admin change_form — только если collapse недостаточно; подключить `product_attributes.css`.
5. (Optional) changelist column `attributes_status`: `ok` / `missing` / `n/a` — без N+1.

### Output
- Страница короче и читабельнее.

### Статус
- [ ]

---

## Iteration 5 — Approve check (OPTIONAL)

### Цель
Блокировать approve при incomplete required attributes **только** для товаров с existing attribute rows.

### Действия
1. Расширить `validate_product_before_approve` (правило выше).
2. Тесты в `test_moderation.py`:
   - `test_approve_blocked_when_required_attributes_missing_and_rows_exist`
   - `test_approve_allowed_when_no_attribute_rows_legacy`
3. Sync message in `moderation_tools`.

### Ограничения
- Не менять public detail behavior.
- Если команда решила skip — отметить deferred в evidence.

### Статус
- [ ] / deferred

---

## Iteration 6 — Validation & Docs

### Команды

```bash
cd backend
python -m pytest product/test_admin_attributes.py -v
python -m pytest product/test_category_attributes.py product/test_moderation.py -q
python -m pytest product -q
python manage.py makemigrations --check --dry-run
```

### Ручная проверка (чеклист)

- [ ] Admin list pending → open product with Door category attributes
- [ ] Summary показывает required/filled/missing
- [ ] Inline: только релевантное value-поле для number/enum/boolean
- [ ] Save attributes → values persist; summary обновляется
- [ ] Enum option из другого definition → ошибка
- [ ] Approve/reject flow не сломан
- [ ] Legacy product без attribute rows → approve работает (Iteration 5 или без неё)

### Документация
- Обновить этот task.md, README, iteration-8 deferred link.

### Статус
- [ ]

---

## Результаты выполнения (evidence)

_Заполняется исполнителем._

- **Изменённые/созданные файлы:**
- **Iteration 5:** enabled / deferred
- **Тесты:** (команды + counts)
- **makemigrations --check:**
- **Manual QA:** (кратко)
- **Public API:** подтверждение «не изменён»

---

## Привязка к коду

| Тип | Файлы |
|-----|-------|
| **Helpers** | `backend/product/admin_attributes.py` |
| **Admin** | `backend/product/admin.py` |
| **Moderation service** | `backend/product/services_moderation.py` (Iter 5 only) |
| **Schema (read-only reuse)** | `backend/product/attribute_schema.py` |
| **Tests** | `backend/product/test_admin_attributes.py`, `test_moderation.py`, `test_category_attributes.py` |
| **Templates/static** | `templates/admin/product/baseproduct/change_form.html`, `static/admin/css/product_attributes.css` (Iter 4) |
| **Не менять** | `models.py`, migrations, `serializers.py`, `views.py`, Frontend |

---

## Agent prompt (скопировать в новый чат Agent mode)

```
Ты — backend-разработчик reli.one. Выполни Task 036: Admin schema-driven UX для category attributes на BaseProduct.

Source of truth: docs/tasks/036-admin-product-attributes-moderation-ux/task.md

Обязательно прочитай перед кодом:
1. task.md (этот файл) целиком, особенно «Заметки для агента»
2. backend/product/admin.py
3. backend/product/attribute_schema.py
4. backend/product/test_category_attributes.py (test_admin_form_rejects_enum_option_from_another_definition)

Иди Iteration 1 → 6 по порядку. После каждой итерации: чекбокс + краткий evidence в task.md.

Жёсткие ограничения:
- Не менять models/migrations/serializers/views/frontend
- Save attributes через replace_product_attribute_values
- Legacy: approve не блокировать если attribute_values пуст (Iteration 5 optional)
- pytest product -q green в конце
```

---

## Заметки для агента-исполнителя (Composer 2.5 Fast)

1. **Только файлы из Scope.** Нужно тронуть models/API/frontend — **стоп**, это другая задача.
2. **Идти 1→6 по порядку.** Не объединять Iteration 2 и 3.
3. **Сначала прочитать файл целиком, потом править.** Не переформатировать несвязанные строки.
4. **Переиспользовать `attribute_schema.py`** — не писать вторую validation logic.
5. **`replace_product_attribute_values` удаляет все values** — в `save_formset` не вызывать также default inline save.
6. **Не менять `CategoryAttributeDefinition.__str__` глобально** — human labels только в admin form/widget.
7. **Iteration 5 optional** — по умолчанию можно defer, если Iteration 1–4 + tests green.
8. **Manager user для admin tests:** role `Manager` или `Admin` (`ManagerOrAdminOnlyMixin`).
9. **makemigrations --check** обязателен — схема БД не меняется.
10. Соблюдать `040-security`, `000-project-core`, `010-backend-django`: thin admin, logic in services/helpers.
11. **Коммит** — только если пользователь явно попросил; иначе только код + обновление task.md.
12. После завершения: статус task → `Done (repo-scope)`, заполнить evidence.
