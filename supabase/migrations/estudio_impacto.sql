-- ═══════════════════════════════════════════════════════════════════════════
-- ESTUDIO DE IMPACTO — esquema completo
-- 5 de septiembre de 2026
--
-- Las tablas con las que se va a medir si los alumnos aprenden más con la
-- plataforma. La evidencia que salga de aquí decide licitaciones y
-- renovaciones, así que el esquema tiene dos obsesiones:
--
--   1. NADA DE DATOS PERSONALES. Ninguna tabla de este archivo guarda nombre,
--      correo ni `auth.uid()`, salvo UNA: `estudio_alumnos`, que es el puente
--      entre la identidad real y el seudónimo, y está cerrada a cal y canto.
--      Un volcado de `estudio_respuestas` no identifica a ningún menor.
--
--   2. NADA SE DUPLICA. Todas las tablas de eventos llevan `evento_id` UNIQUE
--      generado en el cliente. Reenviar un lote que ya llegó —porque se cortó
--      la red entre la escritura y la confirmación— no escribe nada dos veces.
--
-- ORDEN DE EJECUCIÓN: después de todo lo demás de `supabase/`. Este archivo es
-- aditivo: no toca ninguna tabla ni política existente.
--
-- CÓMO SE EJECUTA: SQL Editor de Supabase, entero, de una vez. Es idempotente
-- (`IF NOT EXISTS` y `DROP POLICY IF EXISTS`), así que volver a correrlo no
-- rompe nada.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 0. Quién es administrador
--
-- Se repite el patrón que ya usa `schema.sql` en vez de inventar otro. Como
-- función para no repetir el subselect en veinte políticas, y `STABLE` para
-- que el planificador no la ejecute una vez por fila.
-- ───────────────────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────────────────
-- 1. ESCUELAS DEL ESTUDIO
--
-- `participa` APAGADA POR OMISIÓN. Una escuela que no está aquí, o que está
-- con `participa = false`, no ve un solo cuestionario. Es la bandera del §12.
--
-- La ventana de salida (§3) son dos fechas de calendario, no marcas de tiempo:
-- un administrador piensa en «del 10 al 20 de junio», y comparar instantes
-- metería la zona horaria del navegador en la decisión — un alumno en Tijuana
-- y otro en Cancún verían cosas distintas el mismo día.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.estudio_escuelas (
  id            TEXT PRIMARY KEY,               -- clave corta y legible: 'sec-14-toluca'
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

-- ───────────────────────────────────────────────────────────────────────────
-- 2. EL PUENTE ENTRE LA IDENTIDAD Y EL SEUDÓNIMO
--
-- **La única tabla de todo el estudio que puede identificar a una persona.**
-- Todo lo demás guarda `estudio_id` y nada más. Si algún día hay que exportar
-- datos a la universidad, esta tabla NO se exporta: es lo que convierte el
-- volcado en anónimo.
--
-- Un alumno puede leer y crear SU fila —así conserva el mismo seudónimo al
-- cambiar de equipo— y no puede ver la de nadie más.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.estudio_alumnos (
  cuenta      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  estudio_id  UUID NOT NULL UNIQUE,
  escuela_id  TEXT REFERENCES public.estudio_escuelas(id) ON DELETE SET NULL,
  grupo       TEXT,
  creada_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estudio_alumnos_escuela ON public.estudio_alumnos(escuela_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. CUESTIONARIOS (§3 y §7)
--
-- `estudio_cuestionarios_aplicados` existe para poder distinguir «lo empezó y
-- lo dejó» de «no lo abrió nunca». Sin ella, un cuestionario abandonado por la
-- mitad y uno que jamás se mostró son el mismo silencio en los datos, y son
-- cosas muy distintas.
--
-- `ancla` dice si el sujeto es una PERSONA (entró con cuenta) o un NAVEGADOR
-- (entró sin cuenta, en un equipo que puede compartir con otros). Sin esta
-- columna, el análisis no puede separar los sujetos reales de los equipos, y
-- un pretest y un postest que no son de la misma persona no miden aprendizaje.
-- ───────────────────────────────────────────────────────────────────────────
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
  respuesta            SMALLINT,               -- índice de la opción; NULL = «aún no lo sé»
  correcta             BOOLEAN,                -- NULL en la escala de actitud: no hay correcta
  tiempo_ms            INTEGER NOT NULL CHECK (tiempo_ms >= 0),
  orden                SMALLINT NOT NULL,
  ts_cliente           TIMESTAMPTZ NOT NULL,   -- el reloj del alumno
  recibido_en          TIMESTAMPTZ NOT NULL DEFAULT now(),  -- el del servidor
  -- Un alumno responde UNA vez a cada reactivo de cada cuestionario. Esta
  -- restricción es la última línea de defensa: el cliente ya lo impide, pero
  -- el cliente es un navegador y los navegadores hacen cosas raras.
  CONSTRAINT una_respuesta_por_reactivo UNIQUE (alumno, cuestionario, reactivo)
);

CREATE INDEX IF NOT EXISTS idx_respuestas_alumno ON public.estudio_respuestas(alumno, cuestionario);
CREATE INDEX IF NOT EXISTS idx_respuestas_reactivo ON public.estudio_respuestas(cuestionario, reactivo);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. CONSENTIMIENTOS (§4)
--
-- Aquí SÍ hay datos ligados a la cuenta: es una prueba legal, no telemetría.
-- La IP va truncada (último octeto a cero en IPv4, /64 en IPv6) porque para
-- acreditar el consentimiento basta la red aproximada, y la IP completa
-- identifica un domicilio.
--
-- Cada versión del aviso genera su propia fila: no se actualiza la anterior.
-- Saber QUÉ texto aceptó cada quien y CUÁNDO es justo lo que se le pide a un
-- registro de consentimiento.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consentimientos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo           TEXT NOT NULL CHECK (tipo IN ('alumno', 'tutor', 'docente', 'institucion')),
  version_aviso  TEXT NOT NULL,
  otorgado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_truncada    TEXT,
  user_agent     TEXT,
  -- Consentimiento del tutor (§4): PREPARADO Y APAGADO. `tutor_de` apunta a la
  -- cuenta del menor y `codigo` es el que el tutor recibe para aceptar por él.
  -- Cuándo se enciende es una decisión legal, no técnica.
  tutor_de       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo         TEXT UNIQUE,
  CONSTRAINT tutor_apunta_a_alguien CHECK (tipo <> 'tutor' OR tutor_de IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_consentimientos_cuenta ON public.consentimientos(cuenta, version_aviso);

-- ───────────────────────────────────────────────────────────────────────────
-- 5. EVENTOS DE APRENDIZAJE (§5)
--
-- EL FORMATO ES EL ESTÁNDAR DE ANÁLISIS Y NO SE TOCA. `resultado` es -1/0/1,
-- `evento_id` lo genera el cliente, y hay DOS marcas de tiempo. Las siete
-- plataformas del estudio tienen que guardar lo mismo de la misma manera; que
-- ésta se invente una columna «mejor» es lo que impide comparar entre ellas.
--
-- Por qué dos relojes: el del cliente dice cuándo pasó de verdad —incluso si
-- el evento estuvo tres días en la cola de un equipo sin internet— y el del
-- servidor dice cuándo llegó. La diferencia entre los dos es, además, la
-- medida de cuánta conectividad tiene esa escuela.
-- ───────────────────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────────────────
-- 6. CONTEXTO DEL PLANTEL (§8)
--
-- Se captura una vez por escuela y explica muchísimo del resultado: una
-- escuela sin internet y con un equipo para todo el grupo no puede compararse
-- con una de uno por alumno. Sin esta tabla, esas diferencias se leerían como
-- diferencias de aprendizaje.
-- ───────────────────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────────────────
-- 7. BITÁCORA DOCENTE (§10)
--
-- La métrica de adopción: de nada sirve que la plataforma sea buena si el
-- docente no entra. Sin interfaz nueva, sólo registro.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.estudio_bitacora_docente (
  evento_id    UUID PRIMARY KEY,
  docente      UUID NOT NULL,             -- seudónimo, igual que el alumno
  escuela_id   TEXT REFERENCES public.estudio_escuelas(id) ON DELETE SET NULL,
  accion       TEXT NOT NULL CHECK (accion IN (
    'inicio_sesion', 'vista_panel_grupo', 'descarga_reporte', 'accion_sobre_alumno'
  )),
  detalle      TEXT,
  ts_cliente   TIMESTAMPTZ NOT NULL,
  recibido_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bitacora_docente ON public.estudio_bitacora_docente(docente, ts_cliente);

-- ───────────────────────────────────────────────────────────────────────────
-- 8. ERRORES DEL PROPIO ESTUDIO (§12)
--
-- «Todo lo de esta sesión falla en silencio hacia una tabla de errores, no
-- hacia el usuario.» Ésta es esa tabla. Silencio para el alumno, no para quien
-- opera el estudio: si esto se llena, algo se está perdiendo.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.estudio_errores (
  evento_id    UUID PRIMARY KEY,
  origen       TEXT NOT NULL,
  detalle      TEXT,
  extra        JSONB,
  ts_cliente   TIMESTAMPTZ,
  recibido_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS
--
-- EL MODELO, EN UNA FRASE: el navegador sólo puede ESCRIBIR; leer, sólo los
-- administradores.
--
-- Por qué el alumno anónimo puede insertar. La plataforma tiene «Explorar sin
-- cuenta» y muchas escuelas van a usarla así el primer día. Si sólo pudieran
-- escribir los autenticados, esos alumnos no se medirían — y el dato del
-- primer día no se puede recuperar después. El precio es que cualquiera con la
-- llave publicable (que viaja en cada página, por diseño) puede insertar filas
-- basura. Se acota así:
--
--   · INSERT sí; SELECT, UPDATE y DELETE **no**, para nadie que no sea admin.
--     Nadie puede leer, cambiar ni borrar lo ya escrito desde el navegador.
--   · `una_respuesta_por_reactivo` impide inflar un mismo sujeto.
--   · La columna `ancla` marca esas filas, y el análisis puede descartarlas.
--
-- Está en `PENDIENTES_ESTUDIO.md` como riesgo aceptado, con la recomendación
-- de que las escuelas del estudio entren con cuenta.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.estudio_escuelas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudio_alumnos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudio_cuestionarios_aplicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudio_respuestas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consentimientos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_aprendizaje             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudio_contexto_escuela        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudio_bitacora_docente        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudio_errores                 ENABLE ROW LEVEL SECURITY;

-- ── Escuelas: cualquiera puede leer la bandera (no hay dato personal); sólo
--    admin escribe. Hace falta que lo lea el anónimo para poder decidir si
--    enseñar el cuestionario en un equipo sin sesión.
DROP POLICY IF EXISTS escuelas_lectura ON public.estudio_escuelas;
CREATE POLICY escuelas_lectura ON public.estudio_escuelas
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS escuelas_admin ON public.estudio_escuelas;
CREATE POLICY escuelas_admin ON public.estudio_escuelas
  FOR ALL TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());

-- ── El puente: cada quien, el suyo. Nadie más, ni siquiera el docente.
DROP POLICY IF EXISTS alumnos_ve_el_suyo ON public.estudio_alumnos;
CREATE POLICY alumnos_ve_el_suyo ON public.estudio_alumnos
  FOR SELECT TO authenticated USING (cuenta = auth.uid());

DROP POLICY IF EXISTS alumnos_crea_el_suyo ON public.estudio_alumnos;
CREATE POLICY alumnos_crea_el_suyo ON public.estudio_alumnos
  FOR INSERT TO authenticated WITH CHECK (cuenta = auth.uid());

DROP POLICY IF EXISTS alumnos_admin ON public.estudio_alumnos;
CREATE POLICY alumnos_admin ON public.estudio_alumnos
  FOR ALL TO authenticated USING (public.es_admin()) WITH CHECK (public.es_admin());

-- ── Tablas de eventos: escribir todos, leer sólo admin.
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

-- ── Consentimientos: cada quien escribe y lee el suyo; admin, todos.
--    El anónimo no consiente: no hay a quién ligar el consentimiento.
DROP POLICY IF EXISTS consentimientos_propio_escribe ON public.consentimientos;
CREATE POLICY consentimientos_propio_escribe ON public.consentimientos
  FOR INSERT TO authenticated WITH CHECK (cuenta = auth.uid());

DROP POLICY IF EXISTS consentimientos_propio_lee ON public.consentimientos;
CREATE POLICY consentimientos_propio_lee ON public.consentimientos
  FOR SELECT TO authenticated USING (cuenta = auth.uid() OR public.es_admin());

-- ── Contexto del plantel: lo captura y lo ve el personal, no el alumno.
DROP POLICY IF EXISTS contexto_personal ON public.estudio_contexto_escuela;
CREATE POLICY contexto_personal ON public.estudio_contexto_escuela
  FOR ALL TO authenticated
  USING (public.es_docente_o_admin())
  WITH CHECK (public.es_docente_o_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- DOSIS DE USO (§6)
--
-- Vista, no tabla: se calcula de los eventos y así nunca puede quedar
-- desincronizada de ellos.
--
-- «MINUTOS ACTIVOS» — LA DEFINICIÓN, QUE ES LO QUE IMPORTA. No son minutos con
-- la pestaña abierta: son minutos en los que hubo interacción. Se cuenta así:
-- dos eventos consecutivos del mismo alumno separados por MENOS de 60 segundos
-- suman esa diferencia; separados por más, suman 0 (ahí el alumno se fue a
-- otra cosa, aunque la pestaña siguiera abierta). Es la definición que evita
-- que una computadora encendida toda la tarde parezca cuatro horas de estudio.
-- ═══════════════════════════════════════════════════════════════════════════
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
  -- Una sesión nueva empieza cuando pasaron más de 30 minutos sin nada.
  COUNT(*) FILTER (WHERE hueco_seg IS NULL OR hueco_seg > 1800)      AS sesiones,
  ROUND(SUM(CASE WHEN hueco_seg <= 60 THEN hueco_seg ELSE 0 END) / 60.0, 1) AS minutos_activos,
  COUNT(*) FILTER (WHERE tipo = 'inicio')                            AS actividades_iniciadas,
  COUNT(*) FILTER (WHERE tipo = 'fin')                               AS actividades_completadas,
  COUNT(DISTINCT dia)                                                AS dias_distintos
FROM pasos
GROUP BY alumno, ancla, semana;

-- La vista hereda la RLS de `eventos_aprendizaje` (sólo admin lee) porque se
-- define con `security_invoker`: sin esto, una vista es un agujero por el que
-- se lee lo que la tabla de abajo prohíbe.
ALTER VIEW public.estudio_dosis SET (security_invoker = true);

-- ═══════════════════════════════════════════════════════════════════════════
-- COMPROBACIÓN
--
-- Ejecutar después de la migración. Las nueve tablas deben aparecer con RLS
-- activada; si alguna sale en `false`, esa tabla está abierta al mundo.
--
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public'
--     AND (tablename LIKE 'estudio_%' OR tablename IN ('consentimientos', 'eventos_aprendizaje'))
--   ORDER BY tablename;
-- ═══════════════════════════════════════════════════════════════════════════
