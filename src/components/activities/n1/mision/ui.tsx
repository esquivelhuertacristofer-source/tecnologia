'use client';

// Misión: Aprende Computación — componentes presentacionales (port fiel).
// DOM y textos verbatim de index.html/app.js; el robot se llama BIT.

import { useRef } from 'react';
import type {
  PropsPantallaCarga,
  PropsPantallaInicio,
  PropsHUD,
  PropsPanelBit,
  PropsTarjetaInteraccion,
  PropsBarraInferior,
  PropsToast,
  PropsPantallaMenu,
  PropsPantallaDocente,
  PropsPantallaFinal,
} from './tipos';

/** Compone la clase de pantallas/modales siempre montados (toggle .visible). */
function claseVisible(base: string, visible: boolean): string {
  return visible ? `${base} visible` : base;
}

/** Pantalla de carga con loader orbital, igual al #loadingScreen original. */
export function PantallaCarga(props: PropsPantallaCarga) {
  return (
    <div className={claseVisible('screen screen--loading', props.visible)} aria-hidden={!props.visible}>
      <div className="loader-orbit"><span /><span /><span /></div>
      <h1>Preparando el laboratorio…</h1>
      <p>Bit está revisando los equipos.</p>
    </div>
  );
}

/** Pantalla de inicio (#startScreen): nombre del estudiante y arranque. */
export function PantallaInicio(props: PropsPantallaInicio) {
  const nombreRef = useRef<HTMLInputElement>(null);
  return (
    <section className={claseVisible('screen screen--start', props.visible)} aria-hidden={!props.visible}>
      <div className="start-card glass-heavy">
        <div className="brand-lockup">
          <div className="brand-mark">B</div>
          <div>
            <span>VIDEOJUEGO EDUCATIVO 3D</span>
            <h1>Misión:<br />Aprende Computación</h1>
          </div>
        </div>
        <p>Explora un laboratorio, reconoce sus componentes, conecta el equipo, enciéndelo y aprende a usar programas básicos.</p>
        <label className="field-label">Nombre o alias del estudiante
          <input ref={nombreRef} defaultValue={props.nombreInicial} maxLength={24} placeholder="Ej. Alex" autoComplete="off" />
        </label>
        <div className="start-actions">
          <button
            type="button"
            className="primary-button primary-button--large"
            onClick={() => props.onComenzar(nombreRef.current ? nombreRef.current.value : '')}
          >
            Comenzar misión
          </button>
          <button
            type="button"
            className={props.puedeContinuar ? 'secondary-button' : 'secondary-button hidden'}
            onClick={props.onContinuar}
          >
            Continuar progreso
          </button>
        </div>
        <div className="feature-row">
          <span>🧩 6 módulos</span><span>🖥️ Simulación de escritorio</span><span>🏅 Insignias</span>
        </div>
      </div>
    </section>
  );
}

/** HUD superior: menú, módulo actual, objetivo, progreso, estrellas y sonido. */
export function HUD(props: PropsHUD) {
  return (
    <header className="hud glass">
      <button type="button" className="icon-button" aria-label="Abrir menú" onClick={props.onMenu}>☰</button>
      <div className="mission-copy">
        <span>{props.eyebrow}</span>
        <strong>{props.icono} {props.titulo}</strong>
        <small>{props.objetivo}</small>
      </div>
      <div className="hud-progress" aria-label="Progreso de la misión">
        <div className="progress-label"><span>Progreso</span><b>{props.progresoPct}%</b></div>
        <div className="progress-track"><span style={{ width: `${props.progresoPct}%` }} /></div>
      </div>
      <div className="stars" title="Estrellas obtenidas">★ <span>{props.estrellas}</span></div>
      <button type="button" className="icon-button" aria-label="Activar o desactivar sonido" onClick={props.onToggleSonido}>
        {props.sonidoActivo ? '🔊' : '🔇'}
      </button>
    </header>
  );
}

/** Panel del robot BIT (#bytePanel): avatar CSS, mensaje y botón repetir. */
export function PanelBit(props: PropsPanelBit) {
  return (
    <aside className="byte-panel glass">
      <div className="byte-avatar" aria-hidden="true">
        <div className="antenna" />
        <div className="robot-face"><i /><i /></div>
      </div>
      <div>
        <strong>BIT</strong>
        <p>{props.mensaje}</p>
      </div>
      <button type="button" className="mini-button" onClick={props.onRepetir}>↻ Repetir</button>
    </aside>
  );
}

/** Tarjeta de información del objeto identificado (#interactionCard). */
export function TarjetaInteraccion(props: PropsTarjetaInteraccion) {
  return (
    <section
      className={props.visible ? 'interaction-card glass' : 'interaction-card glass hidden'}
      aria-live="polite"
      aria-hidden={!props.visible}
    >
      <span>{props.tag}</span>
      <h2>{props.nombre}</h2>
      <p>{props.descripcion}</p>
      <button type="button" className="primary-button" onClick={props.onContinuar}>{props.textoBoton}</button>
    </section>
  );
}

