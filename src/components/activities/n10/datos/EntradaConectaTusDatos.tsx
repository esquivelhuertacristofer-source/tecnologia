'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N10_DATOS } from './rutaDatosN10';
import { LabConectaTusDatos } from './LabConectaTusDatos';

/**
 * Entrada de `n10-conecta-tus-datos` — N10·«Bases de datos y SQL», parada 3
 * de 3, CIERRE de la unidad. Tono de **15–18 años** (N10, Bachillerato).
 *
 * El cierre integra las dos paradas anteriores sin repetirlas: modelaste la
 * base (parada 1) y la consultaste (parada 2); hoy sacas un resultado de ahí
 * y lo llevas, a mano, a una hoja de cálculo real para seguir analizándolo.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n10-conecta-tus-datos',
  laboratorio: LabConectaTusDatos,
  ruta: RUTA_N10_DATOS,
  parada: 3,
  globo:
    'TecniMarket necesita un resumen de ventas por categoría, y ese resumen no vive en la base de datos: vive en una hoja de cálculo. Hoy vas a ser tú el puente entre las dos.',
  arranqueSub:
    'Vas a escribir una consulta SQL real sobre las ventas de TecniMarket —con JOIN, GROUP BY y HAVING—, leer lo que el motor te devuelve, y transcribir esos números a mano a una hoja de cálculo real para sacarles SUMA, MAX, PROMEDIO y un conteo condicional.',
  stats: [
    { etiqueta: 'Encargos', valor: '10', acento: '#2dd4bf' },
    { etiqueta: 'Programas reales', valor: '2', acento: '#107c41' },
    { etiqueta: 'Insignia', valor: '1', acento: '#f59e0b' },
  ],
  letrero: 'De la consulta SQL a la hoja de cálculo: el cierre de Bases de datos y SQL',
  fichas: [
    {
      key: 'une-y-agrupa',
      tag: 'SQL, otra vez pero de verdad',
      numero: 1,
      titulo: 'JOIN, GROUP BY y HAVING',
      detalle:
        'Unes ventas con productos, agrupas por categoría y filtras grupos con HAVING — las piezas que se guardaron para este cierre.',
      acento: { c: '#2dd4bf', deep: '#0f766e' },
    },
    {
      key: 'traduces-el-dato',
      tag: 'El puente no existe: lo haces tú',
      numero: 2,
      titulo: 'Leer, y transcribir a mano',
      detalle:
        'Ningún cable conecta una base de datos con una hoja de cálculo. Lees el resultado real y lo escribes donde hace falta — como cualquier analista de datos.',
      acento: { c: '#f59e0b', deep: '#b45309' },
    },
    {
      key: 'formulas-reales',
      tag: 'Ahora en Excel',
      numero: 3,
      titulo: 'SUMA, MAX, PROMEDIO, CONTAR.SI',
      detalle:
        'Con los números ya en la hoja, los analizas con fórmulas reales — incluido un conteo condicional, el WHERE de una hoja de cálculo.',
      acento: { c: '#107c41', deep: '#0b5c30' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Abre consulta_ventas.sql',
  ctaDetalle:
    'Diez encargos: una consulta SQL real con JOIN, GROUP BY y HAVING, y una hoja de cálculo real donde esos resultados se convierten en un reporte.',
  assetsPendientes: false,
};

export function EntradaConectaTusDatos(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaConectaTusDatos;
