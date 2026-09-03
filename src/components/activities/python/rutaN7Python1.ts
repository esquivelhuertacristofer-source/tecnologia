import type { PasoRuta } from '../n4/estudio/EntradaN4Base';

/**
 * Las cinco paradas de N7 · U2 «Programación en texto I (Python)».
 *
 * Vive aparte y no dentro de una de las dos entradas porque **las dos la
 * pintan**, y una ruta escrita dos veces es una ruta que se desincroniza en
 * cuanto alguien renombre una parada: el alumno vería una lista en la primera
 * clase y otra distinta en la segunda.
 *
 * Los títulos son **verbatim de `curriculo.ts`**, que es la fuente de verdad.
 * Las tres últimas todavía no están construidas; salen igual, en gris, porque
 * la ruta enseña el camino de la unidad y no lo que ya está hecho.
 */
export const RUTA_N7_PYTHON_1: PasoRuta[] = [
  { id: 'n7-variables-y-tipos', titulo: 'Variables y tipos' },
  { id: 'n7-entrada-y-salida', titulo: 'Entrada y salida' },
  { id: 'n7-condicionales-python', titulo: 'Condicionales' },
  { id: 'n7-bucles-python', titulo: 'Bucles' },
  { id: 'n7-retos-python', titulo: 'Retos guiados' },
];
