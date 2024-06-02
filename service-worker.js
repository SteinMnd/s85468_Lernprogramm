// Der Name des Caches, der verwendet wird, um Ressourcen zu speichern.
const CACHE_NAME = 'pwa-cache-v1';

// Eine Liste der URLs, die in den Cache aufgenommen werden sollen.
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/icon-512x512.png',
  '/icon-192x192.png',
  '/teil-allgemein.json',
  '/teil-internettechnologien.json',
  '/teil-mathe.json',
  '/Headeri.jpg'
];

// Event-Listener für das 'install'-Ereignis des Service Workers.
// Dieses Ereignis wird ausgelöst, wenn der Service Worker installiert wird.
self.addEventListener('install', event => {
  event.waitUntil(
    // Öffnet den definierten Cache.
    caches.open(CACHE_NAME)
      .then(cache => {
        // Fügt alle URLs aus der Liste dem Cache hinzu.
        return cache.addAll(urlsToCache);
      })
  );
});

// Event-Listener für das 'fetch'-Ereignis des Service Workers.
// Dieses Ereignis wird ausgelöst, wenn eine Netzwerk-Anfrage gemacht wird.
self.addEventListener('fetch', event => {
  event.respondWith(
    // Überprüft, ob die angeforderte Datei im Cache vorhanden ist.
    caches.match(event.request)
      .then(response => {
        // Wenn die Datei im Cache gefunden wird, wird sie zurückgegeben.
        if (response) {
          return response;
        }
        // Wenn die Datei nicht im Cache gefunden wird, wird die Anfrage an das Netzwerk weitergeleitet.
        return fetch(event.request);
      })
  );
});

// Event-Listener für das 'activate'-Ereignis des Service Workers.
// Dieses Ereignis wird ausgelöst, wenn der Service Worker aktiviert wird.
self.addEventListener('activate', event => {
  // Definiert eine Whitelist mit Cache-Namen, die beibehalten werden sollen.
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    // Gibt ein Promise zurück, das ein Array aller Cache-Namen enthält.
    caches.keys().then(cacheNames => {
      return Promise.all(
        // Iteriert über alle Cache-Namen.
        cacheNames.map(cacheName => {
          // Löscht alle Caches, deren Namen nicht in der Whitelist enthalten sind.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
