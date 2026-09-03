'use client';

/**
 * TECNIA DISEÑO · la línea de tiempo
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Paso 1 de `n6-edita-imagen-y-video` (DISEÑO §Parte 2, punto 3). El aparato
 * nuevo: una regla de segundos, dos pistas (Video/Música) y el cabezal.
 * **Cero `useState`**, como `VentanaDiseno`: todo entra por parámetro, y
 * `useDiseno` es quien tiene el estado (el cabezal) y `cinta.ts` quien tiene
 * los datos.
 *
 * Cada corte es un `<button data-corte data-desde data-dura data-inicio>`:
 * todo lo corregible sale de esos `data-`, nunca de medir en pantalla
 * (`getBoundingClientRect` devuelve ceros en jsdom — trampa 5 del canon).
 *
 * Los controles del corte seleccionado van DENTRO de la cinta, no flotando
 * encima: regla del cliente, «nada de botones flotantes genéricos».
 */

import { accion, type Accion } from './comandos';
import { inicioDe, MIN_DUR, type Corte, type Pista } from './cinta';
import type { Recurso } from './modelo';
import './lineaDeTiempo.css';

export interface LineaDeTiempoProps {
  cinta: readonly Pista[];
  banco: Record<string, Recurso>;
  segundo: number;
  reproduciendo: boolean;
  /** id de corte seleccionado, o `null`. */
  seleccion: string | null;
  /** 44 por omisión: la misma casilla que usa el lienzo del cartel. */
  segPx?: number;
  onIrASegundo: (s: number) => void;
  onReproducir: () => void;
  onPausar: () => void;
  onSeleccionarCorte: (id: string | null) => void;
  /** recortar-corte, mover-corte, quitar-corte: todo lo que no es transporte. */
  onAccion: (a: Accion) => void;
}

const duracionPista = (p: Pista): number => p.cortes.reduce((s, c) => s + c.dura, 0);

export function LineaDeTiempo(props: LineaDeTiempoProps) {
  const {
    cinta,
    banco,
    segundo,
    reproduciendo,
    seleccion,
    segPx = 44,
    onIrASegundo,
    onReproducir,
    onPausar,
    onSeleccionarCorte,
    onAccion,
  } = props;

  const total = Math.max(1, segundo, ...cinta.map(duracionPista));
  const marcas = Array.from({ length: total + 1 }, (_, i) => i);
  const anchoRegla = total * segPx;

  let pistaSel: Pista | null = null;
  let corteSel: Corte | null = null;
  if (seleccion) {
    for (const p of cinta) {
      const c = p.cortes.find((c) => c.id === seleccion);
      if (c) {
        pistaSel = p;
        corteSel = c;
        break;
      }
    }
  }

  return (
    <div className="lnt-marco" data-testid="lnt-cinta">
      <div className="lnt-transporte">
        <button
          type="button"
          className="lnt-transp-btn"
          data-accion={reproduciendo ? 'pausar' : 'reproducir'}
          aria-pressed={reproduciendo}
          onClick={reproduciendo ? onPausar : onReproducir}
        >
          {reproduciendo ? '⏸ Pausa' : '▶ Reproducir'}
        </button>
        <span className="lnt-reloj" data-testid="lnt-segundo">
          {segundo}s
        </span>
      </div>

      <div className="lnt-carril-regla">
        <div className="lnt-regla" role="slider" aria-label="Segundo de la cinta" aria-valuenow={segundo} aria-valuemin={0} aria-valuemax={total} style={{ width: anchoRegla }}>
          {marcas.map((s) => (
            <button key={s} type="button" className="lnt-marca" data-segundo={s} style={{ left: s * segPx }} onClick={() => onIrASegundo(s)}>
              <span className="lnt-marca-num">{s}</span>
            </button>
          ))}
          <div className="lnt-cabezal" data-testid="lnt-cabezal" style={{ left: segundo * segPx }} />
        </div>
      </div>

      {cinta.map((pista) => (
        <div key={pista.id} className="lnt-pista" data-pista={pista.id} data-tipo={pista.tipo}>
          <span className="lnt-pista-nombre">
            {pista.nombre}
            {pista.silenciada && <span aria-label="silenciada"> 🔇</span>}
          </span>
          <div className="lnt-carriles" style={{ width: Math.max(anchoRegla, segPx) }}>
            {pista.cortes.map((corte) => {
              const rec = banco[corte.recurso];
              const inicio = inicioDe(pista, corte.id);
              return (
                <button
                  key={corte.id}
                  type="button"
                  className={`lnt-corte${seleccion === corte.id ? ' lnt-on' : ''}`}
                  data-corte={corte.id}
                  data-desde={corte.desde}
                  data-dura={corte.dura}
                  data-inicio={inicio}
                  style={{ left: inicio * segPx, width: corte.dura * segPx, backgroundImage: rec?.fondo }}
                  onClick={() => onSeleccionarCorte(seleccion === corte.id ? null : corte.id)}
                >
                  {rec?.glifo && <span aria-hidden="true">{rec.glifo}</span>}
                  <span className="lnt-corte-nombre">{rec?.nombre ?? corte.recurso}</span>
                  <span className="lnt-corte-seg">{corte.dura}s</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {corteSel && pistaSel && (
        <div className="lnt-controles" data-testid="lnt-controles" data-corte-control={corteSel.id}>
          <span className="lnt-controles-tit">{banco[corteSel.recurso]?.nombre ?? corteSel.recurso}</span>
          <button
            type="button"
            className="lnt-btn"
            data-accion="mover-atras"
            onClick={() => {
              const i = pistaSel!.cortes.findIndex((c) => c.id === corteSel!.id);
              onAccion(accion('mover-corte', { pista: pistaSel!.id, corte: corteSel!.id, a: i - 1 }));
            }}
          >
            ◀
          </button>
          <button
            type="button"
            className="lnt-btn"
            data-accion="mover-adelante"
            onClick={() => {
              const i = pistaSel!.cortes.findIndex((c) => c.id === corteSel!.id);
              onAccion(accion('mover-corte', { pista: pistaSel!.id, corte: corteSel!.id, a: i + 1 }));
            }}
          >
            ▶
          </button>
          <button
            type="button"
            className="lnt-btn"
            data-accion="menos-1s"
            onClick={() => onAccion(accion('recortar-corte', { pista: pistaSel!.id, corte: corteSel!.id, dura: corteSel!.dura - 1 }))}
          >
            −1 s
          </button>
          <button
            type="button"
            className="lnt-btn"
            data-accion="mas-1s"
            onClick={() => onAccion(accion('recortar-corte', { pista: pistaSel!.id, corte: corteSel!.id, dura: corteSel!.dura + 1 }))}
          >
            +1 s
          </button>
          <button
            type="button"
            className="lnt-btn"
            data-accion="empezar-despues"
            onClick={() => onAccion(accion('recortar-corte', { pista: pistaSel!.id, corte: corteSel!.id, desde: corteSel!.desde + MIN_DUR }))}
          >
            Empezar 1 s después
          </button>
          <button
            type="button"
            className="lnt-btn lnt-peligro"
            data-accion="quitar"
            onClick={() => onAccion(accion('quitar-corte', { pista: pistaSel!.id, corte: corteSel!.id }))}
          >
            🗑 Quitar
          </button>
        </div>
      )}
    </div>
  );
}

export default LineaDeTiempo;
