import { getUnidad } from '@/data/curriculo';
import type { PasoRuta } from '../../n4/estudio/EntradaN4Base';

/**
 * Ruta de la unidad N10 · «IA y ciencia de datos» (Bachillerato = 15–18 años).
 *
 * Unidad 100% nueva el 23-ago-2026: ninguna de sus tres paradas existía
 * todavía, así que —a diferencia de `rutaCiberseguridadN10.ts`, que puede
 * escribir el array a mano porque las tres actividades de esa unidad ya
 * estaban en el currículo antes de construirse— esta ruta se DERIVA de
 * `curriculo.ts` en vez de copiarse a mano: así las paradas 2 y 3
 * (`n10-flujos-con-ia`, `n10-etica-y-regulacion`), construidas después por
 * otros agentes, la leen ya completa sin que nadie tenga que sincronizar dos
 * listas.
 */
export const RUTA_N10_IA_DATOS: PasoRuta[] = (getUnidad('n10-ia-y-ciencia-de-datos')?.actividades ?? []).map(
  (a) => ({ id: a.id, titulo: a.titulo }),
);
