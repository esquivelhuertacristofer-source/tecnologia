/**
 * TECNIA JUEGOS · ARMAR GUIONES SIN RATÓN
 *
 * Meter una ficha en el tronco de un sombrero, en la boca de un `si` o en su
 * hueco hexagonal, por la MISMA puerta que usa el editor (`soltarFicha`). Lo
 * usan las clases para los guiones que vienen puestos de fábrica (la babosa
 * que patrulla), las pruebas para armar el guion correcto y el señuelo, y
 * nadie más: en la ventana el alumno lo hace con las manos.
 */

import { buscarBloque, pilaDe, soltarFicha, type Programa, type Sitio } from '../bloques';
import { CATALOGO_JUEGO, idDePila } from './catalogo';

let contador = 0;

function nuevoId(prefijo: string): string {
  contador += 1;
  return `${prefijo}-${contador}`;
}

function soltar(programa: Programa, sitio: Sitio, fichaId: string, id?: string): Programa {
  const r = soltarFicha(programa, CATALOGO_JUEGO, sitio, fichaId, id ?? nuevoId(fichaId));
  if (!r.encaje.ok) throw new Error(`No encajó ${fichaId}: ${r.encaje.aviso}`);
  return r.programa;
}

/** Al final del tronco del sombrero `sombrero` del actor `actorId`. */
export function meterEnSombrero(
  programa: Programa,
  actorId: string,
  sombrero: string,
  fichaId: string,
  id?: string,
): Programa {
  const pilaId = idDePila(actorId, sombrero);
  const largo = pilaDe(programa, pilaId)?.bloques.length ?? 0;
  return soltar(programa, { donde: 'pila', pila: pilaId, indice: largo }, fichaId, id);
}

/** Varias seguidas en el mismo sombrero. */
export function meterVarias(programa: Programa, actorId: string, sombrero: string, fichas: readonly string[]): Programa {
  return fichas.reduce((acc, f) => meterEnSombrero(acc, actorId, sombrero, f), programa);
}

/** Al final de la boca `rama` (`cuerpo` o `sino`) del bloque `bloqueId`. */
export function meterEnRama(programa: Programa, bloqueId: string, rama: string, fichaId: string, id?: string): Programa {
  const largo = buscarBloque(programa, bloqueId)?.ramas?.[rama]?.length ?? 0;
  return soltar(programa, { donde: 'rama', bloque: bloqueId, rama, indice: largo }, fichaId, id);
}

/** En el hueco hexagonal del bloque `bloqueId`. */
export function meterEnHueco(programa: Programa, bloqueId: string, fichaId: string, id?: string): Programa {
  return soltar(programa, { donde: 'hueco', bloque: bloqueId }, fichaId, id);
}

/**
 * Un `si` completo de una vez: `si (pregunta) { cuerpo… }`, al final del
 * sombrero. Devuelve el programa y el id del `si`, por si hay que seguir
 * metiendo cosas dentro.
 */
export function meterSi(
  programa: Programa,
  actorId: string,
  sombrero: string,
  pregunta: string,
  cuerpo: readonly string[],
  opciones: { sino?: readonly string[]; id?: string } = {},
): { programa: Programa; id: string } {
  const id = opciones.id ?? nuevoId('si');
  let p = meterEnSombrero(programa, actorId, sombrero, opciones.sino ? 'si-sino' : 'si', id);
  p = meterEnHueco(p, id, pregunta);
  for (const f of cuerpo) p = meterEnRama(p, id, 'cuerpo', f);
  for (const f of opciones.sino ?? []) p = meterEnRama(p, id, 'sino', f);
  return { programa: p, id };
}
