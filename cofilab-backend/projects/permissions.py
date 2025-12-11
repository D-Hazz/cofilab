from rest_framework.permissions import BasePermission

# projects/permissions.py
class CanInvite(BasePermission):
    def has_permission(self, request, view):
        project_id = request.data.get('project')
        user = request.user

        from projects.models import Project  
        project = Project.objects.get(id=project_id)

        return user == project.creator or user in project.managers.all()
