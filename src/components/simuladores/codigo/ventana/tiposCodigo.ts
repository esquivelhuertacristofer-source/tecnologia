/**
 * Tecnia Código · `tiposCodigo.ts` — los datos y las funciones puras.
 *
 * Ni una línea de React. Es el archivo que se puede probar sin montar nada, y
 * por eso vive aquí todo lo que un teclado hace con un texto: la tecla Tab, la
 * tecla Enter, qué líneas están bajo llave y si un cambio se permite o no.
 *
 * Es el mismo reparto que en `asistente/`: datos puros → gancho de estado →
 * ventana tonta.
 *
 * ── Por qué la métrica del editor es un OBJETO de JavaScript y no CSS ───────
 *
 * El editor son **dos elementos apilados**: un `<textarea>` transparente
 * encima y una capa de colores debajo. Si la tipografía, el tamaño, el
 * interlineado, el relleno o el borde no son **idénticos**, el texto de arriba
 * y el de abajo se separan carácter a carácter y el editor se vuelve inútil —
 * es la avería clásica de esta técnica.
 *
 * Poner esas medidas en CSS deja dos declaraciones que alguien puede tocar por
 * separado seis meses después. Aquí hay **una sola constante** que se le pone
 * en línea a los dos elementos, de modo que la única forma de desalinearlos es
 * que dejen de leer la misma constante — y eso lo caza una prueba comparando
 * el atributo `style` de los dos, que tiene que salir **idéntico letra por
 * letra**. Lo que no afecta a la geometría (colores, fondos, cursor, sombras)
 * sí vive en el CSS, donde debe estar.
 */

import type { ErrorPy } from '../errores';
import type { Estado, Vistazo } from '../maquina';

/* ── La métrica del editor ──────────────────────────────────────────────────*/

/** Alto de una línea, en píxeles. De aquí sale el interlineado y el alto del recuadro. */
export const ALTO_LINEA = 22;
/** Relleno vertical. El mismo para la capa, el textarea y los números. */
export const RELLENO_V = 10;
/** Relleno horizontal del texto. Los números tienen el suyo, no lleva texto del alumno. */
export const RELLENO_H = 14;

/**
 * Lo que se le pone EN LÍNEA, igual, a la capa de colores y al `<textarea>`.
 *
 * Cambiar cualquier valor de aquí mueve los dos a la vez o no mueve ninguno.
 * `whiteSpace: 'pre'` es parte de la métrica y no del estilo: sin él, uno de
 * los dos partiría las líneas largas y el otro no.
 */
export const METRICA_EDITOR = {
  fontFamily: "'Cascadia Mono', 'JetBrains Mono', Consolas, 'SF Mono', Menlo, 'DejaVu Sans Mono', monospace",
  fontSize: '14px',
  fontWeight: 500,
  fontStyle: 'normal',
  fontVariantLigatures: 'none',
  lineHeight: `${ALTO_LINEA}px`,
  letterSpacing: '0px',
  wordSpacing: '0px',
  tabSize: 4,
  whiteSpace: 'pre',
  padding: `${RELLENO_V}px ${RELLENO_H}px`,
  borderWidth: '0px',
  boxSizing: 'border-box',
} as const;

/** La columna de números. Comparte fuente e interlineado; el relleno lateral es suyo. */
export const METRICA_NUMEROS = {
  fontFamily: METRICA_EDITOR.fontFamily,
  fontSize: METRICA_EDITOR.fontSize,
  fontWeight: 700,
  lineHeight: METRICA_EDITOR.lineHeight,
  letterSpacing: METRICA_EDITOR.letterSpacing,
  padding: `${RELLENO_V}px 10px ${RELLENO_V}px 12px`,
  boxSizing: 'border-box',
} as const;

/* ── La velocidad ───────────────────────────────────────────────────────────*/

export type VelocidadId = 'tortuga' | 'lenta' | 'normal' | 'rayo';

export interface Velocidad {
  id: VelocidadId;
  nombre: string;
  glifo: string;
  /** Milisegundos entre tic y tic. `0` = sin reloj: se ejecuta entero de golpe. */
  ms: number;
  /**
   * Cuánto se avanza en cada tic. Con `porSentencia`, es en sentencias del
   * alumno —que es lo que hace que la línea resaltada se mueva de una en una—;
   * sin él, en instrucciones del intérprete, que van mucho más finas.
   */
  cuanto: number;
  porSentencia: boolean;
}

