'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { EntradaCoautoria } from '@/components/activities/office/word/coautoria/Entrada';
import { LabCoautoria } from '@/components/activities/office/word/coautoria/Lab';
import { taller } from '@/components/activities/office/word/coautoria/taller';
import { inspeccionar, verificar } from '@/components/office/motor/paginador';
// La plantilla de oro —fichas, CTA, ruta, escenario de Bit— se viste con la
// hoja del hub, que en producción la carga la sala. Aquí se importa sólo para
// poder VER la entrada en el banco; sin ella la pantalla sale sin una sola
// clase y no se puede juzgar. No se toca ese archivo, se lee.
import '@/components/hub/CenHub.css';

/**
 * Banco de pruebas de `of-word-coautoria` — /banco-word/coautoria.
 *
 * El laboratorio solo, sin entrada ni anfitrión, con los eventos del contrato a
 * la vista y el verificador **de producción** colgado de la ventana: la sonda
 * llama al mismo instrumento que usa el motor para paginar, y no a una copia
 * suya. Esa lección es de §36.5 y costó dos falsos positivos en una tarde.
 *
 * `__taller` expone el estado de esta clase —versiones, comentarios,
 * comparaciones— para poder comprobar desde fuera que un encargo se cumplió por
 * lo que pasó de verdad y no porque el panel lo pinte.
 *
 * Con `?entrada` se monta la ENTRADA en vez del laboratorio. La entrada no está
 * cableada al currículo todavía (ver `cableado`), así que sin esto no habría
 * ninguna forma de verla en el navegador, y una pantalla que no se ha visto no
 * está verificada.
 */
export default function PaginaBancoCoautoria() {
  // `useSearchParams` obliga a una frontera de suspense para poder prerenderizar.
  return (
    <Suspense fallback={null}>
      <Banco />
    </Suspense>
  );
}

function Banco() {
  const [avance, setAvance] = useState(0);
  const [nota, setNota] = useState<string>('—');
  const entrada = useSearchParams().has('entrada');

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
    w.__taller = () => {
      const e = taller.leer();
      return {
        versiones: e.versiones.map((v) => ({ id: v.id, nombre: v.nombre, autor: v.autor, mia: v.mia })),
        comentarios: e.comentarios.map((c) => ({ id: c.id, resuelto: c.resuelto })),
        comparacionesUtiles: e.comparacionesUtiles,
        restauracionesUtiles: e.restauracionesUtiles,
        paneles: {
          revisiones: e.panelRevisiones,
          versiones: e.panelVersiones,
          comparar: e.dialogoComparar,
          comparacion: Boolean(e.comparacion),
        },
        resumen: e.comparacion?.resumen ?? null,
      };
    };
  }, []);

  const Pantalla = entrada ? EntradaCoautoria : LabCoautoria;

  return (
    <>
      {/*
        `cen-hub` y el fondo navy los pone la sala en producción, y toda la hoja
        del hub cuelga de esa clase: sin ella la entrada se pinta sin una sola
        regla —lo comprobé en el navegador— y no habría manera de juzgarla.
      */}
      <div className={entrada ? 'cen-hub' : undefined} style={entrada ? { background: '#011126', minHeight: '100vh' } : undefined}>
        <Pantalla
          config={{}}
          onProgress={setAvance}
          onScore={() => {}}
          onComplete={(r) => setNota(`score ${r.score} · ${r.stars}★ · ${r.errores} tropiezos`)}
        />
      </div>
      <div
        data-banco="1"
        data-avance={avance.toFixed(3)}
        data-nota={nota}
        style={{ position: 'fixed', bottom: 0, left: 0, width: 1, height: 1, overflow: 'hidden' }}
      />
    </>
  );
}
