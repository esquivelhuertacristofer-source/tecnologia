'use client';

import type { PanelDeClaseProps } from '@/components/office/VentanaDiapositivas';
import { RELOJ } from '@/components/office/motor-diapos/Reproductor';
import { useTomas } from '../comun/grabadora';
import { ENSAYO, TOTAL_ENSAYADO } from './guion';
import './hojaDeLaGrabacion.css';

/**
 * La hoja de la grabación de `of-ppt-grabala` (doc §44.6).
 *
 * Hermana de la hoja de intervalos de §43.3 y con un trabajo distinto: aquella
 * contesta «¿cuánto dura?» y ésta contesta **«¿cuánto ha cambiado?»**. Por eso
 * tiene dos columnas de tiempos y no una — el ensayo y la grabación, uno al
 * lado del otro—: la lección del encargo 5 es que los tiempos del ensayo se
 * quedaron cortos, y eso no se ve en una columna sola por muy grande que sea el
 * número. Una diferencia hay que poder verla como diferencia.
 *
 * La columna «Ensayo» sale de `ENSAYO`, que es lo que el mazo traía puesto al
 * abrir la clase; la columna «Grabación», del mazo vivo. Y las tomas salen de
 * la grabadora, que es lo único de esta pantalla que no está en el archivo.
 */

export function HojaDeLaGrabacion({ mazo, indice, irA }: PanelDeClaseProps) {
  const tomas = useTomas();
  const total = mazo.diapositivas.reduce((s, d) => s + (d.intervalo ?? 0), 0);
  /*
   * Cuántas se grabaron ALGUNA VEZ, contra las tomas y no contra el mazo. Es el
   * defecto §44.6 C: mirándolo contra `narrada`, quitar la narración —que es el
   * último encargo— borraba los tiempos de la columna y devolvía el aviso de
   * «todavía no la has grabado» a una presentación que se acababa de grabar.
   * Justo lo contrario de lo que el encargo enseña, y en la misma pantalla en
   * la que lo dice.
   */
  const grabadas = Object.keys(tomas).length;
  const crecio = total - TOTAL_ENSAYADO;

  return (
    <div className="hgr">
      <div className="hgr-cabeza" aria-hidden="true">
        <span />
        <span>Ensayo</span>
        <span>Grabación</span>
      </div>

      <ol className="hgr-lista" aria-label="El ensayo y la grabación, diapositiva a diapositiva">
        {mazo.diapositivas.map((d, i) => {
          const antes = ENSAYO[i] ?? 0;
          const ahora = d.intervalo ?? 0;
          const repetida = (tomas[i] ?? 0) >= 2;
          const seGrabo = (tomas[i] ?? 0) > 0;
          return (
            <li key={i}>
              <button
                type="button"
                className={`hgr-fila${i === indice ? ' es-aqui' : ''}`}
                data-grabacion={i}
                onClick={() => irA(i)}
              >
                <span className="hgr-que">
                  <b>
                    {i + 1}. {d.marcadores.find((x) => x.rol === 'titulo')?.contenido ?? 'Sin título'}
                  </b>
                  {/*
                    Las tomas, y sólo cuando hay más de una. Poner «1 toma» en
                    las seis llenaría la hoja de un dato que no dice nada; lo que
                    tiene que saltar a la vista es CUÁL repetiste, que es la
                    respuesta al encargo 3.
                  */}
                  {repetida && <small data-tomas={i}>repetida · {tomas[i]} tomas</small>}
                </span>
                <span className="hgr-antes">{RELOJ(antes)}</span>
                {/*
                  Una raya mientras no haya voz, y no el número del ensayo
                  repetido. Salió mirando la pantalla antes de grabar nada: las
                  seis filas enseñaban «0:10 · 0:10» bajo una columna que dice
                  GRABACIÓN, o sea seis tiempos de una grabación que no existe.
                  Y encima escondía la lección — con las dos columnas iguales de
                  entrada, el alumno no tiene de dónde ver que cambió algo.
                */}
                <span className={`hgr-ahora${d.narrada ? ' es-voz' : ''}`} data-ahora={i}>
                  {seGrabo ? (
                    <>
                      {/* El altavoz depende de la VOZ; el número, de haberla
                          grabado. Son dos cosas distintas y se separan al
                          quitar la narración: entonces el tiempo se queda y el
                          altavoz se va, que es exactamente la lección. */}
                      {d.narrada && (
                        <i aria-hidden="true" title="Lleva tu voz">
                          🔊
                        </i>
                      )}
                      {RELOJ(ahora)}
                    </>
                  ) : (
                    <em aria-label="sin grabar">—</em>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/*
        El total sí es siempre un número, y con las dos columnas: es **lo que va
        a durar el video**, que existe haya voz o no. Poner una raya aquí sería
        esconder el dato del que cuelga el encargo 6.
      */}
      <div className="hgr-total" data-total>
        <span className="hgr-total-que">Toda la presentación</span>
        <span className="hgr-total-antes">{RELOJ(TOTAL_ENSAYADO)}</span>
        <span className="hgr-total-ahora">{RELOJ(total)}</span>
      </div>

      {/*
        El veredicto, escrito como una frase y no como un número suelto. Un
        «+1:12» en la esquina lo lee quien ya sabe qué significa; la clase es
        justo para el que todavía no.
      */}
      {crecio !== 0 && (
        <p className="hgr-veredicto" data-crecio={crecio}>
          Contarla tarda <b>{RELOJ(Math.abs(crecio))}</b> {crecio > 0 ? 'más' : 'menos'} que pasarla.
        </p>
      )}

      <p className="hgr-regla">
        Grabar deja <b>dos cosas</b> en cada diapositiva: tu voz y tu tiempo. Los altavoces son la
        voz; la columna de la derecha, el tiempo. El video que exportes durará esa suma.
      </p>

      {/* Y cuando ya no queda voz pero sí tiempos, hay que decirlo: es el estado
          en el que termina la clase y sin esta línea parece un error. */}
      {grabadas > 0 && mazo.diapositivas.every((d) => !d.narrada) && (
        <p className="hgr-muda" data-muda>
          Se quedó <b>muda</b>, y con sus tiempos puestos: pasa sola y la cuentas tú.
        </p>
      )}

      {grabadas === 0 && (
        <p className="hgr-aviso" data-sin-voz>
          Todavía no la has grabado: esos tiempos son los de tu ensayo, cuando pasabas las
          diapositivas sin decir nada.
        </p>
      )}
    </div>
  );
}

export default HojaDeLaGrabacion;
