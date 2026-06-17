from __future__ import annotations

from contextlib import nullcontext

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from product.models import (
    Category,
    CategoryAttributeDefinition,
    CategoryAttributeOption,
)

DEFAULT_DOOR_CATEGORY_IDS = (180, 181, 182, 183)

# MVP: parent attrs (sort 10–70) + up to 3 subcategory attrs (sort 80–100) => 10 effective per leaf.
MAX_ATTRIBUTES_PER_CATEGORY = 10

ENUM_OPTIONS = {
    "door_material": [
        ("steel", "Steel"),
        ("wood", "Wood"),
        ("aluminum", "Aluminum"),
        ("pvc", "PVC"),
        ("mdf", "MDF"),
        ("composite", "Composite"),
        ("glass", "Glass"),
    ],
    "opening_type": [
        ("single", "Single leaf"),
        ("double", "Double leaf"),
        ("one_and_half", "One and a half leaf"),
    ],
    "opening_direction": [
        ("left", "Left (LH)"),
        ("right", "Right (RH)"),
        ("reversible", "Reversible"),
    ],
    "color": [
        ("white", "White"),
        ("oak", "Oak"),
        ("walnut", "Walnut"),
        ("anthracite", "Anthracite"),
        ("black", "Black"),
        ("grey", "Grey"),
        ("beech", "Beech"),
        ("wenge", "Wenge"),
        ("custom", "Custom / RAL"),
    ],
    "security_class": [
        ("rc1", "RC 1"),
        ("rc2", "RC 2"),
        ("rc3", "RC 3"),
        ("rc4", "RC 4"),
    ],
    "lock_type": [
        ("cylinder", "Cylinder lock"),
        ("multipoint", "Multipoint lock"),
        ("electronic", "Electronic / smart lock"),
        ("none", "Not included"),
    ],
    "threshold_type": [
        ("standard", "Standard"),
        ("low", "Low threshold"),
        ("barrier_free", "Barrier-free"),
    ],
    "interior_door_type": [
        ("hinged", "Hinged"),
        ("sliding", "Sliding"),
        ("pocket", "Pocket"),
        ("folding", "Folding"),
        ("barn", "Barn / loft"),
    ],
    "core_type": [
        ("hollow", "Hollow core"),
        ("honeycomb", "Honeycomb"),
        ("solid", "Solid core"),
        ("particle_board", "Particle board"),
    ],
    "glazing_type": [
        ("none", "None"),
        ("clear", "Clear glass"),
        ("frosted", "Frosted"),
        ("decorative", "Decorative"),
    ],
    "glass_type": [
        ("tempered", "Tempered"),
        ("laminated", "Laminated"),
        ("double_glazed", "Double glazed"),
        ("frosted", "Frosted"),
        ("tinted", "Tinted"),
    ],
    "frame_material": [
        ("aluminum", "Aluminum"),
        ("steel", "Steel"),
        ("wood", "Wood"),
        ("frameless", "Frameless"),
    ],
    "glass_door_type": [
        ("swing", "Swing"),
        ("sliding", "Sliding"),
        ("pivot", "Pivot"),
        ("partition", "Partition / office"),
    ],
}


def _attr(
    code,
    name,
    name_ru,
    data_type,
    sort_order,
    *,
    unit="",
    is_required=False,
    is_filterable=True,
    is_public=True,
    group="",
    options_key=None,
):
    return {
        "code": code,
        "name": name,
        "name_ru": name_ru,
        "data_type": data_type,
        "sort_order": sort_order,
        "unit": unit,
        "is_required": is_required,
        "is_filterable": is_filterable,
        "is_public": is_public,
        "group": group,
        "options_key": options_key or code,
    }


# Parent 180: shared core (inherited). Subcategories: 3 essentials each (sort 80+).
SCHEMA = {
    180: [
        _attr("door_width_mm", "Width", "Ширина", "number", 10, unit="mm", is_required=True, group="Dimensions"),
        _attr("door_height_mm", "Height", "Высота", "number", 20, unit="mm", is_required=True, group="Dimensions"),
        _attr("door_material", "Material", "Материал", "enum", 30, is_required=True, group="Materials"),
        _attr("opening_type", "Opening type", "Тип открывания", "enum", 40, is_required=True, group="Construction"),
        _attr("opening_direction", "Opening direction", "Направление открывания", "enum", 50, group="Construction"),
        _attr("color", "Color", "Цвет", "enum", 60, group="Materials"),
        _attr("leaf_thickness_mm", "Leaf thickness", "Толщина полотна", "number", 70, unit="mm", group="Dimensions"),
    ],
    181: [
        _attr("security_class", "Security class", "Класс взломостойкости", "enum", 80, group="Security"),
        _attr("lock_type", "Lock type", "Тип замка", "enum", 90, group="Security"),
        _attr("threshold_type", "Threshold type", "Тип порога", "enum", 100, group="Construction"),
    ],
    182: [
        _attr("interior_door_type", "Interior door type", "Тип межкомнатной двери", "enum", 80, group="Construction"),
        _attr("core_type", "Core type", "Тип наполнения", "enum", 90, group="Construction"),
        _attr("glazing_type", "Glazing type", "Остекление", "enum", 100, group="Construction"),
    ],
    183: [
        _attr("glass_type", "Glass type", "Тип стекла", "enum", 80, group="Glass"),
        _attr("frame_material", "Frame material", "Материал рамы", "enum", 90, group="Frame"),
        _attr("glass_door_type", "Glass door type", "Тип конструкции", "enum", 100, group="Construction"),
    ],
}


