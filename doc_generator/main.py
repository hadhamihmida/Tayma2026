# -*- coding: utf-8 -*-
"""
doc_generator/main.py
Script principal d'assemblage et de génération de la documentation utilisateur
Master Data IA au format Microsoft Word (.docx)
"""

import os
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

from .styles import set_cell_background, set_cell_margins, set_cell_borders
from .section_common import build_section_common
from .section_actors import build_section_actors
from .section_unverified import build_section_unverified

def create_full_documentation():
    print("==================================================================")
    print("📝 GÉNÉRATION DE LA DOCUMENTATION UTILISATEUR COMPLÈTE (.DOCX)...")
    print("==================================================================")

    doc = docx.Document()

    # 1. Configuration des Marges de la Page
    section = doc.sections[0]
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)
    section.different_first_page_header_footer = True

    # 2. En-tête et Pied de Page pour les pages suivantes
    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    hrun = hp.add_run("Plateforme « Master Data IA » — Documentation Utilisateur Officielle | TUI Group Finance")
    hrun.font.name = "Calibri"
    hrun.font.size = Pt(8.5)
    hrun.font.color.rgb = RGBColor(148, 163, 184) # Slate 400

    footer = section.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    frun = fp.add_run("Confidentiel — TUI Group Finance | Traçabilité & Conformité SOX | Version 2.0.0")
    frun.font.name = "Calibri"
    frun.font.size = Pt(8.5)
    frun.font.color.rgb = RGBColor(148, 163, 184)

    # =========================================================================
    # PAGE DE GARDE PROFESSIONNELLE
    # =========================================================================
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(40)

    # Bandeau Titre
    p_pre = doc.add_paragraph()
    p_pre.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_pre = p_pre.add_run("TUI GROUP FINANCE — DÉPARTEMENT MASTER DATA & CONFORMITÉ")
    r_pre.font.name = "Calibri"
    r_pre.font.size = Pt(11)
    r_pre.font.bold = True
    r_pre.font.color.rgb = RGBColor(37, 99, 235) # Blue 600

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(10)
    r_title = p_title.add_run("DOCUMENTATION UTILISATEUR COMPLÈTE\n& GUIDE OPÉRATIONNEL DES ACTEURS")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(24)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42) # Slate 900

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(40)
    r_sub = p_sub.add_run(
        "Plateforme « Master Data IA » — Contrôle Anti-Fraude, Validation Modulo 97, "
        "Gouvernance Décisionnelle et Intégration S/4HANA (IDoc CREMAS05)"
    )
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(13)
    r_sub.font.color.rgb = RGBColor(71, 85, 105) # Slate 600

    # Cartouche de métadonnées
    t_meta = doc.add_table(rows=6, cols=2)
    t_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Organisation & Direction", "TUI Group — Direction Financière & Référentiels Tiers"),
        ("Application Référente", "Master Data IA (v2.0.0 — Production & Soutenance)"),
        ("Rédacteur & Rôle", "Architecte Logiciel Senior & Rédacteur Technique"),
        ("Date d'Édition", "Octobre 2026"),
        ("Statut d'Homologation", "Validé — Conforme Piste d'Audit SOX & Normes SEPA"),
        ("Classification", "Document Confidentiel Interne / Projet de Fin d'Études")
    ]
    for row_idx, (lbl, val) in enumerate(meta_data):
        c0 = t_meta.cell(row_idx, 0)
        c1 = t_meta.cell(row_idx, 1)
        c0.width = Inches(2.2)
        c1.width = Inches(4.2)
        set_cell_background(c0, "1E293B")
        set_cell_background(c1, "F8FAFC")
        set_cell_margins(c0, 100, 100, 160, 160)
        set_cell_margins(c1, 100, 100, 160, 160)
        set_cell_borders(c0, "CBD5E1", "CBD5E1", "CBD5E1", "CBD5E1")
        set_cell_borders(c1, "CBD5E1", "CBD5E1", "CBD5E1", "CBD5E1")
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(2)
        p0.paragraph_format.space_after = Pt(2)
        r0 = p0.add_run(lbl)
        r0.font.name = "Calibri"
        r0.font.size = Pt(9.5)
        r0.font.bold = True
        r0.font.color.rgb = RGBColor(255, 255, 255)

        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(2)
        p1.paragraph_format.space_after = Pt(2)
        r1 = p1.add_run(val)
        r1.font.name = "Calibri"
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_page_break()

    # =========================================================================
    # TABLE DES MATIÈRES DÉTAILLÉE
    # =========================================================================
    p_toc_t = doc.add_paragraph()
    p_toc_t.paragraph_format.space_before = Pt(12)
    p_toc_t.paragraph_format.space_after = Pt(16)
    r_toc_t = p_toc_t.add_run("Table des Matières")
    r_toc_t.font.name = "Calibri"
    r_toc_t.font.size = Pt(18)
    r_toc_t.font.bold = True
    r_toc_t.font.color.rgb = RGBColor(15, 23, 42)

    toc_items = [
        ("1. Vue d'Ensemble & Architecture Globale", "1.1 Architecture Multi-Tiers | 1.2 Workflow Opérationnel | 1.3 Statuts du Dossier"),
        ("2. Guide d'Installation & Procédure de Démarrage", "2.1 Prérequis | 2.2 Ordre Séquentiel des Services (Ports 3000, 5000, 8000, 3306)"),
        ("3. Authentification, Sessions & Sécurité Applicative", "3.1 Bcrypt & JWT | 3.2 Verrouillage Anti-Force Brute | 3.3 Contrôle d'Accès RBAC"),
        ("4. Internationalisation (FR / EN / AR), Support RTL & Thème Visuel", "4.1 Sélecteur de Langue & RTL | 4.2 Formats Intl & Mode Sombre"),
        ("5. Glossaire des Termes Techniques & Financiers", "Définitions : IBAN, Modulo 97, RBAC, IDoc, OCR, SOX, SHAP, ZBLOCK"),
        ("6. Tableau Récapitulatif : Acteur x Fonctionnalité", "Matrice croisée des 5 profils métiers avec les 12 actions sensibles"),
        ("7. Analyse des Écarts Constatés (Rapport de PFE vs Application Réelle)", "Bilan comparatif : SGBD, Interface SAP, Notifications, NLP & Administration"),
        ("8. Guide Utilisateur — Profil Fournisseur Externe (VENDOR)", "8.1 Présentation | 8.2 Connexion | 8.3 Navigation | 8.4 Guide Pas à Pas | 8.5 Règles | 8.6 Droits/Interdits | 8.7 Erreurs | 8.8 Fiche Test"),
        ("9. Guide Utilisateur — Profil Demandeur Métier (REQUESTER)", "9.1 Présentation | 9.2 Connexion | 9.3 Navigation | 9.4 Saisie avec IBAN Modulo 97 Direct | 9.5 Règles | 9.6 Droits/Interdits | 9.7 Erreurs | 9.8 Fiche Test"),
        ("10. Guide Utilisateur — Profil Agent de Contrôle Master Data (AGENT)", "10.1 Présentation | 10.2 Connexion | 10.3 Navigation | 10.4 Rapprochement OCR & SHAP | 10.5 Règles | 10.6 Droits/Interdits | 10.7 Erreurs | 10.8 Fiche Test"),
        ("11. Guide Utilisateur — Profil Manager Approbateur (MANAGER)", "11.1 Présentation | 11.2 Connexion | 11.3 Navigation | 11.4 Rejet Motivé Obligatoire & IDoc SAP | 11.5 Règles | 11.6 Droits/Interdits | 11.7 Erreurs | 11.8 Fiche Test"),
        ("12. Guide Utilisateur — Profil Administrateur Système (ADMIN)", "12.1 Présentation | 12.2 Connexion | 12.3 Navigation | 12.4 CRUD Users, Matrice RBAC & Exports Audit SOX (CSV/PDF) | 12.5 Règles | 12.6 Droits/Interdits | 12.7 Erreurs | 12.8 Fiche Test"),
        ("13. Points Non Vérifiables dans le Code & Limites Techniques", "Synthèse objective des dépendances réseau externes (Passerelle SAP, Relais SMTP, etc.)")
    ]

    t_toc = doc.add_table(rows=len(toc_items), cols=2)
    t_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (ch, desc) in enumerate(toc_items):
        cell_ch = t_toc.cell(idx, 0)
        cell_de = t_toc.cell(idx, 1)
        cell_ch.width = Inches(3.2)
        cell_de.width = Inches(3.6)
        is_even = (idx % 2 == 0)
        bg = "F8FAFC" if is_even else "FFFFFF"
        set_cell_background(cell_ch, bg)
        set_cell_background(cell_de, bg)
        set_cell_margins(cell_ch, 60, 60, 100, 100)
        set_cell_margins(cell_de, 60, 60, 100, 100)
        set_cell_borders(cell_ch, "E2E8F0", "E2E8F0", "E2E8F0", "E2E8F0")
        set_cell_borders(cell_de, "E2E8F0", "E2E8F0", "E2E8F0", "E2E8F0")

        pch = cell_ch.paragraphs[0]
        pch.paragraph_format.space_before = Pt(1)
        pch.paragraph_format.space_after = Pt(1)
        rch = pch.add_run(ch)
        rch.font.name = "Calibri"
        rch.font.size = Pt(9.5)
        rch.font.bold = True
        rch.font.color.rgb = RGBColor(30, 64, 175)

        pde = cell_de.paragraphs[0]
        pde.paragraph_format.space_before = Pt(1)
        pde.paragraph_format.space_after = Pt(1)
        rde = pde.add_run(desc)
        rde.font.name = "Calibri"
        rde.font.size = Pt(8.5)
        rde.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_page_break()

    # =========================================================================
    # ASSEMBLAGE DES SECTIONS DE CONTENU
    # =========================================================================
    build_section_common(doc)
    build_section_actors(doc)
    build_section_unverified(doc)

    # 3. Sauvegarde du fichier .docx
    output_path = r"c:\Users\user\Downloads\taymaa\Documentation_Utilisateur_Master_Data_IA.docx"
    doc.save(output_path)
    print(f"✅ Fichier sauvegardé avec succès : {output_path}")

    # Copie de confort directement dans Downloads
    copy_path = r"c:\Users\user\Downloads\Documentation_Utilisateur_Master_Data_IA.docx"
    shutil.copyfile(output_path, copy_path)
    print(f"✅ Copie de confort enregistrée : {copy_path}")

if __name__ == "__main__":
    create_full_documentation()
