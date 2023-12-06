# Generated by Django 4.2.7 on 2023-12-04 07:21

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('chipBasket', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('promocode', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='OrderItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('order_date', models.DateTimeField(auto_now_add=True)),
                ('total_amount', models.IntegerField()),
                ('status', models.CharField(choices=[('Pending', 'PENDING'), ('Processing', 'PROCESSING'), ('Shipped', 'SHIPPED'), ('Delivered', 'DELIVERED'), ('Cancelled', 'CANCELLED')], default='Pending', max_length=50)),
                ('promo_code', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='promocode.promocode')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('user_basket', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='chipBasket.chipbasket')),
            ],
            options={
                'verbose_name_plural': 'OrderItems',
            },
        ),
    ]
