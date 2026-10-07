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
 *
 * ── M4 (§69.21): módulos y un disco ─────────────────────────────────────────
 *
 * Un módulo importado se analiza y se compila **la primera vez que se importa**,
 * al final de la misma cinta (`compilar(…, { codigo })`), y su nivel de arriba
 * corre en un marco propio cuyas `globales` son las del módulo. Por eso las
 * variables de arriba se leen con `globalesDe(m)` y no con `m.globales`: en el
 * programa que se corre son la misma cosa, y en un módulo no. Las funciones
 * guardan las globales de su módulo al definirse (`FuncionV.globales`).
 *
 * `tramos` dice de qué archivo es cada trozo de la cinta: con eso un error
 * dentro de `clima.py` sale como «clima.py · línea 4» en vez de señalar la
 * línea 4 del archivo que se estaba corriendo.
 *
 * El disco (`Opciones.archivos`) es una copia: lo que el programa escribe se
 * queda en `m.disco` y se anota en `m.escritos`, y la clase decide qué hacer con
 * ello. Nada de esto toca el disco ni el `localStorage` de nadie.
 */

import { type ErrorPy, fallo, Tropiezo } from './errores';
import { compilar, type Ins, OP } from './compilar';
import { analizar } from './sintaxis';
import {
  METODOS_ARCHIVO,
  METODOS_CADENA,
  METODOS_DICC,
  METODOS_LISTA,
  MODULOS_AUSENTES,
  MODULOS_DE_FABRICA,
  NATIVAS,
  TOPES,
} from './subconjunto';
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
  type ArchivoV,
  type Dicc,
  type FuncionV,
  type IteradorV,
  type ModuloV,
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
  /** Las variables de arriba que ve este marco: las del programa o las de un módulo (M4). */
  globales: Map<string, Valor>;
  /** Sólo en el marco del nivel de arriba de un módulo que se está importando. */
  modulo: ModuloV | null;
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
  /**
   * Qué líneas de `salida` salieron de un `input` (la pregunta con la respuesta
   * pegada), por su índice, en orden. Un eco se ve igual que un `print` y no lo
   * es: el juez de programas (§68.4) sólo juzga lo que el programa **contesta**,
   * y un encargo que busca «tu nombre en la salida» no puede darse por hecho con
   * el eco de la propia pregunta.
   */
  ecos: number[];
  estado: Estado;
  error: ErrorPy | null;
  pasos: number;
  /** Respuestas preparadas para `input()`, en orden. */
  entradas: string[];
  /** Lo que `input()` está preguntando mientras el estado es `esperando`. */
  pregunta: string | null;
  topes: Topes;
  /* ── M4 ── */
  /** El nombre del archivo que se corre (`estacion.py`). Ver `Opciones.archivo`. */
  archivo: string;
  /** Los archivos que ve `open` e `import`: los del proyecto y lo que se escriba. */
  disco: Map<string, string>;
  /** Lo que el programa abrió para escribir, en el orden en que lo abrió. */
  escritos: string[];
  modulos: Map<string, ModuloV>;
  /** Los que están a media importación: para cazar dos módulos que se importan entre ellos. */
  cargando: Set<string>;
  /** Dónde empieza en la cinta cada módulo importado, en orden. Antes del primero, el archivo que se corre. */
  tramos: { desde: number; archivo: string }[];
}

export interface Opciones {
  entradas?: string[];
  topes?: Partial<Topes>;
  /**
   * Los archivos del proyecto (M4), por nombre: los `.py` que se pueden importar
   * y los de datos que se pueden abrir. El que se corre no hace falta que esté.
   */
  archivos?: Readonly<Record<string, string>>;
  /** Cómo se llama el archivo que se corre. Sólo se usa para decir que no se importe a sí mismo. */
  archivo?: string;
}

export type Arranque = { ok: true; maq: Maquina } | { ok: false; error: ErrorPy };

/** Los nombres de fábrica, ya como valores, para que leerlos no cueste crear. */
const VALORES_NATIVOS = new Map<string, Valor>(NATIVAS.map((n) => [n, { t: 'nativa', nombre: n } as Valor]));

/* ── arrancar ───────────────────────────────────────────────────────────────*/

