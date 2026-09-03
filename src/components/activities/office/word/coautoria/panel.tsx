'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Check, MessageSquare, RotateCcw, X } from 'lucide-react';
import type { Fila, Renglon, Trozo } from './diff';
import { taller } from './taller';
import type { Comentario, Version } from './taller';
import './coautoria.css';

/**
 * `of-word-coautoria` · lo que esta clase pinta dentro del programa.
 *
 * Cuatro superficies, y las cuatro están donde Word las pone:
 *
 *  · el **panel de revisiones**, acoplado abajo y a lo ancho del documento —es
 *    la variante horizontal que Word trae de serie—, con los comentarios y su
 *    botón de resolver;
 *  · el **historial de versiones**, un panel flotante a la derecha de la hoja,
 *    como el panel de Estilos de Word;
 *  · el **diálogo de Comparar**, con sus dos desplegables, calcado del de Word;
 *  · y la **pantalla de comparación**, que ocupa el área del documento y deja a
 *    la vista el panel del maestro: el alumno tiene que poder leer el encargo
 *    mientras mira lo que cambió.
 *
 * Todo con la ropa de Word —chrome claro, azul #185ABD, tipografía de sistema—
 * y no con el color pleno de la plataforma, que aquí vive donde le toca: en la
 * entrada y en el panel del maestro.
 *
 * ── POR QUÉ SE MIDE EL HUECO EN VEZ DE MAQUETARLO ───────────────────────────
 * La ventana es una rejilla del motor y esto entra por la puerta de
 * `accesorios`, sin poder cambiarle una fila. Así que se mide `.txtw-medio` —el
 * área de documento más el panel del maestro— y los paneles se colocan dentro de
 * ella. Se remide con un `ResizeObserver` y no una sola vez porque **la cinta
 * cambia de alto al cambiar de pestaña**: Revisar es más alta que Inicio, y un
 * panel colocado con la medida de Inicio se monta encima de la regla.
 */

/** Lo que ocupa el panel del maestro a la derecha, fijado por el motor. */
const PANEL_MAESTRO = 340;
const ALTO_REVISIONES = 208;

interface Caja {
  top: number;
  left: number;
  ancho: number;
  alto: number;
}

/**
 * Lo que mide de alto el panel de revisiones.
 *
 * Un tercio del hueco y nunca más de 208 px: en el portátil de aula de 1024×768
 * —la resolución con la que ya se midió la hoja en §36.8— el área de documento
 * mide 560 px, y un panel de 208 se come más de un tercio de la hoja justo
 * cuando el encargo 4 pide escribir en ella.
 */
function altoRevisiones(caja: Caja): number {
  return Math.max(150, Math.min(ALTO_REVISIONES, Math.round(caja.alto * 0.34)));
}

/**
 * Le alarga al lienzo el relleno de abajo mientras el panel de revisiones está
 * puesto, para que el final del documento se pueda sacar de debajo.
 *
 * No es un remate: es el defecto más caro que salió al jugar mal. El panel de
 * revisiones de Word está ACOPLADO —el área de documento encoge y el documento
 * entero sigue estando a mano—, pero éste entra por la puerta de `accesorios` y
 * se pinta ENCIMA, y la ventana es una rejilla del motor a la que no se le puede
 * añadir una fila. Medido a 1440×900 con el panel abierto: el renglón «El nombre
 * del periódico…» —justo el que el encargo 8 manda tocar para escribir debajo—
 * cae dentro del panel, y el lienzo no tenía desplazamiento suficiente para
 * subirlo. El clic aterrizaba en una tarjeta de comentario y, si daba en
 * «Resolver», resolvía un comentario que no era: el encargo 7 se despalomaba
 * solo y el maestro decía «deshiciste esto», que es lo último que ayuda.
 *
 * Con el relleno de abajo alargado, el documento se desplaza hasta salir del
 * panel y el encargo 8 se puede hacer con el panel puesto, como en Word.
 */
