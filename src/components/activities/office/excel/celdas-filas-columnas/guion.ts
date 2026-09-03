import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { crudoDe, estaVacia, valorDe } from '@/components/office/motor-hojas/consultas';
import type { GuionHojas } from '@/components/office/motor-hojas/guion';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `n5-celdas-filas-columnas` · «Cada casilla tiene nombre» (temario §45.2,
 * bloques 1 · 2 · 3 · 4 · 7 · 12; reparto del §45.3).
 *
 * La primera clase de Tecnia Hojas y la que estrena la ventana, igual que
 * `of-word-la-cinta` estrenó el Edificio de Oficinas.
 *
 * ── POR QUÉ EL LIBRO LLEGA SIN UNA SOLA FÓRMULA ─────────────────────────────
 *
 * Porque las fórmulas son la clase 4 del grado y meterlas aquí de adorno haría
 * dos daños. El primero es obvio: un alumno que ve `=SUMA(D4:D9)` en la hoja de
 * la clase 1 aprende que eso es magia que ya venía puesta. El segundo importa
 * más y es de diseño: **esta clase se puede enseñar entera sin calcular nada**,
 * y eso es exactamente lo que quiere decir que la unidad es el domicilio. Si
 * para explicar qué es `D5` hiciera falta una fórmula, la separación de bloques
 * del temario estaría mal hecha.
 *
 * A cambio, la máquina sí calcula una vez y sin que nadie se lo pida: al marcar
 * los seis importes, **la barra de estado enseña sola el recuento y la suma**
 * (encargo 3). Es la primera vez que el alumno ve que el programa ya sabía la
 * cuenta, y es la manera de pagar el bloque 1 —qué es una hoja de cálculo y qué
 * no es— sin adelantar el bloque 13.
 *
 * ── LO QUE ESTA CLASE **NO** PUEDE PEDIR, Y POR QUÉ SE DICE ─────────────────
 *
 * El bloque 7 es «ancho de columna y alto de fila», y aquí se enseña
 * **mirando** (encargos 1 y 2) y no se pide como encargo: los dos botones están
 * inertes en `motor-hojas/cinta.ts` y construirlos de verdad es cambiarle la
 * geometría a la rejilla —el motivo largo está escrito junto a ellos—. Lo que
 * sí se enseña es la mitad que no necesita botón y que es la que se usa todos
 * los días: **que un texto cortado no es un dato perdido**. El alumno que no
 * entiende eso vuelve a teclear el dato más corto, que es el defecto de verdad.
 */

/* ── el libro de la salida ──────────────────────────────────────────────────*/

export const RELOJ = { ahora: Date.UTC(2026, 7, 14, 9, 0, 0) };

/** Los cinco conceptos que llegaron apuntados, en su orden. */
export const CONCEPTOS = [
  'Camión de la escuela a Teotihuacán',
  'Entradas a la zona arqueológica',
  'Guía del recorrido',
  'Torta y agua para cada quien',
  'Botiquín y papelería',
] as const;

export const PROPINA = 'Propina del chofer';

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * «Gastos de la salida del salón.xlsx», tal y como lo dejó la tesorera del
 * grupo: datos capturados a mano, encabezados en negrita y ni una fórmula.
 *
 * Es una función y no una constante por lo que dice `guion.ts`: «Empezar de
 * cero» tiene que poder volver a fabricarlo. Aquí duele más que en Word porque
 * media clase mueve filas y columnas de sitio, y una segunda partida sobre los
 * restos de la primera empieza con la hoja ya descuadrada.
 */
export function libroDeLaSalida(): Libro {
  return {
    activa: 'h1',
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

          A4: suelta(CONCEPTOS[0]),
          B4: suelta('1'),
          C4: suelta('4800'),
          D4: suelta('4800'),

          A5: suelta(CONCEPTOS[1]),
          B5: suelta('38'),
          C5: suelta('95'),
          D5: suelta('3610'),

          A6: suelta(CONCEPTOS[2]),
          B6: suelta('1'),
          C6: suelta('700'),
          D6: suelta('700'),

          A7: suelta(CONCEPTOS[3]),
          B7: suelta('38'),
          C7: suelta('65'),
          D7: suelta('2470'),

          A8: suelta(CONCEPTOS[4]),
          B8: suelta('1'),
          C8: suelta('240'),
          D8: suelta('240'),

          A9: suelta(PROPINA),
          B9: suelta('1'),
          C9: suelta('200'),
          D9: suelta('200'),

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
    ],
  };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────────*/

