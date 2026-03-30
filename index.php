<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>FinanceFlow — Gerenciador Financeiro</title>

  <!-- PWA -->
  <link rel="manifest" href="manifest.json" />
  <meta name="theme-color" content="#6366f1" id="metaThemeColor" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="FinanceFlow" />
  <link rel="apple-touch-icon" href="assets/icons/icon.svg" />

  <!-- SEO / Social -->
  <meta name="description" content="Gerencie suas finanças pessoais com FinanceFlow" />
  <meta name="application-name" content="FinanceFlow" />

  <link rel="stylesheet" href="assets/css/style.css" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>

<!-- ===== SIDEBAR ===== -->
<aside class="sidebar">
  <div class="sidebar-logo">
    <div class="logo-icon">💰</div>
    <div class="logo-text">
      <h2>FinanceFlow</h2>
      <span>Gestão Financeira</span>
    </div>
  </div>

  <nav class="sidebar-nav">
    <span class="nav-label">Menu</span>
    <button class="nav-item active" data-page="dashboard">
      <span class="icon">📊</span> Dashboard
    </button>
    <button class="nav-item" data-page="financeiro">
      <span class="icon">💳</span> Financeiro
    </button>
    <button class="nav-item" data-page="agenda">
      <span class="icon">📅</span> Agenda
    </button>
    <button class="nav-item" data-page="notas">
      <span class="icon">📝</span> Anotações
    </button>
    <button class="nav-item" data-page="relatorios">
      <span class="icon">📈</span> Relatórios
    </button>
  </nav>

  <div class="sidebar-bottom">
    <div class="theme-toggle">
      <span>🌙 Modo Escuro</span>
      <label class="toggle-switch">
        <input type="checkbox" id="themeToggle" />
        <span class="toggle-slider"></span>
      </label>
    </div>
  </div>
</aside>

<!-- ===== MAIN ===== -->
<main class="main">

  <!-- TOPBAR -->
  <header class="topbar">
    <button class="hamburger" id="hamburgerBtn" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
    <div class="topbar-title">
      <h1 id="pageTitle">Dashboard</h1>
      <p id="pageSubtitle">Visão geral das suas finanças</p>
    </div>
    <div class="topbar-actions">
      <span id="currentDate" style="font-size:12px;color:var(--text-muted)"></span>
      <button class="btn btn-primary" id="btnAdd">
        <span>＋</span> Nova Transação
      </button>
    </div>
  </header>

  <!-- CONTENT -->
  <div class="content">

    <!-- ===== DASHBOARD ===== -->
    <div class="page active" id="page-dashboard">
      <div class="stats-grid" id="dashStats"></div>
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <span class="card-title">📊 Despesas por Categoria</span>
            <span style="font-size:11px;color:var(--text-muted)" id="dashMonth"></span>
          </div>
          <div class="chart-container">
            <canvas id="chartPie"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">📈 Receitas vs Despesas</span>
          </div>
          <div class="chart-container">
            <canvas id="chartBar"></canvas>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">🕒 Últimas Transações</span>
          <button class="btn btn-secondary btn-sm" onclick="navigate('financeiro')">Ver todas</button>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody id="dashTransactions"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ===== FINANCEIRO ===== -->
    <div class="page" id="page-financeiro">
      <div class="filter-bar">
        <input type="month" class="form-control" id="filterMonth" />
        <select class="form-control" id="filterType">
          <option value="">Todos os tipos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>
        <select class="form-control" id="filterCategory">
          <option value="">Todas as categorias</option>
        </select>
        <button class="btn btn-primary" id="btnAddTransaction">
          ＋ Adicionar
        </button>
      </div>

      <div class="stats-grid" id="finStats" style="margin-bottom:20px"></div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">💳 Transações</span>
          <span id="finCount" style="font-size:12px;color:var(--text-muted)"></span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th style="text-align:center">Ações</th>
              </tr>
            </thead>
            <tbody id="finTransactions"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ===== AGENDA ===== -->
    <div class="page" id="page-agenda">
      <div class="section-header">
        <span></span>
        <button class="btn btn-primary" id="btnAddEvent">📅 Novo Evento</button>
      </div>
      <div class="agenda-layout">
        <div class="card">
          <div class="cal-nav">
            <button class="btn btn-secondary btn-sm" id="calPrev">‹</button>
            <h3 id="calMonthLabel"></h3>
            <button class="btn btn-secondary btn-sm" id="calNext">›</button>
          </div>
          <div class="calendar-grid" id="calendarGrid"></div>
        </div>
        <div>
          <div class="card">
            <div class="card-header">
              <span class="card-title" id="eventsLabel">Eventos</span>
              <select class="form-control" id="filterEventStatus" style="width:auto;font-size:12px;padding:5px 8px">
                <option value="">Todos</option>
                <option value="pendente">Pendentes</option>
                <option value="concluido">Concluídos</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>
            <div class="events-list" id="eventsList"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== NOTAS ===== -->
    <div class="page" id="page-notas">
      <div class="section-header">
        <span class="section-title">📝 Minhas Anotações</span>
        <button class="btn btn-primary" id="btnAddNote">＋ Nova Nota</button>
      </div>
      <div class="notes-grid" id="notesGrid"></div>
    </div>

    <!-- ===== RELATÓRIOS ===== -->
    <div class="page" id="page-relatorios">
      <div class="filter-bar" style="margin-bottom:24px">
        <select class="form-control" id="reportYear" style="width:auto">
        </select>
        <button class="btn btn-primary" onclick="loadReports()">Gerar Relatório</button>
      </div>

      <div class="stats-grid" id="reportStats"></div>

      <div class="reports-grid">
        <div class="card">
          <div class="card-header">
            <span class="card-title">📈 Evolução Mensal</span>
          </div>
          <div class="chart-container" style="height:260px">
            <canvas id="chartLine"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">🍩 Gastos por Categoria</span>
          </div>
          <div class="chart-container" style="height:260px">
            <canvas id="chartDoughnut"></canvas>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">📋 Análise por Categoria</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Total</th>
                <th>Transações</th>
                <th>Participação</th>
              </tr>
            </thead>
            <tbody id="reportTable"></tbody>
          </table>
        </div>
      </div>
    </div>

  </div><!-- /content -->
