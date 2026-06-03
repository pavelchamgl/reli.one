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
from sellers.providers.ares.client import AresClient


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
        self.assertEqual(response.data["dic_hint_source"], "ares")
        self.assertEqual(response.data["registered_address"]["street"], "Václavské náměstí 1")
        self.assertEqual(response.data["registered_address"]["zip_code"], "11000")
        self.assertEqual(response.data["registered_address"]["country"], "CZ")
        self.assertEqual(response.data["is_active"], True)
        self.assertEqual(response.data["warnings"], [])
        self.assertEqual(mock_get.call_count, 3)
        self.assertIn("/ekonomicke-subjekty/25596641", mock_get.call_args_list[0].args[0])
        self.assertIn("/ekonomicke-subjekty-szr/25596641", mock_get.call_args_list[1].args[0])
        self.assertIn("/ekonomicke-subjekty-vr/25596641", mock_get.call_args_list[2].args[0])

    @patch("requests.Session.get")
    def test_client_calls_szr_endpoint(self, mock_get):
        mock_get.return_value = FakeAresResponse(status.HTTP_200_OK, {"zaznamy": []})
        client = AresClient(base="https://ares.example.test")

        response = client.get_economic_subject_szr("25596641")

        self.assertEqual(response, {"zaznamy": []})
        mock_get.assert_called_once()
        self.assertEqual(
            mock_get.call_args.args[0],
            "https://ares.example.test/ekonomicke-subjekty-szr/25596641",
        )

    @patch("requests.Session.get")
    def test_client_calls_vr_endpoint(self, mock_get):
        mock_get.return_value = FakeAresResponse(status.HTTP_200_OK, {"statutarniOrgany": []})
        client = AresClient(base="https://ares.example.test")

        response = client.get_economic_subject_vr("25596641")

        self.assertEqual(response, {"statutarniOrgany": []})
        mock_get.assert_called_once()
        self.assertEqual(
            mock_get.call_args.args[0],
            "https://ares.example.test/ekonomicke-subjekty-vr/25596641",
        )

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
    def test_service_enriches_dic_hint_and_representatives_from_szr(self, mock_get):
        mock_get.side_effect = [
            FakeAresResponse(
                status.HTTP_200_OK,
                {
                    "ico": "25596641",
                    "obchodniJmeno": "Primary s.r.o.",
                    "pravniForma": "112",
                    "sidlo": {
                        "nazevObce": "Praha",
                        "psc": "11000",
                        "kodStatu": "CZ",
                    },
                },
            ),
            FakeAresResponse(
                status.HTTP_200_OK,
                {
                    "zaznamy": [
                        {
                            "ezp": {
                                "subjektEzp": {
                                    "ico": "25596641",
                                    "dic": "CZ25596641",
                                    "obchodniJmeno": "SZR s.r.o.",
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
                                },
                            }
                        }
                    ]
                },
            ),
            FakeAresResponse(status.HTTP_200_OK, {"statutarniOrgany": []}),
        ]

        response = self.client.get(self.url, {"ico": "25596641"})

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["company_name"], "Primary s.r.o.")
        self.assertEqual(response.data["dic_hint"], "CZ25596641")
        self.assertEqual(response.data["dic_hint_source"], "ares")
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
        self.assertEqual(mock_get.call_count, 3)

    @patch("requests.Session.get")
    def test_szr_failure_does_not_fail_successful_primary_lookup(self, mock_get):
        mock_get.side_effect = [
            FakeAresResponse(
                status.HTTP_200_OK,
                {
                    "ico": "25596641",
                    "obchodniJmeno": "Primary Only s.r.o.",
                    "pravniForma": "112",
                    "sidlo": {
                        "nazevObce": "Praha",
                        "psc": "11000",
                        "kodStatu": "CZ",
                    },
                },
            ),
            FakeAresResponse(status.HTTP_503_SERVICE_UNAVAILABLE),
            FakeAresResponse(status.HTTP_503_SERVICE_UNAVAILABLE),
        ]

        response = self.client.get(self.url, {"ico": "25596641"})

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["company_name"], "Primary Only s.r.o.")
        self.assertEqual(response.data["dic_hint"], "CZ25596641")
        self.assertEqual(response.data["dic_hint_source"], "derived")
        self.assertEqual(response.data["representatives"], [])
        self.assertEqual(mock_get.call_count, 3)

    @patch("requests.Session.get")
    def test_derives_dic_hint_for_czech_company_when_ares_dic_is_absent(self, mock_get):
        mock_get.side_effect = [
            FakeAresResponse(
                status.HTTP_200_OK,
                {
                    "ico": "25596641",
                    "obchodniJmeno": "Derived DIČ s.r.o.",
                    "pravniForma": "112",
                    "sidlo": {
                        "nazevObce": "Praha",
                        "psc": "11000",
                        "kodStatu": "CZ",
                    },
                },
            ),
            FakeAresResponse(status.HTTP_200_OK, {"zaznamy": []}),
            FakeAresResponse(status.HTTP_200_OK, {"statutarniOrgany": []}),
        ]

        response = self.client.get(self.url, {"ico": "25596641"})

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["dic_hint"], "CZ25596641")
        self.assertEqual(response.data["dic_hint_source"], "derived")

    @patch("requests.Session.get")
    def test_vr_parser_returns_active_reli_representative(self, mock_get):
        mock_get.side_effect = [
            FakeAresResponse(
                status.HTTP_200_OK,
                {
                    "ico": "25596641",
                    "obchodniJmeno": "Reli Group s.r.o.",
                    "pravniForma": "112",
                    "sidlo": {"nazevObce": "Praha", "psc": "11000", "kodStatu": "CZ"},
                },
            ),
            FakeAresResponse(status.HTTP_200_OK, {"zaznamy": []}),
            FakeAresResponse(
                status.HTTP_200_OK,
                {
                    "statutarniOrgany": [
                        {
                            "clenoveOrganu": [
                                {
                                    "fyzickaOsoba": {
                                        "jmeno": "Pavel",
                                        "prijmeni": "Kuznetsov",
                                        "datumNarozeni": "1990-01-01",
                                        "statniObcanstvi": "RU",
                                    },
                                    "clenstvi": {"funkce": {"nazev": "jednatel"}},
                                }
                            ]
                        }
                    ]
                },
            ),
        ]

        response = self.client.get(self.url, {"ico": "25596641"})

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(
            response.data["representatives"],
            [
                {
                    "first_name": "Pavel",
                    "last_name": "Kuznetsov",
                    "role_hint": "jednatel",
                    "birth_date_hint": "1990-01-01",
                    "nationality_hint": "RU",
                }
            ],
        )

    @patch("requests.Session.get")
    def test_vr_parser_returns_active_reli_representative_from_nested_live_shape(self, mock_get):
        mock_get.side_effect = [
            FakeAresResponse(
                status.HTTP_200_OK,
                {
                    "ico": "28003896",
                    "obchodniJmeno": "Reli Live Shape s.r.o.",
                    "pravniForma": "112",
                    "sidlo": {"nazevObce": "Praha", "psc": "11000", "kodStatu": "CZ"},
                },
            ),
            FakeAresResponse(status.HTTP_200_OK, {"zaznamy": []}),
            FakeAresResponse(
                status.HTTP_200_OK,
                {
                    "icoId": "28003896",
                    "zaznamy": [
                        {
                            "statutarniOrgany": [
                                {
                                    "clenoveOrganu": [
                                        {
                                            "datumVymazu": None,
                                            "clenstvi": {
                                                "funkce": {
                                                    "nazev": "jednatel",
                                                }
                                            },
                                            "fyzickaOsoba": {
                                                "datumNarozeni": "1984-10-25",
                                                "jmeno": "ANTON",
                                                "prijmeni": "SIROTENKO",
                                                "statniObcanstvi": "RU",
                                            },
                                        },
                                        {
                                            "datumVymazu": "2022-01-05",
                                            "clenstvi": {
                                                "funkce": {
                                                    "nazev": "jednatel",
                                                }
                                            },
                                            "fyzickaOsoba": {
                                                "datumNarozeni": "1970-01-01",
                                                "jmeno": "HISTORICAL",
                                                "prijmeni": "MEMBER",
                                                "statniObcanstvi": "CZ",
                                            },
                                        },
                                    ]
                                }
                            ]
                        }
                    ],
                },
            ),
        ]

        response = self.client.get(self.url, {"ico": "28003896"})

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(
            response.data["representatives"],
            [
                {
                    "first_name": "ANTON",
                    "last_name": "SIROTENKO",
                    "role_hint": "jednatel",
                    "birth_date_hint": "1984-10-25",
                    "nationality_hint": "RU",
                }
            ],
        )

    @patch("requests.Session.get")
    def test_vr_filters_historical_or_expired_members(self, mock_get):
        mock_get.side_effect = [
            FakeAresResponse(
                status.HTTP_200_OK,
                {
                    "ico": "25596641",
                    "obchodniJmeno": "Filtered s.r.o.",
                    "pravniForma": "112",
                    "sidlo": {"nazevObce": "Praha", "psc": "11000", "kodStatu": "CZ"},
                },
            ),
            FakeAresResponse(status.HTTP_200_OK, {"zaznamy": []}),
            FakeAresResponse(
                status.HTTP_200_OK,
                {
                    "statutarniOrgany": [
                        {
                            "clenoveOrganu": [
                                {
                                    "datumVymazu": "2020-01-01",
                                    "fyzickaOsoba": {"jmeno": "Old", "prijmeni": "Member"},
                                    "clenstvi": {"funkce": {"nazev": "jednatel"}},
                                },
                                {
                                    "fyzickaOsoba": {"jmeno": "Expired", "prijmeni": "Function"},
                                    "clenstvi": {
                                        "funkce": {
                                            "nazev": "jednatel",
                                            "zanikFunkce": "2021-01-01",
                                        }
                                    },
                                },
                                {
                                    "pravnickaOsoba": {"obchodniJmeno": "Legal Person"},
                                    "clenstvi": {"funkce": {"nazev": "jednatel"}},
                                },
                                {
                                    "fyzickaOsoba": {
                                        "jmeno": "Active",
                                        "prijmeni": "Member",
                                        "datumNarozeni": "1985-05-05",
                                    },
                                    "clenstvi": {"funkce": {"nazev": "prokurista"}},
                                },
                            ]
                        }
                    ]
                },
            ),
        ]

        response = self.client.get(self.url, {"ico": "25596641"})

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(len(response.data["representatives"]), 1)
        self.assertEqual(response.data["representatives"][0]["first_name"], "Active")

    @patch("requests.Session.get")
    def test_vr_handles_multiple_active_alza_representatives(self, mock_get):
        mock_get.side_effect = [
            FakeAresResponse(
                status.HTTP_200_OK,
                {
                    "ico": "27082440",
                    "obchodniJmeno": "Alza.cz a.s.",
                    "pravniForma": "121",
                    "sidlo": {"nazevObce": "Praha", "psc": "11000", "kodStatu": "CZ"},
                },
            ),
            FakeAresResponse(status.HTTP_200_OK, {"zaznamy": []}),
            FakeAresResponse(
                status.HTTP_200_OK,
                {
                    "statutarniOrgany": [
                        {
                            "clenoveOrganu": [
                                {
                                    "fyzickaOsoba": {
                                        "jmeno": "Alice",
                                        "prijmeni": "Director",
                                        "datumNarozeni": "1980-01-01",
                                        "statniObcanstvi": "CZ",
                                    },
                                    "clenstvi": {
                                        "funkce": {"nazev": "člen představenstva"}
                                    },
                                },
                                {
                                    "fyzickaOsoba": {
                                        "jmeno": "Bob",
                                        "prijmeni": "Chair",
                                        "datumNarozeni": "1981-02-02",
                                        "statniObcanstvi": "CZ",
                                    },
                                    "clenstvi": {
                                        "funkce": {"nazev": "předseda představenstva"}
                                    },
                                },
                                {
                                    "fyzickaOsoba": {
                                        "jmeno": "Alice",
                                        "prijmeni": "Director",
                                        "datumNarozeni": "1980-01-01",
                                        "statniObcanstvi": "CZ",
                                    },
                                    "clenstvi": {
                                        "funkce": {"nazev": "člen představenstva"}
                                    },
                                },
                            ]
                        }
                    ]
                },
            ),
        ]

        response = self.client.get(self.url, {"ico": "27082440"})

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(len(response.data["representatives"]), 2)
        self.assertEqual(response.data["representatives"][0]["first_name"], "Alice")
        self.assertEqual(response.data["representatives"][1]["first_name"], "Bob")

    @patch("requests.Session.get")
    def test_vr_failure_does_not_fail_successful_primary_lookup(self, mock_get):
        mock_get.side_effect = [
            FakeAresResponse(
                status.HTTP_200_OK,
                {
                    "ico": "25596641",
                    "obchodniJmeno": "VR Failure s.r.o.",
                    "pravniForma": "112",
                    "sidlo": {"nazevObce": "Praha", "psc": "11000", "kodStatu": "CZ"},
                },
            ),
            FakeAresResponse(status.HTTP_200_OK, {"zaznamy": []}),
            FakeAresResponse(status.HTTP_503_SERVICE_UNAVAILABLE),
        ]

        response = self.client.get(self.url, {"ico": "25596641"})

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["company_name"], "VR Failure s.r.o.")
        self.assertEqual(response.data["representatives"], [])

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
        self.assertEqual(response.data["dic_hint_source"], "ares")
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
        self.assertEqual(response.data["dic_hint_source"], "ares")
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
        self.assertEqual(mock_get.call_count, 3)
