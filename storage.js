/* ================================================================
   storage.js — Almacenamiento: IndexedDB + localStorage + Backups
   ================================================================ */

const STORAGE = (() => {
  const KEY_IDB  = 'sistemaEscolar_v3';
  const KEY_META = 'sistemaEscolar_meta_v3';
  let   _timer   = null;
  let   _pending = false;
  let   _lastSaved = null;

  /* ==================== INDICADOR VISUAL ==================== */
  function _setStatus(state) {
    const el = document.getElementById('save-status');
    if (!el) return;
    el.className = 'save-status ' + state;
    const icons = { saved:'fa-circle-check', pending:'fa-regular fa-clock', saving:'fa-rotate' };
    const texts = { saved:'Guardado', pending:'Sin guardar', saving:'Guardando...' };
    el.innerHTML = `<i class="fa-solid ${icons[state] || 'fa-circle'}"></i><span>${texts[state]||''}</span>`;
  }

  /* ==================== MARCAR CAMBIO ==================== */
  function marcar() {
    _pending = true;
    _setStatus('pending');
    clearTimeout(_timer);
    _timer = setTimeout(save, 2500);
  }

  /* ==================== SERIALIZAR ESTADO ==================== */
  function _serialize() {
    if (!window.STATE) return null;
    return JSON.stringify({
      version:        '3.0',
      savedAt:        new Date().toISOString(),
      config:         STATE.config,
      materias:       STATE.materias,
      estudiantes:    STATE.estudiantes,
      calificaciones: STATE.calificaciones,
      actividades:    STATE.actividades,
      asistencia:     STATE.asistencia,
      horario:        STATE.horario,
      ui:             { theme: STATE.ui.theme }
    });
  }

  /* ==================== GUARDAR ==================== */
  async function save() {
    if (!window.STATE) return;
    try {
      _setStatus('saving');
      const serialized = _serialize();
      if (!serialized) return;

      // Primario: IndexedDB; Mirror: localStorage
      if (window.IDB) await IDB.set(KEY_IDB, JSON.parse(serialized));
      localStorage.setItem(KEY_IDB, serialized);

      const now  = new Date().toISOString();
      _lastSaved = now;
      const meta = { savedAt: now, bytes: serialized.length,
        estCount: STATE.estudiantes.length, matCount: STATE.materias.length };
      localStorage.setItem(KEY_META, JSON.stringify(meta));

      _pending = false;
      _setStatus('saved');
      _updateConfigInfo(now, serialized.length);
    } catch (e) {
      console.error('[STORAGE] Error al guardar:', e);
      _setStatus('pending');
    }
  }

  /* ==================== GUARDAR MANUAL ==================== */
  function saveManual() {
    clearTimeout(_timer);
    save().then(() => UI.toast('Datos guardados correctamente', 'success'));
  }

  /* ==================== CARGAR ==================== */
  async function load() {
    try {
      let datos = null;

      // Intentar IDB primero
      if (window.IDB) datos = await IDB.get(KEY_IDB);

      // Fallback: localStorage
      if (!datos) {
        const raw = localStorage.getItem(KEY_IDB);
        if (raw) datos = JSON.parse(raw);
      }

      if (!datos || !datos.version) return false;
      _aplicarDatos(datos);

      const meta = getMeta();
      if (meta) _updateConfigInfo(meta.savedAt, meta.bytes);
      return true;
    } catch (e) {
      console.error('[STORAGE] Error al cargar:', e);
      return false;
    }
  }

  /* ==================== APLICAR DATOS AL STATE ==================== */
  function _aplicarDatos(datos) {
    const set = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v; };
    if (datos.config) {
      const c = datos.config;
      set('d-escuela', c.escuela); set('d-docente', c.docente);
      set('d-grado',   c.grado);   set('d-anio',    c.anio);
      set('d-aula',    c.aula);    set('d-jornada', c.jornada);
      STATE.config = { ...STATE.config, ...c };
    }
    if (datos.materias    && datos.materias.length)    STATE.materias    = datos.materias;
    if (datos.estudiantes && datos.estudiantes.length) STATE.estudiantes = datos.estudiantes;
    if (datos.calificaciones) STATE.calificaciones = datos.calificaciones;
    if (datos.actividades)    STATE.actividades    = datos.actividades;
    if (datos.asistencia)     STATE.asistencia     = datos.asistencia;
    if (datos.horario)        STATE.horario        = datos.horario;
    if (datos.ui?.theme)      STATE.ui.theme       = datos.ui.theme;
    _lastSaved = datos.savedAt;
  }

  /* ==================== METADATA ==================== */
  function getMeta() {
    try { return JSON.parse(localStorage.getItem(KEY_META)) || null; } catch { return null; }
  }

  /* ==================== BACKUP AUTOMÁTICO (cada 60 min) ==================== */
  async function _autoBackup() {
    if (!_lastSaved || !window.IDB) return;
    const data  = _serialize();
    if (!data) return;
    const label = `Auto ${new Date().toLocaleTimeString('es-PA',{hour:'2-digit',minute:'2-digit'})}`;
    await IDB.saveBackup(label, data);
  }

  /* ==================== PANEL DE BACKUPS ==================== */
  async function mostrarBackups() {
    if (!window.IDB) { UI.toast('IndexedDB no disponible en este navegador', 'warning'); return; }
    const backups = await IDB.getBackups();
    if (!backups.length) { UI.toast('No hay backups automáticos aún', 'info'); return; }

    const items = [...backups].reverse().map(b => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="flex:1">
          <div style="font-weight:600;font-size:13px">${UTILS.escHtml(b.label)}</div>
          <div style="font-size:11px;color:var(--text-sec)">${UTILS.fechaLegible(b.createdAt)}</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="STORAGE._restaurarBackup(${b.id})">
          <i class="fa-solid fa-rotate-left"></i> Restaurar
        </button>
      </div>`).join('');

    UI.openModal({
      title:    'Backups Automáticos',
      icon:     '<i class="fa-solid fa-clock-rotate-left"></i>',
      iconBg:   '#dbeafe', iconColor: '#2563eb',
      body:     `<p class="text-muted text-sm mb-2">Hasta 10 backups; uno por hora. Se restauran sin recargar la página.</p>${items}`,
      footer:   '<button class="btn btn-outline" onclick="UI.closeModal()">Cerrar</button>',
      size:     'lg'
    });
  }

  async function _restaurarBackup(id) {
    const data = await IDB.restoreBackup(id);
    if (!data) { UI.toast('No se pudo leer el backup', 'error'); return; }
    UI.confirm('Restaurar Backup',
      '¿Desea restaurar este backup? Los datos actuales serán reemplazados.',
      async () => {
        UI.closeModal();
        try {
          _aplicarDatos(JSON.parse(data));
          APP._asegurarEstructuras();
          APP._renderAll();
          await save();
          UI.toast('Backup restaurado correctamente', 'success');
        } catch (e) { UI.toast('Error al restaurar: ' + e.message, 'error'); }
      }
    );
  }

  /* ==================== BORRAR TODO ==================== */
  function borrarTodo() {
    UI.confirm(
      'Borrar Todos los Datos',
      '¿Está seguro? Esta acción eliminará TODOS los datos (IndexedDB + localStorage) y no se puede deshacer.',
      async () => {
        if (window.IDB) await IDB.clearAll();
        localStorage.removeItem(KEY_IDB);
        localStorage.removeItem(KEY_META);
        UI.toast('Datos eliminados. Recargando...', 'warning');
        setTimeout(() => location.reload(), 1500);
      },
      'danger'
    );
  }

  /* ==================== HELPERS ==================== */
  function _updateConfigInfo(savedAt, bytes) {
    const e1 = document.getElementById('config-last-save');
    const e2 = document.getElementById('config-data-size');
    if (e1) e1.textContent = UTILS.fechaLegible(savedAt);
    if (e2) e2.textContent = UTILS.formatBytes(bytes);
  }

  /* ==================== TIMERS ==================== */
  setInterval(() => { if (_pending) save(); }, 30_000);   // Auto-save cada 30s
  setInterval(_autoBackup, 60 * 60_000);                   // Backup cada 60 min

  /* ==================== ELECTRON BRIDGE ==================== */
  window.addEventListener('load', () => {
    if (!window.electronAPI) return;
    electronAPI.onMenuSave(saveManual);
    electronAPI.onMenuExport(() => EXCEL?.exportar?.());
    electronAPI.onMenuImport(() => document.getElementById('file-import')?.click());
    electronAPI.onMenuLock(() => AUTH?.lock?.());
    electronAPI.onMenuTheme(() => UI?.toggleTheme?.());
    electronAPI.onNav(s => APP?.navigate?.(s, null));
    electronAPI.onWillClose(() => { if (_pending) save(); });
  });

  return { marcar, save, saveManual, load, getMeta, borrarTodo, mostrarBackups, _restaurarBackup };
})();
