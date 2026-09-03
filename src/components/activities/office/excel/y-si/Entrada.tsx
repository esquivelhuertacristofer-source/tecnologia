'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaExcel, rutaExcel } from '../comun/rutas';
import { LabYSi } from './Lab';

/**
 * Entrada de `of-excel-y-si` (bloque 57).
 *
 * La cuarta clase exclusiva del grado Avanzado de Tecnia Hojas: la ruta y la
 * parada salen de `rutaExcel('avanzado')` y `paradaExcel('avanzado', ...)`,
 * **derivadas** de `EJERCICIOS_OFFICE` y no escritas a mano, por la misma
 * razón que ya dejaron escrita `of-excel-datos-limpios` y `comun/rutas.ts`.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-excel-y-si',
  laboratorio: LabYSi,
  ruta: rutaExcel('avanzado'),
  parada: paradaExcel('avanzado', 'of-excel-y-si'),
  globo: 'Hasta hoy pones datos y sale un resultado. Hoy pides un resultado y sale el dato.',
  arranqueSub:
    'El comité ya apartó el camión para la salida a Teotihuacán, y al sumar todo faltan 3.000 pesos: la aportación de siempre no alcanza. Hasta hoy esto se resolvía tanteando a mano —subes la cuota, recalculas, te pasas, bajas otra vez—. Hoy vas a pedirle a la hoja el resultado que hace falta y dejar que ELLA encuentre el dato: es la primera vez en toda la sala que la hoja se usa al revés. Vas a provocar sus tres formas de fallar —una celda objetivo que no es fórmula, una celda que se mueve y en realidad es una fórmula, y el error número uno, mover una celda que no influye en el objetivo— y vas a comprobar que hay preguntas sin respuesta. Después vas a guardar varias versiones de la misma pregunta con nombre —35 alumnos, 40 alumnos, el camión más caro— para comparar sin perder ninguna, y vas a ver el peligro de aplicar un escenario sobre una celda que tiene su propia fórmula.',
  stats: [
    { etiqueta: 'Encargos', valor: '12', acento: '#f5a524' },
    { etiqueta: 'Escenarios', valor: '2', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Dices el resultado. La hoja encuentra el dato.',
  fichas: [
    {
      key: 'hacia-atras',
      tag: 'Buscar objetivo',
      numero: 1,
      titulo: 'La única clase que usa la hoja al revés',
      detalle:
        'Hasta hoy pones datos y sale un resultado. Buscar objetivo pide el resultado y encuentra el dato: prueba, mide y corrige, porque una hoja de cálculo no sabe hacer álgebra.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'cadena-de-formulas',
      tag: 'Las tres formas de fallar',
      numero: 2,
      titulo: 'Sólo funciona con fórmulas de verdad',
      detalle:
        'La celda objetivo tiene que guardar una regla, y la celda que se mueve tiene que ser un número escrito a mano. Y si esa celda no influye en el objetivo, el programa lo caza antes de intentarlo — el error número uno.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'no-siempre-hay-respuesta',
      tag: 'Cuando no converge',
      numero: 3,
      titulo: 'No es un defecto del programa',
      detalle:
        'Algunos resultados sencillamente no se pueden alcanzar. El programa lo dice en vez de inventarse un número, y el libro se queda exactamente como estaba.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'escenarios-comparan',
      tag: 'Escenarios',
      numero: 4,
      titulo: 'Comparar sin perder lo de antes',
      detalle:
        'Un escenario es una foto con nombre de varias celdas. Sirve para no teclear encima y olvidar qué había — pero aplicarlo sobre una celda con fórmula la sustituye por un número: se pierde la regla.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Pregúntale a la hoja, en vez de tantear',
  ctaDetalle:
    'Se abre «Salida a Teotihuacán · Presupuesto.xlsx» con el camión, la aportación y los gastos del viaje. Doce encargos. Los cuatro botones de hoy viven en el panel «Y si», a la derecha: los tres huecos de Buscar objetivo —celda objetivo, valor, celda que cambia— y la lista de escenarios guardados, con Aplicar y Borrar.',
};

export function EntradaYSi(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaYSi;

export default EntradaYSi;
