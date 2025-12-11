from django.shortcuts import get_object_or_404
from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied

from django.db import IntegrityError, models
from django.db.models import Q
from django.utils import timezone
from .utils import create_notification
# Importez tous les modèles et serializers nécessaires
from .models import Invitation, Notification, Profile, Skill, Project, Task 
from .serializers import (
    InvitationSerializer,
    NotificationSerializer,
    RegisterSerializer, 
    ProfileSerializer, 
    SkillSerializer, 
    ProjectSerializer, 
    TaskSerializer
)
# Assurez-vous que le module 'payments' est accessible (même si commenté)
# from payments.tasks import distribute_rewards 

User = get_user_model()

# ===================================================
# 🌟 VUES D'AUTHENTIFICATION
# ===================================================
class RegisterView(generics.CreateAPIView):
    """
    Vue d'inscription professionnelle (Création de l'utilisateur).
    Renvoie les données du profil initial créé via le signal.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        # 1. Création de l'utilisateur
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save() # Le signal crée automatiquement le Profile

        # 2. Sérialisation du profil initial et renvoi
        profile_serializer = ProfileSerializer(user.profile)
        
        return Response(profile_serializer.data, status=status.HTTP_201_CREATED)


# ===================================================
# 🌟 PROFILE VIEWSET
# ===================================================
class ProfileViewSet(viewsets.ModelViewSet):
    """
    Gère les opérations CRUD pour les profils.
    - Accès en lecture pour tous (AllowAny).
    - Accès en écriture/modification seulement pour l'utilisateur propriétaire.
    """
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny] # Lisible par tous

    def get_queryset(self):
        # Permet à tous de voir tous les profils (optimisé avec select/prefetch)
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

    def perform_update(self, serializer):
        """ Vérifie que seul le propriétaire peut modifier (utilisé par PUT) """
        if serializer.instance.user != self.request.user:
            raise PermissionDenied("Vous n'êtes pas autorisé à modifier ce profil.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        """ Vérification d'autorisation pour PUT (Full Update) """
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """ Vérification d'autorisation pour PATCH (Partial Update/Complétion) """
        profile = self.get_object()
        if profile.user != request.user:
            raise PermissionDenied("Vous n'êtes pas autorisé à modifier ce profil.")
        return super().partial_update(request, *args, **kwargs)
    
    # Action 'me' surchargée pour gérer à la fois GET et PATCH du profil courant
    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated], url_path='me')
    def me(self, request):
        """ Récupère ou met à jour le profil de l'utilisateur connecté. """
        try:
            profile = request.user.profile
        except Profile.DoesNotExist:
            return Response({'detail': 'Profil non trouvé pour cet utilisateur.'}, status=status.HTTP_404_NOT_FOUND)
        
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            # Utiliser request.data et passer le profil existant pour la mise à jour
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)


