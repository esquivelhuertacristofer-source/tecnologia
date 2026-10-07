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
 *
 * 6-oct-2026 (§69.17): la clase pasó al juez de programas; las fichas ya no
 * traen código y las cifras cuentan los encargos nuevos.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n7-bucles-python',
  laboratorio: LabBucles,
  ruta: RUTA_N7_PYTHON_1,
  parada: 4,
  globo:
    'Un programa que se cumple de arriba abajo una sola vez no alcanza para casi nada. Los bucles son la manera de decirle a Python: esto, otra vez.',
  arranqueSub:
    'Abres **entrenamiento.py** y escribes cuatro programas que repiten lo que dice el dato. Un juez los prueba con cero vueltas, con una y con doce.',
  stats: [
    { etiqueta: 'Encargos', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Problemas con juez', valor: '4', acento: '#fbbf24' },
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
        'Repite una vez por cada número de un rango, y el rango puede salir de un dato: **cuántas vueltas lo decide quien teclea**, no quien escribe el programa.',
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
        'Una caja que nace una sola vez y **crece en cada vuelta** con lo de esa vuelta. Así se suma una lista entera sin escribir una línea por cada número.',
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
    'Cuatro problemas con juez sobre el entrenamiento de la carrera, un experimento donde **provocas un bucle infinito a propósito**, y una pregunta sobre el while que pidió un dato de más.',
  assetsPendientes: false,
};

export function EntradaBucles(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaBucles;
