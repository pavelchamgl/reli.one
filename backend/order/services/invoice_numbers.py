from django.db import transaction
from django.utils import timezone
from django.db.models import F

from order.models import InvoiceSequence

# сколько знаков у порядкового номера (zero-pad)
INVOICE_NUMBER_PAD = 7


def _current_series() -> str:
    return timezone.now().strftime("%Y")


@transaction.atomic
def next_invoice_identifiers() -> tuple[str, str]:
    series = _current_series()

    seq, _ = (InvoiceSequence.objects
              .select_for_update()
              .get_or_create(series=series, defaults={"last_number": 0}))

    InvoiceSequence.objects.filter(pk=seq.pk).update(last_number=F("last_number") + 1)
    seq.refresh_from_db(fields=["last_number"])

    num_str = f"{seq.last_number:0{INVOICE_NUMBER_PAD}d}"

    invoice_number = f"{series}{num_str}"   # пример: "20250001234"
    variable_symbol = f"{series}{num_str}"   # пример: "20250001234"

    return invoice_number, variable_symbol
