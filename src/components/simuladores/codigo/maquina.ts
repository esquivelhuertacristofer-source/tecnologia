/**
 * Tecnia Código · `maquina.ts` — la que ejecuta, para y continúa.
 *
 * Un bucle, un `switch` y cuatro datos: el puntero `pc`, la pila de valores, la
 * pila de marcos y el diccionario de globales. **Todo el estado de una ejecución
 * está en el objeto `Maquina`**, y ésa es la propiedad que compra todo lo demás:
 *
 * - **Paso a paso** — `paso(m)` ejecuta *una* instrucción y vuelve. No hace
 *   falta nada especial: es que nunca hubo nada que no fuera esto.
 * - **Ver las variables** — `variables(m)` lee dos `Map`. En un intérprete de
 *   árbol habría que inventarse un mecanismo para asomarse a la pila de
 *   JavaScript, y no lo hay.
 * - **Dónde va la ejecución** — `lineaActual(m)` es `codigo[pc].linea`, y
 *   `pilaDeLlamadas(m)` es la lista de marcos. Un número y un array.
 * - **`input` que espera de verdad** — la máquina se queda en `esperando` y no
 *   pasa nada hasta que alguien llame a `responder`. Sin promesas, sin
 *   `async`, sin bloquear el navegador. Es lo mismo que parar: ya sabía parar.
 * - **Que nada cuelgue la pestaña** — los cuatro topes de `subconjunto.ts` se
 *   comprueban con un `if` en el bucle.
 *
 * ── Lo que no se hace, y es la regla más importante del archivo ─────────────
 *
 * **No hay `eval`, ni `new Function`, ni nada que convierta el código del alumno
 * en JavaScript.** Cada operación de este archivo la ejecuta este archivo. No es
 * purismo: cualquiera de esos tres atajos convierte el editor de una clase de
 * secundaria en una consola con acceso a `window`, `fetch` y `localStorage` de
 * la plataforma. Ni siquiera hace falta mala intención — basta un alumno
 * pegando algo que encontró.
 */

import { type ErrorPy, fallo, Tropiezo } from './errores';
import { compilar, type Ins, OP } from './compilar';
import { analizar } from './sintaxis';
import { METODOS_CADENA, METODOS_DICC, METODOS_LISTA, NATIVAS, TOPES } from './subconjunto';
import {
  aTexto,
  bool,
  cad,
  CIERTO,
  claveDeDicc,
  comparar,
  contiene,
  dicc,
  dividir,
  dividirEntera,
  elementosDe,
  ent,
  enCastellano,
  esVerdadero,
  FALSO,
  flo,
  guardarIndice,
  iguales,
  leerIndice,
  lista,
  longitud,
  multiplicar,
  NADA,
  negar,
  nombreDeTipo,
  potencia,
  rebanar,
  repr,
  restar,
  resto,
  sumar,
  tamanoDeRango,
  tupla,
  type Dicc,
  type IteradorV,
  type Lista,
  type Par,
  type Valor,
} from './valores';

export type Estado = 'lista' | 'corriendo' | 'esperando' | 'terminada' | 'error';

export interface Marco {
  locales: Map<string, Valor>;
  /** El `pc` al que se vuelve. */
  retorno: number;
  /** La altura de la pila de valores al entrar, para limpiarla al salir. */
  base: number;
  nombre: string;
  lineaLlamada: number;
}

export interface Topes {
  PASOS: number;
  PROFUNDIDAD: number;
  SALIDA: number;
  TAMANO: number;
}

export interface Maquina {
  readonly fuente: string;
  readonly codigo: Ins[];
  pc: number;
  pila: Valor[];
  globales: Map<string, Valor>;
  marcos: Marco[];
  /** Las líneas de la consola, ya como texto. */
  salida: string[];
  estado: Estado;
  error: ErrorPy | null;
  pasos: number;
  /** Respuestas preparadas para `input()`, en orden. */
  entradas: string[];
  /** Lo que `input()` está preguntando mientras el estado es `esperando`. */
  pregunta: string | null;
  topes: Topes;
}

export interface Opciones {
  entradas?: string[];
  topes?: Partial<Topes>;
}

export type Arranque = { ok: true; maq: Maquina } | { ok: false; error: ErrorPy };

/** Los nombres de fábrica, ya como valores, para que leerlos no cueste crear. */
const VALORES_NATIVOS = new Map<string, Valor>(NATIVAS.map((n) => [n, { t: 'nativa', nombre: n } as Valor]));

/* ── arrancar ───────────────────────────────────────────────────────────────*/

export function crearMaquina(fuente: string, opciones: Opciones = {}): Arranque {
  const arbol = analizar(fuente);
  if (!arbol.ok) return { ok: false, error: arbol.error };
  let codigo: Ins[];
  try {
    codigo = compilar(arbol.programa).codigo;
  } catch (e) {
    if (e instanceof Tropiezo) return { ok: false, error: e.detalle };
    throw e;
  }
  return {
    ok: true,
    maq: {
      fuente,
      codigo,
      pc: 0,
      pila: [],
      globales: new Map(),
      marcos: [],
      salida: [],
      estado: 'lista',
      error: null,
      pasos: 0,
      entradas: [...(opciones.entradas ?? [])],
      pregunta: null,
      topes: { ...TOPES, ...opciones.topes },
    },
  };
}

