import type { GuionClase } from '@/components/office/motor/guion';
import { leerBloques } from '@/components/office/motor/consultas';
import { contarHojas, ESTADO, hojaDelRenglonQueDice, normaliza } from './estado';

/**
 * `of-word-plantillas` · «Lo que sale en todas las hojas» — guion (doc §36.3).
 *
 * El tema son cuatro cosas que en Word van juntas: encabezado, pie de página,
 * número de página y plantillas. La lección de fondo es una sola y es la que
 * ordena los ocho encargos:
 *
 *   **lo que escribes UNA vez y sale en TODAS las hojas es otra cosa que el
 *   texto del cuerpo.** No es un párrafo puesto arriba: vive en otra capa del
 *   documento, y por eso se escribe una vez y no se copia hoja por hoja.
 *
 * ── LAS CUATRO DECISIONES QUE IMPORTAN ──────────────────────────────────────
 *
 *  · **El encargo 7 le manda al alumno hacerlo MAL.** Escribir el título a mano
 *    arriba de una hoja es EL error del tema —es lo que hace cualquiera que no
 *    sabe que existe el encabezado, y es lo que hizo la maestra del documento
 *    de partida el año pasado—. En vez de advertirlo, la clase se lo manda
 *    hacer y luego le manda bajar a la hoja 3 a ver que ahí no está. Un aviso
 *    se olvida; ver la hoja 3 vacía, no.
 *
 *  · **Tres encargos señalan su botón exacto y cinco no llevan señal, y las dos
 *    cosas son a propósito** (§37). Los de pulsar la cinta —1, 4 y 6— llevan
 *    `senal.control`, que es lo que enciende el señalador con su rótulo, la
 *    ficha de la herramienta y el «Enséñamelo». Los otros cinco no se resuelven
 *    con la cinta: el 2 se pulsa dentro de la galería, el 5 y el 7 se teclean,
 *    el 8 es la tecla Enter, y **el 3 es una pregunta**. Ése último es el que
 *    importa: señalar el grupo «Encabezado y pie» mientras se le pregunta dónde
 *    escribiría el nombre de la escuela es contestarle con el dedo. Se guía la
 *    mano, no la cabeza.
 *
 *  · **La instrucción no repite el domicilio.** La ficha ya dice cómo se llama
 *    el botón, dónde vive —«Insertar → Nuevo → Plantillas»— y para qué sirve,
 *    antes de que lo toque. Lo que la ficha no puede decir es QUÉ hay que
 *    conseguir con él y por qué, y eso es lo único que queda en la instrucción.
 *
 *  · **Ningún encargo obliga a pulsar un botón que no lo resuelva.** El motor
 *    cobra un tropiezo por cada control pulsado que no cierra el encargo
 *    actual, así que un encargo que dijera «abre el encabezado y escribe» le
 *    bajaría la nota al alumno por hacer exactamente lo que se le pidió.
 *    Abrir la zona es su propio encargo y escribir es el siguiente. Por lo
 *    mismo, «Número de página» abre además el pie: así el alumno aterriza
 *    dentro de la zona de abajo sin pulsar un botón de más.
 *
 *  · **Ni siquiera «abre el encabezado» se corrige mirando el clic.** Se
 *    corrige preguntando si la zona está abierta, que es un estado y no un
 *    gesto: así también vale el camino de Word de verdad —doble clic en el
 *    margen de arriba de la hoja—, y el alumno que lo descubre no se queda con
 *    el panel pidiéndole algo que ya hizo.
 *
 *  · **Nada se ancla al texto literal.** El encargo 7 busca el texto que el
 *    propio alumno escribió en el encabezado —no una frase fijada aquí—, y
 *    acepta que aparezca en cualquier hoja que no sea la primera, porque si
 *    después añade renglones el bloque puede bajar a la hoja 3 y el encargo ya
 *    palomeado no puede despalomearse por eso. Y como el encabezado es texto
 *    que el alumno puede reescribir, el nombre con el que se cumplió se congela
 *    (`ESTADO.anclaAMano`): corregir el encabezado después no puede hacer
 *    retroceder la clase.
 */

