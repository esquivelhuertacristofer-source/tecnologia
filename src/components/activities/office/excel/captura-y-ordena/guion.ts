import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { crudoDe, estaVacia, guardaUnaRegla, mismoValor, valorDe } from '@/components/office/motor-hojas/consultas';
import type { GuionHojas } from '@/components/office/motor-hojas/guion';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `n5-captura-y-ordena` · «La lista de quién ya pagó» (temario §45.2, bloques
 * 5 · 8 · 11 · 16 · 19; reparto del §45.3).
 *
 * La segunda clase de Tecnia Hojas, una semana después de la primera y en el
 * mismo archivo: la tesorera de 5.º B ya cuadró los gastos de la salida a
 * Teotihuacán —eso fue `n5-celdas-filas-columnas`— y ahora le toca lo que viene
 * detrás de cualquier hoja de cálculo del mundo, que es **capturar**.
 *
 * ── POR QUÉ ESTA CLASE SÍ TRAE UNA FÓRMULA, Y SÓLO UNA ──────────────────────
 *
 * La clase 1 llega sin ninguna y su guion explica por qué: enseñar el domicilio
 * de una celda no necesita calcular nada, y una `=SUMA` de adorno le enseña al
 * alumno que eso es magia que ya venía puesta. Aquí hay **una**, en `C17`, y no
 * es una excepción a aquella regla: es la misma regla del otro lado.
 *
 * El bloque 11 incluye el **pegado especial**, y «pegar sólo los valores» es
 * literalmente *quedarse con el resultado y dejar la regla atrás*. Sin una regla
 * de la que separarse, ese botón hace lo mismo que Pegar y el encargo sería
 * teatro: el alumno pulsaría un botón, vería el mismo número que ya estaba, y
 * aprendería que «pegar valores» no significa nada.
 *
 * Así que la fórmula está aquí **para dejarla atrás, no para leerla**. El alumno
 * no escribe ni una —las escribe en la clase 3— y lo único que se le pide es que
 * mire la barra de fórmulas en las dos celdas y vea que una guarda `=SUMA(...)`
 * y la otra guarda un número. Eso no adelanta el bloque 13: lo anuncia con el
 * objeto delante, que es la mejor manera de anunciar algo.
 *
 * ── LO QUE ESTA CLASE **NO** PUEDE HACER, Y SE DICE ─────────────────────────
 *
 * **Copiar en una hoja y pegar en otra.** El comando `pegar` lee y escribe en la
 * misma hoja (`comandos.ts`), así que la ventana lo corta con un aviso en vez de
 * pegar lo que hubiera en esas mismas celdas de la hoja de destino — que es el
 * peor final posible: parecido a lo pedido y sin avisar. Por eso los tres
 * encargos del bloque 11 pasan **dentro de la hoja de los pagos**, que además es
 * donde pasan en la vida real: se copia una columna y se pega al lado.
 *
 * **Ctrl al arrastrar el cuadrito sólo hace la mitad.** Fuerza la copia; no
 * fuerza la cuenta. El motivo largo está en `VentanaHojas.tsx`, junto a
 * `soltarTirador`, que es donde se buscará.
 */

/* ── el libro de la tesorera, una semana después ────────────────────────────*/

export const RELOJ = { ahora: Date.UTC(2026, 7, 21, 9, 0, 0) };

/** La hoja donde pasa todo. Llega llamándose «Hoja3» y es medio encargo. */
export const HOJA = 'h3';

export const CUOTA = 320;

/**
 * Los once que la tesorera alcanzó a apuntar, en el orden en que fueron
 * pagando, que es el orden en que se apunta de verdad y **el que no sirve para
 * buscar a nadie**. De ahí sale el encargo 12.
 *
 * `entrego` vacío es quien todavía no ha dado su cuota. Vacío **no es cero**
 * (bloque 15, y por eso se escribe así desde ahora): esa columna no dice «pagó
 * 0 pesos», dice «aquí no hay nada apuntado todavía».
 */
