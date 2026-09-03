'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaPPT, rutaPPT } from '../comun/rutas';
import { LabEnPapel } from './Lab';

/**
 * Entrada de `of-ppt-en-papel` (doc §44.4).
 *
 * La ficha 2 es la que decide si la clase se entiende, y es la que casi nadie
 * sabe: **las hojas impresas tienen su propio patrón**. Todo el mundo ha visto
 * el patrón de diapositivas; los otros dos están dos botones más allá, en el
 * mismo menú, y explican por qué las presentaciones impresas salen sin nombre y
 * sin número de página.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-ppt-en-papel',
  laboratorio: LabEnPapel,
  ruta: rutaPPT('avanzado'),
  parada: paradaPPT('avanzado', 'of-ppt-en-papel'),
  globo: 'El jurado la quiere en la mano. Y en papel no se ve como en la pantalla.',
  arranqueSub:
    'Llegas al concurso de ciencias con la presentación terminada y el jurado pide tres copias en papel. Ahí se acaba lo que sabías: en la pantalla cabe una diapositiva y en una hoja caben seis, tu presentación tiene el fondo oscuro y el cartucho no es infinito, y tú necesitas tus notas mientras ellos necesitan las suyas. Hoy aprendes que **lo que se ve y lo que se imprime son dos cosas distintas**, y que las hojas también tienen molde — en el mismo menú donde vive el patrón de diapositivas, dos botones más allá, donde casi nadie mira.',
  stats: [
    { etiqueta: 'Formatos', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Moldes', valor: '2', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Lo que se imprime',
  fichas: [
    {
      key: 'para-ellos-y-para-ti',
      tag: 'La decisión',
      numero: 1,
      titulo: 'Para ellos y para ti',
      detalle:
        'El **documento** lleva varias diapositivas por hoja y es para quien te escucha: el de 3 trae rayas al lado para que apunten. Las **páginas de notas** llevan una diapositiva arriba y lo que ibas a decir debajo, y ésas no se las das a nadie: son tu chuleta.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'el-molde-de-la-hoja',
      tag: 'Lo que nadie sabe',
      numero: 2,
      titulo: 'Las hojas también tienen patrón',
      detalle:
        'Hay tres patrones y sólo se conoce uno. El de **documentos** manda en las hojas que repartes y el de **notas**, en las tuyas. Escribes el nombre de tu equipo una vez y sale en todas — lleven dos diapositivas o seis. Están en Vista → Patrones, al lado del que ya conoces.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'cuantas-por-hoja',
      tag: 'La cuenta',
      numero: 3,
      titulo: 'Nueve hojas o dos',
      detalle:
        'Una por hoja son nueve hojas por persona; de seis en seis son dos. Por tres copias, la diferencia es de veintisiete hojas a seis. Y ojo con un detalle que muerde: **las diapositivas ocultas no se imprimen**, así que las copias pueden llegar cojas sin que te enteres.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'en-grises-se-lee',
      tag: 'El previo manda',
      numero: 4,
      titulo: 'Lo que se ve no es lo que sale',
      detalle:
        'Un fondo oscuro impreso en color se traga el cartucho y sale una mancha. La solución no es cambiar la presentación: es imprimirla en **escala de grises**. La de la pantalla se queda igual y sólo cambia cómo sale. Se decide mirando el previo, no adivinando.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Sácala en papel',
  ctaDetalle:
    'Se abre «El agua del pueblo.pptx», la del concurso de ciencias: nueve diapositivas con notas escritas y fondo oscuro. Todo lo de imprimir está en **Archivo → Imprimir**, con el previo grande a la derecha — esta clase es de mirar antes de pulsar. Los moldes de las hojas, en **Vista → Patrones**: hay tres botones y dos son de papel.',
};

export function EntradaEnPapel(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaEnPapel;

export default EntradaEnPapel;
