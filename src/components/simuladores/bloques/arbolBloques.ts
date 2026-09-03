/**
 * TECNIA BLOQUES · EL ÁRBOL
 *
 * El modelo del programa que arma el alumno y las reglas de encaje. Puro: ni
 * React, ni DOM, ni `three`. Aquí no se ejecuta nada —eso es
 * `interpreteBloques.ts`— y aquí no se pinta nada —eso es `VentanaBloques.tsx`—.
 *
 * ── DE DÓNDE SALE ESTO ────────────────────────────────────────────────────
 *
 * De `n4/estudio/programaBloques.ts`, que ya servía a cuatro clases de N4·U3 y
 * al que sólo le faltaba dejar de ser de ellas. Lo que se generalizó, punto por
 * punto, está en la cabecera de `index.ts`. Lo que NO se tocó porque ya estaba
 * bien: que el modelo sea un dato inmutable, que la regla de encaje viva en UN
 * solo sitio —la pinta el editor ANTES de soltar y la aplica el modelo DESPUÉS,
 * y si fueran dos copias una zona se iluminaría para luego escupir la pieza— y
 * que el intérprete no viva dentro de un `useEffect`.
 *
 * ── LAS DOS DECISIONES QUE ORDENAN EL ARCHIVO ─────────────────────────────
 *
 * 1. **El vocabulario es abierto; el control, cerrado.** `accion` y `pregunta`
 *    son `string`: el armazón no sabe qué es «avanzar» ni «¿flecha derecha?», y
 *    por eso puede servir igual a un robot en cuadrícula, a una placa micro:bit
 *    y a un constructor de flujos. Lo que SÍ es una lista cerrada es la
 *    semántica de control (`si`, `repetir`, `mientras`, `llamar`…), porque eso
 *    no lo inventa cada actividad: es lo que significa programar.
 *
 * 2. **La forma se DERIVA de la semántica, nunca se declara.** Un hexágono es
 *    hexágono porque pregunta, y un bloque en C tiene boca porque abraza. Si la
 *    forma fuera un campo aparte, tarde o temprano habría una ficha con forma de
 *    orden y semántica de condición, y entonces la lección de la que cuelga
 *    media unidad —«una condición no es una orden, mírala»— sería mentira.
 */

/* ── el catálogo: lo que la actividad pone en la paleta ─────────────────────── */

/** Los valores que lleva un bloque en sus ranuras. El armazón no los interpreta. */
export type Args = Readonly<Record<string, string | number>>;

/**
 * Qué hace un bloque cuando le toca. Es la única lista cerrada del armazón.
 *
 * `valor` es el reportero —el óvalo que contesta un número— y a propósito NO
 * encaja en ningún sitio todavía: en N4·U3 esa pieza existe precisamente para
 * que el alumno intente meterla en el hueco hexagonal y descubra que no cabe.
 */
export type Semantica =
  | { tipo: 'sombrero' }
  | { tipo: 'accion' }
  | { tipo: 'condicion' }
  | { tipo: 'valor' }
  | { tipo: 'si' }
  | { tipo: 'si-sino' }
  | { tipo: 'repetir'; ranura?: string; veces?: number }
  | { tipo: 'mientras' }
  | { tipo: 'hasta' }
  | { tipo: 'por-siempre' }
  | { tipo: 'llamar'; ranura?: string }
  | { tipo: 'parar' };

export type FormaBloque = 'sombrero' | 'orden' | 'c' | 'c-doble' | 'hexagono' | 'reportero';

/** Un hueco de dato dentro de la etiqueta: el `10` de «repetir 10 veces». */
export interface RanuraFicha {
  id: string;
  tipo: 'numero' | 'texto';
  valor: string | number;
  /** Para el desplegable de «llamar a…» o «enviar mensaje…». */
  opciones?: readonly (string | number)[];
}

