import type { GuionClase, PasoClase } from '@/components/office/motor/guion';
import { publicar } from './pizarra';
import { DOCUMENTO, escrito, RENGLONES } from './renglones';

/**
 * `p-la-fila-guia` · «La fila guía» — guion de la clase.
 *
 * Puerto de `n3-la-fila-guia` al motor de Tecnia Textos. Lo que enseña la clase
 * no se toca: colocar los ocho dedos en A S D F · J K L Ñ, reconocer las
 * rayitas de la F y la J, hacer el espacio con los pulgares y visitar las filas
 * vecinas volviendo siempre a casa. Lo que cambia es dónde se teclea: ya no hay
 * un teclado de madera con casillas, hay una hoja de práctica de verdad en un
 * procesador de textos de verdad.
 *
 * Cuatro decisiones cargan la forma de los encargos:
 *
 *  · **Ningún encargo lleva señalador de cinta, y eso no es un olvido (§37).**
 *    El modo guía manda que todo encargo que se resuelva PULSANDO algo lleve
 *    `senal.control`, para que salgan el señalador con su rótulo, la ficha de
 *    la herramienta y «Enséñamelo». Aquí los seis encargos se resuelven
 *    TECLEANDO, y §37.4 lo dice con todas sus letras: se guía la mano, no la
 *    cabeza — señalar la cinta en una clase de mecanografía sería mandar al
 *    alumno justo a donde no está el ejercicio. Recorridos uno por uno: 6 de 6
 *    encargos de teclear, 0 con señalador de cinta, a propósito.
 *
 *    Lo que el motor pone en la cinta, esta clase lo pone en el teclado: el
 *    teclado guía de abajo enciende la tecla siguiente (señalador), la nombra y
 *    dice con qué dedo se pulsa (rótulo y ficha), y a la mayúscula le enciende
 *    además el Mayús de la mano contraria. Señala sin hacer el trabajo: nadie
 *    teclea por el alumno. Ni uno solo de los seis encargos se queda sin esa
 *    ayuda — medido encargo por encargo el 10-ago-2026.
 *
 *  · **Se corrige leyendo el documento, con mayúsculas y todo.** Un encargo está
 *    hecho cuando en la hoja hay un renglón cuyo texto es exactamente el modelo.
 *    Ni se mira qué teclas se pulsaron ni en qué bloque cayó el texto: si el
 *    renglón está ahí, está hecho, y si el alumno lo borra deja de estarlo —de
 *    eso ya se ocupa el motor, que revisa los encargos palomeados en cada
 *    cambio—.
 *
 *  · **El encargo 5 provoca el error típico.** Pedir una mayúscula a un niño de
 *    ocho años es pedirle que descubra Bloq Mayús, y lo que sale es «HOY ES
 *    LUNES». La comprobación distingue mayúsculas de minúsculas justamente para
 *    que ese renglón NO pase, y la pista dice qué tecla está encendida y cómo se
 *    apaga. Es el mismo papel que en la clase 1 hacía elegir 20 pt sin nada
 *    seleccionado: un fracaso barato que enseña de una vez.
 *
 *  · **Entrar es parte del ejercicio.** En el juego viejo no existía; en un
 *    documento es lo que separa un renglón del siguiente, y sin ella el alumno
 *    escribe el renglón nuevo pegado al anterior y desbarata el que ya tenía
 *    hecho. Por eso cada instrucción empieza mandando pulsarla y el teclado guía
 *    enciende la tecla Entrar en cuanto un renglón queda completo.
 */

/**
 * El encargo número `i`.
 *
 * `comprueba` publica de paso la instantánea que alimenta al teclado guía: es
 * el único momento en el que alguien tiene el documento de verdad en la mano, y
 * que el teclado mire exactamente lo mismo que el maestro corrige es lo que
 * impide que se contradigan. Ver `pizarra.ts`.
 */
function encargo(i: number): PasoClase {
  const r = RENGLONES[i];
  return {
    id: r.id,
    titulo: r.titulo,
    instruccion: r.instruccion,
    pista: r.pista,
    logro: {
      tipo: 'documento',
      comprueba: (doc) => {
        publicar(doc);
        return escrito(doc, r.modelo);
      },
    },
    aprendido: r.aprendido,
  };
}

export const GUION: GuionClase = {
  archivo: 'Práctica de mecanografía.docx',
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Grado básico · Clase 3 de 3',
    tema: 'Mecanografía — la fila guía del teclado',
    objetivo:
      'Que al terminar pongas los ocho dedos en su sitio sin pensarlo y escribas renglones enteros mirando la pantalla, no las teclas.',
    vasAHacer: [
      'Colocar las manos: A S D F la izquierda, J K L Ñ la derecha. La F y la J tienen una rayita.',
      'Escribir seis renglones en la hoja del taller, uno por encargo.',
      'Hacer el espacio con los pulgares, sin mover los otros dedos.',
      'Subir a la fila de arriba y bajar a la de abajo, volviendo siempre a tu tecla.',
      'Hacer UNA mayúscula con la tecla Mayús, sin que se te ponga todo en MAYÚSCULAS.',
    ],
    requisitos: 'Nada. Se empieza colocando las manos, y no hace falta escribir rápido.',
    /*
     * La última frase se dice ANTES y no después del primer clic perdido.
     * En las demás clases de la sala el señalador de la cinta apunta al botón
     * del encargo; en ésta no hay ninguno que apunte, porque los seis encargos
     * se escriben. Decirlo aquí ahorra el paseo por unos botones que en esta
     * clase no llevan a nada — y que, de camino, bajan la nota.
     */
    ayuda:
      'Abajo tienes el teclado guía: enciende en azul la tecla que toca y te dice con qué dedo se pulsa. Si escribes una letra que no era, te avisa para que la borres con Retroceso (⌫). No hay reloj que te apure. Los botones de arriba no se usan en esta clase: aquí se escribe con el teclado.',
  },

  pasos: RENGLONES.map((_, i) => encargo(i)),

  /*
   * Lo que se lee al terminar. Estuvo clavado en la ventana con la lección de
   * la clase 1 —«ya sabes buscar una herramienta por lo que hace»— y salía en
   * las diecinueve; aquí la lección es otra, y se dice en voz de lo que el
   * alumno YA SABE HACER, no de lo que la clase le enseñó.
   */
  cierre:
    'Ya sabes volver a poner los ocho dedos en su casa —A S D F y J K L Ñ—, hacer el espacio con los pulgares y una mayúscula con Mayús. Eso es teclear, y sirve para todo lo que escribas en la computadora.',
};
