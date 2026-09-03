import {
  CINTA_BASICO,
  type ControlCinta,
  type GrupoCinta,
  type Pestana,
  type PestanaId,
} from '@/components/activities/office/tecniaTextos';
import { FORMAS, FOTOS, type Pieza } from './piezas';

/**
 * La cinta de esta clase: la del grado Básico **recortada**, más dos pestañas.
 *
 * ── POR QUÉ SE RECORTA ──────────────────────────────────────────────────────
 * El alumno tiene diez u once años y la clase va de ilustrar una portada. La
 * cinta del grado Básico entera trae Portapapeles, Estilos, Tablas y Encabezado
 * y pie, y de esos cuatro grupos esta clase no usa ni un botón: son ruido con
 * nombre de herramienta. Menos botones no es menos programa —es el programa de
 * verdad recortado, que es lo que hace Word con el modo simplificado— y el
 * criterio para recortar es el de §34: la clase declara qué existe, el aparato
 * no decide.
 *
 * Sobrevive de Inicio lo que un alumno toca sin que nadie se lo pida: la letra
 * y las cuatro alineaciones. Un título de portada centrado es lo primero que se
 * le ocurre a cualquiera al ver el WordArt puesto, y encontrarse el grupo
 * Párrafo vacío ahí sería una puerta cerrada sin motivo.
 *
 * ── LAS DOS PESTAÑAS NUEVAS ─────────────────────────────────────────────────
 * **Formato** es la pestaña de herramientas de imagen de Word. En Word aparece
 * sola al seleccionar una imagen y se va al soltarla; aquí está siempre y sus
 * cuatro botones nacen apagados hasta que hay algo seleccionado. Se declara como
 * simplificación: una pestaña que aparece y desaparece deja al halo del maestro
 * apuntando a un sitio que todavía no existe, y en una clase de diez años eso
 * cuesta más de lo que enseña. El estado apagado enseña lo mismo —«primero
 * selecciona, luego da formato»— y no se rompe.
 *
 * **Vista** trae un solo botón, «Una página», que es el heredero de la palanca
 * de lupa del laboratorio viejo. Ahí ya estaba razonado: un procesador de textos
 * no te aleja de la mesa, te baja el zoom de la página.
 */

/** Toma un grupo de `CINTA_BASICO` tal cual, o sólo con los controles pedidos. */
function heredar(pestana: PestanaId, grupo: string, controles?: string[]): GrupoCinta {
  const g = CINTA_BASICO.find((p) => p.id === pestana)?.grupos.find((x) => x.id === grupo);
  if (!g) throw new Error(`El grupo «${grupo}» ya no está en CINTA_BASICO`);
  return controles ? { ...g, controles: g.controles.filter((c) => controles.includes(c.id)) } : g;
}

/**
 * El glifo de reserva de cada pieza.
 *
 * La miniatura de verdad la pinta el CSS de la clase con el mismo SVG que se
 * inserta en la hoja. Esto es lo que se ve si esa hoja no llega: un botón con un
 * signo y su nombre completo en el `title`, que sigue siendo usable. Un botón en
 * blanco no lo es, y una galería es justo donde más se nota.
 */
const GLIFO: Record<string, string> = {
  'forma-flecha': '➜',
  'forma-estrella': '★',
  'forma-banda': '▬',
  'forma-globo': '🗨',
  'foto-zorro': '🦊',
  'foto-cactus': '🌵',
  'foto-duna': '🏜',
  'foto-noche': '🌙',
};

/**
 * Un botón de galería: la miniatura arriba y el nombre corto debajo.
 *
 * Va `ancho` porque es lo único que hace que el motor pinte el nombre, y el
 * nombre hace falta: una rejilla de ocho dibujos mudos obliga a un niño de diez
 * años a posar el ratón en cada uno para saber qué es. La forma de tarjeta
 * —dibujo encima, nombre debajo— la pone el CSS de la clase.
 */
const miniatura = (p: Pieza): ControlCinta => ({
  id: p.id,
  glifo: GLIFO[p.id] ?? '◇',
  etiqueta: p.nombre,
  corto: p.corto,
  ancho: true,
});

