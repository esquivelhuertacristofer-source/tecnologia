'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabFuncionSi } from './Lab';

/**
 * Entrada de `n7-funcion-si` — parada de N7 · «Hoja de cálculo aplicada», y la
 * séptima clase de la sala de Excel.
 *
 * ── LA RUTA Y EL NÚMERO SE DERIVAN, LOS DOS ─────────────────────────────────
 *
 * Igual que en las cuatro clases anteriores de esta sala y por lo mismo: en la
 * sala de PowerPoint cinco entradas acabaron mintiendo por llevar la ruta
 * escrita a mano (§44.6). Aquí el riesgo es doble, porque **esta clase tiene dos
 * números distintos y los dos son ciertos**: es la séptima del grado —así se
 * cuenta en el reparto del §45.3— y la segunda de su unidad. El que se enseña en
 * el CTA gigante es el de la unidad, porque es el que la tira de al lado
 * resalta, y sale del mismo dato que la tira: escribirlo a mano sería poner dos
 * números que se contradicen en la misma pantalla.
 */

const RUTA_N7: PasoRuta[] = (getUnidad('n7-hoja-de-calculo-aplicada')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n7-funcion-si';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabFuncionSi,
  ruta: RUTA_N7,
  parada: Math.max(1, RUTA_N7.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo: 'Hoy tu fórmula deja de calcular y empieza a contestar.',
  arranqueSub:
    'Mismo archivo, tres semanas antes de la salida a Teotihuacán. La lista de quién ya pagó está completa y ordenada, y la tesorera lleva a mano una columna que dice «Sí» o «Le falta» en cada renglón. Hoy vas a ver esa columna mentir —alguien completa su cuota y la palabra se queda como estaba— y la vas a sustituir por algo que hasta ahora no habías escrito: una fórmula que no multiplica ni suma nada, sino que **mira una celda, la compara y contesta**. Vas a provocar a propósito el error número uno del tema (escribir el texto sin comillas), a meter un SI dentro de otro para contestar tres cosas en vez de dos, y a comparar «pagó Y trae el permiso» con «pagó O trae el permiso»: la misma lista, los mismos datos, una sola letra de diferencia y medio salón que cambia de lado.',
  stats: [
    { etiqueta: 'Funciones', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '13', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Una celda que decide',
  fichas: [
    {
      key: 'la-prueba-va-primero',
      tag: 'Los tres huecos',
      numero: 1,
      titulo: 'Prueba, sí y no',
      detalle:
        'Un SI lleva tres cosas separadas por comas y en ese orden: la prueba —una comparación, con >=, >, <, = o <>—, lo que contesta si es verdad y lo que contesta si no. Se lee en voz alta: «si lo que entregó es mayor o igual a la cuota, escribe Sí; si no, escribe Le falta».',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'comillas',
      tag: 'Comillas',
      numero: 2,
      titulo: 'El texto va entre comillas',
      detalle:
        'Es el error número uno del tema y aquí lo vas a provocar tú: sin comillas, la hoja no ve una palabra, ve el nombre de algo. Sale a buscar una celda llamada «Sí», no encuentra ninguna y contesta #¿NOMBRE?. Los números, en cambio, van desnudos: 320 sin comillas.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'y-frente-a-o',
      tag: 'Y frente a O',
      numero: 3,
      titulo: 'Una letra, medio salón',
      detalle:
        '«Pagó Y trajo el permiso» deja fuera a seis de doce. «Pagó O trajo el permiso» deja fuera a uno. Mismos datos, misma tabla, y las dos fórmulas perfectamente escritas: el programa no te avisa de nada, porque hace lo que escribiste y no lo que quisiste.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'anidado',
      tag: 'SI anidado',
      numero: 4,
      titulo: 'Tres respuestas, no dos',
      detalle:
        'Un SI tiene dos salidas y siempre tendrá dos. Cuando la vida tiene tres —pagó completo, abonó a medias, no ha dado nada— se mete un SI en el hueco del «si no» del otro. Se lee de fuera hacia dentro, se cierran tantos paréntesis como SI abriste, y el orden de las preguntas ES la respuesta.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre la lista de los pagos',
  ctaDetalle:
    'Se abre «Gastos de la salida del salón.xlsx» en la hoja «Pagos», con los doce de tu salón, lo que entregó cada quien y su permiso. Trece encargos. Un SI se escribe con tres huecos separados por comas; todo lo que sea texto va entre comillas y los números no. Para arreglar una fórmula ya escrita, doble clic en su celda o F2. Si te equivocas, deshacer está arriba a la izquierda y no rompe nada.',
};

export function EntradaFuncionSi(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaFuncionSi;

export default EntradaFuncionSi;
