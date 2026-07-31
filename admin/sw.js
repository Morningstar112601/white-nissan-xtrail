// Service Worker for Jericho Admin PWA
const CACHE_NAME = 'jericho-admin-v2';
const urlsToCache = [
  './',
  './index.html',
  './css/admin.css',
  './js/admin.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  '../assets/css/styles.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }).catch(err => console.log('Cache install error:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
