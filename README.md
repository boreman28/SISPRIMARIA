# 🎓 Sistema de Calificación Escolar 2026
### Dashboard Académico Digital · Offline · v3.0

> Desarrollado por **Jorge Polanco**

---

## 📋 Descripción

Sistema completo de gestión académica escolar con interfaz tipo dashboard moderno. Funciona **100% offline**, sin necesidad de internet para operar. Los datos se almacenan directamente en el dispositivo usando IndexedDB y localStorage.

---

## 🗂️ Estructura del Proyecto

```
sistema-escolar/
│
├── index.html       ← Aplicación principal (HTML)
├── style.css        ← Estilos globales + dark mode + responsive
├── print.css        ← Estilos de impresión (boletines)
│
├── app.js           ← Controlador principal (navegación, CRUD, renders)
├── utils.js         ← Funciones de utilidad reutilizables
├── storage.js       ← Auto-guardado, IDB, backups automáticos
├── idb.js           ← Capa IndexedDB con fallback a localStorage
├── auth.js          ← Autenticación, sesión con TTL, bloqueo
├── ui.js            ← Toast, Modal, Sidebar, Tema oscuro/claro
├── charts.js        ← Gráficas Chart.js (5 tipos)
├── dashboard.js     ← KPIs, Top 5, Cuadro de Honor
├── excel.js         ← Exportación e importación Excel profesional
├── sw.js            ← Service Worker (caché offline)
│
├── main.js          ← Electron: proceso principal (app de escritorio)
├── preload.js       ← Electron: puente seguro contextBridge
├── package.json     ← Configuración npm / electron-builder
│
└── assets/
    └── icons/
        ├── icon.png   (512×512)
        ├── icon.ico   (Windows)
        └── icon.icns  (macOS)
```

---

## 🚀 Cómo Usar

### Opción 1 — Navegador Web (más sencillo)

1. Descarga o clona la carpeta `sistema-escolar/`
2. Abre `index.html` directamente en tu navegador (Chrome, Edge o Firefox)
3. **Contraseña inicial:** `2026`

> ⚠️ Para que el Service Worker funcione correctamente, sirve los archivos con un servidor local:
> ```bash
> # Python 3
> python -m http.server 8080
> # Luego abre: http://localhost:8080
> ```

### Opción 2 — Aplicación de Escritorio (Electron)

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar en modo desarrollo
npm start

