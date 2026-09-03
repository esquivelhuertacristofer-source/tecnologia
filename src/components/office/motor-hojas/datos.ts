/**
 * Tecnia Hojas · `datos.ts` — **el dato sucio**: importar (bloque 43), quitar
 * duplicados y relleno rápido (bloque 44).
 *
 * Tres piezas puras, sin libro y sin pantalla, que los comandos de `comandos.ts`
 * llaman y que las pruebas pueden interrogar solas. Viven aquí y no allí por la
 * misma razón por la que `serieDesde` está exportada con nombre: **lo que decide
 * si estos tres bloques están bien enseñados son sus reglas, no el recorrido de
 * celdas que las aplica**, y una regla que sólo se puede probar montando un libro
 * entero es una regla que nadie va a volver a probar.
 *
 * ── Lo que estos tres bloques enseñan de verdad ─────────────────────────────
 *
 * Un alumno cree que importar un `.csv` es abrir un archivo. Lo que el bloque 43
 * enseña es **por qué sale mal**: el separador que no era, la coma de dentro de
 * un campo que parte la fila en dos, y —la peor de todas— la columna que **queda
 * como texto pareciendo número** y hace que `=SUMA` dé cero sin quejarse. Por eso
 * `leerCsv` no devuelve sólo las celdas: devuelve un **parte** de lo que decidió,
 * con el separador que detectó y las columnas sospechosas. Ese parte no es
 * diagnóstico interno: **es el material de la clase**.
 *
 * Lo mismo con el bloque 44. Quitar duplicados es fácil; lo que hace daño es el
 * duplicado **que no se ve** —«Ana » con un espacio detrás, «ANA» en mayúsculas—,
 * y el relleno rápido es vistoso hasta el día en que se inventa media columna.
 * De ahí las dos reglas de este archivo:
 *
 *   1. **Se compara tal cual está escrito.** Ni recortar, ni bajar a minúsculas,
 *      ni normalizar acentos. Ver la reserva de `llaveDeFila`.
 *   2. **Si no hay patrón, no se adivina: se dice.** `deducirPatron` devuelve
 *      `null` y el comando **rechaza**. Un relleno rápido que acierta la mitad de
 *      una columna es peor que uno que no funciona, porque lo que salió bien a la
 *      vista hace que el alumno no revise lo demás.
 */

import { dir, hojaDe, letraDeColumna, type Libro } from './modelo';
import { valorDeTextoCrudo } from './formula/calculo';
import type { Caja } from './comandos';

/* ── el bloque 43 · leer un `.csv` o un `.txt` ──────────────────────────────*/

/**
 * Los tres separadores que esta sala reconoce, en el orden en que se prueban.
 *
 * Son tres y no diez porque son los tres que salen de un programa de verdad: la
 * coma del `.csv` de toda la vida, el punto y coma que escribe medio Excel de
 * Europa y de Latinoamérica —donde la coma es el decimal— y el tabulador del
 * `.txt` que sale de pegar una tabla. El orden decide los empates y por eso está
 * escrito: con `a,b;c` las dos primeras dan dos campos y gana la coma.
 */
export type Separador = ',' | ';' | '\t';

export const SEPARADORES: readonly Separador[] = [',', ';', '\t'];

/** Cómo se llama, para poder decirlo en voz alta en la clase. */
export const nombreDeSeparador = (s: Separador): string =>
  s === ',' ? 'coma' : s === ';' ? 'punto y coma' : 'tabulador';

/** El parte de lo que la importación decidió. **Esto es la clase** (ver cabecera). */
export interface ParteDeImportacion {
  /** El que se detectó, no el que se supuso. */
  separador: Separador;
  filas: number;
  columnas: number;
  /**
   * Las columnas que quedaron **texto pareciendo número**, por su número de
   * orden dentro de lo importado (`0` es la primera).
   *
   * Es la única cifra de este parte que no se puede sacar mirando la pantalla, y
   * es la que explica el «mi suma da 0» del §46.8.
   */
  columnasDeTextoQuePareceNumero: number[];
  /** Un ejemplo real de cada una de esas columnas, en el mismo orden. */
  ejemplos: string[];
  /**
   * Cuántas filas no traían el mismo número de campos que la más larga.
   *
   * Casi siempre es **la trampa clásica**: un `1,250` sin comillas dentro de un
   * csv de comas. No se arregla —no hay forma de saber si son mil doscientos
   * cincuenta o dos campos— y por eso se cuenta y se dice.
   */
  filasDesparejas: number;
  /** El texto se acabó dentro de unas comillas que nadie cerró. */
  comillaSinCerrar: boolean;
}

