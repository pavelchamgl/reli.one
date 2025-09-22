import io
import uuid

from PIL import Image
from dataclasses import dataclass
from django.db import models
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from sellers.models import SellerProfile

# Целевые размеры
TARGET_W, TARGET_H = 1230, 400                 # desktop
MOBILE_TARGET_W, MOBILE_TARGET_H = 1230, 400    # mobile


# -------- upload_to --------

def banner_upload_to(_, filename: str) -> str:
    """Оригинал (DESKTOP)."""
    ext = filename.rsplit('.', 1)[-1].lower()
    return f"banners/original/{uuid.uuid4()}.{ext}"


def banner_webp_upload_to(_, __) -> str:
    """Готовый WebP (DESKTOP)."""
    return f"banners/webp/{uuid.uuid4()}.webp"


def banner_mobile_upload_to(_, filename: str) -> str:
    """Оригинал (MOBILE)."""
    ext = filename.rsplit('.', 1)[-1].lower()
    return f"banners/original/mobile/{uuid.uuid4()}.{ext}"


def banner_webp_mobile_upload_to(_, __) -> str:
    """Готовый WebP (MOBILE)."""
    return f"banners/webp/mobile/{uuid.uuid4()}.webp"


# -------- options --------

@dataclass
class WebpOptions:
    quality: int = 95       # «очень хорошо» без лишнего веса
    method: int = 6         # степень сжатия WebP
    lossless: bool = False  # можно включить, если нужен lossless


class Banner(models.Model):
    title = models.CharField("Название", max_length=200, blank=True, null=True)
    alt = models.CharField("ALT-текст", max_length=200, blank=True, null=True)
    link_url = models.URLField("Ссылка при клике", blank=True, null=True)
    seller = models.ForeignKey(
        SellerProfile,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="banners",
        verbose_name="Продавец (опционально)",
        help_text="Если задан, баннер относится к конкретному продавцу."
    )

    is_active = models.BooleanField("Активен", default=True)
    sort_order = models.PositiveIntegerField("Порядок", default=0)

    # DESKTOP
    image_original = models.ImageField(
        "Исходное изображение (desktop)",
        upload_to=banner_upload_to
    )
    image_webp = models.ImageField(
        "Сгенерированный WebP 1230×400 (desktop)",
        upload_to=banner_webp_upload_to,
        blank=True, null=True, editable=False
    )

    # MOBILE
    image_original_mobile = models.ImageField(
        "Исходное изображение (mobile)",
        upload_to=banner_mobile_upload_to,
        blank=True, null=True
    )
    image_webp_mobile = models.ImageField(
        "Сгенерированный WebP 1230×400 (mobile)",
        upload_to=banner_webp_mobile_upload_to,
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

    # ----------------- internal helpers -----------------

    @staticmethod
    def _render_on_canvas(src_img: Image.Image, target_w: int, target_h: int) -> Image.Image:
        """
        Вписываем изображение в точный бокс target_w×target_h без обрезки:
        уменьшаем до максимального подходящего размера и центрируем на белом фоне.
        """
        img = src_img.copy().convert("RGB")
        # Масштабирование с сохранением пропорций
        img.thumbnail((target_w, target_h), Image.LANCZOS)

        # Белый холст и центровка
        canvas = Image.new("RGB", (target_w, target_h), (255, 255, 255))
        offset_x = (target_w - img.width) // 2
        offset_y = (target_h - img.height) // 2
        canvas.paste(img, (offset_x, offset_y))
        return canvas

    def _generate_one(
        self,
        *,
        original_field_name: str,
        target_w: int,
        target_h: int,
        upload_to_fn,
        dest_field_name: str,
        options: WebpOptions,
    ) -> bool:
        """
        Генерация одной версии (desktop/mobile) из соответствующего оригинала.
        Возвращает True, если файл был сгенерирован и установлен в поле.
        """
        original_field = getattr(self, original_field_name)
        if not original_field:
            return False

        with default_storage.open(original_field.name, "rb") as f:
            src = Image.open(f).convert("RGB")

        canvas = self._render_on_canvas(src, target_w, target_h)

        buf = io.BytesIO()
        canvas.save(
            buf,
            format="WEBP",
            quality=options.quality,
            method=options.method,
            lossless=options.lossless,
        )
        buf.seek(0)

        webp_path = upload_to_fn(self, None)
        saved_path = default_storage.save(webp_path, ContentFile(buf.read()))

        # Присваиваем .name, чтобы корректно установилось значение FileField
        dest_field = getattr(self, dest_field_name)
        dest_field.name = saved_path
        return True

    def generate_webp(self, *, options: WebpOptions = WebpOptions()) -> list[str]:
        """
        Генерирует WebP для доступных оригиналов (desktop и/или mobile).
        Возвращает список имён полей, которые были обновлены (для update_fields).
        """
        updated: list[str] = []

        # Desktop
        if self._generate_one(
            original_field_name="image_original",
            target_w=TARGET_W,
            target_h=TARGET_H,
            upload_to_fn=banner_webp_upload_to,
            dest_field_name="image_webp",
            options=options,
        ):
            updated.append("image_webp")

        # Mobile
        if self._generate_one(
            original_field_name="image_original_mobile",
            target_w=MOBILE_TARGET_W,
            target_h=MOBILE_TARGET_H,
            upload_to_fn=banner_webp_mobile_upload_to,
            dest_field_name="image_webp_mobile",
            options=options,
        ):
            updated.append("image_webp_mobile")

        return updated

    # --- Автогенерация WebP после сохранения оригиналов ---
    def save(self, *args, **kwargs):
        """
        Сохраняем как обычно, затем — если присутствуют оригиналы — генерируем
        (или регенерируем) соответствующие WebP. Защищаемся от рекурсии флагом.
        """
        super().save(*args, **kwargs)

        if (self.image_original or self.image_original_mobile) and not getattr(self, "_processing", False):
            self._processing = True
            try:
                updated_fields = self.generate_webp()
            finally:
                self._processing = False

            if updated_fields:
                updated_fields.append("updated_at")
                super().save(update_fields=list(set(updated_fields)))
