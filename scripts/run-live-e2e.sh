#!/usr/bin/env bash
set -euo pipefail

# Run only browser smoke against a fresh backend sandbox. The sandbox owns all
# state and is purged on every exit; no shared staging or production URL is
# accepted by this wrapper.
readonly WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly BACKEND_DIR="${E2E_BACKEND_DIR:-$WEB_DIR/../backend_delivery}"
readonly RUN_ID="${E2E_LIVE_RUN_ID:-web-e2e-$(date +%Y%m%d%H%M%S)-$$}"
readonly PASSWORD="${E2E_LIVE_PASSWORD:-Password123!}"
readonly WEB_PORT="${E2E_WEB_PORT:-4173}"
readonly RETAIN_ON_FAILURE="${E2E_LIVE_RETAIN_ON_FAILURE:-false}"
readonly STATE_FILE="$BACKEND_DIR/.sandbox/$RUN_ID/state.env"
readonly RUNTIME_LOG="$BACKEND_DIR/.sandbox/$RUN_ID/runtime-startup.log"
readonly DIAGNOSTIC_LOG="$WEB_DIR/test-results/live-runtime-$RUN_ID.log"

[[ -d "$BACKEND_DIR" ]] || { echo "Backend repository is missing: $BACKEND_DIR" >&2; exit 1; }
[[ "$RUN_ID" =~ ^[a-zA-Z0-9][a-zA-Z0-9_-]*$ ]] || { echo "Invalid E2E_LIVE_RUN_ID" >&2; exit 2; }
[[ "$WEB_PORT" =~ ^[0-9]+$ ]] || { echo "E2E_WEB_PORT must be numeric" >&2; exit 2; }
[[ "$RETAIN_ON_FAILURE" == "true" || "$RETAIN_ON_FAILURE" == "false" ]] || {
  echo "E2E_LIVE_RETAIN_ON_FAILURE must be true or false" >&2
  exit 2
}

state_value() { sed -n "s/^$1=//p" "$STATE_FILE" | tail -n 1; }
cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM
  # Preserve the bounded runtime transcript before sandbox-down removes the
  # run-scoped state. It covers startup only (before seed credentials exist)
  # and remains an ignored, owner-readable local test artifact.
  if [[ "$exit_code" -ne 0 && -f "$RUNTIME_LOG" ]]; then
    mkdir -p "$(dirname "$DIAGNOSTIC_LOG")"
    cp "$RUNTIME_LOG" "$DIAGNOSTIC_LOG"
    # The startup transcript alone cannot explain a browser-time BFF failure.
    # Keep only the affected services' bounded logs, before teardown removes the
    # isolated containers. This artifact remains owner-readable only.
    if [[ -n "${COMPOSE_FILE:-}" && -n "${COMPOSE_PROJECT_NAME:-}" ]]; then
      {
        echo '=== browser-time web-bff and gateway diagnostics ==='
        docker compose logs --no-color --tail=250 web-bff-service api-gateway auth-service
      } >> "$DIAGNOSTIC_LOG" 2>&1 || true
    fi
    chmod 600 "$DIAGNOSTIC_LOG"
    printf 'Retained live runtime diagnostics: %s\n' "$DIAGNOSTIC_LOG" >&2
  fi
  if [[ "$exit_code" -ne 0 && "$RETAIN_ON_FAILURE" == "true" ]]; then
    printf 'Retaining failed live sandbox for diagnosis: %s\n' "$(dirname "$STATE_FILE")" >&2
  elif [[ -n "${STATE_FILE:-}" && -f "$STATE_FILE" ]]; then
    (cd "$BACKEND_DIR" && SANDBOX_STATE_DIR="$(dirname "$STATE_FILE")" SANDBOX_PURGE=true SANDBOX_DELETE_STATE=true bash scripts/sandbox-down.sh) || true
  fi
  exit "$exit_code"
}
trap cleanup EXIT INT TERM

