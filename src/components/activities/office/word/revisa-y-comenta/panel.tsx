'use client';

import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { Check, MessageSquare, SpellCheck, Trash2, X } from 'lucide-react';
import type { Node as NodoPM } from 'prosemirror-model';
import { CONFUSIONES } from './diccionario';
import {
  AUTORES,
  buscarFaltas,
  corregir,
  corregirTodas,
  leerCambios,
  type Cambio,
  type EstadoRevision,
  type Falta,
} from './revision';
import './estilo.css';

/**
 * El panel de revisión de `of-word-revisa-y-comenta`.
 *
 * Es el «Panel de revisión» de Word y va ACOPLADO al borde de abajo del área
 * del documento, con el ancho del documento y no más: ni un globo flotante ni
 * un cuadro de diálogo que tape la hoja. Word tiene ese panel en vertical y en
 * horizontal; aquí es horizontal porque el vertical iría justo donde ya está
 * acoplado el panel del maestro, y dos paneles peleándose la derecha no es
 * fidelidad, es un choque.
 *
 * Dentro hay tres columnas —ortografía, comentarios y cambios— y cada una es lo
 * que en Word sería su propio panel. Juntas contestan la pregunta que da nombre
 * a la clase: **quién** cambió qué y qué falta por decidir.
 *
 * ── POR QUÉ SE MIDE Y NO SE CLAVAN LOS NÚMEROS ──────────────────────────────
 * La ventana no da un hueco para los accesorios de la clase: los pinta al final
 * y son suyos. Se podría escribir `right: 340px; bottom: 26px` copiando las
 * medidas del CSS del motor, y ese día la clase quedaría atada a dos números
 * que no son de ella. En vez de eso se mide el rectángulo real de `.txtw-lienzo`
 * —que ES el área del documento— y el panel se coloca encima. Si mañana el
 * panel del maestro mide otra cosa, esto sigue cuadrando.
 */

interface Caja {
  left: number;
  right: number;
  bottom: number;
}

/**
 * El rectángulo del área del documento, medido y no clavado.
 *
 * Espera al lienzo en vez de rendirse si todavía no está: desde que el panel
 * dejó de montarse sólo al abrirse —ahora hay una pestañita que se ve desde el
 * primer fotograma—, este efecto puede correr antes de que `.txtw-lienzo` exista
 * y una sola medición fallida dejaría el accesorio invisible para siempre.
 */
function useCajaDelLienzo(): Caja | null {
  const [caja, setCaja] = useState<Caja | null>(null);

  useLayoutEffect(() => {
    let vivo = true;
    let observador: ResizeObserver | null = null;
    let lienzo: HTMLElement | null = null;

    const medir = () => {
      if (!lienzo) return;
      const r = lienzo.getBoundingClientRect();
      const nueva = {
        left: Math.round(r.left),
        right: Math.round(window.innerWidth - r.right),
        bottom: Math.round(window.innerHeight - r.bottom),
      };
      setCaja((vieja) =>
        vieja && vieja.left === nueva.left && vieja.right === nueva.right && vieja.bottom === nueva.bottom
          ? vieja
          : nueva,
      );
    };

    const enganchar = () => {
      if (!vivo) return;
      lienzo = document.querySelector<HTMLElement>('.txtw-lienzo');
      if (!lienzo) {
        requestAnimationFrame(enganchar);
        return;
      }
      medir();
      observador = new ResizeObserver(medir);
      observador.observe(lienzo);
    };

    enganchar();
    window.addEventListener('resize', medir);
    return () => {
      vivo = false;
      observador?.disconnect();
      window.removeEventListener('resize', medir);
    };
  }, []);

  return caja;
}

/**
 * Un pellizco de texto alrededor de la falta, para saber de qué renglón habla.
 *
 * Se lee del documento por POSICIÓN y no buscando la palabra en el texto
 * entero: con «ke» dos veces en el documento, buscar por texto enseñaba las dos
 * veces el mismo renglón —el de la primera— y las dos fichas del panel parecían
 * la misma falta repetida.
 */
function contextoDe(doc: NodoPM, falta: Falta): string {
  const desde = Math.max(0, falta.desde - 28);
  const hasta = Math.min(doc.content.size, falta.hasta + 28);
  const texto = doc.textBetween(desde, hasta, ' ').replace(/\s+/g, ' ').trim();
  return `${desde > 0 ? '…' : ''}${texto}${hasta < doc.content.size ? '…' : ''}`;
}

