from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F
from django.utils import timezone





class PromoCode(models.Model):
    code = models.CharField(max_length=20, unique=True)
    discount_percentage = models.PositiveIntegerField()
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    max_usage = models.PositiveIntegerField(null=True)
    used_count = models.PositiveIntegerField(default=0)  # Добавили счетчик использований

    def clean(self):
        start_date = self.valid_from
        end_date = self.valid_until
        if end_date < start_date:
            raise ValidationError("End date should be greater than start date.")

    def increment_used_count(self):
        if self.used_count is None:
            return
        if self.pk is None:
            self.used_count += 1
            self.save()
            return
        PromoCode.objects.filter(pk=self.pk).update(used_count=F("used_count") + 1)
        self.refresh_from_db(fields=["used_count"])

    def stripePromoCode(self):
        # TODO (task-003): метод не используется, синхронизация перенесена в signal.py.
        # Оставлен для совместимости.
        pass

    def __str__(self):
        return self.code
