#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?main|empty|broken}"; PORT="${2:?port}"; DB_PORT="${ROCHA_TEST_DB_PORT:-55432}"
case "$MODE" in
  main) DB="rocha_test" ;;
  empty) DB="rocha_empty" ;;
  broken) DB="rocha_unreachable"; DB_PORT=55999 ;;
  *) exit 2 ;;
esac
export DATABASE_URL="postgresql://rocha_test:rocha_test_only@127.0.0.1:${DB_PORT}/${DB}"
export DIRECT_URL="$DATABASE_URL"
export INTERNAL_API_BASE_URL=""
export INTERNAL_API_JWT=""
export SDR_GATEWAY_SECRET=""
export SDR_IDENTITY_HASH_SALT=""
export NEXT_PUBLIC_META_PIXEL_ID=""
export NEXT_PUBLIC_GA4_MEASUREMENT_ID=""
export NEXT_PUBLIC_GOOGLE_ADS_ID=""
cd "$(dirname "$0")/../web"
exec npm run start -- -p "$PORT"
