'use client';

import type { ActivityProps } from '@/types/activity-contract';
import {
  nuevoBloque,
  pilaDe,
  programaDe,
  type BloquePuesto,
  type CategoriaBloques,
  type EventoBloques,
  type FichaBloque,
  type Programa,
} from '@/components/simuladores/bloques';
import { SalaBloques, type ClaseBloques, type EncargoBloques, type EscenarioProps } from './SalaBloques';
import './bloquesPropios.css';

/**
 * N5 · U4 «Programación en bloques III» · parada 1 — «Bloques propios y
 * mensajes» (curriculo.ts: `n5-bloques-propios`, unidad `n5-bloques-3`).
 *
 * **5.º de primaria, 10–11 años**, leído en `curriculo.ts` (línea 483:
 * `n: 5, grado: '5° de Primaria', edad: '10–11'`). Frases cortas, vocabulario
 * concreto y el nombre técnico dicho sin rodeos: un bloque propio ES una
 * función, y a esta edad se puede decir así.
 *
 * ── LA MECÁNICA, Y POR QUÉ ÉSTA ───────────────────────────────────────────
 *
 * La necesidad del bloque propio **se descubre con las manos, no se explica**:
 * el encargo 2 obliga a copiar la misma secuencia de tres movimientos TRES
 * veces —nueve bloques— antes de que nadie haya nombrado la palabra «función»,
 * y el encargo 3 obliga a borrarlos uno por uno con la ✕. Cuando el encargo 4
 * deja el mismo baile en tres bloques, el alumno ya pagó el precio de no
 * tenerlo. El remate es el encargo 5: cambiar UN bloque dentro de la
 * definición y ver cambiar las tres repeticiones. Ése es el único momento en
 * que el premio de una función se siente en vez de contarse.
 *
 * ── LOS MENSAJES, SIN CORRIDAS SIMULTÁNEAS ────────────────────────────────
 *
 * El armazón no corre dos guiones a la vez —está anotado en `index.ts`— así que
 * esta clase NO pone a bailar a dos personajes en paralelo. Un mensaje aquí es
 * lo que en Scratch es «enviar mensaje **y esperar**»: `llamar` con el nombre
 * del mensaje, y una pila con ese `nombre` que lo recibe. La lección que se
 * enseña —«una parte del programa avisa a otra», «un guion con "al recibir" no
 * arranca solo»— es exacta con esa semántica, y el detalle de que espera se le
 * dice al alumno en la ficha 4 de la entrada en vez de esconderlo.
 *
 * ── POR QUÉ EL MUNDO SE REINICIA EN CADA ▶ ────────────────────────────────
 *
 * La cinta de movimientos es la prueba visual de la lección: con nueve bloques
 * y con tres, la cinta sale IGUAL. Si se acumulara entre corridas, «hizo nueve
 * movimientos» dependería de cuántas veces llevas pulsado ▶ y no del programa,
 * y la comparación dejaría de medir nada. Por eso `reiniciarMundoAlCorrer`.
 */

/* ───────────────────────────── el mundo: el escenario ──────────────────────── */

export type PoseChispa = 'reposo' | 'salto' | 'giro' | 'aplauso' | 'reverencia';

export interface MundoFestival {
  pose: PoseChispa;
  luces: 'apagadas' | 'arcoiris';
  /** Lo que Chispa acaba de hacer, en orden. Es la cinta que se pinta abajo. */
  movimientos: string[];
  /** Cuántas veces se llamó al bloque propio. Sale de los eventos `llama`. */
  pasos: number;
  /** Cuántos mensajes se enviaron. */
  avisos: number;
}

export const MUNDO_INICIAL: MundoFestival = {
  pose: 'reposo',
  luces: 'apagadas',
  movimientos: [],
  pasos: 0,
  avisos: 0,
};

/** Cuántos movimientos se guardan para la cinta. Más no caben en pantalla. */
const TOPE_CINTA = 24;

const POSE_DE: Record<string, PoseChispa> = {
  saltar: 'salto',
  girar: 'giro',
  aplaudir: 'aplauso',
  reverencia: 'reverencia',
};

export const NOMBRE_BLOQUE_PROPIO = 'paso de baile';
export const NOMBRE_MENSAJE = '¡luces!';

