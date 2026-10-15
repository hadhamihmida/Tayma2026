# Registre des Décisions d'Architecture (ADR) — Master Data IA

> Ce document consigne l'ensemble des choix d'architecture, hypothèses structurantes et décisions techniques prises pour la plateforme de production Master Data IA.

---

## ADR-001 : Protection et Sanctuarisation de la Base Historique `masterdata_ia`

- **Date** : 15 Octobre 2026
- **Statut** : Validé / Bloquant
- **Contexte** : Une ancienne base de données de démonstration nommée `masterdata_ia` est présente sur le serveur MySQL local. Elle ne doit en aucun cas être modifiée, tronquée, altérée ou supprimée.
- **Décision** :
  1. La nouvelle base de données de production s'appelle `tui_masterdata_prod`.
  2. Le nom de la base est lu **exclusivement** via la variable d'environnement `DB_NAME`.
  3. **Garde-fou applicatif renforcé** : Tous les scripts de migration (`npm run db:create`, `npm run migrate`, `npm run seed:dev`, `npm run bootstrap:admin`) et le fichier de configuration de l'API exécutent une normalisation stricte avant vérification :
     ```javascript
     const cleanDbName = (process.env.DB_NAME || '').toLowerCase().replace(/[\s_\-]+/g, '');
     if (cleanDbName.includes('masterdataia')) {
       console.error('ERREUR CRITIQUE DE SÉCURITÉ : Interdiction formelle de cibler la base masterdata_ia !');
       process.exit(1);
     }
     ```
     La comparaison est donc insensible à la casse, sans espaces et sans caractères de séparation.
- **Conséquences** : Risque d'écrasement ou d'accès involontaire aux données antérieures réduit à zéro.

---

## ADR-002 : Utilisateur MySQL Dédié (`md_app`) Limité à `tui_masterdata_prod`

