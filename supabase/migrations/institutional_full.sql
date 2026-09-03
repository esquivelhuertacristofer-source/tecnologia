-- ============================================================================
-- MIGRACIÓN INSTITUCIONAL COMPLETA — CEN Financiera
-- Fecha: 2026-05-11 | Sprint Institucional
-- ============================================================================
-- INSTRUCCIONES: Ejecutar este archivo completo en
--   Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================================

-- ============================================================================
-- 1. TABLA: grupos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.grupos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       text NOT NULL UNIQUE,
  grado        text,             -- Ej: 'P4', 'S2', 'MIXTO'
  id_profesor  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_grupos_profesor ON public.grupos(id_profesor);

-- ============================================================================
-- 2. TABLA: alumnos_grupos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.alumnos_grupos (
  id_alumno  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_grupo   uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id_alumno, id_grupo)
);
ALTER TABLE public.alumnos_grupos ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_alumnos_grupos_grupo   ON public.alumnos_grupos(id_grupo);
CREATE INDEX IF NOT EXISTS idx_alumnos_grupos_alumno  ON public.alumnos_grupos(id_alumno);

-- ============================================================================
-- 3. TABLA: intentos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.intentos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id      text NOT NULL,
  status           text NOT NULL DEFAULT 'in_progress'
                   CHECK (status IN ('in_progress', 'completed', 'failed')),
  score            integer CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  tiempo_segundos  integer,
  last_step        integer,
  started_at       timestamptz NOT NULL DEFAULT now(),
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.intentos ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_intentos_user_id     ON public.intentos(user_id);
CREATE INDEX IF NOT EXISTS idx_intentos_activity_id ON public.intentos(activity_id);
CREATE INDEX IF NOT EXISTS idx_intentos_user_status ON public.intentos(user_id, status);

-- ============================================================================
-- 4. FUNCIÓN AUXILIAR: get_my_group_ids
--    Devuelve los IDs de grupos del profesor autenticado.
--    SECURITY DEFINER para evitar recursión RLS.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_my_group_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT id FROM public.grupos
    WHERE id_profesor = auth.uid()
  );
$$;

-- ============================================================================
-- 5. TRIGGER: handle_new_user — actualizado para alumnos_grupos
--    Reemplaza el anterior: además de crear el perfil, si hay group_id
--    en metadata Y ese grupo existe, vincula al alumno en alumnos_grupos.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id   text;
  v_grupo_uuid uuid;
BEGIN
  -- Insertar en profiles (igual que antes)
  INSERT INTO public.profiles (id, email, full_name, role, school_level, group_id)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
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

  -- Si hay group_id en metadata, intentar vincular en alumnos_grupos
  v_group_id := new.raw_user_meta_data->>'group_id';
  IF v_group_id IS NOT NULL AND v_group_id != '' THEN
    BEGIN
      v_grupo_uuid := v_group_id::uuid;
      INSERT INTO public.alumnos_grupos (id_alumno, id_grupo)
      VALUES (new.id, v_grupo_uuid)
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- Si el UUID es inválido o el grupo no existe, no bloquear el registro
      RAISE LOG 'handle_new_user: no se pudo vincular grupo % para usuario %', v_group_id, new.id;
    END;
  END IF;

  RETURN new;
END;
$$;

-- Re-crear el trigger (ya existe, lo reemplazamos)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 6. RLS POLICIES — profiles
-- ============================================================================
-- Alumno ve solo su propio perfil
DROP POLICY IF EXISTS "alumno_ve_su_perfil" ON public.profiles;
CREATE POLICY "alumno_ve_su_perfil" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR public.get_my_role() IN ('teacher', 'admin')
  );

-- Profesor ve perfiles de alumnos de sus grupos
DROP POLICY IF EXISTS "profesor_ve_alumnos_de_su_grupo" ON public.profiles;
CREATE POLICY "profesor_ve_alumnos_de_su_grupo" ON public.profiles
  FOR SELECT USING (
    public.get_my_role() = 'teacher'
    AND (
      auth.uid() = id
      OR id IN (
        SELECT id_alumno FROM public.alumnos_grupos
        WHERE id_grupo = ANY(public.get_my_group_ids())
      )
    )
  );

