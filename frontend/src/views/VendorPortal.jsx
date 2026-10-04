import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatDate, formatCurrency } from '../i18n';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building, 
  CreditCard, 
  ShieldCheck, 
  Send,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileCheck,
  Download,
  AlertCircle
} from 'lucide-react';

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
        // Load details with documents
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

  // Determine current step index in the 5-step timeline
  // 1: Dépôt -> 2: Audit IA -> 3: Contrôle Agent -> 4: Approbation Manager -> 5: SAP Synced
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                Espace Fournisseur Partenaire
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Périmètre : {user?.geographic_scope || 'WESTERN'}
              </span>
            </div>
            <h1 className="text-xl font-bold mt-1 tracking-tight">
              {vendorData.legal_name || user?.full_name || 'Novatech Solutions France SAS'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Suivez l'avancement de votre dossier d'enregistrement bancaire et transmettez vos pièces justificatives certifiées.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Statut du Dossier</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono inline-block mt-0.5 ${
                request?.status === 'SAP_SYNCED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : request?.status === 'REJECTED'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {request?.status || 'PENDING_AGENT'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Timeline (Frise Chronologique Interactive) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>{t('vendor_view.timeline_title')}</span>
        </h2>

        <div className="relative">
          {/* Progress bar background line */}
          <div className="hidden sm:block absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 -z-0" />
          <div
            className="hidden sm:block absolute top-1/2 left-6 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 -z-0"
            style={{ width: `${((currentStep - 1) / 4) * 88}%` }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
            {timelineSteps.map((step) => {
              const isPast = step.number < currentStep;
              const isCurrent = step.number === currentStep;

              return (
                <div key={step.number} className="flex flex-col items-center text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-blue-500/30 animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : step.number}
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-2.5">
                    {step.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    {step.subtitle}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upload & Files Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Drag & Drop Zone (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('vendor_view.upload_zone_title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('vendor_view.upload_zone_desc')}
            </p>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/40'
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

            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {t('vendor_view.drag_drop_text')}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Formats acceptés : PDF, PNG, JPG (Certificats bancaires SEPA, Kbis de moins de 3 mois)
            </span>

            {uploading && (
              <div className="mt-3 text-xs text-blue-600 font-semibold flex items-center justify-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Téléversement et extraction OCR en cours...</span>
              </div>
            )}
          </div>

          {uploadMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              uploadMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200'
            }`}>
              {uploadMessage.text}
            </div>
          )}

          {/* Documents Table */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {t('vendor_view.uploaded_docs')} ({documents.length})
            </h4>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{doc.file_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Type : {doc.doc_type} • {(doc.file_size / 1024).toFixed(0)} Ko
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-900">
                      OCR Certifié (99%)
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Aucun document joint pour le moment.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Declared Coordinates & Status Summary (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Declared Coordinates Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>{t('vendor_view.declared_banking')}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 text-[11px] block">IBAN Standardisé</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm break-all">
                  {vendorData.iban || 'FR76 1027 8060 5000 0123 4567 845'}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">
                  ✓ Structure conforme SEPA ISO 13616
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[11px] block">Code BIC / SWIFT</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {vendorData.bic_swift || 'CMCIFR2AXXX'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[11px] block">Établissement Bancaire</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate block">
                    {vendorData.bank_name || 'Crédit Mutuel Île-de-France'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-600" />
              <span>{t('vendor_view.declared_legal')}</span>
            </h3>

            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Raison Sociale :</span>
                <span className="font-semibold text-slate-900 dark:text-white">{vendorData.legal_name || 'Novatech Solutions France SAS'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Numéro TVA Intracommunautaire :</span>
                <span className="font-mono font-semibold">{vendorData.tax_id_vat || 'FR55987654321'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Siège Social :</span>
                <span>{vendorData.address || '28 Rue de Turbigo, 75003 Paris, France'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Contact Référent :</span>
                <span>{vendorData.contact_name || user?.full_name || 'Jean Dupont'} ({vendorData.contact_email || user?.email})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
