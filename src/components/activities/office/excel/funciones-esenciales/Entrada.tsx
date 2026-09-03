'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabFuncionesEsenciales } from './Lab';

/**
 * Entrada de `n6-funciones-esenciales` — parada de N6 · «Hoja de cálculo II»,
 * y la tercera clase del grado Intermedio de la sala de Excel.
 *
 * ── LA RUTA SE DERIVA DE SU PROPIA UNIDAD, COMO EN TODA CLASE PRESTADA ──────
 *
 * Igual que `n5-tus-primeras-formulas` y que `n7-referencias`/`n7-funcion-si`:
 * el id es `n6-`, la clase vive en la unidad del nivel 6 y la sala de Excel la
 * muestra desde ahí, así que la ruta —y el número que resalta el CTA— salen de
 * `getUnidad('n6-hoja-de-calculo-2')` y no se escriben a mano (§44.6). No de
 * `comun/rutas.ts`: esos ayudantes derivan de `EJERCICIOS_OFFICE`, que es
 * donde se dan de alta las clases EXCLUSIVAS (`of-`) que no tienen unidad
 * propia — `of-excel-buscarx` es la única ahí dentro. Una clase prestada como
 * ésta ya tiene su lista: la de su propia unidad, con ella incluida.
 */

const RUTA_N6: PasoRuta[] = (getUnidad('n6-hoja-de-calculo-2')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n6-funciones-esenciales';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabFuncionesEsenciales,
  ruta: RUTA_N6,
  parada: Math.max(1, RUTA_N6.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo: 'Hoy le preguntas cosas a una lista larga sin partirla en pedazos.',
  arranqueSub:
    'Mismo archivo, tres semanas antes de la salida a Teotihuacán. La tesorera le puso categoría a cada gasto —transporte, entradas, comida, material— y hoy no vas a partir esa tabla en cuatro para saber cuánto se fue en cada cosa: SUMAR.SI, CONTAR.SI y PROMEDIO.SI suman, cuentan y reparten sólo lo que cumple una condición. Vas a provocar a propósito el error de escribir el criterio sin comillas, a descubrir que hasta un criterio con un número lleva comillas si trae un signo de comparación, y a cazar un rango que se corre una fila y da un número que se ve bien y está mal, sin que nada te avise. Después te mudas a la hoja de los pagos y escribes =HOY(): sale un número de cinco cifras, no una fecha, y ahí vas a entender por qué. La vistes de fecha, le quitas el mismo disfraz a la fecha de la salida, y las restas para saber cuántos días faltan.',
  stats: [
    { etiqueta: 'Funciones', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '12', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Pregúntale a la lista, no la partas',
  fichas: [
    {
      key: 'suma-con-condicion',
      tag: 'SUMAR.SI',
      numero: 1,
      titulo: 'Suma sólo lo que cumple',
      detalle:
        'SUMA suma todo lo que le des. SUMAR.SI mira un rango, decide renglón por renglón si cumple una condición, y sólo entonces suma lo que le corresponde en OTRO rango. Con una sola columna de categoría y una fórmula, sacas el total de cada una sin partir la tabla.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'comillas-con-numero',
      tag: 'Comillas',
      numero: 2,
      titulo: 'Hasta un número lleva comillas',
      detalle:
        'Un criterio de texto va entre comillas, y eso lo sabe medio salón. Lo que casi nadie sabe es que ">300" también las lleva, aunque adentro sólo haya un número: en cuanto aparece un signo de comparación deja de ser un número suelto y pasa a ser una instrucción, y las instrucciones se escriben en texto.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'rango-desalineado',
      tag: 'El peligro que no avisa',
      numero: 3,
      titulo: 'Un rango corrido no se rompe: miente',
      detalle:
        'Si el rango del criterio y el de la suma no empiezan y terminan en el mismo renglón, la fórmula sigue funcionando: empareja cada categoría con el importe equivocado y entrega un número que se ve completamente normal. Ningún error, ninguna alarma — sólo revisar los dos rangos con cuidado.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'fecha-numero-disfrazado',
      tag: 'HOY y AHORA',
      numero: 4,
      titulo: 'Una fecha es un número disfrazado',
      detalle:
        'Escribes =HOY() y sale un número de cinco cifras, no un día. Le pones el formato Fecha encima y se disfraza; se lo quitas a la fecha de la salida y aparece el mismo tipo de número. Por eso restar dos fechas da días: por dentro son dos números, y restar números es aritmética normal.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre la hoja de los gastos',
  ctaDetalle:
    'Se abre «Gastos de la salida del salón.xlsx» con la tabla de gastos ya categorizada. Doce encargos. Los criterios de texto van entre comillas, y los que llevan un signo de comparación —como ">300"— también, aunque adentro sólo haya un número. El formato de una celda se cambia desde «Formato de número», en Inicio → Número. Para arreglar una fórmula ya escrita, doble clic en su celda o F2.',
};

export function EntradaFuncionesEsenciales(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaFuncionesEsenciales;

export default EntradaFuncionesEsenciales;
