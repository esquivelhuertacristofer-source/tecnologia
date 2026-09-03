import { COLS_HOJA, FILAS_HOJA } from '@/components/office/VentanaHojas';
import { textoDeCaja, type Caja } from '@/components/office/motor-hojas/comandos';
import type { ContextoCinta, ControlesDeClase } from '@/components/office/motor-hojas/cinta';
import { dinamicasDe, esZona, regionDeDinamica } from '@/components/office/motor-hojas/dinamica';
import { crudoEn, type Dinamica, type Libro, type ResumenDeColumna } from '@/components/office/motor-hojas/modelo';

/**
 * Los cuatro botones de la tabla dinámica (bloques 49, 50 y 51).
 *
 * `comandos.ts` trae los cuatro comandos cableados y medidos —`crear-dinamica`,
 * `campo-dinamica`, `agrupar-dinamica` y `actualizar-dinamica`— y ninguno tenía
 * todavía el botón que los dispara: no viven en ninguna cinta y `cinta.ts` no
 * los declara. Se resuelve con `ControlesDeClase`, la misma puerta que ya usó
 * `of-excel-tablas-y-filtros` para sus nueve, y no tocando el motor.
 *
 * ── POR QUÉ ESTÁN EN `comun/` Y NO EN LA CARPETA DE LA CLASE ────────────────
 *
 * Porque **no son de una clase**. `of-excel-tabla-dinamica` (49 y 50) los
 * estrena, pero el gráfico dinámico (51) y el tablero nacen encima de una
 * dinámica y necesitan exactamente estos mismos cuatro para armarla: si
 * vivieran en la carpeta de la primera, la segunda los copiaría —y una copia se
 * separa del original en cuanto uno de los dos se arregla—. Lo mismo vale para
 * `PanelDinamica.tsx`, que es quien los pulsa, y por eso son vecinos.
 *
 * ── CÓMO SE SABE «LA DINÁMICA» SIN QUE EL PANEL PREGUNTE CUÁL ───────────────
 *
 * Igual que `tablaBajoSel` en las tablas, y por el mismo motivo: en Excel basta
 * con estar parado dentro. Aquí se mira si la esquina activa de la selección
 * cae dentro de la región pintada, y si no cae en ninguna se usa la primera de
 * la hoja — que es el caso de todas las clases de hoy, con una sola dinámica.
 * El día que el tablero tenga tres en la misma hoja, cada botón obedecerá a la
 * que tenga el cursor encima sin tocar una línea de aquí.
 *
 * ── LOS CUATRO `valor`, EN UNA TABLA ────────────────────────────────────────
 *
 *   crear-dinamica ....... `"I2"`              dónde pintarla; el origen sale de dónde estás
 *   campo-dinamica ....... `"2|filas"`         campo (índice del origen) y zona
 *                          `"6|valores|cuenta"` … con su resumen, si va a Valores
 *   agrupar-dinamica ..... `"3|2"`             mete el campo 3 dentro del 2
 *                          `"3|-1"`            … o lo saca al primer nivel
 *   actualizar-dinamica .. sin valor
 *
 * Es la disciplina de `bordes` («arriba+abajo») y del `"3|valores|Norte,Sur"`
 * de los filtros: los `args` de un gesto son cadenas y números, y aquí no se
 * inventa una forma nueva de guardar dos datos.
 */

/**
 * Los cinco resúmenes que un campo de Valores puede llevar.
 *
 * Sin `'ninguno'`, que en `conCampo` significa «sácalo de Valores» y aquí sería
 * un sexto renglón del desplegable que hace lo mismo que el botón Quitar de al
 * lado. Dos caminos para lo mismo, en la primera pantalla que el alumno ve de
 * una dinámica, no son una comodidad: son una duda.
 */
export const RESUMENES_DE_VALOR: readonly ResumenDeColumna[] = ['suma', 'cuenta', 'promedio', 'max', 'min'];

/**
 * La dinámica bajo el cursor; si el cursor no está en ninguna, **la última**.
 *
 * Lo de «la última» y no «la primera» es una decisión con motivo: es la que
 * acaba de crear quien está mirando el panel. Con una sola dinámica —el caso de
 * la clase 49— las dos reglas dicen lo mismo; con dos, la primera regla dejaría
 * al alumno que se equivocó al crearla manejando para siempre la equivocada.
 */
