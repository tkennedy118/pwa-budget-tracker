const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/assets/css/styles.css",
  "/assets/js/index.js",
  "/assets/js/indexedDb.js",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/assets/images/icons/icon-192x192.png",
  "/assets/images/icons/icon-512x512.png",
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// Install and register service worker. The self read-only property of the WorkerGlobalScope 
// interface returns a reference to the WorkerGlobalScope itself.
self.addEventListener("install", function(evt) {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  // Foreces the waiting service worker to become the active service worker.
  self.skipWaiting();
});


// Activate the service worker and remove old data from the cache.
self.addEventListener("activate", function(evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  // The claim() method of the Clients interface allows an active service worker to set itself
  // as the controller for all clients wihting its scope.
  self.clients.claim();
});

// Enable the service worker to intercept network requests that use fetch.
self.addEventListener("fetch", function(evt) {
  // If the request is for the API, cache successful requests to the API.
  if (evt.request.url.includes("/api/")) {
    console.log('[Service Worker] Fetch (data)', evt.request.url);

    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(evt.request);
          });
      }).catch(err => console.log(err))
    );

    return;
  }

  // If the request is not for the API, serve static assets using "offline-first" approach. But 
  // proceed with a network request when the resource is not in the cache. This code allows the 
  // page to be accessible offline. 
  evt.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(evt.request).then(response => {
        return response || fetch(evt.request);
      });
    })
  );
});
