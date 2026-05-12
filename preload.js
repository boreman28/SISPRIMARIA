/* ================================================================
   preload.js — Puente Seguro Electron (contextBridge)
   Expone APIs controladas del proceso principal al renderer
   ================================================================ */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

  /* ---------- Guardar archivo Excel en disco (nativo) ---------- */
  saveBackup: (base64Content) =>
    ipcRenderer.invoke('save-backup', base64Content),

  /* ---------- Abrir diálogo de importación ---------- */
  openFile: () =>
    ipcRenderer.invoke('open-file'),

  /* ---------- Info de la app ---------- */
  getAppInfo: () =>
    ipcRenderer.invoke('get-app-info'),

  /* ---------- Escuchar eventos del menú ---------- */
  onMenuSave:   (cb) => ipcRenderer.on('menu-save',   () => cb()),
  onMenuExport: (cb) => ipcRenderer.on('menu-export', () => cb()),
  onMenuImport: (cb) => ipcRenderer.on('menu-import', () => cb()),
  onMenuLock:   (cb) => ipcRenderer.on('menu-lock',   () => cb()),
  onMenuTheme:  (cb) => ipcRenderer.on('menu-theme',  () => cb()),
  onNav:        (cb) => ipcRenderer.on('nav',  (_, section) => cb(section)),
  onWillClose:  (cb) => ipcRenderer.on('app-will-close', () => cb()),

  /* ---------- Detectar si está corriendo en Electron ---------- */
  isElectron: true,

  /* ---------- Plataforma ---------- */
  platform: process.platform,
});
