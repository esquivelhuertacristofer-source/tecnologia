'use client';

import { useEffect, useState } from 'react';
import { dmSans, manrope } from '@/app/fonts';
import { inspeccionar, verificar } from '@/components/office/motor/paginador';
import '@/components/hub/CenHub.css';
import { Entrada } from './Entrada';
import { Lab } from './Lab';

/**
 * Banco de pruebas de `of-word-parrafos-que-respiran`.
 *
 * Monta el laboratorio solo, sin anfitrión, y deja a la vista los eventos del
 * contrato en un nodo de un píxel para poder leerlos desde la sonda.
 *
 * El verificador que cuelga de la ventana es el de PRODUCCIÓN, no una copia: la
 * lección de §36.5 es que medir con un instrumento distinto del que usa el motor
 * es medir otra cosa, y dos veces en una tarde la copia dio falsos positivos.
 *
 * `conEntrada` monta la ENTRADA en vez del laboratorio. Hace falta porque la
 * clase todavía no está en `registroOffice`, así que no hay ninguna ruta del hub
 * por la que ver su pantalla de entrada, y una entrada sin abrir es una entrada
 * sin verificar: basta una ruta de importación mal escrita para que reviente en
 * el navegador sin que el compilador diga nada.
 */
export default function BancoParrafosQueRespiran({ conEntrada = false }: { conEntrada?: boolean }) {
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

  const Montado = conEntrada ? Entrada : Lab;

  return (
    <>
      {/*
        Todo `CenHub.css` vive bajo el ámbito `.cen-hub`, y las tipografías
        viajan en variables que pone el armazón del hub. Sin esta envoltura la
        entrada se pinta desnuda —y no sería un fallo suyo, sino que le falta su
        anfitrión—. La ventana de Word no se entera: se cuelga del `<body>` por
        un portal, así que ni hereda de aquí ni le estorba.
      */}
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
        data-avance={avance.toFixed(3)}
        data-nota={nota}
        style={{ position: 'fixed', bottom: 0, left: 0, width: 1, height: 1, overflow: 'hidden' }}
      />
    </>
  );
}
