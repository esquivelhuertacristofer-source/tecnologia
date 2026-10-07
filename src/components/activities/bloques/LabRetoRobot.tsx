'use client';

import type { ActivityProps } from '@/types/activity-contract';
import {
  arrancar,
  nuevoBloque,
  pila,
  programaDe,
  recorrer,
  siguiente,
  type BloquePuesto,
  type CategoriaBloques,
  type EventoBloques,
  type FichaBloque,
  type Programa,
} from '@/components/simuladores/bloques';
import { SalaBloques, type ClaseBloques, type EncargoBloques, type EscenarioProps } from './SalaBloques';
import './robot.css';

/**
 * N6 · U «Robótica y STEAM» · parada 3 — «Reto: resuélvelo con tu robot»
 * (curriculo.ts: `n6-reto-robot`, unidad `n6-robotica-y-steam`).
 *
 * **6.º de primaria, 11–12 años.** Reescrita en el §69.10: era una receta de
 * seis encargos en una cuadrícula de 3×3 sin obstáculos, y el «si» se usaba
 * porque el texto lo mandaba. Ahora hay DOS mapas con paredes, y el reto es
 * un solo programa que llegue a la bandera en los dos sin chocar. Una
 * secuencia fija no puede (gira antes de tiempo en uno o choca en el otro):
 * hace falta mirar antes de moverse, que es para lo que existe un «si»
 * dentro de un «repetir».
 *
 * ── Por qué el mundo se reinicia en cada ▶, pero el mapa no ──────────────────
 *
 * Probar el mismo programa dos veces tiene que partir del mismo sitio: si no,
 * «choca» dependería de cuántas veces llevas pulsado ▶. Por eso
 * `reiniciarMundoAlCorrer` devuelve al robot a la salida… del mapa que está
 * elegido, que es lo que el alumno cambia con las pestañas.
 *
 * ── Por qué la bandera detiene al robot ──────────────────────────────────────
 *
 * Como la zona de meta de un campo de competencia: al pisarla, las órdenes que
 * queden ya no lo mueven. Sin esto, un «repetir 10» correcto se pasaría de
 * largo, y el alumno tendría que contar repeticiones exactas — justo lo que el
 * reto quiere que deje de hacer.
 */

/* ───────────────────────────── el mundo: dos mapas ─────────────────────────── */

type Direccion = 'norte' | 'sur' | 'este' | 'oeste';
export type IdMapa = 'pasillo' | 'esquina';

export interface MundoRobot {
  mapa: IdMapa;
  fila: number;
  col: number;
  dir: Direccion;
  golpes: number;
  enMeta: boolean;
}

/**
 * `#` pared · `.` libre · `R` salida (mirando al este) · `F` bandera. Los dos se
 * resuelven yendo al este hasta topar y luego al sur, con el giro en un sitio
 * distinto: en el pasillo la pared corta en la columna 4, en la esquina el
 * camino llega hasta el borde.
 */
export const MAPAS: Readonly<Record<IdMapa, { nombre: string; filas: readonly string[] }>> = {
  pasillo: { nombre: 'Mapa 1 · El pasillo', filas: ['R...#', '###.#', '###.#', '###.#', '###F#'] },
  esquina: { nombre: 'Mapa 2 · La esquina lejana', filas: ['R....', '####.', '####.', '####.', '####F'] },
};

const TAMANO = 5;

const DELTA: Record<Direccion, readonly [number, number]> = {
  este: [0, 1],
  oeste: [0, -1],
  norte: [-1, 0],
  sur: [1, 0],
};
const GIRO_DERECHA: Record<Direccion, Direccion> = { este: 'sur', sur: 'oeste', oeste: 'norte', norte: 'este' };
const GIRO_IZQUIERDA: Record<Direccion, Direccion> = { este: 'norte', norte: 'oeste', oeste: 'sur', sur: 'este' };

function casilla(mapa: IdMapa, fila: number, col: number): string {
  if (fila < 0 || fila >= TAMANO || col < 0 || col >= TAMANO) return '#';
  return MAPAS[mapa].filas[fila][col];
}

function salidaDe(mapa: IdMapa): { fila: number; col: number } {
  const filas = MAPAS[mapa].filas;
  for (let fila = 0; fila < filas.length; fila += 1) {
    const col = filas[fila].indexOf('R');
    if (col !== -1) return { fila, col };
  }
  return { fila: 0, col: 0 };
}

export function mundoEn(mapa: IdMapa): MundoRobot {
  return { mapa, ...salidaDe(mapa), dir: 'este', golpes: 0, enMeta: false };
}

