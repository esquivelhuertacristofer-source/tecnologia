'use client';

import type { ActivityProps } from '@/types/activity-contract';
import {
  nuevoBloque,
  pila,
  programaDe,
  recorrer,
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
 * **6.º de primaria, 11–12 años**, mismo registro que la parada anterior
 * (`n6-programa-un-microbit`). Ésta SÍ usa control: es la primera de las tres
 * en traer `si` y un hexágono de pregunta, porque el reto —esquivar una
 * pared— no se puede resolver sólo con secuencia. No trae `repetir`: con un
 * único tramo recto de dos casillas, forzar el bucle habría sido enseñar una
 * pieza que el reto no necesita todavía.
 *
 * ── Por qué el mundo se reinicia en cada ▶ ──────────────────────────────────
 *
 * Un robot en una cuadrícula tiene POSICIÓN, y probar el mismo guion dos
 * veces seguidas tiene que partir del mismo sitio — si no, «choca» y «no
 * choca» dependerían de cuántas veces llevas pulsado ▶, no del programa. Por
 * eso esta clase (y sólo ésta de las tres) usa `reiniciarMundoAlCorrer`.
 */

/* ───────────────────────────── el mundo: la cuadrícula ─────────────────────── */

type Direccion = 'norte' | 'sur' | 'este' | 'oeste';

export interface MundoRobot {
  fila: number;
  col: number;
  dir: Direccion;
  golpes: number;
  enMeta: boolean;
}

const TAMANO = 3;
const META = { fila: 2, col: 2 };

const MUNDO_INICIAL: MundoRobot = { fila: 0, col: 0, dir: 'este', golpes: 0, enMeta: false };

const DELTA: Record<Direccion, readonly [number, number]> = {
  este: [0, 1],
  oeste: [0, -1],
  norte: [-1, 0],
  sur: [1, 0],
};
const GIRO_DERECHA: Record<Direccion, Direccion> = { este: 'sur', sur: 'oeste', oeste: 'norte', norte: 'este' };
const GIRO_IZQUIERDA: Record<Direccion, Direccion> = { este: 'norte', norte: 'oeste', oeste: 'sur', sur: 'este' };

function dentroDeLaCuadricula(fila: number, col: number): boolean {
  return fila >= 0 && fila < TAMANO && col >= 0 && col < TAMANO;
}

/** Puro: sólo lee el evento y el mundo, nunca el reloj ni el DOM. */
function reducirRobot(m: MundoRobot, e: EventoBloques): MundoRobot {
  if (e.tipo !== 'accion') return m;
  if (e.accion === 'avanzar') {
    const [df, dc] = DELTA[m.dir];
    const fila = m.fila + df;
    const col = m.col + dc;
    if (!dentroDeLaCuadricula(fila, col)) return { ...m, golpes: m.golpes + 1 };
    return { ...m, fila, col, enMeta: fila === META.fila && col === META.col };
  }
  if (e.accion === 'girar-derecha') return { ...m, dir: GIRO_DERECHA[m.dir] };
  if (e.accion === 'girar-izquierda') return { ...m, dir: GIRO_IZQUIERDA[m.dir] };
  return m;
}

function preguntarRobot(pregunta: string, _bloque: BloquePuesto, m: MundoRobot): boolean {
  if (pregunta === 'hay-pared-adelante') {
    const [df, dc] = DELTA[m.dir];
    return !dentroDeLaCuadricula(m.fila + df, m.col + dc);
  }
  return false;
}

/* ── lectores del programa, para los encargos que comprueban estructura ─────── */

function tieneGiroEnPared(programa: Programa): boolean {
  return recorrer(programa).some(
    (b) =>
      b.ficha === 'si' &&
      b.condicion?.ficha === 'hay-pared-adelante' &&
      (b.ramas?.cuerpo ?? []).some((h) => h.ficha === 'girar-derecha'),
  );
}

function tieneSiConHuecoVacio(programa: Programa): boolean {
  return recorrer(programa).some((b) => b.ficha === 'si' && b.condicion === null);
}

/* ─────────────────────────────── el catálogo ──────────────────────────────── */

const CATALOGO: FichaBloque[] = [
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
];

const CATEGORIAS: CategoriaBloques[] = [
  { id: 'movimiento', nombre: 'Movimiento', color: '#22d3ee' },
  { id: 'decision', nombre: 'Decisión', color: '#a78bfa' },
];

function sombreroFijo(fichaId: string, id: string) {
  const b = nuevoBloque(CATALOGO, fichaId, id);
  if (!b) throw new Error(`Ficha desconocida: ${fichaId}`);
  return { ...b, fijo: true };
}

const PROGRAMA_INICIAL: Programa = programaDe(pila('p-robot', sombreroFijo('al-empezar', 'h-robot'), []));

/* ─────────────────────────────── el guion ─────────────────────────────────── */

const GUION: readonly EncargoBloques<MundoRobot>[] = [
  {
    id: 'avanza',
    titulo: 'Acércate a la pared',
    instruccion:
      'El robot mira al este. Bajo «al empezar» pon el bloque «avanzar» DOS veces. Usa ⏭ para verlo moverse casilla por casilla, y después pulsa ▶ para verlo completo.',
    pista: '«avanzar» está en Movimiento. Suéltalo dos veces, uno debajo del otro.',
    logro: { tipo: 'estado', comprueba: (ctx) => ctx.parte !== null && ctx.mundo.fila === 0 && ctx.mundo.col === 2 },
    aprendido: 'Con ⏭ ves al robot moverse UNA casilla por bloque: así se lee un programa por dentro.',
  },
  {
    id: 'choca',
    titulo: 'Choca a propósito',
    instruccion: 'Agrega un TERCER «avanzar» al final y pulsa ▶. El robot ya no puede seguir al este: mira el contador de golpes.',
    pista: 'No pasa nada malo: el robot se queda quieto y el golpe se cuenta. Así se prueban los límites del mapa.',
    logro: { tipo: 'estado', comprueba: (ctx) => ctx.mundo.golpes >= 1 },
    aprendido: 'Chocar no rompe el programa: el robot simplemente no se mueve si no puede.',
  },
  {
    id: 'gira',
    titulo: 'Enséñale a girar antes de chocar',
    instruccion:
      'Quita ese tercer «avanzar» con la ✕. En su lugar pon «si» al final; en su hueco hexagonal pon «¿hay pared adelante?»; dentro del si, pon «girar derecha». Pulsa ▶.',
    pista: 'El hueco hexagonal sólo acepta preguntas: «¿hay pared adelante?» está en Decisión.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => tieneGiroEnPared(ctx.programa) && ctx.mundo.dir === 'sur',
    },
    aprendido: 'Preguntar ANTES de moverte evita el choque: para eso sirve un «si».',
  },
  {
    id: 'llega',
    titulo: 'Llega a la meta',
    instruccion: 'Añade dos «avanzar» más, después del si. Pulsa ▶: el robot debe llegar a la bandera.',
    pista: 'Ahora el robot mira al sur. Dos «avanzar» más lo bajan hasta la meta.',
    logro: { tipo: 'estado', comprueba: (ctx) => ctx.mundo.enMeta },
    aprendido: 'Con una decisión y dos pasos más, el robot esquiva la pared y llega solo.',
  },
  {
    id: 'si-vacio',
    titulo: 'Un si sin pregunta',
    instruccion:
      'Quita del hueco hexagonal la pieza «¿hay pared adelante?» con su ✕, dejándolo vacío, y pulsa ▶ otra vez. Mira qué hace el robot esta vez.',
    pista: 'Sin pregunta, el «si» igual tiene que contestar algo. Fíjate si gira o no.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => tieneSiConHuecoVacio(ctx.programa) && ctx.parte !== null && ctx.mundo.golpes >= 2,
    },
    aprendido: 'Un «si» sin pregunta se contesta que NO: por eso el robot no giró, y volvió a chocar.',
  },
  {
    id: 'por-que',
    titulo: '¿Por qué no giró?',
    instruccion: 'El bloque «girar derecha» seguía adentro del si. Entonces, ¿por qué el robot no giró esta vez?',
    pista: 'Piensa en qué le pasa a un «si» cuando su hueco hexagonal está vacío.',
    logro: {
      tipo: 'eleccion',
      opciones: ['Se quedó sin batería', 'Una pregunta vacía se contesta que no', 'El orden de los bloques cambió solo'],
      correcta: 1,
    },
    aprendido: 'Un hexágono vacío no es «sin decidir»: el armazón lo contesta que no, siempre.',
  },
];

