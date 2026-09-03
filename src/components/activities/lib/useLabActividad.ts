'use client';

/**
 * Tanda 0 · Pieza 2 — el arnés de sesión, extraído el 15-ago-2026
 * (CANON-ARMAZONES.md, «La otra deuda transversal»).
 *
 * Este bloque aparecía copiado —comentarios incluidos— en decenas de
 * laboratorios arcade: una `sim = useRef({ ocupado, errores, inicio })`, un
 * espejo `propsRef` para no cerrar sobre props viejas dentro de timers, la
 * fórmula de puntaje `100 − errores·6` con piso 60, y el trío
 * `avanzar/terminar/reiniciar` que habla con el contrato de actividad
 * (`onProgress`, `onScore`, `onComplete`). Confirmado por grep sobre
 * `src/components/activities`: el bloque `const sim = useRef({ ocupado` es
 * IDÉNTICO en 59 archivos.
 *
 * Lo que este hook NO hace, a propósito:
 *  - No sabe qué es un acierto ni un error de contenido: cada laboratorio
 *    sigue decidiendo cuándo llamar a `restar()`.
 *  - No posee `fase`, ni ningún otro estado propio de la mecánica de cada
 *    clase: eso se queda en el componente, que sigue leyendo/escribiendo su
 *    propio `vivo` (el espejo de SU estado) como antes.
 *  - No habla ni pone avisos: cada clase sigue llamando a `hablar(...)` y
 *    `setAviso(...)` en el punto exacto que ya tenía, para no reordenar
 *    efectos que el alumno oye o lee. `terminar()` y `reiniciar()` aceptan un
 *    callback opcional para intercalar ese efecto lab-específico en el mismo
 *    lugar donde vivía.
 *
 * `avanzar()` ya no lee el contador de pasos desde el `vivo` de cada
 * componente (dejaría de existir ahí): lleva su propio ref interno
 * (`pasosRef`), monótono y privado del hook, con el mismo efecto observable
 * — mismo `hechos`, mismo `onProgress(hechos / totalPasos)`, mismo valor de
 * retorno.
 *
 * `sim.current.ocupado` se sigue LEYENDO tal cual en cada guarda
 * (`if (sim.current.ocupado || …) return`), pero se ESCRIBE con `ocupar()` /
 * `liberar()` en vez de `sim.current.ocupado = true/false` directo: la regla
 * `react-hooks/immutability` del lint del proyecto no deja mutar un ref
 * devuelto por un hook desde fuera de él. Mismo dato, mismo sitio en el
 * ciclo de cada acción — sólo cambia el verbo.
 *
 * Dos laboratorios de los tres que lo adoptan hoy (`LabVirusYAntivirus`,
 * `LabNubeOLocal`, `LabAtrapaElPhishing`) comparten la fórmula
 * `Math.max(60, Math.min(100, 100 - errores * 6))` al carácter. Donde una
 * clase futura necesite otro piso u otra penalización, `opciones` los
 * recibe por parámetro — el hook no elige una fórmula y rompe la otra.
 *
 * Quedan sin migrar el resto de los ~59 laboratorios que usan esta forma
 * (y los que usan formas parecidas pero no idénticas, como el de
 * `LabRoperoDeLetras.tsx`, con su propio `fallosSeguidos` y su
 * `avanzarReto()` de varias ramas). Migrarlos todos de golpe sin control de
 * versiones es exactamente el riesgo que este encargo pidió evitar: se
 * deja para cuando cada uno se toque por su propio motivo.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActivityProps, ActivityResult } from '@/types/activity-contract';
import { reproducirTono } from '../n1/mision/audio';

export interface OpcionesLabActividad {
  /** Puntaje mínimo tras restar por errores. Todo lo medido hoy usa 60. */
  piso?: number;
  /** Puntos que resta cada error. Todo lo medido hoy usa 6. */
  penalizacionError?: number;
  /** Estrellas que reporta `terminar()`. Todo lo medido hoy usa 3. */
  estrellas?: number;
}

export interface SimLabActividad {
  ocupado: boolean;
  errores: number;
  inicio: number;
}