const MUNDO_INICIAL: MundoRobot = mundoEn('pasillo');

/** Puro: sólo lee el evento y el mundo, nunca el reloj ni el DOM. */
export function reducirRobot(m: MundoRobot, e: EventoBloques): MundoRobot {
  if (e.tipo !== 'accion' || m.enMeta) return m; // la bandera lo detiene
  if (e.accion === 'avanzar') {
    const [df, dc] = DELTA[m.dir];
    const fila = m.fila + df;
    const col = m.col + dc;
    if (casilla(m.mapa, fila, col) === '#') return { ...m, golpes: m.golpes + 1 };
    return { ...m, fila, col, enMeta: casilla(m.mapa, fila, col) === 'F' };
  }
  if (e.accion === 'girar-derecha') return { ...m, dir: GIRO_DERECHA[m.dir] };
  if (e.accion === 'girar-izquierda') return { ...m, dir: GIRO_IZQUIERDA[m.dir] };
  return m;
}

export function preguntarRobot(pregunta: string, _bloque: BloquePuesto, m: MundoRobot): boolean {
  if (pregunta === 'hay-pared-adelante') {
    const [df, dc] = DELTA[m.dir];
    return casilla(m.mapa, m.fila + df, m.col + dc) === '#';
  }
  return false;
}

/* ─────────────────────────────── el catálogo ──────────────────────────────── */

export const CATALOGO: FichaBloque[] = [
  { id: 'al-empezar', categoria: 'inicio', etiqueta: 'al empezar', semantica: { tipo: 'sombrero' } },
  { id: 'avanzar', categoria: 'movimiento', etiqueta: 'avanzar', semantica: { tipo: 'accion' }, verbo: 'avanzar', texto: 'avanzar()' },
  {
    id: 'girar-izquierda',
    categoria: 'movimiento',
    etiqueta: 'girar izquierda',
    semantica: { tipo: 'accion' },
    verbo: 'girar-izquierda',
    texto: 'girar_izquierda()',
  },
  {
    id: 'girar-derecha',
    categoria: 'movimiento',
    etiqueta: 'girar derecha',
    semantica: { tipo: 'accion' },
    verbo: 'girar-derecha',
    texto: 'girar_derecha()',
  },
  {
    id: 'hay-pared-adelante',
    categoria: 'decision',
    etiqueta: '¿hay pared adelante?',
    semantica: { tipo: 'condicion' },
    verbo: 'hay-pared-adelante',
  },
  { id: 'si', categoria: 'decision', etiqueta: 'si _', semantica: { tipo: 'si' } },
  {
    id: 'repetir',
    categoria: 'control',
    etiqueta: 'repetir _ veces',
    semantica: { tipo: 'repetir', ranura: 'veces' },
    ranuras: [{ id: 'veces', tipo: 'numero', valor: 3, opciones: [2, 3, 4, 5, 6, 8, 10, 12] }],
    texto: 'for paso in range(...):',
  },
];

const CATEGORIAS: CategoriaBloques[] = [
  { id: 'movimiento', nombre: 'Movimiento', color: '#22d3ee' },
  { id: 'decision', nombre: 'Decisión', color: '#a78bfa' },
  { id: 'control', nombre: 'Control', color: '#f5a524' },
];

function sombreroFijo(fichaId: string, id: string) {
  const b = nuevoBloque(CATALOGO, fichaId, id);
  if (!b) throw new Error(`Ficha desconocida: ${fichaId}`);
  return { ...b, fijo: true };
}

export const PILA = 'p-robot';
const PROGRAMA_INICIAL: Programa = programaDe(pila(PILA, sombreroFijo('al-empezar', 'h-robot'), []));

/* ─────────────────────────────── el juez ──────────────────────────────────── */

/** Tope de pasos de una corrida a ciegas: de sobra para 5×5, corto para un bucle sin fin. */
const TOPE_A_CIEGAS = 400;

/**
 * Corre el programa en un mapa sin pintarlo y devuelve cómo acabó el robot.
 * El mundo se actualiza con cada orden ANTES de la siguiente pregunta, igual
 * que en la sala, así que «¿hay pared adelante?» mira donde el robot está.
 */
export function correrEnMapa(programa: Programa, mapa: IdMapa): MundoRobot {
  let mundo = mundoEn(mapa);
  let estado = arrancar(programa, CATALOGO, { pila: PILA, tope: TOPE_A_CIEGAS });
  const preguntar = (pregunta: string, bloque: BloquePuesto) => preguntarRobot(pregunta, bloque, mundo);
  while (!estado.fin) {
    const paso = siguiente(estado, preguntar);
    estado = paso.estado;
    if (paso.evento) mundo = reducirRobot(mundo, paso.evento);
  }
  return mundo;
}

