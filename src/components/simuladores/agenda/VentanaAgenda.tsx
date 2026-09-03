'use client';

import type { ReactNode } from 'react';
import {
  citasDe,
  cuentaInvitados,
  diaDeLaSemana,
  disponerDia,
  mesDe,
  rejillaDelMes,
  seSolapan,
  semanaDe,
  type CitaAgenda,
  type ColocacionCita,
} from './tiposAgenda';
import './ventanaAgenda.css';

/**
 * TECNIA AGENDA · LA VENTANA
 *
 * Vista de mes (rejilla de 6×7) y vista de semana (siete columnas con las
 * horas al costado). **Cero `useState`**: todo entra por parámetro, como
 * `VentanaHojas` y `VentanaMuro`. Quien tiene el estado es `useAgenda`.
 *
 * No pinta el marco de programa: eso es `VentanaBase`.
 *
 * ── El día de hoy es un dato que entra, no algo que se consulta ────────────
 *
 * `hoy` es una prop OBLIGATORIA en ISO `AAAA-MM-DD`. Este componente no llama
 * a `new Date()` ni una vez: si lo hiciera, la casilla marcada como «hoy»
 * cambiaría sola y ninguna prueba podría sujetarla.
 *
 * ── Que los solapes se VEAN ────────────────────────────────────────────────
 *
 * En la vista de semana las citas se colocan con `disponerDia`, que reparte en
 * carriles las que chocan: dos citas a la misma hora salen a media anchura,
 * una junto a otra, en vez de esconderse la segunda debajo de la primera. Es
 * la razón por la que existe esa función y no un simple `filter`.
 *
 * ── Lo que este componente NO hace ─────────────────────────────────────────
 *
 * Sin `onCita` las citas no se pueden pulsar; sin `onDia` los días tampoco.
 * No corrige, no dice si un solape está mal, no inventa citas.
 */

/** De 7:00 a 21:00: la franja en la que caben las clases y las actividades. */
const HORA_PRIMERA = 7;
const HORA_ULTIMA = 21;
const MINUTOS_VISIBLES = (HORA_ULTIMA - HORA_PRIMERA) * 60;

const DIAS_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export interface VentanaAgendaProps {
  citas: CitaAgenda[];
  /** ISO `AAAA-MM-DD`. Obligatorio: la ventana nunca consulta el reloj. */
  hoy: string;
  /** El día en el que está puesto el calendario. */
  dia: string;
  vista?: 'mes' | 'semana';
  seleccionId?: string | null;
  onCita?: (citaId: string) => void;
  onDia?: (dia: string) => void;
  onVista?: (vista: 'mes' | 'semana') => void;
  /** Flechas de la barra superior. Sin él, no aparecen. */
  onAvanzar?: (saltos: number) => void;
  /** Panel al costado: lo llena la clase (detalle, formulario, invitados). */
  panel?: ReactNode;
  aviso?: ReactNode;
  encabezado?: ReactNode;
  className?: string;
}

function etiquetaInvitados(cita: CitaAgenda): string | null {
  if (cita.invitados.length === 0) return null;
  const cuenta = cuentaInvitados(cita);
  return `${cuenta.acepta}/${cita.invitados.length} van`;
}

function Bloque({
  colocacion,
  seleccionada,
  onCita,
}: {
  colocacion: ColocacionCita;
  seleccionada: boolean;
  onCita?: (citaId: string) => void;
}) {
  const { cita, carril, carriles, desde, hasta } = colocacion;
  const arranque = HORA_PRIMERA * 60;
  const top = ((desde - arranque) / MINUTOS_VISIBLES) * 100;
  const alto = ((hasta - desde) / MINUTOS_VISIBLES) * 100;
  const ancho = 100 / carriles;
  const invitados = etiquetaInvitados(cita);

  const estilo = {
    top: `${top}%`,
    height: `${Math.max(alto, 3)}%`,
    left: `${carril * ancho}%`,
    width: `calc(${ancho}% - 3px)`,
    ...(cita.color ? { background: cita.color } : {}),
  };

  const cuerpo = (
    <>
      <span className="ta-bloque-hora">
        {cita.inicio}–{cita.fin}
      </span>
      <span className="ta-bloque-titulo">{cita.titulo}</span>
      {cita.lugar && <span className="ta-bloque-lugar">{cita.lugar}</span>}
      {invitados && <span className="ta-bloque-invitados">{invitados}</span>}
    </>
  );

  const clase = `ta-bloque${seleccionada ? ' es-abierta' : ''}${carriles > 1 ? ' es-solapada' : ''}`;

  return onCita ? (
    <button
      type="button"
      className={clase}
      style={estilo}
      data-testid="agenda-cita"
      data-cita={cita.id}
      data-carriles={carriles}
      data-carril={carril}
      onClick={() => onCita(cita.id)}
    >
      {cuerpo}
    </button>
  ) : (
    <span
      className={clase}
      style={estilo}
      data-testid="agenda-cita"
      data-cita={cita.id}
      data-carriles={carriles}
      data-carril={carril}
    >
      {cuerpo}
    </span>
  );
}

