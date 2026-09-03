'use client';

/**
 * TECNIA DISEÑO · la ventana
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * El editor gráfico por dentro: barra de herramientas, lienzo con su rejilla,
 * panel de capas, historial de pasos y el hueco donde cada clase mete lo suyo.
 * **Cero `useState`**: todo entra por parámetro, como en `VentanaHojas`. Quien
 * tiene el estado es `useDiseno`.
 *
 * Se monta dentro de `VentanaBase`, que pone el marco y la barra de título:
 *
 *     <VentanaBase marca="Tecnia Diseño" subtitulo="Cartel">
 *       <VentanaDiseno … panel={<MiPanelDeLaClase />} />
 *     </VentanaBase>
 *
 * ── DIVS Y SVG, NUNCA `<canvas>` ──────────────────────────────────────────
 *
 * Cada capa es un `<div>` colocado con `left/top/width/height` en píxeles y
 * girado con `transform`, y dentro lleva un `<svg>` en línea cuando la figura
 * no es un rectángulo. Los tres motivos, por orden de peso:
 *
 * 1. **Se puede corregir.** Una prueba lee `[data-capa="titulo"]` y su
 *    `data-caja`. En un `<canvas>` el trabajo del alumno es una imagen de
 *    píxeles: para saber si el título está centrado habría que volver a
 *    dibujarlo aparte, y entonces se corrige una copia, no lo que se ve.
 * 2. **Se puede leer.** Cada capa es un elemento con `role` y `aria-label`, y
 *    se puede enfocar con el tabulador y mover con las flechas. Un `<canvas>`
 *    es un agujero negro para un lector de pantalla.
 * 3. **El texto es texto.** Un `<div>` da salto de línea, selección y la única
 *    medición honesta de «no cabe» (`scrollHeight > clientHeight`), que es la
 *    que usa `verificar()`. En `<canvas>` habría que maquetar a mano.
 *
 * Y el `<svg>` va DENTRO de la capa, no como lienzo entero: así una elipse o
 * una estrella son vectores de verdad, sin perder que cada capa siga siendo un
 * elemento del documento.
 */

import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react';
import {
  accion,
  HERRAMIENTAS,
  type Accion,
  type HerramientaId,
} from './comandos';
import type { Gesto } from './arrastre';
import { empujar, MANGO_GIRO_PX } from './arrastre';
import {
  altoPx,
  anchoPx,
  cajaEnPixeles,
  cajaEntera,
  cssDe,
  FIGURAS,
  normalizarGiro,
  NOMBRE_FIGURA,
  TIRADORES,
  type Caja,
  type Capa,
  type CapaId,
  type Documento,
  type Figura,
  type PaginaId,
  type Recorte,
  type Tirador,
} from './modelo';
import type { Paso } from './historia';
import { corteEn } from './cinta';
import { LineaDeTiempo, type LineaDeTiempoProps } from './LineaDeTiempo';
import './ventanaDiseno.css';

/** Los cuatro lados del recorte, con su glifo para el botón. */
const LADOS_RECORTE: readonly { lado: keyof Recorte; glifo: string; nombre: string }[] = [
  { lado: 'arriba', glifo: '⬆', nombre: 'Arriba' },
  { lado: 'abajo', glifo: '⬇', nombre: 'Abajo' },
  { lado: 'izquierda', glifo: '⬅', nombre: 'Izquierda' },
  { lado: 'derecha', glifo: '➡', nombre: 'Derecha' },
];

export interface InicioDeGesto {
  tipo: 'mover' | 'tirar' | 'girar';
  capa: CapaId;
  x: number;
  y: number;
  tirador?: Tirador;
}

export interface VentanaDisenoProps {
  documento: Documento;
  pagina: PaginaId;
  seleccion: readonly CapaId[];
  /** Lo que la actividad dejó disponible. Lo que no esté, no se pinta. */
  herramientas: readonly HerramientaId[] | 'todas';
  herramienta: HerramientaId;
  onHerramienta?: (h: HerramientaId) => void;
  /** El gesto en curso, para pintar el fantasma. */
  gesto?: Gesto | null;
  /** Zoom de la vista: 1 = 100 %. */
  escala?: number;

