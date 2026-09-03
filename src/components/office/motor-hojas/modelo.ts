/**
 * Tecnia Hojas · el modelo. Ref, Rango, Celda, Hoja, Libro y Valor.
 *
 * Es el primer archivo de la sala de Excel (§45), y se escribe antes que nada
 * porque aquí viven cuatro decisiones que después no se pueden deshacer. Las
 * cuatro están razonadas en el §45.4 y en el §45.6; se dejan escritas aquí
 * porque el que abra este archivo dentro de seis meses no va a tener el
 * documento delante.
 *
 * ── (1) LA CELDA GUARDA LA REGLA, NO EL RESULTADO ───────────────────────────
 *
 * `Celda` tiene `crudo` y `formato`, y **no tiene valor**. Una celda con
 * `=B2*C2` no contiene `450`: contiene la instrucción de calcular 450 cada vez.
 * El valor vive fuera, en la caché del motor (`formula/calculo.ts`), y por eso
 * el verificador puede preguntar «¿lo que enseña la caché es lo que sale de
 * recalcular desde cero?» — que es la cifra que decide si todo lo demás es
 * verdad. Si el valor viviera dentro de la celda, esa pregunta no se podría
 * hacer, porque no habría dos cosas que comparar.
 *
 * Es *lo que se deriva no se escribe* convertido en estructura de datos.
 *
 * ── (2) EL ERROR ES UN VALOR, NO UNA EXCEPCIÓN ──────────────────────────────
 *
 * `#¡DIV/0!` no es un fallo del programa: es un valor que la hoja enseña y que
 * la clase 47 explica (§45.4). Por eso `Valor` incluye `ValorError` y **nada de
 * este motor lanza** al evaluar. Si los errores fueran excepciones:
 *
 *   - una sola celda mal escrita reventaría el recálculo entero, y
 *   - `SI.ERROR` (bloque 48) no se podría construir, porque no hay nada que
 *     atrapar cuando lo que se necesita es *mirar* el error y decidir.
 *
 * Es la misma familia de decisión que «los comandos son datos» (§45.6): una
 * elección de modelo, tomada antes del primer archivo, que convierte una clase
 * imposible en una clase barata.
 *
 * ── (3) EL VACÍO NO ES CERO ─────────────────────────────────────────────────
 *
 * `null` es una celda vacía y es un valor distinto de `0`. No es una sutileza
 * de implementación: **es el bloque 15 del temario**, y `CONTAR` frente a
 * `CONTARA` es exactamente esa diferencia. Un motor que rellene los huecos con
 * cero se lleva por delante una clase del grado Básico.
 *
 * ── (4) LA CLAVE LLEVA LA HOJA DESDE EL PRIMER DÍA ──────────────────────────
 *
 * El grafo de dependencias se indexa por `"h1!A1"`, no por `"A1"`. Hoy no hay
 * más que una hoja en el banco, pero el bloque 16 (varias hojas) es de grado
 * Básico y el 53 (consolidar y referenciar otro libro) es de Avanzado. Un grafo
 * de una sola hoja es media hora de trabajo hoy y una reescritura del motor
 * cuando llegue la clase. Lo mismo que la lección de §45.6, más barato.
 *
 * ── Convenios menores, para no tener que adivinarlos ────────────────────────
 *
 * - `col` y `fila` son **enteros desde 0**: `A1` es `{col: 0, fila: 0}`. La
 *   pantalla suma uno a la fila y traduce la columna a letras. Se hace así
 *   porque todo lo que de verdad duele —desplazar referencias al copiar, al
 *   insertar filas, al rellenar— es aritmética de desplazamientos, y con base 1
 *   se equivoca uno de tanto en tanto por un puesto.
 * - El tamaño de la rejilla es el de Excel de verdad: 16 384 × 1 048 576. Sirve
 *   para saber cuándo una referencia se sale y hay que dar `#¡REF!`.
 */

/*
 * Los dos `import` de este archivo, y **los dos se borran al compilar**.
 *
 * `modelo.ts` es la raíz de la sala: no depende de nadie, y así tiene que
 * seguir. Un `import type` no es una dependencia — TypeScript lo quita entero al
 * generar el JavaScript—, así que la configuración de página puede vivir donde se
 * usa (`impresion.ts`, con su papel, sus márgenes y su reparto) sin que este
 * archivo pase a cargar aquél en tiempo de ejecución. Al revés sería lo malo:
 * meter aquí las pulgadas de una hoja Carta.
 *
 * El segundo llegó el 15-ago-2026 con `Libro.macros` (bloques 55 y 56, §45.6):
 * una macro es una lista de `Gesto`, y `Gesto` vive en `comandos.ts` — el
 * archivo que SÍ depende de éste, en el sentido normal. El círculo que parece
 * cerrarse no se cierra: `comandos.ts` importa de aquí valores de verdad
 * (`conCelda`, `hojaDe`…) y aquí sólo se importa el TIPO de vuelta, que se
 * borra antes de que exista un programa que pudiera dar vueltas.
 */
import type { ConfigGuardada } from './impresion';
import type { Gesto } from './comandos';

/* ── los valores ────────────────────────────────────────────────────────────*/

/**
 * Los códigos de error de Excel en español, tal cual los enseña la celda.
 *
 * No se inventa ninguno. En particular **no existe un `#¡CIRC!`**: cuando hay
 * una referencia circular, Excel no pinta un error en la celda —avisa en la
 * barra de estado y deja un 0—, y eso es lo que hace `calculo.ts`. Inventar un
 * código sería enseñar un programa que no existe.
 */
export type CodigoError =
  | '#¡DIV/0!'
  | '#¿NOMBRE?'
  | '#¡VALOR!'
  | '#¡REF!'
  | '#N/A'
  | '#¡NUM!'
  | '#¡NULO!';

/** Un error **es un valor**: se guarda, se propaga y se puede preguntar por él. */
export interface ValorError {
  readonly error: CodigoError;
}

/** Lo que una celda enseña. `null` es vacía, y vacía no es cero (bloque 15). */
export type Valor = number | string | boolean | ValorError | null;

/** Constructor corto, que se usa cien veces en `funciones.ts`. */
export const err = (codigo: CodigoError): ValorError => ({ error: codigo });

export function esError(v: Valor): v is ValorError {
  return typeof v === 'object' && v !== null && 'error' in v;
}

/* ── las direcciones ────────────────────────────────────────────────────────*/

export const COLUMNAS = 16384;
export const FILAS = 1048576;

/**
 * Una referencia a una celda.
 *
 * `colAbs` y `filaAbs` son el `$` del bloque 21, y viven en la referencia y no
 * en el texto porque **rellenar hacia abajo tiene que poder desplazarla**: sin
 * estos dos booleanos, copiar una fórmula es manipular una cadena de texto, que
 * es como se escriben los motores que luego no se pueden arreglar.
 *
 * `hoja` en `null` significa «la hoja donde vive la fórmula». Una referencia
 * escrita `Hoja2!A1` lo trae puesto.
 */
export interface Ref {
  hoja: string | null;
  col: number;
  fila: number;
  colAbs: boolean;
  filaAbs: boolean;
}

/** `A1:B5`. Se guarda tal como se escribió; al leerlo se normaliza. */
export interface Rango {
  desde: Ref;
  hasta: Ref;
}

