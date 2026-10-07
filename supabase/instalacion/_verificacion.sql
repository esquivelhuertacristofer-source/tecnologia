
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
