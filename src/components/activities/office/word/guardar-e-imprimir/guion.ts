import type { Node as NodoPM } from 'prosemirror-model';
import type { GuionClase } from '@/components/office/motor/guion';
import { contarPalabras } from '@/components/office/motor/consultas';
import { leerEscritorio, NOMBRE_INICIAL, normaliza } from './escritorio';

/**
 * `of-word-guardar-e-imprimir` · «Guardar, imprimir y PDF» — guion (doc §36.4).
 *
 * Lo que esta clase enseña, según el currículo: «guardar contra guardar como,
 * elegir la carpeta a conciencia, la vista previa antes de imprimir, y por qué
 * se manda un PDF y no el documento».
 *
 * De ahí salen los ocho encargos, y en concreto cinco decisiones:
 *
 *  · **El primer encargo es escribir, no guardar.** La lección de fondo no es
 *    «dónde está el botón» sino que **el documento vive en la memoria hasta que
 *    lo guardas**, y eso no se puede contar: hay que verlo. El alumno teclea, el
 *    letrero de la barra de título pasa solo de «Guardado» a «Sin guardar», y el
 *    encargo 2 le hace decir en voz alta qué acaba de leer. Sin ese par, la
 *    clase entera sería una visita guiada por dos cuadros de diálogo.
 *
 *  · **Cinco de los ocho encargos señalan su botón exacto; tres no, a propósito**
 *    (§37). Los cinco de acción —3, 5, 6, 7 y 8— llevan `senal.control`, que es
 *    lo que enciende las cuatro piezas del modo guía: el señalador con su rótulo,
 *    la ficha con el domicilio y el para-qué, «Enséñamelo» y el desvío atendido.
 *    Los otros tres no pulsan nada de la cinta: el 1 es teclear y el 2 y el 4 son
 *    preguntas. **Señalar una pregunta es enseñar la respuesta**, y el 4 es la
 *    pregunta bisagra de la clase —«¿Guardar o Guardar como?»—: su ayuda llega
 *    por la pista, que no dice el sitio sino la diferencia.
 *
 *  · **El encargo 6 exige nombre Y carpeta.** Cambiar sólo el nombre es EL error
 *    del tema —el archivo acaba donde la computadora quiso y luego no aparece—,
 *    así que la comprobación pide las dos cosas, la pista está escrita palabra
 *    por palabra para cuando falle, y el propio cuadro lo dice en el momento de
 *    cometerlo (ver el recado en `accesorios.tsx`). Lo mismo hace el 8 con el
 *    número de copias.
 *
 *  · **Nada se ancla al texto que el alumno puede reescribir.** Los encargos 6, 7
 *    y 8 preguntan por el ESCRITORIO —qué archivos hay, de qué tipo, en qué
 *    carpeta—, que es un sitio donde el niño no puede dejarse encerrado. Y el 1
 *    se corrige por **lo que el alumno aportó**, no por el tamaño del documento:
 *    ver `escribioLoSuyo()`. La regla es la de §36.8 (C): un encargo no se ancla
 *    nunca a un texto editable.
 *
 *  · **Abrir el cuadro es un encargo aparte del de rellenarlo** (el 5 y el 6).
 *    Un niño con prisa rellena la primera casilla de un cuadro de diálogo y le
 *    da a Guardar; pararle a mirar las tres preguntas es la clase. Y, medido: la
 *    ventana cuenta como tropiezo cualquier botón de la cinta que no resuelva el
 *    encargo del momento, así que sin este desdoble el clic que la clase MANDA
 *    dar costaba seis puntos. Ver `calificar()` en `Lab.tsx`.
 */

/**
 * El documento de partida: un aviso escolar de verdad, a falta de una línea.
 *
 * Es largo a propósito. La vista previa de impresión no enseña nada si el
 * documento cabe en media hoja: hacen falta DOS hojas para que el alumno vea que
 * cada copia son dos papeles y que treinta copias son sesenta. Y es el tipo de
 * documento que de verdad se imprime treinta veces en una primaria.
 */
