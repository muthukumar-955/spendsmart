// ─── SpendSmart Main App ──────────────────────────────────────────────────────

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  user:       null,
  expenses:   [],
  stats:      null,
  page:       'dashboard',
  chartDoughnut: null,
  chartBar:      null,
  sidebarOpen:   false,
};

// Category colors (matches CSS)
const CAT_COLORS = {
  'Food & Dining':     '#FF6B6B',
  'Transportation':    '#4ECDC4',
  'Shopping':          '#FFE66D',
  'Entertainment':     '#A78BFA',
  'Healthcare':        '#6EE7B7',
  'Education':         '#60A5FA',
  'Bills & Utilities': '#F97316',
  'Travel':            '#EC4899',
  'Fitness':           '#34D399',
  'Personal Care':     '#F9A8D4',
  'Groceries':         '#86EFAC',
  'Other':             '#94A3B8',
};

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3500) {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Render Helpers ─────────────────────────────────────────────────────────
function fmt(n) { return `${CONFIG.CURRENCY}${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`; }

function catColor(cat) {
  return CAT_COLORS[cat] || '#94A3B8';
}

function catClass(cat) {
  const map = {
    'Food & Dining': 'Food', 'Transportation': 'Transport', 'Shopping': 'Shopping',
    'Entertainment': 'Entertain', 'Healthcare': 'Health', 'Education': 'Education',
    'Bills & Utilities': 'Bills', 'Travel': 'Travel', 'Fitness': 'Fitness',
    'Personal Care': 'Personal', 'Groceries': 'Groceries', 'Other': 'Other',
  };
  return `cat-${map[cat] || 'Other'}`;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Auth Page ──────────────────────────────────────────────────────────────
function renderAuth() {
  document.body.innerHTML = `
  <div class="auth-page">
    <div class="auth-orb one"></div>
    <div class="auth-orb two"></div>
    <div id="toast-container" class="toast-container"></div>

    <div class="auth-card glass-card">
      <div class="auth-logo">
        <h1 class="text-gradient">SpendSmart</h1>
        <p>AI-Powered Expense Tracker </p>
      </div>

      <div class="auth-tabs">
        <button class="auth-tab active" id="tab-login" onclick="switchTab('login')">Login</button>
        <button class="auth-tab" id="tab-register" onclick="switchTab('register')">Register</button>
      </div>

      <!-- Login Form -->
      <form class="auth-form" id="login-form" onsubmit="handleLogin(event)">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" id="login-email" placeholder="your@email.com" required>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" class="form-input" id="login-password" placeholder="••••••••" required>
        </div>
        <button type="submit" class="btn btn-primary btn-full" id="login-btn">
          Login
        </button>
        <p class="auth-link">Don't have an account? <a href="#" onclick="switchTab('register')">Register</a></p>
      </form>

      <!-- Register Form -->
      <form class="auth-form" id="register-form" style="display:none" onsubmit="handleRegister(event)">
        <div class="form-group">
          <label class="form-label">Username</label>
          <input type="text" class="form-input" id="reg-username" placeholder="yourname" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" id="reg-email" placeholder="your@email.com" required>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" class="form-input" id="reg-password" placeholder="Min 6 characters" required minlength="6">
        </div>
        <button type="submit" class="btn btn-primary btn-full" id="reg-btn">
          Create Account
        </button>
        <p class="auth-link">Already have an account? <a href="#" onclick="switchTab('login')">Login</a></p>
      </form>
    </div>
  </div>`;
}

function switchTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('login-form').style.display    = tab === 'login'    ? 'flex' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'flex' : 'none';
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner"></div> Logging in...`;
  try {
    const res = await api.login({
      email:    document.getElementById('login-email').value,
      password: document.getElementById('login-password').value,
    });
    state.user = res;
    renderApp();
    await loadAll();
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = 'Login';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('reg-btn');
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner"></div> Creating...`;
  try {
    const res = await api.register({
      username: document.getElementById('reg-username').value,
      email:    document.getElementById('reg-email').value,
      password: document.getElementById('reg-password').value,
    });
    state.user = res;
    renderApp();
    await loadAll();
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = 'Create Account';
  }
}

// ── Main App Shell ─────────────────────────────────────────────────────────
function renderApp() {
  const initial = state.user?.username?.charAt(0).toUpperCase() || 'U';
  document.body.innerHTML = `
  <div id="toast-container" class="toast-container"></div>

  <button class="hamburger" onclick="toggleSidebar()" aria-label="Menu">
    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M3 12h18M3 6h18M3 18h18"/>
    </svg>
  </button>

  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <h1 class="text-gradient">SpendSmart</h1>
        <span class="eyebrow">AI Expense Tracker</span>
      </div>
      <nav class="sidebar-nav">
        <a class="nav-item active" data-page="dashboard" onclick="navigateTo('dashboard')">
          ${svgDashboard()} Dashboard
        </a>
        <a class="nav-item" data-page="expenses" onclick="navigateTo('expenses')">
          ${svgList()} Expenses
        </a>
        <a class="nav-item" data-page="add" onclick="navigateTo('add')">
          ${svgPlus()} Add Expense
        </a>
        <a class="nav-item" data-page="insights" onclick="navigateTo('insights')">
          ${svgAI()} AI Insights
        </a>
      </nav>
      <div class="sidebar-bottom">
        <div class="user-info">
          <div class="user-avatar">${initial}</div>
          <div>
            <div class="user-name">${state.user?.username || 'User'}</div>
            <div class="user-email">Logged in</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-full" onclick="handleLogout()">
          ${svgLogout()} Logout
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="main-content" id="main-content">
      <div id="page-content"></div>
    </main>
  </div>`;
}

// ── Navigation ─────────────────────────────────────────────────────────────
function navigateTo(page) {
  state.page = page;
  // Update nav active
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  // Close sidebar on mobile
  if (window.innerWidth < 768) toggleSidebar(false);
  renderPage(page);
}

function toggleSidebar(force) {
  const sidebar = document.getElementById('sidebar');
  state.sidebarOpen = force !== undefined ? force : !state.sidebarOpen;
  sidebar.classList.toggle('open', state.sidebarOpen);
}

function renderPage(page) {
  const content = document.getElementById('page-content');
  if (page === 'dashboard') renderDashboard(content);
  else if (page === 'expenses') renderExpenses(content);
  else if (page === 'add')      renderAddExpense(content);
  else if (page === 'insights') renderInsights(content);
}

// ── Load All Data ──────────────────────────────────────────────────────────
async function loadAll() {
  try {
    const [expenses, stats] = await Promise.all([api.getExpenses(), api.getStats()]);
    state.expenses = expenses;
    state.stats    = stats;
    renderPage(state.page);
  } catch (err) {
    showToast('Failed to load data', 'error');
  }
}

// ── Dashboard Page ─────────────────────────────────────────────────────────
function renderDashboard(el) {
  const s = state.stats || { total: 0, this_month: 0, count: 0, categories: {}, monthly: {} };
  const recent = state.expenses.slice(0, 5);

  el.innerHTML = `
  <div class="page-header fade-in">
    <p class="eyebrow">Overview</p>
    <h2>Dashboard</h2>
    <p>Track your spending at a glance.</p>
  </div>

  <div class="stats-grid stagger">
    <div class="card stat-card total">
      <div class="stat-label">Total Spent</div>
      <div class="stat-value">${fmt(s.total)}</div>
      <div class="stat-sub">All time expenses</div>
    </div>
    <div class="card stat-card month">
      <div class="stat-label">This Month</div>
      <div class="stat-value">${fmt(s.this_month)}</div>
      <div class="stat-sub">${new Date().toLocaleString('en', { month: 'long' })}</div>
    </div>
    <div class="card stat-card count">
      <div class="stat-label">Transactions</div>
      <div class="stat-value">${s.count}</div>
      <div class="stat-sub">Total records</div>
    </div>
  </div>

  <div class="dashboard-grid">
    <div class="card chart-card">
      <div class="chart-title">${svgPie()} Spending by Category</div>
      <div class="chart-wrapper">
        <canvas id="doughnut-chart"></canvas>
      </div>
      <div class="legend" id="cat-legend"></div>
    </div>
    <div class="card chart-card">
      <div class="chart-title">${svgBar()} Monthly Trend</div>
      <div class="chart-wrapper">
        <canvas id="bar-chart"></canvas>
      </div>
    </div>
  </div>

  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <h3 style="font-size:1rem;font-weight:600">Recent Transactions</h3>
      <button class="btn btn-ghost" onclick="navigateTo('expenses')" style="padding:8px 16px;font-size:0.75rem">View All</button>
    </div>
    ${recent.length ? renderExpenseList(recent) : `<div class="empty-state">${svgEmpty()}<p>No expenses yet. <a href="#" onclick="navigateTo('add')" style="color:var(--indigo)">Add one!</a></p></div>`}
  </div>`;

  // Build charts after DOM is ready
  setTimeout(() => {
    buildDoughnut(s.categories);
    buildBar(s.monthly);
  }, 50);
}

function buildDoughnut(cats) {
  const canvas = document.getElementById('doughnut-chart');
  if (!canvas) return;
  if (state.chartDoughnut) state.chartDoughnut.destroy();
  const labels = Object.keys(cats);
  const values = Object.values(cats);
  const colors = labels.map(l => catColor(l));

  // Legend
  const legend = document.getElementById('cat-legend');
  if (legend) {
    legend.innerHTML = labels.map((l, i) =>
      `<div class="legend-item"><span class="legend-dot" style="background:${colors[i]}"></span>${l}</div>`
    ).join('');
  }

  if (!labels.length) {
    canvas.parentElement.innerHTML = `<div class="empty-state"><p>No data yet</p></div>`;
    return;
  }

  state.chartDoughnut = new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#13131F' }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${CONFIG.CURRENCY}${ctx.parsed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          },
        },
      },
      cutout: '72%',
    },
  });
}

