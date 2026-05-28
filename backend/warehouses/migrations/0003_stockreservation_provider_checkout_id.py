from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("warehouses", "0002_stock_reservation"),
    ]

    operations = [
        migrations.AddField(
            model_name="stockreservation",
            name="provider_checkout_id",
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text="Stripe Checkout Session ID (cs_…) or PayPal order ID for TTL cleanup",
                max_length=255,
                null=True,
            ),
        ),
    ]
