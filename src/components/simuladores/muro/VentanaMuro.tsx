'use client';

import type { ReactNode } from 'react';
import { barajadas } from '@/lib/ordenDeOpciones';
import type { AccionMuro, AutorMuro, EvidenciaMuro, MotivoReporte, PerfilMuro, PublicacionMuro, Visibilidad } from './tiposMuro';
import './ventanaMuro.css';

/**
 * TECNIA MURO · LA VENTANA
 *
 * El muro social: tarjetas de publicación con cabecera, imagen, métricas y
 * acciones; y la vista de perfil. **Cero `useState`**: todo entra por
 * parámetro, como `VentanaAsistente` y `VentanaHojas`. Quien tiene el estado
 * es `useMuro`.
 *
 * No pinta el marco de programa (barra de título, botón de encender): eso
 * es `VentanaBase`. Una clase monta:
 *
 *     <VentanaBase marca="Tecnia Muro" subtitulo="…">
 *       <VentanaMuro vista="muro" publicaciones={...} ... />
 *     </VentanaBase>
 *
 * ── Lo que este componente NO hace ──────────────────────────────────────────
 *
 * No decide qué acciones tiene una publicación (pinta sólo las que trae
 * `publicacion.acciones`); no decide qué es un acierto; no filtra por
 * visibilidad (eso lo hace la actividad con `visibles()` antes de pasarle el
 * arreglo). Sin `compositor` ni `acciones` en los datos, esta ventana no
 * ofrece NI UN control — no es un motor de plantillas.
 *
 * ── «Borrar no borra», también en la UI ─────────────────────────────────────
 *
 * Una publicación con `borrada: true` se pinta como una tarjeta fantasma:
 * sin texto, sin imagen, sin botones de acción (el hook ya los rechazaría,
 * pero aquí ni se ofrecen) — y, si trae `copiasSobrevivientes`, la lista de
 * lo que sobrevivió. Es la misma decisión de datos hecha visible.
 */

const ETIQUETA_VISIBILIDAD: Record<Visibilidad, { icono: string; etiqueta: string }> = {
  publico: { icono: '🌐', etiqueta: 'Público' },
  amigos: { icono: '👥', etiqueta: 'Sólo amigos' },
  'solo-yo': { icono: '🔒', etiqueta: 'Sólo yo' },
};

const ETIQUETA_ACCION: Record<AccionMuro, { icono: string; etiqueta: string }> = {
  'me-gusta': { icono: '❤️', etiqueta: 'Me gusta' },
  comentar: { icono: '💬', etiqueta: 'Comentar' },
  compartir: { icono: '🔁', etiqueta: 'Compartir' },
  reportar: { icono: '🚩', etiqueta: 'Reportar' },
  borrar: { icono: '🗑️', etiqueta: 'Borrar' },
  capturar: { icono: '📸', etiqueta: 'Captura' },
};

/** §69.1 · Los cuatro motivos, en el lenguaje de una red social de verdad. */
export const ETIQUETA_MOTIVO: Record<MotivoReporte, string> = {
  'no-me-gusta': 'No me gusta',
  spam: 'Es spam',
  acoso: 'Acoso o burlas',
  falso: 'Información falsa',
  'datos-personales': 'Me pide datos personales',
};
/** Los que salen si la clase no pide otros (los de §69.1). */
const MOTIVOS_POR_DEFECTO: MotivoReporte[] = ['no-me-gusta', 'spam', 'acoso', 'falso'];

/** §69.1 · El reporte que el alumno está llenando: se pinta bajo lo reportado. */
export interface ReporteEnCurso {
  publicacionId: string;
  /** Si falta, se reporta la publicación entera. */
  comentarioId?: string;
  onMotivo: (motivo: MotivoReporte) => void;
  onCancelar: () => void;
}

