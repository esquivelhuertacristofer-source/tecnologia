/**
 * Tecnia Hojas · `dinamica.ts` — la tabla dinámica (bloques 49 y 50).
 *
 * La pieza cara del grado Avanzado, y la equivalente de lo que fue el evaluador
 * de fórmulas para el Básico: si esto no aguanta, los dos bloques no se pueden
 * dar. Aquí está el motor y nada más — no hay pantalla, no hay clase, no hay un
 * solo `<div>`. Lo que hay es la respuesta medida a tres preguntas:
 *
 *   1. ¿Resume de verdad? 500 filas de origen, una dinámica de 5×4, comprobada
 *      celda a celda contra una cuenta hecha por otro camino.
 *   2. ¿Se actualiza al pedirlo, y **sólo** al pedirlo?
 *   3. ¿Aguanta? El libro grande, por debajo de 50 ms.
 *
 * ── (1) LA HOJA GUARDA EL RESUMEN QUE PEDISTE, NO EL QUE SALIÓ ──────────────
 *
 * Está razonado en `modelo.ts`, junto a `Dinamica`, y aquí es donde muerde:
 * **las celdas de una dinámica no están en `Hoja.celdas`**. Se pintan del cruce
 * entre la especificación y los datos de origen, igual que el valor de `=B2*C2`
 * se calcula y no se guarda. De ahí salen las tres consecuencias del encargo, y
 * las tres son material de clase antes que decisiones técnicas:
 *
 *   - **la región es de sólo lectura** — no hay dónde escribir, porque esas
 *     celdas no existen en el libro (`zonasDeSoloLectura`, y la guarda que la
 *     usa vive en el `revisar()` de `comandos.ts`);
 *   - **actualizar es explícito** — ver el apartado siguiente, que es el que
 *     tiene truco;
 *   - **el origen necesita encabezados** o no hay campos que arrastrar
 *     (`motivoDelOrigen`).
 *
 * ── (2) POR QUÉ NO SE REPINTA SOLA: LA CACHÉ DE LA DINÁMICA ─────────────────
 *
 * Una dinámica que se recalculara sola al teclear en el origen sería más fácil
 * de escribir y **sería otro programa**. En Excel de verdad una dinámica no lee
 * la hoja: lee su *caché*, una copia de los datos tomada la última vez que se
 * actualizó, y por eso hay un botón de Actualizar. El alumno llega al bloque 49
 * desde veinte bloques donde todo se arrastraba solo, y esta es la primera vez
 * que algo no lo hace: es la clase, no un atajo.
 *
 * Aquí la caché es `PINTADAS`, un `WeakMap` con la **identidad del objeto
 * `Dinamica`** como llave. No es un truco: es cómo funciona ya este motor.
 * `motor.rangos` usa exactamente lo mismo —el nodo del árbol como llave— y el
 * libro es inmutable con estructura compartida, así que:
 *
 *   - escribir en una celda del origen crea un libro nuevo y una hoja nueva,
 *     pero **el mismo objeto `Dinamica`** (la lista `dinamicas` viaja por
 *     referencia en el `{...hoja}`) ⇒ la caché acierta y la dinámica sigue
 *     enseñando lo viejo. Que es la mitad de la lección;
 *   - `actualizar-dinamica` sustituye la `Dinamica` por otra estructuralmente
 *     idéntica pero **objeto nuevo** ⇒ la caché falla y se vuelve a construir
 *     con los datos de ahora;
 *   - cambiar un campo también fabrica un objeto nuevo ⇒ se repinta, que es lo
 *     que hace Excel al arrastrar un campo;
 *   - un libro recién abierto trae objetos nuevos ⇒ se construye la primera vez
 *     que alguien la mira, que es lo que hace Excel al abrir el archivo.
 *
 * Y como la caché vive **fuera del libro**, el libro sigue sin guardar ni un
 * número calculado: `actualizar-dinamica` deja un libro que un `toEqual` no
 * distingue del anterior. Actualizar no cambia el dato; cambia lo que la hoja
 * enseña.
 *
 * ── (3) DÓNDE SE VA EL TIEMPO, MEDIDO ──────────────────────────────────────
 *
 * El cruce entero se hace en **una pasada por el origen**: cada fila se suma a
 * todos sus antepasados de los dos ejes a la vez —de ahí salen los subtotales y
 * el total general sin volver a mirar el origen—, y los acumuladores son
 * `Float64Array`/`Int32Array` planos, no objetos. La lección de §46 estaba
 * escrita antes de empezar: lo caro no fue el algoritmo, fue construir cadenas
 * de texto; así que aquí no se fabrica ni una clave de texto por celda cruzada.
 *
 * ── Lo que se deja fuera a propósito ───────────────────────────────────────
 *
 * - **El orden de las etiquetas es alfabético**, siempre. Los meses salen
 *   «abril, enero, febrero, marzo» y **eso es correcto**: es lo que hace Excel
 *   con texto suelto y es la clase entera del bloque 50 (la salida de verdad es
 *   agrupar por fecha, que pide un campo que la forma de `Dinamica` no tiene).
 *   No hay ninguna lista de meses escondida en este archivo.
 * - **Un hueco es vacío, no cero.** Si ninguna fila del origen cae en un cruce,
 *   la celda no vale `0`: no vale nada. Un cero diría «se gastaron 0 pesos» y un
 *   vacío dice «no hubo», y son cosas distintas desde el bloque 15.
 * - **Las filas escondidas del origen SÍ cuentan.** Al revés que la fila de
 *   totales de una tabla (`totalDeColumna`, que es un SUBTOTALES y sólo mira lo
 *   visible), una dinámica resume el origen entero. Es lo que hace Excel y es el
 *   contraste que la clase necesita: para quitar filas de una dinámica se usa su
 *   propio filtro (`Dinamica.filtros`), no el de la hoja.
 * - **Agrupar por intervalos** (fechas por mes, números por tramos) pediría un
 *   campo nuevo en `Dinamica` y la forma está fijada. Queda anotado.
 */

