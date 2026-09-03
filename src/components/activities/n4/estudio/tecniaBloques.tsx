'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { propsSoltar } from './estudioN4';
import {
  LARGO_MAXIMO_NOMBRE,
  type Accion,
  type NodoCuerpo,
  type NodoOrden,
  type Pregunta,
  type Programa,
} from './programaBloques';

/**
 * `Tecnia Bloques` · el editor de bloques ultra-LITE de N4 · U3 (doc §25).
 *
 * Esto NO es un HUD ni un juego de arrastrar tarjetas: es la PANTALLA del
 * monitor de `EstacionBloques3D`, y por eso se dibuja como se dibuja un
 * programa de verdad —barra de título con su semáforo, columna de categorías,
 * paleta, lienzo con su propia cabecera de ▶ y ⏹— y no como una interfaz de
 * juego. El marco mide 588 x 310 px clavados, que es el hueco del bisel del
 * monitor; nada de dentro puede crecer, así que las alturas suman 310: barra 24
 * + cuerpo 286, y dentro del taller cabecera 24 + lienzo 262.
 *
 * ── POR QUÉ LAS FORMAS SON CSS Y NO IMÁGENES ────────────────────────────────
 * La forma del bloque es la mitad de la enseñanza: un hexágono entra en un
 * hueco hexagonal y un rectángulo rebota, y esa es la manera de descubrir sin
 * que nadie lo explique que una condición no es una orden. Con imágenes, el
 * hueco y la pieza serían dos dibujos que hay que mantener a juego; con
 * `clip-path`, la pieza y el agujero salen del MISMO polígono declarado una vez
 * en `arcade3d.css`, así que no pueden desalinearse.
 *
 * ── EL IDIOMA DE COLOR ──────────────────────────────────────────────────────
 * Movimiento cian · Control ámbar · Sensores verde · Variables naranja. Es el
 * mismo idioma que los aros del video explicativo de esta parada, y el mismo
 * que las cajas de la estantería del taller: cuando el alumno abre el programa
 * ya ha visto esos cuatro colores dos veces. El sombrero `▶ al empezar` va en
 * oro apagado justamente porque NO es ninguna de las cuatro categorías.
 *
 * ── LA CAJITA SE HACE, NO VIENE HECHA (doc §25.2) ───────────────────────────
 * En la parada 2 la paleta de Variables empieza VACÍA, con un solo botón:
 * `+ Nueva variable`. Se abre un diálogo de programa de verdad —velo encima de
 * todo el marco, barra de título, campo con su etiqueta, Cancelar y Aceptar— y
 * hasta que el alumno no bautiza su cajita no aparece ni una pieza naranja.
 * Esto no es adorno: el documento pide que ponerle nombre a lo que guardas SEA
 * el ejercicio, y una paleta que ya trae `puntos` hecho se lo regala. Por eso
 * el diálogo rechaza —no avisa: rechaza— «equis», «cosa» y los nombres que no
 * caben de un vistazo, con las mismas tres razones que dice el video.
 *
 * Las cuatro piezas de la variable nacen en `fichasDeVariable` con el nombre
 * del alumno cosido dentro de la etiqueta, y el trozo que es el nombre se pinta
 * como óvalo. La pregunta `¿nombre = 5?` se queda VERDE y en Sensores, porque
 * la regla que el alumno aprendió en la parada 1 es que las preguntas son
 * hexágonos verdes; lo naranja es sólo el óvalo de dentro, que es justo lo que
 * dice de qué va la pregunta. Así se ve en la lámina `pregunta-por-ella`.
 *
 * El componente es controlado de arriba abajo: aquí no vive ni un `useState`.
 * Todo el estado —el programa, el bloque que se ilumina, la ficha elegida— lo
 * guarda `LabSiPasaEsto`, que es también quien corre el intérprete. Así la
 * pantalla no puede contar una cosa distinta de la que la vitrina está
 * haciendo.
 */

/* ── el catálogo de la paleta ──────────────────────────────────────────────── */

export type CategoriaBloque = 'movimiento' | 'control' | 'sensores' | 'variables';

export type FormaBloque = 'orden' | 'c' | 'c-doble' | 'hexagono' | 'reportero';

/** Qué nace al encajar la ficha. `null` = señuelo: no encaja en ningún sitio. */
export type CreaBloque =
  | { tipo: 'orden'; accion: Accion }
  | { tipo: 'si' }
  | { tipo: 'sino' }
  | { tipo: 'condicion'; pregunta: Pregunta }
  | null;

export interface FichaPaleta {
  id: string;
  categoria: CategoriaBloque;
  forma: FormaBloque;
  etiqueta: string;
  /**
   * El trozo de `etiqueta` que se pinta como óvalo, porque no es palabra del
   * bloque sino el nombre que puso el alumno. Se busca por texto para que la
   * etiqueta siga siendo UNA sola cadena —lo que se lee es lo que se ve— en
   * vez de tres pedazos que hay que volver a pegar en cada sitio.
   */
  ovalo?: string;
  crea: CreaBloque;
  /** Lo que Bit lee en voz alta cuando el alumno toca la ficha (doc §25.1). */
  lectura: string;
}

export const CATEGORIAS: { id: CategoriaBloque; nombre: string }[] = [
  { id: 'movimiento', nombre: 'Movimiento' },
  { id: 'control', nombre: 'Control' },
  { id: 'sensores', nombre: 'Sensores' },
  { id: 'variables', nombre: 'Variables' },
];

/**
 * Las ocho fichas de la unidad. `por siempre` no está aquí a propósito: ya viene
 * puesto en el lienzo desde el primer segundo, porque el documento pide que el
 * alumno no empiece ante una hoja en blanco sino ante un programa que YA hace
 * algo —y que hace algo tonto.
 */
