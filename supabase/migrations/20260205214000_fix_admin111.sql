-- Fix profile for admin111@mago.com
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- 1. Get User ID from auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin111@mago.com';

  IF v_user_id IS NOT NULL THEN
    -- 2. Upsert profile
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (v_user_id, 'Admin User111', 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', full_name = 'Admin User111';
    
    RAISE NOTICE 'Profile fixed for Admin User111';
  ELSE
    RAISE NOTICE 'User admin111@mago.com not found in auth.users';
  END IF;
END $$;
