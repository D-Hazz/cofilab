from django.contrib import admin
from .models import Funding, Payment, FunderManager

@admin.register(Funding)
class FundingAdmin(admin.ModelAdmin):
    list_display = ("project", "amount_sats", "is_anonymous", "created_at")

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("task", "user", "status", "paid_at")

@admin.register(FunderManager)
class FunderManagerAdmin(admin.ModelAdmin):
    list_display = ("name", "project", "total_contributed", "created_at")
    search_fields = ("name", "project__name")