/** Sólo mirar si el programa está bien escrito, sin ejecutarlo. Para el editor. */
export function revisar(fuente: string): ErrorPy | null {
  const a = crearMaquina(fuente);
  return a.ok ? null : a.error;
}

/* ── mirar por dentro ───────────────────────────────────────────────────────*/

export function lineaActual(m: Maquina): number {
  const ins = m.codigo[m.pc];
  return ins ? ins.linea : 0;
}

export interface Vistazo {
  nombre: string;
  valor: Valor;
  /** Ya escrito como lo enseñaría `print`, para pintarlo sin pensar. */
  texto: string;
  ambito: 'global' | 'local';
}

/**
 * Las variables que existen ahora mismo, para el panel de la clase.
 *
 * Dentro de una función se enseñan primero las suyas: es lo que hace que el
 * ámbito local deje de ser una explicación y pase a ser algo que se ve.
 */
export function variables(m: Maquina): Vistazo[] {
  const salida: Vistazo[] = [];
  const marco = m.marcos[m.marcos.length - 1];
  if (marco) {
    for (const [nombre, valor] of marco.locales) {
      salida.push({ nombre, valor, texto: repr(valor), ambito: 'local' });
    }
  }
  for (const [nombre, valor] of m.globales) {
    salida.push({ nombre, valor, texto: repr(valor), ambito: 'global' });
  }
  return salida;
}

/** Dónde va la ejecución: del programa principal hacia adentro. */
export function pilaDeLlamadas(m: Maquina): { funcion: string; linea: number }[] {
  const pila = [{ funcion: '(programa)', linea: m.marcos[0]?.lineaLlamada ?? lineaActual(m) }];
  m.marcos.forEach((marco, i) => {
    const siguiente = m.marcos[i + 1];
    pila.push({ funcion: marco.nombre, linea: siguiente ? siguiente.lineaLlamada : lineaActual(m) });
  });
  return pila;
}

/* ── ejecutar ───────────────────────────────────────────────────────────────*/

/** Una instrucción. Es el átomo: todo lo demás son bucles alrededor de esto. */
export function paso(m: Maquina): void {
  if (m.estado === 'lista') m.estado = 'corriendo';
  if (m.estado !== 'corriendo') return;
  try {
    if (m.pasos >= m.topes.PASOS) throw bucleInfinito(m);
    unaInstruccion(m);
  } catch (e) {
    tropiezo(m, e);
  }
}

/**
 * Hasta la siguiente sentencia: **esto es el botón «paso a paso»** del alumno.
 *
 * No avanza «una línea» contando líneas, sino hasta la próxima instrucción
 * marcada como principio de sentencia por el compilador. La diferencia importa
 * en una línea como `total = suma(a) + suma(b)`: contando líneas, el paso se
 * saltaría entera la función `suma`; así, entra en ella y se ve por dentro, que
 * es justo lo que la clase quiere enseñar.
 */
export function pasoDeLinea(m: Maquina): void {
  if (m.estado === 'lista') m.estado = 'corriendo';
  if (m.estado !== 'corriendo') return;
  try {
    do {
      if (m.pasos >= m.topes.PASOS) throw bucleInfinito(m);
      unaInstruccion(m);
    } while (m.estado === 'corriendo' && !m.codigo[m.pc].inicio);
  } catch (e) {
    tropiezo(m, e);
  }
}

/**
 * Hasta el final, hasta que `input` pregunte, o hasta gastar el presupuesto.
 *
 * El `presupuesto` no es el tope de bucle infinito: es para que una interfaz
 * pueda ejecutar a ratos sin congelar la pestaña —mil pasos, pintar, otros
 * mil—. Quedarse sin presupuesto deja la máquina `corriendo`; gastar el tope de
 * verdad es lo que da el aviso del bucle infinito.
 */
export function correr(m: Maquina, presupuesto = Number.POSITIVE_INFINITY): void {
  if (m.estado === 'lista') m.estado = 'corriendo';
  if (m.estado !== 'corriendo') return;
  const hasta = m.pasos + presupuesto;
  try {
    while (m.estado === 'corriendo') {
      if (m.pasos >= m.topes.PASOS) throw bucleInfinito(m);
      if (m.pasos >= hasta) return;
      unaInstruccion(m);
    }
  } catch (e) {
    tropiezo(m, e);
  }
}

/** Contestar a un `input()` que está esperando. */
export function responder(m: Maquina, texto: string): void {
  if (m.estado !== 'esperando') return;
  m.salida[m.salida.length - 1] += texto;
  m.pila.push(cad(texto));
  m.pregunta = null;
  m.estado = 'corriendo';
}

