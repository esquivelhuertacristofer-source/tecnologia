import type { GuionClase } from '@/components/office/motor/guion';
import {
  cuantos,
  indiceDelPrimerBloqueConTexto,
  leerBloques,
  marcaEnTodoElBloque,
} from '@/components/office/motor/consultas';

/**
 * `of-word-la-cinta` · «La cinta por dentro» — guion del laboratorio (doc §36.4).
 *
 * Lo que esta clase enseña, según el currículo: «que las herramientas no están
 * sueltas: hay pestañas y dentro grupos, y el grupo dice para qué sirve lo que
 * contiene; se busca una herramienta por lo que hace, no por dónde se recuerda».
 *
 * De ahí sale la forma de los siete encargos, y en concreto estas decisiones:
 *
 *  · **Cada encargo de PULSAR nombra su control** en `senal.control`, y de ahí
 *    salen solos el señalador sobre el botón exacto, su rótulo, la ficha con el
 *    domicilio y el «para qué sirve», y el «Enséñamelo» (§37). Hasta el 10 de
 *    agosto el 4 y el 5 señalaban el GRUPO y el 7 ni eso, porque la clase estaba
 *    escrita para que el alumno buscara la herramienta por lo que hace. Era una
 *    decisión mía y **el cliente la revocó**: se guía la mano. Queda escrito
 *    para que nadie lo «arregle» de vuelta creyendo que fue un descuido.
 *
 *  · **El encargo 3 sigue sin señal, y ésa es la excepción que se defiende.** Es
 *    la pregunta bisagra —«¿en qué grupo se cambia la letra?»— y un señalador
 *    sobre Fuente la contestaría antes de que el alumno la piense. Se guía la
 *    mano, no la cabeza. La ayuda llega por la pista, que no da el sitio sino la
 *    regla: lee los nombres de los grupos.
 *
 *  · **Las instrucciones no repiten a la ficha.** La ficha ya dice dónde vive la
 *    herramienta y para qué sirve, así que la instrucción se queda sólo con lo
 *    que la ficha no sabe: QUÉ hay que conseguir, y el tropiezo que acecha
 *    —tener que seleccionar antes, o dónde está el cursor al centrar—.
 *
 *  · **Los encargos 4 y 5 se corrigen leyendo el documento.** Da igual con qué
 *    camino llegó. Y el 4 exige que la marca cubra el título ENTERO, que es la
 *    manera de comprobar que hubo una selección de verdad y no un cursor
 *    suelto: elegir 20 con el cursor dentro no cambia nada, y ese pequeño
 *    fracaso es el que enseña que el formato actúa sobre lo seleccionado.
 *
 *  · **El título se localiza por POSICIÓN y no por su texto.** Los encargos 4 y
 *    5 hablan del renglón «Kermés de la escuela», pero se comprueban sobre el
 *    primer renglón con texto, se llame como se llame. La razón está medida: un
 *    niño teclea con el título seleccionado —que es el estado que el encargo 4
 *    le acaba de mandar alcanzar—, el título desaparece, y con un ancla de texto
 *    el encargo ya no se puede cumplir de ninguna manera. Sin botón de reiniciar
 *    eso es recargar la página y empezar de cero.
 *
 *  · **El encargo 7 no pide pulsar, pide MIRAR — y aun así señala.** Que un
 *    botón hundido te informe del formato que hay bajo el cursor es la mitad de
 *    la utilidad de la cinta y no se descubre solo. El señalador apunta a
 *    «Centrar» porque el objeto de la lección ES ese botón: es la mano guiada
 *    hasta lo que hay que mirar. La instrucción dice «no hace falta que lo
 *    pulses» y no «no lo pulses, se descentra», porque se midió: alinear fija el
 *    atributo, no lo alterna, así que volver a pulsarlo deja el título igual de
 *    centrado. Lo único que cuesta es un tropiezo, y eso está anotado para el
 *    motor. Es el único paso que se cierra con un «ya lo vi», porque no hay
 *    documento que lo demuestre.
 */

