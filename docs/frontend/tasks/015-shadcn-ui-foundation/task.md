# FE-015 — Tailwind + shadcn/ui Foundation (Frontend3)

**Status:** Done  
**Priority:** P0  
**Phase:** 5 — UI migration  
**Depends on:** FE-006 (refactoring foundation Done)  
**Blocks:** FE-016 … FE-021

## Цель

Подключить **Tailwind CSS** и **shadcn/ui** в `Frontend/Frontend3` параллельно с существующими MUI + SCSS, не ломая текущие экраны и CI.

## Контекст

Пилот миграции UI начинается с seller onboarding. Без общего foundation (tokens, `components/ui`, alias `@/`) каждый PR будет дублировать конфиг и стили. `Frontend2` уже использует Tailwind 3, но **не является source of truth** для магазина — конфиг делаем в Frontend3 отдельно.

## Scope

- Tailwind + PostCSS в `Frontend/Frontend3`.
- shadcn/ui init (`components.json`, path alias `@/` → `src/`).
- **JS/JSX only:** `components.json` с `"tsx": false` (или эквивалент CLI `--no-typescript`); все shadcn-компоненты — `.jsx`, без новых `.tsx` в `Frontend/Frontend3`.
- Базовые primitives: `Button`, `Input`, `Label`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Card`, `Dialog`, `Alert`, `Badge`, `Separator`, `Skeleton`, `Toast`/`Sonner` (один вариант — зафиксировать в PR).
- Utility `src/lib/utils.js` с `cn()` (clsx + tailwind-merge).
- CSS variables для light theme (dark — optional backlog).
- Документировать coexistence: MUI остаётся до FE-021 в onboarding-зоне.

## Не входит в задачу

- Миграция любых production-экранов.
- Удаление MUI из `package.json`.
- Изменение логики `main.jsx`, роутов, Redux, API (**допустимо:** один import `./styles/tailwind-shadcn.css` для подключения Tailwind/shadcn CSS).
- Frontend2.

## Зависимости

- Node 20 (как в CI).
- Vite 5 + React 18 (текущие версии Frontend3).

## Риски

| Риск | Митигация |
|------|-----------|
| Конфликт глобальных стилей SCSS vs Tailwind preflight | **Стартовое решение: `corePlugins: { preflight: false }`** в `tailwind.config.js`. В `src/index.css` уже есть глобальные правила для `body`, `button`, `h1`, `a` — preflight on даёт высокий риск регресса. Включение preflight — отдельный follow-up PR после smoke всех ключевых экранов |
| Рост bundle | tree-shaking shadcn; не импортировать всю библиотеку |
| ESLint на новые alias | обновить eslint/import resolver при необходимости |

## Definition of Done

- [x] `npm run dev` — приложение открывается, старые страницы без визуального регресса на smoke-проверке (home, seller login).
- [x] `npm run build` — успех.
- [x] `npm run test` — 169/169, без регрессий (+2 теста Button).
- [x] **JSX mode:** новых `.tsx` нет; `components.json` — `tsx: false`; shadcn components — `.jsx`.
- [x] **Tailwind preflight:** `corePlugins: { preflight: false }` (конфликт с legacy `src/index.css` globals).
- [x] Unit-тест: `src/components/ui/button.test.jsx`.
- [x] Tailwind `^3.4.17`, alias `@` → `src`, Sonner для toast.
- [x] Компоненты: button, input, label, textarea, select, checkbox, radio-group, card, dialog, alert, badge, separator, skeleton, sonner.

## Implementation notes (май 2026)

| Артефакт | Путь |
|----------|------|
| Tailwind + PostCSS | `tailwind.config.js`, `postcss.config.js` |
| shadcn config | `components.json`, `jsconfig.json` |
| CSS variables + directives | `src/styles/tailwind-shadcn.css` (import в `main.jsx`) |
| `cn()` | `src/lib/utils.js` |
| UI primitives | `src/components/ui/*.jsx` (git path lowercase; на macOS FS может отображаться как `Components/ui`, в индексе — `components/ui`) |
| Toast | `sonner` via `components/ui/sonner.jsx` |

### Path casing (follow-up)

Изначально файлы попали в `src/Components/ui/` (конфликт с legacy `src/Components/`). Исправлено через `git mv` → **`src/components/ui/`** в индексе git для Linux/CI. Импорт: `@/components/ui/button`.

### shadcn CLI

Интерактивный `npx shadcn@latest init` не использовался (CLI завис на выборе библиотеки). Foundation собран **вручную** по эквиваленту `components.json` (style: new-york, `tsx: false`, cssVariables) и registry-компонентам shadcn в `.jsx`.

### Dev / preview smoke (2026-05-27)

| Команда | Результат |
|---------|-----------|
| `npm run test:e2e:dev:fe015` | 2/2 — `/` (#root mount), `/seller/login` (email + password) на **vite dev :5173** |
| `npm run build && npm run test:e2e -- e2e/fe015-foundation-smoke.spec.js` | 2/2 на **vite preview :4173** |

Артефакты: `e2e/fe015-foundation-smoke.spec.js`, `playwright.dev.config.js`, script `test:e2e:dev:fe015`.

---

# Iterations

## Iteration 1 — Analysis

### Цель

Зафиксировать текущие глобальные стили и точки входа CSS.

### Действия

1. Прочитать `Frontend/Frontend3/vite.config.js`, entry CSS/SCSS (часто `main.jsx` import).
2. Зафиксировать глобальные правила в `src/index.css` (`body`, `button`, `h1`, `a`) — конфликт с Tailwind preflight.
3. Сверить с `Frontend/Frontend2/tailwind.config.js` — **не копировать слепо**, только идеи (content paths).

### Output

- **`preflight: false`** — конфликт с legacy globals в `src/index.css` (не импортируется в runtime; globals живут в `App.css` + SCSS-модулях).
- Entry CSS для Tailwind: **`src/styles/tailwind-shadcn.css`** (не `index.css`).

### Статус

- [x]

---

## Iteration 2 — Tooling setup

### Цель

Установить зависимости и конфиги без изменения UI.

### Действия

1. `npm install -D tailwindcss postcss autoprefixer` (версии совместимые с Vite 5).
2. Создать `tailwind.config.js` с **`corePlugins: { preflight: false }`**, `postcss.config.js`.
3. Добавить `@tailwind base/components/utilities` в entry CSS (новый `src/index.css` или существующий).
4. Настроить alias `@` → `./src` в `vite.config.js`.
5. shadcn init **вручную** (эквивалент CLI): `components.json`, CSS variables, alias `@/` — см. Implementation notes.

### Output

- Файлы конфигурации в `Frontend/Frontend3/`.

### Статус

- [x]

---

## Iteration 3 — Base components

### Цель

Добавить минимальный набор shadcn primitives для onboarding.

### Действия

1. Компоненты добавлены **вручную** по shadcn registry (`.jsx`), список см. DoD — эквивалент `shadcn add …`.
2. Создать `src/lib/utils.js` с `cn()`.
3. Проверить, что компоненты импортируются как `@/components/ui/button` и файлы имеют расширение `.jsx`, не `.tsx`.

### Output

- `src/components/ui/*`
- `components.json`

### Статус

- [x]

---

## Iteration 4 — Validation

### Цель

Убедиться, что foundation не ломает CI.

### Действия

```bash
cd Frontend/Frontend3
npm run lint
npm run test
npm run build
```

Ручной smoke: `/`, `/seller/login` — layout не «поехал».

```bash
npm run test:e2e:dev:fe015    # vite dev :5173
npm run build
npm run test:e2e -- e2e/fe015-foundation-smoke.spec.js   # preview :4173
```

### Статус

- [x]

---

## Файлы (ожидаемые изменения)

| Файл | Действие |
|------|----------|
| `Frontend/Frontend3/package.json` | devDeps + radix/shadcn deps |
| `Frontend/Frontend3/tailwind.config.js` | create |
| `Frontend/Frontend3/postcss.config.js` | create |
| `Frontend/Frontend3/components.json` | create |
| `Frontend/Frontend3/vite.config.js` | alias `@` |
| `Frontend/Frontend3/src/styles/tailwind-shadcn.css` | Tailwind directives + shadcn CSS vars |
| `Frontend/Frontend3/e2e/fe015-foundation-smoke.spec.js` | Dev/preview smoke |
| `Frontend/Frontend3/playwright.dev.config.js` | Playwright vs vite dev :5173 |
| `Frontend/Frontend3/src/lib/utils.js` | create |
| `Frontend/Frontend3/src/components/ui/*` | create |

## Agent prompt (для Cursor)

```text
Task FE-015: Add Tailwind + shadcn/ui foundation to Frontend/Frontend3 only.
Do not migrate seller pages yet. Do not remove MUI.
Use tailwind.config.js with corePlugins.preflight = false (conflict with src/index.css globals).
shadcn: JS/JSX only — components.json tsx false, no new .tsx files.
Follow docs/frontend/tasks/015-shadcn-ui-foundation/task.md iterations 1-4.
After changes run lint, test, build.
```
