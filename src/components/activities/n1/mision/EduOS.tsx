'use client';

/**
 * EduOS — simulador de escritorio (port fiel de la sección #eduOS del
 * prototipo de referencia). Ventanas, apps y taskbar replican el DOM,
 * los textos y los tiempos del original; los tonos y las validaciones
 * de misión viven en el núcleo, aquí solo se emiten eventos.
 */

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import type { AppId, ArchivoGuardado, EduOSEvento, EduOSProps } from './tipos';

/** Apps que abren ventana; la papelera solo emite (el núcleo muestra el aviso). */
type AppVentana = Exclude<AppId, 'trash'>;

/** Estado de una ventana abierta (Map activeWindows + Set minimized del original). */
interface VentanaEstado {
  app: AppVentana;
  minimizada: boolean;
  maximizada: boolean;
}

/** Iconos del escritorio, verbatim del index.html original. */
const ICONOS_ESCRITORIO: ReadonlyArray<{ app: AppId; emoji: string; titulo: string }> = [
  { app: 'files', emoji: '📁', titulo: 'Mis archivos' },
  { app: 'text', emoji: '📝', titulo: 'Texto Fácil' },
  { app: 'paint', emoji: '🎨', titulo: 'Arte Digital' },
  { app: 'calc', emoji: '🧮', titulo: 'Calculadora' },
  { app: 'trash', emoji: '🗑️', titulo: 'Papelera' },
];

/** Meta de cada app con ventana (emoji + título de titlebar), como en openApp(). */
const META_APPS: Record<AppVentana, { emoji: string; titulo: string }> = {
  files: { emoji: '📁', titulo: 'Mis archivos' },
  text: { emoji: '📝', titulo: 'Texto Fácil' },
  paint: { emoji: '🎨', titulo: 'Arte Digital' },
  calc: { emoji: '🧮', titulo: 'Calculadora Escolar' },
};

/** Teclas de la calculadora, verbatim del original. */
const TECLAS_CALC = ['C', '⌫', '÷', '×', '7', '8', '9', '−', '4', '5', '6', '+', '1', '2', '3', '=', '0', '.'];

// ─── App: Mis archivos ────────────────────────────────────────────────────────

function AppArchivos({
  carpetas,
  archivos,
  onEvento,
}: {
  carpetas: string[];
  archivos: ArchivoGuardado[];
  onEvento: (evento: EduOSEvento) => void;
}) {
  // prompt() con los textos exactos del original; el núcleo actualiza las listas.
  const nuevaCarpeta = () => {
    if (typeof window === 'undefined') return;
    const nombre = window.prompt('Nombre de la nueva carpeta:', 'Mi trabajo');
    if (!nombre) return;
    onEvento({ tipo: 'crear-carpeta', nombre: nombre.trim().slice(0, 24) || 'Nueva carpeta' });
  };

  const renombrarCarpeta = (indice: number) => {
    if (typeof window === 'undefined') return;
    const actual = carpetas[indice];
    const siguiente = window.prompt('Nuevo nombre:', actual);
    if (!siguiente) return;
    onEvento({ tipo: 'renombrar-carpeta', de: actual, a: siguiente.trim().slice(0, 24) || actual });
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className="editor-save" id="newFolder" onClick={nuevaCarpeta}>＋ Nueva carpeta</button>
        <span style={{ color: '#698093', alignSelf: 'center' }}>Documentos del estudiante</span>
      </div>
      <div className="file-grid">
        {carpetas.map((carpeta, i) => (
          <button
            key={`carpeta-${i}`}
            className="file-item"
            data-folder-index={i}
            onDoubleClick={() => renombrarCarpeta(i)}
          >
            <span>📁</span><b>{carpeta}</b>
          </button>
        ))}
        {archivos.slice(-4).map((archivo, i) => (
          <button key={`archivo-${i}`} className="file-item">
            <span>{archivo.tipo === 'dibujo' ? '🖼️' : '📄'}</span><b>{archivo.nombre}</b>
          </button>
        ))}
        <button className="file-item"><span>🖼️</span><b>Ejemplo.png</b></button>
        <button className="file-item"><span>📄</span><b>Bienvenida.txt</b></button>
      </div>
    </>
  );
}

