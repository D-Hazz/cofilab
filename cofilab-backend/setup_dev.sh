#!/bin/bash

# ============================================================
# 🧩 CoFiLab - Setup Développement
# Prépare tout l'environnement backend (PostgreSQL, Redis, Django)
# Auteur : Zed
# ============================================================

# Couleurs terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Démarrage du setup de CoFiLab...${NC}"

# --- Étape 1 : Mise à jour du système ---
echo -e "${GREEN}🔧 Mise à jour du système...${NC}"
sudo apt update -y

# --- Étape 2 : Installation de PostgreSQL & Redis ---
echo -e "${GREEN}📦 Installation de PostgreSQL et Redis...${NC}"
sudo apt install -y postgresql postgresql-contrib redis-server

# --- Étape 3 : Démarrage des services ---
echo -e "${GREEN}⚙️  Démarrage de PostgreSQL et Redis...${NC}"
sudo systemctl enable postgresql
sudo systemctl enable redis-server
sudo systemctl start postgresql
sudo systemctl start redis-server

# --- Étape 4 : Configuration de la base de données ---
DB_NAME="cofilab_db"
DB_USER="cofilab_user"
DB_PASS="password"

echo -e "${GREEN}🗃️  Configuration PostgreSQL...${NC}"
sudo -u postgres psql <<EOF
DO
\$do\$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}'
   ) THEN
      CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
   END IF;
END
\$do\$;

CREATE DATABASE ${DB_NAME} OWNER ${DB_USER} TEMPLATE template0 ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF

# --- Étape 5 : Vérification Redis ---
echo -e "${GREEN}🔍 Vérification Redis...${NC}"
if redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✅ Redis est opérationnel.${NC}"
else
    echo -e "${RED}❌ Redis ne répond pas. Vérifie son installation.${NC}"
fi

# --- Étape 6 : Création du .env s'il n'existe pas ---
if [ ! -f ".env" ]; then
    echo -e "${GREEN}📝 Création du fichier .env...${NC}"
    cat <<EOT > .env
DJANGO_SECRET_KEY=changeme_replace_this
DEBUG=True
DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1
JWT_SECRET=changemejwt
WEBHOOK_SECRET=supersecret_for_webhook_hmac
EOT
else
    echo -e "${GREEN}ℹ️  Fichier .env déjà présent.${NC}"
fi

# --- Étape 7 : Installation des dépendances Python ---
echo -e "${GREEN}🐍 Installation des dépendances du projet...${NC}"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# --- Étape 8 : Migration et superuser ---
echo -e "${GREEN}📜 Application des migrations...${NC}"
python manage.py migrate

echo -e "${GREEN}👤 Création du superuser (si non existant)...${NC}"
python manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username="Zed").exists():
    User.objects.create_superuser("Zed", "hakizimanazidane@gmail.com", "password")
    print("✅ Superuser créé avec succès.")
else:
    print("ℹ️  Superuser 'Zed' existe déjà.")
EOF

# --- Étape 9 : Lancement du serveur ---
echo -e "${GREEN}🚀 Lancement du serveur Daphne...${NC}"
python -m daphne -b 0.0.0.0 -p 8000 cofilab.asgi:application