/** El atajo de siempre: ejecutar entero y devolver lo que salió. */
export function ejecutar(fuente: string, opciones: Opciones = {}): Maquina {
  const a = crearMaquina(fuente, opciones);
  if (!a.ok) {
    return {
      fuente,
      codigo: [],
      pc: 0,
      pila: [],
      globales: new Map(),
      marcos: [],
      salida: [],
      estado: 'error',
      error: a.error,
      pasos: 0,
      entradas: [],
      pregunta: null,
      topes: { ...TOPES, ...opciones.topes },
    };
  }
  correr(a.maq);
  return a.maq;
}

function tropiezo(m: Maquina, e: unknown): void {
  if (!(e instanceof Tropiezo)) throw e;
  const detalle = e.detalle;
  if (detalle.linea === 0) detalle.linea = lineaAnterior(m);
  m.error = detalle;
  m.estado = 'error';
}

/**
 * La línea de la instrucción que acaba de fallar.
 *
 * `pc` ya avanzó cuando la instrucción se ejecuta, así que la culpable es la de
 * antes. Sin este −1 todos los errores se atribuyen a la línea siguiente, que es
 * el defecto clásico de los intérpretes y manda al alumno a mirar donde no es.
 */
function lineaAnterior(m: Maquina): number {
  const ins = m.codigo[m.pc - 1] ?? m.codigo[m.pc];
  return ins ? ins.linea : 0;
}

function bucleInfinito(m: Maquina): Tropiezo {
  return fallo('limite', `tu programa lleva ${m.pasos.toLocaleString('es-MX')} pasos, puede que sea un bucle infinito`, {
    linea: lineaActual(m),
    pista:
      'mira la condición del «while»: si nada de lo que hay dentro la puede volver falsa, no para nunca. ' +
      'Y si usaste «while True», comprueba que dentro haya un «break»',
  });
}

/* ── el bucle ───────────────────────────────────────────────────────────────*/

