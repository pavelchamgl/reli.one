# API Contract Review Skill

Use this skill before changing serializers, views, endpoints, frontend API calls, or Swagger/OpenAPI behavior.

Checklist:
1. Identify endpoint URL and method.
2. Identify request body/query params.
3. Identify response shape.
4. Identify frontend consumers.
5. Identify tests or missing tests.
6. Check backward compatibility.
7. Do not change contract silently.
8. If contract change is needed, document it in docs/api or relevant docs file.

Output:
- Endpoint
- Current contract
- Consumers
- Risk
- Safe change plan