function ElegirMotivo({ reporte, motivos = MOTIVOS_POR_DEFECTO }: { reporte: ReporteEnCurso; motivos?: MotivoReporte[] }) {
  return (
    <div className="tm-reporte" data-testid="muro-reporte" role="group" aria-label="¿Por qué lo reportas?">
      <p className="tm-reporte-titulo">¿Por qué lo reportas?</p>
      <div className="tm-reporte-motivos">
        {barajadas(motivos, `${reporte.publicacionId}:${reporte.comentarioId ?? ''}`).map(([m]) => (
          <button key={m} type="button" className="tm-reporte-motivo" data-motivo={m} onClick={() => reporte.onMotivo(m)}>
            {ETIQUETA_MOTIVO[m]}
          </button>
        ))}
      </div>
      <button type="button" className="tm-reporte-cancelar" onClick={reporte.onCancelar}>
        Cancelar
      </button>
    </div>
  );
}

export interface CompositorMuro {
  valor: string;
  onCambiar: (v: string) => void;
  onPublicar: () => void;
  marcador?: string;
  maxLargo?: number;
  deshabilitado?: boolean;
  /** §69.2 · La audiencia se elige ANTES de publicar: el selector junto a «Publicar». */
  visibilidad?: { valor: Visibilidad; onCambiar: (v: Visibilidad) => void };
}

/** El compositor de un comentario, controlado por la actividad — igual que
 *  `compositor.libre` en `VentanaAsistente`. Sólo se pinta bajo la
 *  publicación cuya `publicacionId` coincide. */
export interface ComentarioEnCurso {
  publicacionId: string;
  valor: string;
  onCambiar: (v: string) => void;
  onEnviar: () => void;
  marcador?: string;
}

export interface VentanaMuroProps {
  vista?: 'muro' | 'perfil';
  publicaciones?: PublicacionMuro[];
  perfil?: PerfilMuro;
  compositor?: CompositorMuro;
  comentando?: ComentarioEnCurso | null;
  onAccion?: (accion: AccionMuro, id: string) => void;
  onAbrirPerfil?: (autor: AutorMuro) => void;
  /**
   * §69.1 · Si llega, cada comentario ofrece «Captura» y «Reportar». Sin él,
   * los comentarios se pintan como siempre (sin controles).
   */
  onComentario?: (accion: 'capturar' | 'reportar', publicacionId: string, comentarioId: string) => void;
  /** §69.1 · El reporte en curso (elige el motivo). */
  reporte?: ReporteEnCurso | null;
  /** §69.1 · Las capturas tomadas: lo capturado lleva su marca «📸 Guardada». */
  evidencias?: EvidenciaMuro[];
  /** §69.2 · Qué motivos ofrece el reporte. Por omisión, los cuatro de §69.1. */
  motivos?: MotivoReporte[];
  /**
   * §69.2 · Si llega, las publicaciones PROPIAS del alumno pintan su audiencia
   * como un selector (donde se cambia en una red de verdad), no como etiqueta.
   */
  onVisibilidad?: (id: string, v: Visibilidad) => void;
  /** §69.1 · En la vista de perfil: el botón de bloquear o desbloquear a esa persona. */
  bloqueo?: { bloqueado: boolean; onBloquear: () => void; onDesbloquear: () => void } | null;
  /** Qué se lee con el muro (o el perfil) vacío. */
  vacio?: ReactNode;
  /** El hueco de `VentanaBase`, si la clase no envuelve con ella. */
  encabezado?: ReactNode;
  className?: string;
}

