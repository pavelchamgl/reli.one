from abc import ABC, abstractmethod

class DeliveryService(ABC):
    @abstractmethod
    def estimate(self, *, country: str, weight_grams: int, delivery_type: str) -> dict:
        pass

    @abstractmethod
    def create_shipment(self, *, order, warehouse) -> dict:
        pass
