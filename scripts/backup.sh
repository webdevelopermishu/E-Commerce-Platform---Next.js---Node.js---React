#!/usr/bin/env bash
# Nightly backup of the database and uploaded media.
#   crontab -e  →  30 3 * * * /srv/mango-shop/current/scripts/backup.sh >> /var/log/mango-shop/backup.log 2>&1
# Restore: see docs/DEPLOYMENT.md → "Backups and restore".
set -euo pipefail
APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/mango-shop}"
KEEP_DAYS="${KEEP_DAYS:-14}"
# Read DATABASE_URL / MEDIA_DIR from .env without executing it as a script.
if [[ -f "$APP_DIR/.env" ]]; then
  DATABASE_URL="${DATABASE_URL:-$(grep -E '^DATABASE_URL=' "$APP_DIR/.env" | tail -1 | cut -d= -f2-)}"
  MEDIA_DIR="${MEDIA_DIR:-$(grep -E '^MEDIA_DIR=' "$APP_DIR/.env" | tail -1 | cut -d= -f2-)}"
fi
: "${DATABASE_URL:?DATABASE_URL not set}"
MEDIA_DIR="${MEDIA_DIR:-$APP_DIR/media}"
stamp="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
umask 077
pg_dump --format=custom --no-owner --dbname="$DATABASE_URL" --file="$BACKUP_DIR/db-$stamp.dump"
if [[ -d "$MEDIA_DIR" ]]; then tar -czf "$BACKUP_DIR/media-$stamp.tar.gz" -C "$(dirname "$MEDIA_DIR")" "$(basename "$MEDIA_DIR")"; fi
find "$BACKUP_DIR" -type f \( -name 'db-*.dump' -o -name 'media-*.tar.gz' \) -mtime +"$KEEP_DAYS" -delete
echo "[$(date -Is)] backup ok: $BACKUP_DIR/db-$stamp.dump"
