#!/bin/bash

# ==========================================
# DISPARAR WEBHOOK MANUALMENTE
# ==========================================
# Este script simula o webhook do Supabase
# chamando a Edge Function handle-automation

SUPABASE_URL="https://olniqstzjqzbvjewoqnb.supabase.co"
SERVICE_ROLE_KEY="SEU_SERVICE_ROLE_KEY_AQUI"  # Substitua!

echo "🚀 Disparando webhook de automação..."
echo ""

# Pegar o ID de um evento existente
EVENT_ID=$(curl -s "${SUPABASE_URL}/rest/v1/events?select=id&client_phone=eq.5585985456782&limit=1" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" | jq -r '.[0].id')

if [ "$EVENT_ID" == "null" ] || [ -z "$EVENT_ID" ]; then
  echo "❌ Erro: Nenhum evento encontrado com o telefone 5585985456782"
  echo "Execute primeiro o test-automation.sql para criar um evento de teste"
  exit 1
fi

echo "✅ Evento encontrado: $EVENT_ID"
echo ""

# Disparar o webhook simulando checklist entrada concluído
curl -X POST "${SUPABASE_URL}/functions/v1/handle-automation" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"UPDATE\",
    \"table\": \"event_checklists\",
    \"schema\": \"public\",
    \"event_type\": \"entrada\",
    \"record\": {
      \"id\": \"test-checklist-$(uuidgen)\",
      \"event_id\": \"${EVENT_ID}\",
      \"type\": \"entrada\",
      \"status\": \"completed\",
      \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
    },
    \"old_record\": {
      \"status\": \"pending\"
    }
  }" | jq '.'

echo ""
echo "✅ Webhook disparado!"
echo ""
echo "📱 Verifique seu WhatsApp: 5585985456782"
echo ""
echo "📋 Para ver os logs:"
echo "   npx supabase functions logs handle-automation --tail"
echo "   npx supabase functions logs whatsapp-notify --tail"
