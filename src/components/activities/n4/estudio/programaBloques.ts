/**
 * El modelo y el intérprete de `Tecnia Bloques` · N4 · U3 (doc §25, §25.1 y §25.2).
 *
 * Este módulo es DELIBERADAMENTE puro: no importa React, ni three, ni el DOM.
 * El documento pide que «la ejecución es real: un intérprete propio recorre el
 * programa paso a paso y mueve al personaje de la vitrina», y un intérprete que
 * vive dentro de un `useEffect` no se puede comprobar —habría que creerle. Aquí
 * `simular()` recibe un programa y un mundo y devuelve la lista completa de
 * pasos ANTES de que se anime nada. El laboratorio sólo la reproduce con un
 * temporizador. Así, cada uno de los tres retos tiene una prueba de jest que
 * afirma qué pasa con la respuesta correcta y qué pasa con cada equivocación
 * que el documento promete que el alumno va a ver.
 *
 * ── EL TABLERO ──────────────────────────────────────────────────────────────
 * Ocho casillas en anillo, cuatro delante y cuatro detrás; el muñeco las recorre
 * siempre en el mismo sentido. La pared cierra el canto derecho de la casilla 2,
 * así que «tocando la pared» quiere decir «estoy parado en la 2 y la pared está
 * levantada».
 *
 *   fila delantera  0 → 1 → 2 ▮ 3
 *   fila trasera    7 ← 6 ← 5 ← 4
 *
 * ── POR QUÉ EL RUMBO SE ACUMULA ─────────────────────────────────────────────
 * `rumboTrasSalir` suma y nunca envuelve a [0, 2π). Es la misma disciplina del
 * gato de N3·U4: si el ángulo se normalizara, al cerrar la vuelta el muñeco
 * daría un latigazo de 350° en sentido contrario, y el alumno leería un giro que
 * el programa no ordenó.
 *
 * ── LO QUE AÑADE LA PARADA 2, «Variables y puntajes» (§25.2) ────────────────
 * El mismo tablero y el mismo muñeco, más el marcador. Tres cosas nuevas:
 *
 *   1. LA ZONA DE ARRANQUE. `Programa.inicio` son las órdenes que van pegadas
 *      al sombrero, FUERA del `por siempre`, y corren una sola vez. Sin esa
 *      zona el reto 1 no se podría ni plantear: «poner puntos a 0 al empezar»
 *      y «poner puntos a 0 en cada vuelta» serían el mismo programa.
 *   2. LAS PIEZAS DE VARIABLE. `poner-cero`, `sumar` y `mostrar` como órdenes,
 *      y `puntos-igual-meta` como pregunta —el óvalo naranja metido dentro del
 *      hexágono verde—. La variable es una sola y se llama como el alumno la
 *      bautizó; su nombre vive en la interfaz, no aquí, porque el intérprete no
 *      necesita saberlo para contar.
 *   3. `Ajustes`, que describe el escenario en vez de codificarlo. Los valores
 *      por omisión son EXACTAMENTE la parada 1, así que sus doce pruebas siguen
 *      pasando sin tocarlas.
 *
 * Tres decisiones que se tomaron leyendo el documento y no de memoria:
 *
 *   · `mostrar` es quien termina la partida con `fin: 'gana'`, NO la condición
 *     al salir verdadera. El documento arma el reto 3 como «si ¿puntos = 5?
 *     entonces mostrar ¡GANASTE!»; si ganara la pregunta, el cuerpo de la C no
 *     llegaría a correr nunca y el `si` dejaría de significar lo que significa.
 *   · `mostrar` enciende el letrero SIEMPRE, valga lo que valga el marcador. El
 *     intérprete es fiel a lo que dicen los bloques; juzgar si el reto está bien
 *     resuelto es cosa del laboratorio. Así, el alumno que deja el `mostrar`
 *     fuera de la C ve el ¡GANASTE! encenderse con cero puntos, que es
 *     justamente el error hecho visible.
 *   · Quedarse sin monedas ya no termina la partida (`finAlQuedarseSinMonedas`).
 *     En la parada 1 recoger la última era ganar; aquí el escenario tiene
 *     exactamente cinco monedas y la meta es cinco, así que cortar al recoger la
 *     quinta mataría la ejecución un bloque antes del ¡GANASTE!.
 *
 * El cupo de `LIMITE_ORDENES` lo gastan sólo las acciones de tablero —avanzar,
 * saltar, recoger—, porque lo que acota son «tres vueltas al tablero». Sumar o
 * poner en cero no mueven a nadie y no deberían acercar la ejecución a su tope.
 */

