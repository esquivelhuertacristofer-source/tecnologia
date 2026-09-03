/**
 * Tecnia Hojas · `formatos.ts` — el TIPO de la celda: cómo se guarda y cómo se
 * enseña (bloque 6 del temario).
 *
 * Este archivo es medio bloque de clase entero, y conviene decir por qué en vez
 * de dejarlo como «formateo de números». En una hoja de cálculo, **el formato
 * no cambia el dato**: `1500` con formato de moneda se guarda `1500` y se
 * enseña `$1,500.00`, y si se le suma 1 da 1501, no `$1,500.001`. El alumno que
 * no ha entendido eso escribe `$1,500` a mano en la celda, con lo que la celda
 * pasa a contener **texto**, y a partir de ahí ninguna suma le sale. Es el
 * defecto número uno de las hojas de cálculo hechas por principiantes.
 *
 * Por eso hay dos funciones y no una: `mostrar()` —lo que se ve— y la que ya
 * está en `modelo.ts`, `aTexto()` —lo que vale—. Y por eso la alineación por
 * omisión se calcula aquí: **en Excel un número va a la derecha y un texto a la
 * izquierda**, y ésa es la única pista visual que tiene el alumno para saber si
 * lo que escribió es un número de verdad. Es un detalle de pintura que enseña
 * más que un párrafo.
 */

import { aTexto, esError, textoDeNumero, type Formato, type Valor } from './modelo';
import { EPOCA_EXCEL } from './formula/funciones';

const MILES = /\B(?=(\d{3})+(?!\d))/g;

function conMiles(s: string): string {
  const [ent, dec] = s.split('.');
  const signo = ent.startsWith('-') ? '-' : '';
  const cuerpo = signo ? ent.slice(1) : ent;
  return `${signo}${cuerpo.replace(MILES, ',')}${dec ? `.${dec}` : ''}`;
}

/* ── el formato de número personalizado · bloque 45, comando `formato-personalizado` ─
 *
 * Un patrón al estilo Excel, guardado tal cual en `Formato.patron` y **sin
 * tocar el dato**: es el mismo `1500` de la cabecera, sólo que aquí el
 * patrón lo escribe el alumno en vez de elegirlo de una lista, y por eso hay
 * que leerlo con cuidado en vez de aceptarlo a ciegas.
 *
 * Alcance, y ni un carácter más: `#` y `0` (dígito), `,` de miles, `.` de
 * decimales, texto entre comillas, un color entre corchetes al principio de
 * una sección (`[Rojo]`), y hasta tres secciones separadas por `;` —
 * positivo; negativo; cero—. Con eso se enseña el ejemplo que de verdad
 * importa: `#,##0;[Rojo](#,##0)` pinta los negativos en rojo y entre
 * paréntesis sin que el número deje de ser el número.
 *
 * **Lo que NO cubre, a propósito** (queda para quien retome el bloque, no
 * hace falta hoy): un solo grupo de dígitos por sección —no dos separados
 * por texto—, la sección de texto (`;@`) para lo que el alumno escribió a
 * mano, la escala «entre miles» (`#,` al final quita tres ceros), y la
 * diferencia real entre `#` y `0` en los decimales (aquí los dos cuentan
 * igual: cuántos decimales se enseñan).
 */

/** Los colores con nombre que un patrón puede pedir entre corchetes. */
const COLORES_DE_PATRON: Record<string, string> = {
  rojo: '#C00000',
  red: '#C00000',
  verde: '#107C41',
  green: '#107C41',
  azul: '#2F5597',
  blue: '#2F5597',
  negro: '#000000',
  black: '#000000',
  amarillo: '#BF8F00',
  yellow: '#BF8F00',
};

interface SeccionDePatron {
  /** Lo que va ANTES del primer dígito: `"$"`, un signo, un espacio… */
  prefijo: string;
  /** Cuántos `0` trae la parte entera: el mínimo de dígitos que se enseñan. */
  enterosMin: number;
  /** Cuántos `#`/`0` trae la parte decimal. Sin `.` en el patrón, cero. */
  decimales: number;
  /** ¿Había una `,` pegada a los dígitos enteros? Enciende el separador de miles. */
  miles: boolean;
  /** Lo que va DESPUÉS del último dígito: `" kg"`, `")"`, `"%"`… */
  sufijo: string;
  /** El color de `[Rojo]`, si lo pidió. */
  color?: string;
}

