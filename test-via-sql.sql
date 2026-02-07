-- ==========================================
-- TESTE DIRETO: Enviar WhatsApp via SQL
-- ==========================================

-- Opção 1: Testar apenas o envio de WhatsApp (sem automação)
SELECT net.http_post(
  url := 'https://olniqstzjqzbvjewoqnb.supabase.co/functions/v1/whatsapp-notify',
  headers := jsonb_build_object(
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object(
    'phone', '5585985456782',
    'message', '🎉 TESTE! Olá, esta é uma mensagem automática do Drink Wizard. Sistema funcionando!',
    'test_mode', false
  )
) as result;

-- OU use esta versão simplificada se a extensão http não estiver disponível:
-- Apenas insira uma automação e depois dispare manualmente
