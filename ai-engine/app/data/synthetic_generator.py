"""
Synthetic Data Generator for TUI Master Data IA
Generates realistic enterprise vendors, documents, bank details (IBANs/BICs),
fraud patterns, and historical workflows.
"""
import random
import datetime
from typing import List, Dict, Any

# Seed for reproducible synthetic metrics
RANDOM_SEED = 42
random.seed(RANDOM_SEED)

COUNTRIES = ["FR", "DE", "ES", "SE", "GB", "IT", "NL", "GR"]

TAX_HAVENS_OR_SUSPECT_COUNTRIES = ["PA", "VG", "KY", "BZ", "SC"]

BANK_CODES = {
    "FR": [("BNPAFRPP", "BNP Paribas"), ("SOGEFRPP", "Société Générale"), ("CRCAFRPP", "Crédit Agricole"), ("BCEPFRPP", "BPCE")],
    "DE": [("DEUTDEDD", "Deutsche Bank"), ("COMMDEDD", "Commerzbank"), ("DRESDEFF", "Dresdner Bank")],
    "ES": [("BSCHESMM", "Banco Santander"), ("BBVAESMM", "BBVA"), ("CAIXESBB", "CaixaBank")],
    "SE": [("SWEDSESS", "Swedbank"), ("HANDSESS", "Handelsbanken"), ("SEBSSESS", "SEB Bank")],
    "GB": [("BARCGB22", "Barclays"), ("HSBCGB2L", "HSBC UK"), ("LOYDGB21", "Lloyds Bank")],
    "IT": [("UNCRITM1", "UniCredit"), ("BCITITMM", "Intesa Sanpaolo")],
    "NL": [("INGBNL2A", "ING Bank"), ("ABNANL2A", "ABN AMRO")],
    "GR": [("ETHNGRAA", "National Bank of Greece"), ("PIRAGRAA", "Piraeus Bank")]
}

COMPANY_PREFIXES = [
    "TUI Blue", "RIU Hotels &", "Robinson Club", "Algarve Coastal", "Nordic Fjord",
    "Iberian Transfers", "Riviera Aviation", "Aegean Sailing", "Mallorca Charter",
    "Atlas Transport", "Alpine Snow", "Sunwing Travel", "Helios Hospitality",
    "AeroGround Services", "EuroCatering Event", "Mediterranean Cruise",
    "Scandinavian Tours", "Balkan Shuttle", "Canary Island Excursions", "Bavaria Lodge"
]

COMPANY_SUFFIXES = {
    "FR": ["SAS", "SARL", "SA"],
    "DE": ["GmbH", "AG", "GmbH & Co. KG"],
    "ES": ["SL", "SA", "S.L.U."],
    "SE": ["AB", "Aktiebolag"],
    "GB": ["Ltd", "Plc", "Limited"],
    "IT": ["S.r.l.", "S.p.A."],
    "NL": ["B.V.", "N.V."],
    "GR": ["A.E.", "E.P.E."]
}

def generate_valid_iban(country_code: str) -> str:
    """Generate syntactically valid IBAN structure with valid Modulo 97 checksum."""
    bban_length = {"FR": 23, "DE": 18, "ES": 20, "SE": 20, "GB": 18, "IT": 23, "NL": 14, "GR": 23}.get(country_code, 20)
    # Generate numeric BBAN
    numeric_bban = "".join(str(random.randint(0, 9)) for _ in range(bban_length))
    # Standard check digit calculation
    # Country to digits: A=10, B=11 ...
    c1 = str(ord(country_code[0]) - 55)
    c2 = str(ord(country_code[1]) - 55)
    temp_num = int(numeric_bban + c1 + c2 + "00")
    check_digits = 98 - (temp_num % 97)
    check_str = f"{check_digits:02d}"
    return f"{country_code}{check_str}{numeric_bban}"

def generate_reference_vendors(count: int = 60) -> List[Dict[str, Any]]:
    """Generate a master catalog of existing validated vendors in TUI ERP/SAP."""
    vendors = []
    for i in range(1, count + 1):
        country = random.choice(COUNTRIES)
        prefix = random.choice(COMPANY_PREFIXES)
        suffix = random.choice(COMPANY_SUFFIXES[country])
        legal_name = f"{prefix} {suffix}"
        trade_name = prefix
        
        # VAT format
        tax_id = f"{country}{random.randint(100000000, 999999999)}"
        bic, bank_name = random.choice(BANK_CODES[country])
        iban = generate_valid_iban(country)
        
        # Determine geographic scope
        if country in ["FR", "ES", "IT"]:
            scope = "WESTERN"
        elif country in ["SE", "NL"]:
            scope = "NORDIC"
        else:
            scope = "TGBST"
            
        segment = random.choices(["STRATEGIC", "OPERATIONAL", "OCCASIONAL"], weights=[0.25, 0.55, 0.20])[0]
        annual_spend = random.randint(15000, 3500000)
        risk_score = random.randint(5, 35)
        
        vendors.append({
            "vendor_id": f"VND-{1000 + i}",
            "sap_vendor_id": f"1000{i:04d}",
            "legal_name": legal_name,
            "trade_name": trade_name,
            "tax_id_vat": tax_id,
            "country": country,
            "address": f"{random.randint(1, 150)} Boulevard Corporate, Capital City, {country}",
            "iban": iban,
            "bic_swift": bic,
            "bank_name": bank_name,
            "status": "ACTIVE",
            "risk_score": risk_score,
            "segment": segment,
            "annual_spend": annual_spend,
            "geographic_scope": scope,
            "is_active": True
        })
    return vendors

