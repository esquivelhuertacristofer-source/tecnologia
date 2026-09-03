/**
 * Prueba de concepto · el verificador.
 *
 * Mismo molde que `Veredicto` / `verificar()` de
 * `src/components/office/motor/paginador.ts:452-530`: devuelve **enteros** y un
 * `detalle` de texto, y es el instrumento DE PRODUCCIÓN, no una copia. Se
 * cuelga de `window.__verificarDiapo` desde el banco por la lección de §36.5:
 * una sonda que trae su propia medición se queda atrás y acaba midiendo otra
 * cosa que el motor.
 *
 * Las cinco cifras se eligieron por lo que de verdad puede salir mal en una
 * diapositiva de clase, no por simetría:
 *
 * 1. `fuera`   — cajas que no caben enteras en el lienzo.
 * 2. `tapados` — pares de cajas que se pisan.
 * 3. `vacios`  — marcadores que el diseño pide y nadie llenó.
 * 4. `sueltos` — cajas cuya casilla dejó de ser entera. Si esto no es 0, el
 *                modelo se rompió y todo lo demás es mentira.
 * 5. `rebosan` — textos más largos que su caja.
 *
 * Las cuatro primeras se contestan con enteros de la rejilla y viven en
 * `consultas.ts`. La quinta es la única que necesita al navegador, y aun así
 * no lleva tolerancia: se le pregunta al propio elemento si su contenido no le
 * cabe (`scrollHeight > clientHeight`), que es un booleano que da el motor de
 * maquetación, no una comparación nuestra con un épsilon.
 */

import { cajas, dentroDelLienzo, enLaRejilla, marcadoresVacios, paresQueSeTapan } from './consultas';
import type { Diapositiva } from './modelo';

export interface Veredicto {
  fuera: number;
  tapados: number;
  vacios: number;
  sueltos: number;
  rebosan: number;
  detalle: string[];
}

/**
 * Cuenta los textos que no caben en su caja.
 *
 * `dom` es el lienzo pintado. Se busca cada caja por `data-caja` y se le
 * pregunta al navegador. Se admite `null` para poder verificar el modelo sin
 * pantalla —que es la mitad de la gracia de tener consultas puras—; entonces
 * `rebosan` vale 0 y el detalle lo dice, en vez de callarse.
 */
function contarRebosados(dom: HTMLElement | null, detalle: string[]): number {
  if (!dom) {
    detalle.push('sin pantalla: «rebosan» no se midió');
    return 0;
  }
  let n = 0;
  for (const el of Array.from(dom.querySelectorAll<HTMLElement>('[data-texto]'))) {
    // Sin holgura y sin épsilon: o el navegador dice que no cabe, o cabe.
    if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
      n += 1;
      detalle.push(`rebosa: «${(el.textContent ?? '').slice(0, 24)}…»`);
    }
  }
  return n;
}

/** Vuelve a mirar y dice la verdad. Es lo que convierte «se ve bien» en cifras. */
export function verificar(d: Diapositiva, dom: HTMLElement | null = null): Veredicto {
  const detalle: string[] = [];

  let fuera = 0;
  let sueltos = 0;
  for (const { nombre, casilla } of cajas(d)) {
    if (!enLaRejilla(casilla)) {
      sueltos += 1;
      detalle.push(
        `fuera de la rejilla: ${nombre} en ${casilla.col},${casilla.fila} ${casilla.cols}×${casilla.filas}`,
      );
      continue;
    }
    if (!dentroDelLienzo(casilla)) {
      fuera += 1;
      detalle.push(`fuera del lienzo: ${nombre} acaba en la columna ${casilla.col + casilla.cols}`);
    }
  }

  const pares = paresQueSeTapan(d);
  for (const [a, b] of pares) detalle.push(`se tapan: ${a} y ${b}`);

  const vacios = marcadoresVacios(d);
  for (const rol of vacios) detalle.push(`marcador vacío: ${rol}`);

  return {
    fuera,
    tapados: pares.length,
    vacios: vacios.length,
    sueltos,
    rebosan: contarRebosados(dom, detalle),
    detalle,
  };
}

/** Como `inspeccionar()` del paginador: lo que ve el verificador, en crudo. */
export function inspeccionar(d: Diapositiva) {
  return cajas(d).map(({ nombre, casilla }) => ({
    caja: nombre,
    col: casilla.col,
    fila: casilla.fila,
    cols: casilla.cols,
    filas: casilla.filas,
    entera: enLaRejilla(casilla),
    dentro: dentroDelLienzo(casilla),
  }));
}
