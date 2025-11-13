# cofilab/routing.py
from django.urls import re_path
from payments import consumers

websocket_urlpatterns = [
    re_path(r"ws/payments/$", consumers.PaymentConsumer.as_asgi()),
]
