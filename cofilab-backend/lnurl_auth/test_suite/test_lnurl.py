import os
import binascii # <-- Ensure this is imported for k1 generation
import time
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.cache import cache
import hashlib # <-- Ensure this is imported for the placeholder check

# If you need to access your User model:
User = get_user_model()

class LNURLAuthTest(TestCase):
    def test_lnurl_challenge_returns_k1(self):
        url = reverse("lnurl:challenge")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("k1", data)
        self.assertIn("expires_at", data)

    def test_lnurl_verify_and_jwt_return(self):
        # 1. Générer k1 comme la vue le fait et le mettre dans le cache
        k1 = binascii.hexlify(os.urandom(16)).decode()
        cache.set(f"lnurl_challenge:{k1}", {"created_at": int(time.time())}, timeout=300)

        pubkey = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" 
        
        # 2. GENERATE THE SIGNATURE EXACTLY AS THE VIEW EXPECTS IT (Placeholder logic)
        # The view expects: sig == hashlib.sha256((k1 + pubkey).encode()).hexdigest()
        sig = hashlib.sha256((k1 + pubkey).encode()).hexdigest() 

        verify_url = reverse("lnurl:verify")
        res = self.client.post(
            verify_url,
            data={"k1": k1, "pubkey": pubkey, "sig": sig},
            content_type="application/json"
        )

        # This should now assert 200 because the generated 'sig' matches the 'expected' hash in the view.
        self.assertEqual(res.status_code, 200) 
        
        data = res.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)
        self.assertIn("user_id", data)
        self.assertIn("username", data)

        # Vérifier que l'utilisateur a bien été créé
        user = User.objects.get(id=data["user_id"])
        self.assertEqual(user.username, data["username"])