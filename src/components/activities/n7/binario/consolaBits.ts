/**
 * N7·U1·parada 2 — «Binario y unidades». Datos puros y funciones puras de la
 * consola de bits. **Sin React**, siguiendo el patrón de la casa
 * (`COMO-SE-CONSTRUYE.md` §1): el componente fabrica un dato —el índice del
 * interruptor que se tocó, la chapa que se eligió— y de ahí todo son
 * funciones puras. Por eso las pruebas de este módulo no tocan el DOM.
 *
 * Toda la aritmética que el alumno ve escrita en pantalla sale de aquí. En
 * particular `bytesDelSistema`: el «465 GB» del disco de 500 GB **se calcula**,
 * no se escribe a mano, para que no pueda quedar desfasado del ejemplo.
 *
 * Decisión de modelo: la escalera usa el factor **1 000** (el que se enseña y
 * el que el alumno ve en las cajas), y la cuenta de 1 024 vive aparte en
 * `bytesDelSistema`, que es justo el contraste que enseña la ronda 4.
 */

/** Valor de cada posición de un byte, del bit más significativo al menos. */
export const VALORES_POSICION: readonly number[] = [128, 64, 32, 16, 8, 4, 2, 1];

/** Los ocho bits de un byte, del más significativo al menos. Inmutable. */
export type Bits = readonly boolean[];

export const BITS_APAGADOS: Bits = Object.freeze([false, false, false, false, false, false, false, false]);

/** Suma de los valores posicionales encendidos. 0 a 255. */
export function aDecimal(bits: Bits): number {
  return VALORES_POSICION.reduce((suma, valor, i) => (bits[i] ? suma + valor : suma), 0);
}

/** El byte de un número de 0 a 255. Fuera de rango se recorta al rango. */
export function aBinario(n: number): Bits {
  const acotado = Math.max(0, Math.min(255, Math.trunc(n)));
  let resto = acotado;
  return VALORES_POSICION.map((valor) => {
    if (resto >= valor) {
      resto -= valor;
      return true;
    }
    return false;
  });
}

/** El byte escrito, como se lee en el display: `00100101`. */
export function textoBinario(bits: Bits): string {
  return bits.map((b) => (b ? '1' : '0')).join('');
}

/**
 * Alterna un interruptor. Devuelve **el mismo objeto por identidad** cuando el
 * índice cae fuera del byte: la regla de la casa es que una operación que no
 * cambia nada no fabrica un objeto nuevo (se comprueba con `toBe`).
 */
export function alternar(bits: Bits, i: number): Bits {
  if (!Number.isInteger(i) || i < 0 || i >= VALORES_POSICION.length) return bits;
  return bits.map((b, j) => (j === i ? !b : b));
}

/** `37 = 32 + 4 + 1`. Con todo apagado, la suma vacía se escribe `0`. */
export function descomposicion(bits: Bits): string {
  const sumandos = VALORES_POSICION.filter((_, i) => bits[i]);
  return sumandos.length === 0 ? '0' : sumandos.join(' + ');
}

export type Diferencia =
  | { tipo: 'exacto' }
  | { tipo: 'falta'; cantidad: number }
  | { tipo: 'sobra'; cantidad: number };

/** Cuánto le falta o le sobra al valor formado para llegar al pedido. */
export function diferencia(actual: number, objetivo: number): Diferencia {
  if (actual === objetivo) return { tipo: 'exacto' };
  if (actual < objetivo) return { tipo: 'falta', cantidad: objetivo - actual };
  return { tipo: 'sobra', cantidad: actual - objetivo };
}

/** La pista direccional que dice Bit al fijar mal. Nunca «te equivocaste». */
export function pistaDiferencia(actual: number, objetivo: number): string {
  const d = diferencia(actual, objetivo);
  if (d.tipo === 'exacto') return '';
  const verbo = d.tipo === 'falta' ? 'te faltan' : 'te sobran';
  return `Formaste ${actual} y te pido ${objetivo}: ${verbo} ${d.cantidad}.`;
}

// ── La escalera de unidades ──────────────────────────────────────────────

export interface Peldano {
  id: string;
  /** Nombre completo, con su abreviatura al lado la primera vez (registro §30.4). */
  nombre: string;
  abrev: string;
  /** Cuántos bytes vale un escalón. El bit vale un octavo de byte. */
  bytes: number;
  /** Lo que se enciende en el peldaño al colocarlo. */
  factor: string;
  color: string;
}

/** De menor a mayor. El orden de este arreglo **es** la respuesta de la ronda 2. */
export const ESCALERA: readonly Peldano[] = Object.freeze([
  { id: 'bit', nombre: 'bit', abrev: 'b', bytes: 1 / 8, factor: '0 o 1 — la unidad mínima', color: '#22d3ee' },
  { id: 'byte', nombre: 'byte', abrev: 'B', bytes: 1, factor: '1 byte = 8 bits', color: '#38bdf8' },
  { id: 'kb', nombre: 'kilobyte', abrev: 'KB', bytes: 1e3, factor: '1 KB ≈ 1 000 bytes', color: '#a78bfa' },
  { id: 'mb', nombre: 'megabyte', abrev: 'MB', bytes: 1e6, factor: '1 MB ≈ 1 000 KB', color: '#f472b6' },
  { id: 'gb', nombre: 'gigabyte', abrev: 'GB', bytes: 1e9, factor: '1 GB ≈ 1 000 MB', color: '#fbbf24' },
  { id: 'tb', nombre: 'terabyte', abrev: 'TB', bytes: 1e12, factor: '1 TB ≈ 1 000 GB', color: '#34d399' },
]);

