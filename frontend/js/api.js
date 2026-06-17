// ─── SpendSmart API Helper ────────────────────────────────────────────────────

const api = {
  async request(path, options = {}) {
    const res = await fetch(`${CONFIG.API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      credentials: 'include',
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  register: (body) => api.request('/api/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => api.request('/api/login',    { method: 'POST', body: JSON.stringify(body) }),
  logout:   ()     => api.request('/api/logout',   { method: 'POST' }),
  me:       ()     => api.request('/api/me'),

  getExpenses:        ()     => api.request('/api/expenses'),
  addExpense:         (body) => api.request('/api/expenses', { method: 'POST', body: JSON.stringify(body) }),
  deleteExpense:      (id)   => api.request(`/api/expenses/${id}`, { method: 'DELETE' }),
  getStats:           ()     => api.request('/api/stats'),
  getAIInsights:      ()     => api.request('/api/ai-insights'),
};
