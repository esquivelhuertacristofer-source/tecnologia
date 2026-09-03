-- SCHEMA PARA CEN ACADEMY V2.0 --
-- Versión 2.1 — Añade: role, group_id, RLS docente, trigger actualizado

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE public.school_level AS ENUM ('primary', 'secondary');
CREATE TYPE public.content_category AS ENUM ('video', 'didactic', 'printable', 'guide');

-- 3. TABLA DE PERFILES
CREATE TABLE public.profiles (
  id          UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name   TEXT,
  avatar_url  TEXT,
  email       TEXT,                                         -- denormalizado desde auth.users para consultas rápidas
  role        TEXT NOT NULL DEFAULT 'student'               -- 'student' | 'teacher' | 'admin'
                CHECK (role IN ('student', 'teacher', 'admin')),
  school_level TEXT DEFAULT 'primary',                     -- 'primary-1' … 'primary-6' | 'secondary-1' … 'secondary-3'
  grade       INTEGER,                                     -- 1-6 primaria, 1-3 secundaria (legacy, derivado de school_level)
  group_id    TEXT,                                        -- ID(s) del grupo; docentes pueden tener varios separados por coma
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA DE LECCIONES / UNIDADES
CREATE TABLE public.lessons (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  level        TEXT NOT NULL,
  grade        INTEGER NOT NULL,
  unit_number  INTEGER NOT NULL,
  thumbnail_url TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLA DE CONTENIDOS
CREATE TABLE public.lesson_contents (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lesson_id   UUID REFERENCES public.lessons ON DELETE CASCADE NOT NULL,
  category    public.content_category NOT NULL,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  config      JSONB,
  order_index INTEGER DEFAULT 0
);

-- 6a. TABLA DE PROGRESO (estructura formal, lecciones)
CREATE TABLE public.user_progress (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.lesson_contents(id) ON DELETE CASCADE NOT NULL,
  completed  BOOLEAN DEFAULT FALSE,
  last_watched_second INTEGER DEFAULT 0,
  score      INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, content_id)
);

-- 6b. TABLA DE PROGRESO (hub, actividades hardcoded)
CREATE TABLE public.progress (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_id  TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, activity_id)
);

-- 7. RLS
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress        ENABLE ROW LEVEL SECURITY;

-- Perfiles: alumno ve/edita solo el suyo
CREATE POLICY "student_own_profile_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "student_own_profile_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Perfiles: docente puede leer todos los perfiles de su(s) grupo(s)
-- Un docente tiene role='teacher'; sus alumnos comparten group_id
CREATE POLICY "teacher_reads_group_profiles" ON public.profiles
  FOR SELECT USING (
    -- el propio perfil siempre visible
    auth.uid() = id
    OR
    -- o bien: el usuario autenticado es docente y el alumno pertenece a uno de sus grupos
    EXISTS (
      SELECT 1 FROM public.profiles t
      WHERE t.id = auth.uid()
        AND t.role = 'teacher'
        AND (
          -- group_id del alumno coincide con alguno de los grupos del docente
          profiles.group_id = ANY(string_to_array(t.group_id, ','))
          -- alumnos sin grupo también son visibles para cualquier docente
          OR profiles.group_id IS NULL
        )
    )
  );

-- Admin ve todo
CREATE POLICY "admin_reads_all_profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles a
      WHERE a.id = auth.uid() AND a.role = 'admin'
    )
  );

-- Lecciones y contenidos: todos los autenticados
CREATE POLICY "auth_view_lessons"   ON public.lessons         FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_view_contents"  ON public.lesson_contents FOR SELECT TO authenticated USING (true);

-- Progreso: solo el dueño
CREATE POLICY "own_user_progress_select" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_user_progress_all"    ON public.user_progress FOR ALL    USING (auth.uid() = user_id);

CREATE POLICY "own_hub_progress_select"  ON public.progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_hub_progress_all"     ON public.progress FOR ALL    USING (auth.uid() = user_id);

-- Docente puede leer el progreso de sus alumnos
CREATE POLICY "teacher_reads_group_progress" ON public.progress
  FOR SELECT USING (
    EXISTS (
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

-- 8. TRIGGER: crear perfil automáticamente al registrar usuario
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
