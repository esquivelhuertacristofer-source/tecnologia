import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components cannot set cookies — safe to ignore in read-only contexts
          }
        },
      },
    }
  )
}

export async function requireAdminSession() {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('UNAUTHORIZED: no hay sesión válida')
  }

  /*
   * PIDE SOLO LAS COLUMNAS QUE EXISTEN (2-sep-2026, auditoria).
   *
   * Aqui decia `.select('id, role, escuela_id')`. Ninguno de los ocho archivos
   * de `supabase/` crea una columna `escuela_id` en `profiles` —ni el
   * `schema.sql` que se entrega, ni las migraciones—, y nadie lee ese campo:
   * `profile.escuela_id` no aparece en ninguna otra linea del proyecto. En
   * PostgREST una columna inexistente no se ignora: la consulta entera falla,
   * y como el error cae en el `if` de abajo, el usuario habria visto
   * «FORBIDDEN: perfil no encontrado» siendo administrador de verdad.
   *
   * No se vio nunca porque esta funcion todavia no tiene ni un llamador y
   * porque su prueba usa un doble que devuelve el objeto ya hecho, sin pasar
   * por PostgREST. Habria estallado el primer dia con Supabase conectado.
   */
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('FORBIDDEN: perfil no encontrado')
  }

  if (!['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('FORBIDDEN: rol insuficiente')
  }

  return {
    user,
    profile,
    isAdmin: true,
    isSuperAdmin: profile.role === 'super_admin',
  }
}
