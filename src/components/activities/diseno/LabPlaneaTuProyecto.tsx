'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../n1/mision/audio';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  accion,
  capaDe,
  capasDe,
  documentoEn,
  PALETA_BASE,
  seTapan,
  textosDe,
  useDiseno,
  VentanaDiseno,
  type Caja,
  type Capa,
  type Diseno,
  type Documento,
  type Historia,
  type Lienzo,
} from '@/components/simuladores/diseno';
import { PortadaDiseno, type DatosPortadaDiseno } from './PortadaDiseno';
import { TarjetaPaso, type PasoGuionDiseno } from './useGuionDiseno';
import './diseno-sala.css';
import './planeaTuProyecto.css';

/**
 * N5 · U «Programación en bloques III», parada 3 y CIERRE de la unidad ·
 * «Planea tu proyecto» (`n5-planea-tu-proyecto`).
 *
 * **N5 = 5.º de Primaria = 10–11 años**, comprobado en `curriculo.ts`
 * (línea 483: `n: 5, … grado: '5° de Primaria', edad: '10–11'`).
 *
 * ── Por qué esta clase usa el armazón de diseño sin ser de diseño ──────────
 *
 * El §54 lo dejó escrito: ésta no es una clase de diseño gráfico, es la parada
 * de cierre de una unidad de **programación en bloques**, y lo que produce es
 * **un plan de un juego**. El armazón le presta el lienzo como papel
 * cuadriculado —el tablero del proyecto, y al final la hoja de bocetos— pero
 * las preguntas del armazón (¿está centrado?, ¿hay jerarquía?, ¿dio crédito?)
 * **no se hacen aquí ni una vez**. Aquí se pregunta: ¿está completo?, ¿cabe?,
 * ¿se puede hacer en ese orden?
 *
 * ── Las tres reglas que salieron de construirla ────────────────────────────
 *
 * 1. **Un clic, UNA acción.** `useDiseno.hacer` cierra sobre la `historia` del
 *    render en curso (no usa la forma funcional de `setState`), así que dos
 *    `d.hacer(...)` seguidos en el mismo manejador se pisan y el segundo borra
 *    al primero. Por eso «ordenar» no es un intercambio de dos tarjetas sino
 *    «ponerla la última», que es un solo `mover`.
 * 2. **El encargo 2 se juzga sobre el HISTORIAL, no sobre el tablero**, porque
 *    el encargo 3 deshace el tablero del 2 a propósito —ése es el contenido de
 *    la clase— y un predicado que un encargo posterior deshace está mal
 *    escrito. Se pregunta por algo que ya no se puede deshacer: *hubo un
 *    momento en que tu plan tuvo las cuatro y tres extras*.
 * 3. **Nada de índices en `useState` leídos dentro del mismo tick.** Los
 *    destinos se calculan del documento y el único contador que hay
 *    (`creandoRef`) es un `useRef`, para que un doble clic no cree dos hojas.
 */

/* ── el catálogo del proyecto: DATO de la clase, no del armazón ───────────── */

export interface Pieza {
  id: string;
  /** El id de la capa que la representa en el tablero. */
  capa: string;
  nombre: string;
  semanas: number;
  /** Sin ella no hay juego. Las cuatro imprescindibles no se pueden recortar. */
  imprescindible: boolean;
  /** Qué tiene que estar hecho ANTES que ella. Manda en el orden del plan. */
  necesita: string | null;
}

const pieza = (
  id: string,
  nombre: string,
  semanas: number,
  imprescindible: boolean,
  necesita: string | null,
): Pieza => ({ id, capa: `pz-${imprescindible ? 'b' : 'x'}-${id}`, nombre, semanas, imprescindible, necesita });

export const PIEZAS: readonly Pieza[] = [
  pieza('personaje', 'Personaje que se mueve', 1, true, null),
  pieza('nivel', 'Un nivel con obstáculos', 1, true, 'personaje'),
  pieza('marcador', 'Marcador de puntos', 1, true, 'nivel'),
  pieza('meta', 'Pantalla de ¡Ganaste!', 1, true, 'nivel'),
  pieza('nivel2', 'Un segundo nivel', 2, false, 'nivel'),
  pieza('musica', 'Música y sonidos', 2, false, 'nivel'),
  pieza('tienda', 'Tienda de sombreros', 2, false, 'marcador'),
  pieza('jefe', 'Un jefe final', 3, false, 'nivel2'),
  pieza('mapa', 'Mapa distinto cada vez', 3, false, 'nivel'),
  pieza('dosjug', 'Dos jugadores a la vez', 4, false, 'personaje'),
];