export const TOTAL_CASILLAS = 8;

/** Casilla desde la que se toca la pared. La pared cierra su canto derecho. */
export const CASILLA_PARED = 2;

/** Tope de órdenes de una ejecución: tres vueltas al tablero. */
export const LIMITE_ORDENES = 24;

/**
 * Tope de repeticiones del `por siempre`. Es una red de seguridad, no una regla
 * del juego: un `por siempre` cuyo cuerpo se quedó sin ninguna orden no gastaría
 * ni una del cupo de arriba y giraría para siempre.
 */
const LIMITE_VUELTAS = 60;

/** Cuántos «se agacha en el vacío» seguidos se dejan ver antes de parar. */
const LIMITE_VACIOS = 2;

/** Cuánto gira el muñeco AL SALIR de cada casilla, en radianes. */
const GIRO_AL_SALIR = [Math.PI / 2, 0, 0, Math.PI / 2, Math.PI / 2, 0, 0, Math.PI / 2];

/** Rumbo acumulado tras dejar `desde`. El muñeco arranca mirando a la cámara. */
export function rumboTrasSalir(rumbo: number, desde: number): number {
  return rumbo + GIRO_AL_SALIR[desde % TOTAL_CASILLAS];
}

export function siguienteCasilla(casilla: number): number {
  return (casilla + 1) % TOTAL_CASILLAS;
}

/* ── el programa ───────────────────────────────────────────────────────────── */

/**
 * Las tres primeras mueven al muñeco por el tablero y gastan cupo de órdenes;
 * las tres siguientes son las piezas de variable de §25.2 y no mueven a nadie.
 * Las siete últimas son las de la parada 3 (§25.3) y sólo significan algo para
 * `motorJuego.ts`; aquí dentro no hacen nada, y eso está comprobado.
 *
 * Nada de números en las etiquetas: `mover a la derecha`, no `mover 10 pasos`.
 * Los pasos son unidad de Scratch y en el campo de juego el suelo es continuo.
 */
export type Accion =
  | 'avanzar'
  | 'saltar'
  | 'recoger'
  | 'poner-cero'
  | 'sumar'
  | 'mostrar'
  | 'mover-derecha'
  | 'mover-izquierda'
  | 'mover-arriba'
  | 'mover-abajo'
  | 'esconder-moneda'
  | 'volver-inicio'
  | 'detener-juego';

export type Pregunta =
  | 'tocando-moneda'
  | 'tocando-pared'
  | 'puntos-igual-meta'
  | 'flecha-derecha'
  | 'flecha-izquierda'
  | 'flecha-arriba'
  | 'flecha-abajo'
  | 'tocando-enemigo';

export interface Condicion {
  id: string;
  pregunta: Pregunta;
}

export interface NodoOrden {
  tipo: 'orden';
  id: string;
  accion: Accion;
  /**
   * Cuánto se mueve una orden de movimiento, en pasos de Scratch. SÓLO lo usa la
   * parada 4 (§25.4), donde el segundo juego roto trae un `mover a la derecha`
   * con 100 pasos y el bug se caza mirando esa plaquita. `10` es la velocidad
   * normal, la de las paradas 1–3, y por eso el campo es opcional: sin él, todo
   * lo ya construido sigue significando exactamente lo mismo.
   *
   * `simular()` lo ignora a propósito. Este tablero es de casillas, no de suelo
   * continuo: aquí «100 pasos» no querría decir nada. Quien lo lee es
   * `motorJuego.ts`, que sí mueve al muñeco por un campo continuo.
   */
  pasos?: number;
}

export interface NodoSi {
  tipo: 'si';
  id: string;
  condicion: Condicion | null;
  cuerpo: NodoOrden[];
}

export interface NodoSiNo {
  tipo: 'sino';
  id: string;
  condicion: Condicion | null;
  cuerpo: NodoOrden[];
  sino: NodoOrden[];
}

export type NodoCuerpo = NodoOrden | NodoSi | NodoSiNo;

