/**
 * Estudio de impacto — resolver quién es el sujeto y si su escuela participa.
 *
 * Es el único módulo del estudio que habla con Supabase para LEER. Todo lo que
 * escribe pasa por la cola (`cola.ts` + `sincroniza.ts`).
 *
 * Las dos preguntas que resuelve, y las dos tienen la misma respuesta cuando
 * algo falla: **seguir sin medir**. Ni una excepción sube de aquí.
 */

import { supabase } from '@/lib/supabase-browser';
import { ESCUELA_POR_ENTORNO } from './config';
import { registrarError } from './errores';
import { fijarIdentidadDeCuenta, identidadLocal, type IdentidadEstudio } from './identidad';
import {
  NO_PARTICIPA,
  estadoDesdeEscuela,
  guardarCache,
  participacionInmediata,
  type EscuelaEstudio,
  type EstadoParticipacion,
} from './participacion';

export const TABLA_ALUMNOS = 'estudio_alumnos';
export const TABLA_ESCUELAS = 'estudio_escuelas';

/**
 * La identidad se resuelve UNA vez por carga de página.
 *
 * Sin esto, cada montaje de actividad haría su propia consulta a Supabase —el
 * hook de telemetría la pide en cada clase que se abre— y en una escuela con
 * internet intermitente eso son decenas de peticiones que compiten con la
 * plataforma por el poco ancho de banda que hay. Se guarda la PROMESA, no el
 * resultado, para que dos llamadas simultáneas tampoco disparen dos consultas.
 */
let enCurso: Promise<IdentidadEstudio> | null = null;

/** Sólo para las pruebas: olvida la identidad memorizada. */
export function olvidarIdentidad(): void {
  enCurso = null;
}

/**
 * El identificador de estudio del alumno que está dentro.
 *
 * Con cuenta, se pide al servidor el UUID ya asociado a esa cuenta —o se crea—
 * y así el mismo alumno en otro equipo sigue siendo el mismo sujeto. Sin
 * cuenta, o si el servidor no contesta, se usa el del navegador, que
 * identifica al EQUIPO y no a la persona (ver `identidad.ts`).
 */
export function identidadActual(): Promise<IdentidadEstudio> {
  if (!enCurso) {
    enCurso = resolverIdentidad().catch((e) => {
      // Un fallo no puede envenenar la memoria: la próxima vez se reintenta.
      enCurso = null;
      registrarError('sesion.identidad', e);
      return identidadLocal();
    });
  }
  return enCurso;
}

async function resolverIdentidad(): Promise<IdentidadEstudio> {
  try {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;
    if (!uid) return identidadLocal();

    const { data: fila, error } = await supabase
      .from(TABLA_ALUMNOS)
      .select('estudio_id')
      .eq('cuenta', uid)
      .maybeSingle();

    if (error) throw error;
    if (fila?.estudio_id) return fijarIdentidadDeCuenta(fila.estudio_id as string);

    // Primera vez con esta cuenta: se propone el id que ya tenía el navegador,
    // de modo que si el alumno contestó algo antes de iniciar sesión, ese
    // avance no se queda huérfano. `ON CONFLICT` en la base decide.
    const propuesto = identidadLocal().estudioId;
    const { data: creada, error: errorAlta } = await supabase
      .from(TABLA_ALUMNOS)
      .insert({ cuenta: uid, estudio_id: propuesto, escuela_id: ESCUELA_POR_ENTORNO || null })
      .select('estudio_id')
      .maybeSingle();

    if (errorAlta) throw errorAlta;
    return fijarIdentidadDeCuenta((creada?.estudio_id as string) ?? propuesto);
  } catch (e) {
    registrarError('sesion.identidad', e);
    return identidadLocal();
  }
}

/**
 * El estado de participación, preguntando al servidor.
 *
 * Devuelve lo inmediato (entorno o caché) si el servidor no contesta. Quien la
 * llama debería pintar YA con `participacionInmediata()` y refrescar con esto.
 */
export async function participacionActual(hoyIso = new Date().toISOString().slice(0, 10)): Promise<EstadoParticipacion> {
  const inmediata = participacionInmediata();
  if (inmediata.origen === 'forzado') return inmediata;

  try {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;

    // Sin cuenta no hay forma de saber a qué escuela pertenece este navegador,
    // salvo que el despliegue lo diga por entorno. Sin eso, no participa.
    let escuelaId: string | null = ESCUELA_POR_ENTORNO || null;

    if (uid) {
      const { data: alumno } = await supabase
        .from(TABLA_ALUMNOS)
        .select('escuela_id')
        .eq('cuenta', uid)
        .maybeSingle();
      escuelaId = (alumno?.escuela_id as string | null) ?? escuelaId;
    }

    if (!escuelaId) {
      guardarCache(NO_PARTICIPA);
      return NO_PARTICIPA;
    }

    const { data: escuela, error } = await supabase
      .from(TABLA_ESCUELAS)
      .select('id, participa, salida_desde, salida_hasta')
      .eq('id', escuelaId)
      .maybeSingle();

    if (error) throw error;
    if (!escuela) {
      guardarCache(NO_PARTICIPA);
      return NO_PARTICIPA;
    }

    const estado = estadoDesdeEscuela(escuela as unknown as EscuelaEstudio, hoyIso);
    guardarCache(estado);
    return estado;
  } catch (e) {
    registrarError('sesion.participacion', e);
    return inmediata;
  }
}
