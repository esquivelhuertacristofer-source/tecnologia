import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import { crudoDe, usaFuncion, vale } from '@/components/office/motor-hojas/consultas';
import { hojaDe, type Celda, type Libro, type Validacion } from '@/components/office/motor-hojas/modelo';

/**
 * `of-excel-validacion` · «Que no se pueda escribir cualquier cosa»
 * (bloques 32 · 39).
 *
 * La última clase exclusiva del grado Intermedio de Tecnia Hojas, y la que
 * sigue directamente de `of-excel-tablas-y-filtros`: ya sabe hacer tablas y
 * filtrar; hoy aprende que filtrar —o contar— sólo funciona si los datos
 * entraron limpios, y que la manera de conseguirlo no es pedirlo por favor,
 * es no dejar escribir otra cosa.
 *
 * ── EL CASO: UNA HOJA QUE VAN A RELLENAR OTROS ──────────────────────────────
 *
 * El comité de la kermés reparte esta hoja para que cada familia anote qué
 * va a traer: una categoría —Bebidas, Postres, Antojitos o Guisados— y
 * cuántas piezas. La captura ya no la hace el alumno: la hacen otros, a mano,
 * sin que nadie los vigile, y por eso la columna de categoría llegó sucia
 * —no por mayúsculas, eso ya lo enseñó `of-excel-datos-limpios` con
 * CONTAR.SI—, sino por un espacio de más y una palabra a medias, que es el
 * tipo de descuido que una lista de VERDAD no deja pasar.
 *
 * ── LA LISTA NO ES COMODIDAD (bloque 32, encargos 1-4) ──────────────────────
 *
 * El encargo 1 hace sufrir el problema antes de nombrarlo: `=CONTAR.SI(B4:B13,
 * "Bebidas")` debería dar 4 y da 2, porque «Bebidas » (con un espacio) y
 * «Bebida» (sin la ese) no son, letra por letra, el texto «Bebidas». El
 * encargo 3 no valida un rango limpio: valida `B4:B30`, que ya trae la
 * columna sucia dentro, a propósito —es la única manera de que el encargo 4
 * pueda enseñar, con los ojos del alumno y no con una frase de este archivo,
 * que una validación puesta HOY no revisa lo que ya estaba escrito AYER
 * (`violaValidacion`, `modelo.ts`, lo dice y aquí se comprueba).
 *
 * ── LOS DOS `bloquea`, Y PARA QUÉ SIRVE CADA UNO (encargos 5-10) ────────────
 *
 * La categoría es `bloquea: true` —Detener— porque un comité no puede
 * resumir donaciones si alguien inventa una categoría nueva cada vez: el
 * encargo 5 lo prueba y no hay manera de forzarlo, ni repitiendo el intento.
 * Las piezas son `bloquea: false` —Advertencia— porque un número raro puede
 * ser real —una familia numerosa trae más—, así que sólo avisa y, si se
 * insiste, deja pasar: el encargo 8 escribe 500 piezas, lee el aviso, y lo
 * vuelve a escribir para que pase. Y el encargo 9 quita esa segunda regla
 * —el comité decide que ya no hace falta vigilar las piezas—, mientras que
 * la de la categoría se queda puesta para siempre: las dos reglas se tratan
 * distinto porque sirven para cosas distintas.
 *
 * ── BUSCAR, REEMPLAZAR E IR A (bloque 39, encargos 11-13) ───────────────────
 *
 * El encargo 11 reemplaza «Bebidas» por «Refrescos» y **casi** rompe la
 * fórmula del encargo 1: `F2` contiene la palabra «Bebidas» dentro de su
 * propio texto, así que un Reemplazar marcado demasiado ancho la tocaría.
 * El encargo 12 es la media lección de buscar dicha con números de verdad:
 * «100» mirando el VALOR encuentra dos celdas —una escrita a mano y una
 * fórmula que también da 100—; mirando la FÓRMULA encuentra sólo una, porque
 * «100» no está escrito dentro del texto `=C6*10`. Y el encargo 13 usa Ir a
 * con un nombre que no existe —y con `Categorias`, el rango con nombre que
 * ya estaba puesto en el libro desde antes, el mismo mecanismo de
 * `n7-referencias`.
 */

