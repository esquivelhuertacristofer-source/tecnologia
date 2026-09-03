/**
 * Tecnia Datos · `lexico.ts` — de `"SELECT * FROM alumnos"` a fichas.
 *
 * Segunda de las siete piezas. No entiende nada: parte el texto en trozos con
 * nombre y les pone **línea y columna**, que es lo que luego permite señalar
 * con el dedo la palabra exacta que está mal. Todo lo que decide qué significa
 * está en `sintaxis.ts` y en `motor.ts`.
 *
 * Igual que `formula/lexico.ts`: **este archivo no lanza**. Devuelve dónde se
 * atascó, porque escribir mal es la mitad de la clase.
 *
 * ── Tres decisiones de fidelidad, y por qué ─────────────────────────────────
 *
 * **(A) El texto va entre comillas simples, y las dobles son un error que se
 * explica.** En SQL estándar `"Ana"` no es el texto Ana: es el nombre de una
 * columna llamada Ana. Un motor de verdad contesta «no such column: Ana» y ahí
 * se va media clase. Aquí se detecta al leer y se dice qué hacer. Dentro de un
 * texto, una comilla se escribe duplicándola (`'D''Angelo'`), que es SQL de
 * verdad y además lo mismo que hace el lexer de fórmulas con `""`.
 *
 * **(B) Las palabras clave no distinguen mayúsculas, y los nombres tampoco.**
 * `select`, `Select` y `SELECT` son la misma palabra en cualquier motor. Se
 * guarda el texto tal como se escribió —para poder repintar la consulta sin
 * perder nada— y también en mayúsculas, que es con lo que decide el analizador.
 *
 * **(C) Los comentarios son `--` hasta el final de la línea.** Un guion de SQL
 * de veinte instrucciones sin comentarios no se puede leer, y
 * `n10-modela-tus-datos` es exactamente eso: un guion largo. Se guardan como
 * espacio en blanco, no como ficha: nadie los necesita después.
 */

import { fallo, Tropiezo, type ErrorSQL } from './errores';

export type TipoFicha =
  | 'numero'
  | 'texto'
  | 'nombre'
  | 'operador'
  | 'coma'
  | 'punto'
  | 'abre'
  | 'cierra'
  | 'puntoYComa'
  | 'fin';

export interface Ficha {
  tipo: TipoFicha;
  /** El texto tal cual venía. */
  texto: string;
  /** El mismo texto en mayúsculas, que es con lo que se compara. */
  alto: string;
  /** 1 en adelante. */
  linea: number;
  /** 1 en adelante. */
  columna: number;
  numero?: number;
  cadena?: string;
}

export type Lectura = { ok: true; fichas: Ficha[] } | { ok: false; error: ErrorSQL };

/** Los de dos caracteres van primero o `<=` se lee como `<` y luego `=`. */
const OPERADORES = ['<>', '<=', '>=', '!=', '=', '<', '>', '+', '-', '*', '/'];

const ES_LETRA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ_]/;
const ES_NOMBRE = /[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ_]/;
const ES_DIGITO = /[0-9]/;

/**
 * El tokenizador de verdad. `recoge` es el array donde se van empujando las
 * fichas —por defecto uno nuevo, pero `leerFichasTolerante` (añadida el
 * 15-ago-2026 para `VentanaDatos`, calcada de la misma que se le añadió hoy a
 * `codigo/lexico.ts` para `VentanaCodigo`) le pasa el suyo para quedarse con
 * lo que se leyó **antes** del tropiezo—. Un error ya no se `return`: se
 * `throw`, y quien llama decide si lo convierte en `{ok:false}` (`analizar`) o
 * si se queda con las fichas a medias (`leerFichasTolerante`). Es exactamente
 * el mismo cambio de forma que `codigo/lexico.ts` documenta en su propio
 * `tokenizar`: no hay lógica nueva, sólo un sitio para recogerla.
 */
