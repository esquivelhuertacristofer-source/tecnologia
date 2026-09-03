/**
 * Tecnia Hojas · `cinta.ts` — **un botón de la cinta no aplica: emite un gesto**.
 *
 * Es la capa que hace verdad el §45.6, y la que separa a esta sala de las otras
 * dos. En Tecnia Textos y en Tecnia Diapositivas un control de cinta es esto:
 *
 *     aplicar: (ctx) => Mazo        // el botón fabrica el documento nuevo
 *
 * y aquí es esto otro:
 *
 *     gesto: (ctx) => Gesto | Gesto[] | null    // el botón dice QUÉ hacer
 *
 * Quien lo hace es el camino de siempre, `ejecutar(motor, gesto, grabadora)`, el
 * mismo por el que pasa escribir en una celda. La consecuencia es la que se
 * compró en el §45.6 y conviene decirla entera: **todo botón de la cinta queda
 * grabable en una macro sin escribir una línea más**. No hay una lista de
 * «botones que la grabadora sabe grabar» que alguien tenga que acordarse de
 * ampliar en la clase 55, veintidós clases después de haberla escrito.
 *
 * Y la razón por la que esto no es una preferencia de estilo: si un control
 * aplicara por su cuenta —tocando el libro, o llamando a `conCelda`— la macro
 * saldría **incompleta**, y eso **no se ve**. La pantalla queda bien, el alumno
 * sigue, y el defecto sólo aparece el día que se reproduce la macro y falta la
 * mitad. Un defecto que no se ve el día que se comete se paga cuando ya hay
 * veinte clases encima. Por eso la prueba que cierra este archivo compara las
 * dos vías —pulsar el botón y reproducir sus gestos sobre el libro de partida—
 * y exige el **mismo libro**.
 *
 * ── Tres cosas que este archivo NO hace, y por qué ──────────────────────────
 *
 * **(1) No inventa comandos.** Los comandos son los de `comandos.ts` y ni uno
 * más. Un botón cuyo comando todavía no existe se declara igual, **inerte y
 * con su motivo escrito**: existir e informar es mejor que no existir. Un botón
 * que falta deja al alumno buscándolo; un botón apagado que dice «esto llega en
 * la clase de gráficas» le enseña dónde está el resto del programa. Es el
 * `porQue` del §44.1, traído entero.
 *
 * **(2) No guarda el portapapeles.** `copiar` devuelve `null` **sin estar
 * inerte**, y el motivo es de modelo, no de pereza: el portapapeles **no está en
 * el libro**, es estado de la ventana, y un gesto sólo puede llevar lo que está
 * en el libro (la regla de la cabecera de `comandos.ts`: nada se inventa al
 * reproducir). Grabar «copiar» sin saber qué había dentro del portapapeles daría
 * una macro que al reproducirse pega lo que hubiera en ese momento — es decir,
 * una macro que da un libro distinto cada vez. Lo que sí queda grabado es
 * **`pegar`**, que sí lleva su origen escrito en el gesto (`origen: "A1:B3"`), y
 * con eso la pareja copiar→pegar se reproduce entera aunque el copiar no se
 * grabe.
 * **Deuda anotada para la clase 55** (`of-excel-macros`, bloques 55 y 56): al
 * enseñar la lista de la macro hay que decir esto en voz alta, porque el alumno
 * verá «Pegar A1:B3 en D1» sin un «Copiar A1:B3» encima y tiene que entender por
 * qué. Los ids que están en este caso viven en `SOLO_VENTANA`, para que la
 * ventana los distinga de un botón apagado.
 *
 * **`cortar` salió de esa lista el 14-ago-2026 y conviene saber por qué**, que
 * es donde estaba el defecto: copiar no cambia el libro y cortar SÍ. Cortar es
 * mover, y mover es pegar en el destino y vaciar el origen — dos cambios del
 * libro que, si no se emiten como gestos, no se graban y no se deshacen. Así que
 * `cortar` emite los dos, con la fidelidad que los separa de copiar y que casi
 * nadie sabe: **al cortar las referencias NO se trasladan**. `=B2*C2` cortado y
 * pegado tres filas abajo sigue diciendo `=B2*C2`, porque la fórmula no se copió:
 * se mudó de casa. De ahí el `trasladar: 0` del gesto.
 *
 * **Y el 15-ago-2026 esos dos gestos pasaron a salir también de `pegar`**, que
 * es por donde salen de verdad: nadie corta y vuelve a pulsar Cortar; se corta y
 * se **pega**. Los dos botones llaman a `moverDatos`, que se escribe una vez.
 * Lo que hace falta para distinguir un pegado de una mudanza es un segundo dato
 * del portapapeles —**cómo** se guardó, no sólo **qué**—, y por eso
 * `ContextoCinta` ganó `corte`. Es estado de la ventana, igual que el origen.
 *
 * **(3) No adivina qué botón pulsó el alumno para corregir.** Eso es del guion
 * (`guion.ts`) y se corrige leyendo el libro (§36.3).
 *
 * ── El subrayado, que estuvo apagado un mes y por qué ──────────────────────
 *
 * Hasta el 15-ago-2026 aquí decía que `subrayado` estaba **inerte**, y el motivo
 * era bueno: `Formato` (en `modelo.ts`) guardaba `negrita`, `cursiva`, `tipo`,
 * `decimales` y `alineacion` y **no guardaba subrayado**, con lo que un gesto
 * `formato` con `subrayado: 1` habría sido aceptado, grabado en la macro y no
 * habría hecho absolutamente nada — la peor de las tres opciones, porque miente
 * en pantalla y miente en la macro. Entre un botón que no está, un botón que
 * engaña y un botón apagado que explica lo que le falta, se eligió el tercero.
 *
 * Lo que se aprende de ese mes: **un botón apagado con su motivo escrito es una
 * deuda con recibo**. El día que `Formato` ganó el campo —con los bloques 9 y
 * 10— el recibo decía exactamente qué faltaba y encenderlo costó una línea. Los
 * seis que llegaron con él —los dos colores, los bordes, el ajuste de texto,
 * combinar y la brocha— estaban en la misma lista y por el mismo motivo.
 */

import {
  celdaEn,
  comparar,
  crudoEn,
  dir,
  type Formato,
  type TipoFormato,
  type TipoGrafica,
  type Valor,
} from './modelo';
import {
  cajaDeTexto,
  combinacionEn,
  desplazarCrudo,
  escribirEn,
  textoDeCaja,
  type Caja,
  type Gesto,
} from './comandos';
import { valorDe, type Motor } from './formula/calculo';

/* ── lo que el control sabe cuando lo pulsan ────────────────────────────────*/

/** Lo que el control sabe cuando lo pulsan. */
export interface ContextoCinta {
  motor: Motor;
  hoja: string;
  /** El rango seleccionado. Una celda suelta es una caja de 1×1. */
  sel: Caja;
  /** El valor de un desplegable o de un cuadro de texto, si lo hubo. */
  valor?: string | number;
  /**
   * Si lo que la ventana se guardó se guardó **cortando**.
   *
   * Llegó el 15-ago-2026 con el portapapeles de la ventana, y es el segundo dato
   * del portapapeles: **el qué** (`valor`, el domicilio de lo copiado) y **el
   * cómo** (esto). Los dos son estado de la ventana por el mismo motivo —el
   * portapapeles no está en el libro—, así que viajan juntos y por la misma
   * puerta.
   *
   * Sin él, `pegar` no podía completar un corte y el alumno tenía que pulsar
   * Cortar dos veces, que no es lo que hace nadie: en Excel se corta y se
   * **pega**. La alternativa era que la ventana se fabricara los dos gestos por
   * su cuenta al pegar tras un corte, y eso es exactamente lo que la cabecera de
   * este archivo prohíbe — un botón que aplica por su cuenta graba media macro.
   */
  corte?: boolean;
}

export interface ControlHojas {
  /** Lo que el botón HACE, como DATO. `null` = aquí no hay nada que hacer. */
  gesto: (c: ContextoCinta) => Gesto | Gesto[] | null;
  /** Hundido: ese formato ya está puesto donde está el cursor. */
  activo?: (c: ContextoCinta) => boolean;
  /** Se ve y no responde. */
  inerte?: (c: ContextoCinta) => boolean;
  /** Por qué no responde, en una frase para el alumno. */
  porQue?: (c: ContextoCinta) => string | undefined;
}

/**
 * Lo que una clase añade o cambia del motor, sin tocar este archivo.
 *
 * Es la misma puerta que abrió §36.4 en Word y §40 en PowerPoint, y la que
 * permite que las veintitrés clases de Excel se construyan en paralelo.
 */
export type ControlesDeClase = Record<string, ControlHojas>;

/* ── ayudas: leer la selección y leer la celda ──────────────────────────────*/

/*
 * `textoDeCaja` se mudó a `comandos.ts` el 15-ago-2026 y se sigue exportando de
 * aquí para quien la importaba de este archivo. El motivo de la mudanza está
 * escrito allí: desde las celdas combinadas, el motor no sólo lee cajas escritas
 * —también las guarda en el libro—, y la única función que sabe escribir una
 * caja no puede vivir en la capa de los botones.
 */
export { textoDeCaja };

export const esUnaCelda = (c: Caja): boolean => c.c0 === c.c1 && c.f0 === c.f1;

const alto = (c: Caja): number => c.f1 - c.f0 + 1;

const ancho = (c: Caja): number => c.c1 - c.c0 + 1;

/**
 * El formato de la celda **ancla** de la selección, que es la esquina superior
 * izquierda.
 *
 * Excel hunde el botón de negrita mirando la celda activa, no las cincuenta
 * seleccionadas: con media selección en negrita el botón sale hundido y la
 * pulsación se la lleva toda a normal. Se imita eso y no «¿están todas?»,
 * porque lo que el alumno tiene delante es el cursor, no el conjunto.
 */
const formatoAncla = (c: ContextoCinta): Formato | null =>
  celdaEn(c.motor.libro, c.hoja, c.sel.c0, c.sel.f0)?.formato ?? null;

/** El gesto `formato` sobre toda la selección, con los argumentos que se le den. */
const conFormato = (c: ContextoCinta, args: Record<string, string | number>): Gesto => ({
  comando: 'formato',
  args: { hoja: c.hoja, rango: textoDeCaja(c.sel), ...args },
});

/* ── los interruptores de fuente y de alineación ────────────────────────────*/

/**
 * Un interruptor de verdad: pone **lo contrario de lo que hay** en el ancla.
 *
 * `activo` no es decoración. Es quien decide el gesto: si el botón está hundido,
 * el gesto que sale es «quítalo». Si el `activo` mintiera, el botón dejaría de
 * poder apagar el formato y la única salida del alumno sería deshacer.
 */
