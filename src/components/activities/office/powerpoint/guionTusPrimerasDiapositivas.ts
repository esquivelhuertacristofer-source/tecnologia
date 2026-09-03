import {
  cuantasDiapositivas,
  disenoDe,
  mazoVacio,
  textoEn,
  type Mazo,
} from '@/components/office/motor-diapos/mazo';
import { marcadorLleno, palabrasEn } from '@/components/office/motor-diapos/consultas';
import type { DisenoId } from '@/components/office/motor-diapos/modelo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';

/**
 * `n4-tus-primeras-diapositivas` · «Tus primeras diapositivas» (doc §27.1).
 *
 * Tres fases que escalan —reconocer, aplicar, diagnosticar— y no tres misiones
 * paralelas: tres misiones hacen que el alumno haga tres veces la misma clase de
 * trabajo (§24.3). Fase 1, la portada con la guía llevando de la mano; fase 2,
 * tres ideas más eligiendo él el diseño; fase 3, el orden, que no se le dice.
 *
 * ── LA ÚNICA DESVIACIÓN DEL CAPÍTULO, Y POR QUÉ ─────────────────────────────
 *
 * El §27.1 dice que en la fase 3 «la tira aparece **revuelta**». Escrito así,
 * eso exige que el programa desordene a espaldas del alumno lo que él acaba de
 * construir, y entonces la lección deja de ser suya: es un castigo que llega de
 * fuera. Aquí el desorden es **suyo y honesto**: Bit le dicta las tres ideas en
 * el orden en que a Sofi se le fueron ocurriendo —comparación, zorro, qué es—,
 * que no es el orden en que se cuentan. Eso además es verdad sobre cómo se hace
 * una presentación de verdad: primero se juntan las ideas y luego se ordenan.
 * La fase 3 llega igual de revuelta, con dos movimientos por hacer, y el alumno
 * no puede decir que el programa se lo cambió.
 *
 * ── CÓMO SE CORRIGE ─────────────────────────────────────────────────────────
 *
 * Leyendo la presentación, nunca vigilando qué botón se pulsó. Da igual si puso
 * el título escribiéndolo del tirón o de tres intentos; si está puesto, está
 * hecho. Y si lo deshace, deja de estarlo: el motor comprueba hacia atrás.
 */

/* ── leer lo que el alumno escribió, sin castigarle la ortografía ─────────── */

/**
 * Compara dos textos como los compararía un maestro y no un compilador.
 *
 * Sin acentos, sin mayúsculas, sin dobles espacios y sin los signos de apertura.
 * Un niño de nueve años que escriba «Qué es el desierto?» ha hecho el encargo:
 * la clase es de diapositivas, no de ortografía, y hay una clase entera de
 * ortografía en la sala de Word para lo otro.
 */
const pelado = (s: string): string =>
  s
    .normalize('NFD')
    // El rango de los signos diacríticos, escrito con su código y no con los
    // signos: pegados literalmente en el archivo son invisibles y el día que
    // alguien reindente esta línea se pierden sin que nada falle.
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const igualito = (a: string | null, b: string): boolean => !!a && pelado(a) === pelado(b);

/** ¿Existe una diapositiva con ese diseño y ese título? */
const hayUna = (m: Mazo, diseno: DisenoId, titulo: string): boolean =>
  m.diapositivas.some((d, i) => d.diseno === diseno && igualito(textoEn(m, i, 'titulo'), titulo));

