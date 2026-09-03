'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N8_WEB } from './rutaWebN8';
import { LabSitioMultipagina } from './LabSitioMultipagina';

/**
 * Entrada de `n8-sitio-multipagina` — N8·«Desarrollo web II», parada 3 de 3
 * (cierre de unidad). Tono de **13–14 años** (N8, 2.º de Secundaria).
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n8-sitio-multipagina',
  laboratorio: LabSitioMultipagina,
  ruta: RUTA_N8_WEB,
  parada: 3,
  globo:
    'Ya sabes hacer que un sitio se vea bien en cualquier pantalla y que un botón responda a un clic. Hoy juntas las dos cosas en un sitio de verdad: dos páginas conectadas por un menú que de verdad funciona.',
  arranqueSub:
    'Tu proyecto tiene cuatro archivos: index.html, proyectos.html, estilo.css y script.js. Un mismo menú en las dos páginas, un solo archivo de estilos para vestirlas, un punto de quiebre para el móvil y un botón conectado con JavaScript.',
  stats: [
    { etiqueta: 'Encargos', valor: '10', acento: '#22d3ee' },
    { etiqueta: 'Páginas', valor: '2', acento: '#a855f7' },
    { etiqueta: 'Insignia', valor: '1', acento: '#facc15' },
  ],
  letrero: 'Un sitio de verdad: varias páginas, un solo estilo',
  fichas: [
    {
      key: 'nav-real',
      tag: 'Navegación real',
      numero: 1,
      titulo: '<nav> entre dos páginas',
      detalle:
        'Un enlace <a href="..."> de verdad, que al hacerle clic en tu vista previa te lleva a la otra página de tu propio sitio.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'un-estilo',
      tag: 'Un solo estilo',
      numero: 2,
      titulo: 'Un archivo, dos páginas',
      detalle: 'Un mismo estilo.css enlazado desde tus dos páginas: cambias una regla y las dos se visten a la vez.',
      acento: { c: '#a855f7', deep: '#7e22ce' },
    },
    {
      key: 'responsivo',
      tag: 'Responsivo',
      numero: 3,
      titulo: '@media y el punto de quiebre',
      detalle: 'Tu menú pasa de fila a columna solo, en cuanto la pantalla se vuelve angosta.',
      acento: { c: '#facc15', deep: '#ca8a04' },
    },
    {
      key: 'js-conectado',
      tag: 'JavaScript',
      numero: 4,
      titulo: 'querySelector + addEventListener',
      detalle: 'El mismo botón, conectado con guion, funcionando igual en cualquiera de tus dos páginas.',
      acento: { c: '#34d399', deep: '#059669' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5',
  ctaTitulo: 'Entra al estudio de CyberStudio',
  ctaDetalle: 'Construye tu sitio de dos páginas: navegación real, un solo archivo de estilos, un punto de quiebre y un botón que de verdad hace algo.',
  assetsPendientes: false,
};

export function EntradaSitioMultipagina(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaSitioMultipagina;