import {
  aTexto,
  clave,
  comparar,
  crudoEn,
  dir,
  dirAColFila,
  hojaDe,
  hojaPorNombre,
  letraDeColumna,
  partirClave,
  type Dinamica,
  type Libro,
  type ResumenDeColumna,
  type Valor,
} from './modelo';
import { valorDeClave, valorDeTextoCrudo, TOPE_DE_RANGO, type Motor } from './formula/calculo';
/*
 * **Sólo el tipo**, y por la misma razón que `comandos.ts` se trae sólo tipos de
 * `impresion.ts`: la dependencia de verdad va en el otro sentido —`comandos.ts`
 * importa de aquí los cuatro comandos y la lista de zonas de sólo lectura—, y un
 * `import type` se borra al compilar, así que no cierra ningún círculo. Traerse
 * de allí un valor (`cajaDeTexto`, `seSolapan`) sí lo cerraría, y un círculo
 * entre dos módulos no falla al compilar: falla al arrancar.
 */
import type { Caja } from './comandos';

/* ── leer el origen ─────────────────────────────────────────────────────────*/

/** El origen ya resuelto: la hoja por su `id` y la caja normalizada. */
export interface Origen extends Caja {
  hoja: string;
}

/**
 * `"Datos!A1:F500"` → la hoja y la caja. `null` si no se puede leer.
 *
 * Admite el nombre de hoja entre comillas simples (`'Grupo A'!A1:C9`), que es
 * como lo escribe `textoDeRef` cuando el nombre lleva un espacio, y admite que
 * no haya hoja: entonces es la de la propia dinámica.
 */
export function partirOrigen(libro: Libro, origen: string, hojaPorDefecto: string): Origen | null {
  const t = origen.trim();
  const corte = t.lastIndexOf('!');
  let hoja = hojaPorDefecto;
  let rango = t;
  if (corte >= 0) {
    let nombre = t.slice(0, corte).trim();
    if (nombre.length >= 2 && nombre.startsWith("'") && nombre.endsWith("'")) {
      nombre = nombre.slice(1, -1).replace(/''/g, "'");
    }
    const h = hojaPorNombre(libro, nombre);
    if (!h) return null;
    hoja = h.id;
    rango = t.slice(corte + 1);
  }
  if (!hojaDe(libro, hoja)) return null;
  const [a, b] = rango.split(':');
  const p = dirAColFila(a ?? '');
  const q = dirAColFila(b ?? a ?? '');
  if (!p || !q) return null;
  return {
    hoja,
    c0: Math.min(p.col, q.col),
    f0: Math.min(p.fila, q.fila),
    c1: Math.max(p.col, q.col),
    f1: Math.max(p.fila, q.fila),
  };
}

/**
 * Lo que Excel diría antes de aceptar este origen. `null` = adelante.
 *
 * Las tres frases son las de «jugar mal a propósito»: un rango que no se lee, un
 * origen que es sólo la fila de encabezados, y un encabezado con un hueco — que
 * es el que de verdad importa, porque **sin encabezados no hay campos**.
 */
export function motivoDelOrigen(libro: Libro, origen: string, hojaPorDefecto: string): string | null {
  const o = partirOrigen(libro, origen, hojaPorDefecto);
  if (!o) return `«${origen}» no es un rango del que sacar los datos`;
  if ((o.f1 - o.f0 + 1) * (o.c1 - o.c0 + 1) > TOPE_DE_RANGO) {
    return 'ese origen es demasiado grande para resumirlo de una vez';
  }
  if (o.f1 === o.f0) return 'el origen tiene sólo la fila de encabezados: no hay ninguna fila de datos que resumir';
  for (let c = o.c0; c <= o.c1; c += 1) {
    if (crudoEn(libro, o.hoja, c, o.f0).trim() === '') {
      return `al origen le falta el encabezado de la columna ${letraDeColumna(c)}: una dinámica saca sus campos de la primera fila`;
    }
  }
  return null;
}

/** Cuántos campos tiene el origen; `0` si no se puede leer. */
export function camposDelOrigen(libro: Libro, din: Dinamica, hojaPorDefecto: string): number {
  const o = partirOrigen(libro, din.origen, hojaPorDefecto);
  return o ? o.c1 - o.c0 + 1 : 0;
}

/* ── los dos lectores ───────────────────────────────────────────────────────*/