function interruptor(marca: 'negrita' | 'cursiva' | 'subrayado' | 'ajustarTexto'): ControlHojas {
  const activo = (c: ContextoCinta) => formatoAncla(c)?.[marca] === true;
  return {
    activo,
    gesto: (c) => conFormato(c, { [marca]: activo(c) ? 0 : 1 }),
  };
}

/** Los tres de alineación. Hundido sólo si alguien la puso **a mano**: la
 *  alineación por omisión —número a la derecha, texto a la izquierda— la calcula
 *  `formatos.ts` al pintar y no está guardada en el libro, así que el botón no
 *  puede decir que la puso el alumno. */
function alineacion(lado: 'izquierda' | 'centro' | 'derecha'): ControlHojas {
  return {
    activo: (c) => formatoAncla(c)?.alineacion === lado,
    gesto: (c) => conFormato(c, { alineacion: lado }),
  };
}

/** Los tres de tipo de número. Se ponen, no se quitan: es lo que hace Excel. */
function tipoDeNumero(tipo: TipoFormato, decimales?: number): ControlHojas {
  return {
    activo: (c) => (formatoAncla(c)?.tipo ?? 'general') === tipo,
    gesto: (c) => conFormato(c, decimales === undefined ? { tipo } : { tipo, decimales }),
  };
}

/**
 * Más decimales / menos decimales.
 *
 * Los decimales que hay se leen del ancla, y **por omisión son 2** — que es lo
 * que enseña `formatos.ts` cuando el formato no dice nada, no un 0 inventado
 * aquí. Si se pusiera 0 por omisión, el primer clic en «más decimales» sobre una
 * celda de moneda la bajaría de `$25.00` a `$25.0`, que es al revés de lo que
 * pide el botón. Y no baja de 0 porque `-1` decimales no existe: `toFixed(-1)`
 * revienta.
 */
function decimales(paso: 1 | -1): ControlHojas {
  const gesto = (c: ContextoCinta): Gesto | null => {
    const hay = formatoAncla(c)?.decimales ?? 2;
    const nuevo = Math.max(0, hay + paso);
    return nuevo === hay ? null : conFormato(c, { decimales: nuevo });
  };
  if (paso === 1) return { gesto };
  // El motivo se cuelga sólo del botón que se puede apagar. Un `porQue` en el de
  // «más decimales» sería una frase que nunca se dice y que alguien acabaría
  // enseñando por error el día que la ventana pida el motivo sin preguntar si
  // está apagado.
  return {
    gesto,
    inerte: (c) => (formatoAncla(c)?.decimales ?? 2) === 0,
    porQue: () => 'Ya no quedan decimales que quitar: esta celda enseña el número entero.',
  };
}

const TIPOS: readonly TipoFormato[] = ['general', 'numero', 'texto', 'moneda', 'porcentaje', 'fecha'];

/* ── autosuma · el botón estrella del grado Básico ──────────────────────────*/

const esNumero = (v: Valor): boolean => typeof v === 'number';

/**
 * El rango que Excel adivina al pulsar Autosuma, adivinado igual.
 *
 * **Arriba primero, y a la izquierda si arriba no hay nada.** Se sube por la
 * columna mientras haya números seguidos y se para en el primer hueco o en el
 * primer texto — por eso el encabezado «Importe» de la fila 1 no entra en la
 * suma, que es justo lo que el alumno espera y lo que hace que el botón parezca
 * que piensa. Si no hay ni arriba ni a la izquierda, devuelve `null` y quien
 * llama escribe `=SUMA()` con el cursor dentro, que también es lo que hace
 * Excel: **no se inventa un rango**.
 *
 * Se mira el **valor**, no el crudo: una celda con `=B2*C2` cuenta como número
 * porque enseña un número, y una con `007` no cuenta porque es texto (y es texto
 * a propósito, ver `valorDeTextoCrudo`). Preguntarle al crudo daría lo
 * contrario de las dos cosas.
 */
export function rangoDeAutosuma(motor: Motor, hoja: string, col: number, fila: number): Caja | null {
  let f = fila - 1;
  while (f >= 0 && esNumero(valorDe(motor, hoja, col, f))) f -= 1;
  if (f < fila - 1) return { c0: col, f0: f + 1, c1: col, f1: fila - 1 };

  let c = col - 1;
  while (c >= 0 && esNumero(valorDe(motor, hoja, c, fila))) c -= 1;
  if (c < col - 1) return { c0: c + 1, f0: fila, c1: col - 1, f1: fila };

  return null;
}

/**
 * Autosuma y los seis botones de función son **el mismo botón con otro nombre**.
 *
 * En Excel el desplegable de Autosuma trae Suma, Promedio, Contar números, Máx y
 * Mín, y todos hacen lo mismo con distinta palabra. Escribirlo una vez es lo que
 * garantiza que `fn-promedio` adivine el rango igual de bien que `autosuma`; con
 * seis copias, la quinta se queda vieja.
 *
 * Con una celda seleccionada escribe la fórmula ahí. Con un rango de varias,
 * escribe una fórmula **debajo de cada columna**, que es lo que hace Excel
 * cuando se selecciona una tabla y se pulsa Autosuma.
 */
function conFuncion(nombre: string): (c: ContextoCinta) => Gesto[] {
  return (c) => {
    if (esUnaCelda(c.sel)) {
      const r = rangoDeAutosuma(c.motor, c.hoja, c.sel.c0, c.sel.f0);
      const crudo = r ? `=${nombre}(${textoDeCaja(r)})` : `=${nombre}()`;
      return [escribirEn(c.hoja, dir(c.sel.c0, c.sel.f0), crudo)];
    }
    const gestos: Gesto[] = [];
    for (let col = c.sel.c0; col <= c.sel.c1; col += 1) {
      const rango = `${dir(col, c.sel.f0)}:${dir(col, c.sel.f1)}`;
      gestos.push(escribirEn(c.hoja, dir(col, c.sel.f1 + 1), `=${nombre}(${rango})`));
    }
    return gestos;
  };
}

const funcion = (nombre: string): ControlHojas => ({ gesto: conFuncion(nombre) });

/* ── ordenar · el bloque 19, y la razón por la que no es un comando ─────────*/

/**
 * Ordenar mueve datos, y **se emite como una lista de `escribir`**, uno por
 * celda que cambia.
 *
 * Podría haber sido un comando `ordenar` de una línea. No lo es a propósito: un
 * comando `ordenar` guardado en una macro se reproduciría **ordenando otra vez**
 * sobre los datos que hubiera ese día, y una macro que reordena lo que ya estaba
 * ordenado no es la misma macro. Con la lista de `escribir`, la macro guarda el
 * resultado y al reproducirla vuelve a dejar la hoja exactamente igual. Es la
 * regla de la cabecera de `comandos.ts` —nada se inventa al reproducir— aplicada
 * a un botón que parecía inocente.
 *
 * Tres fidelidades que sí se respetan: se ordena **por la primera columna de la
 * selección**; las filas viajan **enteras** (todas las columnas seleccionadas),
 * que es lo que evita el desastre clásico de dejar los nombres sin sus
 * calificaciones; y **las vacías se van al final** en los dos sentidos, como en
 * Excel. Las fórmulas que viajan se les mueven las referencias con
 * `desplazarCrudo`, igual que al copiar: una fórmula que decía `=B2*C2` y acaba
 * en la fila 5 tiene que decir `=B5*C5`.
 *
 * **Reserva escrita a propósito (15-ago-2026):** lo que viaja es el CRUDO, no el
 * formato. En Excel una fila pintada de amarillo se lleva su amarillo al
 * ordenar; aquí el amarillo se queda en el renglón. Se deja anotado y no se
 * arregla hoy porque arreglarlo no es añadir un gesto `formato` por celda —eso
 * sabe poner un formato y **no sabe quitarlo**, así que una fila sin formato que
 * cayera sobre una pintada se quedaría pintada—, sino un comando nuevo que
 * asigne el formato entero de una celda. Cuando una clase pinte filas y las
 * ordene, ése es el día; ninguna del grado Básico lo hace.
 */
function gestosDeOrden(c: ContextoCinta, descendente: boolean): Gesto[] {
  const { sel, hoja } = c;
  const filas: Array<{ fila: number; llave: Valor; crudos: string[] }> = [];
  for (let f = sel.f0; f <= sel.f1; f += 1) {
    const crudos: string[] = [];
    for (let col = sel.c0; col <= sel.c1; col += 1) crudos.push(crudoEn(c.motor.libro, hoja, col, f));
    filas.push({ fila: f, llave: valorDe(c.motor, hoja, sel.c0, f), crudos });
  }

  const ordenadas = filas.slice().sort((a, b) => {
    const va = a.llave === null;
    const vb = b.llave === null;
    if (va || vb) return va && vb ? 0 : va ? 1 : -1;
    const r = comparar(a.llave, b.llave);
    // Un error no se puede comparar con nada: se queda donde estaba. El `sort`
    // de JS es estable, así que devolver 0 es literalmente «no lo muevas».
    const n = typeof r === 'number' ? r : 0;
    return descendente ? -n : n;
  });

  const gestos: Gesto[] = [];
  ordenadas.forEach((origen, i) => {
    const destino = sel.f0 + i;
    origen.crudos.forEach((crudo, j) => {
      const col = sel.c0 + j;
      const nuevo = desplazarCrudo(crudo, 0, destino - origen.fila);
      if (nuevo !== crudoEn(c.motor.libro, hoja, col, destino)) gestos.push(escribirEn(hoja, dir(col, destino), nuevo));
    });
  });
  return gestos;
}

function ordenar(descendente: boolean): ControlHojas {
  return {
    gesto: (c) => gestosDeOrden(c, descendente),
    inerte: (c) => c.sel.f0 === c.sel.f1,
    porQue: () =>
      'Para ordenar hacen falta varias filas: selecciona primero la columna —o la tabla entera— que quieres ordenar.',
  };
}

/* ── las gráficas · el bloque 17, y el 37 detrás ───────────────────────────*/

