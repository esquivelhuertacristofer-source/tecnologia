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

/* === 1. EXTENSIONES ==================================================== */

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/* === 2. TIPOS ==========================================================
   CREATE TYPE no admite IF NOT EXISTS, de ahi el bloque.                  */

DO $bloque$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_category') THEN
    CREATE TYPE public.content_category AS ENUM ('video', 'didactic', 'printable', 'guide');
  END IF;
END
$bloque$;

/* === 3. ESCUELAS: LA UNIDAD DE AISLAMIENTO =============================
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

/* === 4. PERFILES =======================================================
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

/* === 5. CONTENIDO ====================================================== */

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

/* === 6. GRUPOS Y MEMBRESIA ============================================= */

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

/* === 7. PROGRESO E INTENTOS ============================================ */

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

/* === 8. FUNCIONES AUXILIARES ===========================================
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

/* === 9. ALTA DE USUARIO ================================================

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

/* === 10. PROTECCION DE CAMPOS SENSIBLES ================================ */

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

/* === 11. DOS AYUDANTES MAS, PARA CORTAR LA RECURSION CRUZADA ===========
   Una policy de alumnos_grupos que consulta grupos dispara las policies de
   grupos, y si alguna de esas consulta alumnos_grupos se cierra el circulo.
   SECURITY DEFINER no entra en RLS, asi que estas dos rompen el ciclo.    */

CREATE OR REPLACE FUNCTION public.grupos_de_mi_escuela()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT COALESCE(ARRAY(
    SELECT g.id FROM public.grupos g
    WHERE g.escuela_id = public.mi_escuela()
  ), ARRAY[]::uuid[]);
$fn$;

CREATE OR REPLACE FUNCTION public.alumnos_de_mi_escuela()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT COALESCE(ARRAY(
    SELECT p.id FROM public.profiles p
    WHERE p.escuela_id = public.mi_escuela()
  ), ARRAY[]::uuid[]);
$fn$;

/* === 12. RLS ACTIVADA EN TODAS ========================================= */

ALTER TABLE public.escuelas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos_grupos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intentos        ENABLE ROW LEVEL SECURITY;

/* === 13. POLICIES ======================================================
   Se borran primero TODAS las policies previas de estas tablas, incluidas
   las recursivas de schema.sql y fix_rls_alumno_ve_su_perfil.sql, para que
   una segunda ejecucion no deje las viejas mezcladas con las nuevas.      */

DO $bloque$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('escuelas','profiles','lessons','lesson_contents',
                        'grupos','alumnos_grupos','user_progress','progress','intentos')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END
$bloque$;

CREATE POLICY escuela_propia_select ON public.escuelas
  FOR SELECT TO authenticated USING (id = public.mi_escuela());
CREATE POLICY escuela_super_admin ON public.escuelas
  FOR ALL TO authenticated USING (public.get_my_role() = 'super_admin')
  WITH CHECK (public.get_my_role() = 'super_admin');

CREATE POLICY perfil_propio_select ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY perfil_propio_update ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY perfil_docente_ve_sus_alumnos ON public.profiles
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'teacher' AND id = ANY(public.mis_alumnos()));
CREATE POLICY perfil_admin_su_escuela ON public.profiles
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin' AND escuela_id = public.mi_escuela())
  WITH CHECK (public.get_my_role() = 'admin' AND escuela_id = public.mi_escuela());
CREATE POLICY perfil_super_admin ON public.profiles
  FOR ALL TO authenticated USING (public.get_my_role() = 'super_admin')
  WITH CHECK (public.get_my_role() = 'super_admin');

CREATE POLICY lecciones_lectura ON public.lessons
  FOR SELECT TO authenticated USING (true);
CREATE POLICY contenidos_lectura ON public.lesson_contents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY grupo_docente_propio ON public.grupos
  FOR SELECT TO authenticated USING (id_profesor = auth.uid());
CREATE POLICY grupo_alumno_inscrito ON public.grupos
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.alumnos_grupos ag
    WHERE ag.id_grupo = grupos.id AND ag.id_alumno = auth.uid()
  ));
CREATE POLICY grupo_admin_su_escuela ON public.grupos
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin' AND escuela_id = public.mi_escuela())
  WITH CHECK (public.get_my_role() = 'admin' AND escuela_id = public.mi_escuela());
