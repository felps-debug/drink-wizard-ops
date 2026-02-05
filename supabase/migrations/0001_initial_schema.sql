-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'chefe_bar', 'bartender', 'montador');
CREATE TYPE event_status AS ENUM ('agendado', 'em_curso', 'finalizado', 'cancelado');
CREATE TYPE checklist_type AS ENUM ('entrada', 'saida');

-- 2. PROFILES (Extends Auth)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users on delete cascade not null primary key,
  full_name text,
  role user_role DEFAULT 'bartender',
  avatar_url text,
  updated_at timestamptz
);

-- 3. INGREDIENTS (Insumos)
CREATE TABLE public.ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  unit text NOT NULL, -- 'garrafa', 'kg', 'lata'
  category text, -- 'destilado', 'nao-alcoolico', 'fruta'
  min_stock integer DEFAULT 0,
  current_stock integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. EVENTS
CREATE TABLE public.events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name text NOT NULL,
  date timestamptz NOT NULL,
  location text,
  status event_status DEFAULT 'agendado',
  contract_value numeric DEFAULT 0,
  team_ids uuid[], -- Array of profile IDs assigned to event
  created_at timestamptz DEFAULT now()
);

-- 5. CHECKLISTS
CREATE TABLE public.event_checklists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  type checklist_type NOT NULL,
  items jsonb DEFAULT '{}', -- Snapshot: {"vodka_absolut": 2, "limao_kg": 5}
  checked_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- RLS POLICIES ------------------------------------------

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Ingredients
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view ingredients" 
ON public.ingredients FOR SELECT USING (true);

CREATE POLICY "Only Admin/Chefe can manage ingredients" 
ON public.ingredients FOR ALL 
USING (
  exists (
    select 1 from public.profiles
    where id = auth.uid() 
    and role in ('admin', 'chefe_bar')
  )
);

-- Events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view events" 
ON public.events FOR SELECT USING (true);

CREATE POLICY "Only Admin can manage events" 
ON public.events FOR ALL 
USING (
  exists (
    select 1 from public.profiles
    where id = auth.uid() 
    and role = 'admin'
  )
);

-- Checklists
ALTER TABLE public.event_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view checklists" 
ON public.event_checklists FOR SELECT USING (true);

CREATE POLICY "Team can create checklists" 
ON public.event_checklists FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Team can update checklists" 
ON public.event_checklists FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- TRIGGER FOR NEW USERS
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'bartender');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
