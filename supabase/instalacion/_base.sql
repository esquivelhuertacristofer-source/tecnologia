/* ==========================================================================
   TECNIA - INSTALACION COMPLETA DEL ESQUEMA

   UN SOLO PEGADO. Sustituye a los nueve archivos SQL del repositorio:
   schema.sql, security_triggers.sql, indexes.sql, migration_v2.sql,
   add_super_admin_role.sql, institutional_full.sql, los dos fix_ y
   estudio_impacto.sql, que va incluido al final.

   NO ES UNA MIGRACION, ES UNA INSTALACION. La base esta vacia, asi que se
   pone la forma final en vez de repetir la historia y despues parchearla.

   Por que no se aplican los archivos sueltos, en corto:
     - handle_new_user esta definida cinco veces y no son equivalentes.
     - Tres policies leen public.profiles desde una policy de public.profiles,
       lo que produce 42P17 y deja a todo usuario autenticado sin poder leer
       su perfil.
     - El orden de los archivos no es el de las dependencias: las funciones
       auxiliares tienen que existir ANTES que las policies que las llaman.
   El detalle esta en docs/ALTA_ESCUELA.md.

   Es idempotente. Se puede volver a ejecutar entero.
   Termina con una verificacion: si no sale ninguna fila de problema, la
   primera linea dice INSTALACION COMPLETA.
   ========================================================================== */

/* --- 1. EXTENSIONES ---------------------------------------------------- */

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/* --- 2. TIPOS ----------------------------------------------------------
   CREATE TYPE no admite IF NOT EXISTS, de ahi el bloque.                  */

DO $bloque$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_category') THEN
    CREATE TYPE public.content_category AS ENUM ('video', 'didactic', 'printable', 'guide');
  END IF;
END
$bloque$;

/* --- 3. ESCUELAS: LA UNIDAD DE AISLAMIENTO -----------------------------
   Sin esta tabla no hay multi-escuela: grupos.nombre era UNIQUE global y
   dos colegios no podian tener ambos un "1A". La clave es
   UNIQUE (escuela_id, nombre) mas abajo.                                  */

CREATE TABLE IF NOT EXISTS public.escuelas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text NOT NULL,
  cct        text UNIQUE,
  nivel      text CHECK (nivel IN ('primaria','secundaria','bachillerato','mixto')),
  estado     text,
  municipio  text,
  activa     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

/* --- 4. PERFILES -------------------------------------------------------
   role va en ingles porque asi lo leen las policies y supabase-server.ts.
   El rol que ve la interfaz vive aparte, en app_metadata.rol, en espanol.
   Los dos se escriben juntos desde el alta masiva.                        */

CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text,
  full_name    text,
  avatar_url   text,
  role         text NOT NULL DEFAULT 'student',
  escuela_id   uuid REFERENCES public.escuelas(id) ON DELETE SET NULL,
  school_level text DEFAULT 'primary',
  grade        integer,
  group_id     text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS escuela_id uuid REFERENCES public.escuelas(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade integer;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'teacher', 'admin', 'super_admin'));

COMMENT ON COLUMN public.profiles.role IS
  'student = alumno, teacher = docente, admin = administrador de una escuela, super_admin = administrador global de la plataforma.';

/* --- 5. CONTENIDO ------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS public.lessons (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         text NOT NULL,
  description   text,
  level         text NOT NULL,
  grade         integer NOT NULL,
  unit_number   integer NOT NULL,
  thumbnail_url text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_contents (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id   uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  category    public.content_category NOT NULL,
  title       text NOT NULL,
  url         text NOT NULL,
  config      jsonb,
  order_index integer DEFAULT 0
);

/* --- 6. GRUPOS Y MEMBRESIA --------------------------------------------- */

CREATE TABLE IF NOT EXISTS public.grupos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  grado       text,
  escuela_id  uuid NOT NULL REFERENCES public.escuelas(id) ON DELETE CASCADE,
  id_profesor uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT grupos_nombre_por_escuela UNIQUE (escuela_id, nombre)
);

CREATE TABLE IF NOT EXISTS public.alumnos_grupos (
  id_alumno  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_grupo   uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id_alumno, id_grupo)
);

/* --- 7. PROGRESO E INTENTOS -------------------------------------------- */

CREATE TABLE IF NOT EXISTS public.user_progress (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.lesson_contents(id) ON DELETE CASCADE,
  completed  boolean DEFAULT false,
  last_watched_second integer DEFAULT 0,
  score      integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

CREATE TABLE IF NOT EXISTS public.progress (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id  text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_id)
);

CREATE TABLE IF NOT EXISTS public.intentos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id     text NOT NULL,
  status          text NOT NULL DEFAULT 'in_progress'
                  CHECK (status IN ('in_progress', 'completed', 'failed')),
  score           integer CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  tiempo_segundos integer,
  last_step       integer,
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