/**
 * De dónde salen los valores del origen.
 *
 * Hay dos, y la diferencia entre ellos es **una línea** y está aquí a la vista:
 *
 * - `lectorDeMotor` lee la caché del motor, o sea el valor CALCULADO. Es el que
 *   construye la dinámica de verdad, y es imprescindible: la columna «Importe»
 *   de una hoja de clase es `=B2*C2`, no un número escrito.
 * - `lectorDeLibro` lee el crudo, sin motor. Es el que usa la guarda de sólo
 *   lectura, que corre dentro de `revisar(libro, gesto)` y ahí no hay motor
 *   ninguno. Coincide con el otro celda a celda **salvo en una celda con
 *   fórmula**, donde devuelve el texto de la fórmula.
 *
 * Que la diferencia no muerda no es suerte: la guarda sólo necesita el
 * ESQUELETO —las etiquetas de los ejes—, y un campo que se arrastra a filas o a
 * columnas es una categoría («Región», «Mes»), no una cuenta. Una etiqueta
 * calculada por fórmula es el único caso en el que la región vigilada podría
 * quedarse a una fila de la pintada, y queda anotado aquí en vez de escondido.
 */
export type Lector = (hoja: string, col: number, fila: number) => Valor;

export const lectorDeMotor =
  (motor: Motor): Lector =>
  (h, c, f) =>
    valorDeClave(motor, clave(h, c, f));

export const lectorDeLibro =
  (libro: Libro): Lector =>
  (h, c, f) => {
    const crudo = hojaDe(libro, h)?.celdas[dir(c, f)]?.crudo ?? '';
    return crudo === '' ? null : valorDeTextoCrudo(crudo);
  };

/* ── lo que sale de construirla ─────────────────────────────────────────────*/

/**
 * Qué es cada celda pintada, para que quien dibuje no tenga que adivinarlo.
 *
 * `total` es tanto el total general como un SUBTOTAL de un campo anidado: los
 * dos se pintan igual y los dos son «una cuenta de un grupo», no un dato.
 */
export type RolDeCelda = 'titulo' | 'cabecera' | 'etiqueta' | 'dato' | 'total' | 'vacio';

/** Una etiqueta de eje, ya ordenada. `profundidad: 0` es el total general. */
export interface EtiquetaDeEje {
  texto: string;
  /** 1 el primer campo, 2 el anidado dentro de él… 0 el total general. */
  profundidad: number;
  /** Su celda es un subtotal (tiene grupos debajo) y no un dato suelto. */
  resume: boolean;
}

/**
 * Una dinámica pintada: el rectángulo entero, en fila-mayor.
 *
 * `celdas` son `Valor`, no cadenas: un hueco es `null` —vacío de verdad, el del
 * bloque 15— y un número es un número, con lo que quien pinte le puede aplicar
 * el formato de la hoja sin volver a analizar nada.
 */
export interface Construida {
  id: string;
  /** La hoja donde se pinta: la del ancla. */
  hoja: string;
  region: Caja;
  ancho: number;
  alto: number;
  /** Cuántas filas de arriba son cabecera. Las de datos empiezan justo después. */
  cabeceras: number;
  filas: EtiquetaDeEje[];
  columnas: EtiquetaDeEje[];
  celdas: Valor[];
  roles: RolDeCelda[];
  /** Cuántas filas del origen entraron, ya filtradas. */
  origenFilas: number;
  /** Lo que costó, en ms. Medir, no adivinar. */
  ms: number;
}

/** El valor pintado en una celda de la hoja; `undefined` si cae fuera. */
export function valorPintado(c: Construida, col: number, fila: number): Valor | undefined {
  const i = indiceEn(c, col, fila);
  return i < 0 ? undefined : c.celdas[i];
}

/** Qué es esa celda. `undefined` si cae fuera de la dinámica. */
export function rolPintado(c: Construida, col: number, fila: number): RolDeCelda | undefined {
  const i = indiceEn(c, col, fila);
  return i < 0 ? undefined : c.roles[i];
}

function indiceEn(c: Construida, col: number, fila: number): number {
  const dc = col - c.region.c0;
  const df = fila - c.region.f0;
  if (dc < 0 || df < 0 || dc >= c.ancho || df >= c.alto) return -1;
  return df * c.ancho + dc;
}

/* ── el árbol de un eje ─────────────────────────────────────────────────────*/

interface Nodo {
  etiqueta: string;
  /** El valor tal cual, que es con lo que se ordena: `2024` antes que `Enero`. */
  valor: Valor;
  padre: Nodo | null;
  hijos: Map<string, Nodo> | null;
  profundidad: number;
  indice: number;
}

const nuevoNodo = (etiqueta: string, valor: Valor, padre: Nodo | null, profundidad: number): Nodo => ({
  etiqueta,
  valor,
  padre,
  hijos: null,
  profundidad,
  indice: -1,
});

/**
 * Cómo se llama una etiqueta.
 *
 * Una celda vacía en un campo de fila **no se descarta**: se agrupa bajo
 * `(en blanco)`, como en Excel. Es lo honesto —esas filas existen y su importe
 * cuenta— y de paso deja a la vista la diferencia con un hueco del cruce, que es
 * otra cosa: `(en blanco)` es «hay filas sin categoría», un hueco es «no hay
 * filas».
 */