type LecturaDePatron = { ok: true; secciones: SeccionDePatron[] } | { ok: false; mensaje: string };

/** Una sección sola, sin el `;` que la separa de las demás. */
function leerSeccion(texto: string): SeccionDePatron | { mensaje: string } {
  let i = 0;
  let color: string | undefined;

  if (texto[0] === '[') {
    const cierre = texto.indexOf(']');
    if (cierre < 0) return { mensaje: 'falta cerrar el color: le falta el «]»' };
    const nombre = texto.slice(1, cierre).trim().toLowerCase();
    const c = COLORES_DE_PATRON[nombre];
    if (!c) return { mensaje: `«${texto.slice(1, cierre)}» no es un color del patrón` };
    color = c;
    i = cierre + 1;
  }

  let prefijo = '';
  let sufijo = '';
  let enEntero = false;
  let enDecimal = false;
  let vioDigitos = false;
  let enterosMin = 0;
  let decimales = 0;
  let miles = false;

  while (i < texto.length) {
    const c = texto[i];
    if (c === '"') {
      const cierre = texto.indexOf('"', i + 1);
      if (cierre < 0) return { mensaje: 'falta cerrar las comillas del texto' };
      const literal = texto.slice(i + 1, cierre);
      if (vioDigitos) sufijo += literal;
      else prefijo += literal;
      i = cierre + 1;
      continue;
    }
    if (c === '#' || c === '0') {
      vioDigitos = true;
      if (enDecimal) decimales += 1;
      else {
        enEntero = true;
        if (c === '0') enterosMin += 1;
      }
      i += 1;
      continue;
    }
    if (c === ',') {
      // Pegada a los dígitos enteros es el separador de miles y no se
      // imprime: es una MARCA, no un carácter. En cualquier otro sitio —antes
      // del primer dígito, o después del punto— es una coma de verdad.
      if (enEntero) miles = true;
      else if (vioDigitos) sufijo += ',';
      else prefijo += ',';
      i += 1;
      continue;
    }
    if (c === '.' && !enDecimal) {
      enDecimal = true;
      enEntero = false;
      i += 1;
      continue;
    }
    if (vioDigitos) sufijo += c;
    else prefijo += c;
    i += 1;
  }

  return { prefijo, enterosMin, decimales, miles, sufijo, color };
}

/**
 * Lee un patrón entero, con sus hasta tres secciones. `null` de `mensaje`
 * significa que pasó; si no, es lo que Excel diría en su cuadro de formato.
 */
export function analizarPatron(patron: string): LecturaDePatron {
  if (patron.trim() === '') return { ok: false, mensaje: 'el patrón no puede estar vacío' };
  const trozos = patron.split(';');
  if (trozos.length > 3) return { ok: false, mensaje: 'un patrón lleva como mucho tres secciones: positivo;negativo;cero' };
  const secciones: SeccionDePatron[] = [];
  for (const trozo of trozos) {
    const s = leerSeccion(trozo);
    if ('mensaje' in s) return { ok: false, mensaje: s.mensaje };
    secciones.push(s);
  }
  return { ok: true, secciones };
}

/** `null` si el patrón pasa; si no, el motivo — para el `revisar` del comando. */
export function motivoPatronInvalido(patron: string): string | null {
  const r = analizarPatron(patron);
  return r.ok ? null : r.mensaje;
}

/** Qué sección le toca a este valor, según cuántas secciones tiene el patrón. */
function seccionDe(secciones: SeccionDePatron[], v: number): { seccion: SeccionDePatron; signoAuto: boolean } {
  if (secciones.length >= 3) {
    return v > 0 ? { seccion: secciones[0], signoAuto: false } : v < 0 ? { seccion: secciones[1], signoAuto: false } : { seccion: secciones[2], signoAuto: false };
  }
  if (secciones.length === 2) {
    // La primera es «positivo y cero», la segunda «negativo» — como en Excel.
    return v < 0 ? { seccion: secciones[1], signoAuto: false } : { seccion: secciones[0], signoAuto: false };
  }
  // Una sola sección: Excel le antepone el signo «-» solo, porque no hay
  // ninguna sección que ya lo diga con paréntesis o con color.
  return { seccion: secciones[0], signoAuto: v < 0 };
}

