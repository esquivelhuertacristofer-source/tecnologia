/**
 * El motor del videojuego (N4 · U3 · parada 3, doc §25.3).
 *
 * El video promete tres errores por su nombre y el ejercicio los cobra. Los tres
 * tienen que EMERGER de ejecutar un programa mal armado, no de un cartel escrito
 * a mano en el laboratorio; si hubiera que escribirlos, el niño no descubriría
 * nada. Por eso cada regla se prueba dos veces: bien armada y con su error.
 *
 *   · Regla dos sin `esconder la moneda` → «el marcador se dispara a cuarenta
 *     sin que hagas nada». Aquí se comprueba quieto encima de la moneda.
 *   · Flechas mal emparejadas → «apretaste arriba y se fue de lado». El mundo
 *     solo no lo caza —el muñeco se mueve igual—, hay que mirar la forma.
 *   · Sin regla cuatro el juego no se detiene aunque los puntos lleguen a cinco.
 *     Es a propósito: si el motor cortara solo, la regla cuatro sobraría.
 *
 * Y la promesa que NO es un error sino una decisión: que te atrapen cuesta el
 * camino, no los puntos.
 */
import {
  BORDE_MIN,
  ENEMIGO_MAX_X,
  ENEMIGO_MIN_X,
  META_PUNTOS,
  MONEDAS_INICIALES,
  PASO_MUNECO,
  SALIDA,
  monedaTocada,
  mundoInicial,
  paso,
  reglaCuatroArmada,
  reglaDosArmada,
  reglaTresArmada,
  reglaUnoArmada,
  revisarFlechas,
  seMovioEnLasCuatro,
  sueltasEnElSiempre,
  type MundoJuego,
  type Tecla,
} from '../components/activities/n4/estudio/motorJuego';
import type {
  Condicion,
  NodoOrden,
  NodoSi,
  Programa,
} from '../components/activities/n4/estudio/programaBloques';

let contador = 0;
const nuevoId = () => `j${(contador += 1)}`;

const orden = (accion: NodoOrden['accion']): NodoOrden => ({ tipo: 'orden', id: nuevoId(), accion });
const pregunta = (p: Condicion['pregunta']): Condicion => ({ id: nuevoId(), pregunta: p });
const si = (condicion: Condicion | null, cuerpo: NodoOrden[]): NodoSi => ({
  tipo: 'si',
  id: nuevoId(),
  condicion,
  cuerpo,
});
const programa = (...siempre: Programa['siempre']): Programa => ({ siempre });

/** Las cuatro flechas bien emparejadas: la regla uno tal y como debe quedar. */
const REGLA_1 = [
  si(pregunta('flecha-derecha'), [orden('mover-derecha')]),
  si(pregunta('flecha-izquierda'), [orden('mover-izquierda')]),
  si(pregunta('flecha-arriba'), [orden('mover-arriba')]),
  si(pregunta('flecha-abajo'), [orden('mover-abajo')]),
];

const REGLA_2 = si(pregunta('tocando-moneda'), [orden('sumar'), orden('esconder-moneda')]);
const REGLA_2_ROTA = si(pregunta('tocando-moneda'), [orden('sumar')]);
const REGLA_3 = si(pregunta('tocando-enemigo'), [orden('volver-inicio')]);
const REGLA_4 = si(pregunta('puntos-igual-meta'), [orden('mostrar'), orden('detener-juego')]);

/** Late `n` veces con las mismas teclas apretadas, como hace el laboratorio. */
function latir(mundo: MundoJuego, prog: Programa, teclas: Tecla[], n: number): MundoJuego {
  let actual = mundo;
  for (let i = 0; i < n; i += 1) actual = paso(actual, prog, teclas).mundo;
  return actual;
}

/* ── regla uno · el muñeco obedece a las teclas ────────────────────────────── */

