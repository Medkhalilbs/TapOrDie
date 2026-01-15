const CACHE_NAME = 'tap-or-die-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './audio.js',
    './game.js',
    './manifest.json',
    './assets/icon.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