export interface LabActividad {
  /** Pasos resueltos hasta ahora (para pintar `pasoActual` en `ArcadeSala`). */
  pasos: number;
  terminado: boolean;
  tiempoFinal: number;
  erroresFinal: number;
  /**
   * El ref de sesión, para LEER (`sim.current.ocupado`, `.errores`,
   * `.inicio`) en los guardas de cada acción — exactamente como antes. Para
   * ESCRIBIR `.ocupado`, que es donde cada clase decide cuándo se ocupa y
   * cuándo se libera (los guardas de "¿ya estoy a media animación?" no son
   * genéricos), se usan `ocupar()`/`liberar()`: la regla `react-hooks/
   * immutability` no deja mutar un ref devuelto por un hook desde fuera de
   * él, así que la escritura se queda dentro de estas dos funciones.
   */
  sim: React.MutableRefObject<SimLabActividad>;
  /** Marca la sesión como ocupada (a media animación). */
  ocupar: () => void;
  /** Libera la sesión. */
  liberar: () => void;
  /** Espejo de `props` para leer dentro de closures de timers sin quedar viejo. */
  propsRef: React.MutableRefObject<ActivityProps>;
  puntaje: () => number;
  /** Resta un error, suena el tono y reporta el puntaje nuevo. */
  restar: () => void;
  /** Avanza un paso, reporta el avance y devuelve el total de pasos hechos. */
  avanzar: () => number;
  /**
   * Cierra la actividad: tono, puntaje, `onProgress(1)`, `onScore` y
   * `onComplete`. `antesDeSonar` corre ANTES del tono — el hueco exacto
   * donde cada clase hoy llama a `hablar(...)`, para no invertir el orden
   * sonido→voz que ya tenían.
   */
  terminar: (tiempoSegundos: number, antesDeSonar?: () => void) => number;
  /**
   * Reinicia lo que el arnés posee (el `sim`, `pasos`, `terminado`,
   * `tiempoFinal`, `erroresFinal`, `onProgress(0)`, `onScore(100)`).
   * `alReiniciar` corre al final — el hueco donde cada clase pone su propio
   * `hablar(LINEAS.inicio)` y el resto de sus resets de estado.
   */
  reiniciar: (alReiniciar?: () => void) => void;
}

/**
 * `m:ss`, duplicada tal cual en decenas de laboratorios. Se exporta suelta,
 * no colgada del hook, porque es una función pura sin estado.
 */
export function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function useLabActividad(
  props: ActivityProps,
  totalPasos: number,
  opciones?: OpcionesLabActividad,
): LabActividad {
  const piso = opciones?.piso ?? 60;
  const penalizacion = opciones?.penalizacionError ?? 6;
  const estrellas = opciones?.estrellas ?? 3;

  const [pasos, setPasos] = useState(0);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const sim = useRef<SimLabActividad>({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const pasosRef = useRef(0);

  useEffect(() => {
    propsRef.current = props;
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const ocupar = useCallback(() => {
    sim.current.ocupado = true;
  }, []);

  const liberar = useCallback(() => {
    sim.current.ocupado = false;
  }, []);

  const puntaje = useCallback(
    () => Math.max(piso, Math.min(100, 100 - sim.current.errores * penalizacion)),
    [piso, penalizacion],
  );

  const restar = useCallback(() => {
    reproducirTono('error');
    sim.current.errores += 1;
    propsRef.current.onScore(puntaje());
  }, [puntaje]);

  const avanzar = useCallback(() => {
    const hechos = pasosRef.current + 1;
    pasosRef.current = hechos;
    setPasos(hechos);
    propsRef.current.onProgress(hechos / totalPasos);
    return hechos;
  }, [totalPasos]);

  const terminar = useCallback(
    (tiempoSegundos: number, antesDeSonar?: () => void) => {
      reproducirTono('complete');
      antesDeSonar?.();
      const score = puntaje();
      propsRef.current.onProgress(1);
      propsRef.current.onScore(score);
      const resultado: ActivityResult = {
        score,
        stars: estrellas,
        xp: score,
        errores: sim.current.errores,
        tiempoSegundos,
      };
      propsRef.current.onComplete(resultado);
      setTiempoFinal(tiempoSegundos);
      setErroresFinal(sim.current.errores);
      setTerminado(true);
      return score;
    },
    [puntaje, estrellas],
  );

  const reiniciar = useCallback((alReiniciar?: () => void) => {
    sim.current = { ocupado: false, errores: 0, inicio: Date.now() };
    pasosRef.current = 0;
    setPasos(0);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    propsRef.current.onProgress(0);
    propsRef.current.onScore(100);
    alReiniciar?.();
  }, []);

  return {
    pasos,
    terminado,
    tiempoFinal,
    erroresFinal,
    sim,
    ocupar,
    liberar,
    propsRef,
    puntaje,
    restar,
    avanzar,
    terminar,
    reiniciar,
  };
}