export interface Programa {
  /**
   * Las órdenes pegadas al sombrero, por FUERA del `por siempre`: corren una
   * sola vez y en orden, antes de que empiece la primera vuelta. La parada 1 no
   * la usa y por eso es opcional.
   */
  inicio?: NodoOrden[];
  /** El cuerpo del `por siempre`, que se repite hasta que algo lo detiene. */
  siempre: NodoCuerpo[];
}

/* ── el escenario ──────────────────────────────────────────────────────────── */

/**
 * Lo que cambia de una parada a la otra. Existe para no tener dos intérpretes
 * casi iguales: el de §25.1 es este mismo con `AJUSTES_POR_DEFECTO`.
 */
export interface Ajustes {
  /**
   * Con cuánto arranca el marcador. Cero cuando el escenario está limpio; en el
   * reto 1 de §25.2 vale lo que quedó «de la partida anterior», que es lo que
   * hace visible el olvido de poner la variable en cero.
   */
  puntosIniciales: number;
  /**
   * Si recoger una moneda suma solo. En la parada 1 sí —contar era cosa del
   * juego—; en la 2 no, porque poner el `sumar 1` donde toca ES el ejercicio.
   */
  sumaAlRecoger: boolean;
  /** El número por el que pregunta el hexágono `¿puntos = N?`. */
  metaPuntos: number;
  /** Si recoger la última moneda termina la partida. Ver el docblock de arriba. */
  finAlQuedarseSinMonedas: boolean;
}

/** La parada 1 exacta: así sus pruebas no se enteran de que esto creció. */
export const AJUSTES_POR_DEFECTO: Ajustes = {
  puntosIniciales: 0,
  sumaAlRecoger: true,
  metaPuntos: 5,
  finAlQuedarseSinMonedas: true,
};

/* ── el mundo ──────────────────────────────────────────────────────────────── */

export interface MundoBloques {
  casilla: number;
  rumbo: number;
  monedas: number[];
  paredArriba: boolean;
  puntos: number;
}

export type Efecto =
  | { tipo: 'mira'; pregunta: Pregunta; respuesta: boolean }
  | { tipo: 'avanza'; desde: number; hacia: number }
  | { tipo: 'salta'; desde: number; hacia: number }
  | { tipo: 'choca'; en: number }
  | { tipo: 'recoge'; en: number }
  | { tipo: 'vacio'; en: number }
  // Los tres de la variable llevan `valor` —el marcador DESPUÉS del cambio—
  // aunque el paso ya traiga `puntos`: el tablero necesita saber qué dígito
  // voltear, y leerlo del efecto evita compararlo con el paso anterior.
  | { tipo: 'pone'; valor: number }
  | { tipo: 'suma'; valor: number }
  | { tipo: 'gana'; valor: number };

/** Una foto del mundo justo DESPUÉS de que el bloque `nodoId` hiciera lo suyo. */
export interface PasoEjecucion {
  nodoId: string;
  efecto: Efecto;
  casilla: number;
  rumbo: number;
  monedas: number[];
  puntos: number;
}

export type FinEjecucion = 'monedas' | 'choque' | 'vacio' | 'limite' | 'gana';

export interface Ejecucion {
  pasos: PasoEjecucion[];
  fin: FinEjecucion;
  /** Se dejó atrás la casilla de la pared sin estrellarse. */
  paredSuperada: boolean;
  /** Cuántas veces se agachó donde no había nada. */
  vacios: number;
  /** Acciones de tablero gastadas: las que cuentan para `LIMITE_ORDENES`. */
  ordenes: number;
  /** Con cuánto se quedó el marcador. */
  puntos: number;
  /** El valor más alto que llegó a marcar, para cazar al marcador desbocado. */
  puntosMaximos: number;
}

/* ── el intérprete ─────────────────────────────────────────────────────────── */

function responder(pregunta: Pregunta, mundo: MundoBloques, ajustes: Ajustes): boolean {
  if (pregunta === 'tocando-moneda') return mundo.monedas.includes(mundo.casilla);
  if (pregunta === 'puntos-igual-meta') return mundo.puntos === ajustes.metaPuntos;
  if (pregunta === 'tocando-pared') return mundo.casilla === CASILLA_PARED && mundo.paredArriba;
  // Las preguntas de la parada 3 —las flechas y el enemigo— no existen en este
  // tablero. Antes esta línea era un `return` de pared sin nombrar, y cualquier
  // pregunta nueva se habría leído como «tocando la pared» sin que nada chillara.
  return false;
}

