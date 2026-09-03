import type { GuionClase } from '@/components/office/motor/guion';
import {
  camposDeLaCelda,
  formulario,
  OPCIONES_EQUIPO,
  TEXTO_MUESTRA,
  TINTA_CAMPO,
} from './formulario';

/**
 * `of-word-formularios` · «Una ficha que se rellena sola» — guion de la clase.
 *
 * Lo que el currículo le pide a esta clase: «campos rellenables y bloquear todo
 * lo demás, para que quien rellene no pueda romper el documento». De ahí sale la
 * forma de los ocho encargos, y en concreto estas decisiones:
 *
 *  · **El arco es el de un trabajo de verdad, no el de un temario.** Primero se
 *    hacen los huecos (1, 2, 3), después se decide dónde se protege (4), se
 *    protege (5, 6), se mira lo que nadie descubre solo (7) y se termina
 *    contestando la ficha ya blindada (8), que es la prueba de que todo lo
 *    anterior sirvió para algo.
 *
 *  · **El encargo de MIRAR va el séptimo y no el octavo, y eso se midió.** Iba
 *    al final —«vuelve a abrir Restringir edición y fíjate en…»— y volver a
 *    abrirlo obligaba a pulsar un botón de la cinta, que el motor cuenta como
 *    intento fallido porque el encargo no se cierra pulsando nada: una partida
 *    perfecta salía con un tropiezo y 94 puntos por hacer justo lo que se le
 *    pedía. Es §36.8 (D) otra vez —lo que el programa invita a hacer no puede
 *    cobrar—. Puesto detrás de aplicar la protección, el panel ya está abierto y
 *    no hay nada que pulsar; y de paso la clase termina contestando la ficha,
 *    que es mejor final que un «ya lo vi».
 *
 *  · **Cuatro de los ocho encargos no llevan `senal`, y los cuatro por su
 *    motivo** (§37, modo guía). Los otros cuatro —1, 2, 3 y 5— se resuelven
 *    pulsando un botón de la cinta y llevan `senal.control`, que es lo que
 *    enciende el señalador con su rótulo, la ficha de la herramienta y
 *    «Enséñamelo». Medido el 10-ago-2026 encargo por encargo: **cinco de los
 *    ocho con algo señalado —cuatro en la cinta y el sexto dentro del panel— y
 *    tres sin nada, a propósito.** Los que no llevan `senal`:
 *      · **4, la pregunta bisagra.** «Esto ya no es meter nada nuevo, es
 *        defender lo que hay: ¿dónde se busca eso?» Señalarla sería contestarla:
 *        se guía la mano, no la cabeza (§37.4). La ayuda llega por la pista, que
 *        da la regla y no el sitio.
 *      · **6, que se resuelve DENTRO del panel de Restringir edición**, no en la
 *        cinta. Llevaba `senal: { grupo: 'proteger' }` y se midió el 10-ago-2026:
 *        el aro se quedaba en la cinta —arriba a la izquierda— mientras las tres
 *        cosas que hay que hacer estaban en el panel de la derecha, y sin rótulo
 *        ni ficha porque un grupo no es una herramienta. Un señalador que apunta
 *        al lado contrario de la pantalla enseña peor que ninguno. `Senal` sólo
 *        sabe direccionar la cinta; queda dicho para el motor. Mientras tanto
 *        **el aro no desaparece: se muda al panel**, que se señala a sí mismo
 *        con el mismo naranja (`PanelRestringir`, prop `guiar`) y sólo cuando la
 *        ficha ya tiene sus huecos, para no señalar el encargo 6 en el 1.
 *      · **7, que pide MIRAR** —y además pide NO pulsar—.
 *      · **8, que se contesta con el ratón y el teclado dentro de la hoja.**
 *
 *  · **Las instrucciones no dicen dónde está el botón, y es a propósito.** La
 *    ficha de la herramienta ya enseña el glifo, el nombre y el domicilio
 *    —«Insertar → Controles → Campo de texto»— leídos de la cinta viva. Repetir
 *    eso en la instrucción es escribirlo dos veces para que se contradigan el día
 *    que un botón se mude. La instrucción se queda con lo que la ficha no puede
 *    saber: qué hay que conseguir en ESTA ficha y por qué.
 *
 *  · **Los encargos se anclan a la CELDA, no al rótulo, y miran la celda
 *    ENTERA.** «El hueco de Nombre completo» se comprueba como «fila 0, columna
 *    1 de la primera tabla». Es §36.8 (C): con la ficha aún sin proteger se
 *    puede teclear encima del rótulo —comprobado el 10-ago-2026, el título se
 *    deja borrar entero y la clase se termina igual—, y un encargo anclado al
 *    texto dejaría de poderse cumplir para siempre. Y en plural, porque una
 *    celda puede acabar con dos huecos: ver `camposDeLaCelda`.
 *
 *  · **El error típico del tema tiene su encargo y su pista.** Es el 1: meter el
 *    campo sin haber puesto antes el cursor DENTRO del hueco. El campo cae en
 *    mitad del texto que nadie debe tocar, y ése es exactamente el fallo que
 *    convierte un formulario en un desastre. La pista lo dice palabra por
 *    palabra, y salta sola al primer intento fallido.
 *
 *  · **El encargo 7 no pide hacer nada, pide MIRAR** —y además pide NO pulsar—.
 *    Que «Suspender la protección» esté ahí, a un clic y sin contraseña, es la
 *    mitad de la lección: proteger sirve para que la ficha no se estropee sin
 *    querer, no para guardar secretos. Nadie lo descubre solo, y es lo único de
 *    la clase que no deja rastro en el documento.
 */

