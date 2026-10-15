import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatDate, formatCurrency } from '../i18n';
import { 
  ShieldCheck, 
  AlertOctagon, 
  Check, 
  X, 
  History, 
  RefreshCw,
  FileCode,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  ResponsiveContainer
} from 'recharts';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function ManagerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState(null);

  // Mandatory Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // IDoc Simulation Modal State
  const [showIdocModal, setShowIdocModal] = useState(false);
  const [idocData, setIdocData] = useState(null);
  const [idocLoading, setIdocLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getRequests();
      if (data.success) {
        setRequests(data.requests);
        if (data.requests.length > 0) {
          const priority = data.requests.find(r => r.status === 'PENDING_MANAGER') || data.requests[0];
          selectRequest(priority);
        }
      }
    } catch (err) {
      console.warn('Erreur chargement demandes manager :', err);
    } finally {
      setLoading(false);
    }
  };

  const selectRequest = async (req) => {
    try {
      const detail = await api.getRequestDetails(req.id);
      if (detail.success) {
        setSelectedRequest(detail.request);
        setAuditTrail(detail.audit_trail || []);
      } else {
        setSelectedRequest(req);
      }
    } catch (err) {
      setSelectedRequest(req);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setDecisionLoading(true);
    setSyncStatusMessage(null);
    try {
      const res = await api.managerApproval(selectedRequest.id, {
        decision: 'APPROVE',
        comments: 'Approbation finale accordée par la direction financière après analyse du profil de risque.'
      });

      if (res.success) {
        // Trigger SAP sync
        const sapRes = await api.sapSync(selectedRequest.id);
        if (sapRes.success) {
          setSyncStatusMessage({
            type: 'success',
            text: `Dossier approuvé et synchronisé dans SAP S/4HANA (IDoc : ${sapRes.sap_result?.idoc_number || '000004928173'})`
          });
        }
        await loadRequests();
      }
    } catch (err) {
      setSyncStatusMessage({
        type: 'error',
        text: 'Erreur lors de l approbation : ' + err.message
      });
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleOpenRejectModal = () => {
    setRejectReason('');
    setRejectError('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setRejectError(t('manager_view.rejection_mandatory_label') || 'Le motif de rejet est obligatoire');
      return;
    }

    setDecisionLoading(true);
    try {
      const res = await api.managerApproval(selectedRequest.id, {
        decision: 'REJECT',
        reason: rejectReason.trim(),
        comments: rejectReason.trim()
      });

      if (res.success) {
        setShowRejectModal(false);
        setSyncStatusMessage({
          type: 'info',
          text: `Dossier rejeté avec motif consigné à l audit trail : "${rejectReason.trim()}"`
        });
        await loadRequests();
      } else {
        setRejectError(res.error || 'Erreur lors du rejet');
      }
    } catch (err) {
      setRejectError('Erreur réseau : ' + err.message);
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleSimulateIdoc = async () => {
    if (!selectedRequest) return;
    setIdocLoading(true);
    setShowIdocModal(true);
    try {
      const res = await api.simulateIdoc(selectedRequest.id);
      if (res.success) {
        setIdocData(res);
      }
    } catch (err) {
      console.error('Erreur simulation IDoc:', err);
    } finally {
      setIdocLoading(false);
    }
  };

  const vendorData = selectedRequest?.temporary_data || {};
  const riskScore = parseFloat(selectedRequest?.risk_score || 20);
  const isHighRisk = riskScore >= 70 || Boolean(selectedRequest?.fraud_alert);

  const pendingCount = requests.filter(r => r.status === 'PENDING_MANAGER').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED' || r.status === 'SAP_SYNCED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  const chartData = [
    { name: 'En Attente', count: pendingCount, fill: '#1D4ED8' },
    { name: 'Validés SAP', count: approvedCount, fill: '#16A34A' },
    { name: 'Rejetés', count: rejectedCount, fill: '#DC2626' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 border border-blue-200 text-[var(--primary)] rounded-xl">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">
              {t('manager_view.title') || 'Tableau de Gouvernance & Validation Manager'}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              {t('manager_view.subtitle') || 'Arbitrage risque, motifs obligatoires SOX et synchronisation SAP IDoc'}
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

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div>
            <span className="kpi-label">À Arbitrer (Manager)</span>
            <div className="kpi-val mt-1 text-[var(--primary)]">{pendingCount}</div>
            <span className="text-[11px] text-[var(--primary)] font-medium">Décision requise</span>
          </div>
          <div className="p-3 bg-blue-50 text-[var(--primary)] border border-blue-200 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <span className="kpi-label">Synchronisés SAP</span>
            <div className="kpi-val mt-1 text-[var(--success)]">{approvedCount}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Flux CREMAS05 émis</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl">
            <Check className="w-6 h-6" />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <span className="kpi-label">Dossiers Rejetés</span>
            <div className="kpi-val mt-1 text-[var(--danger)]">{rejectedCount}</div>
            <span className="text-[11px] text-rose-600 font-medium">Motif tracé SOX</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl">
            <X className="w-6 h-6" />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <span className="kpi-label">Total Dossiers</span>
            <div className="kpi-val mt-1 text-[var(--text)]">{requests.length}</div>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">Volume global</span>
          </div>
          <div className="w-16 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar dataKey="count" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMessage && (
        <div className={`p-4 rounded-xl text-xs font-semibold border flex items-center justify-between ${
          syncStatusMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : syncStatusMessage.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <span>{syncStatusMessage.text}</span>
          <button onClick={() => setSyncStatusMessage(null)} className="font-bold text-sm">×</button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Requests Queue (5 cols) */}
        <div className="lg:col-span-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs flex flex-col h-[700px]">
          <div className="p-4 border-b border-[var(--border)] bg-slate-50/60 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-[var(--text)]">
              Dossiers Fournisseurs ({requests.length})
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Tri par priorité</span>
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
                if (r.status === 'PENDING_MANAGER') badgeVariant = 'primary';
                else if (r.status === 'SAP_SYNCED' || r.status === 'APPROVED') badgeVariant = 'approved';
                else if (r.status === 'REJECTED') badgeVariant = 'rejected';

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

        {/* Right Column: Detailed Decision Console (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedRequest ? (
            <Card bodyClassName="p-5 space-y-5">
              {/* Header of Detail */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[var(--primary)] font-bold">
                      Dossier #{selectedRequest.id}
                    </span>
                    <span className="text-[10px] bg-blue-50 border border-blue-200 text-[var(--primary)] px-2 py-0.5 rounded font-mono font-semibold">
                      {selectedRequest.geographic_scope}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text)] mt-1">
                    {vendorData.legal_name || 'Fournisseur Tiers'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">{vendorData.address || 'Adresse déclarée'}</p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={FileCode}
                  onClick={handleSimulateIdoc}
                >
                  {t('manager_view.btn_simulate_idoc') || 'Simuler IDoc SAP'}
                </Button>
              </div>

              {/* Risk Banner & Alerts */}
              <div className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                isHighRisk
                  ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-start gap-3">
                  {isHighRisk ? (
                    <AlertOctagon className="w-6 h-6 text-[var(--danger)] shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-[var(--success)] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {isHighRisk ? 'Alerte Risque Élevé — Blocage Préventif ZBLOCK Prévu' : 'Dossier Conforme — Risque Maîtrisé'}
                    </h4>
                    <p className="text-xs mt-0.5 opacity-90">
                      Score global calculé par les 5 moteurs d IA : <strong className="font-mono">{riskScore}/100</strong> ({selectedRequest.risk_tier || 'NORMAL'})
                    </p>
                    {isHighRisk && (
                      <p className="text-[11px] font-semibold text-[var(--danger)] mt-1">
                        {t('manager_view.payment_block_notice') || 'Un blocage préventif des paiements (ZBLOCK) sera appliqué lors de la création SAP.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Banking & Financial Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200">
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">Coordonnées Bancaires (IBAN)</span>
                  <p className="font-mono font-bold text-[var(--text)] mt-1 break-all">
                    {vendorData.iban || 'FR76...'}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">BIC : {vendorData.bic_swift || 'BNPAFRPP'}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Banque : {vendorData.bank_name || 'Établissement bancaire'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-[var(--border)]">
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">Fiscalité & Exposition Financière</span>
                  <p className="font-semibold text-[var(--text)] mt-1">
                    TVA : <span className="font-mono">{vendorData.tax_id_vat || 'N/A'}</span>
                  </p>
                  <p className="text-[var(--text-muted)] mt-0.5">
                    Dépense annuelle estimée : <strong className="font-mono text-[var(--primary)]">{formatCurrency(vendorData.annual_spend || 50000)}</strong>
                  </p>
                </div>
              </div>

              {/* Rejection Reason Notice if already rejected */}
              {selectedRequest.rejection_reason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  <span className="font-bold block mb-0.5">Motif officiel du rejet :</span>
                  <p className="italic font-serif">"{selectedRequest.rejection_reason}"</p>
                </div>
              )}

              {/* Decision Actions Bar */}
              <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="danger"
                  icon={X}
                  onClick={handleOpenRejectModal}
                  disabled={decisionLoading || selectedRequest.status === 'REJECTED'}
                >
                  {t('manager_view.btn_reject') || 'Rejeter le Dossier'}
                </Button>

                <Button
                  variant="primary"
                  icon={Check}
                  onClick={handleApprove}
                  disabled={decisionLoading || selectedRequest.status === 'SAP_SYNCED'}
                  loading={decisionLoading}
                >
                  {decisionLoading
                    ? 'Synchronisation SAP en cours...'
                    : (t('manager_view.btn_approve') || 'Approuver et Synchroniser SAP')}
                </Button>
              </div>

              {/* Immutable Audit Trail for this request */}
              <div className="pt-3 border-t border-[var(--border)] space-y-2">
                <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  Historique Piste d Audit SOX
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-[11px]">
                  {auditTrail.map((log) => (
                    <div key={log.id} className="p-2 bg-slate-50 border border-[var(--border)] rounded-lg flex items-center justify-between text-[var(--text)]">
                      <span>{log.action} ({log.full_name || 'Système'})</span>
                      <span className="text-[var(--text-muted)] text-[10px]">{formatDate(log.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <Card bodyClassName="p-12 text-center text-[var(--text-muted)] text-xs">
              Sélectionnez un dossier dans la liste pour examiner la synthèse décisionnelle.
            </Card>
          )}
        </div>
      </div>

      {/* Mandatory Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-[var(--danger)] rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">
                  {t('manager_view.rejection_modal_title') || 'Motif Obligatoire de Rejet'}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Dossier #{selectedRequest?.id}</p>
              </div>
            </div>

            {rejectError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                {rejectError}
              </div>
            )}

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  {t('manager_view.rejection_mandatory_label') || 'Motif circonstancié (requis SOX Section 404)'} <span className="text-[var(--danger)]">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('manager_view.rejection_placeholder') || 'Précisez la raison du refus (ex: suspicion fraude RIB, discordance Kbis...)'}
                  required
                  rows={4}
                  className="w-full p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                >
                  {t('common.cancel') || 'Annuler'}
                </Button>
                <Button
                  variant="danger"
                  type="submit"
                  disabled={decisionLoading || !rejectReason.trim()}
                  loading={decisionLoading}
                >
                  Confirmer le Rejet Obligatoire
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IDoc Simulation Modal */}
      {showIdocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="text-base font-bold text-[var(--text)]">
                  {t('manager_view.idoc_modal_title') || 'Prévisualisation IDoc SAP CREMAS05'}
                </h3>
              </div>
              <button
                onClick={() => setShowIdocModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs">
              {idocLoading ? (
                <div className="p-8 text-center text-[var(--text-muted)]">Génération du flux IDoc en cours...</div>
              ) : idocData ? (
                <>
                  <div className="flex items-center justify-between bg-blue-50/50 border border-blue-200 p-3 rounded-lg text-[var(--text)]">
                    <span>Type IDoc : <strong>{idocData.idoc_type}</strong></span>
                    <span>Numéro : <strong>{idocData.idoc_number}</strong></span>
                    <span>Blocage Paiement : <strong className={idocData.preventive_block ? 'text-[var(--danger)]' : 'text-[var(--success)]'}>{idocData.preventive_block ? 'OUI (ZBLOCK)' : 'NON'}</strong></span>
                  </div>

                  <div className="bg-[#0F172A] text-emerald-400 p-4 rounded-xl overflow-x-auto border border-slate-800">
                    <pre className="text-[11px] leading-relaxed">
                      {JSON.stringify(idocData.payload, null, 2)}
                    </pre>
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--border)]">
              <Button
                variant="ghost"
                onClick={() => setShowIdocModal(false)}
              >
                {t('common.close') || 'Fermer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
