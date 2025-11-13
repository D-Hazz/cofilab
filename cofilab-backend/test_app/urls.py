django.urls from django import views
import path
from .views import CreateUserView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("projects/", views.ProjectListView.as_view(), name="project-list"),
    path("projects/<int:pk>/", views.ProjectDetailView.as_view(), name="project-detail"),
    path("project/delete/<int:pk>/", views.ProjectDeleteView.as_view(), name="project-delete"),
    
]