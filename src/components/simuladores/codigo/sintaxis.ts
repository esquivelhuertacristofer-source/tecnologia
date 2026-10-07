/**
 * Tecnia Código · `sintaxis.ts` — de fichas a árbol.
 *
 * Descenso recursivo, un nivel por precedencia, igual que `formula/sintaxis.ts`.
 * Lo que aquí es distinto de una calculadora es que hay **sentencias**, y que
 * los bloques se abren y se cierran con las fichas `sangra` / `desangra` que
 * fabricó el léxico. `bloque()` es literalmente «come un `sangra`, lee
 * sentencias hasta el `desangra`».
 *
 * ── Precedencia, de menos a más apretado ───────────────────────────────────
 *
 *   or
 *   and
 *   not x
 *   comparación   ==  !=  <  >  <=  >=  in  not in
 *   suma          +  −
 *   producto      *  /  //  %
 *   unario        −x  +x
 *   potencia      **                      (por la derecha: 2**3**2 = 512)
 *   sufijos       a[i]   a[i:j]   f(x)   a.metodo(x)
 *
 * Ojo con dos que **no** son como en `formula/sintaxis.ts`, y es a propósito:
 * en Python `-2 ** 2` da **−4** (la potencia aprieta más que el menos) y
 * `2 ** 3 ** 2` da **512** (asocia por la derecha). En Excel las dos van al
 * revés. Son dos lenguajes distintos y cada motor copia al suyo; el día que
 * alguien unifique «porque en el otro archivo está al revés» habrá roto uno de
 * los dos.
 *
 * ── Los tres errores que este archivo se toma en serio ─────────────────────
 *
 * 1. **`:` que falta.** `if x > 3` sin dos puntos es el error número uno del
 *    primer día, y merece su frase, no un «no se esperaba nl».
 * 2. **`=` donde iba `==`.** `if x = 3:` es el número dos, y también.
 * 3. **Comparación encadenada.** `0 < x < 10` se lee **como en Python**:
 *    `0 < x and x < 10`, con `x` evaluado una sola vez. Hasta el 12-sep-2026
 *    se detectaba y se rechazaba —leerla como `(0 < x) < 10` habría acertado a
 *    ratos—, pero rechazar Python válido tampoco es neutral: el juez de §68.4
 *    mide sus salidas con CPython, y una solución correcta se habría rechazado
 *    por usar la forma que cualquier libro de Python enseña.
 *
 * Y la palabra prohibida (`class`, `try`…) se caza aquí, con la frase que le
 * toca en `subconjunto.ts`, antes de que llegue a parecer un nombre de variable.
 *
 * ── M4 (§69.21): `import`, `from`, `with` y `modulo.nombre` ─────────────────
 *
 * Hasta el 6-oct-2026 las tres primeras eran palabras prohibidas y el punto
 * exigía paréntesis detrás. Ahora `import x [as y]`, `from x import a [as b]`,
 * `with expr as f:` y `x.nombre` sin llamar son sentencias y expresiones de
 * verdad. Qué módulos existen y qué traen lo decide la máquina al ejecutar, no
 * esto: aquí sólo se decide si está bien escrito, y los dos errores de escritura
 * que de verdad se cometen tienen su frase — `import clima.py` y `from x import *`.
 */

import { type ErrorPy, fallo, Tropiezo } from './errores';
import { leerFichas, type Ficha } from './lexico';
import { PALABRAS_CLAVE, PALABRAS_PROHIBIDAS } from './subconjunto';

/* ── el árbol ───────────────────────────────────────────────────────────────*/

export type OpBin = '+' | '-' | '*' | '/' | '//' | '%' | '**';
export type OpComp = '==' | '!=' | '<' | '>' | '<=' | '>=' | 'in' | 'not in';

interface Sitio {
  linea: number;
  col: number;
}

export type Expr = Sitio &
  (
    | { t: 'num'; v: number; entero: boolean }
    | { t: 'cad'; v: string }
    | { t: 'fcad'; partes: (string | Expr)[] }
    | { t: 'bool'; v: boolean }
    | { t: 'nada' }
    | { t: 'nombre'; nombre: string }
    | { t: 'lista'; elementos: Expr[] }
    | { t: 'tupla'; elementos: Expr[] }
    | { t: 'dicc'; pares: { clave: Expr; valor: Expr }[] }
    | { t: 'bin'; op: OpBin; izq: Expr; der: Expr }
    | { t: 'neg'; arg: Expr }
    | { t: 'no'; arg: Expr }
    | { t: 'comp'; op: OpComp; izq: Expr; der: Expr }
    /** `a < b <= c`: `args` tiene uno más que `ops`, y cada término se evalúa una vez. */
    | { t: 'cadena'; ops: OpComp[]; args: Expr[] }
    | { t: 'logica'; op: 'and' | 'or'; izq: Expr; der: Expr }
    | { t: 'indice'; obj: Expr; indice: Expr }
    | { t: 'rebanada'; obj: Expr; desde: Expr | null; hasta: Expr | null }
    | { t: 'llamada'; fn: Expr; args: Expr[] }
    | { t: 'metodo'; obj: Expr; nombre: string; args: Expr[] }
    /** `math.pi`, `clima.UMBRAL`: un nombre de un módulo, sin llamarlo. */
    | { t: 'atributo'; obj: Expr; nombre: string }
  );

