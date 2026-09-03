'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, RUTA_N9_DESARROLLO_DE_APLICACIONES, type ConfigEntradaN4 } from '../n4/estudio/EntradaN4Base';
import { LabPruebasConUsuarios } from './LabPruebasConUsuarios';

/**
 * Entrada de `n9-pruebas-con-usuarios` — N9·«Desarrollo de aplicaciones»,
 * parada 3 de 3, la que CIERRA la unidad (documento §54.3). Tono de
 * **14–15 años** (N9, 3.º de Secundaria, verificado en `curriculo.ts`).
 *
 * `RUTA_N9_DESARROLLO_DE_APLICACIONES` ya vivía en `n4/estudio/EntradaN4Base`
 * desde que se construyó `n9-boceta-tu-app`, con las tres paradas escritas de
 * antemano: se reutiliza tal cual, sin tocar ese archivo compartido.
 *
 * A diferencia de sus dos hermanas, el CTA no abre un editor: abre un panel
 * de análisis (`LabPruebasConUsuarios`, ver ese archivo para el porqué no
 * usa `simuladores/diseno`). Las cadenas de esta entrada lo dicen así desde
 * el globo: no hay «programa nuevo» que enseñar, hay una disciplina que
 * aplicar sobre el trabajo de las dos paradas anteriores.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n9-pruebas-con-usuarios/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n9-pruebas-con-usuarios',
  laboratorio: LabPruebasConUsuarios,
  ruta: RUTA_N9_DESARROLLO_DE_APLICACIONES,
  parada: 3,
  globo:
    'Ya bocetaste el flujo de «Mis tareas» y la construiste con controles nombrados y varios caminos. El editor revisó que el mapa no tuviera huecos — pero nunca vio a una persona real tocarla. Hoy sí: cinco usuarios probaron tu app, y tú decides qué hacer con lo que hicieron.',
  arranqueSub:
    'Vas a leer sesiones reales de **usabilidad** (*usability*: qué tan fácil es usar algo sin que nadie te lo explique) de cinco personas probando «Mis tareas» — dónde se atoraron, cuánto tardaron, qué dijeron. Vas a distinguir una opinión aislada de un patrón real, priorizar qué se arregla primero por severidad y frecuencia, y cerrar la unidad decidiendo si la app ya está lista para publicarse, o si necesita otra ronda.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#a78bfa' },
    { etiqueta: 'Usuarios', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Lo que separa observar de adivinar',
  fichas: [
    {
      key: 'lo-que-hizo-no-lo-que-dijo',
      tag: 'La primera regla',
      numero: 1,
      titulo: 'Confía en lo que hizo, no en lo que dijo',
      detalle:
        'En una **prueba con usuarios** (*user testing*: observar a alguien real usar tu app para encontrar sus problemas de verdad) la gente casi siempre suaviza su opinión en voz alta. Lo que tardó, dónde se atoró y si terminó la tarea cuenta más que cualquier comentario.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'patron-no-opinion',
      tag: 'El criterio',
      numero: 2,
      titulo: 'Un patrón, no una opinión',
      detalle:
        'Que a alguien no le guste un color no es lo mismo que tres de cinco personas se pierdan en el mismo botón. **Necesitas un número, no un «a alguien no le gustó».**',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'severidad-por-frecuencia',
      tag: 'Cómo se prioriza',
      numero: 3,
      titulo: 'Severidad por frecuencia',
      detalle:
        'Un error que le impide a alguien terminar su tarea no pesa lo mismo que un detalle estético — y cuántas personas lo sufren tampoco pesa igual. **Los dos números juntos deciden qué se arregla primero.**',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'cierre-de-la-unidad',
      tag: 'El cierre',
      numero: 4,
      titulo: 'Bocetaste, construiste, y ahora decides',
      detalle:
        'El editor de la parada 2 revisó que tu mapa no tuviera huecos — no puede saber si una persona real encuentra un botón. **Cierras la unidad decidiendo, con criterio, si «Mis tareas» está lista para publicarse.**',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra a Tecnia Pruebas',
  ctaDetalle:
    'Diagnosticas cuatro sesiones de prueba por su comportamiento, decides qué retroalimentación amerita un cambio real, priorizas los arreglos por severidad y frecuencia, y cierras la unidad decidiendo si «Mis tareas» está lista para publicarse.',
  assetsPendientes: false,
};

export function EntradaPruebasConUsuarios(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaPruebasConUsuarios;
