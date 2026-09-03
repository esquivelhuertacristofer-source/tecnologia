import {
  crudoDe,
  guardaUnaRegla,
  usaFuncion,
  vale,
  valorDe,
} from '@/components/office/motor-hojas/consultas';
import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `of-excel-consolida-y-protege` · «Juntar hojas y cerrar con llave»
 * (bloques 53 · 54, grado Avanzado).
 *
 * ── EL CASO ──────────────────────────────────────────────────────────────
 *
 * La kermés de la escuela terminó. Grupo A, Grupo B y Grupo C reportaron lo
 * recaudado en su propio puesto —aguas frescas, tacos, postres—, cada uno en
 * su propia hoja y las tres con la MISMA forma: mismos tres productos, mismo
 * orden, mismo alto. Hay que juntarlas en una cuarta hoja, «Total», y luego
 * dejar una de ellas lista para que las familias la sigan llenando durante el
 * resto del día — que es el caso real que da sentido a los dos bloques
 * juntos: **una hoja que van a llenar OTRAS personas.**
 *
 * ── BLOQUE 53 · CONSOLIDAR ESCRIBE FÓRMULAS, NO NÚMEROS ─────────────────────
 *
 * Es la misma idea de «la celda guarda la regla» del grado Básico, aplicada
 * ahora ENTRE hojas: `consolidar` (`comandos.ts`) escribe
 * `=SUMA('Grupo A'!B4,'Grupo B'!B4,'Grupo C'!B4)`, no `2170`. El encargo 1
 * lo prueba con la trampa de `revisar()` por delante —tres orígenes, y uno
 * con una fila de más— para que el alumno vea con sus propios ojos el aviso
 * de «no tienen la misma forma» antes de consolidar bien; el encargo 2 le
 * cambia un dato a Grupo B y comprueba que el Total se mueve solo, sin volver
 * a consolidar. Los predicados de esta mitad **no comparan contra un número
 * fijo**: `sumaDeLaFila` lee el valor QUE HAY AHORA en las tres hojas de
 * origen, así que el encargo 1 y el encargo 2 —que le cambia el dato a
 * Grupo B a mitad de clase— piden exactamente la misma fórmula.
 *
 * ── BLOQUE 54 · SIN CONTRASEÑA, Y LO CONTRAINTUITIVO ────────────────────────
 *
 * El encargo más importante de la clase no es técnico: es que el alumno sepa
 * qué le compra a esta herramienta y qué no. **No hay contraseña**, a
 * propósito —una que se guardara en claro enseñaría una mentira sobre
 * seguridad—: esto protege de un despiste, no de alguien con intención de
 * saltárselo (la misma frase que ya deja escrita `modelo.ts` en la cabecera
 * de `Proteccion`).
 *
 * Y la lección técnica es la que nadie hace bien la primera vez: **todas las
 * celdas nacen bloqueadas**, así que proteger la hoja cierra TODO —hasta la
 * columna que el propio alumno tiene que seguir llenando— si no se
 * desbloqueó antes. Por eso el encargo 4 no explica el orden: lo hace
 * jugarlo AL REVÉS primero (`protegioSinDesbloquear`, encargo 4) y descubrir
 * la trampa con una pregunta (encargo 5) antes de arreglarlo (encargo 6). Es
 * la misma disciplina que el bloque 44 usó con Quitar duplicados: la sorpresa
 * no es una frase de este archivo, es algo que el alumno provoca él mismo.
 *
 * ── POR QUÉ NINGÚN PREDICADO COMPRUEBA UN INTENTO RECHAZADO ─────────────────
 *
 * «Escribir en una hoja protegida se rechaza» no deja rastro en el libro —el
 * gesto no se aplica— así que no hay nada que un predicado pueda leer para
 * confirmar que el alumno lo intentó. Se resuelve como ya lo resolvió
 * `of-excel-datos-limpios` con la comilla sin cerrar: la INSTRUCCIÓN narra el
 * intento fallido y el `aprendido` cuenta lo que pasó; el predicado sólo
 * comprueba el estado final, útil de verdad. Es también, de rebote, una red
 * de seguridad: si un día un cambio de motor dejara pasar una escritura que
 * debía rechazarse, el predicado de la fila siguiente —que exige que el dato
 * viejo siga ahí— lo cazaría.
 */

