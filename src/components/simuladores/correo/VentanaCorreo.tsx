'use client';

import type { ReactNode } from 'react';
import {
  CARPETAS,
  ETIQUETA_CARPETA,
  adjuntoPeligroso,
  pesoLegible,
  tipoDeAdjunto,
  type AdjuntoCorreo,
  type BorradorCorreo,
  type CarpetaCorreo,
  type ConteoCarpeta,
  type EnlaceCorreo,
  type MensajeCorreo,
  type RemitenteCorreo,
} from './tiposCorreo';
import './ventanaCorreo.css';

/**
 * TECNIA CORREO · LA VENTANA
 *
 * Columna de carpetas · lista de la bandeja · panel de lectura, y la ventana
 * de redacción flotando encima. **Cero `useState`**: todo entra por parámetro,
 * como `VentanaHojas` y `VentanaMuro`. Quien tiene el estado es `useCorreo`.
 *
 * No pinta el marco de programa (barra de título, botón de encender): eso es
 * `VentanaBase`. Una clase monta:
 *
 *     <VentanaBase marca="Tecnia Correo" subtitulo={BUZON}>
 *       <VentanaCorreo carpetaActiva={c.carpeta} mensajes={c.enCarpeta()} … />
 *     </VentanaBase>
 *
 * ── Lo que este componente NO hace ─────────────────────────────────────────
 *
 * No decide qué acciones ofrece un mensaje: pinta sólo las de `acciones`, y
 * sin `acciones` no ofrece NI UN botón. No decide qué es un acierto, no dice
 * si un correo es una estafa, no corrige nada.
 *
 * ── `lectura` es un hueco opaco ────────────────────────────────────────────
 *
 * Lo pide el canon con esas palabras («10 · Tecnia Nube»): en el panel de
 * lectura es donde las clases divergen de verdad —zonas señalables, lupas,
 * veredicto— y no hay abstracción que las una sin romperlas. Si se pasa
 * `lectura`, sustituye al panel de serie; si no, se pinta el de serie.
 *
 * ── Las dos mitades de la mentira, dos interruptores ───────────────────────
 *
 * La lista enseña sólo el NOMBRE del remitente, como hace un cliente de
 * verdad — ahí empieza el engaño. `mostrarDireccion` destapa la dirección real
 * en el panel de lectura y `mostrarDestino` destapa a dónde va cada enlace.
 * Son las dos lupas del phishing, y por eso la clase decide cuándo se
 * encienden: destapadas desde el primer segundo no hay nada que descubrir.
 */

export type AccionCorreo =
  | 'responder'
  | 'responder-a-todos'
  | 'reenviar'
  | 'marcar'
  | 'borrar'
  | 'no-deseado';

const ETIQUETA_ACCION: Record<AccionCorreo, { icono: string; etiqueta: string }> = {
  responder: { icono: '↩️', etiqueta: 'Responder' },
  'responder-a-todos': { icono: '↪️', etiqueta: 'Responder a todos' },
  reenviar: { icono: '➡️', etiqueta: 'Reenviar' },
  marcar: { icono: '⭐', etiqueta: 'Marcar' },
  borrar: { icono: '🗑️', etiqueta: 'Borrar' },
  'no-deseado': { icono: '⚠️', etiqueta: 'No deseado' },
};

const ICONO_ADJUNTO: Record<ReturnType<typeof tipoDeAdjunto>, string> = {
  documento: '📄',
  imagen: '🖼️',
  video: '🎬',
  audio: '🎵',
  comprimido: '🗜️',
  programa: '⚙️',
  guion: '📜',
  desconocido: '📎',
};

/** El compositor de la ventana de redacción, controlado por la clase — igual
 *  que `compositor` en `VentanaMuro`. Sin `onCampo` los campos se pintan en
 *  sólo lectura: hay clases (§22.3) donde el alumno no teclea nunca, y el
 *  armazón no puede imponer una cosa ni la otra. */
