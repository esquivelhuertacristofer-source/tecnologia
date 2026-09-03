/**
 * Hub de profesor — capa de consultas (demo).
 *
 * Única puerta de entrada a los datos del profesor: las páginas SOLO llaman
 * estas funciones, nunca leen `datosDemo.ts` directamente. El día que exista
 * Supabase, esta es la única capa que se reescribe — mismos nombres, mismos
 * tipos de retorno, ninguna página se toca (misma idea que
 * `progreso/repo.ts`).
 *
 * Los umbrales de "nivel atrasado" (70/40%), "actividad difícil" (score bajo
 * con al menos 2 intentos) y "alumno en riesgo" (7+ días sin actividad) no
 * son arbitrarios: son los mismos que se verificaron y documentaron en la
 * auditoría del hub de profesor de CEN Bachillerato — se reutiliza el
 * criterio ya puesto a prueba en vez de inventar uno nuevo.
 */

import { todasLasActividades, resumenNivel } from '@/data/curriculo';
import { NIVELES } from '@/data/niveles';
import {
  leerPerfilDocenteLocal,
  guardarPerfilDocenteLocal,
  borrarPerfilDocenteLocal,
  haySesionDocenteLocal,
  leerPosicionamientoLocal,
  guardarPosicionamientoLocal,
} from '@/lib/progreso/local';
import {
  ALUMNOS_DEMO,
  GRUPOS_DEMO_CON_TOTAL,
  HISTORIAL_POR_ALUMNO,
} from './datosDemo';
import type {
  PerfilDocente,
  GrupoDocente,
  AlumnoDocente,
  AlumnoDetalle,
  IntentoAlumno,
  EntregaReciente,
  RecomendacionDocente,
  MetricasDocente,
  AvanceNivel,
  ResultadoPosicionamiento,
} from './tipos';

// ─── Perfil ────────────────────────────────────────────────────────────────

const PERFIL_DOCENTE_DEMO: PerfilDocente = {
  nombre: 'Prof. Andrea Salinas',
  avatar: '👩‍🏫',
  materia: 'Tecnología',
};

export function getPerfilDocente(): PerfilDocente {
  return leerPerfilDocenteLocal(PERFIL_DOCENTE_DEMO);
}

export function savePerfilDocente(parcial: Partial<PerfilDocente> = {}): PerfilDocente {
  return guardarPerfilDocenteLocal(PERFIL_DOCENTE_DEMO, parcial);
}

export function haySesionDocente(): boolean {
  return haySesionDocenteLocal();
}

export function cerrarSesionDocente(): void {
  borrarPerfilDocenteLocal();
}

// ─── Resolución de actividades reales ─────────────────────────────────────

let mapaActividadesCache: Map<string, { titulo: string; icono?: string }> | null = null;

function mapaActividades(): Map<string, { titulo: string; icono?: string }> {
  if (mapaActividadesCache) return mapaActividadesCache;
  const map = new Map<string, { titulo: string; icono?: string }>();
  for (const act of todasLasActividades()) {
    map.set(act.id, { titulo: act.titulo, icono: act.icono });
  }
  mapaActividadesCache = map;
  return map;
}

function nivelDeActividad(actividadId: string): number {
  const m = /^n(\d+)-/.exec(actividadId);
  return m ? Number(m[1]) : 0;
}

