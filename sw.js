// CyberDesacratio — Service Worker (тихий режим)
const CACHE = 'cyberdesacratio-v2';

// При установке — только critical, без массового кеширования
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// При активации — чистим старые кеши
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
            );
        })
    );
    self.clients.claim();
});

// Стратегия: Cache First для статики, Network First для остального
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Только наш origin
    if (url.origin !== location.origin) return;

    // Для статики — Cache First
    if (
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'font' ||
        request.destination === 'image' ||
        url.pathname === '/' ||
        url.pathname === '/index.html'
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                return cached || fetch(request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE).then((cache) => cache.put(request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // Для остального — Network First с fallback
    event.respondWith(
        fetch(request)
            .then((response) => {
                const clone = response.clone();
                caches.open(CACHE).then((cache) => cache.put(request, clone));
                return response;
            })
            .catch(() => caches.match(request))
    );
});
