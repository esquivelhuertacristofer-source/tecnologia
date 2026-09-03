import { guardaUnaRegla, usaFuncion, vale } from '@/components/office/motor-hojas/consultas';
import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `of-excel-auditoria` · «Por qué esta celda dice eso» (bloques 47 · 48).
 *
 * Segunda clase exclusiva del grado Avanzado de Tecnia Hojas, entre
 * `of-excel-datos-limpios` (44-46) y `of-excel-consolida-y-protege` (53-54).
 *
 * ── EL CASO ──────────────────────────────────────────────────────────────
 *
 * La cooperativa escolar heredó su hoja de corte de caja del tesorero del año
 * pasado. En la hoja «Corte», la Ganancia neta (B5) no enseña un número: enseña
 * **#¡REF!**. La lección entera del bloque 47 es que ese error no está donde se
 * ve —B5 sólo hace `=B3-B4`, sin ningún misterio— sino tres celdas río arriba,
 * en una fórmula que quedó apuntando a una hoja («Bodega») que el tesorero
 * anterior borró después de archivar el inventario. **Rastrear precedentes**
 * (`flechasDeAuditoria`, `consultas.ts`) es cómo se remonta ese río sin adivinar.
 *
 * De paso, la hoja «Ventas» trae los otros dos errores del bloque: **#¡DIV/0!**
 * en el «Precio real» de Agua —vendió 0 unidades ese día, así que FALTA un dato
 * para dividir, no sobra nada— y **#¿NOMBRE?** en el «Con IVA» de Galletas —la
 * fórmula escribió `IVAA` en vez de `IVA`, el nombre de rango del bloque 22—.
 * Los tres se leen como lo que son: pistas, no fallos del programa.
 *
 * **Rastrear dependientes** contesta la otra pregunta, la que evita romper
 * cosas: la Cantidad de Agua (B6) alimenta a tres celdas directas —Importe,
 * Precio real y el total de unidades—, y eso es lo que hay que preguntarse
 * ANTES de tocar un dato heredado, no después.
 *
 * ── EL CORAZÓN MORAL: EL BLOQUE 48 ──────────────────────────────────────────
 *
 * `SI.ERROR` hace que una hoja se vea limpia, y eso es exactamente lo peligroso:
 * tapar el #¡DIV/0! de Agua con un cero convierte «no vendimos nada» en «lo
 * vendimos gratis», y quien lea la hoja después ya no puede distinguir las dos.
 * Por eso el encargo 9 hace tapar el error A LO BRUTO, a propósito —la misma
 * disciplina de «jugar mal» que ya usó `of-excel-consolida-y-protege» con
 * proteger sin desbloquear—, y sólo después de sentir el daño se corrige: un
 * texto que EXPLICA («Sin ventas») en vez de un número que ESCONDE. Y el error
 * de Gastos —una referencia rota, no un dato que falte— no se tapa con
 * SI.ERROR en ningún momento: se REPARA, apuntando a donde el tesorero
 * anterior guardó el dato real antes de borrar la hoja. Dos errores, dos
 * arreglos distintos, y la clase entera está pensada para que el alumno note
 * la diferencia por sí mismo.
 *
 * ── POR QUÉ EL RASTRO NO DEJA HUELLA EN EL LIBRO ────────────────────────────
 *
 * Rastrear precedentes y dependientes sólo LEE el grafo del motor
 * (`SOLO_VENTANA`, `cinta.ts`): no hay nada que un `comprueba(libro)` pueda
 * confirmar, porque no cambia ni una celda. Por eso los seis encargos que
 * pulsan esos dos botones usan `{ tipo: 'control' }` en vez de `documento` —la
 * misma puerta que abrió `../../n4/estudio` para «lo que no deja rastro en el
 * documento»—, y la comprensión de lo que las flechas enseñaron se queda
 * escrita en el `aprendido`, no en una pregunta de opción múltiple aparte: con
 * seis encargos de rastreo ya en la clase, una pregunta más por cada uno
 * habría duplicado la mitad de la lección sin enseñar nada nuevo.
 */

/* ── el libro: la cooperativa escolar ──────────────────────────────────── */

export const VE = 've';
export const CO = 'co';

export const NOMBRE_VE = 'Ventas';
export const NOMBRE_CO = 'Corte';

export const TITULO = 'Cooperativa escolar · Corte de caja';

/** Las columnas de la tabla de Ventas, en el orden en que se leen. */
export const COL = {
  producto: 'A',
  cantidad: 'B',
  precio: 'C',
  importe: 'D',
  precioReal: 'E',
  conIva: 'F',
} as const;

export const FILA_PRIMERA = 4;
export const FILA_PALETAS = FILA_PRIMERA; // 4
export const FILA_GALLETAS = FILA_PRIMERA + 1; // 5
export const FILA_AGUA = FILA_PRIMERA + 2; // 6
export const FILA_TOTAL = FILA_PRIMERA + 3; // 7

/** `E6`: el «Precio real» de Agua, el #¡DIV/0! del bloque 47 y el corazón del 48. */
const CELDA_PRECIO_REAL_AGUA = `${COL.precioReal}${FILA_AGUA}`;

export const TASA_IVA = 0.16;
/** Lo que el tesorero anterior archivó a mano antes de borrar la hoja Bodega. */
export const GASTOS_REALES = 380;
/** `Ventas!D7`: 200 (Paletas) + 200 (Galletas) + 0 (Agua). */
export const INGRESOS_TOTALES = 400;
export const GANANCIA_NETA = INGRESOS_TOTALES - GASTOS_REALES; // 20

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * La hoja Ventas: el registro que el tesorero anterior llevó producto por
 * producto, con sus tres defectos ya puestos —el `#¡DIV/0!` de Agua y el
 * `#¿NOMBRE?` de Galletas viven aquí— y el dato archivado (`I5`) que hace
 * falta para reparar Gastos en el encargo final.
 */