describe('regla uno · sin tecla no se mueve nadie', () => {
  it('con la flecha derecha apretada avanza, y sin apretar nada se queda quieto', () => {
    const prog = programa(...REGLA_1);

    const quieto = latir(mundoInicial(), prog, [], 20);
    expect(quieto.jugador.x).toBe(SALIDA.x);
    expect(quieto.jugador.y).toBe(SALIDA.y);

    const andando = latir(mundoInicial(), prog, ['derecha'], 10);
    expect(andando.jugador.x).toBeCloseTo(SALIDA.x + 10 * PASO_MUNECO, 6);
    expect(andando.jugador.y).toBe(SALIDA.y);
    expect(andando.jugador.mirando).toBe('derecha');
  });

  it('cada flecha manda a su lado y `seMovioEnLasCuatro` sólo se cumple con las cuatro', () => {
    const prog = programa(...REGLA_1);
    let mundo = latir(mundoInicial(), prog, ['derecha'], 5);
    expect(seMovioEnLasCuatro(mundo)).toBe(false);

    mundo = latir(mundo, prog, ['arriba'], 5);
    mundo = latir(mundo, prog, ['izquierda'], 5);
    expect(seMovioEnLasCuatro(mundo)).toBe(false);

    mundo = latir(mundo, prog, ['abajo'], 5);
    expect(seMovioEnLasCuatro(mundo)).toBe(true);
    // Cinco a la derecha y cinco a la izquierda: vuelve justo por donde vino.
    expect(mundo.jugador.x).toBeCloseTo(SALIDA.x, 6);
    expect(mundo.jugador.y).toBeCloseTo(SALIDA.y, 6);
  });

  it('contra el borde avisa de topetazo y NO da el movimiento por hecho', () => {
    const { mundo, eventos } = paso(mundoInicial(), programa(...REGLA_1), ['izquierda']);
    expect(mundo.jugador.x).toBe(BORDE_MIN);
    expect(mundo.movio.izquierda).toBe(false);
    expect(eventos).toContainEqual({ tipo: 'topa', contra: 'izquierda' });
    expect(eventos).not.toContainEqual({ tipo: 'mueve', hacia: 'izquierda' });
  });

  it('emparejar la flecha de arriba con `mover a la derecha` mueve al muñeco IGUAL', () => {
    // Esta es la razón de que `revisarFlechas` exista. Mirando sólo el mundo, el
    // programa parece correcto: el muñeco se mueve. La equivocación está en la
    // forma, y sin mirarla Bit no podría decir «se fue de lado».
    const torcido = programa(si(pregunta('flecha-arriba'), [orden('mover-derecha')]));
    const mundo = latir(mundoInicial(), torcido, ['arriba'], 5);
    expect(mundo.jugador.x).toBeGreaterThan(SALIDA.x);
    expect(mundo.jugador.y).toBe(SALIDA.y);

    const parejas = revisarFlechas(torcido);
    expect(parejas).toEqual([{ tecla: 'arriba', puesto: 'derecha', ok: false }]);
    expect(reglaUnoArmada(torcido)).toBe(false);
    expect(reglaUnoArmada(programa(...REGLA_1))).toBe(true);
  });

  it('dos movimientos en la misma C tampoco valen: eso es una diagonal', () => {
    const doble = programa(
      si(pregunta('flecha-derecha'), [orden('mover-derecha'), orden('mover-arriba')]),
    );
    expect(revisarFlechas(doble)[0].ok).toBe(false);
  });

  it('una pieza de movimiento suelta en el `por siempre` sale en la lista de sueltas', () => {
    const suelta = programa(orden('mover-derecha'), ...REGLA_1);
    expect(sueltasEnElSiempre(suelta).map((n) => n.accion)).toEqual(['mover-derecha']);
    expect(sueltasEnElSiempre(programa(...REGLA_1))).toEqual([]);
  });
});

/* ── regla dos · sumar Y esconder, en la misma C ───────────────────────────── */

