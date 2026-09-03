'use client';

import { useEffect, useState } from 'react';
import { Lab } from '@/components/activities/office/word/p-dale-formato/Lab';
import { inspeccionar, verificar } from '@/components/office/motor/paginador';

/**
 * Banco de pruebas de `n3-dale-formato` sobre Tecnia Textos — /banco-word/p-dale-formato.
 *
 * Monta el laboratorio solo, sin entrada ni anfitrión, y deja los eventos del
 * contrato en un nodo de un píxel para poder leerlos desde la sonda.
 *
 * El verificador que cuelga de la ventana es el de PRODUCCIÓN y no una copia:
 * la lección de §36.5 es que medir con un instrumento distinto del que usa el
 * motor es medir otra cosa, y dos veces en una tarde la copia dio falsos
 * positivos. No está enlazado desde el hub: es instrumento de trabajo.
 */
export default function PaginaBancoDaleFormato() {
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
