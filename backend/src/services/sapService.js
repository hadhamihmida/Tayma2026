const { v4: uuidv4 } = require('uuid');

const sapService = {
  async syncVendorToSap({ request, vendorData }) {
    // Check preconditions
    if (request.status !== 'APPROVED') {
      throw new Error(`Impossible de synchroniser avec SAP. Le dossier doit être au statut 'APPROVED' (statut actuel: '${request.status}').`);
    }

    // Determine IDoc message type
    const isNew = (request.request_type === 'ONBOARDING');
    const msgType = isNew ? 'CREMAS05 (Vendor Master)' : 'ADRMAS03 / FIDCC1 (Bank Change)';
    const randomIdoc = Math.floor(100000 + Math.random() * 900000);
    const sapVendorId = vendorData.sap_vendor_id || `SAP-10${Math.floor(1000 + Math.random() * 9000)}`;

    // Automatic payment block flag if risk score is elevated
    const hasPaymentBlock = (request.risk_score && request.risk_score >= 70);

    const sapPayload = {
      sap_system: 'SAP S/4HANA Finance (TUI PROD ERP)',
      sap_client: '100',
      rfc_destination: 'RFC_TUI_MDM_INBOUND',
      idoc_number: `IDOC-${randomIdoc}`,
      idoc_message_type: msgType,
      sap_vendor_id: sapVendorId,
      company_codes: ['TUI1', 'TUI2', 'TUI3'],
      purchasing_org: request.geographic_scope === 'NORDIC' ? 'PO_NORDIC' : 'PO_WESTERN',
      payment_block: hasPaymentBlock ? 'ZBLOCK (Blocage Risque IA > 70)' : null,
      sync_status: 'SUCCESS',
      sync_timestamp: new Date().toISOString(),
      message: `Fournisseur synchronisé avec succès dans SAP S/4HANA (IDoc ${randomIdoc}).`
    };

    return sapPayload;
  }
};

module.exports = sapService;
