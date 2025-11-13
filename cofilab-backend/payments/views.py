import hmac
import hashlib
from decouple import config
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Funding
from .serializers import FundingSerializer
from django.shortcuts import get_object_or_404
from projects.models import Project

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