/** `import clima as c` → `{ nombre: 'clima', alias: 'c' }`. */
export interface Importado {
  nombre: string;
  alias: string | null;
}

export type Destino = Sitio &
  ({ t: 'nombre'; nombre: string } | { t: 'indice'; obj: Expr; indice: Expr });

export type Sent = Sitio &
  (
    | { t: 'expr'; expr: Expr }
    | { t: 'asigna'; destinos: Destino[]; valores: Expr[] }
    | { t: 'asignaOp'; destino: Destino; op: OpBin; valor: Expr }
    | { t: 'si'; ramas: { cond: Expr; cuerpo: Sent[] }[]; sino: Sent[] | null }
    | { t: 'mientras'; cond: Expr; cuerpo: Sent[] }
    | { t: 'para'; variables: string[]; iterable: Expr; cuerpo: Sent[] }
    | { t: 'def'; nombre: string; params: string[]; cuerpo: Sent[] }
    | { t: 'retorna'; valor: Expr | null }
    | { t: 'rompe' }
    | { t: 'sigue' }
    | { t: 'pasa' }
    | { t: 'importa'; modulos: Importado[] }
    | { t: 'desde'; modulo: string; nombres: Importado[] }
    | { t: 'con'; expr: Expr; nombre: string; cuerpo: Sent[] }
  );

export type Analisis = { ok: true; programa: Sent[] } | { ok: false; error: ErrorPy };

export function analizar(fuente: string): Analisis {
  const lectura = leerFichas(fuente);
  if (!lectura.ok) return { ok: false, error: lectura.error };
  try {
    return { ok: true, programa: new Analizador(lectura.fichas).programa() };
  } catch (e) {
    if (e instanceof Tropiezo) return { ok: false, error: e.detalle };
    throw e;
  }
}

/** Para los huecos de las f-strings: una expresión suelta, con su línea puesta. */
function analizarHueco(codigo: string, linea: number): Expr {
  const lectura = leerFichas(codigo);
  if (!lectura.ok) {
    throw fallo('sintaxis', `dentro de las llaves del texto: ${lectura.error.mensaje}`, {
      linea,
      pista: lectura.error.pista ?? undefined,
    });
  }
  const p = new Analizador(lectura.fichas);
  const e = p.expresionSuelta(linea);
  return e;
}

class Analizador {
  private i = 0;

  constructor(private readonly fichas: Ficha[]) {}

  /* ── utilidades ──────────────────────────────────────────────────────── */

  private mirar(): Ficha {
    return this.fichas[this.i] ?? this.fichas[this.fichas.length - 1];
  }

  private comer(): Ficha {
    const f = this.mirar();
    if (f.tipo !== 'fin') this.i += 1;
    return f;
  }

  private esOp(...ops: string[]): boolean {
    const f = this.mirar();
    return f.tipo === 'op' && ops.includes(f.texto);
  }

  private esPalabra(...palabras: string[]): boolean {
    const f = this.mirar();
    return f.tipo === 'nombre' && palabras.includes(f.texto);
  }

  private tragarOp(texto: string): boolean {
    if (!this.esOp(texto)) return false;
    this.i += 1;
    return true;
  }

  private tragarPalabra(texto: string): boolean {
    if (!this.esPalabra(texto)) return false;
    this.i += 1;
    return true;
  }

  private exigirOp(texto: string, mensaje: string, pista?: string): Ficha {
    if (!this.esOp(texto)) {
      const f = this.mirar();
      throw fallo('sintaxis', mensaje, { linea: f.linea, columna: f.col, pista });
    }
    return this.comer();
  }

  private exigirNl(): void {
    const f = this.mirar();
    if (f.tipo === 'nl') {
      this.i += 1;
      return;
    }
    if (f.tipo === 'fin' || f.tipo === 'desangra') return;
    if (f.tipo === 'op' && f.texto === '=') {
      throw fallo('sintaxis', 'aquí no se puede asignar', {
        linea: f.linea,
        columna: f.col,
        pista: 'a la izquierda del «=» tiene que haber un nombre de variable o una posición de lista',
      });
    }
    throw fallo('sintaxis', `sobra «${f.texto}» al final de la línea`, { linea: f.linea, columna: f.col });
  }

