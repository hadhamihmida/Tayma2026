/**
 * API Service Client for Master Data IA Frontend
 */

const API_BASE = 'http://localhost:5000/api';



class ApiClient {
  constructor() {
    this.token = localStorage.getItem('mdata_access_token') || null;
    this.refreshToken = localStorage.getItem('mdata_refresh_token') || null;
    this.currentUser = null;
    try {
      const savedUser = localStorage.getItem('mdata_user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    } catch (e) {
      this.currentUser = null;
    }
  }

  setSession(token, refreshToken = null, user = null) {
    this.token = token;
    if (token) {
      localStorage.setItem('mdata_access_token', token);
    } else {
      localStorage.removeItem('mdata_access_token');
    }

    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('mdata_refresh_token', refreshToken);
    } else if (refreshToken === null && !token) {
      this.refreshToken = null;
      localStorage.removeItem('mdata_refresh_token');
    }

    if (user) {
      this.currentUser = user;
      localStorage.setItem('mdata_user', JSON.stringify(user));
    } else if (user === null && !token) {
      this.currentUser = null;
      localStorage.removeItem('mdata_user');
    }
  }

  clearSession() {
    this.token = null;
    this.refreshToken = null;
    this.currentUser = null;
    localStorage.removeItem('mdata_access_token');
    localStorage.removeItem('mdata_refresh_token');
    localStorage.removeItem('mdata_user');
  }

  async getHeaders(custom = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...custom
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    let headers = await this.getHeaders(options.headers || {});
    if (options.body instanceof FormData) {
      delete headers['Content-Type']; // Let browser set multipart boundary
    }

    let res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    // Handle token expiry and auto-refresh
    if (res.status === 401 && this.refreshToken && !endpoint.includes('/auth/')) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken })
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.token) {
          this.setSession(refreshData.token, null, refreshData.user);
          headers['Authorization'] = `Bearer ${refreshData.token}`;
          res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
          });
        } else {
          this.clearSession();
          window.location.reload();
        }
      } catch (err) {
        this.clearSession();
      }
    }

    return res;
  }

  // --- Auth Methods ---
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success && data.token) {
      this.setSession(data.token, data.refreshToken, data.user);
    }
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });
    } catch (e) {
      // ignore
    } finally {
      this.clearSession();
    }
  }

  async getMe() {
    const res = await this.request('/auth/me');
    return res.json();
  }

  async forgotPassword(email) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  }

  async resetPassword(token, password) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    return res.json();
  }


  // --- Requests Methods ---
  async getRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/requests?${query}`);
    return res.json();
  }

  async getRequestDetails(id) {
    const res = await this.request(`/requests/${id}`);
    return res.json();
  }

  async createRequest(payload) {
    const res = await this.request('/requests', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async validateIban(iban, country = '') {
    const res = await this.request('/requests/validate-iban', {
      method: 'POST',
      body: JSON.stringify({ iban, country })
    });
    return res.json();
  }

  async agentReview(id, data) {
    const res = await this.request(`/requests/${id}/agent-review`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async managerApproval(id, data) {
    const res = await this.request(`/requests/${id}/manager-approval`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async sapSync(id) {
    const res = await this.request(`/requests/${id}/sap-sync`, {
      method: 'POST'
    });
    return res.json();
  }

  async simulateIdoc(id) {
    const res = await this.request(`/requests/${id}/simulate-idoc`);
    return res.json();
  }

  // --- Documents ---
  async uploadDocument(formData) {
    const res = await this.request('/documents/upload', {
      method: 'POST',
      body: formData
    });
    return res.json();
  }

  async getDocument(id) {
    const res = await this.request(`/documents/${id}`);
    return res.json();
  }

  // --- Vendors Catalog ---
  async getVendors(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/vendors?${query}`);
    return res.json();
  }

  async getVendorDetails(id) {
    const res = await this.request(`/vendors/${id}`);
    return res.json();
  }

  // --- Analytics & RAG ---
  async getAnalyticsDashboard(scope = 'ALL') {
    const res = await this.request(`/analytics/dashboard?scope=${scope}`);
    return res.json();
  }

  async getForecast(horizon = 30, scope = 'ALL') {
    const res = await this.request(`/analytics/forecast?horizon_days=${horizon}&scope=${scope}`);
    return res.json();
  }

  async getAiMetrics() {
    const res = await this.request('/analytics/ai-metrics');
    return res.json();
  }

  async queryRag(query) {
    const res = await this.request('/rag/query', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
    return res.json();
  }

  // --- Admin Module ---
  async getAdminUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/admin/users?${query}`);
    return res.json();
  }

  async createAdminUser(userData) {
    const res = await this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return res.json();
  }

  async updateAdminUser(id, userData) {
    const res = await this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    return res.json();
  }

  async toggleUserStatus(id, isActive) {
    const res = await this.request(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive })
    });
    return res.json();
  }

  async resetUserPassword(id, newPassword = null) {
    const res = await this.request(`/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword })
    });
    return res.json();
  }

  async deleteUser(id) {
    const res = await this.request(`/admin/users/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  }

  async getAdminAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/admin/audit-logs?${query}`);
    return res.json();
  }

  async exportAuditLogsCsv() {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE}/admin/audit-logs/export/csv`, { headers });
    return res.blob();
  }

  async getAdminStats() {
    const res = await this.request('/admin/stats');
    return res.json();
  }

  async getPermissionsMatrix() {
    const res = await this.request('/admin/permissions-matrix');
    return res.json();
  }
}

export const api = new ApiClient();
