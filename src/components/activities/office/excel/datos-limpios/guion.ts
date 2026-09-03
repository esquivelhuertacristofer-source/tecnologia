import { decoracionDeCelda } from '@/components/office/motor-hojas/condicional';
import {
  crudoDe,
  estaVacia,
  formatoDe,
  guardaUnaRegla,
  usaFuncion,
  vale,
} from '@/components/office/motor-hojas/consultas';
import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import { dirAColFila, type Celda, type Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `of-excel-datos-limpios` · «Antes de calcular, limpia» (bloques 44 · 45 · 46).
 *
 * La primera clase exclusiva del grado Avanzado de Tecnia Hojas. Se supone que
 * quien llega aquí ya sabe escribir fórmulas, fijar una referencia con `$` y
 * poner un formato condicional de los normales (barras, escalas, destacar): lo
 * que faltaba era lo que se hace ANTES de calcular, con una lista que llegó de
 * fuera y está sucia.
 *
 * ── EL CASO ──────────────────────────────────────────────────────────────
 *
 * La inscripción a la feria de ciencias se tomó en tres mesas distintas
 * durante el receso, cada una con su propio cuaderno, y alguien lo pasó todo a
 * una sola hoja sin revisar. El resultado es el que tiene cualquier lista que
 * llega de fuera: un alumno anotado dos veces letra por letra igual (Diego), la
 * misma alumna capturada de tres maneras que a la hoja le parecen tres personas
 * (Ana Torres, en MAYÚSCULAS, en minúsculas y bien escrita), y un nombre al que
 * sólo le agarraron media palabra (Carlos).
 *
 * ── LA LECCIÓN QUE TIENE QUE DOLER (bloque 44) ──────────────────────────────
 *
 * Quitar duplicados compara el texto **tal cual está escrito** (la decisión
 * entera de `motor-hojas/datos.ts`, `llaveDeFila`): borra a Diego, que se
 * repitió letra por letra, y **no toca a las tres Ana**, porque para la hoja
 * son tres textos distintos. El encargo dos ni siquiera lo dice: lo pregunta,
 * y el encargo tres lo demuestra con `CONTAR.SI` —que sí compara sin
 * distinguir mayúsculas— para que la sorpresa no sea una frase de este
 * archivo, sino algo que el alumno vio con sus propios ojos.
 *
 * Y Relleno rápido se enseña con su límite por delante: limpia siete de ocho
 * nombres solo, y a Carlos —una sola palabra donde el ejemplo pedía dos— lo
 * deja vacío **sin avisar**, que es justamente el defecto que
 * `motor-hojas/datos.ts` (`deducirPatron`) documenta como su límite honesto.
 * El encargo cinco prueba la otra mitad: es TEXTO, no una regla, así que
 * corregir el original no entera a lo ya rellenado.
 *
 * ── EL `$` OTRA VEZ, CON OTRA CARA (bloque 46) ──────────────────────────────
 *
 * La regla con fórmula del bloque 46 pinta la FILA entera, no la celda que
 * cumple, y eso sólo funciona si el `$` fija la COLUMNA de la fórmula y deja
 * correr la fila —el mismo `$` que ya se usó para que un rango no se moviera
 * al arrastrar, aplicado ahora a que una fórmula se desplace por columnas y no
 * por filas—. El encargo nueve la rompe a propósito sin el `$` —pinta en
 * diagonal, el error clásico— y con una fórmula que da un número en vez de
 * VERDADERO/FALSO —que `comandos.ts` rechaza antes de aplicarla—, y sólo
 * entonces la deja bien puesta.
 *
 * ── UN DEFECTO DE MOTOR QUE ESTA CLASE DESTAPÓ Y SE ARREGLÓ EN SU SITIO ─────
 *
 * `regla-formula` (`comandos.ts`) apilaba una regla nueva encima de la
 * anterior en vez de reemplazarla cuando las dos comparten id —y comparten id
 * cuando se aplican sobre el MISMO rango, que es exactamente lo que pide el
 * encargo nueve: romperla sin `$`, verla pintar en diagonal, y volver a
 * aplicarla ya arreglada—. Como `condicional.ts` sólo AÑADE pintura y nunca la
 * quita, la diagonal de la fórmula rota se quedaba viva debajo de la fila ya
 * corregida y el encargo no se podía cerrar nunca. Se corrigió en
 * `comandos.ts` (el mismo archivo, con su porqué escrito ahí) para que
 * aplicar una regla sobre el mismo id **reemplace** en vez de apilar.
 */

/* ── el libro: la inscripción a la feria de ciencias ─────────────────────── */

export const HOJA = 'h1';
export const TITULO = 'Inscripciones a la feria de ciencias · Materiales';

/** Las columnas de la tabla, en el orden en que se leen. */
export const COL = { crudo: 'A', limpio: 'B', proyecto: 'C', cuota: 'D', aporto: 'E', saldo: 'F' } as const;

export interface Inscripcion {
  /** Como llegó de la mesa de inscripción, con su falta incluida. */
  crudo: string;
  proyecto: string;
  cuota: number;
  aporto: number;
}

/**
 * Las diez filas tal y como llegaron, **con sus dos defectos incluidos**: la
 * fila 1 se repite letra por letra en la fila 2 (Diego, anotado dos veces), y
 * las filas 3, 6 y 8 son la misma Ana Torres capturada tres maneras distintas.
 * Carlos (fila 5) llegó con una sola palabra, no un descuido de quien escribió
 * este archivo: es el encargo 4 entero.
 */
export const ORIGEN: Inscripcion[] = [
  { crudo: 'DIEGO RAMÍREZ', proyecto: 'Volcán que hace erupción', cuota: 150, aporto: 150 },
  { crudo: 'DIEGO RAMÍREZ', proyecto: 'Volcán que hace erupción', cuota: 150, aporto: 150 },
  { crudo: 'María Sánchez', proyecto: 'Batería de limón', cuota: 150, aporto: 100 },
  { crudo: 'ANA TORRES', proyecto: 'Filtro de agua casero', cuota: 150, aporto: 150 },
  { crudo: 'CARLOS', proyecto: 'Brazo robótico', cuota: 150, aporto: 0 },
  { crudo: 'Ana Torres', proyecto: 'Filtro de agua casero', cuota: 150, aporto: 150 },
  { crudo: 'Luis Mendoza', proyecto: 'Cohete de agua', cuota: 150, aporto: 200 },
  { crudo: 'ana torres', proyecto: 'Filtro de agua casero', cuota: 150, aporto: 150 },
  { crudo: 'Valeria Ortiz', proyecto: 'Huerto vertical', cuota: 150, aporto: 50 },
  { crudo: 'Pedro Navarro', proyecto: 'Puente de palitos', cuota: 150, aporto: 130 },
];

export const FILA_PRIMERA = 4;
export const FILA_ULTIMA = FILA_PRIMERA + ORIGEN.length - 1; // 13

/**
 * Lo que queda tras quitar el ÚNICO duplicado exacto (la segunda fila de
 * Diego). No se escribe a mano: se deriva de `ORIGEN`, para que la tabla del
 * libro y lo que el encargo 1 tiene que dejar sean, por construcción, la
 * misma lista.
 */
export const TRAS_DEDUP: Inscripcion[] = ORIGEN.filter((_, i) => i !== 1);
export const FILA_ULTIMA_TRAS_DEDUP = FILA_PRIMERA + TRAS_DEDUP.length - 1; // 12

/** La fila de Carlos, la única de una sola palabra, ya compactada. */
export const FILA_CARLOS = FILA_PRIMERA + TRAS_DEDUP.findIndex((p) => p.crudo === 'CARLOS'); // 7
/** La fila de Ana Torres bien escrita, la que se corrige en el encargo 5. */
export const FILA_ANA_BIEN_ESCRITA = FILA_PRIMERA + TRAS_DEDUP.findIndex((p) => p.crudo === 'ANA TORRES'); // 6

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * «Inscripciones a la feria de ciencias.xlsx», con sus dos defectos ya
 * puestos y ni una celda de más. Es una función y no una constante por lo de
 * siempre: «Empezar de cero» tiene que poder volver a fabricarlo entero, y
 * aquí duele especialmente — una segunda partida sobre los restos de la
 * primera empezaría con Diego ya sin su duplicado.
 */
export function libroDeInscripciones(): Libro {
  const celdas: Record<string, Celda> = {
    A1: fuerte(TITULO),
    A2: suelta('Así llegó: la apuntaron en tres mesas distintas durante el receso, y nadie la revisó.'),
    [`${COL.crudo}3`]: fuerte('Como se apuntó'),
    [`${COL.limpio}3`]: fuerte('Nombre limpio'),
    [`${COL.proyecto}3`]: fuerte('Proyecto'),
    [`${COL.cuota}3`]: fuerte('Cuota'),
    [`${COL.aporto}3`]: fuerte('Aportó'),
    [`${COL.saldo}3`]: fuerte('Saldo'),
    H1: fuerte('Comprobación'),
    H2: suelta('¿Cuántas veces aparece «Ana Torres»?'),
  };
  ORIGEN.forEach((p, i) => {
    const f = FILA_PRIMERA + i;
    celdas[`${COL.crudo}${f}`] = suelta(p.crudo);
    celdas[`${COL.proyecto}${f}`] = suelta(p.proyecto);
    celdas[`${COL.cuota}${f}`] = suelta(String(p.cuota));
    celdas[`${COL.aporto}${f}`] = suelta(String(p.aporto));
    celdas[`${COL.saldo}${f}`] = suelta(`=${COL.aporto}${f}-${COL.cuota}${f}`);
  });
  return { activa: HOJA, nombres: {}, hojas: [{ id: HOJA, nombre: 'Inscripciones', celdas }] };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────── */

const motorDe = (libro: Libro): Motor => crearMotor(libro, RELOJ_DE_LA_CLASE);

/** ¿Esta celda está pintada por alguna regla condicional? */
function pintada(motor: Motor, direccion: string): boolean {
  const p = dirAColFila(direccion);
  return p ? Boolean(decoracionDeCelda(motor, HOJA, p.col, p.fila)?.formato?.colorRelleno) : false;
}

/**
 * Lo único que Relleno rápido sabe deducir de un nombre de dos palabras —cada
 * una con Mayúscula Inicial— y lo que no: con una sola palabra (Carlos) no hay
 * patrón que le cierre, y eso es `null` a propósito (`deducirPatron`, en
 * `motor-hojas/datos.ts`, documenta el mismo límite).
 */
function nombreLimpioEsperado(crudo: string): string | null {
  const palabras = crudo.trim().split(/\s+/);
  if (palabras.length !== 2) return null;
  return palabras.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}

/**
 * La estructura de la tabla tras compactar: proyecto/cuota/aporte en su
 * sitio y la fila 13 vacía de verdad. A propósito **no mira la columna A**:
 * el encargo 5 cambia A6 a mitad de clase, así que ninguna comprobación que
 * tenga que seguir valiendo DESPUÉS de ese encargo puede depender de que la
 * columna A se haya quedado como estaba. (Ver la nota de más abajo, en
 * `laBaseSigueFirme`, sobre el defecto de encadenado que esto evita.)
 */
function laTablaSigueCompactada(libro: Libro): boolean {
  const motor = motorDe(libro);
  const enSuSitio = TRAS_DEDUP.every((p, i) => {
    const f = FILA_PRIMERA + i;
    return (
      crudoDe(libro, HOJA, `${COL.proyecto}${f}`) === p.proyecto &&
      vale(motor, HOJA, `${COL.cuota}${f}`, p.cuota) &&
      vale(motor, HOJA, `${COL.aporto}${f}`, p.aporto)
    );
  });
  return enSuSitio && estaVacia(libro, HOJA, `${COL.crudo}${FILA_ULTIMA}`);
}

/**
 * La columna B (nombre limpio) tal y como debe quedar. `carlosEsperado` es
 * `null` mientras B7 sigue vacío (encargo 4 y 5) y `'Carlos'` desde que se
 * escribe a mano (encargo 6 en adelante). No mira la columna A: el nombre
 * esperado de cada fila sale de `TRAS_DEDUP` —la lista fija que se calculó al
 * cargar el archivo—, no de lo que haya ahora mismo en A, así que corregir
 * A6 en el encargo 5 no cambia lo que aquí se espera para B6.
 */
function losNombresBSiguenBien(libro: Libro, carlosEsperado: string | null): boolean {
  if (guardaUnaRegla(libro, HOJA, `${COL.limpio}${FILA_PRIMERA}`)) return false;
  if (crudoDe(libro, HOJA, `${COL.limpio}${FILA_PRIMERA}`) !== 'Diego Ramírez') return false;
  return TRAS_DEDUP.slice(1).every((p, idx) => {
    const f = FILA_PRIMERA + 1 + idx;
    const celda = `${COL.limpio}${f}`;
    if (f === FILA_CARLOS) {
      return carlosEsperado === null
        ? estaVacia(libro, HOJA, celda)
        : crudoDe(libro, HOJA, celda) === carlosEsperado && !guardaUnaRegla(libro, HOJA, celda);
    }
    const esperado = nombreLimpioEsperado(p.crudo);
    if (esperado === null) return estaVacia(libro, HOJA, celda);
    return crudoDe(libro, HOJA, celda) === esperado && !guardaUnaRegla(libro, HOJA, celda);
  });
}

/* — encargo 1: quitar el duplicado exacto — */

export function laListaTrasQuitarDuplicados(libro: Libro): boolean {
  const nombresOk = TRAS_DEDUP.every(
    (p, i) => crudoDe(libro, HOJA, `${COL.crudo}${FILA_PRIMERA + i}`) === p.crudo,
  );
  return nombresOk && laTablaSigueCompactada(libro);
}

/* — encargo 3: CONTAR.SI descubre a las tres Ana — */

export function seDescubrieronLasTresAnas(libro: Libro): boolean {
  if (!laListaTrasQuitarDuplicados(libro)) return false;
  const motor = motorDe(libro);
  return usaFuncion(libro, HOJA, 'I2', 'CONTAR.SI') && vale(motor, HOJA, 'I2', 3);
}

/* — encargo 4: relleno rápido, con Carlos quedándose vacío — */

export function losNombresQuedanLimpios(libro: Libro): boolean {
  return seDescubrieronLasTresAnas(libro) && losNombresBSiguenBien(libro, null);
}

/**
 * Todo lo que tiene que seguir en pie desde el encargo 5 en adelante: la
 * tabla compactada y que I2 siga teniendo su fórmula CONTAR.SI —no que siga
 * dando 3. **Ya no encadena con `laListaTrasQuitarDuplicados`**, que exige
 * que A6 siga diciendo «ANA TORRES» para siempre: el encargo 5 cambia A6 a
 * propósito, y si esta comprobación siguiera mirando esa celda con su texto
 * original, el encargo 5 —cumplido tal y como lo pide la instrucción—
 * dejaría de reconocerse a sí mismo como válido.
 *
 * Por la misma razón se dejó de exigir `vale(I2, 3)`: I2 es una fórmula
 * VIVA sobre A4:A12, así que en cuanto A6 pasa a «Ana Torres Ruiz» deja de
 * coincidir con "Ana Torres" y CONTAR.SI recalcula solo a 2 —correctísimo,
 * y otra prueba más de que una fórmula sí se entera de los cambios, al
 * revés que el texto de Relleno rápido—. Exigir que siguiera en 3 para
 * siempre habría hecho imposible cerrar el encargo 5 tal y como está escrito.
 * Defecto cazado el 16-ago-2026 probando la clase de punta a punta.
 */
function laBaseSigueFirme(libro: Libro): boolean {
  if (!laTablaSigueCompactada(libro)) return false;
  return usaFuncion(libro, HOJA, 'I2', 'CONTAR.SI');
}

/* — encargo 5: corregir el original no entera a lo ya rellenado — */

export const ANA_CON_MATERNO = 'Ana Torres Ruiz';

export function elRellenoNoSeEntero(libro: Libro): boolean {
  if (!laBaseSigueFirme(libro)) return false;
  if (!losNombresBSiguenBien(libro, null)) return false;
  const celda = `${COL.crudo}${FILA_ANA_BIEN_ESCRITA}`;
  const limpia = `${COL.limpio}${FILA_ANA_BIEN_ESCRITA}`;
  return (
    crudoDe(libro, HOJA, celda) === ANA_CON_MATERNO &&
    crudoDe(libro, HOJA, limpia) === 'Ana Torres' &&
    !guardaUnaRegla(libro, HOJA, limpia)
  );
}

/* — encargo 6: terminar a mano lo que la máquina no supo — */

export function carlosQuedoAMano(libro: Libro): boolean {
  if (!laBaseSigueFirme(libro)) return false;
  if (!losNombresBSiguenBien(libro, 'Carlos')) return false;
  const celda = `${COL.crudo}${FILA_ANA_BIEN_ESCRITA}`;
  return crudoDe(libro, HOJA, celda) === ANA_CON_MATERNO;
}

/* — encargo 7: el saldo, con los negativos en rojo y entre paréntesis — */

export const PATRON_SALDO = '#,##0;[Rojo](#,##0)';

export function elSaldoSeVisteDeRojo(libro: Libro): boolean {
  if (!carlosQuedoAMano(libro)) return false;
  const motor = motorDe(libro);
  return TRAS_DEDUP.every((p, i) => {
    const f = FILA_PRIMERA + i;
    const dir = `${COL.saldo}${f}`;
    const fmt = formatoDe(libro, HOJA, dir);
    return (
      fmt?.tipo === 'personalizado' &&
      fmt.patron === PATRON_SALDO &&
      vale(motor, HOJA, dir, p.aporto - p.cuota)
    );
  });
}

/* — encargo 8: las comillas sin cerrar, y el signo de pesos ya bien — */

export const PATRON_APORTO_ROTO = '"$#,##0';
export const PATRON_APORTO = '"$"#,##0';

export function elAporteLlevaElSignoSinRomperse(libro: Libro): boolean {
  if (!elSaldoSeVisteDeRojo(libro)) return false;
  const motor = motorDe(libro);
  return TRAS_DEDUP.every((p, i) => {
    const f = FILA_PRIMERA + i;
    const dir = `${COL.aporto}${f}`;
    const fmt = formatoDe(libro, HOJA, dir);
    return fmt?.tipo === 'personalizado' && fmt.patron === PATRON_APORTO && vale(motor, HOJA, dir, p.aporto);
  });
}

/* — encargo 9: la regla con fórmula, rota sin $ y luego bien puesta — */

const COLUMNAS_TABLA = [COL.crudo, COL.limpio, COL.proyecto, COL.cuota, COL.aporto, COL.saldo] as const;

export function filasNegativasPintadasEnteras(libro: Libro): boolean {
  if (!elAporteLlevaElSignoSinRomperse(libro)) return false;
  const motor = motorDe(libro);
  return TRAS_DEDUP.every((p, i) => {
    const f = FILA_PRIMERA + i;
    const debePintarse = p.aporto - p.cuota < 0;
    return COLUMNAS_TABLA.every((c) => pintada(motor, `${c}${f}`) === debePintarse);
  });
}

/* ── el guion ──────────────────────────────────────────────────────────── */

export const GUION_DATOS_LIMPIOS: GuionHojas = {
  archivo: 'Inscripciones a la feria de ciencias.xlsx',
  libro: libroDeInscripciones,

  portada: {
    situacion: 'Excel · Grado avanzado · La que deja los datos limpios',
    tema: 'Datos limpios: duplicados, relleno rápido y formato personalizado',
    objetivo:
      'Vas a dejar presentable y automática una lista que llegó de fuera sucia: nombres capturados de varias maneras, alguien apuntado dos veces, y un saldo que hay que leer de un vistazo. Y vas a aprender los límites de las herramientas que la limpian: dónde ayudan solas y dónde te dejan a medias sin avisar.',
    vasAHacer: [
      'Quitar las filas que se repiten letra por letra, y descubrir que las que se repiten a simple vista no se van solas',
      'Limpiar una columna de nombres con Relleno rápido, y verlo fallar a la mitad sin que nadie avise',
      'Vestir un saldo con un formato de número que tú escribes, con los negativos en rojo y entre paréntesis',
      'Pintar la fila entera del que debe dinero con una regla de formato condicional con fórmula',
    ],
    requisitos:
      'Las clases del grado Intermedio: fórmulas con referencias absolutas (`$`) y formato condicional de los normales —barras, escalas, destacar—. Hoy se retoma el `$` para algo que no habías visto: no fija un número, fija UNA COLUMNA y deja correr la fila.',
    ayuda:
      'Quitar duplicados y Relleno rápido están en Datos → Herramientas de datos. El formato personalizado está en Inicio → Número, al lado del desplegable de siempre. La regla con fórmula está en Inicio → Estilos. Los tres últimos abren un cuadro de texto: escribe y pulsa Aplicar, o Enter.',
  },

  pasos: [
    {
      id: 'quitar-duplicados',
      titulo: 'Nueve o diez, según cómo mires',
      instruccion:
        'La lista llegó de tres mesas distintas y sin revisar. Marca **de A3 a E13** —incluye el encabezado— y pulsa **Quitar duplicados**, en Datos → Herramientas de datos. Te va a avisar cuántas filas se van a ir: lee el aviso, y vuelve a pulsar para seguir.',
      pista:
        'A3 es el encabezado de la tabla y E13 es la última celda de «Aportó», el renglón de Pedro Navarro. La columna F (Saldo) no se marca: es una fórmula, y compararla rompería la comparación.',
      senal: { control: 'quitar-duplicados' },
      logro: { tipo: 'documento', comprueba: laListaTrasQuitarDuplicados },
      aprendido:
        'Se fue **una** fila: Diego Ramírez estaba anotado dos veces, letra por letra igual —mismo proyecto, misma cuota, mismo aporte—, y ahora sólo queda una. Quedan nueve inscripciones y la última fila de la tabla se vació de verdad: mira la barra de fórmulas en A13, no dice nada. **Esto no tiene un botón que lo devuelva**: si guardas el archivo así, esa fila no vuelve. Antes de seguir, una pregunta que la pantalla no contesta sola: ¿de verdad eran nueve personas distintas?',
    },
    {
      id: 'por-que-no-se-unieron',
      titulo: '¿Por qué no se unieron?',
      instruccion:
        'Fíjate en las filas 6, 8 y 10: las tres dicen «Ana Torres», con letra distinta —MAYÚSCULAS, Con Mayúscula Inicial, minúsculas—. Quitar duplicados ya pasó por esta tabla y dejó a las tres. ¿Por qué?',
      pista: 'Vuelve a pensar en lo que hizo con Diego: comparaba letra por letra. Ana no se escribió letra por letra igual las tres veces.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque Quitar duplicados sólo compara la primera columna, y «Ana» está repartida en varias',
          'Porque compara el texto tal cual está escrito, y una letra en mayúscula ya es, para la hoja, un texto distinto',
          'Porque hacen falta más de tres repeticiones para que la herramienta las cuente como duplicado',
        ],
        correcta: 1,
      },
      aprendido:
        'Ésa es la trampa del bloque 44 entera: **el duplicado que se ve no es el peligroso**. «ANA TORRES», «Ana Torres» y «ana torres» son, letra por letra, tres textos distintos, así que la herramienta hizo exactamente lo que promete y no lo que tú esperabas. Quedan tres filas de la misma alumna, y nadie te avisó.',
    },
    {
      id: 'cuantas-veces-ana',
      titulo: 'Compruébalo tú mismo',
      instruccion:
        'No lo dejes en sospecha. En **I2** escribe **=CONTAR.SI(A4:A12,"Ana Torres")** y mira lo que contesta.',
      pista:
        'CONTAR.SI cuenta, dentro del rango que le des, cuántas celdas dicen lo que le pidas —y para comparar TEXTO no distingue mayúsculas, al revés que Quitar duplicados.',
      senal: { control: 'celda:I2' },
      logro: { tipo: 'documento', comprueba: seDescubrieronLasTresAnas },
      aprendido:
        '**Tres.** Ahí está la otra mitad de la lección: para CONTAR.SI —como para casi toda fórmula de Excel— «Ana Torres» y «ANA TORRES» SÍ son lo mismo; sólo Quitar duplicados las trata distinto. Dos herramientas del mismo programa, dos reglas de comparación, y la única manera de saber cuál usa cada una es probarlas, como acabas de hacer.',
    },
    {
      id: 'relleno-rapido-nombres',
      titulo: 'Limpia los nombres sin teclearlos uno por uno',
      instruccion:
        'La columna B, «Nombre limpio», está vacía. En **B4** escribe a mano, tal cual: **Diego Ramírez**. Después marca **de B4 a B12** y pulsa **Relleno rápido**, en Datos → Herramientas de datos.',
      pista:
        'B4 es el ejemplo: así quieres que se vean los ocho de abajo. Relleno rápido mira ese ejemplo contra A4 —lo que ya había— y adivina la regla para repetirla en el resto de la columna, mirando en cada fila lo que ELLA misma tiene en la columna A.',
      // Sin `senal`, a propósito: este encargo pide escribir a mano Y marcar Y
      // pulsar un botón, tres campos y no uno. Con un solo control señalado, la
      // guarda del desvío regañaría por escribir en B4 antes de tocar el botón
      // (la misma razón que documentó `of-excel-buscarx` para su encargo 1).
      logro: { tipo: 'documento', comprueba: losNombresQuedanLimpios },
      aprendido:
        'Siete de los ocho quedaron perfectos —«ANA TORRES» pasó a «Ana Torres», «ana torres» también, sin que tocaras nada—. Pero mira la fila 7: **Carlos se quedó vacía**. Nadie avisó, no salió ningún error: la fila de arriba tenía nombre y apellido, y a Carlos sólo le agarraron el nombre —una sola palabra donde el ejemplo pedía dos—. Relleno rápido no inventa lo que no tiene: cuando el patrón no le cierra, prefiere no adivinar antes que rellenar mal a la mitad de la columna, que es exactamente donde nadie mira.',
    },
    {
      id: 'el-relleno-no-se-entera',
      titulo: 'Escribe texto, no una regla',
      instruccion:
        'Resulta que a Ana Torres sí le tomaron el apellido materno en su mesa. Corrígelo: en **A6** cambia el texto por **Ana Torres Ruiz**. Y mira qué pasa en B6.',
      pista: 'A6 es la fila de «ANA TORRES», la que Relleno rápido ya limpió en B6. Cambia sólo A6; no toques B6.',
      senal: { control: 'celda:A6' },
      logro: { tipo: 'documento', comprueba: elRellenoNoSeEntero },
      aprendido:
        '**B6 sigue diciendo «Ana Torres», sin el Ruiz.** Ahí está la diferencia con veinte bloques de fórmulas al revés: una fórmula se entera sola de un cambio arriba —lo llevas viendo desde la clase del `=`—; Relleno rápido no. Escribió un TEXTO, de una sola vez, y ese texto se queda viejo en cuanto cambias el original. Si necesitas que B6 se entere, hay que volver a rellenarlo.',
    },
    {
      id: 'carlos-a-mano',
      titulo: 'Termina a mano lo que la máquina no supo',
      instruccion: 'A Carlos nadie le va a adivinar el apellido. En **B7** escribe, tal cual, sólo: **Carlos**.',
      pista: 'B7 es la fila de Carlos, la que se quedó vacía en el encargo anterior.',
      senal: { control: 'celda:B7' },
      logro: { tipo: 'documento', comprueba: carlosQuedoAMano },
      aprendido:
        'Y con eso la columna queda completa. La lección no es «Relleno rápido está mal hecho»: es que una herramienta que adivina tiene que poder decir «no sé», y cuando lo dice, el trabajo sigue siendo tuyo.',
    },
    {
      id: 'saldo-en-rojo',
      titulo: 'Que el que debe se note',
      instruccion:
        'La columna F, Saldo, mezcla números en negativo y en positivo sin ninguna pista visual. Marca **de F4 a F12** y pulsa **Formato personalizado**, en Inicio → Número. Escribe **#,##0;[Rojo](#,##0)** y pulsa Aplicar.',
      pista:
        'El patrón lleva dos partes separadas por un punto y coma: la primera es para los positivos y el cero; la segunda —el color entre corchetes, y el número entre paréntesis— es para los negativos.',
      senal: { control: 'formato-personalizado' },
      logro: { tipo: 'documento', comprueba: elSaldoSeVisteDeRojo },
      aprendido:
        'Los saldos negativos —María, Carlos, Valeria, Pedro— se ven ahora en rojo y entre paréntesis, como en cualquier estado de cuenta, y los que están al día se leen en negro, sin signo de más. Pulsa **F5** y mira la barra de fórmulas: **sigue diciendo -50**. El patrón no tocó el número, exactamente igual que Moneda o Porcentaje en el grado Básico: sólo cambió cómo se enseña.',
    },
    {
      id: 'el-signo-en-el-aporte',
      titulo: 'Rómpelo con una comilla, y ciérrala',
      instruccion:
        'A la columna E, Aportó, le falta el signo de pesos. Marca **de E4 a E12**, pulsa **Formato personalizado** y escribe **"$#,##0** —con la comilla abierta y SIN cerrar—. Pulsa Aplicar y míralo rechazarlo. Vuelve a pulsar **Formato personalizado** y corrígelo: **"$"#,##0**, con las dos comillas, y pulsa Aplicar otra vez.',
      pista:
        'Una comilla abre un trozo de texto literal dentro del patrón, y ese trozo tiene que cerrarse con otra comilla antes de seguir. `"$"` es el signo de pesos entre comillas, como un texto de una sola letra.',
      senal: { control: 'formato-personalizado' },
      logro: { tipo: 'documento', comprueba: elAporteLlevaElSignoSinRomperse },
      aprendido:
        'La primera vez ni te dejó aplicarlo: «faltan cerrar las comillas del texto», el mismo aviso que darías tú si alguien te entregara una frase a medio cerrar. Con las dos comillas, «150» pasó a leerse **$150** sin dejar de ser un número —súmalo, réstalo, sigue funcionando—. Ni este patrón ni el del Saldo cambiaron un solo valor: los dos visten, ninguno pinta.',
    },
    {
      id: 'pinta-la-fila-completa',
      titulo: 'Rómpela a propósito: sin el $',
      instruccion:
        'Quieres que se vea entera la fila del que todavía debe dinero, no sólo su celda de Saldo. Marca **de A4 a F12** y pulsa **Regla con fórmula**, en Inicio → Estilos. Escribe **=F4<0** —sin el signo de pesos— y pulsa Aplicar: mira cómo pinta. Vuelve a pulsar **Regla con fórmula** y prueba **=F4** a secas, sin comparar nada: te lo va a rechazar. Pulsa **Regla con fórmula** una vez más y escribe, ya bien, **=$F4<0**.',
      pista:
        'F4 es el Saldo de Diego, la primera celda del rango que marcaste: la regla lee la fórmula ahí y la va corriendo por las demás celdas. El `$` antes de la F es el de la clase de referencias: fija la COLUMNA y deja correr la fila. Cada intento es un clic nuevo en Regla con fórmula: el panel se cierra solo después de cada Aplicar.',
      senal: { control: 'regla-formula' },
      logro: { tipo: 'documento', comprueba: filasNegativasPintadasEnteras },
      aprendido:
        'Sin el `$`, la regla no pintaba filas: pintaba en diagonal —cada columna miraba una celda distinta de Saldo, corrida un lugar más cada vez—, que es el error clásico de todo el que aprende formato condicional con fórmula. Y `=F4` a secas ni siquiera se dejó aplicar: «tiene que dar VERDADERO o FALSO», te dijo, porque un Saldo es un número y una regla de pintura necesita una pregunta. Con `=$F4<0` la columna F queda fija y la fila corre sola: María, Carlos, Valeria y Pedro aparecen pintados de punta a punta, y los demás, ni una celda.',
    },
    {
      id: 'que-hace-el-dolar',
      titulo: 'El $ otra vez, y para qué sirve aquí',
      instruccion: 'Antes de cerrar la clase: ¿qué hace exactamente el `$` en `=$F4<0`?',
      pista: 'Piensa en lo que cambió al quitarlo: dejó de mirar la MISMA columna en cada fila.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Convierte la fórmula en un total que suma toda la columna F',
          'Fija la columna F para que no se mueva; la fila sí se mueve, una por cada celda del rango',
          'Hace que la regla sólo pinte la celda F4, y nunca el resto de la fila',
        ],
        correcta: 1,
      },
      aprendido:
        '**Fija la columna y deja correr la fila** — la misma idea del `$` de las referencias absolutas, sólo que aquí no protege un rango de una fórmula que arrastras: protege una fórmula que una REGLA va desplazando sola, celda por celda, para poder preguntar «¿el Saldo de ESTA fila es negativo?» sin importar en qué columna esté pintando.',
    },
  ],

  cierre:
    'Dejaste una lista que llegó sucia lista para usarse. Quitaste las filas que se repetían letra por letra, y descubriste que tres inscripciones de la misma alumna seguían ahí porque una mayúscula de más ya es, para la hoja, una persona distinta. Limpiaste una columna de nombres con Relleno rápido, viste que escribe texto y no una regla —cambiar el original no lo entera—, y que un ejemplo sin apellido lo deja a medias sin avisar. Le diste al saldo un formato que tú mismo escribiste, con los negativos en rojo y entre paréntesis, sin cambiar ni un número. Y pintaste la fila entera del que debe dinero con una fórmula: la rompiste sin el `$` para ver la trampa clásica —la pintura en diagonal— y la arreglaste fijando la columna y dejando correr la fila.',
};

export default GUION_DATOS_LIMPIOS;
