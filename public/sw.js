/**
 * imgpress service worker — stale-while-revalidate for same-origin GETs.
 *
 * Goal: support "offline operation" claim from the landing page. On first
 * load, requests are cached; on subsequent loads, the cache responds
 * immediately while the network refreshes silently. If the network fails,
 * the cached version still works — including the libheif WASM chunk after
 * a user has dropped a HEIC file at least once online.
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `imgpress-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  // Activate immediately on first install so users get offline support
  // without having to refresh.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Drop old cache versions.
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Only same-origin assets — never cache analytics beacons or external CDNs.
  if (url.origin !== self.location.origin) return;
  // Never cache the SW itself; the browser handles that.
  if (url.pathname === '/sw.js') return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);

      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      if (cached) {
        // Stale-while-revalidate: serve cache, refresh in background.
        networkFetch.catch(() => {});
        return cached;
      }

      const fresh = await networkFetch;
      if (fresh) return fresh;

      // Network failed and nothing cached — try the index as a last resort
      // for navigation requests so the SPA shell still loads.
      if (req.mode === 'navigate') {
        const shell = await cache.match('/');
        if (shell) return shell;
      }
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    })(),
  );
});
