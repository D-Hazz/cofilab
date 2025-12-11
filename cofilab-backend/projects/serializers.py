# cofilab-backend/projects/serializers.py (Corrigé)
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Notification, Project, Task, Contribution, Profile, Skill, Invitation
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

# --- Nouveaux Serializers ---\

class BaseUserSerializer(serializers.ModelSerializer):
    """ Serializer de base pour l'utilisateur, utilisé pour l'imbrication et comme base pour RegisterSerializer. """
    class Meta:
        model = User
        # On expose le mot de passe seulement pour la création de l'objet User, pas la lecture
        fields = ('id', 'username', 'email', 'password') 
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Utilise la méthode native de Django pour créer l'utilisateur (gère le hachage du mot de passe)
        user = User.objects.create_user(**validated_data)
        return user
# --- NOUVEAU: Serializer d'Inscription Professionnelle ---

class RegisterSerializer(serializers.ModelSerializer):
    """ Gère la création du compte avec validation des mots de passe. """
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        # Champs requis pour l'inscription
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, data):
        """ Vérifie que les deux mots de passe correspondent. """
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Les deux mots de passe ne correspondent pas."})
        return data

    def create(self, validated_data):
        """ Crée l'utilisateur en utilisant la méthode create_user de Django. """
        # On retire 'password2' des données validées pour ne pas le passer à create_user
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

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

class UserLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.ReadOnlyField(source="project.name") 
    assigned_to_username = serializers.ReadOnlyField(source="assigned_to.username")
    assigned_to = UserLiteSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        source='assigned_to',
        write_only=True,
        allow_null=True,
        required=False
    )

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
            "assigned_to_id",
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
    
# --- Serializer pour le modèle Contribution ---
class ContributionSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source="user.username") 
    project_name = serializers.ReadOnlyField(source="project.name") 

    class Meta:
        model = Contribution
        fields = [
            "id",
            "user",
            "user_username",
            "project",
            "project_name",
            "amount_sats",
            "contributed_at",
        ]
        extra_kwargs = {
            "user": {"write_only": True},
            "project": {"write_only": True},
        }

# --- NOUVEAU: Serializer pour le modèle Invitation ---
class InvitationSerializer(serializers.ModelSerializer):
    sender = UserLiteSerializer(read_only=True)
    recipient = UserLiteSerializer(read_only=True)
    recipient_id = serializers.PrimaryKeyRelatedField(write_only=True, queryset=User.objects.all(), source='recipient')
    project_id = serializers.PrimaryKeyRelatedField(write_only=True, queryset=Project.objects.all(), source='project')

    class Meta:
        model = Invitation
        fields = [
            'id', 'project', 'project_id', 'sender', 'recipient', 'recipient_id',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ('project', 'sender', 'status', 'created_at', 'updated_at')

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id','user','title','message','type','read','created_at']
        read_only_fields = ('user','created_at')