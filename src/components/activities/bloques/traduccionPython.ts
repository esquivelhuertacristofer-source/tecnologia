/**
 * TECNIA BLOQUES · `n6-bloques-vs-codigo` — el traductor a Python.
 *
 * Puro: ni React, ni DOM, ni reloj. Convierte el árbol de bloques del alumno
 * en el texto de Python que le corresponde, y devuelve además el mapa
 * `bloqueId → línea` que sincroniza `nodoActivo` (el intérprete de bloques,
 * que corre sobre una FOTO del árbol) con `lineaEnCurso` (el editor de texto,
 * que pinta el árbol VIVO). Ese mapa es la pieza central del riesgo nº 1 del
 * pliego de diseño: si miente, la clase enseña lo contrario de lo que
 * promete — se ve encenderse un bloque y una línea que no es la suya.
 *
 * Reglas, tal como las fija `DISENO-N6-bloques-vs-codigo.md`:
 *
 * - Línea 1 fija: el comentario `# el mismo programa, escrito en Python`. Las
 *   líneas de bloques empiezan en la 2.
 * - El sombrero NO produce línea y NO entra en `lineaDe`: es el encargo 7.
 * - `decir` → `print("...")`, con las comillas y las barras invertidas del
 *   texto del alumno escapadas.
 * - `decir-vuelta` → `print(vuelta)`.
 * - `repetir` → `for vuelta in range(n):`, y el cuerpo sangrado con
 *   `SANGRIA * profundidad` espacios — la misma constante que usa la parada 2
 *   para el `if`, nunca un `4` escrito a mano. Recursivo: un `repetir` dentro
 *   de otro suma un nivel más de sangría.
 * - Un `repetir` con la boca vacía escribe `pass` para seguir siendo Python
 *   válido, y esa línea del `pass` NO entra en `lineaDe`: no hay ningún
 *   bloque que sea suyo.
 *
 * Nunca lee el reloj, nunca toca el DOM. El 100 % de sus pruebas son de
 * cadenas: entra un `Programa` armado a mano, sale un texto y un mapa.
 */

import {
  fichaDe,
  verboDe,
  type BloquePuesto,
  type FichaBloque,
  type Programa,
} from '@/components/simuladores/bloques';
import { SANGRIA } from '@/components/simuladores/codigo/ventana';

export interface Traduccion {
  texto: string;
  lineaDe: Readonly<Record<string, number>>;
}

const COMENTARIO = '# el mismo programa, escrito en Python';

function comoTextoDeArgs(valor: string | number | undefined): string {
  const cadena = String(valor ?? '');
  return cadena.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Un bloque y todo lo que cuelga de él, escritos como líneas de Python. */
function escribirBloque(
  bloque: BloquePuesto,
  catalogo: readonly FichaBloque[],
  profundidad: number,
  lineas: string[],
  lineaDe: Record<string, number>,
): void {
  const ficha = fichaDe(catalogo, bloque.ficha);
  if (!ficha) return; // Ficha que ya no está en la paleta: se salta, no revienta.

  const sangria = ' '.repeat(SANGRIA * profundidad);
  const sem = ficha.semantica;

  if (sem.tipo === 'sombrero') {
    // El sombrero no tiene línea de texto: un archivo empieza por la primera
    // línea y ya. A propósito no se registra en `lineaDe` (encargo 7).
    return;
  }

  if (sem.tipo === 'repetir') {
    const bruto = bloque.args?.[sem.ranura ?? 'veces'] ?? sem.veces ?? 1;
    const veces = typeof bruto === 'number' ? bruto : Number(bruto);
    lineas.push(`${sangria}for vuelta in range(${Number.isFinite(veces) ? veces : 0}):`);
    lineaDe[bloque.id] = lineas.length;

    const cuerpo = bloque.ramas?.cuerpo ?? [];
    if (cuerpo.length === 0) {
      // Boca vacía: sin un `pass` el texto no es Python válido y el
      // coloreador lo pintaría como error donde no lo hay. El `pass` es una
      // línea sin bloque dueño: no entra en `lineaDe`.
      lineas.push(`${sangria}    pass`);
    } else {
      for (const hijo of cuerpo) escribirBloque(hijo, catalogo, profundidad + 1, lineas, lineaDe);
    }
    return;
  }

  // Una acción: `decir`, `decir-vuelta`, o cualquier otra que traiga su
  // propio `texto` de fábrica en la ficha (ver `arbolBloques.ts:83-93`).
  const verbo = verboDe(ficha);
  let linea: string;
  if (verbo === 'decir') {
    linea = `${sangria}print("${comoTextoDeArgs(bloque.args?.que)}")`;
  } else if (verbo === 'decir-vuelta') {
    linea = `${sangria}print(vuelta)`;
  } else if (ficha.texto) {
    linea = `${sangria}${ficha.texto}`;
  } else {
    linea = `${sangria}pass`;
  }
  lineas.push(linea);
  lineaDe[bloque.id] = lineas.length;
}

/**
 * El árbol de bloques del alumno, convertido a Python.
 *
 * Sólo recorre el tronco de cada pila (`Pila.bloques`); esta clase no usa
 * hexágonos ni condiciones sueltas, así que no hace falta bajar por
 * `condicion`. El sombrero de cada pila se ignora aquí mismo, no en el
 * recorrido: es la misma regla que dentro de `escribirBloque`.
 */
export function traducir(programa: Programa, catalogo: readonly FichaBloque[]): Traduccion {
  const lineas: string[] = [COMENTARIO];
  const lineaDe: Record<string, number> = {};
  for (const p of programa.pilas) {
    for (const b of p.bloques) escribirBloque(b, catalogo, 0, lineas, lineaDe);
  }
  return { texto: lineas.join('\n'), lineaDe };
}
