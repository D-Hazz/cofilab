# CoFiLab

Collaborate. Fund. Earn.
Bitcoin Lightning for collaborative work and financing.

## 1. Présentation

CoFiLab est une plateforme de collaboration et de financement décentralisé. Elle connecte les créateurs, développeurs et financeurs autour d’un modèle simple : chaque tâche accomplie est validée, mesurée, tracée et rémunérée automatiquement en Bitcoin via Breez SDK.

CoFiLab réunit trois piliers :

1. Collaboration entre talents
2. Financement ouvert, anonyme ou public
3. Rémunération instantanée sur Lightning Network

CoFiLab = co-freelancing + co-financing.

---

## 2. Vision

Créer un espace où projets et talents se rencontrent sans frontières ni intermédiaires.
Chaque contribution est vérifiable, chaque financement est traçable, chaque paiement est instantané.

---

## 3. Objectifs

* Simplifier la collaboration autour de projets structurés par tâches pondérées.
* Supprimer les barrières traditionnelles au financement grâce à Lightning.
* Automatiser la rémunération selon validation et pondération.
* Garantir la transparence via des preuves horodatées et des historiques vérifiables.
* Offrir une réputation décentralisée basée sur la valeur réellement apportée.

---

## 4. Fonctionnalités principales

### Côté Financeur

* Financement public ou anonyme.
* Montants visibles ou privés.
* Preuve de financement par hash SHA-256.
* Regroupement des financeurs par projet ou thématique.
* Pools de financement collaboratif.
* Portefeuille Lightning intégré via Breez SDK.
* Suivi en temps réel des fonds.

### Côté Exécutant

* Rejoint un projet ou une agence.
* Accède aux tâches pondérées (points, complexité, impact).
* Soumet des livrables validés manuellement ou automatiquement.
* Paiement Lightning immédiat après validation.
* Historique public de participation.

### Côté Manager / Agence

* Création et gestion de projets et milestones.
* Définition des pondérations et critères de validation.
* Supervision multi-exécutants.
* Paiements automatiques pilotés par Breez SDK.
* Dashboard de performance (capacité, progression, retards).

---

## 5. Exemple d’usage

Projet : Smart Green Dashboard
Budget total : 300 000 sats

Managers définissent la pondération :

* Frontend : 40 %
* Backend : 40 %
* UI/UX : 20 %

Les validations déclenchent les paiements selon ces pourcentages.

---

## 6. Authentification

* Financeur : authentification via wallet Lightning (LNURL-auth).
* Exécutant : email classique ou wallet connect.
* Manager : authentification agence multi-projet.

---

## 7. Intégration Breez SDK

* Paiements Lightning instantanés
* Génération et vérification de factures LN
* Distribution automatique multi-wallet
* Solde et historique à l’intérieur de l’application
* Aucun stockage de clés privées côté serveur

---

## 8. Stack Technique (MVP)

| Élément         | Technologie                        |
| --------------- | ---------------------------------- |
| Frontend        | Next.js 14, TailwindCSS, Shadcn UI |
| Backend         | Django + Django REST Framework     |
| Base de données | PostgreSQL                         |
| Paiements       | Breez SDK                          |
| Temps réel      | Django Channels (WebSockets)       |
| Queue           | Celery + Redis                     |
| Auth            | JWT + LNURL-signature              |
| Serveur         | Daphne + Nginx                     |
| Déploiement     | Docker ou VM simple                |

---

## 9. Installation

### 9.1. Backend (Django)

```
git clone https://github.com/your-org/cofilab-backend.git
cd cofilab-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Configurer `.env` :

```
SECRET_KEY=
DATABASE_URL=postgres://user:pass@localhost:5432/cofilab
REDIS_URL=redis://localhost:6379/0
BREEZ_API_KEY=
```

Migrer la base :

```
python manage.py migrate
```

Lancer le backend :

```
daphne -b 0.0.0.0 -p 8000 cofilab.asgi:application
```

---

### 9.2. Frontend (Next.js)

```
git clone https://github.com/your-org/cofilab-frontend.git
cd cofilab-frontend
npm install
```

Créer `.env.local` :

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Lancer le frontend :

```
npm run dev
```

---

### 9.3. Redis & Celery

```
sudo apt install redis-server
celery -A cofilab worker --loglevel=INFO
celery -A cofilab beat --loglevel=INFO
```

---

## 10. Modèle de données simplifié

### Projet

* name
* description
* manager
* total_budget
* funded_sats

### Tâche

* title
* description
* status
* reward_sats
* assigned_to
* project

### Contribution

* user
* task
* points
* pourcentage
* timestamp

### Paiement

* facture LN
* montant
* statut
* horodatage

---

## 11. Nouveaux Modules Fonctionnels

### 1. Gestion de la capacité

Indicateurs de performance par contributeur et répartition dynamique.

### 2. Pondération des tâches

Points convertis en pourcentage de rémunération.

### 3. Répartition financière

Calcul automatique des parts selon performance.

### 4. Validation formelle

Étapes obligatoires avant paiement.
Possibilité de modifier les pondérations.

### 5. Suivi hebdomadaire

Rapports, progression, blocages, retards.

---

## 12. Sécurité

* Breez SDK prend en charge la gestion des fonds.
* Aucune clé privée côté serveur.
* Hash SHA-256 comme preuve de financement.
* Auth LNURL-signature pour financeurs.
* Requêtes sécurisées via JWT.

---

## 13. Roadmap

### Phase 1 – MVP Web

Auth, création projet, financement, validation manuelle, paiement Breez.

### Phase 2 – Agences & Pondération

Gestion multi-manager, calcul automatique des contributions.

### Phase 3 – IA & Réputation

Matching intelligent, score de confiance, analyse pondérée.

---

## 14. Identité et Branding

* Nom : CoFiLab
* Couleurs : Or Bitcoin et Bleu Tech
* Symbole : deux cercles entrelacés (travail et financement)
* Motto : Your skill is value. Your wallet is trust.

---

## 15. Extensions Futures

* Module agence avec reporting global
* IA de réputation
* Marketplace open-source de projets financés
* DAO communautaire pour gouvernance décentralisée
