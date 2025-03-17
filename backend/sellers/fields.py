import re
import base64
from rest_framework import serializers
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
