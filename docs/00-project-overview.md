# 00. Project Overview

## Описание

> TODO: Написать 2–3 абзаца о том, что такое Reli.one, для кого и какую проблему решает.

## Цели продукта

> TODO: Перечислить бизнес-цели (например: маркетплейс для европейских продавцов, поддержка чешского/словацкого рынка и т.д.)

## Целевая аудитория

| Роль | Описание |
|------|----------|
| Покупатель | TODO |
| Продавец (Seller) | TODO |
| Администратор | TODO |

## Технологический стек

| Слой | Технология |
|------|------------|
| Backend | Django 5.1, Django REST Framework |
| Frontend (shop) | React 18, Vite 5, Redux Toolkit |
| Frontend (landing) | React 18, Vite 5 |
| База данных | PostgreSQL 17 |
| Хранение медиа | Cloudinary |
| Веб-сервер | Nginx (reverse proxy + TLS) |
| Контейнеризация | Docker, Docker Compose |
| Аутентификация | JWT (dj-rest-auth, simplejwt) |

## Окружения

| Среда | URL | Описание |
|-------|-----|----------|
| Production | https://reli.one | TODO |
| Staging | TODO | TODO |
| Local | http://localhost:8081 | Docker Compose |

## Репозиторий

```
reli.one/
├── backend/          # Django-проект
├── Frontend/
│   ├── Frontend2/    # TODO: уточнить назначение
│   ├── Frontend3/    # Основной магазин
│   └── nginx/        # Конфиг nginx + TLS
├── envs/             # Env-шаблоны (*.example)
├── docs/             # Техническая документация
└── docker-compose.yml
```

## Связанные документы

- [01 — Бизнес-домены](./01-business-domains.md)
- [03 — Архитектура бэкенда](./03-backend-architecture.md)
- [07 — Деплой](./07-deployment.md)