# ===================================================
# 🌟 SKILL VIEWSET
# ===================================================
class SkillViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Gère les compétences (lecture seule).
    Permet de récupérer la liste des compétences disponibles.
    """
    serializer_class = SkillSerializer
    queryset = Skill.objects.all()
    permission_classes = [AllowAny]


# ===================================================
# 🌟 PROJECT VIEWSET
# ===================================================
class ProjectViewSet(viewsets.ModelViewSet):
    """
    Gère les opérations CRUD pour les projets.
    """
    queryset = Project.objects.all().select_related('manager')
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny] 

    # -----------------------------------------------------
    # ✅ ACTION : Inviter un utilisateur à contribuer
    # -----------------------------------------------------
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def invite(self, request, pk=None):
        project = self.get_object()
        invited_user_id = request.data.get("user_id")

        if not invited_user_id:
            return Response({"detail": "user_id est requis."}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier si celui qui invite est le manager du projet
        if request.user != project.manager:
            raise PermissionDenied("Vous n'êtes pas le manager du projet.")

        try:
            invited_user = User.objects.get(id=invited_user_id)
        except User.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # 👉 Ici tu peux ajouter l'enregistrement d'une invitation en base
        # ou simplement renvoyer OK.
        return Response({
            "message": f"Invitation envoyée à {invited_user.username} pour rejoindre {project.name}"
        }, status=status.HTTP_200_OK)

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

    # --- ACTIONS PERSONNALISÉES ---
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


# ===================================================
# 🌟 TASK VIEWSET
# ===================================================
class TaskViewSet(viewsets.ModelViewSet):
    """
    Gère les opérations CRUD sur les tâches d’un projet.
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

    # --- ACTIONS PERSONNALISÉES ---
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_tasks(self, request):
        """Retourne les tâches liées aux projets de l'utilisateur"""
        tasks = self.get_queryset()
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def validate(self, request, pk=None):
        """
        Valide une tâche et déclenche la distribution des récompenses (si Celery est configuré).
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

        # Distribution automatique (décommenter et configurer si nécessaire)
        # try:
        #     distribute_rewards.delay(task.project.id)
        # except Exception as e:
        #     print(f"[⚠️] Reward distribution failed: {e}")

        return Response({"status": "validated"}, status=status.HTTP_200_OK)
    

class InvitationViewSet(viewsets.ModelViewSet):
    queryset = Invitation.objects.all().select_related('sender','recipient','project')
    serializer_class = InvitationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # rendre possible l'utilisation des paramètres ?type=sent/received
        q = Invitation.objects.filter(models.Q(sender=user) | models.Q(recipient=user))
        return q.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        # payload attendu: { "project_id": <id>, "recipient_id": <id> }
        project_id = request.data.get('project_id') or request.data.get('project')
        recipient = None
        try:
            recipient = int(request.data.get('recipient_id') or request.data.get('recipient'))
        except Exception:
            pass

        if not project_id or not recipient:
            return Response({"detail": "project_id et recipient_id requis."}, status=status.HTTP_400_BAD_REQUEST)

        project = get_object_or_404(Project, id=project_id)

        # permission: seul manager peut inviter
        if request.user != project.manager:
            return Response({"detail": "Vous n'êtes pas le manager du projet."}, status=status.HTTP_403_FORBIDDEN)

        # cannot invite self
        if recipient == request.user.id:
            return Response({"detail": "Vous ne pouvez pas vous inviter vous-même."}, status=status.HTTP_400_BAD_REQUEST)

        # create invitation with duplicate prevention
        try:
            inv = Invitation.objects.create(project=project, sender=request.user, recipient_id=recipient)
        except IntegrityError:
            return Response({"detail": "Une invitation est déjà en attente ou existe pour cet utilisateur et projet."}, status=status.HTTP_400_BAD_REQUEST)

        # create notification
        try:
            create_notification(
                user=inv.recipient,
                title="Nouvelle invitation",
                message=f"Vous avez été invité à rejoindre le projet « {project.name} »",
                type="invitation",
            )
        except Exception:
            pass

        serializer = self.get_serializer(inv)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def accept(self, request, pk=None):
        inv = get_object_or_404(Invitation, pk=pk)
        # only recipient can accept
        if inv.recipient != request.user:
            return Response({"detail": "Seul le destinataire peut accepter."}, status=status.HTTP_403_FORBIDDEN)
        if inv.status != Invitation.STATUS_PENDING:
            return Response({"detail": "Invitation non en attente."}, status=status.HTTP_400_BAD_REQUEST)

        inv.status = Invitation.STATUS_ACCEPTED
        inv.save()

        # Ici : ajouter l'utilisateur au projet (selon ta logique).
        # Exemple : si tu as une relation ManyToMany contributors:
        # inv.project.contributors.add(inv.recipient)

        create_notification(inv.sender, "Invitation acceptée", f"{inv.recipient.username} a accepté l'invitation pour {inv.project.name}")

        serializer = self.get_serializer(inv)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        inv = get_object_or_404(Invitation, pk=pk)
        if inv.recipient != request.user:
            return Response({"detail": "Seul le destinataire peut rejeter."}, status=status.HTTP_403_FORBIDDEN)
        if inv.status != Invitation.STATUS_PENDING:
            return Response({"detail": "Invitation non en attente."}, status=status.HTTP_400_BAD_REQUEST)

        inv.status = Invitation.STATUS_REJECTED
        inv.save()

        create_notification(inv.sender, "Invitation rejetée", f"{inv.recipient.username} a rejeté l'invitation pour {inv.project.name}")

        serializer = self.get_serializer(inv)
        return Response(serializer.data)
    

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        ).order_by('-created_at')


class ProjectRewardRecalculateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)

        if project.manager != request.user:
            raise PermissionDenied("Only the manager can recalculate rewards.")

        # Placeholder for future business logic
        # ex: distribute_rewards.delay(project.id)

        return Response({
            "status": "ok",
            "message": "Reward recalculation triggered."
        })