/**
 * El nombre de la gráfica **sale de lo que el alumno tiene marcado**, y de nada
 * más.
 *
 * Es la regla de la cabecera de `comandos.ts` cobrada en el sitio donde más
 * fácil habría sido saltársela: lo natural al escribir un botón que crea cosas
 * es un contador (`grafica-1`, `grafica-2`) o un reloj. Cualquiera de los dos
 * hace que **la misma macro reproducida dos veces dé libros distintos**, y con
 * ello se cae la prueba del bloque 55. Con la selección y el tipo dentro del
 * nombre, pulsar Columnas sobre `A1:B9` da siempre `g-h1-A1-B9-columnas`, hoy y
 * dentro de un año.
 *
 * El **tipo** entra en el nombre a propósito y no es un detalle: sin él, hacer
 * una de columnas y luego una de líneas con los mismos datos —que es exactamente
 * lo que pide el bloque 37, comparar— chocaría contra la gráfica que ya existe y
 * el segundo botón se quedaría dando un aviso. Con él, son dos gráficas
 * distintas, que es lo que hace Excel. Lo único que choca consigo mismo es
 * pulsar dos veces el mismo botón sobre lo mismo, y entonces el aviso de
 * `insertarGrafica` dice justo eso.
 */
const idDeGrafica = (c: ContextoCinta, tipo: TipoGrafica): string =>
  `g-${c.hoja}-${textoDeCaja(c.sel).replace(':', '-')}-${tipo}`;

/**
 * Los tres botones de gráfica son **el mismo botón con otro tipo**, igual que
 * autosuma y sus seis hermanas.
 *
 * Y los tres se apagan con una sola celda marcada, con el motivo escrito: una
 * gráfica de un número no dice nada, y el error de la primera clase es pulsar el
 * botón con el cursor suelto en mitad de la hoja. Excel, en ese caso, adivina la
 * región de alrededor; aquí se prefiere enseñar a seleccionar, que es lo que el
 * bloque 3 acaba de enseñar y lo que el alumno va a necesitar el resto del
 * curso. Queda anotado por si un día se quiere el adivino: iría aquí, con la
 * misma forma que `rangoDeAutosuma`.
 */
function graficaDe(tipo: TipoGrafica): ControlHojas {
  return {
    gesto: (c) => ({
      comando: 'insertarGrafica',
      // Sin `ancla`: el comando la calcula junto a los datos, y la calcula a
      // partir de `datos`, que va dentro del gesto. Sigue siendo determinista.
      args: { hoja: c.hoja, id: idDeGrafica(c, tipo), tipo, datos: textoDeCaja(c.sel) },
    }),
    inerte: (c) => esUnaCelda(c.sel),
    porQue: () =>
      'Una gráfica dibuja varios números: marca antes la columna de datos —y la de los nombres, si la hay— y vuelve a pulsar.',
  };
}

/* ── el portapapeles · lo que la ventana le pasa a estos cuatro botones ─────*/

/**
 * No hay nada copiado.
 *
 * `valor` es **el rango que la ventana se guardó** al copiar o al cortar
 * (`"A1:B3"`), y no un texto suelto: el portapapeles de esta sala no lleva
 * contenido, lleva un domicilio, y por eso el gesto que sale se puede reproducir
 * (ver la nota (2) de la cabecera).
 */
const sinOrigen = (c: ContextoCinta): boolean => c.valor === undefined || c.valor === '';

/** El gesto `pegar` de lo copiado sobre la selección, con lo que le añada el modo. */
const pegado = (c: ContextoCinta, args: Record<string, string | number>): Gesto => ({
  comando: 'pegar',
  args: { hoja: c.hoja, origen: String(c.valor), destino: textoDeCaja(c.sel), ...args },
});

/** ¿Estas dos cajas comparten aunque sea una celda? Un rango ilegible no se encima con nada. */
const seSolapan = (a: Caja | null, b: Caja): boolean =>
  a !== null && a.c0 <= b.c1 && b.c0 <= a.c1 && a.f0 <= b.f1 && b.f0 <= a.f1;

/**
 * **Mover es pegar sin trasladar y vaciar el origen.** Los dos gestos, juntos.
 *
 * Se escribe una vez y lo usan los dos botones que mueven —`cortar` en su
 * segunda pulsación y `pegar` cuando lo guardado se guardó cortando—, porque son
 * dos puertas de la misma herramienta, como los dos de orden. Con dos copias, el
 * día que a una se le añadiera algo la otra se quedaría atrás y **el alumno
 * vería dos comportamientos distintos según por dónde entró**.
 */
const moverDatos = (c: ContextoCinta): Gesto[] => [
  pegado(c, { trasladar: 0 }),
  { comando: 'borrar', args: { hoja: c.hoja, rango: String(c.valor) } },
];

/**
 * Soltar lo cortado encima de donde se cortó.
 *
 * El `borrar` de después se lleva el origen entero, así que si el destino toca
 * el origen se borraría lo recién pegado. No es un aviso escrito en un
 * comentario: el botón se apaga y lo dice.
 */
const seEncimaElCorte = (c: ContextoCinta): boolean =>
  !sinOrigen(c) && seSolapan(cajaDeTexto(String(c.valor)), c.sel);

const NO_CABE_ENCIMA =
  'El sitio a donde quieres moverlo se encima con el sitio de donde lo cortaste: elige un destino que no toque el original.';

/* ── las dos de la hoja · lo que la ventana le pasa a estos dos botones ─────*/

/**
 * El lugar al que va la lengüeta, contando desde 0, o `null` si no lo dijeron.
 *
 * Se comprueba entero aquí y no en el gesto porque `inerte` y `gesto` tienen que
 * contestar lo mismo: un botón encendido cuyo gesto sale `null` es un botón que
 * se deja pulsar y no hace nada, que es lo que se prohíbe en la cabecera.
 */
const lugarDeHoja = (c: ContextoCinta): number | null => {
  if (c.valor === undefined || c.valor === '') return null;
  const n = Number(c.valor);
  return Number.isInteger(n) && n >= 0 ? n : null;
};

/** Un hexadecimal de seis cifras, que es lo que guarda `Hoja.color`. */
const esColor = (v: string | number | undefined): boolean => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);

/* ── los dos colores de la celda y los bordes · bloque 9 ────────────────────*/

/**
 * El color de la letra y el del relleno, que son **el mismo botón dos veces**.
 *
 * Los dos son desplegables (`DESPLEGABLES_EXCEL`), los dos reciben el color por
 * `ctx.valor` como el de la lengüeta, y los dos aceptan **la cadena vacía**, que
 * es el «Automático» y el «Sin relleno» de las paletas de Excel. Ese vacío no es
 * un adorno: sin él el botón sabría pintar y no sabría despintar, y la única
 * salida del alumno que se equivocó de color sería deshacer.
 *
 * Sin color no se emite nada y el botón se apaga **diciéndolo**, igual que
 * `color-hoja`: un botón encendido cuyo gesto sale `null` es un botón que se
 * deja pulsar y no hace nada, que es lo que prohíbe la cabecera.
 */
function colorDeCelda(campo: 'colorLetra' | 'colorRelleno', que: string): ControlHojas {
  const dado = (c: ContextoCinta): string | null =>
    c.valor === '' || esColor(c.valor) ? String(c.valor) : null;
  return {
    gesto: (c) => {
      const x = dado(c);
      return x === null ? null : conFormato(c, { [campo]: x });
    },
    inerte: (c) => dado(c) === null,
    porQue: () =>
      `Elige un color de la paleta para ${que}. Es sólo pintura: un número en rojo o con el fondo amarillo sigue valiendo exactamente lo mismo para la hoja.`,
  };
}

/**
 * Los siete de bordes: los tres presentes y las cuatro caras sueltas.
 *
 * El reparto celda por celda —quién lleva marco y quién no— lo hace
 * `ladosDeBorde` en `comandos.ts`, que es quien tiene la caja delante. Aquí sólo
 * viaja la palabra que el alumno eligió en el desplegable, que es lo que hace
 * que el gesto se pueda leer en la lista de una macro: «Bordes contorno en
 * B2:D9» se entiende; una lista de cuatro banderas por celda, no.
 */
const BORDES: readonly string[] = ['todos', 'contorno', 'ninguno', 'arriba', 'abajo', 'izquierda', 'derecha'];

const bordes: ControlHojas = {
  gesto: (c) => (BORDES.includes(String(c.valor ?? '')) ? conFormato(c, { bordes: String(c.valor) }) : null),
  inerte: (c) => !BORDES.includes(String(c.valor ?? '')),
  porQue: () =>
    'Abre la lista y elige qué rayas quieres: todas, sólo el contorno de lo que marcaste, una cara suelta, o ninguna. La cuadrícula gris de la pantalla no se imprime; estos bordes sí.',
};

/* ── combinar y centrar · bloque 10 ─────────────────────────────────────────*/

/** La combinación que hay donde está el cursor, si la hay. */
const combinadaAqui = (c: ContextoCinta) => combinacionEn(c.motor.libro, c.hoja, c.sel.c0, c.sel.f0);

/**
 * Combinar es **un interruptor**, igual que en Excel: el mismo botón junta y
 * separa, y se pinta hundido mientras el cursor está dentro de una combinada.
 *
 * Y por eso no hay un botón «Separar» al lado: si lo hubiera, el alumno tendría
 * que aprender que una de las dos mitades de la misma idea vive en otro sitio.
 *
 * `confirmado` viaja cuando la ventana ya enseñó el aviso de que se va a perder
 * contenido y el alumno volvió a pulsar. Es el «Aceptar» del cuadro de diálogo
 * de Excel, y se manda por `valor` porque es lo que sabe la ventana y no la
 * cinta — igual que el portapapeles.
 */
const combinarYCentrar: ControlHojas = {
  activo: (c) => combinadaAqui(c) !== null,
  gesto: (c) => {
    const ya = combinadaAqui(c);
    if (ya) return { comando: 'separarCeldas', args: { hoja: c.hoja, rango: textoDeCaja(c.sel) } };
    return {
      comando: 'combinarCeldas',
      args: {
        hoja: c.hoja,
        rango: textoDeCaja(c.sel),
        centrar: 1,
        ...(c.valor === 'confirmado' ? { confirmado: 1 } : {}),
      },
    };
  },
  // Una celda sola no se combina con nada. Con el cursor dentro de una combinada
  // sí responde, porque entonces el botón es el que separa.
  inerte: (c) => esUnaCelda(c.sel) && combinadaAqui(c) === null,
  porQue: () =>
    'Para combinar hay que marcar varias celdas: selecciona desde la primera hasta la última del título y vuelve a pulsar. Y piénsalo dos veces fuera de un título: sobre celdas combinadas no se ordena ni se filtra bien.',
};

/* ── el análisis Y si y el dato sucio · bloques 43, 44 y 57 ──────────────────*/

