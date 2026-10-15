const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middlewares/auth');
const aiService = require('../services/aiService');
const auditService = require('../services/auditService');
const sapService = require('../services/sapService');

// Helper: Modulo 97 IBAN checksum (ISO 13616)
function validateIbanModulo97(iban) {
  if (!iban) return { valid: false, error: 'IBAN manquant' };
  const cleaned = iban.replace(/[\s-]/g, '').toUpperCase();
  if (cleaned.length < 14 || cleaned.length > 34) {
    return { valid: false, error: 'Longueur d IBAN invalide (14 à 34 caractères attendus)' };
  }

  // Move first 4 characters to end
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);

  // Replace letters with numbers (A = 10, B = 11, ..., Z = 35)
  let numeric = '';
  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      numeric += (code - 55).toString();
    } else if (code >= 48 && code <= 57) {
      numeric += rearranged[i];
    } else {
      return { valid: false, error: 'Caractère non autorisé dans l IBAN' };
    }
  }

  // Large integer modulo 97 using chunking
  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    const chunk = remainder.toString() + numeric.substring(i, Math.min(i + 7, numeric.length));
    remainder = parseInt(chunk, 10) % 97;
  }

  const isValid = remainder === 1;
  return {
    valid: isValid,
    cleaned,
    country_code: cleaned.substring(0, 2),
    error: isValid ? null : 'Échec de la clé de contrôle Modulo 97 (reste différent de 1)'
  };
}

// POST /api/requests/validate-iban (Validation en direct pour le demandeur)
router.post('/validate-iban', (req, res) => {
  const { iban, country } = req.body;
  const result = validateIbanModulo97(iban);

  let countryMismatch = false;
  if (country && result.valid) {
    const ibanCountry = result.country_code;
    countryMismatch = (ibanCountry.toUpperCase() !== country.trim().toUpperCase());
  }

  return res.json({
    success: true,
    ...result,
    country_mismatch: countryMismatch,
    warning: countryMismatch ? `Incohérence : IBAN émis en (${result.country_code}) alors que le pays du fournisseur est (${country.toUpperCase()})` : null
  });
});

