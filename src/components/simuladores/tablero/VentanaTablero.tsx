'use client';

import type { ReactNode } from 'react';
import {
  estadoFecha,
  tarjetasDe,
  type ColumnaTablero,
  type DatosTablero,
  type EstadoFecha,
  type TarjetaTablero,
} from './tiposTablero';
import './ventanaTablero.css';

/**
 * TECNIA TABLERO · LA VENTANA
 *
 * Columnas en fila, tarjetas dentro. **Cero `useState`**: todo entra por
 * parámetro, como `VentanaHojas` y `VentanaMuro`. Quien tiene el estado es
 * `useTablero`.
 *
 * No pinta el marco de programa: eso es `VentanaBase`.
 *
 * ── Por qué se mueve con botones y no arrastrando ──────────────────────────
 *
 * Porque una prueba de arrastre en jsdom es una prueba falsa: no hay
 * `PointerEvent` y `getBoundingClientRect` devuelve ceros, así que la prueba
 * escrita de la forma natural pasa en verde sin comprobar nada. Los dos
 * botones «◀ ▶» viven PEGADOS a la tarjeta, dentro de su pie, no flotando
 * encima como un overlay genérico; y llaman a `moverTarjeta`, la misma
 * función pura que se prueba de verdad.
 *
 * ── Lo que este componente NO hace ─────────────────────────────────────────
 *
 * Sin `onMover` no pinta las flechas. Sin `onTarjeta` las tarjetas no se
 * pueden pulsar. Sin `hoy` no pinta ni un estado de fecha — no se inventa el
 * día de hoy jamás. No decide qué es un acierto ni corrige nada.
 */

const ETIQUETA_ESTADO: Record<Exclude<EstadoFecha, 'sin-fecha'>, string> = {
  vencida: 'Se pasó la fecha',
  hoy: 'Es para hoy',
  proxima: 'Para',
};

export interface VentanaTableroProps {
  datos: DatosTablero;
  /** ISO `AAAA-MM-DD`. Sin él no se pinta ningún estado de fecha. */
  hoy?: string;
  seleccionId?: string | null;
  /** Si falta, no hay flechas: la ventana no ofrece un control que nadie atiende. */
  onMover?: (tarjetaId: string, columnaId: string) => void;
  onTarjeta?: (tarjetaId: string) => void;
  /** Botón «+» al pie de cada columna. Sin él, no aparece. */
  onNueva?: (columnaId: string) => void;
  onQuitarColumna?: (columnaId: string) => void;
  /** Panel al costado: lo llena la clase (detalle, formulario, veredicto). */
  panel?: ReactNode;
  /** Aviso en la barra superior. Lo escribe la clase. */
  aviso?: ReactNode;
  vacio?: ReactNode;
  encabezado?: ReactNode;
  className?: string;
}

