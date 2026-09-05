'use client';

/**
 * Estudio de impacto — auto-reporte de dificultad (§9).
 *
 * Una sola pregunta al cerrar la clase, tres botones, opcional.
 *
 * NO ES UN DIÁLOGO. Es una tira que aparece bajo la actividad terminada, sin
 * capa oscura y sin robar el foco, porque el encargo dice «no interrumpir el
 * flujo» y porque un modal después de terminar una clase es exactamente la
 * clase de fricción que hace que el alumno deje de jugar. Se puede ignorar:
 * si el alumno navega a otro sitio, no pasa nada.
 *
 * Contestar cuesta un toque. Al darlo, la tira se agradece y se apaga sola.
 */

import { useState } from 'react';
import type { IdentidadEstudio } from '@/lib/estudio/identidad';
import { registrarDificultad, type DificultadPercibida } from '@/lib/estudio/telemetria';
import './AutoReporteDificultad.css';

const OPCIONES: { valor: DificultadPercibida; texto: string }[] = [
  { valor: 'facil', texto: 'Fácil' },
  { valor: 'normal', texto: 'Normal' },
  { valor: 'dificil', texto: 'Difícil' },
];

interface Props {
  actividadId: string;
  identidad: IdentidadEstudio | null;
  /** Sólo se enseña cuando la actividad ya se completó. */
  visible: boolean;
}

export default function AutoReporteDificultad({ actividadId, identidad, visible }: Props) {
  const [contestado, setContestado] = useState(false);
  const [cerrado, setCerrado] = useState(false);

  if (!visible || cerrado || !identidad) return null;

  if (contestado) {
    return (
      <div className="ard" role="status">
        <p className="ard-gracias">¡Gracias!</p>
      </div>
    );
  }

  const responder = (valor: DificultadPercibida) => {
    registrarDificultad(identidad, actividadId, valor);
    setContestado(true);
    // Se va sola: no deja un cartel permanente encima de la clase.
    setTimeout(() => setCerrado(true), 1800);
  };

  return (
    <div className="ard">
      <p className="ard-pregunta" id={`ard-${actividadId}`}>
        ¿Cómo se te hizo esta clase?
      </p>
      <div className="ard-botones" role="group" aria-labelledby={`ard-${actividadId}`}>
        {OPCIONES.map((o) => (
          <button key={o.valor} type="button" className="ard-boton" onClick={() => responder(o.valor)}>
            {o.texto}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="ard-saltar"
        onClick={() => setCerrado(true)}
        aria-label="No responder"
      >
        Saltar
      </button>
    </div>
  );
}
