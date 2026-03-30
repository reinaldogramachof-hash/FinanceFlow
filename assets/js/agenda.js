let calYear, calMonth, selectedDate, allEvents = [];

function initCalendar() {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  selectedDate = null;
}

function renderCalendar() {
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  document.getElementById('calMonthLabel').textContent = `${months[calMonth]} ${calYear}`;

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();

  const eventDays = new Set(allEvents.map(e => {
    const d = new Date(e.date + 'T00:00:00');
    if (d.getFullYear() === calYear && d.getMonth() === calMonth) return d.getDate();
    return null;
  }).filter(Boolean));

  let html = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
    .map(d => `<div class="cal-header">${d}</div>`).join('');

  // Prev month days
  const prevDays = new Date(calYear, calMonth, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month">${prevDays - i}</div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = today.getDate() === d && today.getMonth() === calMonth && today.getFullYear() === calYear;
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isSelected = selectedDate === dateStr;
    const hasEvt = eventDays.has(d);

    html += `<div class="cal-day ${isToday ? 'today' : ''} ${hasEvt ? 'has-events' : ''} ${isSelected ? 'selected' : ''}"
      onclick="selectDate('${dateStr}')">${d}</div>`;
  }

  // Fill remaining cells
  const total = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let d = 1; d <= remaining; d++) {
    html += `<div class="cal-day other-month">${d}</div>`;
  }

  document.getElementById('calendarGrid').innerHTML = html;
}

function selectDate(dateStr) {
  selectedDate = dateStr;
  renderCalendar();
  renderEvents();
  const [y, m, d] = dateStr.split('-');
  document.getElementById('eventsLabel').textContent = `Eventos — ${d}/${m}/${y}`;
}

function renderEvents() {
  const status = document.getElementById('filterEventStatus').value;
  let filtered = allEvents;

  if (selectedDate) {
    filtered = filtered.filter(e => e.date === selectedDate);
  } else {
    const m = `${calYear}-${String(calMonth+1).padStart(2,'0')}`;
    filtered = filtered.filter(e => e.date.startsWith(m));
  }

  if (status) filtered = filtered.filter(e => e.status === status);

  const list = document.getElementById('eventsList');
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><div class="icon">📅</div><p>Nenhum evento ${selectedDate ? 'neste dia' : 'neste mês'}</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(e => `
    <div class="event-item">
      <div class="event-time">${e.time ? e.time.substring(0,5) : '—'}</div>
      <div class="event-info">
        <div class="event-title">${e.title}</div>
        <div style="display:flex;gap:6px;align-items:center;margin-top:4px">
          <span class="badge ${e.type}">${e.type}</span>
          <span class="badge ${e.status === 'concluido' ? 'done' : e.status === 'cancelado' ? 'cancelled' : 'pending'}">${e.status}</span>
        </div>
        ${e.description ? `<div class="event-desc" style="margin-top:4px">${e.description}</div>` : ''}
      </div>
      <div class="event-actions">
        <button class="btn btn-secondary btn-sm btn-icon" onclick='editEvent(${JSON.stringify(e)})'>✏️</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteEvent(${e.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function loadAgenda() {
  if (!calYear) initCalendar();
  const res = await api('agenda');
  if (res) {
    allEvents = res;
    renderCalendar();
    renderEvents();
    if (!selectedDate) {
      document.getElementById('eventsLabel').textContent = `Eventos — ${new Date(calYear, calMonth).toLocaleDateString('pt-BR', { month: 'long' })}`;
    }
  }
}

document.getElementById('calPrev').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  selectedDate = null;
  document.getElementById('eventsLabel').textContent = 'Eventos';
  renderCalendar();
  renderEvents();
});

document.getElementById('calNext').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  selectedDate = null;
  document.getElementById('eventsLabel').textContent = 'Eventos';
  renderCalendar();
  renderEvents();
});

document.getElementById('filterEventStatus').addEventListener('change', renderEvents);

document.getElementById('btnAddEvent').addEventListener('click', () => {
  openEventModal();
});

function openEventModal(data = null) {
  document.getElementById('modalEventTitle').textContent = data ? 'Editar Evento' : 'Novo Evento';
  document.getElementById('eventId').value = data?.id || '';
  document.getElementById('eventTitle').value = data?.title || '';
  document.getElementById('eventDate').value = data?.date || (selectedDate || new Date().toISOString().split('T')[0]);
  document.getElementById('eventTime').value = data?.time || '';
  document.getElementById('eventType').value = data?.type || 'evento';
  document.getElementById('eventStatus').value = data?.status || 'pendente';
  document.getElementById('eventDesc').value = data?.description || '';
  openModal('modalEvent');
}

function editEvent(e) { openEventModal(e); }

document.getElementById('btnSaveEvent').addEventListener('click', async () => {
  const id = document.getElementById('eventId').value;
  const title = document.getElementById('eventTitle').value.trim();
  const date = document.getElementById('eventDate').value;

  if (!title || !date) {
    showToast('Título e data são obrigatórios', 'error');
    return;
  }

  const payload = {
    title,
    date,
    time: document.getElementById('eventTime').value,
    type: document.getElementById('eventType').value,
    status: document.getElementById('eventStatus').value,
    description: document.getElementById('eventDesc').value
  };

  let res;
  if (id) {
    res = await api(`agenda?id=${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  } else {
    res = await api('agenda', { method: 'POST', body: JSON.stringify(payload) });
  }

  if (res) {
    showToast(id ? 'Evento atualizado!' : 'Evento criado!');
    closeModal('modalEvent');
    loadAgenda();
  }
});

async function deleteEvent(id) {
  if (!confirm('Excluir este evento?')) return;
  const res = await api(`agenda?id=${id}`, { method: 'DELETE' });
  if (res) { showToast('Evento removido!'); loadAgenda(); }
}
