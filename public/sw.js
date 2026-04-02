/// <reference lib="webworker" />

/**
 * Complete Care — Service Worker
 *
 * Caching strategy:
 *   - App shell & static assets: Cache-first (install-time precache + runtime cache).
 *   - API / dynamic data: Network-first with cache fallback.
 *   - Offline form submissions: Queued in IndexedDB via Background Sync.
 *   - Push notifications: Displayed with action buttons.
 */

const CACHE_NAME = 'complete-care-v1';
const STATIC_CACHE = 'complete-care-static-v1';
const DATA_CACHE = 'complete-care-data-v1';

/** App-shell URLs to precache at install time. */
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/offline',
];

/* ---------- Install ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

/* ---------- Activate ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DATA_CACHE && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ---------- Fetch ---------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (they go through Background Sync instead)
  if (request.method !== 'GET') return;

  // API requests: network-first with data cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DATA_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets & app shell: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Cache successful responses for static assets
        if (
          response.ok &&
          (url.pathname.match(/\.(js|css|png|jpg|svg|woff2?)$/) ||
            url.pathname === '/')
        ) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    }).catch(() =>
      // Final fallback — offline page
      caches.match('/offline')
    )
  );
});

/* ---------- Background Sync — offline form submissions ---------- */
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-form-sync') {
    event.waitUntil(replayOfflineForms());
  }
});

async function replayOfflineForms() {
  // Open IndexedDB and replay queued submissions
  const db = await openOfflineDB();
  const tx = db.transaction('offline-forms', 'readwrite');
  const store = tx.objectStore('offline-forms');
  const requests = await idbGetAll(store);

  for (const entry of requests) {
    try {
      const response = await fetch(entry.url, {
        method: entry.method,
        headers: entry.headers,
        body: entry.body,
      });
      if (response.ok) {
        const deleteTx = db.transaction('offline-forms', 'readwrite');
        deleteTx.objectStore('offline-forms').delete(entry.id);
      }
    } catch {
      // Will retry on next sync
    }
  }
}

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('complete-care-offline', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('offline-forms')) {
        db.createObjectStore('offline-forms', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/* ---------- Push Notifications ---------- */
self.addEventListener('push', (event) => {
  const defaultData = {
    title: 'Complete Care',
    body: 'You have a new notification.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: 'default',
  };

  let data = defaultData;
  try {
    if (event.data) {
      data = { ...defaultData, ...event.data.json() };
    }
  } catch {
    // Use defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.url ? { url: data.url } : undefined,
      actions: data.actions || [],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Focus existing window or open new one
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