function unaInstruccion(m: Maquina): void {
  const ins = m.codigo[m.pc];
  m.pc += 1;
  m.pasos += 1;
  const pila = m.pila;

  switch (ins.op) {
    case OP.CONST:
      pila.push(ins.k as Valor);
      return;

    case OP.LEE_GLOBAL: {
      const v = m.globales.get(ins.s) ?? VALORES_NATIVOS.get(ins.s);
      if (v === undefined) throw noExiste(m, ins.s);
      pila.push(v);
      return;
    }

    case OP.LEE_LOCAL: {
      const v = m.marcos[m.marcos.length - 1].locales.get(ins.s);
      if (v === undefined) {
        throw fallo('nombre', `usaste «${ins.s}» dentro de la función antes de darle un valor`, {
          pista:
            `como «${ins.s}» se asigna en algún sitio de esta función, Python la considera propia de ella; ` +
            'si querías la de fuera, pásala como argumento',
        });
      }
      pila.push(v);
      return;
    }

    case OP.GUARDA_GLOBAL:
      m.globales.set(ins.s, pila.pop() as Valor);
      return;

    case OP.GUARDA_LOCAL:
      m.marcos[m.marcos.length - 1].locales.set(ins.s, pila.pop() as Valor);
      return;

    case OP.LISTA: {
      const v = ins.n === 0 ? [] : pila.splice(pila.length - ins.n, ins.n);
      pila.push(lista(v));
      return;
    }

    case OP.TUPLA: {
      const v = ins.n === 0 ? [] : pila.splice(pila.length - ins.n, ins.n);
      pila.push(tupla(v));
      return;
    }

    case OP.DICC: {
      const mapa = new Map<string, Par>();
      const trozo = ins.n === 0 ? [] : pila.splice(pila.length - ins.n * 2, ins.n * 2);
      for (let i = 0; i < trozo.length; i += 2) {
        mapa.set(claveDeDicc(trozo[i]), { clave: trozo[i], valor: trozo[i + 1] });
      }
      pila.push(dicc(mapa));
      return;
    }

    case OP.TEXTO: {
      const trozo = pila.splice(pila.length - ins.n, ins.n);
      let s = '';
      for (const t of trozo) s += aTexto(t);
      pila.push(cad(s));
      return;
    }

    case OP.INDICE: {
      const i = pila.pop() as Valor;
      const o = pila.pop() as Valor;
      pila.push(leerIndice(o, i));
      return;
    }

    case OP.GUARDA_INDICE: {
      if (ins.n === 1) {
        /* Modo desempaquetado: el valor está debajo (ver `compilar.ts`). */
        const i = pila.pop() as Valor;
        const o = pila.pop() as Valor;
        guardarIndice(o, i, pila.pop() as Valor);
      } else {
        const v = pila.pop() as Valor;
        const i = pila.pop() as Valor;
        guardarIndice(pila.pop() as Valor, i, v);
      }
      return;
    }

    case OP.REBANA: {
      const hasta = pila.pop() as Valor;
      const desde = pila.pop() as Valor;
      pila.push(rebanar(pila.pop() as Valor, desde, hasta));
      return;
    }

    case OP.BIN: {
      const b = pila.pop() as Valor;
      const a = pila.pop() as Valor;
      switch (ins.n) {
        case 0:
          pila.push(sumar(a, b));
          return;
        case 1:
          pila.push(restar(a, b));
          return;
        case 2:
          pila.push(multiplicar(a, b));
          return;
        case 3:
          pila.push(dividir(a, b));
          return;
        case 4:
          pila.push(dividirEntera(a, b));
          return;
        case 5:
          pila.push(resto(a, b));
          return;
        default:
          pila.push(potencia(a, b));
          return;
      }
    }

    case OP.NEG:
      pila.push(negar(pila.pop() as Valor));
      return;

    case OP.NO:
      pila.push(esVerdadero(pila.pop() as Valor) ? FALSO : CIERTO);
      return;

    case OP.COMP: {
      const b = pila.pop() as Valor;
      const a = pila.pop() as Valor;
      switch (ins.n) {
        case 0:
          pila.push(iguales(a, b) ? CIERTO : FALSO);
          return;
        case 1:
          pila.push(iguales(a, b) ? FALSO : CIERTO);
          return;
        case 2:
          pila.push(comparar(a, b) < 0 ? CIERTO : FALSO);
          return;
        case 3:
          pila.push(comparar(a, b) > 0 ? CIERTO : FALSO);
          return;
        case 4:
          pila.push(comparar(a, b) <= 0 ? CIERTO : FALSO);
          return;
        case 5:
          pila.push(comparar(a, b) >= 0 ? CIERTO : FALSO);
          return;
        case 6:
          pila.push(contiene(b, a) ? CIERTO : FALSO);
          return;
        default:
          pila.push(contiene(b, a) ? FALSO : CIERTO);
          return;
      }
    }

    case OP.SALTA:
      m.pc = ins.n;
      return;

    case OP.SALTA_SI_NO:
      if (!esVerdadero(pila.pop() as Valor)) m.pc = ins.n;
      return;

    case OP.SALTA_SI_NO_DEJA:
      if (!esVerdadero(pila[pila.length - 1])) m.pc = ins.n;
      else pila.pop();
      return;

    case OP.SALTA_SI_SI_DEJA:
      if (esVerdadero(pila[pila.length - 1])) m.pc = ins.n;
      else pila.pop();
      return;

    case OP.POP:
      pila.pop();
      return;

    case OP.DUP2: {
      const n = pila.length;
      pila.push(pila[n - 2], pila[n - 1]);
      return;
    }

    case OP.DEF:
      pila.push(ins.k as Valor);
      return;

    case OP.DESEMPAQUETA: {
      const v = pila.pop() as Valor;
      const trozos = elementosDe(v);
      if (trozos.length !== ins.n) {
        throw fallo(
          'valor',
          `hay ${ins.n} variable${ins.n === 1 ? '' : 's'} a la izquierda y ${trozos.length} valor${trozos.length === 1 ? '' : 'es'} a la derecha`,
          { pista: 'tiene que haber los mismos a los dos lados del «=»' },
        );
      }
      for (let i = trozos.length - 1; i >= 0; i -= 1) pila.push(trozos[i]);
      return;
    }

    case OP.ITER: {
      const v = pila.pop() as Valor;
      if (v.t !== 'cad' && v.t !== 'lista' && v.t !== 'tupla' && v.t !== 'dicc' && v.t !== 'rango') {
        throw fallo('tipo', `no se puede recorrer ${enCastellano(v)} con un «for»`, {
          pista:
            v.t === 'ent' || v.t === 'flo'
              ? 'para repetir un número de veces se escribe: for i in range(5):'
              : 'se recorren textos, listas, tuplas, diccionarios y range(...)',
        });
      }
      /* Las claves de un diccionario se congelan al empezar el «for»: si el
       * cuerpo mete una clave nueva, esta vuelta no la ve. Python directamente
       * lanza un error ahí; congelarlas es más suave y no miente en lo que se
       * recorre. */
      const claves = v.t === 'dicc' ? [...v.v.values()].map((p) => p.clave) : null;
      const it: IteradorV = { t: 'iter', sobre: v, i: 0, claves };
      pila.push(it);
      return;
    }

    case OP.ITER_SIG: {
      const it = pila[pila.length - 1] as IteradorV;
      const v = siguienteDe(it);
      if (v === null) {
        pila.pop();
        m.pc = ins.n;
        return;
      }
      pila.push(v);
      return;
    }

    case OP.LLAMA: {
      const args = ins.n === 0 ? [] : pila.splice(pila.length - ins.n, ins.n);
      const quien = pila.pop() as Valor;
      llamar(m, quien, args, ins.linea, ins.s);
      return;
    }

    case OP.METODO: {
      const args = ins.n === 0 ? [] : pila.splice(pila.length - ins.n, ins.n);
      const obj = pila.pop() as Valor;
      pila.push(metodo(obj, ins.s, args));
      return;
    }

    case OP.RETORNA: {
      const v = pila.pop() as Valor;
      const marco = m.marcos.pop();
      if (!marco) {
        m.estado = 'terminada';
        return;
      }
      pila.length = marco.base;
      pila.push(v);
      m.pc = marco.retorno;
      return;
    }

    default:
      m.estado = 'terminada';
      return;
  }
}

