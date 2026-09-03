import { cajaDeTexto, type Caja } from './comandos';
import { valorDe, type Motor } from './formula/calculo';
import { aTexto, esError, textoDeNumero, type Grafica as ObjetoGrafica, type Valor } from './modelo';
/*
 * `dinamica.ts` es el motor de las tablas dinámicas (bloques 49 y 50), y de
 * ahí se trae sólo lo que hace falta para LEER una ya construida: `dinamicaDe`
 * para encontrarla por su `id` y `dinamicaPintada` para su `Construida` —la
 * misma caché que ya usa la ventana, así que un gráfico dinámico y su tabla
 * enseñan siempre lo mismo—. La dependencia va en un solo sentido —de aquí
 * hacia `dinamica.ts`—, así que no hay círculo que cerrar.
 */
import { dinamicaDe, dinamicaPintada } from './dinamica';

/**
 * Tecnia Hojas · `Grafica.tsx` — las gráficas, **dibujadas** (§45.5).
 *
 * ── POR QUÉ NO SE USA UNA LIBRERÍA ──────────────────────────────────────────
 *
 * Está escrito en la anatomía del §45.5 —«las gráficas, dibujadas — no una
 * librería»— y no es una manía de no depender de nadie. Una librería de gráficas
 * trae **su propio modelo**: su idea de qué es una serie, sus tooltips, sus
 * animaciones y, sobre todo, su idea de qué es un eje. Y con eso puesto, **la
 * clase 38 no se puede dar**.
 *
 * La clase 38 se llama «gráficas que mienten» y consiste exactamente en tres
 * cosas que una librería seria no te deja hacer o te disimula: **cortar el eje a
 * propósito** para que una diferencia del 3 % parezca del 300 %, **pintar un
 * pastel de veinte porciones** para que se vea que no se entiende, y **poner un
 * pastel a números que no suman un todo**. Aquí `minY` es un campo del modelo y
 * el eje cortado se dibuja sin decir nada —porque una gráfica que miente no
 * avisa: ése es el punto de la clase—, y el pastel de veinte rebanadas sale con
 * los colores repetidos, que es justo lo ilegible que tiene que ser.
 *
 * A cambio, aquí no hay tooltips ni animaciones. No son de esta sala: un dato
 * que sólo aparece al pasar el ratón no se puede imprimir, no se puede leer en
 * un proyector y no se puede corregir.
 *
 * ── DE DÓNDE SALEN LOS NÚMEROS ──────────────────────────────────────────────
 *
 * De `valorDe(motor, …)`, **celda por celda y en cada pintada**. La gráfica no
 * guarda ni un número: guarda un domicilio (`datos: "A1:B9"`, ver `modelo.ts`).
 * Eso es lo que hace que **una gráfica se recalcule sola cuando cambia una
 * celda**, y no por un mecanismo de suscripción sino porque lee la misma caché
 * que lee una celda: cambia `A3`, el motor recalcula, la ventana repinta y la
 * barra sale con otra altura. Es la decisión 1 de `modelo.ts` cobrada dos meses
 * después.
 *
 * ── CÓMO SE COMPONE ─────────────────────────────────────────────────────────
 *
 * En un `viewBox` que sale del ancla —celdas por píxel de celda—, igual que
 * `motor-diapos/Dibujados.tsx`: el navegador escala el dibujo entero, texto
 * incluido, y no hay que calibrar dos veces. Ni una coordenada está escrita a
 * mano; todas salen del marco y de la escala. Si mañana la gráfica ocupa doce
 * celdas en vez de ocho, no hay nada que tocar.
 *
 * **Nada de aquí lanza.** Un rango de una celda, un rango vacío, un rango con
 * texto, uno con `#¡DIV/0!` dentro y uno de números negativos son cinco cosas
 * que un alumno hace en la primera clase, y las cinco tienen que dibujar algo —o
 * decir por qué no— en vez de tirar la pestaña abajo. Es la decisión 2 de
 * `modelo.ts`: aquí el error es un valor, no una excepción.
 */

/* ── la rejilla, en píxeles ─────────────────────────────────────────────────*/

/**
 * El tamaño de una celda, que es de lo que sale el lienzo.
 *
 * Son los mismos dos números que `ANCHO_COL` y `ALTO_FILA` de
 * `VentanaHojas.tsx`, y están escritos aquí y no importados de allí porque **la
 * ventana importa este archivo**: traerlos de vuelta cerraría un círculo entre
 * los dos módulos.
 *
 * Que estén en dos sitios es exactamente el tipo de cosa que se separa en
 * silencio, así que no se deja en un comentario que pida cuidado: la prueba
 * `el lienzo mide lo mismo que la rejilla` importa las cuatro constantes y las
 * compara. Un aviso escrito en un comentario no es una medida.
 */
export const COL_PX = 88;
export const FILA_PX = 22;

/* ── los colores ────────────────────────────────────────────────────────────*/

/**
 * La paleta de Excel, tal cual: los seis acentos del tema Office.
 *
 * Saturados y no pastel, que es la regla de la casa, y **en este orden**, que es
 * el que el alumno va a volver a ver el día que abra Excel de verdad. Se repiten
 * a partir de la séptima serie, y eso no se arregla con más colores: una gráfica
 * de siete series no se lee, y en el pastel de veinte porciones del bloque 38 la
 * repetición es precisamente la prueba de que no se entiende.
 */
export const PALETA_EXCEL: readonly string[] = [
  '#4472C4', // azul
  '#ED7D31', // naranja
  '#A5A5A5', // gris
  '#FFC000', // ámbar
  '#5B9BD5', // azul claro
  '#70AD47', // verde
];

const color = (i: number): string => PALETA_EXCEL[((i % PALETA_EXCEL.length) + PALETA_EXCEL.length) % PALETA_EXCEL.length];

const TINTA = '#1f2933';
const TINTA_SUAVE = '#5a6572';
const LINEA = '#c9ced6';
const LETRA = 'Segoe UI, Carlito, Calibri, sans-serif';

/* ── leer los datos ─────────────────────────────────────────────────────────*/

export interface SerieDeGrafica {
  nombre: string;
  /** Un hueco es `null` y **no es cero**: es la decisión 3 de `modelo.ts`. */
  puntos: Array<number | null>;
}

export interface DatosDeGrafica {
  /** El rango ya normalizado, o `null` si `datos` no era un rango. */
  caja: Caja | null;
  categorias: string[];
  series: SerieDeGrafica[];
  /** Celdas del rango que enseñan un error. Material del aviso. */
  errores: number;
  /** Celdas con algo dentro que no era un número ni un rótulo. */
  noNumericas: number;
}

