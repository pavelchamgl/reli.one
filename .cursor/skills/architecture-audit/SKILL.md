# Architecture Audit Skill

Use this skill when the user asks to analyze architecture, project structure, domain boundaries, technical debt, or scalability.

Process:
1. Do not modify code.
2. Identify affected domains.
3. Read models, views, serializers, services, urls, and tests.
4. Map current responsibilities.
5. Identify:
   - business logic in views
   - duplicated logic
   - weak boundaries
   - missing transactions
   - missing idempotency
   - model coupling
   - API contract risks
6. Write findings into docs/09-architecture-debt.md or relevant docs file.
7. Prioritize issues as P0/P1/P2/P3.
8. Recommend small migration-safe steps.

Output format:
- Summary
- Files inspected
- Findings
- Risks
- Recommended next steps
- Do not change code unless explicitly asked.