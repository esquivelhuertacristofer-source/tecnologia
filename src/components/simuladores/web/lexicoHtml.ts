/**
 * Tecnia Web · `lexicoHtml.ts` — de texto a fichas, tolerando lo mal escrito.
 *
 * Mismo método que `office/motor-hojas/formula/lexico.ts` y que el léxico del
 * intérprete de Python: **una pasada de izquierda a derecha, sin expresiones
 * regulares sobre el documento entero, y los tropiezos como datos**. Una
 * expresión regular que busca `<([a-z]+)>` es lo que se escribe la primera
 * tarde y es lo que se rompe con `<p title="a>b">`.
 *
 * ── Lo que este archivo NO decide ──────────────────────────────────────────
 *
 * No sabe qué etiquetas existen, ni cuáles se cierran solas, ni qué atributos
 * valen. Aquí sólo se parte el texto: «esto es una etiqueta que abre y se
 * llama así, con estos atributos». Quién es hijo de quién lo decide
 * `arbolHtml.ts`; qué está permitido, `subconjunto.ts`. Son tres decisiones
 * distintas y se toman en tres sitios distintos.
 *
 * La única excepción, y es de las que hay que declarar: el léxico **sí**
 * necesita saber qué etiquetas llevan texto crudo dentro (`<style>`,
 * `<title>`, `<textarea>`, y `<script>` que además está prohibida), porque
 * dentro de ellas un `<` no abre nada. Sin eso, un `<style>` con `a < b`
 * dentro rompería el documento entero.
 *
 * ── Las cuatro decisiones de tolerancia ────────────────────────────────────
 *
 * 1. **Una comilla sin cerrar no se come el resto del documento.** Se corta al
 *    final de la línea. Es tolerancia con aviso: un valor de atributo repartido
 *    en dos líneas es rarísimo en clase, y tragarse media página es el peor
 *    resultado posible.
 * 2. **Un `<` que no abre etiqueta es texto**, y se avisa. `3 < 5` se ve en la
 *    página tal cual, que es lo que el alumno quería.
 * 3. **Una etiqueta sin `>` al final del archivo se emite igual**, con lo que
 *    se haya leído. Es el estado normal de un documento a medio teclear.
 * 4. **Los nombres se pasan a minúsculas**, porque en HTML `<DIV>` y `<div>`
 *    son la misma etiqueta. Lo que se guarda para pintar el error es el
 *    nombre tal cual lo escribió el alumno.
 */

import { Cursor } from './cursor';
import { esCrudo } from './subconjunto';
import { problema, type ProblemaWeb } from './errores';

export interface AtributoFicha {
  /** En minúsculas. */
  nombre: string;
  /** Tal cual lo escribió el alumno, para los mensajes. */
  nombreCrudo: string;
  /** `null` cuando el atributo va solo: `<input required>`. */
  valor: string | null;
  /** `null` = venía sin comillas. */
  comillas: '"' | "'" | null;
  linea: number;
  col: number;
}

export type FichaHtml =
  | { tipo: 'texto'; texto: string; linea: number; col: number }
  | { tipo: 'apertura'; nombre: string; nombreCrudo: string; atributos: AtributoFicha[]; autocierre: boolean; linea: number; col: number }
  | { tipo: 'cierre'; nombre: string; nombreCrudo: string; linea: number; col: number }
  | { tipo: 'comentario'; texto: string; linea: number; col: number }
  | { tipo: 'doctype'; linea: number; col: number };

export interface LecturaHtml {
  fichas: FichaHtml[];
  problemas: ProblemaWeb[];
}

function esLetra(c: string): boolean {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}

function esNombre(c: string): boolean {
  return esLetra(c) || (c >= '0' && c <= '9') || c === '-' || c === '_' || c === ':';
}

function esEspacio(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f';
}

