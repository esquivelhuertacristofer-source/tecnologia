'use client';

import type { ReactNode } from 'react';
import { Send, ShieldAlert, Sparkles, SkipForward } from 'lucide-react';
import {
  repartirRevelado,
  estaCompleto,
  type FichaPrompt,
  type MensajeIA,
} from './guionAsistente';
import './ventanaAsistente.css';

/**
 * TECNIA ASISTENTE · LA VENTANA
 *
 * El contenido de un chat de asistente de IA: hilo de burbujas, compositor y
 * el hueco donde la clase mete lo suyo. **Cero `useState`**: todo entra por
 * parámetro, como en `VentanaHojas`. Quien tiene el estado es `useAsistente`.
 *
 * ── Dónde encaja `VentanaBase` ────────────────────────────────────────────
 *
 * Aquí NO se dibuja el marco: ni barra de título, ni botón de cerrar, ni
 * barra de estado, ni la pantalla de arranque. Otro agente está extrayendo
 * `VentanaBase` (destino: `src/components/labs/ventana/VentanaBase.tsx`) y
 * este componente es su CONTENIDO. Cuando aterrice, la clase escribirá:
 *
 *     <VentanaBase marca="Tecnia Asistente" subtitulo="Asistente de IA">
 *       <VentanaAsistente ... />
 *     </VentanaBase>
 *
 * Mientras tanto, el hueco `encabezado` acepta lo que la clase quiera poner
 * arriba —y es exactamente el sitio donde entrará la barra de `VentanaBase`
 * sin tocar una línea de aquí.
 *
 * ── Lo que este componente NO hace, y no debe hacer nunca ─────────────────
 *
 * No pinta preguntas de opción múltiple, ni marcadores, ni pantallas de
 * cierre, ni insignias. Eso son ejercicios, y un componente que pinta
 * ejercicios genéricos es un motor de plantillas — rechazados en este
 * proyecto. Las 16 clases se diferencian en `panel`: banco de entrenamiento,
 * comparador, generador con marca, cuaderno de prompts y panel de decisión.
 *
 * ── La verdad no llega al DOM ─────────────────────────────────────────────
 *
 * `veracidad` viaja en los datos y **no se pinta**: ni en una clase, ni en un
 * `data-`, ni en el orden. Lo único que se pinta de un trozo es su `marca`,
 * que mueve la actividad cuando ella decide. Si esto se rompiera, un alumno
 * vería la respuesta falsa marcada antes de buscarla, que es justo la clase
 * que se está dando.
 */

export interface AccionAsistente {
  id: string;
  etiqueta: string;
  onClick: () => void;
  deshabilitada?: boolean;
  /** La que arrastra la vista: se pinta llena, no de contorno. */
  principal?: boolean;
}

export interface CompositorAsistente {
  titulo?: string;
  fichas?: FichaPrompt[];
  onEnviarFicha?: (id: string) => void;
  /**
   * Entrada libre. **Apagada por omisión**: el compositor normal es de fichas.
   * La encienden sólo las clases que enseñan a ESCRIBIR el prompt
   * (`n7-buenos-prompts`, `n10-flujos-con-ia`, `of-m365-copiloto`). Lo que se
   * escriba aquí no sale de la máquina: lo resuelve `resolverGuion`, que sólo
   * devuelve respuestas ya escritas en el guion.
   */
  libre?: {
    valor: string;
    onCambiar: (v: string) => void;
    onEnviar: () => void;
    marcador?: string;
    maxLargo?: number;
    /** La rúbrica en vivo, las pistas: lo que la clase quiera bajo el cuadro. */
    ayuda?: ReactNode;
  };
  deshabilitado?: boolean;
}

export interface VentanaAsistenteProps {
  mensajes: MensajeIA[];
  /** «escribiendo…» y el botón de saltárselo. Normalmente `asistente.ocupado`. */
  escribiendo?: boolean;
  onSaltarTecleo?: () => void;
  /** Qué se lee con el hilo vacío. */
  vacio?: ReactNode;
  compositor?: CompositorAsistente;
  /** ← AQUÍ divergen las 16 clases. */
  panel?: ReactNode;
  acciones?: AccionAsistente[];
  onTocarParte?: (id: string) => void;
  parteActiva?: string | null;
  /** El hueco de `VentanaBase`; ver la cabecera. */
  encabezado?: ReactNode;
  className?: string;
}