/** El reto (§69.10): el MISMO programa llega a la bandera en los dos mapas, sin chocar. */
export function llegaEnLosDosMapas(programa: Programa): boolean {
  return (['pasillo', 'esquina'] as const).every((mapa) => {
    const fin = correrEnMapa(programa, mapa);
    return fin.enMeta && fin.golpes === 0;
  });
}

function tieneSiConHuecoVacio(programa: Programa): boolean {
  return recorrer(programa).some((b) => b.ficha === 'si' && b.condicion === null);
}

/* ─────────────────────────────── el guion ─────────────────────────────────── */

export const GUION: readonly EncargoBloques<MundoRobot>[] = [
  {
    id: 'llega',
    titulo: 'Llega a la bandera',
    instruccion:
      'Éste es el Mapa 1, «El pasillo». Lleva al robot hasta la bandera 🚩. Arma tu programa bajo «al empezar» con los bloques de Movimiento y pulsa ▶. Con ⏭ lo ves casilla por casilla.',
    pista:
      'El robot sólo sabe avanzar hacia donde mira y girar sobre su sitio. Cuenta las casillas libres antes de la primera pared.',
    logro: { tipo: 'estado', comprueba: (ctx) => ctx.parte !== null && ctx.mundo.mapa === 'pasillo' && ctx.mundo.enMeta },
    aprendido:
      'Llegaste contando: tantos pasos, un giro, tantos pasos más. Funciona… en este mapa. Un programa que cuenta sólo sabe del mapa que contó.',
  },
  {
    id: 'otro-mapa',
    titulo: 'Otro mapa, el mismo programa',
    instruccion:
      'Arriba de la cuadrícula hay dos pestañas. Cambia al Mapa 2 y prueba tu mismo programa, sin tocarlo. Mira qué hace el robot.',
    pista: 'La pestaña «Mapa 2» está sobre la cuadrícula. El programa no cambia: cambia el mundo.',
    logro: { tipo: 'estado', comprueba: (ctx) => ctx.parte !== null && ctx.mundo.mapa === 'esquina' },
    aprendido:
      'El mismo programa, otro mundo, y el robot ya no llega: la pared está en otro sitio, y tu programa no lo sabe porque nunca mira. Así le pasa a un robot de verdad en cuanto alguien mueve una caja.',
  },
  {
    id: 'reto',
    titulo: 'Un programa para los dos mapas',
    instruccion:
      'El reto de verdad: un solo programa que llegue a la bandera en los dos mapas, sin chocar y sin cambiarlo entre uno y otro. Contar casillas ya no sirve. En Decisión hay un «si» y una pregunta, «¿hay pared adelante?»; en Control, un «repetir». Pruébalo en los dos mapas.',
    pista:
      'Piensa en alguien que camina con los ojos abiertos: antes de cada paso, mira. ¿Qué hace si ve pared? Y eso, ¿lo hace una vez o muchas? La bandera detiene al robot: repetir de más no lo saca.',
    logro: { tipo: 'estado', comprueba: (ctx) => ctx.parte !== null && llegaEnLosDosMapas(ctx.programa) },
    aprendido:
      'Ahora el robot no cuenta: mira. Antes de cada paso pregunta si hay pared, y si la hay, gira. Por eso sirve en los dos mapas, y serviría en uno que nunca ha visto. Preguntar ANTES de moverte es para lo que existe un «si».',
  },
  {
    id: 'si-vacio',
    titulo: 'Un «si» sin pregunta',
    instruccion:
      'Prueba algo a propósito: quita la pregunta del hexágono de tu «si» con su ✕, déjalo vacío, y pulsa ▶ en cualquiera de los dos mapas. Mira qué hace el robot.',
    pista: 'Sin pregunta, el «si» igual tiene que contestar algo. Fíjate si gira o no.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => tieneSiConHuecoVacio(ctx.programa) && ctx.parte !== null && ctx.mundo.golpes >= 1,
    },
    aprendido: 'Con el hexágono vacío el robot ya no giró, y se estrelló contra la pared.',
  },
  {
    id: 'por-que',
    titulo: '¿Por qué chocó?',
    instruccion: 'El bloque «girar» seguía adentro del «si». Entonces, ¿por qué el robot no giró esta vez?',
    pista: 'Piensa en qué le pasa a un «si» cuando su hueco hexagonal está vacío.',
    logro: {
      tipo: 'eleccion',
      opciones: ['Se quedó sin batería', 'Una pregunta vacía se contesta que no', 'El orden de los bloques cambió solo'],
      correcta: 1,
    },
    aprendido: 'Un hexágono vacío no es «sin decidir»: se contesta que no, siempre. Por eso el robot nunca giró.',
  },
];

