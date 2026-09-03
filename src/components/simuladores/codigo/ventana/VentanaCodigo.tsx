'use client';

import type { ComponentType, ReactNode } from 'react';
import { EditorCodigo } from './EditorCodigo';
import {
  VELOCIDADES,
  ecoDeLinea,
  type Ejecucion,
  type HerramientaCodigo,
  type PanelCodigoProps,
} from './tiposCodigo';
import type { Codigo } from './useCodigo';
import './ventanaCodigo.css';

/**
 * TECNIA CÓDIGO · LA VENTANA
 *
 * El editor de código que simula Thonny: barra con el nombre del archivo y los
 * controles, editor con números y colores, consola abajo con la salida y con el
 * `input()` de verdad, y a la derecha las variables, el encargo y lo que la
 * clase quiera acoplar.
 *
 * **Cero `useState`.** Todo llega en `codigo`, que es lo que devuelve
 * `useCodigo`. Es el mismo trato que `VentanaAsistente` tiene con
 * `useAsistente`, y por el mismo motivo: la clase necesita el mando —para
 * corregir, para reaccionar, para meter sus propios botones— y no se lo puede
 * dar una ventana que se guarda el estado dentro.
 *
 * ── Lo que esta ventana NO hace, y no debe hacer nunca ─────────────────────
 *
 * No sabe si el alumno acertó. Pinta el encargo que le da el guion y llama al
 * predicado que escribió la clase. No pinta pantallas de cierre, ni insignias,
 * ni marcadores: eso es del laboratorio que la monta (canon, prueba 3).
 *
 * ── Dónde encaja `VentanaBase` ────────────────────────────────────────────
 *
 * Aquí no se dibuja el marco de la ventana. El hueco `encabezado` es donde
 * entra la barra de título de `VentanaBase`:
 *
 *     <VentanaBase marca="Tecnia Código" subtitulo="retos.py">
 *       <VentanaCodigo codigo={cod} archivo="retos.py" … />
 *     </VentanaBase>
 */

export interface AccionCodigo {
  id: string;
  etiqueta: string;
  onClick: () => void;
  deshabilitada?: boolean;
  principal?: boolean;
}

export interface VentanaCodigoProps {
  /** El mando entero, tal cual lo devuelve `useCodigo`. */
  codigo: Codigo;
  /** «retos.py». Sale en la pestaña del archivo. */
  archivo: string;
  /** Un panel acoplado propio de la clase, siempre abierto. */
  panelFijo?: { titulo: string; Cuerpo: ComponentType<PanelCodigoProps> };
  /** Herramientas que aporta ESTA clase y que el armazón no trae. */
  herramientas?: HerramientaCodigo[];
  /**
   * Cómo se pinta lo que salió. Sin ella, la consola de siempre.
   *
   * Es el hueco por el que una clase enseña la salida a su manera —una rejilla,
   * un dibujo, dos columnas comparadas— sin que el armazón tenga que saber de
   * qué va. La consola no desaparece: se pinta debajo, porque `print` sigue
   * escribiendo y los errores siguen saliendo por ahí.
   */
  salida?: (e: Ejecucion) => ReactNode;
  /** El hueco de `VentanaBase`. */
  encabezado?: ReactNode;
  /** Lo que la clase quiera pintar dentro de la ventana. */
  accesorios?: ReactNode;
  acciones?: AccionCodigo[];
  /** El panel de variables se puede apagar en las clases donde estorba. */
  variables?: boolean;
  className?: string;
}

const ROTULO_FASE: Record<string, string> = {
  libre: 'Listo',
  corriendo: 'Ejecutando…',
  pausada: 'En pausa',
  esperando: 'Esperando tu respuesta',
  terminada: 'El programa terminó',
  error: 'El programa se detuvo por un error',
  detenida: 'Lo paraste tú',
};

/** Con la consola llena de un bucle, pintar 5 000 líneas de DOM cuesta más que ejecutarlas. */
const MAX_LINEAS_CONSOLA = 400;