const EN_BLANCO = '(en blanco)';
const etiquetaDe = (v: Valor): string => (v === null || v === '' ? EN_BLANCO : aTexto(v));

/**
 * Alfabético, y punto. Se compara con `comparar()` de `modelo.ts` —la única
 * regla de comparación de esta sala— así que los números van antes que el texto
 * y el texto no distingue mayúsculas, igual que en `=A1=B1`.
 */
function porEtiqueta(a: Nodo, b: Nodo): number {
  const c = comparar(a.valor, b.valor);
  if (typeof c === 'number') return c;
  return a.etiqueta < b.etiqueta ? -1 : a.etiqueta > b.etiqueta ? 1 : 0;
}

function hijosOrdenados(n: Nodo): Nodo[] {
  return n.hijos ? [...n.hijos.values()].sort(porEtiqueta) : [];
}

function bajar(n: Nodo, etiqueta: string, valor: Valor): Nodo {
  if (!n.hijos) n.hijos = new Map();
  const y = n.hijos.get(etiqueta);
  if (y) return y;
  const nuevo = nuevoNodo(etiqueta, valor, n, n.profundidad + 1);
  n.hijos.set(etiqueta, nuevo);
  return nuevo;
}

/**
 * El eje de FILAS, aplanado: cada nodo es una fila pintada.
 *
 * En **preorden** —el padre y debajo sus hijos— porque así es como Excel pinta
 * la forma compacta: «Norte» con su subtotal a la derecha y debajo sus meses.
 * El total general va al final de todo.
 */
function enOrdenDeFila(raiz: Nodo): Nodo[] {
  const fuera: Nodo[] = [];
  const meter = (n: Nodo): void => {
    fuera.push(n);
    for (const h of hijosOrdenados(n)) meter(h);
  };
  for (const h of hijosOrdenados(raiz)) meter(h);
  fuera.push(raiz);
  return fuera;
}

/**
 * El eje de COLUMNAS, aplanado: cada nodo es un grupo de columnas.
 *
 * En **postorden**, que no es un capricho ni una asimetría gratuita: en el eje
 * horizontal Excel pone la columna de subtotal **a la derecha** de las que
 * resume («Enero, Febrero, Total Trimestre»), mientras que en el vertical la
 * pone arriba. Con el postorden entero, la raíz —el total general— cae sola en
 * su sitio, la última.
 */
function enOrdenDeColumna(raiz: Nodo): Nodo[] {
  const fuera: Nodo[] = [];
  const meter = (n: Nodo): void => {
    for (const h of hijosOrdenados(n)) meter(h);
    fuera.push(n);
  };
  meter(raiz);
  return fuera;
}

const etiquetaDeEje = (n: Nodo): EtiquetaDeEje => ({
  texto: n.profundidad === 0 ? 'Total general' : n.etiqueta,
  profundidad: n.profundidad,
  resume: n.hijos !== null || n.profundidad === 0,
});

/* ── construir ──────────────────────────────────────────────────────────────*/

const PALABRA: Record<ResumenDeColumna, string> = {
  suma: 'Suma',
  promedio: 'Promedio',
  cuenta: 'Cuenta',
  max: 'Máx',
  min: 'Mín',
  ninguno: 'Sin resumen',
};

/**
 * La dinámica, construida desde cero con los datos que haya AHORA MISMO.
 *
 * No mira la caché y no la llena: quien quiera la de la pantalla llama a
 * `dinamicaPintada`. Ésta existe para actualizar, para medir y para que una
 * prueba pueda comparar «lo que enseña» con «lo que saldría de construirla otra
 * vez», que es la misma cifra que decide en el verificador de fórmulas.
 */
export function construirDinamica(motor: Motor, din: Dinamica): Construida | null {
  return construir(motor.libro, din, lectorDeMotor(motor), false);
}

/** El esqueleto: sólo los ejes y el tamaño, sin sumar ni un número. */
export function esqueletoDeDinamica(libro: Libro, din: Dinamica): Construida | null {
  return construir(libro, din, lectorDeLibro(libro), true);
}

