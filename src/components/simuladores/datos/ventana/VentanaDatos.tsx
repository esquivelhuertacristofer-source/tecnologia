'use client';

import type { ComponentType, ReactNode } from 'react';
import { EditorCodigo } from '../../codigo/ventana/EditorCodigo';
import { ecoDeLinea } from '../../codigo/ventana/tiposCodigo';
import { NOMBRE_DE_TIPO, textoDeValor, type TablaDeEsquema } from '../modelo';
import type { Datos } from './useDatos';
import { MAX_FILAS_TABLA, type HerramientaDatos, type PanelDatosProps, type ResultadoSQL } from './tiposDatos';
/**
 * `EditorCodigo` pinta con sus propias clases (`.cod-editor`, `.cod-numeros`,
 * `.cod-capa`, `.cod-area`, `.cod-linea`, `.cod-t-*`…), y esas reglas viven en
 * `ventanaCodigo.css` — no aquí, para no duplicarlas y arriesgar que se
 * desalineen de las que de verdad usa el componente. Se importa la hoja
 * entera (nunca se toca) y el resto de sus selectores —barra, consola, error
 * de Python— simplemente no encuentra nada que pintar dentro de esta ventana.
 */
import '../../codigo/ventana/ventanaCodigo.css';
import './ventanaDatos.css';

/**
 * TECNIA DATOS · LA VENTANA
 *
 * El editor de consultas que simula DB Browser for SQLite: pestaña con el
 * nombre del archivo, editor con números y coloreado de SQL, botón ▶
 * Ejecutar (más ↩ Deshacer / ↪ Rehacer, porque la decisión 4 del motor —un
 * `DELETE` sin `WHERE` borra de verdad y se puede deshacer— sólo enseña algo
 * si el botón para deshacerlo existe), los resultados debajo, y a la derecha
 * el árbol del esquema —siempre presente, es media clase de
 * `n10-modela-tus-datos`— más lo que la clase quiera acoplar.
 *
 * **Cero `useState`.** Todo llega en `datos`, lo que devuelve `useDatos`. El
 * mismo trato que `VentanaCodigo` tiene con `useCodigo`.
 *
 * ── El editor se reutiliza, no se reescribe ────────────────────────────────
 *
 * `EditorCodigo` (`codigo/ventana/EditorCodigo.tsx`) es el mismo componente
 * que usa Tecnia Código: números de línea, Tab a la parada de cuatro,
 * Esc+Tab para salir, línea resaltada, `soloLectura`. No sabe nada de Python
 * —su único acoplo es recibir `lineas: LineaPintada[]` ya coloreadas— así que
 * aquí se le pasa `colorearSQL` en vez del coloreado de Python. Si esta
 * ventana hubiera escrito su propio `<textarea>` con su propia capa de
 * colores, habría fallado el encargo (dicho así, literal, en la cabecera del
 * pedido).
 *
 * ── Lo que esta ventana NO hace ────────────────────────────────────────────
 *
 * No sabe si el alumno acertó, ni corrige una consulta: pinta el encargo que
 * le da el guion y llama al predicado que escribió la clase (canon, prueba
 * 3). No hay pantallas de cierre ni insignias aquí.
 *
 * ── Dónde encaja `VentanaBase` ─────────────────────────────────────────────
 *
 *     <VentanaBase marca="Tecnia Datos" subtitulo="alumnos.sql">
 *       <VentanaDatos datos={dat} archivo="alumnos.sql" … />
 *     </VentanaBase>
 */

export interface AccionDatos {
  id: string;
  etiqueta: string;
  onClick: () => void;
  deshabilitada?: boolean;
  principal?: boolean;
}

