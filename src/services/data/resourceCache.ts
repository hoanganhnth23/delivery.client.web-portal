export type ResourceKey = readonly unknown[];

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface InFlightEntry<T> {
  promise: Promise<T>;
  controller: AbortController;
  consumers: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, InFlightEntry<unknown>>();

const keyOf = (key: ResourceKey): string => JSON.stringify(key);

export class ResourceRequestCancelledError extends Error {
  constructor() {
    super('Resource request was cancelled');
    this.name = 'ResourceRequestCancelledError';
  }
}

export const isResourceRequestCancelled = (error: unknown): boolean =>
  error instanceof ResourceRequestCancelledError ||
  (error instanceof DOMException && error.name === 'AbortError');

export async function readResource<T>(
  key: ResourceKey,
  fetcher: (signal: AbortSignal) => Promise<T>,
  ttlMs: number,
): Promise<T> {
  const serializedKey = keyOf(key);
  const now = Date.now();
  const cached = cache.get(serializedKey) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > now) return cached.value;

  const existing = inFlight.get(serializedKey) as InFlightEntry<T> | undefined;
  if (existing) {
    existing.consumers += 1;
    return existing.promise;
  }

  const controller = new AbortController();
  const promise = fetcher(controller.signal)
    .then((value) => {
      cache.set(serializedKey, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      // A cancelled request may finish after a replacement request has
      // already been installed for the same key.
      if (inFlight.get(serializedKey)?.promise === promise) inFlight.delete(serializedKey);
    });
  inFlight.set(serializedKey, { promise, controller, consumers: 1 });
  return promise;
}

export const releaseResource = (key: ResourceKey): void => {
  const serializedKey = keyOf(key);
  const entry = inFlight.get(serializedKey);
  if (!entry) return;
  entry.consumers -= 1;
  if (entry.consumers <= 0) {
    // Give a same-tick remount (React StrictMode probe) a chance to subscribe
    // before cancelling the request.
    queueMicrotask(() => {
      if (inFlight.get(serializedKey) === entry && entry.consumers <= 0) {
        inFlight.delete(serializedKey);
        entry.controller.abort();
      }
    });
  }
};

export const invalidateResource = (key: ResourceKey): void => {
  cache.delete(keyOf(key));
};

export const invalidateResources = (prefix: ResourceKey): void => {
  const serializedPrefix = keyOf(prefix).slice(0, -1);
  for (const serializedKey of cache.keys()) {
    if (serializedKey.startsWith(serializedPrefix)) cache.delete(serializedKey);
  }
};

export const clearResourceCache = (): void => {
  cache.clear();
};
