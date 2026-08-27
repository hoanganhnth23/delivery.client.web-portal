import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { clearResourceCache } from '@/services/data/resourceCache';

if (typeof globalThis.ResizeObserver === 'undefined') {
  class TestResizeObserver implements ResizeObserver {
    private readonly callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(target: Element): void {
      const bounds = target.getBoundingClientRect();
      const width = bounds.width || Number.parseFloat((target as HTMLElement).style.width) || 960;
      const height = bounds.height || Number.parseFloat((target as HTMLElement).style.height) || 600;
      Object.defineProperties(target, {
        offsetWidth: { configurable: true, value: width },
        offsetHeight: { configurable: true, value: height },
      });
      this.callback([{
        target,
        contentRect: { width, height } as DOMRectReadOnly,
      } as ResizeObserverEntry], this);
    }

    unobserve(): void {}
    disconnect(): void {}
  }

  globalThis.ResizeObserver = TestResizeObserver;
}

if (typeof globalThis.DOMMatrixReadOnly === 'undefined') {
  class TestDOMMatrixReadOnly {
    readonly m22 = 1;

    constructor(_transform?: string) {}
  }

  globalThis.DOMMatrixReadOnly = TestDOMMatrixReadOnly as unknown as typeof DOMMatrixReadOnly;
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  clearResourceCache();
});
