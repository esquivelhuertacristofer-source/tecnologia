'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../n4/estudio/EntradaN4Base';
import { LabAutomatizaTareas } from './LabAutomatizaTareas';

/**
 * Entrada de N9 · «IA y automatización» · parada 1 «Automatiza tareas
 * repetitivas». 3.º de secundaria (14–15 años), comprobado en `curriculo.ts`.
 * Registro de secundaria alta: se nombra el mecanismo y se explica el porqué,
 * sin metáfora infantil (documento §50.0/§30.4).
 *
 * `assetsPendientes` porque el video de esta clase todavía no existe.
 */

const RUTA: PasoRuta[] = [
  { id: 'n9-automatiza-tareas', titulo: 'Automatiza tareas repetitivas' },
  { id: 'n9-ia-copiloto', titulo: 'La IA como copiloto' },
  { id: 'n9-ia-y-trabajo', titulo: 'El impacto de la IA en el trabajo' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n9-automatiza-tareas',
  laboratorio: LabAutomatizaTareas,
  ruta: RUTA,
  parada: 1,
  globo: 'Una bandeja de entrada real procesa cientos de correos con la misma regla, una y otra vez. Hoy escribes tú esa regla.',
  arranqueSub:
    'Vas a armar una regla de automatización «si esto, entonces aquello» y a descubrir por qué una condición mal comprobada la rompe.',
  stats: [
    { etiqueta: 'Encargos', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Reglas', valor: '1', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Cuando… entonces…',
  fichas: [
    {
      key: 'disparador',
      tag: 'Lo que arranca la regla',
      numero: 1,
      titulo: 'Un evento dispara la automatización',
      detalle: 'Nadie hace clic cada vez: la regla corre sola **cada vez que llega un correo**.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'condicion',
      tag: 'La mitad que se olvida',
      numero: 2,
      titulo: 'Comprobar antes de actuar',
      detalle: 'Una automatización sin condición no automatiza nada bien: actúa igual para todo, acierte o no.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'dosramas',
      tag: 'La regla completa',
      numero: 3,
      titulo: 'Sí y no son dos caminos, no uno',
      detalle: 'Una regla real decide **en los dos casos**: qué pasa si la condición se cumple, y qué pasa si no.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'trampa',
      tag: 'El error que se paga caro',
      numero: 4,
      titulo: 'Una condición vacía es un «no» silencioso',
      detalle: 'Si la comprobación se queda sin escribir, el sistema no espera ni pregunta: **contesta que no, siempre**.',
      acento: { c: '#f87171', deep: '#7f1d1d' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre la bandeja de automatización',
  ctaDetalle:
    'Seis encargos: mira una bandeja sin reglas, arma tu primera regla, complétala con su «si no», y provoca a propósito el error de una condición vacía.',
  assetsPendientes: false,
};

export function EntradaAutomatizaTareas(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaAutomatizaTareas;
