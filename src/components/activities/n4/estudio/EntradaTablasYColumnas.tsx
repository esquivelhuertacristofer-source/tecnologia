'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U4 } from './EntradaN4Base';
import { Lab as LabTablasYColumnas } from '@/components/activities/office/word/p-tablas-y-columnas/Lab';

/**
 * Entrada de N4·U4 parada 1 «Tablas y columnas» (documento §26.1). Globo, stats,
 * letrero y CTA son verbatim de la línea de entrada del documento.
 *
 * Las cuatro fichas van en el orden en que la actividad las pide, que es también
 * el del video: primero qué es una rejilla, luego para qué sirve su primera
 * fila, después por qué un texto largo se parte en dos, y al final cuándo NO
 * hacerlo. Esa última no es un apéndice: media unidad de maquetación consiste en
 * saber cuándo dejar las cosas en paz.
 *
 * Los acentos siguen el idioma que el alumno lleva usando desde N3·U5 en este
 * mismo taller: cian lo que estructura, ámbar lo que destaca, verde lo que se
 * lee mejor y coral la advertencia.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-tablas-y-columnas',
  laboratorio: LabTablasYColumnas,
  ruta: RUTA_N4U4,
  parada: 1,
  globo: 'Cuando la información se amontona, se acomoda: una tabla y dos columnas lo arreglan todo.',
  arranqueSub:
    'La computadora del taller amaneció con un documento abierto y una lista de datos apuntada en un papel al lado. En la cinta hay dos pestañas que no habías tocado: Insertar, donde vive la tabla, y Disposición, donde el texto se puede partir en columnas como el periódico. Bit dice que hoy no vas a escribir: vas a acomodar, que es otra cosa y se nota desde lejos.',
  stats: [
    { etiqueta: 'Celdas', valor: '9', acento: '#22d3ee' },
    { etiqueta: 'Casos', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La mesa de maquetación',
  fichas: [
    {
      key: 'rejilla',
      tag: 'La rejilla',
      numero: 1,
      titulo: 'Filas y columnas',
      detalle:
        'Una tabla es una rejilla: las filas van en horizontal, las columnas en vertical y cada cuadrito es una celda. Sirve para lo que se repite —animales y lo que comen, países y su capital—, porque puesto en párrafos eso se vuelve un revoltijo y en rejilla se entiende de un vistazo.',
      img: 'ficha-rejilla.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'encabezado',
      tag: 'La primera fila',
      numero: 2,
      titulo: 'El encabezado',
      detalle:
        'La fila de arriba no es un dato: dice qué guarda cada columna, y por eso va en negrita. Y de ahí sale la única regla que de verdad importa en una tabla: cada columna guarda el mismo tipo de dato. Si en «Come» pones a veces un alimento y a veces un color, la tabla deja de servir.',
      img: 'ficha-encabezado.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'columnas',
      tag: 'El texto largo',
      numero: 3,
      titulo: 'Dos columnas',
      detalle:
        'Las columnas de texto son otra cosa: reparten un párrafo largo en dos ríos más angostos, como en las revistas y los periódicos. Funcionan porque un renglón muy largo cansa la vista —al terminarlo, el ojo se pierde buscando dónde empieza el siguiente.',
      img: 'ficha-columnas.png',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'cuando-no',
      tag: 'Y cuándo no',
      numero: 4,
      titulo: 'Cuándo dejarlo en una',
      detalle:
        'Dos columnas no siempre convienen. Un título partido por la mitad se ve aplastado, y una tabla ancha metida en media hoja queda tan estrecha que ya no se lee. La regla práctica: dos columnas para textos largos; una sola para títulos, tablas e imágenes grandes.',
      img: 'ficha-cuando-no.png',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra a la mesa',
  ctaDetalle:
    'Primero inserta la tabla y cuenta bien cuántas filas y cuántas columnas necesitas, porque de eso depende que los datos quepan. Llena el encabezado con nombres que sí digan algo, ponlo en negrita y escribe cada dato en su columna; con el tabulador saltas de celda en celda y al final de la tabla te nace una fila nueva. Después reparte el párrafo en dos columnas y decide, en tres casos, si conviene una o dos.',
};

export function EntradaTablasYColumnas(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaTablasYColumnas;
