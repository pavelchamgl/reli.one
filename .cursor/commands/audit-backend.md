Perform backend architecture audit.

Use architecture-audit skill.

Scope:
- backend/accounts
- backend/product
- backend/order
- backend/payment
- backend/delivery
- backend/sellers

Do not modify code.

Update:
- docs/03-backend-architecture.md
- docs/09-architecture-debt.md

Focus:
- business logic in views
- services/selectors boundaries
- transactions
- payment webhook idempotency
- order/payment/delivery lifecycle
- seller onboarding lifecycle