export const CATALOGO: FichaPaleta[] = [
  {
    id: 'avanzar',
    categoria: 'movimiento',
    forma: 'orden',
    etiqueta: 'avanzar 1 casilla',
    crea: { tipo: 'orden', accion: 'avanzar' },
    lectura: 'Avanzar mueve al muñeco una casilla hacia adelante.',
  },
  {
    id: 'saltar',
    categoria: 'movimiento',
    forma: 'orden',
    etiqueta: 'saltar',
    crea: { tipo: 'orden', accion: 'saltar' },
    lectura: 'Saltar lo lleva una casilla por el aire, así que pasa por encima de lo que haya.',
  },
  {
    id: 'recoger',
    categoria: 'movimiento',
    forma: 'orden',
    etiqueta: 'recoger moneda',
    crea: { tipo: 'orden', accion: 'recoger' },
    lectura: 'Recoger lo agacha a tomar la moneda de la casilla donde está parado.',
  },
  {
    id: 'si',
    categoria: 'control',
    forma: 'c',
    etiqueta: 'si · entonces',
    crea: { tipo: 'si' },
    lectura: 'El bloque si abre una boca: lo que metas ahí sólo pasa cuando la respuesta es sí.',
  },
  {
    id: 'sino',
    categoria: 'control',
    forma: 'c-doble',
    etiqueta: 'si · entonces · si no',
    crea: { tipo: 'sino' },
    lectura: 'Este tiene dos bocas: una para cuando la respuesta es sí y otra para cuando es no.',
  },
  {
    id: 'toca-moneda',
    categoria: 'sensores',
    forma: 'hexagono',
    etiqueta: '¿tocando la moneda?',
    crea: { tipo: 'condicion', pregunta: 'tocando-moneda' },
    lectura: 'Es una pregunta de sí o no: ¿el muñeco está sobre la moneda?',
  },
  {
    id: 'toca-pared',
    categoria: 'sensores',
    forma: 'hexagono',
    etiqueta: '¿tocando la pared?',
    crea: { tipo: 'condicion', pregunta: 'tocando-pared' },
    lectura: 'Es una pregunta de sí o no: ¿el muñeco tiene la pared delante?',
  },
  {
    id: 'puntos',
    categoria: 'variables',
    forma: 'reportero',
    etiqueta: '¿cuántos puntos tengo?',
    crea: null,
    lectura: 'Esta no se contesta con sí o con no: contesta con un número. Por eso no cabe en el hueco.',
  },
];

export function mapaDeFichas(fichas: FichaPaleta[]): Map<string, FichaPaleta> {
  return new Map(fichas.map((f) => [f.id, f]));
}

export const FICHAS_POR_ID = mapaDeFichas(CATALOGO);

/* ── las piezas que nacen con el nombre que puso el alumno (doc §25.2) ─────── */

/**
 * Las cuatro caras de una variable, ya bautizada.
 *
 * Se fabrican en vez de estar en el `CATALOGO` porque su etiqueta depende del
 * nombre que escribió el alumno, y ese nombre es lo que hace que el programa se
 * lea solo: `sumar 1 a monedas` se entiende sin que nadie lo explique y
 * `sumar 1 a x` no. Son cuatro y no una porque una variable se usa de cuatro
 * maneras distintas —mirarla, vaciarla, aumentarla y preguntarle— y cada una
 * tiene su forma: óvalo, orden, orden y hexágono.
 *
 * El hexágono es de Sensores y verde a propósito: ver el docblock de arriba.
 */
export function fichasDeVariable(nombre: string, meta: number): FichaPaleta[] {
  return [
    {
      id: 'var:valor',
      categoria: 'variables',
      forma: 'reportero',
      // Sin `ovalo`: esta ficha YA es el óvalo entero, así que marcarlo dentro
      // dibujaría una cápsula naranja dentro de otra.
      etiqueta: nombre,
      crea: null,
      lectura: `Este óvalo es la cajita vista por fuera: dice cuánto hay en ${nombre} justo ahora.`,
    },
    {
      id: 'var:poner-cero',
      categoria: 'variables',
      forma: 'orden',
      etiqueta: `poner ${nombre} en cero`,
      ovalo: nombre,
      crea: { tipo: 'orden', accion: 'poner-cero' },
      lectura: `Vacía la cajita. Va arriba y una sola vez: dentro del bucle, ${nombre} se borraría en cada vuelta.`,
    },
    {
      id: 'var:sumar',
      categoria: 'variables',
      forma: 'orden',
      etiqueta: `sumar 1 a ${nombre}`,
      ovalo: nombre,
      crea: { tipo: 'orden', accion: 'sumar' },
      lectura: `Mete un punto más en ${nombre}. Sólo cuenta de verdad si va pegado a lo que estás contando.`,
    },
    {
      id: 'var:pregunta',
      categoria: 'sensores',
      forma: 'hexagono',
      etiqueta: `¿${nombre} = ${meta}?`,
      ovalo: nombre,
      crea: { tipo: 'condicion', pregunta: 'puntos-igual-meta' },
      lectura: `Es de sí o no, por eso es hexágono verde: mira dentro de ${nombre} y contesta si ya llegó a ${meta}.`,
    },
  ];
}

/**
 * El letrero de la vitrina. Vive en Variables pero no lleva nombre de nadie: no
 * guarda ni cuenta nada, sólo avisa, y por eso es la única pieza naranja que no
 * hace falta fabricar.
 */
export const FICHA_MOSTRAR: FichaPaleta = {
  id: 'mostrar',
  categoria: 'variables',
  forma: 'orden',
  etiqueta: 'mostrar ¡GANASTE!',
  crea: { tipo: 'orden', accion: 'mostrar' },
  lectura: 'Enciende el letrero grande de la vitrina. No cuenta: avisa. Va donde la cuenta ya llegó.',
};

/* ── las piezas del videojuego (doc §25.3) ─────────────────────────────────── */

/**
 * Las doce fichas de la parada 3, las que hacen falta para las cuatro reglas.
 *
 * No entran en el `CATALOGO` porque en las paradas 1 y 2 no existe un muñeco
 * que se mueva con flechas ni un enemigo que perseguir: repartirlas antes sería
 * llenar la paleta de piezas que no encajan en ningún reto. Aquí, en cambio, son
 * TODA la paleta, y por eso el `avanzar 1 casilla` de la vitrina no viene: en
 * una cancha abierta no hay casillas ni un «adelante» que valga.
 *
 * Ni una etiqueta lleva cifras, tal como pide el documento: los cuatro rumbos se
 * dicen con palabras —«a la derecha», «hacia arriba»— para que la pieza se lea
 * igual que la flecha que hay que apretar y el emparejamiento sea evidente.
 *
 * El idioma de color es el de siempre: cian lo que mueve al muñeco y lo que pasa
 * en la cancha, ámbar lo que manda sobre el juego entero, verde las preguntas.
 * `detener el juego` es la única que es Control y no Movimiento, y ese cambio de
 * color es la pista de que no toca al muñeco sino a la partida.
 */
