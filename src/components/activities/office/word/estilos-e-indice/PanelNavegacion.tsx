'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './estilo.css';

/**
 * El panel de Navegación de `of-word-estilos-e-indice`.
 *
 * Es el instrumento que hace VISIBLE la lección de la clase. El alumno pone un
 * título a mano —negrita y catorce puntos, se ve enorme— y aquí no aparece
 * nada; le pone el estilo Título 2 y aparece en el mismo instante, con su
 * sangría, debajo de su sección. Sin este panel, la diferencia entre «se ve
 * como un título» y «es un título» sólo se nota al regenerar el índice, que es
 * dos clics más tarde y ya no se lee como causa y efecto.
 *
 * ── DE DÓNDE SACA LOS TÍTULOS ───────────────────────────────────────────────
 * Del documento pintado, y no hay otra vía: un accesorio no recibe la vista del
 * editor. Pero no es una lectura a ciegas ni un temporizador: la ventana marca
 * cada transacción en `data-pulso` del nodo raíz —es lo que hace que la cinta
 * se entere de que el cursor entró en un título—, así que basta con observar
 * ese atributo. Se lee con el mismo pulso con el que se repinta la cinta.
 *
 * Y NO se le toca ni un atributo al DOM del editor. ProseMirror vigila su
 * propio DOM —incluidos los atributos— y una marca de «te llevé aquí» pintada
 * encima le haría releer el documento. Lo que se resalta al saltar es la
 * entrada de este panel, que es además lo que hace Word.
 *
 * ── DÓNDE SE CUELGA ─────────────────────────────────────────────────────────
 * `accesorios` se pinta como último hijo de `.txtw`, que es una rejilla de
 * cinco renglones: un panel ahí dentro abriría un sexto. Se porta a
 * `.txtw-medio`, que es la rejilla del documento y del maestro, y ahí sí es una
 * columna de verdad —la hoja se corre a la derecha en vez de quedar tapada—.
 * `.txtw-medio` tiene siempre los mismos dos hijos, así que añadirle uno al
 * final no le estorba a React.
 *
 * El sitio se busca desde un ancla invisible y no desde un efecto: en la
 * devolución de llamada de una `ref`, React garantiza que el DOM de la ventana
 * ya está montado y ahí sí se puede fijar estado sin encadenar repintados.
 */

interface TituloVivo {
  nivel: number;
  texto: string;
  el: HTMLElement;
}

export function PanelNavegacion() {
  const [destino, setDestino] = useState<HTMLElement | null>(null);
  const [titulos, setTitulos] = useState<TituloVivo[]>([]);
  const [actual, setActual] = useState(-1);
  const raizRef = useRef<HTMLElement | null>(null);

  /** Vuelve a leer los títulos del documento pintado. */
  const leer = useCallback(() => {
    const flujo = raizRef.current?.querySelector<HTMLElement>('.txtw-flujo');
    if (!flujo) {
      setTitulos([]);
      return;
    }
    const encontrados = Array.from(flujo.querySelectorAll<HTMLElement>(':scope > h1, :scope > h2'));
    setTitulos(
      encontrados.map((el) => ({ nivel: el.tagName === 'H1' ? 1 : 2, texto: el.textContent ?? '', el })),
    );
  }, []);

  const anclar = useCallback(
    (el: HTMLDivElement | null) => {
      const raiz = el?.closest<HTMLElement>('.txtw') ?? null;
      raizRef.current = raiz;
      setDestino(raiz?.querySelector<HTMLElement>('.txtw-medio') ?? null);
      if (raiz) leer();
    },
    [leer],
  );

  useEffect(() => {
    const raiz = raizRef.current;
    if (!raiz) return undefined;
    const observador = new MutationObserver(leer);
    observador.observe(raiz, { attributes: true, attributeFilter: ['data-pulso'] });
    return () => observador.disconnect();
  }, [destino, leer]);

  /**
   * Avisar de que el hueco del documento se acaba de estrechar.
   *
   * Este panel abre una columna de 258 px, así que el lienzo de la hoja mide
   * menos que hace un instante. El ajuste automático del zoom de la ventana ya
   * midió el ancho de ANTES —corre al montar— y sólo vuelve a mirar cuando le
   * llega un `resize`. Sin este aviso la hoja nacía más ancha que su hueco y
   * salía cortada por los dos lados, que es exactamente el defecto que §36.8
   * arregló para el portátil del aula: medido, a 1024 la hoja empezaba 69 px a
   * la izquierda del lienzo, debajo de este panel, y a 1366 se salía por los
   * dos cantos. Con el aviso, el zoom se ajusta solo a 50 % y a 90 %.
   *
   * Se manda un `resize` y no se toca el zoom a mano a propósito: el ajuste es
   * de la ventana, y en cuanto el alumno usa el mando del zoom manda él.
   */
  useEffect(() => {
    if (!destino) return undefined;
    const id = requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    return () => cancelAnimationFrame(id);
  }, [destino]);

  const saltar = useCallback(
    (i: number) => {
      setActual(i);
      titulos[i]?.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [titulos],
  );

  const conTexto = titulos.filter((t) => t.texto.trim().length > 0).length;

  return (
    <>
      {/* El ancla: no se ve, no ocupa renglón de la rejilla y sólo sirve para
          saber en qué ventana estamos. */}
      <div ref={anclar} style={{ display: 'none' }} aria-hidden="true" />

      {destino &&
        createPortal(
          <div className="ei-nav" aria-label="Panel de navegación">
            {/*
              `data-grupo` va en el marco de DENTRO y no en la columna, para que
              el halo quepa. El maestro dibuja su halo con cinco píxeles de
              holgura alrededor del objetivo, y la columna está pegada al canto
              izquierdo de la ventana: medido, el halo nacía en `left: -5px` y su
              lado izquierdo se veía cortado justo en el primer encargo, que es
              el que manda mirar aquí. El marco entra seis píxeles y el halo cabe
              entero sin que el panel deje de ir acoplado.
            */}
            <div className="ei-nav-marco" data-grupo="navegacion">
            <div className="ei-nav-cab">
              <span className="ei-nav-titulo">Navegación</span>
              <span className="ei-nav-cuenta">
                {conTexto} {conTexto === 1 ? 'título' : 'títulos'}
              </span>
            </div>

            {titulos.length === 0 ? (
              <p className="ei-nav-vacio">
                Este documento todavía no tiene ningún renglón con estilo de título, así que aquí no hay
                nada a lo que saltar.
              </p>
            ) : (
              <nav className="ei-nav-lista">
                {titulos.map((t, i) => (
                  <button
                    key={`${i}-${t.texto}`}
                    type="button"
                    className={`ei-nav-entrada${t.nivel === 2 ? ' es-n2' : ''}${i === actual ? ' es-actual' : ''}`}
                    // Igual que en la cinta: pulsar aquí no puede robarle al
                    // documento lo que el alumno tenga seleccionado.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => saltar(i)}
                  >
                    {t.texto.trim() || 'Título sin nombre'}
                  </button>
                ))}
              </nav>
            )}

            <p className="ei-nav-pie">
              Aquí sólo salen los renglones que tienen puesto un estilo de título. La negrita y el tamaño
              no cuentan.
            </p>
            </div>
          </div>,
          destino,
        )}
    </>
  );
}

export default PanelNavegacion;
