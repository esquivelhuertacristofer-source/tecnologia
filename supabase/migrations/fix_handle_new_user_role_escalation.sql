-- CRÍTICO-001: Evitar escalada de privilegios en el trigger handle_new_user
-- El COALESCE anterior aceptaba el campo "role" de raw_user_meta_data,
-- permitiendo que cualquier invitación con metadata arbitraria inyectara un rol elevado.
-- Fix: siempre asignar 'student'; el rol se cambia manualmente desde el panel de admin.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    school_level,
    group_id,
    created_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student',  -- siempre student; admin asigna roles manualmente
    COALESCE(NEW.raw_user_meta_data->>'school_level', 'primary'),
    NEW.raw_user_meta_data->>'group_id',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