/**
 * Los predicados son funciones puras y **con nombre**, y leen el libro con
 * `consultas.ts`. Ni uno mira qué botón se pulsó: da igual si la fila se
 * insertó con el botón de la cinta o si mañana hay un menú contextual que hace
 * lo mismo, porque lo que se corrige es la hoja (§36.3).
 *
 * Y todos comprueban **el vecindario entero, no sólo la celda que cambió**.
 * Salió jugando mal: insertar la fila en el sitio equivocado también deja la
 * propina en la 10 —baja todo lo de abajo—, así que un predicado que sólo
 * mirara `A10` daría por bueno un hueco abierto cinco renglones más arriba.
 */

/** El texto de una celda de la hoja de la salida, tal cual se escribió. */
const enSalida = (libro: Libro, direccion: string): string => crudoDe(libro, 'h1', direccion);

/** Lo que la celda VALE, que para un número no es lo mismo que lo que dice. */
const valeEnSalida = (libro: Libro, direccion: string) =>
  valorDe(crearMotor(libro, RELOJ), 'h1', direccion);

/** ¿Siguen los cinco conceptos en las filas 4 a 8, en su orden? */
function laListaSigueEnSuSitio(libro: Libro): boolean {
  return CONCEPTOS.every((texto, i) => enSalida(libro, `A${4 + i}`) === texto);
}

/** Encargo 6: hay un renglón vacío en la 9 y la propina bajó a la 10. */
export function hayHuecoAntesDeLaPropina(libro: Libro): boolean {
  return (
    laListaSigueEnSuSitio(libro) &&
    estaVacia(libro, 'h1', 'A9') &&
    enSalida(libro, 'A10') === PROPINA
  );
}

/**
 * Encargo 7: el gasto que faltaba, escrito, y sus 180 pesos **como número**.
 *
 * El importe se comprueba por su VALOR y no por su texto, y ésa es la mitad de
 * la lección: `180`, ` 180` y `$180` son tres cosas distintas en una hoja de
 * cálculo —la primera es un número y las otras dos son palabras que se parecen
 * a un número—, y sólo la primera se deja sumar. Comparando el crudo con
 * `'180'` el encargo aprobaría exactamente lo mismo, pero por accidente; así lo
 * aprueba por el motivo correcto. El concepto sí se acepta como lo escriba: es
 * suyo y no hay una redacción correcta.
 */
export function elEstacionamientoEstaApuntado(libro: Libro): boolean {
  return (
    laListaSigueEnSuSitio(libro) &&
    enSalida(libro, 'A9').trim().length > 0 &&
    enSalida(libro, 'A10') === PROPINA &&
    valeEnSalida(libro, 'D9') === 180
  );
}

/** Encargo 8: la propina ya no está en ninguna parte de la columna A. */
export function laPropinaYaNoEsta(libro: Libro): boolean {
  const columna = libro.hojas.find((h) => h.id === 'h1')?.celdas ?? {};
  const hayPropina = Object.entries(columna).some(
    ([direccion, celda]) => direccion.startsWith('A') && celda.crudo === PROPINA,
  );
  return laListaSigueEnSuSitio(libro) && !hayPropina;
}

/** Encargo 9: se abrió una columna en la D y «Lo pagado» se corrió a la E. */
export function hayColumnaAbiertaEnLaD(libro: Libro): boolean {
  return (
    enSalida(libro, 'A3') === 'Concepto' &&
    enSalida(libro, 'B3') === 'Cuántos' &&
    enSalida(libro, 'C3') === 'Precio' &&
    estaVacia(libro, 'h1', 'D3') &&
    enSalida(libro, 'E3') === 'Lo pagado'
  );
}

