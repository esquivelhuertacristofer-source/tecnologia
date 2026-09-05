'use client';

/**
 * Estudio de impacto — el registro de adopción docente (§10).
 *
 * No pinta nada. Va montado en el layout de `/hub/docente`, así que cubre las
 * siete pantallas del panel sin tocar ninguna, y apunta una vista cada vez que
 * el docente cambia de sección.
 *
 * UNA VISTA POR RUTA, NO POR RENDER. Un panel de React se vuelve a pintar
 * muchas veces —cada dato que llega, cada estado que cambia— y contar eso como
 * «vistas del panel» daría una cifra de adopción inventada. El `ref` guarda la
 * última ruta apuntada y sólo escribe cuando de verdad cambia.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { registrarAccionDocente } from '@/lib/estudio/bitacora';

export default function BitacoraDocente() {
  const ruta = usePathname();
  const ultima = useRef<string | null>(null);

  useEffect(() => {
    if (!ruta || ultima.current === ruta) return;
    ultima.current = ruta;
    // La ruta no lleva datos personales: es `/hub/docente/alumnos`, no un
    // nombre. La pantalla de detalle de alumno usa un id, y ése es el que la
    // propia pantalla apunta como `accion_sobre_alumno` si hace falta.
    registrarAccionDocente('vista_panel_grupo', ruta);
  }, [ruta]);

  return null;
}