export const ALUMNOS: Array<{ nombre: string; entrego: string }> = [
  { nombre: 'Rodrigo Bautista', entrego: '320' },
  { nombre: 'Ana Karen Solís', entrego: '320' },
  { nombre: 'Emiliano Cruz', entrego: '' },
  { nombre: 'Fernanda Nieto', entrego: '320' },
  { nombre: 'Josué Pineda', entrego: '320' },
  { nombre: 'Rebeca Villalobos', entrego: '320' },
  { nombre: 'Bruno Márquez', entrego: '' },
  { nombre: 'Ivanna Delgado', entrego: '320' },
  { nombre: 'Santiago Peña', entrego: '320' },
  { nombre: 'Camila Rosas', entrego: '' },
  { nombre: 'Mateo Guzmán', entrego: '320' },
];

/** El primer folio del talonario de recibos. Los demás salen de arrastrar. */
export const PRIMER_FOLIO = 101;

/** Cuántos renglones tiene la lista cuando está completa: los once y el que falta. */
export const RENGLONES = ALUMNOS.length + 1;

/** La primera fila de datos y la última, en número de fila de la hoja. */
export const FILA_PRIMERA = 4;
export const FILA_ULTIMA = FILA_PRIMERA + RENGLONES - 1; // 15

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * «Gastos de la salida del salón.xlsx», el mismo archivo de la clase pasada.
 *
 * La hoja «Salida» llega **ya arreglada**, con la fila del estacionamiento
 * metida y la de la propina fuera: es lo que el alumno dejó hecho la clase
 * pasada, y verlo así al abrir es la mitad de la continuidad. Nadie trabaja hoy
 * sobre ella y por eso no se toca ni un encargo: está para que el archivo sea el
 * mismo archivo y no un decorado nuevo con el mismo nombre.
 *
 * Y es una función, no una constante, por lo que dice `guion.ts`: «Empezar de
 * cero» tiene que poder volver a fabricarlo entero.
 */
