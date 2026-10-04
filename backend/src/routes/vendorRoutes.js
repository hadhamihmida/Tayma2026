const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');

// GET /api/vendors (Catalogue des tiers référents avec filtres)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { scope, segment, search, status } = req.query;
    let sql = 'SELECT * FROM vendors WHERE 1=1';
    const params = [];

    // Apply geographic scope restriction if user is not GLOBAL / ADMIN
    if (req.user.role !== 'ADMIN' && req.user.geographic_scope !== 'GLOBAL') {
      params.push(req.user.geographic_scope);
      sql += ' AND geographic_scope = ?';
    } else if (scope && scope !== 'ALL') {
      params.push(scope);
      sql += ' AND geographic_scope = ?';
    }

    if (segment && segment !== 'ALL') {
      params.push(segment);
      sql += ' AND segment = ?';
    }

    if (status && status !== 'ALL') {
      params.push(status);
      sql += ' AND status = ?';
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      params.push(`%${search.toLowerCase()}%`);
      params.push(`%${search.toLowerCase()}%`);
      sql += ' AND (LOWER(legal_name) LIKE ? OR LOWER(tax_id_vat) LIKE ? OR LOWER(COALESCE(sap_vendor_id, "")) LIKE ?)';
    }

    sql += ' ORDER BY id ASC';

    const result = await query(sql, params);
    return res.json({ success: true, count: result.rows.length, vendors: result.rows });
  } catch (err) {
    console.error('[Vendor Route] Erreur recherche :', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/vendors/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM vendors WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Fournisseur introuvable' });
    }
    return res.json({ success: true, vendor: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
