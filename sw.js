// sw.js — cache-first app shell.
// First online visit caches every core file; after that the app loads
// straight from cache, so it keeps working with wifi/data off. This is
// the piece that turns "offline-first" from a slide claim into a thing
// you can demo live by toggling airplane mode.

const CACHE_NAME = "smriti-poc-v4";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/app.js",
  "./js/voice.js",
  "./js/profile.js",
  "./js/game.js",
  "./js/tasks.js",
  "./js/reminders.js",
  "./js/memories.js",
  "./js/caregiver.js",
  "./icons/logo.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const results = await Promise.allSettled(
        ASSETS.map((url) => cache.add(url))
      );
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.warn("[sw] failed to cache:", ASSETS[i], r.reason);
        }
      });
      const okCount = results.filter((r) => r.status === "fulfilled").length;
      console.log(`[sw] cached ${okCount}/${ASSETS.length} assets`);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow("./index.html");
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // Cache same-origin GET requests as they come in.
          if (event.request.method === "GET" && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
