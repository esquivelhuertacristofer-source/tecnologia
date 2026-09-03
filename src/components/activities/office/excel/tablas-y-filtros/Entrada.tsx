'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaExcel, rutaExcel } from '../comun/rutas';
import { LabTablasYFiltros } from './Lab';

/**
 * Entrada de `of-excel-tablas-y-filtros` (bloques 33 · 34 · 35 · 36).
 *
 * La segunda clase exclusiva del grado Intermedio de Tecnia Hojas: la ruta y
 * la parada salen de `rutaExcel('intermedio')` y
 * `paradaExcel('intermedio', ...)`, **derivadas** de `EJERCICIOS_OFFICE` y no
 * escritas a mano, por la misma razón que ya dejaron escrita
 * `of-excel-buscarx` y `comun/rutas.ts`.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-excel-tablas-y-filtros',
  laboratorio: LabTablasYFiltros,
  ruta: rutaExcel('intermedio'),
  parada: paradaExcel('intermedio', 'of-excel-tablas-y-filtros'),
  globo: 'Un rango pintado a mano no sabe que es una lista. Una tabla, sí.',
  arranqueSub:
    'El comité de padres lleva la cuota de la kermés de fin de cursos: cuarenta alumnos, cuatro grupos, y una lista que ya no cabe en la pantalla. Hoy la conviertes en una tabla de Excel de verdad —con nombre, que sabe dónde acaba y crece sola cuando escribes debajo—, le pones un estilo y una fila de totales que cuenta sólo lo que ves, la filtras por grupo sin borrar ni un dato, descubres por las malas el peligro de filtrar, y la ordenas por varias columnas a la vez. Y para no perderte nunca entre cuarenta filas, clavas la fila de títulos con Inmovilizar.',
  stats: [
    { etiqueta: 'Alumnos', valor: '40', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '13', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Filtrar esconde. No borra.',
  fichas: [
    {
      key: 'crece-sola',
      tag: 'Crear tabla',
      numero: 1,
      titulo: 'Tiene nombre, y sabe dónde acaba',
      detalle:
        'Escribe justo debajo de la última fila de una tabla y la verás crecer sola: el mismo color, el mismo filtro, sin tocar un botón. Un rango pintado a mano nunca se entera de que hay una fila nueva.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'las-dos-cuentas',
      tag: 'Filtrar',
      numero: 2,
      titulo: 'Esconde, no borra',
      detalle:
        'SUMA sigue sumando todas las filas aunque sólo veas tres; la fila de totales de la tabla cuenta SÓLO lo visible. Las dos cuentas, una al lado de otra, son la prueba de que filtrar no toca ni un dato.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'orden-de-prioridad',
      tag: 'Ordenar por varias',
      numero: 3,
      titulo: 'Primero el grupo, luego el nombre',
      detalle:
        'Ordenar por varias columnas es en orden de PRIORIDAD: la primera agrupa, la segunda ordena dentro de cada grupo. Cambiar el orden de las columnas cambia el resultado entero.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'inmovilizar-titulos',
      tag: 'Inmovilizar',
      numero: 4,
      titulo: 'No mueve un dato: mueve lo que puedes leer',
      detalle:
        'Clava la fila de títulos y baja cuarenta filas sin perderte. Inmovilizar no cambia el libro, cambia lo que la ventana deja quieto mientras te desplazas.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Convierte la lista en una tabla que se cuida sola',
  ctaDetalle:
    'Se abre «Cuota de la kermés · 6.º grado.xlsx» con los cuarenta alumnos tal cual llegaron: un rango, sin tabla. Trece encargos. Los nueve botones de hoy están en el panel «Tablas», a la derecha, salvo Inmovilizar, que sigue en Vista → Mostrar. Si te equivocas, deshacer está arriba a la izquierda.',
};

export function EntradaTablasYFiltros(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaTablasYFiltros;

export default EntradaTablasYFiltros;