  private sitio(f: Ficha): Sitio {
    return { linea: f.linea, col: f.col };
  }

  /* ── programa y bloques ──────────────────────────────────────────────── */

  programa(): Sent[] {
    const sents: Sent[] = [];
    while (this.mirar().tipo !== 'fin') {
      const f = this.mirar();
      if (f.tipo === 'nl') {
        this.i += 1;
        continue;
      }
      if (f.tipo === 'sangra') {
        throw fallo('sangria', 'esta línea está sangrada de más', {
          linea: f.linea,
          columna: f.col,
          pista: 'sólo se sangra debajo de un «if», un «while», un «for» o un «def», y esos acaban en dos puntos',
        });
      }
      if (f.tipo === 'desangra') {
        this.i += 1;
        continue;
      }
      sents.push(this.sentencia());
    }
    return sents;
  }

  expresionSuelta(linea: number): Expr {
    const e = this.expresion();
    const f = this.mirar();
    if (f.tipo !== 'nl' && f.tipo !== 'fin') {
      throw fallo('sintaxis', `sobra «${f.texto}» dentro de las llaves del texto`, { linea });
    }
    return e;
  }

  /** El cuerpo de un `if`, un `for`, un `while` o un `def`. */
  private bloque(duenoLinea: number, dueno: string): Sent[] {
    this.exigirOp(':', `falta el «:» al final del «${dueno}»`, 'en Python toda línea que abre un bloque acaba en «:»');
    if (this.mirar().tipo !== 'nl') {
      const f = this.mirar();
      throw fallo('sintaxis', 'después de los dos puntos hay que cambiar de línea', {
        linea: f.linea,
        columna: f.col,
        pista: `escribe el cuerpo del «${dueno}» en la línea siguiente y sangrado`,
      });
    }
    this.i += 1;
    const f = this.mirar();
    if (f.tipo !== 'sangra') {
      throw fallo('sangria', `el «${dueno}» de la línea ${duenoLinea} se quedó sin cuerpo`, {
        linea: f.linea,
        columna: f.col,
        pista: 'después de los dos puntos, la línea siguiente va sangrada (4 espacios) y ahí va lo que se hace',
      });
    }
    this.i += 1;
    const sents: Sent[] = [];
    while (this.mirar().tipo !== 'desangra' && this.mirar().tipo !== 'fin') {
      if (this.mirar().tipo === 'nl') {
        this.i += 1;
        continue;
      }
      sents.push(this.sentencia());
    }
    if (this.mirar().tipo === 'desangra') this.i += 1;
    if (sents.length === 0) {
      throw fallo('sangria', `el «${dueno}» de la línea ${duenoLinea} se quedó sin cuerpo`, { linea: duenoLinea });
    }
    return sents;
  }

  /* ── sentencias ──────────────────────────────────────────────────────── */

  private sentencia(): Sent {
    const f = this.mirar();

    if (f.tipo === 'nombre') {
      const prohibida = PALABRAS_PROHIBIDAS[f.texto];
      if (prohibida) {
        throw fallo('sintaxis', `«${f.texto}» no existe en este editor`, {
          linea: f.linea,
          columna: f.col,
          pista: prohibida,
        });
      }
      switch (f.texto) {
        case 'if':
          return this.sentSi();
        case 'while':
          return this.sentMientras();
        case 'for':
          return this.sentPara();
        case 'def':
          return this.sentDef();
        case 'return':
          return this.sentRetorna();
        case 'break':
          this.i += 1;
          this.exigirNl();
          return { ...this.sitio(f), t: 'rompe' };
        case 'continue':
          this.i += 1;
          this.exigirNl();
          return { ...this.sitio(f), t: 'sigue' };
        case 'pass':
          this.i += 1;
          this.exigirNl();
          return { ...this.sitio(f), t: 'pasa' };
        case 'import':
          return this.sentImporta();
        case 'from':
          return this.sentDesde();
        case 'with':
          return this.sentCon();
        case 'as':
          throw fallo('sintaxis', '«as» va detrás de un «import» o de un «with», y aquí no hay ninguno', {
            linea: f.linea,
            columna: f.col,
            pista: 'se escribe: import statistics as st   —  o  with open("datos.csv") as f:',
          });
        case 'elif':
        case 'else':
          throw fallo('sintaxis', `este «${f.texto}» no tiene ningún «if» delante`, {
            linea: f.linea,
            columna: f.col,
            pista: `el «${f.texto}» va pegado a un «if» y con la misma sangría que él`,
          });
        default:
          break;
      }
    }

    return this.sentAsignacionOExpresion();
  }