/* ── el libro: la kermés de la escuela ───────────────────────────────────── */

export const HOJA_GA = 'ga';
export const HOJA_GB = 'gb';
export const HOJA_GC = 'gc';
export const HOJA_TOTAL = 't';

export const NOMBRE_GA = 'Grupo A';
export const NOMBRE_GB = 'Grupo B';
export const NOMBRE_GC = 'Grupo C';
export const NOMBRE_TOTAL = 'Total';

export const TITULO = 'Kermés de la escuela · Recaudación';

/** Los tres productos, en el mismo orden en las cuatro hojas. */
export const PRODUCTOS = ['Aguas frescas', 'Tacos', 'Postres'] as const;

export const FILA_PRIMERA = 4;
export const FILA_ULTIMA = FILA_PRIMERA + PRODUCTOS.length - 1; // 6
export const FILA_TACOS = FILA_PRIMERA + 1; // 5
export const FILA_POSTRES = FILA_PRIMERA + 2; // 6

/** Lo que cada grupo reportó al llegar, tal cual: sin fórmulas, capturado a mano. */
const RECAUDADO_INICIAL: Record<string, number[]> = {
  [HOJA_GA]: [850, 1200, 430],
  [HOJA_GB]: [600, 980, 390],
  [HOJA_GC]: [720, 1100, 510],
};

/** Lo que el encargo 2 sube en Grupo B y el encargo 6 sube en Grupo A. */
export const NUEVO_TACOS_GB = 1500;
export const NUEVO_TACOS_GA = 1450;

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/** Una hoja de grupo: el mismo molde para las tres, con sus propios números. */
function hojaDeGrupo(nombre: string): Record<string, Celda> {
  const celdas: Record<string, Celda> = {
    A1: fuerte(`${TITULO} · ${nombre}`),
    A2: suelta('Los papás de este puesto van apuntando aquí lo que se recauda.'),
    A3: fuerte('Producto'),
    B3: fuerte('Recaudado'),
  };
  return celdas;
}

/**
 * «Kermés de la escuela · Recaudación.xlsx», con las tres hojas de grupo ya
 * llenas y la hoja Total vacía en la columna del dinero. Es una función y no
 * una constante por lo de siempre: «Empezar de cero» tiene que poder volver a
 * fabricarlo entero, con los tres grupos otra vez sin consolidar y ninguna
 * hoja protegida.
 */
