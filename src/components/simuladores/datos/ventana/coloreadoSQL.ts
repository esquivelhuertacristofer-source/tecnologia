/**
 * Tecnia Datos · `coloreadoSQL.ts` — de texto a colores, con el léxico de verdad.
 *
 * La misma técnica que `codigo/ventana/coloreado.ts`, y por la misma razón:
 * colorear es una **función pura del texto** que se apoya en
 * `leerFichasTolerante` —el mismo léxico que ejecuta la consulta, no un
 * segundo analizador con su propia lista de palabras—. Si el día de mañana
 * `INNER` deja de ser palabra clave o entra `LEFT JOIN`, cambia
 * `subconjunto.ts` y el coloreado lo hereda solo. Con dos analizadores, el
 * editor pintaría `LEFT` de azul (palabra prohibida) mientras el motor ya la
 * acepta, o al revés.
 *
 * El tipo que se produce (`LineaPintada`, con sus `Tramo` y su `Color`) es el
 * MISMO que usa `EditorCodigo` — se importa el tipo de
 * `codigo/ventana/coloreado.ts`, no se declara uno nuevo — porque
 * `EditorCodigoProps.lineas` exige exactamente esa forma y el editor no se
 * reescribe (encargo, cabecera). Lo que cambia de Python a SQL es sólo QUIÉN
 * decide de qué color va cada ficha.
 *
 * ── La regla que no se rompe nunca (igual que en Python) ───────────────────
 *
 * **La suma de los tramos de una línea es la línea, carácter por carácter.**
 * La capa de colores va debajo del `<textarea>` y un espacio de más o de
 * menos separa las dos capas para siempre. De ahí sale la única complicación
 * real de este archivo:
 *
 * ── Por qué un texto entre comillas necesita `anchoDeCadena` ───────────────
 *
 * `Ficha.texto` de un token `'texto'` es el contenido YA DECODIFICADO —sin
 * las comillas, con `''` ya vuelto a `'`— porque es lo que necesita el motor
 * para comparar valores (`lexico.ts`, decisión A). Eso es distinto de Python:
 * allí `Ficha.texto` guarda el trozo crudo del código fuente, comillas
 * incluidas, así que su longitud SÍ es la del texto en pantalla. Aquí no:
 * `'D''Angelo'` decodifica a `D'Angelo` (8 caracteres) pero ocupa 11 en la
 * línea. Usar `f.texto.length` para recortar la capa dejaría la mitad de la
 * línea desalineada en cuanto hubiera una comilla duplicada dentro de un
 * texto. `anchoDeCadena` mide el trozo crudo **sin volver a decidir si es
 * válido** —eso ya lo hizo el léxico, y la ficha sólo existe si cerró bien—,
 * así que no es un segundo analizador: es una regla de una línea que
 * reconoce las comillas dobles seguidas.
 *
 * ── Los comentarios ────────────────────────────────────────────────────────
 *
 * El léxico no emite ficha para un comentario `-- …`: al verlo, salta hasta
 * el fin de línea. Así que aparece aquí como el hueco sin cubrir entre dos
 * fichas, exactamente como el `#` de Python.
 */

import { leerFichasTolerante, type Ficha } from '../lexico';
import { PALABRAS_CLAVE, PALABRAS_PROHIBIDAS, RESUMENES, TIPOS } from '../subconjunto';
import type { Color, LineaPintada, Tramo } from '../../codigo/ventana/coloreado';

const TIPOS_SET: ReadonlySet<string> = new Set(Object.keys(TIPOS));
const RESUMENES_SET: ReadonlySet<string> = new Set(RESUMENES);

function colorDeFicha(f: Ficha): Color {
  switch (f.tipo) {
    case 'numero':
      return 'numero';
    case 'texto':
      return 'cadena';
    case 'operador':
      return 'operador';
    case 'nombre': {
      const alto = f.alto;
      if (PALABRAS_CLAVE.has(alto)) return 'palabra';
      if (Object.prototype.hasOwnProperty.call(PALABRAS_PROHIBIDAS, alto)) return 'prohibida';
      if (RESUMENES_SET.has(alto) || TIPOS_SET.has(alto)) return 'nativa';
      return 'nombre';
    }
    /* coma, punto, abre, cierra, puntoYComa, fin: puntuación llana. */
    default:
      return 'llano';
  }
}

/**
 * Cuántos caracteres CRUDOS ocupa un texto entre comillas simples que empieza
 * en `desde`, contando las dos comillas y las internas duplicadas
 * (`'D''Angelo'`). La ficha ya viene decodificada (ver cabecera): esto sólo
 * mide el trozo de la línea que hay que pintar de verde, no vuelve a decidir
 * si el texto es válido — eso ya lo hizo el léxico, y esta función sólo se
 * llama para una ficha que el léxico ya cerró bien.
 */
function anchoDeCadena(linea: string, desde: number): number {
  let i = desde + 1; // saltar la comilla de apertura
  while (i < linea.length) {
    if (linea[i] === "'") {
      if (linea[i + 1] === "'") {
        i += 2;
        continue;
      }
      return i + 1 - desde;
    }
    i += 1;
  }
  /* Inalcanzable si la ficha existe: el léxico no la emite sin comilla de
   * cierre. Si algo cambiara eso, mejor pintar hasta el final de la línea
   * que recortar el texto. */
  return linea.length - desde;
}

/** Un hueco sin cubrir: llano hasta el `--`, y comentario desde ahí. */
function tramosDeHueco(trozo: string, salida: Tramo[]): void {
  if (trozo === '') return;
  const guion = trozo.indexOf('--');
  if (guion === -1) {
    salida.push({ texto: trozo, color: 'llano' });
    return;
  }
  if (guion > 0) salida.push({ texto: trozo.slice(0, guion), color: 'llano' });
  salida.push({ texto: trozo.slice(guion), color: 'comentario' });
}

/**
 * El texto entero, línea a línea y tramo a tramo. Ver la cabecera del
 * archivo: usa `leerFichasTolerante`, así que una consulta a medio escribir
 * conserva su color hasta donde se leyó bien.
 */
export function colorearSQL(fuente: string): LineaPintada[] {
  const lineas = fuente.split('\n');
  const { fichas } = leerFichasTolerante(fuente);

  const porLinea = new Map<number, Ficha[]>();
  for (const f of fichas) {
    if (f.texto === '' && f.tipo !== 'texto') continue; // sólo 'fin' llega vacía, y no es 'texto'
    const lista = porLinea.get(f.linea);
    if (lista) lista.push(f);
    else porLinea.set(f.linea, [f]);
  }

  return lineas.map((texto, i) => {
    const n = i + 1;
    const suyas = porLinea.get(n);
    const tramos: Tramo[] = [];
    let cursor = 0;

    if (suyas) {
      for (const f of suyas) {
        const desde = f.columna - 1;
        /* Red de seguridad, igual que en Python: una ficha que se solapa con
         * lo ya emitido se ignora entera. Nunca se recorta el texto para que
         * quepa. */
        if (desde < cursor) continue;
        if (desde > texto.length) continue;
        tramosDeHueco(texto.slice(cursor, desde), tramos);
        const ancho = f.tipo === 'texto' ? anchoDeCadena(texto, desde) : f.texto.length;
        const trozo = texto.slice(desde, desde + ancho);
        if (trozo !== '') tramos.push({ texto: trozo, color: colorDeFicha(f) });
        cursor = desde + trozo.length;
      }
    }

    tramosDeHueco(texto.slice(cursor), tramos);
    return { n, tramos };
  });
}