export interface FichaBloque {
  id: string;
  /** El id de una categoría de la actividad. El armazón no trae categorías. */
  categoria: string;
  etiqueta: string;
  semantica: Semantica;
  /**
   * El verbo que se emite al ejecutarla, o la pregunta que se hace. Por omisión
   * es el propio `id`, que es lo que quiere el 90 % de las fichas.
   */
  verbo?: string;
  ranuras?: readonly RanuraFicha[];
  /** El trozo de `etiqueta` que se pinta como óvalo: el nombre que puso el alumno. */
  ovalo?: string;
  /** Lo que el ayudante lee en voz alta al tocar la ficha. */
  lectura?: string;
  /**
   * La misma orden escrita en texto, para `n6-bloques-vs-codigo`: las dos
   * ventanas a la vez, línea contra bloque. Vive en la ficha y no en un
   * traductor aparte porque quien sabe cómo se dice «repetir 10 veces» en
   * Python es quien escribió la ficha, no el armazón.
   */
  texto?: string;
}

/* ── el programa que arma el alumno ────────────────────────────────────────── */

export interface BloquePuesto {
  id: string;
  /** El `id` de la ficha del catálogo que lo creó. */
  ficha: string;
  args?: Args;
  /** El hexágono encajado en el hueco. Sólo los bloques que preguntan lo tienen. */
  condicion?: BloquePuesto | null;
  /** Las bocas, por nombre: `cuerpo`, `sino`. Aquí está el anidamiento de verdad. */
  ramas?: Readonly<Record<string, BloquePuesto[]>>;
  /** Mueble de la actividad: no se quita ni se mueve (el `por siempre` de la vitrina). */
  fijo?: boolean;
}

/**
 * Un guion: un sombrero y lo que cuelga de él.
 *
 * El modelo viejo tenía UNA lista (`siempre`) más una zona de arranque, y con
 * eso no se pueden armar cuatro de las ocho actividades: un bloque propio es una
 * pila con nombre a la que otra llama, y un flujo de «cuando pase esto, haz esto
 * otro» es una pila por disparador.
 */
export interface Pila {
  id: string;
  /** El sombrero. `null` = una pila sin sombrero, que sólo corre si la llaman. */
  sombrero: BloquePuesto | null;
  /** Por este nombre la llaman `llamar` y `enviar mensaje`. */
  nombre?: string;
  bloques: BloquePuesto[];
}

export interface Programa {
  pilas: Pila[];
}

/* ── leer el catálogo ──────────────────────────────────────────────────────── */

export function fichaDe(catalogo: readonly FichaBloque[], id: string): FichaBloque | null {
  return catalogo.find((f) => f.id === id) ?? null;
}

/** El verbo que se emite o la pregunta que se hace. Ver `FichaBloque.verbo`. */
export function verboDe(ficha: FichaBloque): string {
  return ficha.verbo ?? ficha.id;
}

/** La forma sale de la semántica y no de un campo. Ver la cabecera. */
export function formaDe(ficha: FichaBloque): FormaBloque {
  switch (ficha.semantica.tipo) {
    case 'sombrero':
      return 'sombrero';
    case 'condicion':
      return 'hexagono';
    case 'valor':
      return 'reportero';
    case 'si-sino':
      return 'c-doble';
    case 'si':
    case 'repetir':
    case 'mientras':
    case 'hasta':
    case 'por-siempre':
      return 'c';
    default:
      return 'orden';
  }
}

/** Los nombres de las bocas de una ficha, en el orden en que se dibujan. */
export function ramasDe(ficha: FichaBloque): string[] {
  switch (ficha.semantica.tipo) {
    case 'si-sino':
      return ['cuerpo', 'sino'];
    case 'si':
    case 'repetir':
    case 'mientras':
    case 'hasta':
    case 'por-siempre':
      return ['cuerpo'];
    default:
      return [];
  }
}

