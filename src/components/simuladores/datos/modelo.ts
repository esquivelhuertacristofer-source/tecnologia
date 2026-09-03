/**
 * Tecnia Datos · `modelo.ts` — la base, los valores, y `NULL`.
 *
 * Este archivo no importa nada. Es el dato y sus reglas; todo lo demás está
 * encima de él.
 *
 * ── DECISIÓN 1 · La base es un dato inmutable ───────────────────────────────
 *
 * Es la misma decisión que tomó `motor-hojas`: el libro es un dato puro y el
 * motor es una caché encima. Aquí no hace falta ni la caché: `ejecutar(base,
 * sql)` devuelve **otra base** y no toca la que recibe. Sale gratis lo que la
 * decisión 4 del encargo pedía —deshacer un `DELETE` sin `WHERE`— y sale gratis
 * también que una clase pueda comparar «la base de antes» con «la de después»
 * con un `toEqual`, que es como se corrige un ejercicio de `INSERT`.
 *
 * ── DECISIÓN 2 · `NULL` es un valor, no un vacío ni un cero ─────────────────
 *
 * `NULL` se representa con `null`, que es un valor más de `Valor`, y de él
 * salen cuatro reglas que están escritas aquí y no repartidas por el motor:
 *
 * 1. **`NULL` no es igual a `NULL`.** Comparar cualquier cosa con `NULL` no da
 *    ni cierto ni falso: da «no se sabe», y aquí «no se sabe» es `null`. Por
 *    eso `comparar()` devuelve `number | null` y no un booleano.
 * 2. **`WHERE` sólo deja pasar lo que es cierto.** «No se sabe» no pasa. Ésa es
 *    la razón de que `WHERE nota = NULL` no devuelva nunca nada, que es la
 *    trampa clásica y la clase entera de `IS NULL`.
 * 3. **La lógica es de tres valores** (Kleene). `NULL AND FALSE` es `FALSE`
 *    —da igual lo que valga: falso por un lado ya basta—, pero `NULL AND TRUE`
 *    es `NULL`. Sin esto, un `NOT` delante de un `NULL` convertiría el «no se
 *    sabe» en un «sí», y la consulta contestaría lo contrario de la verdad.
 * 4. **Las cuentas ignoran los `NULL`, y `COUNT(*)` no.** Está en `motor.ts`,
 *    pero nace de aquí: `AVG` divide entre los que hay, no entre las filas. Es
 *    exactamente lo que el motor de hojas decidió con «vacío no es cero», y por
 *    lo mismo: si no, el motor enseña un promedio falso.
 *
 * ── DECISIÓN 3 · Sin `ORDER BY` el orden es el de inserción ─────────────────
 *
 * Las filas de una tabla son un array y sólo se añade al final, así que la
 * posición **es** el orden de inserción. `DELETE` filtra y `UPDATE` mapea: las
 * dos conservan la posición. `ORDER BY` ordena de forma estable encima de eso,
 * así que hasta los empates salen siempre igual. Un motor de verdad no promete
 * nada de esto (`subconjunto.ts`, desviación 1); aquí se promete porque una
 * clase que compara resultados necesita que dos ejecuciones den lo mismo.
 *
 * ── Los nombres no distinguen mayúsculas ────────────────────────────────────
 *
 * `Alumnos`, `alumnos` y `ALUMNOS` son la misma tabla, como en cualquier motor.
 * Se guarda el nombre tal como se escribió —es lo que enseña el árbol de
 * tablas— y se busca por el nombre plegado.
 */

export type TipoColumna = 'entero' | 'real' | 'texto' | 'fecha' | 'booleano';

/** Un valor de celda. `null` es `NULL`, y es un valor: lee la decisión 2. */
export type Valor = number | string | boolean | null;

export interface Columna {
  nombre: string;
  tipo: TipoColumna;
  clavePrimaria: boolean;
  noNulo: boolean;
  /** `REFERENCES otra(columna)`, o `null` si no apunta a nadie. */
  referencia: { tabla: string; columna: string } | null;
}

export interface Tabla {
  nombre: string;
  columnas: Columna[];
  /** Una fila es un array de valores en el orden de `columnas`. Nunca un objeto. */
  filas: Valor[][];
}

