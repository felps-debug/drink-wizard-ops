-- 0. Create user_role type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'chefe_bar', 'bartender', 'montador');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Create team_invites table
CREATE TABLE IF NOT EXISTS public.team_invites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    role user_role NOT NULL DEFAULT 'bartender',
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.profiles(id),
    UNIQUE(email)
);

-- 2. Enable RLS
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for team_invites

-- Admins and Chefe de Bar can view all invites
CREATE POLICY "Admins and Chefes can view invites"
ON public.team_invites
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'chefe_bar')
  )
);

-- Admins can insert invites
CREATE POLICY "Admins can insert invites"
ON public.team_invites
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can delete invites
CREATE POLICY "Admins can delete invites"
ON public.team_invites
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 4. Update the handle_new_user function to check for invites
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  invited_role user_role;
BEGIN
  -- Check if there is an invite for this email
  SELECT role INTO invited_role
  FROM public.team_invites
  WHERE email = new.email;

  -- Insert into profiles with the invited role, or default to 'bartender'
  INSERT INTO public.profiles (id, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(invited_role, 'bartender'), -- Use invited role if exists, else default
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Optional: Delete the invite after successful sign up?
  -- DELETE FROM public.team_invites WHERE email = new.email;
  -- Keeping it for now for history/debugging, or can be cleaned up later.

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
