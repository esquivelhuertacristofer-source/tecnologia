import type { PasoRuta } from '../n5/estudio/EntradaN5Base';

/**
 * Las rutas de unidad de las clases de inteligencia artificial (documento §52).
 *
 * Viven aquí y no dentro de `EntradaN5Base` por una razón práctica: las
 * dieciséis clases de IA están repartidas entre N5, N6, N7, N8, N9 y N10, y
 * meter una constante por unidad en la base de cada nivel obligaría a tocar
 * seis archivos compartidos. La base de entrada ya recibe la ruta por
 * parámetro (`ConfigEntradaN5.ruta`), así que basta con declararlas juntas.
 *
 * Las tres paradas de cada lista salen tal cual de `src/data/curriculo.ts`, y
 * hay una prueba que lo comprueba: si el currículo cambia el orden o el
 * título, la ruta que ve el alumno deja de mentir.
 */

/** N5 · «IA a mi alcance» (eje `datos-ia`, 5.º de primaria, 10–11 años). */
export const RUTA_N5_IA_A_MI_ALCANCE: PasoRuta[] = [
  { id: 'n5-la-ia-en-mi-vida', titulo: 'La IA en mi vida diaria' },
  { id: 'n5-la-ia-aprende-con-datos', titulo: 'La IA aprende con datos' },
  { id: 'n5-uso-responsable-de-ia', titulo: 'Uso responsable de la IA' },
];

/** N7 · «IA I» (eje `datos-ia`, 1.º de secundaria, 12–13 años). */
export const RUTA_N7_IA_1: PasoRuta[] = [
  { id: 'n7-como-aprende-la-ia', titulo: '¿Cómo aprende una IA?' },
  { id: 'n7-buenos-prompts', titulo: 'Escribe buenos prompts' },
  { id: 'n7-verifica-a-la-ia', titulo: 'Verifica lo que dice la IA' },
];

/** N8 · «IA II» (eje `datos-ia`, 2.º de secundaria, 13–14 años). */
export const RUTA_N8_IA_2: PasoRuta[] = [
  { id: 'n8-genera-con-ia', titulo: 'Genera texto, imagen y audio' },
  { id: 'n8-sesgos-y-errores', titulo: 'Sesgos y errores de la IA' },
  { id: 'n8-etica-de-la-ia', titulo: 'Ética: plagio, deepfakes y citas' },
];
