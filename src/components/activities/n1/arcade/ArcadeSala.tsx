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

const BIT_CARA = '/assets/actividades/n1-enciende-y-apaga/bit-cara.webp';

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

/**
 * Cuánto se deja leer una línea de Bit antes de recogerla: un alumno de
 * primaria lee ~2 palabras por segundo, y la voz ya la dijo en voz alta.
 */
export function tiempoDeLectura(texto: string): number {
  const palabras = texto.trim().split(/\s+/).length;
  return Math.min(18000, Math.max(7000, 3000 + palabras * 450));
}

const ES_CAMPO = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]';

/**
 * El globo de Bit se recoge solo, y vuelve a asomar si pasas el ratón por su cara.
 *
 * Medido el 12-sep-2026 abriendo con Chromium las 80 actividades de N7–N10: en
 * **39** el globo tapaba algo que el alumno usa y seguía ahí a los 10 s —el
 * 43–48 % de la consola en todas las clases de Tecnia Código, parte del editor
 * en las de Tecnia Web, un botón de respuesta entero en `n10-capstone`—. No se
 * iba nunca: `bit` sólo cambia cuando Bit vuelve a hablar.
 *
 * Tres decisiones:
 * - **Se recoge, no se borra.** El texto se queda en el DOM (`data-recogido`
 *   lo oculta por CSS): `aria-live` ya lo anunció, la voz ya lo dijo y las
 *   pruebas que leen `.bit-globo` siguen leyéndolo.
 * - **Se recoge antes si el alumno se pone a trabajar**: una tecla o entrar en
 *   un campo dentro de la pantalla.
 * - **El retrato NO atrapa clics.** La misma medición encontró el retrato
 *   encima de botones (hasta el 84 % de `dis-pag`); volverlo botón para reabrir
 *   el globo habría bloqueado esos clics, que hoy pasan a través. Por eso el
 *   globo reaparece por **posición del puntero** sobre la cara, sin capturarlo.
 */
export function useGloboDeBit(bit: string | null) {
  const pantallaRef = useRef<HTMLDivElement>(null);
  const retratoRef = useRef<HTMLSpanElement>(null);
  const bitRef = useRef(bit);
  const [recogida, setRecogida] = useState<string | null>(null);
  const [asomado, setAsomado] = useState(false);

  useEffect(() => {
    bitRef.current = bit;
    if (!bit) return;
    const t = window.setTimeout(() => setRecogida(bit), tiempoDeLectura(bit));
    return () => window.clearTimeout(t);
  }, [bit]);

  useEffect(() => {
    const pantalla = pantallaRef.current;
    if (!pantalla) return;
    const recoger = () => {
      if (bitRef.current) setRecogida(bitRef.current);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest('.bit-puesto')) recoger();
    };
    const alEntrar = (e: FocusEvent) => {
      if (e.target instanceof Element && e.target.matches(ES_CAMPO)) recoger();
    };
    const alMover = (e: PointerEvent) => {
      const r = retratoRef.current?.getBoundingClientRect();
      const encima = !!r && r.width > 0 && e.clientX >= r.left - 6 && e.clientX <= r.right + 6 && e.clientY >= r.top - 6 && e.clientY <= r.bottom + 6;
      setAsomado((antes) => (antes === encima ? antes : encima));
    };
    const alSalir = () => setAsomado(false);
    pantalla.addEventListener('keydown', alTeclear, true);
    pantalla.addEventListener('focusin', alEntrar);
    pantalla.addEventListener('pointermove', alMover);
    pantalla.addEventListener('pointerleave', alSalir);
    return () => {
      pantalla.removeEventListener('keydown', alTeclear, true);
      pantalla.removeEventListener('focusin', alEntrar);
      pantalla.removeEventListener('pointermove', alMover);
      pantalla.removeEventListener('pointerleave', alSalir);
    };
  }, []);

  const recogido = !!bit && recogida === bit && !asomado;
  return { pantallaRef, retratoRef, recogido };
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
  const { pantallaRef, retratoRef, recogido } = useGloboDeBit(bit);
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

        <div className="maquina-pantalla" ref={pantallaRef}>
          {children}
          {bit && !final && (
            <div className="bit-puesto" data-recogido={recogido ? 'si' : undefined}>
              <span className="bit-retrato" ref={retratoRef}>
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
