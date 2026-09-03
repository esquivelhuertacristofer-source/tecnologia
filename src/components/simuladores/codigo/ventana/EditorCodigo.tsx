'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties, type KeyboardEvent, type UIEvent } from 'react';
import type { LineaPintada } from './coloreado';
import {
  ALTO_LINEA,
  METRICA_EDITOR,
  METRICA_NUMEROS,
  conEnter,
  conTab,
  type Edicion,
} from './tiposCodigo';

/**
 * TECNIA CÓDIGO · EL EDITOR
 *
 * Un `<textarea>` transparente encima de una capa de colores, más la columna de
 * números. **Sin una sola librería**: ni CodeMirror ni Monaco. La técnica es
 * vieja y funciona, y todo el riesgo está en un sitio: que las dos capas midan
 * exactamente igual.
 *
 * ── Cómo se garantiza que cuadran ──────────────────────────────────────────
 *
 * Tres cosas, y ninguna es «tener cuidado»:
 *
 * 1. **Una sola métrica.** Tipografía, tamaño, interlineado, espaciado,
 *    relleno, borde y `white-space` salen de `METRICA_EDITOR` y se le ponen
 *    EN LÍNEA a los dos elementos. No hay dos declaraciones que puedan
 *    separarse: hay una. Una prueba compara el atributo `style` de los dos y
 *    exige que salga idéntico letra por letra.
 * 2. **Una línea de texto = una caja.** El `<textarea>` va con `wrap="off"` y
 *    `white-space: pre`, así que no parte líneas largas; la capa pinta una caja
 *    por línea con `height` exacto, así que las vacías también ocupan. La
 *    columna de números pinta otra caja por línea con el mismo alto.
 * 3. **La capa dice el mismo texto, carácter por carácter.** Eso lo garantiza
 *    `colorear()` —lo que ninguna ficha cubre se emite tal cual— y lo comprueba
 *    su prueba. Un espacio de más en la capa desplaza toda la línea.
 *
 * Lo que se mueve con el ratón se sincroniza a mano: al hacer scroll el
 * `<textarea>`, la capa y los números copian su `scrollTop` y su `scrollLeft`.
 *
 * ── La tecla Tab, y cómo se sale de aquí sin ratón ─────────────────────────
 *
 * En Python la sangría es sintaxis, así que **Tab sangra**: mete espacios hasta
 * la siguiente parada de cuatro, y con varias líneas seleccionadas las sangra
 * todas. Mayús+Tab desangra. Eso deja al editor sin la tecla con la que se sale
 * de un campo, que dejaría fuera a quien no usa ratón — así que:
 *
 *     **Esc y luego Tab sale del editor.**
 *
 * Es el mismo pacto de CodeMirror y Ace, está escrito debajo del editor en
 * pantalla (no en un manual) y va también en el `aria-describedby` del cuadro,
 * para que lo diga el lector de pantalla al entrar. El pestillo de Esc vive en
 * un `useRef` y no en un `useState` a propósito: no se lee al pintar, no
 * repinta nada y no es estado de la aplicación — es el modo del teclado.
 *
 * ── Cero `useState` ────────────────────────────────────────────────────────
 *
 * Ni uno. El texto entra y sale por parámetro (`texto`, `onCambiar`). Las
 * referencias son para hablar con el DOM: el scroll, el foco y la selección,
 * que son cosas del navegador y no datos de la clase.
 */

export interface EditorCodigoProps {
  texto: string;
  lineas: LineaPintada[];
  /** Devuelve `false` si el cambio se rechazó (línea bajo llave). */
  onCambiar: (texto: string) => boolean;
  /** `false` mientras el programa anda: el cuadro se congela. */
  editable: boolean;
  /** Se llama cuando el alumno intenta escribir con el editor congelado. */
  onBloqueado?: () => void;
  /** Las líneas con candado, para la marca de la izquierda. */
  bajoLlave?: ReadonlySet<number>;
  /** La que se va a ejecutar ahora. `0` = ninguna. */
  lineaEnCurso?: number;
  /** La del error. `0` = ninguna. */
  lineaError?: number;
  /** La que señala el encargo del guion. `0` = ninguna. */
  lineaSenalada?: number;
  /** Cuando cambia el sello, el editor lleva el cursor a esa línea y se enfoca. */
  foco?: { linea: number; sello: number } | null;
  etiqueta?: string;
  idPista?: string;
}