export interface VentanaDatosProps {
  /** El mando entero, tal cual lo devuelve `useDatos`. */
  datos: Datos;
  /** «alumnos.sql». Sale en la pestaña del archivo. */
  archivo: string;
  /** Un panel acoplado propio de la clase, siempre abierto, junto al del esquema. */
  panelFijo?: { titulo: string; Cuerpo: ComponentType<PanelDatosProps> };
  /** Herramientas que aporta ESTA clase y que el armazón no trae. */
  herramientas?: HerramientaDatos[];
  /** El hueco de `VentanaBase`. */
  encabezado?: ReactNode;
  /** Lo que la clase quiera pintar dentro de la ventana. */
  accesorios?: ReactNode;
  acciones?: AccionDatos[];
  /** El panel del esquema se puede apagar en la clase donde estorbe. Por defecto, visible. */
  esquema?: boolean;
  className?: string;
}

/* ── los resultados ──────────────────────────────────────────────────────── */

function Rejilla({ resultado }: { resultado: ResultadoSQL }) {
  if (resultado.columnas.length === 0) {
    return <p className="dat-tarjeta-resumen">Esta consulta no devuelve ninguna columna.</p>;
  }
  const total = resultado.filas.length;
  const recorte = total > MAX_FILAS_TABLA;
  const visibles = recorte ? resultado.filas.slice(0, MAX_FILAS_TABLA) : resultado.filas;

  return (
    <div className="dat-tabla-envoltura">
      <table className="dat-tabla" data-testid="dat-tabla">
        <thead>
          <tr>
            {resultado.columnas.map((c, i) => (
              <th key={i}>{c.nombre}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibles.map((fila, i) => (
            <tr key={i}>
              {fila.map((v, j) => (
                <td key={j} className={v === null ? 'es-null' : undefined}>
                  {textoDeValor(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {total === 0 ? (
        <p className="dat-tabla-pie" data-testid="dat-tabla-cero">
          Esta consulta no encontró ninguna fila.
        </p>
      ) : (
        <p className="dat-tabla-pie" data-testid="dat-tabla-pie">
          {recorte
            ? `Se muestran las primeras ${MAX_FILAS_TABLA} de ${total.toLocaleString('es-MX')} filas.`
            : `${total} fila${total === 1 ? '' : 's'}.`}
        </p>
      )}
    </div>
  );
}

const GLIFO_RESULTADO: Record<ResultadoSQL['clase'], string> = { consulta: '🔍', esquema: '🏗️', cambio: '✏️' };
const TITULO_RESULTADO: Record<ResultadoSQL['clase'], string> = {
  consulta: 'Consulta',
  esquema: 'Cambio en el esquema',
  cambio: 'Cambio en los datos',
};

function TarjetaResultado({ resultado, indice, total }: { resultado: ResultadoSQL; indice: number; total: number }) {
  return (
    <section className="dat-tarjeta" data-testid="dat-tarjeta" data-clase={resultado.clase}>
      <header className="dat-tarjeta-cabeza">
        <span aria-hidden="true">{GLIFO_RESULTADO[resultado.clase]}</span>
        <span className="dat-tarjeta-titulo">{TITULO_RESULTADO[resultado.clase]}</span>
        {total > 1 && (
          <span className="dat-tarjeta-indice">
            Instrucción {indice + 1} de {total}
          </span>
        )}
      </header>

      {resultado.clase === 'consulta' ? (
        <Rejilla resultado={resultado} />
      ) : (
        <p className="dat-tarjeta-resumen" data-testid="dat-tarjeta-resumen">
          {resultado.filasAfectadas} fila{resultado.filasAfectadas === 1 ? '' : 's'} afectada
          {resultado.filasAfectadas === 1 ? '' : 's'}.
        </p>
      )}

      {resultado.avisos.length > 0 && (
        <ul className="dat-avisos" data-testid="dat-avisos">
          {resultado.avisos.map((a, i) => (
            <li key={i} className="dat-avisos-item">
              ⚠ {a}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Un guion de varias instrucciones enseña TODAS sus tarjetas, en orden: ver
 * la cabecera de `tiposDatos.ts` para el porqué. Si la última ejecución
 * falló a mitad de guion, `ejecucion.resultados` trae igualmente las
 * instrucciones que sí se aplicaron antes del tropiezo — el motor no las
 * revierte (`motor.ts`) — así que se siguen enseñando aquí, y el error se
 * pinta aparte, en `TropiezoEnPantalla`.
 */
function PanelResultados({ datos }: { datos: Datos }) {
  const { ejecucion, resultadoVigente } = datos;

  if (!ejecucion) {
    return (
      <div className="dat-resultados-vacio" data-testid="dat-resultados-vacio">
        Pulsa ▶ Ejecutar para ver qué devuelve tu consulta.
      </div>
    );
  }

  const resultados = ejecucion.resultados;
  if (resultados.length === 0) {
    return (
      <div className="dat-resultados-vacio" data-testid="dat-resultados-vacio">
        {ejecucion.ok
          ? 'No escribiste ninguna instrucción que ejecutar.'
          : 'Ninguna instrucción llegó a ejecutarse: el error está en la primera.'}
      </div>
    );
  }

  return (
    <div className="dat-resultados" data-testid="dat-resultados">
      {!resultadoVigente && (
        <p className="dat-resultados-viejo" data-testid="dat-resultados-viejo">
          Esto es de tu última ejecución: el texto ha cambiado desde entonces.
        </p>
      )}
      {resultados.map((r, i) => (
        <TarjetaResultado key={i} resultado={r} indice={i} total={resultados.length} />
      ))}
    </div>
  );
}

/**
 * El error, como material de clase: el mismo trato que `TropiezoEnPantalla`
 * en `VentanaCodigo` —qué, dónde con la línea a un clic, el dedo debajo,
 * la pista, y la familia al final y en pequeño— reutilizando `ecoDeLinea`
 * porque es el mismo cálculo (línea + columna → eco con el dedo) sin nada
 * de Python dentro.
 *
 * Sólo se pinta mientras el resultado sigue retratando lo escrito
 * (`resultadoVigente`): en cuanto el alumno toca el texto, señalar la vieja
 * línea del error apuntaría a una consulta que ya no existe.
 */
function TropiezoEnPantalla({ datos }: { datos: Datos }) {
  if (!datos.ejecucion || datos.ejecucion.ok || !datos.resultadoVigente) return null;
  const e = datos.ejecucion.error;
  const eco = ecoDeLinea(datos.texto, e.linea, e.columna);

  return (
    <div className="dat-error" data-testid="dat-error" role="alert">
      <div className="dat-error-cabeza">
        <span className="dat-error-glifo" aria-hidden="true">
          ✋
        </span>
        {e.linea > 0 && (
          <button
            type="button"
            className="dat-error-linea"
            data-testid="dat-error-linea"
            onClick={() => datos.senalarLinea(e.linea)}
          >
            Línea {e.linea}
          </button>
        )}
        <span className="dat-error-mensaje">{e.mensaje}</span>
      </div>

      {eco && (
        <pre className="dat-error-eco" aria-hidden="true">
          <span className="dat-error-codigo">{eco.codigo}</span>
          {eco.dedo !== '' && <span className="dat-error-dedo">{'\n' + eco.dedo}</span>}
        </pre>
      )}

      {e.pista && (
        <p className="dat-error-pista">
          <strong>Pista:</strong> {e.pista}
        </p>
      )}
      <p className="dat-error-familia">En un motor de verdad esto se llama: {e.familia}</p>
    </div>
  );
}

/* ── el esquema ───────────────────────────────────────────────────────────── */

function PanelEsquema({ esquema }: { esquema: TablaDeEsquema[] }) {
  return (
    <section className="dat-esquema" data-testid="dat-esquema" aria-label="El esquema de la base">
      <h3 className="dat-lateral-titulo">El esquema</h3>
      {esquema.length === 0 ? (
        <p className="dat-esquema-vacio">Todavía no hay ninguna tabla. Créala con CREATE TABLE.</p>
      ) : (
        <ul className="dat-tablas">
          {esquema.map((t) => (
            <li key={t.nombre} className="dat-tabla-esquema" data-tabla={t.nombre}>
              <div className="dat-tabla-esquema-cabeza">
                <span className="dat-tabla-esquema-nombre">{t.nombre}</span>
                <span className="dat-tabla-esquema-filas">
                  {t.filas} fila{t.filas === 1 ? '' : 's'}
                </span>
              </div>
              {t.columnas.length === 0 ? (
                <p className="dat-tabla-esquema-sin">(sin columnas)</p>
              ) : (
                <ul className="dat-columnas">
                  {t.columnas.map((c) => (
                    <li key={c.nombre} className="dat-columna" data-columna={c.nombre}>
                      {c.clavePrimaria && (
                        <span className="dat-columna-clave" title="Clave primaria" aria-hidden="true">
                          🔑
                        </span>
                      )}
                      <span className="dat-columna-nombre">{c.nombre}</span>
                      <span className="dat-columna-tipo">{NOMBRE_DE_TIPO[c.tipo]}</span>
                      {c.noNulo && <span className="dat-columna-nn">NOT NULL</span>}
                      {c.referencia && (
                        <span className="dat-columna-fk">
                          → {c.referencia.tabla}.{c.referencia.columna}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ── el encargo ───────────────────────────────────────────────────────────── */

function Encargo({ datos }: { datos: Datos }) {
  const encargo = datos.encargo;
  if (!encargo) return null;
  const { paso, indice, total, hecho, pistaVisible, eleccion } = encargo;
  const ultimo = indice >= total - 1;

  return (
    <section className={`dat-encargo${hecho ? ' es-hecho' : ''}`} data-testid="dat-encargo" data-paso={paso.id}>
      <div className="dat-encargo-cuenta">
        Encargo {indice + 1} de {total}
      </div>
      <h3 className="dat-encargo-titulo">{paso.titulo}</h3>
      <p className="dat-encargo-instruccion">{paso.instruccion}</p>

      {paso.logro.tipo === 'eleccion' && (
        <div className="dat-encargo-opciones">
          {paso.logro.opciones.map((o, i) => (
            <button
              key={o}
              type="button"
              className={`dat-opcion${eleccion === i ? ' es-elegida' : ''}`}
              data-opcion={i}
              disabled={hecho}
              onClick={() => datos.elegir(i)}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {paso.logro.tipo === 'confirma' && !hecho && (
        <button type="button" className="dat-encargo-confirma" onClick={datos.confirmar}>
          {paso.logro.boton}
        </button>
      )}

      {pistaVisible && !hecho && (
        <p className="dat-encargo-pista" data-testid="dat-pista">
          <strong>Pista:</strong> {paso.pista}
        </p>
      )}

      {hecho && (
        <div className="dat-encargo-logrado" data-testid="dat-logrado">
          <p className="dat-encargo-aprendido">✔ {paso.aprendido}</p>
          {!ultimo && (
            <button type="button" className="dat-encargo-siguiente" onClick={datos.siguienteEncargo}>
              Siguiente encargo →
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ── la ventana ───────────────────────────────────────────────────────────── */

export function VentanaDatos({
  datos,
  archivo,
  panelFijo,
  herramientas,
  encabezado,
  accesorios,
  acciones,
  esquema = true,
  className,
}: VentanaDatosProps) {
  const idPista = 'dat-pista-teclado';

  /**
   * `SenalDatos.control` prometía «el botón se ilumina» y no había ni una
   * regla que lo pintara — el mismo defecto que `VentanaCodigo` tuvo hasta el
   * 15-ago-2026 (§50.6 del documento maestro), encontrado aquí al montar la
   * primera clase que lo usa. Se apaga solo en cuanto el encargo está hecho:
   * el aro dice «mira aquí AHORA», y dejarlo encendido sobre algo ya
   * conseguido es ruido.
   */
  const senalado = datos.encargo && !datos.encargo.hecho ? datos.encargo.paso.senal?.control : undefined;

  return (
    <div className={`dat${className ? ` ${className}` : ''}`} data-testid="dat" data-senal={senalado ?? ''}>
      {encabezado}

      <div className="dat-barra">
        <span className="dat-archivo" data-testid="dat-archivo">
          <span className="dat-archivo-glifo" aria-hidden="true">
            🗄️
          </span>
          {archivo}
        </span>

        <div className="dat-controles" role="group" aria-label="Controles de la consulta">
          <button
            type="button"
            className="dat-boton es-ejecutar"
            data-testid="dat-ejecutar"
            onClick={datos.ejecutar}
            aria-label="Ejecutar la consulta"
          >
            ▶ <span className="dat-boton-texto">Ejecutar</span>
          </button>
          <button
            type="button"
            className="dat-boton es-deshacer"
            data-testid="dat-deshacer"
            onClick={datos.deshacer}
            disabled={!datos.puedeDeshacer}
            aria-label="Deshacer el último cambio en los datos"
          >
            ↩ <span className="dat-boton-texto">Deshacer</span>
          </button>
          <button
            type="button"
            className="dat-boton es-rehacer"
            data-testid="dat-rehacer"
            onClick={datos.rehacer}
            disabled={!datos.puedeRehacer}
            aria-label="Rehacer"
          >
            ↪ <span className="dat-boton-texto">Rehacer</span>
          </button>
          <button
            type="button"
            className="dat-boton es-reiniciar"
            data-testid="dat-reiniciar"
            onClick={datos.reiniciar}
            aria-label="Empezar de cero"
          >
            ↺
          </button>
        </div>

        {herramientas && herramientas.length > 0 && (
          <div className="dat-herramientas">
            {herramientas.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`dat-herramienta${h.principal ? ' es-principal' : ''}${h.activa ? ' es-activa' : ''}`}
                data-herramienta={h.id}
                aria-pressed={h.activa}
                disabled={h.deshabilitada}
                onClick={h.onClick}
              >
                {h.glifo && (
                  <span className="dat-herramienta-glifo" aria-hidden="true">
                    {h.glifo}
                  </span>
                )}
                {h.etiqueta}
              </button>
            ))}
          </div>
        )}
      </div>

      {datos.aviso && (
        <div className={`dat-aviso es-${datos.aviso.tono}`} data-testid="dat-aviso" role="status">
          <span>{datos.aviso.texto}</span>
          <button type="button" className="dat-aviso-cerrar" onClick={datos.descartarAviso} aria-label="Cerrar el aviso">
            ×
          </button>
        </div>
      )}

      <div className="dat-cuerpo">
        <div className="dat-izquierda">
          <EditorCodigo
            texto={datos.texto}
            lineas={datos.lineas}
            onCambiar={datos.escribir}
            editable={datos.editable}
            onBloqueado={datos.avisarBloqueo}
            bajoLlave={datos.bajoLlave}
            lineaError={datos.resultadoVigente && datos.ejecucion && !datos.ejecucion.ok ? datos.ejecucion.error.linea : 0}
            lineaSenalada={datos.encargo?.paso.senal?.linea ?? 0}
            foco={datos.foco}
            etiqueta={`Editor de consultas · ${archivo}`}
            idPista={idPista}
          />
          <p className="dat-pista-teclado" id={idPista}>
            <kbd>Tab</kbd> sangra cuatro espacios · <kbd>Mayús</kbd>+<kbd>Tab</kbd> desangra ·{' '}
            <kbd>Esc</kbd> y luego <kbd>Tab</kbd> para salir del editor
          </p>

          <PanelResultados datos={datos} />
          <TropiezoEnPantalla datos={datos} />
        </div>

        <aside className="dat-lateral">
          <Encargo datos={datos} />
          {panelFijo && (
            <section className="dat-panel" data-testid="dat-panel" aria-label={panelFijo.titulo}>
              <h3 className="dat-lateral-titulo">{panelFijo.titulo}</h3>
              <panelFijo.Cuerpo ejecucion={datos.ejecucion} texto={datos.texto} senalarLinea={datos.senalarLinea} />
            </section>
          )}
          {esquema && <PanelEsquema esquema={datos.esquema} />}
        </aside>
      </div>

      {accesorios}

      {acciones && acciones.length > 0 && (
        <div className="dat-acciones">
          {acciones.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`dat-accion${a.principal ? ' es-principal' : ''}`}
              data-accion={a.id}
              disabled={a.deshabilitada}
              onClick={a.onClick}
            >
              {a.etiqueta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default VentanaDatos;
