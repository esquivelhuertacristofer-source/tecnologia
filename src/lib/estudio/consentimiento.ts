/**
 * Estudio de impacto — registro de consentimiento (§4).
 *
 * QUÉ SE REGISTRA Y POR QUÉ CADA COSA. Una fila por cada vez que alguien
 * acepta el aviso de privacidad: quién (la cuenta), de qué tipo (alumno,
 * tutor, docente, institución), **qué versión del aviso** aceptó, cuándo,
 * desde qué red aproximada y con qué navegador. Sin la versión, el registro no
 * sirve: decir «aceptó» sin decir «aceptó QUÉ» no acredita nada el día que el
 * texto cambie.
 *
 * POR QUÉ HAY UNA RUTA DE SERVIDOR EN MEDIO. La IP no la conoce el navegador,
 * la conoce el servidor. Y se guarda TRUNCADA —el último octeto a cero— porque
 * para acreditar un consentimiento basta la red aproximada, mientras que la IP
 * completa apunta a un domicilio, y aquí hablamos de menores de edad.
 *
 * EL CONSENTIMIENTO DEL TUTOR ESTÁ PREPARADO Y APAGADO, como pide el encargo.
 * La tabla tiene `tutor_de` y `codigo`, y `enlaceDeTutor` genera el enlace,
 * pero nada en la interfaz lo llama todavía. Cuándo se enciende es una
 * decisión legal, no técnica.
 */

import { supabase } from '@/lib/supabase-browser';
import { CLAVE_CONSENTIMIENTO, VERSION_AVISO } from './config';
import { registrarError } from './errores';

export type TipoConsentimiento = 'alumno' | 'tutor' | 'docente' | 'institucion';

export const RUTA_CONSENTIMIENTO = '/api/estudio/consentimiento';

/**
 * ¿Esta persona ya aceptó la versión vigente del aviso?
 *
 * Se responde primero con lo que hay en el navegador —para no pedir el
 * consentimiento otra vez en cada carga— y el servidor es quien manda cuando
 * contesta. Si el aviso sube de versión, `VERSION_AVISO` cambia y esto pasa a
 * devolver `false` para todo el mundo: se vuelve a pedir, que es lo que exige
 * la ley y lo que pide el encargo.
 */
export function consentimientoVigenteLocal(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(CLAVE_CONSENTIMIENTO) === VERSION_AVISO;
  } catch {
    return false;
  }
}

function recordarLocalmente(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLAVE_CONSENTIMIENTO, VERSION_AVISO);
  } catch { /* sin almacenamiento: se volverá a preguntar, que no es grave */ }
}

export async function consentimientoVigente(): Promise<boolean> {
  if (consentimientoVigenteLocal()) return true;
  try {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return false;
    const { data: filas, error } = await supabase
      .from('consentimientos')
      .select('id')
      .eq('cuenta', data.user.id)
      .eq('version_aviso', VERSION_AVISO)
      .limit(1);
    if (error) throw error;
    const hay = (filas?.length ?? 0) > 0;
    if (hay) recordarLocalmente();
    return hay;
  } catch (e) {
    registrarError('consentimiento.consultar', e);
    return false;
  }
}

/**
 * Registra que esta persona acepta el aviso vigente.
 *
 * Nunca lanza y nunca bloquea: si la ruta falla, el usuario entra igual y el
 * fallo queda en `estudio_errores`. Un registro de consentimiento que impide
 * iniciar sesión convierte un requisito legal en una caída del servicio.
 */
export async function registrarConsentimiento(tipo: TipoConsentimiento = 'alumno'): Promise<boolean> {
  recordarLocalmente();
  try {
    const respuesta = await fetch(RUTA_CONSENTIMIENTO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, version_aviso: VERSION_AVISO }),
    });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    return true;
  } catch (e) {
    registrarError('consentimiento.registrar', e, { tipo });
    return false;
  }
}

/**
 * PREPARADO, NO ACTIVADO. El enlace con el que un padre o tutor aceptaría por
 * su hijo. No lo llama nada todavía; existe para que el día que Legal diga
 * «adelante» sea encender una pantalla, no diseñar un flujo.
 *
 * El código es de un solo uso y no adivinable: va a la columna `codigo`, que
 * es UNIQUE, y el flujo del tutor lo canjearía creando su propia fila con
 * `tipo = 'tutor'` y `tutor_de` apuntando a la cuenta del menor.
 */
export function enlaceDeTutor(base: string, codigo: string): string {
  return `${base.replace(/\/$/, '')}/consentimiento-tutor?c=${encodeURIComponent(codigo)}`;
}
