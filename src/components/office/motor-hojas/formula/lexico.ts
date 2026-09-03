/**
 * Tecnia Hojas · `formula/lexico.ts` — de `"=SUMA(A1:A9)*2"` a fichas.
 *
 * Primera de las cuatro piezas de `formula/` (§45.5). No entiende nada: sólo
 * parte el texto en trozos con nombre. Todo lo que decide *qué significa* está
 * en `sintaxis.ts` y en `calculo.ts`.
 *
 * ── Tres decisiones de fidelidad, y por qué ─────────────────────────────────
 *
 * **(A) El separador de argumentos es la coma, y el decimal el punto.** Es la
 * configuración de Excel en México (es-MX), que es donde se da esta clase; en
 * España sería al revés. Se acepta **también** el punto y coma, porque medio
 * internet y la mitad de los libros de texto lo escriben así y un alumno que
 * copia `=SI(A1>10;"sí";"no")` de un tutorial no merece un error de sintaxis.
 * Lo que NO se acepta nunca es la coma como decimal: sería ambigua dentro de
 * una llamada, y la ambigüedad en un motor de fórmulas se paga en clases que no
 * se pueden corregir.
 *
 * **(B) `LOG10` es una función y `A1` es una referencia, y las dos se escriben
 * igual.** La regla es la de Excel: un nombre que *parece* referencia y viene
 * seguido de un paréntesis es una función. Sin esta regla, `LOG10(100)` se lee
 * como la celda LOG10 y la fórmula da un número que nadie sabe de dónde salió.
 *
 * **(C) Los códigos de error se pueden escribir.** `=#N/A` es válido en Excel y
 * aquí también, porque la clase 48 —«no se tapa un error sin haberlo mirado»—
 * necesita poder poner un error a mano en una celda para enseñar qué hace
 * `SI.ERROR` con él.
 *
 * Y una regla de casa: **este archivo no lanza**. Devuelve `{ok:false}` con el
 * sitio exacto donde se atascó. Un motor que lanza al leer no puede enseñar a
 * escribir fórmulas, porque escribir fórmulas mal es la mitad de la clase.
 */

import { COLUMNAS, FILAS, columnaDeLetra, type CodigoError, type Ref } from '../modelo';

export type TipoFicha =
  | 'numero'
  | 'texto'
  | 'booleano'
  | 'ref'
  | 'nombre'
  | 'operador'
  | 'abre'
  | 'cierra'
  | 'separador'
  | 'dosPuntos'
  | 'porcentaje'
  | 'error';

export interface Ficha {
  tipo: TipoFicha;
  /** El texto tal cual venía, para poder repintar la fórmula sin perder nada. */
  texto: string;
  /** Dónde empieza dentro del cuerpo, para señalar el fallo con el dedo. */
  desde: number;
  numero?: number;
  cadena?: string;
  booleano?: boolean;
  ref?: Ref;
  codigo?: CodigoError;
}

export type Lectura = { ok: true; fichas: Ficha[] } | { ok: false; mensaje: string; pos: number };

/** ¿Esto que escribió el alumno es una fórmula o es un dato? */
export function esFormula(crudo: string): boolean {
  return crudo.startsWith('=') && crudo.length > 1;
}

/** `"=SUMA(A1)"` → `"SUMA(A1)"`. Lo que se analiza es siempre el cuerpo. */
export function cuerpoDeFormula(crudo: string): string {
  return crudo.startsWith('=') ? crudo.slice(1) : crudo;
}

const CODIGOS: CodigoError[] = ['#¡DIV/0!', '#¿NOMBRE?', '#¡VALOR!', '#¡REF!', '#N/A', '#¡NUM!', '#¡NULO!'];

/** Los de dos caracteres van primero o `<=` se lee como `<` y luego `=`. */
const OPERADORES = ['<>', '<=', '>=', '+', '-', '*', '/', '^', '&', '=', '<', '>'];