/**
 * La ficha, tal como sale de la dirección de la escuela: los rótulos escritos y
 * los huecos vacíos… salvo uno.
 *
 * El hueco de «Grado y grupo» viene **con el campo ya puesto**, en su gris. Es
 * el ejemplo resuelto: el alumno ve a qué tiene que llegar antes de que se le
 * pida hacerlo, y de paso el gris deja de ser una decoración rara y pasa a ser
 * «aquí sí se escribe».
 */
const DOCUMENTO = `
<h1>Ficha de inscripción al taller de robótica</h1>
<p>Escuela Secundaria Técnica «Ignacio Ramírez» · Ciclo escolar 2026-2027</p>
<p>El taller es los miércoles de 2 a 4 de la tarde en el aula de medios. Hay 24 lugares y se reparten por orden de entrega. Llena esta ficha en la computadora y mándala al correo de la dirección antes del viernes 28 de agosto.</p>
<table>
  <tbody>
    <tr><td>Nombre completo del alumno</td><td></td></tr>
    <tr><td>Grado y grupo</td><td><mark data-color="${TINTA_CAMPO}">${TEXTO_MUESTRA}</mark></td></tr>
    <tr><td>Equipo en el que quieres estar</td><td></td></tr>
    <tr><td>Tengo el permiso de mi familia</td><td></td></tr>
  </tbody>
</table>
<p>Los datos de esta ficha sólo los usa la escuela para armar los equipos y para avisarle a tu familia si el taller se cambia de día.</p>
`;

/** Un hueco de texto está contestado si ya no dice lo que decía de fábrica. */
function contestado(texto: string) {
  const t = texto.trim();
  return t.length >= 2 && t !== TEXTO_MUESTRA;
}

