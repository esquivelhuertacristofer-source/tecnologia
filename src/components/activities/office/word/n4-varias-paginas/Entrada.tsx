'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, RUTA_N4U4, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { Lab } from './Lab';

/**
 * Entrada de `n4-documento-de-varias-paginas` — «Documentos de varias páginas»
 * (doc §26.3). Tercera y última parada de la unidad 4 del nivel 4.
 *
 * Usa la plantilla de oro sin tocarla: video, tres datos, letrero, fichas de
 * color pleno, CTA gigante y ruta. Las cuatro fichas son las del documento y
 * van en el orden en que la clase las necesita, con una diferencia que importa:
 * la segunda no enseña una herramienta sino un ERROR. Es la única manera de que
 * el alumno entre al laboratorio sabiendo que dar enters tiene un problema, y
 * de que el encargo 2 —que le manda hacerlo mal a propósito— se lea como una
 * prueba y no como una orden rara.
 *
 * El video y las láminas dependen de la campaña de videos, congelada en 8 de 60
 * por decisión de Cristofer; la entrada lo dice en pantalla en vez de cargar
 * cinco 404, y el laboratorio no depende de ellos.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-documento-de-varias-paginas',
  laboratorio: Lab,
  ruta: RUTA_N4U4,
  parada: 3,
  globo: 'Tu documento ya no cabe en una hoja. Te enseño los tres trucos de los documentos largos.',
  arranqueSub:
    'Hasta hoy todo lo que escribiste cabía en una hoja. Tu monografía del desierto, no: son tres, y en cuanto un documento crece aparecen tres herramientas que casi nadie usa bien. La primera dice dónde empieza cada hoja. La segunda escribe una vez algo que sale en todas. Y la tercera pone los números y los mantiene sola. Las tres son la misma idea: en un trabajo largo, tú le das la regla al programa y él la mantiene, en vez de que tú acomodes a mano lo que la computadora acomoda sola.',
  stats: [
    { etiqueta: 'Hojas', valor: '3', acento: '#f5a524' },
    { etiqueta: 'Herramientas', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El documento largo',
  fichas: [
    {
      key: 'salto',
      tag: 'El salto',
      numero: 1,
      titulo: 'Empieza en hoja nueva',
      detalle:
        'El salto de página es una instrucción: «lo que sigue, empiézalo arriba de una hoja nueva». Lo pones una vez y ahí se queda, pase lo que pase con el texto de arriba. En Word vive en la pestaña Insertar, en el grupo Páginas.',
      img: 'ficha-salto.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'enters-no',
      tag: 'El error',
      numero: 2,
      titulo: 'Con enters se desacomoda',
      detalle:
        'Casi todo el mundo empieza hoja nueva dando Enter hasta que el texto se pasa. Parece que funciona… hasta que alguien añade o quita un renglón más arriba: entonces todo sube o baja y el capítulo vuelve a quedar partido a la mitad. Los espacios no son una instrucción.',
      img: 'ficha-enters-no.png',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'encabezado',
      tag: 'El encabezado',
      numero: 3,
      titulo: 'Se escribe una vez',
      detalle:
        'Arriba de cada hoja hay una franja que no es parte del texto: el encabezado. Escribes ahí el nombre de tu trabajo y tu grupo una sola vez y aparece solo en todas las hojas. Abajo está su gemelo, el pie de página. Se abren con doble clic en el margen.',
      img: 'ficha-encabezado.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'numeracion',
      tag: 'Los números',
      numero: 4,
      titulo: 'Se renumeran solos',
      detalle:
        'El número de página no se teclea: se inserta. El programa pone 1 en la primera hoja, 2 en la segunda y 3 en la tercera, y si mañana metes una hoja en medio, los de abajo se corren solos. Si los escribieras a mano, tendrías que corregirlos todos.',
      img: 'ficha-numeracion.png',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre tu monografía',
  ctaDetalle:
    'Tecnia Textos se abre con tu trabajo del desierto ya escrito: tres hojas, siete apartados y un problema —el apartado de los cactus empieza a media hoja y queda partido en dos—. Vas a arreglarlo dos veces: primero mal, a propósito, para ver por qué los enters no sirven, y luego bien, con un salto de página. Después le pondrás el encabezado y los números, y comprobarás con tus ojos que se repiten y se acomodan solos en las tres hojas.',
};

export function EntradaVariasPaginas(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaVariasPaginas;