const DOCUMENTO = `
<h1>Escuela Primaria Benito Juárez, turno matutino</h1>
<p>Aviso para las mamás y los papás del grupo de 4.º B</p>
<h2>Salida al Museo del Agua, viernes 25 de septiembre</h2>
<p>El grupo de 4.º B va a salir al Museo del Agua el viernes 25 de septiembre. Salimos a las 8:30 de la mañana desde la puerta de la escuela y regresamos a la 1:30 de la tarde, a la hora de siempre, para que en su casa nadie tenga que mover sus planes de ese día.</p>
<p>La visita es parte del proyecto de Ciencias que empezamos en agosto. En el museo hay un recorrido con guía sobre de dónde sale el agua que llega a nuestras casas, y después un taller donde cada equipo arma un filtro con arena, grava y algodón para ver con sus propios ojos cómo se limpia el agua sucia.</p>
<p>Lo que hay que llevar ese día:</p>
<ul>
<li>Lonche y una botella de agua, porque dentro del museo no hay tienda.</li>
<li>Gorra y bloqueador: la mitad del recorrido es en el patio de afuera.</li>
<li>El cuaderno de Ciencias y un lápiz para las notas del taller.</li>
<li>Ropa cómoda y tenis. Ese día no hace falta el uniforme.</li>
<li>Cooperación de 45 pesos para el camión, en efectivo y en sobre cerrado.</li>
</ul>
<p>Las reglas de la salida son las mismas de siempre y las repasamos en el salón el jueves:</p>
<ol>
<li>Nadie se separa de su equipo ni se adelanta al guía.</li>
<li>Dentro del museo se camina. En el patio se puede correr en el área marcada.</li>
<li>Lo que se toca en el taller se deja donde estaba y limpio.</li>
<li>Los celulares se quedan guardados durante todo el recorrido.</li>
<li>Si alguien se siente mal, avisa a la maestra en ese momento y no después.</li>
<li>Al subir al camión, cada quien se sienta en el lugar de la lista.</li>
<li>Nadie se sube ni se baja del camión sin que la maestra lo vea.</li>
</ol>
<p>Los 45 pesos se juntan hasta el miércoles y se entregan en la dirección, nunca en el salón. Con eso se paga el camión y la entrada de los treinta niños; el museo no nos cobra el taller porque somos escuela pública. Si en su casa ahorita no se puede, avísennos y lo resolvemos sin que el niño se quede fuera: ya nos ha pasado otras veces y siempre se arregla.</p>
<p>Los niños que no traigan este permiso firmado se quedan en la escuela con el grupo de 4.º A y hacen la actividad del filtro en el salón. No pasa nada y nadie se pierde el tema, pero necesitamos saberlo antes del miércoles para acomodar los lugares del camión y avisarle al museo cuántos vamos a llegar.</p>
<p>De regreso, cada equipo va a escribir en su cuaderno lo que vio y lo va a presentar el lunes siguiente delante del grupo. Por eso el cuaderno importa tanto como el lonche: sin apuntes, la mitad de lo que vieron se les va a olvidar antes del lunes.</p>
<p>Cualquier duda, la maestra los atiende a la salida, de 1:30 a 2:00, o pueden dejar un recado en la dirección y les regresamos la llamada el mismo día.</p>
<h2>Permiso: recórtelo y devuélvalo el miércoles</h2>
<p>Yo, ______________________________, mamá, papá o tutor de ______________________________, del grupo de 4.º B, autorizo su participación en la salida al Museo del Agua del viernes 25 de septiembre.</p>
<p>Firma: ______________________________</p>
<p>Teléfono para cualquier urgencia: ______________________________</p>
<p>Nombre de quien llenó este aviso:</p>
`;

/**
 * Las palabras que trae el documento antes de que el alumno toque nada.
 *
 * Se cuenta quitándole las etiquetas al HTML de arriba y no a mano, porque un
 * número escrito a mano se queda viejo en cuanto alguien arregle una coma del
 * aviso — y entonces el primer encargo se daría por hecho al abrir la clase, sin
 * que el alumno escribiera una sola letra. Es la misma cuenta que hace
 * `contarPalabras` sobre el documento: unir el texto y partir por espacios.
 */
const PALABRAS_INICIALES = DOCUMENTO.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