function construir(libro: Libro, din: Dinamica, lee: Lector, soloEsqueleto: boolean): Construida | null {
  const t0 = performance.now();
  const donde = partirClave(din.ancla);
  if (!donde || !hojaDe(libro, donde.hoja)) return null;
  const o = partirOrigen(libro, din.origen, donde.hoja);
  if (!o || o.f1 === o.f0) return null;
  const ancho0 = o.c1 - o.c0 + 1;

  /* Un campo que se sale del origen se cae aquí. `revisar` no deja crearlo, pero
   * un libro guardado con un origen que después se encogió es un caso real. */
  const dentro = (c: number): boolean => c >= 0 && c < ancho0;
  const campoFila = din.filas.filter(dentro);
  const campoCol = din.columnas.filter(dentro);
  const valores = (soloEsqueleto ? [] : din.valores).filter((v) => dentro(v.col) && v.resumen !== 'ninguno');
  const nv = valores.length;

  /* Los filtros, leídos UNA vez y no una por fila: es la disciplina del §46, no
   * fabricar objetos dentro del bucle que se repite quinientas mil veces. */
  const filtros: { col: number; lista: string[] }[] = [];
  for (const [k, lista] of Object.entries(din.filtros ?? {})) {
    const c = Number(k);
    if (dentro(c) && lista && lista.length) filtros.push({ col: c, lista });
  }

  const raizFila = nuevoNodo('Total general', null, null, 0);
  const raizCol = nuevoNodo('Total general', null, null, 0);
  const deFila: Nodo[] = [];
  const deCol: Nodo[] = [];
  const datos: Valor[] = [];

  /* ── una sola pasada por el origen ───────────────────────────────────────*/
  for (let f = o.f0 + 1; f <= o.f1; f += 1) {
    let pasa = true;
    for (let i = 0; i < filtros.length; i += 1) {
      if (!filtros[i].lista.includes(etiquetaDe(lee(o.hoja, o.c0 + filtros[i].col, f)))) {
        pasa = false;
        break;
      }
    }
    if (!pasa) continue;

    let nf = raizFila;
    for (let i = 0; i < campoFila.length; i += 1) {
      const v = lee(o.hoja, o.c0 + campoFila[i], f);
      nf = bajar(nf, etiquetaDe(v), v);
    }
    let nc = raizCol;
    for (let i = 0; i < campoCol.length; i += 1) {
      const v = lee(o.hoja, o.c0 + campoCol[i], f);
      nc = bajar(nc, etiquetaDe(v), v);
    }
    deFila.push(nf);
    deCol.push(nc);
    for (let i = 0; i < nv; i += 1) datos.push(lee(o.hoja, o.c0 + valores[i].col, f));
  }

  /* ── ordenar los ejes y numerarlos ───────────────────────────────────────*/
  const nodosFila = enOrdenDeFila(raizFila);
  const nodosCol = enOrdenDeColumna(raizCol);
  for (let i = 0; i < nodosFila.length; i += 1) nodosFila[i].indice = i;
  for (let i = 0; i < nodosCol.length; i += 1) nodosCol[i].indice = i;
  const nFilas = nodosFila.length;
  const nCols = nodosCol.length;

  /* ── el cruce: cada fila del origen cae en todos sus antepasados ─────────
   *
   * De aquí salen los subtotales y el total general **sin volver a mirar el
   * origen**: la fila «Norte · Enero · 900» se suma en Norte·Enero, en
   * Norte·(total), en (total)·Enero y en (total)·(total). Es (nf+1)·(nc+1)
   * sumas por fila, no una pasada por cada subtotal.
   *
   * Acumuladores planos y tipados, no objetos: son seis arrays y una
   * multiplicación, y no hay ni una cadena de texto de por medio. */
  const n = nFilas * nCols * nv;
  const tocado = new Uint8Array(n);
  const suma = new Float64Array(n);
  const cuantos = new Int32Array(n);
  const noVacias = new Int32Array(n);
  const mayor = new Float64Array(n).fill(-Infinity);
  const menor = new Float64Array(n).fill(Infinity);

  for (let i = 0; i < deFila.length; i += 1) {
    for (let nf: Nodo | null = deFila[i]; nf; nf = nf.padre) {
      const base = nf.indice * nCols;
      for (let nc: Nodo | null = deCol[i]; nc; nc = nc.padre) {
        const celda = (base + nc.indice) * nv;
        for (let v = 0; v < nv; v += 1) {
          const j = celda + v;
          tocado[j] = 1;
          const x = datos[i * nv + v];
          if (x === null) continue;
          noVacias[j] += 1;
          if (typeof x === 'number') {
            suma[j] += x;
            cuantos[j] += 1;
            if (x > mayor[j]) mayor[j] = x;
            if (x < menor[j]) menor[j] = x;
          }
        }
      }
    }
  }

  /**
   * Lo que enseña una celda cruzada.
   *
   * Dos reglas, y las dos vienen de más arriba en el motor:
   *
   * - **Sin ninguna fila que caiga aquí, la celda está vacía** (`null`), no vale
   *   cero. Es la decisión 3 de `modelo.ts` en el sitio donde más se nota.
   * - Con filas pero sin números, se contesta como la fila de totales de una
   *   tabla (`totalDeColumna`): `suma` da 0 —sumar una columna de texto da cero,
   *   como en Excel— y `promedio`, `max` y `min` no dan nada.
   */
  const resumir = (j: number, resumen: ResumenDeColumna): Valor => {
    if (!tocado[j]) return null;
    if (resumen === 'cuenta') return noVacias[j];
    if (resumen === 'suma') return suma[j];
    if (cuantos[j] === 0) return null;
    if (resumen === 'promedio') return suma[j] / cuantos[j];
    if (resumen === 'max') return mayor[j];
    if (resumen === 'min') return menor[j];
    return null;
  };

  /* ── pintar el rectángulo ────────────────────────────────────────────────*/
  const nombreDeCampo = (campo: number): string => aTexto(lee(o.hoja, o.c0 + campo, o.f0));
  const nombreDelValor = (i: number): string => `${PALABRA[valores[i].resumen]} de ${nombreDeCampo(valores[i].col)}`;

  const hayColumnas = nv > 0 && campoCol.length > 0;
  const cabeceras = nv === 0 ? 1 : !hayColumnas ? 1 : nv > 1 ? 3 : 2;
  const anchoTotal = 1 + (nv === 0 ? 0 : nCols * nv);
  const altoTotal = cabeceras + nFilas;
  const celdas: Valor[] = new Array(anchoTotal * altoTotal).fill(null);
  const roles: RolDeCelda[] = new Array(anchoTotal * altoTotal).fill('vacio');
  const pon = (c: number, f: number, v: Valor, rol: RolDeCelda): void => {
    celdas[f * anchoTotal + c] = v;
    roles[f * anchoTotal + c] = rol;
  };

  if (!hayColumnas) {
    // Sin campos de columna, las únicas columnas son los valores, y ya son el
    // total: no hay una columna «Total general» que añadir.
    pon(0, 0, 'Etiquetas de fila', 'cabecera');
    for (let v = 0; v < nv; v += 1) pon(1 + v, 0, nombreDelValor(v), 'cabecera');
  } else {
    pon(0, 0, nv === 1 ? nombreDelValor(0) : 'Valores', 'titulo');
    pon(1, 0, 'Etiquetas de columna', 'cabecera');
    for (let c = 0; c < nCols; c += 1) {
      pon(1 + c * nv, 1, nodosCol[c].profundidad === 0 ? 'Total general' : nodosCol[c].etiqueta, 'cabecera');
    }
    if (nv > 1) {
      pon(0, 2, 'Etiquetas de fila', 'cabecera');
      for (let c = 0; c < nCols; c += 1) for (let v = 0; v < nv; v += 1) pon(1 + c * nv + v, 2, nombreDelValor(v), 'cabecera');
    } else {
      pon(0, 1, 'Etiquetas de fila', 'cabecera');
    }
  }

  for (let r = 0; r < nFilas; r += 1) {
    const nodo = nodosFila[r];
    const f = cabeceras + r;
    const esTotal = nodo.profundidad === 0;
    pon(0, f, esTotal ? 'Total general' : nodo.etiqueta, esTotal ? 'total' : 'etiqueta');
    for (let c = 0; c < nCols; c += 1) {
      /*
       * `total` es «esta celda es una cuenta de un grupo». Con campos de
       * columna, la raíz del eje horizontal ES el total general y cuenta; SIN
       * campos de columna la única columna es el valor y **no** es un total de
       * nada horizontalmente, así que una celda de una fila hoja es un dato
       * normal y corriente. Sin esta distinción, una dinámica de un solo campo
       * saldría entera pintada de subtotales.
       */
      const columnaResume = campoCol.length > 0 && (nodosCol[c].profundidad === 0 || nodosCol[c].hijos !== null);
      const resume = esTotal || nodo.hijos !== null || columnaResume;
      for (let v = 0; v < nv; v += 1) {
        pon(1 + c * nv + v, f, resumir((r * nCols + c) * nv + v, valores[v].resumen), resume ? 'total' : 'dato');
      }
    }
  }

  return {
    id: din.id,
    hoja: donde.hoja,
    region: {
      c0: donde.col,
      f0: donde.fila,
      c1: donde.col + anchoTotal - 1,
      f1: donde.fila + altoTotal - 1,
    },
    ancho: anchoTotal,
    alto: altoTotal,
    cabeceras,
    filas: nodosFila.map(etiquetaDeEje),
    columnas: nodosCol.map(etiquetaDeEje),
    celdas,
    roles,
    origenFilas: deFila.length,
    ms: performance.now() - t0,
  };
}

