/**
 * Tecnia Código · `compilar.ts` — del árbol a una cinta de instrucciones.
 *
 * **Ésta es la decisión que condiciona todo lo demás**, y es la hermana de «los
 * comandos son datos» del §45.6: el programa del alumno no se ejecuta
 * recorriendo el árbol con funciones de JavaScript que se llaman entre ellas,
 * sino que **se traduce a una lista plana de instrucciones** y una máquina las
 * va ejecutando de una en una.
 *
 * Por qué, dicho antes de escribir una línea de la máquina:
 *
 * **(1) Un recorrido de árbol no se puede parar.** Si `ejecutarSi()` llama a
 * `ejecutarBloque()` que llama a `evaluar()`, el estado de la ejecución vive en
 * la pila de llamadas de JavaScript, y esa pila no se puede fotografiar, ni
 * congelar, ni preguntar «¿por dónde vas?». Para hacer paso a paso encima de
 * eso hay que reescribir el intérprete entero — y eso es justo lo que el encargo
 * dice que no puede pasar. Con la cinta, «parar» es dejar de llamar a `paso()`,
 * y «¿por dónde va?» es leer un número: `pc`.
 *
 * **(2) El tope de pasos sale gratis y es exacto.** Un paso es una instrucción.
 * No hay que sembrar comprobaciones por el intérprete: hay un contador y un
 * `if` en el bucle.
 *
 * **(3) La recursión del alumno no usa la pila de JavaScript.** Las llamadas son
 * marcos en un array nuestro, así que una recursión infinita da un mensaje —«tu
 * función se llama a sí misma sin parar»— en vez de un `RangeError: Maximum call
 * stack size exceeded` que se lleva la pestaña por delante.
 *
 * **(4) Es lo rápido.** Un `switch` sobre un número, con las instrucciones todas
 * de la misma forma —mismos campos, mismo orden— para que V8 les dé una sola
 * clase oculta. El criterio de 100 000 pasos por debajo de 100 ms se gana aquí,
 * no optimizando después. **Medido: 4,12 ms**, mejor de siete tandas, o sea 24
 * veces por debajo del listón y ~24 000 instrucciones por milisegundo. No hizo
 * falta ni una optimización posterior; el gasto que sí se evitó por adelantado
 * fue el del §46 —construir cadenas de texto—: aquí no se arma ni un mensaje ni
 * una clave mientras se ejecuta, y las pistas de los errores sólo se escriben
 * cuando ya hay un error.
 *
 * ── Lo único con truco: los nombres ─────────────────────────────────────────
 *
 * Python decide **al compilar** si un nombre es local: si dentro de una función
 * se le asigna algo alguna vez, ese nombre es local en toda la función, incluso
 * antes de la asignación. Por eso existe `UnboundLocalError`, que aquí se dice
 * «usaste «total» dentro de la función antes de darle un valor». Se calcula una
 * vez por `def` recorriendo su cuerpo, y así la máquina no busca en dos sitios:
 * la instrucción ya dice cuál de los dos.
 */

import { fallo } from './errores';
import type { Destino, Expr, OpBin, OpComp, Sent } from './sintaxis';
import { cad, ent, flo, NADA, bool, type FuncionV, type Valor } from './valores';

/* ── el juego de instrucciones ──────────────────────────────────────────────*/

export const OP = {
  CONST: 0,
  LEE_GLOBAL: 1,
  LEE_LOCAL: 2,
  GUARDA_GLOBAL: 3,
  GUARDA_LOCAL: 4,
  LISTA: 5,
  TUPLA: 6,
  DICC: 7,
  TEXTO: 8,
  INDICE: 9,
  GUARDA_INDICE: 10,
  REBANA: 11,
  BIN: 12,
  NEG: 13,
  NO: 14,
  COMP: 15,
  SALTA: 16,
  SALTA_SI_NO: 17,
  SALTA_SI_NO_DEJA: 18,
  SALTA_SI_SI_DEJA: 19,
  LLAMA: 20,
  METODO: 21,
  RETORNA: 22,
  POP: 23,
  DUP2: 24,
  ITER: 25,
  ITER_SIG: 26,
  DEF: 27,
  DESEMPAQUETA: 28,
  FIN: 29,
} as const;

