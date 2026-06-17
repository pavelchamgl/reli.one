# ADR 05 — Public visibility для brand, media, documents и draft data

**Статус:** принято для следующих итераций  
**Дата:** 2026-06-05  
**Scope:** product catalog modernization, moderation, public API, GMC feed  
**Связанные итерации:** 2, 4, 8, 9

---

## Контекст

Public catalog сейчас фильтрует товары по `is_active=True` и `status=approved`. Новые nested resources будут иметь собственный lifecycle: brand, media, documents, draft/import/enrichment payloads.

Если отдавать nested resources без фильтрации, public API и GMC feed могут показать pending или rejected данные.

---

## Решение

1. Public API отдает только approved nested resources.
2. Pending/rejected `Brand`, `ProductMedia`, `ProductDocument` не попадают в public list/detail/search/category и GMC feed.
3. Draft/import/enrichment payloads никогда не отдаются public users.
4. Seller может видеть свои pending/rejected resources в seller endpoints.
5. Staff/moderator может видеть все statuses в admin/moderation endpoints.
6. Если approved product ссылается на pending brand, public fallback должен скрыть brand или использовать approved fallback.

---

## Последствия

- Serializers/querysets должны фильтровать nested resources отдельно от `BaseProduct.status`.
- GMC adapter обязан использовать только public-safe brand/media/documents.
- Moderation UI должен показывать status nested resources и rejection reason.
- Public API не должен раскрывать `reserved_quantity`, draft payloads или enrichment source data.

---

## Acceptance criteria

- Public product detail не содержит pending/rejected media, documents, brands.
- GMC feed не содержит pending/rejected brand/media.
- Seller endpoint показывает seller-owned pending resources.
- Admin/moderation видит полный набор statuses.
- Draft/enrichment raw payload не попадает в public responses.

---

## Не делаем сейчас

- Не добавляем moderation actions.
- Не меняем public serializers.
- Не создаем новые status fields.
