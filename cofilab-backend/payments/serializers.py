# cofilab-backend/payments/serializers.py
from pytz import timezone
from rest_framework import serializers
from .models import Funding, Payment, FunderManager
from projects.models import Task, Project
from rest_framework.views import APIView
from rest_framework.response import Response
import hashlib

def generate_temp_invoice(amount_sats):
    # Mocked function to generate a temporary invoice
    return f"lnbc{amount_sats}n1p0xyzpp5qqqsyqcyq5rqwzqfpp5qqqsyqcyq5rqwzqfpp5qqqsyqcyq5rqwzqfpp5qqqsyqcyq5rqwzqfpp5qqqsyqcyq5rqwzqfpp5qqqsyqcyq5rq"


class FundingSerializer(serializers.Serializer):
    project_id = serializers.IntegerField()
    wallet_address = serializers.CharField()
    amount_sats = serializers.IntegerField()
    is_anonymous = serializers.BooleanField(default=False)
    is_amount_public = serializers.BooleanField(default=True)

    def create(self, validated_data):
        project = Project.objects.get(id=validated_data["project_id"])

        # Générer la preuve SHA-256
        raw_str = f"{project.id}-{validated_data['wallet_address']}-{validated_data['amount_sats']}"
        proof_hash = hashlib.sha256(raw_str.encode()).hexdigest()

        funding = Funding.objects.create(
            project=project,
            wallet_address=validated_data["wallet_address"],
            amount_sats=validated_data["amount_sats"],
            is_anonymous=validated_data["is_anonymous"],
            is_amount_public=validated_data["is_amount_public"],
            proof_hash=proof_hash,
        )

        # Mise à jour du solde du projet
        project.current_balance += validated_data["amount_sats"]
        project.total_budget += validated_data["amount_sats"]
        project.save()

        return funding


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"

class FunderManagerSerializer(serializers.ModelSerializer):
    class Meta:
        model = FunderManager
        fields = "__all__"

class CreateInvoiceSerializer(serializers.Serializer):
    task_id = serializers.IntegerField()
    amount_sats = serializers.IntegerField()

"""
class CreateInvoiceSerializer(serializers.Serializer):
    task_id = serializers.IntegerField()
    amount_sats = serializers.IntegerField()
    ln_invoice = serializers.CharField()  # envoyée depuis Breez SDK

    def create(self, validated_data):
        task = Task.objects.get(id=validated_data["task_id"])
        user = task.assigned_to

        payment = Payment.objects.create(
            task=task,
            user=user,
            ln_invoice=validated_data["ln_invoice"],
            amount_sats=validated_data["amount_sats"],
        )

        return payment
"""

class ConfirmPaymentSerializer(serializers.Serializer):
    payment_id = serializers.IntegerField()

class ConfirmPaymentView(APIView):
    def post(self, request):
        serializer = ConfirmPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = Payment.objects.get(id=serializer.validated_data["payment_id"])
        payment.status = "paid"
        payment.paid_at = timezone.now()
        payment.save()

        # Déduit du solde du projet
        project = payment.task.project
        project.current_balance -= payment.amount_sats
        project.save()

        return Response({"status": "ok"})
