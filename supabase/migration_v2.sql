-- MIGRACIÓN v2.1 — Ejecutar si el schema v1 ya está desplegado en Supabase
-- Añade: role, group_id, email a profiles + RLS docente + trigger actualizado
-- Seguro de ejecutar múltiples veces (usa IF NOT EXISTS / OR REPLACE)

-- 1. Nuevas columnas en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role       TEXT NOT NULL DEFAULT 'student'
    CHECK (role IN ('student', 'teacher', 'admin')),
  ADD COLUMN IF NOT EXISTS group_id   TEXT,
  ADD COLUMN IF NOT EXISTS email      TEXT;

-- Eliminar el ENUM school_level antiguo si existe (era demasiado restrictivo)
-- y convertir la columna a TEXT para soportar 'primary-1', 'secondary-3', etc.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'school_level'
      AND udt_name = 'school_level'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN school_level TYPE TEXT USING school_level::TEXT;
  END IF;
END $$;

-- 2. Rellenar email en perfiles existentes desde auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. Nuevas políticas RLS (eliminar las viejas con mismo nombre primero)
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "student_own_profile_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "student_own_profile_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "teacher_reads_group_profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles t
      WHERE t.id = auth.uid()
        AND t.role = 'teacher'
        AND (
          profiles.group_id = ANY(string_to_array(t.group_id, ','))
          OR profiles.group_id IS NULL
        )
    )
  );

CREATE POLICY "admin_reads_all_profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles a
      WHERE a.id = auth.uid() AND a.role = 'admin'
    )
  );

-- Docente lee progreso de sus alumnos
DROP POLICY IF EXISTS "teacher_reads_group_progress" ON public.progress;

CREATE POLICY "teacher_reads_group_progress" ON public.progress
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles t
      JOIN public.profiles s ON s.id = progress.user_id
      WHERE t.id = auth.uid()
        AND t.role = 'teacher'
        AND (
          s.group_id = ANY(string_to_array(t.group_id, ','))
          OR s.group_id IS NULL
        )
    )
  );

-- 4. Trigger actualizado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, role, school_level, group_id)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    -- CORREGIDO 1-sep-2026 (auditoría). Aquí decía
    -- `COALESCE(new.raw_user_meta_data->>'role', 'student')`, que toma el rol
    -- del metadata que el PROPIO usuario manda al registrarse: cualquiera con
    -- la anon key (va en cada página) hacía
    -- `signUp({..., options:{ data:{ role:'admin' }}})` contra el REST de
    -- Supabase Auth —sin pasar por la UI— y nacía administrador.
    -- `fix_handle_new_user_role_escalation.sql` ya lo arreglaba, pero estos
    -- archivos lo reintroducían, y la cabecera de `security_triggers.sql`
    -- manda ejecutarlos enteros «para restaurar la seguridad»: el remedio
    -- reponía la enfermedad. El rol lo asigna un administrador a mano.
    'student',
    COALESCE(new.raw_user_meta_data->>'school_level', 'primary'),
    new.raw_user_meta_data->>'group_id'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