const POR_ID: ReadonlyMap<string, Pieza> = new Map(PIEZAS.map((p) => [p.id, p]));
const POR_CAPA: ReadonlyMap<string, Pieza> = new Map(PIEZAS.map((p) => [p.capa, p]));

export const piezaDeCapa = (capaId: string): Pieza | null => POR_CAPA.get(capaId) ?? null;
export const piezaPorId = (id: string): Pieza | null => POR_ID.get(id) ?? null;

/** Seis semanas de clase. Las cuatro imprescindibles suman 4: siempre cabe un extra. */
export const PRESUPUESTO = 6;

/* ── la geometría del tablero: enteros de rejilla, sin un solo decimal ────── */

export const PAGINA = 'tablero';
const PREFIJO = 'pz-';
const LIENZO: Lienzo = { cols: 24, filas: 24, celdaPx: 26 };
const CARTA = { cols: 4, filas: 4 };
const COLS_SLOT = [0, 4, 8, 12, 16, 20];
const FILAS_PLAN = [2, 7];
const FILAS_CAJA = [15, 20];

/** Por debajo de esta fila se está EN EL PLAN; de aquí abajo, en la caja de ideas. */
export const FILA_CORTE = 13;

export interface Slot {
  i: number;
  col: number;
  fila: number;
}

const slots = (filas: readonly number[]): Slot[] =>
  filas.flatMap((fila, f) => COLS_SLOT.map((col, c) => ({ i: f * COLS_SLOT.length + c, col, fila })));

/** Las doce casillas del plan y las doce de la caja, en orden de lectura. */
export const SLOTS_PLAN = slots(FILAS_PLAN);
export const SLOTS_CAJA = slots(FILAS_CAJA);

const cajaDeSlot = (s: Slot): Caja => ({ col: s.col, fila: s.fila, cols: CARTA.cols, filas: CARTA.filas });

/* ── el documento de partida ─────────────────────────────────────────────── */

/**
 * Las diez piezas están en la caja **desordenadas a propósito**: la primera que
 * se ve es «Marcador de puntos», que es justo la que no puede ir primera. Quien
 * las suba en el orden en que las encuentra se lleva un plan imposible, y el
 * encargo 4 tendrá algo de verdad que arreglar.
 */
const ORDEN_EN_LA_CAJA = [
  'marcador',
  'jefe',
  'personaje',
  'musica',
  'meta',
  'nivel',
  'dosjug',
  'nivel2',
  'tienda',
  'mapa',
];

const tarjetaInicial = (p: Pieza, s: Slot): Capa => ({
  tipo: 'texto',
  id: p.capa,
  nombre: p.nombre,
  caja: cajaDeSlot(s),
  giro: 0,
  opacidad: 10,
  texto: `${p.nombre} · ${p.semanas} sem`,
  pt: 12,
  color: p.imprescindible ? 'amarillo' : 'cian',
  alineacion: 'centro',
  negrita: true,
});

const rotulo = (id: string, texto: string, fila: number, cols: number, color: string): Capa => ({
  tipo: 'texto',
  id,
  nombre: texto,
  caja: { col: 0, fila, cols, filas: 1 },
  giro: 0,
  opacidad: 10,
  bloqueada: true,
  texto,
  pt: 16,
  color,
  alineacion: 'izq',
  negrita: true,
});

const banda = (id: string, fila: number, filas: number, relleno: string): Capa => ({
  tipo: 'forma',
  id,
  nombre: id,
  caja: { col: 0, fila, cols: LIENZO.cols, filas },
  giro: 0,
  opacidad: 3,
  bloqueada: true,
  figura: 'redondeado',
  relleno,
  borde: null,
});

