#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; PORT="${ROCHA_TEST_DB_PORT:-55432}"; BASE="postgresql://rocha_test:rocha_test_only@127.0.0.1:${PORT}"
docker exec rocha-smart-pg-test sh -c 'dropdb -U rocha_test --if-exists rocha_empty && createdb -U rocha_test rocha_empty'
cd "$ROOT/web"
DATABASE_URL="$BASE/rocha_empty" DIRECT_URL="$BASE/rocha_empty" npx prisma migrate deploy
NEXT_PUBLIC_META_PIXEL_ID="" NEXT_PUBLIC_GA4_MEASUREMENT_ID="" NEXT_PUBLIC_GOOGLE_ADS_ID="" npm run build
python3 /home/ronald/.agents/skills/webapp-testing/scripts/with_server.py \
  --server "$ROOT/scripts/start-foundation-api.sh 8100" --port 8100 \
  --server "$ROOT/scripts/start-foundation-web.sh main 3100" --port 3100 \
  --server "$ROOT/scripts/start-foundation-web.sh empty 3101" --port 3101 \
  --server "$ROOT/scripts/start-foundation-web.sh broken 3102" --port 3102 \
  --timeout 60 -- "$ROOT/scripts/run-foundation-browser-tests.sh"
