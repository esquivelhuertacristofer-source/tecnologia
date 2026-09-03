'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  useBloques,
  VentanaBloques,
  type BloquePuesto,
  type CategoriaBloques,
  type EventoBloques,
  type FichaBloque,
  type InformeCorrida,
  type Preguntar,
  type Programa,
} from '@/components/simuladores/bloques';
import { ArcadeSala, useBit, type FinalMaquina } from '../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import './salaBloques.css';

/**
 * LA SALA DE LAS CLASES DE TECNIA BLOQUES — el chasis, no el programa.
 *
 * Es a `n6-programa-un-microbit`, `n6-reto-robot` y `n9-automatiza-tareas` lo
 * que `SalaCodigo` es a las clases de Python: marquesina, pips de encargo,
 * marcador, Salir, Bit con voz, portada de objetivos, el editor de bloques
 * dentro del bisel y la pantalla final con insignia. Nada de esto sabe si el
 * alumno acertó — eso vive en `ClaseBloques.guion`, que trae cada clase.
 *
 * ── Por qué hay UN motor de encargos y no tres copiados a mano ─────────────
 *
 * Las tres clases comparten la misma forma de avance: un guion de encargos, un
 * `logro` por encargo que se comprueba contra el estado vivo del editor y del
 * mundo de la actividad, y un aviso a Bit cuando se cumple. Es la misma idea
 * que `GuionCodigo`/`useCodigo` para Python, adaptada a que aquí no hay un
 * archivo de texto sino un `Programa` de bloques y un `mundo` — el estado
 * propio de cada escenario (una placa, un robot, una bandeja de entrada).
 *
 * ── El escenario, y el único hueco de escape hacia él ───────────────────────
 *
 * `ClaseBloques.Escenario` es quien pinta el mundo: no lo sabe este archivo, y
 * por eso `mundo` es un genérico `M`. Lo único que el escenario puede pedirle
 * de vuelta a la sala es `accionar(id)` — un identificador de texto que sólo
 * la propia clase interpreta en `manejarAccion` (por ejemplo, «botón A» para
 * el micro:bit o «correo-factura» para la bandeja). El armazón de bloques no
 * corre dos guiones a la vez, así que `accionar` sirve para decidir CUÁL de
 * las pilas corre (`correr(pila)`), no para ejecutar nada por su cuenta.
 *
 * ── Por qué no resta puntos romper el programa ──────────────────────────────
 *
 * Igual que en Python: lo único que resta puntos es fallar una pregunta de
 * elección. Chocar con una pared, un guion vacío o un `si` sin condición son
 * el temario, no una falta — se cuentan como «se rompió N veces» en la
 * pantalla final, sin signo negativo.
 */

/* ─────────────────────────── el motor de encargos ─────────────────────────── */

export interface ContextoEncargo<M> {
  programa: Programa;
  corriendo: boolean;
  enPausa: boolean;
  nodoActivo: string | null;
  /** El parte de la última corrida que TERMINÓ. `null` si todavía no se corrió nada. */
  parte: InformeCorrida | null;
  mundo: M;
}

export type LogroEncargo<M> =
  | { tipo: 'estado'; comprueba: (ctx: ContextoEncargo<M>) => boolean }
  | { tipo: 'eleccion'; opciones: readonly string[]; correcta: number };

export interface EncargoBloques<M> {
  id: string;
  titulo: string;
  instruccion: string;
  pista: string;
  logro: LogroEncargo<M>;
  aprendido: string;
}

export interface DatosPortadaBloques {
  situacion: string;
  tema: string;
  objetivo: string;
  vasAHacer: string[];
}

export interface ContextoAccion<M> {
  correr: (pila?: string) => void;
  establecerMundo: (f: (mundo: M) => M) => void;
  mundo: M;
}

export interface EscenarioProps<M> {
  mundo: M;
  /** El guion vivo. Lo pide `n6-bloques-vs-codigo` para pintar su cara de texto. */
  programa: Programa;
  nodoActivo: string | null;
  corriendo: boolean;
  /** El único hueco de vuelta hacia la sala: un id que la propia clase interpreta. */
  accionar: (id: string) => void;
}

