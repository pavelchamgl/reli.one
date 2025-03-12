import re
from drf_extra_fields.fields import Base64FileField
from django.core.exceptions import ValidationError


class CustomBase64FileField(Base64FileField):
    """
    Класс, наследующий Base64FileField, но реализующий метод get_file_extension,
    чтобы избежать NotImplementedError и обеспечивать проверку MIME-типов.

    Применимо к PDF, DOCX, etc.
    """

    def get_file_extension(self, filename, decoded_file):
        """
        Извлекаем MIME-тип из data-URL и сопоставляем с разрешёнными форматами.
        Если MIME неизвестен – выбрасываем ValidationError.

        Пример data-URL:
          data:application/pdf;base64,JVBERi0xLjUKJeLjz9M...
        """
        match = re.match(r'^data:(?P<mime>.*?);base64,', filename)
        if not match:
            # Не смогли извлечь MIME – бросаем ошибку
            raise ValidationError("Missing or invalid data URI scheme.")

        mime_type = match.group('mime').lower()

        if mime_type == 'application/pdf':
            return 'pdf'
        elif mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            return 'docx'
        else:
            # Не поддержанный MIME-тип
            raise ValidationError(f"Unsupported file type: '{mime_type}'")
