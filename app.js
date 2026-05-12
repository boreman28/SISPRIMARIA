/* ================================================================
   app.js — Controlador Principal de la Aplicación
   ================================================================ */

/* ==================== ESTADO GLOBAL ==================== */
window.STATE = {
  config: {
    escuela: '', docente: '', grado: '5° B',
    aula: '7', jornada: 'AM', anio: '2026'
  },
  materias: [
    'ESPAÑOL','RELIGIÓN','C.SOCIALES','INGLÉS','EXPR. ARTÍSTICA',
    'MATEMÁTICAS','C. NATURALES','SALUD Y ED. FÍSICA','TECNOLOGÍA'
  ],
  estudiantes: [
    { id:'demo1', nombre:'HUGO PÉREZ',    cedula:'4-000-001', sexo:'M', nacimiento:'2015-03-12', condicion:'Regular',  acudiente:'Carlos Pérez',   telefono:'6000-0001' },
    { id:'demo2', nombre:'PACO GÓMEZ',    cedula:'4-000-002', sexo:'M', nacimiento:'2015-06-25', condicion:'Regular',  acudiente:'Luis Gómez',     telefono:'6000-0002' },
    { id:'demo3', nombre:'LUISA MARTÍNEZ',cedula:'4-000-003', sexo:'F', nacimiento:'2015-09-08', condicion:'Regular',  acudiente:'Ana Martínez',   telefono:'6000-0003' },
    { id:'demo4', nombre:'ANDREA RUIZ',   cedula:'4-000-004', sexo:'F', nacimiento:'2015-01-17', condicion:'Especial', acudiente:'Pedro Ruiz',     telefono:'6000-0004' },
    { id:'demo5', nombre:'MARIO FLORES',  cedula:'4-000-005', sexo:'M', nacimiento:'2015-11-30', condicion:'Regular',  acudiente:'María Flores',   telefono:'6000-0005' },
  ],
  calificaciones: {},
  actividades:    {},
  asistencia:     {},
  horario:        {},
  mesesPorTri: {
    '1': ['Marzo','Abril','Mayo'],
    '2': ['Junio','Julio','Agosto'],
    '3': ['Septiembre','Octubre','Noviembre']
  },
  horarioHoras: [
    '7:00 - 7:45','7:45 - 8:30','8:30 - 9:15','9:15 - 10:00',
    'RECESO','10:15 - 11:00','11:00 - 11:45','11:45 - 12:30'
  ],
  ui: { currentSection:'dashboard', currentTri:1, currentMat:0, currentMes:'Marzo', theme:'light' }
};