export const FICHAS_JUEGO: FichaPaleta[] = [
  {
    id: 'mover-derecha',
    categoria: 'movimiento',
    forma: 'orden',
    etiqueta: 'mover a la derecha',
    crea: { tipo: 'orden', accion: 'mover-derecha' },
    lectura: 'Empuja al muñeco hacia la derecha mientras esta orden se esté cumpliendo.',
  },
  {
    id: 'mover-izquierda',
    categoria: 'movimiento',
    forma: 'orden',
    etiqueta: 'mover a la izquierda',
    crea: { tipo: 'orden', accion: 'mover-izquierda' },
    lectura: 'Empuja al muñeco hacia la izquierda mientras esta orden se esté cumpliendo.',
  },
  {
    id: 'mover-arriba',
    categoria: 'movimiento',
    forma: 'orden',
    etiqueta: 'mover hacia arriba',
    crea: { tipo: 'orden', accion: 'mover-arriba' },
    lectura: 'Empuja al muñeco hacia arriba, al fondo de la cancha.',
  },
  {
    id: 'mover-abajo',
    categoria: 'movimiento',
    forma: 'orden',
    etiqueta: 'mover hacia abajo',
    crea: { tipo: 'orden', accion: 'mover-abajo' },
    lectura: 'Empuja al muñeco hacia abajo, hacia el frente de la cancha.',
  },
  {
    id: 'esconder-moneda',
    categoria: 'movimiento',
    forma: 'orden',
    etiqueta: 'esconder la moneda',
    crea: { tipo: 'orden', accion: 'esconder-moneda' },
    lectura: 'Quita de la cancha la moneda que el muñeco está tocando. Sin esto, la moneda sigue ahí.',
  },
  {
    id: 'volver-inicio',
    categoria: 'movimiento',
    forma: 'orden',
    etiqueta: 'volver al inicio',
    crea: { tipo: 'orden', accion: 'volver-inicio' },
    lectura: 'Devuelve al muñeco a la salida, la esquina de donde arrancó.',
  },
  {
    id: 'detener-juego',
    categoria: 'control',
    forma: 'orden',
    etiqueta: 'detener el juego',
    crea: { tipo: 'orden', accion: 'detener-juego' },
    lectura: 'Para la partida entera. Nada se mueve después de esto, así que va al final de todo.',
  },
  {
    id: 'flecha-derecha',
    categoria: 'sensores',
    forma: 'hexagono',
    etiqueta: '¿flecha derecha?',
    crea: { tipo: 'condicion', pregunta: 'flecha-derecha' },
    lectura: 'Pregunta de sí o no: ¿está apretada la flecha derecha en este momento?',
  },
  {
    id: 'flecha-izquierda',
    categoria: 'sensores',
    forma: 'hexagono',
    etiqueta: '¿flecha izquierda?',
    crea: { tipo: 'condicion', pregunta: 'flecha-izquierda' },
    lectura: 'Pregunta de sí o no: ¿está apretada la flecha izquierda en este momento?',
  },
  {
    id: 'flecha-arriba',
    categoria: 'sensores',
    forma: 'hexagono',
    etiqueta: '¿flecha arriba?',
    crea: { tipo: 'condicion', pregunta: 'flecha-arriba' },
    lectura: 'Pregunta de sí o no: ¿está apretada la flecha de arriba en este momento?',
  },
  {
    id: 'flecha-abajo',
    categoria: 'sensores',
    forma: 'hexagono',
    etiqueta: '¿flecha abajo?',
    crea: { tipo: 'condicion', pregunta: 'flecha-abajo' },
    lectura: 'Pregunta de sí o no: ¿está apretada la flecha de abajo en este momento?',
  },
  {
    id: 'toca-enemigo',
    categoria: 'sensores',
    forma: 'hexagono',
    etiqueta: '¿tocando al enemigo?',
    crea: { tipo: 'condicion', pregunta: 'tocando-enemigo' },
    lectura: 'Pregunta de sí o no: ¿el muñeco chocó con el enemigo que patrulla?',
  },
];

/* ── las zonas donde se puede soltar ───────────────────────────────────────── */

export type ClaseZona = 'inicio' | 'siempre' | 'boca' | 'sino' | 'hueco';

export interface ZonaDestino {
  clase: ClaseZona;
  /** El bloque en C dueño de la boca o del hueco. Vacío para el `por siempre`. */
  nodoId: string;
}

/**
 * La regla de encaje, en un solo sitio.
 *
 * Vive aquí y no en el laboratorio porque la pantalla la necesita ANTES de que
 * el alumno suelte —para pintar la sombra de encaje verde en las zonas donde la
 * pieza sí cabe— y el laboratorio la necesita DESPUÉS, para decidir si rebota.
 * Si fueran dos copias, tarde o temprano una zona se iluminaría y luego
 * escupiría la pieza, que es la peor mentira que puede contar una interfaz.
 */
export function admite(clase: ClaseZona, crea: CreaBloque): boolean {
  if (!crea) return false;
  if (clase === 'hueco') return crea.tipo === 'condicion';
  // Un bloque en C sólo puede nacer en el tronco: el `por siempre` es el único
  // que abraza a otros. Anidar condiciones dentro de condiciones es de más
  // adelante, y aquí sólo serviría para perder al alumno. `inicio` tampoco los
  // admite —ahí sólo van órdenes sueltas, y por eso no hay que tocar nada: cae
  // en esta misma línea y contesta que no.
  if (crea.tipo === 'si' || crea.tipo === 'sino') return clase === 'siempre';
  // Cualquier orden entra en `inicio`. Que esté BIEN puesta ahí no lo decide el
  // encaje sino el reto: `poner en cero` arriba está bien y `sumar 1` arriba es
  // el error que §25.2 quiere que el alumno cometa y vea. Si la pieza rebotara,
  // el error sería imposible y con él la lección.
  return crea.tipo === 'orden';
}

/* ── piezas del editor ─────────────────────────────────────────────────────── */

/**
 * El catálogo que está en juego AHORA, para los bloques ya colocados.
 *
 * Un bloque puesto en el lienzo guarda su acción, no su etiqueta, así que para
 * dibujarse tiene que volver a buscar su ficha. Mientras las fichas fueron ocho
 * fijas bastaba con mirar el `CATALOGO` del módulo; desde que el alumno fabrica
 * las suyas, ese catálogo ya no las tiene y un `sumar 1 a monedas` colocado se
 * dibujaría como `sumar` a secas y en cian. El contexto es lo que evita pasar
 * la lista a mano por los cuatro pisos de componentes que hay hasta el hueco.
 */
const ContextoFichas = createContext<FichaPaleta[]>(CATALOGO);

function useFichas() {
  return useContext(ContextoFichas);
}

