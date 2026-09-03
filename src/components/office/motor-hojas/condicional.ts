/**
 * Tecnia Hojas · `condicional.ts` — el formato condicional (bloque 30, sus
 * barras/escalas/iconos/destacar) y su bloque caro, el 46: la misma idea con
 * una fórmula.
 *
 * Este archivo NO toca el libro. Es el par de `Grafica.tsx`: lee `Hoja.reglas`
 * y el motor, y devuelve **cómo se pinta cada celda** — nunca qué vale. La
 * prueba que lo demuestra es la misma que pide el encargo: aplicar una regla
 * y que la suma no se mueva ni un centavo (`toca: () => []` en `comandos.ts`,
 * las nueve veces).
 *
 * ── QUIÉN GANA CUANDO DOS REGLAS SE PISAN ───────────────────────────────────
 *
 * **La última regla de la lista que toca esa celda, gana — y gana canal por
 * canal, no la regla entera.** Una celda puede tener a la vez una barra de
 * datos (canal `barra`) y, encima, un color de «destacar» (canal `formato`):
 * son capas distintas y conviven. Lo que NO convive es que dos reglas de
 * `escala` compitan por el MISMO canal `formato` en la misma celda: ahí gana
 * la que esté más abajo en `Hoja.reglas`, entera, sin mezclar sus campos con
 * los de la regla que tapó — exactamente la misma disciplina que
 * `formatoNuevo` ya usa para un solo `Formato` (lo último que se aplica es lo
 * que se ve) y la misma metáfora de capas que ordena las gráficas al dibujarse
 * encima unas de otras. Se decidió así y no «se combinan los dos colores»
 * porque mezclar colores es adivinar una intención que nadie escribió; capas
 * que se tapan es lo que el alumno ve en cualquier programa de dibujo.
 *
 * ── EL COSTE, Y CÓMO NO SE PAGA EN CADA TECLA ───────────────────────────────
 *
 * Una regla de `'formula'` sobre 500 celdas son 500 evaluaciones — desplazar
 * el árbol y evaluarlo, una vez por celda (ver `aplicarFormula`). Recalcularlo
 * en cada repintado sería pagarlo por cada movimiento del cursor, así que
 * `decoracionesDeHoja` se cachea por la identidad del **libro**
 * (`motor.libro`), que es inmutable: mientras nadie escriba nada, sigue siendo
 * el mismo objeto y la caché sirve gratis. Escribir en una celda —la única
 * operación que de verdad puede cambiar lo que una regla decide— cambia
 * `motor.libro` a un objeto nuevo (`conCelda`, en `modelo.ts`) y ahí sí se
 * recalcula. Lo que NO cuesta nada es teclear dentro del editor de una celda
 * sin confirmar todavía (`Enter`/`Tab`): ese texto vive en el estado de la
 * ventana, no en el libro, así que ni una tecla de eso llega hasta aquí.
 *
 * **Reserva escrita a propósito**: la caché es del libro entero y no de cada
 * hoja por separado, así que editar la hoja 2 invalida también la caché de
 * las reglas de la hoja 1 aunque no tengan nada que ver. Es más grueso de lo
 * que hace falta, y se aceptó por lo mismo que el `'todo'` de `insertarFila`
 * en `comandos.ts`: más vale una caché que pide de más que una regla de
 * fórmula que mire a otra hoja y se quede con un valor viejo en pantalla.
 */

import {
  aTexto,
  clave,
  desplazar,
  dirAColFila,
  esError,
  hojaDe,
  textoDeNumero,
  type Clave,
  type Formato,
  type Libro,
  type ReglaCondicional,
  type Valor,
} from './modelo';
import { arbolDe, valorDe, valorDeArbol, type Motor } from './formula/calculo';
import { transformarRefs } from './formula/sintaxis';
import { escalaDe } from './Grafica';

