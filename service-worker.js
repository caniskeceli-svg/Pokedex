// v3: caching the app shell here has caused three separate real incidents
// (a stale UI position, and twice now a stuck iPad PWA still running
// broken JS minutes/hours after the fix was already live) - the app needs
// a live connection anyway (Firestore + PokeAPI), so there was never a
// meaningful offline mode to protect. This version stops caching app files
// entirely and purges every previously cached version on activate, so a
// device that was stuck on old code updates the moment this file itself
// is next fetched.
const CACHE_NAME = "ayaz-pokedex-v3-nocache";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

// Pure passthrough - always hits the network, never reads or writes any
// cache. Kept registered only because some platforms (iOS "Add to Home
// Screen") expect an active service worker for PWA install/standalone mode.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});
