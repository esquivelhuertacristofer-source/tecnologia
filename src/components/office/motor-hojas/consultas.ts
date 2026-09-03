/**
 * Tecnia Hojas · `consultas.ts` — lo que el maestro le pregunta al libro.
 *
 * El molde es el mismo de las otras dos salas (`office/motor/consultas.ts` y
 * `office/motor-diapos/consultas.ts`): funciones puras, sin DOM, que contestan
 * con **enums, booleanos y enteros**. Es lo que permite corregir **leyendo el
 * libro** en vez de vigilando qué botón se pulsó (§36.3), y es lo que hace que
 * una clase se pueda probar sin navegador.
 *
 * ── LA REGLA DEL DÍA, que es la que este archivo tiene que demostrar ────────
 *
 * En el §39 la regla fue «ninguna función de este archivo puede usar un número
 * decimal», porque en una diapositiva cada épsilon es un sitio donde la clase
 * aprueba algo mal hecho. Aquí el peligro es el mismo con otra cara: **una hoja
 * de cálculo está hecha de decimales**, y `0.1 + 0.2` no da `0.3` en ninguna
 * máquina de este planeta. Preguntar «¿el total es 1250.75?» con un `===` falla
 * el día menos pensado, y con un `Math.abs(a-b) < 0.001` aprueba una hoja mal
 * hecha.
 *
 * La salida es la misma que la del §39, y no es afinar el instrumento: es
 * quitarle grados de libertad al problema. **Dos números son iguales si la hoja
 * los enseña iguales.** Se comparan por `textoDeNumero()`, que son los 15
 * dígitos significativos con los que Excel enseña un número — y ésa no es una
 * tolerancia nuestra: es la precisión que el propio programa exhibe, igual que
 * en el §39 «¿rebosa el texto?» se le preguntaba al motor de maquetación en vez
 * de comparar píxeles.
 *
 * **Recuento al cerrar el archivo: cero tolerancias, cero épsilons.** Ninguna
 * función de aquí abajo escribe un `< 0.00…`.
 */

import {
  aTexto,
  dir,
  dirAColFila,
  esError,
  hojaDe,
  hojaPorNombre,
  partirClave,
  puestoDeFila,
  textoDeNumero,
  clave,
  type Clave,
  type CodigoError,
  type Formato,
  type Libro,
  type Tabla,
  type Valor,
} from './modelo';
import { esFormula } from './formula/lexico';
import { funcionesDe, parsear, referenciasDe } from './formula/sintaxis';
import { dependientesDe, precedentesDe, valorDeArbol, valorDeClave, type Motor } from './formula/calculo';
/*
 * Sólo `cajaDeTexto` y el tipo `Caja` — quien LEE un rango como `"A1:D9"`—,
 * del mismo sitio de donde ya lo importa `impresion.ts` (ver su cabecera). La
 * dependencia va en un único sentido: `comandos.ts` no importa nada de este
 * archivo, así que traerse esto de allí no cierra ningún círculo.
 */
import { cajaDeTexto, type Caja } from './comandos';
/*
 * `verificar()` ya hace la mitad de `inspeccionar` (bloque 42): recalcula
 * desde cero y cuenta errores, fórmulas ilegibles y celdas pendientes. Un
 * segundo contador que repitiera esa cuenta sería la misma trampa que ya
 * evitó `totalDeColumna` al no reinventar `SUBTOTALES()`.
 */
import { verificar, type Veredicto } from './verificar';

/* ── lo básico: qué hay en una celda ────────────────────────────────────────*/

/** La clave del grafo a partir de lo que se escribe en clase: `('h1','B1')`. */
export function claveDeDireccion(hoja: string, direccion: string): Clave | null {
  const p = dirAColFila(direccion);
  return p ? clave(hoja, p.col, p.fila) : null;
}

/** Lo que el alumno escribió, tal cual. Lo que se ve en la barra de fórmulas. */
export function crudoDe(libro: Libro, hoja: string, direccion: string): string {
  return hojaDe(libro, hoja)?.celdas[direccion.toUpperCase()]?.crudo ?? '';
}

/** Lo que la celda enseña. */
export function valorDe(motor: Motor, hoja: string, direccion: string): Valor {
  const k = claveDeDireccion(hoja, direccion);
  return k ? valorDeClave(motor, k) : null;
}

