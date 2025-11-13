# cofilab-backend/projects/serializers.py (Corrigé)
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, Task, Contribution, Profile, Skill

User = get_user_model()

# --- Nouveaux Serializers ---

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ('id', 'name')

class UserSerializer(serializers.ModelSerializer):
    """ Serializer de base pour l'utilisateur, utilisé pour l'imbrication """
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password') 
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class ProfileSerializer(serializers.ModelSerializer):
    # Lecture seule du nom d'utilisateur à partir de la relation OneToOne
    username = serializers.CharField(source='user.username', read_only=True)
    
    # Affichage des compétences complètes (Many-to-Many)
    skills = SkillSerializer(many=True, read_only=True)
    
    # Écriture des compétences par ID (pour l'édition)
    skill_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        write_only=True, 
        queryset=Skill.objects.all(), 
        source='skills'
    )
    
    # Affichage des choix lisibles (WorkMode & Availability)
    work_mode_display = serializers.CharField(source='get_work_mode_display', read_only=True)
    availability_display = serializers.CharField(source='get_availability_display', read_only=True)

    class Meta:
        model = Profile
        # ✅ FIX: profile_picture au lieu de profile_picture_url
        fields = (
            'id', 'username', 'contact_email', 'contact_phone', 
            'current_city', 'work_mode', 'work_mode_display', 
            'availability', 'availability_display', 'bio',
            'profile_picture', 'skills', 'skill_ids',
            'created_at', 'updated_at'
        )
        read_only_fields = ('username', 'skills', 'work_mode_display', 'availability_display')


class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.ReadOnlyField(source="project.name") 
    assigned_to_username = serializers.ReadOnlyField(source="assigned_to.username")

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "status",
            "validated",
            "reward_sats",
            "project",
            "project_name", 
            "assigned_to",
            "assigned_to_username",
            "created_at",
            "weight", 
            "rewarded", 
        ]
        extra_kwargs = {
            "project": {"write_only": True},
        }   


class ProjectSerializer(serializers.ModelSerializer):
    manager_username = serializers.ReadOnlyField(source="manager.username") 
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",  
            "description",
            "total_budget",
            "manager_username", 
            "is_public", 
            "tasks",
            # ✅ NOUVEAU: Ajout de l'image de projet
            "project_image",
            "created_at",
        ]
        extra_kwargs = {
            "manager": {"write_only": True},
            # Note: Pour les FileField/ImageField, DRF gère automatiquement le téléchargement en PATCH/POST
        }
    def get_project_image_url(self, obj):
        request = self.context.get('request')
        if obj.project_image and request:
            return request.build_absolute_uri(obj.project_image.url)
        return None