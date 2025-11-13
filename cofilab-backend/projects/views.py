# cofilab-backend/projects/views.py (Code inchangé)

from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied

from django.db import models

from .models import Project, Task, Profile, Skill # Import des nouveaux modèles
from .serializers import (
    ProjectSerializer, 
    TaskSerializer, 
    ProfileSerializer, 
    SkillSerializer # Import des nouveaux serializers
)
# Assurez-vous que le module 'payments' est accessible et que la tâche Celery est définie
from payments.tasks import distribute_rewards 


# ---------------------------------------------------
# 🌟 PROFILE VIEWSET
# ---------------------------------------------------
class ProfileViewSet(ModelViewSet):
    """
    Gère les opérations CRUD pour les profils.
    - Accès en lecture pour tous.
    - Accès en écriture/modification seulement pour l'utilisateur propriétaire.
    """
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny] # Lisible par tous

    def get_queryset(self):
        # Permet à tous de voir tous les profils
        return Profile.objects.all().select_related('user').prefetch_related('skills')

    def retrieve(self, request, pk=None):
        """ Récupère un profil (par ID du Profile ou par User ID) """
        try:
            profile = self.get_object()
        except Profile.DoesNotExist:
            # Tente de trouver par User ID si le PK n'est pas un Profile ID
            try:
                profile = Profile.objects.get(user__id=pk)
            except Profile.DoesNotExist:
                return Response({'detail': 'Profil non trouvé.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        profile = self.get_object()
        if profile.user != request.user:
            raise PermissionDenied("Vous n'êtes pas autorisé à modifier ce profil.")
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        profile = self.get_object()
        if profile.user != request.user:
            raise PermissionDenied("Vous n'êtes pas autorisé à modifier ce profil.")
        return super().partial_update(request, *args, **kwargs)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='me')
    def my_profile(self, request):
        """ Retourne le profil de l'utilisateur connecté """
        try:
            profile = Profile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except Profile.DoesNotExist:
            return Response({'detail': 'Profil non trouvé pour cet utilisateur.'}, status=status.HTTP_404_NOT_FOUND)


# ---------------------------------------------------
# 🌟 SKILL VIEWSET
# ---------------------------------------------------
class SkillViewSet(ReadOnlyModelViewSet):
    """
    Gère les compétences (lecture seule).
    Permet de récupérer la liste des compétences disponibles.
    """
    serializer_class = SkillSerializer
    queryset = Skill.objects.all()
    permission_classes = [AllowAny]

# ---------------------------------------------------
# 🌟 PROJECT VIEWSET
# ---------------------------------------------------
class ProjectViewSet(ModelViewSet):
    """
    Gère les opérations CRUD pour les projets :
    - Liste publique des projets
    - Liste des projets de l'utilisateur
    - Détails, création, modification et suppression
    """
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]  # accès libre à la lecture

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated:
            # L'utilisateur connecté voit ses propres projets + les projets publics
            return Project.objects.filter(models.Q(manager=user) | models.Q(is_public=True)).distinct().order_by('-created_at')
        else:
            # Visiteur non connecté → uniquement les projets publics
            return Project.objects.filter(is_public=True).order_by('-created_at')

    def perform_create(self, serializer):
        """ Assigne automatiquement le manager au créateur du projet """
        if not self.request.user.is_authenticated:
            raise PermissionDenied("Authentication required to create a project.")
        serializer.save(manager=self.request.user)

    def perform_update(self, serializer):
        """ Vérifie que seul le manager peut modifier """
        project = self.get_object()
        if project.manager != self.request.user:
            raise PermissionDenied("Only the manager can update this project.")
        serializer.save()

    def perform_destroy(self, instance):
        """ Vérifie que seul le manager peut supprimer """
        if instance.manager != self.request.user:
            raise PermissionDenied("Only the manager can delete this project.")
        instance.delete()

    # ---------------------------------------------------
    # 🌟 ACTIONS PERSONNALISÉES
    # ---------------------------------------------------
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_projects(self, request):
        """Retourne uniquement les projets créés par l'utilisateur"""
        projects = Project.objects.filter(manager=request.user).order_by('-created_at')
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def public(self, request):
        """Retourne uniquement les projets publics"""
        projects = Project.objects.filter(is_public=True).order_by('-created_at')
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], permission_classes=[AllowAny])
    def tasks(self, request, pk=None):
        """Liste des tâches liées à un projet spécifique"""
        project = self.get_object()
        tasks = project.tasks.all().order_by('-created_at')
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def search(self, request):
        """Recherche simple par nom de projet"""
        query = request.query_params.get('q', '')
        projects = Project.objects.filter(name__icontains=query)
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)


# ---------------------------------------------------
# 🌟 TASK VIEWSET
# ---------------------------------------------------
class TaskViewSet(ModelViewSet):
    """
    Gère les opérations CRUD sur les tâches d’un projet :
    - Création / modification restreinte au manager du projet
    - Validation avec distribution automatique de récompenses
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated] # Restreint la création aux utilisateurs connectés

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            # L'utilisateur connecté voit les tâches de ses projets
            return Task.objects.filter(project__manager=user).order_by('-created_at')
        else:
            return Task.objects.none()

    def perform_create(self, serializer):
        project = serializer.validated_data.get("project")
        if project.manager != self.request.user:
            raise PermissionDenied("You are not authorized to add tasks to this project.")
        serializer.save()

    def perform_update(self, serializer):
        task = self.get_object()
        if task.project.manager != self.request.user:
            raise PermissionDenied("Only the project manager can update this task.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.project.manager != self.request.user:
            raise PermissionDenied("Only the project manager can delete this task.")
        instance.delete()

    # ---------------------------------------------------
    # 🌟 ACTIONS PERSONNALISÉES
    # ---------------------------------------------------
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_tasks(self, request):
        """Retourne les tâches liées aux projets de l'utilisateur"""
        tasks = self.get_queryset()
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def validate(self, request, pk=None):
        """
        Valide une tâche et déclenche la distribution des récompenses
        """
        task = self.get_object()

        if task.project.manager != request.user:
            return Response(
                {"detail": "Only the project manager can validate tasks."},
                status=status.HTTP_403_FORBIDDEN
            )

        task.validated = True
        task.status = "done"
        task.save()

        # Tentative de distribution automatique (décommenter si Celery est configuré)
        try:
            distribute_rewards.delay(task.project.id)
        except Exception as e:
            print(f"[⚠️] Reward distribution failed: {e}")

        return Response({"status": "validated"}, status=status.HTTP_200_OK)