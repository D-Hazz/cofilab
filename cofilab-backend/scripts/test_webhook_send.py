#!/usr/bin/env python3
import requests, hmac, hashlib, os, json
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "testsecret")
API_URL = os.environ.get("API_URL", "http://localhost:8000/api/payments/webhook/")
project_id = "1"
amount_sats = "50000"
proof_hash = "deadbeef"

payload = f"{project_id}|{amount_sats}|{proof_hash}".encode()
signature = hmac.new(WEBHOOK_SECRET.encode(), payload, hashlib.sha256).hexdigest()
data = {
    "project_id": int(project_id),
    "amount_sats": int(amount_sats),
    "proof_hash": proof_hash,
    "wallet_address": "lnbc1test",
    "is_anonymous": False,
    "is_amount_public": True,
    "signature": signature
}
r = requests.post(API_URL, json=data)
print(r.status_code, r.text)