function Tarjeta({
  tarjeta,
  columnas,
  hoy,
  seleccionada,
  onMover,
  onTarjeta,
}: {
  tarjeta: TarjetaTablero;
  columnas: ColumnaTablero[];
  hoy?: string;
  seleccionada: boolean;
  onMover?: (tarjetaId: string, columnaId: string) => void;
  onTarjeta?: (tarjetaId: string) => void;
}) {
  const i = columnas.findIndex((c) => c.id === tarjeta.columnaId);
  const anterior = columnas[i - 1] ?? null;
  const siguiente = columnas[i + 1] ?? null;
  const estado = hoy ? estadoFecha(tarjeta, hoy) : 'sin-fecha';

  const cuerpo = (
    <>
      <span className="tt-tarjeta-titulo">{tarjeta.titulo}</span>
      {tarjeta.descripcion && <span className="tt-tarjeta-desc">{tarjeta.descripcion}</span>}
      {tarjeta.etiquetas.length > 0 && (
        <span className="tt-etiquetas">
          {tarjeta.etiquetas.map((e) => (
            <span
              key={e.id}
              className="tt-etiqueta"
              data-testid="tablero-etiqueta"
              style={e.color ? { background: e.color } : undefined}
            >
              {e.texto}
            </span>
          ))}
        </span>
      )}
    </>
  );

  return (
    <article
      className={`tt-tarjeta${seleccionada ? ' es-abierta' : ''}${estado === 'vencida' ? ' es-vencida' : ''}`}
      data-testid="tablero-tarjeta"
      data-tarjeta={tarjeta.id}
      data-columna={tarjeta.columnaId}
    >
      {onTarjeta ? (
        <button type="button" className="tt-tarjeta-cara" onClick={() => onTarjeta(tarjeta.id)}>
          {cuerpo}
        </button>
      ) : (
        <span className="tt-tarjeta-cara">{cuerpo}</span>
      )}

      <footer className="tt-tarjeta-pie">
        {/* Quién hace qué: sin responsable, la tarjeta lo dice a la cara. */}
        <span
          className={`tt-responsable${tarjeta.responsable ? '' : ' es-nadie'}`}
          data-testid="tablero-responsable"
          data-sin-responsable={tarjeta.responsable ? undefined : 'si'}
        >
          {tarjeta.responsable ? (
            <>
              <span className="tt-avatar" aria-hidden="true">
                {tarjeta.responsable.avatar ?? tarjeta.responsable.nombre.charAt(0)}
              </span>
              {tarjeta.responsable.nombre}
            </>
          ) : (
            'Sin responsable'
          )}
        </span>

        {/* Para cuándo. Sólo con `hoy`: el armazón no consulta el reloj. */}
        {tarjeta.fecha && (
          <span className={`tt-fecha es-${estado}`} data-testid="tablero-fecha" data-estado={estado}>
            {estado === 'sin-fecha' ? tarjeta.fecha : `${ETIQUETA_ESTADO[estado]} ${tarjeta.fecha}`}
          </span>
        )}

        {onMover && (
          <span className="tt-flechas">
            <button
              type="button"
              className="tt-flecha"
              data-testid="tablero-atras"
              aria-label={anterior ? `Mover «${tarjeta.titulo}» a ${anterior.titulo}` : 'Ya está en la primera columna'}
              disabled={!anterior}
              onClick={() => anterior && onMover(tarjeta.id, anterior.id)}
            >
              ◀
            </button>
            <button
              type="button"
              className="tt-flecha"
              data-testid="tablero-adelante"
              aria-label={siguiente ? `Mover «${tarjeta.titulo}» a ${siguiente.titulo}` : 'Ya está en la última columna'}
              disabled={!siguiente}
              onClick={() => siguiente && onMover(tarjeta.id, siguiente.id)}
            >
              ▶
            </button>
          </span>
        )}
      </footer>
    </article>
  );
}

export function VentanaTablero({
  datos,
  hoy,
  seleccionId = null,
  onMover,
  onTarjeta,
  onNueva,
  onQuitarColumna,
  panel,
  aviso,
  vacio,
  encabezado,
  className,
}: VentanaTableroProps) {
  return (
    <div className={`tt${className ? ` ${className}` : ''}`} data-testid="tablero-app">
      {encabezado}
      {aviso && (
        <div className="tt-aviso" data-testid="tablero-aviso">
          {aviso}
        </div>
      )}

      <div className="tt-marco">
        <div className="tt-columnas" data-testid="tablero-columnas">
          {datos.columnas.length === 0 ? (
            <p className="tt-vacio">{vacio ?? 'Este tablero todavía no tiene columnas.'}</p>
          ) : (
            datos.columnas.map((c) => {
              const dentro = tarjetasDe(datos, c.id);
              return (
                <section key={c.id} className="tt-columna" data-testid="tablero-columna" data-columna={c.id}>
                  <header className="tt-columna-cabecera">
                    <h3 className="tt-columna-titulo">{c.titulo}</h3>
                    <span className="tt-columna-n" data-testid="tablero-cuenta">
                      {dentro.length}
                    </span>
                    {onQuitarColumna && (
                      <button
                        type="button"
                        className="tt-columna-quitar"
                        aria-label={`Quitar la columna ${c.titulo}`}
                        onClick={() => onQuitarColumna(c.id)}
                      >
                        ✕
                      </button>
                    )}
                  </header>

                  <div className="tt-columna-cuerpo">
                    {dentro.length === 0 ? (
                      <p className="tt-columna-vacia">Nada aquí todavía.</p>
                    ) : (
                      dentro.map((t) => (
                        <Tarjeta
                          key={t.id}
                          tarjeta={t}
                          columnas={datos.columnas}
                          hoy={hoy}
                          seleccionada={t.id === seleccionId}
                          onMover={onMover}
                          onTarjeta={onTarjeta}
                        />
                      ))
                    )}
                  </div>

                  {onNueva && (
                    <button
                      type="button"
                      className="tt-columna-nueva"
                      data-testid="tablero-nueva"
                      data-columna={c.id}
                      onClick={() => onNueva(c.id)}
                    >
                      + Nueva tarjeta
                    </button>
                  )}
                </section>
              );
            })
          )}
        </div>

        {panel && (
          <aside className="tt-panel" data-testid="tablero-panel">
            {panel}
          </aside>
        )}
      </div>
    </div>
  );
}

export default VentanaTablero;
