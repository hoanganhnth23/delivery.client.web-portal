import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { clearResourceCache } from '@/services/data/resourceCache';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  clearResourceCache();
});