export interface Importacion {
  /** Las celdas, por filas, tal como se leyeron: **texto crudo y nada más**. */
  celdas: string[][];
  parte: ParteDeImportacion;
}

/**
 * Parte el texto en filas y campos con **un** separador.
 *
 * Las comillas son la mitad del trabajo y siguen la regla del csv de verdad:
 * abren **sólo al principio de un campo** —`Ana;"1` no abre nada, y por eso el
 * detector de separador de abajo puede fiarse de esto—, dentro de ellas el
 * separador y el salto de línea son texto, y dos comillas seguidas son una
 * comilla escrita. Es lo que hace que `"Ana, la de 3ºB"` sea **un** campo.
 *
 * Una comilla que nadie cierra se traga el resto del archivo, exactamente igual
 * que en Excel. No se «arregla» cerrándola sola: se avisa. Un importador que
 * adivina dónde iba la comilla que falta devuelve datos que no están en el
 * archivo, y eso no se ve.
 */
function partirEnCampos(texto: string, sep: Separador): { filas: string[][]; comillaSinCerrar: boolean } {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = '';
  let dentro = false;

  const cerrarCampo = () => {
    fila.push(campo);
    campo = '';
  };
  const cerrarFila = () => {
    cerrarCampo();
    filas.push(fila);
    fila = [];
  };

  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (dentro) {
      if (c !== '"') {
        campo += c;
      } else if (texto[i + 1] === '"') {
        campo += '"';
        i += 1;
      } else {
        dentro = false;
      }
      continue;
    }
    if (c === '"' && campo === '') {
      dentro = true;
      continue;
    }
    if (c === sep) {
      cerrarCampo();
      continue;
    }
    if (c === '\r' || c === '\n') {
      if (c === '\r' && texto[i + 1] === '\n') i += 1;
      cerrarFila();
      continue;
    }
    campo += c;
  }
  // El salto de línea final no crea una fila vacía —todo archivo decente acaba
  // en uno—, pero una línea en blanco **de en medio** sí es una fila: corre los
  // renglones de abajo, y perderla desalinearía la tabla entera.
  if (campo !== '' || fila.length > 0) cerrarFila();

  return { filas, comillaSinCerrar: dentro };
}

/**
 * Cuál de los tres separadores usa este texto. **Detectado, no supuesto.**
 *
 * El criterio es el de Excel y el de cualquier importador que funcione: gana el
 * que parte **todas las líneas en el mismo número de campos**, y a igualdad de
 * constancia el que hace más columnas. Contar comas a secas —que es lo que hace
 * el importador que uno escribe la primera vez— falla justo en el caso que la
 * clase quiere enseñar: un archivo de punto y coma con `"1,250"` dentro tiene más
 * comas que puntos y comas, y sale elegida la coma.
 *
 * Por eso se cuenta **partiendo de verdad** y no con una expresión regular: lo
 * que hay dentro de unas comillas no cuenta, y saber eso exige leer el archivo
 * carácter a carácter una vez por candidato. Son tres pasadas sobre un archivo de
 * clase; medirlo sería medir el ruido.
 */
export function detectarSeparador(texto: string): Separador {
  let mejor: Separador = ',';
  let mejorConstante = false;
  let mejorColumnas = 0;

  for (const sep of SEPARADORES) {
    const { filas } = partirEnCampos(texto, sep);
    const llenas = filas.filter((f) => f.some((x) => x !== ''));
    if (!llenas.length) continue;
    const anchos = llenas.map((f) => f.length);
    const columnas = Math.max(...anchos);
    if (columnas < 2) continue;
    const constante = anchos.every((n) => n === columnas);
    // Constante gana a ancho: dos columnas en todas las líneas es un archivo
    // bien leído; cinco en una y una en las demás es un separador equivocado que
    // por casualidad apareció una vez.
    const gana = constante === mejorConstante ? columnas > mejorColumnas : constante;
    if (gana) {
      mejor = sep;
      mejorConstante = constante;
      mejorColumnas = columnas;
    }
  }
  // Sin ningún candidato de dos columnas, el archivo es de una sola columna y el
  // separador da igual. Se contesta la coma, que es lo que dice la extensión.
  return mejor;
}

