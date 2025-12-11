# /home/zedhub/cofilab/cofilab-backend/projects/urls.py

from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import InvitationViewSet, InvitationViewSet, NotificationViewSet, ProfileViewSet, ProjectViewSet, RegisterView, SkillViewSet, TaskViewSet
from .views import ProjectRewardRecalculateView

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'invitations', InvitationViewSet, basename='invitation')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'tasks', TaskViewSet, basename='task')
# ✅ Nouveaux ViewSets pour la gestion du profil
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'skills', SkillViewSet, basename='skill')

urlpatterns = [
    # Route d'inscription professionnelle (création de compte)
    path('register/', RegisterView.as_view(), name='register'), 
    path("recalculate-rewards/<int:project_id>/", ProjectRewardRecalculateView.as_view(), name="recalculate-rewards"),

    # Le reste des routes du router
    *router.urls
]
from django.urls import path


