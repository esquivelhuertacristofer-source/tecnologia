'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { LabCoautoria } from './Lab';

/**
 * Entrada de `of-word-coautoria` — «Escribir entre tres».
 *
 * Plantilla de oro sin tocarla: video, tres datos, letrero, cuatro fichas de
 * color pleno, CTA gigante y ruta. La ruta es la del grado Avanzado de la sala
 * de Word, y ésta es su cuarta y última parada: con ella Word queda cerrado.
 *
 * Las cuatro fichas no enseñan dónde está ningún botón. La primera dice qué es
 * una versión y por qué lleva nombre, autor y hora; la segunda —que es el
 * corazón— dice para qué sirve comparar; la tercera corrige la idea de que
 * resolver un comentario es cerrarlo; y la cuarta deja la regla que sobrevive a
 * la clase: se guarda ANTES del cambio grande.
 */

/** Las cuatro clases exclusivas del grado Avanzado de la sala de Word. */
const RUTA_WORD_AVANZADO: PasoRuta[] = [
  { id: 'of-word-correspondencia', titulo: 'Correspondencia' },
  { id: 'of-word-plantillas', titulo: 'Plantillas' },
  { id: 'of-word-formularios', titulo: 'Formularios' },
  { id: 'of-word-coautoria', titulo: 'Escribir entre tres' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-word-coautoria',
  laboratorio: LabCoautoria,
  ruta: RUTA_WORD_AVANZADO,
  parada: 4,
  globo: 'Escribir entre varios no es difícil por escribir. Es difícil por saber qué cambió y quién lo cambió.',
  arranqueSub:
    'Estás escribiendo el guion del periódico escolar con Renata y Diego. Los tres tocan el mismo documento, y cada uno lo deja como cree que va. Sin herramientas, eso acaba en «¿quién borró mi párrafo?» y en dos personas escribiendo la misma nota. Con ellas, en tres minutos sabes qué cambió desde ayer, vuelves a como estaba antes si hace falta, y dejas claro qué ya está hecho y qué no. Eso es lo que vas a hacer en el laboratorio, con ocho encargos.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#f5a524' },
    { etiqueta: 'Autores', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Cuando el documento lo escriben tres',
  fichas: [
    {
      key: 'versiones',
      tag: 'Las versiones',
      numero: 1,
      titulo: 'Una foto a la que puedes volver',
      detalle:
        'Guardar el archivo deja UN documento, que se pisa a sí mismo cada vez. Guardar una versión deja una foto aparte, con nombre, autor y hora. Sigues escribiendo encima y esa foto no se mueve: si algo sale mal, vuelves a ella.',
      img: 'ficha-versiones.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'comparar',
      tag: 'Comparar',
      numero: 2,
      titulo: '¿Qué cambió desde ayer?',
      detalle:
        'Es la pregunta que más se hace cuando escriben varios, y leer el documento entero para contestarla es perder media hora. Comparar dos versiones pone una al lado de la otra y marca en verde lo que se añadió y en rojo lo que se quitó. En tres segundos.',
      img: 'ficha-comparar.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'comentarios',
      tag: 'Los comentarios',
      numero: 3,
      titulo: 'Resuelto quiere decir hecho',
      detalle:
        'Un comentario es una nota al margen: no cambia el documento, pide que alguien lo cambie. Y marcarlo como resuelto no es cerrarlo para quitarlo de en medio: es decir «esto ya está hecho». Si lo dices y no está, el otro deja de mirarlo y el error se queda dentro.',
      img: 'ficha-comentarios.webp',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'antes',
      tag: 'La regla',
      numero: 4,
      titulo: 'Se guarda antes, no después',
      detalle:
        'Volver a una versión borra de golpe todo lo que pasó después, y eso es justo lo que la hace útil. Por eso el hito se guarda cuando algo queda bien, antes de meter mano otra vez: arreglar a mano lo que se rompió cuesta diez veces más.',
      img: 'ficha-antes.webp',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  // El video y las láminas dependen de la campaña de videos, congelada en 8 de
  // 60 por decisión de Cristofer. La entrada lo dice en pantalla en vez de
  // cargar seis 404; el laboratorio no depende de ellos.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el guion del periódico',
  ctaDetalle:
    'Te espera el guion del número 3 con tres comentarios de Renata y de Diego sin leer, y dos versiones ya guardadas: el borrador del lunes y lo que quedó tras la junta del martes. Vas a arreglar lo que uno de ellos pide, guardar tu propio punto, comparar el lunes con hoy para ver la semana entera en verde y rojo, y volver atrás a propósito para comprobar que la red aguanta. No vas a andar buscando botones: un aro naranja te marca el que toca desde el primer segundo y escribe su nombre debajo, y el maestro te dice para qué sirve antes de que lo pulses. Si aun así no lo ves, pulsa «Enséñamelo». Y si te equivocas de botón, te dice cuál tocaste y deshace el cambio, para que tu documento no se ensucie.',
};

export function EntradaCoautoria(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaCoautoria;
