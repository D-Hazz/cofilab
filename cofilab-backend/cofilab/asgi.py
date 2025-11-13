# cofilab/asgi.py
import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
import cofilab.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cofilab.settings')

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            cofilab.routing.websocket_urlpatterns
        )
    ),
})