/** Las palabras que el aviso ya traía escritas, sin acentos ni mayúsculas. */
const YA_ESTABAN = new Set(
  normaliza(DOCUMENTO.replace(/<[^>]+>/g, ' '))
    .split(/[^a-z0-9]+/)
    .filter(Boolean),
);

/**
 * ¿El alumno puso algo suyo en el aviso? Es el logro del encargo 1.
 *
 * Nació contando palabras contra el documento de partida —«que haya dos más que
 * al abrir»— y así estuvo hasta que se jugó MAL: un niño que hace Ctrl+A y
 * teclea encima deja el documento en tres palabras, y a partir de ahí el encargo
 * pedía **quinientas setenta y cinco** para darse por hecho. Medido el
 * 10-ago-2026: seleccionar todo, escribir el nombre y añadir doce palabras más
 * dejaba el panel clavado en «0 de 8» para siempre. Un callejón sin salida en el
 * primer encargo de la clase.
 *
 * Se corrige por lo que el alumno APORTÓ: dos palabras que el aviso no traía.
 * Da igual dónde las escriba y da igual cuánto haya borrado antes, así que no
 * hay manera de quedarse encerrado. Y sigue cumpliendo la otra mitad de la
 * promesa del motor —deshacer despaloma—: al deshacer, esas palabras dejan de
 * estar y el encargo vuelve a abrirse solo.
 *
 * La segunda mitad de la condición es para el niño que se llame como el aviso
 * («Benito Juárez» está escrito en el título): si sus dos palabras ya estaban,
 * la cuenta de siempre lo salva.
 */
function escribioLoSuyo(doc: NodoPM): boolean {
  const suyas = new Set(
    normaliza(doc.textBetween(0, doc.content.size, ' ', ' '))
      .split(/[^a-z0-9]+/)
      .filter((p) => p && !YA_ESTABAN.has(p)),
  );
  return suyas.size >= 2 || contarPalabras(doc) >= PALABRAS_INICIALES + 2;
}

/** Lo que el encargo 5 y el 6 esperan encontrar en el nombre del archivo. */
const CLAVE_DEL_NOMBRE = 'museo';