export function PanelRevision({ estado }: { estado: EstadoRevision }) {
  const [, repintar] = useReducer((n: number) => n + 1, 0);
  useEffect(() => estado.suscribir(repintar), [estado]);

  const caja = useCajaDelLienzo();
  const vista = estado.vista;
  const doc = vista?.state.doc ?? null;

  const faltas = estado.ortografia && doc ? buscarFaltas(doc) : [];
  const cambios = doc ? leerCambios(doc) : [];

  if (!caja) return null;

  /*
   * Con el panel cerrado queda la pestañita, y no es un adorno.
   *
   * Medido el 10-ago-2026 jugando MAL: el encargo 2 se resuelve en este panel,
   * así que su señalador apunta aquí. Cerrando el panel con la X —que es un
   * botón de verdad y un alumno lo pulsa— el señalador se quedaba sin nada a lo
   * que apuntar y el modo guía enmudecía justo en el encargo que más se explica.
   * Volver por la cinta funcionaba, pero pulsar «Panel de revisión» en mitad del
   * encargo 2 es un desvío para la ventana: costaba un tropiezo por hacer lo
   * correcto.
   *
   * La pestañita lleva el mismo `data-control` que el panel, así que el
   * señalador siempre tiene diana; y como no es un control de la cinta, abrirlo
   * de vuelta no cuesta nada. Es además lo que hace Word, que deja el panel de
   * revisión a un clic en la barra de abajo.
   */
  if (!estado.panelAbierto) {
    return (
      <button
        type="button"
        className="rc-pestanita"
        data-control="rc-panel"
        // Pegada al borde DERECHO del área del documento: en la esquina de la
        // izquierda vive el botón flotante del entorno de desarrollo y se
        // montaban el uno encima del otro.
        style={{ right: caja.right + 18, bottom: caja.bottom }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => estado.abrirPanel()}
      >
        <SpellCheck size={13} strokeWidth={2.4} aria-hidden="true" />
        Panel de revisión
      </button>
    );
  }

  return (
    <aside
      className="rc-panel"
      data-control="rc-panel"
      aria-label="Panel de revisión"
      style={{ left: caja.left, right: caja.right, bottom: caja.bottom }}
    >
      <header className="rc-panel-cab">
        <span className="rc-panel-titulo">Panel de revisión</span>
        <span className="rc-panel-cifras">
          {estado.ortografia && (
            <span>
              <b>{faltas.length}</b> {faltas.length === 1 ? 'falta' : 'faltas'}
            </span>
          )}
          <span>
            <b>{estado.comentarios.length}</b>{' '}
            {estado.comentarios.length === 1 ? 'comentario' : 'comentarios'}
          </span>
          <span>
            <b>{cambios.length}</b> {cambios.length === 1 ? 'cambio' : 'cambios'} sin resolver
          </span>
        </span>
        <button
          type="button"
          className="rc-panel-cerrar"
          aria-label="Cerrar el panel de revisión"
          title="Cerrar el panel de revisión"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => estado.cerrarPanel()}
        >
          <X size={14} strokeWidth={2.6} />
        </button>
      </header>

      <div className="rc-panel-cuerpo">
        {estado.ortografia && <ColumnaOrtografia estado={estado} faltas={faltas} />}
        <ColumnaComentarios estado={estado} />
        <ColumnaCambios estado={estado} cambios={cambios} />
      </div>
    </aside>
  );
}

/* ─────────────────────────── ortografía ─────────────────────────── */

