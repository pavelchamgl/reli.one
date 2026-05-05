from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

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


class LogoutViewTests(APITestCase):
    """BE-4: CustomLogoutView должен возвращать 200, а не 500, при невалидном токене."""

    def setUp(self):
        self.url = reverse("logout")
        self.user = CustomUser.objects.create_user(
            first_name="Test",
            last_name="User",
            email="logout@example.com",
            password="StrongP@ss1",
        )
        self.client.force_authenticate(user=self.user)

    def test_logout_with_valid_token_returns_200(self):
        refresh = RefreshToken.for_user(self.user)
        response = self.client.post(self.url, {"refresh_token": str(refresh)}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

    def test_logout_with_invalid_token_returns_200_not_500(self):
        """Невалидный токен не должен вызывать 500 (BE-4)."""
        response = self.client.post(
            self.url,
            {"refresh_token": "this.is.not.a.valid.token"},
            format="json",
        )
        # Logout всегда успешен — даже если токен уже невалиден.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

    def test_logout_with_expired_token_returns_200_not_500(self):
        """Истёкший (blacklisted) токен не должен вызывать 500."""
        refresh = RefreshToken.for_user(self.user)
        token_str = str(refresh)
        # Blacklist токен напрямую, чтобы имитировать второй logout.
        refresh.blacklist()

        response = self.client.post(
            self.url, {"refresh_token": token_str}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout_without_token_returns_400(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
