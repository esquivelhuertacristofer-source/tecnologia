'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN6Base, type ConfigEntradaN6, type PasoRuta } from '../ciberseguridad/EntradaN6Base';
import { LabProyectoIntegrador } from './LabProyectoIntegrador';

/**
 * Entrada de `n6-proyecto-integrador` · «Tu proyecto integrador» — la última
 * clase de N1–N6 (DISEÑO-N6-proyecto-integrador.md, PARTE 1 §«Entrada»).
 *
 * Es la única actividad de su propia unidad (`n6-proyecto-integrador-primaria`),
 * así que su ruta no es la de ciberseguridad: se declara aquí, sin tocar
 * `RUTA_N6_CIBERSEGURIDAD`.
 */

export const RUTA_N6_INTEGRADOR: PasoRuta[] = [{ id: 'n6-proyecto-integrador', titulo: 'Tu proyecto integrador' }];

const CONFIG: ConfigEntradaN6 = {
  actividadId: 'n6-proyecto-integrador',
  laboratorio: LabProyectoIntegrador,
  ruta: RUTA_N6_INTEGRADOR,
  parada: 1,
  globo: 'Hoy no vas a aprender nada nuevo. Vas a usar todo lo de antes al mismo tiempo, que es más difícil.',
  arranqueSub: 'Un proyecto es **una pregunta con una respuesta que se puede sostener**. Y al final hay público.',
  stats: [
    { etiqueta: 'Programas que abres', valor: '2', acento: '#A78BFA' },
    { etiqueta: 'Preguntas del público', valor: '3', acento: '#22D3EE' },
    { etiqueta: 'Habilidades nuevas', valor: '0', acento: '#4ADE80' },
  ],
  letrero: 'Di algo, y sostenlo',
  fichas: [
    {
      key: 'dos-fuentes',
      tag: 'Antes de investigar',
      numero: 1,
      titulo: 'Hay dos clases de fuente',
      detalle: 'Lo que ya está escrito, y **lo que ustedes mismos midieron**. La segunda gana, y sólo para su pregunta.',
      acento: { c: '#22D3EE', deep: '#0E7490' },
    },
    {
      key: 'anuncio-no-es-fuente',
      tag: 'La trampa del buscador',
      numero: 2,
      titulo: 'Un anuncio no es una fuente',
      detalle: 'Está escrito para venderte algo, no para informarte — **aunque salga primero** en los resultados.',
      acento: { c: '#F5A524', deep: '#92400E' },
    },
    {
      key: 'afirmacion-primero',
      tag: 'El orden que importa',
      numero: 3,
      titulo: 'Primero la afirmación, después la gráfica',
      detalle: 'Se escribe **lo que quieres sostener** y después se elige la gráfica. Al revés, acabas contando lo que la gráfica quiso.',
      acento: { c: '#4ADE80', deep: '#166534' },
    },
    {
      key: 'alcance',
      tag: 'La pregunta difícil',
      numero: 4,
      titulo: 'Di hasta dónde llega tu dato',
      detalle: '**«Eso no lo medimos»** es una respuesta correcta, y muchas veces la única honesta.',
      acento: { c: '#A78BFA', deep: '#5B21B6' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Investiga, ármala y defiéndela',
  ctaDetalle: 'Investiga, ármala y súbete al escenario. **El público pregunta.**',
  assetsPendientes: false,
};

export function EntradaProyectoIntegrador(props: ActivityProps) {
  return <EntradaN6Base {...props} entrada={CONFIG} />;
}

export default EntradaProyectoIntegrador;
