import { describe, expect, it } from 'vitest';
import httpContract from '../../../../contracts/backend/http-contract.json';
import publicEdgeManifest from '../../../../contracts/backend/public-edge-manifest.json';
import { APP_HTTP_ROUTES } from '../routeRegistry';

const routeMatches = (pattern: string, path: string): boolean => {
  const expression = `^${pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\{[^}]+\\\}/g, '[^/]+')}$`;
  return new RegExp(expression).test(path);
};

describe('web HTTP routes match the vendored backend contract', () => {
  it.each(APP_HTTP_ROUTES)('%s %s exists in backend and public edge', (method, path) => {
    const operations = httpContract.operations.filter((operation) =>
      routeMatches(operation.path, path) && operation.verbs.includes(method),
    );
    expect(operations, `${method} ${path} missing from http-contract.json`).not.toHaveLength(0);

    // /bff/session/* is same-origin web-bff traffic; it is deliberately not
    // a Gateway public-edge route. The backend contract still validates it.
    if (path.startsWith('/bff/')) return;
    const exposed = publicEdgeManifest.routes.some((route) =>
      route.methods.includes(method) && route.paths.some((pattern) => routeMatches(pattern, path)),
    );
    expect(exposed, `${method} ${path} missing from public-edge-manifest.json`).toBe(true);
  });
});
