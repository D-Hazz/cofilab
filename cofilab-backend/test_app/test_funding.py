from django.test import TestCase
from django.contrib.auth import get_user_model
from projects.models import Project
from payments.models import Funding
import hashlib

User = get_user_model()

class FundingTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(username="zed")
        self.project = Project.objects.create(
            name="X Project",
            manager=self.user,
            total_budget=10000
        )

    def test_create_funding(self):
        data = "wallet123:500"
        proof = hashlib.sha256(data.encode()).hexdigest()

        f = Funding.objects.create(
            project=self.project,
            wallet_address="wallet123",
            amount_sats=500,
            proof_hash=proof
        )

        self.assertEqual(f.amount_sats, 500)
        self.assertEqual(f.proof_hash, proof)
        self.project.refresh_from_db()
        self.assertEqual(self.project.total_budget, 10500)