export const DOC_INICIAL: Documento = {
  lienzo: LIENZO,
  paleta: PALETA_BASE,
  banco: {},
  paginas: [
    {
      id: PAGINA,
      nombre: 'Tablero del proyecto',
      fondo: 'tinta',
      capas: [
        banda('banda-plan', 1, 12, 'azul'),
        banda('banda-caja', 14, 10, 'violeta'),
        rotulo('rot-plan', 'MI PLAN · lo que sí vas a hacer', 0, 18, 'nieve'),
        rotulo('rot-caja', 'PARA MÁS ADELANTE · la caja de ideas', 13, 20, 'nieve'),
        ...ORDEN_EN_LA_CAJA.map((id, i) => {
          const p = POR_ID.get(id);
          const s = SLOTS_CAJA[i];
          if (!p || !s) throw new Error(`tablero mal armado: ${id}`);
          return tarjetaInicial(p, s);
        }),
      ],
    },
  ],
};

/* ── las preguntas de la clase: todas enteras, todas sobre el documento ──── */

export interface EnTablero {
  pieza: Pieza;
  capa: Capa;
}

const tarjetas = (doc: Documento): Capa[] => capasDe(doc, PAGINA).filter((c) => c.id.startsWith(PREFIJO));

/** Lo que hay en una banda, ya en ORDEN DE LECTURA: fila y luego columna. */
function enLaBanda(doc: Documento, plan: boolean): EnTablero[] {
  const salida: EnTablero[] = [];
  for (const capa of tarjetas(doc)) {
    if (capa.caja.fila < FILA_CORTE !== plan) continue;
    const p = piezaDeCapa(capa.id);
    if (p) salida.push({ pieza: p, capa });
  }
  salida.sort((a, b) => a.capa.caja.fila - b.capa.caja.fila || a.capa.caja.col - b.capa.caja.col);
  return salida;
}

export const enElPlan = (doc: Documento): EnTablero[] => enLaBanda(doc, true);
export const enLaCaja = (doc: Documento): EnTablero[] => enLaBanda(doc, false);

export const costeDelPlan = (doc: Documento): number =>
  enElPlan(doc).reduce((n, x) => n + x.pieza.semanas, 0);

export const imprescindiblesEnPlan = (doc: Documento): number =>
  enElPlan(doc).filter((x) => x.pieza.imprescindible).length;

export const extrasEnPlan = (doc: Documento): number =>
  enElPlan(doc).filter((x) => !x.pieza.imprescindible).length;

/** Cuántas piezas hay que meter sí o sí. Se cuenta del catálogo, no a mano. */
export const TOTAL_IMPRESCINDIBLES = PIEZAS.filter((p) => p.imprescindible).length;

export interface ProblemaDeOrden {
  pieza: Pieza;
  necesita: Pieza;
  /** `true` si lo que necesita ni siquiera está en el plan. */
  falta: boolean;
}

/**
 * La primera pieza del plan que va ANTES de algo que necesita. Devuelve la
 * pareja concreta, no un «está mal»: el panel señala cuál con cuál.
 */
export function problemaDeOrden(doc: Documento): ProblemaDeOrden | null {
  const plan = enElPlan(doc);
  const posicion = new Map(plan.map((x, i) => [x.pieza.id, i]));
  for (let i = 0; i < plan.length; i += 1) {
    const necesitaId = plan[i].pieza.necesita;
    if (!necesitaId) continue;
    const antes = POR_ID.get(necesitaId);
    if (!antes) continue;
    const donde = posicion.get(necesitaId);
    if (donde === undefined) return { pieza: plan[i].pieza, necesita: antes, falta: true };
    if (donde > i) return { pieza: plan[i].pieza, necesita: antes, falta: false };
  }
  return null;
}

/** Lo más caro que llegó a costar la idea. Es la cifra de la pantalla final. */
export function costeMaximo(h: Historia): number {
  let max = 0;
  for (let i = 0; i <= h.hechas.length; i += 1) {
    const c = costeDelPlan(documentoEn(h, i));
    if (c > max) max = c;
  }
  return max;
}

/**
 * ¿Hubo un momento en que el plan tuvo las cuatro imprescindibles **y tres
 * extras**? Se pregunta al historial y no al tablero porque el encargo 3
 * deshace ese tablero a propósito.
 */
