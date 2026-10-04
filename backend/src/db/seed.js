const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb, query } = require('../config/db');

async function seedDatabase() {
  console.log('[SEED] Initialisation du schéma PostgreSQL...');
  await getDb();

  const { exec } = require('../config/db');
  const ddl = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
  await exec(ddl);

  // Check if users already exist
  const existingUsers = await query('SELECT COUNT(*) as count FROM users');
  const count = parseInt(existingUsers.rows[0].count || 0);

  if (count > 0) {
    console.log(`[SEED] Base déjà initialisée (${count} utilisateurs trouvés). Nettoyage et réinitialisation...`);
    await query('DELETE FROM audit_logs');
    await query('DELETE FROM documents');
    await query('DELETE FROM vendor_requests');
    await query('DELETE FROM vendors');
    await query('DELETE FROM users');
  }

  console.log('[SEED] Création des utilisateurs RBAC...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const users = [
    {
      id: 'usr-vendor-01',
      email: 'vendor.hotel@tui-partner.com',
      full_name: 'Carlos Mendez (Iberian Transfers SL)',
      role: 'VENDOR',
      scope: 'WESTERN'
    },
    {
      id: 'usr-req-01',
      email: 'requester.finance@tui.fr',
      full_name: 'Sophie Laurent (Acheteur TUI France)',
      role: 'REQUESTER',
      scope: 'WESTERN'
    },
    {
      id: 'usr-agent-01',
      email: 'agent.masterdata@tui.com',
      full_name: 'Erik Lindqvist (Master Data Operations)',
      role: 'MASTER_DATA_AGENT',
      scope: 'GLOBAL'
    },
    {
      id: 'usr-mgr-01',
      email: 'manager.approval@tui.com',
      full_name: 'Dr. Helena Becker (Head of Finance Governance)',
      role: 'MANAGER_APPROVAL',
      scope: 'GLOBAL'
    },
    {
      id: 'usr-sap-01',
      email: 'sap.integration@tui.internal',
      full_name: 'SAP NetWeaver Connector',
      role: 'SYSTEM_SAP',
      scope: 'GLOBAL'
    }
  ];

  for (const u of users) {
    await query(
      `INSERT INTO users (id, email, password_hash, full_name, role, geographic_scope)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [u.id, u.email, passwordHash, u.full_name, u.role, u.scope]
    );
  }

  console.log('[SEED] Création du catalogue fournisseurs SAP référents...');
  const vendors = [
    {
      id: 'vnd-1001',
      sap_id: 'SAP-100010',
      legal_name: 'TUI Blue Hotels & Resorts SAS',
      trade_name: 'TUI Blue Hotels',
      tax_id: 'FR89345210987',
      country: 'FR',
      address: '28 Rue Jacques Ibert, 75017 Paris, France',
      iban: 'FR7630006000011234567890189',
      bic: 'BNPAFRPP',
      bank_name: 'BNP Paribas',
      risk_score: 12,
      segment: 'STRATEGIC',
      annual_spend: 1850000.0,
      scope: 'WESTERN'
    },
    {
      id: 'vnd-1002',
      sap_id: 'SAP-100020',
      legal_name: 'Nordic Fjord Charter AB',
      trade_name: 'Nordic Fjord',
      tax_id: 'SE5561234567',
      country: 'SE',
      address: 'Hamngatan 15, 111 47 Stockholm, Sweden',
      iban: 'SE4550000000058398257466',
      bic: 'SWEDSESS',
      bank_name: 'Swedbank',
      risk_score: 18,
      segment: 'OPERATIONAL',
      annual_spend: 420000.0,
      scope: 'NORDIC'
    },
    {
      id: 'vnd-1003',
      sap_id: 'SAP-100030',
      legal_name: 'Mallorca Transfers & Excursions SL',
      trade_name: 'Mallorca Transfers',
      tax_id: 'ESB07123456',
      country: 'ES',
      address: 'Avinguda d Alexandre Rossello 12, Palma de Mallorca, Spain',
      iban: 'ES9121000418450200051332',
      bic: 'CAIXESBB',
      bank_name: 'CaixaBank',
      risk_score: 22,
      segment: 'OPERATIONAL',
      annual_spend: 310000.0,
      scope: 'WESTERN'
    },
    {
      id: 'vnd-1004',
      sap_id: 'SAP-100040',
      legal_name: 'Bavaria Alpine Shuttle GmbH',
      trade_name: 'Alpine Shuttle',
      tax_id: 'DE129274829',
      country: 'DE',
      address: 'Sonnenstrasse 42, 80331 München, Germany',
      iban: 'DE89370400440532013000',
      bic: 'DEUTDEDD',
      bank_name: 'Deutsche Bank',
      risk_score: 14,
      segment: 'OPERATIONAL',
      annual_spend: 680000.0,
      scope: 'TGBST'
    }
  ];

  for (const v of vendors) {
    await query(
      `INSERT INTO vendors (id, sap_vendor_id, legal_name, trade_name, tax_id_vat, country, address, iban, bic_swift, bank_name, status, risk_score, segment, annual_spend, geographic_scope)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE', $11, $12, $13, $14)`,
      [v.id, v.sap_id, v.legal_name, v.trade_name, v.tax_id, v.country, v.address, v.iban, v.bic, v.bank_name, v.risk_score, v.segment, v.annual_spend, v.scope]
    );
  }

  console.log('[SEED] Création des demandes de démonstration initiales...');

  // 1. Demande d'Onboarding saine en attente Master Data Agent
  const req1Id = 'req-onb-01';
  const req1Data = {
    submitted_fields: {
      legal_name: 'Helios Hospitality Greece SA',
      tax_id_vat: 'EL094123456',
      iban: 'GR1601101250000001234567890',
      bic_swift: 'ETHNGRAA',
      bank_name: 'National Bank of Greece',
      address: 'Othonos 8, Syntagma, 10557 Athens, Greece',
      country: 'GR',
      email: 'accounting@helios-hospitality.gr'
    },
    ocr_result: {
      global_confidence: 0.96,
      extracted_fields: {
        iban: { value: 'GR1601101250000001234567890', confidence: 0.99, validation_status: 'VALID' },
        bic_swift: { value: 'ETHNGRAA', confidence: 0.97, validation_status: 'VALID' },
        legal_name: { value: 'Helios Hospitality Greece SA', confidence: 0.95, validation_status: 'VALID' },
        tax_id_vat: { value: 'EL094123456', confidence: 0.94, validation_status: 'VALID' }
      }
    },
    deduplication: {
      duplicates_found: false,
      top_matches: []
    }
  };

  await query(
    `INSERT INTO vendor_requests (id, requester_id, request_type, status, geographic_scope, temporary_data, risk_score, risk_tier, risk_factors, fraud_alert, fraud_details)
     VALUES ($1, $2, 'ONBOARDING', 'PENDING_AGENT', 'WESTERN', $3, 18, 'LOW', $4, false, '{}')`,
    [
      req1Id,
      'usr-req-01',
      JSON.stringify(req1Data),
      JSON.stringify([
        { factor_name: 'Fournisseur hôtelier avec dossier complet', impact: -12, category: 'COMPLIANCE' },
        { factor_name: 'IBAN SEPA certifié conforme', impact: -10, category: 'BANKING' }
      ])
    ]
  );

  // 2. Demande de modification de RIB suspecte avec Alerte Fraude
  const req2Id = 'req-fraud-02';
  const req2Data = {
    submitted_fields: {
      legal_name: 'Mallorca Transfers & Excursions SL',
      tax_id_vat: 'ESB07123456',
      iban: 'SE4550000000058398257466', // Suspicious SE IBAN for ES vendor
      bic_swift: 'SWEDSESS',
      bank_name: 'Swedbank Stockholm',
      address: 'Avinguda d Alexandre Rossello 12, Palma de Mallorca, Spain',
      country: 'ES',
      email: 'mallorca-urgent-update@temp-mail.org'
    },
    ocr_result: {
      global_confidence: 0.88,
      extracted_fields: {
        iban: { value: 'SE4550000000058398257466', confidence: 0.98, validation_status: 'VALID' },
        bic_swift: { value: 'SWEDSESS', confidence: 0.95, validation_status: 'VALID' }
      }
    }
  };

  const fraudDetails = {
    is_anomaly: true,
    anomaly_score: 82.5,
    severity: 'CRITICAL',
    triggers: [
      {
        rule: 'COUNTRY_MISMATCH',
        severity: 'HIGH',
        description: "Incohérence territoriale : IBAN émis en Suède (SE) alors que le siège du fournisseur est enregistré en Espagne (ES)."
      },
      {
        rule: 'UNOFFICIAL_EMAIL_PROVIDER',
        severity: 'MEDIUM',
        description: "Demande de virement soumise depuis un domaine email temporaire / non officiel (@temp-mail.org)."
      },
      {
        rule: 'HIGH_FREQUENCY_BANK_ROTATION',
        severity: 'HIGH',
        description: "Deuxième changement de RIB en moins de 30 jours."
      }
    ]
  };

  await query(
    `INSERT INTO vendor_requests (id, requester_id, vendor_id, request_type, status, geographic_scope, temporary_data, risk_score, risk_tier, risk_factors, fraud_alert, fraud_details)
     VALUES ($1, $2, 'vnd-1003', 'BANK_CHANGE', 'PENDING_MANAGER', 'WESTERN', $3, 84, 'CRITICAL', $4, true, $5)`,
    [
      req2Id,
      'usr-req-01',
      JSON.stringify(req2Data),
      JSON.stringify([
        { factor_name: 'Discordance géographique pays IBAN (SE) vs siège (ES)', impact: +32, category: 'BANKING' },
        { factor_name: 'Email émetteur temporaire suspect', impact: +20, category: 'BEHAVIORAL' },
        { factor_name: 'Demande de modification de RIB sensible', impact: +15, category: 'BEHAVIORAL' }
      ]),
      JSON.stringify(fraudDetails)
    ]
  );

  // 3. Demande validée et synchronisée avec SAP (avec audit trail complet)
  const req3Id = 'req-appr-03';
  const req3Data = {
    submitted_fields: {
      legal_name: 'Nordic Fjord Charter AB',
      tax_id_vat: 'SE5561234567',
      iban: 'SE4550000000058398257466',
      bic_swift: 'SWEDSESS',
      bank_name: 'Swedbank',
      country: 'SE'
    }
  };

  await query(
    `INSERT INTO vendor_requests (id, requester_id, vendor_id, request_type, status, geographic_scope, temporary_data, risk_score, risk_tier, risk_factors, fraud_alert, fraud_details)
     VALUES ($1, $2, 'vnd-1002', 'ONBOARDING', 'SAP_SYNCED', 'NORDIC', $3, 14, 'LOW', '[]', false, '{}')`,
    [req3Id, 'usr-req-01', JSON.stringify(req3Data)]
  );

  // Insert Audit Logs
  await query(
    `INSERT INTO audit_logs (id, request_id, user_id, action, old_value, new_value)
     VALUES 
     ($1, $2, $3, 'STATUS_CHANGE', '{"status": "SUBMITTED"}', '{"status": "AI_PROCESSED"}'),
     ($4, $2, $5, 'FIELD_VALIDATION', '{"status": "AI_PROCESSED"}', '{"status": "PENDING_MANAGER"}'),
     ($6, $2, $7, 'MANAGER_APPROVAL', '{"status": "PENDING_MANAGER"}', '{"status": "APPROVED"}'),
     ($8, $2, $9, 'SAP_SYNC', '{"status": "APPROVED"}', '{"status": "SAP_SYNCED", "sap_doc_id": "SAP-IDOC-994821"}')`,
    [
      uuidv4(), req3Id, 'usr-req-01',
      uuidv4(), 'usr-agent-01',
      uuidv4(), 'usr-mgr-01',
      uuidv4(), 'usr-sap-01'
    ]
  );

  console.log('[SEED] Base PostgreSQL initialisée avec succès !');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[SEED] Erreur critique :', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
