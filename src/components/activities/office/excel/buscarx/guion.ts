import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import { aplicar } from '@/components/office/motor-hojas/comandos';
import {
  crudoDe,
  errorDe,
  guardaUnaRegla,
  usaFuncion,
  vale,
  valorDe,
} from '@/components/office/motor-hojas/consultas';
import { parsear, recorrer, referenciasDe, type Nodo } from '@/components/office/motor-hojas/formula/sintaxis';
import type { GuionHojas } from '@/components/office/motor-hojas/guion';
import { dir, letraDeColumna, type Celda, type Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `of-excel-buscarx` · «Traer un dato de otra tabla» (temario §45.2, bloques
 * 26 · 27 · 28; reparto del §45.3).
 *
 * La primera clase **exclusiva** de la sala de Excel y la primera del grado
 * Intermedio que se construye. Enseña tres cosas que en la calle van siempre
 * juntas y que en los libros van en tres capítulos distintos: traer un dato de
 * otra hoja sin copiarlo, partir un texto que llegó pegado, y volver a juntarlo
 * decente.
 *
 * ── LA IDEA, Y POR QUÉ NO SE EXPLICA ────────────────────────────────────────
 *
 * `BUSCARX` cabe en una frase —**qué busco, dónde lo busco, qué me traigo**— y
 * esa frase, dicha, no convence a nadie: un alumno que acaba de copiar seis
 * precios a mano en veinte segundos no entiende para qué quiere una fórmula de
 * tres huecos. Así que aquí tampoco se explica: **se provoca**.
 *
 * El primer encargo le manda copiar un precio a mano, y sale bien. El segundo
 * escribe la misma columna con `BUSCARX`, y sale **el mismo número** —o sea que
 * por fuera no ha pasado nada—. Y el tercero le sube el precio a la papelería:
 * el copiado a mano se queda viejo y el buscado se corrige solo, delante de él y
 * sin avisar. Es el mismo golpe que dio `n5-tus-primeras-formulas` con el precio
 * del camión, un piso más arriba: allí la pregunta era «¿número o regla?» y aquí
 * es «¿una tabla o dos tablas que se hablan?».
 *
 * Y se comprueba con `seEnteraDe()`, que es lo único que separa una fórmula de
 * un número disfrazado: se le cambia el precio a una copia del libro y se mira si
 * la celda se movió. Aquí la copia se toca **en otra hoja**, que es la novedad de
 * esta clase respecto de las tres del Básico.
 *
 * ── LOS TRES ERRORES QUE SE PROVOCAN A PROPÓSITO ────────────────────────────
 *
 * Ninguno es un adorno; los tres son los que de verdad se cometen:
 *
 *   1. **Dos rangos de distinto alto** (encargo 4). Contesta `#¡VALOR!` y hay
 *      que dejarlos parejos. Es la mitad de la firma de `BUSCARX` que nadie lee.
 *   2. **Buscar algo que no está** (encargo 5). Contesta `#N/A`, que no es un
 *      fallo: es una respuesta, y dice «eso no está en la lista».
 *   3. **Buscar algo que sí está y no casa por un espacio** (encargo 7). Contesta
 *      `#N/A` igual, y la culpa no es de la fórmula: es de la lista. Se caza con
 *      `LARGO`, que cuenta lo que el ojo no ve, y engancha con el bloque 44.
 *
 * Los tres van seguidos y en ese orden a propósito: el alumno se lleva la regla
 * de que **un error de Excel es una frase, no un castigo**, y que la mitad de las
 * veces la frase habla de los datos y no de la fórmula.
 *
 * ── LA MAYÚSCULA SÍ Y EL ESPACIO NO ─────────────────────────────────────────
 *
 * Hay un producto escrito `GAFETES DE PLÁSTICO` en la lista de compras y
 * `Gafetes de plástico` en la de precios, y **`BUSCARX` lo encuentra**, porque en
 * Excel el texto se compara sin distinguir mayúsculas (`modelo.ts`, `comparar`).
 * Está puesto ahí para que el encargo 11 pueda decir la frase entera: a la hoja
 * le dan igual las mayúsculas y **no** le da igual un espacio. Por eso `MAYUSC` y
 * `MINUSC` no arreglan un dato: arreglan cómo se lee. Sin ese contraste, las dos
 * funciones se quedarían en «poner bonito», que es como se enseñan casi siempre.
 *
 * ── POR QUÉ NO HAY UN TOTAL AL PIE DE LA TABLA ──────────────────────────────
 *
 * Porque el encargo 8 deja `"No está en el catálogo"` —un texto— en la celda del
 * precio de las pilas, y el importe de ese renglón pasa a `#¡VALOR!`. Un `SUMA`
 * debajo contagiaría ese error a la única celda que el alumno mira al final y la
 * clase acabaría con un letrero rojo que no es la lección de hoy: taparlo con
 * `SI.ERROR` es el bloque 48. El renglón roto se explica en su `aprendido` —y se
 * defiende: es mejor que un 0, que diría que las pilas son gratis—; un total roto
 * no se podía explicar sin abrir otra clase.
 *
 * ── POR QUÉ VARIAS SEÑALES APUNTAN A UNA LENGÜETA Y NO A LA CELDA ───────────
 *
 * Ésta es la primera clase de la sala que trabaja en **cuatro hojas**, y eso topa
 * con dos cosas del motor que conviene dejar escritas para el que venga:
 *
 *   · `senal: { control: 'celda:C4' }` se resuelve como `[data-celda="C4"]`, y
 *     eso **no sabe de hojas**: si el alumno está en otra lengüeta, el aro cae
 *     sobre la celda C4 de la hoja equivocada, que es peor que no caer.
 *   · La guarda del desvío (`esDesvio`, en `chrome/ganchos.ts`) trata las
 *     lengüetas como un control más. Con `celda:C4` esperado, **cambiar de hoja
 *     cuenta como equivocarse de botón** — y en esta clase cambiar de hoja es
 *     justamente lo primero que hay que hacer.
 *
 * Así que todo encargo que empieza cambiando de hoja señala la lengüeta
 * (`hoja:h5`) en vez de la celda. No es un apaño: es lo que el alumno tiene que
 * pulsar primero, y el rótulo del panel lo nombra por su nombre («La hoja
 * Precios», ver `VentanaHojas.tsx`). Enseñar a `partirSenal` a leer
 * `celda:h5!C4` es trabajo de la ventana, no de una clase.
 */

/* ── el libro, un mes después de la salida ──────────────────────────────────*/

export const RELOJ = { ahora: Date.UTC(2026, 9, 6, 9, 0, 0) };

/** La hoja de los gastos, la de las tres clases del Básico. Hoy no se toca. */
export const HOJA_SALIDA = 'h1';
/** Donde se trabaja el bloque 26: la lista de lo que hay que comprar. */
export const HOJA_COMPRAS = 'h4';
/** La lista de precios de la papelería. Es la tabla que se consulta. */
export const HOJA_PRECIOS = 'h5';
/** Donde se trabajan los bloques 27 y 28: los nombres del salón. */
export const HOJA_LISTA = 'h6';

/**
 * Los nombres de hoja **se escriben dentro de las fórmulas**, así que aquí se
 * eligen con la misma cabeza con la que se elige un nombre de variable: cortos,
 * sin acentos y sin espacios. `Precios!$A$4:$A$17` se teclea sin errores; un
 * `'Catálogo de la papelería'!$A$4:$A$17` habría convertido cada encargo en una
 * prueba de mecanografía y cada tilde olvidada en un `#¡REF!` que no enseña nada.
 * Los ids (`h4`, `h5`, `h6`) no reciclan los de «Pagos» y «Cotizaciones», que
 * salieron del archivo: dos hojas distintas con la misma clave serían dos
 * historias pisándose en el grafo (`modelo.ts`, decisión 4).
 */
export const NOMBRE_PRECIOS = 'Precios';
export const NOMBRE_COMPRAS = 'Compras';

/* ── la papelería ───────────────────────────────────────────────────────────*/

/**
 * La lista de precios tal y como la mandó la papelería, **con su falta incluida**.
 *
 * «Cinta adhesiva » lleva un espacio al final y no es un despiste al escribir
 * este archivo: es el encargo 7 entero. Un espacio de más no se ve en la celda,
 * no se ve en la barra de fórmulas y hace que `BUSCARX` conteste `#N/A` sobre un
 * producto que está ahí delante. Es el dato sucio más común del mundo y la razón
 * de que exista `LARGO`.
 */
export const CATALOGO: Array<{ producto: string; precio: number }> = [
  { producto: 'Cartulinas de colores', precio: 12.5 },
  { producto: 'Marcadores de agua (paquete)', precio: 68 },
  { producto: 'Cinta adhesiva ', precio: 24 },
  { producto: 'Hojas blancas (paquete de 100)', precio: 85 },
  { producto: 'Pegamento en barra', precio: 19.5 },
  { producto: 'Tijeras escolares', precio: 32 },
  { producto: 'Gafetes de plástico', precio: 6.5 },
  { producto: 'Cordón para gafete', precio: 4 },
  { producto: 'Gel antibacterial (litro)', precio: 78 },
  { producto: 'Bolsas para basura (rollo)', precio: 45 },
  { producto: 'Vasos desechables (paquete)', precio: 38 },
  { producto: 'Plumones permanentes', precio: 54 },
  { producto: 'Papel higiénico (paquete)', precio: 56 },
  { producto: 'Botiquín básico', precio: 240 },
];

export const FILA_PRIMER_PRECIO = 4;
export const FILA_ULTIMO_PRECIO = FILA_PRIMER_PRECIO + CATALOGO.length - 1; // 17

/** El rango de productos y el de precios, que es lo que va dentro de la fórmula. */
export const RANGO_DONDE_BUSCAR = `A${FILA_PRIMER_PRECIO}:A${FILA_ULTIMO_PRECIO}`;
export const RANGO_QUE_DEVUELVE = `B${FILA_PRIMER_PRECIO}:B${FILA_ULTIMO_PRECIO}`;

/** El renglón de la cinta adhesiva, el del espacio invisible. */
export const FILA_DEL_ESPACIO = FILA_PRIMER_PRECIO + 2; // 6
export const PRODUCTO_SUCIO = CATALOGO[2].producto; // 'Cinta adhesiva '
export const PRODUCTO_LIMPIO = PRODUCTO_SUCIO.trim(); // 'Cinta adhesiva'

/** Los dos precios que sube la papelería en el encargo 3. */
export const FILA_CARTULINAS = FILA_PRIMER_PRECIO; // 4
export const FILA_MARCADORES = FILA_PRIMER_PRECIO + 1; // 5
export const PRECIO_CARTULINAS_ANTES = CATALOGO[0].precio; // 12.5
export const PRECIO_CARTULINAS_AHORA = 14;
export const PRECIO_MARCADORES_AHORA = 75;

/** Las dos celdas donde se caza el espacio, en la hoja de precios. */
export const FILA_LARGO_COMPRAS = 20;
export const FILA_LARGO_PRECIOS = 21;

/* ── la lista de compras ────────────────────────────────────────────────────*/

/**
 * Lo que hay que comprar, con **ocho renglones desde el primer minuto**.
 *
 * Los dos últimos son los que no se van a encontrar, y están puestos desde el
 * principio y no añadidos a mitad de clase a propósito: así los dos `#N/A`
 * aparecen **de golpe** al rellenar la columna (encargo 5), que es como aparecen
 * en la vida real —nadie escribe una fórmula por renglón— y ahorra dos encargos
 * de teclear datos que no enseñan nada.
 *
 * `GAFETES DE PLÁSTICO` va en mayúsculas y el catálogo lo tiene en minúsculas.
 * Se encuentra igual, y ésa es la mitad de la lección del encargo 11.
 */
export const COMPRA: Array<{ producto: string; cuantos: number }> = [
  { producto: 'Cartulinas de colores', cuantos: 12 },
  { producto: 'Marcadores de agua (paquete)', cuantos: 4 },
  { producto: 'Hojas blancas (paquete de 100)', cuantos: 3 },
  { producto: 'GAFETES DE PLÁSTICO', cuantos: 40 },
  { producto: 'Cordón para gafete', cuantos: 40 },
  { producto: 'Gel antibacterial (litro)', cuantos: 2 },
  { producto: 'Cinta adhesiva', cuantos: 3 },
  { producto: 'Pilas AA', cuantos: 8 },
];

export const FILA_PRIMERA_COMPRA = 4;
export const FILA_ULTIMA_COMPRA = FILA_PRIMERA_COMPRA + COMPRA.length - 1; // 11

/** El renglón de la cinta adhesiva y el de las pilas, los dos que fallan. */
export const FILA_COMPRA_CINTA = FILA_PRIMERA_COMPRA + 6; // 10
export const FILA_COMPRA_PILAS = FILA_PRIMERA_COMPRA + 7; // 11

/* ── el salón ───────────────────────────────────────────────────────────────*/

/**
 * Los ocho del salón, **dos veces y en dos estados**.
 *
 * `comoLlego` es lo que mandó control escolar: la matrícula pegada delante, un
 * espacio, y los apellidos y el nombre en el orden del acta. Unos renglones
 * vienen en mayúsculas y otros no, porque los capturaron dos personas distintas
 * —que es exactamente por qué existe `MAYUSC`—. Los tres campos de abajo son lo
 * que la maestra tenía en su cuaderno, y son los del bloque 28.
 *
 * A dos les falta el apellido materno, y no es un descuido: es **la única
 * diferencia que se ve** entre `CONCAT` y `UNIRCADENAS`. Con los ocho completos,
 * las dos funciones darían lo mismo y el encargo 13 sería un cambio de nombre.
 */
export const SALON: Array<{
  comoLlego: string;
  correo: string;
  nombre: string;
  paterno: string;
  materno: string;
}> = [
  {
    comoLlego: 'A2024-0117 GARCÍA LÓPEZ, ANA',
    correo: 'ANA.GARCIA@ESCUELA.MX',
    nombre: 'Ana',
    paterno: 'García',
    materno: 'López',
  },
  {
    comoLlego: 'A2023-0104 Márquez, Bruno',
    correo: 'bruno.marquez@escuela.mx',
    nombre: 'Bruno',
    paterno: 'Márquez',
    materno: '',
  },
  {
    comoLlego: 'A2024-0121 ROSAS DELGADO, CAMILA',
    correo: 'Camila.Rosas@Escuela.Mx',
    nombre: 'Camila',
    paterno: 'Rosas',
    materno: 'Delgado',
  },
  {
    comoLlego: 'A2023-0110 Cruz Pineda, Emiliano',
    correo: 'EMILIANO.CRUZ@ESCUELA.MX',
    nombre: 'Emiliano',
    paterno: 'Cruz',
    materno: 'Pineda',
  },
  {
    comoLlego: 'A2024-0132 NIETO ROBLES, FERNANDA',
    correo: 'fernanda.nieto@escuela.mx',
    nombre: 'Fernanda',
    paterno: 'Nieto',
    materno: 'Robles',
  },
  {
    comoLlego: 'A2022-0098 Peña Villalobos, Santiago',
    correo: 'SANTIAGO.PENA@ESCUELA.MX',
    nombre: 'Santiago',
    paterno: 'Peña',
    materno: 'Villalobos',
  },
  {
    comoLlego: 'A2024-0140 GUZMÁN BAUTISTA, MATEO',
    correo: 'Mateo.Guzman@escuela.mx',
    nombre: 'Mateo',
    paterno: 'Guzmán',
    materno: 'Bautista',
  },
  {
    comoLlego: 'A2023-0115 Robles, Ximena',
    correo: 'XIMENA.ROBLES@ESCUELA.MX',
    nombre: 'Ximena',
    paterno: 'Robles',
    materno: '',
  },
];

export const FILA_PRIMER_ALUMNO = 4;
export const FILA_ULTIMO_ALUMNO = FILA_PRIMER_ALUMNO + SALON.length - 1; // 11

/** La matrícula mide siempre lo mismo: `A2024-0117`. Diez, y el espacio hace once. */
export const LARGO_DE_LA_MATRICULA = 10;
export const DONDE_EMPIEZA_EL_NOMBRE = LARGO_DE_LA_MATRICULA + 2; // 12

export const FILA_PRIMER_DIPLOMA = 15;
export const FILA_ULTIMO_DIPLOMA = FILA_PRIMER_DIPLOMA + SALON.length - 1; // 22

/* ── lo que cada trozo tiene que dar, calculado y no tecleado ───────────────*/

export const matriculaDe = (comoLlego: string): string => comoLlego.slice(0, LARGO_DE_LA_MATRICULA);
export const anoDe = (comoLlego: string): string => comoLlego.slice(1, 5);
export const apellidosYNombreDe = (comoLlego: string): string =>
  comoLlego.slice(DONDE_EMPIEZA_EL_NOMBRE - 1);

/** Lo que sale de `CONCAT`, con el hueco de sobra del que no tiene materno. */
export const pegadoConCONCAT = (a: { nombre: string; paterno: string; materno: string }): string =>
  `${a.nombre} ${a.paterno} ${a.materno}`;

/** Lo que sale de `UNIRCADENAS`, que salta lo vacío. */
export const unidoConUNIRCADENAS = (a: {
  nombre: string;
  paterno: string;
  materno: string;
}): string => [a.nombre, a.paterno, a.materno].filter((t) => t !== '').join(' ');

/** La frase del cuarto hueco, la que el encargo 8 dicta. */
export const FRASE_DEL_CUARTO_HUECO = 'No está en el catálogo';

/* ── el archivo ─────────────────────────────────────────────────────────────*/

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * «Gastos de la salida del salón.xlsx», el archivo de siempre con dos lengüetas
 * nuevas.
 *
 * «Salida» llega **entera y con sus fórmulas puestas**, tal y como la dejó
 * `n5-tus-primeras-formulas`: el camión a 5200, el botiquín a 0, el total
 * sumándose solo y los 320 pesos por cabeza saliendo de una división. No se toca
 * en ningún encargo y no sobra: es la prueba de que esto no es un decorado nuevo
 * con el mismo nombre, y de paso el alumno tiene delante, en la lengüeta de al
 * lado, una hoja donde las fórmulas ya se corrigen solas — que es exactamente lo
 * que hoy va a conseguir entre dos hojas distintas.
 *
 * Es una función y no una constante porque «Empezar de cero» tiene que poder
 * volver a fabricarlo entero. Aquí duele especialmente: una segunda partida sobre
 * los restos de la primera empezaría con el espacio de la cinta adhesiva ya
 * borrado, o sea con el encargo 7 ya hecho y sin que se note.
 */
export function libroDeLaSalida(): Libro {
  /* — «Salida», tal y como la dejó la clase del `=` — */
  const gastos: Array<{ concepto: string; cuantos: number; precio: number }> = [
    { concepto: 'Camión de la escuela a Teotihuacán', cuantos: 1, precio: 5200 },
    { concepto: 'Entradas a la zona arqueológica', cuantos: 38, precio: 95 },
    { concepto: 'Guía del recorrido', cuantos: 1, precio: 700 },
    { concepto: 'Torta y agua para cada quien', cuantos: 38, precio: 65 },
    { concepto: 'Botiquín y papelería', cuantos: 1, precio: 0 },
    { concepto: 'Estacionamiento del camión', cuantos: 1, precio: 180 },
  ];
  const salida: Record<string, Celda> = {
    A1: fuerte('Gastos de la salida del salón · 5.º B'),
    A3: fuerte('Concepto'),
    B3: fuerte('Cuántos'),
    C3: fuerte('Precio'),
    D3: fuerte('Lo pagado'),
    A10: fuerte('Todo lo que costó'),
    D10: suelta('=SUMA(D4:D9)'),
    A11: suelta('El gasto más caro'),
    D11: suelta('=MAX(D4:D9)'),
    A12: suelta('El gasto más barato'),
    D12: suelta('=MIN(D4:D9)'),
    A14: suelta('Alumnos que van'),
    B14: suelta('38'),
    A15: suelta('Maestros que acompañan'),
    B15: suelta('3'),
    A16: suelta('Lo que le toca poner a cada quien'),
    D16: suelta('=D10/B14'),
  };
  gastos.forEach((g, i) => {
    const f = 4 + i;
    salida[`A${f}`] = suelta(g.concepto);
    salida[`B${f}`] = suelta(String(g.cuantos));
    salida[`C${f}`] = suelta(String(g.precio));
    salida[`D${f}`] = suelta(`=B${f}*C${f}`);
  });

  /* — «Compras»: los productos, las cantidades y la columna del precio vacía — */
  const compras: Record<string, Celda> = {
    A1: fuerte('Material para la salida · 5.º B'),
    A2: suelta('Lo que pidió la maestra. Los precios los pone la papelería El Trébol.'),
    A3: fuerte('Producto'),
    B3: fuerte('Cuántos'),
    C3: fuerte('Precio'),
    D3: fuerte('Importe'),
  };
  COMPRA.forEach((c, i) => {
    const f = FILA_PRIMERA_COMPRA + i;
    compras[`A${f}`] = suelta(c.producto);
    compras[`B${f}`] = suelta(String(c.cuantos));
    // El importe llega escrito de la clase pasada: es la regla del bloque 13 y
    // aquí sirve de testigo — en cuanto llega el precio, el renglón se enciende
    // solo. Mientras la columna C esté vacía, los ocho importes valen 0.
    compras[`D${f}`] = suelta(`=B${f}*C${f}`);
  });

  /* — «Precios»: la lista de la papelería, con su espacio de más — */
  const precios: Record<string, Celda> = {
    A1: fuerte('Papelería El Trébol · lista de precios'),
    A2: suelta('Así llegó por correo. Ni un renglón se ha tocado.'),
    A3: fuerte('Producto'),
    B3: fuerte('Precio'),
    // Las dos celdas donde el encargo 7 caza el espacio invisible. Van aquí, en
    // la hoja del dato sucio, y no en «Compras», para que el encargo entero
    // ocurra en una sola lengüeta: cambiar de hoja a mitad de encargo dispara la
    // guarda del desvío (ver la cabecera).
    [`A${FILA_LARGO_COMPRAS - 1}`]: fuerte('¿Por qué no lo encuentra?'),
    [`A${FILA_LARGO_COMPRAS}`]: suelta('Letras del producto en la lista de compras'),
    [`A${FILA_LARGO_PRECIOS}`]: suelta('Letras del mismo producto aquí'),
  };
  CATALOGO.forEach((p, i) => {
    const f = FILA_PRIMER_PRECIO + i;
    precios[`A${f}`] = suelta(p.producto);
    precios[`B${f}`] = suelta(String(p.precio));
  });

  /* — «Lista»: los nombres como llegaron, y el cuaderno de la maestra — */
  const lista: Record<string, Celda> = {
    A1: fuerte('Lista del salón · 5.º B'),
    A2: suelta('Así la mandó control escolar, con la matrícula pegada delante.'),
    A3: fuerte('Como llegó'),
    B3: fuerte('Matrícula'),
    C3: fuerte('Año'),
    D3: fuerte('Apellidos y nombre'),
    E3: fuerte('Correo que dieron'),
    F3: fuerte('Como va en el acta'),
    G3: fuerte('Correo de la escuela'),
    [`A${FILA_PRIMER_DIPLOMA - 2}`]: fuerte('Los diplomas de fin de curso'),
    [`A${FILA_PRIMER_DIPLOMA - 1}`]: fuerte('Nombre'),
    [`B${FILA_PRIMER_DIPLOMA - 1}`]: fuerte('Paterno'),
    [`C${FILA_PRIMER_DIPLOMA - 1}`]: fuerte('Materno'),
    [`D${FILA_PRIMER_DIPLOMA - 1}`]: fuerte('Como va en el diploma'),
    [`E${FILA_PRIMER_DIPLOMA - 1}`]: fuerte('Letras'),
  };
  SALON.forEach((a, i) => {
    const f = FILA_PRIMER_ALUMNO + i;
    lista[`A${f}`] = suelta(a.comoLlego);
    lista[`E${f}`] = suelta(a.correo);
    const d = FILA_PRIMER_DIPLOMA + i;
    lista[`A${d}`] = suelta(a.nombre);
    lista[`B${d}`] = suelta(a.paterno);
    // El apellido que falta se deja SIN CELDA, no con la cadena vacía: en este
    // modelo una celda escrita y borrada dejaría de estar vacía sin que se note
    // (`modelo.ts`, `conCelda`), y `UNIRCADENAS` sabe saltarse las dos cosas pero
    // el alumno tiene que ver un hueco de verdad.
    if (a.materno !== '') lista[`C${d}`] = suelta(a.materno);
  });

  return {
    activa: HOJA_COMPRAS,
    nombres: {},
    hojas: [
      { id: HOJA_SALIDA, nombre: 'Salida', celdas: salida },
      { id: HOJA_COMPRAS, nombre: NOMBRE_COMPRAS, color: '#107c41', celdas: compras },
      { id: HOJA_PRECIOS, nombre: NOMBRE_PRECIOS, color: '#ed7d31', celdas: precios },
      { id: HOJA_LISTA, nombre: 'Lista', color: '#0f6cbd', celdas: lista },
    ],
  };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────────*/

/**
 * Los predicados son funciones puras **con nombre** que leen el libro con
 * `consultas.ts` y comprueban el vecindario, no la celda que acaba de cambiar.
 *
 * ── LA PREGUNTA PROPIA DE ESTA CLASE ────────────────────────────────────────
 *
 * Aquí no basta con mirar el número: `12.5` tecleado y `=BUSCARX(...)` que da
 * `12.5` enseñan lo mismo, igual que en la clase del `=`. Pero además hay una
 * segunda trampa que allí no existía: una fórmula puede estar bien escrita y
 * mirar **la mitad de la lista**. Un `=BUSCARX(A7, Precios!A4:A9, Precios!B4:B9)`
 * contesta un precio correcto para los seis primeros productos y `#N/A` para los
 * otros ocho, sin que nada avise.
 *
 * Por eso los predicados de esta clase preguntan tres cosas distintas y ninguna
 * sustituye a las otras:
 *
 *   1. **Qué mira** — que los dos rangos apunten a la hoja `Precios` y cubran la
 *      lista **entera**, comparados como texto y sin piedad. De paso, ése es el
 *      único sitio donde se cobra el `$`: sin él, rellenar hacia abajo desliza
 *      los dos rangos y a partir del segundo renglón dejan de cubrir la lista. No
 *      se pregunta «¿escribiste el dólar?» sino «¿siguen mirando la lista
 *      entera?», que es lo mismo dicho por lo que significa.
 *   2. **De quién habla** — que la única referencia suelta de la fórmula sea la
 *      celda del producto **de su propio renglón**. Es lo que caza la fórmula
 *      copiada sin corregirse, que deja ocho celdas preguntando por las
 *      cartulinas.
 *   3. **Qué contesta** — comparado contra lo que dice el catálogo **en ese
 *      momento**, no contra un número escrito aquí. Dos encargos le suben el
 *      precio a la papelería; un `=== 12.5` escrito hoy suspendería mañana a
 *      quien lo hizo todo bien.
 */

const motorDe = (libro: Libro): Motor => crearMotor(libro, RELOJ);

/** ¿Esta celda enseña esto? Sin tolerancias: se compara como lo enseña la hoja. */
const ensena = (libro: Libro, hoja: string, direccion: string, esperado: number | string): boolean =>
  vale(motorDe(libro), hoja, direccion, esperado);

/**
 * ¿Esta celda **se entera** de que aquélla cambió, aunque viva en otra hoja?
 *
 * Se le escribe otro precio a `otra` en una copia del libro y se mira si el valor
 * de `celda` deja de ser el que era. Es puro —`aplicar` devuelve un libro nuevo y
 * el que llega no se toca— y no lleva ni una tolerancia. El crudo de prueba es un
 * número que no está en ninguna parte del archivo, para que ningún resultado
 * coincida por casualidad con el que ya había.
 */
function seEnteraDe(
  libro: Libro,
  celda: { hoja: string; dir: string },
  otra: { hoja: string; dir: string },
  crudoNuevo: string,
): boolean {
  const antes = valorDe(motorDe(libro), celda.hoja, celda.dir);
  const otroLibro = aplicar(libro, {
    comando: 'escribir',
    args: { hoja: otra.hoja, celda: otra.dir, crudo: crudoNuevo },
  });
  const despues = valorDe(motorDe(otroLibro), celda.hoja, celda.dir);
  return typeof antes === 'number' && typeof despues === 'number' && antes !== despues;
}

/* — leer la fórmula por dentro — */

type NodoFn = Extract<Nodo, { t: 'fn' }>;

/** Las llamadas a esa función que hay dentro de la fórmula de esa celda. */
function llamadasA(libro: Libro, hoja: string, direccion: string, funcion: string): NodoFn[] {
  const a = parsear(crudoDe(libro, hoja, direccion));
  if (!a.ok) return [];
  const fuera: NodoFn[] = [];
  recorrer(a.arbol, (n) => {
    if (n.t === 'fn' && n.nombre === funcion) fuera.push(n);
  });
  return fuera;
}

interface RangoEscrito {
  /** El nombre de hoja tal cual se escribió, o `null` si no se escribió ninguno. */
  hoja: string | null;
  /** Normalizado y sin `$`: `A4:A17`. Se compara texto con texto. */
  texto: string;
}

/**
 * Los rangos escritos dentro de la fórmula, **con su hoja**.
 *
 * `rangosEn` (en `consultas.ts`) hace casi esto y **se deja la hoja por el
 * camino**: devuelve `A4:A17` tanto si la fórmula dice `Precios!A4:A17` como si
 * dice `A4:A17` a secas. Para las tres clases del Básico daba igual, porque
 * trabajaban en una sola hoja; aquí no, porque el error que se provoca en el
 * encargo 4 es justamente apuntar mal. No se toca `consultas.ts` para no cambiar
 * la firma que ya usan tres clases: esto es lo que esta clase necesita de más.
 */
function rangosEscritos(libro: Libro, hoja: string, direccion: string): RangoEscrito[] {
  const a = parsear(crudoDe(libro, hoja, direccion));
  if (!a.ok) return [];
  return referenciasDe(a.arbol).rangos.map((r) => {
    const c0 = Math.min(r.desde.col, r.hasta.col);
    const c1 = Math.max(r.desde.col, r.hasta.col);
    const f0 = Math.min(r.desde.fila, r.hasta.fila);
    const f1 = Math.max(r.desde.fila, r.hasta.fila);
    return {
      hoja: r.desde.hoja ?? r.hasta.hoja,
      texto: `${letraDeColumna(c0)}${f0 + 1}:${letraDeColumna(c1)}${f1 + 1}`,
    };
  });
}

/** Las referencias sueltas de la fórmula, como domicilios: `['A4']`. */
function refsEscritas(libro: Libro, hoja: string, direccion: string): string[] {
  const a = parsear(crudoDe(libro, hoja, direccion));
  if (!a.ok) return [];
  return referenciasDe(a.arbol).refs.map((r) => `${r.hoja ? `${r.hoja}!` : ''}${dir(r.col, r.fila)}`);
}

const miraLaHojaDePrecios = (r: RangoEscrito): boolean =>
  (r.hoja ?? '').toLowerCase() === NOMBRE_PRECIOS.toLowerCase();

/**
 * ¿Esta celda es una `BUSCARX` bien apuntada al renglón que le toca?
 *
 * Las tres preguntas de la cabecera, menos la del valor: los dos rangos cubren la
 * lista entera de la papelería, y lo único que se busca es el producto de su
 * propio renglón.
 */
function buscaBienSuProducto(libro: Libro, fila: number): boolean {
  const celda = `C${fila}`;
  if (!guardaUnaRegla(libro, HOJA_COMPRAS, celda)) return false;
  if (!usaFuncion(libro, HOJA_COMPRAS, celda, 'BUSCARX')) return false;
  const rangos = rangosEscritos(libro, HOJA_COMPRAS, celda);
  if (rangos.length !== 2) return false;
  if (!rangos.every(miraLaHojaDePrecios)) return false;
  if (rangos[0].texto !== RANGO_DONDE_BUSCAR || rangos[1].texto !== RANGO_QUE_DEVUELVE) return false;
  const refs = refsEscritas(libro, HOJA_COMPRAS, celda);
  return refs.length === 1 && refs[0] === `A${fila}`;
}

/**
 * Lo que la papelería cobra hoy por ese producto, **buscado como lo buscaría
 * Excel**: sin distinguir mayúsculas y sin recortar espacios.
 *
 * Devuelve `null` cuando no lo encuentra, que es el caso de las pilas siempre y
 * el de la cinta adhesiva hasta que se le quita el espacio. Se hace así y no
 * leyendo `CATALOGO` directamente porque dos encargos cambian el catálogo: lo que
 * el predicado tiene que comparar es lo que dice la hoja, no lo que decía este
 * archivo cuando se escribió.
 */
function precioDeHoy(libro: Libro, motor: Motor, producto: string): number | null {
  for (let i = 0; i < CATALOGO.length; i += 1) {
    const f = FILA_PRIMER_PRECIO + i;
    if (crudoDe(libro, HOJA_PRECIOS, `A${f}`).toLowerCase() !== producto.toLowerCase()) continue;
    const v = valorDe(motor, HOJA_PRECIOS, `B${f}`);
    return typeof v === 'number' ? v : null;
  }
  return null;
}

/** ¿Siguen los catorce productos de la papelería en su renglón? */
function laListaDePreciosSigueEntera(libro: Libro): boolean {
  return CATALOGO.every(
    (p, i) => crudoDe(libro, HOJA_PRECIOS, `A${FILA_PRIMER_PRECIO + i}`).trim() === p.producto.trim(),
  );
}

/** ¿Y los ocho de la lista de compras, cada uno con su cantidad? */
function laListaDeComprasSigueEntera(libro: Libro): boolean {
  const motor = motorDe(libro);
  return COMPRA.every((c, i) => {
    const f = FILA_PRIMERA_COMPRA + i;
    return (
      crudoDe(libro, HOJA_COMPRAS, `A${f}`) === c.producto &&
      vale(motor, HOJA_COMPRAS, `B${f}`, c.cuantos)
    );
  });
}

/** ¿La papelería ya subió los dos precios del encargo 3? */
function elCatalogoYaSubio(libro: Libro): boolean {
  const motor = motorDe(libro);
  return (
    vale(motor, HOJA_PRECIOS, `B${FILA_CARTULINAS}`, PRECIO_CARTULINAS_AHORA) &&
    vale(motor, HOJA_PRECIOS, `B${FILA_MARCADORES}`, PRECIO_MARCADORES_AHORA)
  );
}

/**
 * Las ocho de la columna del precio son reglas bien apuntadas, y **cada una
 * contesta lo que dice el catálogo**.
 *
 * Los renglones que el catálogo no conoce no se comprueban aquí a propósito: los
 * dos que fallan cambian de respuesta tres veces a lo largo de la clase —`#N/A`,
 * un precio de verdad, una frase— y cada encargo comprueba el suyo. Lo que este
 * predicado dice es lo único que tiene que seguir siendo verdad de aquí al final.
 */
function todasBuscanSuProducto(libro: Libro): boolean {
  const motor = motorDe(libro);
  return COMPRA.every((c, i) => {
    const f = FILA_PRIMERA_COMPRA + i;
    if (!buscaBienSuProducto(libro, f)) return false;
    const precio = precioDeHoy(libro, motor, c.producto);
    return precio === null || vale(motor, HOJA_COMPRAS, `C${f}`, precio);
  });
}

/* — los trece encargos — */

/**
 * Encargo 1: el precio copiado a mano.
 *
 * Se exige que **no** guarde una regla, y no es una manía de corrector: el
 * encargo entero consiste en hacerlo por las malas para poder compararlo dentro
 * de dos minutos. Quien se adelanta y escribe la fórmula aquí se salta la
 * demostración, y el aviso se lo da el propio encargo.
 */
export function elPrecioEstaCopiadoAMano(libro: Libro): boolean {
  return (
    laListaDeComprasSigueEntera(libro) &&
    laListaDePreciosSigueEntera(libro) &&
    !guardaUnaRegla(libro, HOJA_COMPRAS, `C${FILA_PRIMERA_COMPRA}`) &&
    ensena(libro, HOJA_COMPRAS, `C${FILA_PRIMERA_COMPRA}`, PRECIO_CARTULINAS_ANTES)
  );
}

/**
 * Encargo 2: la primera `BUSCARX`.
 *
 * Cuatro preguntas y la última es la que decide. Que use `BUSCARX`, que apunte
 * bien y que enseñe 68 lo cumple también quien teclee `=68`, que es el atajo que
 * se le ocurre a medio salón; sólo `seEnteraDe` —cambiarle el precio a la
 * papelería en una copia y ver si esta celda se mueve— distingue la fórmula que
 * se pidió de un número disfrazado.
 */
export function laPrimeraBuscarxEstaPuesta(libro: Libro): boolean {
  const fila = FILA_PRIMERA_COMPRA + 1; // el renglón de los marcadores
  const motor = motorDe(libro);
  const precio = precioDeHoy(libro, motor, COMPRA[1].producto);
  if (precio === null) return false;
  return (
    elPrecioEstaCopiadoAMano(libro) &&
    buscaBienSuProducto(libro, fila) &&
    vale(motor, HOJA_COMPRAS, `C${fila}`, precio) &&
    seEnteraDe(
      libro,
      { hoja: HOJA_COMPRAS, dir: `C${fila}` },
      { hoja: HOJA_PRECIOS, dir: `B${FILA_MARCADORES}` },
      '1234',
    )
  );
}

/**
 * Encargo 3: la papelería sube precios, y sólo una de las dos celdas se entera.
 *
 * Se sigue exigiendo que `C4` sea un número tecleado —viene de
 * `elPrecioEstaCopiadoAMano`— porque **eso es lo que hay que ver**: la celda de
 * arriba dice 12.50 cuando la papelería cobra 14. Quien la «arregle» aquí por su
 * cuenta se queda sin la demostración, y el encargo se lo pide expresamente.
 */
export function elCatalogoSubioDePrecio(libro: Libro): boolean {
  const fila = FILA_PRIMERA_COMPRA + 1;
  return (
    laPrimeraBuscarxEstaPuesta(libro) &&
    elCatalogoYaSubio(libro) &&
    ensena(libro, HOJA_COMPRAS, `C${fila}`, PRECIO_MARCADORES_AHORA)
  );
}

/**
 * Encargo 4: los dos rangos, del mismo alto.
 *
 * **No se encadena con el encargo anterior**, y es lo único de esta clase que
 * rompe la costumbre: aquel predicado exige que `C4` sea un número tecleado y
 * este encargo consiste justamente en sustituirlo por una regla. Lo que sí se
 * vuelve a exigir es el hecho que traía —que la papelería ya subió los precios—,
 * porque es lo que hace que la celda pase de 12.50 a 14 delante del alumno.
 */
export function losDosRangosMidenLoMismo(libro: Libro): boolean {
  const fila = FILA_PRIMERA_COMPRA;
  const motor = motorDe(libro);
  return (
    laListaDeComprasSigueEntera(libro) &&
    laListaDePreciosSigueEntera(libro) &&
    elCatalogoYaSubio(libro) &&
    buscaBienSuProducto(libro, fila) &&
    vale(motor, HOJA_COMPRAS, `C${fila}`, PRECIO_CARTULINAS_AHORA) &&
    guardaUnaRegla(libro, HOJA_COMPRAS, `C${fila + 1}`)
  );
}

/** Encargo 5: las ocho reglas puestas, y los dos `#N/A` de abajo asomando. */
export function laColumnaEnteraTraeSuPrecio(libro: Libro): boolean {
  const motor = motorDe(libro);
  return (
    losDosRangosMidenLoMismo(libro) &&
    todasBuscanSuProducto(libro) &&
    errorDe(motor, HOJA_COMPRAS, `C${FILA_COMPRA_CINTA}`) === '#N/A' &&
    errorDe(motor, HOJA_COMPRAS, `C${FILA_COMPRA_PILAS}`) === '#N/A'
  );
}

/**
 * Encargo 7: el espacio invisible, cazado con `LARGO` y borrado.
 *
 * No se encadena con el encargo 5 —aquél exige que la cinta adhesiva siga dando
 * `#N/A`, que es lo que este encargo arregla— sino con lo que tiene que seguir
 * siendo verdad: las ocho fórmulas bien apuntadas.
 *
 * Las dos celdas de `LARGO` se comprueban por lo que **miran**, no sólo por lo
 * que valen: una cuenta las letras del producto en la lista de compras y la otra
 * las del mismo producto en la papelería. Sin esa comprobación, dos `=LARGO(A4)`
 * cualesquiera que dieran el mismo número pasarían el encargo sin haber medido
 * nada.
 */
export function elEspacioDeMasEstaCazado(libro: Libro): boolean {
  const motor = motorDe(libro);
  const largoBueno = PRODUCTO_LIMPIO.length;
  const refsCompras = refsEscritas(libro, HOJA_PRECIOS, `B${FILA_LARGO_COMPRAS}`);
  const refsPrecios = refsEscritas(libro, HOJA_PRECIOS, `B${FILA_LARGO_PRECIOS}`);
  return (
    todasBuscanSuProducto(libro) &&
    usaFuncion(libro, HOJA_PRECIOS, `B${FILA_LARGO_COMPRAS}`, 'LARGO') &&
    refsCompras.length === 1 &&
    refsCompras[0].toLowerCase() === `${NOMBRE_COMPRAS}!A${FILA_COMPRA_CINTA}`.toLowerCase() &&
    usaFuncion(libro, HOJA_PRECIOS, `B${FILA_LARGO_PRECIOS}`, 'LARGO') &&
    refsPrecios.length === 1 &&
    refsPrecios[0] === `A${FILA_DEL_ESPACIO}` &&
    crudoDe(libro, HOJA_PRECIOS, `A${FILA_DEL_ESPACIO}`) === PRODUCTO_LIMPIO &&
    vale(motor, HOJA_PRECIOS, `B${FILA_LARGO_COMPRAS}`, largoBueno) &&
    vale(motor, HOJA_PRECIOS, `B${FILA_LARGO_PRECIOS}`, largoBueno) &&
    vale(motor, HOJA_COMPRAS, `C${FILA_COMPRA_CINTA}`, CATALOGO[2].precio)
  );
}

/**
 * Encargo 8: el cuarto hueco, el que habla.
 *
 * Se comprueba que la llamada tenga **cuatro argumentos** y que la celda enseñe
 * un texto de verdad, y **no se compara la frase letra por letra**. Lo que el
 * bloque enseña es que el hueco existe y que se le puede poner una frase; exigir
 * las veintidós letras exactas suspendería por una tilde a quien lo entendió
 * todo, y ninguna de las dos cosas que importan —que hay un cuarto argumento y
 * que la celda ya no grita `#N/A`— depende de cómo se escriba.
 */
export function laFraseEnVezDelError(libro: Libro): boolean {
  const llamadas = llamadasA(libro, HOJA_COMPRAS, `C${FILA_COMPRA_PILAS}`, 'BUSCARX');
  const v = valorDe(motorDe(libro), HOJA_COMPRAS, `C${FILA_COMPRA_PILAS}`);
  return (
    elEspacioDeMasEstaCazado(libro) &&
    llamadas.length === 1 &&
    llamadas[0].args.length === 4 &&
    typeof v === 'string' &&
    v.trim().length >= 4
  );
}

/**
 * Encargo 9: la matrícula y el año, contados desde la izquierda.
 *
 * Sólo el primer renglón: los otros siete llegan con el arrastre del encargo
 * siguiente, y pedirlos aquí obligaría a rellenar dos veces.
 */
export function laMatriculaYElAnoEstanPartidos(libro: Libro): boolean {
  const f = FILA_PRIMER_ALUMNO;
  const alumno = SALON[0];
  const motor = motorDe(libro);
  return (
    crudoDe(libro, HOJA_LISTA, `A${f}`) === alumno.comoLlego &&
    usaFuncion(libro, HOJA_LISTA, `B${f}`, 'IZQUIERDA') &&
    vale(motor, HOJA_LISTA, `B${f}`, matriculaDe(alumno.comoLlego)) &&
    usaFuncion(libro, HOJA_LISTA, `C${f}`, 'EXTRAE') &&
    vale(motor, HOJA_LISTA, `C${f}`, anoDe(alumno.comoLlego))
  );
}

/**
 * Encargo 10: el nombre sale solo, y los ocho renglones con él.
 *
 * `DERECHA` y `LARGO` se exigen las dos en la misma celda porque juntas son la
 * lección: por la izquierda se cuenta un número fijo, por la derecha no se puede
 * —cada nombre mide distinto— y ahí es donde `LARGO` deja de ser una curiosidad y
 * se vuelve una herramienta. Un `=DERECHA(A4,17)` daría el mismo resultado en el
 * primer renglón y basura en los otros siete; por eso se comprueban los ocho.
 */
export function elNombreSaleSolo(libro: Libro): boolean {
  const motor = motorDe(libro);
  if (!laMatriculaYElAnoEstanPartidos(libro)) return false;
  if (!usaFuncion(libro, HOJA_LISTA, `D${FILA_PRIMER_ALUMNO}`, 'DERECHA')) return false;
  if (!usaFuncion(libro, HOJA_LISTA, `D${FILA_PRIMER_ALUMNO}`, 'LARGO')) return false;
  return SALON.every((a, i) => {
    const f = FILA_PRIMER_ALUMNO + i;
    return (
      guardaUnaRegla(libro, HOJA_LISTA, `B${f}`) &&
      vale(motor, HOJA_LISTA, `B${f}`, matriculaDe(a.comoLlego)) &&
      guardaUnaRegla(libro, HOJA_LISTA, `C${f}`) &&
      vale(motor, HOJA_LISTA, `C${f}`, anoDe(a.comoLlego)) &&
      guardaUnaRegla(libro, HOJA_LISTA, `D${f}`) &&
      vale(motor, HOJA_LISTA, `D${f}`, apellidosYNombreDe(a.comoLlego))
    );
  });
}

/** Encargo 11: el acta en mayúsculas y el correo en minúsculas, los ocho. */
export function elActaYElCorreoQuedanParejos(libro: Libro): boolean {
  const motor = motorDe(libro);
  if (!elNombreSaleSolo(libro)) return false;
  if (!usaFuncion(libro, HOJA_LISTA, `F${FILA_PRIMER_ALUMNO}`, 'MAYUSC')) return false;
  if (!usaFuncion(libro, HOJA_LISTA, `G${FILA_PRIMER_ALUMNO}`, 'MINUSC')) return false;
  return SALON.every((a, i) => {
    const f = FILA_PRIMER_ALUMNO + i;
    return (
      guardaUnaRegla(libro, HOJA_LISTA, `F${f}`) &&
      vale(motor, HOJA_LISTA, `F${f}`, apellidosYNombreDe(a.comoLlego).toUpperCase()) &&
      guardaUnaRegla(libro, HOJA_LISTA, `G${f}`) &&
      vale(motor, HOJA_LISTA, `G${f}`, a.correo.toLowerCase())
    );
  });
}

/**
 * Encargo 12: los diplomas pegados con `CONCAT`, con su hueco de sobra y todo.
 *
 * Lo que se compara es la unión **tal cual sale**, espacio sobrante incluido: si
 * el predicado recortara el resultado, el defecto que el encargo 13 arregla no
 * existiría para el corrector y el alumno podría entregar los dos encargos con la
 * misma fórmula.
 */
export function losDiplomasEstanPegados(libro: Libro): boolean {
  const motor = motorDe(libro);
  if (!elActaYElCorreoQuedanParejos(libro)) return false;
  if (!usaFuncion(libro, HOJA_LISTA, `D${FILA_PRIMER_DIPLOMA}`, 'CONCAT')) return false;
  return SALON.every((a, i) => {
    const d = FILA_PRIMER_DIPLOMA + i;
    const pegado = pegadoConCONCAT(a);
    return (
      guardaUnaRegla(libro, HOJA_LISTA, `D${d}`) &&
      vale(motor, HOJA_LISTA, `D${d}`, pegado) &&
      usaFuncion(libro, HOJA_LISTA, `E${d}`, 'LARGO') &&
      vale(motor, HOJA_LISTA, `E${d}`, pegado.length)
    );
  });
}

/**
 * Encargo 13: `UNIRCADENAS`, que junta con separador y salta lo vacío.
 *
 * No se encadena con el 12 —lo que aquel encargo dejó puesto es justo lo que éste
 * sustituye— sino con el 11. Y se exige que `CONCAT` **ya no esté** en la celda:
 * sin esa línea, un `=CONCAT(...)` corregido a mano metiendo los espacios uno a
 * uno daría el mismo texto y pasaría por bueno, que es aprobar la copia del
 * resultado en vez de la idea.
 */
export function losDiplomasQuedanBien(libro: Libro): boolean {
  const motor = motorDe(libro);
  if (!elActaYElCorreoQuedanParejos(libro)) return false;
  return SALON.every((a, i) => {
    const d = FILA_PRIMER_DIPLOMA + i;
    const unido = unidoConUNIRCADENAS(a);
    return (
      usaFuncion(libro, HOJA_LISTA, `D${d}`, 'UNIRCADENAS') &&
      !usaFuncion(libro, HOJA_LISTA, `D${d}`, 'CONCAT') &&
      vale(motor, HOJA_LISTA, `D${d}`, unido) &&
      usaFuncion(libro, HOJA_LISTA, `E${d}`, 'LARGO') &&
      vale(motor, HOJA_LISTA, `E${d}`, unido.length)
    );
  });
}

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_BUSCARX: GuionHojas = {
  archivo: 'Gastos de la salida del salón.xlsx',
  libro: libroDeLaSalida,

  portada: {
    situacion: 'Excel · Grado intermedio · La clase de traer datos',
    tema: 'BUSCARX y las funciones de texto',
    objetivo:
      'Vas a hacer que dos tablas se hablen entre sí: una lista de precios en una hoja y tu lista de compras en otra, sin copiar ni un número a mano. Y vas a dejar presentable una lista de nombres que llegó pegada, partiéndola y volviéndola a juntar con fórmulas.',
    vasAHacer: [
      'Copiar un precio a mano, y ver cómo se queda viejo en cuanto la papelería sube el suyo',
      'Traer los ocho precios con BUSCARX y provocar sus dos errores a propósito',
      'Cazar un espacio invisible con LARGO, que es lo que hace que un dato bueno no se encuentre',
      'Partir «A2024-0117 GARCÍA LÓPEZ, ANA» en sus pedazos y volver a juntarlo bien',
    ],
    requisitos:
      'Las clases anteriores: escribir fórmulas con `=`, rellenar hacia abajo, y el `$` de las referencias absolutas —hoy se usa en cada fórmula y hoy se ve para qué servía—. Es el mismo archivo de la salida a Teotihuacán, con dos hojas nuevas.',
    ayuda:
      'Toda fórmula empieza por `=`. Para nombrar una celda de otra hoja se escribe el nombre de la hoja, un signo de admiración y la celda: `Precios!A4`. Para arreglar una fórmula ya escrita, doble clic en su celda —o F2—. Y deshacer, arriba a la izquierda, no rompe nada.',
  },

  pasos: [
    {
      id: 'copiado-a-mano',
      titulo: 'Cópialo tú',
      instruccion:
        'La papelería El Trébol mandó su lista de precios: está en la lengüeta **Precios**, aquí abajo. Ve a mirarla, busca **Cartulinas de colores**, y vuelve a **Compras** para escribir ese precio en **C4**.',
      pista:
        'Las lengüetas de hoja están abajo del todo. En «Precios», las cartulinas son el primer producto de la lista. El precio se teclea tal cual, con punto decimal: 12.5',
      // Sin `senal`, y a propósito: este encargo va y VUELVE —mira en Precios y
      // teclea en Compras—, y una `senal` sólo puede nombrar un control. Con
      // `hoja:h5` puesta, la guarda del desvío (`esDesvio`, `chrome/ganchos.ts`)
      // deja pulsar la lengüeta de ida y bloquea la de vuelta, porque sigue
      // esperando `hoja:h5` hasta que el encargo se cierra — un candado real que
      // se cazó jugando la clase entera (defecto de la puesta en producción del
      // 14-ago-2026, no del diseño del bloque 26).
      logro: { tipo: 'documento', comprueba: elPrecioEstaCopiadoAMano },
      aprendido:
        'Veinte segundos, y el importe del renglón se encendió solo: **150 pesos**, doce cartulinas por 12.50 — ésa es la regla `=B4*C4` que dejaste puesta la clase pasada. Hasta aquí todo bien, y con seis renglones lo harías seis veces sin quejarte. Pero la lista de la papelería tiene **catorce** productos, y la de verdad tiene **trescientos**; y la compra de la escuela no son seis renglones, son cuarenta. Ese es el primer problema, y todavía no es el peor.',
    },
    {
      id: 'la-primera-buscarx',
      titulo: 'Que lo busque ella',
      instruccion:
        'El segundo renglón no lo copies. Ponte en **C5** y escribe esto tal cual:\n\n**=BUSCARX(A5, Precios!$A$4:$A$17, Precios!$B$4:$B$17)**\n\nLos huecos son tres y van en este orden: **qué** busco, **dónde** lo busco, **qué me traigo**.',
      pista:
        '`A5` es la celda de al lado, la que dice «Marcadores de agua». `Precios!$A$4:$A$17` es la columna de productos de la otra hoja, entera. `Precios!$B$4:$B$17` es la de precios, del mismo alto. Los `$` son los de la clase de referencias: sirven para que esos dos rangos no se muevan cuando arrastres la fórmula.',
      senal: { control: 'celda:C5' },
      logro: { tipo: 'documento', comprueba: laPrimeraBuscarxEstaPuesta },
      aprendido:
        'Salió **68**, y a simple vista no ha pasado nada: un número, como el de arriba. Fíjate en cómo se lee la fórmula, porque es lo único que hay que memorizar de esta clase: **qué busco** (`A5`, los marcadores), **dónde lo busco** (la columna de productos de la papelería) y **qué me traigo** (la columna de precios, la de al lado). Tres huecos, en ese orden. Y ojo a los dos rangos: son **dos columnas distintas y del mismo alto**, catorce renglones cada una. La primera dice dónde mirar; la segunda, qué copiar del renglón que casó.',
    },
    {
      id: 'sube-el-catalogo',
      titulo: 'La papelería subió los precios',
      instruccion:
        'Llamaron de El Trébol: subió el papel. Ve a la hoja **Precios** y cambia dos: en **B4** escribe **14** (las cartulinas) y en **B5** escribe **75** (los marcadores). Vuelve a **Compras** y mira las dos primeras celdas de la columna Precio. **No toques C4**, aunque te den ganas.',
      pista:
        'B4 y B5 son las dos primeras celdas de la columna Precio de la hoja «Precios». Cambia el número y pulsa Entrar. Después vuelve a «Compras» con la lengüeta de abajo.',
      senal: { control: 'hoja:h5' },
      logro: { tipo: 'documento', comprueba: elCatalogoSubioDePrecio },
      aprendido:
        'Ahí está la clase entera, en dos renglones. **C5 se movió sola** —dice 75, y su importe pasó de 272 a 300—, y **C4 sigue diciendo 12.50** cuando la papelería cobra 14. Nadie te avisó, no salió ningún error, y esa celda está mintiendo: el 12.50 lo tecleaste tú, y **un número copiado a mano no sabe de dónde vino**. No sabe de qué producto era, no sabe de qué lista salió, y por eso no se puede enterar de nada. Con seis renglones lo cazas revisando; con cuarenta, no. Ahí está la diferencia de verdad entre copiar y buscar.',
    },
    {
      id: 'los-dos-rangos',
      titulo: 'Rómpela a propósito: dos rangos desiguales',
      instruccion:
        'Vamos a arreglar C4, pero rompiéndola antes. Ponte en **C4** y escribe esto, con la trampa incluida:\n\n**=BUSCARX(A4, Precios!$A$4:$A$17, Precios!$B$4:$B$16)**\n\nMira lo que contesta. Después ábrela otra vez (doble clic o F2) y cambia ese **B16** por **B17**.',
      pista:
        'Fíjate en los dos rangos: el primero llega hasta la fila 17 y el segundo se queda en la 16. Uno tiene catorce renglones y el otro trece. Para corregirla, doble clic en C4 y cambia el último número.',
      // `hoja:h4` y no `celda:C4`: el encargo anterior deja al alumno en Precios,
      // así que éste también «empieza cambiando de hoja» (ver la cabecera del
      // archivo) y tiene que señalar la lengüeta, no la celda — con `celda:C4`
      // puesta, la guarda del desvío bloqueaba la vuelta a Compras y la clase no
      // se podía terminar.
      senal: { control: 'hoja:h4' },
      logro: { tipo: 'documento', comprueba: losDosRangosMidenLoMismo },
      aprendido:
        'Lo que salió fue **#¡VALOR!**, y ahora ya sabes por qué: le pediste buscar en una lista de **catorce** renglones y traer de una de **trece**. Si encuentra el producto en el renglón catorce, ¿de dónde saca el precio? De ningún sitio, y en vez de inventarse uno se queja. **Los dos rangos tienen que ser del mismo alto**, siempre, y ése es el error número uno de todo el que empieza con BUSCARX. Ya corregida, mira C4: pasó de 12.50 a **14** sin que tú tecleases el 14. La celda dejó de mentir en el momento en que dejó de guardar un número.',
    },
    {
      id: 'la-columna-entera',
      titulo: 'Los ocho precios, de un arrastre',
      instruccion:
        'Ahora sí, la columna entera. Marca **de C4 a C11** —pulsa C4 y baja con Shift hasta C11— y pulsa **«Rellenar hacia abajo»**, en Inicio → Edición. No te asustes con lo que salga abajo.',
      pista:
        'Ese botón copia hacia abajo lo que tiene la **primera** celda de lo que marcaste, corrigiéndole el renglón a cada copia. Por eso hay que marcar desde C4, que es la que ya tiene la fórmula buena.',
      senal: { control: 'rellenar-abajo' },
      logro: { tipo: 'documento', comprueba: laColumnaEnteraTraeSuPrecio },
      aprendido:
        'Seis precios llegaron solos y **dos renglones dicen #N/A**. Antes de arreglarlo, mira dos cosas. La primera: pulsa **C7** y lee la fórmula arriba. Dice `A7` —cambió sola de renglón— y los dos rangos **siguen apuntando a Precios!$A$4:$A$17**, sin moverse ni una fila. Para eso eran los `$`: lo que cambia es qué busco; dónde lo busco, nunca. La segunda: C7 dice **GAFETES DE PLÁSTICO** en mayúsculas y en la papelería está escrito «Gafetes de plástico»… **y lo encontró igual**. A Excel las mayúsculas le dan lo mismo. Acuérdate de esto dentro de dos encargos.',
    },
    {
      id: 'que-dice-na',
      titulo: '¿Qué te está diciendo esa celda?',
      instruccion:
        'Una de pensar, antes de tocar nada. Dos celdas dicen **#N/A**: la de la cinta adhesiva y la de las pilas. La fórmula es exactamente la misma que en los otros seis renglones, y en los otros seis funcionó. ¿Qué significa ese #N/A?',
      pista:
        'No es un mensaje del programa avisándote de que algo se rompió: es el **resultado** de la celda, igual que 68 es el resultado de la de arriba. Piensa qué le pediste y qué pudo contestar.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'La fórmula está mal escrita: en esos dos renglones se te fue un paréntesis o un rango',
          'Buscó lo que le pediste en la lista que le dijiste, y ahí no está',
          'Excel se saturó: son demasiadas fórmulas mirando otra hoja a la vez',
        ],
        correcta: 1,
      },
      aprendido:
        '**#N/A significa «no está»**, y no es un fallo: es una respuesta, tan buena como un número. Viene de *not available*, «no disponible». La celda hizo su trabajo —recorrió los catorce productos de la papelería buscando el que le señalaste— y te está diciendo la verdad: ahí no aparece. Fíjate en lo que **no** hizo: no contestó 0, no se quedó en blanco, no cogió el precio del renglón de al lado. Un programa que se inventa un dato cuando no lo encuentra es mucho más peligroso que uno que se queja. Ahora bien: **que no lo encuentre no siempre es culpa de la lista de compras**. Uno de esos dos productos sí está en la papelería.',
    },
    {
      id: 'largo-delata',
      titulo: 'El espacio que no se ve',
      instruccion:
        'La cinta adhesiva **sí está** en la papelería: ve a la hoja **Precios** y míralo, renglón 6. Vamos a averiguar por qué no casa. Ahí mismo, en **B20** escribe **=LARGO(Compras!A10)** y en **B21** escribe **=LARGO(A6)**. Compara los dos números y arregla lo que sobre: vuelve a escribir **A6** sin lo que le sobra.',
      pista:
        '`LARGO` cuenta cuántas letras tiene un texto, **contando los espacios**. `Compras!A10` es «Cinta adhesiva» tal y como está en tu lista de compras; `A6` es el mismo producto en esta hoja. Si uno cuenta una letra más que el otro, esa letra de más es lo que hay que quitar.',
      senal: { control: 'hoja:h5' },
      logro: { tipo: 'documento', comprueba: elEspacioDeMasEstaCazado },
      aprendido:
        '**15 y 14.** Los dos textos se ven idénticos en la pantalla, y uno tiene una letra más: un **espacio al final** que la papelería dejó al teclear su lista. Para ti son el mismo producto; para la hoja son dos textos distintos, y por eso contestaba «no está». En cuanto le quitaste el espacio, la celda de Compras se arregló sola: **24 pesos**. Aquí van las dos frases que hay que llevarse. La primera: **cuando algo no casa y juras que está ahí, mide con LARGO** — es la herramienta con la que se cazan los datos sucios, y hay una clase entera dedicada a eso (bloque 44). La segunda, la que engancha con lo de hace un rato: **a la hoja le dan igual las mayúsculas y no le da igual un espacio**. GAFETES sí; un espacio, no.',
    },
    {
      id: 'el-cuarto-hueco',
      titulo: 'Que lo diga con palabras',
      instruccion:
        'Quedan las pilas, y ésas de verdad no las vende El Trébol. Un **#N/A** en una hoja que va a leer la directora no dice nada. Ponte en **C11** y añádele un cuarto hueco a la fórmula:\n\n**=BUSCARX(A11, Precios!$A$4:$A$17, Precios!$B$4:$B$17, "No está en el catálogo")**',
      pista:
        'Es la misma fórmula de antes con una coma y un texto más al final. El texto va **entre comillas dobles**: eso es lo que le dice a la hoja que son palabras y no una celda.',
      // `hoja:h4` y no `celda:C11`, por lo mismo que en «los-dos-rangos»: el
      // encargo anterior (`largo-delata`) deja al alumno en Precios, y sin
      // señalar la lengüeta la guarda del desvío no dejaba volver a Compras.
      senal: { control: 'hoja:h4' },
      logro: { tipo: 'documento', comprueba: laFraseEnVezDelError },
      aprendido:
        'El cuarto hueco es **opcional** y sirve para una cosa: **hablar claro**. Sin él, `BUSCARX` contesta `#N/A`, que es correcto y no lo entiende nadie que no sea de sistemas; con él, la hoja dice lo que pasa en el idioma de quien la va a leer. Y mira el importe de ese renglón: ahora dice **#¡VALOR!**, porque le pediste multiplicar 8 por una frase. **Está bien que se queje.** No hay precio, así que no hay importe. Lo que sería mentira es poner un **0** ahí para que quede limpio — diría que las pilas son gratis, y es exactamente el cero de la kermés de la clase pasada. Taparlo con elegancia tiene su propia herramienta y su propia clase (bloque 48); hoy la hoja dice la verdad, aunque no quede bonita.',
    },
    {
      id: 'partir-por-la-izquierda',
      titulo: 'Lo que mandó control escolar',
      instruccion:
        'Cambio de tema y de hoja. Abre la lengüeta **Lista**: son los ocho del salón, y llegaron con la matrícula pegada delante del nombre. Vamos a partirlos. En **B4** escribe **=IZQUIERDA(A4, 10)** y en **C4** escribe **=EXTRAE(A4, 2, 4)**. Antes de seguir, prueba una cosa: escribe **=EXTRAE(A4, 0, 4)** y mira qué pasa; después déjala como estaba.',
      pista:
        '`IZQUIERDA(texto, cuántas)` se queda con las primeras letras. La matrícula «A2024-0117» mide 10. `EXTRAE(texto, desde, cuántas)` saca un trozo de en medio: empieza en la letra 2 y coge 4, que son el año.',
      senal: { control: 'hoja:h6' },
      logro: { tipo: 'documento', comprueba: laMatriculaYElAnoEstanPartidos },
      aprendido:
        'Salieron **A2024-0117** y **2024**, y ya tienes dos columnas donde había una. Dos cosas. La primera: `EXTRAE(A4, 0, 4)` contesta **#¡VALOR!** porque **en Excel se cuenta desde 1, no desde 0** — la primera letra es la número 1, y la letra número 0 no existe. Si has programado alguna vez, esto es al revés de lo que te enseñaron; si no, es lo que dice el sentido común. La segunda: las dos funciones se apoyan en algo que aquí es verdad y casi nunca lo es — **que la matrícula mide siempre lo mismo**. Diez letras, todas. Por eso se puede contar con un número fijo.',
    },
    {
      id: 'partir-por-la-derecha',
      titulo: 'Y el nombre, que mide distinto cada vez',
      instruccion:
        'Falta el nombre, y ahí no vale un número fijo: «GARCÍA LÓPEZ, ANA» y «Márquez, Bruno» no miden lo mismo. En **D4** escribe **=DERECHA(A4, LARGO(A4)-11)**. Después marca **de B4 a D11** y pulsa **«Rellenar hacia abajo»**.',
      pista:
        '`DERECHA(texto, cuántas)` se queda con las últimas letras. ¿Cuántas? Las que hay **menos las 11 del principio** —los 10 de la matrícula y el espacio—, y eso no es un número: es una cuenta. `LARGO(A4)` las cuenta por ti, renglón por renglón.',
      senal: { control: 'rellenar-abajo' },
      logro: { tipo: 'documento', comprueba: elNombreSaleSolo },
      aprendido:
        'Ocho renglones partidos en tres columnas, y ninguno se te quedó cortado. Mira lo que acabas de hacer, porque es lo que separa una fórmula de un apaño: **le metiste una función dentro de otra**. `LARGO(A4)` se calcula primero y su resultado entra en `DERECHA` como si lo hubieras tecleado — sólo que se recalcula por su cuenta en cada renglón. Con un `=DERECHA(A4, 17)` el primero habría salido igual de bien y los otros siete habrían salido mochos. **Cuando el dato mide distinto cada vez, el número que necesitas no se escribe: se cuenta.**',
    },
    {
      id: 'mayusc-y-minusc',
      titulo: 'Que se lea igual en toda la lista',
      instruccion:
        'La lista llegó capturada por dos personas: unos renglones en MAYÚSCULAS y otros no, y los correos igual. El acta de calificaciones se entrega en mayúsculas y los correos se escriben en minúsculas. En **F4** escribe **=MAYUSC(D4)** y en **G4** escribe **=MINUSC(E4)**. Después marca **de F4 a G11** y rellena hacia abajo.',
      pista:
        'Las dos hacen lo mismo por dos lados: una pone todo en mayúsculas y la otra todo en minúsculas. A las que ya estaban bien no les pasa nada — que es justo lo que quieres.',
      senal: { control: 'rellenar-abajo' },
      logro: { tipo: 'documento', comprueba: elActaYElCorreoQuedanParejos },
      aprendido:
        'Dos columnas parejas donde había ocho capturas distintas. Y ahora la parte que casi nadie dice: **ninguna de las dos ha cambiado el dato**. Para la hoja, `García` y `GARCÍA` ya eran lo mismo antes de que tocaras nada —por eso BUSCARX encontró «GAFETES DE PLÁSTICO» en un catálogo que lo escribe en minúsculas—. Lo que cambia es **cómo se lee**, y eso importa cuando quien lee es una persona: un acta a medias mayúsculas parece hecha con prisa, y un correo en mayúsculas parece un grito. `MAYUSC` y `MINUSC` no limpian datos: emparejan cómo se ven. El que sí ensuciaba el dato era el espacio.',
    },
    {
      id: 'juntar-con-concat',
      titulo: 'Los diplomas, pegados',
      instruccion:
        'Baja un poco: la maestra tenía el nombre y los dos apellidos en tres columnas, y para los diplomas los quiere juntos. En **D15** escribe **=CONCAT(A15, " ", B15, " ", C15)** y en **E15** escribe **=LARGO(D15)**. Marca **de D15 a E22** y rellena hacia abajo. Cuando termines, mira el renglón de **Bruno**.',
      pista:
        '`CONCAT` pega todo lo que le des, uno detrás de otro y sin poner nada de su parte. Los espacios se los tienes que dar tú: por eso van esos `" "` entre las celdas — un espacio entre comillas es un texto de un carácter.',
      senal: { control: 'rellenar-abajo' },
      logro: { tipo: 'documento', comprueba: losDiplomasEstanPegados },
      aprendido:
        '«Ana García López», perfecto. Y ahora Bruno, que no tiene apellido materno: en la pantalla dice **«Bruno Márquez»** y parece que está bien… hasta que miras la columna de al lado. `LARGO` dice **14** y «Bruno Márquez» tiene **13** letras. **Ahí hay un espacio de sobra**, colgando al final, invisible — el mismo tipo de bicho que te hacía fallar la cinta adhesiva hace diez minutos, y ahora eres tú quien lo ha metido. Y así funciona `CONCAT`: pega lo que le des **sin pensar**, y si una de las celdas está vacía pega el hueco igual, con sus separadores y todo.',
    },
    {
      id: 'juntar-con-unircadenas',
      titulo: 'La que sí salta los huecos',
      instruccion:
        'Hay otra manera de juntar, y hace exactamente lo que falta. Ponte en **D15** y escribe esto encima:\n\n**=UNIRCADENAS(" ", VERDADERO, A15, B15, C15)**\n\nMarca **de D15 a D22**, rellena hacia abajo, y mira otra vez a Bruno y a Ximena.',
      pista:
        'Los huecos van en otro orden: primero **con qué separo** (un espacio entre comillas), después **si me salto lo vacío** (VERDADERO, escrito así, sin comillas), y a partir de ahí las celdas que quieras juntar. Fíjate en que ya no hay que escribir los espacios uno por uno.',
      senal: { control: 'rellenar-abajo' },
      logro: { tipo: 'documento', comprueba: losDiplomasQuedanBien },
      aprendido:
        '**Bruno bajó de 14 letras a 13**, y Ximena igual: el hueco desapareció sin que tocaras su renglón. Ahí está la diferencia entre las dos, y es la que importa el día que a alguien le falte un apellido: **`CONCAT` junta y ya; `UNIRCADENAS` junta con un separador y se salta lo vacío**. El separador se escribe **una sola vez** —no una por hueco—, y ese `VERDADERO` del segundo lugar es el interruptor: puesto en FALSO haría lo mismo que CONCAT, huecos incluidos. Cuando juntes trozos de texto, pregúntate siempre lo mismo: ¿puede faltarme alguno? Si la respuesta es sí, la buena es la segunda.',
    },
  ],

  cierre:
    'Hoy hiciste que dos hojas se hablen. Copiaste un precio a mano y lo viste quedarse viejo; escribiste BUSCARX con sus tres huecos —qué busco, dónde, qué me traigo—, le diste dos rangos desiguales para ver cómo se queja, aprendiste que #N/A no es un fallo sino un «eso no está», y cazaste con LARGO un espacio invisible que hacía fallar un dato que estaba ahí delante. Después partiste una lista de nombres pegados con IZQUIERDA, DERECHA y EXTRAE —metiendo una función dentro de otra para contar lo que no se puede saber de antemano—, la emparejaste con MAYUSC y MINUSC, y la volviste a juntar dos veces para descubrir por qué UNIRCADENAS existe. Desde hoy, cuando veas a alguien copiando datos de una tabla a otra, ya sabes lo que va a pasar en cuanto cambie la primera.',
};

export default GUION_BUSCARX;
