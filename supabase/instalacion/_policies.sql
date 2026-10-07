
/* --- 11. DOS AYUDANTES MAS, PARA CORTAR LA RECURSION CRUZADA -----------
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

/* --- 12. RLS ACTIVADA EN TODAS ----------------------------------------- */

ALTER TABLE public.escuelas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos_grupos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intentos        ENABLE ROW LEVEL SECURITY;

/* --- 13. POLICIES ------------------------------------------------------
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

/* --- 14. INDICES ------------------------------------------------------- */

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