/**
 * ¿Esto **parece** un número y **no lo es**?
 *
 * Las tres condiciones son las tres mitades del defecto (sí, son tres):
 *
 *   1. tiene alguna cifra —si no, es texto y nadie se confunde—;
 *   2. está hecho **sólo** de cifras y de la puntuación con la que se escriben
 *      los números (`, . - + / ( ) : $ %` y espacios), que es lo que deja fuera
 *      a `Casa 5` y deja dentro a `007`, a `1,250`, a `(1,250)` y a un teléfono;
 *   3. y, aun así, **el motor lo guarda como texto** (`valorDeTextoCrudo`).
 *
 * La tercera es la que manda y por eso se le pregunta al motor en vez de decidir
 * aquí: el día que la sala acepte la coma de miles, esta función se entera sola.
 * Preguntarle a quien ya sabe la respuesta es la misma disciplina del §39 —«¿el
 * texto rebosa?» se le pregunta al motor de maquetación— aplicada a los datos.
 */
const SOLO_DE_NUMERO = /^[\d\s.,\-+/():$%]+$/;

export function pareceNumero(crudo: string): boolean {
  const t = crudo.trim();
  if (t === '' || !/\d/.test(t)) return false;
  if (!SOLO_DE_NUMERO.test(t)) return false;
  return typeof valorDeTextoCrudo(t) === 'string';
}

/**
 * El texto de un `.csv` o de un `.txt`, leído entero y **con su parte**.
 *
 * `separador` se puede imponer —el cuadro de diálogo de Excel deja cambiarlo, y
 * el alumno tiene que poder equivocarse a propósito para ver qué pasa—; sin él
 * se detecta.
 */
export function leerCsv(texto: string, separador?: Separador): Importacion {
  const sep = separador ?? detectarSeparador(texto);
  const { filas, comillaSinCerrar } = partirEnCampos(texto, sep);

  const llenas = filas.filter((f) => f.some((x) => x !== ''));
  const columnas = filas.length ? Math.max(...filas.map((f) => f.length)) : 0;
  const filasDesparejas = llenas.filter((f) => f.length !== columnas).length;

  const sospechosas: number[] = [];
  const ejemplos: string[] = [];
  for (let c = 0; c < columnas; c += 1) {
    const ejemplo = filas.map((f) => f[c] ?? '').find((x) => pareceNumero(x));
    if (ejemplo !== undefined) {
      sospechosas.push(c);
      ejemplos.push(ejemplo);
    }
  }

  return {
    celdas: filas,
    parte: {
      separador: sep,
      filas: filas.length,
      columnas,
      columnasDeTextoQuePareceNumero: sospechosas,
      ejemplos,
      filasDesparejas,
      comillaSinCerrar,
    },
  };
}

/**
 * El parte dicho en voz alta, para que las dos clases que van a usar esto no
 * escriban cada una sus frases.
 *
 * `columna` traduce el número de orden a la letra que el alumno ve en la hoja, y
 * por eso hace falta saber en qué columna se soltó: la tercera columna del
 * archivo es la `E` si se importó en `C1`.
 */
