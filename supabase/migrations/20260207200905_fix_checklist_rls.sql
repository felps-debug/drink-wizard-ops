-- Fix RLS policies for checklists table
-- This migration ensures the checklists table exists and has proper RLS policies
-- allowing authenticated users (especially admin and chefe_bar roles) to insert/update

-- 1. Create checklists table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.checklists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  type text CHECK (type IN ('entrada', 'saida')),
  items jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pendente',
  checked_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Everyone can read checklists" ON public.checklists;
DROP POLICY IF EXISTS "Team can create checklists" ON public.checklists;
DROP POLICY IF EXISTS "Team can update checklists" ON public.checklists;
DROP POLICY IF EXISTS "Team can delete checklists" ON public.checklists;
DROP POLICY IF EXISTS "Authenticated users can manage checklists" ON public.checklists;

-- 4. Create comprehensive RLS policies

-- SELECT: Everyone authenticated can view checklists
CREATE POLICY "Everyone can read checklists"
  ON public.checklists
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: All authenticated users can create checklists
-- This is needed for bartenders to create entrance/exit checklists
CREATE POLICY "Authenticated users can create checklists"
  ON public.checklists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- UPDATE: Users can update checklists they created or if they are admin/chefe_bar
CREATE POLICY "Users can update checklists"
  ON public.checklists
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if user created it
    checked_by = auth.uid()
    OR
    -- Allow if user is admin or chefe_bar (check both roles array and cargo field)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (
        'admin' = ANY(profiles.roles)
        OR 'chefe_bar' = ANY(profiles.roles)
        OR profiles.cargo = 'admin'
        OR profiles.cargo = 'chefe_bar'
      )
    )
  );

-- DELETE: Only admins and chefe_bar can delete checklists
CREATE POLICY "Admins and chefe_bar can delete checklists"
  ON public.checklists
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (
        'admin' = ANY(profiles.roles)
        OR 'chefe_bar' = ANY(profiles.roles)
        OR profiles.cargo = 'admin'
        OR profiles.cargo = 'chefe_bar'
      )
    )
  );

-- 5. Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_checklists_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_checklists ON public.checklists;
CREATE TRIGGER set_updated_at_checklists
  BEFORE UPDATE ON public.checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_checklists_updated_at();

-- 6. Create useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklists_event_id ON public.checklists(event_id);
CREATE INDEX IF NOT EXISTS idx_checklists_type ON public.checklists(type);
CREATE INDEX IF NOT EXISTS idx_checklists_status ON public.checklists(status);
CREATE INDEX IF NOT EXISTS idx_checklists_checked_by ON public.checklists(checked_by);
CREATE INDEX IF NOT EXISTS idx_checklists_created_at ON public.checklists(created_at DESC);

-- 7. Add helpful comments
COMMENT ON TABLE public.checklists IS 'Event entrance and exit checklists for inventory tracking';
COMMENT ON COLUMN public.checklists.type IS 'Type of checklist: entrada (entrance) or saida (exit)';
COMMENT ON COLUMN public.checklists.items IS 'JSONB array of checklist items with quantities';
COMMENT ON COLUMN public.checklists.status IS 'Current status: pendente, em_andamento, or completed';
COMMENT ON COLUMN public.checklists.checked_by IS 'User who created/checked this checklist';
