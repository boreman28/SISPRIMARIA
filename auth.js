/* ================================================================
   auth.js — Autenticación y Gestión de Sesión
   ================================================================ */

const AUTH = (() => {
  const PASS_KEY    = 'sistemaEscolar_pass_v3';
  const SESSION_KEY = 'sistemaEscolar_session';
  const SESSION_TTL = 4 * 60 * 60 * 1000; // 4 horas
  let   _lockTimer  = null;

  /* ---------- HASH SIMPLE (no criptográfico pero mejor que nada) ---------- */
  function _hashPass(pass) {
    let h = 0x811c9dc5;
    for (let i = 0; i < pass.length; i++) {
      h ^= pass.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8,'0') + '_se26';
  }

  /* ---------- OBTENER CONTRASEÑA ---------- */
  function _getHash() {
    return localStorage.getItem(PASS_KEY) || _hashPass('2026');
  }

  /* ---------- LOGIN ---------- */
  function login() {
    const input = document.getElementById('pass-input');
    const err   = document.getElementById('login-error');
    const pass  = input?.value || '';

    if (_hashPass(pass) === _getHash()) {
      // Guardar sesión con TTL
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        loggedAt: Date.now(),
        expires:  Date.now() + SESSION_TTL
      }));
      _showApp();
    } else {
      err.style.display = 'block';
      input.value = '';
      input.focus();
      const card = document.getElementById('login-card');
      card.style.animation = 'none';
      requestAnimationFrame(() => { card.style.animation = 'shake 0.4s ease'; });
    }
  }

  /* ---------- VERIFICAR SESIÓN ---------- */
  function checkSession() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      if (s && Date.now() < s.expires) { _showApp(); return true; }
    } catch {}
    return false;
  }

  /* ---------- MOSTRAR APP ---------- */
  function _showApp() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('app').style.display           = 'flex';
    _resetLockTimer();
    APP?.init?.();
  }

  /* ---------- BLOQUEAR ---------- */
  function lock() {
    sessionStorage.removeItem(SESSION_KEY);
    clearTimeout(_lockTimer);
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('app').style.display           = 'none';
    const input = document.getElementById('pass-input');
    if (input) { input.value = ''; input.focus(); }
    document.getElementById('login-error').style.display   = 'none';
    UI?.toast?.('Sesión bloqueada', 'info');
  }

  /* ---------- BLOQUEO AUTOMÁTICO POR INACTIVIDAD (20 min) ---------- */
  function _resetLockTimer() {
    clearTimeout(_lockTimer);
    _lockTimer = setTimeout(lock, 20 * 60 * 1000);
  }
  ['mousemove','keydown','click','touchstart'].forEach(e => {
    document.addEventListener(e, UTILS.debounce(_resetLockTimer, 5000), { passive: true });
  });

  /* ---------- CAMBIAR CONTRASEÑA ---------- */
  function cambiarPassword() {
    const newPass = document.getElementById('new-pass')?.value;
    if (!newPass || newPass.length < 4) {
      UI.toast('La contraseña debe tener al menos 4 caracteres', 'warning');
      return;
    }
    UI.confirm(
      'Cambiar Contraseña',
      '¿Está seguro de actualizar la contraseña maestra?',
      () => {
        localStorage.setItem(PASS_KEY, _hashPass(newPass));
        document.getElementById('new-pass').value = '';
        UI.toast('¡Contraseña actualizada correctamente!', 'success');
      }
    );
  }

  /* ---------- ENTER EN LOGIN ---------- */
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('login-overlay').style.display !== 'none') {
      login();
    }
  });

  return { login, lock, checkSession, cambiarPassword };
})();
