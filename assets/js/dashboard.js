let chartPieInstance = null;
let chartBarInstance = null;

async function loadDashboard() {
  const month = getCurrentMonth();
  document.getElementById('dashMonth').textContent = new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const data = await api(`transactions?month=${month}`);
  if (!data) return;

  const { summary, data: transactions } = data;
  const income = parseFloat(summary.income) || 0;
  const expense = parseFloat(summary.expense) || 0;
  const balance = income - expense;

  // Stats
  document.getElementById('dashStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon accent">💰</div>
      <div class="stat-info">
        <div class="stat-label">Saldo do Mês</div>
        <div class="stat-value ${balance >= 0 ? 'green' : 'red'}">${formatMoney(balance)}</div>
        <div class="stat-sub">Mês atual</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green">↑</div>
      <div class="stat-info">
        <div class="stat-label">Total Receitas</div>
        <div class="stat-value green">${formatMoney(income)}</div>
        <div class="stat-sub">${transactions.filter(t=>t.type==='receita').length} transações</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon red">↓</div>
      <div class="stat-info">
        <div class="stat-label">Total Despesas</div>
        <div class="stat-value red">${formatMoney(expense)}</div>
        <div class="stat-sub">${transactions.filter(t=>t.type==='despesa').length} transações</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon yellow">📊</div>
      <div class="stat-info">
        <div class="stat-label">Taxa de Economia</div>
        <div class="stat-value accent">${income > 0 ? Math.round(((income - expense) / income) * 100) : 0}%</div>
        <div class="stat-sub">Do total de receitas</div>
      </div>
    </div>
  `;

  // Last transactions
  const recent = transactions.slice(0, 8);
  document.getElementById('dashTransactions').innerHTML = recent.length
    ? recent.map(t => `
      <tr>
        <td>${formatDate(t.date)}</td>
        <td>${t.description || '—'}</td>
        <td>${t.category}</td>
        <td><span class="badge ${t.type === 'receita' ? 'income' : 'expense'}">${t.type === 'receita' ? '↑ Receita' : '↓ Despesa'}</span></td>
        <td class="${t.type === 'receita' ? 'amount-positive' : 'amount-negative'}">${formatMoney(t.value)}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="5"><div class="empty-state"><div class="icon">📭</div><p>Nenhuma transação este mês</p></div></td></tr>`;

  // Charts
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#334155' : '#e2e8f0';

  // Pie - despesas por categoria
  const expenses = transactions.filter(t => t.type === 'despesa');
  const catMap = {};
  expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + parseFloat(t.value); });
  const pieLabels = Object.keys(catMap);
  const pieValues = Object.values(catMap);
  const pieColors = ['#6366f1','#10b981','#ef4444','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#14b8a6','#f97316','#06b6d4'];

  if (chartPieInstance) chartPieInstance.destroy();
  const ctxPie = document.getElementById('chartPie').getContext('2d');
  chartPieInstance = new Chart(ctxPie, {
    type: 'pie',
    data: {
      labels: pieLabels,
      datasets: [{ data: pieValues, backgroundColor: pieColors, borderWidth: 2, borderColor: isDark ? '#1e293b' : '#fff' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: textColor, font: { size: 11 }, padding: 12, boxWidth: 12 } },
        tooltip: { callbacks: { label: ctx => ` ${formatMoney(ctx.raw)}` } }
      }
    }
  });

  // Bar - receitas vs despesas (últimos 6 meses)
  const now = new Date();
  const months = [];
  const incomeData = [];
  const expenseData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    months.push(d.toLocaleDateString('pt-BR', { month: 'short' }));
    incomeData.push(0);
    expenseData.push(0);
  }

  const allData = await api('transactions');
  if (allData) {
    allData.data.forEach(t => {
      const tm = t.date.substring(0, 7);
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (tm === m) {
          const idx = 5 - i;
          if (t.type === 'receita') incomeData[idx] += parseFloat(t.value);
          else expenseData[idx] += parseFloat(t.value);
        }
      }
    });
  }

  if (chartBarInstance) chartBarInstance.destroy();
  const ctxBar = document.getElementById('chartBar').getContext('2d');
  chartBarInstance = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Receitas', data: incomeData, backgroundColor: 'rgba(16,185,129,0.8)', borderRadius: 6 },
        { label: 'Despesas', data: expenseData, backgroundColor: 'rgba(239,68,68,0.8)', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor, callback: v => 'R$' + v }, grid: { color: gridColor } }
      }
    }
  });
}