/**
 * Estos siete botones no tienen todavía una clase que los pinte —ninguna
 * cinta del grado Avanzado está construida— y por eso no viven en
 * `PENDIENTES`: no son «aquí no se puede», son motor ya cableado, listo para
 * que la clase que los enseñe los llame por su id (§36.4). Se prueban a
 * través de `gestosDe`, sin montar ninguna ventana.
 *
 * Ninguno de los cuatro cuadros de diálogo de Excel —Buscar objetivo, Guardar
 * escenario, Importar texto— existe todavía en esta ventana, así que los
 * campos que ese cuadro pediría viajan **codificados en `ctx.valor`**, con la
 * misma disciplina que ya usan `bordes` («arriba+abajo») y el desplegable de
 * número: un botón mínimo hoy, sin inventarle a `ContextoCinta` un campo por
 * cuadro de diálogo que todavía no se ha dibujado. El día que la clase 57
 * pinte su propio panel, lo que cambia es CÓMO se arma `ctx.valor` — el
 * `gesto` de aquí abajo no se entera.
 */

/** `"5000|B3"` → `["5000", "B3"]`. `null` si falta cualquiera de los dos campos. */
function dosCampos(v: string | number | undefined): [string, string] | null {
  const t = String(v ?? '');
  const i = t.indexOf('|');
  if (i < 0) return null;
  const a = t.slice(0, i).trim();
  const b = t.slice(i + 1).trim();
  return a && b ? [a, b] : null;
}

/**
 * Buscar objetivo. La celda objetivo es la seleccionada —hay que estar
 * encima, igual que en Excel—; lo demás llega como `"valor|cambiando"`.
 */
const buscarObjetivo: ControlHojas = {
  gesto: (c) => {
    if (!esUnaCelda(c.sel)) return null;
    const campos = dosCampos(c.valor);
    if (!campos) return null;
    const [valor, cambiando] = campos;
    return {
      comando: 'buscar-objetivo',
      args: {
        hoja: c.hoja,
        objetivo: dir(c.sel.c0, c.sel.f0),
        valor: Number(valor),
        cambiando: cambiando.toUpperCase(),
        // El reloj viaja por lo mismo que en `pegar-valores`: si la celda
        // objetivo cuelga de un `=HOY()`, la macro reproducida el año que
        // viene tiene que buscar sobre el mismo día que se grabó.
        ahora: c.motor.contexto.ahora,
      },
    };
  },
  inerte: (c) => !esUnaCelda(c.sel) || !dosCampos(c.valor),
  porQue: () =>
    'Ponte sobre la celda con la fórmula, y di qué valor quieres y qué celda se puede mover para conseguirlo.',
};

/** `"Optimista"` o, en la segunda pulsación de un aviso, `"Optimista|confirmado"`. */
function nombreYConfirmado(v: string | number | undefined): { nombre: string; confirmado: boolean } {
  const t = String(v ?? '');
  const i = t.indexOf('|');
  const nombre = (i < 0 ? t : t.slice(0, i)).trim();
  const confirmado = i >= 0 && t.slice(i + 1).trim() === 'confirmado';
  return { nombre, confirmado };
}

const guardarEscenario: ControlHojas = {
  gesto: (c) => {
    const { nombre, confirmado } = nombreYConfirmado(c.valor);
    if (!nombre) return null;
    return {
      comando: 'guardar-escenario',
      args: { hoja: c.hoja, nombre, celdas: textoDeCaja(c.sel), ...(confirmado ? { confirmado: 1 } : {}) },
    };
  },
  inerte: (c) => nombreYConfirmado(c.valor).nombre === '',
  porQue: () => 'Marca las celdas que quieres guardar y escribe un nombre para el escenario, como «Optimista».',
};

const aplicarEscenario: ControlHojas = {
  gesto: (c) => {
    const { nombre, confirmado } = nombreYConfirmado(c.valor);
    if (!nombre) return null;
    return {
      comando: 'aplicar-escenario',
      args: { hoja: c.hoja, nombre, ...(confirmado ? { confirmado: 1 } : {}) },
    };
  },
  inerte: (c) => nombreYConfirmado(c.valor).nombre === '',
  porQue: () => 'Elige de la lista qué escenario quieres aplicar.',
};

const borrarEscenario: ControlHojas = {
  gesto: (c) => {
    const nombre = String(c.valor ?? '').trim();
    return nombre ? { comando: 'borrar-escenario', args: { hoja: c.hoja, nombre } } : null;
  },
  inerte: (c) => String(c.valor ?? '').trim() === '',
  porQue: () => 'Elige de la lista qué escenario quieres borrar.',
};

/**
 * Importar un `.csv` o un `.txt`. `ctx.valor` es el texto entero del archivo
 * —tal como lo pegaría o arrastraría el alumno— y la celda ancla es donde
 * está el cursor, como al pegar.
 */
const importarCsv: ControlHojas = {
  gesto: (c) => {
    if (!esUnaCelda(c.sel)) return null;
    const texto = String(c.valor ?? '');
    if (!texto.trim()) return null;
    return { comando: 'importar-csv', args: { hoja: c.hoja, celda: dir(c.sel.c0, c.sel.f0), texto } };
  },
  inerte: (c) => !esUnaCelda(c.sel) || !String(c.valor ?? '').trim(),
  porQue: () => 'Ponte en la celda donde quieres que empiece la tabla, y trae el texto del archivo .csv o .txt.',
};

/**
 * Quitar duplicados. Compara TODAS las columnas de lo marcado —no hay todavía
 * un cuadro que deje elegir un subconjunto— y la primera fila cuenta como
 * encabezado por omisión, que es lo que trae Excel marcado de fábrica.
 */
const quitarDuplicados: ControlHojas = {
  gesto: (c) =>
    c.sel.f0 === c.sel.f1
      ? null
      : {
          comando: 'quitar-duplicados',
          args: { hoja: c.hoja, rango: textoDeCaja(c.sel), ...(c.valor === 'confirmado' ? { confirmado: 1 } : {}) },
        },
  inerte: (c) => c.sel.f0 === c.sel.f1,
  porQue: () => 'Selecciona la tabla completa —todas las filas y columnas que quieres revisar— y vuelve a pulsar.',
};

/**
 * Relleno rápido. El origen es **la columna de al lado**, a la misma altura
 * que lo marcado: no se elige, se mira a la izquierda, que es lo que hace
 * Excel con Ctrl+E. La selección tiene que ser una sola columna, de al menos
 * dos filas, con la primera ya escrita a mano — el ejemplo.
 */
const rellenoRapido: ControlHojas = {
  gesto: (c) => {
    if (c.sel.c0 !== c.sel.c1 || c.sel.f0 === c.sel.f1 || c.sel.c0 === 0) return null;
    const origen = { c0: c.sel.c0 - 1, f0: c.sel.f0, c1: c.sel.c0 - 1, f1: c.sel.f1 };
    return {
      comando: 'relleno-rapido',
      args: { hoja: c.hoja, origen: textoDeCaja(origen), destino: textoDeCaja(c.sel) },
    };
  },
  inerte: (c) => c.sel.c0 !== c.sel.c1 || c.sel.f0 === c.sel.f1 || c.sel.c0 === 0,
  porQue: () =>
    'Escribe a mano el primer resultado junto a tus datos, selecciónalo junto con las celdas de abajo que quieres rellenar, y vuelve a pulsar.',
};

/* ── el formato condicional (bloques 30 y 46), los minigráficos (31) y el
 *    número personalizado (45) ──────────────────────────────────────────────
 *
 * Los nueve no tienen todavía una clase que los pinte —`n7-formato-condicional`
 * (Intermedio) y `of-excel-datos-limpios` (Avanzado) son las dueñas futuras—,
 * y por eso no viven en `PENDIENTES`: no son «aquí no se puede», son motor ya
 * cableado, listo para que la clase que los enseñe lo llame por su id
 * (§36.4). Se prueban con `gestosDe`, sin montar ninguna ventana — la misma
 * disciplina que ya dejó escrita el bloque 57 unas líneas más arriba.
 *
 * Ninguno de los cuadros de diálogo de Excel para esto —Administrador de
 * reglas, Nueva regla, Insertar minigráfico— existe todavía en esta ventana,
 * así que lo que ese cuadro pediría viaja **codificado en `ctx.valor`**, con
 * la misma disciplina que ya usan `bordes` y `buscarObjetivo`: un botón
 * mínimo hoy, sin inventarle a `ContextoCinta` un campo por cuadro que
 * todavía no se ha dibujado. El día que la clase pinte su propio panel, lo
 * que cambia es CÓMO se arma `ctx.valor` — el `gesto` de aquí abajo no se
 * entera.
 */

/** El nombre de la regla sale de la selección y de su clase, igual que `idDeGrafica`. */
const idDeRegla = (c: ContextoCinta, clase: string): string =>
  `r-${c.hoja}-${textoDeCaja(c.sel).replace(':', '-')}-${clase}`;

/** Barras, escala e iconos son el mismo botón con otra `clase` — como Autosuma y sus hermanas. */
function reglaDeUnColor(clase: 'barras' | 'escala' | 'iconos'): ControlHojas {
  return {
    gesto: (c) => ({
      comando: `regla-${clase}`,
      args: { hoja: c.hoja, id: idDeRegla(c, clase), rango: textoDeCaja(c.sel), ...(c.valor ? { color: String(c.valor) } : {}) },
    }),
    inerte: (c) => esUnaCelda(c.sel),
    porQue: () => 'Marca un rango de números —más de una celda— y vuelve a pulsar.',
  };
}

/** `"mayor:1000"`, `"entre:100:500"`, `"contiene:texto"`, `"duplicados"`. */
function comparacionDeValor(v: string | number | undefined): { comparacion: string; valor: string; valor2: string } | null {
  const [comparacion, ...resto] = String(v ?? '').split(':');
  if (comparacion === 'duplicados') return { comparacion, valor: '', valor2: '' };
  if (comparacion === 'mayor' || comparacion === 'menor' || comparacion === 'contiene') {
    return resto[0] ? { comparacion, valor: resto[0], valor2: '' } : null;
  }
  if (comparacion === 'entre') return resto[0] && resto[1] ? { comparacion, valor: resto[0], valor2: resto[1] } : null;
  return null;
}

const reglaDestacarControl: ControlHojas = {
  gesto: (c) => {
    const p = comparacionDeValor(c.valor);
    if (!p) return null;
    return { comando: 'regla-destacar', args: { hoja: c.hoja, id: idDeRegla(c, `destacar-${p.comparacion}`), rango: textoDeCaja(c.sel), ...p } };
  },
  inerte: (c) => esUnaCelda(c.sel) || !comparacionDeValor(c.valor),
  porQue: () =>
    'Marca un rango, y di con qué comparar: «mayor:1000», «menor:1000», «entre:100:500», «contiene:texto» o «duplicados».',
};

