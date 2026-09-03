/**
 * Tecnia Hojas · `comandos.ts` — **TODO botón de la cinta, como DATO** (§45.6).
 *
 * Ésta es la decisión que hay que tomar el primer día, y está tomada aquí, en
 * el primer archivo de comandos que se escribe para esta sala, con dos clases
 * construidas en total y veintitrés por delante.
 *
 * Una macro **no es una función nueva**: es la lista de lo que el alumno acaba
 * de hacer, guardada, y ejecutarla es volver a aplicarla. En Tecnia Textos y en
 * Tecnia Diapositivas los comandos de la cinta son funciones sueltas
 * (`aplicar: (c) => …`), y una función no se puede guardar en un archivo ni
 * enseñar en una lista. Si esto se escribiera igual, la clase 55 —«graba tu
 * primera macro»— no se podría construir, y para entonces habría veintidós
 * clases encima.
 *
 * Por eso un gesto es esto y nada más:
 *
 *     { comando: 'escribir', args: { hoja: 'h1', celda: 'B1', crudo: '=SUMA(A1:A9)' } }
 *
 * y una macro es una lista de gestos. Con eso, **grabar es encender una bandera
 * y apuntar** (`Grabadora`, ocho líneas más abajo), el alumno puede *ver la
 * lista de lo que hizo* —que es pedagógicamente mucho mejor que enseñarle VBA—,
 * y la macro se guarda en un `.xlsm` porque es JSON y nada más.
 *
 * ── La regla que hace que una macro se pueda reproducir ─────────────────────
 *
 * **Un gesto lleva todo lo que necesita, y nada se inventa al reproducirlo.**
 * Los `args` son sólo cadenas y números —nada de funciones, nada de objetos, y
 * sobre todo **nada de relojes ni de azar**—. Por eso `nuevaHoja` recibe el
 * `id` que va a usar en vez de fabricárselo: una macro que inventa un
 * identificador al vuelo da un libro distinto cada vez que se reproduce, y
 * entonces la prueba del bloque 55 —«reproducir sobre el libro de partida da el
 * mismo libro»— no se puede escribir. Es la misma familia de razón por la que
 * `HOY()` recibe la hora en el contexto (`formula/funciones.ts`).
 *
 * ── Y el `$` no protege de una fila insertada ───────────────────────────────
 *
 * Está en `moverPorFilas` y es la fidelidad que más gente cree al revés: el
 * `$` de `$A$1` sólo manda al **copiar**. Si alguien inserta una fila encima,
 * `$A$1` pasa a ser `$A$2` — en Excel y aquí —, porque el dato se movió y la
 * referencia sigue al dato. Un `$` no es un ancla a un sitio de la hoja: es una
 * instrucción para la copiadora.
 */

import {
  aNumero,
  aTexto,
  celdaEn,
  comparar,
  conCelda,
  crudoEn,
  dir,
  dirAColFila,
  esError,
  hojaDe,
  hojaPorNombre,
  hojaVacia,
  letraDeColumna,
  clave,
  desplazar,
  partirClave,
  textoDeNumero,
  textoDeRef,
  COLUMNAS,
  FILAS,
  type Bordes,
  type Celda,
  type Clave,
  type Criterio,
  type Dinamica,
  type Filtro,
  type Formato,
  type Grafica,
  type Hoja,
  type Libro,
  type Minigrafico,
  type Proteccion,
  type Ref,
  type ReglaCondicional,
  type ResumenDeColumna,
  type Segmentacion,
  type Tabla,
  type TipoFormato,
  type TipoGrafica,
  type Valor,
  type Validacion,
  type Vinculo,
} from './modelo';
import { esFormula } from './formula/lexico';
import { escribirFormula, parsear, transformarRefs, type Nodo } from './formula/sintaxis';
import { conLibro, crearMotor, valorDeArbol, valorDe, valorDeTextoCrudo, type Motor } from './formula/calculo';
/*
 * `formatos.ts` **no** importa nada de `comandos.ts` —lee el libro, no lo
 * escribe—, así que esta dependencia va en un solo sentido, igual que la de
 * `Grafica.tsx`. Sólo se trae `motivoPatronInvalido`: la única pregunta que
 * el comando `formato-personalizado` necesita hacerle al patrón antes de
 * guardarlo.
 */
import { motivoPatronInvalido } from './formatos';
/*
 * **Sólo tipos**, y a propósito. `impresion.ts` —el que reparte las celdas en
 * hojas de papel— importa de aquí `cajaDeTexto` para leer el área de impresión,
 * o sea que la dependencia de verdad va en ese sentido y no en éste. Un
 * `import type` se borra al compilar y no cierra el círculo; traerse de allí
 * también los valores (los márgenes, el papel, la configuración de fábrica) sí
 * lo cerraría, y un círculo entre dos módulos no falla al compilar: falla al
 * arrancar, y sólo cuando alguien importa el otro primero.
 */
import type { ConfigGuardada, Orientacion, Tamano, TipoMargen } from './impresion';
/*
 * `ysi.ts` y `datos.ts` sí se traen de aquí **valores**, y no hay círculo que
 * cerrar: `ysi.ts` no importa nada de este archivo, y lo único que `datos.ts`
 * se trae de aquí es el TIPO `Caja` (`import type`), que se borra al compilar.
 * La dependencia de verdad va en un solo sentido —de `comandos.ts` hacia
 * ellos—, igual que la de `impresion.ts` va en el sentido contrario.
 */
import {
  resolverObjetivo,
  escenarioDe,
  fotoDe,
  conEscenarioGuardado,
  sinEscenario,
  pisaFormulas,
  hojasQueFaltan,
  celdasDeEscenario,
  type Escritor,
  type PeticionObjetivo,
} from './ysi';
import { leerCsv, filasQueQuedan, deducirPatron, SEPARADORES, type Separador } from './datos';
/*
 * `dinamica.ts` es el motor de las tablas dinámicas (bloques 49 y 50), y la
 * dependencia va en este sentido: de aquí hacia allí. Lo único que él se trae de
 * aquí es el TIPO `Caja` (`import type`, que se borra al compilar), igual que
 * `datos.ts`, así que no hay círculo.
 *
 * Los cuatro comandos de abajo no calculan ni una celda de la dinámica: eso es
 * de allí. Aquí sólo se guarda **la especificación** —de dónde come, qué cruza,
 * qué resume—, que es la decisión entera del paquete (`Dinamica`, en
 * `modelo.ts`). Y `zonasDeSoloLectura` es lo que necesita la guarda del final de
 * este archivo para que nadie escriba encima de lo que la dinámica pinta.
 */
import {
  anidado,
  camposDelOrigen,
  conCampo,
  conDinamica,
  conDinamicas,
  dinamicaDe,
  dinamicasDe,
  esZona,
  motivoDelOrigen,
  motivoDeSolape,
  refrescada,
  regionDeDinamica,
  todasLasDinamicas,
  zonasDeSoloLectura,
} from './dinamica';

/** Lo que el alumno hizo, en un dato. Una macro es una lista de esto. */
export interface Gesto {
  comando: string;
  args?: Record<string, string | number>;
}

export type ArgsDeGesto = Record<string, string | number>;

export interface Comando {
  nombre: string;
  /** Lo que dirá el botón de la cinta y lo que se lee en la lista de la macro. */
  etiqueta: (args: ArgsDeGesto) => string;
  aplicar: (libro: Libro, args: ArgsDeGesto) => Libro;
  /**
   * Qué celdas mueve, para que el motor recalcule sólo eso. `'todo'` es una
   * respuesta legítima —insertar una fila desplaza referencias por media hoja—
   * y es preferible a quedarse corto: un valor viejo en pantalla no se ve.
   */
  toca: (libro: Libro, args: ArgsDeGesto) => Clave[] | 'todo';
  /** Lo que Excel diría en un cuadro de diálogo antes de aceptar. `null` = adelante. */
  revisar?: (libro: Libro, args: ArgsDeGesto) => string | null;
}

/* ── leer los argumentos ────────────────────────────────────────────────────*/

const txt = (a: ArgsDeGesto, k: string, porDefecto = ''): string =>
  a[k] === undefined || a[k] === null ? porDefecto : String(a[k]);

const num = (a: ArgsDeGesto, k: string, porDefecto: number): number => {
  const v = Number(a[k]);
  return Number.isFinite(v) ? v : porDefecto;
};

const siNo = (a: ArgsDeGesto, k: string): boolean => a[k] === 1 || a[k] === '1' || a[k] === 'sí';

export interface Caja {
  c0: number;
  f0: number;
  c1: number;
  f1: number;
}

/** `"A1"`, `"A1:B5"` y `"B5:A1"` — los tres dan la misma caja normalizada. */
export function cajaDeTexto(t: string): Caja | null {
  const [a, b] = t.split(':');
  const p = dirAColFila(a ?? '');
  if (!p) return null;
  if (!b) return { c0: p.col, f0: p.fila, c1: p.col, f1: p.fila };
  const q = dirAColFila(b);
  if (!q) return null;
  return {
    c0: Math.min(p.col, q.col),
    f0: Math.min(p.fila, q.fila),
    c1: Math.max(p.col, q.col),
    f1: Math.max(p.fila, q.fila),
  };
}

export function clavesDeCaja(hoja: string, c: Caja): Clave[] {
  const ks: Clave[] = [];
  for (let f = c.f0; f <= c.f1; f += 1) for (let col = c.c0; col <= c.c1; col += 1) ks.push(clave(hoja, col, f));
  return ks;
}

/**
 * `"A1"` si es una celda; `"A1:B3"` si es un rango. Como lo escribe Excel.
 *
 * Vivía en `cinta.ts` y se mudó aquí el 15-ago-2026, con las celdas combinadas.
 * El motivo es de sitio, no de gusto: una combinación se **guarda** en el libro
 * escrita así (`Hoja.combinadas`), o sea que el motor ya no sólo lee cajas
 * escritas, también las escribe. Dejar la única función que las escribe en la
 * capa de los botones habría obligado a copiar sus tres líneas aquí abajo, y lo
 * que se copia se separa: el día que un rango se escribiera de otra manera
 * habría dos verdades sobre cómo se llama una caja. `cinta.ts` la sigue
 * exportando para quien la importaba de allí.
 */
export function textoDeCaja(c: Caja): string {
  const a = dir(c.c0, c.f0);
  const b = dir(c.c1, c.f1);
  return a === b ? a : `${a}:${b}`;
}

const cajaDeArgs = (a: ArgsDeGesto): Caja | null => cajaDeTexto(txt(a, 'rango'));

/* ── las celdas combinadas · bloque 10 ──────────────────────────────────────*/

/** Una combinación ya leída: dónde está y cuál de sus celdas manda. */
export interface Combinacion {
  caja: Caja;
  /** La celda de arriba a la izquierda: la única que conserva contenido. */
  ancla: string;
  /** Tal como está guardada en la hoja, para poder quitarla de la lista. */
  texto: string;
}

/** ¿Estas dos cajas comparten aunque sea una celda? */
export const seSolapan = (a: Caja, b: Caja): boolean =>
  a.c0 <= b.c1 && b.c0 <= a.c1 && a.f0 <= b.f1 && b.f0 <= a.f1;

/**
 * Las combinaciones de una hoja, ya leídas. Las que no se entienden se caen.
 *
 * Una entrada ilegible se ignora en vez de romper el libro: `combinadas` es un
 * dato que se guarda en el archivo y que puede venir de una versión anterior, y
 * una hoja que no se puede abrir es mucho peor que una combinación que se pierde.
 */
export function combinacionesDe(libro: Libro, hojaId: string): Combinacion[] {
  const lista = hojaDe(libro, hojaId)?.combinadas ?? [];
  const fuera: Combinacion[] = [];
  for (const texto of lista) {
    const caja = cajaDeTexto(texto);
    if (caja) fuera.push({ caja, ancla: dir(caja.c0, caja.f0), texto });
  }
  return fuera;
}

/** La combinación que cubre esta celda, sea su ancla o una de las tapadas. */
export function combinacionEn(libro: Libro, hojaId: string, col: number, fila: number): Combinacion | null {
  return (
    combinacionesDe(libro, hojaId).find(
      (m) => col >= m.caja.c0 && col <= m.caja.c1 && fila >= m.caja.f0 && fila <= m.caja.f1,
    ) ?? null
  );
}

/** Cambia la lista de combinadas de una hoja. Lista vacía ⇒ se quita la clave. */
function conCombinadas(libro: Libro, hojaId: string, textos: string[]): Libro {
  const h = hojaDe(libro, hojaId);
  if (!h) return libro;
  const hoja: Hoja = { ...h };
  if (textos.length) hoja.combinadas = textos;
  else delete hoja.combinadas;
  return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? hoja : x)) };
}

/* ── mover referencias ──────────────────────────────────────────────────────*/

/**
 * Copiar una fórmula NO es copiar su texto: `=B2*C2` una fila más abajo es
 * `=B3*C3`. Se mueve el árbol y se vuelve a escribir. Es el bloque 21 entero.
 *
 * Si la fórmula no se entiende se copia tal cual, sin tocarla. Un motor que
 * «arregla» al copiar lo que no supo leer es un motor que pierde trabajo del
 * alumno.
 */
export function desplazarCrudo(crudo: string, dCol: number, dFila: number): string {
  if (!esFormula(crudo)) return crudo;
  const a = parsear(crudo);
  if (!a.ok) return crudo;
  return `=${escribirFormula(transformarRefs(a.arbol, (r) => desplazar(r, dCol, dFila)))}`;
}

/**
 * Cómo se mueve **una** referencia cuando se insertan o se borran filas.
 *
 * Sale de dentro de `ajustarPorFilas` el 15-ago-2026, construyendo
 * `n7-referencias`, y no es un refactor de gusto: la regla hacía falta en **dos**
 * sitios y sólo la tenía uno (ver `ajustarNombres`). Copiarla habría dejado dos
 * reglas que se separan el día que alguien afine una.
 */
function moverPorFilas(r: Ref, filaDesde: number, delta: number): Ref | null {
  if (delta > 0) return r.fila >= filaDesde ? { ...r, fila: r.fila + delta } : r;
  if (r.fila >= filaDesde && r.fila < filaDesde - delta) return null;
  if (r.fila >= filaDesde - delta) return { ...r, fila: r.fila + delta };
  return r;
}

/** Lo mismo hacia los lados. */
function moverPorColumnas(r: Ref, colDesde: number, delta: number): Ref | null {
  if (delta > 0) return r.col >= colDesde ? { ...r, col: r.col + delta } : r;
  if (r.col >= colDesde && r.col < colDesde - delta) return null;
  if (r.col >= colDesde - delta) return { ...r, col: r.col + delta };
  return r;
}

/**
 * De qué hoja habla un rango con nombre: `Salida!B2:B9` → `h1`.
 *
 * El nombre se guarda con el **nombre** de la hoja delante (`nombrarRango`) y
 * sólo en la primera esquina, porque `textoDeRango` no lo repite en la segunda;
 * así que la segunda hereda la de la primera.
 */
function hojaDeUnNombre(libro: Libro, arbol: Nodo): string | null {
  const escrita =
    arbol.t === 'ref'
      ? arbol.ref.hoja
      : arbol.t === 'rango'
        ? (arbol.rango.desde.hoja ?? arbol.rango.hasta.hoja)
        : null;
  if (escrita === null) return libro.activa;
  return hojaPorNombre(libro, escrita)?.id ?? null;
}

/**
 * **Un rango con nombre también se muda** (bloque 22).
 *
 * Defecto encontrado el 15-ago-2026 construyendo `n7-referencias`, y de los que
 * no avisan: `ajustarPorFilas` reescribía las fórmulas de todas las hojas y
 * devolvía `{ ...libro, hojas }`, o sea que **`libro.nombres` pasaba de largo**.
 * Con `IVA → Recuerdos!E2`, insertar una fila arriba movía el 0.16 a `E3` y el
 * nombre se quedaba apuntando a `E2`, que ahora está vacía: las seis celdas que
 * decían `=D6*IVA` pasaban a valer **0**, sin un solo error en pantalla y sin
 * que nadie hubiera tocado una fórmula. Un cero mentiroso propagado por un
 * comando, que es justo lo que la clase 4 enseña a temer.
 *
 * La causa es de forma, no de aritmética: la regla de mover una referencia vivía
 * dentro del bucle de las celdas, así que el mapa de nombres —que es la otra
 * cosa del libro hecha de referencias— no tenía cómo pedirla prestada.
 */
function ajustarNombres(
  libro: Libro,
  hojaAfectada: string,
  mover: (r: Ref) => Ref | null,
): Record<string, string> {
  let cambio = false;
  const fuera: Record<string, string> = {};
  for (const [nombre, texto] of Object.entries(libro.nombres)) {
    const a = parsear(texto);
    if (!a.ok || hojaDeUnNombre(libro, a.arbol) !== hojaAfectada) {
      fuera[nombre] = texto;
      continue;
    }
    const nuevo = escribirFormula(transformarRefs(a.arbol, mover));
    fuera[nombre] = nuevo;
    cambio = cambio || nuevo !== texto;
  }
  // El MISMO objeto cuando no se movió nada: hay pruebas que comparan libros
  // enteros con `toEqual` y no tiene por qué aparecer un mapa nuevo cada vez.
  return cambio ? fuera : libro.nombres;
}

/**
 * Reescribe las fórmulas de TODO el libro después de insertar o borrar filas.
 *
 * `delta > 0` inserta; `delta < 0` borra. Las referencias que apuntaban dentro
 * de lo borrado se quedan en `#¡REF!` **dentro de la fórmula**, visibles, que es
 * de donde sale el error que la clase 47 enseña a rastrear.
 */
function ajustarPorFilas(libro: Libro, hojaAfectada: string, filaDesde: number, delta: number): Libro {
  const hojas = libro.hojas.map((h) => {
    const celdas: Record<string, Celda> = {};
    for (const [d, celda] of Object.entries(h.celdas)) {
      if (!esFormula(celda.crudo)) {
        celdas[d] = celda;
        continue;
      }
      const a = parsear(celda.crudo);
      if (!a.ok) {
        celdas[d] = celda;
        continue;
      }
      const arbol = transformarRefs(a.arbol, (r: Ref): Ref | null => {
        const destino = r.hoja === null ? h.id : (hojaPorNombre(libro, r.hoja)?.id ?? null);
        return destino === hojaAfectada ? moverPorFilas(r, filaDesde, delta) : r;
      });
      celdas[d] = { ...celda, crudo: `=${escribirFormula(arbol)}` };
    }
    return { ...h, celdas };
  });
  return {
    ...libro,
    hojas,
    nombres: ajustarNombres(libro, hojaAfectada, (r) => moverPorFilas(r, filaDesde, delta)),
  };
}

/**
 * Lo mismo hacia los lados. Construido el 14-ago-2026 con la clase
 * `n5-celdas-filas-columnas`, que es la dueña del bloque 12.
 *
 * Se escribe aparte y no se generaliza a un `ajustarPorEje(eje)` a propósito:
 * el ahorro serían seis líneas y el precio, que la única función que reescribe
 * TODAS las fórmulas del libro pase a tener un parámetro que decide cuál de las
 * dos coordenadas toca. Una equivocación ahí no da error: da un libro con las
 * fórmulas movidas por el eje que no era, y eso se ve tres clases después.
 */
function ajustarPorColumnas(libro: Libro, hojaAfectada: string, colDesde: number, delta: number): Libro {
  const hojas = libro.hojas.map((h) => {
    const celdas: Record<string, Celda> = {};
    for (const [d, celda] of Object.entries(h.celdas)) {
      if (!esFormula(celda.crudo)) {
        celdas[d] = celda;
        continue;
      }
      const a = parsear(celda.crudo);
      if (!a.ok) {
        celdas[d] = celda;
        continue;
      }
      const arbol = transformarRefs(a.arbol, (r: Ref): Ref | null => {
        const destino = r.hoja === null ? h.id : (hojaPorNombre(libro, r.hoja)?.id ?? null);
        return destino === hojaAfectada ? moverPorColumnas(r, colDesde, delta) : r;
      });
      celdas[d] = { ...celda, crudo: `=${escribirFormula(arbol)}` };
    }
    return { ...h, celdas };
  });
  return {
    ...libro,
    hojas,
    nombres: ajustarNombres(libro, hojaAfectada, (r) => moverPorColumnas(r, colDesde, delta)),
  };
}

/** Mueve las celdas de sitio. Lo de arriba movía a quién apuntan; esto, dónde están. */
function moverFilas(libro: Libro, hojaId: string, filaDesde: number, delta: number): Libro {
  const h = hojaDe(libro, hojaId);
  if (!h) return libro;
  const celdas: Record<string, Celda> = {};
  for (const [d, celda] of Object.entries(h.celdas)) {
    const p = dirAColFila(d);
    if (!p) continue;
    if (delta > 0) {
      celdas[p.fila >= filaDesde ? dir(p.col, p.fila + delta) : d] = celda;
      continue;
    }
    if (p.fila >= filaDesde && p.fila < filaDesde - delta) continue; // se borró
    celdas[p.fila >= filaDesde - delta ? dir(p.col, p.fila + delta) : d] = celda;
  }
  return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? { ...x, celdas } : x)) };
}

function moverColumnas(libro: Libro, hojaId: string, colDesde: number, delta: number): Libro {
  const h = hojaDe(libro, hojaId);
  if (!h) return libro;
  const celdas: Record<string, Celda> = {};
  for (const [d, celda] of Object.entries(h.celdas)) {
    const p = dirAColFila(d);
    if (!p) continue;
    if (delta > 0) {
      celdas[p.col >= colDesde ? dir(p.col + delta, p.fila) : d] = celda;
      continue;
    }
    if (p.col >= colDesde && p.col < colDesde - delta) continue; // se borró
    celdas[p.col >= colDesde - delta ? dir(p.col + delta, p.fila) : d] = celda;
  }
  return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? { ...x, celdas } : x)) };
}

/* ── el formato de la celda · bloques 6, 9 y 10 ─────────────────────────────*/

/**
 * Los lados que le tocan a UNA celda, según lo que se pidió y dónde está.
 *
 * Tres presentes y las cuatro caras sueltas, que son las siete entradas del
 * desplegable de bordes de Excel que esta sala enseña:
 *
 *   · `todos` ...... las cuatro caras de cada celda marcada.
 *   · `contorno` ... sólo el marco de lo marcado: la celda de en medio no lleva
 *     ninguna y la de la esquina lleva dos. Por eso hace falta la caja aquí y
 *     por eso `Bordes` no guarda la palabra «contorno» (ver `modelo.ts`).
 *   · `ninguno` .... se quitan.
 *   · `arriba`, `abajo`, `izquierda`, `derecha` ... esa cara en cada celda.
 *
 * **Reserva escrita a propósito:** aquí cada elección SUSTITUYE a la anterior en
 * las celdas marcadas. En Excel los presets se suman —poner «contorno» encima de
 * «todos» deja los de dentro puestos— y aquí no: elegir contorno deja el marco y
 * limpia lo de dentro. Se elige sustituir porque es lo que un alumno puede
 * deshacer con el mismo botón —vuelve a elegir y vuelve a quedar como quería—,
 * mientras que un borde que se suma sólo se quita con «Sin borde» y a toda la
 * selección. Cuando una clase pida sumar, se cambia aquí y en ningún otro sitio.
 */
export function ladosDeBorde(peticion: string, caja: Caja, col: number, fila: number): Bordes | null {
  const b: Bordes = {};
  if (peticion === 'todos') {
    return { arriba: true, abajo: true, izquierda: true, derecha: true };
  }
  if (peticion === 'contorno') {
    if (fila === caja.f0) b.arriba = true;
    if (fila === caja.f1) b.abajo = true;
    if (col === caja.c0) b.izquierda = true;
    if (col === caja.c1) b.derecha = true;
    return Object.keys(b).length ? b : null;
  }
  // Una lista de caras, que es lo que manda la brocha al soltar un formato
  // copiado: `"arriba+abajo"`. `ninguno` —y cualquier cosa que no se entienda—
  // deja la celda sin bordes, que es la única respuesta que no inventa nada.
  for (const lado of peticion.split('+')) {
    if (lado === 'arriba' || lado === 'abajo' || lado === 'izquierda' || lado === 'derecha') b[lado] = true;
  }
  return Object.keys(b).length ? b : null;
}

/** Los lados de una celda, escritos como los lee `ladosDeBorde`. */
export const textoDeBordes = (b: Bordes | undefined): string =>
  b === undefined
    ? 'ninguno'
    : (['arriba', 'abajo', 'izquierda', 'derecha'] as const).filter((l) => b[l]).join('+') || 'ninguno';

/**
 * El formato de una celda **entero, como argumentos de un gesto**.
 *
 * Es lo que suelta la brocha (`copiar-formato`), y por eso lleva TODOS los
 * campos aunque estén apagados: la brocha de Excel no añade pinta, **la
 * sustituye**, así que soltarla sobre una celda en negrita tiene que quitarle la
 * negrita si la de origen no la tenía. Un juego de argumentos con sólo lo que
 * está puesto sabría poner y no sabría quitar — que es exactamente la reserva
 * que `cinta.ts` dejó escrita al ordenar filas con formato.
 *
 * Y la pinta viaja **dentro del gesto**, no como el domicilio de la celda de la
 * que se cargó. Es la regla de la cabecera: una brocha guardada en una macro
 * tiene que soltar la misma pinta el año que viene, aunque la celda de origen ya
 * no exista o la hayan repintado de otro color.
 */
export function argsDeFormato(f: Formato | null | undefined): ArgsDeGesto {
  return {
    tipo: f?.tipo ?? 'general',
    decimales: f?.decimales ?? -1,
    negrita: f?.negrita ? 1 : 0,
    cursiva: f?.cursiva ? 1 : 0,
    subrayado: f?.subrayado ? 1 : 0,
    ajustarTexto: f?.ajustarTexto ? 1 : 0,
    alineacion: f?.alineacion ?? '',
    colorLetra: f?.colorLetra ?? '',
    colorRelleno: f?.colorRelleno ?? '',
    bordes: textoDeBordes(f?.bordes),
  };
}

/**
 * El formato que queda tras aplicar unos argumentos sobre el que había.
 *
 * Un argumento que no viene **no se toca** —así el botón de negrita no borra el
 * color— y un argumento vacío **quita**: `alineacion: ''` devuelve la celda a la
 * alineación que le toca por su tipo, y `colorRelleno: ''` es el «Sin relleno»
 * de la paleta de Excel. Sin ese vacío no habría manera de desandar un color: el
 * botón sabría pintar y no sabría despintar, y el alumno se quedaría con
 * deshacer como única salida.
 */
function formatoNuevo(
  previo: Formato | undefined,
  a: ArgsDeGesto,
  caja: Caja,
  col: number,
  fila: number,
): Formato | undefined {
  const f: Formato = { ...(previo ?? { tipo: 'general' }) };
  if (a.tipo !== undefined) f.tipo = txt(a, 'tipo') as TipoFormato;
  // `-1` es «quítale los decimales que le hayas puesto», que es lo que manda la
  // brocha cuando el formato de origen no dice nada de decimales.
  if (a.decimales !== undefined) {
    const d = num(a, 'decimales', 2);
    if (d < 0) delete f.decimales;
    else f.decimales = d;
  }
  /*
   * Un interruptor apagado **borra su campo** en vez de guardar un `false`, y no
   * es pulcritud: `conCelda` borra del mapa la celda que no tiene ni contenido
   * ni formato (`modelo.ts`), así que una celda vacía a la que se le quitó la
   * negrita con un `negrita: false` dentro seguiría existiendo para siempre. Y
   * una celda que existe sin nada dentro es la que hace que `CONTARA` y las
   * pruebas que comparan libros enteros empiecen a ver cosas que no están.
   */
  marcar(f, 'negrita', a.negrita, siNo(a, 'negrita'));
  marcar(f, 'cursiva', a.cursiva, siNo(a, 'cursiva'));
  marcar(f, 'subrayado', a.subrayado, siNo(a, 'subrayado'));
  marcar(f, 'ajustarTexto', a.ajustarTexto, siNo(a, 'ajustarTexto'));
  if (a.alineacion !== undefined) {
    const al = txt(a, 'alineacion');
    if (al === '') delete f.alineacion;
    else f.alineacion = al as Formato['alineacion'];
  }
  if (a.colorLetra !== undefined) {
    const c = txt(a, 'colorLetra');
    if (c === '') delete f.colorLetra;
    else f.colorLetra = c;
  }
  if (a.colorRelleno !== undefined) {
    const c = txt(a, 'colorRelleno');
    if (c === '') delete f.colorRelleno;
    else f.colorRelleno = c;
  }
  if (a.bordes !== undefined) {
    const b = ladosDeBorde(txt(a, 'bordes'), caja, col, fila);
    if (b) f.bordes = b;
    else delete f.bordes;
  }
  // Un formato que ya no dice nada **no es un formato**: se devuelve `undefined`
  // para que la celda vacía se borre del mapa en vez de quedarse de fantasma.
  return Object.keys(f).length === 1 && f.tipo === 'general' ? undefined : f;
}

/** Pone la marca, la quita, o no toca nada si el gesto no la traía. */
function marcar(f: Formato, campo: 'negrita' | 'cursiva' | 'subrayado' | 'ajustarTexto', dado: unknown, valor: boolean) {
  if (dado === undefined) return;
  if (valor) f[campo] = true;
  else delete f[campo];
}

/* ── la tabla · bloques 33, 34, 35 y 36 ──────────────────────────────────────
 *
 * **La decisión cara ya está tomada (§45, el encargo del paquete TABLAS) y
 * aquí sólo se implementa: no se cambia la multiplicación `fila * ALTO_FILA`,
 * se cambia lo que se multiplica.** `Hoja.visibles` (`modelo.ts`) es esa
 * traducción ya hecha, y `puestoDeFila`/`filaEnPuesto` son sus dos únicas
 * puertas. Los cuatro comandos que esconden o enseñan filas —`filtrar`,
 * `quitar-filtros`, `ocultar-filas`, `mostrar-filas`— son los ÚNICOS que
 * escriben esa clave, y la recalculan entera cada vez: `visibles` se DERIVA,
 * no se mantiene a mano en veinte sitios.
 */

const tablasDe = (libro: Libro, hojaId: string): Tabla[] => hojaDe(libro, hojaId)?.tablas ?? [];

const tablaDe = (libro: Libro, hojaId: string, id: string): Tabla | null =>
  tablasDe(libro, hojaId).find((t) => t.id === id) ?? null;

/** Cambia la lista de tablas de una hoja. Lista vacía ⇒ se quita la clave. */
function conTablas(libro: Libro, hojaId: string, tablas: Tabla[]): Libro {
  const h = hojaDe(libro, hojaId);
  if (!h) return libro;
  const hoja: Hoja = { ...h };
  if (tablas.length) hoja.tablas = tablas;
  else delete hoja.tablas;
  return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? hoja : x)) };
}

/** Cambia una tabla y deja las demás como el mismo objeto. Como `conGrafica`. */
function conTabla(libro: Libro, hojaId: string, id: string, cambiar: (t: Tabla) => Tabla): Libro {
  const antes = tablasDe(libro, hojaId);
  if (!antes.some((t) => t.id === id)) return libro;
  return conTablas(
    libro,
    hojaId,
    antes.map((t) => (t.id === id ? cambiar(t) : t)),
  );
}

/** Cambia la lista de filas visibles de una hoja. `undefined` ⇒ se quita la clave. */
function conVisibles(libro: Libro, hojaId: string, visibles: number[] | undefined): Libro {
  const h = hojaDe(libro, hojaId);
  if (!h) return libro;
  const hoja: Hoja = { ...h };
  if (visibles) hoja.visibles = visibles;
  else delete hoja.visibles;
  return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? hoja : x)) };
}

/**
 * Hasta dónde llega esta hoja, para `filtrar`/`ocultar-filas`/`mostrar-filas`:
 * la fila más alta que alguna tabla, alguna celda escrita o el propio pedido
 * necesitan.
 *
 * **No es la 1.048.576.** Más allá de esta frontera no hay ninguna tabla que
 * filtrar ni ninguna celda escrita, así que enumerar «todas visibles» hasta
 * el final de la rejilla sería construir un array de un millón de números
 * para no decir nada que la ausencia de la clave no dijera ya. Es la misma
 * familia de decisión que la memoria de `letraDeColumna` en `modelo.ts`:
 * gastar donde el coste es real y en ningún otro sitio.
 */
