import re
import logging
from drf_extra_fields.fields import Base64FileField
from rest_framework.serializers import ValidationError

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}


class CustomBase64FileField(Base64FileField):
    """
    Класс, наследующий Base64FileField, но реализующий метод get_file_extension.
    """

    def get_file_extension(self, filename, decoded_file):
        """
        Извлекаем MIME-тип из data-URL и проверяем на разрешённые.
        """
        logger.debug("DEBUG filename = %r", filename)

        match = re.match(r'^data:(?P<mime>.*?);base64,', filename)
        if not match:
            raise ValidationError("Missing or invalid data URI scheme.")

        mime_type = match.group('mime').lower()

        if mime_type not in ALLOWED_MIME_TYPES:
            raise ValidationError(f"Unsupported file type: '{mime_type}'")

        return ALLOWED_MIME_TYPES[mime_type]
