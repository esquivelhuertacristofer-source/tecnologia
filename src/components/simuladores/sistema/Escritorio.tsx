'use client';

import type { ReactNode } from 'react';
import type { IconoEscritorio, VentanaSO } from './tiposSistema';
import './escritorio.css';

/**
 * TECNIA SISTEMA · EL ESCRITORIO
 *
 * El escritorio del sistema operativo simulado: iconos, ventanas con su ✕ y
 * una barra de tareas con inicio y reloj (CANON-ARMAZONES.md, «8 · Tecnia
 * Escritorio»). **Cero `useState`**: recibe qué ventanas están abiertas y en
 * qué orden por parámetro — quien tiene el estado es `useSistema`
 * (`abrirVentana`/`cerrarVentana`/`enfocarVentana`/`minimizarVentana`).
 *
 * Este componente NO sabe qué hay dentro de cada ventana: `contenido[v.id]`
 * lo pone la clase que monta el escritorio (puede ser un
 * `<VentanaExplorador>`, una calculadora, un centro de seguridad…). Windows,
 * Android, iOS y Linux son cuatro pieles del mismo armazón — la piel entra
 * por `marca`, `fondoClase` y los propios iconos, nunca hay nada aquí que
 * nombre un sistema operativo real.
 *
 * El reloj es texto: el armazón no calcula la hora real, igual que `fecha`
 * en el resto de los armazones — lo pasa la clase.
 */

export interface EscritorioProps {
  iconos: IconoEscritorio[];
  ventanas: VentanaSO[];
  /** El contenido de cada ventana, por `id` de ventana. Una ventana sin
   *  entrada aquí se pinta vacía en vez de romper — nunca hay pantalla en
   *  blanco sin explicación. */
  contenido: Record<string, ReactNode>;
  horaTexto?: string;
  marca?: string;
  onAbrirIcono?: (icono: IconoEscritorio) => void;
  onCerrarVentana?: (id: string) => void;
  onEnfocarVentana?: (id: string) => void;
  onMinimizarVentana?: (id: string) => void;
  onAbrirInicio?: () => void;
  className?: string;
}

export function Escritorio({
  iconos,
  ventanas,
  contenido,
  horaTexto,
  marca = 'Tecnia',
  onAbrirIcono,
  onCerrarVentana,
  onEnfocarVentana,
  onMinimizarVentana,
  onAbrirInicio,
  className,
}: EscritorioProps) {
  const visibles = ventanas.filter((v) => !v.minimizada);

  return (
    <div className={`tsd${className ? ` ${className}` : ''}`} data-testid="escritorio-app">
      <div className="tsd-fondo">
        <div className="tsd-iconos">
          {iconos.map((icono) => (
            <button
              key={icono.id}
              type="button"
              className="tsd-icono"
              data-testid="escritorio-icono"
              onDoubleClick={() => onAbrirIcono?.(icono)}
              onClick={() => onAbrirIcono?.(icono)}
            >
              <span className="tsd-icono-emoji" aria-hidden="true">{icono.emoji}</span>
              <span className="tsd-icono-etiqueta">{icono.etiqueta}</span>
            </button>
          ))}
        </div>

        <div className="tsd-ventanas">
          {visibles.map((v, i) => (
            <div
              key={v.id}
              className="tsd-ventana"
              data-testid="escritorio-ventana"
              data-ventana={v.id}
              style={{ zIndex: i + 1, left: `${4 + i * 3}%`, top: `${6 + i * 3}%` }}
              onMouseDown={() => onEnfocarVentana?.(v.id)}
            >
              <div className="tsd-ventana-barra">
                <span className="tsd-ventana-titulo">{v.titulo}</span>
                <span className="tsd-ventana-botones">
                  <button type="button" aria-label={`Minimizar ${v.titulo}`} onClick={() => onMinimizarVentana?.(v.id)}>─</button>
                  <button type="button" aria-label={`Cerrar ${v.titulo}`} onClick={() => onCerrarVentana?.(v.id)}>✕</button>
                </span>
              </div>
              <div className="tsd-ventana-cuerpo">{contenido[v.id] ?? null}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="tsd-barra-tareas">
        <button type="button" className="tsd-inicio" data-testid="escritorio-inicio" onClick={onAbrirInicio}>
          ⬛ {marca}
        </button>
        <div className="tsd-tareas-abiertas">
          {ventanas.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`tsd-tarea${!v.minimizada ? ' es-activa' : ''}`}
              onClick={() => onEnfocarVentana?.(v.id)}
            >
              {v.titulo}
            </button>
          ))}
        </div>
        {horaTexto && <span className="tsd-reloj">{horaTexto}</span>}
      </div>
    </div>
  );
}

export default Escritorio;