/**
 * Recorre el programa y devuelve la película entera de lo que va a pasar.
 *
 * El corte por `choca` es inmediato y a propósito: chocarse es el final de la
 * historia que el video cuenta en sus primeras frases, y dejar que el muñeco
 * siguiera empujando la pared convertiría un error legible en ruido.
 */
export function simular(
  programa: Programa,
  inicio: Omit<MundoBloques, 'puntos'>,
  ajustes: Ajustes = AJUSTES_POR_DEFECTO,
): Ejecucion {
  const mundo: MundoBloques = {
    ...inicio,
    monedas: [...inicio.monedas],
    puntos: ajustes.puntosIniciales,
  };
  const pasos: PasoEjecucion[] = [];
  let ordenes = 0;
  // Distinto de `ordenes`: aquí entra TODO lo que se ejecutó, también sumar y
  // poner en cero. Sólo sirve para detectar la vuelta estéril, la del cuerpo
  // que no hace absolutamente nada y giraría hasta el tope sin contar nada.
  let acciones = 0;
  let vacios = 0;
  let paredSuperada = false;
  let puntosMaximos = mundo.puntos;
  let fin: FinEjecucion = 'limite';
  let parar = false;

  const anotar = (nodoId: string, efecto: Efecto) => {
    pasos.push({
      nodoId,
      efecto,
      casilla: mundo.casilla,
      rumbo: mundo.rumbo,
      monedas: [...mundo.monedas],
      puntos: mundo.puntos,
    });
  };

  const ejecutarOrden = (nodo: NodoOrden) => {
    const desde = mundo.casilla;

    if (nodo.accion === 'avanzar') {
      if (desde === CASILLA_PARED && mundo.paredArriba) {
        anotar(nodo.id, { tipo: 'choca', en: desde });
        fin = 'choque';
        parar = true;
        return;
      }
      mundo.rumbo = rumboTrasSalir(mundo.rumbo, desde);
      mundo.casilla = siguienteCasilla(desde);
      if (desde === CASILLA_PARED) paredSuperada = true;
      anotar(nodo.id, { tipo: 'avanza', desde, hacia: mundo.casilla });
    } else if (nodo.accion === 'saltar') {
      // El salto pasa por encima de la pared: es justo lo que el reto 2 enseña.
      mundo.rumbo = rumboTrasSalir(mundo.rumbo, desde);
      mundo.casilla = siguienteCasilla(desde);
      if (desde === CASILLA_PARED) paredSuperada = true;
      anotar(nodo.id, { tipo: 'salta', desde, hacia: mundo.casilla });
    } else if (nodo.accion === 'recoger') {
      const i = mundo.monedas.indexOf(desde);
      if (i === -1) {
        vacios += 1;
        anotar(nodo.id, { tipo: 'vacio', en: desde });
        if (vacios >= LIMITE_VACIOS) {
          fin = 'vacio';
          parar = true;
          return;
        }
      } else {
        mundo.monedas.splice(i, 1);
        if (ajustes.sumaAlRecoger) {
          mundo.puntos += 1;
          puntosMaximos = Math.max(puntosMaximos, mundo.puntos);
        }
        anotar(nodo.id, { tipo: 'recoge', en: desde });
        if (ajustes.finAlQuedarseSinMonedas && mundo.monedas.length === 0) {
          fin = 'monedas';
          parar = true;
          return;
        }
      }
    } else if (nodo.accion === 'poner-cero') {
      mundo.puntos = 0;
      acciones += 1;
      anotar(nodo.id, { tipo: 'pone', valor: 0 });
      return;
    } else if (nodo.accion === 'sumar') {
      mundo.puntos += 1;
      puntosMaximos = Math.max(puntosMaximos, mundo.puntos);
      acciones += 1;
      anotar(nodo.id, { tipo: 'suma', valor: mundo.puntos });
      return;
    } else if (nodo.accion === 'mostrar') {
      // `mostrar` enciende el letrero diga lo que diga el marcador, y ahí se
      // acaba la partida. Si el alumno lo dejó fuera de la C, el ¡GANASTE! se
      // enciende en la primera vuelta con el marcador en cero: el laboratorio
      // compara `puntos` con la meta y le enseña por qué eso no vale.
      acciones += 1;
      anotar(nodo.id, { tipo: 'gana', valor: mundo.puntos });
      fin = 'gana';
      parar = true;
      return;
    } else {
      // Las piezas de la parada 3 —moverse con las flechas, esconder la moneda,
      // volver al inicio, detener el juego— viven en `motorJuego.ts`, que corre
      // por pulsos y con teclas. Aquí no hacen nada y ni siquiera gastan cupo.
      // Este `else` explícito es el que impide que `mostrar` se coma lo que no
      // reconoce: hasta la parada 2 era la rama de descarte y habría encendido
      // el ¡GANASTE! con un `mover a la derecha`.
      return;
    }

    // Aquí abajo sólo llegan avanzar, saltar y recoger: las tres piezas de
    // variable salen antes con su propio `return`. Es a propósito —lo que acota
    // `LIMITE_ORDENES` son «tres vueltas al tablero», y sumar o poner en cero no
    // mueven a nadie, así que no deberían acercar la corrida a su tope.
    ordenes += 1;
    acciones += 1;
    if (ordenes >= LIMITE_ORDENES) {
      fin = 'limite';
      parar = true;
    }
  };

  const ejecutarLista = (lista: NodoCuerpo[]) => {
    for (const nodo of lista) {
      if (parar) return;
      if (nodo.tipo === 'orden') {
        ejecutarOrden(nodo);
        continue;
      }
      // Un `si` sin pregunta no decide nada: no se hace ni la rama del sí ni la
      // del no. El bloque se ilumina igual para que se vea que le falta algo.
      if (!nodo.condicion) {
        anotar(nodo.id, { tipo: 'mira', pregunta: 'tocando-moneda', respuesta: false });
        continue;
      }
      const respuesta = responder(nodo.condicion.pregunta, mundo, ajustes);
      anotar(nodo.id, { tipo: 'mira', pregunta: nodo.condicion.pregunta, respuesta });
      if (respuesta) ejecutarLista(nodo.cuerpo);
      else if (nodo.tipo === 'sino') ejecutarLista(nodo.sino);
    }
  };

  // El arranque, una sola vez y antes de la primera vuelta.
  if (programa.inicio) ejecutarLista(programa.inicio);

  for (let vuelta = 0; vuelta < LIMITE_VUELTAS && !parar; vuelta += 1) {
    const antes = acciones;
    ejecutarLista(programa.siempre);
    // Una vuelta entera sin hacer absolutamente nada: el cuerpo está vacío o
    // sólo tiene preguntas que no llevan a ninguna acción.
    if (!parar && acciones === antes) break;
  }

  return {
    pasos,
    fin,
    paredSuperada,
    vacios,
    ordenes,
    puntos: mundo.puntos,
    puntosMaximos,
  };
}

