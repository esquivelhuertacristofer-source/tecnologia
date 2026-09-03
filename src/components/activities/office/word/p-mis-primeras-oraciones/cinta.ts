import { CINTA_BASICO, type Pestana } from '@/components/activities/office/tecniaTextos';

/**
 * La cinta de «Mis primeras oraciones»: el grado Básico recortado a lo que esta
 * clase usa de verdad.
 *
 * Un niño de siete años delante de las dos pestañas enteras del grado Básico
 * —veinticuatro botones repartidos en siete grupos— no ve herramientas, ve
 * ruido, y el ruido compite con lo único que hoy importa: sus manos en el
 * teclado. Aquí queda **una pestaña y un grupo**: Inicio · Fuente, con la N y la
 * K. Es el único sitio de la cinta al que un encargo lo manda ir.
 *
 * Menos botones no es menos programa: es el programa de verdad, recortado, que
 * es exactamente lo que hace Word con su modo simplificado. Todo lo demás sigue
 * existiendo y aparecerá cuando haga falta —la pestaña «Archivo» sigue ahí, y
 * contesta que eso se ve en otra clase—.
 *
 * Se deriva de `CINTA_BASICO` en vez de copiarse a mano para que el glifo, el
 * nombre del grupo y la etiqueta de cada botón sean **los mismos** que en las
 * demás clases de Word: un botón que aquí se llamara distinto sería otro botón
 * para el alumno. Los dos desplegables de tipografía los añade la ventana por
 * ser el grupo Fuente, como en Word.
 */

/** Qué se conserva de la cinta del grado: pestaña → grupo → controles. */
const RECORTE: Record<string, Record<string, string[]>> = {
  inicio: { fuente: ['negrita', 'cursiva'] },
};

export const CINTA_PRIMERAS_ORACIONES: Pestana[] = CINTA_BASICO.filter((p) => RECORTE[p.id]).map((p) => ({
  ...p,
  grupos: p.grupos
    .filter((g) => RECORTE[p.id][g.id])
    .map((g) => ({ ...g, controles: g.controles.filter((c) => RECORTE[p.id][g.id].includes(c.id)) })),
}));

export default CINTA_PRIMERAS_ORACIONES;