def upsert_options(definition: CategoryAttributeDefinition, options_key: str) -> tuple[int, int]:
    options = ENUM_OPTIONS.get(options_key, [])
    if definition.data_type != CategoryAttributeDefinition.DataType.ENUM:
        return 0, 0

    created = updated = 0
    for sort_order, (value, label) in enumerate(options, start=1):
        _, was_created = CategoryAttributeOption.objects.update_or_create(
            attribute_definition=definition,
            value=value,
            defaults={
                "label": label,
                "sort_order": sort_order,
                "is_active": True,
            },
        )
        if was_created:
            created += 1
        else:
            updated += 1
    return created, updated


def validate_schema_limits() -> None:
    for category_id, attributes in SCHEMA.items():
        if len(attributes) > MAX_ATTRIBUTES_PER_CATEGORY:
            raise CommandError(
                f"Category {category_id} has {len(attributes)} attributes; "
                f"max {MAX_ATTRIBUTES_PER_CATEGORY} allowed."
            )


class Command(BaseCommand):
    help = (
        "Seed MVP Doors category attribute schema (180-183). "
        "Parent attrs inherit to subcategories; max 10 effective attrs per leaf."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--category-ids",
            nargs="+",
            type=int,
            default=list(DEFAULT_DOOR_CATEGORY_IDS),
            help="Category IDs to seed (default: 180 181 182 183).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate categories and print planned actions without writing.",
        )

    def handle(self, *args, **options):
        validate_schema_limits()

        category_ids = tuple(options["category_ids"])
        missing_schema_ids = sorted(set(category_ids) - set(SCHEMA))
        if missing_schema_ids:
            raise CommandError(f"No schema configured for category IDs: {missing_schema_ids}")

        categories = Category.objects.in_bulk(category_ids)
        missing_ids = sorted(set(category_ids) - set(categories))
        if missing_ids:
            raise CommandError(f"Categories not found: {missing_ids}")

        defs_created = defs_updated = opts_created = opts_updated = deactivated = 0

        context_manager = transaction.atomic if not options["dry_run"] else nullcontext
        context = context_manager()
        with context:
            for category_id in category_ids:
                if category_id not in SCHEMA:
                    continue

                category = categories[category_id]
                active_codes = {spec["code"] for spec in SCHEMA[category_id]}
                self.stdout.write(f"\n=== Category {category_id}: {category.name} ===")

                if options["dry_run"]:
                    for spec in SCHEMA[category_id]:
                        self.stdout.write(
                            f"  would upsert: {spec['code']} "
                            f"(type={spec['data_type']}, required={spec['is_required']}, sort={spec['sort_order']})"
                        )
                    stale = CategoryAttributeDefinition.objects.filter(category=category).exclude(code__in=active_codes)
                    self.stdout.write(f"  would deactivate: {stale.count()} stale definition(s)")
                    continue

                for spec in SCHEMA[category_id]:
                    definition, was_created = CategoryAttributeDefinition.objects.update_or_create(
                        category=category,
                        code=spec["code"],
                        defaults={
                            "name": spec["name"],
                            "description": f"RU: {spec['name_ru']}",
                            "data_type": spec["data_type"],
                            "unit": spec["unit"],
                            "group": spec["group"],
                            "is_required": spec["is_required"],
                            "is_filterable": spec["is_filterable"],
                            "is_public": spec["is_public"],
                            "sort_order": spec["sort_order"],
                            "is_active": True,
                        },
                    )
                    if was_created:
                        defs_created += 1
                        action = "created"
                    else:
                        defs_updated += 1
                        action = "updated"

                    oc, ou = (0, 0)
                    if spec["data_type"] == "enum":
                        oc, ou = upsert_options(definition, spec["options_key"])

                    opts_created += oc
                    opts_updated += ou
                    self.stdout.write(
                        f"  {action}: {spec['code']} "
                        f"(id={definition.id}, type={spec['data_type']}, "
                        f"required={spec['is_required']}, sort={spec['sort_order']}, options +{oc}/~{ou})"
                    )

                stale_qs = CategoryAttributeDefinition.objects.filter(category=category).exclude(code__in=active_codes)
                deactivated += stale_qs.update(is_active=False)

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING("\nDry run only — no changes written."))
            return

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. definitions: created={defs_created}, updated={defs_updated}, "
                f"deactivated={deactivated}; options: created={opts_created}, updated={opts_updated}"
            )
        )