/** Encargo 11: se cambió de hoja dentro del mismo archivo. */
export const estaEnLasCotizaciones = (libro: Libro): boolean => libro.activa === 'h2';

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_CELDAS_FILAS_COLUMNAS: GuionHojas = {
  archivo: 'Gastos de la salida del salón.xlsx',
  libro: libroDeLaSalida,

  portada: {
    situacion: 'Excel · Grado básico · La primera de la sala',
    tema: 'La celda, la fila y la columna',
    objetivo:
      'Vas a saber decir dónde está cualquier dato de una hoja de cálculo, y a meter y quitar filas y columnas sin descuadrarla.',
    vasAHacer: [
      'Leer el domicilio de una celda y lo que guarda de verdad',
      'Marcar un rango y ver a la máquina sumarlo sola',
      'Saltar a una celda lejana y llegar al final de la lista de un tecleo',
      'Meter la fila que faltaba, quitar la que sobraba y abrir una columna',
    ],
    requisitos: 'Nada. Es la primera clase de Excel: se empieza por saber dónde está cada cosa.',
    ayuda:
      'El cuadro de nombres y la barra de fórmulas están arriba, encima de las letras. Insertar y eliminar filas y columnas están en Inicio → Celdas. Si te equivocas, deshacer está arriba a la izquierda y no rompe nada.',
  },

  pasos: [
    {
      id: 'el-domicilio',
      titulo: 'Cada casilla tiene nombre',
      instruccion:
        'Pulsa la celda donde dice lo del camión, la primera de la lista de conceptos. Después mira dos sitios de arriba: el cuadro de nombres, a la izquierda, y la barra de fórmulas, a su derecha.',
      pista:
        'Es la casilla de la columna **A** y la fila **4**. El cuadro de nombres es la casilla blanca que está justo encima de la letra A.',
      senal: { control: 'celda:A4' },
      logro: { tipo: 'control', control: 'celda:A4' },
      aprendido:
        'Se llama **A4**: la letra es su columna y el número es su fila. Con eso ya no hace falta decir «la de arriba a la izquierda». Y fíjate en la diferencia entre los dos sitios que miraste: **el cuadro de nombres dice DÓNDE estás; la barra de fórmulas dice QUÉ hay ahí**. Son dos preguntas distintas y las contestan dos sitios distintos.',
    },
    {
      id: 'no-cabe',
      titulo: 'Lo que no cabe',
      instruccion:
        'Con A4 seleccionada, compara lo que ves dentro de la celda con lo que ves en la barra de fórmulas. En la celda el concepto se corta. ¿Qué le pasó al dato?',
      pista:
        'Léelo arriba, entero, en la barra de fórmulas. Si el dato estuviera roto, ahí también estaría roto.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Se guardó a medias: lo que no cabía se perdió al escribirlo',
          'Está entero; lo que se queda corto es la columna, que es angosta',
          'Hay que volver a escribirlo más corto para que quepa',
        ],
        correcta: 1,
      },
      aprendido:
        'El dato está completo y lo que se queda corto es el **ancho de la columna**, que es cosa de cómo se ve, no de lo que hay. Ensanchar una columna no le cambia ni una letra a lo que guarda. En Excel se ensancha arrastrando la raya que separa dos letras de arriba; aquí, por ahora, todas las columnas miden lo mismo. Y un aviso que sirve para siempre: cuando el que no cabe es un **número**, Excel llena la celda de `#####` en vez de enseñarte una cifra recortada, porque un número a medias sería una mentira.',
    },
    {
      id: 'el-rectangulo',
      titulo: 'De aquí hasta allá',
      instruccion:
        'Marca los seis importes de la columna «Lo pagado»: pulsa D4 y, sin soltar el ratón, baja hasta D9 —o pulsa D4 y baja con Shift y la flecha—. Cuando los tengas marcados, mira la franja de hasta abajo.',
      pista:
        'D4 es el 4800 del camión y D9 es el 200 de la propina. La franja de abajo es la barra de estado, la última línea de la ventana.',
      senal: { control: 'rango:D4:D9' },
      logro: { tipo: 'control', control: 'rango:D4:D9' },
      aprendido:
        'Ahí abajo aparecieron solos **Recuento: 6** y **Suma: 12020**, y tú no escribiste ninguna fórmula. Eso es lo que separa esto de una tabla bonita de Word: **una hoja de cálculo no es una tabla, es una calculadora enorme donde cada casilla tiene nombre**. Y lo que acabas de marcar se escribe **D4:D9**, que se lee «de D4 hasta D9»: ojo, **`A1:B5` no son dos celdas, son todas las que caben en ese rectángulo** —diez, dos columnas por cinco filas—.',
    },
    {
      id: 'de-un-salto',
      titulo: 'El cuadro de nombres, al revés',
      instruccion:
        'Escribe A20 dentro del cuadro de nombres —arriba a la izquierda— y pulsa Entrar.',
      pista:
        'Se pulsa dentro de la casilla que dice el nombre de la celda, se borra lo que hay, se escribe **A20** y se pulsa Entrar. No lleva espacios ni acentos.',
      senal: { control: 'cuadro-de-nombres' },
      logro: { tipo: 'control', control: 'salto:A20' },
      aprendido:
        'Te llevó de un salto. El cuadro de nombres funciona en los dos sentidos: **te dice dónde estás y te lleva a donde le pidas**. Y de paso viste algo: la hoja sigue mucho más abajo de lo que cabe en la pantalla. En una de mil renglones, esto es la diferencia entre llegar en un segundo o bajar rodando con la rueda del ratón.',
    },
    {
      id: 'hasta-el-final',
      titulo: 'Al final de la lista',
      instruccion:
        'Vuelve a la lista: pulsa A4, la del camión. Ahora mantén **Ctrl** y pulsa la flecha de abajo.',
      pista:
        'Primero se selecciona A4 con un clic, y después se pulsan las dos teclas a la vez: Ctrl y ↓. Vas a acabar en la última celda que tiene algo escrito sin hueco de por medio.',
      senal: { control: 'celda:A4' },
      logro: { tipo: 'control', control: 'celda:A9' },
      aprendido:
        'Se plantó en **A9**, el último renglón de la lista, de un tecleo. `Ctrl`+flecha salta hasta donde se acaban los datos, en las cuatro direcciones, y se para en el primer hueco. Con nueve renglones parece un lujo; con ochocientos es lo único que te salva la muñeca.',
    },
    {
      id: 'se-nos-fue-una',
      titulo: 'Faltaba un gasto',
      instruccion:
        'Se les olvidó apuntar el estacionamiento del camión, y va justo antes de la propina. Ponte en cualquier celda de la fila 9 —la de la propina— y pulsa «Insertar filas», en Inicio → Celdas.',
      pista:
        'La fila nueva entra **donde está el cursor** y empuja hacia abajo lo que había. Así que primero hay que ponerse en la 9, no en la 10.',
      senal: { control: 'insertar-fila' },
      logro: { tipo: 'documento', comprueba: hayHuecoAntesDeLaPropina },
      aprendido:
        'Mira los números de la izquierda: **insertar una fila no «hace hueco» y ya, empuja todo lo de abajo**. La propina, que estaba en la 9, ahora está en la 10, y con ella se bajaron su cantidad y su importe: viajaron enteros, en su renglón. Cuando escribas fórmulas verás la otra mitad de esto — la que miraba ese dato lo sigue hasta su nuevo domicilio en vez de quedarse mirando el renglón vacío.',
    },
    {
      id: 'escribe-el-que-faltaba',
      titulo: 'Llena el renglón nuevo',
      instruccion:
        'En A9 escribe «Estacionamiento del camión» y en D9 escribe 180, que es lo que costó. Se escribe seleccionando la celda y tecleando; se confirma con Entrar.',
      pista:
        'Para escribir no hace falta doble clic: con la celda seleccionada, teclea y verás cómo empieza a escribirse. Entrar confirma y baja; Escape se arrepiente.',
      senal: { control: 'celda:A9' },
      logro: { tipo: 'documento', comprueba: elEstacionamientoEstaApuntado },
      aprendido:
        'Fíjate en **a qué lado se pegó cada cosa**: el texto se fue a la izquierda de su celda y el 180 se fue a la derecha. Eso no lo decidiste tú, lo decidió el programa, y es el chivato más útil que hay: **si un número se te va a la izquierda, es que no entró como número** —lleva un espacio, una coma o un signo de pesos tecleado a mano— y ninguna suma lo va a contar.',
    },
    {
      id: 'esa-no-iba',
      titulo: 'Y sobraba otra',
      instruccion:
        'Al final el chofer no aceptó propina. Selecciona la fila entera pulsando su número, a la izquierda del todo, y quítala con «Eliminar filas».',
      pista:
        'El número de la fila está en la orilla izquierda, fuera de la cuadrícula. Un clic ahí marca la fila completa; después, Inicio → Celdas → Eliminar filas.',
      senal: { control: 'borrar-fila' },
      logro: { tipo: 'documento', comprueba: laPropinaYaNoEsta },
      aprendido:
        'Se fue el renglón entero y lo de abajo subió a ocupar su sitio. Ahí hay una diferencia que se paga cara y conviene saberla hoy: **Suprimir borra lo que hay dentro y deja el renglón vacío; «Eliminar filas» se lleva el renglón**. Lo primero deja un hueco en medio de la lista; lo segundo cierra la lista.',
    },
    {
      id: 'una-columna-nueva',
      titulo: 'Ahora de lado',
      instruccion:
        'Falta apuntar quién pagó cada cosa, y esa columna va antes de «Lo pagado». Ponte en cualquier celda de la columna D y pulsa «Insertar columnas».',
      pista:
        'La columna nueva entra **donde está el cursor** y empuja a las de la derecha. Ponte en la D —la de «Lo pagado»— y pulsa el botón: la que estaba ahí se irá a la E.',
      senal: { control: 'insertar-columna' },
      logro: { tipo: 'documento', comprueba: hayColumnaAbiertaEnLaD },
      aprendido:
        'Lo mismo que con las filas pero de lado: **la columna no se abre un hueco, empuja a las de la derecha**. Lo que estaba en D ahora está en E, y su letra cambió con ella. Y ahí está lo que hay que entender de esta clase: una celda no es una caja fija, es **un domicilio**, y si los datos se mudan, se mudan de dirección.',
    },
    {
      id: 'las-lineas-no-son-la-hoja',
      titulo: 'Las rayas no son la hoja',
      instruccion:
        'Una de mirar. Ve a la pestaña Vista y apaga «Líneas de cuadrícula». Después vuelve a encenderlas.',
      pista:
        'Está en la pestaña **Vista**, en el grupo «Mostrar». Es un botón que se queda hundido cuando las líneas se ven.',
      senal: { control: 'ver-cuadricula' },
      logro: { tipo: 'control', control: 'ver-cuadricula' },
      aprendido:
        'Se fueron las rayas y tus datos siguen exactamente donde estaban: **la cuadrícula es una ayuda de la pantalla, no parte del libro**. Por eso este botón vive en Vista y no en Inicio — Vista no cambia el archivo, cambia cómo lo miras tú. Es lo mismo que pasa con el zoom.',
    },
    {
      id: 'la-otra-hoja',
      titulo: 'Un archivo, varias hojas',
      instruccion:
        'Abajo del todo hay dos lengüetas. Pulsa la que dice «Cotizaciones».',
      pista:
        'Están en la orilla de abajo, debajo de la cuadrícula, al lado del botón + de hoja nueva.',
      senal: { control: 'hoja:h2' },
      logro: { tipo: 'documento', comprueba: estaEnLasCotizaciones },
      aprendido:
        'Un archivo de Excel no es una hoja: es un **libro**, y cada lengüeta es una hoja entera con sus propias celdas. **La A1 de aquí no es la A1 de allá**, y por eso una dirección completa se dice con el nombre de la hoja delante: `Cotizaciones!B4`. Aquí estaban guardadas las tres cotizaciones del camión, en el mismo archivo y sin estorbarle a los gastos.',
    },
  ],

  cierre:
    'Ya sabes decir dónde está cualquier dato —columna y fila—, marcar un rectángulo de celdas y llamarlo por su nombre, saltar a donde quieras, y meter y quitar filas y columnas sabiendo que lo demás se corre. Eso es el domicilio. Lo que se hace con los datos una vez que sabes dónde están, empieza en la clase que sigue.',
};

export default GUION_CELDAS_FILAS_COLUMNAS;