# 3. Compilar instalador
npm run build:win    # Windows (.exe)
npm run build:mac    # macOS (.dmg)
npm run build:linux  # Linux (.AppImage)
```

> Requiere Node.js 18+ y npm instalados.

---

## 🔑 Seguridad

| Característica        | Detalle |
|----------------------|---------|
| Contraseña inicial   | `2026` |
| Almacenamiento       | Hash local en el dispositivo |
| Sesión               | TTL de 4 horas |
| Bloqueo automático   | 20 min de inactividad |
| Cambiar contraseña   | Configuración → Seguridad |

---

## 💡 Funciones Principales

### 📊 Dashboard
- 8 KPI cards en tiempo real
- Gráfica de rendimiento por trimestre
- Distribución de notas (dona)
- Promedio por materia (barras)
- Top 5 mejores estudiantes

### 👥 Estudiantes
- Registro completo (nombre, cédula, sexo, nacimiento, condición, acudiente, teléfono)
- Búsqueda en tiempo real
- Filtros por condición y sexo
- Exportación de lista a Excel
- Avatares con iniciales

### 📝 Calificaciones
- 3 trimestres independientes
- Actividades configurables por materia y trimestre
- Promedio automático por fila con colores
- Validación de notas (1.0 – 5.0)
- Color en tiempo real según rendimiento

### 📅 Asistencia
- 30 días por mes
- Estados: Presente (P), Ausente (A), Tardanza (T)
- Contadores automáticos por estudiante
- 3 meses por trimestre

### 📄 Boletín
- Informe individual por estudiante
- Promedios por trimestre y final
- Listo para imprimir (`Ctrl+P`)

### 🏆 Cuadro de Honor
- Ranking automático
- Gráficas de comparación
- Distinción: Excelencia / Muy Bueno / Aprobado

### 🗓️ Horario
- 8 períodos por día
- 5 días de la semana
- Receso configurable
- Imprimible

---

## 💾 Almacenamiento de Datos

| Nivel | Tecnología | Capacidad |
|-------|-----------|-----------|
| Primario | IndexedDB | Hasta 1 GB |
| Mirror | localStorage | ~10 MB |
| Offline | Service Worker | Caché CDN |
| Backup | IndexedDB (hasta 10) | Automático cada hora |
| Exportación | Excel .xlsx | Ilimitado |

### Auto-guardado
- ✅ Al escribir (debounce 2.5s)
- ✅ Cada 30 segundos si hay cambios
- ✅ Backup automático cada 60 minutos (hasta 10)
- ✅ Al cerrar la aplicación (Electron)
- ✅ Indicador visual en el topbar (click para ver backups)

---

## 📊 Exportación Excel

El archivo exportado incluye **7 hojas**:

| Hoja | Contenido |
|------|-----------|
| `DASHBOARD` | Resumen y ranking general |
| `ESTUDIANTES` | Padrón completo del aula |
| `T1/T2/T3-[Materia]` | Notas por trimestre y asignatura |
| `ASIST-T1/T2/T3-[Mes]` | Asistencia diaria por mes |
| `CUADRO DE HONOR` | Ranking con distinción |
| `HORARIO` | Horario semanal |
| `CONSOLIDADO` | Promedio final por materia y estudiante |
| `_META` | Metadata interna para reimportación fiel |

Para **importar**, el sistema detecta automáticamente si el archivo fue exportado por este sistema (formato propio) o si es un Excel genérico.

---

## 📱 Responsive

| Dispositivo | Comportamiento |
|-------------|---------------|
| Desktop (+1024px) | Sidebar fijo expandido |
| Tablet (768-1024px) | Sidebar colapsado, gráficas en columna |
| Móvil (-768px) | Sidebar deslizable con overlay |

---

## 🎨 Temas

- **Modo Claro** (por defecto): fondo gris suave, superficies blancas
- **Modo Oscuro**: fondo navy oscuro, superficies slate
- Toggle con botón 🌙/☀️ en el topbar
- El tema se guarda automáticamente

---

## ⌨️ Atajos de Teclado (Electron)

| Atajo | Acción |
|-------|--------|
| `Ctrl+S` | Guardar |
| `Ctrl+E` | Exportar Excel |
| `Ctrl+I` | Importar Excel |
| `Ctrl+P` | Imprimir |
| `Ctrl+L` | Bloquear sesión |
| `Ctrl+D` | Cambiar tema |
| `Ctrl+Q` | Salir |

---

## 🛠️ Tecnologías

- HTML5 + CSS3 + JavaScript Vanilla (sin frameworks)
- [Chart.js 4.4](https://www.chartjs.org/) — Gráficas
- [SheetJS (XLSX) 0.18](https://sheetjs.com/) — Excel
- [Font Awesome 6.5](https://fontawesome.com/) — Íconos
- [Electron 28](https://www.electronjs.org/) — App de escritorio
- IndexedDB + localStorage — Persistencia offline
- Service Worker — Caché y offline

---

## 📅 Calendario Escolar Panamá 2026

| Período | Fechas |
|---------|--------|
| Inicio de clases | 2 de marzo |
| I Trimestre | Marzo – Mayo |
| II Trimestre | Junio – Agosto |
| III Trimestre | Septiembre – Noviembre |
| Fin de año | 18 de diciembre |

---

## 📞 Contacto

**Jorge Polanco**
- GitHub: [github.com/boreman28](https://github.com/boreman28)
- WhatsApp: +507 6536-0544

---

## 📄 Licencia

MIT © 2025-2026 Jorge Polanco

> Este software es de uso libre para instituciones educativas.
