-- Migración: agregar super_admin a roles permitidos
-- Fecha: 2026-05-17
-- Contexto: requireAdminSession() y otras Server Actions ya verifican rol super_admin
-- pero el CHECK constraint actual no acepta ese valor — resuelve CRIT-002 del diagnóstico
--
-- APLICAR MANUALMENTE en Supabase Dashboard → SQL Editor

BEGIN;

-- 1. Eliminar el constraint existente (PostgreSQL lo nombra automáticamente profiles_role_check)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Crear nuevo constraint con super_admin incluido
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'teacher', 'admin', 'super_admin'));

-- 3. Documentar la decisión
COMMENT ON COLUMN public.profiles.role IS
  'Roles válidos: student = alumno, teacher = docente, admin = administrador de institución/escuela, super_admin = administrador global de la plataforma CEN.';

COMMIT;