function Consola({ codigo }: { codigo: Codigo }) {
  const { ejecucion } = codigo;
  const total = ejecucion.salida.length;
  const recortada = total > MAX_LINEAS_CONSOLA;
  const visibles = recortada ? ejecucion.salida.slice(total - MAX_LINEAS_CONSOLA) : ejecucion.salida;

  return (
    <div className="cod-consola" data-testid="cod-consola">
      <div className="cod-consola-cabeza">
        <span className="cod-consola-titulo">Consola</span>
        <span className="cod-consola-estado" data-fase={ejecucion.fase}>
          {ROTULO_FASE[ejecucion.fase] ?? ''}
        </span>
        <button
          type="button"
          className="cod-consola-limpiar"
          onClick={codigo.limpiarConsola}
          disabled={total === 0}
        >
          Limpiar
        </button>
      </div>

      <div className="cod-consola-cuerpo" data-testid="cod-salida">
        {total === 0 && <p className="cod-consola-vacia">Aquí sale lo que tu programa escriba con «print».</p>}
        {recortada && (
          <p className="cod-consola-recorte">
            … se muestran las últimas {MAX_LINEAS_CONSOLA} líneas de {total.toLocaleString('es-MX')}
          </p>
        )}
        {visibles.map((linea, i) => (
          <div key={total - visibles.length + i} className="cod-consola-linea">
            {linea === '' ? ' ' : linea}
          </div>
        ))}

        {ejecucion.pregunta !== null && (
          <form
            className="cod-consola-pregunta"
            data-testid="cod-pregunta"
            onSubmit={(e) => {
              e.preventDefault();
              codigo.contestar();
            }}
          >
            <span className="cod-consola-cursor" aria-hidden="true">
              ⌨
            </span>
            <input
              className="cod-consola-entrada"
              data-testid="cod-entrada"
              value={codigo.borrador}
              autoFocus
              aria-label={ejecucion.pregunta === '' ? 'Tu programa está esperando un dato' : ejecucion.pregunta}
              onChange={(e) => codigo.escribirBorrador(e.target.value)}
            />
            <button type="submit" className="cod-consola-enviar" data-testid="cod-responder">
              Enviar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * El error, como material de clase.
 *
 * Un error de programación bien contado tiene cuatro partes y las cuatro se
 * ven: **qué** pasó en español, **dónde** (con la línea a un clic, que enfoca
 * el editor), **el dedo** debajo del trozo culpable, y **la pista**. El nombre
 * inglés va el último y en pequeño: es lo que verá el día que abra Python de
 * verdad, y hay que haberlo visto antes — pero no es lo primero que se lee.
 */
function TropiezoEnPantalla({ codigo }: { codigo: Codigo }) {
  const e = codigo.ejecucion.error;
  if (!e) return null;
  const eco = ecoDeLinea(codigo.texto, e.linea, e.columna);

  return (
    <div className="cod-error" data-testid="cod-error" role="alert">
      <div className="cod-error-cabeza">
        <span className="cod-error-glifo" aria-hidden="true">
          ✋
        </span>
        {e.linea > 0 && (
          <button
            type="button"
            className="cod-error-linea"
            data-testid="cod-error-linea"
            onClick={() => codigo.senalarLinea(e.linea)}
          >
            Línea {e.linea}
          </button>
        )}
        <span className="cod-error-mensaje">{e.mensaje}</span>
      </div>

      {eco && (
        <pre className="cod-error-eco" aria-hidden="true">
          <span className="cod-error-codigo">{eco.codigo}</span>
          {eco.dedo !== '' && <span className="cod-error-dedo">{'\n' + eco.dedo}</span>}
        </pre>
      )}

      {e.pista && (
        <p className="cod-error-pista">
          <strong>Pista:</strong> {e.pista}
        </p>
      )}
      <p className="cod-error-familia">En Python de verdad esto se llama {e.familia}</p>
    </div>
  );
}

function Variables({ codigo }: { codigo: Codigo }) {
  const { variables: vistazos, pilaDeLlamadas, fase } = codigo.ejecucion;
  const dentroDeFuncion = pilaDeLlamadas.length > 1;

  return (
    <section className="cod-vars" data-testid="cod-variables">
      <h3 className="cod-lateral-titulo">Variables</h3>
      {vistazos.length === 0 ? (
        <p className="cod-vars-vacio">
          {fase === 'libre'
            ? 'Ejecuta el programa y aquí verás lo que vale cada variable.'
            : 'Todavía no hay ninguna variable.'}
        </p>
      ) : (
        <ul className="cod-vars-lista">
          {vistazos.map((v) => (
            <li key={`${v.ambito}-${v.nombre}`} className="cod-var" data-ambito={v.ambito} data-var={v.nombre}>
              <span className="cod-var-nombre">{v.nombre}</span>
              <span className="cod-var-valor">{v.texto}</span>
            </li>
          ))}
        </ul>
      )}

      {dentroDeFuncion && (
        <>
          <h3 className="cod-lateral-titulo">Dónde va</h3>
          <ol className="cod-pila" data-testid="cod-pila">
            {pilaDeLlamadas.map((m, i) => (
              <li key={`${m.funcion}-${i}`} className="cod-pila-marco">
                <span className="cod-pila-fn">{m.funcion}</span>
                <span className="cod-pila-linea">línea {m.linea}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

function Encargo({ codigo }: { codigo: Codigo }) {
  const encargo = codigo.encargo;
  if (!encargo) return null;
  const { paso, indice, total, hecho, pistaVisible, eleccion } = encargo;
  const ultimo = indice >= total - 1;

  return (
    <section className={`cod-encargo${hecho ? ' es-hecho' : ''}`} data-testid="cod-encargo" data-paso={paso.id}>
      <div className="cod-encargo-cuenta">
        Encargo {indice + 1} de {total}
      </div>
      <h3 className="cod-encargo-titulo">{paso.titulo}</h3>
      <p className="cod-encargo-instruccion">{paso.instruccion}</p>

      {paso.logro.tipo === 'eleccion' && (
        <div className="cod-encargo-opciones">
          {paso.logro.opciones.map((o, i) => (
            <button
              key={o}
              type="button"
              className={`cod-opcion${eleccion === i ? ' es-elegida' : ''}`}
              data-opcion={i}
              disabled={hecho}
              onClick={() => codigo.elegir(i)}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {paso.logro.tipo === 'confirma' && !hecho && (
        <button type="button" className="cod-encargo-confirma" onClick={codigo.confirmar}>
          {paso.logro.boton}
        </button>
      )}

      {pistaVisible && !hecho && (
        <p className="cod-encargo-pista" data-testid="cod-pista">
          <strong>Pista:</strong> {paso.pista}
        </p>
      )}

      {hecho && (
        <div className="cod-encargo-logrado" data-testid="cod-logrado">
          <p className="cod-encargo-aprendido">✔ {paso.aprendido}</p>
          {!ultimo && (
            <button type="button" className="cod-encargo-siguiente" onClick={codigo.siguienteEncargo}>
              Siguiente encargo →
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export function VentanaCodigo({
  codigo,
  archivo,
  panelFijo,
  herramientas,
  salida,
  encabezado,
  accesorios,
  acciones,
  variables = true,
  className,
}: VentanaCodigoProps) {
  const { ejecucion, fase } = codigo;
  const hayMaquina = ejecucion.estadoMaquina !== null;
  const corriendo = fase === 'corriendo';
  const idPista = 'cod-pista-teclado';

  /**
   * El aro del encargo sobre un control.
   *
   * **Estaba prometido y no estaba hecho** (arreglado el 15-ago-2026, al montar
   * las tres primeras clases encima). `SenalCodigo` declara desde el primer día
   * que «con `control`, el botón se ilumina», y `VentanaCodigo` sólo leía
   * `senal.linea`: un encargo que decía «pulsa ⏭ Un paso» señalaba exactamente
   * nada, y las clases de N6 y N7 lo usan en cuatro encargos. Un campo del tipo
   * que el que pinta ignora es peor que no tenerlo, porque quien escribe la
   * clase lo rellena creyendo que sirve.
   *
   * Se apaga solo en cuanto el encargo está hecho: el aro dice «mira aquí
   * AHORA», y dejarlo encendido sobre algo ya conseguido es ruido.
   */
  const senalado = codigo.encargo && !codigo.encargo.hecho ? codigo.encargo.paso.senal?.control : undefined;

  return (
    <div
      className={`cod${className ? ` ${className}` : ''}`}
      data-testid="cod"
      data-fase={fase}
      data-senal={senalado ?? ''}
    >
      {encabezado}

      <div className="cod-barra">
        <span className="cod-archivo" data-testid="cod-archivo">
          <span className="cod-archivo-glifo" aria-hidden="true">
            🐍
          </span>
          {archivo}
        </span>

        <div className="cod-controles" role="group" aria-label="Controles del programa">
          <button
            type="button"
            className="cod-boton es-ejecutar"
            data-testid="cod-ejecutar"
            onClick={codigo.ejecutar}
            disabled={corriendo}
            aria-label="Ejecutar el programa"
          >
            ▶ <span className="cod-boton-texto">{fase === 'pausada' ? 'Seguir' : 'Ejecutar'}</span>
          </button>
          <button
            type="button"
            className="cod-boton es-parar"
            data-testid="cod-parar"
            onClick={codigo.parar}
            disabled={!hayMaquina || fase === 'detenida'}
            aria-label="Parar el programa"
          >
            ⏹ <span className="cod-boton-texto">Parar</span>
          </button>
          {/*
            ⏭ **no se apaga nunca**, y eso es un arreglo del 15-ago-2026.
            Estaba `disabled` con la fase `terminada` o `error`, y dejaba sin
            salida al gesto más natural de una clase de programación: ejecutar
            el programa entero y luego querer verlo despacio. Terminado el
            programa, ⏭ quedaba gris y el único botón vivo era ↺, que **borra
            lo que el alumno escribió** y lo devuelve a la plantilla. O sea: no
            había forma de recorrer paso a paso tu propio programa después de
            haberlo ejecutado una vez, que es justo la mitad del valor de este
            motor. `unPaso` ya sabía qué hacer en ese caso desde el primer día
            —si no hay máquina viva, nace una y enciende la línea 1—, así que
            el defecto estaba sólo en el botón.
          */}
          <button
            type="button"
            className="cod-boton es-paso"
            data-testid="cod-paso"
            onClick={codigo.unPaso}
            aria-label="Ejecutar un paso"
          >
            ⏭ <span className="cod-boton-texto">Un paso</span>
          </button>
          <button
            type="button"
            className="cod-boton es-reiniciar"
            data-testid="cod-reiniciar"
            onClick={codigo.reiniciar}
            aria-label="Empezar de cero"
          >
            ↺
          </button>
        </div>

        <div className="cod-velocidad" role="group" aria-label="Velocidad de ejecución">
          {VELOCIDADES.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`cod-vel${codigo.velocidad === v.id ? ' es-activa' : ''}`}
              data-vel={v.id}
              aria-pressed={codigo.velocidad === v.id}
              title={v.nombre}
              onClick={() => codigo.cambiarVelocidad(v.id)}
            >
              <span aria-hidden="true">{v.glifo}</span>
              <span className="cod-vel-nombre">{v.nombre}</span>
            </button>
          ))}
        </div>

        {herramientas && herramientas.length > 0 && (
          <div className="cod-herramientas">
            {herramientas.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`cod-herramienta${h.principal ? ' es-principal' : ''}${h.activa ? ' es-activa' : ''}`}
                data-herramienta={h.id}
                aria-pressed={h.activa}
                disabled={h.deshabilitada}
                onClick={h.onClick}
              >
                {h.glifo && (
                  <span className="cod-herramienta-glifo" aria-hidden="true">
                    {h.glifo}
                  </span>
                )}
                {h.etiqueta}
              </button>
            ))}
          </div>
        )}
      </div>

      {codigo.aviso && (
        <div className={`cod-aviso es-${codigo.aviso.tono}`} data-testid="cod-aviso" role="status">
          <span>{codigo.aviso.texto}</span>
          <button type="button" className="cod-aviso-cerrar" onClick={codigo.descartarAviso} aria-label="Cerrar el aviso">
            ×
          </button>
        </div>
      )}

      <div className="cod-cuerpo">
        <div className="cod-izquierda">
          <EditorCodigo
            texto={codigo.texto}
            lineas={codigo.lineas}
            onCambiar={codigo.escribir}
            editable={codigo.editable}
            onBloqueado={codigo.avisarBloqueo}
            bajoLlave={codigo.bajoLlave}
            lineaEnCurso={ejecucion.linea}
            lineaError={ejecucion.error?.linea ?? 0}
            lineaSenalada={codigo.encargo?.paso.senal?.linea ?? 0}
            foco={codigo.foco}
            etiqueta={`Editor de código · ${archivo}`}
            idPista={idPista}
          />
          <p className="cod-pista-teclado" id={idPista}>
            <kbd>Tab</kbd> sangra cuatro espacios · <kbd>Mayús</kbd>+<kbd>Tab</kbd> desangra ·{' '}
            <kbd>Esc</kbd> y luego <kbd>Tab</kbd> para salir del editor
          </p>

          {salida ? (
            <div className="cod-salida-propia" data-testid="cod-salida-propia">
              {salida(ejecucion)}
            </div>
          ) : null}
          <Consola codigo={codigo} />
          <TropiezoEnPantalla codigo={codigo} />
        </div>

        <aside className="cod-lateral">
          <Encargo codigo={codigo} />
          {panelFijo && (
            <section className="cod-panel" data-testid="cod-panel" aria-label={panelFijo.titulo}>
              <h3 className="cod-lateral-titulo">{panelFijo.titulo}</h3>
              <panelFijo.Cuerpo ejecucion={ejecucion} texto={codigo.texto} senalarLinea={codigo.senalarLinea} />
            </section>
          )}
          {variables && <Variables codigo={codigo} />}
        </aside>
      </div>

      {accesorios}

      {acciones && acciones.length > 0 && (
        <div className="cod-acciones">
          {acciones.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`cod-accion${a.principal ? ' es-principal' : ''}`}
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

export default VentanaCodigo;
