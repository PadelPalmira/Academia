// script.js
/*
  Nota: ESTE script.js comunica con un Web App de Google Apps Script (code.gs)
  que deberás desplegar y pegar aquí la URL en la variable APPS_SCRIPT_URL.
  El code.gs incluido en este proyecto crea endpoints para leer/escribir
  las pestañas: Jugadores, Asistencias, Coaches, Pagos.
*/
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzarukL2epiKVQzVA2M9N8-Ecn6D_EIv_tUsymjPO3qrrLrfKa8fUOnSY7GoAQuBejMrw/exec'; // <- pega aquí la URL desplegada

// --- helpers: peticiones al backend ---
async function gsFetch(action, payload = {}){
  const body = {action, ...payload};
  const resp = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  return resp.json();
}

// --- inicialización UI ---
document.addEventListener('DOMContentLoaded', () =>{
  setupNav();
  bindButtons();
  loadDashboard();
});

function setupNav(){
  const show = id => document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden')) || document.getElementById(id).classList.remove('hidden');
  document.getElementById('btn-dashboard').onclick = ()=>show('dashboard');
  document.getElementById('btn-jugadores').onclick = ()=>show('jugadores'); loadJugadores();
  document.getElementById('btn-asistencia').onclick = ()=>show('asistencia');
  document.getElementById('btn-entrenadores').onclick = ()=>show('entrenadores');
}

function bindButtons(){
  document.getElementById('nuevo-jugador').addEventListener('click', openNuevoJugador);
  document.getElementById('cancel-jugador').addEventListener('click', closeModalJugador);
  document.getElementById('form-jugador').addEventListener('submit', submitJugador);
  document.getElementById('modal-jugador').addEventListener('click', (e)=>{ if(e.target.id === 'modal-jugador') closeModalJugador(); });

  // modalidad toggle
  document.getElementById('modalidad-select').addEventListener('change', (e)=>{
    const v = e.target.value;
    document.getElementById('academia-fields').classList.toggle('hidden', v!=='academia');
    document.getElementById('individual-fields').classList.toggle('hidden', v!=='individual');
  });

  document.getElementById('load-day').addEventListener('click', loadDayClasses);

  // PIN
  document.getElementById('pin-enter').addEventListener('click', ()=>{
    const pin = document.getElementById('pin-input').value.trim();
    if(pin === '5858'){
      document.getElementById('pin-screen').classList.add('hidden');
      document.getElementById('entrenadores-content').classList.remove('hidden');
      loadCoaches();
    } else alert('PIN incorrecto');
  });
  document.getElementById('pin-cancel').addEventListener('click', ()=>{document.getElementById('pin-input').value='';});

  // coach modal
  document.getElementById('nuevo-coach').addEventListener('click', ()=>document.getElementById('modal-coach').classList.remove('hidden'));
  document.getElementById('cancel-coach').addEventListener('click', ()=>document.getElementById('modal-coach').classList.add('hidden'));
  document.getElementById('form-coach').addEventListener('submit', submitCoach);
}

// --- Dashboard ---
async function loadDashboard(){
  try{
    const res = await gsFetch('getSummary');
    const cards = document.getElementById('summary-cards'); cards.innerHTML = '';
    const createCard = (t,v) => { const c = document.createElement('div'); c.className='card'; c.innerHTML = `<strong>${t}</strong><div>${v}</div>`; return c; };
    cards.appendChild(createCard('Jugadores totales', res.totalJugadores||0));
    cards.appendChild(createCard('Clases hoy', res.clasesHoy||0));
    cards.appendChild(createCard('Pagos pendientes', res.pagosPendientes||0));

    // bajas clases
    const low = document.getElementById('low-classes-list'); low.innerHTML='';
    (res.jugadoresBajos||[]).forEach(j=>{
      const el = document.createElement('div'); el.className='jugadores-row';
      el.innerHTML = `<div><strong>${j.nombre}</strong><div class='list-small'>${j.modalidad} • ${j.clases_restantes} clases</div></div><div class='badge low'>${j.clases_restantes}</div>`;
      low.appendChild(el);
    });

    const pend = document.getElementById('pending-payments'); pend.innerHTML='';
    (res.pendientes||[]).forEach(p=>{ const div=document.createElement('div');div.className='jugadores-row';div.innerHTML=`<div><strong>${p.nombre}</strong><div class='list-small'>${p.modalidad} • ${p.monto}</div></div><div class='badge pending'>Pendiente</div>`;pend.appendChild(div); });
  }catch(err){console.error(err);}
}

