/* ================================================================
   dashboard.js — Dashboard KPIs, Top5 y Cuadro de Honor
   ================================================================ */

const DASHBOARD = (() => {

  /* ==================== KPI CARDS ==================== */
  function renderKPIs() {
    if (!window.STATE) return;
    const { estudiantes, materias, calificaciones, asistencia } = STATE;
    const nEst = estudiantes.length;
    const nMat = materias.length;

    // Calcular promedios generales de todos los estudiantes
    let promGrupo = 0, contGrupo = 0;
    let aprobados = 0, reprobados = 0;
    let mejorProm = 0, mejorNombre = '—';

    const promediosPorEst = estudiantes.map((e, ei) => {
      let total = 0, cnt = 0;
      for (let t = 1; t <= 3; t++) {
        for (let mi = 0; mi < materias.length; mi++) {
          const vals = calificaciones?.[t]?.[mi]?.[ei];
          if (!vals) continue;
          const p = UTILS.promedio(vals.filter(v => v !== ''));
          if (p !== null) { total += p; cnt++; }
        }
      }
      return cnt ? parseFloat((total / cnt).toFixed(2)) : null;
    });

    promediosPorEst.forEach((p, i) => {
      if (p === null) return;
      promGrupo += p; contGrupo++;
      if (p >= 3.0) aprobados++; else reprobados++;
      if (p > mejorProm) { mejorProm = p; mejorNombre = estudiantes[i].nombre; }
    });

    const promGeneral = contGrupo ? (promGrupo / contGrupo).toFixed(2) : '—';

    // Asistencia general
    let totP = 0, totDias = 0;
    [1,2,3].forEach(t => {
      const meses = STATE.mesesPorTri[String(t)];
      meses.forEach(mes => {
        for (let ei = 0; ei < nEst; ei++) {
          const dias = asistencia?.[t]?.[mes]?.[ei] || [];
          dias.forEach(d => { if (d) { totDias++; if (d === 'P') totP++; } });
        }
      });
    });
    const pctAsist = totDias ? Math.round((totP / totDias) * 100) : 0;

    const kpis = [
      { label: 'Total Estudiantes', val: nEst,          icon: 'fa-users',            color: 'blue',   trend: '' },
      { label: 'Promedio General',  val: promGeneral,   icon: 'fa-chart-line',        color: 'green',  trend: '' },
      { label: 'Aprobados',         val: aprobados,     icon: 'fa-circle-check',      color: 'teal',   trend: nEst ? `${Math.round(aprobados/nEst*100)}%` : '' },
      { label: 'Reprobados',        val: reprobados,    icon: 'fa-circle-xmark',      color: 'red',    trend: nEst ? `${Math.round(reprobados/nEst*100)}%` : '' },
      { label: 'Mejor Promedio',    val: mejorProm || '—', icon: 'fa-star',           color: 'yellow', trend: mejorNombre.split(' ')[0] },
      { label: 'Asistencia General',val: pctAsist + '%',icon: 'fa-calendar-check',   color: 'purple', trend: '' },
      { label: 'Asignaturas',       val: nMat,          icon: 'fa-book-open',         color: 'cyan',   trend: '' },
      { label: 'Trimestres',        val: 3,             icon: 'fa-flag-checkered',    color: 'orange', trend: 'Año 2026' },
    ];

    const grid = document.getElementById('kpi-grid');
    if (!grid) return;
    grid.innerHTML = kpis.map(k => `
      <div class="kpi-card ${k.color}">
        <div class="kpi-icon-wrap">
          <div class="kpi-icon"><i class="fa-solid ${k.icon}"></i></div>
          ${k.trend ? `<div class="kpi-trend up"><i class="fa-solid fa-arrow-trend-up"></i> ${UTILS.escHtml(String(k.trend))}</div>` : ''}
        </div>
        <div class="kpi-val">${UTILS.escHtml(String(k.val))}</div>
        <div class="kpi-label">${UTILS.escHtml(k.label)}</div>
      </div>`).join('');
  }

  /* ==================== TOP 5 EN DASHBOARD ==================== */
  function renderTop5() {
    const cont = document.getElementById('dash-top5');
    if (!cont || !window.STATE) return;
    const ranking = calcularRanking();
    const top = ranking.slice(0, 5);

    if (!top.length) {
      cont.innerHTML = '<div class="empty-state"><i class="fa-solid fa-chart-bar"></i><p>Sin datos de calificaciones aún</p></div>';
      return;
    }

    const medals = ['🥇','🥈','🥉'];
    cont.innerHTML = top.map((e, i) => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)${i===top.length-1?';border:none':''}">
        <div style="font-size:20px;width:32px;text-align:center;flex-shrink:0">${medals[i] || `<span style="font-weight:800;color:var(--text-sec)">${i+1}</span>`}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${UTILS.escHtml(e.nombre)}</div>
          <div style="font-size:11px;color:var(--text-sec)">Promedio General</div>
        </div>
        <div>${UTILS.notaBadge(e.prom)}</div>
      </div>`).join('');
  }

  /* ==================== CUADRO DE HONOR ==================== */
  function renderHonor() {
    if (!window.STATE) return;
    const ranking = calcularRanking();

    // KPIs de honor
    const kpisEl = document.getElementById('honor-kpis');
    if (kpisEl) {
      const aprobados  = ranking.filter(e => parseFloat(e.prom) >= 3.0).length;
      const excelentes = ranking.filter(e => parseFloat(e.prom) >= 4.5).length;
      const promG = ranking.length
        ? (ranking.reduce((s,e) => s + parseFloat(e.prom), 0) / ranking.length).toFixed(2)
        : '—';
      const kpis = [
        { label:'Total en Ranking', val: ranking.length, icon:'fa-users',        color:'blue'   },
        { label:'Promedio Grupal',  val: promG,          icon:'fa-chart-line',   color:'green'  },
        { label:'Excelencia (≥4.5)',val: excelentes,     icon:'fa-star',         color:'yellow' },
        { label:'Aprobados (≥3.0)', val: aprobados,      icon:'fa-circle-check', color:'teal'   },
      ];
      kpisEl.innerHTML = kpis.map(k => `
        <div class="kpi-card ${k.color}" style="cursor:default">
          <div class="kpi-icon-wrap"><div class="kpi-icon"><i class="fa-solid ${k.icon}"></i></div></div>
          <div class="kpi-val">${UTILS.escHtml(String(k.val))}</div>
          <div class="kpi-label">${UTILS.escHtml(k.label)}</div>
        </div>`).join('');
    }

    // Gráficas de honor
    CHARTS.renderHonorRank(ranking);
    CHARTS.renderHonorTri(ranking);

    // Lista de honor
    const lista = document.getElementById('honor-lista');
    if (!lista) return;
    if (!ranking.length) {
      lista.innerHTML = '<div class="empty-state"><i class="fa-solid fa-trophy"></i><p>No hay calificaciones registradas aún</p></div>';
      return;
    }

    const medals = ['🥇','🥈','🥉'];
    lista.innerHTML = ranking.map((e, i) => {
      const pv = parseFloat(e.prom);
      const badge = pv >= 4.5 ? 'badge-A' : pv >= 3.5 ? 'badge-B' : pv >= 2.5 ? 'badge-C' : 'badge-D';
      return `
        <div class="honor-card">
          <div class="honor-rank">${medals[i] || i+1}</div>
          <div class="honor-info">
            <div class="honor-name">${UTILS.escHtml(e.nombre)}</div>
            <div class="honor-avg">Promedio: <strong>${e.prom}</strong></div>
          </div>
          <span class="badge ${badge}">${e.prom}</span>
        </div>`;
    }).join('');
  }

  /* ==================== CALCULAR RANKING ==================== */
  function calcularRanking() {
    if (!window.STATE) return [];
    const { estudiantes, materias, calificaciones } = STATE;
    return estudiantes
      .map((e, ei) => {
        let total = 0, cnt = 0;
        for (let t = 1; t <= 3; t++) {
          for (let mi = 0; mi < materias.length; mi++) {
            const vals = calificaciones?.[t]?.[mi]?.[ei];
            if (!vals) continue;
            const p = UTILS.promedio(vals.filter(v => v !== ''));
            if (p !== null) { total += p; cnt++; }
          }
        }
        return { idx: ei, nombre: e.nombre, prom: cnt ? (total/cnt).toFixed(2) : null };
      })
      .filter(e => e.prom !== null)
      .sort((a, b) => parseFloat(b.prom) - parseFloat(a.prom));
  }

  /* ==================== REFRESH COMPLETO ==================== */
  function refresh() {
    renderKPIs();
    renderTop5();
    CHARTS.renderAll();
    UI.toast('Dashboard actualizado', 'info', 2000);
  }

  return { renderKPIs, renderTop5, renderHonor, calcularRanking, refresh };
})();
