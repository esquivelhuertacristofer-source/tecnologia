import type { GuionClase } from '@/components/office/motor/guion';
import { marcaEnTodoElBloque } from '@/components/office/motor/consultas';
import { bloqueOriginal, entradasDelIndice, indiceMenciona, indiceReal } from './indice';

/**
 * `of-word-estilos-e-indice` · «Estilos y tabla de contenido» — guion del
 * laboratorio (doc §33 y §36.3).
 *
 * Lo que esta clase enseña, según el currículo: «que poner Título 1 no es poner
 * negrita grande: es marcar la estructura, y por eso el índice se genera y se
 * actualiza solo».
 *
 * De ahí salen los ocho encargos, y cuatro decisiones que conviene dejar
 * escritas:
 *
 *  · **El error se provoca, no se advierte.** Los encargos 4 y 5 mandan hacer
 *    justo lo que hace todo el mundo la primera vez —seleccionar el renglón y
 *    subirle el tamaño hasta que parezca un título— y después mandan mirar el
 *    índice, donde ese renglón NO está. La frase «un Título 1 no es negrita más
 *    grande» no se aprende leyéndola; se aprende cuando la máquina te la
 *    demuestra. El encargo 4 no es un despiste del alumno: es un encargo que el
 *    maestro le da a propósito, y por eso se palomea.
 *
 *  · **Un encargo, un botón — y se comprueba ese botón y ninguno más.** La
 *    negrita del renglón falso viene puesta desde el documento y no la pone el
 *    alumno, y no es por ahorrarle trabajo: es porque el motor cobra un tropiezo
 *    por cada pulsación que no cierra el encargo. Medido: con «dale negrita y
 *    ponlo en 14» la pulsación de negrita —que es exactamente lo que se le acaba
 *    de pedir— bajaba la nota de 100 a 94 y sacaba la pista de «no seleccionaste
 *    nada» a un alumno que había seleccionado bien. La segunda mitad de la regla
 *    salió de jugar mal: la comprobación seguía exigiendo la negrita aunque el
 *    encargo ya no la pidiera, y como el botón N está en el mismo grupo que el
 *    tamaño y el renglón ya viene en negrita, pulsarlo la APAGA. El alumno hacía
 *    después lo que se le pedía y el encargo no se cerraba nunca. Con el desvío
 *    del §37 esa trampa se cierra sola —pulsar la N con el renglón seleccionado
 *    se deshace en el acto, comprobado: el documento queda idéntico— pero la
 *    regla se queda escrita, porque el arreglo del motor protege de la SEGUNDA
 *    mitad y no de la primera: un encargo que pida dos cosas seguiría cobrando
 *    un tropiezo por la primera.
 *
 *  · **El encargo 2 no lleva señalador.** Es la pregunta bisagra —¿en qué
 *    pestaña se busca un índice?— y señalar «Referencias» la contestaría antes
 *    de que el alumno la piense. La pista no da el sitio, da la regla: Insertar
 *    mete cosas nuevas, y un índice no es nada nuevo, es una lista de lo que ya
 *    está. Se guía la mano, no la cabeza (§37.4).
 *
 *  · **Modo guía, 10-ago-2026 (§37).** Los cinco encargos que se resuelven
 *    pulsando algo de la cinta llevan `senal.control` con el id EXACTO del
 *    botón, y de ahí salen solos el señalador con su rótulo, la ficha con el
 *    domicilio y el «para qué sirve», el «Enséñamelo» y —lo que más importa— el
 *    deshacer del desvío: pulsar el botón equivocado con el renglón seleccionado
 *    ya no ensucia el documento. Eso obligó a **acortar** las instrucciones: lo
 *    que la ficha ya dice —en qué pestaña, en qué grupo, qué hace— se borró del
 *    texto, que se queda sólo con lo que la ficha no puede saber: QUÉ hay que
 *    conseguir en ESTE documento y por qué. Los dos encargos que señalan el
 *    panel de Navegación (1 y 8) no llevan control porque no se resuelven en la
 *    cinta; el señalador los alcanza igual por `grupo`, que es lo que hace el
 *    `data-grupo="navegacion"` del panel.
 *
 *  · **Todo se ancla por posición, y la posición se cuenta sin el índice y sin
 *    los renglones vacíos.** El renglón que hay que arreglar es el bloque 11 de
 *    los que tienen algo escrito y no son del índice. No se le nombra por su
 *    texto —el alumno lo tiene seleccionado y una tecla lo borra (§36.8 C)— y no
 *    se le cuenta por su sitio bruto en el documento, porque insertar el índice
 *    mete siete párrafos por delante y correría la cuenta. `bloqueOriginal`
 *    cuenta saltándose el tramo del índice y los renglones en blanco, y las dos
 *    exclusiones salen de defectos medidos jugando mal: un Enter dentro del
 *    índice, o un Enter en el renglón vacío del encargo 3, corrían la cuenta y
 *    el maestro acusaba al alumno de haber deshecho algo que nunca deshizo. El
 *    detalle y la medición están en `indice.ts`.
 *
 *  · **Ningún encargo de documento puede dejar de cumplirse más tarde.** El
 *    motor relee en cada cambio los encargos ya palomeados y devuelve al alumno
 *    al primero que deje de valer (§36.8 B). Eso obliga a que las preguntas
 *    resistan lo que viene después: por eso el encargo 3 pide «al menos cuatro
 *    entradas» y no «tantas como títulos» —el encargo 6 crea un título nuevo y
 *    la segunda forma se habría vuelto falsa sola—, y por eso el encargo 8 manda
 *    renombrar el ÚLTIMO título y no el que vigilan los encargos 6 y 7.
 */

