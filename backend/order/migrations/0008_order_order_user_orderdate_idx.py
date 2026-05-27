# Составной индекс под типичный запрос списка заказов покупателя:
# Order.objects.filter(user=...).order_by("-order_date")

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("order", "0007_orderevent"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="order",
            index=models.Index(
                fields=("user", "order_date"),
                name="order_user_orderdate_idx",
            ),
        ),
    ]