/**
 * Cuatro, y las cuatro hacen falta.
 *
 * `tortuga` es la de leer el paso a paso en voz alta con el grupo; `normal` es
 * la de ver correr un bucle sin dormirse; `rayo` no programa ni un reloj —el
 * programa entero se ejecuta y se pinta una vez— y es la que usan las pruebas
 * y la que quiere quien sólo mira la salida.
 */
export const VELOCIDADES: readonly Velocidad[] = [
  { id: 'tortuga', nombre: 'Muy lenta', glifo: '🐢', ms: 600, cuanto: 1, porSentencia: true },
  { id: 'lenta', nombre: 'Lenta', glifo: '🚶', ms: 200, cuanto: 1, porSentencia: true },
  { id: 'normal', nombre: 'Normal', glifo: '🏃', ms: 16, cuanto: 8, porSentencia: true },
  { id: 'rayo', nombre: 'Sin pausas', glifo: '⚡', ms: 0, cuanto: 0, porSentencia: false },
];

export function velocidadDe(id: VelocidadId): Velocidad {
  return VELOCIDADES.find((v) => v.id === id) ?? VELOCIDADES[2];
}

/* ── Lo que se ve de una ejecución ──────────────────────────────────────────*/

/**
 * En qué punto está la sesión. **No es el estado de la máquina**: la máquina no
 * sabe de un alumno que le da a ⏹, ni de un editor que todavía no ha arrancado
 * nada.
 */
export type FaseCodigo =
  /** No hay programa en marcha. El editor se puede escribir. */
  | 'libre'
  /** Corriendo sola, con su reloj. */
  | 'corriendo'
  /** Hay máquina viva y parada: se llegó aquí con ⏭, o pulsando ⏭ mientras corría. */
  | 'pausada'
  /** `input()` preguntó y no se le ha contestado. */
  | 'esperando'
  /** Llegó al final. */
  | 'terminada'
  /** Se tropezó. `error` lo cuenta. */
  | 'error'
  /** El alumno pulsó ⏹. La salida se queda para poder leerla. */
  | 'detenida';

/** La foto de la ejecución que se pinta. Inmutable: se rehace en cada tic. */
export interface Ejecucion {
  fase: FaseCodigo;
  /** El estado de la máquina de verdad, o `null` si no hay máquina. */
  estadoMaquina: Estado | null;
  /** Las líneas que ha escrito el programa, en orden. */
  salida: string[];
  variables: Vistazo[];
  pilaDeLlamadas: { funcion: string; linea: number }[];
  error: ErrorPy | null;
  /** La línea que se va a ejecutar AHORA. `0` = ninguna. */
  linea: number;
  /** La línea que hay que mirar: la del error si lo hay, si no la de ejecución. */
  lineaSenalada: number;
  pasos: number;
  /** Lo que `input()` está preguntando, o `null`. */
  pregunta: string | null;
}

export const EJECUCION_VACIA: Ejecucion = {
  fase: 'libre',
  estadoMaquina: null,
  salida: [],
  variables: [],
  pilaDeLlamadas: [],
  error: null,
  linea: 0,
  lineaSenalada: 0,
  pasos: 0,
  pregunta: null,
};

/* ── El guion de la clase ───────────────────────────────────────────────────*/

/**
 * Dónde mira el alumno en este encargo.
 *
 * Aquí no hay cinta que señalar como en Office: lo que se señala es **una línea
 * del editor** o **uno de los controles**. Con `linea` el editor pinta esa
 * línea con el aro del encargo; con `control`, el botón se ilumina.
 */
export interface SenalCodigo {
  linea?: number;
  control?: 'ejecutar' | 'parar' | 'paso' | 'velocidad' | 'consola' | 'variables' | 'editor';
}

/**
 * Cómo se da por hecho un encargo. **La corrección la escribe la clase**: el
 * armazón sólo llama al predicado y no sabe qué pregunta (canon, prueba 3).
 *
 * Son dos predicados y no uno porque son dos preguntas distintas y las dos se
 * hacen: `programa` mira **lo que el alumno escribió** (¿usaste un `for`?
 * ¿pusiste el `input` antes del `if`?) y es pura sobre el texto; `ejecucion`
 * mira **lo que salió** (¿imprimió la tabla del 7? ¿la variable `total` acabó
 * valiendo 91?). Un encargo que se pregunta con la salida no se puede
 * responder leyendo el texto, y al revés tampoco.
 */
