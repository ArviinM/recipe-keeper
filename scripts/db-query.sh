#!/usr/bin/env bash
# Run SQL against the linked Supabase project via the Management API.
#
#   ./scripts/db-query.sh -f supabase/seed.sql
#   ./scripts/db-query.sh "select count(*) from public.recipes;"
#
# Reads SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF from .env.local.
set -euo pipefail

cd "$(dirname "$0")/.."
set -a; . ./.env.local; set +a

if [ "${1:-}" = "-f" ]; then
  payload=$(python3 -c "import json,sys; print(json.dumps({'query': open(sys.argv[1]).read()}))" "$2")
else
  payload=$(python3 -c "import json,sys; print(json.dumps({'query': sys.argv[1]}))" "$1")
fi

curl -sS -X POST \
  "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "User-Agent: recipe-keeper-setup/1.0" \
  --data-binary "$payload"
