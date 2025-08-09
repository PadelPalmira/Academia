/* script.js — Frontend logic para conectar con Google Sheets Apps Script.
   Reemplaza SCRIPT_URL con la URL de tu Web App desplegado en Google Apps Script.
*/

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPlNfD6fZya3ZnavqbXw6-C6uw-IiU6Xc0gch9zGJ-n9Fg3VeSbkuyMRKiFeeMQRviGQ/exec'; // <-- Cambiar aquí después de publicar code.gs
const COACH_PIN = '5858'; // PIN para sección entrenadores (solicitado)

/* ---------- Helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function apiFetch(action, payload = {}) {
  const url = `${SCRIPT_URL}?action=${encodeURIComponent(action)}`;
  const opts = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  };
  return fetch(url, opts).then(r => {
    if (!r.ok) throw new Error('Error al conectar con backend');
    return r.json();
  });
}

/* ---------- UI routing ---------- */
const pages = {
  dashboard: $('#dashboard'),
  players: $('#players'),
  attendance: $('#attendance'),
  coaches: $('#coaches')
};

function showPage(name) {
  Object.values(pages).forEach(p => p.classList.remove('active'));
  pages[name].classList.add('active');
  if (name === 'dashboard') loadDashboard();
  if (name === 'players') loadPlayers();
  if (name === 'attendance') {
    $('#attendanceDate').value = new Date().toISOString().slice(0,10);
    loadAttendanceFor($('#attendanceDate').value);
  }
  if (name === 'coaches') {
    requestCoachPin();
  }
}

/* Top nav */
$('#btnDashboard').onclick = () => showPage('dashboard');
$('#btnPlayers').onclick = () => showPage('players');
$('#btnAttendance').onclick = () => showPage('attendance');
$('#btnCoaches').onclick = () => showPage('coaches');

/* Modal helpers */
const modal = $('#modal');
const modalContent = $('#modalContent');
function openModal(html) {
  modalContent.innerHTML = html;
  modal.classList.remove('hidden');
}
function closeModal() {
  modal.classList.add('hidden');
  modalContent.innerHTML = '';
}
$('#modalClose').onclick = closeModal;
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

