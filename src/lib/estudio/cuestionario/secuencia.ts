/**
 * Estudio de impacto — en qué orden se aplican los cuestionarios.
 *
 * Vive aparte de la puerta (`PuertaEstudio.tsx`) para poder probarlo: es lógica
 * pura y decide qué ve un alumno el día que entra, que es lo más caro de
 * equivocar. Un orden mal puesto no da error, sólo mide otra cosa.
 *
 * LAS TRES REGLAS:
 *
 *   1. Sin participación, NADA. Es la bandera del §12 y va primero.
 *   2. La salida MANDA cuando su ventana está abierta. Es el dato que caduca:
 *      la ventana dura unos días y luego se cierra para siempre, mientras que
 *      la entrada, si el alumno no la contestó, se le puede seguir aplicando.
 *   3. Conocimiento antes que actitud. La escala va «al terminar el
 *      cuestionario», como pide el §7 — y se aplica aunque el de conocimiento
 *      se hubiera contestado en otra sesión.
 */

import type { CuestionarioId } from '../config';

/**
 * Lo ÚNICO que la puerta necesita saber de cada cuestionario: si ya se
 * completó. Se pide esta forma mínima, y no un `AvanceCuestionario` entero,
 * para poder decir «éste ya está» sin tener que fabricar un avance falso.
 */
export interface AvanceVisto {
  completado: boolean;
}

export type LectorDeAvance = (id: CuestionarioId) => AvanceVisto | null;

export interface EstadoPuerta {
  participa: boolean;
  salidaAbierta: boolean;
}

const completado = (a: AvanceVisto | null) => a?.completado === true;

/** El cuestionario que toca ahora, o `null` si no toca ninguno. */
export function siguienteCuestionario(
  estado: EstadoPuerta,
  leer: LectorDeAvance,
): CuestionarioId | null {
  if (!estado.participa) return null;

  if (estado.salidaAbierta) {
    if (!completado(leer('salida'))) return 'salida';
    if (!completado(leer('actitud_salida'))) return 'actitud_salida';
  }
  if (!completado(leer('entrada'))) return 'entrada';
  if (!completado(leer('actitud_entrada'))) return 'actitud_entrada';
  return null;
}

/**
 * UN LECTOR QUE ADEMÁS SE ACUERDA DE ESTA SESIÓN.
 *
 * POR QUÉ EXISTE. El lector normal mira `localStorage`. En un equipo con el
 * almacenamiento bloqueado —modo privado, política del equipo escolar, cuota
 * llena— guardar el avance falla en silencio, y entonces el alumno que acaba
 * de contestar los dieciocho reactivos pulsa «Continuar», la puerta vuelve a
 * preguntar qué toca, el almacén sigue diciendo «nada contestado» y le
 * devuelve el MISMO cuestionario. Como es el mismo valor, React no vuelve a
 * pintar: el botón deja de responder y el alumno se queda encerrado detrás de
 * la medición, que es exactamente lo que el encargo prohíbe.
 *
 * Con esto, lo terminado durante la sesión cuenta como terminado aunque no se
 * haya podido escribir en ningún sitio. Se pierde el dato; no se pierde al
 * alumno.
 */
export function lectorConMemoria(
  leer: LectorDeAvance,
  hechos: ReadonlySet<CuestionarioId>,
): LectorDeAvance {
  return (id) => (hechos.has(id) ? { completado: true } : leer(id));
}
