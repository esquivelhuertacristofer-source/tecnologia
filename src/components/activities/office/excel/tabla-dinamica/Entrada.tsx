'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaExcel, rutaExcel } from '../comun/rutas';
import { LabTablaDinamica } from './Lab';

/**
 * Entrada de `of-excel-tabla-dinamica` (bloques 49 · 50).
 *
 * La ruta y la parada salen de `rutaExcel('avanzado')` y
 * `paradaExcel('avanzado', ...)`, **derivadas** de `EJERCICIOS_OFFICE` y no
 * escritas a mano — la misma razón que dejaron escrita `of-excel-datos-limpios`
 * y `comun/rutas.ts`: cinco de las seis entradas de PowerPoint acabaron
 * mintiendo por copiar la lista.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-excel-tabla-dinamica',
  laboratorio: LabTablaDinamica,
  ruta: rutaExcel('avanzado'),
  parada: paradaExcel('avanzado', 'of-excel-tabla-dinamica'),
  globo: 'Trescientas ventas que nadie puede leer. Cinco renglones que las contestan. Cero fórmulas.',
  arranqueSub:
    'La cooperativa escolar apuntó todas sus ventas del semestre: trescientos renglones con fecha, mes, categoría, producto, cantidad, precio e importe. La maestra pregunta lo que preguntaría cualquiera —«¿en qué se vendió más?»— y la respuesta no está escrita en ninguna parte: está repartida en trescientas filas. Hoy vas a resumirlas en cinco renglones sin escribir una sola fórmula, que es la primera vez en todo el temario. Vas a mover un campo de filas a columnas y a comprobar que eso no cambia el dibujo, cambia la pregunta. Vas a resumir el mismo cruce con suma, con cuenta y con promedio y a ver que las tres conclusiones se contradicen sin que ninguna mienta. Y vas a descubrir lo que casi nadie sabe: que una tabla dinámica no se entera sola de que cambiaste un dato.',
  stats: [
    { etiqueta: 'Encargos', valor: '13', acento: '#f5a524' },
    { etiqueta: 'Ventas', valor: '300', acento: '#22d3ee' },
    { etiqueta: 'Fórmulas', valor: '0', acento: '#34d399' },
  ],
  letrero: 'Trescientas filas. Cinco renglones. Ninguna fórmula.',
  fichas: [
    {
      key: 'sin-formulas',
      tag: 'Lo nuevo',
      numero: 1,
      titulo: 'La primera vez que resumes sin un «=»',
      detalle:
        'Con SUMAR.SI sacarías lo mismo, con una diferencia: para escribirlo hay que saber de antemano qué categorías existen. Una dinámica las descubre sola, mirando tus datos.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'mover-es-preguntar',
      tag: 'Filas y columnas',
      numero: 2,
      titulo: 'Mover un campo cambia la pregunta',
      detalle:
        'El mismo campo en filas hace una lista; en columnas hace un cruce. No es el mismo dibujo con otra forma: es otra pregunta contestada con los mismos datos.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'tres-resumenes',
      tag: 'Suma, cuenta, promedio',
      numero: 3,
      titulo: 'Tres resúmenes, tres conclusiones',
      detalle:
        'La categoría que más dinero deja no es la que más veces se vende. Los dos números salen de las mismas filas y ninguno miente: lo que cambia es qué preguntaste.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'no-se-entera',
      tag: 'Actualizar',
      numero: 4,
      titulo: 'La dinámica no se entera sola',
      detalle:
        'Cambia un dato del origen y el resumen sigue enseñando el número de antes. No está roto: una dinámica mira la copia que se llevó la última vez. Por eso existe el botón.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Pregúntale a trescientas filas de una vez',
  ctaDetalle:
    'Se abre «Cooperativa escolar · Ventas del semestre.xlsx» con las trescientas ventas del semestre. Trece encargos. Todo se hace desde el panel «Tabla dinámica», a la derecha: el botón grande de Actualizar, tus siete campos con sus botones —Filas, Columnas, Valores, Quitar—, cómo se resume cada uno, y el cuadro de Agrupar para meter un campo dentro de otro.',
};

export function EntradaTablaDinamica(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaTablaDinamica;

export default EntradaTablaDinamica;