export function libroDeLaKermes(): Libro {
  const grupoA = hojaDeGrupo(NOMBRE_GA);
  const grupoB = hojaDeGrupo(NOMBRE_GB);
  const grupoC = hojaDeGrupo(NOMBRE_GC);
  PRODUCTOS.forEach((p, i) => {
    const f = FILA_PRIMERA + i;
    grupoA[`A${f}`] = suelta(p);
    grupoB[`A${f}`] = suelta(p);
    grupoC[`A${f}`] = suelta(p);
    grupoA[`B${f}`] = suelta(String(RECAUDADO_INICIAL[HOJA_GA][i]));
    grupoB[`B${f}`] = suelta(String(RECAUDADO_INICIAL[HOJA_GB][i]));
    grupoC[`B${f}`] = suelta(String(RECAUDADO_INICIAL[HOJA_GC][i]));
  });

  const total: Record<string, Celda> = {
    A1: fuerte(`${TITULO} · Total`),
    A2: suelta('Se junta sola de las tres hojas de grupo: aquí no se escribe nada a mano.'),
    A3: fuerte('Producto'),
    B3: fuerte('Recaudado'),
  };
  PRODUCTOS.forEach((p, i) => {
    total[`A${FILA_PRIMERA + i}`] = suelta(p);
  });

  return {
    activa: HOJA_TOTAL,
    nombres: {},
    hojas: [
      { id: HOJA_GA, nombre: NOMBRE_GA, color: '#c00000', celdas: grupoA },
      { id: HOJA_GB, nombre: NOMBRE_GB, color: '#107c41', celdas: grupoB },
      { id: HOJA_GC, nombre: NOMBRE_GC, color: '#0f6cbd', celdas: grupoC },
      { id: HOJA_TOTAL, nombre: NOMBRE_TOTAL, color: '#7030a0', celdas: total },
    ],
  };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────── */

const motorDe = (libro: Libro): Motor => crearMotor(libro, RELOJ_DE_LA_CLASE);

/**
 * Lo que Total!B{fila} tiene que enseñar: la suma de esa fila en las tres
 * hojas de grupo, leída AHORA MISMO. No es una tabla fija de resultados —el
 * encargo 2 y el 6 cambian un dato de origen a mitad de clase— sino la misma
 * pregunta que le haría Excel: ¿cuánto suman hoy esas tres celdas?
 */
function sumaDeLaFila(motor: Motor, fila: number): number | null {
  const dir = `B${fila}`;
  const a = valorDe(motor, HOJA_GA, dir);
  const b = valorDe(motor, HOJA_GB, dir);
  const c = valorDe(motor, HOJA_GC, dir);
  if (typeof a !== 'number' || typeof b !== 'number' || typeof c !== 'number') return null;
  return a + b + c;
}

function laFilaEstaConsolidada(libro: Libro, motor: Motor, fila: number): boolean {
  const dir = `B${fila}`;
  const esperado = sumaDeLaFila(motor, fila);
  if (esperado === null) return false;
  return (
    guardaUnaRegla(libro, HOJA_TOTAL, dir) &&
    usaFuncion(libro, HOJA_TOTAL, dir, 'SUMA') &&
    vale(motor, HOJA_TOTAL, dir, esperado)
  );
}

/* — encargo 1: consolidar, con la trampa de la forma distinta por delante — */

export function laConsolidacionQuedaBien(libro: Libro): boolean {
  const motor = motorDe(libro);
  for (let f = FILA_PRIMERA; f <= FILA_ULTIMA; f += 1) {
    if (!laFilaEstaConsolidada(libro, motor, f)) return false;
  }
  return true;
}

/* — encargo 2: es fórmula viva, no una foto del momento en que se consolidó — */

export function laFormulaSigueViva(libro: Libro): boolean {
  if (!laConsolidacionQuedaBien(libro)) return false;
  const motor = motorDe(libro);
  return (
    !guardaUnaRegla(libro, HOJA_GB, `B${FILA_TACOS}`) &&
    vale(motor, HOJA_GB, `B${FILA_TACOS}`, NUEVO_TACOS_GB)
  );
}

/* — encargo 4: proteger AL REVÉS, sin desbloquear nada antes — */

export function protegioSinDesbloquear(libro: Libro): boolean {
  if (!laFormulaSigueViva(libro)) return false;
  const h = libro.hojas.find((x) => x.id === HOJA_GA);
  return Boolean(h?.protegida?.activa) && !(h?.protegida?.desbloqueadas?.length);
}

/* — encargo 6: se arregla en el orden que sí funciona — */

export function laHojaQuedoBienPreparada(libro: Libro): boolean {
  if (!laFormulaSigueViva(libro)) return false;
  const h = libro.hojas.find((x) => x.id === HOJA_GA);
  if (!h?.protegida?.activa) return false;
  return (h.protegida.desbloqueadas ?? []).includes(`B${FILA_PRIMERA}:B${FILA_ULTIMA}`);
}

/* — encargo 7: dentro de lo desbloqueado, escribir SÍ deja — */

export function seEscribioEnLoDesbloqueado(libro: Libro): boolean {
  if (!laHojaQuedoBienPreparada(libro)) return false;
  const motor = motorDe(libro);
  return (
    !guardaUnaRegla(libro, HOJA_GA, `B${FILA_TACOS}`) &&
    vale(motor, HOJA_GA, `B${FILA_TACOS}`, NUEVO_TACOS_GA) &&
    crudoDe(libro, HOJA_GA, `A${FILA_TACOS}`) === 'Tacos' // la etiqueta, fuera del rango, ni se rozó
  );
}

/* — encargo 9: la estructura del libro, la otra mitad del candado — */

export function laEstructuraQuedoProtegida(libro: Libro): boolean {
  if (!seEscribioEnLoDesbloqueado(libro)) return false;
  if (!libro.estructuraProtegida) return false;
  const nombres = libro.hojas.map((h) => h.nombre);
  return (
    libro.hojas.length === 4 &&
    nombres.includes(NOMBRE_GA) &&
    nombres.includes(NOMBRE_GB) &&
    nombres.includes(NOMBRE_GC) &&
    nombres.includes(NOMBRE_TOTAL)
  );
}

/* ── el guion ──────────────────────────────────────────────────────────── */

export const GUION_CONSOLIDA_Y_PROTEGE: GuionHojas = {
  archivo: 'Kermés de la escuela · Recaudación.xlsx',
  libro: libroDeLaKermes,

  portada: {
    situacion: 'Excel · Grado avanzado · La que junta y cierra con llave',
    tema: 'Consolidar y proteger: cuando la hoja la va a llenar otra persona',
    objetivo:
      'Vas a juntar en una sola hoja lo que reportaron tres grupos, con una fórmula que se recalcula sola cuando alguno corrige un dato. Y vas a dejar una de esas hojas lista para que otras personas la sigan llenando: protegida de un despiste, con la única columna que cambia cada día desbloqueada — y vas a aprender, jugándolo al revés la primera vez, por qué ese orden importa.',
    vasAHacer: [
      'Consolidar tres hojas iguales en una, provocando a propósito el aviso de «no tienen la misma forma»',
      'Comprobar que la consolidación es una fórmula viva: cambiar un dato de origen y ver moverse el total solo',
      'Proteger una hoja al revés —sin desbloquear nada— y descubrir por qué te deja fuera hasta a ti',
      'Desbloquear el rango correcto y proteger también la estructura del libro entero',
    ],
    requisitos:
      'Las clases anteriores de Excel: escribir fórmulas, referencias entre hojas (Hoja!Celda) y el `$` de las referencias absolutas. Hoy no hace falta ninguna función nueva: los seis botones de hoy viven en Datos → Herramientas de datos y en la pestaña Revisar, nueva desde hoy.',
    ayuda:
      'Consolidar abre un cuadro de texto: se escribe «hoja!rango,hoja!rango,hoja!rango|operación» y se pulsa Aplicar. Los cinco botones de Revisar no piden nada: actúan sobre la hoja donde estés, o sobre lo que tengas marcado. Si un botón se niega, el aviso dice exactamente qué hacer.',
  },

  pasos: [
    {
      id: 'primer-intento-consolidar',
      titulo: 'Júntalas, con una trampa incluida',
      instruccion:
        'El puesto se cerró y hay que juntar lo que recaudó cada grupo. Ponte en **B4** —aquí, en Total— y pulsa **Consolidar**, en Datos → Herramientas de datos. Escribe esto tal cual, con la trampa incluida, y pulsa Aplicar:\n\n**Grupo A!B4:B6,Grupo B!B4:B7,Grupo C!B4:B6|suma**\n\nLee el aviso. Vuelve a pulsar Consolidar y corrígelo: cambia esa **B7** por **B6** en el origen de Grupo B, y aplica otra vez.',
      pista:
        'Los tres orígenes van separados por comas, cada uno como hoja!rango, y al final —después de la barra vertical «|»— va la operación: suma. Mira el rango de Grupo B: tiene una fila de más que los otros dos.',
      senal: { control: 'consolidar' },
      logro: { tipo: 'documento', comprueba: laConsolidacionQuedaBien },
      aprendido:
        'El aviso decía exactamente lo que pasaba: «las hojas no tienen la misma forma: «Grupo A» es 1×3 y «Grupo B» es 1×4» — ni un misterio, la medida exacta de las dos. Ya corregido, mira **B4**: no dice 2170, dice **=SUMA(\'Grupo A\'!B4,\'Grupo B\'!B4,\'Grupo C\'!B4)**. Es la misma idea de «la celda guarda la regla» que aprendiste el primer día, sólo que hoy la regla mira TRES hojas a la vez.',
    },
    {
      id: 'la-formula-vive',
      titulo: 'Cambia un dato de origen y no toques el total',
      instruccion:
        'Suben las ventas: cambia a la hoja **Grupo B** y actualiza el corte de Tacos. En **B5** escribe **1500** —antes decía 980—. No vuelvas a tocar Consolidar.',
      pista:
        'B5 es el renglón de Tacos en Grupo B. Se escribe el número a secas, sin fórmula: es un dato capturado a mano, como todos los de estas tres hojas.',
      senal: { control: 'hoja:gb' },
      logro: { tipo: 'documento', comprueba: laFormulaSigueViva },
      aprendido:
        'Ve a mirar Total: **B5 pasó de 3280 a 3800** sin que tú tocaras esa hoja ni una vez. Eso es lo que compraste consolidando con una fórmula y no con un número: la celda no guardó «3280», guardó la ORDEN de sumar las tres hojas, y esa orden se cumple otra vez cada vez que algo cambia.',
    },
    {
      id: 'por-que-formula',
      titulo: 'Antes de seguir: ¿por qué una fórmula?',
      instruccion:
        'Cuando pulsaste Consolidar, ¿por qué crees que Excel escribió =SUMA(...) en vez de escribir directamente 2170, el número que salía en ese momento?',
      pista: 'Piensa en lo que acaba de pasar en el encargo anterior, con el dato de Grupo B.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque escribir el número habría tardado más para el programa',
          'Porque así, si algún grupo corrige después su cifra, el total se corrige solo, sin que nadie tenga que volver a consolidar',
          'Da igual: los dos se ven exactamente iguales en la pantalla',
        ],
        correcta: 1,
      },
      aprendido:
        'Eso es. Un consolidado con números es una FOTO del día en que se pulsó el botón: si al mes siguiente Grupo A corrige un dato, el total se queda mintiendo, sin un solo subrayado rojo que lo delate. Con la fórmula viva, no hace falta acordarse de nada.',
    },
    {
      id: 'consolidar-consigo-misma',
      titulo: 'Una trampa que no vas a probar, pero sí a entender',
      instruccion:
        'Una pregunta más, sin tocar nada: ¿qué pasaría si al consolidar escribieras **Total!B4:B6** como uno de los orígenes —la propia hoja Total consolidándose a sí misma?',
      pista: 'Piensa qué sentido tendría que una hoja se sumara a sí misma dentro de su propio total.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Sumaría los datos dos veces, sin que nadie se diera cuenta',
          'Se niega: una hoja no se puede usar como su propio origen al consolidar',
          'No pasa nada raro: es una hoja como cualquier otra',
        ],
        correcta: 1,
      },
      aprendido:
        'Se niega, con un aviso que lo dice sin rodeos: no se puede consolidar una hoja usándose a sí misma como origen. Tiene sentido — Total todavía no tiene nada que sumar antes de consolidar, así que sumarse a sí misma sería preguntarle a una celda vacía cuánto vale.',
    },
    {
      id: 'que-promete-proteger',
      titulo: 'Antes de proteger: ¿qué te promete?',
      instruccion:
        'Estas tres hojas —Grupo A, B y C— las van a seguir llenando las familias de cada grupo, no tú. Antes de tocar nada: ¿qué crees que hace «Proteger hoja», en la pestaña Revisar?',
      pista: 'Piensa en la diferencia entre «evitar un despiste» y «poner una contraseña de verdad».',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Le pone una contraseña de verdad, como la de un banco, para que nadie sin la clave pueda ni abrir el archivo',
          'Evita que alguien borre o escriba encima de algo por despiste; no hay contraseña, y no es para alguien con intención de saltárselo',
          'Esconde las fórmulas para que nadie pueda copiar tu trabajo',
        ],
        correcta: 1,
      },
      aprendido:
        'Ésa es la única promesa real. **No hay contraseña, y es a propósito**: una que se guardara en claro estaría enseñando una mentira sobre seguridad. Esto protege de un despiste —borrar sin querer la fórmula de un compañero—, no de alguien con intención de saltárselo.',
    },
    {
      id: 'protege-primero',
      titulo: 'Hazlo como lo hace casi todo el mundo la primera vez',
      instruccion:
        'Ve a la hoja **Grupo A**. La vas a preparar para las familias, y la vas a proteger YA MISMO, tal cual está, sin desbloquear nada primero. Revisar → Proteger hoja.',
      pista: 'No hace falta marcar ningún rango para este botón: protege la hoja activa entera, con lo que tenga puesto en ese momento.',
      senal: { control: 'hoja:ga' },
      logro: { tipo: 'documento', comprueba: protegioSinDesbloquear },
      aprendido:
        'Ya está protegida. Antes de que la sufras tú mismo, una pregunta.',
    },
    {
      id: 'se-quedo-fuera',
      titulo: 'Te acabas de dejar fuera de tu propia hoja',
      instruccion:
        'La hoja está protegida y no desbloqueaste nada. Si ahora mismo intentaras escribir un nuevo monto en **B5** —la celda que TÚ tienes que seguir actualizando cada día del kermés— ¿qué va a pasar?',
      pista: 'Piensa en cuántas celdas tenía «bloqueada» puesto ANTES de que pulsaras Proteger hoja.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Se deja escribir sin problema: B5 tiene un número, no una fórmula',
          'No deja: todas las celdas nacen bloqueadas, y proteger la hoja hace valer ese candado en TODAS — también en la tuya, si no la desbloqueaste antes',
          'Sólo bloquea las celdas de la columna A, los nombres de los productos',
        ],
        correcta: 1,
      },
      aprendido:
        'Ésa es la trampa en la que cae todo el mundo la primera vez: te acabas de dejar fuera de tu propia hoja. En Excel TODAS las celdas nacen bloqueadas — lo dice el cuadro Formato de celdas, en su pestaña Proteger, aunque casi nadie la mire nunca — y lo único que hace «Proteger hoja» es hacer valer ese candado. Lo que había que desbloquear, había que desbloquearlo ANTES.',
    },
    {
      id: 'arreglar-el-orden',
      titulo: 'Ahora sí, en el orden que funciona',
      instruccion:
        'Arréglalo: quita la protección (Revisar → Quitar protección de hoja), marca **B4:B6** y desbloquéalo (Revisar → Desbloquear rango), y vuelve a proteger la hoja.',
      pista:
        'Los tres botones viven en Revisar → Proteger. Puedes pulsarlos en el orden que quieras: lo que importa es cómo queda la hoja al final — protegida, y B4:B6 en la lista de lo desbloqueado.',
      senal: { control: 'desproteger-hoja,desbloquear-rango,proteger-hoja' },
      logro: { tipo: 'documento', comprueba: laHojaQuedoBienPreparada },
      aprendido:
        'Ahora sí. La hoja sigue protegida —nadie va a borrar por despiste el nombre de un producto, o la celda de al lado— y **B4:B6**, la columna que cambia cada día, se quedó viva.',
    },
    {
      id: 'escribir-en-lo-desbloqueado',
      titulo: 'Compruébalo: aquí sí tiene que dejar',
      instruccion:
        'En **B5** escribe el nuevo corte de Tacos: **1450**. Como está dentro de lo que acabas de desbloquear, esta vez sí va a dejar. Si tienes curiosidad, prueba también en **A5** —el nombre del producto—: ésa sigue bloqueada, porque no la desbloqueaste.',
      pista: 'B5 es la misma celda que hace un momento te habría rechazado. La celda no cambió: cambió la lista de lo desbloqueado.',
      senal: { control: 'celda:B5' },
      logro: { tipo: 'documento', comprueba: seEscribioEnLoDesbloqueado },
      aprendido:
        'Escribió sin protestar, y la hoja sigue protegida —y si probaste A5, te la rechazó igual que antes—. Eso es lo que compraste con los dos encargos de antes: una hoja que las familias pueden seguir llenando todos los días, sin que nadie —ni tú, de un codazo— le borre una fórmula o un encabezado.',
    },
    {
      id: 'una-fila-protegida',
      titulo: 'Proteger también impide borrar filas enteras',
      instruccion:
        'Una más, sin tocar nada: la hoja Grupo A sigue protegida. Si alguien selecciona la fila de Postres (la 6) y pulsa Eliminar filas, ¿qué va a pasar?',
      pista: 'Piensa en qué le pasaría a la tabla entera —no a una celda— si esa fila desapareciera.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Se borra igual: Eliminar filas no es lo mismo que escribir en una celda',
          'Se rechaza: proteger la hoja también impide insertar y borrar filas o columnas enteras, no sólo escribir en una celda suelta',
          'Se borra, pero la fórmula de Total se queda esperando ese dato para siempre',
        ],
        correcta: 1,
      },
      aprendido:
        'Se rechaza, con el mismo tipo de aviso que ya viste. Proteger una hoja no es sólo «no escribir»: es «no tocarle la forma» — y borrar una fila entera es justo eso. Tiene que ser así: si dejara borrar filas, cualquiera podría desbaratar la tabla sin tocar una sola celda de las protegidas.',
    },
    {
      id: 'proteger-estructura',
      titulo: 'La otra mitad del candado',
      instruccion:
        'Falta lo más importante: estas tres hojas tienen que seguir llamándose EXACTAMENTE «Grupo A», «Grupo B» y «Grupo C», porque las fórmulas de Total las buscan por su nombre. Protege la ESTRUCTURA del libro entero: Revisar → Proteger libro. Cuando lo hayas hecho, prueba a cambiarle el nombre a la lengüeta de Grupo B —doble clic sobre ella— y mira qué pasa.',
      pista: '«Proteger libro» está justo debajo de los botones de hoja, en el mismo grupo Proteger.',
      senal: { control: 'proteger-libro' },
      logro: { tipo: 'documento', comprueba: laEstructuraQuedoProtegida },
      aprendido:
        'Se rechazó, con otro aviso que dice lo mismo con otras palabras: la estructura del libro está protegida, no se pueden crear, borrar, mover ni renombrar hojas. Fíjate en que son DOS candados distintos, no uno: proteger Grupo A no impedía renombrar Grupo B —son hojas distintas—, y proteger la ESTRUCTURA no le impide a nadie escribir en una celda de una hoja sin proteger. Cada candado cierra su propia puerta.',
    },
    {
      id: 'el-aviso-ayuda',
      titulo: 'Lo último: cómo tiene que hablar un aviso',
      instruccion:
        'Mira otra vez el aviso que acabas de leer, o el de cuando intentaste escribir en una celda bloqueada. Además de decir que no se puede, ¿qué otra cosa hace?',
      pista: 'Compara «no se puede» con «no se puede, y esto es lo que hay que pulsar».',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Nada más: sólo dice que no se puede',
          'Dice exactamente qué botón pulsar para poder hacerlo —quitar la protección, o desbloquear antes el rango',
          'Pide una contraseña para poder continuar',
        ],
        correcta: 1,
      },
      aprendido:
        'Ésa es la diferencia entre un candado que estorba y uno que enseña: el aviso no se queda en «no», te dice el camino. Es la misma regla que ya viste con la comilla sin cerrar o con la forma distinta al consolidar: un aviso que no dice qué hacer sólo sirve para frustrar a quien lo lee.',
    },
  ],

  cierre:
    'Juntaste en una sola hoja lo que reportaron tres grupos, con una fórmula que se recalcula sola —lo comprobaste cambiando un dato y viendo moverse el total sin tocarlo— y provocaste a propósito el aviso que salta cuando dos hojas no miden lo mismo. Después dejaste una hoja lista para que otras personas la sigan llenando: la protegiste al revés la primera vez y descubriste, en carne propia, que todas las celdas nacen bloqueadas y que hay que desbloquear ANTES de proteger, nunca después. Cerraste también la estructura del libro entero, para que a nadie se le ocurra borrar o renombrar una de las tres hojas de grupo. Y sin una sola contraseña: ahora sabes que proteger una hoja es contra un despiste, no contra alguien con malas intenciones — y que un aviso que vale la pena es el que dice qué hacer.',
};

export default GUION_CONSOLIDA_Y_PROTEGE;