export function frasesDelParte(parte: ParteDeImportacion, colAncla = 0): string[] {
  const frases = [
    `Separador detectado: ${nombreDeSeparador(parte.separador)}.`,
    `Entraron ${parte.filas} ${parte.filas === 1 ? 'fila' : 'filas'} y ${parte.columnas} ${
      parte.columnas === 1 ? 'columna' : 'columnas'
    }.`,
  ];
  if (parte.columnasDeTextoQuePareceNumero.length) {
    const cols = parte.columnasDeTextoQuePareceNumero
      .map((c, i) => `${letraDeColumna(colAncla + c)} (por ejemplo «${parte.ejemplos[i]}»)`)
      .join(', ');
    frases.push(
      `Ojo: ${cols} ${
        parte.columnasDeTextoQuePareceNumero.length === 1 ? 'quedó' : 'quedaron'
      } como TEXTO aunque parezca número. Una suma sobre esa columna dará 0 hasta que la limpies.`,
    );
  }
  if (parte.filasDesparejas) {
    frases.push(
      `${parte.filasDesparejas} ${
        parte.filasDesparejas === 1 ? 'fila no traía' : 'filas no traían'
      } el mismo número de campos que las demás: casi siempre es un número con separador de miles escrito sin comillas.`,
    );
  }
  if (parte.comillaSinCerrar) {
    frases.push('Hay unas comillas que nunca se cierran: desde ahí, el archivo entero entró en una sola celda.');
  }
  return frases;
}

/* ── el bloque 44 · quitar duplicados ───────────────────────────────────────*/

/**
 * La llave con la que se comparan dos filas: sus crudos, **tal cual**.
 *
 * ── La decisión entera del bloque 44 está en esta función ───────────────────
 *
 * No se recorta el espacio de detrás, no se baja a minúsculas y no se quitan
 * acentos, así que **«ANA», «Ana » y «ana» son tres filas distintas**. Eso es lo
 * que la clase necesita que duela: el duplicado que se ve lo quita cualquiera; el
 * que hace daño es el que no se ve, y el alumno tiene que descubrir que primero
 * se limpia —`ESPACIOS`, `MAYUSC`, el relleno rápido de aquí abajo— y **después**
 * se quitan duplicados. Un modo «ignorar mayúsculas» le quitaría el problema de
 * delante sin que llegue a verlo, y por eso no existe ni se va a añadir.
 *
 * **Reserva medida, escrita para quien la necesite (15-ago-2026):** el Quitar
 * duplicados del Excel de verdad **no distingue mayúsculas** —«ANA» y «ana» sí se
 * le van—, aunque el espacio de detrás sí las separa, igual que aquí. La
 * diferencia se deja **a propósito y por orden escrita**, porque la clase se
 * apoya en ella; el día que se prefiera la fidelidad, se cambia **aquí y en
 * ningún otro sitio** —bajar `crudo` a minúsculas en esta línea— y hay que tocar
 * la frase de la clase, que promete lo contrario.
 *
 * El ` ` de separación no es superstición: sin él, `["a","bc"]` y
 * `["ab","c"]` darían la misma llave, y una hoja de dos columnas empezaría a
 * perder filas que no son iguales. Un carácter que no se puede teclear es la
 * única separación que un dato no puede imitar.
 */
function llaveDeFila(libro: Libro, hojaId: string, fila: number, columnas: number[]): string {
  const celdas = hojaDe(libro, hojaId)?.celdas ?? {};
  return columnas.map((c) => celdas[dir(c, fila)]?.crudo ?? '').join(' ');
}

/** Lo que el cuadro de diálogo de Excel dice antes y después. */
export interface CuentaDeDuplicados {
  /** Filas de datos miradas, sin contar el encabezado. */
  filas: number;
  /** Las que se van. */
  duplicadas: number;
  /** Las que quedan, sin contar el encabezado. */
  quedan: number;
}

/**
 * Qué filas de la caja sobreviven, en orden, y cuántas se van.
 *
 * **Se queda la primera y se van las de después**, que es lo que hace Excel: el
 * orden de la hoja manda, y por eso quitar duplicados sobre una lista ordenada de
 * otra manera no da lo mismo. Es una fidelidad barata de respetar y cara de
 * descubrir tarde.
 */
export function filasQueQuedan(
  libro: Libro,
  hojaId: string,
  caja: Caja,
  columnas: number[],
  encabezado: boolean,
): { quedan: number[]; cuenta: CuentaDeDuplicados } {
  const primera = caja.f0 + (encabezado ? 1 : 0);
  const vistas = new Set<string>();
  const quedan: number[] = [];
  for (let f = primera; f <= caja.f1; f += 1) {
    const llave = llaveDeFila(libro, hojaId, f, columnas);
    if (vistas.has(llave)) continue;
    vistas.add(llave);
    quedan.push(f);
  }
  const filas = Math.max(0, caja.f1 - primera + 1);
  return { quedan, cuenta: { filas, duplicadas: filas - quedan.length, quedan: quedan.length } };
}

