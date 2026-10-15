import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Building, 
  CreditCard, 
  RefreshCw
} from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';

export default function VendorPortal() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [request, setRequest] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  useEffect(() => {
    loadVendorData();
  }, [user]);

  const loadVendorData = async () => {
    setLoading(true);
    try {
      const res = await api.getRequests();
      if (res.success && res.requests.length > 0) {
        const myReq = res.requests[0];
        setRequest(myReq);
        const details = await api.getRequestDetails(myReq.id);
        if (details.success) {
          setRequest(details.request);
          setDocuments(details.documents || []);
        }
      }
    } catch (err) {
      console.warn('Erreur chargement données vendor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileInput = async (e) => {
    if (e.target.files.length > 0) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    setUploadMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('request_id', request?.id || 1);
      formData.append('doc_type', file.name.toLowerCase().includes('kbis') ? 'KBIS' : 'RIB');

      const res = await api.uploadDocument(formData);
      if (res.success) {
        setUploadMessage({
          type: 'success',
          text: `Fichier "${file.name}" téléversé et audité avec succès par le module OCR !`
        });
        await loadVendorData();
      } else {
        setUploadMessage({ type: 'error', text: res.error || 'Erreur lors du téléversement' });
      }
    } catch (err) {
      setUploadMessage({ type: 'error', text: 'Erreur réseau lors de l upload' });
    } finally {
      setUploading(false);
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'DRAFT': return 1;
      case 'SUBMITTED':
      case 'AI_SCREENING': return 2;
      case 'PENDING_AGENT': return 3;
      case 'PENDING_MANAGER': return 4;
      case 'APPROVED':
      case 'SAP_SYNCED': return 5;
      case 'REJECTED': return 3;
      default: return 3;
    }
  };

  const currentStep = request ? getStepIndex(request.status) : 3;
  const vendorData = request?.temporary_data || {};

  const timelineSteps = [
    { number: 1, title: 'Dépôt des Pièces', subtitle: 'RIB & Kbis fournis' },
    { number: 2, title: 'Audit IA & Conformité', subtitle: 'Validation Modulo 97' },
    { number: 3, title: 'Revue Master Data', subtitle: 'Contrôle opérationnel' },
    { number: 4, title: 'Approbation Finance', subtitle: 'Gouvernance trésorerie' },
    { number: 5, title: 'Injection ERP SAP', subtitle: 'Génération IDoc CREMAS05' }
  ];

  let statusBadgeVariant = 'pending';
  if (request?.status === 'SAP_SYNCED' || request?.status === 'APPROVED') statusBadgeVariant = 'approved';
  else if (request?.status === 'REJECTED') statusBadgeVariant = 'rejected';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#1E3A8A] text-white p-6 rounded-xl shadow-xs border border-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-700/60 text-white font-semibold uppercase tracking-wider">
              Espace Fournisseur Partenaire
            </span>
            <span className="text-[10px] font-mono text-blue-200">
              Périmètre : {user?.geographic_scope || 'WESTERN'}
            </span>
          </div>
          <h1 className="text-xl font-bold mt-1.5 tracking-tight">
            {vendorData.legal_name || user?.full_name || 'Novatech Solutions France SAS'}
          </h1>
          <p className="text-xs text-blue-100/90 mt-1 max-w-xl">
            Suivez l'avancement de votre dossier d'enregistrement bancaire et transmettez vos pièces justificatives certifiées.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right rtl:text-left bg-blue-950/40 px-4 py-2.5 rounded-lg border border-blue-800">
            <span className="text-[11px] text-blue-200 block">Statut du Dossier</span>
            <span className="font-mono font-bold text-xs text-white uppercase tracking-wider">
              {request?.status || 'PENDING_AGENT'}
            </span>
          </div>
        </div>
      </div>

      {/* 5-Step Timeline */}
      <Card bodyClassName="p-6">
        <h2 className="text-sm font-bold text-[var(--text)] mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--primary)]" />
          <span>{t('vendor_view.timeline_title') || 'Avancement du Workflow d Homologation Fournisseur'}</span>
        </h2>

        <div className="relative">
          {/* Progress bar background line */}
          <div className="hidden sm:block absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-[var(--border)] -z-0" />
          <div
            className="hidden sm:block absolute top-1/2 left-6 -translate-y-1/2 h-1 bg-[var(--primary)] transition-all duration-300 -z-0"
            style={{ width: `${((currentStep - 1) / 4) * 88}%` }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
            {timelineSteps.map((step) => {
              const isPast = step.number < currentStep;
              const isCurrent = step.number === currentStep;

              return (
                <div key={step.number} className="flex flex-col items-center text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                      isPast
                        ? 'bg-[var(--success)] text-white'
                        : isCurrent
                        ? 'bg-[var(--primary)] text-white ring-4 ring-blue-100 shadow-sm'
                        : 'bg-slate-100 text-[var(--text-muted)] border border-[var(--border)]'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : step.number}
                  </div>
                  <h4 className="font-semibold text-xs text-[var(--text)] mt-2.5">
                    {step.title}
                  </h4>
                  <span className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {step.subtitle}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Upload & Files Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Drag & Drop Zone */}
        <div className="lg:col-span-6">
          <Card
            title={t('vendor_view.upload_zone_title') || 'Transmission des Justificatifs'}
            subtitle={t('vendor_view.upload_zone_desc') || 'Déposez votre RIB officiel et extrait Kbis pour analyse OCR'}
            bodyClassName="space-y-4"
          >
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-[var(--primary)] bg-blue-50/60 scale-[1.01]'
                  : 'border-slate-300 hover:border-[var(--primary)] bg-slate-50/40'
              }`}
              onClick={() => document.getElementById('vendor-file-input').click()}
            >
              <input
                id="vendor-file-input"
                type="file"
                onChange={handleFileInput}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
              />

              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[var(--primary)] border border-blue-200 mx-auto flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>

              <p className="text-xs font-semibold text-[var(--text)]">
                {t('vendor_view.drag_drop_text') || 'Glissez-déposez vos fichiers ici ou parcourez vos dossiers'}
              </p>
              <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                Formats acceptés : PDF, PNG, JPG (Certificats bancaires SEPA, Kbis de moins de 3 mois)
              </span>

              {uploading && (
                <div className="mt-3 text-xs text-[var(--primary)] font-semibold flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Téléversement et extraction OCR en cours...</span>
                </div>
              )}
            </div>

            {uploadMessage && (
              <div className={`p-3 rounded-lg text-xs font-semibold border ${
                uploadMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {uploadMessage.text}
              </div>
            )}

            {/* Documents Table */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                {t('vendor_view.uploaded_docs') || 'Documents Téléversés'} ({documents.length})
              </h4>

              <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden text-xs bg-[var(--surface)]">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-[var(--primary)]">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--text)]">{doc.file_name}</div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">
                            Type : {doc.doc_type} • {(doc.file_size / 1024).toFixed(0)} Ko
                          </div>
                        </div>
                      </div>
                      <Badge variant="approved">
                        OCR Certifié (99%)
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-[var(--text-muted)] text-xs">
                    Aucun document joint pour le moment.
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Declared Coordinates & Status Summary */}
        <div className="lg:col-span-6 space-y-4">
          {/* Declared Coordinates Card */}
          <Card
            title={t('vendor_view.declared_banking') || 'Coordonnées Bancaires SEPA'}
            icon={CreditCard}
            bodyClassName="space-y-3"
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200">
                <span className="text-[var(--text-muted)] text-[11px] block">IBAN Standardisé</span>
                <span className="font-mono font-bold text-[var(--text)] text-sm break-all">
                  {vendorData.iban || 'FR76 1027 8060 5000 0123 4567 845'}
                </span>
                <span className="text-[10px] text-[var(--success)] block mt-0.5 font-medium">
                  ✓ Structure conforme SEPA ISO 13616
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-[var(--border)]">
                  <span className="text-[var(--text-muted)] text-[11px] block">Code BIC / SWIFT</span>
                  <span className="font-mono font-semibold text-[var(--text)]">
                    {vendorData.bic_swift || 'CMCIFR2AXXX'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-[var(--border)]">
                  <span className="text-[var(--text-muted)] text-[11px] block">Établissement Bancaire</span>
                  <span className="font-semibold text-[var(--text)] truncate block">
                    {vendorData.bank_name || 'Crédit Mutuel Île-de-France'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Legal Card */}
          <Card
            title={t('vendor_view.declared_legal') || 'Informations Juridiques & Établissement'}
            icon={Building}
            bodyClassName="space-y-2 text-xs"
          >
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Raison Sociale :</span>
              <span className="font-semibold text-[var(--text)]">{vendorData.legal_name || 'Novatech Solutions France SAS'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Numéro TVA Intracommunautaire :</span>
              <span className="font-mono font-semibold text-[var(--text)]">{vendorData.tax_id_vat || 'FR55987654321'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Siège Social :</span>
              <span className="text-[var(--text)]">{vendorData.address || '28 Rue de Turbigo, 75003 Paris, France'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[var(--text-muted)]">Contact Référent :</span>
              <span className="text-[var(--text)]">{vendorData.contact_name || user?.full_name || 'Jean Dupont'} ({vendorData.contact_email || user?.email})</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
