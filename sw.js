/* 90 дней — service worker: офлайн-режим для иконки на домашнем экране */
var CACHE = 'ch90-shell-v13';
var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './fonts.css',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './fonts/Oswald-400-cyrillic-ext.woff2',
  './fonts/Oswald-400-cyrillic.woff2',
  './fonts/Oswald-400-latin-ext.woff2',
  './fonts/Oswald-400-latin.woff2',
  './fonts/Oswald-500-cyrillic-ext.woff2',
  './fonts/Oswald-500-cyrillic.woff2',
  './fonts/Oswald-500-latin-ext.woff2',
  './fonts/Oswald-500-latin.woff2',
  './fonts/RussoOne-400-cyrillic.woff2',
  './fonts/RussoOne-400-latin-ext.woff2',
  './fonts/RussoOne-400-latin.woff2'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return k === CACHE ? null : caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;
  /* API синхронизации — всегда через сеть, прогресс не кэшируем */
  if (url.pathname.indexOf('/api/') === 0) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then(function (r) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
        return r;
      }).catch(function () {
        return caches.match('./index.html');
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (r) {
        if (r && r.ok) {
          var copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return r;
      });
    })
  );
});
