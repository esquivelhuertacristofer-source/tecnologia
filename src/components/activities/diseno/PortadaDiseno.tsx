'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import './diseno-sala.css';

/**
 * La portada de objetivos de las clases de Tecnia Diseño (documento §54).
 *
 * Misma pieza que `PortadaWeb` (n6/web) y `PortadaLab3D` (lab3d): entrar a un
 * laboratorio sin saber el tema ni el objetivo está declarado defecto de la
 * casa. Se repite el patrón —no se reutiliza el componente de otro armazón,
 * que ya vive scopeado a sus propias clases CSS— y se generaliza aquí para
 * las tres clases del editor gráfico, presentes y futuras.
 */

export interface DatosPortadaDiseno {
  situacion: string;
  tema: string;
  objetivo: string;
  vasAHacer: string[];
  encargos: number;
  minutos: number;
  insignia: { nombre: string; emoji: string };
  boton: string;
  acento: string;
}

export function PortadaDiseno({ portada, onEmpezar }: { portada: DatosPortadaDiseno; onEmpezar: () => void }) {
  const boton = useRef<HTMLButtonElement | null>(null);

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
      className="psn-portada"
      role="dialog"
      aria-modal="true"
      aria-label="Objetivos de la clase"
      data-testid="psn-portada"
      style={{ '--acento': portada.acento } as CSSProperties}
    >
      <div className="psn-caja">
        <p className="psn-situacion">{portada.situacion}</p>
        <h2 className="psn-tema">{portada.tema}</h2>

        <div className="psn-objetivo">
          <span className="psn-etiqueta">Al terminar</span>
          <p>{portada.objetivo}</p>
        </div>

        <div className="psn-cuerpo">
          <div className="psn-lista">
            <span className="psn-etiqueta">Lo que vas a hacer</span>
            <ol>
              {portada.vasAHacer.map((linea) => (
                <li key={linea}>{linea}</li>
              ))}
            </ol>
          </div>

          <div className="psn-datos">
            <span className="psn-dato">
              <b>{portada.encargos}</b> encargos
            </span>
            <span className="psn-dato">
              <b>{portada.minutos}</b> minutos
            </span>
            <span className="psn-dato">
              <b aria-hidden="true">{portada.insignia.emoji}</b> {portada.insignia.nombre}
            </span>
          </div>
        </div>

        <button type="button" ref={boton} className="psn-empezar" onClick={onEmpezar} data-testid="psn-empezar">
          {portada.boton}
        </button>
        <p className="psn-pie">Puedes pulsar Enter para empezar.</p>
      </div>
    </div>
  );
}

export default PortadaDiseno;
