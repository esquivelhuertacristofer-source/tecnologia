import {
  crudoDe,
  formatoDe,
  guardaUnaRegla,
  libroTieneMacros,
  usaFuncion,
  vale,
} from '@/components/office/motor-hojas/consultas';
import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `of-excel-macros` · «Graba tu primera macro» (bloques 55 · 56).
 *
 * La clase por la que se tomó la decisión fundacional de todo el motor: «un
 * comando es un dato» (§45.6, la cabecera de `comandos.ts`). Sin esa decisión
 * —tomada con dos clases construidas y veintitrés por delante— esta clase no
 * se podría escribir hoy: una macro es literalmente la lista de `Gesto` que
 * ya usa cada botón de la cinta, guardada bajo un nombre.
 *
 * ── EL CASO ──────────────────────────────────────────────────────────────
 *
 * El comité de materiales de la escuela reparte una hoja nueva cada semana con
 * lo que se compró, y alguien tiene que dejarla presentable antes de la
 * junta: encabezados en negrita con fondo, la columna de importes en moneda,
 * y la fila de Total en negrita. Ocho pasos, exactamente los mismos, cada
 * semana. Hoy los das a mano una vez —grabando— y la próxima vez que haga
 * falta, un clic.
 *
 * ── POR QUÉ TODO PASA EN UNA SOLA HOJA ──────────────────────────────────────
 *
 * Cada gesto que graba una macro lleva su HOJA y su CELDA escritas dentro,
 * literales (`comandos.ts`: `conFormato` pone `hoja: c.hoja`, `escribir` pone
 * `hoja: hojaId` — la que estaba activa en el momento de pulsar). Una macro
 * no aprende «la hoja donde estoy» ni «la celda que tengo marcada»: aprende
 * «Reporte!B9», tal cual, para siempre. Es la fidelidad correcta —Excel
 * graba igual, con referencias absolutas por omisión— y es la razón por la
 * que este guion nunca cambia de pestaña de hoja: si lo hiciera, la macro se
 * quedaría anclada a la hoja donde se grabó y «ejecutarla en otra semana»
 * dejaría de significar nada.
 *
 * Por eso «la semana que viene» no es una hoja nueva: son DOS FILAS que
 * llegan tarde y se insertan ANTES del Total (bloques 7 y 12, ya conocidos),
 * en la MISMA hoja. La macro sigue teniendo sus direcciones de siempre
 * —B4:B8 para la moneda, B9 para la fórmula— y **B9 ya no es el Total**: es
 * la primera de las dos filas nuevas. Ejecutar la macro ahí no hace la mitad
 * del trabajo con elegancia: se come el importe de esa fila y lo sustituye
 * por una suma que no es la suya. Es la misma lección que las referencias
 * relativas del bloque 21, con la cara puesta al revés: allí un `$` que
 * faltaba dejaba que una fórmula se moviera SOLA cuando no debía; aquí una
 * dirección grabada se queda QUIETA cuando todo a su alrededor se movió.
 *
 * ── POR QUÉ NINGÚN PREDICADO DEPENDE DE CUÁNTOS GESTOS GRABÓ EL ALUMNO ──────
 *
 * El encargo 2 deja adentro, a propósito, un color equivocado y su
 * corrección: los dos quedan grabados (`ejecutarVarios`, `comandos.ts`, no
 * filtra nada). Si `laMacroQuedoGrabada` comparara `libro.macros.FormatoSemanal`
 * contra una lista exacta de gestos, un alumno que se equivocara UNA VEZ MÁS
 * de color —y lo corrigiera otra vez— dejaría una macro perfectamente
 * funcional que el corrector rechazaría por tener un gesto de más. Por eso
 * todos los predicados de aquí miran el ESTADO FINAL de la hoja —¿quedó bien
 * vestida?, ¿la fórmula da lo que tiene que dar?— y sólo usan
 * `libro.macros?.[nombre]` para confirmar que existe y no está vacía, nunca
 * para contar cuántos pasos tiene.
 */

