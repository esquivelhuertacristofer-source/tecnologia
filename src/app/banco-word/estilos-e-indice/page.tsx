'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Entrada } from '@/components/activities/office/word/estilos-e-indice/Entrada';
import { Lab } from '@/components/activities/office/word/estilos-e-indice/Lab';
import { CenHubRoot } from '@/components/hub/shell';
import { inspeccionar, verificar } from '@/components/office/motor/paginador';

/**
 * Banco de pruebas de `of-word-estilos-e-indice` — /banco-word/estilos-e-indice.
 *
 * El laboratorio solo, sin anfitrión, con los eventos del contrato a la vista
 * en `data-avance` y `data-nota` para poder medirlos desde la sonda. Con
 * `?entrada=1` monta en su lugar la pantalla de entrada, que hasta que la clase
 * no esté en el registro de Office no tiene ninguna otra ruta por donde verse.
 *
 * Cuelga de la ventana el verificador **de producción** del paginador, no una
 * copia: medir con un instrumento distinto del que usa el motor es medir otra
 * cosa, y ya costó dos arreglos fallidos (§36.5).
 */
export default function BancoEstilosEIndice() {
  const [avance, setAvance] = useState(0);
  const [nota, setNota] = useState<string>('—');
  /* La URL se lee sin efecto: devuelve un booleano, así que la instantánea es
     estable y no encadena repintados. En el servidor no hay URL que mirar. */
  const conEntrada = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get('entrada') === '1',
    () => false,
  );

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

  const Pantalla = conEntrada ? Entrada : Lab;
  const pantalla = (
    <Pantalla
      config={{}}
      onProgress={setAvance}
      onScore={() => {}}
      onComplete={(r) => setNota(`score ${r.score} · ${r.stars}★ · ${r.errores} tropiezos`)}
    />
  );

  return (
    <>
      {/* La entrada se pinta dentro de `.cen-hub`, que es donde la monta el
          anfitrión de verdad: sus estilos viven ahí dentro y sin ese envoltorio
          se ve sin una sola regla puesta. El laboratorio no lo necesita —la
          ventana se cuelga del `<body>` con su propio CSS— y así se mide igual
          que en la clase canon. */}
      {conEntrada ? <CenHubRoot>{pantalla}</CenHubRoot> : pantalla}
      <div
        data-banco="1"
        data-avance={avance.toFixed(3)}
        data-nota={nota}
        style={{ position: 'fixed', bottom: 0, left: 0, width: 1, height: 1, overflow: 'hidden' }}
      />
    </>
  );
}
