'use client';

/**
 * Laboratorio de dos hojas.
 *
 * El alumno entra al laboratorio y recibe las dos cosas a la vez: a la
 * izquierda la página educativa del tema (fotografías reales, como la
 * landing) y a la derecha el simulador 3D, vivo y jugable. Entre las dos hay
 * un riel con un mando de tres posiciones para repartir el espacio; el mando
 * vive dentro del riel, que es el mueble que separa las hojas, y no flota
 * encima de la escena.
 *
 * El simulador de N1·U1 es three.js con raycast de verdad (`laboratorio.ts`)
 * y su bucle de redimensionado sólo escucha `window.resize`. Al mover el
 * mando cambia el panel, no la ventana, así que aquí se observa el panel y se
 * emite ese mismo evento — si no, la cámara conserva el aspecto viejo y la
 * escena sale estirada.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import './lab-dos-hojas.css';

type Reparto = 'lectura' | 'mitad' | 'laboratorio';

const POSICIONES: { id: Reparto; etiqueta: string; icono: ReactNode }[] = [
  {
    id: 'lectura',
    etiqueta: 'Más espacio para leer',
    icono: <IconoReparto pagina={12} sim={5} />,
  },
  {
    id: 'mitad',
    etiqueta: 'Mitad y mitad',
    icono: <IconoReparto pagina={8.5} sim={8.5} />,
  },
  {
    id: 'laboratorio',
    etiqueta: 'Más espacio para el laboratorio',
    icono: <IconoReparto pagina={5} sim={12} />,
  },
];

/** Dibuja el reparto que aplica el botón: dos hojas, una junto a la otra. */
function IconoReparto({ pagina, sim }: { pagina: number; sim: number }) {
  return (
    <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width={pagina} height="12" rx="1.6" fill="currentColor" opacity="0.45" />
      <rect x={pagina + 2} y="1" width={sim} height="12" rx="1.6" fill="currentColor" opacity="0.95" />
    </svg>
  );
}

export function LaboratorioDosHojas({
  pagina,
  simulador,
}: {
  pagina: ReactNode;
  simulador: ReactNode;
}) {
  const [reparto, setReparto] = useState<Reparto>('mitad');
  const panelSim = useRef<HTMLDivElement>(null);
  const raiz = useRef<HTMLDivElement>(null);

  /* La barra de navegación de la actividad es `sticky` y se pinta por encima
     del laboratorio (se midió: 1600×73 tapando el antetítulo de la página y
     el HUD del simulador). En vez de pelear con el z-index —el laboratorio
     vive dentro de un ancestro con su propio contexto de apilamiento, así que
     subirlo no sirve— el laboratorio empieza justo debajo de ella. Se mide en
     vivo porque el alto de la barra cambia con el ancho de la pantalla. */
  useEffect(() => {
    const barra = document.querySelector<HTMLElement>('.topbar');
    const medir = () => {
      const caja = raiz.current;
      if (!caja) return;
      let alto = 0;
      if (barra) {
        const posicion = getComputedStyle(barra).position;
        if (posicion === 'sticky' || posicion === 'fixed') {
          alto = Math.max(0, Math.round(barra.getBoundingClientRect().bottom));
        }
      }
      caja.style.setProperty('--lab2-top', `${alto}px`);
    };
    medir();
    window.addEventListener('resize', medir);
    /* Con el laboratorio abierto no hay nada que desplazar detrás, y si el
       documento se desplazara la barra sticky se despegaría dejando un hueco
       en la cabecera del laboratorio. */
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('resize', medir);
      document.body.style.overflow = overflowPrevio;
    };
  }, []);

  /* El simulador se redimensiona con window.resize. Como aquí lo que cambia
     de tamaño es el panel y no la ventana, se lo avisamos nosotros. El rAF
     evita el aviso de bucle de ResizeObserver y agrupa los avisos de un mismo
     fotograma durante la transición del reparto. */
  useEffect(() => {
    const panel = panelSim.current;
    if (!panel) return;
    let pendiente = 0;
    const avisar = () => {
      if (pendiente) return;
      pendiente = requestAnimationFrame(() => {
        pendiente = 0;
        window.dispatchEvent(new Event('resize'));
      });
    };
    const observador = new ResizeObserver(avisar);
    observador.observe(panel);
    return () => {
      observador.disconnect();
      if (pendiente) cancelAnimationFrame(pendiente);
    };
  }, []);

  /* Un último aviso al posarse la transición: durante la interpolación el
     panel llega a su medida final con el último fotograma ya pintado, y
     conviene que la cámara acabe exactamente en ese aspecto. */
  const alTerminarTransicion = useCallback(() => {
    window.dispatchEvent(new Event('resize'));
  }, []);

  return (
    <div className="lab2" ref={raiz} data-reparto={reparto} onTransitionEnd={alTerminarTransicion}>
      <div className="lab2-pagina">{pagina}</div>

      <div className="lab2-riel">
        <div className="lab2-mando" role="group" aria-label="Repartir el espacio entre la página y el laboratorio">
          {POSICIONES.map((posicion) => (
            <button
              key={posicion.id}
              type="button"
              aria-pressed={reparto === posicion.id}
              aria-label={posicion.etiqueta}
              title={posicion.etiqueta}
              onClick={() => setReparto(posicion.id)}
            >
              {posicion.icono}
            </button>
          ))}
        </div>
      </div>

      <div className="lab2-sim" ref={panelSim}>
        {simulador}
      </div>
    </div>
  );
}
