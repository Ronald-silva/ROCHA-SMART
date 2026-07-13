#!/usr/bin/env bash
set -euo pipefail
PORT="${ROCHA_TEST_DB_PORT:-55432}"
BASE="postgresql://rocha_test:rocha_test_only@127.0.0.1:${PORT}"
cd "$(dirname "$0")/../web"
SHADOW_DATABASE_URL="$BASE/rocha_shadow" npm run db:drift
npx prisma migrate diff --from-url "$BASE/rocha_test" --to-schema-datamodel prisma/schema.prisma --exit-code
