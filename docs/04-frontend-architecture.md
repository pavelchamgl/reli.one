# 04. Frontend Architecture

## Состав фронтендов

| Директория | Назначение | URL |
|------------|------------|-----|
| `Frontend/Frontend3/` | Основной магазин (покупатели + продавцы) | https://reli.one |
| `Frontend/Frontend2/` | TODO: уточнить назначение | https://info.reli.one |

> TODO: Есть ли `Frontend/Frontend1/`? Если нет — убрать из docker-compose.

## Frontend3 — Основной магазин

### Стек

| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 18 | UI |
| Vite | 5 | Сборщик |
| Redux Toolkit | — | Стейт-менеджмент |
| redux-persist | — | Сохранение корзины/оплаты |
| Axios | — | HTTP-клиент |
| MUI (Material UI) | — | Компонентная библиотека |
| i18next | — | Интернационализация |
| React Router | — | Роутинг |

### Структура

```
Frontend/Frontend3/src/
├── api/              # Axios-инстансы и методы по доменам
│   ├── index.js      # mainInstance, formDataInstance, BaseURL
│   ├── payment.js
│   ├── productsApi.js
│   └── …
├── analytics/        # TODO: описать события
├── code/             # TODO: уточнить назначение (test.js — удалить PII)
├── redux/            # Store, slices, persist-конфиг
│   ├── index.js
│   ├── commentSlice.js
│   └── …
├── ui/               # Переиспользуемые UI-компоненты
├── pages/            # TODO: перечислить страницы
└── …
```

### Стейт-менеджмент

Redux Toolkit + redux-persist. Сохраняются слайсы: `basket`, `payment`, `edit_goods`.

> TODO: Описать остальные слайсы.

### HTTP-клиент

`BaseURL = "https://reli.one/api"` — задан в `src/api/index.js`.

Два инстанса:
- `mainInstance` — JSON, с Authorization Bearer
- `formDataInstance` — multipart/form-data

Refresh-логика: при 401 — запрос на `/api/accounts/token/refresh/`, повтор оригинального запроса.

> TODO: Описать обработку ошибок (ErrToast).

### Интернационализация

> TODO: Какие языки поддерживаются? Где лежат переводы?

### Роутинг

> TODO: Перечислить основные маршруты (публичные / приватные / seller-only).

---

## Frontend2 — Landing / Info

> TODO: Описать назначение, стек, маршруты.

---

## Сборка и деплой

Статика собирается в Docker multi-stage (`npm run build`), раздаётся через Nginx из `/data/www/`.

> TODO: Описать переменные окружения фронтенда (VITE_* и т.д.).
