'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N7_WEB } from './rutaWebN7';
import { LabTuSitioPersonal } from './LabTuSitioPersonal';

/**
 * Entrada de `n7-tu-sitio-personal` — N7·«Desarrollo web I», parada 3 de 3.
 * Tono de **12–13 años** (N7, 1.º de Secundaria).
 *
 * El video se grabó y se publicó el 2-sep-2026, junto con los de sus dos
 * hermanas `n7-html-estructura` y `n7-css-estilo`, así que la deuda de assets
 * que estaba anotada aquí quedó saldada: las tres declaran `assetsPendientes:
 * false` y las tres tienen su carpeta en `public/assets/actividades/`. OJO si
 * escribes pruebas: con el video puesto, el primer `<button>` del documento ya
 * no es el CTA sino el de la portada — búscalo por su texto, no por posición.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n7-tu-sitio-personal',
  laboratorio: LabTuSitioPersonal,
  ruta: RUTA_N7_WEB,
  parada: 3,
  globo:
    'Ya conoces la estructura semántica y ya sabes escribir tu propia hoja de estilos. Hoy juntas las dos cosas en tu propio proyecto: un sitio de tres páginas, sobre el tema que tú elijas, enlazadas entre sí con un mismo menú.',
  arranqueSub:
    'Tu proyecto empieza casi en blanco: tres páginas HTML y una hoja de estilos, todas para que las construyas tú. Vas a repetir la misma cabecera y el mismo menú en las tres páginas, presentar tu tema, mostrar tres tarjetas en fila, y vestirlo todo con colores, tipografía y "display: flex".',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#34d399' },
    { etiqueta: 'Páginas', valor: '3', acento: '#38bdf8' },
    { etiqueta: 'Insignia', valor: '1', acento: '#f472b6' },
  ],
  letrero: 'Tu propio proyecto de HTML y CSS, de principio a fin',
  fichas: [
    {
      key: 'varias-paginas',
      tag: 'Tu sitio',
      numero: 1,
      titulo: 'Tres páginas .html enlazadas',
      detalle:
        'Un sitio de verdad no es una sola página: son varias, con el mismo menú repetido en cada una para poder ir de una a otra.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'flex',
      tag: 'display: flex',
      numero: 2,
      titulo: 'El menú y las tarjetas, en fila',
      detalle:
        '"display: flex" coloca uno junto al otro lo que antes se apilaba: así se arma la barra de menú y la fila de tarjetas.',
      acento: { c: '#34d399', deep: '#059669' },
    },
    {
      key: 'libre',
      tag: 'Tu tema',
      numero: 3,
      titulo: 'Tú eliges de qué habla tu sitio',
      detalle:
        'Se revisa la estructura y el estilo: cabeceras, menús, tarjetas y colores. El tema —tu pasatiempo, tu mascota, lo que tú quieras— lo eliges tú.',
      acento: { c: '#f472b6', deep: '#be185d' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Construir mi sitio personal',
  ctaDetalle:
    'Construirás tus tres páginas y su hoja de estilos desde el editor de código con vista previa en tiempo real, inspector de cajas y el menú de tu propio sitio ya funcionando.',
  assetsPendientes: false,
};

export function EntradaTuSitioPersonal(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaTuSitioPersonal;
