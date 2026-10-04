import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  BarChart3,
  Bot,
  Database,
  Users,
  Settings,
  HelpCircle,
  Building,
  CheckSquare
} from 'lucide-react';

export default function Sidebar({
  currentView,
  setCurrentView,
  onOpenRag,
  onOpenCatalog
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
            label: 'Mes Demandes d Onboarding',
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
            label: t('admin_view.title'),
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

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Section */}
      <div>
        <div className="h-16 px-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-blue-600/20">
            MD
          </div>
          <div className="truncate">
            <div className="font-extrabold text-white text-sm tracking-tight flex items-center gap-1.5">
              <span>Master Data IA</span>
              <span className="text-[9px] bg-blue-500/20 text-blue-300 font-mono px-1.5 py-0.2 rounded border border-blue-400/30">
                SOX
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">TUI Group Finance</p>
          </div>
        </div>

        {/* User Persona Card in Sidebar */}
        <div className="p-3 m-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs uppercase border border-blue-400/20">
              {user.full_name?.substring(0, 2) || 'MD'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-white truncate">{user.full_name}</h4>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30 uppercase">
                  {user.role}
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {user.geographic_scope}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 py-2 space-y-1">
          <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Navigation Principale
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Tools Section */}
          <div className="pt-4 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Outils & Référentiels
          </div>

          <button
            onClick={onOpenCatalog}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
          >
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{t('nav.catalog')}</span>
          </button>

          <button
            onClick={onOpenRag}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
          >
            <Bot className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{t('nav.rag')}</span>
          </button>
        </nav>
      </div>

      {/* Footer Info in Sidebar */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>Sécurité ISO 13616</span>
          <span className="text-emerald-400 font-mono font-bold">Actif</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Moteur SEPA Modulo 97</span>
          <span className="text-emerald-400 font-mono font-bold">OK</span>
        </div>
        <p className="text-[10px] text-slate-600 pt-2">© 2026 TUI Group Finance</p>
      </div>
    </aside>
  );
}
