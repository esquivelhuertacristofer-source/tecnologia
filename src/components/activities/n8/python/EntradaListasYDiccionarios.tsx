'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { LabListasYDiccionarios } from './LabListasYDiccionarios';
import { RUTA_N8_PYTHON_2 } from './rutaN8Python2';

/**
 * Entrada de N8 · U «Programación en texto II» (n8-python-2) · parada 1
 * «Listas y diccionarios».
 *
 * Viene de `n7-bucles-python` (última parada construida de N7 · U2), así que
 * las fichas dan por sabido `for`, `while` y que un error se lee, no se
 * evita — y no lo repiten. Registro de secundaria (§30.4): término técnico
 * correcto con su traducción al lado, se explica el porqué y no sólo el
 * qué, refuerzo informativo. Cada cadena está escrita para esta clase.
 *
 * La cuarta ficha («Una lista es una referencia») no tiene encargo propio en
 * el laboratorio: `valores.ts` la señala como contenido de esta clase (su
 * comentario de la decisión de modelo (3)), pero se entiende leyéndola y no
 * hacía falta ejecutarla, así que vive aquí en vez de ocupar un onceavo
 * encargo. El dato de `mochila[:]` como copia de verdad está comprobado en
 * `sintaxis.ts` (`sufijos()`) antes de escribirlo, no adivinado.
 *
 * El video se grabó y se publicó el 2-sep-2026:
 * `public/assets/actividades/n8-listas-y-diccionarios/video-explicativo.mp4`
 * ya existe y `assetsPendientes` bajó a `false`, así que la entrada enseña el
 * cubrepantalla primero y el reproductor después. OJO si escribes pruebas:
 * con el video puesto, el primer `<button>` del documento ya no es el CTA
 * sino el de la portada, así que no lo busques por posición.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n8-listas-y-diccionarios',
  laboratorio: LabListasYDiccionarios,
  ruta: RUTA_N8_PYTHON_2,
  parada: 1,
  globo:
    'Hasta ahora cada dato tuyo vivía solo, en su propia variable. Las listas y los diccionarios guardan varios datos juntos, en una sola caja — y hoy vas a usar los dos.',
  arranqueSub:
    'Abres **mochila.py** y guardas varios datos en una lista y en un diccionario, hasta provocar un **IndexError de verdad** — y corregirlo.',
  stats: [
    { etiqueta: 'Encargos', valor: '10', acento: '#22d3ee' },
    { etiqueta: 'Estructuras', valor: '2', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Dos formas de guardar varios datos',
  fichas: [
    {
      key: 'lista',
      tag: 'Datos en orden, por posición',
      numero: 1,
      titulo: 'Listas',
      detalle:
        'Una lista guarda varios datos en una sola caja, en el orden en que los escribiste. `mochila[0]` es el primero — en Python las posiciones empiezan en 0, no en 1.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'diccionario',
      tag: 'Datos por nombre, no por número',
      numero: 2,
      titulo: 'Diccionarios',
      detalle:
        "Un diccionario (`dict`) guarda cada dato bajo una CLAVE, no bajo una posición: `alumno['nombre']` pide el dato por lo que significa, sin que importe en qué orden se guardó.",
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'error-real',
      tag: 'Se lee, no se evita',
      numero: 3,
      titulo: 'IndexError y KeyError',
      detalle:
        'Pedir una posición o una clave que no existe **no rompe el editor**: te dice exactamente qué pediste y qué sí existe. Hoy vas a provocar uno a propósito, leerlo con calma y corregirlo.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'referencia',
      tag: 'El truco que confunde a todos al inicio',
      numero: 4,
      titulo: 'Una lista es una referencia',
      detalle:
        '`otra = mochila` no copia la lista: las dos variables apuntan a la MISMA mochila, y si `otra` cambia, `mochila` también. Una copia de verdad se hace con una rebanada completa: `mochila[:]`.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de código',
  ctaDetalle:
    'Diez encargos: crea una lista y una recórrela con for, agrega con append(), recorta con una rebanada, **provoca un IndexError a propósito** y corrígelo, crea un diccionario, recórrelo con .items() y comprueba una clave con in.',
  assetsPendientes: false,
};

export function EntradaListasYDiccionarios(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaListasYDiccionarios;
