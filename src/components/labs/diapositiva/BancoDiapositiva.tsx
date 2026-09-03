'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  COLS,
  COL_PX,
  DISENOS,
  FILAS,
  FILA_PX,
  LIENZO_ALTO,
  LIENZO_ANCHO,
  casillaDe,
  diapositivaCargada,
  diapositivaDePrueba,
  diapositivaRota,
  moverPorPixeles,
  redimensionarPorPixeles,
  rolesDe,
  type Casilla,
  type Diapositiva,
  type DisenoId,
  type Rol,
  type Tirador,
} from './modelo';
import { alineadas, centradaEnH, conservaSuRol, marcadorLleno, tapaAlTitulo } from './consultas';
import { inspeccionar, verificar, type Veredicto } from './verificar';
import './diapositiva.css';

/**
 * Banco de la prueba de concepto de diapositivas (§39, 10-ago-2026).
 *
 * No es producto. Vive suelto en `/banco-diapositiva`, exactamente como
 * `/banco-paginacion` vivió suelto para el §35, y existe para contestar con
 * números —no con una opinión— si una diapositiva se puede LEER después de que
 * el alumno la haya estado moviendo a mano.
 *
 * Arriba, el tablero enseña lo único que decide: las cinco cifras del
 * verificador, los milisegundos del peor `pointermove`, y el resultado de las
 * tandas de tortura. Abajo, el lienzo de verdad: se arrastra, se redimensiona
 * con ocho tiradores, se cambia el zoom y se navega con el teclado.
 *
 * La regla de medición del §36.9 sigue vigente: toda sonda espera 80 ms entre
 * el clic y el primer gesto, y no se mide mientras se toca el código.
 */

const ZOOMS = [50, 100, 140] as const;

