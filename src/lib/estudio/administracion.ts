/**
 * Estudio de impacto — lo que hace el panel de administración (§8 y §12).
 *
 * Todo lo de aquí exige rol `admin` o `docente` en la base: las políticas RLS
 * de `estudio_impacto.sql` mandan, no esta capa. Si alguien llega a estas
 * funciones sin permiso, Supabase devuelve error y la pantalla lo dice; no hay
 * una segunda comprobación aquí que pueda desincronizarse de la primera.
 *
 * A DIFERENCIA DEL RESTO DEL ESTUDIO, ESTO SÍ PUEDE FALLAR HACIA EL USUARIO.
 * La regla de «fallar en silencio» protege al ALUMNO. Un administrador que
 * cree haber encendido el estudio y no lo encendió es el peor resultado
 * posible: los alumnos entran, nadie los mide, y el dato del primer día no se
 * puede recuperar. Aquí un error se enseña grande.
 */

import { supabase } from '@/lib/supabase-browser';
import type { EscuelaEstudio } from './participacion';

export interface ContextoEscuela {
  escuela_id: string;
  conectividad: 'buena' | 'intermitente' | 'sin_internet' | null;
  dispositivos: 'uno_por_alumno' | 'compartidos' | 'solo_docente' | null;
  modalidad: 'presencial' | 'mixta' | 'a_distancia' | null;
  zona: 'urbana' | 'rural' | null;
  notas: string | null;
}

export interface EscuelaConContexto extends EscuelaEstudio {
  nombre: string;
  contexto: ContextoEscuela | null;
}

export async function listarEscuelas(): Promise<EscuelaConContexto[]> {
  const { data, error } = await supabase
    .from('estudio_escuelas')
    .select('id, nombre, participa, salida_desde, salida_hasta, estudio_contexto_escuela(*)')
    .order('nombre');
  if (error) throw error;

  return (data ?? []).map((e) => {
    const fila = e as unknown as EscuelaEstudio & {
      nombre: string;
      estudio_contexto_escuela: ContextoEscuela[] | ContextoEscuela | null;
    };
    const ctx = fila.estudio_contexto_escuela;
    return {
      id: fila.id,
      nombre: fila.nombre,
      participa: fila.participa,
      salida_desde: fila.salida_desde,
      salida_hasta: fila.salida_hasta,
      contexto: Array.isArray(ctx) ? (ctx[0] ?? null) : ctx,
    };
  });
}

export async function crearEscuela(id: string, nombre: string): Promise<void> {
  const { error } = await supabase.from('estudio_escuelas').insert({ id, nombre, participa: false });
  if (error) throw error;
}

/**
 * Enciende o apaga la participación. **Es el interruptor del estudio**: con
 * esto en `false`, esa escuela no ve un solo cuestionario.
 */
export async function cambiarParticipacion(id: string, participa: boolean): Promise<void> {
  const { error } = await supabase
    .from('estudio_escuelas')
    .update({ participa, actualizada_en: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Abre o cierra la ventana del cuestionario de salida (§3).
 * Pasar `null` en las dos fechas la cierra.
 */
export async function fijarVentanaSalida(
  id: string,
  desde: string | null,
  hasta: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('estudio_escuelas')
    .update({
      salida_desde: desde || null,
      salida_hasta: hasta || null,
      actualizada_en: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

/** Ficha de plantel (§8). Se captura una vez y se puede corregir. */
export async function guardarContexto(ctx: ContextoEscuela): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const { error } = await supabase.from('estudio_contexto_escuela').upsert(
    {
      escuela_id: ctx.escuela_id,
      conectividad: ctx.conectividad,
      dispositivos: ctx.dispositivos,
      modalidad: ctx.modalidad,
      zona: ctx.zona,
      notas: ctx.notas,
      capturado_por: data?.user?.id ?? null,
      capturado_en: new Date().toISOString(),
    },
    { onConflict: 'escuela_id' },
  );
  if (error) throw error;
}

/**
 * Cuántos datos lleva recogidos el estudio.
 *
 * Es la pantalla que contesta «¿esto está midiendo de verdad?», y por eso
 * cuenta cuestionarios COMPLETADOS y EMPEZADOS por separado: si empezaron
 * cuarenta y terminaron tres, hay un problema que ningún error de consola va a
 * contar.
 */
export interface Pulso {
  aplicadosEmpezados: number;
  aplicadosCompletados: number;
  respuestas: number;
  eventos: number;
  errores: number;
}

async function cuantas(tabla: string, filtro?: (q: ReturnType<typeof supabase.from>) => unknown): Promise<number> {
  let consulta = supabase.from(tabla).select('*', { count: 'exact', head: true });
  if (filtro) consulta = filtro(consulta as never) as typeof consulta;
  const { count, error } = await consulta;
  if (error) throw error;
  return count ?? 0;
}

export async function pulsoDelEstudio(): Promise<Pulso> {
  const [empezados, completados, respuestas, eventos, errores] = await Promise.all([
    cuantas('estudio_cuestionarios_aplicados'),
    cuantas('estudio_cuestionarios_aplicados', (q) =>
      (q as unknown as { eq: (c: string, v: boolean) => unknown }).eq('completado', true)),
    cuantas('estudio_respuestas'),
    cuantas('eventos_aprendizaje'),
    cuantas('estudio_errores'),
  ]);
  return {
    aplicadosEmpezados: empezados,
    aplicadosCompletados: completados,
    respuestas,
    eventos,
    errores,
  };
}