function siguienteDe(it: IteradorV): Valor | null {
  const v = it.sobre;
  switch (v.t) {
    case 'cad':
      return it.i < v.v.length ? cad(v.v[it.i++]) : null;
    case 'lista':
    case 'tupla':
      return it.i < v.v.length ? v.v[it.i++] : null;
    case 'rango':
      return it.i < tamanoDeRango(v) ? ent(v.desde + it.i++ * v.paso) : null;
    case 'dicc': {
      const claves = it.claves as Valor[];
      return it.i < claves.length ? claves[it.i++] : null;
    }
    default:
      return null;
  }
}

/**
 * `NameError`, con la pista que de verdad ayuda: **el nombre parecido**.
 *
 * Se busca sólo al fallar, así que no cuesta nada en el camino bueno. Y es la
 * diferencia entre «no existe «contdor»» y «no existe «contdor» — ¿querías
 * decir «contador»?», que es la mitad de las veces que un alumno levanta la
 * mano.
 */
function noExiste(m: Maquina, nombre: string): Tropiezo {
  const candidatos = [...m.globales.keys(), ...NATIVAS];
  const marco = m.marcos[m.marcos.length - 1];
  if (marco) candidatos.push(...marco.locales.keys());
  const cerca = candidatos.find((c) => c !== nombre && parecidos(c, nombre));
  return fallo('nombre', `no existe ninguna variable llamada «${nombre}»`, {
    pista: cerca
      ? `¿querías decir «${cerca}»? Python distingue mayúsculas de minúsculas y los acentos`
      : 'las variables hay que crearlas antes de usarlas, y se escriben siempre igual: «Total» y «total» son distintas',
  });
}

