# projects/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver


User = get_user_model()

# --- Choix constants ---
class WorkMode(models.TextChoices):
    ONSITE = 'onsite', 'En Présentiel'
    REMOTE = 'remote', 'En Télétravail (Remote)'
    HYBRID = 'hybrid', 'Hybride'
    TRAVEL = 'travel', 'Disposé à voyager'

class Availability(models.TextChoices):
    FULL_TIME = 'full_time', 'Plein temps'
    PART_TIME = 'part_time', 'Temps partiel'
    HOURLY = 'hourly', 'À l\'heure'
    PROJECT = 'project', 'Par projet'

# --- Modèle de Compétence ---
class Skill(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "Compétence"
        verbose_name_plural = "Compétences"


# --- Modèle de Profil Utilisateur ---
class Profile(models.Model):
    # Relation One-to-One avec l'utilisateur
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Détails du contact
    contact_email = models.EmailField(blank=True, null=True, unique=True) 
    contact_phone = models.CharField(max_length=20, blank=True)
    
    # Localisation et mode de travail
    current_city = models.CharField(max_length=100, blank=True, verbose_name="Ville actuelle")
    work_mode = models.CharField(
        max_length=30, 
        choices=WorkMode.choices, 
        default=WorkMode.REMOTE,
        verbose_name="Moyen de travail"
    )

    # Disponibilité
    availability = models.CharField(
        max_length=30, 
        choices=Availability.choices, 
        default=Availability.PROJECT,
        verbose_name="Disponibilité"
    )

    # Compétences
    skills = models.ManyToManyField(Skill, related_name='users', blank=True)
    
    # ✅ FIX: Changé de URLField à FileField (ImageField est préférable pour une photo)
    profile_picture = models.ImageField(
        upload_to='profiles/pictures/', 
        blank=True, 
        null=True, 
        verbose_name="Photo de profil"
    )
    
    # Champ de description ou bio
    bio = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"
    
    class Meta:
        verbose_name = "Profil Utilisateur"
        verbose_name_plural = "Profils Utilisateurs"


# --- Signal pour créer le profil lors de la création d'un utilisateur ---
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if not hasattr(instance, 'profile'):
            Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


# --- Modèles existants (Mise à jour Project) ---
class Project(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    manager = models.ForeignKey(User, on_delete=models.CASCADE, related_name="managed_projects")
    total_budget = models.BigIntegerField(default=0)  # in sats
    current_balance = models.BigIntegerField(default=0)
    is_public = models.BooleanField(default=True)
    # ✅ NOUVEAU: Ajout de l'image de projet
    project_image = models.ImageField(
        upload_to='projects/covers/', 
        blank=True, 
        null=True, 
        verbose_name="Image de couverture"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Task(models.Model):
    STATUS_CHOICES = (("todo", "À faire"), ("done", "Terminé"))
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    weight = models.DecimalField(max_digits=6, decimal_places=2, default=1.0)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="todo")
    validated = models.BooleanField(default=False)
    reward_sats = models.BigIntegerField(default=0)
    rewarded = models.BooleanField(default=False) 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.name} - {self.title}"
    
    # ⭐ Méthode officielle
    def calculate_reward(self):
        total_weights = Task.objects.filter(project=self.project).aggregate(models.Sum("weight"))["weight__sum"] or 1
        return int((self.project.total_budget * float(self.weight)) / float(total_weights))
    
# Contribution model
class Contribution(models.Model):  
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="contributions")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="contributions")
    amount_sats = models.BigIntegerField()  # in sats
    contributed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.project.name} - {self.amount_sats} sats"
    
    class Meta:
        verbose_name = "Contribution"
        verbose_name_plural = "Contributions"


# Invitation model
class Invitation(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_REJECTED = 'rejected'

    STATUS_CHOICES = (
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_REJECTED, 'Rejected'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='invitations')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_invitations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('project', 'recipient')
        ordering = ['-created_at']

    def __str__(self):
        return f"Invite {self.recipient} -> {self.project} ({self.status})"


# Simple notification model
class Notification(models.Model):
    TYPE_INVITATION = 'invitation'
    TYPE_INFO = 'info'

    TYPE_CHOICES = (
        (TYPE_INVITATION, 'Invitation'),
        (TYPE_INFO, 'Info'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField(blank=True)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, default=TYPE_INFO)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification to {self.user.username}: {self.title}"
