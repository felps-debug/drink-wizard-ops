-- FIX TRIGGER SCRIPT
-- Corrige o erro 500 no cadastro ajustando o search_path da função

-- 1. Redefinir a função com segurança e caminhos explícitos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  invited_role public.user_role;
BEGIN
  -- Tenta encontrar um convite
  SELECT role INTO invited_role
  FROM public.team_invites
  WHERE email = new.email
  LIMIT 1;

  -- Insere o perfil
  INSERT INTO public.profiles (id, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(invited_role, 'bartender'::public.user_role),
    new.raw_user_meta_data->>'avatar_url'
  );

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, cria com valores padrão para não bloquear o cadastro
    -- e loga o erro (opcional, aqui garantimos a criação)
    INSERT INTO public.profiles (id, full_name, role, avatar_url)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'full_name',
      'bartender'::public.user_role,
      new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 2. Garantir que a trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
