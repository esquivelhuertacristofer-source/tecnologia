'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaExcel, rutaExcel } from '../comun/rutas';
import { LabBuscarx } from './Lab';

/**
 * Entrada de `of-excel-buscarx` (temario §45.2, bloques 26 · 27 · 28).
 *
 * La primera clase exclusiva del grado Intermedio de Tecnia Hojas: la ruta y la
 * parada salen de `rutaExcel('intermedio')` y `paradaExcel('intermedio', ...)`,
 * **derivadas** de `EJERCICIOS_OFFICE` y no escritas a mano (§44.6, la misma
 * razón que ya se dejó escrita en `comun/rutas.ts`).
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-excel-buscarx',
  laboratorio: LabBuscarx,
  ruta: rutaExcel('intermedio'),
  parada: paradaExcel('intermedio', 'of-excel-buscarx'),
  globo: 'Copia un precio a mano y ya está viejo. Hoy dejas que dos tablas se hablen.',
  arranqueSub:
    'Un mes después de la salida: hay que comprar material para el viaje y la papelería mandó su lista de precios en otra hoja del mismo archivo. Copias el primer precio a mano, en veinte segundos, y funciona — hasta que la papelería sube sus precios y ese número se queda mintiendo sin que nadie te avise. Hoy vas a traer los ocho precios con BUSCARX en vez de copiarlos, a provocar sus dos errores más comunes a propósito, y a cazar con LARGO un espacio invisible que hace que un dato que SÍ está en la lista no se encuentre. Y de paso vas a partir una lista de nombres que llegó pegada —matrícula, apellidos y nombre, todo junto— y volverla a armar decente.',
  stats: [
    { etiqueta: 'Productos', valor: '14', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '13', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Traer el dato, no copiarlo',
  fichas: [
    {
      key: 'tres-huecos',
      tag: 'BUSCARX',
      numero: 1,
      titulo: 'Qué busco, dónde, qué me traigo',
      detalle:
        'BUSCARX lleva tres huecos y se leen en ese orden: el dato que busco, la columna donde lo busco y la columna que quiero traerme. Cuando la papelería sube un precio, la celda se entera sola — un número copiado a mano nunca sabe de dónde vino.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'na-no-es-fallo',
      tag: 'El error',
      numero: 2,
      titulo: '#N/A es una respuesta, no un castigo',
      detalle:
        '#N/A quiere decir «no está», y no es un fallo del programa: es lo que contesta una búsqueda honesta cuando el dato no aparece en la lista. Un programa que se inventa un número cuando no lo encuentra es mucho más peligroso que uno que se queja.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'largo-caza',
      tag: 'El dato sucio',
      numero: 3,
      titulo: 'Un espacio no se ve, y hace fallar todo',
      detalle:
        'Dos textos se pueden ver idénticos en la pantalla y no serlo: uno lleva un espacio de más al final. Para la hoja son dos cosas distintas. LARGO cuenta las letras que el ojo no ve, y así se caza el dato sucio más común del mundo.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'partir-y-juntar',
      tag: 'El texto',
      numero: 4,
      titulo: 'Partir lo pegado, juntarlo bien',
      detalle:
        'IZQUIERDA y DERECHA cortan un texto por sus extremos; EXTRAE saca un trozo de en medio. Y para volver a juntarlo, UNIRCADENAS hace lo que CONCAT no sabe: pone el separador una sola vez y salta lo que está vacío.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Haz que las tablas se hablen',
  ctaDetalle:
    'Se abre «Gastos de la salida del salón.xlsx» con dos hojas nuevas: la lista de compras y la de precios de la papelería. Trece encargos. Toda fórmula empieza por `=`; para nombrar una celda de otra hoja se escribe el nombre de la hoja, un signo de admiración y la celda: Precios!A4. Para arreglar una fórmula ya escrita, doble clic en su celda o F2. Si te equivocas, deshacer está arriba a la izquierda y no rompe nada.',
};

export function EntradaBuscarx(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaBuscarx;

export default EntradaBuscarx;