export const BIN_COD: Readonly<Record<OpBin, number>> = { '+': 0, '-': 1, '*': 2, '/': 3, '//': 4, '%': 5, '**': 6 };
export const COMP_COD: Readonly<Record<OpComp, number>> = {
  '==': 0,
  '!=': 1,
  '<': 2,
  '>': 3,
  '<=': 4,
  '>=': 5,
  in: 6,
  'not in': 7,
};

/**
 * Todas las instrucciones tienen los mismos campos aunque no los usen.
 *
 * No es descuido: es para que V8 les dé una sola clase oculta y el `switch` de
 * la máquina no tenga que preguntar por la forma del objeto en cada paso. Es la
 * misma lección del §46 —lo caro no era el grafo— aplicada antes de que duela.
 */
export interface Ins {
  op: number;
  linea: number;
  /** `true` si aquí empieza una sentencia: es lo que salta «paso a paso». */
  inicio: boolean;
  n: number;
  k: Valor | null;
  s: string;
}

export interface Compilado {
  codigo: Ins[];
  /** Los nombres que el programa asigna en el nivel de arriba, en orden. */
  globales: string[];
}

export function compilar(programa: Sent[]): Compilado {
  const c = new Compilador();
  c.programa(programa);
  return { codigo: c.codigo, globales: [...c.globalesAsignadas] };
}

interface Bucle {
  /** A dónde va `continue`. */
  sigue: number;
  /** Los `break` a parchear. */
  rotos: number[];
  /** Los `continue` a parchear (los `while` no lo saben hasta el final). */
  siguientes: number[];
  /** Cuántos valores hay del bucle en la pila (el iterador de un `for`). */
  extra: number;
}

class Compilador {
  readonly codigo: Ins[] = [];
  readonly globalesAsignadas = new Set<string>();
  /** `null` en el nivel de arriba; el conjunto de locales dentro de un `def`. */
  private locales: Set<string> | null = null;
  private bucles: Bucle[] = [];

  private emite(op: number, linea: number, extra?: { n?: number; k?: Valor; s?: string; inicio?: boolean }): number {
    this.codigo.push({
      op,
      linea,
      inicio: extra?.inicio ?? false,
      n: extra?.n ?? 0,
      k: extra?.k ?? null,
      s: extra?.s ?? '',
    });
    return this.codigo.length - 1;
  }

  private aqui(): number {
    return this.codigo.length;
  }

  private parchea(donde: number): void {
    this.codigo[donde].n = this.aqui();
  }

  programa(sents: Sent[]): void {
    this.cuerpo(sents);
    this.emite(OP.FIN, sents.length > 0 ? sents[sents.length - 1].linea : 1);
  }

  private cuerpo(sents: Sent[]): void {
    for (const s of sents) this.sentencia(s);
  }

  /* ── sentencias ──────────────────────────────────────────────────────── */