function extensionDeHoja(h: Hoja, ademas: number[] = []): number {
  let max = -1;
  for (const t of h.tablas ?? []) {
    const c = cajaDeTexto(t.rango);
    if (c) max = Math.max(max, c.f1);
  }
  for (const d of Object.keys(h.celdas)) {
    const p = dirAColFila(d);
    if (p) max = Math.max(max, p.fila);
  }
  for (const f of h.visibles ?? []) max = Math.max(max, f);
  for (const f of ademas) max = Math.max(max, f);
  return max;
}

/**
 * ¿Esta celda pasa el filtro de su columna? Lee el valor CALCULADO —con un
 * motor temporal que quien llama ya se ha fabricado—, no el crudo: un
 * filtro sobre una columna de fórmulas filtra por lo que la celda ENSEÑA,
 * igual que en Excel de verdad.
 */
function pasaFiltro(motor: Motor, hojaId: string, col: number, fila: number, filtro: Filtro): boolean {
  const v = valorDe(motor, hojaId, col, fila);
  if (filtro.valores) {
    const t = aTexto(v).toLowerCase();
    return filtro.valores.some((x) => x.toLowerCase() === t);
  }
  if (filtro.comparacion) {
    const { op, contra } = filtro.comparacion;
    if (op === 'contiene') return aTexto(v).toLowerCase().includes(contra.toLowerCase());
    if (op === 'entre') {
      const [d, h2] = contra.split('|').map(Number);
      const n = aNumero(v);
      return typeof n === 'number' && Number.isFinite(d) && Number.isFinite(h2) && n >= Math.min(d, h2) && n <= Math.max(d, h2);
    }
    const n = aNumero(v);
    const c = Number(contra);
    if (typeof n !== 'number' || !Number.isFinite(c)) return false;
    if (op === 'mayor') return n > c;
    if (op === 'menor') return n < c;
    if (op === 'igual') return n === c;
  }
  return true;
}

/**
 * Recalcula qué filas se ven en TODA la hoja, a partir de los filtros de sus
 * tablas. Es el único sitio que construye `Hoja.visibles` a partir de un
 * filtro —`ocultar-filas`/`mostrar-filas` lo tocan directamente, sin pasar
 * por aquí, porque no hablan de filtros: hablan de filas que alguien pidió
 * esconder a mano.
 *
 * **Reserva escrita a propósito:** esto reemplaza cualquier fila que
 * estuviera oculta A MANO dentro del tramo que recalcula — filtrar una tabla
 * después de ocultar una fila a mano se olvida de que esa fila estaba oculta.
 * Es la interacción entre dos herramientas distintas que ningún bloque del
 * temario cruza todavía; el día que lo haga, aquí es donde se decide cuál
 * manda.
 *
 * El encabezado de una tabla **nunca** se esconde, filtrada o no: es lo que
 * hace Excel y es lo que permite seguir viendo por qué columna se está
 * filtrando.
 */
function recalcularVisibles(libro: Libro, hojaId: string): Libro {
  const h = hojaDe(libro, hojaId);
  if (!h) return libro;
  const conFiltro = (h.tablas ?? []).filter((t) => t.filtros && Object.keys(t.filtros).length);
  if (!conFiltro.length) return conVisibles(libro, hojaId, undefined);
  const motor = crearMotor(libro);
  const extension = extensionDeHoja(h);
  const visibles: number[] = [];
  for (let f = 0; f <= extension; f += 1) {
    const tabla = (h.tablas ?? []).find((t) => {
      const c = cajaDeTexto(t.rango);
      return !!c && f >= c.f0 && f <= c.f1;
    });
    if (!tabla || !tabla.filtros) {
      visibles.push(f);
      continue;
    }
    const c = cajaDeTexto(tabla.rango) as Caja;
    if (f === c.f0) {
      visibles.push(f); // el encabezado nunca se esconde
      continue;
    }
    const pasa = Object.entries(tabla.filtros).every(([col, filtro]) => pasaFiltro(motor, hojaId, Number(col), f, filtro));
    if (pasa) visibles.push(f);
  }
  // `extension` se acaba de recalcular DESDE CERO —de las tablas y las
  // celdas de HOY, no de ningún `visibles` viejo—, así que compararla con lo
  // que salió es una prueba honesta de «no se escondió nada»: a diferencia de
  // `mostrar-filas` (más abajo), aquí no hay manera de que la cuenta mienta
  // por una fila escondida más allá de donde ya nadie mira.
  return conVisibles(libro, hojaId, visibles.length === extension + 1 ? undefined : visibles);
}

/** `"5000|B3"` con otra cara: la lista de valores o la comparación de un filtro. */
function filtroDeArgs(a: ArgsDeGesto): Filtro | null {
  const valoresTxt = txt(a, 'valores');
  if (valoresTxt) {
    const valores = valoresTxt
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    return valores.length ? { valores } : null;
  }
  const op = txt(a, 'op');
  const contra = txt(a, 'contra');
  return op && contra ? { comparacion: { op, contra } } : null;
}

/** `"2-1,0-0"` → ordenar primero por la columna 2 descendente, luego por la 0 ascendente. */
function criteriosDeArgs(v: string): Criterio[] | null {
  const partes = v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!partes.length) return null;
  const criterios: Criterio[] = [];
  for (const p of partes) {
    const m = /^(\d+)-([01])$/.exec(p);
    if (!m) return null;
    criterios.push({ col: Number(m[1]), desc: m[2] === '1' });
  }
  return criterios;
}

const RESUMENES: readonly ResumenDeColumna[] = ['suma', 'promedio', 'cuenta', 'max', 'min', 'ninguno'];

/**
 * **Una tabla crece sola** cuando se escribe justo debajo de su última fila,
 * en una columna que ya era suya — es la mitad de por qué existen las
 * tablas, y por eso vive aquí, dentro de `escribir`, y no como un comando
 * aparte: sólo `escribir` sabe en qué momento exacto se acaba de teclear ahí.
 *
 * Camino rápido para las mil y pico celdas que se escriben SIN ninguna tabla
 * cerca: `h?.tablas?.length` corta antes de mirar una sola tabla, así que
 * este comando —el más usado de toda la sala— no paga nada por una hoja que
 * no tiene tablas.
 *
 * Si la tabla que creció tenía algún filtro puesto, la fila nueva se
 * recalcula con las demás (`recalcularVisibles`): entra visible sólo si de
 * verdad pasa el filtro, que es lo único honesto — inventar que «lo que
 * acabas de escribir siempre se ve» mentiría en cuanto se filtrara nada.
 */
function crecerTablaSiToca(libro: Libro, hojaId: string, col: number, fila: number): Libro {
  const h = hojaDe(libro, hojaId);
  if (!h?.tablas?.length) return libro;
  const t = h.tablas.find((tt) => {
    const c = cajaDeTexto(tt.rango);
    return !!c && fila === c.f1 + 1 && col >= c.c0 && col <= c.c1;
  });
  if (!t) return libro;
  const c = cajaDeTexto(t.rango) as Caja;
  const conTablaCrecida = conTabla(libro, hojaId, t.id, (tt) => ({ ...tt, rango: textoDeCaja({ ...c, f1: c.f1 + 1 }) }));
  return recalcularVisibles(conTablaCrecida, hojaId);
}

/* ── el pegado, y sus tres modos · bloque 11 ────────────────────────────────*/

/** Las tres pestañas del cuadro «Pegado especial» que esta sala llega a enseñar. */
export type ModoPegado = 'todo' | 'valores' | 'formato';

const MODOS_DE_PEGADO: readonly string[] = ['todo', 'valores', 'formato'];

const modoDe = (a: ArgsDeGesto): ModoPegado => {
  const m = txt(a, 'modo', 'todo');
  return (MODOS_DE_PEGADO.includes(m) ? m : 'todo') as ModoPegado;
};

/**
 * Un valor calculado, escrito como si el alumno lo hubiera tecleado.
 *
 * Es la mitad difícil de «pegar valores»: la celda destino deja de guardar una
 * regla y guarda **lo que la de origen enseñaba**, así que hay que volver del
 * valor al crudo. `aTexto` hace las tres conversiones normales —número con los
 * quince dígitos que enseña la hoja, `VERDADERO`/`FALSO`, vacío a cadena
 * vacía—; el error va aparte y con `=` delante porque **un error sólo se puede
 * guardar como fórmula constante**: `#¡DIV/0!` tecleado a secas es TEXTO en este
 * modelo (`valorDeTextoCrudo`), se vería idéntico en pantalla y dejaría de ser
 * un error para `SI.ERROR` y para la auditoría — la peor forma de fallar, la que
 * no se ve. Es el mismo `=#¡REF!` que ya escribe `ajustarPorFilas`.
 */
const crudoDeValor = (v: Valor): string => (esError(v) ? `=${v.error}` : aTexto(v));

/**
 * Dónde cae de verdad lo pegado.
 *
 * Con **una celda seleccionada**, lo pegado ocupa lo que ocupaba el origen: se
 * marca `F2`, se pega un `D2:D6` y se llena `F2:F6`. Es lo que hace Excel y lo
 * que hace todo el mundo al pegar. Estaba sin escribir y no se notaba —pegar de
 * menos sólo deja celdas sin llenar—, pero **con `cortar` sí se nota**: el
 * `borrar` que va detrás vacía el origen entero, así que pegar una celda de las
 * cinco y borrar las cinco es perder cuatro. Un defecto que sólo aparece al
 * juntar dos comandos que por separado parecían bien.
 *
 * Con un destino de varias celdas se respeta lo marcado, que es lo que permite
 * el mosaico: marcar `F2:F11` y pegar `F2:F6` dos veces seguidas.
 */
function cajaDePegado(origen: Caja, destino: Caja): Caja {
  if (destino.c0 !== destino.c1 || destino.f0 !== destino.f1) return destino;
  return {
    c0: destino.c0,
    f0: destino.f0,
    c1: destino.c0 + (origen.c1 - origen.c0),
    f1: destino.f0 + (origen.f1 - origen.f0),
  };
}

/** Lo que hay que saber de UNA celda para pegarla, sea cual sea el modo. */
interface Pegada {
  /** La celda de origen. `null` si ahí no había nada. */
  fuente: Celda | null;
  /** Lo que ya había en el destino. `null` si estaba vacío. */
  previa: Celda | null;
  /** El desplazamiento del origen al destino, para mover las referencias. */
  dCol: number;
  dFila: number;
  trasladar: boolean;
  /** El valor que la celda de origen enseñaba. Sólo lo mira el modo `valores`. */
  valor: Valor;
}

/**
 * Los tres modos, en tabla y no en un `switch`, porque cada uno se lee entero de
 * un vistazo y así se ve **qué respeta cada uno**:
 *
 *   · `todo` ....... llega el contenido y el formato del origen. El de siempre.
 *   · `valores` .... llega el valor congelado y **se respeta el formato que ya
 *     tenía el destino**, que es lo que hace Excel: pegar valores no repinta.
 *   · `formato` .... llega el formato y **no se toca el contenido**. Es la
 *     brocha, y por eso `toca` puede decir `[]`.
 */
const PEGADORES: Record<ModoPegado, (p: Pegada) => Celda | null> = {
  todo: (p) =>
    p.fuente
      ? { ...p.fuente, crudo: p.trasladar ? desplazarCrudo(p.fuente.crudo, p.dCol, p.dFila) : p.fuente.crudo }
      : null,
  valores: (p) => {
    const crudo = p.fuente ? crudoDeValor(p.valor) : '';
    return p.previa?.formato ? { crudo, formato: p.previa.formato } : { crudo };
  },
  formato: (p) => {
    const crudo = p.previa?.crudo ?? '';
    if (p.fuente?.formato) return { crudo, formato: p.fuente.formato };
    return crudo === '' ? null : { crudo };
  },
};

/**
 * Rellenar o pegar: el origen se estampa sobre el destino.
 *
 * `opciones` llegó el 14-ago-2026 con el pegado especial y **por omisión no
 * cambia nada**: sin ella se pega todo y se trasladan las referencias, que es lo
 * que hacían `rellenarAbajo`, `rellenarDerecha` y `pegar` desde el primer día.
 */
function estampar(
  libro: Libro,
  hojaId: string,
  origen: Caja,
  destino: Caja,
  opciones: { modo?: ModoPegado; trasladar?: boolean; valor?: (col: number, fila: number) => Valor } = {},
): Libro {
  const h = hojaDe(libro, hojaId);
  if (!h) return libro;
  const pegador = PEGADORES[opciones.modo ?? 'todo'];
  const trasladar = opciones.trasladar ?? true;
  let out = libro;
  const anchoOrigen = origen.c1 - origen.c0 + 1;
  const altoOrigen = origen.f1 - origen.f0 + 1;
  for (let f = destino.f0; f <= destino.f1; f += 1) {
    for (let c = destino.c0; c <= destino.c1; c += 1) {
      if (f >= origen.f0 && f <= origen.f1 && c >= origen.c0 && c <= origen.c1) continue;
      // El origen se repite en mosaico, como hace Excel al arrastrar el cuadrito.
      const oc = origen.c0 + ((c - destino.c0) % anchoOrigen);
      const of = origen.f0 + ((f - destino.f0) % altoOrigen);
      // Las dos celdas se leen del libro de PARTIDA: si el origen y el destino se
      // solapan, mirar lo ya estampado sería copiarse a sí mismo a media vuelta.
      const fuente = h.celdas[dir(oc, of)] ?? null;
      out = conCelda(
        out,
        hojaId,
        c,
        f,
        pegador({
          fuente,
          previa: h.celdas[dir(c, f)] ?? null,
          dCol: c - oc,
          dFila: f - of,
          trasladar,
          valor: opciones.valor && fuente ? opciones.valor(oc, of) : null,
        }),
      );
    }
  }
  return out;
}

/* ── el autorrelleno de SERIES · bloque 8 ───────────────────────────────────*/

/**
 * La otra mitad del bloque 8, y la que el alumno cree que es «el» autorrelleno:
 * arrastrar `1, 2` y que salga `3, 4, 5`.
 *
 * `serieDesde` es una función **con nombre y exportada** a propósito: es la
 * única pieza de esta familia que se puede probar sin libro, sin hoja y sin
 * motor alrededor —`serieDesde(['1','3'], 3)` es `['5','7','9']`—, y lo que
 * decide si el bloque 8 está bien enseñado son exactamente esas reglas y no el
 * recorrido de celdas que las llama.
 *
 * Una regla lee la semilla entera y devuelve **un generador o `null`**; se
 * prueban en orden y gana la primera que la reconoce. Es tabla y no `switch`
 * porque el orden importa y así se lee: la fórmula manda sobre todo, el número
 * manda sobre el texto —si no, `-5` se leería como «texto que acaba en 5»— y
 * copiar es lo que queda cuando nadie reconoce nada.
 */
type Serie = (i: number) => string;

interface ReglaDeSerie {
  nombre: string;
  /** `null` si esta regla no reconoce la semilla y le toca a la siguiente. */
  leer: (semillas: string[]) => Serie | null;
}

const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const LISTAS: string[][] = [DIAS, MESES];

/**
 * Sin acentos y en minúsculas, para que «miercoles» encuentre a «miércoles».
 *
 * Cinco vocales y una diéresis escritas a mano, y no `normalize('NFD')` con un
 * rango de marcas combinantes: aquí sólo hay que reconocer días y meses en
 * español, y una tabla de seis letras se lee de un vistazo mientras que un
 * rango de marcas combinantes metido en una expresión regular no lo entiende
 * nadie que abra este archivo dentro de un año.
 */
const SIN_ACENTO: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' };

const plano = (t: string): string =>
  t
    .trim()
    .toLowerCase()
    .replace(/[áéíóúü]/g, (c) => SIN_ACENTO[c] ?? c);

const indiceEn = (lista: string[], crudo: string): number => lista.findIndex((x) => plano(x) === plano(crudo));

/**
 * La palabra nueva, vestida como la que escribió el alumno.
 *
 * Tres casos y no dos: `LUNES` sigue en `MARTES`, `Lunes` en `Martes` y `lunes`
 * en `martes`. Si sólo se mirara la primera letra, quien escribe en mayúsculas
 * —que en una hoja de cálculo es medio mundo— vería la serie cambiar de estilo a
 * mitad de la columna.
 */
function comoElModelo(texto: string, modelo: string): string {
  const m = modelo.trim();
  if (m === '') return texto;
  if (m === m.toUpperCase() && m !== m.toLowerCase()) return texto.toUpperCase();
  const inicial = m[0];
  if (inicial === inicial.toUpperCase() && inicial !== inicial.toLowerCase()) {
    return texto[0].toUpperCase() + texto.slice(1);
  }
  return texto;
}

/** El mosaico de siempre: la semilla se repite. Es lo que hace `rellenarAbajo`. */
const copiaDe = (semillas: string[]): Serie => (i) => semillas[i % semillas.length];

/** El número que guarda ese crudo, o `null` si lo que guarda es texto. */
const numeroDe = (crudo: string): number | null => {
  const v = valorDeTextoCrudo(crudo);
  return typeof v === 'number' ? v : null;
};

const REGLAS_DE_SERIE: ReglaDeSerie[] = [
  {
    /*
     * Una fórmula NO hace serie: se copia. Y se copia aquí sin mover una sola
     * referencia porque desde dentro de esta función no se sabe cuánto se movió
     * la celda; el que sí lo sabe es `rellenarSerie`, que detecta la fórmula
     * antes de llamar y se va por el camino de `estampar`. Esta regla existe
     * igual, y no como comentario, porque `serieDesde(['=A1'], 2)` tiene que
     * contestar algo sensato: sin ella, `=A1` acabaría en la regla del texto que
     * acaba en número y saldría un `=A2` inventado a base de manosear la cadena.
     */
    nombre: 'fórmula',
    leer: (s) => (s.some(esFormula) ? copiaDe(s) : null),
  },
  {
    /*
     * Dos o más números: progresión aritmética. Con exactamente dos, el paso es
     * su diferencia (`1, 3` → `5, 7, 9`), que es lo que pide el bloque 8.
     *
     * **Un solo número se COPIA** —no hay regla de un número—, y eso es fidelidad
     * medida, no pereza: en Excel arrastrar una celda con `1` da `1, 1, 1`, y hay
     * que arrastrar con Ctrl para que cuente. Con una semilla sola no se sabe si
     * el alumno quería contar de uno en uno o de cinco en cinco, y la respuesta
     * que no adivina es la que se puede corregir con sólo escribir el segundo.
     *
     * Con tres o más semillas se toma el paso PROMEDIO, que con datos parejos es
     * el mismo. **Reserva**: Excel ajusta una recta por mínimos cuadrados, así
     * que con semillas desparejas (`1, 2, 10`) dará otra cosa; el día que haga
     * falta se cambia aquí y en ningún otro sitio.
     */
    nombre: 'progresión aritmética',
    leer: (s) => {
      if (s.length < 2) return null;
      const nums: number[] = [];
      for (const crudo of s) {
        const n = numeroDe(crudo);
        if (n === null) return null;
        nums.push(n);
      }
      const ultimo = nums[nums.length - 1];
      const paso = (ultimo - nums[0]) / (nums.length - 1);
      // `textoDeNumero` y no `String`: una serie de paso 0.1 se llenaría de
      // `1.2000000000000002` y la hoja dejaría de parecer que sabe sumar.
      return (i) => textoDeNumero(ultimo + paso * (i + 1));
    },
  },
  {
    /*
     * Los días y los meses en español. Da la vuelta —de diciembre se pasa a
     * enero— porque una serie de doce meses en trece celdas es un calendario
     * normal, no un error.
     */
    nombre: 'día o mes',
    leer: (s) => {
      const lista = LISTAS.find((l) => s.every((x) => indiceEn(l, x) >= 0));
      if (!lista) return null;
      const idx = s.map((x) => indiceEn(lista, x));
      const ultimo = idx[idx.length - 1];
      // `lunes, miércoles` va de dos en dos, igual que `1, 3`. Con una semilla
      // sola el paso es 1: aquí sí se puede adivinar, porque después de «lunes»
      // sólo hay un candidato razonable.
      const paso = idx.length > 1 ? (((idx[1] - idx[0]) % lista.length) + lista.length) % lista.length : 1;
      const modelo = s[s.length - 1];
      return (i) => comoElModelo(lista[(ultimo + paso * (i + 1)) % lista.length], modelo);
    },
  },
  {
    /*
     * `Trimestre 1` → `Trimestre 2`. El texto se conserva y el número sube.
     *
     * Dos guardas que parecen de más y no lo son: la semilla **no puede ser un
     * número** (si no, un `-5` suelto se leería como el texto `-` seguido de `5`
     * y saldría `-6` en vez de copiarse), y delante de las cifras tiene que haber
     * **al menos un carácter que no sea cifra** (si no, `007` —que en esta hoja
     * es texto a propósito— se convertiría en `008` en vez de copiarse).
     *
     * Y el relleno de ceros se conserva: `Producto 01` sigue en `Producto 02`,
     * no en `Producto 2`. Es lo que hace que una lista de códigos siga ordenando
     * bien.
     */
    nombre: 'texto que acaba en número',
    leer: (s) => {
      if (s.some((x) => numeroDe(x) !== null)) return null;
      const partes: RegExpExecArray[] = [];
      for (const x of s) {
        const m = /^(.*\D)(\d+)$/.exec(x.trim());
        if (!m) return null;
        partes.push(m);
      }
      const prefijo = partes[0][1];
      if (partes.some((p) => p[1] !== prefijo)) return null;
      const nums = partes.map((p) => Number(p[2]));
      const ultimo = nums[nums.length - 1];
      const paso = nums.length > 1 ? (ultimo - nums[0]) / (nums.length - 1) : 1;
      const cifras = partes[partes.length - 1][2];
      const ancho = cifras.startsWith('0') ? cifras.length : 0;
      // Se redondea porque lo que sigue a un texto es un ordinal: «Equipo 2.5»
      // no es un equipo. El paso fraccionario sólo puede venir de semillas
      // desparejas, y ahí redondear es lo menos raro que se puede hacer.
      return (i) => `${prefijo}${String(Math.round(ultimo + paso * (i + 1))).padStart(ancho, '0')}`;
    },
  },
];

/**
 * Las `n` celdas que siguen a esta semilla.
 *
 * `semillas` son los crudos de las celdas que el alumno YA escribió, en orden.
 * Devuelve `n` crudos y nunca lanza: si nadie reconoce la semilla, se copia.
 */
export function serieDesde(semillas: string[], n: number): string[] {
  if (n <= 0) return [];
  if (semillas.length === 0) return new Array<string>(n).fill('');
  let serie: Serie | null = null;
  for (const regla of REGLAS_DE_SERIE) {
    serie = regla.leer(semillas);
    if (serie) break;
  }
  const dar = serie ?? copiaDe(semillas);
  return Array.from({ length: n }, (_, i) => dar(i));
}

/* ── las gráficas · bloques 17, 18, 37 y 38 ─────────────────────────────────*/

/**
 * Los cuatro comandos de gráfica siguen la misma disciplina que los dieciocho de
 * arriba, y hay dos cosas suyas que conviene leer antes de tocarlos.
 *
 * **(1) El `id` viaja en el gesto.** Es la regla de la cabecera cobrada donde
 * más muerde: si `insertarGrafica` se fabricara un identificador al aplicar
 * —un contador, un reloj, un azar—, reproducir la misma macro dos veces daría
 * dos libros distintos y la prueba del bloque 55 no se podría escribir. Quien
 * pulsa el botón es quien tiene que decidir el nombre, y la cinta lo deriva de
 * la selección para que salga siempre el mismo (`cinta.ts`).
 *
 * **(2) `toca` es `[]`, y esta vez de verdad.** Es la pregunta que hay que
 * hacerse dos veces —el §46.6 se pagó por un `toca` corto—, y la respuesta se
 * dice en una frase: **una gráfica lee celdas y ninguna celda lee una gráfica**.
 * No existe `=GRAFICA()`, no hay forma de que un valor dependa de un dibujo, y
 * por lo tanto insertar, mover, cambiar o borrar una gráfica no ensucia ni una
 * clave del grafo. Lo que sí pasa —que el dibujo cambie— no es recálculo: es
 * repintado, y de eso se encarga la ventana volviendo a leer del motor. El día
 * que exista una función que lea algo de una gráfica, esto pasa a `'todo'`.
 *
 * ── Tres reservas escritas a propósito ──────────────────────────────────────
 *
 * **(a) No hay `redimensionarGrafica`.** Se mueve, no se estira. Cuesta un
 * comando de dos líneas y ninguna clase del Básico ni del Intermedio lo pide: el
 * tamaño con el que nace —8 × 15 celdas— es el de una gráfica que se lee. El día
 * que haga falta va aquí, con `cols` y `filas` en el gesto.
 *
 * **(b) Insertar o borrar filas NO encoge el rango de la gráfica.** En Excel,
 * borrar una fila de en medio de `A1:B9` deja la gráfica comiendo de `A1:B8`;
 * aquí el rango se queda escrito igual y por lo tanto la gráfica pasa a comer de
 * las celdas que ahora ocupan ese domicilio — que son otras, porque los datos
 * subieron. O sea que **el dibujo cambia y nunca enseña datos viejos**, que es
 * lo que importa, pero enseña una fila de más por abajo. Arreglarlo es meter las
 * gráficas dentro de `ajustarPorFilas`/`ajustarPorColumnas`, o sea tocar la
 * única función que reescribe TODAS las fórmulas del libro, y eso no se hace
 * para un caso que ninguna clase de hoy provoca.
 *
 * **(c) `datos` no cruza de hoja.** Una gráfica come del rango de **su** hoja.
 * `Gastos!A1:B9` se guardaría tal cual y se leería como si fuera de la hoja
 * propia. El día que una clase lo pida, se resuelve donde se leen los datos
 * (`Grafica.tsx`) y no aquí.
 */
const TIPOS_DE_GRAFICA: readonly TipoGrafica[] = ['columnas', 'barras', 'lineas', 'circular', 'dispersion'];

const esTipoDeGrafica = (t: string): t is TipoGrafica => (TIPOS_DE_GRAFICA as readonly string[]).includes(t);

const graficasDe = (libro: Libro, hojaId: string): Grafica[] => hojaDe(libro, hojaId)?.graficas ?? [];

const graficaDe = (libro: Libro, hojaId: string, id: string): Grafica | null =>
  graficasDe(libro, hojaId).find((g) => g.id === id) ?? null;

/** Devuelve un libro nuevo con la lista de gráficas cambiada. Como `conCelda`. */
function conGraficas(libro: Libro, hojaId: string, graficas: Grafica[]): Libro {
  if (!hojaDe(libro, hojaId)) return libro;
  return { ...libro, hojas: libro.hojas.map((h) => (h.id === hojaId ? { ...h, graficas } : h)) };
}

/** Cambia UNA gráfica y deja las demás como el mismo objeto. */
function conGrafica(libro: Libro, hojaId: string, id: string, cambiar: (g: Grafica) => Grafica): Libro {
  const antes = graficasDe(libro, hojaId);
  if (!antes.some((g) => g.id === id)) return libro;
  return conGraficas(
    libro,
    hojaId,
    antes.map((g) => (g.id === id ? cambiar(g) : g)),
  );
}

/**
 * El ancla se escribe **como un rango de celdas** —`"D2:J16"`— y no como cuatro
 * números sueltos.
 *
 * Es «cuadricular, no medir» (§39) llevado hasta el gesto: la gráfica flota
 * sobre la hoja ocupando celdas, así que su sitio se dice en el mismo idioma que
 * todo lo demás y se lee con el mismo `cajaDeTexto` que un rango de datos. Con
 * cuatro números (`col`, `fila`, `cols`, `filas`) el gesto sería igual de
 * reproducible y además ilegible en la lista de la macro, que es lo que el
 * alumno de la clase 55 va a tener delante.
 */
function anclaDeTexto(t: string): Grafica['ancla'] | null {
  const c = cajaDeTexto(t);
  return c ? { col: c.c0, fila: c.f0, cols: c.c1 - c.c0 + 1, filas: c.f1 - c.f0 + 1 } : null;
}

/**
 * Dónde cae una gráfica a la que nadie le dijo dónde: **dos columnas a la
 * derecha de sus datos**, a la altura de su primera fila.
 *
 * Se calcula a partir de `datos`, que viene en el propio gesto, así que sigue
 * siendo determinista: la misma macro reproducida sobre el libro de partida deja
 * la gráfica en el mismo sitio. Excel la suelta en el centro de la ventana, que
 * es una decisión de pantalla y por eso aquí no vale: la pantalla no está dentro
 * del gesto.
 *
 * El tamaño —8 × 15 celdas— es el de una gráfica que se lee: unos 700 × 330
 * píxeles con la rejilla de esta ventana.
 */
function anclaJuntoALosDatos(datos: Caja): Grafica['ancla'] {
  return { col: datos.c1 + 2, fila: datos.f0, cols: 8, filas: 15 };
}

/**
 * La misma idea que `anclaJuntoALosDatos`, pero al lado de una CAJA cualquiera
 * —la región pintada de una dinámica, no un rango de datos— y con un tamaño
 * que decide quien llama: un gráfico dinámico nace del tamaño de una gráfica
 * normal (8 × 15), y una segmentación nace más baja y más ancha, porque es un
 * panel de botones y no un dibujo.
 */
function anclaJuntoARegion(region: Caja, cols: number, filas: number): Grafica['ancla'] {
  return { col: region.c1 + 2, fila: region.f0, cols, filas };
}

/* ── las segmentaciones · bloque 51 ─────────────────────────────────────────
 *
 * Guardadas exactamente como las gráficas y las dinámicas —una lista en la
 * hoja, un `id` que viaja en el gesto—, con las mismas cuatro funciones de
 * siempre y por la misma razón: `conSegmentacion` deja las demás
 * segmentaciones como el mismo objeto, así que una hoja con tres paneles no
 * repinta los otros dos por cambiar uno.
 */
const segmentacionesDe = (libro: Libro, hojaId: string): Segmentacion[] => hojaDe(libro, hojaId)?.segmentaciones ?? [];

const segmentacionDe = (libro: Libro, hojaId: string, id: string): Segmentacion | null =>
  segmentacionesDe(libro, hojaId).find((s) => s.id === id) ?? null;

function conSegmentaciones(libro: Libro, hojaId: string, segmentaciones: Segmentacion[]): Libro {
  if (!hojaDe(libro, hojaId)) return libro;
  return { ...libro, hojas: libro.hojas.map((h) => (h.id === hojaId ? { ...h, segmentaciones } : h)) };
}

/** Dos números sueltos para `eje-secundario`: qué series están en el segundo eje. */
const sinEl = (lista: number[], x: number): number[] => lista.filter((n) => n !== x);
const conEl = (lista: number[], x: number): number[] => (lista.includes(x) ? lista : [...lista, x]);

/**
 * Lo que `cambiarGrafica` sabe cambiar, en tabla y no en un `switch`.
 *
 * En tabla porque así se ve de un vistazo **qué se puede tocar de una gráfica**,
 * que es literalmente el temario del bloque 18 —título, ejes, leyenda,
 * rótulos— más el tipo (bloque 37) y el corte del eje (bloque 38). Un campo que
 * no esté aquí lo rechaza `revisar`, en vez de aceptarse, grabarse en la macro y
 * no hacer nada, que es la peor de las tres opciones.
 *
 * Cada entrada recibe los argumentos enteros y lee de ellos lo que necesita, con
 * los mismos `txt`/`num`/`siNo` de todo el archivo: un `valor` vacío en `minY`
 * **quita** el corte del eje, que es como se deshace la mentira de la clase 38.
 */
