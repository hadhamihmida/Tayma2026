import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  BarChart3,
  Bot,
  Database,
  Building,
  CheckSquare,
  X,
  Sparkles
} from 'lucide-react';

export default function Sidebar({
  currentView,
  setCurrentView,
  onOpenRag,
  onOpenCatalog,
  mobileOpen = false,
  onCloseMobile
}) {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role;

  // Build menu items based strictly on user's authorized role
  const getMenuItems = () => {
    switch (role) {
      case 'VENDOR':
        return [
          {
            id: 'vendor',
            label: 'Mon Dossier Fournisseur',
            icon: Building,
            badge: 'RIB / Kbis'
          }
        ];

      case 'REQUESTER':
        return [
          {
            id: 'requester',
            label: "Mes Demandes d'Onboarding",
            icon: FileText,
            badge: user.geographic_scope
          }
        ];

      case 'MASTER_DATA_AGENT':
        return [
          {
            id: 'agent',
            label: 'File de Contrôle Opérationnel',
            icon: CheckSquare,
            badge: 'Queue'
          },
          {
            id: 'analytics',
            label: 'Métriques & Modèles IA',
            icon: BarChart3
          }
        ];

      case 'MANAGER_APPROVAL':
        return [
          {
            id: 'manager',
            label: 'Gouvernance & Approbation',
            icon: ShieldCheck,
            badge: 'Manager'
          },
          {
            id: 'analytics',
            label: 'Métriques & Prévisions IA',
            icon: BarChart3
          }
        ];

      case 'ADMIN':
        return [
          {
            id: 'admin',
            label: t('admin_view.title') || 'Administration Système',
            icon: ShieldAlert,
            badge: 'Admin'
          },
          {
            id: 'manager',
            label: 'Revue Décisionnelle',
            icon: ShieldCheck
          },
          {
            id: 'agent',
            label: 'Contrôle Opérationnel',
            icon: CheckSquare
          },
          {
            id: 'analytics',
            label: 'Analytique & Data Science',
            icon: BarChart3
          }
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleSelectView = (id) => {
    setCurrentView(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed inset-y-0 z-50 lg:static lg:z-auto w-64 bg-[#1E3A8A] text-white flex flex-col justify-between shrink-0 select-none shadow-xl lg:shadow-none transition-transform duration-200 ease-in-out border-r rtl:border-r-0 rtl:border-l border-blue-900/60 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 rtl:translate-x-full rtl:lg:translate-x-0'
        } left-0 rtl:left-auto rtl:right-0`}
      >
        {/* Brand Section */}
        <div>
          <div className="h-16 px-5 border-b border-blue-900/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white text-[#1E3A8A] flex items-center justify-center font-black text-sm shadow-sm">
                MD
              </div>
              <div className="truncate">
                <div className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
                  <span>Master Data IA</span>
                  <span className="text-[10px] bg-blue-800 text-blue-200 font-mono px-1.5 py-0.2 rounded border border-blue-700/60">
                    SOX
                  </span>
                </div>
                <p className="text-[11px] text-blue-200/80 truncate">TUI Group Finance</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-blue-800 transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Persona Card in Sidebar */}
          <div className="p-3 m-3 bg-blue-950/50 border border-blue-800/70 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/30 text-blue-100 flex items-center justify-center font-bold text-xs uppercase border border-blue-400/30">
                {user.full_name?.substring(0, 2) || 'MD'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-white truncate">{user.full_name}</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-600/60 text-white border border-blue-400/40 uppercase">
                    {user.role}
                  </span>
                  {user.geographic_scope && (
                    <span className="text-[9px] font-mono text-blue-200/90 truncate">
                      {user.geographic_scope}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300/80">
              Navigation
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-200'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-blue-700 text-white font-semibold'
                          : 'bg-blue-900/80 text-blue-200 border border-blue-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick Tools Section */}
            <div className="pt-4 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300/80">
              Outils & Référentiels
            </div>

            <button
              onClick={() => {
                onOpenCatalog();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-blue-100 hover:text-white hover:bg-blue-800/60 transition-colors"
            >
              <Database className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{t('nav.catalog') || 'Catalogue SAP S/4HANA'}</span>
            </button>

            <button
              onClick={() => {
                onOpenRag();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-blue-100 hover:text-white hover:bg-blue-800/60 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{t('nav.rag') || 'Assistant IA RAG'}</span>
            </button>
          </nav>
        </div>

        {/* Footer Info in Sidebar */}
        <div className="p-4 border-t border-blue-900/80 text-[11px] text-blue-200/80 space-y-1 bg-[#1A347D]">
          <div className="flex items-center justify-between">
            <span>Sécurité ISO 13616</span>
            <span className="text-emerald-300 font-mono font-bold">Actif</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Moteur SEPA Modulo 97</span>
            <span className="text-emerald-300 font-mono font-bold">OK</span>
          </div>
          <p className="text-[10px] text-blue-300/60 pt-1.5">© 2026 TUI Group Finance</p>
        </div>
      </aside>
    </>
  );
}
