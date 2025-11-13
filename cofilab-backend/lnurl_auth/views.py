# cofilab-backend/lnurl_auth/views.py
import os
import binascii
import time
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.cache import cache
import hashlib

User = get_user_model()
CHALLENGE_TTL = 300

@api_view(["GET"])
@permission_classes([AllowAny])
def lnurl_challenge(request):
    """
    GET /api/lnurl/challenge/
    Répond avec le format JSON du protocole LNURL-Auth,
    qui sera ensuite utilisé par le wallet.
    """
    # 1. Générer le k1
    k1 = binascii.hexlify(os.urandom(32)).decode() # Utiliser 32 bytes (64 chars) pour plus de sécurité.
    
    # 2. Construire l'URL de Callback (la même URL que le tunnel)
    # L'URL du tunnel DOIT être accessible publiquement, WoS va la frapper.
    # On suppose que le BASE_URL est le domaine tunnelisé (ex: https://kind-bottles-live.loca.lt)
    
    # ATTENTION: Il faut remplacer 'request.build_absolute_uri' si vous n'avez pas de configuration
    # de domaine correcte dans Django. Nous utilisons une construction manuelle basée sur le tunnel.
    
    # Utilisez la BASE_URL PUBLIQUE du tunnel ici, elle DOIT être configurée dans settings
    # ou passée via un header (plus complexe). Pour simplifier, nous utilisons le path /verify/.
    
    # 🛑 Le chemin d'accès public doit être configuré dans le code du backend!
    # Pour l'instant, on utilise l'URI de la requête et on remplace le path par /verify/
    base_uri = request.build_absolute_uri().split('?')[0].replace('challenge/', 'verify/')
    callback_url = f"{base_uri}?tag=login&k1={k1}"
    
    # 3. Sauvegarder le challenge
    cache.set(f"lnurl_challenge:{k1}", {"created_at": int(time.time())}, timeout=CHALLENGE_TTL)
    
    # 4. Réponse conforme à la spécification LNURL-Auth
    return Response({
        "tag": "login",
        "k1": k1,
        "callback": callback_url,
        "action": "login" 
    }, status=200)

@api_view(["POST"])
@permission_classes([AllowAny])
def lnurl_verify(request):
    # ... (le reste du code de vérification reste inchangé) ...
    k1 = request.data.get("k1")
    pubkey = request.data.get("pubkey")
    sig = request.data.get("sig")

    if not k1 or not pubkey or not sig:
        return Response({"detail": "missing fields"}, status=400)

    saved = cache.get(f"lnurl_challenge:{k1}")
    if not saved:
        # 🛑 Réponse d'erreur au format LNURL
        return Response({"status": "ERROR", "reason": "challenge expired or invalid"}, status=400)

    # Placeholder verification: in prod use secp256k1 verify
    expected = hashlib.sha256((k1 + pubkey).encode()).hexdigest()
    if not sig == expected:
        # 🛑 Réponse d'erreur au format LNURL
        return Response({"status": "ERROR", "reason": "invalid signature (placeholder check failed)"}, status=403)

    # Création de l'utilisateur et génération du JWT
    # ... (le reste du code reste inchangé, y compris la génération de token) ...
    username = f"ln_{pubkey[:16]}"
    user, created = User.objects.get_or_create(username=username, defaults={"is_active": True})
    cache.set(f"user_pubkey:{user.id}", pubkey, timeout=None)

    refresh = RefreshToken.for_user(user)
    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user_id": user.id,
        "username": user.username,
    }, status=200)