-- Run this in Supabase Dashboard > SQL Editor

-- FR1: Tabela de Histórico de Preços
CREATE TABLE IF NOT EXISTS public.magodosdrinks_historico_precos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insumo_id UUID REFERENCES public.magodosdrinks_insumos(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.magodosdrinks_historico_precos ENABLE ROW LEVEL SECURITY;

-- Admin Policy
CREATE POLICY "Admin all access historico" ON public.magodosdrinks_historico_precos
  FOR ALL TO authenticated
  USING (public.is_admin());

-- FR3: Tabela de Escalas
CREATE TABLE IF NOT EXISTS public.magodosdrinks_escalas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES public.magodosdrinks_eventos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.magodosdrinks_users(id) ON DELETE CASCADE,
  confirmado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.magodosdrinks_escalas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin all access escalas" ON public.magodosdrinks_escalas
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "Bartenders view own escalas" ON public.magodosdrinks_escalas
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Bartenders confirm own escalas" ON public.magodosdrinks_escalas
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- FR2: Tabela de Checklists (Updating name if needed)
CREATE TABLE IF NOT EXISTS public.magodosdrinks_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.magodosdrinks_eventos(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('entrada', 'saida')),
  items JSONB NOT NULL,
  status TEXT DEFAULT 'pendente',
  checked_by UUID REFERENCES public.magodosdrinks_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.magodosdrinks_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin all access checklists" ON public.magodosdrinks_checklists
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "Staff read checklists" ON public.magodosdrinks_checklists
  FOR SELECT TO authenticated
  USING (public.is_admin() OR auth.uid() IN (SELECT user_id FROM magodosdrinks_escalas WHERE evento_id = event_id));
