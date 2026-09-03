'use client';

import { X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EditorView } from 'prosemirror-view';
import {
  buscarEn,
  buscarSiguiente,
  decoracionesDe,
  irAPagina,
  reemplazarTodo,
  reemplazarUno,
  type Criterio,
} from './buscador';
import './estilo.css';

/**
 * El cuadro «Buscar y reemplazar», tal como lo abre Word.
 *
 * Va como `accesorios` de la ventana —no dentro de la cinta— porque en Word esto
 * es un diálogo y no un panel de la cinta, y la regla del software ultra-LITE
 * dice que tiene que PARECER el programa de verdad. Tres pestañas, dos campos,
 * las dos casillas que dan la lección, y los botones en el orden de Word.
 *
 * ── DOS DECISIONES QUE VIENEN DE LA CLASE ───────────────────────────────────
 *
 * **Las casillas están ESCONDIDAS detrás de «Más >>», como en Word.** El cuadro
 * de verdad se abre pequeño —dos campos y los botones— y las opciones de
 * búsqueda sólo aparecen al pulsar «Más >>». Aquí eso no es un adorno de
 * fidelidad: es lo que garantiza el tercer encargo. Medido jugando mal, con las
 * casillas a la vista un alumno marca «Sólo palabras completas» antes de tiempo,
 * el documento no se estropea, y la clase se queda sin el fracaso del que vive.
 * Con el cuadro cerrado, el reemplazo a ciegas es el camino natural — y
 * descubrir que media herramienta estaba detrás de un botón es, además, la
 * lección del quinto encargo.
 *
 * **Después de reemplazar, el cuadro dice cuántos cambios hizo.** Word lo dice
 * («Word ha realizado 12 reemplazos») y aquí importa el doble: doce cuando el
 * alumno quería ocho es la primera señal de que algo se le fue de las manos, y
 * la que le hace mirar la hoja antes de que el maestro se lo diga.
 *
 * ── POR QUÉ EL ESTADO VIVE AQUÍ Y NO EN EL LABORATORIO ──────────────────────
 * Porque teclear en el cuadro de búsqueda no tiene por qué repintar la cinta
 * entera. El laboratorio guarda sólo si el cuadro está abierto y en qué pestaña
 * —que es lo único que la cinta necesita saber para hundir su botón—, y el texto
 * buscado, las casillas y el resultado se quedan dentro de este componente.
 */

export type PestanaBuscador = 'buscar' | 'reemplazar' | 'ir-a';

interface Props {
  vista: EditorView;
  pestana: PestanaBuscador;
  onPestana: (p: PestanaBuscador) => void;
  onCerrar: () => void;
}

/** Dónde aparece el cuadro la primera vez: sobre el margen izquierdo de la hoja. */
const INICIO = { x: 34, y: 168 };

