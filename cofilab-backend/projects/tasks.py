from celery import shared_task
from django.db import transaction
from .models import Project, Task
from payments.models import Payment

@shared_task
def distribute_rewards(project_id):
    project = Project.objects.get(id=project_id)
    tasks = Task.objects.filter(project=project, validated=True)
    total_weight = sum([float(t.weight) for t in tasks]) or 1.0

    for task in tasks:
        reward_share = int((float(task.weight) / total_weight) * project.total_budget)
        task.reward_sats = reward_share
        task.save()
        # Create Payment entry to be processed by Breez frontend/server
        if task.assigned_to:
            Payment.objects.create(
                task=task,
                user=task.assigned_to,
                ln_invoice="",  # frontend will request invoice from Breez and patch
                status="pending"
            )
    return {"status":"ok", "project_id": project_id}
