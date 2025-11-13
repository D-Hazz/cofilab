from django.urls import path
from . import views

urlpatterns = [
    path("webhook/", views.payments_webhook, name="payments-webhook"),
]