function VistaSemana({
  citas,
  hoy,
  dia,
  seleccionId,
  onCita,
  onDia,
}: {
  citas: CitaAgenda[];
  hoy: string;
  dia: string;
  seleccionId: string | null;
  onCita?: (citaId: string) => void;
  onDia?: (dia: string) => void;
}) {
  const dias = semanaDe(dia);
  const horas = Array.from({ length: HORA_ULTIMA - HORA_PRIMERA }, (_, i) => HORA_PRIMERA + i);

  return (
    <div className="ta-semana" data-testid="agenda-semana">
      <div className="ta-horas" aria-hidden="true">
        <span className="ta-horas-hueco" />
        {horas.map((h) => (
          <span key={h} className="ta-hora">
            {String(h).padStart(2, '0')}:00
          </span>
        ))}
      </div>

      {dias.map((d) => {
        const colocadas = disponerDia(citas, d);
        const esHoy = d === hoy;
        return (
          <div key={d} className={`ta-columna${esHoy ? ' es-hoy' : ''}`} data-testid="agenda-columna" data-dia={d}>
            {onDia ? (
              <button
                type="button"
                className="ta-columna-cabecera"
                data-testid="agenda-dia"
                data-dia={d}
                onClick={() => onDia(d)}
              >
                <span className="ta-columna-dia">{DIAS_CORTOS[diaDeLaSemana(d)]}</span>
                <span className="ta-columna-n">{Number(d.slice(8, 10))}</span>
              </button>
            ) : (
              <span className="ta-columna-cabecera">
                <span className="ta-columna-dia">{DIAS_CORTOS[diaDeLaSemana(d)]}</span>
                <span className="ta-columna-n">{Number(d.slice(8, 10))}</span>
              </span>
            )}

            <div className="ta-rejilla">
              {horas.map((h) => (
                <span key={h} className="ta-franja" aria-hidden="true" />
              ))}
              {colocadas.map((c) => (
                <Bloque key={c.cita.id} colocacion={c} seleccionada={c.cita.id === seleccionId} onCita={onCita} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VistaMes({
  citas,
  hoy,
  dia,
  seleccionId,
  onCita,
  onDia,
}: {
  citas: CitaAgenda[];
  hoy: string;
  dia: string;
  seleccionId: string | null;
  onCita?: (citaId: string) => void;
  onDia?: (dia: string) => void;
}) {
  const casillas = rejillaDelMes(dia);
  const mes = mesDe(dia);

  return (
    <div className="ta-mes" data-testid="agenda-mes">
      {DIAS_CORTOS.map((d) => (
        <span key={d} className="ta-mes-eti" aria-hidden="true">
          {d}
        </span>
      ))}
      {casillas.map((d) => {
        const delDia = citasDe(citas, d);
        const fuera = mesDe(d) !== mes;
        return (
          <div
            key={d}
            className={`ta-casilla${fuera ? ' es-fuera' : ''}${d === hoy ? ' es-hoy' : ''}`}
            data-testid="agenda-casilla"
            data-dia={d}
          >
            {onDia ? (
              <button type="button" className="ta-casilla-n" data-testid="agenda-dia" onClick={() => onDia(d)}>
                {Number(d.slice(8, 10))}
              </button>
            ) : (
              <span className="ta-casilla-n">{Number(d.slice(8, 10))}</span>
            )}
            <div className="ta-casilla-citas">
              {delDia.map((c) => {
                const choca = delDia.some((o) => seSolapan(c, o));
                const clase = `ta-pastilla${c.id === seleccionId ? ' es-abierta' : ''}${choca ? ' es-solapada' : ''}`;
                return onCita ? (
                  <button
                    key={c.id}
                    type="button"
                    className={clase}
                    data-testid="agenda-cita"
                    data-cita={c.id}
                    style={c.color ? { background: c.color } : undefined}
                    onClick={() => onCita(c.id)}
                  >
                    <span className="ta-pastilla-hora">{c.inicio}</span> {c.titulo}
                  </button>
                ) : (
                  <span
                    key={c.id}
                    className={clase}
                    data-testid="agenda-cita"
                    data-cita={c.id}
                    style={c.color ? { background: c.color } : undefined}
                  >
                    <span className="ta-pastilla-hora">{c.inicio}</span> {c.titulo}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function VentanaAgenda({
  citas,
  hoy,
  dia,
  vista = 'semana',
  seleccionId = null,
  onCita,
  onDia,
  onVista,
  onAvanzar,
  panel,
  aviso,
  encabezado,
  className,
}: VentanaAgendaProps) {
  return (
    <div className={`ta${className ? ` ${className}` : ''}`} data-testid="agenda-app">
      {encabezado}

      <div className="ta-barra">
        {onAvanzar && (
          <button type="button" className="ta-nav" data-testid="agenda-atras" aria-label="Atrás" onClick={() => onAvanzar(-1)}>
            ◀
          </button>
        )}
        <span className="ta-barra-dia" data-testid="agenda-titulo">
          {dia}
        </span>
        {onAvanzar && (
          <button
            type="button"
            className="ta-nav"
            data-testid="agenda-adelante"
            aria-label="Adelante"
            onClick={() => onAvanzar(1)}
          >
            ▶
          </button>
        )}
        {aviso && (
          <span className="ta-barra-aviso" data-testid="agenda-aviso">
            {aviso}
          </span>
        )}
        {onVista && (
          <span className="ta-vistas">
            {(['semana', 'mes'] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={`ta-vista${v === vista ? ' es-activa' : ''}`}
                data-vista={v}
                aria-pressed={v === vista}
                onClick={() => onVista(v)}
              >
                {v === 'semana' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </span>
        )}
      </div>

      <div className="ta-marco">
        <div className="ta-lienzo">
          {vista === 'mes' ? (
            <VistaMes citas={citas} hoy={hoy} dia={dia} seleccionId={seleccionId} onCita={onCita} onDia={onDia} />
          ) : (
            <VistaSemana citas={citas} hoy={hoy} dia={dia} seleccionId={seleccionId} onCita={onCita} onDia={onDia} />
          )}
        </div>

        {panel && (
          <aside className="ta-panel" data-testid="agenda-panel">
            {panel}
          </aside>
        )}
      </div>
    </div>
  );
}

export default VentanaAgenda;
