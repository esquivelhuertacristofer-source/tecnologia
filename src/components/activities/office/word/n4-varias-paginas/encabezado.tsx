'use client';

import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CONTENIDO_ALTO,
  CONTENIDO_ANCHO,
  MARGEN,
  PAGINA_ALTO,
  PASO_PAGINA,
} from '@/components/office/motor/paginador';
import { cambiarEstado, laVista, leerEstado, programarAjuste, suscribir } from './estado';

/**
 * Las franjas de encabezado y pie, y el número de página (doc §26.3).
 *
 * ── DÓNDE SE PINTAN, Y POR QUÉ AHÍ ──────────────────────────────────────────
 *
 * Dentro de `.txtw-pila`, por un portal. La pila es la torre de hojas del
 * motor: cada hoja está colocada en `top: k · PASO_PAGINA` y la pila entera
 * lleva el `transform: scale()` del zoom. Pintando ahí dentro, las franjas
 * están EN el papel —se desplazan con él, se escalan con él y se imprimen con
 * él—, en vez de flotar encima de la ventana como un panel más. Es la misma
 * regla de siempre: los controles se integran en la escena.
 *
 * Y por eso no van en el flujo del documento. Si fueran párrafos, el paginador
 * los mediría, contarían para el número de palabras y habría que escribirlos
 * hoja por hoja — que es exactamente el error que la clase viene a desterrar.
 *
 * ── EL NÚMERO ───────────────────────────────────────────────────────────────
 *
 * Cada franja de pie sabe en qué hoja está, así que el número es `hoja + 1` y
 * no hay nada que mantener: si mañana entra una hoja en medio, la de abajo pasa
 * a ser la 3 sola. Ésa es la lección y por eso el número NO es editable: se
 * marca como campo del programa —fondo gris al posar el ratón, como en Word— y
 * quien lo intente teclear se encuentra con que no se deja.
 */

const ALTO_FRANJA = 26;
/** Media pulgada desde el canto del papel, como el Word de fábrica. */
const DESDE_EL_CANTO = 46;

interface PropsFranja {
  hoja: number;
  tipo: 'encabezado' | 'pie';
  texto: string;
  editando: boolean;
  conFoco: boolean;
  numero: boolean;
  onEditar: (texto: string) => void;
  onAbrir: (tipo: 'encabezado' | 'pie', hoja: number) => void;
}

function Franja({ hoja, tipo, texto, editando, conFoco, numero, onEditar, onAbrir }: PropsFranja) {
  const caja = useRef<HTMLDivElement | null>(null);

  /*
   * El texto se escribe en el DOM a mano y NO como hijo de React.
   *
   * Es la única manera de que la misma franja se pueda estar escribiendo en la
   * hoja 1 mientras las de la 2 y la 3 se ponen al día: si React pintara el
   * texto, cada tecla volvería a pintar la franja donde está el cursor y el
   * cursor saltaría al principio a cada letra. Aquí React sólo pinta la caja, y
   * el contenido se sincroniza en las franjas que NO tienen el foco.
   */
  useLayoutEffect(() => {
    const el = caja.current;
    if (!el || document.activeElement === el) return;
    if (el.textContent !== texto) el.textContent = texto;
  });

  useEffect(() => {
    if (editando && conFoco) {
      const el = caja.current;
      if (!el || document.activeElement === el) return;
      el.focus();
      // El cursor al final de lo que ya haya, como al abrir un encabezado en Word.
      const rango = document.createRange();
      rango.selectNodeContents(el);
      rango.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(rango);
    }
  }, [conFoco, editando]);

  const arriba =
    tipo === 'encabezado'
      ? hoja * PASO_PAGINA + DESDE_EL_CANTO
      : hoja * PASO_PAGINA + PAGINA_ALTO - DESDE_EL_CANTO - ALTO_FRANJA;

  const vacia = texto.trim() === '' && !(tipo === 'pie' && numero);

  return (
    <div
      className={`n4pg-franja es-${tipo}${editando ? ' es-editando' : ''}${vacia ? ' es-vacia' : ''}`}
      style={{ top: arriba, left: MARGEN, width: CONTENIDO_ANCHO, height: ALTO_FRANJA }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onAbrir(tipo, hoja);
      }}
    >
      <span className="n4pg-chapa" aria-hidden="true">
        {tipo === 'encabezado' ? 'Encabezado' : 'Pie de página'}
      </span>
      <div
        ref={caja}
        className="n4pg-escrito"
        contentEditable={editando}
        suppressContentEditableWarning
        spellCheck={false}
        role="textbox"
        aria-label={`${tipo === 'encabezado' ? 'Encabezado' : 'Pie de página'} de la hoja ${hoja + 1}`}
        onInput={(e) => onEditar(e.currentTarget.textContent ?? '')}
        onKeyDown={(e) => {
          // Un encabezado es un renglón: Enter no parte hojas aquí.
          if (e.key === 'Enter') e.preventDefault();
          if (e.key === 'Escape') {
            e.preventDefault();
            e.currentTarget.blur();
            cambiarEstado({ modo: 'ninguno' });
          }
        }}
      />
      {tipo === 'pie' && numero && (
        <span
          className="n4pg-numero"
          title="Este número lo pone el programa: cambia solo en cada hoja"
          aria-label={`Número de página: ${hoja + 1}`}
        >
          {hoja + 1}
        </span>
      )}
      {tipo === 'pie' && <span className="n4pg-hueco" aria-hidden="true" />}
    </div>
  );
}

