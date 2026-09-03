import type { PasoRuta } from '../n4/estudio/EntradaN4Base';

/**
 * Las rutas de las dos unidades que cuelgan de Tecnia Datos (canon, filas 70,
 * 87, 88 y 89). Viven aparte y no dentro de una entrada porque más de una
 * clase pinta la misma ruta, y una ruta escrita dos veces se desincroniza en
 * cuanto alguien renombre una parada — la misma razón de `rutaN7Python1.ts`.
 *
 * Los títulos son **verbatim de `curriculo.ts`**, que es la fuente de verdad.
 * `n9-datos-con-python`, `n9-busqueda-y-ordenamiento` y `n10-conecta-tus-datos`
 * todavía no están construidas; salen igual, en gris, porque la ruta enseña el
 * camino de la unidad y no lo que ya está hecho.
 */
export const RUTA_N9_ALGORITMOS_Y_DATOS: PasoRuta[] = [
  { id: 'n9-busqueda-y-ordenamiento', titulo: 'Búsqueda y ordenamiento' },
  { id: 'n9-bases-de-datos-iniciales', titulo: 'Bases de datos iniciales' },
  { id: 'n9-datos-con-python', titulo: 'Proyectos de datos con Python' },
];

/**
 * `n10-conecta-tus-datos` está bloqueada (documento §49.2): monta
 * `VentanaHojas` y ese puente todavía no está escrito. No se construye aquí.
 */
export const RUTA_N10_BASES_DE_DATOS_Y_SQL: PasoRuta[] = [
  { id: 'n10-modela-tus-datos', titulo: 'Modela tus datos' },
  { id: 'n10-consultas-sql', titulo: 'Consultas SQL' },
  { id: 'n10-conecta-tus-datos', titulo: 'Conecta datos con hojas y apps' },
];