export type LogroCodigo =
  | { tipo: 'programa'; comprueba: (fuente: string) => boolean }
  | { tipo: 'ejecucion'; comprueba: (e: Ejecucion, fuente: string) => boolean }
  | { tipo: 'eleccion'; opciones: string[]; correcta: number }
  | { tipo: 'confirma'; boton: string };

export interface PasoCodigo {
  id: string;
  /** Cabecera corta del encargo. */
  titulo: string;
  /** Qué hay que hacer, en una o dos frases y en segunda persona. */
  instruccion: string;
  /** Aparece sola tras el primer intento fallido. */
  pista: string;
  senal?: SenalCodigo;
  logro: LogroCodigo;
  /** La frase que se lleva el alumno al acertar. Es la clase, en una línea. */
  aprendido: string;
}

export interface GuionCodigo {
  pasos: PasoCodigo[];
  /** La frase de «Terminaste», en voz de lo que el alumno ya sabe hacer. */
  cierre?: string;
}

/** Lo que la clase le pasa a su propio panel. */
export interface PanelCodigoProps {
  ejecucion: Ejecucion;
  texto: string;
  /** Llevar el cursor del alumno a una línea y enfocarla. */
  senalarLinea: (linea: number) => void;
}

/** Una herramienta que aporta la clase y el armazón no trae. */
export interface HerramientaCodigo {
  id: string;
  etiqueta: string;
  glifo?: string;
  onClick: () => void;
  deshabilitada?: boolean;
  /** La que arrastra la vista: se pinta llena, no de contorno. */
  principal?: boolean;
  /** Se queda hundida. Para las que son interruptor. */
  activa?: boolean;
}

export interface ResumenCodigo {
  encargos: number;
  hechos: number;
  tropiezos: number;
  segundos: number;
}

/* ── Las líneas bajo llave ──────────────────────────────────────────────────*/

/**
 * `soloLectura` en su forma útil: el conjunto de números de línea intocables.
 *
 * `'todo'` no se representa como «todas las líneas» a propósito: un programa
 * entero de sólo lectura apaga el `<textarea>` con `readOnly`, que es otra
 * cosa y se decide fuera.
 */
export function lineasBajoLlave(soloLectura: number[] | 'todo' | undefined): ReadonlySet<number> {
  if (!soloLectura || soloLectura === 'todo') return new Set();
  return new Set(soloLectura.filter((n) => Number.isInteger(n) && n >= 1));
}

/**
 * ¿Se puede pasar de `viejo` a `nuevo` sin tocar lo que está bajo llave?
 *
 * La regla es una sola y se le puede explicar a un alumno de secundaria: **una
 * línea con candado tiene que seguir diciendo lo mismo y seguir siendo la misma
 * línea**. De ahí sale gratis lo demás: escribir debajo del todo se permite
 * (no mueve a nadie de sitio), meter o quitar una línea por encima de un
 * candado no (correría el candado a otro número, y el guion y los errores
 * hablan por número de línea).
 */
export function cambioPermitido(viejo: string, nuevo: string, bajoLlave: ReadonlySet<number>): boolean {
  if (bajoLlave.size === 0) return true;
  if (viejo === nuevo) return true;
  const antes = viejo.split('\n');
  const despues = nuevo.split('\n');
  for (const n of bajoLlave) {
    if (antes[n - 1] === undefined) continue;
    if (despues[n - 1] !== antes[n - 1]) return false;
  }
  return true;
}

/* ── El teclado, como funciones puras ───────────────────────────────────────*/

/** Un cambio de texto con dónde queda la selección después. */
export interface Edicion {
  texto: string;
  desde: number;
  hasta: number;
}

/** El ancho de un nivel de sangría. Python de verdad usa cuatro espacios. */
export const SANGRIA = 4;

function principioDeLinea(texto: string, pos: number): number {
  return texto.lastIndexOf('\n', Math.max(0, pos - 1)) + 1;
}

/**
 * La tecla **Tab** dentro del editor.
 *
 * Sin selección mete espacios **hasta la siguiente parada de cuatro**, no
 * cuatro a secas: con el cursor en la columna 3, cuatro espacios lo dejarían
 * en la 7 y la sangría de Python ya no cuadraría con ningún bloque. Con varias
 * líneas seleccionadas sangra todas, que es lo que hace falta al meter un
 * trozo dentro de un `if`.
 *
 * `atras` (Mayús+Tab) quita hasta cuatro espacios del principio de la línea.
 * En Python **des**angrar es tan necesario como sangrar: es como se cierra un
 * bloque.
 */
