-- ==========================================
-- 🚨 DEVELOPMENT ONLY - PURGE & SEED SCRIPT
-- ==========================================
-- ATENÇÃO: Este script APAGA TODOS OS DADOS
-- Use apenas em ambiente de desenvolvimento!
-- ==========================================

-- ==========================================
-- PARTE 1: PURGE TOTAL (Limpa Tudo)
-- ==========================================

-- Desabilitar triggers temporariamente
SET session_replication_role = 'replica';

-- Limpar todas as tabelas (mantém estrutura)
TRUNCATE TABLE public.automation_triggers CASCADE;
TRUNCATE TABLE public.magodosdrinks_assignments CASCADE;
TRUNCATE TABLE public.magodosdrinks_package_items CASCADE;
TRUNCATE TABLE public.magodosdrinks_packages CASCADE;
TRUNCATE TABLE public.operational_costs CASCADE;
TRUNCATE TABLE public.checklists CASCADE;
TRUNCATE TABLE public.events CASCADE;
TRUNCATE TABLE public.magodosdrinks_staff CASCADE;
TRUNCATE TABLE public.ingredients CASCADE;
TRUNCATE TABLE public.team_invites CASCADE;
-- NÃO limpar profiles pois tem dados de autenticação

-- Reabilitar triggers
SET session_replication_role = 'origin';

-- ==========================================
-- PARTE 2: SEED - Dados de Teste
-- ==========================================

-- 2.0 GARANTIR COLUNAS EXISTEM
DO $$
BEGIN
  -- Adicionar current_price em ingredients se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ingredients' AND column_name = 'current_price'
  ) THEN
    ALTER TABLE public.ingredients ADD COLUMN current_price numeric DEFAULT 0;
  END IF;

  -- Adicionar client_phone em events se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'client_phone'
  ) THEN
    ALTER TABLE public.events ADD COLUMN client_phone text;
  END IF;

  -- Adicionar package_id em events se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'package_id'
  ) THEN
    ALTER TABLE public.events ADD COLUMN package_id uuid REFERENCES magodosdrinks_packages(id);
  END IF;

  -- Adicionar observations em events se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'observations'
  ) THEN
    ALTER TABLE public.events ADD COLUMN observations text;
  END IF;

  -- Criar tabela magodosdrinks_staff se não existir
  CREATE TABLE IF NOT EXISTS public.magodosdrinks_staff (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    phone text NOT NULL,
    role text NOT NULL,
    daily_rate numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- Habilitar RLS para staff
  ALTER TABLE public.magodosdrinks_staff ENABLE ROW LEVEL SECURITY;

  -- Política: todos podem ler
  DROP POLICY IF EXISTS "Everyone can read staff" ON public.magodosdrinks_staff;
  CREATE POLICY "Everyone can read staff" ON public.magodosdrinks_staff
    FOR SELECT TO authenticated USING (true);

  -- Política: admin pode gerenciar
  DROP POLICY IF EXISTS "Admins can manage staff" ON public.magodosdrinks_staff;
  CREATE POLICY "Admins can manage staff" ON public.magodosdrinks_staff
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'admin' OR profiles.cargo = 'admin')
      )
    );
END $$;

-- 2.1 INSUMOS (Ingredientes)
INSERT INTO public.ingredients (name, unit, category, min_stock, current_price) VALUES
-- Destilados
('Vodka Absolut', 'garrafa', 'destilados', 12, 85.00),
('Vodka Smirnoff', 'garrafa', 'destilados', 10, 65.00),
('Gin Beefeater', 'garrafa', 'destilados', 10, 95.00),
('Gin Tanqueray', 'garrafa', 'destilados', 8, 110.00),
('Whisky Red Label', 'garrafa', 'destilados', 5, 110.00),
('Whisky Jack Daniels', 'garrafa', 'destilados', 5, 145.00),
('Cachaça 51', 'garrafa', 'destilados', 15, 28.00),
('Rum Bacardi', 'garrafa', 'destilados', 8, 75.00),

