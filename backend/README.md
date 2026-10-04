# Backend Applicatif — TUI Group Finance "Master Data IA"
*API REST Node.js / Express avec sécurité JWT, matrice RBAC croisée rôles/géographies, base PostgreSQL JSONB et intégration Microservice IA / SAP S/4HANA.*

---

## 🏛️ Caractéristiques d'Architecture

- **Framework** : Node.js (v22+) + Express.js
- **Base de données** : PostgreSQL avec colonnes `JSONB` pour la flexibilité des formulaires, les résultats d'extraction OCR et la piste d'audit inaltérable.
- **Sécurité & RBAC** :
  - Authentification par jetons JWT (durée 24h).
  - Contrôle d'accès à double dimension : **Rôle métier** (`VENDOR`, `REQUESTER`, `MASTER_DATA_AGENT`, `MANAGER_APPROVAL`, `SYSTEM_SAP`) x **Scope géographique** (`WESTERN`, `NORDIC`, `TGBST`, `GLOBAL`).
- **Piste d'Audit Inaltérable** : Enregistrement de chaque action avec capture différentielle `old_value` / `new_value` en JSONB, horodatage certifié et identité de l'opérateur.
- **Simulateur SAP S/4HANA** : Génération d'IDocs `CREMAS` / `ADRMAS` et gestion des blocages préventifs `ZBLOCK` si le score de risque IA excède 70.

---

## 📡 Routes d'API

| Domaine | Méthode & Endpoint | Rôles Autorisés | Description |
|---|---|---|---|
| **Auth** | `POST /api/auth/login` | Public | Authentification et émission du token JWT |
| | `GET /api/auth/me` | Tous | Profil de l'utilisateur connecté |
| | `GET /api/auth/demo-users` | Public | Liste des comptes de test pour bascule instantanée |
| **Demandes** | `GET /api/requests` | Tous (filtré RBAC) | File d'attente selon le rôle et le scope |
| | `GET /api/requests/:id` | Tous (filtré) | Détail d'un dossier avec documents et audit trail |
| | `POST /api/requests` | Requester, Vendor | Création d'un dossier avec criblage IA automatique |
| | `POST /api/requests/:id/screen-ai` | Agent, Manager | Relance de l'analyse IA (5 axes intégrés) |
| | `PUT /api/requests/:id/agent-review` | Agent, Manager | Validation de l'extraction OCR et transmission |
| | `PUT /api/requests/:id/manager-approval` | Manager | Décision finale (Approbation / Rejet) |
| | `POST /api/requests/:id/sap-sync` | Manager, Agent, SAP | Synchronisation vers SAP ERP S/4HANA |
| **Documents** | `POST /api/documents/upload` | Tous | Dépôt de fichier avec extraction OCR Axe 1 |
| **Fournisseurs**| `GET /api/vendors` | Tous (filtré) | Consultation du catalogue référentiel SAP |
| **Analytics** | `GET /api/analytics/dashboard` | Tous | KPIs consolidés du workflow Master Data |
| | `GET /api/analytics/forecast` | Tous | Prévisions temporelles Axe 6 |
| | `GET /api/analytics/ai-metrics` | Tous | Métriques formelles des modèles IA |
| **RAG** | `POST /api/rag/query` | Tous | Assistant de conformité réglementaire TUI |

---

## 🚀 Démarrage

```bash
cd backend
npm install
node server.js
```
*Le serveur s'exécute sur `http://localhost:5000` et auto-initialise la base PostgreSQL.*

---

## 🧪 Tests d'Intégration

```bash
node test-backend.js
```
