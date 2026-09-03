'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../n4/estudio/EntradaN4Base';
import { LabRetosPython } from './LabRetosPython';
import { RUTA_N7_PYTHON_1 } from './rutaN7Python1';

/**
 * Entrada de N7 · U2 «Programación en texto I» · parada 5 «Retos guiados», el
 * cierre de la unidad.
 *
 * Las fichas dan por sabidas las cuatro paradas anteriores —tipo y conversión,
 * input/print, if/elif/else, for/while— y no repiten ninguna: nombran qué
 * combina cada uno de los tres retos. Registro de secundaria (§30.4): término
 * técnico correcto con su traducción al lado, se explica el porqué y no sólo el
 * qué, refuerzo informativo. Cada cadena está escrita para esta clase.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n7-retos-python/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n7-retos-python',
  laboratorio: LabRetosPython,
  ruta: RUTA_N7_PYTHON_1,
  parada: 5,
  globo:
    'Ya sabes guardar datos, preguntar y contestar, decidir con condiciones y repetir con bucles. Hoy no aprendes nada nuevo: lo combinas todo en tres programas completos.',
  arranqueSub:
    'Abres **retos.py** y resuelves tres programas completos, uno detrás de otro: un precio que decide solo, un conteo que se clasifica solo, y un candado que se abre —o se bloquea— solo.',
  stats: [
    { etiqueta: 'Encargos', valor: '10', acento: '#22d3ee' },
    { etiqueta: 'Retos', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Tres programas, las cuatro herramientas',
  fichas: [
    {
      key: 'reto1',
      tag: 'Reto 1',
      numero: 1,
      titulo: 'El precio justo',
      detalle:
        'Pides datos con `input`, los conviertes con `float()` e `int()`, y decides un descuento con `if`/`elif`/`else` sobre un total que calculaste tú.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'reto2',
      tag: 'Reto 2',
      numero: 2,
      titulo: 'El conteo de aprobados',
      detalle:
        'Un `for` acumula dos cosas a la vez —cuántos aprobaron y la suma total— y un `elif` clasifica el promedio que tu propio programa calculó.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'reto3',
      tag: 'Reto 3',
      numero: 3,
      titulo: 'El candado del casillero',
      detalle:
        'Un `while` con `input` pregunta el código mientras te queden intentos; `break` lo corta en el momento justo en que aciertas.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de código',
  ctaDetalle:
    'Diez encargos y tres programas completos: decide un descuento con datos que tú mismo escribas, cuenta y clasifica un grupo con un solo for, y abre —o bloquea— un candado con while, input y break. Cierras la unidad combinando las cuatro herramientas que ya sabes usar.',
  assetsPendientes: false,
};

export function EntradaRetosPython(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaRetosPython;
