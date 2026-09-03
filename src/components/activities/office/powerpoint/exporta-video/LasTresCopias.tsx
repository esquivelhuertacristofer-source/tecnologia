'use client';

import { useSyncExternalStore } from 'react';
import type { PanelDeClaseProps } from '@/components/office/VentanaDiapositivas';
import {
  comoPeso,
  comoTiempo,
  cuantasAnimaciones,
  cuantosMultimedia,
  archivoDe,
  leerSalida,
  segundosDelMazo,
  suscribir,
} from '../comun/salida';
import './lasTresCopias.css';

/**
 * **Las tres copias** — el panel de clase de `of-ppt-exporta-video` (§43.7).
 *
 * Una tabla de tres columnas —PDF, video y `.pptx`— con lo que cada una
 * conserva. Es un instrumento pedagógico y no una parte de PowerPoint, igual
 * que el mapa de §43.5 y el panel de herencia de §43.4: por eso está siempre
 * abierto y no tiene botón en la cinta.
 *
 * ── LO QUE LO HACE ENSEÑABLE ────────────────────────────────────────────────
 *
 * **Todo se deriva de ESTA presentación.** No dice «el PDF pierde las
 * animaciones» en abstracto: dice cuántas pierde de las tuyas, cuánto dura tu
 * video y cuánto pesa cada copia tuya. Una tabla con las mismas cifras para
 * todo el mundo sería un cartel, y un cartel se lee una vez y no se mira más.
 *
 * Y las filas de peso salen en cuanto el archivo existe, no antes: la columna
 * de un formato que todavía no se ha sacado dice «todavía no», que es la
 * verdad, en vez de una estimación que el alumno confundiría con un hecho.
 */

const useSalida = () => useSyncExternalStore(suscribir, leerSalida, leerSalida);

interface Fila {
  que: string;
  pdf: boolean;
  video: boolean;
  pptx: boolean;
  /** El detalle que sale debajo, ya contado sobre este mazo. */
  cuantos?: number;
}

export function LasTresCopias({ mazo }: PanelDeClaseProps) {
  useSalida();
  const anims = cuantasAnimaciones(mazo);
  const multi = cuantosMultimedia(mazo);

  const filas: Fila[] = [
    { que: 'Se ve igual en cualquier aparato', pdf: true, video: true, pptx: false },
    { que: 'Conserva las animaciones', pdf: false, video: true, pptx: true, cuantos: anims },
    { que: 'Conserva el sonido y el video', pdf: false, video: true, pptx: true, cuantos: multi },
    { que: 'Se puede seguir editando', pdf: false, video: false, pptx: true },
  ];

  const peso = (f: 'pdf' | 'video' | 'pptx') => {
    const a = archivoDe(f);
    return a ? comoPeso(a.kb) : '—';
  };

  return (
    <div className="ltc">
      <table className="ltc-tabla">
        <thead>
          <tr>
            <th scope="col" className="ltc-que" />
            <th scope="col">PDF</th>
            <th scope="col">Video</th>
            <th scope="col">.pptx</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.que}>
              <th scope="row" className="ltc-que">
                {f.que}
                {/*
                  El número de ESTA presentación, y sale sólo si hay algo que
                  contar: «pierde las animaciones (0)» es una pérdida que no se
                  nota, y una lección que no se ve.
                */}
                {f.cuantos !== undefined && f.cuantos > 0 && (
                  <small> · tienes {f.cuantos}</small>
                )}
              </th>
              {(['pdf', 'video', 'pptx'] as const).map((c) => (
                <td key={c} className={f[c] ? 'es-si' : 'es-no'} data-celda={`${c}`}>
                  {f[c] ? '✓' : '✕'}
                </td>
              ))}
            </tr>
          ))}
          <tr className="ltc-peso">
            <th scope="row" className="ltc-que">
              Lo que pesa la tuya
            </th>
            <td data-peso="pdf">{peso('pdf')}</td>
            <td data-peso="video">{peso('video')}</td>
            <td data-peso="pptx">{peso('pptx')}</td>
          </tr>
        </tbody>
      </table>

      <p className="ltc-duracion" data-duracion>
        Si sacas el video, durará <b>{comoTiempo(segundosDelMazo(mazo))}</b> —
        {mazo.diapositivas.some((d) => d.intervalo)
          ? ' los intervalos que dejaste al ensayarla.'
          : ' cinco segundos por diapositiva, porque todavía no la has ensayado.'}
      </p>

      <p className="ltc-regla">
        <b>PDF</b> para que la <b>lean</b>. <b>Video</b> para que la <b>vean</b> sin ti. <b>.pptx</b> sólo para
        quien vaya a <b>editarla</b>. El guion está en para qué es, no en cuál es mejor.
      </p>
    </div>
  );
}

export default LasTresCopias;
