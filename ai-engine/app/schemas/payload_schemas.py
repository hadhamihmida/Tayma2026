"""
Pydantic Schemas for AI Engine - 7 Axes of TUI Master Data IA
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# Axe 1: Multimodal OCR / NLP Extraction
# -----------------------------------------------------------------------------
class OCRExtractionRequest(BaseModel):
    document_text: Optional[str] = Field(None, description="Raw text or simulated OCR text from uploaded document")
    document_type: str = Field("RIB", description="Document type: RIB, KBIS_REGISTRATION, TAX_CERTIFICATE, PASSPORT_ID")
    filename: Optional[str] = Field("rib_fournisseur.pdf", description="Filename of the uploaded document")


class FieldConfidence(BaseModel):
    value: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    validation_status: str = Field("VALID", description="VALID, SUSPECT, INVALID, NOT_FOUND")
    details: Optional[str] = None


class OCRExtractionResponse(BaseModel):
    document_type: str
    filename: str
    extracted_fields: Dict[str, FieldConfidence]
    global_confidence: float
    raw_snippet: Optional[str] = None
    anchors_detected: List[str] = []


# -----------------------------------------------------------------------------
# Axe 2: Anomaly & Fraud Detection (Isolation Forest)
# -----------------------------------------------------------------------------
class FraudCheckRequest(BaseModel):
    vendor_name: str
    vendor_country: str = Field(..., min_length=2, max_length=2, json_schema_extra={"example": "FR"})
    iban: str = Field(..., json_schema_extra={"example": "FR7630006000011234567890189"})
    bic_swift: str = Field(..., json_schema_extra={"example": "BNPAFRPP"})
    contact_email: str = Field(..., json_schema_extra={"example": "finance@hotel-mediterranean.com"})
    request_type: str = Field("BANK_CHANGE", description="ONBOARDING, BANK_CHANGE, ADDRESS_CHANGE")
    days_since_last_change: Optional[int] = Field(365, description="Days since last bank detail update")
    annual_spend_estimate: Optional[float] = Field(50000.0, description="Estimated annual spend in EUR")
    has_tax_certificate: bool = True
    has_kbis: bool = True


class FraudCheckResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float = Field(..., description="Normalized score 0 (safe) to 100 (critical anomaly)")
    severity: str = Field(..., description="LOW, MEDIUM, HIGH, CRITICAL")
    risk_level: str
    triggers: List[Dict[str, Any]] = []
    explanation: str


# -----------------------------------------------------------------------------
# Axe 3: Semantic Matching & Deduplication
# -----------------------------------------------------------------------------
class DeduplicationRequest(BaseModel):
    vendor_name: str
    tax_id_vat: Optional[str] = None
    country: Optional[str] = "FR"
    address: Optional[str] = None
    threshold: float = Field(70.0, ge=0.0, le=100.0, description="Minimum similarity percentage to flag")


class MatchedVendor(BaseModel):
    vendor_id: str
    legal_name: str
    tax_id_vat: Optional[str] = None
    country: str
    similarity_score: float = Field(..., ge=0.0, le=100.0)
    match_type: str = Field(..., description="EXACT_TAX_ID, SEMANTIC_HIGH, FUZZY_NAME, PHONETIC")
    shared_attributes: List[str] = []


class DeduplicationResponse(BaseModel):
    query_name: str
    duplicates_found: bool
    top_matches: List[MatchedVendor]
    recommendation: str


# -----------------------------------------------------------------------------
# Axe 4: Predictive Risk Scoring (Gradient Boosting + SHAP)
# -----------------------------------------------------------------------------
class RiskScoringRequest(BaseModel):
    vendor_name: str
    vendor_country: str
    bank_country: str
    request_type: str = "ONBOARDING"
    vendor_age_years: float = 0.0
    is_tax_haven: bool = False
    has_complete_docs: bool = True
    annual_volume_eur: float = 120000.0
    is_bank_change: bool = False
    anomaly_score: float = 10.0
    email_is_free_provider: bool = False


class RiskFactor(BaseModel):
    factor_name: str
    impact: float = Field(..., description="Positive increases risk, negative decreases risk")
    category: str = Field(..., description="BANKING, COMPLIANCE, BEHAVIORAL, VENDOR_PROFILE")
    description: str


class RiskScoringResponse(BaseModel):
    risk_score: int = Field(..., ge=0, le=100, description="Composite score: 0 (Very safe) to 100 (Extremely risky)")
    risk_tier: str = Field(..., description="LOW, MODERATE, ELEVATED, CRITICAL")
    probability_of_default_or_fraud: float
    top_factors: List[RiskFactor]
    governance_decision: str


# -----------------------------------------------------------------------------
# Axe 5: Segmentation & Clustering (K-Means)
# -----------------------------------------------------------------------------
class SegmentationRequest(BaseModel):
    annual_spend: float
    transaction_frequency_monthly: int
    criticality_score: int = Field(..., ge=1, le=5)
    payment_terms_days: int = 30
    geographic_scope: str = "WESTERN"


class SegmentationResponse(BaseModel):
    cluster_id: int
    segment_code: str = Field(..., description="STRATEGIC, OPERATIONAL, OCCASIONAL, HIGH_RISK")
    segment_name: str
    characteristics: str
    required_validation_level: str
    sap_payment_block_recommended: bool


# -----------------------------------------------------------------------------
# Axe 6: Time-Series Analytics & Forecasting
# -----------------------------------------------------------------------------
class ForecastRequest(BaseModel):
    horizon_days: int = Field(30, ge=7, le=90)
    scope: Optional[str] = Field("ALL", description="ALL, WESTERN, NORDIC, TGBST")


class ForecastPoint(BaseModel):
    date: str
    predicted_requests: float
    lower_bound: float
    upper_bound: float
    predicted_lead_time_days: float


class ForecastResponse(BaseModel):
    horizon_days: int
    scope: str
    historical_summary: Dict[str, Any]
    forecast_points: List[ForecastPoint]
    peak_period_alert: Optional[str] = None
    expected_sla_compliance_rate: float


# -----------------------------------------------------------------------------
# Axe 7: Conversational Interface (GenAI / RAG)
# -----------------------------------------------------------------------------
class RAGQueryRequest(BaseModel):
    query: str = Field(..., json_schema_extra={"example": "Quelles sont les règles de validation d'un RIB pour la zone Nordic ?"})
    context_vendor_id: Optional[str] = None
    context_request_id: Optional[str] = None


class RAGCitation(BaseModel):
    source: str
    article: Optional[str] = None
    snippet: str
    relevance_score: float


class RAGQueryResponse(BaseModel):
    query: str
    answer: str
    citations: List[RAGCitation]
    confidence_score: float
    suggested_actions: List[str] = []


# -----------------------------------------------------------------------------
# Overall AI Engine Metrics Schema
# -----------------------------------------------------------------------------
class ModelMetricsSummary(BaseModel):
    timestamp: str
    axes: Dict[str, Dict[str, Any]]
