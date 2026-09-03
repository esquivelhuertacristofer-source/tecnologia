'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaPPT, rutaPPT } from '../comun/rutas';
import { LabParaQuePantalla } from './Lab';

/**
 * Entrada de `of-ppt-para-que-pantalla` (doc §44.3). La última puerta de la sala.
 *
 * La ficha 2 es la que se paga en la vida real y la que casi nadie oye a
 * tiempo: **el tamaño se decide antes de maquetar**. Las otras tres se
 * entienden leyéndolas; ésa sólo se entiende después de haber revisado veinte
 * diapositivas una por una.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-ppt-para-que-pantalla',
  laboratorio: LabParaQuePantalla,
  ruta: rutaPPT('intermedio'),
  parada: paradaPPT('intermedio', 'of-ppt-para-que-pantalla'),
  globo: 'El proyector del salón es cuadrado y tu presentación es ancha. Algo va a sobrar.',
  arranqueSub:
    'El concurso es en el salón de actos, con el proyector de siempre — el viejo, el cuadrado. Tu presentación está hecha para una pantalla ancha, así que ahí va a salir estirada o con dos franjas negras. Hoy aprendes a preparar una presentación **para la pantalla donde se va a ver**: mirar de qué forma es, cambiar el tamaño de una vez para todas, y descubrir por las malas por qué eso se hace **al principio y no al final**.',
  stats: [
    { etiqueta: 'Pantallas', valor: '2', acento: '#22d3ee' },
    { etiqueta: 'Diapositivas', valor: '5', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El proyector del salón',
  fichas: [
    {
      key: 'dos-formas-de-pantalla',
      tag: 'La forma',
      numero: 1,
      titulo: 'Dos formas de pantalla',
      detalle:
        'Las pantallas de ahora son **16:9**, anchas. Muchos proyectores de escuela son **4:3**, más cuadrados. Si llevas una de 16:9 a un proyector de 4:3, o salen dos franjas negras, o —lo que de verdad pasa— alguien la estira y todo sale deformado.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'antes-no-despues',
      tag: 'El momento',
      numero: 2,
      titulo: 'Antes, no después',
      detalle:
        'El tamaño se cambia una vez y afecta a **todo el mazo**. Y hay que cambiarlo **antes de maquetar**: si lo cambias al final, lo que habías colocado con cuidado se queda fuera de la pantalla y hay que revisarlo entero. Eso sólo se aprende sufriéndolo una vez.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'lo-que-sale-en-todas',
      tag: 'El pie',
      numero: 3,
      titulo: 'Lo que sale en todas',
      detalle:
        'El nombre de la escuela, la fecha, el número de diapositiva. No se escriben en cada una: se ponen **una vez**, en un cuadro, y salen en todas. El día que cambie el nombre se cambia en un sitio y no en veinte.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'menos-en-la-portada',
      tag: 'La casilla',
      numero: 4,
      titulo: 'Menos en la portada',
      detalle:
        'Hay una casilla —**No mostrar en la diapositiva de título**— que se marca casi siempre y que casi nadie encuentra. Una portada con un «1» en la esquina es lo que distingue una presentación hecha con cuidado de una hecha deprisa.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Que quepa en el salón',
  ctaDetalle:
    'Se abre «Robot recolector.pptx», con cinco diapositivas ya maquetadas en 16:9. El **proyector del salón** está en el panel de la derecha: enciéndelo antes de tocar nada. El tamaño se cambia en **Diseño → Personalizar**, y el pie en **Insertar → Texto**.',
};

export function EntradaParaQuePantalla(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaParaQuePantalla;

export default EntradaParaQuePantalla;
