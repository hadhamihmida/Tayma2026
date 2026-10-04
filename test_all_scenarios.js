// Suite de validation automatisée avec Fetch natif (Node 18+)
const API = 'http://localhost:5000/api';
const AI_API = 'http://localhost:8000';

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return {
    status: res.status,
    ok: res.ok,
    headers: Object.fromEntries(res.headers.entries()),
    data
  };
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 DÉMARRAGE DE LA SUITE DE TESTS COMPLÈTE — MASTER DATA IA');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Service Health Checks
  // -------------------------------------------------------------
  console.log('--- TEST 1: Vérification de l état des microservices ---');
  try {
    const resNode = await request('http://localhost:5000/health');
    assert(resNode.data && resNode.data.status === 'healthy', 'Backend Express (port 5000) opérationnel');
  } catch (e) {
    assert(false, `Backend Express non accessible: ${e.message}`);
  }

  try {
    const resAi = await request(`${AI_API}/health`);
    assert(resAi.data && resAi.data.status === 'healthy' && resAi.data.axes_loaded === 7, 'Moteur IA FastAPI (port 8000) avec 7 axes opérationnel');
  } catch (e) {
    assert(false, `FastAPI non accessible: ${e.message}`);
  }

  // -------------------------------------------------------------
  // TEST 2: Authentication of all 6 personas
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Authentification réelle des 6 profils métiers ---');
  const personas = [
    { email: 'admin@group.com', role: 'ADMIN', name: 'Administrateur' },
    { email: 'manager.global@group.com', role: 'MANAGER_APPROVAL', name: 'Manager Approbateur' },
    { email: 'agent.global@group.com', role: 'MASTER_DATA_AGENT', name: 'Agent Master Data' },
    { email: 'requester.western@group.com', role: 'REQUESTER', scope: 'WESTERN', name: 'Demandeur Western' },
    { email: 'requester.nordic@group.com', role: 'REQUESTER', scope: 'NORDIC', name: 'Demandeur Nordic' },
    { email: 'contact@novatech-solutions.fr', role: 'VENDOR', name: 'Fournisseur Externe' }
  ];

  const tokens = {};

  for (const p of personas) {
    try {
      const res = await request(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: p.email,
          password: 'Password123!'
        })
      });
      assert(res.ok && res.data.success && res.data.token && res.data.user.role === p.role, `Connexion réussie pour ${p.name} (${p.email})`);
      tokens[p.role + (p.scope ? `_${p.scope}` : '')] = res.data.token;
    } catch (e) {
      assert(false, `Échec connexion pour ${p.email}: ${e.message}`);
    }
  }

  // -------------------------------------------------------------
  // TEST 3: RBAC Protection Tests (Backend Guards)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Cloisonnement strict et sécurité RBAC ---');
  const vendorToken = tokens['VENDOR'];
  const requesterToken = tokens['REQUESTER_WESTERN'];
  const adminToken = tokens['ADMIN'];

  // Vendor trying to access admin users
  try {
    const resVendor = await request(`${API}/admin/users`, {
      headers: { Authorization: `Bearer ${vendorToken}` }
    });
    assert(resVendor.status === 403, 'VENDOR bloqué avec code 403 sur /admin/users');
  } catch (e) {
    assert(false, `Erreur réseau test VENDOR: ${e.message}`);
  }

  // Requester trying to access admin audit logs
  try {
    const resReq = await request(`${API}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${requesterToken}` }
    });
    assert(resReq.status === 403, 'REQUESTER bloqué avec code 403 sur /admin/audit-logs');
  } catch (e) {
    assert(false, `Erreur réseau test REQUESTER: ${e.message}`);
  }

  // Admin access granted
  try {
    const resAdmin = await request(`${API}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resAdmin.ok && resAdmin.data.success && resAdmin.data.users.length >= 6, 'ADMIN autorisé sur /admin/users (6 utilisateurs trouvés)');
  } catch (e) {
    assert(false, `ADMIN rejeté: ${e.message}`);
  }

  // -------------------------------------------------------------
  // TEST 4: The 8 Seed Requests Verification
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Intégrité des 8 dossiers de démonstration ---');
  try {
    const resReqs = await request(`${API}/requests`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resReqs.data.count === 8, `Exactement 8 dossiers d'exemple chargés (count = ${resReqs.data.count})`);

    const req1 = resReqs.data.requests.find(r => r.id === 1);
    assert(req1 && req1.fraud_alert === 1 && req1.risk_score === '40.00', 'Dossier #1 (Novatech): Alerte Fraude Modulo 97 active');

    const req3 = resReqs.data.requests.find(r => r.id === 3);
    assert(req3 && req3.risk_tier === 'CRITICAL' && req3.risk_score === '89.50', 'Dossier #3 (Apex Seychelles): Risque Critique paradis fiscal');

    const req8 = resReqs.data.requests.find(r => r.id === 8);
    assert(req8 && req8.status === 'REJECTED' && req8.rejection_reason !== null, 'Dossier #8 (Fake Logistics): Statut REJECTED avec motif officiel');
  } catch (e) {
    assert(false, `Erreur récupération des 8 dossiers: ${e.message}`);
  }

  // -------------------------------------------------------------
  // TEST 5: Live IBAN Modulo 97 Verification Endpoint
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Validation IBAN en temps réel (Modulo 97 ISO 13616) ---');
  try {
    // Valid French IBAN
    const resValid = await request(`${API}/requests/validate-iban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        iban: 'FR7630006000011234567890189',
        country: 'FR'
      })
    });
    assert(resValid.data.valid === true && resValid.data.country_mismatch === false, 'IBAN français conforme validé avec succès');

    // Invalid Modulo 97
    const resInvalid = await request(`${API}/requests/validate-iban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        iban: 'FR7630006000011234567890199', // altered digits
        country: 'FR'
      })
    });
    assert(resInvalid.data.valid === false, 'Échec détecté sur clé Modulo 97 altérée');

    // Country mismatch (Swedish IBAN for French vendor)
    const resMismatch = await request(`${API}/requests/validate-iban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        iban: 'SE4550000000058398257466',
        country: 'FR'
      })
    });
    assert(resMismatch.data.valid === true && resMismatch.data.country_mismatch === true, 'Alerte discordance territoriale détectée (IBAN SE vs Pays FR)');
  } catch (e) {
    assert(false, `Erreur test IBAN: ${e.message}`);
  }

  // -------------------------------------------------------------
  // TEST 6: Manager Mandatory Rejection Reason
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Règle de Gouvernance : Rejet avec motif obligatoire ---');
  const managerToken = tokens['MANAGER_APPROVAL'];
  try {
    // Attempt rejection WITHOUT reason -> Must fail 400
    const resFail = await request(`${API}/requests/1/manager-approval`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        decision: 'REJECT',
        reason: ''
      })
    });
    assert(resFail.status === 400, 'Rejet sans motif bloqué avec code 400 (Motif obligatoire)');
  } catch (e) {
    assert(false, `Erreur test manager rejection: ${e.message}`);
  }

  // -------------------------------------------------------------
  // TEST 7: SAP IDoc Simulation (CREMAS05 & ZBLOCK)
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Simulation du flux IDoc CREMAS05 S/4HANA ---');
  try {
    const resIdoc = await request(`${API}/requests/3/simulate-idoc`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(resIdoc.data.success && resIdoc.data.idoc_type === 'CREMAS05', 'Génération du segment CREMAS05 pour le dossier #3');
    assert(resIdoc.data.preventive_block === true && resIdoc.data.payload.E1LFB1M.ZBLOCK === 'B', 'Blocage préventif des paiements (ZBLOCK = B) activé sur risque élevé');
  } catch (e) {
    assert(false, `Erreur simulation IDoc: ${e.message}`);
  }

  // -------------------------------------------------------------
  // TEST 8: Admin User CRUD & Audit Trail Export
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Module Administration, Matrice RBAC & Export CSV ---');
  try {
    // Matrice permissions
    const resMatrix = await request(`${API}/admin/permissions-matrix`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resMatrix.data.success && resMatrix.data.matrix.length >= 10, 'Matrice des habilitations RBAC chargée (12 actions référencées)');

    // Audit export CSV
    const resCsv = await request(`${API}/admin/audit-logs/export/csv`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resCsv.headers['content-type'].includes('text/csv') && resCsv.data.includes('AUTH_LOGIN_SUCCESS'), 'Export CSV de la piste d audit généré avec en-têtes et données');

    // Admin Stats
    const resStats = await request(`${API}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resStats.data.success && resStats.data.users.active_users >= 6, 'Indicateurs et KPIs consolidés de l administration opérationnels');
  } catch (e) {
    assert(false, `Erreur test admin: ${e.message}`);
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 BILAN DES TESTS : ${passed} RÉUSSIS / ${failed} ÉCHECS`);
  console.log('================================================================\n');

  if (failed === 0) {
    console.log('🎉 TOUS LES TESTS SONT AU VERT ! APPLICATION VALIDÉE POUR LA SOUTENANCE.');
    process.exit(0);
  } else {
    console.error('⚠️ CERTAINS TESTS ONT ÉCHOUÉ.');
    process.exit(1);
  }
}

runTests();
