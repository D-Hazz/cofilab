from django.contrib import admin
from .models import (
    Contribution, Project, Task, Profile, Skill,
    Invitation, Notification
)

# ----------------------
# ADMIN : PROJECT
# ----------------------
@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "manager", "total_budget", "is_public", "created_at")
    search_fields = ("name", "manager__username")
    list_filter = ("is_public", "manager")


# ----------------------
# ADMIN : TASK
# ----------------------
@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "assigned_to", "reward_sats", "status", "validated")
    list_filter = ("status", "validated", "project")
    search_fields = ("title", "project__name")
    list_editable = ("status", "validated")


# ----------------------
# ADMIN : PROFILE
# ----------------------
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "work_mode", "availability", "current_city", "created_at")
    search_fields = ("user__username", "current_city", "bio")
    list_filter = ("work_mode", "availability")
    filter_horizontal = ('skills',)


# ----------------------
# ADMIN : SKILL
# ----------------------
@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name", "id")
    search_fields = ("name",)


# ----------------------
# ADMIN : CONTRIBUTION
# ----------------------
@admin.register(Contribution)
class ContributionAdmin(admin.ModelAdmin):
    list_display = ("user", "project", "amount_sats", "contributed_at")
    list_filter = ("project",)
    search_fields = ("user__username", "project__name")


# ----------------------
# ADMIN : INVITATION
# ----------------------
@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ("project", "sender", "recipient", "status", "created_at")
    search_fields = (
        "project__name",
        "sender__username",
        "recipient__username",
        "status",
    )
    list_filter = ("status", "project", "created_at")


# ----------------------
# ADMIN : NOTIFICATION
# ----------------------
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "title", "type", "read", "created_at")
    search_fields = ("user__username", "title", "message")
    list_filter = ("type", "read", "created_at")
