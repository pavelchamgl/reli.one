from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from chipBasket.models import ChipBasket

User = get_user_model()

@receiver(post_save, sender=User)
def create_chips_basket(sender, instance, created, **kwargs):
    if created:
        chips_basket = ChipBasket.objects.create(user=instance)
        instance.chips_basket = chips_basket
        instance.save()


