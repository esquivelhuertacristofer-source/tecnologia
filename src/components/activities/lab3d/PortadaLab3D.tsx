'use client';

/**
 * La portada de objetivos de las clases de volumen (documento §53.4, 2).
 *
 * **Entrar a un laboratorio sin saber el tema ni el objetivo está declarado
 * defecto de la casa.** Office lo resuelve con `PortadaPractica`, y las nueve
 * clases de páginas web con `PortadaWeb`; ninguna de las dos sirve fuera de su
 * chrome porque sus clases CSS van con él. El armazón `laboratorio3d` tampoco la
 * trae —es un banco de piezas, no una clase—, así que la pone el chasis.
 *
 * Trae exactamente la misma información que las otras dos, ni una casilla más:
 * situación, tema, al terminar, lo que vas a hacer, y los tres datos —cuántos
 * pasos, cuántos minutos y qué insignia—.
 *
 * No es un motor de plantillas: no sabe qué se enseña, no corrige y no decide
 * nada. Recibe siete textos y un botón.
 */

import { useEffect, useRef, type CSSProperties } from 'react';
import './lab3d-clases.css';

export interface DatosPortadaLab3D {
  /** Dónde está el alumno, en una frase. */
  situacion: string;
  /** El tema, en titular. Es lo que se lee más grande. */
  tema: string;
  /** Qué sabrá hacer al terminar. Empieza por un verbo. */
  objetivo: string;
  /** Los pasos de la clase, en orden y en segunda persona. */
  vasAHacer: string[];
  pasos: number;
  minutos: number;
  insignia: { nombre: string; emoji: string };
  /** El texto del botón. */
  boton: string;
  /** Color pleno de la clase. Manda en el borde, el brillo y el botón. */
  acento: string;
}

export function PortadaLab3D({ portada, onEmpezar }: { portada: DatosPortadaLab3D; onEmpezar: () => void }) {
  const boton = useRef<HTMLButtonElement | null>(null);

  /* El foco va al botón y Enter/Escape lo pulsan: la portada no se puede
   * convertir en una pantalla que hay que cazar con el ratón. Mismo trato que
   * `PortadaPractica` de Office y `PortadaWeb`. */
  useEffect(() => {
    const id = requestAnimationFrame(() => boton.current?.focus());
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        onEmpezar();
      }
    };
    window.addEventListener('keydown', teclas);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('keydown', teclas);
    };
  }, [onEmpezar]);

  return (
    <div
      className="lb3-portada"
      role="dialog"
      aria-modal="true"
      aria-label="Objetivos de la clase"
      data-testid="lb3-portada"
      style={{ '--acento': portada.acento } as CSSProperties}
    >
      <div className="lb3-portada-caja">
        <p className="lb3-portada-situacion">{portada.situacion}</p>
        <h2 className="lb3-portada-tema">{portada.tema}</h2>

        <div className="lb3-portada-objetivo">
          <span className="lb3-portada-etiqueta">Al terminar</span>
          <p>{portada.objetivo}</p>
        </div>

        <div className="lb3-portada-cuerpo">
          <div className="lb3-portada-lista">
            <span className="lb3-portada-etiqueta">Lo que vas a hacer</span>
            <ol>
              {portada.vasAHacer.map((linea) => (
                <li key={linea}>{linea}</li>
              ))}
            </ol>
          </div>

          <div className="lb3-portada-datos">
            <span className="lb3-portada-dato">
              <b>{portada.pasos}</b> pasos
            </span>
            <span className="lb3-portada-dato">
              <b>{portada.minutos}</b> minutos
            </span>
            <span className="lb3-portada-dato">
              <b aria-hidden="true">{portada.insignia.emoji}</b> {portada.insignia.nombre}
            </span>
          </div>
        </div>

        <button type="button" ref={boton} className="lb3-portada-empezar" onClick={onEmpezar} data-testid="lb3-empezar">
          {portada.boton}
        </button>
        <p className="lb3-portada-pie">Puedes pulsar Enter para empezar.</p>
      </div>
    </div>
  );
}

export default PortadaLab3D;
