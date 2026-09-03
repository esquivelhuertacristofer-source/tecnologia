import { EJERCICIOS_OFFICE } from '@/data/curriculo';
import type { PasoRuta } from '../../../n4/estudio/EntradaN4Base';

/**
 * La ruta de la sala de Excel, **derivada** — el mismo archivo que §44.6 escribió
 * para PowerPoint, y por el mismo motivo, escrito **antes** de que el defecto
 * ocurra en vez de después.
 *
 * ── QUÉ SE COMPRA ESCRIBIÉNDOLO HOY ─────────────────────────────────────────
 *
 * En PowerPoint cada entrada llevaba su copia a mano de la lista de compañeras y
 * **cinco de las seis del grado Avanzado acabaron mintiendo**: seguían diciendo
 * «parada 5 de 5» un día después de que hubiera seis. No fue descuido de nadie:
 * la ruta se actualiza en la clase que uno tiene abierta, y las que ya estaban
 * cerradas se quedan como estaban. Aquí la sala de Excel arranca con **una sola**
 * clase exclusiva disponible, que es justamente el momento en que copiar la lista
 * a mano parece inofensivo — un array de un elemento— y el momento en que sale
 * más barato no hacerlo.
 *
 * Lo que se deriva no se escribe. La lista sale de `EJERCICIOS_OFFICE`, que es
 * donde una clase se da de alta, así que **la segunda clase de esta sala entra en
 * la ruta de la primera sin que nadie abra su entrada**.
 *
 * ── LO ÚNICO QUE SE ESCRIBE A MANO ──────────────────────────────────────────
 *
 * El rótulo corto, cuando lo hay. La tira de la ruta es estrecha y se lee de
 * refilón; sin entrada en la tabla manda el título del temario, que es lo
 * correcto: una clase nueva aparece bien nombrada aunque a nadie se le ocurra un
 * rótulo más corto.
 */

const ROTULOS: Record<string, string> = {
  'of-excel-buscarx': 'Traer el dato',
  'of-excel-tablas-y-filtros': 'Tablas y filtros',
  'of-excel-datos-limpios': 'Datos limpios',
  'of-excel-auditoria': 'Auditoría',
  'of-excel-consolida-y-protege': 'Consolida y protege',
  'of-excel-y-si': 'Análisis Y si',
  'of-excel-tabla-dinamica': 'Tabla dinámica',
  'of-excel-grafico-dinamico': 'Gráfico dinámico',
  'of-excel-macros': 'Macros',
  'of-excel-dashboard': 'El tablero',
};

export type GradoExcel = 'basico' | 'intermedio' | 'avanzado';

/** Las clases exclusivas de ese grado que ya se pueden jugar, en orden de temario. */
export function rutaExcel(grado: GradoExcel): PasoRuta[] {
  return EJERCICIOS_OFFICE.filter(
    (e) => e.app === 'excel' && e.grado === grado && e.estado === 'disponible',
  ).map((e) => ({ id: e.id, titulo: ROTULOS[e.id] ?? e.titulo }));
}

/**
 * En qué parada de esa ruta va esta clase, contando desde 1.
 *
 * También derivado: un `parada: 3` escrito a mano deja de ser verdad en cuanto
 * alguien reordena el temario, y lo hace en silencio.
 */
export function paradaExcel(grado: GradoExcel, id: string): number {
  return Math.max(1, rutaExcel(grado).findIndex((p) => p.id === id) + 1);
}