  private sentSi(): Sent {
    const f = this.comer();
    const ramas: { cond: Expr; cuerpo: Sent[] }[] = [];
    const cond = this.condicion('if');
    ramas.push({ cond, cuerpo: this.bloque(f.linea, 'if') });

    let sino: Sent[] | null = null;
    for (;;) {
      if (this.esPalabra('elif')) {
        const g = this.comer();
        const c = this.condicion('elif');
        ramas.push({ cond: c, cuerpo: this.bloque(g.linea, 'elif') });
        continue;
      }
      if (this.esPalabra('else')) {
        const g = this.comer();
        sino = this.bloque(g.linea, 'else');
      }
      break;
    }
    return { ...this.sitio(f), t: 'si', ramas, sino };
  }

  /** La condición de un `if`/`while`, con el `=` en vez de `==` cazado aquí. */
  private condicion(dueno: string): Expr {
    const e = this.expresion();
    if (this.esOp('=')) {
      const f = this.mirar();
      throw fallo('sintaxis', `en un «${dueno}» se compara con «==», no con «=»`, {
        linea: f.linea,
        columna: f.col,
        pista: 'un «=» guarda un valor en una variable; dos «==» preguntan si son iguales',
      });
    }
    return e;
  }

  private sentMientras(): Sent {
    const f = this.comer();
    const cond = this.condicion('while');
    return { ...this.sitio(f), t: 'mientras', cond, cuerpo: this.bloque(f.linea, 'while') };
  }

  private sentPara(): Sent {
    const f = this.comer();
    const variables: string[] = [];
    for (;;) {
      const v = this.mirar();
      if (v.tipo !== 'nombre' || PALABRAS_CLAVE.has(v.texto)) {
        throw fallo('sintaxis', 'después de «for» va el nombre de la variable que va cambiando', {
          linea: v.linea,
          columna: v.col,
          pista: 'por ejemplo: for numero in range(10):',
        });
      }
      variables.push(v.texto);
      this.i += 1;
      if (!this.tragarOp(',')) break;
    }
    if (!this.tragarPalabra('in')) {
      const g = this.mirar();
      throw fallo('sintaxis', 'a un «for» le falta el «in»', {
        linea: g.linea,
        columna: g.col,
        pista: 'se escribe: for x in lista:   —  o  for i in range(10):',
      });
    }
    const iterable = this.expresion();
    return { ...this.sitio(f), t: 'para', variables, iterable, cuerpo: this.bloque(f.linea, 'for') };
  }

  private sentDef(): Sent {
    const f = this.comer();
    const n = this.mirar();
    if (n.tipo !== 'nombre' || PALABRAS_CLAVE.has(n.texto)) {
      throw fallo('sintaxis', 'después de «def» va el nombre de la función', {
        linea: n.linea,
        columna: n.col,
        pista: 'por ejemplo: def saluda(nombre):',
      });
    }
    this.i += 1;
    this.exigirOp('(', `falta el paréntesis de los argumentos de «${n.texto}»`, 'aunque no lleve ninguno se escriben los dos: def saluda():');
    const params: string[] = [];
    if (!this.esOp(')')) {
      for (;;) {
        const p = this.mirar();
        if (p.tipo !== 'nombre' || PALABRAS_CLAVE.has(p.texto)) {
          throw fallo('sintaxis', 'los argumentos de una función son nombres separados por comas', {
            linea: p.linea,
            columna: p.col,
          });
        }
        if (params.includes(p.texto)) {
          throw fallo('sintaxis', `«${p.texto}» está repetido en los argumentos`, { linea: p.linea, columna: p.col });
        }
        params.push(p.texto);
        this.i += 1;
        if (this.esOp('=')) {
          const g = this.mirar();
          throw fallo('sintaxis', 'aquí los argumentos no pueden traer un valor por defecto', {
            linea: g.linea,
            columna: g.col,
            pista: 'pásalos siempre al llamar a la función',
          });
        }
        if (!this.tragarOp(',')) break;
      }
    }
    this.exigirOp(')', `falta cerrar el paréntesis de «${n.texto}»`);
    return { ...this.sitio(f), t: 'def', nombre: n.texto, params, cuerpo: this.bloque(f.linea, 'def') };
  }

  /* ── M4: import, from, with ──────────────────────────────────────────── */

  /** Un nombre nuevo que el programa va a usar: ni palabra de Python ni otra cosa. */
  private nombreNuevo(mensaje: string, pista: string): string {
    const n = this.mirar();
    if (n.tipo !== 'nombre' || PALABRAS_CLAVE.has(n.texto) || PALABRAS_PROHIBIDAS[n.texto]) {
      throw fallo('sintaxis', mensaje, { linea: n.linea, columna: n.col, pista });
    }
    this.i += 1;
    return n.texto;
  }