CREATE POLICY grupo_super_admin ON public.grupos
  FOR ALL TO authenticated USING (public.get_my_role() = 'super_admin')
  WITH CHECK (public.get_my_role() = 'super_admin');

CREATE POLICY membresia_propia ON public.alumnos_grupos
  FOR SELECT TO authenticated USING (id_alumno = auth.uid());
CREATE POLICY membresia_docente ON public.alumnos_grupos
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'teacher' AND id_grupo = ANY(public.get_my_group_ids()));
CREATE POLICY membresia_admin ON public.alumnos_grupos
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin' AND id_grupo = ANY(public.grupos_de_mi_escuela()))
  WITH CHECK (public.get_my_role() = 'admin' AND id_grupo = ANY(public.grupos_de_mi_escuela()));
CREATE POLICY membresia_super_admin ON public.alumnos_grupos
  FOR ALL TO authenticated USING (public.get_my_role() = 'super_admin')
  WITH CHECK (public.get_my_role() = 'super_admin');

CREATE POLICY progreso_propio ON public.progress
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY progreso_docente ON public.progress
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'teacher' AND user_id = ANY(public.mis_alumnos()));
CREATE POLICY progreso_admin ON public.progress
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'super_admin'
         OR (public.get_my_role() = 'admin' AND user_id = ANY(public.alumnos_de_mi_escuela())));

CREATE POLICY progreso_leccion_propio ON public.user_progress
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY progreso_leccion_docente ON public.user_progress
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'teacher' AND user_id = ANY(public.mis_alumnos()));

CREATE POLICY intento_propio ON public.intentos
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY intento_docente ON public.intentos
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'teacher' AND user_id = ANY(public.mis_alumnos()));
CREATE POLICY intento_admin ON public.intentos
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'super_admin'
         OR (public.get_my_role() = 'admin' AND user_id = ANY(public.alumnos_de_mi_escuela())));

/* === 14. INDICES ======================================================= */