/* --- 8. FUNCIONES AUXILIARES -------------------------------------------
   VAN ANTES QUE LAS POLICIES, Y ESE ES EL ARREGLO DE ORDEN MAS IMPORTANTE
   DE TODO EL ARCHIVO.

   Una policy sobre public.profiles que hace SELECT sobre public.profiles
   vuelve a disparar las policies de profiles: Postgres lo corta con
   "42P17 infinite recursion detected in policy for relation profiles" y a
   partir de ahi NINGUN usuario autenticado puede leer su perfil. En el
   repositorio habia tres policies asi (schema.sql y
   fix_rls_alumno_ve_su_perfil.sql). Aqui todas preguntan por el rol a
   traves de get_my_role(), que es SECURITY DEFINER y por eso no vuelve a
   entrar en RLS.                                                          */

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$fn$;

CREATE OR REPLACE FUNCTION public.mi_escuela()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT escuela_id FROM public.profiles WHERE id = auth.uid();
$fn$;

CREATE OR REPLACE FUNCTION public.get_my_group_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT COALESCE(ARRAY(
    SELECT id FROM public.grupos WHERE id_profesor = auth.uid()
  ), ARRAY[]::uuid[]);
$fn$;

CREATE OR REPLACE FUNCTION public.mis_alumnos()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT COALESCE(ARRAY(
    SELECT ag.id_alumno FROM public.alumnos_grupos ag
    WHERE ag.id_grupo = ANY(public.get_my_group_ids())
  ), ARRAY[]::uuid[]);
$fn$;

/* --- 9. ALTA DE USUARIO ------------------------------------------------

   El rol SIEMPRE nace 'student'. Esta linea es la que cierra la escalada
   de privilegios: si se toma de raw_user_meta_data, cualquiera con la anon
   key -que viaja en cada pagina- puede registrarse como admin llamando al
   REST de Auth sin pasar por la interfaz. El rol lo sube despues un
   administrador o el alta masiva, que usa la llave de servicio.

   ESTE TRIGGER NO PUEDE LEER raw_app_meta_data. NUNCA. NO ES UN GUSTO.

   El admin API de GoTrue crea al usuario en dos pasos: primero INSERTA la
   fila en auth.users y DESPUES le aplica el app_metadata con un UPDATE.
   Este trigger es AFTER INSERT, o sea que corre en medio: cuando mira
   raw_app_meta_data solo hay provider y providers. Ni rol, ni escuela.

   Lo peor es como se manifiesta. No hay error: el perfil nace con el rol
   por omision y sin escuela, la llamada devuelve 200 y el alta parece
   haber ido bien. En la plataforma hermana de NEM esto dejo 52 cuentas
   recien creadas y 13 anteriores sin escuela, y a sus 8 docentes guardados
   como alumno, sin poder entrar a su panel. Se reprodujo contra su base
   real y quedo como prueba automatizada.

   Lo que SI viaja en el INSERT es raw_user_meta_data, porque GoTrue lo
   incluye al construir la fila. De ahi salen full_name, escuela_id y
   group_id de abajo.

   Y AUN ASI, ESTO ES UN MEJOR ESFUERZO Y NO LA AUTORIDAD. Un trigger que
   se equivoca no le puede devolver el error a quien dio de alta: se lo
   traga. Quien manda es scripts/altas/alta-masiva.mjs, que despues de crear
   la cuenta escribe el perfil explicitamente y LO VUELVE A LEER para
   comprobar que quedo. Si no cuadra, lo dice y termina con error.          */

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_grupo_txt  text;
  v_grupo_uuid uuid;
  v_escuela    uuid;