- **Date** : 15 Octobre 2026
- **Statut** : Validé / Sécurité
- **Contexte** : L'accès direct en tant qu'utilisateur `root` sans mot de passe représente une vulnérabilité critique et augmente le risque d'intervention accidentelle sur d'autres schémas de la base de données.
- **Décision** :
  1. L'application Node.js ne se connecte **jamais en tant que `root`**.
  2. Un utilisateur MySQL dédié nommé `md_app` est provisionné (script `db:setup-user` exécuté lors de l'initialisation du serveur MySQL).
  3. Les droits de `md_app` sont **strictement confinés** au schéma `tui_masterdata_prod` :
     ```sql
     CREATE USER IF NOT EXISTS 'md_app'@'localhost' IDENTIFIED BY 'StrongAppPassword2026!';
     CREATE USER IF NOT EXISTS 'md_app'@'%' IDENTIFIED BY 'StrongAppPassword2026!';
     GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, REFERENCES, INDEX, ALTER, TRIGGER ON `tui_masterdata_prod`.* TO 'md_app'@'localhost';
     GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, REFERENCES, INDEX, ALTER, TRIGGER ON `tui_masterdata_prod`.* TO 'md_app'@'%';
     REVOKE ALL PRIVILEGES ON `masterdata_ia`.* FROM 'md_app'@'localhost';
     REVOKE ALL PRIVILEGES ON `masterdata_ia`.* FROM 'md_app'@'%';
     FLUSH PRIVILEGES;
     ```
  4. Les identifiants `DB_USER=md_app` et `DB_PASSWORD=...` sont injectés via `.env`.
- **Conséquences** : Même en cas de défaillance logicielle, l'utilisateur applicatif MySQL n'a techniquement aucun droit de lecture ou d'écriture sur la base historique `masterdata_ia`.

---

## ADR-003 : Fusion de la Table `admin_actions` dans la Table Unique `audit_logs`

- **Date** : 15 Octobre 2026
- **Statut** : Validé / Conformité SOX
- **Contexte** : L'ancien modèle de données séparait artificiellement `admin_actions` (actions de sécurité de l'administrateur) et `audit_logs` (actions métier sur les dossiers). Cela fragmentait la chaîne d'audit, créait des duplications et rompait l'unicité de la chaîne cryptographique.
- **Décision** :
  1. La table `admin_actions` est **définitivement supprimée du modèle cible**.
  2. Toutes les actions (administratives, techniques, et métier) sont unifiées dans la table unique `audit_logs`.
  3. Le schéma unifié inclut :
     - `id` (INT AUTO_INCREMENT PK)
     - `vendor_request_id` (INT NULLABLE FK, lié au dossier s'il existe)
     - `actor_id` (INT NOT NULL FK vers `users`, auteur de l'action)
     - `target_user_id` (INT NULLABLE FK vers `users`, utilisateur affecté pour les actions admin)
     - `action` (VARCHAR(100), ex: `USER_CREATED`, `ROLE_UPDATED`, `REQUEST_SUBMITTED`, `AI_SCREENED`, `MANAGER_APPROVED`)
     - `old_data` (JSON NULLABLE, snapshot avant modification)
     - `new_data` (JSON NULLABLE, snapshot après modification)
     - `ip` (VARCHAR(45))
     - `user_agent` (VARCHAR(255))
     - `timestamp` (DATETIME DEFAULT CURRENT_TIMESTAMP)
     - `prev_hash` (CHAR(64) SHA-256)
     - `row_hash` (CHAR(64) SHA-256)
  4. La chaîne SHA-256 et les triggers `BEFORE UPDATE` et `BEFORE DELETE` s'appliquent à l'ensemble des événements de la plateforme.
- **Conséquences** : Piste d'audit centralisée, intègre, inviolable et conforme aux exigences SOX et Sapin II.

---

## ADR-004 : Sauvegarde Préalable et Snapshot Git Avant Refactorisation

- **Date** : 15 Octobre 2026
- **Statut** : Validé / Gestion des Risques
- **Contexte** : Avant d'engager les travaux du ticket E0 (suppression du code de démo et refactorisation), il est impératif de figer l'état exact initial du projet et de la base de données.
- **Décision** :
  1. Création d'un dossier `/backups/` à la racine du dépôt.
  2. Export SQL intégral de la base existante `masterdata_ia` dans `/backups/legacy_masterdata_ia_dump.sql` via `mysqldump`.
  3. Création et pose d'un tag Git officiel : `git tag pre-refactor` avec commit de référence.
- **Conséquences** : Point de restauration immuable garantissant un retour en arrière immédiat en cas de besoin.

---

## ADR-005 : Architecture Multi-Projets Entièrement Générique (Zéro Hardcoding)

- **Date** : 15 Octobre 2026
- **Statut** : Validé
- **Contexte** : Le rapport cite trois périmètres géographiques (Western, Nordic, TGBST). Dans l'ancien code, ces noms étaient codés en dur comme des ENUMs et des constantes front/back.
- **Décision** :
  1. Création de tables relationnelles `projects`, `project_countries` et `user_projects`.
  2. Un projet est défini par son `code` (ex: `WESTERN`, `NORDIC`, `APAC`), son `name`, ses devises autorisées (`currencies` JSON) et ses pays rattachés avec la liste des pièces obligatoires par pays (`required_documents` JSON).
  3. L'Admin crée, modifie, désactive ou réactive des projets directement dans l'interface sans modification de code ni redéploiement.
  4. L'isolation par périmètre est appliquée au niveau SQL par jointure sur `user_projects` (sauf pour le rôle `admin` qui a une visibilité transverse).
- **Conséquences** : La solution est un progiciel généraliste pouvant être déployé pour n'importe quel département ou filiale.

---

## ADR-006 : Piste d'Audit Inaltérable avec Chaînage Cryptographique (SOX / Sapin II)

- **Date** : 15 Octobre 2026
- **Statut** : Validé
- **Contexte** : Les normes financières SOX et Sapin II exigent une traçabilité totale et la preuve d'inaltérabilité de l'historique des actions sur les données fournisseurs.
- **Décision** :
  1. La table `audit_logs` comporte les colonnes `prev_hash` et `row_hash`.
  2. Chaque insertion calcule `row_hash = SHA256(prev_hash + id + actor_id + action + timestamp + JSON(old_data) + JSON(new_data))`.
  3. Deux triggers MySQL sont créés :
     - `BEFORE UPDATE` sur `audit_logs` levant une erreur SQL (`SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Table audit_logs is append-only'`).
     - `BEFORE DELETE` sur `audit_logs` levant la même erreur.
  4. Un endpoint d'audit `GET /api/v1/admin/audit-logs/verify` permet de recalculer l'intégralité de la chaîne pour certifier l'intégrité de la piste.
- **Conséquences** : Conformité aux plus hauts standards d'audit financier mondial.

---

## ADR-007 : Authentification Robuste, Sessions & Gestion des Comptes

- **Date** : 15 Octobre 2026
- **Statut** : Validé
- **Contexte** : Suppression intégrale du Role Switcher et des mots de passe codés en dur.
- **Décision** :
  1. Tokens : Access Token JWT court (15 minutes) + Refresh Token rotatif stocké en cookie HTTP-Only sécurisé et enregistré dans `refresh_tokens` pour révocation immédiate au logout.
  2. Hachage des mots de passe : `bcrypt` avec 12 rounds ou `argon2`.
  3. Sécurité : Verrouillage temporaire du compte (15 minutes) après 5 échecs consécutifs.
  4. Pas d'inscription publique. Amorçage du premier admin via le script `npm run bootstrap:admin`.
  5. Invitation fournisseur via token cryptographique unique (`invitations`) valide 7 jours à usage unique.
  6. Obligation de changement de mot de passe (`must_change_password`) à la première connexion.
- **Conséquences** : Chaque utilisateur dispose de son propre compte réel et de sa propre interface hermétique.

---

## ADR-008 : Adaptateurs Externes Réels et Configurables (SAP & E-mails)

- **Date** : 15 Octobre 2026
- **Statut** : Validé
- **Contexte** : Ni mock factice, ni dépendance bloquante envers un système tiers non disponible en local.
- **Décision** :
  1. **Adaptateur SAP** : Implémentation du pattern Strategy avec l'interface `ErpExporter` :
     - `SapHttpExporter` : effectue une vraie requête HTTP POST avec payload certifié vers `SAP_API_URL` et attend l'accusé de réception (ACK).
     - `FileExporter` : génère un fichier d'échange horodaté structuré au format SAP IDoc dans `backend/exports/`.
     - Choix déterminé par la variable d'environnement `SAP_EXPORTER_TYPE=file|http`.
     - Chaque exécution est consignée dans la table `sap_sync_logs` et dans `audit_logs`.
  2. **Adaptateur E-mail** : Service Nodemailer basé sur `SMTP_*`. En développement, support de Mailpit ou journalisation fichier locale avec templates HTML bilingues (FR/EN) prêts pour l'invitation, la réinitialisation et les notifications.
- **Conséquences** : Code réel, testable sans friction, prêt à être branché sur les passerelles réseau d'entreprise.

---

## ADR-009 : Endpoint IA `POST /forecast` & Séries Temporelles pour `GET /manager/forecast`

- **Date** : 15 Octobre 2026
- **Statut** : Validé / Fonctionnel
- **Contexte** : Le Manager Approbateur a besoin d'anticiper les pics de volumétrie de demandes (onboarding / modifications) et de vérifier la tenue des SLA (délai moyen cible de 48h).
- **Décision** :
  1. Le microservice FastAPI implémente l'endpoint officiel `POST /api/v1/forecast` (Axe 6 Séries Temporelles).
  2. Payload d'entrée : horizon de prévision (30, 60, 90 jours), projet optionnel, données historiques journalières.
  3. Traitement : modèle additif (SARIMA / décomposition tendance + saisonnalité hebdomadaire et mensuelle touristique + bruit gaussien).
  4. Réponse : projection journalière du nombre de dossiers, intervalle de confiance à 95%, estimation du délai moyen de traitement en jours, et probabilité de dépassement du SLA 48h.
  5. Côté backend Node.js : la route `GET /api/v1/manager/forecast` relaie la requête vers l'endpoint FastAPI `POST /forecast` et renvoie les données formatées pour les graphiques Recharts de l'interface Manager.
- **Conséquences** : Pilotage capacitaire prédictif réel pour la gouvernance financière.

---

## ADR-010 : Design System « Clean Blue & White » & Accessibilité

- **Date** : 15 Octobre 2026
- **Statut** : Validé
- **Contexte** : L'application doit projeter le sérieux, la rigueur et l'élégance d'une suite financière d'entreprise (façon Stripe / Bloomberg / SAP Fiori modernisé).
- **Décision** :
  1. Palette dominante : Blanc (`#FFFFFF`), Fond doux (`#F5F8FD`), Bleu Primaire (`#1E5BD8`), Bleu Marine institutionnel (`#0B2A5B`), Bordures subtiles (`#E3E9F2`).
  2. Typographie : Inter avec support Noto Sans Arabic.
  3. Support complet RTL pour la langue arabe (`dir="rtl"` automatique selon `i18n.language`).
  4. Accessibilité : Conforme WCAG 2.1 AA (contraste minimal de 4.5:1 sur tous les textes).
- **Conséquences** : Interface claire, moderne, sans surcharge visuelle, optimisée pour les équipes comptables et financières.