function buildBar(monthly) {
  const canvas = document.getElementById('bar-chart');
  if (!canvas) return;
  if (state.chartBar) state.chartBar.destroy();
  const labels = Object.keys(monthly);
  const values = Object.values(monthly);

  state.chartBar = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: 'rgba(110,84,255,0.6)',
        borderColor: '#6E54FF',
        borderWidth: 1,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9494B8', font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9494B8', font: { size: 10 }, callback: v => `${CONFIG.CURRENCY}${v}` } },
      },
    },
  });
}

// ── Expenses Page ──────────────────────────────────────────────────────────
function renderExpenses(el) {
  const cats = ['All', ...CONFIG.CATEGORIES];
  el.innerHTML = `
  <div class="page-header fade-in">
    <p class="eyebrow">Records</p>
    <h2>All Expenses</h2>
    <p>${state.expenses.length} transaction${state.expenses.length !== 1 ? 's' : ''} found.</p>
  </div>
  <div class="filter-bar">
    <select class="form-select" id="filter-cat" onchange="filterExpenses()">
      ${cats.map(c => `<option>${c}</option>`).join('')}
    </select>
    <input type="month" class="form-input" id="filter-month" onchange="filterExpenses()">
    <button class="btn btn-ghost" onclick="clearFilters()">Clear</button>
    <button class="btn btn-primary" onclick="navigateTo('add')" style="margin-left:auto">
      ${svgPlus()} Add Expense
    </button>
  </div>
  <div class="card">
    <div class="expense-list" id="expense-list">
      ${renderExpenseList(state.expenses)}
    </div>
  </div>`;
}