export interface ClaseBloques<M> {
  actividadId: string;
  titulo: string;
  /** La marca de `VentanaBase`: «Tecnia Bloques · Micro:bit», por ejemplo. */
  marca: string;
  insignia: { nombre: string; emoji: string };
  minutos: number;
  portada: DatosPortadaBloques;
  catalogo: readonly FichaBloque[];
  categorias: readonly CategoriaBloques[];
  categoriaInicial: string;
  programaInicial: Programa;
  pilaInicial?: string;
  velocidad?: number;
  mundoInicial: M;
  preguntar: (pregunta: string, bloque: BloquePuesto, mundo: M) => boolean;
  reducir: (mundo: M, evento: EventoBloques) => M;
  /** Lo que hace `accionar(id)` del escenario. Ausente si el escenario no lo usa. */
  manejarAccion?: (id: string, ctx: ContextoAccion<M>) => void;
  /**
   * Si está, el mundo vuelve a este estado cada vez que arranca una corrida
   * (▶). Lo necesita un escenario con posición —un robot en una cuadrícula—,
   * donde probar dos veces desde el mismo sitio es parte del ejercicio.
   * Ausente en los escenarios donde el mundo se acumula entre corridas (una
   * pantalla que sigue mostrando lo último, un contador de correos).
   */
  reiniciarMundoAlCorrer?: (mundo: M) => M;
  guion: readonly EncargoBloques<M>[];
  Escenario: ComponentType<EscenarioProps<M>>;
  bit: { inicio: string; cierre: string };
  final: { titulo: string; detalle: string };
}

/* ─────────────────────────────── la portada ──────────────────────────────── */

interface PortadaBloquesProps {
  portada: DatosPortadaBloques;
  encargos: number;
  minutos: number;
  insignia: { nombre: string; emoji: string };
  onEmpezar: () => void;
}

