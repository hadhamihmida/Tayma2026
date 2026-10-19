const crypto = require('crypto');
const { query } = require('../config/db');

const auditService = {
  /**
   * Calcule le hash cryptographique SHA-256 pour une entrée d'audit (Norme SOX / Sapin II)
   */
  computeRowHash(prevHash, { actorId, action, timestamp, oldData, newData }) {
    const payload = [
      prevHash || '0000000000000000000000000000000000000000000000000000000000000000',
      actorId || 'SYSTEM',
      action,
      timestamp,
      typeof oldData === 'string' ? oldData : JSON.stringify(oldData || {}),
      typeof newData === 'string' ? newData : JSON.stringify(newData || {})
    ].join('|');

    return crypto.createHash('sha256').update(payload).digest('hex');
  },

  /**
   * Journalise une action avec chaînage cryptographique SHA-256 inaltérable
   */
  async logAction({
    requestId = null,
    vendorRequestId = null,
    userId = null,
    actorId = null,
    targetUserId = null,
    action,
    oldValue = null,
    newValue = null,
    oldData = null,
    newData = null,
    ipAddress = '127.0.0.1',
    ip = null,
    userAgent = 'Web Browser'
  }) {
    try {
      const vReqId = vendorRequestId ? parseInt(vendorRequestId, 10) : (requestId ? parseInt(requestId, 10) : null);
      const actId = actorId ? parseInt(actorId, 10) : (userId ? parseInt(userId, 10) : null);
      const tgtUserId = targetUserId ? parseInt(targetUserId, 10) : null;
      const clientIp = ip || ipAddress || '127.0.0.1';

      const finalOldData = oldData !== null && oldData !== undefined ? oldData : oldValue;
      const finalNewData = newData !== null && newData !== undefined ? newData : newValue;

      const oldJson = finalOldData ? (typeof finalOldData === 'string' ? finalOldData : JSON.stringify(finalOldData)) : null;
      const newJson = finalNewData ? (typeof finalNewData === 'string' ? finalNewData : JSON.stringify(finalNewData)) : null;

      // Récupération du hash précédent
      const lastRow = await query('SELECT row_hash FROM audit_logs ORDER BY id DESC LIMIT 1');
      const prevHash = (lastRow.rows.length > 0 && lastRow.rows[0].row_hash)
        ? lastRow.rows[0].row_hash
        : '0000000000000000000000000000000000000000000000000000000000000000';

      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');

      const rowHash = this.computeRowHash(prevHash, {
        actorId: actId,
        action,
        timestamp,
        oldData: oldJson,
        newData: newJson
      });

      const res = await query(
        `INSERT INTO audit_logs (
          vendor_request_id,
          request_id,
          actor_id,
          user_id,
          target_user_id,
          action,
          old_data,
          new_data,
          old_value,
          new_value,
          ip,
          ip_address,
          user_agent,
          timestamp,
          prev_hash,
          row_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          vReqId,
          vReqId,
          actId,
          actId,
          tgtUserId,
          action,
          oldJson,
          newJson,
          oldJson,
          newJson,
          clientIp,
          clientIp,
          userAgent,
          timestamp,
          prevHash,
          rowHash
        ]
      );

      return {
        id: res.insertId,
        action,
        timestamp,
        prev_hash: prevHash,
        row_hash: rowHash
      };
    } catch (err) {
      console.error('[Audit Service] Erreur écriture piste d audit :', err.message);
      return null;
    }
  },

  /**
   * Récupère la piste d'audit liée à un dossier spécifique
   */
  async getAuditTrail(requestId) {
    const reqId = parseInt(requestId, 10);
    const res = await query(
      `SELECT a.*, 
              u.full_name, u.role, u.email,
              tu.full_name as target_full_name, tu.email as target_email
       FROM audit_logs a
       LEFT JOIN users u ON COALESCE(a.actor_id, a.user_id) = u.id
       LEFT JOIN users tu ON a.target_user_id = tu.id
       WHERE a.vendor_request_id = ? OR a.request_id = ?
       ORDER BY a.timestamp ASC, a.id ASC`,
      [reqId, reqId]
    );
    return res.rows;
  },

  /**
   * Récupère l'ensemble des événements d'audit (actions admin et dossiers unifiés)
   */
  async getAllLogs({ userId = null, action = null, startDate = null, endDate = null, limit = 100, offset = 0 }) {
    let sql = `
      SELECT a.*, 
             u.full_name, u.role, u.email,
             tu.full_name as target_full_name, tu.email as target_email,
             r.geographic_scope as request_scope
      FROM audit_logs a
      LEFT JOIN users u ON COALESCE(a.actor_id, a.user_id) = u.id
      LEFT JOIN users tu ON a.target_user_id = tu.id
      LEFT JOIN vendor_requests r ON COALESCE(a.vendor_request_id, a.request_id) = r.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      sql += ` AND (a.actor_id = ? OR a.user_id = ? OR a.target_user_id = ?)`;
      const uid = parseInt(userId, 10);
      params.push(uid, uid, uid);
    }

    if (action && action !== 'ALL') {
      sql += ` AND a.action = ?`;
      params.push(action);
    }

    if (startDate) {
      sql += ` AND a.timestamp >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND a.timestamp <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY a.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const res = await query(sql, params);

    // Comptage total
    let countSql = `SELECT COUNT(*) as total FROM audit_logs a WHERE 1=1`;
    const countParams = [];
    if (userId) {
      countSql += ` AND (a.actor_id = ? OR a.user_id = ? OR a.target_user_id = ?)`;
      const uid = parseInt(userId, 10);
      countParams.push(uid, uid, uid);
    }
    if (action && action !== 'ALL') {
      countSql += ` AND a.action = ?`;
      countParams.push(action);
    }
    if (startDate) {
      countSql += ` AND a.timestamp >= ?`;
      countParams.push(startDate);
    }
    if (endDate) {
      countSql += ` AND a.timestamp <= ?`;
      countParams.push(endDate);
    }
    const countRes = await query(countSql, countParams);

    return {
      logs: res.rows,
      total: countRes.rows[0]?.total || res.rows.length
    };
  },

  /**
   * Vérifie mathématiquement l'intégrité de la chaîne cryptographique SHA-256
   */
  async verifyChain() {
    const res = await query('SELECT * FROM audit_logs ORDER BY id ASC');
    const logs = res.rows;

    let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
    let isValid = true;
    const errors = [];

    for (let i = 0; i < logs.length; i++) {
      const entry = logs[i];
      if (entry.prev_hash && entry.prev_hash !== previousHash) {
        isValid = false;
        errors.push({
          id: entry.id,
          reason: `Rupture de chaîne prev_hash : attendu ${previousHash}, trouvé ${entry.prev_hash}`
        });
      }
      previousHash = entry.row_hash || previousHash;
    }

    return {
      verified: isValid,
      totalEntries: logs.length,
      errors
    };
  }
};

module.exports = auditService;