/* ── el bloque 44 · relleno rápido ──────────────────────────────────────────*/

/**
 * Cómo se viste un trozo al copiarlo. Cuatro y no más, y las cuatro se ven en la
 * primera clase: tal cual, TODO EN ALTA, todo en baja y Con Mayúscula Inicial.
 */
type Vestido = 'igual' | 'alta' | 'baja' | 'inicial';

const VESTIDOS: readonly Vestido[] = ['igual', 'inicial', 'baja', 'alta'];

const EN_PALABRAS: Record<Vestido, string> = {
  igual: '',
  alta: ' en mayúsculas',
  baja: ' en minúsculas',
  inicial: ' con mayúscula inicial',
};

/**
 * `GARCÍA` → `García`. Con acentos, que en español es la mitad de los apellidos:
 * `toUpperCase()` de una `í` da `Í` y de una `ñ` da `Ñ`, así que no hace falta
 * tabla — pero sí hace falta acordarse de bajar **el resto**, o `García` saldría
 * `GarcÍA`.
 */
function vestir(texto: string, como: Vestido): string {
  if (como === 'alta') return texto.toUpperCase();
  if (como === 'baja') return texto.toLowerCase();
  if (como === 'inicial') return texto.slice(0, 1).toUpperCase() + texto.slice(1).toLowerCase();
  return texto;
}

/**
 * En qué se parte una celda para buscarle los trozos.
 *
 * Espacios, coma, punto y coma, dos puntos, barra, palo, guion y guion bajo.
 * **El punto NO parte**, y es una decisión: partiéndolo, `3.5` serían dos trozos
 * y el relleno rápido empezaría a recomponer números, que no es lo que hace.
 */
const CORTES = /[\s,;:/|\-_]+/;

const trozosDe = (texto: string): string[] => texto.split(CORTES).filter((x) => x !== '');

type Pedazo = { t: 'pieza'; i: number; vestido: Vestido } | { t: 'literal'; texto: string };

/** Un patrón deducido de UN ejemplo. Lo que el bloque 44 llama «relleno rápido». */
export interface PatronDeRelleno {
  /** Cómo se leyó, en palabras. La clase lo enseña en pantalla. */
  descripcion: string;
  /** Cuántos trozos necesita una fila para poder rellenarse. */
  trozosQueNecesita: number;
  /** Lo que le toca a esta fila, o `null` si esta fila no da para tanto. */
  aplicar: (origen: string) => string | null;
}

/** El trozo más largo que empieza justo aquí, con el vestido que le case. */
function piezaEn(ejemplo: string, i: number, trozos: string[]): { i: number; vestido: Vestido; largo: number } | null {
  let mejor: { i: number; vestido: Vestido; largo: number } | null = null;
  for (let p = 0; p < trozos.length; p += 1) {
    const trozo = trozos[p];
    if (!trozo) continue;
    for (const vestido of VESTIDOS) {
      if (!ejemplo.startsWith(vestir(trozo, vestido), i)) continue;
      // El más largo gana; a igualdad, el trozo que aparece antes en el origen y
      // el vestido más literal (el orden de `VESTIDOS`). Es arbitrario y por eso
      // está escrito: sin un desempate fijo, el mismo ejemplo daría dos patrones
      // distintos según el humor del motor de expresiones, y una macro grabada
      // hoy rellenaría otra cosa mañana.
      if (!mejor || trozo.length > mejor.largo) mejor = { i: p, vestido, largo: trozo.length };
      break;
    }
  }
  return mejor;
}