/* ---------- DASHBOARD ---------- */
async function loadDashboard(){
  try {
    const resp = await apiFetch('getDashboard');
    renderTodayClasses(resp.todayClasses || []);
    renderPending(resp.pending || []);
    renderLowClasses(resp.lowClasses || []);
  } catch (err) {
    console.error(err);
    alert('Error cargando dashboard');
  }
}
function renderTodayClasses(list) {
  const ul = $('#todayClasses'); ul.innerHTML = '';
  if (!list.length) ul.innerHTML = '<li class="small">No hay clases hoy.</li>';
  list.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<div>
      <strong>${item.groupName || item.nombre}</strong><div class="small">${item.horario} • ${item.coaches}</div>
    </div>
    <div class="small">${item.type}</div>`;
    ul.appendChild(li);
  });
}
function renderPending(list) {
  const ul = $('#pendingPayments'); ul.innerHTML = '';
  if (!list.length) ul.innerHTML = '<li class="small">Ningún pago pendiente.</li>';
  list.forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = `<div>
      <strong>${p.nombre}</strong><div class="small">${p.tipo} • ${p.dias} • ${p.horario}</div>
    </div>
    <div>
      <span class="badge pending">MXN ${p.monto}</span>
      <button class="btn icon" onclick="markPaid('${p.id}')">Marcar pago</button>
    </div>`;
    ul.appendChild(li);
  });
}
function renderLowClasses(list) {
  const ul = $('#lowClasses'); ul.innerHTML = '';
  if (!list.length) ul.innerHTML = '<li class="small">Nadie con pocas clases.</li>';
  list.forEach(p => {
    const li = document.createElement('li');
    li.className = 'low-alert';
    li.innerHTML = `<div>
      <strong>${p.nombre}</strong>
      <div class="small">${p.tipo} • Quedan: ${p.clases_restantes}</div>
    </div>
    <div>
      <button class="btn" onclick="openRenew('${p.id}')">Renovar</button>
      <button class="btn" onclick="cancelPackage('${p.id}')">Cancelar</button>
    </div>`;
    ul.appendChild(li);
  });
}

/* Mark paid */
async function markPaid(playerId) {
  const fecha = new Date().toISOString().slice(0,10);
  try {
    await apiFetch('markPayment', {id: playerId, fecha_pago: fecha});
    alert('Pago registrado.');
    loadDashboard();
  } catch(e){ console.error(e); alert('Error registrando pago'); }
}

/* Renueva / Cancela */
async function openRenew(playerId){
  openModal(`<h3>Renovar paquete</h3>
    <p class="small">Registrar renovación como PAGADO o PENDIENTE.</p>
    <div>
      <label>Tipo:</label>
      <select id="renewType">
        <option value="Academia adultos">Academia adultos</option>
        <option value="Academia niños">Academia niños</option>
        <option value="Clases individuales">Clases individuales</option>
      </select>
      <label>Paquete/precio (MXN):</label>
      <input id="renewPrice" class="input" type="number" value="2200" />
      <div class="row">
        <button class="btn primary" onclick="confirmRenew('${playerId}', true)">Registrar PAGADO</button>
        <button class="btn" onclick="confirmRenew('${playerId}', false)">Registrar PENDIENTE</button>
      </div>
    </div>`);
}
async function confirmRenew(id, pagado) {
  const tipo = $('#renewType').value;
  const monto = Number($('#renewPrice').value) || 0;
  try {
    await apiFetch('renewPackage', {id, tipo, monto, pagado});
    closeModal();
    alert('Renovación registrada.');
    loadDashboard();
  } catch(e){ console.error(e); alert('Error al renovar'); }
}
async function cancelPackage(id){
  if (!confirm('Confirmar cancelar paquete del jugador')) return;
  try {
    await apiFetch('cancelPackage', {id});
    alert('Paquete cancelado');
    loadDashboard();
  } catch(e){ console.error(e); alert('Error al cancelar'); }
}

/* ---------- JUGADORES UI ---------- */
$('#btnAddPlayer').onclick = () => showAddPlayerForm();

async function loadPlayers(){
  try {
    const resp = await apiFetch('getPlayers');
    renderPlayersGroups(resp.players || []);
  } catch(e){ console.error(e); alert('Error al cargar jugadores'); }
}

function renderPlayersGroups(players){
  const container = $('#playersGroups');
  container.innerHTML = '';

  // Group by tipo
  const groups = {};
  players.forEach(p => {
    const tipo = p.tipo || 'Sin categoría';
    groups[tipo] = groups[tipo] || [];
    groups[tipo].push(p);
  });

  for (const tipo in groups) {
    const card = document.createElement('div');
    card.className = 'card';
    const html = `<h3>${tipo} (${groups[tipo].length})</h3>
      <ul class="list">${groups[tipo].map(p => {
        const low = Number(p.clases_restantes) <= 2 ? ' <span class="badge low">¡Bajo!</span>' : '';
        const pagado = p.estado_pago === 'Pagado' ? `<span class="small">Pagado</span>` : `<span class="badge pending">Pendiente</span>`;
        return `<li id="player_${p.id}">
          <div>
            <strong>${p.nombre}</strong><div class="small">${p.dias} • ${p.horario} • ${p.coaches}</div>
          </div>
          <div style="text-align:right">
            ${pagado}<div class="small">Quedan: ${p.clases_restantes}${low}</div>
            <div style="margin-top:8px">
              <button class="btn" onclick="editPlayer('${p.id}')">Editar</button>
              <button class="btn" onclick="openAttendanceQuick('${p.id}')">Asistencia</button>
            </div>
          </div>
        </li>`}).join('')}</ul>`;
    card.innerHTML = html;
    container.appendChild(card);
  }
}

/* Add Player form */
function showAddPlayerForm(player = null) {
  const isEdit = !!player;
  const form = `
    <h3>${isEdit ? 'Editar jugador' : 'Agregar jugador'}</h3>
    <div>
      <label>Nombre</label>
      <input id="p_nombre" class="input" value="${player ? player.nombre : ''}" />
      <label>Teléfono (opcional)</label>
      <input id="p_telefono" class="input" value="${player ? player.telefono : ''}" />
      <label>Edad</label>
      <input id="p_edad" class="input" type="number" value="${player ? player.edad : ''}" />
      <label>Tipo de clase</label>
      <select id="p_tipo" class="input">
        <option ${player && player.tipo==='Academia adultos'?'selected':''}>Academia adultos</option>
        <option ${player && player.tipo==='Academia niños'?'selected':''}>Academia niños</option>
        <option ${player && player.tipo==='Clases individuales'?'selected':''}>Clases individuales</option>
      </select>

      <label>Paquete o suelta</label>
      <select id="p_paquete" class="input">
        <option value="Paquete" ${player && player.paquete==='Paquete'?'selected':''}>Paquete</option>
        <option value="Suelta" ${player && player.paquete==='Suelta'?'selected':''}>Suelta</option>
      </select>

      <label>Precio total (MXN) — si aplica</label>
      <input id="p_precio" class="input" type="number" value="${player ? player.precio_total || '' : ''}" />

      <label>Clases totales (por paquete)</label>
      <input id="p_clases_totales" class="input" type="number" value="${player ? player.clases_totales || '' : 8}" />

      <label>Días de clase (ej: Lunes,Miércoles)</label>
      <input id="p_dias" class="input" value="${player ? player.dias || '' : ''}" />

      <label>Horario</label>
      <input id="p_horario" class="input" value="${player ? player.horario || '' : ''}" />

      <label>Entrenadores asignados (separar por coma)</label>
      <input id="p_coaches" class="input" value="${player ? player.coaches || '' : ''}" />

      <label>Estado de pago</label>
      <select id="p_estado" class="input">
        <option ${player && player.estado_pago==='Pagado'?'selected':''}>Pagado</option>
        <option ${player && player.estado_pago==='Pendiente'?'selected':''}>Pendiente</option>
      </select>

      <label>Fecha de pago</label>
      <input id="p_fecha_pago" class="input" type="date" value="${player ? player.fecha_pago || '' : ''}" />

      <div class="row">
        <button class="btn primary" onclick="savePlayer('${player ? player.id : ''}')">${isEdit ? 'Guardar' : 'Agregar'}</button>
        ${isEdit ? `<button class="btn" onclick="deletePlayer('${player.id}')">Eliminar</button>` : ''}
      </div>
    </div>
  `;
  openModal(form);
}

/* Save player (create or update) */
async function savePlayer(id='') {
  const data = {
    id,
    nombre: $('#p_nombre').value.trim(),
    telefono: $('#p_telefono').value.trim(),
    edad: $('#p_edad').value,
    tipo: $('#p_tipo').value,
    paquete: $('#p_paquete').value,
    precio_total: Number($('#p_precio').value) || 0,
    clases_totales: Number($('#p_clases_totales').value) || 8,
    dias: $('#p_dias').value,
    horario: $('#p_horario').value,
    coaches: $('#p_coaches').value,
    estado_pago: $('#p_estado').value,
    fecha_pago: $('#p_fecha_pago').value
  };

  try {
    if (!data.nombre) { alert('Nombre es obligatorio'); return; }
    const action = id ? 'updatePlayer' : 'addPlayer';
    await apiFetch(action, data);
    closeModal();
    loadPlayers();
    loadDashboard();
  } catch(e){ console.error(e); alert('Error guardando jugador'); }
}

/* Edit / Delete helpers */
async function editPlayer(id) {
  try {
    const resp = await apiFetch('getPlayer',{id});
    showAddPlayerForm(resp.player);
  } catch(e){ console.error(e); alert('Error al cargar jugador'); }
}
async function deletePlayer(id) {
  if (!confirm('Eliminar jugador permanentemente?')) return;
  try {
    await apiFetch('deletePlayer',{id});
    closeModal();
    loadPlayers();
  } catch(e){ console.error(e); alert('Error eliminando jugador'); }
}

/* Quick attendance toggle from player */
function openAttendanceQuick(id) {
  openModal(`<h3>Marcar asistencia</h3>
    <p class="small">Fecha</p>
    <input type="date" id="quickDate" class="input" value="${new Date().toISOString().slice(0,10)}" />
    <div class="row" style="margin-top:12px">
      <button class="btn primary" onclick="markAttendance('${id}', true)">Asistencia</button>
      <button class="btn" onclick="markAttendance('${id}', false)">Falta</button>
    </div>`);
}
async function markAttendance(id, presente){
  const fecha = $('#quickDate').value || new Date().toISOString().slice(0,10);
  try {
    await apiFetch('addAttendance',{playerId:id, fecha, presente});
    closeModal();
    loadPlayers();
    loadDashboard();
    alert('Asistencia registrada');
  } catch(e){ console.error(e); alert('Error marcando asistencia'); }
}

/* ---------- ASISTENCIA ---------- */
$('#attendanceDate').addEventListener('change', (e)=> loadAttendanceFor(e.target.value));

async function loadAttendanceFor(dateISO) {
  try {
    const resp = await apiFetch('getAttendance',{fecha: dateISO});
    const classes = resp.classes || []; // agrupadas por horario o grupo
    renderAttendanceClasses(classes, dateISO);
  } catch(e){ console.error(e); alert('Error cargando asistencia') }
}

function renderAttendanceClasses(classes, dateISO) {
  const ul = $('#classesOfDay'); ul.innerHTML = '';
  if (!classes.length) { ul.innerHTML = '<li class="small">No hay clases programadas</li>'; return; }

  classes.forEach(c => {
    const li = document.createElement('li');
    li.innerHTML = `<div>
        <strong>${c.groupName || c.nombre}</strong>
        <div class="small">${c.horario} • ${c.coaches}</div>
      </div>
      <div>
        ${c.players.map(p => {
          const status = p.presente ? '✅' : (p.faltas>=3 ? '🎟️' : '❌');
          const color = p.presente ? 'background:var(--success);padding:6px;border-radius:8px' : '';
          return `<div style="margin-bottom:6px">
              <span style="margin-right:8px">${status}</span>
              <strong>${p.nombre}</strong>
              <div class="small">${p.clases_restantes} quedan</div>
              <div style="margin-top:6px">
                <button class="btn" onclick="toggleAttendance('${dateISO}','${p.id}', ${p.presente?0:1})">Marcar</button>
              </div>
            </div>`;
        }).join('')}
      </div>`;
    ul.appendChild(li);
  });
}

async function toggleAttendance(fecha, playerId, marcarPresente){
  try {
    await apiFetch('toggleAttendance',{fecha, playerId, presente: Boolean(marcarPresente)});
    loadAttendanceFor(fecha);
    loadPlayers();
    loadDashboard();
  } catch(e){ console.error(e); alert('Error actualizando asistencia') }
}

/* ---------- ENTRENADORES ---------- */
$('#btnAddCoach').onclick = () => {
  openModal(`<h3>Agregar coach</h3>
    <label>Nombre</label><input id="c_nombre" class="input" />
    <label>Teléfono (opcional)</label><input id="c_tel" class="input" />
    <div class="row">
      <button class="btn primary" onclick="saveCoach()">Agregar</button>
    </div>`);
};

async function requestCoachPin(){
  const pin = prompt('Ingresar PIN para sección entrenadores:');
  if (pin !== COACH_PIN) {
    alert('PIN incorrecto');
    showPage('dashboard');
    return;
  }
  loadCoaches();
}

async function saveCoach(){
  const nombre = $('#c_nombre').value.trim(); const tel = $('#c_tel').value.trim();
  if (!nombre) { alert('Nombre requerido'); return; }
  try { await apiFetch('addCoach',{nombre,tel}); closeModal(); loadCoaches(); } catch(e){console.error(e); alert('Error guardando coach');}
}

async function loadCoaches(){
  try {
    const resp = await apiFetch('getCoaches');
    const container = $('#coachesList'); container.innerHTML = '';
    resp.coaches.forEach(c => {
      const div = document.createElement('div'); div.className = 'card';
      div.innerHTML = `<h3>${c.nombre}</h3><div class="small">${c.tel || ''}</div>
        <div style="margin-top:8px">
          <button class="btn" onclick="viewCoach('${c.id}')">Ver</button>
        </div>`;
      container.appendChild(div);
    });
  } catch(e){ console.error(e); alert('Error cargando coaches'); }
}

async function viewCoach(id){
  try {
    const resp = await apiFetch('getCoach',{id});
    const data = resp.coach;
    openModal(`<h3>${data.nombre}</h3>
      <div class="small">Tel: ${data.tel || '—'}</div>
      <div style="margin-top:12px">
        <button class="btn" onclick="generateReport('${id}')">Generar reporte quincenal</button>
      </div>`);
  } catch(e){ console.error(e); alert('Error'); }
}

async function generateReport(coachId){
  try {
    const from = prompt('Fecha inicio de periodo (YYYY-MM-DD):', new Date().toISOString().slice(0,10));
    const to = prompt('Fecha fin de periodo (YYYY-MM-DD):', new Date().toISOString().slice(0,10));
    if (!from || !to) return;
    const resp = await apiFetch('getQuincenaReport',{coachId, from, to});
    // Descargar imagen JPG: code.gs devolverá dataURL base64
    if (resp.report && resp.report.dataUrl) {
      const a = document.createElement('a');
      a.href = resp.report.dataUrl;
      a.download = `reporte_coach_${coachId}_${from}_a_${to}.jpg`;
      a.click();
    } else alert('No se generó reporte');
  } catch(e){ console.error(e); alert('Error generando reporte') }
}

/* ---------- Inicialización ---------- */
(async function init(){
  // try to load dashboard
  try { await loadDashboard(); } catch(e){ console.warn('No se cargó dashboard aún') }
})();