const VACIO: DatosDeGrafica = { caja: null, categorias: [], series: [], errores: 0, noNumericas: 0 };

/**
 * Un valor sirve para dibujar **sólo si es un número finito**.
 *
 * Ni el texto, ni `VERDADERO`, ni un error, ni una celda vacía. Los cuatro dan
 * `null` —un hueco— y no cero, porque un hueco y un cero son cosas distintas y
 * dibujarlos igual sería el bloque 15 roto en la pantalla: una barra de altura
 * cero dice «aquí midieron 0» y un hueco dice «aquí no midieron».
 */
const numeroDe = (v: Valor): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * De un rango de celdas a categorías y series.
 *
 * Las dos decisiones que se adivinan —y que Excel también adivina— están juntas
 * a propósito: **la primera fila son rótulos si no tiene ni un número**, y **la
 * primera columna son categorías si no tiene ni un número**. Es lo que acierta
 * en el 90 % de las tablas de clase (una fila de meses, una columna de nombres)
 * y lo que falla en la tabla cuyo encabezado es el año `2024`. Por eso
 * `rotulosEnPrimeraFila` existe en el modelo: puesto a mano, manda.
 *
 * Se exporta porque es la mitad que se puede probar sin pantalla: lo que sale de
 * aquí es lo que el dibujo tiene que enseñar, y una prueba sobre esto no
 * depende de un `<rect>`.
 */
export function leerDatos(motor: Motor, hoja: string, g: ObjetoGrafica): DatosDeGrafica {
  if (g.origenDinamica) return datosDeDinamica(motor, hoja, g.origenDinamica);
  const caja = cajaDeTexto(g.datos);
  if (!caja) return VACIO;

  const filas = caja.f1 - caja.f0 + 1;
  const cols = caja.c1 - caja.c0 + 1;

  const rejilla: Valor[][] = [];
  let errores = 0;
  for (let f = 0; f < filas; f += 1) {
    const linea: Valor[] = [];
    for (let c = 0; c < cols; c += 1) {
      const v = valorDe(motor, hoja, caja.c0 + c, caja.f0 + f);
      if (esError(v)) errores += 1;
      linea.push(v);
    }
    rejilla.push(linea);
  }

  const hayNumero = (vs: Valor[]): boolean => vs.some((v) => numeroDe(v) !== null);

  const encabezado = g.rotulosEnPrimeraFila ?? (filas > 1 && !hayNumero(rejilla[0]));
  const cuerpo = encabezado ? rejilla.slice(1) : rejilla;

  const columnaDel = (c: number): Valor[] => cuerpo.map((l) => l[c]);
  const hayCategorias = cols > 1 && cuerpo.length > 0 && !hayNumero(columnaDel(0));

  const primeraDeDatos = hayCategorias ? 1 : 0;
  const categorias = cuerpo.map((l, i) => (hayCategorias ? aTexto(l[0]) : String(i + 1)));

  const series: SerieDeGrafica[] = [];
  let noNumericas = 0;
  for (let c = primeraDeDatos; c < cols; c += 1) {
    const rotulo = encabezado ? aTexto(rejilla[0][c]).trim() : '';
    const puntos: Array<number | null> = [];
    for (const linea of cuerpo) {
      const n = numeroDe(linea[c]);
      if (n === null && linea[c] !== null && linea[c] !== '') noNumericas += 1;
      puntos.push(n);
    }
    series.push({ nombre: rotulo || `Serie ${series.length + 1}`, puntos });
  }

  return { caja, categorias, series, errores, noNumericas };
}

/**
 * De una tabla dinámica a datos de gráfica (bloque 51): **un gráfico dinámico
 * es una gráfica cuyo origen es una dinámica, no un rango.**
 *
 * No hace falta adivinar dónde está el encabezado, como sí hace `leerDatos`
 * con un rango cualquiera: `dinamicaPintada` ya sale con la forma de una tabla
 * normal —cabeceras arriba, etiquetas a la izquierda— porque así es como se
 * pinta una dinámica (`dinamica.ts`, apartado (1) de su cabecera), así que
 * aquí se lee directamente de esa estructura, con la caché de siempre.
 *
 * **Cómo se entera el gráfico de que la dinámica cambió**: no se entera de
 * nada por su cuenta. Esta función se llama en CADA pintada —la misma
 * disciplina que un rango normal, que vuelve a pedir `valorDe` cada vez— y
 * `dinamicaDe` busca el objeto `Dinamica` de HOY dentro de `motor.libro`. Si
 * nadie pulsó Actualizar, ese objeto es el mismo de antes y `dinamicaPintada`
 * acierta la caché: el gráfico enseña lo viejo, igual que la tabla. Si se
 * pulsó `actualizar-dinamica`, el objeto es otro —mismo `id`, otra
 * referencia— y `dinamicaPintada` se repinta sola: el gráfico se mueve solo,
 * sin que este archivo sepa que existe un botón de actualizar.
 *
 * Dos cosas se dejan FUERA a propósito, y las dos por la misma razón que ya
 * tiene esta sala con el pastel y los negativos: un total no se grafica junto
 * a sus partes.
 *   - La fila «Total general» (`profundidad === 0`): es la suma de las demás
 *     filas, y una barra que es la suma de las otras mentiría de la misma
 *     familia que un pastel repartiendo un negativo.
 *   - El grupo de columnas «Total general», cuando hay campo de columna: la
 *     misma razón, en el otro eje. `enOrdenDeColumna` (`dinamica.ts`) lo deja
 *     siempre al final, así que es siempre el último grupo.
 */
function datosDeDinamica(motor: Motor, hoja: string, idDinamica: string): DatosDeGrafica {
  const din = dinamicaDe(motor.libro, hoja, idDinamica);
  const c = din && dinamicaPintada(motor, din);
  if (!c) return VACIO;

  const indicesFilas: number[] = [];
  const categorias: string[] = [];
  c.filas.forEach((f, i) => {
    if (f.profundidad === 0) return;
    indicesFilas.push(i);
    categorias.push(f.texto);
  });

  const anchoDatos = c.ancho - 1;
  const nCols = c.columnas.length;
  const nv = anchoDatos > 0 && nCols > 0 ? anchoDatos / nCols : 0;
  const hayColumnas = nCols > 1;
  // El último grupo de columnas es el total general — se excluye, y por eso
  // aquí sólo se recorren los `nCols - 1` grupos reales.
  const gruposReales = hayColumnas ? nCols - 1 : nCols;

  const series: SerieDeGrafica[] = [];
  for (let grupo = 0; grupo < gruposReales; grupo += 1) {
    const nombreGrupo = hayColumnas ? c.columnas[grupo].texto : '';
    for (let v = 0; v < nv; v += 1) {
      const col = 1 + grupo * nv + v;
      /*
       * Con un solo campo de valores Y un campo de columna, la última fila de
       * cabecera ES la fila del grupo —«abril», «enero»— y no una fila de
       * nombre de valor aparte: leerla dos veces daría «abril · abril». Con
       * más de un valor, o sin campo de columna, esa fila SÍ es la del
       * nombre del valor y hay que leerla.
       */
      const nombreValor = hayColumnas && nv === 1 ? '' : aTexto(c.celdas[(c.cabeceras - 1) * c.ancho + col]);
      const nombre = [nombreGrupo, nombreValor].filter(Boolean).join(' · ') || `Serie ${series.length + 1}`;
      const puntos = indicesFilas.map((i) => numeroDe(c.celdas[(c.cabeceras + i) * c.ancho + col]));
      series.push({ nombre, puntos });
    }
  }

  return { caja: c.region, categorias, series, errores: 0, noNumericas: 0 };
}

