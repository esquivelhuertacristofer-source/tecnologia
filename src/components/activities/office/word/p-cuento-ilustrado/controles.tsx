'use client';

import { Image as IconoImagen, X } from 'lucide-react';
import type { EditorView } from 'prosemirror-view';
import { useEffect, useRef, useState } from 'react';
import { esquema } from '@/components/office/motor/esquema';
import { ALTO_DIBUJO, ANCHO_DIBUJO, DIBUJOS, type Dibujo } from './dibujos';

/**
 * La herramienta que esta clase aporta: **Insertar → Imagen** (doc §36.3.1).
 *
 * El esquema del motor ya tiene el nodo `imagen` —atómico, con src, alt, ancho y
 * alto—, pero no había ningún control de cinta que lo metiera en el documento.
 * Se construye aquí, en la carpeta de la clase, y NO en `comandos.ts`: ésa es la
 * vía que el motor abrió con `ControlesDeClase` para que las 154 clases del
 * temario se puedan construir en paralelo sin pisarse un archivo común.
 *
 * ── POR QUÉ EL CAJÓN CAMBIA EL DIBUJO EN VEZ DE AÑADIR OTRO ─────────────────
 * El encargo es «un cuento con su título y UNA imagen que acompaña al texto». Un
 * niño de siete años que elige el dibujo equivocado, o que lo mete con el cursor
 * en el renglón que no era, no sabe todavía seleccionar un dibujo y borrarlo con
 * Suprimir: se quedaría con dos dibujos, uno de ellos mal puesto, y sin salida
 * que no sea recargar la página. Así que el cajón pone SIEMPRE el dibujo del
 * cuento: quita el que hubiera y mete el elegido donde está el cursor. Volver a
 * abrirlo y elegir otra vez es, a la vez, cambiar de dibujo y cambiarlo de sitio.
 * El diálogo lo dice con todas sus letras, para que no parezca magia.
 */

/* ── el comando ───────────────────────────────────────────────────────────── */

/**
 * Mete el dibujo DESPUÉS del bloque donde está el cursor.
 *
 * Detrás y no encima, por la misma razón por la que el motor cambió `tabla`: si
 * el alumno tiene algo seleccionado —y el encargo anterior le ha pedido
 * justamente seleccionar el título— insertar encima se comería su trabajo.
 * Insertar nunca puede borrar lo que el alumno acaba de hacer.
 */
export function ponerDibujo(vista: EditorView, dibujo: Dibujo): boolean {
  const { imagen } = esquema.nodes;
  const { state } = vista;

  let posVieja = -1;
  let tamVieja = 0;
  state.doc.forEach((nodo, offset) => {
    if (posVieja >= 0 || nodo.type !== imagen) return;
    posVieja = offset;
    tamVieja = nodo.nodeSize;
  });

  const $to = state.selection.$to;
  let donde = $to.depth > 0 ? $to.after(1) : $to.pos;

  let tr = state.tr;
  if (posVieja >= 0) {
    tr = tr.delete(posVieja, posVieja + tamVieja);
    // Quitar el viejo mueve todo lo que venía detrás: el sitio de entrada hay
    // que traducirlo al documento de después del borrado, no al de antes.
    donde = tr.mapping.map(donde);
  }

  tr = tr.insert(
    donde,
    imagen.create({
      src: dibujo.src,
      alt: dibujo.alt,
      ancho: ANCHO_DIBUJO,
      alto: ALTO_DIBUJO,
      // Atributo propio de esta clase: el dibujo de un cuento va centrado en la
      // hoja. El esquema deja pasar cualquier valor y el CSS de la clase lo pinta.
      ajuste: 'centrado',
    }),
  );

  vista.dispatch(tr.scrollIntoView());
  vista.focus();
  volverAPreguntar(vista);
  return true;
}

/**
 * Vuelve a preguntarle al maestro pasada la celebración. **Medido, no supuesto.**
 *
 * El panel se toma 1,5 s para decir «¡Eso es!» y durante ese rato ignora lo que
 * cambia en el documento. El encargo anterior a éste se cumple abriendo el
 * cajón, así que la celebración arranca justo cuando el diálogo se abre: un niño
 * que ya sabe cuál es su dibujo lo elige y lo mete en menos de segundo y medio,
 * y el cambio se pierde. Medido en el banco: insertado a los 115 ms, el
 * documento quedaba perfecto y el panel seguía pidiendo el dibujo.
 *
 * No se recupera solo, y ésta es la diferencia con los demás encargos: después
 * de meter el dibujo, el cajón se cierra y al alumno no le queda nada que tocar
 * —cualquier clic en el documento habría vuelto a disparar la corrección—. Así
 * que se despacha una transacción vacía cuando la celebración ya ha pasado: no
 * cambia el documento, no entra en el historial de deshacer, sólo hace que el
 * maestro vuelva a leer.
 */