/** ¿Lleva hueco hexagonal? Repetir N veces no pregunta nada; mientras, sí. */
export function admiteCondicion(ficha: FichaBloque): boolean {
  const t = ficha.semantica.tipo;
  return t === 'si' || t === 'si-sino' || t === 'mientras' || t === 'hasta';
}

/** Un bloque recién nacido de su ficha, con las ranuras a su valor de fábrica. */
export function nuevoBloque(
  catalogo: readonly FichaBloque[],
  fichaId: string,
  id: string,
): BloquePuesto | null {
  const ficha = fichaDe(catalogo, fichaId);
  if (!ficha) return null;
  const bloque: BloquePuesto = { id, ficha: fichaId };
  if (ficha.ranuras?.length) {
    const args: Record<string, string | number> = {};
    for (const r of ficha.ranuras) args[r.id] = r.valor;
    bloque.args = args;
  }
  const ramas = ramasDe(ficha);
  if (ramas.length) {
    const vacias: Record<string, BloquePuesto[]> = {};
    for (const r of ramas) vacias[r] = [];
    bloque.ramas = vacias;
  }
  if (admiteCondicion(ficha)) bloque.condicion = null;
  return bloque;
}

/* ── recorrer el árbol ─────────────────────────────────────────────────────── */

/** Todos los bloques de una pila, aplanados: tronco, bocas, huecos y sombrero. */
export function bloquesDe(pila: Pila): BloquePuesto[] {
  const salida: BloquePuesto[] = [];
  const meter = (b: BloquePuesto) => {
    salida.push(b);
    if (b.condicion) meter(b.condicion);
    for (const lista of Object.values(b.ramas ?? {})) lista.forEach(meter);
  };
  if (pila.sombrero) meter(pila.sombrero);
  pila.bloques.forEach(meter);
  return salida;
}

/** Todos los bloques del programa entero. */
export function recorrer(programa: Programa): BloquePuesto[] {
  return programa.pilas.flatMap(bloquesDe);
}

export function contarBloques(programa: Programa): number {
  return recorrer(programa).length;
}

export function buscarBloque(programa: Programa, id: string): BloquePuesto | null {
  return recorrer(programa).find((b) => b.id === id) ?? null;
}

export function pilaDe(programa: Programa, id: string): Pila | null {
  return programa.pilas.find((p) => p.id === id) ?? null;
}

/** ¿`id` cuelga de `raiz`, aunque sea de nieto? La raíz cuenta como suya. */
export function esDescendiente(raiz: BloquePuesto, id: string): boolean {
  if (raiz.id === id) return true;
  if (raiz.condicion && esDescendiente(raiz.condicion, id)) return true;
  for (const lista of Object.values(raiz.ramas ?? {})) {
    if (lista.some((b) => esDescendiente(b, id))) return true;
  }
  return false;
}

/* ── los sitios donde se puede soltar ──────────────────────────────────────── */

/**
 * Una dirección dentro del programa, como dato.
 *
 * Ésta es la pieza que hace comprobable el arrastre. El navegador sólo sabe
 * fabricar un `Sitio` a partir de dónde cayó el dedo; TODO lo demás —si cabe,
 * qué se rompe si no cabe, dónde queda— se decide sobre este dato, sin ratón.
 * Una prueba puede soltar cien bloques sin tocar el DOM, y el DOM no puede
 * inventarse un encaje distinto del que la prueba comprobó.
 */
export type Sitio =
  | { donde: 'pila'; pila: string; indice: number }
  | { donde: 'rama'; bloque: string; rama: string; indice: number }
  | { donde: 'hueco'; bloque: string };

/** Lo que se lleva en la mano: una ficha nueva de la paleta o un bloque ya puesto. */
export type Carga = { tipo: 'ficha'; id: string } | { tipo: 'bloque'; id: string };

export type MotivoRechazo =
  | 'ficha-desconocida'
  | 'sitio-inexistente'
  | 'aqui-no-cabe'
  | 'dentro-de-si-mismo'
  | 'no-se-mueve';

