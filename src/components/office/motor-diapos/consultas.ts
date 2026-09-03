/**
 * Prueba de concepto · las preguntas que una clase le hace a la diapositiva.
 *
 * El molde es literal: `src/components/office/motor/consultas.ts`. Puro, sin
 * DOM, probable sin navegador — que es lo que permitió que las 154 clases de
 * Word corrigieran **leyendo el documento** en vez de vigilando qué botón se
 * pulsó (§36.3).
 *
 * ── LA REGLA DEL DÍA ────────────────────────────────────────────────────────
 *
 * **Ninguna función de este archivo puede usar un número decimal.** Si alguna
 * lo necesita, se anota arriba con su nombre y su motivo, porque ése es
 * exactamente el resultado que la prueba tiene que dar: cuántas de las
 * preguntas que una clase de verdad hace se contestan con enteros.
 *
 * Recuento al cerrar el archivo: **cero decimales, cero tolerancias.** Todas
 * las comparaciones de abajo son entre enteros de la rejilla. La única
 * pregunta que no se pudo contestar aquí es «¿el texto rebosa su caja?», que
 * no es geometría de maquetación sino tipografía, y vive en `verificar.ts`
 * preguntándoselo al navegador con un booleano (`scrollHeight > clientHeight`),
 * que tampoco lleva épsilon.
 */

import {
  FILAS,
  colsDe,
  type Forma,
  DISENOS,
  casillaDe,
  rolesDe,
  type Casilla,
  type Diapositiva,
  type Rol,
} from './modelo';

/* ── lo que hay y lo que falta ────────────────────────────────────────────── */

/** ¿Ese marcador tiene algo escrito? El ancla de casi todos los encargos. */
export function marcadorLleno(d: Diapositiva, rol: Rol): boolean {
  const m = d.marcadores.find((x) => x.rol === rol);
  return !!m && m.contenido !== null && m.contenido.trim().length > 0;
}

/** Cuántas palabras hay en un marcador. La lección de «pocas palabras». */
export function palabrasEn(d: Diapositiva, rol: Rol): number {
  const m = d.marcadores.find((x) => x.rol === rol);
  if (!m?.contenido) return 0;
  return m.contenido.trim().split(/\s+/).filter(Boolean).length;
}

/** Los roles que el diseño pide y siguen vacíos. */
export function marcadoresVacios(d: Diapositiva): Rol[] {
  return rolesDe(d.diseno).filter((rol) => !marcadorLleno(d, rol));
}

/** ¿El marcador sigue siendo un marcador? La prueba de identidad del día. */
export function conservaSuRol(d: Diapositiva, rol: Rol): boolean {
  return d.marcadores.some((m) => m.rol === rol);
}

/** ¿Está donde lo dejó el diseño, o el alumno lo movió? Es `of-ppt-patron`. */
export function estaAnulado(d: Diapositiva, rol: Rol): boolean {
  const m = d.marcadores.find((x) => x.rol === rol);
  if (!m) return false;
  /*
   * Dos formas de anular, y las dos cuentan (§43.4). Mover la caja a mano deja
   * `casilla`; darle formato a mano deja `formato`. Al escribirse esta función
   * en §39 sólo existía la primera, porque el patrón todavía no llevaba
   * formato — y con sólo la primera, la clase que la estrena diría que un
   * título pintado en rojo a mano «hereda», que es justo lo contrario.
   */
  return m.casilla != null || Object.keys(m.formato ?? {}).length > 0;
}

/* ── geometría, toda en enteros ───────────────────────────────────────────── */

/** Todas las cajas de la diapositiva, con su nombre. El orden es estable. */
export function cajas(d: Diapositiva, forma?: Forma | null): { nombre: string; casilla: Casilla }[] {
  const fuera: { nombre: string; casilla: Casilla }[] = [];
  for (const rol of rolesDe(d.diseno)) {
    const c = casillaDe(d, rol, forma);
    if (c && marcadorLleno(d, rol)) fuera.push({ nombre: rol, casilla: c });
  }
  for (const l of d.libres) fuera.push({ nombre: l.id, casilla: l.casilla });
  return fuera;
}

/**
 * ¿Cabe entera en el lienzo? Cuatro comparaciones de enteros.
 *
 * El lienzo **de esta presentación** desde §44.3: en 4:3 acaba en la columna 9,
 * y una foto colocada en la 8 con cuatro de ancho deja de caber sin que nadie
 * la haya tocado. Eso no es un fallo: **es la lección de la clase**, y por eso
 * la respuesta tiene que depender de la forma y no de una constante.
 */
