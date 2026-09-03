/**
 * Planeación didáctica — capa de consultas.
 *
 * Única puerta de entrada: la página SOLO llama estas funciones, nunca lee
 * `contenido.ts`/`CURRICULO` directamente (misma disciplina que
 * `docente/queries.ts` y `posicionamiento/motor.ts`). El día que la
 * planeación tenga más contenido que el piloto de una unidad, esta es la
 * única capa que crece — la página no cambia.
 *
 * ── EL BLOQUE OFFICE, DESDE EL 2-sep-2026 ─────────────────────────────────
 *
 * Hasta esa fecha las 38 clases exclusivas de Office **no podían tener plan de
 * clase, y no por falta de contenido sino por cómo estaba escrito este
 * archivo**: `getPlanDeClase` resolvía el nivel y la unidad recorriendo
 * `CURRICULO`, y esas clases viven aparte a propósito, en `EJERCICIOS_OFFICE`,
 * porque no pertenecen a ningún nivel (el porqué está escrito en
 * `data/curriculo.ts`, junto a esa constante). Así que aunque alguien
 * escribiera su plan, la función devolvía `null` y el planeador no lo enseñaba
 * jamás. Un hueco de arquitectura, no un hueco de trabajo.
 *
 * La forma de arreglarlo sin inventarles un nivel falso: estas funciones ya no
 * devuelven `UnidadCurricular`/`NivelCurricular` crudos, sino la forma que la
 * página realmente pinta —un id, un título, una etiqueta y dos cuentas—. Con
 * eso, una unidad de nivel y una sala de Office se listan igual sin que
 * ninguna de las dos tenga que mentir sobre lo que es: la de nivel se etiqueta
 * «Nivel 7», la de Office «Bloque Office».
 */

import { CURRICULO, OFFICE_CURRICULO, EJERCICIOS_OFFICE, type AppOfficeId } from '@/data/curriculo';
import { getActividadRegistrada } from '@/components/activities/registry';
import { REGISTRO_OFFICE } from '@/components/activities/office/registroOffice';
import { PLANES_DE_CLASE } from './contenido';
import type { PlanDeClase } from './tipos';

/** Prefijo de los ids de sala de Office, para no escribirlo suelto en cinco sitios. */
const SALA = 'office:';

const NOMBRE_GRADO: Record<string, string> = {
  basico: 'grado básico',
  intermedio: 'grado intermedio',
  avanzado: 'grado avanzado',
};

export interface UnidadConPlaneacion {
  /** `n7-python-1` para una unidad de nivel, `office:word` para una sala. */
  id: string;
  titulo: string;
  /** «Nivel 7» o «Bloque Office» — lo que va bajo el título en la lista. */
  etiqueta: string;
  /** Cuántas actividades tiene en total. */
  total: number;
  /** Cuántas de ellas ya tienen plan de clase escrito. */
  conPlan: number;
}

/** Las clases exclusivas de una sala de Office que además están construidas. */
function ejerciciosDeSala(app: AppOfficeId) {
  return EJERCICIOS_OFFICE.filter((e) => e.app === app && e.id in REGISTRO_OFFICE);
}

/** Sólo las unidades y salas con AL MENOS una actividad ya planeada — es lo que se navega hoy. */
export function getUnidadesConPlaneacion(): UnidadConPlaneacion[] {
  const resultado: UnidadConPlaneacion[] = [];

  for (const nivel of CURRICULO) {
    for (const unidad of nivel.unidades) {
      const conPlan = unidad.actividades.filter((a) => a.id in PLANES_DE_CLASE).length;
      if (conPlan > 0) {
        resultado.push({
          id: unidad.id,
          titulo: unidad.titulo,
          etiqueta: `Nivel ${nivel.n}`,
          total: unidad.actividades.length,
          conPlan,
        });
      }
    }
  }

  for (const app of OFFICE_CURRICULO) {
    const clases = ejerciciosDeSala(app.id);
    const conPlan = clases.filter((e) => e.id in PLANES_DE_CLASE).length;
    if (conPlan > 0) {
      resultado.push({
        id: `${SALA}${app.id}`,
        titulo: app.nombre,
        etiqueta: 'Bloque Office',
        total: clases.length,
        conPlan,
      });
    }
  }

  return resultado;
}

