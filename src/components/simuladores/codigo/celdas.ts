/**
 * Tecnia Código · `celdas.ts` — un archivo con varios programas dentro.
 *
 * ── El problema que resuelve (§68.4) ─────────────────────────────────────────
 *
 * El juez de programas juzga **el archivo entero** como un programa: lo que se
 * teclea entra por `input` y lo que sale por `print` es la respuesta. Una clase
 * de N7 tiene tres problemas, y tres programas no caben en un archivo sin
 * estorbarse: al pulsar ▶ en el tercero, el primero vuelve a preguntar la edad.
 *
 * ── La convención, que no es inventada ──────────────────────────────────────
 *
 * `# %%` es como VS Code, Spyder y PyCharm parten un `.py` en celdas que se
 * corren por separado. Una línea `# %% Problema 2 · En 2030` abre la celda
 * «Problema 2 · En 2030», que llega hasta la siguiente `# %%` o el final.
 *
 * ── Recortar sin mover una línea ─────────────────────────────────────────────
 *
 * `recortarCelda` no corta el texto: **deja en blanco** todo lo que no es de la
 * celda. Así el programa conserva su numeración y un error de la celda sale con
 * la línea que el alumno ve en su editor —la misma regla que lleva al juez de
 * funciones a pegar su llamada al final y nunca al principio—.
 */

const MARCA = /^\s*#\s*%%(.*)$/;

export interface Celda {
  /** Lo que va detrás de `# %%`, sin espacios alrededor. */
  nombre: string;
  /** La línea de la marca, contando desde 1. */
  linea: number;
}

/** Las celdas del archivo, en orden. */
export function celdasDe(texto: string): Celda[] {
  const celdas: Celda[] = [];
  texto.split('\n').forEach((l, i) => {
    const m = MARCA.exec(l.replace(/\r$/, ''));
    if (m) celdas.push({ nombre: m[1].trim(), linea: i + 1 });
  });
  return celdas;
}

/**
 * ¿La celda `nombre` empieza por `prefijo`? «Problema 1» no puede encontrar
 * «Problema 12»: detrás del prefijo tiene que venir el final o algo que no sea
 * una cifra.
 */
function empiezaPor(nombre: string, prefijo: string): boolean {
  if (!nombre.toLowerCase().startsWith(prefijo.toLowerCase())) return false;
  const siguiente = nombre.charAt(prefijo.length);
  return siguiente === '' || !/[0-9]/.test(siguiente);
}

/**
 * El programa de una sola celda, con el resto de líneas en blanco, o `null` si
 * la celda no está en el archivo (el alumno borró o cambió su marca).
 */
export function recortarCelda(texto: string, prefijo: string): string | null {
  const lineas = texto.split('\n');
  const celdas = celdasDe(texto);
  const i = celdas.findIndex((c) => empiezaPor(c.nombre, prefijo));
  if (i === -1) return null;
  const desde = celdas[i].linea; // la marca, que es un comentario: se queda
  const hasta = i + 1 < celdas.length ? celdas[i + 1].linea - 1 : lineas.length;
  return lineas.map((l, n) => (n + 1 >= desde && n + 1 <= hasta ? l : '')).join('\n');
}