  onSeleccionar?: (capa: CapaId | null, sumar: boolean) => void;
  onGestoInicio?: (o: InicioDeGesto) => void;
  onGestoMover?: (x: number, y: number) => void;
  onGestoSoltar?: () => void;
  /** Todo lo que no es arrastrar: pintar, ordenar, borrar, escribir… */
  onAccion?: (a: Accion) => void;
  /** Los identificadores de las capas nuevas los da el estado, no la ventana. */
  nuevoId?: (prefijo?: string) => string;

  onDeshacer?: () => void;
  onRehacer?: () => void;
  puedeDeshacer?: boolean;
  puedeRehacer?: boolean;
  /** Los pasos del alumno, en frases. Si no se pasan, no hay panel de pasos. */
  pasos?: readonly Paso[];
  rechazo?: string | null;

  onIrA?: (p: PaginaId) => void;
  /** ← AQUÍ divergen las 8 clases. */
  panel?: ReactNode;
  encabezado?: ReactNode;
  className?: string;

  /**
   * Si llega, se monta `LineaDeTiempo` bajo el lienzo y el lienzo hace de
   * monitor: pinta, debajo de las capas, el fondo del recurso que toca en
   * el segundo del cabezal (`corteEn` sobre la pista de tipo `'video'`). Si
   * no hay corte en ese segundo, no se pinta nada.
   */
  cinta?: LineaDeTiempoProps;
}

/* ── la figura, en SVG dentro de la capa ──────────────────────────────────── */

function DibujoDeFigura({ figura, relleno, borde }: { figura: Figura; relleno: string | null; borde: string | null }) {
  const trazo = borde ?? 'none';
  const pintura = relleno ?? 'none';
  const comun = { fill: pintura, stroke: trazo, strokeWidth: borde ? 4 : 0, vectorEffect: 'non-scaling-stroke' as const };
  return (
    <svg className="dis-figura" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {figura === 'rect' && <rect x="0" y="0" width="100" height="100" {...comun} />}
      {figura === 'redondeado' && <rect x="0" y="0" width="100" height="100" rx="12" ry="12" {...comun} />}
      {figura === 'elipse' && <ellipse cx="50" cy="50" rx="50" ry="50" {...comun} />}
      {figura === 'triangulo' && <polygon points="50,0 100,100 0,100" {...comun} />}
      {figura === 'estrella' && (
        <polygon points="50,0 61,35 98,35 68,57 79,92 50,70 21,92 32,57 2,35 39,35" {...comun} />
      )}
      {figura === 'linea' && <line x1="0" y1="50" x2="100" y2="50" stroke={trazo || '#fff'} strokeWidth="6" />}
      {figura === 'flecha' && <polygon points="0,35 60,35 60,10 100,50 60,90 60,65 0,65" {...comun} />}
    </svg>
  );
}

/* ── una capa ─────────────────────────────────────────────────────────────── */

