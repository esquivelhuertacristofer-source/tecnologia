'use client';

import { useEffect, useRef, useState } from 'react';
import type { EscenarioProps } from '@/components/office/VentanaDiapositivas';
import { Lamina } from '@/components/office/motor-diapos/Lamina';
import { pieDe } from '@/components/office/motor-diapos/mazo';
import './dosPantallas.css';

/**
 * El escenario de `of-ppt-presenta-y-comparte` (§43.1): **las dos pantallas**.
 *
 * ── POR QUÉ NO BASTA CON ENSEÑAR LA VISTA MODERADOR ─────────────────────────
 *
 * Porque la lección no es «existe una pantalla con notas»: es que **hay dos y
 * enseñan cosas distintas al mismo tiempo**. Un alumno que sólo viera la Vista
 * Moderador aprendería una pantalla nueva; viéndolas juntas aprende la relación,
 * que es lo que le hace levantar la vista del portátil el día que le toque.
 *
 * Arriba, la pared del salón con el proyector: **sólo la diapositiva**, sin un
 * solo mando encima — porque el público no ve mandos, y pintarle uno sería la
 * misma mentira que un botón flotante genérico. Abajo, el portátil del que
 * habla, con la Vista Moderador dentro de su marco y **los controles metidos en
 * la barra del propio portátil**, que es donde están en el programa.
 *
 * ── LA MITAD QUE HACE QUE SE ENTIENDA ───────────────────────────────────────
 *
 * Con `Desde el principio` las dos pantallas enseñan **lo mismo**, y el rótulo
 * del portátil lo dice: «Tu pantalla — la misma que el público». Ése es el
 * estado del que hay que salir. Con `Vista Moderador` la de abajo cambia y la de
 * arriba no se entera. La diferencia no se explica: se ve, y se ve porque el
 * escenario sabe con qué botón lo abrieron (`abiertaCon`).
 */

const dos = (n: number) => String(n).padStart(2, '0');
const reloj = (s: number) => `${dos(Math.floor(s / 60))}:${dos(s % 60)}`;

export function DosPantallas({
  mazo,
  diapositiva,
  indice,
  total,
  irA,
  salir,
  gesto,
  abiertaCon,
}: EscenarioProps) {
  const moderador = abiertaCon === 'vista-moderador';
  const [segundos, setSegundos] = useState(0);
  /** Ya se llegó al final al menos una vez. Es lo que cierra el encargo 5. */
  const llego = useRef(false);

  useEffect(() => {
    const t = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  /*
   * Llegar a la última ES el encargo, y por eso el gesto sale de aquí y no de
   * un botón: pulsar «siguiente» siete veces no es presentar, llegar al final
   * sí. Se emite una sola vez por función; si el alumno se pasea adelante y
   * atrás, no cuenta dos veces.
   */
  useEffect(() => {
    if (indice === total - 1 && !llego.current) {
      llego.current = true;
      gesto('repaso-al-final');
    }
  }, [gesto, indice, total]);

  const siguiente = indice + 1 < total ? mazo.diapositivas[indice + 1] : null;
  const notas = diapositiva.notas?.trim();

  return (
    <div className="dpt" role="dialog" aria-modal="true" aria-label="Presentación en dos pantallas">
      {/* ── arriba: la pared del salón ── */}
      <div className="dpt-salon">
        <div className="dpt-pared">
          <div className="dpt-proyector" aria-hidden="true">
            <i />
          </div>
          <div className="dpt-pantalla">
            {/* El pie sale del mazo por `pieDe` y no de un `numeroDiapositiva ?
                indice + 1` escrito aquí: desde §44.3 hay también un texto de pie
                y una excepción para la portada, y una pared del salón que
                enseñara el número pero no el nombre de la escuela estaría
                enseñando una diapositiva que no existe. */}
            <div className="dpt-lamina">
              <Lamina
                mazo={mazo}
                diapositiva={diapositiva}
                numero={pieDe(mazo, indice).numero}
                pie={pieDe(mazo, indice).texto}
              />
            </div>
          </div>
          <p className="dpt-placa">Lo que ve el público</p>
        </div>
        {/* Las butacas, en silueta. No son adorno: sin ellas «el público» es una
            palabra, y con ellas es alguien que está mirando. */}
        <div className="dpt-butacas" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>

      {/* ── abajo: el portátil del que habla ── */}
      <div className="dpt-mesa">
        <div className={`dpt-portatil${moderador ? ' es-moderador' : ''}`}>
          <div className="dpt-barra">
            <span className="dpt-donde">
              Diapositiva <b>{indice + 1}</b> de {total}
            </span>
            <span className="dpt-reloj" aria-label="Tiempo transcurrido">
              ⏱ {reloj(segundos)}
            </span>
            <span className="dpt-rotulo">
              {moderador ? 'Vista Moderador — sólo tú ves esto' : 'Tu pantalla — la misma que el público'}
            </span>
          </div>

          <div className="dpt-tapa">
            {moderador ? (
              <div className="dpt-moderador">
                <div className="dpt-actual">
                  <div className="dpt-lamina">
                    <Lamina mazo={mazo} diapositiva={diapositiva} />
                  </div>
                </div>
                <div className="dpt-derecha">
                  <div className="dpt-siguiente">
                    <span className="dpt-cabecera">Siguiente</span>
                    {siguiente ? (
                      <div className="dpt-lamina">
                        <Lamina mazo={mazo} diapositiva={siguiente} />
                      </div>
                    ) : (
                      <p className="dpt-nada">Es la última. Después vienen las preguntas.</p>
                    )}
                  </div>
                  <div className="dpt-notas">
                    <span className="dpt-cabecera">Tus notas</span>
                    {notas ? (
                      <p>{notas}</p>
                    ) : (
                      <p className="dpt-nada">
                        Esta diapositiva no tiene notas. Aquí es donde se echan de menos.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="dpt-lamina">
                <Lamina
                  mazo={mazo}
                  diapositiva={diapositiva}
                  numero={pieDe(mazo, indice).numero}
                  pie={pieDe(mazo, indice).texto}
                />
              </div>
            )}
          </div>

          {/* Los mandos van en el chasis del portátil, no flotando sobre la
              escena: en la pantalla del público no hay mandos, y aquí sí. */}
          <div className="dpt-mandos">
            <button
              type="button"
              className="dpt-mando"
              aria-label="Anterior"
              disabled={indice === 0}
              onClick={() => irA(indice - 1)}
            >
              ◀
            </button>
            <button
              type="button"
              className="dpt-mando es-grande"
              aria-label="Siguiente"
              disabled={indice + 1 >= total}
              onClick={() => irA(indice + 1)}
            >
              ▶
            </button>
            <span className="dpt-puntos" aria-hidden="true">
              {mazo.diapositivas.map((_, i) => (
                <i key={i} className={i === indice ? 'es-aqui' : undefined} />
              ))}
            </span>
            <button type="button" className="dpt-salir" onClick={salir}>
              Terminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DosPantallas;