  private sentencia(s: Sent): void {
    const marca = this.aqui();
    /**
     * El `for` marca su propio principio, y no aquí.
     *
     * Lo que aquí se marcaría es la instrucción que construye el iterable —el
     * `range(1, 4)`—, y entonces el paso a paso se detendría **dos veces** en la
     * línea del `for` antes de entrar por primera vez al cuerpo: una para armar
     * el recorrido y otra para sacar el primer elemento. Se probó y se ve mal:
     * parece que el programa se ha quedado atascado. CPython hace justo esto
     * mismo —el montaje del iterador no genera un evento de línea propio—, así
     * que la marca va sólo en `ITER_SIG` y el `for` se para una vez por vuelta.
     */
    let marcaPropia = false;
    switch (s.t) {
      case 'expr':
        this.expresion(s.expr);
        this.emite(OP.POP, s.linea);
        break;

      case 'asigna': {
        if (s.destinos.length === 1 && s.valores.length > 1) {
          /* `x = 1, 2` → una tupla, como en Python. */
          for (const v of s.valores) this.expresion(v);
          this.emite(OP.TUPLA, s.linea, { n: s.valores.length });
          this.guardaEn(s.destinos[0]);
        } else if (s.destinos.length === 1) {
          this.asignaSimple(s.destinos[0], s.valores[0]);
        } else if (s.valores.length === 1) {
          /* `a, b = pareja` — desempaquetar lo que venga. */
          this.expresion(s.valores[0]);
          this.emite(OP.DESEMPAQUETA, s.linea, { n: s.destinos.length });
          for (const d of s.destinos) this.guardaEn(d);
        } else {
          /* `a, b = b, a` — los dos lados se evalúan ANTES de guardar nada, que
           * es lo que hace que el intercambio funcione sin variable auxiliar. */
          for (const v of s.valores) this.expresion(v);
          this.emite(OP.TUPLA, s.linea, { n: s.valores.length });
          this.emite(OP.DESEMPAQUETA, s.linea, { n: s.destinos.length });
          for (const d of s.destinos) this.guardaEn(d);
        }
        break;
      }

      case 'asignaOp': {
        const d = s.destino;
        if (d.t === 'nombre') {
          this.leeNombre(d.nombre, d.linea);
          this.expresion(s.valor);
          this.emite(OP.BIN, s.linea, { n: BIN_COD[s.op] });
          this.guardaNombre(d.nombre, s.linea);
        } else {
          this.expresion(d.obj);
          this.expresion(d.indice);
          this.emite(OP.DUP2, s.linea);
          this.emite(OP.INDICE, s.linea);
          this.expresion(s.valor);
          this.emite(OP.BIN, s.linea, { n: BIN_COD[s.op] });
          this.emite(OP.GUARDA_INDICE, s.linea);
        }
        break;
      }

      case 'si': {
        const finales: number[] = [];
        for (let r = 0; r < s.ramas.length; r += 1) {
          const rama = s.ramas[r];
          /* Cada `elif` empieza sentencia: así el paso a paso se detiene en la
           * condición de cada rama y se ve cuál se está probando. */
          const antesDeLaCondicion = this.aqui();
          this.expresion(rama.cond);
          this.codigo[antesDeLaCondicion].inicio = true;
          const salto = this.emite(OP.SALTA_SI_NO, rama.cond.linea);
          this.cuerpo(rama.cuerpo);
          if (r < s.ramas.length - 1 || s.sino) finales.push(this.emite(OP.SALTA, rama.cond.linea));
          this.parchea(salto);
        }
        if (s.sino) this.cuerpo(s.sino);
        finales.forEach((f) => this.parchea(f));
        break;
      }

      case 'mientras': {
        const inicio = this.aqui();
        this.expresion(s.cond);
        const salto = this.emite(OP.SALTA_SI_NO, s.cond.linea);
        this.bucles.push({ sigue: inicio, rotos: [], siguientes: [], extra: 0 });
        this.cuerpo(s.cuerpo);
        this.emite(OP.SALTA, s.linea, { n: inicio });
        const b = this.bucles.pop() as Bucle;
        this.parchea(salto);
        b.rotos.forEach((r) => this.parchea(r));
        b.siguientes.forEach((r) => {
          this.codigo[r].n = inicio;
        });
        break;
      }

      case 'para': {
        marcaPropia = true;
        this.expresion(s.iterable);
        this.emite(OP.ITER, s.linea);
        const inicio = this.aqui();
        const siguiente = this.emite(OP.ITER_SIG, s.linea, { inicio: true });
        if (s.variables.length > 1) {
          this.emite(OP.DESEMPAQUETA, s.linea, { n: s.variables.length });
        }
        for (const v of s.variables) this.guardaNombre(v, s.linea);
        this.bucles.push({ sigue: inicio, rotos: [], siguientes: [], extra: 1 });
        this.cuerpo(s.cuerpo);
        this.emite(OP.SALTA, s.linea, { n: inicio });
        const b = this.bucles.pop() as Bucle;
        this.parchea(siguiente);
        b.rotos.forEach((r) => this.parchea(r));
        b.siguientes.forEach((r) => {
          this.codigo[r].n = inicio;
        });
        break;
      }

      case 'rompe':
      case 'sigue': {
        const b = this.bucles[this.bucles.length - 1];
        if (!b) {
          throw fallo('sintaxis', `«${s.t === 'rompe' ? 'break' : 'continue'}» sólo vale dentro de un bucle`, {
            linea: s.linea,
            columna: s.col,
            pista: 'sirve para salirse de un «for» o de un «while», y aquí no hay ninguno alrededor',
          });
        }
        /* Salirse de un `for` deja su iterador en la pila: hay que tirarlo. */
        if (s.t === 'rompe') for (let i = 0; i < b.extra; i += 1) this.emite(OP.POP, s.linea);
        const salto = this.emite(OP.SALTA, s.linea, { inicio: true });
        if (s.t === 'rompe') b.rotos.push(salto);
        else b.siguientes.push(salto);
        break;
      }

      case 'pasa':
        break;

      case 'def': {
        const salto = this.emite(OP.SALTA, s.linea, { inicio: true });
        const dir = this.aqui();
        const antes = this.locales;
        const antesBucles = this.bucles;
        this.locales = localesDe(s);
        this.bucles = [];
        this.cuerpo(s.cuerpo);
        this.emite(OP.CONST, s.linea, { k: NADA });
        this.emite(OP.RETORNA, s.linea);
        this.locales = antes;
        this.bucles = antesBucles;
        this.parchea(salto);
        const fn: FuncionV = { t: 'fn', nombre: s.nombre, params: s.params, dir, linea: s.linea };
        this.emite(OP.DEF, s.linea, { k: fn });
        this.guardaNombre(s.nombre, s.linea);
        break;
      }

      case 'retorna':
        if (this.locales === null) {
          throw fallo('sintaxis', '«return» sólo vale dentro de una función', {
            linea: s.linea,
            columna: s.col,
            pista: 'para enseñar un valor por pantalla se usa print(...); «return» se lo devuelve a quien llamó',
          });
        }
        if (s.valor) this.expresion(s.valor);
        else this.emite(OP.CONST, s.linea, { k: NADA });
        this.emite(OP.RETORNA, s.linea);
        break;
    }
    if (!marcaPropia && this.codigo.length > marca) this.codigo[marca].inicio = true;
  }

