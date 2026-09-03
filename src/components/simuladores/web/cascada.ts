/**
 * Tecnia Web · `cascada.ts` — qué estilo le toca a cada elemento, y de dónde salió.
 *
 * Es la parte que convierte «tengo reglas» en «esta caja es azul», y la que
 * hace que el inspector pueda decir algo que un alumno nunca ve: **por qué**
 * es azul, y qué otra regla intentó ponerla verde y perdió.
 *
 * ── Las cuatro decisiones ──────────────────────────────────────────────────
 *
 * 1. **Se compara exacto, nunca «casi».** La especificidad es una terna de
 *    enteros —identificadores, clases, etiquetas— y se compara entero a
 *    entero. Los anchos de `@media` son enteros de píxeles y se comparan con
 *    `<=` y `>=`. No hay una sola tolerancia inventada en este archivo (§39:
 *    cuadricular, no medir).
 * 2. **El ancho de la vista es un dato declarado, no una medición.** 1024 en
 *    escritorio, 390 en móvil, o lo que ponga la clase. Nada llama a
 *    `getBoundingClientRect` —que en jsdom devuelve ceros—, así que los puntos
 *    de quiebre de `n8-css-responsivo` se pueden probar sin navegador.
 * 3. **La herencia se calcula bajando**, no subiendo: cada elemento parte de
 *    las propiedades heredables de su padre YA resueltas. Así `color` puesto
 *    en `body` llega a un `<em>` metido en tres cajas, que es lo que el alumno
 *    espera y no siempre entiende.
 * 4. **`:hover` no se pinta inyectando CSS.** Se resuelve un segundo juego de
 *    propiedades y la vista previa lo enseña cuando el ratón está encima. En
 *    este armazón **ni una cadena escrita por el alumno llega al navegador
 *    como código**: llega como valor validado dentro de un objeto de estilo.
 */

import type { CSSProperties } from 'react';
import { problema, type ProblemaWeb } from './errores';
import { leerDeclaracionesSueltas, type CondicionMedia, type Declaracion, type HojaEstilos, type ParteSelector, type Regla, type Selector } from './analizarCss';
import { recorrerElementos, type ArbolHtml, type NodoDocumento, type NodoElemento, type NodoWeb } from './arbolHtml';
import { esHeredada } from './subconjunto';

export interface EstiloResuelto {
  /** Propiedad → valor final. Ya validado: se puede pintar tal cual. */
  propiedades: Readonly<Record<string, string>>;
  /** Propiedad → quién ganó: «.tarjeta», «heredado de body», «style=»…  */
  origen: Readonly<Record<string, string>>;
  /** Las propiedades con el ratón encima, o `null` si ninguna regla le toca. */
  hover: Readonly<Record<string, string>> | null;
  /**
   * Las que están porque se escribió la forma corta: `margin: 10px` deja
   * dentro `margin-top`, `margin-right`… El inspector las esconde (el alumno
   * no las escribió) y una clase que pregunta «¿le puso margen arriba?» las
   * encuentra igual, escriba el alumno la forma corta o la larga.
   */
  derivadas: ReadonlySet<string>;
}

export interface Cascada {
  /** `n` del elemento → su estilo. */
  porNodo: ReadonlyMap<number, EstiloResuelto>;
  /** Reglas que no pintan nada: el aviso más útil que hay en una hoja de estilos. */
  problemas: readonly ProblemaWeb[];
  /** El ancho con el que se resolvió. Cambia el resultado de las `@media`. */
  ancho: number;
}

const ESTILO_VACIO: EstiloResuelto = { propiedades: {}, origen: {}, hover: null, derivadas: new Set() };

export function estiloVacio(): EstiloResuelto {
  return ESTILO_VACIO;
}

/* ── Coincidir ──────────────────────────────────────────────────────────────*/

interface Sena {
  etiqueta: string;
  clases: readonly string[];
  identificador: string | null;
}

