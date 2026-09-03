-- ALTO-003: La policy "alumno_ve_su_perfil" tenía un catch-all que permitía a docentes
-- leer cualquier perfil vía la misma policy. Se separan en dos policies explícitas.

-- Eliminar policy anterior (puede tener nombre diferente según despliegue)
DROP POLICY IF EXISTS "alumno_ve_su_perfil" ON public.profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;

-- Alumno o cualquier usuario autenticado: solo puede leer su propio perfil
CREATE POLICY "student_reads_own_profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Docente: puede leer perfiles de alumnos asignados a sus grupos
CREATE POLICY "teacher_reads_assigned_students"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS tp
      WHERE tp.id = auth.uid()
        AND tp.role = 'teacher'
        AND tp.group_id IS NOT NULL
        AND profiles.group_id = ANY(string_to_array(tp.group_id, ','))
    )
  );