  /**
   * El nombre de un módulo, sin `.py` y sin puntos.
   *
   * `import clima.py` es el error que comete cualquiera que acaba de ver el
   * archivo en su pestaña, y sin esta frase el alumno leería «el módulo clima no
   * tiene "py"», que es cierto y manda a buscar un `py` que no existe.
   */
  private nombreDeModulo(): string {
    const nombre = this.nombreNuevo('aquí va el nombre de un módulo', 'por ejemplo: import math   —  o  import clima');
    if (this.esOp('.')) {
      const punto = this.mirar();
      const sig = this.fichas[this.i + 1];
      const conPy = sig !== undefined && sig.tipo === 'nombre' && sig.texto === 'py';
      throw fallo('sintaxis', conPy ? 'un módulo se importa sin el «.py»' : 'aquí los nombres de módulo no llevan punto', {
        linea: punto.linea,
        columna: punto.col,
        pista: conPy
          ? `el archivo se llama ${nombre}.py, pero se importa así: import ${nombre}`
          : `se importa así: import ${nombre}`,
      });
    }
    return nombre;
  }

  private alias(): string | null {
    if (!this.tragarPalabra('as')) return null;
    return this.nombreNuevo('después de «as» va el nombre con el que lo vas a llamar', 'por ejemplo: import statistics as st');
  }

  private sentImporta(): Sent {
    const f = this.comer();
    const modulos: Importado[] = [];
    for (;;) {
      const nombre = this.nombreDeModulo();
      modulos.push({ nombre, alias: this.alias() });
      if (!this.tragarOp(',')) break;
    }
    this.exigirNl();
    return { ...this.sitio(f), t: 'importa', modulos };
  }

  private sentDesde(): Sent {
    const f = this.comer();
    const modulo = this.nombreDeModulo();
    if (!this.tragarPalabra('import')) {
      const g = this.mirar();
      throw fallo('sintaxis', 'a este «from» le falta el «import»', {
        linea: g.linea,
        columna: g.col,
        pista: `se escribe: from ${modulo} import lo_que_necesitas`,
      });
    }
    if (this.esOp('*')) {
      const g = this.mirar();
      throw fallo('sintaxis', 'aquí no se importa todo de golpe con «*»', {
        linea: g.linea,
        columna: g.col,
        pista: `escribe los nombres que vas a usar, separados por comas: from ${modulo} import uno, otro`,
      });
    }
    const nombres: Importado[] = [];
    for (;;) {
      const nombre = this.nombreNuevo(
        `después de «import» va lo que quieres traer de «${modulo}»`,
        `por ejemplo: from ${modulo} import uno, otro`,
      );
      nombres.push({ nombre, alias: this.alias() });
      if (!this.tragarOp(',')) break;
    }
    this.exigirNl();
    return { ...this.sitio(f), t: 'desde', modulo, nombres };
  }

  private sentCon(): Sent {
    const f = this.comer();
    const expr = this.expresion();
    if (!this.tragarPalabra('as')) {
      const g = this.mirar();
      throw fallo('sintaxis', 'a este «with» le falta el «as» con el nombre del archivo abierto', {
        linea: g.linea,
        columna: g.col,
        pista: 'se escribe: with open("datos.csv") as f:',
      });
    }
    const nombre = this.nombreNuevo('después de «as» va el nombre del archivo abierto', 'por ejemplo: with open("datos.csv") as f:');
    if (this.esOp(',')) {
      const g = this.mirar();
      throw fallo('sintaxis', 'aquí un «with» abre un solo archivo', {
        linea: g.linea,
        columna: g.col,
        pista: 'para dos archivos, pon un «with» dentro del otro',
      });
    }
    return { ...this.sitio(f), t: 'con', expr, nombre, cuerpo: this.bloque(f.linea, 'with') };
  }

  private sentRetorna(): Sent {
    const f = this.comer();
    if (this.mirar().tipo === 'nl' || this.mirar().tipo === 'fin') {
      this.exigirNl();
      return { ...this.sitio(f), t: 'retorna', valor: null };
    }
    const valor = this.expresion();
    this.exigirNl();
    return { ...this.sitio(f), t: 'retorna', valor };
  }

