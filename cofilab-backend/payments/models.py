from django.db import models

# Create your models here.
# payments/models.py
from django.db import models
from django.conf import settings
from projects.models import Task, Project

User = settings.AUTH_USER_MODEL

class FunderManager(models.Model):
    name = models.CharField(max_length=100)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="funding_pools")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="funding_managers")
    total_contributed = models.BigIntegerField(default=0)  # sats
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Funding(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="fundings")
    wallet_address = models.CharField(max_length=255)
    amount_sats = models.PositiveBigIntegerField()
    is_anonymous = models.BooleanField(default=False)
    is_amount_public = models.BooleanField(default=True)
    proof_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

class Payment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="payments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    ln_invoice = models.CharField(max_length=255)
    amount_sats = models.PositiveBigIntegerField(default=0) # Add this line
    status = models.CharField(max_length=30, choices=[("pending", "En attente"), ("paid", "Payé")], default="pending")
    paid_at = models.DateTimeField(null=True, blank=True)
