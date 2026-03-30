// ===== CATEGORIES =====
const CATEGORIES = {
  receita: ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Aluguel Recebido', 'Outros'],
  despesa: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Vestuário', 'Contas', 'Investimentos', 'Outros']
};

const NOTE_COLORS = ['#6366f1','#10b981','#ef4444','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#14b8a6'];

const PAGE_INFO = {
  dashboard:  { title: 'Dashboard',    subtitle: 'Visão geral das suas finanças' },
  financeiro: { title: 'Financeiro',   subtitle: 'Gerencie suas receitas e despesas' },
  agenda:     { title: 'Agenda',       subtitle: 'Compromissos e lembretes' },
  notas:      { title: 'Anotações',    subtitle: 'Suas anotações pessoais' },
  relatorios: { title: 'Relatórios',   subtitle: 'Análise detalhada das suas finanças' }
};

let currentPage = 'dashboard';
let transactionType = 'receita';
let editingId = null;

// ===== NAVIGATION =====
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.bnav-item').forEach(n => n.classList.remove('active'));

  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll(`[data-page="${page}"]`).forEach(el => el.classList.add('active'));

  const info = PAGE_INFO[page];
  document.getElementById('pageTitle').textContent = info.title;
  document.getElementById('pageSubtitle').textContent = info.subtitle;
  document.getElementById('btnAdd').style.display = page === 'financeiro' || page === 'dashboard' ? 'flex' : 'none';

  currentPage = page;
  closeSidebar();

  if (page === 'dashboard') loadDashboard();
  if (page === 'financeiro') loadFinanceiro();
  if (page === 'agenda') loadAgenda();
  if (page === 'notas') loadNotas();
  if (page === 'relatorios') loadReports();
}

// ===== HAMBURGER / SIDEBAR MOBILE =====
function openSidebar() {
  document.querySelector('.sidebar').classList.add('mobile-open');
  document.getElementById('sidebarBackdrop').classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('mobile-open');
  document.getElementById('sidebarBackdrop').classList.remove('visible');
  document.body.style.overflow = '';
}

document.getElementById('hamburgerBtn').addEventListener('click', () => {
  const isOpen = document.querySelector('.sidebar').classList.contains('mobile-open');
  isOpen ? closeSidebar() : openSidebar();
});

document.getElementById('sidebarBackdrop').addEventListener('click', closeSidebar);

// Bottom nav
document.querySelectorAll('.bnav-item').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.page));
});

// ===== THEME =====
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('change', () => {
  const theme = themeToggle.checked ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  const label = themeToggle.closest('.theme-toggle').querySelector('span');
  label.textContent = theme === 'light' ? '☀️ Modo Claro' : '🌙 Modo Escuro';
  localStorage.setItem('theme', theme);
  if (typeof updateThemeColorMeta === 'function') updateThemeColorMeta(theme);
  // Redraw charts
  if (currentPage === 'dashboard') loadDashboard();
  if (currentPage === 'relatorios') loadReports();
});

// Restore theme
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
if (savedTheme === 'light') {
  themeToggle.checked = true;
  themeToggle.closest('.theme-toggle').querySelector('span').textContent = '☀️ Modo Claro';
}
// Will be called once updateThemeColorMeta is defined in index.php inline script
document.addEventListener('DOMContentLoaded', () => {
  if (typeof updateThemeColorMeta === 'function') updateThemeColorMeta(savedTheme);
});

// ===== CURRENT DATE =====
function updateDate() {
  const now = new Date();
  const opts = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('pt-BR', opts);
}
updateDate();

