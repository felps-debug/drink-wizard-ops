-- ==========================================
-- TESTE COMPLETO DO SISTEMA DE AUTOMAÇÃO
-- ==========================================

-- 1. Criar um evento de teste com seus dados
INSERT INTO public.events (
  id,
  client_name,
  client_phone,
  date,
  location,
  status
) VALUES (
  'test-event-' || gen_random_uuid()::text,
  'Teste Sistema',
  '5585985456782',  -- SEU NÚMERO
  now() + interval '2 days',
  'Fortaleza - CE',
  'pending'
)
ON CONFLICT DO NOTHING
RETURNING id, client_name, client_phone, location;

-- 2. Criar automação de teste (com test_mode = false para enviar de verdade)
INSERT INTO public.automation_triggers (
  created_by,
  name,
  active,
  trigger_event,
  action_type,
  action_config
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),  -- Pega o primeiro usuário
  'TESTE WhatsApp - Checklist Entrada',
  true,
  'checklist_entrada',
  'whatsapp',
  jsonb_build_object(
    'message', 'Olá {cliente}! 🎉 Seu checklist de entrada foi concluído. Chegamos em {local}. Tudo pronto para o evento!',
    'test_mode', false,  -- FALSE = envia mensagem real!
    'delay_seconds', 0,
    'max_retries', 3
  )
)
ON CONFLICT DO NOTHING
RETURNING id, name, trigger_event;

-- 3. Ver as automações criadas
SELECT
  id,
  name,
  active,
  trigger_event,
  action_config->>'message' as message,
  action_config->>'test_mode' as test_mode
FROM public.automation_triggers
WHERE active = true
ORDER BY created_at DESC
LIMIT 5;

-- 4. Ver os eventos disponíveis
SELECT
  id,
  client_name,
  client_phone,
  location,
  date
FROM public.events
ORDER BY created_at DESC
LIMIT 5;

-- ==========================================
-- INSTRUÇÕES PARA DISPARAR O TESTE:
-- ==========================================
-- Agora execute UMA das opções abaixo:
--
-- OPÇÃO A: Se você tem tabela event_checklists
-- UPDATE event_checklists
-- SET status = 'completed'
-- WHERE event_id = (SELECT id FROM events WHERE client_phone = '5585985456782' LIMIT 1)
--   AND type = 'entrada';
--
-- OPÇÃO B: Se não tem event_checklists, dispare manualmente via curl:
-- Ver comando no próximo arquivo gerado
