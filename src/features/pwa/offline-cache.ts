/**
 * Offline data caching utilities using IndexedDB.
 *
 * Caches key data for offline access:
 * - Active persons list
 * - Current care plans
 * - Medication schedules
 *
 * Also provides offline form submission queuing for Background Sync.
 */

const DB_NAME = 'complete-care-offline';
const DB_VERSION = 1;
const DATA_STORE = 'offline-data';
const FORMS_STORE = 'offline-forms';

/** Cache keys for different data types. */
export const CacheKeys = {
  PERSONS_LIST: 'persons-list',
  CARE_PLANS: 'care-plans',
  MEDICATION_SCHEDULES: 'medication-schedules',
} as const;

export type CacheKey = (typeof CacheKeys)[keyof typeof CacheKeys];

interface CachedData<T = unknown> {
  key: string;
  data: T;
  cachedAt: number;
  expiresAt: number;
}

interface QueuedForm {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  queuedAt: number;
}

/** Open the IndexedDB database. */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DATA_STORE)) {
        db.createObjectStore(DATA_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(FORMS_STORE)) {
        db.createObjectStore(FORMS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cache data for offline access.
 * @param key - Cache key identifying the data type
 * @param data - The data to cache
 * @param ttlMs - Time-to-live in milliseconds (default: 1 hour)
 */
export async function cacheData<T>(
  key: CacheKey,
  data: T,
  ttlMs: number = 60 * 60 * 1000,
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(DATA_STORE, 'readwrite');
  const store = tx.objectStore(DATA_STORE);

  const entry: CachedData<T> = {
    key,
    data,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };

  return new Promise((resolve, reject) => {
    const request = store.put(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve cached data.
 * Returns null if the data is expired or not found.
 */
export async function getCachedData<T>(key: CacheKey): Promise<T | null> {
  const db = await openDB();
  const tx = db.transaction(DATA_STORE, 'readonly');
  const store = tx.objectStore(DATA_STORE);

  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => {
      const entry = request.result as CachedData<T> | undefined;
      if (!entry || entry.expiresAt < Date.now()) {
        resolve(null);
      } else {
        resolve(entry.data);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear specific cached data.
 */
export async function clearCachedData(key: CacheKey): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(DATA_STORE, 'readwrite');
  const store = tx.objectStore(DATA_STORE);

  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all cached data.
 */
export async function clearAllCachedData(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(DATA_STORE, 'readwrite');
  const store = tx.objectStore(DATA_STORE);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Queue a form submission for offline sync.
 * When connectivity is restored, the service worker will replay these.
 */
export async function queueOfflineForm(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string,
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(FORMS_STORE, 'readwrite');
  const store = tx.objectStore(FORMS_STORE);

  const entry: QueuedForm = {
    url,
    method,
    headers,
    body,
    queuedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const request = store.add(entry);
    request.onsuccess = () => {
      // Request Background Sync if available
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((registration) => {
          (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } })
            .sync.register('offline-form-sync');
        });
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get count of queued offline forms.
 */
export async function getOfflineFormCount(): Promise<number> {
  const db = await openDB();
  const tx = db.transaction(FORMS_STORE, 'readonly');
  const store = tx.objectStore(FORMS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if the browser is currently online.
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}