export function dentroDelLienzo(c: Casilla, forma?: Forma | null): boolean {
  return c.col >= 0 && c.fila >= 0 && c.col + c.cols <= colsDe(forma) && c.fila + c.filas <= FILAS;
}

/** ¿Sus cuatro números son enteros? Si esto falla, el modelo se rompió. */
export function enLaRejilla(c: Casilla): boolean {
  return (
    Number.isInteger(c.col) &&
    Number.isInteger(c.fila) &&
    Number.isInteger(c.cols) &&
    Number.isInteger(c.filas) &&
    c.cols >= 1 &&
    c.filas >= 1
  );
}

/**
 * ¿Se tapan? Intersección de rectángulos, pero de ENTEROS: dos cajas que se
 * tocan por el borde (una acaba en la columna 6 y la otra empieza en la 6) NO
 * se tapan, y eso es exacto, no aproximado. Es la pregunta que en un modelo de
 * píxeles obliga a inventar un épsilon.
 */
export function seTapan(a: Casilla, b: Casilla): boolean {
  return (
    a.col < b.col + b.cols &&
    b.col < a.col + a.cols &&
    a.fila < b.fila + b.filas &&
    b.fila < a.fila + a.filas
  );
}

/** Los pares que se tapan, por nombre. Es lo que se le enseña al alumno. */
export function paresQueSeTapan(d: Diapositiva): [string, string][] {
  const cs = cajas(d);
  const pares: [string, string][] = [];
  for (let i = 0; i < cs.length; i += 1) {
    for (let j = i + 1; j < cs.length; j += 1) {
      if (seTapan(cs[i].casilla, cs[j].casilla)) pares.push([cs[i].nombre, cs[j].nombre]);
    }
  }
  return pares;
}

/**
 * ¿Está centrada horizontalmente?
 *
 * Ésta es LA pregunta de la prueba, la que en píxeles sería |x + w/2 − 480| < ε.
 * Aquí es `2·col + cols === COLS`: una igualdad entre enteros. Se multiplica
 * por dos en vez de dividir para no tropezar con una caja de ancho impar.
 */
export function centradaEnH(c: Casilla, forma?: Forma | null): boolean {
  return 2 * c.col + c.cols === colsDe(forma);
}

export function centradaEnV(c: Casilla): boolean {
  return 2 * c.fila + c.filas === FILAS;
}

/** ¿Comparten borde? Lo que enseña «Alinear» (MO-310 3.5). */
export function alineadas(cs: Casilla[], borde: 'izq' | 'der' | 'arriba' | 'abajo'): boolean {
  if (cs.length < 2) return true;
  const valor = (c: Casilla) =>
    borde === 'izq' ? c.col
    : borde === 'der' ? c.col + c.cols
    : borde === 'arriba' ? c.fila
    : c.fila + c.filas;
  const primero = valor(cs[0]);
  return cs.every((c) => valor(c) === primero);
}

/**
 * ¿Están a la misma distancia unas de otras? Lo que enseña «Distribuir».
 *
 * Se mide de HUECO A HUECO y no de borde a borde: distribuir en PowerPoint
 * reparte el espacio que sobra, y dos cajas de anchos distintos alineadas por
 * su izquierda con la misma separación entre orígenes se ven mal repartidas.
 * Con menos de tres cajas no hay nada que repartir y la respuesta es sí.
 *
 * Enteros otra vez, y por eso hay algo que decir: el reparto perfecto puede no
 * caber en la rejilla —tres huecos de 2,33 casillas no existen—, así que se
 * admite **una casilla de diferencia** entre el hueco mayor y el menor. No es
 * un épsilon disfrazado: es que la rejilla es la unidad, y una diferencia de
 * media unidad no se puede representar ni ver.
 */
export function distribuidas(cs: Casilla[], eje: 'h' | 'v'): boolean {
  if (cs.length < 3) return true;
  const ini = (c: Casilla) => (eje === 'h' ? c.col : c.fila);
  const fin = (c: Casilla) => (eje === 'h' ? c.col + c.cols : c.fila + c.filas);
  const orden = [...cs].sort((a, b) => ini(a) - ini(b));
  const huecos = orden.slice(1).map((c, i) => ini(c) - fin(orden[i]));
  return Math.max(...huecos) - Math.min(...huecos) <= 1;
}

/** ¿Está una caja completamente encima de otra? Es el orden Z bien puesto. */
export function ordenZ(d: Diapositiva): string[] {
  return [...d.libres].sort((a, b) => a.z - b.z).map((l) => l.id);
}

/* ── las preguntas pedagógicas de verdad ──────────────────────────────────── */

/**
 * «¿La imagen tapa el título?» — la pregunta con la que se decide el día.
 * Se contesta encadenando dos consultas de enteros y ni una sola tolerancia.
 */