export type Encaje = { ok: true } | { ok: false; motivo: MotivoRechazo; aviso: string };

const CABE: Encaje = { ok: true };

function no(motivo: MotivoRechazo, aviso: string): Encaje {
  return { ok: false, motivo, aviso };
}

/** ¿Existe el sitio? Un sitio inventado es «lo soltó en el vacío». */
function existeSitio(programa: Programa, sitio: Sitio): boolean {
  if (sitio.donde === 'pila') return pilaDe(programa, sitio.pila) !== null;
  const duenio = buscarBloque(programa, sitio.bloque);
  if (!duenio) return false;
  if (sitio.donde === 'hueco') return true;
  return Object.prototype.hasOwnProperty.call(duenio.ramas ?? {}, sitio.rama);
}

/**
 * La regla de encaje, en un solo sitio y sin tocar el DOM.
 *
 * Contesta a «¿esta forma cabe aquí?» y nada más. Que la pieza esté BIEN puesta
 * no lo decide el encaje sino el reto: un `sumar 1` en el sitio equivocado tiene
 * que poder colocarse, porque ver el error es media lección. Si el encaje
 * juzgara, el alumno no podría equivocarse y no aprendería nada.
 */
export function cabeEn(
  programa: Programa,
  catalogo: readonly FichaBloque[],
  sitio: Sitio,
  fichaId: string,
): Encaje {
  const ficha = fichaDe(catalogo, fichaId);
  if (!ficha) return no('ficha-desconocida', 'Esa pieza no está en la paleta de este reto.');
  if (!existeSitio(programa, sitio)) {
    return no('sitio-inexistente', 'Ahí no hay dónde encajarla. Suéltala sobre un hueco del guion.');
  }

  const forma = formaDe(ficha);

  if (sitio.donde === 'hueco') {
    const duenio = buscarBloque(programa, sitio.bloque);
    const fichaDuenio = duenio ? fichaDe(catalogo, duenio.ficha) : null;
    if (!fichaDuenio || !admiteCondicion(fichaDuenio)) {
      return no('aqui-no-cabe', 'Ese bloque no pregunta nada, así que no tiene hueco.');
    }
    if (forma !== 'hexagono') {
      return no(
        'aqui-no-cabe',
        'En el hueco sólo entra una pregunta, y las preguntas son hexágonos.',
      );
    }
    return CABE;
  }

  if (forma === 'hexagono') {
    return no('aqui-no-cabe', 'Una pregunta no es una orden: va dentro del hueco, no en el guion.');
  }
  if (forma === 'reportero') {
    return no('aqui-no-cabe', 'Esto no se contesta con sí o con no: contesta un número. No encaja.');
  }
  if (forma === 'sombrero') {
    return no('aqui-no-cabe', 'El sombrero va arriba del todo: es el que arranca el programa.');
  }
  return CABE;
}

/**
 * Lo mismo, pero para un bloque que ya estaba puesto y se está mudando.
 *
 * Añade las dos maneras de romper el árbol que una ficha nueva no puede: meter
 * un bloque dentro de sí mismo —o dentro de un nieto suyo, que es la misma
 * trampa con un paso más— y mover un mueble de la actividad.
 */
export function puedeMoverse(
  programa: Programa,
  catalogo: readonly FichaBloque[],
  bloqueId: string,
  sitio: Sitio,
): Encaje {
  const bloque = buscarBloque(programa, bloqueId);
  if (!bloque) return no('sitio-inexistente', 'Ese bloque ya no está en el guion.');
  if (bloque.fijo) return no('no-se-mueve', 'Ese bloque es parte del programa y no se mueve.');

  if (sitio.donde !== 'pila' && esDescendiente(bloque, sitio.bloque)) {
    return no('dentro-de-si-mismo', 'Un bloque no puede meterse dentro de sí mismo.');
  }
  return cabeEn(programa, catalogo, sitio, bloque.ficha);
}