/* ── el rango de una regla, leído sin pedirle nada a `comandos.ts` ──────────
 *
 * `comandos.ts` ya tiene `cajaDeTexto`, y sería la reutilización obvia. No se
 * importa de allí a propósito: `comandos.ts` es quien escribe el libro, este
 * archivo es quien lo lee para pintar, y si éste importara de aquél se
 * cerraría un círculo el día que un comando necesite preguntarle algo a una
 * regla ya aplicada. Es la misma reserva, con el mismo motivo, que
 * `Grafica.tsx` escribe sobre `COL_PX`/`FILA_PX`: «que estén en dos sitios es
 * exactamente el tipo de cosa que se separa en silencio», y por eso hay una
 * prueba en `motor-hojas-formato.test.ts` que compara las dos lecturas sobre
 * los mismos textos.
 */
interface RangoDeCeldas {
  c0: number;
  f0: number;
  c1: number;
  f1: number;
}

function rangoDe(texto: string): RangoDeCeldas | null {
  const [a, b] = texto.split(':');
  const p = dirAColFila((a ?? '').trim());
  if (!p) return null;
  if (!b) return { c0: p.col, f0: p.fila, c1: p.col, f1: p.fila };
  const q = dirAColFila(b.trim());
  if (!q) return null;
  return {
    c0: Math.min(p.col, q.col),
    f0: Math.min(p.fila, q.fila),
    c1: Math.max(p.col, q.col),
    f1: Math.max(p.fila, q.fila),
  };
}

/* ── lo que una celda enseña por encima de lo que ya tenía ──────────────────*/

export interface DecoracionCelda {
  /** Se mezcla ENTERO sobre el formato propio de la celda, sólo al pintar. */
  formato?: Formato;
  /** Una barra de datos (bloque 30): dónde empieza y cuánto ocupa, en fracción de la celda. */
  barra?: { desdePct: number; anchoPct: number; color: string };
  /** Un icono de conjunto (bloque 30). */
  icono?: { simbolo: string; color: string };
}

const SIN_REGLAS: ReadonlyMap<Clave, DecoracionCelda> = new Map();

function mezclar(out: Map<Clave, DecoracionCelda>, k: Clave, aporte: DecoracionCelda): void {
  out.set(k, { ...(out.get(k) ?? {}), ...aporte });
}

function puntosNumericos(motor: Motor, hojaId: string, r: RangoDeCeldas): Array<{ col: number; fila: number; valor: number }> {
  const fuera: Array<{ col: number; fila: number; valor: number }> = [];
  for (let f = r.f0; f <= r.f1; f += 1) {
    for (let c = r.c0; c <= r.c1; c += 1) {
      const v = valorDe(motor, hojaId, c, f);
      if (typeof v === 'number' && Number.isFinite(v)) fuera.push({ col: c, fila: f, valor: v });
    }
  }
  return fuera;
}

/* ── barras de datos ─────────────────────────────────────────────────────── */

/** El azul de datos que trae Excel de fábrica, si nadie eligió otro. */
const COLOR_BARRA = '#638EC6';

/**
 * `escalaDe` es la de `Grafica.tsx` (bloque 17), reutilizada tal cual: una
 * barra de datos es la misma cuenta que el eje de una gráfica de columnas —el
 * cero manda si está dentro del rango, y si no, el borde—, así que no hace
 * falta una segunda regla de escala para esto.
 */
function aplicarBarras(motor: Motor, hojaId: string, regla: ReglaCondicional, r: RangoDeCeldas, out: Map<Clave, DecoracionCelda>): void {
  const puntos = puntosNumericos(motor, hojaId, r);
  if (!puntos.length) return;
  const { min, max } = escalaDe(puntos.map((p) => p.valor));
  const ancho = max - min;
  if (ancho <= 0) return;
  const color = regla.color ?? COLOR_BARRA;
  const cero = (0 - min) / ancho;
  for (const p of puntos) {
    const t = (p.valor - min) / ancho;
    const desdePct = Math.min(cero, t);
    const anchoPct = Math.abs(t - cero);
    if (anchoPct <= 0) continue;
    mezclar(out, clave(hojaId, p.col, p.fila), { barra: { desdePct, anchoPct, color } });
  }
}