describe('regla dos · el marcador desbocado', () => {
  /** Los pulsos que tarda en llegar a la primera moneda con la flecha derecha. */
  const HASTA_LA_MONEDA = 15;

  it('bien armada, una moneda sube el marcador exactamente uno y la esconde', () => {
    const prog = programa(...REGLA_1, REGLA_2);
    let mundo = latir(mundoInicial(), prog, ['derecha'], HASTA_LA_MONEDA);
    expect(monedaTocada(mundo)).toBeNull(); // ya está escondida
    expect(mundo.puntos).toBe(1);

    // Y quieto encima de ella, diez pulsos más, el marcador no se mueve.
    mundo = latir(mundo, prog, [], 10);
    expect(mundo.puntos).toBe(1);
    expect(mundo.monedas.filter((m) => m.visible)).toHaveLength(MONEDAS_INICIALES.length - 1);
  });

  it('sin `esconder la moneda` el marcador se dispara con el niño quieto', () => {
    const prog = programa(...REGLA_1, REGLA_2_ROTA);
    let mundo = latir(mundoInicial(), prog, ['derecha'], HASTA_LA_MONEDA);
    const alLlegar = mundo.puntos;
    expect(alLlegar).toBeGreaterThanOrEqual(1);

    mundo = latir(mundo, prog, [], 10);
    // Diez pulsos sin tocar una tecla y diez puntos más: el error del video.
    expect(mundo.puntos).toBe(alLlegar + 10);
    expect(mundo.monedas.filter((m) => m.visible)).toHaveLength(MONEDAS_INICIALES.length);
  });

  it('`reglaDosArmada` pide las dos piezas dentro de la MISMA C', () => {
    expect(reglaDosArmada(programa(REGLA_2))).toBe(true);
    expect(reglaDosArmada(programa(REGLA_2_ROTA))).toBe(false);
    // Separadas en dos C distintas no cuenta, aunque estén las dos piezas.
    const separadas = programa(
      si(pregunta('tocando-moneda'), [orden('sumar')]),
      si(pregunta('tocando-moneda'), [orden('esconder-moneda')]),
    );
    expect(reglaDosArmada(separadas)).toBe(false);
  });

  it('`esconder` fuera de su C avisa en vacío en vez de callarse', () => {
    const { eventos } = paso(mundoInicial(), programa(orden('esconder-moneda')), []);
    expect(eventos).toEqual([{ tipo: 'esconde-vacio' }]);
  });
});

/* ── regla tres · el enemigo cuesta camino, no puntos ──────────────────────── */

describe('regla tres · volver al inicio', () => {
  /** Al lado del enemigo y con tres puntos ya ganados. */
  const juntoAlEnemigo = (): MundoJuego => {
    const mundo = mundoInicial();
    return { ...mundo, jugador: { x: 4.4, y: 2.5, mirando: 'derecha' }, puntos: 3 };
  };

  it('atrapado, vuelve a la salida y CONSERVA los puntos', () => {
    const { mundo, eventos } = paso(juntoAlEnemigo(), programa(...REGLA_1, REGLA_3), []);
    expect(mundo.jugador.x).toBe(SALIDA.x);
    expect(mundo.jugador.y).toBe(SALIDA.y);
    expect(mundo.capturas).toBe(1);
    // §25.3: perder los puntos convertiría un cierre en un castigo.
    expect(mundo.puntos).toBe(3);
    expect(eventos).toContainEqual({ tipo: 'atrapa' });
  });

  it('sin la regla tres el enemigo no hace absolutamente nada', () => {
    const { mundo } = paso(juntoAlEnemigo(), programa(...REGLA_1), []);
    expect(mundo.jugador.x).toBe(4.4);
    expect(mundo.capturas).toBe(0);
  });

  it('el enemigo patrulla solo y rebota en los dos extremos', () => {
    const vacio = programa();
    const ida = latir(mundoInicial(), vacio, [], 40);
    expect(ida.enemigo.x).toBeLessThanOrEqual(ENEMIGO_MAX_X);
    expect(ida.enemigo.sentido).toBe(-1);

    const vuelta = latir(ida, vacio, [], 80);
    expect(vuelta.enemigo.x).toBeGreaterThanOrEqual(ENEMIGO_MIN_X);
    expect(vuelta.enemigo.sentido).toBe(1);
  });

  it('`reglaTresArmada` sólo con `volver al inicio` dentro de la C del enemigo', () => {
    expect(reglaTresArmada(programa(REGLA_3))).toBe(true);
    expect(reglaTresArmada(programa(orden('volver-inicio')))).toBe(false);
  });
});

/* ── regla cuatro · quien detiene el juego es el bloque ────────────────────── */