export interface Base {
  /** En orden de creación: es el orden en que las enseña el árbol de tablas. */
  tablas: Tabla[];
}

export const BASE_VACIA: Base = { tablas: [] };

export function plegar(nombre: string): string {
  return nombre.toLowerCase();
}

export function tablaPorNombre(base: Base, nombre: string): Tabla | null {
  const p = plegar(nombre);
  return base.tablas.find((t) => plegar(t.nombre) === p) ?? null;
}

export function indiceDeColumna(tabla: Tabla, nombre: string): number {
  const p = plegar(nombre);
  return tabla.columnas.findIndex((c) => plegar(c.nombre) === p);
}

export function nombresDeTabla(base: Base): string[] {
  return base.tablas.map((t) => t.nombre);
}

/**
 * Las filas que apuntan a esta tabla, por clave foránea. Lo usan el `DELETE`
 * que no puede borrar un padre con hijos y el `UPDATE` que le cambia la clave.
 */
export function hijasDe(base: Base, nombreTabla: string): { tabla: Tabla; indice: number; columna: Columna }[] {
  const p = plegar(nombreTabla);
  const salida: { tabla: Tabla; indice: number; columna: Columna }[] = [];
  for (const t of base.tablas) {
    t.columnas.forEach((c, i) => {
      if (c.referencia && plegar(c.referencia.tabla) === p) salida.push({ tabla: t, indice: i, columna: c });
    });
  }
  return salida;
}

/* ── el esquema, que es lo que enseña el árbol de tablas ────────────────────*/

export interface ColumnaDeEsquema {
  nombre: string;
  tipo: TipoColumna;
  clavePrimaria: boolean;
  noNulo: boolean;
  referencia: { tabla: string; columna: string } | null;
}

export interface TablaDeEsquema {
  nombre: string;
  filas: number;
  columnas: ColumnaDeEsquema[];
}

/**
 * La base descrita para el `panelFijo` del armazón de código: el árbol de
 * tablas que piden las filas 70 y 87 del canon.
 *
 * Es una función aparte y no un `map` en el componente porque el panel no tiene
 * por qué saber cómo se guarda una tabla por dentro, y porque `n10-modela-tus-datos`
 * corrige mirando esto: «¿tiene tu tabla una clave primaria?» se contesta con
 * este dato, no leyendo el texto que escribió el alumno.
 */
export function esquemaDe(base: Base): TablaDeEsquema[] {
  return base.tablas.map((t) => ({
    nombre: t.nombre,
    filas: t.filas.length,
    columnas: t.columnas.map((c) => ({
      nombre: c.nombre,
      tipo: c.tipo,
      clavePrimaria: c.clavePrimaria,
      noNulo: c.noNulo,
      referencia: c.referencia,
    })),
  }));
}

/* ── los valores ────────────────────────────────────────────────────────────*/

export function esNulo(v: Valor): v is null {
  return v === null;
}

/** Cómo se llama en español el tipo de un valor, para los mensajes de error. */
export function nombreDeTipo(v: Valor): string {
  if (v === null) return 'NULL';
  if (typeof v === 'number') return 'número';
  if (typeof v === 'boolean') return 'sí/no';
  return 'texto';
}

export const NOMBRE_DE_TIPO: Readonly<Record<TipoColumna, string>> = {
  entero: 'números enteros',
  real: 'números con decimales',
  texto: 'texto',
  fecha: 'fechas',
  booleano: 'sí/no',
};

/**
 * Lo que la rejilla enseña. **`NULL` se pinta `NULL`, nunca una celda vacía**:
 * una celda vacía es exactamente la mentira que la decisión 2 evita.
 */
export function textoDeValor(v: Valor): string {
  if (v === null) return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return textoDeNumero(v);
  return v;
}

/**
 * `0.1 + 0.2` da `0.30000000000000004` en cualquier motor que use coma
 * flotante, y enseñar eso en una clase de bases de datos no es honestidad, es
 * ruido. Quince cifras significativas es lo que un `double` distingue de
 * verdad; a partir de ahí lo que hay es basura del formato binario.
 */
