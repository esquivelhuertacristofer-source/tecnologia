'use client';

import { ReactNode, useEffect, useState } from 'react';
import Image from 'next/image';
import { reproducirTono } from '../n1/mision/audio';
import { detectarWebGL, RigArcade3D, type PaletaArcade } from './EscenaArcade3D';
import '../n1/arcade/arcade.css';
import './arcade3d.css';

/**
 * Shell compartido de los gabinetes arcade en WebGL 3D (N2 en adelante).
 *
 * Reutiliza TODO el chrome del salón arcade de N1 (marquesina, pips de ronda,
 * marcador LED, retrato/globo de Bit, pantalla final con insignia) para no
 * duplicar estilo ni romper la identidad visual, y solo cambia el área central:
 * en vez de una escena CSS plana monta un `<Canvas>` 3D real (`RigArcade3D`).
 *
 * Puerta WebGL: en SSR y en el primer render del cliente muestra `respaldo`
 * (HTML plano con los mismos botones/aria-labels), y recién tras montar detecta
 * WebGL y sube a 3D — así no hay mismatch de hidratación y las pruebas de
 * contrato bajo jsdom siguen pasando sin tocar three.js.
 */

const BIT_CARA = '/assets/actividades/n1-enciende-y-apaga/bit-cara.webp';

export interface FinalMaquina3D {
  insigniaNombre: string;
  insigniaEmoji: string;
  titulo: string;
  detalle: string;
  resumen: { etiqueta: string; valor: string }[];
  alRepetir: () => void;
}

interface ArcadeSala3DProps {
  titulo: string;
  pasoEtiqueta: string;
  pasoActual: number;
  pasosTotal: number;
  marcadorEtiqueta: string;
  marcadorValor: string;
  bit: string | null;
  /** Retinte del gabinete por unidad. */
  paleta?: PaletaArcade;
  /** true mientras la mecánica está activa (sube la luz de acento). */
  activa?: boolean;
  /**
   * La actividad trae su propio mueble completo y hay que apagar el mostrador
   * genérico del rig. Ver el comentario largo en `RigArcade3DProps`: sus patas
   * viven por delante del faldón de las estaciones de N4 y cruzaban los mandos.
   */
  sinMostrador?: boolean;
  reduceMotion: boolean;
  /** Children 3D montados dentro del `<Canvas>` (geometría + controles Html). */
  escena: ReactNode;
  /** Respaldo HTML plano (sin WebGL): mismos botones y aria-labels. */
  respaldo: ReactNode;
  base?: ReactNode;
  final?: FinalMaquina3D | null;
  alSalir?: () => void;
  /** Overlays HTML sobre la escena (p. ej. AvisoRonda3D). */
  children?: ReactNode;
}

/** Detecta prefers-reduced-motion (para pasarlo al rig y a las piezas). */
export function useReduceMotion(): boolean {
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

export function ArcadeSala3D({
  titulo,
  pasoEtiqueta,
  pasoActual,
  pasosTotal,
  marcadorEtiqueta,
  marcadorValor,
  bit,
  paleta,
  activa = true,
  sinMostrador = false,
  reduceMotion,
  escena,
  respaldo,
  base,
  final,
  alSalir,
  children,
}: ArcadeSala3DProps) {
  const [webgl, setWebgl] = useState(false);

  // Igual que Ordenador3D: primero respaldo (coincide con SSR), luego 3D.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(detectarWebGL());
  }, []);

  return (
    <div className="arcade-n1 arcade3d">
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
          {/* Con la mecánica terminada desmontamos la escena (canvas + sus
              botones <Html>, que portalan por encima) para que la pantalla
              final quede limpia y no se transparente la geometría 3D. */}
          {final ? null : webgl ? (
            <RigArcade3D reduceMotion={reduceMotion} activa={activa} paleta={paleta} sinMostrador={sinMostrador}>
              {escena}
            </RigArcade3D>
          ) : (
            <div className="escena3d-respaldo">{respaldo}</div>
          )}

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

/** Aviso grande "Ronda 2"-estilo attract mode; se desvanece solo. */
export function AvisoRonda3D({ texto, clave }: { texto: string; clave: string | number }) {
  return (
    <div className="aviso-ronda" aria-hidden key={clave}>
      <span>{texto}</span>
    </div>
  );
}