export const GUION_GUARDAR_E_IMPRIMIR: GuionClase = {
  /*
   * El nombre feo es el motor de media clase.
   *
   * «Documento1.docx» no dice nada: es exactamente lo que Word le pone a un
   * documento nuevo, y es lo que hace que la pregunta del encargo 4 —«¿tú
   * sabrías dentro de un mes cuál es?»— se conteste sola. Tiene que ser el mismo
   * nombre que `NOMBRE_INICIAL` del escritorio, porque la barra de título del
   * programa y el cuadro de Guardar como cuentan la misma historia.
   */
  archivo: `${NOMBRE_INICIAL}.docx`,
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Grado básico · Clase 3 de 3',
    tema: 'Unidad 1 — Guardar, guardar como, PDF e imprimir',
    objetivo:
      'Que al terminar sepas que un documento no existe en ninguna parte hasta que lo guardas, y que sepas ponerle un nombre que sirva, elegir tú la carpeta, sacar una copia en PDF para mandarla, y ver cómo va a quedar en el papel antes de gastarlo.',
    vasAHacer: [
      'Escribir una línea en el aviso y ver aparecer solo el letrero «Sin guardar».',
      'Guardarlo, y después volver a guardarlo con otro nombre y en otra carpeta.',
      'Sacar una copia en PDF, que es la que se manda por teléfono.',
      'Mirar las hojas en la vista previa y calcular cuánto papel gastan 30 copias.',
    ],
    requisitos:
      'Las dos clases anteriores de Word: moverte por las pestañas y los grupos de la cinta, y escribir dentro del documento.',
    ayuda:
      'Nunca vas a tener que adivinar dónde se pulsa: un aro naranja te marca el botón exacto y te dice su nombre, y en el panel de la derecha tienes su ficha —cómo se llama, dónde vive y para qué sirve— antes de tocarlo. Si aun así no lo ves, pulsa «Enséñamelo». Y si pulsas otro botón sin querer, tu maestro te dice cuál pulsaste, qué hace, y deshace el cambio para que tu documento no se ensucie. Aviso de mapa: en el Word de la escuela, Guardar como e Imprimir viven detrás de la pestaña «Archivo»; aquí los tienes a la mano en el grupo «Archivo» de la pestaña Inicio. Y no te preocupes por romper nada: aquí no sale papel de verdad ni se descarga ningún archivo, es un simulador.',
  },

  /*
   * Se lee al terminar, y habla de lo que el alumno YA SABE HACER.
   *
   * Sin ella sale la frase genérica de la ventana, que no miente pero tampoco
   * dice nada. Ojo con la tentación de repetir aquí la insignia: la insignia
   * cuenta lo que hizo hoy —el aviso, el PDF, las treinta copias—; esto cuenta
   * lo que se lleva puesto a cualquier otro programa.
   */
  cierre:
    'Ya sabes lo más importante de todas las clases de Word: que lo que escribes no existe en ningún lado hasta que lo guardas. Y ya sabes guardarlo con un nombre que se entienda, en la carpeta que tú elijas, sacar la copia en PDF que es la que se manda, y contar las hojas antes de gastar el papel.',

  pasos: [
    {
      id: 'escribe-y-mira-arriba',
      titulo: 'Falta tu nombre',
      instruccion:
        'Tu maestra te pidió ayuda con el aviso de la salida. Baja hasta el último renglón —«Nombre de quien llenó este aviso:»—, haz clic al final y escribe tu nombre y tu apellido. En cuanto escribas, mira ARRIBA, junto a «Documento1.docx».',
      pista:
        'Haz clic justo después de los dos puntos del último renglón y escribe. Si no ves la rayita que parpadea, es que el clic no cayó dentro del documento. Escribe tu nombre y también tu apellido.',
      logro: { tipo: 'documento', comprueba: escribioLoSuyo },
      aprendido:
        'Arriba dice «Sin guardar». Lo que acabas de escribir vive sólo en la memoria de la computadora: todavía no está dentro de ningún archivo.',
    },
    {
      id: 'que-es-sin-guardar',
      titulo: '¿Qué te está avisando?',
      instruccion:
        'Antes decía «Guardado» y ahora dice «Sin guardar». No es un adorno: te está avisando de algo. Piénsalo un segundo antes de contestar.',
      pista:
        'No habla de faltas de ortografía ni del nombre del archivo. Habla de tu trabajo: ¿dónde está ahora mismo lo que acabas de escribir?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Que el aviso tiene faltas de ortografía',
          'Que lo que escribiste todavía no está dentro de ningún archivo',
          'Que el archivo se llama feo y hay que cambiarle el nombre',
          'Que la impresora se quedó sin papel',
        ],
        correcta: 1,
      },
      aprendido:
        'Si ahorita se fuera la luz, lo que escribiste se iría con ella. Por eso «Sin guardar» es el letrero más importante de la pantalla.',
    },
    {
      id: 'guarda-el-aviso',
      titulo: 'Guárdalo ya',
      /*
       * La ficha de al lado ya dice dónde vive el botón y para qué sirve, así
       * que aquí sobraba media instrucción: «en la pestaña Inicio, hasta la
       * derecha, hay un grupo que se llama Archivo» era el mapa dos veces. Lo
       * que la ficha NO puede decir es qué mirar mientras se pulsa, y eso es
       * exactamente la lección de este encargo.
       */
      instruccion:
        'No sigas sin guardar. Pulsa Guardar sin quitarle el ojo al letrero de arriba: vas a ver el momento justo en que tu trabajo pasa a estar dentro del archivo.',
      /*
       * Aquí no se dice «el disquete». En la cinta el dibujo es 💾 y así lo
       * llama Word, pero un niño de diez años de 2026 no ha visto uno en su
       * vida: la palabra no le acerca el botón, se lo aleja. Se nombra por lo
       * que se lee, que es lo que él va a buscar con los ojos.
       */
      pista:
        'Es el botón que dice Guardar, hasta la derecha de la cinta. Si no lo encuentras, pulsa «Enséñamelo» en la ficha de aquí al lado.',
      senal: { pestana: 'inicio', grupo: 'gi-archivo', control: 'gi-guardar' },
      /*
       * Se corrige por lo que HAY GUARDADO, no por qué botón se pulsó.
       *
       * Era `tipo: 'control'` y ahí había un embudo: el disquete de la barra de
       * título hace exactamente lo mismo, y el niño que lo pulsaba veía el
       * letrero cambiar a «Guardado» mientras el maestro le seguía pidiendo que
       * guardara. §37.4 lo dice para toda la sala —«si lo consigue con Ctrl+N en
       * vez de con el botón, está bien hecho»—: se guía la mano, pero se corrige
       * el resultado. El escritorio apunta las dos rutas (ver `Lab.tsx`).
       *
       * Y es monótono a propósito: la lista de archivos guardados no encoge
       * nunca, así que este encargo no se despaloma cuando el alumno deshace o
       * vuelve a escribir. Un encargo de guardar que se cayera al teclear la
       * siguiente letra sería un castigo por seguir trabajando.
       */
      logro: { tipo: 'documento', comprueba: () => leerEscritorio().archivos.length > 0 },
      aprendido:
        'El letrero cambió a «Guardado». Guardar escribe tu documento en el disco con el nombre que ya tenía: Documento1.docx, en Mis documentos.',
    },
    {
      id: 'guardar-o-guardar-como',
      titulo: 'Piénsalo antes de buscar',
      instruccion:
        'Ya está guardado, pero se llama «Documento1.docx» y está en «Mis documentos»: eso lo eligió la computadora, no tú. Dentro de un mes, ¿sabrías cuál es? Tu maestra lo quiere con el nombre «Aviso museo del agua», en la carpeta «Escuela». ¿Cuál de estas herramientas cambia el nombre y la carpeta?',
      pista:
        'Una de las dos guarda encima del archivo que ya existe, sin preguntarte nada. La otra te pregunta primero el nombre y el sitio.',
      logro: {
        tipo: 'eleccion',
        opciones: ['Guardar', 'Guardar como', 'Imprimir', 'Copiar'],
        correcta: 1,
      },
      aprendido:
        '«Guardar» guarda encima, sin preguntar. «Guardar como» hace un archivo NUEVO y te deja elegir el nombre, la carpeta y el tipo.',
    },
    {
      /*
       * Abrir el cuadro es un encargo entero, y no el principio del siguiente.
       *
       * Tiene una razón pedagógica y otra de mecánica, y las dos apuntan igual.
       * La pedagógica: un cuadro de «Guardar como» pregunta TRES cosas y un niño
       * que llega con prisa rellena la primera y le da a Guardar; pararle un
       * segundo a mirar las tres es la clase. La de mecánica está en el
       * cableado: la ventana cuenta como tropiezo todo botón de la cinta que no
       * resuelva el encargo de ese momento, y no puede saber que éste no hace
       * nada más que abrir un cuadro. Dándole su propio encargo, el clic que la
       * clase manda dar deja de costar seis puntos.
       */
      id: 'abre-guardar-como',
      titulo: 'Ábrelo y míralo',
      instruccion:
        'Abre «Guardar como» y, antes de tocar nada, mira las TRES cosas que te pregunta: a la izquierda, en qué carpeta va; abajo, cómo se va a llamar; y debajo del nombre, de qué tipo es.',
      pista: 'Está justo al lado del botón Guardar que acabas de usar. Si no lo ves, pulsa «Enséñamelo».',
      senal: { pestana: 'inicio', grupo: 'gi-archivo', control: 'gi-guardar-como' },
      logro: { tipo: 'control', control: 'gi-guardar-como' },
      aprendido:
        'Te pregunta tres cosas y las tres son parte del trabajo: cómo se llama, en qué carpeta va y de qué tipo es.',
    },
    {
      id: 'ponle-nombre-y-carpeta',
      titulo: 'Ahora rellénalo',
      instruccion:
        'Escribe el nombre «Aviso museo del agua», entra a la carpeta «Escuela» en la lista de la izquierda y deja el tipo en «Documento de Word». Luego pulsa Guardar.',
      pista:
        'Si sólo cambias el nombre y dejas la carpeta que venía puesta, el archivo se guarda otra vez en «Mis documentos» y después no lo encuentras. Son DOS cosas: el nombre, en el cuadro de abajo; la carpeta, en la lista de la izquierda.',
      /*
       * Este encargo se resuelve DENTRO del cuadro, no en la cinta, y aun así
       * lleva señal. Por dos cosas que la señal enciende y que aquí valen más
       * que el propio aro:
       *
       *  · la **ficha**, que dice lo que este encargo enseña —«hace un archivo
       *    nuevo y te deja elegir tres cosas»— y se lee en el panel, que es la
       *    única franja de la ventana que el cuadro NO tapa;
       *  · el **desvío atendido**: el que cancela el cuadro y se pone a pulsar
       *    botones tiene que oír qué pulsó y ver su documento intacto. Sin
       *    `senal.control` el motor no sabe qué esperaba, y la cursiva de un
       *    despiste se quedaría puesta (§37.3, pieza 4).
       *
       * El precio es que el aro late detrás del velo, sobre un botón que
       * mientras el cuadro esté abierto no responde —medido: `elementFromPoint`
       * devuelve el velo—. Se paga a gusto: enseña de dónde salió el cuadro que
       * el niño tiene delante.
       */
      senal: { pestana: 'inicio', grupo: 'gi-archivo', control: 'gi-guardar-como' },
      logro: {
        tipo: 'documento',
        comprueba: () =>
          leerEscritorio().archivos.some(
            (a) => a.tipo === 'docx' && a.carpeta === 'Escuela' && normaliza(a.nombre).includes(CLAVE_DEL_NOMBRE),
          ),
      },
      aprendido:
        'El nombre y la carpeta son parte del trabajo, no un trámite. Un archivo que no se encuentra es igual que un archivo que no existe.',
    },
    {
      id: 'una-copia-en-pdf',
      titulo: 'Una copia que se pueda mandar',
      instruccion:
        'Los papás van a recibir el aviso por WhatsApp y casi ninguno tiene Word en el teléfono. Abre otra vez «Guardar como» y guarda una copia con el mismo nombre, pero cambiando el tipo a «PDF». Antes de guardar, entra un momento a «Mis documentos» y mira lo que sigue ahí.',
      /*
       * La pista NO contesta lo que el encargo manda ir a mirar. Que
       * «Documento1.docx» siga en su carpeta se dice DESPUÉS, en `aprendido`:
       * decirlo antes convertiría el encargo en leer una frase en vez de abrir
       * la carpeta y verlo. Es la misma regla del halo, un piso más abajo.
       */
      pista:
        'El nombre y la carpeta ya vienen puestos de la vez pasada. Lo único que hay que cambiar es el cuadro «Tipo», debajo del nombre. Fíjate en cómo cambia el renglón que dice cómo se va a llamar el archivo.',
      senal: { pestana: 'inicio', grupo: 'gi-archivo', control: 'gi-guardar-como' },
      logro: {
        tipo: 'documento',
        comprueba: () =>
          leerEscritorio().archivos.some(
            (a) => a.tipo === 'pdf' && normaliza(a.nombre).includes(CLAVE_DEL_NOMBRE),
          ),
      },
      aprendido:
        'El .docx se sigue editando; el PDF se ve igual en cualquier teléfono, pero ya no se toca. Y el viejo sigue donde estaba: Guardar como nunca borra ni mueve, sólo crea.',
    },
    {
      id: 'cuenta-el-papel',
      titulo: 'Cuenta el papel antes de gastarlo',
      instruccion:
        'Última cosa, y es la que más te va a servir. Hay que darle un aviso a cada niño del salón: son 30. Abre Imprimir, escribe 30 en el cuadro de Copias y, ANTES de pulsar el botón grande, lee el renglón amarillo de abajo. Cuando lo hayas leído, imprime.',
      pista:
        'El cuadro de Copias está arriba a la izquierda, pegado al botón grande. Borra el 1 y escribe 30. Si imprimes con otro número, el encargo se queda sin hacer.',
      senal: { pestana: 'inicio', grupo: 'gi-archivo', control: 'gi-imprimir' },
      logro: {
        tipo: 'documento',
        comprueba: () => {
          const e = leerEscritorio();
          return e.impreso && e.copias === 30;
        },
      },
      aprendido:
        'Nadie imprime a ciegas. La vista previa te enseña las hojas antes de gastarlas, y multiplicarlas por las copias te dice cuánto papel se va.',
    },
  ],
};
