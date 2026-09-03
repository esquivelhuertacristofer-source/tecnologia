import { CINTA_BASICO, type Pestana } from '@/components/activities/office/tecniaTextos';
import { QUE_HACE } from '@/components/office/motor/guia';

/**
 * La cinta de `of-word-guardar-e-imprimir`: la del grado Básico más un grupo.
 *
 * ── DÓNDE VIVEN DE VERDAD ESTAS TRES HERRAMIENTAS ───────────────────────────
 * En Word, Guardar como e Imprimir viven detrás de la pestaña **Archivo**, en la
 * pantalla que Microsoft llama Backstage. Aquí no pueden vivir ahí: la pestaña
 * Archivo la pinta la ventana —`VentanaTextos`, que es del motor y no de esta
 * clase—, está apagada a propósito y contesta «eso lo verás en otra clase», que
 * es precisamente ESTA clase. Habilitarla es un cambio en el motor y está pedido
 * en el cableado.
 *
 * Mientras tanto, las tres herramientas se declaran en un grupo propio de la
 * pestaña Inicio, con el nombre **Archivo** para que el rótulo siga siendo el
 * mapa —que es lo que enseñó `of-word-la-cinta`— y para que el día que el
 * Backstage exista el alumno reconozca la palabra. La portada de la práctica lo
 * dice con todas sus letras, porque mentir sobre dónde están las cosas en el
 * Word de la escuela sería peor que la propia limitación.
 *
 * El grupo va DESPUÉS de Estilos, al final de la pestaña, y no antes: los cuatro
 * grupos de Inicio los aprendió el alumno en la clase 1, y moverlos de sitio en
 * la clase 3 le rompería el mapa que acaba de construir.
 */
/**
 * Qué hace cada una de las tres, para la ficha de la herramienta (§37.3, pieza 2).
 *
 * `QUE_HACE` vive en el motor y trae las cuarenta y tantas herramientas que el
 * motor construye. Las tres de esta clase NO están ahí y no pueden estarlo: son
 * controles de clase —`ControlesDeClase`, la puerta que existe para que veinte
 * clases se construyan a la vez sin tocar el motor—, así que nacen y mueren con
 * esta carpeta. Medido el 10-ago-2026: sin estas tres líneas, la ficha de los
 * encargos 3, 5, 6, 7 y 8 salía con el glifo, el nombre y el domicilio pero
 * **sin la frase de para qué sirve**, que es justo la mitad que el cliente pidió.
 *
 * Se registran con `??=` y con la clave prefijada `gi-`: no pisan nada del motor,
 * no chocan con las de ninguna otra clase, y el día que el motor deje declarar el
 * texto dentro del propio `ControlDeClase` —está pedido en el cableado— estas
 * tres líneas se borran sin que nada más cambie.
 */
QUE_HACE['gi-guardar'] ??=
  'Escribe tu documento en el disco con el nombre que ya tiene, sin preguntarte nada. Es lo que hay que hacer cada rato para no perder el trabajo.';
QUE_HACE['gi-guardar-como'] ??=
  'Hace un archivo NUEVO y te deja elegir tú tres cosas: cómo se llama, en qué carpeta se mete y de qué tipo es. El de antes se queda donde estaba.';
QUE_HACE['gi-imprimir'] ??=
  'Enseña cómo va a quedar en el papel y cuántas hojas gasta, antes de mandarlo a la impresora.';

export const CINTA_GUARDAR: Pestana[] = CINTA_BASICO.map((pestana) =>
  pestana.id !== 'inicio'
    ? pestana
    : {
        ...pestana,
        grupos: [
          ...pestana.grupos,
          {
            id: 'gi-archivo',
            nombre: 'Archivo',
            controles: [
              { id: 'gi-guardar', glifo: '💾', etiqueta: 'Guardar', ancho: true },
              {
                id: 'gi-guardar-como',
                glifo: '🗂',
                etiqueta: 'Guardar como',
                corto: 'Guardar como',
                ancho: true,
              },
              { id: 'gi-imprimir', glifo: '🖨', etiqueta: 'Imprimir', ancho: true },
            ],
          },
        ],
      },
);
