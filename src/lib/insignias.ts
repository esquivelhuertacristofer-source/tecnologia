/**
 * Insignias (F1.4) — logros coleccionables derivados del currículo y el
 * progreso, sin gamificación numérica (ver feedback: nada de XP ni estrellas
 * en la interfaz). Cada insignia se calcula en vivo a partir de
 * `CURRICULO` + el mapa de progreso + la racha de sesiones: no hay catálogo
 * guardado aparte, así que crece solo conforme se abren más ejercicios.
 */

import { CURRICULO, type EjeFormativoId } from '@/data/curriculo';
import type { ProgresoActividad } from '@/lib/progreso/repo';

export type CategoriaInsignia = 'inicio' | 'racha' | 'unidad' | 'nivel' | 'integradora';

export interface InsigniaEstado {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaInsignia;
  icono: string;
  eje?: EjeFormativoId;
  conseguida: boolean;
  progresoTexto?: string;
}

const RACHA_TRAMOS = [
  { umbral: 3, id: 'racha-3', titulo: 'Racha de 3 días', icono: '🔥' },
  { umbral: 7, id: 'racha-7', titulo: 'Racha de 7 días', icono: '🔥🔥' },
  { umbral: 30, id: 'racha-30', titulo: 'Racha de 30 días', icono: '🔥🔥🔥' },
];

function jugablesDe(ids: { id: string; estado: string }[]): string[] {
  return ids.filter(a => a.estado === 'disponible').map(a => a.id);
}

function completas(ids: string[], progreso: Map<string, ProgresoActividad>): boolean {
  return ids.length > 0 && ids.every(id => progreso.get(id)?.completado === true);
}

function hechas(ids: string[], progreso: Map<string, ProgresoActividad>): number {
  return ids.filter(id => progreso.get(id)?.completado === true).length;
}

export function calcularInsignias(
  progreso: Map<string, ProgresoActividad>,
  racha: number,
): InsigniaEstado[] {
  const insignias: InsigniaEstado[] = [];

  // ─── Primer paso (global) ───
  const totalCompletadas = [...progreso.values()].filter(p => p.completado).length;
  insignias.push({
    id: 'primer-paso',
    titulo: 'Primer paso',
    descripcion: 'Completa tu primer ejercicio en Tecnia.',
    categoria: 'inicio',
    icono: '🚀',
    conseguida: totalCompletadas >= 1,
  });

  // ─── Racha de sesiones ───
  for (const tramo of RACHA_TRAMOS) {
    insignias.push({
      id: tramo.id,
      titulo: tramo.titulo,
      descripcion: `Entra a Tecnia ${tramo.umbral} días seguidos.`,
      categoria: 'racha',
      icono: tramo.icono,
      conseguida: racha >= tramo.umbral,
      progresoTexto: racha < tramo.umbral ? `${Math.min(racha, tramo.umbral)}/${tramo.umbral} días` : undefined,
    });
  }

  // ─── Unidad completa, nivel completo y proyecto integrador ───
  for (const nivel of CURRICULO) {
    const jugablesNivel: string[] = [];

    for (const unidad of nivel.unidades) {
      const jugablesUnidad = jugablesDe(unidad.actividades);
      jugablesNivel.push(...jugablesUnidad);

      if (unidad.integradora) {
        insignias.push({
          id: `integrador-${unidad.id}`,
          titulo: `Proyecto integrador · Nivel ${nivel.n}`,
          descripcion: unidad.titulo,
          categoria: 'integradora',
          icono: '🎓',
          eje: unidad.eje,
          conseguida: completas(jugablesUnidad, progreso),
          progresoTexto: jugablesUnidad.length === 0 ? 'Próximamente' : `${hechas(jugablesUnidad, progreso)}/${jugablesUnidad.length}`,
        });
        continue;
      }

      if (jugablesUnidad.length === 0) continue;
      insignias.push({
        id: `unidad-${unidad.id}`,
        titulo: unidad.titulo,
        descripcion: `Completa todos los ejercicios de "${unidad.titulo}".`,
        categoria: 'unidad',
        icono: '🧩',
        eje: unidad.eje,
        conseguida: completas(jugablesUnidad, progreso),
        progresoTexto: `${hechas(jugablesUnidad, progreso)}/${jugablesUnidad.length}`,
      });
    }

    if (jugablesNivel.length === 0) continue;
    insignias.push({
      id: `nivel-${nivel.n}`,
      titulo: `Nivel ${nivel.n} dominado`,
      descripcion: `Termina todos los ejercicios disponibles del Nivel ${nivel.n}.`,
      categoria: 'nivel',
      icono: '🏆',
      conseguida: completas(jugablesNivel, progreso),
      progresoTexto: `${hechas(jugablesNivel, progreso)}/${jugablesNivel.length}`,
    });
  }

  return insignias;
}
