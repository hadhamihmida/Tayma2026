-- =============================================================================
-- Schema PostgreSQL pour TUI Group Finance "Master Data IA"
-- Utilisation de types natifs JSONB pour les données flexibles et l'audit trail
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('VENDOR', 'REQUESTER', 'MASTER_DATA_AGENT', 'MANAGER_APPROVAL', 'SYSTEM_SAP')),
    geographic_scope TEXT NOT NULL CHECK (geographic_scope IN ('WESTERN', 'NORDIC', 'TGBST', 'GLOBAL')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    sap_vendor_id TEXT,
    legal_name TEXT NOT NULL,
    trade_name TEXT,
    tax_id_vat TEXT NOT NULL,
    country VARCHAR(2) NOT NULL,
    address TEXT,
    iban TEXT NOT NULL,
    bic_swift TEXT NOT NULL,
    bank_name TEXT,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'BLOCKED')),
    risk_score INTEGER DEFAULT 15,
    segment TEXT DEFAULT 'OPERATIONAL' CHECK (segment IN ('STRATEGIC', 'OPERATIONAL', 'OCCASIONAL', 'HIGH_RISK')),
    annual_spend NUMERIC DEFAULT 50000.0,
    geographic_scope TEXT DEFAULT 'WESTERN' CHECK (geographic_scope IN ('WESTERN', 'NORDIC', 'TGBST', 'GLOBAL')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_requests (
    id TEXT PRIMARY KEY,
    requester_id TEXT REFERENCES users(id),
    vendor_id TEXT REFERENCES vendors(id),
    request_type TEXT NOT NULL CHECK (request_type IN ('ONBOARDING', 'BANK_CHANGE', 'ADDRESS_CHANGE')),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'AI_PROCESSED', 'PENDING_AGENT', 'PENDING_MANAGER', 'APPROVED', 'REJECTED', 'SAP_SYNCED')),
    geographic_scope TEXT NOT NULL CHECK (geographic_scope IN ('WESTERN', 'NORDIC', 'TGBST')),
    temporary_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    risk_score INTEGER DEFAULT 0,
    risk_tier TEXT DEFAULT 'LOW',
    risk_factors JSONB DEFAULT '[]'::jsonb,
    fraud_alert BOOLEAN DEFAULT FALSE,
    fraud_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    request_id TEXT REFERENCES vendor_requests(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('RIB', 'KBIS_REGISTRATION', 'TAX_CERTIFICATE', 'PASSPORT_ID')),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    mime_type TEXT,
    ocr_extracted_data JSONB DEFAULT '{}'::jsonb,
    ocr_confidence JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    request_id TEXT,
    user_id TEXT,
    action TEXT NOT NULL,
    old_value JSONB DEFAULT '{}'::jsonb,
    new_value JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON vendor_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_scope ON vendor_requests(geographic_scope);
CREATE INDEX IF NOT EXISTS idx_vendors_vat ON vendors(tax_id_vat);
CREATE INDEX IF NOT EXISTS idx_audit_request ON audit_logs(request_id);
