'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabTrabajoColaborativo } from './LabTrabajoColaborativo';

/**
 * Entrada de `n9-trabajo-colaborativo` — N9 · «Nube y colaboración
 * profesional», parada 1 de 2. Nivel 9 = 3° de Secundaria, 14–15 años.
 *
 * Misma plantilla de oro que su hermana `EntradaGestionaTuProyecto.tsx`
 * (`EntradaN4Base`, agnóstica de nivel pese al nombre) y la misma forma de
 * derivar la ruta: directo de `getUnidad('n9-nube-y-colaboracion')`, nunca a
 * mano — así las dos paradas de la unidad quedan siempre en el mismo orden
 * que declara `curriculo.ts`, sin un archivo de rutas nuevo que mantener.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n9-trabajo-colaborativo/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const RUTA_N9: PasoRuta[] = (getUnidad('n9-nube-y-colaboracion')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n9-trabajo-colaborativo';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabTrabajoColaborativo,
  ruta: RUTA_N9,
  parada: Math.max(1, RUTA_N9.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'Iker, Melissa y Diego ya tienen su tablero de tareas para la app de turnos de la papelería — pero antes de programar nada, escribieron juntos la propuesta del proyecto. Hoy entras a ese mismo documento: el que le van a enseñar a su profesor antes de empezar a construir.',
  arranqueSub:
    'En quinto ya viste que compartir es dar una llave, no mandar una copia. Aquí vas más allá: vas a decidir cuándo la llave correcta es **editar** y cuándo es **comentar** (*comment*, la que usan los revisores en Google Docs o Word para dejar notas sin tocar el texto), vas a coordinarte con un compañero para no pisarle su parte, vas a resolver un choque real sin perder el trabajo de nadie, y vas a medir el riesgo de un enlace que se comparte en el chat del grado — no en un salón, en un chat de cientos de personas.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#2dd4bf' },
    { etiqueta: 'Colaboradores', valor: '4', acento: '#f5a524' },
    { etiqueta: 'Permisos', valor: '3', acento: '#a78bfa' },
  ],
  letrero: 'El permiso correcto no es generosidad: es criterio',
  fichas: [
    {
      key: 'editar-no-es-la-unica',
      tag: 'La diferencia que ya deberías saber',
      numero: 1,
      titulo: 'Editar no es la única llave que sirve',
      detalle:
        'Ver, comentar o editar: tres llaves reales, no una grande y dos de relleno. La correcta para un revisor de fuera del equipo casi nunca es la misma que la de quien coescribe contigo.',
      acento: { c: '#2dd4bf', deep: '#0f766e' },
    },
    {
      key: 'mira-antes-de-entrar',
      tag: 'Antes de escribir',
      numero: 2,
      titulo: 'Mira quién anda dentro antes de entrar',
      detalle:
        'El programa muestra en vivo quién está trabajando en el documento ahora mismo. Revisar esa lista antes de escribir es la mitad de no pisarle el trabajo a un compañero.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'un-choque-no-cuesta',
      tag: 'Cuando de todos modos choca',
      numero: 3,
      titulo: 'Un choque no tiene que costarte el trabajo de nadie',
      detalle:
        'Revisar ayuda, pero no es infalible. Y cuando dos personas guardan a la vez, el programa no funde el texto por ti: conservar las dos versiones evita perder trabajo, no lo une solo.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'el-riesgo-real',
      tag: 'El riesgo real',
      numero: 4,
      titulo: 'Un enlace abierto no lo controla quien lo mandó',
      detalle:
        'Compartir «con cualquiera que tenga el enlace» en el chat de un grado entero no es lo mismo que compartir con un salón. El mismo enlace, otra escala de consecuencia.',
      acento: { c: '#f97316', deep: '#9a3412' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre la propuesta compartida',
  ctaDetalle:
    'Se abre Tecnia Nube con la propuesta real del equipo: reparte las llaves correctas a cuatro colaboradores con papeles distintos, coordínate para escribir sin chocar, controla un enlace que se escapó del chat del grado, y cierra el documento dejando cada permiso a la medida de quien lo necesita.',
  assetsPendientes: false,
};

export function EntradaTrabajoColaborativo(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaTrabajoColaborativo;