function volverAPreguntar(vista: EditorView) {
  window.setTimeout(() => {
    if (vista.isDestroyed || !vista.dom.isConnected) return;
    vista.dispatch(vista.state.tr.setMeta('addToHistory', false));
  }, 1700);
}

/* ── el diálogo ───────────────────────────────────────────────────────────── */

export interface CajonProps {
  /** Ya hay un dibujo puesto: el diálogo avisa de que se va a cambiar. */
  hayDibujo: boolean;
  onPoner: (d: Dibujo) => void;
  onCerrar: () => void;
}

/**
 * El cajón de dibujos, con la forma de un cuadro de diálogo de Word: barra de
 * título con su aspa, una rejilla de miniaturas y los dos botones abajo a la
 * derecha. Se elige con un clic y se confirma con «Insertar», que es lo que hace
 * el diálogo de verdad —y lo que impide que un roce del ratón meta un dibujo—.
 *
 * Sólo existe mientras está abierto: es el laboratorio quien lo monta y lo
 * desmonta. Así el dibujo marcado se olvida solo al cerrar, sin tener que
 * ponerlo a cero desde un efecto —que es una cascada de repintados y además lo
 * que el lint de React prohíbe con razón—.
 */
export function CajonDeDibujos({ hayDibujo, onPoner, onCerrar }: CajonProps) {
  const [elegido, setElegido] = useState<string | null>(null);
  const caja = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => caja.current?.querySelector<HTMLButtonElement>('.cuentoi-pieza')?.focus());
    // En captura: el diálogo tiene que quedarse con la tecla antes que la
    // portada de la práctica, que también escucha Escape en la ventana.
    const teclas = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      onCerrar();
    };
    window.addEventListener('keydown', teclas, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('keydown', teclas, true);
    };
  }, [onCerrar]);

  const dibujo = DIBUJOS.find((d) => d.id === elegido) ?? null;

  return (
    <div className="cuentoi-cajon" role="dialog" aria-modal="true" aria-label="Insertar imagen">
      <div className="cuentoi-caja" ref={caja}>
        <header className="cuentoi-cab">
          <span className="cuentoi-cab-icono" aria-hidden="true">
            <IconoImagen size={15} strokeWidth={2.3} />
          </span>
          <span className="cuentoi-cab-titulo">Insertar imagen</span>
          <button type="button" className="cuentoi-aspa" onClick={onCerrar} aria-label="Cerrar sin insertar">
            <X size={15} strokeWidth={2.6} />
          </button>
        </header>

        <p className="cuentoi-ayuda">
          Elige el dibujo que cuenta lo mismo que dice tu cuento. Entrará donde dejaste el cursor.
        </p>

        <div className="cuentoi-rejilla" role="listbox" aria-label="Dibujos disponibles">
          {DIBUJOS.map((d) => (
            <button
              key={d.id}
              type="button"
              role="option"
              aria-selected={elegido === d.id}
              className={`cuentoi-pieza${elegido === d.id ? ' es-elegida' : ''}`}
              onClick={() => setElegido(d.id)}
              onDoubleClick={() => onPoner(d)}
            >
              {/* Miniaturas del propio proyecto; `next/image` no aporta nada
                  aquí y sí ataría el diálogo a la configuración del anfitrión. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.src} alt="" />
              <span className="cuentoi-pieza-nombre">{d.nombre}</span>
            </button>
          ))}
        </div>

        <footer className="cuentoi-pie">
          {/*
            La rama de «todavía no hay dibujo» decía «Tu cuento lleva un
            dibujo», que es falso justo cuando el niño lo lee: acaba de abrir el
            cajón porque su cuento NO lleva ninguno. Medido en el banco al abrir
            el cajón por primera vez. Ahora cada rama dice lo que pasa de verdad.
          */}
          <span className="cuentoi-nota">
            {hayDibujo
              ? 'Tu cuento ya tiene un dibujo. El que elijas ahora lo cambia por ése y se pone donde está el cursor.'
              : 'El cuento lleva un solo dibujo. Si te equivocas, lo puedes cambiar las veces que quieras.'}
          </span>
          <button type="button" className="cuentoi-boton es-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className="cuentoi-boton"
            disabled={!dibujo}
            onClick={() => dibujo && onPoner(dibujo)}
          >
            Insertar
          </button>
        </footer>
      </div>
    </div>
  );
}
