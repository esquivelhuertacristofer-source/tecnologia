'use client';

import { useEffect, useRef, useState } from 'react';
import type { PanelDeClaseProps } from '@/components/office/VentanaDiapositivas';
import { Lamina } from '@/components/office/motor-diapos/Lamina';
import { loQueSeSale, pieDe } from '@/components/office/motor-diapos/mazo';
import { FORMAS, LIENZO_ALTO, anchoDe } from '@/components/office/motor-diapos/modelo';
import './elProyector.css';

/**
 * **El proyector del salón de actos** — el instrumento de `of-ppt-para-que-pantalla`
 * (doc §44.3).
 *
 * ── POR QUÉ ESTA CLASE NO SE PUEDE DAR SIN ÉL ───────────────────────────────
 *
 * Porque «no cabe» es una palabra. El alumno tiene su presentación delante, se
 * ve perfectamente en su pantalla, y le decimos que en el salón de actos va a
 * salir mal: eso es pedirle que se fíe. El proyector lo enseña — la misma
 * diapositiva, metida en una pantalla que no es la suya, con las dos cosas que
 * pasan de verdad: **las franjas negras** o **el estirón**.
 *
 * Es el mismo papel que el comparador de §43.7 y la hoja de intervalos de
 * §43.3: un aparato que convierte una advertencia en algo que se mira.
 *
 * ── LAS DOS MANERAS DE METER 16:9 EN UNA PANTALLA DE 4:3 ────────────────────
 *
 * Y las dos existen fuera de aquí, que es lo que la hace enseñable:
 *
 *   · **Encajarla** — cabe entera y sobran dos franjas negras arriba y abajo.
 *     Es lo que hace un proyector bien configurado, y lo que casi nadie tiene.
 *   · **Estirarla** — se rellena la pantalla deformando a la gente y las
 *     letras. Es lo que hace el proyector del salón el día del concurso.
 *
 * El interruptor entre las dos lo maneja el alumno, y ahí está media lección:
 * ninguna de las dos es buena, y la única salida es que la presentación **sea**
 * de la forma de la pantalla.
 *
 * Cuando la presentación ya está en 4:3 el proyector deja de deformar nada y
 * empieza a hacer el otro trabajo: **enseñar lo que se sale**, que es lo que
 * cierra el encargo de recolocar.
 */

type Modo = 'encajar' | 'estirar';

