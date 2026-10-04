# -*- coding: utf-8 -*-
"""
doc_generator/section_actors.py
Génération des chapitres dédiés à chaque acteur métier
(Vendor, Requester Western/Nordic, Master Data Agent, Manager Approval, Admin)
"""

from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from .styles import (
    add_h1, add_h2, add_h3, add_p, add_bullet, add_callout,
    add_header_cell, add_body_cell
)

def build_section_actors(doc):
    # =========================================================================
    # CHAPITRE 8 : VENDOR (FOURNISSEUR EXTERNE)
    # =========================================================================
    add_h1(doc, "8. Guide Utilisateur — Profil Fournisseur Externe (VENDOR)")
    
    add_h2(doc, "8.1. Présentation & Objectifs")
    add_p(doc, 
        "Le Fournisseur Externe (Vendor) est un partenaire commercial de TUI Group (établissement hôtelier, réceptif touristique, "
        "transporteur local ou prestataire de services). Son objectif est de transmettre ses informations administratives, "
        "ses coordonnées bancaires officielles et de téléverser ses justificatifs légaux (RIB certifié, extrait Kbis ou équivalent Bolagsverket). "
        "Son périmètre de données est strictement restreint à son propre dossier d'enregistrement.",
        bold_prefix="Rôle et finalité : "
    )

    add_h2(doc, "8.2. Modalités de Connexion")
    add_bullet(doc, "contact@novatech-solutions.fr", bold_prefix="Identifiant de test (Compte Démo) : ")
    add_bullet(doc, "Password123!", bold_prefix="Mot de passe universel : ")
    add_bullet(doc, "/vendor (Portail Fournisseur interactif)", bold_prefix="Page d'atterrissage après connexion : ")

    add_h2(doc, "8.3. Navigation & Composants de l'Espace Fournisseur")
    add_p(doc, "L'interface du fournisseur comprend trois zones fonctionnelles principales :")
    add_bullet(doc, "Indicateur dynamique à 5 étapes visualisant la progression du dossier (Dossier initié ➔ Documents soumis ➔ Contrôle en cours ➔ Approuvé ➔ Synchronisé SAP).", bold_prefix="1. Frise Chronologique d'Avancement (Stepper) : ")
    add_bullet(doc, "Consultation en lecture seule des coordonnées bancaires (IBAN, BIC/SWIFT, Banque, Titulaire) et juridiques (Raison sociale, N° TVA, Pays du siège social).", bold_prefix="2. Fiches Récapitulatives Déclaratives : ")
    add_bullet(doc, "Composant interactif permettant de glisser-déposer ou sélectionner les fichiers de justificatifs bancaires et fiscaux.", bold_prefix="3. Zone de Téléversement Sécurisée (Drag & Drop) : ")

    add_callout(doc, 
        "Écran du portail fournisseur (http://localhost:3000/vendor) mettant en évidence la frise chronologique à 5 étapes, "
        "la zone de téléversement drag-and-drop de RIB/Kbis et les fiches récapitulatives des coordonnées déclarées.",
        title="Portail Fournisseur avec Stepper d'Avancement et Zone de Dépôt",
        callout_type="SCREENSHOT"
    )

    add_h2(doc, "8.4. Guide Opérationnel Pas à Pas")
    add_p(doc, "Suivez les étapes ci-dessous pour téléverser vos pièces justificatives :")
    add_bullet(doc, "Connectez-vous avec vos identifiants ou cliquez sur la pastille Fournisseur Externe sur la mire de connexion.", bold_prefix="Étape 1 : ")
    add_bullet(doc, "Vérifiez l'exactitude des coordonnées affichées dans la carte « Coordonnées Bancaires Déclarées » (IBAN et titulaire).", bold_prefix="Étape 2 : ")
    add_bullet(doc, "Faites glisser votre fichier de RIB ou d'extrait Kbis dans la zone centrale « Téléversement des Pièces Justificatives », ou cliquez sur la zone pour parcourir vos répertoires.", bold_prefix="Étape 3 : ")
    add_bullet(doc, "Le fichier sélectionné apparaît avec sa taille et son nom. Cliquez sur le bouton « Déposer les documents ».", bold_prefix="Étape 4 : ")
    add_bullet(doc, "Un message de confirmation Toast vert « Documents téléversés avec succès » s'affiche. La frise d'avancement passe immédiatement à l'étape 2 « Documents soumis ».", bold_prefix="Étape 5 : ")

    add_h2(doc, "8.5. Règles Métier & Contraintes")
    add_bullet(doc, "Formats acceptés : PDF, PNG, JPEG. Taille maximale autorisée : 10 Mo par document.", bold_prefix="Formats de fichiers : ")
    add_bullet(doc, "Dès lors que le dossier passe au statut UNDER_REVIEW (Contrôle en cours), le dépôt de nouvelles pièces est verrouillé pour préserver l'intégrité de l'instruction.", bold_prefix="Verrouillage d'instruction : ")

    add_h2(doc, "8.6. Droits & Interdictions (Matrice de Périmètre)")
    t_v_rbac = doc.add_table(rows=5, cols=2)
    t_v_rbac.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Actions Autorisées (Droits)", "Actions Interdites (Restrictions de Sécurité)"]):
        add_header_cell(t_v_rbac.cell(0, i), h, Inches(3.4))
    r_v_rbac = [
        ("Consulter l'état d'avancement en direct de son propre dossier", "Consulter ou rechercher les dossiers d'autres fournisseurs"),
        ("Téléverser ses justificatifs officiels de RIB et d'immatriculation", "Modifier les montants de dépenses annuelles ou le périmètre territorial"),
        ("Consulter les coordonnées déclarées pour vérification", "Accéder aux scores de risque IA ou aux rapports de fraude internes"),
        ("Recevoir la confirmation de synchronisation SAP", "Valider, approuver ou rejeter une demande d'onboarding")
    ]
    for row_idx, (ok, no) in enumerate(r_v_rbac, start=1):
        is_even = (row_idx % 2 == 0)
        add_body_cell(t_v_rbac.cell(row_idx, 0), ok, is_even=is_even, width=Inches(3.4), color=RGBColor(5, 150, 105))
        add_body_cell(t_v_rbac.cell(row_idx, 1), no, is_even=is_even, width=Inches(3.4), color=RGBColor(220, 38, 38))

    add_p(doc, "", space_after=4)

    add_h2(doc, "8.7. Cas d'Erreur Fréquents & Dépannage")
    t_v_err = doc.add_table(rows=4, cols=3)
    t_v_err.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Symptôme / Message Affiché", "Cause Sous-Jacente", "Solution Préconisée"]):
        add_header_cell(t_v_err.cell(0, i), h, Inches(2.3))
    r_v_err = [
        ("Erreur : Format de fichier non supporté", "Le fichier téléversé n'est pas un document PDF ou une image PNG/JPG (ex: document .docx ou .zip).", "Convertissez votre document en format standard PDF ou scannez-le en image haute définition."),
        ("Erreur : Taille du fichier supérieure à 10 Mo", "Le document numérisé présente une résolution excessive.", "Compressez le fichier PDF ou réduisez la résolution du scanner à 300 DPI."),
        ("Dépôt impossible : Dossier en cours de validation", "L'agent Master Data a déjà démarré l'audit du dossier.", "Contactez votre référent interne chez TUI Finance pour rouvrir le dépôt si nécessaire.")
    ]
    for row_idx, data in enumerate(r_v_err, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            add_body_cell(t_v_err.cell(row_idx, col_idx), val, is_even=is_even, width=Inches(2.3))

    add_p(doc, "", space_after=4)

    add_h2(doc, "8.8. Fiche de Test Utilisateur — Profil Fournisseur")
    t_v_test = doc.add_table(rows=5, cols=6)
    t_v_test.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers_test = ["N°", "Action Opérationnelle", "Données Saisies", "Résultat Attendu", "Résultat Obtenu", "Statut"]
    widths_test = [Inches(0.4), Inches(1.8), Inches(1.5), Inches(1.8), Inches(0.8), Inches(0.5)]
    for i, h in enumerate(headers_test):
        add_header_cell(t_v_test.cell(0, i), h, widths_test[i])
    r_v_test = [
        ("1", "Connexion à l'espace", "contact@novatech-solutions.fr / Password123!", "Accès au portail /vendor, Stepper affiché", "", "OK / KO"),
        ("2", "Vérification des cartes", "Consultation écran", "IBAN FR76...189 et Raison sociale Novatech affichés", "", "OK / KO"),
        ("3", "Dépôt de fichier conforme", "Fichier test_rib.pdf (500 Ko)", "Toast vert 'Documents téléversés avec succès'", "", "OK / KO"),
        ("4", "Tentative d'accès non autorisé", "Saisie de l'URL http://localhost:3000/admin", "Redirection automatique vers /vendor (accès refusé)", "", "OK / KO")
    ]
    for row_idx, data in enumerate(r_v_test, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            add_body_cell(t_v_test.cell(row_idx, col_idx), val, is_even=is_even, width=widths_test[col_idx])

    add_p(doc, "", space_after=6)

    # =========================================================================
    # CHAPITRE 9 : REQUESTER (DEMANDEUR MÉTIER WESTERN / NORDIC)
    # =========================================================================
    add_h1(doc, "9. Guide Utilisateur — Profil Demandeur Métier (REQUESTER)")
    
    add_h2(doc, "9.1. Présentation & Objectifs")
    add_p(doc, 
        "Le Demandeur Métier (Requester) est un collaborateur interne de TUI Group Finance (acheteur, chef de produit ou contrôleur de gestion). "
        "Il est chargé d'initier les demandes d'onboarding de nouveaux prestataires ou de demander l'actualisation de coordonnées bancaires. "
        "Son périmètre d'action est strictement cloisonné par filiale géographique : un demandeur WESTERN ne peut consulter ou créer que "
        "des dossiers relevant de sa région (France, Espagne), tandis qu'un demandeur NORDIC gère exclusivement la Scandinavie (Suède, Danemark).",
        bold_prefix="Rôle et finalité : "
    )

    add_h2(doc, "9.2. Modalités de Connexion")
    add_bullet(doc, "requester.western@group.com / Password123! (Périmètre : WESTERN)", bold_prefix="Compte Démo Western (France / Espagne) : ")
    add_bullet(doc, "requester.nordic@group.com / Password123! (Périmètre : NORDIC)", bold_prefix="Compte Démo Nordic (Scandinavie) : ")
    add_bullet(doc, "/requester (Portail de gestion des dossiers de la filiale)", bold_prefix="Page d'atterrissage après connexion : ")

    add_h2(doc, "9.3. Navigation & Composants")
    add_bullet(doc, "Indicateurs en temps réel : Dossiers Total, En attente, Approuvés et Alertes Risque.", bold_prefix="1. Cartes de Synthèse (KPIs) : ")
    add_bullet(doc, "Filtre par texte libre (recherche par nom ou numéro) et par statut de workflow.", bold_prefix="2. Barre de Recherche et Filtres : ")
    add_bullet(doc, "Déclencheur d'ouverture du formulaire d'enregistrement avec contrôle d'intégrité en direct.", bold_prefix="3. Bouton '+ Nouveau Dossier Fournisseur' : ")

    add_h2(doc, "9.4. Guide Opérationnel Pas à Pas — Création avec Validation IBAN Modulo 97 en Direct")
    add_bullet(doc, "Connectez-vous en tant que Demandeur Western (requester.western@group.com).", bold_prefix="Étape 1 : ")
    add_bullet(doc, "Cliquez sur le bouton bleu « + Nouveau Dossier Fournisseur » en haut à droite pour ouvrir la modale de saisie.", bold_prefix="Étape 2 : ")
    add_bullet(doc, "Renseignez la Raison sociale, le Pays d'immatriculation (FR), le Numéro TVA / Siren et la Dépense annuelle prévisionnelle.", bold_prefix="Étape 3 : ")
    add_bullet(doc, "Saisie de l'IBAN avec vérification mathématique en temps réel : tapez l'IBAN dans le champ dédié. Dès que la saisie progresse, le moteur calcule la clé Modulo 97 (ISO 13616) :", bold_prefix="Étape 4 — Contrôle IBAN : ")
    add_bullet(doc, "Si vous saisissez un IBAN valide (ex: FR7630006000011234567890189), un badge vert « IBAN Valide (Modulo 97 ISO 13616) » s'affiche immédiatement.", bold_prefix="   - Cas Conforme : ")
    add_bullet(doc, "Si vous modifiez un chiffre de la clé (ex: FR7630006000011234567890199), un badge rouge « Clé Modulo 97 invalide » bloque la validation.", bold_prefix="   - Cas Erreur Clé : ")
    add_bullet(doc, "Si vous saisissez un IBAN d'un pays différent du siège social déclaré (ex: IBAN suédois SE45... pour une société française), un badge orange « Attention : Discordance territoriale détectée » avertit d'un risque d'usurpation.", bold_prefix="   - Cas Discordance Pays : ")
    add_bullet(doc, "Pour faciliter vos démonstrations, utilisez les boutons de remplissage rapide : « Cas Conforme (FR) » ou « Cas Risque / Fraude ».", bold_prefix="Étape 5 — Remplissage Démo : ")
    add_bullet(doc, "Cliquez sur « Créer et Soumettre le Dossier ». Le dossier apparaît instantanément dans la table avec le statut SUBMITTED.", bold_prefix="Étape 6 : ")

    add_callout(doc, 
        "Modale de création d'un nouveau fournisseur affichant les champs de coordonnées bancaires et le badge vert "
        "dynamique confirmant la conformité Modulo 97 de l'IBAN saisi.",
        title="Formulaire de Création Fournisseur avec Validation IBAN en Temps Réel",
        callout_type="SCREENSHOT"
    )

    add_h2(doc, "9.5. Règles Métier & Contraintes")
    add_bullet(doc, "Un demandeur de la zone Western ne peut en aucun cas créer ou consulter un dossier rattaché à la zone Nordic.", bold_prefix="Cloisonnement strict : ")
    add_bullet(doc, "Le bouton de soumission est désactivé tant que l'IBAN présente une clé Modulo 97 invalide.", bold_prefix="Intégrité bancaire : ")

    add_h2(doc, "9.6. Droits & Interdictions")
    t_r_rbac = doc.add_table(rows=5, cols=2)
    t_r_rbac.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Actions Autorisées (Droits)", "Actions Interdites (Restrictions de Sécurité)"]):
        add_header_cell(t_r_rbac.cell(0, i), h, Inches(3.4))
    r_r_rbac = [
        ("Créer des demandes d'onboarding pour les tiers de sa filiale", "Consulter ou modifier les dossiers d'une autre région géographique"),
        ("Bénéficier du contrôle direct Modulo 97 en cours de frappe", "Approuver ou rejeter définitivement un dossier de fournisseur"),
        ("Suivre le statut de ses dossiers (SUBMITTED, UNDER_REVIEW, etc.)", "Gérer les utilisateurs ou modifier les paramètres de l'administration"),
        ("Effectuer des recherches et filtrages sur sa file de travail", "Transférer directement un dossier vers SAP sans validation Manager")
    ]
    for row_idx, (ok, no) in enumerate(r_r_rbac, start=1):
        is_even = (row_idx % 2 == 0)
        add_body_cell(t_r_rbac.cell(row_idx, 0), ok, is_even=is_even, width=Inches(3.4), color=RGBColor(5, 150, 105))
        add_body_cell(t_r_rbac.cell(row_idx, 1), no, is_even=is_even, width=Inches(3.4), color=RGBColor(220, 38, 38))

    add_p(doc, "", space_after=4)

    add_h2(doc, "9.7. Cas d'Erreur Fréquents & Dépannage")
    t_r_err = doc.add_table(rows=4, cols=3)
    t_r_err.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Symptôme / Message Affiché", "Cause Sous-Jacente", "Solution Préconisée"]):
        add_header_cell(t_r_err.cell(0, i), h, Inches(2.3))
    r_r_err = [
        ("Badge Rouge : Clé Modulo 97 invalide", "L'IBAN saisi comporte une faute de frappe ou des chiffres inversés.", "Vérifiez le document bancaire original et ressaisissez scrupuleusement les 27 caractères de l'IBAN."),
        ("Badge Orange : Discordance territoriale", "Le code pays de l'IBAN (ex: ES) ne concorde pas avec le pays du siège (ex: FR).", "Demandez une attestation fiscale justifiant d'un compte bancaire dans un pays tiers."),
        ("Accès refusé : Erreur 403 Périmètre territorial", "Tentative d'interrogation d'une ressource Nordic avec un compte Western.", "Revenez sur la liste des dossiers de votre zone géographique autorisée.")
    ]
    for row_idx, data in enumerate(r_r_err, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            add_body_cell(t_r_err.cell(row_idx, col_idx), val, is_even=is_even, width=Inches(2.3))

    add_p(doc, "", space_after=4)

    add_h2(doc, "9.8. Fiche de Test Utilisateur — Profil Demandeur")
    t_r_test = doc.add_table(rows=5, cols=6)
    t_r_test.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(headers_test):
        add_header_cell(t_r_test.cell(0, i), h, widths_test[i])
    r_r_test = [
        ("1", "Connexion Demandeur Western", "requester.western@group.com", "Redirection sur /requester avec scope Western", "", "OK / KO"),
        ("2", "Test IBAN erroné", "IBAN avec clé altérée", "Affichage instantané du badge rouge 'Clé Modulo 97 invalide'", "", "OK / KO"),
        ("3", "Test IBAN conforme", "Clic sur 'Cas Conforme (FR)'", "Badge vert 'IBAN Valide', bouton de soumission actif", "", "OK / KO"),
        ("4", "Création effective", "Validation du formulaire", "Nouveau dossier inséré avec succès dans la table locale", "", "OK / KO")
    ]
    for row_idx, data in enumerate(r_r_test, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            add_body_cell(t_r_test.cell(row_idx, col_idx), val, is_even=is_even, width=widths_test[col_idx])

    add_p(doc, "", space_after=6)

    # =========================================================================
    # CHAPITRE 10 : MASTER DATA AGENT (AGENT DE CONTRÔLE)
    # =========================================================================
    add_h1(doc, "10. Guide Utilisateur — Profil Agent de Contrôle Master Data (MASTER_DATA_AGENT)")
    
    add_h2(doc, "10.1. Présentation & Objectifs")
    add_p(doc, 
        "L'Agent de Contrôle Master Data (Master Data Agent) est l'expert opérationnel en charge de la fiabilité des référentiels tiers. "
        "Il examine les pièces justificatives, confronte les extractions OCR automatisées avec les données déclarées, évalue "
        "les alertes de fraude remontées par les 7 axes du moteur d'IA et prépare le dossier pour la prise de décision managériale. "
        "Son périmètre de surveillance est GLOBAL (toutes filiales confondues).",
        bold_prefix="Rôle et finalité : "
    )

    add_h2(doc, "10.2. Modalités de Connexion")
    add_bullet(doc, "agent.global@group.com", bold_prefix="Identifiant de test (Compte Démo) : ")
    add_bullet(doc, "Password123!", bold_prefix="Mot de passe universel : ")
    add_bullet(doc, "/agent (Tableau de bord de contrôle Master Data)", bold_prefix="Page d'atterrissage après connexion : ")

    add_h2(doc, "10.3. Navigation & Composants")
    add_bullet(doc, "Indicateurs d'activité : Dossiers en attente, Alertes Fraude actives, Score Moyen de Risque et Dossiers traités.", bold_prefix="1. Cartes de Pilotage Opérationnel : ")
    add_bullet(doc, "Tableau exhaustif répertoriant les demandes à traiter avec niveau de risque colorisé et bouton d'action 'Analyser le dossier'.", bold_prefix="2. File de Traitement Unifiée : ")
    add_bullet(doc, "Tableau scindé en 2 colonnes comparant champ par champ les données extraites par OCR du document avec les données saisies par le demandeur.", bold_prefix="3. Rapprochement Réciproque (OCR vs Déclaré) : ")
    add_bullet(doc, "Jauge colorisée graduée de 0 à 100 avec explicabilité des contributions marginales en points (+/-).", bold_prefix="4. Décomposition du Score de Risque SHAP : ")
    add_bullet(doc, "Analyse textuelle par distance de Levenshtein signalant les fournisseurs similaires déjà existants dans SAP.", bold_prefix="5. Détection de Doublons (RapidFuzz) : ")

    add_callout(doc, 
        "Écran d'instruction de l'agent (/agent) montrant la table comparative de rapprochement OCR vs Déclaré, "
        "la jauge de score de risque IA (0-100) et les facteurs explicatifs SHAP.",
        title="Tableau de Bord de l'Agent Master Data avec Rapprochement OCR et SHAP",
        callout_type="SCREENSHOT"
    )

    add_h2(doc, "10.4. Guide Opérationnel Pas à Pas")
    add_bullet(doc, "Connectez-vous en tant qu'Agent Master Data (agent.global@group.com).", bold_prefix="Étape 1 : ")
    add_bullet(doc, "Dans la file de traitement, sélectionnez un dossier présentant une alerte (ex: Dossier #1 Novatech Solutions ou #3 Apex Seychelles) et cliquez sur « Analyser le dossier ».", bold_prefix="Étape 2 : ")
    add_bullet(doc, "Examinez le tableau de rapprochement : vérifiez si l'IBAN extrait du RIB correspond exactement à l'IBAN déclaré. En cas d'incohérence, une ligne rouge met l'écart en évidence.", bold_prefix="Étape 3 — Rapprochement : ")
    add_bullet(doc, "Analysez le score de risque IA : consultez les facteurs SHAP pour comprendre la note (ex: +30 points pour domiciliation dans un paradis fiscal, +20 points pour montant supérieur à 500 k€).", bold_prefix="Étape 4 — Score SHAP : ")
    add_bullet(doc, "Vérifiez le score de similarité RapidFuzz : assurez-vous qu'il ne s'agit pas d'un doublon phonétique ou orthographique d'un fournisseur existant.", bold_prefix="Étape 5 — Doublons : ")
    add_bullet(doc, "Si le dossier est instruit et prêt pour arbitrage, cliquez sur le bouton bleu « Transmettre au Manager pour Approbation ».", bold_prefix="Étape 6 : ")

    add_h2(doc, "10.5. Règles Métier & Contraintes")
    add_bullet(doc, "L'agent ne peut pas approuver un dossier définitivement (règle de double regard SOX imposant la séparation des tâches).", bold_prefix="Séparation des rôles : ")
    add_bullet(doc, "Tout écart entre le titulaire du compte bancaire et la dénomination légale du Kbis doit être tracé avant transmission.", bold_prefix="Vigilance fraude : ")

    add_h2(doc, "10.6. Droits & Interdictions")
    t_a_rbac = doc.add_table(rows=5, cols=2)
    t_a_rbac.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Actions Autorisées (Droits)", "Actions Interdites (Restrictions de Sécurité)"]):
        add_header_cell(t_a_rbac.cell(0, i), h, Inches(3.4))
    r_a_rbac = [
        ("Inspecter l'ensemble des dossiers des zones Western et Nordic", "Valider définitivement ou rejeter un dossier sans passer par le Manager"),
        ("Consulter les extractions OCR et scores de risque détaillés SHAP", "Modifier manuellement les coordonnées bancaires sans justification formelle"),
        ("Transmettre les dossiers audités au Manager pour approbation", "Accéder aux fonctions d'administration technique (création d'utilisateurs)"),
        ("Détecter les risques de doublons via le moteur RapidFuzz", "Déclencher l'export direct vers SAP S/4HANA (réservé au Manager)")
    ]
    for row_idx, (ok, no) in enumerate(r_a_rbac, start=1):
        is_even = (row_idx % 2 == 0)
        add_body_cell(t_a_rbac.cell(row_idx, 0), ok, is_even=is_even, width=Inches(3.4), color=RGBColor(5, 150, 105))
        add_body_cell(t_a_rbac.cell(row_idx, 1), no, is_even=is_even, width=Inches(3.4), color=RGBColor(220, 38, 38))

    add_p(doc, "", space_after=4)

    add_h2(doc, "10.7. Cas d'Erreur Fréquents & Dépannage")
    t_a_err = doc.add_table(rows=4, cols=3)
    t_a_err.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Symptôme / Message Affiché", "Cause Sous-Jacente", "Solution Préconisée"]):
        add_header_cell(t_a_err.cell(0, i), h, Inches(2.3))
    r_a_err = [
        ("Indice de confiance OCR faible (< 70%)", "Document numérisé incliné, flou ou de résolution insuffisante.", "Ouvrez le document original manuellement et vérifiez la cohérence visuelle des mentions."),
        ("Alerte Doublon : Score de similarité > 85%", "Un fournisseur possédant un nom proche est déjà enregistré dans SAP.", "Consultez la fiche tiers existante pour déterminer s'il s'agit d'une filiale légitime ou d'un doublon."),
        ("Transmission bloquée", "Le dossier n'est pas au statut SUBMITTED.", "Vérifiez que le demandeur a finalisé la soumission complète de sa demande.")
    ]
    for row_idx, data in enumerate(r_a_err, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            add_body_cell(t_a_err.cell(row_idx, col_idx), val, is_even=is_even, width=Inches(2.3))

    add_p(doc, "", space_after=4)

    add_h2(doc, "10.8. Fiche de Test Utilisateur — Profil Agent Master Data")
    t_a_test = doc.add_table(rows=5, cols=6)
    t_a_test.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(headers_test):
        add_header_cell(t_a_test.cell(0, i), h, widths_test[i])
    r_a_test = [
        ("1", "Connexion Agent Global", "agent.global@group.com", "Accès à /agent, visibilité sur l'ensemble des 8 dossiers", "", "OK / KO"),
        ("2", "Instruction Dossier #1", "Clic sur 'Analyser le dossier'", "Affichage du tableau OCR vs Déclaré et alerte Modulo 97", "", "OK / KO"),
        ("3", "Vérification Facteurs SHAP", "Consultation Dossier #3", "Visualisation de l'impact Paradis Fiscal (+35 pts)", "", "OK / KO"),
        ("4", "Transmission au Manager", "Clic sur 'Transmettre au Manager'", "Notification de succès et passage au statut UNDER_REVIEW", "", "OK / KO")
    ]
    for row_idx, data in enumerate(r_a_test, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            add_body_cell(t_a_test.cell(row_idx, col_idx), val, is_even=is_even, width=widths_test[col_idx])

    add_p(doc, "", space_after=6)

    # =========================================================================
    # CHAPITRE 11 : MANAGER APPROVAL (MANAGER APPROBATEUR)
    # =========================================================================
    add_h1(doc, "11. Guide Utilisateur — Profil Manager Approbateur (MANAGER_APPROVAL)")
    
    add_h2(doc, "11.1. Présentation & Objectifs")
    add_p(doc, 
        "Le Manager Approbateur (Manager Approval) est le signataire financier de référence au sein de la gouvernance TUI Finance. "
        "Il dispose du pouvoir d'arbitrage final : il valide les dossiers conformes, rejette les dossiers suspects ou frauduleux "
        "avec une justification obligatoire et déclenche la synchronisation automatisée vers le progiciel SAP S/4HANA (flux IDoc). "
        "Son périmètre d'approbation est GLOBAL.",
        bold_prefix="Rôle et finalité : "
    )

    add_h2(doc, "11.2. Modalités de Connexion")
    add_bullet(doc, "manager.global@group.com", bold_prefix="Identifiant de test (Compte Démo) : ")
    add_bullet(doc, "Password123!", bold_prefix="Mot de passe universel : ")
    add_bullet(doc, "/manager (Tableau de bord de gouvernance et d'approbation)", bold_prefix="Page d'atterrissage après connexion : ")

    add_h2(doc, "11.3. Navigation & Composants")
    add_bullet(doc, "Indicateurs décisionnels : En attente d'approbation, Risques Critiques, Approuvés ce mois et Synchronisés SAP.", bold_prefix="1. Cartes de Gouvernance : ")
    add_bullet(doc, "Tableau récapitulant les dossiers transmis par les agents avec score de risque consolidé.", bold_prefix="2. File d'Arbitrage Financier : ")
    add_bullet(doc, "Boutons d'action unitaire : « Approuver », « Rejeter » et « Simuler IDoc SAP ».", bold_prefix="3. Console de Décision : ")

    add_h2(doc, "11.4. Guide Opérationnel Pas à Pas — Approbation, Rejet Obligatoire & Simulation IDoc")
    add_bullet(doc, "Connectez-vous en tant que Manager Approbateur (manager.global@group.com).", bold_prefix="Étape 1 : ")
    add_bullet(doc, "Consultez la file d'attente des dossiers nécessitant votre arbitrage.", bold_prefix="Étape 2 : ")
    add_bullet(doc, "Pour un dossier conforme (ex: Dossier #2 Nordic Clean AB) : cliquez sur le bouton vert « Approuver ». Le statut passe immédiatement à APPROVED et la piste d'audit enregistre l'approbation managériale.", bold_prefix="Étape 3 — Approbation : ")
    add_bullet(doc, "Pour un dossier suspect ou frauduleux (ex: Dossier #3 Apex Seychelles) :", bold_prefix="Étape 4 — Rejet avec Motif Obligatoire : ")
    add_bullet(doc, "Cliquez sur le bouton rouge « Rejeter ». Une modale officielle « Confirmation du Rejet de Dossier » s'ouvre.", bold_prefix="   - Ouverture de la modale : ")
    add_bullet(doc, "Un avertissement réglementaire rappelle : « Le motif de rejet est obligatoire pour satisfaire aux exigences de traçabilité de la piste d'audit SOX ».", bold_prefix="   - Exigence de conformité : ")
    add_bullet(doc, "Tentez de cliquer sur « Confirmer le Rejet Définitif » sans rien écrire : le système bloque la validation avec une alerte rouge « Veuillez saisir un motif de rejet valide » (bloqué également sur l'API avec HTTP 400).", bold_prefix="   - Blocage sans motif : ")
    add_bullet(doc, "Saisissez un motif circonstancié (ex: « Domiciliation bancaire dans un paradis fiscal sans substance économique avérée ») puis validez. Le statut passe à REJECTED et le motif est gravé dans l'audit trail.", bold_prefix="   - Validation motivée : ")
    add_bullet(doc, "Simulation du flux SAP : sur un dossier validé ou à risque, cliquez sur le bouton « Simuler IDoc SAP ». Une fenêtre modale affiche le segment technique CREMAS05. Constatez l'activation automatique du blocage préventif des paiements (ZBLOCK = B) en cas de risque élevé.", bold_prefix="Étape 5 — Simulation IDoc : ")
    add_bullet(doc, "Synchronisation ERP : cliquez sur « Synchroniser vers SAP ». Le système génère le numéro IDoc officiel et bascule le dossier au statut définitif SYNCED_SAP.", bold_prefix="Étape 6 — Synchronisation SAP : ")

    add_callout(doc, 
        "Modale de rejet de dossier imposant la saisie obligatoire d'un motif de justification circonstancié conformément aux règles SOX.",
        title="Modale de Rejet de Dossier avec Motif Obligatoire SOX",
        callout_type="SCREENSHOT"
    )

    add_callout(doc, 
        "Modale de simulation du flux IDoc CREMAS05 affichant les segments EDI_DC40, E1LFA1M et le flag préventif ZBLOCK = B dans E1LFB1M.",
        title="Visualisation du Segment IDoc CREMAS05 S/4HANA avec Blocage Préventif",
        callout_type="SCREENSHOT"
    )

    add_h2(doc, "11.5. Règles Métier & Contraintes")
    add_bullet(doc, "Aucun rejet ne peut être validé sans motif (contrainte stricte bloquante en UI et HTTP 400 backend).", bold_prefix="Motif obligatoire SOX : ")
    add_bullet(doc, "Tout dossier présentant un score de risque > 60 se voit automatiquement attribuer l'indicateur ZBLOCK = B lors de sa création dans SAP pour suspendre les paiements jusqu'à levée de doute.", bold_prefix="Blocage préventif ZBLOCK : ")

    add_h2(doc, "11.6. Droits & Interdictions")
    t_m_rbac = doc.add_table(rows=5, cols=2)
    t_m_rbac.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Actions Autorisées (Droits)", "Actions Interdites (Restrictions de Sécurité)"]):
        add_header_cell(t_m_rbac.cell(0, i), h, Inches(3.4))
    r_m_rbac = [
        ("Approuver définitivement un dossier d'onboarding fournisseur", "Rejeter un dossier sans renseigner le motif officiel obligatoire"),
        ("Rejeter un dossier suspect avec justification légale archivée", "Modifier directement les numéros de RIB sans nouvelle instruction"),
        ("Simuler et inspecter la structure du flux IDoc CREMAS05", "Supprimer des comptes utilisateurs ou altérer les journaux d'audit"),
        ("Déclencher la synchronisation officielle vers SAP S/4HANA", "Outrepasser la séparation des tâches en créant ses propres dossiers")
    ]
    for row_idx, (ok, no) in enumerate(r_m_rbac, start=1):
        is_even = (row_idx % 2 == 0)
        add_body_cell(t_m_rbac.cell(row_idx, 0), ok, is_even=is_even, width=Inches(3.4), color=RGBColor(5, 150, 105))
        add_body_cell(t_m_rbac.cell(row_idx, 1), no, is_even=is_even, width=Inches(3.4), color=RGBColor(220, 38, 38))

    add_p(doc, "", space_after=4)

    add_h2(doc, "11.7. Cas d'Erreur Fréquents & Dépannage")
    t_m_err = doc.add_table(rows=4, cols=3)
    t_m_err.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Symptôme / Message Affiché", "Cause Sous-Jacente", "Solution Préconisée"]):
        add_header_cell(t_m_err.cell(0, i), h, Inches(2.3))
    r_m_err = [
        ("Erreur 400 : Le motif de rejet est obligatoire", "Validation tentée avec le champ de justification vide ou constitué d'espaces.", "Renseignez une explication claire et motivée justifiant la décision de rejet."),
        ("Échec de synchronisation SAP", "Le dossier n'a pas encore fait l'objet d'une approbation formelle.", "Cliquez d'abord sur 'Approuver' avant de déclencher l'envoi du flux IDoc."),
        ("Dossier verrouillé", "L'instruction est en cours de révision par l'agent Master Data.", "Patientez jusqu'à la transmission finale du dossier par l'agent.")
    ]
    for row_idx, data in enumerate(r_m_err, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            add_body_cell(t_m_err.cell(row_idx, col_idx), val, is_even=is_even, width=Inches(2.3))

    add_p(doc, "", space_after=4)

    add_h2(doc, "11.8. Fiche de Test Utilisateur — Profil Manager Approbateur")
    t_m_test = doc.add_table(rows=5, cols=6)
    t_m_test.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(headers_test):
        add_header_cell(t_m_test.cell(0, i), h, widths_test[i])
    r_m_test = [
        ("1", "Connexion Manager Global", "manager.global@group.com", "Accès à /manager avec boutons d'approbation et rejet", "", "OK / KO"),
        ("2", "Test rejet sans motif", "Clic sur Rejeter + champ vide", "Blocage immédiat par alerte rouge, requête 400 bloquée", "", "OK / KO"),
        ("3", "Rejet motivé conforme", "Motif 'Soupçon de fraude FOVI'", "Statut mis à jour vers REJECTED, motif consigné en audit", "", "OK / KO"),
        ("4", "Simulation IDoc S/4HANA", "Clic sur 'Simuler IDoc SAP'", "Affichage du XML CREMAS05 avec ZBLOCK = B si risque élevé", "", "OK / KO")
    ]
    for row_idx, data in enumerate(r_m_test, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            add_body_cell(t_m_test.cell(row_idx, col_idx), val, is_even=is_even, width=widths_test[col_idx])

    add_p(doc, "", space_after=6)

    # =========================================================================
    # CHAPITRE 12 : ADMIN (ADMINISTRATEUR SYSTÈME)
    # =========================================================================
    add_h1(doc, "12. Guide Utilisateur — Profil Administrateur Système (ADMIN)")
    
    add_h2(doc, "12.1. Présentation & Objectifs")
    add_p(doc, 
        "L'Administrateur Système (Admin) garantit la sécurité technique, la gestion des identités et l'intégrité "
        "de la gouvernance applicative. Il assure le cycle de vie des comptes utilisateurs, surveille la matrice des habilitations RBAC, "
        "analyse les indicateurs de sécurité consolidés et certifie la conformité de la piste d'audit SOX en exportant les rapports officiels "
        "aux formats CSV et PDF. Son autorité couvre l'ensemble de la plateforme.",
        bold_prefix="Rôle et finalité : "
    )

    add_h2(doc, "12.2. Modalités de Connexion")
    add_bullet(doc, "admin@group.com", bold_prefix="Identifiant de test (Compte Démo) : ")
    add_bullet(doc, "Password123!", bold_prefix="Mot de passe universel : ")
    add_bullet(doc, "/admin (Module d'administration et de gouvernance)", bold_prefix="Page d'atterrissage après connexion : ")

    add_h2(doc, "12.3. Navigation & Console d'Administration à 4 Onglets")
    add_p(doc, "La console d'administration se structure en quatre volets thématiques exclusifs :")
    add_bullet(doc, "Tableau exhaustif des comptes avec nom, email, rôle, scope géographique, statut et boutons d'action rapide.", bold_prefix="Onglet 1 — Gestion des Utilisateurs : ")
    add_bullet(doc, "Tableau de référence croisant les 6 rôles avec 12 actions sensibles de l'application.", bold_prefix="Onglet 2 — Matrice des Habilitations (RBAC) : ")
    add_bullet(doc, "Journal inaltérable des événements horodatés avec filtres dynamiques et boutons d'export CSV et PDF certifié.", bold_prefix="Onglet 3 — Piste d'Audit SOX : ")
    add_bullet(doc, "Tableau de bord décisionnel avec indicateurs globaux, répartition des risques et graphiques Recharts.", bold_prefix="Onglet 4 — Statistiques & Pilotage : ")

    add_callout(doc, 
        "Console d'administration (/admin) affichant l'onglet de la Piste d'Audit SOX avec les filtres par acteur et par date, "
        "ainsi que les boutons d'export 'Exporter CSV' et 'Exporter PDF'.",
        title="Module d'Administration avec Onglet Piste d'Audit SOX et Exports",
        callout_type="SCREENSHOT"
    )

    add_h2(doc, "12.4. Guide Opérationnel Pas à Pas")
    add_bullet(doc, "Connectez-vous en tant qu'Administrateur (admin@group.com).", bold_prefix="Étape 1 : ")
    add_bullet(doc, "Onglet Utilisateurs : pour créer un collaborateur, cliquez sur « Ajouter un utilisateur », renseignez son nom, email, rôle métier (VENDOR, REQUESTER, MASTER_DATA_AGENT, MANAGER_APPROVAL, ADMIN) et périmètre territorial (WESTERN, NORDIC, GLOBAL), puis confirmez.", bold_prefix="Étape 2 — Création Utilisateur : ")
    add_bullet(doc, "Suspension de compte : cliquez sur le bouton bascule « Activer / Désactiver » en face d'un compte. Le statut passe instantanément à Inactif et toute tentative de connexion ultérieure est bloquée.", bold_prefix="Étape 3 — Désactivation : ")
    add_bullet(doc, "Réinitialisation de mot de passe : cliquez sur « Réinitialiser » pour réattribuer le mot de passe initial sécurisé au collaborateur.", bold_prefix="Étape 4 — Mot de Passe : ")
    add_bullet(doc, "Audit de la matrice RBAC : basculez sur l'onglet 2 pour vérifier visuellement que chaque rôle ne possède que ses permissions autorisées.", bold_prefix="Étape 5 — Matrice RBAC : ")
    add_bullet(doc, "Filtrage de la piste d'audit : basculez sur l'onglet 3. Utilisez les listes déroulantes pour filtrer les événements par type d'action (ex: AUTH_LOGIN_SUCCESS, MANAGER_APPROVAL_DECISION) ou par utilisateur.", bold_prefix="Étape 6 — Audit Trail : ")
    add_bullet(doc, "Export des logs : cliquez sur « Exporter CSV » pour générer le fichier tabulaire brut ou sur « Exporter PDF » pour produire instantanément un rapport officiel paginé et certifié via jsPDF-AutoTable.", bold_prefix="Étape 7 — Exports SOX : ")

    add_h2(doc, "12.5. Règles Métier & Contraintes")
    add_bullet(doc, "La piste d'audit est strictement immuable : aucune fonction d'édition ou de suppression physique n'est exposée sur la base de données.", bold_prefix="Immuabilité SOX : ")
    add_bullet(doc, "La suppression d'un utilisateur est une suppression logique (soft delete is_active = 0) afin de préserver l'historique de traçabilité des opérations passées.", bold_prefix="Suppression logique : ")

    add_h2(doc, "12.6. Droits & Interdictions")
    t_ad_rbac = doc.add_table(rows=5, cols=2)
    t_ad_rbac.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Actions Autorisées (Droits)", "Actions Interdites (Restrictions de Sécurité)"]):
        add_header_cell(t_ad_rbac.cell(0, i), h, Inches(3.4))
    r_ad_rbac = [
        ("Créer, modifier, désactiver et réinitialiser les comptes utilisateurs", "Supprimer physiquement les lignes de la piste d'audit (inviolabilité)"),
        ("Consulter et exporter les journaux d'audit SOX en formats CSV et PDF", "Créer des dossiers d'onboarding ou simuler des RIB pour son propre compte"),
        ("Auditer la matrice complète des droits et habilitations RBAC", "Modifier manuellement les scores de risque calculés par l'IA"),
        ("Piloter les statistiques globales de conformité et volumétrie", "Approuver ou rejeter des dossiers sans statut de Manager habilité")
    ]
    for row_idx, (ok, no) in enumerate(r_ad_rbac, start=1):
        is_even = (row_idx % 2 == 0)
        add_body_cell(t_ad_rbac.cell(row_idx, 0), ok, is_even=is_even, width=Inches(3.4), color=RGBColor(5, 150, 105))
        add_body_cell(t_ad_rbac.cell(row_idx, 1), no, is_even=is_even, width=Inches(3.4), color=RGBColor(220, 38, 38))

    add_p(doc, "", space_after=4)

    add_h2(doc, "12.7. Cas d'Erreur Fréquents & Dépannage")
    t_ad_err = doc.add_table(rows=4, cols=3)
    t_ad_err.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Symptôme / Message Affiché", "Cause Sous-Jacente", "Solution Préconisée"]):
        add_header_cell(t_ad_err.cell(0, i), h, Inches(2.3))
    r_ad_err = [
        ("Erreur : Cette adresse email est déjà utilisée", "Tentative d'enregistrement d'un utilisateur avec une adresse déjà présente en base.", "Saisissez une adresse email unique ou modifiez le compte existant."),
        ("Échec export PDF : Aucun événement trouvé", "Les filtres de date ou d'action sélectionnés ne retournent aucune ligne.", "Réinitialisez les filtres de recherche pour englober une période plus large."),
        ("Compte verrouillé après 5 échecs", "L'utilisateur a saisi 5 mots de passe erronés consécutifs.", "Dans l'onglet Utilisateurs, cliquez sur 'Réinitialiser' ou patientez 15 minutes pour déverrouillage automatique.")
    ]
    for row_idx, data in enumerate(r_ad_err, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            add_body_cell(t_ad_err.cell(row_idx, col_idx), val, is_even=is_even, width=Inches(2.3))

    add_p(doc, "", space_after=4)

    add_h2(doc, "12.8. Fiche de Test Utilisateur — Profil Administrateur")
    t_ad_test = doc.add_table(rows=5, cols=6)
    t_ad_test.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(headers_test):
        add_header_cell(t_ad_test.cell(0, i), h, widths_test[i])
    r_ad_test = [
        ("1", "Connexion Administrateur", "admin@group.com", "Accès à la console /admin à 4 onglets opérationnels", "", "OK / KO"),
        ("2", "Désactivation d'un compte", "Clic sur 'Désactiver' en face d'un compte", "Le compte passe au statut Inactif, connexion ultérieure bloquée", "", "OK / KO"),
        ("3", "Consultation Matrice RBAC", "Bascule sur l'onglet 2", "Grille 6 rôles x 12 actions affichée sans erreur", "", "OK / KO"),
        ("4", "Export Piste d'Audit PDF", "Clic sur 'Exporter PDF'", "Téléchargement immédiat du fichier audit-trail-sox.pdf paginé", "", "OK / KO")
    ]
    for row_idx, data in enumerate(r_ad_test, start=1):
        is_even = (row_idx % 2 == 0)
        for col_idx, val in enumerate(data):
            add_body_cell(t_ad_test.cell(row_idx, col_idx), val, is_even=is_even, width=widths_test[col_idx])

    add_p(doc, "", space_after=6)
    print("Chapitres dédiés aux acteurs générés avec succès.")