  private sentAsignacionOExpresion(): Sent {
    const f = this.mirar();
    const primera = this.expresion();

    /* `a, b = b, a` — la izquierda se leyó como expresiones sueltas. */
    if (this.esOp(',')) {
      const izquierdas = [primera];
      while (this.tragarOp(',')) {
        if (this.esOp('=')) break;
        izquierdas.push(this.expresion());
      }
      this.exigirOp('=', 'a una lista de variables separadas por comas le falta el «=»');
      const valores = [this.expresion()];
      while (this.tragarOp(',')) valores.push(this.expresion());
      this.exigirNl();
      const destinos = izquierdas.map((e) => this.comoDestino(e));
      if (valores.length !== 1 && valores.length !== destinos.length) {
        throw fallo('valor', `hay ${destinos.length} variables a la izquierda y ${valores.length} valores a la derecha`, {
          linea: f.linea,
          columna: f.col,
        });
      }
      return { ...this.sitio(f), t: 'asigna', destinos, valores };
    }

    if (this.esOp('=')) {
      this.i += 1;
      const valores = [this.expresion()];
      while (this.tragarOp(',')) valores.push(this.expresion());
      this.exigirNl();
      /* `x = 1, 2` en Python crea una tupla; aquí también, y así el
       * desempaquetado y la tupla salen de la misma regla. */
      return { ...this.sitio(f), t: 'asigna', destinos: [this.comoDestino(primera)], valores };
    }

    const compuesto = ['+=', '-=', '*=', '/=', '//=', '%=', '**='].find((o) => this.esOp(o));
    if (compuesto) {
      this.i += 1;
      const valor = this.expresion();
      this.exigirNl();
      return {
        ...this.sitio(f),
        t: 'asignaOp',
        destino: this.comoDestino(primera),
        op: compuesto.slice(0, -1) as OpBin,
        valor,
      };
    }

    this.exigirNl();
    return { ...this.sitio(f), t: 'expr', expr: primera };
  }

  /** Comprueba que lo que hay a la izquierda de un `=` se puede asignar. */
  private comoDestino(e: Expr): Destino {
    if (e.t === 'nombre') return { linea: e.linea, col: e.col, t: 'nombre', nombre: e.nombre };
    if (e.t === 'indice') return { linea: e.linea, col: e.col, t: 'indice', obj: e.obj, indice: e.indice };
    if (e.t === 'rebanada') {
      throw fallo('sintaxis', 'a una rebanada no se le puede dar un valor', {
        linea: e.linea,
        columna: e.col,
        pista: 'cambia los elementos de uno en uno con lista[i] = ... dentro de un «for»',
      });
    }
    if (e.t === 'atributo') {
      throw fallo('sintaxis', 'aquí no se le puede cambiar el valor a algo de un módulo', {
        linea: e.linea,
        columna: e.col,
        pista: 'guárdalo en una variable tuya y cambia ésa',
      });
    }
    if (e.t === 'llamada' || e.t === 'metodo') {
      throw fallo('sintaxis', 'no se le puede dar un valor al resultado de una función', {
        linea: e.linea,
        columna: e.col,
        pista: 'a la izquierda del «=» va el nombre de una variable',
      });
    }
    throw fallo('sintaxis', 'esto no puede ir a la izquierda de un «=»', {
      linea: e.linea,
      columna: e.col,
      pista: 'a la izquierda del «=» va el nombre de una variable o una posición como lista[0]',
    });
  }

  /* ── expresiones ─────────────────────────────────────────────────────── */

  private expresion(): Expr {
    return this.o();
  }

  private o(): Expr {
    let izq = this.y();
    while (this.esPalabra('or')) {
      const f = this.comer();
      izq = { ...this.sitio(f), t: 'logica', op: 'or', izq, der: this.y() };
    }
    return izq;
  }

  private y(): Expr {
    let izq = this.negacionLogica();
    while (this.esPalabra('and')) {
      const f = this.comer();
      izq = { ...this.sitio(f), t: 'logica', op: 'and', izq, der: this.negacionLogica() };
    }
    return izq;
  }

  private negacionLogica(): Expr {
    if (this.esPalabra('not')) {
      const f = this.comer();
      return { ...this.sitio(f), t: 'no', arg: this.negacionLogica() };
    }
    return this.comparacion();
  }

  private comparacion(): Expr {
    const izq = this.suma();
    const op = this.leerOpComparacion();
    if (!op) return izq;
    const f = this.fichas[this.i - 1];
    const der = this.suma();
    if (!this.leerOpComparacionMirando()) return { ...this.sitio(f), t: 'comp', op, izq, der };
    /* La cadena `0 < x < 10`: ver la cabecera del archivo. */
    const ops: OpComp[] = [op];
    const args: Expr[] = [izq, der];
    for (let otro = this.leerOpComparacion(); otro; otro = this.leerOpComparacion()) {
      ops.push(otro);
      args.push(this.suma());
    }
    return { ...this.sitio(f), t: 'cadena', ops, args };
  }

