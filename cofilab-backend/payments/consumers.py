# cofilab-backend/payments/consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json

class PaymentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(json.dumps({"message": "Connexion WebSocket établie ✅"}))

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message", "Aucun message reçu")
        await self.send(json.dumps({"response": f"Message reçu: {message}"}))

    async def disconnect(self, close_code):
        print("Client WebSocket déconnecté")