export const HOJA = 'h1';
export const NOMBRE_HOJA = 'Aportaciones';

/** A · B · C, en el orden en que se leen. */
export const COL = { familia: 0, categoria: 1, piezas: 2 } as const;

export const FILA_ENCABEZADO = 3;
export const FILA_PRIMERA = 4;
export const FILA_ULTIMA = FILA_PRIMERA + 9; // 13: diez familias
/** La fila donde escribe la «familia nueva» que rellena el formulario ya con la regla puesta. */
export const FILA_NUEVA = FILA_ULTIMA + 1; // 14

interface Aportacion {
  familia: string;
  categoria: string;
  piezas: number;
}

/**
 * Las diez familias tal y como llegaron, **con la columna sucia a
 * propósito**: cuatro de ellas quieren decir «Bebidas» y sólo dos lo dicen
 * exactamente igual. Fila 6 (Vargas) y su C6 = 10 son las que usa el encargo
 * 12: `=C6*10` da 100, el mismo número que I2 trae escrito a mano.
 */
export const ORIGEN: Aportacion[] = [
  { familia: 'Familia Gómez', categoria: 'Bebidas', piezas: 12 }, // fila 4 — exacto
  { familia: 'Familia Ruiz', categoria: 'Postres', piezas: 8 }, // fila 5
  { familia: 'Familia Vargas', categoria: 'bebidas', piezas: 10 }, // fila 6 — minúsculas, CONTAR.SI sí la ve
  { familia: 'Familia Soto', categoria: 'Antojitos', piezas: 15 }, // fila 7
  { familia: 'Familia Reyes', categoria: 'Guisados', piezas: 3 }, // fila 8
  { familia: 'Familia Cano', categoria: 'Bebidas ', piezas: 6 }, // fila 9 — espacio de más, CONTAR.SI no la ve
  { familia: 'Familia Ibarra', categoria: 'Postres', piezas: 9 }, // fila 10
  { familia: 'Familia Núñez', categoria: 'Bebida', piezas: 8 }, // fila 11 — a medias, CONTAR.SI no la ve
  { familia: 'Familia Duarte', categoria: 'Guisados', piezas: 4 }, // fila 12
  { familia: 'Familia Peña', categoria: 'Antojitos', piezas: 11 }, // fila 13
];

/** Las cuatro categorías de la lista desplegable (encargo 3). */
export const CATEGORIAS = ['Bebidas', 'Postres', 'Antojitos', 'Guisados'] as const;

/** Cubre lo viejo (4-13) y lo nuevo (14 en adelante): el encargo 3 valida las dos cosas a la vez. */
export const RANGO_VALIDACION_CATEGORIA = `B${FILA_PRIMERA}:B30`;
export const RANGO_VALIDACION_PIEZAS = `C${FILA_PRIMERA}:C30`;
export const PIEZAS_MIN = 1;
export const PIEZAS_MAX = 30;

export const CATEGORIA_INVALIDA_INTENTADA = 'Refrescos';
export const CATEGORIA_VALIDA_ELEGIDA = 'Postres';
export const PIEZAS_FUERA_DE_RANGO = 500;

export const CATEGORIA_ANTIGUA = 'Bebidas';
export const CATEGORIA_NUEVA = 'Refrescos';

export const CELDA_CONTEO = 'F2';

/** El rango con nombre que ya estaba puesto en el libro — el mecanismo de `n7-referencias`. */
export const NOMBRE_RANGO = 'Categorias';
export const NOMBRE_INEXISTENTE = 'Presupuesto';

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * «Lo que trae cada familia · kermés de fin de cursos.xlsx», con la columna
 * de categoría ya sucia y la comprobación de CONTAR.SI vacía, esperando al
 * encargo 1. `I2`/`I3` son el ejemplo del encargo 12: un número escrito a
 * mano y una fórmula que da el mismo número, para que buscar por VALOR y
 * buscar por FÓRMULA contesten distinto.
 */
