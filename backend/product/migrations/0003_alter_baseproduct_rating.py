# Generated by Django 5.0.6 on 2025-02-14 11:56

import django.core.validators
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0002_alter_licensefile_product'),
    ]

    operations = [
        migrations.AlterField(
            model_name='baseproduct',
            name='rating',
            field=models.DecimalField(blank=True, decimal_places=1, default=Decimal('0.0'), max_digits=2, null=True, validators=[django.core.validators.MinValueValidator(Decimal('1.0')), django.core.validators.MaxValueValidator(Decimal('5.0'))]),
        ),
    ]
