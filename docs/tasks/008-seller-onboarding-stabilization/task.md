# Task 008 — Seller Onboarding Stabilization

**Priority:** P1  
**Complexity:** High  
**Status:** **DONE (repo-scope)** — manual/product validation pending (см. [Final DoD table](#final-dod-table-task-008)).

**Pending (вне repo-scope):** ручная UI/staging-приёмка онбординга и полная продуктовая валидация этим репозиторием **не утверждаются**; **Frontend3 e2e** онбординга в минимальный scope Task 008 **не входил** (см. таблицу ниже).

> **Ограничения:** контракт публичного onboarding API **не меняется** без отдельного решения.

**Flow-документ:** [`docs/seller-onboarding-flow.md`](../seller-onboarding-flow.md).

---

## Явные независимости

Task **008 не зависит** от:

| Трек | Пояснение |
|------|-----------|
| **PromoCode** | промокоды вне текущего roadmap; онбординг с ними не связан |
| **Stock reservation / Task 013** | вне текущего roadmap; не блокирует работы по 008 |
| **Delivery cleanup / Task 005** | нет специфичной связки онбординга с delivery-task; достаточно общего стабильного **payment/order** фундамента маркетплейса |

**Зависимость:** **[Task 002 — Testing Foundation](./002-testing-foundation/task.md)** — **Core DONE** (pytest/CI, базовые регрессии по доменам).

---

## Scope Task 008 (цель стабилизации)

| Область | Смысл |
|---------|--------|
| **state/review consistency** | Единообразные ответы `GET state` / `GET review`, без дублирования логики во views |
| **Company happy-path** | Сохранение и валидация шагов компании + submit-путь |
| **Self-employed happy-path** | Сохранение и валидация шагов OSVČ + submit-путь |
| **documents upload/replace** | Загрузка и идемпотентная замена документов по ключу (type/scope/side) |
| **submit / review approve/reject** | Переходы статусов и guard-ы на сервисном слое |
| **audit log** | Запись событий онбординга (`OnboardingAuditLog`, сервис аудита) |
| **API tests** | Регрессии ключевых эндпоинтов и сервисных переходов |
| **onboarding flow documentation** | [`docs/seller-onboarding-flow.md`](../seller-onboarding-flow.md) — статусы, блоки, completeness, API, аудит |
| **final regression / audit** | Прогон тестов sellers + ручные сценарии перед крупным рефакторингом |

---

## Done (подтверждено кодом на момент синхронизации docs)

- **`services_onboarding.py`:** `build_seller_onboarding_state_response`, `build_seller_onboarding_review_response`; хелперы one-to-one блоков (`get_or_create_onboarding_block`, `get_onboarding_block_or_none`, `self_employed_personal_defaults_from_account` и др.); `compute_completeness`, модерация, валидации submit.
- **`views_onboarding.py`:** `GET` state/review делегируют в сервисы сборки ответа (дублирующие локальные сборщики убраны). Файл — **thin re-export** (~25 строк `wc -l`): все onboarding view-классы реализованы в `sellers/onboarding/`.
- **`serializers_onboarding.py`** — присутствует, блоки данных онбординга.
- **`services_onboarding_audit.py`**, модель **`OnboardingAuditLog`** (`models.py`), миграции `0005`/`0006`, контекст `audit_context.py`, связка с сигналами/middleware/drf_hooks — аудит в коде есть.
- **Тесты:**
  - `backend/sellers/tests.py` — валидация держателя счёта компании (`validate_before_submit` / `get_expected_company_account_holder`), **Self-employed personal** GET/PUT, **submit / approve / reject** на сервисах (с моками `log_onboarding_event` / почты / sync).
  - `backend/sellers/test_onboarding_stabilization.py` — форма **state** (`build_seller_onboarding_state_response`), HTTP **state/review**, **замена документа company** (повторный POST с тем же ключом), **warehouse + return** (`same_as_warehouse`).
  - `backend/sellers/test_onboarding_completeness.py` — **`compute_completeness`**, **`compute_next_step`**, **`compute_documents_summary_and_missing`**: пустая заявка / тип без блоков; SE и company partial vs complete; документы (identity только `back` до добавления `front`); `same_as_warehouse`; инвариант `tax_country` (ветки по стране в completeness **нет**).
  - `backend/sellers/test_onboarding_audit.py` — реальные строки **`OnboardingAuditLog`**: прямой **`log_onboarding_event`** (включая `audit_disabled` без записи, PK заявки); **`submit_application`** → `review_requested`; **`approve_application`** / **`reject_application`** (мок только **`sync_legal_info_from_application`** / **`send_mail`**); отрицательные guard и **`validate_before_submit`** без аудита.
  - `backend/sellers/test_onboarding_api_happy_path.py` — полные REST happy-path **company** и **self-employed** (POST/PUT/GET state & review, документы multipart, POST submit → `pending_verification`); негативы incomplete submit и редактирование после submit; контрольный кейс **DE** в ISO-полях (без матрицы стран в completeness).
- **Декомпозиция views:** пакет `sellers/onboarding/` — **шаг 6:** state / review / submit; **шаг 7:** `seller_type.py`; **шаг 8:** `self_employed.py`; **шаг 9:** `company.py`; **шаг 10:** `bank.py`; **шаг 11:** `warehouse.py` + `return_policy.py`; **шаг 12:** `documents.py` (`SellerDocumentUploadAPIView`, константы `ALLOWED_MIME_TYPES` / `MAX_FILE_SIZE_MB` / `MAX_FILES_PER_REQUEST`); реэкспорт из `views_onboarding.py` для `urls.py`.
- Аннотации `Set`, `Tuple` в `compute_completeness` и связанном коде приведены в порядок (импорты для typing).
- **Документация flow:** [`docs/seller-onboarding-flow.md`](../seller-onboarding-flow.md) (шаг 2 Task 008).

---

## Open (следующие шаги работ — actionable)

1. ~~**REST/API цепочки company / self-employed:**~~ закрыты в **`test_onboarding_api_happy_path.py`** (CZ company + CZ self-employed, контрольный **DE** по ISO-полям payload; отдельной матрицы CZ/SK в коде нет — см. flow §5). Опционально позже: расширение только если продукт потребует доп. страны или edge-case полей.
2. ~~**Декомпозиция `views_onboarding.py`**~~ — выполнена (Iteration 3, шаги 6–12); `views_onboarding.py` — только реэкспорт; URL и контракты не менялись.
3. ~~**Финальная валидация (repo):**~~ закрыта шагом 13: `manage.py check`, `pytest sellers/ -q`, полный `pytest` — см. [Final DoD table](#final-dod-table-task-008). **Остаётся:** ручной чеклист Iteration 5 (Ops/staging) — **pending**, не блокирует **DONE (repo-scope)**.

---

## Deferred / Future

- ~~Вынос onboarding views в пакет `sellers/onboarding/steps/`~~ — выполнено (Iteration 3); новые шаги — только при появлении новых эндпоинтов.
- **factory_boy**-фикстуры для «полной заявки» — по желанию, не блокер документации.
- E2E онбординга во **Frontend3** — вне минимального scope 008, если не решено иначе.

---

## Manual / Ops

- Ручные сценарии из раздела **Iteration 5 — Validation** (регистрация продавца, заполнение шагов, submit, запрет редактирования после отправки и т.д.) — по-прежнему релевантны для приёмки; автоматизация не заменяет smoke в sandbox/staging.

---

## Контекст (исторический снимок → актуализировано)

Seller onboarding — критическая зона. Раньше в задаче фигурировали формулировки «только ~4 теста», «git status неочистен» — на момент синхронизации май 2026 это **устарело**: есть отдельный файл стабилизации и расширенные сервисные тесты переходов.

Актуальные ориентиры по объёму (локально `wc -l`, могут меняться коммитами):

| Файл | Порядок величины |
|------|------------------|
| `backend/sellers/views_onboarding.py` | ~25 строк (реэкспорт; реализации в `onboarding/`) |
| `backend/sellers/services_onboarding.py` | ~870 строк |

---

## Scope (область задачи) — без изменения бизнес-смысла

- Анализ и документация текущего onboarding flow
- Расширение regression-тестов там, где есть пробелы (ветки completeness, страны, audit)
- Безопасная декомпозиция `views_onboarding.py` в step-handlers **после** тестов (**выполнено**, см. Iteration 3)

## Не входит в задачу

- Изменение бизнес-правил онбординга без явного решения
- Добавление новых стран/новых обязательных полей в контракт
- Изменение API-контрактов онбординга
- Изменение моделей `SellerOnboardingApplication` и связанных без отдельного migration-плана

## Риски

- Ветвления по стране в **completeness** отсутствует; API-регрессии по ISO-полям расширять по продуктовой необходимости (см. `test_onboarding_api_happy_path.py`, DE).
- `compute_completeness` — плотная логика; регрессии при рефакторинге без тестов по веткам **высокий риск**
- Сложность onboarding HTTP-слоя сосредоточена в модулях `sellers/onboarding/**` (не в монолитном `views_onboarding.py`)

---

## Definition of Done (backend repo-scope)

Чеклист ниже закрывает **цели Task 008 в репозитории**. Полная **продуктовая** приёмка и **Frontend3 e2e** — в [Final DoD table](#final-dod-table-task-008).

- [x] Задокументирован полный onboarding flow — [`docs/seller-onboarding-flow.md`](../seller-onboarding-flow.md)
- [x] Регрессии по шагам на уровне, достаточном для безопасного рефакторинга: **`compute_completeness`** — `test_onboarding_completeness.py`; **`OnboardingAuditLog`** — `test_onboarding_audit.py`; **полные REST-цепочки** (happy-path + негативы) — `test_onboarding_api_happy_path.py`. Отдельная матрица стран в **`compute_completeness`** не требуется (см. flow §5).
- [x] `views_onboarding.py` декомпозирован в step-handlers (`sellers/onboarding/**`), URL маршруты сохранены; файл — thin re-export

## Final DoD table (Task 008)

**Кратко (repo-scope):** flow задокументирован; регрессии completeness / audit / REST happy-path в коде; views декомпозированы; контракт API и `urls.py` сохранены; финальный regression gate (check + pytest) пройден — см. строку **Evidence** ниже. **Ручная** UI/staging-приёмка и **e2e Frontend3** — **не** входят в закрытие repo-scope.

| Item | Status | Evidence | Remaining action |
|------|--------|----------|------------------|
| Flow documented | DONE | [`docs/seller-onboarding-flow.md`](../seller-onboarding-flow.md) | — |
| compute_completeness covered | DONE | `backend/sellers/test_onboarding_completeness.py` | — |
| OnboardingAuditLog covered | DONE | `backend/sellers/test_onboarding_audit.py` | — |
| REST happy-path covered | DONE | `backend/sellers/test_onboarding_api_happy_path.py` | — |
| views_onboarding.py decomposed | DONE | `backend/sellers/views_onboarding.py` (re-export); `backend/sellers/onboarding/**` | — |
| API contract preserved | DONE | декомпозиция без смены контрактов (см. ограничения в шапке task) | — |
| urls.py unchanged | DONE | `backend/sellers/urls.py` не менялся в рамках выноса views | — |
| manual UI/staging validation | PENDING OPS / MANUAL | — | Чеклист **Iteration 5 — Validation** (ниже) |
| future Frontend3 e2e | DEFERRED / OPTIONAL | — | Вне минимального scope Task 008 |

**Repo regression gate (шаг 13):** `docker compose -f docker-compose.test.yml run --rm backend_test python manage.py check` → System check identified no issues; `... pytest sellers/ -q` и `... pytest -q` → exit 0 (май 2026).

---

# Iterations

## Iteration 1 — Analysis

### Цель
Полностью понять текущий onboarding flow и зафиксировать все ветвления.

### Действия
- Прочитать `backend/sellers/views_onboarding.py` — все классы onboarding API
- Прочитать `backend/sellers/services_onboarding.py` — `compute_completeness`, `ensure_application_editable`, модерация
- Прочитать `backend/sellers/serializers_onboarding.py` — блоки данных
- Прочитать `backend/sellers/tests.py`, `backend/sellers/test_onboarding_stabilization.py` — фактическое покрытие
- Прочитать `backend/sellers/services_onboarding_audit.py`, модель `OnboardingAuditLog`

### Output

Каноническое описание и диаграммы — **[`docs/seller-onboarding-flow.md`](../seller-onboarding-flow.md)**.

Кратко по seller_type:

| Шаг | Self-employed | Company |
|-----|--------------|---------|
| seller-type | ✓ | ✓ |
| self-employed block | ✓ | — |
| company block | — | ✓ |
| bank details | ✓ | ✓ |
| warehouse | ✓ | ✓ |
| return policy | ✓ | ✓ |
| documents | ✓ | ✓ |

### Статус
- [x] Analysis complete
- [x] Flow documented (`docs/seller-onboarding-flow.md`)

---

## Iteration 2 — Tests (расширение)

### Цель
Закрыть пробелы регрессий **до** декомпозиции views.

### Приоритеты (фактический backlog)

Историческая ссылка на `tests_onboarding_flow.py` **не соответствует** репозиторию: расширять **`backend/sellers/test_onboarding_stabilization.py`** и/или **`backend/sellers/tests.py`** / **`backend/sellers/test_onboarding_completeness.py`** / **`backend/sellers/test_onboarding_audit.py`** / **`backend/sellers/test_onboarding_api_happy_path.py`**.

- ~~Явные кейсы для **`compute_completeness`**~~ — см. **`test_onboarding_completeness.py`** (шаг 3).
- ~~Утверждения по **`OnboardingAuditLog`** (реальные строки в БД)~~ — см. **`test_onboarding_audit.py`** (шаг 4).
- ~~Цепочки **company / self-employed** по REST (полные happy-path + негативы)~~ — **`test_onboarding_api_happy_path.py`** (шаг 5).

### Статус
- [x] Целевые тесты `compute_completeness` / `compute_next_step` / `compute_documents_summary_and_missing` — `test_onboarding_completeness.py`
- [x] Целевые тесты **`OnboardingAuditLog`** / сервисный аудит без мока `log_onboarding_event` — `test_onboarding_audit.py`
- [x] REST/API happy-path **company** / **self-employed** + негативы (incomplete submit, edit после submit) + ISO **DE** — `test_onboarding_api_happy_path.py`

---

## Iteration 3 — Refactor (только если тесты достаточны)

### Цель
Декомпозировать `views_onboarding.py` в step-handlers.

### Целевая структура (ориентир)

```
backend/sellers/
├── views_onboarding.py          ← thin re-export (совместимость с urls.py)
└── onboarding/
    ├── __init__.py
    ├── steps/
    │   ├── __init__.py
    │   ├── state.py
    │   ├── seller_type.py
    │   ├── self_employed.py
    │   ├── company.py
    │   ├── bank.py
    │   ├── warehouse.py
    │   ├── return_policy.py
    │   └── documents.py
    └── review/
        ├── submit.py
        └── review.py
```

### Правила
- Только перенос кода, не изменение логики
- После каждого переноса — полный набор тестов sellers
- Сохранить backward compatibility URL-маршрутов и ответов API

### Статус
- [x] **Шаг 6:** вынесены **`SellerOnboardingStateAPIView`**, **`SellerOnboardingReviewAPIView`**, **`SellerOnboardingSubmitAPIView`** (см. пути выше). Реэкспорт из `views_onboarding.py`.
- [x] **Шаг 7:** вынесен **`SellerSetSellerTypeAPIView`** → `sellers/onboarding/steps/seller_type.py`; реэкспорт из `views_onboarding.py`.
- [x] **Шаг 8:** вынесены **`SellerSelfEmployedPersonalAPIView`**, **`SellerSelfEmployedTaxAPIView`**, **`SellerSelfEmployedAddressAPIView`** → `sellers/onboarding/steps/self_employed.py`; реэкспорт из `views_onboarding.py`.
- [x] **Шаг 9:** вынесены **`SellerCompanyInfoAPIView`**, **`SellerCompanyRepresentativeAPIView`**, **`SellerCompanyAddressAPIView`** → `sellers/onboarding/steps/company.py`; реэкспорт из `views_onboarding.py`.
- [x] **Шаг 10:** вынесен **`SellerBankAccountAPIView`** → `sellers/onboarding/steps/bank.py`; реэкспорт из `views_onboarding.py`.
- [x] **Шаг 11:** вынесены **`SellerWarehouseAddressAPIView`** → `sellers/onboarding/steps/warehouse.py`, **`SellerReturnAddressAPIView`** → `sellers/onboarding/steps/return_policy.py`; реэкспорт из `views_onboarding.py`.
- [x] **Шаг 12:** вынесены **`SellerDocumentUploadAPIView`**, константы **`ALLOWED_MIME_TYPES`**, **`MAX_FILE_SIZE_MB`**, **`MAX_FILES_PER_REQUEST`** → `sellers/onboarding/steps/documents.py`; реэкспорт из `views_onboarding.py`.
- [x] **Шаг 13:** финальный regression gate (repo-scope) — `manage.py check`, `pytest sellers/ -q`, полный `pytest`; задача закрыта как **DONE (repo-scope)** — см. [Final DoD table](#final-dod-table-task-008).

### Фактическая структура (май 2026)

```
backend/sellers/onboarding/
├── __init__.py
├── steps/
│   ├── __init__.py      # экспорт steps + bank + warehouse + return_policy + documents
│   ├── state.py
│   ├── seller_type.py
│   ├── self_employed.py
│   ├── company.py
│   ├── bank.py
│   ├── warehouse.py     # SellerWarehouseAddressAPIView
│   ├── return_policy.py # SellerReturnAddressAPIView
│   └── documents.py     # SellerDocumentUploadAPIView + upload-константы
└── review/
    ├── __init__.py
    ├── review.py
    └── submit.py
```

---

## Iteration 4 — Documentation

### Цель
Поддерживать onboarding flow для продуктовой и технической команды.

### Документ

Создан и поддерживается: **[`docs/seller-onboarding-flow.md`](../seller-onboarding-flow.md)**.

### Статус
- [x] Documentation created

---

## Iteration 5 — Validation

### Тесты

```bash
pytest sellers/ -q
docker compose -f docker-compose.test.yml run --rm backend_test pytest sellers/ -q
# или
python manage.py test sellers
```

### Repo regression gate (шаг 13)

- [x] `manage.py check` passed — `docker compose -f docker-compose.test.yml run --rm backend_test python manage.py check`
- [x] `pytest sellers/ -q` passed
- [x] Full `pytest -q` passed

### Ручная проверка (Manual/Ops)

- [ ] Регистрация нового продавца → создаётся draft application
- [ ] Заполнение self-employed данных → сохраняется корректно
- [ ] Попытка submit без заполнения всех шагов → ошибка
- [ ] Полное заполнение → submit → статус `pending_verification` (фактический переход в `submit_application`)
- [ ] Редактирование после submit → ошибка

### Статус
- [x] Repo regression gate complete ([Final DoD table](#final-dod-table-task-008))
- [ ] Validation complete (manual/Ops — **pending**, вне **DONE (repo-scope)**)

---

## Привязка к коду

| Тип | Файлы |
|-----|-------|
| **Backend** | `sellers/views_onboarding.py`, `sellers/services_onboarding.py`, `sellers/serializers_onboarding.py`, `sellers/services_onboarding_audit.py`, `sellers/models.py` |
| **Onboarding views (пакет)** | `steps/state.py`, `seller_type.py`, `self_employed.py`, `company.py`, `bank.py`, `warehouse.py`, `return_policy.py`, **`documents.py`**, `review/review.py`, `review/submit.py` (реэкспорт в `views_onboarding.py`) |
| **Новые файлы** | `sellers/onboarding/**` (декомпозиция завершена шагом 12) |
| **Тесты** | `sellers/tests.py`, `sellers/test_onboarding_stabilization.py`, `sellers/test_onboarding_completeness.py`, `sellers/test_onboarding_audit.py`, `sellers/test_onboarding_api_happy_path.py` |
| **Документация** | [`docs/seller-onboarding-flow.md`](../seller-onboarding-flow.md) |
| **Модели** | `SellerOnboardingApplication`, `SellerDocument`, `OnboardingAuditLog`, блоки onboarding |
| **API** | Контракты без изменений без отдельного решения |

## Связанные замечания из docs/09-architecture-debt.md

- **BE-3:** `sellers/views_onboarding.py` — thin re-export; реализации в `onboarding/**` (при проходе debt-дока уточнить формулировку BE-3)
