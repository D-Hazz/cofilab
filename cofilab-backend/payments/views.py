# cofilab-backend/payments/views.py
from datetime import timezone
import hmac
import hashlib

from decouple import config
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Funding, Payment
from .serializers import ConfirmPaymentSerializer, CreateInvoiceSerializer, FundingSerializer
from django.shortcuts import get_object_or_404
from projects.models import Project, Task
from rest_framework.views import APIView

WEBHOOK_SECRET = config("WEBHOOK_SECRET")

@api_view(["POST"])
@permission_classes([AllowAny])
def payments_webhook(request):
    """
    Webhook attendu du frontend après paiement Breez.
    Payload JSON attendu:
    {
      "project_id": 1,
      "amount_sats": 100000,
      "proof_hash": "abcdef...",
      "wallet_address": "lnbc1...",
      "is_anonymous": false,
      "is_amount_public": true,
      "signature": "<hmac_signature>"
    }
    signature = HMAC_SHA256(WEBHOOK_SECRET, f"{project_id}|{amount_sats}|{proof_hash}")
    """
    data = request.data
    required = ("project_id", "amount_sats", "proof_hash", "wallet_address", "signature")
    if not all(k in data for k in required):
        return Response({"detail": "missing fields"}, status=400)

    project_id = str(data.get("project_id"))
    amount_sats = str(data.get("amount_sats"))
    proof_hash = str(data.get("proof_hash"))
    signature = data.get("signature")

    payload = f"{project_id}|{amount_sats}|{proof_hash}".encode()
    expected = hmac.new(WEBHOOK_SECRET.encode(), payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        return Response({"detail": "invalid signature"}, status=403)

    # validate project exists
    project = get_object_or_404(Project, id=int(project_id))

    funding = Funding.objects.create(
        project=project,
        wallet_address=data.get("wallet_address"),
        amount_sats=int(data.get("amount_sats")),
        is_anonymous=bool(data.get("is_anonymous", False)),
        is_amount_public=bool(data.get("is_amount_public", True)),
        proof_hash=proof_hash,
    )

    # Update project's total_budget atomically
    project.total_budget = (project.total_budget or 0) + funding.amount_sats
    project.save(update_fields=["total_budget"])

    serializer = FundingSerializer(funding)
    return Response(serializer.data, status=201)

@api_view(["POST"])
@permission_classes([AllowAny])
def funding_webhook(request):
    data = request.data
    required = ("project_id", "amount_sats", "proof_hash", "wallet_address", "signature")

    if not all(k in data for k in required):
        return Response({"detail": "missing fields"}, status=400)

    payload = f"{data['project_id']}|{data['amount_sats']}|{data['proof_hash']}"
    expected = hmac.new(WEBHOOK_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected, data["signature"]):
        return Response({"detail": "invalid signature"}, status=403)

    project = get_object_or_404(Project, id=data["project_id"])

    funding = Funding.objects.create(
        project=project,
        wallet_address=data["wallet_address"],
        amount_sats=data["amount_sats"],
        proof_hash=data["proof_hash"],
        is_anonymous=data.get("is_anonymous", False),
        is_amount_public=data.get("is_amount_public", True)
    )

    project.total_budget += funding.amount_sats
    project.save()

    return Response({"status": "ok", "funding_id": funding.id}, status=201)

class CreateFundingView(APIView):
    def post(self, request):
        serializer = FundingSerializer(data=request.data)
        if serializer.is_valid():
            funding = serializer.save()
            return Response({
                "message": "Funding enregistré",
                "proof_hash": funding.proof_hash
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class CreateFundingInvoiceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        project_id = request.data.get("project_id")
        amount_sats = request.data.get("amount_sats")

        if not project_id or not amount_sats:
            return Response({"detail": "Missing fields"}, status=400)

        project = get_object_or_404(Project, id=project_id)

        # Simule une facture (plus tard → Breez)
        import os, time, hashlib
        seed = f"{amount_sats}-{time.time()}-{os.urandom(8).hex()}"
        invoice_id = hashlib.sha256(seed.encode()).hexdigest()[:24]
        invoice = f"lnbc{amount_sats}n1p{invoice_id}"

        # OPTION : stocker temporairement une facture
        funding = Funding.objects.create(
            project=project,
            wallet_address="pending",
            amount_sats=amount_sats,
            proof_hash="pending",
        )

        return Response({
            "invoice": invoice,
            "invoice_id": invoice_id,
            "funding_id": funding.id
        })

class VerifyFundingPaymentView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, invoice_id):
        # MOCK
        is_paid = True
        if not is_paid:
            return Response({"status": "pending"})

        return Response({"status": "settled"})


class ConfirmPaymentView(APIView):
    def post(self, request):
        serializer = ConfirmPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment_id = serializer.validated_data["payment_id"]
        payment = Payment.objects.get(id=payment_id)

        payment.status = "paid"
        payment.paid_at = timezone.now()
        payment.save()

        # Déduction du projet
        project = payment.task.project
        project.current_balance -= payment.amount_sats
        project.save()

        return Response({"status": "ok", "message": "Payment confirmé"})

class CreatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        task_id = serializer.validated_data["task_id"]
        amount_sats = serializer.validated_data["amount_sats"]

        # Générer une facture LN vraiment unique (mock)
        import os, time, hashlib
        seed = f"{amount_sats}-{time.time()}-{os.urandom(8).hex()}"
        ln_invoice = f"lnbc{amount_sats}n1p{hashlib.sha256(seed.encode()).hexdigest()[:50]}"

        task = get_object_or_404(Task, id=task_id)
        user = task.assigned_to

        payment = Payment.objects.create(
            task=task,
            user=user,
            amount_sats=amount_sats,
            ln_invoice=ln_invoice,
            status="pending"
        )

        return Response({
            "payment_id": payment.id,
            "ln_invoice": ln_invoice,
            "amount_sats": amount_sats,
            "status": "pending"
        }, status=201)

class VerifyPaymentView(APIView):
    permission_classes = [AllowAny]  # car Breez callback peut ne pas avoir de token

    def get(self, request, invoice_id):
        try:
            payment = Payment.objects.get(ln_invoice=invoice_id)
        except Payment.DoesNotExist:
            return Response({"detail": "Payment not found"}, status=404)

        # Déjà payé
        if payment.status == "paid":
            return Response({"status": "paid"})

        # --- MOCK Vérification Breez SDK ---
        # (À remplacer par un appel réel plus tard)
        is_paid = True  # On simule la réussite pour l'instant
        # ------------------------------------

        if not is_paid:
            return Response({"status": "pending"})

        # Marquer comme payé
        payment.status = "paid"
        payment.paid_at = timezone.now()
        payment.save()

        # Déduire du projet
        project = payment.task.project
        project.current_balance -= payment.amount_sats
        project.save()

        return Response({
            "status": "paid",
            "payment_id": payment.id,
            "task_id": payment.task.id,
            "amount_sats": payment.amount_sats
        })

# Test view
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class CreateInvoicePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        return Response({
            "payment_id": payment.id,
            "ln_invoice": payment.ln_invoice,
            "amount_sats": payment.amount_sats,
            "status": payment.status
        })
    @swagger_auto_schema(
        operation_description="Créer une facture Lightning pour un paiement de tâche",
        request_body=CreateInvoiceSerializer,
        responses={200: openapi.Response(
            description="Détails de la facture créée",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "payment_id": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID du paiement"),
                    "ln_invoice": openapi.Schema(type=openapi.TYPE_STRING, description="Facture Lightning"),
                    "amount_sats": openapi.Schema(type=openapi.TYPE_INTEGER, description="Montant en satoshis"),
                }
            )
        )}
    )

    def post(self, request):
        serializer = CreateInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        return Response({
            "payment_id": payment.id,
            "ln_invoice": payment.ln_invoice,
            "amount_sats": payment.amount_sats
        })
    

class PaymentHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        # 1. Récupération des paiements
        payments = Payment.objects.filter(user_id=user_id).order_by("-id")

        # 2. Vérification des données
        if not payments.exists():
            # Renvoie un statut 200 (OK) mais avec un message clair si l'historique est vide
            return Response({
                "detail": f"Aucun paiement trouvé pour l'utilisateur ID {user_id}.",
                "data": [] # Assurez-vous d'inclure une liste vide pour la cohérence du frontend
            }, status=status.HTTP_200_OK)

        # 3. Sérialisation et formatage si des paiements existent
        data = [
            {
                "id": p.id,
                "task": p.task.title,
                "amount_sats": p.amount_sats,
                "status": p.status,
                "ln_invoice": p.ln_invoice,
                "paid_at": p.paid_at
            }
            for p in payments
        ]
        
        # Renvoie la liste des données avec un statut 200
        return Response(data, status=status.HTTP_200_OK)
    @swagger_auto_schema(
        operation_description="Récupérer l'historique des paiements pour un utilisateur donné",
        responses={200: openapi.Response(
            description="Liste des paiements",
            schema=openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "id": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID du paiement"),
                        "task": openapi.Schema(type=openapi.TYPE_STRING, description="Titre de la tâche"),
                        "amount_sats": openapi.Schema(type=openapi.TYPE_INTEGER, description="Montant en satoshis"),
                        "status": openapi.Schema(type=openapi.TYPE_STRING, description="Statut du paiement"),
                        "ln_invoice": openapi.Schema(type=openapi.TYPE_STRING, description="Facture Lightning"),
                        "paid_at": openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME, description="Date de paiement"),
                    }
                )
            )
        )}
    )
    def get(self, request, user_id):
        payments = Payment.objects.filter(user_id=user_id).order_by("-id")
        data = [
            {
                "id": p.id,
                "task": p.task.title,
                "amount_sats": p.amount_sats,
                "status": p.status,
                "ln_invoice": p.ln_invoice,
                "paid_at": p.paid_at
            }
            for p in payments
        ]
        return Response(data)

