'use client';

/**
 * Estudio de impacto — telemetría de una clase, enganchada en el host (§5).
 *
 * Un solo hook, usado por los dos hosts de actividad, mide las 235 clases sin
 * tocar ninguna de ellas.
 *
 * EL EVENTO DIFÍCIL ES `abandono`. Saber cuántos alumnos EMPIEZAN una clase y
 * no la terminan es de los datos más valiosos del estudio —dice qué clases se
 * atragantan— y es el que más fácil se pierde, porque ocurre justo cuando el
 * alumno cierra la pestaña. Se cubre por dos vías:
 *
 *   · la limpieza del efecto, que cubre navegar a otra página dentro de la
 *     plataforma (lo normal);
 *   · `pagehide`, que cubre cerrar la pestaña o el navegador. NO se usa
 *     `beforeunload` ni `unload`: los navegadores móviles no los disparan de
 *     forma fiable, y `pagehide` sí.
 *
 * El evento se encola, no se manda: mandarlo con `fetch` en ese instante no
 * llegaría, la página ya se está muriendo. Se queda en IndexedDB y sale en la
 * siguiente visita, que es para lo que existe la cola.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { IdentidadEstudio } from '@/lib/estudio/identidad';
import { identidadLocal } from '@/lib/estudio/identidad';
import { identidadActual } from '@/lib/estudio/sesion';
import { registrarEvento, registrarItem, type Resultado } from '@/lib/estudio/telemetria';

interface Devuelve {
  identidad: IdentidadEstudio | null;
  /** La actividad terminó bien. Corta el `abandono`. */
  marcarFin: (resultado?: { score?: number; errores?: number }) => void;
  /** Un ítem dentro de la actividad, si la actividad los reporta. */
  marcarItem: (item: { itemId: string; acierto: boolean | null; tiempoMs?: number; intentos?: number }) => void;
}

export function useTelemetriaActividad(actividadId: string): Devuelve {
  const [identidad, setIdentidad] = useState<IdentidadEstudio | null>(null);
  const inicio = useRef<number>(Date.now());
  const termino = useRef(false);
  // La identidad se guarda también en un ref porque el `abandono` se dispara
  // desde la limpieza del efecto, donde el estado ya no vale nada.
  const quien = useRef<IdentidadEstudio | null>(null);

  useEffect(() => {
    let vivo = true;
    inicio.current = Date.now();
    termino.current = false;

    // El identificador local está disponible al instante; el de cuenta llega
    // después. Se arranca con el local para no perder el `inicio` de un alumno
    // que abre la clase y la cierra en tres segundos.
    const provisional = identidadLocal();
    quien.current = provisional;
    setIdentidad(provisional);
    registrarEvento(provisional, { actividadId, tipo: 'inicio' });

    void identidadActual().then((real) => {
      if (!vivo) return;
      quien.current = real;
      setIdentidad(real);
    });

    const abandonar = () => {
      if (termino.current || !quien.current) return;
      termino.current = true; // que no se cuente dos veces
      registrarEvento(quien.current, {
        actividadId,
        tipo: 'abandono',
        tiempoMs: Date.now() - inicio.current,
        resultado: -1,
      });
    };

    window.addEventListener('pagehide', abandonar);
    return () => {
      vivo = false;
      window.removeEventListener('pagehide', abandonar);
      abandonar();
    };
  }, [actividadId]);

  const marcarFin = useCallback((resultado?: { score?: number; errores?: number }) => {
    if (termino.current || !quien.current) return;
    termino.current = true;
    registrarEvento(quien.current, {
      actividadId,
      tipo: 'fin',
      tiempoMs: Date.now() - inicio.current,
      // Terminar una clase de Tecnia es haberla resuelto: el contrato sólo
      // llama a `onComplete` cuando la actividad se da por buena.
      resultado: 1 as Resultado,
      intentos: resultado?.errores == null ? null : resultado.errores + 1,
    });
  }, [actividadId]);

  const marcarItem = useCallback<Devuelve['marcarItem']>((item) => {
    if (!quien.current) return;
    registrarItem(quien.current, actividadId, item);
  }, [actividadId]);

  return { identidad, marcarFin, marcarItem };
}
