-- 0. Types & Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'chefe_bar', 'bartender', 'montador');
    CREATE TYPE event_status AS ENUM ('agendado', 'em_curso', 'finalizado', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Profiles (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  role user_role DEFAULT 'bartender',
  avatar_url text,
  updated_at timestamptz
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Team Invites
CREATE TABLE IF NOT EXISTS public.team_invites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'bartender',
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.profiles(id)
);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Chefes can view invites"
ON public.team_invites FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'chefe_bar')
  )
);

CREATE POLICY "Admins can insert invites"
ON public.team_invites FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete invites"
ON public.team_invites FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 3. Ingredients (Insumos)
CREATE TABLE IF NOT EXISTS public.ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  unit text NOT NULL,
  category text NOT NULL,
  min_stock integer DEFAULT 0,
  current_price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read ingredients"
ON public.ingredients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and Chefe can manage ingredients"
ON public.ingredients FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'chefe_bar')
  )
);

-- 4. Events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name text NOT NULL,
  client_phone text,
  date timestamptz NOT NULL,
  location text NOT NULL,
  status event_status DEFAULT 'agendado',
  financial_value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read events"
ON public.events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and Chefe can manage events"
ON public.events FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'chefe_bar')
  )
);

-- 5. Checklists
CREATE TABLE IF NOT EXISTS public.event_checklists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  type text CHECK (type IN ('entrada', 'saida')),
  items jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pendente',
  checked_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.event_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read checklists"
ON public.event_checklists FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team can update checklists"
ON public.event_checklists FOR ALL TO authenticated USING (true);


-- 6. Trigger for New User Creation (with Invite Check)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  invited_role user_role;
BEGIN
  -- Check if there is an invite for this email
  SELECT role INTO invited_role
  FROM public.team_invites
  WHERE email = new.email;

  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(invited_role, 'bartender'), -- Use invited role if exists, else default
    new.raw_user_meta_data->>'avatar_url'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (drop first to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
