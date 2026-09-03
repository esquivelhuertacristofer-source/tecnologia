/**
 * Tecnia Hojas · `formula/sintaxis.ts` — de fichas a árbol.
 *
 * Descenso recursivo, un nivel por precedencia. Lo único que tiene de
 * particular es que **la precedencia es la de Excel, no la de las matemáticas**,
 * y en dos sitios no coinciden. Los dos están comprobados en las pruebas porque
 * si no, alguien los «arregla» dentro de un año:
 *
 * - **`=-2^2` da 4, no −4.** En Excel el menos unario aprieta MÁS que la
 *   potencia. En un libro de bachillerato es al revés.
 * - **`=2^3^2` da 64, no 512.** La potencia de Excel asocia por la izquierda:
 *   `(2^3)^2`. La convención matemática asocia por la derecha.
 *
 * Copiar a Excel en esto no es capricho: la sala entera existe para que el
 * alumno se siente después delante del Excel de verdad y le salga lo mismo. Una
 * fórmula que aquí da −4 y allí da 4 es la clase enseñando algo falso.
 *
 * De menos a más apretado:
 *
 *   comparación  =  <>  <  >  <=  >=
 *   concatenar   &
 *   suma         +  −
 *   producto     *  /
 *   potencia     ^                     (izquierda)
 *   negación     −x  +x                (más que la potencia)
 *   porcentaje   x%                    (sufijo)
 *   rango        A1:B5                 (sólo entre referencias)
 *
 * Como en `lexico.ts`: **este archivo no lanza**. Devuelve dónde se atascó.
 */

import { textoDeNumero, textoDeRango, textoDeRef, type CodigoError, type Ref, type Rango } from '../modelo';
import { analizar, cuerpoDeFormula, type Ficha } from './lexico';

export type OpBin = '=' | '<>' | '<' | '>' | '<=' | '>=' | '&' | '+' | '-' | '*' | '/' | '^';

export type Nodo =
  | { t: 'num'; v: number }
  | { t: 'txt'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'err'; codigo: CodigoError }
  | { t: 'ref'; ref: Ref }
  | { t: 'rango'; rango: Rango }
  | { t: 'nombre'; nombre: string }
  | { t: 'fn'; nombre: string; args: Nodo[] }
  | { t: 'bin'; op: OpBin; izq: Nodo; der: Nodo }
  | { t: 'neg'; arg: Nodo }
  | { t: 'pct'; arg: Nodo };

export type Analisis = { ok: true; arbol: Nodo } | { ok: false; mensaje: string; pos: number };

const COMPARACION: OpBin[] = ['=', '<>', '<=', '>=', '<', '>'];

class Fallo extends Error {
  constructor(
    readonly mensaje: string,
    readonly pos: number,
  ) {
    super(mensaje);
  }
}

/**
 * El punto de entrada. Recibe el crudo con `=` o sin él, da igual.
 *
 * Por dentro sí se usa una excepción para salir de la recursión —es la única
 * de todo el motor—, pero **no cruza la puerta**: `parsear` la atrapa y la
 * devuelve como dato. Fuera de este archivo sigue siendo verdad que nada lanza.
 */
export function parsear(crudo: string): Analisis {
  const lectura = analizar(cuerpoDeFormula(crudo));
  if (!lectura.ok) return lectura;
  if (lectura.fichas.length === 0) return { ok: false, mensaje: 'la fórmula está vacía', pos: 0 };

  const p = new Analizador(lectura.fichas);
  try {
    const arbol = p.expresion();
    const sobra = p.mirar();
    if (sobra) throw new Fallo(`sobra «${sobra.texto}»`, sobra.desde);
    return { ok: true, arbol };
  } catch (e) {
    if (e instanceof Fallo) return { ok: false, mensaje: e.mensaje, pos: e.pos };
    throw e;
  }
}

class Analizador {
  private i = 0;

  constructor(private readonly fichas: Ficha[]) {}

  mirar(): Ficha | null {
    return this.fichas[this.i] ?? null;
  }

  private come(): Ficha {
    const f = this.fichas[this.i];
    if (!f) throw new Fallo('la fórmula se acaba antes de tiempo', this.finDelTexto());
    this.i += 1;
    return f;
  }

  private finDelTexto(): number {
    const ultima = this.fichas[this.fichas.length - 1];
    return ultima ? ultima.desde + ultima.texto.length : 0;
  }

  private esOperador(...ops: OpBin[]): OpBin | null {
    const f = this.mirar();
    if (f?.tipo !== 'operador') return null;
    const op = f.texto as OpBin;
    return ops.includes(op) ? op : null;
  }