export const ref = (col: number, fila: number, colAbs = false, filaAbs = false, hoja: string | null = null): Ref => ({
  hoja,
  col,
  fila,
  colAbs,
  filaAbs,
});

/**
 * `0 → A`, `25 → Z`, `26 → AA`.
 *
 * Con memoria de las primeras columnas porque esto se llama una vez por celda y
 * por recálculo, y una hoja de clase no pasa de la columna Z ni de milagro. La
 * memoria se midió: sin ella, construir las nueve claves de `A1:A9` era el gasto
 * más caro de un recálculo pequeño.
 */
const LETRAS: string[] = [];

export function letraDeColumna(col: number): string {
  const memo = LETRAS[col];
  if (memo !== undefined) return memo;
  let n = col;
  let s = '';
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  if (col < 1024) LETRAS[col] = s;
  return s;
}

/** `A → 0`, `AA → 26`. Devuelve `-1` si no es una columna. */
export function columnaDeLetra(letras: string): number {
  if (!letras) return -1;
  let n = 0;
  for (const c of letras.toUpperCase()) {
    const d = c.charCodeAt(0) - 64;
    if (d < 1 || d > 26) return -1;
    n = n * 26 + d;
  }
  return n - 1;
}

/** `{col:0, fila:0}` → `A1`. Sin `$`: es la dirección, no cómo se escribió. */
export function dir(col: number, fila: number): string {
  return `${letraDeColumna(col)}${fila + 1}`;
}

/**
 * ¿Este nombre de hoja se puede escribir SIN comillas en una fórmula?
 *
 * La misma regla que ya vivía duplicada en `comandos.ts` (`nombrarRango`, el
 * botón que valida un nombre de rango): letra o `_` al principio, y letras,
 * cifras, `_` o `.` después. Un nombre de hoja que no la cumple —el caso que
 * importa hoy es **el espacio**, «Grupo A»— no se puede escribir pelado.
 */
const NOMBRE_DE_HOJA_DESNUDO = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ_][A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ_.]*$/;

/**
 * El nombre de una hoja, tal como hay que escribirlo en una fórmula.
 *
 * **Defecto encontrado el 15-ago-2026 construyendo `consolidar` (bloque 53,
 * §54.PROTEGE) y arreglado aquí, en el único sitio que escribe un `Ref`.**
 * `textoDeRef` escribía el nombre de la hoja pelado, sin comillas, incluso
 * cuando el nombre no era una palabra suelta. El caso real del encargo es
 * literalmente «Grupo A», «Grupo B», «Grupo C» — tres hojas con espacio en el
 * nombre—, y una fórmula que las referencia tenía que salir `Grupo A!B2`. El
 * lector (`lexico.ts`) exige comillas simples para un nombre de hoja con
 * espacio (`'Grupo A'!B2`, líneas 168-196) y **sin ellas ni siquiera vuelve a
 * leer lo que él mismo escribió**: `Grupo` se corta en el espacio y queda como
 * un nombre suelto, y ` A!B2` se lee aparte y revienta el análisis. No hacía
 * falta consolidar para que esto mordiera — `desplazarCrudo` (copiar y pegar)
 * y `ajustarPorFilas`/`ajustarPorColumnas` (insertar o borrar filas) ya
 * reescriben cualquier fórmula que cruce de hoja, así que **cualquier fórmula
 * con una hoja de nombre compuesto se rompía al primer copiar o insertar**, en
 * cualquier clase, no sólo en ésta. Era un defecto dormido porque hasta hoy
 * ninguna hoja de prueba llevaba espacio en el nombre.
 *
 * Se arregla en el único escritor de `Ref` y no en cada llamador: es la misma
 * disciplina que ya sigue este archivo con `letraDeColumna`.
 */
function nombreDeHojaEnFormula(hoja: string): string {
  return NOMBRE_DE_HOJA_DESNUDO.test(hoja) ? hoja : `'${hoja.replace(/'/g, "''")}'`;
}

/** Cómo se escribió: `A1`, `$A1`, `A$1`, `$A$1`, `Hoja2!A1`, `'Grupo A'!A1`. */
export function textoDeRef(r: Ref): string {
  const hoja = r.hoja ? `${nombreDeHojaEnFormula(r.hoja)}!` : '';
  return `${hoja}${r.colAbs ? '$' : ''}${letraDeColumna(r.col)}${r.filaAbs ? '$' : ''}${r.fila + 1}`;
}

export function textoDeRango(r: Rango): string {
  return `${textoDeRef(r.desde)}:${textoDeRef({ ...r.hasta, hoja: null })}`;
}

/** `A1` → `{col, fila}`. `null` si no lo es. No admite `$` ni hoja: es dirección. */
export function dirAColFila(d: string): { col: number; fila: number } | null {
  const m = /^([A-Za-z]{1,3})(\d{1,7})$/.exec(d.trim());
  if (!m) return null;
  const col = columnaDeLetra(m[1]);
  const fila = Number(m[2]) - 1;
  if (col < 0 || col >= COLUMNAS || fila < 0 || fila >= FILAS) return null;
  return { col, fila };
}

/** La clave del grafo: lleva la hoja pegada (decisión 4 de la cabecera). */
export type Clave = string;

export const clave = (hojaId: string, col: number, fila: number): Clave => `${hojaId}!${dir(col, fila)}`;

/** Parte `"h1!B4"` en sus tres piezas. Sólo lo usa el verificador y el banco. */
export function partirClave(k: Clave): { hoja: string; col: number; fila: number } | null {
  const i = k.lastIndexOf('!');
  if (i < 0) return null;
  const cf = dirAColFila(k.slice(i + 1));
  return cf ? { hoja: k.slice(0, i), ...cf } : null;
}

/**
 * Las celdas de un rango, en orden de lectura y con las esquinas normalizadas.
 *
 * `B5:A1` y `A1:B5` son el mismo rango — Excel lo admite y el alumno lo escribe
 * del revés más veces de las que uno cree.
 *
 * **`hoja` es el `id` ya resuelto, no el nombre.** En una fórmula la hoja se
 * escribe por su nombre (`Hoja2!A1`), y traducir nombre → id es cosa de quien
 * tiene el libro delante; aquí se recibe resuelto a propósito, para que no
 * exista la duda de si esta cadena es un nombre o un identificador. Por lo
 * mismo se quitó de este archivo un `claveDeRef(ref, hojaPorDefecto)` que
 * mezclaba las dos cosas: era una trampa esperando a la clase 53.
 */
export function celdasDelRango(r: Rango, hoja: string): Clave[] {
  const c0 = Math.min(r.desde.col, r.hasta.col);
  const c1 = Math.max(r.desde.col, r.hasta.col);
  const f0 = Math.min(r.desde.fila, r.hasta.fila);
  const f1 = Math.max(r.desde.fila, r.hasta.fila);
  const claves: Clave[] = [];
  for (let f = f0; f <= f1; f += 1) for (let c = c0; c <= c1; c += 1) claves.push(clave(hoja, c, f));
  return claves;
}

/** Cuántas celdas tiene, sin construir la lista. Para no reventar con `A:A`. */
export function tamanoDelRango(r: Rango): number {
  return (Math.abs(r.hasta.col - r.desde.col) + 1) * (Math.abs(r.hasta.fila - r.desde.fila) + 1);
}

/**
 * Desplaza una referencia, respetando el `$`. Es el bloque 21 entero.
 *
 * Devuelve `null` si se sale de la rejilla, que es lo que Excel enseña como
 * `#¡REF!` — rellenar hacia la izquierda desde la columna A tiene que romperse,
 * y tiene que romperse **en el modelo**, no en la pantalla.
 */