export function dinamicaBajoSel(c: ContextoCinta): Dinamica | null {
  const lista = dinamicasDe(c.motor.libro, c.hoja);
  if (!lista.length) return null;
  const dentro = lista.find((d) => {
    const r = regionDeDinamica(c.motor.libro, d);
    return (
      !!r &&
      r.hoja === c.hoja &&
      c.sel.c0 >= r.caja.c0 &&
      c.sel.c0 <= r.caja.c1 &&
      c.sel.f0 >= r.caja.f0 &&
      c.sel.f0 <= r.caja.f1
    );
  });
  return dentro ?? lista[lista.length - 1];
}

/*
 * ── La lista que rodea al cursor ────────────────────────────────────────────
 *
 * Lo que Excel propone solo al pulsar «Tabla dinámica»: estando parado DENTRO
 * de una lista, el rango de origen es la lista entera y nadie marca trescientas
 * filas a mano. Aquí hace falta por lo mismo y por una razón más, que es de
 * clase y no de comodidad: **el origen de una dinámica no se puede cambiar
 * después** —no hay comando para eso, a propósito—, así que una selección corta
 * por un renglón deja al alumno con una dinámica que resume mal y sin manera de
 * arreglarla. Que el caso normal sea un clic dentro de la lista quita ese
 * agujero de raíz, y el que quiera marcar un rango a mano lo sigue pudiendo
 * hacer: si hay más de una celda marcada, manda lo marcado.
 *
 * Crece por celdas OCUPADAS, que es la misma regla del salto de bloque de la
 * ventana (Ctrl+↓) y la que hace que una fila de encabezados con un hueco corte
 * el rango — y entonces el motor lo dice con todas sus letras
 * (`motivoDelOrigen`), que es justo lo que la clase quiere que se oiga.
 */
function listaAlrededor(libro: Libro, hojaId: string, col: number, fila: number): Caja {
  const ocupada = (c: number, f: number): boolean => crudoEn(libro, hojaId, c, f).trim() !== '';
  if (!ocupada(col, fila)) return { c0: col, f0: fila, c1: col, f1: fila };
  let c0 = col;
  let c1 = col;
  let f0 = fila;
  let f1 = fila;
  // Los topes son los de la hoja de esta ventana y no los de Excel: crecer se
  // para en el primer hueco, así que en una hoja normal no se llega ni cerca —
  // pero un bucle sin techo que dependa de los datos es un bucle sin techo.
  while (c0 > 0 && ocupada(c0 - 1, fila)) c0 -= 1;
  while (c1 < COLS_HOJA - 1 && ocupada(c1 + 1, fila)) c1 += 1;
  while (f0 > 0 && ocupada(col, f0 - 1)) f0 -= 1;
  while (f1 < FILAS_HOJA - 1 && ocupada(col, f1 + 1)) f1 += 1;
  return { c0, f0, c1, f1 };
}

/** De dónde comería la dinámica: lo marcado, o la lista entera si sólo hay una celda. */
export function origenDe(c: ContextoCinta): Caja {
  const unaSola = c.sel.c0 === c.sel.c1 && c.sel.f0 === c.sel.f1;
  return unaSola ? listaAlrededor(c.motor.libro, c.hoja, c.sel.c0, c.sel.f0) : c.sel;
}

/** `"6|valores|cuenta"` → `["6", "valores", "cuenta"]`, ya limpio. */
const partes = (v: string | number | undefined): string[] =>
  String(v ?? '')
    .split('|')
    .map((s) => s.trim());

/**
 * El identificador de la dinámica que se va a crear.
 *
 * Sale del sitio donde se pinta y no de un contador, por lo mismo que
 * `idDeTabla` en las tablas: un `d1`, `d2`, `d3` que dependiera de cuántas hay
 * daría un identificador distinto según el orden en que se reprodujera una
 * macro. De dónde se pinta no depende de nada más.
 */
const idDeDinamica = (hoja: string, ancla: string): string => `din-${hoja}-${ancla}`;

