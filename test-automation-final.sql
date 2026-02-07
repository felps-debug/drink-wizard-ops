-- ==========================================
-- TESTE COMPLETO - Sistema de Automação
-- Estrutura real: events + checklists
-- ==========================================

-- PASSO 1: Ver estrutura das tabelas
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'checklists'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASSO 2: Criar evento de teste
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
  'confirmed'
)
ON CONFLICT DO NOTHING
RETURNING id, client_name, client_phone, location;

-- PASSO 3: Criar automação de teste
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
    'message', 'Olá {cliente}! 🎉 Chegamos em {local}. Seu evento está confirmado!',
    'test_mode', false,
    'delay_seconds', 0
  )
)
ON CONFLICT DO NOTHING
RETURNING id, name, trigger_event, action_config->>'message' as message;

-- PASSO 4: Ver eventos e automações criadas
SELECT 
  '=== EVENTO CRIADO ===' as info,
  id,
  client_name,
  client_phone,
  location,
  date
FROM public.events
WHERE client_phone = '5585985456782'
ORDER BY created_at DESC
LIMIT 1;

SELECT 
  '=== AUTOMAÇÃO CRIADA ===' as info,
  id,
  name,
  active,
  trigger_event,
  action_config->>'message' as message
FROM public.automation_triggers
WHERE trigger_event = 'checklist_entrada'
  AND active = true
ORDER BY created_at DESC
LIMIT 1;

-- ==========================================
-- PASSO 5: DISPARAR O TESTE
-- ==========================================
-- Agora execute UMA das opções abaixo dependendo
-- da estrutura da tabela checklists:

-- OPÇÃO A: Se checklists tem colunas event_id e type
-- UPDATE public.checklists
-- SET status = 'completed', updated_at = now()
-- WHERE event_id = (
--   SELECT id FROM public.events 
--   WHERE client_phone = '5585985456782' 
--   ORDER BY created_at DESC 
--   LIMIT 1
-- )
-- AND type = 'entrada'
-- RETURNING id, event_id, type, status;

-- OPÇÃO B: Se checklists tem estrutura diferente
-- (Execute SELECT * FROM checklists LIMIT 1 para ver)
