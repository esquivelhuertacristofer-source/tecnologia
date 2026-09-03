import { EJERCICIOS_OFFICE } from '@/data/curriculo';
import type { PasoRuta } from '../../../n4/estudio/EntradaN4Base';

/**
 * La ruta de la sala de M365, **derivada** — mismo patrón que
 * `office/powerpoint/comun/rutas.ts` (§44.6): la lista de compañeras sale de
 * `EJERCICIOS_OFFICE`, nunca se copia a mano en cada entrada, para que una
 * clase nueva no deje a las que ya estaban cerradas diciendo una parada que
 * ya no es verdad.
 */

const ROTULOS: Record<string, string> = {};

export type GradoM365 = 'basico' | 'intermedio' | 'avanzado';

/** Las clases exclusivas de ese grado, en el orden del temario. */
export function rutaM365(grado: GradoM365): PasoRuta[] {
  return EJERCICIOS_OFFICE.filter(
    (e) => e.app === 'm365' && e.grado === grado && e.estado === 'disponible',
  ).map((e) => ({ id: e.id, titulo: ROTULOS[e.id] ?? e.titulo }));
}

/** En qué parada de esa ruta va esta clase, contando desde 1. */
export function paradaM365(grado: GradoM365, id: string): number {
  return rutaM365(grado).findIndex((p) => p.id === id) + 1;
}
