import { EJERCICIOS_OFFICE } from '@/data/curriculo';
import type { PasoRuta } from '../../../n4/estudio/EntradaN4Base';

/**
 * La ruta de la sala de PowerPoint, **derivada** (§44.6).
 *
 * ── POR QUÉ ESTE ARCHIVO EXISTE ─────────────────────────────────────────────
 *
 * Porque hasta hoy cada entrada escribía su propia copia de la lista de
 * compañeras, y **cinco de las seis del grado Avanzado mentían**: seguían
 * diciendo «parada 5 de 5» un día después de que `of-ppt-traela-hecha` fuera la
 * sexta. No es descuido de nadie: la ruta se actualizaba en la clase nueva —que
 * es la que uno tiene abierta— y las cinco que ya estaban cerradas se quedaban
 * como estaban. Está avisado por escrito en dos de ellas («la ruta se actualiza
 * AQUÍ y no sólo en la clase nueva») y aun así volvió a pasar, que es la
 * definición de un aviso que no funciona.
 *
 * Lo que se deriva no se escribe. La lista sale de `EJERCICIOS_OFFICE`, que es
 * donde una clase se da de alta, así que **añadir una clase la mete en la ruta
 * de todas sus compañeras sin tocar una sola entrada**.
 *
 * ── LO ÚNICO QUE SE ESCRIBE A MANO ──────────────────────────────────────────
 *
 * El rótulo corto, cuando lo hay. La ruta se lee en una tira estrecha y de
 * refilón, y ahí «Entregarla sin estar tú» dice más que el título de catálogo
 * «Proteger y exportar a video». Sin entrada en la tabla manda el título del
 * registro, que es lo correcto: una clase nueva aparece bien nombrada aunque a
 * nadie se le ocurra un rótulo más corto.
 */

const ROTULOS: Record<string, string> = {
  'of-ppt-revision': 'Revisar entre varios',
  'of-ppt-exporta-video': 'Entregarla sin estar tú',
};

export type GradoPPT = 'basico' | 'intermedio' | 'avanzado';

/** Las clases exclusivas de ese grado, en el orden del temario. */
export function rutaPPT(grado: GradoPPT): PasoRuta[] {
  return EJERCICIOS_OFFICE.filter(
    (e) => e.app === 'powerpoint' && e.grado === grado && e.estado === 'disponible',
  ).map((e) => ({ id: e.id, titulo: ROTULOS[e.id] ?? e.titulo }));
}

/**
 * En qué parada de esa ruta va esta clase, contando desde 1.
 *
 * También derivado, y por el mismo motivo: `parada: 6` escrito a mano es un
 * número que deja de ser verdad en cuanto alguien reordena el temario, y lo
 * hace en silencio.
 */
export function paradaPPT(grado: GradoPPT, id: string): number {
  return rutaPPT(grado).findIndex((p) => p.id === id) + 1;
}
