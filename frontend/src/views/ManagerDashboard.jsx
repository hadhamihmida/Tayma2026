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
  Database, 
  Layers, 
  Activity,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Lock,
  FileCode,
  AlertTriangle,
  Building,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

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
          // Select pending manager request first, or first item
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
      setRejectError(t('manager_view.rejection_mandatory_label'));
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

  // Stats for manager
  const pendingCount = requests.filter(r => r.status === 'PENDING_MANAGER').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED' || r.status === 'SAP_SYNCED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  const chartData = [
    { name: 'En Attente', count: pendingCount, fill: '#6366f1' },
    { name: 'Validés SAP', count: approvedCount, fill: '#10b981' },
    { name: 'Rejetés', count: rejectedCount, fill: '#ef4444' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('manager_view.title')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('manager_view.subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={loadRequests}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium">À Arbitrer (Manager)</span>
          <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{pendingCount}</h3>
          <span className="text-[10px] text-indigo-500">Décision requise</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium">Synchronisés SAP</span>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{approvedCount}</h3>
          <span className="text-[10px] text-emerald-500">Flux CREMAS05 émis</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium">Dossiers Rejetés</span>
          <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{rejectedCount}</h3>
          <span className="text-[10px] text-rose-500">Motif tracé SOX</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Total Dossiers</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{requests.length}</h3>
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
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : syncStatusMessage.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
        }`}>
          <span>{syncStatusMessage.text}</span>
          <button onClick={() => setSyncStatusMessage(null)} className="font-bold text-sm">×</button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Requests Queue (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col h-[700px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Dossiers Fournisseurs ({requests.length})
            </span>
            <span className="text-[10px] text-slate-400">Tri par priorité</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1">
            {requests.map((r) => {
              const isSelected = selectedRequest?.id === r.id;
              const name = r.temporary_data?.legal_name || r.existing_vendor_name || `Dossier #${r.id}`;
              const rScore = parseFloat(r.risk_score || 0);

              return (
                <div
                  key={r.id}
                  onClick={() => selectRequest(r)}
                  className={`p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">#{r.id}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      r.status === 'PENDING_MANAGER'
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 animate-pulse'
                        : r.status === 'SAP_SYNCED'
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                        : r.status === 'REJECTED'
                        ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {name}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono">
                      {r.geographic_scope}
                    </span>

                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      rScore >= 70
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                        : rScore >= 40
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      Score: {rScore.toFixed(0)}/100
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Decision Console (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedRequest ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
              {/* Header of Detail */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      Dossier #{selectedRequest.id}
                    </span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">
                      {selectedRequest.geographic_scope}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {vendorData.legal_name || 'Fournisseur Tiers'}
                  </h3>
                  <p className="text-xs text-slate-400">{vendorData.address || 'Adresse déclarée'}</p>
                </div>

                <button
                  onClick={handleSimulateIdoc}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{t('manager_view.btn_simulate_idoc')}</span>
                </button>
              </div>

              {/* Risk Banner & Alerts */}
              <div className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                isHighRisk
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
              }`}>
                <div className="flex items-start gap-3">
                  {isHighRisk ? (
                    <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {isHighRisk ? 'Alerte Risque Élevé — Blocage Préventif ZBLOCK Prévu' : 'Dossier Conforme — Risque Maîtrisé'}
                    </h4>
                    <p className="text-xs mt-0.5 opacity-90">
                      Score global calculé par les 5 moteurs d IA : <strong className="font-mono">{riskScore}/100</strong> ({selectedRequest.risk_tier || 'NORMAL'})
                    </p>
                    {isHighRisk && (
                      <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 mt-1">
                        {t('manager_view.payment_block_notice')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Banking & Financial Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium">Coordonnées Bancaires (IBAN)</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white mt-1 break-all">
                    {vendorData.iban || 'FR76...'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">BIC : {vendorData.bic_swift || 'BNPAFRPP'}</p>
                  <p className="text-[11px] text-slate-500">Banque : {vendorData.bank_name || 'Établissement bancaire'}</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium">Fiscalité & Exposition Financière</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">
                    TVA : <span className="font-mono">{vendorData.tax_id_vat || 'N/A'}</span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                    Dépense annuelle estimée : <strong className="font-mono text-blue-600 dark:text-blue-400">{formatCurrency(vendorData.annual_spend || 50000)}</strong>
                  </p>
                </div>
              </div>

              {/* Rejection Reason Notice if already rejected */}
              {selectedRequest.rejection_reason && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-200">
                  <span className="font-bold block mb-0.5">Motif officiel du rejet :</span>
                  <p className="italic font-serif">"{selectedRequest.rejection_reason}"</p>
                </div>
              )}

              {/* Decision Actions Bar */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleOpenRejectModal}
                  disabled={decisionLoading || selectedRequest.status === 'REJECTED'}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  <span>{t('manager_view.btn_reject')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={decisionLoading || selectedRequest.status === 'SAP_SYNCED'}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {decisionLoading ? 'Synchronisation SAP en cours...' : t('manager_view.btn_approve')}
                  </span>
                </button>
              </div>

              {/* Immutable Audit Trail for this request */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  Historique Piste d Audit SOX
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-[11px]">
                  {auditTrail.map((log) => (
                    <div key={log.id} className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>{log.action} ({log.full_name || 'Système'})</span>
                      <span className="text-slate-400 text-[10px]">{formatDate(log.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs">
              Sélectionnez un dossier dans la liste pour examiner la synthèse décisionnelle.
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('manager_view.rejection_modal_title')}
                </h3>
                <p className="text-xs text-slate-400">Dossier #{selectedRequest?.id}</p>
              </div>
            </div>

            {rejectError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                {rejectError}
              </div>
            )}

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('manager_view.rejection_mandatory_label')} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('manager_view.rejection_placeholder')}
                  required
                  rows={4}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={decisionLoading || !rejectReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  Confirmer le Rejet Obligatoire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IDoc Simulation Modal */}
      {showIdocModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('manager_view.idoc_modal_title')}
                </h3>
              </div>
              <button
                onClick={() => setShowIdocModal(false)}
                className="text-slate-400 hover:text-slate-200 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs">
              {idocLoading ? (
                <div className="p-8 text-center text-slate-400">Génération du flux IDoc en cours...</div>
              ) : idocData ? (
                <>
                  <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-slate-700 dark:text-slate-300">
                    <span>Type IDoc : <strong>{idocData.idoc_type}</strong></span>
                    <span>Numéro : <strong>{idocData.idoc_number}</strong></span>
                    <span>Blocage Paiement : <strong className={idocData.preventive_block ? 'text-rose-500' : 'text-emerald-500'}>{idocData.preventive_block ? 'OUI (ZBLOCK)' : 'NON'}</strong></span>
                  </div>

                  <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl overflow-x-auto">
                    <pre className="text-[11px] leading-relaxed">
                      {JSON.stringify(idocData.payload, null, 2)}
                    </pre>
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowIdocModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
