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
  const { login, switchDemoAccount, personas, darkMode, toggleDarkMode } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockoutInfo, setLockoutInfo] = useState(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [generatedDemoToken, setGeneratedDemoToken] = useState('');

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

  const handleDemoClick = async (persona) => {
    setEmail(persona.email);
    setPassword('Password123!');
    setErrorMessage('');
    setLockoutInfo(null);
    setLoading(true);
    try {
      await switchDemoAccount(persona);
    } catch (err) {
      setErrorMessage('Erreur lors de la connexion démo');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotError('');
    setForgotSuccess('');

    try {
      const res = await api.forgotPassword(forgotEmail);
      if (res.success) {
        setForgotSuccess(res.message);
        if (res.demo_reset_token) {
          setGeneratedDemoToken(res.demo_reset_token);
          setResetToken(res.demo_reset_token);
        }
      } else {
        setForgotError(res.error || 'Erreur lors de la demande');
      }
    } catch (err) {
      setForgotError('Erreur réseau');
    }
  };

  const handleResetPasswordConfirm = async (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;
    setForgotError('');

    try {
      const res = await api.resetPassword(resetToken, newPassword);
      if (res.success) {
        setForgotSuccess(res.message);
        setTimeout(() => {
          setShowForgotModal(false);
          setPassword(newPassword);
          setEmail(forgotEmail);
          setForgotSuccess('');
          setGeneratedDemoToken('');
        }, 1800);
      } else {
        setForgotError(res.error || 'Erreur lors de la réinitialisation');
      }
    } catch (err) {
      setForgotError('Erreur réseau');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EFF6FF] via-[#F5F8FD] to-[#DBEAFE]/40 text-[var(--text)] flex flex-col justify-between selection:bg-[var(--primary)] selection:text-white">
      {/* Top Header Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center shadow-md font-bold text-lg">
            MD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-base sm:text-lg text-[var(--text)]">
                {t('app.title') || 'Master Data IA'}
              </span>
              <span className="text-[10px] bg-blue-50 border border-blue-200 text-[var(--primary)] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                v2.0 PROD
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">{t('app.subtitle') || 'TUI Group Finance'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-slate-50 border border-[var(--border)] rounded-lg p-0.5 text-xs">
            <Globe className="w-3.5 h-3.5 text-[var(--text-muted)] ml-1.5 rtl:ml-0 rtl:mr-1.5" />
            <button
              onClick={() => handleLanguageChange('fr')}
              className={`px-2 py-1 rounded transition-colors font-medium ${
                i18n.language === 'fr'
                  ? 'bg-[var(--primary)] text-white font-bold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-1 rounded transition-colors font-medium ${
                i18n.language === 'en'
                  ? 'bg-[var(--primary)] text-white font-bold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageChange('ar')}
              className={`px-2 py-1 rounded transition-colors font-medium ${
                i18n.language === 'ar'
                  ? 'bg-[var(--primary)] text-white font-bold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              العربية
            </button>
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-slate-50 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-slate-100 transition-colors"
            title={darkMode ? t('nav.light_mode') || 'Mode Clair' : t('nav.dark_mode') || 'Mode Sombre'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-[var(--primary)]" />}
          </button>
        </div>
      </header>

      {/* Main Content Form Area: Centered Card on Soft Blue Gradient */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-md p-6 sm:p-8 relative">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-50 text-[var(--primary)] border border-blue-200 rounded-xl mx-auto flex items-center justify-center shadow-xs mb-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
              {t('auth.login_title') || 'Connexion Sécurisée'}
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs mx-auto">
              {t('auth.login_desc') || 'Plateforme de gouvernance et conformité Master Data'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-[var(--danger)] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMessage}</p>
                {lockoutInfo && (
                  <p className="mt-1 text-slate-700">
                    Temps d attente estimé : <strong>{lockoutInfo.remainingMinutes} min</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                {t('auth.email_label') || 'Adresse Email Professionnelle'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.email_placeholder') || 'nom@group.com'}
                  required
                  className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--text)] placeholder-slate-400 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100 transition-all duration-150"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[var(--text)]">
                  {t('auth.password_label') || 'Mot de Passe'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-[var(--primary)] hover:underline transition-colors font-medium"
                >
                  {t('auth.forgot_password') || 'Mot de passe oublié ?'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password_placeholder') || '••••••••'}
                  required
                  className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-10 rtl:pr-3 rtl:pl-10 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--text)] placeholder-slate-400 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100 transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-slate-400 hover:text-slate-600"
                  title={showPassword ? t('auth.hide_password') || 'Masquer' : t('auth.show_password') || 'Afficher'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-[var(--primary)] hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('auth.btn_logging_in') || 'Authentification en cours...'}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.btn_login') || 'Se connecter'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Compliance & Security Callout */}
          <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-[var(--success)]" />
              SOX & SEPA Modulo 97
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[var(--primary)]" />
              Gouvernance IA (5 Moteurs)
            </span>
          </div>
        </div>
      </main>

      {/* Discreet Demo Personas Bar in Blue/White Aesthetic */}
      <footer className="px-6 py-4 bg-[var(--surface)] border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-[var(--text)] tracking-wide">
                {t('auth.demo_title') || 'Accès Démo Personas'}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                ({t('auth.demo_subtitle') || 'Sélection en 1 clic'})
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-mono">
              {t('auth.demo_universal_pwd') || 'Mot de passe universel :'} <span className="text-[var(--primary)] font-bold">Password123!</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {personas.map((p) => {
              const isSelected = email === p.email;
              return (
                <button
                  key={p.email}
                  onClick={() => handleDemoClick(p)}
                  className={`flex flex-col text-left rtl:text-right p-2.5 rounded-lg border transition-all duration-150 text-xs ${
                    isSelected
                      ? 'bg-[var(--primary-light)] border-[var(--primary)] shadow-xs'
                      : 'bg-[var(--surface)] border-[var(--border)] hover:border-blue-300 hover:bg-blue-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{p.avatar}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                      {p.role}
                    </span>
                  </div>
                  <strong className="text-[var(--text)] text-xs truncate">{p.full_name}</strong>
                  <span className="text-[11px] text-[var(--text-muted)] truncate">{p.email}</span>
                  <span className="text-[10px] text-[var(--primary)] mt-1 font-mono">Scope: {p.scope}</span>
                </button>
              );
            })}
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[var(--primary)]">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">
                  {t('auth.forgot_modal_title') || 'Réinitialisation de mot de passe'}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {t('auth.forgot_modal_desc') || 'Saisissez votre email professionnel'}
                </p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                {forgotSuccess}
              </div>
            )}

            {!generatedDemoToken ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    {t('auth.email_label') || 'Adresse Email'}
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="agent.global@group.com"
                    required
                    className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] placeholder-slate-400 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-2 border border-[var(--border)] bg-[var(--surface)] hover:bg-slate-100 text-[var(--text)] text-xs rounded-lg transition-colors"
                  >
                    {t('common.cancel') || 'Annuler'}
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-[var(--primary)] hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    {t('auth.btn_send_reset') || 'Envoyer le lien'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordConfirm} className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-[var(--primary)]">
                  <p className="font-semibold mb-1">Mode Démonstration Actif :</p>
                  <p className="font-mono text-[11px] break-all">Jeton : {generatedDemoToken}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    {t('auth.reset_token_label') || 'Jeton de Réinitialisation'}
                  </label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    {t('auth.new_password_label') || 'Nouveau Mot de Passe'}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nouveau mot de passe"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-2 border border-[var(--border)] bg-[var(--surface)] hover:bg-slate-100 text-[var(--text)] text-xs rounded-lg transition-colors"
                  >
                    {t('common.cancel') || 'Annuler'}
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-[var(--success)] hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    {t('auth.btn_confirm_reset') || 'Confirmer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