/* ── la escala ──────────────────────────────────────────────────────────────*/

interface Escala {
  min: number;
  max: number;
}

/**
 * De dónde a dónde llega el eje de los valores.
 *
 * **`minY` manda si está puesto; si no, el eje empieza en cero** —o más abajo,
 * si hay negativos, porque una barra de −40 tiene que caber—. Que se pueda
 * cortar el eje **es una capacidad pedagógica, no un descuido**: es literalmente
 * el bloque 38 del temario, y el dibujo lo obedece sin poner ninguna advertencia
 * en la gráfica, porque una gráfica que miente no avisa de que miente. Quien
 * avisa es la clase.
 */
export function escalaDe(valores: number[], minY?: number): Escala {
  let dMin = Infinity;
  let dMax = -Infinity;
  // Con un bucle y no con `Math.min(...valores)`: un rango grande desparramado
  // en argumentos revienta la pila de llamadas, y aquí el rango lo elige el
  // alumno.
  for (const v of valores) {
    if (v < dMin) dMin = v;
    if (v > dMax) dMax = v;
  }
  if (!Number.isFinite(dMin) || !Number.isFinite(dMax)) {
    dMin = 0;
    dMax = 1;
  }
  const min = minY !== undefined && Number.isFinite(minY) ? minY : Math.min(0, dMin);
  // Un eje que empieza y acaba en el mismo sitio es una división por cero
  // esperando: se le da un palmo de aire y el dibujo sale plano, que es lo que
  // significan unos datos todos iguales.
  const max = dMax > min ? dMax : min + Math.max(1, Math.abs(min) / 10);
  return { min, max };
}

/**
 * El escalón del eje: 1, 2, 5 y sus décimas y decenas, nunca 3 ni 7.
 *
 * Es la única razón por la que un eje se lee: las marcas caen en números que el
 * alumno puede decir en voz alta. Con el rango partido en cinco a pelo saldrían
 * marcas en 137, 274, 411…
 */
export function pasoBonito(rango: number, objetivo: number): number {
  if (!Number.isFinite(rango) || rango <= 0) return 1;
  const bruto = rango / Math.max(1, objetivo);
  const base = 10 ** Math.floor(Math.log10(bruto));
  const n = bruto / base;
  const mult = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return mult * base;
}

/**
 * Las marcas del eje, contadas **en escalones enteros**.
 *
 * Es a propósito que el bucle vaya sobre `i` y multiplique, en vez de sumar el
 * paso una y otra vez: sumando 0,1 diez veces se llega a 0,9999999999999999 y la
 * última marca se cae del eje por un pelo. Ni un épsilon, como manda
 * `consultas.ts`: aritmética de enteros y una multiplicación.
 */
export function marcasDeEje(min: number, max: number, objetivo = 5): number[] {
  const paso = pasoBonito(max - min, objetivo);
  const i0 = Math.ceil(min / paso);
  const i1 = Math.floor(max / paso);
  const marcas: number[] = [];
  for (let i = i0; i <= i1 && marcas.length < 40; i += 1) marcas.push(Number((i * paso).toPrecision(12)));
  return marcas;
}

/** Un número, escrito como lo escribe la hoja. La misma función que la celda. */
const cifra = (v: number): string => textoDeNumero(Number(v.toPrecision(12)));

/* ── el marco y las piezas de dibujo ────────────────────────────────────────*/

interface Marco {
  /** El rectángulo donde se dibuja de verdad, ya descontados rótulos y leyenda. */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  min: number;
  max: number;
  pt: number;
}

/** De un valor a su altura dentro del marco. */
const aY = (m: Marco, v: number): number => m.y1 - ((v - m.min) / (m.max - m.min)) * (m.y1 - m.y0);

/** De un valor a su distancia horizontal, para las barras acostadas. */
const aX = (m: Marco, v: number): number => m.x0 + ((v - m.min) / (m.max - m.min)) * (m.x1 - m.x0);

const dentro = (a: number, b: number, v: number): number => Math.max(a, Math.min(b, v));

/**
 * Dónde está el suelo de las barras.
 *
 * En el cero **si el cero está dentro del eje**, y en el borde del marco si no
 * — que es lo que pasa con el eje cortado del bloque 38: con `minY = 90`, las
 * barras nacen abajo del todo y por eso la diferencia entre 92 y 95 parece un
 * abismo. Es el mecanismo de la mentira, escrito en una línea.
 */
const suelo = (m: Marco): number => aY(m, dentro(m.min, m.max, 0));
const sueloX = (m: Marco): number => aX(m, dentro(m.min, m.max, 0));

function Texto({
  x,
  y,
  children,
  pt,
  color: tinta = TINTA,
  ancla = 'middle',
  peso = 400,
  giro,
  marca,
}: {
  x: number;
  y: number;
  children: string;
  pt: number;
  color?: string;
  ancla?: 'start' | 'middle' | 'end';
  peso?: number;
  /** Grados de rotación alrededor del propio punto. Para el rótulo del eje Y. */
  giro?: number;
  marca?: string;
}) {
  return (
    <text
      x={x}
      y={y}
      fontFamily={LETRA}
      fontSize={pt}
      fontWeight={peso}
      fill={tinta}
      textAnchor={ancla}
      data-rotulo={marca}
      transform={giro === undefined ? undefined : `rotate(${giro} ${x} ${y})`}
    >
      {children}
    </text>
  );
}

/* ── los cinco dibujos ──────────────────────────────────────────────────────*/

