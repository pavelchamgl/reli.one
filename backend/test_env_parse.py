"""Юнит-тесты парсинга env для settings (без полной инициализации Django)."""

from unittest import TestCase

from env_parse import (
    LOCAL_DEV_CORS_ORIGINS,
    cookie_samesite_from_env,
    int_from_env,
    resolve_cors_allowed_origins,
    str_to_bool,
)


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


class ResolveCorsAllowedOriginsTests(TestCase):
    def test_production_defaults_without_debug_or_e2e(self):
        origins = resolve_cors_allowed_origins(
            debug=False,
            enable_e2e_endpoints=False,
            cors_allowed_origins_env="",
        )
        self.assertNotIn("http://localhost:5173", origins)
        self.assertNotIn("http://127.0.0.1:5173", origins)
        self.assertIn("https://reli.one", origins)

    def test_debug_appends_local_vite_origins(self):
        origins = resolve_cors_allowed_origins(
            debug=True,
            enable_e2e_endpoints=False,
            cors_allowed_origins_env="",
        )
        for origin in LOCAL_DEV_CORS_ORIGINS:
            self.assertIn(origin, origins)

    def test_enable_e2e_appends_local_vite_origins(self):
        origins = resolve_cors_allowed_origins(
            debug=False,
            enable_e2e_endpoints=True,
            cors_allowed_origins_env="",
        )
        for origin in LOCAL_DEV_CORS_ORIGINS:
            self.assertIn(origin, origins)

    def test_env_override_used_without_duplicates(self):
        env_value = "http://localhost:5173,https://staging.example.com"
        origins = resolve_cors_allowed_origins(
            debug=True,
            enable_e2e_endpoints=True,
            cors_allowed_origins_env=env_value,
        )
        self.assertEqual(
            origins.count("http://localhost:5173"),
            1,
        )
        self.assertIn("https://staging.example.com", origins)
        self.assertIn("http://127.0.0.1:5173", origins)
