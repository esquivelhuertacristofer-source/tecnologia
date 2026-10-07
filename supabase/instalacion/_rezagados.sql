
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
