/**
 * El motor del videojuego · N4 · U3 · parada 3 (doc §25.3).
 *
 * Hermano de `programaBloques.ts` y, como él, DELIBERADAMENTE puro: ni React, ni
 * three, ni DOM. Pero no es su continuación: son dos motores para dos cosas
 * distintas y por eso `simular()` se queda entero e intacto donde estaba.
 *
 * ── POR QUÉ NO SIRVE `simular()` ────────────────────────────────────────────
 * `simular()` calcula la película COMPLETA antes de que se mueva nadie, y eso es
 * justo lo que un videojuego no puede hacer: la película depende de lo que el
 * niño apriete dentro de tres segundos, y eso no está escrito en ninguna parte
 * todavía. Aquí la unidad no es la ejecución entera sino el PULSO: `paso()`
 * recorre el cuerpo del `por siempre` UNA sola vez, con las teclas que están
 * apretadas en ese instante, y devuelve el mundo siguiente. El laboratorio lo
 * llama cada `MS_POR_PULSO` milisegundos; el niño ve el resultado antes de
 * soltar la flecha. Es la diferencia entre ver una grabación y jugar.
 *
 * ── EL CAMPO ────────────────────────────────────────────────────────────────
 * Nueve casillas de ancho por seis de alto. Las coordenadas son CONTINUAS y se
 * miden en casillas: el centro de la casilla de abajo a la izquierda es (0.5,
 * 0.5) y el de la de arriba a la derecha es (8.5, 5.5). Continuas y no
 * discretas porque un juego a saltos de casilla no se siente juego; el suelo
 * cuadriculado es dibujo, no rejilla de movimiento.
 *
 *     y=5.5  ·  ·  ·  ·  ●  ·  ·  ·  ·
 *     y=4.5  ●  ·  ·  ·  ·  ·  ·  ·  ●
 *     y=3.5  ·  ·  ·  ·  ·  ·  ·  ·  ·
 *     y=2.5  ·  ←────── enemigo ──────→ ·
 *     y=1.5  ·  ·  ·  ·  ·  ·  ·  ●  ·
 *     y=0.5  ▲  ·  ·  ●  ·  ·  ·  ·  ·      ▲ salida   ● moneda
 *
 * Las cinco monedas están puestas a mano y no al azar: una regalada en la fila
 * de salida, otra a un lado antes de la línea del enemigo y TRES al otro lado.
 * Con eso la regla tres deja de ser teoría —para ganar hay que cruzar por
 * delante del enemigo tres veces— sin que haga falta obligar a nadie.
 *
 * ── LO QUE EL MOTOR NO HACE ─────────────────────────────────────────────────
 * No juzga. Si el programa suma sin esconder la moneda, el marcador se dispara
 * y aquí no salta ninguna alarma: el motor es fiel a los bloques que hay
 * puestos, y decidir si el reto está bien resuelto es cosa del laboratorio, que
 * para eso mira la forma del programa con las utilidades del final. Es la misma
 * disciplina de §25.2 y por el mismo motivo: si el motor «arreglara» el olvido,
 * el error que el video promete enseñar no se vería nunca.
 *
 * Tampoco termina la partida al llegar a la meta. Los puntos pueden llegar a
 * cinco y el juego sigue corriendo tan tranquilo, porque quien lo detiene es el
 * bloque `detener el juego` de la regla cuatro. Si el motor cortara solo, la
 * regla cuatro no haría falta y el niño la armaría sin entender para qué.
 *
 * Y que el enemigo te atrape NO te quita puntos: te devuelve a la salida y ya.
 * Lo dice §25.3 con todas sus letras —perderlos convertiría un cierre en un
 * castigo—. Lo que cuesta es el camino, que es bastante.
 */

import type { NodoCuerpo, NodoOrden, Pregunta, Programa } from './programaBloques';

/* ── medidas del campo ─────────────────────────────────────────────────────── */

export const ANCHO_CAMPO = 9;
export const ALTO_CAMPO = 6;

/** El centro de casilla más bajo y más a la izquierda, y su simétrico. */
export const BORDE_MIN = 0.5;
export const BORDE_MAX_X = ANCHO_CAMPO - 0.5;
export const BORDE_MAX_Y = ALTO_CAMPO - 0.5;

/** Dónde nace el muñeco y adónde lo devuelve el enemigo. */
export const SALIDA = { x: BORDE_MIN, y: BORDE_MIN } as const;

/**
 * Cada cuánto late el juego. Sale de que a dieciséis pulsos por segundo el
 * muñeco cruza el campo entero en unos tres segundos: rápido para que responda
 * y lento para que se vea a quién obedece.
 */