export interface RedaccionCorreo {
  borrador: BorradorCorreo;
  onCampo?: (campo: 'asunto' | 'cuerpo', valor: string) => void;
  onQuitarDestinatario?: (campo: 'para' | 'cc', direccion: string) => void;
  onQuitarAdjunto?: (adjuntoId: string) => void;
  onAdjuntar?: () => void;
  onEnviar?: () => void;
  onDescartar?: () => void;
  /** Aviso al pie de la ventana. Lo escribe la clase; el armazón no juzga. */
  aviso?: string;
  titulo?: string;
}

export interface VentanaCorreoProps {
  /** Cuáles se ven en la columna. Por omisión las cinco. */
  carpetas?: readonly CarpetaCorreo[];
  carpetaActiva: CarpetaCorreo;
  cuentas?: Record<CarpetaCorreo, ConteoCarpeta>;
  /** Los de la carpeta abierta. La clase los filtra con `enCarpeta()`. */
  mensajes: MensajeCorreo[];
  seleccionId?: string | null;
  abierto?: MensajeCorreo | null;
  /** Sustituye al panel de lectura de serie. El hueco opaco del canon. */
  lectura?: ReactNode;
  acciones?: AccionCorreo[];
  redaccion?: RedaccionCorreo | null;
  mostrarDireccion?: boolean;
  mostrarDestino?: boolean;
  /** Marca los adjuntos de tipo programa o guion. Apagado por omisión: el
   *  armazón no avisa de nada que la clase no le haya pedido. */
  avisarAdjuntos?: boolean;
  onCarpeta?: (carpeta: CarpetaCorreo) => void;
  onSeleccionar?: (id: string) => void;
  onAccion?: (accion: AccionCorreo, id: string) => void;
  onEnlace?: (enlace: EnlaceCorreo, id: string) => void;
  onAdjunto?: (adjunto: AdjuntoCorreo, id: string) => void;
  onRedactar?: () => void;
  vacio?: ReactNode;
  encabezado?: ReactNode;
  className?: string;
}

function Persona({ persona, conDireccion }: { persona: RemitenteCorreo; conDireccion: boolean }) {
  return (
    <span className="tc-persona">
      <span className="tc-persona-nombre">{persona.nombre}</span>
      {conDireccion && <span className="tc-persona-dir">&lt;{persona.direccion}&gt;</span>}
    </span>
  );
}

function Adjunto({
  adjunto,
  avisar,
  onClick,
  onQuitar,
}: {
  adjunto: AdjuntoCorreo;
  avisar: boolean;
  onClick?: () => void;
  onQuitar?: () => void;
}) {
  const peligroso = avisar && adjuntoPeligroso(adjunto);
  const cuerpo = (
    <>
      <span aria-hidden="true">{ICONO_ADJUNTO[tipoDeAdjunto(adjunto.nombre)]}</span>
      <span className="tc-adjunto-nombre">{adjunto.nombre}</span>
      <span className="tc-adjunto-peso">{pesoLegible(adjunto.kb)}</span>
      {peligroso && (
        <span className="tc-adjunto-alarma" data-testid="correo-adjunto-alarma">
          ⚠️ programa
        </span>
      )}
    </>
  );
  return (
    <span className="tc-adjunto-caja">
      {onClick ? (
        <button
          type="button"
          className={`tc-adjunto${peligroso ? ' es-peligroso' : ''}`}
          data-testid="correo-adjunto"
          data-adjunto={adjunto.id}
          onClick={onClick}
        >
          {cuerpo}
        </button>
      ) : (
        <span
          className={`tc-adjunto${peligroso ? ' es-peligroso' : ''}`}
          data-testid="correo-adjunto"
          data-adjunto={adjunto.id}
        >
          {cuerpo}
        </span>
      )}
      {onQuitar && (
        <button
          type="button"
          className="tc-adjunto-quitar"
          aria-label={`Quitar ${adjunto.nombre}`}
          onClick={onQuitar}
        >
          ✕
        </button>
      )}
    </span>
  );
}