/**
 * Lo que hay en la hoja al abrir el laboratorio: el borrador de la maestra.
 *
 * No es un documento de relleno. Cuenta el problema entero de la clase con las
 * palabras de una escuela —«en unas hojas venía el nombre y en otras no», «los
 * números los pusimos a mano y al meter una hoja se corrieron todos»— y termina
 * mandando a la galería de plantillas, que es el primer encargo.
 */
const BORRADOR = `
<h1>Cuadernillo de inicio de ciclo — borrador</h1>
<p>Notas de la maestra Ortega, coordinación.</p>
<p>Abrí este archivo para empezar el cuadernillo que se les entrega a las familias en la primera semana. Son unas tres hojas: las fechas, la lista de útiles y el reglamento.</p>
<p>El año pasado lo armamos hoja por hoja y quedó chueco. En unas hojas venía el nombre de la escuela arriba y en otras no, porque lo íbamos copiando a mano. Y los números de página también los escribimos a mano: cuando metimos una hoja en medio, se corrieron todos y hubo que renumerar el documento entero.</p>
<p>Este año no. El programa trae plantillas —documentos ya armados que sólo hay que rellenar— y trae una forma de escribir algo una sola vez para que salga en todas las hojas. Eso es lo que vas a hacer aquí.</p>
`;

