const CACHE_NAME = "ayaz-pokedex-v1";
const SHELL_FILES = [
  "index.html",
  "mypokemon.html",
  "teams.html",
  "battle.html",
  "quiz.html",
  "alldex.html",
  "card.html",
  "adventure.html",
  "adventure-hq.html",
  "wild-battle.html",
  "pokemart.html",
  "gym-battle.html",
  "league-battle.html",
  "pokedex-data.js",
  "adventure-state.js",
  "region-data.js",
  "battle-engine.js",
  "item-data.js",
  "starter-data.js",
  "evolution-data.js",
  "gym-data.js",
  "league-data.js",
  "quest-data.js",
  "adventure-achievement-data.js",
  "adventure-events.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "header-charizard.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Network-first for everything (so Firestore data and live pages always stay fresh);
// falls back to the cached app shell only when offline.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