function PanelLectura({
  mensaje,
  acciones,
  mostrarDireccion,
  mostrarDestino,
  avisarAdjuntos,
  onAccion,
  onEnlace,
  onAdjunto,
}: {
  mensaje: MensajeCorreo;
  acciones: AccionCorreo[];
  mostrarDireccion: boolean;
  mostrarDestino: boolean;
  avisarAdjuntos: boolean;
  onAccion?: (accion: AccionCorreo, id: string) => void;
  onEnlace?: (enlace: EnlaceCorreo, id: string) => void;
  onAdjunto?: (adjunto: AdjuntoCorreo, id: string) => void;
}) {
  return (
    <article className="tc-lectura" data-testid="correo-lectura" data-mensaje={mensaje.id}>
      <h3 className="tc-lectura-asunto">{mensaje.asunto}</h3>

      <div className="tc-cabecera">
        <p className="tc-campo" data-campo="de">
          <span className="tc-campo-eti">De</span>
          <Persona persona={mensaje.de} conDireccion={mostrarDireccion} />
          <span className="tc-campo-fecha">{mensaje.fecha}</span>
        </p>
        <p className="tc-campo" data-campo="para">
          <span className="tc-campo-eti">Para</span>
          {mensaje.para.length === 0 ? (
            <span className="tc-campo-vacio">(nadie)</span>
          ) : (
            mensaje.para.map((p) => <Persona key={p.direccion} persona={p} conDireccion={mostrarDireccion} />)
          )}
        </p>
        {mensaje.cc.length > 0 && (
          <p className="tc-campo" data-campo="cc">
            <span className="tc-campo-eti">CC</span>
            {mensaje.cc.map((p) => (
              <Persona key={p.direccion} persona={p} conDireccion={mostrarDireccion} />
            ))}
          </p>
        )}
      </div>

      {acciones.length > 0 && (
        <div className="tc-acciones" data-testid="correo-acciones">
          {acciones.map((a) => {
            const meta = ETIQUETA_ACCION[a];
            const activa = a === 'marcar' && mensaje.marcado;
            return (
              <button
                key={a}
                type="button"
                className={`tc-accion es-${a}${activa ? ' es-activa' : ''}`}
                data-accion={a}
                aria-pressed={a === 'marcar' ? mensaje.marcado : undefined}
                onClick={() => onAccion?.(a, mensaje.id)}
              >
                <span aria-hidden="true">{meta.icono}</span> {meta.etiqueta}
              </button>
            );
          })}
        </div>
      )}

      <div className="tc-cuerpo" data-testid="correo-cuerpo">
        {mensaje.cuerpo.map((p, i) => (
          <p key={`${i}-${p}`} className={`tc-parrafo${p.startsWith('>') ? ' es-cita' : ''}`}>
            {p}
          </p>
        ))}
      </div>

      {mensaje.enlaces.length > 0 && (
        <div className="tc-enlaces" data-testid="correo-enlaces">
          {mensaje.enlaces.map((e) => (
            <button
              key={`${e.texto}|${e.destino}`}
              type="button"
              className="tc-enlace"
              data-testid="correo-enlace"
              onClick={() => onEnlace?.(e, mensaje.id)}
            >
              <span className="tc-enlace-texto">{e.texto}</span>
              {mostrarDestino && (
                <span className="tc-enlace-destino" data-testid="correo-enlace-destino">
                  → {e.destino}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {mensaje.adjuntos.length > 0 && (
        <div className="tc-adjuntos" data-testid="correo-adjuntos">
          {mensaje.adjuntos.map((a) => (
            <Adjunto
              key={a.id}
              adjunto={a}
              avisar={avisarAdjuntos}
              onClick={onAdjunto ? () => onAdjunto(a, mensaje.id) : undefined}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function VentanaRedaccion({ redaccion }: { redaccion: RedaccionCorreo }) {
  const { borrador, onCampo, onQuitarDestinatario, onQuitarAdjunto, onAdjuntar, onEnviar, onDescartar } = redaccion;

  const listaPersonas = (campo: 'para' | 'cc', gente: RemitenteCorreo[]) => (
    <p className="tc-red-campo" data-campo={campo}>
      <span className="tc-campo-eti">{campo === 'para' ? 'Para' : 'CC'}</span>
      {gente.length === 0 ? (
        <span className="tc-campo-vacio">(vacío)</span>
      ) : (
        gente.map((p) => (
          <span key={p.direccion} className="tc-ficha" data-testid="correo-ficha">
            {p.nombre}
            <span className="tc-ficha-dir">{p.direccion}</span>
            {onQuitarDestinatario && (
              <button
                type="button"
                className="tc-ficha-quitar"
                aria-label={`Quitar a ${p.nombre}`}
                onClick={() => onQuitarDestinatario(campo, p.direccion)}
              >
                ✕
              </button>
            )}
          </span>
        ))
      )}
    </p>
  );

  return (
    <div className="tc-redaccion" data-testid="correo-redaccion" data-origen={borrador.origen}>
      <div className="tc-red-barra">
        <span className="tc-red-titulo">{redaccion.titulo ?? 'Mensaje nuevo'}</span>
        {onDescartar && (
          <button type="button" className="tc-red-cerrar" aria-label="Descartar borrador" onClick={onDescartar}>
            ✕
          </button>
        )}
      </div>

      <div className="tc-red-cuerpo">
        {listaPersonas('para', borrador.para)}
        {listaPersonas('cc', borrador.cc)}

        <p className="tc-red-campo" data-campo="asunto">
          <span className="tc-campo-eti">Asunto</span>
          {onCampo ? (
            <input
              type="text"
              className="tc-red-cuadro"
              data-testid="correo-asunto"
              aria-label="Asunto"
              value={borrador.asunto}
              onChange={(e) => onCampo('asunto', e.target.value)}
            />
          ) : (
            <span className="tc-red-valor">{borrador.asunto || <span className="tc-campo-vacio">(sin asunto)</span>}</span>
          )}
        </p>

        {onCampo ? (
          <textarea
            className="tc-red-mensaje"
            data-testid="correo-mensaje"
            aria-label="Mensaje"
            value={borrador.cuerpo.join('\n')}
            onChange={(e) => onCampo('cuerpo', e.target.value)}
          />
        ) : (
          <div className="tc-red-mensaje es-fijo" data-testid="correo-mensaje">
            {borrador.cuerpo.map((p, i) => (
              <p key={`${i}-${p}`} className={`tc-parrafo${p.startsWith('>') ? ' es-cita' : ''}`}>
                {p}
              </p>
            ))}
          </div>
        )}

        {borrador.adjuntos.length > 0 && (
          <div className="tc-adjuntos" data-testid="correo-red-adjuntos">
            {borrador.adjuntos.map((a) => (
              <Adjunto
                key={a.id}
                adjunto={a}
                avisar={false}
                onQuitar={onQuitarAdjunto ? () => onQuitarAdjunto(a.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <div className="tc-red-pie">
        {onAdjuntar && (
          <button type="button" className="tc-red-clip" onClick={onAdjuntar}>
            📎 Adjuntar
          </button>
        )}
        {redaccion.aviso && (
          <span className="tc-red-aviso" data-testid="correo-red-aviso">
            {redaccion.aviso}
          </span>
        )}
        {onEnviar && (
          <button type="button" className="tc-red-enviar" data-testid="correo-enviar" onClick={onEnviar}>
            Enviar
          </button>
        )}
      </div>
    </div>
  );
}

export function VentanaCorreo({
  carpetas = CARPETAS,
  carpetaActiva,
  cuentas,
  mensajes,
  seleccionId = null,
  abierto = null,
  lectura,
  acciones = [],
  redaccion = null,
  mostrarDireccion = false,
  mostrarDestino = false,
  avisarAdjuntos = false,
  onCarpeta,
  onSeleccionar,
  onAccion,
  onEnlace,
  onAdjunto,
  onRedactar,
  vacio,
  encabezado,
  className,
}: VentanaCorreoProps) {
  return (
    <div className={`tc${className ? ` ${className}` : ''}`} data-testid="correo-app">
      {encabezado}

      <div className="tc-marco">
        <nav className="tc-carpetas" data-testid="correo-carpetas" aria-label="Carpetas">
          {onRedactar && (
            <button type="button" className="tc-redactar" data-testid="correo-redactar" onClick={onRedactar}>
              ✉️ Redactar
            </button>
          )}
          {carpetas.map((c) => {
            const meta = ETIQUETA_CARPETA[c];
            const cuenta = cuentas?.[c];
            return (
              <button
                key={c}
                type="button"
                className={`tc-carpeta${c === carpetaActiva ? ' es-activa' : ''}`}
                data-carpeta={c}
                aria-current={c === carpetaActiva ? 'true' : undefined}
                disabled={!onCarpeta}
                onClick={() => onCarpeta?.(c)}
              >
                <span aria-hidden="true">{meta.icono}</span>
                <span className="tc-carpeta-txt">{meta.etiqueta}</span>
                {cuenta && cuenta.total > 0 && (
                  <span className={`tc-carpeta-n${cuenta.sinLeer > 0 ? ' es-nuevo' : ''}`} data-testid="correo-cuenta">
                    {cuenta.sinLeer > 0 ? cuenta.sinLeer : cuenta.total}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="tc-lista" data-testid="correo-lista">
          <p className="tc-lista-tit">{ETIQUETA_CARPETA[carpetaActiva].etiqueta}</p>
          {mensajes.length === 0 ? (
            <p className="tc-vacio">{vacio ?? 'Esta carpeta está vacía.'}</p>
          ) : (
            mensajes.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`tc-fila${m.id === seleccionId ? ' es-abierta' : ''}${m.leido ? '' : ' es-sin-leer'}`}
                data-testid="correo-fila"
                data-mensaje={m.id}
                disabled={!onSeleccionar}
                onClick={() => onSeleccionar?.(m.id)}
              >
                <span className={`tc-fila-punto${m.leido ? ' es-leido' : ''}`} aria-hidden="true" />
                {/* Sólo el NOMBRE, como un cliente de verdad: ahí empieza el engaño. */}
                <span className="tc-fila-de">{m.de.nombre}</span>
                <span className="tc-fila-asunto">{m.asunto}</span>
                <span className="tc-fila-marcas">
                  {m.marcado && <span aria-label="Marcado">⭐</span>}
                  {m.adjuntos.length > 0 && <span aria-label="Con adjunto">📎</span>}
                </span>
                <span className="tc-fila-fecha">{m.fecha}</span>
              </button>
            ))
          )}
        </div>

        <div className="tc-panel">
          {lectura ??
            (abierto ? (
              <PanelLectura
                mensaje={abierto}
                acciones={acciones}
                mostrarDireccion={mostrarDireccion}
                mostrarDestino={mostrarDestino}
                avisarAdjuntos={avisarAdjuntos}
                onAccion={onAccion}
                onEnlace={onEnlace}
                onAdjunto={onAdjunto}
              />
            ) : (
              <p className="tc-vacio">Elige un correo de la lista para leerlo.</p>
            ))}
        </div>
      </div>

      {redaccion && <VentanaRedaccion redaccion={redaccion} />}
    </div>
  );
}

export default VentanaCorreo;
