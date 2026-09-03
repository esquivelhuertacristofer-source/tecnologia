'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U4 } from './EntradaN4Base';
import { Lab as LabFormasYWordArt } from '@/components/activities/office/word/p-formas-y-wordart/Lab';

/**
 * Entrada de N4·U4 parada 2 «Formas, WordArt e imágenes» (documento §26.2).
 * Globo, stats, letrero y CTA son verbatim de la línea de entrada del documento.
 *
 * Las cuatro fichas van en el orden en que la actividad las pide, que es también
 * el del video: primero qué es un título artístico y para qué sirve, luego la
 * prueba que decide si sirve —verlo de lejos—, después la forma que marca, y al
 * final la imagen con sus dos reglas. Esa segunda ficha no es un apéndice: es la
 * única de las cuatro que enseña a JUZGAR en vez de a hacer, y la parada entera
 * se apoya en ella.
 *
 * Los acentos siguen el idioma que el alumno lleva usando desde la parada 1:
 * ámbar lo que destaca, cian lo que estructura, verde lo que se lee mejor y
 * coral la advertencia.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-formas-y-wordart',
  laboratorio: LabFormasYWordArt,
  ruta: RUTA_N4U4,
  parada: 2,
  globo: 'Una portada de verdad: título grande, una forma que marque y una imagen bien puesta.',
  arranqueSub:
    'El documento amaneció en blanco: hoy no es la página de la tabla, es la PORTADA del folleto. En la pestaña Insertar hay tres cosas que no habías usado —el título artístico, una galería de formas y las imágenes—, y abajo a la derecha el zoom, que en vez de acercarte te aleja: sirve para mirar tu portada como la va a mirar quien la lea.',
  stats: [
    { etiqueta: 'Misiones', valor: '3', acento: '#f5a524' },
    { etiqueta: 'Piezas', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La portada del folleto',
  fichas: [
    {
      key: 'titulo',
      tag: 'El título',
      numero: 1,
      titulo: 'Texto con estilo',
      detalle:
        'El título artístico es texto con estilo: más grande, con color, con contorno o con sombra. Sirve para el título de una portada, no para el texto normal, porque si todo va con estilo ya nada destaca sobre nada.',
      img: 'ficha-titulo.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'de-lejos',
      tag: 'La prueba',
      numero: 2,
      titulo: 'Que se lea de lejos',
      detalle:
        'Y hay una regla que se olvida siempre: un título tiene que LEERSE. Uno con demasiados efectos, o de un color que se pierde contra el papel, se ve bonito de cerca y desaparece de lejos. La prueba es bajarle el zoom a la página y mirarla entera.',
      img: 'ficha-de-lejos.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'forma',
      tag: 'Las formas',
      numero: 3,
      titulo: 'Marcar y señalar',
      detalle:
        'Las formas son figuras que insertas: recuadros, círculos, flechas, globos. Sirven para marcar algo importante, para señalarlo o para agrupar. Cada una hace una cosa distinta, y una forma puesta donde no hay nada que marcar sólo estorba.',
      img: 'ficha-forma.webp',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'imagen',
      tag: 'La imagen',
      numero: 4,
      titulo: 'Cerca y sin deformar',
      detalle:
        'Una imagen va cerca del texto que explica, y con el texto acomodado a su alrededor. Y para cambiarle el tamaño se jala de una esquina, nunca de un lado: de un lado se estira y se deforma, y eso se nota muchísimo.',
      img: 'ficha-imagen.webp',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Compón la portada',
  ctaDetalle:
    'Empieza por el título: conviértelo en título artístico y míralo puesto antes de decidir, porque el estilo se elige viéndolo. Luego bájale el zoom a la página y comprueba si de lejos se sigue leyendo. Después marca con una forma el dato del zorro —y fíjate en cuál usas, que una flecha y un globo de diálogo no dicen lo mismo—, y termina poniendo la foto junto a su renglón y agrandándola siempre desde una esquina.',
};

export function EntradaFormasYWordArt(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaFormasYWordArt;
