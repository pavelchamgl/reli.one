# Generated by Django 5.0.6 on 2025-01-20 17:21

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SellerProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('managers', models.ManyToManyField(blank=True, limit_choices_to={'role': 'Manager'}, related_name='sellers_managed', to=settings.AUTH_USER_MODEL)),
                ('user', models.OneToOneField(limit_choices_to={'role': 'Seller'}, on_delete=django.db.models.deletion.CASCADE, related_name='seller_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='SellerLegalInfo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('company_name', models.CharField(max_length=255)),
                ('legal_address', models.TextField(blank=True, null=True)),
                ('bank_details', models.TextField(blank=True, null=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('approved_at', models.DateTimeField(blank=True, null=True)),
                ('rejected_reason', models.TextField(blank=True, null=True)),
                ('approved_by', models.ForeignKey(blank=True, limit_choices_to={'role__in': ['Manager', 'Admin']}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='approved_legal_infos', to=settings.AUTH_USER_MODEL)),
                ('seller_profile', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='legal_info', to='sellers.sellerprofile')),
            ],
        ),
    ]
