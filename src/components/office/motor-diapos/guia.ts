/**
 * El modo guía de Tecnia Diapositivas (§37 aplicado a PowerPoint).
 *
 * **Aquí no hay mecanismo, sólo contenido.** `ubicar`, `ubicarPestana`,
 * `comoLlegar` y `explicarDesvio` viven en `office/motor/guia.ts` y no tienen
 * una sola línea que nombre a ProseMirror ni a Word — medido el 10-ago-2026—,
 * así que se reutilizan tal cual pasándoles esta tabla. Copiarlos habría creado
 * dos guías que se desincronizan; lo que se copia se separa.
 *
 * `QUE_HACE_PPT` se escribe **una vez** y de ella salen a la vez el rótulo del
 * aro, la ficha de la herramienta y la explicación del desvío. Por eso no se
 * pueden contradecir: no son tres textos, es uno.
 *
 * Cómo se escribe una entrada: **qué hace, en la lengua del alumno, y qué gana
 * él con eso**. No «aplica formato de negrita al texto seleccionado» sino
 * «engrosa la letra para que una palabra destaque». Si una entrada se puede
 * leer sin haber visto nunca el programa, está bien escrita.
 */

import type { TablaDesplegables } from '@/components/office/motor/guia';

export const QUE_HACE_PPT: Record<string, string> = {
  /* La barra de acceso rápido y la de estado, que también reciben el aro */
  guardar: 'Deja la presentación guardada en este equipo. Hasta que lo pulsas, lo hecho sólo existe en la pantalla.',
  deshacer: 'Da marcha atrás al último cambio. Se puede pulsar muchas veces seguidas.',
  rehacer: 'Vuelve a hacer lo que acabas de deshacer, por si te arrepentiste.',
  repasar:
    'Pasa tus diapositivas a pantalla completa, como las verá el público. Es la única forma de saber si se entienden.',
  zoom: 'Acerca y aleja la diapositiva. Alejarla hasta el 45 % es mirarla desde la última butaca del salón.',

  /* Inicio · Diapositivas */
  nueva:
    'Agrega una pantalla nueva al final de tu presentación. Antes de escribir nada hay que tener dónde escribirlo.',
  'diseno-diapo':
    'Elige el acomodo de la diapositiva: dónde va el título, dónde el texto y dónde la imagen. Elegir bien te ahorra acomodar a mano.',
  duplicar:
    'Hace una copia exacta de la diapositiva en la que estás, justo después. Sirve cuando la siguiente se parece mucho.',
  quitar: 'Borra la diapositiva en la que estás. Las demás se recorren para tapar el hueco.',
  seccion:
    'Parte la presentación en tramos con nombre —«Introducción», «Resultados»— que empiezan en la diapositiva donde estás. Sirve cuando ya son tantas que no las abarcas de un vistazo.',
  restablecer:
    'Le quita a la diapositiva lo que alguien le puso a mano y la devuelve a lo que dice el patrón. No borra el texto.',
  reutilizar:
    'Abre las diapositivas de OTRO archivo, sin abrir el archivo, y te deja traerte las que quieras. La casilla de arriba decide si vienen con su cara o con la tuya.',
  'esquema-word':
    'Coge un documento de Word y lo convierte en diapositivas: cada título grande es una diapositiva y los títulos pequeños de debajo, sus viñetas.',

  /* Inicio · Fuente */
  'fuente-familia': 'Cambia la forma de la letra. En una diapositiva conviene una letra sencilla: se lee de lejos.',
  'fuente-tamano':
    'Elige de cuántos puntos es la letra. En una hoja un texto normal va en 12; en una diapositiva empieza en 18, porque se ve desde el fondo del salón.',
  negrita: 'Engrosa la letra para que una palabra destaque sobre las demás.',
  cursiva: 'Inclina la letra. Sirve para un título de libro o para una palabra en otro idioma.',
  subrayado: 'Pone una raya debajo. En una diapositiva se usa poco: la raya compite con la letra.',
  mayor: 'Sube la letra un tamaño. Si desde atrás no se lee, es como si no estuviera.',
  menor: 'Baja la letra un tamaño. Úsalo cuando un texto no cabe en su caja.',
  color:
    'Cambia el color de la letra. Lo que importa no es que sea bonito: es que contraste con el fondo, o no se ve.',

  /* Inicio · Párrafo */
  vinetas: 'Convierte cada renglón en un punto de una lista corta. Tres viñetas se leen; un párrafo, no.',
  numeros: 'Igual que las viñetas, pero numerando. Se usa cuando el orden importa.',
  izquierda: 'Pega el texto al lado izquierdo de su caja.',
  centro: 'Deja el texto en el centro de su caja. Es lo normal en una portada.',
  derecha: 'Pega el texto al lado derecho de su caja.',

  /* Inicio · Dibujo */
  /*
   * Reescrita el 12-ago-2026 (§44.2): hasta hoy decía sólo «mete un botón de
   * acción», que era verdad cuando la galería sólo traía los tres de §43.5.
   * Ahora trae también las cuatro figuras, y una ficha que nombra la mitad de
   * lo que hay detrás del botón manda al alumno a buscar donde no está.
   */
  formas:
    'Dibuja una forma: rectángulo, elipse, flecha o línea. Al final de la lista están los botones de acción —Inicio, Atrás, Siguiente—, que son formas que ya nacen con destino.',
  organizar:
    'Decide qué objeto queda encima de cuál, y alinea varios entre sí. Es lo que evita que la foto tape el título.',

  /* Insertar */
  imagen: 'Mete una foto en la diapositiva. Una imagen que apoya lo que dices ayuda; una que sólo adorna, distrae.',
  cuadro: 'Dibuja una caja de texto donde tú quieras, fuera de los sitios que el diseño ya trae.',
  /*
   * Reescrita en §44.3, y por lo mismo que la instrucción de `ponles-numero`:
   * ponía «pone el número abajo en TODAS las diapositivas», y desde que el botón
   * abre el cuadro de encabezado y pie eso ya no es lo que hace — es lo que hace
   * una de las tres casillas del cuadro—. **La ficha de guía es parte del botón**:
   * mientras el modo guía la enseñe diciendo otra cosa, el botón está mal puesto.
   */
  pie: 'Abre lo que sale abajo en TODAS las diapositivas de una vez: el número, un texto de pie —el nombre de tu escuela— y la casilla para que la portada vaya limpia.',
  smartart: 'Convierte una lista en un dibujo con cajas y flechas: pasos, partes o quién manda a quién.',
  'gráfico': 'Dibuja tus números: barras, líneas o rebanadas. Una gráfica dice en un vistazo lo que una tabla tarda.',
  tabla: 'Mete una rejilla de filas y columnas para poner datos ordenados.',
  video: 'Mete un video que se reproduce dentro de la diapositiva, sin salir del programa.',
  'al-clic':
    'Decide si el video espera a que tú lo mandes o arranca solo al llegar a la diapositiva. Pulsado, espera.',
  audio: 'Mete un sonido. Aparece un altavoz que se pulsa mientras presentas.',
  vinculo:
    'Le pone destino a lo que tengas seleccionado: al pulsarlo mientras presentas, salta a la diapositiva que elijas. Casi nadie sabe que un vínculo puede llevar dentro de la misma presentación.',
  'zoom-resumen':
    'Hace una diapositiva-índice ella sola: mira tus secciones, coge la primera de cada una y pone una miniatura que salta hasta ahí. Sin secciones no puede hacer nada.',

  /* Diseño */
  tema: 'Le cambia la cara a TODA la presentación de una vez: los colores y las letras de todas las diapositivas.',
  fondo: 'Cambia el fondo de la diapositiva. Fondo oscuro pide letra clara, y al revés.',
  'tamano-diapo':
    'Elige la forma de la pantalla: 16:9 es la de los proyectores y televisiones de hoy; 4:3 es la cuadrada de antes.',

  /* Transiciones */
  'transicion-ninguna': 'Quita el efecto al pasar de una diapositiva a la siguiente. Casi siempre es la mejor opción.',
  'transicion-desvanecer': 'La diapositiva anterior se apaga mientras la nueva aparece. Es el efecto más discreto.',
  'transicion-empujar': 'La nueva diapositiva entra empujando a la anterior. Se nota mucho: úsalo poco.',
  duracion: 'Cuánto tarda el efecto. Más de un segundo y el público está esperando en vez de escuchándote.',
  'aplicar-todo': 'Le pone a todas las diapositivas la misma transición que acabas de elegir.',

  /* Animaciones */
  'anim-aparecer': 'Hace que algo entre a la diapositiva cuando tú lo decides, en vez de estar desde el principio.',
  'anim-enfasis': 'Hace que algo que ya está se mueva o crezca un momento, para llamar la atención.',
  'anim-salir': 'Hace que algo desaparezca de la diapositiva sin cambiar de diapositiva.',
  'panel-animacion': 'Enseña la lista de todo lo que se mueve y en qué orden. Ahí se cambian el orden y los tiempos.',

  /* Formato de imagen · la pestaña que sólo sale con algo seleccionado */
  recortar:
    'Quita los bordes de una foto sin aplastar lo que queda. Recortar es elegir: te quedas con la parte que estás contando.',
  'texto-alt':
    'Escribe qué se ve en la imagen, para quien no la puede ver. Se escribe una vez y sirve para siempre.',

  /* Presentación */
  'desde-principio': 'Empieza la presentación a pantalla completa desde la primera diapositiva. Es lo que ve el público.',
  personalizada:
    'Guarda una lista con nombre —«de estas siete, la 1, la 5 y la 6»— para enseñarle a otro público una versión más corta. Un archivo, tres presentaciones.',
  ensayar: 'Te cronometra mientras ensayas y te dice cuánto tardaste en cada diapositiva.',
  grabar:
    'Pasa la presentación una vez mientras hablas y se queda con dos cosas de cada diapositiva: lo que dijiste y cuánto tardaste. Después se cuenta sola, sin ti.',
  'quitar-narracion':
    'Le quita la voz a todas las diapositivas y les deja los tiempos puestos. Es lo que se hace cuando al final sí vas a ir tú: si no, el archivo habla por encima de ti.',
  'vista-moderador': 'Tú ves tus notas y la siguiente diapositiva; el público sólo ve la diapositiva. Dos pantallas distintas.',
  ocultar:
    'Deja la diapositiva dentro del archivo pero fuera de la presentación: no sale al presentar y su número aparece tachado. No es borrarla — vuelve cuando la necesites.',

  /* Revisar */
  ortografia: 'Busca palabras mal escritas y propone cómo van.',
  comentario: 'Deja una nota pegada para otra persona, que no se ve al presentar.',

  /* Vista */
  'vista-normal': 'La vista de trabajo: la tira a un lado, la diapositiva en grande y las notas debajo.',
  'vista-clasificador': 'Enseña todas las diapositivas chiquitas a la vez. Es la mejor vista para reordenarlas.',
  modelo3d:
    'Mete un objeto que se puede GIRAR dentro de la diapositiva. Sirve cuando lo que explicas tiene lados y una foto sólo enseña uno.',
  relleno:
    'El color de DENTRO de la forma. Puedes dejarla sin relleno, y entonces se ve lo que hay detrás: no es lo mismo que no habérselo puesto.',
  contorno:
    'El color de la RAYA de fuera. Se elige aparte del relleno, y por eso una forma puede tener raya y no tener dentro, o al revés.',
  'vista-notas': 'Enseña cada diapositiva con sus notas debajo, tal como se imprimirían.',
  'vista-lectura': 'Pasa la presentación dentro de la ventana, sin ocupar toda la pantalla.',
  patron: 'Cambia el molde de todas las diapositivas a la vez. Cambias una cosa aquí y cambian las cuarenta.',
  'patron-documentos':
    'El molde de las hojas que REPARTES: lo que sale arriba y abajo en todas, aunque lleven dos diapositivas o seis.',
  'patron-notas':
    'El molde de las hojas que te quedas TÚ: cómo se coloca la diapositiva sobre lo que ibas a decir.',
};