function useHuecoBajoElPanel(abierto: boolean, alto: number) {
  useEffect(() => {
    const lienzo = document.querySelector<HTMLElement>('.txtw-lienzo');
    if (!lienzo) return undefined;
    if (!abierto) {
      lienzo.style.paddingBottom = '';
      return undefined;
    }
    // Los 80 px son el relleno que ya trae la hoja de la ventana; se suman para
    // no quitárselo, y 24 más para que el último renglón no quede a ras.
    lienzo.style.paddingBottom = `${alto + 104}px`;
    return () => {
      lienzo.style.paddingBottom = '';
    };
  }, [abierto, alto]);
}

function useCajaDelLienzo(): Caja | null {
  const [caja, setCaja] = useState<Caja | null>(null);
  useEffect(() => {
    let vivo = true;
    let observador: ResizeObserver | null = null;
    let cuadro = 0;
    const medir = () => {
      if (!vivo) return;
      const medio = document.querySelector('.txtw-medio');
      if (!medio) {
        cuadro = requestAnimationFrame(medir);
        return;
      }
      const r = medio.getBoundingClientRect();
      setCaja((c) =>
        c && c.top === r.top && c.left === r.left && c.ancho === r.width && c.alto === r.height
          ? c
          : { top: r.top, left: r.left, ancho: r.width, alto: r.height },
      );
      if (!observador) {
        observador = new ResizeObserver(() => medir());
        observador.observe(medio);
      }
    };
    cuadro = requestAnimationFrame(medir);
    window.addEventListener('resize', medir);
    return () => {
      vivo = false;
      cancelAnimationFrame(cuadro);
      observador?.disconnect();
      window.removeEventListener('resize', medir);
    };
  }, []);
  return caja;
}

/**
 * Un latido cada vez que cambia el documento.
 *
 * Hace falta porque estos paneles no son hijos de React del editor: entran como
 * `accesorios` y el motor no los vuelve a pintar cuando el alumno teclea. Sin
 * esto, el trocito de documento que cita cada comentario se quedaría con el
 * texto de cuando se abrió el panel — y el encargo 4 consiste precisamente en
 * reescribir uno de esos trozos.
 */
function usePulsoDocumento(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    let observador: MutationObserver | null = null;
    let pendiente = 0;
    let cuadro = 0;
    const enganchar = () => {
      const flujo = document.querySelector('.txtw-flujo');
      if (!flujo) {
        cuadro = requestAnimationFrame(enganchar);
        return;
      }
      observador = new MutationObserver(() => {
        if (pendiente) return;
        pendiente = requestAnimationFrame(() => {
          pendiente = 0;
          setN((x) => x + 1);
        });
      });
      observador.observe(flujo, { childList: true, subtree: true, characterData: true });
    };
    cuadro = requestAnimationFrame(enganchar);
    return () => {
      cancelAnimationFrame(cuadro);
      if (pendiente) cancelAnimationFrame(pendiente);
      observador?.disconnect();
    };
  }, []);
  return n;
}

/**
 * El trozo de documento al que apunta un comentario, leído en vivo.
 *
 * Se lee el nodo y no `leerBloques` a propósito: el lector del motor devuelve
 * una lista de viñetas como un solo texto con todos sus puntos **pegados sin
 * separación**, y el comentario de Renata apunta justo a una lista. La cita
 * salía como «…de sexto contra quinto.Ciencia — Renata…», que es exactamente lo
 * que un niño lee como «esto está roto».
 */
function textoDelAncla(c: Comentario): string {
  const vista = taller.vista();
  if (!vista) return '';
  const doc = vista.state.doc;
  const ancla = taller.anclaAhora(c);
  if (ancla < 0 || ancla >= doc.childCount) return 'este trozo ya no está en el documento';
  const nodo = doc.child(ancla);
  let t: string;
  if (nodo.type.name === 'lista_vinetas' || nodo.type.name === 'lista_numeros') {
    const puntos: string[] = [];
    nodo.forEach((item) => puntos.push(item.textContent.trim()));
    t = puntos.filter(Boolean).join(' · ');
  } else {
    t = nodo.textContent.trim();
  }
  return t.length > 68 ? `${t.slice(0, 68)}…` : t || '(renglón vacío)';
}