-- Admin ve todo
DROP POLICY IF EXISTS "admin_ve_todos_profiles" ON public.profiles;
CREATE POLICY "admin_ve_todos_profiles" ON public.profiles
  FOR ALL USING (public.get_my_role() = 'admin');

-- ============================================================================
-- 7. RLS POLICIES — grupos
-- ============================================================================
DROP POLICY IF EXISTS "profesor_ve_sus_grupos" ON public.grupos;
CREATE POLICY "profesor_ve_sus_grupos" ON public.grupos
  FOR SELECT USING (
    public.get_my_role() = 'teacher' AND id_profesor = auth.uid()
    OR public.get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS "admin_gestiona_grupos" ON public.grupos;
CREATE POLICY "admin_gestiona_grupos" ON public.grupos
  FOR ALL USING (public.get_my_role() = 'admin');

-- ============================================================================
-- 8. RLS POLICIES — alumnos_grupos
-- ============================================================================
DROP POLICY IF EXISTS "alumno_ve_su_membresia" ON public.alumnos_grupos;
CREATE POLICY "alumno_ve_su_membresia" ON public.alumnos_grupos
  FOR SELECT USING (id_alumno = auth.uid());

DROP POLICY IF EXISTS "profesor_ve_miembros_de_su_grupo" ON public.alumnos_grupos;
CREATE POLICY "profesor_ve_miembros_de_su_grupo" ON public.alumnos_grupos
  FOR SELECT USING (
    public.get_my_role() = 'teacher'
    AND id_grupo = ANY(public.get_my_group_ids())
  );

DROP POLICY IF EXISTS "admin_gestiona_alumnos_grupos" ON public.alumnos_grupos;
CREATE POLICY "admin_gestiona_alumnos_grupos" ON public.alumnos_grupos
  FOR ALL USING (public.get_my_role() = 'admin');

-- ============================================================================
-- 9. RLS POLICIES — intentos
-- ============================================================================
DROP POLICY IF EXISTS "alumno_ve_sus_intentos" ON public.intentos;
CREATE POLICY "alumno_ve_sus_intentos" ON public.intentos
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "profesor_ve_intentos_de_su_grupo" ON public.intentos;
CREATE POLICY "profesor_ve_intentos_de_su_grupo" ON public.intentos
  FOR SELECT USING (
    public.get_my_role() = 'teacher'
    AND user_id IN (
      SELECT id_alumno FROM public.alumnos_grupos
      WHERE id_grupo = ANY(public.get_my_group_ids())
    )
  );

DROP POLICY IF EXISTS "admin_ve_todos_intentos" ON public.intentos;
CREATE POLICY "admin_ve_todos_intentos" ON public.intentos
  FOR ALL USING (public.get_my_role() = 'admin');

-- ============================================================================
-- 10. RLS POLICIES — progress (mejoradas)
-- ============================================================================
DROP POLICY IF EXISTS "alumno_ve_su_progreso" ON public.progress;
CREATE POLICY "alumno_ve_su_progreso" ON public.progress
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "profesor_ve_progreso_de_su_grupo" ON public.progress;
CREATE POLICY "profesor_ve_progreso_de_su_grupo" ON public.progress
  FOR SELECT USING (
    public.get_my_role() = 'teacher'
    AND user_id IN (
      SELECT id_alumno FROM public.alumnos_grupos
      WHERE id_grupo = ANY(public.get_my_group_ids())
    )
  );

DROP POLICY IF EXISTS "admin_ve_todo_progreso" ON public.progress;
CREATE POLICY "admin_ve_todo_progreso" ON public.progress
  FOR ALL USING (public.get_my_role() = 'admin');

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
-- Verificación: correr después de ejecutar:
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1;
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname='public' ORDER BY tablename;
-- ============================================================================
