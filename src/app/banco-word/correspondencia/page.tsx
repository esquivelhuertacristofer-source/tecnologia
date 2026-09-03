'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { dmSans, manrope } from '@/app/fonts';
import { Entrada } from '@/components/activities/office/word/correspondencia/Entrada';
import { Lab } from '@/components/activities/office/word/correspondencia/Lab';
import { leer } from '@/components/activities/office/word/correspondencia/estado';
import { inspeccionar, verificar } from '@/components/office/motor/paginador';
import '@/components/hub/CenHub.css';

/**
 * Banco de pruebas de `of-word-correspondencia` — /banco-word/correspondencia.
 *
 * El laboratorio solo, sin anfitrión, con los eventos del contrato a la vista y
 * el verificador **de producción** colgado de la ventana. Lo segundo no es
 * comodidad: la lección de §36.5 es que una sonda con su propia copia de la
 * medición se queda atrás respecto al motor y canta defectos que no existen.
 *
 * Se expone además el estado de la combinación —lista, índice, si la vista
 * previa está encendida— porque nada de eso vive en el documento y sin ello no
 * hay forma de comprobar desde fuera que «pasar de destinatario» hizo lo que
 * dice.
 *
 * Con `?entrada` se monta la ENTRADA en vez del laboratorio, envuelta en
 * `.cen-hub` porque todo `CenHub.css` vive bajo ese ámbito: sin la envoltura la
 * entrada se pinta desnuda, y eso no sería un fallo suyo sino la falta de su
 * anfitrión. La ventana de Word no se entera: se cuelga del `<body>` por un
 * portal.
 */
function Banco() {
  const [avance, setAvance] = useState(0);
  const [nota, setNota] = useState<string>('—');
  const conEntrada = useSearchParams().has('entrada');

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
    w.__estadoCorrespondencia = () => {
      const e = leer();
      return {
        destinatarios: e.destinatarios.map((d) => ({ ...d })),
        indice: e.indice,
        previsualizando: e.previsualizando,
        dialogo: e.dialogo,
        conMolde: e.molde !== null,
        conResultado: e.resultado !== null,
      };
    };
  }, []);

  const Montado = conEntrada ? Entrada : Lab;

  return (
    <>
      <div className={`cen-hub ${dmSans.variable} ${manrope.variable}`}>
        <Montado
          config={{}}
          onProgress={setAvance}
          onScore={() => {}}
          onComplete={(r) => setNota(`score ${r.score} · ${r.stars}★ · ${r.errores} tropiezos`)}
        />
      </div>
      <div
        data-banco="1"
        data-modo={conEntrada ? 'entrada' : 'lab'}
        data-avance={avance.toFixed(3)}
        data-nota={nota}
        style={{ position: 'fixed', bottom: 0, left: 0, width: 1, height: 1, overflow: 'hidden' }}
      />
    </>
  );
}

// `useSearchParams` obliga a una frontera de Suspense en el App Router; sin
// ella, la página entera se saldría del renderizado estático con un aviso.
export default function PaginaBancoCorrespondencia() {
  return (
    <Suspense fallback={null}>
      <Banco />
    </Suspense>
  );
}
