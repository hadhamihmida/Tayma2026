import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Globe,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  Menu
} from 'lucide-react';

export default function Header({
  currentView,
  onOpenRag,
  onOpenCatalog,
  onToggleMobile
}) {
  const { t, i18n } = useTranslation();
  const { user, logout, darkMode, toggleDarkMode } = useAuth();

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'vendor':
        return t('vendor_view.timeline_title') || 'Dossier Fournisseur & Justificatifs';
      case 'requester':
        return t('requester_view.title') || "Portail Demandeur d'Onboarding";
      case 'agent':
        return t('agent_view.title') || 'File de Revue Opérationnelle Agent';
      case 'manager':
        return t('manager_view.title') || 'Tableau de Gouvernance & Validation Manager';
      case 'admin':
        return t('admin_view.title') || 'Administration & Piste d Audit SOX';
      case 'analytics':
        return t('nav.analytics') || 'Analytique & Prévisions Temporelles IA';
      default:
        return t('nav.dashboard') || 'Tableau de Bord';
    }
  };

  return (
    <header className="h-16 bg-[var(--surface)] border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Current View Title, Breadcrumb & Mobile Menu Button */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1.5">
            <span>TUI Finance</span>
            <span>/</span>
            <span className="text-[var(--text)] font-semibold capitalize">
              {user?.role?.toLowerCase().replace(/_/g, ' ')}
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-[var(--text)] tracking-tight">
            {getViewTitle()}
          </h2>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Assistant RAG Trigger */}
        <button
          onClick={onOpenRag}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[var(--primary)] border border-blue-200 rounded-lg text-xs font-semibold transition-colors duration-150"
          title="Assistant Réglementaire TUI Master Data"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span>Assistant IA RAG</span>
        </button>

        {/* Language Selector Dropdown / Buttons */}
        <div className="flex items-center gap-1 bg-slate-50 border border-[var(--border)] rounded-lg p-0.5 text-xs">
          <Globe className="w-3.5 h-3.5 text-[var(--text-muted)] ml-1.5 rtl:ml-0 rtl:mr-1.5" />
          <button
            onClick={() => handleLanguageChange('fr')}
            className={`px-2 py-1 rounded transition-all duration-150 font-medium ${
              i18n.language === 'fr'
                ? 'bg-[var(--primary)] text-white font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            FR
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`px-2 py-1 rounded transition-all duration-150 font-medium ${
              i18n.language === 'en'
                ? 'bg-[var(--primary)] text-white font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => handleLanguageChange('ar')}
            className={`px-2 py-1 rounded transition-all duration-150 font-medium ${
              i18n.language === 'ar'
                ? 'bg-[var(--primary)] text-white font-bold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            العربية
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-slate-50 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-slate-100 transition-colors"
          title={darkMode ? t('nav.light_mode') || 'Mode Clair' : t('nav.dark_mode') || 'Mode Sombre'}
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--primary)]" />
          )}
        </button>

        {/* User Badge */}
        <div className="hidden sm:flex items-center gap-2.5 pl-2.5 rtl:pl-0 rtl:pr-2.5 border-l rtl:border-l-0 rtl:border-r border-[var(--border)]">
          <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-xs">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="text-left rtl:text-right text-xs leading-tight">
            <div className="font-semibold text-[var(--text)]">{user?.full_name}</div>
            <div className="text-[10px] text-[var(--text-muted)] font-mono">{user?.role}</div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-[var(--danger)] hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors duration-150"
          title={t('nav.logout') || 'Déconnexion'}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('nav.logout') || 'Déconnexion'}</span>
        </button>
      </div>
    </header>
  );
}
