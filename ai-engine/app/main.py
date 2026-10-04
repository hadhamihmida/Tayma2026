"""
FastAPI Microservice - TUI Group Finance Master Data AI Engine
Exposes the 7 Data Science axes with full OpenAPI/Swagger documentation,
evaluation metrics, and composite screening pipelines.
"""
import datetime
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from .schemas.payload_schemas import (
    OCRExtractionRequest, OCRExtractionResponse,
    FraudCheckRequest, FraudCheckResponse,
    DeduplicationRequest, DeduplicationResponse,
    RiskScoringRequest, RiskScoringResponse,
    SegmentationRequest, SegmentationResponse,
    ForecastRequest, ForecastResponse,
    RAGQueryRequest, RAGQueryResponse,
    ModelMetricsSummary
)

from .models import (
    extract_document_fields, get_axe1_metrics,
    fraud_engine, get_axe2_metrics,
    dedup_engine, get_axe3_metrics,
    risk_engine, get_axe4_metrics,
    segmentation_engine, get_axe5_metrics,
    forecaster, get_axe6_metrics,
    rag_agent, get_axe7_metrics
)

app = FastAPI(
    title="TUI Group Finance — Master Data AI Engine",
    description="""
    Microservice Data Science & Machine Learning dédié à la sécurisation et à la gouvernance
    des données fournisseurs (Master Data Management) de TUI Group Finance.
    
    ### Les 7 Axes Implémentés :
    1. **Extraction Multimodale (OCR/NLP)** : Extraction structurée avec validation Modulo 97 et scores de confiance.
    2. **Détection d'Anomalies / Fraude** : Modèle Isolation Forest sur incohérences bancaires et comportementales.
    3. **Matching Sémantique & Déduplication** : Embeddings + TF-IDF n-grams + RapidFuzz sur le référentiel tiers.
    4. **Scoring de Risque Prédictif** : Modèle Gradient Boosting calibré [0-100] avec explicabilité type SHAP.
    5. **Segmentation Fournisseurs** : Clustering K-Means et règles financières d'habilitation.
    6. **Analyse Temporelle & Prévisions** : Décomposition additive et anticipation des volumes/SLA.
    7. **Assistant Conversationnel RAG** : Index vectoriel sur les politiques de conformité TUI et génération justifiée.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": "tui-masterdata-ai-engine",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "axes_loaded": 7
    }

# -----------------------------------------------------------------------------
# Axe 1: Multimodal OCR / NLP Extraction
# -----------------------------------------------------------------------------
@app.post(
    "/api/v1/ocr/extract",
    response_model=OCRExtractionResponse,
    summary="Axe 1 - Extraction multimodale OCR / NLP",
    tags=["1. OCR & NLP"]
)
def extract_ocr(payload: OCRExtractionRequest):
    """Extrait l'IBAN, le BIC, le nom légal, la TVA et la banque depuis un document source."""
    return extract_document_fields(payload)

# -----------------------------------------------------------------------------
# Axe 2: Anomaly & Fraud Detection (Isolation Forest)
# -----------------------------------------------------------------------------
@app.post(
    "/api/v1/fraud/check",
    response_model=FraudCheckResponse,
    summary="Axe 2 - Détection d'anomalies et fraudes bancaires",
    tags=["2. Fraud Detection"]
)
def check_fraud(payload: FraudCheckRequest):
    """Détecte les incohérences structurelles, falsifications de RIB et comportements suspects."""
    return fraud_engine.check_fraud(payload)

# -----------------------------------------------------------------------------
# Axe 3: Semantic Matching & Deduplication
# -----------------------------------------------------------------------------
@app.post(
    "/api/v1/matching/deduplicate",
    response_model=DeduplicationResponse,
    summary="Axe 3 - Matching sémantique & détection de doublons",
    tags=["3. Deduplication"]
)
def match_duplicates(payload: DeduplicationRequest):
    """Recherche de tiers similaires dans la base existante avec embeddings et distance floue."""
    return dedup_engine.find_duplicates(payload)

# -----------------------------------------------------------------------------
# Axe 4: Predictive Risk Scoring (Gradient Boosting + SHAP)
# -----------------------------------------------------------------------------
@app.post(
    "/api/v1/risk/score",
    response_model=RiskScoringResponse,
    summary="Axe 4 - Scoring de risque prédictif & explicabilité",
    tags=["4. Risk Scoring"]
)
def score_risk(payload: RiskScoringRequest):
    """Calcule le score de risque global (0-100) et décompose les facteurs d'impact locaux."""
    return risk_engine.calculate_risk(payload)

# -----------------------------------------------------------------------------
# Axe 5: Segmentation & Clustering (K-Means)
# -----------------------------------------------------------------------------
@app.post(
    "/api/v1/segmentation/classify",
    response_model=SegmentationResponse,
    summary="Axe 5 - Segmentation & classification fournisseurs",
    tags=["5. Segmentation"]
)
def classify_segment(payload: SegmentationRequest):
    """Segmente le fournisseur (Stratégique, Opérationnel, Occasionnel, À risque)."""
    return segmentation_engine.classify_vendor(payload)

# -----------------------------------------------------------------------------
# Axe 6: Time-Series Analytics & Forecasting
# -----------------------------------------------------------------------------
@app.get(
    "/api/v1/analytics/forecast",
    response_model=ForecastResponse,
    summary="Axe 6 - Prévisions temporelles de volumétrie et SLA",
    tags=["6. Time-Series"]
)
def get_forecast(horizon_days: int = 30, scope: str = "ALL"):
    """Extrapole les volumes de demandes et les délais moyens de traitement futurs."""
    req = ForecastRequest(horizon_days=horizon_days, scope=scope)
    return forecaster.forecast_requests(req)

# -----------------------------------------------------------------------------
# Axe 7: Conversational Interface (GenAI & RAG)
# -----------------------------------------------------------------------------
@app.post(
    "/api/v1/rag/query",
    response_model=RAGQueryResponse,
    summary="Axe 7 - Assistant conversationnel RAG sur les règles TUI Finance",
    tags=["7. Conversational RAG"]
)
def query_rag(payload: RAGQueryRequest):
    """Répond en langage naturel avec citations formelles des politiques de gouvernance."""
    return rag_agent.answer_query(payload)

# -----------------------------------------------------------------------------
# Composite Screening Pipeline (All-in-one for Backend Orchestration)
# -----------------------------------------------------------------------------
@app.post(
    "/api/v1/pipeline/screen-request",
    summary="Pipeline Complet - Évaluation IA intégrée d'un dossier fournisseur",
    tags=["Composite Pipeline"]
)
def screen_vendor_request(payload: Dict[str, Any]):
    """
    Exécute les 5 analyses clés en parallèle/séquentiel :
    Extraction OCR + Détection Fraude + Déduplication + Scoring Risque + Segmentation.
    """
    vendor_name = payload.get("vendor_name", "Fournisseur Inconnu")
    vendor_country = payload.get("vendor_country", "FR").upper()
    iban = payload.get("iban", "FR7630006000011234567890189")
    bic = payload.get("bic_swift", "BNPAFRPP")
    email = payload.get("contact_email", "contact@fournisseur.com")
    spend = float(payload.get("annual_spend", 45000.0))
    tax_id = payload.get("tax_id_vat", "FR89345210987")
    req_type = payload.get("request_type", "ONBOARDING")
    
    # 1. OCR Extraction (if doc text or defaults)
    ocr_res = extract_document_fields(OCRExtractionRequest(
        document_text=payload.get("document_text"),
        document_type=payload.get("document_type", "RIB"),
        filename=payload.get("filename", "justificatif.pdf")
    ))

    # 2. Fraud Check
    fraud_res = fraud_engine.check_fraud(FraudCheckRequest(
        vendor_name=vendor_name,
        vendor_country=vendor_country,
        iban=iban,
        bic_swift=bic,
        contact_email=email,
        request_type=req_type,
        annual_spend_estimate=spend,
        has_tax_certificate=payload.get("has_tax_certificate", True),
        has_kbis=payload.get("has_kbis", True)
    ))

    # 3. Deduplication
    dedup_res = dedup_engine.find_duplicates(DeduplicationRequest(
        vendor_name=vendor_name,
        tax_id_vat=tax_id,
        country=vendor_country,
        threshold=65.0
    ))

    # 4. Risk Scoring
    clean_iban = iban.replace(" ", "").upper()
    bank_country = clean_iban[:2] if len(clean_iban) >= 2 else vendor_country
    risk_res = risk_engine.calculate_risk(RiskScoringRequest(
        vendor_name=vendor_name,
        vendor_country=vendor_country,
        bank_country=bank_country,
        request_type=req_type,
        vendor_age_years=float(payload.get("vendor_age_years", 0.0)),
        is_tax_haven=False,
        has_complete_docs=payload.get("has_kbis", True) and payload.get("has_tax_certificate", True),
        annual_volume_eur=spend,
        is_bank_change=(req_type == "BANK_CHANGE"),
        anomaly_score=fraud_res.anomaly_score,
        email_is_free_provider=any(dom in email.lower() for dom in ["gmail", "yahoo", "hotmail", "outlook"])
    ))

    # 5. Segmentation
    seg_res = segmentation_engine.classify_vendor(SegmentationRequest(
        annual_spend=spend,
        transaction_frequency_monthly=int(payload.get("frequency_monthly", 8)),
        criticality_score=int(payload.get("criticality_score", 3)),
        payment_terms_days=int(payload.get("payment_terms_days", 30)),
        geographic_scope=payload.get("geographic_scope", "WESTERN")
    ))

    return {
        "vendor_name": vendor_name,
        "screened_at": datetime.datetime.utcnow().isoformat(),
        "ocr_result": ocr_res.model_dump(),
        "fraud_check": fraud_res.model_dump(),
        "deduplication": dedup_res.model_dump(),
        "risk_scoring": risk_res.model_dump(),
        "segmentation": seg_res.model_dump(),
        "requires_manager_approval": (risk_res.risk_score >= 45 or fraud_res.is_anomaly or seg_res.segment_code in ["STRATEGIC", "HIGH_RISK"])
    }

# -----------------------------------------------------------------------------
# Model Evaluation Metrics
# -----------------------------------------------------------------------------
@app.get(
    "/api/v1/metrics",
    response_model=ModelMetricsSummary,
    summary="Métriques d'évaluation formelles des 7 modèles IA",
    tags=["Metrics & Explainability"]
)
def get_all_metrics():
    """Fournit les métriques calculées sur les données d'évaluation synthétiques pour chaque axe."""
    return ModelMetricsSummary(
        timestamp=datetime.datetime.utcnow().isoformat(),
        axes={
            "axe1_ocr_nlp": get_axe1_metrics(),
            "axe2_fraud_detection": get_axe2_metrics(),
            "axe3_semantic_deduplication": get_axe3_metrics(),
            "axe4_risk_scoring": get_axe4_metrics(),
            "axe5_segmentation": get_axe5_metrics(),
            "axe6_forecasting": get_axe6_metrics(),
            "axe7_rag_agent": get_axe7_metrics()
        }
    )