/* ── el modo caza de la parada 4 (doc §25.4) ───────────────────────────────── */

/**
 * Lo que cambia en el editor cuando lo que hay abierto es un juego ROTO.
 *
 * En la parada 4 el alumno no construye: repara. Y un editor que en modo
 * reparación siguiera enseñando la paleta estaría invitando a lo contrario de lo
 * que la lección pide —«cambia UNA sola cosa y vuelve a probar»—, así que con
 * `caza` puesto desaparecen las dos columnas de la izquierda, las ✕ de los
 * bloques y hasta los mandos ▶/⏹ de la cabecera. Los mandos se van porque la
 * palanca de probar es una pieza física del mueble: tener las dos sería la
 * doble interfaz que este proyecto tiene prohibida.
 *
 * Con la lupa apagada, tocar un bloque sigue siendo LEERLO —Bit lo explica—; con
 * la lupa encendida, tocarlo es acusarlo. Es la misma pieza con dos gestos, y
 * eso es a propósito: leer antes de acusar es justo el método que se enseña.
 */
export interface ModoCaza {
  /** La lupa está encendida: tocar un bloque lo marca en vez de leerlo. */
  activa: boolean;
  /** El bloque acusado ahora mismo, o `null` si todavía no hay ninguno. */
  marcado: string | null;
  /** Los que Bit ya explicó y resultaron inocentes: se quedan apagados. */
  descartados: string[];
  /** El bug confirmado. Se queda en verde hasta que arranca el juego siguiente. */
  cazado: string | null;
  onMarcar: (nodoId: string) => void;
}

const ContextoCaza = createContext<ModoCaza | null>(null);

function useCaza() {
  return useContext(ContextoCaza);
}

/** El estado de un bloque dentro de la caza, como sufijo de clase. */
function claseCaza(caza: ModoCaza | null, nodoId: string): string {
  if (!caza) return '';
  if (caza.cazado === nodoId) return ' es-cazado';
  if (caza.marcado === nodoId) return ' es-marcado';
  if (caza.descartados.includes(nodoId)) return ' es-descartado';
  return caza.activa ? ' es-cazable' : '';
}

/**
 * La etiqueta de un bloque, con el nombre de la variable pintado como óvalo.
 *
 * Devuelve trozos y no un elemento con clase propia porque los tres sitios que
 * la usan —ficha de paleta, orden puesta y condición encajada— tienen cada uno
 * su envoltorio, y el óvalo tiene que ir DENTRO de él para heredar su tamaño de
 * letra. Si el nombre no aparece en la etiqueta, sale el texto tal cual: nunca
 * puede quedarse en blanco por una búsqueda fallida.
 */
function TrozosEtiqueta({ texto, ovalo }: { texto: string; ovalo?: string }) {
  const corte = ovalo ? texto.indexOf(ovalo) : -1;
  if (!ovalo || corte < 0) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, corte)}
      <span className="bloques3d-ovalo">{ovalo}</span>
      {texto.slice(corte + ovalo.length)}
    </>
  );
}

/**
 * Zona de soltar. El manejador se arma DENTRO del componente y no en el render
 * del padre, que es lo que exige `react-hooks/refs`; por eso la zona viaja como
 * dato y no como cierre ya construido.
 */
function ZonaBloques({
  className,
  zona,
  onSoltar,
  children,
}: {
  className: string;
  zona: ZonaDestino;
  onSoltar: (zona: ZonaDestino, fichaId: string) => void;
  children: ReactNode;
}) {
  const soltar = (fichaId: string) => onSoltar(zona, fichaId);
  return (
    <div className={className} {...propsSoltar(soltar)}>
      {children}
    </div>
  );
}

/**
 * El rótulo de una zona vacía, que es además el blanco de la segunda vía de
 * encaje.
 *
 * El documento §25 pide dos maneras de encajar: arrastrar la pieza, o tocarla y
 * después tocar el hueco. La segunda vive aquí, y es un `<button>` de verdad y
 * no un `<span>` con `onClick` porque así el camino sin arrastre es también el
 * camino que funciona con teclado —sin inventar un modo aparte para nadie.
 */
function PistaZona({
  className,
  zona,
  texto,
  onTocar,
}: {
  className: string;
  zona: ZonaDestino;
  texto: string;
  onTocar: (zona: ZonaDestino) => void;
}) {
  const tocar = () => onTocar(zona);
  return (
    <button type="button" className={className} onClick={tocar}>
      {texto}
    </button>
  );
}

/** Botón de la columna de categorías. Color pleno, nunca lavado. */
function BotonCategoria({
  categoria,
  nombre,
  activa,
  pide,
  onElegir,
}: {
  categoria: CategoriaBloque;
  nombre: string;
  activa: boolean;
  /** Aquí está la pieza que hace falta ahora: late para no dejar a nadie atorado. */
  pide: boolean;
  onElegir: (categoria: CategoriaBloque) => void;
}) {
  const elegir = () => onElegir(categoria);
  const clases = [
    'bloques3d-categoria',
    `es-${categoria}`,
    activa ? 'es-activa' : '',
    pide && !activa ? 'es-pide' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={clases} onClick={elegir}>
      <span className="bloques3d-categoria-punto" />
      {nombre}
    </button>
  );
}

/** Ficha de la paleta: se arrastra o se toca. Las dos vías llevan al mismo sitio. */
function FichaBloque({
  ficha,
  elegida,
  puntos,
  onElegir,
}: {
  ficha: FichaPaleta;
  elegida: boolean;
  puntos: number;
  onElegir: (fichaId: string) => void;
}) {
  const tomar = (e: DragEvent<HTMLElement>) => {
    e.dataTransfer.setData('text/plain', ficha.id);
    e.dataTransfer.effectAllowed = 'copy';
    onElegir(ficha.id);
  };
  const tocar = () => onElegir(ficha.id);
  const clases = [
    'bloques3d-ficha',
    `es-${ficha.forma}`,
    `es-${ficha.categoria}`,
    elegida ? 'es-elegida' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={clases} draggable onDragStart={tomar} onClick={tocar}>
      <span className="bloques3d-ficha-texto">
        <TrozosEtiqueta texto={ficha.etiqueta} ovalo={ficha.ovalo} />
      </span>
      {ficha.forma === 'reportero' && <span className="bloques3d-valor">{puntos}</span>}
    </button>
  );
}

