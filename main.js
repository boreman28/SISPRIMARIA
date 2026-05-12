/* ================================================================
   main.js — Proceso Principal de Electron
   Sistema Escolar 2026
   ================================================================ */

const { app, BrowserWindow, Menu, shell, dialog, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const fs   = require('fs');

const isDev = process.argv.includes('--dev');

/* ==================== VENTANA PRINCIPAL ==================== */
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:          1280,
    height:         800,
    minWidth:       900,
    minHeight:      600,
    title:          'Sistema Escolar 2026',
    backgroundColor: '#0f172a',
    show:           false,  // Mostrar tras 'ready-to-show'
    webPreferences: {
      preload:           path.join(__dirname, 'preload.js'),
      nodeIntegration:   false,  // Seguridad: desactivado
      contextIsolation:  true,   // Seguridad: activado
      sandbox:           true,
    },
    // Ícono por plataforma
    icon: path.join(__dirname, 'assets', 'icons',
      process.platform === 'win32' ? 'icon.ico' :
      process.platform === 'darwin' ? 'icon.icns' : 'icon.png'
    ),
  });

  // Cargar app
  mainWindow.loadFile('index.html');

  // Mostrar cuando esté listo
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools();
  });

  // Prevenir cierre sin guardar (emitido desde renderer via IPC)
  mainWindow.on('close', e => {
    mainWindow.webContents.send('app-will-close');
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

/* ==================== MENÚ ==================== */
function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        { label: 'Guardar',           accelerator: 'CmdOrCtrl+S',     click: () => mainWindow?.webContents.send('menu-save')    },
        { label: 'Exportar Excel',    accelerator: 'CmdOrCtrl+E',     click: () => mainWindow?.webContents.send('menu-export')  },
        { label: 'Importar Excel',    accelerator: 'CmdOrCtrl+I',     click: () => mainWindow?.webContents.send('menu-import')  },
        { type: 'separator' },
        { label: 'Imprimir Boletín',  accelerator: 'CmdOrCtrl+P',     click: () => mainWindow?.webContents.print()             },
        { type: 'separator' },
        { label: 'Bloquear Sesión',   accelerator: 'CmdOrCtrl+L',     click: () => mainWindow?.webContents.send('menu-lock')   },
        { type: 'separator' },
        { label: 'Salir',             accelerator: 'CmdOrCtrl+Q',     role:  'quit'                                             },
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo',  label: 'Deshacer' },
        { role: 'redo',  label: 'Rehacer'  },
        { type: 'separator' },
        { role: 'cut',   label: 'Cortar'   },
        { role: 'copy',  label: 'Copiar'   },
        { role: 'paste', label: 'Pegar'    },
        { role: 'selectAll', label: 'Seleccionar Todo' },
      ]
    },
    {
      label: 'Vista',
      submenu: [
        { label: 'Dashboard',       click: () => mainWindow?.webContents.send('nav', 'dashboard')      },
        { label: 'Estudiantes',     click: () => mainWindow?.webContents.send('nav', 'estudiantes')    },
        { label: 'Calificaciones',  click: () => mainWindow?.webContents.send('nav', 'calificaciones') },
        { label: 'Asistencia',      click: () => mainWindow?.webContents.send('nav', 'asistencia')     },
        { type: 'separator' },
        { label: 'Modo Oscuro/Claro', accelerator: 'CmdOrCtrl+D', click: () => mainWindow?.webContents.send('menu-theme') },
        { type: 'separator' },
        { role: 'resetZoom',    label: 'Zoom Normal'   },
        { role: 'zoomIn',       label: 'Acercar'       },
        { role: 'zoomOut',      label: 'Alejar'        },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla Completa' },
        ...(isDev ? [{ type: 'separator' }, { role: 'toggleDevTools', label: 'Dev Tools' }] : []),
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        { label: 'Acerca del Sistema', click: () => {
          dialog.showMessageBox(mainWindow, {
            type:    'info',
            title:   'Sistema Escolar 2026',
            message: 'Sistema de Calificación Escolar',
            detail:  'Versión 3.0\nDesarrollado por Jorge Polanco\nLicencia MIT\n\nAplicación de escritorio offline para gestión académica.',
            buttons: ['OK'],
            icon:    path.join(__dirname, 'assets', 'icons', 'icon.png'),
          });
        }},
        { type: 'separator' },
        { label: 'Reportar Problema', click: () => shell.openExternal('https://github.com/boreman28') },
      ]
    }
  ];

  // macOS: nombre de app en primer menú
  if (process.platform === 'darwin') {
    template.unshift({ label: app.name, submenu: [{ role: 'about' }, { type:'separator' }, { role:'quit' }] });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ==================== IPC HANDLERS ==================== */

// Renderer pide guardar archivo de respaldo en disco
ipcMain.handle('save-backup', async (_, content) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title:       'Guardar Respaldo Excel',
    defaultPath: `SistemaEscolar_backup_${new Date().toISOString().slice(0,10)}.xlsx`,
    filters:     [{ name: 'Excel', extensions: ['xlsx'] }]
  });
  if (!filePath) return { ok: false };
  try {
    fs.writeFileSync(filePath, Buffer.from(content, 'base64'));
    return { ok: true, path: filePath };
  } catch(e) {
    return { ok: false, error: e.message };
  }
});

// Renderer pide abrir diálogo de importación
ipcMain.handle('open-file', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
    title:       'Importar Excel',
    filters:     [{ name: 'Excel', extensions: ['xlsx','xls'] }],
    properties:  ['openFile']
  });
  if (canceled || !filePaths.length) return null;
  try {
    const data = fs.readFileSync(filePaths[0]);
    return { name: path.basename(filePaths[0]), data: data.toString('base64') };
  } catch(e) { return null; }
});

// Información del sistema
ipcMain.handle('get-app-info', () => ({
  version:   app.getVersion(),
  platform:  process.platform,
  userData:  app.getPath('userData'),
  isDev
}));

/* ==================== APP LIFECYCLE ==================== */
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Bloquear navegación a URLs externas por seguridad
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});
