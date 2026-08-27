#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${BACKUP_FILE:-${BACKUP_DIR}/servora-${STAMP}.dump}"

mkdir -p "$(dirname "$OUT")"
umask 077

echo "Creating PostgreSQL backup: $OUT"
pg_dump --format=custom --no-owner --no-acl --file="$OUT" "$DATABASE_URL"
echo "Backup complete: $OUT"
