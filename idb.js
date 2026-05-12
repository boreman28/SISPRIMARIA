/* ================================================================
   idb.js — Capa IndexedDB con Fallback a localStorage
   Almacenamiento primario: IndexedDB (hasta 1GB)
   Fallback: localStorage (cuando IDB no esté disponible)
   ================================================================ */

const IDB = (() => {
  const DB_NAME    = 'SistemaEscolar2026';
  const DB_VERSION = 1;
  const STORE_DATA = 'datos';
  const STORE_BACK = 'backups';

  let _db = null;

  /* ==================== APERTURA DE BASE DE DATOS ==================== */
  function open() {
    return new Promise((resolve, reject) => {
      if (_db) { resolve(_db); return; }

      if (!window.indexedDB) {
        console.warn('[IDB] IndexedDB no disponible. Usando localStorage.');
        resolve(null); return;
      }

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        // Store principal de datos
        if (!db.objectStoreNames.contains(STORE_DATA)) {
          db.createObjectStore(STORE_DATA, { keyPath: 'id' });
        }
        // Store de backups automáticos
        if (!db.objectStoreNames.contains(STORE_BACK)) {
          const bs = db.createObjectStore(STORE_BACK, { keyPath: 'id', autoIncrement: true });
          bs.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
      req.onerror   = (e) => {
        console.error('[IDB] Error al abrir:', e.target.error);
        resolve(null); // Fallback gracefully
      };
    });
  }

  /* ==================== OPERACIONES CRUD ==================== */

  async function get(id) {
    const db = await open();
    if (!db) return _lsGet(id);
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE_DATA, 'readonly');
      const req = tx.objectStore(STORE_DATA).get(id);
      req.onsuccess = () => resolve(req.result?.value ?? null);
      req.onerror   = () => resolve(_lsGet(id)); // Fallback
    });
  }

  async function set(id, value) {
    const db = await open();
    if (!db) { _lsSet(id, value); return true; }
    return new Promise((resolve) => {
      const tx  = db.transaction(STORE_DATA, 'readwrite');
      const req = tx.objectStore(STORE_DATA).put({ id, value, updatedAt: new Date().toISOString() });
      req.onsuccess = () => { _lsSet(id, value); resolve(true); }; // Mirror en LS
      req.onerror   = () => { _lsSet(id, value); resolve(false); };
    });
  }

  async function remove(id) {
    const db = await open();
    if (!db) { _lsDel(id); return; }
    return new Promise((resolve) => {
      const tx  = db.transaction(STORE_DATA, 'readwrite');
      tx.objectStore(STORE_DATA).delete(id);
      _lsDel(id);
      tx.oncomplete = () => resolve();
    });
  }

  /* ==================== BACKUPS AUTOMÁTICOS ==================== */

  async function saveBackup(label, data) {
    const db = await open();
    if (!db) return;
    return new Promise((resolve) => {
      const tx  = db.transaction(STORE_BACK, 'readwrite');
      const store = tx.objectStore(STORE_BACK);
      // Máximo 10 backups; eliminar el más antiguo si se supera
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result >= 10) {
          // Borrar el más antiguo (primer registro)
          const cursor = store.openCursor();
          cursor.onsuccess = (e) => { if(e.target.result) e.target.result.delete(); };
        }
        store.add({ label, data, createdAt: new Date().toISOString() });
        tx.oncomplete = () => resolve();
      };
    });
  }

  async function getBackups() {
    const db = await open();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx     = db.transaction(STORE_BACK, 'readonly');
      const req    = tx.objectStore(STORE_BACK).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => resolve([]);
    });
  }

  async function restoreBackup(id) {
    const db = await open();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx  = db.transaction(STORE_BACK, 'readonly');
      const req = tx.objectStore(STORE_BACK).get(id);
      req.onsuccess = () => resolve(req.result?.data ?? null);
      req.onerror   = () => resolve(null);
    });
  }

  /* ==================== DIAGNOSTICS ==================== */

  async function getStorageEstimate() {
    if (!navigator.storage?.estimate) return null;
    try {
      const est = await navigator.storage.estimate();
      return {
        used:  est.usage  || 0,
        quota: est.quota  || 0,
        pct:   est.quota  ? Math.round((est.usage / est.quota) * 100) : 0
      };
    } catch { return null; }
  }

  async function clearAll() {
    const db = await open();
    if (!db) { _lsDel('sistemaEscolar_v3'); return; }
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_DATA, STORE_BACK], 'readwrite');
      tx.objectStore(STORE_DATA).clear();
      tx.objectStore(STORE_BACK).clear();
      tx.oncomplete = () => {
        _lsDel('sistemaEscolar_v3');
        _lsDel('sistemaEscolar_meta_v3');
        resolve();
      };
    });
  }

  /* ==================== FALLBACK localStorage ==================== */
  function _lsGet(id) {
    try { const v = localStorage.getItem(id); return v ? JSON.parse(v) : null; } catch { return null; }
  }
  function _lsSet(id, value) {
    try { localStorage.setItem(id, JSON.stringify(value)); } catch(e) { console.warn('[IDB] LS write failed:', e); }
  }
  function _lsDel(id) {
    try { localStorage.removeItem(id); } catch {}
  }

  /* ==================== INIT: Verificar soporte ==================== */
  async function init() {
    try {
      const db = await open();
      if (db) {
        console.log('[IDB] IndexedDB activo y listo.');
      } else {
        console.warn('[IDB] Usando localStorage como almacenamiento primario.');
      }
    } catch(e) {
      console.error('[IDB] Error de inicialización:', e);
    }
  }

  return { init, get, set, remove, saveBackup, getBackups, restoreBackup, getStorageEstimate, clearAll };
})();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => IDB.init());
} else {
  IDB.init();
}
