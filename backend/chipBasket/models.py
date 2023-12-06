from django.db import models
from django.utils import timezone
import datetime
from product.models import BaseProduct
from django.contrib.auth import get_user_model


class ChipBasket(models.Model):
    date = models.DateField(default=datetime.date.today)

    def __str__(self):
        User = get_user_model()
        owner = User.objects.get(chips_basket=self)
        return f"User: {str(owner.first_name)}: email: {str(owner.email)}"



    def calculate_total_price(self):
        total_price = sum(item.product.price * item.quantity for item in self.basketitem_set.all())
        return total_price

class BasketItem(models.Model):
    basket = models.ForeignKey(ChipBasket, on_delete=models.CASCADE, related_name='basketitem_set')
    product = models.ForeignKey(BaseProduct, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        User = get_user_from_chips_basket(self.basket)
        return f"{str(User.email)} {self.product.name} {self.quantity}"




def get_user_from_chips_basket(chips_basket):
    # Ваша логика получения пользователя на основе chips_basket
    # Возможно, вам потребуется выполнить дополнительные запросы к базе данных или использовать другие данные для определения пользователя
    return chips_basket.user