/* ─────────────────────────── panel de revisiones ─────────────────────────── */

function Tarjeta({ c }: { c: Comentario }) {
  return (
    <article className={`coa-com${c.resuelto ? ' es-resuelto' : ''}${c.mio ? ' es-mio' : ''}`} data-com={c.id}>
      <header className="coa-com-cab">
        <span className="coa-com-avatar" aria-hidden="true">
          {c.inicial}
        </span>
        <span className="coa-com-quien">
          <b>{c.autor}</b>
          {/*
            El «Resuelto» va aquí, en la línea de la hora, y no en un renglón
            propio debajo: puesto abajo la tarjeta crecía veinte píxeles al
            resolverla, se salía del panel y el sello quedaba cortado por la
            mitad — que es lo que un niño lee como «lo rompí».
          */}
          <i className={c.resuelto ? 'es-resuelto' : undefined}>
            {c.cuando}
            {c.resuelto ? ' · Resuelto' : ''}
          </i>
        </span>
        {c.resuelto ? (
          <button
            type="button"
            className="coa-boton es-suave"
            data-accion="reabrir"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => taller.resolver(c.id, false)}
          >
            Volver a abrir
          </button>
        ) : (
          <button
            type="button"
            className="coa-boton"
            data-accion="resolver"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => taller.resolver(c.id, true)}
          >
            <Check size={13} strokeWidth={3} aria-hidden="true" /> Resolver
          </button>
        )}
      </header>
      <p className="coa-com-sobre">
        Sobre: <span>«{textoDelAncla(c)}»</span>
      </p>
      <p className="coa-com-texto">{c.texto}</p>
    </article>
  );
}

function Redactor() {
  const [texto, setTexto] = useState('');
  const campo = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    campo.current?.focus();
  }, []);
  return (
    <article className="coa-com es-nuevo">
      <header className="coa-com-cab">
        <span className="coa-com-avatar" aria-hidden="true">
          A
        </span>
        <span className="coa-com-quien">
          <b>Ana (tú)</b>
          <i>comentario nuevo</i>
        </span>
      </header>
      <textarea
        ref={campo}
        className="coa-campo"
        rows={2}
        value={texto}
        placeholder="Escribe tu comentario para Renata y Diego"
        onChange={(e) => setTexto(e.target.value)}
      />
      <div className="coa-com-botones">
        <button type="button" className="coa-boton es-suave" onClick={() => taller.escribirComentario(false)}>
          Cancelar
        </button>
        <button
          type="button"
          className="coa-boton"
          onClick={() => {
            if (taller.comentar(texto)) setTexto('');
          }}
        >
          Comentar
        </button>
      </div>
    </article>
  );
}

