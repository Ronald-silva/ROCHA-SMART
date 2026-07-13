#!/usr/bin/env bash
set -euo pipefail
PORT="${ROCHA_TEST_DB_PORT:-55432}"
URL="postgresql://rocha_test:rocha_test_only@127.0.0.1:${PORT}/rocha_test"
cd "$(dirname "$0")/../web"
DATABASE_URL="$URL" DIRECT_URL="$URL" npx prisma migrate deploy
DATABASE_URL="$URL" DIRECT_URL="$URL" npx prisma migrate status
