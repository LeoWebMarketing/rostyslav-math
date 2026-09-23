// Kill-switch service worker: unregisters old SW and clears all caches
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Delete ALL caches
      caches.keys().then(cacheNames =>
        Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
      ),
      // Claim all clients
      self.clients.claim(),
    ]).then(() => {
      // Unregister this SW and reload all clients
      return self.registration.unregister().then(() => {
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => client.navigate(client.url));
        });
      });
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(new Response('', { status: 503 }));
});