function CapaPintada({
  doc,
  capa,
  caja,
  giro,
  seleccionada,
  onPointerDown,
  onKeyDown,
}: {
  doc: Documento;
  capa: Capa;
  caja: Caja;
  giro: number;
  seleccionada: boolean;
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}) {
  const p = cajaEnPixeles(caja, doc.lienzo);
  const estilo: CSSProperties = {
    left: p.x,
    top: p.y,
    width: p.ancho,
    height: p.alto,
    transform: giro ? `rotate(${giro}deg)` : undefined,
    opacity: capa.opacidad / 10,
    visibility: capa.oculta ? 'hidden' : undefined,
  };

  let dentro: ReactNode = null;
  if (capa.tipo === 'forma') {
    dentro = <DibujoDeFigura figura={capa.figura} relleno={cssDe(doc, capa.relleno)} borde={cssDe(doc, capa.borde)} />;
  } else if (capa.tipo === 'texto') {
    dentro = (
      <div
        className="dis-texto"
        data-texto={capa.id}
        style={{
          color: cssDe(doc, capa.color) ?? '#fff',
          fontSize: `${capa.pt}px`,
          fontWeight: capa.negrita ? 900 : 600,
          textAlign: capa.alineacion === 'izq' ? 'left' : capa.alineacion === 'der' ? 'right' : 'center',
        }}
      >
        {capa.texto}
      </div>
    );
  } else {
    const rec = doc.banco[capa.recurso];
    const entera = cajaEntera(capa);
    const celda = doc.lienzo.celdaPx;
    dentro = (
      <div
        className="dis-imagen"
        style={{
          /* `backgroundImage` y no `background`: mezclar la abreviatura con
           * `backgroundSize` deja a React avisando de un conflicto en cada
           * repintado, y el aviso tiene razón —la abreviatura reinicia lo
           * demás—. Salió al arrastrar una foto en las pruebas. */
          backgroundImage:
            rec?.fondo ?? 'repeating-linear-gradient(45deg,#334155,#334155 8px,#1e293b 8px,#1e293b 16px)',
          backgroundSize: `${entera.cols * celda}px ${entera.filas * celda}px`,
          backgroundPosition: `${-capa.recorte.izquierda * celda}px ${-capa.recorte.arriba * celda}px`,
        }}
      >
        {rec?.glifo && <span className="dis-glifo">{rec.glifo}</span>}
      </div>
    );
  }

  return (
    <div
      className="dis-capa"
      role="button"
      tabIndex={0}
      aria-label={`${capa.nombre}${capa.bloqueada ? ', bloqueada' : ''}`}
      aria-pressed={seleccionada}
      data-capa={capa.id}
      data-tipo={capa.tipo}
      data-caja={`${caja.col},${caja.fila},${caja.cols},${caja.filas}`}
      data-giro={giro}
      data-sel={seleccionada ? 'si' : undefined}
      data-bloqueada={capa.bloqueada ? 'si' : undefined}
      style={estilo}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      {dentro}
    </div>
  );
}

/* ── la ventana ───────────────────────────────────────────────────────────── */

