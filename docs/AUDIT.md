# Rapport d'Audit & Assainissement — Plateforme Master Data IA

> **Date** : 15 Octobre 2026  
> **Auteur** : Équipe Développement Full-Stack & UI Produit  
> **Statut** : Complété — Base pour l'Implementation Plan E0-E10  
> **Conformité** : SOX, SEPA (ISO 13616 Modulo 97), Sapin II, RGPD  

---

## 1. Contexte & Objectif de l'Audit

Le projet initial « Master Data IA » a été conçu pour digitaliser le processus d'onboarding et de mise à jour des coordonnées bancaires des tiers chez TUI Group Finance (chaîne Procure-to-Pay). 

L'audit a pour but de :
1. Identifier précisément le **code de démonstration** et les **mécanismes non sécurisés** à éradiquer.
2. Analyser les écarts entre le code existant et les exigences d'une **plateforme SaaS multi-projets générique, configurable et prête pour la production**.
3. Définir ce qui est **conservé**, **refactorisé**, et **définitivement supprimé**.
4. Établir le protocole de **protection absolue de l'ancienne base `masterdata_ia`** (aucune modification, aucune suppression).

---

## 2. État des Lieux de l'Existant

### 2.1. Base de données
- **Existant** : Base MariaDB/MySQL `masterdata_ia` contenant 6 tables (`admin_actions`, `audit_logs`, `documents`, `users`, `vendors`, `vendor_requests`).
- **Anomalies constatées** :
  - Périmètre territorial figé en dur dans les schémas (`geographic_scope` ENUM `WESTERN`, `NORDIC`, `GLOBAL`).
  - Absence de table `projects`, `project_countries`, `user_projects` pour la gestion multi-projets générique.
  - Absence de chaînage cryptographique (`prev_hash`, `row_hash`) dans `audit_logs` ; aucun trigger interdisant les `UPDATE` ou `DELETE`.
  - Pas de table de jetons d'invitation (`invitations`), ni de logs de synchronisation ERP (`sap_sync_logs`), ni de messagerie (`messages`), ni de notifications (`notifications`).
  - La table `users` mélange des rôles avec des périmètres et stocke des identifiants de démonstration.
- **Règle absolue** : La base `masterdata_ia` est sanctuarisée. La nouvelle application utilise la base `tui_masterdata_prod`, paramétrée **exclusivement** via `DB_NAME`.

### 2.2. Backend (Node.js / Express)
- **Existant** : Serveur Express en JavaScript CommonJS avec configuration hybride MySQL/PGlite dans `backend/src/config/db.js`.
- **Anomalies constatées** :
  - Mécanisme de traduction SQL bricolé (`convertDollarParamsToQuestionMarks`) tentant d'exécuter la même syntaxe sur PostgreSQL et MySQL.
  - Dépendance `masterdata_ia` codée en valeur par défaut dans `config/index.js`.
  - Endpoint de complaisance `GET /api/auth/demo-users` renvoyant les profils de test et contournant la sécurité.
  - Réinitialisation de mot de passe renvoyant le jeton en clair dans la réponse JSON (`demo_reset_token`) sans envoi d'e-mail.
  - Règle de complaisance `request.id === 1` autorisant un fournisseur à voir une demande arbitraire.
  - Absence de types TypeScript, absence de validation Zod systématique (utilisation partielle de Joi), logs console non structurés (pas de Pino).
  - L'adaptateur SAP (`sapService.js`) est un simple générateur d'objets JSON aléatoires sans POST HTTP ni export fichier réel.
  - L'adaptateur IA (`aiService.js`) renvoie des données factices codées en dur en cas d'erreur.

### 2.3. Frontend (React 18 + Vite)
- **Existant** : SPA React en JavaScript (`.jsx`), Tailwind CSS basique, Lucide Icons, Recharts.
- **Anomalies constatées** :
  - Composant `RoleSwitcher.jsx` permettant de changer d'identité d'un clic sans mot de passe.
  - Constante `DEMO_PERSONAS` dans `src/services/api.js` avec mot de passe universel `Password123!`.
  - Écran de connexion affichant des boutons de connexion rapide pour chaque profil de démo.
  - Absence de routage formel par URL (React Router) : état `currentView` en mémoire locale.
  - Textes et clés de traduction contenant des libellés spécifiques à la soutenance (`demo_title`, `demo_universal_pwd`).
  - Périmètres (`WESTERN`, `NORDIC`, `TGBST`) codés en dur dans les sélecteurs et traductions.