/* ── escala de color ─────────────────────────────────────────────────────── */

const COLOR_ESCALA = '#F8696B'; // el rojo de la escala de 2 colores de Excel

function leerHex(c: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-fA-F]{6})$/.exec(c);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Blanco → `hasta`, lineal. Es la escala «Blanco - Color» del propio Excel. */
function mezclarColor(hasta: string, t: number): string {
  const b = leerHex(hasta);
  if (!b) return hasta;
  const canal = (fin: number) => Math.round(255 + (fin - 255) * t);
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(canal(b.r))}${hex(canal(b.g))}${hex(canal(b.b))}`;
}

function aplicarEscala(motor: Motor, hojaId: string, regla: ReglaCondicional, r: RangoDeCeldas, out: Map<Clave, DecoracionCelda>): void {
  const puntos = puntosNumericos(motor, hojaId, r);
  if (!puntos.length) return;
  let dMin = Infinity;
  let dMax = -Infinity;
  for (const p of puntos) {
    if (p.valor < dMin) dMin = p.valor;
    if (p.valor > dMax) dMax = p.valor;
  }
  const destino = regla.color ?? COLOR_ESCALA;
  for (const p of puntos) {
    const t = dMax > dMin ? (p.valor - dMin) / (dMax - dMin) : 1;
    mezclar(out, clave(hojaId, p.col, p.fila), { formato: { tipo: 'general', colorRelleno: mezclarColor(destino, t) } });
  }
}

/* ── conjunto de iconos ──────────────────────────────────────────────────── */

/**
 * Tres flechas por percentil —33 % y 67 %—, que es el conjunto «3 flechas» de
 * fábrica de Excel. No hay botón para elegir otro conjunto: es el único que
 * pide el bloque 30, y cuando haga falta un segundo, esta función es la que
 * cambia.
 */
function aplicarIconos(motor: Motor, hojaId: string, _regla: ReglaCondicional, r: RangoDeCeldas, out: Map<Clave, DecoracionCelda>): void {
  const puntos = puntosNumericos(motor, hojaId, r);
  if (!puntos.length) return;
  let dMin = Infinity;
  let dMax = -Infinity;
  for (const p of puntos) {
    if (p.valor < dMin) dMin = p.valor;
    if (p.valor > dMax) dMax = p.valor;
  }
  for (const p of puntos) {
    const t = dMax > dMin ? (p.valor - dMin) / (dMax - dMin) : 1;
    const [simbolo, color] = t >= 2 / 3 ? ['▲', '#63BE7B'] : t >= 1 / 3 ? ['➜', '#FFC000'] : ['▼', '#F8696B'];
    mezclar(out, clave(hojaId, p.col, p.fila), { icono: { simbolo, color } });
  }
}

/* ── destacar celdas · mayor, menor, entre, contiene, duplicados ────────────
 *
 * La condición no es una fórmula de Excel: es un predicado compacto que este
 * motor guarda en `ReglaCondicional.formula` y lee él solo — la razón está en
 * `modelo.ts`, junto al campo. `comandos.ts` lo escribe al crear la regla;
 * aquí sólo se lee.
 */

type Predicado =
  | { op: 'mayor'; umbral: number }
  | { op: 'menor'; umbral: number }
  | { op: 'entre'; desde: number; hasta: number }
  | { op: 'contiene'; texto: string }
  | { op: 'duplicados' };

function leerPredicado(codificado: string): Predicado | null {
  const [op, ...resto] = codificado.split('|');
  if (op === 'mayor' || op === 'menor') {
    const umbral = Number(resto[0]);
    return Number.isFinite(umbral) ? { op, umbral } : null;
  }
  if (op === 'entre') {
    const desde = Number(resto[0]);
    const hasta = Number(resto[1]);
    return Number.isFinite(desde) && Number.isFinite(hasta)
      ? { op: 'entre', desde: Math.min(desde, hasta), hasta: Math.max(desde, hasta) }
      : null;
  }
  if (op === 'contiene') {
    const texto = resto.join('|');
    return texto ? { op: 'contiene', texto } : null;
  }
  if (op === 'duplicados') return { op: 'duplicados' };
  return null;
}

function cumple(p: Predicado, v: Valor): boolean {
  switch (p.op) {
    case 'mayor':
      return typeof v === 'number' && v > p.umbral;
    case 'menor':
      return typeof v === 'number' && v < p.umbral;
    case 'entre':
      return typeof v === 'number' && v >= p.desde && v <= p.hasta;
    case 'contiene':
      return v !== null && !esError(v) && aTexto(v).toLowerCase().includes(p.texto.toLowerCase());
    case 'duplicados':
      return false; // se resuelve aparte: hace falta el rango entero, no una celda
  }
}

/** El «resaltado» clásico de Excel: fondo rosa, letra roja. */
const FORMATO_DESTACAR: Formato = { tipo: 'general', colorRelleno: '#FFC7CE', colorLetra: '#9C0006' };

function aplicarDestacar(motor: Motor, hojaId: string, regla: ReglaCondicional, r: RangoDeCeldas, out: Map<Clave, DecoracionCelda>): void {
  const predicado = leerPredicado(regla.formula ?? '');
  if (!predicado) return;
  const formato = regla.formato ?? FORMATO_DESTACAR;

  if (predicado.op === 'duplicados') {
    // Hace falta el rango ENTERO antes de poder decidir por una celda sola:
    // «duplicado» es una pregunta sobre el conjunto, no sobre un valor suelto.
    const cuenta = new Map<string, number>();
    const llavePorCelda = new Map<Clave, string>();
    for (let f = r.f0; f <= r.f1; f += 1) {
      for (let c = r.c0; c <= r.c1; c += 1) {
        const v = valorDe(motor, hojaId, c, f);
        if (v === null || v === '') continue; // las vacías no son duplicadas entre sí
        const llave = typeof v === 'number' ? `n:${textoDeNumero(v)}` : `t:${aTexto(v).toLowerCase()}`;
        cuenta.set(llave, (cuenta.get(llave) ?? 0) + 1);
        llavePorCelda.set(clave(hojaId, c, f), llave);
      }
    }
    for (const [k, llave] of llavePorCelda) {
      if ((cuenta.get(llave) ?? 0) > 1) mezclar(out, k, { formato });
    }
    return;
  }

  for (let f = r.f0; f <= r.f1; f += 1) {
    for (let c = r.c0; c <= r.c1; c += 1) {
      if (cumple(predicado, valorDe(motor, hojaId, c, f))) mezclar(out, clave(hojaId, c, f), { formato });
    }
  }
}

/* ── formato condicional CON FÓRMULA · bloque 46 ─────────────────────────── */

/**
 * La fórmula se ancla en la esquina superior izquierda del rango —`A4` en
 * `A4:D20`— y se desplaza una vez por celda con `desplazar()` (`modelo.ts`) y
 * `transformarRefs()` (`sintaxis.ts`), exactamente como se desplaza al
 * arrastrar el cuadrito de relleno (`desplazarCrudo`, en `comandos.ts`).
 * `arbolDe` está cacheado por el propio motor, así que analizar la fórmula
 * cuesta una vez y no 500.
 *
 * Si una celda da otra cosa que no sea `true` —un número, un error, un
 * `#¡REF!` porque el desplazamiento se salió de la hoja—, esa celda **no
 * recibe la regla y no se avisa aquí**: el aviso ya se dio al crearla
 * (`revisar` del comando `regla-formula`, en `comandos.ts`), que es el sitio
 * donde el alumno puede leerlo. Aplicarla célula por célula «por si acaso»
 * es justo lo que el encargo prohíbe.
 */
