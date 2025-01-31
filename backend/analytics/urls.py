from django.urls import path

from .views import WarehouseOrdersStatsView


urlpatterns = [
    path('statistics/warehouses/', WarehouseOrdersStatsView.as_view(), name='warehouse-orders-statistics'),
]