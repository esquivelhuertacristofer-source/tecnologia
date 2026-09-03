'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaExcel, rutaExcel } from '../comun/rutas';
import { LabAuditoria } from './Lab';

/**
 * Entrada de `of-excel-auditoria` (bloques 47 · 48).
 *
 * La segunda clase exclusiva del grado Avanzado de Tecnia Hojas: la ruta y la
 * parada salen de `rutaExcel('avanzado')` y `paradaExcel('avanzado', ...)`,
 * **derivadas** de `EJERCICIOS_OFFICE` y no escritas a mano, por la misma
 * razón que ya dejaron escrita `of-excel-datos-limpios` y `comun/rutas.ts`.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-excel-auditoria',
  laboratorio: LabAuditoria,
  ruta: rutaExcel('avanzado'),
  parada: paradaExcel('avanzado', 'of-excel-auditoria'),
  globo: 'Un error no es un fallo del programa: es una pista sobre qué se rompió.',
  arranqueSub:
    'La cooperativa escolar heredó su corte de caja del tesorero del año pasado, y algo no cuadra: en vez de una ganancia en pesos, la hoja enseña #¡REF!. Hoy no vas a adivinar ni a volver a escribir la hoja desde cero: vas a rastrear precedentes para remontar el río, celda por celda, hasta encontrar la fórmula que de verdad está rota —y no está donde el error se ve—. Vas a leer #¡DIV/0! y #¿NOMBRE? como lo que son, pistas y no fallos, vas a rastrear dependientes para saber a quién le afecta un dato antes de tocarlo, y al final vas a tapar un error a lo bruto con SI.ERROR para sentir por qué eso es peligroso, antes de aprender a hacerlo bien.',
  stats: [
    { etiqueta: 'Hojas', valor: '2', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '12', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El error casi nunca está donde se ve',
  fichas: [
    {
      key: 'los-errores-son-pistas',
      tag: 'Leer el error',
      numero: 1,
      titulo: '#¡REF!, #¡DIV/0! y #¿NOMBRE? dicen algo distinto',
      detalle:
        '#¡REF! dice que algo a lo que apuntaba la fórmula ya no existe. #¡DIV/0! dice que FALTA un dato, no que sobre. #¿NOMBRE? dice que hay una palabra que Excel no reconoce. Los tres son pistas, no un programa que falla.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'remontar-el-rio',
      tag: 'Rastrear precedentes',
      numero: 2,
      titulo: 'Un error se propaga',
      detalle:
        'Una celda rota ensucia todo lo que depende de ella, así que el número absurdo del final casi nunca está donde se ve. Rastrear precedentes es remontar el río hasta la fórmula que de verdad está rota.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'a-quien-le-afecta',
      tag: 'Rastrear dependientes',
      numero: 3,
      titulo: 'La otra pregunta: si cambio esto, ¿a quién le afecta?',
      detalle:
        'Antes de tocar un dato heredado, rastrear dependientes contesta lo que evita romper cosas: a qué celdas alimenta directamente lo que estás a punto de cambiar.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'no-se-tapa-sin-mirar',
      tag: 'SI.ERROR',
      numero: 4,
      titulo: 'Tapar un error no es lo mismo que arreglarlo',
      detalle:
        'SI.ERROR hace que la hoja se vea limpia, y eso es justo el peligro: un cero convierte «falta un dato» en «vale cero». Se mira primero, se entiende la causa, y sólo entonces —si hace falta— se tapa con un texto que explica.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Encuentra por qué la hoja miente',
  ctaDetalle:
    'Se abre «Cooperativa escolar · Corte de caja.xlsx» con dos hojas: Ventas y Corte. Doce encargos. Rastrear precedentes y Rastrear dependientes viven en Fórmulas → Auditoría de fórmulas, junto a Mostrar fórmulas: se selecciona una celda y se pulsa el botón, sin cuadro de texto que llenar. SI.ERROR se escribe directo en la barra de fórmulas, como cualquier otra función.',
};

export function EntradaAuditoria(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaAuditoria;

export default EntradaAuditoria;