/**
 * El aviso de los renglones vacíos, en el margen de la hoja.
 *
 * Éste es el sitio donde se corrige el error que la clase provoca a propósito.
 * El panel del maestro sólo saca su pista cuando el alumno falla PULSANDO algo,
 * y machacar Enter no pulsa nada: la clase entera se puede hacer mal en
 * silencio. Así que el aviso sale donde está el error —al lado de los renglones
 * vacíos, en el margen, como una marca de revisión— y desaparece solo cuando se
 * borran. No regaña: cuenta cuántos hay y dice qué son.
 */
function AvisoVacios({ top, alto, cuantos }: { top: number; alto: number; cuantos: number }) {
  return (
    <div className="n4pg-vacios" style={{ top, height: alto }} aria-hidden="true">
      <span className="n4pg-vacios-barra" />
      <span className="n4pg-vacios-nota">
        {cuantos === 1 ? '1 renglón vacío' : `${cuantos} renglones vacíos`}
        <b>{cuantos === 1 ? 'no es un salto de página' : 'no son un salto de página'}</b>
      </span>
    </div>
  );
}

interface Medida {
  paginas: number;
  vacios: { top: number; alto: number; cuantos: number } | null;
}

/** Los renglones vacíos pegados encima del tercer apartado, medidos en la hoja. */
function medirVacios(pila: HTMLElement): Medida['vacios'] {
  const flujo = pila.querySelector<HTMLElement>('.txtw-flujo');
  const apartado = flujo?.querySelectorAll<HTMLElement>('h2')[2];
  if (!flujo || !apartado) return null;

  const vacios: HTMLElement[] = [];
  let previo = apartado.previousElementSibling as HTMLElement | null;
  while (previo) {
    if (previo.hasAttribute('data-pag-espacio') || previo.classList.contains('es-salto-pagina')) {
      previo = previo.previousElementSibling as HTMLElement | null;
      continue;
    }
    if (previo.tagName !== 'P' || (previo.textContent ?? '').trim() !== '') break;
    vacios.push(previo);
    previo = previo.previousElementSibling as HTMLElement | null;
  }
  if (vacios.length === 0) return null;

  const cajaPila = pila.getBoundingClientRect();
  const escala = pila.offsetWidth > 0 ? cajaPila.width / pila.offsetWidth : 1;
  const cajas = vacios.map((v) => v.getBoundingClientRect());
  const arriba = Math.min(...cajas.map((c) => c.top));
  const abajo = Math.max(...cajas.map((c) => c.bottom));
  return {
    top: (arriba - cajaPila.top) / (escala || 1),
    alto: Math.max(14, (abajo - arriba) / (escala || 1)),
    cuantos: vacios.length,
  };
}