describe('regla cuatro · el letrero y el alto', () => {
  const conMeta = (): MundoJuego => ({ ...mundoInicial(), puntos: META_PUNTOS });

  it('con la meta alcanzada enciende el letrero y detiene la partida', () => {
    const { mundo, eventos } = paso(conMeta(), programa(...REGLA_1, REGLA_4), []);
    expect(mundo.letrero).toBe(true);
    expect(mundo.detenido).toBe(true);
    expect(eventos).toContainEqual({ tipo: 'letrero', valor: META_PUNTOS });
    expect(eventos).toContainEqual({ tipo: 'detiene' });
  });

  it('detenida, la partida se queda absolutamente quieta', () => {
    const parada = paso(conMeta(), programa(...REGLA_1, REGLA_4), []).mundo;
    const despues = paso(parada, programa(...REGLA_1, REGLA_4), ['derecha']);
    expect(despues.mundo).toBe(parada);
    expect(despues.eventos).toEqual([]);
  });

  it('SIN la regla cuatro el juego sigue corriendo con los puntos en la meta', () => {
    const mundo = latir(conMeta(), programa(...REGLA_1), ['derecha'], 5);
    expect(mundo.detenido).toBe(false);
    expect(mundo.letrero).toBe(false);
    expect(mundo.jugador.x).toBeGreaterThan(SALIDA.x);
  });

  it('`reglaCuatroArmada` pide mostrar Y detener dentro de la C de la meta', () => {
    expect(reglaCuatroArmada(programa(REGLA_4))).toBe(true);
    expect(reglaCuatroArmada(programa(si(pregunta('puntos-igual-meta'), [orden('mostrar')])))).toBe(
      false,
    );
  });
});

/* ── la partida entera y las buenas costumbres del módulo ──────────────────── */

describe('el motor como módulo', () => {
  it('las cuatro reglas juntas dan una partida que se puede ganar', () => {
    const prog = programa(...REGLA_1, REGLA_2, REGLA_3, REGLA_4);
    let mundo = mundoInicial();

    // El recorrido de un niño que se sabe el camino: las cinco monedas del
    // campo, cruzando la línea del enemigo pegado al canto derecho, que es por
    // donde no llega su patrulla. Los tramos largos se pasan de vueltas a
    // propósito: al toparse con la pared el muñeco queda clavado en el borde, y
    // así cada tramo empieza desde una posición exacta y no acumulada.
    const ruta: Array<[Tecla, number]> = [
      ['derecha', 17], // moneda 0 en (3.5, 0.5) -> x 3.56
      ['arriba', 6], // y 1.58, a la altura de la moneda 1
      ['derecha', 25], // moneda 1 en (7.5, 1.5) -> x 8.06
      ['derecha', 10], // clavado en el canto derecho, x 8.5
      ['arriba', 20], // cruza el enemigo por fuera y moneda 4 en (8.5, 4.5)
      ['arriba', 5], // clavado en el canto de arriba, y 5.5
      ['izquierda', 25], // moneda 3 en (4.5, 5.5) -> x 4.0
      ['izquierda', 25], // clavado en el canto izquierdo, x 0.5
      ['abajo', 6], // moneda 2 en (0.5, 4.5): la quinta
    ];
    for (const [tecla, veces] of ruta) mundo = latir(mundo, prog, [tecla], veces);

    expect(mundo.puntos).toBe(META_PUNTOS);
    expect(mundo.monedas.every((m) => !m.visible)).toBe(true);
    expect(mundo.letrero).toBe(true);
    expect(mundo.detenido).toBe(true);
  });

  it('`paso` no toca el mundo que recibe: devuelve uno nuevo', () => {
    const antes = mundoInicial();
    const foto = JSON.stringify(antes);
    paso(antes, programa(...REGLA_1, REGLA_2), ['derecha']);
    expect(JSON.stringify(antes)).toBe(foto);
  });

  it('las piezas del tablero en anillo no hacen nada en este campo', () => {
    const { mundo, eventos } = paso(
      mundoInicial(),
      programa(orden('avanzar'), orden('saltar'), orden('recoger')),
      [],
    );
    expect(eventos).toEqual([]);
    expect(mundo.jugador).toEqual(mundoInicial().jugador);
    expect(mundo.puntos).toBe(0);
  });

  it('una C sin pregunta no decide nada', () => {
    const { eventos } = paso(mundoInicial(), programa(si(null, [orden('mover-derecha')])), [
      'derecha',
    ]);
    expect(eventos).toEqual([]);
  });
});
