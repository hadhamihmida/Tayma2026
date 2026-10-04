import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { formatDate, formatCurrency } from '../i18n';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Users,
  Shield,
  FileSpreadsheet,
  FileText,
  BarChart3,
  UserPlus,
  Edit2,
  Trash2,
  KeyRound,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  Lock,
  Unlock,
  Building,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function AdminView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'matrix' | 'audit' | 'stats'

  // Users State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userScopeFilter, setUserScopeFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    email: '',
    password: 'Password123!',
    full_name: '',
    role: 'REQUESTER',
    geographic_scope: 'WESTERN'
  });
  const [editForm, setEditForm] = useState({
    full_name: '',
    role: '',
    geographic_scope: '',
    is_active: true
  });
  const [resetPasswordVal, setResetPasswordVal] = useState('Password123!');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Matrix State
  const [matrix, setMatrix] = useState([]);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditDateFilter, setAuditDateFilter] = useState('');

  // Stats State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadMatrix();
    loadAuditLogs();
    loadStats();
  }, []);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.getAdminUsers({
        role: userRoleFilter,
        scope: userScopeFilter,
        search: userSearch
      });
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadMatrix = async () => {
    try {
      const res = await api.getPermissionsMatrix();
      if (res.success) {
        setMatrix(res.matrix);
      }
    } catch (err) {
      console.error('Error loading matrix:', err);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await api.getAdminAuditLogs({
        action: auditActionFilter,
        startDate: auditDateFilter || null,
        limit: 200
      });
      if (res.success) {
        setAuditLogs(res.logs);
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.getAdminStats();
      if (res.success) {
        setStats(res);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.createAdminUser(createForm);
      if (res.success) {
        setActionSuccess(t('common.success'));
        setShowCreateModal(false);
        setCreateForm({
          email: '',
          password: 'Password123!',
          full_name: '',
          role: 'REQUESTER',
          geographic_scope: 'WESTERN'
        });
        loadUsers();
        loadStats();
      } else {
        setActionError(res.error || 'Erreur lors de la création');
      }
    } catch (err) {
      setActionError('Erreur réseau');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.updateAdminUser(selectedUser.id, editForm);
      if (res.success) {
        setActionSuccess(t('common.success'));
        setShowEditModal(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        setActionError(res.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      setActionError('Erreur réseau');
    }
  };

  const handleToggleStatus = async (user) => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.toggleUserStatus(user.id, !user.is_active);
      if (res.success) {
        setActionSuccess(`Compte ${user.email} ${!user.is_active ? 'activé' : 'désactivé'}.`);
        loadUsers();
        loadStats();
      } else {
        setActionError(res.error || 'Erreur statut');
      }
    } catch (err) {
      setActionError('Erreur réseau');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.resetUserPassword(selectedUser.id, resetPasswordVal);
      if (res.success) {
        setActionSuccess(res.message);
        setShowResetModal(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        setActionError(res.error || 'Erreur réinitialisation');
      }
    } catch (err) {
      setActionError('Erreur réseau');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Confirmez-vous la suppression logique et l archivage du compte de ${user.full_name} (${user.email}) ?`)) {
      return;
    }
    try {
      const res = await api.deleteUser(user.id);
      if (res.success) {
        setActionSuccess(`Utilisateur ${user.full_name} archivé.`);
        loadUsers();
        loadStats();
      } else {
        setActionError(res.error || 'Erreur suppression');
      }
    } catch (err) {
      setActionError('Erreur réseau');
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await api.exportAuditLogsCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_trail_masterdata_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Erreur lors de l export CSV');
    }
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF('landscape');

      // Header Branding
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, 297, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TUI GROUP FINANCE — RAPPORT OFFICIEL D\'AUDIT TRAIL (SOX / SEPA)', 14, 15);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Édité le : ${new Date().toLocaleString('fr-FR')} | Confidentialité : Strictement Confidentiel`, 190, 15);

      // Subtitle
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
      doc.text('Piste d\'audit immuable des flux fournisseurs, des décisions financières et des accès système', 14, 32);

      const tableData = auditLogs.map((log) => [
        log.id,
        new Date(log.timestamp).toLocaleString('fr-FR'),
        log.action,
        log.full_name || 'Système IA',
        log.role || 'N/A',
        log.request_id ? `Req #${log.request_id}` : '-',
        log.ip_address || '127.0.0.1'
      ]);

      autoTable(doc, {
        head: [['ID', 'Date & Heure', 'Code Action', 'Auteur', 'Rôle', 'Dossier', 'IP']],
        body: tableData,
        startY: 38,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 58, 138], // Navy Blue
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      });

      doc.save(`rapport_audit_masterdata_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('admin_view.title')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('admin_view.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {t('admin_view.tab_users')}
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'matrix'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {t('admin_view.tab_matrix')}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {t('admin_view.tab_audit')}
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'stats'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {t('admin_view.tab_stats')}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="font-bold">×</button>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="font-bold">×</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: USERS CRUD */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Top Actions & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                  placeholder={t('common.search')}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => { setUserRoleFilter(e.target.value); setTimeout(loadUsers, 50); }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Tous les rôles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="MANAGER_APPROVAL">MANAGER_APPROVAL</option>
                <option value="MASTER_DATA_AGENT">MASTER_DATA_AGENT</option>
                <option value="REQUESTER">REQUESTER</option>
                <option value="VENDOR">VENDOR</option>
              </select>

              <select
                value={userScopeFilter}
                onChange={(e) => { setUserScopeFilter(e.target.value); setTimeout(loadUsers, 50); }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Tous les scopes</option>
                <option value="GLOBAL">GLOBAL</option>
                <option value="WESTERN">WESTERN</option>
                <option value="NORDIC">NORDIC</option>
                <option value="TGBST">TGBST</option>
              </select>

              <button
                onClick={loadUsers}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              {t('admin_view.btn_add_user')}
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Utilisateur / Nom</th>
                    <th className="py-3 px-4">Rôle</th>
                    <th className="py-3 px-4">Périmètre</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Dernière Connexion</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">#{u.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{u.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          {u.geographic_scope}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                            u.is_active
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                          }`}
                          title="Cliquez pour changer le statut"
                        >
                          {u.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {u.is_active ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {u.last_login_at ? formatDate(u.last_login_at) : 'Jamais'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setEditForm({
                                full_name: u.full_name,
                                role: u.role,
                                geographic_scope: u.geographic_scope,
                                is_active: u.is_active
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-blue-600 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setResetPasswordVal('Password123!');
                              setShowResetModal(true);
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-amber-600 transition-colors"
                            title="Réinitialiser le mot de passe"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-rose-600 transition-colors"
                            title="Suppression logique"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RBAC MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Matrice des Habilitations Métiers (Rôle × Action)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Partitionnement strict des privilèges de consultation et de validation
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Autorisé
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <XCircle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" /> Verrouillé
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Module / Domaine</th>
                  <th className="py-3 px-4">Action Fonctionnelle</th>
                  <th className="py-3 px-3 text-center">VENDOR</th>
                  <th className="py-3 px-3 text-center">REQUESTER</th>
                  <th className="py-3 px-3 text-center">AGENT</th>
                  <th className="py-3 px-3 text-center">MANAGER</th>
                  <th className="py-3 px-3 text-center">ADMIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {matrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {row.module}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-100">{row.action}</div>
                      <div className="text-[11px] text-slate-400">{row.description}</div>
                    </td>
                    {['VENDOR', 'REQUESTER', 'MASTER_DATA_AGENT', 'MANAGER_APPROVAL', 'ADMIN'].map((r) => {
                      const isAllowed = row.roles?.[r];
                      return (
                        <td key={r} className="py-3 px-3 text-center">
                          {isAllowed ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600">
                              <XCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: IMMUTABLE AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Controls & Export */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <select
                value={auditActionFilter}
                onChange={(e) => { setAuditActionFilter(e.target.value); setTimeout(loadAuditLogs, 50); }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Toutes les actions</option>
                <option value="AUTH_LOGIN_SUCCESS">Connexions réussies</option>
                <option value="AUTH_LOGIN_FAILURE">Échecs de connexion</option>
                <option value="AUTH_ACCOUNT_LOCKED">Comptes verrouillés</option>
                <option value="REQUEST_CREATED">Dossiers créés</option>
                <option value="AI_SCREENING_COMPLETED">Audits IA terminés</option>
                <option value="AGENT_REVIEW_APPROVE_TO_MANAGER">Transmissions Agent</option>
                <option value="MANAGER_APPROVE">Approbations Manager</option>
                <option value="MANAGER_REJECT">Rejets motivés</option>
                <option value="SAP_SYNC_COMPLETED">Synchronisations SAP IDoc</option>
                <option value="ADMIN_USER_CREATED">Créations d'utilisateurs</option>
              </select>

              <input
                type="date"
                value={auditDateFilter}
                onChange={(e) => { setAuditDateFilter(e.target.value); setTimeout(loadAuditLogs, 50); }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300"
              />

              <button
                onClick={loadAuditLogs}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                {t('admin_view.btn_export_csv')}
              </button>
              <button
                onClick={handleExportPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <FileText className="w-4 h-4 text-white" />
                {t('admin_view.btn_export_pdf')}
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Horodatage (UTC)</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Utilisateur / Auteur</th>
                    <th className="py-3 px-4">Dossier</th>
                    <th className="py-3 px-4">Adresse IP</th>
                    <th className="py-3 px-4">Détails de l'évènement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 font-mono text-[11px]">
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                          log.action.includes('FAILURE') || log.action.includes('LOCKED') || log.action.includes('REJECT')
                            ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                            : log.action.includes('SUCCESS') || log.action.includes('APPROV') || log.action.includes('SYNC')
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap font-sans">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {log.full_name || 'Système / Moteur IA'}
                        </div>
                        <div className="text-[10px] text-slate-400">{log.role || 'CORE_SYSTEM'}</div>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap font-sans">
                        {log.request_id ? (
                          <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                            #{log.request_id}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate font-sans">
                        {log.new_value ? (
                          typeof log.new_value === 'object' ? JSON.stringify(log.new_value) : log.new_value
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: STATS & CHARTS */}
      {/* ========================================================================= */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Utilisateurs Actifs</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.users?.active_users || 0} / {stats.users?.total_users || 0}
                </h3>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">100% opérationnels</span>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Alertes Fraude Détectées</p>
                <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {stats.risk_overview?.total_fraud_alerts || 0}
                </h3>
                <span className="text-[11px] text-slate-400 mt-1 inline-block">Moteurs Isolation Forest & SHAP</span>
              </div>
              <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Volume Financier Réf.</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {formatCurrency(stats.vendor_overview?.total_annual_spend || 0)}
                </h3>
                <span className="text-[11px] text-slate-400 mt-1 inline-block">Catalogue Fournisseurs SAP</span>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                <Building className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Score Moyen de Risque</p>
                <h3 className="text-2xl font-bold text-amber-500 mt-1">
                  {parseFloat(stats.risk_overview?.avg_risk_score || 0).toFixed(1)} / 100
                </h3>
                <span className="text-[11px] text-slate-400 mt-1 inline-block">Distribution des 8 cas</span>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Dossiers par Statut */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Répartition des Dossiers par Statut Workflow
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.requests_by_status || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Nombre de dossiers" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Répartition Géographique */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Ventilation par Zone Territoriale (Geographic Scope)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.requests_by_scope || []}
                      dataKey="count"
                      nameKey="geographic_scope"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(stats.requests_by_scope || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE USER */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('admin_view.modal_create_user')}
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Nom complet</label>
                <input
                  type="text"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  required
                  placeholder="Jean Valjean"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Email Professionnel</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                  placeholder="nouvel.utilisateur@group.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Mot de passe temporaire</label>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Rôle Métier</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="VENDOR">VENDOR</option>
                    <option value="REQUESTER">REQUESTER</option>
                    <option value="MASTER_DATA_AGENT">MASTER_DATA_AGENT</option>
                    <option value="MANAGER_APPROVAL">MANAGER_APPROVAL</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Zone Géographique</label>
                  <select
                    value={createForm.geographic_scope}
                    onChange={(e) => setCreateForm({ ...createForm, geographic_scope: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="WESTERN">WESTERN</option>
                    <option value="NORDIC">NORDIC</option>
                    <option value="TGBST">TGBST</option>
                    <option value="GLOBAL">GLOBAL</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT USER */}
      {/* ========================================================================= */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('admin_view.modal_edit_user')} (#{selectedUser.id})
            </h3>

            <form onSubmit={handleEditUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Nom complet</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Rôle</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="VENDOR">VENDOR</option>
                    <option value="REQUESTER">REQUESTER</option>
                    <option value="MASTER_DATA_AGENT">MASTER_DATA_AGENT</option>
                    <option value="MANAGER_APPROVAL">MANAGER_APPROVAL</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Périmètre</label>
                  <select
                    value={editForm.geographic_scope}
                    onChange={(e) => setEditForm({ ...editForm, geographic_scope: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="WESTERN">WESTERN</option>
                    <option value="NORDIC">NORDIC</option>
                    <option value="TGBST">TGBST</option>
                    <option value="GLOBAL">GLOBAL</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESET PASSWORD */}
      {/* ========================================================================= */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('admin_view.modal_reset_pwd')}
                </h3>
                <p className="text-xs text-slate-400 font-mono">{selectedUser.email}</p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="text"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  Réinitialiser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
