# FE-021 — Seller Onboarding Migration: Validation & MUI Cleanup

**Status:** Planned  
**Priority:** P1  
**Phase:** 5 — UI migration  
**Depends on:** FE-020  
**Blocks:** следующая волна (catalog/checkout UI)

## Цель

Закрыть пилот onboarding: **регрессионная валидация**, удаление MUI/SCSS из мигрированной зоны, синхронизация документации.

## Контекст

После FE-018–FE-020 в проекте временно coexist MUI + shadcn. FE-021 — контролируемая зачистка и фиксация результата для следующих волн миграции.

## Scope

- Audit импортов `@mui/*` и SCSS **только в onboarding-зоне** (см. список путей ниже и [seller-onboarding-ui-inventory.md](../../seller-onboarding-ui-inventory.md#onboarding-page-paths-scope-для-fe-021-grep)).
- Удаление неиспользуемых `*.module.scss` в мигрированной зоне.
- Bundle check: `npm run build` — сравнить размер seller onboarding chunks (до/после — в PR description).
- Обновление docs:
  - [04-frontend-architecture.md](../../../04-frontend-architecture.md) — UI stack note for onboarding
  - [shadcn-ui-migration-plan.md](../../shadcn-ui-migration-plan.md) — статус пилота Done
  - [seller-onboarding-ui-inventory.md](../../seller-onboarding-ui-inventory.md) — final column «Migrated»
- Расширение [test-matrix.md](../../test-matrix.md) — финальные статусы UI migration gates.

## Не входит в задачу

- Удаление MUI из всего Frontend3 (catalog, checkout, basket).
- Frontend2 migration.
- Redux/slice refactor.

## Зависимости

- FE-020 complete.
- CI: `frontend3`, `e2e_frontend3`, optional `e2e_fullstack`.

## Риски

| Рisk | Mitigation |
|------|------------|
| Удалили MUI, но date picker ещё зависит | grep `@mui` before merge |
| SCSS удалён, но class используется | grep `.module.scss` imports |

## Definition of Done

- [ ] `grep -R "@mui" src/Components/Seller/auth` → 0 results (or documented exceptions).
- [ ] `grep -R "@mui"` по **17 onboarding page dirs** из inventory (не весь `sellerPages/`) → 0 (or documented exceptions).
- [ ] All P0 onboarding tests green (matrix + e2e).
- [ ] Docs updated (04, plan, inventory, test-matrix).
- [ ] Follow-up backlog для catalog/checkout UI wave documented in shadcn plan.

---

# Iterations

## Iteration 1 — Import & SCSS audit

### Действия

```bash
cd Frontend/Frontend3

# Onboarding auth components
rg "@mui" src/Components/Seller/auth

# Onboarding pages only — NOT NewSellerOrder*, NOT pages/Seller*
rg "@mui" \
  src/sellerPages/SellerLogin \
  src/sellerPages/SellerReset \
  src/sellerPages/SellerSuccessfullyReset \
  src/sellerPages/SellerVerifyEmail \
  src/sellerPages/SellerCreateNewPass \
  src/sellerPages/SellerTypePage \
  src/sellerPages/SellerCreateAccount \
  src/sellerPages/CreateVerifyEmail \
  src/sellerPages/ApplicationSubmited \
  src/sellerPages/SellerInformation \
  src/sellerPages/SellerCompanyInfo \
  src/sellerPages/ReviewInfoPage \
  src/sellerPages/SellerReviewCompany \
  src/sellerPages/FinishVerificationPage \
  src/sellerPages/ActionRequiredPage \
  src/sellerPages/UnderReviewPage \
  src/sellerPages/VerifiedAnalyt

rg "\.module\.scss" src/Components/Seller/auth \
  src/sellerPages/SellerLogin \
  src/sellerPages/SellerReset \
  src/sellerPages/SellerSuccessfullyReset \
  src/sellerPages/SellerVerifyEmail \
  src/sellerPages/SellerCreateNewPass \
  src/sellerPages/SellerTypePage \
  src/sellerPages/SellerCreateAccount \
  src/sellerPages/CreateVerifyEmail \
  src/sellerPages/ApplicationSubmited \
  src/sellerPages/SellerInformation \
  src/sellerPages/SellerCompanyInfo \
  src/sellerPages/ReviewInfoPage \
  src/sellerPages/SellerReviewCompany \
  src/sellerPages/FinishVerificationPage \
  src/sellerPages/ActionRequiredPage \
  src/sellerPages/UnderReviewPage \
  src/sellerPages/VerifiedAnalyt
```

Полный список путей — в [seller-onboarding-ui-inventory.md](../../seller-onboarding-ui-inventory.md#onboarding-page-paths-scope-для-fe-021-grep).

Список exceptions (если есть) → inventory.

### Output

- Checklist в PR.

### Статус

- [ ]

---

## Iteration 2 — Cleanup PRs

### Действия

1. Remove dead SCSS modules.
2. Remove unused MUI deps **only if** not used elsewhere in Frontend3 (likely keep `@mui/material` for rest of app).
3. Consolidate duplicate seller onboarding styles into Tailwind utilities.

### Статус

- [ ]

---

## Iteration 3 — Full regression

### Действия

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

Manual QA script (local/staging):

1. Seller register → seller-type → fill minimal draft → review → submit (test seller).
2. Rejected flow → action-required → edit → resubmit.
3. Approved → verified-analyt → link to seller-home.

### Статус

- [ ]

---

## Iteration 4 — Documentation & handoff

### Действия

1. Mark FE-015…FE-021 Done in [tasks/README.md](../README.md).
2. Add «Wave 2» section in [shadcn-ui-migration-plan.md](../../shadcn-ui-migration-plan.md): catalog, basket, checkout priority proposal.
3. Optional ADR: `docs/adr/NNN-shadcn-ui-onboarding-pilot.md` — **только если команда использует ADR folder**.

### Статус

- [ ]

---

## Wave 2 backlog (proposal, не реализовать в FE-021)

| Area | Priority | Rationale |
|------|----------|-----------|
| Catalog / Search | P1 | high traffic, lower business risk than payment |
| Basket | P0 | depends on checkout |
| Checkout / Payment | P0 | last; max e2e coverage already exists |
| Seller cabinet (orders/goods) | P2 | after onboarding pattern proven |

## Suggested commit

```
docs(frontend): complete seller onboarding shadcn migration validation
```
