#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$ROOT/web/e2e/foundation.py" --base http://127.0.0.1:3100 --empty-base http://127.0.0.1:3101 --broken-base http://127.0.0.1:3102
cd "$ROOT/web"
PORT="${ROCHA_TEST_DB_PORT:-55432}"
DATABASE_URL="postgresql://rocha_test:rocha_test_only@127.0.0.1:${PORT}/rocha_test" node scripts/foundation-fixtures.mjs verify-outbound-click
SMOKE_BASE_URL=http://127.0.0.1:3100 SMOKE_PRODUCT_ID=foundation-valid SMOKE_INVALID_PRODUCT_ID=foundation-expired SMOKE_API_BASE_URL=http://127.0.0.1:8100 SMOKE_API_CLIENT_ID=foundation SMOKE_API_CLIENT_SECRET=foundation-client-secret node scripts/smoke.mjs
