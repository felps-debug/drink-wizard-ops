#!/bin/bash

echo "🚀 Testando envio de WhatsApp..."
echo ""

# URL da Edge Function
FUNCTION_URL="https://olniqstzjqzbvjewoqnb.supabase.co/functions/v1/whatsapp-notify"

# Seu número
PHONE="5585985456782"

# Mensagem de teste
MESSAGE="🎉 TESTE DO SISTEMA! Olá, esta é uma mensagem automática do Drink Wizard. Se você recebeu isso, o sistema de automação está funcionando perfeitamente!"

echo "📱 Enviando para: $PHONE"
echo "💬 Mensagem: $MESSAGE"
echo ""

# Fazer a chamada
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"message\": \"$MESSAGE\",
    \"test_mode\": false
  }" | jq '.'

echo ""
echo "✅ Requisição enviada!"
echo "📱 Verifique seu WhatsApp agora!"