const reglaFormulaControl: ControlHojas = {
  gesto: (c) => {
    const formula = String(c.valor ?? '').trim();
    return formula ? { comando: 'regla-formula', args: { hoja: c.hoja, id: idDeRegla(c, 'formula'), rango: textoDeCaja(c.sel), formula } } : null;
  },
  inerte: (c) => esUnaCelda(c.sel) || !String(c.valor ?? '').trim(),
  porQue: () => 'Marca el rango y escribe la fórmula que decide, con «=» delante: por ejemplo «=$C4>1000».',
};

const borrarReglasControl: ControlHojas = {
  gesto: (c) => ({ comando: 'borrar-reglas', args: { hoja: c.hoja, ...(c.valor ? { id: String(c.valor) } : {}) } }),
};

const minigraficoControl: ControlHojas = {
  gesto: (c) => {
    const t = String(c.valor ?? '');
    const i = t.indexOf('|');
    const datos = i >= 0 ? t.slice(i + 1) : '';
    if (i < 0 || !datos || !esUnaCelda(c.sel)) return null;
    return { comando: 'minigrafico', args: { hoja: c.hoja, celda: dir(c.sel.c0, c.sel.f0), tipo: t.slice(0, i), datos } };
  },
  inerte: (c) => {
    const t = String(c.valor ?? '');
    const i = t.indexOf('|');
    return !esUnaCelda(c.sel) || i < 0 || !t.slice(i + 1);
  },
  porQue: () => 'Ponte en la celda donde quieres el minigráfico y di el tipo y de dónde come: «linea|A1:F1».',
};

const borrarMinigraficosControl: ControlHojas = {
  gesto: (c) => ({
    comando: 'borrar-minigraficos',
    args: { hoja: c.hoja, ...(c.valor === 'todos' ? {} : { celda: dir(c.sel.c0, c.sel.f0) }) },
  }),
};

const formatoPersonalizadoControl: ControlHojas = {
  gesto: (c) => {
    const patron = String(c.valor ?? '').trim();
    return patron ? { comando: 'formato-personalizado', args: { hoja: c.hoja, rango: textoDeCaja(c.sel), patron } } : null;
  },
  inerte: (c) => !String(c.valor ?? '').trim(),
  porQue: () => 'Escribe el patrón, al estilo Excel: por ejemplo «#,##0;[Rojo](#,##0)».',
};

/* ── consolidar y proteger — los bloques 53 y 54, grado Avanzado ────────────
 *
 * Seis botones nuevos para seis comandos que `comandos.ts` ya trae hechos y
 * probados (`motor-hojas-protege.test.ts`): lo que faltaba, otra vez, no era
 * el motor — era el domicilio en la cinta (la misma frase que dejó escrita
 * `tecniaHojas.ts` para `of-excel-datos-limpios`).
 *
 * `consolidar` es el único de los seis que pide un dato: las hojas de origen y
 * la operación no se pueden leer de la selección —viven en OTRAS hojas—, así
 * que viajan codificadas en `ctx.valor` con la misma disciplina que
 * `buscarObjetivo` («qué|cómo»): `origenes|operación`, reutilizando `dosCampos`
 * de más arriba. La celda de destino sí sale de la selección —su esquina
 * superior izquierda—, igual que hace Autosuma.
 *
 * Los otros cinco no piden nada: actúan sobre la hoja activa (o, en
 * `desbloquear-rango`, sobre el rango marcado) y dejan que `revisar()` —la
 * guarda central de `comandos.ts`— diga en una frase qué botón hay que pulsar
 * cuando algo no se puede. Por eso ninguno lleva `inerte`: un botón que se
 * negara a proteger una hoja ya protegida le quitaría al alumno el aviso que
 * es justamente la lección («proteger una hoja ya protegida se rechaza»,
 * fidelidad con Excel que el temario pide poder romper a propósito).
 */
const consolidarControl: ControlHojas = {
  gesto: (c) => {
    const campos = dosCampos(c.valor);
    if (!campos) return null;
    const [origenes, operacion] = campos;
    return {
      comando: 'consolidar',
      args: { hoja: c.hoja, origenes, destino: dir(c.sel.c0, c.sel.f0), operacion },
    };
  },
  inerte: (c) => !dosCampos(c.valor),
  porQue: () =>
    'Ponte en la celda donde quieres el primer resultado y escribe las hojas de origen —separadas por comas— y la operación, separadas por «|»: por ejemplo «Grupo A!B4:B6,Grupo B!B4:B6,Grupo C!B4:B6|suma».',
};

const protegerHojaControl: ControlHojas = {
  gesto: (c) => ({ comando: 'proteger-hoja', args: { hoja: c.hoja } }),
};

const desprotegerHojaControl: ControlHojas = {
  gesto: (c) => ({ comando: 'desproteger-hoja', args: { hoja: c.hoja } }),
};

const protegerLibroControl: ControlHojas = {
  gesto: () => ({ comando: 'proteger-libro' }),
};

const desprotegerLibroControl: ControlHojas = {
  gesto: () => ({ comando: 'desproteger-libro' }),
};

/** Desbloquea lo que esté marcado. Con la hoja aún sin proteger no pasa nada raro: es exactamente lo que hace Excel. */
const desbloquearRangoControl: ControlHojas = {
  gesto: (c) => ({ comando: 'desbloquear-rango', args: { hoja: c.hoja, rango: textoDeCaja(c.sel) } }),
};

/* ── validación, buscar/reemplazar/ir a, hipervínculos e inspeccionar ───────
 *
 * Los bloques 32, 39, 40 y 42, para `of-excel-validacion` y
 * `n6-interpreta-la-informacion`. Ninguna de las dos clases está construida
 * todavía —por eso ninguno de estos siete vive en `PENDIENTES`: no son «aquí
 * no se puede», son motor ya cableado, la misma disciplina que ya usan los
 * siete de Y-si y los nueve del formato condicional un poco más arriba en
 * este archivo—, y ninguno de los cuadros de diálogo que Excel les pondría
 * delante —Validación de datos, Buscar y reemplazar, Insertar hipervínculo—
 * existe todavía en esta ventana, así que lo que ese cuadro pediría viaja
 * **codificado en `ctx.valor`**, con la misma disciplina que `buscarObjetivo`
 * y `consolidar`.
 *
 * `buscar`, `ir-a`, `mostrar-formulas` e `inspeccionar` no viven aquí: no
 * tocan el libro, así que están en `SOLO_VENTANA` con `{ gesto: () => null }`
 * —la nota (2) de la cabecera de este archivo—. Lo que hacen de verdad son
 * `coincidencias()`, `resolverIrA()` e `inspeccionar()` en `consultas.ts`.
 */

/**
 * `"lista|Efectivo,Tarjeta,Transferencia|detener|Elige un método de pago"` o
 * `"numero|100-500|advertencia"` (el segundo `-` es opcional por cualquiera
 * de los dos lados: `"100-"` es «al menos 100» y `"-500"` es «como mucho
 * 500»).
 *
 * El tercer campo es `bloquea`, y llegó el 16-ago-2026 con
 * `of-excel-validacion` — el día que anunciaba esta misma nota, más arriba:
 * «el día que el panel real traiga las dos pestañas —Detener/Advertencia— es
 * cuando este texto gana un cuarto campo». `"detener"`, vacío, o cualquier
 * cosa que no sea `"advertencia"`/`"0"` deja `bloquea: true` — la misma
 * omisión de siempre, la que trae Excel de fábrica —, así que ningún control
 * viejo que sólo mandara tres campos (clase, datos, mensaje) se rompe: su
 * tercer campo pasa a leerse como `bloquea` y, al no decir «advertencia», seguirá
 * dando `true` exactamente igual que antes.
 */
const validarControl: ControlHojas = {
  gesto: (c) => {
    const t = String(c.valor ?? '');
    const [clase, datos = '', modoBloqueo = '', mensaje = ''] = t.split('|');
    if (!clase.trim() || !datos.trim()) return null;
    const args: Record<string, string | number> = { hoja: c.hoja, rango: textoDeCaja(c.sel), clase: clase.trim() };
    if (clase.trim() === 'lista') {
      args.lista = datos;
    } else {
      const [min, max] = datos.split('-');
      if (min?.trim()) args.min = Number(min);
      if (max?.trim()) args.max = Number(max);
    }
    const modo = modoBloqueo.trim().toLowerCase();
    if (modo === 'advertencia' || modo === '0') args.bloquea = 0;
    if (mensaje.trim()) args.mensaje = mensaje.trim();
    return { comando: 'validar', args };
  },
  inerte: (c) => {
    const [clase, datos] = String(c.valor ?? '').split('|');
    return !clase?.trim() || !datos?.trim();
  },
  porQue: () =>
    'Marca el rango, elige el tipo de regla —lista, número, fecha o longitud—, di qué se permite y si detiene o sólo advierte.',
};

const quitarValidacionControl: ControlHojas = {
  gesto: (c) => ({ comando: 'quitar-validacion', args: { hoja: c.hoja, rango: textoDeCaja(c.sel) } }),
};

/** `"IVA|impuesto|confirmado"` — qué buscar, por qué cambiarlo, y si ya se avisó cuántas fórmulas toca. */
const reemplazarControl: ControlHojas = {
  gesto: (c) => {
    const t = String(c.valor ?? '');
    const i = t.indexOf('|');
    if (i < 0) return null;
    const buscarTxt = t.slice(0, i);
    if (!buscarTxt) return null;
    const resto = t.slice(i + 1);
    const j = resto.indexOf('|');
    const reemplazo = j < 0 ? resto : resto.slice(0, j);
    const confirmado = j >= 0 && resto.slice(j + 1) === 'confirmado';
    return {
      comando: 'reemplazar',
      args: {
        hoja: c.hoja,
        rango: textoDeCaja(c.sel),
        buscar: buscarTxt,
        reemplazo,
        ...(confirmado ? { confirmado: 1 } : {}),
      },
    };
  },
  inerte: (c) => !String(c.valor ?? '').includes('|') || !String(c.valor ?? '').split('|')[0],
  porQue: () => 'Marca dónde buscar, y di qué buscar y por qué cambiarlo: «lo que busco|por esto».',
};

