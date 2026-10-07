'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../n4/estudio/EntradaN4Base';
import { LabRetoRobot } from './LabRetoRobot';

/**
 * Entrada de N6 · «Robótica y STEAM» · parada 3 «Reto: resuélvelo con tu
 * robot». 6.º de primaria (11–12 años), comprobado en `curriculo.ts`.
 *
 * `assetsPendientes` porque el video de esta clase todavía no existe.
 */

const RUTA: PasoRuta[] = [
  { id: 'n6-que-es-un-robot', titulo: '¿Qué es un robot?' },
  { id: 'n6-programa-un-microbit', titulo: 'Programa un micro:bit' },
  { id: 'n6-reto-robot', titulo: 'Reto: resuélvelo con tu robot' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n6-reto-robot',
  laboratorio: LabRetoRobot,
  ruta: RUTA,
  parada: 3,
  globo: 'Tu robot tiene dos mapas con paredes. No puede ver ninguna hasta que se lo preguntes tú, con un bloque.',
  arranqueSub: 'Vas a llevar al robot a la bandera, y después hacer que un solo programa llegue en dos mapas distintos sin chocar.',
  stats: [
    { etiqueta: 'Encargos', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Mapas', valor: '2', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Preguntar antes de actuar',
  fichas: [
    {
      key: 'secuencia',
      tag: 'Lo que ya sabes',
      numero: 1,
      titulo: 'Los bloques se cumplen en orden',
      detalle: '«avanzar» mueve una casilla en la dirección a la que mira el robot. Uno detrás de otro, de arriba abajo.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'choque',
      tag: 'Y esto es nuevo',
      numero: 2,
      titulo: 'Chocar no rompe nada',
      detalle: 'Si el robot no puede avanzar, simplemente se queda quieto. **No es tu culpa** y el programa sigue.',
      acento: { c: '#f87171', deep: '#7f1d1d' },
    },
    {
      key: 'si',
      tag: 'La pieza del reto',
      numero: 3,
      titulo: 'El bloque «si» pregunta antes',
      detalle:
        'Un hexágono se encaja en su hueco: **«¿hay pared adelante?»**. Si la respuesta es sí, lo de dentro del si se cumple; si no, se salta.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'dos-mapas',
      tag: 'El reto',
      numero: 4,
      titulo: 'Un programa, dos mapas',
      detalle: 'Un programa que cuenta pasos sólo sirve para el mapa que contó. El reto es uno que llegue en los dos **sin cambiarlo**.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el mapa del robot',
  ctaDetalle:
    'Cinco encargos: llega a la bandera, prueba tu programa en otro mapa, haz uno que sirva en los dos sin chocar, y descubre qué hace un «si» sin pregunta.',
  assetsPendientes: false,
};

export function EntradaRetoRobot(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaRetoRobot;
