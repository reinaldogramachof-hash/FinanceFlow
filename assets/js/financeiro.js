async function loadFinanceiro() {
  // Restaurar filtros persistidos
  const savedFilters = JSON.parse(localStorage.getItem('finFilters') || '{}');
  const filterMonthEl = document.getElementById('filterMonth');
  const filterTypeEl = document.getElementById('filterType');
  if (savedFilters.month && !filterMonthEl.value) filterMonthEl.value = savedFilters.month;
  if (savedFilters.type && !filterTypeEl.value) filterTypeEl.value = savedFilters.type;

  const month = document.getElementById('filterMonth').value || getCurrentMonth();
  const type = document.getElementById('filterType').value;
  const category = document.getElementById('filterCategory').value;

  let url = `transactions?month=${month}`;
  if (type) url += `&type=${type}`;
  if (category) url += `&category=${encodeURIComponent(category)}`;

  // Skeleton loader
  document.getElementById('finTransactions').innerHTML = `
    <tr><td colspan="6">
      <div class="skeleton skeleton-row"></div>
      <div class="skeleton skeleton-row"></div>
      <div class="skeleton skeleton-row"></div>
      <div class="skeleton skeleton-row"></div>
    </td></tr>
  `;

  const data = await api(url);
  if (!data) return;

  const { summary, data: transactions } = data;
  const income = parseFloat(summary.income) || 0;
  const expense = parseFloat(summary.expense) || 0;
  const balance = income - expense;

  updateCategoryFilter(transactions);

  document.getElementById('finStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon ${balance >= 0 ? 'green' : 'red'}">${balance >= 0 ? '↑' : '↓'}</div>
      <div class="stat-info">
        <div class="stat-label">Saldo</div>
        <div class="stat-value ${balance >= 0 ? 'green' : 'red'}">${formatMoney(balance)}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green">💚</div>
      <div class="stat-info">
        <div class="stat-label">Receitas</div>
        <div class="stat-value green">${formatMoney(income)}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon red">❤️</div>
      <div class="stat-info">
        <div class="stat-label">Despesas</div>
        <div class="stat-value red">${formatMoney(expense)}</div>
      </div>
    </div>
  `;

  document.getElementById('finCount').textContent = `${transactions.length} transação(ões)`;

  const tbody = document.getElementById('finTransactions');
  if (!transactions.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="icon">📭</div><p>Nenhuma transação encontrada</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = transactions.map(t => `
    <tr>
      <td>${formatDate(t.date)}</td>
      <td>${t.description || '—'}</td>
      <td><span style="font-size:12px;padding:3px 8px;background:var(--accent-light);color:var(--accent);border-radius:20px">${t.category}</span></td>
      <td><span class="badge ${t.type === 'receita' ? 'income' : 'expense'}">${t.type === 'receita' ? '↑ Receita' : '↓ Despesa'}</span></td>
      <td class="${t.type === 'receita' ? 'amount-positive' : 'amount-negative'}" style="font-size:14px">${formatMoney(t.value)}</td>
      <td style="text-align:center">
        <div style="display:flex;gap:4px;justify-content:center">
          <button class="btn btn-secondary btn-sm btn-icon" onclick='editTransaction(${JSON.stringify(t)})' title="Editar">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteTransaction(${t.id})" title="Excluir">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function editTransaction(t) {
  openTransactionModal(t);
}

function deleteTransaction(id) {
  confirmDelete('Deseja excluir esta transação? Esta ação não pode ser desfeita.', async () => {
    const res = await api(`transactions?id=${id}`, { method: 'DELETE' });
    if (res) {
      showToast('Transação removida!');
      if (currentPage === 'financeiro') loadFinanceiro();
      if (currentPage === 'dashboard') loadDashboard();
    }
  });
  return;
}

// Filters com persistência no localStorage
['filterMonth', 'filterType', 'filterCategory'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    localStorage.setItem('finFilters', JSON.stringify({
      month: document.getElementById('filterMonth').value,
      type: document.getElementById('filterType').value,
      category: document.getElementById('filterCategory').value
    }));
    loadFinanceiro();
  });
});

// ===== EXPORT CSV =====
document.getElementById('btnExportCSV').addEventListener('click', exportCSV);

async function exportCSV() {
  const month = document.getElementById('filterMonth').value || getCurrentMonth();
  const type = document.getElementById('filterType').value;
  const category = document.getElementById('filterCategory').value;

  let url = `transactions?month=${month}`;
  if (type) url += `&type=${type}`;
  if (category) url += `&category=${encodeURIComponent(category)}`;

  const data = await api(url);
  if (!data || !data.data.length) {
    showToast('Nenhuma transação para exportar', 'info');
    return;
  }

  const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor'];
  const rows = data.data.map(t => [
    formatDate(t.date),
    t.type,
    t.category,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    String(t.value).replace('.', ',')
  ]);

  const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `financeflow_${month}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('CSV exportado com sucesso!');
}
