#!/usr/bin/env bash
set -euo pipefail
PORT="${1:-8100}"; DB_PORT="${ROCHA_TEST_DB_PORT:-55432}"
export DATABASE_URL="postgresql://rocha_test:rocha_test_only@127.0.0.1:${DB_PORT}/rocha_test"
export APP_ENV=development DATABASE_SSL=false
export JWT_SECRET_KEY="foundation-jwt-secret-not-for-production"
export AUTH_CLIENTS_JSON='{"foundation":"foundation-client-secret"}'
export CORS_ORIGINS="http://127.0.0.1:3100"
export ANTHROPIC_API_KEY="" SDR_ENABLED=false
export SDR_USAGE_STORE=postgres SDR_STORE_FAILURE_POLICY=closed
export SDR_GATEWAY_SECRET="foundation-sdr-gateway-secret-000000"
export SDR_IDENTITY_HASH_SALT="foundation-identity-hash-salt-000000"
export ZENDROP_API_BASE="" ZENDROP_API_KEY="" ALIEXPRESS_API_BASE="" ALIEXPRESS_API_KEY=""
cd "$(dirname "$0")/../api"
export PYTHONPATH=.venv/lib/python3.12/site-packages
exec python3 -m uvicorn app.main:app --host 127.0.0.1 --port "$PORT"