interface PintaProps {
  m: Marco;
  datos: DatosDeGrafica;
  rotulos: boolean;
  /**
   * El segundo eje (bloque 52): su propio marco y quién vive en él. Los dos
   * opcionales a la vez — sin ellos, cada serie se dibuja con `m`, que es
   * exactamente el comportamiento de siempre para una gráfica sin eje
   * secundario. `m2` comparte `x0`/`x1` con `m` —las categorías no cambian de
   * eje— y sólo trae `min`/`max` distintos.
   */
  m2?: Marco;
  esSecundaria?: (indiceSerie: number) => boolean;
}

/**
 * Columnas y barras son **el mismo dibujo girado**, y aun así se escriben
 * aparte.
 *
 * La tentación es un solo componente con un `eje: 'x' | 'y'`, y el precio sería
 * que la única función que coloca las barras tuviera un parámetro que decide
 * cuál de las dos coordenadas es cuál — el mismo motivo por el que
 * `ajustarPorFilas` y `ajustarPorColumnas` están separadas en `comandos.ts`.
 * Una equivocación ahí no da error: da una gráfica con las barras por el eje que
 * no era.
 */
function Columnas({ m, m2, esSecundaria, datos, rotulos }: PintaProps) {
  const cats = Math.max(1, datos.categorias.length);
  const nSeries = Math.max(1, datos.series.length);
  const anchoCat = (m.x1 - m.x0) / cats;
  const anchoBarra = Math.max(1, (anchoCat * 0.78) / nSeries);
  return (
    <>
      {datos.series.map((s, is) => {
        // El eje X —las categorías— nunca cambia; el eje Y sí, si esta serie
        // vive en el segundo (bloque 52). Con eso, «dónde nace la barra» —el
        // cero de SU eje, no del otro— también depende de `mSerie`.
        const mSerie = esSecundaria?.(is) && m2 ? m2 : m;
        const base = suelo(mSerie);
        return (
          <g key={is} data-serie={is}>
            {s.puntos.map((v, i) => {
              if (v === null) return null;
              const x = m.x0 + i * anchoCat + anchoCat * 0.11 + is * anchoBarra;
              const y = dentro(mSerie.y0, mSerie.y1, aY(mSerie, v));
              const arriba = Math.min(y, base);
              const alto = Math.abs(y - base);
              return (
                <g key={i}>
                  <rect
                    data-barra={`${is}-${i}`}
                    x={x}
                    y={arriba}
                    width={anchoBarra * 0.92}
                    height={alto}
                    fill={color(is)}
                  />
                  {rotulos && (
                    <Texto x={x + anchoBarra * 0.46} y={arriba - m.pt * 0.35} pt={m.pt * 0.85} color={TINTA_SUAVE}>
                      {cifra(v)}
                    </Texto>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </>
  );
}

function Barras({ m, m2, esSecundaria, datos, rotulos }: PintaProps) {
  const cats = Math.max(1, datos.categorias.length);
  const nSeries = Math.max(1, datos.series.length);
  const altoCat = (m.y1 - m.y0) / cats;
  const altoBarra = Math.max(1, (altoCat * 0.78) / nSeries);
  return (
    <>
      {datos.series.map((s, is) => {
        // Aquí el valor es el eje X, así que es el que cambia de marco.
        const mSerie = esSecundaria?.(is) && m2 ? m2 : m;
        const base = sueloX(mSerie);
        return (
          <g key={is} data-serie={is}>
            {s.puntos.map((v, i) => {
              if (v === null) return null;
              const y = m.y0 + i * altoCat + altoCat * 0.11 + is * altoBarra;
              const x = dentro(mSerie.x0, mSerie.x1, aX(mSerie, v));
              const izquierda = Math.min(x, base);
              const ancho = Math.abs(x - base);
              return (
                <g key={i}>
                  <rect
                    data-barra={`${is}-${i}`}
                    x={izquierda}
                    y={y}
                    width={ancho}
                    height={altoBarra * 0.92}
                    fill={color(is)}
                  />
                  {rotulos && (
                    <Texto
                      x={izquierda + ancho + m.pt * 0.3}
                      y={y + altoBarra * 0.72}
                      pt={m.pt * 0.85}
                      color={TINTA_SUAVE}
                      ancla="start"
                    >
                      {cifra(v)}
                    </Texto>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </>
  );
}

/**
 * Las líneas, con **los huecos abiertos**.
 *
 * Un punto que falta corta la línea y empieza otro tramo, en vez de unir el
 * anterior con el siguiente. Unirlos sería inventar el dato que falta —dibujar
 * una recta por encima de un mes en el que nadie midió—, y eso es exactamente la
 * clase 38 con otra cara.
 */
function Lineas({ m, m2, esSecundaria, datos, rotulos }: PintaProps) {
  const cats = Math.max(1, datos.categorias.length);
  const paso = cats > 1 ? (m.x1 - m.x0) / (cats - 1) : 0;
  const enX = (i: number): number => (cats > 1 ? m.x0 + i * paso : (m.x0 + m.x1) / 2);
  return (
    <>
      {datos.series.map((s, is) => {
        const mSerie = esSecundaria?.(is) && m2 ? m2 : m;
        const aYs = (v: number): number => dentro(mSerie.y0, mSerie.y1, aY(mSerie, v));
        const tramos: string[] = [];
        let abierto = false;
        s.puntos.forEach((v, i) => {
          if (v === null) {
            abierto = false;
            return;
          }
          tramos.push(`${abierto ? 'L' : 'M'}${enX(i)} ${aYs(v)}`);
          abierto = true;
        });
        return (
          <g key={is}>
            <path
              data-linea={is}
              d={tramos.join(' ')}
              stroke={color(is)}
              strokeWidth={2.4}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {s.puntos.map((v, i) =>
              v === null ? null : (
                <g key={i}>
                  <circle
                    data-punto={`${is}-${i}`}
                    cx={enX(i)}
                    cy={aYs(v)}
                    r={Math.max(2, m.pt * 0.26)}
                    fill={color(is)}
                  />
                  {rotulos && (
                    <Texto x={enX(i)} y={aYs(v) - m.pt * 0.6} pt={m.pt * 0.85} color={TINTA_SUAVE}>
                      {cifra(v)}
                    </Texto>
                  )}
                </g>
              ),
            )}
          </g>
        );
      })}
    </>
  );
}

/**
 * La dispersión: **dos columnas de números enfrentadas**, no categorías.
 *
 * Es lo que la separa de las otras cuatro y lo que el bloque 37 enseña a elegir:
 * aquí el eje de abajo no es una lista de meses, es una medida. La primera serie
 * es la X y la segunda la Y, como en Excel. Con una sola columna la X pasa a ser
 * el número de orden, y **se dice en un aviso**: dibujar en silencio algo que el
 * alumno no pidió es peor que no dibujarlo.
 */
function Dispersion({
  m,
  x,
  y,
  escalaX,
  rotulos,
}: {
  m: Marco;
  x: Array<number | null>;
  y: Array<number | null>;
  escalaX: Escala;
  rotulos: boolean;
}) {
  const enX = (v: number): number =>
    m.x0 + ((v - escalaX.min) / (escalaX.max - escalaX.min)) * (m.x1 - m.x0);
  return (
    <>
      {y.map((vy, i) => {
        const vx = x[i] ?? null;
        if (vy === null || vx === null) return null;
        const px = dentro(m.x0, m.x1, enX(vx));
        const py = dentro(m.y0, m.y1, aY(m, vy));
        return (
          <g key={i}>
            <circle data-punto={`0-${i}`} cx={px} cy={py} r={Math.max(2.5, m.pt * 0.3)} fill={color(0)} />
            {rotulos && (
              <Texto x={px} y={py - m.pt * 0.6} pt={m.pt * 0.85} color={TINTA_SUAVE}>
                {`${cifra(vx)}, ${cifra(vy)}`}
              </Texto>
            )}
          </g>
        );
      })}
    </>
  );
}

/**
 * El pastel, y **qué hace con un número negativo**.
 *
 * Un pastel reparte un total en pedazos, y un pedazo negativo no existe: no se
 * puede quitar una rebanada de un pastel. Excel dibuja su valor absoluto, que es
 * una mentira silenciosa —la rebanada de −30 sale igual de gorda que la de 30—.
 * Aquí **los negativos se quedan fuera y la gráfica lo dice** en un renglón, que
 * es lo contrario del eje cortado: aquello es una mentira que la clase 38 enseña
 * a destapar, y esto es un dato que no cabe en este dibujo y hay que decirlo.
 *
 * Y si no queda ni una rebanada positiva, no se dibuja nada y también se dice.
 * Lo que no hace en ninguno de los dos casos es lanzar.
 */
function Circular({
  cx,
  cy,
  r,
  valores,
  rotulos,
  pt,
}: {
  cx: number;
  cy: number;
  r: number;
  valores: number[];
  rotulos: boolean;
  pt: number;
}) {
  const total = valores.reduce((s, v) => s + v, 0);
  if (total <= 0 || r <= 0) return null;
  // Los ángulos se calculan ANTES de pintar, con una suma acumulada: escribir en
  // una variable mientras se renderiza haría que el mismo `map` corriendo dos
  // veces diera un pastel distinto.
  const cortes = valores.reduce<number[]>((acc, v) => [...acc, acc[acc.length - 1] + (v / total) * Math.PI * 2], [
    -Math.PI / 2,
  ]);
  return (
    <>
      {valores.map((v, i) => {
        const a0 = cortes[i];
        const a1 = cortes[i + 1];
        const grande = a1 - a0 > Math.PI ? 1 : 0;
        // Una rebanada que se lleva el pastel entero no se puede dibujar con un
        // arco —el principio y el final son el mismo punto y el navegador no
        // dibuja nada—: es un círculo, y se dibuja como un círculo.
        const media = (a0 + a1) / 2;
        const rx = cx + Math.cos(media) * r * 0.62;
        const ry = cy + Math.sin(media) * r * 0.62;
        return (
          <g key={i}>
            {valores.length === 1 ? (
              <circle data-rebanada={i} cx={cx} cy={cy} r={r} fill={color(i)} stroke="#fff" strokeWidth={1.5} />
            ) : (
              <path
                data-rebanada={i}
                d={`M${cx} ${cy} L${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} A${r} ${r} 0 ${grande} 1 ${
                  cx + Math.cos(a1) * r
                } ${cy + Math.sin(a1) * r} Z`}
                fill={color(i)}
                stroke="#fff"
                strokeWidth={1.5}
              />
            )}
            {/* El porcentaje va DENTRO de la rebanada y el nombre en la leyenda:
                con las dos cosas dentro, un pastel de seis pedazos ya no se lee.
                Quién es cada color lo dice la leyenda, que para eso está. */}
            {rotulos && (
              <Texto x={rx} y={ry} pt={pt * 0.9} color="#fff" peso={700}>
                {`${Math.round((v / total) * 100)}%`}
              </Texto>
            )}
          </g>
        );
      })}
    </>
  );
}

/* ── la línea de tendencia (bloque 52) ───────────────────────────────────────
 *
 * Mínimos cuadrados sobre los puntos NUMÉRICOS de una serie —los huecos no
 * cuentan, igual que en el resto de esta sala—, y sobre el eje X que le
 * corresponda al tipo de gráfica: el orden de la categoría (1, 2, 3…) para
 * columnas y líneas, o el valor real de la primera serie para la dispersión.
 *
 * **Qué hace la tendencia con pocos puntos**: nada especial, y es a propósito.
 * `n` —cuántos puntos entraron— viaja SIEMPRE en la respuesta, tenga la
 * gráfica cuatro puntos o cuarenta, porque decidir que cuatro puntos «no son
 * una tendencia» es una lectura pedagógica, no una regla de aritmética: una
 * recta de mínimos cuadrados sobre cuatro puntos es tan legítima como sobre
 * cuarenta. El motor no la rechaza ni la esconde — la traza, y dice `n` para
 * que la clase pueda señalarlo. Lo único que de verdad impide trazar una
 * recta es no tener con qué: menos de dos puntos numéricos, o todos los
 * puntos con la misma X (una serie de texto da cero puntos numéricos; una
 * dispersión con un solo valor de X repetido da un denominador exactamente
 * cero, sin épsilon de por medio, la misma disciplina que `consultas.ts`).
 */
export interface Tendencia {
  /** Cuántos puntos numéricos había para calcularla. Siempre presente. */
  n: number;
  /** `null` si no se pudo trazar una recta: `pendiente` e `interseccion` van juntos. */
  pendiente: number | null;
  interseccion: number | null;
}

export function lineaDeTendencia(xs: number[], ys: Array<number | null>): Tendencia {
  let n = 0;
  let sx = 0;
  let sy = 0;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < ys.length; i += 1) {
    const y = ys[i];
    if (y === null) continue;
    const x = xs[i];
    n += 1;
    sx += x;
    sy += y;
    sxy += x * y;
    sxx += x * x;
  }
  if (n < 2) return { n, pendiente: null, interseccion: null };
  const denominador = n * sxx - sx * sx;
  if (denominador === 0) return { n, pendiente: null, interseccion: null };
  const pendiente = (n * sxy - sx * sy) / denominador;
  const interseccion = (sy - pendiente * sx) / n;
  return { n, pendiente, interseccion };
}

/**
 * La recta dibujada de borde a borde del marco.
 *
 * Recibe el dominio en las DOS unidades a la vez —`xNVal`/`xNPx`— porque cada
 * tipo de gráfica traduce «posición» a píxel de una forma distinta (categorías
 * repartidas para columnas y líneas, valor real para la dispersión) y esta
 * pieza no necesita saber cuál: sólo dibuja entre dos puntos ya resueltos.
 */
function LineaDeTendencia({
  m,
  x0Px,
  x0Val,
  x1Px,
  x1Val,
  tendencia,
}: {
  m: Marco;
  x0Px: number;
  x0Val: number;
  x1Px: number;
  x1Val: number;
  tendencia: Tendencia;
}) {
  if (tendencia.pendiente === null || tendencia.interseccion === null) return null;
  const y0 = dentro(m.y0, m.y1, aY(m, tendencia.pendiente * x0Val + tendencia.interseccion));
  const y1 = dentro(m.y0, m.y1, aY(m, tendencia.pendiente * x1Val + tendencia.interseccion));
  return (
    <line data-tendencia="" x1={x0Px} y1={y0} x2={x1Px} y2={y1} stroke={TINTA_SUAVE} strokeWidth={1.6} strokeDasharray="5 4" />
  );
}

/* ── el componente ──────────────────────────────────────────────────────────*/

export interface GraficaProps {
  grafica: ObjetoGrafica;
  motor: Motor;
  /** La hoja de la que come. Hoy siempre la suya (reserva (c) de `comandos.ts`). */
  hoja: string;
}

/** Cuántos avisos se pintan a la vez. Tres renglones ya son una nota, no un dibujo. */
const MAX_AVISOS = 2;

export default function Grafica({ grafica, motor, hoja }: GraficaProps) {
  const datos = leerDatos(motor, hoja, grafica);
  const w = Math.max(160, grafica.ancla.cols * COL_PX);
  const h = Math.max(90, grafica.ancla.filas * FILA_PX);
  const pt = Math.max(7, Math.min(13, h / 18));

  const esPastel = grafica.tipo === 'circular';
  const esDispersion = grafica.tipo === 'dispersion';
  const acostada = grafica.tipo === 'barras';
  const conRotulos = grafica.rotulosDeDato === true;
  const conLeyenda = grafica.leyenda !== false;

  /*
   * ── el eje secundario (bloque 52) ──────────────────────────────────────
   *
   * Un pastel y una dispersión no tienen «una serie más» que separar de las
   * demás —el pastel sólo dibuja la primera y la dispersión enfrenta dos
   * columnas fijas—, así que el conjunto se deja vacío ahí y todo sigue
   * exactamente como sin este campo.
   */
  const indicesSecundarios = new Set<number>(!esPastel && !esDispersion ? (grafica.ejeSecundario ?? []) : []);
  const esSecundaria = (is: number): boolean => indicesSecundarios.has(is);

  /* ── qué se dibuja, y qué hay que advertir ───────────────────────────── */

  const avisos: string[] = [];
  if (!datos.caja) {
    avisos.push(
      grafica.origenDinamica
        ? `no existe una tabla dinámica «${grafica.origenDinamica}» de la que sacar los números.`
        : `«${grafica.datos}» no es un rango: la gráfica no sabe de dónde comer.`,
    );
  }

  // Para el pastel manda la PRIMERA serie y nada más, como en Excel.
  const serieDelPastel = datos.series[0];
  if (esPastel && datos.series.length > 1) {
    avisos.push(`Un pastel dibuja una sola serie: aquí se reparte «${serieDelPastel.nombre}».`);
  }

  const positivos: number[] = [];
  const etiquetasDelPastel: string[] = [];
  let negativos = 0;
  if (esPastel && serieDelPastel) {
    serieDelPastel.puntos.forEach((v, i) => {
      if (v === null) return;
      if (v < 0) {
        negativos += 1;
        return;
      }
      // Un cero también se queda fuera, y de ése no hay nada que decir: una
      // rebanada de nada es una rebanada de nada, no un dato que no cabe.
      if (v === 0) return;
      positivos.push(v);
      etiquetasDelPastel.push(datos.categorias[i] ?? String(i + 1));
    });
    if (negativos > 0) {
      avisos.push(
        `Un pastel reparte un total y un pedazo negativo no existe: ${negativos} valor(es) se quedaron fuera.`,
      );
    }
  }

  // La dispersión enfrenta dos columnas: la primera es la X y la segunda la Y.
  const xDispersion = esDispersion && datos.series.length > 1 ? datos.series[0].puntos : null;
  const yDispersion = esDispersion ? (datos.series[datos.series.length > 1 ? 1 : 0]?.puntos ?? []) : [];
  if (esDispersion && datos.series.length < 2) {
    avisos.push('Una dispersión enfrenta dos columnas de números: aquí sólo hay una, así que abajo va el orden.');
  }

  // Los valores que mandan en el eje de los valores — separados en dos
  // cubetas cuando hay eje secundario, cada serie a la suya.
  const valoresDelEje: number[] = [];
  const valoresSecundarios: number[] = [];
  if (esDispersion) {
    for (const v of yDispersion) if (v !== null) valoresDelEje.push(v);
  } else {
    datos.series.forEach((s, is) => {
      const cubeta = esSecundaria(is) ? valoresSecundarios : valoresDelEje;
      for (const v of s.puntos) if (v !== null) cubeta.push(v);
    });
  }
  const hayEjeSecundario = valoresSecundarios.length > 0;

  if (datos.caja && valoresDelEje.length === 0 && valoresSecundarios.length === 0 && positivos.length === 0) {
    avisos.push(`No hay ningún número en ${grafica.datos}: una gráfica dibuja números, no palabras.`);
  }
  if (datos.errores > 0) {
    avisos.push(`${datos.errores} celda(s) del rango enseñan un error: eso no se puede dibujar.`);
  }
  if (grafica.tendenciaSerie !== undefined && esPastel) {
    avisos.push('Una línea de tendencia no tiene sentido en un pastel: reparte un total, no sigue un orden.');
  }

  const escala = escalaDe(valoresDelEje, grafica.minY);
  const marcas = marcasDeEje(escala.min, escala.max, acostada ? 4 : 5);
  const escalaSecundaria = escalaDe(valoresSecundarios, grafica.minYSecundario);
  const marcasSecundarias = hayEjeSecundario ? marcasDeEje(escalaSecundaria.min, escalaSecundaria.max, acostada ? 4 : 5) : [];

  const xsDispersion: number[] = [];
  if (xDispersion) {
    for (const v of xDispersion) if (v !== null) xsDispersion.push(v);
  } else if (esDispersion) {
    // Sin segunda columna, la X es el número de orden. Se dice arriba en un aviso.
    for (let i = 0; i < yDispersion.length; i += 1) xsDispersion.push(i + 1);
  }
  const escalaX = escalaDe(xsDispersion);
  const marcasX = marcasDeEje(escalaX.min, escalaX.max, 4);

  /* ── el marco: todo lo demás sale de aquí ────────────────────────────── */

  const alturaAvisos = Math.min(avisos.length, MAX_AVISOS) * pt * 1.2;
  const alturaLeyenda = conLeyenda && datos.series.length > 0 ? pt * 1.8 : 0;
  const alturaTitulo = grafica.titulo ? pt * 2.2 : pt * 0.8;
  const alturaEjeX = grafica.ejeX ? pt * 1.5 : 0;
  // Los rótulos de debajo: las categorías en las verticales, los números en la
  // acostada y en la dispersión. En el pastel no hay eje y no ocupan nada.
  const alturaRotulosX = esPastel ? 0 : pt * 1.45;

  // El hueco de la izquierda es el del texto más largo que va a caer ahí, medido
  // a ojo de caracteres: dentro de un SVG no hay a quién preguntarle cuánto mide
  // un texto sin montarlo, y montar para medir es lo que convierte un dibujo en
  // un parpadeo (misma cuenta que `Dibujados.tsx`).
  const masLargo = (xs: string[]): number => xs.reduce((n, s) => Math.max(n, s.length), 1);
  const anchoIzquierda = acostada ? masLargo(datos.categorias) : masLargo(marcas.map(cifra));
  const alturaEjeY = grafica.ejeY ? pt * 1.5 : 0;
  // El hueco de la derecha, sólo si hay eje secundario — la misma cuenta que
  // el de la izquierda, del lado de afuera.
  const anchoDerecha = hayEjeSecundario ? masLargo(marcasSecundarias.map(cifra)) : 0;

  const m: Marco = {
    x0: 6 + alturaEjeY + Math.min(w * 0.42, anchoIzquierda * pt * 0.58 + 6),
    y0: alturaTitulo,
    x1: w - 10 - (hayEjeSecundario ? Math.min(w * 0.3, anchoDerecha * pt * 0.58 + 8) : 0),
    y1: h - 4 - alturaAvisos - alturaLeyenda - alturaEjeX - alturaRotulosX,
    min: escala.min,
    max: escala.max,
    pt,
  };
  // El marco nunca se da la vuelta, pase lo que pase con el ancla: una gráfica de
  // dos celdas de alto no se puede leer, pero tampoco puede reventar la pintada
  // con un `height` negativo, que es lo que un SVG no perdona.
  m.x1 = Math.max(m.x0 + 10, m.x1);
  m.y1 = Math.max(m.y0 + 10, m.y1);
  // El segundo eje comparte el rectángulo entero con el primero — sólo cambia
  // el `min`/`max` que traduce un valor a una altura (bloque 52).
  const m2: Marco | undefined = hayEjeSecundario ? { ...m, min: escalaSecundaria.min, max: escalaSecundaria.max } : undefined;

  const cats = Math.max(1, datos.categorias.length);
  const anchoCat = (m.x1 - m.x0) / cats;
  const altoCat = (m.y1 - m.y0) / cats;

  const rPastel = Math.max(4, Math.min((m.x1 - m.x0) / 2, (m.y1 - m.y0) / 2) * 0.94);
  const cxPastel = (m.x0 + m.x1) / 2;
  const cyPastel = (m.y0 + m.y1) / 2;

  const rotuloDe = (s: SerieDeGrafica, i: number): string => s.nombre || `Serie ${i + 1}`;

  /*
   * ── la línea de tendencia (bloque 52) ────────────────────────────────────
   *
   * Se dibuja en columnas, líneas y dispersión — no en barras (el eje de las
   * categorías queda vertical y la recta perdería su lectura de izquierda a
   * derecha) ni en el pastel (no tiene sentido: se avisó más arriba). El
   * dominio de la X cambia con el tipo —índice de categoría, o el valor real
   * en la dispersión— pero el rango en píxeles es siempre `m.x0`..`m.x1`,
   * porque `aX` manda el mínimo del dominio a `x0` y el máximo a `x1` sin
   * importar cuál sea ese dominio.
   */
  const indiceTendencia = grafica.tendenciaSerie;
  const serieTendencia = indiceTendencia !== undefined ? datos.series[indiceTendencia] : undefined;
  let tendencia: Tendencia | null = null;
  let tendenciaXVal = { x0: 0, x1: 0 };
  if (serieTendencia) {
    if (esDispersion) {
      const xsCrudo = xDispersion ?? yDispersion.map((_, i) => i + 1);
      const xs = xsCrudo.map((v) => v ?? 0);
      const ys = yDispersion.map((v, i) => (xsCrudo[i] === null ? null : v));
      tendencia = lineaDeTendencia(xs, ys);
      tendenciaXVal = { x0: escalaX.min, x1: escalaX.max };
    } else {
      const xs = serieTendencia.puntos.map((_, i) => i);
      tendencia = lineaDeTendencia(xs, serieTendencia.puntos);
      tendenciaXVal = { x0: 0, x1: Math.max(0, cats - 1) };
    }
  }
  const mTendencia = indiceTendencia !== undefined && esSecundaria(indiceTendencia) && m2 ? m2 : m;
  const seDibujaTendencia = tendencia !== null && (grafica.tipo === 'columnas' || grafica.tipo === 'lineas' || esDispersion);

  return (
    <svg
      className="hjw-grafica-svg"
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={`Gráfica de ${grafica.tipo}${grafica.titulo ? `: ${grafica.titulo}` : ''}, con los datos de ${
        grafica.origenDinamica ? `la tabla dinámica ${grafica.origenDinamica}` : grafica.datos
      }`}
      data-tipo={grafica.tipo}
    >
      <title>{grafica.titulo ?? `Gráfica de ${grafica.tipo}`}</title>
      <rect x={0} y={0} width={w} height={h} fill="#fff" />

      {grafica.titulo && (
        <Texto x={w / 2} y={pt * 1.5} pt={pt * 1.25} peso={700} marca="titulo">
          {grafica.titulo}
        </Texto>
      )}

      {/* ── los ejes ── */}
      {!esPastel && (
        <g>
          {/* Las rayas de fondo, una por marca. Son lo que deja comparar dos
              barras que no están pegadas: sin ellas hay que medir con el dedo. */}
          {marcas.map((v) =>
            acostada ? (
              <line
                key={v}
                x1={aX(m, v)}
                y1={m.y0}
                x2={aX(m, v)}
                y2={m.y1}
                stroke={LINEA}
                strokeWidth={v === 0 ? 1.4 : 0.8}
              />
            ) : (
              <line
                key={v}
                x1={m.x0}
                y1={aY(m, v)}
                x2={m.x1}
                y2={aY(m, v)}
                stroke={LINEA}
                strokeWidth={v === 0 ? 1.4 : 0.8}
              />
            ),
          )}
          {/* Los números del eje de los valores. */}
          {marcas.map((v) =>
            acostada ? (
              <Texto key={v} x={aX(m, v)} y={m.y1 + pt * 1.15} pt={pt * 0.85} color={TINTA_SUAVE} marca="marca">
                {cifra(v)}
              </Texto>
            ) : (
              <Texto
                key={v}
                x={m.x0 - 4}
                y={aY(m, v) + pt * 0.34}
                pt={pt * 0.85}
                color={TINTA_SUAVE}
                ancla="end"
                marca="marca"
              >
                {cifra(v)}
              </Texto>
            ),
          )}
          <line x1={m.x0} y1={m.y0} x2={m.x0} y2={m.y1} stroke={TINTA_SUAVE} strokeWidth={1.1} />
          <line x1={m.x0} y1={m.y1} x2={m.x1} y2={m.y1} stroke={TINTA_SUAVE} strokeWidth={1.1} />
        </g>
      )}

      {/*
        ── el segundo eje (bloque 52) ──
        Sin rayas de fondo propias: las del primer eje ya marcan la
        cuadrícula, y dos juegos de rayas a distinta escala en el mismo
        rectángulo no se leen, se estorban. Sólo sus números y su línea, del
        lado de afuera — la mitad honesta de la clase; la otra mitad, que
        `minYSecundario` pueda cortarlo, no se anuncia aquí por la misma razón
        que `minY` no se anuncia.
      */}
      {!esPastel && m2 && (
        <g data-eje-secundario="">
          {marcasSecundarias.map((v) => (
            <Texto key={v} x={m.x1 + 4} y={aY(m2, v) + pt * 0.34} pt={pt * 0.85} color={TINTA_SUAVE} ancla="start" marca="marca-2">
              {cifra(v)}
            </Texto>
          ))}
          <line x1={m.x1} y1={m.y0} x2={m.x1} y2={m.y1} stroke={TINTA_SUAVE} strokeWidth={1.1} />
        </g>
      )}

      {/* ── los rótulos de categoría ── */}
      {!esPastel && !esDispersion && !acostada &&
        datos.categorias.map((c, i) => (
          <Texto
            key={i}
            x={m.x0 + i * anchoCat + anchoCat / 2}
            y={m.y1 + pt * 1.15}
            pt={pt * 0.85}
            color={TINTA_SUAVE}
            marca="categoria"
          >
            {c}
          </Texto>
        ))}
      {acostada &&
        datos.categorias.map((c, i) => (
          <Texto
            key={i}
            x={m.x0 - 4}
            y={m.y0 + i * altoCat + altoCat / 2 + pt * 0.34}
            pt={pt * 0.85}
            color={TINTA_SUAVE}
            ancla="end"
            marca="categoria"
          >
            {c}
          </Texto>
        ))}
      {esDispersion &&
        marcasX.map((v) => (
          <Texto key={v} x={aX({ ...m, min: escalaX.min, max: escalaX.max }, v)} y={m.y1 + pt * 1.15} pt={pt * 0.85} color={TINTA_SUAVE} marca="marca-x">
            {cifra(v)}
          </Texto>
        ))}

      {/* ── el dibujo ── */}
      {grafica.tipo === 'columnas' && <Columnas m={m} m2={m2} esSecundaria={esSecundaria} datos={datos} rotulos={conRotulos} />}
      {grafica.tipo === 'barras' && <Barras m={m} m2={m2} esSecundaria={esSecundaria} datos={datos} rotulos={conRotulos} />}
      {grafica.tipo === 'lineas' && <Lineas m={m} m2={m2} esSecundaria={esSecundaria} datos={datos} rotulos={conRotulos} />}
      {seDibujaTendencia && tendencia && (
        <LineaDeTendencia
          m={mTendencia}
          x0Px={m.x0}
          x1Px={m.x1}
          x0Val={tendenciaXVal.x0}
          x1Val={tendenciaXVal.x1}
          tendencia={tendencia}
        />
      )}
      {esDispersion && (
        <Dispersion
          m={m}
          x={xDispersion ?? yDispersion.map((_, i) => i + 1)}
          y={yDispersion}
          escalaX={escalaX}
          rotulos={conRotulos}
        />
      )}
      {esPastel && (
        <Circular cx={cxPastel} cy={cyPastel} r={rPastel} valores={positivos} rotulos={conRotulos} pt={pt} />
      )}

      {/* ── los rótulos de los ejes (bloque 18) ── */}
      {grafica.ejeX && (
        <Texto x={(m.x0 + m.x1) / 2} y={m.y1 + alturaRotulosX + pt * 1.15} pt={pt * 0.95} peso={600} marca="ejeX">
          {grafica.ejeX}
        </Texto>
      )}
      {grafica.ejeY && (
        <Texto
          x={pt * 1.05}
          y={(m.y0 + m.y1) / 2}
          pt={pt * 0.95}
          peso={600}
          giro={-90}
          marca="ejeY"
        >
          {grafica.ejeY}
        </Texto>
      )}

      {/* ── la leyenda ── */}
      {conLeyenda && datos.series.length > 0 && (
        <g data-leyenda="">
          {(esPastel ? etiquetasDelPastel : datos.series.map(rotuloDe)).slice(0, 8).map((nombre, i, lista) => {
            const ancho = (m.x1 - m.x0) / Math.max(1, lista.length);
            const x = m.x0 + i * ancho;
            const y = h - alturaAvisos - pt * 0.8;
            return (
              <g key={`${nombre}-${i}`}>
                <rect x={x} y={y - pt * 0.72} width={pt * 0.72} height={pt * 0.72} fill={color(i)} />
                <Texto x={x + pt} y={y} pt={pt * 0.85} color={TINTA_SUAVE} ancla="start" marca="leyenda">
                  {nombre}
                </Texto>
              </g>
            );
          })}
        </g>
      )}

      {/* ── lo que hay que decir en voz alta ──
          Nunca sobre el eje cortado: eso es la clase 38 y la gráfica no lo
          delata. Sí sobre lo que este dibujo no puede enseñar. */}
      {avisos.slice(0, MAX_AVISOS).map((a, i) => (
        <Texto
          key={i}
          x={w / 2}
          y={h - alturaAvisos + pt * 1.2 * i + pt}
          pt={pt * 0.82}
          color="#a4262c"
          marca="aviso"
        >
          {a}
        </Texto>
      ))}
    </svg>
  );
}
