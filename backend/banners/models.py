import io
import uuid

from PIL import Image, ImageOps
from dataclasses import dataclass
from django.db import models
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

TARGET_W, TARGET_H = 1230, 400


def banner_upload_to(_, filename: str) -> str:
    ext = filename.rsplit('.', 1)[-1].lower()
    return f"banners/original/{uuid.uuid4()}.{ext}"


def banner_webp_upload_to(_, __) -> str:
    return f"banners/webp/{uuid.uuid4()}.webp"


@dataclass
class WebpOptions:
    quality: int = 95         # «максимально хорошее» без избыточного веса
    method: int = 6           # максимальная степень сжатия для WebP
    lossless: bool = False    # можно включить True, если нужен lossless


class Banner(models.Model):
    title = models.CharField("Название", max_length=200, blank=True, null=True)
    alt = models.CharField("ALT-текст", max_length=200, blank=True, null=True)
    link_url = models.URLField("Ссылка при клике", blank=True, null=True)

    is_active = models.BooleanField("Активен", default=True)
    sort_order = models.PositiveIntegerField("Порядок", default=0)

    image_original = models.ImageField(
        "Исходное изображение",
        upload_to=banner_upload_to
    )
    image_webp = models.ImageField(
        "Сгенерированный WebP 1230×400",
        upload_to=banner_webp_upload_to,
        blank=True, null=True, editable=False
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("sort_order", "-created_at")
        verbose_name = "Banner"
        verbose_name_plural = "Banners"

    def __str__(self):
        return self.title or f"Banner #{self.pk}"

    # --- Генерация WebP при сохранении ---
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)             # сначала сохраняем оригинал
        if self.image_original and not getattr(self, "_processing", False):
            self._processing = True               # защита от рекурсии
            try:
                self.generate_webp()
            finally:
                self._processing = False
            super().save(update_fields=["image_webp", "updated_at"])

    def generate_webp(self, *, options: WebpOptions = WebpOptions()):
        """
        Resize image to fit into 1230x400 with white padding (keep aspect ratio).
        """
        with default_storage.open(self.image_original.name, "rb") as f:
            im = Image.open(f).convert("RGB")

        # Вписываем в рамку 1230x400 без обрезки (thumbnail сохраняет пропорции)
        im.thumbnail((TARGET_W, TARGET_H), Image.LANCZOS)

        # Создаём белый холст 1230x400
        canvas = Image.new("RGB", (TARGET_W, TARGET_H), (255, 255, 255))

        # Вычисляем координаты для центрирования
        offset_x = (TARGET_W - im.width) // 2
        offset_y = (TARGET_H - im.height) // 2

        # Вставляем картинку в центр холста
        canvas.paste(im, (offset_x, offset_y))

        # Сохраняем в WebP
        buf = io.BytesIO()
        canvas.save(
            buf,
            format="WEBP",
            quality=options.quality,
            method=options.method,
            lossless=options.lossless,
        )
        buf.seek(0)

        webp_path = banner_webp_upload_to(self, None)
        saved_path = default_storage.save(webp_path, ContentFile(buf.read()))
        self.image_webp.name = saved_path