export const CONTROLES_DINAMICA: ControlesDeClase = {
  /*
   * Crear. El **origen sale de dónde está el cursor** —la lista entera, con su
   * fila de encabezados, que es de donde salen los campos— y el `valor` dice
   * dónde pintarla. Es el cuadro «Crear tabla dinámica» de Excel en dos huecos
   * en vez de seis: qué datos y dónde ponerla, y el primero ya viene propuesto.
   */
  'crear-dinamica': {
    gesto: (c) => {
      const ancla = partes(c.valor)[0]?.toUpperCase() ?? '';
      if (!ancla) return null;
      return {
        comando: 'crear-dinamica',
        args: { hoja: c.hoja, id: idDeDinamica(c.hoja, ancla), origen: textoDeCaja(origenDe(c)), ancla },
      };
    },
    /*
     * Inerte **sólo** si falta decir dónde pintarla. Un origen que no sirve
     * —una sola fila, una columna sin encabezado— NO se caza aquí a propósito,
     * aunque sería fácil: `motivoDelOrigen` (`dinamica.ts`) ya lo rechaza con
     * las palabras exactas que el alumno necesita oír («el origen tiene sólo la
     * fila de encabezados», «le falta el encabezado de la columna H»), y un
     * botón que se apagara antes se las quitaría de la boca para decir en su
     * lugar una frase general. Que el motor conteste es mejor clase.
     */
    inerte: (c) => !partes(c.valor)[0],
    porQue: () => 'Escribe primero en qué celda quieres que se pinte el resumen — «I2», por ejemplo — y vuelve a pulsar.',
  },

  /*
   * Arrastrar un campo. Un solo control para las cinco zonas, con la zona
   * dentro del gesto, exactamente como el comando: cinco controles serían cinco
   * `inerte` que se irían separando entre sí.
   */
  'campo-dinamica': {
    gesto: (c) => {
      const din = dinamicaBajoSel(c);
      const [campoTxt, zona, resumen] = partes(c.valor);
      const campo = Number(campoTxt);
      if (!din || !Number.isInteger(campo) || !esZona(zona ?? '')) return null;
      return {
        comando: 'campo-dinamica',
        args: {
          hoja: c.hoja,
          id: din.id,
          campo,
          zona,
          ...(zona === 'valores' && resumen && (RESUMENES_DE_VALOR as readonly string[]).includes(resumen)
            ? { resumen }
            : {}),
        },
      };
    },
    inerte: (c) => !dinamicaBajoSel(c),
    porQue: () => 'Primero crea la tabla dinámica: sin ella no hay dónde soltar los campos.',
  },

  /*
   * Agrupar: meter un campo dentro de otro. `dentroDe` negativo lo saca al
   * primer nivel del eje donde ya esté, que es lo que hace `anidado`.
   */
  'agrupar-dinamica': {
    gesto: (c) => {
      const din = dinamicaBajoSel(c);
      const [campoTxt, dentroTxt] = partes(c.valor);
      const campo = Number(campoTxt);
      const dentroDe = dentroTxt === '' || dentroTxt === undefined ? -1 : Number(dentroTxt);
      if (!din || !Number.isInteger(campo) || !Number.isInteger(dentroDe)) return null;
      return { comando: 'agrupar-dinamica', args: { hoja: c.hoja, id: din.id, campo, dentroDe } };
    },
    inerte: (c) => {
      const din = dinamicaBajoSel(c);
      return !din || (!din.filas.length && !din.columnas.length);
    },
    porQue: () =>
      'Para anidar hace falta que ya haya un campo en Filas o en Columnas: dentro de una dinámica vacía no se puede meter nada.',
  },

  /*
   * Actualizar. Sin `inerte` cuando hay dinámica y **sin comprobar si hace
   * falta**: que el botón responda igual cuando no ha cambiado nada es parte de
   * la clase. Un botón que se apagara solo cuando el resumen ya está al día le
   * estaría contestando al alumno la pregunta que la clase quiere que se haga
   * —«¿esto está viejo o no?»— y de paso le contaría que el programa sí sabe
   * cuándo cambió el origen, que es justo lo que no sabe.
   */
  'actualizar-dinamica': {
    gesto: (c) => {
      const din = dinamicaBajoSel(c);
      return din ? { comando: 'actualizar-dinamica', args: { hoja: c.hoja, id: din.id } } : null;
    },
    inerte: (c) => !dinamicaBajoSel(c),
    porQue: () => 'Todavía no hay ninguna tabla dinámica que actualizar.',
  },
};

export default CONTROLES_DINAMICA;