BEGIN
  BEGIN
    v_escuela := NULLIF(new.raw_user_meta_data->>'escuela_id', '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_escuela := NULL;
  END;

  INSERT INTO public.profiles (id, email, full_name, role, escuela_id, school_level, group_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'student',
    v_escuela,
    COALESCE(new.raw_user_meta_data->>'school_level', 'primary'),
    new.raw_user_meta_data->>'group_id'
  )
  ON CONFLICT (id) DO NOTHING;

  v_grupo_txt := new.raw_user_meta_data->>'group_id';
  IF v_grupo_txt IS NOT NULL AND v_grupo_txt <> '' THEN
    BEGIN
      v_grupo_uuid := v_grupo_txt::uuid;
      INSERT INTO public.alumnos_grupos (id_alumno, id_grupo)
      VALUES (new.id, v_grupo_uuid)
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: no se pudo vincular grupo % para %', v_grupo_txt, new.id;
    END;
  END IF;

  RETURN new;
END;
$fn$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

/* --- 10. PROTECCION DE CAMPOS SENSIBLES -------------------------------- */

CREATE OR REPLACE FUNCTION public.protect_user_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_claims  text := current_setting('request.jwt.claims', true);
  v_rol_jwt text;
  v_rol     text;
BEGIN
  /*
   * QUIEN QUEDA EXENTO, Y POR QUE NO VALE auth.uid() IS NULL.
   *
   * La version anterior de este guardia empezaba con
   * "IF auth.uid() IS NULL THEN RETURN NEW", pensando en dejar pasar a la
   * llave de servicio. Eso esta mal por los dos lados:
   *
   *   - DEJA PASAR A LA ANONIMA. Una peticion sin sesion tambien tiene
   *     auth.uid() NULL. Hoy no se nota porque todas las policies de profiles
   *     son TO authenticated, pero el dia que alguien abra un camino anonimo
   *     de escritura, el guardia se abre solo y en silencio.
   *   - Y AUN ASI PUEDE DEJAR FUERA A LA LLAVE DE SERVICIO en cuanto el
   *     guardia exija un rol elevado, porque la llave no tiene perfil ni
   *     sesion: ningun proceso de backend puede volver a poner un rol o una
   *     escuela, y el alta masiva se queda sin forma de corregir nada.
   *
   * Se distingue por el claim del JWT, que es lo unico que separa de verdad
   * las tres situaciones:
   *
   *   v_claims IS NULL      conexion directa (SQL Editor, psql). Exenta: es
   *                         un humano con la llave del servidor delante.
   *   role = service_role   la llave secreta. Exenta.
   *   role = anon           NO exenta.
   *   role = authenticated  NO exenta.
   */
  BEGIN
    v_rol_jwt := COALESCE(v_claims::jsonb ->> 'role', '');
  EXCEPTION WHEN OTHERS THEN
    v_rol_jwt := '';
  END;

  IF v_claims IS NULL OR v_rol_jwt = 'service_role' THEN
    RETURN NEW;
  END IF;

  /*
   * COALESCE Y NO COMPARACION PELADA. get_my_role() devuelve NULL cuando
   * quien llama no tiene fila en profiles, y en SQL una condicion NULL no es
   * falsa: es NULL, y un IF con condicion NULL NO ENTRA. Es decir, el caso
   * mas sospechoso -alguien autenticado sin perfil- era justo el que se
   * saltaba todas las comprobaciones. Sin perfil se trata como el rol mas
   * restrictivo, no como el mas permisivo.
   */
  v_rol := COALESCE(public.get_my_role(), 'sin_perfil');

  /* El rol solo lo cambia un administrador, y nunca el propio interesado. */
  IF COALESCE(NEW.role, '') IS DISTINCT FROM COALESCE(OLD.role, '') THEN
    IF v_rol NOT IN ('admin', 'super_admin') THEN
      RAISE EXCEPTION 'Seguridad: cambiar el rol es cosa de un administrador.';
    END IF;
    /* El IS NOT NULL no sobra: si auth.uid() fuera NULL la comparacion seria
       NULL y este IF no entraria, que es la misma trampa de mas arriba. */
    IF auth.uid() IS NOT NULL AND auth.uid() = NEW.id THEN
      RAISE EXCEPTION 'Seguridad: nadie se cambia el rol a si mismo.';
    END IF;
    IF COALESCE(NEW.role, '') = 'super_admin' AND v_rol <> 'super_admin' THEN
      RAISE EXCEPTION 'Seguridad: solo un super administrador nombra super administradores.';
    END IF;
  END IF;

  /* Mover a alguien de escuela rompe el aislamiento entre colegios. */
  IF COALESCE(NEW.escuela_id::text, '') IS DISTINCT FROM COALESCE(OLD.escuela_id::text, '')
     AND v_rol <> 'super_admin' THEN
    RAISE EXCEPTION 'Seguridad: cambiar de escuela es cosa del super administrador.';
  END IF;

  /* Lo que un alumno no se cambia solo. */
  IF v_rol NOT IN ('teacher', 'admin', 'super_admin') THEN
    IF COALESCE(NEW.group_id, '') IS DISTINCT FROM COALESCE(OLD.group_id, '') THEN
      RAISE EXCEPTION 'Seguridad: no puedes cambiar de grupo sin autorizacion.';
    END IF;
    IF COALESCE(NEW.email, '') IS DISTINCT FROM COALESCE(OLD.email, '') THEN
      RAISE EXCEPTION 'Seguridad: el correo lo cambia un administrador.';
    END IF;
    IF COALESCE(NEW.school_level, '') IS DISTINCT FROM COALESCE(OLD.school_level, '') THEN
      RAISE EXCEPTION 'Seguridad: no puedes cambiar tu nivel escolar.';
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS ensure_profile_integrity ON public.profiles;
CREATE TRIGGER ensure_profile_integrity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_profile_fields();