/** Aplica un patrón ya leído a un número. Nunca lanza: un patrón raro da algo razonable. */
export function aplicarPatron(patron: string, v: number): { texto: string; color?: string } {
  const leido = analizarPatron(patron);
  if (!leido.ok) return { texto: textoDeNumero(v) };
  const { seccion, signoAuto } = seccionDe(leido.secciones, v);
  const abs = Math.abs(v);
  const fijo = Number.isFinite(abs) ? abs.toFixed(seccion.decimales) : '0'.repeat(1 + seccion.decimales);
  const [entero, decimal] = fijo.split('.');
  const conCeros = entero.padStart(seccion.enterosMin, '0');
  // `conMiles` es la misma función que ya usan `numero` y `moneda`: sin `-`
  // ni `.` en `conCeros` —ya son sólo dígitos, en positivo—, hace exactamente
  // lo mismo que un `agruparMiles` aparte habría hecho.
  const enteroFinal = seccion.miles ? conMiles(conCeros) : conCeros;
  const numero = seccion.decimales > 0 ? `${enteroFinal}.${decimal}` : enteroFinal;
  const texto = `${signoAuto ? '-' : ''}${seccion.prefijo}${numero}${seccion.sufijo}`;
  return { texto, color: seccion.color };
}

/** De número de serie de Excel a `dd/mm/aaaa`. Una fecha es un número (bloque 29). */
export function fechaDeSerie(serie: number): string {
  const ms = EPOCA_EXCEL + Math.floor(serie) * 86400000;
  const d = new Date(ms);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

/** Lo que se ve en la celda. Nunca lo que vale: eso es `aTexto()`. */
export function mostrar(v: Valor, formato?: Formato): string {
  if (esError(v)) return v.error;
  if (v === null) return '';
  if (typeof v === 'boolean') return v ? 'VERDADERO' : 'FALSO';
  if (typeof v === 'string') return v;

  const tipo = formato?.tipo ?? 'general';
  const dec = formato?.decimales;

  switch (tipo) {
    case 'numero':
      return conMiles(v.toFixed(dec ?? 2));
    case 'moneda':
      return `${v < 0 ? '-' : ''}$${conMiles(Math.abs(v).toFixed(dec ?? 2))}`;
    case 'porcentaje':
      return `${(v * 100).toFixed(dec ?? 0)}%`;
    case 'fecha':
      return fechaDeSerie(v);
    case 'texto':
      return textoDeNumero(v);
    case 'personalizado':
      // Sin patrón todavía —el comando lo exige, pero un libro viejo o uno
      // tocado a mano puede llegar sin él— se enseña como `general`, nunca
      // en blanco: una celda que no muestra nada es peor que una que muestra
      // el número sin vestir.
      return formato?.patron ? aplicarPatron(formato.patron, v).texto : textoDeNumero(v);
    default:
      return dec === undefined ? textoDeNumero(v) : conMiles(v.toFixed(dec));
  }
}

/**
 * A qué lado se pega el contenido si nadie lo ha alineado a mano.
 *
 * Números y fechas a la derecha, lógicos y errores al centro, texto a la
 * izquierda. Es Excel, y es el chivato del que habla la cabecera.
 */
export function alineacionPorDefecto(v: Valor): 'izquierda' | 'centro' | 'derecha' {
  if (esError(v)) return 'centro';
  if (typeof v === 'boolean') return 'centro';
  if (typeof v === 'number') return 'derecha';
  return 'izquierda';
}

/** Lo que va en la barra de fórmulas de una celda vacía o no: siempre su crudo. */
export const enLaBarra = (crudo: string): string => crudo;

/**
 * Para el banco y para la ventana: el texto que se ve, con el formato puesto.
 *
 * `colorPatron` sólo llega con `tipo: 'personalizado'` y una sección con
 * `[Rojo]` puesta — es el `[Rojo](#,##0)` del bloque 45, la mitad del
 * ejemplo que no es texto: la ventana lo aplica ENCIMA de `colorLetra`
 * porque el patrón manda sobre el color de fuente que hubiera, igual que en
 * Excel de verdad.
 */
export function comoSeVe(v: Valor, formato?: Formato): { texto: string; alineacion: string; colorPatron?: string } {
  if (formato?.tipo === 'personalizado' && typeof v === 'number' && formato.patron) {
    const r = aplicarPatron(formato.patron, v);
    return { texto: r.texto, alineacion: formato.alineacion ?? 'derecha', colorPatron: r.color };
  }
  return {
    texto: mostrar(v, formato),
    alineacion: formato?.alineacion ?? alineacionPorDefecto(v),
  };
}

export { aTexto };