const ES_LETRA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ_]/;
const ES_NOMBRE = /[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ_.]/;
const ES_DIGITO = /[0-9]/;

/**
 * ¿Este nombre es en realidad una dirección de celda?
 *
 * Devuelve la referencia con sus `$` puestos, o `null`. `$A$1`, `A$1`, `XFD1` y
 * `A1048576` sí; `SUMA`, `A0`, `ZZZZ1` y `A1048577` no — los dos últimos porque
 * se salen de la rejilla, y una referencia fuera de la rejilla no es una
 * referencia rara: no es una referencia.
 */
export function refDeTexto(texto: string, hoja: string | null = null): Ref | null {
  const m = /^(\$?)([A-Za-z]{1,3})(\$?)([0-9]{1,7})$/.exec(texto);
  if (!m) return null;
  const col = columnaDeLetra(m[2]);
  const fila = Number(m[4]) - 1;
  if (col < 0 || col >= COLUMNAS || fila < 0 || fila >= FILAS) return null;
  return { hoja, col, fila, colAbs: m[1] === '$', filaAbs: m[3] === '$' };
}

export function analizar(cuerpo: string): Lectura {
  const fichas: Ficha[] = [];
  let i = 0;

  const fallo = (mensaje: string, pos: number): Lectura => ({ ok: false, mensaje, pos });

  while (i < cuerpo.length) {
    const c = cuerpo[i];

    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i += 1;
      continue;
    }

    /* ── un código de error escrito a mano: `#N/A` ───────────────────────── */
    if (c === '#') {
      const codigo = CODIGOS.find((k) => cuerpo.startsWith(k, i));
      if (!codigo) return fallo('ese código de error no existe', i);
      fichas.push({ tipo: 'error', texto: codigo, desde: i, codigo });
      i += codigo.length;
      continue;
    }

    /* ── texto entre comillas, con `""` para meter una comilla ───────────── */
    if (c === '"') {
      const desde = i;
      let s = '';
      i += 1;
      let cerrada = false;
      while (i < cuerpo.length) {
        if (cuerpo[i] === '"') {
          if (cuerpo[i + 1] === '"') {
            s += '"';
            i += 2;
            continue;
          }
          i += 1;
          cerrada = true;
          break;
        }
        s += cuerpo[i];
        i += 1;
      }
      if (!cerrada) return fallo('falta cerrar las comillas', desde);
      fichas.push({ tipo: 'texto', texto: cuerpo.slice(desde, i), desde, cadena: s });
      continue;
    }

    /* ── número: `12`, `12.5`, `.5`, `1.2e-3` ────────────────────────────── */
    if (ES_DIGITO.test(c) || (c === '.' && ES_DIGITO.test(cuerpo[i + 1] ?? ''))) {
      const desde = i;
      while (i < cuerpo.length && ES_DIGITO.test(cuerpo[i])) i += 1;
      if (cuerpo[i] === '.') {
        i += 1;
        while (i < cuerpo.length && ES_DIGITO.test(cuerpo[i])) i += 1;
      }
      if ((cuerpo[i] === 'e' || cuerpo[i] === 'E') && /[0-9+-]/.test(cuerpo[i + 1] ?? '')) {
        i += 2;
        while (i < cuerpo.length && ES_DIGITO.test(cuerpo[i])) i += 1;
      }
      const texto = cuerpo.slice(desde, i);
      const numero = Number(texto);
      if (!Number.isFinite(numero)) return fallo(`«${texto}» no es un número`, desde);
      fichas.push({ tipo: 'numero', texto, desde, numero });
      continue;
    }

    /* ── nombre de hoja entre comillas simples: `'Mi Hoja'!A1` ───────────── */
    if (c === "'") {
      const desde = i;
      let nombre = '';
      i += 1;
      let cerrada = false;
      while (i < cuerpo.length) {
        if (cuerpo[i] === "'") {
          if (cuerpo[i + 1] === "'") {
            nombre += "'";
            i += 2;
            continue;
          }
          i += 1;
          cerrada = true;
          break;
        }
        nombre += cuerpo[i];
        i += 1;
      }
      if (!cerrada) return fallo('falta cerrar la comilla del nombre de la hoja', desde);
      if (cuerpo[i] !== '!') return fallo('después del nombre de una hoja va un «!»', i);
      i += 1;
      const leida = leerRefTrasHoja(cuerpo, i, nombre, desde);
      if ('mensaje' in leida) return fallo(leida.mensaje, leida.pos);
      fichas.push(leida.ficha);
      i = leida.hasta;
      continue;
    }

    /* ── referencia, hoja!referencia, nombre o función ───────────────────── */
    if (ES_LETRA.test(c) || c === '$') {
      const desde = i;
      while (i < cuerpo.length && (ES_NOMBRE.test(cuerpo[i]) || cuerpo[i] === '$')) i += 1;
      const texto = cuerpo.slice(desde, i);

      if (cuerpo[i] === '!') {
        if (texto.includes('$')) return fallo('el nombre de una hoja no lleva «$»', desde);
        i += 1;
        const leida = leerRefTrasHoja(cuerpo, i, texto, desde);
        if ('mensaje' in leida) return fallo(leida.mensaje, leida.pos);
        fichas.push(leida.ficha);
        i = leida.hasta;
        continue;
      }

      const alto = texto.toUpperCase();
      if (alto === 'VERDADERO' || alto === 'FALSO') {
        fichas.push({ tipo: 'booleano', texto, desde, booleano: alto === 'VERDADERO' });
        continue;
      }

      /* Decisión (B): parece referencia y no la sigue un paréntesis → lo es. */
      const r = refDeTexto(texto);
      const abrePronto = /^\s*\(/.test(cuerpo.slice(i));
      if (r && !abrePronto) {
        fichas.push({ tipo: 'ref', texto, desde, ref: r });
        continue;
      }

      fichas.push({ tipo: 'nombre', texto, desde });
      continue;
    }

    if (c === '(') {
      fichas.push({ tipo: 'abre', texto: c, desde: i });
      i += 1;
      continue;
    }
    if (c === ')') {
      fichas.push({ tipo: 'cierra', texto: c, desde: i });
      i += 1;
      continue;
    }
    if (c === ',' || c === ';') {
      fichas.push({ tipo: 'separador', texto: c, desde: i });
      i += 1;
      continue;
    }
    if (c === ':') {
      fichas.push({ tipo: 'dosPuntos', texto: c, desde: i });
      i += 1;
      continue;
    }
    if (c === '%') {
      fichas.push({ tipo: 'porcentaje', texto: c, desde: i });
      i += 1;
      continue;
    }

    const op = OPERADORES.find((o) => cuerpo.startsWith(o, i));
    if (op) {
      fichas.push({ tipo: 'operador', texto: op, desde: i });
      i += op.length;
      continue;
    }

    return fallo(`«${c}» no puede ir en una fórmula`, i);
  }

  return { ok: true, fichas };
}

/** Lo que va detrás de `Hoja2!`: tiene que ser una referencia y nada más. */
function leerRefTrasHoja(
  cuerpo: string,
  i: number,
  hoja: string,
  desde: number,
): { ficha: Ficha; hasta: number } | { mensaje: string; pos: number } {
  let j = i;
  while (j < cuerpo.length && (/[A-Za-z0-9]/.test(cuerpo[j]) || cuerpo[j] === '$')) j += 1;
  const texto = cuerpo.slice(i, j);
  const r = refDeTexto(texto, hoja);
  if (!r) return { mensaje: `«${hoja}!${texto}» no es una celda de esa hoja`, pos: i };
  return { ficha: { tipo: 'ref', texto: `${hoja}!${texto}`, desde, ref: r }, hasta: j };
}
