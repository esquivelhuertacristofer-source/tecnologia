'use client';

import { useEffect, useState } from 'react';
import { Lab } from '@/components/activities/office/word/p-la-fila-guia/Lab';
import { inspeccionar, verificar } from '@/components/office/motor/paginador';

/**
 * Banco de pruebas de `p-la-fila-guia` — /banco-word/p-la-fila-guia.
 *
 * El laboratorio solo, sin entrada ni anfitrión, con los eventos del contrato
 * colgados de un nodo medible. Y el verificador de PRODUCCIÓN en
 * `window.__verificarTextos`, no una copia: medir con un instrumento distinto
 * del que se usa es medir otra cosa (§36.5).
 */
export default function PaginaBancoFilaGuia() {
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
        onComplete={(r) => setNota(`score ${r.score} · ${r.stars}★ · ${r.errores} errores`)}
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