/* ── la caché: por qué no se repinta sola ───────────────────────────────────*/

/**
 * Lo que la hoja está enseñando ahora mismo, por dinámica.
 *
 * `WeakMap` con el objeto `Dinamica` de llave — la explicación entera está en la
 * cabecera del archivo, apartado (2). Es débil porque un libro viejo (un
 * deshacer, una macro reproducida sobre una copia) tiene que poder irse solo sin
 * dejar aquí su dinámica pintada.
 */
const PINTADAS = new WeakMap<Dinamica, Construida>();

/**
 * La dinámica tal como se ve: de la caché si ya se construyó, y si no,
 * construida ahora y guardada.
 *
 * Teclear en el origen NO pasa por aquí, así que sigue enseñando lo de antes
 * hasta que alguien pulse Actualizar. Es la mitad de la clase 49.
 */
export function dinamicaPintada(motor: Motor, din: Dinamica): Construida | null {
  const ya = PINTADAS.get(din);
  if (ya) return ya;
  const c = construirDinamica(motor, din);
  if (c) PINTADAS.set(din, c);
  return c;
}

/** La misma, buscándola por su identificador dentro de una hoja. */
export function dinamicaPintadaDe(motor: Motor, hojaId: string, id: string): Construida | null {
  const din = dinamicaDe(motor.libro, hojaId, id);
  return din ? dinamicaPintada(motor, din) : null;
}

/* ── preguntarle al libro ───────────────────────────────────────────────────*/

export function dinamicasDe(libro: Libro, hojaId: string): Dinamica[] {
  return hojaDe(libro, hojaId)?.dinamicas ?? [];
}

export function dinamicaDe(libro: Libro, hojaId: string, id: string): Dinamica | null {
  return dinamicasDe(libro, hojaId).find((d) => d.id === id) ?? null;
}