export function formatoDe(libro: Libro, hoja: string, direccion: string): Formato | null {
  return hojaDe(libro, hoja)?.celdas[direccion.toUpperCase()]?.formato ?? null;
}

/**
 * ¿Esta celda **guarda una regla** o guarda un dato? El bloque 13 entero.
 *
 * Es la primera pregunta de la primera clase de fórmulas, y la que distingue a
 * un alumno que entendió de uno que escribió el resultado a mano.
 */
export function guardaUnaRegla(libro: Libro, hoja: string, direccion: string): boolean {
  return esFormula(crudoDe(libro, hoja, direccion));
}

/** ¿Usó esta función? En mayúsculas, como las escribe el analizador. */
export function usaFuncion(libro: Libro, hoja: string, direccion: string, funcion: string): boolean {
  const a = parsear(crudoDe(libro, hoja, direccion));
  return a.ok && funcionesDe(a.arbol).includes(funcion.toUpperCase());
}

/** Todas las funciones que usa, para decir «te sobra una». */
export function funcionesEn(libro: Libro, hoja: string, direccion: string): string[] {
  const a = parsear(crudoDe(libro, hoja, direccion));
  return a.ok ? funcionesDe(a.arbol) : [];
}

/**
 * ¿Sumó el rango que había que sumar?
 *
 * Devuelve los rangos escritos, normalizados a texto (`"A1:A9"`). Se compara
 * texto con texto, sin geometría y sin tolerancia.
 */
export function rangosEn(libro: Libro, hoja: string, direccion: string): string[] {
  const a = parsear(crudoDe(libro, hoja, direccion));
  if (!a.ok) return [];
  return referenciasDe(a.arbol).rangos.map((r) => {
    const c0 = Math.min(r.desde.col, r.hasta.col);
    const c1 = Math.max(r.desde.col, r.hasta.col);
    const f0 = Math.min(r.desde.fila, r.hasta.fila);
    const f1 = Math.max(r.desde.fila, r.hasta.fila);
    return `${letra(c0)}${f0 + 1}:${letra(c1)}${f1 + 1}`;
  });
}