export const MS_POR_PULSO = 60;

/** Lo que avanza el muñeco en un pulso, en casillas. */
export const PASO_MUNECO = 0.18;

/**
 * La plaquita de velocidad «normal» de un bloque de movimiento. Un
 * `mover a la derecha` sin plaquita vale exactamente esto, así que las paradas
 * 1–3 se mueven igual que siempre; la parada 4 (§25.4) es la única que pone
 * otros números, y el juego roto número dos trae un 100 ahí dentro.
 */
export const PASOS_NORMALES = 10;

/** «A media velocidad» del doc, tomado al pie de la letra: la mitad del muñeco. */
export const PASO_ENEMIGO = PASO_MUNECO / 2;

/** Hasta dónde patrulla el enemigo, de lado a lado por el centro del campo. */
export const ENEMIGO_Y = 2.5;
export const ENEMIGO_MIN_X = 1.5;
export const ENEMIGO_MAX_X = 7.5;

/** Cuánto hay que acercarse para estar «tocando». */
export const RADIO_MONEDA = 0.45;
export const RADIO_ENEMIGO = 0.55;

/** Los puntos que piden el letrero. Son las cinco monedas del campo. */
export const META_PUNTOS = 5;

export interface MonedaJuego {
  id: number;
  x: number;
  y: number;
  /** Una moneda escondida sigue en la lista: el laboratorio cuenta cuántas van. */
  visible: boolean;
}

/** Las cinco, a mano. Ver el mapa del docblock. */
export const MONEDAS_INICIALES: readonly MonedaJuego[] = [
  { id: 0, x: 3.5, y: 0.5, visible: true },
  { id: 1, x: 7.5, y: 1.5, visible: true },
  { id: 2, x: 0.5, y: 4.5, visible: true },
  { id: 3, x: 4.5, y: 5.5, visible: true },
  { id: 4, x: 8.5, y: 4.5, visible: true },
];

/* ── el mundo ──────────────────────────────────────────────────────────────── */

export type Tecla = 'derecha' | 'izquierda' | 'arriba' | 'abajo';

export interface MundoJuego {
  jugador: { x: number; y: number; mirando: Tecla };
  monedas: MonedaJuego[];
  enemigo: { x: number; y: number; sentido: 1 | -1 };
  puntos: number;
  /** El ¡GANASTE! del marco, encendido por el bloque `mostrar`. */
  letrero: boolean;
  /** La partida se paró. Sólo lo enciende el bloque `detener el juego`. */
  detenido: boolean;
  /** Cuántas veces te atrapó el enemigo. No cuesta puntos, cuesta camino. */
  capturas: number;
  /** Hacia dónde se movió de verdad el muñeco, acumulado. Cierra la regla uno. */
  movio: Record<Tecla, boolean>;
}

export function mundoInicial(): MundoJuego {
  return {
    jugador: { x: SALIDA.x, y: SALIDA.y, mirando: 'derecha' },
    monedas: MONEDAS_INICIALES.map((m) => ({ ...m })),
    enemigo: { x: 4.5, y: ENEMIGO_Y, sentido: 1 },
    puntos: 0,
    letrero: false,
    detenido: false,
    capturas: 0,
    movio: { derecha: false, izquierda: false, arriba: false, abajo: false },
  };
}

export type EventoJuego =
  | { tipo: 'mueve'; hacia: Tecla }
  | { tipo: 'topa'; contra: Tecla }
  | { tipo: 'suma'; valor: number }
  | { tipo: 'pone'; valor: number }
  | { tipo: 'esconde'; moneda: number }
  | { tipo: 'esconde-vacio' }
  | { tipo: 'vuelve' }
  | { tipo: 'letrero'; valor: number }
  | { tipo: 'detiene' }
  | { tipo: 'atrapa' };

export interface ResultadoPaso {
  mundo: MundoJuego;
  /** Todo lo que pasó en este pulso, en orden. El laboratorio los oye y suena. */
  eventos: EventoJuego[];
}

/* ── el intérprete de un pulso ─────────────────────────────────────────────── */

