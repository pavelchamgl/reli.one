from django.conf import settings
from django.core.exceptions import ValidationError
from django.template.defaultfilters import filesizeformat

LICENSE_ALLOWED_EXTENSIONS = (".pdf", ".jpg", ".jpeg", ".png", ".webp")

LICENSE_ALLOWED_MIMES = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}

LICENSE_UNSUPPORTED_TYPE_MESSAGE = "Unsupported file type. Allowed: PDF, JPG, PNG, WebP."
LICENSE_EMPTY_FILE_MESSAGE = "The uploaded file is empty."
LICENSE_SIZE_EXCEEDED_MESSAGE = (
    f"File size exceeds the maximum allowed size ({filesizeformat(settings.MAX_UPLOAD_SIZE)})."
)


def validate_license_file_extension(value):
    import os

    ext = os.path.splitext(value.name)[1].lower()
    if ext not in LICENSE_ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Invalid file format. Valid formats: {', '.join(LICENSE_ALLOWED_EXTENSIONS)}"
        )


def validate_license_file_size(value):
    if value.size > settings.MAX_UPLOAD_SIZE:
        raise ValidationError(LICENSE_SIZE_EXCEEDED_MESSAGE)
