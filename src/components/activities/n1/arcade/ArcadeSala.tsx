'use client';

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { decir, detenerVoz, prepararVoz, reproducirTono } from '../mision/audio';
import './arcade.css';

/**
 * Escenografía compartida de las máquinas del salón arcade de Bit (N1·U2).
 * Marquesina con título, foquitos, pips de ronda y marcador LED; pantalla
 * con bisel CRT; base de gabinete donde cada máquina integra sus controles
 * (documento §3: nada de HUD flotante); Bit como anfitrión con globo y voz.
 *
 * La voz ya no es placeholder: audio.ts elige la mejor voz en español que
 * exponga el navegador (neuronales de Microsoft/Google primero). Este hook
 * es el embudo de los 56 laboratorios, así que precarga el catálogo al
 * montar para que la primera línea de Bit ya salga con la voz buena.
 */

const BIT_CARA = '/assets/actividades/n1-enciende-y-apaga/bit-cara.png';

export interface FinalMaquina {
  insigniaNombre: string;
  insigniaEmoji: string;
  titulo: string;
  detalle: string;
  resumen: { etiqueta: string; valor: string }[];
  alRepetir: () => void;
}

interface ArcadeSalaProps {
  titulo: string;
  pasoEtiqueta: string;
  pasoActual: number;
  pasosTotal: number;
  marcadorEtiqueta: string;
  marcadorValor: string;
  bit: string | null;
  base?: ReactNode;
  final?: FinalMaquina | null;
  alSalir?: () => void;
  children: ReactNode;
}

/** Globo + voz de Bit; `una: true` evita repetir líneas de evento único. */
export function useBit(lineaInicial?: string) {
  const [linea, setLinea] = useState<string | null>(null);
  const dichas = useRef(new Set<string>());
  const inicial = useRef(lineaInicial);

  const hablar = useCallback((texto: string, opciones?: { una?: boolean }) => {
    if (opciones?.una) {
      if (dichas.current.has(texto)) return;
      dichas.current.add(texto);
    }
    setLinea(texto);
    decir(texto);
  }, []);

  useEffect(() => {
    // El catálogo de voces llega asíncrono (y en Edge, en dos tandas):
    // pedirlo al montar da tiempo a que esté listo antes de la 1.ª línea.
    prepararVoz();
    if (inicial.current) {
      const texto = inicial.current;
      const temporizador = window.setTimeout(() => {
        setLinea(texto);
        decir(texto);
      }, 450);
      return () => {
        window.clearTimeout(temporizador);
        detenerVoz();
      };
    }
    return () => detenerVoz();
  }, []);

  return { linea, hablar };
}

export function ArcadeSala({
  titulo,
  pasoEtiqueta,
  pasoActual,
  pasosTotal,
  marcadorEtiqueta,
  marcadorValor,
  bit,
  base,
  final,
  alSalir,
  children,
}: ArcadeSalaProps) {
  return (
    <div className="arcade-n1">
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

        <div className="maquina-pantalla">
          {children}
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
        </div>

        {base && <div className="gabinete-base">{base}</div>}
      </div>
    </div>
  );
}

/** Aviso grande "Ronda 2"-estilo attract mode; se desvanece solo. */
export function AvisoRonda({ texto, clave }: { texto: string; clave: string | number }) {
  return (
    <div className="aviso-ronda" aria-hidden key={clave}>
      <span>{texto}</span>
    </div>
  );
}
