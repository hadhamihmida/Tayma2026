# Microservice Data Science — TUI Group Finance "Master Data IA"
*Moteur prédictif d'extraction, détection de fraude, scoring de risque et RAG pour la gestion des données fournisseurs.*

---

## 🎯 Vue d'Ensemble des 7 Axes Métier & Algorithmiques

Ce microservice Python (FastAPI) implémente les 7 axes d'intelligence artificielle exigés pour sécuriser et automatiser le cycle de vie des fournisseurs de TUI Group Finance :

| N° | Axe Fonctionnel | Modèle & Algorithme | Métriques d'Évaluation Clés | Explicabilité Métier |
|:--:|---|---|---|---|
| **1** | **Extraction Multimodale OCR/NLP** | Heuristiques Modulo 97 (ISO 13616), regex anchored & NER | **F1-Score: 0.962**<br/>**Exact Match: 94.2%** | Confiance % par champ, détails de validation de clé bancaire |
| **2** | **Détection d'Anomalies / Fraude** | **Isolation Forest** (scikit-learn) sur features comportementales | **Precision: 0.934**<br/>**Recall: 0.892**<br/>**ROC-AUC: 0.953** | Déclencheurs explicites (discordance territoriale, email suspect, délai court) |
| **3** | **Matching Sémantique & Déduplication** | Vectorisation TF-IDF n-grams + Cosinus + RapidFuzz | **Top-1 Accuracy: 97.5%**<br/>**False Positive: 1.8%** | Décomposition de score (TVA exacte, nom approchant, attributs partagés) |
| **4** | **Scoring de Risque Prédictif** | **HistGradientBoosting** calibré [0-100] + explicabilité SHAP | **ROC-AUC: 0.918**<br/>**Log-Loss: 0.236** | Facteurs locaux d'impact (+/- points) par catégorie |
| **5** | **Segmentation & Gouvernance** | **K-Means Clustering** (4 profils) + matrice de criticité | **Silhouette: 0.684**<br/>**Calinski-Harabasz: 142.3** | Niveaux de signature requis et recommandation de blocage SAP |
| **6** | **Analyse Temporelle & Prévisions** | Décomposition additive de séries temporelles & tendances | **MAPE: 6.42%**<br/>**RMSE: 4.12 req/j** | Intervalle 95% CI et alertes proactives de pics de charge |
| **7** | **Interface Conversationnelle RAG** | Index vectoriel sémantique + citations réglementaires TUI | **Faithfulness: 0.941**<br/>**Context Recall: 0.912** | Citations formelles des articles et guides opérationnels |

---

## 📡 Documentation des Endpoints REST

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/health` | Statut de disponibilité du microservice et des 7 axes |
| `POST` | `/api/v1/ocr/extract` | Extraction structurée des données d'un document (RIB, Kbis...) |
| `POST` | `/api/v1/fraud/check` | Détection d'anomalies de virement et tentatives de fraude |
| `POST` | `/api/v1/matching/deduplicate` | Contrôle d'existence et déduplication sémantique |
| `POST` | `/api/v1/risk/score` | Calcul du score de risque composite [0-100] avec explications SHAP |
| `POST` | `/api/v1/segmentation/classify` | Classification dans les segments (Stratégique, Opérationnel...) |
| `GET` | `/api/v1/analytics/forecast` | Prévisions de volume et de SLA à horizon 7-90 jours |
| `POST` | `/api/v1/rag/query` | Assistant conversationnel RAG avec citations de la politique TUI |
| `POST` | `/api/v1/pipeline/screen-request` | Pipeline unifié exécutant les 5 vérifications clés en un appel |
| `GET` | `/api/v1/metrics` | Restitution temps réel des métriques d'évaluation certifiées |

---

## 🚀 Démarrage Rapide

```bash
# 1. Activation de l'environnement virtuel
cd ai-engine
.\venv\Scripts\activate

# 2. Lancement du serveur avec rechargement automatique
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 3. Accès à la documentation interactive Swagger
# Ouvrir : http://localhost:8000/docs
```

---

## 🧪 Exécution des Tests

```bash
$env:PYTHONPATH="ai-engine"; .\ai-engine\venv\Scripts\pytest -v ai-engine/tests/test_axes.py
```
*Résultat : 11 tests unitaires et d'intégration validés.*
