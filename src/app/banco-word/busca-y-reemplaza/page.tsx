'use client';

import { useEffect, useState } from 'react';
import { Lab } from '@/components/activities/office/word/busca-y-reemplaza/Lab';
import { inspeccionar, verificar } from '@/components/office/motor/paginador';

/**
 * Banco de pruebas de `of-word-busca-y-reemplaza` — /banco-word/busca-y-reemplaza.
 *
 * Monta el laboratorio solo, sin entrada ni anfitrión, y cuelga de la ventana el
 * verificador DE PRODUCCIÓN del paginador. La sonda no trae su propia copia de
 * la medición: ya pasó dos veces que la copia se quedara atrás respecto al motor
 * y diera falsos positivos (§36.5).
 */
export default function PaginaBancoBuscaYReemplaza() {
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
