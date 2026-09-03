'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N10_WEB } from '../web/rutaWebN10';
import { LabUxUi } from './LabUxUi';

/**
 * Entrada de `n10-ux-ui` — N10·«Desarrollo web integral», parada 3 de 3, la
 * que CIERRA la unidad. Tono de **15–18 años** (N10, Bachillerato), heredado
 * literalmente de `EntradaProyectoWebReal.tsx` (parada 1), la única fuente
 * verificada del tono de esta unidad.
 *
 * `RUTA_N10_WEB` se importa tal cual desde `n10/web/rutaWebN10.ts` — no se
 * toca ese archivo ni se deriva la ruta de otra forma, porque la parada 2
 * puede estar construyéndose en paralelo sobre el mismo archivo compartido.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n10-ux-ui/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n10-ux-ui',
  laboratorio: LabUxUi,
  ruta: RUTA_N10_WEB,
  parada: 3,
  globo:
    'Ya construiste con código real y ya decidiste cómo publicar. Hoy cierras la unidad con la disciplina que decide si todo eso sirve para algo: ¿alguien real puede usar lo que construiste?',
  arranqueSub:
    'Vas a medir **jerarquía visual** (tamaño y contraste, en el CSS real, no a ojo), vas a corregir el **contraste de color** de un botón con la misma fórmula que usa el inspector de accesibilidad de un navegador de verdad, y vas a abrir un **flujo con más de un camino** entre las páginas de un sitio real. Cierras revisando el lanzamiento de un cliente nuevo con las tres paradas de la unidad juntas.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#4338ca' },
    { etiqueta: 'Nivel', valor: 'Bachillerato', acento: '#6366f1' },
    { etiqueta: 'Insignia', valor: '1', acento: '#10b981' },
  ],
  letrero: 'UX/UI: lo que decide si un sitio bien hecho sí sirve',
  fichas: [
    {
      key: 'jerarquia-real',
      tag: 'Se mide, no se adivina',
      numero: 1,
      titulo: 'Jerarquía visual real',
      detalle:
        'Un título y un párrafo del mismo tamaño no le dicen al ojo por dónde empezar. La jerarquía se corrige comparando números reales de tamaño de letra, en el CSS de verdad.',
      acento: { c: '#4338ca', deep: '#312e81' },
    },
    {
      key: 'accesibilidad-real',
      tag: 'La fórmula, no la opinión',
      numero: 2,
      titulo: 'Accesibilidad real: contraste y tamaño',
      detalle:
        'El mismo cálculo de contraste que usa un navegador de verdad corre sobre el color que tú escribas — para saber si un texto es de verdad legible, no "más o menos".',
      acento: { c: '#0ea5e9', deep: '#0369a1' },
    },
    {
      key: 'flujo-con-caminos',
      tag: 'Nunca una sola fila',
      numero: 3,
      titulo: 'Un flujo con más de un camino',
      detalle:
        'Un sitio con un solo camino no es un flujo. Vas a abrir un segundo camino desde el inicio y a cerrar un callejón sin salida en una página de confirmación.',
      acento: { c: '#10b981', deep: '#047857' },
    },
    {
      key: 'cierre-tres-paradas',
      tag: 'El cierre',
      numero: 4,
      titulo: 'Código, publicación y UX/UI, juntos',
      detalle:
        'Un sitio nuevo se publica a punto de lanzarse. Revisas su checklist combinando las tres paradas de la unidad — y decides, con criterio real, si de verdad está listo.',
      acento: { c: '#f59e0b', deep: '#b45309' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra a la revisión de UX/UI',
  ctaDetalle:
    'Corriges jerarquía, contraste y tamaño de texto reales en el sitio de Órbita Estudio, abres un flujo con más de un camino entre sus páginas, y cierras la unidad revisando el lanzamiento de un cliente nuevo con las tres paradas juntas.',
  assetsPendientes: false,
};

export function EntradaUxUi(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaUxUi;
