import type { Mazo } from '@/components/office/motor-diapos/mazo';
import { secciones, tramos } from '@/components/office/motor-diapos/mazo';
import type { GuionDiapos } from '@/components/office/motor-diapos/guion';
import type { Diapositiva } from '@/components/office/motor-diapos/modelo';

/**
 * `of-ppt-ordena-el-mazo` · «Cuando se hace larga» (doc §44.1).
 *
 * La primera clase de la segunda tanda, y la que abre los tramos que después
 * usan §44.5 (el Zoom de resumen lee las secciones) y cualquier clase que
 * quiera un mazo largo sin que dé miedo mirarlo.
 *
 * ── POR QUÉ DIECIOCHO Y NO SEIS ─────────────────────────────────────────────
 *
 * Porque la clase entera **es la sensación de que no caben**. Con seis
 * diapositivas la tira las enseña todas y el Clasificador no resuelve ningún
 * problema: sería un botón que cambia el tamaño de unas miniaturas. Con
 * dieciocho hay que desplazarse para verlas, el desorden no se abarca de un
 * vistazo y abrir el Clasificador **enseña algo que no se veía**. El número no
 * es decorado: es el aparato.
 *
 * ── POR QUÉ ESTÁN DESORDENADAS ASÍ ──────────────────────────────────────────
 *
 * No al azar. El desorden es el de un archivo de verdad al que cinco personas
 * le fueron añadiendo cosas: la portada quedó en tercer lugar porque alguien
 * insertó dos antes; las tres del museo están repartidas porque cada uno subió
 * la suya cuando la tuvo; y la de los precios se coló porque se hizo para la
 * junta de padres y nadie la quitó. Un desorden inventado se arregla y no se
 * aprende nada; éste se puede contar.
 */

/* ── lo que hay que saber del mazo ─────────────────────────────────────────── */

/** Dónde está ahora la diapositiva que nació con este título. */
export const dondeEsta = (m: Mazo, titulo: string): number =>
  m.diapositivas.findIndex((d) => d.marcadores.find((x) => x.rol === 'titulo')?.contenido === titulo);

export const PORTADA = 'Viaje de fin de curso · 6.º B';
export const LOS_PRECIOS = 'Lo que costó por alumno';
export const DEL_MUSEO = ['El museo por dentro', 'La sala de los dinosaurios', 'Lo que más nos gustó del museo'];

/** La portada en su sitio: la primera del mazo. */
export const portadaPrimero = (m: Mazo): boolean => dondeEsta(m, PORTADA) === 0;

/**
 * Las tres del museo, seguidas. **No se pide un sitio concreto**, sólo que
 * estén juntas: el encargo es «júntalas», y exigir además que empiecen en la 5
 * sería suspender a quien las juntó en la 6 — que es lo mismo de bien hecho.
 */
export const museoJunto = (m: Mazo): boolean => {
  const donde = DEL_MUSEO.map((t) => dondeEsta(m, t));
  if (donde.some((i) => i < 0)) return false;
  const orden = [...donde].sort((a, b) => a - b);
  return orden[2] - orden[0] === 2;
};

export const preciosOculta = (m: Mazo): boolean =>
  Boolean(m.diapositivas[dondeEsta(m, LOS_PRECIOS)]?.oculta);

/** Tres tramos con nombre. Cuáles sean, los elige el alumno. */
export const tresSecciones = (m: Mazo): boolean => secciones(m).length >= 3;

/** Alguno plegado, que es lo que hace que dieciocho quepan en una pantalla. */
export const algunaPlegada = (m: Mazo): boolean => secciones(m).some((s) => s.plegada);

/**
 * Y una comprobación que no es de encargo pero se usa al escribir la clase: que
 * ninguna sección se quede sin diapositivas. Se deriva de `tramos`, así que si
 * algún día el reparto cambia, esto cambia con él.
 */
export const ningunTramoVacio = (m: Mazo): boolean =>
  tramos(m).every((t) => t.indices.length > 0);

/* ── la presentación del viaje, tal y como llegó ───────────────────────────── */

/**
 * Título y cuerpo de cada una, **en el orden en que estaban en el archivo**.
 * El desorden se lee aquí de un vistazo, que es como tiene que poder auditarse.
 */
