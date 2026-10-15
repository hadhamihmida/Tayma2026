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
  RefreshCw,
  AlertTriangle,
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
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/Table';

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
    password: '',
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
  const [resetPasswordVal, setResetPasswordVal] = useState('');
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
        setActionSuccess(t('common.success') || 'Utilisateur créé avec succès.');
        setShowCreateModal(false);
        setCreateForm({
          email: '',
          password: '',
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
        setActionSuccess(t('common.success') || 'Modifications enregistrées.');
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
      doc.setFillColor(30, 58, 138); // Navy Blue
      doc.rect(0, 0, 297, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("TUI GROUP FINANCE — RAPPORT OFFICIEL D'AUDIT TRAIL (SOX / SEPA)", 14, 15);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Édité le : ${new Date().toLocaleString('fr-FR')} | Confidentialité : Strictement Confidentiel`, 190, 15);

      // Subtitle
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
      doc.text("Piste d'audit immuable des flux fournisseurs, des décisions financières et des accès système", 14, 32);

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

  const COLORS = ['#1D4ED8', '#16A34A', '#F59E0B', '#DC2626', '#3B82F6', '#64748B'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 border border-blue-200 text-[var(--primary)] rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text)]">
                {t('admin_view.title') || 'Administration & Gouvernance Système'}
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                {t('admin_view.subtitle') || 'Matrice RBAC, piste d audit immuable SOX et gestion des habilitations'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium border border-[var(--border)]">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'users'
                ? 'bg-white text-[var(--primary)] shadow-xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t('admin_view.tab_users') || 'Comptes & Utilisateurs'}</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'matrix'
                ? 'bg-white text-[var(--primary)] shadow-xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t('admin_view.tab_matrix') || 'Matrice RBAC'}</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'audit'
                ? 'bg-white text-[var(--primary)] shadow-xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('admin_view.tab_audit') || 'Piste d Audit SOX'}</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'stats'
                ? 'bg-white text-[var(--primary)] shadow-xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{t('admin_view.tab_stats') || 'Statistiques Globales'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="font-bold">×</button>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="font-bold">×</button>
        </div>
      )}

      {/* TAB 1: USERS CRUD */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Top Actions & Filters */}
          <Card bodyClassName="p-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                    placeholder={t('common.search') || 'Rechercher par nom, email...'}
                    className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => { setUserRoleFilter(e.target.value); setTimeout(loadUsers, 50); }}
                  className="px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
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
                  className="px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="ALL">Tous les scopes</option>
                  <option value="GLOBAL">GLOBAL</option>
                  <option value="WESTERN">WESTERN</option>
                  <option value="NORDIC">NORDIC</option>
                  <option value="TGBST">TGBST</option>
                </select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadUsers}
                  title="Actualiser"
                  className="border border-[var(--border)]"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="primary"
                icon={UserPlus}
                onClick={() => setShowCreateModal(true)}
              >
                {t('admin_view.btn_add_user') || 'Ajouter un Utilisateur'}
              </Button>
            </div>
          </Card>

          {/* Users Table */}
          <Table>
            <TableHeader>
              <tr>
                <TableHead>ID</TableHead>
                <TableHead>Utilisateur / Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Périmètre</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière Connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-[11px] text-[var(--primary)] font-bold">#{u.id}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-[var(--text)]">{u.full_name}</div>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-slate-100 border border-[var(--border)] text-slate-700">
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-[var(--primary)] border border-blue-200 font-semibold">
                      {u.geographic_scope}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                        u.is_active
                          ? 'bg-emerald-50 text-[var(--success)] border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-[var(--danger)] border-rose-200 hover:bg-rose-100'
                      }`}
                      title="Cliquez pour changer le statut"
                    >
                      {u.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{u.is_active ? 'Actif' : 'Inactif'}</span>
                    </button>
                  </TableCell>
                  <TableCell className="text-[var(--text-muted)] text-[11px]">
                    {u.last_login_at ? formatDate(u.last_login_at) : 'Jamais'}
                  </TableCell>
                  <TableCell className="text-right">
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
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-500 hover:text-[var(--primary)] transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setResetPasswordVal('');
                          setShowResetModal(true);
                        }}
                        className="p-1.5 hover:bg-amber-50 rounded-lg text-slate-500 hover:text-amber-600 transition-colors"
                        title="Réinitialiser le mot de passe"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-500 hover:text-[var(--danger)] transition-colors"
                        title="Suppression logique"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 2: RBAC MATRIX */}
      {activeTab === 'matrix' && (
        <Card
          title="Matrice des Habilitations Métiers (Rôle × Action)"
          subtitle="Partitionnement strict des privilèges de consultation et de validation"
          actions={
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-[var(--success)] font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Autorisé
              </span>
              <span className="flex items-center gap-1 text-[var(--text-muted)]">
                <XCircle className="w-3.5 h-3.5 text-slate-300" /> Verrouillé
              </span>
            </div>
          }
          bodyClassName="p-0"
        >
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Module / Domaine</TableHead>
                <TableHead>Action Fonctionnelle</TableHead>
                <TableHead className="text-center">VENDOR</TableHead>
                <TableHead className="text-center">REQUESTER</TableHead>
                <TableHead className="text-center">AGENT</TableHead>
                <TableHead className="text-center">MANAGER</TableHead>
                <TableHead className="text-center">ADMIN</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {matrix.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-semibold text-[var(--text)]">
                    {row.module}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-[var(--text)]">{row.action}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{row.description}</div>
                  </TableCell>
                  {['VENDOR', 'REQUESTER', 'MASTER_DATA_AGENT', 'MANAGER_APPROVAL', 'ADMIN'].map((r) => {
                    const isAllowed = row.roles?.[r];
                    return (
                      <td key={r} className="py-3 px-3 text-center align-middle">
                        {isAllowed ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-[var(--success)] border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-50 text-slate-300 border border-slate-200">
                            <XCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 3: IMMUTABLE AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Controls & Export */}
          <Card bodyClassName="p-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <select
                  value={auditActionFilter}
                  onChange={(e) => { setAuditActionFilter(e.target.value); setTimeout(loadAuditLogs, 50); }}
                  className="px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
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
                  className="px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadAuditLogs}
                  title="Actualiser"
                  className="border border-[var(--border)]"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={FileSpreadsheet}
                  onClick={handleExportCsv}
                >
                  {t('admin_view.btn_export_csv') || 'Exporter CSV'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={FileText}
                  onClick={handleExportPdf}
                >
                  {t('admin_view.btn_export_pdf') || 'Rapport PDF SOX'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Audit Logs Table */}
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Horodatage (UTC)</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Utilisateur / Auteur</TableHead>
                <TableHead>Dossier</TableHead>
                <TableHead>Adresse IP</TableHead>
                <TableHead>Détails de l'évènement</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id} className="font-mono text-[11px]">
                  <TableCell className="text-[var(--text-muted)] whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      log.action.includes('FAILURE') || log.action.includes('LOCKED') || log.action.includes('REJECT')
                        ? 'bg-rose-50 text-[var(--danger)] border border-rose-200'
                        : log.action.includes('SUCCESS') || log.action.includes('APPROV') || log.action.includes('SYNC')
                        ? 'bg-emerald-50 text-[var(--success)] border border-emerald-200'
                        : 'bg-blue-50 text-[var(--primary)] border border-blue-200'
                    }`}>
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-sans">
                    <div className="font-semibold text-[var(--text)]">
                      {log.full_name || 'Système / Moteur IA'}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">{log.role || 'CORE_SYSTEM'}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-sans">
                    {log.request_id ? (
                      <span className="font-mono text-[var(--primary)] font-bold">
                        #{log.request_id}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[var(--text-muted)] whitespace-nowrap">
                    {log.ip_address || '127.0.0.1'}
                  </TableCell>
                  <TableCell className="text-[var(--text)] max-w-xs truncate font-sans">
                    {log.new_value ? (
                      typeof log.new_value === 'object' ? JSON.stringify(log.new_value) : log.new_value
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 4: STATS & CHARTS */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="kpi-card">
              <div>
                <p className="kpi-label">Utilisateurs Actifs</p>
                <div className="kpi-val mt-1 text-[var(--primary)]">
                  {stats.users?.active_users || 0} / {stats.users?.total_users || 0}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">100% opérationnels</span>
              </div>
              <div className="p-3 bg-blue-50 text-[var(--primary)] border border-blue-200 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <p className="kpi-label">Alertes Fraude Détectées</p>
                <div className="kpi-val mt-1 text-[var(--danger)]">
                  {stats.risk_overview?.total_fraud_alerts || 0}
                </div>
                <span className="text-[11px] text-[var(--text-muted)] mt-1 inline-block">Moteurs Isolation Forest & SHAP</span>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <p className="kpi-label">Volume Financier Réf.</p>
                <div className="kpi-val mt-1 text-[var(--text)]">
                  {formatCurrency(stats.vendor_overview?.total_annual_spend || 0)}
                </div>
                <span className="text-[11px] text-[var(--text-muted)] mt-1 inline-block">Catalogue Fournisseurs SAP</span>
              </div>
              <div className="p-3 bg-blue-50 text-[var(--primary)] border border-blue-200 rounded-xl">
                <Building className="w-6 h-6" />
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <p className="kpi-label">Score Moyen de Risque</p>
                <div className="kpi-val mt-1 text-amber-600">
                  {parseFloat(stats.risk_overview?.avg_risk_score || 0).toFixed(1)} / 100
                </div>
                <span className="text-[11px] text-[var(--text-muted)] mt-1 inline-block">Distribution globale</span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Dossiers par Statut */}
            <Card title="Répartition des Dossiers par Statut Workflow">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.requests_by_status || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', color: '#0F172A', fontSize: '11px', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#1D4ED8" radius={[4, 4, 0, 0]} name="Nombre de dossiers" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Chart 2: Répartition Géographique */}
            <Card title="Ventilation par Zone Territoriale (Geographic Scope)">
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
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', color: '#0F172A', fontSize: '11px', borderRadius: '8px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* MODAL: CREATE USER */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[var(--text)]">
              {t('admin_view.modal_create_user') || 'Créer un Nouvel Utilisateur'}
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text)] font-semibold mb-1">Nom complet</label>
                <input
                  type="text"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  required
                  placeholder="Jean Valjean"
                  className="app-input"
                />
              </div>

              <div>
                <label className="block text-[var(--text)] font-semibold mb-1">Email Professionnel</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                  placeholder="nouvel.utilisateur@group.com"
                  className="app-input"
                />
              </div>

              <div>
                <label className="block text-[var(--text)] font-semibold mb-1">Mot de passe temporaire</label>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  className="app-input font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text)] font-semibold mb-1">Rôle Métier</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="app-input"
                  >
                    <option value="VENDOR">VENDOR</option>
                    <option value="REQUESTER">REQUESTER</option>
                    <option value="MASTER_DATA_AGENT">MASTER_DATA_AGENT</option>
                    <option value="MANAGER_APPROVAL">MANAGER_APPROVAL</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text)] font-semibold mb-1">Zone Géographique</label>
                  <select
                    value={createForm.geographic_scope}
                    onChange={(e) => setCreateForm({ ...createForm, geographic_scope: e.target.value })}
                    className="app-input"
                  >
                    <option value="WESTERN">WESTERN</option>
                    <option value="NORDIC">NORDIC</option>
                    <option value="TGBST">TGBST</option>
                    <option value="GLOBAL">GLOBAL</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  {t('common.cancel') || 'Annuler'}
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                >
                  {t('common.confirm') || 'Confirmer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[var(--text)]">
              {t('admin_view.modal_edit_user') || 'Modifier le Compte'} (#{selectedUser.id})
            </h3>

            <form onSubmit={handleEditUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text)] font-semibold mb-1">Nom complet</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  required
                  className="app-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text)] font-semibold mb-1">Rôle</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="app-input"
                  >
                    <option value="VENDOR">VENDOR</option>
                    <option value="REQUESTER">REQUESTER</option>
                    <option value="MASTER_DATA_AGENT">MASTER_DATA_AGENT</option>
                    <option value="MANAGER_APPROVAL">MANAGER_APPROVAL</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text)] font-semibold mb-1">Périmètre</label>
                  <select
                    value={editForm.geographic_scope}
                    onChange={(e) => setEditForm({ ...editForm, geographic_scope: e.target.value })}
                    className="app-input"
                  >
                    <option value="WESTERN">WESTERN</option>
                    <option value="NORDIC">NORDIC</option>
                    <option value="TGBST">TGBST</option>
                    <option value="GLOBAL">GLOBAL</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setShowEditModal(false)}
                >
                  {t('common.cancel') || 'Annuler'}
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                >
                  {t('common.save') || 'Enregistrer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 border border-blue-200 text-[var(--primary)] rounded-xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">
                  {t('admin_view.modal_reset_pwd') || 'Réinitialiser le Mot de Passe'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-mono">{selectedUser.email}</p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text)] font-semibold mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="text"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  required
                  minLength={6}
                  className="app-input font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setShowResetModal(false)}
                >
                  {t('common.cancel') || 'Annuler'}
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                >
                  Réinitialiser
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