/* ── editar el árbol ───────────────────────────────────────────────────────── */

function clavar(indice: number, largo: number): number {
  if (!Number.isFinite(indice) || indice < 0) return 0;
  return Math.min(Math.trunc(indice), largo);
}

/** Aplica `f` al bloque `id` donde quiera que esté, y devuelve un programa nuevo. */
function conBloque(
  programa: Programa,
  id: string,
  f: (b: BloquePuesto) => BloquePuesto,
): Programa {
  const enBloque = (b: BloquePuesto): BloquePuesto => {
    let salida = b;
    if (b.condicion) {
      const hijo = enBloque(b.condicion);
      if (hijo !== b.condicion) salida = { ...salida, condicion: hijo };
    }
    if (b.ramas) {
      let cambio = false;
      const ramas: Record<string, BloquePuesto[]> = {};
      for (const [nombre, lista] of Object.entries(b.ramas)) {
        const nueva = lista.map(enBloque);
        if (nueva.some((n, i) => n !== lista[i])) cambio = true;
        ramas[nombre] = nueva;
      }
      if (cambio) salida = { ...salida, ramas };
    }
    return salida.id === id ? f(salida) : salida;
  };

  return {
    pilas: programa.pilas.map((p) => ({
      ...p,
      sombrero: p.sombrero ? enBloque(p.sombrero) : null,
      bloques: p.bloques.map(enBloque),
    })),
  };
}

/** Mete `bloque` en `sitio`. Da por hecho que el sitio existe y que cabe. */
function meterEn(programa: Programa, sitio: Sitio, bloque: BloquePuesto): Programa {
  if (sitio.donde === 'pila') {
    return {
      pilas: programa.pilas.map((p) => {
        if (p.id !== sitio.pila) return p;
        const lista = p.bloques.slice();
        lista.splice(clavar(sitio.indice, lista.length), 0, bloque);
        return { ...p, bloques: lista };
      }),
    };
  }
  if (sitio.donde === 'hueco') {
    return conBloque(programa, sitio.bloque, (b) => ({ ...b, condicion: bloque }));
  }
  return conBloque(programa, sitio.bloque, (b) => {
    const lista = (b.ramas?.[sitio.rama] ?? []).slice();
    lista.splice(clavar(sitio.indice, lista.length), 0, bloque);
    return { ...b, ramas: { ...b.ramas, [sitio.rama]: lista } };
  });
}

/** Saca el bloque `id` de donde esté. Vale igual para el tronco, la boca y el hueco. */
export function quitar(programa: Programa, id: string): Programa {
  const bloque = buscarBloque(programa, id);
  if (!bloque || bloque.fijo) return programa;

  const limpiar = (b: BloquePuesto): BloquePuesto => {
    let salida = b;
    if (b.condicion) {
      salida =
        b.condicion.id === id ? { ...salida, condicion: null } : { ...salida, condicion: limpiar(b.condicion) };
    }
    if (b.ramas) {
      const ramas: Record<string, BloquePuesto[]> = {};
      for (const [nombre, lista] of Object.entries(b.ramas)) {
        ramas[nombre] = lista.filter((h) => h.id !== id).map(limpiar);
      }
      salida = { ...salida, ramas };
    }
    return salida;
  };

  return {
    pilas: programa.pilas.map((p) => ({
      ...p,
      sombrero: p.sombrero ? limpiar(p.sombrero) : null,
      bloques: p.bloques.filter((b) => b.id !== id).map(limpiar),
    })),
  };
}

export interface ResultadoEdicion {
  programa: Programa;
  encaje: Encaje;
  /** El bloque que acabó puesto, si se puso alguno. */
  bloque: BloquePuesto | null;
}