function PanelRevisiones({ caja }: { caja: Caja }) {
  const est = taller.leer();
  const abiertos = est.comentarios.filter((c) => !c.resuelto);
  const resueltos = est.comentarios.filter((c) => c.resuelto);

  /*
   * Al escribir un comentario nuevo, el panel baja hasta él. Sin esto, el
   * comentario aterrizaba en la segunda fila del panel —fuera de la parte
   * visible— y lo que el alumno veía al pulsar «Comentar» era que su comentario
   * no aparecía por ningún lado.
   */
  const cuerpo = useRef<HTMLDivElement | null>(null);
  const cuantos = est.comentarios.length;
  const antes = useRef(cuantos);
  useEffect(() => {
    if (cuantos > antes.current && cuerpo.current) {
      cuerpo.current.scrollTop = cuerpo.current.scrollHeight;
    }
    antes.current = cuantos;
  }, [cuantos]);

  return (
    <section
      className="coa-panel es-abajo"
      aria-label="Panel de revisiones"
      style={{
        top: caja.top + caja.alto - altoRevisiones(caja),
        left: caja.left,
        width: Math.max(320, caja.ancho - PANEL_MAESTRO),
        height: altoRevisiones(caja),
      }}
    >
      <header className="coa-panel-cab">
        <MessageSquare size={14} strokeWidth={2.4} aria-hidden="true" />
        <h3>Panel de revisiones</h3>
        <span className="coa-panel-cuenta">
          {abiertos.length} sin resolver · {resueltos.length} resuelto{resueltos.length === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          className="coa-cerrar"
          aria-label="Cerrar el panel de revisiones"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => taller.alternarRevisiones()}
        >
          <X size={14} strokeWidth={2.6} />
        </button>
      </header>
      {/*
        Los resueltos NO se van a una sección aparte, y se probó de las dos
        maneras: al mandarlos abajo, resolver un comentario lo hacía
        desaparecer de la vista —quedaba fuera del panel, había que
        desplazarse—, y lo que el alumno ve es que se borró. Se quedan en su
        sitio, en verde y con su sello, que además es lo que deja comprobar de
        un vistazo que sólo hay uno resuelto.
      */}
      <div className="coa-panel-cuerpo" ref={cuerpo}>
        {est.escribiendoComentario && <Redactor />}
        {est.comentarios.map((c) => (
          <Tarjeta key={c.id} c={c} />
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── historial de versiones ─────────────────────────── */

function FilaVersion({ v }: { v: Version }) {
  return (
    <li className={`coa-ver${v.mia ? ' es-mia' : ''}`} data-version={v.id}>
      <span className="coa-ver-punto" aria-hidden="true" />
      <span className="coa-ver-datos">
        <b>{v.nombre}</b>
        <i>
          {v.autor} · {v.cuando}
        </i>
      </span>
      <button
        type="button"
        className="coa-boton es-suave"
        data-accion="restaurar"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => taller.restaurar(v.id)}
      >
        <RotateCcw size={12} strokeWidth={2.6} aria-hidden="true" /> Restaurar
      </button>
    </li>
  );
}

function PanelVersiones({ caja }: { caja: Caja }) {
  const est = taller.leer();
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const cuadro = useRef<HTMLInputElement | null>(null);
  const ancho = 380;

  /*
   * Cuando el botón «Guardar» de la cinta pide el nombre, el cursor va al cuadro
   * y se selecciona lo que hubiera. Es lo que convierte ese botón en algo que
   * hace: con el panel ya abierto no movía un pixel, y el alumno lo pulsaba dos
   * y tres veces creyendo que estaba roto.
   */
  useEffect(() => {
    if (!est.pedirNombre) return;
    cuadro.current?.focus();
    cuadro.current?.select();
  }, [est.pedirNombre]);
  const izquierda = Math.max(caja.left + 8, caja.left + caja.ancho - PANEL_MAESTRO - ancho - 16);
  const alto = Math.min(420, caja.alto - 28 - (est.panelRevisiones ? altoRevisiones(caja) : 0));

  const guardar = useCallback(() => {
    if (taller.guardarVersion(nombre)) {
      setNombre('');
      setError(null);
      return;
    }
    setError('Ponle un nombre que diga qué guardaste. Con tres letras basta, pero que signifique algo.');
  }, [nombre]);

  return (
    <section
      className="coa-panel es-flotante"
      aria-label="Historial de versiones"
      style={{ top: caja.top + 14, left: izquierda, width: ancho, maxHeight: Math.max(220, alto) }}
    >
      <header className="coa-panel-cab">
        <h3>Historial de versiones</h3>
        <button
          type="button"
          className="coa-cerrar"
          aria-label="Cerrar el historial de versiones"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => taller.alternarVersiones()}
        >
          <X size={14} strokeWidth={2.6} />
        </button>
      </header>

      <div className="coa-guardar">
        <label htmlFor="coa-nombre-version">Guardar cómo está ahora</label>
        <div className="coa-guardar-fila">
          <input
            id="coa-nombre-version"
            ref={cuadro}
            className="coa-entrada"
            value={nombre}
            placeholder="¿Qué guardas? Ej.: ya está la sección de cartas"
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                guardar();
              }
            }}
          />
          <button type="button" className="coa-boton" data-accion="guardar-version" onClick={guardar}>
            Guardar versión
          </button>
        </div>
        {error && <p className="coa-error">{error}</p>}
      </div>

      <ol className="coa-vers">
        <li className="coa-ver es-ahora">
          <span className="coa-ver-punto" aria-hidden="true" />
          <span className="coa-ver-datos">
            <b>Documento de ahora</b>
            <i>lo que estás escribiendo</i>
          </span>
        </li>
        {[...est.versiones].reverse().map((v) => (
          <FilaVersion key={v.id} v={v} />
        ))}
      </ol>

      {est.recado && <p className="coa-recado">{est.recado}</p>}
    </section>
  );
}

