#!/usr/bin/env bash
set -euo pipefail

# Run the live browser specs (live-smoke, live-order-journey, live-portal-branches) against the local
# full-stack harness in delivery.devops.gitops/local/e2e. The stack owns all
# state; it is torn down on exit unless it was already running or E2E_KEEP=true.
# No shared staging or production URL is accepted by this wrapper.
#
#   E2E_STACK_DIR   harness folder (default: ../delivery.devops.gitops/local/e2e)
#   E2E_BUILD=true  build the service images first (otherwise reuse local images)
#   E2E_KEEP=true   leave the stack running afterwards
readonly WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly STACK_DIR="$(cd "${E2E_STACK_DIR:-$WEB_DIR/../delivery.devops.gitops/local/e2e}" && pwd)"
readonly PASSWORD="${E2E_LIVE_PASSWORD:-Password123!}"
readonly WEB_PORT="${E2E_WEB_PORT:-4173}"
readonly GATEWAY_PORT="${E2E_GATEWAY_PORT:-8079}"
readonly GATEWAY_BASE_URL="http://127.0.0.1:$GATEWAY_PORT"
readonly FIXTURE="$STACK_DIR/.run/web-fixture.json"

[[ -x "$STACK_DIR/up.sh" ]] || { echo "Local E2E harness is missing: $STACK_DIR" >&2; exit 1; }
[[ "$WEB_PORT" =~ ^[0-9]+$ ]] || { echo "E2E_WEB_PORT must be numeric" >&2; exit 2; }
export E2E_PROJECT="${E2E_PROJECT:-delivery-e2e}" E2E_GATEWAY_PORT="$GATEWAY_PORT"

started_here=false
cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM
  rm -f "$FIXTURE"
  if [[ "$started_here" == "true" && "${E2E_KEEP:-false}" != "true" ]]; then
    "$STACK_DIR/down.sh" >/dev/null 2>&1 || true
  fi
  exit "$exit_code"
}
trap cleanup EXIT INT TERM

if docker compose -p "$E2E_PROJECT" ps --status running --services 2>/dev/null | grep -qx api-gateway; then
  echo "Reusing running stack '$E2E_PROJECT'"
else
  [[ "${E2E_BUILD:-false}" == "true" ]] && "$STACK_DIR/build.sh"
  started_here=true
  "$STACK_DIR/up.sh"
fi
PASS="$PASSWORD" BASE="$GATEWAY_BASE_URL" WEB_FIXTURE_FILE="$FIXTURE" bash "$STACK_DIR/scripts/prepare-web.sh"

cd "$WEB_DIR"
VITE_API_BASE_URL="$GATEWAY_BASE_URL" \
E2E_LIVE=true \
E2E_BASE_URL="http://127.0.0.1:$WEB_PORT" \
E2E_WEB_PORT="$WEB_PORT" \
E2E_LIVE_PASSWORD="$PASSWORD" \
E2E_LIVE_GATEWAY_URL="$GATEWAY_BASE_URL" \
E2E_LIVE_CUSTOMER_EMAIL="$(jq -er .customerEmail "$FIXTURE")" \
E2E_LIVE_OWNER_EMAIL="$(jq -er .ownerEmail "$FIXTURE")" \
E2E_LIVE_ADMIN_EMAIL="$(jq -er .adminEmail "$FIXTURE")" \
E2E_LIVE_SHIPPER_EMAIL="$(jq -er .shipperEmail "$FIXTURE")" \
E2E_LIVE_RESTAURANT_ID="$(jq -er .restaurantId "$FIXTURE")" \
  npx playwright test --project=live-chromium "$@"