function tokenizar(fuente: string, recoge: Ficha[] = []): Ficha[] {
  const texto = fuente.replace(/\r\n?/g, '\n');
  const fichas: Ficha[] = recoge;
  let i = 0;
  let linea = 1;
  let columna = 1;

  const avanzar = (n: number): void => {
    for (let k = 0; k < n; k += 1) {
      if (texto[i] === '\n') {
        linea += 1;
        columna = 1;
      } else {
        columna += 1;
      }
      i += 1;
    }
  };

  const error = (mensaje: string, pista?: string, familia?: string): Tropiezo =>
    fallo('sintaxis', mensaje, { linea, columna, pista, familia });

  while (i < texto.length) {
    const c = texto[i];

    if (c === ' ' || c === '\t' || c === '\n') {
      avanzar(1);
      continue;
    }

    /* ── comentario `-- …` (decisión C) ──────────────────────────────────── */
    if (c === '-' && texto[i + 1] === '-') {
      while (i < texto.length && texto[i] !== '\n') avanzar(1);
      continue;
    }

    /* ── texto entre comillas simples, con `''` dentro (decisión A) ──────── */
    if (c === "'") {
      const l0 = linea;
      const c0 = columna;
      let s = '';
      avanzar(1);
      let cerrada = false;
      while (i < texto.length) {
        if (texto[i] === "'") {
          if (texto[i + 1] === "'") {
            s += "'";
            avanzar(2);
            continue;
          }
          avanzar(1);
          cerrada = true;
          break;
        }
        /* Un salto de línea dentro de un texto casi siempre es una comilla que
         * nadie cerró, no un texto de dos renglones. Se corta aquí para que el
         * dedo señale la comilla que empezó y no el final del guion. */
        if (texto[i] === '\n') break;
        s += texto[i];
        avanzar(1);
      }
      if (!cerrada) {
        throw fallo('sintaxis', 'falta cerrar la comilla', {
          linea: l0,
          columna: c0,
          pista: 'todo texto va entre dos comillas simples: \'Ana\'. Si dentro hay un apóstrofo, se escribe dos veces: \'D\'\'Angelo\'',
          familia: 'unrecognized token',
        });
      }
      fichas.push({ tipo: 'texto', texto: s, alto: s.toUpperCase(), linea: l0, columna: c0, cadena: s });
      continue;
    }

    /* ── comillas dobles: no es texto, es un nombre (decisión A) ─────────── */
    if (c === '"') {
      const fin = texto.indexOf('"', i + 1);
      const dentro = fin > i ? texto.slice(i + 1, fin) : '…';
      throw error(
        'en SQL las comillas dobles no son texto',
        `un texto va entre comillas simples: '${dentro}'. Entre comillas dobles, «${dentro}» sería el nombre de una columna`,
        `no such column: ${dentro}`,
      );
    }

    /* ── número: `12`, `12.5` ────────────────────────────────────────────── */
    if (ES_DIGITO.test(c)) {
      const l0 = linea;
      const c0 = columna;
      const desde = i;
      while (i < texto.length && ES_DIGITO.test(texto[i])) avanzar(1);
      if (texto[i] === '.' && ES_DIGITO.test(texto[i + 1] ?? '')) {
        avanzar(1);
        while (i < texto.length && ES_DIGITO.test(texto[i])) avanzar(1);
      }
      const crudo = texto.slice(desde, i);
      const numero = Number(crudo);
      if (!Number.isFinite(numero)) {
        throw fallo('sintaxis', `«${crudo}» no es un número`, { linea: l0, columna: c0 });
      }
      fichas.push({ tipo: 'numero', texto: crudo, alto: crudo, linea: l0, columna: c0, numero });
      continue;
    }

    /* ── nombre o palabra clave (decisión B) ─────────────────────────────── */
    if (ES_LETRA.test(c)) {
      const l0 = linea;
      const c0 = columna;
      const desde = i;
      while (i < texto.length && ES_NOMBRE.test(texto[i])) avanzar(1);
      const crudo = texto.slice(desde, i);
      fichas.push({ tipo: 'nombre', texto: crudo, alto: crudo.toUpperCase(), linea: l0, columna: c0 });
      continue;
    }

    const simples: Readonly<Record<string, TipoFicha>> = {
      ',': 'coma',
      '.': 'punto',
      '(': 'abre',
      ')': 'cierra',
      ';': 'puntoYComa',
    };
    const simple = simples[c];
    if (simple) {
      fichas.push({ tipo: simple, texto: c, alto: c, linea, columna });
      avanzar(1);
      continue;
    }

    const op = OPERADORES.find((o) => texto.startsWith(o, i));
    if (op) {
      fichas.push({ tipo: 'operador', texto: op, alto: op, linea, columna });
      avanzar(op.length);
      continue;
    }

    throw error(`«${c}» no puede ir en una consulta`);
  }

  fichas.push({ tipo: 'fin', texto: '', alto: '', linea, columna });
  return fichas;
}

export function analizar(fuente: string): Lectura {
  try {
    return { ok: true, fichas: tokenizar(fuente) };
  } catch (e) {
    if (e instanceof Tropiezo) return { ok: false, error: e.detalle };
    throw e;
  }
}

/**
 * Lo mismo, pero **devolviendo las fichas que sí se pudieron leer** antes del
 * tropiezo (añadida el 15-ago-2026 para `VentanaDatos`, y calcada de
 * `codigo/lexico.ts`, que resolvió el mismo problema el mismo día para
 * `VentanaCodigo`).
 *
 * El coloreado del editor se pinta en cada tecla, y **una consulta a medio
 * escribir casi siempre está mal**: `SELECT * FROM alumn` no tiene ningún
 * problema léxico, pero `WHERE nombre = 'An` sí —la comilla que falta—, y ésa
 * es la mayoría de los fotogramas mientras se teclea un texto. Con `analizar`
 * a secas, en esos fotogramas no hay ni una ficha y el editor se queda gris de
 * golpe. Con ésta, lo escrito hasta el error conserva su color y sólo lo
 * pierde el error para abajo.
 *
 * No hay ninguna lógica nueva: es el mismo `tokenizar`, recogiendo en un array
 * que se ve desde fuera. Sigue habiendo **un solo analizador léxico**, que es
 * la razón de que `leerFichas` (aquí, `analizar`) saliera por la puerta
 * pública en primer lugar: dos analizadores se desincronizan, uno no.
 */
export function leerFichasTolerante(fuente: string): { fichas: Ficha[]; error: ErrorSQL | null } {
  const fichas: Ficha[] = [];
  try {
    tokenizar(fuente, fichas);
    return { fichas, error: null };
  } catch (e) {
    if (e instanceof Tropiezo) return { fichas, error: e.detalle };
    throw e;
  }
}
