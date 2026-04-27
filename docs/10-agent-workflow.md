# 10. Agent Workflow

> Инструкции и контекст для AI-агентов (Cursor, Claude и др.), работающих с этим репозиторием.

## Структура проекта — быстрый ориентир

| Что нужно изменить | Где искать |
|--------------------|------------|
| API-эндпоинт | `backend/<app>/views.py` + `<app>/urls.py` |
| Модель БД | `backend/<app>/models.py` → миграция |
| Сериализатор | `backend/<app>/serializers.py` |
| Настройки Django | `backend/backend/settings.py` |
| Env-переменные | `envs/backend.env.example`, затем реальный `envs/backend.env` |
| API-запрос с фронта | `Frontend/Frontend3/src/api/` |
| Redux стейт | `Frontend/Frontend3/src/redux/` |
| UI-компонент магазина | `Frontend/Frontend3/src/` |

## Правила для агентов

### Нельзя без явного разрешения
- Изменять `docker-compose.yml` и `Dockerfile`
- Изменять `backend/backend/settings.py` (особенно security-настройки)
- Добавлять файлы в `envs/` (только `*.example`)
- Делать `git push` или `git push --force`
- Удалять или изменять миграции
- Изменять `nginx/default.conf`

### Обязательно перед коммитом
- Убедиться что в коде нет захардкоженных секретов, токенов, паролей
- Убедиться что в коде нет PII (email, телефон, адрес реального человека)
- Убедиться что новые env-переменные добавлены в `envs/backend.env.example`

### Стиль коммитов

Формат: `<type>(<scope>): <описание>`

Типы: `feat`, `fix`, `refactor`, `security`, `docs`, `chore`, `style`

Примеры из истории:
```
feat(accounts): make phone number optional in registration
fix(onboarding): align company account holder validation
security: remove secrets from repo, restrict CORS and ALLOWED_HOSTS
```

### Добавление новой интеграции
1. Добавить переменные в `envs/backend.env.example`
2. Добавить чтение через `os.getenv()` в `settings.py`
3. Задокументировать в `docs/06-integrations.md`

### Добавление нового Django-приложения
1. Создать через `manage.py startapp`
2. Добавить в `INSTALLED_APPS` в `settings.py`
3. Зарегистрировать URL в `backend/backend/urls.py`
4. Задокументировать в `docs/01-business-domains.md`

## Известные ловушки

- `STRIPE_SECRET_KEY_TEST` объявлен в `envs/backend.env`, но **не** читается в `settings.py` — при обращении к `settings.STRIPE_SECRET_KEY_TEST` будет `AttributeError`
- Миграции исключены из git — после изменения моделей нужно генерировать и применять миграции вручную
- `BaseURL` во фронте захардкожен как `"https://reli.one/api"` — для локальной разработки нужно явно переопределять
- `info.reli.one` проксирует `/admin` на backend — хост должен быть в `ALLOWED_HOSTS`

## Документация

Все значимые архитектурные решения фиксировать в соответствующем файле `docs/`.
Технический долг — в `docs/09-architecture-debt.md`.
