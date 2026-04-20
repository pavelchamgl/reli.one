from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import CustomUser


class CustomerRegistrationPhoneNumberTests(APITestCase):
    def setUp(self):
        self.url = reverse("register_customer")
        self.valid_payload = {
            "first_name": "Ivan",
            "last_name": "Petrov",
            "email": "ivan@example.com",
            "phone_number": "+380501112233",
            "password": "StrongP@ss1",
            "confirm_password": "StrongP@ss1",
        }

    def test_register_customer_saves_phone_number(self):
        response = self.client.post(self.url, data=self.valid_payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["phone_number"], self.valid_payload["phone_number"])

        user = CustomUser.objects.get(email=self.valid_payload["email"])
        self.assertEqual(str(user.phone_number), self.valid_payload["phone_number"])

    def test_register_customer_without_phone_number_returns_bad_request(self):
        payload_without_phone = self.valid_payload.copy()
        payload_without_phone.pop("phone_number")

        response = self.client.post(self.url, data=payload_without_phone, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone_number", response.data)

    def test_register_customer_with_duplicate_phone_number_returns_bad_request(self):
        CustomUser.objects.create_user(
            first_name="Existing",
            last_name="User",
            email="existing@example.com",
            phone_number=self.valid_payload["phone_number"],
            password="StrongP@ss1",
        )

        duplicate_payload = self.valid_payload.copy()
        duplicate_payload["email"] = "new@example.com"

        response = self.client.post(self.url, data=duplicate_payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone_number", response.data)

    def test_register_customer_with_duplicate_email_returns_bad_request(self):
        CustomUser.objects.create_user(
            first_name="Existing",
            last_name="User",
            email=self.valid_payload["email"],
            phone_number="+380509998877",
            password="StrongP@ss1",
        )

        duplicate_payload = self.valid_payload.copy()
        duplicate_payload["phone_number"] = "+380507776655"

        response = self.client.post(self.url, data=duplicate_payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
