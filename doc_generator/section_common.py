# -*- coding: utf-8 -*-
"""
doc_generator/section_common.py
Génération des chapitres communs de la documentation utilisateur
"""

from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from .styles import (
    add_h1, add_h2, add_h3, add_p, add_bullet, add_callout,
    add_header_cell, add_body_cell
)

def build_section_common(doc):
    # =========================================================================
    # CHAPITRE 1 : VUE D'ENSEMBLE & ARCHITECTURE GLOBALE
    # =========================================================================
    add_h1(doc, "1. Vue d'Ensemble & Architecture Globale")
    
    add_p(doc, 
        "La plateforme « Master Data IA » est une solution SaaS B2B de gouvernance des référentiels tiers et de "
        "prévention de la fraude au virement. Conçue pour répondre aux impératifs de conformité financière (SOX, SEPA, Loi Sapin II) "
        "au sein du groupe TUI Finance, elle digitalise l'intégralité du cycle de vie des fournisseurs : depuis l'onboarding initial "
        "ou la modification de coordonnées bancaires, jusqu'à l'injection automatisée et certifiée dans le progiciel SAP S/4HANA.",
        bold_prefix="Contexte et finalité métier : "
    )
    
    add_p(doc, 
        "Dans l'industrie du tourisme, la gestion de milliers de prestataires hôteliers, réceptifs et transporteurs expose l'organisation "
        "à des risques financiers critiques. Le processus traditionnel manuel présente des vulnérabilités majeures : faux ordres de virement "
        "internationaux (FOVI), usurpations d'identité par piratage d'e-mails, erreurs de saisie d'IBAN et domiciliations bancaires opaques dans des "
        "paradis fiscaux. Master Data IA neutralise ces menaces en interposant un sas de contrôle automatisé piloté par l'intelligence artificielle.",
        bold_prefix="Enjeux de sécurisation : "
    )

    add_h2(doc, "1.1. Architecture Logicielle Multi-Tiers")
    add_p(doc, "Le système s'articule autour de quatre composants techniques découplés et hautement résilients :")
    
    t_arch = doc.add_table(rows=5, cols=4)
    t_arch.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers_arch = ["Composant", "Technologie Principale", "Port Réseau", "Rôle Opérationnel dans la Solution"]
    widths_arch = [Inches(1.4), Inches(1.8), Inches(1.0), Inches(2.6)]
    for i, h in enumerate(headers_arch):
        add_header_cell(t_arch.cell(0, i), h, widths_arch[i])

    rows_arch = [
        ("Frontend Web (SPA)", "React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, jsPDF", "Port 3000", "Interface monopage moderne, responsive, multilingue (FR/EN/AR) avec basculement RTL complet et mode clair/sombre."),
        ("Backend Applicatif", "Node.js (Express), Helmet, Rate-Limit, Joi, JWT, Bcrypt", "Port 5000", "Passerelle API REST sécurisée, moteur de règles de gestion, contrôle d'accès RBAC strict et piste d'audit immuable."),
        ("Microservice IA", "Python 3.11, FastAPI, Uvicorn, Scikit-Learn, RapidFuzz", "Port 8000", "Moteur d'inférence en temps réel à 7 axes : OCR, Isolation Forest, matching sémantique, scoring de risque SHAP et RAG."),
        ("Base de Données", "MySQL 8.0 via XAMPP (avec compatibilité JSON et PGlite secours)", "Port 3306", "Persistance relationnelle (base masterdata_ia) : référentiel tiers, demandes, documents, utilisateurs et logs d'audit.")
    ]
    for row_idx, data in enumerate(rows_arch, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            add_body_cell(t_arch.cell(row_idx, col_idx), val, is_even=is_even, width=widths_arch[col_idx])

    add_p(doc, "", space_after=4)

    add_h2(doc, "1.2. Cinématique Globale du Workflow Opérationnel")
    add_p(doc, "Le traitement d'un dossier suit une chaîne de gouvernance stricte à 4 niveaux :")
    
    add_bullet(doc, "Initiation du dossier : Le Fournisseur externe (Vendor) ou le Demandeur interne (Requester) saisit les coordonnées bancaires et téléverse les pièces justificatives (RIB, Kbis, Bolagsverket). Un contrôle direct Modulo 97 valide la syntaxe bancaire.", bold_prefix="Niveau 1 — Saisie & Dépôt : ")
    add_bullet(doc, "Contrôle & Rapprochement IA : L'Agent Master Data inspecte la file de traitement. Le moteur IA réalise l'extraction OCR du document, calcule le score de risque (0-100), décompose les facteurs d'explication SHAP et vérifie les doublons avec RapidFuzz.", bold_prefix="Niveau 2 — Instruction Agent : ")
    add_bullet(doc, "Arbitrage Financier : Le Manager Approbateur examine les dossiers sensibles. En cas d'anomalie, le rejet impose la saisie obligatoire d'un motif motivé (conformité SOX). En cas de conformité, il autorise l'intégration.", bold_prefix="Niveau 3 — Décision Manager : ")
    add_bullet(doc, "Synchronisation ERP : Le système simule puis génère le message officiel SAP S/4HANA (IDoc CREMAS05). Si le score de risque présente une réserve résiduelle, un blocage préventif des paiements (ZBLOCK = B) est automatiquement injecté.", bold_prefix="Niveau 4 — Injection SAP : ")

    add_callout(doc, 
        "Schéma d'ensemble illustrant les interactions entre les 4 couches : Navigateur Web (React port 3000), "
        "API Gateway Express (port 5000), Microservice IA FastAPI (port 8000) et ERP SAP S/4HANA via flux IDoc CREMAS05.",
        title="Schéma d'Architecture Applicative et Flux Métier Bout-en-Bout",
        callout_type="SCREENSHOT"
    )

    add_h2(doc, "1.3. Cycle de Vie des Statuts de Dossier")
    add_p(doc, "Chaque demande de création ou de modification de tiers transite selon un automate d'états fini et contrôlé :")
    
    t_stat = doc.add_table(rows=7, cols=3)
    t_stat.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers_stat = ["Code Statut", "Libellé Affiché dans l'Interface", "Description Fonctionnelle & Prochaine Étape"]
    widths_stat = [Inches(1.8), Inches(2.0), Inches(3.0)]
    for i, h in enumerate(headers_stat):
        add_header_cell(t_stat.cell(0, i), h, widths_stat[i])

    rows_stat = [
        ("DRAFT", "Brouillon", "Dossier en cours d'élaboration par le demandeur ou le fournisseur ; aucune vérification définitive engagée."),
        ("SUBMITTED", "Soumis pour Instruction", "Formulaire complet et pièces jointes téléversées ; le dossier entre dans la file de contrôle Master Data."),
        ("UNDER_REVIEW", "Contrôle en Cours", "Dossier pris en charge par l'Agent Master Data ; rapprochement OCR vs Déclaré et scoring IA en cours."),
        ("APPROVED", "Approuvé par le Manager", "Conformité administrative, fiscale et bancaire validée ; dossier prêt pour l'intégration dans le progiciel SAP."),
        ("REJECTED", "Rejeté (Motif Obligatoire)", "Dossier refusé pour non-conformité avérée ou suspicion de fraude ; motif officiel archivé dans la piste d'audit."),
        ("SYNCED_SAP", "Synchronisé SAP (IDoc Généré)", "Fiche tiers officiellement créée dans SAP S/4HANA ; numéro IDoc CREMAS05 consigné et actif.")
    ]
    for row_idx, data in enumerate(rows_stat, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            add_body_cell(t_stat.cell(row_idx, col_idx), val, is_even=is_even, width=widths_stat[col_idx])

    add_p(doc, "", space_after=6)

    # =========================================================================
    # CHAPITRE 2 : INSTALLATION & DÉMARRAGE
    # =========================================================================
    add_h1(doc, "2. Guide d'Installation & Procédure de Démarrage")
    add_p(doc, "Pour garantir le fonctionnement intègre de la solution, les services doivent être lancés dans un ordre chronologique précis.")
    
    add_h2(doc, "2.1. Prérequis Système")
    add_bullet(doc, "Environnement d'exécution JavaScript serveur v18.x ou v20.x LTS.", bold_prefix="Node.js : ")
    add_bullet(doc, "Interpréteur Python v3.10 ou v3.11 avec environnement virtuel (venv) dédié.", bold_prefix="Python : ")
    add_bullet(doc, "Serveur de base de données relationnelle MySQL v8.0 (ou MariaDB) démarré via le panneau de contrôle XAMPP.", bold_prefix="XAMPP / MySQL : ")
    add_bullet(doc, "Google Chrome, Mozilla Firefox ou Microsoft Edge à jour.", bold_prefix="Navigateur Web : ")

    add_h2(doc, "2.2. Ordre Séquentiel de Lancement des Services")
    
    t_start = doc.add_table(rows=5, cols=4)
    t_start.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers_start = ["Étape", "Microservice", "Répertoire de Travail", "Commande d'Exécution & Vérification"]
    widths_start = [Inches(0.8), Inches(1.8), Inches(1.8), Inches(2.4)]
    for i, h in enumerate(headers_start):
        add_header_cell(t_start.cell(0, i), h, widths_start[i])

    rows_start = [
        ("1", "MySQL (XAMPP)", "C:\\xampp", "Démarrer le module MySQL (Port 3306). Base requise : masterdata_ia."),
        ("2", "FastAPI (Moteur IA)", ".\\ai-engine", ".\\venv\\Scripts\\activate\nuvicorn app.main:app --port 8000\n-> Test : http://localhost:8000/health"),
        ("3", "Backend (Express API)", ".\\backend", "npm install\nnode server.js\n-> Test : http://localhost:5000/health"),
        ("4", "Frontend (React Vite)", ".\\frontend", "npm install\nnpm run dev\n-> Accès : http://localhost:3000")
    ]
    for row_idx, data in enumerate(rows_start, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            add_body_cell(t_start.cell(row_idx, col_idx), val, is_even=is_even, width=widths_start[col_idx])

    add_p(doc, "", space_after=4)

    add_callout(doc, 
        "Pour réinitialiser intégralement la base de données de test et réinjecter les 6 comptes et les 8 dossiers de démonstration, "
        "exécutez la commande suivante dans le dossier backend : node src/db/seed_all.js",
        title="Réinitialisation Rapide du Jeu de Démonstration",
        callout_type="TIP"
    )

    # =========================================================================
    # CHAPITRE 3 : AUTHENTIFICATION & SÉCURITÉ
    # =========================================================================
    add_h1(doc, "3. Authentification, Sessions & Sécurité Applicative")
    add_p(doc, "La sécurité de la plateforme est conçue selon le principe de défense en profondeur (Defense-in-Depth).")

    add_h2(doc, "3.1. Mécanismes d'Authentification & Mots de Passe")
    add_p(doc, "L'accès à l'application repose sur un système d'authentification robuste remplaçant les simulateurs basiques :")
    add_bullet(doc, "Les mots de passe ne sont jamais conservés en clair. Ils sont chiffrés à l'aide de l'algorithme Bcrypt avec un facteur de coût de salage de 10 tours, garantissant une protection contre les attaques par dictionnaire.", bold_prefix="Hachage Bcrypt : ")
    add_bullet(doc, "L'authentification génère un jeton d'accès (Access Token) signé cryptographiquement via HMAC-SHA256, transmis à chaque requête HTTP dans l'en-tête Authorization: Bearer <token>. Un jeton de rafraîchissement (Refresh Token) permet le renouvellement transparent.", bold_prefix="Double Jeton JWT : ")
    add_bullet(doc, "Un middleware d'interception détecte l'expiration du jeton (401 Unauthorized) et redirige l'utilisateur vers la mire de connexion en purgeant le stockage local.", bold_prefix="Expiration de Session : ")

    add_h2(doc, "3.2. Protection Anti-Force Brute & Verrouillage de Compte")
    add_p(doc, "Pour contrer les attaques automatisées par force brute :")
    add_bullet(doc, "Le point de terminaison /api/auth/login est protégé par un limiteur de débit limitant les requêtes à 10 tentatives par tranche de 15 minutes par adresse IP.", bold_prefix="Limitation de Débit (Rate Limiting) : ")
    add_bullet(doc, "Dès que 5 échecs consécutifs d'authentification sont enregistrés sur un même compte, celui-ci est automatiquement verrouillé pendant 15 minutes (champs failed_login_attempts et locked_until mis à jour en base de données). Tout essai subséquent est rejeté avec un message d'alerte explicite.", bold_prefix="Verrouillage Automatique : ")

    add_h2(doc, "3.3. Contrôle d'Accès Basé sur les Rôles (RBAC) & Cloisonnement Territorial")
    add_p(doc, "La sécurité est verrouillée de manière étanche à la fois côté serveur et côté client :")
    add_bullet(doc, "Les middlewares requireRole(...) et requireScope(...) valident sur chaque route API que le rôle du jeton JWT possède l'habilitation requise et que le périmètre territorial (WESTERN, NORDIC ou GLOBAL) correspond aux données cibles. Tout accès non autorisé est bloqué avec le code HTTP 403 Forbidden.", bold_prefix="Garde-fous Backend : ")
    add_bullet(doc, "Le composant React <ProtectedRoute> intercepte toute tentative de navigation directe via la barre d'adresse du navigateur. Si l'utilisateur tente d'accéder à une vue interdite, il est immédiatement refoulé vers son tableau de bord légitime.", bold_prefix="Garde-fous Frontend : ")

    add_callout(doc, 
        "Page de connexion (http://localhost:3000) montrant le formulaire épuré, le champ mot de passe avec bouton "
        "afficher/masquer, le lien 'Mot de passe oublié ?', le sélecteur de langue et les pastilles de connexion rapide 1 clic pour la démo.",
        title="Mire de Connexion Sécurisée et Mode Démo Intégré",
        callout_type="SCREENSHOT"
    )

    # =========================================================================
    # CHAPITRE 4 : MULTILINGUE & EXPÉRIENCE UTILISATEUR
    # =========================================================================
    add_h1(doc, "4. Internationalisation (FR / EN / AR), Support RTL & Thème Visuel")
    add_p(doc, "Pour répondre à l'envergure internationale de TUI Group, l'application intègre une architecture linguistique de pointe.")

    add_h2(doc, "4.1. Basculement Multilingue & Support RTL Intégral")
    add_p(doc, "L'en-tête de l'application intègre un sélecteur de langue représenté par une icône globe permettant de choisir parmi trois langues :")
    add_bullet(doc, "Langue officielle de travail pour la filiale Western (France, Espagne).", bold_prefix="Français (FR) : ")
    add_bullet(doc, "Langue corporate internationale pour le siège et les échanges transfrontaliers.", bold_prefix="English (EN) : ")
    add_bullet(doc, "Langue régionale complète avec inversion de lecture de droite à gauche.", bold_prefix="العربية (AR) : ")
    
    add_p(doc, 
        "Le passage en arabe déclenche dynamiquement l'application de l'attribut dir=\"rtl\" sur l'élément racine du document HTML. "
        "L'ensemble des composants de l'interface (barre latérale de navigation, alignement des textes, sens de lecture des graphiques, "
        "colonnes des tableaux et flèches de pagination) s'inverse naturellement pour offrir une ergonomie native et conforme aux standards arabophones.",
        bold_prefix="Comportement RTL (Right-to-Left) : "
    )
    add_p(doc, "La préférence linguistique sélectionnée est immédiatement enregistrée dans le stockage local du navigateur (localStorage).")

    add_h2(doc, "4.2. Formatage Internationalisé (Intl) & Thème Sombre")
    add_p(doc, "L'affichage des valeurs monétaires, pourcentages et dates est délégué à l'API native JavaScript Intl :")
    add_bullet(doc, "Format 150 000,00 € en français vs €150,000.00 en anglais vs 150.000,00 د.إ en arabe.", bold_prefix="Devises et Nombres : ")
    add_bullet(doc, "Format JJ/MM/AAAA en français vs MM/DD/YYYY en anglais.", bold_prefix="Dates et Horodatages : ")
    add_bullet(doc, "Un commutateur lune/soleil dans l'en-tête permet de basculer en temps réel entre le thème clair (ergonomie de jour) et le thème sombre haute lisibilité (mode nuit réduisant la fatigue visuelle).", bold_prefix="Mode Sombre (Dark Mode) : ")

    add_callout(doc, 
        "Interface de l'application après sélection de la langue Arabe (العربية) : mise en évidence de la barre latérale "
        "positionnée à droite, des textes alignés à droite et de l'inversion symétrique des tableaux de données.",
        title="Interface Complète en Mode Arabe avec Disposition RTL",
        callout_type="SCREENSHOT"
    )

    # =========================================================================
    # CHAPITRE 5 : GLOSSAIRE
    # =========================================================================
    add_h1(doc, "5. Glossaire des Termes Techniques & Financiers")
    add_p(doc, "Ce glossaire clarifie les concepts et acronymes clés employés dans l'application et la documentation :")

    t_gloss = doc.add_table(rows=10, cols=2)
    t_gloss.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers_gloss = ["Terme / Sigle", "Définition Opérationnelle dans l'Application Master Data IA"]
    widths_gloss = [Inches(1.8), Inches(5.0)]
    for i, h in enumerate(headers_gloss):
        add_header_cell(t_gloss.cell(0, i), h, widths_gloss[i])

    rows_gloss = [
        ("IBAN", "International Bank Account Number. Norme internationale (ISO 13616) identifiant de façon unique un compte bancaire dans plus de 80 pays."),
        ("Modulo 97", "Algorithme mathématique normalisé (ISO 7064) vérifiant l'intégrité numérique de la clé de contrôle des deux premiers chiffres d'un IBAN. Il permet de bloquer instantanément les erreurs de frappe ou les faux comptes."),
        ("RBAC", "Role-Based Access Control. Modèle de sécurité informatique attribuant les droits et habilitations en fonction du rôle organisationnel de l'utilisateur."),
        ("IDoc CREMAS05", "Intermediate Document standard de SAP S/4HANA dédié à la création et à la mise à jour des fiches maîtresses fournisseurs (segments EDI_DC40, E1LFA1M, E1LFB1M, E1LFBKM)."),
        ("OCR", "Optical Character Recognition (Reconnaissance Optique de Caractères). Technologie convertissant les justificatifs scannés (RIB, Kbis) en texte structuré exploitable."),
        ("SOX (Sarbanes-Oxley)", "Réglementation financière stricte imposant une piste d'audit inaltérable, horodatée et traçable pour chaque modification affectant les processus de paiement."),
        ("Score de Risque IA", "Indice composite probabiliste variant de 0 (risque nul) à 100 (risque critique) calculé par un modèle de gradient boosting supervisé sur les données de la demande."),
        ("SHAP", "SHapley Additive exPlanations. Cadre d'intelligence artificielle explicable quantifiant l'impact marginal (+ ou - points de risque) de chaque caractéristique du dossier."),
        ("ZBLOCK = B", "Indicateur technique officiel dans le segment SAP E1LFB1M déclenchant un blocage préventif des paiements au niveau de la société comptable en cas de réserve de sécurité.")
    ]
    for row_idx, data in enumerate(rows_gloss, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            add_body_cell(t_gloss.cell(row_idx, col_idx), val, is_even=is_even, width=widths_gloss[col_idx])

    add_p(doc, "", space_after=6)

    # =========================================================================
    # CHAPITRE 6 : MATRICE SYNTHÉTIQUE ACTEUR X FONCTIONNALITÉ
    # =========================================================================
    add_h1(doc, "6. Tableau Récapitulatif : Acteur x Fonctionnalité")
    add_p(doc, "Le tableau ci-dessous résume les droits d'exécution effectifs pour chacun des cinq profils de l'application :")

    t_mat = doc.add_table(rows=13, cols=6)
    t_mat.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers_mat = ["Fonctionnalité / Action", "Vendor", "Requester", "Agent", "Manager", "Admin"]
    widths_mat = [Inches(2.4), Inches(0.8), Inches(0.9), Inches(0.8), Inches(0.9), Inches(0.9)]
    for i, h in enumerate(headers_mat):
        add_header_cell(t_mat.cell(0, i), h, widths_mat[i], align=WD_ALIGN_PARAGRAPH.CENTER if i > 0 else WD_ALIGN_PARAGRAPH.LEFT)

    rows_mat = [
        ("Consultation de son propre dossier", "OUI", "OUI (zone)", "OUI (global)", "OUI (global)", "OUI (global)"),
        ("Création d'un nouveau dossier", "NON", "OUI", "NON", "NON", "NON"),
        ("Dépôt de pièces justificatives (RIB/Kbis)", "OUI", "NON", "NON", "NON", "NON"),
        ("Validation IBAN en direct (Modulo 97)", "NON", "OUI", "NON", "NON", "NON"),
        ("Rapprochement OCR vs Déclaré", "NON", "NON", "OUI", "OUI (lecture)", "NON"),
        ("Visualisation du Score SHAP & Doublons", "NON", "NON", "OUI", "OUI", "OUI (stats)"),
        ("Transmission du dossier au Manager", "NON", "NON", "OUI", "NON", "NON"),
        ("Approbation définitive du dossier", "NON", "NON", "NON", "OUI", "NON"),
        ("Rejet avec motif obligatoire (SOX)", "NON", "NON", "NON", "OUI", "NON"),
        ("Simulation du flux IDoc CREMAS05", "NON", "NON", "NON", "OUI", "NON"),
        ("Synchronisation vers SAP S/4HANA", "NON", "NON", "NON", "OUI", "NON"),
        ("Gestion des Utilisateurs & Audit SOX (CSV/PDF)", "NON", "NON", "NON", "NON", "OUI")
    ]
    for row_idx, data in enumerate(rows_mat, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            align = WD_ALIGN_PARAGRAPH.CENTER if col_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
            bold = (val == "OUI") or (val.startswith("OUI"))
            color = RGBColor(5, 150, 105) if "OUI" in val else RGBColor(148, 163, 184)
            add_body_cell(t_mat.cell(row_idx, col_idx), val, is_even=is_even, width=widths_mat[col_idx], align=align, bold=bold, color=color if col_idx > 0 else None)

    add_p(doc, "", space_after=6)

    # =========================================================================
    # CHAPITRE 7 : ÉCARTS CONSTATÉS (PFE vs RÉEL)
    # =========================================================================
    add_h1(doc, "7. Analyse des Écarts Constatés (Rapport de PFE vs Application Réelle)")
    add_p(doc, 
        "Conformément aux exigences de rigueur technique, cette section analyse les écarts objectifs entre les intentions "
        "décrites dans le rapport de projet de fin d'études (PFE) et l'implémentation opérationnelle vérifiable dans le code source de l'application.",
        bold_prefix="Transparence méthodologique : "
    )

    t_ecarts = doc.add_table(rows=6, cols=3)
    t_ecarts.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers_ecarts = ["Thématique", "Spécification Initiale dans le Rapport de PFE", "Implémentation Réelle dans la Plateforme Déployée"]
    widths_ecarts = [Inches(1.8), Inches(2.5), Inches(2.5)]
    for i, h in enumerate(headers_ecarts):
        add_header_cell(t_ecarts.cell(0, i), h, widths_ecarts[i])

    rows_ecarts = [
        ("Base de Données", "Préconisation initiale de PostgreSQL 16 avec types JSONB et PGLite local.", "Exploitation de MySQL 8.0 via XAMPP (port 3306), avec adaptateur transparent traduisant les requêtes et normalisant les colonnes JSON, complété par un fallback PGlite."),
        ("Interfaçage SAP", "Mention d'une connexion RFC/BAPI directe vers un système SAP physique d'entreprise.", "Simulation et génération du segment standard IDoc CREMAS05 S/4HANA (EDI_DC40, E1LFA1M, E1LFB1M avec ZBLOCK) et synchronisation logique avec confirmation d'IDoc."),
        ("Notifications Tiers", "Scénario théorique d'envoi automatique d'e-mails de notification (SMTP).", "Piste d'audit horodatée consignant chaque changement d'état et portail fournisseur temps réel avec stepper interactif, sans dépendance à un serveur de messagerie SMTP externe actif."),
        ("Matching Sémantique", "Évaluation en phase de recherche de modèles de Deep Learning type Sentence-BERT.", "Implémentation en production du couple TF-IDF n-grams + distance de Levenshtein (RapidFuzz), privilégiant une inférence sub-seconde (< 50ms) et une exécution CPU légère."),
        ("Gouvernance Admin", "Les fonctions de Super-Administration étaient initialement associées au Manager Approbateur.", "Séparation stricte d'un rôle ADMIN dédié disposant de sa propre console : CRUD utilisateurs, réinitialisation de mot de passe, matrice RBAC et export CSV/PDF de l'audit SOX.")
    ]
    for row_idx, data in enumerate(rows_ecarts, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            add_body_cell(t_ecarts.cell(row_idx, col_idx), val, is_even=is_even, width=widths_ecarts[col_idx])

    add_p(doc, "", space_after=6)
    print("Chapitres communs générés avec succès.")