function hojaVentas(): Record<string, Celda> {
  return {
    A1: fuerte(`${TITULO} · Ventas`),
    A2: suelta('El tesorero anterior llevó aquí el registro de lo vendido. No lo has tocado todavía.'),
    A3: fuerte('Producto'),
    B3: fuerte('Cantidad'),
    C3: fuerte('Precio'),
    D3: fuerte('Importe'),
    E3: fuerte('Precio real'),
    F3: fuerte('Con IVA'),
    A4: suelta('Paletas'),
    B4: suelta('40'),
    C4: suelta('5'),
    D4: suelta('=B4*C4'),
    E4: suelta('=D4/B4'),
    F4: suelta('=D4*(1+IVA)'),
    A5: suelta('Galletas'),
    B5: suelta('25'),
    C5: suelta('8'),
    D5: suelta('=B5*C5'),
    E5: suelta('=D5/B5'),
    // La trampa del #¿NOMBRE?: IVAA en vez de IVA, el nombre de rango del bloque 22.
    F5: suelta('=D5*(1+IVAA)'),
    A6: suelta('Agua'),
    B6: suelta('0'),
    C6: suelta('10'),
    D6: suelta('=B6*C6'),
    // La trampa del #¡DIV/0!: 0 unidades vendidas, no un dato que sobre.
    E6: suelta('=D6/B6'),
    F6: suelta('=D6*(1+IVA)'),
    A7: fuerte('Total'),
    B7: fuerte('=SUMA(B4:B6)'),
    D7: fuerte('=SUMA(D4:D6)'),
    H3: fuerte('Tasa de IVA'),
    I3: suelta(String(TASA_IVA)),
    H5: fuerte('Gastos fijos (archivado antes de borrar Bodega)'),
    I5: suelta(String(GASTOS_REALES)),
  };
}

/**
 * La hoja Corte: el resumen que no cuadra. `B4` apunta a `Bodega!D2` —una
 * hoja que ya no existe en este libro—, así que `B4` y, por contagio, `B5`
 * enseñan `#¡REF!` desde el primer segundo.
 */
function hojaCorte(): Record<string, Celda> {
  return {
    A1: fuerte(`${TITULO} · Resumen`),
    A2: suelta('Esto es lo que el tesorero anterior dejó armado. Hoy te toca a ti entender por qué no cuadra.'),
    A3: fuerte('Ingresos'),
    B3: suelta(`=${NOMBRE_VE}!D7`),
    A4: fuerte('Gastos'),
    B4: suelta('=Bodega!D2'),
    A5: fuerte('Ganancia neta'),
    B5: suelta('=B3-B4'),
  };
}