/** `"h2!A1"` o `"h2!A1|Ver el detalle"`. La celda es la que está seleccionada. */
const hipervinculoControl: ControlHojas = {
  gesto: (c) => {
    if (!esUnaCelda(c.sel)) return null;
    const t = String(c.valor ?? '').trim();
    if (!t) return null;
    const i = t.indexOf('|');
    const destino = (i < 0 ? t : t.slice(0, i)).trim();
    const texto = i < 0 ? '' : t.slice(i + 1).trim();
    if (!destino) return null;
    const args: Record<string, string | number> = { hoja: c.hoja, celda: dir(c.sel.c0, c.sel.f0), destino };
    if (texto) args.texto = texto;
    return { comando: 'hipervinculo', args };
  },
  inerte: (c) => !esUnaCelda(c.sel) || !String(c.valor ?? '').trim(),
  porQue: () => 'Ponte en la celda, y di a qué hoja y celda saltar: «h2!A1».',
};

const quitarHipervinculoControl: ControlHojas = {
  gesto: (c) =>
    esUnaCelda(c.sel) ? { comando: 'quitar-hipervinculo', args: { hoja: c.hoja, celda: dir(c.sel.c0, c.sel.f0) } } : null,
  inerte: (c) => !esUnaCelda(c.sel),
  porQue: () => 'Ponte en la celda que tiene el hipervínculo y vuelve a pulsar.',
};

/* ── los que todavía no tienen comando detrás ───────────────────────────────*/

/**
 * Existe, se ve, y dice **por qué** no responde y **dónde** aparecerá.
 *
 * Cada mensaje es distinto y nombra el bloque del temario (§45.2) al que
 * pertenece el botón. Un «aún no disponible» repetido veinte veces es ruido; una
 * frase que dice «esto llega con las gráficas, bloque 17» es un mapa del curso
 * puesto en el sitio donde el alumno preguntó.
 */
const porAhoraNo = (porQue: string): ControlHojas => ({
  gesto: () => null,
  inerte: () => true,
  porQue: () => porQue,
});

const PENDIENTES: Record<string, string> = {
  /*
   * Los siete del formato de celda —`subrayado`, los dos colores, `bordes`,
   * `ajustar-texto`, `combinar-centrar` y `copiar-formato`— salieron de esta
   * lista el 15-ago-2026, con los bloques 6, 9 y 10. Sus motivos decían qué les
   * faltaba y lo que les faltaba era todo lo mismo: un sitio donde guardarse
   * (`Formato` en `modelo.ts`) y, en dos casos, un sitio donde esperar
   * (`Hoja.combinadas` y la brocha de la ventana). Queda escrito aquí porque es
   * la mitad barata de la deuda: **un botón apagado con su motivo escrito se
   * enciende leyendo su propio recibo**.
   */
  /*
   * Los dos del ancho y el alto. El motivo cambió el 14-ago-2026 y el cambio es
   * de los que hay que explicar, porque el anterior MENTÍA: decía «es del bloque
   * 7, en la clase de celdas, filas y columnas», y esa clase se construyó ese
   * día —`n5-celdas-filas-columnas`— sin traerlos. Un botón que manda al alumno
   * a la clase en la que está es peor que uno que no dice nada.
   *
   * Y no se construyeron por una razón que conviene dejar por escrito para quien
   * los retome: **el ancho es barato y el alto no**. Las columnas se pintan con
   * `flex` y anchos propios, así que darles medidas distintas no rompe ninguna
   * cuenta; las filas, en cambio, se colocan en absoluto a `f * ALTO_FILA` y de
   * ahí sale también qué filas se pintan al desplazarse (`VentanaHojas.tsx`), o
   * sea que un alto variable convierte tres divisiones enteras en tres búsquedas
   * — que es justo lo que «cuadricular, no medir» (§39) evita. Hacer uno y el
   * otro no dejaría al alumno con media herramienta y con la mitad del bloque
   * enseñada, así que van juntos o no van. Mientras tanto dicen lo que SÍ se
   * puede mirar hoy, que es la mitad del bloque 7 que no necesita botón.
   */
  'ancho-columna':
    'Aquí todas las columnas miden lo mismo, así que todavía no se puede cambiar. Mientras tanto fíjate en lo que pasa: un texto que no cabe se ve cortado, pero el dato sigue entero — pulsa esa celda y léelo en la barra de fórmulas.',
  /*
   * El motivo del alto se volvió a escribir el 15-ago-2026, y hay que decir por
   * qué: el anterior mandaba a «Ajustar texto» para subir el alto, y desde ese
   * día Ajustar texto **existe y no sube el alto** —aprieta los renglones para
   * que quepan en el que hay—. Es el mismo defecto de la vez pasada con otra
   * cara: un botón apagado que promete lo que otro botón ya construido no hace.
   */
  'alto-fila':
    'Aquí todas las filas miden lo mismo, así que todavía no se puede cambiar. Fíjate en la diferencia: «Ajustar texto» sí funciona, pero como el alto no se puede mover, aprieta los renglones dentro de la celda en vez de estirarla hacia abajo.',
  /*
   * `buscar` y `mostrar-formulas` salieron de esta lista con el paquete
   * VALIDACIÓN (bloques 32, 39, 40 y 42): los dos viven ahora en
   * `SOLO_VENTANA`, un poco más abajo, junto a `ir-a` e `inspeccionar`, sus
   * dos vecinos nuevos del mismo paquete — ninguno de los cuatro cambia el
   * libro, así que ninguno puede ser un gesto (la nota (2) de la cabecera).
   * Lo que hace `buscar` de verdad —mirar el valor o la fórmula— vive en
   * `coincidencias()` (`consultas.ts`); lo que hace `mostrar-formulas` es
   * puro estado de la ventana (como `ver-cuadricula`).
   */
  'insertar-funcion':
    'El asistente de funciones sirve para buscar entre cientos. Aquí al lado tienes las seis que se usan todos los días; el asistente llega cuando haya muchas más.',
  'ver-encabezados':
    'Ocultar las letras y los números de los bordes no cambia el libro, cambia cómo lo ves. La ventana todavía no guarda tus preferencias de vista.',
  inmovilizar:
    'Inmovilizar la fila de títulos para que no se vaya al bajar es del bloque 36, en la clase de tablas y filtros.',
  zoom: 'El zoom no cambia el libro, cambia cómo lo ves. La ventana todavía no guarda tus preferencias de vista.',
  /*
   * Los tres de gráfica salieron de esta lista el 15-ago-2026, con el motor de
   * `Grafica.tsx`. Queda dicho aquí para el que venga: **`barras` y `dispersion`
   * existen en el modelo y no tienen botón**, porque la cinta del grado Básico
   * declara tres gráficos y sólo tres (`tecniaHojas.ts`, bloque 17). Los dos
   * entran con la clase del bloque 37 —«elegir la gráfica correcta»—, y entran
   * por su cinta, sin tocar este archivo: para eso está `ControlesDeClase`.
   */
};

/**
 * Los que **sí responden** pero no emiten gesto porque lo que cambian no está en
 * el libro. Hoy son el portapapeles; mañana serán las preferencias de vista.
 *
 * La ventana los necesita distinguidos de un botón inerte: un botón inerte se
 * pinta apagado y explica; éstos se pintan normales y hacen su trabajo fuera del
 * libro. Sin esta lista, `gestosDe` devolviendo `null` significaría dos cosas
 * distintas y el que escriba la cinta tendría que adivinar cuál.
 */
export const SOLO_VENTANA: ReadonlySet<string> = new Set([
  'copiar',
  'ver-cuadricula',
  'copiar-formato',
  /*
   * Los cuatro del paquete VALIDACIÓN (bloques 32, 39, 40 y 42) que no tocan
   * el libro: `buscar` mueve el cursor a lo que encuentra —el domicilio no
   * está en el libro, igual que el portapapeles—; `ir-a` es la misma
   * historia con un nombre o una dirección en vez de un texto que buscar;
   * `mostrar-formulas` es una preferencia de vista, como `ver-cuadricula`; e
   * `inspeccionar` sólo LEE el libro —un parte no es una escritura—.
   */
  'buscar',
  'ir-a',
  'mostrar-formulas',
  'inspeccionar',
  /*
   * Los dos del bloque 47 (`of-excel-auditoria`, 15-ago-2026): rastrear
   * precedentes y dependientes sólo LEE el grafo que ya guarda el motor
   * (`precedentesDe`/`dependientesDe`, `formula/calculo.ts`, expuestos en
   * `consultas.ts`) — no hay nada que escribir, así que no hay gesto que
   * emitir, la misma familia que `inspeccionar`.
   */
  'rastrear-precedentes',
  'rastrear-dependientes',
]);

/**
 * Los que **todavía no están construidos**, que no es lo mismo que los que aquí
 * no se pueden usar.
 *
 * Son dos estados distintos y la ventana los tiene que vestir distinto (§36.8):
 * «aún no disponible» es un botón que no existe todavía, y «aquí no se puede» es
 * un botón bien vivo que en este sitio no aplica —Pegar sin nada copiado, Ordenar
 * con una sola fila marcada—. Vestirlos igual le enseña al alumno que copiar algo
 * **rompió** el botón de pegar, que es exactamente el defecto que se midió en
 * Word y que aquí muerde más: en una hoja de cálculo la mitad de estos botones se
 * apagan y se encienden diez veces por clase.
 */
export const SIN_CONSTRUIR: ReadonlySet<string> = new Set(Object.keys(PENDIENTES));

/* ── la tabla ───────────────────────────────────────────────────────────────*/