-- Licores
('Cointreau', 'garrafa', 'licores', 5, 85.00),
('Triple Sec', 'garrafa', 'licores', 8, 45.00),
('Licor de Maracujá', 'garrafa', 'licores', 6, 35.00),
('Amaretto', 'garrafa', 'licores', 4, 65.00),

-- Refrigerantes e Mixers
('Coca-Cola 2L', 'garrafa', 'refrigerantes', 50, 8.50),
('Sprite 2L', 'garrafa', 'refrigerantes', 40, 8.50),
('Água Tônica', 'garrafa', 'refrigerantes', 60, 6.00),
('Red Bull', 'lata', 'energéticos', 100, 12.00),
('Suco de Limão', 'litro', 'sucos', 20, 15.00),
('Suco de Maracujá', 'litro', 'sucos', 15, 18.00),

-- Gelo e Complementos
('Gelo Cubo', 'saco', 'gelo', 50, 12.00),
('Gelo Escama', 'saco', 'gelo', 30, 18.00),
('Limão Tahiti', 'kg', 'frutas', 20, 8.00),
('Hortelã', 'maço', 'ervas', 15, 5.00),
('Açúcar', 'kg', 'complementos', 10, 6.00),

-- Descartáveis
('Copo 300ml', 'pacote', 'descartáveis', 100, 25.00),
('Copo 500ml', 'pacote', 'descartáveis', 80, 32.00),
('Canudo Biodegradável', 'pacote', 'descartáveis', 50, 18.00),
('Guardanapo', 'pacote', 'descartáveis', 60, 12.00);

-- 2.2 PACOTES
DO $$
DECLARE
  v_pacote_basico_id uuid;
  v_pacote_premium_id uuid;
  v_pacote_corporativo_id uuid;
BEGIN
  -- Pacote Básico
  INSERT INTO public.magodosdrinks_packages (name, description)
  VALUES ('Básico', 'Pacote básico com drinks essenciais para eventos pequenos')
  RETURNING id INTO v_pacote_basico_id;

  INSERT INTO public.magodosdrinks_package_items (package_id, ingredient_id, quantity)
  SELECT v_pacote_basico_id, id, qty FROM (VALUES
    ((SELECT id FROM ingredients WHERE name = 'Vodka Smirnoff'), 3),
    ((SELECT id FROM ingredients WHERE name = 'Cachaça 51'), 4),
    ((SELECT id FROM ingredients WHERE name = 'Coca-Cola 2L'), 20),
    ((SELECT id FROM ingredients WHERE name = 'Sprite 2L'), 15),
    ((SELECT id FROM ingredients WHERE name = 'Gelo Cubo'), 15),
    ((SELECT id FROM ingredients WHERE name = 'Copo 300ml'), 10)
  ) AS items(id, qty);

  -- Pacote Premium
  INSERT INTO public.magodosdrinks_packages (name, description)
  VALUES ('Premium', 'Pacote premium com destilados especiais e drinks autorais')
  RETURNING id INTO v_pacote_premium_id;

  INSERT INTO public.magodosdrinks_package_items (package_id, ingredient_id, quantity)
  SELECT v_pacote_premium_id, id, qty FROM (VALUES
    ((SELECT id FROM ingredients WHERE name = 'Vodka Absolut'), 5),
    ((SELECT id FROM ingredients WHERE name = 'Gin Tanqueray'), 4),
    ((SELECT id FROM ingredients WHERE name = 'Whisky Jack Daniels'), 3),
    ((SELECT id FROM ingredients WHERE name = 'Cointreau'), 2),
    ((SELECT id FROM ingredients WHERE name = 'Red Bull'), 50),
    ((SELECT id FROM ingredients WHERE name = 'Água Tônica'), 40),
    ((SELECT id FROM ingredients WHERE name = 'Gelo Escama'), 20),
    ((SELECT id FROM ingredients WHERE name = 'Limão Tahiti'), 5),
    ((SELECT id FROM ingredients WHERE name = 'Hortelã'), 10),
    ((SELECT id FROM ingredients WHERE name = 'Copo 500ml'), 15)
  ) AS items(id, qty);

  -- Pacote Corporativo
  INSERT INTO public.magodosdrinks_packages (name, description)
  VALUES ('Corporativo', 'Pacote ideal para eventos empresariais e networking')
  RETURNING id INTO v_pacote_corporativo_id;

  INSERT INTO public.magodosdrinks_package_items (package_id, ingredient_id, quantity)
  SELECT v_pacote_corporativo_id, id, qty FROM (VALUES
    ((SELECT id FROM ingredients WHERE name = 'Vodka Absolut'), 4),
    ((SELECT id FROM ingredients WHERE name = 'Gin Beefeater'), 3),
    ((SELECT id FROM ingredients WHERE name = 'Whisky Red Label'), 4),
    ((SELECT id FROM ingredients WHERE name = 'Coca-Cola 2L'), 30),
    ((SELECT id FROM ingredients WHERE name = 'Sprite 2L'), 20),
    ((SELECT id FROM ingredients WHERE name = 'Água Tônica'), 25),
    ((SELECT id FROM ingredients WHERE name = 'Suco de Limão'), 8),
    ((SELECT id FROM ingredients WHERE name = 'Gelo Cubo'), 25),
    ((SELECT id FROM ingredients WHERE name = 'Copo 300ml'), 20)
  ) AS items(id, qty);
