const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const config = require('../config');
const { query } = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');
const aiService = require('../services/aiService');

// Ensure upload dir exists
if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `doc-${Date.now()}-${uuidv4().substring(0, 8)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

// POST /api/documents/upload
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { request_id, doc_type = 'RIB', simulated_text } = req.body;
    const file = req.file;

    if (!file && !simulated_text) {
      return res.status(400).json({ success: false, error: 'Fichier justificatif requis (RIB ou Kbis)' });
    }

    const fileName = file ? file.originalname : 'justificatif_depose.pdf';
    const filePath = file ? file.path : path.join(config.UPLOAD_DIR, `${Date.now()}_simulated.pdf`);
    const fileSize = file ? file.size : 124500;
    const mimeType = file ? file.mimetype : 'application/pdf';

    // Call Axe 1 OCR/NLP extraction
    const ocrResult = await aiService.extractOcr({
      document_text: simulated_text || null,
      document_type: doc_type,
      filename: fileName
    });

    let docId = Date.now();
    if (request_id) {
      const insertRes = await query(
        `INSERT INTO documents (request_id, doc_type, file_name, file_path, file_size, mime_type, ocr_extracted_data, ocr_confidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parseInt(request_id, 10),
          doc_type,
          fileName,
          filePath,
          fileSize,
          mimeType,
          JSON.stringify(ocrResult.extracted_fields || {}),
          JSON.stringify({ global_confidence: ocrResult.global_confidence || 0.95 })
        ]
      );
      docId = insertRes.insertId;
    }

    return res.status(201).json({
      success: true,
      message: 'Document téléversé et analysé par l OCR avec succès.',
      document: {
        id: docId,
        request_id,
        doc_type,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        ocr_result: ocrResult
      }
    });
  } catch (err) {
    console.error('[Document Route] Erreur upload :', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/documents/:id (Aperçu)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const docRes = await query('SELECT * FROM documents WHERE id = ?', [parseInt(req.params.id, 10)]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Document introuvable' });
    }
    return res.json({ success: true, document: docRes.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