export function leerFichasHtml(fuente: string, origen = 'index.html'): LecturaHtml {
  const c = new Cursor(fuente);
  const fichas: FichaHtml[] = [];
  const problemas: ProblemaWeb[] = [];
  /** Dentro de `<style>` / `<title>` / `<textarea>` / `<script>`: el `<` no abre nada. */
  let crudoDe: string | null = null;
  /* Una sola vez, no una por cada `<style>`: buscar el cierre sin distinguir
   * mayúsculas es lo único que necesita el documento en minúsculas, y hacerlo
   * dentro del bucle convertía el léxico en cuadrático. */
  let enMinusculas: string | null = null;

  const emitirTexto = (desde: number, linea: number, col: number): void => {
    if (c.i <= desde) return;
    fichas.push({ tipo: 'texto', texto: fuente.slice(desde, c.i), linea, col });
  };

  while (!c.fin) {
    if (crudoDe !== null) {
      /* Texto crudo: se lee hasta el `</nombre` que lo cierra, mirando sin
       * distinguir mayúsculas, y sin interpretar NADA por el camino. */
      const cierre = `</${crudoDe}`;
      if (enMinusculas === null) enMinusculas = fuente.toLowerCase();
      const donde = enMinusculas.indexOf(cierre, c.i);
      const linea = c.linea;
      const col = c.col;
      const desde = c.i;
      if (donde === -1) {
        c.avanzar(fuente.length - c.i);
        emitirTexto(desde, linea, col);
        problemas.push(
          problema('sin-cerrar', 'error', `la etiqueta «${crudoDe}» se quedó abierta hasta el final del archivo`, {
            origen,
            linea,
            pista: `falta un «</${crudoDe}>»`,
          }),
        );
        crudoDe = null;
        break;
      }
      c.avanzar(donde - c.i);
      emitirTexto(desde, linea, col);
      crudoDe = null;
      continue;
    }

    if (c.ver() !== '<') {
      const linea = c.linea;
      const col = c.col;
      const desde = c.i;
      while (!c.fin && c.ver() !== '<') c.avanzar();
      emitirTexto(desde, linea, col);
      continue;
    }

    const linea = c.linea;
    const col = c.col;
    const siguiente = c.ver(1);

    /* Comentario */
    if (siguiente === '!' && c.ver(2) === '-' && c.ver(3) === '-') {
      const desde = c.i + 4;
      const cierre = fuente.indexOf('-->', desde);
      if (cierre === -1) {
        problemas.push(
          problema('sin-cerrar', 'aviso', 'este comentario no se cierra', {
            origen,
            linea,
            columna: col,
            pista: 'los comentarios van entre «<!--» y «-->»',
          }),
        );
        fichas.push({ tipo: 'comentario', texto: fuente.slice(desde), linea, col });
        c.avanzar(fuente.length - c.i);
        continue;
      }
      fichas.push({ tipo: 'comentario', texto: fuente.slice(desde, cierre), linea, col });
      c.avanzar(cierre + 3 - c.i);
      continue;
    }

    /* <!DOCTYPE html> */
    if (siguiente === '!') {
      const cierre = fuente.indexOf('>', c.i);
      fichas.push({ tipo: 'doctype', linea, col });
      c.avanzar((cierre === -1 ? fuente.length : cierre + 1) - c.i);
      continue;
    }

    /* Etiqueta que cierra */
    if (siguiente === '/') {
      c.avanzar(2);
      const desde = c.i;
      while (!c.fin && esNombre(c.ver())) c.avanzar();
      const nombreCrudo = fuente.slice(desde, c.i);
      c.saltarEspacios();
      if (c.ver() === '>') c.avanzar();
      if (nombreCrudo === '') {
        problemas.push(
          problema('etiqueta-sin-nombre', 'error', 'hay un «</>» sin nombre de etiqueta', {
            origen,
            linea,
            columna: col,
            pista: 'al cerrar hay que decir qué se cierra: «</p>», «</div>»',
          }),
        );
        continue;
      }
      fichas.push({ tipo: 'cierre', nombre: nombreCrudo.toLowerCase(), nombreCrudo, linea, col });
      continue;
    }

    /* Etiqueta que abre */
    if (esLetra(siguiente)) {
      c.avanzar();
      const desde = c.i;
      while (!c.fin && esNombre(c.ver())) c.avanzar();
      const nombreCrudo = fuente.slice(desde, c.i);
      const nombre = nombreCrudo.toLowerCase();
      const atributos: AtributoFicha[] = [];
      let autocierre = false;

      for (;;) {
        c.saltarEspacios();
        if (c.fin) {
          problemas.push(
            problema('sin-cerrar', 'error', `la etiqueta «${nombre}» se quedó sin el «>» que la cierra`, {
              origen,
              linea,
              columna: col,
              pista: 'toda etiqueta termina en «>»',
            }),
          );
          break;
        }
        if (c.ver() === '>') {
          c.avanzar();
          break;
        }
        if (c.ver() === '/' && c.ver(1) === '>') {
          autocierre = true;
          c.avanzar(2);
          break;
        }
        /* Un `<` dentro de una etiqueta: casi siempre es un `>` que falta. */
        if (c.ver() === '<') {
          problemas.push(
            problema('sin-cerrar', 'error', `a la etiqueta «${nombre}» le falta el «>»`, {
              origen,
              linea,
              columna: col,
              pista: 'empezó otra etiqueta antes de que ésta terminara',
            }),
          );
          break;
        }
        if (!esNombre(c.ver())) {
          c.avanzar();
          continue;
        }

        const lineaAtr = c.linea;
        const colAtr = c.col;
        const desdeAtr = c.i;
        while (!c.fin && esNombre(c.ver())) c.avanzar();
        const nombreAtrCrudo = fuente.slice(desdeAtr, c.i);
        c.saltarEspacios();

        if (c.ver() !== '=') {
          atributos.push({
            nombre: nombreAtrCrudo.toLowerCase(),
            nombreCrudo: nombreAtrCrudo,
            valor: null,
            comillas: null,
            linea: lineaAtr,
            col: colAtr,
          });
          continue;
        }
        c.avanzar();
        c.saltarEspacios();

        const comilla = c.ver();
        if (comilla === '"' || comilla === "'") {
          c.avanzar();
          const desdeVal = c.i;
          while (!c.fin && c.ver() !== comilla && c.ver() !== '\n') c.avanzar();
          const valor = fuente.slice(desdeVal, c.i);
          if (c.ver() === comilla) {
            c.avanzar();
          } else {
            problemas.push(
              problema('comillas-sin-cerrar', 'error', `al valor de «${nombreAtrCrudo}» le falta la comilla de cierre`, {
                origen,
                linea: lineaAtr,
                columna: colAtr,
                pista: `abriste con ${comilla} y no la cerraste; tiene que haber dos`,
              }),
            );
          }
          atributos.push({
            nombre: nombreAtrCrudo.toLowerCase(),
            nombreCrudo: nombreAtrCrudo,
            valor,
            comillas: comilla,
            linea: lineaAtr,
            col: colAtr,
          });
          continue;
        }

        const desdeVal = c.i;
        while (!c.fin && !esEspacio(c.ver()) && c.ver() !== '>' && c.ver() !== '<') c.avanzar();
        const valor = fuente.slice(desdeVal, c.i);
        problemas.push(
          problema('sin-comillas', 'aviso', `el valor de «${nombreAtrCrudo}» va sin comillas`, {
            origen,
            linea: lineaAtr,
            columna: colAtr,
            pista: `escríbelo así: ${nombreAtrCrudo}="${valor}" — sin comillas, un valor con espacios se parte en dos`,
          }),
        );
        atributos.push({
          nombre: nombreAtrCrudo.toLowerCase(),
          nombreCrudo: nombreAtrCrudo,
          valor,
          comillas: null,
          linea: lineaAtr,
          col: colAtr,
        });
      }

      fichas.push({ tipo: 'apertura', nombre, nombreCrudo, atributos, autocierre, linea, col });
      if (!autocierre && esCrudo(nombre)) crudoDe = nombre;
      continue;
    }

    /* Un `<` que no abre nada: es texto, y se avisa. */
    problemas.push(
      problema('menor-suelto', 'aviso', 'este «<» no abre ninguna etiqueta y se va a ver tal cual', {
        origen,
        linea,
        columna: col,
        pista: 'si querías escribir el signo «menor que», se escribe «&lt;»',
      }),
    );
    const desde = c.i;
    c.avanzar();
    while (!c.fin && c.ver() !== '<') c.avanzar();
    emitirTexto(desde, linea, col);
  }

  return { fichas, problemas };
}