def generate_fraud_training_dataset(n_samples: int = 1200) -> Dict[str, Any]:
    """
    Generates synthetic feature matrix and labels for training & evaluating
    Axe 2 (Isolation Forest) and Axe 4 (Risk Scoring Gradient Boosting).
    Features:
    0: country_mismatch (0 or 1: bank country != vendor country)
    1: disposable_email (0 or 1)
    2: days_since_last_change (0 to 1000)
    3: annual_spend_log (log spend)
    4: missing_documents_count (0 to 3)
    5: iban_checksum_valid (1 or 0)
    6: is_bank_change_request (0 or 1)
    7: vendor_age_years (0 to 15)
    8: tax_haven_flag (0 or 1)
    """
    import numpy as np
    
    features = []
    fraud_labels = [] # 1 if anomaly/fraud, 0 if safe
    risk_targets = [] # 0 to 100 risk score
    
    for _ in range(n_samples):
        # 88% normal transactions, 12% fraudulent/anomalous attempts
        is_fraud = 1 if random.random() < 0.12 else 0
        
        if is_fraud:
            country_mismatch = 1 if random.random() < 0.75 else 0
            disposable_email = 1 if random.random() < 0.60 else 0
            days_since_last = random.randint(1, 45) # sudden repeated change
            spend = random.uniform(80000, 2500000)
            missing_docs = random.choice([1, 2, 3])
            iban_valid = 0 if random.random() < 0.35 else 1
            is_bank_change = 1 if random.random() < 0.85 else 0
            vendor_age = random.uniform(0.0, 1.5) # young or unverified
            tax_haven = 1 if random.random() < 0.30 else 0
            
            # Base high risk score
            risk = random.randint(65, 98)
        else:
            country_mismatch = 0 if random.random() < 0.95 else 1
            disposable_email = 0
            days_since_last = random.randint(120, 1200)
            spend = random.uniform(10000, 800000)
            missing_docs = 0 if random.random() < 0.90 else 1
            iban_valid = 1
            is_bank_change = 1 if random.random() < 0.30 else 0
            vendor_age = random.uniform(1.0, 15.0)
            tax_haven = 0
            
            # Base low/moderate risk score
            risk = random.randint(5, 42)
            
        feat = [
            country_mismatch,
            disposable_email,
            days_since_last,
            np.log1p(spend),
            missing_docs,
            iban_valid,
            is_bank_change,
            vendor_age,
            tax_haven
        ]
        features.append(feat)
        fraud_labels.append(is_fraud)
        risk_targets.append(risk)
        
    return {
        "X": np.array(features),
        "y_fraud": np.array(fraud_labels),
        "y_risk": np.array(risk_targets)
    }

def generate_historical_time_series(days: int = 180) -> List[Dict[str, Any]]:
    """Generates 180 days of daily onboarding/modification requests for Axe 6 forecasting."""
    import math
    
    start_date = datetime.date.today() - datetime.timedelta(days=days)
    records = []
    base_volume = 15.0
    
    for d in range(days):
        cur_date = start_date + datetime.timedelta(days=d)
        weekday = cur_date.weekday() # 0 = Monday, 6 = Sunday
        
        # Weekend effect (lower volume)
        weekday_factor = 0.2 if weekday in [5, 6] else 1.0 + 0.15 * math.sin(weekday * 0.8)
        
        # Seasonal trend (tourism high season ramp-up around Spring/Summer)
        trend = (d / 180.0) * 8.0
        
        # Gaussian noise
        noise = random.gauss(0, 1.8)
        daily_reqs = max(2, int(round(base_volume + trend + noise * weekday_factor)))
        
        # Lead time in days
        avg_lead_time = max(1.2, round(2.8 + (daily_reqs * 0.08) + random.uniform(-0.4, 0.4), 1))
        
        records.append({
            "date": cur_date.isoformat(),
            "requests_count": daily_reqs,
            "avg_lead_time_days": avg_lead_time,
            "automated_ocr_ratio": round(random.uniform(0.85, 0.94), 2),
            "fraud_prevented_count": 1 if (daily_reqs > 18 and random.random() < 0.4) else 0
        })
        
    return records
