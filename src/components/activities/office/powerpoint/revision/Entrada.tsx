'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaPPT, rutaPPT } from '../comun/rutas';
import { LabRevision } from './Lab';

/**
 * Entrada de `of-ppt-revision` (doc §43.6).
 *
 * La ficha 3 es la que hace que la clase valga fuera de la escuela: lo que un
 * archivo lleva dentro no es un detalle de PowerPoint, es lo que pasa con
 * cualquier archivo que se manda a alguien.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-ppt-revision',
  laboratorio: LabRevision,
  ruta: rutaPPT('avanzado'),
  parada: paradaPPT('avanzado', 'of-ppt-revision'),
  globo: 'Te llegó el trabajo de otro equipo. No lo arregles.',
  arranqueSub:
    'La presentación del concurso la hicieron entre los dos equipos, y la parte del otro tiene tres defectos que se ven a la primera. Lo que casi todo el mundo hace —arreglárselos— es lo peor que puedes hacer: mañana lo vuelve a hacer igual, porque nunca se enteró. Hoy vas a aprender a decirlo por escrito, pegado a la diapositiva, diciendo qué y por qué. Y después, antes de mandar el archivo, vas a mirar lo que lleva dentro sin que se vea. Te vas a llevar una sorpresa.',
  stats: [
    { etiqueta: 'Comentarios', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Hallazgos', valor: '4', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Comentar, no arreglar',
  fichas: [
    {
      key: 'comentar-no-arreglar',
      tag: 'La regla',
      numero: 1,
      titulo: 'Comentar, no arreglar',
      detalle:
        'Meterle mano al archivo de un compañero es la forma más rápida de que no se entere de nada y de que se enfade. Un comentario va pegado a la diapositiva, lleva tu nombre y la fecha, y el dueño decide.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'que-y-por-que',
      tag: 'Cómo se escribe',
      numero: 2,
      titulo: 'Qué y por qué',
      detalle:
        '«Está mal» no le sirve a nadie: quien lo lee sabe que algo pasa y no sabe qué hacer. «Este título no se lee desde atrás porque el gris sobre blanco casi no contrasta» sí. Cuesta lo mismo escribirlo bien.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'lo-que-va-dentro',
      tag: 'La sorpresa',
      numero: 3,
      titulo: 'Lo que va dentro y no se ve',
      detalle:
        'Un archivo lleva el nombre de quien lo hizo, los comentarios de la revisión, las notas del orador y hasta diapositivas ocultas que nadie recordaba. Cuando lo mandas, mandas todo eso.',
      acento: { c: '#f87171', deep: '#991b1b' },
    },
    {
      key: 'antes-de-mandarlo',
      tag: 'Lo que de verdad aprendes',
      numero: 4,
      titulo: 'Antes de mandarlo, inspector',
      detalle:
        'Y no es un botón de limpiar todo: es una lista para decidir. Si vas a presentarla tú, tus notas te hacen falta. Esto vale para cualquier archivo que mandes en tu vida, no sólo para una presentación.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Revísala',
  ctaDetalle:
    'Se abre «El agua en nuestra colonia.pptx», la que los dos equipos mandan juntos al concurso. Los comentarios se escriben en Revisar → Comentarios, en el panel de la derecha; en la tira verás un globo amarillo en cada diapositiva comentada. Y el inspector está donde está en el programa de verdad: en Archivo → Información, la pestaña roja de la izquierda del todo.',
};

export function EntradaRevision(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaRevision;

export default EntradaRevision;
