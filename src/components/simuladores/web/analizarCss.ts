/**
 * Tecnia Web · `analizarCss.ts` — de texto a reglas, con los tropiezos como datos.
 *
 * Tres capas, como en `formula/`: **valores → declaraciones → reglas**. Cada
 * una tiene su propio mensaje de error y ninguna lanza.
 *
 * ── Por qué se valida el valor, y no sólo la propiedad ─────────────────────
 *
 * Porque `color: rojo` es el error número uno del primer día, y porque el
 * valor de una declaración acaba dentro de un objeto de estilo de React. Si se
 * aceptara cualquier cadena, la vista previa estaría pintando texto que
 * escribió el alumno directamente en el navegador. Validando por forma —color,
 * longitud, palabra de una lista, borde, tipografía— pasa exactamente lo que
 * el subconjunto dice que puede pasar, y ni un carácter más.
 *
 * ── Las tolerancias, y por qué cada una ────────────────────────────────────
 *
 * 1. **Falta el `;`**: `color: red background: blue`. Se detecta porque el
 *    valor lleva dos puntos dentro, se avisa, y se leen las DOS declaraciones.
 *    Perder la segunda sería castigar dos veces el mismo despiste.
 * 2. **Falta la unidad**: `font-size: 20`. Se avisa con el arreglo escrito
 *    («20px»), que es lo que el alumno necesita ver.
 * 3. **Falta la llave de cierre**: la regla se cierra al final del archivo y se
 *    dice en qué línea se había abierto. Lo de dentro no se pierde.
 * 4. **`!important`**: se quita y se avisa. No es un error de escritura, es un
 *    atajo para ganar una pelea de especificidad sin entenderla — y ver la
 *    especificidad es justo lo que enseña el inspector.
 */

import { Cursor } from './cursor';
import { problema, type ProblemaWeb } from './errores';
import {
  COLORES_CON_NOMBRE,
  COLORES_EN_ESPANOL,
  ETIQUETAS,
  PROPIEDADES,
  PROPIEDADES_PROHIBIDAS,
  UNIDADES,
  type FormaValor,
} from './subconjunto';

/* ═══ 1 · Los valores ═══════════════════════════════════════════════════════ */

export type Validacion = { ok: true; valor: string } | { ok: false; mensaje: string; pista: string | null };

const COLORES = new Set(COLORES_CON_NOMBRE);
const ESTILOS_BORDE = ['solid', 'dashed', 'dotted', 'double', 'none'];