function ColumnaOrtografia({ estado, faltas }: { estado: EstadoRevision; faltas: Falta[] }) {
  const vista = estado.vista;
  const doc = vista?.state.doc;
  const cuantasIguales = (f: Falta) =>
    faltas.filter((x) => x.palabra.toLowerCase() === f.palabra.toLowerCase()).length;

  return (
    <section className="rc-columna">
      <h4 className="rc-columna-titulo">
        <SpellCheck size={14} strokeWidth={2.4} aria-hidden="true" /> Ortografía
      </h4>
      <div className="rc-columna-lista">
        {faltas.length === 0 ? (
          /*
           * Este cuadro es el encargo 4 de la clase puesto en el sitio donde el
           * alumno mira. El corrector acaba de decir que ya no queda nada, y lo
           * siguiente que lee es que hay faltas que no puede ver.
           */
          <div className="rc-vacio">
            <p className="rc-vacio-titulo">No se encontró ninguna palabra mal escrita.</p>
            <p className="rc-vacio-nota">
              Cuidado: el corrector sólo ve palabras que <b>no existen</b>. Las que existen pero están
              puestas donde no van, no las puede ver. Ésas las tienes que leer tú:
            </p>
            <ul className="rc-confusiones">
              {CONFUSIONES.map((c) => (
                <li key={c.pareja}>
                  <b>{c.pareja}</b> — {c.explica}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          faltas.map((f) => (
            <div className="rc-falta-ficha" key={`${f.desde}-${f.palabra}`}>
              <p className="rc-falta-linea">
                <b className="rc-mal">{f.palabra}</b>
                <span aria-hidden="true">→</span>
                <b className="rc-bien">{f.sugerencia}</b>
              </p>
              {doc && <p className="rc-falta-contexto">{contextoDe(doc, f)}</p>}
              <div className="rc-botones">
                <button
                  type="button"
                  className="rc-boton"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => vista && corregir(vista, f)}
                >
                  Cambiar
                </button>
                {cuantasIguales(f) > 1 && (
                  <button
                    type="button"
                    className="rc-boton es-suave"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => vista && corregirTodas(vista, f.palabra)}
                  >
                    Cambiar las {cuantasIguales(f)}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────── comentarios ─────────────────────────── */

function ColumnaComentarios({ estado }: { estado: EstadoRevision }) {
  const editando = estado.comentarios.find((c) => c.editando);
  const cuadro = useRef<HTMLTextAreaElement | null>(null);
  const [borrador, setBorrador] = useState('');

  // El borrador se vacía al abrirse OTRO globo, y eso se ajusta durante el
  // render y no dentro de un efecto: hacerlo en un efecto pinta un fotograma
  // con el texto del comentario anterior dentro del globo nuevo, y además React
  // lo prohíbe (`react-hooks/set-state-in-effect`). Éste es el patrón que la
  // propia documentación llama «ajustar el estado al cambiar una prop».
  const [globoVisto, setGloboVisto] = useState(editando?.id);
  if (editando?.id !== globoVisto) {
    setGloboVisto(editando?.id);
    setBorrador('');
  }

  // El globo nuevo se lleva el foco y se pone a la vista: si la columna ya
  // tenía comentarios, el que se acaba de abrir nace fuera de la pantalla y el
  // alumno cree que no pasó nada.
  useEffect(() => {
    if (!editando) return;
    const id = requestAnimationFrame(() => {
      cuadro.current?.focus();
      cuadro.current?.closest('.rc-globo')?.scrollIntoView({ block: 'nearest' });
    });
    return () => cancelAnimationFrame(id);
  }, [editando?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="rc-columna">
      <h4 className="rc-columna-titulo">
        <MessageSquare size={14} strokeWidth={2.4} aria-hidden="true" /> Comentarios
      </h4>
      <div className="rc-columna-lista">
        {estado.avisoDeComentario && (
          <p className="rc-aviso">
            Ese texto está marcado para <b>borrarse</b>. Antes de comentarlo hay que decidir si se
            queda: acepta o rechaza ese cambio primero.
          </p>
        )}
        {estado.comentarios.length === 0 && (
          <div className="rc-vacio">
            <p className="rc-vacio-titulo">Todavía no hay comentarios.</p>
            <p className="rc-vacio-nota">
              Selecciona un trozo de texto y pulsa «Nuevo comentario» para dejar una nota sin cambiar
              lo que otra persona escribió.
            </p>
          </div>
        )}
        {estado.comentarios.map((c) => {
          const autor = AUTORES[c.autor];
          const enEdicion = c.editando;
          return (
            <div className={`rc-globo${enEdicion ? ' es-editando' : ''}`} key={c.id}>
              <div className="rc-globo-cab">
                <span className="rc-avatar" style={{ background: autor.color }} aria-hidden="true">
                  {autor.iniciales}
                </span>
                <b>{autor.nombre}</b>
                {!enEdicion && c.autor === 'alumno' && (
                  <button
                    type="button"
                    className="rc-globo-quitar"
                    aria-label="Eliminar mi comentario"
                    title="Eliminar mi comentario"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => estado.eliminarComentario(c.id)}
                  >
                    <Trash2 size={13} strokeWidth={2.3} />
                  </button>
                )}
              </div>
              <p className="rc-globo-extracto">«{c.extracto}»</p>
              {enEdicion ? (
                <>
                  <textarea
                    ref={cuadro}
                    className="rc-globo-cuadro"
                    rows={2}
                    placeholder="Escribe aquí tu comentario…"
                    aria-label="Texto del comentario"
                    value={borrador}
                    onChange={(e) => setBorrador(e.target.value)}
                    /*
                     * Un globo abierto y vacío del que el alumno se va no es un
                     * comentario: se descarta, y con él el resaltado amarillo
                     * que había puesto en el texto. Los botones del globo no lo
                     * disparan porque impiden que el cuadro pierda el foco.
                     */
                    onBlur={() => {
                      if (!borrador.trim()) estado.eliminarComentario(c.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        estado.guardarComentario(c.id, borrador);
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        estado.eliminarComentario(c.id);
                      }
                    }}
                  />
                  <div className="rc-botones">
                    <button
                      type="button"
                      className="rc-boton"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => estado.guardarComentario(c.id, borrador)}
                    >
                      Comentar
                    </button>
                    <button
                      type="button"
                      className="rc-boton es-suave"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => estado.eliminarComentario(c.id)}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <p className="rc-globo-texto">{c.texto}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────────────── cambios ─────────────────────────── */

function ColumnaCambios({ estado, cambios }: { estado: EstadoRevision; cambios: Cambio[] }) {
  /*
   * El recado sólo se enseña mientras el cambio siga resuelto de verdad.
   *
   * Se le pregunta al documento en vez de fiarse de la memoria, y hace falta:
   * cuando el clic equivocado viene de la cinta y el encargo sí pide un control,
   * la ventana lo deshace ella sola (§37.3) y el cambio vuelve a la lista. Si el
   * recado siguiera puesto diría «Rechazaste…» de algo que está ahí intacto, que
   * es peor que no decir nada.
   */
  const memoria = estado.ultimoResuelto;
  const ultimo =
    memoria &&
    !cambios.some((c) => c.autor === memoria.autor && c.tipo === memoria.tipo && c.texto === memoria.texto)
      ? memoria
      : null;
  return (
    <section className="rc-columna">
      <h4 className="rc-columna-titulo">
        <Check size={14} strokeWidth={2.4} aria-hidden="true" /> Cambios sin resolver
      </h4>
      {/*
        Fuera de la lista y no dentro, a propósito: la lista se desplaza, y un
        recado que se puede ir de la pantalla al desplazarla es un recado que no
        existe. Medido con una captura: salía arriba del todo y no se veía.

        Decidir un cambio es definitivo —al aceptar un borrado el texto se va de
        verdad, y al rechazar una inserción también—, así que aquí se dice qué
        acaba de pasar y se ofrece devolverlo. Es la única salida de haberse
        equivocado de botón: la ventana no puede atender este desvío porque estos
        botones no son de la cinta.
      */}
      {ultimo && (
        <div className="rc-hecho">
          {ultimo.aceptado ? 'Aceptaste' : 'Rechazaste'} lo que{' '}
          <b>{AUTORES[ultimo.autor].nombre}</b>{' '}
          {ultimo.tipo === 'insercion' ? 'había añadido' : 'había marcado para borrar'}: «
          {ultimo.texto.length > 52 ? `${ultimo.texto.slice(0, 52)}…` : ultimo.texto}».{' '}
          {ultimo.tipo === 'insercion'
            ? ultimo.aceptado
              ? 'Se queda en el texto, ya sin color.'
              : 'Se fue del documento.'
            : ultimo.aceptado
              ? 'Se fue del documento.'
              : 'Se queda en el texto, ya sin la raya.'}
          <button
            type="button"
            className="rc-hecho-deshacer"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => estado.devolverLoUltimo()}
          >
            ¿No era ésa? Devuélvela
          </button>
        </div>
      )}

      <div className="rc-columna-lista">
        {estado.avisoDeCambios && (
          <p className="rc-aviso">
            Para usar «Aceptar» o «Rechazar» de la cinta, primero haz clic <b>dentro</b> del texto de
            color. También puedes usar los botones de aquí abajo.
          </p>
        )}
        {cambios.length === 0 ? (
          <div className="rc-vacio">
            <p className="rc-vacio-titulo">No queda ningún cambio por resolver.</p>
            <p className="rc-vacio-nota">
              Enciende «Control de cambios» y escribe: lo que pongas saldrá marcado con tu color, y
              cualquiera podrá aceptarlo o rechazarlo.
            </p>
          </div>
        ) : (
          cambios.map((c) => {
            const autor = AUTORES[c.autor];
            return (
              <div className="rc-cambio" key={`${c.desde}-${c.tipo}`}>
                <div className="rc-globo-cab">
                  <span className="rc-avatar" style={{ background: autor.color }} aria-hidden="true">
                    {autor.iniciales}
                  </span>
                  <b>{autor.nombre}</b>
                  <span className="rc-cambio-tipo">{c.tipo === 'insercion' ? 'insertó' : 'borró'}</span>
                </div>
                <p className={`rc-cambio-texto es-${c.tipo}`} style={{ color: autor.color }}>
                  «{c.texto.length > 90 ? `${c.texto.slice(0, 90)}…` : c.texto}»
                </p>
                <div className="rc-botones">
                  <button
                    type="button"
                    className="rc-boton"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => estado.resolverYRecordar(c, true)}
                  >
                    Aceptar
                  </button>
                  <button
                    type="button"
                    className="rc-boton es-suave"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => estado.resolverYRecordar(c, false)}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default PanelRevision;
