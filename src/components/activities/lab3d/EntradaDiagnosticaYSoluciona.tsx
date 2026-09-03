'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN7Unidad1Base, type ConfigEntradaN7Unidad1 } from '../n7/bahia/EntradaN7Unidad1Base';
import { LabDiagnosticaYSoluciona } from './LabDiagnosticaYSoluciona';

/**
 * Entrada de `n7-diagnostica-y-soluciona` — N7·U1 «Arquitectura y sistemas»,
 * **parada 4 de 4** y cierre de la unidad (temario §31.4, adaptación §53.3).
 *
 * El globo, el letrero, los datos y el CTA son los del temario, verbatim; las
 * cuatro fichas se escriben aquí a partir de sus cuatro puntos gráficos, con el
 * número del paso del protocolo que cada una explica y no su ordinal.
 *
 * Edad de referencia del tono: **12–13 años** (N7, 1.º de Secundaria), leída en
 * `curriculo.ts`, no en el encargo.
 *
 * Las cuatro fichas declaran `img` porque `EntradaN7Unidad1Base` lo exige; los
 * archivos todavía no están generados y quedan anotados como deuda en §53.
 */

const CONFIG: ConfigEntradaN7Unidad1 = {
  actividadId: 'n7-diagnostica-y-soluciona',
  laboratorio: LabDiagnosticaYSoluciona,
  parada: 4,
  globo: 'Esta máquina no arranca. La diferencia entre un técnico y alguien que le pica a todo es el orden.',
  arranqueSub:
    'Entra a la Mesa de Diagnóstico: primero armas el protocolo de cinco pasos y después resuelves cinco averías reales, comprobando antes de tocar.',
  stats: [
    { etiqueta: 'Protocolo', valor: '5 pasos', acento: '#22d3ee' },
    { etiqueta: 'Averías', valor: '5', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La Mesa de Diagnóstico',
  fichas: [
    {
      key: 'sintoma',
      tag: 'Paso 1',
      numero: 1,
      titulo: 'Observa el síntoma exacto',
      detalle:
        'No «no funciona», sino «enciende el led y no hay imagen». El síntoma bien descrito ya reduce la lista de culpables a la mitad.',
      img: 'ficha-sintoma.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'simple',
      tag: 'Paso 2',
      numero: 2,
      titulo: 'Lo simple primero',
      detalle:
        'Cables, contactos y si de verdad está encendido. Una parte enorme de las fallas reales son eso, y se descartan en treinta segundos.',
      img: 'ficha-simple.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'una-a-la-vez',
      tag: 'Paso 3',
      numero: 3,
      titulo: 'Una variable a la vez',
      detalle:
        'Cambia el cable, no el cable y el monitor. Si cambias tres cosas y funciona, no sabes cuál era y no aprendiste nada.',
      img: 'ficha-aisla.png',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'preventivo',
      tag: 'Paso 4',
      numero: 4,
      titulo: 'La solución mínima',
      detalle:
        'La que explique el síntoma y nada más, sin desarmar de más. Reinstalar y cambiar la pieza cara son el último recurso, no el primero.',
      img: 'ficha-minima.png',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Arma el protocolo y resuelve cinco averías reales, una variable a la vez.',
  /*
   * `true` desde el 1-sep-2026: esta clase NO tiene
   * `public/assets/actividades/n7-diagnostica-y-soluciona/video-explicativo.mp4`. `EntradaN7Unidad1Base`
   * SÍ admite esta bandera desde la parada 2 —el comentario de cabecera que
   * decía lo contrario se quedó viejo—, y sin declararla llega `undefined`, que
   * es falsy: el `<video>` se pintaba igual y pedía un archivo inexistente. El
   * alumno veía un reproductor muerto en vez del aviso de video pendiente.
   * Cuando el video exista, esto se quita en el mismo commit que lo publica.
   */
  assetsPendientes: false,
};

export function EntradaDiagnosticaYSoluciona(props: ActivityProps) {
  return <EntradaN7Unidad1Base {...props} entrada={CONFIG} />;
}

export default EntradaDiagnosticaYSoluciona;