export const CONTROLES: Record<string, ControlHojas> = {
  /* Inicio → Fuente · el bloque 9 */
  negrita: interruptor('negrita'),
  cursiva: interruptor('cursiva'),
  subrayado: interruptor('subrayado'),
  'color-letra': colorDeCelda('colorLetra', 'la letra'),
  'color-relleno': colorDeCelda('colorRelleno', 'el fondo de la celda'),
  bordes,

  /* Inicio → Alineación · los bloques 9 y 10 */
  'alinear-izquierda': alineacion('izquierda'),
  'alinear-centro': alineacion('centro'),
  'alinear-derecha': alineacion('derecha'),
  /*
   * Ajustar texto es un interruptor como la negrita, y aquí hace algo que en
   * Excel no: **no sube la fila**. El alto es constante en esta ventana
   * («cuadricular, no medir», §47.3), así que el texto se parte en renglones
   * apretados dentro del alto que hay. Se dice en la frase de guía y en el CSS,
   * y no se finge: un botón que promete un alto que no se mueve sería un botón
   * que miente en la única pantalla donde el alumno lo puede comprobar.
   */
  'ajustar-texto': interruptor('ajustarTexto'),
  'combinar-centrar': combinarYCentrar,
  /*
   * La brocha, que **no emite gesto y no está inerte** — por lo mismo que
   * `copiar`: lo que hace la primera pulsación es cargarse el formato de la
   * celda activa, y esa carga es estado de la ventana, no del libro. El gesto
   * sale en la segunda pulsación, cuando se suelta encima de otras celdas, y lo
   * emite la ventana con el formato entero dentro (`argsDeFormato`) para que la
   * macro suelte la misma pinta el año que viene.
   */
  'copiar-formato': { gesto: () => null },

  /* Inicio → Número · el bloque 6 entero */
  moneda: tipoDeNumero('moneda', 2),
  porcentaje: tipoDeNumero('porcentaje'),
  // «Millares» es el estilo de coma de Excel: número con separador de miles y
  // dos decimales. Aquí es el tipo `numero`, que es exactamente eso al pintarlo.
  millares: tipoDeNumero('numero', 2),
  'decimal-mas': decimales(1),
  'decimal-menos': decimales(-1),
  'formato-numero': {
    // El desplegable de la cinta. Sólo acepta los seis tipos que el modelo
    // conoce: un tipo inventado se guardaría en el libro y pintaría cualquier
    // cosa, y eso es un dato sucio metido por la puerta de la interfaz.
    gesto: (c) => {
      const t = String(c.valor ?? '') as TipoFormato;
      return TIPOS.includes(t) ? conFormato(c, { tipo: t }) : null;
    },
  },

  /*
   * Inicio → Celdas · el bloque 12 ENTERO desde el 14-ago-2026.
   *
   * Los cuatro se comportan como en Excel: **se inserta y se borra lo que esté
   * seleccionado**, así que con tres filas marcadas entran tres. Y los cuatro se
   * miden desde la esquina de la selección (`f0`, `c0`), que es de donde Excel
   * cuenta aunque se haya arrastrado de abajo hacia arriba.
   */
  'insertar-fila': {
    gesto: (c) => ({
      comando: 'insertarFila',
      args: { hoja: c.hoja, fila: c.sel.f0, cuantas: alto(c.sel) },
    }),
  },
  'borrar-fila': {
    gesto: (c) => ({
      comando: 'borrarFila',
      args: { hoja: c.hoja, fila: c.sel.f0, cuantas: alto(c.sel) },
    }),
  },
  'insertar-columna': {
    gesto: (c) => ({
      comando: 'insertarColumna',
      args: { hoja: c.hoja, columna: c.sel.c0, cuantas: ancho(c.sel) },
    }),
  },
  'borrar-columna': {
    gesto: (c) => ({
      comando: 'borrarColumna',
      args: { hoja: c.hoja, columna: c.sel.c0, cuantas: ancho(c.sel) },
    }),
  },

  /*
   * Inicio → Celdas · las dos de la HOJA, del bloque 16.
   *
   * Las dos actúan sobre `c.hoja` —la hoja donde está el cursor— y las dos
   * necesitan un dato que sólo puede dar la ventana: a qué lugar se mueve la
   * lengüeta y de qué color se pinta. Llegan por `valor`, igual que el
   * desplegable de formato de número, y **sin ese dato el botón se apaga y lo
   * dice** en vez de inventarse un lugar o un color: mover una hoja «a algún
   * sitio» es de las cosas que el alumno no sabría deshacer.
   */
  'mover-hoja': {
    gesto: (c) => {
      const n = lugarDeHoja(c);
      return n === null ? null : { comando: 'moverHoja', args: { hoja: c.hoja, posicion: n } };
    },
    inerte: (c) => lugarDeHoja(c) === null,
    porQue: () =>
      'Para mover una hoja hay que decir a qué lugar va: arrastra su lengüeta de abajo hasta donde la quieras, o elige el sitio en la lista.',
  },
  'color-hoja': {
    gesto: (c) => (esColor(c.valor) ? { comando: 'colorHoja', args: { hoja: c.hoja, color: String(c.valor) } } : null),
    inerte: (c) => !esColor(c.valor),
    porQue: () =>
      'Elige un color de la paleta para la lengüeta de esta hoja. El color es sólo para encontrarla rápido: no cambia ni un dato de dentro.',
  },

  /*
   * Vista → Mostrar · la cuadrícula NO es un gesto y aun así responde.
   *
   * Es el primer inquilino de `SOLO_VENTANA` que no es el portapapeles, y por
   * eso conviene decirlo aquí: quitar las líneas no cambia ni un dato del libro,
   * así que un gesto sería una mentira grabada en la macro. Lo hace la ventana.
   * Estuvo en `PENDIENTES` hasta el 14-ago-2026, y ahí había un defecto de los
   * que no se ven: la ventana YA sabía apagarla —tiene su estado y su clase CSS—
   * pero `pulsar` comprueba `inerte` antes que nada, así que el botón contestaba
   * «todavía no» y su código no se ejecutaba nunca. Un botón construido dos
   * veces y apagado en una.
   */
  'ver-cuadricula': { gesto: () => null },

  /* Inicio → Modificar · el bloque 8, autorrelleno */
  'rellenar-abajo': {
    gesto: (c) => ({ comando: 'rellenarAbajo', args: { hoja: c.hoja, rango: textoDeCaja(c.sel) } }),
    // Con una sola fila seleccionada no hay hacia dónde rellenar y el botón no
    // haría nada. Un botón que se deja pulsar y no hace nada le enseña al alumno
    // que el programa falla; apagado con su motivo le enseña a seleccionar.
    inerte: (c) => c.sel.f0 === c.sel.f1,
    porQue: () =>
      'Selecciona la celda que ya tiene la fórmula y también las de abajo que quieres rellenar, y vuelve a pulsar.',
  },
  'rellenar-derecha': {
    gesto: (c) => ({ comando: 'rellenarDerecha', args: { hoja: c.hoja, rango: textoDeCaja(c.sel) } }),
    inerte: (c) => c.sel.c0 === c.sel.c1,
    porQue: () =>
      'Selecciona la celda que ya tiene la fórmula y también las de la derecha que quieres rellenar, y vuelve a pulsar.',
  },
  /*
   * La otra mitad del bloque 8, y la que el alumno cree que es «el»
   * autorrelleno: escribir `1` y `2`, marcar hasta abajo, y que salgan `3, 4, 5`.
   *
   * **La dirección se deduce de la forma de la selección** y no se pregunta: una
   * selección más alta que ancha se rellena hacia abajo y una más ancha que alta
   * hacia la derecha. En Excel esto es «Rellenar → Series…», un cuadro de diálogo
   * con cuatro grupos de opciones; aquí es lo que el alumno ya dijo al marcar el
   * rango. Un cuadro de diálogo para repetir lo que acabas de señalar con el
   * ratón es un cuadro de diálogo de más.
   */
  'rellenar-serie': {
    /*
     * `valor` manda sobre la forma, y esa línea la pagó el cuadrito de relleno.
     *
     * Deducir la dirección de la forma de la selección es lo único que puede
     * hacer un botón de la cinta —nadie le dijo hacia dónde—, pero **quien
     * arrastra sí lo sabe**: al estirar `D4:D5` hacia la derecha, la selección
     * queda de dos por dos y la forma contesta «abajo», que es justo lo
     * contrario de lo que el alumno acaba de hacer con el ratón. El resultado no
     * era un error: era un arrastre que **no hacía absolutamente nada** —las dos
     * celdas de arriba ya estaban llenas y las de abajo no eran el destino—, que
     * es la peor manera de fallar de un gesto nuevo.
     */
    gesto: (c) => ({
      comando: 'rellenarSerie',
      args: {
        hoja: c.hoja,
        rango: textoDeCaja(c.sel),
        direccion:
          c.valor === 'abajo' || c.valor === 'derecha' ? c.valor : alto(c.sel) > 1 ? 'abajo' : 'derecha',
      },
    }),
    inerte: (c) => esUnaCelda(c.sel),
    porQue: () =>
      'Escribe los dos primeros —1 y 2, o enero y febrero—, selecciónalos junto con las celdas vacías que quieres llenar, y vuelve a pulsar.',
  },
  'borrar-contenido': {
    gesto: (c) => ({ comando: 'borrar', args: { hoja: c.hoja, rango: textoDeCaja(c.sel) } }),
  },

  /* Inicio → Portapapeles · ver la nota (2) de la cabecera */
  copiar: { gesto: () => null },
  /*
   * Pegar hace **dos cosas distintas según cómo se guardó lo que se va a
   * soltar**, y esa es la mitad del bloque 11 que no se puede enseñar con
   * palabras: lo copiado se estampa —y las fórmulas se corrigen para su nuevo
   * sitio—; lo cortado se **muda**, o sea que además se vacía el origen y las
   * fórmulas siguen mirando exactamente lo mismo de antes.
   *
   * Que las dos vivan en el mismo botón no es un ahorro: es lo que hace el
   * programa de verdad, y es lo que permite que el alumno aprenda que Cortar no
   * mueve nada — **el que mueve es Pegar** —. Hasta el 15-ago-2026 esto no se
   * podía hacer y había que pulsar Cortar dos veces (ver `ContextoCinta.corte`).
   */
  pegar: {
    gesto: (c) => (sinOrigen(c) ? null : c.corte ? moverDatos(c) : pegado(c, {})),
    inerte: (c) => sinOrigen(c) || (c.corte === true && seEncimaElCorte(c)),
    porQue: (c) =>
      c.corte ? NO_CABE_ENCIMA : 'Todavía no has copiado nada: selecciona algo y pulsa Copiar primero.',
  },
  /*
   * El pegado especial, en dos botones y no en un cuadro de diálogo con
   * pestañas. En Excel esto es «Pegado especial…» y una ventana con quince
   * casillas; aquí son las dos que paga el bloque 11 y que además son las dos que
   * un niño entiende que son distintas: **traerse el resultado sin la fórmula** y
   * **traerse la pinta sin el dato**. Un cuadro con quince casillas enseña la
   * ventana de Excel; dos botones enseñan la idea.
   */
  'pegar-valores': {
    // `ahora` viaja en el gesto por lo mismo que `nuevaHoja` lleva su `id`: si lo
    // congelado es un `=HOY()`, la macro tiene que dar el mismo libro el año que
    // viene. Es la regla de la cabecera de `comandos.ts`, aplicada donde muerde.
    gesto: (c) => (sinOrigen(c) ? null : pegado(c, { modo: 'valores', ahora: c.motor.contexto.ahora })),
    inerte: sinOrigen,
    porQue: () =>
      'Copia primero lo que quieras congelar. Esto trae el resultado y deja la fórmula atrás: lo pegado ya no se recalcula.',
  },
  'pegar-formato': {
    gesto: (c) => (sinOrigen(c) ? null : pegado(c, { modo: 'formato' })),
    inerte: sinOrigen,
    porQue: () =>
      'Copia primero la celda que tiene la pinta que quieres. Esto trae sólo el formato —la letra, el color, el tipo de número— y no toca lo que hay escrito.',
  },
  /*
   * Cortar **es mover**, y por eso emite dos gestos y no cero (ver la cabecera).
   *
   * Dos decisiones de contrato que la ventana tiene que conocer:
   *
   *   1. `valor` trae el **origen** —lo que se cortó— y `sel` es el **destino**,
   *      exactamente igual que en `pegar`. `sel` siempre es «dónde está el cursor
   *      ahora»; `valor` siempre es «lo que la ventana se guardó».
   *   2. Sin origen devuelve `null` y **no se pone inerte**. Es a propósito: la
   *      primera pulsación —marcar lo que se va a mover— es estado de la ventana
   *      y la ventana tiene que poder atenderla. Un `inerte` aquí repetiría el
   *      defecto de `ver-cuadricula`: `pulsar` comprueba `inerte` antes que nada,
   *      así que el botón contestaría «todavía no» y el código de la ventana no
   *      se ejecutaría nunca.
   */
  cortar: {
    gesto: (c) => (sinOrigen(c) ? null : moverDatos(c)),
    inerte: seEncimaElCorte,
    porQue: () => NO_CABE_ENCIMA,
  },

  /* Fórmulas → Biblioteca · los bloques 13, 14 y 15 */
  autosuma: funcion('SUMA'),
  'fn-suma': funcion('SUMA'),
  'fn-promedio': funcion('PROMEDIO'),
  'fn-max': funcion('MAX'),
  'fn-min': funcion('MIN'),
  'fn-contar': funcion('CONTAR'),
  'fn-contara': funcion('CONTARA'),

  /* Datos → Ordenar · el bloque 19 */
  'ordenar-az': ordenar(false),
  'ordenar-za': ordenar(true),

  /* Insertar → Gráficos · los bloques 17 y 18 */
  'grafico-columnas': graficaDe('columnas'),
  'grafico-lineas': graficaDe('lineas'),
  'grafico-circular': graficaDe('circular'),

  /* Datos → Análisis Y si · el bloque 57, grado Avanzado */
  'buscar-objetivo': buscarObjetivo,
  'guardar-escenario': guardarEscenario,
  'aplicar-escenario': aplicarEscenario,
  'borrar-escenario': borrarEscenario,

  /* Datos → Herramientas de datos · los bloques 43 y 44, grado Avanzado */
  'importar-csv': importarCsv,
  'quitar-duplicados': quitarDuplicados,
  'relleno-rapido': rellenoRapido,

  /* Inicio → Estilos y Datos → Herramientas de datos · los bloques 30, 31, 45
     y 46, para las clases de grado Intermedio y Avanzado que aún no existen */
  'regla-barras': reglaDeUnColor('barras'),
  'regla-escala': reglaDeUnColor('escala'),
  'regla-iconos': reglaDeUnColor('iconos'),
  'regla-destacar': reglaDestacarControl,
  'regla-formula': reglaFormulaControl,
  'borrar-reglas': borrarReglasControl,
  minigrafico: minigraficoControl,
  'borrar-minigraficos': borrarMinigraficosControl,
  'formato-personalizado': formatoPersonalizadoControl,

  /* Datos → Herramientas de datos y Revisar → Proteger · los bloques 53 y 54,
     grado Avanzado (`of-excel-consolida-y-protege`) */
  consolidar: consolidarControl,
  'proteger-hoja': protegerHojaControl,
  'desproteger-hoja': desprotegerHojaControl,
  'proteger-libro': protegerLibroControl,
  'desproteger-libro': desprotegerLibroControl,
  'desbloquear-rango': desbloquearRangoControl,

  /* Datos → Herramientas de datos y Revisar · los bloques 32, 39, 40 y 42,
     para `of-excel-validacion` y `n6-interpreta-la-informacion` */
  validar: validarControl,
  'quitar-validacion': quitarValidacionControl,
  buscar: { gesto: () => null },
  'ir-a': { gesto: () => null },
  reemplazar: reemplazarControl,
  hipervinculo: hipervinculoControl,
  'quitar-hipervinculo': quitarHipervinculoControl,
  'mostrar-formulas': { gesto: () => null },
  inspeccionar: { gesto: () => null },

  /* Fórmulas → Auditoría de fórmulas · el bloque 47, para `of-excel-auditoria`.
     No tocan el libro: viven arriba, en `SOLO_VENTANA`, con su motivo escrito. */
  'rastrear-precedentes': { gesto: () => null },
  'rastrear-dependientes': { gesto: () => null },

  /* Datos → Macros · los bloques 55 y 56, para `of-excel-macros` (15-ago-2026).
   *
   * Ninguna de las dos clases está construida todavía —por eso ninguno de
   * estos cinco vive en `PENDIENTES`: no son «aquí no se puede», son motor ya
   * cableado, la misma disciplina que ya usan los siete del paquete
   * VALIDACIÓN aquí arriba—. El cuadro que Excel les pondría delante —nombre
   * de la macro, qué botón, qué macro asignarle— no existe todavía en esta
   * ventana, así que viaja codificado en `ctx.valor`, con la misma
   * disciplina que `reemplazar` e `hipervinculo`.
   */
  'grabar-macro': {
    gesto: (c) => {
      const t = String(c.valor ?? '').trim();
      if (!t) return null;
      const [nombre, marca] = t.split('|');
      if (!nombre?.trim()) return null;
      const args: Record<string, string | number> = { nombre: nombre.trim() };
      if (marca === 'confirmado') args.confirmado = 1;
      return { comando: 'grabar-macro', args };
    },
    inerte: (c) => !String(c.valor ?? '').split('|')[0]?.trim(),
    porQue: () => 'Escribe el nombre de la macro y pulsa para empezar a grabar.',
  },
  // Sin argumentos: la grabadora ya sabe qué nombre y qué gestos lleva
  // (`ejecutarVarios`, en `comandos.ts`) — no se le vuelve a preguntar,
  // igual que Excel no lo pregunta al detener.
  'parar-macro': { gesto: () => ({ comando: 'parar-macro' }) },
  'ejecutar-macro': {
    gesto: (c) => {
      const nombre = String(c.valor ?? '').trim();
      return nombre ? { comando: 'ejecutar-macro', args: { nombre } } : null;
    },
    inerte: (c) => !String(c.valor ?? '').trim(),
    porQue: () => 'Elige de la lista qué macro ejecutar, de las que ya grabaste.',
  },
  'borrar-macro': {
    gesto: (c) => {
      const nombre = String(c.valor ?? '').trim();
      return nombre ? { comando: 'borrar-macro', args: { nombre } } : null;
    },
    inerte: (c) => !String(c.valor ?? '').trim(),
    porQue: () => 'Elige de la lista qué macro borrar, de las que ya grabaste.',
  },
  /** `"boton1|MiMacro"` — a qué botón, y qué macro dispara. */
  'asignar-macro': {
    gesto: (c) => {
      const t = String(c.valor ?? '');
      const i = t.indexOf('|');
      if (i < 0) return null;
      const boton = t.slice(0, i).trim();
      const macro = t.slice(i + 1).trim();
      return boton && macro ? { comando: 'asignar-macro', args: { boton, macro } } : null;
    },
    inerte: (c) => {
      const [boton, macro] = String(c.valor ?? '').split('|');
      return !boton?.trim() || !macro?.trim();
    },
    porQue: () => 'Di a qué botón y qué macro: «boton1|MiMacro».',
  },

  /* Los que existen, informan, y todavía no hacen */
  ...Object.fromEntries(Object.entries(PENDIENTES).map(([id, porQue]) => [id, porAhoraNo(porQue)])),
};

