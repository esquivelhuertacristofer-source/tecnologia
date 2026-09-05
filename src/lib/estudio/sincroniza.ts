/**
 * Estudio de impacto — vaciar la cola contra Supabase, por lotes.
 *
 * CÓMO NO DUPLICA. Cada fila lleva un `evento_id` que se generó en el cliente,
 * y todas las tablas del estudio lo tienen con `UNIQUE`. El envío usa `upsert`
 * con `onConflict: 'evento_id'` e `ignoreDuplicates`, así que reenviar un lote
 * que ya había llegado —porque se cortó la red justo después de escribir y
 * antes de confirmar— no escribe nada dos veces. Es la razón de que el UUID lo
 * ponga el cliente y no la base: el cliente es el único que sabe que «esto que
 * mando ahora es lo mismo que mandé hace un minuto».
 *
 * CUÁNDO CORRE. Al cargar la página, cuando vuelve la conexión, y cada pocos
 * minutos. Nunca en medio de una actividad: `requestIdleCallback` cuando
 * existe, y si no, un `setTimeout` largo. El alumno no debe notar que esto
 * ocurre.
 *
 * POR QUÉ UN LOTE QUE FALLA SE REINTENTA FILA A FILA. Un lote va en UNA
 * petición: si una sola fila la rechaza la base, **falla el lote entero** y las
 * otras 99 se quedan sin escribir. Y hay un caso realista en el que eso pasa:
 * `estudio_respuestas` tiene `UNIQUE (alumno, cuestionario, reactivo)`, así que
 * un alumno al que se le borró el `localStorage` a media faena vuelve a
 * contestar un reactivo que ya estaba guardado, con otro `evento_id`. Esa fila
 * choca para siempre —el `onConflict` es por `evento_id`, no por esa clave— y,
 * sin este reintento, se llevaría por delante 99 filas buenas en cada pasada
 * hasta que las veinte oportunidades se agotaran. Se descubrió leyendo el
 * esquema, no en producción; en producción habría sido una pérdida de datos
 * silenciosa y difícil de explicar.
 */

import { supabase } from '@/lib/supabase-browser';
import { confirmar, marcarIntento, pendientes, type FilaEnCola } from './cola';
import { registrarError } from './errores';

const TAMANO_LOTE = 100;

/** Agrupa por tabla: Supabase inserta en una tabla por llamada. */
function porTabla(filas: FilaEnCola[]): Map<string, FilaEnCola[]> {
  const m = new Map<string, FilaEnCola[]>();
  for (const f of filas) {
    if (!m.has(f.tabla)) m.set(f.tabla, []);
    m.get(f.tabla)!.push(f);
  }
  return m;
}

export interface ResultadoSincronia {
  enviadas: number;
  fallidas: number;
  descartadas: number;
}

/**
 * Manda lo que haya pendiente. Nunca lanza: un fallo de sincronía es un dato
 * que llegará más tarde, no un problema del alumno.
 */
