'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabFormatoCondicional } from './Lab';

/**
 * Entrada de `n7-formato-condicional` — parada de N7 · «Hoja de cálculo
 * aplicada», y la cuarta clase del grado Intermedio de la sala de Excel.
 *
 * ── LA RUTA SE DERIVA DE SU PROPIA UNIDAD, COMO EN TODA CLASE PRESTADA ──────
 *
 * Igual que `n7-referencias`, `n7-funcion-si` y `n6-funciones-esenciales`: el
 * id es `n7-`, la clase vive en la unidad del nivel 7 y la sala de Excel la
 * muestra desde ahí, así que la ruta —y el número que resalta el CTA— salen
 * de `getUnidad('n7-hoja-de-calculo-aplicada')` y no se escriben a mano
 * (§44.6). No de `excel/comun/rutas.ts`: esos ayudantes derivan de
 * `EJERCICIOS_OFFICE`, que es donde se dan de alta las clases EXCLUSIVAS
 * (`of-`) que no tienen unidad propia. Una clase prestada como ésta ya tiene
 * su lista: la de su propia unidad, con ella incluida.
 */

const RUTA_N7: PasoRuta[] = (getUnidad('n7-hoja-de-calculo-aplicada')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n7-formato-condicional';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabFormatoCondicional,
  ruta: RUTA_N7,
  parada: Math.max(1, RUTA_N7.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo: 'Hoy la hoja se pinta sola. Tú sólo escribes la regla, una vez.',
  arranqueSub:
    'Mismo archivo, con un gasto de última hora y un comité nuevo por descubrir. Antes de tocar un solo botón de formato condicional vas a hacerlo como se hacía hasta hoy: pintar a mano la celda del gasto más caro. En cuanto escribas un gasto todavía más caro vas a ver ese color quedarse quieto, ciego a la novedad —y ahí vas a entender para qué sirve una regla de verdad—. Vas a poner barras, escala de color e iconos sobre el mismo rango y descubrir que cada una contesta una pregunta distinta, hasta que las cuatro juntas dejen de decir nada y tengas que quitar la que sobra. Vas a cazar a quien se apuntó dos veces en una lista de pagos, y vas a resumir una fila entera de números en una sola celda con un minigráfico, sin borrar ni un dato de abajo.',
  stats: [
    { etiqueta: 'Herramientas', valor: '7', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '13', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La regla no cambia el dato, cambia cómo se ve',
  fichas: [
    {
      key: 'la-mano-contra-la-regla',
      tag: 'Mano vs. regla',
      numero: 1,
      titulo: 'Pintar a mano no se entera de nada',
      detalle:
        'Pintas a mano el gasto más caro de hoy, y mañana hay uno más caro que se queda sin pintar: tú decidiste una vez, mirando un momento. Una regla, en cambio, vigila: escribe un gasto nuevo y se pinta solo, sin que vuelvas a tocar nada.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'tres-preguntas-distintas',
      tag: 'Barras · Escala · Iconos',
      numero: 2,
      titulo: 'Cada una contesta algo distinto',
      detalle:
        'Barras miden cuánto. Escala de color enseña el mapa completo, de lo más bajo a lo más alto. Iconos clasifican en tres cajones. No son tres estilos del mismo botón: puestas las tres juntas sobre el mismo rango, unas se tapan a otras y hay que decidir cuál se queda.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'duplicados-limpieza',
      tag: 'Destacar duplicados',
      numero: 3,
      titulo: 'Herramienta de limpieza, no decoración',
      detalle:
        'Sirve para cazar a quien se apuntó dos veces en una lista larga —de pagos, de inscritos, de lo que sea—. Aquí sólo lo ves resaltado; encontrarlo es la mitad del trabajo, y en doscientos nombres es la mitad que un ojo no hace solo.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'minigrafico-cambio',
      tag: 'Minigráficos',
      numero: 4,
      titulo: 'Resume una fila, y tapa el número',
      detalle:
        'Un minigráfico mete la forma de toda una fila dentro de una sola celda. Es un cambio, no una mejora: ganas ver la tendencia de un vistazo y pierdes el número exacto de esa celda —el dato de abajo, en las otras celdas, sigue intacto.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre la hoja de los gastos',
  ctaDetalle:
    'Se abre «Gastos de la salida del salón.xlsx» con la tabla de gastos de siempre y un comité nuevo por descubrir. Trece encargos. Barras, escala de color e iconos, destacar y minigráficos viven en el panel de la derecha —el mismo cuadro que en Excel de verdad pide la comparación o el rango—, y cada regla que apliques aparece en su lista con una ✕ para quitarla sin tocar las demás.',
};

export function EntradaFormatoCondicional(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaFormatoCondicional;

export default EntradaFormatoCondicional;
