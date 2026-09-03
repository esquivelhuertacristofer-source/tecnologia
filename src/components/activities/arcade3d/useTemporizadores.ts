'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Temporizadores con limpieza automática al desmontar.
 *
 * Los Labs arcade encadenan muchos `setTimeout` para animaciones de avance,
 * avisos de ronda y transiciones. Antes cada Lab llamaba `window.setTimeout`
 * suelto: si el alumno salía de la actividad a mitad de una transición, el
 * callback seguía vivo y podía llamar `setState` sobre un componente
 * desmontado (warning de React) o disparar audio fantasma. Este hook centraliza
 * el registro de temporizadores y los cancela TODOS en el cleanup del efecto,
 * de una sola vez, para todo Lab que lo use (N2 y N3).
 *
 * Uso:
 *   const timers = useTemporizadores();
 *   timers.despues(() => setAviso(null), 1600);   // como setTimeout
 *   timers.limpiar();                             // cancela pendientes (p. ej. al repetir)
 */
export interface Temporizadores {
  /** Programa un callback; devuelve el id por si quieres cancelarlo puntualmente. */
  despues: (fn: () => void, ms: number) => number;
  /** Cancela un temporizador puntual por id. */
  cancelar: (id: number) => void;
  /** Cancela TODOS los temporizadores pendientes (no desmonta el hook). */
  limpiar: () => void;
}

export function useTemporizadores(): Temporizadores {
  const pendientes = useRef<Set<number>>(new Set());
  // API estable entre renders (creada una sola vez con el inicializador perezoso
  // de useState). Las closures capturan el objeto ref `pendientes`, nunca leen
  // `.current` en render, así que no viola react-hooks/refs.
  const [api] = useState<Temporizadores>(() => ({
    despues: (fn, ms) => {
      const id = window.setTimeout(() => {
        pendientes.current.delete(id);
        fn();
      }, ms);
      pendientes.current.add(id);
      return id;
    },
    cancelar: (id) => {
      window.clearTimeout(id);
      pendientes.current.delete(id);
    },
    limpiar: () => {
      pendientes.current.forEach((id) => window.clearTimeout(id));
      pendientes.current.clear();
    },
  }));

  useEffect(() => {
    const set = pendientes.current;
    return () => {
      set.forEach((id) => window.clearTimeout(id));
      set.clear();
    };
  }, []);

  return api;
}
