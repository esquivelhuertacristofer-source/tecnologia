'use client';

import { useEffect, useState } from 'react';
import { LabLaCinta } from '@/components/activities/office/word/LabLaCinta';
import { inspeccionar, verificar } from '@/components/office/motor/paginador';

/** Banco de pruebas: el laboratorio solo, con los eventos del contrato a la vista. */
export default function BancoWord() {
  const [avance, setAvance] = useState(0);
  const [nota, setNota] = useState<string>('—');

  /*
   * El verificador de PRODUCCIÓN, colgado de la ventana para que la sonda lo
   * llame en vez de traer su propia copia de la medición. Dos veces en una
   * tarde la copia se quedó atrás respecto al motor y dio falsos positivos:
   * medir con un instrumento distinto del que se usa es medir otra cosa.
   */
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
      <LabLaCinta
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
