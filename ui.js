/* ================================================================
   ui.js — Componentes de Interfaz: Toast, Modal, Sidebar, Tema
   ================================================================ */

const UI = (() => {
  let _sidebarCollapsed = false;
  let _mobileSidebarOpen = false;

  /* ==================== TOAST ==================== */
  function toast(msg, type = 'success', duration = 3200) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success:'fa-circle-check', error:'fa-circle-xmark', info:'fa-circle-info', warning:'fa-triangle-exclamation' };
    const icon  = icons[type] || icons.info;

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <i class="fa-solid ${icon} toast-icon"></i>
      <span style="flex:1">${UTILS.escHtml(msg)}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()"><i class="fa-solid fa-xmark"></i></button>`;
    container.appendChild(el);

    setTimeout(() => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  /* ==================== MODAL ==================== */
  function openModal({ title, body, footer, icon = '', iconBg = '#dbeafe', iconColor = '#2563eb', size = '' }) {
    const backdrop = document.getElementById('modal-backdrop');
    const modal    = document.getElementById('modal');
    const iconEl   = document.getElementById('modal-icon');
    const titleEl  = document.getElementById('modal-title');
    const bodyEl   = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');

    iconEl.style.background = iconBg;
    iconEl.style.color      = iconColor;
    iconEl.innerHTML = icon;
    titleEl.textContent = title;
    bodyEl.innerHTML    = body;
    footerEl.innerHTML  = footer || '';

    modal.className = 'modal' + (size ? ' ' + size : '');
    backdrop.style.display = 'flex';
  }

  function closeModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const modal    = document.getElementById('modal');
    modal.classList.add('closing');
    backdrop.classList.add('closing');
    setTimeout(() => {
      backdrop.style.display = 'none';
      modal.classList.remove('closing');
      backdrop.classList.remove('closing');
    }, 220);
  }

  function closeModalBackdrop(e) {
    if (e.target.id === 'modal-backdrop') closeModal();
  }

  /* ---------- Confirm Dialog ---------- */
  function confirm(title, message, onConfirm, variant = 'primary') {
    const btnCls = variant === 'danger' ? 'btn-danger' : 'btn-primary';
    const iconCls = variant === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-question';
    const iconBg  = variant === 'danger' ? '#fee2e2' : '#dbeafe';
    const iconCl  = variant === 'danger' ? '#ef4444' : '#2563eb';

    openModal({
      title,
      icon: `<i class="fa-solid ${iconCls}"></i>`,
      iconBg, iconColor: iconCl,
      body: `<p style="color:var(--text-sec);font-size:14px;line-height:1.6">${message}</p>`,
      footer: `
        <button class="btn btn-outline" onclick="UI.closeModal()">Cancelar</button>
        <button class="btn ${btnCls}" id="confirm-ok-btn">Confirmar</button>`
    });

    setTimeout(() => {
      document.getElementById('confirm-ok-btn')?.addEventListener('click', () => {
        closeModal();
        onConfirm?.();
      });
    }, 50);
  }

  /* ==================== SIDEBAR ==================== */
  function toggleSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const main     = document.getElementById('main-content');
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      _mobileSidebarOpen = !_mobileSidebarOpen;
      sidebar.classList.toggle('mobile-open', _mobileSidebarOpen);
      document.getElementById('sidebar-overlay').classList.toggle('visible', _mobileSidebarOpen);
    } else {
      _sidebarCollapsed = !_sidebarCollapsed;
      sidebar.classList.toggle('collapsed', _sidebarCollapsed);
      main.classList.toggle('expanded', _sidebarCollapsed);
    }
  }

  function closeSidebar() {
    _mobileSidebarOpen = false;
    document.getElementById('sidebar').classList.remove('mobile-open');
    document.getElementById('sidebar-overlay').classList.remove('visible');
  }

  /* ==================== THEME ==================== */
  function toggleTheme() {
    const html   = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const theme  = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', theme);
    document.getElementById('theme-btn').innerHTML =
      isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    if (window.STATE) STATE.ui.theme = theme;
    STORAGE.marcar();
    CHARTS.updateTheme();
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme || 'light');
    const isDark = theme === 'dark';
    const btn = document.getElementById('theme-btn');
    if (btn) btn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  }

  /* ==================== LOADER ==================== */
  function hideLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    loader.classList.add('fade-out');
    setTimeout(() => loader.remove(), 400);
  }

  /* ==================== BREADCRUMB ==================== */
  function setBreadcrumb(label) {
    const el = document.getElementById('breadcrumb-label');
    if (el) el.textContent = label;
  }

  /* ==================== USER INFO IN SIDEBAR ==================== */
  function updateUserInfo() {
    const cfg = window.STATE?.config || {};
    const docente = cfg.docente || 'Docente';
    const grado   = cfg.grado   || '—';
    const jornada = cfg.jornada || '';

    document.getElementById('user-name').textContent = docente;
    document.getElementById('user-role').textContent = `${grado} · ${jornada}`;
    document.getElementById('user-avatar').textContent = UTILS.iniciales(docente) || 'D';
    document.getElementById('dash-subtitle').textContent =
      `${docente} · ${grado} · Año ${cfg.anio || 2026}`;
  }

  return {
    toast, openModal, closeModal, closeModalBackdrop, confirm,
    toggleSidebar, closeSidebar, toggleTheme, applyTheme,
    hideLoader, setBreadcrumb, updateUserInfo
  };
})();