/** La ✕ que devuelve un bloque puesto a la paleta. */
function QuitarBloque({ nodoId, onQuitar }: { nodoId: string; onQuitar: (nodoId: string) => void }) {
  const quitar = () => onQuitar(nodoId);
  return (
    <button type="button" className="bloques3d-quitar" onClick={quitar} aria-label="Quitar este bloque">
      ✕
    </button>
  );
}

/** Bloque de orden ya colocado en el lienzo. */
function OrdenPuesta({
  nodo,
  corriendo,
  onQuitar,
  onLeer,
}: {
  nodo: NodoOrden;
  corriendo: boolean;
  onQuitar: (nodoId: string) => void;
  onLeer: (nodoId: string) => void;
}) {
  const fichas = useFichas();
  const caza = useCaza();
  const ficha = fichas.find((f) => f.crea?.tipo === 'orden' && f.crea.accion === nodo.accion);
  // Con la lupa encendida el mismo toque acusa en vez de leer. Ver `ModoCaza`.
  const tocar = () => (caza?.activa ? caza.onMarcar(nodo.id) : onLeer(nodo.id));
  // El color va con la ficha y no clavado: un `sumar 1 a monedas` puesto tiene
  // que seguir siendo naranja dentro del lienzo, porque el idioma de color es
  // lo que deja ver de un vistazo que ahí dentro hay una cuenta.
  const clases = [
    'bloques3d-puesto',
    'es-orden',
    `es-${ficha?.categoria ?? 'movimiento'}`,
    corriendo ? 'es-corriendo' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={clases + claseCaza(caza, nodo.id)}>
      <button type="button" className="bloques3d-puesto-texto" onClick={tocar}>
        <TrozosEtiqueta texto={ficha?.etiqueta ?? nodo.accion} ovalo={ficha?.ovalo} />
        {/* La plaquita de velocidad, como la ranura de un bloque de Scratch: sólo
            aparece si el bloque la trae, así que las paradas 1–3 no cambian ni
            un píxel y el `100` del juego roto 2 salta a la vista. */}
        {nodo.pasos !== undefined && <span className="bloques3d-pasos">{nodo.pasos}</span>}
      </button>
      {!caza && <QuitarBloque nodoId={nodo.id} onQuitar={onQuitar} />}
    </div>
  );
}

/** El hueco hexagonal del `si`, vacío o con su pregunta dentro. */
function HuecoCondicion({
  nodo,
  respuesta,
  diana,
  rebotando,
  onSoltar,
  onTocar,
  onQuitar,
}: {
  nodo: Exclude<NodoCuerpo, NodoOrden>;
  respuesta: boolean | null;
  diana: boolean;
  rebotando: boolean;
  onSoltar: (zona: ZonaDestino, fichaId: string) => void;
  onTocar: (zona: ZonaDestino) => void;
  onQuitar: (nodoId: string) => void;
}) {
  const fichas = useFichas();
  const caza = useCaza();
  const zona: ZonaDestino = { clase: 'hueco', nodoId: nodo.id };
  const ficha = nodo.condicion
    ? fichas.find((f) => f.crea?.tipo === 'condicion' && f.crea.pregunta === nodo.condicion?.pregunta)
    : undefined;
  const clases = [
    'bloques3d-hueco',
    nodo.condicion ? 'es-lleno' : '',
    diana && !nodo.condicion ? 'es-diana' : '',
    rebotando ? 'es-rebote' : '',
  ]
    .filter(Boolean)
    .join(' ');
  // Acusar la pregunta es acusar el `si` entero: en el juego roto 3 lo que está
  // mal no es un hexágono suelto sino en qué C está metido cada uno.
  const marcarC = () => caza?.onMarcar(nodo.id);
  const etiqueta = <TrozosEtiqueta texto={ficha?.etiqueta ?? '¿?'} ovalo={ficha?.ovalo} />;
  return (
    <ZonaBloques className={clases} zona={zona} onSoltar={onSoltar}>
      {nodo.condicion ? (
        <span className={`bloques3d-condicion es-${ficha?.categoria ?? 'sensores'}`}>
          {caza?.activa ? (
            <button type="button" className="bloques3d-condicion-texto es-cazar" onClick={marcarC}>
              {etiqueta}
            </button>
          ) : (
            <span className="bloques3d-condicion-texto">{etiqueta}</span>
          )}
          {respuesta !== null && (
            <span className={`bloques3d-respuesta${respuesta ? ' es-si' : ' es-no'}`}>
              {respuesta ? 'SÍ' : 'NO'}
            </span>
          )}
          {!caza && <QuitarBloque nodoId={`cond:${nodo.id}`} onQuitar={onQuitar} />}
        </span>
      ) : (
        <PistaZona className="bloques3d-hueco-pista" zona={zona} texto="la pregunta" onTocar={onTocar} />
      )}
    </ZonaBloques>
  );
}

/** La boca de un bloque en C: donde vive lo que sólo pasa a veces. */
function BocaBloque({
  nodoId,
  clase,
  ordenes,
  activo,
  diana,
  rebotando,
  onSoltar,
  onTocar,
  onQuitar,
  onLeer,
}: {
  nodoId: string;
  clase: 'boca' | 'sino';
  ordenes: NodoOrden[];
  activo: string | null;
  diana: boolean;
  rebotando: boolean;
  onSoltar: (zona: ZonaDestino, fichaId: string) => void;
  onTocar: (zona: ZonaDestino) => void;
  onQuitar: (nodoId: string) => void;
  onLeer: (nodoId: string) => void;
}) {
  const caza = useCaza();
  const zona: ZonaDestino = { clase, nodoId };
  const clases = [
    'bloques3d-boca',
    ordenes.length === 0 ? 'es-vacia' : '',
    diana ? 'es-diana' : '',
    rebotando ? 'es-rebote' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <ZonaBloques className={clases} zona={zona} onSoltar={onSoltar}>
      {ordenes.map((o) => (
        <OrdenPuesta
          key={o.id}
          nodo={o}
          corriendo={activo === o.id}
          onQuitar={onQuitar}
          onLeer={onLeer}
        />
      ))}
      {/* La pista se queda SIEMPRE, como en el tronco y en el sombrero. Antes
          desaparecía en cuanto la boca tenía una orden, y entonces meter una
          segunda —que es justo lo que pide «suma dentro del si»— sólo se podía
          arrastrando: en tableta, imposible. */}
      {/* En modo reparación no hay paleta de la que soltar nada, así que la
          pista sobra: dejarla sería prometer un gesto que no existe. */}
      {!caza && (
        <PistaZona
          className="bloques3d-boca-pista"
          zona={zona}
          texto={ordenes.length === 0 ? 'suelta aquí la acción' : 'y aquí la siguiente'}
          onTocar={onTocar}
        />
      )}
    </ZonaBloques>
  );
}

