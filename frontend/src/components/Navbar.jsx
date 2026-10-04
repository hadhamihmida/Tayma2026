import React from 'react';
import { 
  Building2, 
  Send, 
  CheckSquare, 
  ShieldCheck, 
  BarChart3, 
  Layers
} from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, activePersona }) {
  const navItems = [
    { id: 'vendor', label: 'Portail Vendor', icon: Building2, minRole: 'VENDOR' },
    { id: 'requester', label: 'Portail Requester', icon: Send, minRole: 'REQUESTER' },
    { id: 'agent', label: 'Dashboard Agent', icon: CheckSquare, minRole: 'MASTER_DATA_AGENT' },
    { id: 'manager', label: 'Dashboard Manager', icon: ShieldCheck, minRole: 'MANAGER_APPROVAL' },
    { id: 'analytics', label: 'Analytics & IA', icon: BarChart3, minRole: 'ALL' },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-[41px] z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView(activePersona.defaultView)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-800 flex items-center justify-center text-white font-bold shadow-md tracking-wider text-sm">
              TUI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base">Master Data IA</span>
                <span className="bg-sky-100 text-sky-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-sky-200">
                  FINANCE B2B
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Digitalisation & Sécurisation des Données Fournisseurs</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isRecommended = item.id === activePersona.defaultView;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {isRecommended && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active User Pill */}
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900">{activePersona.full_name}</div>
              <div className="text-[11px] text-slate-500">{activePersona.label.split('(')[0]}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-base shadow-inner">
              {activePersona.avatar}
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}
