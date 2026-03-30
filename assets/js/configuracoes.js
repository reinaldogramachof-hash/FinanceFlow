// ===== MÓDULO DE CONFIGURAÇÕES =====

// ===== PERFIL =====
function loadConfiguracoes() {
  const profile = JSON.parse(localStorage.getItem('ff_profile') || '{}');
  document.getElementById('profileName').value = profile.name || '';
  document.getElementById('profileCPF').value  = profile.cpf  || '';
  document.getElementById('profileNotes').value = profile.notes || '';
  renderCategories();
}

// Máscara CPF
document.getElementById('profileCPF').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').substring(0, 11);
  if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
  this.value = v;
});

document.getElementById('btnSaveProfile').addEventListener('click', () => {
  const profile = {
    name:  document.getElementById('profileName').value.trim(),
    cpf:   document.getElementById('profileCPF').value.trim(),
    notes: document.getElementById('profileNotes').value.trim()
  };
  localStorage.setItem('ff_profile', JSON.stringify(profile));
  showToast('Perfil salvo com sucesso!');
});

// ===== CATEGORIAS PERSONALIZADAS =====
function getCustomCategories() {
  return JSON.parse(localStorage.getItem('ff_categories') || '{"receita":[],"despesa":[]}');
}

function saveCustomCategories(cats) {
  localStorage.setItem('ff_categories', JSON.stringify(cats));
  // Atualiza CATEGORIES global para refletir nas transações imediatamente
  const base = {
    receita: ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Aluguel Recebido', 'Outros'],
    despesa: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Vestuário', 'Contas', 'Investimentos', 'Outros']
  };
  CATEGORIES.receita = [...new Set([...base.receita, ...cats.receita])];
  CATEGORIES.despesa = [...new Set([...base.despesa, ...cats.despesa])];
}

function renderCategories() {
  const cats = getCustomCategories();
  renderCatList('receita', cats.receita);
  renderCatList('despesa', cats.despesa);
}

function renderCatList(type, list) {
  const base = type === 'receita'
    ? ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Aluguel Recebido', 'Outros']
    : ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Vestuário', 'Contas', 'Investimentos', 'Outros'];

  const el = document.getElementById(`catList${type.charAt(0).toUpperCase() + type.slice(1)}`);

  // Categorias padrão (não removíveis)
  const defaultTags = base.map(c => `
    <span class="cat-tag" style="opacity:0.6" title="Categoria padrão">
      ${escapeHtml(c)}
    </span>
  `).join('');

  // Categorias personalizadas (removíveis)
  const customTags = list.map(c => `
    <span class="cat-tag">
      ${escapeHtml(c)}
      <button onclick="removeCategory('${type}', '${escapeHtml(c)}')" title="Remover">✕</button>
    </span>
  `).join('');

  el.innerHTML = defaultTags + customTags;
}

function addCategory(type) {
  const inputId = type === 'receita' ? 'newCatReceita' : 'newCatDespesa';
  const input = document.getElementById(inputId);
  const name = input.value.trim();
  if (!name) { input.focus(); return; }

  const cats = getCustomCategories();
  const allExisting = [...CATEGORIES.receita, ...CATEGORIES.despesa];
  if (allExisting.some(c => c.toLowerCase() === name.toLowerCase())) {
    showToast('Esta categoria já existe', 'error');
    return;
  }

  cats[type].push(name);
  saveCustomCategories(cats);
  input.value = '';
  renderCategories();
  showToast(`Categoria "${name}" adicionada!`);
}

function removeCategory(type, name) {
  const cats = getCustomCategories();
  cats[type] = cats[type].filter(c => c !== name);
  saveCustomCategories(cats);
  renderCategories();
  showToast(`Categoria "${name}" removida`);
}

// Enter nos campos de categoria
document.getElementById('newCatReceita').addEventListener('keydown', e => { if (e.key === 'Enter') addCategory('receita'); });
document.getElementById('newCatDespesa').addEventListener('keydown', e => { if (e.key === 'Enter') addCategory('despesa'); });