/** Lo que hay en la hoja al abrir el laboratorio: un cartel a medio hacer. */
const DOCUMENTO = `
<p>Kermés de la escuela</p>
<p>Sábado 12 de septiembre, de 10 de la mañana a 3 de la tarde, en el patio de la primaria.</p>
<p>Habrá juegos, música y comida hecha por las familias. Todo lo que se junte es para comprar libros nuevos para la biblioteca.</p>
<p>Puestos confirmados hasta hoy:</p>
<ul>
  <li>Tacos de canasta</li>
  <li>Aguas frescas de tres sabores</li>
  <li>Pesca de patitos</li>
  <li>Lotería con premios</li>
</ul>
<p>Los precios de cada puesto van aquí abajo:</p>
<p>Los esperamos a todos. Si alguien puede prestar mesas o sillas, avise en la dirección.</p>
`;

export const GUION_LA_CINTA: GuionClase = {
  archivo: 'Cartel de la kermés.docx',
  html: DOCUMENTO,

  /*
   * La portada dice QUÉ vas a hacer ahora; la entrada de la actividad dice POR
   * QUÉ importa. No se repiten a propósito: la entrada habla de pestañas y
   * grupos como idea, y esto es la orden de trabajo del día.
   */
  portada: {
    situacion: 'Word · Grado básico · Clase 1 de 3',
    tema: 'Unidad 1 — Cómo está ordenada la cinta de opciones',
    objetivo:
      'Que al terminar sepas encontrar cualquier herramienta de Word aunque nunca la hayas usado, buscándola por lo que hace y no por dónde te acuerdas de haberla visto.',
    vasAHacer: [
      'Abrir una pestaña y otra, y ver que cada una cambia TODAS las herramientas de abajo.',
      'Leer el nombre de los grupos y decidir tú solo en cuál se busca cada cosa.',
      'Terminar el cartel de la kermés: el título grande y centrado, y una tabla para los precios.',
      'Descubrir que un botón hundido te está diciendo cómo está el texto donde tienes el cursor.',
    ],
    requisitos: 'Nada. Es la primera clase de Word y se empieza desde cero.',
    ayuda:
      'En cada encargo, un aro naranja te marca el botón exacto y su nombre, y el maestro de la derecha te dice para qué sirve antes de que lo pulses. Si aun así no lo ves, pulsa «Enséñamelo». Y si te equivocas de botón, el programa te dice qué tocaste y lo deshace por ti.',
  },

  pasos: [
    {
      id: 'abrir-insertar',
      titulo: 'Cambia de pestaña',
      instruccion:
        'Arriba, en fila, están las pestañas. Abre «Insertar» y fíjate bien: cambian TODAS las herramientas de abajo.',
      pista: 'Las pestañas están en la fila de arriba, justo debajo del nombre del archivo.',
      senal: { pestana: 'insertar' },
      logro: { tipo: 'pestana', pestana: 'insertar' },
      aprendido: 'Cada pestaña es un cajón distinto. Al cambiar de pestaña cambia toda la cinta.',
    },
    {
      id: 'volver-inicio',
      titulo: 'Vuelve a Inicio',
      instruccion:
        'Vuelve a «Inicio». Es la pestaña del día a día: la letra, el párrafo y los estilos viven ahí, y es lo que usarás casi siempre.',
      pista: '«Inicio» es la primera pestaña después de «Archivo».',
      senal: { pestana: 'inicio' },
      logro: { tipo: 'pestana', pestana: 'inicio' },
      aprendido: 'Inicio es la pestaña del día a día. Si dudas dónde empezar, empieza ahí.',
    },
    {
      id: 'nombre-del-grupo',
      titulo: '¿Dónde lo buscarías?',
      instruccion:
        'Debajo de cada montón de botones hay un nombre pequeñito: es el GRUPO, y dice para qué sirve lo que tiene encima. El título del cartel se ve muy chico. ¿En qué grupo se cambia el tamaño de la letra?',
      pista: 'Lee los cuatro nombres pequeños de la pestaña Inicio. Uno de ellos habla de la letra.',
      logro: {
        tipo: 'eleccion',
        opciones: ['Portapapeles', 'Fuente', 'Párrafo', 'Estilos'],
        correcta: 1,
      },
      aprendido: 'El nombre del grupo es la pista. Si es cosa de la letra, está en Fuente.',
    },
    {
      id: 'agrandar-titulo',
      titulo: 'Ahora hazlo',
      instruccion:
        'El título tiene que verse desde lejos. Selecciónalo arrastrando el ratón por encima y déjalo en 20 o más.',
      pista:
        'Si eliges el tamaño sin seleccionar nada, no cambia nada: el formato actúa sobre lo que está seleccionado. Arrastra primero por encima del título.',
      senal: { pestana: 'inicio', grupo: 'fuente', control: 'fuente-tamano' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) =>
          marcaEnTodoElBloque(doc, indiceDelPrimerBloqueConTexto(doc), 'tamano', (a) => Number(a.pt) >= 20),
      },
      aprendido: 'El formato se aplica a lo que está seleccionado. Sin selección, no pasa nada.',
    },
    {
      id: 'centrar-titulo',
      titulo: 'El título, al centro',
      instruccion:
        'Ahora ponlo en el centro de la hoja. Ojo: mueve el renglón donde tengas el cursor, así que déjalo dentro del título.',
      pista: 'Si se centró otro renglón, deshaz con la flecha de arriba, haz clic dentro del título y vuelve a pulsar.',
      senal: { pestana: 'inicio', grupo: 'parrafo', control: 'centro' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => leerBloques(doc)[indiceDelPrimerBloqueConTexto(doc)]?.alineacion === 'centro',
      },
      aprendido: 'Centrar es del párrafo, no de la letra. Por eso vive en el grupo Párrafo.',
    },
    {
      id: 'meter-tabla',
      titulo: 'Lo que no está en Inicio',
      instruccion:
        'Faltan los precios y van en una tabla. Pon el cursor en el renglón «Los precios de cada puesto van aquí abajo»: la tabla entra donde esté el cursor.',
      pista: 'Meter algo que todavía no existe —una tabla, una imagen— se hace desde la pestaña Insertar.',
      /*
       * Se cuenta la tabla y no dónde cayó, a propósito. Poner el cursor en su
       * sitio es la lección, pero exigirlo sería dejar al que lo metió arriba
       * sin salida: no hay forma de arrastrar una tabla y el encargo no se
       * podría cumplir nunca más.
       */
      senal: { pestana: 'insertar', grupo: 'tablas', control: 'tabla' },
      logro: { tipo: 'documento', comprueba: (doc) => cuantos(doc, 'tabla') >= 1 },
      aprendido: 'Lo que se mete nuevo está en Insertar, y entra donde tengas el cursor.',
    },
    {
      id: 'boton-hundido',
      titulo: 'El botón también te habla',
      instruccion:
        'Haz un clic dentro del título, sin arrastrar, y mira el botón del aro: está HUNDIDO. Te está diciendo cómo es el renglón donde tienes el cursor. No hace falta pulsarlo.',
      pista: 'Un solo clic dentro del renglón del título, sin arrastrar. Luego mira los cuatro botones de alinear: sólo uno está hundido.',
      senal: { pestana: 'inicio', control: 'centro' },
      logro: { tipo: 'confirma', boton: 'Ya lo vi' },
      aprendido: 'Un botón hundido te dice qué formato tiene lo que hay bajo el cursor. Léelo siempre.',
    },
  ],

  /*
   * Lo que el alumno YA SABE HACER, y no lo que la clase «vio». Antes esta frase
   * estaba clavada en la ventana con la lección de esta clase y salía también al
   * terminar las otras dieciocho (§37).
   */
  cierre:
    'Ya sabes moverte por la cinta: cambiar de pestaña, leer el nombre de un grupo para saber qué guarda dentro, agrandar y centrar el título del cartel, y meter una tabla desde Insertar. Y sabes que un botón hundido te está contando cómo está el renglón donde tienes el cursor. Con eso puedes encontrar una herramienta que nunca hayas usado.',
};
