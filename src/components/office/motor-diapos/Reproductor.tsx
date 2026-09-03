'use client';

import { useEffect, useRef, useState } from 'react';
import type { Libre } from './modelo';

/**
 * El video de una diapositiva (§43.3).
 *
 * **No hay archivo.** Es la misma decisión que el sonido de §42.2 y por el
 * mismo motivo: lo que la clase enseña de un video es que **es tiempo tuyo que
 * se va**, y para enseñar eso hace falta que su duración sea de verdad, que se
 * vea correr y que cuente en la hoja de intervalos. Las imágenes de dentro no
 * añadirían ni una idea, y sí un megabyte por segundo.
 *
 * Lo que sí es de verdad:
 *   · la duración, que es el dato del que vive la clase;
 *   · la barra, que corre en tiempo real —veinte segundos son veinte segundos,
 *     y ver eso dentro de una presentación de noventa es la lección entera—;
 *   · el letrero de arranque, que dice sin adornos si va a saltar solo.
 */

export const RELOJ = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`;

export function Reproductor({ libre, titulo }: { libre: Libre; titulo?: string }) {
  const total = libre.segundos ?? 0;
  const [va, setVa] = useState(false);
  const [t, setT] = useState(0);
  /*
   * El reloj vive en una `ref` y se limpia al desmontar por lo mismo que el del
   * sonido: un intervalo que sigue latiendo cuando el alumno ya salió del
   * laboratorio es exactamente lo que nadie sabe de dónde viene.
   */
  const tic = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!va) return undefined;
    tic.current = setInterval(() => {
      setT((x) => {
        if (x + 0.25 >= total) {
          setVa(false);
          return 0;
        }
        return x + 0.25;
      });
    }, 250);
    return () => {
      if (tic.current) clearInterval(tic.current);
    };
  }, [total, va]);

  return (
    <span className="dpw-video" data-video={libre.id}>
      <span className="dpw-video-tela" aria-hidden="true" />
      <button
        type="button"
        className={`dpw-video-play${va ? ' es-va' : ''}`}
        data-video-play={libre.id}
        aria-label={va ? 'Pausar el video' : 'Reproducir el video'}
        /*
         * El `pointerdown` NO se para, aunque el altavoz de §42.2 sí lo pare.
         * Aquí el botón ocupa el centro del objeto, así que pararlo dejaba el
         * video imposible de seleccionar: pinchar en medio de un video lo ponía
         * a andar y nunca lo elegía, y sin elegirlo no aparece «Reproducción» y
         * el encargo de ponerlo al clic no se puede ni intentar. Se vio jugando.
         * Dejándolo pasar, el mismo clic elige el objeto y toca el botón, que es
         * lo que hace PowerPoint.
         */
        onClick={() => setVa((x) => !x)}
      >
        {va ? '❚❚' : '▶'}
      </button>
      <span className="dpw-video-pie">
        <b>{titulo ?? libre.contenido}</b>
        <span className="dpw-video-barra">
          <i style={{ width: `${total ? (t / total) * 100 : 0}%` }} />
        </span>
        <span className="dpw-video-reloj">
          {RELOJ(t)} / {RELOJ(total)}
        </span>
      </span>
      {/*
        El letrero de arranque va DENTRO del video y no en un panel: es lo que
        el encargo pide cambiar, y un ajuste que sólo se ve abriendo otra cosa
        es un ajuste que el alumno no mira. En rojo cuando arranca solo, porque
        arrancar solo es el defecto, no una opción más.
      */}
      <span className={`dpw-video-arranque${libre.alClic ? ' es-clic' : ''}`}>
        {libre.alClic ? '👆 Al hacer clic' : '⚠ Arranca solo'}
      </span>
    </span>
  );
}

export default Reproductor;
