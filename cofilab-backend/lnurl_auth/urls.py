from django.urls import path
from .views import lnurl_challenge, lnurl_verify  # ← import des fonctions

app_name = "lnurl"
urlpatterns = [
    path("challenge/", lnurl_challenge, name="challenge"),  # ← fonction directement
    path("verify/", lnurl_verify, name="verify"),
]
