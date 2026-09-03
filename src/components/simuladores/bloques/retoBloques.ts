/**
 * TECNIA BLOQUES · EL JUEZ DEL RETO
 *
 * Quién decide si el programa del alumno resuelve el reto. Y la respuesta es:
 * **la actividad, no el armazón**. Un reto de secuencias se gana si las órdenes
 * salen exactamente en ese orden; uno de robot, si el muñeco pisó la meta; uno
 * de bucles, si además lo hizo con menos de cinco bloques. Un armazón que
 * intentara juzgar las tres cosas acabaría siendo un motor de plantillas, y aquí
 * están prohibidos.
 *
 * Lo que sí pone el armazón es el PARTE: `InformeCorrida`, lo que pasó de
 * verdad. Un `Reto` es una frase y una función que lee ese parte. Nada más.
 *
 *     const reto: Reto = {
 *       id: 'r1',
 *       enunciado: 'Llega a la bandera sin pisar el charco.',
 *       juzgar: (parte) => mundo.enLaMeta
 *         ? { ok: true, mensaje: '¡Llegaste!' }
 *         : { ok: false, mensaje: 'Te quedaste a una casilla.' },
 *     };
 *
 * Las funciones de abajo son ATAJOS para los criterios que se repiten, no un
 * catálogo cerrado: la actividad puede escribir `juzgar` a mano y no usar
 * ninguno. Están aquí porque «la secuencia es exactamente ésta» y «en menos de N
 * bloques» son literalmente dos de los tres criterios que pide el canon, y
 * escribirlos mal —comparando longitudes en vez de contenido, por ejemplo— es
 * fácil y silencioso.
 */

import { contarBloques, recorrer, type Programa } from './arbolBloques';
import type { InformeCorrida } from './interpreteBloques';

export interface Veredicto {
  ok: boolean;
  /** Lo que se le dice al alumno. Siempre hay algo que decir, gane o pierda. */
  mensaje: string;
}

export interface Reto {
  id: string;
  enunciado: string;
  juzgar: (parte: InformeCorrida) => Veredicto;
}

/** Un criterio: mira el parte y contesta sí o no. */
export type Criterio = (parte: InformeCorrida) => boolean;

/** Las órdenes salieron EXACTAMENTE en este orden, ni una más ni una menos. */
export function secuenciaExacta(esperada: readonly string[]): Criterio {
  return (parte) =>
    parte.acciones.length === esperada.length && parte.acciones.every((a, i) => a === esperada[i]);
}

/** Estas órdenes salieron, en este orden, aunque hubiera otras por medio. */
export function secuenciaContiene(esperada: readonly string[]): Criterio {
  return (parte) => {
    let i = 0;
    for (const accion of parte.acciones) {
      if (accion === esperada[i]) i += 1;
      if (i === esperada.length) return true;
    }
    return esperada.length === 0;
  };
}

/**
 * El guion no pasa de `tope` bloques.
 *
 * Cuenta los bloques del PROGRAMA, no las órdenes ejecutadas: «hazlo con menos
 * de cinco bloques» es un reto sobre lo que se escribe, y un `repetir` bien
 * puesto ejecuta veinte órdenes con tres bloques. Contar lo ejecutado
 * castigaría justo la solución que el reto premia.
 */
export function comoMuchoBloques(tope: number): Criterio {
  return (parte) => contarBloques(parte.programa) <= tope;
}

/** El guion usa esta ficha al menos una vez. */
export function usaFicha(fichaId: string): Criterio {
  return (parte) => recorrer(parte.programa).some((b) => b.ficha === fichaId);
}

/** La corrida acabó sola, sin toparse con el tope ni con el guion vacío. */
export const terminoLimpio: Criterio = (parte) =>
  parte.fin === 'termino' || parte.fin === 'bloque-parar';

export function todos(...criterios: Criterio[]): Criterio {
  return (parte) => criterios.every((c) => c(parte));
}

export function alguno(...criterios: Criterio[]): Criterio {
  return (parte) => criterios.some((c) => c(parte));
}

/** Un reto de los corrientes: un criterio, una frase al ganar y otra al fallar. */
export function retoDe(
  id: string,
  enunciado: string,
  criterio: Criterio,
  bien: string,
  mal: string,
): Reto {
  return {
    id,
    enunciado,
    // El criterio se pregunta UNA vez: preguntarlo dos veces —una para el `ok` y
    // otra para el mensaje— deja la puerta abierta a un veredicto que dice que sí
    // y explica por qué no.
    juzgar: (parte) => {
      const ok = criterio(parte);
      return { ok, mensaje: ok ? bien : mal };
    },
  };
}

/** Cuántos bloques tiene el guion. Atajo para las barras de progreso. */
export function tamanoDe(programa: Programa): number {
  return contarBloques(programa);
}
