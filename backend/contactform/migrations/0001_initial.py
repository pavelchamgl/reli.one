# Generated by Django 5.1 on 2024-08-17 11:23

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Contact',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('email', models.EmailField(max_length=254)),
                ('address', models.CharField(max_length=255)),
                ('company_name', models.CharField(blank=True, max_length=255, null=True)),
                ('message', models.TextField()),
                ('phone', models.CharField(max_length=20)),
            ],
        ),
    ]