/* ── utilidades de edición del árbol ───────────────────────────────────────── */

/** Devuelve todos los nodos del programa, aplanados, para buscar por id. */
export function nodosDe(programa: Programa): NodoCuerpo[] {
  const salida: NodoCuerpo[] = [...(programa.inicio ?? [])];
  for (const nodo of programa.siempre) {
    salida.push(nodo);
    if (nodo.tipo === 'si' || nodo.tipo === 'sino') salida.push(...nodo.cuerpo);
    if (nodo.tipo === 'sino') salida.push(...nodo.sino);
  }
  return salida;
}

/** Cuenta las órdenes que hay dentro de las bocas de los bloques en C. */
export function ordenesDentroDeC(programa: Programa): NodoOrden[] {
  const salida: NodoOrden[] = [];
  for (const nodo of programa.siempre) {
    if (nodo.tipo === 'si' || nodo.tipo === 'sino') salida.push(...nodo.cuerpo);
    if (nodo.tipo === 'sino') salida.push(...nodo.sino);
  }
  return salida;
}

/** Dónde quedó colgada una pieza. Los tres retos de §25.2 se juzgan con esto. */
export type Zona = 'inicio' | 'siempre' | 'dentro-de-c';

export interface Ubicacion {
  nodo: NodoOrden;
  zona: Zona;
  /** La pregunta de la C que la abraza, o `null` si no está dentro de ninguna. */
  condicion: Pregunta | null;
}

/**
 * Todas las veces que una acción aparece en el programa, y dónde.
 *
 * Es lo que separa «el programa hace lo correcto» de «el programa está bien
 * armado», que en esta parada no son lo mismo: un `sumar 1` fuera de la C llega
 * igual a cinco puntos, sólo que contando monedas que nadie recogió. Sin mirar
 * la forma del programa, el laboratorio daría por bueno el error que §25.2 pide
 * cazar.
 */
