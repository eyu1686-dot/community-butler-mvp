const cacheName = 'community-butler-v6';
const prefix = 'community-butler-';
const localFiles = [
  './', './index.html', './style.css', './app.js', './manifest.json',
  './assets/icon-180.png', './assets/icon-192.png', './assets/icon-512.png',
  './assets/market.jpg', './assets/strawberries.jpg', './assets/tomatoes.jpg',
  './assets/greens.jpg', './assets/bread.jpg',
  './assets/pickup-qr.png', './assets/berry-damage.jpg', './assets/sorting.jpg', './assets/shrimp.jpg', './assets/cherries.jpg', './assets/fish.jpg',
];
const urls = new Set(localFiles.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(localFiles)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(prefix) && key !== cacheName).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate' && event.request.url.startsWith(self.registration.scope)) {
    event.respondWith(fetch(event.request).catch(() => caches.match('./')));
  } else if (urls.has(event.request.url)) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
  }
});
