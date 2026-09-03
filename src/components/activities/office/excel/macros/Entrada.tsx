'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaExcel, rutaExcel } from '../comun/rutas';
import { LabMacros } from './Lab';

/**
 * Entrada de `of-excel-macros` (bloques 55 · 56).
 *
 * La clase por la que se tomó la decisión fundacional de todo el motor de
 * Tecnia Hojas: «un comando es un dato» (§45.6, la cabecera de
 * `comandos.ts`), escrita el primer día con dos clases construidas y
 * veintitrés por delante. Sin esa decisión, esta clase —grabar la lista
 * exacta de lo que el alumno hizo y volver a aplicarla— no se podría
 * construir hoy sin reescribir el motor entero. La ruta y la parada salen de
 * `rutaExcel('avanzado')` y `paradaExcel('avanzado', ...)`, **derivadas** de
 * `EJERCICIOS_OFFICE` y no escritas a mano, la misma disciplina que ya dejó
 * `of-excel-datos-limpios` y `comun/rutas.ts`.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-excel-macros',
  laboratorio: LabMacros,
  ruta: rutaExcel('avanzado'),
  parada: paradaExcel('avanzado', 'of-excel-macros'),
  globo: 'Una macro es la lista de lo que hiciste, guardada.',
  arranqueSub:
    'El comité de materiales reparte una hoja nueva cada semana con lo que se compró, y alguien tiene que dejarla presentable antes de la junta: encabezados en negrita con fondo, los importes en moneda, el Total en negrita. Ocho pasos, exactamente los mismos, cada semana. Hoy los vas a dar a mano una sola vez —mientras una grabadora apunta cada cosa que haces, hasta el error de color que vas a cometer a propósito y la corrección que le sigue—, y vas a leer esa lista en español, línea por línea. Después la vas a ejecutar y vas a comprobar algo que sólo se entiende jugándolo: cuando la hoja crece, la macro no se entera. Vas a verla comerse el importe de un concepto nuevo por ir exactamente a la celda donde la grabaste. Vas a asignarla a un botón, y vas a cerrar entendiendo qué es de verdad un .xlsm —un archivo que trae órdenes, no sólo datos— y por qué Excel pregunta antes de dejarlo ejecutar lo que trae.',
  stats: [
    { etiqueta: 'Conceptos', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '11', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'No es magia: es un cuaderno',
  fichas: [
    {
      key: 'la-lista-guardada',
      tag: 'Grabar',
      numero: 1,
      titulo: 'La lista de lo que hiciste, no de lo que querías',
      detalle:
        'Una grabadora no adivina tu intención: apunta cada acción, tecla por tecla. Si te equivocas y lo corriges mientras grabas, el error Y el arreglo quedan los dos en la lista — vas a comprobarlo con tus propios ojos, leyendo tu propia macro.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'repite-no-adivina',
      tag: 'Ejecutar',
      numero: 2,
      titulo: 'Repite lo que hiciste, no lo que hoy querrías',
      detalle:
        'Cada gesto grabado lleva su celda escrita, fija, para siempre — como un $ que nadie pidió. Si la hoja creció desde que grabaste, la macro no se entera: sigue yendo exactamente donde siempre, y puede comerse un dato nuevo en el camino.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'nombre-no-copia',
      tag: 'Asignar',
      numero: 3,
      titulo: 'Un botón guarda un nombre, no una copia',
      detalle:
        'Asignar una macro a un botón no le pega la lista de gestos: le pone el NOMBRE. El botón lee la macro en vivo cada vez que se pulsa, así que si la macro cambia —o se borra— el botón se entera solo.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'trae-ordenes-dentro',
      tag: '.xlsm',
      numero: 4,
      titulo: 'Un archivo que trae órdenes, no sólo datos',
      detalle:
        '«Habilitar macros» significa una sola cosa: dejar que este archivo ejecute lo que trae dentro, aunque no sepas qué es. Por eso Excel pregunta, por eso existe la barra amarilla, y por eso no se habilita un archivo de quien no conoces.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Graba tu primera macro',
  ctaDetalle:
    'Se abre «Comité de materiales · Reporte semanal.xlsx» con cinco conceptos, sin ninguna pinta encima. Once encargos. El panel «Macros», a la derecha, tiene tres partes: Grabar (nombre + Grabar/Detener), la lista de tus macros —con «Ver los pasos» para leerlas en español— y Asignar a un botón. Negrita, Color de relleno, Moneda e Insertar filas están donde siempre, en Inicio y en Datos.',
};

export function EntradaMacros(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaMacros;

export default EntradaMacros;
