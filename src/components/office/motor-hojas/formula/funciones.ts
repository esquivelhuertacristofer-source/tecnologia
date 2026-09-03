/**
 * Tecnia Hojas · `formula/funciones.ts` — **una tabla, no un `switch`** (§45.5).
 *
 * La diferencia no es de estilo. Una tabla se puede recorrer, y de recorrerla
 * salen tres cosas que un `switch` no da: la lista de funciones que el alumno
 * tiene disponibles en cada grado, el aviso «te faltan argumentos» **antes** de
 * aceptar la fórmula, y la ayuda emergente con la firma. Es el mismo argumento
 * que el de §45.6 con los comandos, un piso más abajo.
 *
 * ── El contagio del error, que es la decisión de este archivo ───────────────
 *
 * En el modelo un error es un valor (§45.4), así que hay que decir qué hace
 * cada función cuando le llega uno. Por omisión, **contagia**: si un argumento
 * es `#¡DIV/0!`, el resultado es `#¡DIV/0!`. Es lo que hace Excel y es lo que
 * hay que enseñar, porque un error que aparece en una celda lejana y no se sabe
 * de dónde viene es exactamente lo que la clase 47 (auditoría) desmonta.
 *
 * Las que NO contagian llevan `contagia: false` y son pocas, y cada una por su
 * motivo:
 *
 *   - `SI.ERROR` y `ESERROR`, porque su oficio es **mirar** el error.
 *   - `SI`, `Y`, `O`, porque tienen que poder elegir una rama buena aunque la
 *     otra esté rota. Y aquí es donde se cobra la decisión del modelo: como el
 *     error es un valor, `SI` puede evaluar las dos ramas y aun así devolver la
 *     buena. Con excepciones habría que evaluar en diferido y esto sería otro
 *     motor.
 *   - `CONTAR` y `CONTAR.BLANCO`, porque cuentan, y un error no es un número.
 *
 * ── Y el reloj se pasa, no se lee ───────────────────────────────────────────
 *
 * `HOY()` y `AHORA()` reciben la hora en el `Contexto`. Si leyeran el reloj del
 * sistema, ninguna clase que las use se podría probar dos veces con el mismo
 * resultado, y las pruebas de esa clase serían distintas cada día a medianoche.
 *
 * ── Fidelidad que parece un defecto y no lo es ──────────────────────────────
 *
 * `=SUMA(A1:A9)` **ignora el texto que hay dentro del rango**, pero
 * `=SUMA("3")` vale 3. No es una incoherencia nuestra: es Excel, y es la causa
 * número uno de «mi suma da 0» en una hoja con números pegados de una página
 * web. Se copia tal cual porque el alumno se va a encontrar eso, y porque la
 * clase de datos limpios (bloque 44) existe justamente por esto.
 */

import {
  aBooleano,
  aNumero,
  aTexto,
  comparar,
  err,
  esError,
  textoDeNumero,
  type Valor,
  type ValorError,
} from '../modelo';

/**
 * Un argumento ya evaluado.
 *
 * Un escalar llega como una lista de uno. Se distingue con `esRango` porque hay
 * funciones que se comportan distinto según se les dé un rango o un valor
 * suelto —`SUMA` es el ejemplo de la cabecera— y porque `BUSCARX` necesita que
 * dos rangos vengan alineados posición a posición.
 */
export interface Argumento {
  valores: Valor[];
  esRango: boolean;
}

/** Lo que el motor sabe del mundo. Hoy sólo la hora, y a propósito. */
export interface Contexto {
  /** Milisegundos desde 1970, como `Date.now()`, pero pasados desde fuera. */
  ahora: number;
}

export interface Funcion {
  nombre: string;
  /** Cuántos argumentos admite. `max: Infinity` para las de lista abierta. */
  min: number;
  max: number;
  /** Qué dice la ayuda. Se usará en la cinta y en el modo guía. */
  firma: string;
  /** Por omisión `true`: un argumento con error se convierte en el resultado. */
  contagia?: boolean;
  calcular(args: Argumento[], ctx: Contexto): Valor;
}

/* ── ayudas ─────────────────────────────────────────────────────────────────*/

const esc = (a: Argumento | undefined): Valor => (a ? (a.valores[0] ?? null) : null);

