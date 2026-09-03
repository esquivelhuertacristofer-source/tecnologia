import { guardaUnaRegla, vale } from '@/components/office/motor-hojas/consultas';
import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import { escenarioDe, escenariosDe } from '@/components/office/motor-hojas/ysi';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `of-excel-y-si` · «¿Y si fuera de otra manera?» (bloque 57, grado Avanzado).
 *
 * ── EL CASO ──────────────────────────────────────────────────────────────
 *
 * El comité ya apartó el camión para la salida a Teotihuacán y cerró el
 * paquete con la agencia. Al sumar todo, faltan 3.000 pesos: la aportación de
 * siempre no alcanza. Hasta hoy esto se resolvía tanteando a mano —subes la
 * cuota, recalculas, te pasas, bajas otra vez—. Hoy no: se le pide a la hoja
 * el resultado que hace falta y se deja que ELLA encuentre el dato.
 *
 * ── LA ÚNICA CLASE QUE USA LA HOJA AL REVÉS ─────────────────────────────────
 *
 * Las cincuenta y seis clases anteriores de Excel se leen hacia adelante:
 * pones datos, la hoja te da un resultado. Buscar objetivo es la primera vez
 * en todo el temario que se hace al revés —dices el resultado, la hoja
 * averigua el dato—, y el encargo 2 lo dice así de claro, sin escondérselo
 * detrás de un botón nuevo nada más.
 *
 * ── LAS TRES FORMAS DE FALLAR, YA CONSTRUIDAS EN `ysi.ts` ───────────────────
 *
 * El encargo 1 provoca las dos primeras a propósito, una detrás de otra, en
 * el mismo intento que ya las corrige: la celda objetivo tiene que guardar
 * una fórmula (si no, no hay nada que buscar) y la celda que se mueve tiene
 * que guardar un número escrito a mano (si guarda una fórmula, es ELLA la que
 * se mueve sola). El encargo 4 provoca la tercera —el error número uno del
 * alumno, «la celda que quieres mover no influye en el objetivo»— con una
 * celda de verdad tentadora: un fondo de ahorro que tiene dinero pero al que
 * ninguna fórmula de la hoja hace caso. Y el encargo 7 provoca la cuarta
 * forma de fallar, la que no es un error de tecleo: un objetivo que
 * sencillamente no tiene solución —el costo por alumno nunca baja de 60,
 * hagas venir a mil personas—, y el libro se queda exactamente como estaba.
 *
 * ── LOS ESCENARIOS, Y EL PELIGRO QUE ENSEÑAN ────────────────────────────────
 *
 * Un escenario es una foto con nombre de unas celdas, para comparar sin
 * teclear encima y perder lo que había. El encargo 8 provoca a propósito
 * guardar dos veces bajo el mismo nombre —se avisa, y se reemplaza en su
 * sitio—, y el encargo 10 provoca el peligro de verdad: aplicar un escenario
 * sobre una celda que en ese momento tiene una fórmula la sustituye por un
 * número. Se pierde la regla, y el aviso lo dice con números antes de que
 * pase.
 *
 * ── POR QUÉ NINGÚN PREDICADO ENCADENA CON UN VALOR EXACTO DE UN ENCARGO
 *    ANTERIOR ───────────────────────────────────────────────────────────────
 *
 * La aportación (B5) cambia de valor SEIS veces a lo largo de la clase —200,
 * 220, 200 otra vez, 217.5…— porque eso es exactamente lo que enseña Buscar
 * objetivo y lo que enseñan los escenarios: números que legítimamente se
 * mueven. Un predicado que exigiera «B5 sigue valiendo 200» dejaría imposible
 * de cerrar cualquier encargo posterior que lo cambiara con toda la razón —el
 * mismo defecto que ya cazó y corrigió `of-excel-datos-limpios` con su
 * `laBaseSigueFirme`—. Por eso cada predicado de aquí abajo comprueba sólo el
 * estado que le toca a SU encargo, nunca el de uno anterior.
 */

/* ── el libro: el presupuesto de la salida a Teotihuacán ─────────────────── */

