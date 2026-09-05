/**
 * Estudio de impacto — aplicar un cuestionario.
 *
 * Une las tres piezas que hasta ahora iban por su lado: el motor (qué reactivo
 * toca), el almacén (por dónde iba este alumno) y la cola (qué se manda al
 * servidor). La interfaz sólo habla con este módulo.
 *
 * Cada respuesta genera DOS escrituras y ninguna de las dos puede fallar hacia
 * el alumno:
 *
 *   · una fila en `estudio_respuestas` —una por reactivo, como pide el
 *     encargo, para poder analizar reactivo a reactivo y no sólo el total—;
 *   · la actualización de `estudio_cuestionarios_aplicados`, que es lo que
 *     permite saber cuántos EMPEZARON y no sólo cuántos terminaron. Sin esa
 *     tabla, un cuestionario abandonado por la mitad es indistinguible de uno
 *     que nunca se abrió, y son cosas muy distintas.
 */

import { VERSION_APP, type CuestionarioId } from '../config';
import { encolar } from '../cola';
import { tipoDeDispositivo } from '../dispositivo';
import { registrarError } from '../errores';
import type { IdentidadEstudio } from '../identidad';
import { guardarAvance, leerAvance } from './almacen';
import { avanceInicial, registrarRespuesta, siguienteReactivo } from './motor';
import type { AvanceCuestionario, Cuestionario } from './tipos';

export const TABLA_RESPUESTAS = 'estudio_respuestas';
export const TABLA_APLICADOS = 'estudio_cuestionarios_aplicados';

/**
 * Empieza o retoma un cuestionario.
 *
 * Si ya hay avance guardado se devuelve tal cual —incluido el caso de que esté
 * completado, que el llamador debe comprobar con `yaAplicado` antes de
 * enseñar nada—. Si no lo hay, se crea y se apunta el inicio en el servidor.
 */
export async function iniciar(
  cuestionario: Cuestionario,
  identidad: IdentidadEstudio,
  ahora: Date = new Date(),
): Promise<AvanceCuestionario> {
  const id = cuestionario.id as CuestionarioId;
  const guardado = leerAvance(id);
  if (guardado) return guardado;

  const avance = avanceInicial(cuestionario, identidad.estudioId, ahora.toISOString());
  guardarAvance(id, avance);

  await encolar(TABLA_APLICADOS, {
    alumno: identidad.estudioId,
    ancla: identidad.ancla,
    cuestionario: cuestionario.id,
    version_cuestionario: cuestionario.version,
    inicio: avance.inicio,
    fin: null,
    completado: false,
    dispositivo: tipoDeDispositivo(),
    version_app: VERSION_APP,
  }).catch((e) => registrarError('aplicacion.iniciar', e));

  return avance;
}

/**
 * Registra una respuesta: la guarda localmente y la encola.
 *
 * El orden importa. Primero el almacén local, que es lo que garantiza que el
 * alumno no vuelva a ver el reactivo; después la cola. Si se hiciera al revés
 * y la pestaña se cerrara en medio, el alumno podría volver a contestar el
 * mismo reactivo y el análisis vería dos respuestas del mismo sujeto al mismo
 * ítem, que es exactamente lo que el encargo prohíbe.
 */
export async function responder(
  cuestionario: Cuestionario,
  identidad: IdentidadEstudio,
  avance: AvanceCuestionario,
  entrada: { reactivoId: string; respuesta: number | null; tiempoMs: number; orden: number },
  ahora: Date = new Date(),
): Promise<AvanceCuestionario> {
  const id = cuestionario.id as CuestionarioId;
  const siguiente = registrarRespuesta(cuestionario, avance, { ...entrada, ahoraIso: ahora.toISOString() });

  // `registrarRespuesta` devuelve el mismo objeto si el reactivo ya estaba
  // contestado. Sin esta salida, un doble clic escribiría dos filas.
  if (siguiente === avance) return avance;

  guardarAvance(id, siguiente);

  const fila = siguiente.respuestas[siguiente.respuestas.length - 1];
  await encolar(TABLA_RESPUESTAS, {
    alumno: identidad.estudioId,
    ancla: identidad.ancla,
    cuestionario: cuestionario.id,
    version_cuestionario: cuestionario.version,
    reactivo: fila.reactivoId,
    respuesta: fila.respuesta,
    correcta: fila.correcta,
    tiempo_ms: fila.tiempoMs,
    orden: fila.orden,
    ts_cliente: fila.ts,
  }).catch((e) => registrarError('aplicacion.responder', e));

  if (siguiente.completado) {
    await encolar(TABLA_APLICADOS, {
      alumno: identidad.estudioId,
      ancla: identidad.ancla,
      cuestionario: cuestionario.id,
      version_cuestionario: cuestionario.version,
      inicio: siguiente.inicio,
      fin: siguiente.fin,
      completado: true,
      dispositivo: tipoDeDispositivo(),
      version_app: VERSION_APP,
    }).catch((e) => registrarError('aplicacion.terminar', e));
  }

  return siguiente;
}

/** ¿Queda algo por contestar? Azúcar para la interfaz. */
export function quedaAlgo(cuestionario: Cuestionario, avance: AvanceCuestionario): boolean {
  return siguienteReactivo(cuestionario, avance) !== null;
}
