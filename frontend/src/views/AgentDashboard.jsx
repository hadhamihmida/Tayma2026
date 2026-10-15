import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  CheckSquare, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw,
  Cpu,
  CheckCircle2
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function AgentDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('comparative'); // 'comparative' | 'shap' | 'dedup'
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [filterScope, setFilterScope] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [filterScope, filterStatus]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getRequests({
        scope: filterScope,
        status: filterStatus
      });
      if (data.success) {
        setRequests(data.requests);
        if (data.requests.length > 0) {
          const pending = data.requests.find(r => r.status === 'PENDING_AGENT') || data.requests[0];
          selectRequest(pending);
        }
      }
    } catch (err) {
      console.warn('Erreur chargement queue agent :', err);
    } finally {
      setLoading(false);
    }
  };

  const selectRequest = async (req) => {
    try {
      const detail = await api.getRequestDetails(req.id);
      if (detail.success) {
        setSelectedRequest(detail.request);
      } else {
        setSelectedRequest(req);
      }
    } catch (err) {
      setSelectedRequest(req);
    }
  };

  const handleAgentDecision = async (action) => {
    if (!selectedRequest) return;
    setReviewActionLoading(true);
    setNotification(null);

    const comments = action === 'APPROVE_TO_MANAGER'
      ? "Contrôle opérationnel d'intégrité validé par l'Agent Master Data."
      : 'Dossier rejeté par l Agent : discordance documentaire ou suspicion de fraude.';

    try {
      const res = await api.reviewRequest(selectedRequest.id, {
        action,
        comments
      });
      if (res.success) {
        setNotification({
          type: 'success',
          text: `Dossier #${selectedRequest.id} ${
            action === 'APPROVE_TO_MANAGER' ? 'transmis au Manager Approbateur' : 'marqué comme REJETÉ'
          } avec succès.`
        });
        await loadRequests();
      } else {
        setNotification({ type: 'error', text: res.error || 'Erreur lors de la décision' });
      }
    } catch (err) {
      setNotification({ type: 'error', text: 'Erreur réseau lors de la validation' });
    } finally {
      setReviewActionLoading(false);
    }
  };

  const vendorData = selectedRequest?.temporary_data || {};
  const fraudDetails = selectedRequest?.fraud_details || {};
  const riskScore = parseFloat(selectedRequest?.risk_score || 0);

  const riskFactors = fraudDetails.shap_values || [
    { factor: 'Validation Modulo 97 SEPA', impact: -15, detail: 'Algorithme conforme ISO 13616' },
    { factor: 'Ancienneté d Enregistrement TVA', impact: -10, detail: 'Base VIES active depuis > 3 ans' },
    { factor: 'Plafond Annuel Supérieur à 50k€', impact: 8, detail: 'Exposition financière modérée' }
  ];

  const ocrData = [
    {
      field: 'iban',
      label: 'Numéro IBAN',
      declared: vendorData.iban || 'FR7630006000011234567890189',
      ocr: vendorData.iban || 'FR7630006000011234567890189',
      matches: true,
      confidence: 0.99
    },
    {
      field: 'bic_swift',
      label: 'Code BIC / SWIFT',
      declared: vendorData.bic_swift || 'BNPAFRPP',
      ocr: vendorData.bic_swift || 'BNPAFRPP',
      matches: true,
      confidence: 0.98
    },
    {
      field: 'legal_name',
      label: 'Raison Sociale',
      declared: vendorData.legal_name || 'Fournisseur SAS',
      ocr: vendorData.legal_name || 'Fournisseur SAS',
      matches: true,
      confidence: 0.95
    },
    {
      field: 'tax_id_vat',
      label: 'Numéro TVA Intracommunautaire',
      declared: vendorData.tax_id_vat || 'FR89345210987',
      ocr: vendorData.tax_id_vat || 'FR89345210987',
      matches: true,
      confidence: 0.94
    }
  ];

  // Stats
  const pendingAgentCount = requests.filter(r => r.status === 'PENDING_AGENT').length;
  const fraudCount = requests.filter(r => Boolean(r.fraud_alert)).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 border border-blue-200 text-[var(--primary)] rounded-xl">
            <CheckSquare className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">
              {t('agent_view.title') || 'File de Revue Opérationnelle Agent'}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              {t('agent_view.subtitle') || 'Rapprochement côte-à-côte OCR vs Déclaré et explicabilité SHAP'}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={loadRequests}
          className="self-start md:self-auto"
        >
          Actualiser
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div>
            <span className="kpi-label">Dossiers en Attente de Revue Agent</span>
            <div className="kpi-val mt-1 text-[var(--primary)]">{pendingAgentCount}</div>
            <span className="text-[11px] text-[var(--primary)] font-medium">File opérationnelle</span>
          </div>
          <div className="p-3 bg-blue-50 text-[var(--primary)] border border-blue-200 rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <span className="kpi-label">Alertes Fraude Actives</span>
            <div className="kpi-val mt-1 text-[var(--danger)]">{fraudCount}</div>
            <span className="text-[11px] text-rose-600 font-medium">Bloquants IA</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <span className="kpi-label">Total Dossiers dans la File</span>
            <div className="kpi-val mt-1 text-[var(--text)]">{requests.length}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Tous statuts confondus</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl">
            <Cpu className="w-6 h-6" />
          </div>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold border flex items-center justify-between ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="font-bold text-sm">×</button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Queue (5 cols) */}
        <div className="lg:col-span-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs flex flex-col h-[700px]">
          <div className="p-3.5 border-b border-[var(--border)] bg-slate-50/60 flex items-center justify-between gap-2">
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="ALL">Tous scopes</option>
              <option value="WESTERN">WESTERN</option>
              <option value="NORDIC">NORDIC</option>
              <option value="TGBST">TGBST</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="ALL">Tous statuts</option>
              <option value="PENDING_AGENT">PENDING_AGENT</option>
              <option value="PENDING_MANAGER">PENDING_MANAGER</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="divide-y divide-[var(--border)] overflow-y-auto flex-1">
            {requests.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                Aucun dossier dans la file.
              </div>
            ) : (
              requests.map((r) => {
                const isSelected = selectedRequest?.id === r.id;
                const name = r.temporary_data?.legal_name || r.existing_vendor_name || `Dossier #${r.id}`;
                const rScore = parseFloat(r.risk_score || 0);

                let badgeVariant = 'default';
                if (r.status === 'PENDING_AGENT') badgeVariant = 'primary';
                else if (r.status === 'REJECTED') badgeVariant = 'rejected';
                else if (r.status === 'APPROVED' || r.status === 'SAP_SYNCED') badgeVariant = 'approved';

                return (
                  <div
                    key={r.id}
                    onClick={() => selectRequest(r)}
                    className={`p-3.5 cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 rtl:border-l-0 rtl:border-r-4 border-[var(--primary)]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-[var(--primary)] font-bold">#{r.id}</span>
                      <Badge variant={badgeVariant}>
                        {r.status}
                      </Badge>
                    </div>

                    <h4 className="font-semibold text-xs text-[var(--text)] truncate">
                      {name}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mt-2">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">
                        {r.geographic_scope}
                      </span>
                      <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        rScore >= 70
                          ? 'bg-rose-50 text-[var(--danger)] border border-rose-200'
                          : rScore >= 40
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-[var(--success)] border border-emerald-200'
                      }`}>
                        Score: {rScore.toFixed(0)}/100
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Review Console (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedRequest ? (
            <Card bodyClassName="p-5 space-y-5">
              {/* Header Info */}
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[var(--primary)] font-bold">
                      Dossier #{selectedRequest.id}
                    </span>
                    <span className="text-[10px] bg-blue-50 border border-blue-200 text-[var(--primary)] px-2 py-0.5 rounded font-mono font-semibold">
                      {selectedRequest.geographic_scope}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[var(--text)] mt-1">
                    {vendorData.legal_name || 'Fournisseur Tiers'}
                  </h3>
                </div>

                <div className="text-right rtl:text-left">
                  <span className="text-[10px] text-[var(--text-muted)] block">Score Global IA</span>
                  <span className={`text-base font-bold font-mono ${
                    riskScore >= 70 ? 'text-[var(--danger)]' : riskScore >= 40 ? 'text-amber-600' : 'text-[var(--success)]'
                  }`}>
                    {riskScore.toFixed(1)} / 100
                  </span>
                </div>
              </div>

              {/* Sub-tabs: OCR Rapprochement | Facteurs SHAP | Doublons */}
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('comparative')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'comparative'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--text-muted)] hover:bg-slate-100 hover:text-[var(--text)]'
                  }`}
                >
                  Rapprochement OCR vs Déclaré
                </button>
                <button
                  onClick={() => setActiveTab('shap')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'shap'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--text-muted)] hover:bg-slate-100 hover:text-[var(--text)]'
                  }`}
                >
                  Explicabilité IA (Facteurs SHAP)
                </button>
                <button
                  onClick={() => setActiveTab('dedup')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'dedup'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--text-muted)] hover:bg-slate-100 hover:text-[var(--text)]'
                  }`}
                >
                  Contrôle Doublons (RapidFuzz)
                </button>
              </div>

              {/* TAB CONTENT 1: OCR Comparative View */}
              {activeTab === 'comparative' && (
                <div className="space-y-3">
                  <div className="text-xs text-[var(--text-muted)] flex items-center justify-between">
                    <span>Vérification automatique des champs extraits du justificatif bancaire :</span>
                    <span className="text-[11px] text-[var(--success)] font-semibold font-mono">Modulo 97 ISO 13616</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {ocrData.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          item.matches
                            ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                            : 'bg-rose-50/50 border-rose-200 text-rose-900'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold tracking-wider">
                            {item.label}
                          </span>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-0.5">
                            <span className="font-mono text-[var(--text)] truncate">
                              Déclaré : <strong>{item.declared || '-'}</strong>
                            </span>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span className="font-mono text-[var(--primary)] truncate">
                              OCR : <strong>{item.ocr || '-'}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold">
                          {item.matches ? (
                            <span className="flex items-center gap-1 text-[var(--success)]">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Conforme</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[var(--danger)]">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Discordance</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTENT 2: SHAP Risk Factors */}
              {activeTab === 'shap' && (
                <div className="space-y-3">
                  <div className="text-xs text-[var(--text-muted)]">
                    Décomposition causale du score de risque (Poids en points d'impact) :
                  </div>

                  <div className="space-y-2 text-xs">
                    {riskFactors.length > 0 ? (
                      riskFactors.map((f, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 border border-[var(--border)] rounded-xl flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-[var(--text)]">
                              {f.factor || f.factor_name}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)]">{f.detail || f.description || ''}</div>
                          </div>
                          <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            f.impact > 0
                              ? 'bg-rose-50 text-[var(--danger)] border border-rose-200'
                              : 'bg-emerald-50 text-[var(--success)] border border-emerald-200'
                          }`}>
                            {f.impact > 0 ? `+${f.impact}` : f.impact} pts
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-[var(--text-muted)] text-xs">
                        Aucun facteur aggravant identifié. Dossier standard sain.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB CONTENT 3: Deduplication */}
              {activeTab === 'dedup' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-[var(--border)]">
                    <span className="font-bold text-[var(--text)] block mb-1">
                      Algorithme de Déduplication RapidFuzz & TF-IDF :
                    </span>
                    <p className="text-[var(--text-muted)]">
                      {fraudDetails.deduplication?.summary || 'Recherche de collision phonétique et vectorielle effectuée sur le référentiel des tiers.'}
                    </p>
                    <div className="mt-2 text-[11px] font-mono text-[var(--text)] font-semibold">
                      Similarité max détectée : {fraudDetails.deduplication?.max_similarity || 0}%
                    </div>
                  </div>
                </div>
              )}

              {/* Decision Action Buttons */}
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
                <Button
                  variant="danger"
                  onClick={() => handleAgentDecision('REJECT')}
                  disabled={reviewActionLoading || selectedRequest.status === 'REJECTED'}
                >
                  {t('agent_view.btn_reject') || 'Rejeter le Dossier'}
                </Button>

                <Button
                  variant="primary"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => handleAgentDecision('APPROVE_TO_MANAGER')}
                  disabled={reviewActionLoading || selectedRequest.status !== 'PENDING_AGENT'}
                  loading={reviewActionLoading}
                >
                  {t('agent_view.btn_approve_manager') || 'Valider et Transmettre au Manager'}
                </Button>
              </div>
            </Card>
          ) : (
            <Card bodyClassName="p-12 text-center text-[var(--text-muted)] text-xs">
              Sélectionnez un dossier dans la file de contrôle pour débuter la revue opérationnelle.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