function horaSintetica(score: number, minutos: number): string {
  const h = 8 + ((score + minutos) % 9); // 08–16h, jornada escolar
  const m = (score * 7 + minutos * 3) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── Grupos y alumnos ──────────────────────────────────────────────────────

export function getGruposDocente(): GrupoDocente[] {
  return GRUPOS_DEMO_CON_TOTAL;
}

export function getAlumnosDelDocente(grupoId?: string): AlumnoDocente[] {
  return grupoId ? ALUMNOS_DEMO.filter((a) => a.grupoId === grupoId) : ALUMNOS_DEMO;
}

export function getTopAlumnos(limit = 5): AlumnoDocente[] {
  return [...ALUMNOS_DEMO]
    .filter((a) => a.actividadesCompletadas > 0)
    .sort((x, y) => y.scoreTotal - x.scoreTotal)
    .slice(0, limit);
}

export function getAlumnoDetalle(alumnoId: string): AlumnoDetalle | null {
  const alumno = ALUMNOS_DEMO.find((a) => a.id === alumnoId);
  if (!alumno) return null;
  const mapa = mapaActividades();
  const hist = HISTORIAL_POR_ALUMNO[alumnoId] ?? [];
  const historial: IntentoAlumno[] = hist
    .map((i, idx) => ({
      id: `${alumnoId}-${idx}`,
      actividadId: i.actividadId,
      actividadTitulo: mapa.get(i.actividadId)?.titulo ?? i.actividadId,
      nivel: nivelDeActividad(i.actividadId),
      score: i.score,
      minutos: i.minutos,
      fecha: i.fecha,
    }))
    .sort((x, y) => y.fecha.localeCompare(x.fecha));
  return { ...alumno, historial };
}

// ─── Entregas recientes ────────────────────────────────────────────────────

export function getEntregasRecientes(limit = 6): EntregaReciente[] {
  const mapa = mapaActividades();
  const todas: EntregaReciente[] = [];
  for (const a of ALUMNOS_DEMO) {
    const hist = HISTORIAL_POR_ALUMNO[a.id] ?? [];
    hist.forEach((i, idx) => {
      todas.push({
        id: `${a.id}-${idx}`,
        alumnoId: a.id,
        alumnoNombre: a.nombre,
        avatar: a.avatar,
        actividadId: i.actividadId,
        actividadTitulo: mapa.get(i.actividadId)?.titulo ?? i.actividadId,
        score: i.score,
        fecha: i.fecha,
        horaTexto: horaSintetica(i.score, i.minutos),
      });
    });
  }
  return todas.sort((x, y) => y.fecha.localeCompare(x.fecha)).slice(0, limit);
}

// ─── Avance por nivel (cohorte) ────────────────────────────────────────────

const AVANCE_VERDE = 70;
const AVANCE_AMARILLO = 40;

export function getAvancePorNivel(grupoId: string): AvanceNivel[] {
  const grupo = GRUPOS_DEMO_CON_TOTAL.find((g) => g.id === grupoId);
  if (!grupo || grupo.totalAlumnos === 0) return [];
  const alumnosGrupo = ALUMNOS_DEMO.filter((a) => a.grupoId === grupoId);

  return grupo.niveles.map((n) => {
    const nivelInfo = NIVELES.find((x) => x.n === n);
    const resumen = resumenNivel(n);
    const totalActividades = resumen.actividadesDisponibles;
    const completadasCohorte = alumnosGrupo.reduce((sum, a) => {
      const hist = HISTORIAL_POR_ALUMNO[a.id] ?? [];
      return sum + hist.filter((i) => nivelDeActividad(i.actividadId) === n).length;
    }, 0);
    const maxPosible = totalActividades * grupo.totalAlumnos;
    const pctCompletion = maxPosible > 0 ? Math.round((completadasCohorte / maxPosible) * 100) : 0;
    const estado: AvanceNivel['estado'] =
      maxPosible === 0 ? 'sin-datos' : pctCompletion >= AVANCE_VERDE ? 'verde' : pctCompletion >= AVANCE_AMARILLO ? 'amarillo' : 'rojo';

    return {
      nivel: n,
      titulo: nivelInfo?.titulo ?? `Nivel ${n}`,
      icono: nivelInfo?.icono ?? '💻',
      etapa: grupo.etapa,
      totalActividades,
      completadasCohorte,
      pctCompletion,
      estado,
    };
  });
}

// ─── Métricas del panel principal ─────────────────────────────────────────

export function getMetricasDocente(): MetricasDocente {
  const totalAlumnos = ALUMNOS_DEMO.length;
  const totalGrupos = GRUPOS_DEMO_CON_TOTAL.length;
  const actividadesCompletadas = ALUMNOS_DEMO.reduce((s, a) => s + a.actividadesCompletadas, 0);
  const avances = GRUPOS_DEMO_CON_TOTAL.flatMap((g) => getAvancePorNivel(g.id));
  const pctAvancePromedio =
    avances.length > 0 ? Math.round(avances.reduce((s, a) => s + a.pctCompletion, 0) / avances.length) : 0;
  return { totalAlumnos, totalGrupos, actividadesCompletadas, pctAvancePromedio };
}

// ─── Recomendaciones (motor real, calculado desde los datos de arriba) ────

const MIN_INTENTOS_DIFICIL = 2;
const SCORE_DIFICIL = 60;
const SCORE_MUY_DIFICIL = 45;
const DIAS_RIESGO = 7;
const DIAS_RIESGO_ALTO = 14;

export function getRecomendaciones(): RecomendacionDocente[] {
  const recos: RecomendacionDocente[] = [];

  for (const g of GRUPOS_DEMO_CON_TOTAL) {
    for (const av of getAvancePorNivel(g.id)) {
      if (av.estado === 'rojo') {
        recos.push({
          tipo: 'NIVEL_BAJO',
          titulo: `${av.icono} Nivel ${av.nivel} · ${av.titulo} va atrasado`,
          descripcion: `${g.nombre} lleva ${av.pctCompletion}% de avance en este nivel — por debajo del ${AVANCE_AMARILLO}%.`,
          datoRespaldo: `${av.completadasCohorte} actividades completadas de ${av.totalActividades * g.totalAlumnos} posibles`,
          prioridad: 'alta',
          nivel: av.nivel,
        });
      } else if (av.estado === 'amarillo') {
        recos.push({
          tipo: 'NIVEL_BAJO',
          titulo: `${av.icono} Nivel ${av.nivel} · ${av.titulo} podría acelerarse`,
          descripcion: `${g.nombre} va en ${av.pctCompletion}% de avance en este nivel.`,
          datoRespaldo: `${av.completadasCohorte} actividades completadas de ${av.totalActividades * g.totalAlumnos} posibles`,
          prioridad: 'media',
          nivel: av.nivel,
        });
      }
    }
  }

  const mapa = mapaActividades();
  const porActividad = new Map<string, number[]>();
  for (const hist of Object.values(HISTORIAL_POR_ALUMNO)) {
    for (const i of hist) {
      const scores = porActividad.get(i.actividadId) ?? [];
      scores.push(i.score);
      porActividad.set(i.actividadId, scores);
    }
  }
  for (const [actId, scores] of porActividad) {
    if (scores.length < MIN_INTENTOS_DIFICIL) continue;
    const promedio = scores.reduce((s, x) => s + x, 0) / scores.length;
    if (promedio < SCORE_DIFICIL) {
      recos.push({
        tipo: 'ACTIVIDAD_DIFICIL',
        titulo: `${mapa.get(actId)?.titulo ?? actId} está costando trabajo`,
        descripcion: `Score promedio de ${Math.round(promedio)}/100 en ${scores.length} intentos de la cohorte.`,
        datoRespaldo: `${scores.filter((s) => s < SCORE_DIFICIL).length} de ${scores.length} intentos por debajo de ${SCORE_DIFICIL}`,
        prioridad: promedio < SCORE_MUY_DIFICIL ? 'alta' : 'media',
        nivel: nivelDeActividad(actId),
      });
    }
  }

  for (const a of ALUMNOS_DEMO) {
    if (a.diasSinActividad >= DIAS_RIESGO) {
      recos.push({
        tipo: 'ALUMNO_RIESGO',
        titulo: `${a.avatar} ${a.nombre} lleva ${a.diasSinActividad} días sin entrar`,
        descripcion: `Su última actividad registrada fue el ${a.ultimaActividadFecha ?? '—'}.`,
        datoRespaldo: `${a.actividadesCompletadas} actividades completadas en total, score promedio ${a.scorePromedio ?? '—'}`,
        prioridad: a.diasSinActividad >= DIAS_RIESGO_ALTO ? 'alta' : 'media',
        alumnoId: a.id,
      });
    }
  }

  const orden: Record<RecomendacionDocente['prioridad'], number> = { alta: 0, media: 1, baja: 2 };
  return recos.sort((x, y) => orden[x.prioridad] - orden[y.prioridad]);
}

// ─── Examen de posicionamiento ─────────────────────────────────────────────
//
// El algoritmo (búsqueda binaria adaptativa) y el banco de preguntas viven
// en `@/lib/posicionamiento` — compartidos con el examen del alumno. Este
// módulo sólo persiste el resultado ya calculado, con la misma clave por
// grupo que usaba el diseño anterior.

export function guardarResultadoPosicionamiento(resultado: ResultadoPosicionamiento): void {
  guardarPosicionamientoLocal(resultado.id, resultado);
}

export function getResultadoPosicionamiento(grupoId: string): ResultadoPosicionamiento | null {
  return leerPosicionamientoLocal<ResultadoPosicionamiento>(grupoId);
}