/** El primer error que asome, para el contagio por omisión. */
function primerError(args: Argumento[]): ValorError | null {
  for (const a of args) for (const v of a.valores) if (esError(v)) return v;
  return null;
}

/**
 * Los números de una lista de argumentos, con la regla de Excel de la cabecera:
 * dentro de un rango sólo cuentan los números; suelto, se convierte lo que se
 * pueda.
 */
function numerosDe(args: Argumento[]): number[] | ValorError {
  const ns: number[] = [];
  for (const a of args) {
    for (const v of a.valores) {
      if (a.esRango) {
        if (typeof v === 'number') ns.push(v);
        continue;
      }
      if (v === null) continue;
      const n = aNumero(v);
      if (typeof n !== 'number') return n;
      ns.push(n);
    }
  }
  return ns;
}

const suma = (ns: number[]) => ns.reduce((s, n) => s + n, 0);

/**
 * El criterio de `SUMAR.SI` y `CONTAR.SI`: `10`, `">10"`, `"<>x"`, `"man*"`.
 *
 * Los comodines son de Excel: `*` es cualquier cosa y `?` es un carácter. Se
 * escapa todo lo demás porque si no, un criterio como `"3.5"` casaría con
 * `"3x5"` — un punto es un comodín en una expresión regular y no en Excel.
 */