/** Dos nombres se parecen si difieren en una letra, un intercambio o el caso. */
function parecidos(a: string, b: string): boolean {
  if (a.toLowerCase() === b.toLowerCase()) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let fallos = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    fallos += 1;
    if (fallos > 1) return false;
    if (a.length > b.length) i += 1;
    else if (b.length > a.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return fallos + (a.length - i) + (b.length - j) <= 1;
}

/* ── llamadas ───────────────────────────────────────────────────────────────*/

function llamar(m: Maquina, quien: Valor, args: Valor[], linea: number, escrito: string): void {
  if (quien.t === 'fn') {
    if (args.length !== quien.params.length) {
      throw fallo(
        'tipo',
        `la función «${quien.nombre}» necesita ${quien.params.length} argumento${quien.params.length === 1 ? '' : 's'} ` +
          `y le diste ${args.length}`,
        {
          pista:
            quien.params.length === 0
              ? `se llama así: ${quien.nombre}()`
              : `se llama así: ${quien.nombre}(${quien.params.join(', ')})`,
        },
      );
    }
    if (m.marcos.length >= m.topes.PROFUNDIDAD) {
      /* Si los últimos marcos son de la misma función, es la recursión clásica;
       * si no, dos funciones que se llaman entre ellas. Decirlo mal manda a
       * mirar la función equivocada. */
      const ultimo = m.marcos[m.marcos.length - 1];
      const propia = ultimo.nombre === quien.nombre;
      throw fallo(
        'recursion',
        propia
          ? `«${quien.nombre}» se llamó a sí misma ${m.marcos.length} veces sin parar`
          : `«${ultimo.nombre}» y «${quien.nombre}» se están llamando la una a la otra sin parar (${m.marcos.length} veces)`,
        {
          pista:
            'una función que se llama a sí misma necesita un caso que corte —un «if» que devuelva sin volver a llamarse—, ' +
            'y que cada llamada se acerque a él',
        },
      );
    }
    const locales = new Map<string, Valor>();
    for (let i = 0; i < args.length; i += 1) locales.set(quien.params[i], args[i]);
    m.marcos.push({ locales, retorno: m.pc, base: m.pila.length, nombre: quien.nombre, lineaLlamada: linea });
    m.pc = quien.dir;
    return;
  }

  if (quien.t === 'nativa') {
    const v = nativa(m, quien.nombre, args);
    if (v !== null) m.pila.push(v);
    return;
  }

  const eraDeFabrica = escrito !== '' && NATIVAS.includes(escrito);
  throw fallo(
    'tipo',
    eraDeFabrica
      ? `«${escrito}» ya no es una función: en tu programa vale ${repr(quien)}`
      : `${enCastellano(quien)} no se puede llamar como si fuera una función`,
    {
      pista: eraDeFabrica
        ? `«${escrito}» venía de fábrica y le diste otro valor con un «=»; ponle otro nombre a tu variable`
        : quien.t === 'lista'
          ? 'para pedir un elemento de una lista van corchetes, no paréntesis: lista[0]'
          : 'los paréntesis después de un nombre significan «llama a esta función»',
    },
  );
}

function exigeArgs(nombre: string, args: Valor[], min: number, max: number): void {
  if (args.length >= min && args.length <= max) return;
  const cuantos = min === max ? `${min}` : `entre ${min} y ${max}`;
  throw fallo('tipo', `${nombre}() lleva ${cuantos} argumento${max === 1 ? '' : 's'} y le diste ${args.length}`);
}

function comoEntero(v: Valor, quien: string): number {
  if (v.t === 'ent') return v.v;
  if (v.t === 'bool') return v.v ? 1 : 0;
  /* «tiene que ser un número entero y le diste un número» no dice nada: cuando
   * es un flotante hay que enseñarle el número con sus decimales. */
  if (v.t === 'flo') {
    throw fallo('tipo', `${quien} tiene que ser un número entero, y ${aTexto(v)} tiene decimales`, {
      pista: 'quítaselos con int(...)',
    });
  }
  throw fallo('tipo', `${quien} tiene que ser un número entero, y le diste ${enCastellano(v)}`, {
    pista: 'si es un texto con un número dentro, usa int(...)',
  });
}

function comoNumeroJs(v: Valor, quien: string): number {
  if (v.t === 'ent' || v.t === 'flo') return v.v;
  if (v.t === 'bool') return v.v ? 1 : 0;
  throw fallo('tipo', `${quien} tiene que ser un número, y le diste ${enCastellano(v)}`);
}

function comoTexto(v: Valor, quien: string): string {
  if (v.t === 'cad') return v.v;
  throw fallo('tipo', `${quien} tiene que ser un texto, y le diste ${enCastellano(v)}`, {
    pista: 'si tienes un número y quieres tratarlo como texto, conviértelo con str(...)',
  });
}

/** Devuelve `null` cuando no hay que apilar nada: sólo lo hace `input` al parar. */
function nativa(m: Maquina, nombre: string, args: Valor[]): Valor | null {
  switch (nombre) {
    case 'print': {
      const linea = args.map(aTexto).join(' ');
      if (m.salida.length >= m.topes.SALIDA) {
        throw fallo('limite', `tu programa lleva ${m.salida.length.toLocaleString('es-MX')} líneas escritas, puede que sea un bucle infinito`, {
          pista: 'si el «print» está dentro de un «while», mira si la condición se vuelve falsa alguna vez',
        });
      }
      m.salida.push(linea);
      return NADA;
    }

    case 'input': {
      exigeArgs('input', args, 0, 1);
      const pregunta = args.length === 1 ? aTexto(args[0]) : '';
      if (m.entradas.length > 0) {
        const respuesta = m.entradas.shift() as string;
        m.salida.push(pregunta + respuesta);
        return cad(respuesta);
      }
      m.salida.push(pregunta);
      m.pregunta = pregunta;
      m.estado = 'esperando';
      return null;
    }

    case 'len':
      exigeArgs('len', args, 1, 1);
      return ent(longitud(args[0]));

    case 'range': {
      exigeArgs('range', args, 1, 3);
      const a = comoEntero(args[0], 'el principio de range');
      if (args.length === 1) return { t: 'rango', desde: 0, hasta: a, paso: 1 };
      const b = comoEntero(args[1], 'el final de range');
      const p = args.length === 3 ? comoEntero(args[2], 'el paso de range') : 1;
      if (p === 0) {
        throw fallo('valor', 'el paso de range() no puede ser 0', {
          pista: 'con paso 0 nunca llegaría al final: sería un bucle infinito',
        });
      }
      return { t: 'rango', desde: a, hasta: b, paso: p };
    }

    case 'int': {
      exigeArgs('int', args, 1, 1);
      const v = args[0];
      if (v.t === 'ent') return v;
      if (v.t === 'bool') return ent(v.v ? 1 : 0);
      if (v.t === 'flo') return ent(Math.trunc(v.v));
      if (v.t === 'cad') {
        const s = v.v.trim();
        if (!/^[+-]?\d+$/.test(s)) {
          throw fallo('valor', `«${v.v}» no se puede convertir en un número entero`, {
            pista: /^[+-]?\d*\.\d+$/.test(s)
              ? 'tiene decimales: usa float(...) si los quieres, o int(float(...)) para quitárselos'
              : 'int() sólo entiende textos que sean sólo cifras, como "42"',
          });
        }
        return ent(Number(s));
      }
      throw fallo('tipo', `int() no sabe convertir ${enCastellano(v)}`);
    }

    case 'float': {
      exigeArgs('float', args, 1, 1);
      const v = args[0];
      if (v.t === 'flo') return v;
      if (v.t === 'ent') return flo(v.v);
      if (v.t === 'bool') return flo(v.v ? 1 : 0);
      if (v.t === 'cad') {
        const s = v.v.trim();
        if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) {
          throw fallo('valor', `«${v.v}» no se puede convertir en un número`, {
            pista: 'float() entiende textos como "3.5" o "-2"; el punto decimal es punto, no coma',
          });
        }
        return flo(Number(s));
      }
      throw fallo('tipo', `float() no sabe convertir ${enCastellano(v)}`);
    }

    case 'str':
      exigeArgs('str', args, 1, 1);
      return cad(aTexto(args[0]));

    case 'bool':
      exigeArgs('bool', args, 1, 1);
      return bool(esVerdadero(args[0]));

    case 'list':
      exigeArgs('list', args, 1, 1);
      return lista(elementosDe(args[0]));

    case 'sum': {
      exigeArgs('sum', args, 1, 1);
      let acumulado: Valor = ent(0);
      for (const x of elementosDe(args[0])) acumulado = sumar(acumulado, x);
      return acumulado;
    }

    case 'min':
    case 'max': {
      const cosas = args.length === 1 ? elementosDe(args[0]) : args;
      if (cosas.length === 0) {
        throw fallo('valor', `${nombre}() no puede trabajar con una lista vacía`, {
          pista: 'comprueba antes con un «if len(lista) > 0:»',
        });
      }
      let mejor = cosas[0];
      for (const x of cosas) {
        const c = comparar(x, mejor);
        if (nombre === 'min' ? c < 0 : c > 0) mejor = x;
      }
      return mejor;
    }

    case 'sorted': {
      exigeArgs('sorted', args, 1, 1);
      const cosas = elementosDe(args[0]);
      cosas.sort((a, b) => comparar(a, b));
      return lista(cosas);
    }

    case 'abs':
      exigeArgs('abs', args, 1, 1);
      return args[0].t === 'flo'
        ? flo(Math.abs(args[0].v))
        : ent(Math.abs(comoNumeroJs(args[0], 'lo que se le da a abs()')));

    case 'round': {
      exigeArgs('round', args, 1, 2);
      const x = comoNumeroJs(args[0], 'lo que se le da a round()');
      const n = args.length === 2 ? comoEntero(args[1], 'los decimales de round()') : 0;
      const r = redondeaComoPython(x, n);
      /* `round(x)` da un entero; `round(x, 2)` conserva el tipo de x, como Python. */
      if (args.length === 1) return ent(r);
      return args[0].t === 'flo' ? flo(r) : ent(r);
    }

    case 'type':
      exigeArgs('type', args, 1, 1);
      return { t: 'tipo', nombre: nombreDeTipo(args[0]) };

    default:
      throw fallo('nombre', `no existe ninguna función llamada «${nombre}»`);
  }
}

