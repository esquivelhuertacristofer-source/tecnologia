'use client';

import type { ReactNode } from 'react';
import { EditorCodigo } from '../codigo/ventana/EditorCodigo';
import '../codigo/ventana/ventanaCodigo.css';
import { caja, propiedadesEscritas } from './consulta';
import { VistaPagina } from './VistaPagina';
import type { ProblemaWeb } from './errores';
import type { Estudio } from './useEstudioWeb';
import type { EfectoWeb, EventoPagina, HerramientaWeb, Publicacion, RecursoWeb, Vista } from './tiposWeb';
import './estudioWeb.css';

/**
 * TECNIA WEB · EL ESTUDIO
 *
 * El editor con vista previa en vivo: pestañas de archivo, el código a la
 * izquierda, la página pintándose a la derecha, la lista de lo que está mal
 * debajo y el inspector que enseña la caja del elemento que toques. Es
 * CodePen; es VS Code con Live Server.
 *
 * ══ El editor NO se escribió aquí ══════════════════════════════════════════
 *
 * Se hereda entero de `simuladores/codigo/ventana/EditorCodigo.tsx`: las dos
 * capas alineadas al carácter, la columna de números, la línea resaltada, Tab
 * y Esc+Tab, el candado de `soloLectura`. Ese componente se escribió sin una
 * línea de Python dentro justamente para esto —recibe `lineas: LineaPintada[]`
 * ya pintadas— y lo único que ha hecho falta pedirle son **seis nombres de
 * color más** en su tipo `Color` (`etiqueta`, `atributo`, `selector`,
 * `propiedad`, `valor`, `entidad`), que es un cambio que añade y no toca nada
 * de lo que ya había. Los colores de esos seis viven en `estudioWeb.css`, no
 * en el CSS de Python.
 *
 * ══ Recibe TODO por parámetro ══════════════════════════════════════════════
 *
 * Como `VentanaHojas` en sus 23 clases: los archivos, el guion, las
 * herramientas, la publicación y los efectos llegan de fuera. El armazón no
 * sabe qué se enseña y **no corrige**: llama al predicado que escribió la
 * clase (canon, prueba 3).
 */

export interface EstudioWebProps {
  /** El mando entero, tal cual lo devuelve `useEstudioWeb`. */
  estudio: Estudio;
  /** El nombre del proyecto, para la barra: «Mi sitio». */
  proyecto?: string;
  recursos?: readonly RecursoWeb[];
  /** Lo que la clase manda pintar encima de la página (ver `tiposWeb.ts`). */
  efectos?: readonly EfectoWeb[];
  onEvento?: (evento: EventoPagina) => void;
  /** El inspector de la caja. Apagado, no se pinta. */
  inspector?: boolean;
  publicacion?: Publicacion;
  herramientas?: readonly HerramientaWeb[];
  /** El hueco de `VentanaBase`. */
  encabezado?: ReactNode;
  accesorios?: ReactNode;
  className?: string;
}

const GLIFO: Record<string, string> = { html: '📄', css: '🎨', js: '📜' };
const ROTULO_VISTA: Record<Vista, string> = { escritorio: '🖥 Escritorio', movil: '📱 Móvil', ambas: '🖥📱 Las dos' };

function Problemas({ estudio, resaltada }: { estudio: Estudio; resaltada: boolean }) {
  const { problemas } = estudio;
  const errores = problemas.filter((p) => p.severidad === 'error');
  const avisos = problemas.filter((p) => p.severidad === 'aviso');

  const fila = (p: ProblemaWeb, i: number) => (
    <li key={`${p.clase}-${p.linea}-${i}`} className={`web-problema es-${p.severidad}`} data-clase={p.clase}>
      <button
        type="button"
        className="web-problema-sitio"
        data-testid="web-problema-sitio"
        onClick={() => estudio.senalar(p.origen, p.linea)}
        disabled={p.linea === 0}
      >
        {p.origen}
        {p.linea > 0 ? ` · línea ${p.linea}` : ''}
      </button>
      <span className="web-problema-mensaje">{p.mensaje}</span>
      {p.pista && (
        <span className="web-problema-pista">
          <strong>Pista:</strong> {p.pista}
        </span>
      )}
      <span className="web-problema-familia">en el navegador esto sale como «{p.familia}»</span>
    </li>
  );

  return (
    <section className={`web-problemas${resaltada ? ' es-senalada' : ''}`} data-testid="web-problemas" aria-label="Lo que hay que arreglar">
      <div className="web-problemas-cabeza">
        <span className="web-problemas-titulo">Lo que hay que arreglar</span>
        <span className="web-problemas-cuenta" data-testid="web-cuenta">
          {errores.length} {errores.length === 1 ? 'error' : 'errores'} · {avisos.length} {avisos.length === 1 ? 'aviso' : 'avisos'}
        </span>
      </div>
      {problemas.length === 0 ? (
        <p className="web-problemas-vacia">Todo en orden: tu página no tiene ni un error.</p>
      ) : (
        <ul className="web-problemas-lista">
          {errores.map(fila)}
          {avisos.map(fila)}
        </ul>
      )}
    </section>
  );
}

