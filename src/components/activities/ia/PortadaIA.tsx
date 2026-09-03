'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import './salaIA.css';

/**
 * La portada de objetivos de las clases de inteligencia artificial
 * (documento §52).
 *
 * **Entrar a un laboratorio sin saber el tema ni el objetivo está declarado
 * defecto de la casa.** Office lo resuelve con `PortadaPractica`, las clases
 * de páginas web con `PortadaWeb`; ninguna de las dos vive fuera de su
 * carpeta (sus clases CSS van con su chrome). El armazón `Tecnia Asistente`
 * tampoco la trae —es el chat, no la clase—, así que la pone la actividad.
 * Ésta es la de las tres primeras de IA y la heredan las trece que faltan.
 *
 * Trae la misma información que sus dos hermanas, ni una casilla más:
 * situación, tema, al terminar, lo que vas a hacer, y los tres datos
 * —encargos, minutos, insignia—. Lo que cambia es el vestido: color pleno
 * sobre fondo oscuro con el acento de la clase.
 *
 * No es un motor de plantillas: no sabe qué se enseña, no corrige y no decide
 * nada. Recibe seis textos y un botón.
 */

export interface DatosPortadaIA {
  /** Dónde está el alumno, en una frase. «El club de mascotas quiere una app.» */
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
  /** El texto del botón. «Abrir Tecnia Entrena», «Abrir el asistente»… */
  boton: string;
  /** Color pleno de la clase. Manda en el borde, el brillo y el botón. */
  acento: string;
}

export function PortadaIA({ portada, onEmpezar }: { portada: DatosPortadaIA; onEmpezar: () => void }) {
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
      className="tia-portada"
      role="dialog"
      aria-modal="true"
      aria-label="Objetivos de la clase"
      data-testid="tia-portada"
      style={{ '--acento': portada.acento } as CSSProperties}
    >
      <div className="tia-portada-caja">
        <p className="tia-portada-situacion">{portada.situacion}</p>
        <h2 className="tia-portada-tema">{portada.tema}</h2>

        <div className="tia-portada-objetivo">
          <span className="tia-portada-etiqueta">Al terminar</span>
          <p>{portada.objetivo}</p>
        </div>

        <div className="tia-portada-cuerpo">
          <div className="tia-portada-lista">
            <span className="tia-portada-etiqueta">Lo que vas a hacer</span>
            <ol>
              {portada.vasAHacer.map((linea) => (
                <li key={linea}>{linea}</li>
              ))}
            </ol>
          </div>

          <div className="tia-portada-datos">
            <span className="tia-portada-dato">
              <b>{portada.encargos}</b> encargos
            </span>
            <span className="tia-portada-dato">
              <b>{portada.minutos}</b> minutos
            </span>
            <span className="tia-portada-dato">
              <b aria-hidden="true">{portada.insignia.emoji}</b> {portada.insignia.nombre}
            </span>
          </div>
        </div>

        <button type="button" ref={boton} className="tia-portada-empezar" onClick={onEmpezar} data-testid="tia-empezar">
          {portada.boton}
        </button>
        <p className="tia-portada-pie">Puedes pulsar Enter para empezar.</p>
      </div>
    </div>
  );
}

export default PortadaIA;
