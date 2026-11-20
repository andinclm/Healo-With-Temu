// Service worker: keeps HEALO's pages available offline. The AI chat (/api/) always goes to the network.
const CACHE = 'healo-v4';
const FILES = [
  './', 'index.html', 'edukasi.html', 'skrining.html', 'temu.html', 'bantuan.html',
  'assets/style.css', 'assets/common.js', 'assets/screening.js', 'assets/chat.js',
  'img/temu-wink.webp', 'img/temu-jump.webp', 'img/temu-sit.webp', 'img/temu-stand.webp', 'img/temu-walk.webp',
  'img/logo-sman1.png', 'img/logo-sman3.png', 'img/logo-dinkes.png', 'img/logo-puskesmas.png',
  'img/icon-192.png', 'img/icon-512.png', 'manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  // Network first, so updates show up; fall back to the cache when offline.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