export function PanelBuscar({ vista, pestana, onPestana, onCerrar }: Props) {
  const [termino, setTermino] = useState('');
  const [reemplazo, setReemplazo] = useState('');
  const [mayusculas, setMayusculas] = useState(false);
  const [palabras, setPalabras] = useState(false);
  const [numeroPagina, setNumeroPagina] = useState('');
  /** «Más >>»: las opciones de búsqueda empiezan escondidas, como en Word. */
  const [masOpciones, setMasOpciones] = useState(false);
  const [actual, setActual] = useState(-1);
  const [recado, setRecado] = useState<string | null>(null);
  const [posicion, setPosicion] = useState(INICIO);
  /**
   * Sube cada vez que el documento cambia por donde sea —tecleando, deshaciendo
   * o desde este mismo cuadro—. Sin él, el contador se quedaría clavado en el
   * número de la última vez que se tocó el cuadro, y un contador que miente en
   * una clase que consiste en leerlo es peor que no tener contador.
   */
  const [sello, setSello] = useState(0);

  const criterio = useMemo<Criterio>(() => ({ termino, mayusculas, palabras }), [termino, mayusculas, palabras]);

  const coincidencias = useMemo(() => {
    // `sello` no se usa dentro: está en las dependencias para que la cuenta se
    // rehaga cuando cambie el documento, que es lo único que puede cambiarla
    // sin que cambie el criterio.
    void sello;
    return buscarEn(vista.state.doc, criterio);
  }, [vista, criterio, sello]);

  /**
   * La coincidencia en la que va el alumno, ya recortada.
   *
   * Se calcula al pintar y no se guarda: un «Reemplazar todos» puede dejar el
   * número apuntando a una coincidencia que ya no existe, y arreglarlo con un
   * efecto que vuelve a guardar estado es dar un repintado de más para llegar al
   * mismo sitio.
   */
  const actualValido = actual >= 0 && actual < coincidencias.length ? actual : -1;

  /* ── las marcas amarillas, y el aviso de que el documento cambió ───────── */

  const pendiente = useRef(false);
  useEffect(() => {
    const avisar = () => {
      if (pendiente.current) return;
      pendiente.current = true;
      requestAnimationFrame(() => {
        pendiente.current = false;
        setSello((s) => s + 1);
      });
    };
    /*
     * `decorations` es una propiedad DIRECTA de la vista, no un plugin: se suma
     * a las que ya pone el paginador en vez de sustituirlas, y así esta clase
     * pinta sobre el documento sin reconfigurar el editor del motor ni tocar un
     * solo archivo de `motor/`.
     *
     * `actual` va en las dependencias y no en una referencia, y no es un detalle
     * de estilo: la vista sólo vuelve a pedir las decoraciones cuando algo la
     * actualiza, así que leyendo el número desde una referencia la coincidencia
     * naranja se pintaba SIEMPRE una pulsación por detrás —el primer «Buscar
     * siguiente» seleccionaba la primera y no pintaba ninguna—. Volver a poner
     * la propiedad fuerza la repintada en el acto.
     */
    vista.setProps({
      decorations: (estado) => {
        avisar();
        return decoracionesDe(estado.doc, buscarEn(estado.doc, criterio), actualValido);
      },
    });
    /*
     * Y al recoger, se mira primero si el editor sigue vivo.
     *
     * Medido el 15-ago-2026 en el recorrido de punta a punta de la sala: al
     * SALIR del laboratorio, React desmonta la ventana entera y el editor de
     * ProseMirror se destruye antes de que corra esta limpieza. `setProps` sobre
     * una vista destruida entra en `updateStateInner` y revienta con
     * «Cannot read properties of null (reading 'matchesNode')», que es su
     * `docView` ya puesto a null.
     *
     * No es un caso raro de prueba: el ÚLTIMO encargo de esta clase se juega en
     * la pestaña «Ir a» del cuadro, así que el cuadro está abierto cuando sale
     * la insignia. Todo alumno que termine y pulse «Salir del laboratorio»
     * pasaba por aquí. Y una excepción en la limpieza de un efecto no la
     * atrapa nadie: sube hasta el error global y se lleva por delante la salida.
     *
     * Devolver la vista a como estaba sigue siendo lo correcto mientras el
     * editor exista —el cuadro se puede cerrar sin salir de la clase, y ahí las
     * marcas amarillas tienen que irse—; lo que no tiene sentido es ordenarle
     * nada a un editor que ya no está.
     */
    return () => {
      if (!vista.isDestroyed) vista.setProps({ decorations: undefined });
    };
  }, [vista, criterio, actualValido]);

  /* ── que el halo del maestro no se quede atrás ────────────────────────── */

  /**
   * El halo se remide cuando cambia el pulso del editor, el encargo, la pestaña
   * de la cinta o el tamaño de la ventana. Nada de eso pasa cuando este cuadro
   * cambia de forma, y ahí había un agujero medido: el encargo 6 señala el
   * recuadro de las opciones, que **no existe** hasta que se pulsa «Más >>»; al
   * desplegarlo, el maestro no volvía a mirar y el halo no aparecía en todo el
   * encargo. Igual al cambiar de pestaña del cuadro o al arrastrarlo.
   *
   * Se avisa con un `resize`, que es la señal que el halo ya escucha y que
   * significa exactamente eso: la geometría cambió, vuelve a medir. No se
   * despacha una transacción falsa al editor: el documento no ha cambiado y
   * meterle ruido a la pila de corrección para mover un adorno sería mentirle
   * al motor.
   */
  const remedirElHalo = useCallback(() => {
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }, []);

  useEffect(() => {
    remedirElHalo();
  }, [masOpciones, pestana, remedirElHalo]);

  /* ── acciones ─────────────────────────────────────────────────────────── */

  const siguiente = useCallback(
    (haciaAtras = false) => {
      const i = buscarSiguiente(vista, criterio, haciaAtras);
      setActual(i);
      setRecado(i < 0 ? `No se encontró «${termino}» en el documento.` : null);
      setSello((s) => s + 1);
    },
    [criterio, termino, vista],
  );

  const cambiarUno = useCallback(() => {
    const r = reemplazarUno(vista, criterio, reemplazo);
    if (r === 'nada') setRecado(`No se encontró «${termino}» en el documento.`);
    else if (r === 'buscado') setRecado('Primero se busca. Pulsa otra vez para cambiar ésta y saltar a la siguiente.');
    else setRecado('Cambiada. Ya estás en la siguiente.');
    setSello((s) => s + 1);
  }, [criterio, reemplazo, termino, vista]);

  const cambiarTodos = useCallback(() => {
    const n = reemplazarTodo(vista, criterio, reemplazo);
    setActual(-1);
    setRecado(
      n === 0
        ? `No se encontró «${termino}», así que no se cambió nada.`
        : `Se hicieron ${n} ${n === 1 ? 'reemplazo' : 'reemplazos'}.`,
    );
    setSello((s) => s + 1);
  }, [criterio, reemplazo, termino, vista]);

  const irA = useCallback(() => {
    const n = Number(numeroPagina);
    if (!Number.isInteger(n) || n < 1) {
      setRecado('Escribe el número de la página, por ejemplo 2.');
      return;
    }
    setRecado(
      irAPagina(vista, n) ? `Listo: el cursor está al principio de la página ${n}.` : `El documento no llega a la página ${n}.`,
    );
    setSello((s) => s + 1);
  }, [numeroPagina, vista]);

  /* ── arrastrar el cuadro ──────────────────────────────────────────────── */

  /*
   * Un diálogo de Word se mueve, y aquí hace falta de verdad: las coincidencias
   * se marcan sobre la hoja y el cuadro se planta encima de una parte de ella.
   * Sin poder apartarlo, el encargo de MIRAR lo que pasó se juega a ciegas.
   */
  const agarre = useRef<{ dx: number; dy: number } | null>(null);
  const alBajar = (e: React.PointerEvent<HTMLDivElement>) => {
    /*
     * La X vive DENTRO de la barra que se arrastra, y ahí había un defecto
     * medido jugando mal: `setPointerCapture` sobre la barra se queda con el
     * puntero, y el navegador reparte el `click` al elemento que capturó, no al
     * que se pulsó. Resultado: la X del cuadro se pintaba, se ponía roja al
     * pasar por encima… y no cerraba nada. Con el teclado sí cerraba, que es
     * como pasó desapercibido. Un botón de cerrar de Word que no cierra es de
     * las cosas que más rápido le enseñan a un niño que esto es un dibujo.
     *
     * Se arrastra sólo desde la barra en sí, nunca desde un botón suyo.
     */
    if ((e.target as HTMLElement).closest('button')) return;
    agarre.current = { dx: e.clientX - posicion.x, dy: e.clientY - posicion.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const alMover = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!agarre.current) return;
    setPosicion({
      x: Math.max(4, Math.min(window.innerWidth - 120, e.clientX - agarre.current.dx)),
      y: Math.max(40, Math.min(window.innerHeight - 60, e.clientY - agarre.current.dy)),
    });
  };
  const alSoltar = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!agarre.current) return;
    agarre.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    // El cuadro se movió: si el halo señalaba algo de dentro, ya no está ahí.
    remedirElHalo();
  };

  /* ── pintar ───────────────────────────────────────────────────────────── */

  const sinTermino = termino.length === 0;
  const conCampos = pestana !== 'ir-a';

  return (
    <div
      className="bur-caja"
      role="dialog"
      aria-label="Buscar y reemplazar"
      style={{ left: posicion.x, top: posicion.y }}
    >
      <div
        className="bur-barra"
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
      >
        <span className="bur-barra-titulo">Buscar y reemplazar</span>
        <button
          type="button"
          className="bur-cerrar"
          aria-label="Cerrar el cuadro"
          title="Cerrar"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onCerrar}
        >
          <X size={14} strokeWidth={2.6} />
        </button>
      </div>

      <div className="bur-pestanas" role="tablist" aria-label="Buscar, reemplazar o ir a">
        {(
          [
            ['buscar', 'Buscar', 'bur-pestana-buscar'],
            ['reemplazar', 'Reemplazar', 'bur-pestana-reemplazar'],
            ['ir-a', 'Ir a', 'bur-pestana-ir'],
          ] as [PestanaBuscador, string, string][]
        ).map(([id, nombre, control]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={pestana === id}
            data-control={control}
            className={`bur-pestana${pestana === id ? ' es-activa' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPestana(id)}
          >
            {nombre}
          </button>
        ))}
      </div>

      <div className="bur-cuerpo">
        {conCampos ? (
          <>
            <div data-grupo="bur-campos">
              <div className="bur-campo">
                <label htmlFor="bur-termino">Buscar:</label>
                <input
                  id="bur-termino"
                  data-control="bur-termino"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={termino}
                  onChange={(e) => {
                    setTermino(e.target.value);
                    setActual(-1);
                    setRecado(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      siguiente();
                    }
                  }}
                />
              </div>

              <p className="bur-cuenta" aria-live="polite">
                {sinTermino ? (
                  'Escribe lo que quieres encontrar.'
                ) : coincidencias.length === 0 ? (
                  'Ninguna coincidencia.'
                ) : (
                  <>
                    <b>{coincidencias.length}</b>{' '}
                    {coincidencias.length === 1 ? 'coincidencia' : 'coincidencias'}
                    {actualValido >= 0 ? ` · vas en la ${actualValido + 1}` : ''}
                  </>
                )}
              </p>

              {pestana === 'reemplazar' && (
                <div className="bur-campo">
                  <label htmlFor="bur-reemplazo">Reemplazar con:</label>
                  <input
                    id="bur-reemplazo"
                    data-control="bur-reemplazo"
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={reemplazo}
                    onChange={(e) => {
                      setReemplazo(e.target.value);
                      setRecado(null);
                    }}
                  />
                </div>
              )}
            </div>

            <div className="bur-botones">
              {/* En Word este botón está abajo a la izquierda y despliega el
                  cuadro entero. Es el que esconde media herramienta. */}
              <button
                type="button"
                data-control="bur-mas"
                className="bur-boton es-mas"
                aria-expanded={masOpciones}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setMasOpciones((v) => !v)}
              >
                {masOpciones ? '<< Menos' : 'Más >>'}
              </button>
              {/* «Buscar anterior» sólo en la pestaña Buscar: en la de
                  Reemplazar, Word pone ahí sus tres botones de acción y meter
                  un quinto los partía en dos renglones. */}
              {pestana === 'buscar' && (
                <button
                  type="button"
                  className="bur-boton"
                  disabled={sinTermino}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => siguiente(true)}
                >
                  Buscar anterior
                </button>
              )}
              {pestana === 'reemplazar' && (
                <>
                  <button
                    type="button"
                    data-control="bur-uno"
                    className="bur-boton"
                    disabled={sinTermino}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={cambiarUno}
                  >
                    Reemplazar
                  </button>
                  <button
                    type="button"
                    data-control="bur-todos"
                    className="bur-boton"
                    disabled={sinTermino}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={cambiarTodos}
                  >
                    Reemplazar todos
                  </button>
                </>
              )}
              <button
                type="button"
                data-control="bur-siguiente"
                className="bur-boton es-principal"
                disabled={sinTermino}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => siguiente()}
              >
                Buscar siguiente
              </button>
            </div>

            {masOpciones && (
              <div className="bur-opciones" data-grupo="bur-opciones">
                <span className="bur-opciones-titulo">Opciones de búsqueda</span>
                <label className="bur-casilla" data-control="bur-mayusculas">
                  <input
                    type="checkbox"
                    checked={mayusculas}
                    onChange={(e) => {
                      setMayusculas(e.target.checked);
                      setActual(-1);
                    }}
                  />
                  Coincidir mayúsculas y minúsculas
                </label>
                <label className="bur-casilla" data-control="bur-palabras">
                  <input
                    type="checkbox"
                    checked={palabras}
                    onChange={(e) => {
                      setPalabras(e.target.checked);
                      setActual(-1);
                    }}
                  />
                  Sólo palabras completas
                </label>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="bur-nota">
              En un documento largo no se busca arrastrando la barra: se le dice a qué página ir y el cursor
              aparece ahí.
            </p>
            <div className="bur-campo es-etiqueta-larga" data-grupo="bur-campos">
              <label htmlFor="bur-pagina">Número de página:</label>
              <input
                id="bur-pagina"
                data-control="bur-pagina"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={numeroPagina}
                onChange={(e) => {
                  setNumeroPagina(e.target.value.replace(/[^\d]/g, ''));
                  setRecado(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    irA();
                  }
                }}
              />
            </div>
            <div className="bur-botones">
              <button
                type="button"
                data-control="bur-ir"
                className="bur-boton es-principal"
                disabled={numeroPagina.length === 0}
                onMouseDown={(e) => e.preventDefault()}
                onClick={irA}
              >
                Ir a
              </button>
            </div>
          </>
        )}

        {/* Lleva `data-control` porque el maestro lo SEÑALA: el encargo de leer
            lo que contestó el programa apunta el halo justo a este renglón. */}
        {recado && (
          <p
            data-control="bur-recado"
            className={`bur-recado${recado.startsWith('No se encontró') ? ' es-vacio' : ''}`}
            role="status"
          >
            {recado}
          </p>
        )}
      </div>
    </div>
  );
}

export default PanelBuscar;
