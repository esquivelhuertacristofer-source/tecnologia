'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../n4/estudio/EntradaN4Base';
import { LabEntradaYSalida } from './LabEntradaYSalida';
import { RUTA_N7_PYTHON_1 } from './rutaN7Python1';

/**
 * Entrada de N7 · U2 «Programación en texto I» · parada 2 «Entrada y salida».
 *
 * Viene de «Variables y tipos», así que las fichas dan por sabido lo que
 * aquella dejó —un dato tiene tipo, convertir fabrica un dato nuevo— y no lo
 * repiten: lo usan. Cada cadena está escrita para esta clase.
 *
 * El video y las láminas no existen todavía (`assetsPendientes`): la campaña
 * de videos sigue pausada desde el 1-ago-2026.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n7-entrada-y-salida',
  laboratorio: LabEntradaYSalida,
  ruta: RUTA_N7_PYTHON_1,
  parada: 2,
  globo:
    'Hasta ahora tus programas hablaban solos. Éste te va a preguntar, y se va a quedar quieto hasta que le contestes.',
  arranqueSub:
    'Abres **entrevista.py** y escribes un programa que te entrevista: tres preguntas, tus tres respuestas y una ficha al final.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#22d3ee' },
    { etiqueta: 'Preguntas', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Cómo habla un programa',
  fichas: [
    {
      key: 'input',
      tag: 'La entrada',
      numero: 1,
      titulo: 'input pregunta y espera',
      detalle:
        'El programa **se detiene** en esa línea hasta que alguien contesta. Lo que escriban se guarda en la variable de la izquierda.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'texto',
      tag: 'La trampa del primer día',
      numero: 2,
      titulo: 'Lo que llega es texto',
      detalle:
        'Contestas `13` y llega `"13"`. **input devuelve siempre `str`**, aunque escribas cifras. Por eso `edad + 1` no suma: se rompe.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'convertir',
      tag: 'La decisión',
      numero: 3,
      titulo: 'int() convierte, tú decides',
      detalle:
        'Si necesitas el número, lo pides: `int(edad) + 1`. Y si lo que quieres es pegarlo a un texto, no conviertes nada y usas comas en el `print`.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'dato-malo',
      tag: 'Lo que nadie te avisa',
      numero: 4,
      titulo: 'El dato también puede fallar',
      detalle:
        'Si contestan «trece» en letras, `int()` no puede: sale un **ValueError**. El programa está bien; el que no vale es el dato. Comprobarlo se aprende en la parada siguiente.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de código',
  ctaDetalle:
    'Ocho encargos: haz que el programa te pregunte y contéstale tú, **rómpelo sumándole 1 a una respuesta**, conviértela, contesta mal a propósito y arma una ficha con tus tres datos.',
  assetsPendientes: false,
};

export function EntradaEntradaYSalida(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaEntradaYSalida;
