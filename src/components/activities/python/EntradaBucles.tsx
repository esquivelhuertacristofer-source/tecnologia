'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../n4/estudio/EntradaN4Base';
import { LabBucles } from './LabBucles';
import { RUTA_N7_PYTHON_1 } from './rutaN7Python1';

/**
 * Entrada de N7 · U2 «Programación en texto I» · parada 4 «Bucles».
 *
 * Viene de «Entrada y salida», así que las fichas dan por sabido que un dato
 * tiene tipo y que convertir fabrica un dato nuevo, y no lo repiten. Registro
 * de secundaria (§30.4): término técnico correcto con su traducción al lado,
 * se explica el porqué y no sólo el qué, refuerzo informativo. Cada cadena
 * está escrita para esta clase.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n7-bucles-python/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n7-bucles-python',
  laboratorio: LabBucles,
  ruta: RUTA_N7_PYTHON_1,
  parada: 4,
  globo:
    'Un programa que se cumple de arriba abajo una sola vez no alcanza para casi nada. Los bucles son la manera de decirle a Python: esto, otra vez.',
  arranqueSub:
    'Abres **bucles.py** y escribes cuatro bucles distintos, hasta provocar uno que no se detiene solo — y sobrevivirlo.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#22d3ee' },
    { etiqueta: 'Bucles', valor: '4', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Dos formas de repetir',
  fichas: [
    {
      key: 'for',
      tag: 'Un número fijo de vueltas',
      numero: 1,
      titulo: 'for … in range()',
      detalle:
        'Repite una vez por cada número del rango: `for i in range(5):` da exactamente cinco vueltas, ni una más.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'while',
      tag: 'Vueltas mientras algo sea cierto',
      numero: 2,
      titulo: 'while',
      detalle:
        'Repite MIENTRAS su condición sea verdadera. Nadie sabe de antemano cuántas vueltas van a ser: depende de cuándo se vuelva falsa.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'acumulador',
      tag: 'La caja que crece sola',
      numero: 3,
      titulo: 'Acumular',
      detalle:
        '`total = total + i` guarda en la MISMA caja el valor de antes más uno más. Así se suma una lista entera sin escribir una línea por cada número.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'infinito',
      tag: 'El peligro real de un while',
      numero: 4,
      titulo: 'Bucle infinito',
      detalle:
        'Si nada dentro del while acerca su condición a hacerse falsa, no se detiene solo. El editor lo detecta y para antes de colgar tu navegador — Python de verdad no siempre avisa.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de código',
  ctaDetalle:
    'Nueve encargos: repite con for y range(), suma diez números en una caja que se actualiza sola, cuenta regresivo con while, **provoca un bucle infinito a propósito** y sobrevívelo, sal de un bucle antes de tiempo con break, y decide cuál de tres bucles nunca para solo.',
  assetsPendientes: false,
};

export function EntradaBucles(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaBucles;
