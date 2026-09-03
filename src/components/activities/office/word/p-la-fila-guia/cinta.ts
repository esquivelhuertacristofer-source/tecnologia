import { CINTA_BASICO, type Pestana } from '@/components/activities/office/tecniaTextos';

/**
 * `p-la-fila-guia` · la cinta de esta clase.
 *
 * Una pestaña y dos grupos. No es una versión recortada «para niños»: es lo que
 * hace Word con el modo simplificado, enseñar lo que la tarea usa. Y aquí la
 * tarea es teclear, así que la cinta entera del grado Básico —cuatro grupos de
 * Inicio más las cuatro familias de Insertar— sería un muro de veinticinco
 * botones que no tocan el ejercicio, delante de un niño de ocho años cuyo
 * trabajo consiste precisamente en NO mirar a otro lado.
 *
 * Lo que se queda y por qué:
 *
 *  · **Fuente**, con los dos desplegables y cuatro botones. Es el grupo que un
 *    alumno de mecanografía sí necesita de verdad: si la letra le queda chica
 *    para leerla sin acercarse, el cuadro del tamaño está ahí. Y es donde vive
 *    la negrita, que es lo primero que un niño quiere probar en un procesador
 *    de textos.
 *  · **Párrafo**, sólo con las cuatro alineaciones. Van juntas en una fila, que
 *    es lo que hace evidente que son cuatro formas de lo mismo. Ninguna hace
 *    falta para el ejercicio y ninguna lo estorba: la corrección lee el TEXTO
 *    del renglón, así que un renglón centrado sigue estando bien escrito.
 *
 * Lo que se va y por qué:
 *
 *  · **Portapapeles.** Copiar y pegar en una clase de mecanografía es la puerta
 *    de atrás: el renglón aparecería escrito sin haberlo tecleado y el ejercicio
 *    se quedaría sin objeto. Los atajos del navegador siguen existiendo —no se
 *    puede taparlos y tampoco se pretende—, pero el programa no los ofrece.
 *  · **Estilos** y toda la pestaña **Insertar**: tablas, imágenes, encabezados.
 *    Son el material de las otras clases de la sala y aquí no se tocan.
 */

const SOLO: Record<string, string[]> = {
  fuente: ['negrita', 'cursiva', 'mayor', 'menor'],
  parrafo: ['izquierda', 'centro', 'derecha', 'justificado'],
};

const INICIO = CINTA_BASICO.find((p) => p.id === 'inicio') ?? CINTA_BASICO[0];

export const CINTA_FILA_GUIA: Pestana[] = [
  {
    ...INICIO,
    grupos: INICIO.grupos
      .filter((g) => SOLO[g.id])
      .map((g) => ({ ...g, controles: g.controles.filter((c) => SOLO[g.id].includes(c.id)) })),
  },
];