/** En qué posición está, o −1. Es lo que hace comprobable el orden. */
const dondeEsta = (m: Mazo, titulo: string): number =>
  m.diapositivas.findIndex((_, i) => igualito(textoEn(m, i, 'titulo'), titulo));

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_TUS_PRIMERAS_DIAPOSITIVAS: GuionDiapos = {
  archivo: 'El desierto.pptx',

  /*
   * Arranca SIN ninguna diapositiva, y no es un estado inventado para que el
   * primer encargo tenga sentido: PowerPoint enseña exactamente esto —un área
   * gris con una frase— cuando una presentación se queda sin diapositivas. Que
   * la primera cosa que el alumno haga sea CREAR una es la lección de que una
   * presentación es una pila que se construye, no un documento que ya está.
   */
  mazo: () => mazoVacio('blanco'),

  portada: {
    situacion: 'PowerPoint · Grado básico · Clase 1 de 5',
    tema: 'La presentación, sus diseños y su orden',
    objetivo:
      'Vas a saber armar una presentación de cuatro diapositivas y ponerlas en un orden que se entienda.',
    vasAHacer: [
      'Crear la portada y ponerle título',
      'Elegir el tema, que le cambia la cara a todas',
      'Añadir tres ideas más, eligiendo tú el diseño de cada una',
      'Ordenar la tira y repasarla entera',
    ],
    requisitos: 'Nada. Si ya escribiste en Tecnia Textos, sabes de sobra lo que hace falta.',
    ayuda:
      'Un aro te va a señalar el botón exacto, con su nombre y para qué sirve. Si pulsas otro, te digo qué hace y no te lo aplico, para que tu presentación no se ensucie.',
  },

  pasos: [
    /* ── Fase 1 · la portada (reconocer) ──────────────────────────────────── */
    {
      id: 'crea-la-primera',
      titulo: 'Crea la primera',
      instruccion:
        'Sofi va a contar lo que aprendió del desierto. Ahora mismo no hay ni una pantalla: créala.',
      pista: 'Está en la pestaña Inicio, en el primer grupo de todos, que se llama «Diapositivas».',
      senal: { pestana: 'inicio', control: 'nueva' },
      logro: { tipo: 'documento', comprueba: (m) => cuantasDiapositivas(m) >= 1 },
      aprendido:
        'Una presentación son varias diapositivas que van pasando mientras alguien habla. Ésta es la primera.',
    },
    {
      id: 'ponle-portada',
      titulo: 'Que sea portada',
      instruccion:
        'Toda presentación empieza igual: una portada que dice de qué trata y quién la hizo. Cámbiale el diseño a «Portada».',
      pista:
        'El botón «Diseño» está justo al lado del de crear. Al pulsarlo se abren los cuatro acomodos con su dibujo.',
      senal: { pestana: 'inicio', control: 'diseno-diapo' },
      logro: { tipo: 'documento', comprueba: (m) => disenoDe(m, 0) === 'portada' },
      aprendido:
        'El diseño es la plantilla de acomodo: dice dónde va el título y dónde el resto. Elegir bien te ahorra acomodar a mano.',
    },
    {
      id: 'escribe-el-titulo',
      titulo: 'El título',
      instruccion: 'Haz doble clic en el marcador de arriba y escribe: El desierto',
      pista:
        'El marcador es la caja de rayitas del lienzo. Doble clic dentro y ya puedes teclear. Con tres palabras basta.',
      senal: { control: 'marcador:titulo' },
      logro: {
        tipo: 'documento',
        comprueba: (m) =>
          igualito(textoEn(m, 0, 'titulo'), 'El desierto') && palabrasEn(m.diapositivas[0], 'titulo') <= 4,
      },
      aprendido:
        'El título de la portada es el de TODO el trabajo, y va corto: es lo primero que el público lee de lejos.',
    },
    {
      id: 'escribe-el-subtitulo',
      titulo: 'Quién la hizo',
      instruccion: 'En el marcador de abajo escribe quién la hizo: Sofi · 4° B',
      pista: 'Es la caja más pequeña, justo debajo del título. También con doble clic.',
      senal: { control: 'marcador:subtitulo' },
      logro: {
        tipo: 'documento',
        comprueba: (m) => !!m.diapositivas[0] && marcadorLleno(m.diapositivas[0], 'subtitulo'),
      },
      aprendido: 'Ya tienes portada: el título de todo y el nombre de quien lo hizo. Es la primera de las cuatro.',
    },
    {
      id: 'elige-el-tema',
      titulo: 'Dale una cara',
      instruccion:
        'Un tema le cambia los colores y las letras a TODA la presentación de una vez. Abre la pestaña Diseño y elige uno que no sea Papel.',
      pista:
        'Los temas viven en su propia pestaña, arriba: «Diseño». Elige el que quieras, menos el blanco con el que empezaste.',
      senal: { pestana: 'diseno', control: 'tema' },
      logro: { tipo: 'documento', comprueba: (m) => m.tema !== 'blanco' },
      aprendido:
        'Un solo gesto y cambiaron todas. Eso es lo que hace un tema: no pinta una diapositiva, pinta la presentación.',
    },

    /* ── Fase 2 · tres ideas más (aplicar) ────────────────────────────────── */
    /*
     * Un encargo CON aro sólo puede resolverse con ese botón, y ninguno más:
     * cualquier otro es un desvío y no se aplica. Eso obliga a que los encargos
     * de varias acciones —crear, dar diseño y escribir— vayan SIN aro, y resulta
     * que es justo lo que el §27.1 pide para la fase 2: «el aro señala el botón
     * de Nueva diapositiva pero no cuál diseño elegir».
     *
     * Se descubrió jugando, no leyendo: la primera versión pedía las tres cosas
     * con el aro puesto en Nueva diapositiva, y al abrir la galería de diseños el
     * programa contestaba «Eso es Diseño» y no aplicaba nada. La clase se quedaba
     * clavada en el encargo 6 para siempre, con el maestro repitiendo una pista
     * que no servía. Ninguna prueba lo habría visto: el guion compilaba.
     */
    {
      id: 'otra-diapositiva',
      titulo: 'Otra más',
      instruccion:
        'Sofi apuntó sus ideas según se le fueron ocurriendo, no en el orden en que las va a contar. Eso está bien: primero se juntan y luego se ordenan. Crea la segunda diapositiva.',
      pista: 'El mismo botón que usaste al principio, en Inicio → Diapositivas.',
      senal: { pestana: 'inicio', control: 'nueva' },
      logro: { tipo: 'documento', comprueba: (m) => cuantasDiapositivas(m) >= 2 },
      aprendido: 'Cada idea nueva, una diapositiva nueva. Nunca dos ideas en la misma pantalla.',
    },
    {
      id: 'la-comparacion',
      titulo: 'Zorro y camello',
      instruccion:
        'La primera idea de Sofi es comparar al zorro con el camello, uno a cada lado. Elige TÚ el diseño que sirve para eso y ponle de título: Zorro y camello',
      pista:
        'Comparar es poner dos cosas juntas para verlas a la vez. De los cuatro acomodos hay uno que parte la pantalla en dos mitades: mira sus dibujos en la galería de «Diseño».',
      // Sin aro: señalar cuál diseño elegir sería enseñar la respuesta (§37).
      logro: { tipo: 'documento', comprueba: (m) => hayUna(m, 'dos-contenidos', 'Zorro y camello') },
      aprendido:
        'Ahí lo decidiste tú: dos ideas que se comparan piden dos columnas. El diseño no es adorno, es lo que hace que se entienda.',
    },
    {
      id: 'el-zorro',
      titulo: 'El zorro del desierto',
      instruccion:
        'La segunda idea de Sofi es una foto del zorro del desierto: aquí la imagen ES la idea, y las palabras sobran. Crea la diapositiva, elige el diseño que le va y ponle de título: El zorro del desierto',
      pista: 'Si lo que manda es la foto, busca el acomodo cuyo dibujo es casi todo una caja grande.',
      logro: { tipo: 'documento', comprueba: (m) => hayUna(m, 'solo-imagen', 'El zorro del desierto') },
      aprendido:
        'Cuando la foto lo dice todo, se pone grande y se calla uno. Una diapositiva, una idea — y esta idea es una imagen.',
    },
    {
      id: 'que-es',
      titulo: '¿Qué es el desierto?',
      instruccion:
        'La última idea hay que explicarla con pocas palabras. Crea la diapositiva con el diseño de título y texto, ponle de título «¿Qué es el desierto?» y escribe en el cuerpo: Lugar muy seco donde casi no llueve',
      pista:
        'Es el acomodo de una franja arriba para el título y una caja ancha debajo para el texto. Escribe poco: una frase corta.',
      logro: {
        tipo: 'documento',
        comprueba: (m) => {
          const i = dondeEsta(m, '¿Qué es el desierto?');
          return (
            i >= 0 &&
            m.diapositivas[i].diseno === 'titulo-texto' &&
            marcadorLleno(m.diapositivas[i], 'cuerpo') &&
            palabrasEn(m.diapositivas[i], 'cuerpo') <= 12
          );
        },
      },
      aprendido:
        'Una frase corta y en grande. Lo que explica eres tú hablando; la pantalla sólo pone la idea para que no se te olvide a ti ni al público.',
    },

    /* ── Fase 3 · el orden (diagnosticar) ─────────────────────────────────── */
    {
      id: 'mira-la-tira',
      titulo: 'Mira tu tira',
      instruccion:
        'Ya tienes las cuatro. Mira la tira de la izquierda: así se verá tu presentación, una detrás de otra. ¿Cuál de estos órdenes cuenta mejor la historia?',
      pista:
        'Piensa en alguien que no sabe nada del desierto. ¿Qué necesita oír primero para entender lo demás?',
      // Sin señal a propósito: señalar una decisión es enseñar la respuesta (§37).
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Portada → Zorro y camello → El zorro → ¿Qué es el desierto?',
          'Portada → ¿Qué es el desierto? → El zorro → Zorro y camello',
          '¿Qué es el desierto? → El zorro → Zorro y camello → Portada',
        ],
        correcta: 1,
      },
      aprendido:
        'Portada, desarrollo y cierre. El público necesita saber primero de qué le vas a hablar; comparar dos cosas sólo se entiende cuando ya sabe qué son.',
    },
    {
      id: 'ordena-la-tira',
      titulo: 'Ponlas en orden',
      instruccion:
        'Arrastra las miniaturas de la tira hasta dejarlas así: la portada, «¿Qué es el desierto?», «El zorro del desierto» y al final «Zorro y camello».',
      pista:
        'Agarra una miniatura y súbela o bájala sin soltarla. La raya naranja te dice dónde va a caer. Con dos movimientos te alcanza.',
      // Aquí tampoco hay aro: el encargo dice qué tiene que pasar, no dónde
      // pulsar. Es la fase de diagnosticar, y la mano ya no se lleva.
      /*
       * Se comprueba el ORDEN RELATIVO, no que haya exactamente cuatro.
       *
       * La primera versión pedía `cuantasDiapositivas(m) === 4`, y jugando mal
       * salió lo que tenía que salir: este encargo no lleva aro, así que pulsar
       * «Nueva diapositiva» aquí es legal y no se castiga —bien—, pero dejaba
       * cinco y entonces el encargo era **imposible sin que nada lo dijera**. Un
       * encargo que se puede volver irresoluble en silencio es peor que uno
       * difícil. Lo que esta fase enseña es el orden; una diapositiva de sobra al
       * final no lo estorba, y una metida delante de la portada sí — y ésa la
       * caza igual, porque la portada tiene que seguir siendo la primera.
       */
      logro: {
        tipo: 'documento',
        comprueba: (m) => {
          const p = dondeEsta(m, 'El desierto');
          const q = dondeEsta(m, '¿Qué es el desierto?');
          const z = dondeEsta(m, 'El zorro del desierto');
          const c = dondeEsta(m, 'Zorro y camello');
          return p === 0 && q > p && z > q && c > z;
        },
      },
      aprendido:
        'La tira sirve justo para esto: ver toda tu presentación de un vistazo y moverla hasta que la historia se entienda.',
    },
    {
      id: 'repasala',
      titulo: 'Repásala entera',
      instruccion: 'Pulsa «Repasar», abajo a la derecha, y pásalas las cuatro como se las verá tu grupo.',
      pista:
        'El botón está en la barra de abajo, junto al zoom. Dentro, avanza con la flecha ▶ o con la barra espaciadora.',
      senal: { control: 'repasar' },
      logro: { tipo: 'control', control: 'repasar' },
      aprendido: 'Eso es lo que va a ver el público: la diapositiva sola, en grande y sin tus notas.',
    },
  ],

  cierre:
    'Cuatro diapositivas, cuatro ideas y una historia que se entiende. Ya sabes crear una presentación, elegirle el diseño a cada idea y ordenarla.',
};
