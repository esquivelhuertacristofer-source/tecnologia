'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Sonda de medición de escenas 3D (regla «medir, no adivinar»).
 *
 * Colocar una pieza en su sitio dentro de una escena en perspectiva no se puede
 * hacer a ojo ni con la regla de tres del alto de un panel: cada `<Html>` vive a
 * una z distinta y la escala en píxeles cambia con la profundidad. Esta sonda
 * publica en `window` la proyección real de la cámara viva para que una prueba
 * de navegador pueda preguntar «¿en qué píxel cae el punto (x, y, z) del mundo?»
 * y «¿dónde está en pantalla la celda 3×3 del cajón?».
 *
 * Sólo se monta fuera de producción y no dibuja nada: es un instrumento, no una
 * pieza de la escena.
 *
 * Una malla se declara medible poniéndole `userData={{ sonda: 'celda:3x3' }}`.
 */
declare global {
  interface Window {
    __proy?: (x: number, y: number, z: number) => { x: number; y: number };
    __puntos?: () => Record<string, { x: number; y: number }>;
  }
}

export function SondaEscena3D() {
  const { camera, gl, scene, size } = useThree();

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    const proyectar = (v: THREE.Vector3) => {
      const r = gl.domElement.getBoundingClientRect();
      const p = v.clone().project(camera);
      return {
        x: Math.round(r.left + (p.x * 0.5 + 0.5) * r.width),
        y: Math.round(r.top + (-p.y * 0.5 + 0.5) * r.height),
      };
    };

    window.__proy = (x, y, z) => proyectar(new THREE.Vector3(x, y, z));

    window.__puntos = () => {
      const out: Record<string, { x: number; y: number }> = {};
      scene.traverse((o) => {
        const etiqueta = o.userData?.sonda;
        if (typeof etiqueta !== 'string') return;
        const mundo = new THREE.Vector3();
        o.getWorldPosition(mundo);
        out[etiqueta] = proyectar(mundo);
      });
      return out;
    };

    return () => {
      delete window.__proy;
      delete window.__puntos;
    };
  }, [camera, gl, scene, size]);

  return null;
}

export default SondaEscena3D;