/** Las teclas que no escriben nada: con el editor congelado no valen de aviso. */
const NO_ESCRIBEN = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Home', 'End', 'PageUp', 'PageDown',
  'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape', 'Tab',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
]);

export function EditorCodigo({
  texto,
  lineas,
  onCambiar,
  editable,
  onBloqueado,
  bajoLlave,
  lineaEnCurso = 0,
  lineaError = 0,
  lineaSenalada = 0,
  foco = null,
  etiqueta = 'Editor de código',
  idPista,
}: EditorCodigoProps) {
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const capaRef = useRef<HTMLDivElement | null>(null);
  const numsRef = useRef<HTMLDivElement | null>(null);
  /** El pestillo de «Esc y luego Tab». No es estado: no se pinta nada con él. */
  const escapeRef = useRef(false);
  /** Dónde dejar la selección después de un cambio hecho por nosotros. */
  const pendienteRef = useRef<{ desde: number; hasta: number } | null>(null);
  /** Dónde estaba la selección antes de la tecla, por si el cambio se rechaza. */
  const antesRef = useRef<{ desde: number; hasta: number } | null>(null);
  const selloRef = useRef(-1);

  const aplicar = useCallback(
    (e: Edicion) => {
      if (onCambiar(e.texto)) pendienteRef.current = { desde: e.desde, hasta: e.hasta };
      else pendienteRef.current = antesRef.current;
    },
    [onCambiar],
  );

  const alTeclear = useCallback(
    (ev: KeyboardEvent<HTMLTextAreaElement>) => {
      const area = ev.currentTarget;
      antesRef.current = { desde: area.selectionStart, hasta: area.selectionEnd };

      if (ev.key === 'Escape') {
        escapeRef.current = true;
        return;
      }

      if (ev.key === 'Tab') {
        if (escapeRef.current) {
          /* Sin `preventDefault`: el navegador mueve el foco al siguiente
           * control, que es exactamente lo que se pide. */
          escapeRef.current = false;
          return;
        }
        ev.preventDefault();
        if (!editable) {
          onBloqueado?.();
          return;
        }
        aplicar(conTab(texto, area.selectionStart, area.selectionEnd, ev.shiftKey));
        return;
      }

      if (ev.key !== 'Shift') escapeRef.current = false;

      if (ev.key === 'Enter' && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
        if (!editable) {
          onBloqueado?.();
          return;
        }
        ev.preventDefault();
        aplicar(conEnter(texto, area.selectionStart, area.selectionEnd));
        return;
      }

      /* El cuadro congelado es `readOnly`, así que el navegador se traga la
       * tecla en silencio. Sin este aviso, el alumno teclea, no pasa nada y no
       * sabe por qué. */
      if (!editable && !NO_ESCRIBEN.has(ev.key) && !ev.ctrlKey && !ev.metaKey) onBloqueado?.();
    },
    [texto, editable, aplicar, onBloqueado],
  );

  const alDesplazar = useCallback((ev: UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = ev.currentTarget;
    if (capaRef.current) {
      capaRef.current.scrollTop = scrollTop;
      capaRef.current.scrollLeft = scrollLeft;
    }
    if (numsRef.current) numsRef.current.scrollTop = scrollTop;
  }, []);

  /* La selección se coloca DESPUÉS de pintar, o React la manda al final del
   * texto en cuanto el valor cambia: es lo que pasa con todo `<textarea>`
   * controlado al que se le escribe desde fuera. */
  useLayoutEffect(() => {
    const pendiente = pendienteRef.current;
    if (!pendiente || !areaRef.current) return;
    pendienteRef.current = null;
    areaRef.current.setSelectionRange(pendiente.desde, pendiente.hasta);
  });

  /* Llevar el cursor a una línea cuando alguien la señala (el error, un encargo). */
  useEffect(() => {
    if (!foco || foco.sello === selloRef.current) return;
    selloRef.current = foco.sello;
    const area = areaRef.current;
    if (!area) return;
    const lineasTexto = texto.split('\n');
    const n = Math.min(Math.max(1, foco.linea), lineasTexto.length);
    let inicio = 0;
    for (let i = 0; i < n - 1; i += 1) inicio += lineasTexto[i].length + 1;
    area.focus();
    area.setSelectionRange(inicio, inicio + lineasTexto[n - 1].length);
    const arriba = (n - 1) * ALTO_LINEA;
    if (area.clientHeight > 0 && (arriba < area.scrollTop || arriba > area.scrollTop + area.clientHeight - ALTO_LINEA * 2)) {
      area.scrollTop = Math.max(0, arriba - area.clientHeight / 2);
      if (capaRef.current) capaRef.current.scrollTop = area.scrollTop;
      if (numsRef.current) numsRef.current.scrollTop = area.scrollTop;
    }
  }, [foco, texto]);

  /* Y seguir a la línea en curso mientras se ejecuta paso a paso, que si no el
   * resaltado se va por debajo del borde y el alumno pierde el hilo. */
  useEffect(() => {
    const area = areaRef.current;
    if (!area || lineaEnCurso <= 0 || area.clientHeight <= 0) return;
    const arriba = (lineaEnCurso - 1) * ALTO_LINEA;
    const abajo = arriba + ALTO_LINEA;
    let destino: number | null = null;
    if (arriba < area.scrollTop) destino = arriba;
    else if (abajo > area.scrollTop + area.clientHeight) destino = abajo - area.clientHeight;
    if (destino === null) return;
    area.scrollTop = Math.max(0, destino);
    if (capaRef.current) capaRef.current.scrollTop = area.scrollTop;
    if (numsRef.current) numsRef.current.scrollTop = area.scrollTop;
  }, [lineaEnCurso]);

  const alturaLinea = { ['--cod-alto-linea']: `${ALTO_LINEA}px` } as CSSProperties;

  return (
    <div className="cod-editor" style={alturaLinea} data-testid="cod-editor">
      <div className="cod-numeros" style={METRICA_NUMEROS} ref={numsRef} aria-hidden="true">
        {lineas.map((l) => {
          const candado = bajoLlave?.has(l.n) ?? false;
          const clases = ['cod-num'];
          if (l.n === lineaEnCurso) clases.push('es-curso');
          if (l.n === lineaError) clases.push('es-error');
          if (candado) clases.push('es-candado');
          return (
            <div key={l.n} className={clases.join(' ')} data-num={l.n}>
              <span className="cod-num-marca">{l.n === lineaError ? '⚠' : candado ? '🔒' : l.n === lineaEnCurso ? '▸' : ''}</span>
              <span className="cod-num-n">{l.n}</span>
            </div>
          );
        })}
      </div>

      <div className="cod-lienzo">
        <div className="cod-capa" style={METRICA_EDITOR} ref={capaRef} aria-hidden="true" data-testid="cod-capa">
          {lineas.map((l) => {
            const clases = ['cod-linea'];
            if (l.n === lineaEnCurso) clases.push('es-curso');
            if (l.n === lineaError) clases.push('es-error');
            if (l.n === lineaSenalada && l.n !== lineaError) clases.push('es-senalada');
            if (bajoLlave?.has(l.n)) clases.push('es-candado');
            return (
              <div key={l.n} className={clases.join(' ')} data-linea={l.n}>
                {l.tramos.map((t, i) => (
                  <span key={i} className={`cod-t cod-t-${t.color}`}>
                    {t.texto}
                  </span>
                ))}
              </div>
            );
          })}
        </div>

        <textarea
          ref={areaRef}
          className="cod-area"
          style={METRICA_EDITOR}
          data-testid="cod-area"
          value={texto}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          readOnly={!editable}
          aria-label={etiqueta}
          aria-describedby={idPista}
          onKeyDown={alTeclear}
          onScroll={alDesplazar}
          onChange={(ev) => {
            if (!onCambiar(ev.target.value)) pendienteRef.current = antesRef.current;
          }}
        />
      </div>
    </div>
  );
}

export default EditorCodigo;