export function desplazar(r: Ref, dCol: number, dFila: number): Ref | null {
  const col = r.colAbs ? r.col : r.col + dCol;
  const fila = r.filaAbs ? r.fila : r.fila + dFila;
  if (col < 0 || col >= COLUMNAS || fila < 0 || fila >= FILAS) return null;
  return { ...r, col, fila };
}

/* ── el formato: el TIPO de la celda (bloque 6) ─────────────────────────────*/

export type TipoFormato = 'general' | 'numero' | 'texto' | 'moneda' | 'porcentaje' | 'fecha' | 'personalizado';

/**
 * Los cuatro lados de una celda, y **sólo los suyos**.
 *
 * Aquí no está escrito si el alumno pidió «todos los bordes» o «contorno»: eso
 * es una decisión **del rango** —en un contorno, la celda de en medio no lleva
 * ninguno y la de la esquina lleva dos— y se resuelve al aplicarla, celda por
 * celda, en `comandos.ts`. Guardarla dentro de la celda sería guardar una
 * palabra que ya no significa nada en cuanto la celda deje de estar en ese
 * rango: bastaría con insertar una columna en medio para que una celda siguiera
 * diciendo «yo soy contorno» sin serlo de nada.
 */
export interface Bordes {
  arriba?: boolean;
  abajo?: boolean;
  izquierda?: boolean;
  derecha?: boolean;
}

/**
 * Cómo se ve una celda. **Ninguno de estos campos cambia lo que la celda vale**
 * — es la mitad del bloque 6 dicha en una estructura de datos.
 *
 * Los cinco de abajo llegaron el 15-ago-2026 con los bloques 9 y 10, y
 * `subrayado` es el que hay que contar con nombre y apellido: estaba en la cinta
 * desde el primer día, **se dejaba pulsar y no hacía nada**, porque aquí no
 * había dónde guardarlo. Un gesto que se acepta, se graba en la macro y no se ve
 * es el defecto invisible del §45.6; el botón se había apagado a propósito para
 * no mentir, y lo que lo enciende es esta línea.
 *
 * `ajustarTexto` se guarda igual que los demás y **se pinta distinto de Excel**:
 * aquí el alto de fila es constante (§47.3, «cuadricular, no medir»), así que el
 * texto se parte en dos renglones apretados dentro del alto que hay en vez de
 * subir la fila. Está dicho entero en `ventanaHojas.css` y en la frase de guía.
 */
export interface Formato {
  tipo: TipoFormato;
  decimales?: number;
  negrita?: boolean;
  cursiva?: boolean;
  subrayado?: boolean;
  alineacion?: 'izquierda' | 'centro' | 'derecha';
  /** El color de la letra, `#rrggbb`. Sin él, la letra es la de la hoja. */
  colorLetra?: string;
  /** El color del fondo de la celda entera, `#rrggbb`. */
  colorRelleno?: string;
  bordes?: Bordes;
  /** El texto se parte en varios renglones en vez de salirse por el lado. */
  ajustarTexto?: boolean;
  /**
   * El patrón del formato de número personalizado (bloque 45), sólo cuando
   * `tipo` es `'personalizado'`. Al estilo Excel: `#`, `0`, `,` de miles,
   * `.` de decimales, texto entre comillas, y hasta tres secciones separadas
   * por `;` — positivo; negativo; cero — que es cómo se enseña que **el
   * formato no cambia el dato**: `1500` sigue siendo `1500` aunque el patrón
   * lo pinte de rojo y entre paréntesis. El patrón vive junto a `tipo` y no
   * en un campo aparte porque son la misma pregunta —«¿cómo se ve este
   * número?»— y guardarlos separados dejaría abierta la contradicción de un
   * `tipo: 'moneda'` con un patrón puesto que nadie va a leer.
   */
  patron?: string;
}

/* ── la celda, la hoja y el libro ───────────────────────────────────────────*/

/**
 * Lo que el alumno escribió, tal cual, más cómo quiere verlo.
 *
 * `crudo` es literalmente lo que hay en la barra de fórmulas: `"12"`, `"hola"`,
 * `"=SUMA(A1:A9)"`. Que sean la misma cadena es lo que hace que la barra de
 * fórmulas y la celda no puedan ser dos verdades distintas (§45.4).
 */
export interface Celda {
  crudo: string;
  formato?: Formato;
}

/* ── las gráficas · bloques 17, 18, 37 y 38 ─────────────────────────────────*/

/**
 * Los cinco tipos que esta sala dibuja.
 *
 * Son cinco y no veinte porque son los cinco que el temario nombra: columnas,
 * barras, líneas y circular son el bloque 17, y la dispersión entra con el 37
 * —«elegir la gráfica correcta»—, que es la clase donde el alumno tiene que
 * poder equivocarse de tipo para entender la diferencia. Un catálogo de treinta
 * tipos no enseña a elegir: enseña a buscar.
 */
export type TipoGrafica = 'columnas' | 'barras' | 'lineas' | 'circular' | 'dispersion';

/**
 * Una gráfica **es un objeto guardado en la hoja**, no un estado de la pantalla.
 *
 * Ésta es la misma familia de decisión que las cuatro de arriba, y conviene
 * dejar dicho qué compra:
 *
 * - **Se guarda con el libro.** Cerrar la ventana y volver no borra el dibujo, y
 *   un libro de prueba puede nacer con su gráfica puesta para que la clase
 *   empiece por mirarla y no por hacerla.
 * - **Se puede preguntar por ella** desde `consultas.ts` sin pantalla: el
 *   corrector del bloque 18 pregunta «¿le puso título?, ¿de qué rango come?»
 *   leyendo el libro, no espiando el DOM.
 * - **Se inserta con un gesto** (§45.6), y por lo tanto la clase 55 la puede
 *   grabar en una macro sin escribir una línea más.
 *
 * Y no guarda **ni un valor**. `datos` es un domicilio —`"A1:B9"`—, igual que el
 * portapapeles de la ventana guarda un domicilio y no un contenido: los números
 * los pide al motor cada vez que se dibuja, que es lo que hace que una gráfica
 * se recalcule sola cuando cambia una celda. Una gráfica que se guardara sus
 * números sería una foto, y el bloque 17 entero va de que no lo es.
 */