/** Puro: sólo lee el evento y el mundo. Ni reloj, ni DOM, ni azar. */
export function reducirFestival(m: MundoFestival, e: EventoBloques): MundoFestival {
  if (e.tipo === 'llama') {
    if (e.nombre === NOMBRE_BLOQUE_PROPIO) return { ...m, pasos: m.pasos + 1 };
    if (e.nombre === NOMBRE_MENSAJE) return { ...m, avisos: m.avisos + 1 };
    return m;
  }
  if (e.tipo !== 'accion') return m;

  const cinta = [...m.movimientos, e.accion].slice(-TOPE_CINTA);
  if (e.accion === 'pintar-arcoiris') return { ...m, luces: 'arcoiris', movimientos: cinta };
  const pose = POSE_DE[e.accion];
  if (!pose) return { ...m, movimientos: cinta };
  return { ...m, pose, movimientos: cinta };
}

/* ── lectores del programa, para los encargos que comprueban estructura ─────── */

const PILA_TRONCO = 'p-baile';
const PILA_DEFINICION = 'p-paso';
const PILA_LUCES = 'p-luces';

/** Los ids de ficha de una pila, en orden. Sin bajar a las bocas: aquí no hay. */
function fichasDe(programa: Programa, pilaId: string): string[] {
  return (pilaDe(programa, pilaId)?.bloques ?? []).map((b) => b.ficha);
}