  private leerOpComparacion(): OpComp | null {
    const f = this.mirar();
    if (f.tipo === 'op' && ['==', '!=', '<', '>', '<=', '>='].includes(f.texto)) {
      this.i += 1;
      return f.texto as OpComp;
    }
    if (f.tipo === 'nombre' && f.texto === 'in') {
      this.i += 1;
      return 'in';
    }
    if (f.tipo === 'nombre' && f.texto === 'not' && this.fichas[this.i + 1]?.texto === 'in') {
      this.i += 2;
      return 'not in';
    }
    return null;
  }

  private leerOpComparacionMirando(): boolean {
    const f = this.mirar();
    if (f.tipo === 'op' && ['==', '!=', '<', '>', '<=', '>='].includes(f.texto)) return true;
    if (f.tipo === 'nombre' && (f.texto === 'in' || (f.texto === 'not' && this.fichas[this.i + 1]?.texto === 'in'))) {
      return true;
    }
    return false;
  }

  private suma(): Expr {
    let izq = this.producto();
    while (this.esOp('+', '-')) {
      const f = this.comer();
      izq = { ...this.sitio(f), t: 'bin', op: f.texto as OpBin, izq, der: this.producto() };
    }
    return izq;
  }

  private producto(): Expr {
    let izq = this.unario();
    while (this.esOp('*', '/', '//', '%')) {
      const f = this.comer();
      izq = { ...this.sitio(f), t: 'bin', op: f.texto as OpBin, izq, der: this.unario() };
    }
    return izq;
  }

  private unario(): Expr {
    if (this.esOp('-')) {
      const f = this.comer();
      return { ...this.sitio(f), t: 'neg', arg: this.unario() };
    }
    if (this.esOp('+')) {
      this.comer();
      return this.unario();
    }
    return this.potencia();
  }

  /** `**` asocia por la derecha, y su lado derecho puede llevar menos unario. */
  private potencia(): Expr {
    const izq = this.sufijos();
    if (this.esOp('**')) {
      const f = this.comer();
      return { ...this.sitio(f), t: 'bin', op: '**', izq, der: this.unario() };
    }
    return izq;
  }

  private sinTercerNumero(): void {
    if (!this.esOp(':')) return;
    const g = this.mirar();
    throw fallo('sintaxis', 'aquí las rebanadas no llevan un tercer número', {
      linea: g.linea,
      columna: g.col,
      pista: 'para dar la vuelta a una lista usa .reverse(); a[::-1] no existe en este editor',
    });
  }

  private sufijos(): Expr {
    let e = this.primario();
    for (;;) {
      if (this.esOp('[')) {
        const f = this.comer();
        const desde = this.esOp(':') ? null : this.expresion();
        if (this.tragarOp(':')) {
          /* El segundo «:» se caza ANTES de leer el final, o `a[::-1]` muere
           * con un «no se esperaba :» que no explica nada. */
          this.sinTercerNumero();
          const hasta = this.esOp(']') ? null : this.expresion();
          this.sinTercerNumero();
          this.exigirOp(']', 'falta cerrar el corchete de la rebanada');
          e = { ...this.sitio(f), t: 'rebanada', obj: e, desde, hasta };
          continue;
        }
        if (desde === null) {
          throw fallo('sintaxis', 'los corchetes están vacíos', { linea: f.linea, columna: f.col });
        }
        this.exigirOp(']', 'falta cerrar el corchete');
        e = { ...this.sitio(f), t: 'indice', obj: e, indice: desde };
        continue;
      }
      if (this.esOp('(')) {
        const f = this.comer();
        const args = this.argumentos();
        e = { ...this.sitio(f), t: 'llamada', fn: e, args };
        continue;
      }
      if (this.esOp('.')) {
        const f = this.comer();
        const n = this.mirar();
        if (n.tipo !== 'nombre') {
          throw fallo('sintaxis', 'después del punto va el nombre de un método', {
            linea: n.linea,
            columna: n.col,
            pista: 'por ejemplo: lista.append(3) o texto.upper()',
          });
        }
        this.i += 1;
        if (!this.esOp('(')) {
          /* `math.pi`. Si lo de la izquierda no es un módulo, la máquina da la
           * frase de antes: «upper» tiene que llamarse con paréntesis. */
          e = { ...this.sitio(f), t: 'atributo', obj: e, nombre: n.texto };
          continue;
        }
        this.comer();
        e = { ...this.sitio(f), t: 'metodo', obj: e, nombre: n.texto, args: this.argumentos() };
        continue;
      }
      return e;
    }
  }