export interface Grafica {
  id: string;
  tipo: TipoGrafica;
  /** De dónde saca los números: `"A1:B9"`. Se guarda como se escribió. */
  datos: string;
  /**
   * Si la primera fila (o la primera columna) son rótulos y no datos.
   *
   * Sin poner, quien dibuja lo adivina como lo adivina Excel —una primera fila
   * sin ningún número son encabezados—, y eso es lo correcto para el 90 % de los
   * casos. Puesto a mano, manda: es la salida para la tabla en la que el año
   * `2024` de la primera fila es un rótulo y parece un dato.
   */
  rotulosEnPrimeraFila?: boolean;
  titulo?: string;
  ejeX?: string;
  ejeY?: string;
  leyenda?: boolean;
  rotulosDeDato?: boolean;
  /** Dónde flota sobre la hoja, en celdas —no en píxeles— (§39: cuadricular, no medir). */
  ancla: { col: number; fila: number; cols: number; filas: number };
  /**
   * Para la clase 38: **el eje que NO empieza en cero**.
   *
   * Se guarda porque es contenido, no una preferencia de dibujo: la clase
   * «gráficas que mienten» consiste en cortar el eje a propósito, mirar el
   * resultado y entender por qué engaña. Si esto fuera un ajuste de la pantalla,
   * el maestro no podría preguntarle al libro si el alumno lo cortó.
   */
  minY?: number;
  /**
   * El origen es una tabla dinámica y no un rango (bloque 51): el `id` de la
   * `Dinamica` de la que come, en la misma hoja donde vive el gráfico — la
   * misma reserva (c) de `comandos.ts` que ya limita `datos` a la hoja propia.
   *
   * Puesto, `datos` no se lee para nada: se deja en `''` porque el campo sigue
   * siendo obligatorio y así un libro con las dos cosas guardadas a la vez
   * —un rango Y una dinámica— no puede pasar sin querer. `Grafica.tsx` mira
   * `origenDinamica` primero, y si está puesto no llega a mirar `datos`.
   *
   * Es lo que hace que **actualizar la dinámica mueva el gráfico**: el
   * gráfico no guarda un número, guarda un domicilio —este `id`—, y en cada
   * pintada vuelve a pedirle a `dinamica.ts` la `Construida` de ahora mismo,
   * que es la de la caché si nadie actualizó y la de los datos de hoy si sí.
   * La misma decisión que ya tiene `datos` con una celda, un piso más arriba.
   */
  origenDinamica?: string;
  /**
   * La recta de mínimos cuadrados sobre UNA serie (bloque 52): su índice
   * dentro de la gráfica, `0` la primera. Sin poner, no hay línea.
   *
   * Lo que este campo NO decide es si la tendencia «vale la pena»: cuatro
   * puntos dan una recta tan legítima como cuarenta, y decidir que cuatro no
   * son una tendencia es una lectura de la clase, no una regla del motor. Lo
   * que el motor sí deja servido es `n` —cuántos puntos entraron—, que sale de
   * `lineaDeTendencia` (`Grafica.tsx`) en cada pintada y por eso no se guarda
   * aquí.
   */
  tendenciaSerie?: number;
  /**
   * Qué series van al segundo eje (bloque 52): sus índices, `0` la primera.
   * Vacío o sin poner, todas van al eje de siempre.
   *
   * Sirve cuando dos series tienen unidades distintas —pesos y número de
   * alumnos— y una aplasta a la otra en un solo eje. Y es también la otra cara
   * del eje cortado (`minY`, aquí arriba): dos ejes con escalas elegidas a
   * mano pueden hacer que dos curvas parezcan ir juntas sin estarlo. El motor
   * deja las dos puertas abiertas —honesta y mentirosa— y no avisa de cuál es
   * cuál, por la misma razón que `minY` no avisa: quien avisa es la clase.
   */
  ejeSecundario?: number[];
  /** El corte del segundo eje, igual que `minY` corta el primero. */
  minYSecundario?: number;
}

/* ── la segmentación de datos · bloque 51 ────────────────────────────────────
 *
 * Un panel de botones grandes que filtra UN campo de UNA dinámica, y filtra
 * **la dinámica y su gráfico a la vez** sin que ninguno de los dos sepa del
 * otro: los dos leen `Dinamica.filtros` (`dinamica.ts`), así que cambiar el
 * filtro desde aquí los mueve juntos de un solo golpe.
 *
 * Y no guarda **qué botones están pulsados** — eso ya lo guarda
 * `Dinamica.filtros[campo]`, la misma lista que llena `campo-dinamica` desde
 * el panel de campos. Guardarlo dos veces sería la misma clase de error que ya
 * evitó `Tabla`: dos verdades que se pueden desincronizar. La gracia
 * pedagógica de la segmentación no es que filtre distinto — filtra IGUAL—, es
 * que **se ve** qué filtro está puesto en vez de esconderlo en un menú, y eso
 * es una cuestión de cómo se PINTA, no de qué se guarda.
 */
export interface Segmentacion {
  id: string;
  /** La tabla dinámica que controla, EN LA MISMA HOJA — como `Grafica.datos`. */
  dinamica: string;
  /** El campo del origen, índice relativo — igual que `Dinamica.filtros`. */
  campo: number;
  titulo?: string;
  /** Dónde flota, en celdas — la misma forma que `Grafica.ancla`. */
  ancla: { col: number; fila: number; cols: number; filas: number };
}

/* ── el formato condicional · bloques 30 y 46, y los minigráficos · 31 ──────*/

/**
 * Una regla de formato condicional (bloque 30, y el 46 con la clase `'formula'`).
 *
 * **La regla NO cambia la celda: cambia cómo se ve.** Igual que `Formato`, no
 * hay un solo campo aquí que toque `crudo` — es la misma lección del formato
 * de moneda, rematada: aplicar una regla y sumar el rango tiene que dar el
 * mismo total antes y después.
 *
 * `id` viaja siempre puesto por quien emite el gesto (§45.6): una regla no se
 * fabrica un identificador al aplicarse, por la misma razón por la que
 * `insertarGrafica` recibe el suyo.
 */
export interface ReglaCondicional {
  id: string;
  /** El rango sobre el que vive, escrito como `"A1:D20"` — igual que `Grafica.datos`. */
  rango: string;
  clase: 'barras' | 'escala' | 'iconos' | 'destacar' | 'formula';
  /**
   * La condición que decide si la regla se aplica, y **no siempre es una
   * fórmula de Excel**.
   *
   * Para `'formula'` (bloque 46) sí lo es, con `=` delante: se evalúa una vez
   * por celda del rango con las referencias desplazadas (`desplazar()`, aquí
   * abajo, y `transformarRefs()` en `sintaxis.ts`) — el motor de fórmulas que
   * ya existe, sin un segundo intérprete.
   *
   * Para `'destacar'` (bloque 30) es un predicado compacto que este motor
   * codifica y lee él solo —`"mayor|1000"`, `"entre|100|500"`,
   * `"contiene|pendiente"`, `"duplicados"`—, con la misma disciplina que ya
   * usan `bordes` (`"arriba+abajo"`) y el desplegable de número en
   * `comandos.ts`: esta forma no tiene más que un hueco de texto libre y aquí
   * no se inventa uno nuevo para guardar dos números y una palabra. Ninguna
   * de las dos lecturas cambia el dato: las dos deciden si algo se pinta.
   */
  formula?: string;
  /** Qué aplicar cuando la condición se cumple (clases `'destacar'` y `'formula'`). */
  formato?: Formato;
  /** El único color que necesitan `'barras'`, `'escala'` e `'iconos'`. */
  color?: string;
}

/**
 * Un gráfico dentro de una celda (bloque 31), dibujado a mano en SVG como
 * `Grafica.tsx` — no una librería, por la misma razón de la clase 38: aquí no
 * hace falta esa lección, pero sí hace falta que el dibujo sea del motor y no
 * de un tercero.
 *
 * Sin `id`: la clave es la propia celda, porque un minigráfico es de la
 * celda en la que vive —insertar uno nuevo en la misma celda reemplaza al
 * que hubiera, que es lo que hace Excel—.
 */
export interface Minigrafico {
  celda: Clave;
  /** De dónde saca los números, como `Grafica.datos`: `"A1:F1"`. */
  datos: string;
  tipo: 'linea' | 'columna' | 'ganancia';
}

