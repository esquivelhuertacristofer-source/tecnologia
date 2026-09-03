'use client';

/**
 * El chasis de las clases de volumen (documento §53.4, 1).
 *
 * ─── Qué es y qué no ─────────────────────────────────────────────────────────
 *
 * Es el **mueble** alrededor del lienzo: marquesina con el título y los pips de
 * paso, marcador, el globo de Bit, el botón de Salir y la pantalla final con la
 * insignia. Ni un solo control de la mecánica vive aquí — los controles de la
 * mecánica son piezas y mandos **dentro** de la escena, que es la regla que el
 * armazón `laboratorio3d` existe para cumplir.
 *
 * ─── Por qué no es `ArcadeSala3D` ────────────────────────────────────────────
 *
 * `ArcadeSala3D` monta `RigArcade3D` —su propio `<Canvas>`, su mostrador y su
 * cámara atada a ±31°— y aquí el lienzo tiene que ser `BancoFisico3D`, con
 * azimut libre para poder ponerse detrás del equipo. Dos `<Canvas>` no caben en
 * el mismo hueco.
 *
 * Lo que sí se hereda **al carácter** son sus clases CSS (`arcade-n1 arcade3d`,
 * `sala`, `marquesina`, `escena3d`, `bit-puesto`, `pantalla-final`,
 * `gabinete-base`): el vestido del proyecto no se rediseña por cambiar de
 * lienzo, y así la sala del banco y la del arcade se leen como el mismo salón.
 * Este archivo no añade ni una regla de estilo propia por ese motivo.
 */

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { reproducirTono } from '../n1/mision/audio';
import '../n1/arcade/arcade.css';
import '../arcade3d/arcade3d.css';
import './lab3d-clases.css';

const BIT_CARA = '/assets/actividades/n1-enciende-y-apaga/bit-cara.png';

export interface FinalBanco3D {
  insigniaNombre: string;
  insigniaEmoji: string;
  titulo: string;
  detalle: string;
  resumen: { etiqueta: string; valor: string }[];
  alRepetir: () => void;
}

export interface SalaBanco3DProps {
  titulo: string;
  pasoEtiqueta: string;
  pasoActual: number;
  pasosTotal: number;
  marcadorEtiqueta: string;
  marcadorValor: string;
  /** La línea que Bit dice ahora mismo, o `null` para callarlo. */
  bit: string | null;
  /** El lienzo: siempre un `<BancoFisico3D>`. */
  banco: ReactNode;
  /** Rótulo del faldón, bajo el lienzo. */
  base?: ReactNode;
  final?: FinalBanco3D | null;
  alSalir?: () => void;
  /** Sobrecapas del chasis: la portada de objetivos y el aviso de ronda. */
  children?: ReactNode;
}

export function SalaBanco3D({
  titulo,
  pasoEtiqueta,
  pasoActual,
  pasosTotal,
  marcadorEtiqueta,
  marcadorValor,
  bit,
  banco,
  base,
  final,
  alSalir,
  children,
}: SalaBanco3DProps) {
  return (
    <div className="arcade-n1 arcade3d lab3d-sala">
      <div className="sala">
        <header className="marquesina">
          <h1 className="marquesina-titulo">{titulo}</h1>
          <div className="marquesina-pasos" aria-label={`${pasoEtiqueta} ${pasoActual} de ${pasosTotal}`}>
            <span className="paso-foco">
              {pasoEtiqueta} {pasoActual}
            </span>
            {Array.from({ length: pasosTotal }, (_, i) => (
              <span key={i} className={`paso-pip${i < pasoActual ? ' encendido' : ''}`} aria-hidden />
            ))}
          </div>
          <div className="marcador-led">
            <span>{marcadorEtiqueta}</span>
            <strong>{marcadorValor}</strong>
          </div>
          {alSalir && (
            <button type="button" className="letrero-salida" onClick={alSalir}>
              Salir
            </button>
          )}
        </header>

        <div className="escena3d">
          {/* Con la mecánica terminada el lienzo se desmonta entero, igual que
              en el arcade: la pantalla final tiene que quedar limpia y no
              transparentar la geometría por detrás. */}
          {final ? null : banco}

          {bit && !final && (
            <div className="bit-puesto">
              <span className="bit-retrato">
                <Image src={BIT_CARA} alt="" fill sizes="62px" className="object-cover" />
              </span>
              <p className="bit-globo" key={bit} aria-live="polite">
                <strong>Bit</strong>
                {bit}
              </p>
            </div>
          )}

          {final && (
            <div className="pantalla-final">
              <div>
                <div className="final-insignia" aria-hidden>
                  {final.insigniaEmoji}
                </div>
                <p className="final-insignia-nombre">Insignia · {final.insigniaNombre}</p>
                <h2 className="final-titulo">{final.titulo}</h2>
                <p className="final-detalle">{final.detalle}</p>
                <div className="final-resumen">
                  {final.resumen.map((dato) => (
                    <div key={dato.etiqueta} className="final-dato">
                      <span>{dato.etiqueta}</span>
                      <strong>{dato.valor}</strong>
                    </div>
                  ))}
                </div>
                <div className="final-botones">
                  <button
                    type="button"
                    className="boton-arcade"
                    onClick={() => {
                      reproducirTono('select');
                      final.alRepetir();
                    }}
                  >
                    Jugar otra vez
                  </button>
                  {alSalir && (
                    <button
                      type="button"
                      className="boton-arcade boton-arcade--fantasma"
                      onClick={() => {
                        reproducirTono('close');
                        alSalir();
                      }}
                    >
                      Volver a la entrada
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {children}
        </div>

        {base && <div className="gabinete-base">{base}</div>}
      </div>
    </div>
  );
}

/** Detecta `prefers-reduced-motion`. Mismo hook que el arcade, sin importarlo
 *  desde una carpeta de actividad ajena para no atar las tres clases a N2. */
export function useReduceMotion3D(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduce(mq.matches);
    const alCambiar = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);
  return reduce;
}

/** Aviso grande de cambio de ronda; se desvanece solo (clase del arcade). */
export function AvisoRonda({ texto, clave }: { texto: string; clave: string | number }) {
  return (
    <div className="aviso-ronda" aria-hidden key={clave}>
      <span>{texto}</span>
    </div>
  );
}
