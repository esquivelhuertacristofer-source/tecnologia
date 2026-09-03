'use client';

import type { ReactNode } from 'react';
import {
  estadoSeguridad,
  type Descarga,
  type EntradaHistorial,
  type EstadoSeguridad,
  type Marcador,
  type PaginaWeb,
  type VentanaEmergente,
} from './tiposNavegador';
import './ventanaNavegador.css';

/**
 * TECNIA NAVEGADOR · LA VENTANA
 *
 * El navegador: pestañas, barra de direcciones con candado, la página, y los
 * paneles de historial/marcadores/descargas. **Cero `useState`**: todo entra
 * por parámetro, como `VentanaMuro` y `VentanaAsistente`. Quien tiene el
 * estado es `useNavegador`.
 *
 * No pinta el marco de programa (barra de título, botón de encender): eso es
 * `VentanaBase`. Una clase monta:
 *
 *     <VentanaBase marca="Tecnia Navegador" subtitulo="...">
 *       <VentanaNavegador ... />
 *     </VentanaBase>
 *
 * ── Lo que este componente NO hace ─────────────────────────────────────────
 *
 * No busca en el mapa de sitios (eso ya lo resolvió `useNavegador` en
 * `paginaActual`, y esta ventana sólo recibe `pagina` ya resuelta — igual que
 * `VentanaMuro` recibe `publicaciones` ya filtradas por `visibles()`, no un
 * mapa crudo). No decide qué botón hace qué en una ficha (`onAccionFicha`
 * sólo avisa el clic). No sabe qué es un acierto. Sin `pestanas`, sin
 * `pagina`, esta ventana no tiene nada que pintar — no inventa contenido.
 */

export interface PestanaVista {
  id: string;
  /** Etiqueta corta a mostrar en la solapa — normalmente `pagina.pestana`. */
  titulo: string;
  activa: boolean;
}

export interface BarraDireccion {
  valor: string;
  onCambiar: (v: string) => void;
  onIr: () => void;
}

const ETIQUETA_SEGURIDAD: Record<EstadoSeguridad, { icono: string; texto: string }> = {
  segura: { icono: '🔒', texto: 'Conexión segura' },
  advertencia: { icono: '⚠️', texto: 'Certificado no válido' },
  insegura: { icono: '⚠️', texto: 'No es una conexión segura' },
};

