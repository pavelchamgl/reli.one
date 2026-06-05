# ADR 08 — Backup и reversibility policy для data migrations

**Статус:** принято для следующих итераций  
**Дата:** 2026-06-05  
**Scope:** product catalog modernization, data migrations, rollback  
**Связанные итерации:** 4, 10

---

## Контекст

Будущие итерации будут переносить legacy data:

- `BaseProductImage` -> `ProductMedia`;
- `LicenseFile` -> `ProductDocument`;
- `ProductParameter` -> typed attributes;
- legacy cleanup после compatibility-релизов.

Эти операции рискованны без backup, dry-run и rollback plan.

---

## Решение

1. Любая data migration должна иметь pre-migration backup step.
2. Перед production run нужен dry-run на копии БД или staging с production-like data.
3. `RunPython` должен иметь reverse code, если reverse безопасен.
4. Если reverse невозможен или опасен, допускается explicit `noop` только с documented restore plan.
5. Destructive cleanup выносится в отдельный релиз после snapshot-compatible периода.

---

## Последствия

- Iteration 4 media migration не запускается без backup/dry-run notes.
- Iteration 10 cleanup не считается готовым без restore plan.
- Rollback strategy фиксируется до deploy, а не после сбоя.

---

## Acceptance criteria

- Migration plan содержит backup step.
- Migration plan содержит dry-run prerequisite.
- Reverse или restore plan описан до production run.
- Destructive cleanup отделен от additive migrations.

---

## Не делаем сейчас

- Не пишем migrations.
- Не выполняем backup.
- Не меняем production data.