export function comparador(criterio: Valor): (v: Valor) => boolean {
  if (typeof criterio === 'string') {
    const m = /^(<>|<=|>=|=|<|>)(.*)$/.exec(criterio.trim());
    if (m) {
      const op = m[1];
      const crudo = m[2].trim();
      const objetivo: Valor = crudo === '' ? null : Number.isFinite(Number(crudo)) ? Number(crudo) : crudo;
      return (v) => {
        const c = comparar(v, objetivo);
        if (typeof c !== 'number') return false;
        switch (op) {
          case '<>':
            return c !== 0;
          case '<=':
            return c <= 0;
          case '>=':
            return c >= 0;
          case '<':
            return c < 0;
          case '>':
            return c > 0;
          default:
            return c === 0;
        }
      };
    }
    if (criterio.includes('*') || criterio.includes('?')) {
      const patron = criterio
        .split('')
        .map((c) => (c === '*' ? '.*' : c === '?' ? '.' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
        .join('');
      const re = new RegExp(`^${patron}$`, 'i');
      return (v) => re.test(aTexto(v));
    }
  }
  return (v) => comparar(v, criterio) === 0;
}

/** El día 0 de Excel. Una fecha es un número disfrazado (bloque 29). */
export const EPOCA_EXCEL = Date.UTC(1899, 11, 30);
const DIA_MS = 86400000;

export const aSerieDeExcel = (ms: number): number => (ms - EPOCA_EXCEL) / DIA_MS;

/* ── la tabla ───────────────────────────────────────────────────────────────*/

const LISTA: Funcion[] = [
  /* — grado Básico: bloques 14 y 15 — */
  {
    nombre: 'SUMA',
    min: 1,
    max: Infinity,
    firma: 'SUMA(número1, [número2], …)',
    calcular: (args) => {
      const ns = numerosDe(args);
      return Array.isArray(ns) ? suma(ns) : ns;
    },
  },
  {
    nombre: 'PROMEDIO',
    min: 1,
    max: Infinity,
    firma: 'PROMEDIO(número1, [número2], …)',
    calcular: (args) => {
      const ns = numerosDe(args);
      if (!Array.isArray(ns)) return ns;
      // Sin números no hay promedio, y Excel lo dice en vez de callar un 0.
      return ns.length ? suma(ns) / ns.length : err('#¡DIV/0!');
    },
  },
  {
    nombre: 'MAX',
    min: 1,
    max: Infinity,
    firma: 'MAX(número1, [número2], …)',
    calcular: (args) => {
      const ns = numerosDe(args);
      if (!Array.isArray(ns)) return ns;
      return ns.length ? Math.max(...ns) : 0;
    },
  },
  {
    nombre: 'MIN',
    min: 1,
    max: Infinity,
    firma: 'MIN(número1, [número2], …)',
    calcular: (args) => {
      const ns = numerosDe(args);
      if (!Array.isArray(ns)) return ns;
      return ns.length ? Math.min(...ns) : 0;
    },
  },
  {
    nombre: 'CONTAR',
    min: 1,
    max: Infinity,
    firma: 'CONTAR(valor1, [valor2], …)',
    contagia: false,
    calcular: (args) => {
      let n = 0;
      for (const a of args) for (const v of a.valores) if (typeof v === 'number') n += 1;
      return n;
    },
  },
  {
    nombre: 'CONTARA',
    min: 1,
    max: Infinity,
    firma: 'CONTARA(valor1, [valor2], …)',
    contagia: false,
    calcular: (args) => {
      let n = 0;
      // Cuenta lo que NO está vacío, y un error ocupa sitio: también cuenta.
      for (const a of args) for (const v of a.valores) if (v !== null && v !== '') n += 1;
      return n;
    },
  },
  {
    nombre: 'CONTAR.BLANCO',
    min: 1,
    max: 1,
    firma: 'CONTAR.BLANCO(rango)',
    contagia: false,
    calcular: (args) => {
      let n = 0;
      for (const v of args[0].valores) if (v === null || v === '') n += 1;
      return n;
    },
  },

  /* — grado Intermedio: la decisión (bloques 23, 24 y 25) — */
  {
    nombre: 'SI',
    min: 2,
    max: 3,
    firma: 'SI(prueba, valor_si_verdadero, [valor_si_falso])',
    contagia: false,
    calcular: (args) => {
      const cond = aBooleano(esc(args[0]));
      // Sólo contagia la CONDICIÓN. Una rama rota que no se elige no molesta.
      if (typeof cond !== 'boolean') return cond;
      if (cond) return esc(args[1]);
      return args.length > 2 ? esc(args[2]) : false;
    },
  },
  {
    nombre: 'Y',
    min: 1,
    max: Infinity,
    firma: 'Y(lógico1, [lógico2], …)',
    contagia: false,
    calcular: (args) => {
      let visto = false;
      for (const a of args) {
        for (const v of a.valores) {
          if (v === null && a.esRango) continue;
          const b = aBooleano(v);
          if (typeof b !== 'boolean') return b;
          if (!b) return false;
          visto = true;
        }
      }
      return visto ? true : err('#¡VALOR!');
    },
  },
  {
    nombre: 'O',
    min: 1,
    max: Infinity,
    firma: 'O(lógico1, [lógico2], …)',
    contagia: false,
    calcular: (args) => {
      let visto = false;
      for (const a of args) {
        for (const v of a.valores) {
          if (v === null && a.esRango) continue;
          const b = aBooleano(v);
          if (typeof b !== 'boolean') return b;
          if (b) return true;
          visto = true;
        }
      }
      return visto ? false : err('#¡VALOR!');
    },
  },
  {
    nombre: 'NO',
    min: 1,
    max: 1,
    firma: 'NO(lógico)',
    calcular: (args) => {
      const b = aBooleano(esc(args[0]));
      return typeof b === 'boolean' ? !b : b;
    },
  },
  {
    nombre: 'SUMAR.SI',
    min: 2,
    max: 3,
    firma: 'SUMAR.SI(rango, criterio, [rango_suma])',
    calcular: (args) => {
      const rango = args[0].valores;
      const cumple = comparador(esc(args[1]));
      const aSumar = args[2] ? args[2].valores : rango;
      let total = 0;
      for (let i = 0; i < rango.length; i += 1) {
        if (!cumple(rango[i])) continue;
        const v = aSumar[i];
        if (typeof v === 'number') total += v;
      }
      return total;
    },
  },
  {
    nombre: 'CONTAR.SI',
    min: 2,
    max: 2,
    firma: 'CONTAR.SI(rango, criterio)',
    contagia: false,
    calcular: (args) => {
      const cumple = comparador(esc(args[1]));
      return args[0].valores.filter((v) => cumple(v)).length;
    },
  },
  {
    nombre: 'PROMEDIO.SI',
    min: 2,
    max: 3,
    firma: 'PROMEDIO.SI(rango, criterio, [rango_promedio])',
    calcular: (args) => {
      const rango = args[0].valores;
      const cumple = comparador(esc(args[1]));
      const aPromediar = args[2] ? args[2].valores : rango;
      const ns: number[] = [];
      for (let i = 0; i < rango.length; i += 1) {
        if (!cumple(rango[i])) continue;
        const v = aPromediar[i];
        if (typeof v === 'number') ns.push(v);
      }
      return ns.length ? suma(ns) / ns.length : err('#¡DIV/0!');
    },
  },
  {
    nombre: 'BUSCARX',
    min: 3,
    max: 4,
    firma: 'BUSCARX(buscado, rango_donde_buscar, rango_que_devuelve, [si_no_está])',
    calcular: (args) => {
      const buscado = esc(args[0]);
      const donde = args[1].valores;
      const devuelve = args[2].valores;
      /*
       * Los dos rangos se comparan de alto ANTES de buscar, como hace Excel, y
       * no sobre la marcha. La diferencia no es de estilo: buscar primero y
       * luego indexar da la razón cuando el hallazgo cae en los primeros
       * renglones —donde los dos rangos todavía coinciden— y sólo falla en los
       * últimos. O sea que una hoja mal escrita contestaría bien casi siempre y
       * mal de vez en cuando, que es la peor forma de estar rota.
       *
       * Y el `devuelve[i] ?? null` que había aquí era el defecto de verdad:
       * cuando el índice se salía, contestaba **vacío**. Por la decisión 3 del
       * §46 vacío no es cero, es «no hubo dato» — así que la celda daba una
       * respuesta falsa en voz baja en vez de quejarse. Encontrado el
       * 14-ago-2026 desde el texto de `of-excel-buscarx`, que describía el
       * `#¡VALOR!` de Excel: **el letrero decía la verdad y el motor no**.
       */
      if (donde.length !== devuelve.length) return err('#¡VALOR!');
      for (let i = 0; i < donde.length; i += 1) {
        if (comparar(donde[i], buscado) === 0) return devuelve[i] ?? null;
      }
      // Sin cuarto argumento, Excel dice #N/A. Decirlo es mejor que devolver 0:
      // es literalmente la lección del bloque 48 puesta antes de tiempo.
      return args.length > 3 ? esc(args[3]) : err('#N/A');
    },
  },

  /* — grado Avanzado: mirar el error en vez de taparlo (bloque 48) — */
  {
    nombre: 'SI.ERROR',
    min: 2,
    max: 2,
    firma: 'SI.ERROR(valor, valor_si_error)',
    contagia: false,
    calcular: (args) => {
      const v = esc(args[0]);
      return esError(v) ? esc(args[1]) : v;
    },
  },
  {
    nombre: 'ESERROR',
    min: 1,
    max: 1,
    firma: 'ESERROR(valor)',
    contagia: false,
    calcular: (args) => esError(esc(args[0])),
  },

  /* — texto: bloques 27 y 28 — */
  {
    nombre: 'LARGO',
    min: 1,
    max: 1,
    firma: 'LARGO(texto)',
    calcular: (args) => aTexto(esc(args[0])).length,
  },
  {
    nombre: 'IZQUIERDA',
    min: 1,
    max: 2,
    firma: 'IZQUIERDA(texto, [caracteres])',
    calcular: (args) => {
      const n = args[1] ? aNumero(esc(args[1])) : 1;
      if (typeof n !== 'number') return n;
      if (n < 0) return err('#¡VALOR!');
      return aTexto(esc(args[0])).slice(0, Math.floor(n));
    },
  },
  {
    nombre: 'DERECHA',
    min: 1,
    max: 2,
    firma: 'DERECHA(texto, [caracteres])',
    calcular: (args) => {
      const n = args[1] ? aNumero(esc(args[1])) : 1;
      if (typeof n !== 'number') return n;
      if (n < 0) return err('#¡VALOR!');
      const t = aTexto(esc(args[0]));
      return Math.floor(n) === 0 ? '' : t.slice(-Math.floor(n));
    },
  },
  {
    nombre: 'EXTRAE',
    min: 3,
    max: 3,
    firma: 'EXTRAE(texto, inicio, caracteres)',
    calcular: (args) => {
      const desde = aNumero(esc(args[1]));
      const cuantos = aNumero(esc(args[2]));
      if (typeof desde !== 'number') return desde;
      if (typeof cuantos !== 'number') return cuantos;
      // Excel cuenta desde 1, y desde 0 es un error, no un ajuste silencioso.
      if (desde < 1 || cuantos < 0) return err('#¡VALOR!');
      return aTexto(esc(args[0])).substr(Math.floor(desde) - 1, Math.floor(cuantos));
    },
  },
  {
    nombre: 'MAYUSC',
    min: 1,
    max: 1,
    firma: 'MAYUSC(texto)',
    calcular: (args) => aTexto(esc(args[0])).toUpperCase(),
  },
  {
    nombre: 'MINUSC',
    min: 1,
    max: 1,
    firma: 'MINUSC(texto)',
    calcular: (args) => aTexto(esc(args[0])).toLowerCase(),
  },
  {
    nombre: 'CONCAT',
    min: 1,
    max: Infinity,
    firma: 'CONCAT(texto1, [texto2], …)',
    calcular: (args) => {
      let s = '';
      for (const a of args) for (const v of a.valores) s += aTexto(v);
      return s;
    },
  },
  {
    nombre: 'UNIRCADENAS',
    min: 3,
    max: Infinity,
    firma: 'UNIRCADENAS(separador, ignorar_vacías, texto1, …)',
    calcular: (args) => {
      const sep = aTexto(esc(args[0]));
      const ignorar = aBooleano(esc(args[1]));
      if (typeof ignorar !== 'boolean') return ignorar;
      const trozos: string[] = [];
      for (const a of args.slice(2)) {
        for (const v of a.valores) {
          if (ignorar && (v === null || v === '')) continue;
          trozos.push(aTexto(v));
        }
      }
      return trozos.join(sep);
    },
  },

  /* — número — */
  {
    nombre: 'REDONDEAR',
    min: 2,
    max: 2,
    firma: 'REDONDEAR(número, decimales)',
    calcular: (args) => {
      const n = aNumero(esc(args[0]));
      const d = aNumero(esc(args[1]));
      if (typeof n !== 'number') return n;
      if (typeof d !== 'number') return d;
      const k = 10 ** Math.floor(d);
      // Excel redondea el 0,5 hacia afuera; `Math.round` lo manda hacia arriba
      // y con negativos da otra cosa. Se hace con el valor absoluto y el signo.
      return (Math.sign(n) * Math.round(Math.abs(n) * k + Number.EPSILON)) / k;
    },
  },
  {
    nombre: 'ABS',
    min: 1,
    max: 1,
    firma: 'ABS(número)',
    calcular: (args) => {
      const n = aNumero(esc(args[0]));
      return typeof n === 'number' ? Math.abs(n) : n;
    },
  },
  {
    nombre: 'ENTERO',
    min: 1,
    max: 1,
    firma: 'ENTERO(número)',
    calcular: (args) => {
      const n = aNumero(esc(args[0]));
      return typeof n === 'number' ? Math.floor(n) : n;
    },
  },

  /* — fecha: el reloj llega en el contexto (bloque 29) — */
  {
    nombre: 'HOY',
    min: 0,
    max: 0,
    firma: 'HOY()',
    calcular: (_args, ctx) => Math.floor(aSerieDeExcel(ctx.ahora)),
  },
  {
    nombre: 'AHORA',
    min: 0,
    max: 0,
    firma: 'AHORA()',
    calcular: (_args, ctx) => aSerieDeExcel(ctx.ahora),
  },
];

export const FUNCIONES: Record<string, Funcion> = Object.fromEntries(LISTA.map((f) => [f.nombre, f]));

export const NOMBRES_DE_FUNCION: string[] = LISTA.map((f) => f.nombre);

/**
 * Llama a una función de la tabla, aplicando el contagio y el recuento de
 * argumentos. Es el único sitio del motor que sabe que existe `contagia`.
 */
export function llamar(nombre: string, args: Argumento[], ctx: Contexto): Valor {
  const f = FUNCIONES[nombre];
  // Excel ACEPTA una función que no conoce y enseña #¿NOMBRE? en la celda; no
  // rechaza la fórmula al escribirla. Se copia el comportamiento entero.
  if (!f) return err('#¿NOMBRE?');
  if (args.length < f.min || args.length > f.max) return err('#¡VALOR!');
  if (f.contagia !== false) {
    const e = primerError(args);
    if (e) return e;
  }
  return f.calcular(args, ctx);
}

/** Para la ayuda de la cinta y para `revisar()`: el texto de un número. */
export const comoTexto = textoDeNumero;
