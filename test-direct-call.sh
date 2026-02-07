#!/bin/bash

echo "🔥 Chamando Edge Function DIRETAMENTE (bypass webhook)"
echo ""

# Pegar o event_id do evento criado
EVENT_ID=$(cat <<'SQL'
SELECT id::text FROM public.events 
WHERE client_phone = '5585985456782' 
ORDER BY created_at DESC 
LIMIT 1;
SQL
)

echo "📋 Preparando payload para handle-automation..."
echo ""

# Chamar a Edge Function diretamente
curl -X POST "https://olniqstzjqzbvjewoqnb.supabase.co/functions/v1/handle-automation" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "UPDATE",
    "table": "checklists",
    "schema": "public",
    "event_type": "entrada",
    "record": {
      "id": "test-'$(uuidgen)'",
      "event_id": "'"${EVENT_ID}"'",
      "type": "entrada",
      "status": "completed",
      "created_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
    },
    "old_record": {
      "status": "pending"
    }
  }' 2>&1

echo ""
echo ""
echo "✅ Chamada feita!"
echo "📱 Verifique seu WhatsApp: 5585985456782"
