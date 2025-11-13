from django.test import TestCase, Client
from django.urls import reverse
from decouple import config
import hmac, hashlib
from projects.models import Project
from payments.models import Funding
from django.contrib.auth import get_user_model

User = get_user_model()

class WebhookHMACTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.project = Project.objects.create(name="T1", description="d", manager=User.objects.create(username="mgr"), total_budget=0)
        self.url = reverse("payments-webhook")
        self.webhook_secret = config("WEBHOOK_SECRET")
        # For tests, if WEBHOOK_SECRET is not set in env, set a fallback
        if not self.webhook_secret:
            self.webhook_secret = "testsecret"

    def test_valid_webhook_creates_funding_and_updates_project(self):
        project_id = str(self.project.id)
        amount_sats = "50000"
        proof_hash = "deadbeef"
        payload = f"{project_id}|{amount_sats}|{proof_hash}".encode()
        signature = hmac.new(self.webhook_secret.encode(), payload, hashlib.sha256).hexdigest()

        data = {
            "project_id": self.project.id,
            "amount_sats": int(amount_sats),
            "proof_hash": proof_hash,
            "wallet_address": "lnbc1test",
            "is_anonymous": False,
            "is_amount_public": True,
            "signature": signature,
        }

        resp = self.client.post(self.url, data, content_type="application/json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(Funding.objects.count(), 1)
        funding = Funding.objects.first()
        self.project.refresh_from_db()
        self.assertEqual(self.project.total_budget, funding.amount_sats)

    def test_invalid_signature_rejected(self):
        data = {
            "project_id": self.project.id,
            "amount_sats": 1000,
            "proof_hash": "abc",
            "wallet_address": "lnbc1x",
            "signature": "bad_signature"
        }
        resp = self.client.post(self.url, data, content_type="application/json")
        self.assertEqual(resp.status_code, 403)
