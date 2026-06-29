# Task 035 — Гео-определение страны + market-bootstrap + авто-язык для Чехии

**Priority:** P1
**Complexity:** Medium
**Status:** Planned
**ADR:** `docs/tasks/031-multi-currency-pricing-fx/adr-pricing-and-fx-policy.md`
**Зависит от:** 031 (поле `currency`, `get_display_currency`), 034 (formatMoney)

> Исполнитель: агент Cursor, модель **Composer 2.5 Fast**.
> Инфра-часть (Cloudflare/nginx) требует прокси перед сайтом — см. ограничения.
> Прочитать «Заметки для агента-исполнителя» в конце.

---

## Цель

Автоматически подбирать рынок по стране визитёра: **Чехия → язык `cs`(`cz`) + валюта CZK**,
**остальные → английский + EUR**, с возможностью ручного override. Передавать выбранную
валюту в API, чтобы backend (031) отдавал цены в нужной валюте.

## Контекст

- Гео-заголовка сейчас нет; nginx не пробрасывает страну
  (`Frontend/nginx/default.conf`).
- Язык хранится в `localStorage` (`i18nextLng`), дефолт `en`
  (`Frontend/Frontend3/language/i18next.js`); ресурс чешского под ключом `cz`.
- Переключатель языка уже есть (`ChangeLang`, `CookieLangToggle`).
- Валюта показа на backend определяется `get_display_currency(request)` (031):
  query `?currency=` или header `X-Display-Currency`, дефолт `CZK`.

## Scope (область)

**Backend:**
- `backend/product/market_views.py` (новый) — `MarketBootstrapView`
  (GET `/api/market/bootstrap/`) → `{ country, market, language, currency,
  supported_currencies }`. Страна — из заголовка `CF-IPCountry`/`X-Country`
  (fallback: `Accept-Language` → иначе дефолт).
- `backend/product/urls.py` — зарегистрировать маршрут.
- `backend/product/test_market_bootstrap.py` (новый) — тесты резолва страны→рынка.

**Infra (только если Cloudflare/прокси уже перед сайтом):**
- `Frontend/nginx/default.conf` — на `location /api` добавить
  `proxy_set_header CF-IPCountry $http_cf_ipcountry;` (и/или `X-Country`).

**Frontend3:**
- `Frontend/Frontend3/src/api/marketApi.js` (новый) — вызов bootstrap.
- bootstrap-логика при первом визите (в `src/main.jsx` или корневом провайдере):
  если нет ручного override → выставить язык (`cz` для CZ, иначе `en`) и валюту
  (CZK/EUR), сохранить в `localStorage`.
- API-клиент (axios-инстанс Frontend3) — добавить заголовок `X-Display-Currency`
  с выбранной валютой ко всем запросам каталога.
- `language/i18next.js` — авто-инициализация языка от bootstrap (с сохранением override).

**Не редактировать другие файлы.**

## Не входит в задачу

- ❌ Переименование ресурса i18n `cz`→`cs` (отдельный backlog; используем текущий `cz`).
- ❌ URL-префиксы локалей (`/cs/`, `/en/`) и SEO-роутинг — отдельная задача.
- ❌ Логика цен/курса/оплаты (031–033) и формат (034).
- ❌ Развёртывание Cloudflare; если прокси нет — nginx-часть откладывается (см. риски).
- ❌ Frontend2.

## Зависимости

- 031 (поле `currency`, `get_display_currency`), 034 (`formatMoney`).
- Наличие Cloudflare/прокси, проставляющего `CF-IPCountry` (для гео по IP).

## Риски

- **Нет CDN-гео:** без Cloudflare заголовка `CF-IPCountry` не будет. Тогда
  fallback: `Accept-Language` (ненадёжно) → дефолт. Гео-по-IP на backend (GeoIP) —
  отдельный backlog, в этой задаче не вводим.
- **Override-приоритет:** user override (cookie/localStorage) > гео > дефолт.
  Нельзя перетирать ручной выбор пользователя автоопределением.
- **VPN/путешественники:** неизбежные ошибки гео — решаются ручным переключателем.
- **Рассинхрон валюты:** заголовок `X-Display-Currency` должен идти на запросы
  каталога, иначе backend вернёт дефолт CZK при ожидании EUR.