// ===== BACKUP =====
document.getElementById('btnBackup').addEventListener('click', async () => {
  showToast('Gerando backup...', 'info');

  const [transactions, agenda, notes] = await Promise.all([
    api('transactions'),
    api('agenda'),
    api('notes')
  ]);

  const backup = {
    version: '1.0',
    app: 'FinanceFlow',
    exportedAt: new Date().toISOString(),
    profile: JSON.parse(localStorage.getItem('ff_profile') || '{}'),
    customCategories: getCustomCategories(),
    transactions: transactions?.data || [],
    agenda: agenda || [],
    notes: notes || []
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `financeflow_backup_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Backup exportado com sucesso!');
});

// ===== RESTAURAÇÃO =====
document.getElementById('restoreFile').addEventListener('change', async function () {
  const file = this.files[0];
  if (!file) return;

  const status = document.getElementById('restoreStatus');
  status.textContent = 'Lendo arquivo...';

  let backup;
  try {
    backup = JSON.parse(await file.text());
  } catch {
    status.textContent = '';
    showToast('Arquivo inválido — não é um JSON válido', 'error');
    this.value = '';
    return;
  }

  if (!backup.app || backup.app !== 'FinanceFlow') {
    status.textContent = '';
    showToast('Arquivo não reconhecido como backup do FinanceFlow', 'error');
    this.value = '';
    return;
  }

  confirmDelete(
    `Restaurar backup de ${new Date(backup.exportedAt).toLocaleDateString('pt-BR')}?\n\nIsso irá ADICIONAR os dados do backup ao sistema (sem apagar o que já existe).`,
    async () => {
      status.textContent = 'Restaurando dados...';
      let ok = 0, fail = 0;

      // Restaurar perfil e categorias
      if (backup.profile) localStorage.setItem('ff_profile', JSON.stringify(backup.profile));
      if (backup.customCategories) saveCustomCategories(backup.customCategories);

      // Restaurar transações
      for (const t of (backup.transactions || [])) {
        const res = await api('transactions', {
          method: 'POST',
          body: JSON.stringify({ type: t.type, value: t.value, category: t.category, description: t.description, date: t.date })
        });
        res ? ok++ : fail++;
      }

      // Restaurar agenda
      for (const e of (backup.agenda || [])) {
        const res = await api('agenda', {
          method: 'POST',
          body: JSON.stringify({ title: e.title, date: e.date, time: e.time, type: e.type, status: e.status, description: e.description })
        });
        res ? ok++ : fail++;
      }

      // Restaurar notas
      for (const n of (backup.notes || [])) {
        const res = await api('notes', {
          method: 'POST',
          body: JSON.stringify({ title: n.title, content: n.content, color: n.color })
        });
        res ? ok++ : fail++;
      }

      status.textContent = '';
      this.value = '';
      loadConfiguracoes();

      if (fail === 0) {
        showToast(`Backup restaurado! ${ok} itens importados.`);
      } else {
        showToast(`${ok} importados, ${fail} com erro`, 'info');
      }
    }
  );
  this.value = '';
});

// ===== LIMPAR TUDO =====
document.getElementById('btnClearAll').addEventListener('click', () => {
  // Primeiro confirm: aviso inicial
  confirmDelete(
    '⚠️ ATENÇÃO: Todos os dados serão PERMANENTEMENTE excluídos do banco de dados — transações, eventos e anotações. Esta ação é irreversível. Deseja continuar?',
    () => {
      // Segundo confirm: confirmação final
      confirmDelete(
        '⛔ ÚLTIMA CONFIRMAÇÃO: Você tem certeza absoluta? Faça um backup antes de prosseguir. Após excluir, os dados NÃO poderão ser recuperados.',
        async () => {
          showToast('Apagando todos os dados...', 'info');

          const [transactions, agenda, notes] = await Promise.all([
            api('transactions'),
            api('agenda'),
            api('notes')
          ]);

          const deletes = [];

          for (const t of (transactions?.data || [])) {
            deletes.push(api(`transactions?id=${t.id}`, { method: 'DELETE' }));
          }
          for (const e of (agenda || [])) {
            deletes.push(api(`agenda?id=${e.id}`, { method: 'DELETE' }));
          }
          for (const n of (notes || [])) {
            deletes.push(api(`notes?id=${n.id}`, { method: 'DELETE' }));
          }

          await Promise.all(deletes);

          showToast('Todos os dados foram apagados.', 'info');
          navigate('dashboard');
        }
      );
    }
  );
});