function PortadaBloques({ portada, encargos, minutos, insignia, onEmpezar }: PortadaBloquesProps) {
  const boton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => boton.current?.focus());
    const teclas = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      onEmpezar();
    };
    window.addEventListener('keydown', teclas);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('keydown', teclas);
    };
  }, [onEmpezar]);

  return (
    <div
      className="blqs-portada"
      role="dialog"
      aria-modal="true"
      aria-label="Objetivos de la práctica"
      data-testid="blqs-portada"
    >
      <div className="blqs-portada-caja">
        <p className="blqs-portada-situacion">{portada.situacion}</p>
        <h2 className="blqs-portada-tema">{portada.tema}</h2>

        <div className="blqs-portada-objetivo">
          <span className="blqs-portada-etiqueta">Al terminar</span>
          <p>{portada.objetivo}</p>
        </div>

        <div className="blqs-portada-cuerpo">
          <div className="blqs-portada-lista">
            <span className="blqs-portada-etiqueta">Lo que vas a hacer</span>
            <ol>
              {portada.vasAHacer.map((linea) => (
                <li key={linea}>{linea}</li>
              ))}
            </ol>
          </div>

          <div className="blqs-portada-lado">
            <div className="blqs-portada-datos">
              <span>
                <b>{encargos}</b> encargos
              </span>
              <span>
                <b>{minutos}</b> min
              </span>
            </div>
            <div className="blqs-portada-insignia">
              <span className="blqs-portada-insignia-glifo" aria-hidden="true">
                {insignia.emoji}
              </span>
              <span className="blqs-portada-insignia-nombre">Insignia · {insignia.nombre}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          ref={boton}
          className="blqs-portada-boton"
          data-testid="blqs-empezar"
          onClick={onEmpezar}
        >
          <span className="blqs-portada-boton-glifo" aria-hidden="true">
            🧩
          </span>
          Empezar
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────── el panel del encargo ──────────────────────────── */

interface PanelEncargoProps<M> {
  paso: EncargoBloques<M>;
  indice: number;
  total: number;
  hecho: boolean;
  eleccion: number | null;
  onElegir: (i: number) => void;
}

function PanelEncargo<M,>({ paso, indice, total, hecho, eleccion, onElegir }: PanelEncargoProps<M>) {
  const [pistaAbierta, setPistaAbierta] = useState(false);

  const logro = paso.logro;
  const bloqueEleccion =
    logro.tipo === 'eleccion' ? (
      <div className="blqs-panel-opciones" role="radiogroup" aria-label="Elige una respuesta">
        {logro.opciones.map((op, i) => (
          <button
            key={op}
            type="button"
            className={`blqs-opcion${eleccion === i ? (i === logro.correcta ? ' es-bien' : ' es-mal') : ''}`}
            aria-pressed={eleccion === i}
            onClick={() => onElegir(i)}
          >
            {op}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div className="blqs-panel" data-testid="blqs-panel" data-hecho={hecho ? 'si' : 'no'}>
      <div className="blqs-panel-cabecera">
        <span className="blqs-panel-num">
          Encargo {indice + 1}/{total}
        </span>
        {hecho && (
          <span className="blqs-panel-check" aria-hidden="true">
            ✔
          </span>
        )}
      </div>
      <h3 className="blqs-panel-titulo">{paso.titulo}</h3>
      <p className="blqs-panel-instruccion">{paso.instruccion}</p>
      {bloqueEleccion}
      <button type="button" className="blqs-panel-pista" onClick={() => setPistaAbierta((v) => !v)}>
        {pistaAbierta ? 'Ocultar pista' : '¿Necesitas una pista?'}
      </button>
      {pistaAbierta && <p className="blqs-panel-pista-texto">{paso.pista}</p>}
    </div>
  );
}

/* ─────────────────────────────── la mesa ─────────────────────────────────── */

interface MesaProps<M> {
  clase: ClaseBloques<M>;
  onAvance: () => void;
  onTerminado: (r: { segundos: number; tropiezos: number }) => void;
  onAprendido: (texto: string) => void;
  onFalloDeEleccion: () => void;
}

function Mesa<M,>({ clase, onAvance, onTerminado, onAprendido, onFalloDeEleccion }: MesaProps<M>) {
  const [mundo, setMundo] = useState<M>(clase.mundoInicial);
  const mundoRef = useRef(mundo);
  const [categoria, setCategoria] = useState(clase.categoriaInicial);
  const [pasoActual, setPasoActual] = useState(0);
  const [eleccion, setEleccion] = useState<number | null>(null);
  const [parte, setParte] = useState<InformeCorrida | null>(null);

  /*
   * El reloj arranca en un efecto, NO en el render. `Date.now()` llamado
   * durante el render es impuro y `react-hooks/purity` lo prohíbe con razón:
   * en modo estricto el render corre dos veces y el valor no es estable.
   *
   * Estaba escrito así desde el principio y NADIE lo veía, porque un
   * `eslint-disable-next-line react-hooks/exhaustive-deps` puesto cuarenta
   * líneas más abajo —por otra regla y por otro motivo— apagaba también el
   * análisis de pureza de todo este componente. Medido el 21-ago-2026:
   * quitando esa directiva el error aparece, poniéndola desaparece.
   * Es la lección de la casa otra vez: un aviso escrito en un comentario no
   * es una medida, y aquí encima el comentario silenciaba la medida.
   */
  const inicioRef = useRef(0);
  useEffect(() => {
    inicioRef.current = Date.now();
  }, []);
  const tropiezosRef = useRef(0);
  const hechoRef = useRef<Set<string>>(new Set());
  const falladasRef = useRef<Set<string>>(new Set());

  const aplicarMundo = useCallback((f: (m: M) => M) => {
    const nuevo = f(mundoRef.current);
    mundoRef.current = nuevo;
    setMundo(nuevo);
  }, []);

  const preguntar: Preguntar = useCallback(
    (pregunta, bloque) => clase.preguntar(pregunta, bloque, mundoRef.current),
    [clase],
  );

  const onEvento = useCallback(
    (evento: EventoBloques) => aplicarMundo((m) => clase.reducir(m, evento)),
    [clase, aplicarMundo],
  );

  const onFin = useCallback((p: InformeCorrida) => {
    setParte(p);
    if (p.fin === 'tope' || p.fin === 'vacio') tropiezosRef.current += 1;
  }, []);

  const bl = useBloques({
    catalogo: clase.catalogo,
    inicial: clase.programaInicial,
    velocidad: clase.velocidad ?? 450,
    pila: clase.pilaInicial,
    preguntar,
    onEvento,
    onFin,
  });

  useEffect(() => {
    if (bl.rechazo) tropiezosRef.current += 1;
    // Sólo cuenta el rebote, no un contador dependiente de identidad de objeto.
  }, [bl.rechazo]);

  useEffect(() => setEleccion(null), [pasoActual]);

  /* El mundo vuelve al principio en cada ▶, si la clase lo pide (un robot en
   * una cuadrícula). Se dispara desde un efecto que mira el flanco
   * false→true de `corriendo`, nunca desde dentro de un actualizador. */
  const corriaRef = useRef(bl.corriendo);
  useEffect(() => {
    if (bl.corriendo && !corriaRef.current && clase.reiniciarMundoAlCorrer) {
      aplicarMundo(clase.reiniciarMundoAlCorrer);
    }
    corriaRef.current = bl.corriendo;
  }, [bl.corriendo, clase, aplicarMundo]);

  const paso = clase.guion[pasoActual] ?? null;
  const contexto: ContextoEncargo<M> = {
    programa: bl.programa,
    corriendo: bl.corriendo,
    enPausa: bl.enPausa,
    nodoActivo: bl.nodoActivo,
    parte,
    mundo,
  };
  const hecho = paso
    ? paso.logro.tipo === 'estado'
      ? paso.logro.comprueba(contexto)
      : eleccion === paso.logro.correcta
    : false;

  useEffect(() => {
    if (!paso || !hecho || hechoRef.current.has(paso.id)) return;
    hechoRef.current.add(paso.id);
    onAvance();
    onAprendido(paso.aprendido);
    const siguiente = pasoActual + 1;
    if (siguiente < clase.guion.length) {
      setPasoActual(siguiente);
    } else {
      onTerminado({
        segundos: Math.round((Date.now() - inicioRef.current) / 1000),
        tropiezos: tropiezosRef.current,
      });
    }
    // `clase` es estable durante toda la sesión (viene de una constante del módulo).
  }, [hecho, paso, pasoActual, clase.guion.length, onAvance, onAprendido, onTerminado]);

  const elegir = useCallback(
    (i: number) => {
      setEleccion(i);
      if (paso && paso.logro.tipo === 'eleccion' && i !== paso.logro.correcta) {
        const marca = `${paso.id}:${i}`;
        if (!falladasRef.current.has(marca)) {
          falladasRef.current.add(marca);
          onFalloDeEleccion();
        }
      }
    },
    [paso, onFalloDeEleccion],
  );

  const accionar = useCallback(
    (id: string) => {
      clase.manejarAccion?.(id, {
        correr: (p) => {
          bl.correr(p);
        },
        establecerMundo: aplicarMundo,
        mundo: mundoRef.current,
      });
    },
    [clase, bl, aplicarMundo],
  );

  return (
    <VentanaBase marca={clase.marca} claseMarco="blqs-marco">
      <VentanaBloques
        catalogo={clase.catalogo}
        categorias={clase.categorias}
        categoria={categoria}
        onCategoria={setCategoria}
        programa={bl.programa}
        elegida={bl.elegida}
        nodoActivo={bl.nodoActivo}
        corriendo={bl.corriendo}
        enPausa={bl.enPausa}
        rechazo={bl.rechazo}
        aviso={bl.aviso}
        escenario={
          <clase.Escenario mundo={mundo} programa={bl.programa} nodoActivo={bl.nodoActivo} corriendo={bl.corriendo} accionar={accionar} />
        }
        panel={
          paso && (
            <PanelEncargo
              key={paso.id}
              paso={paso}
              indice={pasoActual}
              total={clase.guion.length}
              hecho={hecho}
              eleccion={eleccion}
              onElegir={elegir}
            />
          )
        }
        velocidad={bl.velocidad}
        onElegir={bl.elegir}
        onSoltar={bl.soltar}
        onQuitar={bl.quitarBloque}
        onValor={bl.ponerValor}
        onCorrer={() => bl.correr()}
        onPausar={bl.pausar}
        onContinuar={bl.continuar}
        onPaso={bl.pasoAPaso}
        onParar={bl.parar}
        onVelocidad={bl.cambiarVelocidad}
      />
    </VentanaBase>
  );
}

/* ─────────────────────────────── la sala ─────────────────────────────────── */

export function SalaBloques<M,>({
  clase,
  alSalir,
  ...props
}: ActivityProps & { clase: ClaseBloques<M>; alSalir?: () => void }) {
  const total = clase.guion.length;
  const { pasos, terminado, tiempoFinal, puntaje, restar, avanzar, terminar, reiniciar } = useLabActividad(
    props,
    total,
  );
  const { linea: bitLinea, hablar } = useBit();

  const [fase, setFase] = useState<'portada' | 'practica'>('portada');
  const [intento, setIntento] = useState(0);
  const [resumen, setResumen] = useState<{ segundos: number; tropiezos: number } | null>(null);
  const [puntos, setPuntos] = useState(100);

  const empezar = useCallback(() => {
    setFase('practica');
    hablar(clase.bit.inicio);
  }, [hablar, clase.bit.inicio]);

  const alTerminado = useCallback(
    (r: { segundos: number; tropiezos: number }) => {
      setResumen(r);
      setPuntos(terminar(r.segundos, () => hablar(clase.bit.cierre)));
    },
    [terminar, hablar, clase.bit.cierre],
  );

  const alFallar = useCallback(() => {
    restar();
    setPuntos(puntaje());
  }, [restar, puntaje]);

  const repetir = useCallback(() => {
    reiniciar(() => {
      setResumen(null);
      setPuntos(100);
      setIntento((i) => i + 1);
      setFase('portada');
    });
  }, [reiniciar]);

  const tropiezos = resumen?.tropiezos ?? 0;
  const final: FinalMaquina | null = terminado
    ? {
        insigniaNombre: clase.insignia.nombre,
        insigniaEmoji: clase.insignia.emoji,
        titulo: clase.final.titulo,
        detalle: clase.final.detalle,
        resumen: [
          { etiqueta: 'Encargos', valor: `${total}` },
          { etiqueta: 'Tiempo', valor: formatTiempo(resumen?.segundos ?? tiempoFinal) },
          { etiqueta: 'Se rompió', valor: `${tropiezos} ${tropiezos === 1 ? 'vez' : 'veces'}` },
          { etiqueta: 'Puntos', valor: `${puntos}` },
        ],
        alRepetir: repetir,
      }
    : null;

  return (
    <ArcadeSala
      titulo={clase.titulo}
      pasoEtiqueta="Encargo"
      pasoActual={Math.min(pasos + 1, total)}
      pasosTotal={total}
      marcadorEtiqueta="Puntos"
      marcadorValor={String(puntos)}
      bit={fase === 'practica' ? bitLinea : null}
      final={final}
      alSalir={alSalir}
    >
      {fase === 'portada' ? (
        <PortadaBloques
          portada={clase.portada}
          encargos={total}
          minutos={clase.minutos}
          insignia={clase.insignia}
          onEmpezar={empezar}
        />
      ) : (
        <Mesa
          key={intento}
          clase={clase}
          onAvance={avanzar}
          onTerminado={alTerminado}
          onAprendido={hablar}
          onFalloDeEleccion={alFallar}
        />
      )}
    </ArcadeSala>
  );
}

export default SalaBloques;