export function llegoAPedirlaGrande(h: Historia): boolean {
  for (let i = 0; i <= h.hechas.length; i += 1) {
    const doc = documentoEn(h, i);
    if (imprescindiblesEnPlan(doc) === TOTAL_IMPRESCINDIBLES && extrasEnPlan(doc) >= 3) return true;
  }
  return false;
}

/** La hoja de bocetos: la segunda pantalla del documento, si es que existe. */
const hoja = (doc: Documento) => doc.paginas[1] ?? null;

/* ── el guion: seis encargos ─────────────────────────────────────────────── */

export const GUION: PasoGuionDiseno[] = [
  {
    id: 'sin-esto-no-hay-juego',
    titulo: 'Sin esto no hay juego',
    instruccion:
      'Sube al PLAN las cuatro piezas amarillas: el personaje, el nivel, el marcador y la pantalla de ¡Ganaste!. Toca una tarjeta y pulsa «Meterla en el plan».',
    pista: 'Son las aburridas, ya lo sé. Pero sin ellas no hay juego que enseñar a nadie.',
    comprueba: (d) => imprescindiblesEnPlan(d.documento) === TOTAL_IMPRESCINDIBLES,
    aprendido: 'Ya tienes un juego: alguien, un sitio, puntos y un final. Y te ha costado 4 de tus 6 semanas.',
  },
  {
    id: 'suena-en-grande',
    titulo: 'Ahora sueña en grande',
    instruccion: 'Sube al plan al menos TRES extras más: los que de verdad te gustaría que tuviera tu juego.',
    pista: 'Pide sin miedo. Esto es lo que se hace en un plan de verdad: primero se pide todo.',
    comprueba: (d) => llegoAPedirlaGrande(d.historia),
    aprendido: 'Mira el contador: se puso rojo. Tu idea cuesta más semanas de las que tienes. A todos nos pasa.',
  },
  {
    id: 'que-quepa',
    titulo: 'Que quepa de verdad',
    instruccion:
      'Baja a «Para más adelante» lo que no cabe, hasta llegar a 6 semanas o menos. Las cuatro amarillas se quedan: sin ellas no hay juego.',
    pista: 'No estás tirando nada: lo que baja se guarda para otra ronda.',
    comprueba: (d) =>
      imprescindiblesEnPlan(d.documento) === TOTAL_IMPRESCINDIBLES && costeDelPlan(d.documento) <= PRESUPUESTO,
    aprendido: 'Tu plan cabe y sigue siendo un juego entero. Aquí recortar cuesta un clic; programando, costaría semanas.',
  },
  {
    id: 'que-va-primero',
    titulo: 'Qué va primero',
    instruccion:
      'Ordena el plan: ninguna pieza puede ir antes de la que necesita. Usa «Ponerla la última del plan» para moverlas de sitio.',
    pista: 'El marcador no puede ir primero: todavía no hay puntos que contar. Empieza por lo que no necesita nada.',
    comprueba: (d) =>
      imprescindiblesEnPlan(d.documento) === TOTAL_IMPRESCINDIBLES &&
      costeDelPlan(d.documento) <= PRESUPUESTO &&
      problemaDeOrden(d.documento) === null,
    aprendido: 'Tu plan se puede hacer de arriba abajo sin atascarse. El orden lo mandan las piezas, no lo que te apetezca.',
  },
  {
    id: 'hoja-de-bocetos',
    titulo: 'Saca la hoja de bocetos',
    instruccion: 'Abajo, en «Pantallas», pulsa «+ Pantalla» para tener una hoja en blanco.',
    pista: 'Un plan también se dibuja. La hoja nueva no borra el tablero: son dos pantallas del mismo proyecto.',
    comprueba: (d) => d.documento.paginas.length >= 2,
    aprendido: 'Hoja nueva. Aquí no hay que acertar, hay que entender lo que vas a programar.',
  },
  {
    id: 'boceta-lo-primero',
    titulo: 'Dibuja la primera pantalla',
    instruccion:
      'Cambia a la hoja nueva y boceta lo primero que vas a programar: una forma con «Formas» y un letrero con «Texto».',
    pista: 'Rayas y cajas. Un boceto no tiene que quedar bonito: tiene que dejarte claro qué haces el lunes.',
    comprueba: (d) => {
      const h = hoja(d.documento);
      if (!h) return false;
      return capasDe(d.documento, h.id).some((c) => c.tipo === 'forma') && textosDe(d.documento, h.id).length >= 1;
    },
    aprendido: 'Con este boceto ya puedes empezar a programar. Eso es un plan: completo, que cabe, en orden y dibujado.',
  },
];

