# Testing strategy

The web console uses `AppDependenciesProvider` as its composition boundary.
Pages and providers receive auth, restaurant, menu, order, admin, session,
notification, clock and delay ports from that registry. Production adapters are
assembled once in `src/app/dependencies.tsx`; tests use
`src/test/createTestDependencies.ts` and must not module-mock feature internals.

Test routed behavior with `src/test/renderApp.tsx` and canonical builders. Every
reachable mutation should prove validation, loading/single-submit, success,
backend failure and retry where the action remains available. Read-only routes
must distinguish loading, empty and failure states. Timers and current time use
injected ports so tests never wait on wall-clock time.

Validation commands:

```sh
npm run verify
npm run test:coverage
```

Coverage is a regression guard. Completion is measured against the reachable
use-case/action matrix in the polyrepo execution plan, not a global line target.
