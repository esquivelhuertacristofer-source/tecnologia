'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabEligeLaGrafica } from './Lab';

/**
 * Entrada de `n6-elige-la-grafica` — parada de N6 · «Hoja de cálculo II», y
 * la cuarta clase del grado Intermedio de la sala de Excel.
 *
 * ── LA RUTA SE DERIVA DE SU PROPIA UNIDAD, COMO EN TODA CLASE PRESTADA ──────
 *
 * Igual que `n6-funciones-esenciales`, `n7-referencias`, `n7-funcion-si` y
 * `n7-formato-condicional`: el id es `n6-`, la clase vive en la unidad del
 * nivel 6 y la sala de Excel la muestra desde ahí, así que la ruta —y el
 * número que resalta el CTA— salen de `getUnidad('n6-hoja-de-calculo-2')` y
 * no se escriben a mano (§44.6). No de `excel/comun/rutas.ts`: esos ayudantes
 * derivan de `EJERCICIOS_OFFICE`, que es donde se dan de alta las clases
 * EXCLUSIVAS (`of-`) que no tienen unidad propia. Una clase prestada como
 * ésta ya tiene su lista: la de su propia unidad, con ella incluida.
 */

const RUTA_N6: PasoRuta[] = (getUnidad('n6-hoja-de-calculo-2')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n6-elige-la-grafica';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabEligeLaGrafica,
  ruta: RUTA_N6,
  parada: Math.max(1, RUTA_N6.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo: 'Hoy no aprendes a usar un botón. Aprendes a desconfiar de un dibujo.',
  arranqueSub:
    'La feria de la escuela ya pasó, y hay números de sobra: boletos por puesto, boletos por semana, un presupuesto, horas de preparación. Vas a descubrir que cada gráfica contesta UNA pregunta —barras compara tamaños, líneas sigue el tiempo, pastel reparte un total, dispersión busca si dos cosas tienen que ver— eligiendo mal a propósito dos veces, para ver con tus ojos cómo la respuesta deja de leerse sin que ningún número cambie. Después vas a construir la MISMA gráfica dos veces, con los mismos datos, y a cortarle el eje a una sola: la misma diferencia real de tres boletos se va a ver casi nada en una y enorme en la otra. Y vas a armar dos pasteles que mienten por motivos distintos —uno con demasiadas rebanadas, otro con datos que no suman ningún total real— para entender que la mayoría de las gráficas que vas a ver en tu vida no están en Excel: están en las noticias y en las redes.',
  stats: [
    { etiqueta: 'Tipos de gráfica', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '13', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El eje cortado no avisa. Tú tienes que mirarlo.',
  fichas: [
    {
      key: 'una-pregunta-por-tipo',
      tag: 'Bloque 37',
      numero: 1,
      titulo: 'Cada gráfica contesta una pregunta',
      detalle:
        'Barras: ¿cuál es más grande? Líneas: ¿cómo cambió con el tiempo? Pastel: ¿qué parte del total? Dispersión: ¿tienen que ver una cosa con la otra? Elegir mal no rompe ningún número: sólo deja de contestar la pregunta.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'pastel-pocas-porciones',
      tag: 'El pastel',
      numero: 2,
      titulo: 'Sólo sirve con pocas porciones que suman un todo',
      detalle:
        'Un pastel de veinte rebanadas repite colores y se vuelve ilegible, aunque los votos sí sumen un total real. Y un pastel de datos que no suman nada en común —personas, días, puestos— reparte porcentajes que no significan absolutamente nada.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'eje-cortado',
      tag: 'Bloque 38',
      numero: 3,
      titulo: 'El eje cortado es la mentira más eficaz',
      detalle:
        'Construyes la misma gráfica dos veces con los mismos datos, y a una le cortas el eje. La misma diferencia real —tres boletos— se ve casi nada en una y enorme en la otra. Ningún número cambia: sólo cambia dónde empieza la regla.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'no-esta-prohibido',
      tag: 'La conclusión',
      numero: 4,
      titulo: 'No está prohibido. Está prohibido callarlo',
      detalle:
        'Cortar un eje a veces está justificado —cuando un cambio pequeño de verdad importa—. Lo único que no se vale es no decirlo. La lección no es «desconfía de toda gráfica»: es «mira el eje antes de creerte la forma».',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el libro de la feria',
  ctaDetalle:
    'Se abre «La feria de la escuela.xlsx», con ocho tablas pequeñas listas para convertirse en gráficas. Trece encargos. Columnas, líneas y circular están en Insertar → Gráficos; barras y dispersión están en el panel «Gráficas», a la derecha; y el corte del eje se hace desde «Eje mínimo (Y)», en el panel «Diseño de gráfico» que aparece al marcar tu gráfica.',
};

export function EntradaEligeLaGrafica(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaEligeLaGrafica;

export default EntradaEligeLaGrafica;
