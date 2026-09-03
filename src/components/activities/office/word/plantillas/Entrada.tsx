'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { LabPlantillas } from './Lab';

/**
 * Entrada de `of-word-plantillas` — «Lo que sale en todas las hojas».
 *
 * Plantilla de oro sin tocarla: video, tres datos, letrero, cuatro fichas de
 * color pleno, CTA gigante y ruta. La ruta es la del grado Avanzado de la sala
 * de Word, que tiene cuatro paradas y ésta es la segunda.
 *
 * Las cuatro fichas van en el orden en que la clase las necesita y ninguna dice
 * dónde está el botón. La primera explica qué es una plantilla —que es lo que
 * el alumno cree que es un tema de colores—; la segunda es el corazón de la
 * clase, la idea de que hay una capa que se repite; la tercera separa el número
 * automático del número escrito a mano, que es el error que la clase le va a
 * hacer cometer a propósito; y la cuarta cuenta lo que pasa cuando nace una hoja
 * nueva, que es lo que demuestra que no era un truco.
 */

/** Las cuatro clases del grado Avanzado de la sala de Word. */
const RUTA_WORD_AVANZADO: PasoRuta[] = [
  { id: 'of-word-correspondencia', titulo: 'Combinar correspondencia' },
  { id: 'of-word-plantillas', titulo: 'Lo que sale en todas las hojas' },
  { id: 'of-word-formularios', titulo: 'Formularios y protección' },
  { id: 'of-word-coautoria', titulo: 'Dos personas, un archivo' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-word-plantillas',
  laboratorio: LabPlantillas,
  ruta: RUTA_WORD_AVANZADO,
  parada: 2,
  globo: 'Si estás copiando lo mismo hoja por hoja, no es que trabajes mucho: es que te falta una herramienta.',
  arranqueSub:
    'Un cuadernillo de tres hojas para las familias. El año pasado se armó copiando el nombre de la escuela arriba de cada hoja y escribiendo los números a mano, y cuando hubo que meter una hoja en medio se corrió todo. Hoy vas a hacerlo como se hace: eliges una plantilla ya armada, escribes el encabezado UNA vez y dejas que el programa cuente las páginas. Ocho encargos, y uno de ellos te va a mandar equivocarte a propósito.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#f5a524' },
    { etiqueta: 'Plantillas', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Una capa que se repite',
  fichas: [
    {
      key: 'plantilla',
      tag: 'La plantilla',
      numero: 1,
      titulo: 'Un documento ya armado',
      detalle:
        'Una plantilla no es un color ni un adorno: es un documento de partida hecho. Trae el texto, los títulos, el interlineado y hasta el pie de página puestos, y tú sólo cambias lo que es de tu escuela. Empezar de una hoja en blanco es la forma más lenta de empezar.',
      img: 'ficha-plantilla.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'capa',
      tag: 'La idea',
      numero: 2,
      titulo: 'Arriba y abajo hay otra capa',
      detalle:
        'El encabezado y el pie de página no son el primer y el último renglón de la hoja: son una capa aparte del documento. Se escriben una vez y el programa los repite en todas las hojas, también en las que todavía no existen. Por eso se ven grises mientras escribes en el cuerpo.',
      img: 'ficha-capa.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'numero',
      tag: 'El número',
      numero: 3,
      titulo: 'Que lo cuente el programa',
      detalle:
        'El número de página no se escribe: se pone una vez y cada hoja sabe cuál es. Escribirlo a mano funciona hasta el día en que metes una hoja en medio, y ese día hay que renumerar el documento entero. Lo automático no es comodidad, es que no se rompe.',
      img: 'ficha-numero.png',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'hoja-nueva',
      tag: 'La prueba',
      numero: 4,
      titulo: 'Una hoja que nace vestida',
      detalle:
        'La prueba de que no es un truco: escribe hasta que nazca una hoja nueva y mírala. Ya trae el encabezado arriba, el pie abajo y su número, sin que nadie los copie. Eso es lo que distingue una capa del documento de un renglón de texto.',
      img: 'ficha-hoja-nueva.png',
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
    'La ventana se convierte en el programa entero y a la derecha aparece tu maestro con el primer encargo. Vas a abrir la galería y montar una de las tres plantillas, escribir el encabezado una sola vez, poner el número de página, y después escribir ese mismo texto a mano en la hoja 2 para bajar a la hoja 3 y comprobar que ahí no está. No vas a andar buscando botones: un aro naranja te marca el que toca desde el primer segundo y escribe su nombre debajo, y el maestro te dice para qué sirve antes de que lo pulses. Si aun así no lo ves, pulsa «Enséñamelo». Y si te equivocas de botón, te dice cuál tocaste y deshace el cambio, para que tu documento no se ensucie.',
};

export function EntradaPlantillas(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaPlantillas;