/** Todas las del libro, con la hoja donde viven. */
export function todasLasDinamicas(libro: Libro): { hoja: string; din: Dinamica }[] {
  const fuera: { hoja: string; din: Dinamica }[] = [];
  for (const h of libro.hojas) for (const din of h.dinamicas ?? []) fuera.push({ hoja: h.id, din });
  return fuera;
}

/**
 * Dónde se pinta esta dinámica, sin motor.
 *
 * Prefiere la caché —que es lo que de verdad hay en pantalla— y sólo si nunca se
 * construyó calcula el esqueleto con lo que hay en el libro. Las dos respuestas
 * coinciden salvo que el origen haya cambiado sin actualizar, y entonces la
 * buena es la de la caché: la región vigilada tiene que ser la PINTADA, no la
 * que se pintaría.
 */
export function regionDeDinamica(libro: Libro, din: Dinamica): { hoja: string; caja: Caja } | null {
  const ya = PINTADAS.get(din);
  if (ya) return { hoja: ya.hoja, caja: ya.region };
  const c = esqueletoDeDinamica(libro, din);
  return c ? { hoja: c.hoja, caja: c.region } : null;
}

/**
 * Las regiones que nadie puede escribir. Lista vacía —y barata— si el libro no
 * tiene ninguna dinámica, que es el caso de todos los demás libros del
 * repositorio.
 *
 * La guarda que la usa vive en el `revisar()` de `comandos.ts`, por la misma
 * razón que la de proteger la hoja: es el único punto por el que pasa TODO
 * gesto antes de tocar el libro, y así lo respetan también los comandos que aún
 * no se han escrito.
 */
export function zonasDeSoloLectura(libro: Libro): { hoja: string; caja: Caja; id: string }[] {
  const fuera: { hoja: string; caja: Caja; id: string }[] = [];
  for (const h of libro.hojas) {
    for (const din of h.dinamicas ?? []) {
      const r = regionDeDinamica(libro, din);
      if (r) fuera.push({ hoja: r.hoja, caja: r.caja, id: din.id });
    }
  }
  return fuera;
}

/** ¿Estas dos cajas comparten aunque sea una celda? (`seSolapan` de `comandos.ts`,
 * que no se puede importar desde aquí sin cerrar un círculo de módulos.) */
const chocan = (a: Caja, b: Caja): boolean => a.c0 <= b.c1 && b.c0 <= a.c1 && a.f0 <= b.f1 && b.f0 <= a.f1;

/**
 * Lo que Excel diría si esta dinámica se fuera a pintar encima de algo.
 *
 * Dos cosas la molestan, y las dos las dice Excel con estas mismas palabras: no
 * se puede pintar encima de otra dinámica, y no se puede pintar encima de sus
 * propios datos —que además sería morderse la cola: el origen cambiaría al
 * pintarse—.
 *
 * Se pregunta con la dinámica **como quedaría**, no como está: por eso lo llaman
 * los cuatro comandos después de construir su propia versión.
 */
export function motivoDeSolape(libro: Libro, din: Dinamica): string | null {
  const mia = regionDeDinamica(libro, din);
  if (!mia) return null;
  for (const { din: otra } of todasLasDinamicas(libro)) {
    if (otra.id === din.id) continue;
    const suya = regionDeDinamica(libro, otra);
    if (suya && suya.hoja === mia.hoja && chocan(mia.caja, suya.caja)) {
      return `esa dinámica se pintaría encima de «${otra.id}»: dos tablas dinámicas no se pueden superponer`;
    }
  }
  const o = partirOrigen(libro, din.origen, mia.hoja);
  if (o && o.hoja === mia.hoja && chocan(mia.caja, o)) {
    return 'una tabla dinámica no puede pintarse encima de sus propios datos';
  }
  return null;
}

/* ── cambiar la especificación · lo que hacen los cuatro comandos ───────────*/

export type ZonaDeCampo = 'filas' | 'columnas' | 'valores' | 'filtro' | 'fuera';

export const ZONAS: readonly ZonaDeCampo[] = ['filas', 'columnas', 'valores', 'filtro', 'fuera'];

export const esZona = (z: string): z is ZonaDeCampo => (ZONAS as readonly string[]).includes(z);

const sinEl = (lista: number[], campo: number): number[] => lista.filter((c) => c !== campo);
const conEl = (lista: number[], campo: number): number[] => (lista.includes(campo) ? lista : [...lista, campo]);

const mismos = (a: number[], b: number[]): boolean => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Arrastrar un campo a una zona. Es el panel de campos entero, en una función.
 *
 * Tres reglas, las tres de Excel:
 *
 * - **filas y columnas son excluyentes**: llevar a columnas un campo que estaba
 *   en filas lo MUEVE, no lo duplica. Un mismo campo en los dos ejes cruzaría
 *   consigo mismo y la diagonal sería la única celda con datos.
 * - **valores es independiente**: «Región» puede estar en filas y a la vez
 *   contarse en valores, que es como se hace «¿cuántas ventas por región?».
 * - **nada cambia ⇒ el mismo objeto**. Importa más de lo que parece: un objeto
 *   nuevo vacía la caché y repinta, así que un gesto que no cambia nada no
 *   puede actualizar la dinámica por la puerta de atrás.
 */
