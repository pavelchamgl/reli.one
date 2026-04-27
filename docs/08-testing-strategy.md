# 08. Testing Strategy

> TODO: Заполнить по мере появления тестов.

## Текущее состояние

> TODO: Есть ли тесты прямо сейчас? Какое покрытие?

## Пирамида тестирования

```
        ┌─────────────┐
        │   E2E / UI  │  ← TODO
        ├─────────────┤
        │ Integration │  ← TODO
        ├─────────────┤
        │    Unit     │  ← TODO
        └─────────────┘
```

## Backend (Django / DRF)

### Unit-тесты

> TODO: Описать подход, фреймворк (pytest-django / unittest).

**Приоритетные области для покрытия:**
- [ ] `accounts` — регистрация, аутентификация, JWT refresh
- [ ] `order` — создание заказа, смена статусов
- [ ] `payment` — обработка webhook Stripe/PayPal
- [ ] `promocode` — логика применения скидок
- [ ] `delivery` — расчёт стоимости

### Integration-тесты

> TODO: Тесты API-эндпоинтов через DRF `APITestCase` / `APIClient`.

### Фикстуры и тестовая БД

> TODO: Описать подход к тестовым данным. Используется ли SQLite in-memory?

## Frontend (React / Vite)

> TODO: Vitest / Jest / React Testing Library?

**Приоритетные области:**
- [ ] Redux слайсы (корзина, оплата)
- [ ] Axios-интерцепторы (refresh-логика)
- [ ] Компоненты форм (оформление заказа, онбординг)

## E2E

> TODO: Playwright / Cypress?

**Ключевые сценарии:**
- [ ] Регистрация → добавить в корзину → оформить заказ
- [ ] Онбординг продавца
- [ ] Вход через OAuth

## Запуск тестов

```bash
# Backend
# TODO

# Frontend
# TODO
```

## CI

> TODO: Описать как тесты запускаются в pipeline.
