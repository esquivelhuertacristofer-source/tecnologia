import { mismoNumero, vale } from '@/components/office/motor-hojas/consultas';
import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import { construirDinamica, dinamicaPintada, dinamicasDe } from '@/components/office/motor-hojas/dinamica';
import type { Celda, Dinamica, Libro, ResumenDeColumna } from '@/components/office/motor-hojas/modelo';

/**
 * `of-excel-tabla-dinamica` · «Tu primera tabla dinámica» (bloques 49 y 50,
 * grado Avanzado).
 *
 * ── EL CASO ──────────────────────────────────────────────────────────────────
 *
 * La cooperativa escolar apuntó **todas** sus ventas del semestre: trescientos
 * renglones con fecha, mes, categoría, producto, cantidad, precio e importe. La
 * maestra pregunta lo que preguntaría cualquiera —«¿en qué se vendió más?»— y
 * la respuesta no está en la hoja: está repartida en trescientas filas que
 * nadie puede sumar de cabeza. Ésa es la clase entera.
 *
 * ── LA PRIMERA VEZ QUE SE RESUME SIN ESCRIBIR UNA FÓRMULA ───────────────────
 *
 * Cuarenta y ocho bloques de Excel y todos terminaban en un `=`. Éste no: una
 * dinámica agrupa, suma, cuenta y promedia sin que el alumno teclee una sola
 * función. Y merece decirse con todas sus letras —el encargo 1 y el 13 lo
 * dicen— que con `SUMAR.SI` se puede sacar lo mismo, con una diferencia que no
 * es de comodidad: para escribir esas fórmulas hay que **saber de antemano qué
 * categorías existen**. La dinámica las descubre sola, y por eso sigue estando
 * bien el día que la cooperativa empiece a vender algo nuevo.
 *
 * ── TRES COSAS DEL MOTOR QUE AQUÍ SE ENSEÑAN, NO SE DISIMULAN ───────────────
 *
 * `dinamica.ts` las dejó escritas y esta clase las convierte en encargos:
 *
 *   · **La región de la dinámica es de sólo lectura** (encargo 12). No es un
 *     castigo: ahí no hay celdas que escribir, se pintan del cruce cada vez.
 *   · **Actualizar es explícito** (encargos 10 y 11). Media clase. El alumno
 *     cambia un dato del origen, ve que el resumen no se mueve, se pregunta por
 *     qué, y entonces pulsa el botón.
 *   · **Un hueco es vacío, no cero, y las etiquetas van en orden alfabético**
 *     (encargo 7). Los meses salen «abril, enero, febrero, junio, marzo, mayo» y
 *     eso **es correcto**: son texto, y Excel ordena texto por abecedario. No
 *     hay ninguna lista de meses escondida en ninguna parte — para que salieran
 *     en orden de calendario haría falta agrupar por fecha de verdad, que es la
 *     reserva anotada del motor.
 *
 * ── POR QUÉ NINGÚN PREDICADO DE LOS ENCARGOS 3 A 9 MIRA UN NÚMERO ───────────
 *
 * Es la trampa (a) del §38, y aquí muerde más que en ninguna otra clase de la
 * sala: **mover un campo y actualizar cambian TODOS los números de la
 * dinámica**, y cambiarlos es exactamente lo que cada encargo pide. Un
 * predicado que dijera «y el total general vale 19 749» quedaría imposible de
 * cumplir en cuanto un encargo posterior corrigiera un dato del origen —y en el
 * 10 se corrige uno a propósito—, o si el alumno se adelanta y toca la lista.
 * Así que los encargos de estructura comprueban **estructura** —qué campo, en
 * qué zona, con qué resumen—, que es lo que el alumno hizo, y los números se
 * comprueban donde son el encargo: en el 11, y comparándolos con lo que saldría
 * de construir la dinámica ahora mismo, no con una cifra escrita a mano.
 */

/* ── el libro: las ventas de la cooperativa ─────────────────────────────────*/

export const HOJA = 'h1';
export const TITULO = 'Cooperativa escolar · Ventas del semestre';

