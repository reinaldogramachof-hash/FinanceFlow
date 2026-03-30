async function loadNotas() {
  const notes = await api('notes');
  const grid = document.getElementById('notesGrid');

  if (!notes || !notes.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1">
        <div class="empty-state">
          <div class="icon">📝</div>
          <p>Nenhuma anotação ainda. Clique em "Nova Nota" para começar!</p>
        </div>
      </div>`;
    return;
  }

  grid.innerHTML = notes.map(n => `
    <div class="note-card" style="--note-color:${n.color}">
      <div class="note-card-actions">
        <button class="btn btn-secondary btn-sm btn-icon" onclick='editNote(${JSON.stringify(n).replace(/'/g,"&#39;")})' title="Editar">✏️</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteNote(${n.id})" title="Excluir">🗑️</button>
      </div>
      <div class="note-card-title">${escapeHtml(n.title)}</div>
      <div class="note-card-content">${escapeHtml(n.content || '')}</div>
      <div class="note-card-date">
        <span style="color:${n.color}">●</span>
        Atualizado em ${formatDate(n.updated_at?.split(' ')[0] || n.created_at?.split(' ')[0])}
      </div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function openNoteModal(data = null) {
  document.getElementById('modalNoteTitle').textContent = data ? 'Editar Anotação' : 'Nova Anotação';
  document.getElementById('noteId').value = data?.id || '';
  document.getElementById('noteTitle').value = data?.title || '';
  document.getElementById('noteContent').value = data?.content || '';
  const color = data?.color || '#6366f1';
  document.getElementById('noteColor').value = color;
  renderColorPicker(color);
  clearFieldErrors('noteTitle');
  openModal('modalNote');
}

function editNote(n) { openNoteModal(n); }

document.getElementById('btnAddNote').addEventListener('click', () => openNoteModal());

document.getElementById('btnSaveNote').addEventListener('click', async () => {
  const id = document.getElementById('noteId').value;
  const title = document.getElementById('noteTitle').value.trim();

  clearFieldErrors('noteTitle');
  if (!title) { setFieldError('noteTitle', 'Título é obrigatório'); return; }

  const payload = {
    title,
    content: document.getElementById('noteContent').value,
    color: document.getElementById('noteColor').value
  };

  let res;
  if (id) {
    res = await api(`notes?id=${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  } else {
    res = await api('notes', { method: 'POST', body: JSON.stringify(payload) });
  }

  if (res) {
    showToast(id ? 'Nota atualizada!' : 'Nota salva!');
    closeModal('modalNote');
    loadNotas();
  }
});

function deleteNote(id) {
  confirmDelete('Deseja excluir esta anotação?', async () => {
    const res = await api(`notes?id=${id}`, { method: 'DELETE' });
    if (res) { showToast('Nota removida!'); loadNotas(); }
  });
  return;
}
