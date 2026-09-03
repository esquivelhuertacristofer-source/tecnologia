'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, RUTA_N8_MULTIMEDIA_Y_VIDEOJUEGOS, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { LabDerechosYLicencias } from './LabDerechosYLicencias';

/**
 * Entrada de `n8-derechos-y-licencias` — N8·«Producción multimedia y
 * videojuegos», parada 4 de 4 (documento §54), la que CIERRA la unidad. Tono
 * de **13–14 años** (N8, 2.º de Secundaria, verificado en `curriculo.ts`).
 *
 * No enseña un programa nuevo: aplica criterio sobre casos, como
 * `n8-habitos-de-proteccion` cierra «Redes y ciberseguridad». Profundiza —no
 * repite— la atribución que `n8-imagen-con-capas` ya trató de pasada (ahí
 * bastaba con el nombre de la autora; aquí hace falta el nombre Y la
 * licencia, y al final el conjunto completo de créditos de un proyecto con
 * varios recursos, no uno solo).
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n8-derechos-y-licencias/video-explicativo.mp4` y
 * la bandera bajó a `assetsPendientes: false`. OJO si escribes pruebas: con el
 * video puesto, el primer `<button>` del documento ya no es el CTA sino el de
 * la portada, así que no lo busques por posición.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n8-derechos-y-licencias',
  laboratorio: LabDerechosYLicencias,
  ruta: RUTA_N8_MULTIMEDIA_Y_VIDEOJUEGOS,
  parada: 4,
  globo:
    'Ya sabes apilar capas, grabar y editar, y diseñar tu propio videojuego. Hoy cierras la unidad con la pregunta que decide si puedes usar cualquier imagen, canción o efecto que encuentres: ¿de quién son los derechos, y qué pide su licencia a cambio?',
  arranqueSub:
    'No hay programa nuevo que aprender: vas a decidir. Vas a clasificar recursos con procedencias distintas —una foto tuya, una canción protegida, una imagen con licencia y una obra de dominio público—, decidir si un uso concreto respeta tres tipos de licencia Creative Commons, escribir atribuciones que lleven el nombre del autor Y su licencia, y cerrar armando el conjunto completo de créditos que necesita un proyecto con varios recursos a la vez.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#a78bfa' },
    { etiqueta: 'Licencias', valor: '3', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Lo que decide si puedes usar algo que no hiciste tú',
  fichas: [
    {
      key: 'dominio-publico',
      tag: 'Antes de cualquier licencia',
      numero: 1,
      titulo: 'Tuya, de todos, o de alguien más',
      detalle: 'Una obra es **libre** si tú la hiciste o ya es de todos (dominio público); es **protegida** si alguien más tiene todos los derechos reservados. Entre esos dos extremos está la licencia con condición.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'creative-commons',
      tag: 'Tres condiciones distintas',
      numero: 2,
      titulo: 'Atribución, no comercial, sin derivados',
      detalle: 'Una licencia Creative Commons no es un «sí» o un «no»: puede pedir **crédito**, prohibir **venderla**, o prohibir **modificarla** — y cada condición se rompe de una forma distinta.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'atribucion-completa',
      tag: 'No basta con el nombre',
      numero: 3,
      titulo: 'Autor, título, fuente y licencia',
      detalle: 'Dar crédito de verdad lleva **cuatro datos**, no uno. El editor revisa lo que escribes de verdad: si falta el autor o la licencia, no cuenta como atribución completa.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'cierre',
      tag: 'El cierre',
      numero: 4,
      titulo: 'Un proyecto, varios recursos, un solo conjunto de créditos',
      detalle: 'Tu tráiler mezcla una captura propia, una sinfonía de dominio público, una ilustración y un efecto de sonido con licencia. Decides cuáles piden atribución, y escribes las DOS a la vez.',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra a Tecnia Créditos',
  ctaDetalle:
    'Se abre el banco de recursos de Bit: clasifica procedencias, decide si un uso respeta cada licencia, escribe atribuciones completas y cierra armando el conjunto de créditos de un proyecto real. Equivocarte resta puntos pero nunca te deja fuera.',
  assetsPendientes: false,
};

export function EntradaDerechosYLicencias(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaDerechosYLicencias;
