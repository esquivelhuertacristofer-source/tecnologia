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
import { CaraDeTexto } from './CaraDeTexto';
import { traducir } from './traduccionPython';
import './bloquesVsCodigo.css';

/**
 * N6 · U «De bloques a texto» · parada 1 — «El mismo programa, dos caras»
 * (`curriculo.ts`: `n6-bloques-vs-codigo`, unidad `n6-de-bloques-a-texto`).
 *
 * **6.º de primaria, 11–12 años**, comprobado en `curriculo.ts` antes de
 * escribir. Fuente de verdad: `DISENO-N6-bloques-vs-codigo.md` (raíz del
 * proyecto) — este archivo lo construye, no lo rediseña.
 *
 * ── La decisión de arquitectura ─────────────────────────────────────────────
 *
 * Una sola ventana con un solo ▶. La cara de texto (`CaraDeTexto`) va en el
 * hueco `escenario` de `VentanaBloques` — una columna más del cuerpo, no una
 * capa flotante — y es de sólo lectura: se arma en bloques y el texto se
 * reescribe solo. Al ejecutar, el bloque que corre y su línea se encienden a
 * la vez, porque `nodoActivo` del intérprete de bloques se convierte en
 * `lineaEnCurso` del editor de texto mediante `traduccionPython.ts`.
 *
 * ── Por qué la paleta no lleva `mientras` ni `por siempre` ──────────────────
 *
 * `SalaBloques` no expone `tope` (`TOPE_PASOS = 2000`, hasta 20 minutos de
 * espera con `velocidad: 600`). Sin bucles infinitos posibles en la paleta, y
 * con la ranura de `veces` del `repetir` como `<select>` de opciones
 * (`opciones: [2, 3, 4, 5]`, nunca un `<input type="number">`), el tope queda
 * inalcanzable sin tocar el armazón.
 */

/* ─────────────────────────────── el catálogo ──────────────────────────────── */

export const CATALOGO: FichaBloque[] = [
  { id: 'al-empezar', categoria: 'inicio', etiqueta: 'al empezar', semantica: { tipo: 'sombrero' } },
  {
    id: 'decir',
    categoria: 'salida',
    etiqueta: 'decir',
    semantica: { tipo: 'accion' },
    verbo: 'decir',
    ranuras: [{ id: 'que', tipo: 'texto', valor: 'Hola' }],
    texto: 'print("...")',
  },
  {
    id: 'decir-vuelta',
    categoria: 'salida',
    etiqueta: 'decir el número de vuelta',
    semantica: { tipo: 'accion' },
    verbo: 'decir-vuelta',
    texto: 'print(vuelta)',
  },
  {
    id: 'repetir',
    categoria: 'control',
    etiqueta: 'repetir _ veces',
    semantica: { tipo: 'repetir', ranura: 'veces' },
    ranuras: [{ id: 'veces', tipo: 'numero', valor: 3, opciones: [2, 3, 4, 5] }],
    texto: 'for vuelta in range(...):',
  },
];

// Sólo dos categorías visibles en la paleta: «al empezar» va fijo de fábrica
// y nunca se elige, así que su categoría `inicio` no necesita pestaña.
const CATEGORIAS: CategoriaBloques[] = [
  { id: 'salida', nombre: 'Decir', color: '#fbbf24' },
  { id: 'control', nombre: 'Repetir', color: '#a78bfa' },
];

function sombreroFijo(fichaId: string, id: string): BloquePuesto {
  const b = nuevoBloque(CATALOGO, fichaId, id);
  if (!b) throw new Error(`Ficha desconocida: ${fichaId}`);
  return { ...b, fijo: true };
}

function bloqueInicial(fichaId: string, id: string): BloquePuesto {
  const b = nuevoBloque(CATALOGO, fichaId, id);
  if (!b) throw new Error(`Ficha desconocida: ${fichaId}`);
  return b;
}

// El encargo 1 necesita algo que ejecutar, y la cara de texto no debe nacer
// vacía: un «decir Hola» ya puesto, editable (no `fijo`), porque el encargo 2
// pide cambiar justo esta ranura.
export const PROGRAMA_INICIAL: Programa = programaDe(
  pila('p-main', sombreroFijo('al-empezar', 'h-main'), [bloqueInicial('decir', 'blq-0')]),
);

/* ─────────────────────────────── el mundo ──────────────────────────────────── */

/** Un `repetir` abierto: en qué vuelta va y cuál es el primer bloque de su boca. */
interface BucleAbierto {
  id: string;
  vuelta: number;
  primero: string | null;
}

