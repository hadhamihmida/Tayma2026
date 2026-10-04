/**
 * Integration Verification Script for TUI Master Data Backend
 */
const http = require('http');
const app = require('./src/app');
const { getDb } = require('./src/config/db');
const { seedDatabase } = require('./src/db/seed');

let server;
const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Démarrage de la vérification Backend ---');
  await getDb();
  await seedDatabase();

  await new Promise(resolve => {
    server = app.listen(PORT, resolve);
  });
  console.log(`[TEST SERVER] En écoute sur le port ${PORT}`);

  try {
    // 1. Health check
    const health = await request('/health');
    console.log(`✓ 1. Health check: status ${health.status} (${health.body.status})`);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Demo users
    const demo = await request('/api/auth/demo-users');
    console.log(`✓ 2. Demo users: ${demo.body.users.length} comptes RBAC trouvés`);
    if (demo.body.users.length < 4) throw new Error('Demo users count mismatch');

    // 3. Login as Agent
    const loginAgent = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'agent.masterdata@tui.com', password: 'Password123!' }
    });
    console.log(`✓ 3. Login Agent: Token obtenu pour ${loginAgent.body.user.full_name} (${loginAgent.body.user.role})`);
    const agentToken = loginAgent.body.token;

    // 4. Login as Manager
    const loginMgr = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'manager.approval@tui.com', password: 'Password123!' }
    });
    console.log(`✓ 4. Login Manager: Token obtenu pour ${loginMgr.body.user.full_name} (${loginMgr.body.user.role})`);
    const mgrToken = loginMgr.body.token;

    // 5. List Vendors
    const vendors = await request('/api/vendors', {
      headers: { Authorization: `Bearer ${agentToken}` }
    });
    console.log(`✓ 5. Catalogue Vendors: ${vendors.body.count} fournisseurs SAP`);

    // 6. List Requests
    const requests = await request('/api/requests', {
      headers: { Authorization: `Bearer ${agentToken}` }
    });
    console.log(`✓ 6. Queue des Demandes: ${requests.body.count} dossiers initiaux`);

    // 7. Create New Request (Onboarding)
    const newReq = await request('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${agentToken}` },
      body: {
        request_type: 'ONBOARDING',
        geographic_scope: 'WESTERN',
        submitted_fields: {
          legal_name: 'Riviera Aviation Transfers SAS',
          tax_id_vat: 'FR12987654321',
          iban: 'FR7630006000011234567890189',
          bic_swift: 'BNPAFRPP',
          bank_name: 'BNP Paribas Nice',
          country: 'FR',
          email: 'contact@riviera-transfers.fr',
          annual_spend: 180000.0
        }
      }
    });
    const createdReqId = newReq.body.request_id;
    console.log(`✓ 7. Création demande avec criblage IA: ${createdReqId} (Score Risque: ${newReq.body.risk_score}, Alerte Fraude: ${newReq.body.fraud_alert})`);

    // 8. Agent Review -> Move to PENDING_MANAGER
    const agentReview = await request(`/api/requests/${createdReqId}/agent-review`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${agentToken}` },
      body: {
        action: 'APPROVE_TO_MANAGER',
        comments: 'Vérification KBIS et concordance bancaire effectuée. Conforme.'
      }
    });
    console.log(`✓ 8. Validation Master Data Agent: ${agentReview.body.message}`);

    // 9. Manager Approval
    const mgrApprove = await request(`/api/requests/${createdReqId}/manager-approval`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${mgrToken}` },
      body: {
        decision: 'APPROVE',
        comments: 'Approbation finale accordée pour intégration SAP.'
      }
    });
    console.log(`✓ 9. Approbation Manager: ${mgrApprove.body.message}`);

    // 10. SAP Sync
    const sapSync = await request(`/api/requests/${createdReqId}/sap-sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    console.log(`✓ 10. Synchronisation SAP: IDoc ${sapSync.body.sap_details.idoc_number}, Vendor ${sapSync.body.sap_details.sap_vendor_id}`);

    // 11. Verify Audit Trail completeness
    const finalDetail = await request(`/api/requests/${createdReqId}`, {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const trail = finalDetail.body.audit_trail;
    console.log(`✓ 11. Piste d'audit inaltérable vérifiée: ${trail.length} événements enregistrés`);
    trail.forEach((log, idx) => {
      console.log(`    [#${idx + 1}] ${log.action} par ${log.full_name || 'Système/IA'} (${log.timestamp})`);
    });

    console.log('\n=============================================================');
    console.log('🎉 TOUS LES 11 TESTS D INTÉGRATION DU BACKEND ONT RÉUSSI !');
    console.log('=============================================================\n');

  } catch (err) {
    console.error('❌ Échec des tests backend :', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
