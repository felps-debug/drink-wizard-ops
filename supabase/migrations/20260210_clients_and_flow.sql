-- 1. Atualização dos Enums (Status e Roles)
-- Postgres não permite ALTER TYPE dentro de transação, executar isoladamente se falhar
DO $$ BEGIN
    ALTER TYPE public.event_status ADD VALUE 'montado';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE public.event_status ADD VALUE 'entregue';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE public.user_role ADD VALUE 'entregador';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de Clientes (CRM)
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text,
  email text,
  cpf_cnpj text,
  notes text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- RLS para Clientes
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ver clientes ativos" ON public.clients;
CREATE POLICY "Todos podem ver clientes ativos" 
ON public.clients FOR SELECT TO authenticated 
USING (active = true);

DROP POLICY IF EXISTS "Admins e Chefe gerenciam clientes" ON public.clients;
CREATE POLICY "Admins e Chefe gerenciam clientes" 
ON public.clients FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.cargo IN ('admin', 'chefe_bar') -- Corrigido: role -> cargo
  )
);

-- 3. Vincular Eventos a Clientes
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
