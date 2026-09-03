'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { crearMotor, type Motor, valoresDesdeCero } from '@/components/office/motor-hojas/formula/calculo';
import {
  clave,
  dir,
  letraDeColumna,
  type Libro,
  type Valor,
} from '@/components/office/motor-hojas/modelo';
import { comoSeVe } from '@/components/office/motor-hojas/formatos';
import {
  ejecutar,
  escribirEn,
  etiquetaDe,
  nuevaGrabadora,
  reproducir,
  type Gesto,
} from '@/components/office/motor-hojas/comandos';
import {
  libroCircular,
  libroDePrueba,
  libroGrande,
  libroRoto,
} from '@/components/office/motor-hojas/librosDePrueba';
import { verificar, type Veredicto } from '@/components/office/motor-hojas/verificar';
import { precedentes, dependientes } from '@/components/office/motor-hojas/consultas';
import './hojas.css';

/**
 * Banco de la prueba de concepto del evaluador de fórmulas (§45.7, paso 0).
 *
 * No es producto. Vive suelto en `/banco-hojas`, exactamente como
 * `/banco-paginacion` vivió suelto para el §35 y `/banco-diapositiva` para el
 * §39, y existe para contestar con números —no con una opinión— a las tres
 * preguntas del §45.5:
 *
 *   1. ¿`B1` cambia sola cuando cambia `A3`?
 *   2. ¿Una referencia circular avisa, o cuelga la pestaña?
 *   3. ¿Mil recálculos caben en 16 ms?
 *
 * Arriba, el tablero: las cinco cifras del verificador **de producción**
 * (`window.__verificarHojas`, por la lección de §36.5) y los milisegundos del
 * último recálculo. En medio, la hoja de verdad: se escribe, se calcula y se
 * ve. Abajo, la grabadora de macros del §45.6, que es la prueba de que los
 * comandos son datos: lo que el alumno hizo, en una lista que se puede leer.
 */

const COLS = 10;
const FILAS = 22;
const CONTEXTO = { ahora: Date.UTC(2026, 7, 13, 12, 0, 0) };

interface Informe {
  titulo: string;
  lineas: string[];
  bien: boolean;
}