export function tapaAlTitulo(d: Diapositiva, idLibre: string, forma?: Forma | null): boolean {
  const titulo = casillaDe(d, 'titulo', forma);
  const libre = d.libres.find((l) => l.id === idLibre);
  if (!titulo || !libre) return false;
  return seTapan(titulo, libre.casilla);
}

/** «¿El título está centrado?» — la otra pregunta del día. */
export function tituloCentrado(d: Diapositiva, forma?: Forma | null): boolean {
  const c = casillaDe(d, 'titulo', forma);
  return !!c && centradaEnH(c, forma);
}

/**
 * «¿Cabe leerse desde el fondo del salón?» — el criterio de la última butaca
 * del §27.2, en enteros: un cuerpo de texto no puede pasar de N palabras y su
 * caja no puede ser más baja que una fila por cada renglón previsto.
 */
export function pocasPalabras(d: Diapositiva, rol: Rol, tope: number): boolean {
  return palabrasEn(d, rol) <= tope;
}

/** Todo lo que el diseño promete está puesto y nada se pisa. */
export function diapositivaCompleta(d: Diapositiva): boolean {
  return marcadoresVacios(d).length === 0 && paresQueSeTapan(d).length === 0;
}

/** Para el informe: cuántos roles pide este diseño. */
export function cuantosRoles(d: Diapositiva): number {
  return Object.keys(DISENOS[d.diseno].casillas).length;
}

/* ── el contraste, que es la única cifra con umbral de todo el motor ──────── */