/* ─────────────────────────────── el escenario ─────────────────────────────── */

const FLECHA: Record<Direccion, string> = { este: '➡️', oeste: '⬅️', norte: '⬆️', sur: '⬇️' };

function Cuadricula({ mundo }: EscenarioProps<MundoRobot>) {
  const celdas: { fila: number; col: number }[] = [];
  for (let fila = 0; fila < TAMANO; fila += 1) {
    for (let col = 0; col < TAMANO; col += 1) celdas.push({ fila, col });
  }
  return (
    <div className="rb-mapa" data-testid="rb-mapa">
      <div className="rb-cuadricula">
        {celdas.map(({ fila, col }) => {
          const esRobot = mundo.fila === fila && mundo.col === col;
          const esMeta = fila === META.fila && col === META.col;
          return (
            <div
              key={`${fila}-${col}`}
              className={`rb-celda${esMeta ? ' es-meta' : ''}${esRobot ? ' es-robot' : ''}`}
              data-testid={esRobot ? 'rb-robot' : undefined}
              data-dir={esRobot ? mundo.dir : undefined}
            >
              {esRobot ? <span aria-hidden="true">{FLECHA[mundo.dir]}</span> : esMeta ? '🚩' : ''}
            </div>
          );
        })}
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
      'Vas a salir de aquí sabiendo usar un «si» de verdad: preguntarle algo al mundo ANTES de actuar, para no chocar contra lo que no puedes ver de antemano.',
    vasAHacer: [
      'Mover al robot con «avanzar» y «girar» hasta encontrar un límite del mapa.',
      'Chocar a propósito, y ver que no rompe nada.',
      'Enseñarle a preguntar «¿hay pared adelante?» antes de girar.',
      'Descubrir qué pasa cuando un «si» pregunta al vacío.',
    ],
  },
  catalogo: CATALOGO,
  categorias: CATEGORIAS,
  categoriaInicial: 'movimiento',
  programaInicial: PROGRAMA_INICIAL,
  pilaInicial: 'p-robot',
  velocidad: 550,
  mundoInicial: MUNDO_INICIAL,
  preguntar: preguntarRobot,
  reducir: reducirRobot,
  reiniciarMundoAlCorrer: () => ({ ...MUNDO_INICIAL }),
  guion: GUION,
  Escenario: Cuadricula,
  bit: {
    inicio: 'Este es el mapa del robot. Muévelo con bloques, y antes de girar, pregúntale al mundo qué hay adelante.',
    cierre: 'Aprendiste a preguntar antes de actuar. Eso es un «si», y es la mitad de programar de verdad.',
  },
  final: {
    titulo: '¡Llegaste a la meta!',
    detalle: 'Moviste, chocaste a propósito, y le enseñaste al robot a mirar antes de girar.',
  },
};

export function LabRetoRobot(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaBloques {...props} clase={CLASE} />;
}

export default LabRetoRobot;
