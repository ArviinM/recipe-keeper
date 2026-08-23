#!/usr/bin/env bash
# Create the first administrator account.
#
# Chicken-and-egg: only an admin or teacher can create staff accounts from the
# dashboard, so the very first admin has to be made here. After this, use
# Students -> Add account in the app.
#
#   ./scripts/create-admin.sh "Joemarie Cruz" joemarie@example.com joemarie
#
# Prints a temporary password. The account is forced to change it on first
# sign-in.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ $# -lt 3 ]; then
  echo "Usage: $0 \"Full Name\" email username" >&2
  exit 1
fi

FULL_NAME="$1"; EMAIL="$2"; USERNAME="$3"

# shellcheck disable=SC1091
set -a; . ./.env.local; set +a

if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "SUPABASE_SERVICE_ROLE_KEY is missing from .env.local" >&2
  exit 1
fi

PASSWORD="Cookery$(python3 -c 'import secrets; print(secrets.randbelow(9000)+1000)')"

RESPONSE=$(/usr/bin/curl -sS -X POST "${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "$(python3 -c "
import json, sys
print(json.dumps({
  'email': sys.argv[1],
  'password': sys.argv[2],
  'email_confirm': True,
  'user_metadata': {'full_name': sys.argv[3], 'username': sys.argv[4]},
  'app_metadata': {'role': 'admin', 'must_change_password': True},
}))
" "$EMAIL" "$PASSWORD" "$FULL_NAME" "$USERNAME")")

if echo "$RESPONSE" | grep -q '"id"'; then
  echo
  echo "  Administrator created."
  echo "  Username:            $USERNAME"
  echo "  Email:               $EMAIL"
  echo "  Temporary password:  $PASSWORD"
  echo
  echo "  They will be asked to choose their own password on first sign-in."
else
  echo "Failed to create the account:" >&2
  echo "$RESPONSE" >&2
  exit 1
fi
