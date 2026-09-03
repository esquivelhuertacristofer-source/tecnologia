import { CINTA_BASICO, type Pestana } from '@/components/activities/office/tecniaTextos';

/**
 * La cinta de `n3-dale-formato`, recortada a la edad (8–9 años).
 *
 * ── POR QUÉ NO SE USA `CINTA_BASICO` ENTERA ─────────────────────────────────
 * El grado Básico trae dos pestañas y veinticinco controles. Un niño de tercero
 * delante de eso no ve herramientas, ve ruido — y **catorce de esos veinticinco
 * no los toca esta clase**: siete están inertes a propósito (Pegar, Imagen,
 * Formas, Cuadro, Encabezado, Pie, Número) y el resto pertenece a temas que aún
 * no ha visto (listas, sangrías, interlineado, tablas, WordArt).
 *
 * Recortar no es enseñar menos programa: es el programa de verdad, recortado,
 * que es exactamente lo que hace Word con su modo simplificado. Lo que queda es
 * una pestaña Inicio con **los tres grupos que esta clase usa**, en el mismo
 * orden y con los mismos nombres, glifos y rótulos que la cinta completa — se
 * derivan de ella y no se copian a mano, para que el día que el motor cambie un
 * rótulo esta clase lo herede en vez de mentir.
 *
 * Lo que se queda dentro y por qué:
 *
 *  · **Fuente** — negrita, cursiva y subrayado (la terna N-K-S, que en Word va
 *    siempre junta y se reconoce de un vistazo) más los dos desplegables que
 *    pone el motor: el tipo de letra y el tamaño. Ésos dos SON el tema del día
 *    —«que quede en Arial 12» es lo que pide la escuela— y no hay otra forma de
 *    leer el número que tiene puesto el texto.
 *  · **Párrafo** — sólo las tres alineaciones del laboratorio viejo: izquierda,
 *    centro y derecha. Verlas juntas es lo que hace evidente que son tres formas
 *    de lo mismo y que sólo una puede estar puesta. Justificar entra en 4°.
 *  · **Estilos** — Normal y Título 1. Con esos dos ya se puede ir y volver, que
 *    es lo que convierte el estilo en algo que se puede probar sin miedo.
 *
 * Y lo que se cae: el grupo Portapapeles (copiar y pegar es otra clase, y Pegar
 * está inerte), los botones A▲ y A▼ —darían un segundo camino para el tamaño que
 * además esconde el número, justo lo que el encargo manda leer—, el color de
 * letra (hoy pinta un naranja fijo) y la pestaña Insertar entera.
 */

const INICIO = CINTA_BASICO.find((p) => p.id === 'inicio');

/** Qué grupos entran, y con qué botones dentro. El orden lo pone la cinta. */
const RECORTE: Record<string, string[]> = {
  fuente: ['negrita', 'cursiva', 'subrayado'],
  parrafo: ['izquierda', 'centro', 'derecha'],
  estilos: ['normal', 'titulo1'],
};

export const CINTA_DALE_FORMATO: Pestana[] = [
  {
    id: 'inicio',
    nombre: 'Inicio',
    grupos: (INICIO?.grupos ?? [])
      .filter((g) => RECORTE[g.id])
      .map((g) => ({ ...g, controles: g.controles.filter((c) => RECORTE[g.id].includes(c.id)) })),
  },
];