function mismaLista(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/** El paso de baile original y el que pide la coreógrafa en el encargo 5. */
export const PASO_VIEJO = ['saltar', 'girar', 'aplaudir'] as const;
export const PASO_NUEVO = ['saltar', 'girar', 'reverencia'] as const;

function tresVeces(paso: readonly string[]): string[] {
  return [...paso, ...paso, ...paso];
}

/**
 * Lo que bailó Chispa, quitando las luces.
 *
 * Se filtra `pintar-arcoiris` a propósito: los encargos del baile hablan del
 * BAILE, y si midieran la lista entera, un alumno que se adelantara a poner el
 * mensaje se quedaría atrapado en un encargo anterior. Un encargo que sólo se
 * puede cumplir si nadie exploró antes de tiempo está mal escrito.
 */
function soloBaile(acciones: readonly string[]): string[] {
  return acciones.filter((a) => a !== 'pintar-arcoiris');
}

function bailo(parte: { acciones: string[] } | null, esperado: readonly string[]): boolean {
  return parte !== null && mismaLista(soloBaile(parte.acciones), esperado);
}

function llamadasEnTronco(programa: Programa): number {
  return fichasDe(programa, PILA_TRONCO).filter((f) => f === 'llamar-paso').length;
}

function lucesRecibenArcoiris(programa: Programa): boolean {
  return fichasDe(programa, PILA_LUCES).includes('pintar-arcoiris');
}

/**
 * ¿Las luces se pintaron ANTES del primer paso de baile?
 *
 * Se mide sobre las acciones de la corrida y no sobre la posición del bloque en
 * el guion, porque lo que el encargo pide es que el aviso salga primero — y ésa
 * es la única manera de comprobarlo que sigue valiendo si el alumno lo pone
 * dentro del bloque propio en vez de en el tronco.
 */
function avisoAntesDelBaile(acciones: readonly string[]): boolean {
  const luz = acciones.indexOf('pintar-arcoiris');
  if (luz < 0) return false;
  const primerPaso = acciones.indexOf('saltar');
  return primerPaso < 0 || luz < primerPaso;
}

/* ─────────────────────────────── el catálogo ──────────────────────────────── */

export const CATALOGO_FESTIVAL: FichaBloque[] = [
  /* Los tres sombreros. Categoría `inicio`, que NO está en `CATEGORIAS`: así
   * nunca aparecen en la paleta y el alumno no puede armar un guion nuevo. */
  { id: 'al-empezar', categoria: 'inicio', etiqueta: 'al empezar', semantica: { tipo: 'sombrero' } },
  {
    id: 'definir-paso',
    categoria: 'inicio',
    etiqueta: 'definir «paso de baile»',
    ovalo: 'paso de baile',
    semantica: { tipo: 'sombrero' },
  },
  {
    id: 'al-recibir-luces',
    categoria: 'inicio',
    etiqueta: 'al recibir «¡luces!»',
    ovalo: '¡luces!',
    semantica: { tipo: 'sombrero' },
  },

  {
    id: 'saltar',
    categoria: 'baile',
    etiqueta: 'saltar',
    semantica: { tipo: 'accion' },
    verbo: 'saltar',
    lectura: 'Chispa da un salto.',
    texto: 'saltar()',
  },
  {
    id: 'girar',
    categoria: 'baile',
    etiqueta: 'girar',
    semantica: { tipo: 'accion' },
    verbo: 'girar',
    lectura: 'Chispa gira sobre sí misma.',
    texto: 'girar()',
  },
  {
    id: 'aplaudir',
    categoria: 'baile',
    etiqueta: 'aplaudir',
    semantica: { tipo: 'accion' },
    verbo: 'aplaudir',
    lectura: 'Chispa aplaude.',
    texto: 'aplaudir()',
  },
  {
    id: 'reverencia',
    categoria: 'baile',
    etiqueta: 'hacer reverencia',
    semantica: { tipo: 'accion' },
    verbo: 'reverencia',
    lectura: 'Chispa hace una reverencia.',
    texto: 'reverencia()',
  },
  {
    id: 'pintar-arcoiris',
    categoria: 'luces',
    etiqueta: 'pintar de arcoíris',
    semantica: { tipo: 'accion' },
    verbo: 'pintar-arcoiris',
    lectura: 'Los focos se pintan de arcoíris.',
    texto: 'pintar_arcoiris()',
  },
  /*
   * Las dos piezas de la clase. Las dos son `llamar`: un bloque propio y un
   * mensaje son la MISMA maquinaria —una pila con nombre a la que otra llama—
   * y lo que cambia es para qué se usa. Su nombre va en un desplegable de una
   * sola opción, no en una caja de texto: así se lee como en Scratch y no se
   * puede romper escribiendo un nombre que no existe.
   */
  {
    id: 'llamar-paso',
    categoria: 'mis-bloques',
    etiqueta: 'llamar a',
    semantica: { tipo: 'llamar', ranura: 'nombre' },
    ranuras: [{ id: 'nombre', tipo: 'texto', valor: NOMBRE_BLOQUE_PROPIO, opciones: [NOMBRE_BLOQUE_PROPIO] }],
    lectura: 'Hace todo lo que hay dentro de «definir paso de baile».',
    texto: 'paso_de_baile()',
  },
  {
    id: 'enviar-luces',
    categoria: 'mensajes',
    etiqueta: 'enviar el mensaje',
    semantica: { tipo: 'llamar', ranura: 'mensaje' },
    ranuras: [{ id: 'mensaje', tipo: 'texto', valor: NOMBRE_MENSAJE, opciones: [NOMBRE_MENSAJE] }],
    lectura: 'Avisa a todos los guiones que estén esperando «¡luces!».',
    texto: 'enviar("¡luces!")',
  },
];

const CATEGORIAS: CategoriaBloques[] = [
  { id: 'baile', nombre: 'Baile', color: '#f472b6' },
  { id: 'luces', nombre: 'Luces', color: '#fbbf24' },
  { id: 'mis-bloques', nombre: 'Mis bloques', color: '#a78bfa' },
  { id: 'mensajes', nombre: 'Mensajes', color: '#22d3ee' },
];

function sombreroFijo(fichaId: string, id: string): BloquePuesto {
  const b = nuevoBloque(CATALOGO_FESTIVAL, fichaId, id);
  if (!b) throw new Error(`Ficha desconocida: ${fichaId}`);
  return { ...b, fijo: true };
}

/**
 * Los tres guiones del lienzo. El tronco es el único que corre con ▶; los otros
 * dos tienen `nombre`, y por ese nombre los despierta `llamar`.
 */
export const PROGRAMA_INICIAL: Programa = programaDe(
  { id: PILA_TRONCO, sombrero: sombreroFijo('al-empezar', 'h-baile'), bloques: [] },
  {
    id: PILA_DEFINICION,
    sombrero: sombreroFijo('definir-paso', 'h-paso'),
    nombre: NOMBRE_BLOQUE_PROPIO,
    bloques: [],
  },
  {
    id: PILA_LUCES,
    sombrero: sombreroFijo('al-recibir-luces', 'h-luces'),
    nombre: NOMBRE_MENSAJE,
    bloques: [],
  },
);

/* ─────────────────────────────── el guion ─────────────────────────────────── */

/**
 * EL ORDEN DE LOS OCHO ENCARGOS NO ES EL DEL TEMARIO, Y ES A PROPÓSITO.
 *
 * Los mensajes (4 y 5) se meten en medio de la lección del bloque propio, entre
 * «define» y «llámalo», por una razón medida en el editor: **la vía sin
 * arrastre sólo sabe AÑADIR AL FINAL**. En `ListaBloques` el único blanco que es
 * un `<button>` es el de la cola; las zonas de en medio sólo aceptan `drop`. Un
 * encargo que pidiera meter el «enviar el mensaje» ARRIBA de tres llamadas ya
 * puestas sería imposible con el dedo y con el teclado, y sólo se podría
 * resolver arrastrando.
 *
 * Poniéndolo cuando el tronco está vacío —justo después de vaciarlo en el
 * encargo 3— el mensaje se añade al final de una lista de cero, que es el
 * primer sitio, y las tres llamadas se añaden después. Todo el recorrido se
 * puede jugar tocando, y quien prefiera arrastrar puede igual.
 *
 * De regalo sale la mejor demostración de la clase: en el encargo 5 el tronco
 * tiene UN bloque, se pulsa ▶, y las luces se encienden **sin que Chispa se
 * mueva**. El trabajo lo hizo otro guion.
 */
const GUION: readonly EncargoBloques<MundoFestival>[] = [
  {
    id: 'paso',
    titulo: 'El paso de baile',
    instruccion:
      'El paso de Chispa son tres movimientos: «saltar», «girar» y «aplaudir», en ese orden, debajo de «al empezar». Ármalo y pulsa ▶. Si quieres verlo despacio, usa ⏭ para avanzar un bloque cada vez.',
    pista: 'Los tres están en la categoría Baile. Toca la pieza y después toca el hueco del guion, o arrástrala.',
    logro: {
      /*
       * Los TRES PRIMEROS movimientos, no la lista entera: quien se adelante y
       * ponga los nueve bloques de una vez cumple igual, y de paso cumple el
       * encargo 2 en la misma corrida. Con una comparación exacta se quedaría
       * atrapado en el encargo 1 teniendo el programa BIEN, que es la peor
       * manera de perder a un alumno.
       */
      tipo: 'estado',
      comprueba: (ctx) =>
        ctx.parte !== null && mismaLista(soloBaile(ctx.parte.acciones).slice(0, 3), PASO_VIEJO),
    },
    aprendido: 'Ése es el paso de baile: saltar, girar y aplaudir. Los bloques se cumplen de arriba abajo.',
  },
  {
    id: 'tres-veces',
    titulo: 'Tres veces, a mano',
    instruccion:
      'La coreografía pide el paso TRES veces seguidas. Por ahora no hay atajo: copia los mismos tres bloques dos veces más, hasta tener nueve, y pulsa ▶.',
    pista: 'Nueve bloques en total: saltar, girar, aplaudir, saltar, girar, aplaudir, saltar, girar, aplaudir.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) =>
        bailo(ctx.parte, tresVeces(PASO_VIEJO)) && fichasDe(ctx.programa, PILA_TRONCO).length >= 9,
    },
    aprendido:
      'Funcionó, pero mira tu guion: nueve bloques para una sola idea repetida tres veces. Así es difícil de leer y peor de arreglar.',
  },
  {
    id: 'definir',
    titulo: 'Dale un nombre al paso',
    instruccion:
      'Vacía el guion de arriba con la ✕ —sí, los nueve— y arma el paso UNA sola vez dentro del guion «definir «paso de baile»». Eso es un bloque propio: un trozo de programa con nombre.',
    pista: 'El guion de «definir» está en el mismo lienzo, al lado. Dentro van saltar, girar y aplaudir, una vez.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) =>
        fichasDe(ctx.programa, PILA_TRONCO).length === 0 &&
        mismaLista(fichasDe(ctx.programa, PILA_DEFINICION), PASO_VIEJO),
    },
    aprendido: 'Ya tienes un bloque propio. Se define UNA vez, y por eso los nueve bloques de antes sobraban.',
  },
  {
    id: 'al-recibir',
    titulo: 'El guion que espera',
    instruccion:
      'Chispa no alcanza los focos: las luces tienen su propio guion, el que empieza con «al recibir «¡luces!»». Pon «pintar de arcoíris» ahí dentro. Fíjate: ese guion no cuelga de «al empezar».',
    pista: '«pintar de arcoíris» está en la categoría Luces, y va DENTRO del guion de «al recibir», no en el de arriba.',
    logro: {
      /*
       * Sólo estructura, sin pedir corrida. Pedir «pulsa ▶ y comprueba que las
       * luces siguen apagadas» sonaba mejor y era una trampa: al alumno que se
       * hubiera adelantado a poner el «enviar» las luces ya se le encenderían,
       * y el encargo se volvería imposible. Una clase que no se puede terminar
       * es el defecto más caro del proyecto; quien quiera ver la prueba la ve
       * en el encargo siguiente, que es justo lo que enseña.
       */
      tipo: 'estado',
      comprueba: (ctx) => lucesRecibenArcoiris(ctx.programa),
    },
    aprendido:
      'Ese guion tiene su propio sombrero y no arranca con ▶: se queda esperando hasta que alguien le envíe el mensaje «¡luces!».',
  },
  {
    id: 'enviar',
    titulo: 'Manda el aviso',
    instruccion:
      'El guion de arriba está vacío. Pon en él «enviar el mensaje ¡luces!» —está en la categoría Mensajes— y pulsa ▶. Un solo bloque: mira lo que pasa en los focos, y mira a Chispa.',
    pista: 'El bloque de mensaje va en el guion de «al empezar», que ahora está vacío. No hace falta nada más.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) =>
        ctx.mundo.luces === 'arcoiris' && ctx.parte !== null && avisoAntesDelBaile(ctx.parte.acciones),
    },
    aprendido:
      'Tu guion tenía UN bloque y aun así se encendieron los focos: el trabajo lo hizo el otro guion, el que esperaba el mensaje. Chispa ni se movió.',
  },
  {
    id: 'llamar',
    titulo: 'Llámalo tres veces',
    instruccion:
      'Ahora el baile. En la categoría «Mis bloques» está «llamar a paso de baile»: ponlo TRES veces debajo del mensaje y pulsa ▶.',
    pista: 'Llamar es usar el bloque propio por su nombre. Tres llamadas, tres pasos de baile.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => llamadasEnTronco(ctx.programa) === 3 && bailo(ctx.parte, tresVeces(PASO_VIEJO)),
    },
    aprendido: 'Mira la cinta: el baile es exactamente el mismo que con nueve bloques. Ahora son tres, y se lee lo que hacen.',
  },
  {
    id: 'cambiar',
    titulo: 'Cambia el final en un solo sitio',
    instruccion:
      'La coreógrafa cambió de opinión: el paso termina con una reverencia, no con un aplauso. Dentro de «definir «paso de baile»» quita «aplaudir» y pon «hacer reverencia». No toques las llamadas. Pulsa ▶.',
    pista: 'Sólo se cambia la definición. Las llamadas no guardan el paso: sólo lo piden.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) =>
        mismaLista(fichasDe(ctx.programa, PILA_DEFINICION), PASO_NUEVO) &&
        llamadasEnTronco(ctx.programa) === 3 &&
        bailo(ctx.parte, tresVeces(PASO_NUEVO)),
    },
    aprendido:
      'Cambiaste UN bloque y el baile cambió las tres veces. Eso es lo que te regala un bloque propio: se arregla en un solo sitio.',
  },
  {
    id: 'por-que',
    titulo: '¿Por qué cambiaron las tres?',
    instruccion:
      'Cambiaste «aplaudir» por «hacer reverencia» en un solo sitio y el baile cambió las tres veces. ¿Por qué?',
    pista: 'Piensa en una libreta de recetas: las tres veces que dice «omelette» apuntan a la misma receta.',
    logro: {
      tipo: 'eleccion',
      opciones: [
        'Porque el programa copió el cambio a las otras dos',
        'Porque las tres llamadas apuntan al mismo guion',
        'Porque Chispa se aprendió el paso de memoria',
      ],
      correcta: 1,
    },
    aprendido: 'Exacto: no hay tres copias del paso, hay tres avisos al mismo guion. Por eso se arregla una sola vez.',
  },
];

