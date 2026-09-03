'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../n4/estudio/EntradaN4Base';
import { LabProgramaUnMicrobit } from './LabProgramaUnMicrobit';

/**
 * Entrada de N6 · «Robótica y STEAM» · parada 2 «Programa un micro:bit».
 *
 * `EntradaN4Base` es agnóstica de nivel (documento §50.2, misma nota). Cada
 * cadena de aquí está escrita para esta clase; el registro es 6.º de
 * primaria (11–12 años), comprobado en `curriculo.ts` antes de escribir.
 *
 * `assetsPendientes` porque el video de esta clase todavía no existe: la
 * campaña de videos sigue pausada desde el 1-ago-2026.
 */

const RUTA: PasoRuta[] = [
  { id: 'n6-que-es-un-robot', titulo: '¿Qué es un robot?' },
  { id: 'n6-programa-un-microbit', titulo: 'Programa un micro:bit' },
  { id: 'n6-reto-robot', titulo: 'Reto: resuélvelo con tu robot' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n6-programa-un-microbit',
  laboratorio: LabProgramaUnMicrobit,
  ruta: RUTA,
  parada: 2,
  globo: 'Un micro:bit es una placa diminuta que se programa por bloques. Hoy la programas tú, desde este simulador.',
  arranqueSub:
    'Vas a abrir el editor de bloques y programar qué hace la placa cuando presionas sus botones A y B.',
  stats: [
    { etiqueta: 'Encargos', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Guiones', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Un programa, varios guiones',
  fichas: [
    {
      key: 'sombrero',
      tag: 'La pieza que arranca',
      numero: 1,
      titulo: 'El sombrero dispara el guion',
      detalle:
        'Cada guion empieza con un bloque redondeado arriba: un **sombrero**. No corre solo — corre cuando pasa lo que dice: «al presionar A», «al empezar»…',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'eventos',
      tag: 'Cómo piensa la placa',
      numero: 2,
      titulo: 'Varios guiones a la vez',
      detalle:
        'Una placa de verdad tiene un guion por botón, por sensor, por momento. **No los corre todos juntos**: corre sólo el que dispara lo que acaba de pasar.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'orden',
      tag: 'Lo que se ve poco',
      numero: 3,
      titulo: 'El orden de los bloques cambia el resultado',
      detalle:
        'Dos bloques iguales, en otro orden, hacen otra cosa. Los bloques se cumplen **de arriba abajo**, uno detrás de otro.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'error',
      tag: 'Y lo que nadie te dice',
      numero: 4,
      titulo: 'Un guion vacío no es un error tuyo',
      detalle: 'Si el guion no tiene bloques, el editor sólo te avisa: **no truena, no te regaña**.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de bloques',
  ctaDetalle:
    'Seis encargos: programa el botón A, programa el botón B, mira un guion vacío, provoca un resultado equivocado por el orden y arréglalo, y decide qué dispara cada guion.',
  assetsPendientes: false,
};

export function EntradaProgramaUnMicrobit(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaProgramaUnMicrobit;
