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

### 4. E2E selectors lagged behind the current customer UI

The address page now opens its form explicitly, uses address-type buttons and
updated Vietnamese labels, and uses distinct create/update action labels.
Checkout likewise renders its current empty-cart, price-change, and address
selection surfaces. The affected tests were updated to assert those existing
controls and messages while preserving the behavior assertions.

### 5. Checkout unavailable-item state was not visible before submit

`CustomerCheckoutPage` disabled COD creation for a quote containing unavailable
items but did not render the contract-required recovery message until submit.
It now renders an alert immediately when the server preview includes
`unavailableItemIds`; a Vitest regression test covers the message and disabled
action. This is the only additional product change and is required by
CUSTOMER-11's documented unavailable-item behavior.

## Validation

Focused customer Playwright: 25 passed. Customer ordering Vitest: 10 passed.
Full-suite rerun after the final selector updates is pending.
