"""Юнит-тесты парсинга env для settings (без полной инициализации Django)."""

from unittest import TestCase

from env_parse import cookie_samesite_from_env, int_from_env, str_to_bool


class StrToBoolTests(TestCase):
    def test_truthy(self):
        self.assertTrue(str_to_bool("true"))
        self.assertTrue(str_to_bool("True"))
        self.assertTrue(str_to_bool("1"))
        self.assertTrue(str_to_bool("yes"))

    def test_falsy(self):
        self.assertFalse(str_to_bool(None))
        self.assertFalse(str_to_bool("false"))
        self.assertFalse(str_to_bool(""))
        self.assertFalse(str_to_bool("0"))


class CookieSameSiteTests(TestCase):
    def test_none_maps_to_string_none(self):
        env = {"SESSION_COOKIE_SAMESITE": "none"}
        self.assertEqual(
            cookie_samesite_from_env(
                "SESSION_COOKIE_SAMESITE", "Lax", getter=env.get
            ),
            "None",
        )

    def test_empty_falls_back_to_default(self):
        env = {"SESSION_COOKIE_SAMESITE": "  "}
        self.assertEqual(
            cookie_samesite_from_env(
                "SESSION_COOKIE_SAMESITE", "Lax", getter=env.get
            ),
            "Lax",
        )

    def test_strict(self):
        env = {"X": "Strict"}
        self.assertEqual(cookie_samesite_from_env("X", "Lax", getter=env.get), "Strict")


class IntFromEnvTests(TestCase):
    def test_default(self):
        env = {}
        self.assertEqual(int_from_env("SECURE_HSTS_SECONDS", 0, getter=env.get), 0)

    def test_parse(self):
        env = {"SECURE_HSTS_SECONDS": "31536000"}
        self.assertEqual(
            int_from_env("SECURE_HSTS_SECONDS", 0, getter=env.get), 31536000
        )

    def test_invalid_returns_default(self):
        env = {"SECURE_HSTS_SECONDS": "not-an-int"}
        self.assertEqual(int_from_env("SECURE_HSTS_SECONDS", 0, getter=env.get), 0)
