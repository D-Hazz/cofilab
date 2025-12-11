from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Task

def recalculate_all_rewards(project):
    total_weights = project.tasks.aggregate(total=models.Sum("weight"))["total"] or 1
    for t in project.tasks.all():
        t.reward_sats = int((project.total_budget * float(t.weight)) / float(total_weights))
        t.save(update_fields=["reward_sats"])


@receiver(post_save, sender=Task)
def update_rewards_on_save(sender, instance, **kwargs):
    recalculate_all_rewards(instance.project)


@receiver(post_delete, sender=Task)
def update_rewards_on_delete(sender, instance, **kwargs):
    recalculate_all_rewards(instance.project)
