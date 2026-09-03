/**
 * TECNIA DISEÑO · la cinta (línea de tiempo)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Paso 0 de `n6-edita-imagen-y-video` (DISEÑO-N6-edita-imagen-y-video.md,
 * Parte 2 §1). Datos y funciones puras, sin React, con la misma disciplina
 * de `modelo.ts` y `consultas.ts`: **el tiempo va en SEGUNDOS ENTEROS**. Ni
 * un decimal, por la misma razón que la rejilla del lienzo: en cuanto haya
 * medios segundos, «cuadra con la música» necesita una tolerancia, y una
 * tolerancia inventada es la casa diciéndole al alumno que algo cuadra
 * cuando no cuadra.
 *
 * ── LA DECISIÓN IRREVERSIBLE: LOS CORTES VAN PEGADOS ────────────────────
 *
 * No hay campo `inicio` por corte. **El orden del array ES el orden en el
 * tiempo**, exactamente la misma decisión que «el orden Z es el orden del
 * array» en `modelo.ts`, y por el mismo motivo: con `inicio` existen los
 * huecos, los solapes y dos cortes reclamando el segundo 7, y ninguna de las
 * tres cosas se puede corregir sin inventar una regla nueva. Sin él, «mover
 * un clip» es «cambiar de sitio en una lista» — la misma operación que el
 * alumno ya aprendió con las capas.
 *
 * ── LOS IDS DE CORTE SON ÚNICOS EN TODA LA CINTA ─────────────────────────
 *
 * No por pista: en toda la cinta. Es lo que permite que `cortesImposibles`
 * devuelva una lista plana de ids, igual que `sueltas()` en `consultas.ts`,
 * y lo que hace que un componente que sólo tiene el id de un corte (sin
 * saber en qué pista vive) pueda encontrarlo buscando en todas.
 */

import type { Documento, Recurso } from './modelo';

/** Un corte nunca baja de un segundo: sin esto se puede perder de la vista. */
export const MIN_DUR = 1;

export interface Corte {
  id: string;
  /** id de un `Recurso` del banco del documento. */
  recurso: string;
  /** Desde qué segundo del original empieza lo que se usa. Entero >= 0. */
  desde: number;
  /** Cuántos segundos se usan. Entero >= MIN_DUR, y desde + dura <= recurso.segundos. */
  dura: number;
}

export type TipoPista = 'video' | 'audio';

export interface Pista {
  id: string;
  tipo: TipoPista;
  nombre: string;
  /** EN ORDEN Y PEGADOS: el orden del array ES el orden en el tiempo. */
  cortes: Corte[];
  silenciada?: boolean;
}

/* ── lecturas ─────────────────────────────────────────────────────────────── */

export const pistaDe = (doc: Documento, pista: string): Pista | null =>
  (doc.cinta ?? []).find((p) => p.id === pista) ?? null;

export function corteDe(doc: Documento, pista: string, corte: string): Corte | null {
  return pistaDe(doc, pista)?.cortes.find((c) => c.id === corte) ?? null;
}

export const cortesDe = (doc: Documento, pista: string): Corte[] => pistaDe(doc, pista)?.cortes ?? [];

/**
 * En qué segundo empieza ese corte: la suma de lo que dura todo lo que va
 * antes en la lista. `-1` si el corte no está en esa pista. Toma la `Pista`
 * ya resuelta —no el documento— porque es lo único que necesita: así lo
 * puede llamar un componente de presentación que sólo tiene la cinta.
 */
export function inicioDe(pista: Pista, corte: string): number {
  let acumulado = 0;
  for (const c of pista.cortes) {
    if (c.id === corte) return acumulado;
    acumulado += c.dura;
  }
  return -1;
}

export const duracionDe = (doc: Documento, pista: string): number =>
  cortesDe(doc, pista).reduce((s, c) => s + c.dura, 0);

/** El máximo de todas las pistas: cuánto dura el montaje entero. */
export function duracionTotal(doc: Documento): number {
  return (doc.cinta ?? []).reduce((max, p) => Math.max(max, duracionDe(doc, p.id)), 0);
}

/** Qué corte se ve u oye en ese segundo, o `null` si cae en un hueco. */
export function corteEn(pista: Pista, segundo: number): Corte | null {
  let acumulado = 0;
  for (const c of pista.cortes) {
    if (segundo >= acumulado && segundo < acumulado + c.dura) return c;
    acumulado += c.dura;
  }
  return null;
}

/** Cuánto del original quedó fuera del corte. `0` si el corte o el recurso no están. */
export function sobranteDe(doc: Documento, pista: string, corte: string): number {
  const c = corteDe(doc, pista, corte);
  if (!c) return 0;
  const rec = doc.banco[c.recurso];
  if (!rec || rec.segundos === undefined) return 0;
  return rec.segundos - c.dura;
}

/**
 * `duracionDe(audio) − duracionDe(video)`. **0 = cuadra**, entero con signo.
 * Busca las pistas por `tipo` y no por id: dos clases distintas pueden
 * nombrar sus pistas distinto y la pregunta «¿cuadra la música?» no debe
 * depender de cómo se llamen.
 */
export function descuadre(doc: Documento): number {
  const cinta = doc.cinta ?? [];
  const audio = cinta.find((p) => p.tipo === 'audio');
  const video = cinta.find((p) => p.tipo === 'video');
  return (audio ? duracionDe(doc, audio.id) : 0) - (video ? duracionDe(doc, video.id) : 0);
}

/** Los ids de recurso en el orden en que están en la pista. */
export const ordenDeRecursos = (doc: Documento, pista: string): string[] =>
  cortesDe(doc, pista).map((c) => c.recurso);

/**
 * Los cortes que se pasan del original o cuyo recurso ya no está en el
 * banco (o dejó de tener `segundos`). **Debe ser siempre vacío**; se cuenta
 * en `verificar()`, igual que `sueltas()` cuenta las capas que se salieron
 * de la rejilla.
 */
export function cortesImposibles(doc: Documento): string[] {
  const malos: string[] = [];
  for (const p of doc.cinta ?? []) {
    for (const c of p.cortes) {
      const rec: Recurso | undefined = doc.banco[c.recurso];
      const cabe =
        !!rec && rec.segundos !== undefined && c.desde >= 0 && c.dura >= MIN_DUR && c.desde + c.dura <= rec.segundos;
      if (!cabe) malos.push(c.id);
    }
  }
  return malos;
}

/* ── escrituras (inmutables, mismo molde que `conPagina`/`conCapa`) ────────── */

/** Cambia la cinta entera. Devuelve el MISMO documento si `f` no tocó nada. */
export function conCinta(doc: Documento, f: (cinta: Pista[]) => Pista[]): Documento {
  const antes = doc.cinta ?? [];
  const cinta = f(antes);
  return cinta === antes ? doc : { ...doc, cinta };
}

/** Cambia una pista. Devuelve el MISMO documento si esa pista no existe. */
export function conPista(doc: Documento, pista: string, f: (p: Pista) => Pista): Documento {
  return conCinta(doc, (cinta) => {
    let tocada = false;
    const nueva = cinta.map((p) => {
      if (p.id !== pista) return p;
      tocada = true;
      return f(p);
    });
    return tocada ? nueva : cinta;
  });
}