### 2.4. Microservice IA (Python 3.11 / FastAPI)
- **Existant** : Microservice FastAPI exposant 7 axes.
- **Anomalies constatées** :
  - Repli systématique sur un texte mocké (`axe1_ocr_nlp.py`) dès lors que le texte OCR est vide.
  - Absence de chaîne de prétraitement d'images OpenCV (redressement Hough, filtre bilatéral, binarisation Sauvola) et d'OCR réel (PaddleOCR / Tesseract).
  - Absence de Sentence-BERT multilingue MiniLM (384 dim) avec mise en cache Redis.
  - Absence de XGBoost stacked sur Isolation Forest pour le scoring de risque.
  - Le modèle de segmentation (K-Means) ne gère pas dynamiquement l'encodage des projets créés par l'Admin.
  - Absence de scripts réels d'entraînement (`train_*.py`) connectés à la base de données.

---

## 3. Matrice de Décision : Conservé, Refactorisé, Supprimé

| Composant / Élément | Action | Justification |
|---|:---:|---|
| `RoleSwitcher.jsx` | ❌ **Supprimé** | Contraire au principe d'application réelle et à la sécurité RBAC |
| `DEMO_PERSONAS` & `Password123!` | ❌ **Supprimé** | Zéro compte codé en dur ; la base démarre vierge |
| `GET /api/auth/demo-users` | ❌ **Supprimé** | Faille de sécurité critique |
| `demo_reset_token` dans l'API | ❌ **Supprimé** | Les jetons transitent uniquement par e-mail (Nodemailer / adaptateur) |
| Fallback mocké dans `aiService` & `sapService` | ❌ **Supprimé** | Remplacement par des adaptateurs configurables réels |
| Bricolage PGlite dans `backend/src/config/db.js` | ❌ **Supprimé** | MySQL 8 / InnoDB natif avec pool de connexions optimisé et migrations Knex |
| `database_masterdata_ia.sql` | 🔒 **Sanctuarisé** | Ne doit jamais être touché ; sert de référence d'audit historique |
| Architecture en 3 tiers (Front/Back/IA) | ✅ **Conservé** | Conforme au rapport et aux bonnes pratiques de découplage |
| Logique mathématique ISO 13616 (Modulo 97) | ✅ **Conservé & Renforcé** | Contrôle valide côté formulaire ET côté serveur |
| Composants UI (Header, Sidebar, Modales) | 🔄 **Refactorisé** | Migration TypeScript, suppression du mode démo, intégration du thème Bleu & Blanc |
| Vues métiers (Admin, Agent, Manager, Requester, Vendor) | 🔄 **Refactorisé** | Connexion aux vraies API, affichage conditionné par le token de session et le périmètre projet |
| Backend Express | 🔄 **Refactorisé** | Migration TypeScript, Zod, JWT court + refresh tournant, isolation multi-projets |
| Microservice IA | 🔄 **Refactorisé** | Intégration OpenCV/PaddleOCR, Isolation Forest, Sentence-BERT + Redis, XGBoost, FAISS |

---

## 4. Sécurité & Protection de la Base de Données

1. **Variables d'environnement** :
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=tui_masterdata_prod
   ```
2. **Garde-fou applicatif** :
   Tous les scripts de migration et le fichier de configuration de la base intègrent une vérification bloquante :
   ```javascript
   if (process.env.DB_NAME === 'masterdata_ia') {
     console.error('ERREUR CRITIQUE : Interdiction formelle de cibler la base masterdata_ia !');
     process.exit(1);
   }
   ```
3. **Immuabilité de l'audit** :
   - Colonnes `prev_hash` et `row_hash` (SHA-256) garantissant une chaîne inviolable de type blockchain privée.
   - Triggers MySQL `BEFORE UPDATE` et `BEFORE DELETE` rejetant toute altération avec un signal SQL `45000`.

---

## 5. Synthèse & Prochaines Étapes

L'assainissement va permettre de repartir sur des bases industrielles saines :
- Zéro dépendance à des données fictives.
- Amorçage par `npm run bootstrap:admin`.
- Projets créés dynamiquement par l'Admin.
- Traitement asynchrone non-bloquant de l'IA.
- Traçabilité totale conforme aux exigences SOX et Sapin II.