export async function sincronizar(): Promise<ResultadoSincronia> {
  const salida: ResultadoSincronia = { enviadas: 0, fallidas: 0, descartadas: 0 };

  if (typeof navigator !== 'undefined' && navigator.onLine === false) return salida;

  let filas: FilaEnCola[] = [];
  try {
    filas = await pendientes(TAMANO_LOTE);
  } catch (e) {
    registrarError('sincroniza.leerCola', e);
    return salida;
  }
  if (filas.length === 0) return salida;

  for (const [tabla, delLote] of porTabla(filas)) {
    // Los errores del propio estudio se mandan igual que lo demás, pero si es
    // la tabla de errores la que falla, no se registra el fallo: sería un
    // bucle que se alimenta a sí mismo.
    const esTablaDeErrores = tabla === 'estudio_errores';

    const fallo = await mandar(tabla, delLote);
    if (!fallo) {
      await confirmar(delLote.map((f) => f.eventoId));
      salida.enviadas += delLote.length;
      continue;
    }

    /*
     * El lote falló. Se prueban una a una para salvar todas las que sí entran.
     *
     * No se apunta como error si el fallo fue un DUPLICADO: eso significa que
     * el dato ya estaba guardado, que es una condición normal —una fila que se
     * reenvía— y no un problema. Apuntarlo llenaría `estudio_errores` de ruido,
     * y esa tabla sólo sirve si cuando tiene filas quiere decir algo.
     */
    if (!esTablaDeErrores && !esDuplicado(fallo)) {
      registrarError('sincroniza.lote', fallo, { tabla, filas: delLote.length });
    }
    for (const f of delLote) {
      const fSolo = await mandar(tabla, [f]);
      if (!fSolo) {
        await confirmar([f.eventoId]);
        salida.enviadas += 1;
        continue;
      }
      // Una violación de unicidad significa que el dato YA ESTÁ en la base:
      // la fila se da por buena y se saca de la cola. Reintentarla veinte
      // veces no la va a arreglar y sólo llena la tabla de errores.
      if (esDuplicado(fSolo)) {
        await confirmar([f.eventoId]);
        salida.enviadas += 1;
        continue;
      }
      const descartadas = await marcarIntento([f.eventoId]);
      salida.fallidas += 1;
      salida.descartadas += descartadas.length;
    }
  }

  return salida;
}

/** Manda unas filas. Devuelve el error, o `null` si entraron. */
async function mandar(tabla: string, filas: FilaEnCola[]): Promise<unknown | null> {
  try {
    const { error } = await supabase
      .from(tabla)
      .upsert(
        filas.map((f) => ({ evento_id: f.eventoId, ...f.fila })),
        { onConflict: 'evento_id', ignoreDuplicates: true },
      );
    return error ?? null;
  } catch (e) {
    return e;
  }
}

/** `23505` es la violación de unicidad de PostgreSQL. */
function esDuplicado(error: unknown): boolean {
  const c = (error as { code?: string } | null)?.code;
  return c === '23505';
}

// ─── El calendario ───────────────────────────────────────────────────────────

let temporizador: ReturnType<typeof setInterval> | null = null;
const CADA_MS = 3 * 60 * 1000;

function cuandoNoMoleste(tarea: () => void): void {
  const w = globalThis as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void };
  if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(tarea, { timeout: 10_000 });
  else setTimeout(tarea, 4000);
}

/**
 * Arranca la sincronía periódica. Idempotente: llamarla dos veces no crea dos
 * temporizadores. Devuelve la función para pararla.
 */
export function arrancarSincronia(): () => void {
  if (typeof window === 'undefined') return () => {};

  const tirar = () => cuandoNoMoleste(() => { void sincronizar(); });
  // Al ocultar la pestaña se manda lo que quede: es el momento en que más
  // probable es que el alumno esté a punto de cerrar el navegador.
  const alOcultar = () => { if (document.visibilityState === 'hidden') void sincronizar(); };

  if (temporizador) return () => {};   // ya estaba en marcha: no se duplica nada

  tirar();
  temporizador = setInterval(tirar, CADA_MS);
  window.addEventListener('online', tirar);
  document.addEventListener('visibilitychange', alOcultar);

  return () => {
    if (temporizador) clearInterval(temporizador);
    temporizador = null;
    window.removeEventListener('online', tirar);
    /*
     * `visibilitychange` SE QUITA TAMBIÉN. Antes se añadía dentro del `if` y no
     * se retiraba nunca: como `temporizador` vuelve a `null` al desmontar, cada
     * navegación del alumno por el hub dejaba un oyente más pegado al
     * documento. Con veinte clases abiertas en una sesión, veinte
     * sincronizaciones simultáneas cada vez que cambia de pestaña.
     */
    document.removeEventListener('visibilitychange', alOcultar);
  };
}
