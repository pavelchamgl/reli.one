from __future__ import annotations

from unittest.mock import patch

import requests
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.choices import UserRole
from accounts.models import CustomUser


class FakeAresResponse:
    def __init__(self, status_code: int, payload: dict | None = None):
        self.status_code = status_code
        self._payload = payload or {}

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"HTTP {self.status_code}")


@override_settings(ARES_CACHE_SECONDS=86400)
class SellerCompanyAresLookupTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = CustomUser.objects.create_user(
            email="ares-lookup@example.com",
            password="password",
            role=UserRole.SELLER,
            first_name="Ares",
            last_name="Seller",
            phone_number="+420777050001",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = reverse("seller-onboarding-company-ares-lookup")

    @patch("requests.Session.get")
    def test_lookup_maps_active_company_response(self, mock_get):
        mock_get.return_value = FakeAresResponse(
            status.HTTP_200_OK,
            {
                "ico": "25596641",
                "dic": "CZ25596641",
                "obchodniJmeno": "Example s.r.o.",
                "pravniForma": "112",
                "sidlo": {
                    "nazevUlice": "Václavské náměstí",
                    "cisloDomovni": "1",
                    "nazevObce": "Praha",
                    "psc": "110 00",
                    "kodStatu": "CZ",
                },
            },
        )

        response = self.client.get(self.url, {"ico": "25596641"})

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["found"], True)
        self.assertEqual(response.data["ico"], "25596641")
        self.assertEqual(response.data["business_id"], "25596641")
        self.assertEqual(response.data["company_name"], "Example s.r.o.")
        self.assertEqual(response.data["legal_form_code"], "112")
        self.assertEqual(response.data["legal_form"], "s.r.o. (Czech Republic / Slovakia)")
        self.assertEqual(response.data["dic_hint"], "CZ25596641")
        self.assertEqual(response.data["registered_address"]["street"], "Václavské náměstí 1")
        self.assertEqual(response.data["registered_address"]["zip_code"], "11000")
        self.assertEqual(response.data["registered_address"]["country"], "CZ")
        self.assertEqual(response.data["is_active"], True)
        self.assertEqual(response.data["warnings"], [])
        mock_get.assert_called_once()

    @patch("requests.Session.get")
    def test_invalid_ico_checksum_does_not_call_ares(self, mock_get):
        response = self.client.get(self.url, {"ico": "12345678"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertEqual(response.data["found"], False)
        self.assertEqual(response.data["code"], "ares_invalid_ico")
        mock_get.assert_not_called()

    @patch("requests.Session.get")
    def test_format_invalid_ico_does_not_call_ares(self, mock_get):
        for ico in ("abcdefgh", "1234567"):
            with self.subTest(ico=ico):
                response = self.client.get(self.url, {"ico": ico})

                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
                self.assertEqual(response.data["found"], False)
                self.assertEqual(response.data["code"], "ares_invalid_ico")
                self.assertIn("detail", response.data)

        mock_get.assert_not_called()

    @patch("requests.Session.get")
    def test_missing_and_blank_ico_use_structured_invalid_ico_error(self, mock_get):
        for params in ({}, {"ico": ""}):
            with self.subTest(params=params):
                response = self.client.get(self.url, params)

                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
                self.assertEqual(response.data["found"], False)
                self.assertEqual(response.data["code"], "ares_invalid_ico")
                self.assertIn("detail", response.data)

        mock_get.assert_not_called()

    @patch("requests.Session.get")
    def test_not_found_returns_structured_404(self, mock_get):
        mock_get.return_value = FakeAresResponse(status.HTTP_404_NOT_FOUND)

        response = self.client.get(self.url, {"ico": "25596641"})

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, response.data)
        self.assertEqual(response.data["found"], False)
        self.assertEqual(response.data["code"], "ares_not_found")

    @patch("requests.Session.get")
    def test_timeout_returns_structured_unavailable(self, mock_get):
        mock_get.side_effect = requests.Timeout("timeout")

        response = self.client.get(self.url, {"ico": "25596641"})

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE, response.data)
        self.assertEqual(response.data["found"], False)
        self.assertEqual(response.data["code"], "ares_unavailable")

    @patch("requests.Session.get")
    def test_5xx_returns_structured_unavailable(self, mock_get):
        mock_get.return_value = FakeAresResponse(status.HTTP_503_SERVICE_UNAVAILABLE)

        response = self.client.get(self.url, {"ico": "25596641"})

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE, response.data)
        self.assertEqual(response.data["found"], False)
        self.assertEqual(response.data["code"], "ares_unavailable")

    @patch("requests.Session.get")
    def test_partial_address_returns_warning_and_nullable_fields(self, mock_get):
        mock_get.return_value = FakeAresResponse(
            status.HTTP_200_OK,
            {
                "ico": "25596641",
                "obchodniJmeno": "Partial Address s.r.o.",
                "pravniForma": "112",
                "sidlo": {
                    "nazevObce": "Praha",
                    "psc": "11000",
                    "kodStatu": "CZ",
                },
            },
        )

        response = self.client.get(self.url, {"ico": "25596641"})

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertIsNone(response.data["registered_address"]["street"])
        self.assertEqual(response.data["registered_address"]["city"], "Praha")
        self.assertIn("registered_address_partial", response.data["warnings"])

    @patch("requests.Session.get")
    def test_szr_subject_extracts_dic_hint(self, mock_get):
        mock_get.return_value = FakeAresResponse(
            status.HTTP_200_OK,
            {
                "zaznamy": [
                    {
                        "ezp": {
                            "subjektEzp": {
                                "ico": "25596641",
                                "dic": "CZ25596641",
                                "obchodniJmeno": "SZR Example s.r.o.",
                                "pravniForma": "112",
                                "sidlo": {
                                    "nazevUlice": "Václavské náměstí",
                                    "cisloDomovni": "1",
                                    "nazevObce": "Praha",
                                    "psc": "11000",
                                    "kodStatu": "CZ",
                                },
                            }
                        }
                    }
                ]
            },
        )

        response = self.client.get(self.url, {"ico": "25596641"})

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["company_name"], "SZR Example s.r.o.")
        self.assertEqual(response.data["dic_hint"], "CZ25596641")
        self.assertEqual(response.data["registered_address"]["street"], "Václavské náměstí 1")
        self.assertEqual(response.data["representatives"], [])

    @patch("requests.Session.get")
    def test_szr_osoba_ezp_returns_representative_suggestions(self, mock_get):
        mock_get.return_value = FakeAresResponse(
            status.HTTP_200_OK,
            {
                "zaznamy": [
                    {
                        "ezp": {
                            "subjektEzp": {
                                "ico": "25596641",
                                "obchodniJmeno": "Representative s.r.o.",
                                "pravniForma": "112",
                                "sidlo": {
                                    "nazevObce": "Praha",
                                    "psc": "11000",
                                    "kodStatu": "CZ",
                                },
                            },
                            "osobaEzp": {
                                "jmeno": "Jan",
                                "prijmeni": "Novák",
                                "role": "Jednatel",
                                "datumNarozeni": "1980-01-01",
                                "statniObcanstvi": "CZ",
                            },
                        }
                    }
                ]
            },
        )

        response = self.client.get(self.url, {"ico": "25596641"})

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(
            response.data["representatives"],
            [
                {
                    "first_name": "Jan",
                    "last_name": "Novák",
                    "role_hint": "Jednatel",
                }
            ],
        )
        representative = response.data["representatives"][0]
        self.assertNotIn("birth_date_hint", representative)
        self.assertNotIn("nationality", representative)

    @patch("requests.Session.get")
    def test_empty_szr_records_fall_back_to_top_level_payload(self, mock_get):
        mock_get.return_value = FakeAresResponse(
            status.HTTP_200_OK,
            {
                "zaznamy": [],
                "ico": "25596641",
                "dic": "CZ25596641",
                "obchodniJmeno": "Fallback s.r.o.",
                "pravniForma": "112",
                "sidlo": {
                    "nazevObce": "Praha",
                    "psc": "11000",
                    "kodStatu": "CZ",
                },
            },
        )

        response = self.client.get(self.url, {"ico": "25596641"})

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["company_name"], "Fallback s.r.o.")
        self.assertEqual(response.data["dic_hint"], "CZ25596641")
        self.assertEqual(response.data["representatives"], [])

    @patch("requests.Session.get")
    def test_successful_lookup_is_cached_by_normalized_ico(self, mock_get):
        mock_get.return_value = FakeAresResponse(
            status.HTTP_200_OK,
            {
                "ico": "25596641",
                "obchodniJmeno": "Cached s.r.o.",
                "pravniForma": "112",
                "sidlo": {
                    "nazevUlice": "Main",
                    "cisloDomovni": "1",
                    "nazevObce": "Praha",
                    "psc": "11000",
                    "kodStatu": "CZ",
                },
            },
        )

        first = self.client.get(self.url, {"ico": "25596641"})
        second = self.client.get(self.url, {"ico": "255 966 41"})

        self.assertEqual(first.status_code, status.HTTP_200_OK, first.data)
        self.assertEqual(second.status_code, status.HTTP_200_OK, second.data)
        self.assertEqual(first.data["company_name"], "Cached s.r.o.")
        self.assertEqual(second.data["company_name"], "Cached s.r.o.")
        mock_get.assert_called_once()