function senaDe(e: NodoElemento): Sena {
  const clase = e.atributos.class;
  return {
    etiqueta: e.etiqueta,
    clases: clase === undefined ? [] : clase.trim().split(/\s+/).filter((x) => x !== ''),
    identificador: e.atributos.id ?? null,
  };
}

function coincideParte(s: Sena, p: ParteSelector): boolean {
  if (p.etiqueta !== null && p.etiqueta !== s.etiqueta) return false;
  if (p.clase !== null && !s.clases.includes(p.clase)) return false;
  if (p.identificador !== null && p.identificador !== s.identificador) return false;
  return true;
}

/**
 * ¿Le toca este selector a este elemento?
 *
 * Se lee **de derecha a izquierda**, como lo hace un navegador de verdad: la
 * última parte tiene que ser el elemento, y las de delante tienen que
 * aparecer entre sus antepasados **en ese orden**, aunque no sean padres
 * directos (por eso `nav a` alcanza a un enlace metido dentro de un `ul`).
 */
export function coincide(cadena: readonly Sena[], sel: Selector): boolean {
  const partes = sel.partes;
  if (cadena.length === 0) return false;
  let i = partes.length - 1;
  if (!coincideParte(cadena[cadena.length - 1], partes[i])) return false;
  i -= 1;
  let k = cadena.length - 2;
  while (i >= 0 && k >= 0) {
    if (coincideParte(cadena[k], partes[i])) i -= 1;
    k -= 1;
  }
  return i < 0;
}

export function aplicaMedia(media: CondicionMedia | null, ancho: number): boolean {
  if (media === null) return true;
  if (media.minimo !== null && ancho < media.minimo) return false;
  if (media.maximo !== null && ancho > media.maximo) return false;
  return true;
}

/** Terna a terna, sin sumar ni ponderar: es como se comparan de verdad. */
function ganaEspecificidad(a: Selector, ordenA: number, b: Selector, ordenB: number): boolean {
  for (let i = 0; i < 3; i += 1) {
    if (a.especificidad[i] !== b.especificidad[i]) return a.especificidad[i] > b.especificidad[i];
  }
  return ordenA >= ordenB;
}

/* ── Resolver ───────────────────────────────────────────────────────────────*/

interface Candidata {
  selector: Selector;
  regla: Regla;
  declaraciones: readonly Declaracion[];
}

const LADOS = ['top', 'right', 'bottom', 'left'] as const;

/**
 * La forma corta, escrita larga: `margin: 10px 20px` son cuatro márgenes.
 *
 * Se expande **al aplicar** y no al leerla, y eso no es un detalle: en el
 * objeto final el orden de las claves es el de la primera vez que aparecen, no
 * el del último que escribió. Expandiendo aquí, `padding: 0` escrito después
 * de `padding-top: 5px` pisa el `padding-top` como tiene que pisarlo, y al
 * revés también. Guardando sólo la forma corta habría que adivinar cuál iba
 * después, y adivinar es lo que este proyecto no hace.
 */
function expandir(propiedad: string, valor: string): readonly (readonly [string, string])[] {
  if (propiedad !== 'margin' && propiedad !== 'padding') return [];
  const t = valor.split(' ');
  const cuatro = t.length === 1 ? [t[0], t[0], t[0], t[0]] : t.length === 2 ? [t[0], t[1], t[0], t[1]] : t.length === 3 ? [t[0], t[1], t[2], t[1]] : [t[0], t[1], t[2], t[3]];
  return LADOS.map((lado, i) => [`${propiedad}-${lado}`, cuatro[i]] as const);
}

function aplicar(
  destino: Record<string, string>,
  origen: Record<string, string>,
  derivadas: Set<string>,
  declaraciones: readonly Declaracion[],
  quien: string,
): void {
  for (const d of declaraciones) {
    destino[d.propiedad] = d.valor;
    origen[d.propiedad] = quien;
    derivadas.delete(d.propiedad);
    for (const [prop, valor] of expandir(d.propiedad, d.valor)) {
      destino[prop] = valor;
      origen[prop] = quien;
      derivadas.add(prop);
    }
  }
}

