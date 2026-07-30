import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import type { AppDependencies } from '@/app/dependencies';
import { createTestDependencies } from './createTestDependencies';

interface RenderAppOptions {
  route?: string;
  dependencies?: AppDependencies;
}

export function renderApp({
  route = '/',
  dependencies = createTestDependencies(),
}: RenderAppOptions = {}) {
  return {
    dependencies,
    ...render(
      <MemoryRouter initialEntries={[route]}>
        <App dependencies={dependencies} />
      </MemoryRouter>,
    ),
  };
}
