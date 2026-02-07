-- ==========================================
-- TESTE COMPLETO - VERSÃO FINAL CORRETA
-- ==========================================

-- PASSO 1: Descobrir valores válidos do enum event_status
SELECT 
  enumlabel as valor_valido
FROM pg_enum
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'event_status'
)
ORDER BY enumsortorder;

-- PASSO 2: Criar evento de teste (usando primeiro valor do enum)
INSERT INTO public.events (
  client_name,
  client_phone,
  date,
  location,
  status
) VALUES (
  'Teste Sistema Automação',
  '5585985456782',
  now() + interval '2 days',
  'Fortaleza - CE',
  (SELECT enumlabel::event_status FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'event_status') LIMIT 1)
)
RETURNING id, client_name, client_phone, location, status;

-- PASSO 3: Criar checklist de entrada para o evento
INSERT INTO public.checklists (
  event_id,
  type,
  status,
  items
) VALUES (
  (SELECT id FROM public.events WHERE client_phone = '5585985456782' ORDER BY created_at DESC LIMIT 1),
  'entrada',
  'pending',
  '[]'::jsonb
)
RETURNING id, event_id, type, status;

-- PASSO 4: Criar automação de teste
INSERT INTO public.automation_triggers (
  created_by,
  name,
  active,
  trigger_event,
  action_type,
  action_config
) VALUES (
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1),
  'TESTE - WhatsApp Checklist Entrada',
  true,
  'checklist_entrada',
  'whatsapp',
  jsonb_build_object(
    'message', '🎉 Olá {cliente}! Chegamos em {local}. Tudo pronto para seu evento!',
    'test_mode', false,
    'delay_seconds', 0
  )
)
ON CONFLICT DO NOTHING
RETURNING id, name, trigger_event, action_config->>'message' as message;

-- PASSO 5: Verificar o que foi criado
SELECT 
  'EVENTO' as tipo,
  id,
  client_name,
  client_phone,
  location
FROM public.events
WHERE client_phone = '5585985456782'
ORDER BY created_at DESC
LIMIT 1;

SELECT 
  'CHECKLIST' as tipo,
  id,
  event_id,
  type,
  status
FROM public.checklists
WHERE event_id = (SELECT id FROM public.events WHERE client_phone = '5585985456782' ORDER BY created_at DESC LIMIT 1)
ORDER BY created_at DESC
LIMIT 1;

SELECT 
  'AUTOMAÇÃO' as tipo,
  id,
  name,
  active,
  trigger_event
FROM public.automation_triggers
WHERE trigger_event = 'checklist_entrada' AND active = true
ORDER BY created_at DESC
LIMIT 1;

-- ==========================================
-- PASSO 6: 🚀 DISPARAR O TESTE!
-- ==========================================
-- Esta query vai completar o checklist e disparar o webhook

UPDATE public.checklists
SET 
  status = 'completed',
  checked_by = (SELECT id FROM auth.users LIMIT 1),
  created_at = now()
WHERE id = (
  SELECT c.id 
  FROM public.checklists c
  JOIN public.events e ON c.event_id = e.id
  WHERE e.client_phone = '5585985456782'
    AND c.type = 'entrada'
  ORDER BY c.created_at DESC
  LIMIT 1
)
RETURNING 
  id as checklist_id,
  event_id,
  type,
  status,
  '🚀 WEBHOOK DISPARADO! Verifique seu WhatsApp: 5585985456782' as mensagem;

-- PASSO 7: Ver se a automação foi executada
SELECT 
  id,
  name,
  trigger_count,
  last_triggered_at,
  CASE 
    WHEN trigger_count > 0 THEN '✅ AUTOMAÇÃO EXECUTADA!'
    ELSE '⏳ Aguardando execução...'
  END as status
FROM public.automation_triggers
WHERE trigger_event = 'checklist_entrada' AND active = true
ORDER BY updated_at DESC
LIMIT 1;