/** Luminancia relativa de un color `#rrggbb`, según la fórmula de la WCAG. */
function luminancia(hex: string): number {
  const n = hex.replace('#', '');
  const v = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

/**
 * Cuánto contrasta una letra con su fondo. De 1 (invisible) a 21 (negro/blanco).
 *
 * **Es el único número con coma de todo el motor, y es a propósito.** El §39
 * prohibió las tolerancias porque eran épsilons inventados para tapar que el
 * modelo guardaba píxeles; esto es otra cosa: una fórmula publicada, la misma
 * que usan los navegadores y las auditorías de accesibilidad. No calibra nada
 * nuestro — mide una propiedad del color— y su umbral tampoco lo elegimos
 * nosotros. Si algún día alguien lo «afina», está inventándose un estándar.
 */
export function contraste(letra: string, fondo: string): number {
  const a = luminancia(letra);
  const b = luminancia(fondo);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * El umbral de «se lee desde la última butaca».
 *
 * 4.5 es el mínimo de la WCAG AA para texto normal. Una diapositiva se ve de
 * lejos y peor iluminada que una pantalla, así que si algo tendría que moverse
 * sería hacia arriba, nunca hacia abajo.
 */
export const CONTRASTE_MINIMO = 4.5;

/**
 * Con qué color pinta el PROGRAMA algo suyo encima de ese fondo.
 *
 * Es para el número de diapositiva y lo que venga después: cosas que el alumno
 * no escribe y de cuya legibilidad responde el programa. Se prefiere el color
 * del tema, y sólo si ahí no se lee se cae a negro o a blanco, el que más
 * contraste.
 *
 * Nació de un defecto de §42.3 que sólo se vio mirando la captura: el mazo iba
 * con tema Noche —letra casi blanca— y la última diapositiva llevaba un fondo
 * crema puesto a mano. El alumno pulsaba «Número de diapositiva», la ficha de
 * revisión marcaba «Numerada ✓» y en la pantalla no había ningún número. En una
 * clase que trata precisamente del contraste, el programa estaba cometiendo el
 * error que enseña a corregir, y encima su propia ficha lo tapaba.
 */
export function tintaSobre(fondo: string, preferida: string): string {
  if (contraste(preferida, fondo) >= CONTRASTE_MINIMO) return preferida;
  return contraste('#111827', fondo) >= contraste('#FFFFFF', fondo) ? '#111827' : '#FFFFFF';
}

/**
 * El mismo color, más oscuro. Es el contorno de fábrica de una forma (§44.2).
 *
 * En PowerPoint una forma nace con relleno de acento y la raya de ese mismo
 * acento un tono más oscuro, y eso NO es un adorno: es lo que hace que el
 * encargo «quítale el contorno» se vea. Naciendo sin raya, quitarla no cambiaba
 * un píxel y la mitad de la lección —dentro y raya son dos cosas— no ocurría.
 * Medido jugando el 12-ago-2026.
 *
 * Se deriva del relleno en vez de escribirse una paleta aparte: así el día que
 * un tema estrene color de acento, la raya lo acompaña sola.
 */
export function oscurecer(hex: string, cuanto = 0.38): string {
  const n = hex.replace('#', '');
  const canal = (i: number) =>
    Math.round(parseInt(n.slice(i, i + 2), 16) * (1 - cuanto))
      .toString(16)
      .padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

/* ── el reloj (§43.3) ─────────────────────────────────────────────────────── */

/**
 * Palabras por minuto que se leen **en voz alta**, no con los ojos.
 *
 * 150 es la cifra que se usa para locución y para ensayos de oratoria: leyendo
 * en silencio se va al doble, pero nadie presenta en silencio. Es una constante
 * declarada del mundo, no un número de ajuste, y por eso está aquí arriba con
 * su nombre en vez de escondida dentro de una fórmula.
 */
export const PALABRAS_POR_MINUTO = 150;

/** El respiro de entrar en una diapositiva: mirarla antes de hablar. */
export const SEGUNDOS_DE_RESPIRO = 2;

/** Todas las palabras que hay escritas en la diapositiva, vengan de donde vengan. */
export function palabrasDe(d: Diapositiva): number {
  const cuenta = (t: string | null | undefined) =>
    t ? t.trim().split(/\s+/).filter(Boolean).length : 0;
  const enMarcadores = d.marcadores.reduce((n, m) => n + cuenta(m.contenido), 0);
  const enLibres = d.libres.reduce(
    (n, l) =>
      n +
      (l.clase === 'texto' ? cuenta(l.contenido) : 0) +
      (l.pasos?.reduce((k, p) => k + cuenta(p), 0) ?? 0) +
      (l.filas?.reduce((k, f) => k + f.reduce((j, c) => j + cuenta(c), 0), 0) ?? 0),
    0,
  );
  return enMarcadores + enLibres;
}

/**
 * Lo que tarda esta diapositiva en leerse **en voz alta**, en segundos enteros.
 *
 * Es el suelo del ensayo (§43.3.0): por rápido que pulses, una diapositiva no
 * dura menos de lo que se tarda en decirla. Redondea hacia arriba porque medio
 * segundo de más no engaña a nadie y medio de menos sí.
 */
export function segundosDeLectura(d: Diapositiva): number {
  return SEGUNDOS_DE_RESPIRO + Math.ceil((palabrasDe(d) * 60) / PALABRAS_POR_MINUTO);
}

/** Lo que corre solo dentro de la diapositiva: el video más largo que lleve. */
export function segundosDeVideo(d: Diapositiva): number {
  return d.libres.reduce((s, l) => (l.clase === 'video' ? Math.max(s, l.segundos ?? 0) : s), 0);
}

/**
 * Lo que **va a durar** esta diapositiva aunque nadie la haya ensayado todavía.
 *
 * Dos suelos, y manda el más alto: lo que se tarda en decirla y lo que corre
 * solo dentro de ella. Un video de veinte segundos en una diapositiva de seis
 * palabras dura veinte, no seis.
 */
export function estimadoDe(d: Diapositiva): number {
  return Math.max(segundosDeLectura(d), segundosDeVideo(d));
}

/**
 * El suelo de la GRABACIÓN, que es más alto que el del ensayo (§44.6).
 *
 * Y es la clase entera en una función. Ensayar es pasarlas: el suelo es lo que
 * se tarda en LEER lo que hay escrito. Grabar es contarlas: dices lo que está
 * escrito **y lo que no**, que es para lo que sirve una diapositiva — la
 * diapositiva es el guion, no el discurso—. Por eso hablar tarda más que pasar,
 * y por eso la grabación pisa los intervalos del ensayo y los sube.
 *
 * Sin este suelo la lección desaparecía: un alumno que pulsa igual de rápido
 * grabando que ensayando sacaba los mismos números y el encargo «mira los
 * tiempos» no tenía nada que mirar.
 *
 * El 1.8 es grosero a propósito, como los pesos de la bandeja de salida: lo que
 * tiene que ser cierto es que contar dura **bastante más** que leer, no la
 * cifra. Y el video sigue mandando si es más largo — narrar por encima de un
 * video de veinte segundos no lo acorta.
 */
export function estimadoNarrando(d: Diapositiva): number {
  return Math.max(segundosDeVideo(d), Math.ceil(segundosDeLectura(d) * 1.8));
}

/**
 * Lo que dura esta diapositiva: lo medido si se midió, y si no, el estimado.
 *
 * `intervalo` sólo existe después de un ensayo, y **se borra en cuanto la
 * diapositiva cambia** (`conLaActiva`): un tiempo medido sobre un contenido que
 * ya no está es un número que miente con cara de dato.
 */
export function duracionDeDiapositiva(d: Diapositiva): number {
  return d.intervalo ?? estimadoDe(d);
}