/**
 * Proteger la hoja (bloque 54). **Al revés que en Excel de verdad, y hay que
 * respetarlo**: en Excel toda celda nace «bloqueada» y proteger la hoja
 * cierra las que ya lo estaban; aquí no hay un `bloqueada` por celda —sería un
 * campo nuevo en CADA celda de CADA libro de prueba del repositorio, a cambio
 * de nada— y `desbloqueadas` son, en cambio, los rangos que SÍ se pueden tocar
 * con la hoja protegida. Con la hoja sin proteger, `desbloqueadas` no dice
 * nada: todo se puede tocar igual que siempre.
 *
 * **Sin contraseña**, y a propósito: una contraseña que se guarda en claro
 * enseña una mentira sobre seguridad. Esto protege de un despiste —borrar sin
 * querer la fila de fórmulas de un compañero—, no de alguien con intención de
 * saltársela, y ésa es la lección honesta del bloque.
 */
export interface Proteccion {
  activa: boolean;
  /** Rangos como `"B2:B9"`, normalizados con `textoDeCaja`. */
  desbloqueadas?: string[];
}

/* ── las tablas · bloques 33, 34, 35 y 36 ────────────────────────────────────
 *
 * **Una tabla no es un rango con colores.** Tiene nombre —usable un día en
 * una fórmula, `=Tabla1[Importe]`—, sabe dónde acaba y **crece sola** cuando
 * se escribe justo debajo de su última fila. Eso último no es un campo de
 * `Tabla`: es un comportamiento del comando `escribir` (más abajo, en
 * `comandos.ts`), porque sólo `escribir` puede notar que se acaba de teclear
 * en la fila de justo debajo de una tabla — es la mitad de por qué existen
 * las tablas, y guardarlo como un campo aparte lo dejaría desincronizado del
 * momento exacto en que hay que decidirlo.
 *
 * `filaDeTotales`, `filtros` y `orden` se indexan **por columna del libro**,
 * no por posición dentro de la tabla: la tercera columna de una tabla que
 * vive en `D2:G9` es la columna `F` (índice 5), y guardarla así evita
 * traducir un índice relativo cada vez que algo —el motor, una fórmula, un
 * clic— pregunta por esa columna.
 */
export interface Tabla {
  id: string;
  /** «Tabla1» — el nombre con el que un día se podrá escribir en una fórmula. */
  nombre: string;
  /** El rango ENTERO, encabezado incluido: `"A1:D9"`. */
  rango: string;
  estilo: string;
  /** Qué resumen enseña la fila de totales en cada columna. Por columna del libro. */
  filaDeTotales?: Record<number, ResumenDeColumna>;
  /** El filtro activo de cada columna, si lo hay. Por columna del libro. */
  filtros?: Record<number, Filtro>;
  /** Varias columnas, por prioridad: la primera del array manda sobre las que siguen. */
  orden?: Criterio[];
}

export type ResumenDeColumna = 'suma' | 'promedio' | 'cuenta' | 'max' | 'min' | 'ninguno';

/**
 * Lo que decide si una fila se ve. Las dos formas son excluyentes en la
 * práctica —un filtro de columna de Excel es una lista de valores O una
 * comparación, nunca las dos a la vez— pero el tipo no lo obliga, por el
 * mismo motivo que `Formato` no obliga a que `tipo` y `patron` vayan
 * siempre juntos: quien arma el filtro (el comando `filtrar`) es quien
 * decide cuál de los dos rellena.
 */
export interface Filtro {
  /** El texto de la casilla marcada: sólo se ve la fila cuyo valor está aquí. */
  valores?: string[];
  /** `mayor`, `menor`, `igual`, `contiene`, o `entre` con `contra` como `"100|500"`. */
  comparacion?: { op: string; contra: string };
}

export interface Criterio {
  col: number;
  desc: boolean;
}

/* ── las tablas dinámicas · bloques 49 y 50 ──────────────────────────────────
 *
 * **La hoja guarda el resumen que PEDISTE, no el resumen que SALIÓ.**
 *
 * Es la decisión 1 de la cabecera de este archivo un piso más arriba. Había dos
 * maneras de guardar una dinámica:
 *
 *   (A) escribir sus celdas en la hoja, como un pegado de valores. Barata, y
 *       **falsa**: al cambiar el origen se queda vieja sin decirlo, y el alumno
 *       ve un resumen que ya no resume nada.
 *   (B) guardar sólo la regla —de dónde come, qué cruza y qué resume— y pintar
 *       las celdas del cruce entre esa especificación y los datos de origen.
 *
 * Es la (B), y por lo mismo por lo que `Celda` guarda `=B2*C2` y no `450`: una
 * dinámica es *lo que se deriva*, y lo que se deriva no se escribe. Las celdas
 * pintadas no están en `Hoja.celdas` — viven en la caché de `dinamica.ts`, igual
 * que el valor de una fórmula vive en la caché del motor—, y de ahí salen las
 * tres consecuencias que el motor implementa:
 *
 *   1. **La región pintada es de sólo lectura**: no hay dónde escribir, porque
 *      esas celdas no existen en el libro. `revisar()` lo dice con esas palabras.
 *   2. **Actualizar es explícito**, como en Excel: la dinámica se pinta desde la
 *      caché que se llenó la última vez que se pidió, y teclear en el origen no
 *      la repinta. No es una limitación: es material de clase, y es exactamente
 *      la caché de tabla dinámica del Excel de verdad.
 *   3. **El origen necesita encabezados** o no hay campos que arrastrar.
 *
 * ── Los índices son DEL ORIGEN, no del libro ────────────────────────────────
 *
 * `filas`, `columnas`, `valores[].col` y las claves de `filtros` son **índices
 * relativos a la primera columna del origen**: `0` es la primera columna del
 * rango, valga la A o valga la M. Es al revés que en `Tabla` —que indexa por
 * columna del libro— y a propósito: un campo de una dinámica es «el tercer campo
 * del origen», identificado en Excel por el texto de su encabezado, y guardarlo
 * relativo hace que mover el origen de sitio no invalide la especificación.
 */
export interface Dinamica {
  id: string;
  /** De dónde come, encabezados en la primera fila: `"Datos!A1:F500"`. */
  origen: string;
  /** Dónde empieza a pintarse, con la hoja pegada: `"h2!B3"`. */
  ancla: Clave;
  /** Los campos que van a filas, EN ORDEN: el segundo se anida dentro del primero. */
  filas: number[];
  /** Lo mismo en el otro eje. */
  columnas: number[];
  /** Qué se resume y cómo. Sin ninguno, la dinámica pinta el esqueleto y nada más. */
  valores: { col: number; resumen: ResumenDeColumna }[];
  /**
   * Qué etiquetas deja pasar cada campo filtrado. Una fila del origen entra si
   * pasa TODOS los filtros. Un campo sin entrada aquí no filtra nada.
   */
  filtros?: Record<number, string[]>;
}