export interface MundoTexto {
  /** La consola: lo que ha escrito la corrida actual. */
  salida: string[];
  /**
   * La variable `vuelta` del `for`, como en Python (§69.12): empieza en 0,
   * cambia una vez por vuelta y es UNA sola —un `for` dentro de otro la
   * reescribe—. `null` mientras no ha corrido ningún `repetir`.
   */
  vuelta: number | null;
  /** Los `repetir` abiertos, del de fuera al de dentro. */
  bucles: BucleAbierto[];
  /** El encargo 6: cuántas veces intentó escribir en la cara de sólo lectura. */
  intentosDeEscribir: number;
}

export const MUNDO_INICIAL: MundoTexto = { salida: [], vuelta: null, bucles: [], intentosDeEscribir: 0 };

export const AVISO_SIN_VUELTA = 'Error: «vuelta» todavía no existe';

/**
 * El intérprete avisa `entra` UNA vez por bucle, no por vuelta. La vuelta
 * nueva se reconoce porque vuelve a correr el primer bloque de la boca: ese
 * bucle suma uno, y los de dentro de él ya terminaron.
 */
function anotarPaso(m: MundoTexto, nodoId: string): MundoTexto {
  for (let k = m.bucles.length - 1; k >= 0; k--) {
    if (m.bucles[k].primero === nodoId) {
      const bucle = { ...m.bucles[k], vuelta: m.bucles[k].vuelta + 1 };
      return { ...m, bucles: [...m.bucles.slice(0, k), bucle], vuelta: bucle.vuelta };
    }
  }
  const tope = m.bucles[m.bucles.length - 1];
  if (tope && tope.primero === null) {
    return { ...m, bucles: [...m.bucles.slice(0, -1), { ...tope, primero: nodoId }] };
  }
  return m;
}

/** Puro: sólo lee el evento, nunca el reloj ni el DOM. */
export function reducirTexto(m: MundoTexto, e: EventoBloques): MundoTexto {
  if (e.tipo === 'entra') {
    const tras = anotarPaso(m, e.nodoId);
    if (!e.vueltas || e.vueltas <= 0) return tras;
    const fuera = tras.bucles.findIndex((b) => b.id === e.nodoId);
    const abiertos = fuera === -1 ? tras.bucles : tras.bucles.slice(0, fuera);
    return { ...tras, bucles: [...abiertos, { id: e.nodoId, vuelta: 0, primero: null }], vuelta: 0 };
  }
  if (e.tipo === 'accion') {
    const tras = anotarPaso(m, e.nodoId);
    if (e.accion === 'decir') return { ...tras, salida: [...tras.salida, String(e.args.que ?? '')] };
    if (e.accion === 'decir-vuelta') {
      return { ...tras, salida: [...tras.salida, tras.vuelta === null ? AVISO_SIN_VUELTA : String(tras.vuelta)] };
    }
    return tras;
  }
  return m;
}

/** Esta clase no usa hexágonos: ningún guion pregunta nada. */
function preguntarTexto(): boolean {
  return false;
}

/* ─────────────────────────────── el guion ──────────────────────────────────── */

function primerDecir(programa: Programa): BloquePuesto | null {
  return programa.pilas[0]?.bloques[0] ?? null;
}

/** Lo que diría la consola con este programa, corrido sin pantalla. */
export function salidaDe(programa: Programa): string[] {
  let mundo = MUNDO_INICIAL;
  let estado = arrancar(programa, CATALOGO, { pila: 'p-main' });
  while (!estado.fin) {
    const paso = siguiente(estado, preguntarTexto);
    estado = paso.estado;
    if (paso.evento) mundo = reducirTexto(mundo, paso.evento);
  }
  return mundo.salida;
}

function decirConTexto(programa: Programa, texto: string): number {
  return recorrer(programa).filter((b) => b.ficha === 'decir' && String(b.args?.que ?? '') === texto).length;
}

/**
 * Encargo 3: una palabra sale tres veces seguidas y la dice UN solo bloque.
 * Devuelve el índice donde empiezan las tres, o -1.
 */
export function tresVecesConUnBloque(programa: Programa): number {
  const salida = salidaDe(programa);
  for (let i = 0; i + 2 < salida.length; i++) {
    const x = salida[i];
    if (x !== '' && salida[i + 1] === x && salida[i + 2] === x && decirConTexto(programa, x) === 1) return i;
  }
  return -1;
}

/** Encargo 4: después de las tres, otra cosa UNA sola vez. */
export function despuesUnaVez(programa: Programa): boolean {
  const salida = salidaDe(programa);
  const i = tresVecesConUnBloque(programa);
  if (i === -1) return false;
  // Si la misma palabra sale más de tres veces, las tres «seguidas» pueden ser las últimas.
  let fin = i + 3;
  while (salida[fin] === salida[i]) fin += 1;
  const otra = salida[fin];
  return otra !== undefined && otra !== '' && otra !== salida[i] && salida.filter((s) => s === otra).length === 1;
}