// ===== MODAL HELPERS =====
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span> ${msg}`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ===== API HELPER =====
// Local PHP server (localhost/127.0.0.1) → adiciona .php
// Vercel / produção → sem extensão (Node.js serverless functions)
const _isLocalPHP = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const _API_EXT = _isLocalPHP ? '.php' : '';

async function api(endpoint, options = {}) {
  // endpoint: 'transactions' ou 'transactions?id=5'
  const [path, ...qs] = endpoint.split('?');
  const query = qs.join('?');
  const url = `api/${path}${_API_EXT}${query ? '?' + query : ''}`;

  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || `Erro ${res.status}`, 'error');
      return null;
    }
    return await res.json();
  } catch (e) {
    showToast('Sem conexão com o servidor', 'error');
    return null;
  }
}

// ===== FORMAT HELPERS =====
function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ===== TRANSACTION MODAL =====
function populateCategorySelect(type) {
  const sel = document.getElementById('tranCategory');
  sel.innerHTML = CATEGORIES[type].map(c => `<option value="${c}">${c}</option>`).join('');
}

function openTransactionModal(data = null) {
  editingId = data ? data.id : null;
  document.getElementById('modalTransTitle').textContent = data ? 'Editar Transação' : 'Nova Transação';
  document.getElementById('tranId').value = data?.id || '';
  document.getElementById('tranValue').value = data?.value || '';
  document.getElementById('tranDate').value = data?.date || new Date().toISOString().split('T')[0];
  document.getElementById('tranDesc').value = data?.description || '';

  const type = data?.type || 'receita';
  transactionType = type;
  populateCategorySelect(type);
  document.getElementById('tranCategory').value = data?.category || CATEGORIES[type][0];

  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.type === type) btn.classList.add('active');
  });

  openModal('modalTransaction');
}

document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    transactionType = btn.dataset.type;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    populateCategorySelect(transactionType);
  });
});

document.getElementById('btnAdd').addEventListener('click', () => openTransactionModal());
document.getElementById('btnAddTransaction').addEventListener('click', () => openTransactionModal());

document.getElementById('btnSaveTransaction').addEventListener('click', async () => {
  const value = parseFloat(document.getElementById('tranValue').value);
  const date = document.getElementById('tranDate').value;
  const category = document.getElementById('tranCategory').value;
  const description = document.getElementById('tranDesc').value;

  if (!value || !date || !category) {
    showToast('Preencha todos os campos obrigatórios', 'error');
    return;
  }

  const payload = { type: transactionType, value, date, category, description };
  let result;

  if (editingId) {
    result = await api(`transactions?id=${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
  } else {
    result = await api('transactions', { method: 'POST', body: JSON.stringify(payload) });
  }

  if (result) {
    showToast(editingId ? 'Transação atualizada!' : 'Transação salva!');
    closeModal('modalTransaction');
    if (currentPage === 'dashboard') loadDashboard();
    if (currentPage === 'financeiro') loadFinanceiro();
  }
});

// ===== SIDEBAR NAVIGATION =====
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.page));
});

// ===== CATEGORY FILTER =====
function updateCategoryFilter(transactions) {
  const sel = document.getElementById('filterCategory');
  const current = sel.value;
  const cats = [...new Set(transactions.map(t => t.category))].sort();
  sel.innerHTML = '<option value="">Todas as categorias</option>' +
    cats.map(c => `<option value="${c}" ${c === current ? 'selected' : ''}>${c}</option>`).join('');
}

// ===== NOTE COLORS =====
function renderColorPicker(selectedColor) {
  document.getElementById('noteColors').innerHTML = NOTE_COLORS.map(c =>
    `<div class="color-opt ${c === selectedColor ? 'selected' : ''}" style="background:${c}" data-color="${c}"></div>`
  ).join('');

  document.querySelectorAll('.color-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      document.getElementById('noteColor').value = opt.dataset.color;
    });
  });
}

// ===== INIT =====
const filterMonth = document.getElementById('filterMonth');
filterMonth.value = getCurrentMonth();

// Populate year selector for reports
const reportYear = document.getElementById('reportYear');
const thisYear = new Date().getFullYear();
for (let y = thisYear; y >= thisYear - 5; y--) {
  const opt = document.createElement('option');
  opt.value = y;
  opt.textContent = y;
  reportYear.appendChild(opt);
}

loadDashboard();