function nuevaMaquina(fuente: string, codigo: Ins[], opciones: Opciones): Maquina {
  return {
    fuente,
    codigo,
    pc: 0,
    pila: [],
    globales: new Map(),
    marcos: [],
    salida: [],
    ecos: [],
    estado: 'lista',
    error: null,
    pasos: 0,
    entradas: [...(opciones.entradas ?? [])],
    pregunta: null,
    topes: { ...TOPES, ...opciones.topes },
    archivo: opciones.archivo ?? 'programa.py',
    disco: new Map(Object.entries(opciones.archivos ?? {})),
    escritos: [],
    modulos: new Map(),
    cargando: new Set(),
    tramos: [],
  };
}

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
  return { ok: true, maq: nuevaMaquina(fuente, codigo, opciones) };
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

/** De qué archivo es la instrucción `pc`: `null` si es del que se corre (M4). */
function archivoDe(m: Maquina, pc: number): string | null {
  let a: string | null = null;
  for (const t of m.tramos) if (pc >= t.desde) a = t.archivo;
  return a;
}

/** En qué archivo va la ejecución ahora, para que la ventana abra esa pestaña. `null`: el que se corre. */
export function archivoActual(m: Maquina): string | null {
  return archivoDe(m, m.pc);
}

/** Las variables de arriba que se leen y se escriben desde donde va la ejecución. */
function globalesDe(m: Maquina): Map<string, Valor> {
  const marco = m.marcos[m.marcos.length - 1];
  return marco ? marco.globales : m.globales;
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
  for (const [nombre, valor] of globalesDe(m)) {
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

/** Una comparación por su código de `COMP_COD`. La usan `COMP` y cada eslabón de `COMP_CADENA`. */
function comparacion(a: Valor, b: Valor, codigo: number): boolean {
  switch (codigo) {
    case 0:
      return iguales(a, b);
    case 1:
      return !iguales(a, b);
    case 2:
      return comparar(a, b) < 0;
    case 3:
      return comparar(a, b) > 0;
    case 4:
      return comparar(a, b) <= 0;
    case 5:
      return comparar(a, b) >= 0;
    case 6:
      return contiene(b, a);
    default:
      return !contiene(b, a);
  }
}

/** Contestar a un `input()` que está esperando. */
export function responder(m: Maquina, texto: string): void {
  if (m.estado !== 'esperando') return;
  /* Si limpiaron la consola con la pregunta pendiente, la línea del eco ya no
   * está: antes esto escribía en `salida[-1]`, una propiedad y no una línea. */
  if (m.salida.length === 0 || m.ecos[m.ecos.length - 1] !== m.salida.length - 1) {
    m.ecos.push(m.salida.length);
    m.salida.push(texto);
  } else {
    m.salida[m.salida.length - 1] += texto;
  }
  m.pila.push(cad(texto));
  m.pregunta = null;
  m.estado = 'corriendo';
}

/** El atajo de siempre: ejecutar entero y devolver lo que salió. */
export function ejecutar(fuente: string, opciones: Opciones = {}): Maquina {
  const a = crearMaquina(fuente, opciones);
  if (!a.ok) {
    const rota = nuevaMaquina(fuente, [], { ...opciones, entradas: [] });
    rota.estado = 'error';
    rota.error = a.error;
    return rota;
  }
  correr(a.maq);
  return a.maq;
}

function tropiezo(m: Maquina, e: unknown): void {
  if (!(e instanceof Tropiezo)) throw e;
  const detalle = e.detalle;
  if (detalle.linea === 0) detalle.linea = lineaAnterior(m);
  /* Un error de escritura de un módulo ya trae su archivo; uno de ejecución lo
   * saca de la instrucción que falló. */
  if (detalle.archivo === undefined) detalle.archivo = archivoDe(m, Math.max(0, m.pc - 1));
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
      const g = globalesDe(m);
      const v = g.get(ins.s) ?? VALORES_NATIVOS.get(ins.s);
      if (v === undefined) {
        /* `__name__` no se guarda en las globales: saldría en el panel de
         * variables de todas las clases y contaría como «una caja tuya». */
        if (ins.s === '__name__') {
          pila.push(cad(nombreDelModulo(m, g)));
          return;
        }
        throw noExiste(m, ins.s);
      }
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
      globalesDe(m).set(ins.s, pila.pop() as Valor);
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
      pila.push(comparacion(a, b, ins.n) ? CIERTO : FALSO);
      return;
    }

    case OP.COMP_CADENA: {
      const b = pila.pop() as Valor;
      const a = pila.pop() as Valor;
      if (comparacion(a, b, Number(ins.s))) {
        pila.push(b);
      } else {
        pila.push(FALSO);
        m.pc = ins.n;
      }
      return;
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

    case OP.DEF: {
      /* Una función de un módulo se lleva las variables de su módulo. */
      const fn = ins.k as FuncionV;
      const g = globalesDe(m);
      pila.push(g === m.globales ? fn : { ...fn, globales: g });
      return;
    }

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
      if (v.t === 'archivo') exigeLegible(v, 'recorrer con un «for»');
      if (v.t !== 'cad' && v.t !== 'lista' && v.t !== 'tupla' && v.t !== 'dicc' && v.t !== 'rango' && v.t !== 'archivo') {
        throw fallo('tipo', `no se puede recorrer ${enCastellano(v)} con un «for»`, {
          pista:
            v.t === 'ent' || v.t === 'flo'
              ? 'para repetir un número de veces se escribe: for i in range(5):'
              : 'se recorren textos, listas, tuplas, diccionarios, range(...) y archivos abiertos',
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
      if (obj.t === 'modulo') {
        /* `clima.clasifica(t)` no es un método: es llamar a algo del módulo. */
        llamar(m, deModulo(obj, ins.s), args, ins.linea, `${obj.nombre}.${ins.s}`);
        return;
      }
      if (obj.t === 'archivo') {
        pila.push(metodoDeArchivo(m, obj, ins.s, args));
        return;
      }
      pila.push(metodo(obj, ins.s, args));
      return;
    }

    case OP.IMPORTA: {
      const listo = importar(m, ins.s, ins.linea);
      if (listo) pila.push(listo);
      return;
    }

    case OP.DE_MODULO: {
      const mod = pila[pila.length - 1] as ModuloV;
      const v = mod.globales.get(ins.s);
      if (v === undefined) {
        throw fallo('importacion', `«${mod.nombre}» no tiene ninguna «${ins.s}» que se pueda importar`, {
          pista: pistaDeModulo(mod, ins.s),
        });
      }
      pila.push(v);
      return;
    }

    case OP.ATRIBUTO: {
      const obj = pila.pop() as Valor;
      if (obj.t === 'modulo') {
        pila.push(deModulo(obj, ins.s));
        return;
      }
      throw sinAtributo(obj, ins.s);
    }

    case OP.FIN_MODULO: {
      const marco = m.marcos.pop() as Marco;
      const mod = marco.modulo as ModuloV;
      m.cargando.delete(mod.nombre);
      m.modulos.set(mod.nombre, mod);
      pila.length = marco.base;
      pila.push(mod);
      m.pc = marco.retorno;
      return;
    }

    case OP.CON: {
      const v = pila[pila.length - 1];
      if (v.t !== 'archivo') {
        throw fallo('tipo', `«with» aquí sólo sirve para abrir archivos, y le diste ${enCastellano(v)}`, {
          pista: 'se escribe: with open("datos.csv") as f:',
        });
      }
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
    case 'archivo':
      /* Python lanza un error si cierras el archivo a medio «for»: aquí también. */
      exigeLegible(v, 'seguir leyendo');
      return leerLinea(v);
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
  const candidatos = [...globalesDe(m).keys(), ...NATIVAS];
  const marco = m.marcos[m.marcos.length - 1];
  if (marco) candidatos.push(...marco.locales.keys());
  const cerca = candidatos.find((c) => c !== nombre && parecidos(c, nombre));
  /* `nombre = Valentina`: lo que no existe es TODO el lado derecho de una
   * asignación. Es la forma de un texto sin comillas —el error más común del
   * primer día, y el que `n6-primeras-lineas-python` provoca a propósito—, pero
   * también la de una caja usada antes de crearla; la pista nombra las dos.
   * Sólo en el archivo que se corre: la línea de un módulo no está en `fuente`. */
  const linea = archivoActual(m) === null ? (m.fuente.split('\n')[lineaActual(m) - 1] ?? '') : '';
  const ladoDerecho = new RegExp(`^\\s*[A-Za-z_]\\w*\\s*=\\s*${nombre}\\s*$`).test(linea);
  return fallo('nombre', `no existe ninguna variable llamada «${nombre}»`, {
    pista: cerca
      ? `¿querías decir «${cerca}»? Python distingue mayúsculas de minúsculas y los acentos`
      : ladoDerecho
        ? `¿querías guardar el texto «${nombre}»? Un texto va entre comillas: sin ellas, Python busca una caja que se llame así. Y si es una caja, hay que crearla antes de esta línea`
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
    m.marcos.push({
      locales,
      retorno: m.pc,
      base: m.pila.length,
      nombre: quien.nombre,
      lineaLlamada: linea,
      globales: quien.globales ?? m.globales,
      modulo: null,
    });
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
      /* Un «\n» dentro de lo impreso es un renglón más, como en la consola de
       * Python: `print(f.read())` salía en UNA línea con saltos dentro y el juez,
       * que compara renglones, la daba por mala (M4, §69.21). */
      for (const renglon of linea.split('\n')) m.salida.push(renglon);
      return NADA;
    }

    case 'input': {
      exigeArgs('input', args, 0, 1);
      const pregunta = args.length === 1 ? aTexto(args[0]) : '';
      if (m.entradas.length > 0) {
        const respuesta = m.entradas.shift() as string;
        m.ecos.push(m.salida.length);
        m.salida.push(pregunta + respuesta);
        return cad(respuesta);
      }
      m.ecos.push(m.salida.length);
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

    case 'sum':
      exigeArgs('sum', args, 1, 1);
      return sumaComoPython(elementosDe(args[0]));

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

    case 'open':
      return abrir(m, args);

    case 'repr':
      /* Con archivos hace falta ver el «
» del final de cada línea (M4). */
      exigeArgs('repr', args, 1, 1);
      return cad(repr(args[0]));

    case 'math.sqrt': {
      exigeArgs('math.sqrt', args, 1, 1);
      const x = comoNumeroJs(args[0], 'lo que se le da a math.sqrt()');
      if (x < 0) {
        throw fallo('valor', `math.sqrt() no saca la raíz de un número negativo, y le diste ${aTexto(args[0])}`, {
          pista: 'la raíz cuadrada de un negativo no es un número real: comprueba antes con un «if»',
        });
      }
      return flo(Math.sqrt(x));
    }

    case 'math.floor':
    case 'math.ceil': {
      exigeArgs(nombre, args, 1, 1);
      const v = args[0];
      if (v.t === 'ent') return v;
      const x = comoNumeroJs(v, `lo que se le da a ${nombre}()`);
      /* Como en Python, devuelven un entero aunque les des un decimal. */
      return ent(nombre === 'math.floor' ? Math.floor(x) : Math.ceil(x));
    }

    case 'statistics.mean':
      exigeArgs('statistics.mean', args, 1, 1);
      return mediaComoPython(numerosDe(args[0], 'mean'));

    case 'statistics.median': {
      exigeArgs('statistics.median', args, 1, 1);
      const datos = numerosDe(args[0], 'median');
      datos.sort((a, b) => comparar(a, b));
      const n = datos.length;
      if (n % 2 === 1) return datos[(n - 1) / 2];
      /* Par: la media de los dos de en medio, con `/`. Siempre da decimal. */
      return dividir(sumar(datos[n / 2 - 1], datos[n / 2]), ent(2));
    }

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
 *
 * ── Con decimales, se redondea el número que DE VERDAD está guardado ─────────
 *
 * Corregido el 12-sep-2026, medido contra CPython 3.14: la versión anterior
 * multiplicaba `x * 10^n` y redondeaba el producto, y esa multiplicación ya
 * redondea. `6.35` se guarda como 6,3499999…, pero `6.35 * 10` da 63,5 exacto,
 * así que salía un empate que no existe: `round(6.35, 1)` daba 6.4 (Python:
 * 6.3), `round(2.675, 2)` 2.68 (2.67) y `round(0.15, 1)` 0.2 (0.1). Justo lo
 * que teclea un alumno de promedios.
 *
 * Ahora se leen los dígitos exactos del número guardado —`toFixed(100)` los da
 * sin redondear por el camino— y sólo si detrás del decimal pedido hay un 5 y
 * nada más se aplica «al par»; si no, `toFixed` ya redondea al más cercano. Con
 * cero o menos decimales el producto no pierde nada y sigue el camino de antes.
 */
function redondeaComoPython(x: number, decimales: number): number {
  if (decimales <= 0 || !Number.isFinite(x) || Math.abs(x) >= 1e21) {
    const f = Math.pow(10, -decimales);
    const y = decimales < 0 ? x / f : x;
    const abajo = Math.floor(y);
    const r = y - abajo === 0.5 ? (abajo % 2 === 0 ? abajo : abajo + 1) : Math.round(y);
    return decimales < 0 ? r * f : r;
  }
  if (decimales > 100) return x;
  const digitos = Math.abs(x).toFixed(100);
  const punto = digitos.indexOf('.');
  const empate = /^50*$/.test(digitos.slice(punto + 1 + decimales));
  if (empate && Number(digitos[punto + decimales]) % 2 === 0) {
    return Number((x < 0 ? '-' : '') + digitos.slice(0, punto + 1 + decimales));
  }
  return Number(x.toFixed(decimales));
}

/* ── M4: módulos ────────────────────────────────────────────────────────────*/

/**
 * `import nombre`: devuelve el módulo si ya está (o es de fábrica), o **empieza a
 * ejecutarlo** y devuelve `null` — entonces es `FIN_MODULO` quien lo apila al
 * acabar su nivel de arriba.
 */
function importar(m: Maquina, nombre: string, linea: number): ModuloV | null {
  const hecho = m.modulos.get(nombre);
  if (hecho) return hecho;

  const deFabrica = MODULOS_DE_FABRICA[nombre];
  if (deFabrica) {
    const globales = new Map<string, Valor>();
    for (const n of deFabrica) {
      globales.set(n, n === 'pi' ? flo(Math.PI) : ({ t: 'nativa', nombre: `${nombre}.${n}` } as Valor));
    }
    const mod: ModuloV = { t: 'modulo', nombre, globales, deFabrica: true };
    m.modulos.set(nombre, mod);
    return mod;
  }

  const archivo = `${nombre}.py`;
  if (archivo === m.archivo) {
    throw fallo('importacion', `«${archivo}» es el archivo que estás corriendo: no se importa a sí mismo`, {
      pista: 'lo que esté en este archivo ya lo puedes usar sin importarlo',
    });
  }
  if (m.cargando.has(nombre)) {
    throw fallo('importacion', `«${archivo}» y otro módulo se están importando el uno al otro`, {
      pista: 'pasa lo que comparten a un tercer módulo que importen los dos, o que sólo uno importe al otro',
    });
  }
  const fuente = m.disco.get(archivo);
  if (fuente === undefined) {
    const propios = [...m.disco.keys()].filter((a) => a.endsWith('.py') && a !== m.archivo).map((a) => a.slice(0, -3));
    const todos = [...propios, ...Object.keys(MODULOS_DE_FABRICA)];
    const cerca = todos.find((t) => parecidos(t, nombre));
    throw fallo('modulo', `no hay ningún módulo llamado «${nombre}»`, {
      pista:
        MODULOS_AUSENTES[nombre] ??
        (cerca ? `¿querías decir «${cerca}»? ` : '') + `aquí se pueden importar: ${todos.join(', ')}`,
    });
  }

  const arbol = analizar(fuente);
  if (!arbol.ok) {
    arbol.error.archivo = archivo;
    throw new Tropiezo(arbol.error);
  }
  const desde = m.codigo.length;
  m.tramos.push({ desde, archivo });
  try {
    compilar(arbol.programa, { codigo: m.codigo, modulo: true });
  } catch (e) {
    if (e instanceof Tropiezo) e.detalle.archivo = archivo;
    throw e;
  }
  const mod: ModuloV = { t: 'modulo', nombre, globales: new Map(), deFabrica: false };
  m.cargando.add(nombre);
  m.marcos.push({
    locales: new Map(),
    retorno: m.pc,
    base: m.pila.length,
    nombre: `import ${nombre}`,
    lineaLlamada: linea,
    globales: mod.globales,
    modulo: mod,
  });
  m.pc = desde;
  return null;
}

/** `__name__`: «__main__» en el archivo que se corre; el nombre del módulo dentro de uno importado. */
function nombreDelModulo(m: Maquina, g: Map<string, Valor>): string {
  if (g === m.globales) return '__main__';
  for (const mod of m.modulos.values()) if (mod.globales === g) return mod.nombre;
  for (const marco of m.marcos) if (marco.modulo && marco.modulo.globales === g) return marco.modulo.nombre;
  return '__main__';
}

function deModulo(mod: ModuloV, nombre: string): Valor {
  const v = mod.globales.get(nombre);
  if (v === undefined) {
    throw fallo('atributo', `el módulo «${mod.nombre}» no tiene nada llamado «${nombre}»`, { pista: pistaDeModulo(mod, nombre) });
  }
  return v;
}

function pistaDeModulo(mod: ModuloV, nombre: string): string {
  const hay = [...mod.globales.keys()];
  const cerca = hay.find((h) => parecidos(h, nombre));
  if (cerca) return `¿querías decir «${cerca}»?`;
  if (hay.length === 0) return `«${mod.nombre}» está vacío: todavía no define nada`;
  return `lo que tiene «${mod.nombre}» es: ${hay.join(', ')}`;
}

/** `x.nombre` sin paréntesis sobre lo que no es un módulo. */
function sinAtributo(obj: Valor, nombre: string): Tropiezo {
  const metodos =
    obj.t === 'cad' ? METODOS_CADENA : obj.t === 'lista' ? METODOS_LISTA : obj.t === 'dicc' ? METODOS_DICC : obj.t === 'archivo' ? METODOS_ARCHIVO : [];
  if (metodos.includes(nombre)) {
    return fallo('atributo', `«${nombre}» tiene que llamarse con paréntesis`, {
      pista: `escribe .${nombre}() con sus paréntesis, aunque no lleve nada dentro`,
    });
  }
  return fallo('atributo', `${enCastellano(obj)} no tiene nada llamado «${nombre}»`, {
    pista: 'con un punto se le pide algo a un módulo, como math.pi, o se llama a un método con paréntesis, como texto.upper()',
  });
}

/* ── M4: archivos ───────────────────────────────────────────────────────────*/

function abrir(m: Maquina, args: Valor[]): ArchivoV {
  exigeArgs('open', args, 1, 2);
  const nombre = comoTexto(args[0], 'el nombre del archivo');
  const modo = args.length === 2 ? comoTexto(args[1], 'el modo de open()') : 'r';
  if (modo !== 'r' && modo !== 'w' && modo !== 'a') {
    throw fallo('valor', `«${modo}» no es un modo de open()`, {
      pista: 'los modos son "r" para leer (el de siempre), "w" para escribir desde cero y "a" para añadir al final',
    });
  }
  if (modo === 'r') {
    const texto = m.disco.get(nombre);
    if (texto === undefined) {
      const hay = [...m.disco.keys()];
      const cerca = hay.find((h) => h !== nombre && parecidos(h, nombre));
      throw fallo('archivo', `no existe ningún archivo llamado «${nombre}»`, {
        pista: cerca
          ? `¿querías decir «${cerca}»? El nombre tiene que ser exacto, con su extensión`
          : hay.length > 0
            ? `los archivos que hay son: ${hay.join(', ')}`
            : 'esta clase no trae archivos: no hay nada que abrir',
      });
    }
    return { t: 'archivo', nombre, modo, texto, pos: 0, abierto: true };
  }
  if (modo === 'w' || !m.disco.has(nombre)) m.disco.set(nombre, '');
  if (!m.escritos.includes(nombre)) m.escritos.push(nombre);
  return { t: 'archivo', nombre, modo, texto: '', pos: 0, abierto: true };
}

function exigeLegible(f: ArchivoV, para: string): void {
  if (!f.abierto) {
    throw fallo('valor', `«${f.nombre}» ya está cerrado: no se puede ${para}`, {
      pista: 'después de .close() —o de salir del «with»— el archivo ya no se lee; ábrelo otra vez si lo necesitas',
    });
  }
  if (f.modo !== 'r') {
    throw fallo('operacion', `«${f.nombre}» se abrió para escribir, no para leer`, {
      pista: 'para leerlo, ábrelo con open(nombre) o open(nombre, "r")',
    });
  }
}

function leerLinea(f: ArchivoV): Valor | null {
  if (f.pos >= f.texto.length) return null;
  const fin = f.texto.indexOf('\n', f.pos);
  const hasta = fin === -1 ? f.texto.length : fin + 1;
  const linea = f.texto.slice(f.pos, hasta);
  f.pos = hasta;
  return cad(linea);
}

function metodoDeArchivo(m: Maquina, f: ArchivoV, nombre: string, args: Valor[]): Valor {
  switch (nombre) {
    case 'close':
      exigeArgs('close', args, 0, 0);
      f.abierto = false;
      return NADA;
    case 'read': {
      exigeArgs('read', args, 0, 0);
      exigeLegible(f, 'leer');
      const resto = f.texto.slice(f.pos);
      f.pos = f.texto.length;
      return cad(resto);
    }
    case 'readline': {
      exigeArgs('readline', args, 0, 0);
      exigeLegible(f, 'leer');
      return leerLinea(f) ?? cad('');
    }
    case 'readlines': {
      exigeArgs('readlines', args, 0, 0);
      exigeLegible(f, 'leer');
      const lineas: Valor[] = [];
      for (let l = leerLinea(f); l !== null; l = leerLinea(f)) lineas.push(l);
      return lista(lineas);
    }
    case 'write': {
      exigeArgs('write', args, 1, 1);
      if (!f.abierto) {
        throw fallo('valor', `«${f.nombre}» ya está cerrado: no se puede escribir`, {
          pista: 'escribe antes de .close(), o dentro del «with»',
        });
      }
      if (f.modo === 'r') {
        throw fallo('operacion', `«${f.nombre}» se abrió para leer, no para escribir`, {
          pista: 'para escribir, ábrelo con open(nombre, "w") —desde cero— o con "a" —al final—',
        });
      }
      const v = args[0];
      if (v.t !== 'cad') {
        throw fallo('tipo', `write() escribe textos, y le diste ${enCastellano(v)}`, {
          pista: 'conviértelo antes con str(...), y no olvides el "\\n" si quieres cambiar de línea',
        });
      }
      const nuevo = (m.disco.get(f.nombre) ?? '') + v.v;
      if (nuevo.length > m.topes.TAMANO) {
        throw fallo('limite', `«${f.nombre}» ya pasa de ${m.topes.TAMANO.toLocaleString('es-MX')} caracteres, puede que sea un bucle infinito`, {
          pista: 'mira si el write() está dentro de un bucle que no para',
        });
      }
      m.disco.set(f.nombre, nuevo);
      return ent(v.v.length);
    }
    default:
      throw sinMetodo('un archivo', nombre, METODOS_ARCHIVO);
  }
}

/* `BigInt(…)` y no `0n`: el `target` de la plataforma es anterior a ES2020. */
const B0 = BigInt(0);
const B1 = BigInt(1);
const B32 = BigInt(32);
const B52 = BigInt(52);

/* ── M4: las cuentas de la librería, como las hace CPython ──────────────────*/

/**
 * `sum()` de CPython 3.12+: los enteros se suman exactos hasta el primer
 * decimal, y desde ahí **suma compensada de Neumaier**, enteros incluidos
 * (medido: `sum([1e16, 1.0, 1, -1e16])` da 2.0 en 3.14). Hasta el 6-oct-2026
 * aquí se sumaba a la ingenua y `sum([0.1] * 10)` daba 0.9999999999999999 donde
 * Python da 1.0.
 */
function sumaComoPython(cosas: Valor[]): Valor {
  let acumulado: Valor = ent(0);
  let i = 0;
  for (; i < cosas.length; i += 1) {
    const x = cosas[i];
    if (x.t === 'flo' && (acumulado.t === 'ent' || acumulado.t === 'bool')) break;
    acumulado = sumar(acumulado, x);
  }
  if (i === cosas.length) return acumulado;
  /* El primer decimal: una suma normal, como hace CPython al cambiar de camino. */
  let f = (sumar(acumulado, cosas[i]) as { v: number }).v;
  let c = 0;
  for (i += 1; i < cosas.length; i += 1) {
    const v = cosas[i];
    if (v.t !== 'flo' && v.t !== 'ent' && v.t !== 'bool') {
      /* Lo que no es número: que lo explique `sumar`, con su mensaje. */
      sumar(flo(f), v);
    }
    const x = v.t === 'bool' ? (v.v ? 1 : 0) : (v as { v: number }).v;
    const t = f + x;
    if (Math.abs(f) >= Math.abs(x)) c += f - t + x;
    else c += x - t + f;
    f = t;
  }
  if (c !== 0 && Number.isFinite(c)) f += c;
  return flo(f);
}

function numerosDe(v: Valor, quien: string): Valor[] {
  const datos = elementosDe(v);
  if (datos.length === 0) {
    throw fallo('estadistica', `${quien}() necesita al menos un dato, y le diste una lista vacía`, {
      pista: 'comprueba antes con un «if len(lista) > 0:»',
    });
  }
  for (const d of datos) {
    if (d.t !== 'ent' && d.t !== 'flo' && d.t !== 'bool') {
      throw fallo('tipo', `statistics.${quien}() trabaja con números, y en la lista hay ${enCastellano(d)}`, {
        pista: 'si los datos vienen de un archivo, son textos: conviértelos con float(...) al leerlos',
      });
    }
  }
  return datos;
}

/**
 * `statistics.mean`, exacto: CPython suma los datos como fracciones exactas y
 * redondea una sola vez al final. Con enteros, si la división es exacta
 * devuelve un **entero** (`mean([2, 4])` es 3, no 3.0). Con decimales,
 * `mean([0.1, 0.2, 0.3])` da 0.2 — la suma ingenua entre 3 daría
 * 0.19999999999999998. Medido con CPython 3.14.
 */
function mediaComoPython(datos: Valor[]): Valor {
  const n = BigInt(datos.length);
  if (datos.every((d) => d.t !== 'flo')) {
    let total = B0;
    for (const d of datos) total += d.t === 'bool' ? (d.v ? B1 : B0) : BigInt((d as { v: number }).v);
    if (total % n === B0) return ent(Number(total / n));
    return flo(fraccionADoble(total, n));
  }
  let num = B0;
  let den = B1;
  for (const d of datos) {
    const [a, b] = d.t === 'flo' ? fraccionDe(d.v) : [d.t === 'bool' ? (d.v ? B1 : B0) : BigInt((d as { v: number }).v), B1];
    /* Los denominadores son potencias de 2: el común es el mayor. */
    if (b > den) {
      num *= b / den;
      den = b;
    }
    num += a * (den / b);
  }
  return flo(fraccionADoble(num, den * n));
}

/** El número exacto que guarda un `double`, como fracción con denominador potencia de 2. */
function fraccionDe(x: number): [bigint, bigint] {
  if (Number.isInteger(x) && Math.abs(x) <= Number.MAX_SAFE_INTEGER) return [BigInt(x), B1];
  const vista = new DataView(new ArrayBuffer(8));
  vista.setFloat64(0, x);
  const alto = vista.getUint32(0);
  const bajo = vista.getUint32(4);
  const exponente = (alto >>> 20) & 0x7ff;
  let mantisa = (BigInt(alto & 0xfffff) << B32) | BigInt(bajo);
  let e: number;
  if (exponente === 0) e = -1074;
  else {
    mantisa |= B1 << B52;
    e = exponente - 1075;
  }
  const num = alto >>> 31 ? -mantisa : mantisa;
  return e >= 0 ? [num << BigInt(e), B1] : [num, B1 << BigInt(-e)];
}

/**
 * `num / den` al `double` más cercano, empates al par. Se saca un cociente con
 * al menos 55 bits y el resto se pega como bit pegajoso: así `Number(bigint)`,
 * que ya redondea bien, ve si había algo detrás.
 */
function fraccionADoble(num: bigint, den: bigint): number {
  if (num === B0) return 0;
  const negativo = num < B0;
  if (negativo) num = -num;
  const bits = (b: bigint) => b.toString(2).length;
  const k = 55 - (bits(num) - bits(den));
  let q: bigint;
  let r: bigint;
  if (k >= 0) {
    const a = num << BigInt(k);
    q = a / den;
    r = a % den;
  } else {
    const b = den << BigInt(-k);
    q = num / b;
    r = num % b;
  }
  if (r !== B0) q |= B1;
  const v = Number(q) * Math.pow(2, -k);
  return negativo ? -v : v;
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
