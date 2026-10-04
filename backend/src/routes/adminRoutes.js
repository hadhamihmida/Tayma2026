const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole, validate } = require('../middlewares/auth');
const auditService = require('../services/auditService');

// All admin routes require ADMIN role
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

// RBAC Permissions Matrix Definition
const PERMISSIONS_MATRIX = [
  {
    module: 'Fournisseurs & Dossiers',
    action: 'Dépôt RIB / Kbis en ligne',
    description: 'Téléversement de justificatifs et soumission de fiche',
    roles: { VENDOR: true, REQUESTER: false, MASTER_DATA_AGENT: false, MANAGER_APPROVAL: false, ADMIN: true }
  },
  {
    module: 'Fournisseurs & Dossiers',
    action: 'Création d une demande interne',
    description: 'Saisie d une demande avec validation IBAN Modulo 97 en direct',
    roles: { VENDOR: false, REQUESTER: true, MASTER_DATA_AGENT: false, MANAGER_APPROVAL: false, ADMIN: true }
  },
  {
    module: 'Fournisseurs & Dossiers',
    action: 'Revue et Rapprochement OCR',
    description: 'Comparaison des valeurs déclarées vs OCR & inspection signaux',
    roles: { VENDOR: false, REQUESTER: false, MASTER_DATA_AGENT: true, MANAGER_APPROVAL: false, ADMIN: true }
  },
  {
    module: 'Contrôle & Risque',
    action: 'Score IA & Facteurs SHAP',
    description: 'Analyse détaillée des 5 moteurs IA et des alertes doublons',
    roles: { VENDOR: false, REQUESTER: false, MASTER_DATA_AGENT: true, MANAGER_APPROVAL: true, ADMIN: true }
  },
  {
    module: 'Gouvernance & Décision',
    action: 'Transmission au Manager',
    description: 'Certification de premier niveau et passage en revue managériale',
    roles: { VENDOR: false, REQUESTER: false, MASTER_DATA_AGENT: true, MANAGER_APPROVAL: false, ADMIN: true }
  },
  {
    module: 'Gouvernance & Décision',
    action: 'Approbation Finale Manager',
    description: 'Arbitrage financier et validation formelle de la demande',
    roles: { VENDOR: false, REQUESTER: false, MASTER_DATA_AGENT: false, MANAGER_APPROVAL: true, ADMIN: true }
  },
  {
    module: 'Gouvernance & Décision',
    action: 'Rejet avec Motif Obligatoire',
    description: 'Rejet motivé avec notification et archivage à l audit trail',
    roles: { VENDOR: false, REQUESTER: false, MASTER_DATA_AGENT: true, MANAGER_APPROVAL: true, ADMIN: true }
  },
  {
    module: 'Intégration ERP SAP',
    action: 'Génération & Simulation IDoc',
    description: 'Création du segment CREMAS05 / ADRMAS03 et blocage préventif ZBLOCK',
    roles: { VENDOR: false, REQUESTER: false, MASTER_DATA_AGENT: false, MANAGER_APPROVAL: true, ADMIN: true }
  },
  {
    module: 'Intégration ERP SAP',
    action: 'Consultation Référentiel SAP',
    description: 'Recherche et consultation des tiers actifs dans l ERP',
    roles: { VENDOR: false, REQUESTER: true, MASTER_DATA_AGENT: true, MANAGER_APPROVAL: true, ADMIN: true }
  },
  {
    module: 'Administration & Sécurité',
    action: 'Gestion Utilisateurs (CRUD)',
    description: 'Création, modification, activation et réinitialisation de mot de passe',
    roles: { VENDOR: false, REQUESTER: false, MASTER_DATA_AGENT: false, MANAGER_APPROVAL: false, ADMIN: true }
  },
  {
    module: 'Administration & Sécurité',
    action: 'Attribution Rôle & Périmètre',
    description: 'Affectation des zones WESTERN, NORDIC, GLOBAL et des privilèges',
    roles: { VENDOR: false, REQUESTER: false, MASTER_DATA_AGENT: false, MANAGER_APPROVAL: false, ADMIN: true }
  },
  {
    module: 'Administration & Sécurité',
    action: 'Piste d Audit Immuable & Export',
    description: 'Consultation complète des logs SOX et exports CSV / PDF',
    roles: { VENDOR: false, REQUESTER: false, MASTER_DATA_AGENT: false, MANAGER_APPROVAL: false, ADMIN: true }
  }
];

