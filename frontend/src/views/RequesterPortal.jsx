import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatDate, formatCurrency } from '../i18n';
import { 
  Send, 
  UserPlus, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Building,
  CreditCard,
  CheckCircle2,
  XCircle,
  FileCheck,
  Plus
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

export default function RequesterPortal() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Live IBAN verification state
  const [ibanValidation, setIbanValidation] = useState(null);

  // Form State
  const [form, setForm] = useState({
    legal_name: '',
    tax_id_vat: '',
    country: user?.geographic_scope === 'NORDIC' ? 'SE' : 'FR',
    address: '',
    iban: '',
    bic_swift: '',
    bank_name: '',
    contact_email: '',
    annual_spend: '85000',
    request_type: 'CREATION'
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getRequests();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.warn('Erreur chargement demandes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Live Modulo 97 IBAN Check
  const verifyIbanLive = (ibanVal, countryVal) => {
    if (!ibanVal || ibanVal.trim().length < 5) {
      setIbanValidation(null);
      return;
    }
    const cleaned = ibanVal.replace(/[\s-]/g, '').toUpperCase();
    if (cleaned.length < 14 || cleaned.length > 34) {
      setIbanValidation({
        valid: false,
        error: 'Longueur d IBAN incomplète (14 à 34 caractères attendus)'
      });
      return;
    }

    const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
    let numeric = '';
    for (let i = 0; i < rearranged.length; i++) {
      const code = rearranged.charCodeAt(i);
      if (code >= 65 && code <= 90) {
        numeric += (code - 55).toString();
      } else if (code >= 48 && code <= 57) {
        numeric += rearranged[i];
      } else {
        setIbanValidation({ valid: false, error: 'Caractère non autorisé dans l IBAN' });
        return;
      }
    }

    let remainder = 0;
    for (let i = 0; i < numeric.length; i += 7) {
      const chunk = remainder.toString() + numeric.substring(i, Math.min(i + 7, numeric.length));
      remainder = parseInt(chunk, 10) % 97;
    }

    const isValid = remainder === 1;
    const ibanCountry = cleaned.substring(0, 2);
    const countryMismatch = countryVal && ibanCountry !== countryVal.toUpperCase();

    setIbanValidation({
      valid: isValid,
      cleaned,
      country_code: ibanCountry,
      country_mismatch: countryMismatch,
      error: isValid ? null : 'Échec de la clé de contrôle Modulo 97 (reste différent de 1)'
    });
  };

  const handleIbanChange = (e) => {
    const val = e.target.value.toUpperCase();
    setForm({ ...form, iban: val });
    verifyIbanLive(val, form.country);
  };

  const handleCountryChange = (e) => {
    const c = e.target.value;
    setForm({ ...form, country: c });
    verifyIbanLive(form.iban, c);
  };

  const fillTemplate = (type) => {
    if (type === 'CLEAN') {
      const isNordic = user?.geographic_scope === 'NORDIC';
      setForm({
        legal_name: isNordic ? 'Stockholm Clean Energy AB' : 'Bordeaux Logistics & Freight SAS',
        tax_id_vat: isNordic ? 'SE5569876543' : 'FR44123456789',
        country: isNordic ? 'SE' : 'FR',
        address: isNordic ? 'Sveavägen 44, 111 34 Stockholm, Sweden' : '12 Quai des Chartrons, 33000 Bordeaux, France',
        iban: isNordic ? 'SE4550000000058398257466' : 'FR7630006000011234567890189',
        bic_swift: isNordic ? 'SWEDSESS' : 'BNPAFRPP',
        bank_name: isNordic ? 'Swedbank' : 'BNP Paribas',
        contact_email: isNordic ? 'billing@stockholm-energy.se' : 'contact@bordeaux-logistics.fr',
        annual_spend: '95000',
        request_type: 'CREATION'
      });
      verifyIbanLive(
        isNordic ? 'SE4550000000058398257466' : 'FR7630006000011234567890189',
        isNordic ? 'SE' : 'FR'
      );
    } else if (type === 'MISMATCH') {
      // Country Mismatch: French company with Swedish IBAN
      setForm({
        legal_name: 'Provence Catering & Services SARL',
        tax_id_vat: 'FR88765432100',
        country: 'FR',
        address: '8 Boulevard Michelet, 13008 Marseille, France',
        iban: 'SE4550000000058398257466', // Swedish IBAN for FR vendor!
        bic_swift: 'SWEDSESS',
        bank_name: 'Swedbank Stockholm',
        contact_email: 'provence-urgent@temp-mail.org',
        annual_spend: '140000',
        request_type: 'CREATION'
      });
      verifyIbanLive('SE4550000000058398257466', 'FR');
    } else if (type === 'INVALID_MODULO') {
      // Invalid checksum
      setForm({
        legal_name: 'Lyon Express Transport SARL',
        tax_id_vat: 'FR99887766554',
        country: 'FR',
        address: '45 Rue de la République, 69002 Lyon, France',
        iban: 'FR7630006000011234567890199', // invalid last digits
        bic_swift: 'BNPAFRPP',
        bank_name: 'BNP Paribas',
        contact_email: 'direction@lyon-transport.fr',
        annual_spend: '60000',
        request_type: 'CREATION'
      });
      verifyIbanLive('FR7630006000011234567890199', 'FR');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        request_type: form.request_type,
        geographic_scope: user?.geographic_scope || 'WESTERN',
        submitted_fields: form,
        document_text: `Dossier de référencement pour ${form.legal_name} - IBAN : ${form.iban} - BIC : ${form.bic_swift}`
      };

      const res = await api.createRequest(payload);
      if (res.success) {
        setFormSuccess(`Dossier #${res.request_id} créé et évalué par le moteur IA (Score: ${res.risk_score}/100) !`);
        setTimeout(() => {
          setShowCreateModal(false);
          setFormSuccess('');
          loadRequests();
        }, 1500);
      } else {
        setFormError(res.error || 'Erreur lors de la création');
      }
    } catch (err) {
      setFormError('Erreur réseau : ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const name = (r.temporary_data?.legal_name || r.existing_vendor_name || '').toLowerCase();
    const id = String(r.id);
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter(r => r.status.includes('PENDING') || r.status === 'SUBMITTED').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED' || r.status === 'SAP_SYNCED').length;
  const alertCount = requests.filter(r => Boolean(r.fraud_alert)).length;

  const chartData = [
    { name: 'En cours', count: pendingCount },
    { name: 'Validés', count: approvedCount },
    { name: 'Alertes', count: alertCount }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Send className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('requester_view.title')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Périmètre territorial : <strong className="text-emerald-600 dark:text-emerald-400">{user?.geographic_scope}</strong> (Dossiers assignés)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            fillTemplate('CLEAN');
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('requester_view.create_button')}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('requester_view.stats_pending')}</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{pendingCount}</h3>
            <span className="text-[11px] text-amber-500">File Agent / Manager</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('requester_view.stats_approved')}</span>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{approvedCount}</h3>
            <span className="text-[11px] text-emerald-500">Synchronisés SAP</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('requester_view.stats_alerts')}</span>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{alertCount}</h3>
            <span className="text-[11px] text-rose-500">Bloqués par contrôle IA</span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par raison sociale, ID..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="PENDING_AGENT">PENDING_AGENT</option>
            <option value="PENDING_MANAGER">PENDING_MANAGER</option>
            <option value="APPROVED">APPROVED</option>
            <option value="SAP_SYNCED">SAP_SYNCED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <button
          onClick={loadRequests}
          className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg self-end sm:self-auto"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Fournisseur Déclaré</th>
                <th className="py-3 px-4">Coordonnées Bancaires</th>
                <th className="py-3 px-4">Périmètre</th>
                <th className="py-3 px-4">Score Risque</th>
                <th className="py-3 px-4">Statut Workflow</th>
                <th className="py-3 px-4">Date de Création</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredRequests.map((r) => {
                const name = r.temporary_data?.legal_name || r.existing_vendor_name || 'Fournisseur';
                const iban = r.temporary_data?.iban || 'N/A';
                const score = parseFloat(r.risk_score || 0);

                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">#{r.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">TVA : {r.temporary_data?.tax_id_vat || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div>{iban}</div>
                      <div className="text-[10px] text-slate-400">{r.temporary_data?.bank_name || ''}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {r.geographic_scope}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        score >= 70
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                          : score >= 40
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {score.toFixed(0)}/100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${
                        r.status === 'SAP_SYNCED'
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                          : r.status === 'REJECTED'
                          ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                          : r.status === 'PENDING_MANAGER'
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                          : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {formatDate(r.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal with LIVE IBAN Modulo 97 Checking */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Création d'un Nouveau Dossier Fournisseur
                </h3>
                <p className="text-xs text-slate-500">
                  Contrôle direct de l'intégrité bancaire et analyse prédictive anti-fraude
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 font-bold text-xl"
              >
                ×
              </button>
            </div>

            {/* Quick Demo Template Pills */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                Pré-remplissage rapide pour scénario de soutenance :
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillTemplate('CLEAN')}
                  className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded text-xs font-medium hover:bg-emerald-200 transition-colors"
                >
                  ✓ Cas Sain (IBAN Valide SEPA)
                </button>
                <button
                  type="button"
                  onClick={() => fillTemplate('MISMATCH')}
                  className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded text-xs font-medium hover:bg-amber-200 transition-colors"
                >
                  ⚠ Cas Discordance Pays (Siège FR vs IBAN SE)
                </button>
                <button
                  type="button"
                  onClick={() => fillTemplate('INVALID_MODULO')}
                  className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded text-xs font-medium hover:bg-rose-200 transition-colors"
                >
                  ✗ Cas Échec Clé Modulo 97
                </button>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Raison Sociale Légale *</label>
                  <input
                    type="text"
                    value={form.legal_name}
                    onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Numéro TVA Intracommunautaire *</label>
                  <input
                    type="text"
                    value={form.tax_id_vat}
                    onChange={(e) => setForm({ ...form, tax_id_vat: e.target.value.toUpperCase() })}
                    required
                    placeholder="FR12345678901"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Pays du Siège Social *</label>
                  <select
                    value={form.country}
                    onChange={handleCountryChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="FR">France (FR)</option>
                    <option value="ES">Espagne (ES)</option>
                    <option value="IT">Italie (IT)</option>
                    <option value="SE">Suède (SE)</option>
                    <option value="DE">Allemagne (DE)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Adresse Complète</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="28 Rue de la Paix, 75002 Paris"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* LIVE IBAN FIELD WITH REAL-TIME MODULO 97 BADGES */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    Numéro IBAN (Validation en direct Modulo 97 ISO 13616) *
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Format SEPA</span>
                </div>

                <input
                  type="text"
                  value={form.iban}
                  onChange={handleIbanChange}
                  required
                  placeholder="FR7630006000011234567890189"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500"
                />

                {/* Real-time Validation Feedback Badges */}
                {ibanValidation && (
                  <div className="space-y-1">
                    {ibanValidation.valid ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Clé de contrôle Modulo 97 valide et conforme SEPA</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium text-xs">
                        <XCircle className="w-4 h-4" />
                        <span>✗ {ibanValidation.error}</span>
                      </div>
                    )}

                    {ibanValidation.country_mismatch && (
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium text-xs">
                        <AlertTriangle className="w-4 h-4" />
                        <span>
                          ⚠ Alerte Discordance : IBAN domicilié en ({ibanValidation.country_code}) alors que le siège est en ({form.country}) !
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Code BIC / SWIFT *</label>
                  <input
                    type="text"
                    value={form.bic_swift}
                    onChange={(e) => setForm({ ...form, bic_swift: e.target.value.toUpperCase() })}
                    required
                    placeholder="BNPAFRPP"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Nom de l'Établissement Bancaire</label>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    placeholder="BNP Paribas"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Email du Contact Fournisseur *</label>
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    required
                    placeholder="contact@fournisseur.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Volume Annuel Estimé (€)</label>
                  <input
                    type="number"
                    value={form.annual_spend}
                    onChange={(e) => setForm({ ...form, annual_spend: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Contrôle IA en cours...' : 'Soumettre le Dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
