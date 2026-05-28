# Task 021 — CI Annotations: 25 ESLint / Actions warnings

## Статус

**Отложено (Deferred)** — **P3**, не срочно. CI проходит (exit 0); предупреждения видны в GitHub Actions → **Annotations**, не блокируют merge.

**Источник:** успешный run [`26511955245`](https://github.com/pavelchamgl/reli.one/actions/runs/26511955245) (май 2026), 25 warnings.

## Цель

Убрать шум в **Annotations** CI: довести до **0 warnings** в отображаемом наборе (или осознанно подавить с документированной причиной), не меняя продуктовое поведение.

## Контекст

После фикса ESLint **errors** в Frontend3 (`react/no-unknown-property`) job `frontend3` зелёный. В `.eslintrc.cjs` (Frontend2/3) многие правила в режиме **`warn`**, поэтому `npm run lint` завершается с кодом 0, но GitHub всё равно показывает предупреждения как annotations.

Локально в репозитории существенно больше warnings (Frontend2 ~132, Frontend3 ~696) — **в scope этой задачи только 25**, попавших в annotations успешного CI run (см. инвентарь ниже). Массовый lint-cleanup всего Frontend3 — **отдельный backlog**, не блокер.

## Инвентарь (25 warnings)

| # | Job / область | Файл | Правило / тип | Кол-во |
|---|---------------|------|---------------|--------|
| A | `backend`, `frontend2`, `frontend3`, `e2e_frontend3`, `e2e_fullstack` | — | GitHub: *Node.js 20 actions are deprecated* (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/setup-python@v5`) | **5** |
| B | `frontend2` | `Frontend/Frontend2/src/App.jsx` | `no-unused-vars` (неиспользуемые импорты: Domu, Proc_Zrovna_Me, News, Footer, Vacancies, NewKontakt, ChangeLang) | **7** |
| B | `frontend2` | `Frontend/Frontend2/src/api/index.js` | `no-useless-catch` | **1** |
| B | `frontend2` | `Frontend/Frontend2/src/blocks/AskedQuestions/AskedQuestions.jsx` | `react/jsx-key` | **1** |
| B | `frontend2` | `Frontend/Frontend2/src/blocks/FocusOnBussines/FocusOnBuss.jsx` | `react/jsx-key` | **1** |
| C | `frontend3` | `Frontend/Frontend3/playwright.config.js` | `no-undef` (`process`) | **5** |
| C | `frontend3` | `Frontend/Frontend3/e2e/fullstack-checkout-payment-session.spec.js` | `no-undef` (`process`) | **1** |
| C | `frontend3` | `Frontend/Frontend3/e2e/fullstack-payment-confirmation.spec.js` | `no-undef` (`process`), `no-empty` | **2** |
| C | `frontend3` | `Frontend/Frontend3/e2e/fullstack-seller-onboarding.spec.js` | `no-undef` (`process`, `Buffer`) | **2** |

**Проверка локально (май 2026):**

```bash
cd Frontend/Frontend2 && npx eslint src/App.jsx src/api/index.js \
  src/blocks/AskedQuestions/AskedQuestions.jsx src/blocks/FocusOnBussines/FocusOnBuss.jsx
# → 10 warnings

cd Frontend/Frontend3 && npx eslint playwright.config.js e2e/fullstack-*.spec.js
# → 10 warnings
# + 5 platform warnings в GitHub UI ≈ 25
```

## Scope (область)

- `.github/workflows/ci.yml` — при необходимости обновление actions / runner (группа **A**).
- `Frontend/Frontend2` — точечные правки перечисленных файлов (группа **B**).
- `Frontend/Frontend3` — ESLint `overrides` для Node/Playwright (`e2e/**`, `playwright.config.js`) и/или правки spec (группа **C**).

## Не входит в задачу

- Перевод всех ~696 warnings Frontend3 в errors или массовый autofix по `src/`.
- Перевод всех ~132 warnings Frontend2 в errors.
- Ужесточение ESLint rules repo-wide без отдельного решения.
- Изменение бизнес-логики, API, маршрутизации, e2e-сценариев (кроме noop для `no-empty`).

## Зависимости

- **002** (Testing Foundation) — CI уже есть; задача **не** блокирует **002**.
- Нет зависимости от **013**, **018**, **020**.

## Риски

- Слепое удаление импортов в `App.jsx` Frontend2 может сломать будущий роутинг — сверить с `main.jsx` / routes перед удалением.
- `eslint env: node` для e2e без `globals` для `Buffer` — предупреждение останется.
- Обновление GitHub Actions может потребовать смены `node-version` / кэша — прогнать все jobs CI.

## Рекомендуемый порядок (когда возьмёте в работу)

### Iteration 1 — Quick wins (группы B + C)

1. **Frontend2:** удалить или использовать неиспользуемые импорты в `App.jsx`; добавить `key` в map; упростить `try/catch` в `api/index.js`.
2. **Frontend3:** в `.eslintrc.cjs` добавить override:

   ```js
   { files: ['playwright.config.js', 'e2e/**/*.js'], env: { node: true } }
   ```

   Для `Buffer` — `/* global Buffer */` или `globals` в override.
3. **fullstack-payment-confirmation.spec.js:535** — заменить пустой `catch {}` на комментарий + `void 0` / явный noop с пояснением.

### Iteration 2 — CI platform (группа A)

1. Следить за [GitHub changelog](https://github.blog/changelog/) по Node 24 / deprecation Node 20 для actions.
2. Обновить `actions/checkout`, `actions/setup-node`, `actions/setup-python` до версий, рекомендованных GitHub, когда стабильно на Node 24 runner.
3. Перепрогнать workflow: `backend`, `frontend2`, `frontend3`, `e2e_frontend3`, `e2e_fullstack`.

## Definition of Done

- [ ] GitHub Actions run на `develop` (или PR): **Annotations → 0 warnings** (или документированное исключение с `eslint-disable-next-line` + комментарий «почему»).
- [ ] `npm run lint` в Frontend2 и Frontend3 — без регрессии (0 errors).
- [ ] E2E jobs (`e2e_frontend3`, `e2e_fullstack`) зелёные после изменений.
- [ ] В `task.md` зафиксирована ссылка на проходящий run (ID) как evidence.

## Связанные документы

- [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml)
- [`Frontend/Frontend2/.eslintrc.cjs`](../../../Frontend/Frontend2/.eslintrc.cjs) — комментарий *parity with Frontend3 — warn until dedicated lint-cleanup*
- [`Frontend/Frontend3/.eslintrc.cjs`](../../../Frontend/Frontend3/.eslintrc.cjs)
- [Frontend3 roadmap](../../frontend/frontend3-roadmap.md) — Phase 3 «отложено»

---

*Создано: май 2026. Не входит в P0/P1/P2 roadmap; брать после стабилизации продукта или в «тихий» спринт техдолга.*
