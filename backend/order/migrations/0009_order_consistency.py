"""
Order Consistency — Task 004 Iteration 3b.

Changes:
  1. OrderStatus.name  → unique=True
  2. Order.user        → SET_NULL, null=True, blank=True  (GDPR / финансовое хранение)
  3. Order indexes     → (user, order_status), (order_date)
  4. OrderProduct index → (seller_profile, status)

Примечания:
  - unique=True на OrderStatus.name упадёт, если в БД есть дубли; проверить
    SELECT name, COUNT(*) FROM order_orderstatus GROUP BY name HAVING COUNT(*) > 1
    перед применением в prod.
  - SET_NULL на Order.user требует ALTER COLUMN … DROP NOT NULL в Postgres.
    В production применять в maintenance window или с CONCURRENTLY если таблица большая.
  - Индексы добавляются без CONCURRENTLY (стандартный Django); в prod при большой таблице
    использовать RunSQL с CREATE INDEX CONCURRENTLY и SeparateDatabaseAndState.
"""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("order", "0008_order_order_user_orderdate_idx"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. OrderStatus.name → unique
        migrations.AlterField(
            model_name="orderstatus",
            name="name",
            field=models.CharField(max_length=50, unique=True),
        ),

        # 2. Order.user → SET_NULL
        migrations.AlterField(
            model_name="order",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to=settings.AUTH_USER_MODEL,
            ),
        ),

        # 3a. Order index: (user, order_status)
        migrations.AddIndex(
            model_name="order",
            index=models.Index(
                fields=("user", "order_status"),
                name="order_user_status_idx",
            ),
        ),

        # 3b. Order index: (order_date)
        migrations.AddIndex(
            model_name="order",
            index=models.Index(
                fields=("order_date",),
                name="order_orderdate_idx",
            ),
        ),

        # 4. OrderProduct index: (seller_profile, status)
        migrations.AddIndex(
            model_name="orderproduct",
            index=models.Index(
                fields=("seller_profile", "status"),
                name="orderproduct_seller_status_idx",
            ),
        ),
    ]