export function AccesoriosVariasPaginas() {
  const [pila, setPila] = useState<HTMLElement | null>(null);
  const [medida, setMedida] = useState<Medida>({ paginas: 1, vacios: null });
  const [, repintar] = useReducer((n: number) => n + 1, 0);
  const estado = leerEstado();

  useEffect(() => suscribir(repintar), []);

  /* La pila tarda un cuadro en existir: la ventana entera vive en un portal. */
  useEffect(() => {
    let id = 0;
    const buscar = () => {
      const el = document.querySelector<HTMLElement>('.txtw-pila');
      if (el) setPila(el);
      else id = requestAnimationFrame(buscar);
    };
    buscar();
    return () => cancelAnimationFrame(id);
  }, []);

  /*
   * Una sola vigilancia para las tres cosas que dependen de la maquetación:
   * cuántas hojas hay, dónde están los renglones vacíos, y si algún salto ha
   * quedado con la altura de antes porque el alumno escribió más arriba.
   *
   * Se comparan los valores antes de guardarlos, y ése no es un ahorro: las
   * franjas se pintan DENTRO de la pila, así que un `setState` que no cambia
   * nada volvería a tocar el DOM que este mismo observador vigila.
   */
  useEffect(() => {
    if (!pila) return undefined;
    let pendiente = 0;
    const medir = () => {
      pendiente = 0;
      const paginas = Math.max(1, pila.querySelectorAll('.txtw-hoja').length);
      const vacios = medirVacios(pila);
      setMedida((antes) => {
        const igual =
          antes.paginas === paginas &&
          antes.vacios?.cuantos === vacios?.cuantos &&
          Math.round(antes.vacios?.top ?? -1) === Math.round(vacios?.top ?? -1) &&
          Math.round(antes.vacios?.alto ?? -1) === Math.round(vacios?.alto ?? -1);
        return igual ? antes : { paginas, vacios };
      });
      const vista = laVista();
      if (vista) programarAjuste(vista);
    };
    const observador = new MutationObserver(() => {
      if (!pendiente) pendiente = requestAnimationFrame(medir);
    });
    observador.observe(pila, { childList: true, subtree: true, characterData: true, attributes: true });
    medir();
    return () => {
      observador.disconnect();
      if (pendiente) cancelAnimationFrame(pendiente);
    };
  }, [pila]);

  const cerrar = useCallback(() => {
    cambiarEstado({ modo: 'ninguno' });
    /*
     * Al cerrar, el foco vuelve al documento. No es cortesía: si el alumno abrió
     * el encabezado con doble clic y no ha tocado la cinta, la clase todavía no
     * tiene la vista del editor, y ésta es la manera de que el maestro se entere
     * de que ya hay encabezado — ProseMirror despacha una transacción de
     * selección en cuanto recupera el foco.
     */
    document.querySelector<HTMLElement>('.txtw-flujo')?.focus();
  }, []);

  if (!pila) return null;

  const editando = estado.modo !== 'ninguno';
  const hojas = Array.from({ length: medida.paginas }, (_, k) => k);

  return createPortal(
    <>
      {/* El cuerpo se atenúa mientras se edita la franja, como en Word. */}
      {editando &&
        hojas.map((k) => (
          <div
            key={`velo-${k}`}
            className="n4pg-velo"
            style={{ top: k * PASO_PAGINA + MARGEN, left: MARGEN, width: CONTENIDO_ANCHO, height: CONTENIDO_ALTO }}
            onMouseDown={(e) => {
              e.preventDefault();
              cerrar();
            }}
          />
        ))}

      {hojas.map((k) => (
        <Franja
          key={`enc-${k}`}
          hoja={k}
          tipo="encabezado"
          texto={estado.encabezado}
          editando={editando}
          conFoco={estado.modo === 'encabezado' && k === estado.hojaFoco}
          numero={false}
          onEditar={(t) => cambiarEstado({ encabezado: t })}
          onAbrir={(tipo, hoja) => cambiarEstado({ modo: tipo, hojaFoco: hoja })}
        />
      ))}

      {hojas.map((k) => (
        <Franja
          key={`pie-${k}`}
          hoja={k}
          tipo="pie"
          texto={estado.pie}
          editando={editando}
          conFoco={estado.modo === 'pie' && k === estado.hojaFoco}
          numero={estado.numeroPuesto}
          onEditar={(t) => cambiarEstado({ pie: t })}
          onAbrir={(tipo, hoja) => cambiarEstado({ modo: tipo, hojaFoco: hoja })}
        />
      ))}

      {/* Uno por hoja: si sólo hubiera uno, al editar el pie de la hoja 3 la
          salida quedaría dos pantallas más arriba y no habría forma de volver. */}
      {editando &&
        hojas.map((k) => (
          <button
            key={`cerrar-${k}`}
            type="button"
            className="n4pg-cerrar"
            style={{ top: k * PASO_PAGINA + 12, left: MARGEN + CONTENIDO_ANCHO - 176 }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={cerrar}
          >
            Cerrar encabezado y pie
          </button>
        ))}

      {medida.vacios && <AvisoVacios {...medida.vacios} />}
    </>,
    pila,
  );
}

export default AccesoriosVariasPaginas;
