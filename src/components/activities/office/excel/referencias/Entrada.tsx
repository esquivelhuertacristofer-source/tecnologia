'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabReferencias } from './Lab';

/**
 * Entrada de `n7-referencias` — parada de N7 · «Hoja de cálculo aplicada», y la
 * sexta clase de la sala de Excel.
 *
 * ── LA RUTA SE DERIVA ───────────────────────────────────────────────────────
 *
 * Igual que en las clases anteriores de esta sala y por lo mismo (§44.6): la
 * ruta y la parada salen de `getUnidad('n7-hoja-de-calculo-aplicada')`, que es
 * donde esta clase se da de alta, en vez de escribirse a mano.
 */

const RUTA_N7: PasoRuta[] = (getUnidad('n7-hoja-de-calculo-aplicada')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n7-referencias';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabReferencias,
  ruta: RUTA_N7,
  parada: Math.max(1, RUTA_N7.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo: 'Copia una fórmula y algo se mueve que no debería. Hoy aprendes a pararlo.',
  arranqueSub:
    'Mismo archivo, un mes después de la salida. La papelería cotizó los recuerdos del salón sin IVA, y el IVA está en una sola celda de la hoja. Vas a escribir tu primera fórmula del IVA y a rellenarla hacia abajo tal y como hiciste siempre… y esta vez sale mal: un cero, un error y un número enorme que no avisa de nada. Ahí vas a entender qué es el `$`, la primera cosa de esta sala que no se puede explicar contándola — hay que romper la hoja primero. Vas a clavar una celda, clavar sólo la mitad para una tabla de doble entrada, y ponerle nombre a un dato para que tus fórmulas se lean en vez de descifrarse.',
  stats: [
    { etiqueta: 'Recuerdos', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '13', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El `$` manda al copiar',
  fichas: [
    {
      key: 'sin-dolar-el-desastre',
      tag: 'La demostración',
      numero: 1,
      titulo: 'Primero se rompe, y se ve',
      detalle:
        'Rellenas una fórmula del IVA sin `$` y salen dos ceros, dos errores y un número que se ve perfectamente normal y está mal. Ese último es el peligroso: nadie lo revisa porque no grita. El `$` no se explica de entrada — se necesita ver el desastre primero.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'que-se-mueve-que-no',
      tag: 'El ancla',
      numero: 2,
      titulo: 'Una fórmula, dos mitades',
      detalle:
        'Al copiar una fórmula, unas referencias tienen que corregirse solas —el importe de cada renglón— y otras tienen que quedarse quietas —el IVA, que es el mismo para todos—. El `$` es la manera de decirle a la copiadora cuál es cuál.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'medio-dolar',
      tag: 'Las dos direcciones',
      numero: 3,
      titulo: 'Medio `$` y medio no',
      detalle:
        'En una tabla que se rellena hacia abajo y hacia los lados a la vez, un `$` entero clava demasiado. `$B15` deja libre la fila y `C$14` deja libre la columna: cada mitad protege una cosa distinta, y un ancla a medias que acierta en una dirección es peor que ninguna, porque no la revisa nadie.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'un-nombre-con-memoria',
      tag: 'El nombre',
      numero: 4,
      titulo: 'Un `$` que se lee',
      detalle:
        '`=D8*IVA` dice lo mismo que `=D8*$E$2` y se entiende sin descifrarla. Un rango con nombre es un `$` con memoria: no se mueve al copiarlo y encima dice de qué habla. Y sigue a su dato aunque el dato se mude de fila.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre la lista de los recuerdos',
  ctaDetalle:
    'Se abre «Gastos de la salida del salón.xlsx» en la hoja «Recuerdos», con la cotización de la papelería sin IVA. Trece encargos. El `$` se teclea con Mayúsculas y el 4; para arreglar una fórmula ya escrita, doble clic en su celda o F2. «Rellenar hacia abajo» y «Rellenar hacia la derecha» están en Inicio → Edición, y el cuadro de nombres es la casilla de arriba a la izquierda. Si te equivocas, deshacer está arriba a la izquierda y no rompe nada.',
};

export function EntradaReferencias(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaReferencias;

export default EntradaReferencias;