/** Un `si` o un `si… si no…` ya colocado, con sus bocas y su hueco. */
function CondicionalPuesto({
  nodo,
  activo,
  respuesta,
  diana,
  rebote,
  onSoltar,
  onTocar,
  onQuitar,
  onLeer,
}: {
  nodo: Exclude<NodoCuerpo, NodoOrden>;
  activo: string | null;
  respuesta: boolean | null;
  /** Qué lleva el alumno en la mano ahora mismo, para pintar las dianas. */
  diana: CreaBloque;
  rebote: string | null;
  onSoltar: (zona: ZonaDestino, fichaId: string) => void;
  onTocar: (zona: ZonaDestino) => void;
  onQuitar: (nodoId: string) => void;
  onLeer: (nodoId: string) => void;
}) {
  const caza = useCaza();
  const encendido = activo === nodo.id;
  const tocar = () => (caza?.activa ? caza.onMarcar(nodo.id) : onLeer(nodo.id));
  return (
    <div
      className={`bloques3d-c es-control${encendido ? ' es-corriendo' : ''}${claseCaza(caza, nodo.id)}`}
    >
      <div className="bloques3d-c-arriba">
        <button type="button" className="bloques3d-c-palabra" onClick={tocar}>
          si
        </button>
        <HuecoCondicion
          nodo={nodo}
          respuesta={encendido ? respuesta : null}
          diana={admite('hueco', diana)}
          rebotando={rebote === `hueco:${nodo.id}`}
          onSoltar={onSoltar}
          onTocar={onTocar}
          onQuitar={onQuitar}
        />
        <span className="bloques3d-c-palabra es-fija">entonces</span>
        {!caza && <QuitarBloque nodoId={nodo.id} onQuitar={onQuitar} />}
      </div>
      <BocaBloque
        nodoId={nodo.id}
        clase="boca"
        ordenes={nodo.cuerpo}
        activo={activo}
        diana={admite('boca', diana)}
        rebotando={rebote === `boca:${nodo.id}`}
        onSoltar={onSoltar}
        onTocar={onTocar}
        onQuitar={onQuitar}
        onLeer={onLeer}
      />
      {nodo.tipo === 'sino' && (
        <>
          <div className="bloques3d-c-medio">si no</div>
          <BocaBloque
            nodoId={nodo.id}
            clase="sino"
            ordenes={nodo.sino}
            activo={activo}
            diana={admite('sino', diana)}
            rebotando={rebote === `sino:${nodo.id}`}
            onSoltar={onSoltar}
            onTocar={onTocar}
            onQuitar={onQuitar}
            onLeer={onLeer}
          />
        </>
      )}
      <div className="bloques3d-c-abajo" />
    </div>
  );
}

/* ── el diálogo de «Nueva variable» ────────────────────────────────────────── */

export interface EstadoNuevaVariable {
  abierto: boolean;
  borrador: string;
  /** Por qué no vale lo escrito, en la voz de Bit. `null` mientras nadie falla. */
  aviso: string | null;
}

/** Todo lo que el editor necesita saber de la cajita. El estado sigue fuera. */
export interface PanelVariable {
  estado: EstadoNuevaVariable;
  /** Cómo bautizó el alumno su cajita. `null` = todavía no hay ninguna. */
  nombre: string | null;
  onAbrir: () => void;
  onEscribir: (texto: string) => void;
  onCancelar: () => void;
  onCrear: () => void;
}

/**
 * El diálogo modal, con la pinta de un cuadro de diálogo de programa de verdad.
 *
 * El campo se enfoca con `ref` y no con `autoFocus` porque `autoFocus` es lo
 * que un lector de pantalla no anuncia y además está prohibido por el linter de
 * accesibilidad; aquí el foco es correcto porque el diálogo lo acaba de abrir
 * el alumno y no hay otra cosa que hacer dentro.
 *
 * `maxLength` deja escribir seis letras MÁS del máximo a propósito: si el campo
 * cortara justo en el límite, la lección de «no cabe de un vistazo» no podría
 * fallar nunca, y una regla que no se puede romper no se aprende.
 */