export function ElProyector({ mazo, diapositiva, indice, gesto }: PanelDeClaseProps) {
  /*
   * Apagado al entrar, y es a propósito: encenderlo es el primer encargo. Un
   * proyector que ya está puesto no se «mira», está de fondo — y lo que la
   * clase quiere es el momento en que el alumno ve por primera vez su
   * presentación en una pantalla que no es la suya.
   */
  const [encendido, setEncendido] = useState(false);
  const [modo, setModo] = useState<Modo>('estirar');

  /*
   * ── POR QUÉ AQUÍ SE MIDE ────────────────────────────────────────────────
   *
   * Porque **el CSS en porcentajes no deforma las letras**, y esa era la
   * primera versión: la lámina metida en una caja de 4:3 se reacomodaba sola y
   * salía perfecta, sólo que más pequeña. Un proyector que no deforma nada en
   * la clase que trata de la deformación.
   *
   * Estirar es `scale(sx, sy)` **con dos factores distintos**, y para eso hace
   * falta saber cuánto mide la pantalla en píxeles de verdad: no hay unidad de
   * CSS que divida el ancho del contenedor entre su alto. Se mide con un
   * `ResizeObserver` porque el panel es elástico —se estrecha al abrir otro— y
   * medir una vez al montar dejaría el estirón calculado sobre un ancho que ya
   * no existe.
   */
  const pantalla = useRef<HTMLDivElement | null>(null);
  const [caja, setCaja] = useState({ ancho: 0, alto: 0 });
  useEffect(() => {
    const el = pantalla.current;
    if (!el) return undefined;
    const ojo = new ResizeObserver(([e]) =>
      setCaja({ ancho: e.contentRect.width, alto: e.contentRect.height }),
    );
    ojo.observe(el);
    return () => ojo.disconnect();
  }, [encendido]);

  const suya = mazo.forma ?? '16-9';
  /** La pantalla del salón no cambia nunca: el proyector es el que hay. */
  const laDelSalon = FORMAS['4-3'];
  const encaja = suya === '4-3';
  const sale = loQueSeSale(mazo, indice);

  /*
   * Los dos factores del proyector, en un sitio y con nombre.
   *
   *   · **estirar** — cada eje al suyo. Como son distintos, deforma: es lo que
   *     hace el proyector del salón y lo que hay que ver.
   *   · **encajar** — los dos al más pequeño. Cabe entera y sobra sitio, que son
   *     las franjas negras.
   *
   * Cuando la presentación ya es de la forma de la pantalla los dos salen
   * iguales **solos**, sin caso especial: eso es lo que dice que el modelo está
   * bien puesto.
   */
  const sx = caja.ancho / anchoDe(suya);
  const sy = caja.alto / LIENZO_ALTO;
  const uniforme = Math.min(sx, sy);

  if (!encendido) {
    return (
      <div className="prj prj-apagado">
        <p className="prj-rotulo">El proyector del salón de actos</p>
        <p className="prj-nota">
          Es el de siempre: <b>{laDelSalon.nombre}</b>. {laDelSalon.dondeSeVe}
        </p>
        <button
          type="button"
          className="prj-encender"
          data-encender-proyector
          onClick={() => {
            setEncendido(true);
            gesto('proyector');
          }}
        >
          Encender el proyector
        </button>
        <p className="prj-nota">
          Antes de llevarla al concurso, asómate a ver cómo se va a ver ahí.
        </p>
      </div>
    );
  }

  return (
    <div className="prj">
      <p className="prj-rotulo">
        Diapositiva {indice + 1} en la pantalla del salón · {laDelSalon.nombre}
      </p>

      {/*
        La pantalla, con su proporción de verdad y su marco. Dentro va la lámina
        de siempre —la misma que ve el público y la que se imprime—, porque un
        dibujo aparte del proyector sería un segundo sitio donde arreglar cada
        defecto de pintura.
      */}
      <div className="prj-pantalla" ref={pantalla} data-proyector={encaja ? 'cabe' : modo}>
        {diapositiva && caja.ancho > 0 && (
          <div
            className="prj-imagen"
            data-imagen-proyectada
            data-como={encaja ? 'cabe' : modo}
            style={{
              width: anchoDe(suya),
              height: LIENZO_ALTO,
              transform:
                modo === 'encajar' && !encaja
                  ? `scale(${uniforme})`
                  : `scale(${sx}, ${sy})`,
            }}
          >
            <Lamina
              mazo={mazo}
              diapositiva={diapositiva}
              numero={pieDe(mazo, indice).numero}
              pie={pieDe(mazo, indice).texto}
            />
          </div>
        )}
      </div>

      {/*
        El interruptor sólo mientras la presentación NO es de la forma de la
        pantalla: cuando ya lo es, no hay nada que elegir — cabe y ya está—, y
        dejar dos botones que hacen lo mismo enseñaría que la decisión sigue
        abierta cuando el problema está resuelto.
      */}
      {!encaja ? (
        <>
          <div className="prj-modos" role="group" aria-label="Cómo la mete el proyector">
            {(['encajar', 'estirar'] as Modo[]).map((x) => (
              <button
                key={x}
                type="button"
                className={modo === x ? 'es-puesto' : undefined}
                data-modo={x}
                aria-pressed={modo === x}
                onClick={() => setModo(x)}
              >
                {x === 'encajar' ? 'Encajarla' : 'Estirarla'}
              </button>
            ))}
          </div>
          <p className="prj-veredicto es-mal" data-veredicto>
            {modo === 'estirar'
              ? 'Así es como sale de verdad: la pantalla se llena y todo se deforma. Las caras se ensanchan y las letras engordan.'
              : 'Cabe entera, pero sobran dos franjas negras. Se pierde casi un tercio de la pantalla del salón.'}
          </p>
          <p className="prj-nota">
            Tu presentación es <b>{FORMAS[suya].nombre}</b> y esta pantalla es{' '}
            <b>{laDelSalon.nombre}</b>. Ninguna de las dos formas de meterla es buena: la salida es
            que la presentación sea de la forma de la pantalla.
          </p>
        </>
      ) : sale.length > 0 ? (
        <p className="prj-veredicto es-mal" data-veredicto>
          Ya es de la forma de la pantalla, pero <b>{sale.length}</b>{' '}
          {sale.length === 1 ? 'cosa se sale' : 'cosas se salen'} por la derecha. En el salón se
          verá cortada.
        </p>
      ) : (
        <p className="prj-veredicto es-bien" data-veredicto>
          Cabe entera, sin franjas y sin deformar. Así se va a ver en el salón.
        </p>
      )}
    </div>
  );
}

export default ElProyector;
