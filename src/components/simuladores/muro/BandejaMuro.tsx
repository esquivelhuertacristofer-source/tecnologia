'use client';

import type { ContactoMuro, EvidenciaMuro, MensajeMuro } from './tiposMuro';

/**
 * TECNIA MURO · LOS MENSAJES PRIVADOS (§69.1, 6-oct-2026)
 *
 * La bandeja de una red social: la lista de contactos a la izquierda, la
 * conversación abierta a la derecha, y debajo el cuadro para escribir con las
 * capturas que se pueden adjuntar. **Cero `useState`**, como `VentanaMuro`:
 * el borrador, los adjuntos marcados y la conversación abierta los guarda la
 * actividad; los mensajes, `useMuro`.
 *
 * La `relacion` de cada contacto NO se pinta: decidir quién es un adulto de
 * confianza es lo que la clase le pide al alumno.
 */
export interface BandejaMuroProps {
  contactos: ContactoMuro[];
  mensajes: MensajeMuro[];
  evidencias: EvidenciaMuro[];
  /** Ids de contactos bloqueados: se ven, pero no se les puede escribir. */
  bloqueados?: string[];
  abierta: string | null;
  onAbrir: (contactoId: string) => void;
  borrador: string;
  onCambiar: (texto: string) => void;
  adjuntos: string[];
  onAlternarAdjunto: (evidenciaId: string) => void;
  onEnviar: () => void;
}

export function BandejaMuro({
  contactos,
  mensajes,
  evidencias,
  bloqueados = [],
  abierta,
  onAbrir,
  borrador,
  onCambiar,
  adjuntos,
  onAlternarAdjunto,
  onEnviar,
}: BandejaMuroProps) {
  const contacto = contactos.find((c) => c.id === abierta) ?? null;
  const hilo = mensajes.filter((m) => m.conversacion === abierta);
  const bloqueado = contacto ? bloqueados.includes(contacto.id) : false;
  const puedeEnviar = Boolean(contacto) && !bloqueado && (borrador.trim() !== '' || adjuntos.length > 0);

  return (
    <div className="tm-bandeja" data-testid="muro-bandeja">
      <ul className="tm-bandeja-contactos" aria-label="Conversaciones">
        {contactos.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={`tm-bandeja-contacto${c.id === abierta ? ' es-abierta' : ''}`}
              data-contacto={c.id}
              aria-pressed={c.id === abierta}
              onClick={() => onAbrir(c.id)}
            >
              <span className="tm-avatar" aria-hidden="true">
                {c.avatar ?? c.nombre.charAt(0)}
              </span>
              <span>{c.nombre}</span>
              {bloqueados.includes(c.id) && <span className="tm-bandeja-bloq">bloqueado</span>}
            </button>
          </li>
        ))}
      </ul>

      <div className="tm-bandeja-hilo">
        {!contacto ? (
          <p className="tm-vacio">Elige con quién quieres hablar.</p>
        ) : (
          <>
            <p className="tm-bandeja-con">Conversación con {contacto.nombre}</p>
            <ul className="tm-bandeja-mensajes" data-testid="muro-mensajes">
              {hilo.map((m) => (
                <li key={m.id} className={`tm-mensaje${m.delAlumno ? ' es-mio' : ''}`}>
                  {m.texto && <span>{m.texto}</span>}
                  {m.adjuntos.map((a) => {
                    const e = evidencias.find((x) => x.id === a);
                    return e ? (
                      <span key={a} className="tm-mensaje-adjunto">
                        📸 {e.autor.nombre}: «{e.texto}»
                      </span>
                    ) : null;
                  })}
                </li>
              ))}
            </ul>

            {bloqueado ? (
              <p className="tm-bandeja-aviso">Bloqueaste a esta persona: no puedes escribirle.</p>
            ) : (
              <form
                className="tm-bandeja-escribir"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (puedeEnviar) onEnviar();
                }}
              >
                {evidencias.length > 0 && (
                  <fieldset className="tm-bandeja-adjuntar">
                    <legend>Adjuntar captura</legend>
                    {evidencias.map((e) => (
                      <label key={e.id} className="tm-bandeja-adjunto">
                        <input
                          type="checkbox"
                          data-evidencia={e.id}
                          checked={adjuntos.includes(e.id)}
                          onChange={() => onAlternarAdjunto(e.id)}
                        />
                        📸 {e.autor.nombre}: «{e.texto}»
                      </label>
                    ))}
                  </fieldset>
                )}
                <div className="tm-comentar">
                  <input
                    type="text"
                    className="tm-comentar-cuadro"
                    data-testid="muro-mensaje-cuadro"
                    value={borrador}
                    placeholder={`Escríbele a ${contacto.nombre}…`}
                    aria-label={`Escríbele a ${contacto.nombre}`}
                    onChange={(e) => onCambiar(e.target.value)}
                  />
                  <button type="submit" className="tm-comentar-enviar" data-testid="muro-mensaje-enviar" disabled={!puedeEnviar}>
                    Enviar
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BandejaMuro;
