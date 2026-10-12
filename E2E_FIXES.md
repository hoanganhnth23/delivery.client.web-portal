# E2E baseline fixes

## Root causes

### 1. Successful empty catalog responses were replaced with preview data

Affected cases: `CASE-CROSS-002`, `CASE-CROSS-014`, `CASE-CUSTOMER-01` in
`hard-customer`, `hard-wave3`, `wave4-state-boundaries`, and `web-journeys`.

`CustomerHomePage` used `customer-preview/catalog.json` whenever
`GET /api/restaurants` returned an empty successful array. The action contract
for CUSTOMER-01 requires the server catalog to own restaurant facts and to
render a distinct empty state; the README also requires loading, empty, error,
and retry states to remain distinguishable. The fallback was removed. Preview
dishes remain a separate preview concern and are no longer allowed to create
catalog rows.

### 2. The unauthenticated route test left the mock BFF session authenticated

Affected case: `AUTH-03, AUTH-04 guarded route redirects unauthenticated user
to login` in `web-journeys.spec.ts`.

Clearing localStorage alone cannot make a server-side BFF session unauthenticated.
The fixture now models the intended unauthenticated backend state with
`authenticated: false`, while retaining the existing assertion for the admin
login redirect.

### 3. Address mutation fixture coverage was incomplete

Affected address delete/error flows in the hard customer and wave suites.

The application contract includes `DELETE /api/addresses/{id}`. The mock
backend handled GET/POST/PUT but treated a successful DELETE as unexpected.
The fixture now returns a canonical successful empty response for DELETE;
forced failures still use the existing failure queue and remain observable.

## Product changes

The only production change is removal of the fabricated catalog fallback. It
is required by CUSTOMER-01 in `docs/action-contract-matrix.md` (server catalog
owns restaurant facts; empty and error states are distinct) and by the README's
loading/empty/error contract. No assertion was weakened and no case was
skipped or marked fixme.

## Validation

Full Playwright and Vitest validation is pending because the worktree's
symlinked `node_modules` points to a dependency tree whose Vite cache paths are
not writable from this sandbox. Both Playwright and Vitest fail before test
collection with `EPERM` while opening `node_modules/.vite-temp/vite.config...`.