// GET /api/admin/permissions-matrix
router.get('/permissions-matrix', (req, res) => {
  res.json({ success: true, matrix: PERMISSIONS_MATRIX });
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { role, scope, status, search } = req.query;
    let sql = `
      SELECT id, email, full_name, role, geographic_scope, is_active, 
             failed_login_attempts, locked_until, last_login_at, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== 'ALL') {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (scope && scope !== 'ALL') {
      sql += ' AND geographic_scope = ?';
      params.push(scope);
    }
    if (status === 'ACTIVE') {
      sql += ' AND is_active = 1';
    } else if (status === 'INACTIVE') {
      sql += ' AND is_active = 0';
    }
    if (search) {
      sql += ' AND (LOWER(email) LIKE ? OR LOWER(full_name) LIKE ?)';
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }

    sql += ' ORDER BY id ASC';

    const result = await query(sql, params);
    return res.json({
      success: true,
      count: result.rows.length,
      users: result.rows.map(u => ({
        ...u,
        is_active: Boolean(u.is_active),
        is_locked: Boolean(u.locked_until && new Date(u.locked_until) > new Date())
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/users
router.post('/users', validate('createUser'), async (req, res) => {
  const adminId = req.user.id;
  const ipAddress = req.ip || '127.0.0.1';

  try {
    const { email, password, full_name, role, geographic_scope } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    // Check unique email
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Une adresse email identique est déjà attribuée à un compte existant.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const scope = geographic_scope || 'GLOBAL';

    const insertRes = await query(
      `INSERT INTO users (email, password_hash, full_name, role, geographic_scope, is_active, failed_login_attempts)
       VALUES (?, ?, ?, ?, ?, 1, 0)`,
      [cleanEmail, passwordHash, full_name.trim(), role, scope]
    );

    const newUserId = insertRes.insertId;

    // Log admin action & audit trail
    await query(
      `INSERT INTO admin_actions (admin_id, target_user_id, action, details, ip_address, timestamp)
       VALUES (?, ?, 'USER_CREATED', ?, ?, CURRENT_TIMESTAMP)`,
      [adminId, newUserId, JSON.stringify({ email: cleanEmail, role, geographic_scope: scope, full_name }), ipAddress]
    );

    await auditService.logAction({
      userId: adminId,
      action: 'ADMIN_USER_CREATED',
      oldValue: null,
      newValue: { target_user_id: newUserId, email: cleanEmail, role, geographic_scope: scope },
      ipAddress
    });

    return res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès.',
      user: {
        id: newUserId,
        email: cleanEmail,
        full_name: full_name.trim(),
        role,
        geographic_scope: scope,
        is_active: true
      }
    });
  } catch (err) {
    console.error('[Admin Route] Erreur création utilisateur :', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', validate('updateUser'), async (req, res) => {
  const adminId = req.user.id;
  const targetId = parseInt(req.params.id, 10);
  const ipAddress = req.ip || '127.0.0.1';

  try {
    const userRes = await query('SELECT * FROM users WHERE id = ?', [targetId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    const current = userRes.rows[0];

    const { full_name, role, geographic_scope, is_active } = req.body;

    const newFullName = full_name !== undefined ? full_name.trim() : current.full_name;
    const newRole = role !== undefined ? role : current.role;
    const newScope = geographic_scope !== undefined ? geographic_scope : current.geographic_scope;
    const newIsActive = is_active !== undefined ? (is_active ? 1 : 0) : current.is_active;

    await query(
      `UPDATE users 
       SET full_name = ?, role = ?, geographic_scope = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newFullName, newRole, newScope, newIsActive, targetId]
    );

    const changes = {
      full_name: { old: current.full_name, new: newFullName },
      role: { old: current.role, new: newRole },
      scope: { old: current.geographic_scope, new: newScope },
      is_active: { old: Boolean(current.is_active), new: Boolean(newIsActive) }
    };

    await query(
      `INSERT INTO admin_actions (admin_id, target_user_id, action, details, ip_address, timestamp)
       VALUES (?, ?, 'USER_UPDATED', ?, ?, CURRENT_TIMESTAMP)`,
      [adminId, targetId, JSON.stringify(changes), ipAddress]
    );

    await auditService.logAction({
      userId: adminId,
      action: 'ADMIN_USER_UPDATED',
      oldValue: { role: current.role, scope: current.geographic_scope },
      newValue: { role: newRole, scope: newScope, is_active: Boolean(newIsActive) },
      ipAddress
    });

    return res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès.',
      user: {
        id: targetId,
        email: current.email,
        full_name: newFullName,
        role: newRole,
        geographic_scope: newScope,
        is_active: Boolean(newIsActive)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', async (req, res) => {
  const adminId = req.user.id;
  const targetId = parseInt(req.params.id, 10);
  const ipAddress = req.ip || '127.0.0.1';

  try {
    if (adminId === targetId) {
      return res.status(400).json({ success: false, error: 'Action de sécurité : Vous ne pouvez pas désactiver votre propre compte administrateur.' });
    }

    const userRes = await query('SELECT * FROM users WHERE id = ?', [targetId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    const user = userRes.rows[0];

    const { is_active } = req.body;
    const newStatus = is_active !== undefined ? (is_active ? 1 : 0) : (user.is_active ? 0 : 1);

    await query('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, targetId]);

    const actionName = newStatus ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';

    await query(
      `INSERT INTO admin_actions (admin_id, target_user_id, action, details, ip_address, timestamp)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [adminId, targetId, actionName, JSON.stringify({ previous_status: user.is_active, new_status: newStatus }), ipAddress]
    );

    await auditService.logAction({
      userId: adminId,
      action: `ADMIN_${actionName}`,
      oldValue: { is_active: Boolean(user.is_active) },
      newValue: { is_active: Boolean(newStatus), target_email: user.email },
      ipAddress
    });

    return res.json({
      success: true,
      message: `Compte ${newStatus ? 'activé' : 'désactivé'} avec succès.`,
      is_active: Boolean(newStatus)
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', async (req, res) => {
  const adminId = req.user.id;
  const targetId = parseInt(req.params.id, 10);
  const ipAddress = req.ip || '127.0.0.1';

  try {
    const { new_password } = req.body;
    const targetPassword = new_password && new_password.trim().length >= 6 
      ? new_password.trim() 
      : 'Password123!';

    const userRes = await query('SELECT email, full_name FROM users WHERE id = ?', [targetId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    const passwordHash = await bcrypt.hash(targetPassword, 10);

    await query(
      `UPDATE users 
       SET password_hash = ?, 
           failed_login_attempts = 0, 
           locked_until = NULL, 
           reset_token = NULL, 
           reset_token_expires_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [passwordHash, targetId]
    );

    // Invalidate user sessions
    await query('DELETE FROM refresh_tokens WHERE user_id = ?', [targetId]);

    await query(
      `INSERT INTO admin_actions (admin_id, target_user_id, action, details, ip_address, timestamp)
       VALUES (?, ?, 'PASSWORD_RESET_BY_ADMIN', ?, ?, CURRENT_TIMESTAMP)`,
      [adminId, targetId, JSON.stringify({ email: userRes.rows[0].email }), ipAddress]
    );

    await auditService.logAction({
      userId: adminId,
      action: 'ADMIN_PASSWORD_RESET',
      oldValue: null,
      newValue: { target_id: targetId, target_email: userRes.rows[0].email },
      ipAddress
    });

    return res.json({
      success: true,
      message: `Mot de passe réinitialisé avec succès à : ${targetPassword}`,
      temporary_password: targetPassword
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/users/:id (Suppression logique)
router.delete('/users/:id', async (req, res) => {
  const adminId = req.user.id;
  const targetId = parseInt(req.params.id, 10);
  const ipAddress = req.ip || '127.0.0.1';

  try {
    if (adminId === targetId) {
      return res.status(400).json({ success: false, error: 'Vous ne pouvez pas supprimer votre propre compte administrateur.' });
    }

    const userRes = await query('SELECT email, full_name FROM users WHERE id = ?', [targetId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    // Logical delete: disable account and revoke sessions
    await query('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [targetId]);
    await query('DELETE FROM refresh_tokens WHERE user_id = ?', [targetId]);

    await query(
      `INSERT INTO admin_actions (admin_id, target_user_id, action, details, ip_address, timestamp)
       VALUES (?, ?, 'USER_SOFT_DELETED', ?, ?, CURRENT_TIMESTAMP)`,
      [adminId, targetId, JSON.stringify({ email: userRes.rows[0].email }), ipAddress]
    );

    await auditService.logAction({
      userId: adminId,
      action: 'ADMIN_USER_SOFT_DELETED',
      oldValue: { is_active: true },
      newValue: { is_active: false, target_email: userRes.rows[0].email },
      ipAddress
    });

    return res.json({
      success: true,
      message: 'Compte utilisateur désactivé et archivé (suppression logique conforme RGPD/SOX).'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { userId, action, startDate, endDate, limit, offset } = req.query;
    const data = await auditService.getAllLogs({
      userId,
      action,
      startDate,
      endDate,
      limit: limit || 100,
      offset: offset || 0
    });
    return res.json({ success: true, ...data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/audit-logs/export/csv
router.get('/audit-logs/export/csv', async (req, res) => {
  try {
    const data = await auditService.getAllLogs({ limit: 1000, offset: 0 });
    const logs = data.logs;

    let csv = 'ID;Date Heure;Action;Utilisateur;Role;Email;Dossier ID;Adresse IP;Agent Utilisateur;Details\n';

    for (const log of logs) {
      const details = log.new_value ? (typeof log.new_value === 'object' ? JSON.stringify(log.new_value) : log.new_value) : '';
      const cleanDetails = details.replace(/;/g, ',').replace(/\n/g, ' ');
      csv += `${log.id};${new Date(log.timestamp).toISOString()};${log.action};${log.full_name || 'Système/IA'};${log.role || 'N/A'};${log.email || 'N/A'};${log.request_id || 'N/A'};${log.ip_address || 'N/A'};${log.user_agent || 'N/A'};"${cleanDetails}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tui_masterdata_audit_trail.csv"');
    return res.send('\uFEFF' + csv); // Include BOM for Excel
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    // 1. Users stats
    const usersCountRes = await query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN role = 'VENDOR' THEN 1 ELSE 0 END) as vendor_users,
        SUM(CASE WHEN role = 'REQUESTER' THEN 1 ELSE 0 END) as requester_users,
        SUM(CASE WHEN role = 'MASTER_DATA_AGENT' THEN 1 ELSE 0 END) as agent_users,
        SUM(CASE WHEN role = 'MANAGER_APPROVAL' THEN 1 ELSE 0 END) as manager_users,
        SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as admin_users
      FROM users
    `);

    // 2. Requests stats by status
    const reqStatusRes = await query(`
      SELECT status, COUNT(*) as count 
      FROM vendor_requests 
      GROUP BY status
    `);

    // 3. Requests stats by scope
    const reqScopeRes = await query(`
      SELECT geographic_scope, COUNT(*) as count 
      FROM vendor_requests 
      GROUP BY geographic_scope
    `);

    // 4. Fraud alerts count and risk distribution
    const riskStatsRes = await query(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN fraud_alert = 1 THEN 1 ELSE 0 END) as total_fraud_alerts,
        SUM(CASE WHEN risk_tier = 'LOW' THEN 1 ELSE 0 END) as low_risk,
        SUM(CASE WHEN risk_tier = 'MEDIUM' THEN 1 ELSE 0 END) as medium_risk,
        SUM(CASE WHEN risk_tier = 'HIGH' THEN 1 ELSE 0 END) as high_risk,
        SUM(CASE WHEN risk_tier = 'CRITICAL' THEN 1 ELSE 0 END) as critical_risk,
        AVG(risk_score) as avg_risk_score
      FROM vendor_requests
    `);

    // 5. Total vendors in catalog and annual spend
    const vendorStatsRes = await query(`
      SELECT 
        COUNT(*) as total_vendors,
        SUM(annual_spend) as total_annual_spend,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_vendors
      FROM vendors
    `);

    return res.json({
      success: true,
      users: usersCountRes.rows[0] || {},
      requests_by_status: reqStatusRes.rows,
      requests_by_scope: reqScopeRes.rows,
      risk_overview: riskStatsRes.rows[0] || {},
      vendor_overview: vendorStatsRes.rows[0] || {}
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
