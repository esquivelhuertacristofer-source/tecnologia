'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaExcel, rutaExcel } from '../comun/rutas';
import { LabGraficoDinamico } from './Lab';

/**
 * Entrada de `of-excel-grafico-dinamico` (bloques 51 · 52).
 *
 * La ruta y la parada salen de `rutaExcel('avanzado')` y
 * `paradaExcel('avanzado', ...)`, **derivadas** de `EJERCICIOS_OFFICE` y no
 * escritas a mano — la misma razón que ya dejó escrita `of-excel-tabla-dinamica`.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-excel-grafico-dinamico',
  laboratorio: LabGraficoDinamico,
  ruta: rutaExcel('avanzado'),
  parada: paradaExcel('avanzado', 'of-excel-grafico-dinamico'),
  globo: 'Cinco renglones que ya sabes hacer. Ahora enséñaselos a alguien que no los va a leer.',
  arranqueSub:
    'La tabla dinámica de la cooperativa ya está hecha: Categoría en filas, Importe sumado, cinco renglones que contestan la pregunta de la maestra. Pero nadie va a colgar una tabla de números en el mural de la escuela. Hoy conviertes ese resumen en un gráfico que se mueve solo cuando la dinámica se actualiza —y sólo entonces—, pones un panel de botones que filtra la dinámica y el gráfico a la vez sin esconder nada en un menú, trazas la misma línea de tendencia con seis puntos y con cuatro para aprender a desconfiar de una recta antes de creértela, y usas un segundo eje para resolver un problema real —dos escalas que no caben en la misma regla— y para construir, a propósito, la mentira clásica de dos curvas que parecen ir juntas sin estarlo.',
  stats: [
    { etiqueta: 'Encargos', valor: '13', acento: '#f5a524' },
    { etiqueta: 'Herramientas', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Mentiras que desarmas', valor: '2', acento: '#fb7185' },
  ],
  letrero: 'Un dibujo que se mueve solo, y dos maneras clásicas de mentir con él.',
  fichas: [
    {
      key: 'lee-un-resumen',
      tag: 'Lo nuevo',
      numero: 1,
      titulo: 'Un gráfico que no lee celdas',
      detalle:
        'Un gráfico dinámico lleva `origenDinamica` en vez de un rango: come de la tabla dinámica, no de la hoja. Cambia un dato del origen y el dibujo sigue igual — hasta que actualizas, y entonces salta solo.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'filtro-que-se-ve',
      tag: 'Segmentación',
      numero: 2,
      titulo: 'Un filtro que no se esconde',
      detalle:
        'La segmentación filtra la dinámica y el gráfico con el mismo clic, y a diferencia de un filtro de tabla, se ve desde el otro lado del salón qué está pulsado.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'cuantos-puntos',
      tag: 'Línea de tendencia',
      numero: 3,
      titulo: 'Cuatro puntos parecen convincentes',
      detalle:
        'El motor traza la recta igual con cuatro puntos que con cuarenta: decidir si son suficientes para creerte la tendencia es trabajo de quien mira, no del programa.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'dos-caras-del-eje',
      tag: 'Eje secundario',
      numero: 4,
      titulo: 'Explica de verdad, o miente igual de bien',
      detalle:
        'Un segundo eje resuelve dos escalas que no caben en la misma regla — y cortado a mano puede hacer que dos curvas sin relación parezcan ir de la mano. Hoy construyes la mentira y la deshaces.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Dibuja el resumen, no lo cuentes',
  ctaDetalle:
    'Se abre «Cooperativa escolar · Ventas del semestre.xlsx» con la dinámica ya hecha. Trece encargos. Todo se hace desde el panel «Gráfico dinámico», a la derecha: el panel de campos de siempre arriba, y debajo cuatro secciones nuevas —Gráfico dinámico, Segmentación, Línea de tendencia y Eje secundario.',
};

export function EntradaGraficoDinamico(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaGraficoDinamico;

export default EntradaGraficoDinamico;