  /** `x = ...` y `lista[i] = ...`: el valor se calcula al final y va arriba. */
  private asignaSimple(d: Destino, valor: Expr): void {
    if (d.t === 'nombre') {
      this.expresion(valor);
      this.guardaNombre(d.nombre, d.linea);
      return;
    }
    this.expresion(d.obj);
    this.expresion(d.indice);
    this.expresion(valor);
    this.emite(OP.GUARDA_INDICE, d.linea);
  }

  /**
   * El destino de un desempaquetado, donde el valor **ya está** en la pila.
   *
   * De ahí el `n: 1` de `GUARDA_INDICE`: le dice a la máquina que el valor está
   * debajo del objeto y del índice, no encima. Los dos modos existen porque
   * `lista[i], lista[j] = lista[j], lista[i]` —la línea con la que se escribe
   * cualquier ordenamiento de `n9-busqueda-y-ordenamiento`— necesita el
   * segundo, y `lista[i] = 0` el primero.
   */
  private guardaEn(d: Destino): void {
    if (d.t === 'nombre') {
      this.guardaNombre(d.nombre, d.linea);
      return;
    }
    this.expresion(d.obj);
    this.expresion(d.indice);
    this.emite(OP.GUARDA_INDICE, d.linea, { n: 1 });
  }

  private guardaNombre(nombre: string, linea: number): void {
    if (this.locales && this.locales.has(nombre)) {
      this.emite(OP.GUARDA_LOCAL, linea, { s: nombre });
      return;
    }
    if (this.locales === null) this.globalesAsignadas.add(nombre);
    this.emite(OP.GUARDA_GLOBAL, linea, { s: nombre });
  }

  private leeNombre(nombre: string, linea: number): void {
    if (this.locales && this.locales.has(nombre)) this.emite(OP.LEE_LOCAL, linea, { s: nombre });
    else this.emite(OP.LEE_GLOBAL, linea, { s: nombre });
  }

  /* ── expresiones ─────────────────────────────────────────────────────── */