/**
 * El renglón que hay que arreglar: el número once de los bloques con algo
 * escrito que no son del índice. Es una subsección de «Cómo la regamos» escrita
 * como párrafo normal, que es como llegan los documentos de verdad.
 */
const FALSO = 11;

/** El último título del reporte. El encargo 8 lo renombra para ver qué se mueve. */
const ULTIMO_TITULO = 15;

/**
 * El reporte de la huerta, a medio arreglar: ya trae cuatro secciones con
 * estilo y una subsección con estilo, y una subsección puesta a mano que es
 * donde vive toda la clase.
 */
const DOCUMENTO = `
<p class="es-centro"><span data-pt="18"><strong>La huerta de la escuela</strong></span></p>
<p class="es-centro">Reporte del equipo 3 · 5.º B · Escuela Primaria Vicente Guerrero · Junio de 2026</p>
<p></p>
<h1>De qué trata este reporte</h1>
<p>En marzo la maestra Lupita nos prestó el pedazo de tierra que está atrás de la cancha, junto a la barda. Éramos cinco del equipo 3 y teníamos que entregar un reporte al terminar el ciclo. Aquí contamos qué sembramos, cómo cuidamos la huerta durante tres meses, qué se nos murió y qué haríamos distinto el año que entra. Lo escribimos entre todos en la hora de la biblioteca, y las fotos las tomó Ximena con el celular de su mamá.</p>
<h1>Qué sembramos</h1>
<p>Escogimos plantas que crecen rápido, porque sólo teníamos hasta junio y queríamos ver resultados antes de las vacaciones. La lista quedó así:</p>
<ul>
  <li>Rábanos, que salen en menos de un mes</li>
  <li>Cilantro y perejil, en la orilla que da al sol</li>
  <li>Jitomate cherry, dos matas en botes de pintura</li>
  <li>Frijol, para el experimento de la clase de ciencias</li>
</ul>
<h2>Las semillas que nos regaló doña Rosa</h2>
<p>Doña Rosa, la señora de la tienda de la esquina, nos regaló un puño de semillas de calabaza que le sobraron del año pasado. No estaban en el plan, pero las sembramos junto a la barda y fueron las que mejor se dieron. Aprendimos que conviene preguntar antes de comprar: en el barrio hay más semillas de las que uno cree.</p>
<h1>Cómo la regamos</h1>
<p>Hicimos un calendario y lo pegamos en la puerta del salón. Cada equipo regaba dos días a la semana, temprano, antes de entrar a clases, porque si se riega al mediodía el agua se evapora y las hojas se queman con el sol. Usamos las cubetas del lavadero y una manguera que nos prestó el conserje.</p>
<p><strong>La semana de las vacaciones</strong></p>
<p>En la semana de vacaciones nadie fue a la escuela y nadie regó. Cuando volvimos, los rábanos estaban aguados y el cilantro se había secado casi todo. Fue el error más grande que cometimos, y ni siquiera fue por flojera: se nos olvidó que la huerta no tiene vacaciones. El año que entra hay que dejar apuntado quién riega cuando la escuela está cerrada, aunque sea pasando a media semana nada más a mojar la tierra.</p>
<h1>Los animales que se metieron</h1>
<p>No todo fue cosa del agua. Un perro se metió dos veces por el hueco de la barda y se acostó encima de los rábanos, así que tuvimos que tapar el hueco con tabiques y un pedazo de malla que estaba tirado en la bodega. En mayo aparecieron unos gusanos verdes en las hojas de la calabaza. No usamos veneno porque la maestra dijo que después nadie se iba a querer comer nada de ahí, así que los quitábamos a mano, con guantes, los martes en el recreo. Fue latoso, pero funcionó: la calabaza siguió dando hasta el final.</p>
<h1>Lo que aprendimos</h1>
<p>Que una huerta es trabajo de todos los días y que se nota rapidísimo cuando alguien falla. También que sale más barato de lo que pensábamos: casi todo lo conseguimos regalado o reusado, y lo único que compramos fue una bolsa de tierra. Y que el jitomate en bote sí funciona, aunque da bastante menos que en la tierra y hay que regarlo más seguido.</p>
<p>Al final cosechamos dos kilos de rábanos, un montón de cilantro y catorce jitomates. Se los llevamos a la cocina de la escuela y ahí se acabaron el mismo día. La maestra nos dijo que el año que entra el terreno se queda para el equipo que quiera seguirle, y nosotros le dejamos escrito este reporte para que no empiecen desde cero.</p>
`;