export const GUION: GuionClase = {
  archivo: 'Ficha de inscripción - robótica.docx',
  html: DOCUMENTO,

  portada: {
    situacion: 'Word · Grado avanzado · Clase 3 de 4',
    tema: 'Formularios: controles rellenables y restringir la edición',
    objetivo:
      'Que al terminar sepas convertir un documento normal en una ficha que se rellena en la computadora, con huecos donde sí se escribe y con todo lo demás bloqueado, para que treinta personas la contesten sin que ninguna pueda romperla.',
    vasAHacer: [
      'Poner los huecos de la ficha: un campo de texto, una lista desplegable y una casilla de verificación.',
      'Decidir tú solo en qué pestaña se protege un documento, que no es donde se mete lo nuevo.',
      'Restringir la edición a «Rellenar formularios» y ver que quitar la protección no pide contraseña.',
      'Contestar la ficha entera con el candado puesto, y comprobar que el título ya no se deja borrar.',
    ],
    requisitos:
      'Moverte por la cinta y escribir dentro de una tabla. Es lo de las clases anteriores; aquí no se empieza de cero.',
    ayuda:
      'En los encargos que se resuelven pulsando algo, el maestro te lo señala desde el primer segundo con un aro naranja y te dice en su ficha cómo se llama y dónde vive; «Enséñamelo» te abre la pestaña y te lo agranda, pero no lo pulsa por ti. Si pulsas otro, te dice cuál era, para qué sirve y deshace el cambio, para que la ficha no se ensucie. En tres de los ocho encargos no hay aro, a propósito: ahí no hay botón que pulsar —hay que decidir, mirar o contestar la ficha—.',
  },

  pasos: [
    {
      id: 'campo-de-texto',
      titulo: 'El primer hueco',
      instruccion:
        'La casilla de la derecha de «Grado y grupo» ya trae un hueco gris: ahí es donde la escuela deja escribir. Ponle uno igual a «Nombre completo». Primero haz clic DENTRO de su casilla vacía, porque el hueco nace donde esté el cursor. Después sigue el aro naranja: primero a la pestaña, luego al botón.',
      pista:
        'Si pulsas el botón sin haber hecho clic antes dentro de la casilla vacía, el hueco gris te cae en mitad del texto que nadie debe tocar. Deshaz con la flecha de arriba, haz clic dentro de la casilla de la derecha de «Nombre completo», y vuelve a pulsar el botón.',
      senal: { control: 'campo-texto' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => camposDeLaCelda(doc, 0, 1).some((c) => c.tipo === 'texto'),
      },
      aprendido:
        'Un campo es un hueco: la única parte del documento donde quien lo reciba va a poder escribir.',
    },
    {
      id: 'lista-desplegable',
      titulo: 'Cuando sólo hay tres respuestas',
      instruccion:
        'En «Equipo en el que quieres estar» sólo hay tres equipos posibles. Si cada quien escribe lo que se le ocurra, la escuela no va a poder contar cuántos son: haz clic dentro de esa casilla vacía y ponle ahí la lista.',
      pista:
        'Primero el clic dentro de la casilla vacía, después el botón: el hueco nace donde esté el cursor. Si te sale en otro sitio, deshaz con la flecha de arriba y vuelve a empezar.',
      senal: { control: 'campo-lista' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => camposDeLaCelda(doc, 2, 1).some((c) => c.tipo === 'lista'),
      },
      aprendido:
        'Una lista no sirve para escribir menos: sirve para que nadie conteste algo que no estaba previsto.',
    },
    {
      id: 'casilla-de-verificacion',
      titulo: 'Sí o no, sin escribir',
      instruccion:
        'Falta «Tengo el permiso de mi familia», que sólo se contesta sí o no. Haz clic dentro de su casilla vacía y ponle ahí la casilla de verificación. Después pruébala en la hoja: un clic encima del cuadrito lo palomea y otro lo vuelve a dejar en blanco.',
      pista:
        'Aparece un cuadrito ☐ en gris. Para marcarlo hay que hacer clic ENCIMA del cuadrito, en la hoja, no otra vez en el botón de la cinta.',
      senal: { control: 'campo-casilla' },
      logro: {
        tipo: 'documento',
        comprueba: (doc) => camposDeLaCelda(doc, 3, 1).some((c) => c.tipo === 'casilla'),
      },
      aprendido:
        'Una casilla contesta sí o no de un clic. Nadie escribe «cí» ni «S/N» ni deja el renglón en blanco.',
    },
    {
      id: 'donde-se-protege',
      titulo: 'Piénsalo antes de buscar',
      instruccion:
        'Los tres huecos ya están. Ahora falta lo importante: que quien reciba la ficha pueda rellenarlos y NO pueda cambiar el título, ni los rótulos, ni la fecha de entrega. Eso ya no es meter algo nuevo en el documento: es defender lo que ya está escrito. ¿En qué pestaña lo buscas?',
      pista:
        'Piensa qué cosas se le hacen a un documento que YA está escrito: corregirle la ortografía, ponerle comentarios, ver quién le cambió qué… y protegerlo. Lee los nombres de las pestañas: hay una que nombra justo eso.',
      logro: {
        tipo: 'eleccion',
        opciones: ['Inicio', 'Insertar', 'Disposición', 'Revisar'],
        correcta: 3,
      },
      aprendido:
        'Insertar es para meter cosas nuevas. Revisar es para lo que se le hace a un documento ya escrito, y proteger es una de esas cosas.',
    },
    {
      id: 'abrir-restringir',
      titulo: 'Abre el panel',
      instruccion:
        'Acertaste: se protege desde Revisar. Pulsa ahí el botón del aro. No cambia ni una letra del documento: abre un panel a la derecha, y ese panel es donde se deciden las reglas de la ficha.',
      pista:
        'El aro está sobre el botón exacto. Si no lo ves, es que estás en otra pestaña: pulsa «Enséñamelo» y el maestro te abre la que toca sin pulsarlo por ti.',
      senal: { control: 'restringir' },
      logro: { tipo: 'control', control: 'restringir' },
      aprendido:
        'Proteger no se hace en el documento: se hace desde un panel que decide las reglas de todo el archivo.',
    },
    {
      id: 'aplicar-proteccion',
      titulo: 'Elige bien la regla',
      instruccion:
        'El aro se muda al panel de la derecha. Marca ahí la casilla que permite sólo un tipo de edición, elige «Rellenar formularios» y aplica. Ojo con la última opción de la lista: «Sin cambios (Sólo lectura)» bloquea TODO, hasta los huecos, y entonces la ficha ya no se puede contestar.',
      pista:
        '«Sin cambios (Sólo lectura)» deja la ficha para mirarla y nada más: ni tú podrías escribir tu nombre. La que necesitas es «Rellenar formularios»: cierra el texto y deja abiertos los huecos grises. Si ya aplicaste la que no era, pulsa «Suspender la protección» al final del panel y vuelve a elegir.',
      /*
       * Sin señalador, y no por descuido (§37.4 y la cabecera de este archivo):
       * los tres gestos de este encargo viven DENTRO del panel de la derecha, y
       * `Senal` sólo sabe apuntar a la cinta. El aro de `grupo: 'proteger'` que
       * había aquí se quedaba arriba a la izquierda, en el lado contrario de la
       * pantalla, sin rótulo y sin ficha —un grupo no es una herramienta—.
       */
      logro: {
        tipo: 'documento',
        // La protección es una propiedad del archivo, no de sus letras: en Word
        // viaja DENTRO del .docx. Preguntarle al aparato si está protegido es
        // preguntarle al documento, no vigilar qué botón se pulsó — y por eso
        // suspenderla vuelve a dejar este encargo por hacer, como debe ser.
        comprueba: () => formulario.modo === 'formularios',
      },
      aprendido:
        'Restringir la edición a «Rellenar formularios» deja abiertos los huecos y cierra todo lo demás.',
    },
    {
      id: 'suspender-no-pide-clave',
      titulo: 'Antes de confiarte, mira esto',
      instruccion:
        'La ficha ya está cerrada. Mira el final del panel: el botón «Suspender la protección» NO pide contraseña, así que cualquiera con el archivo la quita en un clic. Proteger evita accidentes, no secretos. No lo pulses: si lo haces tendrás que volver a proteger la ficha.',
      pista:
        'Es el botón blanco con letras azules, al final del panel de la derecha, debajo del recuadro verde. Si cerraste el panel con la X, vuelve a abrirlo con «Restringir edición».',
      logro: { tipo: 'confirma', boton: 'Ya lo vi' },
      aprendido:
        'Proteger un documento evita accidentes, no espías. Lo que de verdad es secreto no se manda en una ficha.',
    },
    {
      id: 'rellenar-la-ficha',
      titulo: 'Ahora contéstala tú',
      instruccion:
        'Prueba primero a borrar el título: no te va a dejar, y eso es justo lo que querías. Ahora contéstala entera: tu nombre, tu grado y grupo, tu equipo en la lista y la casilla del permiso palomeada.',
      pista:
        'Los únicos sitios donde te deja escribir son los cuatro grises. Un clic en un hueco de texto te selecciona el «Escribe aquí» entero: teclea encima y ya. En la lista, un clic te abre los tres equipos. En la casilla, un clic la palomea. Si el panel te estorba, ciérralo con la X.',
      logro: {
        tipo: 'documento',
        /*
         * Se mira la CELDA ENTERA y no su primer hueco, y eso salió de jugar
         * mal: quien vuelve a pulsar el botón de la cinta para «probar» la
         * casilla acaba con dos cuadritos en la misma celda, y con la ficha ya
         * protegida el de más no se puede borrar. Palomeando el segundo, el
         * alumno veía su ☒ en pantalla y el encargo sin cerrarse. El error sigue
         * a la vista —hay dos donde debería haber uno—, pero ya no encierra.
         */
        comprueba: (doc) => {
          const hayTextoContestado = (fila: number) =>
            camposDeLaCelda(doc, fila, 1).some((c) => c.tipo === 'texto' && contestado(c.texto));
          const equipoElegido = camposDeLaCelda(doc, 2, 1).some(
            (c) => c.tipo === 'lista' && OPCIONES_EQUIPO.some((o) => c.texto.trim().startsWith(o)),
          );
          const permisoDado = camposDeLaCelda(doc, 3, 1).some((c) => c.tipo === 'casilla' && c.marcada);
          return hayTextoContestado(0) && hayTextoContestado(1) && equipoElegido && permisoDado;
        },
      },
      aprendido:
        'Con la ficha protegida sólo se puede contestar. Eso es un formulario: pide datos y no se deja estropear.',
    },
  ],

  /*
   * La frase de «Terminaste» la pone la clase, porque sale al acabar cualquiera
   * de las diecinueve y hasta hoy salía la lección de la primera. Ésta está
   * escrita en voz de lo que el alumno YA SABE HACER, no de lo que vio.
   */
  cierre:
    'Ya sabes convertir un documento normal en una ficha que se rellena sola: abrirle huecos de texto, de lista y de casilla donde sí se escribe, y cerrar con «Rellenar formularios» todo lo que nadie debe tocar. Y sabes hasta dónde llega ese candado: quita accidentes, no curiosos.',
};

export default GUION;