function filterExpenses() {
  const cat   = document.getElementById('filter-cat')?.value || 'All';
  const month = document.getElementById('filter-month')?.value || '';
  let filtered = [...state.expenses];
  if (cat !== 'All') filtered = filtered.filter(e => e.category === cat);
  if (month) {
    const [y, m] = month.split('-');
    filtered = filtered.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === +y && (d.getMonth() + 1) === +m;
    });
  }
  document.getElementById('expense-list').innerHTML = renderExpenseList(filtered);
}

function clearFilters() {
  document.getElementById('filter-cat').value   = 'All';
  document.getElementById('filter-month').value = '';
  filterExpenses();
}

function renderExpenseList(expenses) {
  if (!expenses.length) return `<div class="empty-state">${svgEmpty()}<p>No expenses found.</p></div>`;
  return expenses.map(e => `
    <div class="expense-item" id="exp-${e.id}">
      <span class="category-dot ${catClass(e.category)}" title="${e.category}"></span>
      <div class="expense-info">
        <div class="expense-title">${e.title}</div>
        <div class="expense-meta">${e.category}${e.note ? ` · ${e.note}` : ''}</div>
      </div>
      <div class="expense-amount">${fmt(e.amount)}</div>
      <div class="expense-date">${formatDate(e.date)}</div>
      <button class="btn-delete" onclick="confirmDelete(${e.id}, '${e.title.replace(/'/g, "\\'")}')" title="Delete">
        ${svgTrash()}
      </button>
    </div>`).join('');
}

function confirmDelete(id, title) {
  showDeleteModal(id, title);
}

function showDeleteModal(id, title) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Delete Expense?</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">${svgX()}</button>
      </div>
      <p style="color:var(--text-muted);margin-bottom:24px">Are you sure you want to delete "<strong>${title}</strong>"? This cannot be undone.</p>
      <div style="display:flex;gap:12px;justify-content:flex-end">
        <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn" style="background:var(--red);color:white" onclick="doDelete(${id}, this.closest('.modal-overlay'))">Delete</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

