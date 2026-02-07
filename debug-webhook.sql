-- ==========================================
-- DEBUG: Por que o webhook não disparou?
-- ==========================================

-- 1. Verificar se o checklist foi atualizado
SELECT 
  'CHECKLIST ATUALIZADO?' as debug,
  id,
  event_id,
  type,
  status,
  created_at
FROM public.checklists
WHERE event_id IN (
  SELECT id FROM public.events 
  WHERE client_phone = '5585985456782'
)
ORDER BY created_at DESC;

-- 2. Verificar se o evento existe
SELECT 
  'EVENTO EXISTE?' as debug,
  id,
  client_name,
  client_phone,
  location
FROM public.events
WHERE client_phone = '5585985456782'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Verificar se a automação está ativa
SELECT 
  'AUTOMAÇÃO ATIVA?' as debug,
  id,
  name,
  active,
  trigger_event,
  action_config
FROM public.automation_triggers
WHERE trigger_event = 'checklist_entrada'
ORDER BY created_at DESC
LIMIT 1;

-- 4. Listar todos os webhooks configurados
SELECT 
  'WEBHOOKS CONFIGURADOS?' as debug,
  id,
  name,
  type,
  table_name,
  events,
  url
FROM supabase_functions.hooks
WHERE table_name = 'checklists' OR table_name = 'events';