export function ubicarAccion(programa: Programa, accion: Accion): Ubicacion[] {
  const salida: Ubicacion[] = [];

  for (const nodo of programa.inicio ?? []) {
    if (nodo.accion === accion) salida.push({ nodo, zona: 'inicio', condicion: null });
  }

  for (const nodo of programa.siempre) {
    if (nodo.tipo === 'orden') {
      if (nodo.accion === accion) salida.push({ nodo, zona: 'siempre', condicion: null });
      continue;
    }
    const condicion = nodo.condicion?.pregunta ?? null;
    const dentro = nodo.tipo === 'sino' ? [...nodo.cuerpo, ...nodo.sino] : nodo.cuerpo;
    for (const hijo of dentro) {
      if (hijo.accion === accion) salida.push({ nodo: hijo, zona: 'dentro-de-c', condicion });
    }
  }

  return salida;
}

/* ── el bautizo de la variable ─────────────────────────────────────────────── */

/**
 * El nombre de la variable no lo pone el programa: lo escribe el alumno en el
 * diálogo «Nueva variable» antes de que aparezca ni una pieza naranja. Por eso
 * la revisión vive aquí y no en el componente: es la única regla de esta parada
 * que se puede equivocar sin que se mueva nadie en el tablero, y una regla que
 * no se puede probar es una regla que nadie sabe si se cumple.
 *
 * Lo que rechaza no es capricho de programador: son las tres frases del video,
 * en el mismo orden en que las cuenta.
 *
 *   · «Equis no dice nada»       → una inicial no es un nombre.
 *   · «No cabe de un vistazo»    → el tablero es pequeño y hay que leerlo jugando.
 *   · «Ponle puntos»             → un nombre que dice QUÉ cuenta.
 *
 * Rechaza en vez de sólo avisar, y con el porqué escrito. Scratch de verdad
 * acepta cualquier cosa, pero en Scratch nadie está aprendiendo a nombrar: aquí
 * el bautizo ES el ejercicio, y un aviso que se puede ignorar no enseña nada.
 */

/** Lo más largo que cabe en la etiqueta de la cajita sin partirse en el tablero. */
export const LARGO_MAXIMO_NOMBRE = 12;

/** Lo más corto que alcanza a decir algo. Por debajo de esto es una inicial. */
const LARGO_MINIMO_NOMBRE = 3;

/**
 * Nombres bien escritos que aun así no dicen nada. Son los que salen solos
 * cuando alguien no sabe qué poner, y llamarle `variable` a la variable es la
 * misma equis del video con más letras.
 */
const NOMBRES_VACIOS = ['equis', 'variable', 'cosa', 'dato', 'algo', 'numero', 'número'];

const SOLO_LETRAS = /^[a-záéíóúüñ ]+$/i;

export interface RevisionNombre {
  ok: boolean;
  /** Por qué no vale, en la voz de Bit. `null` cuando el nombre pasa. */
  aviso: string | null;
}

/** El nombre tal y como se guarda: sin sobrantes a los lados ni dobles espacios. */
export function limpiarNombre(nombre: string): string {
  return nombre.trim().replace(/\s+/g, ' ');
}

/** ¿Sirve este nombre para bautizar la variable? */
export function revisarNombre(nombre: string): RevisionNombre {
  const limpio = limpiarNombre(nombre);

  if (limpio.length === 0) {
    return { ok: false, aviso: 'La cajita necesita etiqueta. Escribe qué va a guardar.' };
  }
  if (!SOLO_LETRAS.test(limpio)) {
    return { ok: false, aviso: 'Sólo letras: el número va DENTRO de la cajita, no en la etiqueta.' };
  }
  if (limpio.length < LARGO_MINIMO_NOMBRE) {
    return { ok: false, aviso: 'Muy corto. Equis no dice nada: escribe qué guarda la cajita.' };
  }
  if (limpio.length > LARGO_MAXIMO_NOMBRE) {
    return {
      ok: false,
      aviso: `No cabe de un vistazo en el tablero. Máximo ${LARGO_MAXIMO_NOMBRE} letras.`,
    };
  }
  if (NOMBRES_VACIOS.includes(limpio.toLowerCase())) {
    return { ok: false, aviso: `«${limpio}» no dice qué guarda. Ponle el nombre de la cuenta.` };
  }

  return { ok: true, aviso: null };
}
