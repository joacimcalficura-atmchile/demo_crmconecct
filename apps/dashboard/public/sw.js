// ATM Agent Premium — Service Worker
// Estrategia: Network Only (Bypass total para evitar conflictos con HMR)
// Mantiene instalabilidad PWA sin interferir con el dev server.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Borrar cualquier caché antigua que cause problemas
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ─── BYPASS TOTAL: No interceptar NADA en desarrollo (localhost) ───
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return; // Deja que el navegador maneje la petición de forma nativa
  }

  // ─── BYPASS: Rutas internas de Next.js (HMR, chunks, webpack) ───
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.includes('webpack-hmr') ||
    url.pathname.includes('__nextjs') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/atm-core/') ||
    event.request.method !== 'GET' ||
    event.request.headers.get('upgrade') === 'websocket'
  ) {
    return; // Passthrough nativo sin intervención del SW
  }

  // En producción: network-first sin caché (dashboard privado)
  event.respondWith(
    fetch(event.request).catch(() => {
      // Si falla la red, no hacer nada (no hay fallback offline)
      return new Response('Offline', { status: 503 });
    })
  );
});
