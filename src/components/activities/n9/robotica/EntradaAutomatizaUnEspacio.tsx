'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N9_ROBOTICA } from './rutaRoboticaN9';
import { LabAutomatizaUnEspacio } from './LabAutomatizaUnEspacio';

/**
 * Entrada de `n9-automatiza-un-espacio` — N9·«Robótica e internet de las cosas», parada 3 (cierre).
 * Tono de **14–15 años** (N9, 3.º de Secundaria).
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n9-automatiza-un-espacio/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n9-automatiza-un-espacio',
  laboratorio: LabAutomatizaUnEspacio,
  ruta: RUTA_N9_ROBOTICA,
  parada: 3,
  globo:
    '¡Llegaste al proyecto final de Robótica e IoT! Vas a automatizar un espacio completo de principio a fin: eliges el objetivo, decides qué sensor usa cada regla, programas el motor IFTTT y corriges el bug de un compañero.',
  arranqueSub:
    'Reunirás lo de las dos paradas anteriores — leer sensores con criterio y programar reglas IFTTT — en un solo proyecto con un objetivo real de ahorro de energía.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#38bdf8' },
    { etiqueta: 'Engine IoT', valor: 'IFTTT', acento: '#a855f7' },
    { etiqueta: 'Insignia', valor: '1', acento: '#facc15' },
  ],
  letrero: 'SmartSpace IoT Studio: Proyecto Final de Automatización',
  fichas: [
    {
      key: 'objetivo-proyecto',
      tag: 'Diseño del Proyecto',
      numero: 1,
      titulo: 'Objetivo y Sensores',
      detalle: 'Define el objetivo real del plan y elige qué sensor sirve para cada tarea — no todos sirven para todo.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'reglas-ifttt-proyecto',
      tag: 'Lógica IFTTT',
      numero: 2,
      titulo: 'Programa las Reglas Reales',
      detalle: 'Activa la Regla de Iluminación y la Regla de Climatización en el motor de automatización.',
      acento: { c: '#a855f7', deep: '#7e22ce' },
    },
    {
      key: 'depurar-y-medir',
      tag: 'Depuración y Cierre',
      numero: 3,
      titulo: 'Corrige el Bug y Reporta',
      detalle: 'Encuentra la regla que un compañero dejó al revés, prueba tu plan y entrega el reporte final.',
      acento: { c: '#34d399', deep: '#059669' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Iniciar el proyecto SmartSpace',
  ctaDetalle: 'Entra al proyecto final: objetivo, sensores, reglas IFTTT, depuración de un bug real y reporte de cierre.',
  assetsPendientes: false,
};

export function EntradaAutomatizaUnEspacio(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaAutomatizaUnEspacio;
