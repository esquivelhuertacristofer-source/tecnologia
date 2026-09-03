import {
  formatoDe,
  notasEn,
  textoEn,
  type Mazo,
  type Sitio,
} from '@/components/office/motor-diapos/mazo';
import {
  CONTRASTE_MINIMO,
  contraste,
  palabrasEn,
  tapaAlTitulo,
} from '@/components/office/motor-diapos/consultas';
import { TEMAS } from '@/components/office/motor-diapos/mazo';
import type { Diapositiva } from '@/components/office/motor-diapos/modelo';
import { TAMANO_BASE_DIAPO } from '../tecniaDiapositivas';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import { ESTRELLITAS, PINGUINO, ZORRO } from './laminasDelDesierto';

/**
 * `n4-imagenes-y-texto` · «Imágenes y texto que se entienden» (doc §27.2).
 *
 * Tres fases que escalan —ver el problema, aplicar la regla, juzgar— y las tres
 * juzgadas **desde la última butaca**, que aquí es el deslizador del zoom al
 * 45 % de la barra de estado, no una palanca de madera. Es un control de
 * PowerPoint de verdad: el mismo que Tecnia Textos estrenó para «ver de lejos».
 *
 * ── DE DÓNDE SALE LA PRESENTACIÓN ───────────────────────────────────────────
 *
 * La clase **no empieza en blanco**: abre la presentación de «El desierto» tal
 * como la dejó la clase 1, pero con tres defectos puestos a mano. No es un
 * atajo, es la clase: el §27.2 enseña a ARREGLAR, y para arreglar hace falta
 * algo roto. Los tres defectos son los tres que el capítulo nombra —un muro de
 * texto, un título chico y sin contraste, y una diapositiva sin imagen— y cada
 * fase se lleva uno.
 *
 * ── LO QUE SE COMPRUEBA, Y LO QUE NO ────────────────────────────────────────
 *
 * Todo se lee de la presentación: palabras del cuerpo, puntos del título,
 * contraste entre la letra y el fondo, y si la imagen tapa al título. Lo único
 * que NO decide un encargo es «¿rebosa el texto?», porque eso sólo lo sabe el
 * navegador y un predicado no tiene pantalla. Sigue siendo la mitad importante
 * de la lección, pero como **señal visible**: la caja se marca sola en rojo con
 * el aviso «No cabe: se sale de su caja». La lección la da la pantalla; el
 * encargo la da en palabras contadas, que es lo que sí se puede leer sin ojos.
 */

/* ── leer sin castigar la ortografía ──────────────────────────────────────── */

const pelado = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:·]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/** Dónde está la diapositiva cuyo título es ése, o −1. */
const dondeEsta = (m: Mazo, titulo: string): number =>
  m.diapositivas.findIndex((_, i) => pelado(textoEn(m, i, 'titulo') ?? '') === pelado(titulo));

/** La diapositiva del zorro, que es sobre la que se trabaja en las fases 2 y 3. */
const laDelZorro = (m: Mazo): { i: number; d: Diapositiva } | null => {
  const i = dondeEsta(m, 'El zorro del desierto');
  return i < 0 ? null : { i, d: m.diapositivas[i] };
};

/** El fondo que se ve de verdad en una diapositiva: el suyo, o el del tema. */
const fondoDe = (m: Mazo, d: Diapositiva): string => d.fondo ?? TEMAS[m.tema].fondo;

/** El color con que se pinta un rol: el que puso el alumno, o el del tema. */
function colorDe(m: Mazo, d: Diapositiva, sitio: Sitio & { tipo: 'marcador' }): string {
  const f = formatoDe(d, sitio);
  return f.color ?? (sitio.rol === 'titulo' ? TEMAS[m.tema].titulo : TEMAS[m.tema].texto);
}

/* ── la presentación con la que abre, con sus tres defectos ───────────────── */

/**
 * Todo lo que Sofi iba a decir, escrito en la pantalla.
 *
 * **Tiene que ser un muro de verdad, y eso hubo que medirlo.** La primera
 * versión eran cuarenta palabras y cabían holgadas en la caja: el aviso de «no
 * cabe» no salía nunca y la fase 1 se quedaba sin su señal, que es justo lo que
 * el §27.2 manda que el alumno VEA. Un párrafo «largo» a ojo no es largo: en
 * una caja de diez columnas por cuatro filas caben unos siete renglones, así
 * que el texto tiene que pasar de ahí con margen para que se salga también en
 * una pantalla más ancha que la mía.
 *
 * Y suena a niño de nueve años que se lo apuntó todo para no olvidarse, que es
 * exactamente el error que la clase viene a corregir.
 */
const PARRAFO_LARGO =
  'El desierto es un lugar muy seco donde casi no llueve en todo el año y por ' +
  'eso el suelo se ve agrietado y lleno de arena. De día hace muchísimo calor, ' +
  'tanto que si tocas una piedra te quemas, y en cambio de noche hace tanto ' +
  'frío que los animales se meten debajo de la tierra para no congelarse. Aun ' +
  'así ahí viven plantas y animales que aprendieron a aguantar la sed durante ' +
  'muchísimos días seguidos, como los cactus, que guardan agua adentro, y el ' +
  'camello, que la guarda en su joroba para el camino.';

/**
 * Lo que Sofi entregó, y por qué está así.
 *
 * Los tres defectos son deliberados y cada uno tiene una fase que lo arregla:
 *
 * 1. **«¿Qué es el desierto?» lleva el párrafo entero.** Cabe en el modelo y no
 *    cabe en la caja, así que el navegador lo canta y el alumno lo VE.
 * 2. **El título del zorro va en 16 pt y en amarillo sobre fondo arena.** Los
 *    dos defectos a la vez y a propósito: arreglar sólo uno no basta para que
 *    se lea, que es exactamente lo que enseña la regla.
 * 3. **La del zorro no tiene imagen**, y su diseño es «solo imagen». O sea que
 *    la diapositiva promete una foto y no la da.
 */
const mazoDeSofi = (): Mazo => ({
  tema: 'arena',
  activa: 0,
  diapositivas: [
    {
      diseno: 'portada',
      marcadores: [
        { rol: 'titulo', contenido: 'El desierto', casilla: null },
        { rol: 'subtitulo', contenido: 'Sofi · 4° B', casilla: null },
      ],
      libres: [],
      notas: '',
    },
    {
      diseno: 'titulo-texto',
      marcadores: [
        { rol: 'titulo', contenido: '¿Qué es el desierto?', casilla: null },
        { rol: 'cuerpo', contenido: PARRAFO_LARGO, casilla: null },
      ],
      libres: [],
      notas: '',
    },
    {
      diseno: 'solo-imagen',
      marcadores: [
        {
          rol: 'titulo',
          contenido: 'El zorro del desierto',
          casilla: null,
          formato: { pt: 16, color: '#FDE68A' },
        },
        { rol: 'imagen', contenido: null, casilla: null },
      ],
      libres: [],
      notas: '',
    },
    {
      diseno: 'dos-contenidos',
      marcadores: [
        { rol: 'titulo', contenido: 'Zorro y camello', casilla: null },
        { rol: 'cuerpo', contenido: 'El zorro es chiquito', casilla: null },
        { rol: 'cuerpo-2', contenido: 'El camello es grande', casilla: null },
      ],
      libres: [],
      notas: '',
    },
  ],
});

/* ── las tres candidatas de la fase 3 ─────────────────────────────────────── */

export const CANDIDATAS = [
  { valor: `zorro|${ZORRO}`, nombre: 'Un zorro del desierto', detalle: 'Foto de un zorro entre dunas.', fuente: ZORRO },
  { valor: `estrellas|${ESTRELLITAS}`, nombre: 'Marco de estrellitas', detalle: 'Un fondo con estrellas doradas.', fuente: ESTRELLITAS },
  { valor: `pinguino|${PINGUINO}`, nombre: 'Un pingüino', detalle: 'Foto de un pingüino sobre el hielo.', fuente: PINGUINO },
];

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_IMAGENES_Y_TEXTO: GuionDiapos = {
  archivo: 'El desierto.pptx',
  mazo: mazoDeSofi,

  portada: {
    situacion: 'PowerPoint · Grado básico · Clase 2 de 5',
    tema: 'Que se entienda desde el fondo del salón',
    objetivo: 'Vas a saber hacer que una diapositiva se entienda desde la última fila del salón.',
    vasAHacer: [
      'Mirar tu presentación de lejos y ver qué falla',
      'Cambiar un muro de texto por tres frases cortas',
      'Arreglar el tamaño y el contraste de un título',
      'Elegir la imagen que apoya, y ponerla del tamaño justo',
    ],
    requisitos: 'La clase anterior: crear diapositivas, elegirles diseño y ordenarlas.',
    ayuda:
      'Un aro te va a señalar el botón exacto, con su nombre y para qué sirve. Y cuando algo no quepa en su caja, la caja te lo va a decir sola.',
  },

  pasos: [
    /* ── Fase 1 · ver el problema ─────────────────────────────────────────── */
    {
      id: 'mira-de-lejos',
      titulo: 'Siéntate atrás',
      instruccion:
        'Antes de arreglar nada, mira tu presentación como la va a ver el público. Baja el zoom de la barra de abajo hasta el 45 % y fíjate en la diapositiva 2.',
      pista:
        'El mando del zoom está abajo a la derecha. Arrastra la bolita hacia la izquierda o pulsa el botón del menos.',
      senal: { control: 'zoom' },
      logro: { tipo: 'confirma', boton: 'Ya la vi de lejos' },
      aprendido:
        'Una diapositiva no se lee como un libro: se ve de lejos y por unos segundos. De ahí salen todas sus reglas.',
    },
    {
      id: 'elige-la-version',
      titulo: 'Menos palabras',
      instruccion:
        'Sofi escribió en la pantalla todo lo que iba a decir, y el texto ni siquiera cabe en su caja. ¿Cuál de estas tres versiones va en la diapositiva?',
      pista:
        'Lo que explica eres tú, hablando. La pantalla sólo pone la idea en grande. Ni un muro de renglones, ni una palabra suelta que no dice nada.',
      // Sin aro: es una decisión, y señalar una decisión es enseñar la respuesta.
      logro: {
        tipo: 'eleccion',
        opciones: [
          'El párrafo tal como está, para no olvidarse de nada',
          'Tres frases cortas: «Casi no llueve», «Mucho calor de día», «Frío de noche»',
          'Una sola palabra: «Desierto»',
        ],
        correcta: 1,
      },
      aprendido:
        'Una frase corta o tres viñetas. Si escribes todo lo que vas a decir, acabas leyendo la pantalla de espaldas al público.',
    },
    {
      id: 'escribe-corto',
      titulo: 'Escríbelas',
      instruccion:
        'Doble clic en el cuerpo de la diapositiva 2 y déjalo en tres renglones: Casi no llueve · Mucho calor de día · Frío de noche (uno por renglón).',
      pista:
        'Borra lo que hay y escribe los tres renglones, pulsando Enter entre uno y otro. Fíjate cómo el aviso rojo de «no cabe» desaparece solo.',
      senal: { control: 'marcador:cuerpo' },
      logro: {
        tipo: 'documento',
        comprueba: (m) => {
          const i = dondeEsta(m, '¿Qué es el desierto?');
          if (i < 0) return false;
          const t = textoEn(m, i, 'cuerpo') ?? '';
          const renglones = t.split('\n').filter((x) => x.trim().length > 0);
          return renglones.length === 3 && palabrasEn(m.diapositivas[i], 'cuerpo') <= 12;
        },
      },
      aprendido:
        'Tres frases se leen de un vistazo. El muro de texto no se leía ni de cerca, y encima se salía de su caja.',
    },
    {
      id: 'ponle-vinetas',
      titulo: 'Ponles viñetas',
      instruccion:
        'Con el cuerpo todavía seleccionado, conviértelo en una lista con viñetas desde Inicio → Párrafo.',
      pista:
        'Primero haz un clic en la caja del texto para seleccionarla, y después pulsa el botón de las viñetas —el de las bolitas—.',
      senal: { pestana: 'inicio', control: 'vinetas' },
      logro: {
        tipo: 'documento',
        comprueba: (m) => {
          const i = dondeEsta(m, '¿Qué es el desierto?');
          return i >= 0 && formatoDe(m.diapositivas[i], { tipo: 'marcador', rol: 'cuerpo' }).vinetas === true;
        },
      },
      aprendido: 'Las viñetas separan las ideas de un golpe de vista. Tres puntos, tres ideas.',
    },
    {
      id: 'guarda-el-parrafo',
      titulo: 'El párrafo no se tira',
      instruccion:
        'Lo que quitaste de la pantalla es justo lo que vas a DECIR. Pégalo en el cajón de notas de esa diapositiva, debajo del lienzo.',
      pista:
        'El cajón de notas está bajo la diapositiva y dice «esto lo lees tú; el público no lo ve». Escribe ahí el párrafo largo de Sofi.',
      senal: { control: 'notas' },
      logro: {
        tipo: 'documento',
        comprueba: (m) => {
          const i = dondeEsta(m, '¿Qué es el desierto?');
          return i >= 0 && notasEn(m, i).trim().split(/\s+/).filter(Boolean).length >= 15;
        },
      },
      aprendido:
        'Ahí va lo que tú dices; en la pantalla, sólo la idea. Con notas no tienes que memorizar nada ni llenar la diapositiva de texto.',
    },

    /* ── Fase 2 · aplicar la regla ────────────────────────────────────────── */
    {
      id: 'agranda-el-titulo',
      titulo: 'Letra grande',
      instruccion:
        'Ve a la diapositiva 3, la del zorro. Su título va en letra de 16, que desde atrás no se lee. Selecciónalo y súbelo a 40 o más con el desplegable de tamaño.',
      pista:
        'Un clic en el título para seleccionarlo, y luego el cuadro con el número que hay en Inicio → Fuente, al lado del tipo de letra.',
      senal: { pestana: 'inicio', control: 'fuente-tamano' },
      logro: {
        tipo: 'documento',
        comprueba: (m) => {
          const z = laDelZorro(m);
          if (!z) return false;
          const pt = formatoDe(z.d, { tipo: 'marcador', rol: 'titulo' }).pt ?? TAMANO_BASE_DIAPO.titulo;
          return pt >= 40;
        },
      },
      aprendido: 'Si desde la última fila no se lee, es como si no estuviera. Un título de diapositiva ronda los 40.',
    },
    {
      id: 'arregla-el-contraste',
      titulo: 'Que contraste',
      instruccion:
        'Ese título es amarillo sobre fondo claro: en tu pantalla parece que se ve, y proyectado desaparece. Arréglalo con el color de la letra, con el fondo de la diapositiva, o con los dos.',
      pista:
        'Necesitas letra clara sobre fondo oscuro, u oscura sobre claro. El color de la letra está en Inicio → Fuente; el fondo, en Diseño → Personalizar.',
      senal: { pestana: 'inicio', control: 'color' },
      logro: {
        tipo: 'documento',
        comprueba: (m) => {
          const z = laDelZorro(m);
          if (!z) return false;
          const letra = colorDe(m, z.d, { tipo: 'marcador', rol: 'titulo' });
          return contraste(letra, fondoDe(m, z.d)) >= CONTRASTE_MINIMO;
        },
      },
      aprendido:
        'Claro sobre oscuro, u oscuro sobre claro. Amarillo sobre blanco no se ve, aunque en tu pantalla chiquita parezca que sí.',
    },

    /* ── Fase 3 · juzgar ──────────────────────────────────────────────────── */
    {
      id: 'elige-la-imagen',
      titulo: 'Cuál apoya',
      instruccion:
        'Esa diapositiva promete una imagen y no la tiene. Tienes tres, y las tres son bonitas. ¿Cuál va aquí?',
      pista:
        'Una imagen está para AYUDAR A ENTENDER lo que dices, no para adornar. ¿De qué habla esta diapositiva?',
      // Sin aro: la pregunta es de criterio.
      logro: {
        tipo: 'eleccion',
        opciones: [
          'El marco de estrellitas, porque queda bonito',
          'El zorro del desierto, porque es de lo que habla',
          'El pingüino, porque es la que más me gusta',
        ],
        correcta: 1,
      },
      aprendido:
        'La imagen que apoya ayuda a entender; la que sólo adorna, distrae. «Me gusta» no es motivo para meterla.',
    },
    {
      id: 'insertala',
      titulo: 'Métela',
      instruccion: 'Insértala desde Insertar → Imágenes y elígela de las tres.',
      pista: 'La pestaña Insertar está arriba, al lado de Inicio. El botón se llama «Imagen».',
      senal: { pestana: 'insertar', control: 'imagen' },
      logro: {
        tipo: 'documento',
        comprueba: (m) => !!laDelZorro(m)?.d.libres.some((l) => l.id === 'zorro'),
      },
      aprendido: 'Ahora la diapositiva cumple lo que su diseño prometía: la imagen es la idea.',
    },
    {
      id: 'dale-el-tamano',
      titulo: 'Del tamaño justo',
      instruccion:
        'Agrándala con los tiradores de las esquinas hasta que se vea de lejos —al menos media diapositiva—, pero sin que tape el título.',
      pista:
        'Haz un clic en la imagen y aparecen ocho bolitas. Arrastra la de una esquina. Si la subes demasiado, se comerá el título.',
      // Sin aro: no hay ningún botón que pulsar, hay que hacerlo con la mano.
      logro: {
        tipo: 'documento',
        comprueba: (m) => {
          const z = laDelZorro(m);
          const foto = z?.d.libres.find((l) => l.id === 'zorro');
          if (!z || !foto) return false;
          const grande = foto.casilla.cols * foto.casilla.filas >= 40;
          return grande && !tapaAlTitulo(z.d, 'zorro');
        },
      },
      aprendido:
        'Ni miniatura invisible ni tan grande que se coma el título. Cada cosa en su sitio y con su tamaño.',
    },
    {
      id: 'repasa-de-lejos',
      titulo: 'Mírala otra vez',
      instruccion: 'Pulsa «Repasar» y pasa las cuatro. Ahora sí tienen que entenderse desde el fondo del salón.',
      pista: 'El botón está abajo a la derecha, junto al zoom. Dentro, avanza con la flecha ▶.',
      senal: { control: 'repasar' },
      logro: { tipo: 'control', control: 'repasar' },
      aprendido: 'Aléjate y míralo. Si desde el fondo no se entiende en tres segundos, hay que arreglarlo.',
    },
  ],

  cierre:
    'Pocas palabras, letra grande, contraste y una imagen que apoya. Con esas cuatro reglas tu diapositiva se entiende desde la última butaca.',
};