</main>

<!-- ===== MODAL TRANSAÇÃO ===== -->
<div class="modal-overlay" id="modalTransaction">
  <div class="modal">
    <div class="modal-header">
      <span class="modal-title" id="modalTransTitle">Nova Transação</span>
      <button class="modal-close" onclick="closeModal('modalTransaction')">✕</button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="tranId" />
      <div class="type-selector">
        <button class="type-btn active income" data-type="receita" id="btnReceita">
          ↑ Receita
        </button>
        <button class="type-btn expense" data-type="despesa" id="btnDespesa">
          ↓ Despesa
        </button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Valor (R$)</label>
          <input type="number" class="form-control" id="tranValue" placeholder="0,00" step="0.01" min="0" />
        </div>
        <div class="form-group">
          <label class="form-label">Data</label>
          <input type="date" class="form-control" id="tranDate" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Categoria</label>
        <select class="form-control" id="tranCategory"></select>
      </div>
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <input type="text" class="form-control" id="tranDesc" placeholder="Ex: Salário mensal..." />
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modalTransaction')">Cancelar</button>
      <button class="btn btn-primary" id="btnSaveTransaction">Salvar</button>
    </div>
  </div>
</div>

<!-- ===== MODAL EVENTO ===== -->
<div class="modal-overlay" id="modalEvent">
  <div class="modal">
    <div class="modal-header">
      <span class="modal-title" id="modalEventTitle">Novo Evento</span>
      <button class="modal-close" onclick="closeModal('modalEvent')">✕</button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="eventId" />
      <div class="form-group">
        <label class="form-label">Título</label>
        <input type="text" class="form-control" id="eventTitle" placeholder="Ex: Reunião, Conta de luz..." />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Data</label>
          <input type="date" class="form-control" id="eventDate" />
        </div>
        <div class="form-group">
          <label class="form-label">Horário</label>
          <input type="time" class="form-control" id="eventTime" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select class="form-control" id="eventType">
            <option value="evento">Evento</option>
            <option value="conta">Conta a Pagar</option>
            <option value="lembrete">Lembrete</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="eventStatus">
            <option value="pendente">Pendente</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <textarea class="form-control" id="eventDesc" placeholder="Detalhes do evento..."></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modalEvent')">Cancelar</button>
      <button class="btn btn-primary" id="btnSaveEvent">Salvar</button>
    </div>
  </div>
