const cacheName = 'community-butler-v15';
const prefix = 'community-butler-';
const localFiles = [
  './', './index.html', './style.css', './app.js', './manifest.json',
  './assets/lucide.min.js', './assets/icon-180.png', './assets/icon-192.png', './assets/icon-512.png',
  './assets/estate-hero.jpg', './assets/strawberries.jpg', './assets/tomatoes.jpg',
  './assets/greens.jpg', './assets/bread.jpg',
  './assets/pickup-qr.png', './assets/faucet-evidence.jpg', './assets/berry-damage.jpg', './assets/shrimp.jpg', './assets/cherries.jpg', './assets/fish.jpg',
  './assets/eggs.jpg', './assets/pumpkin.jpg', './assets/sorting.jpg', './assets/dandong-cut.jpg',
  './assets/dandong-scale.jpg', './assets/chile-cut.jpg', './assets/chile-scale.jpg',
  './assets/tiger-cut.jpg', './assets/tiger-scale.jpg', './assets/hairtail-cut.jpg',
  './assets/hairtail-scale.jpg', './assets/eggs-cut.jpg', './assets/eggs-scale.jpg',
  './assets/pumpkin-cut.jpg', './assets/pumpkin-scale.jpg',
  './assets/gift-blender.jpg', './assets/gift-kettle.jpg', './assets/gift-cooker.jpg', './assets/gift-fan.jpg',
  './assets/gift-tiles.jpg', './assets/gift-board.jpg', './assets/gift-trucks.jpg', './assets/gift-books.jpg',
  './assets/gift-voucher.jpg', './assets/gift-cloths.jpg', './assets/gift-fruit-sample.jpg',
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
