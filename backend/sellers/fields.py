import re
import uuid
import magic
import base64

from rest_framework import serializers
from drf_extra_fields.fields import Base64ImageField
from django.core.files.base import ContentFile


class CustomBase64FileField(serializers.FileField):
    """
    Принимает строку data:...;base64,... и декодирует в ContentFile.
    Не делает проверку MIME — просто декодирование.
    """
    def to_internal_value(self, data):
        pattern = re.compile(r'^data:(?P<mime>[^;]+);base64,(?P<base64data>.+)$')
        match = pattern.match(data)
        if not match:
            raise serializers.ValidationError("Not a valid data URI scheme.")

        b64data = match.group('base64data')
        try:
            decoded_file = base64.b64decode(b64data)
        except Exception as e:
            raise serializers.ValidationError(f"Base64 decode error: {str(e)}")

        return ContentFile(decoded_file)


class RestrictedBase64ImageField(Base64ImageField):
    ALLOWED_MIMES = {
        "image/jpeg": "jpeg",
        "image/png": "png",
        "image/webp": "webp",
    }

    def to_internal_value(self, data):
        file_obj = super().to_internal_value(data)

        chunk = file_obj.read(2048)
        file_obj.seek(0)

        real_mime = magic.from_buffer(chunk, mime=True)
        if real_mime not in self.ALLOWED_MIMES:
            raise serializers.ValidationError(
                "Unsupported image type. Only JPEG, PNG and WebP are allowed."
            )

        extension = self.ALLOWED_MIMES[real_mime]
        file_obj.name = f"{uuid.uuid4()}.{extension}"

        return file_obj