/** Lo que jamás puede viajar dentro de un valor: es lo que separa un estilo de un ataque. */
const VENENO = /[<>{}\\]|url\s*\(|expression\s*\(|javascript:/i;

/** Para reconocer «púrpura» y «café» escritos como se escriben de verdad. */
const ACENTOS: Readonly<Record<string, string>> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' };

function sinAcentos(texto: string): string {
  return texto.replace(/[áéíóúü]/g, (c) => ACENTOS[c] ?? c);
}

function esColor(v: string): boolean {
  if (COLORES.has(v)) return true;
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(v)) return true;
  return /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/.test(v);
}

function validarColor(v: string): Validacion {
  if (esColor(v)) return { ok: true, valor: v };
  const enEspanol = COLORES_EN_ESPANOL[sinAcentos(v)];
  if (enEspanol !== undefined) {
    return {
      ok: false,
      mensaje: `«${v}» no es un color que el navegador entienda`,
      pista: `los colores se escriben en inglés: «${v}» es «${enEspanol}»`,
    };
  }
  if (v.startsWith('#')) {
    return {
      ok: false,
      mensaje: `«${v}» no es un color en almohadilla bien escrito`,
      pista: 'lleva 3 o 6 símbolos, del 0 al 9 y de la «a» a la «f»: #e11 o #e11d48',
    };
  }
  return {
    ok: false,
    mensaje: `«${v}» no es un color`,
    pista: 'un color se escribe con su nombre en inglés («red», «steelblue») o con almohadilla («#e11d48»)',
  };
}

function validarLongitud(v: string, forma: { auto?: boolean; negativa?: boolean; suelto?: boolean }): Validacion {
  if (v === '0') return { ok: true, valor: '0' };
  if (v === 'auto') {
    return forma.auto === true
      ? { ok: true, valor: 'auto' }
      : { ok: false, mensaje: '«auto» no vale aquí', pista: 'esta medida necesita un número con su unidad, como «16px»' };
  }
  const conUnidad = /^(-?\d+(?:\.\d+)?)(px|%|em|rem)$/.exec(v);
  if (conUnidad) {
    if (conUnidad[1].startsWith('-') && forma.negativa !== true) {
      return { ok: false, mensaje: `«${v}» es negativo y aquí no se puede`, pista: 'un relleno o un tamaño no pueden ser menores que cero' };
    }
    return { ok: true, valor: v };
  }
  const suelto = /^-?\d+(?:\.\d+)?$/.exec(v);
  if (suelto) {
    if (forma.suelto === true) return { ok: true, valor: v };
    return {
      ok: false,
      mensaje: `a «${v}» le falta la unidad`,
      pista: `escríbelo «${v}px» (píxeles) o «${v}%» (por ciento); un número solo no dice de qué`,
    };
  }
  if (/^-?\d+(?:\.\d+)?\s+(px|%|em|rem)$/.test(v)) {
    return { ok: false, mensaje: `«${v}» lleva un espacio entre el número y la unidad`, pista: 'se escriben pegados: «16px», no «16 px»' };
  }
  return {
    ok: false,
    mensaje: `«${v}» no es una medida`,
    pista: `una medida es un número con su unidad: ${UNIDADES.map((u) => `«8${u}»`).join(', ')}`,
  };
}

function validarPalabra(v: string, opciones: readonly string[]): Validacion {
  if (opciones.includes(v)) return { ok: true, valor: v };
  const muestra = opciones.slice(0, 6).join('», «');
  return {
    ok: false,
    mensaje: `«${v}» no es uno de los valores que acepta esta propiedad`,
    pista: `puede ser «${muestra}»${opciones.length > 6 ? '…' : ''}`,
  };
}

function validarBorde(v: string): Validacion {
  const trozos = v.split(' ');
  if (trozos.length > 3) {
    return { ok: false, mensaje: `«${v}» tiene demasiadas partes para un borde`, pista: 'un borde se escribe «2px solid red»: grosor, tipo de raya y color' };
  }
  let grosor = false;
  let estilo = false;
  let color = false;
  for (const t of trozos) {
    if (!grosor && validarLongitud(t, {}).ok) {
      grosor = true;
      continue;
    }
    if (!estilo && ESTILOS_BORDE.includes(t)) {
      estilo = true;
      continue;
    }
    if (!color && esColor(t)) {
      color = true;
      continue;
    }
    const enEspanol = COLORES_EN_ESPANOL[sinAcentos(t)];
    return {
      ok: false,
      mensaje: `«${t}» no vale dentro de un borde`,
      pista:
        enEspanol !== undefined
          ? `los colores se escriben en inglés: «${t}» es «${enEspanol}»`
          : 'un borde se escribe «2px solid red»: grosor, tipo de raya y color',
    };
  }
  return { ok: true, valor: v };
}

function validarTipografia(v: string): Validacion {
  const nombres = v.split(',').map((n) => n.trim());
  for (const n of nombres) {
    if (n === '') return { ok: false, mensaje: 'sobra una coma en la lista de tipografías', pista: 'se escriben separadas por comas: Verdana, sans-serif' };
    if (!/^("[^"]*"|'[^']*'|[A-Za-z][A-Za-z0-9 -]*)$/.test(n)) {
      return {
        ok: false,
        mensaje: `«${n}» no es un nombre de tipografía`,
        pista: 'los nombres con espacios van entre comillas: "Times New Roman", Georgia, serif',
      };
    }
  }
  return { ok: true, valor: nombres.join(', ') };
}

function validarLista(v: string, forma: { max: number; auto?: boolean; negativa?: boolean }): Validacion {
  const trozos = v.split(' ');
  if (trozos.length > forma.max) {
    return {
      ok: false,
      mensaje: `«${v}» tiene ${trozos.length} medidas y aquí caben ${forma.max}`,
      pista:
        forma.max === 4
          ? 'con una vale para los cuatro lados; con dos, arriba-abajo e izquierda-derecha; con cuatro, arriba, derecha, abajo e izquierda'
          : 'aquí caben dos: la de arriba-abajo y la de los lados',
    };
  }
  for (const t of trozos) {
    const r = validarLongitud(t, forma);
    if (!r.ok) return r;
  }
  return { ok: true, valor: v };
}

/** Valida por FORMA, que es lo que hace que el subconjunto sea una tabla y no cien `if`. */
export function validarValor(propiedad: string, crudo: string): Validacion {
  const def = PROPIEDADES[propiedad];
  if (!def) return { ok: false, mensaje: `«${propiedad}» no existe`, pista: null };

  const texto = crudo.trim().replace(/\s+/g, ' ');
  if (texto === '') return { ok: false, mensaje: `«${propiedad}» se quedó sin valor`, pista: 'después de los dos puntos va lo que quieres que valga' };
  if (VENENO.test(texto)) {
    return { ok: false, mensaje: `«${texto}» tiene símbolos que no se pueden usar en un estilo`, pista: 'un valor es un color, una medida o una palabra' };
  }

  const forma: FormaValor = def.valor;
  const v = forma.forma === 'tipografia' ? texto : texto.toLowerCase();
  switch (forma.forma) {
    case 'color':
      return validarColor(v);
    case 'longitud':
      return validarLongitud(v, forma);
    case 'numero': {
      if (!/^\d+(\.\d+)?$/.test(v)) return { ok: false, mensaje: `«${v}» no es un número`, pista: 'aquí va un número suelto, sin unidad' };
      const n = Number(v);
      if (forma.min !== undefined && n < forma.min) return { ok: false, mensaje: `«${v}» es menor que ${forma.min}`, pista: null };
      if (forma.max !== undefined && n > forma.max) {
        return { ok: false, mensaje: `«${v}» es mayor que ${forma.max}`, pista: `va de ${forma.min ?? 0} a ${forma.max}` };
      }
      return { ok: true, valor: v };
    }
    case 'palabra':
      return validarPalabra(v, forma.opciones);
    case 'lista-longitud':
      return validarLista(v, forma);
    case 'borde':
      return validarBorde(v);
    case 'tipografia':
      return validarTipografia(v);
  }
}

/* ═══ 2 · Los selectores ════════════════════════════════════════════════════ */

export interface ParteSelector {
  etiqueta: string | null;
  clase: string | null;
  identificador: string | null;
}

export interface Selector {
  /** Tal cual lo escribió el alumno: el inspector lo enseña así. */
  texto: string;
  /** De fuera a dentro: `nav a` son dos partes. */
  partes: readonly ParteSelector[];
  hover: boolean;
  /** [identificadores, clases, etiquetas]. Se comparan exactos, nunca «a ojo». */
  especificidad: readonly [number, number, number];
}

export type LecturaSelector = { ok: true; selector: Selector } | { ok: false; mensaje: string; pista: string | null };

const COMBINADORES: Readonly<Record<string, string>> = {
  '>': 'el hijo directo («nav > a»)',
  '+': 'el hermano de al lado («h1 + p»)',
  '~': 'los hermanos siguientes',
  '*': 'todos los elementos («*»)',
  '[': 'los atributos («a[href]»)',
};

export function leerSelector(texto: string): LecturaSelector {
  const limpio = texto.trim().replace(/\s+/g, ' ');
  if (limpio === '') return { ok: false, mensaje: 'falta el selector', pista: 'antes de la llave va a quién se le aplica el estilo: «h1», «.tarjeta», «#menu»' };

  for (const simbolo of Object.keys(COMBINADORES)) {
    if (limpio.includes(simbolo)) {
      return {
        ok: false,
        mensaje: `«${simbolo}» no está en este taller`,
        pista: `${COMBINADORES[simbolo]} se ve más adelante; aquí se selecciona por etiqueta, por clase, por identificador y por estar dentro («nav a»)`,
      };
    }
  }
  if (limpio.includes('::')) {
    return { ok: false, mensaje: '«::» no está en este taller', pista: 'los seudoelementos («::before») se ven más adelante' };
  }

  const partes: ParteSelector[] = [];
  let ids = 0;
  let clases = 0;
  let etiquetas = 0;
  let hover = false;

  const trozos = limpio.split(' ');
  for (let k = 0; k < trozos.length; k += 1) {
    const trozo = trozos[k];
    const parte: ParteSelector = { etiqueta: null, clase: null, identificador: null };
    const piezas = trozo.match(/(^[a-zA-Z][a-zA-Z0-9]*|[.#:][A-Za-z_][A-Za-z0-9_-]*)/g);
    if (!piezas || piezas.join('') !== trozo) {
      return {
        ok: false,
        mensaje: `«${trozo}» no es un selector bien escrito`,
        pista: 'una etiqueta va sola («p»), una clase lleva punto («.aviso») y un identificador almohadilla («#menu»)',
      };
    }
    for (const pieza of piezas) {
      if (pieza.startsWith('.')) {
        parte.clase = pieza.slice(1);
        clases += 1;
      } else if (pieza.startsWith('#')) {
        parte.identificador = pieza.slice(1);
        ids += 1;
      } else if (pieza.startsWith(':')) {
        if (pieza !== ':hover') {
          return {
            ok: false,
            mensaje: `«${pieza}» no está en este taller`,
            pista: 'la única seudoclase que hay aquí es «:hover», la de pasar el ratón por encima',
          };
        }
        if (k !== trozos.length - 1) {
          return { ok: false, mensaje: '«:hover» tiene que ir en la última parte del selector', pista: 'se escribe «nav a:hover», no «nav:hover a»' };
        }
        hover = true;
        clases += 1;
      } else {
        const nombre = pieza.toLowerCase();
        if (ETIQUETAS[nombre] === undefined) {
          return { ok: false, mensaje: `«${pieza}» no es una etiqueta de HTML`, pista: 'las etiquetas van en inglés y sin punto ni almohadilla delante' };
        }
        parte.etiqueta = nombre;
        etiquetas += 1;
      }
    }
    partes.push(parte);
  }

  return { ok: true, selector: { texto: limpio, partes, hover, especificidad: [ids, clases, etiquetas] } };
}

/* ═══ 3 · Las reglas ════════════════════════════════════════════════════════ */

export interface Declaracion {
  propiedad: string;
  valor: string;
  linea: number;
  columna: number;
}

/** Un punto de quiebre, en píxeles y declarado. Nunca medido en pantalla (§39). */
export interface CondicionMedia {
  texto: string;
  minimo: number | null;
  maximo: number | null;
}

export interface Regla {
  selectores: readonly Selector[];
  declaraciones: readonly Declaracion[];
  /** `null` = siempre. Si la hay, la regla sólo cuenta con ese ancho de vista. */
  media: CondicionMedia | null;
  /** El orden en que se escribió: desempata la especificidad. */
  orden: number;
  linea: number;
  origen: string;
}

export interface HojaEstilos {
  origen: string;
  reglas: readonly Regla[];
  problemas: readonly ProblemaWeb[];
}

function saltarBlancos(c: Cursor, problemas: ProblemaWeb[], origen: string): void {
  for (;;) {
    c.saltarEspacios();
    if (c.ver() === '/' && c.ver(1) === '*') {
      const linea = c.linea;
      const col = c.col;
      const cierre = c.texto.indexOf('*/', c.i + 2);
      if (cierre === -1) {
        problemas.push(
          problema('comentario-sin-cerrar', 'aviso', 'este comentario no se cierra', {
            origen,
            linea,
            columna: col,
            pista: 'los comentarios de CSS van entre «/*» y «*/»',
          }),
        );
        c.saltarHasta(c.texto.length);
        return;
      }
      c.saltarHasta(cierre + 2);
      continue;
    }
    return;
  }
}

function leerCondicionMedia(texto: string): CondicionMedia | string {
  const limpio = texto.trim().replace(/\s+/g, ' ').toLowerCase();
  const sinTipo = limpio.replace(/^(screen|all)\s+and\s+/, '').replace(/^(screen|all)$/, '');
  if (/\b(print|speech)\b/.test(limpio)) return 'aquí sólo se practica la pantalla: «screen»';
  let minimo: number | null = null;
  let maximo: number | null = null;
  const trozos = sinTipo.split(/\s+and\s+/).filter((t) => t !== '');
  if (trozos.length === 0) return 'a la consulta le falta la condición: «@media (max-width: 600px)»';
  for (const t of trozos) {
    const m = /^\(\s*(min-width|max-width)\s*:\s*(\d+)px\s*\)$/.exec(t);
    if (!m) return `«${t}» no es un punto de quiebre de los de aquí: se escriben «(max-width: 600px)» o «(min-width: 700px)», en píxeles`;
    if (m[1] === 'min-width') minimo = Number(m[2]);
    else maximo = Number(m[2]);
  }
  return { texto: limpio, minimo, maximo };
}

/**
 * Lee un bloque de declaraciones. Sirve para el cuerpo de una regla **y para el
 * atributo `style=""`**, que es el mismo lenguaje sin las llaves.
 */
function leerDeclaraciones(c: Cursor, problemas: ProblemaWeb[], origen: string, conLlave: boolean, lineaApertura: number): Declaracion[] {
  const salida: Declaracion[] = [];

  const agregar = (propCruda: string, valorCrudo: string, linea: number, columna: number): void => {
    const propiedad = propCruda.trim().toLowerCase();
    if (propiedad === '') {
      if (valorCrudo.trim() !== '') {
        problemas.push(problema('declaracion-vacia', 'error', 'hay un valor sin propiedad delante', { origen, linea, columna, pista: 'se escribe «propiedad: valor;»' }));
      }
      return;
    }
    const prohibida = PROPIEDADES_PROHIBIDAS[propiedad];
    if (prohibida !== undefined) {
      problemas.push(problema('propiedad-prohibida', 'error', `«${propiedad}» no está en este taller: ${prohibida}`, { origen, linea, columna }));
      return;
    }
    if (PROPIEDADES[propiedad] === undefined) {
      problemas.push(
        problema('propiedad-desconocida', 'error', `«${propiedad}» no es una propiedad de CSS`, {
          origen,
          linea,
          columna,
          pista: 'revisa cómo se escribe: van en inglés y con guion en medio, como «background-color»',
        }),
      );
      return;
    }

    let valor = valorCrudo;
    if (/!\s*important/i.test(valor)) {
      valor = valor.replace(/!\s*important/gi, '');
      problemas.push(
        problema('valor-invalido', 'aviso', '«!important» no hace falta aquí', {
          origen,
          linea,
          columna,
          pista: 'en este taller gana la regla más específica, y verla ganar es justo lo que enseña el inspector',
        }),
      );
    }

    const r = validarValor(propiedad, valor);
    if (!r.ok) {
      problemas.push(problema('valor-invalido', 'error', `en «${propiedad}», ${r.mensaje}`, { origen, linea, columna, pista: r.pista ?? undefined }));
      return;
    }
    salida.push({ propiedad, valor: r.valor, linea, columna });
  };

  for (;;) {
    saltarBlancos(c, problemas, origen);
    if (c.fin) {
      if (conLlave) {
        problemas.push(
          problema('llave-sin-cerrar', 'error', 'esta regla se quedó sin la llave que la cierra', {
            origen,
            linea: lineaApertura,
            pista: 'cada «{» necesita su «}»; se abrió aquí y el archivo se acabó sin cerrarla',
          }),
        );
      }
      return salida;
    }
    if (c.ver() === '}') {
      if (conLlave) c.avanzar();
      else problemas.push(problema('llave-sobrante', 'error', 'sobra una llave «}»', { origen, linea: c.linea, columna: c.col, pista: null }));
      return salida;
    }
    if (c.ver() === ';') {
      c.avanzar();
      continue;
    }

    const linea = c.linea;
    const columna = c.col;
    const desde = c.i;
    while (!c.fin && c.ver() !== ':' && c.ver() !== ';' && c.ver() !== '}' && c.ver() !== '{') c.avanzar();
    const propiedad = c.texto.slice(desde, c.i);

    if (c.ver() !== ':') {
      /* `color red;` — el nombre es la primera palabra y lo demás era el valor.
       * Decir «a «color red» le faltan los dos puntos» es repetirle el error;
       * decirle «se escribe color: red;» es enseñárselo. */
      const palabras = propiedad.trim().split(/\s+/);
      const resto = palabras.slice(1).join(' ');
      problemas.push(
        problema('falta-dos-puntos', 'error', `a «${palabras[0]}» le faltan los dos puntos`, {
          origen,
          linea,
          columna,
          pista: resto === '' ? 'se escribe «propiedad: valor;», con dos puntos en medio y punto y coma al final' : `se escribe «${palabras[0]}: ${resto};»`,
        }),
      );
      if (c.ver() === ';') c.avanzar();
      continue;
    }
    c.avanzar();

    const desdeValor = c.i;
    while (!c.fin && c.ver() !== ';' && c.ver() !== '}') c.avanzar();
    const valor = c.texto.slice(desdeValor, c.i);
    if (c.ver() === ';') c.avanzar();

    /* `color: red background: blue` — falta un punto y coma en medio. Se leen
     * las dos: perder la segunda sería castigar dos veces el mismo despiste. */
    const partido = /^([^:]*?)\s+([A-Za-z-]+)\s*:\s*([\s\S]*)$/.exec(valor);
    if (partido) {
      problemas.push(
        problema('falta-punto-y-coma', 'error', `falta un «;» después del valor de «${propiedad.trim()}»`, {
          origen,
          linea,
          columna,
          pista: `cada declaración termina en punto y coma: «${propiedad.trim()}: ${partido[1].trim()};»`,
        }),
      );
      agregar(propiedad, partido[1], linea, columna);
      agregar(partido[2], partido[3], linea, columna);
      continue;
    }
    agregar(propiedad, valor, linea, columna);
  }
}

/** El atributo `style=""` de una etiqueta: las mismas declaraciones, sin llaves. */
export function leerDeclaracionesSueltas(texto: string, origen: string, linea: number): { declaraciones: Declaracion[]; problemas: ProblemaWeb[] } {
  const problemas: ProblemaWeb[] = [];
  const c = new Cursor(texto);
  const declaraciones = leerDeclaraciones(c, problemas, origen, false, linea);
  /* Las líneas son las del atributo, no las del CSS: se reetiquetan a la línea
   * de la etiqueta, que es donde el alumno tiene que mirar. */
  return {
    declaraciones: declaraciones.map((d) => ({ ...d, linea })),
    problemas: problemas.map((p) => ({ ...p, linea })),
  };
}

export function analizarCssSinCache(fuente: string, origen = 'estilo.css', lineaBase = 1): HojaEstilos {
  const c = new Cursor(fuente);
  const problemas: ProblemaWeb[] = [];
  const reglas: Regla[] = [];
  let orden = 0;
  let media: CondicionMedia | null = null;
  let finMedia = -1;

  const leerBloque = (): void => {
    const linea = c.linea;
    const columna = c.col;
    const desde = c.i;
    while (!c.fin && c.ver() !== '{' && c.ver() !== '}') c.avanzar();
    const textoSelector = c.texto.slice(desde, c.i);

    if (c.ver() !== '{') {
      if (textoSelector.trim() !== '') {
        problemas.push(
          problema('llave-sin-cerrar', 'error', `a la regla «${textoSelector.trim()}» le falta la llave «{»`, {
            origen,
            linea,
            columna,
            pista: 'después del selector se abre llave, se escriben las declaraciones y se cierra',
          }),
        );
      }
      if (c.ver() === '}') {
        problemas.push(problema('llave-sobrante', 'error', 'sobra una llave «}»', { origen, linea: c.linea, columna: c.col, pista: 'no hay ninguna regla abierta aquí' }));
        c.avanzar();
      }
      return;
    }
    const lineaApertura = c.linea;
    c.avanzar();

    const selectores: Selector[] = [];
    for (const trozo of textoSelector.split(',')) {
      if (trozo.trim() === '' && textoSelector.split(',').length > 1) {
        problemas.push(problema('selector-invalido', 'error', 'sobra una coma entre selectores', { origen, linea, columna, pista: 'se escriben «h1, h2 { … }»' }));
        continue;
      }
      const r = leerSelector(trozo);
      if (r.ok) selectores.push(r.selector);
      else problemas.push(problema('selector-invalido', 'error', r.mensaje, { origen, linea, columna, pista: r.pista ?? undefined }));
    }

    const declaraciones = leerDeclaraciones(c, problemas, origen, true, lineaApertura);
    if (selectores.length === 0) return;
    reglas.push({ selectores, declaraciones, media, orden, linea, origen });
    orden += 1;
  };

  for (;;) {
    saltarBlancos(c, problemas, origen);
    if (c.fin) break;

    /* El `}` va ANTES de mirar dónde acaba la consulta: la llave que cierra la
     * `@media` está justo en `finMedia`, y comprobar el fin primero la dejaba
     * huérfana y la denunciaba como llave sobrante. */
    if (c.ver() === '}') {
      if (media !== null) {
        media = null;
        finMedia = -1;
        c.avanzar();
        continue;
      }
      problemas.push(problema('llave-sobrante', 'error', 'sobra una llave «}»', { origen, linea: c.linea, columna: c.col, pista: 'no hay ninguna regla abierta aquí' }));
      c.avanzar();
      continue;
    }

    if (media !== null && c.i >= finMedia) {
      media = null;
      finMedia = -1;
    }

    if (c.ver() === '@') {
      const linea = c.linea;
      const columna = c.col;
      const desde = c.i;
      while (!c.fin && c.ver() !== '{' && c.ver() !== ';') c.avanzar();
      const cabecera = c.texto.slice(desde, c.i);
      const nombre = /^@([a-zA-Z-]+)/.exec(cabecera)?.[1].toLowerCase() ?? '';

      if (nombre !== 'media') {
        problemas.push(
          problema('regla-no-soportada', 'error', `«@${nombre}» no está en este taller`, {
            origen,
            linea,
            columna,
            pista: 'la única regla con arroba que hay aquí es «@media», la de los puntos de quiebre',
          }),
        );
        if (c.ver() === ';') {
          c.avanzar();
          continue;
        }
        /* Saltarse el bloque entero, contando llaves. */
        c.avanzar();
        let hondo = 1;
        while (!c.fin && hondo > 0) {
          if (c.ver() === '{') hondo += 1;
          else if (c.ver() === '}') hondo -= 1;
          c.avanzar();
        }
        continue;
      }

      if (media !== null) {
        problemas.push(problema('regla-no-soportada', 'error', 'una «@media» dentro de otra no se puede', { origen, linea, columna, pista: 'ciérrala antes de abrir la siguiente' }));
      }
      const cond = leerCondicionMedia(cabecera.slice(6));
      if (c.ver() === '{') c.avanzar();
      if (typeof cond === 'string') {
        problemas.push(problema('regla-no-soportada', 'error', cond, { origen, linea, columna, pista: 'un punto de quiebre es un ancho: «@media (max-width: 600px) { … }»' }));
        continue;
      }
      media = cond;
      /* Dónde acaba: se busca la llave que la cierra contando las de dentro. */
      let hondo = 1;
      let k = c.i;
      while (k < fuente.length && hondo > 0) {
        if (fuente[k] === '{') hondo += 1;
        else if (fuente[k] === '}') hondo -= 1;
        k += 1;
      }
      finMedia = hondo > 0 ? fuente.length : k - 1;
      if (hondo > 0) {
        problemas.push(problema('llave-sin-cerrar', 'error', 'a esta «@media» le falta la llave que la cierra', { origen, linea, columna, pista: 'cada «{» necesita su «}»' }));
      }
      continue;
    }

    leerBloque();
  }

  const conBase =
    lineaBase === 1
      ? { reglas, problemas }
      : {
          reglas: reglas.map((r) => ({ ...r, linea: r.linea + lineaBase - 1, declaraciones: r.declaraciones.map((d) => ({ ...d, linea: d.linea + lineaBase - 1 })) })),
          problemas: problemas.map((p) => ({ ...p, linea: p.linea + lineaBase - 1 })),
        };

  return { origen, reglas: conBase.reglas, problemas: conBase.problemas };
}

const CACHE = new Map<string, HojaEstilos>();
const TOPE_CACHE = 24;

/** Mismo texto, **mismo objeto** — igual que `analizarHtml`, y por lo mismo. */
export function analizarCss(fuente: string, origen = 'estilo.css', lineaBase = 1): HojaEstilos {
  const clave = `${origen} ${lineaBase} ${fuente}`;
  const guardada = CACHE.get(clave);
  if (guardada) return guardada;
  const hoja = analizarCssSinCache(fuente, origen, lineaBase);
  if (CACHE.size >= TOPE_CACHE) {
    const primera = CACHE.keys().next();
    if (!primera.done) CACHE.delete(primera.value);
  }
  CACHE.set(clave, hoja);
  return hoja;
}