/** Encargo 5: el programa se da en texto. */
export const TEXTO_A_ARMAR = ['print("Cuenta")', 'for vuelta in range(4):', '    print(vuelta)', 'print("Ya")'].join('\n');

/** La cara de texto del programa dice lo mismo que `TEXTO_A_ARMAR` (sin contar mayúsculas de lo que se dice). */
export function armaElTexto(programa: Programa): boolean {
  const lineas = traducir(programa, CATALOGO).texto.split('\n').slice(1);
  const pedido = TEXTO_A_ARMAR.split('\n');
  return lineas.length === pedido.length && lineas.every((l, i) => l.trimEnd().toLowerCase() === pedido[i].toLowerCase());
}

const GUION: readonly EncargoBloques<MundoTexto>[] = [
  {
    id: 'dos-caras',
    titulo: 'Las dos caras',
    instruccion:
      'Pulsa ▶ y no mires la consola todavía: mira el bloque que se enciende, a la izquierda, y la línea que se enciende, a la derecha. Es la misma orden.',
    pista: 'El botón ▶ está arriba, en la barra del editor de bloques. Mientras corre, fíjate en las dos caras a la vez.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => ctx.parte !== null && ctx.mundo.salida.length >= 1,
    },
    aprendido: 'Un bloque y una línea son la misma orden con dos formas.',
  },
  {
    id: 'cambia-lo-que-dice',
    titulo: 'Cambia lo que dice',
    instruccion:
      'Escribe otra cosa en la ranura del bloque de decir y vuelve a ejecutar. La línea de la derecha cambia sola.',
    pista: 'Toca la casilla de texto dentro del bloque «decir» y escribe una palabra distinta. Después dale otra vez a ▶.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => {
        const bloque = primerDecir(ctx.programa);
        if (!bloque) return false;
        const texto = String(bloque.args?.que ?? '');
        return texto !== '' && texto !== 'Hola' && ctx.mundo.salida.includes(texto);
      },
    },
    aprendido: 'No traduces tú: el texto es el mismo programa mirado de otro lado.',
  },
  {
    id: 'tres-veces',
    titulo: 'Tres veces, un solo bloque',
    instruccion:
      'Haz que la consola diga una misma palabra TRES veces seguidas, pero usando UN solo bloque «decir» para esa palabra. Hay un bloque que repite lo que lleva dentro: «repetir _ veces», en Repetir. Cuando salga, mira qué le pasó a esa línea en la cara de la derecha.',
    pista: 'Tres «decir» iguales en fila no valen: tiene que ser uno solo. ¿Dónde tiene que estar para que el «repetir» lo repita?',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => ctx.parte !== null && tresVecesConUnBloque(ctx.parte.programa) !== -1,
    },
    aprendido: 'Lo que en bloques está dentro de una boca, en texto está corrido cuatro espacios a la derecha.',
  },
  {
    id: 'dentro-y-fuera',
    titulo: 'Dentro y fuera',
    instruccion:
      'Ahora haz que, DESPUÉS de las tres veces, la consola diga otra cosa UNA sola vez. Ejecuta y compara en la cara de la derecha la línea que sale tres veces con la que sale una.',
    pista: 'Si la palabra nueva sale tres veces, está en el mismo sitio que la otra. ¿Dónde tendría que ir para correr una sola vez?',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => ctx.parte !== null && despuesUnaVez(ctx.parte.programa),
    },
    aprendido:
      'En bloques, la diferencia es estar dentro o fuera de la boca. En texto son cuatro espacios al principio de la línea, y nadie te avisa si te faltan.',
  },
  {
    id: 'lee-y-arma',
    titulo: 'Ahora al revés: lee y arma',
    instruccion:
      'Este programa te lo doy escrito en Python, y tú lo armas en bloques. Cuando la cara de la derecha diga exactamente esto, ejecútalo. Antes de pulsar ▶, adivina qué números van a salir.',
    codigo: TEXTO_A_ARMAR,
    pista:
      'Puedes quitar bloques con la ✕. Fíjate en qué líneas tienen cuatro espacios al principio: ésas van dentro de la boca. «print(vuelta)» es el bloque «decir el número de vuelta».',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => ctx.parte !== null && armaElTexto(ctx.parte.programa),
    },
    aprendido:
      'Leíste Python y lo convertiste en bloques. Y salió 0, 1, 2, 3: «range(4)» da cuatro vueltas, pero Python empieza a contar en 0.',
  },
  {
    id: 'intenta-escribir',
    titulo: 'Intenta escribir en la otra cara',
    instruccion: 'Ponte encima del texto de la derecha y teclea algo.',
    pista: 'Haz clic dentro de la cara de Python (a la derecha) y presiona cualquier tecla.',
    logro: { tipo: 'estado', comprueba: (ctx) => ctx.mundo.intentosDeEscribir >= 1 },
    aprendido: 'Hoy esa cara se escribe sola. En la siguiente clase se abre de verdad y la escribes tú.',
  },
  {
    id: 'bloque-sin-linea',
    titulo: 'El bloque sin línea',
    instruccion: '¿Qué línea de la derecha le corresponde al sombrero «al empezar»?',
    pista: 'Busca en el texto una línea que diga lo mismo que el sombrero. Míralo con calma.',
    logro: {
      tipo: 'eleccion',
      opciones: [
        'La primera, la del comentario de arriba',
        'Ninguna: el sombrero dice cuándo empieza, y un archivo de texto empieza por su primera línea y ya',
        'La última de todas',
      ],
      correcta: 1,
    },
    aprendido: 'Las dos caras no son idénticas pieza por pieza, y esa diferencia tiene una razón.',
  },
  {
    id: 'pregunta-del-truco',
    titulo: 'La pregunta del truco',
    instruccion: 'Si a esa línea de adentro le borras los cuatro espacios del principio, ¿qué cambia?',
    pista: 'Piensa en el encargo anterior: ¿qué diferencia había entre el «decir» de dentro y el de fuera?',
    logro: {
      tipo: 'eleccion',
      opciones: ['Nada, los espacios son adorno', 'Deja de estar dentro del repetir y sale una sola vez', 'El programa se ejecuta más rápido'],
      correcta: 1,
    },
    aprendido: 'La sangría no es cómo se ve el programa: es lo que el programa hace.',
  },
];

