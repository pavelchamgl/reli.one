# Regression Test Writer Skill

Use this skill when adding tests before refactoring or stabilizing critical flows.

Priorities:
1. Payment webhook idempotency
2. Order creation
3. Delivery calculation
4. Product list/detail/search
5. Auth registration/login
6. Seller onboarding

Rules:
- Mock external providers.
- Avoid real network calls.
- Test current behavior before refactor.
- Prefer clear scenario names.
- Do not overfit tests to implementation details.
- Make tests stable and deterministic.