const LLEGARON: [string, string | null][] = [
  ['Nos subimos al camión a las 6', 'Salimos de la escuela todavía de noche\nLa maestra Ana contó tres veces'],
  ['La sala de los dinosaurios', 'El esqueleto grande mide 12 metros\nNos dejaron tocar una réplica de hueso'],
  [PORTADA, 'Escuela Primaria Benito Juárez · Mayo'],
  ['El desayuno en el parque', 'Cada quien llevó lo suyo\nSobró comida para el regreso'],
  ['Lo que costó por alumno', 'Camión: 180\nEntrada al museo: 45\nComida: la llevó cada quien'],
  ['El museo por dentro', 'Tiene tres pisos y un patio\nLa entrada es gratis para escuelas'],
  ['El taller de fósiles', 'Nos dieron yeso y un molde\nCada quien se llevó el suyo'],
  ['Lo que más nos gustó del museo', 'El esqueleto grande, sin discusión\nY el cuarto oscuro de las estrellas'],
  ['El regreso', 'Casi todos se durmieron\nLlegamos a las 7 de la tarde'],
  ['Lo que aprendimos', 'Que un fósil no es un hueso: es piedra\nQue el museo se camina en dos horas'],
  ['La foto del grupo', 'En la escalera de la entrada'],
  ['Gracias a los que nos acompañaron', 'A la maestra Ana\nA tres mamás y un papá'],
  ['El parque de junto', 'Comimos ahí\nHay juegos y sombra'],
  ['Cuántos fuimos', '31 alumnos\n5 acompañantes'],
  ['El cuarto oscuro', 'Se ven estrellas en el techo\nHay que esperar a que los ojos se acostumbren'],
  ['Lo que llevamos', 'Gorra, agua y algo de comer\nY el permiso firmado'],
  ['Lo que haríamos distinto', 'Salir más temprano\nLlevar menos cosas'],
  ['¿Repetimos el año que viene?', 'Todos dijeron que sí'],
];

const mazoDelViaje = (): Mazo => {
  const diapositivas: Diapositiva[] = LLEGARON.map(([titulo, cuerpo], i) => ({
    // La portada llegó con diseño de portada aunque esté en tercer lugar: es
    // parte del desorden que el alumno tiene que reconocer. Una portada
    // disfrazada de diapositiva normal sería otro ejercicio distinto.
    diseno: titulo === PORTADA ? 'portada' : 'titulo-texto',
    marcadores: [
      { rol: 'titulo', contenido: titulo, casilla: null },
      { rol: titulo === PORTADA ? 'subtitulo' : 'cuerpo', contenido: cuerpo, casilla: null },
    ],
    libres: [],
    notas: i === 0 ? 'Empezar por aquí mientras se acomodan.' : undefined,
  }));

  return { tema: 'arena', activa: 0, diapositivas };
};

/* ── el guion ─────────────────────────────────────────────────────────────── */

export const GUION_ORDENA_EL_MAZO: GuionDiapos = {
  archivo: 'Viaje de fin de curso.pptx',
  mazo: mazoDelViaje,

  portada: {
    situacion: 'PowerPoint · Grado básico · La sala',
    tema: 'Ordenar una presentación larga',
    objetivo: 'Vas a saber ordenar una presentación larga sin perderte dentro de ella.',
    vasAHacer: [
      'Mirarla entera desde arriba, no por la tira',
      'Poner en su sitio la portada y las tres del museo',
      'Esconder una sin borrarla',
      'Partirla en tramos con nombre',
    ],
    requisitos: 'Haber hecho una presentación de varias diapositivas.',
    ayuda:
      'Las tres vistas están abajo a la derecha, en la barra gris del final. Sección está en Inicio, junto a Nueva diapositiva. Ocultar está en Presentación → Configurar.',
  },

  pasos: [
    {
      id: 'mirala-entera',
      titulo: 'No caben en la tira',
      instruccion:
        'Son dieciocho y de la tira no ves ni la mitad. Ábrela en el Clasificador: el botón del medio, abajo a la derecha.',
      pista:
        'Abajo a la derecha, junto al zoom, hay tres botoncitos. El de en medio enseña todas a la vez.',
      logro: { tipo: 'control', control: 'vista-clasificador' },
      aprendido:
        'Ahí están las dieciocho. Fíjate en lo que se ve ahora y antes no: la portada está en tercer lugar, las del museo andan sueltas y hay una que no era para el grupo. El desorden no se explica, se ve.',
    },
    {
      id: 'la-que-va-primera',
      titulo: 'La portada, primera',
      instruccion:
        'La portada quedó en el tercer lugar. Arrástrala hasta el primero, aquí en el Clasificador.',
      pista: 'Se agarra y se suelta, igual que en la tira. Suéltala antes de la que hoy es la primera.',
      logro: { tipo: 'documento', comprueba: portadaPrimero },
      aprendido:
        'Ya empieza por donde tiene que empezar. Esto en la tira también se puede, pero hay que subir y bajar a ciegas; aquí las ves todas y sabes a dónde la llevas.',
    },
    {
      id: 'el-tramo-del-museo',
      titulo: 'Las del museo, juntas',
      instruccion:
        'Hay tres del museo repartidas por toda la presentación: «El museo por dentro», «La sala de los dinosaurios» y «Lo que más nos gustó del museo». Déjalas seguidas.',
      pista: 'No importa en qué lugar las pongas. Lo que importa es que vayan una detrás de otra.',
      logro: { tipo: 'documento', comprueba: museoJunto },
      aprendido:
        'Así es como se cuenta algo: lo del mismo tema, junto. Repartido, el que escucha vuelve al museo tres veces y no sabe si ya se lo contaste.',
    },
    {
      id: 'hoy-no-toca',
      titulo: 'Ésta hoy no toca',
      instruccion:
        '«Lo que costó por alumno» era para la junta de padres, no para el grupo. No la borres: escóndela. Está en Presentación → Configurar → Ocultar diapositiva.',
      pista:
        'Primero selecciónala, y después el botón. Ocultar no está en Inicio con Duplicar y Quitar: está en la pestaña de presentar, porque no toca el archivo, toca la presentación.',
      senal: { pestana: 'presentacion' },
      logro: { tipo: 'documento', comprueba: preciosOculta },
      aprendido:
        'Mírala: sigue ahí, con el número tachado y el aviso de «no se presenta». La semana que viene, en la junta, la vuelves a enseñar con el mismo botón.',
    },
    {
      id: 'sigue-ahi',
      titulo: 'Entonces, ¿qué le pasó?',
      instruccion: 'Acabas de ocultar una diapositiva. ¿Qué pasó con ella exactamente?',
      pista: 'Míralas: ¿desapareció de la lista o sigue viéndose de otra manera?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Se borró del archivo, como si le hubiera dado a Quitar',
          'Sigue en el archivo, con su número tachado, pero no sale al presentar',
          'Se movió al final de la presentación',
        ],
        correcta: 1,
      },
      aprendido:
        'Sigue dentro. Y eso tiene una segunda cara que conviene saber desde hoy: si le mandas el archivo a alguien, **la oculta va dentro**. Esconderla es para ti, no es un candado.',
    },
    {
      id: 'ponles-nombre',
      titulo: 'Pártela en tramos',
      instruccion:
        'Dieciocho seguidas no se abarcan. Créale tres secciones —por ejemplo «El viaje», «El museo» y «El cierre»—: te pones en la diapositiva donde empieza cada tramo y usas Inicio → Sección.',
      pista:
        'La sección empieza en la diapositiva en la que estás, así que primero selecciónala y luego el botón. Los nombres los eliges tú.',
      senal: { pestana: 'inicio' },
      logro: { tipo: 'documento', comprueba: tresSecciones },
      aprendido:
        'Ahora la presentación tiene partes con nombre. Y fíjate en algo que vas a agradecer más adelante: cuando una presentación tiene secciones, el programa sabe hacer un índice solo a partir de ellas.',
    },
    {
      id: 'pliegala',
      titulo: 'Pliega una',
      instruccion: 'Pulsa el triangulito de una de tus secciones para plegarla.',
      pista: 'El ▾ que está a la izquierda del nombre. Vuelve a pulsarlo y se despliega.',
      logro: { tipo: 'documento', comprueba: algunaPlegada },
      aprendido:
        'Dieciocho diapositivas en tres renglones. Eso es lo que hacen las secciones: no cambian nada de lo que se presenta, cambian lo que TÚ puedes abarcar mientras trabajas.',
    },
    {
      id: 'de-corrido',
      titulo: 'Pásala de corrido',
      instruccion:
        'Última cosa: la vista de Lectura, el tercer botón de abajo a la derecha. Pasa la presentación dentro de la ventana y fíjate en si aparece la que ocultaste.',
      pista: 'Con las flechas se avanza. Con Escape se sale.',
      logro: { tipo: 'control', control: 'vista-lectura' },
      aprendido:
        'No aparece: te la saltó sin decir nada, que es justo lo que le pediste. Y ya sabes las tres vistas: Normal para trabajar, Clasificador para ordenar, Lectura para repasar. Son la misma presentación mirada de tres maneras.',
    },
  ],

  cierre:
    'Dieciocho diapositivas en desorden y ahora se lee de un vistazo. Ordenar no es un adorno: es lo que hace que una presentación larga se pueda seguir trabajando.',
};

export default GUION_ORDENA_EL_MAZO;