function Inspector({ estudio, resaltada }: { estudio: Estudio; resaltada: boolean }) {
  const nodo = estudio.nodoSeleccionado;
  if (nodo === null) {
    return (
      <section className={`web-inspector${resaltada ? ' es-senalada' : ''}`} data-testid="web-inspector">
        <h3 className="web-lateral-titulo">Inspector</h3>
        <p className="web-inspector-vacio">Toca cualquier cosa de tu página y aquí verás su caja: el margen, el borde y el relleno.</p>
      </section>
    );
  }

  const c = caja(estudio.pagina, nodo);
  const escritas = propiedadesEscritas(estudio.estiloSeleccionado);

  return (
    <section className={`web-inspector${resaltada ? ' es-senalada' : ''}`} data-testid="web-inspector">
      <h3 className="web-lateral-titulo">Inspector</h3>
      <p className="web-inspector-quien" data-testid="web-inspector-quien">
        <code>
          &lt;{nodo.etiqueta}
          {nodo.atributos.class ? ` class="${nodo.atributos.class}"` : ''}
          {nodo.atributos.id ? ` id="${nodo.atributos.id}"` : ''}&gt;
        </code>{' '}
        · línea {nodo.linea}
      </p>

      <div className="web-caja" data-testid="web-caja">
        <div className="web-caja-margen">
          <span className="web-caja-rotulo">margen</span>
          <span className="web-caja-v es-arriba">{c.margen.arriba}</span>
          <span className="web-caja-v es-izquierda">{c.margen.izquierda}</span>
          <span className="web-caja-v es-derecha">{c.margen.derecha}</span>
          <span className="web-caja-v es-abajo">{c.margen.abajo}</span>
          <div className="web-caja-borde">
            <span className="web-caja-rotulo">borde {c.borde.grosor}</span>
            <div className="web-caja-relleno">
              <span className="web-caja-rotulo">relleno</span>
              <span className="web-caja-v es-arriba">{c.relleno.arriba}</span>
              <span className="web-caja-v es-izquierda">{c.relleno.izquierda}</span>
              <span className="web-caja-v es-derecha">{c.relleno.derecha}</span>
              <span className="web-caja-v es-abajo">{c.relleno.abajo}</span>
              <div className="web-caja-contenido" data-testid="web-caja-contenido">
                {c.ancho} × {c.alto}
              </div>
            </div>
          </div>
        </div>
      </div>

      <h4 className="web-inspector-sub">De dónde sale cada cosa</h4>
      {escritas.length === 0 ? (
        <p className="web-inspector-vacio">Este elemento no tiene ni una regla de estilo puesta.</p>
      ) : (
        <ul className="web-reglas" data-testid="web-reglas">
          {escritas.map((r) => (
            <li key={r.propiedad} className="web-regla" data-propiedad={r.propiedad}>
              <span className="web-regla-prop">{r.propiedad}</span>
              <span className="web-regla-valor">{r.valor}</span>
              <span className="web-regla-quien">{r.deQuien}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Encargo({ estudio }: { estudio: Estudio }) {
  const encargo = estudio.encargo;
  if (!encargo) return null;
  const { paso, indice, total, hecho, pistaVisible, eleccion } = encargo;
  const ultimo = indice >= total - 1;

  return (
    <section className={`web-encargo${hecho ? ' es-hecho' : ''}`} data-testid="web-encargo" data-paso={paso.id}>
      <div className="web-encargo-cuenta">
        Encargo {indice + 1} de {total}
      </div>
      <h3 className="web-encargo-titulo">{paso.titulo}</h3>
      <p className="web-encargo-instruccion">{paso.instruccion}</p>

      {paso.logro.tipo === 'eleccion' && (
        <div className="web-encargo-opciones">
          {paso.logro.opciones.map((o, i) => (
            <button
              key={o}
              type="button"
              className={`web-opcion${eleccion === i ? ' es-elegida' : ''}`}
              data-opcion={i}
              disabled={hecho}
              onClick={() => estudio.elegir(i)}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {paso.logro.tipo === 'confirma' && !hecho && (
        <button type="button" className="web-encargo-confirma" onClick={estudio.confirmar}>
          {paso.logro.boton}
        </button>
      )}

      {!hecho &&
        (pistaVisible ? (
          <p className="web-encargo-pista" data-testid="web-pista">
            <strong>Pista:</strong> {paso.pista}
          </p>
        ) : (
          <button type="button" className="web-encargo-pedir-pista" data-testid="web-pedir-pista" onClick={estudio.mostrarPista}>
            Necesito una pista
          </button>
        ))}

      {hecho && (
        <div className="web-encargo-logrado" data-testid="web-logrado">
          <p className="web-encargo-aprendido">✔ {paso.aprendido}</p>
          {!ultimo && (
            <button type="button" className="web-encargo-siguiente" onClick={estudio.siguienteEncargo}>
              Siguiente encargo →
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function Publicar({ estudio, publicacion, resaltada }: { estudio: Estudio; publicacion: Publicacion; resaltada: boolean }) {
  return (
    <section className={`web-publicar${resaltada ? ' es-senalada' : ''}`} data-testid="web-publicar">
      <h3 className="web-lateral-titulo">Publicar</h3>
      <ol className="web-publicar-pasos">
        {publicacion.pasos.map((p) => {
          const hecho = estudio.pasosPublicados.includes(p.id);
          return (
            <li key={p.id} className={`web-publicar-paso${hecho ? ' es-hecho' : ''}`} data-paso={p.id}>
              <button type="button" className="web-publicar-boton" disabled={hecho} onClick={() => estudio.publicarPaso(p.id)}>
                {hecho ? '✔ ' : ''}
                {p.etiqueta}
              </button>
              <span className="web-publicar-detalle">{p.detalle}</span>
            </li>
          );
        })}
      </ol>
      {estudio.publicado && (
        <p className="web-publicar-direccion" data-testid="web-direccion">
          Tu página está publicada en <strong>{estudio.direccion}</strong>
        </p>
      )}
    </section>
  );
}

export function EstudioWeb({
  estudio,
  proyecto = 'Mi sitio',
  recursos,
  efectos,
  onEvento,
  inspector = true,
  publicacion,
  herramientas,
  encabezado,
  accesorios,
  className,
}: EstudioWebProps) {
  const idPista = 'web-pista-teclado';
  /* Lo que el encargo está señalando ahora mismo. Es el modo guía de Office
   * traído a lo que aquí hay que mirar: no hay cinta que señalar, hay una
   * línea del editor —que ya la pinta `EditorCodigo`— o uno de los cinco
   * sitios de la pantalla. Sin esto, `SenalWeb.control` sería un campo del
   * tipo que nadie pinta, o sea una promesa escrita en un comentario. */
  const senalado = estudio.encargo?.hecho === false ? (estudio.encargo.paso.senal?.control ?? null) : null;
  const aro = (control: string) => (senalado === control ? ' es-senalada' : '');

  return (
    <div className={`web${className ? ` ${className}` : ''}`} data-testid="web" data-vista={estudio.vista} data-senalado={senalado ?? undefined}>
      {encabezado}

      <div className="web-barra">
        <span className="web-proyecto" data-testid="web-proyecto">
          {proyecto}
        </span>

        <div className="web-pestanas" role="tablist" aria-label="Archivos del proyecto">
          {estudio.archivos.map((a) => (
            <button
              key={a.nombre}
              type="button"
              role="tab"
              aria-selected={a.nombre === estudio.activo.nombre}
              className={`web-pestana${a.nombre === estudio.activo.nombre ? ' es-activa' : ''}`}
              data-archivo={a.nombre}
              onClick={() => estudio.abrir(a.nombre)}
            >
              <span aria-hidden="true">{GLIFO[a.lenguaje]}</span> {a.nombre}
              {a.soloLectura === true && (
                <span className="web-pestana-candado" aria-label="sólo lectura">
                  🔒
                </span>
              )}
            </button>
          ))}
        </div>

        <div className={`web-vistas${aro('vista')}${aro('movil')}`} role="group" aria-label="Cómo se ve la página">
          {(['escritorio', 'movil', 'ambas'] as Vista[]).map((v) => (
            <button
              key={v}
              type="button"
              className={`web-vista${estudio.vista === v ? ' es-activa' : ''}`}
              data-vista={v}
              aria-pressed={estudio.vista === v}
              onClick={() => estudio.cambiarVista(v)}
            >
              {ROTULO_VISTA[v]}
            </button>
          ))}
        </div>

        {herramientas && herramientas.length > 0 && (
          <div className="web-herramientas">
            {herramientas.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`web-herramienta${h.principal ? ' es-principal' : ''}${h.activa ? ' es-activa' : ''}`}
                data-herramienta={h.id}
                aria-pressed={h.activa}
                disabled={h.deshabilitada}
                onClick={h.onClick}
              >
                {h.glifo && (
                  <span className="web-herramienta-glifo" aria-hidden="true">
                    {h.glifo}
                  </span>
                )}
                {h.etiqueta}
              </button>
            ))}
          </div>
        )}
      </div>

      {estudio.aviso && (
        <div className={`web-aviso es-${estudio.aviso.tono}`} data-testid="web-aviso" role="status">
          <span>{estudio.aviso.texto}</span>
          <button type="button" className="web-aviso-cerrar" onClick={estudio.descartarAviso} aria-label="Cerrar el aviso">
            ×
          </button>
        </div>
      )}

      <div className="web-cuerpo">
        <div className={`web-izquierda${aro('editor')}`}>
          <EditorCodigo
            texto={estudio.activo.texto}
            lineas={estudio.lineas}
            onCambiar={estudio.escribir}
            editable={estudio.editable}
            lineaError={estudio.problemas.find((p) => p.origen === estudio.activo.nombre && p.severidad === 'error')?.linea ?? 0}
            lineaSenalada={estudio.encargo?.paso.senal?.archivo === estudio.activo.nombre ? (estudio.encargo.paso.senal.linea ?? 0) : 0}
            foco={estudio.foco}
            etiqueta={`Editor de ${estudio.activo.nombre}`}
            idPista={idPista}
          />
          <p className="web-pista-teclado" id={idPista}>
            <kbd>Tab</kbd> sangra · <kbd>Mayús</kbd>+<kbd>Tab</kbd> desangra · <kbd>Esc</kbd> y luego <kbd>Tab</kbd> para salir del editor
          </p>
          <Problemas estudio={estudio} resaltada={senalado === 'problemas'} />
        </div>

        <div className="web-derecha">
          <div className="web-navegador" data-testid="web-navegador">
            <div className="web-navegador-barra">
              <span className="web-navegador-puntos" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="web-navegador-url" data-testid="web-url">
                {estudio.publicado ? `${estudio.direccion}/${estudio.paginaVista}` : `archivo local · ${estudio.paginaVista}`}
              </span>
              {estudio.paginas.length > 1 && (
                <span className="web-navegador-paginas">
                  {estudio.paginas.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`web-navegador-pagina${n === estudio.paginaVista ? ' es-activa' : ''}`}
                      data-pagina={n}
                      onClick={() => estudio.verPagina(n)}
                    >
                      {n}
                    </button>
                  ))}
                </span>
              )}
            </div>

            <div className="web-vistas-lienzos" data-cuantas={estudio.vistas.length}>
              {estudio.vistas.map((v) => (
                <div key={v.nombre} className="web-lienzo-marco" data-vista-nombre={v.nombre}>
                  {estudio.vistas.length > 1 && <span className="web-lienzo-rotulo">{v.nombre === 'Móvil' ? '📱' : '🖥'} {v.nombre} · {v.ancho}px</span>}
                  <VistaPagina
                    pagina={v.pagina}
                    recursos={recursos}
                    efectos={efectos}
                    onEvento={onEvento}
                    seleccion={estudio.seleccion}
                    onSeleccionar={estudio.seleccionar}
                    ancho={v.ancho}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="web-lateral">
          <Encargo estudio={estudio} />
          {inspector && <Inspector estudio={estudio} resaltada={senalado === 'inspector'} />}
          {publicacion && <Publicar estudio={estudio} publicacion={publicacion} resaltada={senalado === 'publicar'} />}
        </aside>
      </div>

      {accesorios}
    </div>
  );
}

export default EstudioWeb;
