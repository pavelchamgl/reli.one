"""
Task 013 Phase 1 — Stock Reservation Models (database layer only).

Changes:
  1. WarehouseItem.reserved_quantity   — new PositiveIntegerField(default=0)
  2. StockReservation                  — new model
  3. StockReservationItem              — new model
  4. Index (status, expires_at) on StockReservation

No runtime behavior changes. STOCK_RESERVATION_ENABLED flag controls integration
(added in Phase 3). decrease_stock() is unchanged.

Production notes:
  - ADD COLUMN … DEFAULT 0 NOT NULL is metadata-only in PostgreSQL ≥ 11; no table rewrite.
  - New tables are empty at migration time; no data concerns.
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("warehouses", "0001_initial"),
    ]

    operations = [
        # 1. WarehouseItem: add reserved_quantity
        migrations.AddField(
            model_name="warehouseitem",
            name="reserved_quantity",
            field=models.PositiveIntegerField(
                default=0,
                help_text=(
                    "Units currently held by pending stock reservations. "
                    "available_quantity = quantity_in_stock - reserved_quantity."
                ),
            ),
        ),

        # 2. StockReservation
        migrations.CreateModel(
            name="StockReservation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("session_key", models.CharField(
                    db_index=True,
                    help_text="Matches StripeMetadata.session_key / PayPalMetadata.session_key",
                    max_length=255,
                    unique=True,
                )),
                ("payment_system", models.CharField(
                    help_text='"stripe" or "paypal"',
                    max_length=10,
                )),
                ("status", models.CharField(
                    choices=[
                        ("pending",   "Pending"),
                        ("confirmed", "Confirmed"),
                        ("released",  "Released"),
                        ("expired",   "Expired"),
                    ],
                    db_index=True,
                    default="pending",
                    max_length=20,
                )),
                ("expires_at", models.DateTimeField(
                    db_index=True,
                    help_text="Reservation TTL; cleanup job releases PENDING rows past this timestamp",
                )),
                ("created_at",   models.DateTimeField(auto_now_add=True)),
                ("confirmed_at", models.DateTimeField(blank=True, null=True)),
                ("released_at",  models.DateTimeField(blank=True, null=True)),
            ],
            options={
                "verbose_name": "Stock Reservation",
                "verbose_name_plural": "Stock Reservations",
            },
        ),

        # 3. Composite index (status, expires_at) — used by cleanup query
        migrations.AddIndex(
            model_name="stockreservation",
            index=models.Index(
                fields=("status", "expires_at"),
                name="stockres_status_expires_idx",
            ),
        ),

        # 4. StockReservationItem
        migrations.CreateModel(
            name="StockReservationItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.PositiveIntegerField()),
                ("reservation", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="items",
                    to="warehouses.stockreservation",
                )),
                ("warehouse_item", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="reservation_items",
                    to="warehouses.warehouseitem",
                )),
            ],
            options={
                "verbose_name": "Stock Reservation Item",
                "verbose_name_plural": "Stock Reservation Items",
                "unique_together": {("reservation", "warehouse_item")},
            },
        ),
    ]