/** PRNG con semilla: una tanda que no se puede repetir no es una medida (§39). */
function conSemilla(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ms = (n: number) => `${n.toFixed(2)} ms`;

export default function BancoHojas() {
  /*
   * El motor es una caché mutable (ver la cabecera de `calculo.ts`), así que
   * React no se entera solo cuando cambia por dentro. La primera versión lo
   * guardaba en un `useRef` y lo leía al pintar, y eslint tenía razón en
   * pararlo: leer `ref.current` durante el render es justo la manera de que la
   * pantalla se quede con lo de antes sin que se note.
   *
   * Lo que se hace en su lugar: el motor va en el estado dentro de un
   * **envoltorio**. Repintar es crear un envoltorio nuevo con el MISMO motor —
   * React ve un objeto distinto y vuelve a pintar; el motor no se copia.
   */
  const [caja, setCaja] = useState(() => ({ motor: crearMotor(libroDePrueba(), CONTEXTO) }));
  const motor = caja.motor;
  const repintar = useCallback(() => setCaja((c) => ({ motor: c.motor })), []);

  const [sel, setSel] = useState({ col: 3, fila: 7 });
  const [editando, setEditando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [veredicto, setVeredicto] = useState<Veredicto | null>(null);
  const [informes, setInformes] = useState<Informe[]>([]);
  const [grabando, setGrabando] = useState(false);
  const [gestos, setGestos] = useState<Gesto[]>([]);
  const grabadora = useRef(nuevaGrabadora());
  const rejilla = useRef<HTMLDivElement>(null);

  const hoja = motor.libro.activa;
  const direccionSel = dir(sel.col, sel.fila);
  const crudoSel = motor.libro.hojas.find((h) => h.id === hoja)?.celdas[direccionSel]?.crudo ?? '';

  /* ── el único camino por el que se toca el libro ───────────────────────── */

  const mandar = useCallback(
    (g: Gesto) => {
      const problema = ejecutar(motor, g, grabadora.current);
      setAviso(problema);
      setGestos([...grabadora.current.gestos]);
      setVeredicto(null);
      repintar();
      return problema;
    },
    [motor, repintar],
  );

  const cargar = useCallback((libro: Libro) => {
    setCaja({ motor: crearMotor(libro, CONTEXTO) });
    grabadora.current = nuevaGrabadora();
    setGrabando(false);
    setGestos([]);
    setAviso(null);
    setVeredicto(null);
    setInformes([]);
    setSel({ col: 0, fila: 0 });
    setEditando(null);
  }, []);

  /* ── el verificador de producción, colgado de la ventana (§36.5) ────────── */

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__verificarHojas = () => verificar(motor);
    w.__hojas = () => motor;
    return () => {
      delete w.__verificarHojas;
      delete w.__hojas;
    };
  }, [motor]);

  /* ── escribir en la hoja ────────────────────────────────────────────────── */

  const confirmar = useCallback(
    (texto: string, dCol: number, dFila: number) => {
      const problema = mandar(escribirEn(hoja, dir(sel.col, sel.fila), texto));
      setEditando(null);
      if (!problema && (dCol || dFila)) {
        setSel((s) => ({
          col: Math.max(0, Math.min(COLS - 1, s.col + dCol)),
          fila: Math.max(0, Math.min(FILAS - 1, s.fila + dFila)),
        }));
      }
    },
    [hoja, mandar, sel.col, sel.fila],
  );

  const alTeclado = useCallback(
    (e: React.KeyboardEvent) => {
      if (editando !== null) return;
      const mover = (dCol: number, dFila: number) => {
        e.preventDefault();
        setSel((s) => ({
          col: Math.max(0, Math.min(COLS - 1, s.col + dCol)),
          fila: Math.max(0, Math.min(FILAS - 1, s.fila + dFila)),
        }));
      };
      switch (e.key) {
        case 'ArrowUp':
          return mover(0, -1);
        case 'ArrowDown':
        case 'Enter':
          return mover(0, 1);
        case 'ArrowLeft':
          return mover(-1, 0);
        case 'ArrowRight':
        case 'Tab':
          return mover(1, 0);
        case 'F2':
          e.preventDefault();
          return setEditando(crudoSel);
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          return void mandar({ comando: 'borrar', args: { hoja, rango: direccionSel } });
        default:
          break;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setEditando(e.key);
      }
    },
    [crudoSel, direccionSel, editando, hoja, mandar],
  );

  /* ── las tandas de tortura ──────────────────────────────────────────────── */

  const anota = (i: Informe) => setInformes((xs) => [i, ...xs].slice(0, 6));

  const tandaCriterio1 = () => {
    const m = crearMotor(
      { activa: 'h1', nombres: {}, hojas: [{ id: 'h1', nombre: 'Hoja1', celdas: {} }] },
      CONTEXTO,
    );
    const lineas: string[] = [];
    for (let i = 1; i <= 9; i += 1) ejecutar(m, escribirEn('h1', `A${i}`, String(i)));
    ejecutar(m, escribirEn('h1', 'B1', '=SUMA(A1:A9)'));
    const antes = m.valores.get(clave('h1', 1, 0));
    lineas.push(`B1 = «=SUMA(A1:A9)» sobre 1…9 → ${String(antes)}`);
    ejecutar(m, escribirEn('h1', 'A3', '300'));
    const despues = m.valores.get(clave('h1', 1, 0));
    lineas.push(`se cambia A3 a 300 y NADIE toca B1 → ${String(despues)}`);
    ejecutar(m, escribirEn('h1', 'A9', ''));
    lineas.push(`se borra A9 → ${String(m.valores.get(clave('h1', 1, 0)))}`);
    anota({
      titulo: '§45.5 · criterio 1 · «cambiar A3 y que B1 cambie sola»',
      lineas,
      bien: antes === 45 && despues === 342 && m.valores.get(clave('h1', 1, 0)) === 333,
    });
  };

  const tandaCriterio2 = () => {
    const t0 = performance.now();
    const m = crearMotor(libroCircular(), CONTEXTO);
    const tardo = performance.now() - t0;
    anota({
      titulo: '§45.5 · criterio 2 · «que avise en vez de colgarse»',
      lineas: [
        `A1 = «=B1» y B1 = «=A1» → avisa de ${m.circulares.length}: ${m.circulares.join(', ')}`,
        `las circulares valen 0 y NO se inventa un código de error → A1 = ${String(m.valores.get('h1!A1'))}`,
        `C1 = «=A1+1», que cuelga del ciclo pero no está dentro → ${String(m.valores.get('h1!C1'))}`,
        `resolvió en ${ms(tardo)} (colgarse habría sido no volver nunca)`,
      ],
      bien: m.circulares.length === 2 && m.valores.get('h1!A1') === 0 && m.valores.get('h1!C1') === 1,
    });
  };

  const tandaCriterio3 = () => {
    const m = crearMotor(
      {
        activa: 'h1',
        nombres: {},
        hojas: [
          {
            id: 'h1',
            nombre: 'Hoja1',
            celdas: { A1: { crudo: '1' }, A2: { crudo: '2' }, A3: { crudo: '3' }, B1: { crudo: '=SUMA(A1:A9)' } },
          },
        ],
      },
      CONTEXTO,
    );
    const t0 = performance.now();
    for (let i = 0; i < 1000; i += 1) ejecutar(m, escribirEn('h1', 'A3', String(i)));
    const total = performance.now() - t0;

    const grande = libroGrande(1000, 500);
    const t1 = performance.now();
    const mg = crearMotor(grande, CONTEXTO);
    const arranque = performance.now() - t1;
    const t2 = performance.now();
    ejecutar(mg, escribirEn('h1', 'A1', '7'));
    const retoque = performance.now() - t2;

    anota({
      titulo: '§45.5 · criterio 3 · «mil recálculos por debajo de 16 ms»',
      lineas: [
        `mil gestos completos sobre A1:A9 → ${ms(total)}  (${((total * 1000) / 1000).toFixed(1)} µs cada uno)`,
        `libro de ${mg.valores.size} celdas · arranque en frío → ${ms(arranque)}`,
        `retocar UNA celda de ese libro → ${ms(retoque)} · ${mg.ultimo.celdas} celdas recalculadas de ${mg.valores.size}`,
      ],
      bien: total < 16,
    });
  };

  const tandaAzar = () => {
    const m = crearMotor(libroDePrueba(), CONTEXTO);
    const azar = conSemilla(20260813);
    const t0 = performance.now();
    for (let i = 0; i < 500; i += 1) {
      const fila = 2 + Math.floor(azar() * 5);
      const col = azar() < 0.5 ? 'B' : 'C';
      ejecutar(m, escribirEn('h1', `${col}${fila}`, String(Math.floor(azar() * 100))));
    }
    const tardo = performance.now() - t0;
    const v = verificar(m);
    const oro = valoresDesdeCero(m.libro, CONTEXTO);
    let distintas = 0;
    for (const [k, valor] of m.valores) if (String(oro.get(k)) !== String(valor)) distintas += 1;
    anota({
      titulo: '500 gestos al azar · ¿la caché sigue diciendo la verdad?',
      lineas: [
        `500 escrituras con semilla fija en ${ms(tardo)}`,
        `celdas desfasadas según el verificador → ${v.desfasadas}`,
        `comprobación cruda contra un motor nuevo → ${distintas} distintas`,
        `pendientes de recalcular → ${v.pendientes}`,
      ],
      bien: v.desfasadas === 0 && distintas === 0 && v.pendientes === 0,
    });
  };

  const tandaMacro = () => {
    const partida = libroDePrueba();
    const m = crearMotor(partida, CONTEXTO);
    const g = nuevaGrabadora();
    g.grabando = true;
    ejecutar(m, escribirEn('h1', 'B7', '99'), g);
    ejecutar(m, escribirEn('h1', 'C7', '2'), g);
    ejecutar(m, escribirEn('h1', 'D7', '=B7*C7'), g);
    ejecutar(m, { comando: 'formato', args: { hoja: 'h1', rango: 'D7', tipo: 'moneda', decimales: 2 } }, g);
    ejecutar(m, escribirEn('h1', 'D8', '=SUMA(D2:D7)'), g);
    g.grabando = false;

    const reproducido = reproducir(partida, g.gestos);
    const igual = JSON.stringify(reproducido) === JSON.stringify(m.libro);
    const otraVez = reproducir(partida, g.gestos);
    const dosVeces = JSON.stringify(otraVez) === JSON.stringify(reproducido);

    anota({
      titulo: '§45.6 · una macro grabada y reproducida da EL MISMO libro',
      lineas: [
        `${g.gestos.length} gestos grabados, todos JSON: ${JSON.stringify(g.gestos[2])}`,
        `reproducir sobre el libro de partida → ${igual ? 'idéntico' : 'DISTINTO'}`,
        `reproducir dos veces → ${dosVeces ? 'idéntico' : 'DISTINTO'} (nada se inventa al vuelo)`,
        `el total D8 pasó de 681 a ${String(m.valores.get(clave('h1', 3, 7)))}`,
      ],
      bien: igual && dosVeces,
    });
  };

  const tandaVerificador = () => {
    const bueno = verificar(crearMotor(libroDePrueba(), CONTEXTO));
    const roto = verificar(crearMotor(libroRoto(), CONTEXTO));
    const cifras = (v: Veredicto) =>
      `${v.ilegibles} · ${v.desfasadas} · ${v.pendientes} · ${v.circulares} · ${v.errores}`;
    anota({
      titulo: 'el verificador no miente en ninguna dirección',
      lineas: [
        `libro bueno → ${cifras(bueno)}`,
        `libro roto a mano → ${cifras(roto)} (esperado 1 · 0 · 0 · 1 · 2)`,
        ...roto.detalle.slice(0, 4),
      ],
      bien:
        cifras(bueno) === '0 · 0 · 0 · 0 · 0' && cifras(roto) === '1 · 0 · 0 · 1 · 2',
    });
  };

  /** Las dos cifras que no se pueden provocar con un dato: se disparan a mano. */
  const ensuciarCache = () => {
    motor.valores.set(clave(hoja, sel.col, sel.fila), 123456789);
    setVeredicto(verificar(motor));
    repintar();
  };

  const dejarPendiente = () => {
    motor.sucias.add(clave(hoja, sel.col, sel.fila));
    setVeredicto(verificar(motor));
    repintar();
  };

  /* ── pintar ─────────────────────────────────────────────────────────────── */

  const celdas = motor.libro.hojas.find((h) => h.id === hoja)?.celdas ?? {};
  const seleccion = clave(hoja, sel.col, sel.fila);
  const enCiclo = useMemo(() => new Set(motor.circulares), [motor.circulares]);
  const precede = new Set(precedentes(motor, hoja, direccionSel));
  const depende = new Set(dependientes(motor, hoja, direccionSel));

  const cifra = (nombre: string, n: number, malSiNoEsCero = true) => (
    <div className={`hj-cifra ${n === 0 ? 'es-bien' : malSiNoEsCero ? 'es-mal' : 'es-ojo'}`}>
      <b>{n}</b>
      <span>{nombre}</span>
    </div>
  );

  return (
    <div className="hj-banco">
      <header className="hj-hud">
        <h1>Prueba de concepto · el evaluador de fórmulas</h1>
        <p className="hj-pregunta">
          §45.7 paso 0 · Tecnia Hojas · <b>¿se puede calcular una hoja de verdad</b>: que una celda guarde la regla y
          enseñe el resultado, que cambiar un dato arrastre lo que cuelga de él, que una referencia circular avise en
          vez de colgar la pestaña, y que mil recálculos quepan en un cuadro de 16 ms?
        </p>

        <div className="hj-cifras">
          {veredicto ? (
            <>
              {cifra('ilegibles', veredicto.ilegibles)}
              {cifra('desfasadas', veredicto.desfasadas)}
              {cifra('pendientes', veredicto.pendientes)}
              {cifra('circulares', veredicto.circulares)}
              {cifra('errores', veredicto.errores, false)}
            </>
          ) : (
            <div className="hj-cifra">
              <span>sin verificar — pulsa «verificar»</span>
            </div>
          )}
          <div className="hj-cifra">
            <b>{motor.ultimo.celdas}</b>
            <span>celdas en el último recálculo</span>
          </div>
          <div className="hj-cifra">
            <b>{motor.ultimo.ms.toFixed(2)}</b>
            <span>ms del último recálculo</span>
          </div>
        </div>

        <div className="hj-botones">
          <button type="button" className="es-principal" onClick={() => setVeredicto(verificar(motor))}>
            verificar
          </button>
          <button type="button" onClick={tandaCriterio1}>
            criterio 1 · arrastra
          </button>
          <button type="button" onClick={tandaCriterio2}>
            criterio 2 · circulares
          </button>
          <button type="button" onClick={tandaCriterio3}>
            criterio 3 · 1000 recálculos
          </button>
          <button type="button" onClick={tandaAzar}>
            500 gestos al azar
          </button>
          <button type="button" onClick={tandaMacro}>
            §45.6 · macro
          </button>
          <button type="button" onClick={tandaVerificador}>
            el verificador miente?
          </button>
          <span className="hj-sep" />
          <button type="button" onClick={() => cargar(libroDePrueba())}>
            libro bueno
          </button>
          <button type="button" onClick={() => cargar(libroRoto())}>
            libro roto
          </button>
          <button type="button" onClick={() => cargar(libroGrande(1000, 500))}>
            libro grande
          </button>
          <button type="button" className="es-avería" onClick={ensuciarCache}>
            ensuciar la caché
          </button>
          <button type="button" className="es-avería" onClick={dejarPendiente}>
            dejar pendiente
          </button>
        </div>
      </header>

      {informes.length > 0 && (
        <div className="hj-informes">
          {informes.map((i, n) => (
            <div key={`${i.titulo}-${n}`} className={`hj-informe ${i.bien ? 'es-bien' : 'es-mal'}`}>
              <h3>
                {i.bien ? '✅' : '❌'} {i.titulo}
              </h3>
              {i.lineas.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── la hoja ─────────────────────────────────────────────────────── */}

      <section className="hj-ventana">
        <div className="hj-barra">
          <div className="hj-nombre">{direccionSel}</div>
          <div className="hj-fx">fx</div>
          <input
            className="hj-formula"
            value={editando ?? crudoSel}
            onChange={(e) => setEditando(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmar(editando ?? crudoSel, 0, 1);
              if (e.key === 'Escape') setEditando(null);
            }}
            onBlur={() => editando !== null && confirmar(editando, 0, 0)}
            placeholder="escribe un dato o una fórmula que empiece por ="
          />
        </div>

        {aviso && <div className="hj-aviso">⚠ {aviso}</div>}

        <div
          className="hj-rejilla"
          ref={rejilla}
          tabIndex={0}
          role="grid"
          onKeyDown={alTeclado}
          style={{ gridTemplateColumns: `44px repeat(${COLS}, 104px)` }}
        >
          <div className="hj-esquina" />
          {Array.from({ length: COLS }, (_, c) => (
            <div key={`c${c}`} className={`hj-cabecera ${c === sel.col ? 'es-activa' : ''}`}>
              {letraDeColumna(c)}
            </div>
          ))}

          {Array.from({ length: FILAS }, (_, f) => (
            <FilaDeHoja
              key={`f${f}`}
              fila={f}
              sel={sel}
              hoja={hoja}
              celdas={celdas}
              motor={motor}
              editando={editando}
              seleccion={seleccion}
              enCiclo={enCiclo}
              precede={precede}
              depende={depende}
              onSel={(col) => {
                setSel({ col, fila: f });
                setEditando(null);
              }}
              onEditar={(col) => {
                setSel({ col, fila: f });
                setEditando(celdas[dir(col, f)]?.crudo ?? '');
              }}
              onCambio={setEditando}
              onConfirmar={confirmar}
            />
          ))}
        </div>

        <div className="hj-pestanas">
          {motor.libro.hojas.map((h) => (
            <button
              key={h.id}
              type="button"
              className={h.id === hoja ? 'es-activa' : ''}
              onClick={() => mandar({ comando: 'activarHoja', args: { hoja: h.id } })}
            >
              {h.nombre}
            </button>
          ))}
          <span className="hj-estado">
            {motor.circulares.length > 0 ? (
              <b className="es-circular">⟳ Referencias circulares: {motor.circulares.join(', ')}</b>
            ) : (
              <>
                {motor.valores.size} celdas con valor · {motor.precedentes.size} con fórmula
              </>
            )}
          </span>
        </div>
      </section>

      {/* ── la grabadora del §45.6 ──────────────────────────────────────── */}

      <section className="hj-macro">
        <div className="hj-macro-cabeza">
          <h2>La grabadora · «los comandos son datos» (§45.6)</h2>
          <div className="hj-botones">
            <button
              type="button"
              className={grabando ? 'es-grabando' : 'es-principal'}
              onClick={() => {
                grabadora.current.grabando = !grabando;
                setGrabando(!grabando);
              }}
            >
              {grabando ? '⏹ parar' : '⏺ grabar'}
            </button>
            <button
              type="button"
              disabled={gestos.length === 0}
              onClick={() => {
                setCaja({ motor: crearMotor(reproducir(motor.libro, gestos), CONTEXTO) });
                setVeredicto(null);
              }}
            >
              ▶ reproducir sobre la hoja de ahora
            </button>
            <button
              type="button"
              disabled={gestos.length === 0}
              onClick={() => {
                grabadora.current.gestos = [];
                setGestos([]);
              }}
            >
              borrar la macro
            </button>
          </div>
        </div>
        {gestos.length === 0 ? (
          <p className="hj-vacio">
            Sin gestos. Pulsa <b>grabar</b>, escribe unas celdas en la hoja de arriba y mira lo que aparece aquí: no
            son funciones, son datos, y por eso se pueden guardar en un archivo y enseñar en una lista.
          </p>
        ) : (
          <ol className="hj-gestos">
            {gestos.map((g, i) => (
              <li key={`${g.comando}-${i}`}>
                <span className="hj-gesto-n">{i + 1}</span>
                <span className="hj-gesto-txt">{etiquetaDe(g)}</span>
                <code>{JSON.stringify(g)}</code>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

/* ── una fila ───────────────────────────────────────────────────────────────*/

interface PropsFila {
  fila: number;
  sel: { col: number; fila: number };
  hoja: string;
  celdas: Record<string, { crudo: string; formato?: import('@/components/office/motor-hojas/modelo').Formato }>;
  motor: Motor;
  editando: string | null;
  seleccion: string;
  enCiclo: Set<string>;
  precede: Set<string>;
  depende: Set<string>;
  onSel: (col: number) => void;
  onEditar: (col: number) => void;
  onCambio: (t: string) => void;
  onConfirmar: (t: string, dCol: number, dFila: number) => void;
}

function FilaDeHoja(p: PropsFila) {
  const { fila, sel, hoja, celdas, motor, editando, seleccion, enCiclo, precede, depende } = p;
  return (
    <>
      <div className={`hj-cabecera hj-num ${fila === sel.fila ? 'es-activa' : ''}`}>{fila + 1}</div>
      {Array.from({ length: COLS }, (_, col) => {
        const d = dir(col, fila);
        const k = clave(hoja, col, fila);
        const celda = celdas[d];
        const valor: Valor = motor.valores.get(k) ?? null;
        const visto = comoSeVe(valor, celda?.formato);
        const esSel = k === seleccion;
        const clases = [
          'hj-celda',
          esSel ? 'es-sel' : '',
          enCiclo.has(k) ? 'es-circular' : '',
          precede.has(k) ? 'es-precede' : '',
          depende.has(k) ? 'es-depende' : '',
          celda?.crudo.startsWith('=') ? 'es-formula' : '',
          typeof valor === 'object' && valor !== null ? 'es-error' : '',
        ]
          .filter(Boolean)
          .join(' ');

        if (esSel && editando !== null) {
          return (
            <div key={d} className={clases}>
              <input
                autoFocus
                className="hj-editor"
                value={editando}
                onChange={(e) => p.onCambio(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    p.onConfirmar(editando, 0, 1);
                  }
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    p.onConfirmar(editando, 1, 0);
                  }
                  if (e.key === 'Escape') p.onCambio('');
                }}
              />
            </div>
          );
        }

        return (
          <div
            key={d}
            className={clases}
            data-celda={d}
            style={{ textAlign: visto.alineacion as 'left' }}
            onClick={() => p.onSel(col)}
            onDoubleClick={() => p.onEditar(col)}
            role="gridcell"
            tabIndex={-1}
          >
            {visto.texto}
          </div>
        );
      })}
    </>
  );
}