function aplicarFormula(motor: Motor, hojaId: string, regla: ReglaCondicional, r: RangoDeCeldas, out: Map<Clave, DecoracionCelda>): void {
  if (!regla.formula) return;
  const a = arbolDe(motor, regla.formula);
  if (!a.ok) return;
  const formato = regla.formato ?? FORMATO_DESTACAR;
  for (let f = r.f0; f <= r.f1; f += 1) {
    for (let c = r.c0; c <= r.c1; c += 1) {
      const dCol = c - r.c0;
      const dFila = f - r.f0;
      const arbol = dCol === 0 && dFila === 0 ? a.arbol : transformarRefs(a.arbol, (ref) => desplazar(ref, dCol, dFila));
      const v = valorDeArbol(motor, arbol, hojaId);
      if (v === true) mezclar(out, clave(hojaId, c, f), { formato });
    }
  }
}

/* ── el punto de entrada, con su caché ───────────────────────────────────── */

const CACHE = new WeakMap<Libro, Map<string, Map<Clave, DecoracionCelda>>>();

/** Cómo se pinta cada celda de la hoja por encima de su propio formato. */
export function decoracionesDeHoja(motor: Motor, hojaId: string): ReadonlyMap<Clave, DecoracionCelda> {
  const hoja = hojaDe(motor.libro, hojaId);
  const reglas = hoja?.reglas;
  if (!hoja || !reglas || reglas.length === 0) return SIN_REGLAS;

  let porHoja = CACHE.get(motor.libro);
  if (!porHoja) {
    porHoja = new Map();
    CACHE.set(motor.libro, porHoja);
  }
  const cacheada = porHoja.get(hojaId);
  if (cacheada) return cacheada;

  const out = new Map<Clave, DecoracionCelda>();
  for (const regla of reglas) {
    const r = rangoDe(regla.rango);
    if (!r) continue;
    if (regla.clase === 'barras') aplicarBarras(motor, hojaId, regla, r, out);
    else if (regla.clase === 'escala') aplicarEscala(motor, hojaId, regla, r, out);
    else if (regla.clase === 'iconos') aplicarIconos(motor, hojaId, regla, r, out);
    else if (regla.clase === 'destacar') aplicarDestacar(motor, hojaId, regla, r, out);
    else if (regla.clase === 'formula') aplicarFormula(motor, hojaId, regla, r, out);
  }
  porHoja.set(hojaId, out);
  return out;
}

/** La decoración de una celda sola. Atajo para la ventana y para las pruebas. */
export function decoracionDeCelda(motor: Motor, hojaId: string, col: number, fila: number): DecoracionCelda | null {
  return decoracionesDeHoja(motor, hojaId).get(clave(hojaId, col, fila)) ?? null;
}

/*
 * **No hay un `textoDeDestacar` exportado aquí para que `comandos.ts` lo
 * use**, aunque sería la reutilización obvia con `leerPredicado` de arriba:
 * `comandos.ts` no importa nada de este archivo, a propósito. `Grafica.tsx`
 * importa `cajaDeTexto` de `comandos.ts`, y este archivo importa `escalaDe`
 * de `Grafica.tsx` — así que si `comandos.ts` importara de aquí se cerraría
 * un círculo de tres (`comandos → condicional → Grafica → comandos`). El
 * comando `regla-destacar` escribe su propio predicado —seis líneas, sin
 * dependencia nueva— y este archivo sólo lo lee con `leerPredicado`. Es la
 * misma reserva que ya explica `rangoDe` arriba.
 */

/** Sólo para la prueba que compara este `rangoDe` con `cajaDeTexto` de `comandos.ts`. */
export { rangoDe as rangoDeParaPruebas };