export function resolverEstilos(arbol: ArbolHtml, hojas: readonly HojaEstilos[], ancho: number): Cascada {
  const porNodo = new Map<number, EstiloResuelto>();
  const problemas: ProblemaWeb[] = [];
  const usados = new Set<Selector>();

  const reglas: Regla[] = [];
  for (const h of hojas) for (const r of h.reglas) reglas.push(r);

  const cadena: Sena[] = [];

  const bajar = (nodo: NodoWeb | NodoDocumento, heredado: Readonly<Record<string, string>>, deQuien: Readonly<Record<string, string>>): void => {
    if (nodo.tipo === 'texto' || nodo.tipo === 'comentario') return;

    let heredaHijos = heredado;
    let deQuienHijos = deQuien;

    if (nodo.tipo === 'elemento') {
      cadena.push(senaDe(nodo));

      const normales: Candidata[] = [];
      const encima: Candidata[] = [];
      for (const regla of reglas) {
        for (const selector of regla.selectores) {
          if (!coincide(cadena, selector)) continue;
          usados.add(selector);
          if (!aplicaMedia(regla.media, ancho)) continue;
          (selector.hover ? encima : normales).push({ selector, regla, declaraciones: regla.declaraciones });
        }
      }
      normales.sort((a, b) => (ganaEspecificidad(a.selector, a.regla.orden, b.selector, b.regla.orden) ? 1 : -1));
      encima.sort((a, b) => (ganaEspecificidad(a.selector, a.regla.orden, b.selector, b.regla.orden) ? 1 : -1));

      const propiedades: Record<string, string> = {};
      const origen: Record<string, string> = {};
      const derivadas = new Set<string>();
      for (const [prop, valor] of Object.entries(heredado)) {
        propiedades[prop] = valor;
        origen[prop] = deQuien[prop] ?? 'heredado';
      }
      for (const c of normales) aplicar(propiedades, origen, derivadas, c.declaraciones, c.selector.texto);

      const enLinea = nodo.atributos.style;
      if (enLinea !== undefined && enLinea.trim() !== '') {
        const { declaraciones, problemas: suyos } = leerDeclaracionesSueltas(enLinea, arbol.origen, nodo.linea);
        for (const p of suyos) problemas.push(p);
        aplicar(propiedades, origen, derivadas, declaraciones, 'style=');
      }

      let hover: Record<string, string> | null = null;
      if (encima.length > 0) {
        hover = { ...propiedades };
        const sinUso: Record<string, string> = {};
        for (const c of encima) aplicar(hover, sinUso, new Set(), c.declaraciones, c.selector.texto);
      }

      porNodo.set(nodo.n, { propiedades, origen, hover, derivadas });

      const paraHijos: Record<string, string> = {};
      const deQuienPara: Record<string, string> = {};
      for (const [prop, valor] of Object.entries(propiedades)) {
        if (!esHeredada(prop)) continue;
        paraHijos[prop] = valor;
        deQuienPara[prop] = origen[prop].startsWith('heredado') ? origen[prop] : `heredado de ${nodo.etiqueta}`;
      }
      heredaHijos = paraHijos;
      deQuienHijos = deQuienPara;
    }

    for (const h of nodo.hijos) bajar(h, heredaHijos, deQuienHijos);
    if (nodo.tipo === 'elemento') cadena.pop();
  };

  bajar(arbol.raiz, {}, {});

  for (const regla of reglas) {
    for (const selector of regla.selectores) {
      if (usados.has(selector)) continue;
      problemas.push(
        problema('selector-sin-uso', 'aviso', `la regla «${selector.texto}» no pinta nada`, {
          origen: regla.origen,
          linea: regla.linea,
          pista: pistaDeSelectorSinUso(selector, arbol),
        }),
      );
    }
  }

  return { porNodo, problemas, ancho };
}

