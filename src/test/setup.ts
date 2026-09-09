import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import { clearResourceCache } from '@/services/data/resourceCache';

configure({ asyncUtilTimeout: 4000 });

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

const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: storageMock,
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  configurable: true,
  writable: true,
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  clearResourceCache();
});
