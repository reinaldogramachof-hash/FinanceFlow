let chartLineInstance = null;
let chartDoughnutInstance = null;

async function loadReports() {
  const year = document.getElementById('reportYear').value || new Date().getFullYear();
  const data = await api(`reports?year=${year}`);
  if (!data) return;

  const { monthly, by_category, totals } = data;
  const totalIncome = parseFloat(totals.total_income) || 0;
  const totalExpense = parseFloat(totals.total_expense) || 0;
  const balance = totalIncome - totalExpense;
  const savings = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;

  // Stats
  document.getElementById('reportStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon green">↑</div>
      <div class="stat-info">
        <div class="stat-label">Total Receitas ${year}</div>
        <div class="stat-value green">${formatMoney(totalIncome)}</div>
        <div class="stat-sub">${totals.total_transactions || 0} transações no ano</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon red">↓</div>
      <div class="stat-info">
        <div class="stat-label">Total Despesas ${year}</div>
        <div class="stat-value red">${formatMoney(totalExpense)}</div>
        <div class="stat-sub">Média: ${formatMoney(totalExpense / 12)}/mês</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon ${balance >= 0 ? 'accent' : 'red'}">💰</div>
      <div class="stat-info">
        <div class="stat-label">Saldo do Ano</div>
        <div class="stat-value ${balance >= 0 ? 'green' : 'red'}">${formatMoney(balance)}</div>
        <div class="stat-sub">${balance >= 0 ? 'Positivo' : 'Negativo'}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon yellow">📊</div>
      <div class="stat-info">
        <div class="stat-label">Taxa de Poupança</div>
        <div class="stat-value accent">${savings}%</div>
        <div class="stat-sub">Da renda anual</div>
      </div>
    </div>
  `;

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#334155' : '#e2e8f0';

  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const incomeByMonth = Array(12).fill(0);
  const expenseByMonth = Array(12).fill(0);

  monthly.forEach(m => {
    const idx = parseInt(m.month) - 1;
    incomeByMonth[idx] = parseFloat(m.income) || 0;
    expenseByMonth[idx] = parseFloat(m.expense) || 0;
  });

  // Line chart
  if (chartLineInstance) chartLineInstance.destroy();
  const ctxLine = document.getElementById('chartLine').getContext('2d');
  chartLineInstance = new Chart(ctxLine, {
    type: 'line',
    data: {
      labels: monthNames,
      datasets: [
        {
          label: 'Receitas',
          data: incomeByMonth,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#10b981'
        },
        {
          label: 'Despesas',
          data: expenseByMonth,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#ef4444'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: textColor, font: { size: 11 } } },
        tooltip: { callbacks: { label: ctx => ` ${formatMoney(ctx.raw)}` } }
      },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor, callback: v => 'R$' + v.toFixed(0) }, grid: { color: gridColor } }
      }
    }
  });

  // Doughnut - expenses only
  const expCats = by_category.filter(c => c.type === 'despesa');
  const pieColors = ['#6366f1','#ef4444','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#14b8a6','#f97316','#10b981','#06b6d4'];

  if (chartDoughnutInstance) chartDoughnutInstance.destroy();
  const ctxD = document.getElementById('chartDoughnut').getContext('2d');
  chartDoughnutInstance = new Chart(ctxD, {
    type: 'doughnut',
    data: {
      labels: expCats.map(c => c.category),
      datasets: [{
        data: expCats.map(c => parseFloat(c.total)),
        backgroundColor: pieColors,
        borderWidth: 2,
        borderColor: isDark ? '#1e293b' : '#fff'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'right', labels: { color: textColor, font: { size: 11 }, padding: 10, boxWidth: 12 } },
        tooltip: { callbacks: { label: ctx => ` ${formatMoney(ctx.raw)}` } }
      }
    }
  });

  // Table
  const allCats = by_category;
  const totalVal = allCats.reduce((s, c) => s + parseFloat(c.total), 0);
  document.getElementById('reportTable').innerHTML = allCats.map(c => {
    const pct = totalVal > 0 ? ((parseFloat(c.total) / totalVal) * 100).toFixed(1) : 0;
    return `
      <tr>
        <td><strong>${c.category}</strong></td>
        <td><span class="badge ${c.type === 'receita' ? 'income' : 'expense'}">${c.type}</span></td>
        <td class="${c.type === 'receita' ? 'amount-positive' : 'amount-negative'}">${formatMoney(c.total)}</td>
        <td style="color:var(--text-muted)">${c.count}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="progress-bar" style="width:80px">
              <div class="progress-fill" style="width:${pct}%;background:${c.type === 'receita' ? 'var(--green)' : 'var(--red)'}"></div>
            </div>
            <span style="font-size:12px;color:var(--text-muted)">${pct}%</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}
