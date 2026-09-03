'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N10_CAPSTONE_Y_PORTAFOLIO } from '../carreras-certificaciones/rutaCapstoneYPortafolioN10';
import { LabCapstone } from './LabCapstone';

/**
 * Entrada de `n10-capstone` — N10 · «Proyecto capstone y portafolio»,
 * parada 1 de 3. **Es el CAPSTONE de TODA la plataforma** (`integradora:
 * true`): la actividad que cierra los DIEZ niveles completos de Tecnia, no
 * sólo N10. **Bachillerato, 15–18 años**, tono «Perfil profesional».
 *
 * Construida en solitario, con el mismo cuidado que
 * `n9-proyecto-integrador` — diseño personal antes que delegación, porque es
 * la pieza de cierre de todo el trabajo de la plataforma.
 *
 * La ruta se IMPORTA de `RUTA_N10_CAPSTONE_Y_PORTAFOLIO`
 * (`carreras-certificaciones/rutaCapstoneYPortafolioN10.ts`, ya creada por
 * `n10-carreras-y-certificaciones`) y nunca se reescribe aquí.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n10-capstone/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const ACTIVIDAD = 'n10-capstone';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabCapstone,
  ruta: RUTA_N10_CAPSTONE_Y_PORTAFOLIO,
  parada: Math.max(1, RUTA_N10_CAPSTONE_Y_PORTAFOLIO.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'Llegaste al final de Bachillerato. Hoy no hay un programa nuevo que aprender: hay un problema real —el de un fotógrafo profesional independiente— y la pregunta que has venido resolviendo desde tu primer nivel en Tecnia: ¿qué tipo de solución digital le sirve de verdad?',
  arranqueSub:
    'Vas a clasificar **cinco problemas profesionales reales** entre app, sitio web y análisis de datos; vas a aplicar ese mismo criterio al caso real de **Estudio Cronos**; y vas a construir su sitio con **HTML y CSS reales**, usando sólo los datos que te dio el cliente — nada inventado. Es el cierre de los diez niveles completos de la plataforma.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#a78bfa' },
    { etiqueta: 'Actos', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#f472b6' },
  ],
  letrero: 'El problema decide la solución, no al revés — el mismo criterio, del nivel 1 al nivel 10',
  fichas: [
    {
      key: 'el-problema-decide',
      tag: 'Acto 1',
      numero: 1,
      titulo: 'App, sitio o datos: lo decide el problema',
      detalle:
        'Una cuenta que la MISMA persona usa una y otra vez es una app. Información fija que cualquiera consulta es un sitio. Una decisión que sale de comparar números es un análisis de datos. **Nunca se elige por moda.**',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'estudio-cronos',
      tag: 'Acto 2',
      numero: 2,
      titulo: 'Un caso real: Estudio Cronos',
      detalle:
        'Mateo Cronos, fotógrafo profesional independiente, necesita que la gente encuentre su trabajo y sus tarifas — **sin cuentas, sin cifras que comparar**. Vas a justificar por qué eso es, exactamente, un sitio web.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'datos-reales-no-inventados',
      tag: 'Acto 3',
      numero: 3,
      titulo: 'Construyes con datos reales, no inventados',
      detalle:
        'El nombre del estudio, el precio real, el enlace entre tus dos páginas y un aviso real que corriges: **todo sale de la misma tarjeta de datos**, con HTML y CSS de verdad en Tecnia Web.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'el-cierre',
      tag: 'Acto 4',
      numero: 4,
      titulo: 'El cierre de los diez niveles',
      detalle:
        'La última pregunta amarra el mismo criterio con el que decidiste desde tu primer proyecto, y lo conecta con tu portafolio real y tu camino profesional ya decidido — **el cierre de toda tu formación en Tecnia.**',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre tu proyecto capstone',
  ctaDetalle:
    'Nueve encargos en cuatro actos: clasifica cinco problemas profesionales reales entre app, sitio web y análisis de datos, aplica ese criterio al caso real de Estudio Cronos, construye su sitio con HTML y CSS reales usando sólo los datos que te dieron, y cierra explicando por qué esa era la solución correcta — el cierre de los diez niveles completos de Tecnia.',
  assetsPendientes: false,
};

export function EntradaCapstone(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaCapstone;
