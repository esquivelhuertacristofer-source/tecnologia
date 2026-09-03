'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { dmSans, manrope } from '@/app/fonts';
import { EntradaPlantillas } from '@/components/activities/office/word/plantillas/Entrada';
import { ESTADO } from '@/components/activities/office/word/plantillas/estado';
import { LabPlantillas } from '@/components/activities/office/word/plantillas/Lab';
import { inspeccionar, verificar } from '@/components/office/motor/paginador';
import '@/components/hub/CenHub.css';

/**
 * Banco de pruebas de `of-word-plantillas` — /banco-word/plantillas.
 *
 * El laboratorio solo, sin anfitrión, con los eventos del contrato a la vista y
 * el verificador **de producción** colgado de la ventana. Lo segundo no es
 * comodidad: la lección de §36.5 es que una sonda con su propia copia de la
 * medición se queda atrás respecto al motor y canta defectos que no existen.
 *
 * Se expone además el estado de la clase —encabezado, pie, número, plantilla—
 * porque nada de eso vive en el documento y sin ello no hay forma de comprobar
 * desde fuera que el encabezado se escribió una vez y salió en las tres hojas.
 *
 * Con `?entrada` se monta la ENTRADA en vez del laboratorio. Hace falta porque
 * la clase todavía no está en `registroOffice`, así que no existe ninguna ruta
 * del hub por la que ver su pantalla de entrada, y una entrada sin abrir es una
 * entrada sin verificar: basta una ruta de importación mal escrita para que
 * reviente en el navegador sin que el compilador diga nada. Va envuelta en
 * `.cen-hub` porque todo `CenHub.css` vive bajo ese ámbito y las tipografías
 * viajan en variables que pone el armazón del hub; sin la envoltura la entrada
 * se pinta desnuda, y eso no sería un fallo suyo sino la falta de su anfitrión.
 * La ventana de Word no se entera: se cuelga del `<body>` por un portal.
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
    w.__estadoPlantillas = () => ({ ...ESTADO });
  }, []);

  const Montado = conEntrada ? EntradaPlantillas : LabPlantillas;

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
export default function PaginaBancoPlantillas() {
  return (
    <Suspense fallback={null}>
      <Banco />
    </Suspense>
  );
}