/** Lo mismo para las pestañas, que también son una herramienta que se explica. */
export const QUE_HACE_PESTANA_PPT: Record<string, string> = {
  archivo: 'Lo que se hace con el archivo entero: guardar, abrir, imprimir y exportar.',
  inicio: 'Lo que más se usa: crear diapositivas, dar formato a la letra y acomodar el texto.',
  insertar: 'Todo lo que se mete en una diapositiva y no es texto: imágenes, formas, tablas, video.',
  diseno: 'La cara de la presentación: el tema, el fondo y la forma de la pantalla.',
  transiciones: 'Cómo se pasa de una diapositiva a la siguiente.',
  animaciones: 'Cómo se mueve lo que hay DENTRO de una diapositiva.',
  presentacion: 'Todo lo de presentar de verdad: empezar, ensayar y la vista del moderador.',
  revisar: 'Corregir la ortografía y dejar comentarios para otra persona.',
  vista: 'Las distintas formas de ver tu presentación mientras la haces.',
  'formato-imagen':
    'Sale sola cuando seleccionas una imagen, y se va cuando la sueltas. Dentro está todo lo que se le hace a una foto.',
  reproduccion:
    'Sale sola cuando seleccionas un video, y sólo con un video. Dentro está cómo y cuándo se pone en marcha.',
  'formato-forma':
    'Sale sola cuando seleccionas una forma que dibujaste tú. Dentro está el color de dentro y el de la raya, que se eligen por separado.',
};

/**
 * Los controles que la cinta no lista por no ser botones.
 *
 * Mismo agujero que en Word y por el mismo motivo: `GrupoCinta.controles` sólo
 * tiene botones, y los dos desplegables de tipografía los inyecta la ventana al
 * pintar el grupo Fuente. Sin esta tabla, un encargo que señale el tamaño de
 * letra se queda sin rótulo, sin ficha y sin «Enséñamelo».
 */
export const DESPLEGABLES_PPT: TablaDesplegables = {
  'fuente-familia': { grupo: 'Fuente', etiqueta: 'Tipo de letra', glifo: 'Aa' },
  'fuente-tamano': { grupo: 'Fuente', etiqueta: 'Tamaño de letra', glifo: '24' },
};
