-- 1. Packages Table
CREATE TABLE IF NOT EXISTS public.magodosdrinks_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT magodosdrinks_packages_pkey PRIMARY KEY (id)
);

-- 2. Package Items Table (links packages to ingredients)
CREATE TABLE IF NOT EXISTS public.magodosdrinks_package_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.magodosdrinks_packages(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT magodosdrinks_package_items_pkey PRIMARY KEY (id),
  CONSTRAINT magodosdrinks_package_items_unique UNIQUE (package_id, ingredient_id)
);

-- Enable RLS
ALTER TABLE public.magodosdrinks_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magodosdrinks_package_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Packages
CREATE POLICY "Everyone can read packages"
  ON public.magodosdrinks_packages
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage packages"
  ON public.magodosdrinks_packages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (
        'admin' = ANY(profiles.roles) OR 
        profiles.cargo = 'admin'
      )
    )
  );

-- RLS Policies for Package Items
CREATE POLICY "Everyone can read package items"
  ON public.magodosdrinks_package_items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage package items"
  ON public.magodosdrinks_package_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (
        'admin' = ANY(profiles.roles) OR 
        profiles.cargo = 'admin'
      )
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_package_items_package_id ON public.magodosdrinks_package_items(package_id);
CREATE INDEX IF NOT EXISTS idx_package_items_ingredient_id ON public.magodosdrinks_package_items(ingredient_id);

-- Auto-update timestamp trigger for packages
CREATE OR REPLACE FUNCTION public.handle_updated_at_packages()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropar se já existir para evitar erro de duplicata ao rodar novamente
DROP TRIGGER IF EXISTS set_updated_at_packages ON public.magodosdrinks_packages;
CREATE TRIGGER set_updated_at_packages
  BEFORE UPDATE ON public.magodosdrinks_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at_packages();

-- Seed some default packages
INSERT INTO public.magodosdrinks_packages (name, description) VALUES
  ('Básico', 'Pacote básico com drinks essenciais'),
  ('Premium', 'Pacote premium com drinks especiais e destilados premium'),
  ('Corporativo', 'Pacote para eventos corporativos')
ON CONFLICT DO NOTHING;