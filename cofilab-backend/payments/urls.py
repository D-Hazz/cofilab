# cofilab-backend/payments/urls.py
from django.urls import path
from . import views
from django.urls import path
from .views import CreateFundingView, CreateInvoicePaymentView, CreateInvoicePaymentView, CreatePaymentView, VerifyPaymentView,CreateFundingInvoiceView,VerifyFundingPaymentView,funding_webhook

urlpatterns = [
    # -------- FUNDING --------
    path("funding/create-invoice/", CreateFundingInvoiceView.as_view(), name="funding-create-invoice"),
    path("funding/verify/<str:invoice_id>/", VerifyFundingPaymentView.as_view(), name="funding-verify"),
    path("funding/", CreateFundingView.as_view(), name="fund-project"),

    # -------- WEBHOOKS --------
    path("webhook/funding/", funding_webhook, name="funding-webhook"),
    path("webhook/payments/", views.payments_webhook, name="payments-webhook"),

    # -------- PAYMENTS TÂCHES --------
    path("payments/create-invoice/", CreatePaymentView.as_view(), name="create-invoice"),
    path("payments/verify/<str:invoice_id>/", VerifyPaymentView.as_view(), name="verify-payment"),
    path("payments/pay-task/", CreateInvoicePaymentView.as_view(), name="pay-task"),

    # -------- HISTORIQUE --------
    path("payment-history/<int:user_id>/", views.PaymentHistoryView.as_view(), name="payment-history"),
]
        