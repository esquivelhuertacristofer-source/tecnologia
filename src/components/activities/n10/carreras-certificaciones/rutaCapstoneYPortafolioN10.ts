import { getUnidad } from '@/data/curriculo';
import type { PasoRuta } from '../../n4/estudio/EntradaN4Base';

/**
 * Ruta de la unidad N10 · «Proyecto capstone y portafolio» (Bachillerato =
 * 15–18 años), `integradora: true` en el currículo.
 *
 * Esta unidad NO tiene un archivo de ruta compartido escrito a mano: su
 * parada 2 (`n10-portafolio-y-cv`) vive fuera de `n10/` —en
 * `office/word/portafolio-y-cv/`, sobre el motor `VentanaTextos`— y no
 * expone ningún `rutaXN10.ts` reusable. Se deriva de `curriculo.ts`, mismo
 * patrón que `rutaIaDatosN10.ts`: así la parada 1 (`n10-capstone`, todavía
 * sin construir) puede llegar después sin que nadie tenga que sincronizar
 * dos listas a mano.
 */
export const RUTA_N10_CAPSTONE_Y_PORTAFOLIO: PasoRuta[] = (
  getUnidad('n10-capstone-y-portafolio')?.actividades ?? []
).map((a) => ({ id: a.id, titulo: a.titulo }));