/**
 * El orden en que las seis chapas aparecen en la charola. Barajado a mano y
 * **fijo**: `Math.random()` haría que la clase no fuese la misma para todos y
 * que ninguna prueba pudiera comprobar el recorrido.
 */
export const CHAPAS_BARAJADAS: readonly string[] = Object.freeze(['mb', 'bit', 'gb', 'byte', 'tb', 'kb']);

/** El peldaño de la escalera en el que cae un tamaño dado en bytes. */
export function escalonDe(bytes: number): Peldano {
  for (let i = ESCALERA.length - 1; i > 0; i -= 1) {
    if (bytes >= ESCALERA[i].bytes) return ESCALERA[i];
  }
  return ESCALERA[0];
}

/** Índice de un peldaño por su id; −1 si no existe. */
export function indiceDe(id: string): number {
  return ESCALERA.findIndex((p) => p.id === id);
}

// ── Ronda 3: cuánto pesa cada cosa ───────────────────────────────────────

export interface ObjetoPesado {
  id: string;
  titulo: string;
  icono: string;
  /** Tamaño real en bytes; de aquí sale el escalón correcto, no de una constante. */
  bytes: number;
  /** La cifra tal como se le enseña al alumno al acertar. */
  cifra: string;
  porQue: string;
}

export const OBJETOS: readonly ObjetoPesado[] = Object.freeze([
  {
    id: 'mensaje',
    titulo: 'Un mensaje de texto de 120 caracteres',
    icono: '💬',
    bytes: 120,
    cifra: '120 B',
    porQue: 'Un byte por carácter. Todo el mensaje cabe en lo que ocupa una sola palabra de este renglón.',
  },
  {
    id: 'cancion',
    titulo: 'Una canción de 4 minutos',
    icono: '🎵',
    bytes: 4_000_000,
    cifra: '≈ 4 MB',
    porQue: 'Cuatro millones de bytes. En un disco de 1 GB caben unas doscientas cincuenta canciones.',
  },
  {
    id: 'pelicula',
    titulo: 'Una película en alta definición',
    icono: '🎬',
    bytes: 4_700_000_000,
    cifra: '≈ 4,7 GB',
    porQue: 'Mil veces una canción. Por eso una película tarda en descargarse y una canción no.',
  },
  {
    id: 'respaldo',
    titulo: 'El respaldo completo del taller',
    icono: '🗄️',
    bytes: 12_000_000_000_000,
    cifra: '≈ 12 TB',
    porQue: 'Doce billones de bytes: años de trabajo de todo un equipo, y todavía cabe en dos discos.',
  },
]);

// ── Ronda 4: 1 000 contra 1 024 ──────────────────────────────────────────

/** Un gibibyte: lo que la computadora llama «GB» al contar en potencias de 2. */
export const BYTES_POR_GB_DEL_SISTEMA = 1024 ** 3;

/**
 * Lo que el sistema muestra para un disco vendido como `gigasDelFabricante` GB.
 * `bytesDelSistema(500) === 465`. Es una función y no una constante a propósito:
 * si mañana el ejemplo usa otro disco, el número de la pantalla se recalcula.
 */
export function bytesDelSistema(gigasDelFabricante: number): number {
  return Math.floor((gigasDelFabricante * 1e9) / BYTES_POR_GB_DEL_SISTEMA);
}

// ── Ronda 1: los cinco números ───────────────────────────────────────────

export interface RetoNumero {
  objetivo: number;
  consigna: string;
  /** Lo que dice Bit al fijarlo bien, además de la descomposición. */
  remate: string;
}

export const NUMEROS: readonly RetoNumero[] = Object.freeze([
  {
    objetivo: 5,
    consigna: 'Forma el 5. Empieza por el interruptor más grande que quepa sin pasarte.',
    remate: 'Con dos interruptores basta. Binario no significa «muchos unos».',
  },
  {
    objetivo: 10,
    consigna: 'Forma el 10.',
    remate: 'Ocho más dos. Cada posición vale el doble que la de su derecha, siempre.',
  },
  {
    objetivo: 37,
    consigna: 'Forma el 37. Busca el valor más grande que quepa y resta lo que sobra.',
    remate: 'Cabe 32, quedan 5; cabe 4, queda 1; cabe 1. Ese es el método completo.',
  },
  {
    objetivo: 65,
    consigna: 'Forma el 65. Este número tiene algo especial.',
    remate:
      'Ese byte exacto es lo que queda guardado cuando escribes una A mayúscula. La tabla que lo decide se llama ASCII (American Standard Code for Information Interchange): el texto también son números.',
  },
  {
    objetivo: 255,
    consigna: 'Sube los ocho interruptores.',
    remate: 'Doscientos cincuenta y cinco. Más grande no cabe en un byte: son 256 valores contando el cero.',
  },
]);

/** Total de encargos de la clase: 5 números + 6 chapas + 4 objetos + 1 disco. */
export const TOTAL_PASOS = NUMEROS.length + ESCALERA.length + OBJETOS.length + 1;
