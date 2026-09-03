'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabProyectoIntegrador } from './LabProyectoIntegrador';

/**
 * Entrada de `n9-proyecto-integrador` — N9 · «Proyecto integrador de
 * secundaria» (`n9-proyecto-integrador-secundaria`, `integradora: true`).
 * **3.º de secundaria, 14–15 años.** Es el CAPSTONE: la última actividad del
 * nivel, cierre de los nueve niveles de secundaria de Tecnia.
 *
 * Ruta derivada de `getUnidad('n9-proyecto-integrador-secundaria')`, nunca a
 * mano — mismo motivo que el resto de entradas de N9 (`EntradaMarcaPersonal`,
 * `EntradaIaYTrabajo`): aunque esta unidad tenga una sola parada, se sigue el
 * patrón de sus hermanas por consistencia, no porque haga falta resolver un
 * orden entre varias.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n9-proyecto-integrador/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const RUTA_N9_INTEGRADOR: PasoRuta[] = (getUnidad('n9-proyecto-integrador-secundaria')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n9-proyecto-integrador';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabProyectoIntegrador,
  ruta: RUTA_N9_INTEGRADOR,
  parada: Math.max(1, RUTA_N9_INTEGRADOR.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'Llegaste al final de tercero de secundaria. Hoy no hay un programa nuevo que aprender: hay un problema real —el de un refugio de animales pequeño— y la pregunta que has venido resolviendo en todo N9: ¿qué tipo de solución digital le sirve de verdad?',
  arranqueSub:
    'Vas a clasificar **cinco problemas reales** entre app, sitio web y análisis de datos; vas a aplicar ese mismo criterio al caso real de **Refugio Patitas**; y vas a construir su sitio con **HTML y CSS reales**, usando sólo los datos que te dio la encargada — nada inventado. Es el cierre de los nueve niveles.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#22d3ee' },
    { etiqueta: 'Actos', valor: '4', acento: '#a78bfa' },
    { etiqueta: 'Insignia', valor: '1', acento: '#f472b6' },
  ],
  letrero: 'El problema decide la solución, no al revés',
  fichas: [
    {
      key: 'el-problema-decide',
      tag: 'Acto 1',
      numero: 1,
      titulo: 'App, sitio o datos: lo decide el problema',
      detalle:
        'Una cuenta que la MISMA persona usa una y otra vez es una app. Información fija que cualquiera consulta es un sitio. Una decisión que sale de comparar números es un análisis de datos. **Nunca se elige por moda.**',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'refugio-patitas',
      tag: 'Acto 2',
      numero: 2,
      titulo: 'Un caso real: Refugio Patitas',
      detalle:
        'La encargada, Doña Marisol, necesita que la gente encuentre su horario y cómo adoptar — **sin cuentas, sin cifras que comparar**. Vas a justificar por qué eso es, exactamente, un sitio web.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'datos-reales-no-inventados',
      tag: 'Acto 3',
      numero: 3,
      titulo: 'Construyes con datos reales, no inventados',
      detalle:
        'El nombre del refugio, su horario, el enlace entre tus dos páginas y un aviso real que corriges: **todo sale de la misma tarjeta de datos**, con HTML y CSS de verdad en Tecnia Web.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'el-cierre',
      tag: 'Acto 4',
      numero: 4,
      titulo: 'El cierre de los nueve niveles',
      detalle: 'La última pregunta amarra todo lo que aprendiste sobre el mismo criterio, aplicado al sitio que **tú acabas de construir de verdad.**',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el proyecto integrador',
  ctaDetalle:
    'Nueve encargos en cuatro actos: clasifica cinco problemas reales entre app, sitio web y análisis de datos, aplica ese criterio al caso real de Refugio Patitas, construye su sitio con HTML y CSS reales usando sólo los datos que te dieron, y cierra explicando por qué esa era la solución correcta.',
  assetsPendientes: false,
};

export function EntradaProyectoIntegrador(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaProyectoIntegrador;
