#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${ROCHA_TEST_DB_PORT:-55432}"
BASE="postgresql://rocha_test:rocha_test_only@127.0.0.1:${PORT}"

"$ROOT/scripts/test-db.sh" reset
"$ROOT/scripts/test-db-migrate.sh"
cd "$ROOT/web"
DATABASE_URL="$BASE/rocha_test" DIRECT_URL="$BASE/rocha_test" node scripts/foundation-fixtures.mjs seed
cd "$ROOT/api"
TEST_DATABASE_URL="postgresql+asyncpg://rocha_test:rocha_test_only@127.0.0.1:${PORT}/rocha_test" PYTHONPATH=.venv/lib/python3.12/site-packages python3 -m pytest -q tests/integration/test_postgres_foundation.py
cd "$ROOT/web"
DATABASE_URL="$BASE/rocha_test" node scripts/foundation-fixtures.mjs verify-sqlalchemy
cd "$ROOT"
"$ROOT/scripts/test-db-drift.sh"

docker exec rocha-smart-pg-test sh -c 'dropdb -U rocha_test --if-exists rocha_legacy && createdb -U rocha_test rocha_legacy'
docker cp "$ROOT/web/prisma/migrations/20260713000000_baseline/migration.sql" rocha-smart-pg-test:/tmp/baseline.sql >/dev/null
docker cp "$ROOT/tests/fixtures/legacy-schema.sql" rocha-smart-pg-test:/tmp/legacy-schema.sql >/dev/null
docker exec rocha-smart-pg-test psql -v ON_ERROR_STOP=1 -U rocha_test -d rocha_legacy -f /tmp/baseline.sql >/dev/null
docker exec rocha-smart-pg-test psql -v ON_ERROR_STOP=1 -U rocha_test -d rocha_legacy -f /tmp/legacy-schema.sql >/dev/null
cd "$ROOT/web"
DATABASE_URL="$BASE/rocha_legacy" DIRECT_URL="$BASE/rocha_legacy" npx prisma migrate resolve --applied 20260713000000_baseline
DATABASE_URL="$BASE/rocha_legacy" DIRECT_URL="$BASE/rocha_legacy" npx prisma migrate deploy
DATABASE_URL="$BASE/rocha_legacy" node scripts/foundation-fixtures.mjs verify-legacy before-seed
DATABASE_URL="$BASE/rocha_legacy" DIRECT_URL="$BASE/rocha_legacy" node prisma/seed-echo-show-11.cjs
DATABASE_URL="$BASE/rocha_legacy" node scripts/foundation-fixtures.mjs verify-legacy after-seed
