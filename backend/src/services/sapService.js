const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../config');
const { query } = require('../config/db');
const auditService = require('./auditService');

/**
 * Interface d'export ERP / SAP (Pattern Strategy)
 */
class ErpExporter {
  async exportPayload(payload) {
    throw new Error('exportPayload() doit être implémenté par la classe dérivée.');
  }
}

/**
 * Implémentation 1 : FileExporter
 * Écrit un fichier d'échange horodaté structuré au format SAP IDoc dans le répertoire /exports
 */
class FileExporter extends ErpExporter {
  constructor(exportsDir = config.EXPORTS_DIR) {
    super();
    this.exportsDir = exportsDir;
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
  }

  async exportPayload(payload) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `IDOC_${payload.idoc_message_type}_${payload.sap_vendor_id}_${timestamp}.json`;
    const fullPath = path.join(this.exportsDir, fileName);

    fs.writeFileSync(fullPath, JSON.stringify(payload, null, 2), 'utf8');

    return {
      success: true,
      http_code: 200,
      mode: 'FILE_EXCHANGE',
      file_path: fullPath,
      file_name: fileName,
      response: {
        ack: 'ACK_FILE_WRITTEN',
        destination: fullPath,
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Implémentation 2 : SapHttpExporter
 * Effectue une requête HTTP POST certifiée vers SAP_API_URL et vérifie l'accusé de réception (ACK)
 */
class SapHttpExporter extends ErpExporter {
  constructor(apiUrl = config.SAP_API_URL) {
    super();
    this.apiUrl = apiUrl;
  }

  async exportPayload(payload) {
    try {
      const response = await axios.post(this.apiUrl, payload, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'X-Sender-System': 'TUI_MASTERDATA_PROD',
          'X-IDoc-Type': payload.idoc_message_type
        }
      });

      return {
        success: response.status >= 200 && response.status < 300,
        http_code: response.status,
        mode: 'HTTP_POST',
        response: response.data || { ack: 'ACK_RECEIVED', status: 'PROCESSED' }
      };
    } catch (err) {
      return {
        success: false,
        http_code: err.response?.status || 502,
        mode: 'HTTP_POST',
        error: err.message,
        response: err.response?.data || { ack: 'NACK_TRANSMISSION_ERROR', message: err.message }
      };
    }
  }
}

function getExporter() {
  const exporterType = (config.SAP_EXPORTER_TYPE || 'file').toLowerCase();
  if (exporterType === 'http') {
    return new SapHttpExporter();
  }
  return new FileExporter();
}

const sapService = {
  async syncVendorToSap({ request, vendorData, actorId = null, ip = '127.0.0.1', userAgent = 'System' }) {
    if (request.status !== 'APPROVED') {
      throw new Error(`Impossible de synchroniser avec SAP. Le dossier doit être au statut 'APPROVED' (statut actuel: '${request.status}').`);
    }

    const isNew = (request.type === 'ONBOARDING' || request.request_type === 'ONBOARDING');
    const msgType = isNew ? 'CREMAS05' : 'ADRMAS03';
    const sapVendorId = vendorData.sap_vendor_id || vendorData.vendor_code || `SAP-${Date.now().toString().slice(-6)}`;
    const hasPaymentBlock = (request.risk_score && parseFloat(request.risk_score) >= 0.70);

    const certifiedPayload = {
      header: {
        sap_system: 'SAP S/4HANA Finance (TUI Group Production)',
        client: '100',
        rfc_destination: 'RFC_TUI_MDM_INBOUND',
        message_type: msgType,
        created_at: new Date().toISOString()
      },
      idoc_message_type: msgType,
      sap_vendor_id: sapVendorId,
      company_name: vendorData.company_name || vendorData.legal_name,
      tax_id_vat: vendorData.vat_number || vendorData.tax_id_vat,
      country: vendorData.country,
      iban: vendorData.iban,
      bic_swift: vendorData.bic_swift,
      project_id: request.project_id || null,
      payment_block: hasPaymentBlock ? 'ZBLOCK_IA_HIGH_RISK' : null,
      certified_by_user_id: actorId,
      request_id: request.id
    };

    const exporter = getExporter();
    const exportResult = await exporter.exportPayload(certifiedPayload);

    // Get next attempt number from sap_sync_logs if table exists
    let nextAttempt = 1;
    try {
      const countRes = await query('SELECT COUNT(*) as count FROM sap_sync_logs WHERE vendor_request_id = ?', [request.id]);
      nextAttempt = (countRes.rows[0]?.count || 0) + 1;

      await query(
        `INSERT INTO sap_sync_logs (vendor_request_id, attempt, status, http_code, response, created_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          request.id,
          nextAttempt,
          exportResult.success ? 'SUCCESS' : 'FAILURE',
          exportResult.http_code,
          JSON.stringify(exportResult.response || exportResult)
        ]
      );
    } catch (e) {
      console.warn('[SAP Service] Impossible d écrire dans sap_sync_logs (table peut-être non encore migrée) :', e.message);
    }

    return {
      success: exportResult.success,
      exporter_mode: exportResult.mode,
      http_code: exportResult.http_code,
      sap_vendor_id: sapVendorId,
      idoc_message_type: msgType,
      payload: certifiedPayload,
      result: exportResult
    };
  }
};

module.exports = sapService;