export interface Hoja {
  id: string;
  nombre: string;
  /** Indexadas por dirección sin `$`: `A1`, `B12`. Las vacías no están. */
  celdas: Record<string, Celda>;
  color?: string;
  /**
   * Las gráficas que flotan encima. **Opcional a propósito**: una hoja sin
   * gráficas no tiene la clave, con lo que los libros de las veintitantas
   * pruebas que ya comparan con `toEqual` siguen valiendo tal cual. Un
   * `graficas: []` obligatorio habría sido un campo nuevo en cada libro de
   * prueba del repositorio a cambio de nada.
   */
  graficas?: Grafica[];
  /**
   * Las celdas combinadas, escritas como rangos: `["A1:C1", "A5:A8"]`.
   *
   * **Viven en la hoja y no en cada celda**, y es la decisión que hace barata
   * toda la familia. Una combinación es una relación entre varias celdas —una
   * manda y las demás quedan tapadas—, y una relación guardada en cada extremo
   * se puede quedar coja: bastaría con que `borrar` se llevara la celda ancla
   * (que lo hace, porque una celda vacía sin formato se borra del mapa) para que
   * las tapadas siguieran diciendo que las tapa alguien que ya no existe. En la
   * hoja, la combinación es un dato solo, se lee de un vistazo y se separa
   * quitando un renglón de la lista.
   *
   * Opcional por lo mismo que `graficas`: una hoja sin combinaciones no lleva la
   * clave, y los libros que ya se comparan con `toEqual` en las pruebas siguen
   * valiendo tal cual.
   */
  combinadas?: string[];
  /**
   * El formato condicional de la hoja (bloques 30 y 46). Opcional por lo
   * mismo que `graficas` y `combinadas`: una hoja sin reglas no lleva la
   * clave, y los libros de las pruebas que se comparan con `toEqual` siguen
   * valiendo tal cual.
   */
  reglas?: ReglaCondicional[];
  /** Los minigráficos de la hoja (bloque 31). Opcional por la misma razón. */
  minigraficos?: Minigrafico[];
  /**
   * Cómo sale esta hoja en el papel (bloque 20): área de impresión, orientación,
   * márgenes, ajustar a una página y los títulos que se repiten arriba.
   *
   * **Vive en la hoja y no en el libro**, igual que en Excel, y no es un detalle:
   * un libro tiene una hoja de datos que va apaisada y una de resumen que va
   * vertical, y quien las imprime no debería tener que elegir. Guardado en el
   * libro, configurar una desconfiguraría la otra sin decirlo.
   *
   * Opcional, y **sólo con lo que el alumno tocó dentro** (`ConfigGuardada` es un
   * `Partial`): una hoja que nadie configuró no lleva esta clave, con lo que los
   * libros de las pruebas que se comparan con `toEqual` siguen valiendo tal cual
   * — la misma razón que `graficas` y `combinadas`. Lo que falte lo pone
   * `configDe` al leer.
   */
  impresion?: ConfigGuardada;
  /**
   * Proteger la hoja (bloque 54). Opcional por lo mismo que `graficas`,
   * `combinadas`, `reglas` y `minigraficos`: una hoja que nadie protegió no
   * lleva la clave, y los libros de las pruebas que se comparan con `toEqual`
   * siguen valiendo tal cual.
   */
  protegida?: Proteccion;
  /**
   * Los índices de fila que se ven, EN ORDEN. `undefined` = se ven todas —y
   * es el caso de todos los libros de hoy, que por eso siguen valiendo tal
   * cual en las pruebas que comparan con `toEqual` (la misma disciplina que
   * `graficas`, `combinadas`, `reglas` y las demás claves opcionales de aquí
   * arriba).
   *
   * ── Por qué existe: filtrar esconde filas, y una fila se pinta en
   *    `fila * ALTO_FILA` ──────────────────────────────────────────────────
   *
   * De esa multiplicación salen tres cosas: qué filas se dibujan, cuál está
   * bajo el ratón y dónde va el cursor. Esconder filas la rompe — a menos que
   * lo que se multiplique deje de ser la fila y pase a ser **su puesto en
   * pantalla**. Por eso este campo no es un `Set` de filas ocultas: es la
   * traducción YA HECHA de fila a puesto, para que `puestoDeFila` y
   * `filaEnPuesto` (aquí abajo) sigan siendo aritmética barata —una división
   * entera y un acceso a un array— y no una búsqueda por cada fila pintada.
   *
   * **Se deriva, no se mantiene a mano.** Los comandos `filtrar`,
   * `quitar-filtros`, `ocultar-filas` y `mostrar-filas` son los ÚNICOS que
   * escriben esta clave, y la recalculan entera cada vez a partir de los
   * filtros de las tablas de la hoja y de lo que se pidió ocultar — nadie
   * más la toca, por la misma razón por la que `visibles` no vive repartido
   * en veinte sitios: una lista que hay que mantener a mano en varios
   * comandos es una lista que un comando nuevo olvida actualizar.
   *
   * **Reserva escrita a propósito:** cubre desde la fila 0 hasta la última
   * fila que alguna tabla o alguna celda escrita de la hoja necesita — no
   * hasta la 1.048.576. Más allá de esa frontera no hay ninguna tabla que
   * filtrar ni ninguna fila que alguien haya pedido ocultar, así que
   * construir un array de un millón de números para decir «todas visibles»
   * sería medir donde no hace falta. Es la misma familia de decisión que la
   * memoria de `letraDeColumna`: gastar donde el coste es real.
   */
  visibles?: number[];
  /**
   * Filas y columnas que no se mueven al desplazarse (bloque 36).
   *
   * **Sólo pintado.** A diferencia de `visibles`, inmovilizar NO esconde
   * ninguna fila ni columna ni cambia qué puesto le toca a cada una — todo
   * sigue en el suyo, `puestoDeFila`/`filaEnPuesto` ni se enteran de que
   * existe este campo. Lo único que cambia es que, al hacer scroll, las
   * primeras `filas` filas y las primeras `cols` columnas se quedan quietas
   * en vez de desplazarse con el resto — una decisión de la ventana
   * (`VentanaHojas.tsx`), no del modelo.
   */
  inmovilizado?: { filas: number; cols: number };
  /**
   * Las tablas de la hoja (bloques 33 a 36). Opcional por lo mismo que
   * `graficas`: una hoja sin tablas no lleva la clave.
   */
  tablas?: Tabla[];
  /**
   * Las tablas dinámicas que se pintan en esta hoja (bloques 49 y 50).
   *
   * **La dinámica vive en la hoja donde se PINTA**, que es la del `ancla`; el
   * origen puede estar en otra (`"Datos!A1:F500"`), que es el caso normal en
   * clase. Así, la lista de zonas de sólo lectura de una hoja se lee de esa
   * misma hoja y no hay que recorrer el libro entero preguntando quién pinta
   * dónde.
   *
   * Opcional por lo mismo que `graficas`, `tablas` y las demás: una hoja sin
   * dinámicas no lleva la clave, y los libros de las pruebas que se comparan
   * con `toEqual` siguen valiendo tal cual.
   */
  dinamicas?: Dinamica[];
  /**
   * Las segmentaciones de datos de esta hoja (bloque 51): paneles de botones
   * que filtran una dinámica de la misma hoja. Opcional por lo mismo que
   * `dinamicas`: una hoja sin ninguna no lleva la clave, y los libros de las
   * pruebas que se comparan con `toEqual` siguen valiendo tal cual.
   */
  segmentaciones?: Segmentacion[];
  /**
   * La validación de datos de la hoja (bloque 32). Opcional por lo mismo que
   * `graficas`, `tablas` y `dinamicas`: una hoja sin ninguna regla puesta no
   * lleva la clave, y los libros de las pruebas que se comparan con `toEqual`
   * siguen valiendo tal cual.
   */
  validaciones?: Validacion[];
  /**
   * Los hipervínculos de la hoja (bloque 40), indexados por la `Clave` de la
   * celda que los lleva —la misma clave del grafo, con esta hoja pegada—.
   * Opcional por la misma razón que el resto de esta lista.
   */
  vinculos?: Record<Clave, Vinculo>;
  /**
   * Si esta hoja está oculta (bloque 16, «Ocultar hoja»).
   *
   * Llega con el paquete VALIDACIÓN (§32) porque `inspeccionar` (bloque 42)
   * tiene que poder contar «hojas escondidas» en el parte del libro, y no hay
   * ningún otro sitio donde ese dato pudiera vivir. **Opcional y sin un botón
   * que lo encienda todavía**: no existe un comando `ocultarHoja` en este
   * motor —ninguna clase construida hasta hoy lo pide—, así que este campo es
   * SIN_CONSTRUIR por el lado de «apagar una hoja» y ya funciona por el lado
   * de «contar cuántas lo están», que es lo único que el bloque 42 necesita
   * hoy. El día que una clase quiera ocultar hojas de verdad, el campo ya
   * está aquí y `inspeccionar` ya sabe leerlo.
   */
  oculta?: boolean;
}

