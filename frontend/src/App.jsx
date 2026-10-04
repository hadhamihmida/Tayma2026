import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './views/LoginPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import VendorPortal from './views/VendorPortal';
import RequesterPortal from './views/RequesterPortal';
import AgentDashboard from './views/AgentDashboard';
import ManagerDashboard from './views/ManagerDashboard';
import AdminView from './views/AdminView';
import AnalyticsView from './views/AnalyticsView';
import RagAssistantModal from './components/RagAssistantModal';
import VendorCatalogModal from './components/VendorCatalogModal';
import { ShieldAlert, Lock } from 'lucide-react';

function MainApp() {
  const { user, isAuthenticated, loading } = useAuth();

  const [currentView, setCurrentView] = useState('agent');
  const [isRagOpen, setIsRagOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  // Set default view on user login based on their role
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'VENDOR':
          setCurrentView('vendor');
          break;
        case 'REQUESTER':
          setCurrentView('requester');
          break;
        case 'MASTER_DATA_AGENT':
          setCurrentView('agent');
          break;
        case 'MANAGER_APPROVAL':
          setCurrentView('manager');
          break;
        case 'ADMIN':
          setCurrentView('admin');
          break;
        default:
          setCurrentView('agent');
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">
          Vérification des habilitations de sécurité...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // Frontend RBAC View Guard: Strict partition between roles
  const canAccessView = (view) => {
    if (user.role === 'ADMIN') return true; // Admin has full access

    switch (view) {
      case 'vendor':
        return user.role === 'VENDOR';
      case 'requester':
        return user.role === 'REQUESTER';
      case 'agent':
        return user.role === 'MASTER_DATA_AGENT';
      case 'manager':
        return user.role === 'MANAGER_APPROVAL';
      case 'admin':
        return user.role === 'ADMIN';
      case 'analytics':
        return ['MASTER_DATA_AGENT', 'MANAGER_APPROVAL', 'ADMIN'].includes(user.role);
      default:
        return false;
    }
  };

  const isViewAuthorized = canAccessView(currentView);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden text-slate-900 dark:text-slate-100 antialiased">
      {/* 1. Persistent Role-Guarded Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenRag={() => setIsRagOpen(true)}
        onOpenCatalog={() => setIsCatalogOpen(true)}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentView={currentView}
          onOpenRag={() => setIsRagOpen(true)}
          onOpenCatalog={() => setIsCatalogOpen(true)}
        />

        {/* Scrollable Main Views Area */}
        <main className="flex-1 overflow-y-auto">
          {isViewAuthorized ? (
            <>
              {currentView === 'vendor' && <VendorPortal />}
              {currentView === 'requester' && <RequesterPortal />}
              {currentView === 'agent' && <AgentDashboard />}
              {currentView === 'manager' && <ManagerDashboard />}
              {currentView === 'admin' && <AdminView />}
              {currentView === 'analytics' && <AnalyticsView activePersona={user} />}
            </>
          ) : (
            <div className="p-12 text-center max-w-lg mx-auto mt-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-600 mx-auto rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Accès Non Autorisé (Contrôle RBAC)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Votre profil métier (<strong className="font-mono">{user.role}</strong>) n'a pas les prérogatives requises pour accéder à ce module.
              </p>
              <button
                onClick={() => {
                  if (user.role === 'VENDOR') setCurrentView('vendor');
                  else if (user.role === 'REQUESTER') setCurrentView('requester');
                  else if (user.role === 'MASTER_DATA_AGENT') setCurrentView('agent');
                  else if (user.role === 'MANAGER_APPROVAL') setCurrentView('manager');
                  else setCurrentView('admin');
                }}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-500"
              >
                Retour à mon espace dédié
              </button>
            </div>
          )}
        </main>

        {/* Minimal Financial Footer */}
        <footer className="h-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span>© 2026 TUI Group Finance — Plateforme Master Data IA</span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline font-mono text-[10px] text-slate-400">Conformité SOX Section 404 & SEPA Modulo 97</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SAP S/4HANA Connector : READY
            </span>
          </div>
        </footer>
      </div>

      {/* Global Modals */}
      <RagAssistantModal
        isOpen={isRagOpen}
        onClose={() => setIsRagOpen(false)}
      />

      <VendorCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