// --- Jugadores ---
let editingJugadorId = null;
function openNuevoJugador(){
  editingJugadorId = null;
  document.getElementById('modal-jugador-title').textContent='Nuevo jugador';
  document.getElementById('form-jugador').reset();
  document.getElementById('modal-jugador').classList.remove('hidden');
}
function closeModalJugador(){ document.getElementById('modal-jugador').classList.add('hidden'); }

async function submitJugador(e){
  e.preventDefault();
  const f = new FormData(e.target);
  const obj = Object.fromEntries(f.entries());
  // normalizar campos
  obj.coaches = (obj.coaches || obj.coaches_individual || '').split(',').map(s=>s.trim()).filter(Boolean).join(',');
  obj.modalidad = obj.modalidad || 'academia';
  // cálculo automático de monto
  if(obj.modalidad === 'academia'){
    obj.monto = obj.tipo_academia === 'adultos' ? 2200 : 1800;
    obj.clases_restantes = Number(obj.clases_restantes) || 8;
  } else {
    const num = Number(obj.num_jugadores||1);
    const tipo = obj.tipo_individual || 'suelta';
    if(tipo === 'suelta'){
      const precioMap = {1:600,2:800,3:900,4:1000}; obj.monto = precioMap[num]||600; obj.clases_restantes = 1;
    } else {
      const packMap = {1:2000,2:2700,3:3000,4:3400}; obj.monto = packMap[num]||2000; obj.clases_restantes = 4;
    }
  }
  // save
  const resp = await gsFetch('saveJugador', {jugador: obj});
  if(resp.ok) { alert('Jugador guardado'); closeModalJugador(); loadJugadores(); loadDashboard(); }
  else alert('Error al guardar');
}

async function loadJugadores(){
  const res = await gsFetch('listJugadores');
  const cont = document.getElementById('jugadores-list'); cont.innerHTML='';
  res.forEach(j=>{
    const el = document.createElement('div'); el.className='jugadores-row';
    el.innerHTML = `<div><strong>${j.nombre}</strong><div class='list-small'>${j.modalidad} • ${j.dias || j.fecha_individual || ''} • ${j.horario || ''}</div></div>
      <div style='display:flex;gap:8px;align-items:center'>
        <div class='badge'>${j.clases_restantes}</div>
        <button class='btn-ghost' data-id='${j._id}' onclick='editJugador("${j._id}")'>Editar</button>
        <button class='btn-ghost' data-id='${j._id}' onclick='deleteJugador("${j._id}")'>Borrar</button>
      </div>`;
    cont.appendChild(el);
  });
}

async function editJugador(id){
  const r = await gsFetch('getJugador',{id});
  if(!r) return alert('No encontrado');
  editingJugadorId = id;
  const f = document.getElementById('form-jugador');
  f.reset();
  // map fields
  f.nombre.value = r.nombre || '';
  f.edad.value = r.edad || '';
  f.telefono.value = r.telefono || '';
  if(r.modalidad === 'individual'){
    document.getElementById('modalidad-select').value = 'individual';
    document.getElementById('academia-fields').classList.add('hidden');
    document.getElementById('individual-fields').classList.remove('hidden');
    f.tipo_individual.value = r.tipo_individual || 'suelta';
    f.num_jugadores.value = r.num_jugadores || 1;
    f.fecha_individual.value = r.fecha_individual || '';
    f.horario_individual.value = r.horario_individual || '';
    f.coaches_individual.value = r.coaches || '';
    f.estado_pago_individual.value = r.estado_pago || 'pendiente';
    f.clases_restantes_individual.value = r.clases_restantes || 1;
  } else {
    document.getElementById('modalidad-select').value = 'academia';
    document.getElementById('academia-fields').classList.remove('hidden');
    document.getElementById('individual-fields').classList.add('hidden');
    f.tipo_academia.value = r.tipo_academia || 'adultos';
    f.dias.value = r.dias || '';
    f.horario.value = r.horario || '';
    f.coaches.value = r.coaches || '';
    f.fecha_pago.value = r.fecha_pago || '';
    f.estado_pago.value = r.estado_pago || 'pendiente';
    f.clases_restantes.value = r.clases_restantes || 8;
  }
  document.getElementById('modal-jugador').classList.remove('hidden');
}

