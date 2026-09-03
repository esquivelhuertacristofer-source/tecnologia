'use client';

/**
 * Corrige el recorte horizontal de los rigs 3D en viewports angostos
 * (teléfono en vertical) — F-responsive, fase 1.
 *
 * `<Canvas camera={{ fov }}>` fija el FOV VERTICAL; fiber sólo ajusta
 * `aspect` (ancho/alto del lienzo) solo, así que el FOV HORIZONTAL depende
 * del aspecto y se desploma en retrato (aspecto ~0.5): el mueble, afinado a
 * ojo en desktop (aspecto ancho), queda cortado por los costados. Medido con
 * el laberinto del mouse a 390px: piezas pegadas al borde del lienzo.
 *
 * La corrección: por debajo de aspecto 1 (cuadrado), sube el FOV vertical lo
 * necesario para que el FOV HORIZONTAL nunca caiga por debajo de su valor en
 * aspecto 1 — así el ancho del mueble nunca se recorta más de lo que ya se
 * recortaría en un cuadro cuadrado. En desktop (aspecto ≥ 1) no cambia nada:
 * cero riesgo sobre el encuadre ya afinado y verificado ahí.
 *
 * No toca la distancia de la cámara a propósito: los paneles de mecánica son
 * billboards `<Html>` de tamaño fijo en px (ver RigArcade3D/RigEscena), y
 * acercar/alejar la cámara los desalinearía del mueble — por eso el propio
 * rig deshabilita el zoom del alumno. Cambiar sólo el FOV evita ese problema.
 */

import { useEffect } from 'react';
import { useStore, useThree } from '@react-three/fiber';

function fovHorizontalACorregido(fovBaseGrados: number, aspecto: number): number {
  if (aspecto >= 1) return fovBaseGrados;
  const fovBaseRad = (fovBaseGrados * Math.PI) / 180;
  const fovNuevoRad = 2 * Math.atan(Math.tan(fovBaseRad / 2) / aspecto);
  return (fovNuevoRad * 180) / Math.PI;
}

export function useCamaraResponsiva(fovBase: number) {
  const store = useStore();
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useEffect(() => {
    // Lectura imperativa (no reactiva) a propósito: mutar `camera.fov` es el
    // patrón normal de three.js/r3f, pero el valor que entrega `useThree()`
    // como resultado de hook no se puede reasignar bajo la regla de
    // inmutabilidad de hooks. `store.getState()` es el escape hatch oficial
    // de r3f para esto (mismo store, lectura fuera de la suscripción
    // reactiva) — el efecto igual se re-dispara con cada resize porque
    // `width`/`height` (arriba) sí son reactivos.
    const camera = store.getState().camera;
    if (!('fov' in camera) || height === 0) return;
    camera.fov = fovHorizontalACorregido(fovBase, width / height);
    camera.updateProjectionMatrix();
  }, [store, width, height, fovBase]);
}

/** Se monta como hijo directo de `<Canvas>`; no dibuja nada. */
export function CamaraResponsiva({ fov }: { fov: number }) {
  useCamaraResponsiva(fov);
  return null;
}
