'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabIaYTrabajo } from './LabIaYTrabajo';

/**
 * Entrada de `n9-ia-y-trabajo` — N9 · «IA y automatización», parada 3 de 3,
 * CIERRE de la unidad. **3.º de secundaria, 14–15 años** (comprobado en
 * `src/data/curriculo.ts`, misma unidad que `n9-automatiza-tareas` y
 * `n9-ia-copiloto`).
 *
 * Ruta derivada de `getUnidad('n9-ia-y-automatizacion')`, nunca a mano —
 * mismo motivo que `EntradaIaCopiloto.tsx`: las tres paradas leen el mismo
 * currículo en vez de compartir un archivo de rutas que las tres sesiones en
 * paralelo tendrían que tocar.
 *
 * `EntradaN4Base` porque es lo que usan sus dos hermanas de esta unidad.
 *
 * ── Por qué esta parada NO trae un motor nuevo ──────────────────────────
 *
 * Es el CIERRE de la unidad: aplica criterio, no aprende un programa. Mismo
 * papel que `n9-empleos-tecnologicos` (parada 3 de otra unidad, leída entera
 * antes de escribir ésta): un panel de decisión puro sobre `VentanaBase` +
 * `useLabActividad`, sin `ArcadeSala` ni un simulador de software nuevo — no
 * hay nada que enseñar a operar, hay que decidir con lo que ya se aprendió.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n9-ia-y-trabajo/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const RUTA_N9_IA: PasoRuta[] = (getUnidad('n9-ia-y-automatizacion')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n9-ia-y-trabajo';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabIaYTrabajo,
  ruta: RUTA_N9_IA,
  parada: Math.max(1, RUTA_N9_IA.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'Ya armaste una regla que archiva sola y probaste a un copiloto antes de aceptar lo que te dio. Hoy cierras la unidad mirando de frente lo que de verdad cambia la IA en el trabajo — sin pánico y sin optimismo ciego.',
  arranqueSub:
    'Vas a clasificar **tareas reales** entre las que la IA ya automatiza bien y las que siguen pidiendo tu criterio, a comparar **empleos reales** antes y después de la IA, a descubrir por qué "nunca me va a reemplazar" y "me va a reemplazar seguro" están mal por la misma razón, y a cerrar aplicando **todo** lo que aprendiste en la unidad a un caso nuevo.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#38bdf8' },
    { etiqueta: 'Posturas fáciles', valor: '2', acento: '#f87171' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Ni pánico, ni optimismo ciego: criterio',
  fichas: [
    {
      key: 'no-todo-cambia-igual',
      tag: 'Lo que sí cambia',
      numero: 1,
      titulo: 'No toda tarea cambia igual',
      detalle:
        'Una tarea repetitiva con un patrón claro la automatiza bien una IA hoy. Una que pide ambigüedad, ética o relación con otra persona, **todavía no**.',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    {
      key: 'reemplaza-es-la-excepcion',
      tag: 'El error común',
      numero: 2,
      titulo: '«Reemplaza el empleo» es la excepción, no la regla',
      detalle: 'Casi nunca un empleo desaparece completo: lo normal es que **cambie qué hace**, no que se borre.',
      acento: { c: '#fb923c', deep: '#9a3412' },
    },
    {
      key: 'ni-panico-ni-optimismo',
      tag: 'Cómo prepararte',
      numero: 3,
      titulo: 'Ni pánico ni optimismo ciego',
      detalle:
        '«Nunca me va a reemplazar» y «me va a reemplazar seguro» están mal por la misma razón: **ninguna depende de lo que tú hagas con tu criterio**.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'el-cierre',
      tag: 'El cierre',
      numero: 4,
      titulo: 'Todo el criterio de la unidad, en un caso real',
      detalle: 'Reglas rígidas, copiloto probado e impacto real de hoy — decides **qué le toca a cada uno** en un empleo real.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el panel de impacto',
  ctaDetalle:
    'Nueve encargos: clasifica tareas reales, compara empleos reales antes y después de la IA, separa el criterio real del pánico y del optimismo ciego, y cierra decidiendo qué parte de un trabajo real le toca a una regla, a un copiloto, y a ti.',
  assetsPendientes: false,
};

export function EntradaIaYTrabajo(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaIaYTrabajo;
