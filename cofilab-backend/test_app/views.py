from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Project, Task
from .serializers import ProjectSerializer, TaskSerializer
# Create your views here.

class ProjectListCreate(generics.ListCreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]  # Permet à n'importe qui de voir la liste des projets

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Project.objects.filter(manager=user).order_by('-created_at')
        else:
            return Project.objects.filter(is_public=True).order_by('-created_at')

    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(manager=self.request.user)
        else:
            print("Serializer not valid")
            print(serializer.errors)

class ProjectDelete(generics.DestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]  # Seul un utilisateur authentifié peut supprimer un projet

    def get_queryset(self):
        user = self.request.user
        return Project.objects.filter(manager=user)