CREATE INDEX IF NOT EXISTS idx_profiles_escuela        ON public.profiles(escuela_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_escuela   ON public.profiles(role, escuela_id);
CREATE INDEX IF NOT EXISTS idx_profiles_group_id       ON public.profiles(group_id);
CREATE INDEX IF NOT EXISTS idx_grupos_escuela          ON public.grupos(escuela_id);
CREATE INDEX IF NOT EXISTS idx_grupos_profesor         ON public.grupos(id_profesor);
CREATE INDEX IF NOT EXISTS idx_alumnos_grupos_grupo    ON public.alumnos_grupos(id_grupo);
CREATE INDEX IF NOT EXISTS idx_alumnos_grupos_alumno   ON public.alumnos_grupos(id_alumno);
CREATE INDEX IF NOT EXISTS idx_progress_user_id        ON public.progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_activity  ON public.progress(user_id, activity_id);
CREATE INDEX IF NOT EXISTS idx_progress_completed_at   ON public.progress(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_intentos_user_id        ON public.intentos(user_id);
CREATE INDEX IF NOT EXISTS idx_intentos_activity_id    ON public.intentos(activity_id);
CREATE INDEX IF NOT EXISTS idx_intentos_user_status    ON public.intentos(user_id, status);

/* ==========================================================================
   14b. PERFILES DE LOS USUARIOS QUE YA ESTABAN

   El trigger on_auth_user_created solo dispara al CREAR un usuario, asi que
   quien ya existia en auth.users antes de esta instalacion se queda sin fila
   en profiles. Y sin fila en profiles no hay rol, no hay escuela y
   requireAdmin responde FORBIDDEN: la cuenta entra y no es nadie.

   Hoy son las dos cuentas demo, que se crearon cuando no habia ni tabla. Es
   poca cosa ahora y es la clase de hueco que no se ve hasta que alguien no
   puede entrar, asi que se rellena aqui y no en una nota.

   El rol sale de app_metadata.rol, que es donde vive de verdad en esta
   plataforma y que solo puede escribir la llave de servicio. Se traduce al
   vocabulario de la tabla: alumno->student, docente->teacher.
   ========================================================================== */

INSERT INTO public.profiles (id, email, full_name, role, created_at)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  CASE u.raw_app_meta_data->>'rol'
    WHEN 'docente' THEN 'teacher'
    WHEN 'admin'   THEN 'admin'
    ELSE 'student'
  END,
  COALESCE(u.created_at, now())
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

/* ==========================================================================
   15. ESTUDIO DE IMPACTO
   Contenido de supabase/migrations/estudio_impacto.sql sin sus comentarios.
   Va al final porque es_admin() y es_docente_o_admin() leen public.profiles.
   ========================================================================== */


CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.es_docente_o_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
  );
$$;


CREATE TABLE IF NOT EXISTS public.estudio_escuelas (
  id            TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  participa     BOOLEAN NOT NULL DEFAULT FALSE,
  salida_desde  DATE,
  salida_hasta  DATE,
  creada_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ventana_coherente CHECK (
    (salida_desde IS NULL AND salida_hasta IS NULL) OR
    (salida_desde IS NOT NULL AND salida_hasta IS NOT NULL AND salida_desde <= salida_hasta)
  )
);


CREATE TABLE IF NOT EXISTS public.estudio_alumnos (
  cuenta      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  estudio_id  UUID NOT NULL UNIQUE,
  escuela_id  TEXT REFERENCES public.estudio_escuelas(id) ON DELETE SET NULL,
  grupo       TEXT,
  creada_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estudio_alumnos_escuela ON public.estudio_alumnos(escuela_id);


CREATE TABLE IF NOT EXISTS public.estudio_cuestionarios_aplicados (
  evento_id            UUID PRIMARY KEY,
  alumno               UUID NOT NULL,
  ancla                TEXT NOT NULL DEFAULT 'navegador' CHECK (ancla IN ('cuenta', 'navegador')),
  cuestionario         TEXT NOT NULL,
  version_cuestionario TEXT NOT NULL,
  inicio               TIMESTAMPTZ NOT NULL,
  fin                  TIMESTAMPTZ,
  completado           BOOLEAN NOT NULL DEFAULT FALSE,
  dispositivo          TEXT,
  version_app          TEXT,
  recibido_en          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aplicados_alumno ON public.estudio_cuestionarios_aplicados(alumno, cuestionario);

CREATE TABLE IF NOT EXISTS public.estudio_respuestas (
  evento_id            UUID PRIMARY KEY,
  alumno               UUID NOT NULL,
  ancla                TEXT NOT NULL DEFAULT 'navegador' CHECK (ancla IN ('cuenta', 'navegador')),
  cuestionario         TEXT NOT NULL,
  version_cuestionario TEXT NOT NULL,
  reactivo             TEXT NOT NULL,
  respuesta            SMALLINT,
  correcta             BOOLEAN,
  tiempo_ms            INTEGER NOT NULL CHECK (tiempo_ms >= 0),
  orden                SMALLINT NOT NULL,
  ts_cliente           TIMESTAMPTZ NOT NULL,
  recibido_en          TIMESTAMPTZ NOT NULL DEFAULT now(),


  CONSTRAINT una_respuesta_por_reactivo UNIQUE (alumno, cuestionario, reactivo)
);

CREATE INDEX IF NOT EXISTS idx_respuestas_alumno ON public.estudio_respuestas(alumno, cuestionario);
CREATE INDEX IF NOT EXISTS idx_respuestas_reactivo ON public.estudio_respuestas(cuestionario, reactivo);


CREATE TABLE IF NOT EXISTS public.consentimientos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo           TEXT NOT NULL CHECK (tipo IN ('alumno', 'tutor', 'docente', 'institucion')),
  version_aviso  TEXT NOT NULL,
  otorgado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_truncada    TEXT,
  user_agent     TEXT,


  tutor_de       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo         TEXT UNIQUE,
  CONSTRAINT tutor_apunta_a_alguien CHECK (tipo <> 'tutor' OR tutor_de IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_consentimientos_cuenta ON public.consentimientos(cuenta, version_aviso);


CREATE TABLE IF NOT EXISTS public.eventos_aprendizaje (
  evento_id     UUID PRIMARY KEY,
  alumno        UUID NOT NULL,
  ancla         TEXT NOT NULL DEFAULT 'navegador' CHECK (ancla IN ('cuenta', 'navegador')),
  actividad_id  TEXT NOT NULL,
  item_id       TEXT,
  tipo          TEXT NOT NULL CHECK (tipo IN ('inicio', 'respuesta', 'abandono', 'fin', 'dificultad_percibida')),
  resultado     SMALLINT CHECK (resultado IN (-1, 0, 1)),
  tiempo_ms     INTEGER CHECK (tiempo_ms >= 0),
  intentos      SMALLINT,
  ts_cliente    TIMESTAMPTZ NOT NULL,
  recibido_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  version_app   TEXT
);

CREATE INDEX IF NOT EXISTS idx_eventos_alumno ON public.eventos_aprendizaje(alumno, ts_cliente);
CREATE INDEX IF NOT EXISTS idx_eventos_actividad ON public.eventos_aprendizaje(actividad_id, tipo);


CREATE TABLE IF NOT EXISTS public.estudio_contexto_escuela (
  escuela_id    TEXT PRIMARY KEY REFERENCES public.estudio_escuelas(id) ON DELETE CASCADE,
  conectividad  TEXT CHECK (conectividad IN ('buena', 'intermitente', 'sin_internet')),
  dispositivos  TEXT CHECK (dispositivos IN ('uno_por_alumno', 'compartidos', 'solo_docente')),
  modalidad     TEXT CHECK (modalidad IN ('presencial', 'mixta', 'a_distancia')),
  zona          TEXT CHECK (zona IN ('urbana', 'rural')),
  notas         TEXT,
  capturado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  capturado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS public.estudio_bitacora_docente (
  evento_id    UUID PRIMARY KEY,
  docente      UUID NOT NULL,
  escuela_id   TEXT REFERENCES public.estudio_escuelas(id) ON DELETE SET NULL,
  accion       TEXT NOT NULL CHECK (accion IN (
    'inicio_sesion', 'vista_panel_grupo', 'descarga_reporte', 'accion_sobre_alumno'
  )),
  detalle      TEXT,
  ts_cliente   TIMESTAMPTZ NOT NULL,
  recibido_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bitacora_docente ON public.estudio_bitacora_docente(docente, ts_cliente);


CREATE TABLE IF NOT EXISTS public.estudio_errores (
  evento_id    UUID PRIMARY KEY,
  origen       TEXT NOT NULL,
  detalle      TEXT,
  extra        JSONB,
  ts_cliente   TIMESTAMPTZ,
  recibido_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);


ALTER TABLE public.estudio_escuelas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudio_alumnos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudio_cuestionarios_aplicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudio_respuestas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consentimientos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_aprendizaje             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudio_contexto_escuela        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudio_bitacora_docente        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudio_errores                 ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS escuelas_lectura ON public.estudio_escuelas;
CREATE POLICY escuelas_lectura ON public.estudio_escuelas
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS escuelas_admin ON public.estudio_escuelas;
CREATE POLICY escuelas_admin ON public.estudio_escuelas
  FOR ALL TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());


DROP POLICY IF EXISTS alumnos_ve_el_suyo ON public.estudio_alumnos;
CREATE POLICY alumnos_ve_el_suyo ON public.estudio_alumnos
  FOR SELECT TO authenticated USING (cuenta = auth.uid());

DROP POLICY IF EXISTS alumnos_crea_el_suyo ON public.estudio_alumnos;
CREATE POLICY alumnos_crea_el_suyo ON public.estudio_alumnos
  FOR INSERT TO authenticated WITH CHECK (cuenta = auth.uid());

DROP POLICY IF EXISTS alumnos_admin ON public.estudio_alumnos;
CREATE POLICY alumnos_admin ON public.estudio_alumnos
  FOR ALL TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());


DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'estudio_cuestionarios_aplicados',
    'estudio_respuestas',
    'eventos_aprendizaje',
    'estudio_bitacora_docente',
    'estudio_errores'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_escribe', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)',
      t || '_escribe', t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_lee_admin', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.es_admin())',
      t || '_lee_admin', t
    );
  END LOOP;
END $$;


DROP POLICY IF EXISTS consentimientos_propio_escribe ON public.consentimientos;
CREATE POLICY consentimientos_propio_escribe ON public.consentimientos
  FOR INSERT TO authenticated WITH CHECK (cuenta = auth.uid());

DROP POLICY IF EXISTS consentimientos_propio_lee ON public.consentimientos;
CREATE POLICY consentimientos_propio_lee ON public.consentimientos
  FOR SELECT TO authenticated USING (cuenta = auth.uid() OR public.es_admin());


DROP POLICY IF EXISTS contexto_personal ON public.estudio_contexto_escuela;
CREATE POLICY contexto_personal ON public.estudio_contexto_escuela
  FOR ALL TO authenticated
  USING (public.es_docente_o_admin())
  WITH CHECK (public.es_docente_o_admin());


CREATE OR REPLACE VIEW public.estudio_dosis AS
WITH pasos AS (
  SELECT
    alumno,
    ancla,
    date_trunc('week', ts_cliente)::date AS semana,
    ts_cliente::date                     AS dia,
    actividad_id,
    tipo,
    EXTRACT(EPOCH FROM (
      ts_cliente - LAG(ts_cliente) OVER (PARTITION BY alumno ORDER BY ts_cliente)
    )) AS hueco_seg
  FROM public.eventos_aprendizaje
)
SELECT
  alumno,
  ancla,
  semana,

  COUNT(*) FILTER (WHERE hueco_seg IS NULL OR hueco_seg > 1800)      AS sesiones,
  ROUND(SUM(CASE WHEN hueco_seg <= 60 THEN hueco_seg ELSE 0 END) / 60.0, 1) AS minutos_activos,
  COUNT(*) FILTER (WHERE tipo = 'inicio')                            AS actividades_iniciadas,
  COUNT(*) FILTER (WHERE tipo = 'fin')                               AS actividades_completadas,
  COUNT(DISTINCT dia)                                                AS dias_distintos
FROM pasos
GROUP BY alumno, ancla, semana;


ALTER VIEW public.estudio_dosis SET (security_invoker = true);


/* ==========================================================================
   16. VERIFICACION FINAL

   Una sola consulta. Si todo sale OK, quedo instalado.
   Cualquier fila con FALTA, SIN RLS o RECURSIVA es un problema que hay que
   mirar antes de dar de alta a nadie.
   ========================================================================== */

WITH tablas AS (
  SELECT unnest(ARRAY[
    'escuelas','profiles','lessons','lesson_contents','grupos','alumnos_grupos',
    'user_progress','progress','intentos',
    'estudio_escuelas','estudio_alumnos','estudio_cuestionarios_aplicados',
    'estudio_respuestas','consentimientos','eventos_aprendizaje',
    'estudio_contexto_escuela','estudio_bitacora_docente','estudio_errores'
  ]) AS nombre
),
funciones AS (
  SELECT unnest(ARRAY[
    'get_my_role','mi_escuela','get_my_group_ids','mis_alumnos',
    'grupos_de_mi_escuela','alumnos_de_mi_escuela',
    'handle_new_user','protect_user_profile_fields','es_admin','es_docente_o_admin'
  ]) AS nombre
),
revision AS (
  SELECT 1 AS orden, 'tabla' AS que, t.nombre AS elemento,
         CASE WHEN to_regclass('public.' || t.nombre) IS NOT NULL
              THEN 'OK' ELSE 'FALTA' END AS estado
  FROM tablas t

  UNION ALL

  SELECT 2, 'rls', t.nombre,
         CASE
           WHEN to_regclass('public.' || t.nombre) IS NULL THEN 'FALTA LA TABLA'
           WHEN (SELECT c.relrowsecurity FROM pg_class c
                 WHERE c.oid = to_regclass('public.' || t.nombre)) THEN 'OK'
           ELSE 'SIN RLS'
         END
  FROM tablas t

  UNION ALL

  SELECT 3, 'funcion', f.nombre,
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_proc p
           JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = f.nombre
         ) THEN 'OK' ELSE 'FALTA' END
  FROM funciones f

  UNION ALL

  SELECT 4, 'trigger', 'on_auth_user_created',
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created' AND NOT tgisinternal
         ) THEN 'OK' ELSE 'FALTA' END

  UNION ALL

  SELECT 4, 'trigger', 'ensure_profile_integrity',
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_profile_integrity' AND NOT tgisinternal
         ) THEN 'OK' ELSE 'FALTA' END

  UNION ALL

  /* El alta masiva depende de esto: dos escuelas pueden tener ambas un 1A. */
  SELECT 5, 'clave', 'grupos unicos por escuela',
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_constraint
           WHERE conrelid = to_regclass('public.grupos')
             AND contype = 'u'
             AND pg_get_constraintdef(oid) ILIKE '%escuela_id, nombre%'
         ) THEN 'OK' ELSE 'FALTA' END

  UNION ALL

  SELECT 5, 'clave', 'grupos.nombre NO es unico global',
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_constraint
           WHERE conrelid = to_regclass('public.grupos')
             AND contype = 'u'
             AND pg_get_constraintdef(oid) ILIKE '%(nombre)%'
         ) THEN 'TODAVIA GLOBAL' ELSE 'OK' END

  UNION ALL

  /* Una policy sobre profiles que vuelve a leer profiles produce
     42P17 y deja a todo usuario autenticado sin poder leer su perfil. */
  SELECT 6, 'recursion', p.tablename || '.' || p.policyname, 'RECURSIVA'
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename IN ('profiles','grupos','alumnos_grupos')
    AND (COALESCE(p.qual, '') || COALESCE(p.with_check, '')) ~ ('(FROM|JOIN)[[:space:]]+(public\.)?' || p.tablename)

  UNION ALL

  /* Una cuenta de auth sin fila en profiles entra y no es nadie:
     sin rol, sin escuela, y requireAdmin le responde FORBIDDEN. */
  SELECT 7, 'perfiles', 'usuarios de auth sin perfil',
         CASE WHEN (SELECT count(*) FROM auth.users u
                    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)) = 0
              THEN 'OK'
              ELSE (SELECT count(*)::text FROM auth.users u
                    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)) || ' SIN PERFIL'
         END

  UNION ALL

  /* LA CARRERA DE GoTrue. El admin API INSERTA el usuario y aplica el
     app_metadata DESPUES, asi que un trigger AFTER INSERT que lo lea ve
     provider/providers y nada mas. El perfil nace sin escuela y con el rol
     por omision, sin un solo error. En NEM dejo 65 cuentas asi. */
  SELECT 7, 'carrera', 'handle_new_user no lee raw_app_meta_data',
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_proc p
           JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
             AND p.prosrc ILIKE '%raw_app_meta_data%'
         ) THEN 'LEE app_metadata: CARRERA DE GoTrue' ELSE 'OK' END

  UNION ALL

  /* Si el guardia anti-escalada no exime a la llave de servicio por el
     claim, ningun proceso de backend puede corregir un rol o una escuela:
     la llave no tiene sesion. Y eximir por auth.uid() IS NULL a secas deja
     pasar tambien a la anonima. */
  SELECT 7, 'guardia', 'el guardia exime a service_role por el claim',
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_proc p
           JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = 'protect_user_profile_fields'
             AND p.prosrc ILIKE '%service_role%'
             AND p.prosrc ILIKE '%request.jwt.claims%'
         ) THEN 'OK' ELSE 'LA LLAVE DE SERVICIO QUEDA FUERA' END

  UNION ALL

  SELECT 7, 'rol', 'handle_new_user no toma el rol del metadata',
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_proc p
           JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
             AND p.prosrc NOT ILIKE '%raw_user_meta_data->>''role''%'
         ) THEN 'OK' ELSE 'ESCALADA DE PRIVILEGIOS' END
)
SELECT
  z.que,
  z.elemento,
  z.estado
FROM (
  /* El veredicto primero, para no tener que buscarlo entre las filas. */
  SELECT 0 AS orden_salida,
         'RESUMEN' AS que,
         (SELECT count(*)::text FROM revision WHERE estado = 'OK') || ' de ' ||
         (SELECT count(*)::text FROM revision) || ' comprobaciones en OK' AS elemento,
         CASE WHEN (SELECT count(*) FROM revision WHERE estado <> 'OK') = 0
              THEN 'INSTALACION COMPLETA'
              ELSE 'REVISAR LAS FILAS DE ABAJO' END AS estado

  UNION ALL

  SELECT 1, que, elemento, estado
  FROM revision
  WHERE estado <> 'OK'
) z
ORDER BY z.orden_salida, z.que, z.elemento;
