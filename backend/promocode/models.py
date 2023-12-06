from django.db import models
from django.utils import timezone
import stripe
from backend import settings





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
            raise PromoCode.ValidationError("End date should be greater than start date.")

    def increment_used_count(self):
        if self.used_count is not None:
            self.used_count += 1
            self.save()

    def stripePromoCode(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY_TEST
        stripe.Coupon.create(
            id=self.code,
            percent_off=self.discount_percentage,
            duration_in_months=3,
            max_redemptions=self.max_usage,
            redeem_by=self.valid_until,
        )

    def __str__(self):
        return self.code
