'use client';

import { useEffect, useState } from 'react';
import { Lab } from '@/components/activities/office/word/p-formas-y-wordart/Lab';
import { inspeccionar, verificar } from '@/components/office/motor/paginador';

/**
 * Banco de pruebas de `n4-formas-y-wordart` — /banco-word/p-formas-y-wordart.
 *
 * El laboratorio solo, sin entrada ni anfitrión, con los eventos del contrato a
 * la vista en `data-avance` y `data-nota` para poder medirlos desde la sonda.
 *
 * Cuelga de la ventana el verificador **de producción** del paginador, no una
 * copia: medir con un instrumento distinto del que usa el motor es medir otra
 * cosa, y ya costó dos arreglos fallidos (§36.5).
 *
 * `.txtw-flujo` sale dos veces en el DOM cuando la vista de una página está
 * abierta —la copia de la vista previa lleva la misma clase para heredar el
 * aspecto del documento—, pero la copia se pinta DESPUÉS en el árbol, así que
 * `querySelector` devuelve siempre el editor de verdad. Aun así, la paginación
 * se mide con la vista cerrada.
 */
export default function BancoFormasYWordArt() {
  const [avance, setAvance] = useState(0);
  const [nota, setNota] = useState<string>('—');

  useEffect(() => {
    const flujo = () => document.querySelector<HTMLElement>('.txtw-flujo');
    const w = window as unknown as Record<string, unknown>;
    w.__verificarTextos = () => {
      const f = flujo();
      return f ? verificar(f) : null;
    };
    w.__renglonesTextos = () => {
      const f = flujo();
      return f ? inspeccionar(f) : null;
    };
  }, []);

  return (
    <>
      <Lab
        config={{}}
        onProgress={setAvance}
        onScore={() => {}}
        onComplete={(r) => setNota(`score ${r.score} · ${r.stars}★ · ${r.errores} tropiezos`)}
      />
      <div
        data-banco="1"
        data-avance={avance.toFixed(3)}
        data-nota={nota}
        style={{ position: 'fixed', bottom: 0, left: 0, width: 1, height: 1, overflow: 'hidden' }}
      />
    </>
  );
}
