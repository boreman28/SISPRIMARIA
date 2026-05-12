/* ================================================================
   excel.js — Exportación e Importación Excel Profesional
   ================================================================ */

const EXCEL = (() => {

  /* ==================== HELPERS DE ESTILO ==================== */
  function _hdr(text) {
    return { v: text, t: 's' };
  }
  function _aoa_ws(data) {
    return XLSX.utils.aoa_to_sheet(data);
  }

  /* ==================== EXPORTAR ==================== */
  function exportar() {
    if (!window.STATE) return;
    const { config, materias, estudiantes, calificaciones, actividades, asistencia, horario } = STATE;
    const wb = XLSX.utils.book_new();

    // ---- Hoja METADATA (para reimportación fiel) ----
    const meta = [
      ['_METADATA_V3'],
      ['escuela',  config.escuela  || ''],
      ['docente',  config.docente  || ''],
      ['grado',    config.grado    || ''],
      ['anio',     config.anio     || '2026'],
      ['aula',     config.aula     || ''],
      ['jornada',  config.jornada  || 'AM'],
      ['materias', JSON.stringify(materias)],
    ];
    for (let t = 1; t <= 3; t++) {
      const ao = {};
      for (let m = 0; m < materias.length; m++) ao[m] = actividades?.[t]?.[m] || [];
      meta.push([`actividades_T${t}`, JSON.stringify(ao)]);
    }
    XLSX.utils.book_append_sheet(wb, _aoa_ws(meta), '_META');

    // ---- Hoja DASHBOARD ----
    _exportarDashboard(wb);

    // ---- Hoja ESTUDIANTES ----
    _exportarEstudiantes(wb);

    // ---- Hojas CALIFICACIONES (una por trimestre y materia) ----
    _exportarCalificaciones(wb);

    // ---- Hojas ASISTENCIA ----
    _exportarAsistencia(wb);

    // ---- Hoja CUADRO DE HONOR ----
    _exportarHonor(wb);

    // ---- Hoja HORARIO ----
    _exportarHorario(wb);

    // ---- Hoja CONSOLIDADO ----
    _exportarConsolidado(wb);

    const grado = (config.grado || 'Grado').replace(/[°\s\/\\?*\[\]]/g,'');
    const anio  = config.anio || '2026';
    XLSX.writeFile(wb, `SistemaEscolar_${grado}_${anio}.xlsx`);
    UI.toast('¡Excel exportado exitosamente!', 'success');
  }

  /* ---- DASHBOARD SHEET ---- */
  function _exportarDashboard(wb) {
    const { config, materias, estudiantes } = STATE;
    const ranking = DASHBOARD.calcularRanking();
    const rows = [
      [`SISTEMA ESCOLAR 2026 — ${config.escuela || ''}`],
      [],
      ['INFORMACIÓN DEL AULA'],
      ['Docente:',  config.docente  || '—', '', 'Grado:', config.grado || '—'],
      ['Aula:',     config.aula     || '—', '', 'Jornada:', config.jornada || '—'],
      [],
      ['ESTADÍSTICAS RÁPIDAS'],
      ['Total Estudiantes', estudiantes.length],
      ['Total Asignaturas', materias.length],
      [],
      ['RANKING GENERAL'],
      ['Posición', 'Estudiante', 'Promedio General'],
      ...ranking.map((e, i) => [i+1, e.nombre, e.prom])
    ];
    const ws = _aoa_ws(rows);
    ws['!cols'] = [{ wch:20 },{ wch:30 },{ wch:14 },{ wch:12 },{ wch:14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'DASHBOARD');
  }

  /* ---- ESTUDIANTES SHEET ---- */
  function _exportarEstudiantes(wb) {
    const { config, estudiantes } = STATE;
    const rows = [
      [`REGISTRO DE ESTUDIANTES — ${config.grado || ''} — AÑO ${config.anio || 2026}`],
      [`Docente: ${config.docente || '—'}`],
      [],
      ['N°','Nombre Completo','Cédula','Sexo','Fecha Nacimiento','Condición','Nombre Acudiente','Teléfono'],
      ...estudiantes.map((e, i) => [i+1, e.nombre, e.cedula, e.sexo, e.nacimiento, e.condicion, e.acudiente, e.telefono])
    ];
    const ws = _aoa_ws(rows);
    ws['!cols'] = [5,30,18,8,16,14,28,14].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, 'ESTUDIANTES');
  }

  /* ---- CALIFICACIONES SHEETS ---- */
  function _exportarCalificaciones(wb) {
    const { config, materias, estudiantes, calificaciones, actividades } = STATE;
    const triNombres = { 1:'T1', 2:'T2', 3:'T3' };

    for (let t = 1; t <= 3; t++) {
      for (let mi = 0; mi < materias.length; mi++) {
        const acts = actividades?.[t]?.[mi] || [];
        const rows = [
          [`CALIFICACIONES — ${materias[mi]} — TRIMESTRE ${t}`],
          [`Escuela: ${config.escuela||''}`, '', '', `Docente: ${config.docente||''}`],
          [`Grado: ${config.grado||''}`, '', `Jornada: ${config.jornada||''}`],
          ['FECHAS:', ...acts.map(a => a.fecha || '')],
          ['N°', 'ESTUDIANTE', ...acts.map((a, ai) => `${ai+1}. ${a.nombre}`), 'PROMEDIO']
        ];
        estudiantes.forEach((e, ei) => {
          const vals  = calificaciones?.[t]?.[mi]?.[ei] || [];
          const nums  = vals.filter(v => v !== '' && !isNaN(parseFloat(v))).map(Number);
          const prom  = nums.length ? (nums.reduce((a,b) => a+b,0)/nums.length).toFixed(2) : '';
          rows.push([ei+1, e.nombre, ...acts.map((_,ai) => vals[ai] ?? ''), prom]);
        });
        const ws = _aoa_ws(rows);
        ws['!cols'] = [{ wch:5 }, { wch:26 }, ...acts.map(() => ({ wch:14 })), { wch:12 }];
        const nombre = `${triNombres[t]}-${materias[mi]}`.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, nombre);
      }
    }
  }

  /* ---- ASISTENCIA SHEETS ---- */
  function _exportarAsistencia(wb) {
    const { config, estudiantes, asistencia, mesesPorTri } = STATE;
    const triNombres = { 1:'T1', 2:'T2', 3:'T3' };

    for (let t = 1; t <= 3; t++) {
      mesesPorTri[String(t)].forEach(mes => {
        const rows = [
          [`ASISTENCIA ${mes.toUpperCase()} — TRIMESTRE ${t}`],
          [`Docente: ${config.docente||''}`, '', '', `Grado: ${config.grado||''}`, '', `Aula: ${config.aula||''}`],
          [],
          ['N°', 'ESTUDIANTE', 'SEX', ...Array.from({length:30},(_,i)=>i+1), 'Presentes', 'Ausentes', 'Tardanzas']
        ];
        estudiantes.forEach((e, ei) => {
          const dias = asistencia?.[t]?.[mes]?.[ei] || Array(30).fill('');
          let P=0, A=0, T=0;
          dias.forEach(d => { if(d==='P')P++; else if(d==='A')A++; else if(d==='T')T++; });
          rows.push([ei+1, e.nombre, e.sexo, ...dias.map(d=>d||''), P, A, T]);
        });
        const ws = _aoa_ws(rows);
        ws['!cols'] = [{ wch:5 }, { wch:22 }, { wch:5 }, ...Array(30).fill({wch:3}), {wch:9},{wch:9},{wch:9}];
        const nombre = `ASIST-${triNombres[t]}-${mes.substring(0,4)}`.substring(0,31);
        XLSX.utils.book_append_sheet(wb, ws, nombre);
      });
    }
  }

  /* ---- CUADRO DE HONOR SHEET ---- */
  function _exportarHonor(wb) {
    const { config } = STATE;
    const ranking = DASHBOARD.calcularRanking();
    const rows = [
      [`CUADRO DE HONOR — ${config.grado||''} — ${config.anio||2026}`],
      [`Docente: ${config.docente||'—'}   Escuela: ${config.escuela||'—'}`],
      [],
      ['Posición','Estudiante','Promedio General','Distinción']
    ];
    ranking.forEach((e, i) => {
      const pv = parseFloat(e.prom);
      const dist = pv>=4.5?'Excelencia':pv>=3.5?'Muy Bueno':pv>=3.0?'Aprobado':'Refuerzo';
      rows.push([i+1, e.nombre, e.prom, dist]);
    });
    const ws = _aoa_ws(rows);
    ws['!cols'] = [{ wch:10 },{ wch:30 },{ wch:18 },{ wch:16 }];
    XLSX.utils.book_append_sheet(wb, ws, 'CUADRO DE HONOR');
  }

  /* ---- HORARIO SHEET ---- */
  function _exportarHorario(wb) {
    const { config, horario, horarioHoras } = STATE;
    const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
    const rows = [
      [`HORARIO SEMANAL — ${config.grado||''} — AÑO ${config.anio||2026}`],
      [`Docente: ${config.docente||'—'}`, '', '', `Aula: ${config.aula||'—'}`, '', `Jornada: ${config.jornada||'—'}`],
      [],
      ['HORA', ...dias]
    ];
    horarioHoras.forEach(h => {
      if (h === 'RECESO') rows.push(['⏸ RECESO', '', '', '', '', '']);
      else rows.push([h, ...dias.map(d => horario?.[h]?.[d] || '')]);
    });
    const ws = _aoa_ws(rows);
    ws['!cols'] = [{ wch:14 }, ...dias.map(() => ({ wch:20 }))];
    XLSX.utils.book_append_sheet(wb, ws, 'HORARIO');
  }

  /* ---- CONSOLIDADO SHEET ---- */
  function _exportarConsolidado(wb) {
    const { config, materias, estudiantes, calificaciones } = STATE;
    const rows = [
      [`CONSOLIDADO GENERAL — ${config.grado||''} — ${config.anio||2026}`],
      [`Escuela: ${config.escuela||'—'}`, '', `Docente: ${config.docente||'—'}`],
      [],
      ['N°', 'ESTUDIANTE', ...materias.map(m => m.substring(0,13)), 'PROM. GENERAL', 'DISTINCIÓN']
    ];
    estudiantes.forEach((e, ei) => {
      const promsPorMat = materias.map((_, mi) => {
        let total=0, cnt=0;
        for (let t=1;t<=3;t++) {
          const vals = calificaciones?.[t]?.[mi]?.[ei];
          if (!vals) continue;
          const p = UTILS.promedio(vals.filter(v => v!==''));
          if (p!==null) { total+=p; cnt++; }
        }
        return cnt ? parseFloat((total/cnt).toFixed(2)) : '';
      });
      const nums  = promsPorMat.filter(v => v !== '').map(Number);
      const prom  = nums.length ? (nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2) : '';
      const dist  = prom === '' ? '' :
                    parseFloat(prom)>=4.5 ? 'Excelencia' :
                    parseFloat(prom)>=3.5 ? 'Muy Bueno'  :
                    parseFloat(prom)>=3.0 ? 'Aprobado'   : 'Reprobado';
      rows.push([ei+1, e.nombre, ...promsPorMat, prom, dist]);
    });
    const ws = _aoa_ws(rows);
    ws['!cols'] = [{ wch:5 },{ wch:28 },...materias.map(()=>({wch:13})),{wch:14},{wch:12}];
    XLSX.utils.book_append_sheet(wb, ws, 'CONSOLIDADO');
  }

  /* ==================== IMPORTAR ==================== */
  function importar(inputEl) {
    const file = inputEl.files[0];
    if (!file) return;
    UI.toast('Leyendo archivo Excel...', 'info', 2000);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        if (wb.SheetNames.includes('_META')) _importarPropio(wb);
        else _importarGenerico(wb);
      } catch(err) {
        UI.toast('Error al leer el archivo: ' + err.message, 'error');
        console.error(err);
      } finally {
        inputEl.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function _importarPropio(wb) {
    const meta = XLSX.utils.sheet_to_json(wb.Sheets['_META'], { header:1 });
    if (!meta[0] || meta[0][0] !== '_METADATA_V3') { UI.toast('Formato de metadata no compatible', 'error'); return; }

    const cfg = {};
    meta.forEach(r => { if(r[0] && r[1] !== undefined) cfg[r[0]] = r[1]; });

    // Config
    const setVal = (id, v) => { const el=document.getElementById(id); if(el&&v!==undefined&&v!==null) el.value=v; };
    if(cfg.escuela) setVal('d-escuela', cfg.escuela);
    if(cfg.docente) setVal('d-docente', cfg.docente);
    if(cfg.grado)   setVal('d-grado',   cfg.grado);
    if(cfg.anio)    setVal('d-anio',    cfg.anio);
    if(cfg.aula)    setVal('d-aula',    cfg.aula);
    if(cfg.jornada) setVal('d-jornada', cfg.jornada);
    APP._actualizarConfig();

    if(cfg.materias) STATE.materias = JSON.parse(cfg.materias);

    for(let t=1;t<=3;t++) {
      const key = `actividades_T${t}`;
      if(cfg[key]) {
        const obj = JSON.parse(cfg[key]);
        STATE.actividades[t] = {};
        for(const k in obj) STATE.actividades[t][parseInt(k)] = obj[k];
      }
    }

    // Estudiantes
    if (wb.Sheets['ESTUDIANTES']) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets['ESTUDIANTES'], { header:1 });
      const hx = rows.findIndex(r => r && (String(r[0]).startsWith('N') && String(r[1]||'').toLowerCase().includes('nombre')));
      if (hx !== -1) {
        STATE.estudiantes = [];
        for (let i = hx+1; i < rows.length; i++) {
          const r = rows[i]; if(!r||!r[1]) continue;
          STATE.estudiantes.push({ id:UTILS.uid(), nombre:String(r[1]||''), cedula:String(r[2]||''), sexo:String(r[3]||'M'), nacimiento:String(r[4]||''), condicion:String(r[5]||'Regular'), acudiente:String(r[6]||''), telefono:String(r[7]||'') });
        }
      }
    }

    // Calificaciones
    const tn = { 1:'T1', 2:'T2', 3:'T3' };
    for(let t=1;t<=3;t++) {
      STATE.calificaciones[t] = {};
      STATE.materias.forEach((mat, mi) => {
        STATE.calificaciones[t][mi] = {};
        const sn = `${tn[t]}-${mat}`.substring(0,31);
        const ws = wb.Sheets[sn]; if(!ws) return;
        const rows = XLSX.utils.sheet_to_json(ws, { header:1 });
        const hx = rows.findIndex(r => r && (String(r[0]).startsWith('N')));
        if(hx === -1) return;
        const na = (STATE.actividades[t]?.[mi]||[]).length;
        for(let i=hx+1;i<rows.length;i++) {
          const r=rows[i]; if(!r||r[0]===undefined) continue;
          const ei = i-hx-1;
          STATE.calificaciones[t][mi][ei] = Array.from({length:na}, (_,ai) => {
            const v = r[2+ai]; return (v!==undefined && v!=='') ? v : '';
          });
        }
      });
    }

    // Asistencia
    const mPorTri = STATE.mesesPorTri;
    for(let t=1;t<=3;t++) {
      STATE.asistencia[t] = {};
      mPorTri[String(t)].forEach(mes => {
        STATE.asistencia[t][mes] = {};
        const sn = `ASIST-${tn[t]}-${mes.substring(0,4)}`.substring(0,31);
        const ws = wb.Sheets[sn];
        if(!ws) { for(let e=0;e<STATE.estudiantes.length;e++) STATE.asistencia[t][mes][e]=Array(30).fill(''); return; }
        const rows = XLSX.utils.sheet_to_json(ws, { header:1 });
        const hx = rows.findIndex(r => r && String(r[0]).startsWith('N'));
        if(hx===-1) { for(let e=0;e<STATE.estudiantes.length;e++) STATE.asistencia[t][mes][e]=Array(30).fill(''); return; }
        for(let i=hx+1;i<rows.length;i++) {
          const r=rows[i]; if(!r||r[0]===undefined) continue;
          const ei=i-hx-1;
          STATE.asistencia[t][mes][ei] = Array.from({length:30}, (_,d) => {
            const v=String(r[3+d]||'').trim().toUpperCase();
            return ['P','A','T'].includes(v)?v:'';
          });
        }
      });
    }

    // Horario
    if(wb.Sheets['HORARIO']) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets['HORARIO'], { header:1 });
      const hx = rows.findIndex(r => r && String(r[0]).toUpperCase() === 'HORA');
      if(hx!==-1) {
        const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
        STATE.horario = {};
        for(let i=hx+1;i<rows.length;i++) {
          const r=rows[i]; if(!r||!r[0]) continue;
          const h=String(r[0]); if(h.includes('RECESO')) continue;
          STATE.horario[h] = {};
          dias.forEach((d,di) => { if(r[1+di]) STATE.horario[h][d] = String(r[1+di]); });
        }
      }
    }

    APP._asegurarEstructuras();
    APP._renderAll();
    STORAGE.saveManual();
    UI.toast('¡Datos importados exitosamente!', 'success');
  }

  function _importarGenerico(wb) {
    const nombres = wb.SheetNames;
    const estSheet = nombres.find(n => n.toUpperCase().includes('ESTUD') || n.toUpperCase().includes('DATOS') || n.toUpperCase().includes('ALUMN'));
    if (estSheet) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[estSheet], { header:1 });
      const hx = rows.findIndex(r => r && r.length >= 3 && String(r[1]||'').toLowerCase().includes('nombre'));
      if (hx !== -1) {
        STATE.estudiantes = [];
        for (let i=hx+1;i<rows.length;i++) {
          const r=rows[i]; if(!r||!r[1]) continue;
          STATE.estudiantes.push({ id:UTILS.uid(), nombre:String(r[1]||''), cedula:String(r[2]||''), sexo:String(r[3]||'M'), nacimiento:String(r[4]||''), condicion:'Regular', acudiente:String(r[5]||''), telefono:String(r[6]||'') });
        }
      }
    }
    APP._asegurarEstructuras();
    APP._renderAll();
    STORAGE.saveManual();
    UI.toast('Datos importados (formato genérico)', 'info');
  }

  return { exportar, importar };
})();