export const GUION: GuionClase = {
  archivo: 'Reporte de la huerta.docx',
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Grado intermedio · Clase 1 de 3',
    tema: 'Estilos de título, panel de navegación y tabla de contenido',
    objetivo:
      'Que al terminar sepas que un título no es letra grande sino una etiqueta que le pones al renglón, y que por eso puedes pedirle a la máquina el índice de un documento de veinte páginas y tenerlo en un clic.',
    vasAHacer: [
      'Ver en el panel de Navegación que el documento tiene un esqueleto, y saltar de una sección a otra con un clic.',
      'Decidir tú en qué pestaña se busca un índice, y hacer que el programa lo escriba solo.',
      'Poner un título «a mano» —negrita y grande— y descubrir que el índice no se entera.',
      'Arreglarlo con el estilo Título 2 y volver a actualizar: ahora sí aparece.',
    ],
    requisitos:
      'Haber visto cómo está ordenada la cinta: pestañas, grupos y el rótulo que dice para qué sirve cada montón de botones.',
    ayuda:
      'El maestro de la derecha te marca con un aro naranja el botón exacto, y te dice cómo se llama y para qué sirve antes de que lo pulses. Si no lo ves, pulsa «Enséñamelo». Y si te equivocas de botón, te dice qué pulsaste y lo deshace, para que el reporte no se te ensucie. Un encargo no lleva aro a propósito: ése lo tienes que pensar tú.',
  },

  pasos: [
    {
      id: 'ver-el-esqueleto',
      titulo: 'El documento tiene esqueleto',
      instruccion:
        'Esa lista de la izquierda no la escribió nadie: el programa la sacó de los títulos del reporte. Haz clic en «Cómo la regamos» y el documento salta ahí. Luego deja el cursor en ese renglón y mira la cinta: la cajita «Título 1» se queda apretada.',
      pista:
        'El panel de Navegación es la columna blanca del extremo izquierdo, la que dice «Navegación» arriba. Es lo que está dentro del aro naranja.',
      // Sin `control`: aquí no se pulsa nada de la cinta, se pulsa dentro del
      // panel de esta clase. El señalador lo alcanza por su `data-grupo`.
      senal: { grupo: 'navegacion' },
      logro: { tipo: 'confirma', boton: 'Ya lo vi' },
      aprendido:
        'El programa ya sabe qué renglones son títulos. No lo adivina por el tamaño: se lo dice el estilo que tienen puesto.',
    },
    {
      id: 'donde-se-busca',
      titulo: '¿Dónde lo buscarías?',
      instruccion:
        'A este reporte le falta el índice: la lista de sus secciones con la página de cada una. Antes de buscar el botón, decide tú: ¿en qué PESTAÑA se busca algo así?',
      // La primera frase corrige a propósito el recado que el programa da al
      // fallar una elección, que está escrito para todas las clases y habla de
      // «grupos». Aquí la pregunta es por la PESTAÑA, y un niño que acaba de
      // leer «lee otra vez para qué sirve cada grupo» se pone a mirar los
      // rótulos de abajo de la cinta, que no es donde está la respuesta.
      pista:
        'No mires los grupos de abajo: aquí se pregunta por la PESTAÑA. Lee los nombres de las cinco y piensa qué hace un índice. No cambia la letra, y tampoco mete nada nuevo: hace una lista de lo que YA está escrito y dice dónde está cada parte.',
      logro: {
        tipo: 'eleccion',
        opciones: ['Inicio', 'Insertar', 'Disposición', 'Referencias'],
        correcta: 3,
      },
      aprendido:
        'Referencias es la pestaña de las herramientas que hablan del propio documento: su índice, sus notas, sus citas.',
    },
    {
      id: 'poner-el-indice',
      titulo: 'Que lo escriba la máquina',
      instruccion:
        'Haz clic en el renglón vacío que hay debajo del nombre del equipo: ahí es donde quieres que caiga el índice. Después pulsa el botón. Tú no escribas nada.',
      pista:
        'Primero el clic en el renglón vacío y después el botón: el índice se mete debajo del renglón donde tengas el cursor, igual que en Word.',
      senal: { pestana: 'referencias', grupo: 'tdc', control: 'tdc' },
      logro: {
        // Cuatro y no «tantas como títulos»: el encargo 6 crea un título más, y
        // una pregunta que se vuelve falsa sola devolvería al alumno aquí.
        tipo: 'documento',
        comprueba: (doc) => entradasDelIndice(doc).length >= 4,
      },
      aprendido:
        'Ese índice no lo escribiste tú: el programa leyó los títulos del documento y los copió con su página. Por eso hay que marcar los títulos de verdad.',
    },
    {
      id: 'titulo-a-mano',
      titulo: 'Hazlo como lo haría cualquiera',
      instruccion:
        '«La semana de las vacaciones», dentro de «Cómo la regamos», es una parte del reporte escrita como un párrafo normal. Termínala como lo haría todo el mundo: selecciónala entera arrastrando el ratón y ponla en 14.',
      pista:
        'Si eliges el tamaño con el cursor dentro del renglón y sin seleccionar nada, no cambia nada: el formato actúa sobre lo que está seleccionado. Arrastra el ratón de la primera letra a la última y luego elige 14.',
      senal: { pestana: 'inicio', grupo: 'fuente', control: 'fuente-tamano' },
      logro: {
        // Se comprueba EL TAMAÑO Y NADA MÁS, que es lo único que el encargo
        // pide. Antes se exigía además la negrita —la que trae el documento— y
        // eso era una condición escondida con trampa medida: el botón N está en
        // el mismo grupo que el tamaño, un niño lo pulsa para «hacerlo más
        // título», y como el renglón YA está en negrita lo que hace es
        // apagarla. A partir de ahí hacía exactamente lo que se le pedía
        // —seleccionar y poner 14— y el encargo no se daba por hecho, mientras
        // la pista le hablaba de la selección, que era lo único que tenía bien.
        // Un encargo sólo puede exigir lo que dice que exige.
        tipo: 'documento',
        comprueba: (doc) => {
          const i = indiceReal(doc, FALSO);
          if (i < 0) return false;
          return marcaEnTodoElBloque(doc, i, 'tamano', (a) => Number(a.pt) >= 14);
        },
      },
      aprendido: 'Ya se ve como un título. Ahora vamos a ver si el programa opina lo mismo.',
    },
    {
      id: 'no-esta',
      titulo: 'Pregúntale al programa',
      instruccion:
        'Acabas de dejar ese renglón grande y en negrita. Pon el índice al día y léelo con calma: «La semana de las vacaciones» NO está. Y en el panel de Navegación de la izquierda tampoco aparece.',
      pista:
        'El índice no se arregla escribiéndole encima ni se entera solo: hasta que no pulsas el botón, sigue diciendo lo de antes.',
      senal: { pestana: 'referencias', grupo: 'tdc', control: 'actualizar-tdc' },
      // El índice queda EXACTAMENTE igual que antes, así que no hay nada en el
      // documento que demuestre que se actualizó: es de los pocos casos en que
      // el logro honesto es el gesto y no el papel.
      logro: { tipo: 'control', control: 'actualizar-tdc' },
      aprendido:
        'El programa no mira si un renglón se ve grande. Para él, ése sigue siendo un párrafo normal que está en negrita.',
    },
    {
      id: 'el-estilo-de-verdad',
      titulo: 'Ahora sí: dile lo que es',
      instruccion:
        'Deja el cursor en «La semana de las vacaciones» y pulsa «Título 2». Es Título 2 y no Título 1 porque es una parte DENTRO de «Cómo la regamos». Mira el panel de Navegación en cuanto lo pulses.',
      /*
       * Esta pista se reescribió el 10-ago-2026 y el motivo es una MEDICIÓN, no
       * un capricho de estilo. Decía: «si pulsaste Título 1, mira la Navegación:
       * tu renglón salió al mismo nivel que Cómo la regamos». Con el desvío del
       * §37 eso ya NO PUEDE PASAR: se pulsa Título 1, el programa lo nombra, lo
       * explica y **deshace el cambio**, así que la Navegación queda exactamente
       * igual que antes —comprobado, entrada por entrada—. La pista mandaba al
       * alumno a mirar una prueba que no existe, que es la peor clase de pista.
       * Ahora explica la regla —qué manda el nivel— en vez de narrar un accidente.
       */
      pista:
        'El nivel no lo manda el tamaño, lo manda de quién cuelga. «Cómo la regamos» es una sección grande del reporte: ésa es Título 1. Este renglón cuenta una parte DE DENTRO de esa sección, así que va un escalón más abajo: Título 2.',
      senal: { pestana: 'inicio', grupo: 'estilos', control: 'titulo2' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          const b = bloqueOriginal(doc, FALSO);
          return b?.tipo === 'titulo' && b.nivel === 2;
        },
      },
      aprendido:
        'Apareció en la Navegación en el acto, y metido debajo de su sección. «Título 2» no es un aspecto: es decirle al programa que ese renglón ES una parte del documento.',
    },
    {
      id: 'ahora-si-sale',
      titulo: 'Y ahora, al índice',
      instruccion:
        'Pon el índice al día otra vez y léelo. «La semana de las vacaciones» ya está ahí, con su número de página y un poco más adentro que las secciones grandes, porque es una parte de dentro y no una sección grande.',
      pista:
        'Es el mismo botón de hace dos encargos, y el que no funcionó entonces. Ahora sí, porque lo que cambió no es el índice: es el renglón.',
      senal: { pestana: 'referencias', grupo: 'tdc', control: 'actualizar-tdc' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          const b = bloqueOriginal(doc, FALSO);
          if (b?.tipo !== 'titulo') return false;
          return indiceMenciona(doc, b.texto);
        },
      },
      aprendido:
        'Lo mismo que hiciste con un renglón sirve para un trabajo de veinte páginas: marcas los títulos y el índice sale solo, con las páginas bien.',
    },
    {
      id: 'la-foto',
      titulo: 'Una última prueba',
      instruccion:
        'Selecciona el texto del último título, «Lo que aprendimos», y escribe encima «Lo que nos falta». Mira las dos cosas a la vez: en el panel de Navegación el nombre cambia mientras tecleas; en el índice sigue el nombre viejo.',
      pista:
        'El último título es el de abajo del todo, el que va antes de los dos párrafos del final. Escribe encima; no hace falta que actualices nada.',
      // Sin `control`: esto se resuelve tecleando, no pulsando. El aro va al
      // panel de Navegación porque es donde hay que MIRAR mientras se teclea.
      senal: { grupo: 'navegacion' },
      logro: { tipo: 'confirma', boton: 'Ya lo vi' },
      aprendido:
        'El índice es una FOTO del documento en el momento en que lo generaste. Por eso existe «Actualizar tabla», y por eso se actualiza siempre antes de imprimir.',
    },
  ],

  /*
   * La frase de «Terminaste» la escribe la clase (§37) y va en voz de lo que el
   * alumno YA SABE HACER, no de lo que se le enseñó. Aquí lo que se lleva no es
   * «vi un índice»: es que un título es una ETIQUETA, y que por eso la máquina
   * puede escribir sola la lista de un trabajo largo.
   */
  cierre:
    'Ya sabes marcar un renglón como título de verdad y pedirle al programa el índice hecho, con las páginas puestas. Y sabes lo que casi nadie sabe: que poner la letra grande no convierte nada en título, y que el índice es una foto que hay que volver a tomar cuando el documento cambia.',
};

/** Sólo para leerlo desde las sondas: cuál es el renglón que la clase arregla. */
export const BLOQUES_CLAVE = { FALSO, ULTIMO_TITULO };

export default GUION;