/* ─────────────────────────── comparar ─────────────────────────── */

function DialogoComparar({ caja }: { caja: Caja }) {
  const est = taller.leer();
  const [izq, setIzq] = useState('ahora');
  const [der, setDer] = useState('ahora');
  const [aviso, setAviso] = useState<string | null>(null);
  const ancho = 470;
  const opciones = [
    { id: 'ahora', etiqueta: 'Documento de ahora' },
    ...est.versiones.map((v) => ({ id: v.id, etiqueta: `${v.nombre} — ${v.autor}, ${v.cuando}` })),
  ];
  return (
    <div
      className="coa-dialogo"
      role="dialog"
      aria-label="Comparar documentos"
      style={{
        top: caja.top + 56,
        left: caja.left + Math.max(8, (caja.ancho - PANEL_MAESTRO - ancho) / 2),
        width: ancho,
      }}
    >
      <header className="coa-panel-cab">
        <h3>Comparar documentos</h3>
        <button
          type="button"
          className="coa-cerrar"
          aria-label="Cerrar"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => taller.cerrarComparar()}
        >
          <X size={14} strokeWidth={2.6} />
        </button>
      </header>
      <div className="coa-dialogo-cuerpo">
        <label className="coa-etiqueta" htmlFor="coa-izq">
          Documento original
        </label>
        <select id="coa-izq" className="coa-select" value={izq} onChange={(e) => setIzq(e.target.value)}>
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>
              {o.etiqueta}
            </option>
          ))}
        </select>
        <p className="coa-dialogo-flecha" aria-hidden="true">
          ⇄
        </p>
        <label className="coa-etiqueta" htmlFor="coa-der">
          Documento revisado
        </label>
        <select id="coa-der" className="coa-select" value={der} onChange={(e) => setDer(e.target.value)}>
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>
              {o.etiqueta}
            </option>
          ))}
        </select>
        {aviso && (
          <p className="coa-error" role="status">
            {aviso}
          </p>
        )}
      </div>
      <footer className="coa-dialogo-pie">
        <button type="button" className="coa-boton es-suave" onClick={() => taller.cerrarComparar()}>
          Cancelar
        </button>
        <button
          type="button"
          className="coa-boton"
          data-accion="comparar"
          onClick={() => setAviso(taller.comparar(izq, der))}
        >
          Comparar
        </button>
      </footer>
    </div>
  );
}

function TextoRenglon({ r }: { r: Renglon }) {
  return <span className={`coa-r es-${r.tipo}`}>{r.texto}</span>;
}

/** Un renglón editado, con lo quitado tachado y lo añadido resaltado. */
function TextoPalabras({ trozos, lado }: { trozos: Trozo<string>[]; lado: 'izquierda' | 'derecha' }) {
  return (
    <span className="coa-r">
      {trozos
        .filter((t) => (lado === 'izquierda' ? t.marca !== 'anadido' : t.marca !== 'quitado'))
        .map((t, i) => (
          <span key={i} className={t.marca === 'igual' ? undefined : `coa-w es-${t.marca}`}>
            {t.valor}
          </span>
        ))}
    </span>
  );
}

