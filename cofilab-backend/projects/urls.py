# cofilab-backend/projects/urls.py

from rest_framework.routers import DefaultRouter
from .views import ProfileViewSet, ProjectViewSet, SkillViewSet, TaskViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
# ✅ Nouveaux ViewSets
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'skills', SkillViewSet, basename='skill')

urlpatterns = router.urls