/**
 * Por qué no pinta nada, dicho con lo que sí hay en la página.
 *
 * «la regla `.tarjeta` no pinta nada» a secas no ayuda. «ninguna etiqueta
 * tiene `class="tarjeta"`; las clases que hay son `caja` y `aviso`» sí, porque
 * el error casi siempre es una letra.
 */
function pistaDeSelectorSinUso(sel: Selector, arbol: ArbolHtml): string {
  const ultima = sel.partes[sel.partes.length - 1];
  const clases = new Set<string>();
  const ids = new Set<string>();
  const etiquetas = new Set<string>();
  recorrerElementos(arbol.raiz, (e) => {
    etiquetas.add(e.etiqueta);
    if (e.atributos.id) ids.add(e.atributos.id);
    const c = e.atributos.class;
    if (c) for (const x of c.trim().split(/\s+/)) if (x !== '') clases.add(x);
  });

  if (ultima.clase !== null && !clases.has(ultima.clase)) {
    const hay = [...clases].slice(0, 5).join('», «');
    return hay === ''
      ? `ninguna etiqueta tiene «class="${ultima.clase}"»; todavía no hay ninguna clase en la página`
      : `ninguna etiqueta tiene «class="${ultima.clase}"»; las clases que hay son «${hay}»`;
  }
  if (ultima.identificador !== null && !ids.has(ultima.identificador)) {
    const hay = [...ids].slice(0, 5).join('», «');
    return hay === ''
      ? `ninguna etiqueta tiene «id="${ultima.identificador}"»; todavía no hay ningún identificador en la página`
      : `ninguna etiqueta tiene «id="${ultima.identificador}"»; los que hay son «${hay}»`;
  }
  if (ultima.etiqueta !== null && !etiquetas.has(ultima.etiqueta)) {
    return `no hay ningún «${ultima.etiqueta}» en la página`;
  }
  return sel.partes.length > 1 ? 'el elemento existe, pero no está dentro de lo que pide la primera parte del selector' : 'revisa que esté escrito igual en el HTML';
}

/* ── Pintar ─────────────────────────────────────────────────────────────────*/

const CAMEL = new Map<string, string>();

function aCamello(prop: string): string {
  const guardado = CAMEL.get(prop);
  if (guardado) return guardado;
  const camello = prop.replace(/-([a-z])/g, (_, l: string) => l.toUpperCase());
  CAMEL.set(prop, camello);
  return camello;
}

/**
 * El objeto de estilo de React, **el mismo mientras el estilo sea el mismo**.
 *
 * Aquí es donde se ve por qué se valida el valor en `analizarCss.ts`: lo que
 * entra en este objeto ya no lo mira nadie más. Todo lo que llega aquí pasó
 * por la tabla del subconjunto.
 *
 * Lo de devolver el mismo objeto no es elegancia: la cascada ya devuelve el
 * mismo `propiedades` por identidad cuando nada cambió, así que con esta
 * memoria React recibe **el mismísimo objeto de estilo** al repintar por
 * cualquier otra cosa —el ratón encima, un elemento elegido en el inspector—
 * y se salta la comparación propiedad a propiedad de los 300 elementos. En
 * jsdom eso se nota: poner un estilo cuesta ahí diez veces lo que cuesta
 * crear el elemento.
 */
const ESTILOS_REACT = new WeakMap<object, CSSProperties>();

export function estiloReact(propiedades: Readonly<Record<string, string>>): CSSProperties {
  const guardado = ESTILOS_REACT.get(propiedades);
  if (guardado !== undefined) return guardado;
  const salida: Record<string, string> = {};
  for (const [prop, valor] of Object.entries(propiedades)) salida[aCamello(prop)] = valor;
  const estilo = salida as CSSProperties;
  ESTILOS_REACT.set(propiedades, estilo);
  return estilo;
}