/**
 * «Cooperativa escolar · Corte de caja.xlsx», con el número absurdo ya
 * enseñando desde que se abre. Es una función y no una constante por lo de
 * siempre: «Empezar de cero» tiene que poder volver a fabricarlo entero.
 */
export function libroDeLaCooperativa(): Libro {
  return {
    activa: CO,
    nombres: { IVA: `${VE}!I3` },
    hojas: [
      { id: VE, nombre: NOMBRE_VE, celdas: hojaVentas() },
      { id: CO, nombre: NOMBRE_CO, celdas: hojaCorte() },
    ],
  };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────── */

const motorDe = (libro: Libro): Motor => crearMotor(libro, RELOJ_DE_LA_CLASE);

/* — encargo 9: tapar a lo bruto, a propósito («jugar mal») — */

export function seTapoConCeroSinPensar(libro: Libro): boolean {
  const motor = motorDe(libro);
  return (
    guardaUnaRegla(libro, VE, CELDA_PRECIO_REAL_AGUA) &&
    usaFuncion(libro, VE, CELDA_PRECIO_REAL_AGUA, 'SI.ERROR') &&
    vale(motor, VE, CELDA_PRECIO_REAL_AGUA, 0)
  );
}

/**
 * — encargo 11: el arreglo bueno —
 *
 * A propósito NO acepta el cero del encargo 9 como una respuesta válida: un
 * `SI.ERROR` que devuelve 0 donde debería explicar con texto es justo el
 * defecto que este bloque existe para desmontar (jugando mal a propósito, la
 * regla de la casa). Sólo un texto cierra el encargo.
 */
export function elPrecioRealQuedoBienExplicado(libro: Libro): boolean {
  const motor = motorDe(libro);
  return (
    guardaUnaRegla(libro, VE, CELDA_PRECIO_REAL_AGUA) &&
    usaFuncion(libro, VE, CELDA_PRECIO_REAL_AGUA, 'SI.ERROR') &&
    vale(motor, VE, CELDA_PRECIO_REAL_AGUA, 'Sin ventas')
  );
}

/**
 * — encargo 12: la causa real, reparada y no tapada —
 *
 * Encadena con `elPrecioRealQuedoBienExplicado` porque el cierre de la clase
 * exige las dos cosas a la vez: el error que SÍ había que explicar (Agua),
 * explicado, y el error que había que REPARAR (Gastos), reparado. Ninguna de
 * las dos celdas se vuelve a tocar después de este punto, así que —al revés
 * que el encadenado que `of-excel-datos-limpios» tuvo que deshacer— no hay
 * ningún encargo posterior que pueda invalidar esta comprobación.
 */
export function laCausaQuedoReparada(libro: Libro): boolean {
  if (!elPrecioRealQuedoBienExplicado(libro)) return false;
  const motor = motorDe(libro);
  return (
    guardaUnaRegla(libro, CO, 'B4') &&
    vale(motor, CO, 'B4', GASTOS_REALES) &&
    vale(motor, CO, 'B5', GANANCIA_NETA)
  );
}

/* ── el guion ──────────────────────────────────────────────────────────── */

export const GUION_AUDITORIA: GuionHojas = {
  archivo: 'Cooperativa escolar · Corte de caja.xlsx',
  libro: libroDeLaCooperativa,

  portada: {
    situacion: 'Excel · Grado avanzado · La que sigue el rastro',
    tema: 'Auditoría de fórmulas: por qué esta celda dice eso',
    objetivo:
      'Vas a heredar una hoja que ya no cuadra —el corte de caja de la cooperativa escolar— y vas a averiguar por qué, remontando el rastro de fórmula en fórmula en vez de adivinar. Y vas a aprender la diferencia entre TAPAR un error y ENTENDERLO: SI.ERROR puede esconder un problema real detrás de un cero que parece inofensivo.',
    vasAHacer: [
      'Leer #¡REF!, #¡DIV/0! y #¿NOMBRE? como lo que son: pistas, no un programa roto',
      'Rastrear precedentes para remontar el río hasta la fórmula que de verdad está rota',
      'Rastrear dependientes para saber, antes de tocar un dato, a quién le afecta',
      'Tapar un error con SI.ERROR a lo bruto, sentir el daño, y luego hacerlo bien',
    ],
    requisitos:
      'Las clases anteriores de Excel: escribir fórmulas, referencias entre hojas (Hoja!Celda) y SUMA. Hoy no hace falta ninguna función nueva más que SI.ERROR, que aparece al final.',
    ayuda:
      'Rastrear precedentes y Rastrear dependientes viven en Fórmulas → Auditoría de fórmulas: seleccionas una celda y pulsas el botón, sin ningún cuadro que llenar. SI.ERROR se escribe directo en la barra de fórmulas, como cualquier otra función.',
  },

  pasos: [
    {
      id: 'el-numero-absurdo',
      titulo: 'El número que no tiene sentido',
      instruccion:
        'El tesorero anterior de la cooperativa escolar dejó armado el corte de caja, pero algo no cuadra. Estás en la hoja **Corte**: mira **B5**, «Ganancia neta». En vez de un número en pesos, la celda enseña **#¡REF!**. Antes de tocar nada, contesta: en general, ¿qué significa ese error?',
      pista: 'No es un número raro ni un dato que falte: fíjate en las tres letras REF y piensa de qué son abreviatura.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Algo a lo que la fórmula apuntaba ya no existe: se borró una celda, una fila o una hoja entera',
          'A la fórmula le faltó escribir un número en algún hueco',
          'El nombre de una función se escribió mal, por ejemplo SUM en vez de SUMA',
        ],
        correcta: 0,
      },
      aprendido:
        '**REF** es de «referencia». #¡REF! no dice «este número está mal calculado»: dice que la fórmula apunta a un sitio que YA NO EXISTE. Y aquí viene lo importante: B5 sólo hace `=B3-B4`, una resta sin ningún misterio. El error no nace ahí. Para encontrar dónde nace de verdad, hay que remontar el río: rastrear precedentes.',
    },
    {
      id: 'rastrear-la-ganancia',
      titulo: 'Remonta el río: ¿de qué depende B5?',
      instruccion:
        'Selecciona **B5** y pulsa **Rastrear precedentes**, en Fórmulas → Auditoría de fórmulas. Van a aparecer flechas hacia las celdas de las que depende.',
      pista: 'El botón está en la pestaña Fórmulas, en el grupo «Auditoría de fórmulas», junto al de Rastrear dependientes.',
      senal: { control: 'rastrear-precedentes' },
      /* `celda` añadida el 1-sep-2026 (auditoría): sin ella bastaba con pulsar
         el botón desde cualquier sitio —una celda vacía valía— y estos cinco
         encargos, que son el corazón de la clase, se cerraban sin haber
         seleccionado nunca la celda que enseña la lección. */
      logro: { tipo: 'control', control: 'rastrear-precedentes', celda: 'B5', hoja: CO },
      aprendido:
        'Salieron dos flechas: una desde **B3** (Ingresos) y otra desde **B4** (Gastos). B5 no calcula nada raro —resta una de la otra—, así que si algo está roto, tiene que estar en una de esas dos. Mira las dos celdas: B3 enseña 400, un número normal. B4 enseña el mismo #¡REF! que ya viste en B5. Ahí está: la Ganancia neta no está mal calculada, está CONTAMINADA por lo que le llega de Gastos.',
    },
    {
      id: 'rastrear-los-ingresos',
      titulo: 'Sigue el rastro también por el lado que sí funciona',
      instruccion:
        'Antes de ir a arreglar Gastos, mira el otro lado. Selecciona **B3** (Ingresos) y pulsa **Rastrear precedentes** otra vez.',
      pista: 'Mismo botón, celda distinta. B3 sí es una fórmula: tiene que depender de algo.',
      senal: { control: 'rastrear-precedentes' },
      /* `celda` añadida el 1-sep-2026 (auditoría): sin ella bastaba con pulsar
         el botón desde cualquier sitio —una celda vacía valía— y estos cinco
         encargos, que son el corazón de la clase, se cerraban sin haber
         seleccionado nunca la celda que enseña la lección. */
      logro: { tipo: 'control', control: 'rastrear-precedentes', celda: 'B3', hoja: CO },
      aprendido:
        'Esta vez no salió ninguna flecha dentro de esta hoja: salió un rótulo, **↙ Ventas**. B3 SÍ tiene un precedente —el total de la hoja Ventas—, sólo que vive en otra hoja, y esta rejilla no tiene dónde dibujar una flecha hacia una celda que no está aquí. No es un error: es la señal de que el rastro sigue, sólo que hay que cambiar de hoja para continuarlo.',
    },
    {
      id: 'rastrear-los-gastos',
      titulo: 'Ahora sí: el lado que está roto',
      instruccion: 'Selecciona **B4** (Gastos) y pulsa **Rastrear precedentes**.',
      pista: 'B4 es la celda que ya enseña #¡REF!. Averigua de qué fórmula sale ese error.',
      senal: { control: 'rastrear-precedentes' },
      /* `celda` añadida el 1-sep-2026 (auditoría): sin ella bastaba con pulsar
         el botón desde cualquier sitio —una celda vacía valía— y estos cinco
         encargos, que son el corazón de la clase, se cerraban sin haber
         seleccionado nunca la celda que enseña la lección. */
      logro: { tipo: 'control', control: 'rastrear-precedentes', celda: 'B4', hoja: CO },
      aprendido:
        'Esta vez no salió NADA: ni una flecha, ni el rótulo de «otra hoja». B4 dice `=Bodega!D2`, y Bodega es una hoja que el tesorero anterior borró después de archivar el inventario. No es el mismo caso que Ingresos: ahí el precedente vivía en una hoja real, sólo que no era ésta. Aquí el precedente no vive en ninguna parte —la fórmula apunta a la nada—, y por eso #¡REF! dice exactamente eso: algo a lo que se apuntaba ya no existe.',
    },
    {
      id: 'rastrear-celda-sin-formula',
      titulo: 'Un tercer «no pasa nada», por un motivo distinto',
      instruccion:
        'Ve a la hoja **Ventas** y selecciona **A4** («Paletas», un texto escrito a mano). Pulsa **Rastrear precedentes**.',
      pista: 'A4 no tiene el símbolo `=` delante. Piensa en lo que eso significa desde el bloque 13.',
      // `hoja:ve`, no el botón: es la misma excepción que ya documenta
      // `chrome/ganchos.ts` (`esDesvio`) y que ya usa `of-excel-consolida-y-
      // protege` — una señal de hoja SÍ se cumple pulsando la lengüeta, y
      // lo que venga después (el botón) deja de contar como desvío. Con la
      // señal puesta en el botón, cambiar de hoja se leía como un desvío y
      // el encargo no se podía completar nunca.
      senal: { control: 'hoja:ve' },
      /* `celda` añadida el 1-sep-2026 (auditoría): sin ella bastaba con pulsar
         el botón desde cualquier sitio —una celda vacía valía— y estos cinco
         encargos, que son el corazón de la clase, se cerraban sin haber
         seleccionado nunca la celda que enseña la lección. */
      logro: { tipo: 'control', control: 'rastrear-precedentes', celda: 'A4', hoja: VE },
      aprendido:
        'Otra vez nada, y ésta es la tercera razón distinta para lo mismo: A4 no es una fórmula rota, es un texto escrito a mano. No guarda ninguna regla, así que no hay de dónde tirar una flecha. Tres veces sin flecha visible, tres motivos: una fórmula que apunta a la nada (Gastos), un precedente real pero en otra hoja (Ingresos), y una celda que nunca fue una fórmula (ésta). Lo único que las distingue es leer lo que la celda tiene dentro.',
    },
    {
      id: 'lee-el-div0',
      titulo: 'El segundo error de la hoja',
      instruccion:
        'Sigue en Ventas. Mira **E6**, el «Precio real» de Agua: también enseña un error, distinto al de Gastos. ¿Qué pasó?',
      pista: 'Mira la columna Cantidad de esa misma fila antes de contestar.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Es #¡DIV/0!: la fórmula divide el importe entre la cantidad vendida, y ese día Agua vendió 0 unidades',
          'Es #¡DIV/0!: a la celda le faltó escribir el precio del producto',
          'Es #¡DIV/0!: alguien borró la columna de al lado sin querer',
        ],
        correcta: 0,
      },
      aprendido:
        '#¡DIV/0! no dice que sobre nada: dice que FALTA un dato para poder hacer la cuenta. `=D6/B6` necesita cuántas unidades se vendieron para calcular un precio por unidad, y ese día se vendieron cero. No es un descuido de quien escribió la fórmula: es la hoja avisando, con toda razón, de que ahí no hay con qué dividir.',
    },
    {
      id: 'lee-el-nombre',
      titulo: 'El tercer error de la hoja',
      instruccion: 'Un error más, en la misma hoja: mira **F5**, «Con IVA» de Galletas. ¿Qué pasó ahí?',
      pista: 'Compárala con F4, la misma fórmula un renglón arriba, que sí funciona.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Es #¿NOMBRE?: la fórmula escribió mal el nombre de la tasa de IVA',
          'Es #¿NOMBRE?: el producto de esa fila no tiene nombre capturado',
          'Es #¿NOMBRE?: le falta un paréntesis a la fórmula',
        ],
        correcta: 0,
      },
      aprendido:
        '#¿NOMBRE? dice que hay una palabra que Excel no reconoce. F4 escribe `IVA` —el nombre que sí está definido, apuntando a la tasa en Ventas!I3— y F5 escribe `IVAA`, con una letra de más. Para la hoja no es un despiste de una letra: es una palabra que simplemente no existe en ningún lado, la misma trampa del bloque 22 con los rangos con nombre.',
    },
    {
      id: 'rastrear-quien-usa-agua',
      titulo: 'La otra pregunta: si cambio esto, ¿a quién le afecta?',
      instruccion:
        'Selecciona **B6** (la Cantidad de Agua, en 0) y pulsa **Rastrear dependientes** —el botón de al lado, la flecha en el otro sentido—. Antes de cambiar un dato heredado, ésta es la pregunta que hay que hacerse.',
      pista: 'Rastrear dependientes contesta lo contrario que Rastrear precedentes: no de dónde viene el dato, sino a quién alimenta.',
      senal: { control: 'rastrear-dependientes' },
      /* `celda` añadida el 1-sep-2026 (auditoría): sin ella bastaba con pulsar
         el botón desde cualquier sitio —una celda vacía valía— y estos cinco
         encargos, que son el corazón de la clase, se cerraban sin haber
         seleccionado nunca la celda que enseña la lección. */
      logro: { tipo: 'control', control: 'rastrear-dependientes', celda: 'B6', hoja: VE },
      aprendido:
        'Salieron tres flechas, no una: hacia **D6** (Importe), **E6** (Precio real, el del #¡DIV/0!) y **B7** (el total de unidades vendidas). Las tres leen ese 0 directamente. Si el sábado sí se vende agua y alguien actualiza B6, esas tres celdas se mueven solas. Rastrear dependientes es la pregunta que evita romper cosas antes de tocar un dato que otros ya están usando.',
    },
    {
      id: 'tapa-con-cero',
      titulo: 'Haz lo que casi todo el mundo hace primero',
      instruccion:
        'En **E6** cambia la fórmula para que, en vez del error, se vea un cero bien portado: escribe **=SI.ERROR(D6/B6,0)**.',
      pista: 'SI.ERROR lleva dos huecos: la cuenta de siempre, y lo que se enseña SI esa cuenta da error.',
      senal: { control: 'celda:E6' },
      logro: { tipo: 'documento', comprueba: seTapoConCeroSinPensar },
      aprendido:
        'Ya no se ve ningún error: E6 enseña 0, limpio, como cualquier otra celda de la columna. Y ahí está el peligro entero de este bloque: 0 no es lo mismo que «ese día no vendimos nada». Si alguien promedia esta columna, o decide con ella si hay que pedir más agua, va a leer «se vendió a $0» — una mentira que antes, con el error a la vista, no se podía colar.',
    },
    {
      id: 'que-perdiste-al-tapar',
      titulo: 'Antes de seguir: ¿qué perdiste?',
      instruccion: '¿Qué información EXACTA se perdió al cambiar el #¡DIV/0! por un 0?',
      pista: 'Piensa en las dos frases: «no vendimos nada» y «lo vendimos gratis». ¿Se ven igual ahora?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'La diferencia entre «no vendimos nada» y «lo vendimos gratis»: las dos se ven idénticas ahora, en 0',
          'Ninguna: 0 y #¡DIV/0! significan lo mismo para quien lee la hoja',
          'El número de unidades vendidas, que ya no se puede recuperar',
        ],
        correcta: 0,
      },
      aprendido:
        'Exacto. Y no se perdió ningún dato —B6 sigue en 0, ahí está—: lo que se perdió es la SEÑAL de que había algo que revisar. Por eso el bloque 48 no es «nunca uses SI.ERROR»: es «no lo uses antes de entender qué error estás tapando».',
    },
    {
      id: 'arreglalo-bien',
      titulo: 'Ahora sí: mirar, entender, y recién entonces tapar',
      instruccion:
        'Corrígelo de verdad. En **E6**, cambia el 0 por un texto que explique la causa real, no que la esconda: **=SI.ERROR(D6/B6,"Sin ventas")**.',
      pista: 'El segundo hueco de SI.ERROR acepta texto entre comillas, igual que cualquier otra fórmula.',
      senal: { control: 'celda:E6' },
      logro: { tipo: 'documento', comprueba: elPrecioRealQuedoBienExplicado },
      aprendido:
        '«Sin ventas» no es más bonito que 0 — es HONESTO. Cualquiera que abra esta hoja después entiende en un segundo por qué esa celda no tiene un precio real, en vez de asumir que el agua se regaló. Ésa es la diferencia entre tapar un error y explicarlo: los dos quitan el símbolo rojo, pero sólo uno sigue diciendo la verdad.',
    },
    {
      id: 'repara-la-causa',
      titulo: 'Cierra el rastro: repara Gastos, no lo tapes',
      instruccion:
        'Falta la reparación de verdad. Vuelve a la hoja **Corte**. B4 (Gastos) apunta a una hoja que ya no existe: eso no se tapa con SI.ERROR, se REPARA. El tesorero anterior guardó el gasto real antes de borrar Bodega — está en **Ventas!I5**. Corrige B4: **=Ventas!I5**.',
      pista: 'Escribe la referencia completa, con el nombre de la hoja y el signo de exclamación: Ventas!I5.',
      senal: { control: 'hoja:co' },
      logro: { tipo: 'documento', comprueba: laCausaQuedoReparada },
      aprendido:
        'B4 ya no dice #¡REF!: dice **380**, y sigue siendo una fórmula, no un número pegado a mano —si el tesorero de este año actualiza el dato archivado, Gastos se entera solo—. Y mira B5: **20**, un número de verdad, no un error. Rastrear precedentes te llevó hasta la causa real; arreglarla fue reemplazar la referencia rota, no esconderla detrás de un SI.ERROR. Eso era el número absurdo del principio, y ya no lo es.',
    },
  ],

  cierre:
    'Heredaste una hoja que no cuadraba y la dejaste entendida de verdad. Leíste #¡REF!, #¡DIV/0! y #¿NOMBRE? como lo que son —pistas, no un programa roto— y remontaste el rastro con Rastrear precedentes hasta encontrar que el número absurdo de Ganancia neta no nacía ahí, sino tres celdas río arriba, en una fórmula que apuntaba a una hoja que ya no existía. Usaste Rastrear dependientes para saber, antes de tocar un dato, a quién le afecta. Y tapaste un error a lo bruto para sentir el peligro en carne propia —una hoja preciosa y mentirosa— antes de hacerlo bien: mirar primero, entender la causa, y sólo entonces —si de verdad hacía falta— usar SI.ERROR con un texto que explica en vez de un cero que esconde.',
};

export default GUION_AUDITORIA;