END $$;

-- 2.3 EQUIPE (Staff)
INSERT INTO public.magodosdrinks_staff (name, phone, role, daily_rate) VALUES
('Carlos Bartender', '5585988887777', 'bartender', 180.00),
('Ana Mixologista', '5585977776666', 'bartender', 200.00),
('João Chefe de Bar', '5585966665555', 'chefe_bar', 280.00),
('Maria Montadora', '5585955554444', 'montador', 150.00),
('Pedro Auxiliar', '5585944443333', 'bartender', 160.00),
('Julia Expert', '5585933332222', 'bartender', 220.00),
('Roberto Montador', '5585922221111', 'montador', 150.00);

-- 2.4 EVENTOS
DO $$
DECLARE
  v_evento1_id uuid;
  v_evento2_id uuid;
  v_evento3_id uuid;
  v_evento4_id uuid;
  v_staff_id uuid;
BEGIN
  -- Evento 1: Casamento Silva & Souza
  INSERT INTO public.events (
    client_name,
    client_phone,
    date,
    location,
    status,
    financial_value,
    package_id,
    observations
  ) VALUES (
    'Casamento Silva & Souza',
    '5585991234567',
    NOW() + INTERVAL '5 days',
    'Espaço Jardim das Flores - Aldeota, Fortaleza',
    'agendado',
    15000.00,
    (SELECT id FROM magodosdrinks_packages WHERE name = 'Premium' LIMIT 1),
    'Casamento para 200 pessoas. Cliente pediu gin especial e drinks personalizados.'
  ) RETURNING id INTO v_evento1_id;

  -- Evento 2: Festival de Verão
  INSERT INTO public.events (
    client_name,
    client_phone,
    date,
    location,
    status,
    financial_value,
    package_id
  ) VALUES (
    'Festival de Verão 2026',
    '5585987654321',
    NOW() + INTERVAL '3 days',
    'Praia do Futuro - Beach Club',
    'em_curso',
    25000.00,
    (SELECT id FROM magodosdrinks_packages WHERE name = 'Premium' LIMIT 1)
  ) RETURNING id INTO v_evento2_id;

  -- Evento 3: Aniversário Corporativo
  INSERT INTO public.events (
    client_name,
    client_phone,
    date,
    location,
    status,
    financial_value,
    package_id
  ) VALUES (
    'Empresa TechCorp - 10 Anos',
    '5585912345678',
    NOW() + INTERVAL '7 days',
    'Hotel Gran Marquise - Salão Principal',
    'agendado',
    18000.00,
    (SELECT id FROM magodosdrinks_packages WHERE name = 'Corporativo' LIMIT 1)
  ) RETURNING id INTO v_evento3_id;

  -- Evento 4: Evento Passado (Finalizado)
  INSERT INTO public.events (
    client_name,
    client_phone,
    date,
    location,
    status,
    financial_value,
    package_id
  ) VALUES (
    'Festa dos Amigos 2025',
    '5585998887777',
    NOW() - INTERVAL '2 days',
    'Mansão do Forró - Aquiraz',
    'finalizado',
    8000.00,
    (SELECT id FROM magodosdrinks_packages WHERE name = 'Básico' LIMIT 1)
  ) RETURNING id INTO v_evento4_id;

  -- Adicionar escala para Evento 1 (usando user_id, não staff_id)
  -- Nota: magodosdrinks_assignments usa user_id (referência a profiles)
  -- Então vamos pular as escalas por enquanto, pois staff é separado de users