export const HOJA = 'h1';
export const TITULO = 'Salida a Teotihuacán · Presupuesto';

export const CELDA_ALUMNOS = 'B4';
export const CELDA_APORTACION = 'B5';
export const CELDA_CAMION = 'B6';
export const CELDA_ENTRADA = 'B7';
export const CELDA_COMIDA = 'B8';
export const CELDA_RECAUDADO = 'B9';
export const CELDA_GASTOS = 'B10';
export const CELDA_DIFERENCIA = 'B11';
export const CELDA_COSTO_ALUMNO = 'B12';
export const CELDA_FONDO = 'B15';

export const ESCENARIO_35 = '35 alumnos';
export const ESCENARIO_40 = '40 alumnos';

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * «Salida a Teotihuacán · Presupuesto.xlsx». Es una función y no una
 * constante por lo de siempre: «Empezar de cero» tiene que poder volver a
 * fabricarlo entero, con los 40 alumnos de siempre y sin un solo escenario
 * guardado.
 */
export function libroDeLaSalida(): Libro {
  const celdas: Record<string, Celda> = {
    A1: fuerte(TITULO),
    A2: suelta(
      'El camión ya está apartado y el paquete con la agencia, cerrado. Antes de avisarle a las familias cuánto va a costar, hay que cuadrar los números.',
    ),
    A3: fuerte('Dato'),
    B3: fuerte('Valor'),
    A4: suelta('Alumnos que van'),
    [CELDA_ALUMNOS]: suelta('40'),
    A5: suelta('Aportación por alumno'),
    [CELDA_APORTACION]: suelta('125'),
    A6: suelta('Costo del camión'),
    [CELDA_CAMION]: suelta('5600'),
    A7: suelta('Entrada por persona'),
    [CELDA_ENTRADA]: suelta('40'),
    A8: suelta('Comida por persona'),
    [CELDA_COMIDA]: suelta('20'),
    A9: suelta('Total recaudado'),
    [CELDA_RECAUDADO]: suelta(`=${CELDA_ALUMNOS}*${CELDA_APORTACION}`),
    A10: suelta('Total de gastos'),
    [CELDA_GASTOS]: suelta(`=${CELDA_CAMION}+${CELDA_ALUMNOS}*(${CELDA_ENTRADA}+${CELDA_COMIDA})`),
    A11: suelta('Diferencia (falta o sobra)'),
    [CELDA_DIFERENCIA]: suelta(`=${CELDA_RECAUDADO}-${CELDA_GASTOS}`),
    A12: suelta('Costo por alumno, todo incluido'),
    [CELDA_COSTO_ALUMNO]: suelta(`=${CELDA_GASTOS}/${CELDA_ALUMNOS}`),
    A14: fuerte('Otros fondos'),
    A15: suelta('Fondo de ahorro del club'),
    [CELDA_FONDO]: suelta('800'),
  };
  return { activa: HOJA, nombres: {}, hojas: [{ id: HOJA, nombre: 'Presupuesto', celdas }] };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────── */

const motorDe = (libro: Libro): Motor => crearMotor(libro, RELOJ_DE_LA_CLASE);

const esNumero = (libro: Libro, direccion: string): boolean => !guardaUnaRegla(libro, HOJA, direccion);

const valeAqui = (libro: Libro, direccion: string, esperado: number): boolean =>
  vale(motorDe(libro), HOJA, direccion, esperado);

/**
 * ¿El escenario `nombre` guarda EXACTAMENTE estos crudos, ni uno de más ni
 * uno de menos? Comparar el crudo —no el valor— es lo que distingue «guardó
 * el número 217.5» de «guardó la fórmula que hoy da 217.5»: un escenario es
 * una foto de lo que había ESCRITO, nunca de lo que la hoja calculaba en ese
 * instante (la cabecera de `ysi.ts`, decisión 4).
 */
function escenarioGuarda(libro: Libro, nombre: string, esperado: Record<string, string>): boolean {
  const e = escenarioDe(libro, nombre);
  if (!e) return false;
  const claves = Object.keys(esperado);
  if (Object.keys(e.celdas).length !== claves.length) return false;
  return claves.every((dir) => e.celdas[`${HOJA}!${dir}`] === esperado[dir]);
}

/* — encargo 1: los dos tropiezos, y la primera búsqueda de verdad — */

export function laAportacionSeEncontro(libro: Libro): boolean {
  return esNumero(libro, CELDA_APORTACION) && valeAqui(libro, CELDA_APORTACION, 200) && valeAqui(libro, CELDA_DIFERENCIA, 0);
}

/* — encargo 3: 35 alumnos, tecleado a mano, hacia adelante — */

export function seEscribieronTreintaYCinco(libro: Libro): boolean {
  return esNumero(libro, CELDA_ALUMNOS) && valeAqui(libro, CELDA_ALUMNOS, 35) && valeAqui(libro, CELDA_DIFERENCIA, -700);
}

/* — encargo 4: el fondo no influye; con B5 sí — */

export function laAportacionDeTreintaYCinco(libro: Libro): boolean {
  return (
    valeAqui(libro, CELDA_ALUMNOS, 35) &&
    esNumero(libro, CELDA_APORTACION) &&
    valeAqui(libro, CELDA_APORTACION, 220) &&
    valeAqui(libro, CELDA_DIFERENCIA, 0)
  );
}

/* — encargo 5: guardar el primer escenario — */

export function seGuardoElDeTreintaYCinco(libro: Libro): boolean {
  return escenarioGuarda(libro, ESCENARIO_35, { [CELDA_ALUMNOS]: '35', [CELDA_APORTACION]: '220' });
}

/* — encargo 6: de vuelta a 40, y el segundo escenario — */

export function seGuardoElDeCuarenta(libro: Libro): boolean {
  return (
    valeAqui(libro, CELDA_ALUMNOS, 40) &&
    esNumero(libro, CELDA_APORTACION) &&
    valeAqui(libro, CELDA_APORTACION, 200) &&
    valeAqui(libro, CELDA_DIFERENCIA, 0) &&
    escenarioGuarda(libro, ESCENARIO_40, { [CELDA_ALUMNOS]: '40', [CELDA_APORTACION]: '200' })
  );
}

/* — encargo 7: el camión sube, la pregunta imposible, y la de verdad — */

export function elCamionSubioYCuadro(libro: Libro): boolean {
  return (
    valeAqui(libro, CELDA_CAMION, 6300) &&
    valeAqui(libro, CELDA_ALUMNOS, 40) &&
    esNumero(libro, CELDA_APORTACION) &&
    valeAqui(libro, CELDA_APORTACION, 217.5) &&
    valeAqui(libro, CELDA_DIFERENCIA, 0)
  );
}

/* — encargo 8: guardar dos veces bajo el mismo nombre — */

export function seReemplazoElDeCuarenta(libro: Libro): boolean {
  return escenariosDe(libro).length === 2 && escenarioGuarda(libro, ESCENARIO_40, { [CELDA_ALUMNOS]: '40', [CELDA_APORTACION]: '217.5' });
}

/* — encargo 9: aplicar, y comparar sin teclear — */

export function seAplicoElDeTreintaYCinco(libro: Libro): boolean {
  return valeAqui(libro, CELDA_ALUMNOS, 35) && valeAqui(libro, CELDA_APORTACION, 220);
}

/* — encargo 10: la fórmula que se pierde — */

export function laFormulaSePerdioAlAplicar(libro: Libro): boolean {
  return valeAqui(libro, CELDA_ALUMNOS, 40) && esNumero(libro, CELDA_APORTACION) && valeAqui(libro, CELDA_APORTACION, 217.5);
}

/* — encargo 11: borrar el que ya no hace falta — */

export function seBorroElDeTreintaYCinco(libro: Libro): boolean {
  return escenarioDe(libro, ESCENARIO_35) === null && escenarioDe(libro, ESCENARIO_40) !== null && escenariosDe(libro).length === 1;
}

/* ── el guion ──────────────────────────────────────────────────────────── */

export const GUION_Y_SI: GuionHojas = {
  archivo: `${TITULO}.xlsx`,
  libro: libroDeLaSalida,

  portada: {
    situacion: 'Excel · Grado avanzado · La que pregunta al revés',
    tema: 'Análisis Y si: buscar objetivo y escenarios',
    objetivo:
      'Vas a dejar de tantear a mano. Vas a decirle a la hoja el resultado que quieres, y a dejar que ELLA encuentre el dato que hace falta — la primera vez en toda la sala que la hoja se usa al revés. Y vas a guardar varias versiones de la misma pregunta con nombre, para compararlas sin perder ninguna ni teclear encima.',
    vasAHacer: [
      'Buscar objetivo: pedir un resultado y dejar que la hoja averigüe qué dato hace falta — provocando primero los dos tropiezos que el motor caza antes de intentarlo',
      'Provocar el error número uno: mover una celda que no influye en el objetivo, y comprobar que hay preguntas sin respuesta',
      'Guardar un escenario, una foto con nombre de varias celdas a la vez, para comparar sin perder lo de antes',
      'Aplicar un escenario sobre una celda que tiene una fórmula, y ver cómo eso la sustituye por un número y se pierde la regla',
    ],
    requisitos:
      'Las clases anteriores de Excel: escribir fórmulas y saber que la celda guarda la regla, no el resultado. Hoy no hace falta ninguna función nueva: los cuatro botones de hoy viven en un panel propio, «Y si», a la derecha.',
    ayuda:
      'El panel «Y si» tiene los tres huecos de Buscar objetivo —la celda objetivo es la que tengas seleccionada en la hoja; el valor y la celda que cambia se escriben ahí mismo— y, debajo, la lista de escenarios ya guardados con sus botones de Aplicar y Borrar.',
  },

  pasos: [
    {
      id: 'al-reves-con-dos-tropiezos',
      titulo: 'Al revés, con dos tropiezos en el camino',
      instruccion:
        'El camión ya está apartado y faltan **3.000 pesos**: la aportación de siempre no alcanza. Antes de subirla a mano, dos intentos que casi todo el mundo prueba primero. Ponte en **B5** (Aportación por alumno) y, en el panel «Y si», escribe valor **200** y celda que cambia **B4**, y pulsa **Buscar objetivo**. Lee el aviso. Ahora ponte en **B11** (Diferencia): valor **0**, celda que cambia **B9** (Total recaudado), y pulsa otra vez. Lee el aviso otra vez. Por fin, con el cursor todavía en **B11**: valor **0**, celda que cambia **B5**, y pulsa Buscar objetivo una tercera vez.',
      pista:
        'El primer intento apunta a B5, que no guarda ninguna fórmula: ahí no hay nada que buscar. El segundo intenta mover B9, un TOTAL que también es una fórmula — sólo se puede mover una celda con un número escrito a mano, como B5.',
      senal: { control: 'buscar-objetivo' },
      logro: { tipo: 'documento', comprueba: laAportacionSeEncontro },
      aprendido:
        'Los dos primeros avisos decían justo lo que pasaba: «B5 no guarda una fórmula, ahí no hay nada que buscar» y «B9 guarda una fórmula: buscar objetivo sólo puede mover un número escrito a mano». El tercero sí funcionó: **B5 pasó de 125 a 200**, sin que tú calcularas nada. Le dijiste a la hoja el resultado que querías —que B11, la Diferencia, llegara a 0— y ELLA encontró el dato.',
    },
    {
      id: 'que-cambio',
      titulo: '¿En qué se diferencia esto de las demás clases?',
      instruccion:
        'Cincuenta y seis clases de Excel, y siempre fue igual: escribes un dato, la hoja te da un resultado. ¿Qué acabas de hacer distinto?',
      pista: 'Piensa en qué escribiste TÚ y qué encontró la hoja SOLA.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Nada: sigue siendo escribir un dato y ver un resultado, sólo que con un botón nuevo',
          'Le dijiste a la hoja el RESULTADO que querías, y ella encontró el DATO que lo produce: la hoja se usó al revés',
          'La diferencia es que esta vez no hizo falta escribir ninguna fórmula',
        ],
        correcta: 1,
      },
      aprendido:
        'Eso es. Hasta hoy la hoja se leía hacia adelante: pones datos, sale un resultado. Buscar objetivo la usa al REVÉS: dices el resultado y la hoja averigua el dato — probando y midiendo, no despejando, porque una hoja de cálculo no sabe hacer álgebra.',
    },
    {
      id: 'y-si-son-treinta-y-cinco',
      titulo: '¿Y si sólo confirman treinta y cinco?',
      instruccion:
        'Antes de avisarle a nadie el nuevo monto, el comité pregunta: ¿y si al final sólo van 35? En **B4** escribe, a mano, **35**.',
      pista: 'B4 es Alumnos que van. Se escribe el número a secas: es un dato, no una fórmula.',
      senal: { control: 'celda:B4' },
      logro: { tipo: 'documento', comprueba: seEscribieronTreintaYCinco },
      aprendido:
        'Mira **B11**: volvió a ponerse en números rojos, esta vez −700. Nadie tocó Buscar objetivo: la hoja se leyó hacia ADELANTE, como siempre — cambiaste un dato y el resultado se movió solo, porque el camión cuesta lo mismo lo repartan entre 40 o entre 35.',
    },
    {
      id: 'el-error-numero-uno',
      titulo: 'El error número uno: una celda que no influye',
      instruccion:
        'Antes de subir la cuota otra vez, alguien propone sacar la diferencia del fondo de ahorro del club. Pruébalo: en **B11** (Diferencia), valor **0**, celda que cambia **B15** (Fondo de ahorro del club), y pulsa Buscar objetivo. Lee el aviso. Corrígelo: mismo valor, celda que cambia **B5**.',
      pista:
        'B15 tiene 800 pesos guardados, pero ninguna fórmula de la hoja lo menciona. Buscar objetivo lo mira ANTES de intentar nada: si una celda no entra en la cuenta, no hay tanteo que valga.',
      senal: { control: 'buscar-objetivo' },
      logro: { tipo: 'documento', comprueba: laAportacionDeTreintaYCinco },
      aprendido:
        'El aviso lo dijo antes de tantear ni una vez: «cambiar B15 no mueve B11: esa celda no entra en su cuenta». Es el error número uno de quien empieza con Buscar objetivo —mover una celda que se ve relacionada pero no lo está— y el programa lo caza mirando de qué depende la fórmula, no probando cien veces a ciegas. Con B5 sí funcionó: la aportación subió a **220**. Menos alumnos, más le toca a cada quien.',
    },
    {
      id: 'guardalo-con-nombre',
      titulo: 'Guárdalo con nombre, antes de que se te olvide',
      instruccion:
        'Ese 220 vale la pena guardarlo para comparar después. Marca **B4:B5** y, en el panel, escribe el nombre **35 alumnos** y pulsa Guardar escenario.',
      pista: 'Un escenario guarda una FOTO de las celdas que marques, tal como están ahora mismo — no una fórmula, los crudos.',
      senal: { control: 'guardar-escenario' },
      logro: { tipo: 'documento', comprueba: seGuardoElDeTreintaYCinco },
      aprendido:
        'Ya quedó guardado: «35 alumnos» recuerda B4 y B5 tal como están ahora, sin que tengas que anotarlo en un papel ni acordarte de memoria. Es un juego de valores con nombre — la próxima vez que quieras volver a ver este escenario, no vas a tener que volver a buscar el objetivo.',
    },
    {
      id: 'vuelve-a-los-cuarenta',
      titulo: 'Vuelve a los cuarenta, y guarda también ése',
      instruccion:
        'Al final sí confirman los 40 de siempre. En **B4** escribe **40**. Con el cursor en **B11**, valor **0**, celda que cambia **B5**, pulsa Buscar objetivo. Marca **B4:B5** otra vez y guarda este escenario con el nombre **40 alumnos**.',
      pista: 'B5 se quedó en 220, el número que le tocaba a 35: con 40 de vuelta, la Diferencia ya no da cero — hay que volver a buscar el objetivo.',
      senal: { control: 'buscar-objetivo,guardar-escenario' },
      logro: { tipo: 'documento', comprueba: seGuardoElDeCuarenta },
      aprendido:
        'Con 40 alumnos, 200 cada uno vuelve a cuadrar exacto — el mismo número del primer intento del día, y no es casualidad: es la misma cuenta. Ahora tienes DOS escenarios guardados, «35 alumnos» y «40 alumnos», sin que ninguno haya borrado al otro.',
    },
    {
      id: 'el-camion-sube',
      titulo: 'El camión sube, y una pregunta imposible por el camino',
      instruccion:
        'La agencia avisa: el camión ya no cuesta 5.600, cuesta **6.300**. En **B6** escribe ese nuevo número. Antes de subir la cuota otra vez, alguien pregunta en broma si conviene meter a MÁS alumnos para que el costo por cabeza (**B12**) baje hasta 50 pesos: en B12, valor **50**, celda que cambia **B4**, y pulsa Buscar objetivo. Lee el aviso. Ahora sí, en serio: **B11**, valor **0**, celda que cambia **B5**.',
      pista:
        'El camión se reparte entre los que van, pero la entrada y la comida NO bajan por alumno nunca — hay un piso que ese costo por cabeza no puede cruzar aunque metas a mil personas.',
      senal: { control: 'buscar-objetivo' },
      logro: { tipo: 'documento', comprueba: elCamionSubioYCuadro },
      aprendido:
        'No lo encontró, y no es un defecto del programa: probó dieciséis veces y B12 nunca bajó de 60, por más alumnos que probara — 60 es el piso, la parte del costo que el camión no le quita a nadie por repartirse entre más gente. El libro se quedó exactamente como estaba: B4 nunca se movió. La pregunta de verdad sí tiene respuesta: con el camión más caro, cada quien tiene que poner **217.5**.',
    },
    {
      id: 'el-mismo-nombre-dos-veces',
      titulo: 'El mismo nombre, dos veces',
      instruccion:
        'Por costumbre, guarda este número con el mismo nombre de siempre. Marca **B4:B5** y, en el panel, escribe **40 alumnos** otra vez y pulsa Guardar escenario. Lee el aviso, y vuelve a pulsar para seguir.',
      pista: 'Ya hay un escenario llamado así —el que guardaste con 200—. Guardar con el mismo nombre no crea uno nuevo: reemplaza al que ya estaba.',
      senal: { control: 'guardar-escenario' },
      logro: { tipo: 'documento', comprueba: seReemplazoElDeCuarenta },
      aprendido:
        'El aviso avisó ANTES de perder nada: «ya hay un escenario llamado 40 alumnos: guardarlo lo va a reemplazar». Confirmaste, y ahora «40 alumnos» ya no recuerda 200: recuerda 217.5, el de después de que subiera el camión. Sigue habiendo sólo dos escenarios, no tres — guardar con un nombre que ya existe reemplaza en su sitio, nunca amontona.',
    },
    {
      id: 'compara-sin-retetear',
      titulo: 'Compara sin volver a teclear nada',
      instruccion:
        'El comité quiere ver otra vez cómo se veía con 35. Sin tocar el teclado: en la lista de escenarios del panel, pulsa **Aplicar** en «35 alumnos».',
      pista: 'Aplicar un escenario escribe de un golpe todo lo que guardó — no hay que recordar los números ni volver a buscar el objetivo.',
      senal: { control: 'aplicar-escenario' },
      logro: { tipo: 'documento', comprueba: seAplicoElDeTreintaYCinco },
      aprendido:
        'B4 y B5 volvieron a 35 y 220 en un solo clic, sin teclear nada. Eso es lo que compra guardar un escenario: comparar dos versiones de la misma pregunta sin perder ninguna — que es justo lo que pasa cuando tecleas encima y ya no te acuerdas de qué había.',
    },
    {
      id: 'el-peligro-de-aplicar',
      titulo: 'El peligro: una fórmula que se pierde',
      instruccion:
        'Antes de volver a 40, alguien decide hacerlo a mano con álgebra: en **B5** escribe la fórmula **=B10/B4**. Ahora aplica el escenario «40 alumnos». Lee el aviso, y vuelve a pulsar para confirmar.',
      pista: 'B5 ya no guarda un número: guarda una fórmula. El escenario «40 alumnos» recuerda 217.5, un número — y aplicar un escenario sobre una celda con fórmula la SUSTITUYE. Se pierde la regla.',
      senal: { control: 'aplicar-escenario' },
      logro: { tipo: 'documento', comprueba: laFormulaSePerdioAlAplicar },
      aprendido:
        'El aviso lo dijo con números: «va a sustituir 1 fórmula por un número». Confirmaste, y B5 dejó de decir =B10/B4 para volver a decir, a secas, 217.5 — la regla que acababas de escribir se perdió. Es la otra cara de la misma ventaja del encargo anterior: aplicar un escenario no pregunta qué había antes, sólo escribe encima.',
    },
    {
      id: 'lo-que-ya-no-hace-falta',
      titulo: 'Lo que ya no hace falta',
      instruccion:
        'Ya se decidió: van los 40, con el camión caro. El escenario de 35 no va a volver a hacer falta. Bórralo: en la lista del panel, pulsa **Borrar** en «35 alumnos».',
      pista: 'Borrar un escenario no toca ninguna celda de la hoja: sólo quita el renglón de la lista.',
      senal: { control: 'borrar-escenario' },
      logro: { tipo: 'documento', comprueba: seBorroElDeTreintaYCinco },
      aprendido:
        'Se fue de la lista, y B4 y B5 no se movieron ni un dígito: borrar un escenario es como tirar una foto vieja, no como borrar la escena que retrató. Sigue quedando «40 alumnos», el que de verdad se va a usar.',
    },
    {
      id: 'que-compra-un-escenario',
      titulo: 'Antes de cerrar: ¿qué compra un escenario?',
      instruccion:
        'Pudiste haber anotado los números en un papel en vez de guardarlos como escenario. ¿Qué te dio el escenario que el papel no te habría dado?',
      pista: 'Piensa en qué pasa cuando pulsas Aplicar, y qué tendrías que hacer tú con un papel para llegar a lo mismo.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Nada: un papel con los números anotados habría servido exactamente igual',
          'Que con un solo clic la HOJA vuelve a ese estado exacto y recalcula todo — un papel sólo tiene los números escritos, no los aplica ni los recalcula',
          'Que un escenario ocupa menos espacio en la pantalla que un papel',
        ],
        correcta: 1,
      },
      aprendido:
        'Un papel se lee; un escenario se APLICA. La diferencia es la misma de toda la clase: una hoja de cálculo no guarda fotos muertas, guarda reglas que se disparan solas. Guardaste el resultado de tantear a mano —Buscar objetivo— y el de comparar sin perder nada —los escenarios—, con la misma disciplina: nunca se tantea sobre el libro de verdad hasta que la respuesta ya se encontró.',
    },
  ],

  cierre:
    'Usaste la hoja al revés por primera vez en toda la sala: le dijiste a Excel el resultado que querías —que la diferencia diera cero— y dejaste que él encontrara el dato, en vez de tantear a mano. Provocaste los dos primeros tropiezos de Buscar objetivo —una celda objetivo que no era fórmula, una celda que se mueve y en realidad es una fórmula— y el tercero, el error número uno: mover una celda que no influye en el objetivo. Comprobaste que hay preguntas sin respuesta —el costo por alumno nunca baja de 60— y que el libro se queda intacto cuando eso pasa. Guardaste dos escenarios con nombre para comparar sin perder nada, viste qué hace guardar dos veces con el mismo nombre, y aplicaste uno sobre una celda que tenía una fórmula propia: la sustituyó por un número, y ahora sabes por qué. Y borraste el que ya no hacía falta, sin tocar ni una celda de la hoja.',
};

export default GUION_Y_SI;
