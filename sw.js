const CACHE_NAME = 'financeflow-v1';
const CACHE_STATIC = 'financeflow-static-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/index.php',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/assets/js/dashboard.js',
  '/assets/js/financeiro.js',
  '/assets/js/agenda.js',
  '/assets/js/notas.js',
  '/assets/js/relatorios.js',
  '/assets/icons/icon.svg',
  '/manifest.json'
];

// ===== INSTALL =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Fail silently — some assets may not be available offline
      });
    }).then(() => self.skipWaiting())
  );
});

// ===== ACTIVATE =====
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ===== FETCH =====
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: Network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached =>
            cached || new Response(
              JSON.stringify({ error: 'Sem conexão. Dados offline podem estar desatualizados.' }),
              { headers: { 'Content-Type': 'application/json' }, status: 503 }
            )
          )
        )
    );
    return;
  }

  // External CDN (Chart.js): Network-first with cache fallback
  if (url.hostname !== self.location.hostname) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: Cache-first, update in background
  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_STATIC).then(cache => cache.put(request, clone));
        }
        return response;
      });
      return cached || fetchPromise;
    })
  );
});

// ===== BACKGROUND SYNC (optional) =====
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