/* ── el libro: el comité de materiales ───────────────────────────────────── */

export const HOJA = 'r1';
export const NOMBRE_HOJA = 'Reporte';
export const TITULO = 'Comité de materiales · Reporte semanal';

export const FILA_TITULO = 1;
export const FILA_ENCABEZADO = 3;
export const FILA_PRIMERA = 4;
export const FILA_ULTIMA = 8; // cinco conceptos: filas 4-8
export const FILA_TOTAL = 9;

export const NOMBRE_MACRO = 'FormatoSemanal';
export const NOMBRE_MACRO_TITULO = 'TituloFuerte';
export const NOMBRE_BOTON = 'BotonFormato';

/** La paleta de celda de `VentanaHojas.tsx`: Rojo y Amarillo, tal cual. */
export const COLOR_ERROR = '#c00000';
export const COLOR_ENCABEZADO = '#ffc000';

export const CONCEPTOS: Array<{ nombre: string; importe: number }> = [
  { nombre: 'Papel', importe: 250 },
  { nombre: 'Marcadores', importe: 180 },
  { nombre: 'Cartulinas', importe: 90 },
  { nombre: 'Cinta adhesiva', importe: 60 },
  { nombre: 'Globos', importe: 220 },
];

/** Lo que suman los cinco de siempre: 800. Es lo que la macro sabe sumar. */
export const TOTAL_SEMANA = CONCEPTOS.reduce((acc, c) => acc + c.importe, 0);

/** Los dos conceptos que llegan tarde, del encargo «llegan dos más». */
export const CONCEPTO_PINTURA = { nombre: 'Pintura', importe: 150 };
export const CONCEPTO_PAPEL_CREPE = { nombre: 'Papel crepé', importe: 95 };

const suelta = (crudo: string): Celda => ({ crudo });

/**
 * «Comité de materiales · Reporte semanal.xlsx», con los cinco conceptos de
 * siempre sin ni una pinta encima: sin negrita, sin moneda, sin fórmula en el
 * Total. Es una función y no una constante por lo de siempre —«Empezar de
 * cero» tiene que poder volver a fabricarlo entero, macro incluida—.
 */
