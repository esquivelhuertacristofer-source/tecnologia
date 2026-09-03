'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../n4/estudio/EntradaN4Base';
import { LabCondicionales } from './LabCondicionales';
import { RUTA_N7_PYTHON_1 } from './rutaN7Python1';

/**
 * Entrada de N7 · U «Programación en texto I» · parada 3 «Condicionales».
 *
 * Viene de «Entrada y salida», así que las fichas dan por sabido que un dato
 * tiene tipo y que `input` siempre da texto, y no lo repiten: usan el mismo
 * escenario (una entrada a una atracción) que el globo de aquella clase dejó
 * abierto («comprobarlo se aprende en la parada siguiente»). Registro de
 * secundaria (§30.4): término técnico correcto con su traducción al lado, se
 * explica el porqué y no sólo el qué, refuerzo informativo. Cada cadena está
 * escrita para esta clase.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n7-condicionales-python/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n7-condicionales-python',
  laboratorio: LabCondicionales,
  ruta: RUTA_N7_PYTHON_1,
  parada: 3,
  globo:
    'Hasta ahora tu programa corría igual todas las veces, para cualquiera que lo usara. Un condicional es la manera de decirle a Python: esto, SÓLO SI se cumple algo — y esto otro, si no.',
  arranqueSub:
    'Abres **acceso.py** y decides quién sube a una montaña rusa: con la altura, con el boleto, y con dos condiciones a la vez.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#22d3ee' },
    { etiqueta: 'Operadores', valor: '6', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Cuatro maneras de preguntar',
  fichas: [
    {
      key: 'si-no',
      tag: 'La bifurcación básica',
      numero: 1,
      titulo: 'if / else',
      detalle:
        'Una condición, dos caminos. Si `altura >= 120` es cierta, se cumple lo de adentro; si no, el `else`. Nunca los dos a la vez.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'elif',
      tag: 'Más de dos caminos',
      numero: 2,
      titulo: 'elif',
      detalle:
        'Encadena más preguntas SIN meter un if dentro de otro. Python las revisa de arriba a abajo y se queda en la primera que sea cierta.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'y-o',
      tag: 'Dos condiciones a la vez',
      numero: 3,
      titulo: 'and / or',
      detalle:
        '`and` exige que las DOS sean ciertas; `or` le basta con que UNA lo sea. La misma pregunta, unida de dos formas distintas.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'comparar',
      tag: 'Cómo se pregunta',
      numero: 4,
      titulo: '== y las demás',
      detalle:
        '`==`, `!=`, `>`, `<`, `>=`, `<=` son las seis preguntas que Python sabe hacer. `==` compara valores; un solo `=` guarda uno en una caja — no son lo mismo.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de código',
  ctaDetalle:
    'Nueve encargos: decide con if/else si alcanzas la altura mínima, encadena tres caminos con elif, compara con == y != un boleto, combina dos condiciones con and y con or, y **descubre por qué este editor no acepta «120 <= altura <= 150»** de un tirón — y escríbelo con and, que es como se dice en cualquier lenguaje.',
  assetsPendientes: false,
};

export function EntradaCondicionales(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaCondicionales;
