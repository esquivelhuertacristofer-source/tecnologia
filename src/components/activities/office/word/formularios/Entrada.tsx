'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { Lab } from './Lab';

/**
 * Entrada de `of-word-formularios` — «Una ficha que se rellena sola».
 *
 * Usa la plantilla de oro sin tocarla: video, tres datos, letrero, fichas de
 * color pleno, CTA gigante y ruta. La ruta es la del grado Avanzado de la sala
 * de Word, cuatro paradas, y ésta es la tercera.
 *
 * Las cuatro fichas van en el orden en que la clase las necesita y ninguna dice
 * «dónde está el botón». La primera explica qué es un hueco; la segunda —que es
 * el corazón— explica por qué una lista y una casilla valen más que un renglón
 * en blanco; la tercera es la protección; y la cuarta es la que se lleva puesta
 * fuera de clase: quitar la protección no pide contraseña.
 */

/** Las cuatro clases exclusivas del grado Avanzado de la sala de Word. */
const RUTA_WORD_AVANZADO: PasoRuta[] = [
  { id: 'of-word-correspondencia', titulo: 'Combinar correspondencia' },
  { id: 'of-word-plantillas', titulo: 'Tu propia plantilla' },
  { id: 'of-word-formularios', titulo: 'Formularios y protección' },
  { id: 'of-word-coautoria', titulo: 'Dos personas, un archivo' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-word-formularios',
  laboratorio: Lab,
  ruta: RUTA_WORD_AVANZADO,
  parada: 3,
  globo: 'Hoy tu documento va a aprender dos cosas: pedir datos, y no dejarse tocar lo demás.',
  arranqueSub:
    'La dirección de tu escuela va a repartir la misma ficha de inscripción a treinta familias. Si todo el mundo puede escribir en todas partes, la ficha vuelve con el título cambiado, la fecha borrada y las respuestas donde no van. Un formulario resuelve eso: abre unos huecos —y sólo unos huecos— y cierra todo lo demás. En el laboratorio te espera la ficha del taller de robótica y ocho encargos para blindarla.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#f5a524' },
    { etiqueta: 'Controles', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Un documento que pide datos',
  fichas: [
    {
      key: 'huecos',
      tag: 'El hueco',
      numero: 1,
      titulo: 'Gris quiere decir «aquí sí»',
      detalle:
        'Un control de formulario es un hueco: un trozo del documento marcado en gris donde quien reciba el archivo va a poder escribir. Todo lo demás —el título, los rótulos, la fecha— deja de ser tocable. Un formulario no es una hoja bonita: es una hoja con permisos.',
      img: 'ficha-huecos.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'tres-tipos',
      tag: 'Los tres tipos',
      numero: 2,
      titulo: 'No todo se contesta escribiendo',
      detalle:
        'Campo de texto para lo que es distinto en cada persona, como el nombre. Lista desplegable cuando las respuestas posibles son tres y no quieres que nadie invente una cuarta. Casilla de verificación para lo que sólo es sí o no. Elegir bien el control es la mitad del trabajo.',
      img: 'ficha-tres-tipos.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'restringir',
      tag: 'La cerradura',
      numero: 3,
      titulo: 'Restringir edición',
      detalle:
        'Vive en la pestaña Revisar, no en Insertar: no estás metiendo nada nuevo, estás defendiendo lo que ya hay. Con la regla «Rellenar formularios» el documento deja abiertos los huecos y cierra el resto. Con «Sólo lectura» lo cierra todo, hasta los huecos, y entonces la ficha no se puede contestar.',
      img: 'ficha-restringir.webp',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'sin-contrasena',
      tag: 'El límite',
      numero: 4,
      titulo: 'Proteger no es esconder',
      detalle:
        'El botón de quitar la protección está a la vista y no pide contraseña. Cualquiera que tenga el archivo puede quitarla en un clic. Proteger sirve para que un documento no se estropee sin querer, que es lo que pasa el 99 % de las veces. Para lo que de verdad es secreto hace falta otra cosa.',
      img: 'ficha-sin-contrasena.webp',
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
    'La ventana se convierte en el programa entero y a la derecha aparece tu maestro con el primer encargo. Vas a abrirle tres huecos a la ficha del taller de robótica, vas a decidir tú en qué pestaña se protege un documento, y vas a contestarla entera con el candado puesto: verás que el título ya no se deja borrar. No vas a buscar los botones a ciegas: en los encargos que se resuelven pulsando algo, el maestro te señala el botón exacto con un aro naranja y te dice cómo se llama y dónde vive antes de que lo toques.',
};

export function Entrada(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default Entrada;