/* ── las cuatro preguntas que la ventana le hace a un botón ─────────────────*/

const buscar = (id: string, deLaClase?: ControlesDeClase): ControlHojas | undefined =>
  deLaClase?.[id] ?? CONTROLES[id];

/** ¿Está declarado en alguna tabla? */
export const existe = (id: string, deLaClase?: ControlesDeClase): boolean => !!buscar(id, deLaClase);

/**
 * ¿Está construido? Falso ⇒ el botón dice «aún no disponible» y no castiga.
 *
 * Un control que aporta la clase está construido por definición, aunque el motor
 * lo tenga en `PENDIENTES`: ésa es justamente la puerta por la que una clase
 * enciende un botón apagado (§36.4).
 */
export function estaConstruido(id: string, deLaClase?: ControlesDeClase): boolean {
  if (deLaClase?.[id]) return true;
  return Boolean(CONTROLES[id]) && !SIN_CONSTRUIR.has(id);
}

/**
 * Lo que la ventana llama al pulsar. Mira primero los controles de la clase.
 *
 * Devuelve **siempre una lista**, porque hay botones que son varios gestos
 * —autosuma sobre una tabla, ordenar— y quien llama no tiene por qué saber
 * cuáles: los pasa todos por `ejecutar` en fila y la grabadora los apunta en
 * orden.
 *
 * Y comprueba `inerte` **antes** de pedir el gesto. Es la guarda que impide que
 * un botón apagado grabe algo en la macro: sin ella bastaría con que la ventana
 * se despistara pintando el botón para que la macro se llenara de gestos que el
 * alumno no llegó a hacer.
 */
export function gestosDe(ctx: ContextoCinta, id: string, deLaClase?: ControlesDeClase): Gesto[] | null {
  const c = buscar(id, deLaClase);
  if (!c || c.inerte?.(ctx)) return null;
  const g = c.gesto(ctx);
  if (g === null) return null;
  const lista = Array.isArray(g) ? g : [g];
  return lista.length ? lista : null;
}

/** ¿Se pinta hundido? */
export function estaActivo(ctx: ContextoCinta, id: string, deLaClase?: ControlesDeClase): boolean {
  return buscar(id, deLaClase)?.activo?.(ctx) ?? false;
}

/** ¿Existe pero aquí no se puede? Lo que no existe se pinta apagado también. */
export function estaInerte(ctx: ContextoCinta, id: string, deLaClase?: ControlesDeClase): boolean {
  const c = buscar(id, deLaClase);
  if (!c) return true;
  return c.inerte?.(ctx) ?? false;
}

/** El motivo que da quien lo apagó, si es que da alguno (§44.1). */
export function razonInerte(ctx: ContextoCinta, id: string, deLaClase?: ControlesDeClase): string | undefined {
  return buscar(id, deLaClase)?.porQue?.(ctx);
}

/** Los ids que la cinta puede pintar hoy. Para la prueba de contrato y el banco. */
export const IDS_DE_CONTROL: string[] = Object.keys(CONTROLES);