const CAMPOS_DE_GRAFICA: Record<string, (g: Grafica, a: ArgsDeGesto) => Grafica> = {
  tipo: (g, a) => {
    const t = txt(a, 'valor');
    return esTipoDeGrafica(t) ? { ...g, tipo: t } : g;
  },
  datos: (g, a) => (cajaDeTexto(txt(a, 'valor')) ? { ...g, datos: txt(a, 'valor').trim().toUpperCase() } : g),
  titulo: (g, a) => ({ ...g, titulo: txt(a, 'valor') }),
  ejeX: (g, a) => ({ ...g, ejeX: txt(a, 'valor') }),
  ejeY: (g, a) => ({ ...g, ejeY: txt(a, 'valor') }),
  leyenda: (g, a) => ({ ...g, leyenda: siNo(a, 'valor') }),
  rotulosDeDato: (g, a) => ({ ...g, rotulosDeDato: siNo(a, 'valor') }),
  rotulosEnPrimeraFila: (g, a) => ({ ...g, rotulosEnPrimeraFila: siNo(a, 'valor') }),
  minY: (g, a) => {
    const t = txt(a, 'valor').trim();
    if (t === '') {
      // Quitar el corte no es ponerlo en cero: es **no tener** mínimo, y que la
      // escala vuelva a decidirse sola. Con un 0 guardado, una gráfica de
      // números negativos se quedaría con medio dibujo fuera del marco.
      const derecho: Grafica = { ...g };
      delete derecho.minY;
      return derecho;
    }
    const n = Number(t);
    return Number.isFinite(n) ? { ...g, minY: n } : g;
  },
};

/* ── el papel · bloque 20 ───────────────────────────────────────────────────*/

/**
 * Los tres comandos que configuran cómo sale la hoja por la impresora, y **por
 * qué su `toca` es `[]`**.
 *
 * Es la pregunta que hay que hacerse dos veces —el §46.6 se pagó por un `toca`
 * corto— y aquí la respuesta cabe en una frase: **ninguna fórmula puede leer el
 * papel**. No existe `=ORIENTACION()`, no existe `=PAGINAS()`, y no hay manera de
 * que el valor de una celda dependa de dónde cae un corte de página. Poner el
 * área de impresión, girar la hoja o repetir los títulos arriba cambia lo que
 * sale por la impresora y **no cambia ni un número de la hoja**. Es la misma
 * familia que `moverHoja` y `colorHoja`, y por el mismo motivo: lo que cambia es
 * dónde se dibuja, no qué vale.
 *
 * El día que exista una función que lea la configuración de página, esto pasa a
 * `'todo'`. Está dicho aquí para que quien la construya lo lea.
 *
 * ── DÓNDE SE GUARDA ─────────────────────────────────────────────────────────
 *
 * En la hoja (`Hoja.impresion`), y **sólo lo que se tocó**: la configuración es
 * un `Partial`, así que una hoja recién configurada lleva una clave y no diez. Y
 * cuando se quita lo último —`quitarAreaDeImpresion` sobre una hoja que sólo
 * tenía el área— la clave desaparece entera y el libro vuelve a ser *idéntico* al
 * de partida. Es la misma disciplina que `conCelda` con las celdas vacías y que
 * `conCombinadas` con la lista vacía: lo que ya no dice nada, no se guarda.
 */
function conImpresion(libro: Libro, hojaId: string, cfg: ConfigGuardada): Libro {
  const h = hojaDe(libro, hojaId);
  if (!h) return libro;
  const hoja: Hoja = { ...h };
  if (Object.keys(cfg).length) hoja.impresion = cfg;
  else delete hoja.impresion;
  return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? hoja : x)) };
}

const impresionDe = (libro: Libro, hojaId: string): ConfigGuardada => hojaDe(libro, hojaId)?.impresion ?? {};

/**
 * Las listas de lo que se puede elegir, escritas aquí y tipadas desde
 * `impresion.ts`.
 *
 * Es el mismo reparto que `TIPOS_DE_GRAFICA` unas líneas más arriba —el tipo vive
 * en el modelo y la lista que se valida vive junto al comando que la valida— y
 * tiene el mismo agujero: si mañana `impresion.ts` añade un cuarto juego de
 * márgenes, TypeScript no dirá nada, porque una lista con tres de los cuatro
 * sigue siendo una lista válida. Lo que lo cierra no es este comentario: es la
 * prueba «el comando acepta todos los márgenes que existen», que recorre las
 * claves de `MARGENES` y las pide una por una.
 */
const ORIENTACIONES: readonly Orientacion[] = ['vertical', 'horizontal'];
const TAMANOS: readonly Tamano[] = ['carta', 'oficio', 'a4'];
const MARGENES_CON_NOMBRE: readonly TipoMargen[] = ['normal', 'estrecho', 'ancho'];

const esUna = <T extends string>(lista: readonly T[], v: string): v is T =>
  (lista as readonly string[]).includes(v);

const unaDe =
  <T extends string>(lista: readonly T[], que: string) =>
  (a: ArgsDeGesto): string | null =>
    esUna(lista, txt(a, 'valor')) ? null : `«${txt(a, 'valor')}» no es ${que}: ${lista.join(', ')}`;

/** Un campo de texto: vacío **quita**, como el `colorRelleno` de un formato. */
function conTexto(c: ConfigGuardada, campo: 'titulosArriba' | 'encabezado' | 'pie', v: string): ConfigGuardada {
  const fuera: ConfigGuardada = { ...c };
  if (v === '') delete fuera[campo];
  else fuera[campo] = v;
  return fuera;
}

/**
 * Una casilla: apagada **borra su campo** en vez de guardar un `false`.
 *
 * Por lo mismo que `marcar` con la negrita: si un `false` se quedara escrito, una
 * hoja a la que se le encendió y se le apagó la cuadrícula del papel nunca
 * volvería a ser la hoja de partida, y la clave `impresion` se quedaría puesta
 * para siempre diciendo que no pasa nada.
 */
function conMarca(c: ConfigGuardada, campo: 'verCuadricula' | 'verEncabezados', si: boolean): ConfigGuardada {
  const fuera: ConfigGuardada = { ...c };
  if (si) fuera[campo] = true;
  else delete fuera[campo];
  return fuera;
}

/** `ajustarA` es un objeto de dos huecos; sin ninguno de los dos, se va entero. */
function conAjuste(c: ConfigGuardada, cual: 'ancho' | 'alto', paginas: number): ConfigGuardada {
  const ajustarA = { ...c.ajustarA };
  if (paginas >= 1) ajustarA[cual] = Math.floor(paginas);
  else delete ajustarA[cual];
  const fuera: ConfigGuardada = { ...c };
  if (Object.keys(ajustarA).length) fuera.ajustarA = ajustarA;
  else delete fuera.ajustarA;
  return fuera;
}

interface CampoDePagina {
  /** Cómo se lee el gesto en la lista de la macro. Es lo que el alumno ve. */
  como: (a: ArgsDeGesto) => string;
  poner: (c: ConfigGuardada, a: ArgsDeGesto) => ConfigGuardada;
  /** Lo que Excel no dejaría elegir en su desplegable. `null` = adelante. */
  revisar?: (a: ArgsDeGesto) => string | null;
}

/**
 * Lo que `configurarPagina` sabe cambiar, en tabla y no en un `switch`.
 *
 * En tabla porque así se ve de un vistazo **el temario del bloque 20 entero**:
 * orientación, tamaño, márgenes, ajustar a N páginas y repetir los títulos
 * arriba, más las dos casillas del papel y los dos rótulos. Un campo que no esté
 * aquí lo rechaza `revisar`, en vez de aceptarse, grabarse en la macro y no hacer
 * nada — que es la peor de las tres opciones y el defecto que estrenó el §45.6.
 *
 * Y **un solo comando para los diez campos**, como en `cambiarGrafica`: los diez
 * hacen exactamente lo mismo —tocar un dato de la configuración de una hoja— y
 * diez comandos serían diez `revisar` que se irían separando.
 */
const CAMPOS_DE_PAGINA: Record<string, CampoDePagina> = {
  orientacion: {
    como: (a) => `Poner la hoja en ${txt(a, 'valor')}`,
    revisar: unaDe(ORIENTACIONES, 'una orientación'),
    poner: (c, a) => {
      const v = txt(a, 'valor');
      return esUna(ORIENTACIONES, v) ? { ...c, orientacion: v } : c;
    },
  },
  tamano: {
    como: (a) => `Imprimir en papel ${txt(a, 'valor')}`,
    revisar: unaDe(TAMANOS, 'un tamaño de papel'),
    poner: (c, a) => {
      const v = txt(a, 'valor');
      return esUna(TAMANOS, v) ? { ...c, tamano: v } : c;
    },
  },
  margenes: {
    como: (a) => `Poner márgenes ${txt(a, 'valor')}s`,
    revisar: unaDe(MARGENES_CON_NOMBRE, 'un juego de márgenes'),
    poner: (c, a) => {
      const v = txt(a, 'valor');
      return esUna(MARGENES_CON_NOMBRE, v) ? { ...c, margenes: v } : c;
    },
  },
  /*
   * Los dos «ajustar a»: `0` —o cualquier cosa que no sea un número de páginas—
   * **quita** el ajuste y devuelve la hoja a tamaño real. Sin ese cero no habría
   * manera de desandar un «que quepa en una página»: el botón sabría apretar y no
   * sabría soltar, y al alumno le quedaría deshacer como única salida. Es la
   * misma regla que el `minY` vacío de una gráfica.
   */
  ajustarAncho: {
    como: (a) => (num(a, 'valor', 0) >= 1 ? `Que quepa en ${num(a, 'valor', 1)} página(s) de ancho` : 'Ancho a tamaño real'),
    poner: (c, a) => conAjuste(c, 'ancho', num(a, 'valor', 0)),
  },
  ajustarAlto: {
    como: (a) => (num(a, 'valor', 0) >= 1 ? `Que quepa en ${num(a, 'valor', 1)} página(s) de alto` : 'Alto a tamaño real'),
    poner: (c, a) => conAjuste(c, 'alto', num(a, 'valor', 0)),
  },
  titulosArriba: {
    como: (a) => (txt(a, 'valor') ? `Repetir arriba la(s) fila(s) ${txt(a, 'valor')}` : 'No repetir títulos arriba'),
    // Se guarda tal como se escribió (`"1"`, `"1:2"`, `"$1:$2"`) y lo lee
    // `filasDeTitulo`, que es quien sabe de filas. Un `"pepe"` deja la hoja sin
    // títulos en vez de reventar el previo: ver allí.
    poner: (c, a) => conTexto(c, 'titulosArriba', txt(a, 'valor').trim()),
  },
  verCuadricula: {
    como: (a) => (siNo(a, 'valor') ? 'Imprimir la cuadrícula' : 'No imprimir la cuadrícula'),
    poner: (c, a) => conMarca(c, 'verCuadricula', siNo(a, 'valor')),
  },
  verEncabezados: {
    como: (a) => (siNo(a, 'valor') ? 'Imprimir las letras y los números' : 'No imprimir las letras y los números'),
    poner: (c, a) => conMarca(c, 'verEncabezados', siNo(a, 'valor')),
  },
  encabezado: {
    como: (a) => (txt(a, 'valor') ? `Encabezado: «${txt(a, 'valor')}»` : 'Quitar el encabezado'),
    poner: (c, a) => conTexto(c, 'encabezado', txt(a, 'valor')),
  },
  pie: {
    como: (a) => (txt(a, 'valor') ? `Pie de página: «${txt(a, 'valor')}»` : 'Quitar el pie de página'),
    poner: (c, a) => conTexto(c, 'pie', txt(a, 'valor')),
  },
};

/* ── el análisis Y si · bloque 57 (buscar objetivo y escenarios) ────────────*/

/**
 * Arma la petición a partir de los `args` de un gesto. Una función y no cinco
 * líneas repetidas: `revisar` y `aplicar` la necesitan igual, y las dos tienen
 * que construir EXACTAMENTE la misma petición para que la caché de
 * `resolverObjetivo` (`ultima` en `ysi.ts`) la reconozca y no busque dos veces.
 */
function peticionObjetivoDe(hojaId: string, a: ArgsDeGesto): PeticionObjetivo {
  return {
    hoja: hojaId,
    objetivo: txt(a, 'objetivo'),
    valor: num(a, 'valor', NaN),
    cambiando: txt(a, 'cambiando'),
    ahora: a.ahora === undefined ? undefined : num(a, 'ahora', 0),
  };
}

/**
 * Escribe un crudo en una celda por su dirección, exactamente como si el
 * alumno lo hubiera tecleado —conserva lo demás que ya tuviera la celda—.
 *
 * Es el `Escritor` que pide `resolverObjetivo`, y el mismo se usa para tantear
 * durante la búsqueda y para la escritura final (decisión 2 de `ysi.ts`): si
 * aquí se escribiera de otra manera que durante el tanteo, se podría anunciar
 * un valor que después no da lo mismo al escribirlo de verdad.
 */
function escritorDeCelda(hojaId: string, direccion: string): Escritor {
  return (libro, crudo) => {
    const p = dirAColFila(direccion);
    if (!p) return libro;
    const previa = celdaEn(libro, hojaId, p.col, p.fila);
    return conCelda(libro, hojaId, p.col, p.fila, { ...previa, crudo });
  };
}

/** `"B3,D2:D4"` → las claves de esas celdas, con la hoja pegada. Tokens ilegibles se caen. */
function clavesDeLista(hojaId: string, texto: string): Clave[] {
  const claves: Clave[] = [];
  for (const token of texto.split(',')) {
    const t = token.trim();
    if (!t) continue;
    const caja = cajaDeTexto(t);
    if (caja) claves.push(...clavesDeCaja(hojaId, caja));
  }
  return claves;
}

/* ── el dato sucio · bloques 43 y 44 (importar, duplicados, relleno rápido) ─*/

/** El separador que se pidió, si es uno de los tres que `datos.ts` reconoce. */
function separadorDeArgs(a: ArgsDeGesto): Separador | undefined {
  const s = txt(a, 'separador');
  return (SEPARADORES as readonly string[]).includes(s) ? (s as Separador) : undefined;
}

/** Todas las columnas de una caja, en orden. Es la comparación entera del rango. */
const columnasDeCaja = (c: Caja): number[] => Array.from({ length: c.c1 - c.c0 + 1 }, (_, i) => c.c0 + i);

/**
 * El patrón de relleno rápido para un gesto: el ejemplo es la primera fila del
 * DESTINO —la que el alumno ya escribió a mano—, y el origen es la fila que le
 * corresponde en la columna de al lado. `null` si no hay patrón que deducir.
 */
function patronDeArgs(libro: Libro, hojaId: string, a: ArgsDeGesto) {
  const origen = cajaDeTexto(txt(a, 'origen'));
  const destino = cajaDeTexto(txt(a, 'destino'));
  if (!origen || !destino) return null;
  const h = hojaDe(libro, hojaId);
  const origenTexto = h?.celdas[dir(origen.c0, origen.f0)]?.crudo ?? '';
  const ejemplo = h?.celdas[dir(destino.c0, destino.f0)]?.crudo ?? '';
  return deducirPatron(origenTexto, ejemplo);
}

/* ── consolidar · bloque 53, grado Avanzado ─────────────────────────────────*/

/**
 * `SUMA`, `PROMEDIO`, `CONTAR`, `MAX`, `MIN` — las cinco que ya conoce
 * `formula/funciones.ts`, sin inventar una sexta. La palabra que ve el alumno
 * (`suma`) y la función que se escribe en la celda (`SUMA`) se separan a
 * propósito: es la misma disciplina que `tipoDeNumero`/`Formato.tipo` con
 * `millares` escribiendo `numero`.
 */
const OPERACIONES_DE_CONSOLIDAR: Record<string, string> = {
  suma: 'SUMA',
  promedio: 'PROMEDIO',
  contar: 'CONTAR',
  max: 'MAX',
  min: 'MIN',
};

interface OrigenDeConsolidar {
  hoja: Hoja;
  caja: Caja;
}

/**
 * `"Grupo A!B2:B4,Grupo B!B2:B4"` → las hojas y las cajas ya leídas.
 * `null` si algún trozo no se entiende — quien llama a esto son `aplicar` y
 * `toca`, que no escriben mensaje: el mensaje lo da `revisar`, releyendo el
 * mismo texto token por token para señalar cuál de todos falló.
 */
function origenesDeConsolidar(libro: Libro, texto: string): OrigenDeConsolidar[] | null {
  const fuera: OrigenDeConsolidar[] = [];
  for (const token of texto.split(',')) {
    const t = token.trim();
    if (!t) continue;
    const i = t.indexOf('!');
    if (i < 0) return null;
    const h = hojaPorNombre(libro, t.slice(0, i).trim());
    const caja = cajaDeTexto(t.slice(i + 1).trim());
    if (!h || !caja) return null;
    fuera.push({ hoja: h, caja });
  }
  return fuera.length ? fuera : null;
}

const anchoDeCaja = (c: Caja): number => c.c1 - c.c0 + 1;
const altoDeCaja = (c: Caja): number => c.f1 - c.f0 + 1;

/* ── el formato condicional · bloques 30 y 46 ────────────────────────────────
 *
 * Las cinco reglas (`regla-barras`, `regla-escala`, `regla-iconos`,
 * `regla-destacar`, `regla-formula`) comparten CASI todo su `revisar`: hoja,
 * rango e id son la misma pregunta las cinco veces, y eso vive en
 * `revisarBaseDeRegla`. Lo que las separa —la condición— es justo lo que NO
 * se comparte, porque mezclarlo en una tabla (al estilo `CAMPOS_DE_GRAFICA`)
 * habría escondido la única parte distinta detrás de una fila más.
 *
 * Cómo se pinta cada celda —quién gana cuando dos reglas se pisan, cómo se
 * escala una barra o una escala de color, cómo se desplaza la fórmula del
 * bloque 46— no vive aquí: vive en `condicional.ts`, que LEE `Hoja.reglas`
 * para pintar y nunca escribe el libro. Este archivo sólo guarda el dato; a
 * propósito no importa nada de `condicional.ts` — la razón está allí, en la
 * cabecera, junto a `rangoDe`.
 */

const reglasDe = (libro: Libro, hojaId: string): ReglaCondicional[] => hojaDe(libro, hojaId)?.reglas ?? [];

function conReglas(libro: Libro, hojaId: string, reglas: ReglaCondicional[]): Libro {
  const h = hojaDe(libro, hojaId);
  if (!h) return libro;
  const hoja: Hoja = { ...h };
  if (reglas.length) hoja.reglas = reglas;
  else delete hoja.reglas;
  return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? hoja : x)) };
}

const reglaDe = (libro: Libro, hojaId: string, id: string): ReglaCondicional | null =>
  reglasDe(libro, hojaId).find((r) => r.id === id) ?? null;

/** Lo que las cinco reglas preguntan primero, antes de mirar su condición. */
function revisarBaseDeRegla(libro: Libro, a: ArgsDeGesto): string | null {
  const hojaId = txt(a, 'hoja', libro.activa);
  if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
  if (!txt(a, 'id')) return 'a una regla hay que darle un identificador';
  if (reglaDe(libro, hojaId, txt(a, 'id'))) return 'ya hay una regla con ese identificador: bórrala antes de repetirla';
  return cajaDeArgs(a) ? null : `«${txt(a, 'rango')}» no es un rango`;
}

/** Las tres reglas «de un solo color»: barras, escala e iconos. */
function reglaSimpleDe(a: ArgsDeGesto, clase: ReglaCondicional['clase']): ReglaCondicional {
  const regla: ReglaCondicional = { id: txt(a, 'id'), rango: textoDeCaja(cajaDeArgs(a) as Caja), clase };
  if (txt(a, 'color')) regla.color = txt(a, 'color');
  return regla;
}

/**
 * El predicado de `regla-destacar`, codificado como lo lee `condicional.ts`:
 * `"mayor|1000"`, `"entre|100|500"`, `"contiene|pendiente"`, `"duplicados"`.
 * `null` si a la comparación le falta lo que necesita para decidir algo.
 */
const COMPARACIONES_DESTACAR = ['mayor', 'menor', 'entre', 'contiene', 'duplicados'] as const;

function predicadoDeArgs(a: ArgsDeGesto): string | null {
  const comparacion = txt(a, 'comparacion');
  if (comparacion === 'duplicados') return 'duplicados';
  if (comparacion === 'contiene') {
    const t = txt(a, 'valor').trim();
    return t ? `contiene|${t}` : null;
  }
  if (comparacion === 'mayor' || comparacion === 'menor') {
    const n = Number(a.valor);
    return Number.isFinite(n) ? `${comparacion}|${n}` : null;
  }
  if (comparacion === 'entre') {
    const d = Number(a.valor);
    const h = Number(a.valor2);
    return Number.isFinite(d) && Number.isFinite(h) ? `entre|${Math.min(d, h)}|${Math.max(d, h)}` : null;
  }
  return null;
}

/** El «resaltado» clásico de Excel: fondo rosa, letra roja. Mismo color que `condicional.ts`. */
const FORMATO_DESTACAR: Formato = { tipo: 'general', colorRelleno: '#FFC7CE', colorLetra: '#9C0006' };

/* ── los minigráficos · bloque 31 ────────────────────────────────────────── */

const TIPOS_DE_MINIGRAFICO = ['linea', 'columna', 'ganancia'] as const;

const esTipoDeMinigrafico = (t: string): t is Minigrafico['tipo'] =>
  (TIPOS_DE_MINIGRAFICO as readonly string[]).includes(t);

const minigraficosDe = (libro: Libro, hojaId: string): Minigrafico[] => hojaDe(libro, hojaId)?.minigraficos ?? [];

function conMinigraficos(libro: Libro, hojaId: string, lista: Minigrafico[]): Libro {
  const h = hojaDe(libro, hojaId);
  if (!h) return libro;
  const hoja: Hoja = { ...h };
  if (lista.length) hoja.minigraficos = lista;
  else delete hoja.minigraficos;
  return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? hoja : x)) };
}

/* ── la validación de datos · bloque 32, paquete VALIDACIÓN ──────────────────
 *
 * El PORQUÉ está en `modelo.ts`, junto a `Validacion`: una lista desplegable
 * no es un adorno, es lo que hace que una columna se pueda filtrar y resumir
 * después. Aquí vive lo que hace falta para que sea de verdad una regla —
 * guardarla, quitarla, y la única pregunta que le hace `escribir` (más abajo)
 * antes de aceptar algo nuevo.
 */

const CLASES_DE_VALIDACION = ['lista', 'numero', 'fecha', 'longitud'] as const;

const esClaseDeValidacion = (t: string): t is Validacion['clase'] =>
  (CLASES_DE_VALIDACION as readonly string[]).includes(t);

/** `"Efectivo, Tarjeta, Transferencia"` → las tres opciones, sin huecos. */
const listaDeArgs = (a: ArgsDeGesto): string[] =>
  txt(a, 'lista')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const validacionesDe = (libro: Libro, hojaId: string): Validacion[] => hojaDe(libro, hojaId)?.validaciones ?? [];

/** Cambia la lista de validaciones de una hoja. Lista vacía ⇒ se quita la clave. */
function conValidaciones(libro: Libro, hojaId: string, lista: Validacion[]): Libro {
  const h = hojaDe(libro, hojaId);
  if (!h) return libro;
  const hoja: Hoja = { ...h };
  if (lista.length) hoja.validaciones = lista;
  else delete hoja.validaciones;
  return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? hoja : x)) };
}

/** La `Validacion` que arman los argumentos de `validar`, ya con la caja resuelta. */
function validacionDeArgs(a: ArgsDeGesto, caja: Caja, clase: Validacion['clase']): Validacion {
  const regla: Validacion = {
    rango: textoDeCaja(caja),
    clase,
    // Por omisión «Detener», que es lo que Excel trae marcado de fábrica.
    bloquea: a.bloquea === undefined ? true : siNo(a, 'bloquea'),
  };
  if (clase === 'lista') {
    const lista = listaDeArgs(a);
    if (lista.length) regla.lista = lista;
  } else {
    if (a.min !== undefined && txt(a, 'min') !== '') regla.min = num(a, 'min', 0);
    if (a.max !== undefined && txt(a, 'max') !== '') regla.max = num(a, 'max', 0);
  }
  if (txt(a, 'mensaje')) regla.mensaje = txt(a, 'mensaje');
  if (txt(a, 'aviso')) regla.aviso = txt(a, 'aviso');
  return regla;
}

/**
 * La validación que gobierna esta celda, si hay alguna — la que la pinta con
 * flecha (`VentanaHojas.tsx`) y la que `escribir` consulta antes de aceptar
 * algo nuevo.
 *
 * `Validacion` no lleva `id` (a propósito: no hace falta uno para nombrar una
 * regla que sólo se identifica por su rango), así que dos rangos SÍ se pueden
 * solapar si alguien valida encima de lo que ya había validado. Gana la
 * ÚLTIMA aplicada — recorrido de atrás hacia adelante — que es la respuesta
 * más simple y la que no sorprende: la regla que se acaba de poner es la que
 * manda, igual que un formato nuevo sustituye al que había.
 */
export function validacionEnCelda(hoja: Hoja, direccion: string): Validacion | null {
  const p = dirAColFila(direccion);
  if (!p) return null;
  const lista = hoja.validaciones ?? [];
  for (let i = lista.length - 1; i >= 0; i -= 1) {
    const c = cajaDeTexto(lista[i].rango);
    if (c && p.col >= c.c0 && p.col <= c.c1 && p.fila >= c.f0 && p.fila <= c.f1) return lista[i];
  }
  return null;
}

/**
 * ¿Este crudo, tal como se acaba de escribir, viola la regla?
 *
 * Tres reservas escritas a propósito, y las tres son fidelidad y no pereza:
 *
 * - **Un crudo vacío nunca viola nada.** Es «Omitir blancos», la casilla que
 *   Excel trae marcada de fábrica: borrar una celda no dispara la validación.
 *   Y de aquí sale, sin ningún código extra, la regla que sorprende a todo el
 *   mundo: **poner una validación NO revisa lo que ya estaba escrito**, sólo
 *   lo nuevo — porque el único que llama a esta función es `escribir`
 *   (`revisar`, más abajo), en el momento exacto de una escritura NUEVA.
 *   Nadie recorre la hoja entera a revalidarla al aplicar `validar`.
 * - **Una fórmula tampoco se revisa.** Validar lo que una fórmula VA A DAR
 *   pediría evaluarla antes de que exista en el libro —este motor no adivina
 *   resultados fuera de `calculo.ts`—, así que se deja pasar. Queda anotado
 *   para el día que haga falta: se resolvería aquí y en ningún otro sitio.
 * - **`'lista'` compara el TEXTO escrito**, sin distinguir mayúsculas —la
 *   misma regla que `comparar()` en `modelo.ts`—, no un valor calculado: hay
 *   que teclear una de las opciones tal cual, letra por letra.
 */
export function violaValidacion(v: Validacion, crudo: string): boolean {
  const t = crudo.trim();
  if (t === '' || esFormula(crudo)) return false;
  if (v.clase === 'lista') {
    const lista = v.lista ?? [];
    return !lista.some((x) => x.toLowerCase() === t.toLowerCase());
  }
  if (v.clase === 'longitud') {
    if (v.min !== undefined && t.length < v.min) return true;
    if (v.max !== undefined && t.length > v.max) return true;
    return false;
  }
  // 'numero' y 'fecha' comparten la comprobación: una fecha es un número de
  // serie en este motor (decisión de `Formato`, en `modelo.ts`), así que
  // «entre el 1-ene y el 31-dic» es exactamente «entre estos dos números».
  const valor = valorDeTextoCrudo(t);
  if (typeof valor !== 'number') return true; // se exigía un número y no lo es
  if (v.min !== undefined && valor < v.min) return true;
  if (v.max !== undefined && valor > v.max) return true;
  return false;
}

/* ── los hipervínculos dentro del libro · bloque 40 ──────────────────────────*/

const vinculosDe = (libro: Libro, hojaId: string): Record<Clave, Vinculo> => hojaDe(libro, hojaId)?.vinculos ?? {};

function conVinculos(libro: Libro, hojaId: string, vinculos: Record<Clave, Vinculo>): Libro {
  const h = hojaDe(libro, hojaId);
  if (!h) return libro;
  const hoja: Hoja = { ...h };
  if (Object.keys(vinculos).length) hoja.vinculos = vinculos;
  else delete hoja.vinculos;
  return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? hoja : x)) };
}

/** El vínculo de esta celda, si tiene uno. Lo usa `VentanaHojas.tsx` para pintarlo. */
export function vinculoEnCelda(libro: Libro, hojaId: string, direccion: string): Vinculo | null {
  const p = dirAColFila(direccion);
  if (!p) return null;
  return vinculosDe(libro, hojaId)[clave(hojaId, p.col, p.fila)] ?? null;
}

/**
 * ¿La hoja a la que apunta este vínculo sigue existiendo?
 *
 * «El vínculo se rompe si borras la hoja destino… y se ve roto, no falla en
 * silencio» es la regla del bloque 40. Hoy este motor **todavía no tiene un
 * comando que borre una hoja** —ninguna clase construida lo pide, y no es de
 * mi paquete abrirlo—, así que la manera honesta de probar esto es dejar el
 * libro en el estado que quedaría DESPUÉS de borrarla —un `vinculo.destino`
 * que ya no tiene hoja en `libro.hojas`— y comprobar que se detecta, no
 * reproducir un borrado con un comando que no existe.
 */
export function vinculoRoto(libro: Libro, vinculo: Vinculo): boolean {
  const d = partirClave(vinculo.destino);
  return !d || !hojaDe(libro, d.hoja);
}

/**
 * Cuántos vínculos de CUALQUIER hoja del libro apuntan a `hojaId`, y desde
 * dónde — lo que un futuro comando que borre hojas tiene que preguntar en su
 * `revisar` ANTES de dejar borrar, para avisar «vas a romper N vínculos»
 * como pide el bloque 40. No está cableado a ningún comando porque no existe
 * todavía uno que borre una hoja (ver la nota de `vinculoRoto`): queda aquí,
 * probado y listo, para el día que lo haya.
 */
export function vinculosHaciaHoja(libro: Libro, hojaId: string): Array<{ origen: Clave; vinculo: Vinculo }> {
  const fuera: Array<{ origen: Clave; vinculo: Vinculo }> = [];
  for (const h of libro.hojas) {
    for (const [origen, vinculo] of Object.entries(h.vinculos ?? {})) {
      if (partirClave(vinculo.destino)?.hoja === hojaId) fuera.push({ origen, vinculo });
    }
  }
  return fuera;
}

/* ── buscar y reemplazar · bloque 39 ──────────────────────────────────────── */

const escaparParaRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Cuántas celdas del rango cambiarían al reemplazar, y cuántas de ésas son
 * fórmulas — la cifra que `revisar` enseña ANTES de tocar nada, porque
 * reemplazar dentro de una fórmula es peligroso: se puede partir en dos una
 * referencia sin que nada más avise.
 */
function coincidenciasParaReemplazar(h: Hoja, caja: Caja, buscar: string): { total: number; formulas: number } {
  if (!buscar) return { total: 0, formulas: 0 };
  const patron = new RegExp(escaparParaRegex(buscar), 'i');
  let total = 0;
  let formulas = 0;
  for (let f = caja.f0; f <= caja.f1; f += 1) {
    for (let c = caja.c0; c <= caja.c1; c += 1) {
      const crudo = h.celdas[dir(c, f)]?.crudo ?? '';
      if (!patron.test(crudo)) continue;
      total += 1;
      if (esFormula(crudo)) formulas += 1;
    }
  }
  return { total, formulas };
}

