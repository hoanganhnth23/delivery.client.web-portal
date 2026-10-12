import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearResourceCache,
  invalidateResource,
  invalidateResources,
  isResourceRequestCancelled,
  readResource,
  releaseResource,
  ResourceRequestCancelledError,
} from '../resourceCache';

describe('resource cache', () => {
  beforeEach(() => clearResourceCache());

  it('caches values by key until their ttl expires', async () => {
    const fetcher = vi.fn(async () => ({ value: 1 }));
    await expect(readResource(['items', 1], fetcher, 60_000)).resolves.toEqual({ value: 1 });
    await expect(readResource(['items', 1], fetcher, 60_000)).resolves.toEqual({ value: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    invalidateResource(['items', 1]);
    await readResource(['items', 1], fetcher, 60_000);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent requests and removes rejected requests', async () => {
    let resolve: ((value: string) => void) | undefined;
    const fetcher = vi.fn(() => new Promise<string>((done) => { resolve = done; }));
    const first = readResource(['same'], fetcher, 1000);
    const second = readResource(['same'], fetcher, 1000);
    expect(fetcher).toHaveBeenCalledTimes(1);
    resolve?.('ok');
    await expect(Promise.all([first, second])).resolves.toEqual(['ok', 'ok']);

    const failure = vi.fn(async () => { throw new Error('failed'); });
    await expect(readResource(['bad'], failure, 1000)).rejects.toThrow('failed');
    await expect(readResource(['bad'], failure, 1000)).rejects.toThrow('failed');
    expect(failure).toHaveBeenCalledTimes(2);
  });

  it('cancels a released request after the same-tick remount window', async () => {
    const controllerSignal: AbortSignal[] = [];
    const fetcher = vi.fn((signal: AbortSignal) => {
      controllerSignal.push(signal);
      return new Promise<string>((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
    });
    const pending = readResource(['cancel'], fetcher, 1000);
    releaseResource(['cancel']);
    await Promise.resolve();
    expect(controllerSignal[0]?.aborted).toBe(true);
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('keeps an in-flight request alive while another consumer remains', async () => {
    let resolve: ((value: string) => void) | undefined;
    const pending = readResource(['shared'], () => new Promise<string>((done) => { resolve = done; }), 1000);
    const same = readResource(['shared'], async () => 'replacement', 1000);
    releaseResource(['shared']);
    await Promise.resolve();
    resolve?.('shared-value');
    await expect(Promise.all([pending, same])).resolves.toEqual(['shared-value', 'shared-value']);
  });

  it('invalidates all entries below a prefix and recognizes cancellation errors', async () => {
    const fetcher = vi.fn(async (signal: AbortSignal) => signal.aborted ? 'aborted' : Math.random());
    await readResource(['users', 1], fetcher, 60_000);
    await readResource(['users', 2], fetcher, 60_000);
    await readResource(['orders', 1], fetcher, 60_000);
    invalidateResources(['users']);
    await readResource(['users', 1], fetcher, 60_000);
    await readResource(['orders', 1], fetcher, 60_000);
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(isResourceRequestCancelled(new ResourceRequestCancelledError())).toBe(true);
    expect(isResourceRequestCancelled(new DOMException('aborted', 'AbortError'))).toBe(true);
    expect(isResourceRequestCancelled(new Error('other'))).toBe(false);
  });
});