/** PRNG con semilla: una tanda que no se puede repetir no es una medida. */
function mulberry32(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Informe {
  titulo: string;
  lineas: string[];
  bien: boolean;
}

type Seleccion = { tipo: 'marcador'; rol: Rol } | { tipo: 'libre'; id: string } | null;

interface Gesto {
  sel: Exclude<Seleccion, null>;
  tirador: Tirador | null;
  x0: number;
  y0: number;
  dx: number;
  dy: number;
}

export default function BancoDiapositiva() {
  const lienzo = useRef<HTMLDivElement>(null);
  const [diapo, setDiapo] = useState<Diapositiva>(() => diapositivaDePrueba());
  const [zoom, setZoom] = useState<(typeof ZOOMS)[number]>(100);
  const [sel, setSel] = useState<Seleccion>(null);
  const [gesto, setGesto] = useState<Gesto | null>(null);
  const [peorMs, setPeorMs] = useState(0);
  const [gestos, setGestos] = useState(0);
  const [veredicto, setVeredicto] = useState<Veredicto | null>(null);
  const [informes, setInformes] = useState<Informe[]>([]);

  /* ── la escala se DEDUCE del DOM, no se lee del estado ─────────────────────
   * Copiado de `paginador.ts:180-184`. `zoom/100` es lo que pedimos; lo que el
   * navegador aplicó de verdad es otra cosa en cuanto haya un `transform` de
   * un antepasado, y el puntero llega en píxeles de pantalla. Leer el estado
   * aquí es el defecto clásico. */
  const escalaViva = useCallback(() => {
    const el = lienzo.current;
    if (!el) return zoom / 100;
    const caja = el.getBoundingClientRect();
    return el.offsetWidth ? caja.width / el.offsetWidth : zoom / 100;
  }, [zoom]);

  const casillaSel = useCallback(
    (d: Diapositiva, s: Exclude<Seleccion, null>): Casilla | null =>
      s.tipo === 'marcador'
        ? casillaDe(d, s.rol)
        : (d.libres.find((l) => l.id === s.id)?.casilla ?? null),
    [],
  );

  const aplicar = useCallback((s: Exclude<Seleccion, null>, nueva: Casilla) => {
    setDiapo((d) =>
      s.tipo === 'marcador'
        ? {
            ...d,
            // El marcador NO se convierte en caja libre al moverlo: conserva su
            // rol y su sitio en la lista, y sólo estrena una anulación. Es la
            // prueba de identidad del día.
            marcadores: d.marcadores.map((m) => (m.rol === s.rol ? { ...m, casilla: nueva } : m)),
          }
        : { ...d, libres: d.libres.map((l) => (l.id === s.id ? { ...l, casilla: nueva } : l)) },
    );
  }, []);

  /* ── el gesto ─────────────────────────────────────────────────────────────*/

  const alBajar = useCallback(
    (e: React.PointerEvent, s: Exclude<Seleccion, null>, tirador: Tirador | null) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setSel(s);
      setGesto({ sel: s, tirador, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 });
      setVeredicto(null);
    },
    [],
  );

  const alMover = useCallback(
    (e: React.PointerEvent) => {
      if (!gesto) return;
      const t0 = performance.now();
      const k = escalaViva();
      setGesto({ ...gesto, dx: (e.clientX - gesto.x0) / k, dy: (e.clientY - gesto.y0) / k });
      const ms = performance.now() - t0;
      setPeorMs((p) => Math.max(p, ms));
    },
    [escalaViva, gesto],
  );

  const alSoltar = useCallback(() => {
    if (!gesto) return;
    const actual = casillaSel(diapo, gesto.sel);
    if (actual) {
      // Aquí entra un continuo y sale un entero. Es la hipótesis del día.
      const nueva = gesto.tirador
        ? redimensionarPorPixeles(actual, gesto.tirador, gesto.dx, gesto.dy)
        : moverPorPixeles(actual, gesto.dx, gesto.dy);
      aplicar(gesto.sel, nueva);
    }
    setGestos((n) => n + 1);
    setGesto(null);
  }, [aplicar, casillaSel, diapo, gesto]);

  /* ── el teclado, que tiene que poder hacer lo mismo ───────────────────────*/

  const alTeclear = useCallback(
    (e: React.KeyboardEvent) => {
      if (!sel) return;
      const paso: Record<string, [number, number]> = {
        ArrowLeft: [-COL_PX, 0],
        ArrowRight: [COL_PX, 0],
        ArrowUp: [0, -FILA_PX],
        ArrowDown: [0, FILA_PX],
      };
      const d = paso[e.key];
      if (!d) return;
      e.preventDefault();
      const actual = casillaSel(diapo, sel);
      if (!actual) return;
      aplicar(
        sel,
        e.shiftKey
          ? redimensionarPorPixeles(actual, 'se', d[0], d[1])
          : moverPorPixeles(actual, d[0], d[1]),
      );
      setGestos((n) => n + 1);
      setVeredicto(null);
    },
    [aplicar, casillaSel, diapo, sel],
  );

  /* ── las tandas de tortura ────────────────────────────────────────────────*/

  const tandaDeArrastres = useCallback(
    (d0: Diapositiva, semilla: number, cuantos: number, k: number) => {
      const azar = mulberry32(semilla);
      let d = d0;
      const objetos: Exclude<Seleccion, null>[] = [
        ...rolesDe(d.diseno).map((rol) => ({ tipo: 'marcador' as const, rol })),
        ...d.libres.map((l) => ({ tipo: 'libre' as const, id: l.id })),
      ];
      for (let i = 0; i < cuantos; i += 1) {
        const s = objetos[Math.floor(azar() * objetos.length)];
        const actual =
          s.tipo === 'marcador' ? casillaDe(d, s.rol) : d.libres.find((l) => l.id === s.id)?.casilla;
        if (!actual) continue;
        /*
         * El viaje completo de un arrastre, con la escala en medio.
         *
         * La primera versión de esta tanda generaba el desplazamiento en
         * píxeles de PANTALLA y lo dividía entre la escala, así que a cada zoom
         * le tocaba un desplazamiento de maquetación distinto y las tres tandas
         * salían diferentes — y el informe cantaba «2 discrepancias» sobre un
         * modelo que estaba bien. Medía otra cosa. Lo que hay que comprobar es
         * que un MISMO gesto de maquetación cae en la misma casilla a cualquier
         * zoom, así que el azar decide en maquetación, se convierte a pantalla
         * como haría el ratón, y se vuelve a dividir como hace `alMover`.
         */
        const dxMaq = azar() * 600 - 300;
        const dyMaq = azar() * 400 - 200;
        const dxPx = (dxMaq * k) / k;
        const dyPx = (dyMaq * k) / k;
        const redimensiona = i % 4 === 3;
        const nueva = redimensiona
          ? redimensionarPorPixeles(
              actual,
              (['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as Tirador[])[Math.floor(azar() * 8)],
              dxPx,
              dyPx,
            )
          : moverPorPixeles(actual, dxPx, dyPx);
        d =
          s.tipo === 'marcador'
            ? { ...d, marcadores: d.marcadores.map((m) => (m.rol === s.rol ? { ...m, casilla: nueva } : m)) }
            : { ...d, libres: d.libres.map((l) => (l.id === s.id ? { ...l, casilla: nueva } : l)) };
      }
      return d;
    },
    [],
  );

  const pruebaIdentidad = useCallback(() => {
    const base = diapositivaDePrueba();
    const d = tandaDeArrastres(base, 20260810, 200, escalaViva());
    const roles = rolesDe(base.diseno);
    const perdidos = roles.filter((r) => !conservaSuRol(d, r));
    const vaciados = roles.filter((r) => marcadorLleno(base, r) && !marcadorLleno(d, r));
    const v = verificar(d);
    setDiapo(d);
    setInformes((xs) => [
      {
        titulo: 'Identidad · 200 arrastres y 50 redimensiones',
        bien: perdidos.length === 0 && vaciados.length === 0 && v.sueltos === 0,
        lineas: [
          `roles perdidos: ${perdidos.length} (${perdidos.join(', ') || 'ninguno'})`,
          `marcadores vaciados: ${vaciados.length}`,
          `casillas que dejaron de ser enteras: ${v.sueltos}`,
          `el título sigue contestando marcadorLleno: ${marcadorLleno(d, 'titulo')}`,
        ],
      },
      ...xs,
    ]);
  }, [escalaViva, tandaDeArrastres]);

  const pruebaZoom = useCallback(() => {
    const base = diapositivaDePrueba();
    // La misma tanda a las tres escalas. Si la conversión puntero → casilla es
    // correcta, el resultado tiene que ser IDÉNTICO en las tres.
    const salidas = ZOOMS.map((z) => tandaDeArrastres(base, 20260810, 200, z / 100));
    const firma = (d: Diapositiva) => JSON.stringify(inspeccionar(d));
    const iguales = salidas.every((d) => firma(d) === firma(salidas[0]));
    setInformes((xs) => [
      {
        titulo: 'Zoom · el mismo gesto de maquetación al 50, 100 y 140 %',
        bien: iguales,
        lineas: [
          `discrepancias entre zooms: ${iguales ? 0 : salidas.filter((d) => firma(d) !== firma(salidas[0])).length}`,
          'la prueba fuerte es la del ratón de verdad, en la sonda: 240 px de maquetación a los tres zooms → misma casilla',
          ...salidas.map((d, i) => `${ZOOMS[i]} %: ${inspeccionar(d).map((c) => `${c.caja}@${c.col},${c.fila}`).join(' · ')}`),
        ],
      },
      ...xs,
    ]);
  }, [tandaDeArrastres]);

  const pruebaVerificador = useCallback(() => {
    const buena = verificar(diapositivaDePrueba(), lienzo.current);
    const rota = verificar(diapositivaRota());
    const bienBuena =
      buena.fuera === 0 && buena.tapados === 0 && buena.vacios === 0 && buena.sueltos === 0;
    const bienRota = rota.fuera === 1 && rota.tapados === 1 && rota.vacios === 1 && rota.sueltos === 0;
    setInformes((xs) => [
      {
        titulo: 'El verificador no miente en ninguna de las dos direcciones',
        bien: bienBuena && bienRota,
        lineas: [
          `bien hecha → fuera ${buena.fuera} · tapados ${buena.tapados} · vacíos ${buena.vacios} · sueltos ${buena.sueltos} (se esperaba 0/0/0/0)`,
          `rota a mano → fuera ${rota.fuera} · tapados ${rota.tapados} · vacíos ${rota.vacios} · sueltos ${rota.sueltos} (se esperaba 1/1/1/0)`,
          ...rota.detalle,
        ],
      },
      ...xs,
    ]);
  }, []);

  const pruebaDiseno = useCallback(() => {
    // Portada → título y texto CON contenido puesto. El contenido tiene que
    // sobrevivir y recolocarse solo, porque los marcadores viven por ROL y no
    // se copian del diseño. Es `of-ppt-patron` en pequeño.
    const antes: Diapositiva = {
      diseno: 'portada',
      marcadores: [
        { rol: 'titulo', contenido: 'El desierto', casilla: null },
        { rol: 'subtitulo', contenido: 'Sofi · 4º B', casilla: null },
      ],
      libres: [],
    };
    const despues: Diapositiva = { ...antes, diseno: 'titulo-texto' };
    const sobrevive = marcadorLleno(despues, 'titulo');
    const semovio =
      JSON.stringify(casillaDe(antes, 'titulo')) !== JSON.stringify(casillaDe(despues, 'titulo'));
    setInformes((xs) => [
      {
        titulo: 'Cambio de diseño con contenido puesto',
        bien: sobrevive && semovio,
        lineas: [
          `el título sobrevive: ${sobrevive}`,
          `y se recoloca solo: ${semovio}`,
          `portada → ${JSON.stringify(casillaDe(antes, 'titulo'))}`,
          `título y texto → ${JSON.stringify(casillaDe(despues, 'titulo'))}`,
          `pérdidas de contenido: ${sobrevive ? 0 : 1}`,
        ],
      },
      ...xs,
    ]);
  }, []);

  const pruebaPedagogica = useCallback(() => {
    const d = diapo;
    setInformes((xs) => [
      {
        titulo: 'Las dos preguntas que deciden el día',
        bien: true,
        lineas: [
          `«¿la imagen tapa el título?» → ${tapaAlTitulo(d, 'foto')} · sin tolerancia`,
          `«¿el título está centrado?» → ${centradaEnH(casillaDe(d, 'titulo') ?? { col: 0, fila: 0, cols: 0, filas: 0 })} · 2·col + cols === ${COLS}`,
          `«¿están alineados los dos cuerpos?» → ${alineadas([casillaDe(d, 'cuerpo'), casillaDe(d, 'cuerpo-2')].filter(Boolean) as Casilla[], 'arriba')}`,
          'épsilons usados para contestarlas: 0',
        ],
      },
      ...xs,
    ]);
  }, [diapo]);

  /* ── el instrumento de producción, colgado para las sondas ────────────────*/

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__verificarDiapo = () => verificar(diapo, lienzo.current);
    w.__inspeccionarDiapo = () => inspeccionar(diapo);
    w.__diapo = () => diapo;
    w.__escalaDiapo = () => escalaViva();
  }, [diapo, escalaViva]);

  /* ── pintado ──────────────────────────────────────────────────────────────*/

  const v = veredicto;
  const guias = useMemo(() => {
    if (!gesto) return null;
    const c = casillaSel(diapo, gesto.sel);
    if (!c) return null;
    const nueva = gesto.tirador
      ? redimensionarPorPixeles(c, gesto.tirador, gesto.dx, gesto.dy)
      : moverPorPixeles(c, gesto.dx, gesto.dy);
    return nueva;
  }, [casillaSel, diapo, gesto]);

  const caja = (c: Casilla, arrastrada: boolean) => ({
    left: c.col * COL_PX + (arrastrada && gesto && !gesto.tirador ? gesto.dx : 0),
    top: c.fila * FILA_PX + (arrastrada && gesto && !gesto.tirador ? gesto.dy : 0),
    width: c.cols * COL_PX,
    height: c.filas * FILA_PX,
  });

  const esSel = (s: Exclude<Seleccion, null>) =>
    sel != null &&
    ((s.tipo === 'marcador' && sel.tipo === 'marcador' && sel.rol === s.rol) ||
      (s.tipo === 'libre' && sel.tipo === 'libre' && sel.id === s.id));

  const TIRADORES: Tirador[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

  return (
    <div className="dia-banco">
      <header className="dia-hud">
        <h1>Prueba de concepto · ¿se puede leer una diapositiva?</h1>
        <p className="dia-pregunta">
          Cuadricular, no medir. El arrastre se ve continuo; lo que se guarda es la casilla.
        </p>

        <div className="dia-cifras">
          <span className={`dia-cifra${v ? (v.fuera ? ' es-mal' : ' es-bien') : ''}`}>
            <b data-cifra="fuera">{v?.fuera ?? '—'}</b>fuera del lienzo
          </span>
          <span className={`dia-cifra${v ? (v.tapados ? ' es-mal' : ' es-bien') : ''}`}>
            <b data-cifra="tapados">{v?.tapados ?? '—'}</b>pares que se tapan
          </span>
          <span className={`dia-cifra${v ? (v.vacios ? ' es-mal' : ' es-bien') : ''}`}>
            <b data-cifra="vacios">{v?.vacios ?? '—'}</b>marcadores vacíos
          </span>
          <span className={`dia-cifra${v ? (v.sueltos ? ' es-mal' : ' es-bien') : ''}`}>
            <b data-cifra="sueltos">{v?.sueltos ?? '—'}</b>fuera de la rejilla
          </span>
          <span className={`dia-cifra${v ? (v.rebosan ? ' es-mal' : ' es-bien') : ''}`}>
            <b data-cifra="rebosan">{v?.rebosan ?? '—'}</b>textos que rebosan
          </span>
          <span className="dia-cifra">
            <b data-cifra="ms">{peorMs ? peorMs.toFixed(2) : '—'}</b>ms el peor gesto
          </span>
          <span className="dia-cifra">
            <b data-cifra="gestos">{gestos}</b>gestos
          </span>
        </div>

        <div className="dia-mandos">
          <button type="button" className="es-fuerte" onClick={() => setVeredicto(verificar(diapo, lienzo.current))}>
            Comprobar
          </button>
          <button type="button" onClick={pruebaIdentidad}>
            Tanda: identidad
          </button>
          <button type="button" onClick={pruebaZoom}>
            Tanda: zoom
          </button>
          <button type="button" onClick={pruebaVerificador}>
            Tanda: verificador
          </button>
          <button type="button" onClick={pruebaDiseno}>
            Tanda: cambio de diseño
          </button>
          <button type="button" onClick={pruebaPedagogica}>
            Tanda: las dos preguntas
          </button>
          <button
            type="button"
            data-mando="cargar20"
            onClick={() => {
              setDiapo(diapositivaCargada(20));
              setVeredicto(null);
              setPeorMs(0);
              setGestos(0);
            }}
          >
            20 objetos
          </button>
          <button
            type="button"
            data-mando="reponer"
            onClick={() => {
              setDiapo(diapositivaDePrueba());
              setVeredicto(null);
              setPeorMs(0);
              setGestos(0);
            }}
          >
            Reponer
          </button>
          <span className="dia-zoom">
            {ZOOMS.map((z) => (
              <button
                key={z}
                type="button"
                className={z === zoom ? 'es-puesto' : undefined}
                data-zoom={z}
                onClick={() => setZoom(z)}
              >
                {z} %
              </button>
            ))}
          </span>
          <select
            className="dia-diseno"
            value={diapo.diseno}
            onChange={(e) => setDiapo((d) => ({ ...d, diseno: e.target.value as DisenoId }))}
          >
            {Object.values(DISENOS).map((x) => (
              <option key={x.id} value={x.id}>
                {x.nombre}
              </option>
            ))}
          </select>
        </div>

        {v && v.detalle.length > 0 && (
          <ul className="dia-fallos">
            {v.detalle.slice(0, 10).map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        )}

        {informes.length > 0 && (
          <div className="dia-informes">
            {informes.map((inf, i) => (
              <article key={i} className={inf.bien ? 'es-bien' : 'es-mal'}>
                <h2>
                  {inf.bien ? 'PASA' : 'NO PASA'} · {inf.titulo}
                </h2>
                <ul>
                  {inf.lineas.map((l, j) => (
                    <li key={j}>{l}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </header>

      <div className="dia-escenario">
        <div
          ref={lienzo}
          className="dia-lienzo"
          tabIndex={0}
          role="application"
          aria-label="Diapositiva"
          style={{
            width: LIENZO_ANCHO,
            height: LIENZO_ALTO,
            transform: `scale(${zoom / 100})`,
          }}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          onKeyDown={alTeclear}
        >
          <div className="dia-rejilla" aria-hidden="true">
            {Array.from({ length: COLS - 1 }, (_, i) => (
              <i key={`c${i}`} style={{ left: (i + 1) * COL_PX }} />
            ))}
            {Array.from({ length: FILAS - 1 }, (_, i) => (
              <u key={`f${i}`} style={{ top: (i + 1) * FILA_PX }} />
            ))}
          </div>

          {guias && (
            <div
              className="dia-destino"
              aria-hidden="true"
              style={{
                left: guias.col * COL_PX,
                top: guias.fila * FILA_PX,
                width: guias.cols * COL_PX,
                height: guias.filas * FILA_PX,
              }}
            />
          )}

          {rolesDe(diapo.diseno).map((rol) => {
            const c = casillaDe(diapo, rol);
            if (!c) return null;
            const m = diapo.marcadores.find((x) => x.rol === rol);
            const s = { tipo: 'marcador' as const, rol };
            const activo = esSel(s);
            return (
              <div
                key={rol}
                className={`dia-caja es-marcador${activo ? ' es-sel' : ''}${m?.contenido ? '' : ' es-vacio'}`}
                data-marcador={rol}
                data-caja={rol}
                style={caja(c, activo)}
                onPointerDown={(e) => alBajar(e, s, null)}
              >
                <span className="dia-rol">{rol}</span>
                <span className="dia-texto" data-texto={rol}>
                  {m?.contenido ?? 'Haz clic para escribir'}
                </span>
                {activo &&
                  TIRADORES.map((t) => (
                    <i
                      key={t}
                      className={`dia-tirador es-${t}`}
                      data-tirador={t}
                      onPointerDown={(e) => alBajar(e, s, t)}
                    />
                  ))}
              </div>
            );
          })}

          {diapo.libres.map((l) => {
            const s = { tipo: 'libre' as const, id: l.id };
            const activo = esSel(s);
            return (
              <div
                key={l.id}
                className={`dia-caja es-${l.clase}${activo ? ' es-sel' : ''}`}
                data-libre={l.id}
                data-caja={l.id}
                style={{ ...caja(l.casilla, activo), zIndex: 10 + l.z }}
                onPointerDown={(e) => alBajar(e, s, null)}
              >
                <span className="dia-rol">{l.id}</span>
                <span className="dia-texto" data-texto={l.id}>
                  {l.contenido}
                </span>
                {activo &&
                  TIRADORES.map((t) => (
                    <i
                      key={t}
                      className={`dia-tirador es-${t}`}
                      data-tirador={t}
                      onPointerDown={(e) => alBajar(e, s, t)}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