/**
 * Una fila de la comparación: el renglón de antes y el de ahora, emparejados.
 *
 * Cada fila es su propia rejilla de dos columnas y no dos celdas de una rejilla
 * grande, y eso sale de un defecto medido a 1024×768: con una sola rejilla de
 * 2 × N, los renglones de las filas se sizaban **todos a 30 px** —la altura de
 * una línea vacía— y el texto de dos y tres renglones se salía por abajo y se
 * pintaba encima de la fila siguiente. Medido con el DOM: `gridTemplateRows`
 * devolvía «30px 30px 30px…» con celdas cuyo contenido medía 42 y 58. A 1440
 * no se veía porque casi todo cabía en un renglón. Con una rejilla por fila,
 * cada una mide lo que mide su contenido y no hay nada que se pise.
 *
 * El lado que no tiene renglón va rayado y no del color del cambio: en un
 * añadido, lo verde es lo que apareció, y el hueco de enfrente no es «algo
 * verde», es que ahí no había nada.
 */
function FilaComparada({ f }: { f: Fila }) {
  return (
    <div className="coa-fila">
      <div className={`coa-celda es-${f.izquierda ? f.clase : 'vacio'}`}>
        {f.clase === 'cambiado' && f.palabras ? (
          <TextoPalabras trozos={f.palabras} lado="izquierda" />
        ) : f.izquierda ? (
          <TextoRenglon r={f.izquierda} />
        ) : null}
      </div>
      <div className={`coa-celda es-${f.derecha ? f.clase : 'vacio'}`}>
        {f.clase === 'cambiado' && f.palabras ? (
          <TextoPalabras trozos={f.palabras} lado="derecha" />
        ) : f.derecha ? (
          <TextoRenglon r={f.derecha} />
        ) : null}
      </div>
    </div>
  );
}

function VistaComparacion({ caja }: { caja: Caja }) {
  const c = taller.leer().comparacion;
  if (!c) return null;
  const { resumen } = c;
  return (
    <section
      className="coa-comparacion"
      aria-label="Resultado de la comparación"
      style={{
        top: caja.top,
        left: caja.left,
        width: Math.max(360, caja.ancho - PANEL_MAESTRO),
        height: caja.alto,
      }}
    >
      <header className="coa-comp-cab">
        <div>
          <h3>Comparar documentos</h3>
          <p className="coa-comp-quienes">
            <b>{c.izquierdaNombre}</b> <span aria-hidden="true">⇄</span> <b>{c.derechaNombre}</b>
          </p>
        </div>
        <div className="coa-chips">
          <span className="coa-chip es-anadido">{resumen.anadidos} añadidos</span>
          <span className="coa-chip es-quitado">{resumen.quitados} quitados</span>
          <span className="coa-chip es-cambiado">{resumen.cambiados} cambiados</span>
          <span className="coa-chip">{resumen.iguales} iguales</span>
        </div>
        <button type="button" className="coa-boton es-suave" data-accion="cerrar-comparacion" onClick={() => taller.cerrarComparacion()}>
          Cerrar
        </button>
      </header>
      <div className="coa-cols">
        <div className="coa-fila es-cabecera">
          <div className="coa-col-cab">{c.izquierdaNombre}</div>
          <div className="coa-col-cab">{c.derechaNombre}</div>
        </div>
        {c.filas.map((f, i) => (
          <FilaComparada key={i} f={f} />
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── el conjunto ─────────────────────────── */

export function PanelesCoautoria() {
  const est = useSyncExternalStore(taller.suscribir, taller.leer, taller.leer);
  const caja = useCajaDelLienzo();
  // Se lee para que el panel se vuelva a pintar cuando cambia el documento: las
  // citas de los comentarios salen del documento vivo.
  usePulsoDocumento();
  useHuecoBajoElPanel(est.panelRevisiones, caja ? altoRevisiones(caja) : 0);

  if (!caja) return null;
  return (
    <>
      {est.panelRevisiones && <PanelRevisiones caja={caja} />}
      {est.panelVersiones && <PanelVersiones caja={caja} />}
      {est.dialogoComparar && <DialogoComparar caja={caja} />}
      {est.comparacion && <VistaComparacion caja={caja} />}
    </>
  );
}

export default PanelesCoautoria;