function DialogoNuevaVariable({
  estado,
  onEscribir,
  onCancelar,
  onCrear,
}: {
  estado: EstadoNuevaVariable;
  onEscribir: (texto: string) => void;
  onCancelar: () => void;
  onCrear: () => void;
}) {
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => {
    campo.current?.focus();
  }, []);
  const escribir = (e: ChangeEvent<HTMLInputElement>) => onEscribir(e.target.value);
  const teclear = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onCrear();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancelar();
    }
  };
  return (
    <div className="bloques3d-velo">
      <div
        className="bloques3d-dialogo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bloques3d-dialogo-titulo"
      >
        <div className="bloques3d-dialogo-barra" id="bloques3d-dialogo-titulo">
          Nueva variable
        </div>
        <div className="bloques3d-dialogo-cuerpo">
          <label className="bloques3d-dialogo-etiqueta" htmlFor="bloques3d-dialogo-nombre">
            ¿Qué va a guardar la cajita?
          </label>
          <input
            id="bloques3d-dialogo-nombre"
            ref={campo}
            className="bloques3d-dialogo-entrada"
            type="text"
            value={estado.borrador}
            placeholder="por ejemplo: monedas"
            maxLength={LARGO_MAXIMO_NOMBRE + 6}
            autoComplete="off"
            onChange={escribir}
            onKeyDown={teclear}
          />
          <p className={`bloques3d-dialogo-aviso${estado.aviso ? ' es-mal' : ''}`}>
            {estado.aviso ?? `Una palabra que lo diga. Hasta ${LARGO_MAXIMO_NOMBRE} letras.`}
          </p>
        </div>
        <div className="bloques3d-dialogo-pie">
          <button type="button" className="bloques3d-dialogo-boton" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            className="bloques3d-dialogo-boton es-aceptar"
            onClick={onCrear}
            disabled={estado.borrador.trim().length === 0}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── el diálogo de «¿con qué lo cambiamos?» (doc §25.4) ────────────────────── */

export interface OpcionArreglo {
  id: string;
  /** Lo que se lee en la tarjeta. Una frase entera, no una palabra suelta. */
  etiqueta: string;
  /** El renglón chico de debajo: qué pasaría si se elige esta. */
  pista: string;
}

/**
 * La tarjeta de reemplazo vive DENTRO del monitor y no como pieza del mueble.
 *
 * Podría haber sido un cajón físico con tres fichas, pero lo que se está
 * cambiando es una línea del programa: quien tiene que preguntar es el editor,
 * igual que un editor de verdad pregunta antes de reemplazar. Sacar la pregunta
 * a la mesa habría separado la decisión del sitio donde se ve su efecto.
 */
export interface PanelArreglo {
  abierto: boolean;
  /** La barra de título del diálogo: qué bloque se está cambiando. */
  titulo: string;
  /** La pregunta de Bit, arriba de las tarjetas. */
  pregunta: string;
  opciones: OpcionArreglo[];
  onElegir: (id: string) => void;
  onCancelar: () => void;
}

function DialogoArreglo({ titulo, pregunta, opciones, onElegir, onCancelar }: Omit<PanelArreglo, 'abierto'>) {
  const primera = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    primera.current?.focus();
  }, []);
  const teclear = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancelar();
    }
  };
  return (
    <div className="bloques3d-velo">
      {/* El `onKeyDown` va en el contenedor y no en cada tarjeta: Escape tiene
          que cerrar desde cualquier punto del diálogo, y las tarjetas ya son
          botones de verdad con su propio Enter. */}
      <div
        className="bloques3d-dialogo es-arreglo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bloques3d-arreglo-titulo"
        onKeyDown={teclear}
      >
        <div className="bloques3d-dialogo-barra" id="bloques3d-arreglo-titulo">
          {titulo}
        </div>
        <div className="bloques3d-dialogo-cuerpo">
          <p className="bloques3d-arreglo-pregunta">{pregunta}</p>
          <div className="bloques3d-arreglo-tarjetas">
            {opciones.map((o, i) => {
              const elegir = () => onElegir(o.id);
              return (
                <button
                  key={o.id}
                  ref={i === 0 ? primera : undefined}
                  type="button"
                  className="bloques3d-arreglo-tarjeta"
                  onClick={elegir}
                >
                  <span className="bloques3d-arreglo-etiqueta">{o.etiqueta}</span>
                  <span className="bloques3d-arreglo-pista">{o.pista}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="bloques3d-dialogo-pie">
          <button type="button" className="bloques3d-dialogo-boton" onClick={onCancelar}>
            Todavía no
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── el programa completo ──────────────────────────────────────────────────── */

export interface TecniaBloquesProps {
  /** Título del reto, en la cabecera del lienzo. */
  reto: string;
  fichas: FichaPaleta[];
  categoria: CategoriaBloque;
  /** Categoría donde está la pieza que hace falta ahora. */
  categoriaPedida: CategoriaBloque | null;
  programa: Programa;
  /** Bloque que se ilumina en ámbar mientras el intérprete lo ejecuta. */
  activo: string | null;
  /** Respuesta del `mira` en curso, para el chip SÍ/NO del hueco. */
  respuesta: boolean | null;
  corriendo: boolean;
  elegida: string | null;
  /** Zona que acaba de rechazar una pieza, como `hueco:n3`. */
  rebote: string | null;
  puntos: number;
  /**
   * La cajita del alumno. Opcional porque la parada 1 no tiene ninguna: sin
   * esto, ni el botón de `+ Nueva variable` ni el diálogo existen, y §25.1
   * sigue viéndose exactamente igual que antes.
   */
  variable?: PanelVariable;
  /**
   * Lo que dice la barra de título después de «proyecto:». Un programa de verdad
   * enseña ahí el archivo abierto, y en la parada 3 lo que está abierto ya no es
   * la vitrina sino el videojuego del alumno: dejarlo clavado sería la primera
   * mentira de un simulador que se sostiene justamente por parecer real.
   */
  archivo?: string;
  /**
   * El modo reparación de la parada 4. Opcional: sin él, el editor es
   * exactamente el de §25.1–§25.3 y no se entera de que esto existe.
   */
  caza?: ModoCaza;
  /** El diálogo de reemplazo, sólo mientras hay un bug acusado. */
  arreglo?: PanelArreglo;
  onCategoria: (categoria: CategoriaBloque) => void;
  onElegir: (fichaId: string) => void;
  onSoltar: (zona: ZonaDestino, fichaId: string) => void;
  /** La segunda vía: tocar el hueco cuando ya se tocó una ficha. */
  onTocar: (zona: ZonaDestino) => void;
  onQuitar: (nodoId: string) => void;
  onLeer: (nodoId: string) => void;
  onCorrer: () => void;
  onParar: () => void;
}

export function TecniaBloques({
  reto,
  fichas,
  categoria,
  categoriaPedida,
  programa,
  activo,
  respuesta,
  corriendo,
  elegida,
  rebote,
  puntos,
  variable,
  archivo = 'la vitrina',
  caza,
  arreglo,
  onCategoria,
  onElegir,
  onSoltar,
  onTocar,
  onQuitar,
  onLeer,
  onCorrer,
  onParar,
}: TecniaBloquesProps) {
  const visibles = fichas.filter((f) => f.categoria === categoria);
  // Se busca en las fichas que están en juego, no en el catálogo del módulo:
  // las piezas de la variable las acaba de fabricar el alumno y ahí no están.
  const enMano = elegida ? (fichas.find((f) => f.id === elegida)?.crea ?? null) : null;
  const zonaTronco: ZonaDestino = { clase: 'siempre', nodoId: '' };
  const clasesTronco = [
    'bloques3d-boca',
    'es-tronco',
    admite('siempre', enMano) ? 'es-diana' : '',
    rebote === 'siempre:' ? 'es-rebote' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const zonaInicio: ZonaDestino = { clase: 'inicio', nodoId: '' };
  const clasesInicio = [
    'bloques3d-boca',
    'es-inicio',
    programa.inicio?.length === 0 ? 'es-vacia' : '',
    admite('inicio', enMano) ? 'es-diana' : '',
    rebote === 'inicio:' ? 'es-rebote' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const sinCajita = variable !== undefined && variable.nombre === null;

  const editor = (
    <div className={`bloques3d-marco${caza ? ' es-caza' : ''}`}>
      <div className="bloques3d-barra">
        <span className="bloques3d-semaforo">
          <i className="es-rojo" />
          <i className="es-ambar" />
          <i className="es-verde" />
        </span>
        <span className="bloques3d-marca">Tecnia Bloques</span>
        <span className="bloques3d-archivo">{`proyecto: ${archivo}`}</span>
      </div>

      <div className="bloques3d-cuerpo">
        {/* En modo reparación las dos columnas de la izquierda no existen: aquí
            no se construye nada, y el taller se queda con los 588 px enteros
            para que los cuatro bloques del juego roto quepan sin rodar. */}
        {!caza && (
          <>
        <div className="bloques3d-categorias">
          {CATEGORIAS.map((c) => (
            <BotonCategoria
              key={c.id}
              categoria={c.id}
              nombre={c.nombre}
              activa={categoria === c.id}
              pide={categoriaPedida === c.id}
              onElegir={onCategoria}
            />
          ))}
        </div>

        <div className="bloques3d-paleta">
          {/* Como en un editor de verdad, el botón está SIEMPRE a la vista en su
              categoría: apagado cuando ya hay cajita, nunca desaparecido, para
              que el alumno vea de dónde salieron sus piezas. */}
          {variable && categoria === 'variables' && (
            <button
              type="button"
              className="bloques3d-nueva"
              onClick={variable.onAbrir}
              disabled={variable.nombre !== null}
              title={
                variable.nombre === null
                  ? 'Haz una cajita y ponle nombre'
                  : `Ya tienes la cajita «${variable.nombre}»: con una basta para este reto.`
              }
            >
              <span className="bloques3d-nueva-mas">+</span>
              Nueva variable
            </button>
          )}
          {visibles.length === 0 ? (
            <p className="bloques3d-paleta-vacia">
              {sinCajita && categoria === 'variables'
                ? 'Todavía no hay ninguna cajita. Haz una y aquí aparecen sus piezas.'
                : 'Aquí no hay piezas para este reto.'}
            </p>
          ) : (
            visibles.map((f) => (
              <FichaBloque
                key={f.id}
                ficha={f}
                elegida={elegida === f.id}
                puntos={puntos}
                onElegir={onElegir}
              />
            ))
          )}
        </div>
          </>
        )}

        <div className="bloques3d-taller">
          <div className="bloques3d-cabecera">
            {/* Los mandos ▶/⏹ se van en modo reparación: probar es tirar de la
                palanca del mueble. Dos maneras de hacer lo mismo, una en la
                pantalla y otra en la mesa, es exactamente la doble interfaz
                que aquí está prohibida. En su sitio queda el chip de estado,
                que informa sin mandar. */}
            {caza ? (
              <span className={`bloques3d-estado${corriendo ? ' es-corriendo' : ''}`}>
                {corriendo ? 'PROBANDO' : 'EN PAUSA'}
              </span>
            ) : (
              <>
                <button
                  type="button"
                  className="bloques3d-mando es-correr"
                  onClick={onCorrer}
                  disabled={corriendo}
                  aria-label="Correr el programa"
                >
                  ▶
                </button>
                <button
                  type="button"
                  className="bloques3d-mando es-parar"
                  onClick={onParar}
                  disabled={!corriendo}
                  aria-label="Parar el programa"
                >
                  ⏹
                </button>
              </>
            )}
            <span className="bloques3d-reto">{reto}</span>
          </div>

          <div className="bloques3d-lienzo">
            <div className="bloques3d-sombrero">▶ al empezar</div>
            {/* El escalón de arriba: pegado al sombrero y FUERA del `por
                siempre`. Que se vea que está fuera es media lección —lo de aquí
                pasa una vez; lo de abajo, en cada vuelta— y por eso no lleva ni
                el sangrado ni la pared de las bocas. */}
            {programa.inicio && (
              <ZonaBloques className={clasesInicio} zona={zonaInicio} onSoltar={onSoltar}>
                {programa.inicio.map((nodo) => (
                  <OrdenPuesta
                    key={nodo.id}
                    nodo={nodo}
                    corriendo={activo === nodo.id}
                    onQuitar={onQuitar}
                    onLeer={onLeer}
                  />
                ))}
                <PistaZona
                  className="bloques3d-boca-pista es-inicio"
                  zona={zonaInicio}
                  texto="una sola vez, al empezar"
                  onTocar={onTocar}
                />
              </ZonaBloques>
            )}
            <div className="bloques3d-c es-siempre">
              <div className="bloques3d-c-arriba">
                <span className="bloques3d-c-palabra es-fija">por siempre</span>
              </div>
              <ZonaBloques className={clasesTronco} zona={zonaTronco} onSoltar={onSoltar}>
                {programa.siempre.map((nodo) =>
                  nodo.tipo === 'orden' ? (
                    <OrdenPuesta
                      key={nodo.id}
                      nodo={nodo}
                      corriendo={activo === nodo.id}
                      onQuitar={onQuitar}
                      onLeer={onLeer}
                    />
                  ) : (
                    <CondicionalPuesto
                      key={nodo.id}
                      nodo={nodo}
                      activo={activo}
                      respuesta={respuesta}
                      diana={enMano}
                      rebote={rebote}
                      onSoltar={onSoltar}
                      onTocar={onTocar}
                      onQuitar={onQuitar}
                      onLeer={onLeer}
                    />
                  )
                )}
                {!caza && (
                  <PistaZona
                    className="bloques3d-boca-pista es-tronco"
                    zona={zonaTronco}
                    texto="suelta aquí"
                    onTocar={onTocar}
                  />
                )}
              </ZonaBloques>
              {/* La flecha curva es la marca verdadera del `por siempre`: es lo
                  único que lo distingue del `si` cuando los dos son C ámbar. */}
              <div className="bloques3d-c-abajo es-bucle">↺</div>
            </div>
          </div>
        </div>
      </div>

      {variable?.estado.abierto && (
        <DialogoNuevaVariable
          estado={variable.estado}
          onEscribir={variable.onEscribir}
          onCancelar={variable.onCancelar}
          onCrear={variable.onCrear}
        />
      )}

      {arreglo?.abierto && (
        <DialogoArreglo
          // La clave hace que el diálogo NAZCA de nuevo con cada bug, y con él
          // su `useEffect` de foco: sin esto, el segundo bug abriría el mismo
          // diálogo con el foco donde lo dejó el primero.
          key={arreglo.titulo}
          titulo={arreglo.titulo}
          pregunta={arreglo.pregunta}
          opciones={arreglo.opciones}
          onElegir={arreglo.onElegir}
          onCancelar={arreglo.onCancelar}
        />
      )}
    </div>
  );

  return (
    <ContextoFichas.Provider value={fichas}>
      <ContextoCaza.Provider value={caza ?? null}>{editor}</ContextoCaza.Provider>
    </ContextoFichas.Provider>
  );
}
