#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

mkdir -p backups

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/begabot_pg_${TIMESTAMP}.sql"

docker compose exec -T postgres pg_dump -U begabot_user -d begabot_saas > "$BACKUP_FILE"

echo "Backup creado en $BACKUP_FILE"
