# FE-024 — Frontend3 Component Directory Casing Conventions

**Status:** Planned
**Priority:** P2
**Phase:** Technical debt / architecture hygiene
**Depends on:** FE-023
**Blocks:** Large-scale shared UI migration and future component moves

## Цель

Зафиксировать и затем безопасно нормализовать ситуацию, где в `Frontend3/src` одновременно существуют `Components/` и `components/`.

Сейчас это допустимо как переходное состояние, но оно должно быть явно описано, чтобы не ломать сборку на case-sensitive окружениях и не создавать путаницу при дальнейшей миграции UI.

## Текущее состояние

В `Frontend/Frontend3/src` есть два разных каталога:

| Directory | Current role | Examples |
|-----------|--------------|----------|
| `src/Components/` | Legacy app/feature components | seller auth/info blocks, product, basket, header, pages-adjacent UI |
| `src/components/` | New shared primitives and shadcn-style components | `ui/*`, `seller/onboarding/*`, shared onboarding views |

Это возникло во время FE-015...FE-021: shadcn/Tailwind primitives были добавлены в lower-case `components`, а существующая кодовая база исторически использует upper-case `Components`.

## Почему это проблема

### Case-sensitive environments

На macOS проект может работать на case-insensitive filesystem, даже если импорт написан с неправильным регистром. На Linux/CI/deploy это может стать runtime/build failure.

Пример риска:

- файл лежит в `src/components/ui/button.jsx`
- локально случайный импорт через `@/Components/ui/button` может не проявиться
- на Linux такой импорт упадёт, потому что `Components` и `components` — разные пути

### Agent and developer confusion

Новые участники и агенты могут не понять, куда класть новый компонент:

- legacy feature block в `Components`
- shared primitive в `components`
- onboarding view в существующую новую зону
- feature-specific onboarding implementation в legacy seller info block

Без правила легко создать третий стиль структуры или смешать уровни абстракции.

### Risky case-only rename

Массовый rename `Components` → `components` на macOS нельзя делать как обычный case-only rename. Git может не увидеть корректное изменение без промежуточного имени, а большое количество импортов создаёт высокий риск регрессий.

## Decision Until Migration

До выполнения FE-024 действуют такие правила:

1. `src/components/` — только shared primitives, shadcn/ui-compatible components, shared onboarding views and layout primitives.
2. `src/Components/` — legacy feature/app components, пока они не мигрированы отдельной задачей.
3. Новые shared UI primitives добавлять в `src/components/`.
4. Новые изменения в существующих legacy seller/product/basket blocks делать рядом с текущими владельцами в `src/Components/`.
5. Не делать case-only rename в рамках FE-023 или других feature-fix задач.
6. Не смешивать imports одного и того же module path через разные casing variants.

## Scope

- Провести аудит импортов `Components`/`components`.
- Зафиксировать текущую роль каждого каталога в архитектурной документации.
- Выбрать целевую структуру:
  - либо оставить два слоя с formal convention,
  - либо выполнить миграцию к единому lower-case `src/components`.
- Если выбран rename, выполнить его безопасно через промежуточное имя.
- Добавить проверку, которая ловит wrong-case imports до CI/deploy.

## Non-goals

- Не выполнять эту миграцию внутри FE-023.
- Не менять поведение seller onboarding.
- Не менять routing, API, Redux или backend contracts.
- Не переносить feature components без отдельного coverage gate.
- Не использовать задачу как повод для широкой UI-миграции Wave 2.

## Suggested Implementation Plan

### Iteration 0 — Audit

1. Собрать список каталогов верхнего уровня в `Frontend/Frontend3/src`.
2. Собрать все импорты, содержащие `Components` и `components`.
3. Найти wrong-case imports и paths, которые работают только из-за macOS filesystem.
4. Зафиксировать baseline report в этой задаче.

Verification:

- `npm run test`
- `npm run build`
- `git diff --check`

### Iteration 1 — Guardrails

1. Добавить lint/check script для поиска mixed-case imports.
2. Проверка должна падать, если один и тот же conceptual layer импортируется с разным casing.
3. Подключить проверку локально или в CI только после dry-run на текущем дереве.

Verification:

- check script проходит на текущем коде
- `npm run test`
- `npm run build`

### Iteration 2 — Documentation Convention

1. Обновить frontend architecture docs.
2. Добавить правило выбора каталога для новых компонентов.
3. Добавить примеры допустимых импортов:
   - `@/components/ui/button`
   - `@/components/seller/onboarding`
   - `../../Components/Seller/...` for existing legacy owner modules

Verification:

- docs explain why both directories exist
- docs explicitly say that FE-023 must not normalize casing

### Iteration 3 — Optional Rename Migration

Выполнять только если принято решение перейти к одному каталогу.

Safe rename sequence:

1. `git mv Frontend/Frontend3/src/Components Frontend/Frontend3/src/_Components_rename_tmp`
2. `git mv Frontend/Frontend3/src/_Components_rename_tmp Frontend/Frontend3/src/components-legacy` or final agreed target
3. Update imports mechanically.
4. Run full verification before commit.

Preferred target must be decided before implementation. Do not rename to `src/components` until collisions with existing `src/components` are resolved.

Verification:

- `npm run test`
- `npm run build`
- targeted seller onboarding tests
- manual smoke for core pages
- CI on Linux or equivalent case-sensitive environment

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Case-only rename lost by Git/macOS | Broken imports after merge | Use intermediate directory name with `git mv` |
| Huge import churn | Hard review, hidden regressions | Split docs/checks from actual rename |
| Mixed architectural layers | Future migration confusion | Keep explicit ownership convention |
| FE-023 scope creep | Delays onboarding recovery | FE-024 depends on FE-023 and stays separate |

## Definition of Done

- [ ] Baseline import audit is documented.
- [ ] Current convention is documented and linked from frontend docs.
- [ ] Wrong-case import guard is available or explicitly deferred.
- [ ] Decision is made: keep two-layer convention or migrate to a single directory style.
- [ ] If migration is performed, it uses a safe intermediate rename.
- [ ] `npm run test` passes.
- [ ] `npm run build` passes.
- [ ] `git diff --check` passes.
- [ ] No seller onboarding field contract or visual parity work is mixed into this task.

## Recommended Commit Message

```text
docs(frontend3): add component directory casing cleanup task
```
