"""Regression tests for CORS settings (FE-014 runtime gap: local Vite dev server)."""

from django.conf import settings
from django.test import SimpleTestCase


class CorsSettingsTests(SimpleTestCase):
    def test_cors_allow_all_origins_is_false(self):
        self.assertFalse(settings.CORS_ALLOW_ALL_ORIGINS)
