'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../n4/estudio/EntradaN4Base';
import { LabVariablesYTipos } from './LabVariablesYTipos';
import { RUTA_N7_PYTHON_1 } from './rutaN7Python1';

/**
 * Entrada de N7 · U2 «Programación en texto I» · parada 1 «Variables y tipos».
 *
 * Registro de secundaria (§30.4): término técnico correcto con su traducción
 * al lado, se explica el porqué y no sólo el qué, y refuerzo informativo. Cada
 * cadena está escrita para esta clase; ninguna viene heredada de la entrada de
 * la que se copió el molde.
 *
 * El video y las láminas no existen todavía (`assetsPendientes`): la campaña
 * de videos sigue pausada desde el 1-ago-2026.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n7-variables-y-tipos',
  laboratorio: LabVariablesYTipos,
  ruta: RUTA_N7_PYTHON_1,
  parada: 1,
  globo:
    'Un dato no es sólo su valor: también es su tipo. De eso depende lo que Python te deja hacer con él, y por qué a veces se niega.',
  arranqueSub:
    'Abres **tipos.py** y clasificas cuatro datos distintos. Después los mezclas a propósito, hasta que el programa se rompe.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#22d3ee' },
    { etiqueta: 'Tipos', valor: '4', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Los cuatro tipos básicos',
  fichas: [
    {
      key: 'enteros',
      tag: 'Números sin decimales',
      numero: 1,
      titulo: 'int',
      detalle:
        'Un número entero: `13`, `0`, `-4`. Es lo que sale al contar cosas, y con él las cuentas dan resultados exactos.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'flotantes',
      tag: 'Números con decimales',
      numero: 2,
      titulo: 'float',
      detalle:
        'Lleva punto decimal: `1.62`, `5.0`. **La división `/` siempre devuelve float**, aunque el resultado sea redondo: por eso `10 / 2` escribe `5.0` y no `5`.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'cadenas',
      tag: 'Texto',
      numero: 3,
      titulo: 'str',
      detalle:
        'Lo que va entre comillas: `"Bit"`, y también `"13"`. Un número **escrito entre comillas no es un número**: es un texto que se le parece.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'booleanos',
      tag: 'Verdadero o falso',
      numero: 4,
      titulo: 'bool',
      detalle:
        'Sólo tiene dos valores, `True` y `False`, con mayúscula y sin comillas. Es el tipo con el que decide un `if`.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de código',
  ctaDetalle:
    'Nueve encargos: guarda cuatro datos, pregúntale su tipo a Python con `type()`, **mézclalos a propósito** hasta que reviente de dos maneras distintas, y decide tú cada conversión con `str()` y con `int()`.',
  assetsPendientes: false,
};

export function EntradaVariablesYTipos(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaVariablesYTipos;