export function libroDeAportaciones(): Libro {
  const filaVargas = FILA_PRIMERA + 2; // fila 6
  const celdas: Record<string, Celda> = {
    A1: fuerte('Lo que trae cada familia · kermés de fin de cursos'),
    A2: suelta('El comité reparte esta hoja para que cada familia anote qué trae. La van a llenar OTROS, no tú.'),
    [`A${FILA_ENCABEZADO}`]: fuerte('Familia'),
    [`B${FILA_ENCABEZADO}`]: fuerte('Categoría'),
    [`C${FILA_ENCABEZADO}`]: fuerte('Piezas'),
    E1: fuerte('Comprobación'),
    E2: suelta('¿Cuántas dicen «Bebidas»?'),
    H1: fuerte('Ejemplo de búsqueda'),
    H2: suelta('Anotado a mano:'),
    I2: suelta('100'),
    H3: suelta(`Con fórmula (=C${filaVargas}*10):`),
    I3: suelta(`=C${filaVargas}*10`),
  };
  ORIGEN.forEach((a, i) => {
    const f = FILA_PRIMERA + i;
    celdas[`A${f}`] = suelta(a.familia);
    celdas[`B${f}`] = suelta(a.categoria);
    celdas[`C${f}`] = suelta(String(a.piezas));
  });
  return {
    activa: HOJA,
    nombres: { [NOMBRE_RANGO]: `${NOMBRE_HOJA}!B${FILA_PRIMERA}:B${FILA_ULTIMA}` },
    hojas: [{ id: HOJA, nombre: NOMBRE_HOJA, celdas }],
  };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────── */

const motorDe = (libro: Libro): Motor => crearMotor(libro, RELOJ_DE_LA_CLASE);

function validacionDe(libro: Libro, rango: string): Validacion | undefined {
  return hojaDe(libro, HOJA)?.validaciones?.find((v) => v.rango === rango);
}

/* — encargo 1: CONTAR.SI se queda corto — */

export function laCuentaDeBebidasQuedoCorta(libro: Libro): boolean {
  return usaFuncion(libro, HOJA, CELDA_CONTEO, 'CONTAR.SI') && vale(motorDe(libro), HOJA, CELDA_CONTEO, 2);
}

/* — encargo 2: elección, por qué no dio 4 — */

/* — encargo 3: validar la lista, encima de datos que ya estaban mal —
 *
 * **No encadena con `laCuentaDeBebidasQuedoCorta`.** `F2` es una fórmula
 * VIVA sobre `B4:B13`, y el encargo 11 renombra «Bebidas» a «Refrescos» ahí
 * dentro a propósito: el conteo recalcula solo a 0, correctísimo, y exigir
 * que siguiera en 2 para siempre habría dejado el encargo 11 imposible de
 * cerrar en cuanto se cumpliera. Es la misma reserva que ya dejaron escritas
 * `of-excel-datos-limpios` (`laBaseSigueFirme`) y `of-excel-tablas-y-filtros`
 * (`laFilaDeTotalesEstaPuesta`) para el mismo defecto con otra cara.
 */
export function laListaQuedoValidada(libro: Libro): boolean {
  const v = validacionDe(libro, RANGO_VALIDACION_CATEGORIA);
  if (!v || v.clase !== 'lista' || v.bloquea !== true) return false;
  const lista = (v.lista ?? []).map((x) => x.trim().toLowerCase()).sort();
  const esperada = [...CATEGORIAS].map((x) => x.toLowerCase()).sort();
  return JSON.stringify(lista) === JSON.stringify(esperada);
}

/* — encargo 4: elección, lo viejo se quedó sin marcar — */

/* — encargo 5: elección, el intento inválido se rechazó (Detener) — */

/* — encargo 6: se escoge una categoría válida en la fila nueva — */

export function seEligioUnaCategoriaValida(libro: Libro): boolean {
  if (!laListaQuedoValidada(libro)) return false;
  return crudoDe(libro, HOJA, `B${FILA_NUEVA}`) === CATEGORIA_VALIDA_ELEGIDA;
}

/* — encargo 7: validar las piezas, con Advertencia — */

export function laAdvertenciaDePiezasQuedoPuesta(libro: Libro): boolean {
  if (!seEligioUnaCategoriaValida(libro)) return false;
  const v = validacionDe(libro, RANGO_VALIDACION_PIEZAS);
  return !!v && v.clase === 'numero' && v.bloquea === false && v.min === PIEZAS_MIN && v.max === PIEZAS_MAX;
}

/* — encargo 8: la advertencia avisa y, a la segunda, deja pasar — */

export function laAdvertenciaDejoPasarElNumero(libro: Libro): boolean {
  if (!laAdvertenciaDePiezasQuedoPuesta(libro)) return false;
  return vale(motorDe(libro), HOJA, `C${FILA_NUEVA}`, PIEZAS_FUERA_DE_RANGO);
}

/* — encargo 9: se quita la validación de piezas —
 *
 * **No encadena con `laAdvertenciaDejoPasarElNumero`.** Esa función exige,
 * ella misma, que la validación de C4:C30 siga puesta
 * (`laAdvertenciaDePiezasQuedoPuesta`) — y este encargo es exactamente el que
 * la quita. Encadenar aquí habría dejado un `comprueba` que nunca puede ser
 * verdadero: para llegar a comprobar que la regla YA NO ESTÁ, primero tendría
 * que seguir estando. Se repiten a mano las dos partes de
 * `laAdvertenciaDejoPasarElNumero` que sí siguen valiendo —la categoría
 * elegida y el 500 escrito de verdad— y se deja fuera la que este encargo
 * viene a deshacer. Mismo defecto, mismo remedio que `laListaQuedoValidada` y
 * `seRenombroBebidasSinRomperLaFormula` en este archivo.
 */
export function seQuitoLaValidacionDePiezas(libro: Libro): boolean {
  if (!seEligioUnaCategoriaValida(libro)) return false;
  if (!vale(motorDe(libro), HOJA, `C${FILA_NUEVA}`, PIEZAS_FUERA_DE_RANGO)) return false;
  return !validacionDe(libro, RANGO_VALIDACION_PIEZAS);
}

/* — encargo 10: elección, la diferencia entre Detener y Advertencia — */

/* — encargo 11: reemplazar sin romper la fórmula de fuera —
 *
 * Encadena con `seQuitoLaValidacionDePiezas` y NO con nada que dependa de
 * `F2`: es la propia fórmula la que este encargo va a dejar de largo, así
 * que un predicado que exigiera su valor de siempre se rompería a sí mismo.
 */
export function seRenombroBebidasSinRomperLaFormula(libro: Libro): boolean {
  if (!seQuitoLaValidacionDePiezas(libro)) return false;
  const cambiaron = crudoDe(libro, HOJA, 'B4') === CATEGORIA_NUEVA && crudoDe(libro, HOJA, 'B6') === CATEGORIA_NUEVA;
  const formulaIntacta = crudoDe(libro, HOJA, CELDA_CONTEO).includes(CATEGORIA_ANTIGUA);
  return cambiaron && formulaIntacta;
}

/* — encargo 12: elección, buscar por valor contra buscar por fórmula — */

/* — encargo 13: elección, ir a un nombre que no existe y a uno que sí — */

/* ── el guion ──────────────────────────────────────────────────────────── */

export const GUION_VALIDACION: GuionHojas = {
  archivo: 'Lo que trae cada familia · kermés de fin de cursos.xlsx',
  libro: libroDeAportaciones,

  portada: {
    situacion: 'Excel · Grado intermedio · La clase de la validación',
    tema: 'Validación de datos, y buscar, reemplazar e ir a',
    objetivo:
      'Esta hoja la van a llenar OTROS: diez familias más, a mano, sin que nadie las vigile. Vas a dejar de pedir por favor que escriban bien y vas a diseñar la hoja para que no puedan escribir otra cosa —una lista desplegable para la categoría, un rango de piezas razonable— y de paso vas a aprender a buscar, reemplazar e ir a un sitio sin perderte.',
    vasAHacer: [
      'Descubrir, con una cuenta que sale mal, que una columna capturada a mano no sirve para resumir nada',
      'Poner una lista desplegable que NO deja escribir una categoría que no exista, y comprobar que no revisa lo que ya estaba escrito',
      'Poner un rango de piezas que sólo AVISA si el número es raro, y ver la diferencia con la lista que no deja',
      'Reemplazar un texto sin romper, de pura suerte, una fórmula que lo usaba',
      'Buscar mirando el valor y mirando la fórmula, e ir directo a un rango por su nombre',
    ],
    requisitos:
      'Las clases de Excel de Intermedio: fórmulas, CONTAR.SI y los rangos con nombre de `n7-referencias`. Hoy ese nombre —`Categorias`— ya viene puesto en el libro desde antes, esperando a que lo uses.',
    ayuda:
      'Los cinco controles de hoy están en el panel «Validación», a la derecha. Cada sección se aplica sobre la selección que tengas marcada en la hoja en ese momento.',
  },

  pasos: [
    {
      id: 'sufre-la-cuenta',
      titulo: 'Diez familias, y una cuenta que no cuadra',
      instruccion:
        'Cuatro familias dijeron que traían Bebidas. En **F2** escribe **=CONTAR.SI(B4:B13,"Bebidas")** y mira lo que contesta.',
      pista: 'B4:B13 son las diez filas de familias. CONTAR.SI compara el texto tal cual está escrito, sin distinguir mayúsculas.',
      senal: { control: 'celda:F2' },
      logro: { tipo: 'documento', comprueba: laCuentaDeBebidasQuedoCorta },
      aprendido:
        '**2**, no 4. Mira las filas 6, 9 y 11: «bebidas» en minúsculas SÍ cuenta —eso ya lo sabías desde Datos limpios—, pero «Bebidas » con un espacio de más y «Bebida» a secas no son, letra por letra, el texto «Bebidas». Cuatro familias querían decir lo mismo y la hoja entendió tres cosas distintas.',
    },
    {
      id: 'por-que-no-dio-cuatro',
      titulo: '¿Por qué no dio cuatro?',
      instruccion: '¿Qué tienen las filas 9 y 11 que hace que CONTAR.SI no las cuente, si las tres hablan de lo mismo?',
      pista: 'Fíjate letra por letra, no en el significado: un espacio también es una letra para la hoja.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque CONTAR.SI no distingue mayúsculas de minúsculas',
          'Porque dos de las cuatro no dicen exactamente «Bebidas»: una lleva un espacio de más y otra está escrita a medias',
          'Porque el rango B4:B13 no cubre las diez filas',
        ],
        correcta: 1,
      },
      aprendido:
        'Eso es. Y aquí está el fondo del problema: mientras alguien pueda teclear lo que quiera en esa columna, ninguna cuenta que la resuma —CONTAR.SI, un filtro, una tabla dinámica— va a funcionar. La solución no es pedirle a las familias que tengan más cuidado: es no dejarlas escribir otra cosa.',
    },
    {
      id: 'validar-categoria',
      titulo: 'Una lista que no deja escribir cualquier cosa',
      instruccion:
        'Marca **de B4 a B30** —las diez familias que ya están y veinte filas más para las que faltan— y, en el panel «Validación», pon el tipo **Lista**, escribe **Bebidas, Postres, Antojitos, Guisados** y deja **Detener**. Pulsa Validar.',
      pista: 'B30 es a propósito mucho más de lo que hace falta hoy: así la regla ya está puesta para las familias que todavía no han llegado a llenar la hoja.',
      senal: { control: 'validar' },
      logro: { tipo: 'documento', comprueba: laListaQuedoValidada },
      aprendido:
        'La columna B ya tiene su regla, y cubre desde la fila 4 —donde ya había datos— hasta la 30. Fíjate en un detalle que vas a comprobar en el siguiente encargo: nada en la pantalla cambió en las filas 4 a 13. Poner una regla no revisa nada de lo que ya estaba ahí.',
    },
    {
      id: 'lo-viejo-no-se-marco',
      titulo: 'Lo que ya estaba escrito, ¿se marcó?',
      instruccion: 'Mira la fila 11, la de Familia Núñez: sigue diciendo «Bebida», a medias. ¿Qué hizo la validación con ella?',
      pista: 'Piensa en qué momento exacto se revisa una celda: ¿cuándo se pone la regla, o cuándo se escribe algo nuevo?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'La marcó con un color de error, aunque no se puede corregir sola',
          'No hizo nada con ella: la validación sólo vigila lo que se escriba de ahora en adelante, no lo que ya estaba',
          'La borró, porque no cumplía la regla',
        ],
        correcta: 1,
      },
      aprendido:
        'Nada. Ni un color, ni un aviso, ni un borrado. Es la sorpresa del bloque 32 entera: una validación puesta HOY no repasa lo que se escribió AYER. Si de verdad quieres limpiar lo viejo, hace falta otra herramienta —Quitar duplicados, Relleno rápido, o corregirlo a mano— y ninguna de ésas la dispara poner una regla.',
    },
    {
      id: 'la-lista-detiene',
      titulo: 'Rómpela a propósito: una categoría que no existe',
      instruccion: 'En **B14** —la fila de la familia que sigue— intenta escribir **Refrescos**, que no está en la lista. Mira qué contesta.',
      pista: 'No hay manera de forzarlo: inténtalo dos veces si quieres.',
      senal: { control: 'celda:B14' },
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Excel no dejó escribir eso: pidió elegir una de la lista, y no hubo forma de saltárselo',
          'Excel lo dejó escribir, pero pintó la celda de rojo',
          'Excel lo dejó escribir después de preguntar dos veces',
        ],
        correcta: 0,
      },
      aprendido:
        '«Detener» es eso exactamente: detiene. No hay una segunda pulsación que lo deje pasar, ni un «de todos modos, sí» — la celda se queda como estaba, esperando algo de la lista. En un rato vas a poner una regla que SÍ deja pasar a la segunda: no son la misma herramienta.',
    },
    {
      id: 'elegir-de-la-lista',
      titulo: 'Elige de la flecha',
      instruccion: 'En **B14** pulsa la flechita ▾ que aparece a la derecha de la celda y elige **Postres**.',
      pista: 'La flecha sólo aparece en las celdas con una validación de tipo Lista puesta encima.',
      logro: { tipo: 'documento', comprueba: seEligioUnaCategoriaValida },
      aprendido:
        'Así es como lo va a hacer cada familia que llene esta hoja: sin teclear una letra, eligiendo de la lista. No hay manera de que se equivoquen de categoría, porque no hay dónde escribir una que no sea ésa.',
    },
    {
      id: 'validar-piezas',
      titulo: 'Un número raro puede ser real: sólo avisa',
      instruccion:
        'Marca **de C4 a C30** —la columna de piezas— y en el panel pon **Número**, mínimo **1**, máximo **30**, y cambia el modo a **Advertencia**. Pulsa Validar.',
      pista: 'Treinta piezas es mucho para una sola familia, pero no imposible: por eso esta regla no va a Detener, va a Advertir.',
      senal: { control: 'validar' },
      logro: { tipo: 'documento', comprueba: laAdvertenciaDePiezasQuedoPuesta },
      aprendido:
        'Puesta. Y a propósito NO es «Detener»: una familia numerosa de verdad puede traer cuarenta piezas, y detenerla sería impedir un dato real sólo porque es poco común. Advertencia hace la otra cosa: llama la atención, y deja decidir.',
    },
    {
      id: 'la-advertencia-avisa-y-deja',
      titulo: 'Rómpela otra vez: quinientas piezas',
      instruccion:
        'En **C14** escribe **500** y pulsa Enter. Lee el aviso, y sin cambiar nada, pulsa Enter otra vez para confirmar que sí quieres dejarlo así.',
      pista: 'La primera vez avisa y no lo deja pasar. Con el MISMO texto, una segunda vez sí lo deja: es la diferencia con Detener, que no tiene segunda vez.',
      senal: { control: 'celda:C14' },
      logro: { tipo: 'documento', comprueba: laAdvertenciaDejoPasarElNumero },
      aprendido:
        'Ahí está: 500, escrito de verdad en C14. La Advertencia hizo su trabajo —te detuvo un segundo a pensarlo— y luego confió en ti. Es la misma coreografía de dos pulsaciones que ya viste al combinar celdas: la primera pregunta, la segunda decide.',
    },
    {
      id: 'quitar-validacion-piezas',
      titulo: 'El comité decide que ya no hace falta vigilar las piezas',
      instruccion: 'Marca **de C4 a C30**, otra vez el mismo rango, y pulsa **Quitar validación** en el panel.',
      pista: 'Tiene que ser exactamente el mismo rango con el que se puso la regla: C4:C30.',
      senal: { control: 'quitar-validacion' },
      logro: { tipo: 'documento', comprueba: seQuitoLaValidacionDePiezas },
      aprendido:
        'La regla de las piezas se fue. Fíjate en lo que NO pasó: los números que ya estaban —incluido el 500 de C14— se quedaron exactamente igual. Quitar una validación no revisa ni corrige nada: sólo apaga la vigilancia de aquí en adelante, la misma regla que ya viste al revés en el encargo 4.',
    },
    {
      id: 'detener-contra-advertencia',
      titulo: 'Antes de seguir: dos reglas, dos comportamientos',
      instruccion: '¿Qué diferencia real hubo entre lo que pasó en B14 —la categoría— y lo que pasó en C14 —las piezas—?',
      pista: 'Piensa en si hubo, o no, una segunda oportunidad.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Ninguna: las dos avisaron y las dos dejaron pasar a la segunda',
          'En B14 no había manera de forzarlo —era Detener—; en C14 sí, con una segunda pulsación —era Advertencia',
          'En B14 se pudo forzar y en C14 no',
        ],
        correcta: 1,
      },
      aprendido:
        'Exacto. Detener es para lo que de verdad no puede pasar —una categoría que no existe rompe cualquier resumen—; Advertencia es para lo que casi siempre está mal pero a veces es real —un número fuera de lo normal—. Elegir cuál usar es diseñar la hoja para el que la va a llenar, no para ti.',
    },
    {
      id: 'reemplazar-categoria',
      titulo: 'Reemplazar es peligroso: lee el aviso antes de confirmar',
      instruccion:
        'El comité avisa: «Bebidas» ahora se va a llamar «Refrescos». En el panel «Reemplazar», escribe **Bebidas** → **Refrescos**. Antes de pulsar el botón, marca **de A1 a F13** —toda la hoja, encabezados y la comprobación del encargo 1 incluida, que vive en F2, arriba de la tabla— y pulsa Reemplazar: lee cuántas fórmulas te avisa que va a tocar. Sin confirmar, marca ahora sólo **de B4 a B13** —la columna de categoría, sin la comprobación— y pulsa Reemplazar dos veces para confirmarlo ahí.',
      pista: 'El aviso te dice cuántas celdas va a cambiar y cuántas de ésas son fórmulas. F2 contiene la palabra «Bebidas» dentro de su propio texto: por eso marcarla de más la pondría en la lista.',
      senal: { control: 'reemplazar' },
      logro: { tipo: 'documento', comprueba: seRenombroBebidasSinRomperLaFormula },
      aprendido:
        'Bebidas pasó a llamarse Refrescos en la columna de categoría, y **F2 sigue exactamente igual**: `=CONTAR.SI(B4:B13,"Bebidas")`, con la palabra vieja todavía dentro. Si hubieras confirmado el intento ancho, esa fórmula habría quedado buscando «Refrescos» sin que tú lo pidieras — el peligro real de Reemplazar: no distingue un dato de un pedazo de fórmula, y el aviso de cuántas fórmulas toca es la única defensa antes de confirmar.',
    },
    {
      id: 'buscar-valor-y-formula',
      titulo: 'Buscar «100»: el valor y la fórmula no son lo mismo',
      instruccion:
        'En el panel «Buscar», escribe **100** y pulsa Buscar SIN marcar «buscar en fórmulas». Cuenta las coincidencias. Ahora marca la casilla y vuelve a pulsar Buscar. ¿Cuántas salen esta vez?',
      pista: 'I2 tiene escrito el número 100 a mano. I3 tiene la fórmula =C6*10, que también da 100.',
      senal: { control: 'buscar-panel' },
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Las dos veces salen las mismas dos celdas: I2 e I3',
          'Mirando el valor salen dos —I2 e I3, porque las dos ENSEÑAN 100—; mirando la fórmula sale sólo una —I2—, porque «100» no está escrito dentro del texto =C6*10',
          'Mirando la fórmula salen más resultados, porque busca en todo el libro',
        ],
        correcta: 1,
      },
      aprendido:
        'Ahí está la media lección: buscar por VALOR mira lo que la celda enseña, así que una fórmula que da 100 cuenta igual que un 100 escrito a mano. Buscar por FÓRMULA mira el TEXTO de la regla, y «100» no aparece escrito en ningún lado de `=C6*10` —el 10 y el 6 sí, el resultado no—. Son dos preguntas distintas, y elegir la que no toca es no encontrar nada.',
    },
    {
      id: 'ir-a-un-nombre',
      titulo: 'Ir a: una celda, o un nombre que ya existía',
      instruccion:
        'En el panel «Ir a», escribe **Presupuesto** y pulsa Ir a: mira qué contesta, porque ese nombre no existe. Ahora escribe **Categorias** —el rango con nombre que ya venía puesto en este libro, como los de `n7-referencias`— y pulsa Ir a otra vez.',
      pista: 'Categorias es un nombre que ya alguien puso antes de que abrieras este archivo: apunta a la columna de categoría.',
      senal: { control: 'ir-a' },
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Los dos intentos llevaron al mismo sitio',
          '«Presupuesto» no llevó a ningún lado —no existe—; «Categorias» sí, directo a la columna B4:B13',
          '«Presupuesto» sí funcionó; «Categorias» no existía',
        ],
        correcta: 1,
      },
      aprendido:
        'Ir a con un nombre es más rápido que buscar la celda a ojo, y es exactamente el mismo mecanismo que aprendiste a bautizar en `n7-referencias`: un nombre apunta a un rango, y escribirlo en vez de la dirección te lleva directo, sin desplazarte ni una fila. Con un nombre que no existe, no inventa nada: te lo dice.',
    },
  ],

  cierre:
    'Dejaste de pedir por favor que la hoja se llenara bien, y la diseñaste para que no se pudiera llenar mal. Sufriste primero la cuenta que salió corta por una columna sucia, y le pusiste una lista que Detiene cualquier categoría que no exista —sin revisar lo que ya estaba escrito, la sorpresa del bloque—. Le pusiste a las piezas una regla que sólo Advierte y deja pasar si insistes, y la quitaste cuando el comité decidió que ya no hacía falta. Reemplazaste un texto leyendo el aviso antes de confirmar, para no romper por accidente una fórmula que lo usaba. Y aprendiste que Buscar mira distinto según le pidas el valor o la fórmula, y que Ir a con un nombre —el mismo que aprendiste a poner en la clase de referencias— te lleva directo sin perderte.',
};

export default GUION_VALIDACION;
