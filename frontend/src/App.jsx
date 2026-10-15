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
import { Lock } from 'lucide-react';

function MainApp() {
  const { user, isAuthenticated, loading } = useAuth();

  const [currentView, setCurrentView] = useState('agent');
  const [isRagOpen, setIsRagOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-[var(--primary-light)] border-t-[var(--primary)] rounded-full animate-spin mb-4" />
        <p className="text-xs text-[var(--text-muted)] font-mono tracking-wider uppercase">
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
    <div className="flex h-screen bg-[var(--bg)] font-sans overflow-hidden text-[var(--text)] antialiased">
      {/* 1. Persistent Role-Guarded Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenRag={() => setIsRagOpen(true)}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden main-content">
        {/* Top Header */}
        <Header
          currentView={currentView}
          onOpenRag={() => setIsRagOpen(true)}
          onOpenCatalog={() => setIsCatalogOpen(true)}
          onToggleMobile={() => setMobileSidebarOpen(prev => !prev)}
        />

        {/* Scrollable Main Views Area */}
        <main className="flex-1 overflow-y-auto bg-[var(--bg)]">
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
            <div className="p-8 text-center max-w-lg mx-auto mt-12 bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xs space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-[var(--danger)] mx-auto rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-[var(--text)]">
                Accès Non Autorisé (Contrôle RBAC)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Votre profil métier (<strong className="font-mono text-[var(--text)]">{user.role}</strong>) n'a pas les prérogatives requises pour accéder à ce module.
              </p>
              <button
                onClick={() => {
                  if (user.role === 'VENDOR') setCurrentView('vendor');
                  else if (user.role === 'REQUESTER') setCurrentView('requester');
                  else if (user.role === 'MASTER_DATA_AGENT') setCurrentView('agent');
                  else if (user.role === 'MANAGER_APPROVAL') setCurrentView('manager');
                  else setCurrentView('admin');
                }}
                className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors"
              >
                Retour à mon espace dédié
              </button>
            </div>
          )}
        </main>

        {/* Minimal Financial Footer */}
        <footer className="h-10 bg-[var(--surface)] border-t border-[var(--border)] px-6 flex items-center justify-between text-[11px] text-[var(--text-muted)] shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span>© 2026 TUI Group Finance — Plateforme Master Data IA</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline font-mono text-[10px] text-[var(--text-muted)]">Conformité SOX Section 404 & SEPA Modulo 97</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
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