export function libroDeLosPagos(): Libro {
  const pagos: Record<string, Celda> = {
    A1: fuerte('Quién ya pagó · salida a Teotihuacán'),
    A2: suelta(`Cuota por alumno: ${CUOTA} pesos`),

    A3: fuerte('Alumno'),
    B3: fuerte('Le toca'),
    C3: fuerte('Ya entregó'),
    // Sin negrita, y es el encargo 7: la tesorera añadió la columna después y se
    // le quedó con otra pinta que las otras tres.
    D3: suelta('Folio'),

    A17: fuerte('Ya se juntó'),
    // La única fórmula del libro. Está para dejarla atrás (ver la cabecera).
    C17: suelta(`=SUMA(C${FILA_PRIMERA}:C${FILA_ULTIMA})`),

    A19: fuerte('Corte del viernes'),

    // Los dos primeros folios, tecleados en la columna que no era. El encargo 4
    // los muda a su sitio con Cortar y Pegar.
    F4: suelta(String(PRIMER_FOLIO)),
    F5: suelta(String(PRIMER_FOLIO + 1)),
  };

  ALUMNOS.forEach((a, i) => {
    pagos[`A${FILA_PRIMERA + i}`] = suelta(a.nombre);
    if (a.entrego) pagos[`C${FILA_PRIMERA + i}`] = suelta(a.entrego);
  });
  // La cuota, escrita una sola vez. Las otras once salen del cuadrito (encargo 6).
  pagos[`B${FILA_PRIMERA}`] = suelta(String(CUOTA));

  return {
    // Se entra ya en la hoja de los pagos: hoy no toca buscarla, toca llenarla.
    activa: HOJA,
    nombres: {},
    hojas: [
      {
        id: 'h1',
        nombre: 'Salida',
        celdas: {
          A1: fuerte('Gastos de la salida del salón · 5.º B'),
          A3: fuerte('Concepto'),
          B3: fuerte('Cuántos'),
          C3: fuerte('Precio'),
          D3: fuerte('Lo pagado'),

          A4: suelta('Camión de la escuela a Teotihuacán'),
          B4: suelta('1'),
          C4: suelta('4800'),
          D4: suelta('4800'),

          A5: suelta('Entradas a la zona arqueológica'),
          B5: suelta('38'),
          C5: suelta('95'),
          D5: suelta('3610'),

          A6: suelta('Guía del recorrido'),
          B6: suelta('1'),
          C6: suelta('700'),
          D6: suelta('700'),

          A7: suelta('Torta y agua para cada quien'),
          B7: suelta('38'),
          C7: suelta('65'),
          D7: suelta('2470'),

          A8: suelta('Botiquín y papelería'),
          B8: suelta('1'),
          C8: suelta('240'),
          D8: suelta('240'),

          A9: suelta('Estacionamiento del camión'),
          B9: suelta('1'),
          C9: suelta('180'),
          D9: suelta('180'),

          A11: suelta('Alumnos que van'),
          B11: suelta('38'),
          A12: suelta('Maestros que acompañan'),
          B12: suelta('3'),
        },
      },
      {
        id: 'h2',
        nombre: 'Cotizaciones',
        celdas: {
          A1: fuerte('Lo que cobraba cada empresa'),
          A3: fuerte('Empresa'),
          B3: fuerte('Por el viaje'),
          A4: suelta('Autobuses del Valle'),
          B4: suelta('4800'),
          A5: suelta('Turismo Xólotl'),
          B5: suelta('5200'),
          A6: suelta('Transportes Anáhuac'),
          B6: suelta('4650'),
        },
      },
      // Sin nombre de verdad y en el último lugar: los tres encargos del bloque
      // 16 son exactamente arreglar eso.
      { id: HOJA, nombre: 'Hoja3', celdas: pagos },
    ],
  };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────────*/

/**
 * Los predicados son funciones puras **con nombre** que leen el libro con
 * `consultas.ts` y **comprueban el vecindario entero**, no la celda que cambió.
 *
 * Aquí eso no es un lujo de estilo, es lo que salió jugando mal: la mitad de los
 * encargos de esta clase mueven muchas celdas de golpe —un arrastre llena doce,
 * una mudanza vacía dos y llena otras dos, ordenar reescribe cuarenta y ocho— y
 * un predicado que mirara sólo el resultado bonito aprobaría un libro con la
 * lista destrozada por detrás. El de ordenar es el ejemplo puro: comprobar que
 * los nombres quedaron en orden **da igual** si las cantidades se quedaron
 * quietas, que es justo el desastre que el bloque 19 enseña a evitar.
 */

const enPagos = (libro: Libro, direccion: string): string => crudoDe(libro, HOJA, direccion);

const valeEnPagos = (libro: Libro, direccion: string) =>
  valorDe(crearMotor(libro, RELOJ), HOJA, direccion);

/** ¿Siguen los once apuntados de la tesorera, cada uno en su renglón? */
function losOnceSiguenEnSuSitio(libro: Libro): boolean {
  return ALUMNOS.every((a, i) => enPagos(libro, `A${FILA_PRIMERA + i}`) === a.nombre);
}

/** Encargo 1: el renglón que faltaba, con su nombre y sus 320 **como número**. */
export function faltabaUnaYYaEsta(libro: Libro): boolean {
  return (
    losOnceSiguenEnSuSitio(libro) &&
    enPagos(libro, `A${FILA_ULTIMA}`).trim().length > 0 &&
    valeEnPagos(libro, `C${FILA_ULTIMA}`) === CUOTA
  );
}

/**
 * Encargo 2: el apunte de Rebeca se fue **y el renglón sigue ahí**.
 *
 * Se comprueban las dos cosas porque son dos botones distintos y confundirlos es
 * el defecto que la clase 1 anunció: Suprimir vacía la celda y «Eliminar filas»
 * se lleva el renglón entero. Si el alumno usa el segundo, la columna A pierde a
 * Rebeca, `losOnceSiguenEnSuSitio` dice que no y el encargo no se da por hecho.
 */
export function elApunteDeRebecaSeBorro(libro: Libro): boolean {
  return (
    losOnceSiguenEnSuSitio(libro) &&
    faltabaUnaYYaEsta(libro) &&
    estaVacia(libro, HOJA, `C${FILA_PRIMERA + 5}`)
  );
}

/** Encargo 3: volvió a estar, sin teclearlo, y no se llevó por delante nada. */
export function elApunteDeRebecaVolvio(libro: Libro): boolean {
  return faltabaUnaYYaEsta(libro) && valeEnPagos(libro, `C${FILA_PRIMERA + 5}`) === CUOTA;
}

/**
 * Encargo 4: los dos folios se **mudaron** de la F a la D.
 *
 * Mudarse es llegar y **dejar de estar**, así que las dos mitades se preguntan.
 * Un alumno que copie en vez de cortar deja los folios en las dos columnas y la
 * hoja parece correcta por la izquierda: es el error que hay que cazar aquí,
 * porque es exactamente la diferencia entre las dos herramientas.
 */
export function losFoliosSeMudaron(libro: Libro): boolean {
  return (
    faltabaUnaYYaEsta(libro) &&
    valeEnPagos(libro, 'D4') === PRIMER_FOLIO &&
    valeEnPagos(libro, 'D5') === PRIMER_FOLIO + 1 &&
    estaVacia(libro, HOJA, 'F4') &&
    estaVacia(libro, HOJA, 'F5')
  );
}

/** Encargo 5: los doce folios seguidos, del 101 al 112, sin teclear diez. */
export function losFoliosSiguenLaCuenta(libro: Libro): boolean {
  return Array.from({ length: RENGLONES }, (_, i) => i).every(
    (i) => valeEnPagos(libro, `D${FILA_PRIMERA + i}`) === PRIMER_FOLIO + i,
  );
}

/** Encargo 6: a los doce les toca la misma cuota, y es un número en las doce. */
export function aTodosLesTocaLaCuota(libro: Libro): boolean {
  return (
    losFoliosSiguenLaCuenta(libro) &&
    Array.from({ length: RENGLONES }, (_, i) => i).every(
      (i) => valeEnPagos(libro, `B${FILA_PRIMERA + i}`) === CUOTA,
    )
  );
}

/**
 * Encargo 7: el encabezado del folio se puso en negrita **sin cambiar de texto**.
 *
 * Las dos mitades otra vez, y aquí son la lección entera: pegar el formato trae
 * la pinta y **no toca lo escrito**. Un alumno que pegue del todo dejaría en D3
 * la palabra «Ya entregó» en negrita — la hoja se vería casi bien y diría una
 * mentira.
 */
export function elEncabezadoDelFolioSeVisteIgual(libro: Libro): boolean {
  const celda = libro.hojas.find((h) => h.id === HOJA)?.celdas.D3;
  return celda?.crudo === 'Folio' && celda.formato?.negrita === true;
}

/**
 * Encargo 8: el corte del viernes es **un número**, no la fórmula.
 *
 * No se compara contra una cifra escrita a mano aquí: se compara contra lo que
 * enseña `C17` en ese momento. Si el alumno hubiera apuntado otra cantidad en un
 * encargo anterior, el corte correcto sería otro, y un `=== 2880` escrito hoy
 * suspendería a quien hizo bien lo único que este encargo pide.
 */
export function elCorteQuedoCongelado(libro: Libro): boolean {
  const motor = crearMotor(libro, RELOJ);
  return (
    !guardaUnaRegla(libro, HOJA, 'C19') &&
    !estaVacia(libro, HOJA, 'C19') &&
    guardaUnaRegla(libro, HOJA, 'C17') &&
    mismoValor(motor, HOJA, 'C17', 'C19')
  );
}

/** Encargo 9: la hoja dejó de llamarse «Hoja3». */
export function laHojaYaTieneNombre(libro: Libro): boolean {
  const nombre = libro.hojas.find((h) => h.id === HOJA)?.nombre ?? '';
  return nombre.trim().toLowerCase().startsWith('pago');
}

/** Encargo 10: quedó en el segundo lugar, pegada a la de los gastos. */
export function laHojaQuedoEnSegundoLugar(libro: Libro): boolean {
  return laHojaYaTieneNombre(libro) && libro.hojas[1]?.id === HOJA;
}

/** Encargo 11: la lengüeta tiene color, el que sea. */
export function laLenguetaEstaPintada(libro: Libro): boolean {
  return Boolean(libro.hojas.find((h) => h.id === HOJA)?.color);
}

/**
 * Encargo 12: la lista quedó en orden **y cada quien con lo suyo**.
 *
 * Tres preguntas y no una: que no haya renglones vacíos, que los nombres suban
 * de la A a la Z, y —la que decide— que cada alumno siga teniendo **su** cuota,
 * **su** apunte y **su** folio. Ordenar sólo la columna de los nombres deja lo
 * primero y lo segundo perfectos y lo tercero destrozado, y es el desastre
 * clásico del bloque 19: los nombres cambian de sitio y las cantidades se
 * quedan quietas, así que cada quien acaba con el pago de otro.
 */
export function laListaQuedoEnOrden(libro: Libro): boolean {
  const filas = Array.from({ length: RENGLONES }, (_, i) => ({
    nombre: enPagos(libro, `A${FILA_PRIMERA + i}`),
    toca: enPagos(libro, `B${FILA_PRIMERA + i}`),
    entrego: enPagos(libro, `C${FILA_PRIMERA + i}`),
    folio: enPagos(libro, `D${FILA_PRIMERA + i}`),
  }));
  if (filas.some((f) => f.nombre.trim() === '')) return false;
  for (let i = 1; i < filas.length; i += 1) {
    if (filas[i - 1].nombre.toLowerCase() > filas[i].nombre.toLowerCase()) return false;
  }
  return ALUMNOS.every((a, i) =>
    filas.some(
      (f) =>
        f.nombre === a.nombre &&
        f.entrego === a.entrego &&
        f.toca === String(CUOTA) &&
        f.folio === String(PRIMER_FOLIO + i),
    ),
  );
}

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_CAPTURA_Y_ORDENA: GuionHojas = {
  archivo: 'Gastos de la salida del salón.xlsx',
  libro: libroDeLosPagos,

  portada: {
    situacion: 'Excel · Grado básico · La segunda de la sala',
    tema: 'Capturar, autorrellenar y ordenar',
    objetivo:
      'Vas a llenar una lista de verdad sin teclear de más: arrastrando, copiando y moviendo lo que ya está escrito, y dejándola ordenada para poder buscar a cualquiera.',
    vasAHacer: [
      'Capturar un renglón nuevo y arreglar lo que estaba mal, sin miedo a equivocarte',
      'Arrastrar el cuadrito de la esquina y llenar doce celdas de un tirón',
      'Copiar, mover y pegar sólo el formato o sólo el resultado',
      'Ponerle nombre, sitio y color a una hoja, y ordenar la lista de la A a la Z',
    ],
    requisitos:
      'La clase pasada: saber decir dónde está un dato —columna y fila— y marcar un rango. Es el mismo archivo, una semana después.',
    ayuda:
      'El cuadrito verde de la esquina de lo que tengas marcado se arrastra y rellena. Copiar, cortar y pegar están en Inicio → Portapapeles (y funcionan con Ctrl+C, Ctrl+X y Ctrl+V). A una hoja se le cambia el nombre con doble clic en su lengüeta y se mueve arrastrándola. Y deshacer, arriba a la izquierda, no rompe nada.',
  },

  pasos: [
    {
      id: 'la-que-falta',
      titulo: 'Apunta a la que falta',
      instruccion:
        'Ximena Robles entregó sus 320 pesos ayer a la salida y no está en la lista. Ponte en A15, escribe su nombre, pulsa **Tab** para pasar a la celda de al lado, y sigue con Tab hasta la columna «Ya entregó» para escribir 320.',
      pista:
        'Para escribir no hace falta doble clic: con la celda seleccionada, teclea. **Tab** confirma y se mueve a la derecha; **Enter** confirma y baja. La columna «Ya entregó» es la C.',
      senal: { control: 'celda:A15' },
      logro: { tipo: 'documento', comprueba: faltabaUnaYYaEsta },
      aprendido:
        'Ésas son las dos teclas que se usan todo el día para capturar: **Tab avanza a la derecha y Enter baja**. Se captura por renglones —un alumno entero, luego el siguiente— y no por columnas, porque así se leen los papeles de los que estás copiando. Y mira abajo: **el «Ya se juntó» de la fila 17 subió solo** en cuanto escribiste los 320. Tú no lo tocaste; ya está por ver de dónde saca ese número.',
    },
    {
      id: 'ese-pago-no-era',
      titulo: 'Ese apunte no iba',
      instruccion:
        'La tesorera revisa y te dice que a Rebeca Villalobos la apuntó de más: ella todavía no ha entregado nada. Selecciona su celda de «Ya entregó» —la C9— y pulsa la tecla **Suprimir**.',
      pista:
        'Suprimir es la tecla de borrar de la derecha del teclado. Si prefieres el botón, es «Borrar contenido», en Inicio → Edición: hace exactamente lo mismo.',
      senal: { control: 'borrar-contenido' },
      logro: { tipo: 'documento', comprueba: elApunteDeRebecaSeBorro },
      aprendido:
        'Fíjate en lo que **no** pasó: el renglón de Rebeca sigue ahí, con su nombre y su cuota. Ésta es la diferencia que la clase pasada te anunció y que hoy hiciste con el dedo: **Suprimir vacía la celda; «Eliminar filas» se lleva el renglón entero**. Y el total de abajo bajó 320 solo, sin que nadie lo volviera a sumar.',
    },
    {
      id: 'si-era-deshacer',
      titulo: 'Sí era: deshaz',
      instruccion:
        'La maestra revisa su libreta: Rebeca sí entregó, el jueves. Recupéralo **sin volver a teclearlo**: pulsa Deshacer, arriba a la izquierda —o Ctrl+Z—.',
      pista: 'Es la flecha que va hacia atrás, al lado del disquete de guardar.',
      senal: { control: 'deshacer' },
      logro: { tipo: 'documento', comprueba: elApunteDeRebecaVolvio },
      aprendido:
        'Volvió como estaba. Deshacer **da un paso atrás cada vez que lo pulsas**, y se puede pulsar muchas veces seguidas: no borra tu trabajo, retrocede por él. Y al lado tiene a Rehacer, que vuelve hacia adelante. Ésta es la razón por la que en una hoja de cálculo **se puede probar sin miedo**: equivocarse cuesta un clic. El que trabaja con miedo a tocar algo tarda el doble y aprende la mitad.',
    },
    {
      id: 'los-folios-mal-puestos',
      titulo: 'Los folios están en la columna que no es',
      instruccion:
        'La tesorera empezó a numerar los recibos y los tecleó en la columna F, dos columnas más allá de donde van. Muévelos: marca **F4 y F5**, pulsa **Cortar**, ponte en **D4** y pulsa **Pegar**.',
      pista:
        'Cortar y Pegar están en Inicio → Portapapeles, los dos primeros. Al cortar verás lo marcado con una raya punteada: todavía no se ha movido nada — se mueve al pegar.',
      senal: { control: 'pegar' },
      logro: { tipo: 'documento', comprueba: losFoliosSeMudaron },
      aprendido:
        'Los folios llegaron a la D **y se fueron de la F**: eso es lo que separa cortar de copiar. Copiar deja el original donde estaba y hace un gemelo; **cortar no mueve nada por sí solo — el que mueve es Pegar**, y por eso entre uno y otro puedes cambiar de idea. Y fíjate en que pegaste en **una sola celda** y cayeron los dos números: lo pegado ocupa lo que ocupaba lo copiado. Cuando escribas fórmulas verás la otra mitad de esto, que casi nadie sabe: una fórmula **copiada** se corrige para su nuevo sitio, y una **cortada** no — se mudó de casa y sigue mirando lo mismo de antes.',
    },
    {
      id: 'sigue-la-cuenta',
      titulo: 'Que siga la cuenta sola',
      instruccion:
        'Faltan diez folios y no se teclean. Marca **D4 y D5** —los dos que acabas de mudar—, agarra el **cuadrito verde** de la esquina de abajo a la derecha de lo marcado, y arrástralo hasta la fila 15.',
      pista:
        'El cuadrito está en la esquina de abajo a la derecha de lo que tengas marcado. Se agarra con el ratón sin soltar y se baja: verás hasta dónde vas a llegar antes de soltarlo.',
      senal: { control: 'tirador' },
      logro: { tipo: 'documento', comprueba: losFoliosSiguenLaCuenta },
      aprendido:
        'Salieron el 103, el 104 y hasta el 112, y tú escribiste dos. Eso es el **autorrelleno**: la hoja mira lo que ya está escrito, calcula el paso —de 101 a 102 va de uno en uno— y **continúa**. Con 5 y 10 habría salido 15, 20, 25. Y funciona igual con palabras que la hoja conoce: escribe «lunes» y arrastra, o «enero» y arrastra, y verás. Ese cuadrito es la herramienta que más tiempo ahorra de todo Excel, y no está en ninguna cinta.',
    },
    {
      id: 'lo-mismo-para-todos',
      titulo: 'A todos les toca lo mismo',
      instruccion:
        'La cuota es 320 para los doce y sólo está escrita en B4. Ponte en **B4**, agarra su cuadrito verde y arrástralo hasta la fila 15.',
      pista: 'Igual que hace un momento, pero con una sola celda marcada.',
      senal: { control: 'tirador' },
      logro: { tipo: 'documento', comprueba: aTodosLesTocaLaCuota },
      aprendido:
        'Con **un solo dato la hoja no adivina: copia**. Y está bien que no adivine — con un 320 suelto no hay manera de saber si querías 321, 322, 323 o 320 doce veces —. Ahí está la regla del cuadrito entera: **con dos o más datos continúa, con uno solo copia**. Si algún día quieres copiar aunque haya dos datos y no quieres que cuente, arrástralo con la tecla **Ctrl** apretada.',
    },
    {
      id: 'la-pinta-sin-el-dato',
      titulo: 'La pinta sin el dato',
      instruccion:
        'El encabezado «Folio» quedó desigual: los otros tres están en negrita y él no. No lo vuelvas a escribir. Ponte en **C3**, pulsa **Copiar**, ponte en **D3** y pulsa **Pegar formato**.',
      pista:
        '«Pegar formato» está en Inicio → Portapapeles, con la brocha de colores. Trae la pinta y no toca lo escrito.',
      senal: { control: 'pegar-formato' },
      logro: { tipo: 'documento', comprueba: elEncabezadoDelFolioSeVisteIgual },
      aprendido:
        '«Folio» sigue diciendo Folio y ahora se ve como sus vecinos. Eso es el **pegado especial**: una celda tiene varias cosas dentro —lo escrito, la pinta y, si la hay, la fórmula— y al pegar puedes elegir cuáles se van y cuáles se quedan. Pegar del todo habría dejado ahí la palabra «Ya entregó», y la hoja se habría visto casi bien diciendo una mentira.',
    },
    {
      id: 'congela-el-corte',
      titulo: 'Congela el corte del viernes',
      instruccion:
        'El viernes la tesorera entrega cuentas y ese número ya no debe moverse aunque el lunes pague alguien más. Ponte en **C17** —el «Ya se juntó»— y mira arriba, en la barra de fórmulas, lo que guarda. Después pulsa **Copiar**, ponte en **C19** y pulsa **Pegar valores**.',
      pista:
        '«Pegar valores» está en Inicio → Portapapeles y tiene un 123 por icono. Trae el resultado y deja la regla atrás.',
      senal: { control: 'pegar-valores' },
      logro: { tipo: 'documento', comprueba: elCorteQuedoCongelado },
      aprendido:
        'Los dos números son el mismo y **no son la misma cosa**. Pulsa C17 y mira la barra de fórmulas: guarda `=SUMA(...)`, una **regla** que se vuelve a hacer sola cada vez que cambia un dato. Pulsa C19: guarda un **número** y nada más. Pruébalo si quieres — escribe 320 en la celda de alguno de los que faltan y verás cuál de los dos se entera. Eso que guarda C17 es de lo que trata la clase que sigue, y es lo que hace que esto sea una hoja de **cálculo**.',
    },
    {
      id: 'ponle-nombre',
      titulo: 'Una hoja llamada «Hoja3» no dice nada',
      instruccion:
        'Abajo, la lengüeta de esta hoja dice «Hoja3». Haz **doble clic** encima, escribe **Pagos** y pulsa Entrar.',
      pista: 'Las lengüetas están en la orilla de abajo. Doble clic sobre el nombre y se puede escribir encima.',
      senal: { control: 'hoja:h3' },
      logro: { tipo: 'documento', comprueba: laHojaYaTieneNombre },
      aprendido:
        'Un libro con «Hoja1, Hoja2, Hoja3» es un archivero sin etiquetas: para saber qué hay dentro hay que abrirlas todas. Y hay una razón más que se ve en la clase de fórmulas: una fórmula puede llamar a otra hoja **por su nombre** —`Pagos!C17`—, así que el nombre no es adorno, es la dirección de la hoja.',
    },
    {
      id: 'ponla-en-su-sitio',
      titulo: 'Y ponla junto a la de los gastos',
      instruccion:
        'Está la última y va en segundo lugar, pegada a «Salida». **Arrastra su lengüeta** con el ratón y suéltala encima de «Cotizaciones».',
      pista:
        'Se agarra la lengüeta de «Pagos» sin soltar el botón del ratón y se suelta encima de la lengüeta del sitio donde la quieres.',
      senal: { control: 'hoja:h3' },
      logro: { tipo: 'documento', comprueba: laHojaQuedoEnSegundoLugar },
      aprendido:
        'Cambió el orden de las lengüetas **y no cambió ni un dato**. Eso pasa porque en una hoja de cálculo las hojas se llaman por su nombre y nunca por su número: no existe «la tercera hoja», existe «Pagos». Por eso moverlas es gratis, y por eso conviene ponerlas en el orden en que se leen — primero lo que se mira más.',
    },
    {
      id: 'pintale-la-lengueta',
      titulo: 'Píntale la lengüeta',
      instruccion:
        'Para encontrarla de un vistazo, dale color. Pulsa **Color de etiqueta**, en Inicio → Celdas, y elige el color que quieras de la paleta que sale abajo.',
      pista:
        'El botón tiene una etiqueta por icono y está en el grupo Celdas, al lado de «Mover hoja». Al pulsarlo sale una tira de colores junto a las lengüetas.',
      senal: { control: 'color-hoja' },
      logro: { tipo: 'documento', comprueba: laLenguetaEstaPintada },
      aprendido:
        'En un libro de doce hojas —una por mes— el color es lo que te ahorra leerlas todas. Y ojo con lo que **no** hace: el color de una lengüeta, igual que el de una celda, es sólo para tus ojos. Ninguna cuenta cambia, ninguna fórmula lo mira, y ningún total sabe de qué color pintaste nada.',
    },
    {
      id: 'ordena-la-lista',
      titulo: 'Ordena la lista',
      instruccion:
        'Así como está, para encontrar a alguien hay que leer los doce renglones. Marca desde **A4 hasta D15** —la tabla entera, las cuatro columnas— y pulsa **Ordenar de A a Z**, en Inicio → Edición o en la pestaña Datos.',
      pista:
        'Se marca pulsando A4 y, sin soltar, arrastrando hasta D15 —o pulsando A4 y luego D15 con Shift—. Se ordena por la **primera columna** de lo que marcaste, que aquí es la de los nombres.',
      senal: { control: 'ordenar-az' },
      logro: { tipo: 'documento', comprueba: laListaQuedoEnOrden },
      aprendido:
        'Los nombres subieron de la A a la Z **y cada quien se llevó lo suyo**: su cuota, su apunte y su folio viajaron en el mismo renglón. Ahí está lo único que hay que recordar del ordenar, y es un desastre que pasa todos los días en oficinas de verdad: **si marcas sólo la columna de los nombres, los nombres se ordenan y las cantidades se quedan quietas**, y cada quien acaba con el pago de otro. Nadie se da cuenta hasta que alguien reclama. Se marca la tabla entera, siempre.',
    },
  ],

  cierre:
    'Llenaste una lista de doce sin teclear más que un nombre y dos números: lo demás salió de arrastrar el cuadrito, de mudar lo que estaba mal puesto y de copiar la pinta de una celda. Le pusiste nombre, sitio y color a la hoja, y la dejaste en orden y sin descuadrar. Eso es capturar bien. Lo que ese «Ya se juntó» guarda por dentro —la regla que se hace sola— empieza en la clase que sigue.',
};

export default GUION_CAPTURA_Y_ORDENA;
