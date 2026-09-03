'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { LabLaCinta } from './LabLaCinta';

/**
 * Entrada de `of-word-la-cinta` — «La cinta por dentro» (doc §36.4).
 *
 * Usa la plantilla de oro sin tocarla: video, tres datos, letrero, fichas de
 * color pleno, CTA gigante y ruta. Que la base viva en `n4/estudio` es sólo
 * historia —nació allí— y no la ata al Nivel 4: la ruta y las paradas viajan en
 * la configuración, así que aquí la ruta es la del grado Básico de la sala de
 * Word en vez de la de una unidad de nivel.
 *
 * Las cuatro fichas van en el orden en que la clase las necesita, y ninguna
 * enseña «dónde está el botón». La primera dice qué es una cinta, la segunda
 * —que es el corazón— dice que el rótulo del grupo es la pista, la tercera
 * separa lo que es de la letra de lo que es del párrafo, y la cuarta enseña a
 * leer un botón hundido. Un alumno que se quede sólo con la segunda ya sabe
 * buscar en cualquier programa.
 */

/** Las tres clases exclusivas del grado Básico de la sala de Word. */
const RUTA_WORD_BASICO: PasoRuta[] = [
  { id: 'of-word-la-cinta', titulo: 'La cinta por dentro' },
  { id: 'of-word-parrafos-que-respiran', titulo: 'Párrafos que respiran' },
  { id: 'of-word-guardar-e-imprimir', titulo: 'Guardar, imprimir y PDF' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-word-la-cinta',
  laboratorio: LabLaCinta,
  ruta: RUTA_WORD_BASICO,
  parada: 1,
  globo: 'Hoy no te voy a decir dónde está cada botón. Te voy a enseñar a encontrarlo tú.',
  arranqueSub:
    'Abriste Tecnia Textos y arriba hay una franja llena de botones: la cinta. Parecen sueltos, pero no lo están. Están repartidos en pestañas, y dentro de cada pestaña en grupos, y debajo de cada grupo hay un nombre pequeñito que dice para qué sirve todo lo que tiene encima. Ese nombre es el mapa. En el laboratorio te espera el cartel de la kermés a medio hacer, y siete encargos para terminarlo.',
  stats: [
    { etiqueta: 'Encargos', valor: '7', acento: '#f5a524' },
    { etiqueta: 'Pestañas', valor: '2', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Cómo está ordenada la cinta',
  fichas: [
    {
      key: 'pestanas',
      tag: 'Las pestañas',
      numero: 1,
      titulo: 'Cajones, no botones sueltos',
      detalle:
        'Arriba, en fila, están las pestañas: Inicio, Insertar, Disposición… Cada una es un cajón distinto, y al abrir una cambian TODAS las herramientas de abajo. No se pierden: están en otro cajón.',
      img: 'ficha-pestanas.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'grupos',
      tag: 'Los grupos',
      numero: 2,
      titulo: 'El rótulo es la pista',
      detalle:
        'Dentro de una pestaña, los botones vienen en montones separados por una raya, y debajo de cada montón hay un nombre: Portapapeles, Fuente, Párrafo, Estilos. Ese nombre dice para qué sirve lo de encima. Buscar deja de ser acordarse y pasa a ser leer.',
      img: 'ficha-grupos.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'letra-parrafo',
      tag: 'La pregunta',
      numero: 3,
      titulo: '¿Es de la letra o del párrafo?',
      detalle:
        'Casi todo lo que vas a buscar es una de dos cosas. Si cambia las letras —tamaño, color, negrita— es del grupo Fuente. Si mueve el renglón entero —centrarlo, separarlo, ponerle viñeta— es del grupo Párrafo. Con esa sola pregunta aciertas casi siempre.',
      img: 'ficha-letra-parrafo.webp',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'hundido',
      tag: 'El truco',
      numero: 4,
      titulo: 'Un botón hundido te habla',
      detalle:
        'Pon el cursor en cualquier parte del texto y mira la cinta: los botones del formato que ya tiene se ven hundidos. No sólo sirven para hacer cosas, también te dicen cómo está lo que hay debajo del cursor. Eso ahorra muchísimo tiempo.',
      img: 'ficha-hundido.webp',
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
    'La ventana se convierte en el programa entero y a la derecha aparece tu maestro con el primer encargo. Vas a cambiar de pestaña para ver cómo cambia todo, vas a decidir tú en qué grupo buscar, y vas a terminar el cartel: el título grande y centrado, y una tabla para los precios. No vas a andar buscando botones: un aro naranja te marca el que toca desde el primer segundo y escribe su nombre debajo, y el maestro te dice para qué sirve antes de que lo pulses. Si aun así no lo ves, pulsa «Enséñamelo». Y si te equivocas de botón, te dice cuál tocaste y deshace el cambio, para que tu documento no se ensucie.',
};

export function EntradaLaCinta(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaLaCinta;