/**
 * El redondeo de Python, que **no** es el de la escuela: `round(2.5)` da 2 y
 * `round(3.5)` da 4. Se llama «al par más cercano» y existe para que redondear
 * muchos números seguidos no infle el total siempre hacia arriba.
 *
 * Se copia porque un ejercicio de promedios que aquí da 2 y en Python 3 da otra
 * cosa es la clase enseñando algo falso.
 */
function redondeaComoPython(x: number, decimales: number): number {
  const f = Math.pow(10, decimales);
  const y = x * f;
  const abajo = Math.floor(y);
  let r: number;
  if (y - abajo === 0.5) r = abajo % 2 === 0 ? abajo : abajo + 1;
  else r = Math.round(y);
  return decimales === 0 ? r : r / f;
}

/* ── métodos ────────────────────────────────────────────────────────────────*/

function metodo(obj: Valor, nombre: string, args: Valor[]): Valor {
  if (obj.t === 'cad') return metodoDeCadena(obj.v, nombre, args);
  if (obj.t === 'lista') return metodoDeLista(obj, nombre, args);
  if (obj.t === 'dicc') return metodoDeDicc(obj, nombre, args);
  throw fallo('atributo', `${enCastellano(obj)} no tiene ningún método «${nombre}»`, {
    pista: 'los métodos con punto los tienen los textos, las listas y los diccionarios',
  });
}

function sinMetodo(que: string, nombre: string, cuales: readonly string[]): Tropiezo {
  return fallo('atributo', `${que} no tiene ningún método llamado «${nombre}»`, {
    pista: `los que sí tiene son: ${cuales.join(', ')}`,
  });
}

function metodoDeCadena(s: string, nombre: string, args: Valor[]): Valor {
  switch (nombre) {
    case 'upper':
      exigeArgs('upper', args, 0, 0);
      return cad(s.toUpperCase());
    case 'lower':
      exigeArgs('lower', args, 0, 0);
      return cad(s.toLowerCase());
    case 'strip':
      exigeArgs('strip', args, 0, 0);
      return cad(s.trim());
    case 'split': {
      exigeArgs('split', args, 0, 1);
      if (args.length === 0) {
        const trozos = s.split(/\s+/).filter((t) => t !== '');
        return lista(trozos.map(cad));
      }
      const sep = comoTexto(args[0], 'el separador de split()');
      if (sep === '') throw fallo('valor', 'el separador de split() no puede ser un texto vacío');
      return lista(s.split(sep).map(cad));
    }
    case 'replace': {
      exigeArgs('replace', args, 2, 2);
      const a = comoTexto(args[0], 'lo que replace() busca');
      const b = comoTexto(args[1], 'lo que replace() pone');
      return cad(s.split(a).join(b));
    }
    case 'count': {
      exigeArgs('count', args, 1, 1);
      const a = comoTexto(args[0], 'lo que count() busca');
      if (a === '') return ent(s.length + 1);
      return ent(s.split(a).length - 1);
    }
    case 'find':
      exigeArgs('find', args, 1, 1);
      return ent(s.indexOf(comoTexto(args[0], 'lo que find() busca')));
    case 'startswith':
      exigeArgs('startswith', args, 1, 1);
      return bool(s.startsWith(comoTexto(args[0], 'lo que startswith() comprueba')));
    case 'endswith':
      exigeArgs('endswith', args, 1, 1);
      return bool(s.endsWith(comoTexto(args[0], 'lo que endswith() comprueba')));
    case 'isdigit':
      exigeArgs('isdigit', args, 0, 0);
      return bool(s.length > 0 && /^\d+$/.test(s));
    case 'join': {
      exigeArgs('join', args, 1, 1);
      const trozos = elementosDe(args[0]).map((v) => comoTexto(v, 'lo que se junta con join()'));
      return cad(trozos.join(s));
    }
    default:
      throw sinMetodo('un texto', nombre, METODOS_CADENA);
  }
}