/** Los siete campos, por su índice DENTRO del origen (`A1:G301`). */
export const CAMPO_FECHA = 0;
export const CAMPO_MES = 1;
export const CAMPO_CATEGORIA = 2;
export const CAMPO_PRODUCTO = 3;
export const CAMPO_CANTIDAD = 4;
export const CAMPO_PRECIO = 5;
export const CAMPO_IMPORTE = 6;

export const ORIGEN = 'A1:G301';
export const ANCLA = 'I2';
/** Tal como lo fabrica `controlesDinamica.ts`: del sitio donde se pinta. */
export const ID_DINAMICA = `din-${HOJA}-${ANCLA}`;

/** La celda que el encargo 10 corrige: la cantidad de la primera venta. */
export const CELDA_CANTIDAD_1 = 'E2';
export const CANTIDAD_CORREGIDA = 40;

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio'];

/**
 * El catálogo de la cooperativa y cuántas ventas hubo de cada cosa cada mes.
 *
 * Los números están puestos para que la clase tenga algo que enseñar, y no al
 * revés: **la categoría que más dinero deja no es la que más veces se vende**
 * —Uniformes son 30 ventas y 10 900 pesos; Bebidas son 120 ventas y 2 870—, que
 * es el encargo que hay que clavar. Y los uniformes sólo se venden en enero y
 * febrero, que es de donde salen los huecos de verdad del cruce por mes: en
 * marzo no hay una venta de uniformes de cero pesos, no hay ninguna venta.
 */
const CATALOGO: { categoria: string; producto: string; precio: number; ventasPorMes: number[] }[] = [
  { categoria: 'Uniformes', producto: 'Playera', precio: 150, ventasPorMes: [12, 6, 0, 0, 0, 0] },
  { categoria: 'Uniformes', producto: 'Sudadera', precio: 250, ventasPorMes: [8, 4, 0, 0, 0, 0] },
  { categoria: 'Papelería', producto: 'Cuaderno', precio: 35, ventasPorMes: [10, 6, 5, 5, 5, 5] },
  { categoria: 'Papelería', producto: 'Juego de plumas', precio: 25, ventasPorMes: [8, 4, 3, 3, 3, 3] },
  { categoria: 'Bebidas', producto: 'Agua', precio: 10, ventasPorMes: [12, 10, 11, 10, 9, 8] },
  { categoria: 'Bebidas', producto: 'Jugo', precio: 15, ventasPorMes: [10, 10, 10, 10, 10, 10] },
  { categoria: 'Snacks', producto: 'Galletas', precio: 12, ventasPorMes: [8, 8, 8, 8, 8, 8] },
  { categoria: 'Snacks', producto: 'Fruta picada', precio: 18, ventasPorMes: [7, 7, 7, 7, 7, 7] },
];

interface Venta {
  fecha: string;
  mes: string;
  categoria: string;
  producto: string;
  cantidad: number;
  precio: number;
}

/**
 * Las trescientas ventas, **sin una sola llamada al azar**.
 *
 * Es la misma disciplina que el reloj de la clase: un libro que saliera distinto
 * cada partida haría que el maestro corrigiera contra números que el alumno no
 * tiene delante, y que una prueba pasara hoy y fallara mañana.
 */