/** Barra inferior de acciones: pista, módulos, centrar vista y docente. */
export function BarraInferior(props: PropsBarraInferior) {
  return (
    <nav className="bottom-bar glass">
      <button type="button" onClick={props.onPista}><span>💡</span>Pista</button>
      <button type="button" onClick={props.onModulos}><span>◫</span>Módulos</button>
      <button type="button" onClick={props.onCentrar}><span>⌂</span>Centrar vista</button>
      <button type="button" onClick={props.onDocente}><span>▦</span>Docente</button>
    </nav>
  );
}

/** Aviso flotante (#toast) con toggle .show como el original. */
export function ToastMision(props: PropsToast) {
  return (
    <div className={props.visible ? 'toast show' : 'toast'} role="status">{props.mensaje}</div>
  );
}

/** Menú de módulos (#menuScreen): tarjetas como renderModuleCards. */
export function PantallaMenu(props: PropsPantallaMenu) {
  return (
    <section className={claseVisible('modal', props.visible)} role="dialog" aria-modal="true" aria-hidden={!props.visible}>
      <div className="modal-card glass-heavy">
        <button type="button" className="close-button" aria-label="Cerrar" onClick={props.onCerrar}>×</button>
        <span className="eyebrow">CENTRO DE MISIONES</span>
        <h2>Selecciona un módulo</h2>
        <div className="module-grid">
          {props.modulos.map((m) => (
            <button
              key={m.indice}
              type="button"
              className={m.completado ? 'module-card complete' : 'module-card'}
              disabled={m.bloqueado}
              aria-current={m.actual ? 'true' : undefined}
              aria-label={`${m.icono} ${m.titulo}: ${m.bloqueado ? 'Bloqueado' : m.completado ? 'Completado' : 'Disponible'}`}
              onClick={() => props.onSeleccionar(m.indice)}
            >
              <span>{m.indice === 6 ? 'EVALUACIÓN' : `MÓDULO ${m.indice + 1}`}</span>
              <h3>{m.icono} {m.titulo}</h3>
              <p>{m.resumen}</p>
              {m.completado ? <b>✓</b> : null}
            </button>
          ))}
        </div>
        <div className="modal-footer">
          <button type="button" className="salir-hub" onClick={props.onSalirHub}>Salir al hub</button>
          <button type="button" className="danger-button" onClick={props.onReiniciar}>Reiniciar progreso</button>
          <button type="button" className="secondary-button" onClick={props.onCerrar}>Volver al laboratorio</button>
        </div>
      </div>
    </section>
  );
}

/** Panel para docentes (#teacherScreen): métricas, filas y exportación. */
export function PantallaDocente(props: PropsPantallaDocente) {
  return (
    <section className={claseVisible('modal', props.visible)} role="dialog" aria-modal="true" aria-hidden={!props.visible}>
      <div className="modal-card modal-card--wide glass-heavy">
        <button type="button" className="close-button" aria-label="Cerrar" onClick={props.onCerrar}>×</button>
        <span className="eyebrow">PANEL LOCAL</span>
        <h2>Reporte para docentes</h2>
        <div className="metrics-grid">
          {props.metricas.map((m, i) => (
            <div className="metric-card" key={i}>
              <span>{m.etiqueta}</span>
              <strong>{m.valor}</strong>
            </div>
          ))}
        </div>
        <div className="report-section">
          <h3>Progreso por módulo</h3>
          <div className="report-list">
            {props.filas.map((f, i) => (
              <div className="report-row" key={i}>
                <div><b>{f.titulo}</b><br /><span>{f.detalle}</span></div>
                <strong>{f.estado}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="primary-button" onClick={props.onExportarCSV}>Exportar CSV</button>
          <button type="button" className="secondary-button" onClick={props.onCerrar}>Cerrar</button>
        </div>
      </div>
    </section>
  );
}

/** Pantalla de misión completada (#completionScreen). */
export function PantallaFinal(props: PropsPantallaFinal) {
  return (
    <section className={claseVisible('screen', props.visible)} aria-hidden={!props.visible}>
      <div className="completion-card glass-heavy">
        <div className="trophy">🏆</div>
        <span className="eyebrow">MISIÓN COMPLETADA</span>
        <h2>¡Laboratorio listo!</h2>
        <p>{props.mensaje ?? 'Has aprendido a reconocer, conectar y utilizar una computadora.'}</p>
        <div className="metrics-grid">
          {props.stats.map((s, i) => (
            <div className="metric-card" key={i}>
              <span>{s.etiqueta}</span>
              <strong>{s.valor}</strong>
            </div>
          ))}
        </div>
        <div className="badge-list">
          {props.insignias.map((b, i) => (
            <span className="badge" key={i}>🏅 {b.nombre}</span>
          ))}
        </div>
        <button type="button" className="primary-button primary-button--large" onClick={props.onVolver}>Volver a explorar</button>
      </div>
    </section>
  );
}
