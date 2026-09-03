import { CINTA_BASICO, type Pestana, type PestanaId } from '@/components/activities/office/tecniaTextos';

/**
 * La cinta de `n2-cuento-ilustrado`, recortada a los 7-8 años (doc §36, regla de
 * la cinta por edad).
 *
 * Menos botones no es menos programa: es el programa de verdad recortado, que es
 * lo que hace Word con el modo simplificado. Un niño de siete años delante de las
 * dos pestañas enteras del grado Básico —cuatro grupos, veintiún botones— no ve
 * herramientas, ve ruido, y el encargo 3 de esta clase le pide justamente que
 * LEA los nombres de los grupos para decidir.
 *
 * Lo que se queda y por qué:
 *  · **Inicio → Fuente**, sin Subrayado. El subrayado en un cuento no aporta y a
 *    esta edad se confunde con la rayita roja de la falta de ortografía.
 *  · **Inicio → Estilos**, sólo Normal y Título 1. El cuento tiene UN título;
 *    Título 2 es un subapartado y aquí no hay ninguno que enseñar.
 *  · **Insertar → Ilustraciones**, sólo Imagen. «Formas» abre otra clase entera.
 *
 * Lo que se va: Portapapeles, Párrafo, Tablas, Texto y Encabezado y pie. Ninguno
 * lo toca ningún encargo, y Portapapeles además está a medio construir —Pegar
 * sale inerte—, así que a esta edad sólo sirve para gastar clics en un botón que
 * contesta «todavía no».
 *
 * Se RECORTA la cinta del grado en vez de escribirla a mano: así los glifos, los
 * rótulos y el orden de Word siguen siendo los del resto de la sala aunque el
 * grado cambie mañana, que es lo que hace que el alumno reconozca el mismo botón
 * en la clase siguiente.
 */

type Receta = { pestana: PestanaId; grupos: Record<string, string[]> };

const RECETA: Receta[] = [
  {
    pestana: 'inicio',
    grupos: {
      fuente: ['negrita', 'cursiva', 'mayor', 'menor', 'color'],
      estilos: ['normal', 'titulo1'],
    },
  },
  {
    pestana: 'insertar',
    grupos: {
      ilustraciones: ['imagen'],
    },
  },
];

/**
 * Se filtra y no se reconstruye: el orden de los grupos dentro de la pestaña y
 * el de los botones dentro del grupo son los de Word, y ése es el que enseña que
 * las cuatro alineaciones van juntas o que Negrita, Cursiva y Subrayado son
 * vecinos. Reordenarlos por comodidad rompería la lección de la clase 1.
 */
function recortar(base: Pestana[], receta: Receta[]): Pestana[] {
  const salida: Pestana[] = [];
  for (const { pestana, grupos } of receta) {
    const original = base.find((p) => p.id === pestana);
    if (!original) continue;
    salida.push({
      ...original,
      grupos: original.grupos
        .filter((g) => grupos[g.id])
        .map((g) => ({ ...g, controles: g.controles.filter((c) => grupos[g.id].includes(c.id)) })),
    });
  }
  return salida;
}

export const CINTA_CUENTO: Pestana[] = recortar(CINTA_BASICO, RECETA);
