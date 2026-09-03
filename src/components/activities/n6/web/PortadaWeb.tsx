'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import './paginasWeb.css';

/**
 * La portada de objetivos de las clases de páginas web (documento §51.4, 1).
 *
 * **Entrar a un laboratorio sin saber el tema ni el objetivo está declarado
 * defecto de la casa.** Office lo resuelve con `PortadaPractica`
 * (`office/chrome/piezas.tsx`), pero esa pieza vive dentro del chrome de
 * Office y sus clases CSS (`txtw-*`) van con él; fuera de allí no hay ninguna.
 * `Tecnia Web` tampoco la trae —el armazón es el editor con vista previa, no
 * la clase—, así que la pone la actividad. Ésta es la de las tres primeras y
 * la heredan las seis que faltan.
 *
 * Trae exactamente la misma información que la de Office, ni una casilla más:
 * situación, tema, al terminar, lo que vas a hacer, y los tres datos —cuántos
 * encargos, cuántos minutos y qué insignia—. Lo que cambia es el vestido:
 * color pleno sobre fondo oscuro, con el acento de la clase.
 *
 * No es un motor de plantillas: no sabe qué se enseña, no corrige y no decide
 * nada. Recibe seis textos y un botón.
 */

export interface DatosPortadaWeb {
  /** Dónde está el alumno, en una frase. «El club de robótica ya tiene página.» */
  situacion: string;
  /** El tema, en titular. Es lo que se lee más grande. */
  tema: string;
  /** Qué sabrá hacer al terminar. Empieza por un verbo. */
  objetivo: string;
  /** Los pasos de la clase, en orden y en segunda persona. */
  vasAHacer: string[];
  encargos: number;
  minutos: number;
  insignia: { nombre: string; emoji: string };
  /** El texto del botón. «Abrir el editor», «Abrir el proyecto»… */
  boton: string;
  /** Color pleno de la clase. Manda en el borde, el brillo y el botón. */
  acento: string;
}

export function PortadaWeb({ portada, onEmpezar }: { portada: DatosPortadaWeb; onEmpezar: () => void }) {
  const boton = useRef<HTMLButtonElement | null>(null);

  /* El foco va al botón y Enter/Escape lo pulsan: la portada no se puede
   * convertir en una pantalla que hay que cazar con el ratón. Mismo trato que
   * `PortadaPractica` de Office. */
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
      className="pgw-portada"
      role="dialog"
      aria-modal="true"
      aria-label="Objetivos de la clase"
      data-testid="pgw-portada"
      style={{ '--acento': portada.acento } as CSSProperties}
    >
      <div className="pgw-portada-caja">
        <p className="pgw-portada-situacion">{portada.situacion}</p>
        <h2 className="pgw-portada-tema">{portada.tema}</h2>

        <div className="pgw-portada-objetivo">
          <span className="pgw-portada-etiqueta">Al terminar</span>
          <p>{portada.objetivo}</p>
        </div>

        <div className="pgw-portada-cuerpo">
          <div className="pgw-portada-lista">
            <span className="pgw-portada-etiqueta">Lo que vas a hacer</span>
            <ol>
              {portada.vasAHacer.map((linea) => (
                <li key={linea}>{linea}</li>
              ))}
            </ol>
          </div>

          <div className="pgw-portada-datos">
            <span className="pgw-portada-dato">
              <b>{portada.encargos}</b> encargos
            </span>
            <span className="pgw-portada-dato">
              <b>{portada.minutos}</b> minutos
            </span>
            <span className="pgw-portada-dato">
              <b aria-hidden="true">{portada.insignia.emoji}</b> {portada.insignia.nombre}
            </span>
          </div>
        </div>

        <button type="button" ref={boton} className="pgw-portada-empezar" onClick={onEmpezar} data-testid="pgw-empezar">
          {portada.boton}
        </button>
        <p className="pgw-portada-pie">Puedes pulsar Enter para empezar.</p>
      </div>
    </div>
  );
}

export default PortadaWeb;
