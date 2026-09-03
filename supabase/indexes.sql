-- supabase/indexes.sql
-- Índices recomendados para performance a escala
--
-- INSTRUCCIONES:
-- Aplicar manualmente en Supabase Dashboard → SQL Editor → New query
-- Ejecutar cada bloque por separado o todos juntos.
-- Estos son índices "IF NOT EXISTS" — seguros de re-ejecutar.
--
-- CONTEXTO: Sin estos índices, queries como "dame todos los alumnos del grupo X"
-- o "¿qué actividades completó el usuario Y?" hacen un full table scan.
-- A 100 usuarios esto es invisible. A 10,000 usuarios esto causa timeouts.

-- =====================================================
-- TABLA: progress
-- =====================================================

-- Búsqueda por usuario (query más frecuente del hub: "¿qué completó este alumno?")
CREATE INDEX IF NOT EXISTS idx_progress_user_id
  ON progress(user_id);

-- Búsqueda por fecha de completado (para reportes temporales del profesor)
CREATE INDEX IF NOT EXISTS idx_progress_completed_at
  ON progress(completed_at);

-- Búsqueda combinada usuario + actividad (verificar si ya completó X)
CREATE INDEX IF NOT EXISTS idx_progress_user_activity
  ON progress(user_id, activity_id);

-- =====================================================
-- TABLA: profiles
-- =====================================================

-- Búsqueda por grupo (query del dashboard: "dame todos los alumnos del grupo X")
CREATE INDEX IF NOT EXISTS idx_profiles_group_id
  ON profiles(group_id);

-- Búsqueda combinada role + group (dashboard del profesor: "alumnos de MI grupo")
CREATE INDEX IF NOT EXISTS idx_profiles_role_group
  ON profiles(role, group_id);

-- Búsqueda por nivel escolar (analytics y reportes agregados)
CREATE INDEX IF NOT EXISTS idx_profiles_school_level
  ON profiles(school_level);

-- =====================================================
-- VERIFICACIÓN (ejecutar después de crear índices)
-- =====================================================
-- SELECT indexname, tablename FROM pg_indexes
-- WHERE tablename IN ('profiles', 'progress')
-- ORDER BY tablename, indexname;
