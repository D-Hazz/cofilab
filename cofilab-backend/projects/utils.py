# projects/utils.py
from .models import Notification

def create_notification(user, title, message, type="info"):
    Notification.objects.create(user=user, title=title, message=message, type=type)