/**
 * Deduce el patrón de **un** ejemplo escrito a mano. `null` si no lo encuentra.
 *
 * ── Lo que SÍ deduce ────────────────────────────────────────────────────────
 *
 * Partir el origen por sus separadores, tomar trozos —en cualquier orden y
 * repetidos—, juntarlos con literales, y vestirlos: tal cual, en alta, en baja o
 * con mayúscula inicial. Con eso sale el caso que se enseña, que es
 * `GARCÍA LÓPEZ, ANA` → `Ana García López`, y salen también `Ana G.`,
 * `ana.lopez` o `LÓPEZ/Ana`.
 *
 * ── Lo que NO deduce, y hay que decirlo entero ──────────────────────────────
 *
 * Ésta es la mitad del trabajo de esta función, porque un relleno rápido sin su
 * alcance escrito es una promesa que el alumno descubre rota a mitad de columna:
 *
 *   · **Quitar o poner acentos.** `GARCÍA` → `garcia` no se deduce; se busca el
 *     trozo tal cual y `garcía` ≠ `garcia`. Es el caso del correo electrónico y
 *     es el que más se va a echar de menos.
 *   · **Trozos de trozo.** La inicial sola (`A.` de `ANA`), las tres primeras
 *     letras, el año de dentro de una fecha pegada (`20260814`). Aquí un trozo
 *     entra entero o no entra.
 *   · **Números.** Ni contar (`1, 2, 3` — eso es el autorrelleno del bloque 8, y
 *     es otro botón), ni sumar, ni rellenar de ceros, ni cambiar `1.5` por `1,5`.
 *   · **Partir por el punto.** `ana.garcia` es un solo trozo (ver `CORTES`).
 *   · **Más de un ejemplo.** Excel afina con el segundo y el tercero; aquí manda
 *     el primero y sólo el primero. Si el primero es ambiguo, el patrón será el
 *     que salga del desempate de `piezaEn`, no el que el alumno tenía en la
 *     cabeza — y por eso el comando enseña la `descripcion` en vez de callársela.
 *   · **Condiciones.** «Si es de Puebla pon PUE» no es un patrón, es un `SI`, y
 *     ése es el bloque 23.
 *
 * ── Y una guarda que parece de más ──────────────────────────────────────────
 *
 * Un ejemplo que no usa **ningún** trozo del origen —el alumno escribió a mano
 * algo que no se parece a nada— devuelve `null` aunque se pudiera «leer» como un
 * literal larguísimo. Si no, el patrón sería «escribe esto mismo en las cien
 * celdas de abajo», que es la peor forma de fallar que tiene esta herramienta:
 * hace algo, parece que funcionó, y hay que leerse la columna entera para
 * descubrir que no.
 */
export function deducirPatron(origen: string, ejemplo: string): PatronDeRelleno | null {
  if (ejemplo === '' || origen === '') return null;
  const trozos = trozosDe(origen);
  if (!trozos.length) return null;

  const pedazos: Pedazo[] = [];
  let usaAlgun = false;
  for (let i = 0; i < ejemplo.length; ) {
    const p = piezaEn(ejemplo, i, trozos);
    if (p) {
      pedazos.push({ t: 'pieza', i: p.i, vestido: p.vestido });
      usaAlgun = true;
      i += p.largo;
      continue;
    }
    const ultimo = pedazos[pedazos.length - 1];
    if (ultimo && ultimo.t === 'literal') ultimo.texto += ejemplo[i];
    else pedazos.push({ t: 'literal', texto: ejemplo[i] });
    i += 1;
  }
  if (!usaAlgun) return null;

  const necesita = pedazos.reduce((n, p) => (p.t === 'pieza' ? Math.max(n, p.i + 1) : n), 0);

  const aplicar = (texto: string): string | null => {
    const suyos = trozosDe(texto);
    if (suyos.length < necesita) return null;
    let fuera = '';
    for (const p of pedazos) fuera += p.t === 'literal' ? p.texto : vestir(suyos[p.i], p.vestido);
    return fuera;
  };

  // La red de seguridad: el patrón, aplicado a su propio origen, tiene que
  // devolver el ejemplo **letra por letra**. Es imposible que falle por
  // construcción, y por eso está: el día que alguien toque `vestir` o `piezaEn`,
  // esto se cae aquí —donde se ve— en vez de rellenar cien celdas con algo que no
  // es lo que el alumno escribió.
  if (aplicar(origen) !== ejemplo) return null;

  return {
    descripcion: pedazos
      .map((p) => (p.t === 'literal' ? `«${p.texto}»` : `trozo ${p.i + 1}${EN_PALABRAS[p.vestido]}`))
      .join(' + '),
    trozosQueNecesita: necesita,
    aplicar,
  };
}
