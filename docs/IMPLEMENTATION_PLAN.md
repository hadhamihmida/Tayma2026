# Plan d'Implémentation Détaillé — Master Data IA (Production SaaS)

> **Projet** : Plateforme Générale de Gestion des Données Fournisseurs & Moteur Data Science  
> **Organisation Cible** : TUI Group Finance — Procure-to-Pay (P2P)  
> **Base de Données Cible** : `tui_masterdata_prod` (MySQL 8 / InnoDB sous XAMPP & Docker)  
> **Sanctuarisation** : La base historique `masterdata_ia` est strictement protégée et inaccessible en écriture  
> **Méthode** : Cycle en tickets atomiques E0 → E10 avec critères d'acceptation stricts et validation pas-à-pas  

---

## 1. Vue d'Ensemble de l'Architecture & Sécurisation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND WEB (React 18 + Vite)                     │
│  - Design System "Clean Blue & White" (#1E5BD8 / #0B2A5B / #F5F8FD)     │
│  - Routage Strict RBAC (Admin, Manager, Agent, Requester, Vendor)       │
│  - i18n Bilingue FR / EN / AR avec inversion dynamique RTL              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP REST (Bearer JWT / Cookie)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   BACKEND APPLICATIF (Node.js / Express)                │
│  - API Gateway préfixée /api/v1 (Zod validation, Pino logs)             │
│  - Utilisateur MySQL dédié md_app (jamais root, droits limités)         │
│  - Garde-fou applicatif sans casse ni espaces sur DB_NAME               │
│  - Piste d'Audit Unique Inaltérable (fusion admin_actions -> audit_logs)│
│  - Adaptateurs Configurables : ErpExporter (SAP) & EmailService (SMTP)  │
└──────────────────┬──────────────────────────────────┬───────────────────┘
                   │                                  │
    SQL Pool / TCP │                   HTTP REST /    │ Cache Embeddings /
(user md_app /     │                   Async Pipeline │ Background Tasks
 tui_masterdata_prod)                  (/forecast...) │
                   ▼                                  ▼
┌─────────────────────────────────────┐  ┌────────────────────────────────┐
│   BASE DE DONNÉES (MySQL 8 / InnoDB)│  │  MOTEUR IA (Python / FastAPI)  │
│  - 13 tables relationnelles unifiées│  │  - Prétraitement OpenCV + OCR  │
│  - Triggers BEFORE UPDATE/DELETE    │  │  - Isolation Forest (Fraude)   │
│  - Droits confinés à md_app         │  │  - S-BERT / MiniLM + Dedup     │
│  - Chaîne SHA-256 (prev/row_hash)   │  │  - XGBoost (Risk Scoring)      │
│  - Aucune donnée fictive par défaut │  │  - POST /forecast (Séries Temp)│
│                                     │  │  - RAG documentaire FAISS      │
└─────────────────────────────────────┘  └────────────────────────────────┘
```

---

## 2. Découpage en Tickets (Backlog Développeur E0 à E10)

---

### 🎟️ TICKET E0 — Sécurisation Initiale, Audit & Assainissement

#### Tâches Préalables de Sauvegarde (Bloquantes)
- [ ] **T0.0.1** : **Dump SQL de l'ancienne base** : Créer le répertoire `/backups/` et exporter l'intégralité de la base historique `masterdata_ia` dans `/backups/masterdata_ia_legacy_pre_refactor.sql` à l'aide de `mysqldump` pour garantir un snapshot d'archive immuable.
- [ ] **T0.0.2** : **Tag Git `pre-refactor`** : Commiter l'état initial des fichiers et poser le tag Git officiel `git tag pre-refactor` sur le dépôt.

#### Tâches d'Assainissement
- [x] **T0.1** : Réaliser l'audit exhaustif du code existant, de la base et des dépendances. Produire `docs/AUDIT.md` et `docs/DECISIONS.md`.
- [ ] **T0.2** : Supprimer le **Role Switcher** (`RoleSwitcher.jsx`), les personas de démo (`DEMO_PERSONAS`), les mots de passe préremplis (`Password123!`), les boutons de connexion 1-clic, le jeton de réinitialisation fictif (`demo_reset_token`), et l'endpoint public `GET /api/auth/demo-users`.
- [ ] **T0.3** : Supprimer les mocks dans le frontend et les fallbacks fictifs dans `aiService.js` et `sapService.js`.
- [ ] **T0.4** : Mettre en place la structure propre du projet, les fichiers de typage TypeScript / configuration, le linting ESLint/Prettier, le fichier `.env.example`.
- [ ] **T0.5** : Implémenter le **garde-fou applicatif renforcé** : normalisation insensible à la casse et sans espaces du nom de la base de données :
  ```javascript
  const cleanDbName = (process.env.DB_NAME || '').toLowerCase().replace(/[\s_\-]+/g, '');
  if (cleanDbName.includes('masterdataia')) {
    console.error('ERREUR CRITIQUE DE SÉCURITÉ : Interdiction formelle de cibler la base masterdata_ia !');
    process.exit(1);
  }
  ```

#### Critères d'Acceptation (CA)
1. Le tag `pre-refactor` existe sur le dépôt Git (`git tag -l "pre-refactor"` renvoie `pre-refactor`).
2. Le fichier `/backups/masterdata_ia_legacy_pre_refactor.sql` existe et contient la sauvegarde complète de l'ancienne base.
3. L'application démarre sans aucun compte pré-existant affiché à l'écran.
4. Les commandes `grep -ri "demo_personas" .` et `grep -ri "switchdemoaccount" .` ne renvoient aucun résultat dans le code applicatif.
5. Toute tentative de démarrer avec `DB_NAME=masterdata_ia`, `DB_NAME="MASTERDATA_IA"`, ou `DB_NAME="masterdata ia"` est immédiatement bloquée.

---

### 🎟️ TICKET E1 — Base de Données `tui_masterdata_prod`, Utilisateur `md_app` & Migrations

#### Objectifs & Tâches
- [ ] **T1.1** : Provisionner l'**utilisateur MySQL dédié `md_app`** :
  - Création de `md_app` avec mot de passe fort via script `npm run db:setup-user` (exécuté une fois par l'admin).
  - Attribution stricte de tous les privilèges sur `tui_masterdata_prod`.* et **révocation totale de tout droit sur `masterdata_ia`**.
  - Configuration de l'application Node.js pour utiliser exclusivement `DB_USER=md_app` (jamais `root`).
- [ ] **T1.2** : Créer le système de migrations versionnées (`database/migrations/`) pour MySQL 8 / InnoDB (`utf8mb4_unicode_ci`).
- [ ] **T1.3** : Écrire les migrations pour les **13 tables de production unifiées** (avec fusion de `admin_actions` dans `audit_logs`) :
  1. `users` (id, email unique, password_hash, full_name, role enum, status enum, language, must_change_password, failed_attempts, locked_until, last_login_at, vendor_id nullable, timestamps)
  2. `projects` (id, code unique libre, name, description, is_active, currencies JSON, created_by, timestamps)
  3. `project_countries` (project_id, country_code ISO 3166, required_documents JSON)
  4. `user_projects` (user_id, project_id, assigned_at)
  5. `vendors` (id, vendor_code unique, company_name, vat_number unique, siret, address, country, iban, bic_swift, segment, project_id, status, timestamps)
  6. `vendor_requests` (id, type enum, status enum, vendor_id, project_id, requester_id, assigned_agent_id, draft_data JSON, extracted_ocr_data JSON, ai_result JSON, anomaly_score, risk_score DECIMAL(4,3), recommendation, review_comment, submitted_at, decided_at, timestamps)
  7. `documents` (id, vendor_request_id, type enum, file_name, stored_name, file_path, mime_type, size, sha256, uploaded_by, uploaded_at)
  8. `invitations` (id, email, project_id, requester_id, token_hash, expires_at, used_at, vendor_request_id)
  9. `messages` (id, vendor_request_id, sender_id, body, created_at, read_at)
  10. `notifications` (id, user_id, type, payload JSON, read_at, created_at)
  11. `audit_logs` (**Table unique unifiée** : id, vendor_request_id nullable, actor_id, target_user_id nullable, action, old_data JSON, new_data JSON, ip, user_agent, timestamp, prev_hash, row_hash)
  12. `sap_sync_logs` (id, vendor_request_id, attempt, status, http_code, response JSON, created_at)
  13. `refresh_tokens` (id, user_id, token_hash, expires_at, revoked_at, created_at)
  14. `ai_settings` (key_name PK, setting_value JSON, updated_by, updated_at)
- [ ] **T1.4** : Définir les triggers MySQL `BEFORE UPDATE` et `BEFORE DELETE` sur `audit_logs` pour garantir l'inaltérabilité physique (`SIGNAL SQLSTATE '45000'`).
- [ ] **T1.5** : Créer le script `npm run db:create` pour créer la base `tui_masterdata_prod` si inexistante, et `npm run migrate` pour jouer les migrations.
- [ ] **T1.6** : Créer le script `npm run bootstrap:admin` pour initialiser le premier compte administrateur à partir de `BOOTSTRAP_ADMIN_EMAIL` et `BOOTSTRAP_ADMIN_PASSWORD` (`must_change_password = 1`).
- [ ] **T1.7** : Créer le script `npm run seed:dev` (uniquement exécutable si `NODE_ENV !== 'production'`) pour générer des données de test développeur (aucun projet en dur par défaut).

#### Critères d'Acceptation (CA)
1. L'application Node.js se connecte à MySQL avec le compte `md_app` ; la connexion en tant que `root` est interdite.
2. Une tentative de connexion de `md_app` vers `masterdata_ia` échoue par refus de privilèges MySQL (`Access denied`).
3. La table `admin_actions` n'existe pas : toutes les actions admin et métier sont écrites dans `audit_logs`.
4. Une tentative directe de `UPDATE` ou `DELETE` sur `audit_logs` déclenche une erreur SQL 45000.
5. `npm run bootstrap:admin` crée un administrateur unique avec mot de passe haché de manière sécurisée.

---

### 🎟️ TICKET E2 — Authentification Réelle & Sécurité

#### Objectifs & Tâches
- [ ] **T2.1** : Implémenter l'authentification avec JWT court (15 min) + Refresh Token rotatif stocké en cookie HTTP-Only sécurisé et historisé dans `refresh_tokens`.
- [ ] **T2.2** : Hachage des mots de passe avec bcrypt (12 rounds) ou argon2, politique de mot de passe forte (8+ caractères, majuscule, minuscule, chiffre, symbole).
- [ ] **T2.3** : Verrouillage temporaire du compte (15 min) après 5 tentatives infructueuses, suivi dans `failed_attempts` et `locked_until`.
- [ ] **T2.4** : Réinitialisation de mot de passe par e-mail avec token cryptographique SHA-256 à usage unique et durée de validité limitée (1 heure).
- [ ] **T2.5** : Forçage du changement de mot de passe à la première connexion (`must_change_password === 1`).
- [ ] **T2.6** : Middleware RBAC strict et middleware d'isolation par périmètre projet (`project_scope`), filtrant les requêtes selon les affectations `user_projects`.
- [ ] **T2.7** : Sécurité HTTP : Helmet, CORS strict avec liste blanche des origines, rate limiting sur `/api/v1/auth/*`, validation Zod stricte sur chaque payload, téléversement sécurisé de fichiers (Multer avec vérification de type MIME réel, taille max, hash SHA-256).

#### Critères d'Acceptation (CA)
1. Un Vendor ne peut accéder à aucun dossier d'un tiers (test automatisé renvoyant 403/404).
2. Un Agent affecté au projet A ne peut lire aucune demande rattachée au projet B (test automatisé avec 2 projets créés dynamiquement).
3. Accès sans Bearer Token → `401 Unauthorized`.
4. Accès avec rôle inadapté → `403 Forbidden`.
5. 5 mots de passe erronés consécutifs → compte verrouillé avec code HTTP 423.

---

### 🎟️ TICKET E3 — Interface Admin & Configuration Multi-Projets

#### Objectifs & Tâches
- [ ] **T3.1** : Tableau de bord technique système (compteurs utilisateurs par rôle, comptes actifs/suspendus, état des services MySQL/Redis/IA/SMTP, métriques d'erreurs).
- [ ] **T3.2** : Gestion des utilisateurs (CRUD complet, recherche, filtres par rôle/statut, pagination, suspension/réactivation immédiate, réinitialisation de mot de passe forcée, affectation de rôle et de projets). Toutes les actions sont tracées dans `audit_logs` avec `target_user_id`.
- [ ] **T3.3** : Gestion des projets génériques :
  - Création/modification de projet (nom, code unique, description, devises autorisées JSON).
  - Gestion des pays rattachés (codes ISO 3166) et configuration des pièces obligatoires par pays (`required_documents` JSON).
  - Activation/désactivation d'un projet (un projet inactif reste consultable en lecture seule pour l'audit).
  - Assistant optionnel au premier lancement proposant de charger le template de démonstration Western / Nordic / TGBST.
- [ ] **T3.4** : Page de configuration IA (paramétrage en base `ai_settings` des seuils d'anomalie, seuils de matching, confiance OCR minimale, validité des invitations).
- [ ] **T3.5** : Journal d'audit global unifié (consultation, filtres avancés, vérification de l'intégrité de la chaîne de hachage SHA-256 via `GET /api/v1/admin/audit-logs/verify`, export CSV).
- [ ] **T3.6** : État de santé du moteur IA (version des modèles, date de dernier entraînement, temps d'inférence).

#### Critères d'Acceptation (CA)
1. L'Admin crée un compte Agent affecté à un projet P1. L'action est inscrite dans `audit_logs` avec `target_user_id`. L'agent reçoit son invitation, active son compte et n'accède qu'au projet P1.
2. La désactivation d'un projet par l'Admin bloque immédiatement toute nouvelle création de demande sur ce périmètre tout en préservant l'audit.
3. La vérification cryptographique de l'audit trail confirme la validité de la chaîne de hachage.

---

### 🎟️ TICKET E4 — Portail Requester & Invitation Fournisseur

#### Objectifs & Tâches
- [ ] **T4.1** : Tableau de bord du demandeur : synthèse de mes demandes par statut, alertes d'action requise.
- [ ] **T4.2** : Formulaire de création de demande d'onboarding ou de modification de profil rattachée à un projet autorisé.
- [ ] **T4.3** : Module d'invitation d'un fournisseur par e-mail : génération d'un jeton d'invitation unique (validité configurable, par défaut 7 jours, usage unique), envoi du lien d'onboarding par l'adaptateur e-mail.
- [ ] **T4.4** : Frise chronologique interactive du workflow montrant précisément l'avancement du dossier (Soumis → Contrôle Agent → Approbation Manager → Sync SAP).
- [ ] **T4.5** : Messagerie contextuelle rattachée au dossier permettant d'échanger avec l'Agent et le Fournisseur.
- [ ] **T4.6** : Téléchargement des pièces justificatives et export PDF de la fiche de synthèse du fournisseur validé.

#### Critères d'Acceptation (CA)
1. Le Requester envoie une invitation → Le Vendor reçoit le lien unique d'invitation.
2. Le lien d'invitation ne peut être utilisé qu'une seule fois ; une tentative de réutilisation ou un lien expiré renvoie une erreur explicite.
3. Le dossier créé par le Vendor apparaît instantanément dans le suivi du Requester avec son statut à jour.

---

### 🎟️ TICKET E5 — Portail Vendor (Onboarding & Autonomie)

#### Objectifs & Tâches
- [ ] **T5.1** : Page d'activation de compte via le jeton d'invitation : choix du mot de passe sécurisé, validation des conditions générales.
- [ ] **T5.2** : Assistant d'onboarding structuré en 4 étapes :
  - Étape 1 : Identité de l'entreprise (raison sociale, SIRET, TVA intracommunautaire, adresse, pays).
  - Étape 2 : Coordonnées bancaires avec contrôle en direct de l'IBAN (Modulo 97 ISO 13616) et validation BIC/SWIFT.
  - Étape 3 : Dépôt sécurisé des justificatifs requis (glisser-déposer, contrôle strict du format PDF/PNG/JPEG et de la taille maximale).
  - Étape 4 : Récapitulatif global, signature électronique déclarative et soumission définitive.
- [ ] **T5.3** : Sauvegarde automatique du brouillon (`DRAFT`) pour reprise ultérieure.
- [ ] **T5.4** : Demande de modification de coordonnées (IBAN, adresse) avec justificatif obligatoire.
- [ ] **T5.5** : Suivi de statut temps réel, messagerie avec les équipes Master Data, alertes en cas de `MISSING_INFORMATION`.
- [ ] **T5.6** : Cloisonnement strict : le fournisseur n'a accès à aucune métrique IA interne ni à aucune donnée d'un autre tiers.

#### Critères d'Acceptation (CA)
1. La saisie d'un IBAN dont la clé Modulo 97 est fausse bloque immédiatement la validation avec un message explicite.
2. La soumission finale passe le dossier au statut `SUBMITTED`, consigne l'action dans `audit_logs` avec hash cryptographique, et déclenche l'analyse IA asynchrone.
3. Aucune donnée d'évaluation interne (score de fraude, risque, doublons) n'est renvoyée au frontend Vendor.

---

### 🎟️ TICKET E6 — Moteur Data Science (FastAPI) & Endpoint `POST /forecast`

#### Objectifs & Tâches
- [ ] **T6.1** : Microservice FastAPI structuré (`app/routers/`, `app/services/`, `app/models/`, `app/schemas/`).
- [ ] **T6.2** : **Axe 1 — OCR & NLP** : Prétraitement OpenCV (niveaux de gris, redressement Hough, filtre bilatéral, binarisation Sauvola), OCR réel (PaddleOCR avec repli Tesseract), extraction regex + heuristiques pour IBAN, BIC, TVA, raison sociale avec confiance par champ.
- [ ] **T6.3** : **Axe 2 — Détection d'Anomalies** : Modèle Isolation Forest (200 estimateurs, contamination 0.05) sur variables structurelles et comportementales.
- [ ] **T6.4** : **Axe 3 — Déduplication Sémantique** : Vectorisation Sentence-BERT multilingue MiniLM (384 dimensions) avec cache Redis (repli cache mémoire) + RapidFuzz sur raison sociale et TVA.
- [ ] **T6.5** : **Axe 4 — Scoring de Risque** : Modèle XGBoost / HistGradientBoosting (300 arbres, learning rate 0.05) empilé sur le score d'anomalie avec décomposition des facteurs explicatifs.
- [ ] **T6.6** : **Axe 5 — Segmentation Fournisseurs** : Clustering K-Means (k=4) avec encodage dynamique des projets et pays actifs en base.
- [ ] **T6.7** : **Axe 6 — Prévisions Temporelles (`POST /api/v1/forecast`)** : Modèle additif (tendance + saisonnalité hebdomadaire/touristique) projetant sur 30/60/90 jours la volumétrie entrante, le délai moyen de traitement en jours et le risque de dépassement SLA (48h).
- [ ] **T6.8** : **Axe 7 — RAG Assistant (`POST /api/v1/rag-query`)** : Recherche vectorielle FAISS sur documents internes TUI avec citation obligatoire des sources.
- [ ] **T6.9** : **Scripts d'Entraînement Réel** : `train_models.py` lisant les données effectives de la base MySQL. Si volume insuffisant, mode déterministe explicite (`RULE_BASED_MODE`).
- [ ] **T6.10** : **Appel Asynchrone depuis Node.js** : La soumission d'une demande lance un appel non bloquant au pipeline FastAPI ; les résultats sont persistés dans `vendor_requests.ai_result` et notifiés par WebSocket/Socket.IO.

#### Critères d'Acceptation (CA)
1. L'endpoint `POST /api/v1/forecast` renvoie les projections temporelles et le taux de respect SLA avec intervalle de confiance.
2. Le dépôt d'un document génère l'extraction des champs et les indices de confiance en moins de 5 secondes.
3. Si le service FastAPI est arrêté, le backend continue de fonctionner sans crasher, affiche un bandeau « Analyse IA temporairement indisponible » et consigne la tâche pour relance.
4. L'exécution de `pytest` dans `ai-engine/` valide le contrat d'interface Pydantic/FastAPI avec 100% de succès.

---

### 🎟️ TICKET E7 — Interface Master Data Agent (Contrôle Opérationnel)

#### Objectifs & Tâches
- [ ] **T7.1** : File de traitement priorisée et filtrable (par projet affecté, statut, niveau de risque, ancienneté, recherche textuelle).
- [ ] **T7.2** : Fiche d'instruction en **écran divisé (split screen)** :
  - Volet gauche : visionneuse documentaire (PDF / Image) avec zoom et rotation.
  - Volet droit : comparaison champ par champ (données déclarées par le fournisseur vs données extraites par l'OCR), avec mise en évidence colorée des écarts et score de confiance par champ.
- [ ] **T7.3** : Volet d'alertes doublons : liste des candidats les plus proches avec pourcentage de similarité et comparaison côte à côte.
- [ ] **T7.4** : Actions de décision opérationnelle :
  - Valider et transmettre au Manager (`VERIFIED_BY_AGENT`).
  - Demander des informations complémentaires (`MISSING_INFORMATION`) avec **commentaire explicatif obligatoire**.
  - Rejeter le dossier (`REJECTED`) avec **motif obligatoire**.
- [ ] **T7.5** : Messagerie intégrée et historique complet des interventions sur le dossier.

#### Critères d'Acceptation (CA)
1. Tentative de passage en `REJECTED` ou `MISSING_INFORMATION` sans commentaire refusée par le client et l'API (HTTP 400).
2. L'Agent ne peut pas approuver définitivement le dossier (l'approbation finale reste le monopole du Manager).
3. L'Agent ne voit que les demandes appartenant aux projets qui lui sont affectés.

---

### 🎟️ TICKET E8 — Interface Manager Approval, Forecast & Export ERP (SAP)

#### Objectifs & Tâches
- [ ] **T8.1** : Tableau de bord exécutif avec KPI par projet (dossiers en cours, taux d'approbation/rejet, délai moyen de traitement SLA, distribution des scores de risque).
- [ ] **T8.2** : File d'approbation managériale triée par score de risque décroissant avec badges de recommandation IA (« Approbation directe recommandée », « Contrôle approfondi requis », « Risque critique »).
- [ ] **T8.3** : Fiche d'arbitrage 360° : jauge de risque globale, liste ordonnée des facteurs de risque explicatifs, segment fournisseur, alertes de doublons, timeline d'audit complète avec empreintes cryptographiques.
- [ ] **T8.4** : Décisions managériales :
  - **Approuver** (`APPROVED`) : déclenche automatiquement l'export ERP via l'adaptateur configuré.
  - **Rejeter** (`REJECTED`) : motif de refus obligatoire tracé dans l'audit.
- [ ] **T8.5** : **Adaptateur SAP Configurable (`ErpExporter`)** :
  - `SapHttpExporter` : POST HTTP vers `SAP_API_URL` avec payload CREMAS05 / ADRMAS03 certifié et capture du code ACK.
  - `FileExporter` : écriture d'un fichier d'échange horodaté dans `backend/exports/`.
  - Enregistrement de chaque tentative dans `sap_sync_logs` ; en cas d'erreur réseau, statut `SYNC_FAILED` et mise à disposition d'un bouton « Relancer la synchronisation ».
- [ ] **T8.6** : **Vue Analytique & Prédictive (Consommation de `POST /forecast`)** :
  - Route backend `GET /api/v1/manager/forecast` appelant l'endpoint FastAPI `POST /forecast`.
  - Graphique Recharts prédictif affichant l'historique et la projection 30/60/90 jours du volume et des délais SLA 48h.
- [ ] **T8.7** : Assistant conversationnel RAG avec citations des textes réglementaires.

#### Critères d'Acceptation (CA)
1. L'approbation finale par le Manager déclenche l'export SAP via l'adaptateur et consigne la ligne dans `sap_sync_logs` et `audit_logs`.
2. En cas d'échec de transmission vers l'ERP, le statut devient `SYNC_FAILED` avec possibilité pour le Manager de relancer la tentative.
3. La vue de prévision (`GET /api/v1/manager/forecast`) affiche les séries temporelles générées par le microservice IA.

---

### 🎟️ TICKET E9 — Design System « Clean Blue & White » & Finitions UI

#### Objectifs & Tâches
- [ ] **T9.1** : Centralisation des jetons de design dans un thème unique Tailwind/CSS :
  - Bleu primaire : `#1E5BD8` (hover `#174AB5`, actif `#123C93`)
  - Bleu marine : `#0B2A5B` (sidebar, titres institutionnels)
  - Bleu clair : `#EAF1FF` (sélections, badges neutres)
  - Fond de page : `#F5F8FD`
  - Surfaces / Cartes : `#FFFFFF`, bordure `#E3E9F2`
  - Typographie : Inter, police arabe Noto Sans Arabic.
- [ ] **T9.2** : Composants réutilisables standardisés : boutons avec états (loading, disabled), formulaires avec messages d'erreurs Zod en ligne, tables avec tri/filtres/pagination serveur, modales accessibles (focus trap), toasts de notification, squelettes de chargement (skeletons), états vides illustrés.
- [ ] **T9.3** : Page de connexion professionnelle à écran divisé : volet gauche bleu marine institutionnel avec présentation de la plateforme et conformité SOX/SEPA, volet droit formulaire épuré avec sélecteur de langue.
- [ ] **T9.4** : Internationalisation complète **FR / EN / AR** :
  - Fichiers de traduction complets à 100% (zéro clé manquante).
  - Bascule automatique du sens de lecture (`dir="rtl"`) pour la langue arabe avec adaptation des icônes et alignements.
  - Mémorisation de la langue préférée dans le profil utilisateur en base.
- [ ] **T9.5** : Cloche de notifications temps réel (Socket.IO) avec alertes sonores subtiles et mise à jour dynamique des badges.

#### Critères d'Acceptation (CA)
1. Audit visuel complet de chaque interface en Français, Anglais et Arabe (avec RTL parfait).
2. Aucune clé de traduction manquante dans la console.
3. Score d'accessibilité Lighthouse ≥ 90 (contrastes WCAG AA, focus visible, navigation clavier).

---

### 🎟️ TICKET E10 — Tests Complets, Déploiement & Documentation

#### Objectifs & Tâches
- [ ] **T10.1** : Suite de tests automatisés :
  - Tests unitaires et d'intégration Jest + Supertest pour le backend Node.js (couverture ≥ 70%).
  - Tests unitaires Pytest pour le microservice FastAPI (contrats Pydantic, inférence, métriques, forecast).
  - Tests E2E Playwright couvrant les scénarios nominaux : *Création de projet → Invitation Vendor → Onboarding Vendor → Analyse IA → Contrôle Agent → Approbation Manager → Export SAP*, ainsi que le scénario de *Rejet motivé*.
- [ ] **T10.2** : Configuration Docker & Déploiement :
  - `docker-compose.yml` complet orchestrant `frontend`, `api-node`, `api-fastapi`, `mysql`, `redis`, et `nginx` (reverse proxy avec headers de sécurité et terminaison TLS).
  - Healthchecks configurés sur chaque service avec politique de redémarrage automatique.
  - Déploiement à froid reproductible en une commande : `docker compose up --build`.
- [ ] **T10.3** : Documentation technique & opérationnelle complète :
  - `README.md` avec guide d'installation pas-à-pas en local et sous Docker.
  - `docs/ARCHITECTURE.md` (schémas C4, flux de données, modèle de sécurité).
  - `docs/API.md` (spécification OpenAPI/Swagger synchronisée).
  - `docs/USER_GUIDE.md` (guide utilisateur détaillé illustré par rôle).
  - `docs/BACKUP_RECOVERY.md` (procédure de sauvegarde et restauration MySQL avec vérification d'audit).

#### Critères d'Acceptation (CA)
1. L'ensemble des tests (Jest, Pytest, Playwright) s'exécute avec succès (100% verts).
2. `docker compose ps` montre tous les conteneurs avec l'état `healthy`.
3. Documentation complète et testée sur un environnement vierge.

---

## 3. Protocole de Validation

1. **Ce plan intègre les 4 directives préalables validées.**
2. Aucun ticket ne débutera sans votre feu vert explicite.
3. Dès votre accord, le ticket **E0** démarrera immédiatement par les tâches bloquantes T0.0.1 (dump SQL `/backups`) et T0.0.2 (tag `pre-refactor`).
