import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Globe,
  Sun,
  Moon,
  LogOut,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

export default function Header({ currentView, onOpenRag, onOpenCatalog }) {
  const { t, i18n } = useTranslation();
  const { user, logout, darkMode, toggleDarkMode } = useAuth();

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'vendor':
        return t('vendor_view.timeline_title');
      case 'requester':
        return t('requester_view.title');
      case 'agent':
        return t('agent_view.title');
      case 'manager':
        return t('manager_view.title');
      case 'admin':
        return t('admin_view.title');
      case 'analytics':
        return t('nav.analytics');
      default:
        return t('nav.dashboard');
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Current View Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div>
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <span>Plateforme TUI Finance</span>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300 capitalize">{user?.role?.toLowerCase()}</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            {getViewTitle()}
          </h2>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Assistant RAG Trigger */}
        <button
          onClick={onOpenRag}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold hover:bg-purple-100 transition-colors"
          title="Assistant Réglementaire TUI Master Data"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Assistant IA RAG</span>
        </button>

        {/* Language Selector Dropdown / Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-xs">
          <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          <button
            onClick={() => handleLanguageChange('fr')}
            className={`px-2 py-0.5 rounded transition-all ${
              i18n.language === 'fr'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            FR
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`px-2 py-0.5 rounded transition-all ${
              i18n.language === 'en'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => handleLanguageChange('ar')}
            className={`px-2 py-0.5 rounded transition-all ${
              i18n.language === 'ar'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            العربية
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          title={darkMode ? t('nav.light_mode') : t('nav.dark_mode')}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
        </button>

        {/* User Badge */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="text-left text-xs leading-tight">
            <div className="font-semibold text-slate-900 dark:text-white">{user?.full_name}</div>
            <div className="text-[10px] text-slate-400 font-mono">{user?.role}</div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg text-xs font-semibold transition-colors"
          title={t('nav.logout')}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('nav.logout')}</span>
        </button>
      </div>
    </header>
  );
}