// GET /api/requests (Filtré selon le rôle et le scope géographique)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, geographic_scope, id: userId, email: userEmail } = req.user;
    const { status, type, scope, search } = req.query;

    let sql = `
      SELECT r.*, 
             u.full_name as requester_name, 
             u.email as requester_email,
             v.legal_name as existing_vendor_name,
             v.sap_vendor_id
      FROM vendor_requests r
      LEFT JOIN users u ON r.requester_id = u.id
      LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE 1=1
    `;
    const params = [];

    // RBAC Role Restrictions
    if (role === 'VENDOR') {
      // Vendor sees requests linked by requester_id OR by contact_email inside temporary_data
      params.push(userId);
      params.push(userEmail.toLowerCase());
      sql += ` AND (
        r.requester_id = ? 
        OR LOWER(JSON_UNQUOTE(JSON_EXTRACT(r.temporary_data, '$.contact_email'))) = ? 
        OR LOWER(JSON_UNQUOTE(JSON_EXTRACT(r.temporary_data, '$.email'))) = ?
      )`;
      params.push(userEmail.toLowerCase());
    } else if (role === 'REQUESTER') {
      // Scoped requester: can see requests in their scope
      if (geographic_scope !== 'GLOBAL') {
        params.push(geographic_scope);
        params.push(userId);
        sql += ` AND (r.geographic_scope = ? OR r.requester_id = ?)`;
      }
    } else {
      // Agent, Manager, Admin can filter by scope if requested
      if (scope && scope !== 'ALL') {
        params.push(scope);
        sql += ` AND r.geographic_scope = ?`;
      }
    }

    if (status && status !== 'ALL') {
      params.push(status);
      sql += ` AND r.status = ?`;
    }

    if (type && type !== 'ALL') {
      params.push(type);
      sql += ` AND r.request_type = ?`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      params.push(`%${search.toLowerCase()}%`);
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (
        LOWER(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(r.temporary_data, '$.legal_name')), '')) LIKE ? 
        OR LOWER(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(r.temporary_data, '$.tax_id_vat')), '')) LIKE ?
        OR CAST(r.id AS CHAR) LIKE ?
      )`;
    }

    sql += ' ORDER BY r.id DESC';

    const result = await query(sql, params);
    return res.json({ success: true, count: result.rows.length, requests: result.rows });
  } catch (err) {
    console.error('[Request Route] Erreur liste requêtes :', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/requests/:id (Détail avec documents et piste d'audit)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const reqRes = await query(
      `SELECT r.*, 
              u.full_name as requester_name, 
              u.email as requester_email,
              v.legal_name as existing_vendor_name,
              v.sap_vendor_id
       FROM vendor_requests r
       LEFT JOIN users u ON r.requester_id = u.id
       LEFT JOIN vendors v ON r.vendor_id = v.id
       WHERE r.id = ?`,
      [id]
    );

    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dossier introuvable' });
    }

    const request = reqRes.rows[0];

    // RBAC validation: Vendor cannot view others' requests
    if (req.user.role === 'VENDOR') {
      const contactEmail = request.temporary_data?.contact_email || request.temporary_data?.email;
      const isOwner = request.requester_id === req.user.id || 
                      (contactEmail && contactEmail.toLowerCase() === req.user.email.toLowerCase());
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Accès non autorisé à ce dossier fournisseur.' });
      }
    }

    // Requester scope validation
    if (req.user.role === 'REQUESTER' && req.user.geographic_scope !== 'GLOBAL') {
      if (request.geographic_scope !== req.user.geographic_scope && request.requester_id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Accès non autorisé : dossier hors de votre périmètre géographique.' });
      }
    }

    // Load attached documents
    const docsRes = await query('SELECT * FROM documents WHERE request_id = ? ORDER BY id ASC', [id]);

    // Load audit trail
    const auditTrail = await auditService.getAuditTrail(id);

    return res.json({
      success: true,
      request,
      documents: docsRes.rows,
      audit_trail: auditTrail
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/requests (Création d'une nouvelle demande)
router.post('/', authenticateToken, async (req, res) => {
  const ipAddress = req.ip || '127.0.0.1';
  try {
    const {
      vendor_id = null,
      request_type = 'CREATION',
      geographic_scope,
      submitted_fields = {},
      document_text = null
    } = req.body;

    const requesterId = req.user.id;
    const finalScope = geographic_scope || req.user.geographic_scope || 'WESTERN';

    // Format temporary_data
    const tempData = {
      ...submitted_fields,
      created_by_role: req.user.role,
      document_text: document_text || null
    };

    // 1. Initial insert into vendor_requests
    const insertRes = await query(
      `INSERT INTO vendor_requests (requester_id, vendor_id, request_type, status, geographic_scope, temporary_data)
       VALUES (?, ?, ?, 'SUBMITTED', ?, ?)`,
      [requesterId, vendor_id || null, request_type, finalScope, JSON.stringify(tempData)]
    );

    const newRequestId = insertRes.insertId;

    await auditService.logAction({
      requestId: newRequestId,
      userId: req.user.id,
      action: 'REQUEST_CREATED',
      oldValue: null,
      newValue: { status: 'SUBMITTED', request_type, geographic_scope: finalScope, legal_name: submitted_fields.legal_name },
      ipAddress
    });

    // 2. Perform AI screening automatically
    const screenPayload = {
      vendor_name: submitted_fields.legal_name || 'Nouveau Fournisseur',
      vendor_country: submitted_fields.country || (finalScope === 'NORDIC' ? 'SE' : 'FR'),
      iban: submitted_fields.iban || 'FR7630006000011234567890189',
      bic_swift: submitted_fields.bic_swift || 'BNPAFRPP',
      contact_email: submitted_fields.contact_email || submitted_fields.email || req.user.email,
      annual_spend: parseFloat(submitted_fields.annual_spend || 50000.0),
      tax_id_vat: submitted_fields.tax_id_vat || 'FR89345210987',
      request_type,
      geographic_scope: finalScope,
      document_text
    };

    const aiScreen = await aiService.screenRequest(screenPayload);

    const enrichedTempData = {
      ...tempData,
      ocr_result: aiScreen.ocr_result,
      fraud_check: aiScreen.fraud_check,
      deduplication: aiScreen.deduplication,
      risk_scoring: aiScreen.risk_scoring,
      segmentation: aiScreen.segmentation
    };

    const riskScore = aiScreen.risk_scoring?.risk_score ?? 20.0;
    const riskTier = aiScreen.risk_scoring?.risk_tier ?? 'LOW';
    const fraudAlert = Boolean(aiScreen.fraud_check?.is_anomaly);

    await query(
      `UPDATE vendor_requests 
       SET status = 'PENDING_AGENT',
           temporary_data = ?,
           risk_score = ?,
           risk_tier = ?,
           risk_factors = ?,
           fraud_alert = ?,
           fraud_details = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        JSON.stringify(enrichedTempData),
        riskScore,
        riskTier,
        JSON.stringify(aiScreen.risk_scoring?.top_factors || []),
        fraudAlert ? 1 : 0,
        JSON.stringify(aiScreen.fraud_check || {}),
        newRequestId
      ]
    );

    await auditService.logAction({
      requestId: newRequestId,
      userId: null,
      action: 'AI_SCREENING_COMPLETED',
      oldValue: { status: 'SUBMITTED' },
      newValue: {
        status: 'PENDING_AGENT',
        risk_score: riskScore,
        risk_tier: riskTier,
        fraud_alert: fraudAlert
      },
      ipAddress: '127.0.0.1'
    });

    return res.status(201).json({
      success: true,
      message: 'Demande fournisseur créée et contrôlée par le moteur IA avec succès.',
      request_id: newRequestId,
      risk_score: riskScore,
      risk_tier: riskTier,
      fraud_alert: fraudAlert
    });
  } catch (err) {
    console.error('[Request Route] Erreur création demande :', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/requests/:id/agent-review (Revue opérationnelle Master Data Agent)
router.put('/:id/agent-review', authenticateToken, requireRole('MASTER_DATA_AGENT', 'ADMIN'), async (req, res) => {
  const ipAddress = req.ip || '127.0.0.1';
  try {
    const { id } = req.params;
    const { action, comments, reason, validated_fields } = req.body; 
    // action: 'APPROVE_TO_MANAGER', 'REJECT', 'REQUEST_CORRECTION'

    const reqRes = await query('SELECT * FROM vendor_requests WHERE id = ?', [id]);
    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dossier introuvable' });
    }

    const currentReq = reqRes.rows[0];

    // Mandatory rejection reason check
    if (action === 'REJECT') {
      const rejectReason = (reason || comments || '').trim();
      if (!rejectReason) {
        return res.status(400).json({
          success: false,
          error: 'Le motif de rejet est strictement obligatoire pour toute décision défavorable.'
        });
      }
    }

    let newStatus = currentReq.status;
    let rejectionReason = currentReq.rejection_reason;

    if (action === 'APPROVE_TO_MANAGER') {
      newStatus = 'PENDING_MANAGER';
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
      rejectionReason = (reason || comments || '').trim();
    } else if (action === 'REQUEST_CORRECTION') {
      newStatus = 'DRAFT';
    }

    const updatedTempData = {
      ...(currentReq.temporary_data || {}),
      ...(validated_fields || {}),
      agent_review: {
        agent_id: req.user.id,
        agent_name: req.user.full_name,
        reviewed_at: new Date().toISOString(),
        action,
        comments: comments || reason || 'Revue opérationnelle validée'
      }
    };

    await query(
      `UPDATE vendor_requests
       SET status = ?,
           temporary_data = ?,
           rejection_reason = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newStatus, JSON.stringify(updatedTempData), rejectionReason, id]
    );

    await auditService.logAction({
      requestId: id,
      userId: req.user.id,
      action: `AGENT_REVIEW_${action}`,
      oldValue: { status: currentReq.status },
      newValue: { status: newStatus, comments: comments || reason },
      ipAddress
    });

    return res.json({
      success: true,
      message: `Dossier ${id} mis à jour avec le statut : ${newStatus}`,
      status: newStatus
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/requests/:id/manager-approval (Décision gouvernance Manager)
router.put('/:id/manager-approval', authenticateToken, requireRole('MANAGER_APPROVAL', 'ADMIN'), async (req, res) => {
  const ipAddress = req.ip || '127.0.0.1';
  try {
    const { id } = req.params;
    const { decision, comments, reason } = req.body; // decision: 'APPROVE', 'REJECT'

    const reqRes = await query('SELECT * FROM vendor_requests WHERE id = ?', [id]);
    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dossier introuvable' });
    }

    const currentReq = reqRes.rows[0];

    // Mandatory rejection reason validation
    if (decision === 'REJECT') {
      const rejectReason = (reason || comments || '').trim();
      if (!rejectReason) {
        return res.status(400).json({
          success: false,
          error: 'Gouvernance financière : Le motif de rejet est obligatoire.'
        });
      }
    }

    const newStatus = (decision === 'APPROVE') ? 'APPROVED' : 'REJECTED';
    const rejectionReason = (decision === 'REJECT') ? (reason || comments || '').trim() : currentReq.rejection_reason;

    const updatedTempData = {
      ...(currentReq.temporary_data || {}),
      manager_decision: {
        manager_id: req.user.id,
        manager_name: req.user.full_name,
        decided_at: new Date().toISOString(),
        decision,
        comments: comments || reason || (decision === 'APPROVE' ? 'Approbation finale accordée' : 'Dossier rejeté')
      }
    };

    await query(
      `UPDATE vendor_requests
       SET status = ?,
           temporary_data = ?,
           rejection_reason = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newStatus, JSON.stringify(updatedTempData), rejectionReason, id]
    );

    await auditService.logAction({
      requestId: id,
      userId: req.user.id,
      action: `MANAGER_${decision}`,
      oldValue: { status: currentReq.status },
      newValue: { status: newStatus, comments: comments || reason },
      ipAddress
    });

    return res.json({
      success: true,
      message: `Décision Manager enregistrée : ${newStatus}`,
      status: newStatus
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/requests/:id/sap-sync (Synchronisation ERP SAP S/4HANA)
router.post('/:id/sap-sync', authenticateToken, requireRole('MANAGER_APPROVAL', 'ADMIN'), async (req, res) => {
  const ipAddress = req.ip || '127.0.0.1';
  try {
    const { id } = req.params;
    const reqRes = await query('SELECT * FROM vendor_requests WHERE id = ?', [id]);
    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dossier introuvable' });
    }

    const currentReq = reqRes.rows[0];
    if (currentReq.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        error: `Le dossier doit impérativement être au statut 'APPROVED' pour déclencher la synchronisation SAP (Statut actuel : ${currentReq.status}).`
      });
    }

    const vendorData = currentReq.temporary_data || {};
    const sapResult = await sapService.syncVendorToSap({
      request: currentReq,
      vendorData
    });

    // Check if vendor already exists or create new
    let vendorId = currentReq.vendor_id;
    if (!vendorId) {
      const insertVendor = await query(
        `INSERT INTO vendors (sap_vendor_id, legal_name, trade_name, tax_id_vat, country, address, iban, bic_swift, bank_name, status, risk_score, segment, annual_spend, geographic_scope)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)`,
        [
          sapResult.sap_vendor_id,
          vendorData.legal_name || 'Fournisseur SAP',
          vendorData.trade_name || vendorData.legal_name || 'Fournisseur SAP',
          vendorData.tax_id_vat || 'FR99999999999',
          vendorData.country || 'FR',
          vendorData.address || 'Siège Social',
          vendorData.iban || 'FR7600000000000000000000000',
          vendorData.bic_swift || 'BNPAFRPP',
          vendorData.bank_name || 'Banque Tiers',
          currentReq.risk_score || 15.0,
          vendorData.segment || 'OPERATIONAL',
          parseFloat(vendorData.annual_spend || 50000.0),
          currentReq.geographic_scope
        ]
      );
      vendorId = insertVendor.insertId;
    } else {
      await query(
        `UPDATE vendors 
         SET iban = ?, bic_swift = ?, bank_name = ?, risk_score = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [vendorData.iban, vendorData.bic_swift, vendorData.bank_name, currentReq.risk_score, vendorId]
      );
    }

    const updatedTemp = {
      ...vendorData,
      sap_synchronization: sapResult
    };

    await query(
      `UPDATE vendor_requests
       SET status = 'SAP_SYNCED',
           vendor_id = ?,
           temporary_data = ?,
           sap_idoc_payload = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [vendorId, JSON.stringify(updatedTemp), JSON.stringify(sapResult.idoc_payload || {}), id]
    );

    await auditService.logAction({
      requestId: id,
      userId: req.user.id,
      action: 'SAP_SYNC_COMPLETED',
      oldValue: { status: 'APPROVED' },
      newValue: { status: 'SAP_SYNCED', sap_vendor_id: sapResult.sap_vendor_id, idoc_type: sapResult.idoc_type },
      ipAddress
    });

    return res.json({
      success: true,
      message: `Fournisseur synchronisé avec succès dans SAP S/4HANA (IDoc ${sapResult.idoc_type} ${sapResult.idoc_number})`,
      sap_result: sapResult
    });
  } catch (err) {
    console.error('[Request Route] Erreur synchronisation SAP :', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/requests/:id/simulate-idoc (Simulation interactive du flux IDoc CREMAS/ADRMAS)
router.get('/:id/simulate-idoc', authenticateToken, requireRole('MANAGER_APPROVAL', 'MASTER_DATA_AGENT', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const reqRes = await query('SELECT * FROM vendor_requests WHERE id = ?', [id]);
    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dossier introuvable' });
    }

    const currentReq = reqRes.rows[0];
    const vendorData = currentReq.temporary_data || {};

    const isRiskElevated = (currentReq.risk_score >= 70) || Boolean(currentReq.fraud_alert);
    const idocType = currentReq.request_type === 'BANK_CHANGE' ? 'ADRMAS03 / FIDCC1' : 'CREMAS05';
    const idocNumber = `00000000${Math.floor(10000000 + Math.random() * 90000000)}`;

    const idocPayload = {
      EDI_DC40: {
        TABNAM: 'EDI_DC40',
        DIRECT: '2',
        IDOCTYP: idocType,
        MESTYP: 'CREMAS',
        SNDPRT: 'LS',
        SNDPRN: 'MASTERDATA_IA',
        RCVPRT: 'LS',
        RCVPRN: 'SAP_S4HANA_PRD',
        CREDAT: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        CRETIM: new Date().toTimeString().slice(0, 8).replace(/:/g, '')
      },
      E1LFA1M: {
        LIFNR: currentReq.sap_vendor_id || `VEND-00${id}00${id}`,
        KTOKK: 'KRED',
        NAME1: vendorData.legal_name || 'Fournisseur SAP',
        NAME2: vendorData.trade_name || '',
        LAND1: vendorData.country || 'FR',
        STCEG: vendorData.tax_id_vat || '',
        SPERR: isRiskElevated ? 'X' : ' ', // SAP Posting Block
        NODEL: ' '
      },
      E1LFB1M: {
        BUKRS: currentReq.geographic_scope === 'NORDIC' ? 'SE10' : 'FR10',
        ZWELS: 'E',
        ZTERM: 'NT30',
        ZBLOCK: isRiskElevated ? 'B' : ' ' // Payment Block due to risk
      },
      E1LFBKM: {
        BANKS: (vendorData.iban || 'FR').substring(0, 2),
        BANKL: vendorData.bic_swift || 'BNPAFRPP',
        IBAN: vendorData.iban || '',
        BKONT: '01',
        BVTYP: 'SEPA'
      },
      METADATA: {
        generated_by: req.user.full_name,
        risk_score: currentReq.risk_score,
        risk_tier: currentReq.risk_tier,
        preventive_block_applied: isRiskElevated
      }
    };

    return res.json({
      success: true,
      idoc_type: idocType,
      idoc_number: idocNumber,
      preventive_block: isRiskElevated,
      payload: idocPayload
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