const IMAGENES: GrupoCinta = { id: 'imagenes', nombre: 'Imágenes', controles: FOTOS.map(miniatura) };
const FORMAS_GRUPO: GrupoCinta = { id: 'formas', nombre: 'Formas', controles: FORMAS.map(miniatura) };

/*
 * ── POR QUÉ LAS ETIQUETAS SE MIDIERON UNA A UNA ─────────────────────────────
 * Desde §37 la `etiqueta` de un control ya no es sólo el `title` del botón: es
 * el nombre de la ficha, el domicilio que se lee en ella —«Formato → Tamaño →
 * …»— y, sobre todo, el RÓTULO que cuelga del señalador. Y ese rótulo va
 * centrado bajo el botón, en una sola línea y sin recortarse.
 *
 * Medido el 10-ago-2026 con el señalador puesto: «Una página: ver la hoja
 * entera de lejos» son 234 px colgando de un botón cuyo centro está en el 68,
 * así que el rótulo empezaba en −49 y se salía de la ventana por la izquierda.
 * De ahí la regla que sigue este archivo:
 *
 *  · Control que un encargo SEÑALA y que además vive en el primer grupo de su
 *    pestaña —`una-pagina`, `ajuste-cuadrado`, `foto-zorro`—: etiqueta corta,
 *    que es lo único que cabe. Lo que hace se explica en la instrucción o en
 *    `QUE_HACE` del motor.
 *  · Control que se señala pero vive holgado —`tamano-mas`, `forma-flecha`—:
 *    etiqueta larga y descriptiva, que ahí sí cabe entera.
 *  · Control que NUNCA se señala pero que el alumno puede pulsar por error
 *    —`tamano-ancho`, `ajuste-linea`, las otras tres formas y las otras tres
 *    fotos—: etiqueta descriptiva SIEMPRE, porque es lo que el motor lee en el
 *    recado del desvío —«Eso es «Más ancha: estira sólo a lo ancho»»— y es la
 *    única lección que ese recado puede dar mientras `QUE_HACE` no conozca los
 *    controles de esta clase.
 */
const ORGANIZAR: GrupoCinta = {
  id: 'organizar',
  nombre: 'Organizar',
  controles: [
    { id: 'ajuste-linea', glifo: '▤', etiqueta: 'En línea: la foto parte el texto', corto: 'En línea', ancho: true },
    { id: 'ajuste-cuadrado', glifo: '▥', etiqueta: 'Ajuste cuadrado', corto: 'Cuadrado', ancho: true },
  ],
};

const TAMANO: GrupoCinta = {
  id: 'tamano',
  nombre: 'Tamaño',
  controles: [
    { id: 'tamano-mas', glifo: '⤢', etiqueta: 'Más grande · crece entera', corto: 'Más grande', ancho: true },
    { id: 'tamano-menos', glifo: '⤡', etiqueta: 'Más chica', corto: 'Más chica', ancho: true },
    { id: 'tamano-ancho', glifo: '↔', etiqueta: 'Más ancha: estira sólo a lo ancho', corto: 'Más ancha', ancho: true },
  ],
};

const ZOOM: GrupoCinta = {
  id: 'zoom-grupo',
  nombre: 'Zoom',
  controles: [
    { id: 'una-pagina', glifo: '▯', etiqueta: 'Una página', corto: 'Una página', ancho: true },
  ],
};

export const CINTA_FORMAS: Pestana[] = [
  {
    id: 'inicio',
    nombre: 'Inicio',
    grupos: [
      heredar('inicio', 'fuente'),
      heredar('inicio', 'parrafo', ['izquierda', 'centro', 'derecha', 'justificado']),
    ],
  },
  {
    id: 'insertar',
    nombre: 'Insertar',
    // El orden es el de Word: primero lo que se ilustra, después lo que se
    // rotula. WordArt vive en el grupo Texto, que es donde está en el programa.
    grupos: [IMAGENES, FORMAS_GRUPO, heredar('insertar', 'texto', ['wordart'])],
  },
  {
    id: 'disposicion',
    nombre: 'Formato',
    grupos: [ORGANIZAR, TAMANO],
  },
  {
    id: 'vista',
    nombre: 'Vista',
    grupos: [ZOOM],
  },
];