function Burbuja({
  mensaje,
  onTocarParte,
  parteActiva,
}: {
  mensaje: MensajeIA;
  onTocarParte?: (id: string) => void;
  parteActiva?: string | null;
}) {
  const completo = estaCompleto(mensaje);
  const comunes = {
    'data-testid': 'asis-msg',
    'data-tipo': mensaje.tipo,
    'data-msg': mensaje.id,
    'data-tecleando': completo ? undefined : 'si',
  };

  if (mensaje.tipo === 'usuario') {
    return (
      <div className="asis-msg asis-msg-tu" {...comunes}>
        {mensaje.texto}
      </div>
    );
  }

  if (mensaje.tipo === 'aviso') {
    return (
      <div className="asis-msg asis-msg-aviso" {...comunes}>
        <ShieldAlert className="asis-msg-icono" aria-hidden="true" />
        <span>{mensaje.texto.slice(0, mensaje.revelado)}</span>
        {!completo && <span className="asis-cursor" aria-hidden="true" />}
      </div>
    );
  }

  if (mensaje.tipo === 'asistente-troceado') {
    const trozos = repartirRevelado(mensaje.partes, mensaje.revelado);
    return (
      <div className="asis-msg asis-msg-ia asis-msg-troceado" {...comunes}>
        <span className="asis-msg-firma" aria-hidden="true">
          <Sparkles className="asis-msg-icono" />
        </span>
        <div className="asis-partes">
          {mensaje.partes.map((parte, i) => {
            const visible = trozos[i];
            if (visible.length === 0) return null;
            /* Ni una clase ni un `data-` salen de `parte.veracidad`. */
            const atributos = {
              className: 'asis-parte',
              'data-parte': parte.id,
              'data-marca': parte.marca,
            };
            return onTocarParte ? (
              <button
                key={parte.id}
                type="button"
                {...atributos}
                aria-pressed={parteActiva === parte.id}
                onClick={() => onTocarParte(parte.id)}
              >
                {visible}
              </button>
            ) : (
              <span key={parte.id} {...atributos}>
                {visible}
              </span>
            );
          })}
          {!completo && <span className="asis-cursor" aria-hidden="true" />}
        </div>
      </div>
    );
  }

  return (
    <div className="asis-msg asis-msg-ia" {...comunes}>
      <span className="asis-msg-firma" aria-hidden="true">
        <Sparkles className="asis-msg-icono" />
      </span>
      <span>{mensaje.texto.slice(0, mensaje.revelado)}</span>
      {!completo && <span className="asis-cursor" aria-hidden="true" />}
    </div>
  );
}

export function VentanaAsistente({
  mensajes,
  escribiendo = false,
  onSaltarTecleo,
  vacio,
  compositor,
  panel,
  acciones,
  onTocarParte,
  parteActiva = null,
  encabezado,
  className,
}: VentanaAsistenteProps) {
  const libre = compositor?.libre;
  const bloqueado = compositor?.deshabilitado ?? false;
  const puedeEnviarLibre = !bloqueado && (libre?.valor.trim() ?? '') !== '';

  return (
    <div className={`asis${className ? ` ${className}` : ''}`} data-testid="asis">
      {encabezado}

      <div className="asis-cuerpo">
        <div className="asis-hilo" data-testid="asis-hilo" aria-live="polite">
          {mensajes.length === 0 && <p className="asis-hilo-vacio">{vacio}</p>}
          {mensajes.map((m) => (
            <Burbuja key={m.id} mensaje={m} onTocarParte={onTocarParte} parteActiva={parteActiva} />
          ))}

          {escribiendo && (
            <div className="asis-escribiendo" data-testid="asis-escribiendo">
              <span className="asis-puntos" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="asis-escribiendo-texto">escribiendo…</span>
              {onSaltarTecleo && (
                <button
                  type="button"
                  className="asis-saltar"
                  onClick={onSaltarTecleo}
                  data-testid="asis-saltar"
                >
                  <SkipForward className="asis-msg-icono" aria-hidden="true" />
                  Saltar
                </button>
              )}
            </div>
          )}
        </div>

        {panel && (
          <aside className="asis-panel" data-testid="asis-panel">
            {panel}
          </aside>
        )}
      </div>

      {compositor && (
        <div className="asis-compositor" data-testid="asis-compositor">
          {compositor.titulo && <p className="asis-compositor-titulo">{compositor.titulo}</p>}

          {compositor.fichas && compositor.fichas.length > 0 && (
            <div className="asis-fichas">
              {compositor.fichas.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`asis-ficha${f.usada ? ' es-usada' : ''}`}
                  data-ficha={f.id}
                  disabled={bloqueado || f.usada || f.deshabilitada}
                  onClick={() => compositor.onEnviarFicha?.(f.id)}
                >
                  {f.icono && <span className="asis-ficha-icono" aria-hidden="true">{f.icono}</span>}
                  {f.etiqueta}
                  <Send className="asis-ficha-enviar" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}

          {libre && (
            <form
              className="asis-libre"
              onSubmit={(e) => {
                e.preventDefault();
                if (puedeEnviarLibre) libre.onEnviar();
              }}
            >
              <input
                type="text"
                className="asis-libre-cuadro"
                data-testid="asis-libre"
                value={libre.valor}
                maxLength={libre.maxLargo}
                placeholder={libre.marcador ?? 'Escribe aquí tu pregunta…'}
                aria-label="Escribe tu pregunta al asistente"
                disabled={bloqueado}
                onChange={(e) => libre.onCambiar(e.target.value)}
              />
              <button
                type="submit"
                className="asis-libre-enviar"
                data-testid="asis-enviar"
                disabled={!puedeEnviarLibre}
                aria-label="Enviar"
              >
                <Send className="asis-msg-icono" aria-hidden="true" />
              </button>
            </form>
          )}

          {libre?.ayuda && <div className="asis-libre-ayuda">{libre.ayuda}</div>}
        </div>
      )}

      {acciones && acciones.length > 0 && (
        <div className="asis-acciones">
          {acciones.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`asis-accion${a.principal ? ' es-principal' : ''}`}
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

export default VentanaAsistente;
