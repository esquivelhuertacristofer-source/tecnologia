'use client';

import { useCallback, useEffect, useRef } from 'react';
import { reproducirTono } from '../n1/mision/audio';
import './salaDatos.css';

/**
 * LA PORTADA DE OBJETIVOS DE LAS CLASES DE TECNIA DATOS
 *
 * Lo que se ve ANTES del editor de consultas. Existe por la misma razón que
 * `python/PortadaCodigo.tsx`: entrar a un laboratorio sin saber de qué tema es
 * la clase ni qué se espera de uno está declarado defecto.
 *
 * No se importa `PortadaCodigo` tal cual **a propósito**: su botón lleva
 * escrito «Abrir {archivo}» con el glifo 🐍 fijo, que es Python y no SQL. Los
 * dos componentes son del mismo tamaño y la misma idea (`DatosPortada*` es
 * literalmente el mismo contrato que `DatosPortadaCodigo`), pero cambiar el
 * glifo de un componente compartido por un ejercicio que no lo necesita
 * habría sido tocar la sala de Python para esto. Un cartel nuevo de veinte
 * líneas es más barato que esa dependencia cruzada.
 */

export interface DatosPortadaDatos {
  /** Dónde está el alumno y por qué abre esto. Una o dos frases. */
  situacion: string;
  /** El tema de la clase, en titular. */
  tema: string;
  /** Qué sabrá hacer al terminar. */
  objetivo: string;
  /** Los hitos de la sesión, en orden. Tres o cuatro. */
  vasAHacer: string[];
}

export interface PortadaDatosProps {
  portada: DatosPortadaDatos;
  /** «biblioteca.sql». El alumno tiene que saber qué archivo va a abrir. */
  archivo: string;
  encargos: number;
  minutos: number;
  insignia: { nombre: string; emoji: string };
  onEmpezar: () => void;
}

export function PortadaDatos({ portada, archivo, encargos, minutos, insignia, onEmpezar }: PortadaDatosProps) {
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
    <div className="sql-portada" role="dialog" aria-modal="true" aria-label="Objetivos de la práctica" data-testid="sql-portada">
      <div className="sql-portada-caja">
        <p className="sql-portada-situacion">{portada.situacion}</p>
        <h2 className="sql-portada-tema">{portada.tema}</h2>

        <div className="sql-portada-objetivo">
          <span className="sql-portada-etiqueta">Al terminar</span>
          <p>{portada.objetivo}</p>
        </div>

        <div className="sql-portada-cuerpo">
          <div className="sql-portada-lista">
            <span className="sql-portada-etiqueta">Lo que vas a hacer</span>
            <ol>
              {portada.vasAHacer.map((linea) => (
                <li key={linea}>{linea}</li>
              ))}
            </ol>
          </div>

          <div className="sql-portada-lado">
            <div className="sql-portada-datos">
              <span>
                <b>{encargos}</b> encargos
              </span>
              <span>
                <b>{minutos}</b> min
              </span>
            </div>
            <div className="sql-portada-insignia">
              <span className="sql-portada-insignia-glifo" aria-hidden="true">
                {insignia.emoji}
              </span>
              <span className="sql-portada-insignia-nombre">Insignia · {insignia.nombre}</span>
            </div>
          </div>
        </div>

        <button type="button" ref={boton} className="sql-portada-boton" data-testid="sql-empezar" onClick={empezar}>
          <span className="sql-portada-boton-glifo" aria-hidden="true">
            🗄️
          </span>
          Abrir {archivo}
        </button>
      </div>
    </div>
  );
}

export default PortadaDatos;
