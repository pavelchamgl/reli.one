# Чеклист ops-followup после изменений в репозитории

Документ фиксирует действия **вне git**, которые команда должна выполнить параллельно разработке. Не заменяет полные runbook — только указатели.

## Безопасность и инцидент SEC-1

| Шаг | Документ / задача |
|-----|-------------------|
| Ротация скомпрометированных credentials | [`docs/security-incident-response.md`](../security-incident-response.md), [Task 006](../tasks/006-security-hardening/task.md) |
| Очистка git history (при согласовании) | Тот же документ, Phase 1–4 |

## Эксплуатация и приёмка сред

| Шаг | Документ |
|-----|-----------|
| Прогон деплоя и переменных на staging/prod | [`docs/07-deployment.md`](../07-deployment.md) |
| Мониторинг и алерты | [`docs/operations/monitoring-alerts.md`](monitoring-alerts.md) |
| Backup PostgreSQL и проверка restore | [`docs/operations/database-backup-restore.md`](database-backup-restore.md) |

## После включения Frontend CI-тестов

Убедиться, что в пайплайне сборки фронта для нужной среды задан **`VITE_API_URL`** (или принят fallback из кода), чтобы smoke после деплоя не бил продакшен API случайно.
