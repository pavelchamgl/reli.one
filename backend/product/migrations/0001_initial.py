# Generated by Django 4.2.3 on 2024-07-28 16:22

from decimal import Decimal
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import product.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('supplier', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='BaseProduct',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('product_description', models.TextField()),
                ('price', models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))])),
                ('rating', models.DecimalField(blank=True, decimal_places=1, default=Decimal('0.0'), max_digits=2, null=True, validators=[django.core.validators.MinValueValidator(Decimal('1.0')), django.core.validators.MaxValueValidator(Decimal('5.0'))])),
                ('total_reviews', models.IntegerField(default=0)),
            ],
        ),
        migrations.CreateModel(
            name='BaseProductImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='base_product_images/')),
            ],
        ),
        migrations.CreateModel(
            name='ParameterName',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='ParameterValue',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('value', models.TextField()),
                ('parameter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='product.parametername')),
            ],
        ),
        migrations.CreateModel(
            name='LicenseFile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, max_length=100, null=True)),
                ('file', models.FileField(upload_to='license_files/', validators=[product.models.validate_file_extension, product.models.validate_file_size])),
                ('product', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='license_files', to='product.baseproduct')),
            ],
        ),
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('image', models.ImageField(blank=True, null=True, upload_to='category_images/')),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='product.category')),
            ],
        ),
        migrations.AddField(
            model_name='baseproduct',
            name='category',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='product.category'),
        ),
        migrations.AddField(
            model_name='baseproduct',
            name='image',
            field=models.ManyToManyField(related_name='base_products', to='product.baseproductimage'),
        ),
        migrations.AddField(
            model_name='baseproduct',
            name='parameters',
            field=models.ManyToManyField(related_name='base_products', to='product.parametervalue'),
        ),
        migrations.AddField(
            model_name='baseproduct',
            name='supplier',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='supplier.supplier'),
        ),
    ]