function metodoDeLista(l: Lista, nombre: string, args: Valor[]): Valor {
  switch (nombre) {
    case 'append':
      exigeArgs('append', args, 1, 1);
      if (l.v.length >= TOPES.TAMANO) {
        throw fallo('limite', 'esa lista se hizo enorme (más de un millón de elementos)', {
          pista: '¿estás añadiendo dentro de un bucle que no para?',
        });
      }
      l.v.push(args[0]);
      return NADA;
    case 'pop': {
      exigeArgs('pop', args, 0, 1);
      if (l.v.length === 0) {
        throw fallo('indice', 'no se puede sacar nada de una lista vacía', {
          pista: 'comprueba antes con «if len(lista) > 0:»',
        });
      }
      if (args.length === 0) return l.v.pop() as Valor;
      const i = comoEntero(args[0], 'la posición de pop()');
      const real = i < 0 ? l.v.length + i : i;
      if (real < 0 || real >= l.v.length) {
        throw fallo('indice', `la lista tiene ${l.v.length} elementos y le pediste sacar la posición ${i}`);
      }
      return l.v.splice(real, 1)[0];
    }
    case 'insert': {
      exigeArgs('insert', args, 2, 2);
      const i = comoEntero(args[0], 'la posición de insert()');
      const real = Math.max(0, Math.min(l.v.length, i < 0 ? l.v.length + i : i));
      l.v.splice(real, 0, args[1]);
      return NADA;
    }
    case 'remove': {
      exigeArgs('remove', args, 1, 1);
      const i = l.v.findIndex((x) => iguales(x, args[0]));
      if (i < 0) {
        throw fallo('valor', `${repr(args[0])} no está en la lista, así que no se puede quitar`, {
          pista: 'comprueba antes con «if valor in lista:»',
        });
      }
      l.v.splice(i, 1);
      return NADA;
    }
    case 'sort':
      exigeArgs('sort', args, 0, 0);
      l.v.sort((a, b) => comparar(a, b));
      return NADA;
    case 'reverse':
      exigeArgs('reverse', args, 0, 0);
      l.v.reverse();
      return NADA;
    case 'index': {
      exigeArgs('index', args, 1, 1);
      const i = l.v.findIndex((x) => iguales(x, args[0]));
      if (i < 0) throw fallo('valor', `${repr(args[0])} no está en la lista`);
      return ent(i);
    }
    case 'count':
      exigeArgs('count', args, 1, 1);
      return ent(l.v.filter((x) => iguales(x, args[0])).length);
    case 'clear':
      exigeArgs('clear', args, 0, 0);
      l.v.length = 0;
      return NADA;
    default:
      throw sinMetodo('una lista', nombre, METODOS_LISTA);
  }
}

function metodoDeDicc(d: Dicc, nombre: string, args: Valor[]): Valor {
  switch (nombre) {
    case 'keys':
      exigeArgs('keys', args, 0, 0);
      return lista([...d.v.values()].map((p) => p.clave));
    case 'values':
      exigeArgs('values', args, 0, 0);
      return lista([...d.v.values()].map((p) => p.valor));
    case 'items':
      exigeArgs('items', args, 0, 0);
      return lista([...d.v.values()].map((p) => tupla([p.clave, p.valor])));
    case 'get': {
      exigeArgs('get', args, 1, 2);
      const par = d.v.get(claveDeDicc(args[0]));
      if (par) return par.valor;
      return args.length === 2 ? args[1] : NADA;
    }
    case 'pop': {
      exigeArgs('pop', args, 1, 2);
      const k = claveDeDicc(args[0]);
      const par = d.v.get(k);
      if (!par) {
        if (args.length === 2) return args[1];
        throw fallo('clave', `el diccionario no tiene ninguna clave ${repr(args[0])}`);
      }
      d.v.delete(k);
      return par.valor;
    }
    default:
      throw sinMetodo('un diccionario', nombre, METODOS_DICC);
  }
}