export const GUION_PLANTILLAS: GuionClase = {
  archivo: 'Cuadernillo de inicio de ciclo.docx',
  html: BORRADOR,

  portada: {
    situacion: 'Word · Grado avanzado · Clase 2 de 4',
    tema: 'Encabezado, pie de página, número de página y plantillas',
    objetivo:
      'Que al terminar sepas escribir una sola vez lo que tiene que salir en todas las hojas —el nombre de la escuela arriba, el pie abajo y el número de página— y sepas partir de una plantilla en vez de armar cada documento desde cero.',
    vasAHacer: [
      'Abrir la galería de plantillas y elegir uno de los tres documentos ya armados.',
      'Escribir el encabezado una sola vez y verlo aparecer en las tres hojas.',
      'Poner el número de página, que lo cuenta el programa y no tú.',
      'Escribir el mismo texto a mano en la hoja 2 y comprobar que en la hoja 3 no está.',
      'Hacer nacer una hoja más y ver que ya viene con todo puesto.',
    ],
    requisitos:
      'Saber moverte por la cinta —pestañas y grupos— y haber escrito antes en Tecnia Textos. Nada de encabezados: eso se ve hoy.',
    ayuda:
      'El maestro de la derecha te señala con un aro el botón exacto que hay que pulsar y te dice, antes de que lo toques, cómo se llama, dónde vive y para qué sirve. Si aun así no lo ves, pulsa «Enséñamelo». Y si te equivocas de botón no pasa nada: te dice cuál pulsaste, qué hace y te devuelve al que buscabas, sin dejar el documento tocado. Sólo hay un encargo sin aro, y es a propósito: ése es una pregunta y la contestas tú.',
  },

  pasos: [
    {
      id: 'abrir-galeria',
      titulo: 'Abre las plantillas',
      instruccion:
        'El borrador que tienes abierto son notas, no un cuadernillo. Antes de armarlo tú desde una hoja en blanco, mira con qué documentos viene ya hecho el programa.',
      pista:
        'El aro te está señalando el botón; si no lo ves, pulsa «Enséñamelo» y te lleva. En el Word de la escuela esto mismo vive en Archivo → Nuevo, y se llama igual.',
      senal: { pestana: 'insertar', grupo: 'plantillas', control: 'plantilla' },
      logro: { tipo: 'documento', comprueba: () => ESTADO.galeria || ESTADO.plantilla !== null },
      aprendido:
        'Una plantilla no es un color ni un adorno: es un documento de partida ya armado que sólo tienes que rellenar.',
    },
    {
      id: 'elegir-plantilla',
      titulo: 'Elige una y móntala',
      instruccion:
        'Hay tres documentos de escuela de verdad. Elige el que quieras —da igual cuál— y el programa lo monta entero: el texto, los títulos, el interlineado y hasta el pie de página, que ya viene escrito.',
      pista:
        'Se pulsa la tarjeta entera, y el dibujo también vale. Cualquiera de las tres sirve para el resto de la clase, así que elige la que más te guste.',
      logro: { tipo: 'documento', comprueba: () => ESTADO.plantilla !== null },
      aprendido:
        'Fíjate en lo que te ahorró: tres hojas escritas, los estilos puestos y el pie de página ya hecho. Eso es partir de una plantilla.',
    },
    {
      /*
       * Sin señal, y es el único encargo del que hay que defenderlo. Es la
       * pregunta que la clase existe para hacer, y un aro sobre «Encabezado»
       * —o sobre su grupo— la contestaría con el dedo antes de que el alumno la
       * piense. Se guía la mano, no la cabeza (§37.4).
       */
      id: 'donde-se-escribe',
      titulo: '¿Dónde lo escribirías?',
      instruccion:
        'El cuadernillo tiene que llevar arriba de TODAS las hojas el nombre de la escuela. No en una: en las tres, y también en las que se añadan después. ¿Dónde lo escribes?',
      pista:
        'Piénsalo al revés: si lo copias hoja por hoja, ¿qué pasa el día que metes una hoja nueva en medio? Eso es justo lo que le pasó a la maestra el año pasado.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'En el primer renglón de la hoja 1',
          'En el encabezado',
          'Copiándolo arriba de cada hoja',
          'En una tabla al principio del documento',
        ],
        correcta: 1,
      },
      aprendido:
        'El encabezado es una capa aparte del documento: se escribe una vez y el programa lo repite en cada hoja, incluidas las que todavía no existen.',
    },
    {
      id: 'abrir-encabezado',
      titulo: 'Abre el encabezado',
      instruccion:
        'Ábrelo y mira bien lo que pasa: el texto de la hoja se apaga y se abre una franja arriba, fuera del área donde escribes normalmente. Ésa es la otra capa de la que hablábamos.',
      pista:
        'También se abre haciendo doble clic en el margen de arriba de la hoja, igual que en el Word de la escuela. Y si no encuentras el botón, pulsa «Enséñamelo».',
      senal: { pestana: 'insertar', grupo: 'encabezado-pie', control: 'encabezado' },
      /*
       * Vale la zona abierta O el encabezado ya escrito. Lo segundo no es un
       * añadido cómodo: sin él, en cuanto el encargo 6 abre el pie este encargo
       * dejaría de cumplirse y el motor —que relee los logros de documento en
       * cada transacción— haría retroceder la clase al encargo 4 con el
       * encabezado ya escrito.
       */
      logro: {
        tipo: 'documento',
        comprueba: () => ESTADO.zona === 'encabezado' || ESTADO.encabezado.trim().length >= 6,
      },
      aprendido:
        'El cuerpo se apaga porque ya no estás escribiendo en él. Estás en el encabezado, que es otro sitio del mismo documento.',
    },
    {
      id: 'escribir-encabezado',
      titulo: 'Escríbelo una sola vez',
      instruccion:
        'El cursor ya está dentro del encabezado. Escribe ahí el nombre de la escuela —o el título del documento— y, mientras tecleas, baja la vista a la hoja 2 y a la hoja 3. Lo estás escribiendo en las tres a la vez.',
      pista:
        'Escribe algo de verdad, de seis letras para arriba: «Escuela Primaria Ignacio Ramírez» sirve. Si lo borras entero, el encargo vuelve a estar por hacer.',
      logro: { tipo: 'documento', comprueba: () => ESTADO.encabezado.trim().length >= 6 },
      aprendido:
        'Una vez escrito, en todas las hojas. Y si mañana cambia el nombre, se corrige en un solo sitio y se corrige en todas.',
    },
    {
      id: 'numero-de-pagina',
      titulo: 'El número lo pone el programa',
      instruccion:
        'Ahora la franja de abajo. Ponle el número de página y baja la vista hoja por hoja: cada una tiene el suyo y ninguno lo escribiste tú. Fíjate también en el texto que ya estaba ahí abajo: ése lo trajo puesto la plantilla.',
      pista:
        'No lo teclees tú: el chiste entero es que la cuenta la lleve el programa. El aro te está señalando el botón.',
      senal: { pestana: 'insertar', grupo: 'encabezado-pie', control: 'numero' },
      logro: { tipo: 'documento', comprueba: () => ESTADO.numeroDePagina },
      aprendido:
        'El número de página es automático: cada hoja sabe cuál es. Escribirlo a mano se rompe en cuanto metes una hoja en medio, que es lo que le pasó a la maestra.',
    },
    {
      /*
       * El error del tema, mandado hacer a propósito (§36.8, lección de jugar
       * mal). Se comprueba leyendo el documento y midiendo en qué hoja cayó el
       * bloque: si lo escribió en la hoja 1 no vale, porque entonces no hay nada
       * que comparar con la hoja 3.
       */
      id: 'a-mano-en-la-hoja-2',
      titulo: 'Ahora hazlo mal a propósito',
      instruccion:
        'Baja a la HOJA 2 y escribe ahí, a mano, ese mismo nombre que pusiste en el encabezado, en un renglón para él solo. Cuando lo tengas, baja a la hoja 3 y compara: arriba sigue estando el encabezado, pero lo que escribiste a mano no aparece por ningún lado.',
      pista:
        'Tiene que ser el MISMO texto que escribiste en el encabezado, en su propio renglón, y tiene que quedar en la hoja 2, no en la 1. Haz clic al principio de un renglón de la hoja 2, pulsa Enter para abrir un renglón vacío, sube a él con la flecha de arriba y escríbelo ahí.',
      logro: {
        tipo: 'documento',
        comprueba: (doc) => {
          /*
           * Dos nombres valen: el que hay AHORA en el encabezado y aquel con el
           * que se cumplió el encargo. Ver `ESTADO.anclaAMano` — sin lo segundo,
           * volver al encabezado a corregir el nombre hacía retroceder la clase.
           */
          const nombres = [normaliza(ESTADO.encabezado), ESTADO.anclaAMano ?? ''].filter(
            (s) => s.length >= 6,
          );
          if (nombres.length === 0) return false;
          // Primero se le pregunta al DOCUMENTO si el nombre está escrito en él,
          // que es la regla del motor; y sólo entonces se mide en qué hoja cayó
          // el renglón, que es un hecho de la maquetación y no del documento.
          const enElDocumento = leerBloques(doc).some((b) => {
            const t = normaliza(b.texto);
            return nombres.some((n) => t.includes(n));
          });
          if (!enElDocumento) return false;
          // Cualquier hoja que no sea la primera: si más tarde el alumno añade
          // renglones, el renglón puede bajar a la 3 y este encargo ya está
          // palomeado — no puede caerse por escribir más abajo.
          return hojaDelRenglonQueDice(nombres) >= 2;
        },
      },
      aprendido:
        'Ahí está la diferencia entera: lo que escribes en el cuerpo se queda en SU hoja. Lo que escribes en el encabezado sale en todas. Son dos sitios distintos del mismo documento.',
    },
    {
      id: 'hoja-nueva',
      titulo: 'Haz nacer una hoja más',
      instruccion:
        'Última cosa, y es la que demuestra que no es un truco. Ponte al final del documento —Ctrl y Fin te lleva de un golpe— y pulsa Enter hasta que nazca una hoja nueva. Míralas: arriba tiene el encabezado, abajo el pie, y el número dice el que le toca. Tú no escribiste nada de eso.',
      pista:
        'Haz clic detrás de la última palabra del documento y pulsa Enter unas diez o doce veces, hasta que la barra de abajo diga una hoja más de las que había.',
      logro: { tipo: 'documento', comprueba: () => contarHojas() > ESTADO.hojasBase },
      aprendido:
        'El encabezado, el pie y el número no se copian hoja por hoja: son del documento, así que cada hoja nueva nace con ellos puestos.',
    },
  ],

  /*
   * La frase de «Terminaste». Va en voz de lo que el alumno YA SABE HACER, y es
   * de esta clase y no de la sala: hasta hoy salía la de la primera clase —«ya
   * sabes buscar una herramienta por lo que hace»— al terminar cualquiera de las
   * diecinueve.
   */
  cierre:
    'Ya sabes poner en un documento lo que tiene que salir en todas las hojas: el nombre arriba, el pie abajo y el número que cuenta el programa. Y ya sabes partir de una plantilla en vez de armarlo todo desde una hoja en blanco. Un cuadernillo de tres hojas y uno de treinta te cuestan ahora lo mismo.',
};
