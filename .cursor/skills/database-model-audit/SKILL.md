# Database Model Audit Skill

Use this skill when reviewing Django models, database relationships, migrations, constraints, indexes, and scalability.

Process:
1. Do not change models initially.
2. Inspect all relevant models.py files.
3. Map relationships.
4. Identify:
   - missing indexes
   - missing unique constraints
   - nullable fields that should not be nullable
   - cascade risks
   - duplicated data
   - unclear ownership
   - missing status/history/audit models
   - migration risks
5. Separate recommendations:
   - Critical
   - Important
   - Optional
6. For any suggested model change, provide a migration strategy:
   - add new field/table
   - backfill data
   - switch code
   - remove old field later