function distancia(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

/** La moneda visible que el muñeco está tocando, o `null`. La más cercana. */
export function monedaTocada(mundo: MundoJuego): MonedaJuego | null {
  let elegida: MonedaJuego | null = null;
  let mejor = RADIO_MONEDA;
  for (const moneda of mundo.monedas) {
    if (!moneda.visible) continue;
    const d = distancia(mundo.jugador.x, mundo.jugador.y, moneda.x, moneda.y);
    if (d <= mejor) {
      mejor = d;
      elegida = moneda;
    }
  }
  return elegida;
}

export function tocandoEnemigo(mundo: MundoJuego): boolean {
  const { jugador, enemigo } = mundo;
  return distancia(jugador.x, jugador.y, enemigo.x, enemigo.y) <= RADIO_ENEMIGO;
}

const TECLA_DE_PREGUNTA: Partial<Record<Pregunta, Tecla>> = {
  'flecha-derecha': 'derecha',
  'flecha-izquierda': 'izquierda',
  'flecha-arriba': 'arriba',
  'flecha-abajo': 'abajo',
};

const TECLA_DE_ACCION: Partial<Record<NodoOrden['accion'], Tecla>> = {
  'mover-derecha': 'derecha',
  'mover-izquierda': 'izquierda',
  'mover-arriba': 'arriba',
  'mover-abajo': 'abajo',
};

function responder(pregunta: Pregunta, mundo: MundoJuego, teclas: readonly Tecla[]): boolean {
  const tecla = TECLA_DE_PREGUNTA[pregunta];
  if (tecla) return teclas.includes(tecla);
  if (pregunta === 'tocando-moneda') return monedaTocada(mundo) !== null;
  if (pregunta === 'tocando-enemigo') return tocandoEnemigo(mundo);
  if (pregunta === 'puntos-igual-meta') return mundo.puntos === META_PUNTOS;
  if (pregunta === 'tocando-pared') {
    // Esta pieza es del tablero de las paradas 1 y 2 y aquí no se ofrece. Si
    // alguna vez cae en este campo, «pared» es el borde: contestar que no de
    // oficio sería mentir, y el motor no miente aunque nadie esté mirando.
    const { x, y } = mundo.jugador;
    return x <= BORDE_MIN || x >= BORDE_MAX_X || y <= BORDE_MIN || y >= BORDE_MAX_Y;
  }
  return false;
}

/**
 * Un pulso: el enemigo se mueve, y después el cuerpo del `por siempre` corre
 * UNA vez con las teclas de este instante.
 *
 * El enemigo va primero a propósito. Si fuera al revés, la pregunta «¿tocando
 * al enemigo?» leería dónde estaba el enemigo hace un pulso y el niño vería
 * cómo lo atraviesa sin que pase nada: el castigo llegaría tarde y parecería
 * roto. Moviéndolo antes, la pregunta contesta sobre el mundo que se está
 * dibujando en esa misma pantalla.
 */
export function paso(
  anterior: MundoJuego,
  programa: Programa,
  teclas: readonly Tecla[],
): ResultadoPaso {
  // Una partida detenida es una partida detenida: ni el enemigo patrulla. El
  // marco se queda con el ¡GANASTE! encendido y nada se mueve por debajo.
  if (anterior.detenido) return { mundo: anterior, eventos: [] };

  const mundo: MundoJuego = {
    jugador: { ...anterior.jugador },
    monedas: anterior.monedas.map((m) => ({ ...m })),
    enemigo: { ...anterior.enemigo },
    puntos: anterior.puntos,
    letrero: anterior.letrero,
    detenido: anterior.detenido,
    capturas: anterior.capturas,
    movio: { ...anterior.movio },
  };
  const eventos: EventoJuego[] = [];

  // El enemigo patrulla solo: no lo manda ningún bloque, es del mundo.
  const siguienteX = mundo.enemigo.x + PASO_ENEMIGO * mundo.enemigo.sentido;
  if (siguienteX > ENEMIGO_MAX_X) {
    mundo.enemigo.x = ENEMIGO_MAX_X;
    mundo.enemigo.sentido = -1;
  } else if (siguienteX < ENEMIGO_MIN_X) {
    mundo.enemigo.x = ENEMIGO_MIN_X;
    mundo.enemigo.sentido = 1;
  } else {
    mundo.enemigo.x = siguienteX;
  }

  let parar = false;

  const mover = (hacia: Tecla, pasos: number = PASOS_NORMALES) => {
    const { jugador } = mundo;
    jugador.mirando = hacia;
    const antesX = jugador.x;
    const antesY = jugador.y;
    // La plaquita escala el paso, no lo sustituye: con 10 sale el paso de
    // siempre, con 100 el muñeco cruza el campo de un tirón —el teletransporte
    // que la parada 4 hace cazar— y con 1 se arrastra sin llegar nunca.
    const avance = PASO_MUNECO * (pasos / PASOS_NORMALES);

    if (hacia === 'derecha') jugador.x = Math.min(BORDE_MAX_X, jugador.x + avance);
    else if (hacia === 'izquierda') jugador.x = Math.max(BORDE_MIN, jugador.x - avance);
    else if (hacia === 'arriba') jugador.y = Math.min(BORDE_MAX_Y, jugador.y + avance);
    else jugador.y = Math.max(BORDE_MIN, jugador.y - avance);

    if (jugador.x === antesX && jugador.y === antesY) {
      // Contra el borde. Se avisa aparte de `mueve` para que el laboratorio
      // pueda dar el topetazo sin dar por bueno un movimiento que no ocurrió.
      eventos.push({ tipo: 'topa', contra: hacia });
      return;
    }
    mundo.movio[hacia] = true;
    eventos.push({ tipo: 'mueve', hacia });
  };

  const ejecutarOrden = (nodo: NodoOrden) => {
    const tecla = TECLA_DE_ACCION[nodo.accion];
    if (tecla) {
      mover(tecla, nodo.pasos ?? PASOS_NORMALES);
      return;
    }

    if (nodo.accion === 'sumar') {
      mundo.puntos += 1;
      eventos.push({ tipo: 'suma', valor: mundo.puntos });
      return;
    }
    if (nodo.accion === 'poner-cero') {
      mundo.puntos = 0;
      eventos.push({ tipo: 'pone', valor: 0 });
      return;
    }
    if (nodo.accion === 'esconder-moneda') {
      const moneda = monedaTocada(mundo);
      if (!moneda) {
        // Esconder sin tocar nada no es un error: pasa cada vuelta que el
        // bloque está fuera de su C. Se anota para que el laboratorio lo lea.
        eventos.push({ tipo: 'esconde-vacio' });
        return;
      }
      moneda.visible = false;
      eventos.push({ tipo: 'esconde', moneda: moneda.id });
      return;
    }
    if (nodo.accion === 'volver-inicio') {
      mundo.jugador.x = SALIDA.x;
      mundo.jugador.y = SALIDA.y;
      mundo.jugador.mirando = 'derecha';
      mundo.capturas += 1;
      // Los puntos NO se tocan. §25.3: perderlos convertiría un cierre en un
      // castigo. Lo que cuesta que te atrapen es volver a hacer el camino.
      eventos.push({ tipo: 'atrapa' });
      eventos.push({ tipo: 'vuelve' });
      return;
    }
    if (nodo.accion === 'mostrar') {
      mundo.letrero = true;
      eventos.push({ tipo: 'letrero', valor: mundo.puntos });
      return;
    }
    if (nodo.accion === 'detener-juego') {
      mundo.detenido = true;
      parar = true;
      eventos.push({ tipo: 'detiene' });
      return;
    }
    // `avanzar`, `saltar` y `recoger` son del tablero en anillo de las paradas 1
    // y 2. En este campo no hay anillo ni casillas que recorrer: no hacen nada.
  };

  const ejecutarLista = (lista: NodoCuerpo[]) => {
    for (const nodo of lista) {
      if (parar) return;
      if (nodo.tipo === 'orden') {
        ejecutarOrden(nodo);
        continue;
      }
      // Una C sin pregunta no decide nada, igual que en `simular()`.
      if (!nodo.condicion) continue;
      const respuesta = responder(nodo.condicion.pregunta, mundo, teclas);
      if (respuesta) ejecutarLista(nodo.cuerpo);
      else if (nodo.tipo === 'sino') ejecutarLista(nodo.sino);
    }
  };

  ejecutarLista(programa.siempre);

  return { mundo, eventos };
}

/* ── lo que el laboratorio necesita saber del programa ─────────────────────── */

/** La orden que le toca a cada flecha. La regla uno es esta tabla, y nada más. */
export const MOVIMIENTO_DE_TECLA: Record<Tecla, NodoOrden['accion']> = {
  derecha: 'mover-derecha',
  izquierda: 'mover-izquierda',
  arriba: 'mover-arriba',
  abajo: 'mover-abajo',
};

export interface ParejaFlecha {
  tecla: Tecla;
  /** Lo que hay puesto dentro de esa C, si hay algo de movimiento. */
  puesto: Tecla | null;
  ok: boolean;
}

/**
 * Cómo quedaron emparejadas las cuatro flechas con los cuatro movimientos.
 *
 * Existe porque el mundo no basta para cazar el error que §25.3 promete cazar:
 * quien mete `mover a la derecha` dentro de la C de la flecha de arriba TAMBIÉN
 * mueve al muñeco, así que mirando sólo el mundo el programa parece correcto.
 * Hay que mirar la forma. Con esto Bit puede decir la frase exacta del
 * documento: «Apretaste arriba y se fue de lado. Mira qué pieza pusiste dentro
 * de esa C.»
 */
export function revisarFlechas(programa: Programa): ParejaFlecha[] {
  const salida: ParejaFlecha[] = [];

  for (const nodo of programa.siempre) {
    if (nodo.tipo === 'orden' || !nodo.condicion) continue;
    const tecla = TECLA_DE_PREGUNTA[nodo.condicion.pregunta];
    if (!tecla) continue;

    const cuerpo = nodo.tipo === 'sino' ? [...nodo.cuerpo, ...nodo.sino] : nodo.cuerpo;
    const movimientos = cuerpo
      .map((hijo) => TECLA_DE_ACCION[hijo.accion])
      .filter((t): t is Tecla => Boolean(t));

    const puesto = movimientos[0] ?? null;
    // Dos movimientos distintos en la misma C tampoco valen: apretar una flecha
    // mandaría al muñeco en diagonal, que no es lo que la regla uno dice.
    const ok = movimientos.length === 1 && puesto === tecla;
    salida.push({ tecla, puesto, ok });
  }

  return salida;
}

/** Las cuatro flechas emparejadas, cada una con su movimiento y sin sobras. */
export function reglaUnoArmada(programa: Programa): boolean {
  const parejas = revisarFlechas(programa);
  if (parejas.length !== 4) return false;
  return (['derecha', 'izquierda', 'arriba', 'abajo'] as Tecla[]).every((t) =>
    parejas.some((p) => p.tecla === t && p.ok),
  );
}

/** El muñeco se movió de verdad en las cuatro direcciones. Cierra la regla uno. */
export function seMovioEnLasCuatro(mundo: MundoJuego): boolean {
  return mundo.movio.derecha && mundo.movio.izquierda && mundo.movio.arriba && mundo.movio.abajo;
}

/**
 * ¿Están `sumar` y `esconder` dentro de la MISMA C de `¿tocando la moneda?`?
 *
 * Las dos juntas y en esa C: es la regla dos entera. Separadas —o una sin la
 * otra— el motor las obedece igual y el marcador se dispara, que es justo el
 * primer error del video.
 */
export function reglaDosArmada(programa: Programa): boolean {
  return programa.siempre.some((nodo) => {
    if (nodo.tipo === 'orden' || nodo.condicion?.pregunta !== 'tocando-moneda') return false;
    const cuerpo = nodo.tipo === 'sino' ? [...nodo.cuerpo, ...nodo.sino] : nodo.cuerpo;
    return (
      cuerpo.some((h) => h.accion === 'sumar') && cuerpo.some((h) => h.accion === 'esconder-moneda')
    );
  });
}

/** `volver al inicio` dentro de la C de `¿tocando al enemigo?`. */
export function reglaTresArmada(programa: Programa): boolean {
  return programa.siempre.some((nodo) => {
    if (nodo.tipo === 'orden' || nodo.condicion?.pregunta !== 'tocando-enemigo') return false;
    const cuerpo = nodo.tipo === 'sino' ? [...nodo.cuerpo, ...nodo.sino] : nodo.cuerpo;
    return cuerpo.some((h) => h.accion === 'volver-inicio');
  });
}

/** `mostrar` y `detener` dentro de la C de `¿puntos = 5?`. */
export function reglaCuatroArmada(programa: Programa): boolean {
  return programa.siempre.some((nodo) => {
    if (nodo.tipo === 'orden' || nodo.condicion?.pregunta !== 'puntos-igual-meta') return false;
    const cuerpo = nodo.tipo === 'sino' ? [...nodo.cuerpo, ...nodo.sino] : nodo.cuerpo;
    return (
      cuerpo.some((h) => h.accion === 'mostrar') && cuerpo.some((h) => h.accion === 'detener-juego')
    );
  });
}

/**
 * Las piezas que el niño dejó FUERA de toda C, colgando del `por siempre`.
 *
 * El segundo error del video es al revés —las reglas fuera del `por siempre`—,
 * pero el que de verdad se ve en el lienzo es este: un `mover a la derecha`
 * suelto hace que el muñeco corra solo sin que nadie apriete nada, y el niño
 * jura que el juego está poseído. Bit necesita poder señalarlo por su nombre.
 */
export function sueltasEnElSiempre(programa: Programa): NodoOrden[] {
  return programa.siempre.filter((nodo): nodo is NodoOrden => nodo.tipo === 'orden');
}
