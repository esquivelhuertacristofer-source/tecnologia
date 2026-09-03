/**
 * Tecnia Web · `errores.ts` — los errores son material de clase.
 *
 * Copiado de método (no de contenido) de `codigo/errores.ts`. Un armazón que
 * enseña HTML y no sabe decir **dónde** está la etiqueta sin cerrar no enseña
 * HTML: enseña a probar cosas hasta que salga.
 *
 * Cada problema lleva cuatro cosas y las cuatro son obligatorias:
 *
 *   1. el **qué**, en español y sin jerga — «cerraste «b» pero lo último que
 *      abriste fue «i»»;
 *   2. **dónde**: archivo, línea y —cuando se sabe— columna;
 *   3. la **pista**, que es lo que suele causarlo;
 *   4. la **familia**: cómo se llama eso mismo en las herramientas de un
 *      navegador de verdad. Se enseña de segundo, no de primero, igual que
 *      `NameError` en el intérprete de Python.
 *
 * ── Dos severidades, y la diferencia importa ───────────────────────────────
 *
 * `error` es lo que el navegador no puede hacer como el alumno pidió (una
 * propiedad que no existe, una llave sin cerrar). `aviso` es lo que **sí
 * funciona pero está mal hecho**: una imagen sin texto alternativo, un
 * atributo sin comillas, una regla de estilo que no pinta nada porque ninguna
 * etiqueta la usa. Meter las dos cosas en el mismo saco es lo que convierte
 * los avisos en ruido que nadie lee.
 *
 * **La página se pinta igual, con errores y todo.** Un analizador que se queda
 * en blanco porque falta un `</p>` le da al alumno la peor información posible:
 * ninguna. Ver lo que hay + el aviso de lo que está mal es la lección.
 *
 * Regla de la casa (§45.5): **nada de este paquete lanza a través de la puerta
 * pública**. Los problemas se devuelven como datos, en una lista.
 */

export type ClaseProblema =
  /* HTML */
  | 'etiqueta-desconocida'
  | 'etiqueta-prohibida'
  | 'sin-cerrar'
  | 'cierre-sobrante'
  | 'mal-anidada'
  | 'atributo-desconocido'
  | 'atributo-prohibido'
  | 'comillas-sin-cerrar'
  | 'sin-comillas'
  | 'menor-suelto'
  | 'etiqueta-sin-nombre'
  | 'pagina-vacia'
  | 'sin-alt'
  | 'sin-enlace-css'
  | 'imagen-que-no-existe'
  | 'pagina-que-no-existe'
  /* CSS */
  | 'llave-sin-cerrar'
  | 'llave-sobrante'
  | 'falta-dos-puntos'
  | 'falta-punto-y-coma'
  | 'propiedad-desconocida'
  | 'propiedad-prohibida'
  | 'valor-invalido'
  | 'selector-invalido'
  | 'selector-sin-uso'
  | 'regla-no-soportada'
  | 'comentario-sin-cerrar'
  | 'declaracion-vacia';

/**
 * Cómo se llama eso mismo en la consola de un navegador de verdad o en el
 * validador del W3C. El alumno lo va a leer algún día en inglés; que no sea la
 * primera vez.
 */