async function doDelete(id, overlay) {
  try {
    await api.deleteExpense(id);
    state.expenses = state.expenses.filter(e => e.id !== id);
    state.stats    = await api.getStats();
    overlay.remove();
    const el = document.getElementById(`exp-${id}`);
    if (el) el.style.animation = 'toastOut 0.3s ease forwards', setTimeout(() => el.remove(), 300);
    showToast('Expense deleted', 'success');
    // Update header count
    const header = document.querySelector('.page-header p');
    if (header) header.textContent = `${state.expenses.length} transaction${state.expenses.length !== 1 ? 's' : ''} found.`;
  } catch (err) {
    showToast(err.message, 'error');
    overlay.remove();
  }
}

// ── Add Expense Page ───────────────────────────────────────────────────────
function renderAddExpense(el) {
  const today = new Date().toISOString().split('T')[0];
  el.innerHTML = `
  <div class="page-header fade-in">
    <p class="eyebrow">New Record</p>
    <h2>Add Expense</h2>
    <p>Track a new spending entry.</p>
  </div>
  <div class="card" style="max-width:640px">
    <form onsubmit="handleAddExpense(event)">
      <div class="form-grid">
        <div class="form-group full">
          <label class="form-label">Title *</label>
          <input type="text" class="form-input" id="exp-title" placeholder="Coffee at Starbucks" required maxlength="200">
        </div>
        <div class="form-group">
          <label class="form-label">Amount (${CONFIG.CURRENCY}) *</label>
          <input type="number" class="form-input" id="exp-amount" placeholder="0.00" min="0.01" step="0.01" required>
        </div>
        <div class="form-group">
          <label class="form-label">Date *</label>
          <input type="date" class="form-input" id="exp-date" value="${today}" required>
        </div>
        <div class="form-group full">
          <label class="form-label">Category *</label>
          <select class="form-select" id="exp-category" required>
            <option value="">Select category</option>
            ${CONFIG.CATEGORIES.map(c => `<option>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group full">
          <label class="form-label">Note (optional)</label>
          <textarea class="form-textarea" id="exp-note" placeholder="Any additional notes..."></textarea>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-top:24px">
        <button type="submit" class="btn btn-primary" id="add-btn">
          ${svgPlus()} Add Expense
        </button>
        <button type="button" class="btn btn-ghost" onclick="navigateTo('expenses')">Cancel</button>
      </div>
    </form>
  </div>`;
}

async function handleAddExpense(e) {
  e.preventDefault();
  const btn = document.getElementById('add-btn');
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner"></div> Saving...`;
  try {
    await api.addExpense({
      title:    document.getElementById('exp-title').value,
      amount:   document.getElementById('exp-amount').value,
      date:     document.getElementById('exp-date').value,
      category: document.getElementById('exp-category').value,
      note:     document.getElementById('exp-note').value,
    });
    showToast('Expense added successfully!', 'success');
    const [expenses, stats] = await Promise.all([api.getExpenses(), api.getStats()]);
    state.expenses = expenses;
    state.stats    = stats;
    navigateTo('dashboard');
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = `${svgPlus()} Add Expense`;
  }
}

// ── AI Insights Page ───────────────────────────────────────────────────────
function renderInsights(el) {
  el.innerHTML = `
  <div class="page-header fade-in">
    <p class="eyebrow"></p>
    <h2>AI Insights</h2>
    <p>Personalized spending advice from your AI advisor.</p>
  </div>

  <div class="card ai-card fade-in" style="margin-bottom:24px">
    <div class="ai-header">
      <h3 style="font-size:1rem;font-weight:600">Your Spending Summary</h3>
      <span class="ai-badge">AI Analysis</span>
    </div>
    <div class="ai-content ai-loading" id="ai-content">
      <div class="pulse-dot"></div> Analyzing your expenses with Groq LLaMA...
    </div>
    <div style="margin-top:20px">
      <button class="btn btn-gold" onclick="refreshInsights()">
        ${svgRefresh()} Refresh Insights
      </button>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
    <div class="card chart-card">
      <div class="chart-title">${svgPie()} Category Breakdown</div>
      <div class="chart-wrapper"><canvas id="insight-doughnut"></canvas></div>
      <div class="legend" id="insight-legend"></div>
    </div>
    <div class="card">
      <div class="chart-title" style="margin-bottom:16px">${svgList()} Top Categories</div>
      <div id="top-cats"><p style="color:var(--text-dim);font-size:0.85rem">Loading...</p></div>
    </div>
  </div>`;


  // Load AI
  loadAIInsights();

  // Build chart safely
  if (state.stats && state.stats.categories) {
    setTimeout(() => {
      buildInsightDoughnut(state.stats.categories);
      buildTopCats(state.stats.categories, state.stats.total);
    }, 50);
  } else {
    // If stats are empty, fetch them from backend first
    api.getStats().then(stats => {
      state.stats = stats;
      buildInsightDoughnut(state.stats.categories);
      buildTopCats(state.stats.categories, state.stats.total);
    }).catch(err => console.error("Error fetching stats:", err));
  }
}