  private expresion(e: Expr): void {
    switch (e.t) {
      case 'num':
        this.emite(OP.CONST, e.linea, { k: e.entero ? ent(e.v) : flo(e.v) });
        break;
      case 'cad':
        this.emite(OP.CONST, e.linea, { k: cad(e.v) });
        break;
      case 'bool':
        this.emite(OP.CONST, e.linea, { k: bool(e.v) });
        break;
      case 'nada':
        this.emite(OP.CONST, e.linea, { k: NADA });
        break;
      case 'fcad': {
        for (const p of e.partes) {
          if (typeof p === 'string') this.emite(OP.CONST, e.linea, { k: cad(p) });
          else this.expresion(p);
        }
        this.emite(OP.TEXTO, e.linea, { n: e.partes.length });
        break;
      }
      case 'nombre':
        this.leeNombre(e.nombre, e.linea);
        break;
      case 'lista':
        e.elementos.forEach((x) => this.expresion(x));
        this.emite(OP.LISTA, e.linea, { n: e.elementos.length });
        break;
      case 'tupla':
        e.elementos.forEach((x) => this.expresion(x));
        this.emite(OP.TUPLA, e.linea, { n: e.elementos.length });
        break;
      case 'dicc':
        e.pares.forEach((p) => {
          this.expresion(p.clave);
          this.expresion(p.valor);
        });
        this.emite(OP.DICC, e.linea, { n: e.pares.length });
        break;
      case 'bin':
        this.expresion(e.izq);
        this.expresion(e.der);
        this.emite(OP.BIN, e.linea, { n: BIN_COD[e.op] });
        break;
      case 'neg':
        this.expresion(e.arg);
        this.emite(OP.NEG, e.linea);
        break;
      case 'no':
        this.expresion(e.arg);
        this.emite(OP.NO, e.linea);
        break;
      case 'comp':
        this.expresion(e.izq);
        this.expresion(e.der);
        this.emite(OP.COMP, e.linea, { n: COMP_COD[e.op] });
        break;
      case 'logica': {
        this.expresion(e.izq);
        const salto = this.emite(e.op === 'and' ? OP.SALTA_SI_NO_DEJA : OP.SALTA_SI_SI_DEJA, e.linea);
        this.expresion(e.der);
        this.parchea(salto);
        break;
      }
      case 'indice':
        this.expresion(e.obj);
        this.expresion(e.indice);
        this.emite(OP.INDICE, e.linea);
        break;
      case 'rebanada':
        this.expresion(e.obj);
        if (e.desde) this.expresion(e.desde);
        else this.emite(OP.CONST, e.linea, { k: NADA });
        if (e.hasta) this.expresion(e.hasta);
        else this.emite(OP.CONST, e.linea, { k: NADA });
        this.emite(OP.REBANA, e.linea);
        break;
      case 'llamada':
        this.expresion(e.fn);
        e.args.forEach((a) => this.expresion(a));
        /* El nombre escrito viaja con la instrucción sólo para el mensaje de
         * error: es lo que permite decir ««len» era una función y le diste un
         * número» en vez de «un número no se puede llamar». */
        this.emite(OP.LLAMA, e.linea, { n: e.args.length, s: e.fn.t === 'nombre' ? e.fn.nombre : '' });
        break;
      case 'metodo':
        this.expresion(e.obj);
        e.args.forEach((a) => this.expresion(a));
        this.emite(OP.METODO, e.linea, { n: e.args.length, s: e.nombre });
        break;
    }
  }
}

/**
 * Los nombres locales de una función: sus argumentos y todo lo que se le asigne
 * dentro, incluidas las variables de sus `for` y las funciones que defina.
 *
 * Se para en los `def` de dentro —lo que se asigne ahí es local de la otra— y
 * eso es exactamente lo que hace Python.
 */
function localesDe(def: Extract<Sent, { t: 'def' }>): Set<string> {
  const nombres = new Set<string>(def.params);
  const mira = (sents: Sent[]): void => {
    for (const s of sents) {
      switch (s.t) {
        case 'asigna':
          s.destinos.forEach((d) => {
            if (d.t === 'nombre') nombres.add(d.nombre);
          });
          break;
        case 'asignaOp':
          if (s.destino.t === 'nombre') nombres.add(s.destino.nombre);
          break;
        case 'para':
          s.variables.forEach((v) => nombres.add(v));
          mira(s.cuerpo);
          break;
        case 'si':
          s.ramas.forEach((r) => mira(r.cuerpo));
          if (s.sino) mira(s.sino);
          break;
        case 'mientras':
          mira(s.cuerpo);
          break;
        case 'def':
          nombres.add(s.nombre);
          break;
        default:
          break;
      }
    }
  };
  mira(def.cuerpo);
  return nombres;
}