- **Дубли запросов/мерцание языка:** bootstrap вызывать один раз, до первичного рендера цен.

## Definition of Done

- [ ] `GET /api/market/bootstrap/` возвращает страну/рынок/язык/валюту; CZ→`cz`+CZK,
      иначе `en`+EUR; покрыто тестами (мок заголовка страны).
- [ ] Frontend при первом визите без override выставляет язык и валюту по bootstrap.
- [ ] Ручной override (ChangeLang/переключатель) имеет приоритет и сохраняется.
- [ ] API-запросы каталога несут `X-Display-Currency`; цены приходят в нужной валюте.
- [ ] (если есть прокси) nginx пробрасывает `CF-IPCountry` в backend.
- [ ] Backend-тесты зелёные (`pytest product`); Frontend `npm run test`/`lint` зелёные.
- [ ] Документация: чекбоксы + evidence; зафиксировать ограничение про Cloudflare.

---

# Iterations

## Iteration 1 — Analysis (read-only)
- Прочитать `i18next.js`, `ChangeLang`/`CookieLangToggle`, axios-инстанс Frontend3,
  `main.jsx`, `nginx/default.conf`, `product/urls.py`.
- Уточнить, где централизованно живёт выбранная валюта/язык и куда добавить header.
- [ ]

## Iteration 2 — Backend bootstrap (tests-first)
- `test_market_bootstrap.py`: `CF-IPCountry: CZ`→`{language:"cz",currency:"CZK"}`;
  другое/пусто→`{language:"en",currency:"EUR"}`; невалидное→дефолт.
- Реализовать `MarketBootstrapView` + маршрут; тесты зелёные.
- [ ]

## Iteration 3 — Frontend bootstrap + currency header
- `marketApi.js` + вызов при первом визите (учитывая override).
- Выставление языка (i18n) и валюты; запись в `localStorage`.
- Добавить `X-Display-Currency` в axios-инстанс каталога.
- [ ]

## Iteration 4 — Infra (nginx) — опционально
- Если есть Cloudflare/прокси: добавить `proxy_set_header CF-IPCountry ...` в `/api`.
- Иначе — задокументировать как предусловие и пропустить.
- [ ]

## Iteration 5 — Validation & Docs
- [ ] `cd backend && pytest product -q`.
- [ ] Frontend3 `npm run test` / `npm run lint`.
- [ ] Проверить приоритет override и формат цен по валюте.
- [ ] Evidence + ограничение про CDN зафиксированы.
- [ ]

---

## Результаты выполнения (evidence)
_Заполняется исполнителем._

## Привязка к коду
| Тип | Файлы |
|-----|-------|
| **Backend endpoint** | `backend/product/market_views.py`, `backend/product/urls.py` |
| **Backend тесты** | `backend/product/test_market_bootstrap.py` |
| **Infra** | `Frontend/nginx/default.conf` (если есть прокси) |
| **Frontend** | `Frontend/Frontend3/src/api/marketApi.js`, `src/main.jsx`, axios-инстанс, `language/i18next.js` |
| **Reference (не меняем)** | `product/services/pricing.py` (`get_display_currency`) |

## Заметки для агента-исполнителя (Composer 2.5 Fast)
1. **Только файлы из Scope.** Цены/курс/оплату/формат не трогать (031–034).
2. **Override приоритетнее гео** — не перетирать ручной выбор пользователя.
3. **Bootstrap один раз**, до первичного показа цен; не плодить запросы/мерцание.
4. **`X-Display-Currency`** обязательно добавить к запросам каталога, иначе цены не совпадут.
5. **Ресурс i18n остаётся `cz`** (переименование в `cs` — отдельный backlog).
6. **nginx-часть — только при наличии Cloudflare/прокси**; иначе задокументировать предусловие.
7. **Гео в тестах** мокать заголовком; реального гео-сервиса не вводить.
8. Идти 1→5, чекбокс + evidence после каждой итерации; читать файл целиком перед правкой.
9. Соблюдать `020-frontend-react` (не ломать роутинг/стейт/интеграции), `040-security`.
