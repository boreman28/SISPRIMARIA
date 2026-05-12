/* ================================================================
   utils.js — Funciones de Utilidad
   ================================================================ */

const UTILS = (() => {

  /** Formatea fecha DD/MM/YYYY */
  function formatFecha(f) {
    if (!f) return '—';
    const p = String(f).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : f;
  }

  /** Número del mes en español */
  function getMesNumero(mes) {
    const map = {
      Enero:'01',Febrero:'02',Marzo:'03',Abril:'04',Mayo:'05',Junio:'06',
      Julio:'07',Agosto:'08',Septiembre:'09',Octubre:'10',Noviembre:'11',Diciembre:'12'
    };
    return map[mes] || '01';
  }

  /** Promedio de un arreglo de valores numéricos */
  function promedio(arr) {
    const nums = arr.map(Number).filter(v => !isNaN(v) && v !== null && v !== '');
    if (!nums.length) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  /** Badge de nota según valor */
  function notaBadge(val) {
    const v = parseFloat(val);
    if (isNaN(v)) return `<span class="badge badge-gray">—</span>`;
    const cls = v >= 4.5 ? 'A' : v >= 3.5 ? 'B' : v >= 2.5 ? 'C' : 'D';
    return `<span class="badge badge-${cls}">${v.toFixed(1)}</span>`;
  }

  /** Badge clase por valor numérico */
  function badgeCls(val) {
    const v = parseFloat(val);
    if (isNaN(v)) return '';
    return v >= 4.5 ? 'badge-A' : v >= 3.5 ? 'badge-B' : v >= 2.5 ? 'badge-C' : 'badge-D';
  }

  /** Valida nota (1-5) */
  function validarNota(val) {
    if (val === '' || val === null || val === undefined) return true;
    const n = parseFloat(val);
    return !isNaN(n) && n >= 1 && n <= 5;
  }

  /** Clamp */
  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  /** Escape HTML */
  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /** Debounce */
  function debounce(fn, delay = 400) {
    let t;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /** Genera ID único */
  function uid() {
    return Date.now() + '_' + Math.random().toString(36).slice(2,7);
  }

  /** Formatea bytes legibles */
  function formatBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
    return (b/1024/1024).toFixed(2) + ' MB';
  }

  /** Fecha legible para etiquetas */
  function fechaLegible(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-PA', { day:'2-digit', month:'short', year:'numeric' }) +
           ' ' + d.toLocaleTimeString('es-PA', { hour:'2-digit', minute:'2-digit' });
  }

  /** Deep clone seguro */
  function deepClone(obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch(e) { return obj; }
  }

  /** Ordena array de objetos por propiedad */
  function sortBy(arr, key, desc = false) {
    return [...arr].sort((a,b) => {
      const av = parseFloat(a[key]) || 0;
      const bv = parseFloat(b[key]) || 0;
      return desc ? bv - av : av - bv;
    });
  }

  /** Iniciales de un nombre */
  function iniciales(nombre) {
    return String(nombre).trim().split(/\s+/).slice(0,2).map(p => p[0]?.toUpperCase() || '').join('');
  }

  return {
    formatFecha, getMesNumero, promedio, notaBadge, badgeCls,
    validarNota, clamp, escHtml, debounce, uid, formatBytes,
    fechaLegible, deepClone, sortBy, iniciales
  };
})();
