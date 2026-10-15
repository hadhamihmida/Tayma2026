import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatDate } from '../i18n';
import { 
  Send, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  XCircle,
  Plus
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/Table';

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
      }
    }

    // BigInt Modulo 97
    try {
      const remainder = BigInt(numeric) % 97n;
      const isValid = remainder === 1n;
      const ibanCountry = cleaned.slice(0, 2);
      const isMismatch = countryVal && ibanCountry !== countryVal;

      setIbanValidation({
        valid: isValid,
        country_code: ibanCountry,
        country_mismatch: isMismatch,
        error: isValid ? null : 'Échec de la clé de contrôle SEPA Modulo 97'
      });
    } catch (e) {
      setIbanValidation({
        valid: false,
        error: 'Caractères non valides dans le format IBAN'
      });
    }
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
      setForm({
        legal_name: 'Provence Catering & Services SARL',
        tax_id_vat: 'FR88765432100',
        country: 'FR',
        address: '8 Boulevard Michelet, 13008 Marseille, France',
        iban: 'SE4550000000058398257466',
        bic_swift: 'SWEDSESS',
        bank_name: 'Swedbank Stockholm',
        contact_email: 'provence-urgent@temp-mail.org',
        annual_spend: '140000',
        request_type: 'CREATION'
      });
      verifyIbanLive('SE4550000000058398257466', 'FR');
    } else if (type === 'INVALID_MODULO') {
      setForm({
        legal_name: 'Lyon Express Transport SARL',
        tax_id_vat: 'FR99887766554',
        country: 'FR',
        address: '45 Rue de la République, 69002 Lyon, France',
        iban: 'FR7630006000011234567890199',
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 border border-blue-200 text-[var(--primary)] rounded-xl">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">
              {t('requester_view.title') || "Portail Demandeur d'Onboarding"}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Périmètre territorial : <strong className="text-[var(--primary)]">{user?.geographic_scope}</strong> (Dossiers assignés)
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setShowCreateModal(true);
            fillTemplate('CLEAN');
          }}
          className="self-start md:self-auto"
        >
          {t('requester_view.create_button') || "Nouvelle Demande d'Onboarding"}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div>
            <span className="kpi-label">{t('requester_view.stats_pending') || 'Dossiers en Cours de Revue'}</span>
            <div className="kpi-val mt-1">{pendingCount}</div>
            <span className="text-[11px] text-amber-600 font-medium">File Agent / Manager</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <span className="kpi-label">{t('requester_view.stats_approved') || 'Dossiers Validés & Synchronisés'}</span>
            <div className="kpi-val mt-1 text-[var(--success)]">{approvedCount}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Actifs dans SAP S/4HANA</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <span className="kpi-label">{t('requester_view.stats_alerts') || 'Alertes & Discordances'}</span>
            <div className="kpi-val mt-1 text-[var(--danger)]">{alertCount}</div>
            <span className="text-[11px] text-rose-600 font-medium">Bloqués par contrôle IA</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card bodyClassName="p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par raison sociale, ID..."
                className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
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

          <Button
            variant="ghost"
            size="sm"
            onClick={loadRequests}
            title="Actualiser"
            className="border border-[var(--border)]"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Requests Table */}
      <Table>
        <TableHeader>
          <tr>
            <TableHead>ID</TableHead>
            <TableHead>Fournisseur Déclaré</TableHead>
            <TableHead>Coordonnées Bancaires</TableHead>
            <TableHead>Périmètre</TableHead>
            <TableHead>Score Risque</TableHead>
            <TableHead>Statut Workflow</TableHead>
            <TableHead>Date de Création</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {filteredRequests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-[var(--text-muted)]">
                Aucune demande d'onboarding trouvée dans ce périmètre.
              </TableCell>
            </TableRow>
          ) : (
            filteredRequests.map((r) => {
              const name = r.temporary_data?.legal_name || r.existing_vendor_name || 'Fournisseur';
              const iban = r.temporary_data?.iban || 'N/A';
              const score = parseFloat(r.risk_score || 0);

              let badgeVariant = 'default';
              if (r.status === 'SAP_SYNCED' || r.status === 'APPROVED') badgeVariant = 'approved';
              else if (r.status === 'REJECTED') badgeVariant = 'rejected';
              else if (r.status.includes('PENDING') || r.status === 'SUBMITTED') badgeVariant = 'pending';

              return (
                <TableRow key={r.id}>
                  <TableCell className="font-mono font-bold text-[var(--primary)]">#{r.id}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-[var(--text)]">{name}</div>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono">TVA : {r.temporary_data?.tax_id_vat || 'N/A'}</div>
                  </TableCell>
                  <TableCell className="font-mono text-[11px]">
                    <div className="font-medium text-[var(--text)]">{iban}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{r.temporary_data?.bank_name || ''}</div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 border border-blue-200 text-[var(--primary)] font-semibold">
                      {r.geographic_scope}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      score >= 70
                        ? 'bg-rose-50 border border-rose-200 text-[var(--danger)]'
                        : score >= 40
                        ? 'bg-amber-50 border border-amber-200 text-amber-700'
                        : 'bg-emerald-50 border border-emerald-200 text-[var(--success)]'
                    }`}>
                      {score.toFixed(0)}/100
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[var(--text-muted)] text-[11px]">
                    {formatDate(r.created_at)}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Creation Modal with LIVE IBAN Modulo 97 Checking */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">
                  Création d'un Nouveau Dossier Fournisseur
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Contrôle direct de l'intégrité bancaire et analyse prédictive anti-fraude
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] font-bold text-xl"
              >
                ×
              </button>
            </div>

            {/* Quick Demo Template Pills */}
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
              <span className="text-[11px] font-semibold text-[var(--primary)] block">
                Pré-remplissage rapide pour scénario de soutenance :
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillTemplate('CLEAN')}
                  className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-100 transition-colors"
                >
                  ✓ Cas Sain (IBAN Valide SEPA)
                </button>
                <button
                  type="button"
                  onClick={() => fillTemplate('MISMATCH')}
                  className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded text-xs font-medium hover:bg-amber-100 transition-colors"
                >
                  ⚠ Cas Discordance Pays (Siège FR vs IBAN SE)
                </button>
                <button
                  type="button"
                  onClick={() => fillTemplate('INVALID_MODULO')}
                  className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs font-medium hover:bg-rose-100 transition-colors"
                >
                  ✗ Cas Échec Clé Modulo 97
                </button>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-[var(--danger)] rounded-lg text-xs">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-[var(--success)] rounded-lg text-xs font-semibold">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text)] font-semibold mb-1">Raison Sociale Légale *</label>
                  <input
                    type="text"
                    value={form.legal_name}
                    onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
                    required
                    className="app-input"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text)] font-semibold mb-1">Numéro TVA Intracommunautaire *</label>
                  <input
                    type="text"
                    value={form.tax_id_vat}
                    onChange={(e) => setForm({ ...form, tax_id_vat: e.target.value.toUpperCase() })}
                    required
                    placeholder="FR12345678901"
                    className="app-input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[var(--text)] font-semibold mb-1">Pays du Siège Social *</label>
                  <select
                    value={form.country}
                    onChange={handleCountryChange}
                    className="app-input"
                  >
                    <option value="FR">France (FR)</option>
                    <option value="ES">Espagne (ES)</option>
                    <option value="IT">Italie (IT)</option>
                    <option value="SE">Suède (SE)</option>
                    <option value="DE">Allemagne (DE)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[var(--text)] font-semibold mb-1">Adresse Complète</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="28 Rue de la Paix, 75002 Paris"
                    className="app-input"
                  />
                </div>
              </div>

              {/* LIVE IBAN FIELD WITH REAL-TIME MODULO 97 BADGES */}
              <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[var(--text)] font-bold flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[var(--primary)]" />
                    Numéro IBAN (Validation en direct Modulo 97 ISO 13616) *
                  </label>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">Format SEPA</span>
                </div>

                <input
                  type="text"
                  value={form.iban}
                  onChange={handleIbanChange}
                  required
                  placeholder="FR7630006000011234567890189"
                  className="app-input font-mono bg-white"
                />

                {/* Real-time Validation Feedback Badges */}
                {ibanValidation && (
                  <div className="space-y-1">
                    {ibanValidation.valid ? (
                      <div className="flex items-center gap-1.5 text-[var(--success)] font-medium text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Clé de contrôle Modulo 97 valide et conforme SEPA</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[var(--danger)] font-medium text-xs">
                        <XCircle className="w-4 h-4" />
                        <span>✗ {ibanValidation.error}</span>
                      </div>
                    )}

                    {ibanValidation.country_mismatch && (
                      <div className="flex items-center gap-1.5 text-amber-700 font-medium text-xs">
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
                  <label className="block text-[var(--text)] font-semibold mb-1">Code BIC / SWIFT *</label>
                  <input
                    type="text"
                    value={form.bic_swift}
                    onChange={(e) => setForm({ ...form, bic_swift: e.target.value.toUpperCase() })}
                    required
                    placeholder="BNPAFRPP"
                    className="app-input font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text)] font-semibold mb-1">Nom de l'Établissement Bancaire</label>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    placeholder="BNP Paribas"
                    className="app-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text)] font-semibold mb-1">Email du Contact Fournisseur *</label>
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    required
                    placeholder="contact@fournisseur.com"
                    className="app-input"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text)] font-semibold mb-1">Volume Annuel Estimé (€)</label>
                  <input
                    type="number"
                    value={form.annual_spend}
                    onChange={(e) => setForm({ ...form, annual_spend: e.target.value })}
                    className="app-input font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  {t('common.cancel') || 'Annuler'}
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={submitting}
                  loading={submitting}
                >
                  {submitting ? 'Contrôle IA en cours...' : 'Soumettre le Dossier'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