export function textoDeNumero(n: number): string {
  if (Number.isInteger(n)) return String(n);
  if (!Number.isFinite(n)) return String(n);
  return String(Number(n.toPrecision(15)));
}

/**
 * Comparación de dos valores.
 *
 * Devuelve `-1`, `0` o `1`; **`null` si alguno es `NULL`** —«no se sabe», la
 * regla 1 de la decisión 2—; y `INCOMPARABLE` si son de familias distintas.
 *
 * `INCOMPARABLE` es `NaN` y no un objeto a propósito: esto se llama una vez por
 * fila y por comparación, y en el criterio 3 son diez mil filas. Devolver
 * `{ok:false}` aquí serían diez mil objetos que el recolector tiene que barrer,
 * y el §46 ya dejó dicho dónde se va el tiempo en este proyecto.
 */
export const INCOMPARABLE = NaN;

export function comparar(a: Valor, b: Valor): number | null {
  if (a === null || b === null) return null;
  if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : a > b ? 1 : 0;
  if (typeof a === 'string' && typeof b === 'string') {
    /* `localeCompare` con `es` para que «ñ» y los acentos queden donde un
     * hispanohablante los busca; `numeric` para que «alumno2» no vaya después
     * de «alumno10». */
    const c = a.localeCompare(b, 'es', { numeric: true, sensitivity: 'variant' });
    return c < 0 ? -1 : c > 0 ? 1 : 0;
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : a ? 1 : -1;
  return INCOMPARABLE;
}

export function esIncomparable(c: number | null): boolean {
  return c !== null && Number.isNaN(c);
}

/**
 * El orden de `ORDER BY`, donde `NULL` **sí** tiene sitio: delante del todo al
 * subir y al final al bajar, que es lo que hace SQLite. Tenerlo repartido es lo
 * que hace que dos ejecuciones den lo mismo (decisión 3).
 */
export function ordenar(a: Valor, b: Valor): number {
  if (a === null && b === null) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  const c = comparar(a, b);
  if (c === null || Number.isNaN(c)) return rango(a) - rango(b);
  return c;
}

/** Cuando en la misma columna hay tipos distintos, un orden fijo y aburrido. */
function rango(v: Valor): number {
  if (typeof v === 'number') return 1;
  if (typeof v === 'string') return 2;
  return 3;
}

/* ── lógica de tres valores ─────────────────────────────────────────────────*/

export type Logico = boolean | null;

export function y(a: Logico, b: Logico): Logico {
  if (a === false || b === false) return false;
  if (a === null || b === null) return null;
  return true;
}

export function o(a: Logico, b: Logico): Logico {
  if (a === true || b === true) return true;
  if (a === null || b === null) return null;
  return false;
}

export function no(a: Logico): Logico {
  return a === null ? null : !a;
}

/** Lo que deja pasar un `WHERE`: sólo lo cierto. La regla 2 de la decisión 2. */
export function esCierto(v: Logico): boolean {
  return v === true;
}

/* ── fechas y patrones ──────────────────────────────────────────────────────*/

/**
 * Una fecha es un texto `AAAA-MM-DD` y nada más.
 *
 * No hay un tipo aparte porque no hace falta ninguno: escritas así, ordenarlas
 * como texto **es** ordenarlas por antigüedad, y compararlas como texto es
 * compararlas de verdad. Lo que sí hay es esta comprobación en el `INSERT`, que
 * es donde un `03/05/2010` tiene que dar un error que se entienda en vez de
 * colarse y desordenar la tabla para siempre.
 */
export function esFechaValida(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1) return false;
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  return d.getUTCFullYear() === anio && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

/**
 * `LIKE 'A%'` → expresión regular. `%` es «lo que sea» y `_` es «un carácter».
 *
 * Sin distinguir mayúsculas, como SQLite. Sí distingue acentos: «Ángel» y
 * «Angel» son distintos, que es lo que pasa también en un motor de verdad y lo
 * que hace que un catálogo mal capturado se note.
 */
export function patronDeLike(patron: string): RegExp {
  let re = '';
  for (const c of patron) {
    if (c === '%') re += '[\\s\\S]*';
    else if (c === '_') re += '[\\s\\S]';
    else re += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`, 'i');
}