function CuerpoPaginaView({
  pagina,
  onIrAUrl,
  onAccionFicha,
}: {
  pagina: PaginaWeb;
  onIrAUrl?: (url: string) => void;
  onAccionFicha?: (id: string) => void;
}) {
  const c = pagina.cuerpo;

  if (c.tipo === 'vacio') {
    return <p className="tn-pagina-vacia">{c.mensaje}</p>;
  }

  if (c.tipo === 'resultados') {
    return (
      <>
        <p className="tn-pagina-titulo">Resultados para «{c.consulta}»</p>
        <ul className="tn-resultados" data-testid="nav-resultados">
          {c.resultados.map((r) => (
            <li
              key={r.id}
              className={`tn-resultado${r.esAnuncio ? ' es-anuncio' : ''}`}
              data-testid="nav-resultado"
              data-anuncio={r.esAnuncio ? 'si' : undefined}
            >
              {r.esAnuncio && <span className="tn-anuncio-etiqueta">Anuncio</span>}
              {onIrAUrl ? (
                <button type="button" className="tn-resultado-titulo" onClick={() => onIrAUrl(r.url)}>
                  {r.titulo}
                </button>
              ) : (
                <p className="tn-resultado-titulo">{r.titulo}</p>
              )}
              <p className="tn-resultado-url">{r.url}</p>
              <p className="tn-resultado-desc">{r.descripcion}</p>
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (c.tipo === 'ficha') {
    return (
      <>
        <p className="tn-pagina-titulo">{pagina.titulo}</p>
        {c.precio && <p className="tn-ficha-precio">{c.precio}</p>}
        <dl className="tn-ficha-datos" data-testid="nav-ficha-datos">
          {c.datos.map((d, i) => (
            <div className="tn-ficha-dato" key={i}>
              <dt>{d.etiqueta}</dt>
              <dd>{d.valor}</dd>
            </div>
          ))}
        </dl>
        {c.acciones && c.acciones.length > 0 && (
          <div className="tn-ficha-acciones">
            {c.acciones.map((a) => (
              <button
                key={a.id}
                type="button"
                data-accion={a.id}
                disabled={a.deshabilitada}
                className={`tn-ficha-accion${a.hecha ? ' es-hecha' : ''}`}
                onClick={() => onAccionFicha?.(a.id)}
              >
                {a.etiqueta}
              </button>
            ))}
          </div>
        )}
      </>
    );
  }

  // 'articulo'
  return (
    <>
      <p className="tn-pagina-titulo">{pagina.titulo}</p>
      {(pagina.autor || pagina.fecha) && (
        <p className={`tn-pagina-meta${!pagina.autor ? ' es-sin-firma' : ''}`}>
          {pagina.autor ?? 'Sin autor'} · {pagina.fecha ?? 'Sin fecha'}
        </p>
      )}
      {c.parrafos.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}

export interface VentanaNavegadorProps {
  pestanas: PestanaVista[];
  pagina: PaginaWeb;
  puedeAtras?: boolean;
  puedeAdelante?: boolean;
  marcada?: boolean;
  barraDireccion: BarraDireccion;
  onAtras?: () => void;
  onAdelante?: () => void;
  onRecargar?: () => void;
  onActivarPestana?: (id: string) => void;
  onCerrarPestana?: (id: string) => void;
  onNuevaPestana?: () => void;
  onMarcar?: () => void;
  onDesmarcar?: () => void;
  /** Clic en un enlace, un resultado de búsqueda o una tarjeta relacionada. */
  onIrAUrl?: (url: string) => void;
  onAccionFicha?: (id: string) => void;
  /** Los tres paneles de «qué queda registrado». Sólo se pinta el que la
   *  actividad pida con `panelActivo`; ninguno se ofrece por omisión. */
  historial?: EntradaHistorial[];
  marcadores?: Marcador[];
  descargas?: Descarga[];
  panelActivo?: 'historial' | 'marcadores' | 'descargas' | null;
  emergentes?: VentanaEmergente[];
  onCerrarEmergente?: (id: string) => void;
  /** El hueco de `VentanaBase`, si la clase no envuelve con ella. */
  encabezado?: ReactNode;
  className?: string;
}

export function VentanaNavegador({
  pestanas,
  pagina,
  puedeAtras = false,
  puedeAdelante = false,
  marcada = false,
  barraDireccion,
  onAtras,
  onAdelante,
  onRecargar,
  onActivarPestana,
  onCerrarPestana,
  onNuevaPestana,
  onMarcar,
  onDesmarcar,
  onIrAUrl,
  onAccionFicha,
  historial = [],
  marcadores = [],
  descargas = [],
  panelActivo = null,
  emergentes = [],
  onCerrarEmergente,
  encabezado,
  className,
}: VentanaNavegadorProps) {
  const seguridad = estadoSeguridad(pagina);
  const etiquetaSeguridad = ETIQUETA_SEGURIDAD[seguridad];

  return (
    <div className={`tn${className ? ` ${className}` : ''}`} data-testid="nav-app">
      {encabezado}

      <div className="tn-tabs" data-testid="nav-tabs">
        {pestanas.map((p) => (
          <div key={p.id} className={`tn-tab${p.activa ? ' es-activa' : ''}`} data-testid="nav-tab" data-pestana={p.id}>
            <button type="button" className="tn-tab-boton" onClick={() => onActivarPestana?.(p.id)}>
              {p.titulo}
            </button>
            {onCerrarPestana && (
              <button
                type="button"
                className="tn-tab-cerrar"
                aria-label={`Cerrar pestaña ${p.titulo}`}
                onClick={() => onCerrarPestana(p.id)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {onNuevaPestana && (
          <button type="button" className="tn-tab-nueva" aria-label="Nueva pestaña" onClick={onNuevaPestana}>
            +
          </button>
        )}
      </div>

      <div className="tn-barra" data-testid="nav-barra">
        <button type="button" className="tn-nav-boton" aria-label="Atrás" disabled={!puedeAtras} onClick={onAtras}>
          ←
        </button>
        <button type="button" className="tn-nav-boton" aria-label="Adelante" disabled={!puedeAdelante} onClick={onAdelante}>
          →
        </button>
        <button type="button" className="tn-nav-boton" aria-label="Recargar" onClick={onRecargar}>
          ⟳
        </button>

        <span
          className={`tn-candado es-${seguridad}`}
          data-testid="nav-candado"
          data-estado={seguridad}
          title={etiquetaSeguridad.texto}
          aria-label={etiquetaSeguridad.texto}
        >
          {etiquetaSeguridad.icono}
        </span>

        <form
          className="tn-direccion"
          onSubmit={(e) => {
            e.preventDefault();
            barraDireccion.onIr();
          }}
        >
          <input
            type="text"
            className="tn-direccion-cuadro"
            data-testid="nav-direccion"
            value={barraDireccion.valor}
            aria-label="Barra de direcciones"
            onChange={(e) => barraDireccion.onCambiar(e.target.value)}
          />
        </form>

        {(onMarcar || onDesmarcar) && (
          <button
            type="button"
            className={`tn-marcador${marcada ? ' es-marcada' : ''}`}
            aria-pressed={marcada}
            aria-label={marcada ? 'Quitar marcador' : 'Añadir marcador'}
            onClick={marcada ? onDesmarcar : onMarcar}
          >
            {marcada ? '★' : '☆'}
          </button>
        )}
      </div>

      <div className="tn-pagina" data-testid="nav-pagina">
        <CuerpoPaginaView pagina={pagina} onIrAUrl={onIrAUrl} onAccionFicha={onAccionFicha} />

        {pagina.senales && pagina.senales.length > 0 && (
          <div className="tn-senales" data-testid="nav-senales">
            {pagina.senales.map((s) => (
              <p key={s.id} className={`tn-senal es-${s.tono}`} data-tono={s.tono}>
                {s.texto}
              </p>
            ))}
          </div>
        )}

        {pagina.enlaces && pagina.enlaces.length > 0 && (
          <ul className="tn-enlaces" data-testid="nav-enlaces">
            {pagina.enlaces.map((e) => (
              <li key={e.url}>
                <button type="button" onClick={() => onIrAUrl?.(e.url)}>
                  {e.etiqueta}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {panelActivo === 'historial' && (
        <aside className="tn-panel" data-testid="nav-panel-historial">
          <p className="tn-panel-titulo">Historial</p>
          {historial.length === 0 ? (
            <p className="tn-panel-vacio">Todavía no visitaste nada.</p>
          ) : (
            <ul>
              {historial.map((h, i) => (
                <li key={i}>
                  <span>{h.titulo}</span> <span className="tn-panel-meta">{h.url} · {h.momento}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}

      {panelActivo === 'marcadores' && (
        <aside className="tn-panel" data-testid="nav-panel-marcadores">
          <p className="tn-panel-titulo">Marcadores</p>
          {marcadores.length === 0 ? (
            <p className="tn-panel-vacio">No guardaste ningún marcador.</p>
          ) : (
            <ul>
              {marcadores.map((m) => (
                <li key={m.url}>
                  <button type="button" onClick={() => onIrAUrl?.(m.url)}>
                    {m.titulo}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}

      {panelActivo === 'descargas' && (
        <aside className="tn-panel" data-testid="nav-panel-descargas">
          <p className="tn-panel-titulo">Descargas</p>
          {descargas.length === 0 ? (
            <p className="tn-panel-vacio">No has descargado nada.</p>
          ) : (
            <ul>
              {descargas.map((d) => (
                <li key={d.id} className={d.sospechosa ? 'es-sospechosa' : undefined}>
                  {d.nombre}
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}

      {emergentes.length > 0 && (
        <div className="tn-emergentes" data-testid="nav-emergentes">
          {emergentes.map((e) => (
            <div key={e.id} className="tn-emergente" data-testid="nav-emergente">
              <div className="tn-emergente-barra">
                <span>{e.pagina.pestana}</span>
                <button type="button" aria-label="Cerrar" onClick={() => onCerrarEmergente?.(e.id)}>
                  ✕
                </button>
              </div>
              <div className="tn-emergente-cuerpo">
                <CuerpoPaginaView pagina={e.pagina} onIrAUrl={onIrAUrl} onAccionFicha={onAccionFicha} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VentanaNavegador;
