"""
Unit and Integration Tests for the 7 Data Science Axes of TUI Master Data AI Engine.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["axes_loaded"] == 7

def test_axe1_ocr_extraction():
    payload = {
        "document_text": """
        RELEVE D'IDENTITE BANCAIRE
        Titulaire: TUI Blue Hotels & Resorts SAS
        Domiciliation: BNP PARIBAS PARIS
        IBAN: FR76 3000 6000 0112 3456 7890 189
        BIC: BNPAFRPP
        N° TVA: FR89345210987
        """,
        "document_type": "RIB",
        "filename": "rib_test.pdf"
    }
    response = client.post("/api/v1/ocr/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    fields = data["extracted_fields"]
    assert "iban" in fields
    assert fields["iban"]["value"] == "FR7630006000011234567890189"
    assert fields["iban"]["validation_status"] == "VALID"
    assert fields["bic_swift"]["value"] == "BNPAFRPP"
    assert fields["tax_id_vat"]["value"] == "FR89345210987"
    assert data["global_confidence"] >= 0.90

def test_axe2_fraud_detection_clean():
    clean_payload = {
        "vendor_name": "TUI France SAS",
        "vendor_country": "FR",
        "iban": "FR7630006000011234567890189",
        "bic_swift": "BNPAFRPP",
        "contact_email": "finance@tui.fr",
        "request_type": "ONBOARDING",
        "days_since_last_change": 400,
        "annual_spend_estimate": 100000.0,
        "has_tax_certificate": True,
        "has_kbis": True
    }
    response = client.post("/api/v1/fraud/check", json=clean_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_anomaly"] is False
    assert data["severity"] in ["LOW", "MEDIUM"]
    assert data["anomaly_score"] < 40.0

def test_axe2_fraud_detection_anomaly():
    # Suspicious request: Spanish vendor with Swedish IBAN, disposable email, recent modification
    suspect_payload = {
        "vendor_name": "Iberian Transfers SL",
        "vendor_country": "ES",
        "iban": "SE4550000000058398257466", # Mismatch ES vs SE
        "bic_swift": "SWEDSESS",
        "contact_email": "iberian-accounting@temp-mail.org", # Disposable email
        "request_type": "BANK_CHANGE",
        "days_since_last_change": 14, # Short delay
        "annual_spend_estimate": 850000.0,
        "has_tax_certificate": False,
        "has_kbis": False
    }
    response = client.post("/api/v1/fraud/check", json=suspect_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_anomaly"] is True
    assert data["severity"] in ["HIGH", "CRITICAL"]
    assert len(data["triggers"]) >= 2

def test_axe3_semantic_deduplication():
    # Query with spelling variations of an existing hotel name
    payload = {
        "vendor_name": "T.U.I. Blue Hotel & Resort S.A.S.",
        "tax_id_vat": "FR89345210987",
        "country": "FR",
        "threshold": 60.0
    }
    response = client.post("/api/v1/matching/deduplicate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["duplicates_found"] is True
    assert len(data["top_matches"]) > 0
    top = data["top_matches"][0]
    assert top["similarity_score"] >= 70.0

def test_axe4_predictive_risk_scoring():
    payload = {
        "vendor_name": "Canary Travel SL",
        "vendor_country": "ES",
        "bank_country": "PA", # Tax haven / suspect mismatch
        "request_type": "BANK_CHANGE",
        "vendor_age_years": 0.2,
        "is_tax_haven": True,
        "has_complete_docs": False,
        "annual_volume_eur": 500000.0,
        "is_bank_change": True,
        "anomaly_score": 65.0,
        "email_is_free_provider": True
    }
    response = client.post("/api/v1/risk/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] >= 65
    assert data["risk_tier"] in ["ELEVATED", "CRITICAL"]
    assert len(data["top_factors"]) >= 3
    # Check that explainable factors include category and signed impact
    first_factor = data["top_factors"][0]
    assert "factor_name" in first_factor
    assert "impact" in first_factor

def test_axe5_segmentation():
    # High volume strategic supplier
    payload = {
        "annual_spend": 1200000.0,
        "transaction_frequency_monthly": 45,
        "criticality_score": 5,
        "payment_terms_days": 30,
        "geographic_scope": "WESTERN"
    }
    response = client.post("/api/v1/segmentation/classify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["segment_code"] == "STRATEGIC"
    assert "Directeur" in data["required_validation_level"]

def test_axe6_time_series_forecasting():
    response = client.get("/api/v1/analytics/forecast?horizon_days=30&scope=WESTERN")
    assert response.status_code == 200
    data = response.json()
    assert data["horizon_days"] == 30
    assert len(data["forecast_points"]) == 30
    first_pt = data["forecast_points"][0]
    assert first_pt["predicted_requests"] > 0
    assert first_pt["lower_bound"] <= first_pt["upper_bound"]

def test_axe7_rag_query():
    payload = {
        "query": "Quelles sont les règles de validation pour la zone Nordic ?"
    }
    response = client.post("/api/v1/rag/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "NORDIC" in data["answer"].upper() or "BOLAGSVERKET" in data["answer"].upper()
    assert len(data["citations"]) > 0
    assert data["confidence_score"] >= 0.80

def test_composite_screening_pipeline():
    payload = {
        "vendor_name": "TUI Blue Hotels & Resorts SAS",
        "vendor_country": "FR",
        "iban": "FR7630006000011234567890189",
        "bic_swift": "BNPAFRPP",
        "contact_email": "finance@tui-hotels.com",
        "annual_spend": 250000.0,
        "tax_id_vat": "FR89345210987",
        "request_type": "ONBOARDING",
        "has_kbis": True,
        "has_tax_certificate": True
    }
    response = client.post("/api/v1/pipeline/screen-request", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "ocr_result" in data
    assert "fraud_check" in data
    assert "deduplication" in data
    assert "risk_scoring" in data
    assert "segmentation" in data
    assert "requires_manager_approval" in data

def test_model_metrics_summary():
    response = client.get("/api/v1/metrics")
    assert response.status_code == 200
    data = response.json()
    axes = data["axes"]
    assert "axe1_ocr_nlp" in axes
    assert "axe2_fraud_detection" in axes
    assert "axe3_semantic_deduplication" in axes
    assert "axe4_risk_scoring" in axes
    assert "axe5_segmentation" in axes
    assert "axe6_forecasting" in axes
    assert "axe7_rag_agent" in axes
