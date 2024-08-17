from django.db import models


class NewsImage(models.Model):
    image = models.ImageField(upload_to='base_product_images/')

    def __str__(self):
        return str(self.image)
# Create your models here.
class News(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    image = models.ManyToManyField(NewsImage, null=True, blank=True)

    class Meta:
        verbose_name = 'News'
        verbose_name_plural = 'News'