async function loadAIInsights() {
  const el = document.getElementById('ai-content');
  if (!el) return;
  try {
    const res = await api.getAIInsights();
    el.className = 'ai-content fade-in';
    el.textContent = res.insights;
  } catch (err) {
    el.className = 'ai-content';
    el.innerHTML = `<span style="color:var(--red)">Failed to load insights. Check your GROQ_API_KEY.</span>`;
  }
}

async function refreshInsights() {
  const el = document.getElementById('ai-content');
  if (!el) return;
  el.className = 'ai-content ai-loading';
  el.innerHTML = `<div class="pulse-dot"></div> Re-analyzing...`;
  await loadAIInsights();
  showToast('Insights refreshed!', 'success');
}

function buildInsightDoughnut(cats) {
  const canvas = document.getElementById('insight-doughnut');
  if (!canvas) return;
  
  // Destroy existing chart if any
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
  
  const labels = Object.keys(cats);
  const values = Object.values(cats);
  const colors = labels.map(l => catColor(l));
  
  const legend = document.getElementById('insight-legend');
  if (legend) {
    legend.innerHTML = labels.map((l, i) => 
      `<div class="legend-item">
        <span class="legend-dot" style="background:${colors[i]}"></span>${l}
      </div>`
    ).join('');
  }
  
  if (!labels.length) {
    canvas.parentElement.innerHTML = `<div class="empty-state"><p>No data yet</p></div>`;
    return;
  }

  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#13131F'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation:{ duration: 800},
      plugins: { legend: { display: false } },
      cutout: '72%',
    },
  });
}

function buildTopCats(cats, total) {
  const el = document.getElementById('top-cats');
  if (!el) return;
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);
  el.innerHTML = sorted.map(([cat, amt]) => {
    const pct = total ? (amt / total * 100).toFixed(1) : 0;
    return `
    <div style="margin-bottom:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:8px;font-size:0.85rem;color:var(--text-primary)">
          <span style="width:10px;height:10px;border-radius:50%;background:${catColor(cat)};display:inline-block;flex-shrink:0"></span>
          <span>${cat}</span>
        </div>
        <div style="text-align:right">
          <div style="color:var(--electric);font-family:'JetBrains Mono',monospace;font-size:0.82rem">${fmt(amt)}</div>
          <div style="color:var(--text-dim);font-size:0.7rem">${pct}%</div>
        </div>
      </div>
      <div style="height:6px;background:var(--bg-border);border-radius:10px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${catColor(cat)};border-radius:10px;transition:width 1.2s ease"></div>
      </div>
    </div>`;
  }).join('');
}

// ── Logout ─────────────────────────────────────────────────────────────────
async function handleLogout() {
  try { await api.logout(); } catch (_) {}
  state.user = null;
  state.expenses = [];
  state.stats = null; 
  renderAuth();
}

// ── SVG Icons ──────────────────────────────────────────────────────────────
const svgDashboard = () => `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`;
const svgList      = () => `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`;
const svgPlus      = () => `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`;
const svgAI        = () => `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2a7 7 0 017 7c0 4-3 6-4 8H9c-1-2-4-4-4-8a7 7 0 017-7z"/><path d="M9 21h6M10 17h4"/></svg>`;
const svgLogout    = () => `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>`;
const svgTrash     = () => `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>`;
const svgPie       = () => `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>`;
const svgBar       = () => `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>`;
const svgX         = () => `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
const svgRefresh   = () => `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>`;
const svgEmpty     = () => `<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>`;

// ── Boot ───────────────────────────────────────────────────────────────────
(async function boot() {
  try {
    const res  = await api.me();
    state.user = res;
    renderApp();
    await loadAll();
  } catch (_) {
    renderAuth();
  }
})();