export function conCampo(
  din: Dinamica,
  campo: number,
  zona: ZonaDeCampo,
  resumen: ResumenDeColumna = 'suma',
  etiquetas: string[] = [],
): Dinamica {
  const quitar = zona === 'fuera';
  const filas = zona === 'filas' ? conEl(din.filas, campo) : zona === 'columnas' || quitar ? sinEl(din.filas, campo) : din.filas;
  const columnas =
    zona === 'columnas' ? conEl(din.columnas, campo) : zona === 'filas' || quitar ? sinEl(din.columnas, campo) : din.columnas;

  let valores = din.valores;
  if (zona === 'valores') {
    valores =
      resumen === 'ninguno'
        ? din.valores.filter((v) => v.col !== campo)
        : din.valores.some((v) => v.col === campo)
          ? din.valores.map((v) => (v.col === campo ? { col: campo, resumen } : v))
          : [...din.valores, { col: campo, resumen }];
  } else if (quitar) {
    valores = din.valores.filter((v) => v.col !== campo);
  }

  let filtros = din.filtros;
  if (zona === 'filtro' || quitar) {
    const copia = { ...din.filtros };
    if (zona === 'filtro' && etiquetas.length) copia[campo] = etiquetas;
    else delete copia[campo];
    filtros = Object.keys(copia).length ? copia : undefined;
  }

  const igual =
    mismos(filas, din.filas) &&
    mismos(columnas, din.columnas) &&
    valores.length === din.valores.length &&
    valores.every((v, i) => v.col === din.valores[i].col && v.resumen === din.valores[i].resumen) &&
    mismoFiltro(filtros, din.filtros);
  if (igual) return din;

  const fuera: Dinamica = { ...din, filas, columnas, valores };
  if (filtros) fuera.filtros = filtros;
  else delete fuera.filtros;
  return fuera;
}

function mismoFiltro(a: Record<number, string[]> | undefined, b: Record<number, string[]> | undefined): boolean {
  const ka = Object.keys(a ?? {});
  const kb = Object.keys(b ?? {});
  if (ka.length !== kb.length) return false;
  return ka.every((k) => {
    const x = a?.[Number(k)] ?? [];
    const y = b?.[Number(k)] ?? [];
    return x.length === y.length && x.every((v, i) => v === y[i]);
  });
}

/** En qué eje vive un campo. `null` si no está en ninguno. */
export function ejeDelCampo(din: Dinamica, campo: number): 'filas' | 'columnas' | null {
  if (din.filas.includes(campo)) return 'filas';
  if (din.columnas.includes(campo)) return 'columnas';
  return null;
}

/**
 * Anidar un campo dentro de otro: el bloque 50 en una línea.
 *
 * El orden de los campos de un eje **es** el anidamiento: el segundo se abre
 * dentro del primero. Así que «agrupa el mes dentro de la región» es colocar el
 * mes justo detrás de la región en el eje donde viva la región, y «al revés» es
 * el mismo gesto con los dos campos cambiados de sitio — que es exactamente la
 * pregunta de la clase: la misma tabla contada de dos maneras.
 *
 * `dentroDe` negativo lleva el campo al primer nivel del eje donde ya esté.
 */
export function anidado(din: Dinamica, campo: number, dentroDe: number): Dinamica {
  const eje = dentroDe < 0 ? ejeDelCampo(din, campo) : ejeDelCampo(din, dentroDe);
  if (eje === null || campo === dentroDe) return din;
  const otro = eje === 'filas' ? 'columnas' : 'filas';
  const lista = sinEl(din[eje], campo);
  const donde = dentroDe < 0 ? 0 : lista.indexOf(dentroDe) + 1;
  lista.splice(donde, 0, campo);
  const fuera: Dinamica = { ...din, [eje]: lista, [otro]: sinEl(din[otro], campo) };
  return mismos(fuera.filas, din.filas) && mismos(fuera.columnas, din.columnas) ? din : fuera;
}

/**
 * Actualizar: **el mismo dato, otro objeto**.
 *
 * Ahí está toda la clase. El libro que queda es indistinguible del anterior con
 * un `toEqual` —no se ha guardado ni un número—, pero la caché de la dinámica ya
 * no lo reconoce y la próxima vez que alguien la mire se construirá con los
 * datos de ahora. Actualizar no cambia el dato: cambia lo que la hoja enseña.
 */
export const refrescada = (din: Dinamica): Dinamica => ({ ...din });

/** Cambia la lista de dinámicas de una hoja. Lista vacía ⇒ se quita la clave. */
export function conDinamicas(libro: Libro, hojaId: string, dinamicas: Dinamica[]): Libro {
  const h = hojaDe(libro, hojaId);
  if (!h) return libro;
  const hoja = { ...h };
  if (dinamicas.length) hoja.dinamicas = dinamicas;
  else delete hoja.dinamicas;
  return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? hoja : x)) };
}

/** Cambia UNA dinámica y deja las demás como el mismo objeto. Como `conTabla`. */
export function conDinamica(libro: Libro, hojaId: string, id: string, cambiar: (d: Dinamica) => Dinamica): Libro {
  const antes = dinamicasDe(libro, hojaId);
  const ahora = antes.map((d) => (d.id === id ? cambiar(d) : d));
  if (antes.every((d, i) => d === ahora[i])) return libro;
  return conDinamicas(libro, hojaId, ahora);
}
