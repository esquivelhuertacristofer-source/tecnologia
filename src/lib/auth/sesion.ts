/**
 * La sesión de verdad (3-sep-2026).
 *
 * Hasta hoy «iniciar sesión» era una ficción amable: el formulario aceptaba
 * cualquier correo y guardaba un perfil de demostración en `localStorage`. Ya
 * hay proyecto de Supabase y cuentas reales, así que este módulo es la única
 * puerta por la que la plataforma pregunta quién eres.
 *
 * DÓNDE VIVE EL ROL. En `app_metadata.rol`, no en una tabla. `app_metadata`
 * sólo lo escribe la llave secreta desde el servidor: un alumno no puede
 * ascenderse a docente editando su propio perfil, que es exactamente lo que
 * pasaría si el rol viviera en `user_metadata` (eso sí lo puede cambiar
 * cualquiera con su propia sesión). Cuando exista la tabla `profiles` con sus
 * políticas RLS, el rol seguirá viniendo de aquí: la tabla guardará lo demás.
 *
 * QUÉ NO HACE. No protege páginas: eso, mientras el progreso viva en el
 * `localStorage` de cada equipo, es cosa de la interfaz. La frontera de verdad
 * es RLS en Supabase, y se aplica el día que haya datos suyos que leer.
 */
import { supabase } from '@/lib/supabase-browser';

export type Rol = 'alumno' | 'docente' | 'admin';

interface UsuarioConMetadatos {
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

/** El rol del usuario, siempre uno de los tres y con `alumno` por defecto. */
export function rolDe(usuario: UsuarioConMetadatos | null | undefined): Rol {
  const crudo = usuario?.app_metadata?.rol ?? usuario?.user_metadata?.rol;
  return crudo === 'docente' || crudo === 'admin' ? crudo : 'alumno';
}

export function nombreDe(usuario: UsuarioConMetadatos | null | undefined): string {
  const n = usuario?.user_metadata?.nombre;
  if (typeof n === 'string' && n.trim()) return n.trim();
  // Sin nombre, la parte del correo antes de la arroba es mejor que «usuario».
  return usuario?.email?.split('@')[0] ?? 'Invitada';
}

/**
 * Traduce los errores de Supabase, que llegan en inglés y a veces con jerga.
 * Una pantalla de login que dice «Invalid login credentials» a una maestra de
 * primaria no está diciendo nada.
 */
export function mensajeDeError(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Esa cuenta todavía no está confirmada.';
  if (m.includes('too many requests') || m.includes('rate limit')) {
    return 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.';
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'No hay conexión con el servidor. Revisa tu internet.';
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}

export type ResultadoEntrada =
  | { ok: true; rol: Rol; nombre: string }
  | { ok: false; mensaje: string };

export async function entrarConCorreo(correo: string, contrasena: string): Promise<ResultadoEntrada> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: contrasena,
    });
    if (error) return { ok: false, mensaje: mensajeDeError(error.message) };
    if (!data.user) return { ok: false, mensaje: 'No se pudo iniciar sesión. Inténtalo de nuevo.' };
    return { ok: true, rol: rolDe(data.user), nombre: nombreDe(data.user) };
  } catch (e) {
    return { ok: false, mensaje: mensajeDeError(e instanceof Error ? e.message : '') };
  }
}

/** Quién está dentro ahora mismo, o `null` si nadie. Nunca lanza. */
export async function sesionActual(): Promise<{ rol: Rol; nombre: string; correo: string } | null> {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return { rol: rolDe(data.user), nombre: nombreDe(data.user), correo: data.user.email ?? '' };
  } catch {
    return null;
  }
}

/** Cierra la sesión de Supabase. El perfil local lo borra quien llama. */
export async function salir(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // Sin sesión que cerrar (modo demo) no hay nada que hacer.
  }
}