// ─── App: Texto Fácil ─────────────────────────────────────────────────────────

function AppTexto({ onEvento }: { onEvento: (evento: EduOSEvento) => void }) {
  const [valor, setValor] = useState('');
  const palabras = valor.trim() ? valor.trim().split(/\s+/).length : 0;

  return (
    <div className="text-editor">
      <div className="editor-toolbar">
        <button><b>B</b></button>
        <button><i>I</i></button>
        <button>12 px</button>
        <button>↶</button>
      </div>
      <textarea
        id="textArea"
        placeholder="Escribe aquí…"
        autoFocus
        value={valor}
        onChange={(e) => {
          const siguiente = e.target.value;
          setValor(siguiente);
          onEvento({ tipo: 'texto-cambia', contenido: siguiente });
        }}
      />
      <div className="editor-status">
        <span id="wordCount">{palabras} palabras</span>
        <button
          className="editor-save"
          id="saveText"
          onClick={() => onEvento({ tipo: 'guardar-texto', contenido: valor.trim() })}
        >
          💾 Guardar documento
        </button>
      </div>
    </div>
  );
}

// ─── App: Arte Digital ────────────────────────────────────────────────────────

function AppPintura({
  trazosRef,
  onEvento,
}: {
  /** Contador global de trazos (paintStrokeCount del original, nunca se reinicia). */
  trazosRef: { current: number };
  onEvento: (evento: EduOSEvento) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const colorRef = useRef<HTMLInputElement | null>(null);
  const dibujando = useRef(false);
  const borrador = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // Guard: jsdom no implementa canvas 2D.
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
  }, []);

  // Posición escalada al tamaño interno del canvas, como pos() del original.
  const posicion = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  };

  const alPresionar = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    dibujando.current = true;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const p = posicion(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const alMover = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dibujando.current) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const p = posicion(e);
    ctx.strokeStyle = borrador.current ? '#ffffff' : (colorRef.current?.value ?? '#167ac6');
    ctx.lineWidth = borrador.current ? 28 : 9;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    trazosRef.current += 1;
  };

  const alSoltar = () => {
    dibujando.current = false;
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="paint-layout">
      <div className="paint-tools">
        <input id="paintColor" type="color" defaultValue="#167ac6" aria-label="Color" ref={colorRef} />
        <button id="brushTool" onClick={() => { borrador.current = false; }}>🖌️</button>
        <button id="eraserTool" onClick={() => { borrador.current = true; }}>🧽</button>
        <button id="clearPaint" onClick={limpiar}>Limpiar</button>
        <button id="savePaint" onClick={() => onEvento({ tipo: 'guardar-dibujo', trazos: trazosRef.current })}>💾 Guardar</button>
      </div>
      <canvas
        id="paintCanvas"
        className="paint-canvas"
        width={900}
        height={520}
        ref={canvasRef}
        onPointerDown={alPresionar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerLeave={alSoltar}
      />
    </div>
  );
}

// ─── App: Calculadora ─────────────────────────────────────────────────────────