</div>

<!-- ===== MODAL NOTA ===== -->
<div class="modal-overlay" id="modalNote">
  <div class="modal" style="max-width:520px">
    <div class="modal-header">
      <span class="modal-title" id="modalNoteTitle">Nova Anotação</span>
      <button class="modal-close" onclick="closeModal('modalNote')">✕</button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="noteId" />
      <div class="form-group">
        <label class="form-label">Título</label>
        <input type="text" class="form-control" id="noteTitle" placeholder="Título da nota..." />
      </div>
      <div class="form-group">
        <label class="form-label">Conteúdo</label>
        <textarea class="form-control" id="noteContent" placeholder="Escreva aqui..." style="min-height:140px"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Cor</label>
        <div class="color-options" id="noteColors"></div>
        <input type="hidden" id="noteColor" value="#6366f1" />
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modalNote')">Cancelar</button>
      <button class="btn btn-primary" id="btnSaveNote">Salvar</button>
    </div>
  </div>
</div>

<!-- SIDEBAR BACKDROP -->
<div class="sidebar-backdrop" id="sidebarBackdrop"></div>

<!-- BOTTOM NAV (mobile) -->
<nav class="bottom-nav">
  <div class="bottom-nav-inner">
    <button class="bnav-item active" data-page="dashboard">
      <span class="bnav-icon">📊</span>
      <span>Dashboard</span>
    </button>
    <button class="bnav-item" data-page="financeiro">
      <span class="bnav-icon">💳</span>
      <span>Financeiro</span>
    </button>
    <button class="bnav-item" data-page="agenda">
      <span class="bnav-icon">📅</span>
      <span>Agenda</span>
    </button>
    <button class="bnav-item" data-page="notas">
      <span class="bnav-icon">📝</span>
      <span>Notas</span>
    </button>
    <button class="bnav-item" data-page="relatorios">
      <span class="bnav-icon">📈</span>
      <span>Relatórios</span>
    </button>
  </div>
</nav>

<!-- PWA INSTALL BANNER -->
<div class="install-banner" id="installBanner">
  <div class="install-banner-icon">💰</div>
  <div class="install-banner-text">
    <strong>Instalar FinanceFlow</strong>
    <span>Adicione à tela inicial para acesso rápido</span>
  </div>
  <div class="install-banner-actions">
    <button class="btn btn-secondary btn-sm" id="installDismiss">Não</button>
    <button class="btn btn-primary btn-sm" id="installAccept">Instalar</button>
  </div>
</div>

<!-- TOASTS -->
<div class="toast-container" id="toastContainer"></div>

<script src="assets/js/app.js"></script>
<script src="assets/js/dashboard.js"></script>
<script src="assets/js/financeiro.js"></script>
<script src="assets/js/agenda.js"></script>
<script src="assets/js/notas.js"></script>
<script src="assets/js/relatorios.js"></script>

<script>
// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[SW] Registrado:', reg.scope))
      .catch(err => console.warn('[SW] Erro:', err));
  });
}

// ===== PWA INSTALL =====
let deferredPrompt = null;
const installBanner = document.getElementById('installBanner');
const installAccept = document.getElementById('installAccept');
const installDismiss = document.getElementById('installDismiss');

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  if (!localStorage.getItem('pwa-dismissed')) {
    installBanner.classList.add('visible');
  }
});

installAccept.addEventListener('click', async () => {
  installBanner.classList.remove('visible');
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') showToast('App instalado com sucesso! 🎉');
    deferredPrompt = null;
  }
});

installDismiss.addEventListener('click', () => {
  installBanner.classList.remove('visible');
  localStorage.setItem('pwa-dismissed', '1');
});

window.addEventListener('appinstalled', () => {
  installBanner.classList.remove('visible');
  showToast('FinanceFlow instalado! 🎉', 'success');
});

// ===== THEME COLOR META =====
function updateThemeColorMeta(theme) {
  const color = theme === 'light' ? '#ffffff' : '#0f172a';
  document.getElementById('metaThemeColor').setAttribute('content', color);
}
</script>
</body>
</html>
