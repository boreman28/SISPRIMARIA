/* ================================================================
   sw.js — Service Worker para Modo Offline Completo
   Sistema Escolar 2026
   ================================================================ */

const CACHE_NAME    = 'sistema-escolar-v3';
const CACHE_OFFLINE = 'sistema-escolar-offline-v3';

/* Recursos a cachear inmediatamente al instalar */
const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './print.css',
  './app.js',
  './utils.js',
  './storage.js',
  './auth.js',
  './ui.js',
  './charts.js',
  './dashboard.js',
  './excel.js',
  './idb.js',
];

/* CDN externos — cachear en primer uso */
const CDN_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
];

/* ==================== INSTALL ==================== */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-cacheando recursos locales...');
        return cache.addAll(PRECACHE);
      })
      .then(() => {
        console.log('[SW] Instalación completa. Tomando control inmediato.');
        return self.skipWaiting();
      })
      .catch(err => console.error('[SW] Error en pre-caché:', err))
  );
});

/* ==================== ACTIVATE ==================== */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== CACHE_OFFLINE)
          .map(k => {
            console.log('[SW] Eliminando caché antigua:', k);
            return caches.delete(k);
          })
      )
    ).then(() => {
      console.log('[SW] Activado. Controlando todas las pestañas.');
      return self.clients.claim();
    })
  );
});

/* ==================== FETCH STRATEGY ==================== */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones no GET y extensiones de Chrome
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Estrategia según tipo de recurso
  if (isCDN(url)) {
    event.respondWith(cacheFirst(request));
  } else if (isLocal(url)) {
    event.respondWith(networkFirst(request));
  }
  // Otras peticiones: pasar directamente (no interceptar)
});

/* ==================== ESTRATEGIAS ==================== */

/** Cache First: ideal para CDN (inmutable) */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('/* offline */', { headers: { 'Content-Type': 'text/javascript' } });
  }
}

/** Network First: ideal para app local (siempre fresco, offline fallback) */
async function networkFirst(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Último recurso: devolver index.html (SPA fallback)
    return caches.match('./index.html');
  }
}

/* ==================== HELPERS ==================== */
function isCDN(url) {
  return url.hostname.includes('cloudflare') ||
         url.hostname.includes('jsdelivr')   ||
         url.hostname.includes('fonts.googleapis');
}

function isLocal(url) {
  return url.hostname === 'localhost' ||
         url.hostname === '127.0.0.1' ||
         url.protocol === 'file:';
}

/* ==================== MENSAJES DEL CLIENTE ==================== */
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION')  event.ports[0].postMessage({ version: CACHE_NAME });
});
