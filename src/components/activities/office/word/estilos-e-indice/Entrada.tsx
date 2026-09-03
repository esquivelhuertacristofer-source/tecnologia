'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { Lab } from './Lab';

/**
 * Entrada de `of-word-estilos-e-indice` — «Estilos y tabla de contenido».
 *
 * Misma plantilla de oro que la clase 1, sin tocarla: video, tres datos,
 * letrero, fichas de color pleno, CTA gigante y ruta. La ruta que viaja en la
 * config es la del grado Intermedio de la sala de Word.
 *
 * Las cuatro fichas van en el orden en que la clase las necesita y ninguna
 * enseña dónde está el botón. La primera dice qué es un estilo —que es la única
 * idea difícil del día—; la segunda enseña a leer el panel de Navegación; la
 * tercera explica de dónde sale el índice; y la cuarta cuenta por qué existe un
 * botón que se llama «Actualizar». Un alumno que se quede sólo con la primera
 * ya entendió por qué en Word hay estilos.
 */

/** Las tres clases exclusivas del grado Intermedio de la sala de Word. */
const RUTA_WORD_INTERMEDIO: PasoRuta[] = [
  { id: 'of-word-estilos-e-indice', titulo: 'Estilos y tabla de contenido' },
  { id: 'of-word-revisa-y-comenta', titulo: 'Revisa y comenta' },
  { id: 'of-word-busca-y-reemplaza', titulo: 'Busca y reemplaza' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-word-estilos-e-indice',
  laboratorio: Lab,
  ruta: RUTA_WORD_INTERMEDIO,
  parada: 1,
  globo: 'Un título no es letra grande. Es una etiqueta, y por eso la máquina puede hacerte el índice sola.',
  arranqueSub:
    'Cuando quieres que un renglón parezca un título, lo pones en negrita y le subes el tamaño. Se ve bien y está mal, y hoy vas a ver por qué: para el programa ese renglón sigue siendo un párrafo cualquiera, así que no sale en el índice, no sale en el panel de Navegación y no sirve para nada más que para verse. En el laboratorio te espera el reporte de la huerta de la escuela y ocho encargos para dejarlo con su esqueleto en orden.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#f5a524' },
    { etiqueta: 'Herramientas nuevas', valor: '2', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Por qué existen los estilos',
  fichas: [
    {
      key: 'estilo',
      tag: 'El estilo',
      numero: 1,
      titulo: 'Una etiqueta, no un adorno',
      detalle:
        'Cuando le pones «Título 1» a un renglón no le estás poniendo un aspecto: le estás pegando una etiqueta que dice «esto es una sección». El aspecto viene detrás, de regalo. Por eso dos documentos con Título 1 se ven distintos y los dos están bien.',
      img: 'ficha-estilo.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'navegacion',
      tag: 'El panel',
      numero: 2,
      titulo: 'El esqueleto del documento',
      detalle:
        'El panel de Navegación, a la izquierda, lista los títulos que tiene tu documento y te lleva a cualquiera con un clic. En un trabajo de veinte páginas es la diferencia entre buscar con la rueda del ratón y llegar de golpe.',
      img: 'ficha-navegacion.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'indice',
      tag: 'El índice',
      numero: 3,
      titulo: 'Lo escribe la máquina',
      detalle:
        'La tabla de contenido no se teclea. El programa recorre el documento, apunta cada título con la página en la que cayó y lo escribe por ti. Si un renglón no tiene estilo de título, para él no existe y no aparece.',
      img: 'ficha-indice.png',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'actualizar',
      tag: 'El truco',
      numero: 4,
      titulo: 'El índice es una foto',
      detalle:
        'El índice no se corrige solo: es una foto del documento del momento en que lo hiciste. Si cambias un título o el texto crece y se corren las páginas, hay que volver a tomarla con «Actualizar tabla». Se hace siempre antes de entregar.',
      img: 'ficha-actualizar.png',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  // El video y las láminas dependen de la campaña de videos, congelada en 8 de
  // 60 por decisión de Cristofer. La entrada lo dice en pantalla en vez de
  // cargar seis 404; el laboratorio no depende de ellos.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Textos',
  ctaDetalle:
    'Se abre el reporte de la huerta con el panel de Navegación a la izquierda y tu maestro a la derecha. Vas a decidir tú en qué pestaña vive un índice, vas a hacer que el programa lo escriba solo, y vas a poner un título a mano para descubrir que el índice ni se entera. No vas a andar buscando botones: un aro naranja te marca el que toca desde el primer segundo y escribe su nombre debajo, y el maestro te dice para qué sirve antes de que lo pulses. Si aun así no lo ves, pulsa «Enséñamelo». Y si te equivocas de botón, te dice cuál tocaste y deshace el cambio, para que tu documento no se ensucie.',
};

export function Entrada(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default Entrada;