export function libroDelComite(): Libro {
  const celdas: Record<string, Celda> = {
    [`A${FILA_TITULO}`]: suelta(TITULO),
    A2: suelta('Cada semana llega una lista nueva de compras, y hay que dejarla presentable antes de la junta.'),
    [`A${FILA_ENCABEZADO}`]: suelta('Concepto'),
    [`B${FILA_ENCABEZADO}`]: suelta('Importe'),
    [`A${FILA_TOTAL}`]: suelta('Total'),
  };
  CONCEPTOS.forEach((c, i) => {
    const f = FILA_PRIMERA + i;
    celdas[`A${f}`] = suelta(c.nombre);
    celdas[`B${f}`] = suelta(String(c.importe));
  });
  return { activa: HOJA, nombres: {}, hojas: [{ id: HOJA, nombre: NOMBRE_HOJA, celdas }] };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────── */

const motorDe = (libro: Libro): Motor => crearMotor(libro, RELOJ_DE_LA_CLASE);

function encabezadosBienVestidos(libro: Libro): boolean {
  const a = formatoDe(libro, HOJA, `A${FILA_ENCABEZADO}`);
  const b = formatoDe(libro, HOJA, `B${FILA_ENCABEZADO}`);
  return Boolean(a?.negrita) && a?.colorRelleno === COLOR_ENCABEZADO && Boolean(b?.negrita) && b?.colorRelleno === COLOR_ENCABEZADO;
}

function columnaImporteEnMoneda(libro: Libro): boolean {
  for (let f = FILA_PRIMERA; f <= FILA_ULTIMA; f += 1) {
    if (formatoDe(libro, HOJA, `B${f}`)?.tipo !== 'moneda') return false;
  }
  return true;
}

/** El Total, donde sea que esté hoy la fila: fórmula viva, negrita, y el número que toca. */
function totalBienHecho(libro: Libro, motor: Motor, fila: number, esperado: number): boolean {
  const dir = `B${fila}`;
  return (
    guardaUnaRegla(libro, HOJA, dir) &&
    usaFuncion(libro, HOJA, dir, 'SUMA') &&
    vale(motor, HOJA, dir, esperado) &&
    Boolean(formatoDe(libro, HOJA, dir)?.negrita) &&
    Boolean(formatoDe(libro, HOJA, `A${fila}`)?.negrita)
  );
}

/* — encargo 2: grabar la macro completa, con el error y su arreglo adentro — */

export function laMacroQuedoGrabada(libro: Libro): boolean {
  const motor = motorDe(libro);
  return (
    libroTieneMacros(libro) &&
    (libro.macros?.[NOMBRE_MACRO]?.length ?? 0) > 0 &&
    encabezadosBienVestidos(libro) &&
    columnaImporteEnMoneda(libro) &&
    totalBienHecho(libro, motor, FILA_TOTAL, TOTAL_SEMANA)
  );
}

/* — encargo 5: dos conceptos llegan tarde, se insertan, y la macro se come a Pintura — */

export function laMacroHizoDanoConLosNuevos(libro: Libro): boolean {
  if (!laMacroQuedoGrabada(libro)) return false;
  const motor = motorDe(libro);
  // Los cinco de siempre: la macro los alcanzó igual que la primera vez, sin
  // que insertar filas MÁS ABAJO les cambiara nada.
  if (!columnaImporteEnMoneda(libro)) return false;
  // Pintura, ahora en la fila 9, se comió la fórmula de un Total que no era
  // el suyo: la macro fue a B9 tal cual la grabó, sin enterarse de que ahí ya
  // no vive el Total sino el primero de los dos conceptos nuevos.
  if (crudoDe(libro, HOJA, 'A9') !== CONCEPTO_PINTURA.nombre) return false;
  if (!guardaUnaRegla(libro, HOJA, 'B9')) return false;
  if (!vale(motor, HOJA, 'B9', TOTAL_SEMANA)) return false;
  if (!formatoDe(libro, HOJA, 'B9')?.negrita) return false;
  // Papel crepé, en la fila 10, quedó fuera del alcance de la macro: ni
  // moneda, ni fórmula, ni negrita. Sigue con el número crudo que escribiste.
  if (formatoDe(libro, HOJA, 'B10')?.tipo === 'moneda') return false;
  if (guardaUnaRegla(libro, HOJA, 'B10')) return false;
  if (!vale(motor, HOJA, 'B10', CONCEPTO_PAPEL_CREPE.importe)) return false;
  // Y el Total de verdad —el que se corrió a la fila 11 cuando insertaste—
  // sigue exactamente donde lo dejó la primera grabación: 800, sin los dos
  // conceptos nuevos adentro, aunque la fórmula en sí nunca se rompió.
  return crudoDe(libro, HOJA, 'A11') === 'Total' && totalBienHecho(libro, motor, 11, TOTAL_SEMANA);
}

/* — encargo 7: una segunda macro, corta, sólo para el título — */

export function elTituloQuedoGrabado(libro: Libro): boolean {
  if (!laMacroHizoDanoConLosNuevos(libro)) return false;
  return Boolean(formatoDe(libro, HOJA, `A${FILA_TITULO}`)?.negrita) && (libro.macros?.[NOMBRE_MACRO_TITULO]?.length ?? 0) > 0;
}

/* — encargo 8: asignar la macro grande a un botón — */

export function laMacroQuedoAsignada(libro: Libro): boolean {
  if (!elTituloQuedoGrabado(libro)) return false;
  return libro.botones?.[NOMBRE_BOTON] === NOMBRE_MACRO;
}

/* ── el guion ──────────────────────────────────────────────────────────── */

export const GUION_MACROS: GuionHojas = {
  archivo: 'Comité de materiales · Reporte semanal.xlsx',
  libro: libroDelComite,

  portada: {
    situacion: 'Excel · Grado avanzado · La que graba lo que haces',
    tema: 'Macros: grabar, ejecutar y asignar a un botón',
    objetivo:
      'Vas a grabar tu primer macro: la lista exacta de lo que hiciste, guardada bajo un nombre. La vas a leer en español —paso a paso, con tu error y tu corrección adentro—, vas a comprobar que ejecutarla repite EXACTAMENTE lo que grabaste —ni más, ni menos— y vas a descubrir, jugándolo tú mismo, qué pasa cuando la hoja cambió de forma desde que grabaste. Vas a cerrar entendiendo qué es de verdad un .xlsm y qué significa «habilitar macros».',
    vasAHacer: [
      'Grabar una macro que deja presentable el reporte semanal del comité: negrita, color y moneda',
      'Leer tu propia macro en español, con la equivocación y el arreglo que grabaste tal cual pasaron',
      'Ejecutarla después de que la hoja cambió de forma, y ver con tus propios ojos qué se come',
      'Asignar la macro a un botón, y entender por qué un .xlsm trae órdenes dentro y no sólo datos',
    ],
    requisitos:
      'Las clases anteriores de Excel: fórmulas, referencias ($) e insertar filas (bloques 7 y 12). Hoy no hace falta ninguna función nueva: los botones de grabar, parar, ejecutar, borrar y asignar viven en el panel «Macros», a la derecha.',
    ayuda:
      'El panel «Macros» tiene tres partes: Grabar (nombre + Grabar/Detener), la lista de tus macros —con «Ver los pasos» para leerlas en español— y Asignar a un botón. Negrita, Color de relleno, Moneda e Insertar filas están donde siempre, en Inicio y en Datos.',
  },

  pasos: [
    {
      id: 'piensa-antes-de-grabar',
      titulo: 'Antes de darle a Grabar',
      instruccion:
        'Vas a grabar una macro que hace ocho pasos seguidos: negrita, color, moneda, una fórmula y negrita otra vez. Antes de pulsar Grabar, ¿qué es lo más importante de tener claro?',
      pista: 'Piensa en qué pasa con TODO lo que hagas mientras la grabadora está encendida, lo hayas planeado o no.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Sólo el nombre que le vas a poner: lo demás se puede improvisar sobre la marcha',
          'Qué vas a hacer y en qué orden, porque TODO lo que hagas mientras esté grabando se apunta —lo bueno y lo que corrijas—, sea o no lo que querías',
          'No hace falta pensar nada: siempre se puede editar la macro después, como un documento de Word',
        ],
        correcta: 1,
      },
      aprendido:
        'Eso es. Una grabadora de macros no adivina tu intención: apunta lo que haces, tecla por tecla. Si te equivocas y lo corriges, las DOS cosas quedan en la lista —vas a comprobarlo tú mismo en un momento—. Grabar bien es pensar antes, no arreglar después.',
    },
    {
      id: 'graba-la-semana',
      titulo: 'Grábala, con un error incluido a propósito',
      instruccion:
        'En el panel «Macros», escribe **FormatoSemanal** y pulsa **Grabar**. Ahora, en la hoja: marca **A3:B3** (los encabezados) y pulsa **Negrita**. Pulsa **Color de relleno** y elige **Rojo** —es un error a propósito—. Date cuenta de que un encabezado rojo se ve como una advertencia, no como un título, y corrígelo: pulsa **Color de relleno** otra vez y elige **Amarillo**. Marca **B4:B8** (la columna de Importe) y pulsa **Moneda**. Ponte en **B9** y escribe **=SUMA(B4:B8)**. Por último, marca **A9:B9** (la fila de Total) y pulsa **Negrita**. Cuando termines, pulsa **Detener grabación** en el panel.',
      pista:
        'El orden no tiene que ser exacto, pero las nueve acciones sí tienen que pasar mientras la grabadora está encendida: desde que pulsas Grabar hasta que pulsas Detener.',
      logro: { tipo: 'documento', comprueba: laMacroQuedoGrabada },
      aprendido:
        'Ocho pasos, hechos una vez a mano —y un noveno, el error del rojo, que no pediste pero grabaste igual—. La hoja quedó presentable: encabezados en negrita y amarillo, los importes en moneda, y el Total en negrita con su fórmula viva. Y quedó algo más, guardado con un nombre: «FormatoSemanal». La próxima vez no vas a repetir nada de esto a mano.',
    },
    {
      id: 'lee-tu-macro',
      titulo: 'Ábrela y léela',
      instruccion:
        'En el panel, busca tu macro «FormatoSemanal» y pulsa **Ver los pasos**. Vas a ver la lista completa, en español, en el orden en que pasó —incluido el rojo y su corrección—. Léela con calma. Cuando pusiste rojo por error y lo corregiste a amarillo antes de parar, ¿qué se guardó en la macro?',
      pista: 'Piensa en si la grabadora sabe distinguir «lo que querías» de «lo que hiciste», o sólo apunta lo segundo.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Sólo el amarillo: el rojo desapareció de la lista en cuanto lo corregiste',
          'Las dos: el color equivocado Y la corrección, una detrás de la otra, en el orden en que pasaron de verdad',
          'Ninguno de los dos: los cambios de color no se graban, sólo el texto y las fórmulas',
        ],
        correcta: 1,
      },
      aprendido:
        'Las dos, tal cual las viste en la lista. Una macro no es lo que QUERÍAS hacer: es lo que HICISTE, completo, sin editar. Por eso una macro no es magia —es un cuaderno—, y por eso grabar bien es pensar antes de pulsar Grabar, no confiar en poder «limpiarla» después.',
    },
    {
      id: 'si-la-ejecutaras-ahora',
      titulo: 'Antes de probarla: una predicción',
      instruccion:
        'La hoja ya quedó exactamente como la macro la dejó. Si ahora mismo pulsaras **Ejecutar** sobre «FormatoSemanal», sin haber cambiado nada, ¿qué esperas que pase?',
      pista: 'Piensa en qué celdas exactas visita la macro, y en qué tienen puesto esas celdas ahora mismo.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Nada visible: vuelve a poner exactamente lo mismo que ya hay, porque repite las mismas celdas de siempre',
          'Se duplica el formato y la fila se ve más oscura',
          'Excel se niega, porque no se puede ejecutar una macro dos veces sobre la misma hoja',
        ],
        correcta: 0,
      },
      aprendido:
        'Nada visible, y es lo que la hace confiable: repetible, siempre la misma. Guárdala así de fiable en la cabeza, porque el siguiente encargo va a cambiarle el terreno por debajo sin avisarle a la macro.',
    },
    {
      id: 'llegan-dos-conceptos-mas',
      titulo: 'Llegan dos conceptos más, tarde',
      instruccion:
        'Resulta que faltaban dos compras por anotar: **Pintura** (150) y **Papel crepé** (95), y hay que meterlas ANTES del Total, no después. Marca **A9:A10** y pulsa **Insertar filas**. En la fila 9 escribe **Pintura** (columna A) y **150** (columna B); en la fila 10, **Papel crepé** y **95**. Ahora, en vez de repetir los ocho pasos a mano, pulsa **Ejecutar** sobre «FormatoSemanal» y mira qué pasa en la fila de Pintura.',
      pista:
        'Insertar filas empuja el Total hacia abajo, a la fila 11 — pero la macro no lo sabe: sigue yendo, tal cual la grabaste, a B4:B8 y a B9.',
      senal: { control: 'insertar-fila,ejecutar-macro' },
      logro: { tipo: 'documento', comprueba: laMacroHizoDanoConLosNuevos },
      aprendido:
        'Mira la fila 9: dice «Pintura», y al lado ya no dice 150 — dice **800**, en negrita, la suma de los cinco de siempre. La macro fue exactamente a B9, como la grabaste, y esa celda ya no era el Total: era el importe de Pintura, y se lo comió. Papel crepé, en la fila 10, ni se enteró: sigue con su 95 sin moneda, porque la macro nunca llega tan abajo. Y el Total de verdad, el que se corrió a la fila 11, sigue diciendo 800 —sin las dos compras nuevas adentro—, porque la macro tampoco llegó hasta ahí. **Una macro repite lo que hiciste, no lo que querías.**',
    },
    {
      id: 'por-que-salio-mal',
      titulo: '¿Por qué se comió justo esa celda?',
      instruccion: 'Antes de seguir: ¿por qué la macro fue a estropear la fila de Pintura, y no la del Total de verdad?',
      pista: 'Piensa en la clase de las referencias, y en qué significa que una celda esté fija.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque Excel elige al azar dónde aplicar una macro cuando la hoja creció',
          'Porque la macro grabó direcciones fijas —B4:B8, B9—, igual que un `$`, y esas direcciones no se enteran de que la hoja cambió de forma después de grabarlas',
          'Porque insertar filas siempre rompe cualquier macro que exista en el libro',
        ],
        correcta: 1,
      },
      aprendido:
        'Ésa es la conexión con lo que ya sabías: un `$` fija una referencia para que NO se mueva al copiar una fórmula. Una macro graba TODAS sus direcciones fijas, siempre, sin que exista un `$` que lo pida. Es útil cuando la hoja no cambia de forma —y peligroso el día que sí cambia—, y ahora ya sabes distinguir uno del otro.',
    },
    {
      id: 'graba-el-titulo',
      titulo: 'Una macro corta, para el título',
      instruccion:
        'Vas a dejar lista una segunda macro, mucho más corta. En el panel, escribe **TituloFuerte** y pulsa **Grabar**. En la hoja, marca **A1** —el título del reporte— y pulsa **Negrita**. Pulsa **Detener grabación**.',
      pista: 'Sólo hace falta una acción entre Grabar y Detener: no hace falta tocar nada más de la hoja.',
      logro: { tipo: 'documento', comprueba: elTituloQuedoGrabado },
      aprendido:
        'Una macro no tiene que ser larga para servir: ésta tiene un solo paso, y aun así te ahorra abrir Inicio → Fuente cada vez que quieras resaltar un título. Ya tienes dos macros guardadas en el mismo libro, cada una con su nombre.',
    },
    {
      id: 'asigna-a-un-boton',
      titulo: 'Ponle un botón a la que de verdad usas cada semana',
      instruccion:
        'La que vas a usar todas las semanas es «FormatoSemanal», no la del título. En «Asignar a un botón», escribe **BotonFormato**, elige **FormatoSemanal** en la lista y pulsa **Asignar**.',
      pista: 'El botón es sólo un nombre —esta hoja no tiene formas ni dibujos—: lo que importa es que quede apuntando a la macro correcta.',
      senal: { control: 'asignar-macro' },
      logro: { tipo: 'documento', comprueba: laMacroQuedoAsignada },
      aprendido:
        'Listo: «BotonFormato» ahora dispara «FormatoSemanal». El botón no se queda con una copia de la macro —guarda su NOMBRE—, así que si algún día la vuelves a grabar distinta, el botón obedece a la nueva sin que nadie lo toque a él.',
    },
    {
      id: 'por-que-xlsm',
      titulo: 'Bloque 56 — Un archivo que trae órdenes',
      instruccion:
        'Antes de guardar: este libro ya tiene dos macros adentro. ¿Por qué Excel no deja guardarlo como un `.xlsx` normal, y pide guardarlo como `.xlsm`?',
      pista: 'Piensa en la diferencia entre un archivo que sólo trae datos y uno que trae, además, algo que se puede EJECUTAR.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque los .xlsm pesan menos y caben mejor en un correo',
          'Porque un .xlsx sólo promete datos y fórmulas; un archivo que trae ÓRDENES —instrucciones que se van a ejecutar— tiene que decirlo desde el nombre: .xlsm',
          'Es sólo una costumbre de Excel: técnicamente el .xlsx también las guarda igual de bien',
        ],
        correcta: 1,
      },
      aprendido:
        'Ésa es la diferencia real, y no es cosmética: un `.xlsm` no es «un Excel con un candado» —es un archivo que trae, adentro, instrucciones que se van a ejecutar solas—. El nombre existe para que quien lo reciba sepa, antes de abrirlo, que no es sólo una tabla.',
    },
    {
      id: 'si-lo-guardas-como-xlsx',
      titulo: 'Y si te equivocas de formato',
      instruccion:
        'Imagina que guardas este mismo libro como `.xlsx` por despiste, sin fijarte en el aviso. La próxima vez que lo abras, ¿qué pasó con «FormatoSemanal» y «TituloFuerte»?',
      pista: 'Un .xlsx no tiene dónde guardar una lista de órdenes: piensa qué le pasa a algo que no cabe.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Siguen ahí: un .xlsx también guarda macros, sólo que con otra extensión',
          'Excel avisa que no puede guardar el proyecto de macros en ese formato, y si aceptas guardarlo así, las dos macros se pierden',
          'Se convierten solas en fórmulas normales, sin que se note la diferencia',
        ],
        correcta: 1,
      },
      aprendido:
        'Se pierden, y Excel te lo avisa ANTES de que pase —el mismo estilo de aviso que ya viste en esta sala más de una vez—. Guardar como `.xlsm` no es un trámite: es lo único que asegura que la próxima semana el botón siga funcionando.',
    },
    {
      id: 'habilitar-contenido',
      titulo: 'La barra amarilla',
      instruccion:
        'Última pregunta de la clase. Te llega por correo un `.xlsm` de alguien que no conoces, y Excel pone una barra amarilla: «Se han deshabilitado las macros». ¿Qué significa exactamente pulsar «Habilitar contenido»?',
      pista: 'Piensa en qué le estás dando permiso de hacer al archivo, no en si el archivo «se ve bien».',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Nada importante: sólo deja ver mejor los colores y las fórmulas',
          'Le estás diciendo a Excel: deja que este archivo EJECUTE lo que trae dentro, aunque no sepas qué es — por eso no se hace con un archivo de quien no conoces',
          'Activa un antivirus que revisa el archivo antes de dejarlo abrir',
        ],
        correcta: 1,
      },
      aprendido:
        'Eso, sin dramatismo y sin inventar nada: «habilitar macros» es dejar que el archivo ejecute lo que trae, punto. Por eso Excel pregunta, por eso existe la barra amarilla, y por eso un `.xlsm` que llegó de quien no conoces se queda sin habilitar. No hace falta un antivirus para entenderlo: basta con recordar lo que tú mismo hiciste hoy —grabaste órdenes que, al ejecutarlas, cambiaron la hoja sola.',
    },
  ],

  cierre:
    'Grabaste tu primera macro —«FormatoSemanal»— haciendo a mano, una vez, los ocho pasos que dejan presentable el reporte semanal del comité, con un color equivocado y su corrección adentro. La leíste en español y viste que una macro no es lo que querías hacer: es lo que hiciste, completo. Comprobaste que ejecutarla repite exactamente esas mismas celdas, y descubriste, jugándolo tú mismo, qué pasa cuando la hoja cambió de forma desde que grabaste: la macro se comió el importe de un concepto nuevo en vez de sumarlo. Grabaste una segunda macro, corta, y asignaste la que de verdad usas cada semana a un botón con nombre. Y cerraste entendiendo qué es de verdad un `.xlsm` —un archivo que trae órdenes, no sólo datos— y qué significa «habilitar macros»: dejar que ese archivo ejecute lo que trae, y por qué eso no se hace con un archivo de quien no conoces.',
};

export default GUION_MACROS;