export function VentanaDiseno(props: VentanaDisenoProps) {
  const {
    documento: doc,
    pagina,
    seleccion,
    herramientas,
    herramienta,
    gesto,
    escala = 1,
    onHerramienta,
    onSeleccionar,
    onGestoInicio,
    onGestoMover,
    onGestoSoltar,
    onAccion,
    nuevoId,
    onDeshacer,
    onRehacer,
    puedeDeshacer,
    puedeRehacer,
    pasos,
    rechazo,
    onIrA,
    panel,
    encabezado,
    className,
    cinta,
  } = props;

  const hay = (h: HerramientaId) => herramientas === 'todas' || herramientas.includes(h);
  const pag = doc.paginas.find((p) => p.id === pagina) ?? doc.paginas[0];
  const capas = pag?.capas ?? [];
  const unica = seleccion.length === 1 ? capas.find((c) => c.id === seleccion[0]) : undefined;
  const disponibles = (Object.keys(HERRAMIENTAS) as HerramientaId[]).filter((h) => hay(h));

  const pistaVideo = cinta?.cinta.find((p) => p.tipo === 'video') ?? null;
  const corteMonitor = pistaVideo && cinta ? corteEn(pistaVideo, cinta.segundo) : null;
  const recursoMonitor = corteMonitor ? cinta?.banco[corteMonitor.recurso] : null;

  const mandar = (a: Accion) => onAccion?.(a);

  const crear = (tipo: 'forma' | 'texto' | 'imagen', extra: Record<string, string | number>) => {
    const id = nuevoId?.(tipo[0]) ?? `${tipo}-${capas.length + 1}`;
    const comun = { pagina: pag?.id ?? '', id, col: 0, fila: 0 };
    /* Nace en el centro del lienzo y NO donde estaba el ratón: así crear no
     * necesita las coordenadas del puntero y el motor sigue siendo puro. */
    if (tipo === 'forma') {
      const cols = 4;
      mandar(
        accion('nueva-forma', {
          ...comun,
          col: Math.floor((doc.lienzo.cols - cols) / 2),
          fila: Math.floor((doc.lienzo.filas - cols) / 2),
          cols,
          filas: cols,
          ...extra,
        }),
      );
    } else if (tipo === 'texto') {
      const cols = Math.min(6, doc.lienzo.cols);
      mandar(
        accion('nuevo-texto', {
          ...comun,
          col: Math.floor((doc.lienzo.cols - cols) / 2),
          fila: Math.floor(doc.lienzo.filas / 2) - 1,
          cols,
          filas: 2,
          texto: 'Escribe aquí',
          ...extra,
        }),
      );
    } else {
      mandar(accion('nueva-imagen', { ...comun, col: 1, fila: 1, ...extra }));
    }
  };

  const alTeclearEnCapa = (e: KeyboardEvent<HTMLDivElement>, capa: Capa) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (hay('borrar')) mandar(accion('borrar', { pagina: pag?.id ?? '', capa: capa.id }));
      e.preventDefault();
      return;
    }
    const destino = empujar(capa.caja, e.key, doc.lienzo);
    if (!destino) return;
    e.preventDefault();
    mandar(accion('mover', { pagina: pag?.id ?? '', capa: capa.id, col: destino.col, fila: destino.fila }));
  };

  const sel = gesto ? { capa: gesto.capa, caja: gesto.caja, giro: gesto.giro } : null;
  const cajaVista = (c: Capa): Caja => (sel && sel.capa === c.id ? sel.caja : c.caja);
  const giroVista = (c: Capa): number => (sel && sel.capa === c.id ? sel.giro : c.giro);
  const marco = unica ? cajaEnPixeles(cajaVista(unica), doc.lienzo) : null;

  return (
    <div className={`dis-marco${className ? ` ${className}` : ''}`} data-testid="dis-ventana">
      {encabezado}

      {/* ── barra de herramientas: sólo lo que la actividad dejó ── */}
      <div className="dis-barra" role="toolbar" aria-label="Herramientas">
        {disponibles.map((h) => (
          <button
            key={h}
            type="button"
            className={`dis-herr${h === herramienta ? ' dis-on' : ''}`}
            data-herramienta={h}
            aria-pressed={h === herramienta}
            title={HERRAMIENTAS[h].nombre}
            onClick={() => onHerramienta?.(h)}
          >
            <span aria-hidden="true">{HERRAMIENTAS[h].glifo}</span>
            <span className="dis-herr-txt">{HERRAMIENTAS[h].nombre}</span>
          </button>
        ))}
        <span className="dis-hueco" />
        <button type="button" className="dis-btn" data-accion="deshacer" disabled={!puedeDeshacer} onClick={onDeshacer}>
          ↶ Deshacer
        </button>
        <button type="button" className="dis-btn" data-accion="rehacer" disabled={!puedeRehacer} onClick={onRehacer}>
          ↷ Rehacer
        </button>
      </div>

      {/* ── la segunda fila cambia con la herramienta activa ── */}
      <div className="dis-opciones" data-testid="dis-opciones">
        {herramienta === 'forma' && hay('forma') && (
          <>
            {FIGURAS.map((f) => (
              <button
                key={f}
                type="button"
                className="dis-btn"
                data-figura={f}
                onClick={() => crear('forma', { figura: f })}
              >
                {NOMBRE_FIGURA[f]}
              </button>
            ))}
          </>
        )}
        {herramienta === 'texto' && hay('texto') && (
          <>
            <button type="button" className="dis-btn" data-accion="nuevo-texto" onClick={() => crear('texto', {})}>
              + Cuadro de texto
            </button>
            {unica?.tipo === 'texto' && (
              <>
                <input
                  className="dis-entrada"
                  aria-label="Texto de la capa"
                  data-entrada="texto"
                  value={unica.texto}
                  onChange={(e) =>
                    mandar(accion('escribir', { pagina: pag.id, capa: unica.id, texto: e.target.value }))
                  }
                />
                {(['izq', 'centro', 'der'] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`dis-btn${unica.alineacion === a ? ' dis-on' : ''}`}
                    data-alineacion={a}
                    onClick={() => mandar(accion('alinear-texto', { pagina: pag.id, capa: unica.id, alineacion: a }))}
                  >
                    {a === 'izq' ? '⯇' : a === 'centro' ? '≡' : '⯈'}
                  </button>
                ))}
              </>
            )}
          </>
        )}
        {herramienta === 'imagen' && hay('imagen') && (
          <>
            {Object.values(doc.banco).map((r) => (
              <button
                key={r.id}
                type="button"
                className="dis-btn"
                data-recurso={r.id}
                title={`${r.nombre} · ${r.autor} · ${r.licencia}`}
                onClick={() =>
                  crear('imagen', {
                    recurso: r.id,
                    cols: r.proporcion?.cols ?? 6,
                    filas: r.proporcion?.filas ?? 6,
                  })
                }
              >
                {r.glifo ?? '🖼'} {r.nombre}
              </button>
            ))}
          </>
        )}
        {herramienta === 'color' && hay('color') && (
          <>
            {Object.entries(doc.paleta).map(([id, t]) => (
              <button
                key={id}
                type="button"
                className="dis-tinta"
                data-tinta={id}
                aria-label={t.nombre}
                title={t.nombre}
                style={{ background: t.css }}
                onClick={() =>
                  mandar(
                    unica
                      ? accion('relleno', { pagina: pag.id, capa: unica.id, color: id })
                      : accion('fondo', { pagina: pag.id, color: id }),
                  )
                }
              />
            ))}
            <span className="dis-nota">{unica ? `pinta «${unica.nombre}»` : 'pinta el fondo'}</span>
          </>
        )}
        {herramienta === 'orden' && hay('orden') && unica && (
          <>
            {(
              [
                ['frente', 'Traer al frente'],
                ['subir', 'Subir una'],
                ['bajar', 'Bajar una'],
                ['atras', 'Enviar atrás'],
              ] as const
            ).map(([a, txt]) => (
              <button
                key={a}
                type="button"
                className="dis-btn"
                data-orden={a}
                onClick={() => mandar(accion('orden', { pagina: pag.id, capa: unica.id, a }))}
              >
                {txt}
              </button>
            ))}
          </>
        )}
        {herramienta === 'alinear' && hay('alinear') && (
          <>
            {unica && (
              <>
                <button
                  type="button"
                  className="dis-btn"
                  data-centrar="h"
                  onClick={() => mandar(accion('centrar', { pagina: pag.id, capa: unica.id, eje: 'h' }))}
                >
                  Centrar ↔
                </button>
                <button
                  type="button"
                  className="dis-btn"
                  data-centrar="v"
                  onClick={() => mandar(accion('centrar', { pagina: pag.id, capa: unica.id, eje: 'v' }))}
                >
                  Centrar ↕
                </button>
              </>
            )}
            {seleccion.length > 1 &&
              (['izq', 'centro', 'der', 'arriba', 'medio', 'abajo'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  className="dis-btn"
                  data-alinear={b}
                  onClick={() => mandar(accion('alinear', { pagina: pag.id, capas: [...seleccion], borde: b }))}
                >
                  {b}
                </button>
              ))}
          </>
        )}
        {herramienta === 'cinta' && hay('cinta') && (
          <>
            {Object.values(doc.banco)
              .filter((r) => r.segundos !== undefined)
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="dis-btn"
                  data-clip={r.id}
                  title={`${r.nombre} · ${r.segundos}s`}
                  onClick={() =>
                    mandar(
                      accion('poner-corte', {
                        pista: r.tipoMedia ?? 'video',
                        id: nuevoId?.('t') ?? `${r.id}-copia`,
                        recurso: r.id,
                      }),
                    )
                  }
                >
                  {r.glifo ?? '🎞'} {r.nombre} · {r.segundos}s
                </button>
              ))}
          </>
        )}
        {herramienta === 'recorte' && hay('recorte') && unica && unica.tipo === 'imagen' && (
          <>
            {LADOS_RECORTE.map(({ lado, glifo, nombre }) => (
              <span key={lado} className="dis-recorte-grupo">
                <button
                  type="button"
                  className="dis-btn"
                  data-recorte={`${lado}-menos`}
                  title={`${nombre} −`}
                  onClick={() =>
                    mandar(
                      accion('recortar', {
                        pagina: pag.id,
                        capa: unica.id,
                        [lado]: Math.max(0, unica.recorte[lado] - 1),
                      }),
                    )
                  }
                >
                  {glifo} −
                </button>
                <button
                  type="button"
                  className="dis-btn"
                  data-recorte={`${lado}-mas`}
                  title={`${nombre} +`}
                  onClick={() =>
                    mandar(accion('recortar', { pagina: pag.id, capa: unica.id, [lado]: unica.recorte[lado] + 1 }))
                  }
                >
                  {glifo} +
                </button>
              </span>
            ))}
          </>
        )}
        {herramienta === 'giro' && hay('giro') && unica && (
          <>
            <button
              type="button"
              className="dis-btn"
              data-giro="menos15"
              onClick={() => mandar(accion('girar', { pagina: pag.id, capa: unica.id, giro: normalizarGiro(unica.giro - 15) }))}
            >
              ↺ 15°
            </button>
            <button
              type="button"
              className="dis-btn"
              data-giro="mas15"
              onClick={() => mandar(accion('girar', { pagina: pag.id, capa: unica.id, giro: normalizarGiro(unica.giro + 15) }))}
            >
              ↻ 15°
            </button>
            <span className="dis-nota">{unica.giro}°</span>
          </>
        )}
        {herramienta === 'borrar' && hay('borrar') && unica && (
          <button
            type="button"
            className="dis-btn dis-peligro"
            data-accion="borrar"
            onClick={() => mandar(accion('borrar', { pagina: pag.id, capa: unica.id }))}
          >
            🗑 Borrar «{unica.nombre}»
          </button>
        )}
        {herramienta === 'duplicar' && hay('duplicar') && unica && (
          <button
            type="button"
            className="dis-btn"
            data-accion="duplicar"
            onClick={() =>
              mandar(accion('duplicar', { pagina: pag.id, capa: unica.id, id: nuevoId?.('d') ?? `${unica.id}-copia` }))
            }
          >
            ⧉ Duplicar
          </button>
        )}
        {rechazo && (
          <span className="dis-rechazo" role="status" data-testid="dis-rechazo">
            {rechazo}
          </span>
        )}
      </div>

      <div className="dis-medio">
        {/* ── el tapete y el lienzo ── */}
        <div
          className="dis-tapete"
          onPointerMove={(e) => onGestoMover?.(e.clientX, e.clientY)}
          onPointerUp={() => onGestoSoltar?.()}
          onPointerLeave={() => onGestoSoltar?.()}
        >
          <div
            className="dis-lienzo"
            data-testid="dis-lienzo"
            data-pagina={pag?.id}
            data-rejilla={`${doc.lienzo.cols}x${doc.lienzo.filas}`}
            style={{
              width: anchoPx(doc.lienzo),
              height: altoPx(doc.lienzo),
              backgroundColor: cssDe(doc, pag?.fondo ?? null) ?? '#0b1220',
              transform: escala === 1 ? undefined : `scale(${escala})`,
              // La rejilla se ve: es la mitad de enseñar a cuadricular.
              backgroundImage: `linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)`,
              backgroundSize: `${doc.lienzo.celdaPx}px ${doc.lienzo.celdaPx}px`,
            }}
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) onSeleccionar?.(null, false);
            }}
          >
            {/* ── el monitor: el lienzo enseña el fotograma que toca, debajo de las capas ── */}
            {recursoMonitor && corteMonitor && (
              <div
                className="dis-monitor"
                data-monitor={corteMonitor.id}
                style={{ backgroundImage: recursoMonitor.fondo }}
              >
                {recursoMonitor.glifo && <span className="dis-glifo">{recursoMonitor.glifo}</span>}
              </div>
            )}
            {capas.map((c) => (
              <CapaPintada
                key={c.id}
                doc={doc}
                capa={c}
                caja={cajaVista(c)}
                giro={giroVista(c)}
                seleccionada={seleccion.includes(c.id)}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  (e.target as Element).setPointerCapture?.(e.pointerId);
                  onSeleccionar?.(c.id, e.shiftKey);
                  onGestoInicio?.({ tipo: 'mover', capa: c.id, x: e.clientX, y: e.clientY });
                }}
                onKeyDown={(e) => alTeclearEnCapa(e, c)}
              />
            ))}

            {/* ── el marco de selección, con sus ocho tiradores y el de giro ── */}
            {unica && marco && (
              <div
                className="dis-marca"
                data-testid="dis-marca"
                style={{ left: marco.x, top: marco.y, width: marco.ancho, height: marco.alto }}
              >
                {TIRADORES.map((t) => (
                  <div
                    key={t}
                    className={`dis-tirador dis-t-${t}`}
                    role="button"
                    tabIndex={-1}
                    aria-label={`Cambiar el tamaño desde ${t}`}
                    data-tirador={t}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      (e.target as Element).setPointerCapture?.(e.pointerId);
                      onGestoInicio?.({ tipo: 'tirar', capa: unica.id, x: e.clientX, y: e.clientY, tirador: t });
                    }}
                  />
                ))}
                {hay('giro') && (
                  <div
                    className="dis-giro"
                    role="button"
                    tabIndex={-1}
                    aria-label="Girar"
                    data-giro-mango="si"
                    style={{ top: -MANGO_GIRO_PX }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      (e.target as Element).setPointerCapture?.(e.pointerId);
                      onGestoInicio?.({ tipo: 'girar', capa: unica.id, x: e.clientX, y: e.clientY });
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── la columna de la derecha ── */}
        <aside className="dis-lado">
          {panel && <div className="dis-panel">{panel}</div>}

          <div className="dis-bloque">
            <h3 className="dis-tit">Capas</h3>
            <ul className="dis-capas">
              {[...capas].reverse().map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`dis-fila${seleccion.includes(c.id) ? ' dis-on' : ''}`}
                    data-capa-fila={c.id}
                    onClick={() => onSeleccionar?.(c.id, false)}
                  >
                    <span className="dis-fila-tipo" aria-hidden="true">
                      {c.tipo === 'texto' ? 'T' : c.tipo === 'imagen' ? '🖼' : '◼'}
                    </span>
                    {c.nombre}
                    {c.bloqueada && <span aria-label="bloqueada"> 🔒</span>}
                  </button>
                </li>
              ))}
              {capas.length === 0 && <li className="dis-vacio">Nada todavía.</li>}
            </ul>
          </div>

          {pasos && (
            <div className="dis-bloque">
              <h3 className="dis-tit">Lo que hiciste</h3>
              <ol className="dis-pasos" data-testid="dis-pasos">
                {pasos.map((p, i) => (
                  <li key={`${p.accion.comando}-${i}`} data-paso={p.accion.comando}>
                    {p.etiqueta}
                  </li>
                ))}
                {pasos.length === 0 && <li className="dis-vacio">Todavía nada.</li>}
              </ol>
            </div>
          )}
        </aside>
      </div>

      {/* ── la línea de tiempo, sólo si la clase la trae ── */}
      {cinta && <LineaDeTiempo {...cinta} />}

      {/* ── las pantallas del prototipo ── */}
      {hay('paginas') && doc.paginas.length > 0 && (
        <div className="dis-paginas" role="tablist" aria-label="Pantallas">
          {doc.paginas.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={p.id === pagina}
              className={`dis-pag${p.id === pagina ? ' dis-on' : ''}`}
              data-pagina-tab={p.id}
              onClick={() => onIrA?.(p.id)}
            >
              {p.nombre}
            </button>
          ))}
          <button
            type="button"
            className="dis-btn"
            data-accion="nueva-pagina"
            onClick={() =>
              mandar(
                accion('nueva-pagina', {
                  id: nuevoId?.('p') ?? `p${doc.paginas.length + 1}`,
                  nombre: `Pantalla ${doc.paginas.length + 1}`,
                }),
              )
            }
          >
            + Pantalla
          </button>
        </div>
      )}
    </div>
  );
}

export default VentanaDiseno;