const LISTA: Comando[] = [
  {
    nombre: 'escribir',
    etiqueta: (a) => `Escribir «${txt(a, 'crudo')}» en ${txt(a, 'celda')}`,
    aplicar: (libro, a) => {
      const p = dirAColFila(txt(a, 'celda'));
      if (!p) return libro;
      const hojaId = txt(a, 'hoja', libro.activa);
      const previa = hojaDe(libro, hojaId)?.celdas[txt(a, 'celda')];
      const crudo = txt(a, 'crudo');
      const out = conCelda(libro, hojaId, p.col, p.fila, crudo === '' && !previa?.formato ? null : { ...previa, crudo });
      // Una tabla crece sola cuando se escribe justo debajo de su última fila.
      // Borrar (`crudo === ''`) nunca hace crecer nada, igual que en Excel.
      return crudo === '' ? out : crecerTablaSiToca(out, hojaId, p.col, p.fila);
    },
    toca: (libro, a) => {
      const p = dirAColFila(txt(a, 'celda'));
      return p ? [clave(txt(a, 'hoja', libro.activa), p.col, p.fila)] : [];
    },
    revisar: (libro, a) => {
      const crudo = txt(a, 'crudo');
      if (!dirAColFila(txt(a, 'celda'))) return `«${txt(a, 'celda')}» no es una celda`;
      const hojaId = txt(a, 'hoja', libro.activa);
      const h = hojaDe(libro, hojaId);
      if (!h) return 'esa hoja no existe';
      if (esFormula(crudo)) {
        // Excel no acepta una fórmula que no entiende: la rechaza al escribirla,
        // con el dedo puesto en el sitio. Lo que SÍ acepta es una función que no
        // conoce, y enseña #¿NOMBRE? en la celda — eso no se revisa aquí. Y una
        // fórmula nunca se revisa contra la validación de datos (bloque 32): la
        // razón está en `violaValidacion`.
        const r = parsear(crudo);
        return r.ok ? null : `${r.mensaje} (posición ${r.pos + 1})`;
      }
      /*
       * La validación de datos, bloque 32, y **sólo para lo que se escribe
       * ahora** — `violaValidacion` ya deja pasar una celda vacía, así que
       * borrar nunca choca con nada, y una celda que ya estaba mal escrita
       * ANTES de poner la regla no se toca hasta que alguien la reescriba.
       *
       * `bloquea: true` es «Detener»: no hay `confirmado` que lo salte, igual
       * que en Excel. `bloquea: false` es «Advertencia»: la primera vez avisa
       * y con `confirmado` puesto deja pasar — la misma coreografía de dos
       * pulsaciones que ya usa `combinarCeldas` (`SE_CONFIRMA`, más abajo).
       */
      const regla = validacionEnCelda(h, txt(a, 'celda'));
      if (regla && violaValidacion(regla, crudo) && (regla.bloquea || !siNo(a, 'confirmado'))) {
        return regla.aviso || 'ese valor no está permitido por la validación de datos de esta celda';
      }
      return null;
    },
  },
  {
    nombre: 'borrar',
    etiqueta: (a) => `Borrar el contenido de ${txt(a, 'rango')}`,
    aplicar: (libro, a) => {
      const caja = cajaDeArgs(a);
      if (!caja) return libro;
      const hojaId = txt(a, 'hoja', libro.activa);
      let out = libro;
      for (let f = caja.f0; f <= caja.f1; f += 1) {
        for (let c = caja.c0; c <= caja.c1; c += 1) {
          const previa = hojaDe(out, hojaId)?.celdas[dir(c, f)];
          // Borrar el CONTENIDO no borra el formato: son dos botones distintos
          // en Excel y confundirlos deja al alumno sin poder deshacer sólo uno.
          out = conCelda(out, hojaId, c, f, previa?.formato ? { crudo: '', formato: previa.formato } : null);
        }
      }
      return out;
    },
    toca: (libro, a) => {
      const caja = cajaDeArgs(a);
      return caja ? clavesDeCaja(txt(a, 'hoja', libro.activa), caja) : [];
    },
  },
  {
    /*
     * DEFECTO encontrado construyendo `of-excel-macros` (bloques 55 y 56,
     * 15-ago-2026) y corregido aquí, en su sitio.
     *
     * La `etiqueta` decía siempre «Formato general en {rango}», sin importar
     * qué se hubiera pintado: `negrita`, `color-relleno`, `bordes`,
     * `alineacion`… ninguno de los interruptores de `cinta.ts` (`conFormato`)
     * manda un `args.tipo`, así que `txt(a, 'tipo', 'general')` caía siempre
     * en su valor por omisión. Es inofensivo mientras nadie LEE la etiqueta
     * —hasta hoy, sólo se pintaba en un botón de la cinta—, pero
     * `of-excel-macros` la lee de verdad: es lo que el alumno ve al abrir
     * «Ver los pasos» de su propia macro. Un encargo que graba «negrita» y
     * «color de relleno» sobre el mismo rango dejaba DOS líneas idénticas
     * —«Formato general en A3:B3», dos veces—, sin manera de distinguir cuál
     * hizo qué. Ahí es exactamente donde «leer la macro» tenía que enseñar
     * algo, y no enseñaba nada.
     *
     * La causa es la misma familia que el defecto H del §44.4 en su día:
     * un campo con un valor por omisión que se confunde con «no venía nada».
     * La corrección no toca `conFormato` ni `formatoNuevo` —el bug no estaba
     * en qué se aplica, sólo en cómo se cuenta después—: describe cada campo
     * que SÍ llegó en `args`, uno por uno, y sólo cae en «Formato (general)»
     * cuando de verdad no llegó ninguno.
     */
    nombre: 'formato',
    etiqueta: (a) => {
      if (a.tipo !== undefined && txt(a, 'tipo') !== 'general') {
        return `Formato ${txt(a, 'tipo')} en ${txt(a, 'rango')}`;
      }
      const partes: string[] = [];
      if (a.negrita !== undefined) partes.push(siNo(a, 'negrita') ? 'negrita' : 'quitar la negrita');
      if (a.cursiva !== undefined) partes.push(siNo(a, 'cursiva') ? 'cursiva' : 'quitar la cursiva');
      if (a.subrayado !== undefined) partes.push(siNo(a, 'subrayado') ? 'subrayado' : 'quitar el subrayado');
      if (a.ajustarTexto !== undefined) {
        partes.push(siNo(a, 'ajustarTexto') ? 'ajustar el texto' : 'quitar el ajuste de texto');
      }
      if (a.alineacion !== undefined) {
        partes.push(txt(a, 'alineacion') ? `alinear a la ${txt(a, 'alineacion')}` : 'quitar la alineación');
      }
      if (a.colorLetra !== undefined) {
        partes.push(txt(a, 'colorLetra') ? `letra de color ${txt(a, 'colorLetra')}` : 'quitar el color de letra');
      }
      if (a.colorRelleno !== undefined) {
        partes.push(txt(a, 'colorRelleno') ? `fondo de color ${txt(a, 'colorRelleno')}` : 'quitar el color de fondo');
      }
      if (a.bordes !== undefined) partes.push(txt(a, 'bordes') ? 'bordes' : 'quitar los bordes');
      if (a.decimales !== undefined) {
        const d = num(a, 'decimales', 2);
        partes.push(d >= 0 ? `${d} decimales` : 'quitar los decimales');
      }
      return `Formato (${partes.length ? partes.join(', ') : 'general'}) en ${txt(a, 'rango')}`;
    },
    aplicar: (libro, a) => {
      const caja = cajaDeArgs(a);
      if (!caja) return libro;
      const hojaId = txt(a, 'hoja', libro.activa);
      let out = libro;
      for (let f = caja.f0; f <= caja.f1; f += 1) {
        for (let c = caja.c0; c <= caja.c1; c += 1) {
          const previa = hojaDe(out, hojaId)?.celdas[dir(c, f)];
          out = conCelda(out, hojaId, c, f, {
            crudo: previa?.crudo ?? '',
            // La caja entera y la celda: los bordes de «contorno» sólo se pueden
            // repartir sabiendo cuál de las marcadas es ésta (ver `ladosDeBorde`).
            formato: formatoNuevo(previa?.formato, a, caja, c, f),
          });
        }
      }
      return out;
    },
    // El formato no cambia ningún valor: no ensucia nada. Es la mitad del
    // bloque 6 dicha en una línea de código.
    toca: () => [],
  },
  {
    /*
     * ── Combinar celdas · bloque 10 ────────────────────────────────────────
     *
     * **Combinar TIRA contenido, y por eso es el único comando de formato que
     * ensucia el recálculo.** Al combinar `A1:C1`, Excel se queda con lo que hay
     * en `A1` y **se lleva por delante lo de `B1` y `C1`** después de avisarlo en
     * un cuadro de diálogo. Aquí igual: `revisar` dice la frase de Excel palabra
     * por palabra y `aplicar` vacía las tapadas, así que `toca` son todas las
     * celdas de la caja y no la lista vacía de sus vecinos de arriba.
     *
     * ── Qué pasa con una fórmula que apunta a una celda tapada ──────────────
     *
     * **Sigue existiendo y vale vacío.** No hay un error nuevo, no hay
     * `#¡REF!`, no hay nada que aprender de más: `=B1` después de combinar
     * `A1:C1` es una referencia a una celda que existe y que está vacía, o sea
     * exactamente lo mismo que era antes de que alguien escribiera en ella. La
     * fidelidad se consigue **sin tocar el motor de fórmulas** —que no sabe ni
     * que existen las combinaciones— porque lo que se guarda en la hoja es la
     * pinta, y lo que hace que `B1` valga vacío es que su contenido se tiró de
     * verdad. Un modelo que dejara el contenido escondido y le enseñara vacío a
     * las fórmulas tendría dos verdades sobre la misma celda; éste tiene una.
     *
     * Es también lo que hace honesto lo de abajo: **separar no resucita nada**.
     * Lo tirado se tiró, igual que en Excel, y si el alumno se arrepiente lo que
     * tiene es Deshacer.
     *
     * `confirmado` es el «Aceptar» del cuadro de diálogo. Sin él, `revisar`
     * rechaza la combinación que perdería contenido — que es como esta sala dice
     * «te voy a pedir permiso»— y con él pasa. Un gesto grabado en una macro lo
     * lleva puesto, así que al reproducirla no vuelve a preguntar: el alumno ya
     * contestó el día que la grabó.
     */
    nombre: 'combinarCeldas',
    etiqueta: (a) => `Combinar ${txt(a, 'rango')}${siNo(a, 'centrar') ? ' y centrar' : ''}`,
    aplicar: (libro, a) => {
      const caja = cajaDeArgs(a);
      if (!caja) return libro;
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return libro;
      let out = libro;
      for (let f = caja.f0; f <= caja.f1; f += 1) {
        for (let c = caja.c0; c <= caja.c1; c += 1) {
          if (c === caja.c0 && f === caja.f0) continue;
          // La tapada pierde el contenido y **conserva su formato**: si un día se
          // separan, las celdas vuelven pintadas como estaban. Es lo que hace
          // Excel, y es lo mismo que ya hacía `borrar`.
          const previa = hojaDe(out, hojaId)?.celdas[dir(c, f)];
          out = conCelda(out, hojaId, c, f, previa?.formato ? { crudo: '', formato: previa.formato } : null);
        }
      }
      if (siNo(a, 'centrar')) {
        const ancla = hojaDe(out, hojaId)?.celdas[dir(caja.c0, caja.f0)];
        out = conCelda(out, hojaId, caja.c0, caja.f0, {
          crudo: ancla?.crudo ?? '',
          formato: { ...(ancla?.formato ?? { tipo: 'general' }), alineacion: 'centro' },
        });
      }
      const texto = textoDeCaja(caja);
      const previas = hojaDe(out, hojaId)?.combinadas ?? [];
      return conCombinadas(out, hojaId, previas.includes(texto) ? previas : [...previas, texto]);
    },
    toca: (libro, a) => {
      const caja = cajaDeArgs(a);
      return caja ? clavesDeCaja(txt(a, 'hoja', libro.activa), caja) : [];
    },
    revisar: (libro, a) => {
      const caja = cajaDeArgs(a);
      if (!caja) return `«${txt(a, 'rango')}» no es un rango`;
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      if (caja.c0 === caja.c1 && caja.f0 === caja.f1) return 'para combinar hacen falta al menos dos celdas';
      if (combinacionesDe(libro, hojaId).some((m) => seSolapan(m.caja, caja))) {
        return 'ahí ya hay celdas combinadas: sepáralas primero';
      }
      if (siNo(a, 'confirmado')) return null;
      // La frase de Excel, entera. Es lo único que separa combinar de perder
      // datos sin enterarse, y por eso se dice antes y no después.
      const celdas = hojaDe(libro, hojaId)?.celdas ?? {};
      let hay = false;
      for (let f = caja.f0; f <= caja.f1 && !hay; f += 1) {
        for (let c = caja.c0; c <= caja.c1 && !hay; c += 1) {
          if (c === caja.c0 && f === caja.f0) continue;
          if ((celdas[dir(c, f)]?.crudo ?? '') !== '') hay = true;
        }
      }
      return hay
        ? 'sólo se conservará el valor de la celda superior izquierda; lo demás se perderá. Vuelve a pulsar para continuar'
        : null;
    },
  },
  {
    /*
     * Separar es quitar un renglón de la lista, y **nada más**: no devuelve
     * ningún contenido, porque el que se tiró se tiró al combinar (ver arriba).
     * Por eso su `toca` es la lista vacía de verdad y no por descuido — separar
     * no cambia ni un valor, sólo deja de dibujar tres celdas como una.
     *
     * Se quita **toda combinación que toque lo marcado**, que es lo que hace el
     * botón de Excel: con el cursor dentro de la celda combinada, o con media
     * tabla seleccionada, se separan las que caigan dentro.
     */
    nombre: 'separarCeldas',
    etiqueta: (a) => `Separar las celdas de ${txt(a, 'rango')}`,
    aplicar: (libro, a) => {
      const caja = cajaDeArgs(a);
      if (!caja) return libro;
      const hojaId = txt(a, 'hoja', libro.activa);
      const quedan = combinacionesDe(libro, hojaId)
        .filter((m) => !seSolapan(m.caja, caja))
        .map((m) => m.texto);
      return quedan.length === (hojaDe(libro, hojaId)?.combinadas?.length ?? 0)
        ? libro
        : conCombinadas(libro, hojaId, quedan);
    },
    toca: () => [],
  },
  {
    nombre: 'rellenarAbajo',
    etiqueta: (a) => `Rellenar hacia abajo ${txt(a, 'rango')}`,
    aplicar: (libro, a) => {
      const caja = cajaDeArgs(a);
      if (!caja) return libro;
      return estampar(libro, txt(a, 'hoja', libro.activa), { ...caja, f1: caja.f0 }, caja);
    },
    toca: (libro, a) => {
      const caja = cajaDeArgs(a);
      return caja ? clavesDeCaja(txt(a, 'hoja', libro.activa), caja) : [];
    },
  },
  {
    nombre: 'rellenarDerecha',
    etiqueta: (a) => `Rellenar hacia la derecha ${txt(a, 'rango')}`,
    aplicar: (libro, a) => {
      const caja = cajaDeArgs(a);
      if (!caja) return libro;
      return estampar(libro, txt(a, 'hoja', libro.activa), { ...caja, c1: caja.c0 }, caja);
    },
    toca: (libro, a) => {
      const caja = cajaDeArgs(a);
      return caja ? clavesDeCaja(txt(a, 'hoja', libro.activa), caja) : [];
    },
  },
  {
    /*
     * ── Rellenar una SERIE (bloque 8) ──────────────────────────────────────
     *
     * La semilla **no se pasa en el gesto: se lee del rango**. Son las celdas ya
     * escritas del principio, y en cuanto hay un hueco se acabó la semilla y
     * empieza lo que hay que rellenar. Se hace así porque es lo que el alumno
     * hizo con el ratón —marcó desde lo que escribió hasta donde quiere llegar— y
     * porque un gesto que llevara la semilla dentro se desincronizaría del libro
     * el día que la macro se reproduzca sobre otros datos.
     *
     * Cada columna (o cada fila, si es hacia la derecha) se rellena **por su
     * cuenta**, como en Excel: con dos columnas seleccionadas salen dos series
     * distintas y no una sola leída en zigzag.
     *
     * Y si la semilla trae una fórmula se sale por la puerta de `rellenarAbajo`
     * —copiar trasladando referencias—, porque una serie de fórmulas no significa
     * nada: `=B2*C2`, `=B3*C3` no es una progresión, es la misma regla aplicada a
     * otra fila. Aquí sí se puede trasladar y en `serieDesde` no, porque este
     * comando es quien sabe cuánto se movió cada celda.
     */
    nombre: 'rellenarSerie',
    etiqueta: (a) =>
      `Rellenar la serie ${txt(a, 'rango')} hacia ${txt(a, 'direccion', 'abajo') === 'derecha' ? 'la derecha' : 'abajo'}`,
    aplicar: (libro, a) => {
      const caja = cajaDeArgs(a);
      if (!caja) return libro;
      const hojaId = txt(a, 'hoja', libro.activa);
      const h = hojaDe(libro, hojaId);
      if (!h) return libro;
      const abajo = txt(a, 'direccion', 'abajo') !== 'derecha';
      const lineas = abajo ? caja.c1 - caja.c0 + 1 : caja.f1 - caja.f0 + 1;
      const largo = abajo ? caja.f1 - caja.f0 + 1 : caja.c1 - caja.c0 + 1;
      let out = libro;
      for (let l = 0; l < lineas; l += 1) {
        // Dónde cae la celda número `i` de esta línea. Es lo único que cambia
        // entre rellenar hacia abajo y hacia la derecha, así que es lo único que
        // se escribe dos veces.
        const col = (i: number): number => (abajo ? caja.c0 + l : caja.c0 + i);
        const fila = (i: number): number => (abajo ? caja.f0 + i : caja.f0 + l);
        const crudoDe = (i: number): string => h.celdas[dir(col(i), fila(i))]?.crudo ?? '';

        let k = 0;
        while (k < largo && crudoDe(k) !== '') k += 1;
        /*
         * Sin nada escrito no hay de dónde seguir, y con todo escrito no queda
         * hueco donde escribir. Lo primero es lo que hace Excel; **lo segundo
         * no**, y la frase que había aquí decía que sí (corregido el
         * 15-ago-2026, construyendo `n5-tus-primeras-formulas`).
         *
         * En Excel de verdad el cuadrito **pisa** lo que ya está escrito: se
         * marca una celda con una fórmula, se arrastra encima de seis números
         * viejos y los seis se sustituyen. Aquí no puede, y la causa no es esta
         * línea: es que **al gesto sólo le llega el rango final** —`D4:D9`— y no
         * dónde empezó el arrastre, así que la semilla hay que deducirla de las
         * celdas llenas del principio y con todas llenas no hay nada que
         * deducir. Arreglarlo es darle al gesto un argumento más («cuántas
         * celdas eran la semilla»), y eso es cambiarle el formato a lo que
         * graba la macro del bloque 55, no tocar un `continue`.
         *
         * Mientras tanto **la otra puerta sí lo hace**: «Rellenar hacia abajo»
         * (`rellenarAbajo`) estampa la primera fila sobre el resto del rango
         * pase lo que pase, y es la que usa la clase 4 para convertir en reglas
         * una columna de números tecleados a mano.
         */
        if (k === 0 || k === largo) continue;

        const semillas = Array.from({ length: k }, (_, i) => crudoDe(i));
        if (semillas.some(esFormula)) {
          out = estampar(
            out,
            hojaId,
            { c0: col(0), f0: fila(0), c1: col(k - 1), f1: fila(k - 1) },
            { c0: col(0), f0: fila(0), c1: col(largo - 1), f1: fila(largo - 1) },
          );
          continue;
        }
        const nuevos = serieDesde(semillas, largo - k);
        for (let i = 0; i < nuevos.length; i += 1) {
          // El formato viaja con la serie, como al arrastrar el cuadrito: el
          // molde es la celda de la semilla que le tocaría en el mosaico.
          const molde = h.celdas[dir(col(i % k), fila(i % k))];
          out = conCelda(out, hojaId, col(k + i), fila(k + i), { crudo: nuevos[i], formato: molde?.formato });
        }
      }
      return out;
    },
    toca: (libro, a) => {
      const caja = cajaDeArgs(a);
      return caja ? clavesDeCaja(txt(a, 'hoja', libro.activa), caja) : [];
    },
  },
  {
    /*
     * ── Pegar, con sus tres modos y su traslado apagable (bloque 11) ────────
     *
     * **Por qué este comando construye un motor y por qué eso está bien.**
     *
     * «Pegar valores» necesita el VALOR calculado, y el valor no vive en el
     * libro: vive en la caché del motor (decisión 1 de `modelo.ts`). Y `aplicar`
     * es puro sobre el libro y tiene que seguir siéndolo, porque de ahí cuelga la
     * prueba del §45.6 —reproducir una macro sobre el libro de partida da el
     * mismo libro— y la comparación con `toEqual` de las pruebas. Así que el
     * comando **se fabrica un motor temporal con el libro que le llega** y le
     * pregunta los valores a él.
     *
     * No es un apaño: es lo que significa pegar valores. «Congela lo que estas
     * celdas enseñan AHORA», y al reproducir una macro «ahora» es el estado del
     * libro en ese punto de la macro, que es exactamente lo que hay dentro de
     * `libro`. Sigue siendo puro —mismo libro dentro, mismo libro fuera— y sigue
     * siendo determinista, porque el motor temporal no lee ni reloj ni azar.
     *
     * Su precio, dicho en voz alta: **cuesta un recálculo completo del libro**.
     * Se paga porque pegar valores es una acción rara y voluntaria —no se pulsa
     * cincuenta veces seguidas como la negrita— y porque la alternativa sería
     * meter la caché dentro de la firma de `aplicar` y perder la pureza para
     * siempre a cambio de unos milisegundos en el botón menos usado del grupo.
     *
     * `ahora` es opcional y sólo importa si lo que se congela es un `=HOY()`: la
     * cinta lo rellena con el reloj del motor de la pantalla, igual que
     * `nuevaHoja` lleva su `id` escrito, para que la macro reproducida no dependa
     * del día en que se reproduzca.
     *
     * **Reserva escrita a propósito (lo que Excel hace y aquí NO):** al mover
     * datos, Excel además reescribe las fórmulas de OTRAS celdas que apuntaban a
     * lo movido, para que sigan al dato. Eso aquí no se construye. Requiere
     * recorrer el libro entero buscando referencias que caigan dentro del origen
     * —el mismo trabajo de `ajustarPorFilas`, pero con una caja en vez de un eje—
     * y no lo pide ningún bloque del grado Básico: el bloque 11 es cortar, copiar
     * y pegar. Cuando llegue, va aquí y en ningún otro sitio.
     *
     * **Segunda reserva, más chica:** una fórmula que devuelve un texto que
     * empieza por `=` se congela como fórmula, porque este modelo no tiene la
     * comilla de Excel para forzar texto. No hay dónde guardarlo hoy.
     */
    nombre: 'pegar',
    etiqueta: (a) => {
      const modo = modoDe(a);
      const que = modo === 'valores' ? ' sólo los valores de' : modo === 'formato' ? ' sólo el formato de' : '';
      return `Pegar${que} ${txt(a, 'origen')} en ${txt(a, 'destino')}`;
    },
    aplicar: (libro, a) => {
      const origen = cajaDeTexto(txt(a, 'origen'));
      const destino = cajaDeTexto(txt(a, 'destino'));
      if (!origen || !destino) return libro;
      const hojaId = txt(a, 'hoja', libro.activa);
      const modo = modoDe(a);
      // El motor sólo se construye si de verdad hace falta: pegar «todo» y pegar
      // formato no miran ni un valor y no pagan nada.
      const espejo =
        modo === 'valores'
          ? crearMotor(libro, a.ahora === undefined ? undefined : { ahora: num(a, 'ahora', 0) })
          : null;
      return estampar(libro, hojaId, origen, cajaDePegado(origen, destino), {
        modo,
        // Al COPIAR las referencias se mueven; al CORTAR no. `=B2*C2` cortado y
        // pegado tres filas abajo sigue diciendo `=B2*C2`, porque no se copió la
        // regla: se mudó de casa. Por omisión se traslada, que es lo de siempre.
        trasladar: a.trasladar === undefined ? true : siNo(a, 'trasladar'),
        valor: espejo ? (col, fila) => valorDe(espejo, hojaId, col, fila) : undefined,
      });
    },
    toca: (libro, a) => {
      // Pegar SÓLO formato no cambia ni un valor, igual que el comando `formato`:
      // lo que llega es la pinta de la celda, y ninguna fórmula lee la pinta.
      if (modoDe(a) === 'formato') return [];
      const origen = cajaDeTexto(txt(a, 'origen'));
      const destino = cajaDeTexto(txt(a, 'destino'));
      // Con la caja ya estirada, o se ensuciaría una celda y se escribirían cinco.
      return origen && destino ? clavesDeCaja(txt(a, 'hoja', libro.activa), cajaDePegado(origen, destino)) : [];
    },
  },
  {
    nombre: 'nombrarRango',
    etiqueta: (a) => `Nombrar ${txt(a, 'rango')} como «${txt(a, 'nombre')}»`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const h = hojaDe(libro, hojaId);
      if (!h) return libro;
      // Se guarda con el NOMBRE de la hoja, no con su id: es lo que se escribe
      // en una fórmula, y así el nombre se resuelve con el mismo analizador.
      return { ...libro, nombres: { ...libro.nombres, [txt(a, 'nombre')]: `${h.nombre}!${txt(a, 'rango')}` } };
    },
    toca: () => 'todo',
    revisar: (libro, a) => {
      const n = txt(a, 'nombre');
      if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ_][A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ_.]*$/.test(n)) {
        return 'un nombre empieza por letra y no lleva espacios';
      }
      if (dirAColFila(n)) return `«${n}» es una dirección de celda: no puede ser un nombre`;
      return cajaDeTexto(txt(a, 'rango')) ? null : `«${txt(a, 'rango')}» no es un rango`;
    },
  },
  {
    nombre: 'insertarFila',
    etiqueta: (a) => `Insertar ${num(a, 'cuantas', 1)} fila(s) en la ${num(a, 'fila', 0) + 1}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const fila = num(a, 'fila', 0);
      const cuantas = Math.max(1, num(a, 'cuantas', 1));
      return moverFilas(ajustarPorFilas(libro, hojaId, fila, cuantas), hojaId, fila, cuantas);
    },
    toca: () => 'todo',
  },
  {
    nombre: 'borrarFila',
    etiqueta: (a) => `Borrar ${num(a, 'cuantas', 1)} fila(s) desde la ${num(a, 'fila', 0) + 1}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const fila = num(a, 'fila', 0);
      const cuantas = Math.max(1, num(a, 'cuantas', 1));
      return moverFilas(ajustarPorFilas(libro, hojaId, fila, -cuantas), hojaId, fila, -cuantas);
    },
    toca: () => 'todo',
  },
  {
    nombre: 'insertarColumna',
    etiqueta: (a) =>
      `Insertar ${num(a, 'cuantas', 1)} columna(s) en la ${letraDeColumna(num(a, 'columna', 0))}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const col = num(a, 'columna', 0);
      const cuantas = Math.max(1, num(a, 'cuantas', 1));
      return moverColumnas(ajustarPorColumnas(libro, hojaId, col, cuantas), hojaId, col, cuantas);
    },
    toca: () => 'todo',
  },
  {
    nombre: 'borrarColumna',
    etiqueta: (a) =>
      `Borrar ${num(a, 'cuantas', 1)} columna(s) desde la ${letraDeColumna(num(a, 'columna', 0))}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const col = num(a, 'columna', 0);
      const cuantas = Math.max(1, num(a, 'cuantas', 1));
      return moverColumnas(ajustarPorColumnas(libro, hojaId, col, -cuantas), hojaId, col, -cuantas);
    },
    toca: () => 'todo',
  },
  {
    nombre: 'nuevaHoja',
    // El `id` viene en el gesto a propósito: ver la regla de la cabecera.
    etiqueta: (a) => `Nueva hoja «${txt(a, 'nombre')}»`,
    aplicar: (libro, a) => {
      const id = txt(a, 'id');
      if (!id || hojaDe(libro, id)) return libro;
      return { ...libro, hojas: [...libro.hojas, hojaVacia(id, txt(a, 'nombre', id))] };
    },
    // Parece que crear una hoja vacía no cambia ningún valor, y sí lo cambia:
    // una fórmula que decía `Resumen!A1` cuando no había ninguna hoja Resumen
    // estaba enseñando #¡REF!, y al crearla tiene que dejar de enseñarlo. Sin
    // esta línea el error se queda pegado en pantalla hasta el siguiente
    // recálculo, que puede no llegar nunca.
    toca: () => 'todo',
    revisar: (libro, a) => {
      if (!txt(a, 'id')) return 'a una hoja nueva hay que darle un identificador';
      if (hojaDe(libro, txt(a, 'id'))) return 'ya hay una hoja con ese identificador';
      if (hojaPorNombre(libro, txt(a, 'nombre'))) return 'ya hay una hoja con ese nombre';
      return null;
    },
  },
  {
    nombre: 'renombrarHoja',
    etiqueta: (a) => `Renombrar la hoja como «${txt(a, 'nombre')}»`,
    aplicar: (libro, a) => {
      const id = txt(a, 'hoja', libro.activa);
      return { ...libro, hojas: libro.hojas.map((h) => (h.id === id ? { ...h, nombre: txt(a, 'nombre') } : h)) };
    },
    // Cambiar el nombre de una hoja cambia a quién apuntan las fórmulas que la
    // nombraban: hay que recalcularlo todo aunque no se haya tocado un dato.
    toca: () => 'todo',
    /*
     * La revisión llegó el 15-ago-2026, con la clase que estrena el renombrado
     * (`n5-captura-y-ordena`, bloque 16), y llegó porque faltaba: `nuevaHoja` sí
     * comprobaba que el nombre estuviera libre y **renombrar no**, con lo que
     * había una puerta abierta para dejar dos hojas llamadas igual en un libro.
     * Eso no es un detalle de pulcritud: en una fórmula una hoja se llama por su
     * NOMBRE (`=Gastos!D8`), y `hojaPorNombre` devuelve la primera que encuentre
     * — o sea que las fórmulas de la segunda «Gastos» empezarían a leer los datos
     * de la primera **sin dar ningún error**. La peor forma de fallar, la que no
     * se ve.
     *
     * Excel dice exactamente esto en un cuadro de diálogo y no acepta el nombre.
     */
    revisar: (libro, a) => {
      const nombre = txt(a, 'nombre').trim();
      if (!nombre) return 'una hoja tiene que llamarse de alguna manera';
      const id = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, id)) return 'esa hoja no existe';
      const otra = hojaPorNombre(libro, nombre);
      // Renombrarla como ya se llamaba no es un choque consigo misma.
      return otra && otra.id !== id ? 'ya hay una hoja con ese nombre' : null;
    },
  },
  {
    /*
     * ── Mover una hoja de sitio (bloque 16) ────────────────────────────────
     *
     * **Y por qué su `toca` es `[]` de verdad.**
     *
     * Es la pregunta que hay que hacerse dos veces, porque el defecto del §46.6
     * fue exactamente un `toca` que decía menos de lo que el comando tocaba, y
     * aquí al lado hay tres hojas que dicen `'todo'`: `nuevaHoja` lo dice porque
     * una hoja nueva puede apagar un `#¡REF!` que estaba en pantalla, y
     * `renombrarHoja` lo dice porque una fórmula que decía `Gastos!D8` deja de
     * apuntar a donde apuntaba en cuanto la hoja se llama de otra manera.
     *
     * Mover no es ninguna de las dos cosas, y se puede decir por qué en una
     * frase: **en una fórmula una hoja se nombra, nunca se numera**. No existe
     * `Hoja3!A1` queriendo decir «la tercera»; existe `Gastos!A1`. La clave del
     * grafo es `id!A1` (decisión 4 de `modelo.ts`) y el id no cambia; el nombre
     * tampoco; `hojaDe` y `hojaPorNombre` buscan por id y por nombre, y ni una
     * sola función del motor mira `libro.hojas[n]`. Lo único que cambia es el
     * orden de las lengüetas de abajo, que es dónde se dibujan, no qué valen.
     *
     * El día que exista una función que numere hojas —`=HOJA()` de Excel
     * devuelve el número de la hoja— este `toca` pasa a `'todo'`. Está dicho aquí
     * para que quien la construya lo lea.
     */
    nombre: 'moverHoja',
    etiqueta: (a) => `Mover la hoja al lugar ${num(a, 'posicion', 0) + 1}`,
    aplicar: (libro, a) => {
      const id = txt(a, 'hoja', libro.activa);
      const desde = libro.hojas.findIndex((h) => h.id === id);
      if (desde < 0) return libro;
      // Se recorta a los extremos en vez de rechazarse: arrastrar una lengüeta
      // más allá de la última la deja la última, que es lo que hace el programa
      // de verdad y lo que el alumno espera al soltarla fuera de la fila.
      const hasta = Math.max(0, Math.min(libro.hojas.length - 1, num(a, 'posicion', desde)));
      if (hasta === desde) return libro;
      const hojas = [...libro.hojas];
      const [movida] = hojas.splice(desde, 1);
      hojas.splice(hasta, 0, movida);
      return { ...libro, hojas };
    },
    toca: () => [],
  },
  {
    /*
     * ── El color de la lengüeta (bloque 16) ────────────────────────────────
     *
     * `toca: []` por la misma razón que arriba, y todavía más clara: el color no
     * se puede nombrar desde una fórmula. No hay `=COLOR.HOJA()`, no entra en
     * ninguna cuenta y no hay manera de que un valor dependa de él. Es la misma
     * línea que el comando `formato`, que también devuelve `[]` porque cambiar la
     * pinta de una celda no cambia lo que vale.
     *
     * **Reserva:** «sin color» —quitarle el color a una lengüeta ya pintada— no
     * se construye hoy. `revisar` exige un color escrito, así que no hay forma de
     * pedirlo por accidente y quedarse sin saber qué pasó.
     */
    nombre: 'colorHoja',
    etiqueta: (a) => `Pintar la lengüeta de la hoja de ${txt(a, 'color')}`,
    aplicar: (libro, a) => {
      const id = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, id)) return libro;
      const color = txt(a, 'color');
      return { ...libro, hojas: libro.hojas.map((h) => (h.id === id ? { ...h, color } : h)) };
    },
    toca: () => [],
    revisar: (libro, a) => {
      if (!hojaDe(libro, txt(a, 'hoja', libro.activa))) return 'esa hoja no existe';
      const color = txt(a, 'color');
      return /^#[0-9a-fA-F]{6}$/.test(color)
        ? null
        : `«${color}» no es un color: se escribe con # y seis cifras, como #107c41`;
    },
  },
  {
    nombre: 'activarHoja',
    etiqueta: (a) => `Ir a la hoja ${txt(a, 'hoja')}`,
    aplicar: (libro, a) => (hojaDe(libro, txt(a, 'hoja')) ? { ...libro, activa: txt(a, 'hoja') } : libro),
    toca: () => [],
  },
  {
    /*
     * ── Insertar una gráfica (bloque 17) ───────────────────────────────────
     *
     * `datos` es un **domicilio**, no un contenido: `"A1:B9"`. La gráfica no se
     * guarda ni un número, y por eso se recalcula sola cuando cambia una celda
     * —lee la caché del motor igual que la lee una celda—. Guardar los valores
     * dentro sería convertir la gráfica en una foto, y el bloque 17 entero va de
     * que no lo es.
     *
     * El `id` viene en el gesto y no se inventa aquí: ver la nota (1) de arriba.
     */
    nombre: 'insertarGrafica',
    etiqueta: (a) => `Insertar una gráfica de ${txt(a, 'tipo', 'columnas')} con ${txt(a, 'datos')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const id = txt(a, 'id');
      const tipo = txt(a, 'tipo', 'columnas');
      const datos = cajaDeTexto(txt(a, 'datos'));
      if (!id || !datos || !esTipoDeGrafica(tipo) || !hojaDe(libro, hojaId)) return libro;
      if (graficaDe(libro, hojaId, id)) return libro;
      const grafica: Grafica = {
        id,
        tipo,
        datos: txt(a, 'datos').trim().toUpperCase(),
        // La leyenda nace encendida porque una gráfica de varias series sin
        // leyenda no se puede leer, y apagarla es un botón del bloque 18.
        leyenda: true,
        ancla: anclaDeTexto(txt(a, 'ancla')) ?? anclaJuntoALosDatos(datos),
      };
      if (a.titulo !== undefined) grafica.titulo = txt(a, 'titulo');
      return conGraficas(libro, hojaId, [...graficasDe(libro, hojaId), grafica]);
    },
    toca: () => [],
    revisar: (libro, a) => {
      if (!hojaDe(libro, txt(a, 'hoja', libro.activa))) return 'esa hoja no existe';
      if (!txt(a, 'id')) return 'a una gráfica hay que darle un identificador';
      const tipo = txt(a, 'tipo', 'columnas');
      if (!esTipoDeGrafica(tipo)) {
        return `«${tipo}» no es un tipo de gráfica: columnas, barras, lineas, circular o dispersion`;
      }
      if (!cajaDeTexto(txt(a, 'datos'))) return `«${txt(a, 'datos')}» no es un rango del que sacar los números`;
      if (txt(a, 'ancla') && !anclaDeTexto(txt(a, 'ancla'))) return `«${txt(a, 'ancla')}» no es un sitio de la hoja`;
      /*
       * Dos gráficas con el mismo identificador no pueden convivir: la segunda
       * taparía a la primera y ningún comando podría volver a nombrar a la de
       * abajo. Se dice en vez de dejarlo pasar, porque desde la cinta el `id`
       * sale de la selección y del tipo, así que este aviso sólo aparece cuando
       * el alumno pulsa dos veces el mismo botón sobre lo mismo — y entonces la
       * frase le dice exactamente lo que hizo.
       */
      return graficaDe(libro, txt(a, 'hoja', libro.activa), txt(a, 'id'))
        ? 'esa gráfica ya está hecha con esos mismos datos: muévela o bórrala antes de hacer otra igual'
        : null;
    },
  },
  {
    /*
     * ── Cambiarle algo a una gráfica (bloques 18, 37 y 38) ─────────────────
     *
     * Un comando y no ocho, con el campo dentro del gesto, porque los ocho
     * hacen exactamente lo mismo —tocar un dato de un objeto que ya existe— y
     * ocho comandos serían ocho `revisar` que se irían separando. Lo que cambia
     * de uno a otro está en `CAMPOS_DE_GRAFICA`, que es una tabla.
     */
    nombre: 'cambiarGrafica',
    etiqueta: (a) => `Cambiar ${txt(a, 'campo')} de la gráfica a «${txt(a, 'valor')}»`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const cambiar = CAMPOS_DE_GRAFICA[txt(a, 'campo')];
      if (!cambiar) return libro;
      return conGrafica(libro, hojaId, txt(a, 'id'), (g) => cambiar(g, a));
    },
    toca: () => [],
    revisar: (libro, a) => {
      if (!graficaDe(libro, txt(a, 'hoja', libro.activa), txt(a, 'id'))) return 'esa gráfica no existe';
      return CAMPOS_DE_GRAFICA[txt(a, 'campo')]
        ? null
        : `«${txt(a, 'campo')}» no es algo que se le pueda cambiar a una gráfica`;
    },
  },
  {
    /*
     * ── Moverla de sitio ───────────────────────────────────────────────────
     *
     * En celdas, nunca en píxeles (§39). Y sólo se mueve la esquina: el tamaño
     * viaja con ella, que es lo que hace que arrastrar una gráfica no la
     * deforme sin querer. Cambiar de tamaño es otro gesto y hoy no existe — ver
     * la reserva (a) de la cabecera de esta familia.
     */
    nombre: 'moverGrafica',
    etiqueta: (a) => `Mover la gráfica a ${dir(num(a, 'col', 0), num(a, 'fila', 0))}`,
    aplicar: (libro, a) =>
      conGrafica(libro, txt(a, 'hoja', libro.activa), txt(a, 'id'), (g) => ({
        ...g,
        ancla: { ...g.ancla, col: Math.max(0, num(a, 'col', g.ancla.col)), fila: Math.max(0, num(a, 'fila', g.ancla.fila)) },
      })),
    toca: () => [],
    revisar: (libro, a) =>
      graficaDe(libro, txt(a, 'hoja', libro.activa), txt(a, 'id')) ? null : 'esa gráfica no existe',
  },
  {
    nombre: 'borrarGrafica',
    etiqueta: () => 'Borrar la gráfica',
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const id = txt(a, 'id');
      const antes = graficasDe(libro, hojaId);
      if (!antes.some((g) => g.id === id)) return libro;
      return conGraficas(
        libro,
        hojaId,
        antes.filter((g) => g.id !== id),
      );
    },
    toca: () => [],
    revisar: (libro, a) =>
      graficaDe(libro, txt(a, 'hoja', libro.activa), txt(a, 'id')) ? null : 'esa gráfica no existe',
  },
  {
    /*
     * ── Configurar la página (bloque 20) ───────────────────────────────────
     *
     * `{ hoja, campo, valor }`, con la tabla `CAMPOS_DE_PAGINA` decidiendo qué
     * es cada cosa. El `toca: []` está razonado en la cabecera de esa familia:
     * ninguna fórmula puede leer el papel.
     */
    nombre: 'configurarPagina',
    etiqueta: (a) => CAMPOS_DE_PAGINA[txt(a, 'campo')]?.como(a) ?? `Configurar ${txt(a, 'campo')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const campo = CAMPOS_DE_PAGINA[txt(a, 'campo')];
      if (!campo || !hojaDe(libro, hojaId)) return libro;
      return conImpresion(libro, hojaId, campo.poner(impresionDe(libro, hojaId), a));
    },
    toca: () => [],
    revisar: (libro, a) => {
      if (!hojaDe(libro, txt(a, 'hoja', libro.activa))) return 'esa hoja no existe';
      const campo = CAMPOS_DE_PAGINA[txt(a, 'campo')];
      if (!campo) return `«${txt(a, 'campo')}» no es algo que se le pueda configurar a la página`;
      return campo.revisar?.(a) ?? null;
    },
  },
  {
    /*
     * ── El área de impresión (bloque 20) ───────────────────────────────────
     *
     * El comando que le da nombre al bloque —«imprimir **sólo lo que
     * importa**»— y el que hay que entender antes que los otros dos: marcado un
     * área, **lo de fuera no sale**, aunque haya media hoja llena al lado. Es lo
     * que separa entregar una tabla de entregar catorce páginas con las cuentas
     * de en medio.
     *
     * Se guarda normalizado con `textoDeCaja` —`a1:d50` y `D50:A1` se guardan
     * los dos como `A1:D50`—, igual que `insertarGrafica` normaliza su rango: si
     * se guardara tal como se escribió, dos áreas iguales se verían distintas en
     * la lista de la macro y en cualquier prueba que las compare.
     */
    nombre: 'areaDeImpresion',
    etiqueta: (a) => `Marcar ${txt(a, 'rango')} como área de impresión`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const caja = cajaDeArgs(a);
      if (!caja || !hojaDe(libro, hojaId)) return libro;
      return conImpresion(libro, hojaId, { ...impresionDe(libro, hojaId), areaImpresion: textoDeCaja(caja) });
    },
    toca: () => [],
    revisar: (libro, a) => {
      if (!hojaDe(libro, txt(a, 'hoja', libro.activa))) return 'esa hoja no existe';
      return cajaDeArgs(a) ? null : `«${txt(a, 'rango')}» no es un rango que se pueda imprimir`;
    },
  },
  {
    /*
     * Y desandarlo, que es la otra mitad. Un área de impresión puesta y olvidada
     * es de los descubrimientos más caros de una hoja de cálculo: se imprime, no
     * sale lo de abajo, y no hay ni un aviso que diga por qué. Por eso el botón
     * de quitarla está al lado del de ponerla, en Excel y aquí.
     *
     * Si el área era lo único configurado, la hoja se queda **sin la clave
     * `impresion`** y el libro vuelve a ser idéntico al de partida. Lo hace
     * `conImpresion`, que borra la clave cuando ya no queda nada dentro.
     */
    nombre: 'quitarAreaDeImpresion',
    etiqueta: () => 'Quitar el área de impresión',
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const previa = hojaDe(libro, hojaId)?.impresion;
      if (!previa?.areaImpresion) return libro;
      const cfg: ConfigGuardada = { ...previa };
      delete cfg.areaImpresion;
      return conImpresion(libro, hojaId, cfg);
    },
    toca: () => [],
    revisar: (libro, a) => (hojaDe(libro, txt(a, 'hoja', libro.activa)) ? null : 'esa hoja no existe'),
  },
  {
    /*
     * ── Buscar objetivo (bloque 57) ─────────────────────────────────────────
     *
     * Todo el método vive en `ysi.ts`; este comando sólo lo conecta al libro:
     * arma la petición, la resuelve y, si `resolverObjetivo` dice
     * «encontrado», escribe el crudo que ganó con el MISMO escritor que usó
     * la búsqueda por dentro. Las cuatro maneras de no llegar —sin fórmula,
     * no influye, origen no es número, no converge— las dice `ysi.ts` con su
     * propio mensaje, y aquí basta con devolverlo tal cual en `revisar`: si
     * el estado no es «encontrado» se rechaza y `aplicar` no se llega a
     * llamar. Es lo que garantiza que **el libro quede idéntico cuando la
     * búsqueda no converge** — no hay ningún camino que escriba «lo más
     * cerca que se llegó».
     *
     * `resolverObjetivo` cachea su última búsqueda por libro y por petición
     * (`ultima`, en `ysi.ts`), así que `revisar` y `aplicar` preguntando lo
     * mismo sobre el mismo libro no cuestan cien tanteos dos veces: cuestan
     * cien una.
     */
    nombre: 'buscar-objetivo',
    etiqueta: (a) => `Buscar objetivo: que ${txt(a, 'objetivo')} valga ${txt(a, 'valor')} cambiando ${txt(a, 'cambiando')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const p = peticionObjetivoDe(hojaId, a);
      const r = resolverObjetivo(libro, p, escritorDeCelda(hojaId, p.cambiando));
      return r.estado === 'encontrado' ? escritorDeCelda(hojaId, p.cambiando)(libro, r.crudo) : libro;
    },
    toca: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const m = dirAColFila(txt(a, 'cambiando'));
      return m ? [clave(hojaId, m.col, m.fila)] : [];
    },
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const p = peticionObjetivoDe(hojaId, a);
      const r = resolverObjetivo(libro, p, escritorDeCelda(hojaId, p.cambiando));
      return r.estado === 'encontrado' ? null : r.mensaje;
    },
  },
  {
    /*
     * ── Guardar un escenario (bloque 57) ────────────────────────────────────
     *
     * Guarda una FOTO de las celdas marcadas, tal como están ahora: `fotoDe`
     * (en `ysi.ts`) lee los crudos, no los valores, que es lo que hace que
     * aplicarlo después sea indistinguible de que el alumno lo hubiera
     * tecleado. Guardar con un nombre que ya existe LO REEMPLAZA en su sitio
     * (`conEscenarioGuardado`), y por eso `revisar` avisa antes de
     * reemplazarlo: perder un escenario sin darse cuenta es el mismo defecto
     * que combinar celdas sin avisar.
     */
    nombre: 'guardar-escenario',
    etiqueta: (a) => `Guardar el escenario «${txt(a, 'nombre')}»`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const claves = clavesDeLista(hojaId, txt(a, 'celdas'));
      if (!claves.length) return libro;
      return conEscenarioGuardado(libro, fotoDe(libro, txt(a, 'nombre'), claves));
    },
    // Guardar un escenario no escribe en ninguna celda: es una foto, no un cambio.
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      const nombre = txt(a, 'nombre').trim();
      if (!nombre) return 'un escenario tiene que llamarse de alguna manera';
      const claves = clavesDeLista(hojaId, txt(a, 'celdas'));
      if (!claves.length) return `«${txt(a, 'celdas')}» no son celdas de esta hoja`;
      if (siNo(a, 'confirmado')) return null;
      return escenarioDe(libro, nombre)
        ? `ya hay un escenario llamado «${nombre}»: guardarlo lo va a reemplazar. Vuelve a pulsar para continuar`
        : null;
    },
  },
  {
    /*
     * ── Aplicar un escenario (bloque 57) ────────────────────────────────────
     *
     * Escribe TODOS los crudos del escenario en un solo gesto, así que el
     * recálculo es uno y deshacer lo devuelve entero de una (cabecera de
     * `ysi.ts`, decisión 4). `pisaFormulas` dice qué celdas van a perder una
     * regla por un número, y ahí es donde `revisar` avisa — es, palabra por
     * palabra, lo que pide el encargo: «aplicar un escenario que pisa una
     * fórmula tiene que avisar».
     */
    nombre: 'aplicar-escenario',
    etiqueta: (a) => `Aplicar el escenario «${txt(a, 'nombre')}»`,
    aplicar: (libro, a) => {
      const e = escenarioDe(libro, txt(a, 'nombre'));
      if (!e) return libro;
      let out = libro;
      for (const [k, crudo] of Object.entries(e.celdas)) {
        const p = partirClave(k);
        if (!p || !hojaDe(out, p.hoja)) continue;
        const previa = celdaEn(out, p.hoja, p.col, p.fila);
        out = conCelda(out, p.hoja, p.col, p.fila, { ...previa, crudo });
      }
      return out;
    },
    toca: (libro, a) => {
      const e = escenarioDe(libro, txt(a, 'nombre'));
      return e ? celdasDeEscenario(e) : [];
    },
    revisar: (libro, a) => {
      const e = escenarioDe(libro, txt(a, 'nombre'));
      if (!e) return `no existe un escenario llamado «${txt(a, 'nombre')}»`;
      const faltan = hojasQueFaltan(libro, e);
      if (faltan.length) return `este escenario usa una hoja que ya no existe: ${faltan.join(', ')}`;
      if (siNo(a, 'confirmado')) return null;
      const pisa = pisaFormulas(libro, e);
      return pisa.length
        ? `aplicar «${txt(a, 'nombre')}» va a sustituir ${pisa.length} fórmula${pisa.length === 1 ? '' : 's'} por un número: ${pisa.join(', ')}. Vuelve a pulsar para continuar`
        : null;
    },
  },
  {
    /*
     * Borrar un escenario no toca ninguna celda: sólo quita un renglón de la
     * lista, igual que `separarCeldas` no devuelve el contenido que ya se
     * había perdido al combinar. No hace falta confirmación: lo que se pierde
     * es el nombre guardado, no un dato de la hoja.
     */
    nombre: 'borrar-escenario',
    etiqueta: (a) => `Borrar el escenario «${txt(a, 'nombre')}»`,
    aplicar: (libro, a) => sinEscenario(libro, txt(a, 'nombre')),
    toca: () => [],
    revisar: (libro, a) =>
      escenarioDe(libro, txt(a, 'nombre')) ? null : `no existe un escenario llamado «${txt(a, 'nombre')}»`,
  },
  {
    /*
     * ── Importar un .csv o un .txt (bloque 43) ──────────────────────────────
     *
     * `leerCsv` (en `datos.ts`) hace todo el trabajo de leer bien el archivo;
     * este comando sólo vuelca lo que devolvió a partir de la celda ancla,
     * fila por fila y columna por columna, con el mismo `null` que usa
     * `escribir` para no dejar celdas fantasma cuando un campo llega vacío y
     * no tenía formato. Una comilla que nunca se cierra se traga el resto del
     * archivo dentro de una sola celda (`leerCsv`), y por eso `revisar` la
     * rechaza: importar «tal cual» no enseñaría una tabla, enseñaría un
     * bloque de texto que ni siquiera es el archivo completo.
     *
     * DEFECTO FUERA DE MI CLASE, corregido aquí (encontrado escribiendo
     * `n7-datos-reales`, §45.2 bloque 43): `revisar` no avisaba si el ancla
     * caía encima de celdas que ya tenían algo — importar volvía a escribir
     * por encima en silencio, la misma pérdida sin aviso que sí tienen
     * `combinarCeldas` y `aplicar-escenario`. Con `confirmado` puesto pasa
     * igual que antes; sin él, y sólo si de verdad hay algo que se fuera a
     * perder, `revisar` avisa cuánto en vez de dejarlo pisar en silencio.
     */
    nombre: 'importar-csv',
    etiqueta: (a) => `Importar el archivo en ${txt(a, 'celda')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const ancla = dirAColFila(txt(a, 'celda'));
      if (!ancla) return libro;
      const { celdas } = leerCsv(txt(a, 'texto'), separadorDeArgs(a));
      let out = libro;
      celdas.forEach((fila, f) => {
        fila.forEach((valor, c) => {
          const previa = hojaDe(out, hojaId)?.celdas[dir(ancla.col + c, ancla.fila + f)];
          out = conCelda(
            out,
            hojaId,
            ancla.col + c,
            ancla.fila + f,
            valor === '' && !previa?.formato ? null : { ...previa, crudo: valor },
          );
        });
      });
      return out;
    },
    toca: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const ancla = dirAColFila(txt(a, 'celda'));
      if (!ancla) return [];
      const { celdas } = leerCsv(txt(a, 'texto'), separadorDeArgs(a));
      const claves: Clave[] = [];
      celdas.forEach((fila, f) => fila.forEach((_, c) => claves.push(clave(hojaId, ancla.col + c, ancla.fila + f))));
      return claves;
    },
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      const ancla = dirAColFila(txt(a, 'celda'));
      if (!ancla) return `«${txt(a, 'celda')}» no es una celda`;
      if (!txt(a, 'texto').trim()) return 'no hay nada que importar: el archivo está vacío';
      const { celdas, parte } = leerCsv(txt(a, 'texto'), separadorDeArgs(a));
      if (parte.comillaSinCerrar) {
        return 'hay una comilla que nunca se cierra: el archivo entero quedó pegado en una sola celda. Revísalo antes de importarlo';
      }
      if (siNo(a, 'confirmado')) return null;
      const celdasHoja = hojaDe(libro, hojaId)?.celdas ?? {};
      let pisa = false;
      celdas.forEach((fila, f) => {
        fila.forEach((_, c) => {
          if (pisa) return;
          if ((celdasHoja[dir(ancla.col + c, ancla.fila + f)]?.crudo ?? '') !== '') pisa = true;
        });
      });
      return pisa ? 'ahí ya hay datos escritos: importar los va a sustituir. Vuelve a pulsar para continuar' : null;
    },
  },
  {
    /*
     * ── Quitar duplicados (bloque 44) ───────────────────────────────────────
     *
     * Compara TODAS las columnas del rango marcado —`filasQueQuedan`, en
     * `datos.ts`, decide qué filas sobreviven comparando el crudo tal cual
     * está escrito, sin recortar ni bajar a minúsculas (la decisión entera
     * del bloque 44)—. Las que sobreviven se compactan arriba y el resto de
     * la caja se vacía, que es lo que hace Excel: no deja renglones en
     * blanco a mitad de la tabla. `revisar` avisa CUÁNTAS se van a ir antes
     * de irse, que es, palabra por palabra, lo que pide el encargo.
     */
    nombre: 'quitar-duplicados',
    etiqueta: (a) => `Quitar duplicados de ${txt(a, 'rango')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const caja = cajaDeArgs(a);
      if (!caja) return libro;
      const encabezado = a.encabezado === undefined ? true : siNo(a, 'encabezado');
      const { quedan } = filasQueQuedan(libro, hojaId, caja, columnasDeCaja(caja), encabezado);
      const primera = caja.f0 + (encabezado ? 1 : 0);
      let out = libro;
      // Los crudos se leen SIEMPRE del libro de partida: una fila destino nunca
      // vuelve a hacer falta como origen más adelante (`quedan` es creciente),
      // así que leer de `libro` en vez de `out` es sólo más claro, no distinto.
      quedan.forEach((origen, i) => {
        const destino = primera + i;
        if (destino === origen) return;
        for (let c = caja.c0; c <= caja.c1; c += 1) {
          const crudo = crudoEn(libro, hojaId, c, origen);
          const previa = hojaDe(out, hojaId)?.celdas[dir(c, destino)];
          out = conCelda(out, hojaId, c, destino, crudo === '' && !previa?.formato ? null : { ...previa, crudo });
        }
      });
      for (let f = primera + quedan.length; f <= caja.f1; f += 1) {
        for (let c = caja.c0; c <= caja.c1; c += 1) {
          const previa = hojaDe(out, hojaId)?.celdas[dir(c, f)];
          out = conCelda(out, hojaId, c, f, previa?.formato ? { crudo: '', formato: previa.formato } : null);
        }
      }
      return out;
    },
    toca: (libro, a) => {
      const caja = cajaDeArgs(a);
      return caja ? clavesDeCaja(txt(a, 'hoja', libro.activa), caja) : [];
    },
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      const caja = cajaDeArgs(a);
      if (!caja) return `«${txt(a, 'rango')}» no es un rango`;
      if (siNo(a, 'confirmado')) return null;
      const encabezado = a.encabezado === undefined ? true : siNo(a, 'encabezado');
      const { cuenta } = filasQueQuedan(libro, hojaId, caja, columnasDeCaja(caja), encabezado);
      return cuenta.duplicadas > 0
        ? `se van a quitar ${cuenta.duplicadas} fila${cuenta.duplicadas === 1 ? '' : 's'} duplicada${cuenta.duplicadas === 1 ? '' : 's'} y van a quedar ${cuenta.quedan}. Vuelve a pulsar para continuar`
        : null;
    },
  },
  {
    /*
     * ── Relleno rápido (bloque 44) ───────────────────────────────────────────
     *
     * `deducirPatron` (en `datos.ts`) lee UN ejemplo —la primera fila del
     * destino, que el alumno ya escribió a mano— contra su origen —la columna
     * de al lado, misma fila— y devuelve un patrón o `null`. Si no hay
     * patrón, `revisar` RECHAZA: es, palabra por palabra, la frase del propio
     * archivo: «si no hay patrón, no se adivina: se dice». No existe un
     * `aplicar` que rellene la mitad de una columna con algo que nadie pidió.
     */
    nombre: 'relleno-rapido',
    etiqueta: (a) => `Relleno rápido en ${txt(a, 'destino')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const patron = patronDeArgs(libro, hojaId, a);
      const destino = cajaDeTexto(txt(a, 'destino'));
      const origen = cajaDeTexto(txt(a, 'origen'));
      if (!patron || !destino || !origen) return libro;
      const h = hojaDe(libro, hojaId);
      let out = libro;
      for (let i = 1; i <= destino.f1 - destino.f0; i += 1) {
        const origenTexto = h?.celdas[dir(origen.c0, origen.f0 + i)]?.crudo ?? '';
        const resultado = patron.aplicar(origenTexto);
        if (resultado === null) continue;
        const previa = hojaDe(out, hojaId)?.celdas[dir(destino.c0, destino.f0 + i)];
        out = conCelda(out, hojaId, destino.c0, destino.f0 + i, { ...previa, crudo: resultado });
      }
      return out;
    },
    toca: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const destino = cajaDeTexto(txt(a, 'destino'));
      if (!destino) return [];
      const claves: Clave[] = [];
      for (let f = destino.f0 + 1; f <= destino.f1; f += 1) claves.push(clave(hojaId, destino.c0, f));
      return claves;
    },
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      const origen = cajaDeTexto(txt(a, 'origen'));
      const destino = cajaDeTexto(txt(a, 'destino'));
      if (!origen || origen.c0 !== origen.c1) return `«${txt(a, 'origen')}» tiene que ser una sola columna`;
      if (!destino || destino.c0 !== destino.c1) return `«${txt(a, 'destino')}» tiene que ser una sola columna`;
      if (origen.f1 - origen.f0 !== destino.f1 - destino.f0) {
        return 'el origen y el destino tienen que tener el mismo número de filas';
      }
      return patronDeArgs(libro, hojaId, a) ? null : 'no se pudo adivinar un patrón a partir del ejemplo escrito';
    },
  },
  {
    /*
     * ── Consolidar (bloque 53) ──────────────────────────────────────────────
     *
     * El caso real del encargo: «Grupo A», «Grupo B» y «Grupo C» tienen la
     * misma tabla, y una cuarta hoja quiere el total posición a posición.
     *
     * **Escribe FÓRMULAS, no números, y es la misma decisión que abre
     * `modelo.ts`: la celda guarda la regla, no el resultado.** Consolidar con
     * números sería una foto del día en que se pulsó el botón — cambia una
     * celda de «Grupo A» al mes siguiente y el total se queda mintiendo, sin
     * ni un subrayado rojo que lo delate. Con `=SUMA('Grupo A'!B2,'Grupo
     * B'!B2,'Grupo C'!B2)` el total se recalcula solo, con el mismo motor que
     * ya recalcula todo lo demás — no hace falta un botón «actualizar».
     *
     * `origenes` es una lista `hoja!rango`, no un solo rango repetido para
     * todas: así «misma forma» es una pregunta real y no una tautología. Dos
     * tablas pueden vivir en direcciones distintas de sus hojas y consolidarse
     * igual, con tal de que midan lo mismo — es lo que decide `revisar`
     * comparando ancho y alto, nunca la esquina.
     *
     * El nombre de hoja se escribe con `textoDeRef` y no a mano: es el mismo
     * escritor que arregló la cita del 15-ago-2026 (ver `modelo.ts`), así que
     * «Grupo A» sale entre comillas simples sin que este comando tenga que
     * saber por qué.
     */
    nombre: 'consolidar',
    etiqueta: (a) => `Consolidar ${txt(a, 'origenes')} en ${txt(a, 'destino')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return libro;
      const origenes = origenesDeConsolidar(libro, txt(a, 'origenes'));
      const esquina = dirAColFila(txt(a, 'destino'));
      if (!origenes || !esquina) return libro;
      const funcion = OPERACIONES_DE_CONSOLIDAR[txt(a, 'operacion', 'suma')] ?? 'SUMA';
      const ancho = anchoDeCaja(origenes[0].caja);
      const alto = altoDeCaja(origenes[0].caja);
      let out = libro;
      for (let f = 0; f < alto; f += 1) {
        for (let c = 0; c < ancho; c += 1) {
          const refs = origenes
            .map((o) =>
              textoDeRef({ hoja: o.hoja.nombre, col: o.caja.c0 + c, fila: o.caja.f0 + f, colAbs: false, filaAbs: false }),
            )
            .join(',');
          const col = esquina.col + c;
          const fila = esquina.fila + f;
          const previa = hojaDe(out, hojaId)?.celdas[dir(col, fila)];
          out = conCelda(out, hojaId, col, fila, { ...previa, crudo: `=${funcion}(${refs})` });
        }
      }
      return out;
    },
    toca: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const origenes = origenesDeConsolidar(libro, txt(a, 'origenes'));
      const esquina = dirAColFila(txt(a, 'destino'));
      if (!origenes || !esquina) return [];
      const c1 = esquina.col + anchoDeCaja(origenes[0].caja) - 1;
      const f1 = esquina.fila + altoDeCaja(origenes[0].caja) - 1;
      return clavesDeCaja(hojaId, { c0: esquina.col, f0: esquina.fila, c1, f1 });
    },
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      const texto = txt(a, 'origenes');
      if (!texto.trim()) return 'hace falta al menos una hoja de origen';
      const origenes = origenesDeConsolidar(libro, texto);
      if (!origenes) {
        for (const token of texto.split(',')) {
          const t = token.trim();
          if (!t) continue;
          const i = t.indexOf('!');
          if (i < 0) return `«${t}» no es «hoja!rango»`;
          const nombre = t.slice(0, i).trim();
          if (!hojaPorNombre(libro, nombre)) return `no hay ninguna hoja llamada «${nombre}»`;
          if (!cajaDeTexto(t.slice(i + 1).trim())) return `«${t.slice(i + 1).trim()}» no es un rango`;
        }
        return 'no se pudo leer ningún origen';
      }
      if (origenes.some((o) => o.hoja.id === hojaId)) {
        return 'no se puede consolidar una hoja usándose a sí misma como origen';
      }
      const [primero, ...resto] = origenes;
      const distinta = resto.find(
        (o) => anchoDeCaja(o.caja) !== anchoDeCaja(primero.caja) || altoDeCaja(o.caja) !== altoDeCaja(primero.caja),
      );
      if (distinta) {
        return `las hojas no tienen la misma forma: «${primero.hoja.nombre}» es ${anchoDeCaja(primero.caja)}×${altoDeCaja(primero.caja)} y «${distinta.hoja.nombre}» es ${anchoDeCaja(distinta.caja)}×${altoDeCaja(distinta.caja)}`;
      }
      if (!dirAColFila(txt(a, 'destino'))) return `«${txt(a, 'destino')}» no es una celda`;
      const op = txt(a, 'operacion', 'suma');
      return OPERACIONES_DE_CONSOLIDAR[op] ? null : `«${op}» no es una operación: suma, promedio, contar, max o min`;
    },
  },
  {
    /*
     * ── Proteger una hoja (bloque 54) ───────────────────────────────────────
     *
     * **Al revés que en Excel, y hay que respetarlo**: no hay un `bloqueada`
     * por celda que esta hoja cierre — el modelo guarda `desbloqueadas`, los
     * rangos que SÍ se pueden tocar con la hoja protegida (ver `modelo.ts`).
     * Proteger no toca ni un dato: por eso `toca` es `[]`, igual que
     * `colorHoja` o `configurarPagina` — cambia una regla del libro, no un
     * valor de una celda.
     *
     * Volver a proteger una hoja ya protegida se rechaza en vez de dejarse
     * pasar: es exactamente lo que hace Excel —«¿Volver a proteger la hoja?»
     * no existe como no-operación, hay que desproteger primero—, y es la
     * fidelidad que pide la prueba «jugar mal».
     */
    nombre: 'proteger-hoja',
    etiqueta: (a) => `Proteger la hoja${txt(a, 'hoja') ? ` «${txt(a, 'hoja')}»` : ''}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const h = hojaDe(libro, hojaId);
      if (!h) return libro;
      const protegida: Proteccion = { ...(h.protegida ?? {}), activa: true };
      return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? { ...x, protegida } : x)) };
    },
    toca: () => [],
    revisar: (libro, a) => {
      const h = hojaDe(libro, txt(a, 'hoja', libro.activa));
      if (!h) return 'esa hoja no existe';
      return h.protegida?.activa
        ? 'esta hoja ya está protegida'
        : null;
    },
  },
  {
    nombre: 'desproteger-hoja',
    etiqueta: () => 'Quitar la protección de la hoja',
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const h = hojaDe(libro, hojaId);
      if (!h?.protegida) return libro;
      const hoja: Hoja = { ...h };
      // Se conserva la lista de rangos desbloqueados: si el maestro vuelve a
      // proteger la hoja, no tiene que volver a marcarlos (fidelidad con
      // Excel, que guarda «Bloqueada» como formato de celda y no como algo
      // que dependa de si la hoja está protegida en este momento). Sin nada
      // que decir, la clave entera se va — la misma disciplina que
      // `conCombinadas` con la lista vacía.
      if (h.protegida.desbloqueadas?.length) hoja.protegida = { ...h.protegida, activa: false };
      else delete hoja.protegida;
      return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? hoja : x)) };
    },
    toca: () => [],
    revisar: (libro, a) => {
      const h = hojaDe(libro, txt(a, 'hoja', libro.activa));
      if (!h) return 'esa hoja no existe';
      return h.protegida?.activa ? null : 'esta hoja no está protegida';
    },
  },
  {
    /*
     * ── Proteger la ESTRUCTURA del libro (bloque 54) ────────────────────────
     *
     * Otra cosa que proteger una hoja: impide crear, borrar, renombrar y
     * mover hojas, y deja escribir en las celdas — las dos protecciones
     * conviven sin pisarse, y `avisoDeProteccion` (más abajo) las vigila por
     * separado.
     */
    nombre: 'proteger-libro',
    etiqueta: () => 'Proteger la estructura del libro',
    aplicar: (libro) => (libro.estructuraProtegida ? libro : { ...libro, estructuraProtegida: true }),
    toca: () => [],
    revisar: (libro) => (libro.estructuraProtegida ? 'la estructura del libro ya está protegida' : null),
  },
  {
    nombre: 'desproteger-libro',
    etiqueta: () => 'Quitar la protección de la estructura del libro',
    aplicar: (libro) => {
      if (!libro.estructuraProtegida) return libro;
      const fuera: Libro = { ...libro };
      delete fuera.estructuraProtegida;
      return fuera;
    },
    toca: () => [],
    revisar: (libro) => (libro.estructuraProtegida ? null : 'la estructura del libro no está protegida'),
  },
  {
    /*
     * ── Desbloquear un rango (bloque 54) ────────────────────────────────────
     *
     * Se puede pedir con la hoja protegida o sin protegerla todavía — en
     * Excel de verdad se marca «Bloqueada» o no ANTES de proteger, y esta
     * sala deja hacerlo en cualquier momento por la misma razón que
     * `desproteger-hoja` conserva la lista: `desbloqueadas` es un dato de la
     * hoja, no un efecto de si la protección está encendida hoy.
     */
    nombre: 'desbloquear-rango',
    etiqueta: (a) => `Desbloquear ${txt(a, 'rango')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const h = hojaDe(libro, hojaId);
      const caja = cajaDeArgs(a);
      if (!h || !caja) return libro;
      const texto = textoDeCaja(caja);
      const previas = h.protegida?.desbloqueadas ?? [];
      if (previas.includes(texto)) return libro;
      const protegida: Proteccion = { activa: h.protegida?.activa ?? false, desbloqueadas: [...previas, texto] };
      return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? { ...x, protegida } : x)) };
    },
    toca: () => [],
    revisar: (libro, a) => {
      if (!hojaDe(libro, txt(a, 'hoja', libro.activa))) return 'esa hoja no existe';
      return cajaDeArgs(a) ? null : `«${txt(a, 'rango')}» no es un rango`;
    },
  },
  {
    /*
     * ── Barras de datos, escala de color, iconos (bloque 30) ────────────────
     *
     * Los tres «de un solo color» son el mismo comando con otro nombre de
     * clase, igual que Autosuma y sus seis hermanas: `reglaSimpleDe` arma la
     * regla y `revisarBaseDeRegla` la revisa, y lo único que cambia entre los
     * tres es la palabra que se guarda en `clase`.
     */
    nombre: 'regla-barras',
    etiqueta: (a) => `Barras de datos en ${txt(a, 'rango')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId) || !cajaDeArgs(a)) return libro;
      return conReglas(libro, hojaId, [...reglasDe(libro, hojaId), reglaSimpleDe(a, 'barras')]);
    },
    // La regla NO cambia la celda: cambia cómo se ve. Aplicarla y sumar el
    // rango tiene que dar el mismo total antes y después.
    toca: () => [],
    revisar: revisarBaseDeRegla,
  },
  {
    nombre: 'regla-escala',
    etiqueta: (a) => `Escala de color en ${txt(a, 'rango')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId) || !cajaDeArgs(a)) return libro;
      return conReglas(libro, hojaId, [...reglasDe(libro, hojaId), reglaSimpleDe(a, 'escala')]);
    },
    toca: () => [],
    revisar: revisarBaseDeRegla,
  },
  {
    nombre: 'regla-iconos',
    etiqueta: (a) => `Conjunto de iconos en ${txt(a, 'rango')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId) || !cajaDeArgs(a)) return libro;
      return conReglas(libro, hojaId, [...reglasDe(libro, hojaId), reglaSimpleDe(a, 'iconos')]);
    },
    toca: () => [],
    revisar: revisarBaseDeRegla,
  },
  {
    /*
     * ── Destacar celdas (bloque 30): mayor, menor, entre, contiene, duplicados ─
     *
     * La condición viaja codificada en `formula` —no es una fórmula de Excel,
     * es un predicado compacto, ver `predicadoDeArgs` y `modelo.ts`—, y `color`
     * se traduce a un `Formato` completo (fondo + letra) que es lo que
     * `condicional.ts` aplica cuando la celda cumple.
     */
    nombre: 'regla-destacar',
    etiqueta: (a) => `Destacar ${txt(a, 'comparacion')} en ${txt(a, 'rango')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const caja = cajaDeArgs(a);
      const predicado = predicadoDeArgs(a);
      if (!hojaDe(libro, hojaId) || !caja || !predicado) return libro;
      const regla: ReglaCondicional = { id: txt(a, 'id'), rango: textoDeCaja(caja), clase: 'destacar', formula: predicado };
      regla.formato = txt(a, 'color') ? { tipo: 'general', colorRelleno: txt(a, 'color') } : FORMATO_DESTACAR;
      return conReglas(libro, hojaId, [...reglasDe(libro, hojaId), regla]);
    },
    toca: () => [],
    revisar: (libro, a) => {
      const base = revisarBaseDeRegla(libro, a);
      if (base) return base;
      const comparacion = txt(a, 'comparacion');
      if (!(COMPARACIONES_DESTACAR as readonly string[]).includes(comparacion)) {
        return `«${comparacion}» no es una comparación: mayor, menor, entre, contiene o duplicados`;
      }
      return predicadoDeArgs(a) ? null : 'a esta comparación le falta el valor con el que compara';
    },
  },
  {
    /*
     * ── Formato condicional CON FÓRMULA (bloque 46) ─────────────────────────
     *
     * El caro. La fórmula se prueba UNA vez, en la esquina superior izquierda
     * del rango —donde ancla `condicional.ts`—, con un motor temporal
     * construido sobre `libro`: la misma factura que ya paga `pegar-valores`,
     * y por el mismo motivo, que está dicho allí.
     *
     * «No se aplica por si acaso»: si la fórmula no se entiende, da un error o
     * da otra cosa que no sea VERDADERO/FALSO, `revisar` la rechaza aquí y
     * dice por qué — y por eso `aplicar` no vuelve a comprobar nada.
     *
     * ── Por qué NO comparte `revisarBaseDeRegla` con sus cuatro hermanas ────
     *
     * Defecto cazado el 16-ago-2026 construyendo `of-excel-datos-limpios`,
     * jugando el encargo 9 (bloque 46) de punta a punta: corregir una fórmula
     * sobre el MISMO rango —romperla sin `$` a propósito, verla pintar en
     * diagonal, y volver a aplicarla ya arreglada— es el encargo entero, y
     * `idDeRegla` (`cinta.ts`) sale de la hoja y de la selección, así que las
     * tres pasadas comparten el mismo id a propósito.
     *
     * El primer arreglo fue en `aplicar` (reemplazar el id repetido en vez de
     * apilarlo encima, ver más abajo), pero no bastaba: `revisarBaseDeRegla`
     * —que SÍ comparten barras, escala, iconos y destacar— rechaza de
     * entrada cualquier id que ya exista («ya hay una regla con ese
     * identificador: bórrala antes de repetirla»), así que la segunda pasada
     * ni siquiera llegaba a `aplicar`. El alumno se quedaba sin poder
     * corregir su propia fórmula sin borrar la regla a mano primero, un paso
     * que el guion no pide y que además desharía el ejemplo de la pintura en
     * diagonal antes de que el alumno la viera. Por eso `revisar`, aquí
     * abajo, repite a mano las tres preguntas de `revisarBaseDeRegla` —hoja,
     * id puesto, rango válido— pero SIN la del id repetido, dejando a las
     * otras cuatro reglas exactamente como estaban.
     */
    nombre: 'regla-formula',
    etiqueta: (a) => `Formato con fórmula «${txt(a, 'formula')}» en ${txt(a, 'rango')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const caja = cajaDeArgs(a);
      if (!hojaDe(libro, hojaId) || !caja) return libro;
      const regla: ReglaCondicional = { id: txt(a, 'id'), rango: textoDeCaja(caja), clase: 'formula', formula: txt(a, 'formula') };
      regla.formato = txt(a, 'color') ? { tipo: 'general', colorRelleno: txt(a, 'color') } : FORMATO_DESTACAR;
      // REEMPLAZA la regla que ya tuviera este id, no la apila encima —ver la
      // nota de arriba—: si sólo se apilara, `decoracionesDeHoja` (que nunca
      // BORRA pintura, sólo la añade) dejaría viva la diagonal de la fórmula
      // rota debajo de la fila ya corregida.
      return conReglas(libro, hojaId, [...reglasDe(libro, hojaId).filter((r) => r.id !== regla.id), regla]);
    },
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      if (!txt(a, 'id')) return 'a una regla hay que darle un identificador';
      if (!cajaDeArgs(a)) return `«${txt(a, 'rango')}» no es un rango`;
      const formula = txt(a, 'formula');
      if (!esFormula(formula)) return 'la condición tiene que ser una fórmula, con «=» delante';
      const analisis = parsear(formula);
      if (!analisis.ok) return `${analisis.mensaje} (posición ${analisis.pos + 1})`;
      const caja = cajaDeArgs(a) as Caja;
      const motorDePrueba = crearMotor(libro);
      const v = valorDeArbol(motorDePrueba, analisis.arbol, hojaId);
      if (esError(v)) return `la fórmula da ${v.error} en ${dir(caja.c0, caja.f0)}: revísala antes de aplicarla`;
      if (typeof v !== 'boolean') {
        return `la fórmula tiene que dar VERDADERO o FALSO, y en ${dir(caja.c0, caja.f0)} da «${aTexto(v)}»: revísala antes de aplicarla`;
      }
      return null;
    },
  },
  {
    nombre: 'borrar-reglas',
    etiqueta: (a) => (txt(a, 'id') ? `Borrar la regla ${txt(a, 'id')}` : 'Borrar todas las reglas de la hoja'),
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const id = txt(a, 'id');
      return conReglas(libro, hojaId, id ? reglasDe(libro, hojaId).filter((r) => r.id !== id) : []);
    },
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      const id = txt(a, 'id');
      return id && !reglaDe(libro, hojaId, id) ? `no existe una regla con el identificador «${id}»` : null;
    },
  },
  {
    /*
     * ── Minigráficos (bloque 31) ────────────────────────────────────────────
     *
     * Sin `id`: insertar uno nuevo en una celda que ya tenía otro lo
     * REEMPLAZA, que es lo que hace Excel al meter un minigráfico donde ya
     * había uno.
     */
    nombre: 'minigrafico',
    etiqueta: (a) => `Minigráfico de ${txt(a, 'tipo', 'linea')} en ${txt(a, 'celda')} con ${txt(a, 'datos')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const celda = dirAColFila(txt(a, 'celda'));
      const tipo = txt(a, 'tipo', 'linea');
      if (!hojaDe(libro, hojaId) || !celda || !cajaDeTexto(txt(a, 'datos')) || !esTipoDeMinigrafico(tipo)) return libro;
      const k = clave(hojaId, celda.col, celda.fila);
      const otros = minigraficosDe(libro, hojaId).filter((m) => m.celda !== k);
      return conMinigraficos(libro, hojaId, [...otros, { celda: k, datos: txt(a, 'datos').trim().toUpperCase(), tipo }]);
    },
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      if (!dirAColFila(txt(a, 'celda'))) return `«${txt(a, 'celda')}» no es una celda`;
      if (!cajaDeTexto(txt(a, 'datos'))) return `«${txt(a, 'datos')}» no es un rango del que sacar los números`;
      const tipo = txt(a, 'tipo', 'linea');
      return esTipoDeMinigrafico(tipo) ? null : `«${tipo}» no es un tipo de minigráfico: linea, columna o ganancia`;
    },
  },
  {
    nombre: 'borrar-minigraficos',
    etiqueta: (a) => (txt(a, 'celda') ? `Borrar el minigráfico de ${txt(a, 'celda')}` : 'Borrar todos los minigráficos de la hoja'),
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const celda = dirAColFila(txt(a, 'celda'));
      if (!celda) return conMinigraficos(libro, hojaId, []);
      const k = clave(hojaId, celda.col, celda.fila);
      return conMinigraficos(libro, hojaId, minigraficosDe(libro, hojaId).filter((m) => m.celda !== k));
    },
    toca: () => [],
    revisar: (libro, a) => (hojaDe(libro, txt(a, 'hoja', libro.activa)) ? null : 'esa hoja no existe'),
  },
  {
    /*
     * ── Formato de número personalizado (bloque 45) ─────────────────────────
     *
     * El patrón es TIPO de celda —como `moneda` o `porcentaje`— y no cambia
     * el dato: `toca` es `[]`, la misma línea que el comando `formato`. Sobre
     * una celda de TEXTO no hace nada, y no es un caso especial: `mostrar()`
     * (`formatos.ts`) devuelve el texto tal cual sin mirar siquiera el
     * patrón, así que aplicarlo ahí es legal y mudo, igual que en Excel.
     */
    nombre: 'formato-personalizado',
    etiqueta: (a) => `Formato personalizado «${txt(a, 'patron')}» en ${txt(a, 'rango')}`,
    aplicar: (libro, a) => {
      const caja = cajaDeArgs(a);
      if (!caja) return libro;
      const hojaId = txt(a, 'hoja', libro.activa);
      const patron = txt(a, 'patron');
      let out = libro;
      for (let f = caja.f0; f <= caja.f1; f += 1) {
        for (let c = caja.c0; c <= caja.c1; c += 1) {
          const previa = hojaDe(out, hojaId)?.celdas[dir(c, f)];
          out = conCelda(out, hojaId, c, f, {
            crudo: previa?.crudo ?? '',
            formato: { ...(previa?.formato ?? { tipo: 'general' }), tipo: 'personalizado', patron },
          });
        }
      }
      return out;
    },
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      if (!cajaDeArgs(a)) return `«${txt(a, 'rango')}» no es un rango`;
      return motivoPatronInvalido(txt(a, 'patron'));
    },
  },
  /* ── las tablas · bloques 33, 34, 35 y 36 ─────────────────────────────────
   *
   * Nueve comandos y ni uno más — la lista fijada en el encargo del paquete
   * TABLAS. Ninguno pinta nada por su cuenta: guardan el dato (`Tabla`,
   * `Hoja.visibles`, `Hoja.inmovilizado`, todos en `modelo.ts`) y lo que se
   * ve de una tabla —el color del estilo, el aro de un filtro activo, la fila
   * de totales— lo dibuja la clase que la enseñe, leyendo el libro, igual
   * que ya hace `Grafica.tsx` con `Hoja.graficas`.
   */
  {
    /*
     * ── Crear tabla (bloque 33) ─────────────────────────────────────────────
     *
     * `id` y `nombre` viajan en el gesto, por la misma regla que `id` en
     * `insertarGrafica`: si el comando se fabricara su propio nombre —un
     * contador, un reloj— la misma macro reproducida dos veces daría dos
     * libros distintos.
     *
     * `revisar` es donde vive «jugar mal a propósito»: un rango de una sola
     * fila (que incluye una sola celda) no tiene dónde meter una fila de
     * datos, un encabezado con un hueco no se puede nombrar solo, y dos
     * tablas no se pueden superponer — las tres frases que dice Excel.
     */
    nombre: 'crear-tabla',
    etiqueta: (a) => `Crear la tabla «${txt(a, 'nombre', 'Tabla1')}» en ${txt(a, 'rango')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const caja = cajaDeArgs(a);
      if (!caja || !hojaDe(libro, hojaId)) return libro;
      const tabla: Tabla = {
        id: txt(a, 'id'),
        nombre: txt(a, 'nombre', 'Tabla1'),
        rango: textoDeCaja(caja),
        estilo: txt(a, 'estilo', 'claro-1'),
      };
      return conTablas(libro, hojaId, [...tablasDe(libro, hojaId), tabla]);
    },
    // Crear una tabla no cambia ni un valor: es la misma pregunta que ya se
    // hizo `insertarGrafica`, y la misma respuesta — ninguna fórmula lee si
    // un rango es tabla o no.
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      if (!txt(a, 'id')) return 'a una tabla hay que darle un identificador';
      if (tablaDe(libro, hojaId, txt(a, 'id'))) return 'ya hay una tabla con ese identificador';
      const caja = cajaDeArgs(a);
      if (!caja) return `«${txt(a, 'rango')}» no es un rango`;
      if (caja.f0 === caja.f1) {
        return 'una tabla necesita al menos una fila de encabezados y una fila de datos debajo';
      }
      for (let c = caja.c0; c <= caja.c1; c += 1) {
        if (crudoEn(libro, hojaId, c, caja.f0).trim() === '') {
          return `a la tabla le falta el encabezado de la columna ${letraDeColumna(c)}: escribe un título en cada columna de la fila de arriba`;
        }
      }
      if (
        tablasDe(libro, hojaId).some((t) => {
          const c = cajaDeTexto(t.rango);
          return !!c && seSolapan(c, caja);
        })
      ) {
        return 'ahí ya hay una tabla: las tablas no se pueden superponer';
      }
      const nombre = txt(a, 'nombre', 'Tabla1');
      if (tablasDe(libro, hojaId).some((t) => t.nombre.toLowerCase() === nombre.toLowerCase())) {
        return `ya hay una tabla llamada «${nombre}»`;
      }
      return null;
    },
  },
  {
    nombre: 'estilo-tabla',
    etiqueta: (a) => `Cambiar la tabla ${txt(a, 'id')} al estilo «${txt(a, 'estilo')}»`,
    aplicar: (libro, a) =>
      conTabla(libro, txt(a, 'hoja', libro.activa), txt(a, 'id'), (t) => ({ ...t, estilo: txt(a, 'estilo') })),
    // El estilo es pintura, como el `color-relleno` de una celda: no hay
    // ninguna fórmula que pueda leer de qué color es una tabla.
    toca: () => [],
    revisar: (libro, a) => {
      if (!tablaDe(libro, txt(a, 'hoja', libro.activa), txt(a, 'id'))) return 'no existe una tabla con ese identificador';
      return txt(a, 'estilo') ? null : 'hay que elegir un estilo';
    },
  },
  {
    /*
     * ── La fila de totales (bloque 33) ──────────────────────────────────────
     *
     * Guarda sólo la INTENCIÓN —«la columna D suma»—, no el número. El
     * número lo calcula `totalDeColumna` (`consultas.ts`) al vuelo, leyendo
     * SÓLO las filas visibles (`puestoDeFila`), que es lo que hace que se
     * comporte como `SUBTOTALES` y no como `SUMA`: filtra la tabla y el total
     * cambia solo, sin que este comando se entere de que hubo un filtro.
     *
     * `resumen: 'ninguno'` QUITA la columna de la fila de totales — el mismo
     * «vacío quita» que ya usa `colorRelleno` o `minY` de una gráfica.
     */
    nombre: 'fila-totales',
    etiqueta: (a) =>
      txt(a, 'resumen', 'ninguno') === 'ninguno'
        ? `Quitar el total de la columna ${letraDeColumna(num(a, 'columna', 0))}`
        : `Poner ${txt(a, 'resumen')} en el total de la columna ${letraDeColumna(num(a, 'columna', 0))}`,
    aplicar: (libro, a) => {
      const col = num(a, 'columna', -1);
      const resumen = txt(a, 'resumen', 'ninguno') as ResumenDeColumna;
      return conTabla(libro, txt(a, 'hoja', libro.activa), txt(a, 'id'), (t) => {
        const totales = { ...t.filaDeTotales };
        if (resumen === 'ninguno') delete totales[col];
        else totales[col] = resumen;
        const nueva: Tabla = { ...t };
        if (Object.keys(totales).length) nueva.filaDeTotales = totales;
        else delete nueva.filaDeTotales;
        return nueva;
      });
    },
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const t = tablaDe(libro, hojaId, txt(a, 'id'));
      if (!t) return 'no existe una tabla con ese identificador';
      const c = cajaDeTexto(t.rango) as Caja;
      const col = num(a, 'columna', -1);
      if (col < c.c0 || col > c.c1) return `la columna ${letraDeColumna(col)} no es de esta tabla`;
      const resumen = txt(a, 'resumen', 'ninguno');
      return (RESUMENES as readonly string[]).includes(resumen)
        ? null
        : `«${resumen}» no es un resumen: suma, promedio, cuenta, max, min o ninguno`;
    },
  },
  {
    /*
     * ── Filtrar (bloque 34) ──────────────────────────────────────────────────
     *
     * No esconde nada por su cuenta: guarda el filtro de la columna y le pide
     * a `recalcularVisibles` que recalcule TODA la hoja desde cero — nunca
     * unas pocas filas a mano, porque una lista de filas escondidas
     * mantenida a mano es una lista que el próximo comando olvida actualizar.
     *
     * «Jugar mal»: filtrar hasta que no quede ninguna fila es LEGAL — Excel
     * lo permite y esta sala también: `visibles` puede quedar en una lista
     * con sólo el encabezado, y la hoja se ve vacía, no rota.
     */
    nombre: 'filtrar',
    etiqueta: (a) => `Filtrar la columna ${letraDeColumna(num(a, 'columna', 0))} de la tabla ${txt(a, 'id')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const t = tablaDe(libro, hojaId, txt(a, 'id'));
      const filtro = filtroDeArgs(a);
      if (!t || !filtro) return libro;
      const col = num(a, 'columna', -1);
      const conFiltro = conTabla(libro, hojaId, t.id, (tt) => ({ ...tt, filtros: { ...tt.filtros, [col]: filtro } }));
      return recalcularVisibles(conFiltro, hojaId);
    },
    // Filtrar esconde filas, y ninguna fórmula recalcula al esconderse una
    // fila: `=SUMA(A1:A20)` sigue sumando las veinte aunque sólo se vean
    // tres — es la fidelidad que este bloque entero existe para enseñar.
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const t = tablaDe(libro, hojaId, txt(a, 'id'));
      if (!t) return 'no existe una tabla con ese identificador';
      const c = cajaDeTexto(t.rango) as Caja;
      const col = num(a, 'columna', -1);
      if (col < c.c0 || col > c.c1) return `la columna ${letraDeColumna(col)} no es de esta tabla`;
      return filtroDeArgs(a) ? null : 'hay que decir qué filtrar: una lista de valores marcados, o una comparación';
    },
  },
  {
    nombre: 'quitar-filtros',
    etiqueta: (a) => `Quitar los filtros de la tabla ${txt(a, 'id')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const t = tablaDe(libro, hojaId, txt(a, 'id'));
      if (!t?.filtros) return libro;
      const sinFiltros = conTabla(libro, hojaId, t.id, (tt) => {
        const nueva = { ...tt };
        delete nueva.filtros;
        return nueva;
      });
      return recalcularVisibles(sinFiltros, hojaId);
    },
    toca: () => [],
    revisar: (libro, a) =>
      tablaDe(libro, txt(a, 'hoja', libro.activa), txt(a, 'id')) ? null : 'no existe una tabla con ese identificador',
  },
  {
    /*
     * ── Ordenar por varias columnas (bloque 35) ─────────────────────────────
     *
     * `orden` codifica la lista de criterios EN PRIORIDAD, «columna-sentido»
     * separados por comas: `"2-1,0-0"` es «primero la columna 2 descendente,
     * luego la 0 ascendente» — la misma disciplina que ya usan `bordes`
     * (`"arriba+abajo"`) y el predicado del formato condicional.
     *
     * **Se lleva la fila ENTERA, crudo Y formato, celda por celda.** Es el
     * defecto anotado en `gestosDeOrden` (`cinta.ts`, bloque 19): ese ordenar
     * mueve el crudo y deja el color pintado en el renglón. Aquí no: cada
     * celda de la fila destino recibe la celda de la fila origen completa
     * —`{ ...celda }`—, así que una fila pintada de amarillo se lleva su
     * amarillo al moverse, como en Excel de verdad. Se arregla aquí y no en
     * `gestosDeOrden` porque ese ordenar es de otro bloque (19, una sola
     * columna) y tocarlo no es de este paquete; queda dicho en la respuesta
     * final.
     *
     * **`revisar` rechaza ordenar una tabla filtrada.** No porque no se
     * pueda pensar una semántica —Excel sólo reordena las filas visibles y
     * dej a las escondidas donde estaban—, sino porque construirla bien es
     * mucho más código para un caso que ningún bloque de hoy provoca, y
     * construirla mal dejaría una tabla con filas que ya no corresponden con
     * lo que está debajo: el peor de los dos. Es la misma familia de reserva
     * que «no hay `redimensionarGrafica`» en la cabecera de las gráficas.
     */
    nombre: 'ordenar-varias',
    etiqueta: (a) => `Ordenar la tabla ${txt(a, 'id')} por ${txt(a, 'orden')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const t = tablaDe(libro, hojaId, txt(a, 'id'));
      const criterios = criteriosDeArgs(txt(a, 'orden'));
      const caja = t ? cajaDeTexto(t.rango) : null;
      if (!t || !criterios || !caja || caja.f1 === caja.f0) return libro;
      const motor = crearMotor(libro);
      const hoja = hojaDe(libro, hojaId);
      const filas: Array<{ fila: number; celdas: Array<Celda | undefined> }> = [];
      for (let f = caja.f0 + 1; f <= caja.f1; f += 1) {
        const celdas: Array<Celda | undefined> = [];
        for (let c = caja.c0; c <= caja.c1; c += 1) celdas.push(hoja?.celdas[dir(c, f)]);
        filas.push({ fila: f, celdas });
      }
      const ordenadas = filas.slice().sort((x, y) => {
        for (const crit of criterios) {
          const va = valorDe(motor, hojaId, crit.col, x.fila);
          const vb = valorDe(motor, hojaId, crit.col, y.fila);
          const va0 = va === null;
          const vb0 = vb === null;
          if (va0 || vb0) {
            if (va0 && vb0) continue;
            return va0 ? 1 : -1;
          }
          const r = comparar(va, vb);
          const n = typeof r === 'number' ? r : 0;
          if (n !== 0) return crit.desc ? -n : n;
        }
        return 0;
      });
      let out = libro;
      ordenadas.forEach((origen, i) => {
        const destino = caja.f0 + 1 + i;
        origen.celdas.forEach((celda, j) => {
          const col = caja.c0 + j;
          const movida: Celda | null = celda
            ? { ...celda, crudo: desplazarCrudo(celda.crudo, 0, destino - origen.fila) }
            : null;
          out = conCelda(out, hojaId, col, destino, movida);
        });
      });
      return conTabla(out, hojaId, t.id, (tt) => ({ ...tt, orden: criterios }));
    },
    toca: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const t = tablaDe(libro, hojaId, txt(a, 'id'));
      const caja = t ? cajaDeTexto(t.rango) : null;
      return caja ? clavesDeCaja(hojaId, { ...caja, f0: caja.f0 + 1 }) : [];
    },
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const t = tablaDe(libro, hojaId, txt(a, 'id'));
      if (!t) return 'no existe una tabla con ese identificador';
      if (t.filtros && Object.keys(t.filtros).length) {
        return 'quita los filtros antes de ordenar: con la tabla filtrada, lo que ves dejaría de corresponder con la fila de debajo. Ve a Datos → Quitar filtros y vuelve a intentarlo.';
      }
      const caja = cajaDeTexto(t.rango);
      if (!caja) return 'el rango de la tabla no se entiende';
      if (caja.f1 === caja.f0) return 'esta tabla no tiene ninguna fila de datos que ordenar';
      const criterios = criteriosDeArgs(txt(a, 'orden'));
      if (!criterios) return 'hay que decir por qué columnas ordenar, en orden de prioridad';
      for (const crit of criterios) {
        if (crit.col < caja.c0 || crit.col > caja.c1) return `la columna ${letraDeColumna(crit.col)} no es de esta tabla`;
      }
      return null;
    },
  },
  {
    /*
     * ── Inmovilizar (bloque 36) ──────────────────────────────────────────────
     *
     * SÓLO pintado: no toca `visibles`, no mueve ni esconde ninguna celda —lo
     * dice `modelo.ts` en la cabecera de `Hoja.inmovilizado`—. `toca: []`
     * porque no hay ninguna fórmula que pueda leer cuántas filas están
     * inmovilizadas.
     *
     * `filas: 0, cols: 0` QUITA la inmovilización, el mismo «vacío quita» de
     * siempre. Los límites de `revisar` son los de la rejilla
     * (`COLUMNAS`/`FILAS`, `modelo.ts`): no hace falta saber cuántas filas
     * «tiene» la hoja para rechazar un número que no cabe en ninguna.
     */
    nombre: 'inmovilizar',
    etiqueta: (a) => {
      const filas = num(a, 'filas', 0);
      const cols = num(a, 'cols', 0);
      if (!filas && !cols) return 'Quitar los paneles inmovilizados';
      if (filas && cols) return `Inmovilizar ${filas} fila(s) y ${cols} columna(s)`;
      return filas ? `Inmovilizar ${filas} fila(s)` : `Inmovilizar ${cols} columna(s)`;
    },
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const h = hojaDe(libro, hojaId);
      if (!h) return libro;
      const filas = Math.max(0, num(a, 'filas', 0));
      const cols = Math.max(0, num(a, 'cols', 0));
      const hoja: Hoja = { ...h };
      if (filas || cols) hoja.inmovilizado = { filas, cols };
      else delete hoja.inmovilizado;
      return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? hoja : x)) };
    },
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      const filas = num(a, 'filas', 0);
      const cols = num(a, 'cols', 0);
      if (!Number.isInteger(filas) || filas < 0 || filas >= FILAS) return 'ese número de filas no se puede inmovilizar';
      if (!Number.isInteger(cols) || cols < 0 || cols >= COLUMNAS) return 'ese número de columnas no se puede inmovilizar';
      return null;
    },
  },
  {
    /*
     * ── Ocultar y mostrar filas (bloque 36) ──────────────────────────────────
     *
     * Independientes de cualquier tabla: es el clic derecho de siempre sobre
     * la cabecera de fila, y toca `visibles` DIRECTAMENTE, sin pasar por
     * `recalcularVisibles` — porque no hay ningún filtro que recalcular, sólo
     * un pedido explícito de esconder.
     *
     * «Jugar mal»: ocultar TODAS las filas es LEGAL, la hoja se ve en blanco
     * y no rota — es justo lo que hace Excel de verdad.
     */
    nombre: 'ocultar-filas',
    etiqueta: (a) => {
      const desde = num(a, 'desde', 0);
      const hasta = num(a, 'hasta', desde);
      return desde === hasta ? `Ocultar la fila ${desde + 1}` : `Ocultar las filas ${desde + 1} a ${hasta + 1}`;
    },
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const h = hojaDe(libro, hojaId);
      if (!h) return libro;
      const desde = num(a, 'desde', 0);
      const hasta = num(a, 'hasta', desde);
      const base = h.visibles ?? Array.from({ length: extensionDeHoja(h, [hasta]) + 1 }, (_, i) => i);
      const quedan = base.filter((f) => f < desde || f > hasta);
      return conVisibles(libro, hojaId, quedan);
    },
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      const desde = num(a, 'desde', 0);
      const hasta = num(a, 'hasta', desde);
      if (!Number.isInteger(desde) || desde < 0 || desde >= FILAS) return `«${desde}» no es una fila`;
      if (!Number.isInteger(hasta) || hasta < desde || hasta >= FILAS) return `«${hasta}» no es una fila válida donde terminar`;
      return null;
    },
  },
  {
    nombre: 'mostrar-filas',
    etiqueta: (a) => {
      const desde = num(a, 'desde', 0);
      const hasta = num(a, 'hasta', desde);
      return desde === hasta ? `Mostrar la fila ${desde + 1}` : `Mostrar las filas ${desde + 1} a ${hasta + 1}`;
    },
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const h = hojaDe(libro, hojaId);
      if (!h?.visibles) return libro; // ya se ven todas
      const desde = num(a, 'desde', 0);
      const hasta = num(a, 'hasta', desde);
      const extra: number[] = [];
      for (let f = desde; f <= hasta; f += 1) if (!h.visibles.includes(f)) extra.push(f);
      if (!extra.length) return libro;
      const combinado = [...h.visibles, ...extra].sort((x, y) => x - y);
      /*
       * **Reserva escrita a propósito: aquí NO se intenta volver a `undefined`.**
       * `recalcularVisibles` sí puede probarlo —recalcula la extensión entera
       * desde las tablas y las celdas de hoy—, pero aquí sólo se sabe de las
       * filas que YA estaban en `visibles` más las que se acaban de pedir: si
       * quedó una fila escondida más allá de ambas (otro tramo de
       * `ocultar-filas`, más lejos, que este comando no tiene por qué
       * conocer), un array que parezca «completo» de `0` a su último valor
       * mentiría. Guardar el array explícito y no volver a `undefined` es
       * más feo —una hoja sin nada escondido puede quedarse con una lista
       * puesta— pero nunca da un falso «se ve todo».
       */
      return conVisibles(libro, hojaId, combinado);
    },
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      const desde = num(a, 'desde', 0);
      const hasta = num(a, 'hasta', desde);
      if (!Number.isInteger(desde) || desde < 0 || desde >= FILAS) return `«${desde}» no es una fila`;
      if (!Number.isInteger(hasta) || hasta < desde || hasta >= FILAS) return `«${hasta}» no es una fila válida donde terminar`;
      return null;
    },
  },
  /* ── las tablas dinámicas · bloques 49 y 50 ───────────────────────────────
   *
   * Cuatro comandos y ni uno más, y ninguno de ellos escribe una celda: guardan
   * **la especificación** de la dinámica (`Dinamica`, en `modelo.ts`) y nada
   * más. Las celdas del cruce no existen en el libro — se pintan del cruce
   * entre esa especificación y los datos de origen, que es la decisión entera
   * del paquete y está razonada junto al tipo.
   *
   * De ahí que los cuatro contesten `toca: []`: una dinámica no cambia el valor
   * de ninguna celda de la hoja, ni siquiera al actualizarse. No hay nada que
   * recalcular porque no hay nada escrito.
   *
   * Los índices de campo (`campo`, `dentroDe`) son **relativos al origen**: `0`
   * es su primera columna. Al revés que en las tablas, y a propósito — ver la
   * cabecera de `Dinamica`.
   */
  {
    /*
     * ── Crear la dinámica (bloque 49) ───────────────────────────────────────
     *
     * **Nace vacía**, como en Excel: un marco y el panel de campos al lado. Los
     * campos se arrastran después, uno a uno, con `campo-dinamica`, y eso no es
     * un atajo del motor sino la clase — la primera vez que el alumno ve la
     * misma tabla contada de dos maneras es arrastrando el segundo campo.
     *
     * `id` viaja en el gesto por la misma regla que en `crear-tabla` y en
     * `insertarGrafica`: un identificador inventado aquí daría un libro distinto
     * cada vez que se reproduce la macro.
     */
    nombre: 'crear-dinamica',
    etiqueta: (a) => `Crear una tabla dinámica en ${txt(a, 'ancla')} con los datos de ${txt(a, 'origen')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const p = dirAColFila(txt(a, 'ancla'));
      const id = txt(a, 'id');
      if (!id || !p || !hojaDe(libro, hojaId) || dinamicaDe(libro, hojaId, id)) return libro;
      const din: Dinamica = {
        id,
        origen: txt(a, 'origen').trim(),
        ancla: clave(hojaId, p.col, p.fila),
        filas: [],
        columnas: [],
        valores: [],
      };
      return conDinamicas(libro, hojaId, [...dinamicasDe(libro, hojaId), din]);
    },
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      const id = txt(a, 'id');
      if (!id) return 'a una tabla dinámica hay que darle un identificador';
      if (todasLasDinamicas(libro).some(({ din }) => din.id === id)) {
        return 'ya hay una tabla dinámica con ese identificador';
      }
      const p = dirAColFila(txt(a, 'ancla'));
      if (!p) return `«${txt(a, 'ancla')}» no es un sitio de la hoja donde pintar la dinámica`;
      const motivo = motivoDelOrigen(libro, txt(a, 'origen'), hojaId);
      if (motivo) return motivo;
      return motivoDeSolape(libro, {
        id,
        origen: txt(a, 'origen').trim(),
        ancla: clave(hojaId, p.col, p.fila),
        filas: [],
        columnas: [],
        valores: [],
      });
    },
  },
  {
    /*
     * ── Arrastrar un campo (bloques 49 y 50) ────────────────────────────────
     *
     * Un comando y no cinco, con la zona dentro del gesto, por lo mismo que
     * `cambiarGrafica` es uno y no ocho: los cinco hacen lo mismo —mover un
     * campo de sitio— y cinco `revisar` separados se irían separando de verdad.
     *
     * Una lista de etiquetas para filtrar viaja en un solo hueco de texto
     * separada por `|` (`"Norte|Sur"`), que es la disciplina que ya siguen
     * `bordes` (`"arriba+abajo"`) y el `"entre|100|500"` del formato
     * condicional: los `args` de un gesto son cadenas y números, y aquí no se
     * inventa una forma nueva para guardar dos palabras.
     */
    nombre: 'campo-dinamica',
    etiqueta: (a) => {
      const zona = txt(a, 'zona', 'filas');
      const campo = num(a, 'campo', 0) + 1;
      if (zona === 'fuera') return `Quitar el campo ${campo} de la tabla dinámica`;
      if (zona === 'valores') return `Resumir el campo ${campo} con ${txt(a, 'resumen', 'suma')}`;
      if (zona === 'filtro') return `Filtrar el campo ${campo} por «${txt(a, 'valores')}»`;
      return `Poner el campo ${campo} en ${zona}`;
    },
    aplicar: (libro, a) => {
      const zona = txt(a, 'zona', 'filas');
      if (!esZona(zona)) return libro;
      return conDinamica(libro, txt(a, 'hoja', libro.activa), txt(a, 'id'), (d) =>
        conCampo(
          d,
          num(a, 'campo', -1),
          zona,
          txt(a, 'resumen', 'suma') as ResumenDeColumna,
          txt(a, 'valores')
            .split('|')
            .map((s) => s.trim())
            .filter((s) => s !== ''),
        ),
      );
    },
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const din = dinamicaDe(libro, hojaId, txt(a, 'id'));
      if (!din) return 'no existe una tabla dinámica con ese identificador';
      const zona = txt(a, 'zona', 'filas');
      if (!esZona(zona)) return `«${zona}» no es una zona: filas, columnas, valores, filtro o fuera`;
      const campo = num(a, 'campo', -1);
      const cuantos = camposDelOrigen(libro, din, hojaId);
      if (!Number.isInteger(campo) || campo < 0 || campo >= cuantos) {
        return `el origen no tiene un campo número ${campo + 1}: tiene ${cuantos}`;
      }
      const resumen = txt(a, 'resumen', 'suma');
      if (zona === 'valores' && !(RESUMENES as readonly string[]).includes(resumen)) {
        return `«${resumen}» no es un resumen: suma, promedio, cuenta, max, min o ninguno`;
      }
      return motivoDeSolape(
        libro,
        conCampo(
          din,
          campo,
          zona,
          resumen as ResumenDeColumna,
          txt(a, 'valores')
            .split('|')
            .map((s) => s.trim())
            .filter((s) => s !== ''),
        ),
      );
    },
  },
  {
    /*
     * ── Agrupar un campo dentro de otro (bloque 50) ─────────────────────────
     *
     * El orden de los campos de un eje ES el anidamiento, así que agrupar es
     * colocar un campo justo detrás de otro. Con eso, «ventas por región y
     * dentro por mes» y «por mes y dentro por región» son el mismo gesto con
     * los dos campos cambiados de sitio, que es exactamente la pregunta de la
     * clase.
     *
     * `dentroDe: -1` saca el campo al primer nivel de su eje.
     *
     * **Reserva escrita a propósito:** el otro «agrupar» de Excel —juntar
     * fechas por mes o números por tramos— pide un campo nuevo en `Dinamica`, y
     * la forma está fijada. Sin él, los meses escritos como texto salen en
     * orden alfabético (abril antes que enero) y eso no es un defecto: es la
     * clase, ver la cabecera de `dinamica.ts`.
     */
    nombre: 'agrupar-dinamica',
    etiqueta: (a) =>
      num(a, 'dentroDe', -1) < 0
        ? `Sacar el campo ${num(a, 'campo', 0) + 1} al primer nivel`
        : `Agrupar el campo ${num(a, 'campo', 0) + 1} dentro del campo ${num(a, 'dentroDe', 0) + 1}`,
    aplicar: (libro, a) =>
      conDinamica(libro, txt(a, 'hoja', libro.activa), txt(a, 'id'), (d) =>
        anidado(d, num(a, 'campo', -1), num(a, 'dentroDe', -1)),
      ),
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const din = dinamicaDe(libro, hojaId, txt(a, 'id'));
      if (!din) return 'no existe una tabla dinámica con ese identificador';
      const campo = num(a, 'campo', -1);
      const dentroDe = num(a, 'dentroDe', -1);
      if (campo === dentroDe) return 'un campo no se puede agrupar dentro de sí mismo';
      if (dentroDe >= 0 && !din.filas.includes(dentroDe) && !din.columnas.includes(dentroDe)) {
        return `el campo ${dentroDe + 1} no está en filas ni en columnas: no se puede agrupar nada dentro de él`;
      }
      if (dentroDe < 0 && !din.filas.includes(campo) && !din.columnas.includes(campo)) {
        return `el campo ${campo + 1} no está en filas ni en columnas: arrástralo antes a una de las dos zonas`;
      }
      return motivoDeSolape(libro, anidado(din, campo, dentroDe));
    },
  },
  {
    /*
     * ── Actualizar (bloque 49) ──────────────────────────────────────────────
     *
     * **El mismo dato, otro objeto**, y ahí está la clase entera: el libro que
     * queda es indistinguible del anterior con un `toEqual` —no se ha guardado
     * ni un número— pero la caché de `dinamica.ts` ya no reconoce esa dinámica y
     * la próxima vez que alguien la mire se construirá con los datos de ahora.
     *
     * Que haga falta pulsarlo no es una limitación del motor: es cómo funciona
     * Excel y es la primera vez, después de veinte bloques, que algo no se
     * arrastra solo. Que se vea el número viejo hasta que se pulsa es la mitad
     * de la lección; la otra mitad es que el número viejo estaba bien cuando se
     * calculó.
     */
    nombre: 'actualizar-dinamica',
    etiqueta: (a) => `Actualizar la tabla dinámica ${txt(a, 'id')}`,
    aplicar: (libro, a) => conDinamica(libro, txt(a, 'hoja', libro.activa), txt(a, 'id'), refrescada),
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const din = dinamicaDe(libro, hojaId, txt(a, 'id'));
      if (!din) return 'no existe una tabla dinámica con ese identificador';
      return motivoDelOrigen(libro, din.origen, hojaId) ?? motivoDeSolape(libro, refrescada(din));
    },
  },
  /* ── el gráfico dinámico y la segmentación · bloque 51 ───────────────────────
   *
   * Dos comandos para el gráfico —nace de una dinámica en vez de un rango— y
   * dos para el panel de botones que lo filtra junto con su dinámica. Los
   * cuatro guardan una ESPECIFICACIÓN, la misma disciplina que los de arriba:
   * `grafico-dinamico` no calcula ni una barra —eso es `Grafica.tsx`, leyendo
   * `dinamica.ts` en cada pintada— y `filtrar-segmentacion` no calcula ni una
   * fila —eso es `conCampo`, de `dinamica.ts`, el mismo camino que ya usa
   * `campo-dinamica`—. Por eso los cuatro contestan `toca: []`: ninguno
   * escribe una celda.
   */
  {
    /*
     * ── El gráfico dinámico ──────────────────────────────────────────────────
     *
     * La misma `Grafica` de siempre con una diferencia: en vez de
     * `datos: "A1:B9"` lleva `origenDinamica: "d1"` (`modelo.ts`, razonado ahí
     * entero). Reusa el motor de gráficas completo —`Grafica.tsx` sigue siendo
     * quien dibuja, `insertarGrafica`/`cambiarGrafica`/`moverGrafica`/
     * `borrarGrafica` lo siguen aceptando como cualquier otra gráfica— y lo
     * único que cambia es de dónde saca los números.
     *
     * `datos` se deja en `''`: sigue siendo obligatorio en el tipo (un libro
     * viejo no cambia de forma) y aquí no dice nada — `Grafica.tsx` mira
     * `origenDinamica` primero y no llega a leerlo.
     */
    nombre: 'grafico-dinamico',
    etiqueta: (a) => `Insertar un gráfico de ${txt(a, 'tipo', 'columnas')} sobre la tabla dinámica ${txt(a, 'dinamica')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const id = txt(a, 'id');
      const tipo = txt(a, 'tipo', 'columnas');
      const dinamicaId = txt(a, 'dinamica');
      if (!id || !dinamicaId || !esTipoDeGrafica(tipo) || !hojaDe(libro, hojaId)) return libro;
      if (graficaDe(libro, hojaId, id)) return libro;
      const din = dinamicaDe(libro, hojaId, dinamicaId);
      if (!din) return libro;
      const region = regionDeDinamica(libro, din);
      const grafica: Grafica = {
        id,
        tipo,
        datos: '',
        origenDinamica: dinamicaId,
        // La leyenda nace encendida por la misma razón que en `insertarGrafica`.
        leyenda: true,
        ancla: anclaDeTexto(txt(a, 'ancla')) ?? (region ? anclaJuntoARegion(region.caja, 8, 15) : { col: 0, fila: 0, cols: 8, filas: 15 }),
      };
      if (a.titulo !== undefined) grafica.titulo = txt(a, 'titulo');
      return conGraficas(libro, hojaId, [...graficasDe(libro, hojaId), grafica]);
    },
    // Un gráfico lee celdas —o, aquí, lee una dinámica— y ninguna celda lee un
    // gráfico: la misma frase de la cabecera de la familia de `insertarGrafica`.
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      if (!txt(a, 'id')) return 'a un gráfico hay que darle un identificador';
      const tipo = txt(a, 'tipo', 'columnas');
      if (!esTipoDeGrafica(tipo)) {
        return `«${tipo}» no es un tipo de gráfica: columnas, barras, lineas, circular o dispersion`;
      }
      // «Jugar mal»: un gráfico dinámico sobre una dinámica que no existe.
      const din = dinamicaDe(libro, hojaId, txt(a, 'dinamica'));
      if (!din) {
        return 'no existe una tabla dinámica con ese identificador: un gráfico dinámico necesita una dinámica que ya exista';
      }
      const motivo = motivoDelOrigen(libro, din.origen, hojaId);
      if (motivo) return motivo;
      if (txt(a, 'ancla') && !anclaDeTexto(txt(a, 'ancla'))) return `«${txt(a, 'ancla')}» no es un sitio de la hoja`;
      return graficaDe(libro, hojaId, txt(a, 'id'))
        ? 'ya hay un gráfico con ese identificador: muévelo o bórralo antes de hacer otro igual'
        : null;
    },
  },
  {
    /*
     * ── La segmentación de datos ──────────────────────────────────────────────
     *
     * Nace apuntando a un campo del origen de una dinámica que ya existe, en la
     * misma hoja — la reserva que `Segmentacion.dinamica` deja escrita en
     * `modelo.ts`. No guarda qué botones están pulsados: eso vive en
     * `Dinamica.filtros[campo]`, y lo escribe `filtrar-segmentacion`, aquí
     * abajo.
     */
    nombre: 'segmentacion',
    etiqueta: (a) => `Insertar una segmentación del campo ${num(a, 'campo', 0) + 1} de la tabla dinámica ${txt(a, 'dinamica')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const id = txt(a, 'id');
      const dinamicaId = txt(a, 'dinamica');
      const campo = num(a, 'campo', -1);
      if (!id || !dinamicaId || campo < 0 || !hojaDe(libro, hojaId)) return libro;
      if (segmentacionDe(libro, hojaId, id)) return libro;
      const din = dinamicaDe(libro, hojaId, dinamicaId);
      if (!din) return libro;
      const region = regionDeDinamica(libro, din);
      const segmentacion: Segmentacion = {
        id,
        dinamica: dinamicaId,
        campo,
        ancla: anclaDeTexto(txt(a, 'ancla')) ?? (region ? anclaJuntoARegion(region.caja, 6, 6) : { col: 0, fila: 0, cols: 6, filas: 6 }),
      };
      if (a.titulo !== undefined) segmentacion.titulo = txt(a, 'titulo');
      return conSegmentaciones(libro, hojaId, [...segmentacionesDe(libro, hojaId), segmentacion]);
    },
    // Nace sin ningún filtro puesto: no toca `Dinamica.filtros`, así que no hay
    // nada que recalcular todavía.
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      if (!txt(a, 'id')) return 'a una segmentación hay que darle un identificador';
      if (segmentacionDe(libro, hojaId, txt(a, 'id'))) return 'ya hay una segmentación con ese identificador';
      // «Jugar mal»: una segmentación de una dinámica que no existe.
      const din = dinamicaDe(libro, hojaId, txt(a, 'dinamica'));
      if (!din) {
        return 'no existe una tabla dinámica con ese identificador: una segmentación necesita una dinámica que ya exista';
      }
      // «Jugar mal»: una segmentación de un campo que no está en la dinámica —
      // que no existe en su origen. La misma cuenta que ya hace `campo-dinamica`.
      const campo = num(a, 'campo', -1);
      const cuantos = camposDelOrigen(libro, din, hojaId);
      if (!Number.isInteger(campo) || campo < 0 || campo >= cuantos) {
        return `el origen no tiene un campo número ${campo + 1}: tiene ${cuantos}`;
      }
      if (txt(a, 'ancla') && !anclaDeTexto(txt(a, 'ancla'))) return `«${txt(a, 'ancla')}» no es un sitio de la hoja`;
      return null;
    },
  },
  {
    /*
     * ── Pulsar un botón de la segmentación ────────────────────────────────────
     *
     * `valores` viaja como el resto de listas de esta sala —separado por `|`,
     * la disciplina de `bordes` y del filtro de `campo-dinamica`— y es la lista
     * COMPLETA de lo que queda seleccionado, no un botón que se conmuta: un
     * gesto lleva todo lo que necesita y nada se inventa al reproducirlo — el
     * mismo motivo por el que `campo-dinamica` tampoco conmuta. Vacío quita el
     * filtro entero, como soltar todos los botones en Excel.
     *
     * Escribe en `Dinamica.filtros[campo]` con `conCampo` —el mismo camino de
     * `campo-dinamica`— y por eso **filtra la dinámica y el gráfico a la vez**:
     * los dos leen la misma `Construida`, que ya respeta los filtros.
     */
    nombre: 'filtrar-segmentacion',
    etiqueta: (a) =>
      txt(a, 'valores') ? `Filtrar la segmentación por «${txt(a, 'valores')}»` : 'Quitar el filtro de la segmentación',
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const seg = segmentacionDe(libro, hojaId, txt(a, 'id'));
      if (!seg) return libro;
      const etiquetas = txt(a, 'valores')
        .split('|')
        .map((s) => s.trim())
        .filter((s) => s !== '');
      return conDinamica(libro, hojaId, seg.dinamica, (d) => conCampo(d, seg.campo, 'filtro', 'suma', etiquetas));
    },
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const seg = segmentacionDe(libro, hojaId, txt(a, 'id'));
      if (!seg) return 'no existe una segmentación con ese identificador';
      const din = dinamicaDe(libro, hojaId, seg.dinamica);
      if (!din) return 'la tabla dinámica de esta segmentación ya no existe';
      const etiquetas = txt(a, 'valores')
        .split('|')
        .map((s) => s.trim())
        .filter((s) => s !== '');
      /*
       * «Jugar mal»: una selección que deja la dinámica sin ninguna fila se
       * ACEPTA — es exactamente lo que hace un slicer en Excel, que se queda
       * en pantalla mostrando una tabla vacía en vez de negarse—, así que aquí
       * sólo se pregunta por el solape con otra dinámica o con su origen,
       * nunca por cuántas filas van a quedar.
       */
      return motivoDeSolape(libro, conCampo(din, seg.campo, 'filtro', 'suma', etiquetas));
    },
  },
  /* ── la línea de tendencia y el eje secundario · bloque 52 ───────────────────
   *
   * Cuatro campos nuevos de `Grafica` (`modelo.ts`) y dos comandos para
   * tocarlos — ninguno de los dos calcula nada: la recta y las dos escalas se
   * calculan en cada pintada, dentro de `Grafica.tsx` (`lineaDeTendencia` y la
   * `escalaDe` de siempre, aplicada al segundo eje). Aplican a CUALQUIER
   * gráfica, tenga o no un `origenDinamica` puesto: la tendencia y el eje
   * secundario no son del gráfico dinámico, son del bloque 52 y le sirven
   * igual a un gráfico normal.
   */
  {
    /*
     * ── La línea de tendencia ─────────────────────────────────────────────────
     *
     * `serie` vacío QUITA la línea, como el `minY` de `cambiarGrafica`. Sin
     * motor aquí —`revisar` sólo recibe el `Libro`—, así que no hay forma de
     * saber cuántas series tiene de verdad esa gráfica: eso lo contesta
     * `lineaDeTendencia` en cada pintada, con `n` puesto por delante para que
     * la clase lo diga en voz alta. Aquí sólo se vigila la FORMA del dato: un
     * índice entero, no negativo.
     */
    nombre: 'linea-tendencia',
    etiqueta: (a) =>
      txt(a, 'serie').trim() === '' ? 'Quitar la línea de tendencia' : `Línea de tendencia de la serie ${num(a, 'serie', 0) + 1}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const t = txt(a, 'serie').trim();
      return conGrafica(libro, hojaId, txt(a, 'id'), (g) => {
        if (t === '') {
          const sin: Grafica = { ...g };
          delete sin.tendenciaSerie;
          return sin;
        }
        const n = Number(t);
        return Number.isInteger(n) && n >= 0 ? { ...g, tendenciaSerie: n } : g;
      });
    },
    toca: () => [],
    revisar: (libro, a) => {
      if (!graficaDe(libro, txt(a, 'hoja', libro.activa), txt(a, 'id'))) return 'ese gráfico no existe';
      const t = txt(a, 'serie').trim();
      if (t === '') return null;
      const n = Number(t);
      return Number.isInteger(n) && n >= 0 ? null : `«${t}» no es un índice de serie válido`;
    },
  },
  {
    /*
     * ── El eje secundario ─────────────────────────────────────────────────────
     *
     * Dos campos de la gráfica y un gesto que puede tocar uno, el otro, o los
     * dos: `serie`+`activo` mueve una serie de eje, y `minY` corta el segundo
     * eje —la misma capacidad que `cambiarGrafica` ya le da al primero, y la
     * misma razón: dos ejes con la escala elegida a mano pueden hacer que dos
     * curvas que no van juntas parezcan ir juntas. El motor deja las dos
     * puertas abiertas —honesta y mentirosa— y no avisa; avisa la clase.
     *
     * Que un gesto pueda traer sólo `serie` o sólo `minY` es lo que deja que
     * «pon la serie 1 en el segundo eje» y «corta el segundo eje en 100» sean
     * dos botones de la cinta con el mismo comando detrás.
     */
    nombre: 'eje-secundario',
    etiqueta: (a) => {
      if (a.serie !== undefined) {
        return siNo(a, 'activo')
          ? `Pasar la serie ${num(a, 'serie', 0) + 1} al segundo eje`
          : `Devolver la serie ${num(a, 'serie', 0) + 1} al primer eje`;
      }
      return txt(a, 'minY').trim() === '' ? 'Quitar el corte del segundo eje' : `Cortar el segundo eje en ${txt(a, 'minY')}`;
    },
    aplicar: (libro, a) =>
      conGrafica(libro, txt(a, 'hoja', libro.activa), txt(a, 'id'), (g) => {
        const fuera: Grafica = { ...g };
        if (a.serie !== undefined) {
          const serie = num(a, 'serie', -1);
          if (Number.isInteger(serie) && serie >= 0) {
            const nuevos = siNo(a, 'activo') ? conEl(fuera.ejeSecundario ?? [], serie) : sinEl(fuera.ejeSecundario ?? [], serie);
            if (nuevos.length) fuera.ejeSecundario = nuevos;
            else delete fuera.ejeSecundario;
          }
        }
        if (a.minY !== undefined) {
          const t = txt(a, 'minY').trim();
          if (t === '') {
            delete fuera.minYSecundario;
          } else {
            const n = Number(t);
            if (Number.isFinite(n)) fuera.minYSecundario = n;
          }
        }
        return fuera;
      }),
    toca: () => [],
    revisar: (libro, a) => {
      if (!graficaDe(libro, txt(a, 'hoja', libro.activa), txt(a, 'id'))) return 'ese gráfico no existe';
      if (a.serie === undefined && a.minY === undefined) return 'di qué serie mover, o dónde cortar el segundo eje';
      if (a.serie !== undefined) {
        const n = Number(txt(a, 'serie'));
        if (!Number.isInteger(n) || n < 0) return `«${txt(a, 'serie')}» no es un índice de serie válido`;
      }
      if (a.minY !== undefined) {
        const t = txt(a, 'minY').trim();
        if (t !== '' && !Number.isFinite(Number(t))) return `«${t}» no es un número`;
      }
      return null;
    },
  },
  {
    /*
     * ── Validar (bloque 32) ──────────────────────────────────────────────────
     *
     * Sin `id`: la regla se identifica por su propio `rango` (`modelo.ts`), así
     * que validar dos veces el MISMO rango sustituye la regla anterior —igual
     * que un formato nuevo sustituye al que había— y validar un rango distinto
     * (aunque se solape) añade una regla más. `validacionEnCelda` decide quién
     * manda cuando dos se solapan: la última.
     */
    nombre: 'validar',
    etiqueta: (a) => `Validación de datos (${txt(a, 'clase')}) en ${txt(a, 'rango')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const caja = cajaDeArgs(a);
      const clase = txt(a, 'clase');
      if (!hojaDe(libro, hojaId) || !caja || !esClaseDeValidacion(clase)) return libro;
      const regla = validacionDeArgs(a, caja, clase);
      const texto = textoDeCaja(caja);
      const previas = validacionesDe(libro, hojaId).filter((v) => v.rango !== texto);
      return conValidaciones(libro, hojaId, [...previas, regla]);
    },
    // Validar no cambia ningún valor: es una regla sobre lo que se va a
    // escribir, no una escritura. La misma familia que `formato` y `bordes`.
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      const caja = cajaDeArgs(a);
      if (!caja) return `«${txt(a, 'rango')}» no es un rango`;
      const clase = txt(a, 'clase');
      if (!esClaseDeValidacion(clase)) return `«${clase}» no es una regla de validación: elige lista, número, fecha o longitud`;
      if (clase === 'lista') {
        return listaDeArgs(a).length ? null : 'una lista de validación necesita al menos una opción';
      }
      const tieneMin = a.min !== undefined && txt(a, 'min') !== '';
      const tieneMax = a.max !== undefined && txt(a, 'max') !== '';
      if (!tieneMin && !tieneMax) return 'hace falta un mínimo, un máximo, o los dos';
      if (tieneMin && tieneMax && num(a, 'min', 0) > num(a, 'max', 0)) return 'el mínimo no puede ser mayor que el máximo';
      return null;
    },
  },
  {
    nombre: 'quitar-validacion',
    etiqueta: (a) => (txt(a, 'rango') ? `Quitar la validación de ${txt(a, 'rango')}` : 'Quitar toda la validación de la hoja'),
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const h = hojaDe(libro, hojaId);
      if (!h?.validaciones?.length) return libro;
      // Sin `rango`: se limpia la hoja entera, como «Borrar todo» en Excel.
      if (!txt(a, 'rango')) return conValidaciones(libro, hojaId, []);
      const caja = cajaDeArgs(a);
      if (!caja) return libro;
      const texto = textoDeCaja(caja);
      const quedan = h.validaciones.filter((v) => v.rango !== texto);
      return quedan.length === h.validaciones.length ? libro : conValidaciones(libro, hojaId, quedan);
    },
    toca: () => [],
  },
  {
    /*
     * ── Reemplazar (bloque 39) ───────────────────────────────────────────────
     *
     * Reemplaza dentro del CRUDO —el literal o el texto de la fórmula— y no
     * dentro del valor calculado: no hay dónde escribir de vuelta un valor. Es
     * lo mismo que hace Excel: «Buscar dentro de: Fórmulas» es lo que de verdad
     * se puede sustituir.
     *
     * Sin distinguir mayúsculas, como el `Buscar` de Excel por omisión. Y
     * **peligroso a propósito**: reemplazar «A» por «B» dentro de `=A1+A2`
     * puede partir una referencia, y por eso `revisar` cuenta cuántas fórmulas
     * va a tocar antes de dejar pasar (`SE_CONFIRMA`, más abajo).
     */
    nombre: 'reemplazar',
    etiqueta: (a) => `Reemplazar «${txt(a, 'buscar')}» por «${txt(a, 'reemplazo')}» en ${txt(a, 'rango')}`,
    aplicar: (libro, a) => {
      const caja = cajaDeArgs(a);
      const buscar = txt(a, 'buscar');
      if (!caja || !buscar) return libro;
      const hojaId = txt(a, 'hoja', libro.activa);
      const h = hojaDe(libro, hojaId);
      if (!h) return libro;
      const reemplazo = txt(a, 'reemplazo');
      const coincide = (crudo: string) => new RegExp(escaparParaRegex(buscar), 'i').test(crudo);
      let out = libro;
      for (let f = caja.f0; f <= caja.f1; f += 1) {
        for (let c = caja.c0; c <= caja.c1; c += 1) {
          const celda = h.celdas[dir(c, f)];
          if (!celda || !coincide(celda.crudo)) continue;
          const nuevo = celda.crudo.replace(new RegExp(escaparParaRegex(buscar), 'gi'), reemplazo);
          if (nuevo === celda.crudo) continue;
          out = conCelda(out, hojaId, c, f, { ...celda, crudo: nuevo });
        }
      }
      return out;
    },
    toca: (libro, a) => {
      const caja = cajaDeArgs(a);
      return caja ? clavesDeCaja(txt(a, 'hoja', libro.activa), caja) : [];
    },
    revisar: (libro, a) => {
      const caja = cajaDeArgs(a);
      if (!caja) return `«${txt(a, 'rango')}» no es un rango`;
      const hojaId = txt(a, 'hoja', libro.activa);
      const h = hojaDe(libro, hojaId);
      if (!h) return 'esa hoja no existe';
      const buscar = txt(a, 'buscar');
      if (!buscar) return 'escribe algo que buscar';
      const { total, formulas } = coincidenciasParaReemplazar(h, caja, buscar);
      if (total === 0) return `no se encontró «${buscar}»`;
      if (siNo(a, 'confirmado')) return null;
      return formulas > 0
        ? `vas a cambiar ${total} celda(s), y ${formulas} son fórmulas: puedes romperlas. Vuelve a pulsar para continuar`
        : `vas a cambiar ${total} celda(s). Vuelve a pulsar para continuar`;
    },
  },
  {
    /*
     * ── Hipervínculo (bloque 40) ─────────────────────────────────────────────
     *
     * `destino` es una `Clave` completa —`"h2!A1"`—, no el nombre de la hoja:
     * es la misma clave del grafo (`modelo.ts`), y así se resuelve con
     * `partirClave` sin tener que buscar por nombre. Dentro del libro, nada
     * más: no hay una URL que salir a buscar (§32, «software ultra-LITE»).
     */
    nombre: 'hipervinculo',
    etiqueta: (a) => `Hipervínculo de ${txt(a, 'celda')} a ${txt(a, 'destino')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const p = dirAColFila(txt(a, 'celda'));
      if (!hojaDe(libro, hojaId) || !p) return libro;
      const vinculo: Vinculo = { destino: txt(a, 'destino') };
      if (txt(a, 'texto')) vinculo.texto = txt(a, 'texto');
      return conVinculos(libro, hojaId, { ...vinculosDe(libro, hojaId), [clave(hojaId, p.col, p.fila)]: vinculo });
    },
    // Un vínculo no cambia ningún valor: no existe una función que lo lea, la
    // misma familia de razón que `insertarGrafica` y `configurarPagina`.
    toca: () => [],
    revisar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      if (!hojaDe(libro, hojaId)) return 'esa hoja no existe';
      if (!dirAColFila(txt(a, 'celda'))) return `«${txt(a, 'celda')}» no es una celda`;
      const destino = txt(a, 'destino');
      const d = partirClave(destino);
      if (!d) return `«${destino}» no es un destino válido: escribe hoja!celda, como «h2!A1»`;
      return hojaDe(libro, d.hoja) ? null : 'la hoja de destino no existe';
    },
  },
  {
    nombre: 'quitar-hipervinculo',
    etiqueta: (a) => `Quitar el hipervínculo de ${txt(a, 'celda')}`,
    aplicar: (libro, a) => {
      const hojaId = txt(a, 'hoja', libro.activa);
      const p = dirAColFila(txt(a, 'celda'));
      const h = hojaDe(libro, hojaId);
      if (!h?.vinculos || !p) return libro;
      const k = clave(hojaId, p.col, p.fila);
      if (!(k in h.vinculos)) return libro;
      const restantes = { ...h.vinculos };
      delete restantes[k];
      return conVinculos(libro, hojaId, restantes);
    },
    toca: () => [],
  },

  /* ── las macros · bloques 55 y 56, para `of-excel-macros` ───────────────────
   *
   * Cuatro de los cinco casi no tocan el libro. Lo único que de verdad se
   * guarda es una lista de gestos bajo un nombre (`Libro.macros`,
   * `modelo.ts`), y el quinto —`ejecutar-macro`— no aplica nada por su
   * cuenta: `ejecutarVarios`, más abajo, lo EXPANDE en la lista de gestos
   * que guarda la macro antes de que el bucle normal los toque, así que cada
   * uno de ellos pasa por `revisar()` como si el alumno lo hubiera hecho a
   * mano. Es lo que hace que ejecutar una macro sobre una hoja protegida se
   * rechace entera (bloque 54, gratis) en vez de colarse por debajo de la
   * guarda como ya se coló una vez por una copia de este mismo bucle
   * (§47.6).
   *
   * `grabar-macro` y `parar-macro` son casi todo `Grabadora` y casi nada
   * `Libro`: empezar a grabar no cambia ni una celda. Lo que de verdad
   * hacen —encender la bandera, apuntar lo que pasa, y al final guardar la
   * lista bajo un nombre— vive en `ejecutarVarios`, que es quien recibe la
   * `Grabadora` y el único sitio que la puede tocar (§45.6). Por eso
   * `parar-macro` no lleva escrito qué grabó: `ejecutarVarios` se lo rellena
   * en `args.gestos`, como JSON, justo antes de revisarlo — sigue siendo un
   * argumento de puro texto, y sigue siendo el mismo camino de siempre.
   */
  {
    nombre: 'grabar-macro',
    etiqueta: (a) => `Empezar a grabar la macro «${txt(a, 'nombre')}»`,
    // No cambia el libro: sólo arranca la grabadora, y eso lo hace
    // `ejecutarVarios` mirando este mismo nombre de comando.
    aplicar: (libro) => libro,
    toca: () => [],
    revisar: (libro, a) => {
      const nombre = txt(a, 'nombre').trim();
      if (!nombre) return 'ponle un nombre a la macro';
      if (libro.macros?.[nombre] && !siNo(a, 'confirmado')) {
        return `ya existe una macro llamada «${nombre}»: vas a grabar encima de ella. Vuelve a pulsar para continuar`;
      }
      return null;
    },
  },
  {
    nombre: 'parar-macro',
    etiqueta: () => 'Detener la grabación',
    aplicar: (libro, a) => {
      const nombre = txt(a, 'nombre').trim();
      let gestos: Gesto[] = [];
      try {
        gestos = JSON.parse(txt(a, 'gestos', '[]'));
      } catch {
        gestos = [];
      }
      if (!nombre || !gestos.length) return libro;
      return { ...libro, macros: { ...(libro.macros ?? {}), [nombre]: gestos } };
    },
    toca: () => [],
    revisar: (libro, a) => {
      if (!txt(a, 'nombre').trim()) return 'ponle un nombre a la macro';
      let gestos: Gesto[] = [];
      try {
        gestos = JSON.parse(txt(a, 'gestos', '[]'));
      } catch {
        /* args.gestos mal formado: cuenta como vacío, y el aviso de abajo lo dice */
      }
      // La macro vacía (bloque 55, «jugar mal»): parar sin haber grabado
      // nada no deja nada que guardar, y guardarla igual sería una macro
      // que no hace nada pero parece que sí.
      return gestos.length ? null : 'no grabaste ninguna acción: esta macro se quedaría vacía';
    },
  },
  {
    nombre: 'ejecutar-macro',
    etiqueta: (a) => `Ejecutar la macro «${txt(a, 'nombre')}»`,
    // Nunca se llega a llamar en el uso normal: `ejecutarVarios` la expande
    // en sus gestos antes de que el bucle llegue aquí. Queda escrita para
    // que `aplicar()`/`reproducir()` —los caminos SIN guarda, que existen
    // para comparar contra el recálculo de cero (`calculo.ts`)— no se
    // encuentren con un comando fantasma si algún día alguien la llama por
    // ahí directamente.
    aplicar: (libro, a) => reproducir(libro, libro.macros?.[txt(a, 'nombre')] ?? []),
    toca: () => 'todo',
    revisar: (libro, a) => {
      const nombre = txt(a, 'nombre').trim();
      if (!nombre) return 'di qué macro ejecutar';
      return libro.macros?.[nombre]?.length ? null : `no existe una macro llamada «${nombre}»`;
    },
  },
  {
    nombre: 'borrar-macro',
    etiqueta: (a) => `Borrar la macro «${txt(a, 'nombre')}»`,
    aplicar: (libro, a) => {
      const nombre = txt(a, 'nombre').trim();
      if (!libro.macros?.[nombre]) return libro;
      const restantes = { ...libro.macros };
      delete restantes[nombre];
      const out: Libro = { ...libro };
      if (Object.keys(restantes).length) out.macros = restantes;
      else delete out.macros;
      return out;
    },
    toca: () => [],
    revisar: (libro, a) => {
      const nombre = txt(a, 'nombre').trim();
      if (!nombre) return 'di qué macro borrar';
      // Borrar una asignada a un botón se DEJA (bloque 56, «jugar mal»): el
      // botón se queda apuntando a un nombre que ya no existe, igual que un
      // hipervínculo a una hoja borrada — se rompe y se tiene que VER roto,
      // no fallar en silencio ni bloquear el borrado de una macro por algo
      // que la señala desde fuera (`Libro.botones`, en `modelo.ts`).
      return libro.macros?.[nombre] ? null : `no existe una macro llamada «${nombre}»`;
    },
  },
  {
    nombre: 'asignar-macro',
    etiqueta: (a) => `Asignar la macro «${txt(a, 'macro')}» al botón «${txt(a, 'boton')}»`,
    aplicar: (libro, a) => {
      const boton = txt(a, 'boton').trim();
      const macro = txt(a, 'macro').trim();
      if (!boton || !libro.macros?.[macro]) return libro;
      return { ...libro, botones: { ...(libro.botones ?? {}), [boton]: macro } };
    },
    toca: () => [],
    revisar: (libro, a) => {
      if (!txt(a, 'boton').trim()) return 'ponle un nombre al botón';
      const macro = txt(a, 'macro').trim();
      if (!macro) return 'elige qué macro asignar';
      return libro.macros?.[macro] ? null : `no existe una macro llamada «${macro}»`;
    },
  },
];

export const COMANDOS: Record<string, Comando> = Object.fromEntries(LISTA.map((c) => [c.nombre, c]));

export const NOMBRES_DE_COMANDO: string[] = LISTA.map((c) => c.nombre);

/**
 * Los comandos cuyo `revisar` es una **pregunta** y no un portazo.
 *
 * Casi todo lo que `revisar` devuelve es un rechazo: una fórmula que no se
 * entiende, una hoja que ya se llama así. Combinar no: Excel enseña un cuadro de
 * diálogo con Aceptar y Cancelar, y el alumno decide. La ventana necesita
 * distinguir los dos casos para no vestir de error lo que es una pregunta, y lo
 * necesita **como dato**, no adivinando por el texto del aviso — que es cadena y
 * cambia. Quien esté en esta lista se pide dos veces: la primera avisa, la
 * segunda lleva `confirmado: 1` y pasa.
 *
 * Los tres del bloque 57 y el 44 que se sumaron con `ysi.ts` y `datos.ts`
 * (15-ago-2026) son la misma pregunta con otra cara: reemplazar un escenario
 * que ya existe, aplicar uno que va a pisar una fórmula, y quitar duplicados
 * —que de verdad borra filas—. Los tres avisan **cuánto** se va a perder antes
 * de perderlo, que es la regla que pide el §45.6 para todo lo que destruye.
 *
 * Los dos del paquete VALIDACIÓN son la misma familia con otra cara todavía:
 * `reemplazar` (bloque 39) avisa cuántas celdas —y cuántas fórmulas— va a
 * tocar antes de tocarlas, y `escribir` (bloque 32) es distinto de los cinco
 * de arriba porque su pregunta no la hace siempre: sólo cuando la celda tiene
 * puesta una validación de tipo «Advertencia» (`bloquea: false`) y lo escrito
 * la viola. El resto de las escrituras —la inmensa mayoría— pasan por
 * `revisar` sin generar ninguna pregunta, exactamente igual que hasta hoy.
 */
/*
 * `grabar-macro` (bloque 55) se sumó el 15-ago-2026 por la misma familia que
 * `guardar-escenario`: empezar a grabar sobre un nombre que ya existe va a
 * REEMPLAZAR esa macro en cuanto se pare, y eso se avisa antes, no después.
 */
export const SE_CONFIRMA: ReadonlySet<string> = new Set([
  'combinarCeldas',
  'guardar-escenario',
  'aplicar-escenario',
  'quitar-duplicados',
  'reemplazar',
  'escribir',
  'grabar-macro',
]);

/* ── aplicar y reproducir · las cuatro líneas del §45.6 ─────────────────────*/

/**
 * Aplica un gesto. La firma es literalmente la que se escribió en el §45.6.
 *
 * Con una guarda que el documento no traía y que hace falta: un comando que no
 * existe deja el libro como estaba. Una macro guardada hoy se puede abrir dentro
 * de un año con un comando que se quitó, y lo que no puede hacer es tirar la
 * pestaña abajo.
 */
export const aplicar = (libro: Libro, g: Gesto): Libro => COMANDOS[g.comando]?.aplicar(libro, g.args ?? {}) ?? libro;

/** Reproducir una macro es aplicar sus gestos en fila. Eso es todo. */
export const reproducir = (libro: Libro, macro: Gesto[]): Libro => macro.reduce(aplicar, libro);

export const celdasQueToca = (libro: Libro, g: Gesto): Clave[] | 'todo' =>
  COMANDOS[g.comando]?.toca(libro, g.args ?? {}) ?? [];

/* ── la guarda de protección (bloque 54) ─────────────────────────────────────
 *
 * **Vive aquí y en ningún otro sitio, porque `revisar()` es el único punto
 * por el que ya pasa TODO gesto antes de tocar el libro.** La protección se
 * escribe una vez y la respetan los treinta y pico comandos que ya existen
 * —incluidos los que aún no se han escrito—, sin tocar una línea de ninguno.
 *
 * ── Cómo sabe que un comando iba a escribir en una hoja protegida ───────────
 *
 * **Aplicando el gesto de verdad, sobre una copia, y mirando qué cambió.** Es
 * la única manera honesta de estar seguro de que «ninguno de los treinta y
 * pico se cuela»: preguntarle a cada `Comando` un campo nuevo («¿tocas
 * celdas?») sería fiarse de que quien escriba el comando 31 se acuerde de
 * rellenarlo, y ésa es la misma clase de promesa rota que ya costó cara una
 * vez (§47.6, el `toca` que decía menos de lo que el comando tocaba). Aplicar
 * y comparar no se puede olvidar: si el comando escribe, se ve.
 *
 * No sirve `celdasQueToca` para esto, y la razón hay que dejarla escrita
 * porque la tentación de reutilizarla es fuerte: `toca` contesta **qué hay
 * que recalcular**, no **qué se escribió**. El comando `formato` contesta
 * `[]` a propósito —pintar una celda no ensucia ningún valor— y aun así
 * ESCRIBE en `hoja.celdas`; con protección activa, pintar una celda bloqueada
 * tiene que rechazarse igual que escribir un número. Comparar el libro de
 * antes con el de después no tiene ese agujero: le da igual por qué cambió.
 *
 * ── El caso común no paga nada ───────────────────────────────────────────────
 *
 * `hayProteccionActiva` es una vuelta corta por `libro.hojas` — nada de
 * aplicar el gesto— y sale `false` en el libro de cualquiera de las otras
 * mil ciento y pico pruebas del repositorio, que no protegen nada. Sólo
 * cuando alguna hoja está protegida se paga el precio de aplicar el gesto una
 * vez de más (una vez aquí, en la guarda, y otra en `ejecutarVarios` cuando
 * de verdad se aplica) — un botón de proteger es raro y deliberado, no algo
 * que se pulse cincuenta veces por minuto como escribir un número.
 *
 * ── Qué zona vigila cada mitad ───────────────────────────────────────────────
 *
 * La ESTRUCTURA del libro (crear, borrar, mover, renombrar hojas) se mira
 * comparando la lista de hojas entera: si cambia cuántas hay, en qué orden
 * están o cómo se llaman, algo de eso pasó.
 *
 * Las CELDAS de una hoja protegida se miran hoja por hoja, comparando
 * `celdas` por referencia — `conCelda` siempre crea un objeto nuevo para la
 * celda que toca, así que una clave que cambia de referencia es una clave que
 * alguien intentó escribir, aunque el valor que dejara fuera IGUAL al que ya
 * había. Es lo correcto: Excel no pregunta si el número iba a ser el mismo,
 * rechaza el intento.
 *
 * Con una reserva escrita a propósito: los comandos que devuelven `toca:
 * 'todo'` —insertar o borrar una fila o columna— reescriben, como efecto
 * colateral, las fórmulas de CUALQUIER hoja que las referencie (`ajustarPor-
 * Filas`/`ajustarPorColumnas`). Ese colateral no es una escritura del alumno
 * sobre la hoja protegida: es Excel de verdad, ajustando una referencia,
 * hasta en una hoja protegida — así que para ÉSOS la vigilancia de celdas se
 * limita a la hoja que el propio gesto declara como destino (`args.hoja`), no
 * a cualquier hoja que resultara tocada de rebote.
 */

/** ¿Hay alguna protección puesta en este libro? Salida barata para el caso común. */
function hayProteccionActiva(libro: Libro): boolean {
  return !!libro.estructuraProtegida || libro.hojas.some((h) => h.protegida?.activa === true);
}

/** ¿Esta dirección cae dentro de alguno de los rangos que sí se pueden tocar? */
function celdaDesbloqueada(hoja: Hoja, direccion: string): boolean {
  const p = dirAColFila(direccion);
  if (!p) return false;
  return (hoja.protegida?.desbloqueadas ?? []).some((r) => {
    const c = cajaDeTexto(r);
    return !!c && p.col >= c.c0 && p.col <= c.c1 && p.fila >= c.f0 && p.fila <= c.f1;
  });
}

/** El aviso de protección, o `null` si el gesto no choca con ninguna. */
function avisoDeProteccion(libro: Libro, g: Gesto): string | null {
  if (!hayProteccionActiva(libro)) return null;
  const comando = COMANDOS[g.comando];
  if (!comando) return null;
  const args = g.args ?? {};
  const despues = comando.aplicar(libro, args);
  if (despues === libro) return null; // no iba a cambiar nada: no hay nada que proteger

  if (libro.estructuraProtegida) {
    const antes = libro.hojas;
    const luego = despues.hojas;
    const cambioDeLista = antes.length !== luego.length || antes.some((h, i) => luego[i]?.id !== h.id);
    const seRenombro = !cambioDeLista && antes.some((h, i) => luego[i].nombre !== h.nombre);
    if (cambioDeLista || seRenombro) {
      return 'la estructura del libro está protegida: no se pueden crear, borrar, mover ni renombrar hojas. Quítale la protección en Revisar → Proteger libro.';
    }
  }

  const soloEstaHoja = comando.toca(libro, args) === 'todo' ? txt(args, 'hoja', libro.activa) : null;

  for (const h of libro.hojas) {
    if (!h.protegida?.activa) continue;
    if (soloEstaHoja !== null && h.id !== soloEstaHoja) continue;
    const l = despues.hojas.find((x) => x.id === h.id);
    if (!l || l.celdas === h.celdas) continue;
    const direcciones = new Set([...Object.keys(h.celdas), ...Object.keys(l.celdas)]);
    for (const d of direcciones) {
      if (h.celdas[d] === l.celdas[d]) continue;
      if (celdaDesbloqueada(h, d)) continue;
      return `la hoja «${h.nombre}» está protegida: quítale la protección en Revisar, o desbloquea antes el rango de ${d}.`;
    }
  }
  return null;
}

/* ── la guarda de sólo lectura de una dinámica (bloques 49 y 50) ─────────────
 *
 * Vive aquí y no en `escribir` por la misma razón que la de proteger la hoja:
 * `revisar()` es el único punto por el que ya pasa TODO gesto antes de tocar el
 * libro, así que la regla la respetan también `borrar`, `pegar`, `formato`,
 * `rellenarAbajo`, `ordenar-varias` y los que aún no se han escrito, sin tocar
 * una línea de ninguno.
 *
 * Y se mira igual que allí —**aplicando el gesto sobre una copia y comparando
 * qué celdas cambiaron de objeto**— por la misma lección del §47.6: `toca`
 * contesta qué hay que RECALCULAR, no qué se ESCRIBIÓ, y `formato` contesta `[]`
 * a propósito aunque escriba en `hoja.celdas`. Pintar de amarillo una celda de
 * la dinámica tiene que rechazarse igual que escribir un número encima.
 *
 * El caso común no paga nada: `zonasDeSoloLectura` sale vacía en cuanto ninguna
 * hoja del libro tiene dinámicas, que es el de todos los demás libros del
 * repositorio.
 *
 * ── Por qué esto es una guarda y no un aviso ────────────────────────────────
 *
 * Porque no hay dónde escribir. Las celdas que la dinámica enseña no están en
 * `hoja.celdas` —se pintan del cruce cada vez—, así que un número escrito ahí no
 * lo taparía la dinámica: lo taparía la dinámica **a él**, y el alumno vería
 * desaparecer lo que acaba de teclear sin que nadie le diga por qué. La frase
 * dice lo que sí se puede hacer: cambiar el origen y actualizar.
 */
function avisoDeSoloLectura(libro: Libro, g: Gesto): string | null {
  const zonas = zonasDeSoloLectura(libro);
  if (!zonas.length) return null;
  const comando = COMANDOS[g.comando];
  if (!comando) return null;
  const despues = comando.aplicar(libro, g.args ?? {});
  if (despues === libro) return null; // no iba a cambiar nada

  for (const z of zonas) {
    const antes = hojaDe(libro, z.hoja);
    const luego = hojaDe(despues, z.hoja);
    if (!antes || !luego || antes.celdas === luego.celdas) continue;
    for (const d of new Set([...Object.keys(antes.celdas), ...Object.keys(luego.celdas)])) {
      if (antes.celdas[d] === luego.celdas[d]) continue;
      const p = dirAColFila(d);
      if (p && p.col >= z.caja.c0 && p.col <= z.caja.c1 && p.fila >= z.caja.f0 && p.fila <= z.caja.f1) {
        return `la región de la dinámica «${z.id}» es de sólo lectura: cambia los datos de origen y pulsa Actualizar.`;
      }
    }
  }
  return null;
}

/** Lo que Excel diría antes de aceptar. `null` = adelante. */
export const revisar = (libro: Libro, g: Gesto): string | null => {
  if (!COMANDOS[g.comando]) return `no existe el comando «${g.comando}»`;
  const propio = COMANDOS[g.comando].revisar?.(libro, g.args ?? {}) ?? null;
  return propio ?? avisoDeProteccion(libro, g) ?? avisoDeSoloLectura(libro, g);
};

/** Cómo se lee este gesto en la lista de la macro. Es lo que el alumno ve. */
export const etiquetaDe = (g: Gesto): string =>
  COMANDOS[g.comando] ? COMANDOS[g.comando].etiqueta(g.args ?? {}) : `(comando desconocido: ${g.comando})`;

/* ── la grabadora ───────────────────────────────────────────────────────────*/

/**
 * Una bandera, un nombre y una lista. Eso es una grabadora de macros (§45.6).
 *
 * `nombre` llegó el 15-ago-2026 con los bloques 55 y 56: mientras se está
 * grabando, es bajo qué nombre se va a guardar cuando se pare — y es lo que
 * deja que `parar-macro` no tenga que pedírselo otra vez a quien pulsa el
 * botón, igual que Excel no vuelve a preguntar el nombre al detener la
 * grabación. Vacío cuando no se está grabando nada.
 *
 * Sigue siendo estado de la VENTANA, no del libro — la misma familia que el
 * portapapeles (`ContextoCinta.corte`, en `cinta.ts`) — y por eso sigue sin
 * vivir en `Libro`. Lo único que el libro guarda es el resultado final,
 * bajo un nombre, en `Libro.macros` (`modelo.ts`).
 */
export interface Grabadora {
  grabando: boolean;
  nombre: string;
  gestos: Gesto[];
}

export const nuevaGrabadora = (): Grabadora => ({ grabando: false, nombre: '', gestos: [] });

/**
 * El único sitio por el que el programa toca el libro.
 *
 * Revisa, aplica, recalcula lo justo y —si está grabando— apunta. Que sea el
 * único camino es lo que garantiza que la macro grabada contenga TODO lo que
 * pasó: un botón que se salte esto y llame a `conCelda` por su cuenta graba una
 * macro incompleta, y eso no se nota hasta que se reproduce.
 */
export function ejecutar(motor: Motor, g: Gesto, grabadora?: Grabadora): string | null {
  return ejecutarVarios(motor, [g], grabadora).aviso ?? null;
}

export interface Resultado {
  /** `false` cuando el programa rechazó algún gesto. Entonces no se aplicó NADA. */
  ok: boolean;
  /** Lo que Excel diría en su cuadro de diálogo. */
  aviso?: string;
  /** Si el libro terminó distinto. Un formato que ya estaba puesto no cambia nada. */
  cambio: boolean;
}

/**
 * Varios gestos de una vez, con un solo recálculo al final.
 *
 * Existe por un defecto que costó caro y está contado en el §47.6: la ventana
 * necesitaba aplicar varios gestos seguidos —ordenar una lista son doce
 * escrituras— y como `ejecutar()` sólo sabía de uno, **se copió su cuerpo
 * dentro de la ventana**. Al copiarlo se cayó la llamada a `revisar()`, con lo
 * que una fórmula que no se entiende entraba al libro y se quedaba guardada
 * para dar un error en una clase que no era la suya. Nadie lo notó porque
 * **la guarda que se pierde al duplicar no avisa de que se perdió**.
 *
 * Así que en vez de volver a añadirle la guarda a la copia —que fue el primer
 * arreglo, y era el síntoma— el motor aprende a hacer lo que hacía falta y
 * vuelve a haber **un solo camino**. `ejecutar()` es ahora este de aquí con una
 * lista de uno.
 *
 * Dos decisiones dentro:
 *
 * - **Es todo o nada.** Si el tercero de cinco gestos no pasa la revisión, no
 *   se aplica ninguno. Un libro a medio ordenar es peor que uno sin ordenar, y
 *   sobre todo es un estado del que el alumno no sabe volver.
 * - **Un solo recálculo.** Los gestos se aplican sobre un libro de trabajo y el
 *   motor se entera una vez, con todo lo que tocaron junto. Ordenar doce
 *   renglones son doce escrituras y **un** recálculo, no doce.
 *
 * ── Y desde el 15-ago-2026, las macros (bloques 55 y 56) ────────────────────
 *
 * Ésta es la única función que recibe la `Grabadora`, así que es la única que
 * la puede tocar — y por eso tres cosas más del §45.6 viven aquí y en ningún
 * otro sitio:
 *
 * 1. **`ejecutar-macro` se EXPANDE**, no se aplica. Antes de que un gesto así
 *    llegue al bucle normal, se cambia por la lista de gestos que guarda esa
 *    macro (`libro.macros`, `modelo.ts`), así que cada uno de ellos pasa por
 *    `revisar()` uno por uno — la protección de hoja (bloque 54) y la región
 *    de sólo lectura de una dinámica los atrapan gratis, sin una línea nueva
 *    ahí, y todo o nada sigue siendo todo o nada: si el tercer paso de la
 *    macro choca con una hoja protegida, no se aplica ni el primero.
 * 2. **`grabar-macro` y `parar-macro` mandan sobre la bandera**, y lo hacen
 *    en el momento justo para no grabarse a sí mismos: `parar-macro` apaga
 *    `grabando` DENTRO del bucle, antes del empuje final, así que no entra en
 *    la lista que acaba de cerrar; `grabar-macro` la enciende DESPUÉS de ese
 *    mismo empuje, así que no entra en la lista que acaba de abrir.
 * 3. **Ni una tocada de más si nadie graba.** Con `grabadora` sin pasar —o
 *    con `grabando` en falso— este bloque entero no hace nada distinto de lo
 *    que ya hacía: la línea de siempre revisa `grabadora?.grabando` antes de
 *    apuntar, y las tres nuevas comprobaciones son casi gratis, una por gesto.
 */
export function ejecutarVarios(motor: Motor, gestos: Gesto[], grabadora?: Grabadora): Resultado {
  let libro = motor.libro;
  let tocadas: Clave[] | 'todo' = [];
  const cola = [...gestos];
  // El nombre de la macro que arranca en esta tanda, si arranca alguna —ver
  // el punto (2) de la cabecera de arriba sobre por qué se aplica al final—.
  let arrancaGrabadora: string | null = null;

  for (let i = 0; i < cola.length; i += 1) {
    let g = cola[i];

    if (g.comando === 'ejecutar-macro') {
      if (grabadora?.grabando) {
        return {
          ok: false,
          aviso: `no puedes ejecutar una macro mientras grabas «${grabadora.nombre}»: detén la grabación primero`,
          cambio: false,
        };
      }
      const nombre = txt(g.args ?? {}, 'nombre');
      const macro = libro.macros?.[nombre];
      if (!macro || !macro.length) {
        return { ok: false, aviso: `no existe una macro llamada «${nombre}»`, cambio: false };
      }
      cola.splice(i, 1, ...macro);
      i -= 1;
      // Fusible contra una macro que se llama a sí misma, directa o a través
      // de otra: no puede pasar grabando (el aviso de arriba lo impide), pero
      // un gesto construido a mano sí podría pedirlo, y el motor no se cuelga
      // desenrollando algo que no termina — se rechaza entero, con aviso.
      if (cola.length > 5000) {
        return {
          ok: false,
          aviso: 'esta macro se desenrolla demasiado: puede que se llame a sí misma, directa o indirectamente',
          cambio: false,
        };
      }
      continue;
    }

    if (g.comando === 'grabar-macro' && grabadora?.grabando) {
      return {
        ok: false,
        aviso: `ya estás grabando la macro «${grabadora.nombre}»: detenla antes de grabar otra`,
        cambio: false,
      };
    }
    if (g.comando === 'parar-macro') {
      if (!grabadora?.grabando) return { ok: false, aviso: 'no estás grabando ninguna macro', cambio: false };
      // El nombre y lo grabado hasta ahora se rellenan AQUÍ, no los trae quien
      // pulsó el botón: `parar-macro` no repite lo que la grabadora ya sabe,
      // igual que Excel no vuelve a preguntar el nombre al detener.
      g = { ...g, args: { ...(g.args ?? {}), nombre: grabadora.nombre, gestos: JSON.stringify(grabadora.gestos) } };
    }

    const aviso = revisar(libro, g);
    if (aviso) return { ok: false, aviso, cambio: false };
    const suyas = celdasQueToca(libro, g);
    tocadas = tocadas === 'todo' || suyas === 'todo' ? 'todo' : [...tocadas, ...suyas];
    libro = aplicar(libro, g);
    cola[i] = g;

    if (g.comando === 'grabar-macro') {
      arrancaGrabadora = txt(g.args ?? {}, 'nombre').trim();
    } else if (g.comando === 'parar-macro' && grabadora) {
      grabadora.grabando = false;
      grabadora.nombre = '';
      grabadora.gestos = [];
    }
  }

  const cambio = libro !== motor.libro;
  if (cambio) conLibro(motor, libro, tocadas);
  if (grabadora?.grabando) grabadora.gestos.push(...cola);

  if (arrancaGrabadora !== null && grabadora) {
    grabadora.grabando = true;
    grabadora.nombre = arrancaGrabadora;
    grabadora.gestos = [];
  }

  return { ok: true, cambio };
}

/** Atajo de comodidad para el banco y las pruebas. */
export const escribirEn = (hoja: string, celda: string, crudo: string): Gesto => ({
  comando: 'escribir',
  args: { hoja, celda, crudo },
});

export { letraDeColumna };
