import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  Globe,
  Sun,
  Moon,
  CheckCircle,
  KeyRound,
  ArrowRight,
  Cpu
} from 'lucide-react';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login, darkMode, toggleDarkMode } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockoutInfo, setLockoutInfo] = useState(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage(t('auth.invalid_credentials') || 'Veuillez saisir votre email et mot de passe.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setLockoutInfo(null);

    try {
      const res = await login(email, password);
      if (!res.success) {
        if (res.locked) {
          setLockoutInfo({
            remainingMinutes: res.remainingMinutes || 15
          });
          setErrorMessage(res.error);
        } else {
          setErrorMessage(res.error || t('auth.invalid_credentials') || 'Identifiants invalides');
        }
      }
    } catch (err) {
      setErrorMessage(t('auth.invalid_credentials') || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const res = await api.forgotPassword(forgotEmail);
      if (res.success) {
        setForgotSuccess(res.message || 'Si cette adresse est enregistrée, un lien de réinitialisation sécurisé vous a été envoyé par e-mail.');
      } else {
        setForgotError(res.error || 'Erreur lors de la demande de réinitialisation.');
      }
    } catch (err) {
      setForgotError('Erreur de communication avec le serveur.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Top Navbar: Brand + Language + Theme */}
      <header className="px-6 py-4 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white shadow-sm font-black text-lg">
            TUI
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-[var(--text)] block">
              TUI Group Finance
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-mono block">
              Procure-to-Pay • Master Data Platform
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-[var(--bg)] p-1 rounded-lg border border-[var(--border)] text-xs">
            <Globe className="w-3.5 h-3.5 text-[var(--text-muted)] ml-1" />
            <button
              onClick={() => handleLanguageChange('fr')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                i18n.language === 'fr'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                i18n.language === 'en'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageChange('ar')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                i18n.language === 'ar'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              العربية
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-slate-100 text-[var(--text-muted)] transition-colors"
            title={darkMode ? t('nav.light_mode') : t('nav.dark_mode')}
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* Main Content: Split Screen Corporate Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          
          {/* Left Hero Panel: Corporate Trust & SOX Compliance */}
          <div className="lg:col-span-5 bg-[var(--primary-dark)] text-white p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-xs mb-6 border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                <span>Certification SOX & SEPA</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-3">
                Gouvernance Référentiel Fournisseurs
              </h2>
              <p className="text-blue-100/80 text-xs leading-relaxed">
                Plateforme d'homologation des tiers, détection anti-fraude bancaire par IA explicable et synchronisation certifiée SAP S/4HANA.
              </p>
            </div>

            <div className="space-y-3 my-8 relative z-10 text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-blue-100">Contrôle de clé Modulo 97 (ISO 13616)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-blue-100">Piste d'audit inaltérable chaînée SHA-256</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-blue-100">Isolation par périmètres projets configurables</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-blue-100">Décision humaine finale (Manager Approval)</span>
              </div>
            </div>

            <div className="relative z-10 pt-4 border-t border-white/10 text-[11px] text-blue-200/70 font-mono flex items-center justify-between">
              <span>TUI Group Finance © 2026</span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-blue-300" /> IA v1.0
              </span>
            </div>
          </div>

          {/* Right Panel: Official Login Form */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-[var(--text)] tracking-tight">
                {t('auth.login_title') || 'Connexion Sécurisée'}
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {t('auth.login_desc') || 'Saisissez vos identifiants professionnels nominatifs'}
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div
                className={`mb-5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  lockoutInfo
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-[var(--danger)]'
                }`}
                role="alert"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{errorMessage}</p>
                  {lockoutInfo && (
                    <p className="mt-1 text-[11px] opacity-90">
                      Pour débloquer votre accès immédiatement, utilisez la réinitialisation par mot de passe oublié.
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5" htmlFor="login-email">
                  {t('auth.email_label') || 'Adresse Email Professionnelle'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prenom.nom@tui.com"
                    autoComplete="username"
                    required
                    className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] placeholder-slate-400 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[var(--text)]" htmlFor="login-password">
                    {t('auth.password_label') || 'Mot de passe'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-[var(--primary)] hover:underline font-medium"
                  >
                    {t('auth.forgot_password') || 'Mot de passe oublié ?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-10 rtl:pr-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] placeholder-slate-400 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] p-1"
                    aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('auth.btn_logging_in') || 'Vérification en cours...'}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.btn_login') || 'Se Connecter'}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[var(--primary)]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text)]">
                  {t('auth.forgot_modal_title') || 'Réinitialisation de mot de passe'}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {t('auth.forgot_modal_desc') || 'Saisissez votre email professionnel'}
                </p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-[var(--danger)]">
                {forgotError}
              </div>
            )}

            {forgotSuccess ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-[var(--success)] font-medium">
                  {forgotSuccess}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess('');
                    setForgotEmail('');
                  }}
                  className="w-full py-2 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg"
                >
                  {t('common.close') || 'Fermer'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    {t('auth.email_label') || 'Adresse Email'}
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="prenom.nom@tui.com"
                    required
                    className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-2 border border-[var(--border)] bg-[var(--surface)] hover:bg-slate-100 text-[var(--text)] text-xs rounded-lg"
                  >
                    {t('common.cancel') || 'Annuler'}
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-3.5 py-2 bg-[var(--primary)] hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    {forgotLoading ? 'Envoi...' : (t('auth.btn_send_reset') || 'Envoyer le lien')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Clean Corporate Footer */}
      <footer className="px-6 py-3 bg-[var(--surface)] border-t border-[var(--border)] text-center text-[11px] text-[var(--text-muted)]">
        Master Data IA • Plateforme de Gouvernance Tiers Sécurisée • Conforme RGPD, SOX & SEPA
      </footer>
    </div>
  );
}
