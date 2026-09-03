'use client';

import type { CSSProperties } from 'react';
import type { PielSistema, PuntoSistema, ZonaPantalla } from './sistemasOperativos';

/**
 * `n7-sistemas-operativos` · LA PANTALLA DE UN SISTEMA
 *
 * Pinta **una** piel: su aparato, sus barras y sus puntos, cada uno en la zona
 * que declaró. **Cero `useState`** — recibe todo por parámetro, como
 * `VentanaExplorador` y `VentanaHojas`.
 *
 * Un solo componente para los cinco sistemas **no es un motor de plantillas**:
 * no recibe ejercicios, no sabe qué tarea se está pidiendo y no decide si el
 * alumno acertó (eso es `juzgarToque`, y la cuenta es del laboratorio). Pinta
 * la pantalla de un aparato, igual que `VentanaExplorador` pinta un listado.
 *
 * Y que sea uno solo es **pedagógicamente obligatorio**: lo único que puede
 * cambiar de una pantalla a otra es lo que de verdad cambia entre sistemas
 * operativos —dónde están las barras y cómo se llaman los botones—. Si cada
 * pantalla llevara su propio acabado, el alumno vería diferencias de dibujo en
 * vez de diferencias de sistema, y la clase entera se caería.
 *
 * Las zonas que se dibujan salen de los propios puntos: una piel sin ningún
 * punto en `muelle-izq` no tiene muelle. La `forma` sólo decide el ASPECTO de
 * cada barra (un panel de escritorio y una barra de estado de teléfono son la
 * misma zona con dos caras).
 */

export interface PantallaSistemaProps {
  piel: PielSistema;
  /** El punto acertado, si ya se acertó: pinta encima lo que se abrió. */
  abierto?: PuntoSistema | null;
  /** Bloquea los puntos (mientras se lee el resultado, o en la portada). */
  bloqueado?: boolean;
  onTocar?: (puntoId: string) => void;
  /** La acción del panel de resultado. Va dentro del panel, no flotando. */
  onSeguir?: () => void;
  etiquetaSeguir?: string;
}

const NOMBRE_APARATO: Record<PielSistema['aparato'], string> = {
  escritorio: 'Computadora de escritorio',
  laptop: 'Laptop',
  telefono: 'Teléfono',
  tablet: 'Tablet',
  'todo-en-uno': 'Equipo del salón',
};

export function PantallaSistema({
  piel,
  abierto = null,
  bloqueado = false,
  onTocar,
  onSeguir,
  etiquetaSeguir = 'Siguiente',
}: PantallaSistemaProps) {
  const de = (zona: ZonaPantalla) => piel.puntos.filter((p) => p.zona === zona);
  const arriba = de('barra-superior');
  const abajo = de('barra-inferior');
  const muelle = de('muelle-izq');
  const derecha = de('barra-derecha');
  const lienzo = de('lienzo');

  const estilo = {
    '--so-acento': piel.acento,
    '--so-acento-hondo': piel.acentoProfundo,
    '--so-fondo': piel.fondo,
  } as CSSProperties;

  const boton = (p: PuntoSistema, clase: string) => (
    <button
      key={p.id}
      type="button"
      className={clase}
      data-testid="so-punto"
      data-punto={p.id}
      disabled={bloqueado}
      onClick={() => onTocar?.(p.id)}
    >
      <span className="so-punto-emoji" aria-hidden="true">
        {p.emoji}
      </span>
      <span className="so-punto-texto">{p.etiqueta}</span>
    </button>
  );

  const enBarra = (puntos: PuntoSistema[], clase: string) => {
    const inicio = puntos.filter((p) => !p.alFinal);
    const fin = puntos.filter((p) => p.alFinal);
    return (
      <>
        <span className="so-barra-grupo">{inicio.map((p) => boton(p, clase))}</span>
        {fin.length > 0 && <span className="so-barra-grupo so-barra-grupo--fin">{fin.map((p) => boton(p, clase))}</span>}
      </>
    );
  };

  return (
    <figure className={`so-aparato so-aparato--${piel.aparato}`} style={estilo} data-testid="so-aparato" data-piel={piel.id}>
      <div className={`so-pantalla so-pantalla--${piel.forma}`}>
        {arriba.length > 0 && (
          <div className="so-barra so-barra--arriba">
            <span className="so-barra-marca" aria-hidden="true">
              {piel.emoji}
            </span>
            {enBarra(arriba, 'so-punto so-punto--barra')}
          </div>
        )}

        <div className="so-cuerpo">
          {muelle.length > 0 && <div className="so-barra so-barra--muelle">{muelle.map((p) => boton(p, 'so-punto so-punto--muelle'))}</div>}

          <div className="so-lienzo">
            {lienzo.map((p) => boton(p, 'so-punto so-punto--icono'))}
          </div>

          {derecha.length > 0 && (
            <div className="so-barra so-barra--derecha">
              <span className="so-barra-marca" aria-hidden="true">
                {piel.emoji}
              </span>
              {enBarra(derecha, 'so-punto so-punto--muelle')}
            </div>
          )}
        </div>

        {abajo.length > 0 && (
          <div className="so-barra so-barra--abajo">
            {piel.forma === 'barra-abajo' && (
              <span className="so-barra-marca" aria-hidden="true">
                {piel.emoji}
              </span>
            )}
            {enBarra(abajo, 'so-punto so-punto--barra')}
          </div>
        )}

        {abierto && (
          <div className="so-abierto" data-testid="so-abierto" role="status">
            <p className="so-abierto-titulo">
              <span aria-hidden="true">{abierto.emoji}</span> {abierto.etiqueta}
            </p>
            <p className="so-abierto-texto">{abierto.resultado ?? abierto.queHace}</p>
            {onSeguir && (
              <button type="button" className="so-abierto-boton" onClick={onSeguir}>
                {etiquetaSeguir}
              </button>
            )}
          </div>
        )}
      </div>

      <figcaption className="so-aparato-pie">
        <span className="so-aparato-nombre">{piel.nombre}</span>
        <span className="so-aparato-tipo">{NOMBRE_APARATO[piel.aparato]}</span>
      </figcaption>
    </figure>
  );
}

export default PantallaSistema;
