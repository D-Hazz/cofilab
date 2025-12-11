from django.test import TestCase
from django.contrib.auth import get_user_model
from projects.models import Project, Task

User = get_user_model()

class RewardCalculationTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(username="zed")
        self.project = Project.objects.create(
            name="Test Project",
            manager=self.user,
            total_budget=10000
        )

    def test_rewards_are_recalculated(self):
        Task.objects.create(project=self.project, title="A", weight=1)
        Task.objects.create(project=self.project, title="B", weight=2)

        t1 = self.project.tasks.get(title="A")
        t2 = self.project.tasks.get(title="B")

        self.assertEqual(t1.reward_sats, 3333)
        self.assertEqual(t2.reward_sats, 6666)
