# payments/tasks.py
import binascii
import os
from django.utils import timezone
from django.contrib.auth import get_user_model
from projects.models import Project, Task
from payments.models import Payment
# payments/tasks.py
from django.db import transaction

User = get_user_model()


def distribute_rewards(project_id: int):
    """
    Distribue les récompenses aux utilisateurs assignés aux tâches validées
    d'un projet. Retourne True si distribution effectuée.
    """
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return False

    tasks = Task.objects.filter(project=project, rewarded=False, reward_sats__gt=0)

    created_count = 0
    for task in tasks:
        if not getattr(task, "assigned_to", None):
            continue

        Payment.objects.create(
            task=task,
            user=task.assigned_to,
            ln_invoice=f"ln_mock_{task.id}",
            status="paid",
            paid_at=timezone.now(),
            amount_sats=task.reward_sats,  # ajout explicite pour total
        )

        task.rewarded = True
        task.save(update_fields=["rewarded"])
        created_count += 1

    return created_count > 0

# Assuming you have an external service/utility to create LN invoices
# from payments.utils import create_lightning_invoice 

def create_lightning_invoice(amount_sats, memo):
    """Placeholder for a real LN invoice creation utility."""
    # In a real app, this talks to LND/LNbits/Breez etc.
    # We will return a fake invoice for the sake of the test.
    return f"lnbc100u1pn00000000000000000000000000000000{binascii.hexlify(os.urandom(32)).decode()}"