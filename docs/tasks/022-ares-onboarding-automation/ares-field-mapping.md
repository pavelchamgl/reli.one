# ARES Field Mapping — Iteration 1

Документ фиксирует решения для будущего ARES-assisted onboarding. Это design/test-planning артефакт: runtime-код, endpoint, frontend UI и тесты в Iteration 1 не добавляются.

## Fixture Plan

ARES fixtures нужны как документационные/test-planning примеры для будущих моков backend/frontend. Хранить их следует рядом с тестами только при реализации следующих итераций или в docs как sanitized JSON; живые вызовы ARES из кода не добавлять.

| Fixture | Цель | Ожидаемые признаки |
|---------|------|--------------------|
| `active_company_full_address` | Успешный prefill для активной компании | `ico`, `obchodniJmeno`, `pravniForma`, `sidlo` с улицей/городом/PSC/страной, `datumZaniku` отсутствует |
| `inactive_company` | Проверить moderator hint для неактивного/ликвидированного субъекта | найденный `ico`, заполненное имя, признак неактивности через `datumZaniku` и/или регистрационные признаки |
| `not_found` | Проверить ручной fallback без prefill | ARES 404/empty result нормализуется в `found=false`, submit/UI остаются ручными |
| `malformed_or_partial_address` | Проверить частичный адрес и редактируемость полей | `sidlo` без части полей, нестандартный номер дома/улицы или адрес, который нельзя безопасно собрать полностью |

Для каждого fixture в будущих тестах фиксировать raw-like минимальный вход ARES и normalized output: `found`, `is_active`, `company_name`, `business_id`, `country_of_registration`, `legal_form`, `registered_address`, `dic_hint`, `warnings`.

## IČO Validation

Валидация выполняется до сетевого запроса.

- Нормализация: убрать пробелы и визуальные разделители; дальше принимать только цифры.
- Формат: ровно 8 цифр. Если продукт решит принимать исторические короткие значения, их нужно явно дополнить ведущими нулями до 8 цифр до checksum.
- Checksum: первые 7 цифр умножаются на веса `8, 7, 6, 5, 4, 3, 2`, сумма берётся по mod 11. Контрольная цифра: `(11 - (sum % 11)) % 10`; результат должен совпасть с 8-й цифрой.
- Невалидный формат/checksum должен возвращать локальную ошибку в lookup и не обращаться к ARES.

## Prefill Mapping

ARES — источник подсказки, не источник истины. Продавец применяет prefill явно, поля остаются редактируемыми, ручная модерация сохраняется.

| ARES field | Onboarding field | Решение |
|------------|------------------|---------|
| `obchodniJmeno` | `SellerCompanyInfo.company_name` | Можно prefill |
| `ico` | `SellerCompanyInfo.business_id` | Можно подтверждать/prefill как IČO |
| успешный CZ lookup | `SellerCompanyInfo.country_of_registration` | Можно prefill как Czech Republic/CZ; поле остаётся редактируемым, если UI это допускает |
| `pravniForma` | `SellerCompanyInfo.legal_form` | Можно prefill через явный mapping кодов ARES к значениям формы |
| `sidlo` | `SellerCompanyAddress.street/city/zip_code/country` | Можно prefill registered company address; адрес может быть частичным |
| `dic` | `SellerCompanyInfo.tin` / DIČ hint | Только editable hint после продуктового решения; не является доказательством VAT/DPH validity и не заменяет VIES/VAT verification |

Не заполнять из ARES автоматически: bank account, company phone/email, representative DOB/nationality, warehouse address, return address, uploads/proofs.

Representative first/last name и role из statutory bodies можно рассматривать только как отдельную future-iteration подсказку после анализа источника: без DOB/nationality, без auto-confirm, с выбором при нескольких представителях и полной редактируемостью.

Warehouse proof optional при `same_as_primary_address=true` — отдельное правило onboarding-валидации/UI, не ARES mapping.

DIČ не подтверждает валидность VAT/DPH и не заменяет VIES/VAT verification. Если продукт использует DIČ как TIN для CZ company flow, prefill должен быть редактируемым и не должен перезаписывать уже введённый пользователем TIN.

## Auto-Approve Boundary

Auto-approve не входит в MVP и остаётся Later/Pilot. До evidence gate submit должен оставаться ручным: `pending_verification`, ARES snapshot только как moderator hint.
