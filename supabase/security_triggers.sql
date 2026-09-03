-- supabase/security_triggers.sql
-- ============================================================================
-- TRIGGERS Y FUNCIONES DE SEGURIDAD — CEN Plataforma de Educación Financiera
-- ============================================================================
-- Versionado: 2026-05-10
-- Capturado del proyecto Supabase: kmskaebltcbqgqrgrilq
--
-- Este archivo contiene las funciones y triggers SECURITY DEFINER que
-- protegen la base de datos contra:
--   - Escalada de privilegios (estudiantes promoviéndose a admin/teacher)
--   - Recursión infinita en RLS policies de profiles
--   - Tablas nuevas creadas sin RLS activado
--
-- IMPORTANTE: Si el proyecto Supabase se migra o recrea, ejecutar este
-- archivo completo en el SQL Editor para restaurar la seguridad.
-- ============================================================================

-- ============================================================================
-- FUNCIÓN 1: get_my_role
-- ============================================================================
-- Devuelve el rol del usuario autenticado actual.
-- SECURITY DEFINER permite saltar RLS para evitar recursión infinita en las
-- policies de la tabla profiles.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- SECURITY DEFINER es la clave para saltar el RLS en la búsqueda del rol
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- FUNCIÓN 2: handle_new_user
-- ============================================================================
-- Crea automáticamente un registro en public.profiles cuando un nuevo usuario
-- se registra en auth.users.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    );
  RETURN new;
END;
$$;

-- ============================================================================
-- FUNCIÓN 3: protect_user_profile_fields
-- ============================================================================
-- Previene escalada de privilegios:
--   - Estudiantes NO pueden cambiar su role, group_id, email, school_level
--   - Profesores NO pueden promoverse a admin
-- Se ejecuta BEFORE UPDATE en la tabla profiles.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.protect_user_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_my_role() = 'student' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Seguridad: Un alumno no puede cambiar su propio rol.';
    END IF;
    IF NEW.group_id IS DISTINCT FROM OLD.group_id THEN
      RAISE EXCEPTION 'Seguridad: No puedes cambiar de grupo sin autorizacion del profesor.';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Seguridad: El email solo puede ser modificado por administradores.';
    END IF;
    IF NEW.school_level IS DISTINCT FROM OLD.school_level THEN
      RAISE EXCEPTION 'Seguridad: No puedes cambiar tu nivel escolar autonomamente.';
    END IF;
  END IF;

  -- CORREGIDO 1-sep-2026 (auditoría). La comparación era literal contra
  -- 'admin', y desde `add_super_admin_role.sql` (17-may-2026) existe un rol MÁS
  -- alto: 'super_admin'. La política de UPDATE de `profiles` es `auth.uid()=id`,
  -- así que un profesor hacía
  -- `.from('profiles').update({role:'super_admin'}).eq('id', auth.uid())` desde
  -- el navegador: `NEW.role` no era 'admin', la excepción no saltaba, y se
  -- quedaba con el rol más alto de la plataforma. Se bloquea la lista entera de
  -- roles elevados, y se añade el caso simétrico —un admin tampoco se asciende
  -- solo a super_admin— porque el mismo agujero existía un escalón más arriba.
  IF public.get_my_role() = 'teacher' AND auth.uid() = NEW.id THEN
    IF NEW.role IS DISTINCT FROM OLD.role AND NEW.role IN ('admin', 'super_admin') THEN
      RAISE EXCEPTION 'Seguridad: Un profesor no puede promoverse a administrador.';
    END IF;
  END IF;

  IF public.get_my_role() = 'admin' AND auth.uid() = NEW.id THEN
    IF NEW.role IS DISTINCT FROM OLD.role AND NEW.role = 'super_admin' THEN
      RAISE EXCEPTION 'Seguridad: Un administrador no puede promoverse a super administrador.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- FUNCIÓN 4: rls_auto_enable
-- ============================================================================
-- Event trigger function que automáticamente activa Row Level Security en
-- cualquier tabla nueva creada en el schema public.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL
        AND cmd.schema_name IN ('public')
        AND cmd.schema_name NOT IN ('pg_catalog','information_schema')
        AND cmd.schema_name NOT LIKE 'pg_toast%'
        AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)',
          cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;

-- ============================================================================
-- TRIGGER 1: ensure_profile_integrity
-- ============================================================================
-- Activa protect_user_profile_fields() antes de cada UPDATE en profiles.
-- ============================================================================

DROP TRIGGER IF EXISTS ensure_profile_integrity ON public.profiles;

CREATE TRIGGER ensure_profile_integrity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_profile_fields();

-- ============================================================================
-- TRIGGER 2: on_auth_user_created
-- ============================================================================
-- Activa handle_new_user() después de cada registro en auth.users.
-- NOTA: Este trigger está en el schema 'auth' que es gestionado por Supabase.
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- EVENT TRIGGER: ensure_rls
-- ============================================================================
-- Activa rls_auto_enable() al final de cualquier comando DDL que cree tabla.
-- ============================================================================

DROP EVENT TRIGGER IF EXISTS ensure_rls;

CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();

-- ============================================================================
-- FIN del archivo
-- ============================================================================