  /** Nivel 1 · comparación. */
  expresion(): Nodo {
    let izq = this.concatenacion();
    for (;;) {
      const op = this.esOperador(...COMPARACION);
      if (!op) return izq;
      this.come();
      izq = { t: 'bin', op, izq, der: this.concatenacion() };
    }
  }

  /** Nivel 2 · `&`. */
  private concatenacion(): Nodo {
    let izq = this.suma();
    for (;;) {
      const op = this.esOperador('&');
      if (!op) return izq;
      this.come();
      izq = { t: 'bin', op, izq, der: this.suma() };
    }
  }

  /** Nivel 3 · `+` y `−`. */
  private suma(): Nodo {
    let izq = this.producto();
    for (;;) {
      const op = this.esOperador('+', '-');
      if (!op) return izq;
      this.come();
      izq = { t: 'bin', op, izq, der: this.producto() };
    }
  }

  /** Nivel 4 · `*` y `/`. */
  private producto(): Nodo {
    let izq = this.potencia();
    for (;;) {
      const op = this.esOperador('*', '/');
      if (!op) return izq;
      this.come();
      izq = { t: 'bin', op, izq, der: this.potencia() };
    }
  }

  /** Nivel 5 · `^`, **asociando por la izquierda** como Excel. */
  private potencia(): Nodo {
    let izq = this.negacion();
    for (;;) {
      const op = this.esOperador('^');
      if (!op) return izq;
      this.come();
      izq = { t: 'bin', op, izq, der: this.negacion() };
    }
  }

  /** Nivel 6 · el menos unario, que en Excel aprieta más que la potencia. */
  private negacion(): Nodo {
    const op = this.esOperador('-', '+');
    if (!op) return this.porcentaje();
    this.come();
    const arg = this.negacion();
    return op === '-' ? { t: 'neg', arg } : arg;
  }

  /** Nivel 7 · el `%` de sufijo. `=50%` es 0,5 y `=A1%` también. */
  private porcentaje(): Nodo {
    let n = this.rango();
    while (this.mirar()?.tipo === 'porcentaje') {
      this.come();
      n = { t: 'pct', arg: n };
    }
    return n;
  }

  /** Nivel 8 · `A1:B5`. Sólo entre referencias, que es lo que Excel admite. */
  private rango(): Nodo {
    const izq = this.primario();
    if (this.mirar()?.tipo !== 'dosPuntos') return izq;
    const dp = this.come();
    const der = this.primario();
    if (izq.t !== 'ref' || der.t !== 'ref') {
      throw new Fallo('a los dos lados de «:» tiene que haber una celda', dp.desde);
    }
    return { t: 'rango', rango: { desde: izq.ref, hasta: der.ref } };
  }

  private primario(): Nodo {
    const f = this.come();

    switch (f.tipo) {
      case 'numero':
        return { t: 'num', v: f.numero ?? 0 };
      case 'texto':
        return { t: 'txt', v: f.cadena ?? '' };
      case 'booleano':
        return { t: 'bool', v: f.booleano ?? false };
      case 'error':
        return { t: 'err', codigo: f.codigo as CodigoError };
      case 'ref':
        return { t: 'ref', ref: f.ref as Ref };
      case 'abre': {
        const dentro = this.expresion();
        const cierre = this.mirar();
        if (cierre?.tipo !== 'cierra') throw new Fallo('falta un paréntesis de cierre', this.finDelTexto());
        this.come();
        return dentro;
      }
      case 'nombre': {
        if (this.mirar()?.tipo === 'abre') {
          this.come();
          const args: Nodo[] = [];
          if (this.mirar()?.tipo === 'cierra') {
            this.come();
            return { t: 'fn', nombre: f.texto.toUpperCase(), args };
          }
          for (;;) {
            args.push(this.expresion());
            const sig = this.mirar();
            if (sig?.tipo === 'separador') {
              this.come();
              continue;
            }
            if (sig?.tipo === 'cierra') {
              this.come();
              break;
            }
            throw new Fallo(`falta cerrar «${f.texto}»`, sig ? sig.desde : this.finDelTexto());
          }
          return { t: 'fn', nombre: f.texto.toUpperCase(), args };
        }
        return { t: 'nombre', nombre: f.texto };
      }
      default:
        throw new Fallo(`«${f.texto}» no puede ir aquí`, f.desde);
    }
  }
}

/* ── leer el árbol ──────────────────────────────────────────────────────────*/

/** Recorre el árbol entero. Lo usan el grafo de dependencias y las consultas. */
export function recorrer(n: Nodo, visita: (n: Nodo) => void): void {
  visita(n);
  switch (n.t) {
    case 'fn':
      n.args.forEach((a) => recorrer(a, visita));
      break;
    case 'bin':
      recorrer(n.izq, visita);
      recorrer(n.der, visita);
      break;
    case 'neg':
    case 'pct':
      recorrer(n.arg, visita);
      break;
    default:
      break;
  }
}