/* ─────────────────────────────── el escenario ─────────────────────────────── */

const GLIFO: Record<string, string> = {
  saltar: '⬆️',
  girar: '🔄',
  aplaudir: '👏',
  reverencia: '🙇',
  'pintar-arcoiris': '🌈',
};

const FOCOS = [0, 1, 2, 3, 4, 5];

function Festival({ mundo }: EscenarioProps<MundoFestival>) {
  const encendidas = mundo.luces === 'arcoiris';
  return (
    <div className="bp-escenario" data-testid="bp-escenario" data-luces={mundo.luces}>
      <div className="bp-parrilla" aria-hidden="true">
        {FOCOS.map((i) => (
          <span key={i} className={`bp-foco${encendidas ? ' es-encendido' : ''}`} data-foco={i} />
        ))}
      </div>

      <div className="bp-tarima">
        <div className="bp-telon" aria-hidden="true" />
        <span className="bp-chispa" data-testid="bp-chispa" data-pose={mundo.pose} aria-hidden="true">
          🤖
        </span>
        <p className="bp-etiqueta-pose" data-testid="bp-pose">
          {mundo.pose === 'reposo' ? 'Chispa espera' : `Chispa: ${mundo.pose}`}
        </p>
      </div>

      <div className="bp-cinta" data-testid="bp-cinta" aria-label="Movimientos de Chispa">
        {mundo.movimientos.length === 0 ? (
          <span className="bp-cinta-vacia">Todavía no se movió</span>
        ) : (
          mundo.movimientos.map((m, i) => (
            <span key={`${m}-${i}`} className="bp-chip" data-mov={m}>
              {GLIFO[m] ?? '•'}
            </span>
          ))
        )}
      </div>

      <div className="bp-marcador" data-testid="bp-marcador">
        <span>
          Pasos de baile: <strong data-testid="bp-pasos">{mundo.pasos}</strong>
        </span>
        <span>
          Mensajes: <strong data-testid="bp-avisos">{mundo.avisos}</strong>
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────── la clase ─────────────────────────────────── */

export const CLASE_BLOQUES_PROPIOS: ClaseBloques<MundoFestival> = {
  actividadId: 'n5-bloques-propios',
  titulo: 'Bloques propios y mensajes',
  marca: 'Tecnia Bloques · Festival',
  insignia: { nombre: 'Coreógrafa de bloques', emoji: '💃' },
  minutos: 24,
  portada: {
    situacion: 'Nivel 5 · Programación en bloques III · Parada 1 de 3',
    tema: 'Bloques propios y mensajes',
    objetivo:
      'Vas a salir de aquí sabiendo darle un nombre a un trozo de programa que se repite, para escribirlo una vez y usarlo muchas — y sabiendo avisarle a otro guion con un mensaje.',
    vasAHacer: [
      'Armar el paso de baile de Chispa: saltar, girar y aplaudir.',
      'Repetirlo tres veces a mano, y ver lo largo que queda el guion.',
      'Guardarlo en un bloque propio: escrito una vez, con nombre.',
      'Encender los focos avisándoles con un mensaje.',
      'Llamar al paso tres veces y cambiarlo en un solo sitio.',
    ],
  },
  catalogo: CATALOGO_FESTIVAL,
  categorias: CATEGORIAS,
  categoriaInicial: 'baile',
  programaInicial: PROGRAMA_INICIAL,
  pilaInicial: PILA_TRONCO,
  velocidad: 500,
  mundoInicial: MUNDO_INICIAL,
  preguntar: () => false,
  reducir: reducirFestival,
  reiniciarMundoAlCorrer: () => ({ ...MUNDO_INICIAL }),
  guion: GUION,
  Escenario: Festival,
  bit: {
    inicio:
      'Éste es el escenario del festival. Chispa baila con los bloques que le pongas, y las luces tienen su propio guion. Empecemos por un paso.',
    cierre:
      'Chispa ya tiene coreografía, luces y un guion corto. Aprendiste lo que hacen los programadores todos los días: ponerle nombre a lo que se repite.',
  },
  final: {
    titulo: '¡El festival salió perfecto!',
    detalle:
      'Chispa bailó tres veces el mismo paso, tú lo escribiste una sola vez, y las luces se encendieron porque alguien les avisó.',
  },
};

export function LabBloquesPropios(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaBloques {...props} clase={CLASE_BLOQUES_PROPIOS} />;
}

export default LabBloquesPropios;