  /** Lo de dentro de unos paréntesis de llamada, con el `(` ya comido. */
  private argumentos(): Expr[] {
    const args: Expr[] = [];
    if (this.tragarOp(')')) return args;
    for (;;) {
      const antes = this.i;
      const e = this.expresion();
      if (this.esOp('=')) {
        const g = this.mirar();
        throw fallo('sintaxis', 'aquí no se pueden pasar argumentos con nombre', {
          linea: g.linea,
          columna: g.col,
          pista: 'cosas como print(x, end="") o sorted(l, reverse=True) no existen en este editor',
        });
      }
      void antes;
      args.push(e);
      if (this.tragarOp(',')) {
        if (this.tragarOp(')')) return args;
        continue;
      }
      this.exigirOp(')', 'falta cerrar el paréntesis de la llamada');
      return args;
    }
  }

  private primario(): Expr {
    const f = this.mirar();

    switch (f.tipo) {
      case 'numero':
        this.i += 1;
        return { ...this.sitio(f), t: 'num', v: f.numero ?? 0, entero: f.entero ?? true };
      case 'cadena':
        this.i += 1;
        return { ...this.sitio(f), t: 'cad', v: f.cadena ?? '' };
      case 'fcadena': {
        this.i += 1;
        const partes: (string | Expr)[] = (f.partes ?? []).map((p) =>
          p.codigo === null ? (p.texto ?? '') : analizarHueco(p.codigo, f.linea),
        );
        return { ...this.sitio(f), t: 'fcad', partes };
      }
      case 'nombre': {
        const prohibida = PALABRAS_PROHIBIDAS[f.texto];
        if (prohibida) {
          throw fallo('sintaxis', `«${f.texto}» no existe en este editor`, {
            linea: f.linea,
            columna: f.col,
            pista: prohibida,
          });
        }
        this.i += 1;
        if (f.texto === 'True') return { ...this.sitio(f), t: 'bool', v: true };
        if (f.texto === 'False') return { ...this.sitio(f), t: 'bool', v: false };
        if (f.texto === 'None') return { ...this.sitio(f), t: 'nada' };
        if (PALABRAS_CLAVE.has(f.texto)) {
          throw fallo('sintaxis', `«${f.texto}» es una palabra de Python y aquí no encaja`, {
            linea: f.linea,
            columna: f.col,
            pista: 'no se puede usar como nombre de variable',
          });
        }
        return { ...this.sitio(f), t: 'nombre', nombre: f.texto };
      }
      case 'op':
        if (f.texto === '(') {
          this.i += 1;
          if (this.tragarOp(')')) return { ...this.sitio(f), t: 'tupla', elementos: [] };
          const primera = this.expresion();
          if (this.esOp(',')) {
            const elementos = [primera];
            while (this.tragarOp(',')) {
              if (this.esOp(')')) break;
              elementos.push(this.expresion());
            }
            this.exigirOp(')', 'falta cerrar el paréntesis');
            return { ...this.sitio(f), t: 'tupla', elementos };
          }
          this.exigirOp(')', 'falta cerrar el paréntesis');
          return primera;
        }
        if (f.texto === '[') {
          this.i += 1;
          const elementos: Expr[] = [];
          if (!this.tragarOp(']')) {
            for (;;) {
              elementos.push(this.expresion());
              if (this.esPalabra('for')) {
                const g = this.mirar();
                throw fallo('sintaxis', 'aquí no existen las listas por comprensión', {
                  linea: g.linea,
                  columna: g.col,
                  pista: 'crea la lista vacía y ve añadiendo con un «for» y «.append(...)»',
                });
              }
              if (this.tragarOp(',')) {
                if (this.tragarOp(']')) break;
                continue;
              }
              this.exigirOp(']', 'falta cerrar el corchete de la lista');
              break;
            }
          }
          return { ...this.sitio(f), t: 'lista', elementos };
        }
        if (f.texto === '{') {
          this.i += 1;
          const pares: { clave: Expr; valor: Expr }[] = [];
          if (!this.tragarOp('}')) {
            for (;;) {
              const clave = this.expresion();
              this.exigirOp(
                ':',
                'a esta clave del diccionario le falta su «:»',
                'un diccionario se escribe {"nombre": "Sofi", "edad": 14}',
              );
              const valor = this.expresion();
              pares.push({ clave, valor });
              if (this.tragarOp(',')) {
                if (this.tragarOp('}')) break;
                continue;
              }
              this.exigirOp('}', 'falta cerrar la llave del diccionario');
              break;
            }
          }
          return { ...this.sitio(f), t: 'dicc', pares };
        }
        break;
      case 'nl':
        throw fallo('sintaxis', 'la línea se acaba antes de tiempo', {
          linea: f.linea,
          columna: f.col,
          pista: 'falta lo que va después del último operador',
        });
      default:
        break;
    }

    throw fallo('sintaxis', f.tipo === 'fin' ? 'el programa se acaba antes de tiempo' : `no se esperaba «${f.texto}» aquí`, {
      linea: f.linea,
      columna: f.col,
    });
  }
}