/**
 * Suelta una ficha de la paleta en un sitio. Si no cabe, devuelve el programa
 * TAL CUAL y el porqué: quien la llama pinta el rebote y dice el aviso.
 */
export function soltarFicha(
  programa: Programa,
  catalogo: readonly FichaBloque[],
  sitio: Sitio,
  fichaId: string,
  nuevoId: string,
): ResultadoEdicion {
  const encaje = cabeEn(programa, catalogo, sitio, fichaId);
  if (!encaje.ok) return { programa, encaje, bloque: null };
  const bloque = nuevoBloque(catalogo, fichaId, nuevoId);
  if (!bloque) {
    return {
      programa,
      encaje: no('ficha-desconocida', 'Esa pieza no está en la paleta de este reto.'),
      bloque: null,
    };
  }
  return { programa: meterEn(programa, sitio, bloque), encaje, bloque };
}

/** Muda un bloque ya puesto. Se saca primero y se mete después, en ese orden. */
export function moverBloque(
  programa: Programa,
  catalogo: readonly FichaBloque[],
  bloqueId: string,
  sitio: Sitio,
): ResultadoEdicion {
  const encaje = puedeMoverse(programa, catalogo, bloqueId, sitio);
  if (!encaje.ok) return { programa, encaje, bloque: null };
  const bloque = buscarBloque(programa, bloqueId);
  if (!bloque) return { programa, encaje, bloque: null };
  /*
   * Sacar antes de meter, y no al revés, porque el índice del sitio se cuenta
   * sobre la lista SIN el bloque que se está mudando. Metiendo primero, mover
   * una pieza un puesto más abajo dentro de su propia lista la dejaba donde
   * estaba y parecía que el arrastre no funcionaba.
   */
  return { programa: meterEn(quitar(programa, bloqueId), sitio, bloque), encaje, bloque };
}

/** Cambia el valor de una ranura: el `10` de «repetir 10 veces». */
export function ponerArg(
  programa: Programa,
  bloqueId: string,
  ranura: string,
  valor: string | number,
): Programa {
  return conBloque(programa, bloqueId, (b) => ({ ...b, args: { ...b.args, [ranura]: valor } }));
}

/** El sitio como cadena, para comparar dos sitios y para las claves de React. */
export function claveSitio(sitio: Sitio): string {
  if (sitio.donde === 'pila') return `pila:${sitio.pila}:${sitio.indice}`;
  if (sitio.donde === 'hueco') return `hueco:${sitio.bloque}`;
  return `rama:${sitio.bloque}:${sitio.rama}:${sitio.indice}`;
}

export function mismoSitio(a: Sitio | null | undefined, b: Sitio | null | undefined): boolean {
  if (!a || !b) return false;
  return claveSitio(a) === claveSitio(b);
}

/**
 * ¿Cabe aquí lo que el alumno lleva en la mano?
 *
 * Es la MISMA pregunta que decide el rebote, y por eso la sombra verde de una
 * zona no puede mentir: si se ilumina, soltar funciona. La ventana la llama para
 * pintar y el modelo la llama para aceptar, pero el código es uno.
 */
export function admiteCarga(
  programa: Programa,
  catalogo: readonly FichaBloque[],
  sitio: Sitio,
  carga: Carga | null,
): boolean {
  if (!carga) return false;
  const encaje =
    carga.tipo === 'ficha'
      ? cabeEn(programa, catalogo, sitio, carga.id)
      : puedeMoverse(programa, catalogo, carga.id, sitio);
  return encaje.ok;
}

/* ── atajos para armar programas ───────────────────────────────────────────── */

/** Una pila con su sombrero y su cuerpo. Lo que escribe la actividad al arrancar. */
export function pila(id: string, sombrero: BloquePuesto | null, bloques: BloquePuesto[] = []): Pila {
  return { id, sombrero, bloques };
}

export function programaDe(...pilas: Pila[]): Programa {
  return { pilas };
}