/* ─────────────────────────────── el escenario ──────────────────────────────── */

function EscenarioTexto({ mundo, programa, nodoActivo, accionar }: EscenarioProps<MundoTexto>) {
  return <CaraDeTexto programa={programa} catalogo={CATALOGO} nodoActivo={nodoActivo} salida={mundo.salida} accionar={accionar} />;
}

/* ─────────────────────────────── la clase ──────────────────────────────────── */

export const CLASE: ClaseBloques<MundoTexto> = {
  actividadId: 'n6-bloques-vs-codigo',
  titulo: 'El mismo programa, dos caras',
  marca: 'Tecnia Bloques · el mismo programa en texto',
  insignia: { nombre: 'Traductor de programas', emoji: '🎭' },
  minutos: 20,
  portada: {
    situacion: 'Nivel 6 · De bloques a texto · Parada 1 de 2',
    tema: 'El mismo programa, dos caras',
    objetivo:
      'Vas a salir de aquí sabiendo leer en texto un programa que armaste con bloques, y sabiendo lo más importante del cruce: que la boca de un bloque son cuatro espacios, y que esos cuatro espacios cambian lo que el programa hace.',
    vasAHacer: [
      'Ejecutar un programa y ver encenderse el bloque y su línea a la vez.',
      'Cambiar los bloques y ver el texto reescribirse solo.',
      'Meter un bloque dentro de un repetir y encontrar los cuatro espacios.',
      'Leer un programa escrito en Python y armarlo tú en bloques.',
      'Descubrir por qué la misma línea, corrida cuatro espacios, sale tres veces o una.',
    ],
  },
  catalogo: CATALOGO,
  categorias: CATEGORIAS,
  categoriaInicial: 'salida',
  programaInicial: PROGRAMA_INICIAL,
  velocidad: 600,
  mundoInicial: MUNDO_INICIAL,
  preguntar: preguntarTexto,
  reducir: reducirTexto,
  reiniciarMundoAlCorrer: (m) => ({ ...m, salida: [], vuelta: null, bucles: [] }),
  manejarAccion: (id, { establecerMundo }) => {
    if (id === 'intento-escribir') {
      establecerMundo((m) => ({ ...m, intentosDeEscribir: m.intentosDeEscribir + 1 }));
    }
  },
  guion: GUION,
  Escenario: EscenarioTexto,
  bit: {
    inicio:
      'Mira la pantalla: a la izquierda tus bloques de siempre, a la derecha renglones de letras. No son dos programas: es uno solo, escrito de dos maneras. Por eso hay un solo botón de ejecutar. Dale al triángulo verde y mira las dos caras a la vez.',
    cierre:
      'Los bloques no son Python para niños. Son Python con los bordes dibujados. En la siguiente parada abres tu primer archivo de Python y escribes tú las líneas. Ya sabes lo que significan.',
  },
  final: {
    titulo: '¡Ya lees las dos caras!',
    detalle:
      'Armaste con bloques, leíste en Python, y encontraste los cuatro espacios que cambian lo que el programa hace. Eso es cruzar de los bloques al texto.',
  },
};

export function LabBloquesVsCodigo(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaBloques {...props} clase={CLASE} />;
}

export default LabBloquesVsCodigo;
