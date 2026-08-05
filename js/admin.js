// ── Contraseña del admin (cambiar según lo que defina José) ──────────────────
const ADMIN_PASSWORD = "tekcoat2026";

// ── Login ─────────────────────────────────────────────────────────────────────
function verificarLogin() {
  const pass = document.getElementById('admin-pass').value;
  if (pass === ADMIN_PASSWORD) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display  = 'block';
    iniciarPanel();
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
}

function cerrarSesion() {
  document.getElementById('admin-pass').value = '';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-panel').style.display  = 'none';
}

// ── Iniciar panel ─────────────────────────────────────────────────────────────
function iniciarPanel() {
  document.getElementById('admin-fecha').textContent =
    new Date().toLocaleDateString('es-DO', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  renderSolicitudes();
}

// ── Obtener solicitudes del localStorage ──────────────────────────────────────
function getSolicitudes() {
  return JSON.parse(localStorage.getItem('tekcoat_solicitudes') || '[]');
}
function saveSolicitudes(data) {
  localStorage.setItem('tekcoat_solicitudes', JSON.stringify(data));
}

// ── Render de la tabla ────────────────────────────────────────────────────────
function renderSolicitudes() {
  const solicitudes = getSolicitudes();
  const buscar  = document.getElementById('buscar').value.toLowerCase();
  const filtroE = document.getElementById('filtro-estado').value;

  const filtradas = solicitudes.filter(s => {
    const matchBuscar = !buscar ||
      s.nombre.toLowerCase().includes(buscar) ||
      s.telefono.toLowerCase().includes(buscar) ||
      s.servicio.toLowerCase().includes(buscar);
    const matchEstado = !filtroE || s.estado === filtroE;
    return matchBuscar && matchEstado;
  });

  // Stats
  document.getElementById('stat-total').textContent     = solicitudes.length;
  document.getElementById('stat-pendiente').textContent = solicitudes.filter(s => s.estado === 'pendiente').length;
  document.getElementById('stat-atendida').textContent  = solicitudes.filter(s => s.estado === 'atendida').length;
  document.getElementById('stat-rechazada').textContent = solicitudes.filter(s => s.estado === 'rechazada').length;

  const tbody = document.getElementById('tabla-body');
  tbody.innerHTML = '';

  if (filtradas.length === 0) {
    document.getElementById('sin-solicitudes').style.display = 'block';
    document.querySelector('.table-wrapper table').style.display = 'none';
    return;
  }

  document.getElementById('sin-solicitudes').style.display = 'none';
  document.querySelector('.table-wrapper table').style.display = 'table';

  // Mostrar más recientes primero
  [...filtradas].reverse().forEach((s, idx) => {
    const estadoClass = s.estado === 'atendida' ? 'badge-atendida' :
                        s.estado === 'rechazada' ? 'badge-rechazada' : 'badge-pendiente';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${filtradas.length - idx}</td>
      <td>${s.fecha}</td>
      <td><strong>${s.nombre}</strong><br/><small>${s.direccion}</small></td>
      <td><a href="https://wa.me/1${s.telefono.replace(/\D/g,'')}" target="_blank">📱 ${s.telefono}</a></td>
      <td>${s.servicio}</td>
      <td>${s.metros} m²</td>
      <td>${s.estimacion}</td>
      <td><span class="badge ${estadoClass}">${s.estado}</span></td>
      <td>
        <button class="btn-sm" onclick="verDetalle(${s.id})">Ver</button>
        <button class="btn-sm btn-sm-green" onclick="cambiarEstado(${s.id}, 'atendida')">✔</button>
        <button class="btn-sm btn-sm-red" onclick="cambiarEstado(${s.id}, 'rechazada')">✗</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Ver detalle en modal ──────────────────────────────────────────────────────
function verDetalle(id) {
  const solicitudes = getSolicitudes();
  const s = solicitudes.find(x => x.id === id);
  if (!s) return;
  window._modalId = id;

  const estadoClass = s.estado === 'atendida' ? 'badge-atendida' :
                      s.estado === 'rechazada' ? 'badge-rechazada' : 'badge-pendiente';

  document.getElementById('modal-content').innerHTML = `
    <div class="detalle-grid">
      <div class="detalle-row"><span>Fecha:</span><strong>${s.fecha}</strong></div>
      <div class="detalle-row"><span>Estado:</span><span class="badge ${estadoClass}">${s.estado}</span></div>
      <div class="detalle-row"><span>Nombre:</span><strong>${s.nombre}</strong></div>
      <div class="detalle-row"><span>Teléfono:</span><a href="https://wa.me/1${s.telefono.replace(/\D/g,'')}" target="_blank">📱 ${s.telefono}</a></div>
      <div class="detalle-row"><span>Correo:</span>${s.correo || '—'}</div>
      <div class="detalle-row"><span>Dirección:</span>${s.direccion}</div>
      <div class="detalle-row"><span>Servicio:</span>${s.servicio}</div>
      <div class="detalle-row"><span>Área:</span>${s.metros} m²</div>
      <div class="detalle-row"><span>Estimación:</span><strong>${s.estimacion}</strong></div>
      <div class="detalle-row full"><span>Descripción:</span><p>${s.descripcion || 'No especificada.'}</p></div>
    </div>
  `;
  document.getElementById('modal-overlay').style.display = 'flex';
}

function cerrarModal(e) {
  if (!e || e.target === document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').style.display = 'none';
  }
}

// ── Cambiar estado ────────────────────────────────────────────────────────────
function cambiarEstado(id, nuevoEstado) {
  const solicitudes = getSolicitudes();
  const idx = solicitudes.findIndex(x => x.id === id);
  if (idx === -1) return;
  solicitudes[idx].estado = nuevoEstado;
  saveSolicitudes(solicitudes);
  cerrarModal();
  renderSolicitudes();
}

// ── Exportar CSV ──────────────────────────────────────────────────────────────
function exportarCSV() {
  const solicitudes = getSolicitudes();
  if (solicitudes.length === 0) { alert('No hay solicitudes para exportar.'); return; }

  const headers = ['ID','Fecha','Nombre','Teléfono','Correo','Dirección','Servicio','m²','Estimación','Descripción','Estado'];
  const rows = solicitudes.map(s => [
    s.id, s.fecha, s.nombre, s.telefono, s.correo, s.direccion,
    s.servicio, s.metros, s.estimacion, s.descripcion, s.estado
  ].map(v => `"${(v||'').toString().replace(/"/g,'""')}"`));

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'tekcoat_solicitudes.csv'; a.click();
  URL.revokeObjectURL(url);
}
