"""Тесты политики доступа к dev-эндпоинтам курьеров (см. delivery.dev_access)."""
from __future__ import annotations

from django.test import SimpleTestCase, override_settings

from delivery.dev_access import include_dev_courier_tooling


class DevCourierToolingAccessTests(SimpleTestCase):
    @override_settings(DEBUG=False, ENABLE_DELIVERY_DEV_ENDPOINTS=False)
    def test_disabled_when_debug_off_and_flag_off(self):
        self.assertFalse(include_dev_courier_tooling())

    @override_settings(DEBUG=True, ENABLE_DELIVERY_DEV_ENDPOINTS=False)
    def test_enabled_when_debug_on(self):
        self.assertTrue(include_dev_courier_tooling())

    @override_settings(DEBUG=False, ENABLE_DELIVERY_DEV_ENDPOINTS=True)
    def test_enabled_when_explicit_flag_on(self):
        self.assertTrue(include_dev_courier_tooling())