END $$;

-- 2.5 AUTOMAÇÕES
INSERT INTO public.automation_triggers (
  created_by,
  name,
  description,
  active,
  trigger_event,
  action_type,
  action_config
) VALUES
-- Automação 1: Confirmação de Chegada
(
  (SELECT id FROM auth.users WHERE email = 'xavier.davimot1@gmail.com' LIMIT 1),
  'Confirmação de Chegada no Evento',
  'Envia WhatsApp quando equipe chega no local',
  true,
  'checklist_entrada',
  'whatsapp',
  jsonb_build_object(
    'message', 'Olá {cliente}! 🎉 Chegamos em {local}. Tudo pronto para seu evento começar! Equipe Mago dos Drinks.',
    'delay_seconds', 0
  )
),
-- Automação 2: Agradecimento Pós-Evento
(
  (SELECT id FROM auth.users WHERE email = 'xavier.davimot1@gmail.com' LIMIT 1),
  'Agradecimento Pós-Evento',
  'Agradece cliente após finalização do evento',
  true,
  'checklist_saida',
  'whatsapp',
  jsonb_build_object(
    'message', 'Obrigado por confiar na Mago dos Drinks! 🍹 Foi um prazer estar no seu evento. Até a próxima!',
    'delay_seconds', 300
  )
),
-- Automação 3: Lembrete 24h Antes
(
  (SELECT id FROM auth.users WHERE email = 'xavier.davimot1@gmail.com' LIMIT 1),
  'Lembrete 24h Antes do Evento',
  'Lembra cliente 1 dia antes',
  true,
  'event_reminder_24h',
  'whatsapp',
  jsonb_build_object(
    'message', 'Oi {cliente}! Faltam 24h para seu evento em {local}. Estamos prontos! 🎊',
    'delay_seconds', 0
  )
);

-- ==========================================
-- PARTE 3: VERIFICAÇÃO (Mostra o que foi criado)
-- ==========================================

-- Resumo da Massa de Dados
SELECT
  '✅ INSUMOS CRIADOS' as categoria,
  COUNT(*) as quantidade
FROM public.ingredients
UNION ALL
SELECT
  '✅ PACOTES CRIADOS',
  COUNT(*)
FROM public.magodosdrinks_packages
UNION ALL
SELECT
  '✅ EQUIPE CADASTRADA',
  COUNT(*)
FROM public.magodosdrinks_staff
UNION ALL
SELECT
  '✅ EVENTOS CRIADOS',
  COUNT(*)
FROM public.events
UNION ALL
SELECT
  '✅ AUTOMAÇÕES ATIVAS',
  COUNT(*)
FROM public.automation_triggers
WHERE active = true;

-- Detalhe dos Eventos
SELECT
  'EVENTO' as tipo,
  client_name as nome,
  to_char(date, 'DD/MM/YYYY HH24:MI') as data,
  location as local,
  status,
  'R$ ' || financial_value::text as valor
FROM public.events
ORDER BY date;

-- Detalhe dos Pacotes
SELECT
  'PACOTE' as tipo,
  p.name as pacote,
  COUNT(pi.id) as itens,
  string_agg(i.name, ', ' ORDER BY i.name) as ingredientes
FROM public.magodosdrinks_packages p
LEFT JOIN public.magodosdrinks_package_items pi ON p.id = pi.package_id
LEFT JOIN public.ingredients i ON pi.ingredient_id = i.id
GROUP BY p.id, p.name
ORDER BY p.name;

-- ==========================================
-- ✅ SCRIPT FINALIZADO
-- ==========================================
-- Banco de dados limpo e populado com dados de teste
-- Pronto para desenvolvimento!
-- ==========================================