function letra(col: number): string {
  let n = col;
  let s = '';
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

/**
 * ¿Esta fórmula habla por **nombre**? El bloque 22.
 *
 * Hace falta porque `=D8*IVA` y `=D8*$E$2` son **la misma cuenta**: dan el mismo
 * número, se mueven igual al copiarlas y ningún valor las distingue. Lo único
 * que las separa es que una se lee y la otra hay que descifrarla, y eso no está
 * en la caché del motor: está en lo que el alumno escribió. Sin esta pregunta,
 * el encargo de los rangos con nombre no se puede corregir sin mirar la cadena
 * de texto a mano, que es como se escriben los correctores que aprueban
 * `"=D8*IVAX"`.
 */
export function nombresEn(libro: Libro, hoja: string, direccion: string): string[] {
  const a = parsear(crudoDe(libro, hoja, direccion));
  return a.ok ? referenciasDe(a.arbol).nombres : [];
}

/**
 * ¿Puso el `$` donde había que ponerlo? El bloque 21.
 *
 * Contesta cuántas referencias de la fórmula tienen la columna fija, la fila
 * fija, las dos o ninguna. Cuatro enteros: con eso una clase dice «te falta
 * fijar la fila» sin mirar el texto.
 */
export function anclajes(
  libro: Libro,
  hoja: string,
  direccion: string,
): { libres: number; columnaFija: number; filaFija: number; ambasFijas: number } {
  const a = parsear(crudoDe(libro, hoja, direccion));
  const cuenta = { libres: 0, columnaFija: 0, filaFija: 0, ambasFijas: 0 };
  if (!a.ok) return cuenta;
  const { refs, rangos } = referenciasDe(a.arbol);
  const todas = [...refs, ...rangos.flatMap((r) => [r.desde, r.hasta])];
  for (const r of todas) {
    if (r.colAbs && r.filaAbs) cuenta.ambasFijas += 1;
    else if (r.colAbs) cuenta.columnaFija += 1;
    else if (r.filaAbs) cuenta.filaFija += 1;
    else cuenta.libres += 1;
  }
  return cuenta;
}

/* ── vacío, cero y error · bloques 15 y 47 ──────────────────────────────────*/

/** Vacía de verdad: nadie ha escrito nada. Distinto de valer 0 (bloque 15). */
export function estaVacia(libro: Libro, hoja: string, direccion: string): boolean {
  return crudoDe(libro, hoja, direccion).trim() === '';
}

export function valeCero(motor: Motor, hoja: string, direccion: string): boolean {
  return valorDe(motor, hoja, direccion) === 0;
}

/** El código de error que enseña la celda, o `null` si no enseña ninguno. */
export function errorDe(motor: Motor, hoja: string, direccion: string): CodigoError | null {
  const v = valorDe(motor, hoja, direccion);
  return esError(v) ? v.error : null;
}

/** Todas las celdas del libro que enseñan un error. Material de la clase 47. */
export function celdasConError(motor: Motor): Array<{ celda: Clave; codigo: CodigoError }> {
  const fuera: Array<{ celda: Clave; codigo: CodigoError }> = [];
  for (const [k, v] of motor.valores) if (esError(v)) fuera.push({ celda: k, codigo: v.error });
  return fuera.sort((a, b) => a.celda.localeCompare(b.celda));
}

/* ── el grafo · la auditoría de la clase 47 sale de aquí ────────────────────*/

/** De qué celdas se alimenta ésta. Las flechas azules de «rastrear precedentes». */
export function precedentes(motor: Motor, hoja: string, direccion: string): Clave[] {
  const k = claveDeDireccion(hoja, direccion);
  return k ? precedentesDe(motor, k).sort() : [];
}

/** A quién alimenta ésta. «Rastrear dependientes», la flecha en el otro sentido. */
export function dependientes(motor: Motor, hoja: string, direccion: string): Clave[] {
  const k = claveDeDireccion(hoja, direccion);
  return k ? dependientesDe(motor, k).sort() : [];
}

export function hayCirculares(motor: Motor): boolean {
  return motor.circulares.length > 0;
}

/**
 * Una flecha de la clase 47, ya traducida a lo que ESTA rejilla puede pintar.
 *
 * `col` y `puesto` son `null` cuando la flecha no se puede trazar aquí: la
 * celda vive en otra hoja (no hay coordenada que darle en esta rejilla), o la
 * fila está escondida por un filtro (`puestoDeFila` devuelve `-1`). Esta
 * función no inventa una flecha que no se puede trazar — quien dibuja decide
 * qué hacer con esas dos, un icono de «otra hoja» o nada, y eso es asunto de
 * la ventana, no del motor.
 */
export interface FlechaAuditoria {
  celda: Clave;
  col: number | null;
  /** El PUESTO en pantalla (`puestoDeFila`), no la fila real — la regla 4 de la casa. */
  puesto: number | null;
}

/**
 * Las flechas de «rastrear precedentes» / «rastrear dependientes» (bloque
 * 47), listas para pintar: `col * ANCHO_COL` y `puesto * ALTO_FILA` son las
 * dos multiplicaciones de siempre (§39, «cuadricular, no medir»), y ninguna
 * fila se mide a mano — el que llama nunca ve una fila real, sólo su puesto.
 *
 * Se prueba jugando MAL a propósito: una celda sin fórmulas da la lista
 * vacía (no hay de qué tirar la flecha), y una celda dentro de un ciclo
 * circular sigue dando sus precedentes tal cual —el grafo no filtra el
 * ciclo, `calculo.ts`—, así que rastrear DESDE ahí también dibuja.
 */
export function flechasDeAuditoria(
  motor: Motor,
  hoja: string,
  direccion: string,
  sentido: 'precedentes' | 'dependientes',
): FlechaAuditoria[] {
  const claves = sentido === 'precedentes' ? precedentes(motor, hoja, direccion) : dependientes(motor, hoja, direccion);
  const h = hojaDe(motor.libro, hoja);
  return claves.map((k) => {
    const p = partirClave(k);
    if (!p || p.hoja !== hoja) return { celda: k, col: null, puesto: null };
    const puesto = h ? puestoDeFila(h, p.fila) : -1;
    return { celda: k, col: p.col, puesto: puesto >= 0 ? puesto : null };
  });
}

/* ── bloque 48 · mirar el error antes de taparlo ─────────────────────────────
 *
 * `SI.ERROR` ya existe (`formula/funciones.ts`) y ya se puede mirar CUALQUIER
 * celda con `errorDe`, tapada o no — escribir la fórmula sin la envoltura,
 * ver el error, y ENTONCES envolverla ya enseña la lección. Lo de aquí abajo
 * es la vuelta atrás, para cuando la envoltura ya está puesta: qué error
 * estaría enseñando esta celda si nadie lo hubiera tapado.
 */

/**
 * Lo que este error mostraría si nadie lo tapara.
 *
 * Si la celda envuelve su fórmula en `SI.ERROR(expr, valor_si_error)`, evalúa
 * `expr` SUELTA —sin la envoltura— y devuelve el error que enseñaría.
 * `null` si la celda no usa `SI.ERROR`, o si por debajo no hay ningún error
 * que tapar: tapar algo que no está roto no es lo que este bloque enseña a
 * mirar.
 */
export function errorTapadoPorSiError(motor: Motor, hoja: string, direccion: string): CodigoError | null {
  const a = parsear(crudoDe(motor.libro, hoja, direccion));
  if (!a.ok || a.arbol.t !== 'fn' || a.arbol.nombre !== 'SI.ERROR') return null;
  const [expr] = a.arbol.args;
  if (!expr) return null;
  const v = valorDeArbol(motor, expr, hoja);
  return esError(v) ? v.error : null;
}

/**
 * ¿Este libro trae macros? Bloque 56: es la señal que Excel de verdad mira
 * para pintar el aviso de «se han deshabilitado las macros» al abrir un
 * `.xlsm` — un archivo que trae ÓRDENES dentro, no sólo datos. No hay aquí un
 * sistema de seguridad: sólo la pregunta que un aviso de verdad necesitaría
 * contestar antes de pintarse.
 */
export function libroTieneMacros(libro: Libro): boolean {
  return Object.keys(libro.macros ?? {}).length > 0;
}

/* ── comparar sin tolerancias · la regla del día ────────────────────────────*/

/**
 * ¿Estos dos números son el mismo para la hoja?
 *
 * `0.1 + 0.2` y `0.3` **sí** lo son, porque la hoja los enseña iguales, que es
 * lo único que el alumno puede ver y lo único que puede corregirse. Y `1.0001`
 * y `1.0002` no lo son. No hay ningún épsilon aquí: hay una función de
 * presentación, la del propio programa.
 */
export function mismoNumero(a: number, b: number): boolean {
  return textoDeNumero(a) === textoDeNumero(b);
}

/** ¿La celda vale esto? La pregunta que hace el 90 % de los encargos. */
export function vale(motor: Motor, hoja: string, direccion: string, esperado: Valor): boolean {
  const v = valorDe(motor, hoja, direccion);
  if (typeof v === 'number' && typeof esperado === 'number') return mismoNumero(v, esperado);
  if (esError(v) && esError(esperado)) return v.error === esperado.error;
  return v === esperado;
}

/** ¿Dos celdas enseñan lo mismo? Para «el total de abajo y el de al lado». */
export function mismoValor(motor: Motor, hoja: string, a: string, b: string): boolean {
  const x = valorDe(motor, hoja, a);
  const y = valorDe(motor, hoja, b);
  if (typeof x === 'number' && typeof y === 'number') return mismoNumero(x, y);
  if (esError(x) && esError(y)) return x.error === y.error;
  return x === y;
}

/* ── contar ─────────────────────────────────────────────────────────────────*/

export function celdasEscritas(libro: Libro, hoja: string): number {
  return Object.keys(hojaDe(libro, hoja)?.celdas ?? {}).length;
}

export function celdasConFormula(libro: Libro, hoja: string): number {
  const h = hojaDe(libro, hoja);
  if (!h) return 0;
  return Object.values(h.celdas).filter((c) => esFormula(c.crudo)).length;
}

/* ── las tablas · bloques 33 a 36 ────────────────────────────────────────────*/

/** La tabla con este identificador, o `null`. Para preguntar sin montar ventana. */
export function tablaDe(libro: Libro, hoja: string, id: string): Tabla | null {
  return hojaDe(libro, hoja)?.tablas?.find((t) => t.id === id) ?? null;
}

/** ¿Esta fila se ve, con los filtros que tenga puestos su hoja ahora mismo? */
export function filaVisible(libro: Libro, hoja: string, fila: number): boolean {
  const h = hojaDe(libro, hoja);
  return h ? puestoDeFila(h, fila) >= 0 : false;
}

/**
 * El total de una columna de una tabla, «al estilo SUBTOTALES»: cuenta SÓLO
 * las filas que se ven ahora mismo (`puestoDeFila`). Es la única cuenta de
 * toda la hoja que sabe de filtros — una fórmula normal, `=SUMA(A1:A20)`,
 * sigue sumando las veinte aunque sólo tres se vean (`modelo.ts`, decisión
 * de la cabecera de `Hoja.visibles`), y es justo el contraste que este
 * bloque existe para enseñar.
 *
 * No hay una función `SUBTOTALES()` en el evaluador de fórmulas — no hace
 * falta una para que la fila de totales se COMPORTE como tal: el número que
 * ve el alumno se calcula aquí, en vivo, cada vez que se pregunta, leyendo
 * el valor CALCULADO de cada celda visible (`valorDeClave`, no el crudo).
 *
 * `'cuenta'` cuenta celdas NO VACÍAS —como `CONTARA`—, y no sólo números:
 * es la única de las cinco que tiene sentido en una columna de texto («¿a
 * cuántos clientes se ve ahora?»). Las demás ignoran lo que no es número,
 * la misma regla que ya siguen `SUMA`/`PROMEDIO`/`MAX`/`MIN` en
 * `funciones.ts`. `null` si la columna no tiene resumen puesto o no es de
 * esta tabla; `0` si suma sin ningún número visible que sumar.
 */
export function totalDeColumna(motor: Motor, hoja: string, tabla: Tabla, col: number): Valor {
  const resumen = tabla.filaDeTotales?.[col];
  if (!resumen || resumen === 'ninguno') return null;
  const caja = cajaDeTexto(tabla.rango);
  if (!caja || col < caja.c0 || col > caja.c1) return null;
  const h = hojaDe(motor.libro, hoja);
  const numeros: number[] = [];
  let noVacias = 0;
  for (let f = caja.f0 + 1; f <= caja.f1; f += 1) {
    if (h && puestoDeFila(h, f) < 0) continue; // escondida: no cuenta
    const v = valorDeClave(motor, clave(hoja, col, f));
    if (v === null) continue;
    noVacias += 1;
    if (typeof v === 'number') numeros.push(v);
  }
  if (resumen === 'cuenta') return noVacias;
  if (resumen === 'suma') return numeros.reduce((a, b) => a + b, 0);
  if (!numeros.length) return null;
  if (resumen === 'promedio') return numeros.reduce((a, b) => a + b, 0) / numeros.length;
  if (resumen === 'max') return Math.max(...numeros);
  return Math.min(...numeros); // 'min'
}

/* ── buscar, y por qué mirar el valor no es lo mismo que mirar la fórmula ────
 *
 * bloque 39. «Buscar 1000 no encuentra la celda que dice `=A1*10` aunque
 * enseñe 1000» es media lección del bloque, y es literalmente la diferencia
 * entre las dos ramas de este `if`: `enFormulas` mira `celda.crudo` —el texto
 * tal cual se escribió, con el `=` delante—, y sin él se mira lo que la
 * celda ENSEÑA (`valorDeClave`, pasado por `aTexto` como lo hace la barra de
 * fórmulas al revés).
 */

/**
 * Las celdas de `hoja` cuyo contenido —la fórmula, o lo que enseña— contiene
 * `buscar`, sin distinguir mayúsculas. Ordenadas por dirección, para que un
 * «Buscar siguiente» tenga un orden estable y no dependa de cómo Excel (o
 * este motor) recorrió el mapa por dentro.
 */
export function coincidencias(motor: Motor, hoja: string, buscar: string, enFormulas = false): Clave[] {
  const t = buscar.trim().toLowerCase();
  if (!t) return [];
  const h = hojaDe(motor.libro, hoja);
  if (!h) return [];
  const fuera: Clave[] = [];
  for (const d of Object.keys(h.celdas)) {
    const k = claveDeDireccion(hoja, d);
    if (!k) continue;
    const texto = enFormulas ? h.celdas[d].crudo : aTexto(valorDeClave(motor, k));
    if (texto.toLowerCase().includes(t)) fuera.push(k);
  }
  return fuera.sort();
}

/* ── ir a · una dirección, o un rango con nombre (bloque 39) ─────────────────
 *
 * Deliberadamente **no** toca `puestoDeFila`/`filaEnPuesto`: esta función
 * resuelve una dirección REAL —`{hoja, caja}`—, nunca un puesto en pantalla.
 * Es la regla de la geometría de filas dicha al revés: el sitio donde una
 * fila escondida se traduce a un puesto de pantalla es cosa de quien mueve el
 * cursor y hace scroll (`VentanaHojas.tsx`, con `filaTrasDesplazamiento`), no
 * de quien resuelve a qué celda real apunta el texto que se escribió en el
 * cuadro de «Ir a». Por eso «ir a» respeta una fila escondida por un filtro:
 * no hay ningún cálculo de píxel aquí dentro que pueda equivocarse de fila.
 */
export interface DestinoDeIrA {
  hoja: string;
  caja: Caja;
}

/**
 * `"B5"`, `"Gastos!B5:B9"` o el nombre de un rango bautizado (`nombrarRango`,
 * bloque 22) — las tres formas que acepta el cuadro de nombres de Excel.
 * `null` si no se entiende nada de eso.
 */
export function resolverIrA(libro: Libro, hojaActual: string, texto: string): DestinoDeIrA | null {
  const t = texto.trim();
  if (!t) return null;
  const nombre = Object.keys(libro.nombres).find((n) => n.toLowerCase() === t.toLowerCase());
  const crudo = nombre ? libro.nombres[nombre] : t;
  const i = crudo.indexOf('!');
  const hojaTxt = i >= 0 ? crudo.slice(0, i) : null;
  const rangoTxt = i >= 0 ? crudo.slice(i + 1) : crudo;
  const hojaId = hojaTxt ? (hojaPorNombre(libro, hojaTxt)?.id ?? null) : hojaActual;
  if (!hojaId || !hojaDe(libro, hojaId)) return null;
  const caja = cajaDeTexto(rangoTxt);
  return caja ? { hoja: hojaId, caja } : null;
}

/* ── inspeccionar · un parte del libro (bloque 42) ───────────────────────── */

export interface ParteDelLibro {
  formulas: number;
  errores: number;
  /**
   * Celdas vacías dentro de `rango`. `null` sin `rango`: fuera de un rango de
   * datos «vacía» no significa nada —toda la hoja, hasta la fila 1.048.576,
   * está vacía—, así que un `0` ahí fingiría haber contado algo.
   */
  vaciasEnRango: number | null;
  hojasEscondidas: number;
  /** El veredicto entero de `verificar()`, por si hace falta el detalle. */
  veredicto: Veredicto;
}

/**
 * Lo que hace falta para entender una hoja ajena de un vistazo, sin abrir
 * celda por celda: cuántas fórmulas tiene, cuántos errores enseña, cuántas
 * celdas de un rango están vacías y cuántas hojas del libro están ocultas.
 *
 * Reusa `verificar()`, que ya recalcula desde cero y cuenta los errores —la
 * mitad honesta del trabajo, la misma que pide la cabecera de este archivo:
 * no fiarse de una caché que podría mentir.
 */
export function inspeccionar(motor: Motor, hoja: string, rango?: string): ParteDelLibro {
  const veredicto = verificar(motor);
  const caja = rango ? cajaDeTexto(rango) : null;
  let vaciasEnRango: number | null = null;
  if (caja) {
    let n = 0;
    for (let f = caja.f0; f <= caja.f1; f += 1) {
      for (let c = caja.c0; c <= caja.c1; c += 1) {
        if (estaVacia(motor.libro, hoja, dir(c, f))) n += 1;
      }
    }
    vaciasEnRango = n;
  }
  return {
    formulas: celdasConFormula(motor.libro, hoja),
    errores: veredicto.errores,
    vaciasEnRango,
    hojasEscondidas: motor.libro.hojas.filter((h) => h.oculta === true).length,
    veredicto,
  };
}