/* ==================== APP CONTROLLER ==================== */
const APP = (() => {
  let _initialized = false;

  /* ---------- INIT ---------- */
  function init() {
    if (_initialized) return;
    _initialized = true;

    // Inicializar estructuras vacías ANTES de cargar
    _initEstructuras();

    // Cargar desde localStorage
    const loaded = STORAGE.load();

    // Aplicar tema
    UI.applyTheme(STATE.ui.theme);

    // Asegurar integridad de estructuras
    _asegurarEstructuras();

    // Render completo
    _renderAll();

    // Ocultar loader
    setTimeout(() => UI.hideLoader(), 600);

    if (loaded) UI.toast('Datos cargados correctamente', 'success', 2200);
  }

  /* ---------- INICIALIZAR ESTRUCTURAS VACÍAS ---------- */
  function _initEstructuras() {
    const { materias, estudiantes, mesesPorTri, horarioHoras } = STATE;
    for (let t = 1; t <= 3; t++) {
      if (!STATE.calificaciones[t]) STATE.calificaciones[t] = {};
      if (!STATE.actividades[t])    STATE.actividades[t]    = {};
      for (let m = 0; m < materias.length; m++) {
        if (!STATE.actividades[t][m])
          STATE.actividades[t][m] = Array.from({length:5}, (_,i) => ({ nombre:`Actividad ${i+1}`, fecha:'' }));
        if (!STATE.calificaciones[t][m]) STATE.calificaciones[t][m] = {};
        for (let e = 0; e < estudiantes.length; e++) {
          if (!STATE.calificaciones[t][m][e])
            STATE.calificaciones[t][m][e] = Array(5).fill('');
        }
      }
      if (!STATE.asistencia[t]) STATE.asistencia[t] = {};
      mesesPorTri[String(t)].forEach(mes => {
        if (!STATE.asistencia[t][mes]) {
          STATE.asistencia[t][mes] = {};
          for (let e = 0; e < estudiantes.length; e++)
            STATE.asistencia[t][mes][e] = Array(30).fill('');
        }
      });
    }
    horarioHoras.forEach(h => { if (!STATE.horario[h]) STATE.horario[h] = {}; });
  }

  /* ---------- ASEGURAR ESTRUCTURAS COMPLETAS (post-load) ---------- */
  function _asegurarEstructuras() {
    const { materias, estudiantes, mesesPorTri, horarioHoras } = STATE;
    for (let t = 1; t <= 3; t++) {
      if (!STATE.calificaciones[t]) STATE.calificaciones[t] = {};
      if (!STATE.actividades[t])    STATE.actividades[t]    = {};
      for (let m = 0; m < materias.length; m++) {
        if (!STATE.actividades[t][m])
          STATE.actividades[t][m] = Array.from({length:5}, (_,i) => ({ nombre:`Actividad ${i+1}`, fecha:'' }));
        if (!STATE.calificaciones[t][m]) STATE.calificaciones[t][m] = {};
        for (let e = 0; e < estudiantes.length; e++) {
          if (!STATE.calificaciones[t][m][e]) {
            const na = STATE.actividades[t][m].length;
            STATE.calificaciones[t][m][e] = Array(na).fill('');
          }
        }
      }
      if (!STATE.asistencia[t]) STATE.asistencia[t] = {};
      mesesPorTri[String(t)].forEach(mes => {
        if (!STATE.asistencia[t][mes]) STATE.asistencia[t][mes] = {};
        for (let e = 0; e < estudiantes.length; e++) {
          if (!STATE.asistencia[t][mes][e])
            STATE.asistencia[t][mes][e] = Array(30).fill('');
        }
      });
    }
    horarioHoras.forEach(h => { if (!STATE.horario[h]) STATE.horario[h] = {}; });
  }

  /* ---------- RENDER ALL ---------- */
  function _renderAll() {
    _actualizarConfig();
    renderMaterias();
    renderEstudiantes();
    renderCalif();
    renderAsistencia();
    renderHorario();
    renderBoletinSelector();
    renderBoletin();
    DASHBOARD.renderKPIs();
    DASHBOARD.renderTop5();
    DASHBOARD.renderHonor();
    setTimeout(() => CHARTS.renderAll(), 100);
    // Badge de estudiantes en sidebar
    document.getElementById('badge-est').textContent = STATE.estudiantes.length;
  }

  /* ---------- NAVEGACIÓN ---------- */
  function navigate(sectionId, navEl) {
    // Desactivar todos los paneles y nav items
    document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Activar el panel y nav item
    const panel = document.getElementById('panel-' + sectionId);
    if (panel) panel.classList.add('active');
    if (navEl) navEl.classList.add('active');
    else {
      const ni = document.querySelector(`[data-section="${sectionId}"]`);
      if (ni) ni.classList.add('active');
    }

    STATE.ui.currentSection = sectionId;
    const labels = {
      dashboard:'Dashboard', estudiantes:'Estudiantes', calificaciones:'Calificaciones',
      asistencia:'Asistencia', boletin:'Boletín', honor:'Cuadro de Honor',
      horario:'Horario', configuracion:'Configuración'
    };
    UI.setBreadcrumb(labels[sectionId] || sectionId);

    // Renderizar sección según contexto
    if (sectionId === 'dashboard')     { DASHBOARD.renderKPIs(); DASHBOARD.renderTop5(); setTimeout(() => CHARTS.renderAll(), 80); }
    if (sectionId === 'calificaciones') renderCalif();
    if (sectionId === 'asistencia')    renderAsistencia();
    if (sectionId === 'honor')         DASHBOARD.renderHonor();
    if (sectionId === 'boletin')       { renderBoletinSelector(); renderBoletin(); }
  }

  /* ==================== CONFIGURACIÓN ==================== */
  function _actualizarConfig() {
    const get = id => document.getElementById(id)?.value || '';
    STATE.config = {
      escuela: get('d-escuela'), docente: get('d-docente'),
      grado:   get('d-grado'),   anio:    get('d-anio'),
      aula:    get('d-aula'),    jornada: get('d-jornada')
    };
    // Pre-cargar los inputs si ya están vacíos
    const set = (id, v) => { const el=document.getElementById(id); if(el && !el.value && v) el.value=v; };
    set('d-escuela', STATE.config.escuela || 'Nombre de la Escuela');
    set('d-docente', STATE.config.docente || 'Nombre del Docente');
    set('d-grado',   STATE.config.grado   || '5° B');
    set('d-aula',    STATE.config.aula    || '7');
    set('d-anio',    STATE.config.anio    || '2026');
    UI.updateUserInfo();
  }

  function guardarConfig() {
    _actualizarConfig();
    STORAGE.saveManual();
    UI.toast('Configuración guardada', 'success');
    UI.updateUserInfo();
  }

  // Inputs de config: marcar cambio al escribir
  ['d-escuela','d-docente','d-grado','d-aula','d-anio','d-jornada'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', UTILS.debounce(() => {
      _actualizarConfig(); STORAGE.marcar(); UI.updateUserInfo();
    }, 600));
  });

  /* ==================== MATERIAS ==================== */
  function renderMaterias() {
    const cont = document.getElementById('lista-materias');
    if (!cont) return;
    cont.innerHTML = STATE.materias.map((m, i) => `
      <div class="activity-row">
        <div class="activity-num">${i+1}</div>
        <div class="field" style="flex:1;margin:0">
          <input type="text" value="${UTILS.escHtml(m)}" placeholder="Nombre de la asignatura"
            onchange="STATE.materias[${i}]=this.value;STORAGE.marcar()"
            oninput="STATE.materias[${i}]=this.value">
        </div>
        <button class="btn btn-outline btn-sm" onclick="APP.eliminarMateria(${i})" title="Eliminar">
          <i class="fa-solid fa-trash" style="color:var(--danger)"></i>
        </button>
      </div>`).join('') || '<p class="text-muted text-sm">Sin asignaturas. Agrega una nueva.</p>';
  }

  function agregarMateria() {
    STATE.materias.push('Nueva Asignatura');
    const mi = STATE.materias.length - 1;
    for (let t = 1; t <= 3; t++) {
      STATE.actividades[t][mi]    = Array.from({length:5}, (_,i) => ({ nombre:`Actividad ${i+1}`, fecha:'' }));
      STATE.calificaciones[t][mi] = {};
      for (let e = 0; e < STATE.estudiantes.length; e++) STATE.calificaciones[t][mi][e] = Array(5).fill('');
    }
    renderMaterias();
    STORAGE.marcar();
    UI.toast('Asignatura agregada', 'success', 2000);
  }

  function eliminarMateria(i) {
    if (STATE.materias.length <= 1) { UI.toast('Debe haber al menos una asignatura', 'warning'); return; }
    UI.confirm('Eliminar Asignatura', `¿Desea eliminar "${STATE.materias[i]}"? Se perderán sus calificaciones.`, () => {
      STATE.materias.splice(i, 1);
      for (let t = 1; t <= 3; t++) {
        const nA={}, nC={};
        Object.keys(STATE.actividades[t]).forEach(k => {
          const nk = parseInt(k) > i ? parseInt(k)-1 : parseInt(k);
          if (parseInt(k) !== i) { nA[nk] = STATE.actividades[t][k]; nC[nk] = STATE.calificaciones[t][k]; }
        });
        STATE.actividades[t]    = nA;
        STATE.calificaciones[t] = nC;
      }
      if (STATE.ui.currentMat >= STATE.materias.length) STATE.ui.currentMat = 0;
      renderMaterias(); renderCalif(); STORAGE.marcar();
    }, 'danger');
  }

  /* ==================== ESTUDIANTES ==================== */
  function renderEstudiantes(filtro = '', condFiltro = '', sexoFiltro = '') {
    const tbody = document.getElementById('body-est');
    if (!tbody) return;
    const fLower = filtro.toLowerCase();
    const filtered = STATE.estudiantes.filter((e, i) => {
      const matchTexto = !fLower || e.nombre.toLowerCase().includes(fLower) || e.cedula.includes(fLower);
      const matchCond  = !condFiltro || e.condicion === condFiltro;
      const matchSexo  = !sexoFiltro || e.sexo === sexoFiltro;
      return matchTexto && matchCond && matchSexo;
    });

    document.getElementById('est-count').textContent = `${filtered.length} estudiante${filtered.length!==1?'s':''}`;
    document.getElementById('badge-est').textContent = STATE.estudiantes.length;

    tbody.innerHTML = filtered.map((e, fi) => {
      const i = STATE.estudiantes.indexOf(e);
      const condBadge = e.condicion === 'Regular' ? 'badge-success' : e.condicion === 'Especial' ? 'badge-warning' : 'badge-gray';
      return `
        <tr>
          <td><span style="font-weight:700;color:var(--text-sec)">${fi+1}</span></td>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:32px;height:32px;border-radius:50%;background:var(--primary-light);color:var(--primary);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                ${UTILS.iniciales(e.nombre)}
              </div>
              <input class="td-input" style="text-align:left;min-width:140px" value="${UTILS.escHtml(e.nombre)}"
                onchange="STATE.estudiantes[${i}].nombre=this.value;STORAGE.marcar();document.getElementById('badge-est').textContent=STATE.estudiantes.length"
                placeholder="Nombre completo">
            </div>
          </td>
          <td><input class="td-input" style="text-align:left" value="${UTILS.escHtml(e.cedula)}" onchange="STATE.estudiantes[${i}].cedula=this.value;STORAGE.marcar()" placeholder="X-000-000"></td>
          <td>
            <select class="td-select" onchange="STATE.estudiantes[${i}].sexo=this.value;STORAGE.marcar()">
              <option ${e.sexo==='M'?'selected':''} value="M">M</option>
              <option ${e.sexo==='F'?'selected':''} value="F">F</option>
            </select>
          </td>
          <td><input class="td-input" style="text-align:left" type="date" value="${e.nacimiento}" onchange="STATE.estudiantes[${i}].nacimiento=this.value;STORAGE.marcar()"></td>
          <td>
            <select class="td-select" onchange="STATE.estudiantes[${i}].condicion=this.value;STORAGE.marcar()">
              <option ${e.condicion==='Regular'?'selected':''}>Regular</option>
              <option ${e.condicion==='Especial'?'selected':''}>Especial</option>
              <option ${e.condicion==='Traslado'?'selected':''}>Traslado</option>
            </select>
          </td>
          <td><input class="td-input" style="text-align:left;min-width:110px" value="${UTILS.escHtml(e.acudiente)}" onchange="STATE.estudiantes[${i}].acudiente=this.value;STORAGE.marcar()" placeholder="Nombre acudiente"></td>
          <td><input class="td-input" style="text-align:left;min-width:80px" value="${UTILS.escHtml(e.telefono)}" onchange="STATE.estudiantes[${i}].telefono=this.value;STORAGE.marcar()" placeholder="0000-0000"></td>
          <td>
            <button class="btn btn-ghost btn-icon sm" onclick="APP.eliminarEstudiante(${i})" title="Eliminar">
              <i class="fa-solid fa-trash" style="color:var(--danger);font-size:13px"></i>
            </button>
          </td>
        </tr>`;
    }).join('') || `<tr><td colspan="9"><div class="empty-state"><i class="fa-solid fa-users"></i><p>No se encontraron estudiantes</p></div></td></tr>`;
  }

  function filtrarEstudiantes(texto) {
    const t  = typeof texto === 'string' ? texto : (document.getElementById('est-search')?.value || '');
    const c  = document.getElementById('est-filter-cond')?.value  || '';
    const s  = document.getElementById('est-filter-sexo')?.value  || '';
    renderEstudiantes(t, c, s);
  }

  function agregarEstudiante() {
    const nuevo = { id: UTILS.uid(), nombre:'', cedula:'', sexo:'M', nacimiento:'', condicion:'Regular', acudiente:'', telefono:'' };
    STATE.estudiantes.push(nuevo);
    const ei = STATE.estudiantes.length - 1;
    for (let t = 1; t <= 3; t++) {
      for (let m = 0; m < STATE.materias.length; m++) {
        if (!STATE.calificaciones[t][m]) STATE.calificaciones[t][m] = {};
        const na = STATE.actividades[t]?.[m]?.length || 5;
        STATE.calificaciones[t][m][ei] = Array(na).fill('');
      }
      STATE.mesesPorTri[String(t)].forEach(mes => {
        if (!STATE.asistencia[t][mes]) STATE.asistencia[t][mes] = {};
        STATE.asistencia[t][mes][ei] = Array(30).fill('');
      });
    }
    renderEstudiantes();
    STORAGE.marcar();
    UI.toast('Estudiante agregado', 'success', 2000);
  }

  function eliminarEstudiante(i) {
    if (STATE.estudiantes.length <= 1) { UI.toast('Debe haber al menos un estudiante', 'warning'); return; }
    const nombre = STATE.estudiantes[i].nombre || 'este estudiante';
    UI.confirm('Eliminar Estudiante', `¿Eliminar a "${nombre}"? También se borrarán sus calificaciones y asistencia.`, () => {
      STATE.estudiantes.splice(i, 1);
      for (let t = 1; t <= 3; t++) {
        for (let m = 0; m < STATE.materias.length; m++) {
          const nC = {};
          Object.keys(STATE.calificaciones[t]?.[m] || {}).forEach(k => {
            const ki = parseInt(k);
            if (ki !== i) nC[ki > i ? ki-1 : ki] = STATE.calificaciones[t][m][k];
          });
          STATE.calificaciones[t][m] = nC;
        }
        STATE.mesesPorTri[String(t)].forEach(mes => {
          const nA = {};
          Object.keys(STATE.asistencia[t]?.[mes] || {}).forEach(k => {
            const ki = parseInt(k);
            if (ki !== i) nA[ki > i ? ki-1 : ki] = STATE.asistencia[t][mes][k];
          });
          STATE.asistencia[t][mes] = nA;
        });
      }
      renderEstudiantes();
      renderBoletinSelector();
      STORAGE.marcar();
      UI.toast('Estudiante eliminado', 'success', 2000);
    }, 'danger');
  }

  function exportarEstudiantes() {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['N°','Nombre','Cédula','Sexo','Nacimiento','Condición','Acudiente','Teléfono'],
      ...STATE.estudiantes.map((e,i) => [i+1,e.nombre,e.cedula,e.sexo,e.nacimiento,e.condicion,e.acudiente,e.telefono])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Estudiantes');
    XLSX.writeFile(wb, 'Estudiantes_2026.xlsx');
    UI.toast('Lista de estudiantes exportada', 'success');
  }

  /* ==================== CALIFICACIONES ==================== */
  function renderCalif() {
    const tri = parseInt(document.getElementById('sel-tri')?.value || 1);
    STATE.ui.currentTri = tri;
    const tabsCont = document.getElementById('mat-tabs-calif');
    if (!tabsCont) return;

    tabsCont.innerHTML = STATE.materias.map((m, i) => `
      <button class="mat-tab${i === STATE.ui.currentMat ? ' active' : ''}"
        onclick="STATE.ui.currentMat=${i};APP.renderCalif()">
        ${UTILS.escHtml(m)}
      </button>`).join('');

    const mi   = STATE.ui.currentMat;
    const acts = STATE.actividades[tri]?.[mi] || [];
    const cont = document.getElementById('calif-panel');
    if (!cont) return;

    // Actividades
    let html = `
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:13px;color:var(--primary)">
            <i class="fa-solid fa-clipboard-list"></i> Actividades — ${UTILS.escHtml(STATE.materias[mi])}
          </span>
          <button class="btn btn-sm" style="background:var(--success-light);color:var(--success);border:none" onclick="APP.agregarActividad(${tri},${mi})">
            <i class="fa-solid fa-plus"></i> Actividad
          </button>
        </div>
        <div id="acts-lista-${tri}-${mi}">`;
    acts.forEach((a, ai) => {
      html += `
        <div class="activity-row">
          <div class="activity-num">${ai+1}</div>
          <div class="field" style="flex:2;margin:0">
            <input type="text" value="${UTILS.escHtml(a.nombre)}" placeholder="Nombre actividad"
              onchange="STATE.actividades[${tri}][${mi}][${ai}].nombre=this.value;STORAGE.marcar()">
          </div>
          <div class="field" style="flex:1;margin:0;min-width:120px">
            <input type="date" value="${a.fecha}" onchange="STATE.actividades[${tri}][${mi}][${ai}].fecha=this.value;STORAGE.marcar()">
          </div>
          <button class="btn btn-sm" style="background:var(--danger-light);color:var(--danger);border:none" onclick="APP.eliminarActividad(${tri},${mi},${ai})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>`;
    });
    html += `</div></div>`;

    // Tabla de notas
    html += `<div class="table-container"><table class="data-table"><thead><tr>
      <th style="width:40px">N°</th>
      <th>Estudiante</th>`;
    acts.forEach((a, ai) => {
      const fechaTip = a.fecha ? `📅 ${UTILS.formatFecha(a.fecha)}` : 'Sin fecha';
      html += `<th title="${UTILS.escHtml(fechaTip)}">${ai+1}. ${UTILS.escHtml(a.nombre)}</th>`;
    });
    html += `<th style="width:90px">Promedio</th></tr></thead><tbody>`;

    STATE.estudiantes.forEach((e, ei) => {
      const notas = STATE.calificaciones[tri]?.[mi]?.[ei] || [];
      const nums  = notas.filter(v => v!==''&&!isNaN(parseFloat(v))).map(Number);
      const prom  = nums.length ? (nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(1) : null;
      html += `<tr><td class="td-center" style="font-weight:700;color:var(--text-sec)">${ei+1}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:28px;height:28px;border-radius:50%;background:var(--primary-light);color:var(--primary);font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${UTILS.iniciales(e.nombre)}</div>
            <span style="font-weight:500">${UTILS.escHtml(e.nombre)}</span>
          </div>
        </td>`;
      acts.forEach((_, ai) => {
        const val = notas[ai] ?? '';
        const cls = val !== '' && !isNaN(parseFloat(val)) ? UTILS.badgeCls(val) : '';
        html += `<td class="td-center">
          <input class="td-input${cls?' nota-input-'+cls:''}" type="number" min="1" max="5" step="0.1"
            value="${UTILS.escHtml(String(val))}"
            style="width:60px;${cls?`color:${cls==='badge-A'?'var(--success)':cls==='badge-B'?'var(--primary)':cls==='badge-C'?'#92400e':'var(--danger)'}`:''}"
            onchange="APP.setNota(${tri},${mi},${ei},${ai},this.value,this)"
            oninput="APP.previewNota(${tri},${mi},${ei},this)"
            placeholder="—">
        </td>`;
      });
      html += `<td class="td-center" id="prom-${tri}-${mi}-${ei}">${prom !== null ? UTILS.notaBadge(prom) : '<span class="badge badge-gray">—</span>'}</td></tr>`;
    });
    html += `</tbody></table></div>`;
    cont.innerHTML = html;
  }

  function setNota(tri, mi, ei, ai, val, inputEl) {
    // Validación
    if (val !== '' && (!UTILS.validarNota(val))) {
      if (inputEl) { inputEl.value = ''; inputEl.style.borderColor = 'var(--danger)'; }
      UI.toast('Nota inválida (1.0 – 5.0)', 'warning', 2000);
      return;
    }
    if (inputEl) inputEl.style.borderColor = '';

    if (!STATE.calificaciones[tri])       STATE.calificaciones[tri]       = {};
    if (!STATE.calificaciones[tri][mi])   STATE.calificaciones[tri][mi]   = {};
    if (!STATE.calificaciones[tri][mi][ei]) STATE.calificaciones[tri][mi][ei] = [];
    STATE.calificaciones[tri][mi][ei][ai] = val;

    // Actualizar promedio de la fila sin re-renderizar
    const notas = STATE.calificaciones[tri][mi][ei];
    const nums  = notas.filter(v => v!==''&&!isNaN(parseFloat(v))).map(Number);
    const prom  = nums.length ? (nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(1) : null;
    const promEl = document.getElementById(`prom-${tri}-${mi}-${ei}`);
    if (promEl) promEl.innerHTML = prom !== null ? UTILS.notaBadge(prom) : '<span class="badge badge-gray">—</span>';
    STORAGE.marcar();
  }

  function previewNota(tri, mi, ei, inputEl) {
    const val = inputEl.value;
    if (val === '') { inputEl.style.color = ''; return; }
    if (!UTILS.validarNota(val)) { inputEl.style.color = 'var(--danger)'; return; }
    const cls = UTILS.badgeCls(val);
    const colors = { 'badge-A':'var(--success)','badge-B':'var(--primary)','badge-C':'#92400e','badge-D':'var(--danger)' };
    inputEl.style.color = colors[cls] || '';
  }

  function agregarActividad(tri, mi) {
    if (!STATE.actividades[tri])    STATE.actividades[tri]    = {};
    if (!STATE.actividades[tri][mi]) STATE.actividades[tri][mi] = [];
    const ai = STATE.actividades[tri][mi].length;
    STATE.actividades[tri][mi].push({ nombre:`Actividad ${ai+1}`, fecha:'' });
    STATE.estudiantes.forEach((_, ei) => {
      if (!STATE.calificaciones[tri])     STATE.calificaciones[tri]     = {};
      if (!STATE.calificaciones[tri][mi]) STATE.calificaciones[tri][mi] = {};
      if (!STATE.calificaciones[tri][mi][ei]) STATE.calificaciones[tri][mi][ei] = [];
      STATE.calificaciones[tri][mi][ei].push('');
    });
    renderCalif();
    STORAGE.marcar();
  }

  function eliminarActividad(tri, mi, ai) {
    STATE.actividades[tri][mi].splice(ai, 1);
    STATE.estudiantes.forEach((_, ei) => {
      STATE.calificaciones[tri]?.[mi]?.[ei]?.splice(ai, 1);
    });
    renderCalif();
    STORAGE.marcar();
  }

  /* ==================== ASISTENCIA ==================== */
  function renderAsistencia() {
    const tri   = parseInt(document.getElementById('sel-tri-asist')?.value || 1);
    const meses = STATE.mesesPorTri[String(tri)];
    STATE.ui.currentTri = tri;

    // Mes tabs
    const mesTabsCont = document.getElementById('mes-tabs');
    if (mesTabsCont) {
      if (!meses.includes(STATE.ui.currentMes)) STATE.ui.currentMes = meses[0];
      mesTabsCont.innerHTML = meses.map(m => `
        <button class="mat-tab${m === STATE.ui.currentMes ? ' active' : ''}"
          onclick="STATE.ui.currentMes='${m}';APP.renderAsistencia()">
          ${m}
        </button>`).join('');
    }

    const mes  = STATE.ui.currentMes;
    const dias = 30;
    if (!STATE.asistencia[tri])      STATE.asistencia[tri]      = {};
    if (!STATE.asistencia[tri][mes]) {
      STATE.asistencia[tri][mes] = {};
      for (let e=0;e<STATE.estudiantes.length;e++) STATE.asistencia[tri][mes][e]=Array(dias).fill('');
    }

    const anio   = STATE.config.anio || '2026';
    const mesNum = UTILS.getMesNumero(mes);

    let html = `<table class="data-table" style="min-width:900px"><thead><tr>
      <th style="width:36px">N°</th>
      <th style="min-width:140px">Estudiante</th>`;
    for (let d=1;d<=dias;d++) html += `<th style="width:32px;text-align:center">${d}</th>`;
    html += `<th title="Presentes">P</th><th title="Ausentes">A</th><th title="Tardanzas">T</th></tr></thead><tbody>`;

    STATE.estudiantes.forEach((e, ei) => {
      if (!STATE.asistencia[tri][mes][ei]) STATE.asistencia[tri][mes][ei] = Array(dias).fill('');
      let P=0, A=0, T=0;
      let cells = '';
      for (let d=0;d<dias;d++) {
        const v = STATE.asistencia[tri][mes][ei][d] || '';
        if(v==='P')P++; else if(v==='A')A++; else if(v==='T')T++;
        const cls = v ? `att-${v}` : 'att-_';
        const dStr = String(d+1).padStart(2,'0');
        cells += `<td class="td-center">
          <button class="att-btn ${cls}" title="${dStr}/${mesNum}/${anio}"
            onclick="APP.toggleAsist(${tri},'${mes}',${ei},${d},this)">${v||'·'}</button>
        </td>`;
      }
      html += `<tr>
        <td class="td-center" style="font-weight:700;color:var(--text-sec)">${ei+1}</td>
        <td style="font-weight:500;white-space:nowrap">${UTILS.escHtml(e.nombre)}</td>
        ${cells}
        <td class="td-center" style="font-weight:700;color:var(--success)" id="att-P-${ei}">${P}</td>
        <td class="td-center" style="font-weight:700;color:var(--danger)"  id="att-A-${ei}">${A}</td>
        <td class="td-center" style="font-weight:700;color:var(--warning)" id="att-T-${ei}">${T}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    document.getElementById('asist-panel').innerHTML = html;
  }

  function toggleAsist(tri, mes, ei, d, btn) {
    const seq  = ['','P','A','T'];
    const cur  = STATE.asistencia[tri][mes][ei][d] || '';
    const next = seq[(seq.indexOf(cur)+1) % seq.length];
    STATE.asistencia[tri][mes][ei][d] = next;
    btn.className = 'att-btn ' + (next ? `att-${next}` : 'att-_');
    btn.textContent = next || '·';

    // Actualizar contadores sin re-renderizar
    const row = btn.closest('tr');
    let P=0, A=0, T=0;
    row.querySelectorAll('.att-btn').forEach(b => {
      if(b.textContent==='P')P++; if(b.textContent==='A')A++; if(b.textContent==='T')T++;
    });
    const pEl = document.getElementById(`att-P-${ei}`);
    const aEl = document.getElementById(`att-A-${ei}`);
    const tEl = document.getElementById(`att-T-${ei}`);
    if(pEl) pEl.textContent = P;
    if(aEl) aEl.textContent = A;
    if(tEl) tEl.textContent = T;
    STORAGE.marcar();
  }

  /* ==================== BOLETÍN ==================== */
  function renderBoletinSelector() {
    const sel = document.getElementById('sel-est-boletin');
    if (!sel) return;
    sel.innerHTML = STATE.estudiantes.map((e, i) => `<option value="${i}">${UTILS.escHtml(e.nombre)}</option>`).join('');
  }

  function renderBoletin() {
    const ei  = parseInt(document.getElementById('sel-est-boletin')?.value || 0);
    const e   = STATE.estudiantes[ei];
    const cont= document.getElementById('boletin-contenido');
    if (!e || !cont) return;

    const { config, materias, calificaciones } = STATE;

    const filas = materias.map((mat, mi) => {
      const proms = [1,2,3].map(t => {
        const vals = calificaciones?.[t]?.[mi]?.[ei];
        if (!vals) return null;
        return UTILS.promedio(vals.filter(v => v!==''));
      });
      const promsFiltrados = proms.filter(p => p !== null);
      const pf = promsFiltrados.length
        ? (promsFiltrados.reduce((a,b)=>a+b,0)/promsFiltrados.length).toFixed(1)
        : null;
      return `
        <tr>
          <td style="font-weight:500">${mi+1}. ${UTILS.escHtml(mat)}</td>
          ${proms.map(p => `<td>${p !== null ? UTILS.notaBadge(p.toFixed(1)) : '<span class="badge badge-gray">—</span>'}</td>`).join('')}
          <td>${pf !== null ? UTILS.notaBadge(pf) : '<span class="badge badge-gray">—</span>'}</td>
        </tr>`;
    }).join('');

    cont.innerHTML = `
      <div class="boletin-doc">
        <div class="boletin-header">
          <h2>${UTILS.escHtml(config.escuela || 'Centro Educativo')}</h2>
          <p>Boletín Oficial de Calificaciones · Año Lectivo ${config.anio || 2026}</p>
        </div>
        <div class="boletin-info-bar">
          <div class="boletin-info-item"><strong>Estudiante</strong>${UTILS.escHtml(e.nombre)}</div>
          <div class="boletin-info-item"><strong>Grado</strong>${UTILS.escHtml(config.grado || '—')}</div>
          <div class="boletin-info-item"><strong>Docente</strong>${UTILS.escHtml(config.docente || '—')}</div>
        </div>
        <div class="boletin-table-wrap">
          <table class="boletin-table">
            <thead><tr><th>Asignatura</th><th>I Trimestre</th><th>II Trimestre</th><th>III Trimestre</th><th>Promedio Final</th></tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        <div class="boletin-footer">Docente: ${UTILS.escHtml(config.docente || '—')} · ${UTILS.escHtml(config.escuela || '—')}</div>
      </div>`;
  }

  /* ==================== HORARIO ==================== */
  function renderHorario() {
    const dias  = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
    const tbody = document.getElementById('body-horario');
    if (!tbody) return;
    tbody.innerHTML = STATE.horarioHoras.map(h => {
      if (h === 'RECESO') return `<tr><td colspan="6" class="schedule-break"><i class="fa-solid fa-mug-hot"></i> RECESO ACADÉMICO</td></tr>`;
      const cells = dias.map(d => {
        const v = STATE.horario?.[h]?.[d] || '';
        return `<td>
          <input class="td-input" value="${UTILS.escHtml(v)}" placeholder="Asignatura"
            onchange="if(!STATE.horario['${h}'])STATE.horario['${h}']={};STATE.horario['${h}']['${d}']=this.value;STORAGE.marcar()">
        </td>`;
      }).join('');
      return `<tr><td><div class="schedule-hour">${h}</div></td>${cells}</tr>`;
    }).join('');
  }

  /* ==================== BÚSQUEDA GLOBAL ==================== */
  function globalSearch(val) {
    if (!val) return;
    // Navegar a estudiantes y filtrar
    navigate('estudiantes', null);
    document.getElementById('est-search').value = val;
    filtrarEstudiantes(val);
  }

  return {
    init, navigate, guardarConfig, _actualizarConfig, _asegurarEstructuras, _renderAll,
    renderMaterias, agregarMateria, eliminarMateria,
    renderEstudiantes, filtrarEstudiantes, agregarEstudiante, eliminarEstudiante, exportarEstudiantes,
    renderCalif, setNota, previewNota, agregarActividad, eliminarActividad,
    renderAsistencia, toggleAsist,
    renderBoletinSelector, renderBoletin,
    renderHorario, globalSearch
  };
})();

/* ==================== BOOT ==================== */
document.addEventListener('DOMContentLoaded', () => {
  // Intentar sesión existente; si no, mostrar login
  if (!AUTH.checkSession()) {
    setTimeout(() => UI.hideLoader(), 800);
  }
});