cd "$BACKEND_DIR"
SANDBOX_RUN_ID="$RUN_ID" \
SANDBOX_RETAIN_ON_FAILURE="$RETAIN_ON_FAILURE" \
SANDBOX_INCLUDE_SIMULATOR=false \
SANDBOX_SKIP_SCENARIOS=true \
SANDBOX_SKIP_SHIPPER=true \
SEED_SKIP_OUTSIDER=true \
PASS="$PASSWORD" \
RUNTIME_INFRA_SERVICES="postgres redis kafka" \
RUNTIME_APP_SERVICES="user-service restaurant-service order-service web-bff-service" \
RUNTIME_INCLUDE_OBSERVABILITY=false \
  bash scripts/sandbox-up.sh
[[ -f "$STATE_FILE" ]] || { echo "Sandbox did not produce state: $STATE_FILE" >&2; exit 1; }

# Rehydrate only the Compose inputs required by the operator runner. In
# particular, do not export the simulator token or admin password from the
# complete state file into the browser process environment.
export COMPOSE_FILE="$(state_value SANDBOX_COMPOSE_FILE)"
export COMPOSE_PROJECT_NAME="$(state_value SANDBOX_PROJECT_NAME)"
export SANDBOX_NETWORK_NAME="$(state_value SANDBOX_NETWORK_NAME)"
export POSTGRES_VOLUME_NAME="$(state_value SANDBOX_POSTGRES_VOLUME_NAME)"
export KAFKA_VOLUME_NAME="$(state_value SANDBOX_KAFKA_VOLUME_NAME)"
export SANDBOX_SIMULATOR_API_TOKEN="$(state_value SANDBOX_SIMULATOR_API_TOKEN)"
export INTERNAL_SECRET_FILE="$(state_value INTERNAL_SECRET_FILE)"
export DB_PASSWORD_FILE="$(state_value DB_PASSWORD_FILE)"
export WEB_BFF_ENCRYPTION_KEY_FILE="$(state_value WEB_BFF_ENCRYPTION_KEY_FILE)"
export JWT_PRIVATE_KEY_FILE="$(state_value JWT_PRIVATE_KEY_FILE)"
export JWT_PUBLIC_KEY_FILE="$(state_value JWT_PUBLIC_KEY_FILE)"
export GRAFANA_ADMIN_PASSWORD="$(state_value GRAFANA_ADMIN_PASSWORD)"
export SANDBOX_STATE_DIR="$(state_value SANDBOX_STATE_DIR)"
export ADMIN_EMAIL="admin+$RUN_ID@test.dev"
export ADMIN_PASSWORD="$PASSWORD"
export RUN_ID
bash scripts/operator-provision-admin.sh
# These values are only needed while Compose resolves/provisions the sandbox;
# keep them out of the Playwright/Vite child environment.
unset SANDBOX_SIMULATOR_API_TOKEN GRAFANA_ADMIN_PASSWORD

readonly GATEWAY_BASE_URL="$(state_value SANDBOX_GATEWAY_BASE_URL)"
readonly SEED_FILE="$SANDBOX_STATE_DIR/seed.json"
readonly RESTAURANT_ID="$(jq -er '.restaurantId' "$SEED_FILE")"
readonly CUSTOMER_EMAIL="$(jq -er '.customerEmail' "$SEED_FILE")"
readonly OWNER_EMAIL="$(jq -er '.ownerEmail' "$SEED_FILE")"

cd "$WEB_DIR"
VITE_API_BASE_URL="$GATEWAY_BASE_URL" \
E2E_LIVE=true \
E2E_BASE_URL="http://127.0.0.1:$WEB_PORT" \
E2E_WEB_PORT="$WEB_PORT" \
E2E_LIVE_PASSWORD="$PASSWORD" \
E2E_LIVE_CUSTOMER_EMAIL="$CUSTOMER_EMAIL" \
E2E_LIVE_OWNER_EMAIL="$OWNER_EMAIL" \
E2E_LIVE_ADMIN_EMAIL="$ADMIN_EMAIL" \
E2E_LIVE_RESTAURANT_ID="$RESTAURANT_ID" \
  npx playwright test --project=live-chromium