export function conTab(texto: string, desde: number, hasta: number, atras: boolean): Edicion {
  const iniLinea = principioDeLinea(texto, desde);
  const variasLineas = texto.slice(desde, hasta).includes('\n');

  if (!variasLineas && !atras) {
    const columna = desde - iniLinea;
    const cuantos = SANGRIA - (columna % SANGRIA);
    const relleno = ' '.repeat(cuantos);
    return {
      texto: texto.slice(0, desde) + relleno + texto.slice(hasta),
      desde: desde + cuantos,
      hasta: desde + cuantos,
    };
  }

  /* Un bloque de líneas: se rehace desde el principio de la primera hasta el
   * final de la última, para no partir ninguna por la mitad. */
  const salto = texto.indexOf('\n', hasta);
  const finLinea = salto === -1 ? texto.length : salto;
  const bloque = texto.slice(iniLinea, finLinea).split('\n');
  const nuevas = bloque.map((linea) => {
    if (atras) return linea.replace(/^ {1,4}/, '');
    /* Una línea vacía no se sangra: dejaría espacios sueltos donde no hay nada. */
    return linea === '' ? linea : ' '.repeat(SANGRIA) + linea;
  });
  const cuerpo = nuevas.join('\n');
  const nuevoTexto = texto.slice(0, iniLinea) + cuerpo + texto.slice(finLinea);

  if (!variasLineas) {
    /* Desangrar una sola línea deja el cursor donde estaba, corrido lo que se
     * haya quitado. Con varias, se queda seleccionado el bloque entero, que es
     * lo que hace cualquier editor y lo que permite sangrar dos veces seguidas. */
    const quitado = bloque[0].length - nuevas[0].length;
    return {
      texto: nuevoTexto,
      desde: Math.max(iniLinea, desde - quitado),
      hasta: Math.max(iniLinea, hasta - quitado),
    };
  }
  return { texto: nuevoTexto, desde: iniLinea, hasta: iniLinea + cuerpo.length };
}

/**
 * La tecla **Enter**: baja de línea heredando la sangría, y si la línea acaba
 * en `:` mete un nivel más.
 *
 * Es lo que hace Thonny, y no es un lujo: la sangría es sintaxis, y el error
 * de sangría del primer día casi siempre es una línea que se quedó pegada al
 * margen. Heredar la sangría no le quita nada al alumno —sigue teniendo que
 * entenderla para desangrar— y le quita el error de escribirla a mano.
 */
export function conEnter(texto: string, desde: number, hasta: number): Edicion {
  const iniLinea = principioDeLinea(texto, desde);
  const anterior = texto.slice(iniLinea, desde);
  const sangria = /^[ \t]*/.exec(anterior)?.[0] ?? '';
  const abreBloque = anterior.replace(/#.*$/, '').trimEnd().endsWith(':');
  const nueva = '\n' + sangria + (abreBloque ? ' '.repeat(SANGRIA) : '');
  return {
    texto: texto.slice(0, desde) + nueva + texto.slice(hasta),
    desde: desde + nueva.length,
    hasta: desde + nueva.length,
  };
}

/* ── El eco del error ───────────────────────────────────────────────────────*/

/**
 * La línea culpable y el dedo debajo, para pintarlos como material de clase.
 *
 * Es **el mismo cálculo** que hace `textoDeError` para su versión en texto —
 * incluido el tabulador que ocupa cuatro al pintarlo—, y por eso hay una
 * prueba que exige que estas dos cadenas aparezcan dentro de lo que devuelve
 * `textoDeError`: si una de las dos deriva, la prueba se cae. No se reutiliza
 * su salida a secas porque aquí no se quiere un bloque de texto, se quiere DOM
 * con la línea a un lado y el dedo debajo.
 */
export function ecoDeLinea(fuente: string, linea: number, columna: number | null): { codigo: string; dedo: string } | null {
  if (linea <= 0) return null;
  const cruda = fuente.replace(/\r\n?/g, '\n').split('\n')[linea - 1];
  if (cruda === undefined || cruda.trim() === '') return null;
  const codigo = cruda.replace(/\t/g, '    ');
  if (columna === null || columna <= 0) return { codigo, dedo: '' };
  const desplazamiento = cruda.slice(0, columna - 1).replace(/\t/g, '    ').length;
  return { codigo, dedo: ' '.repeat(desplazamiento) + '^' };
}
