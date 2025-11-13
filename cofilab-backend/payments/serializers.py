from rest_framework import serializers
from .models import Funding, Payment, FunderManager

class FundingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funding
        fields = "__all__"

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"

class FunderManagerSerializer(serializers.ModelSerializer):
    class Meta:
        model = FunderManager
        fields = "__all__"
