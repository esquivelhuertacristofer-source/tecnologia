'use client';

import { useEffect, useRef, useState } from 'react';
import type { Diseno } from '@/components/simuladores/diseno';

/**
 * El motor de pasos de las tres clases de Tecnia Diseño (documento §54).
 *
 * El armazón (`simuladores/diseno`) no corrige — da hechos. Esto es la otra
 * mitad: una lista de encargos y una `comprueba` por encargo que lee el
 * `Diseno` entero (documento + historia), así que una clase puede exigir no
 * sólo «¿quedó bien?» sino «¿lo hiciste con la herramienta?»
 * (`vecesQueUso`), exactamente lo que separa estas clases de un juguete.
 *
 * ── Por qué el aviso vive en un efecto con su propio ref, y no en un
 *    actualizador de estado ──
 *
 * React en modo estricto invoca dos veces el cuerpo de un efecto en su
 * primer montaje. Si `onAvance` corriera dentro de un `setIndice(i => ...)`,
 * sonaría dos veces por paso. Aquí se guarda el último documento YA
 * evaluado (por identidad: los comandos devuelven el mismo objeto cuando no
 * cambian nada) y una segunda pasada sobre el mismo documento no hace nada.
 *
 * ── LA PAREJA (documento, índice), no sólo el documento ────────────────────
 *
 * Medido con `n6-edita-imagen-y-video` (DISEÑO §Parte 2, trampa 2): esta
 * clase encadena OCHO encargos sobre un solo documento, y una misma acción
 * puede cerrar más de un encargo seguido (el encargo 3 se satisface con la
 * MISMA acción de recortar que ya había cerrado el encargo 2 sobre la foto
 * nítida). El guardián viejo comparaba sólo `evaluado.current === d.documento`:
 * en cuanto un documento ya se había juzgado UNA vez, una segunda pasada con
 * el `indice` ya avanzado se descartaba sin mirar el paso nuevo, y el guion
 * se quedaba colgado hasta que el alumno tocara algo más. El guardián es
 * ahora la PAREJA `(documento, índice)`: sigue avisando una sola vez en modo
 * estricto (la pareja es la misma en la segunda pasada) y ahora los encargos
 * se resuelven en cascada, uno por pasada del efecto.
 */

export interface PasoGuionDiseno {
  id: string;
  titulo: string;
  instruccion: string;
  pista: string;
  /** Lee el estado entero: documento (el resultado) e historia (el proceso). */
  comprueba: (d: Diseno) => boolean;
  aprendido: string;
}

export interface EstadoGuionDiseno {
  indice: number;
  actual: PasoGuionDiseno | null;
  terminado: boolean;
}

export function useGuionDiseno(
  d: Diseno,
  pasos: readonly PasoGuionDiseno[],
  opciones: { onAvance: (paso: PasoGuionDiseno, indice: number) => void; onTerminado: () => void },
): EstadoGuionDiseno {
  const [indice, setIndice] = useState(0);
  const [terminado, setTerminado] = useState(false);
  const evaluado = useRef<{ doc: unknown; indice: number }>({ doc: null, indice: -1 });
  const { onAvance, onTerminado } = opciones;

  useEffect(() => {
    if (terminado) return;
    // Ya se juzgó ESTA pareja (documento, índice): no el mismo documento a secas,
    // porque una acción puede cerrar dos encargos seguidos sin que el alumno
    // vuelva a tocar nada — ver la nota de arriba.
    if (evaluado.current.doc === d.documento && evaluado.current.indice === indice) return;
    evaluado.current = { doc: d.documento, indice };
    const paso = pasos[indice];
    if (!paso || !paso.comprueba(d)) return;
    onAvance(paso, indice);
    const siguiente = indice + 1;
    setIndice(siguiente);
    if (siguiente >= pasos.length) {
      setTerminado(true);
      onTerminado();
    }
    // Reacciona a cada documento nuevo; `pasos` es un literal estable por clase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, indice, terminado]);

  return { indice, actual: pasos[indice] ?? null, terminado };
}

/** La tarjeta del encargo en curso, para el `panel` de `VentanaDiseno`. */
export function TarjetaPaso({ paso, numero, total }: { paso: PasoGuionDiseno | null; numero: number; total: number }) {
  if (!paso) return null;
  return (
    <div className="dsg-tarjeta" data-testid="dsg-tarjeta" data-paso={paso.id}>
      <span className="dsg-tarjeta-kicker">
        Encargo {numero} de {total}
      </span>
      <h3 className="dsg-tarjeta-titulo">{paso.titulo}</h3>
      <p className="dsg-tarjeta-instruccion">{paso.instruccion}</p>
      <p className="dsg-tarjeta-pista">💡 {paso.pista}</p>
    </div>
  );
}