function generarVentas(): Venta[] {
  const fuera: Venta[] = [];
  for (let m = 0; m < MESES.length; m += 1) {
    const delMes: Venta[] = [];
    for (const p of CATALOGO) {
      for (let k = 0; k < p.ventasPorMes[m]; k += 1) {
        delMes.push({
          fecha: '',
          mes: MESES[m],
          categoria: p.categoria,
          producto: p.producto,
          precio: p.precio,
          // 1, 2, 3, 1, 2, 3… Una lista real no vende siempre de uno en uno, y
          // así el importe no es una copia de la columna de precio.
          cantidad: 1 + (k % 3),
        });
      }
    }
    delMes.forEach((v, i) => {
      const dia = 1 + Math.floor((i * 27) / Math.max(1, delMes.length));
      v.fecha = `2026-${String(m + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      fuera.push(v);
    });
  }
  return fuera;
}

const VENTAS = generarVentas();

const importeDe = (v: Venta): number => v.cantidad * v.precio;
const sumaDe = (filtro: (v: Venta) => boolean): number =>
  VENTAS.filter(filtro).reduce((a, v) => a + importeDe(v), 0);

/*
 * Los números de la clase, **calculados de los mismos datos que el alumno va a
 * ver** y no escritos a mano. Si mañana el catálogo cambia, el guion no se queda
 * diciendo cifras de ayer: es el mismo motivo por el que la ruta de la sala se
 * deriva del temario en vez de copiarse.
 */
export const CUANTAS_VENTAS = VENTAS.length;
export const TOTAL_GENERAL = sumaDe(() => true);
export const SUMA_UNIFORMES = sumaDe((v) => v.categoria === 'Uniformes');
export const CUENTA_BEBIDAS = VENTAS.filter((v) => v.categoria === 'Bebidas').length;
export const CUENTA_UNIFORMES = VENTAS.filter((v) => v.categoria === 'Uniformes').length;
export const PROMEDIO_UNIFORMES = SUMA_UNIFORMES / CUENTA_UNIFORMES;
export const SUMA_UNIFORMES_ENERO = sumaDe((v) => v.categoria === 'Uniformes' && v.mes === 'enero');
export const SUMA_PLAYERA = sumaDe((v) => v.producto === 'Playera');
/** Lo que crece el importe de la primera venta al corregir su cantidad. */
export const DIFERENCIA_DEL_PEDIDO = (CANTIDAD_CORREGIDA - VENTAS[0].cantidad) * VENTAS[0].precio;
export const TOTAL_CORREGIDO = TOTAL_GENERAL + DIFERENCIA_DEL_PEDIDO;

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * «Cooperativa escolar · Ventas del semestre.xlsx».
 *
 * Es una función y no una constante por lo de siempre: «Empezar de cero» tiene
 * que poder volver a fabricarlo entero, con sus trescientas filas y sin ninguna
 * dinámica encima.
 *
 * El importe es una **fórmula** (`=E2*F2`) y no un número escrito, y eso no es
 * adorno: el motor de la dinámica lee los valores CALCULADOS del origen
 * (`lectorDeMotor`, en `dinamica.ts`), así que esta hoja comprueba de paso que
 * una dinámica sabe resumir una columna que no existe hasta que alguien la
 * calcula. Y es lo que hace que corregir la cantidad en el encargo 10 mueva el
 * importe solo, que es la mitad de la sorpresa: la hoja sí se entera al
 * instante; la dinámica no.
 */
export function libroDeLaCooperativa(): Libro {
  const celdas: Record<string, Celda> = {
    A1: fuerte('Fecha'),
    B1: fuerte('Mes'),
    C1: fuerte('Categoría'),
    D1: fuerte('Producto'),
    E1: fuerte('Cantidad'),
    F1: fuerte('Precio'),
    G1: fuerte('Importe'),
  };
  VENTAS.forEach((v, i) => {
    const f = i + 2;
    celdas[`A${f}`] = suelta(v.fecha);
    celdas[`B${f}`] = suelta(v.mes);
    celdas[`C${f}`] = suelta(v.categoria);
    celdas[`D${f}`] = suelta(v.producto);
    celdas[`E${f}`] = suelta(String(v.cantidad));
    celdas[`F${f}`] = suelta(String(v.precio));
    celdas[`G${f}`] = suelta(`=E${f}*F${f}`);
  });
  return { activa: HOJA, nombres: {}, hojas: [{ id: HOJA, nombre: 'Ventas', celdas }] };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────────*/

const motorDe = (libro: Libro): Motor => crearMotor(libro, RELOJ_DE_LA_CLASE);

/**
 * La dinámica de la clase: **la que come de la lista entera**, y si no hay
 * ninguna así, la última que se creó.
 *
 * Ni por identificador ni por posición, y las dos alternativas eran callejones
 * sin salida. No existe ningún comando para borrar una dinámica ni para
 * cambiarle el origen —la forma del motor está fijada—, así que:
 *
 *   · buscándola por `id`, un alumno que escribiera «K2» en vez de «I2» se
 *     quedaría con una dinámica que ningún predicado reconoce;
 *   · cogiendo siempre la primera, uno que la creara sobre un rango corto se
 *     quedaría atrapado con ella para siempre.
 *
 * Con esta regla, y con el cuadro de «Crear otra» que el panel sigue enseñando,
 * el que se equivoque hace otra bien y la clase sigue. Lo único que cambia es
 * dónde tiene que mirar él en la hoja.
 */
function laDinamica(libro: Libro): Dinamica | null {
  const lista = dinamicasDe(libro, HOJA);
  return lista.find((d) => d.origen === ORIGEN) ?? lista[lista.length - 1] ?? null;
}

const mismosCampos = (a: number[], b: number[]): boolean => a.length === b.length && a.every((x, i) => x === b[i]);

/** ¿La dinámica cruza exactamente esto, y resume el importe así? */
function cruza(libro: Libro, filas: number[], columnas: number[], resumen: ResumenDeColumna): boolean {
  const d = laDinamica(libro);
  return (
    !!d &&
    mismosCampos(d.filas, filas) &&
    mismosCampos(d.columnas, columnas) &&
    d.valores.length === 1 &&
    d.valores[0].col === CAMPO_IMPORTE &&
    d.valores[0].resumen === resumen
  );
}

/* — encargo 2: la dinámica existe, y come de donde debe — */

export function laDinamicaEstaCreada(libro: Libro): boolean {
  const d = laDinamica(libro);
  return !!d && d.origen === ORIGEN && !d.filas.length && !d.columnas.length && !d.valores.length;
}

/* — encargo 3: categoría en filas, importe en valores — */

export const elPrimerResumen = (libro: Libro): boolean => cruza(libro, [CAMPO_CATEGORIA], [], 'suma');

/* — encargos 4 y 5: el mismo cruce, otro resumen — */

export const seCuentanLasVentas = (libro: Libro): boolean => cruza(libro, [CAMPO_CATEGORIA], [], 'cuenta');

export const sePromedia = (libro: Libro): boolean => cruza(libro, [CAMPO_CATEGORIA], [], 'promedio');

/* — encargo 7: el mes a columnas, y vuelta a la suma — */

export const hayCruceDeMeses = (libro: Libro): boolean => cruza(libro, [CAMPO_CATEGORIA], [CAMPO_MES], 'suma');

/* — encargo 8: el mismo campo no cabe en los dos ejes — */

export const elMesSeMovioAFilas = (libro: Libro): boolean =>
  cruza(libro, [CAMPO_CATEGORIA, CAMPO_MES], [], 'suma');

/* — encargo 9: producto anidado dentro de categoría — */

export const elProductoEstaAnidado = (libro: Libro): boolean =>
  cruza(libro, [CAMPO_CATEGORIA, CAMPO_PRODUCTO], [], 'suma');

/* — encargo 10: el dato del origen corregido — */

export const seCorrigioElPedido = (libro: Libro): boolean =>
  vale(motorDe(libro), HOJA, CELDA_CANTIDAD_1, CANTIDAD_CORREGIDA);

/* — encargo 11: y la dinámica, por fin, enterada — */

/**
 * «Lo que la hoja enseña» contra «lo que saldría de construirla ahora mismo».
 *
 * Es la misma cifra que decide en el verificador de fórmulas, y es lo que
 * convierte este encargo en imposible de aprobar por accidente: mientras no se
 * actualice, la caché sigue teniendo el resumen de antes de corregir el pedido y
 * los dos rectángulos no coinciden. No compara contra un número escrito aquí a
 * propósito —ver la cabecera—: así el encargo se cierra igual aunque el alumno
 * haya tocado además otra celda del origen por su cuenta.
 */
export function laDinamicaSeEntero(libro: Libro): boolean {
  const din = laDinamica(libro);
  if (!din || !seCorrigioElPedido(libro)) return false;
  const motor = motorDe(libro);
  const pinta = dinamicaPintada(motor, din);
  const ahora = construirDinamica(motor, din);
  if (!pinta || !ahora || pinta.ancho !== ahora.ancho || pinta.alto !== ahora.alto) return false;
  return pinta.celdas.every((v, i) => {
    const w = ahora.celdas[i];
    return typeof v === 'number' && typeof w === 'number' ? mismoNumero(v, w) : v === w;
  });
}

/* ── el guion ──────────────────────────────────────────────────────────────*/

export const GUION_TABLA_DINAMICA: GuionHojas = {
  archivo: `${TITULO}.xlsx`,
  libro: libroDeLaCooperativa,

  portada: {
    situacion: 'Excel · Grado avanzado · La que resume sin fórmulas',
    tema: 'Tablas dinámicas: cruzar, resumir, anidar y actualizar',
    objetivo:
      'Vas a coger trescientas ventas que no se pueden leer y a dejarlas en cinco renglones que contestan una pregunta — sin escribir una sola fórmula, por primera vez en todo el temario. Y vas a descubrir lo que casi nadie sabe de una tabla dinámica: que no se entera sola de que cambiaste un dato.',
    vasAHacer: [
      'Crear una tabla dinámica sobre una lista de trescientos renglones y ver la respuesta en cinco',
      'Cambiar la pregunta moviendo un campo de sitio: la misma tabla, cruzada por mes, contesta otra cosa',
      'Resumir el mismo cruce con suma, con cuenta y con promedio, y ver que las tres conclusiones se contradicen sin que ninguna mienta',
      'Anidar producto dentro de categoría, con sus subtotales, y aprender por qué hay que pulsar Actualizar',
    ],
    requisitos:
      'Saber que una celda guarda una regla y no un número, y haber visto SUMAR.SI. Hoy no vas a escribir ninguna fórmula: todo se hace desde el panel «Tabla dinámica», a la derecha.',
    ayuda:
      'El panel de la derecha tiene, de arriba abajo: el botón grande de Actualizar, la lista de los siete campos de tu hoja con sus botones —Filas, Columnas, Valores, Quitar—, cómo se resume cada campo de Valores, y el cuadro de Agrupar para meter un campo dentro de otro.',
  },

  pasos: [
    {
      id: 'hasta-el-ultimo-renglon',
      titulo: 'Trescientas ventas, y una pregunta que no se contesta mirando',
      instruccion:
        'La cooperativa apuntó todas sus ventas del semestre: fecha, mes, categoría, producto, cantidad, precio e importe. La maestra pregunta lo que preguntaría cualquiera: **¿en qué categoría se vendió más?**. Antes de contestar, mira el tamaño del problema: en el **cuadro de nombres** —la casilla que dice A1, a la izquierda de la barra de fórmulas— escribe **A301** y pulsa Entrar.',
      pista: 'El cuadro de nombres te lleva a la celda que escribas de un salto, sin bajar rueda a rueda.',
      senal: { control: 'cuadro-de-nombres' },
      logro: { tipo: 'control', control: 'salto:A301' },
      aprendido:
        'Trescientas ventas —la 301 es la última, porque la fila 1 son los encabezados— y ni un total por ninguna parte. Nadie contesta «¿en qué se vendió más?» leyendo esto: habría que ir sumando cuatro grupos de cabeza y volver a empezar el día que llegue una venta más. Con **SUMAR.SI** se podría, una fórmula por categoría… pero para escribirlas hay que saber DE ANTEMANO qué categorías existen. Fíjate en esa frase: es la diferencia entera de hoy.',
    },
    {
      id: 'crea-la-dinamica',
      titulo: 'Crea la tabla dinámica',
      instruccion:
        'Ponte en cualquier celda de la lista —**A1** vale— y, en el panel «Tabla dinámica», escribe **I2** en «Dónde ponerla» y pulsa **Crear tabla dinámica**. No hace falta que marques las trescientas filas: como en Excel, estando dentro se toma la lista entera con sus encabezados.',
      pista:
        'Los campos salen de la fila 1: sin encabezados no habría nada que arrastrar. Y va a I2, a la derecha de los datos, porque una dinámica no se puede pintar encima de su propio origen.',
      senal: { control: 'crear-dinamica' },
      logro: { tipo: 'documento', comprueba: laDinamicaEstaCreada },
      aprendido:
        'Nace **vacía**, como en Excel: dos celdas en I2 e I3 —«Etiquetas de fila» y «Total general»— esperando a que le digas qué cruzar. Lo que sí llegó lleno es el panel de la derecha: ahí están tus siete campos, que son exactamente los siete encabezados de la fila 1. Una dinámica no guarda ningún número: guarda de dónde come y qué le pediste, y pinta el resto cada vez.',
    },
    {
      id: 'la-primera-pregunta',
      titulo: 'La respuesta, en cinco renglones',
      instruccion:
        'Contesta por fin a la maestra. En el panel, pulsa **Filas** en el campo **Categoría**, y después **Valores** en el campo **Importe**.',
      pista: 'Filas = de qué quiero una lista. Valores = qué número quiero de cada una. Y de entrada, suma.',
      senal: { control: 'campo-dinamica' },
      logro: { tipo: 'documento', comprueba: elPrimerResumen },
      aprendido:
        'Trescientas ventas en **cinco renglones**: Bebidas 2 870, Papelería 3 495, Snacks 2 484, Uniformes **10 900** y el total general 19 749. Ahí está la respuesta, y **no escribiste ni una fórmula** — es la primera vez en todo el temario. Y mira lo que hizo sola: descubrió que había cuatro categorías, sin que nadie se las dijera y sin que aparezcan escritas en ningún sitio más que en los trescientos renglones.',
    },
    {
      id: 'de-suma-a-cuenta',
      titulo: 'La misma tabla, otra pregunta: ¿cuántas veces?',
      instruccion:
        'Ahora pregúntale otra cosa a los mismos datos. En «Resumir con», cambia el de **Importe** de Suma a **Cuenta**.',
      pista: 'Cuenta no suma pesos: cuenta renglones. Cuántas VECES se vendió algo de esa categoría.',
      senal: { control: 'campo-dinamica' },
      logro: { tipo: 'documento', comprueba: seCuentanLasVentas },
      aprendido:
        'Se dio la vuelta la tabla: Bebidas **120** ventas y Uniformes **30**. O sea que la categoría que más veces se vende es la que menos dinero deja, y la que más dinero deja es la que menos veces se vende. Los dos números son verdad, y los dos salen exactamente de las mismas trescientas filas.',
    },
    {
      id: 'y-ahora-el-promedio',
      titulo: 'Y una tercera: ¿cuánto deja una venta?',
      instruccion: 'Con los mismos datos otra vez, cambia el resumen a **Promedio**.',
      pista: 'El promedio es la suma dividida entre la cuenta: cuánto deja una venta típica de esa categoría.',
      senal: { control: 'campo-dinamica' },
      logro: { tipo: 'documento', comprueba: sePromedia },
      aprendido:
        'Una venta de Uniformes deja **363.33** pesos y una de Bebidas **23.92** — con todos sus decimales, porque una dinámica no redondea: enseña la división entera. Tres resúmenes del mismo cruce, tres historias distintas, y ni una fórmula.',
    },
    {
      id: 'cual-es-la-verdadera',
      titulo: 'Tres historias, ¿cuál es la verdadera?',
      instruccion:
        'Suma dice Uniformes. Cuenta dice Bebidas. Promedio vuelve a decir Uniformes. Si tuvieras que poner UNA frase en el periódico mural, ¿cuál de los tres números es el bueno?',
      pista: 'Piensa qué pregunta contesta cada uno antes de elegir cuál gana.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'La suma, porque en una cooperativa lo único que importa de verdad es el dinero',
          'Ninguno es «el bueno»: cada resumen contesta una pregunta distinta, y hay que decir cuál preguntaste antes de dar el número',
          'El promedio, porque reparte entre todas las ventas y por eso es el más justo',
        ],
        correcta: 1,
      },
      aprendido:
        'Eso es. «En Uniformes se vendió más» es una frase incompleta: ¿más dinero o más veces? Cambiar el resumen es cambiar la pregunta, y quien enseña un número sin decir cómo lo resumió no está informando: está eligiendo la historia que le conviene. Un botón del panel, tres conclusiones distintas y todas ciertas.',
    },
    {
      id: 'el-mes-a-columnas',
      titulo: 'Cruzar: categorías por un lado, meses por el otro',
      instruccion:
        'Vuelve a poner **Suma** en el resumen de Importe, y después pulsa **Columnas** en el campo **Mes**.',
      pista:
        'Un campo en filas hace una lista. Dos campos, uno en filas y otro en columnas, hacen un CRUCE: cada celda contesta dos preguntas a la vez.',
      senal: { control: 'campo-dinamica' },
      logro: { tipo: 'documento', comprueba: hayCruceDeMeses },
      aprendido:
        'Cada celda contesta ahora dos cosas a la vez: cuánto dejó ESA categoría en ESE mes. Y hay dos rarezas que **no son errores** y conviene mirar de frente. **(1)** Los meses salen en orden alfabético —abril, enero, febrero, junio, marzo, mayo—, no en orden de calendario: son texto, y el texto se ordena por abecedario. Para que salieran por calendario habría que agrupar por FECHA de verdad, no por una palabra que se llama como el mes. **(2)** Donde Uniformes cruza con marzo no hay un 0: no hay **nada**. Un cero diría «se vendieron 0 pesos de uniformes en marzo» y el vacío dice «en marzo no hubo ni una venta de uniformes» — y son cosas distintas.',
    },
    {
      id: 'el-mismo-campo-en-los-dos-ejes',
      titulo: 'Prueba a ponerlo en los dos sitios',
      instruccion: 'Una prueba que todo el mundo hace: en el campo **Mes**, que ahora está en columnas, pulsa **Filas**.',
      pista: 'Míralo antes de pulsar: ¿qué crees que va a pasar, que se duplique o que se mueva?',
      senal: { control: 'campo-dinamica' },
      logro: { tipo: 'documento', comprueba: elMesSeMovioAFilas },
      aprendido:
        '**Se movió, no se duplicó.** Un campo no puede estar en filas y en columnas a la vez: cruzaría consigo mismo y la única celda con datos de cada renglón sería la de su propio mes. Y fíjate en lo que quedó: el cruce se convirtió en una lista larga —dentro de cada categoría, sus meses—, con el subtotal de la categoría encima. Los mismos datos, otra pregunta, y esta vez cabe leerla de arriba abajo.',
    },
    {
      id: 'producto-dentro-de-categoria',
      titulo: 'Anidar: cada categoría, abierta en sus productos',
      instruccion:
        'Saca el **Mes** de la dinámica con su botón **Quitar**. Después, en «Agrupar», elige **Producto** dentro de **Categoría** y pulsa **Agrupar**.',
      pista:
        'El orden de los campos de un eje ES el anidamiento: el segundo se abre dentro del primero. Anidarlos al revés sería la misma tabla contestando otra cosa.',
      senal: { control: 'campo-dinamica,agrupar-dinamica' },
      logro: { tipo: 'documento', comprueba: elProductoEstaAnidado },
      aprendido:
        'Cada categoría se abre en sus productos, **sangrados un nivel**, y encima de cada grupo su **subtotal**: Uniformes 10 900 se parte en Playera 5 400 y Sudadera 5 500. Mira cómo se ven los subtotales y el total general, distintos de los datos: no son una venta, son la cuenta de un grupo. Y el orden de las etiquetas sigue siendo el alfabético, aquí y en todas partes.',
    },
    {
      id: 'el-dato-que-cambia',
      titulo: 'Llega una corrección',
      instruccion:
        'La coordinadora avisa: la primera venta de enero está mal capturada. No fue **1** playera, fue un pedido de **40** para el equipo de fútbol. En **E2** escribe **40**. Y después vuelve a mirar la dinámica, a la derecha.',
      pista: 'E2 es la cantidad de la primera venta. G2, su importe, es una fórmula: ése se corrige solo.',
      senal: { control: 'celda:E2' },
      logro: { tipo: 'documento', comprueba: seCorrigioElPedido },
      aprendido:
        '**G2 pasó de 150 a 6 000** en el mismo instante en que pulsaste Entrar, porque es una fórmula y las fórmulas no esperan a nadie. Ahora mira la dinámica: Uniformes sigue diciendo **10 900** y el total general sigue diciendo **19 749**, como si no hubiera pasado nada. No te equivocaste: es lo que hace Excel. ¿Se te ocurre por qué?',
    },
    {
      id: 'actualizar',
      titulo: 'La dinámica no se entera sola',
      instruccion:
        'Porque una tabla dinámica **no mira la hoja**: mira una copia de los datos que se llevó la última vez que se actualizó. Pulsa el botón grande de **Actualizar**, arriba del panel.',
      pista: 'Es el único botón del panel que no cambia la pregunta: cambia los datos con los que se contesta.',
      senal: { control: 'actualizar-dinamica' },
      logro: { tipo: 'documento', comprueba: laDinamicaSeEntero },
      aprendido:
        'Ahora sí: Playera **11 250**, Uniformes **16 750** y el total general **25 599**. Y esto es lo que hay que entenderle a Excel: el número viejo **no estaba mal**, estaba bien cuando se calculó. Por eso no lo borra solo — rehacer el resumen de una lista de mil filas cuesta, y quien decide cuándo se paga eres tú. Los que sí se recalculan solos son las fórmulas de la hoja, como viste con G2: son dos cosas distintas y hoy has visto las dos, una al lado de la otra.',
    },
    {
      id: 'escribir-dentro-de-la-dinamica',
      titulo: 'Corrige un número a mano, a ver qué pasa',
      instruccion:
        'Otra que todo el mundo prueba: **escribe encima**. Ponte en **J3** —el subtotal de Bebidas— teclea **9999** y pulsa Entrar. Lee lo que contesta, y después dime por qué.',
      pista: 'Piensa dónde vive ese 2 870: ¿está guardado en J3, o se pinta ahí cada vez que la dinámica se dibuja?',
      senal: { control: 'celda:J3' },
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque la hoja está protegida, y habría que quitarle la protección en Revisar',
          'Porque ahí no hay ninguna celda que escribir: lo que se ve es el cruce, que se vuelve a pintar entero cada vez — el dato de verdad está en la lista de la izquierda',
          'Porque una tabla dinámica sólo deja escribir dentro justo después de actualizarla',
        ],
        correcta: 1,
      },
      aprendido:
        'Lo dijo con todas sus letras: «la región de la dinámica es de sólo lectura: cambia los datos de origen y pulsa Actualizar». No es un candado: es que ahí no hay nada donde guardar tu 9999. Esas celdas no existen en el libro —se pintan del cruce— y tu número habría durado hasta el siguiente repintado. Si un total de la dinámica está mal, el que está mal es un dato del origen.',
    },
    {
      id: 'que-compra-una-dinamica',
      titulo: 'Antes de cerrar: ¿qué te dio, que SUMAR.SI no?',
      instruccion:
        'Todo lo de hoy se podía sacar con fórmulas: un SUMAR.SI por categoría, otro por mes, otro por producto. ¿Qué te dio la tabla dinámica que esas fórmulas no te habrían dado?',
      pista: 'Piensa en el momento de escribirlas: ¿qué tendrías que saber ANTES de escribir la primera?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Nada importante: sale el mismo número y sólo te ahorra tecleo',
          'Que descubrió sola qué categorías, qué meses y qué productos había, y que cambiar la pregunta —suma, cuenta, promedio, cruzar por mes, anidar por producto— cuesta un clic en vez de reescribir todas las fórmulas',
          'Que la dinámica se actualiza sola cuando cambian los datos, y SUMAR.SI no',
        ],
        correcta: 1,
      },
      aprendido:
        'Y ojo con la tercera, que es exactamente al revés: **SUMAR.SI sí se recalcula solo**, y la dinámica es la que hay que actualizar a mano. Lo que compra una dinámica no es automatismo: es que la pregunta se puede cambiar. Una lista de fórmulas contesta la pregunta que se le escribió, y hay que saber las respuestas posibles antes de escribirla; una dinámica descubre sola qué hay dentro de tus datos y te deja preguntarle otra cosa con un clic.',
    },
  ],

  cierre:
    'Cogiste trescientas ventas que no se podían leer y las dejaste en cinco renglones que contestan una pregunta, sin escribir una sola fórmula: es la primera vez en todo el temario que resumes sin un `=`. Moviste el mismo campo de filas a columnas y comprobaste que eso no cambia el dibujo, cambia la pregunta. Resumiste el mismo cruce con suma, con cuenta y con promedio, y viste que las tres conclusiones se contradicen sin que ninguna mienta —la categoría que más dinero deja no es la que más veces se vende—. Anidaste producto dentro de categoría, con sus subtotales sangrados. Y aprendiste lo que casi nadie sabe de una tabla dinámica: que no se entera sola de que cambiaste un dato, que su región es de sólo lectura porque ahí no hay nada escrito, y que un hueco es vacío y no cero.',
};

export default GUION_TABLA_DINAMICA;
