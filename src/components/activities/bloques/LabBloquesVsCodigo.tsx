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
import { CaraDeTexto } from './CaraDeTexto';
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

export interface MundoTexto {
  /** La consola: lo que ha escrito la corrida actual. */
  salida: string[];
  /** El contador de vuelta del `for`, contado por la clase — `bloques` no
   *  tiene semántica de variable (ver `arbolBloques.ts:46-58`). */
  vuelta: number;
  /** El encargo 6: cuántas veces intentó escribir en la cara de sólo lectura. */
  intentosDeEscribir: number;
}

export const MUNDO_INICIAL: MundoTexto = { salida: [], vuelta: 0, intentosDeEscribir: 0 };

/** Puro: sólo lee el evento, nunca el reloj ni el DOM. */
export function reducirTexto(m: MundoTexto, e: EventoBloques): MundoTexto {
  if (e.tipo === 'entra') return { ...m, vuelta: 0 };
  if (e.tipo === 'accion') {
    if (e.accion === 'decir') return { ...m, salida: [...m.salida, String(e.args.que ?? '')] };
    if (e.accion === 'decir-vuelta') {
      const vuelta = m.vuelta + 1;
      return { ...m, vuelta, salida: [...m.salida, String(vuelta)] };
    }
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
    id: 'linea-nueva',
    titulo: 'Una línea nueva',
    instruccion: 'Agrega un segundo bloque de «decir» al final del guion y ejecuta.',
    pista: 'Toca «decir» en la paleta y después toca la pista «y aquí la siguiente», al final del guion. Después dale a ▶.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) =>
        recorrer(ctx.programa).filter((b) => b.ficha === 'decir').length >= 2 && ctx.mundo.salida.length >= 2,
    },
    aprendido: 'Un bloque más es una línea más. Siempre.',
  },
  {
    id: 'boca-y-sangria',
    titulo: 'La boca y la sangría',
    instruccion:
      'Pon «repetir _ veces» al final del guion, elige 3, y suelta un «decir» DENTRO de su boca. Ejecuta.',
    pista: 'Primero «repetir _ veces» al final. Después «decir» otra vez, pero suéltalo dentro de la boca del repetir, no debajo.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => {
        const repetirConDecir = recorrer(ctx.programa).some(
          (b) => b.ficha === 'repetir' && (b.ramas?.cuerpo?.some((h) => h.ficha === 'decir') ?? false),
        );
        return repetirConDecir && ctx.mundo.salida.length >= 5;
      },
    },
    aprendido: 'Lo que en bloques está dentro de una boca, en texto está corrido cuatro espacios a la derecha.',
  },
  {
    id: 'dentro-y-fuera',
    titulo: 'Dentro y fuera',
    instruccion:
      'Pon otro «decir» abajo del todo, fuera del repetir, y ejecuta. Cuenta: el de adentro salió tres veces y el de afuera una. Ahora mira las dos líneas de la derecha: la única diferencia son cuatro espacios.',
    pista: 'Suelta el nuevo «decir» en la pista que está DESPUÉS del bloque «repetir», no dentro de su boca.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => {
        const tronco = ctx.programa.pilas[0]?.bloques ?? [];
        const indice = tronco.findIndex((b) => b.ficha === 'repetir');
        if (indice === -1) return false;
        const dentro = tronco[indice].ramas?.cuerpo?.some((h) => h.ficha === 'decir') ?? false;
        const fuera = tronco.slice(indice + 1).some((b) => b.ficha === 'decir');
        return dentro && fuera && ctx.mundo.salida.length >= 6;
      },
    },
    aprendido: 'Cuatro espacios deciden si algo pasa una vez o tres, y en texto nadie te avisa.',
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
  reiniciarMundoAlCorrer: (m) => ({ ...m, salida: [], vuelta: 0 }),
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
