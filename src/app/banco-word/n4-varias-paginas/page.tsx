'use client';

import { useEffect, useState } from 'react';
import { Lab } from '@/components/activities/office/word/n4-varias-paginas/Lab';
import { inspeccionar, verificar } from '@/components/office/motor/paginador';

/**
 * Banco de pruebas de `n4-documento-de-varias-paginas` — /banco-word/n4-varias-paginas.
 *
 * Copia del banco de la sala (`BancoWord.tsx`) apuntando a esta clase: el
 * laboratorio solo, sin entrada ni anfitrión, con los eventos del contrato a la
 * vista y el verificador del motor colgado de la ventana.
 *
 * El verificador es el de PRODUCCIÓN a propósito. Dos veces en una tarde una
 * copia de la medición se quedó atrás respecto al motor y dio falsos positivos:
 * medir con un instrumento distinto del que se usa es medir otra cosa (§36.8 G).
 */
export default function PaginaBancoVariasPaginas() {
  const [avance, setAvance] = useState(0);
  const [nota, setNota] = useState<string>('—');

  useEffect(() => {
    const flujo = () => document.querySelector<HTMLElement>('.txtw-flujo');
    const w = window as unknown as Record<string, unknown>;
    w.__verificarTextos = () => {
      const f = flujo();
      return f ? verificar(f) : null;
    };
    // El reparto de renglones, para diagnosticar POR QUÉ una hoja está mal.
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