const TOTAL_PASOS = GUION.length;

/* ── el motor de pasos de esta clase ─────────────────────────────────────── */

/**
 * Igual que `useGuionDiseno`, con **una diferencia medida**: allí el guardián es
 * sólo el documento, así que cuando un encargo queda satisfecho por la misma
 * acción que cerró el anterior, no se evalúa hasta que el alumno vuelva a tocar
 * el documento — y si el alumno cree que ya está hecho, se queda mirando una
 * tarjeta que no avanza. Aquí el guardián es la pareja (documento, índice), así
 * que los encargos encadenados se resuelven en cascada, uno por pasada, cada
 * uno con su propio `onAvance`. En modo estricto las dos invocaciones del
 * efecto ven la misma pareja y la segunda no hace nada.
 */
function usePasosDelPlan(
  d: Diseno,
  pasos: readonly PasoGuionDiseno[],
  opciones: { onAvance: (paso: PasoGuionDiseno, indice: number) => void; onTerminado: () => void },
): { indice: number; actual: PasoGuionDiseno | null; terminado: boolean } {
  const [indice, setIndice] = useState(0);
  const [terminado, setTerminado] = useState(false);
  const juzgado = useRef<{ doc: unknown; indice: number }>({ doc: null, indice: -1 });
  const { onAvance, onTerminado } = opciones;

  useEffect(() => {
    if (terminado) return;
    if (juzgado.current.doc === d.documento && juzgado.current.indice === indice) return;
    juzgado.current = { doc: d.documento, indice };
    const paso = pasos[indice];
    if (!paso || !paso.comprueba(d)) return;
    onAvance(paso, indice);
    const siguiente = indice + 1;
    setIndice(siguiente);
    if (siguiente >= pasos.length) {
      setTerminado(true);
      onTerminado();
    }
    // `pasos` es un literal estable por clase; el resto va arriba a propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, indice, terminado]);

  return { indice, actual: pasos[indice] ?? null, terminado };
}

/* ── el panel de la clase ────────────────────────────────────────────────── */

const libre = (s: Slot, ocupantes: readonly Capa[]): boolean =>
  !ocupantes.some((c) => seTapan(cajaDeSlot(s), c.caja));

const PORTADA: DatosPortadaDiseno = {
  situacion: 'Nivel 5 · Programación en bloques III · Parada 3 de 3',
  tema: 'Planea tu proyecto: lo que cabe en seis semanas',
  objetivo:
    'Sabrás partir una idea de juego en piezas, ver cuáles no caben en el tiempo que tienes y recortar sin quedarte sin juego — todo en papel, que es donde arreglarlo sale gratis.',
  vasAHacer: [
    'Meter en el plan las cuatro piezas sin las que no hay juego.',
    'Pedir además todos los extras que quieras.',
    'Descubrir que tu idea no cabe en seis semanas.',
    'Recortar hasta que quepa, sin quedarte sin juego.',
    'Ordenar el plan: nada antes de lo que necesita.',
    'Bocetar la primera pantalla que vas a programar.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 20,
  insignia: { nombre: 'Jefe de proyecto', emoji: '🗺️' },
  boton: 'Abrir el tablero',
  acento: '#facc15',
};

const LINEAS = {
  inicio: 'Hoy no programas ni un bloque. Hoy decides qué vas a programar, y tienes seis semanas de clase.',
  fin: 'Tu idea llegó a costar mucho más de seis semanas y tu plan cabe, sin dejar de ser un juego. Lo arreglaste en papel.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabPlaneaTuProyecto(props: PropsLab) {
  const [intento, setIntento] = useState(0);
  const { onProgress, onScore } = props;

  const repetir = useCallback(() => {
    onProgress(0);
    onScore(100);
    setIntento((n) => n + 1);
  }, [onProgress, onScore]);

  return <Practica key={intento} {...props} alRepetir={repetir} />;
}

function Practica({ alSalir, alRepetir, ...props }: PropsLab & { alRepetir: () => void }) {
  const [empezado, setEmpezado] = useState(false);
  const { pasos, terminado, tiempoFinal, avanzar, terminar } = useLabActividad(props, TOTAL_PASOS);
  const { linea, hablar } = useBit();

  const d = useDiseno({
    documento: DOC_INICIAL,
    herramientas: ['seleccion', 'forma', 'texto', 'paginas'],
  });

  const guion = usePasosDelPlan(d, GUION, {
    onAvance: (paso) => {
      avanzar();
      reproducirTono('correct');
      hablar(paso.aprendido);
    },
    onTerminado: () => terminar(0, () => hablar(LINEAS.fin)),
  });

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  /* El plan vive en la página del tablero, así que estas tres cifras valen
   * igual mirando el tablero que mirando la hoja de bocetos. */
  const enTablero = d.pagina === PAGINA;
  const plan = useMemo(() => enElPlan(d.documento), [d.documento]);
  const coste = useMemo(() => costeDelPlan(d.documento), [d.documento]);
  const problema = useMemo(() => problemaDeOrden(d.documento), [d.documento]);

  const unica = d.seleccion.length === 1 ? capaDe(d.documento, d.pagina, d.seleccion[0]) : null;
  const elegida = unica ? piezaDeCapa(unica.id) : null;
  const enPlan = !!unica && unica.caja.fila < FILA_CORTE;

  /** Un clic, UNA acción: `d.hacer` cierra sobre la historia de este render. */
  const mandarA = useCallback(
    (capa: string, destino: Slot | null) => {
      if (!destino) return;
      d.hacer(accion('mover', { pagina: PAGINA, capa, col: destino.col, fila: destino.fila }));
    },
    [d],
  );

  const otras = unica ? tarjetas(d.documento).filter((c) => c.id !== unica.id) : [];
  const huecoPlan = SLOTS_PLAN.find((s) => libre(s, otras)) ?? null;
  const huecoCaja = SLOTS_CAJA.find((s) => libre(s, otras)) ?? null;
  const ultimoDelPlan = otras.reduce((max, c) => {
    const s = SLOTS_PLAN.find((x) => seTapan(cajaDeSlot(x), c.caja));
    return s && s.i > max ? s.i : max;
  }, -1);
  const huecoFinal = SLOTS_PLAN.find((s) => s.i > ultimoDelPlan && libre(s, otras)) ?? huecoPlan;
  const yaEsLaUltima = !!unica && enPlan && plan.length > 0 && plan[plan.length - 1].capa.id === unica.id;

  const panel = (
    <>
      <TarjetaPaso paso={guion.actual} numero={Math.min(guion.indice + 1, TOTAL_PASOS)} total={TOTAL_PASOS} />

      <div className="plt-presupuesto" data-cabe={coste <= PRESUPUESTO ? 'si' : 'no'} data-testid="plt-presupuesto">
        <span className="plt-pres-eti">Tu plan cuesta</span>
        <p className="plt-pres-num">
          <b data-testid="plt-coste">{coste}</b> de {PRESUPUESTO} semanas
        </p>
        <div className="plt-barra">
          <i style={{ width: `${Math.min(100, Math.round((coste / PRESUPUESTO) * 100))}%` }} />
        </div>
        {coste > PRESUPUESTO && (
          <p className="plt-alarma" role="status">
            No cabe: te pasas por {coste - PRESUPUESTO} semanas.
          </p>
        )}
      </div>

      <div className="plt-orden">
        <span className="dis-nota">El plan, en orden</span>
        {plan.length === 0 ? (
          <p className="plt-vacio">Todavía no has metido nada.</p>
        ) : (
          <ol data-testid="plt-orden">
            {plan.map((x, i) => (
              <li key={x.pieza.id} data-mal={problema && problema.pieza.id === x.pieza.id ? 'si' : 'no'}>
                <b>{i + 1}.º</b> {x.pieza.nombre}
              </li>
            ))}
          </ol>
        )}
        {problema && (
          <p className="plt-aviso" role="status">
            ⚠ «{problema.pieza.nombre}» necesita «{problema.necesita.nombre}»
            {problema.falta ? ', y no está en el plan.' : ', y ahora va después.'}
          </p>
        )}
      </div>

      {elegida ? (
        <div className="plt-ficha">
          <b className="plt-ficha-nombre">{elegida.nombre}</b>
          <span className="dis-nota">
            {elegida.semanas} {elegida.semanas === 1 ? 'semana' : 'semanas'} ·{' '}
            {elegida.imprescindible ? 'sin ella no hay juego' : 'extra'}
          </span>
          {elegida.necesita && (
            <span className="dis-nota">Necesita antes: {piezaPorId(elegida.necesita)?.nombre ?? '?'}</span>
          )}
          <div className="dsg-panel-extra">
            {!enPlan && (
              <button
                type="button"
                className="dis-btn"
                data-testid="plt-meter"
                disabled={!huecoPlan}
                onClick={() => mandarA(elegida.capa, huecoPlan)}
              >
                ⬆ Meterla en el plan
              </button>
            )}
            {enPlan && (
              <button
                type="button"
                className="dis-btn"
                data-testid="plt-sacar"
                disabled={!huecoCaja}
                onClick={() => mandarA(elegida.capa, huecoCaja)}
              >
                ⬇ Sacarla del plan
              </button>
            )}
            {enPlan && (
              <button
                type="button"
                className="dis-btn"
                data-testid="plt-al-final"
                disabled={!huecoFinal || yaEsLaUltima}
                onClick={() => mandarA(elegida.capa, huecoFinal)}
              >
                ➜ Ponerla la última del plan
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="dis-nota">
          {enTablero
            ? 'Toca una tarjeta del tablero para moverla de banda o de sitio.'
            : 'Estás en la hoja de bocetos. Dibuja con «Formas» y escribe con «Texto».'}
        </p>
      )}
    </>
  );

  const hechos = terminado ? TOTAL_PASOS : pasos;
  const maximo = costeMaximo(d.historia);

  return (
    <ArcadeSala
      titulo="Planea tu proyecto"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Semanas"
      marcadorValor={`${coste}/${PRESUPUESTO}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Diseño · el tablero del proyecto · 6 semanas de clase</p>}
      alSalir={alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Jefe de proyecto',
              insigniaEmoji: '🗺️',
              titulo: '¡Tu plan cabe!',
              detalle:
                'Un juego entero, en seis semanas, en un orden que se puede hacer, y con la primera pantalla dibujada. Lo que no cupo no se tiró: está guardado para más adelante.',
              resumen: [
                { etiqueta: 'Tu idea llegó a costar', valor: `${maximo} semanas` },
                { etiqueta: 'Tu plan cabe en', valor: `${coste} de ${PRESUPUESTO}` },
                { etiqueta: 'Para más adelante', valor: `${enLaCaja(d.documento).length} piezas` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase marca="Tecnia Diseño" subtitulo="plan-del-juego · tablero de 24×24" claseMarco="plt-tablero">
        <VentanaDiseno
          documento={d.documento}
          pagina={d.pagina}
          seleccion={d.seleccion}
          herramientas={d.herramientas}
          herramienta={d.herramienta}
          onHerramienta={d.elegirHerramienta}
          gesto={d.gesto}
          pasos={d.pasos}
          rechazo={d.rechazo}
          onSeleccionar={(id, mas) => d.seleccionar(id ? [id] : [], mas)}
          onGestoInicio={d.iniciarGesto}
          onGestoMover={d.moverGesto}
          onGestoSoltar={d.soltarGesto}
          onAccion={d.hacer}
          nuevoId={d.nuevoId}
          onDeshacer={d.deshacer}
          onRehacer={d.rehacer}
          puedeDeshacer={d.puedeDeshacer}
          puedeRehacer={d.puedeRehacer}
          onIrA={d.irA}
          panel={panel}
        />
      </VentanaBase>
      {!empezado && <PortadaDiseno portada={PORTADA} onEmpezar={empezar} />}
    </ArcadeSala>
  );
}

export default LabPlaneaTuProyecto;
