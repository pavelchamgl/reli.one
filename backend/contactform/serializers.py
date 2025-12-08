from rest_framework import serializers
from .models import Contact, ContactMessage


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = [
            "first_name",
            "last_name",
            "email",
            "business_type",
            "message",
        ]

    def validate_message(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Message is too short.")
        return value