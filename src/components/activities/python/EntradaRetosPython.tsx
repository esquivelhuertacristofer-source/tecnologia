'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../n4/estudio/EntradaN4Base';
import { LabRetosPython } from './LabRetosPython';
import { RUTA_N7_PYTHON_1 } from './rutaN7Python1';

/**
 * Entrada de N7 · U2 «Programación en texto I» · parada 5 «Retos guiados», el
 * cierre de la unidad.
 *
 * Las fichas dan por sabidas las cuatro paradas anteriores —tipo y conversión,
 * input/print, if/elif/else, for/while— y no repiten ninguna: nombran qué
 * combina cada uno de los tres retos. Registro de secundaria (§30.4): término
 * técnico correcto con su traducción al lado, se explica el porqué y no sólo el
 * qué, refuerzo informativo. Cada cadena está escrita para esta clase.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n7-retos-python/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 *
 * 6-oct-2026 (§69.18): la clase pasó al juez de programas. Las fichas cuentan
 * el problema de cada reto, no qué herramienta usar: elegirlas es el reto.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n7-retos-python',
  laboratorio: LabRetosPython,
  ruta: RUTA_N7_PYTHON_1,
  parada: 5,
  globo:
    'Ya sabes guardar datos, preguntar y contestar, decidir con condiciones y repetir con bucles. Hoy no aprendes nada nuevo: lo combinas todo en tres programas completos.',
  arranqueSub:
    'Abres **retos.py** y escribes tres programas completos sin una línea dictada. Un juez los prueba en las fronteras y en los casos especiales.',
  stats: [
    { etiqueta: 'Encargos', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Retos con juez', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Tres programas, las cuatro herramientas',
  fichas: [
    {
      key: 'reto1',
      tag: 'Reto 1',
      numero: 1,
      titulo: 'El precio justo',
      detalle:
        'La papelería hace dos descuentos según lo que gastes. Tu programa dice cuánto se paga, **también en la compra que cae justo en la frontera**.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'reto2',
      tag: 'Reto 2',
      numero: 2,
      titulo: 'Aprobados y promedio',
      detalle:
        'La maestra quiere saber cuántos aprobaron y el promedio del grupo. ¿Y si el grupo no tiene alumnos? **El juez lo va a probar.**',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'reto3',
      tag: 'Reto 3',
      numero: 3,
      titulo: 'El candado del casillero',
      detalle:
        'Tres intentos para abrir el casillero. Tu programa tiene que saber cuándo dejar de preguntar **y por qué dejó de hacerlo**.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de código',
  ctaDetalle:
    'Tres retos con juez y una pregunta de cierre. Ninguno necesita algo nuevo: necesitan que elijas y juntes lo de las cuatro paradas.',
  assetsPendientes: false,
};

export function EntradaRetosPython(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaRetosPython;
