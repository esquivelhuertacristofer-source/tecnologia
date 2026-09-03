'use client';

import type { PanelDeClaseProps } from '@/components/office/VentanaDiapositivas';
import { callejones, destinosDe, nombreDeDiapositiva } from '@/components/office/motor-diapos/mazo';
import './mapaDelQuiosco.css';

/**
 * **El mapa del quiosco** — el panel de clase de `of-ppt-interactiva` (§43.5).
 *
 * Es un instrumento pedagógico y no una parte de PowerPoint, igual que la ficha
 * de revisión de §42.3 y el panel de herencia de §43.4: por eso está siempre
 * abierto y **no tiene botón en la cinta**. Inventarle un domicilio a algo que
 * el lunes no existe es lo que dejó ocho entradas mintiendo en Word (§36.12).
 *
 * ── QUÉ HACE, Y ES UNA SOLA COSA ────────────────────────────────────────────
 *
 * Hace visible el callejón **antes de caer en él**. Sin el mapa, la única forma
 * de descubrir que una sección no tiene salida es presentar, entrar y quedarse
 * encerrado — que es exactamente lo que le pasa al público en la feria, y para
 * entonces ya es tarde. Con el mapa, el rojo se ve desde el primer segundo.
 *
 * **No trae botón de arreglar, y es a propósito.** Un panel que ponga los tres
 * regresos de un clic convertiría el encargo en «pulsa aquí» y la clase entera
 * en una demostración. El mapa dice qué pasa; arreglarlo es del alumno.
 *
 * Todo lo que pinta se DERIVA del mazo con `destinosDe` y `callejones`, que son
 * del motor. El panel no guarda ni un dato: si mañana el alumno mueve un
 * vínculo con otra herramienta que aún no existe, el mapa se entera solo.
 */
export function MapaDelQuiosco({ mazo, indice, irA }: PanelDeClaseProps) {
  const rojas = new Set(callejones(mazo));
  const entran = new Set(
    mazo.diapositivas.flatMap((d) => destinosDe(d)).filter((x): x is number => typeof x === 'number'),
  );
  const conSalida = mazo.diapositivas.filter((d) => destinosDe(d).length > 0).length;

  return (
    <div className="mqk">
      <p className={`mqk-cuenta${rojas.size ? ' es-mal' : ' es-bien'}`} data-cuenta>
        {rojas.size
          ? `${rojas.size} ${rojas.size === 1 ? 'callejón' : 'callejones'}: se entra y no se sale`
          : 'Ningún callejón. De todo lo que se entra, se sale.'}
      </p>

      <ul className="mqk-lista">
        {mazo.diapositivas.map((d, i) => {
          const salidas = destinosDe(d);
          const roja = rojas.has(i);
          return (
            <li key={i}>
              <button
                type="button"
                className={`mqk-fila${i === indice ? ' es-viendo' : ''}${roja ? ' es-callejon' : ''}`}
                data-diapo-mapa={i}
                onClick={() => irA(i)}
              >
                <span className="mqk-num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="mqk-que">
                  <b>{nombreDeDiapositiva(mazo, i)}</b>
                  {/*
                    Las flechas de quién lleva a quién, por TÍTULO. Un «→ 4» no
                    dice a dónde vas, que es la misma decisión que la galería de
                    destinos: elegir a ciegas es lo que hace que un menú salga
                    mal a la primera.
                  */}
                  {salidas.length > 0 ? (
                    <small className="mqk-salidas">
                      {salidas
                        .map((s) => (s === 'atras' ? 'a la que estabas' : nombreDeDiapositiva(mazo, s)))
                        .join(' · ')}
                    </small>
                  ) : entran.has(i) ? (
                    // Corto a propósito: la fila tiene 150 px y el texto va con
                    // ellipsis, así que la frase larga se cortaba en «no sale
                    // ningún…» y el aviso se quedaba a medias. Lo largo está
                    // abajo, en la regla, donde hay sitio para explicarlo.
                    <small className="mqk-sin-salida">se entra y no se sale</small>
                  ) : (
                    <small className="mqk-suelta">nadie salta aquí</small>
                  )}
                </span>
                <span className={`mqk-punto${roja ? ' es-rojo' : salidas.length ? ' es-verde' : ''}`} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mqk-regla">
        <b>{conSalida}</b> de {mazo.diapositivas.length} llevan a algún sitio. Un callejón es una diapositiva a la
        que se <b>entra saltando</b> y de la que no sale ningún vínculo — la última de una presentación normal no
        cuenta, porque a ella nadie salta.
      </p>
    </div>
  );
}

export default MapaDelQuiosco;
