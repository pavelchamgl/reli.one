# Django Service Refactor Skill

Use this skill when extracting business logic from Django views/serializers into services.

Rules:
1. Preserve API behavior.
2. Preserve request/response format.
3. Do not change models or migrations unless explicitly requested.
4. Extract one business capability at a time.
5. Add tests before or during refactor for critical flows.
6. Keep views thin.
7. Put write/business operations into services.
8. Put complex read queries into selectors.
9. Use transactions for multi-model writes.
10. Explain every behavior-preserving change.

Recommended structure:
- app/services/<capability>.py
- app/selectors/<query_name>.py
- app/validators/<validation_name>.py
- app/tests/test_<capability>.py