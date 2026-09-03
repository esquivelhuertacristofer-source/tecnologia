'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N8_WEB } from './rutaWebN8';
import { LabCssResponsivo } from './LabCssResponsivo';

/**
 * Entrada de `n8-css-responsivo` — N8·«Desarrollo web II», parada 1.
 * Tono de **13–14 años** (N8, 2.º de Secundaria).
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n8-css-responsivo',
  laboratorio: LabCssResponsivo,
  ruta: RUTA_N8_WEB,
  parada: 1,
  globo:
    'En N7 aprendiste a escribir una hoja de estilos: colores, tipografía, cajas. Esa hoja funcionaba perfecto en la pantalla de una computadora. Hoy vas a ver qué le pasa a esa misma página en un celular, y vas a arreglarlo.',
  arranqueSub:
    'TecniZine ya tiene su "estilo.css" completo, pensado para una pantalla grande. Vas a cambiar anchos fijos por relativos, una tipografía por "rem", dejar que las tarjetas salten de renglón y escribir tu primer punto de quiebre con "@media" para que el menú y las tarjetas cambien solos en un celular.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#38bdf8' },
    { etiqueta: 'Vistas a la vez', valor: '2', acento: '#a855f7' },
    { etiqueta: 'Insignia', valor: '1', acento: '#facc15' },
  ],
  letrero: 'Anchos relativos, rem, flex-wrap y puntos de quiebre',
  fichas: [
    {
      key: 'unidades-relativas',
      tag: 'Las unidades',
      numero: 1,
      titulo: '% en vez de px',
      detalle:
        'Un "px" es un número fijo: mide lo mismo en un teléfono que en un monitor. Un "%" se calcula sobre el contenedor, así que se adapta solo.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'rem',
      tag: 'La tipografía',
      numero: 2,
      titulo: 'rem, no px',
      detalle:
        '"rem" es un múltiplo del tamaño de letra que el usuario configuró en su navegador. Un "32px" nunca se mueve; un "2rem" sí.',
      acento: { c: '#f472b6', deep: '#be185d' },
    },
    {
      key: 'flex-wrap',
      tag: 'El acomodo',
      numero: 3,
      titulo: 'flex-wrap: wrap',
      detalle:
        'Cuando varias cajas ya no caben en una fila, "flex-wrap" deja que las que sobran salten a la siguiente en vez de apretarse o desbordar la pantalla.',
      acento: { c: '#34d399', deep: '#059669' },
    },
    {
      key: 'media',
      tag: 'El punto de quiebre',
      numero: 4,
      titulo: '@media (max-width: 600px)',
      detalle:
        'Una regla que sólo se aplica cuando la pantalla mide 600px o menos. Es lo que hace que el menú, las tarjetas y el header cambien solos en un celular.',
      acento: { c: '#facc15', deep: '#ca8a04' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abrir la hoja de estilos',
  ctaDetalle:
    'Entra al estudio de doble archivo con vista de escritorio y de celular al mismo tiempo, para ver en vivo cómo se adapta tu página.',
  assetsPendientes: false,
};

export function EntradaCssResponsivo(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaCssResponsivo;
