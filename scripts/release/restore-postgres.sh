#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_FILE:?BACKUP_FILE is required}"

if [ "${RESTORE_CONFIRMATION:-}" != "RESTORE_SERVORA_DATABASE" ]; then
  echo "Refusing database restore."
  echo "Set RESTORE_CONFIRMATION=RESTORE_SERVORA_DATABASE after verifying the target and backup."
  exit 2
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Restoring PostgreSQL backup: $BACKUP_FILE"
pg_restore --clean --if-exists --no-owner --no-acl --dbname="$DATABASE_URL" "$BACKUP_FILE"
echo "Restore complete."
