# Antes de tocar nada de esta carpeta

Escrito el 2-sep-2026, durante la auditoria previa a la entrega. Son hechos
medidos sobre los archivos que estan aqui al lado, no recomendaciones de
memoria.

## 1. Esta carpeta viene de OTRO producto

Las cabeceras lo dicen solas: «CEN ACADEMY V2.0», «CEN Plataforma de Educacion
Financiera», «CEN Financiera», y `security_triggers.sql` incluso anota de que
proyecto de Supabase se capturo. Las tablas que crean —`lessons`,
`lesson_contents`, `user_progress`, `progress`, `grupos`, `alumnos_grupos`,
`intentos`— son de aquella plataforma.

## 2. De todo eso, Tecnia hoy usa UNA tabla y DOS columnas

Medido con un `grep` de `.from('...')` sobre `src/` entero: la unica consulta a
Supabase que existe en el codigo esta en `src/lib/supabase-server.ts`, y pide
`profiles(id, role)`. Nada mas. El progreso del alumno **no** vive en Supabase:
va por el repositorio local, porque asi se decidio.

Asi que para arrancar basta con que exista `public.profiles` con `id`, `role` y
el trigger que crea la fila al registrarse un usuario. Todo lo demas de esta
carpeta es opcional, y varias piezas son de una plataforma que no es esta.

## 3. Si aun asi se ejecuta todo: el orden importa

**Cinco archivos distintos definen `public.handle_new_user()`** (`schema.sql`,
`migration_v2.sql`, `security_triggers.sql`, `migrations/institutional_full.sql`
y `migrations/fix_handle_new_user_role_escalation.sql`). Como todos usan
`CREATE OR REPLACE`, **gana el ultimo que se ejecute**, y no todos insertan las
mismas columnas: el de `institutional_full.sql` ademas mete al alumno en su
grupo.

Lo bueno: los cinco fijan el rol a `'student'` a mano. La escalada de
privilegios que permitia pedir el rol en la metadata de la invitacion esta
cerrada en los cinco, comprobado uno por uno el 2-sep-2026. Sea cual sea el
orden, nadie se hace administrador registrandose.

Orden que funciona sobre un proyecto vacio:

1. `schema.sql` — crea las extensiones, los tipos, `profiles` y el trigger.
2. `security_triggers.sql` — funciones `SECURITY DEFINER` y RLS de `profiles`.
3. `migrations/add_super_admin_role.sql` — amplia el CHECK del rol con
   `super_admin`, que el codigo ya contempla y el CHECK de `schema.sql` no
   acepta. Sin esto, promover a alguien a `super_admin` falla.
4. `migrations/fix_rls_alumno_ve_su_perfil.sql` — separa en dos politicas la
   que dejaba a un docente leer cualquier perfil.
5. `migrations/fix_handle_new_user_role_escalation.sql` — redundante si ya
   corrio `schema.sql` (ese ya fija `'student'`), inofensivo, y deja la version
   mas simple del trigger como la ultima que gana.
6. `indexes.sql` — indices sobre `progress` y `profiles`. **Ojo**: los tres de
   `progress` solo sirven si se creo esa tabla, y Tecnia no la usa.

`migration_v2.sql` es SOLO para un despliegue que ya tuviera el esquema v1
encima; sobre un proyecto nuevo no se ejecuta. `migrations/institutional_full.sql`
trae el modelo institucional de CEN Financiera (grupos, intentos): no se ejecuta
salvo que se quiera ese modelo, y si se ejecuta debe ir ANTES del paso 5 para
que el trigger que quede al final sea el que se eligio a proposito.

## 4. Lo que se corrigio en el codigo el 2-sep-2026

`requireAdminSession()` pedia `profiles(id, role, escuela_id)`. Ningun archivo
de esta carpeta crea `escuela_id`, y ninguna otra linea del proyecto lee ese
campo. PostgREST no ignora una columna inexistente: falla la consulta entera, y
el manejo de error de esa funcion lo habria traducido a «FORBIDDEN: perfil no
encontrado» **para un administrador legitimo**. No salto nunca porque la funcion
todavia no tiene ni un llamador y porque su prueba usa un doble. Se quito la
columna; el detalle esta comentado en `src/lib/supabase-server.ts`.

## 5. Lo que NO esta hecho, a proposito

No hay autenticacion real conectada ni repositorio de progreso en Supabase: se
decidio dejarlo fuera de esta entrega. El proxy (`src/proxy.ts`) arranca en modo
demo mientras falten `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
y con eso la plataforma entera funciona sin base de datos.
