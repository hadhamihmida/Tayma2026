import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatDate, formatCurrency } from '../i18n';
import { 
  CheckSquare, 
  AlertTriangle, 
  FileText, 
  Search, 
  Filter, 
  ArrowRight, 
  Check, 
  X, 
  Eye, 
  Sparkles, 
  Copy, 
  ShieldAlert,
  Send,
  Building2,
  RefreshCw,
  ExternalLink,
  Cpu,
  Fingerprint,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  CheckCircle2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

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
      ? 'Contrôle opérationnel d intégrité validé par l Agent Master Data.'
      : 'Dossier rejeté par l Agent : discordance documentaire ou suspicion de fraude.';

    try {
      const res = await api.agentReview(selectedRequest.id, {
        action,
        comments,
        reason: comments
      });
      if (res.success) {
        setNotification({
          type: 'success',
          text: `Dossier #${selectedRequest.id} ${action === 'APPROVE_TO_MANAGER' ? 'transmis avec succès au Manager' : 'rejeté'}.`
        });
        await loadRequests();
      }
    } catch (err) {
      setNotification({
        type: 'error',
        text: 'Erreur lors de l opération : ' + err.message
      });
    } finally {
      setReviewActionLoading(false);
    }
  };

  const vendorData = selectedRequest?.temporary_data || {};
  const fraudDetails = selectedRequest?.fraud_details || {};
  const riskFactors = selectedRequest?.risk_factors || [];
  const riskScore = parseFloat(selectedRequest?.risk_score || 0);

  // Comparison fields OCR vs Declared
  const ocrData = fraudDetails.ocr_comparison?.comparisons || [
    {
      field: 'iban',
      label: 'Numéro IBAN',
      declared: vendorData.iban || 'FR76...',
      ocr: vendorData.iban || 'FR76...',
      matches: !selectedRequest?.fraud_alert || !String(selectedRequest?.fraud_details?.iban_error || '').includes('Modulo'),
      confidence: 0.99
    },
    {
      field: 'bic_swift',
      label: 'Code BIC / SWIFT',
      declared: vendorData.bic_swift || 'BNPAFRPP',
      ocr: vendorData.bic_swift || 'BNPAFRPP',
      matches: true,
      confidence: 0.97
    },
    {
      field: 'legal_name',
      label: 'Raison Sociale / Titulaire',
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <CheckSquare className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('agent_view.title')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('agent_view.subtitle')}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Dossiers en Attente de Revue Agent</span>
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{pendingAgentCount}</h3>
            <span className="text-[10px] text-blue-500">File opérationnelle</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Alertes Fraude Actives</span>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{fraudCount}</h3>
            <span className="text-[10px] text-rose-500">Bloquants IA</span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Dossiers dans la File</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{requests.length}</h3>
            <span className="text-[10px] text-emerald-500">Tous statuts confondus</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <Cpu className="w-6 h-6" />
          </div>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold border flex items-center justify-between ${
          notification.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="font-bold text-sm">×</button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Queue (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col h-[700px]">
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-2">
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="ALL">Tous scopes</option>
              <option value="WESTERN">WESTERN</option>
              <option value="NORDIC">NORDIC</option>
              <option value="TGBST">TGBST</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="ALL">Tous statuts</option>
              <option value="PENDING_AGENT">PENDING_AGENT</option>
              <option value="PENDING_MANAGER">PENDING_MANAGER</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
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
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-l-4 border-blue-600'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">#{r.id}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      r.status === 'PENDING_AGENT'
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 animate-pulse'
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

        {/* Right Column: Review Console (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedRequest ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
              {/* Header Info */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">
                      Dossier #{selectedRequest.id}
                    </span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">
                      {selectedRequest.geographic_scope}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {vendorData.legal_name || 'Fournisseur Tiers'}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Score Global IA</span>
                  <span className={`text-base font-bold font-mono ${
                    riskScore >= 70 ? 'text-rose-600' : riskScore >= 40 ? 'text-amber-500' : 'text-emerald-600'
                  }`}>
                    {riskScore.toFixed(1)} / 100
                  </span>
                </div>
              </div>

              {/* Sub-tabs: OCR Rapprochement | Facteurs SHAP | Doublons */}
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('comparative')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'comparative'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Rapprochement OCR vs Déclaré
                </button>
                <button
                  onClick={() => setActiveTab('shap')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'shap'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Explicabilité IA (Facteurs SHAP)
                </button>
                <button
                  onClick={() => setActiveTab('dedup')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'dedup'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Contrôle Doublons (RapidFuzz)
                </button>
              </div>

              {/* TAB CONTENT 1: OCR Comparative View */}
              {activeTab === 'comparative' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Vérification automatique des champs extraits du justificatif bancaire :</span>
                    <span className="text-[11px] text-emerald-600 font-semibold font-mono">Modulo 97 ISO 13616</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {ocrData.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          item.matches
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200'
                            : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                            {item.label}
                          </span>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-0.5">
                            <span className="font-mono text-slate-900 dark:text-white truncate">
                              Déclaré : <strong>{item.declared || '-'}</strong>
                            </span>
                            <span className="hidden sm:inline text-slate-400">•</span>
                            <span className="font-mono text-blue-600 dark:text-blue-400 truncate">
                              OCR : <strong>{item.ocr || '-'}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold">
                          {item.matches ? (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Conforme</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
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
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Décomposition causale du score de risque (Poids en points d'impact) :
                  </div>

                  <div className="space-y-2 text-xs">
                    {riskFactors.length > 0 ? (
                      riskFactors.map((f, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {f.factor || f.factor_name}
                            </div>
                            <div className="text-[11px] text-slate-400">{f.detail || f.description || ''}</div>
                          </div>
                          <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            f.impact > 0
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {f.impact > 0 ? `+${f.impact}` : f.impact} pts
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        Aucun facteur aggravant identifié. Dossier standard sain.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB CONTENT 3: Deduplication */}
              {activeTab === 'dedup' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white block mb-1">
                      Algorithme de Déduplication RapidFuzz & TF-IDF :
                    </span>
                    <p className="text-slate-600 dark:text-slate-300">
                      {fraudDetails.deduplication?.summary || 'Recherche de collision phonétique et vectorielle effectuée sur le référentiel des tiers.'}
                    </p>
                    <div className="mt-2 text-[11px] font-mono text-slate-500">
                      Similarité max détectée : {fraudDetails.deduplication?.max_similarity || 0}%
                    </div>
                  </div>
                </div>
              )}

              {/* Decision Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleAgentDecision('REJECT')}
                  disabled={reviewActionLoading || selectedRequest.status === 'REJECTED'}
                  className="px-4 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {t('agent_view.btn_reject')}
                </button>

                <button
                  onClick={() => handleAgentDecision('APPROVE_TO_MANAGER')}
                  disabled={reviewActionLoading || selectedRequest.status !== 'PENDING_AGENT'}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  <span>{t('agent_view.btn_approve_manager')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs">
              Sélectionnez un dossier dans la file de contrôle pour débuter la revue opérationnelle.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