/**
 * De la fila real al puesto en el que se pinta. `-1` si esa fila está
 * escondida —filtrada u oculta a mano— y por lo tanto no tiene puesto.
 *
 * Sin `visibles` (el caso de siempre) el puesto de una fila es ella misma:
 * nada está escondido y la vieja multiplicación `fila * ALTO_FILA` sigue
 * siendo exactamente esta función con un paso menos.
 */
export const puestoDeFila = (h: Hoja, fila: number): number => (h.visibles ? h.visibles.indexOf(fila) : fila);

/**
 * Del puesto en pantalla a la fila real que hay que pintar ahí. `-1` si ya
 * no queda ninguna fila visible en ese puesto —fin de la lista filtrada—.
 *
 * Es la otra mitad de la misma traducción, y la que de verdad ahorra
 * trabajo: pintar ya NO es «calcula si esta fila se ve», es «pídele al
 * array la fila que le toca a este puesto». Sigue siendo un acceso a un
 * array, no una búsqueda — la búsqueda está en `puestoDeFila`, que se usa
 * mucho menos veces por repintado que ésta.
 */
export const filaEnPuesto = (h: Hoja, puesto: number): number =>
  h.visibles ? (puesto >= 0 && puesto < h.visibles.length ? h.visibles[puesto] : -1) : puesto;

/* ── la validación de datos · bloque 32 ──────────────────────────────────────
 *
 * Una lista desplegable no es un adorno: **es lo que hace que una columna se
 * pueda filtrar y resumir después**. Si cada quien escribe «Transporte»,
 * «transporte» y «Transp.», ninguna tabla dinámica los junta. Ésa es la razón
 * de que este bloque exista, y por eso vive en el motor y no sólo en el texto
 * del temario (§32, paquete VALIDACIÓN).
 *
 * `bloquea` decide entre las dos herramientas que Excel de verdad distingue:
 * `true` es «Detener» —no deja escribirlo— y `false` es «Advertencia» —avisa
 * y deja pasar—. Las dos existen y sirven para cosas distintas: una hoja de
 * gastos puede EXIGIR una categoría de la lista, y una de estimaciones puede
 * sólo avisar si alguien mete un número fuera de lo normal sin impedirlo.
 *
 * **La regla que sorprende a todo el mundo:** una validación puesta hoy NO
 * revisa lo que ya estaba escrito ayer. Es lo que hace Excel de verdad —y es
 * material de clase— y aquí sale solo: el único sitio que consulta una
 * `Validacion` es el comando `escribir` (`comandos.ts`), en el momento exacto
 * de una escritura NUEVA. Nadie recorre la hoja entera a revalidarla.
 */
export interface Validacion {
  /** El rango sobre el que vive, como `Grafica.datos`: `"B2:B20"`. */
  rango: string;
  clase: 'lista' | 'numero' | 'fecha' | 'longitud';
  /** Sólo para `'lista'`: las opciones exactas, tal como se escriben. */
  lista?: string[];
  /**
   * Para `'numero'`, `'fecha'` (como número de serie, igual que en todo este
   * motor: una fecha es un número — ver la cabecera de `Formato`) y
   * `'longitud'` (como cuenta de caracteres). Sólo uno de los dos, sólo el
   * mínimo, o los dos: lo que falte no se exige por ese lado.
   */
  min?: number;
  max?: number;
  /** Lo que se dice al entrar en la celda — el mensaje de entrada de Excel. */
  mensaje?: string;
  /** Lo que se dice al fallar — el mensaje de error de Excel. */
  aviso?: string;
  bloquea: boolean;
}

/* ── los hipervínculos dentro del libro · bloque 40 ──────────────────────────
 *
 * Un salto a otra hoja o celda, **dentro del mismo libro**: no hay una URL que
 * salir a buscar, que es la misma disciplina de «software ultra-LITE» que ya
 * sigue el resto de la sala — esto es un simulador y no un navegador.
 *
 * `destino` es una `Clave` completa —`"h2!A1"`, con el ID de la hoja pegado,
 * igual que la clave del grafo (decisión 4 de la cabecera de este archivo)—,
 * y no el NOMBRE de la hoja: así se resuelve con `partirClave` sin tener que
 * buscar por nombre, y no se confunde con la convención de `Libro.nombres`
 * (que sí guarda por nombre, porque eso es lo que se escribe en una fórmula).
 *
 * **El vínculo se rompe si se borra la hoja destino, y se tiene que VER roto,
 * no fallar en silencio** — es la pantalla quien decide cómo se ve eso
 * (`VentanaHojas.tsx`), preguntándole a `partirClave(vinculo.destino)` y
 * comprobando si esa hoja sigue en `Libro.hojas`.
 */
export interface Vinculo {
  /** `"h2!A1"` — la hoja por su ID y la celda, como escribe `clave()`. */
  destino: string;
  /** El texto que se enseña en la celda, si es distinto del que ya tenía. */
  texto?: string;
}

/**
 * Un juego de valores con nombre: «Optimista», «Realista», «Apretado»
 * (bloque 57, análisis «Y si»).
 *
 * Guarda **crudos**, no valores calculados, y por eso la clave es la del grafo
 * —`"h1!B3"`, con la hoja pegada— y no una dirección suelta. Las dos cosas son
 * la misma decisión: un escenario es *lo que habría escrito el alumno*, así que
 * se aplica escribiéndolo por el camino normal y el libro que queda es
 * exactamente el que quedaría si lo hubiera tecleado a mano. Si guardara valores
 * calculados, aplicar un escenario sobre una celda con fórmula la sustituiría
 * por un número **sin que se pueda decir de dónde salió**, que es justamente el
 * defecto que este bloque enseña a no cometer (por eso `aplicar-escenario`
 * avisa antes de pisar una regla).
 */
export interface Escenario {
  nombre: string;
  /** `{"h1!B3": "1200"}` — la celda y lo que hay que escribir en ella. */
  celdas: Record<Clave, string>;
}

