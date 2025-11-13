from django.test import TestCase
from django.contrib.auth import get_user_model
from projects.models import Project, Task
from payments.models import Payment
from payments.tasks import distribute_rewards

User = get_user_model()

class DistributeRewardsTestCase(TestCase):
    def setUp(self):
        self.manager = User.objects.create(username="manager_user")
        self.receiver = User.objects.create(username="receiver_user")

        self.project = Project.objects.create(
            name="Rewarded Project",
            total_budget=30000,
            manager=self.manager
        )
        # Set validated=True so the task is eligible for reward distribution
        self.task1 = Task.objects.create(project=self.project, title="T1", reward_sats=10000, assigned_to=self.receiver, validated=True) 
        self.task2 = Task.objects.create(project=self.project, title="T2", reward_sats=20000, assigned_to=self.receiver, validated=True)

    # ... rest of the test_distribute_rewards_creates_payments method ...
    def test_distribute_rewards_creates_payments(self):
        result = distribute_rewards(self.project.id)
        self.assertTrue(result)

        payments = Payment.objects.filter(task__project=self.project)
        self.assertEqual(payments.count(), 2)

        total = sum(p.amount_sats for p in payments)
        self.assertEqual(total, 30000)

        for t in [self.task1, self.task2]:
            t.refresh_from_db()
            self.assertTrue(t.rewarded)
