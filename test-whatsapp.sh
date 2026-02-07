#!/bin/bash

echo "🚀 Testando envio de WhatsApp..."
echo ""

# Configurações
SUPABASE_URL="https://olniqstzjqzbvjewoqnb.supabase.co"
ANON_KEY="sb_publishable_O4wL0OqeXUHV16UUcJtV1A_VBEDljXV"
FUNCTION_URL="${SUPABASE_URL}/functions/v1/whatsapp-notify"

# Seu número
PHONE="5585985456782"

# Mensagem de teste
MESSAGE="🎉 TESTE! Olá, esta é uma mensagem automática do Drink Wizard. Se você recebeu isso, o sistema está funcionando!"

echo "📱 Enviando para: $PHONE"
echo "💬 Mensagem: $MESSAGE"
echo ""

# Fazer a chamada COM autenticação
curl -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"message\": \"$MESSAGE\",
    \"test_mode\": false
  }"

echo ""
echo ""
echo "✅ Requisição enviada!"
echo "📱 Verifique seu WhatsApp: $PHONE"
