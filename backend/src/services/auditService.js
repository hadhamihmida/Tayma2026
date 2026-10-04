const { query } = require('../config/db');

const auditService = {
  async logAction({ requestId = null, userId = null, action, oldValue = null, newValue = null, ipAddress = '127.0.0.1', userAgent = 'Web Browser' }) {
    try {
      const res = await query(
        `INSERT INTO audit_logs (request_id, user_id, action, old_value, new_value, ip_address, user_agent, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          requestId ? parseInt(requestId, 10) : null,
          userId ? parseInt(userId, 10) : null,
          action,
          oldValue ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : null,
          newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null,
          ipAddress,
          userAgent
        ]
      );
      return { id: res.insertId, action, timestamp: new Date().toISOString() };
    } catch (err) {
      console.error('[Audit Service] Erreur écriture piste d audit :', err.message);
      // We don't want audit failure to break the whole flow, but log it
      return null;
    }
  },

  async getAuditTrail(requestId) {
    const res = await query(
      `SELECT a.*, u.full_name, u.role, u.email
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.request_id = ?
       ORDER BY a.timestamp ASC`,
      [parseInt(requestId, 10)]
    );
    return res.rows;
  },

  async getAllLogs({ userId = null, action = null, startDate = null, endDate = null, limit = 100, offset = 0 }) {
    let sql = `
      SELECT a.*, u.full_name, u.role, u.email, r.geographic_scope as request_scope
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN vendor_requests r ON a.request_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      sql += ` AND a.user_id = ?`;
      params.push(parseInt(userId, 10));
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

    sql += ` ORDER BY a.timestamp DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const res = await query(sql, params);
    
    // Also count total
    let countSql = `SELECT COUNT(*) as total FROM audit_logs a WHERE 1=1`;
    const countParams = [];
    if (userId) {
      countSql += ` AND a.user_id = ?`;
      countParams.push(parseInt(userId, 10));
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
  }
};

module.exports = auditService;
