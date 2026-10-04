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
  Building2,
  FileCheck,
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
      setErrorMessage(t('auth.invalid_credentials'));
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
          setErrorMessage(res.error || t('auth.invalid_credentials'));
        }
      }
    } catch (err) {
      setErrorMessage(t('auth.invalid_credentials'));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-xl">
            MD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-lg text-white">
                {t('app.title')}
              </span>
              <span className="text-[10px] bg-blue-500/20 border border-blue-400/30 text-blue-300 font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                v2.0 PROD
              </span>
            </div>
            <p className="text-xs text-slate-400">{t('app.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="relative flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-lg p-1 text-xs">
            <Globe className="w-4 h-4 text-slate-400 ml-1.5" />
            <button
              onClick={() => handleLanguageChange('fr')}
              className={`px-2 py-1 rounded transition-colors ${
                i18n.language === 'fr'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-1 rounded transition-colors ${
                i18n.language === 'en'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageChange('ar')}
              className={`px-2 py-1 rounded transition-colors ${
                i18n.language === 'ar'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              العربية
            </button>
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title={darkMode ? t('nav.light_mode') : t('nav.dark_mode')}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-300" />}
          </button>
        </div>
      </header>

      {/* Main Content Form Area */}
      <main className="flex-1 flex items-center justify-center p-6 my-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl p-8 backdrop-blur-xl relative overflow-hidden">
          {/* Subtle accent glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t('auth.login_title')}</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">{t('auth.login_desc')}</p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-start gap-3 text-xs text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-300">{errorMessage}</p>
                {lockoutInfo && (
                  <p className="mt-1 text-slate-300">
                    Temps d attente estimé : <strong className="text-white">{lockoutInfo.remainingMinutes} min</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t('auth.email_label')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.email_placeholder')}
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  {t('auth.password_label')}
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  {t('auth.forgot_password')}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password_placeholder')}
                  required
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  title={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('auth.btn_logging_in')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.btn_login')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Compliance & Security Callout */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              SOX & SEPA Modulo 97
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              Gouvernance IA (5 Moteurs)
            </span>
          </div>
        </div>
      </main>

      {/* Discreet Demo Personas Bar for Soutenance */}
      <footer className="px-6 py-4 bg-slate-950/70 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white tracking-wide">
                {t('auth.demo_title')}
              </span>
              <span className="text-[11px] text-slate-400">
                ({t('auth.demo_subtitle')})
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {t('auth.demo_universal_pwd')} <span className="text-amber-400 font-bold">Password123!</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {personas.map((p) => {
              const isSelected = email === p.email;
              return (
                <button
                  key={p.email}
                  onClick={() => handleDemoClick(p)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all text-xs ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{p.avatar}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${p.badgeClass}`}>
                      {p.role}
                    </span>
                  </div>
                  <strong className="text-white text-xs truncate">{p.full_name}</strong>
                  <span className="text-[11px] text-slate-400 truncate">{p.email}</span>
                  <span className="text-[10px] text-blue-400/80 mt-1 font-mono">Scope: {p.scope}</span>
                </button>
              );
            })}
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{t('auth.forgot_modal_title')}</h3>
                <p className="text-xs text-slate-400">{t('auth.forgot_modal_desc')}</p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                {forgotSuccess}
              </div>
            )}

            {!generatedDemoToken ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('auth.email_label')}
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="agent.global@group.com"
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
                  >
                    {t('auth.btn_send_reset')}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordConfirm} className="space-y-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
                  <p className="font-semibold mb-1">Mode Démonstration Actif :</p>
                  <p className="font-mono text-[11px] break-all">Jeton : {generatedDemoToken}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('auth.reset_token_label')}
                  </label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('auth.new_password_label')}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nouveau mot de passe"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
                  >
                    {t('auth.btn_confirm_reset')}
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