async function deleteJugador(id){ if(!confirm('Borrar jugador?')) return; const r = await gsFetch('deleteJugador',{id}); if(r.ok) loadJugadores(); }

// --- Asistencias / Calendario ---
async function loadDayClasses(){
  const date = document.getElementById('asistencia-date').value;
  if(!date) return alert('Selecciona una fecha');
  const res = await gsFetch('getClassesByDate',{date});
  const container = document.getElementById('day-classes'); container.innerHTML='';
  // ordenar por horario
  res.sort((a,b)=> (a.horario||'').localeCompare(b.horario||''));
  res.forEach(c=>{
    const row = document.createElement('div'); row.className='jugadores-row';
    // determinar color
    let statusBadge = '';
    if(c.sustitucion) statusBadge = `<div class='badge' style='background:var(--warn)'>Sustitución</div>`;
    else if(c.asistio === 'si') statusBadge = `<div class='badge' style='background:var(--success)'>Asistió</div>`;
    else if(c.asistio === 'no') statusBadge = `<div class='badge' style='background:var(--danger)'>Falta</div>`;
    row.innerHTML = `<div><strong>${c.nombre}</strong><div class='list-small'>${c.modalidad} • ${c.horario || c.horario_individual}</div></div>
      <div style='display:flex;gap:6px;align-items:center'>${statusBadge}
        <button class='btn-ghost' onclick='toggleAsistencia("${c._id}","${date}")'>Marcar</button>
        <button class='btn-ghost' onclick='openSubstitute("${c._id}","${date}")'>Sustituir coach</button>
      </div>`;
    container.appendChild(row);
  });
}

async function toggleAsistencia(id,date){
  const n = prompt('Marcar asistencia: escribe si/no'); if(!n) return; const r = await gsFetch('setAsistencia',{id, date, asistio: n}); if(r.ok) loadDayClasses();
}

async function openSubstitute(id,date){
  const newCoach = prompt('ID del coach sustituto'); if(!newCoach) return; const r = await gsFetch('setSubstitute',{id,date,newCoach}); if(r.ok) loadDayClasses();
}

// --- Coaches ---
async function submitCoach(e){ e.preventDefault(); const f=new FormData(e.target); const obj=Object.fromEntries(f.entries()); const r = await gsFetch('saveCoach',{coach: obj}); if(r.ok){ alert('Coach guardado'); document.getElementById('modal-coach').classList.add('hidden'); loadCoaches(); } }

async function loadCoaches(){ const res = await gsFetch('listCoaches'); const cont = document.getElementById('coaches-list'); cont.innerHTML=''; res.forEach(c=>{ const el=document.createElement('div'); el.className='jugadores-row'; el.innerHTML=`<div><strong>${c.nombre}</strong><div class='list-small'>${c.correo||''} • ${c.telefono||''}</div></div><div><button class='btn-ghost' onclick='viewCoach("${c._id}")'>Ver</button></div>`; cont.appendChild(el); }); }

async function viewCoach(id){ const r = await gsFetch('coachSummary',{id}); if(!r) return alert('Error'); const s = document.getElementById('coach-summary'); s.classList.remove('hidden'); s.innerHTML = `<h3>Resumen: ${r.nombre}</h3><div>Clases: ${r.clases || 0}</div><div>Comisión: $${r.comision || 0}</div>`; }

// --- util ---
function uid(){ return 'id_' + Math.random().toString(36).slice(2,9); }

/* FIN script.js */
