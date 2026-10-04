const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const aiService = require('../services/aiService');

// POST /api/rag/query (Assistant conversationnel RAG sur les règles TUI)
router.post('/query', authenticateToken, async (req, res) => {
  try {
    const { query, context_vendor_id, context_request_id } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Question requise' });
    }

    const ragResult = await aiService.queryRag({
      query,
      context_vendor_id,
      context_request_id
    });

    return res.json({ success: true, ...ragResult });
  } catch (err) {
    console.error('[RAG Route] Erreur réponse RAG :', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
