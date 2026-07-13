#!/usr/bin/env bash
set -euo pipefail

NAME="rocha-smart-pg-test"
IMAGE="postgres:16-alpine"
PORT="${ROCHA_TEST_DB_PORT:-55432}"
USER="rocha_test"
PASSWORD="rocha_test_only"
DB="rocha_test"

wait_ready() {
  for _ in $(seq 1 30); do
    if docker exec "$NAME" pg_isready -U "$USER" -d "$DB" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  echo "PostgreSQL descartável não ficou pronto" >&2; return 1
}

case "${1:-}" in
  up)
    if ! docker inspect "$NAME" >/dev/null 2>&1; then
      docker run --name "$NAME" --rm -d -e POSTGRES_USER="$USER" -e POSTGRES_PASSWORD="$PASSWORD" -e POSTGRES_DB="$DB" -p "127.0.0.1:${PORT}:5432" "$IMAGE" >/dev/null
    fi
    wait_ready
    if [ "$(docker exec "$NAME" psql -U "$USER" -d "$DB" -Atc "SELECT 1 FROM pg_database WHERE datname='rocha_shadow'")" != "1" ]; then
      docker exec "$NAME" createdb -U "$USER" rocha_shadow
    fi
    echo "PostgreSQL de teste pronto em 127.0.0.1:${PORT} (container $NAME, sem volume)"
    ;;
  down)
    if docker inspect "$NAME" >/dev/null 2>&1; then docker stop "$NAME" >/dev/null; fi
    ;;
  reset)
    if docker inspect "$NAME" >/dev/null 2>&1; then docker stop "$NAME" >/dev/null; fi
    "$0" up
    ;;
  *) echo "Uso: $0 {up|down|reset}" >&2; exit 2 ;;
esac