export interface ActividadConPlaneacion {
  id: string;
  titulo: string;
  icono?: string;
  duracionMin: number;
  tienePlan: boolean;
}

/** Todas las actividades de una unidad o sala, marcando cuáles ya tienen plan (para no ocultar las que faltan). */
export function getActividadesDeUnidad(unidadId: string): ActividadConPlaneacion[] {
  if (unidadId.startsWith(SALA)) {
    const app = unidadId.slice(SALA.length) as AppOfficeId;
    return ejerciciosDeSala(app).map((e) => ({
      id: e.id,
      titulo: e.titulo,
      icono: e.icono,
      duracionMin: REGISTRO_OFFICE[e.id]?.meta.duracionMin ?? 0,
      tienePlan: e.id in PLANES_DE_CLASE,
    }));
  }

  const nivel = CURRICULO.find((n) => n.unidades.some((u) => u.id === unidadId));
  const unidad = nivel?.unidades.find((u) => u.id === unidadId);
  if (!unidad) return [];

  return unidad.actividades.map((a) => {
    const registrada = getActividadRegistrada(a.id);
    return {
      id: a.id,
      titulo: a.titulo,
      icono: a.icono,
      duracionMin: registrada?.meta.duracionMin ?? 0,
      tienePlan: a.id in PLANES_DE_CLASE,
    };
  });
}

export interface PlanDeClaseResuelto extends PlanDeClase {
  titulo: string;
  /**
   * Dónde vive la clase, en una línea ya escrita: «Nivel 7 · 1.º de Secundaria»
   * o «Bloque Office · grado intermedio». Se resuelve aquí y no en la página
   * porque una clase de nivel y una de Office se sitúan con datos distintos, y
   * ése es exactamente el tipo de diferencia que no debe subir a la vista.
   */
  encabezado: string;
  unidadTitulo: string;
  duracionMin: number;
}

/** El plan de una actividad, con lo que hace falta del currículo ya resuelto — o `null` si no existe. */
export function getPlanDeClase(actividadId: string): PlanDeClaseResuelto | null {
  const plan = PLANES_DE_CLASE[actividadId];
  if (!plan) return null;

  if (actividadId.startsWith('of-')) {
    const ejercicio = EJERCICIOS_OFFICE.find((e) => e.id === actividadId);
    const registrada = REGISTRO_OFFICE[actividadId];
    if (!ejercicio || !registrada) return null;
    const app = OFFICE_CURRICULO.find((a) => a.id === ejercicio.app);
    return {
      ...plan,
      titulo: registrada.meta.titulo,
      encabezado: `Bloque Office · ${app?.nombre ?? ejercicio.app} · ${NOMBRE_GRADO[ejercicio.grado] ?? ejercicio.grado}`,
      unidadTitulo: app?.nombre ?? ejercicio.app,
      duracionMin: registrada.meta.duracionMin,
    };
  }

  const registrada = getActividadRegistrada(actividadId);
  const nivel = CURRICULO.find((n) => n.unidades.some((u) => u.actividades.some((a) => a.id === actividadId)));
  const unidad = nivel?.unidades.find((u) => u.actividades.some((a) => a.id === actividadId));
  if (!registrada || !nivel || !unidad) return null;

  return {
    ...plan,
    titulo: registrada.meta.titulo,
    encabezado: `Nivel ${nivel.n} · ${nivel.grado} · ${unidad.titulo}`,
    unidadTitulo: unidad.titulo,
    duracionMin: registrada.meta.duracionMin,
  };
}
