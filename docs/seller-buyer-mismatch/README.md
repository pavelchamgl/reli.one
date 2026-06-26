# Инструкция: покупатель → продавец

Материалы для email-рассылки пользователям, которые зарегистрировались как покупатели, но хотят продавать на Reli.one.

## Содержимое

| Язык | PDF | HTML |
|------|-----|------|
| RU | `pdf/ru/*.pdf` | `pdf/ru/*.html` |
| EN | `pdf/en/*.pdf` | `pdf/en/*.html` |
| CZ | `pdf/cz/*.pdf` | `pdf/cz/*.html` |

| Файл | Назначение |
|------|------------|
| `01-novaya-registraciya-prodavca-{ru,en,cz}.pdf` | Новая регистрация продавца + онбординг |
| `02-uzhe-est-akkaunt-pokupatelya-{ru,en,cz}.pdf` | Действия при существующем аккаунте покупателя |
| `03-vykladka-tovarov-{ru,en,cz}.pdf` | Создание и модерация товаров |
| `email/seller-buyer-mismatch-email.{html,txt}` | Шаблон письма (RU, короткая версия) |
| `email/seller-buyer-mismatch-email-en.{html,txt}` | Шаблон письма (EN, короткая версия) |
| `email/seller-buyer-mismatch-email-cz.{html,txt}` | Шаблон письма (CZ, короткая версия) |
| `screenshots/en/` | Скриншоты UI на английском (RU и EN PDF) |
| `screenshots/cz/` | Скриншоты UI на чешском (CZ PDF) |

## Регенерация

Требуется запущенный frontend (`npm run dev` на порту 5173).

```bash
cd Frontend/Frontend3

# 1. Скриншоты (Playwright)
npm run docs:seller-screenshots          # en + cz
DOCS_LOCALE=en npm run docs:seller-screenshots   # только en
DOCS_LOCALE=cz npm run docs:seller-screenshots   # только cz

# 2. PDF из HTML (ru, en, cz)
npm run docs:seller-pdf
```

Переменные:
- `SCREENSHOT_BASE_URL` — базовый URL dev-сервера (по умолчанию `http://127.0.0.1:5173`)
- `DOCS_LOCALE` — `en`, `cz`/`cs` или `all` (по умолчанию)

## Отправка письма

1. Откройте шаблон нужного языка: `email/seller-buyer-mismatch-email{,-en,-cz}.{html,txt}`.
2. Замените `{{recipient_name}}` / `{{RECIPIENT_NAME}}` на имя получателя (или удалите плейсхолдер).
3. Приложите три PDF того же языка из `pdf/ru/`, `pdf/en/` или `pdf/cz/`.
4. Тема письма:
   - RU: `Reli.one — как начать продавать, если вы зарегистрировались как покупатель`
   - EN: `Reli.one — how to start selling if you registered as a buyer`
   - CZ: `Reli.one — jak začít prodávat, pokud jste se zaregistrovali jako kupující`

## Примечание

Скриншоты сняты с локального Frontend3. Страницы онбординга и каталога продавца используют моки API там, где требуется авторизация. Публичные страницы (регистрация, вход) — без моков. Страница удаления аккаунта (`/delete-my-data`) в UI пока только на английском — в чешском PDF используется тот же скрин.

HTML лежит в `pdf/{locale}/`, скриншоты — в `screenshots/{locale}/`, поэтому в HTML используется путь `../../screenshots/...`.