function Tarjeta({
  publicacion,
  comentando,
  onAccion,
  onAbrirPerfil,
  onComentario,
  reporte,
  evidencias = [],
  motivos,
  onVisibilidad,
}: {
  publicacion: PublicacionMuro;
  comentando?: ComentarioEnCurso | null;
  onAccion?: (accion: AccionMuro, id: string) => void;
  onAbrirPerfil?: (autor: AutorMuro) => void;
  onComentario?: VentanaMuroProps['onComentario'];
  reporte?: ReporteEnCurso | null;
  evidencias?: EvidenciaMuro[];
  motivos?: MotivoReporte[];
  onVisibilidad?: VentanaMuroProps['onVisibilidad'];
}) {
  const capturada = (comentarioId?: string) =>
    evidencias.some((e) => e.publicacionId === publicacion.id && e.comentarioId === comentarioId);
  const reporteAqui = (comentarioId?: string) =>
    reporte && reporte.publicacionId === publicacion.id && reporte.comentarioId === comentarioId ? reporte : null;
  const vis = ETIQUETA_VISIBILIDAD[publicacion.visibilidad];
  const comentarioAqui = comentando && comentando.publicacionId === publicacion.id ? comentando : null;

  return (
    <article
      className={`tm-tarjeta${publicacion.borrada ? ' es-borrada' : ''}`}
      data-testid="muro-post"
      data-post={publicacion.id}
      data-borrada={publicacion.borrada ? 'si' : undefined}
      aria-label={`Publicación de ${publicacion.autor.nombre}`}
    >
      <header className="tm-cabecera">
        {onAbrirPerfil ? (
          <button
            type="button"
            className="tm-avatar"
            onClick={() => onAbrirPerfil(publicacion.autor)}
            aria-label={`Abrir perfil de ${publicacion.autor.nombre}`}
          >
            {publicacion.autor.avatar ?? publicacion.autor.nombre.charAt(0)}
          </button>
        ) : (
          <span className="tm-avatar" aria-hidden="true">
            {publicacion.autor.avatar ?? publicacion.autor.nombre.charAt(0)}
          </span>
        )}
        <div className="tm-cabecera-textos">
          <span className="tm-cabecera-nombre">
            {publicacion.autor.nombre}
            {publicacion.autor.verificado && (
              <span className="tm-verificada" title="Cuenta verificada" aria-label="Cuenta verificada">
                ✔️
              </span>
            )}
          </span>
          <span className="tm-cabecera-meta">
            {publicacion.autor.usuario && <>{publicacion.autor.usuario} · </>}
            {publicacion.fecha} ·{' '}
            {onVisibilidad && publicacion.autor.esAlumno && !publicacion.borrada ? (
              <select
                className={`tm-visibilidad tm-visibilidad-selector es-${publicacion.visibilidad}`}
                data-testid="muro-visibilidad"
                data-post-vis={publicacion.id}
                aria-label="Quién puede ver esta publicación"
                value={publicacion.visibilidad}
                onChange={(e) => onVisibilidad(publicacion.id, e.target.value as Visibilidad)}
              >
                {(Object.keys(ETIQUETA_VISIBILIDAD) as Visibilidad[]).map((v) => (
                  <option key={v} value={v}>
                    {ETIQUETA_VISIBILIDAD[v].icono} {ETIQUETA_VISIBILIDAD[v].etiqueta}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`tm-visibilidad es-${publicacion.visibilidad}`} title={vis.etiqueta}>
                {vis.icono} {vis.etiqueta}
              </span>
            )}
          </span>
        </div>
      </header>

      {publicacion.borrada ? (
        <div className="tm-borrada" data-testid="muro-borrada">
          <p className="tm-borrada-aviso">🗑️ Esta publicación fue borrada de tu muro.</p>
          {publicacion.copiasSobrevivientes.length > 0 && (
            <div className="tm-copias" data-testid="muro-copias">
              <p className="tm-copias-titulo">Pero ya no era sólo tuya:</p>
              <ul>
                {publicacion.copiasSobrevivientes.map((c) => (
                  <li key={c.id}>{c.texto}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="tm-texto">{publicacion.texto}</p>

          {publicacion.imagen && (
            <div className="tm-imagen">
              <span className="tm-imagen-etiqueta">Marcador de imagen · sin archivo</span>
              <span className="tm-imagen-marco" aria-hidden="true" />
              <span className="tm-imagen-emoji" aria-hidden="true">
                {publicacion.imagen.emoji}
              </span>
              <p className="tm-imagen-desc">{publicacion.imagen.descripcion}</p>
            </div>
          )}

          <div className="tm-metricas">
            <span>❤️ {publicacion.meGusta}</span>
            <span>💬 {publicacion.comentarios.length}</span>
            <span>🔁 {publicacion.compartidos}</span>
          </div>

          {capturada() && <span className="tm-guardada" data-testid="muro-guardada">📸 Guardada en tus capturas</span>}
          {publicacion.motivoReporte && (
            <span className="tm-reportada" data-testid="muro-reportada">
              🚩 Reportaste esto: {ETIQUETA_MOTIVO[publicacion.motivoReporte]}
            </span>
          )}

          {publicacion.acciones.length > 0 && (
            <div className="tm-acciones">
              {publicacion.acciones.map((a) => {
                const meta = ETIQUETA_ACCION[a];
                const activo = a === 'me-gusta' && Boolean(publicacion.meGustaDelAlumno);
                return (
                  <button
                    key={a}
                    type="button"
                    className={`tm-accion es-${a}${activo ? ' es-activa' : ''}`}
                    data-accion={a}
                    aria-pressed={a === 'me-gusta' ? activo : undefined}
                    onClick={() => onAccion?.(a, publicacion.id)}
                  >
                    <span aria-hidden="true">{meta.icono}</span> {meta.etiqueta}
                  </button>
                );
              })}
            </div>
          )}

          {publicacion.comentarios.length > 0 && (
            <ul className="tm-comentarios" data-testid="muro-comentarios">
              {publicacion.comentarios.map((c) => {
                const r = reporteAqui(c.id);
                return (
                  <li key={c.id} className="tm-comentario" data-comentario={c.id}>
                    <div className="tm-comentario-linea">
                      {onAbrirPerfil && onComentario && !c.autor.esAlumno ? (
                        <button
                          type="button"
                          className="tm-comentario-autor tm-comentario-autor-boton"
                          onClick={() => onAbrirPerfil(c.autor)}
                          aria-label={`Abrir perfil de ${c.autor.nombre}`}
                        >
                          {c.autor.nombre}
                        </button>
                      ) : (
                        <span className="tm-comentario-autor">{c.autor.nombre}</span>
                      )}
                      <span className="tm-comentario-texto">{c.texto}</span>
                    </div>
                    {onComentario && !c.autor.esAlumno && (
                      <div className="tm-comentario-acciones">
                        {capturada(c.id) ? (
                          <span className="tm-guardada">📸 Guardada</span>
                        ) : (
                          <button
                            type="button"
                            className="tm-comentario-accion"
                            data-accion-comentario="capturar"
                            onClick={() => onComentario('capturar', publicacion.id, c.id)}
                          >
                            📸 Captura
                          </button>
                        )}
                        {c.motivoReporte ? (
                          <span className="tm-reportada">🚩 {ETIQUETA_MOTIVO[c.motivoReporte]}</span>
                        ) : null}
                        <button
                          type="button"
                          className="tm-comentario-accion"
                          data-accion-comentario="reportar"
                          onClick={() => onComentario('reportar', publicacion.id, c.id)}
                        >
                          🚩 {c.motivoReporte ? 'Reportar otra vez' : 'Reportar'}
                        </button>
                      </div>
                    )}
                    {r && <ElegirMotivo reporte={r} motivos={motivos} />}
                  </li>
                );
              })}
            </ul>
          )}

          {reporteAqui(undefined) && <ElegirMotivo reporte={reporteAqui(undefined) as ReporteEnCurso} motivos={motivos} />}

          {comentarioAqui && (
            <form
              className="tm-comentar"
              onSubmit={(e) => {
                e.preventDefault();
                comentarioAqui.onEnviar();
              }}
            >
              <input
                type="text"
                className="tm-comentar-cuadro"
                data-testid="muro-comentar-cuadro"
                value={comentarioAqui.valor}
                placeholder={comentarioAqui.marcador ?? 'Escribe un comentario…'}
                aria-label="Escribe un comentario"
                onChange={(e) => comentarioAqui.onCambiar(e.target.value)}
              />
              <button type="submit" className="tm-comentar-enviar" data-testid="muro-comentar-enviar">
                Enviar
              </button>
            </form>
          )}
        </>
      )}
    </article>
  );
}

export function VentanaMuro({
  vista = 'muro',
  publicaciones = [],
  perfil,
  compositor,
  comentando = null,
  onAccion,
  onAbrirPerfil,
  onComentario,
  reporte = null,
  evidencias,
  bloqueo = null,
  motivos,
  onVisibilidad,
  vacio,
  encabezado,
  className,
}: VentanaMuroProps) {
  const extra = { onComentario, reporte, evidencias, motivos, onVisibilidad };
  const puedePublicar = !compositor?.deshabilitado && (compositor?.valor.trim() ?? '') !== '';

  if (vista === 'perfil') {
    return (
      <div className={`tm${className ? ` ${className}` : ''}`} data-testid="muro-app">
        {encabezado}
        <div className="tm-perfil" data-testid="muro-perfil">
          {perfil ? (
            <>
              <header className="tm-perfil-cabecera">
                <span className="tm-avatar tm-avatar-grande" aria-hidden="true">
                  {perfil.autor.avatar ?? perfil.autor.nombre.charAt(0)}
                </span>
                <div>
                  <p className="tm-perfil-nombre">
                    {perfil.autor.nombre}
                    {perfil.autor.verificado && (
                      <span className="tm-verificada" aria-label="Cuenta verificada">
                        ✔️
                      </span>
                    )}
                  </p>
                  {perfil.autor.usuario && <p className="tm-perfil-usuario">{perfil.autor.usuario}</p>}
                  {perfil.bio && <p className="tm-perfil-bio">{perfil.bio}</p>}
                </div>
                {bloqueo && (
                  <button
                    type="button"
                    className="tm-perfil-bloquear"
                    data-testid="muro-bloquear"
                    data-bloqueado={bloqueo.bloqueado ? 'si' : 'no'}
                    onClick={bloqueo.bloqueado ? bloqueo.onDesbloquear : bloqueo.onBloquear}
                  >
                    {bloqueo.bloqueado ? `Desbloquear a ${perfil.autor.nombre}` : `🚫 Bloquear a ${perfil.autor.nombre}`}
                  </button>
                )}
              </header>

              {perfil.pistas.length > 0 && (
                <div className="tm-perfil-pistas" data-testid="muro-perfil-pistas">
                  <p className="tm-perfil-pistas-titulo">Lo que se sabe de esta cuenta por lo que publicó</p>
                  <ul>
                    {perfil.pistas.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="tm-perfil-publicaciones">
                {perfil.publicaciones.length === 0 ? (
                  <p className="tm-vacio">{vacio ?? 'Todavía no hay nada publicado aquí.'}</p>
                ) : (
                  perfil.publicaciones.map((p) => (
                    <Tarjeta
                      key={p.id}
                      publicacion={p}
                      comentando={comentando}
                      onAccion={onAccion}
                      onAbrirPerfil={onAbrirPerfil}
                      {...extra}
                    />
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="tm-vacio">{vacio ?? 'No hay perfil que mostrar.'}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`tm${className ? ` ${className}` : ''}`} data-testid="muro-app">
      {encabezado}

      {compositor && (
        <div className="tm-compositor" data-testid="muro-compositor">
          <textarea
            className="tm-compositor-cuadro"
            data-testid="muro-compositor-cuadro"
            value={compositor.valor}
            maxLength={compositor.maxLargo}
            placeholder={compositor.marcador ?? '¿Qué quieres publicar?'}
            aria-label="Escribe tu publicación"
            disabled={compositor.deshabilitado}
            onChange={(e) => compositor.onCambiar(e.target.value)}
          />
          {compositor.visibilidad && (
            <select
              className="tm-visibilidad tm-visibilidad-selector tm-compositor-audiencia"
              data-testid="muro-compositor-visibilidad"
              aria-label="Quién va a poder ver lo que publiques"
              value={compositor.visibilidad.valor}
              onChange={(e) => compositor.visibilidad?.onCambiar(e.target.value as Visibilidad)}
            >
              {(Object.keys(ETIQUETA_VISIBILIDAD) as Visibilidad[]).map((v) => (
                <option key={v} value={v}>
                  {ETIQUETA_VISIBILIDAD[v].icono} {ETIQUETA_VISIBILIDAD[v].etiqueta}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            className="tm-compositor-enviar"
            data-testid="muro-compositor-enviar"
            disabled={!puedePublicar}
            onClick={() => compositor.onPublicar()}
          >
            Publicar
          </button>
        </div>
      )}

      <div className="tm-muro" data-testid="muro-lista">
        {publicaciones.length === 0 ? (
          <p className="tm-vacio">{vacio ?? 'Todavía no hay nada en el muro.'}</p>
        ) : (
          publicaciones.map((p) => (
            <Tarjeta
              key={p.id}
              publicacion={p}
              comentando={comentando}
              onAccion={onAccion}
              onAbrirPerfil={onAbrirPerfil}
              {...extra}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default VentanaMuro;