/* ─────────────────────────────── el escenario ─────────────────────────────── */

const FLECHA: Record<Direccion, string> = { este: '➡️', oeste: '⬅️', norte: '⬆️', sur: '⬇️' };

function Cuadricula({ mundo, accionar, corriendo }: EscenarioProps<MundoRobot>) {
  const filas = MAPAS[mundo.mapa].filas;
  return (
    <div className="rb-mapa" data-testid="rb-mapa" data-mapa={mundo.mapa}>
      <div className="rb-pestanas" role="tablist" aria-label="Mapas del reto">
        {(Object.keys(MAPAS) as IdMapa[]).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mundo.mapa === id}
            className={`rb-pestana${mundo.mapa === id ? ' es-activa' : ''}`}
            data-mapa-pestana={id}
            disabled={corriendo}
            onClick={() => accionar(`mapa:${id}`)}
          >
            {MAPAS[id].nombre}
          </button>
        ))}
      </div>
      <div className="rb-cuadricula">
        {filas.flatMap((renglon, fila) =>
          [...renglon].map((c, col) => {
            const esRobot = mundo.fila === fila && mundo.col === col;
            const esMeta = c === 'F';
            const esPared = c === '#';
            return (
              <div
                key={`${fila}-${col}`}
                className={`rb-celda${esMeta ? ' es-meta' : ''}${esPared ? ' es-pared' : ''}${esRobot ? ' es-robot' : ''}`}
                data-testid={esRobot ? 'rb-robot' : undefined}
                data-dir={esRobot ? mundo.dir : undefined}
              >
                {esRobot ? <span aria-hidden="true">{FLECHA[mundo.dir]}</span> : esMeta ? '🚩' : ''}
              </div>
            );
          }),
        )}
      </div>
      <div className="rb-marcador" data-testid="rb-golpes">
        Golpes: <strong>{mundo.golpes}</strong>
      </div>
    </div>
  );
}

/* ─────────────────────────────── la clase ─────────────────────────────────── */

const CLASE: ClaseBloques<MundoRobot> = {
  actividadId: 'n6-reto-robot',
  titulo: 'Reto: resuélvelo con tu robot',
  marca: 'Tecnia Bloques · Robot',
  insignia: { nombre: 'Domador de robots', emoji: '🦾' },
  minutos: 22,
  portada: {
    situacion: 'Nivel 6 · Robótica y STEAM · Parada 3 de 3',
    tema: 'Reto: resuélvelo con tu robot',
    objetivo:
      'Vas a salir de aquí sabiendo por qué existe un «si»: un programa que cuenta pasos sólo sirve para el mapa que contó, y uno que mira antes de moverse sirve para mapas que nunca vio.',
    vasAHacer: [
      'Llevar al robot a la bandera en un mapa con paredes.',
      'Probar el mismo programa en otro mapa, y ver por qué falla.',
      'Hacer UN programa que llegue en los dos mapas sin chocar.',
      'Descubrir qué pasa cuando un «si» pregunta al vacío.',
    ],
  },
  catalogo: CATALOGO,
  categorias: CATEGORIAS,
  categoriaInicial: 'movimiento',
  programaInicial: PROGRAMA_INICIAL,
  pilaInicial: PILA,
  velocidad: 450,
  mundoInicial: MUNDO_INICIAL,
  preguntar: preguntarRobot,
  reducir: reducirRobot,
  manejarAccion: (id, ctx) => {
    const mapa = id.startsWith('mapa:') ? (id.slice(5) as IdMapa) : null;
    if (mapa && mapa in MAPAS) ctx.establecerMundo(() => mundoEn(mapa));
  },
  reiniciarMundoAlCorrer: (mundo) => mundoEn(mundo.mapa),
  guion: GUION,
  Escenario: Cuadricula,
  bit: {
    inicio: 'Éste es el mapa del robot. Llévalo a la bandera. Después vas a probar tu programa en otro mapa.',
    cierre: 'Tu robot ya no cuenta pasos: mira antes de moverse. Eso es un «si», y es la mitad de programar de verdad.',
  },
  final: {
    titulo: '¡Un programa, dos mapas!',
    detalle: 'Llegaste contando, viste fallar ese programa en otro mapa, y lo cambiaste por uno que mira antes de moverse.',
  },
};

export function LabRetoRobot(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaBloques {...props} clase={CLASE} />;
}

export default LabRetoRobot;
