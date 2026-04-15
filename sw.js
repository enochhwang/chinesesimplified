var CACHE_NAME = 'Chinese-Simplified-cache-v2';

// include all the files for offline access
const CACHE_FILES = [
  'index.html', 'manifest.json', 'styles.css', 'app.js', 'file_lists.js',
  'https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.css',
  'https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.js',
  
  'icons/icon-16.png',
  'icons/icon-32.png',
  'icons/icon-192.png',
  "icons/icon-512.png",
  'icons/ic_bookmark.png',
  'icons/ic_drag.png',
  'icons/ic_edit.png',
  'icons/ic_number.png',
  'icons/ic_pause.png',
  'icons/ic_play.png',
  'icons/ic_search.png',
  'icons/ic_settings.png',
  'icons/ic_stop.png',
  'icons/ic_title.png',
  'icons/ic_trash.png',
  
  'songsheets/about.png',
];
  

// Install the Service Worker
/*
// original
self.addEventListener("install", (event) => {
  // Tell the browser not to finish the install until this promise resolves
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      // this might still load files from the browser's cache instead of from server
      await cache.addAll(CACHE_FILES);
      
      // if don't want to use the new SW immediately then don't do the skipWaiting here but in the addEventListener('message'
      // self.skipWaiting(); // forces the waiting service worker (i.e. with the new updates) to become the active one immediately
    } catch (error) {
      console.error("Service Worker installation failed:", error);
    }
  })());
});
*/

self.addEventListener("install", (event) => {
  console.log("SW: Install started");
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      
      // Manual fetch with 'cache: reload' to bypass HTTP cache
      const cachePromises = CACHE_FILES.map(async (url) => {
        try {
          // fetch(url, { cache: 'reload' }) forces the browser to go to the server
          const response = await fetch(new Request(url, { cache: 'reload' }));
          if (!response.ok) throw new Error(`Network response was not ok for ${url}`);
          return await cache.put(url, response);
        } catch (err) {
          console.error(`Failed to fetch and cache ${url}:`, err);
        }
      });

      await Promise.all(cachePromises);
      console.log("SW: All files cached fresh from server");

    } catch (error) {
      console.error("Service Worker installation failed:", error);
    }
  })());
});

// this is executed when the 'update' message is sent by user clicking on an update button
self.addEventListener('message', function (event) {
  console.log("SW 5:User acknowledged new updates");
  if (event.data.action === 'update') {
    self.skipWaiting(); // forces the waiting service worker (i.e. with the new updates) to become the active one immediately
  }
});

// delete old cache after updating files
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log("SW 7:Deleting old cache", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Claim clients AFTER the old cache is purged
      console.log("SW 8:Claiming clients after old cache is purged");
      return self.clients.claim();
    })
  );
});

// Fetch resources from cache first then from server if not in cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const url = new URL(event.request.url);
      //const fileName = decodeURI(url.pathname.split('/').pop()) || 'index.html';  // this is only needed for debugging

      try {
        //console.log(`%cSW Fetching: ${fileName}`, "color: gray;");

        // 1. Try a Strict Match first
        let cachedResponse = await cache.match(event.request);

        // 2. If no strict match, try matching by URL String ignoring search params
        // This is crucial for audio and the ?refetch= logic
        if (!cachedResponse) {
          cachedResponse = await cache.match(event.request.url, { 
            ignoreSearch: true,
            ignoreVary: true 
          });
          if (cachedResponse) {
             //console.log(`%c[Cache Hit] ${fileName} (via URL String match)`, "color: green; font-weight: bold;");
          }
        } else {
          //console.log(`%c[Cache Hit] ${fileName} (via Request match)`, "color: green; font-weight: bold;");
        }

        if (cachedResponse) return cachedResponse;

        // 3. Not in cache so do a Network Fetch
        //console.log(`%c[Network Request] ${fileName}`, "color: orange;");
        const fetchResponse = await fetch(event.request);

        // 4. Handle Partial Content (206) for Audio Stream (url has mp3)
        if (fetchResponse.status === 206 && event.request.url.match(/\.(mp3|wav|m4a)$/i)) {
          const cleanUrl = event.request.url.split('?')[0]; // Strip timestamps for saving
          // fetch the full audio file
          return fetch(cleanUrl).then(fullResponse => {
            if (fullResponse.ok) {
              cache.put(cleanUrl, fullResponse.clone()); // Save the full version
              return fullResponse;      // Play the full version
            }
            return fetchResponse; // Fallback to original if full fetch fails
          });
          
        }

        // 5. Regular files (Status 200)
        if (fetchResponse.ok) {
          const cleanUrl = event.request.url.split('?')[0];
          await cache.put(cleanUrl, fetchResponse.clone());
          //console.log(`%c[Saved to Cache] ${fileName}`, "color: #28a745;");
        }
        
        return fetchResponse;

      } catch (error) {
        // If offline and not in cache, fallback
        //console.log(`%c[Offline Error] ${fileName}`, "color: red;");
        if (event.request.mode === 'navigate') {  // Check if the request is for a web page (navigation)
          const fallback = await cache.match("index.html");
          return fallback || new Response("Offline", { status: 503 });
        }
        // It's an image or audio that failed offline, just return a 404.
        return new Response(null, { status: 404, statusText: "Offline" });
      }
    })()
  );
});