import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useResourceQuery } from '../useResourceQuery';

describe('useResourceQuery', () => {
  it('loads and refreshes enabled data', async () => {
    const fetcher = vi.fn(async () => ({ result: 'ok' }));
    const { result } = renderHook(() => useResourceQuery({ key: ['hook', 1], ttlMs: 0, fetcher }));
    await waitFor(() => expect(result.current.data).toEqual({ result: 'ok' }));
    expect(result.current.loading).toBe(false);
    await act(() => result.current.refresh());
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('maps ordinary errors and leaves disabled queries untouched', async () => {
    const fetcher = vi.fn(async () => { throw new Error('network down'); });
    const { result } = renderHook(() => useResourceQuery({ key: ['error'], ttlMs: 1000, fetcher }));
    await waitFor(() => expect(result.current.error?.message).toBe('network down'));
    expect(result.current.loading).toBe(false);
    const disabled = renderHook(() => useResourceQuery({ key: ['disabled'], enabled: false, ttlMs: 1000, fetcher }));
    expect(disabled.result.current.loading).toBe(false);
    await act(() => disabled.result.current.refresh());
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