/** De qué habla la fórmula: celdas sueltas, rangos y nombres. */
export function referenciasDe(n: Nodo): { refs: Ref[]; rangos: Rango[]; nombres: string[] } {
  const refs: Ref[] = [];
  const rangos: Rango[] = [];
  const nombres: string[] = [];
  recorrer(n, (x) => {
    if (x.t === 'ref') refs.push(x.ref);
    else if (x.t === 'rango') rangos.push(x.rango);
    else if (x.t === 'nombre') nombres.push(x.nombre);
  });
  return { refs, rangos, nombres };
}

/** Los nombres de función que usa la fórmula, en mayúsculas. Para corregir. */
export function funcionesDe(n: Nodo): string[] {
  const fns: string[] = [];
  recorrer(n, (x) => {
    if (x.t === 'fn') fns.push(x.nombre);
  });
  return fns;
}

/* ── volver a escribir el árbol ─────────────────────────────────────────────*/

/**
 * Del árbol al texto. Sin el `=` delante: lo pone quien guarda la celda.
 *
 * Hace falta porque **copiar una fórmula no es copiar su texto**: al rellenar
 * hacia abajo, `=B2*C2` tiene que convertirse en `=B3*C3`, y eso se hace
 * moviendo las referencias del árbol y volviendo a escribirlo. Manipular la
 * cadena de texto con expresiones regulares es la otra forma de hacerlo, y es
 * la forma de que `"=SUMA(A1:A9)"` y `"=CONCAT(\"A1\")"` acaben tratados igual.
 *
 * Se pone paréntesis siempre que un hijo binario cuelgue de otro binario. Sobra
 * alguno, y sobrar un paréntesis no cambia lo que la fórmula calcula; faltar
 * uno, sí. La fórmula reescrita usa **coma** como separador, que es el canon de
 * la sala (`lexico.ts`, decisión A), aunque el alumno la hubiera escrito con
 * punto y coma.
 */
export function escribirFormula(n: Nodo): string {
  switch (n.t) {
    case 'num':
      return textoDeNumero(n.v);
    case 'txt':
      return `"${n.v.replace(/"/g, '""')}"`;
    case 'bool':
      return n.v ? 'VERDADERO' : 'FALSO';
    case 'err':
      return n.codigo;
    case 'ref':
      return textoDeRef(n.ref);
    case 'rango':
      return textoDeRango(n.rango);
    case 'nombre':
      return n.nombre;
    case 'fn':
      return `${n.nombre}(${n.args.map(escribirFormula).join(', ')})`;
    case 'neg':
      return `-${entreParentesis(n.arg)}`;
    case 'pct':
      return `${entreParentesis(n.arg)}%`;
    case 'bin':
      return `${entreParentesis(n.izq)}${n.op}${entreParentesis(n.der)}`;
  }
}

function entreParentesis(n: Nodo): string {
  const suelto = n.t === 'bin' || n.t === 'neg';
  return suelto ? `(${escribirFormula(n)})` : escribirFormula(n);
}

/**
 * Cambia todas las referencias del árbol con la regla que se le pase.
 *
 * Si la regla devuelve `null` —la referencia se salió de la hoja, o la fila a
 * la que apuntaba se borró—, la referencia se convierte en `#¡REF!` **dentro de
 * la fórmula**, que es exactamente lo que hace Excel y lo que la clase 47
 * enseña a leer. No se borra la fórmula ni se deja apuntando a otro sitio: se
 * deja rota y visible.
 */
export function transformarRefs(n: Nodo, regla: (r: Ref) => Ref | null): Nodo {
  switch (n.t) {
    case 'ref': {
      const r = regla(n.ref);
      return r ? { t: 'ref', ref: r } : { t: 'err', codigo: '#¡REF!' };
    }
    case 'rango': {
      const desde = regla(n.rango.desde);
      const hasta = regla(n.rango.hasta);
      if (!desde || !hasta) return { t: 'err', codigo: '#¡REF!' };
      return { t: 'rango', rango: { desde, hasta } };
    }
    case 'fn':
      return { t: 'fn', nombre: n.nombre, args: n.args.map((a) => transformarRefs(a, regla)) };
    case 'bin':
      return { t: 'bin', op: n.op, izq: transformarRefs(n.izq, regla), der: transformarRefs(n.der, regla) };
    case 'neg':
      return { t: 'neg', arg: transformarRefs(n.arg, regla) };
    case 'pct':
      return { t: 'pct', arg: transformarRefs(n.arg, regla) };
    default:
      return n;
  }
}