export interface Libro {
  hojas: Hoja[];
  activa: string;
  /** Rangos con nombre (bloque 22): `Precios → "h1!B2:B9"`. */
  nombres: Record<string, string>;
  /**
   * Los escenarios guardados (bloque 57). **Opcional a propósito**, por lo mismo
   * que `Hoja.graficas`: un libro sin escenarios no lleva la clave y los libros
   * de las pruebas que se comparan con `toEqual` siguen valiendo tal cual.
   */
  escenarios?: Escenario[];
  /**
   * Proteger la ESTRUCTURA del libro (bloque 54): impide crear, borrar,
   * renombrar y mover hojas, pero deja escribir en las celdas — es otra cosa
   * que proteger una hoja, y las dos conviven sin pisarse. Opcional por lo
   * mismo que `escenarios`: un libro que nadie protegió no lleva la clave.
   */
  estructuraProtegida?: boolean;
  /**
   * Las macros guardadas (bloques 55 y 56): un nombre y la lista de `Gesto`
   * que apuntó `Grabadora` mientras grabó (`comandos.ts`). Se guarda tal
   * cual —nada se adapta al guardarla, nada se inventa al reproducirla, la
   * misma regla de la cabecera de `comandos.ts`—, y es lo que hace que un
   * `.xlsm` no sea un Excel con un candado: es un archivo que **trae órdenes
   * dentro**, y esta lista son esas órdenes. Opcional por lo mismo que
   * `escenarios`: un libro sin macros no lleva la clave, y los libros de las
   * pruebas que se comparan con `toEqual` siguen valiendo tal cual.
   */
  macros?: Record<string, Gesto[]>;
  /**
   * Qué macro dispara cada botón (bloque 56, «asignar macro a un botón»).
   * `boton` es un id que pone quien lo coloca —esta hoja no tiene formas ni
   * controles, así que no hay más domicilio que ése—, y el valor es el
   * NOMBRE de la macro, no su lista: así el botón lee `macros` en vivo y
   * nunca guarda una copia vieja.
   *
   * **Borrar la macro asignada no borra la asignación**, la misma decisión
   * que ya toma `Vinculo` con una hoja borrada: el botón se queda apuntando
   * a un nombre que ya no existe, y eso se tiene que VER roto —ejecutarlo
   * dice «no existe esa macro»—, no fallar en silencio ni impedir el borrado
   * de una macro por algo que la señala desde fuera. Opcional por lo mismo
   * que `macros`.
   */
  botones?: Record<string, string>;
}

export function hojaDe(libro: Libro, id: string): Hoja | null {
  return libro.hojas.find((h) => h.id === id) ?? null;
}

export function hojaPorNombre(libro: Libro, nombre: string): Hoja | null {
  const n = nombre.toLowerCase();
  return libro.hojas.find((h) => h.nombre.toLowerCase() === n) ?? null;
}

/** El crudo de una celda; `""` si está vacía. Nunca `undefined`. */
export function crudoEn(libro: Libro, hojaId: string, col: number, fila: number): string {
  return hojaDe(libro, hojaId)?.celdas[dir(col, fila)]?.crudo ?? '';
}

export function celdaEn(libro: Libro, hojaId: string, col: number, fila: number): Celda | null {
  return hojaDe(libro, hojaId)?.celdas[dir(col, fila)] ?? null;
}

/**
 * Escribe una celda y devuelve un libro NUEVO.
 *
 * El libro es inmutable de arriba abajo: es lo que permite que una macro se
 * reproduzca sobre el libro de partida y dé exactamente el mismo resultado, y
 * lo que permite comparar dos libros con un `toEqual` en una prueba. Se comparte
 * estructura —las hojas que no se tocan son el mismo objeto— para que escribir
 * mil celdas seguidas no cueste mil copias del libro entero.
 *
 * Escribir `""` **borra** la celda del mapa en vez de dejarla con crudo vacío.
 * Si no, una celda que se escribió y se borró dejaría de ser vacía sin que se
 * note, y `CONTARA` empezaría a contarla: el bloque 15, roto por un descuido de
 * estructura de datos.
 */
export function conCelda(libro: Libro, hojaId: string, col: number, fila: number, celda: Celda | null): Libro {
  const h = hojaDe(libro, hojaId);
  if (!h) return libro;
  const d = dir(col, fila);
  const celdas = { ...h.celdas };
  const vacia = !celda || (celda.crudo === '' && !celda.formato);
  if (vacia) delete celdas[d];
  else celdas[d] = celda;
  return { ...libro, hojas: libro.hojas.map((x) => (x.id === hojaId ? { ...x, celdas } : x)) };
}

export function hojaVacia(id: string, nombre: string): Hoja {
  return { id, nombre, celdas: {} };
}

export function libroVacio(): Libro {
  return { hojas: [hojaVacia('h1', 'Hoja1')], activa: 'h1', nombres: {} };
}

/* ── conversiones: las reglas de Excel, en un solo sitio ────────────────────*/

/**
 * A número, como lo hace Excel en una operación aritmética.
 *
 * Las tres reglas que hay que respetar y que son las que se olvidan:
 * vacío vale 0 **en aritmética** (aunque no sea 0 al contarlo, decisión 3),
 * `VERDADERO` vale 1, y un texto que no parece número da `#¡VALOR!` — no 0, ni
 * `NaN`, que es como se cuelan los ceros mentirosos en una hoja de cálculo.
 */
export function aNumero(v: Valor): number | ValorError {
  if (esError(v)) return v;
  if (v === null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const t = v.trim();
  if (t === '') return 0;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : err('#¡VALOR!');
}

export function aTexto(v: Valor): string {
  if (esError(v)) return v.error;
  if (v === null) return '';
  if (typeof v === 'boolean') return v ? 'VERDADERO' : 'FALSO';
  if (typeof v === 'number') return textoDeNumero(v);
  return v;
}

export function aBooleano(v: Valor): boolean | ValorError {
  if (esError(v)) return v;
  if (v === null) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const t = v.trim().toUpperCase();
  if (t === 'VERDADERO') return true;
  if (t === 'FALSO') return false;
  return err('#¡VALOR!');
}

/**
 * Un número, escrito como lo escribe una hoja de cálculo.
 *
 * Excel enseña hasta 15 dígitos significativos, y es lo que evita que
 * `=0.1+0.2` salga `0.30000000000000004` en la celda. No es cosmética: es la
 * razón de que una hoja de cálculo parezca que sabe sumar.
 */
export function textoDeNumero(n: number): string {
  if (!Number.isFinite(n)) return '#¡NUM!';
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  const s = n.toPrecision(15);
  return String(Number(s));
}

/**
 * Compara dos valores como lo hace `=A1=B1`.
 *
 * Con dos avisos que son de fidelidad, no de gusto: el texto se compara **sin
 * distinguir mayúsculas** (`"sí"` es igual a `"SÍ"`), y una celda vacía es
 * igual a `0` y a `""` a la vez, que es la trampa que la clase 15 explica.
 */
export function comparar(a: Valor, b: Valor): number | ValorError {
  if (esError(a)) return a;
  if (esError(b)) return b;
  if (typeof a === 'string' || typeof b === 'string') {
    if (a === null || b === null) {
      const s = aTexto(a === null ? b : a);
      return s === '' ? 0 : a === null ? -1 : 1;
    }
    const x = aTexto(a).toLowerCase();
    const y = aTexto(b).toLowerCase();
    return x === y ? 0 : x < y ? -1 : 1;
  }
  const x = aNumero(a);
  const y = aNumero(b);
  if (typeof x !== 'number') return x;
  if (typeof y !== 'number') return y;
  return x === y ? 0 : x < y ? -1 : 1;
}
