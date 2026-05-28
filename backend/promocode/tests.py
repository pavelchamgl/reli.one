from unittest.mock import MagicMock, patch

from django.conf import settings as django_settings
from django.test import TestCase
from django.utils import timezone

from .models import PromoCode


class PromoCodeModelTests(TestCase):
    """BE-1b: PromoCode.ValidationError → должен быть django.core.exceptions.ValidationError."""

    def _make_promo(self, **kwargs):
        defaults = dict(
            code="TEST10",
            discount_percentage=10,
            valid_from=timezone.now(),
            valid_until=timezone.now() + timezone.timedelta(days=30),
            max_usage=100,
        )
        defaults.update(kwargs)
        return PromoCode(**defaults)

    def test_clean_raises_validation_error_when_until_before_from(self):
        """clean() должен поднять django ValidationError, не AttributeError."""
        from django.core.exceptions import ValidationError

        promo = self._make_promo(
            valid_from=timezone.now(),
            valid_until=timezone.now() - timezone.timedelta(days=1),
        )
        with self.assertRaises(ValidationError):
            promo.clean()

    def test_clean_passes_when_until_after_from(self):
        promo = self._make_promo()
        promo.clean()

    def test_increment_used_count_increments_by_one(self):
        promo = PromoCode.objects.create(
            code="INCR1",
            discount_percentage=10,
            valid_from=timezone.now(),
            valid_until=timezone.now() + timezone.timedelta(days=30),
            max_usage=100,
            used_count=0,
        )
        promo.increment_used_count()
        self.assertEqual(
            PromoCode.objects.get(pk=promo.pk).used_count,
            1,
        )

    def test_increment_used_count_twice_sequential(self):
        promo = PromoCode.objects.create(
            code="INCR2",
            discount_percentage=5,
            valid_from=timezone.now(),
            valid_until=timezone.now() + timezone.timedelta(days=30),
            max_usage=100,
            used_count=3,
        )
        promo.increment_used_count()
        promo.increment_used_count()
        promo.refresh_from_db(fields=["used_count"])
        self.assertEqual(promo.used_count, 5)


class PromoCodeSignalTests(TestCase):
    """BE-1: сигнал не должен вызывать AttributeError при сохранении PromoCode."""

    @patch("stripe.PromotionCode.create")
    @patch("stripe.Coupon.create", return_value=MagicMock(id="SIGNAL10"))
    @patch.object(django_settings, "STRIPE_API_SECRET_KEY", "sk_test_mock")
    def test_save_promocode_does_not_raise_with_stripe_mocked(self, mock_coupon, mock_promo_code):
        """Создание PromoCode не должно бросать AttributeError (BE-1)."""
        promo = PromoCode.objects.create(
            code="SIGNAL10",
            discount_percentage=10,
            valid_from=timezone.now(),
            valid_until=timezone.now() + timezone.timedelta(days=30),
            max_usage=50,
        )
        self.assertEqual(promo.code, "SIGNAL10")

    @patch.object(django_settings, "STRIPE_API_SECRET_KEY", "sk_test_mock")
    @patch("stripe.Coupon.create", side_effect=Exception("Stripe unavailable"))
    def test_save_promocode_does_not_raise_when_stripe_fails(self, mock_coupon):
        """Если Stripe недоступен — PromoCode всё равно сохраняется, нет 500."""
        promo = PromoCode.objects.create(
            code="FALLBACK10",
            discount_percentage=5,
            valid_from=timezone.now(),
            valid_until=timezone.now() + timezone.timedelta(days=30),
            max_usage=10,
        )
        self.assertEqual(promo.code, "FALLBACK10")
