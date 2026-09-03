'use client';

import { useCallback, useEffect, useRef } from 'react';
import { reproducirTono } from '../n1/mision/audio';
import './salaCodigo.css';

/**
 * LA PORTADA DE OBJETIVOS DE LAS CLASES DE TECNIA CÓDIGO
 *
 * Lo que se ve ANTES del editor. Existe por la misma razón que la de Office
 * (`office/chrome/piezas.tsx`, §36.3.1): entrar a un laboratorio sin saber de
 * qué tema es la clase ni qué se espera de uno está declarado defecto, y un
 * maestro puede repartir el enlace directo del laboratorio sin pasar por la
 * entrada.
 *
 * No se importa la de Office **a propósito**: vive en `src/components/office/`,
 * atada al CSS `txtw-*` de las tres ventanas de esa suite y a su
 * `PortadaClase` con `esRepaso`/`guardado`, que aquí no significan nada porque
 * estas clases no guardan documento. Lo que se copia es la información —
 * situación, tema, al terminar, lo que vas a hacer, cuántos encargos, minutos e
 * insignia—, que es lo que el cliente pidió, no las clases de CSS.
 *
 * Es un componente **tonto**: todo entra por parámetro y no sabe de qué clase
 * es la portada. Por eso se comparte desde el primer día entre las tres sin
 * riesgo de abstracción prematura: no hay nada que abstraer, es un cartel.
 *
 * El teclado: el botón se enfoca solo y **Enter** entra. `Escape` NO entra
 * —al revés que en Office— porque aquí la tecla de escape ya tiene oficio
 * dentro del editor (Esc y luego Tab es la única salida del `<textarea>` para
 * quien no usa ratón) y enseñarle al alumno que Esc «acepta» sería enseñarle
 * lo contrario dos pantallas después.
 */

export interface DatosPortadaCodigo {
  /** Dónde está el alumno y por qué abre esto. Una o dos frases. */
  situacion: string;
  /** El tema de la clase, en titular. */
  tema: string;
  /** Qué sabrá hacer al terminar. */
  objetivo: string;
  /** Los hitos de la sesión, en orden. Tres o cuatro. */
  vasAHacer: string[];
}

export interface PortadaCodigoProps {
  portada: DatosPortadaCodigo;
  /** «saludo.py». El alumno tiene que saber qué archivo va a abrir. */
  archivo: string;
  encargos: number;
  minutos: number;
  insignia: { nombre: string; emoji: string };
  onEmpezar: () => void;
}

export function PortadaCodigo({
  portada,
  archivo,
  encargos,
  minutos,
  insignia,
  onEmpezar,
}: PortadaCodigoProps) {
  const boton = useRef<HTMLButtonElement | null>(null);

  const empezar = useCallback(() => {
    reproducirTono('select');
    onEmpezar();
  }, [onEmpezar]);

  useEffect(() => {
    const id = requestAnimationFrame(() => boton.current?.focus());
    const teclas = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      empezar();
    };
    window.addEventListener('keydown', teclas);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('keydown', teclas);
    };
  }, [empezar]);

  return (
    <div className="pyc-portada" role="dialog" aria-modal="true" aria-label="Objetivos de la práctica" data-testid="pyc-portada">
      <div className="pyc-portada-caja">
        <p className="pyc-portada-situacion">{portada.situacion}</p>
        <h2 className="pyc-portada-tema">{portada.tema}</h2>

        <div className="pyc-portada-objetivo">
          <span className="pyc-portada-etiqueta">Al terminar</span>
          <p>{portada.objetivo}</p>
        </div>

        <div className="pyc-portada-cuerpo">
          <div className="pyc-portada-lista">
            <span className="pyc-portada-etiqueta">Lo que vas a hacer</span>
            <ol>
              {portada.vasAHacer.map((linea) => (
                <li key={linea}>{linea}</li>
              ))}
            </ol>
          </div>

          <div className="pyc-portada-lado">
            <div className="pyc-portada-datos">
              <span>
                <b>{encargos}</b> encargos
              </span>
              <span>
                <b>{minutos}</b> min
              </span>
            </div>
            <div className="pyc-portada-insignia">
              <span className="pyc-portada-insignia-glifo" aria-hidden="true">
                {insignia.emoji}
              </span>
              <span className="pyc-portada-insignia-nombre">Insignia · {insignia.nombre}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          ref={boton}
          className="pyc-portada-boton"
          data-testid="pyc-empezar"
          onClick={empezar}
        >
          <span className="pyc-portada-boton-glifo" aria-hidden="true">
            🐍
          </span>
          Abrir {archivo}
        </button>
      </div>
    </div>
  );
}

export default PortadaCodigo;