const FAMILIA: Readonly<Record<ClaseProblema, string>> = {
  'etiqueta-desconocida': 'unknown element',
  'etiqueta-prohibida': 'blocked element',
  'sin-cerrar': 'unclosed element',
  'cierre-sobrante': 'stray end tag',
  'mal-anidada': 'misnested tags',
  'atributo-desconocido': 'unknown attribute',
  'atributo-prohibido': 'blocked attribute',
  'comillas-sin-cerrar': 'unterminated attribute value',
  'sin-comillas': 'unquoted attribute value',
  'menor-suelto': 'stray "<"',
  'etiqueta-sin-nombre': 'malformed tag',
  'pagina-vacia': 'empty document',
  'sin-alt': 'image without alt text',
  'sin-enlace-css': 'stylesheet not linked',
  'imagen-que-no-existe': 'broken image',
  'pagina-que-no-existe': 'broken link',
  'llave-sin-cerrar': 'unclosed block',
  'llave-sobrante': 'stray "}"',
  'falta-dos-puntos': 'missing ":"',
  'falta-punto-y-coma': 'missing ";"',
  'propiedad-desconocida': 'unknown property',
  'propiedad-prohibida': 'unsupported property',
  'valor-invalido': 'invalid value',
  'selector-invalido': 'invalid selector',
  'selector-sin-uso': 'rule matches nothing',
  'regla-no-soportada': 'unsupported at-rule',
  'comentario-sin-cerrar': 'unclosed comment',
  'declaracion-vacia': 'empty declaration',
};

export type Severidad = 'error' | 'aviso';

export interface ProblemaWeb {
  clase: ClaseProblema;
  severidad: Severidad;
  /** El nombre del archivo: «index.html», «estilo.css». */
  origen: string;
  /** 1 en adelante. `0` sólo si el problema no es de ninguna línea. */
  linea: number;
  /** 1 en adelante, para el dedo debajo. `null` si no se sabe. */
  columna: number | null;
  /** En español, en minúscula y sin punto final. */
  mensaje: string;
  pista: string | null;
  familia: string;
}

export interface SitioProblema {
  origen?: string;
  linea?: number;
  columna?: number | null;
  /** `null` explícito y `undefined` son lo mismo: no hay nada que decir. */
  pista?: string | null;
}

export function problema(
  clase: ClaseProblema,
  severidad: Severidad,
  mensaje: string,
  sitio: SitioProblema = {},
): ProblemaWeb {
  return {
    clase,
    severidad,
    origen: sitio.origen ?? '',
    linea: sitio.linea ?? 0,
    columna: sitio.columna ?? null,
    mensaje,
    pista: sitio.pista ?? null,
    familia: FAMILIA[clase],
  };
}

/**
 * El problema como se lee, con la línea culpable y el dedo debajo.
 *
 *     index.html · línea 6 · cerraste «b» pero lo último que abriste fue «i»
 *         <p><b><i>hola</b></i></p>
 *                          ^
 *         Pista: se cierran en orden inverso al que se abrieron: </i> y luego </b>
 *         (en las herramientas del navegador esto sale como «misnested tags»)
 *
 * Es el mismo cálculo del tabulador que hace `codigo/errores.ts`: cada
 * tabulador ocupa cuatro al pintarlo, o el dedo señala a otro sitio justo en
 * los archivos con tabuladores, que son los que más ayuda necesitan.
 */
export function textoDeProblema(p: ProblemaWeb, fuente?: string): string {
  const partes: string[] = [];
  const sitio = [p.origen, p.linea > 0 ? `línea ${p.linea}` : ''].filter((x) => x !== '').join(' · ');
  partes.push(sitio === '' ? p.mensaje : `${sitio} · ${p.mensaje}`);

  if (fuente && p.linea > 0) {
    const linea = fuente.replace(/\r\n?/g, '\n').split('\n')[p.linea - 1];
    if (linea !== undefined && linea.trim() !== '') {
      partes.push(`    ${linea.replace(/\t/g, '    ')}`);
      if (p.columna !== null && p.columna > 0) {
        const desplazamiento = linea.slice(0, p.columna - 1).replace(/\t/g, '    ').length;
        partes.push(`    ${' '.repeat(desplazamiento)}^`);
      }
    }
  }

  if (p.pista) partes.push(`    Pista: ${p.pista}`);
  partes.push(`    (en las herramientas del navegador esto sale como «${p.familia}»)`);
  return partes.join('\n');
}

/** Sin problemas. Se devuelve SIEMPRE la misma, para que `toBe` valga. */
export const SIN_PROBLEMAS: readonly ProblemaWeb[] = Object.freeze([]);
