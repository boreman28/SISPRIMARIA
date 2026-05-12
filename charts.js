/* ================================================================
   charts.js — Gráficas con Chart.js
   ================================================================ */

const CHARTS = (() => {
  const _instances = {};

  /* ---------- Colores del tema ---------- */
  function _getColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text:    isDark ? '#94a3b8' : '#64748b',
      grid:    isDark ? '#334155' : '#e2e8f0',
      surface: isDark ? '#1e293b' : '#ffffff',
      primary: '#2563eb',
      palette: ['#2563eb','#10b981','#f59e0b','#ef4444','#6366f1','#06b6d4','#f97316','#14b8a6','#8b5cf6','#ec4899']
    };
  }

  /* ---------- Defaults globales ---------- */
  function _applyDefaults() {
    const c = _getColors();
    Chart.defaults.color          = c.text;
    Chart.defaults.font.family    = "'Plus Jakarta Sans', system-ui, sans-serif";
    Chart.defaults.font.size      = 12;
    Chart.defaults.plugins.legend.labels.boxWidth  = 12;
    Chart.defaults.plugins.legend.labels.padding   = 16;
    Chart.defaults.plugins.tooltip.backgroundColor = c.surface === '#ffffff' ? '#0f172a' : '#1e293b';
    Chart.defaults.plugins.tooltip.titleColor      = '#f1f5f9';
    Chart.defaults.plugins.tooltip.bodyColor       = '#94a3b8';
    Chart.defaults.plugins.tooltip.padding         = 10;
    Chart.defaults.plugins.tooltip.cornerRadius    = 8;
    Chart.defaults.plugins.tooltip.displayColors   = true;
  }

  /* ---------- Actualizar tema en todas las gráficas ---------- */
  function updateTheme() {
    _applyDefaults();
    Object.values(_instances).forEach(chart => {
      if (!chart) return;
      const c = _getColors();
      if (chart.options.scales?.x) {
        chart.options.scales.x.ticks.color = c.text;
        chart.options.scales.x.grid.color  = c.grid;
      }
      if (chart.options.scales?.y) {
        chart.options.scales.y.ticks.color = c.text;
        chart.options.scales.y.grid.color  = c.grid;
      }
      chart.update('none');
    });
  }

  /* ---------- Destruir gráfica existente ---------- */
  function _destroy(id) {
    if (_instances[id]) { _instances[id].destroy(); _instances[id] = null; }
  }

  /* ================================================================
     GRÁFICA: Rendimiento por Trimestre (líneas)
  ================================================================ */
  function renderTrimestre() {
    _destroy('trimestre');
    const ctx = document.getElementById('chart-trimestre');
    if (!ctx || !window.STATE) return;

    const { materias, estudiantes, calificaciones } = STATE;
    const c = _getColors();

    // Promedio del grupo por trimestre
    const labels = ['I Trimestre', 'II Trimestre', 'III Trimestre'];
    const data = [1, 2, 3].map(t => {
      let total = 0, cnt = 0;
      for (let mi = 0; mi < materias.length; mi++) {
        for (let ei = 0; ei < estudiantes.length; ei++) {
          const vals = calificaciones?.[t]?.[mi]?.[ei];
          if (!vals) continue;
          const p = UTILS.promedio(vals);
          if (p !== null) { total += p; cnt++; }
        }
      }
      return cnt ? parseFloat((total/cnt).toFixed(2)) : 0;
    });

    _instances.trimestre = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Promedio grupal',
          data,
          borderColor: c.primary,
          backgroundColor: 'rgba(37,99,235,0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: c.primary,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: c.grid }, ticks: { color: c.text } },
          y: { min: 0, max: 5, grid: { color: c.grid }, ticks: { color: c.text,
            callback: v => v.toFixed(1) } }
        }
      }
    });
  }

  /* ================================================================
     GRÁFICA: Distribución de Notas (dona)
  ================================================================ */
  function renderDistribucion() {
    _destroy('distribucion');
    const ctx = document.getElementById('chart-distribucion');
    if (!ctx || !window.STATE) return;

    const { materias, estudiantes, calificaciones } = STATE;
    let A=0, B=0, C=0, D=0;

    for (let t=1;t<=3;t++) for (let mi=0;mi<materias.length;mi++) for (let ei=0;ei<estudiantes.length;ei++) {
      const vals = calificaciones?.[t]?.[mi]?.[ei];
      if (!vals) continue;
      const p = UTILS.promedio(vals);
      if (p === null) continue;
      if (p >= 4.5) A++;
      else if (p >= 3.5) B++;
      else if (p >= 2.5) C++;
      else D++;
    }

    _instances.distribucion = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Excelente (A)', 'Bueno (B)', 'Regular (C)', 'Deficiente (D)'],
        datasets: [{
          data: [A, B, C, D],
          backgroundColor: ['#10b981','#2563eb','#f59e0b','#ef4444'],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        cutout: '65%'
      }
    });
  }

  /* ================================================================
     GRÁFICA: Promedio por Materia (barras horizontales)
  ================================================================ */
  function renderMaterias() {
    _destroy('materias');
    const ctx = document.getElementById('chart-materias');
    if (!ctx || !window.STATE) return;

    const { materias, estudiantes, calificaciones } = STATE;
    const c = _getColors();

    const promedios = materias.map((mat, mi) => {
      let total=0, cnt=0;
      for (let t=1;t<=3;t++) for (let ei=0;ei<estudiantes.length;ei++) {
        const vals = calificaciones?.[t]?.[mi]?.[ei];
        if (!vals) continue;
        const p = UTILS.promedio(vals);
        if (p !== null) { total += p; cnt++; }
      }
      return cnt ? parseFloat((total/cnt).toFixed(2)) : 0;
    });

    const colors = promedios.map(p =>
      p >= 4.5 ? '#10b981' : p >= 3.5 ? '#2563eb' : p >= 2.5 ? '#f59e0b' : '#ef4444'
    );

    _instances.materias = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: materias.map(m => m.length > 14 ? m.substring(0,12)+'…' : m),
        datasets: [{
          label: 'Promedio',
          data: promedios,
          backgroundColor: colors,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { min: 0, max: 5, grid: { color: c.grid }, ticks: { color: c.text } },
          y: { grid: { display: false }, ticks: { color: c.text, font: { size: 11 } } }
        }
      }
    });
  }

  /* ================================================================
     GRÁFICA HONOR: Ranking de promedios (barras)
  ================================================================ */
  function renderHonorRank(ranking) {
    _destroy('honorRank');
    const ctx = document.getElementById('chart-honor-rank');
    if (!ctx) return;
    const c = _getColors();
    const top = ranking.slice(0, 10);

    _instances.honorRank = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: top.map(e => {
          const parts = e.nombre.split(' ');
          return parts.length > 1 ? parts[0] + ' ' + parts[parts.length-1][0] + '.' : parts[0];
        }),
        datasets: [{
          label: 'Promedio General',
          data: top.map(e => parseFloat(e.prom)),
          backgroundColor: top.map((e,i) => {
            const v = parseFloat(e.prom);
            return v >= 4.5 ? '#10b981' : v >= 3.5 ? '#2563eb' : v >= 2.5 ? '#f59e0b' : '#ef4444';
          }),
          borderRadius: 6, borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: c.text, font: { size: 11 } } },
          y: { min: 0, max: 5, grid: { color: c.grid }, ticks: { color: c.text } }
        }
      }
    });
  }

  /* ================================================================
     GRÁFICA HONOR: Comparativa trimestral (líneas multi-estudiante)
  ================================================================ */
  function renderHonorTri(ranking) {
    _destroy('honorTri');
    const ctx = document.getElementById('chart-honor-tri');
    if (!ctx || !window.STATE) return;
    const c = _getColors();
    const top5 = ranking.slice(0, 5);

    const datasets = top5.map((est, i) => {
      const data = [1,2,3].map(t => {
        let total=0, cnt=0;
        for (let mi=0; mi<STATE.materias.length; mi++) {
          const vals = STATE.calificaciones?.[t]?.[mi]?.[est.idx];
          if (!vals) continue;
          const p = UTILS.promedio(vals);
          if (p !== null) { total+=p; cnt++; }
        }
        return cnt ? parseFloat((total/cnt).toFixed(2)) : null;
      });
      const parts = est.nombre.split(' ');
      const label = parts.length>1 ? parts[0] + ' ' + parts[parts.length-1][0]+'.' : parts[0];
      return {
        label, data,
        borderColor: c.palette[i],
        backgroundColor: c.palette[i] + '20',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        borderWidth: 2.5
      };
    });

    _instances.honorTri = new Chart(ctx, {
      type: 'line',
      data: { labels: ['I Trim', 'II Trim', 'III Trim'], datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
        scales: {
          x: { grid: { color: c.grid }, ticks: { color: c.text } },
          y: { min: 0, max: 5, grid: { color: c.grid }, ticks: { color: c.text } }
        }
      }
    });
  }

  /* ================================================================
     INIT — Renderizar todas las gráficas del dashboard
  ================================================================ */
  function renderAll() {
    _applyDefaults();
    renderTrimestre();
    renderDistribucion();
    renderMaterias();
  }

  return { renderAll, renderTrimestre, renderDistribucion, renderMaterias, renderHonorRank, renderHonorTri, updateTheme };
})();