function AppCalculadora({ onEvento }: { onEvento: (evento: EduOSEvento) => void }) {
  const [expr, setExpr] = useState('');
  const [pantalla, setPantalla] = useState('0');

  const presionar = (k: string) => {
    if (k === 'C') {
      setExpr('');
      setPantalla('0');
      return;
    }
    if (k === '⌫') {
      const nueva = expr.slice(0, -1);
      setExpr(nueva);
      setPantalla(nueva || '0');
      return;
    }
    if (k === '=') {
      try {
        // Igual que el original: normaliza y evalúa con Function en modo estricto.
        const normalizada = expr.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-');
        const fn = new Function(`"use strict";return (${normalizada})`) as () => unknown;
        const valor = fn();
        setPantalla(String(valor));
        onEvento({ tipo: 'calculo', expresion: expr, resultado: typeof valor === 'number' ? valor : null });
      } catch {
        setPantalla('Error');
        onEvento({ tipo: 'calculo', expresion: expr, resultado: null });
      }
      return;
    }
    const nueva = expr + k;
    setExpr(nueva);
    setPantalla(nueva || '0');
  };

  return (
    <div className="calc-wrap">
      <div className="calc-display" id="calcDisplay">{pantalla}</div>
      <div className="calc-grid">
        {TECLAS_CALC.map((k) => (
          <button
            key={k}
            className={'+−×÷='.includes(k) ? 'operator' : ''}
            data-key={k}
            onClick={() => presionar(k)}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Ventana de aplicación ────────────────────────────────────────────────────

function VentanaApp({
  ventana,
  onMinimizar,
  onMaximizar,
  onCerrar,
  children,
}: {
  ventana: VentanaEstado;
  onMinimizar: () => void;
  onMaximizar: () => void;
  onCerrar: () => void;
  children: ReactNode;
}) {
  const meta = META_APPS[ventana.app];
  const clases = `app-window${ventana.maximizada ? ' maximized' : ''}${ventana.minimizada ? ' hidden' : ''}`;
  return (
    <div className={clases} data-app={ventana.app}>
      <div className="window-titlebar">
        <span>{meta.emoji}</span>
        <strong className="window-title">{meta.titulo}</strong>
        <div className="window-controls window-actions">
          <button data-action="minimize" onClick={onMinimizar}>—</button>
          <button data-action="maximize" onClick={onMaximizar}>□</button>
          <button data-action="close" onClick={onCerrar}>×</button>
        </div>
      </div>
      <div className="window-body window-content">{children}</div>
    </div>
  );
}

// ─── Shell EduOS ──────────────────────────────────────────────────────────────

export default function EduOS(props: EduOSProps) {
  // El contador de trazos vive fuera del shell (paintStrokeCount global del original).
  const trazosRef = useRef(0);
  if (!props.visible) return null;
  // El shell se monta/desmonta con visible: cada entrada inicia limpia, como openOS().
  return <EduOSShell {...props} trazosRef={trazosRef} />;
}

function EduOSShell(props: EduOSProps & { trazosRef: { current: number } }) {
  const { instruccion, reloj, archivos, carpetas, onEvento, onSalir, trazosRef, permitirAbrir, apiRef } = props;
  const [ventanas, setVentanas] = useState<VentanaEstado[]>([]);
  const [iconoSeleccionado, setIconoSeleccionado] = useState<AppId | null>(null);
  const [avisoMenu, setAvisoMenu] = useState('');
  const avisoTimer = useRef<number | null>(null);

  // Limpieza del temporizador del aviso del menú.
  useEffect(() => () => {
    if (avisoTimer.current !== null && typeof window !== 'undefined') window.clearTimeout(avisoTimer.current);
  }, []);

  // Cierres programáticos del núcleo (closeWindow de la referencia).
  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      cerrarVentana: (app) => setVentanas((prev) => prev.filter((v) => v.app !== app)),
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef]);

  const abrirApp = (app: AppId) => {
    // Guardia de la misión (openApp de la referencia): si no procede, el
    // núcleo ya mostró el error correspondiente y la app no se abre.
    if (permitirAbrir && !permitirAbrir(app)) return;
    if (app === 'trash') {
      // La papelera no abre ventana en el original.
      return;
    }
    if (ventanas.some((v) => v.app === app)) {
      // Ya abierta: se restaura, como openApp() → restoreWindow() del original.
      setVentanas((prev) => prev.map((v) => (v.app === app ? { ...v, minimizada: false } : v)));
      onEvento({ tipo: 'restaurar', app });
      return;
    }
    setVentanas((prev) => [...prev, { app, minimizada: false, maximizada: false }]);
    onEvento({ tipo: 'abrir-app', app });
  };

  const minimizar = (app: AppVentana) => {
    setVentanas((prev) => prev.map((v) => (v.app === app ? { ...v, minimizada: true } : v)));
    onEvento({ tipo: 'minimizar', app });
  };

  const restaurar = (app: AppVentana) => {
    setVentanas((prev) => prev.map((v) => (v.app === app ? { ...v, minimizada: false } : v)));
    onEvento({ tipo: 'restaurar', app });
  };

  const maximizar = (app: AppVentana) => {
    setVentanas((prev) => prev.map((v) => (v.app === app ? { ...v, maximizada: !v.maximizada } : v)));
    onEvento({ tipo: 'maximizar', app });
  };

  const cerrar = (app: AppVentana) => {
    setVentanas((prev) => prev.filter((v) => v.app !== app));
    onEvento({ tipo: 'cerrar-app', app });
  };

  // Botón ◈: mismo aviso del original (no existe evento en el contrato, es local).
  const avisarMenu = () => {
    setAvisoMenu('Menú EduOS: selecciona una aplicación del escritorio.');
    if (typeof window === 'undefined') return;
    if (avisoTimer.current !== null) window.clearTimeout(avisoTimer.current);
    avisoTimer.current = window.setTimeout(() => setAvisoMenu(''), 2600);
  };

  return (
    <section id="eduOS" className="os-shell" aria-label="Simulación EduOS">
      <div className="os-topbar">
        <strong className="os-brand">EduOS</strong>
        <span id="osInstruction" className="os-instruction">{instruccion}</span>
        <button id="exitOSButton" onClick={onSalir}>Salir del escritorio</button>
      </div>
      <div className="desktop" id="desktop">
        {ICONOS_ESCRITORIO.map((icono) => (
          <button
            key={icono.app}
            className={`desktop-icon${iconoSeleccionado === icono.app ? ' selected' : ''}`}
            data-app={icono.app}
            onClick={() => setIconoSeleccionado(icono.app)}
            onDoubleClick={() => abrirApp(icono.app)}
          >
            <span>{icono.emoji}</span><b>{icono.titulo}</b>
          </button>
        ))}
        <div id="windowLayer" className="window-layer">
          {ventanas.map((ventana) => (
            <VentanaApp
              key={ventana.app}
              ventana={ventana}
              onMinimizar={() => minimizar(ventana.app)}
              onMaximizar={() => maximizar(ventana.app)}
              onCerrar={() => cerrar(ventana.app)}
            >
              {ventana.app === 'files' && <AppArchivos carpetas={carpetas} archivos={archivos} onEvento={onEvento} />}
              {ventana.app === 'text' && <AppTexto onEvento={onEvento} />}
              {ventana.app === 'paint' && <AppPintura trazosRef={trazosRef} onEvento={onEvento} />}
              {ventana.app === 'calc' && <AppCalculadora onEvento={onEvento} />}
            </VentanaApp>
          ))}
        </div>
      </div>
      <div className="taskbar">
        <button id="osMenuButton" className="os-menu-button" onClick={avisarMenu}>◈</button>
        <div id="taskButtons" className="task-buttons">
          {ventanas.map((ventana) => (
            <button
              key={ventana.app}
              className="task-button"
              data-app={ventana.app}
              onClick={() => restaurar(ventana.app)}
            >
              {META_APPS[ventana.app].titulo}
            </button>
          ))}
        </div>
        <div className="system-tray">
          <span>🔊</span><span>📶</span><time id="osClock" className="os-clock">{reloj}</time>
        </div>
      </div>
      <div className={avisoMenu ? 'toast show success' : 'toast'} role="status">{avisoMenu}</div>
    </section>
  );
}
