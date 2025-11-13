from django.contrib import admin
from .models import Contribution, Project, Task, Profile, Skill # Import des nouveaux modèles

# --- Administration des Projets ---
@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "manager", "total_budget", "is_public", "created_at")
    search_fields = ("name", "manager__username")
    list_filter = ("is_public", "manager")

# --- Administration des Tâches ---
@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "assigned_to", "reward_sats", "status", "validated")
    list_filter = ("status", "validated", "project")
    search_fields = ("title", "project__name")
    list_editable = ("status", "validated")

# --- Administration des Profils ---
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "work_mode", "availability", "current_city", "created_at")
    search_fields = ("user__username", "current_city", "bio")
    list_filter = ("work_mode", "availability")
    # Pour l'édition des ManyToMany (skills) sans devoir cliquer sur l'objet
    filter_horizontal = ('skills',) 

# --- Administration des Compétences ---
@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name", "id")
    search_fields = ("name",)

# --- Administration des Contributions (Facultatif mais utile) ---
# Si le modèle Contribution doit être géré en admin
@admin.register(Contribution)
class ContributionAdmin(admin.ModelAdmin):
    list_display = ("user", "project", "amount_sats", "contributed_at")
    list_filter = ("project",)