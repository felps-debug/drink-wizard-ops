-- Fix profile for mago@admin.com
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- 1. Get User ID from auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'mago@admin.com';

  IF v_user_id IS NOT NULL THEN
    -- 2. Upsert profile
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (v_user_id, 'Mago Admin', 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', full_name = 'Mago Admin';
    
    RAISE NOTICE 'Profile fixed for Mago Admin';
  ELSE
    RAISE NOTICE 'User mago@admin.com not found in auth.users';
  END IF;
END $$;
