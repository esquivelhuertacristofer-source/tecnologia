import type { EditorView } from 'prosemirror-view';
import type { ControlesDeClase } from '@/components/office/motor/comandos';
import { ESTADO } from './estado';

/**
 * Las cuatro herramientas que aporta esta clase.
 *
 * Ninguna toca `comandos.ts`: se declaran aquí y se le pasan a la ventana en la
 * prop `controles`, que es la vía que el motor abre para que una clase añada lo
 * suyo sin editar el motor.
 *
 * ── TRES DECISIONES DE COMPORTAMIENTO ───────────────────────────────────────
 *
 * **«Encabezado» y «Pie de página» ABREN, no alternan.** Un interruptor aquí es
 * una trampa: el alumno que curioseó el botón antes de que se lo pidieran
 * llegaría al encargo con la zona ya abierta, la pulsaría como se le manda… y
 * se le cerraría. Pulsar «Encabezado» estando dentro del encabezado no cambia
 * nada y devuelve `true`, que es exactamente la regla que el motor fijó en
 * §36.8 para los comandos de formato: *un botón está vivo si el sitio admite lo
 * que hace, aunque ya lo tenga puesto*. La zona se cierra con su botón
 * «Cerrar», con Escape o pulsando en el cuerpo del documento, igual que en Word.
 *
 * **«Número de página» PONE el número, y tampoco alterna.** Aquí el interruptor
 * sí estaba puesto y se cazó jugando mal: un alumno que curiosea el botón antes
 * de que se lo pidan llega al encargo 6 con el número ya puesto, lo pulsa como
 * se le manda… y **se lo quita**. Medido: el encargo no avanzaba, le cobraba un
 * tropiezo y le sacaba la pista por hacer justo lo que decía el panel. Poner un
 * número es una acción, no un estado que se conmuta con el mismo dedo. Quitarlo
 * también se puede —en Word es otro comando, «Quitar números de página»— y aquí
 * vive donde se ve el número: en la propia franja del pie, mientras se edita.
 * Además abre el pie, porque es donde acaba de aparecer el número: así el alumno
 * aterriza mirando la franja de abajo sin pulsar un botón de más.
 *
 * **El aviso al motor se registra, no se pasa por parámetro.** Los controles son
 * una constante de módulo y no un objeto que se rehace en cada render: así el
 * laboratorio no tiene que memorizarlos ni pasarles nada durante el render, y el
 * puente con la ventana —una transacción vacía que hace que el motor vuelva a
 * corregir— se enchufa con un efecto, que es donde se enchufan las cosas.
 *
 * ── Y LA CUARTA, QUE ES DE §37 ──────────────────────────────────────────────
 *
 * **Un desvío no llega a tocar el estado.** El motor promete que pulsar el botón
 * equivocado nombra lo que se pulsó, explica qué hace y **deshace el cambio
 * accidental**; ese deshacer es el de ProseMirror, así que alcanza a lo que vive
 * en el documento y a nada más. Las cuatro herramientas de esta clase no viven
 * en el documento —ése es literalmente el tema— y por eso su desvío se le
 * escapaba. Medido el 10-ago-2026: en el encargo «Abre el encabezado» se pulsó
 * «Número de página» y **quedaron los números 1, 2 y 3 puestos en las tres
 * hojas**, con el pie abierto encima; el recado salía correcto y el documento se
 * ensuciaba igual. Peor todavía: dos encargos después, el del número **se daba
 * por hecho solo**, así que el alumno se saltaba entero uno de los cuatro temas
 * de la clase y encima había pagado un tropiezo por él.
 *
 * Aquí no hace falta deshacer nada: basta con no hacerlo. Si el encargo de ahora
 * pide un botón concreto y el pulsado es otro, la herramienta se abstiene y
 * devuelve `false`. El recado de tres partes lo pinta el motor igual —no mira lo
 * que devolvió `hacer`—, así que el alumno sigue enterándose de qué tocó y
 * adónde tiene que ir; lo único que cambia es que el documento queda idéntico.
 * Fuera de los encargos que piden un botón, la cinta está abierta y explorar no
 * cuesta nada, que es como tiene que ser.
 */

let avisar: (v: EditorView) => void = () => {};

/** El laboratorio registra aquí lo que hay que hacer tras cada pulsación. */
export function fijarAviso(fn: (v: EditorView) => void) {
  avisar = fn;
}

let controlDelEncargo: () => string | undefined = () => undefined;

/**
 * El laboratorio registra aquí qué control está pidiendo el encargo de ahora.
 *
 * Devuelve `undefined` cuando el encargo no pide pulsar nada —decidir, teclear,
 * hacer nacer una hoja—, y entonces la cinta entera está permitida.
 */
export function fijarEncargo(fn: () => string | undefined) {
  controlDelEncargo = fn;
}

/** ¿Esta pulsación es el desvío de un encargo que pedía otro botón? */
function esDesvio(id: string): boolean {
  const esperado = controlDelEncargo();
  return Boolean(esperado && esperado !== id);
}

const tras = (v: EditorView) => {
  avisar(v);
  return true;
};

export const CONTROLES: ControlesDeClase = {
  plantilla: {
    hacer: (v) => {
      if (esDesvio('plantilla')) return false;
      ESTADO.galeria = true;
      ESTADO.zona = 'ninguno';
      return tras(v);
    },
    activo: () => ESTADO.galeria,
  },

  encabezado: {
    hacer: (v) => {
      if (esDesvio('encabezado')) return false;
      ESTADO.zona = 'encabezado';
      ESTADO.galeria = false;
      return tras(v);
    },
    activo: () => ESTADO.zona === 'encabezado',
  },

  pie: {
    hacer: (v) => {
      if (esDesvio('pie')) return false;
      ESTADO.zona = 'pie';
      ESTADO.galeria = false;
      return tras(v);
    },
    activo: () => ESTADO.zona === 'pie',
  },

  numero: {
    hacer: (v) => {
      if (esDesvio('numero')) return false;
      ESTADO.numeroDePagina = true;
      ESTADO.zona = 'pie';
      ESTADO.galeria = false;
      return tras(v);
    },
    activo: () => ESTADO.numeroDePagina,
  },
};
