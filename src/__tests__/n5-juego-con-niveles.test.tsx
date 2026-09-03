/**
 * `n5-juego-con-niveles` · N5·U4 «Programación en bloques III», parada 2.
 * **10–11 años**, leído en `curriculo.ts`.
 *
 * Cómo está repartida esta suite, y por qué:
 *
 *  · **Lo que es programa se prueba como programa.** Que el MISMO bloque «pintar
 *    la pantalla del nivel» dibuje tres pantallas distintas —y tres iguales
 *    cuando nadie toca la memoria— es la lección entera, y sale de recorrer el
 *    árbol con `arrancar`/`siguiente` mientras se reduce el mundo. Sin montar
 *    nada, así la prueba no puede pasar por accidente de pintado.
 *  · **Lo que es la clase se juega, hasta la pantalla de cierre.** El recorrido
 *    completo va por la vía sin arrastre —tocar la pieza y tocar el hueco—,
 *    porque en jsdom `PointerEvent` no existe y toda prueba de arrastre escrita
 *    con `fireEvent.pointerDown` es verde y hueca. La vía de toque es un
 *    `<button>` de verdad, incluidos el hueco hexagonal y la boca del bucle.
 *  · **Y se juega MAL a propósito**: ▶ con el guion vacío, pintar sin memoria,
 *    encajar la pregunta señuelo (el bucle no da ni una vuelta), olvidar el
 *    «subir de nivel» dentro del bucle (tope, no cuelgue), mandar el ¡FIN! antes
 *    de jugar, deshacer lo hecho y fallar la única pregunta de elección.
 *
 * `ejecutarTodo` NO sirve aquí: reúne los eventos al final y este mundo tiene
 * memoria, así que los hexágonos tienen que preguntarle al mundo **ya
 * actualizado**. `correrJuego` hace justo lo que hace la sala en vivo —un paso,
 * reducir, siguiente paso— y por eso es la única manera honesta de medirlo.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import EntradaJuegoConNiveles from '@/components/activities/bloques/EntradaJuegoConNiveles';
import type { ContextoEncargo } from '@/components/activities/bloques/SalaBloques';
import {
  CATALOGO_TORRE,
  CLASE_JUEGO_CON_NIVELES,
  MUNDO_INICIAL,
  NIVELES,
  PILA_FINAL,
  PILA_TRONCO,
  PROGRAMA_INICIAL,
  TOTAL_NIVELES,
  reducirTorre,
  responderTorre,
  type MundoTorre,
} from '@/components/activities/bloques/LabJuegoConNiveles';
import {
  arrancar,
  buscarBloque,
  contarBloques,
  pilaDe,
  siguiente,
  soltarFicha,
  type EventoBloques,
  type InformeCorrida,
  type Preguntar,
  type Programa,
  type Sitio,
} from '@/components/simuladores/bloques';
import { CURRICULO } from '@/data/curriculo';
import type { ActivityResult } from '@/types/activity-contract';

/* ─────────────────────────── armar guiones sin ratón ───────────────────────── */

let contador = 0;

/** Suelta una ficha por la misma puerta que usa el editor. */
function soltar(programa: Programa, sitio: Sitio, fichaId: string, id?: string): Programa {
  const r = soltarFicha(programa, CATALOGO_TORRE, sitio, fichaId, id ?? `t-${(contador += 1)}`);
  if (!r.encaje.ok) throw new Error(`No encajó ${fichaId}: ${r.encaje.aviso}`);
  return r.programa;
}

function enPila(p: Programa, pila: string, ficha: string, id?: string): Programa {
  const largo = pilaDe(p, pila)?.bloques.length ?? 0;
  return soltar(p, { donde: 'pila', pila, indice: largo }, ficha, id);
}

function enPilas(p: Programa, pila: string, fichas: readonly string[]): Programa {
  return fichas.reduce((acc, f) => enPila(acc, pila, f), p);
}

function enRama(p: Programa, bloque: string, ficha: string, id?: string): Programa {
  const largo = buscarBloque(p, bloque)?.ramas?.cuerpo?.length ?? 0;
  return soltar(p, { donde: 'rama', bloque, rama: 'cuerpo', indice: largo }, ficha, id);
}

function enHueco(p: Programa, bloque: string, ficha: string, id?: string): Programa {
  return soltar(p, { donde: 'hueco', bloque }, ficha, id);
}

/* ── el intérprete con el mundo vivo, que es lo que hace la sala ───────────── */

interface Corrida {
  mundo: MundoTorre;
  parte: InformeCorrida;
}

function correrJuego(programa: Programa, pila: string = PILA_TRONCO): Corrida {
  let mundo: MundoTorre = MUNDO_INICIAL;
  // Lee `mundo` en cada llamada, no una foto: los hexágonos miran la memoria de AHORA.
  const preguntar: Preguntar = (pregunta) => responderTorre(pregunta, mundo);

  let estado = arrancar(programa, CATALOGO_TORRE, { pila });
  const eventos: EventoBloques[] = [];
  if (estado.fin) eventos.push({ tipo: 'fin', motivo: estado.fin, aviso: estado.aviso });

  while (!estado.fin) {
    const paso = siguiente(estado, preguntar);
    estado = paso.estado;
    if (paso.evento) {
      eventos.push(paso.evento);
      mundo = reducirTorre(mundo, paso.evento);
    }
  }

  return {
    mundo,
    parte: {
      programa,
      eventos,
      acciones: eventos.flatMap((e) => (e.tipo === 'accion' ? [e.accion] : [])),
      fin: estado.fin ?? 'termino',
      aviso: estado.aviso,
      pasos: estado.pasos,
      bloques: contarBloques(programa),
    },
  };
}

/* ── los guiones canónicos de la clase, armados una vez ────────────────────── */

/** Encargo 2: tres pantallas y ninguna memoria que las separe. */
const SIN_MEMORIA = enPilas(PROGRAMA_INICIAL, PILA_TRONCO, [
  'poner-nivel-1',
  'pintar-escena',
  'pintar-escena',
  'pintar-escena',
]);

/** Encargo 3: la misma idea, con «subir de nivel» entre pantalla y pantalla. */
const A_MANO = enPilas(PROGRAMA_INICIAL, PILA_TRONCO, [
  'poner-nivel-1',
  'pintar-escena',
  'subir-nivel',
  'pintar-escena',
  'subir-nivel',
  'pintar-escena',
]);

/** Encargo 4: dos piezas dentro de «repetir 3 veces». */
const CON_BUCLE = (() => {
  let p = enPila(PROGRAMA_INICIAL, PILA_TRONCO, 'poner-nivel-1');
  p = enPila(p, PILA_TRONCO, 'repetir-3', 'b-rep3');
  p = enRama(p, 'b-rep3', 'pintar-escena');
  p = enRama(p, 'b-rep3', 'subir-nivel');
  return p;
})();

/** Encargo 5: el bucle que pregunta por la memoria en vez de contar. */
const CON_PREGUNTA = (() => {
  let p = enPila(PROGRAMA_INICIAL, PILA_TRONCO, 'poner-nivel-1');
  p = enPila(p, PILA_TRONCO, 'repetir-hasta', 'b-hasta');
  p = enHueco(p, 'b-hasta', 'sin-niveles');
  p = enRama(p, 'b-hasta', 'pintar-escena');
  p = enRama(p, 'b-hasta', 'subir-nivel');
  return p;
})();

/** Encargos 6 y 7: el juego entero, con su pantalla de final. */
const JUEGO_COMPLETO = enPila(
  enPila(CON_PREGUNTA, PILA_TRONCO, 'enviar-fin'),
  PILA_FINAL,
  'pintar-final',
);

/* ───────────────────────────── 1 · el currículo ────────────────────────────── */

describe('n5-juego-con-niveles · el sitio en el currículo', () => {
  it('es la parada 2 de «Programación en bloques III», en 5.º de primaria (10–11)', () => {
    const nivel = CURRICULO.find((n) => n.n === 5);
    expect(nivel?.grado).toBe('5° de Primaria');
    expect(nivel?.edad).toBe('10–11');

    const unidad = nivel?.unidades.find((u) => u.id === 'n5-bloques-3');
    expect(unidad?.eje).toBe('programacion');
    expect(unidad?.temas[1]).toBe('Historia interactiva o juego con niveles');
    expect(unidad?.actividades[1].id).toBe('n5-juego-con-niveles');
    // Va DESPUÉS de bloques propios: aquí se da por sabido llamar y enviar.
    expect(unidad?.actividades[0].id).toBe('n5-bloques-propios');
  });
});

/* ──────────────────── 2 · la lección, como función pura ────────────────────── */

describe('un juego con niveles es UN programa que recuerda dónde va', () => {
  it('sin memoria, tres «pintar» seguidas dan TRES VECES LA MISMA pantalla', () => {
    const { mundo } = correrJuego(SIN_MEMORIA);
    expect(mundo.bitacora).toEqual(['bosque', 'bosque', 'bosque']);
    expect(mundo.nivel).toBe(1);
  });

  it('con «subir de nivel» las mismas piezas dan tres pantallas DISTINTAS', () => {
    const { mundo } = correrJuego(A_MANO);
    expect(mundo.bitacora).toEqual([...NIVELES]);
    // Dos «subir» para tres pantallas: la memoria acaba en 3, no en 4. El bucle
    // de los encargos 4 y 5 sí sube después de la última, y por eso acaba en 4.
    expect(mundo.nivel).toBe(TOTAL_NIVELES);
    expect(correrJuego(CON_PREGUNTA).mundo.nivel).toBe(TOTAL_NIVELES + 1);
  });

  it('el bucle de dos piezas hace exactamente el mismo recorrido, con menos bloques', () => {
    const aMano = correrJuego(A_MANO);
    const conBucle = correrJuego(CON_BUCLE);
    expect(conBucle.mundo.bitacora).toEqual(aMano.mundo.bitacora);
    expect(conBucle.parte.bloques).toBeLessThan(aMano.parte.bloques);
  });

  it('«repetir hasta ¿ya no quedan niveles?» recorre lo mismo preguntando por la memoria', () => {
    const { mundo, parte } = correrJuego(CON_PREGUNTA);
    expect(mundo.bitacora).toEqual([...NIVELES]);
    expect(parte.fin).toBe('termino');
    // Una pregunta por vuelta más la que cierra el bucle: cuatro miradas a la memoria.
    expect(parte.eventos.filter((e) => e.tipo === 'mira')).toHaveLength(TOTAL_NIVELES + 1);
  });

  it('el juego entero termina en la pantalla de FIN, y el mensaje va después de los niveles', () => {
    const { mundo } = correrJuego(JUEGO_COMPLETO);
    expect(mundo.bitacora).toEqual([...NIVELES, 'final']);
    expect(mundo.escena).toBe('final');
    expect(mundo.gano).toBe(true);
  });

  it('el guion de «al recibir ¡FIN!» no arranca solo: hace falta enviarle el mensaje', () => {
    const soloRecibe = enPila(PROGRAMA_INICIAL, PILA_FINAL, 'pintar-final');
    const sola = correrJuego(soloRecibe);
    expect(sola.parte.fin).toBe('vacio');
    expect(sola.mundo.escena).toBe('titulo');

    const conAviso = enPila(soloRecibe, PILA_TRONCO, 'enviar-fin');
    expect(correrJuego(conAviso).mundo.escena).toBe('final');
  });

  it('pintar sin poner el nivel deja la pantalla perdida: el juego no sabe dónde está', () => {
    const { mundo } = correrJuego(enPila(PROGRAMA_INICIAL, PILA_TRONCO, 'pintar-escena'));
    expect(mundo.escena).toBe('perdida');
    expect(mundo.nivel).toBe(0);
  });

  it('la pregunta señuelo deja el bucle sin dar ni una vuelta, y no cuelga nada', () => {
    let p = enPila(PROGRAMA_INICIAL, PILA_TRONCO, 'poner-nivel-1');
    p = enPila(p, PILA_TRONCO, 'repetir-hasta', 'b-mal');
    p = enHueco(p, 'b-mal', 'en-el-primero'); // «¿vas en el nivel 1?» ya es «sí»
    p = enRama(p, 'b-mal', 'pintar-escena');
    p = enRama(p, 'b-mal', 'subir-nivel');

    const { mundo, parte } = correrJuego(p);
    expect(mundo.bitacora).toEqual([]);
    expect(parte.fin).toBe('termino');
  });

  it('un «repetir hasta» sin «subir de nivel» dentro se corta y avisa en español', () => {
    let p = enPila(PROGRAMA_INICIAL, PILA_TRONCO, 'poner-nivel-1');
    p = enPila(p, PILA_TRONCO, 'repetir-hasta', 'b-eterno');
    p = enHueco(p, 'b-eterno', 'sin-niveles');
    p = enRama(p, 'b-eterno', 'pintar-escena');

    const { parte, mundo } = correrJuego(p);
    expect(parte.fin).toBe('tope');
    expect(parte.aviso).toMatch(/no termina/i);
    // Y la tira no crece sin fin: se queda con las PRIMERAS, que son las que se juzgan.
    expect(mundo.bitacora).toHaveLength(16);
    expect(mundo.bitacora[0]).toBe('bosque');
  });
});

/* ─────────────────────── 3 · el mundo, como función pura ───────────────────── */

describe('el mundo de la Torre de Nova', () => {
  const accion = (accion: string): EventoBloques => ({
    tipo: 'accion',
    nodoId: 'x',
    ficha: accion,
    accion,
    args: {},
  });

  it('el mismo evento «pintar» da una escena distinta según la memoria', () => {
    const uno = reducirTorre({ ...MUNDO_INICIAL, nivel: 1 }, accion('pintar-escena'));
    const dos = reducirTorre({ ...MUNDO_INICIAL, nivel: 2 }, accion('pintar-escena'));
    const tres = reducirTorre({ ...MUNDO_INICIAL, nivel: 3 }, accion('pintar-escena'));
    expect([uno.escena, dos.escena, tres.escena]).toEqual([...NIVELES]);
  });

  it('«subir de nivel» sólo mueve el número, no pinta nada', () => {
    const m = reducirTorre({ ...MUNDO_INICIAL, nivel: 1, escena: 'bosque' }, accion('subir-nivel'));
    expect(m.nivel).toBe(2);
    expect(m.escena).toBe('bosque');
    expect(m.bitacora).toEqual([]);
  });

  it('devuelve el MISMO mundo cuando el evento no le toca (sin repintar de más)', () => {
    const fin: EventoBloques = { tipo: 'fin', motivo: 'termino', aviso: null };
    expect(reducirTorre(MUNDO_INICIAL, fin)).toBe(MUNDO_INICIAL);
    expect(reducirTorre(MUNDO_INICIAL, accion('bailar'))).toBe(MUNDO_INICIAL);
  });

  it('los hexágonos miran la memoria y nada más', () => {
    expect(responderTorre('sin-niveles', { ...MUNDO_INICIAL, nivel: 3 })).toBe(false);
    expect(responderTorre('sin-niveles', { ...MUNDO_INICIAL, nivel: 4 })).toBe(true);
    expect(responderTorre('en-el-primero', { ...MUNDO_INICIAL, nivel: 1 })).toBe(true);
    expect(responderTorre('en-el-primero', { ...MUNDO_INICIAL, nivel: 2 })).toBe(false);
    expect(responderTorre('cualquier-otra-cosa', MUNDO_INICIAL)).toBe(false);
  });
});

/* ───────────────── 3 bis · los ocho encargos, juzgados uno a uno ───────────── */

/**
 * Los `comprueba` de cada encargo, contra un contexto armado a mano.
 *
 * El recorrido de la clase juega BIEN y por eso no puede distinguir un juez
 * generoso de uno estricto: si «el ¡FIN! salió al final» estuviera escrito al
 * revés, la partida perfecta seguiría en verde. Aquí se le da a cada encargo el
 * caso que debe rechazar.
 */
describe('cada encargo rechaza lo que tiene que rechazar', () => {
  const GUION = CLASE_JUEGO_CON_NIVELES.guion;

  function juezDe(id: string) {
    const paso = GUION.find((p) => p.id === id);
    if (!paso || paso.logro.tipo !== 'estado') throw new Error(`Encargo «${id}» sin juez de estado`);
    return paso.logro.comprueba;
  }

  /** El contexto tal como lo arma la sala: el mundo sale de los eventos de la corrida. */
  function contexto(programa: Programa, corre = true): ContextoEncargo<MundoTorre> {
    const r = corre ? correrJuego(programa) : null;
    return {
      programa,
      corriendo: false,
      enPausa: false,
      nodoActivo: null,
      parte: r?.parte ?? null,
      mundo: r?.mundo ?? MUNDO_INICIAL,
    };
  }

  it('los ocho encargos están en el orden documentado y sólo el último es de elección', () => {
    expect(GUION.map((p) => p.id)).toEqual([
      'primer-nivel',
      'tres-iguales',
      'con-memoria',
      'un-solo-programa',
      'que-pregunte',
      'pantalla-final',
      'cierra-el-juego',
      'por-que',
    ]);
    expect(GUION.filter((p) => p.logro.tipo === 'eleccion')).toHaveLength(1);
    expect(GUION.every((p) => p.pista.length > 0 && p.aprendido.length > 0)).toBe(true);
  });

  it('1 · pintar sin poner el nivel no vale: la primera pantalla tiene que ser el bosque', () => {
    const juez = juezDe('primer-nivel');
    expect(juez(contexto(enPila(PROGRAMA_INICIAL, PILA_TRONCO, 'pintar-escena')))).toBe(false);
    expect(juez(contexto(enPilas(PROGRAMA_INICIAL, PILA_TRONCO, ['poner-nivel-1', 'pintar-escena'])))).toBe(
      true,
    );
  });

  it('2 · tres pantallas DISTINTAS no cumplen «las tres iguales»', () => {
    const juez = juezDe('tres-iguales');
    expect(juez(contexto(A_MANO))).toBe(false);
    expect(juez(contexto(SIN_MEMORIA))).toBe(true);
  });

  it('3 · repetir la misma pantalla tres veces no es recorrer los tres niveles', () => {
    const juez = juezDe('con-memoria');
    expect(juez(contexto(SIN_MEMORIA))).toBe(false);
    expect(juez(contexto(A_MANO))).toBe(true);
  });

  it('4 · el bucle tiene que hacer el trabajo: seis bloques a mano no cuentan', () => {
    const juez = juezDe('un-solo-programa');
    expect(juez(contexto(A_MANO))).toBe(false);
    // Y un «repetir 3 veces» vacío, con las pantallas todavía sueltas, tampoco.
    const mezcla = enPila(A_MANO, PILA_TRONCO, 'repetir-3', 'b-vacio');
    expect(juez(contexto(mezcla))).toBe(false);
    expect(juez(contexto(CON_BUCLE))).toBe(true);
  });

  it('5 · «repetir hasta» sin la pregunta encajada, o con la señuelo, no cumple', () => {
    const juez = juezDe('que-pregunte');
    expect(juez(contexto(CON_BUCLE))).toBe(false);

    let sinPregunta = enPila(PROGRAMA_INICIAL, PILA_TRONCO, 'poner-nivel-1');
    sinPregunta = enPila(sinPregunta, PILA_TRONCO, 'repetir-hasta', 'b-pelado');
    sinPregunta = enRama(sinPregunta, 'b-pelado', 'pintar-escena');
    sinPregunta = enRama(sinPregunta, 'b-pelado', 'subir-nivel');
    expect(juez(contexto(sinPregunta))).toBe(false);

    expect(juez(contexto(CON_PREGUNTA))).toBe(true);
  });

  it('6 · la pantalla de FIN puesta en el guion de arriba no cumple', () => {
    const juez = juezDe('pantalla-final');
    expect(juez(contexto(enPila(CON_PREGUNTA, PILA_TRONCO, 'pintar-final'), false))).toBe(false);
    expect(juez(contexto(enPila(CON_PREGUNTA, PILA_FINAL, 'pintar-final'), false))).toBe(true);
  });

  it('7 · el ¡FIN! tiene que salir AL FINAL, no antes de jugar', () => {
    const juez = juezDe('cierra-el-juego');

    // El mensaje al principio: la pantalla final se ve y luego se juega encima.
    let alPrincipio = enPila(PROGRAMA_INICIAL, PILA_TRONCO, 'poner-nivel-1');
    alPrincipio = enPila(alPrincipio, PILA_TRONCO, 'enviar-fin');
    alPrincipio = enPila(alPrincipio, PILA_TRONCO, 'repetir-hasta', 'b-tarde');
    alPrincipio = enHueco(alPrincipio, 'b-tarde', 'sin-niveles');
    alPrincipio = enRama(alPrincipio, 'b-tarde', 'pintar-escena');
    alPrincipio = enRama(alPrincipio, 'b-tarde', 'subir-nivel');
    alPrincipio = enPila(alPrincipio, PILA_FINAL, 'pintar-final');

    const ctx = contexto(alPrincipio);
    expect(ctx.mundo.gano).toBe(true); // el final SÍ se pintó…
    expect(ctx.mundo.escena).toBe('torre'); // …pero la última pantalla es la torre
    expect(juez(ctx)).toBe(false);

    expect(juez(contexto(JUEGO_COMPLETO))).toBe(true);
  });

  it('ningún encargo se da por hecho con el guion recién abierto', () => {
    const virgen = contexto(PROGRAMA_INICIAL, false);
    const jueces = GUION.filter((p) => p.logro.tipo === 'estado').map((p) => p.id);
    for (const id of jueces) expect([id, juezDe(id)(virgen)]).toEqual([id, false]);
  });
});

/* ──────────────────── 4 · la clase, jugada de punta a punta ────────────────── */

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaJuegoConNiveles config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

const entrar = () => fireEvent.click(screen.getByText('Entra a la Torre de Nova'));
const empezar = () => fireEvent.click(screen.getByTestId('blqs-empezar'));

/** Toma una pieza de la paleta, cambiando de categoría si hace falta. */
function tomar(fichaId: string) {
  const buscar = () => document.querySelector(`[data-testid="blq-ficha"][data-ficha="${fichaId}"]`);
  let ficha = buscar();
  if (!ficha) {
    for (const boton of Array.from(document.querySelectorAll('.blq-categoria'))) {
      fireEvent.click(boton);
      ficha = buscar();
      if (ficha) break;
    }
  }
  if (!ficha) throw new Error(`La ficha «${fichaId}» no está en ninguna categoría`);
  fireEvent.click(ficha);
}

function tocar(selector: string, queja: string) {
  const blanco = document.querySelector(selector);
  if (!blanco) throw new Error(queja);
  fireEvent.click(blanco);
}

/** La vía sin arrastre: tocar la pieza y después tocar la cola del guion. */
function ponerEnPila(pila: string, fichaId: string) {
  tomar(fichaId);
  tocar(`[data-pila="${pila}"] > .blq-cola > button`, `No hay cola en la pila ${pila}`);
}

/** Lo mismo, pero dentro de la boca de un bloque en C. */
function ponerEnBoca(bloqueId: string, fichaId: string) {
  tomar(fichaId);
  tocar(
    `[data-bloque="${bloqueId}"] > .blq-boca[data-rama="cuerpo"] > .blq-cola > button`,
    `No hay boca en el bloque ${bloqueId}`,
  );
}

/** Y en el hueco hexagonal, que también es un `<button>` de verdad. */
function ponerPregunta(bloqueId: string, fichaId: string) {
  tomar(fichaId);
  tocar(`[data-sitio="hueco:${bloqueId}"] button`, `No hay hueco libre en ${bloqueId}`);
}

/** Los bloques de PRIMER nivel de una pila, sin bajar a las bocas ni al sombrero. */
function troncoDe(pila: string): Element[] {
  return Array.from(document.querySelectorAll(`[data-pila="${pila}"] > .blq-renglon > [data-testid="blq-bloque"]`));
}

function fichasDelTronco(pila: string): string[] {
  return troncoDe(pila).map((b) => b.getAttribute('data-ficha') ?? '');
}

function idDe(pila: string, fichaId: string): string {
  const bloque = troncoDe(pila).find((b) => b.getAttribute('data-ficha') === fichaId);
  if (!bloque) throw new Error(`No hay ningún «${fichaId}» en ${pila}`);
  return bloque.getAttribute('data-bloque') ?? '';
}

function quitarEnPila(pila: string, indice: number) {
  const bloque = troncoDe(pila)[indice];
  if (!bloque) throw new Error(`No hay bloque nº ${indice} en ${pila}`);
  const equis = bloque.querySelector('.blq-quitar');
  if (!equis) throw new Error(`El bloque nº ${indice} de ${pila} no se puede quitar`);
  fireEvent.click(equis);
}

function vaciarPila(pila: string) {
  while (troncoDe(pila).length > 0) quitarEnPila(pila, 0);
}

/**
 * ▶ y adelantar el reloj hasta que la corrida termine sola.
 *
 * `ms` por omisión cubre de sobra cualquier guion sano de esta clase (unos 15
 * bloques a 420 ms). Un bucle sin salida necesita más: el aviso del tope no
 * aparece hasta el paso 2 000, o sea 840 s de reloj, y hasta entonces
 * `bl.aviso` es `null` porque la corrida sigue viva. Medido, no supuesto.
 */
function correr(ms = 30000) {
  fireEvent.click(screen.getByLabelText('Correr el programa'));
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

const encargo = () => screen.getByTestId('blqs-panel').querySelector('.blqs-panel-titulo')?.textContent;
const numeroDeEncargo = () =>
  screen.getByTestId('blqs-panel').querySelector('.blqs-panel-num')?.textContent;
const bitDice = () => document.querySelector('.bit-globo')?.textContent ?? '';
const chips = () => Array.from(document.querySelectorAll('.jn-chip')).map((c) => c.getAttribute('data-escena'));

/** Los siete encargos de construcción, en orden, por la vía del dedo. */
function jugarBien() {
  // 1 · enciende el primer nivel
  ponerEnPila(PILA_TRONCO, 'poner-nivel-1');
  ponerEnPila(PILA_TRONCO, 'pintar-escena');
  correr();

  // 2 · tres pantallas, y salen las tres iguales
  ponerEnPila(PILA_TRONCO, 'pintar-escena');
  ponerEnPila(PILA_TRONCO, 'pintar-escena');
  correr();

  // 3 · dale memoria: sube de nivel
  vaciarPila(PILA_TRONCO);
  ponerEnPila(PILA_TRONCO, 'poner-nivel-1');
  ponerEnPila(PILA_TRONCO, 'pintar-escena');
  ponerEnPila(PILA_TRONCO, 'subir-nivel');
  ponerEnPila(PILA_TRONCO, 'pintar-escena');
  ponerEnPila(PILA_TRONCO, 'subir-nivel');
  ponerEnPila(PILA_TRONCO, 'pintar-escena');
  correr();

  // 4 · un solo programa: se dejan las cinco de abajo fuera y entra el bucle
  for (let i = 0; i < 5; i += 1) quitarEnPila(PILA_TRONCO, 1);
  ponerEnPila(PILA_TRONCO, 'repetir-3');
  const rep3 = idDe(PILA_TRONCO, 'repetir-3');
  ponerEnBoca(rep3, 'pintar-escena');
  ponerEnBoca(rep3, 'subir-nivel');
  correr();

  // 5 · que el juego pregunte, no que cuente
  quitarEnPila(PILA_TRONCO, 1);
  ponerEnPila(PILA_TRONCO, 'repetir-hasta');
  const hasta = idDe(PILA_TRONCO, 'repetir-hasta');
  ponerPregunta(hasta, 'sin-niveles');
  ponerEnBoca(hasta, 'pintar-escena');
  ponerEnBoca(hasta, 'subir-nivel');
  correr();

  // 6 · la pantalla de FIN
  ponerEnPila(PILA_FINAL, 'pintar-final');

  // 7 · manda el mensaje y cierra el juego
  ponerEnPila(PILA_TRONCO, 'enviar-fin');
  correr();
}

describe('la clase, de punta a punta', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('la entrada enseña la portada de objetivos antes de la práctica', () => {
    montar();
    entrar();
    const portada = screen.getByTestId('blqs-portada');
    expect(portada).toHaveTextContent('Historia o juego con niveles');
    expect(portada).toHaveTextContent('Nivel 5 · Programación en bloques III · Parada 2 de 3');
    expect(portada).toHaveTextContent('Arquitecta de niveles');
    expect(portada).toHaveTextContent('8');
  });

  it('una partida perfecta se termina, saca 100 y tres estrellas', () => {
    const { onComplete, onScore } = montar();
    entrar();
    empezar();

    expect(numeroDeEncargo()).toBe('Encargo 1/8');
    jugarBien();

    // El octavo es la única pregunta de elección de toda la clase.
    expect(encargo()).toBe('¿Por qué el mismo bloque pintó tres pantallas distintas?');
    fireEvent.click(screen.getByText('Porque el juego guarda en qué nivel va y el bloque lo consulta'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(100);
    expect(resultado.stars).toBe(3);
    expect(onScore).toHaveBeenLastCalledWith(100);

    expect(screen.getByText('¡Nova llegó a la cima!')).toBeInTheDocument();
    expect(screen.getByText(/Arquitecta de niveles/)).toBeInTheDocument();
    expect(screen.getByText('Se rompió')).toBeInTheDocument();

    // El camino de salida DESDE la pantalla de cierre, que es el que pisa todo
    // alumno que termina — y por donde reventaba una clase de Word.
    fireEvent.click(screen.getByText('Salir'));
    expect(screen.getByText('Entra a la Torre de Nova')).toBeInTheDocument();
  });

  it('se puede salir a media práctica y volver a entrar', () => {
    montar();
    entrar();
    empezar();
    ponerEnPila(PILA_TRONCO, 'poner-nivel-1');
    fireEvent.click(screen.getByText('Salir'));
    expect(screen.getByText('Entra a la Torre de Nova')).toBeInTheDocument();

    entrar();
    expect(screen.getByTestId('blqs-portada')).toBeInTheDocument();
  });

  it('tres pantallas sin memoria salen iguales, y con memoria salen distintas', () => {
    montar();
    entrar();
    empezar();

    ponerEnPila(PILA_TRONCO, 'poner-nivel-1');
    ponerEnPila(PILA_TRONCO, 'pintar-escena');
    ponerEnPila(PILA_TRONCO, 'pintar-escena');
    ponerEnPila(PILA_TRONCO, 'pintar-escena');
    correr();

    // Quien se adelanta y pone las tres de una vez cumple 1 y 2 en la misma
    // corrida: los encargos encadenan en vez de atascarse.
    expect(chips()).toEqual(['bosque', 'bosque', 'bosque']);
    expect(numeroDeEncargo()).toBe('Encargo 3/8');
    expect(screen.getByTestId('jn-nivel')).toHaveTextContent('1');

    vaciarPila(PILA_TRONCO);
    ponerEnPila(PILA_TRONCO, 'poner-nivel-1');
    ponerEnPila(PILA_TRONCO, 'pintar-escena');
    ponerEnPila(PILA_TRONCO, 'subir-nivel');
    ponerEnPila(PILA_TRONCO, 'pintar-escena');
    ponerEnPila(PILA_TRONCO, 'subir-nivel');
    ponerEnPila(PILA_TRONCO, 'pintar-escena');
    correr();

    expect(chips()).toEqual(['bosque', 'rio', 'torre']);
    expect(screen.getByTestId('jn-nombre')).toHaveTextContent('Torre del faro');
    expect(screen.getByTestId('jn-nivel')).toHaveTextContent('3');
    expect(numeroDeEncargo()).toBe('Encargo 4/8');
  });

  it('el bucle con la pregunta encajada deja el tronco en dos piezas y el mismo recorrido', () => {
    montar();
    entrar();
    empezar();

    ponerEnPila(PILA_TRONCO, 'poner-nivel-1');
    ponerEnPila(PILA_TRONCO, 'repetir-hasta');
    const hasta = idDe(PILA_TRONCO, 'repetir-hasta');
    ponerPregunta(hasta, 'sin-niveles');
    ponerEnBoca(hasta, 'pintar-escena');
    ponerEnBoca(hasta, 'subir-nivel');
    correr();

    expect(fichasDelTronco(PILA_TRONCO)).toEqual(['poner-nivel-1', 'repetir-hasta']);
    expect(chips()).toEqual(['bosque', 'rio', 'torre']);
  });
});

/* ────────────────────────── 5 · jugando MAL a propósito ────────────────────── */

describe('jugando mal a propósito', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('pulsar ▶ con el guion vacío avisa en español y no rompe nada', () => {
    montar();
    entrar();
    empezar();
    correr();
    expect(screen.getByTestId('blq-aviso')).toHaveTextContent('El guion está vacío');
    expect(numeroDeEncargo()).toBe('Encargo 1/8');
  });

  it('tocar el hueco sin pieza en la mano explica cuál es la otra mitad del gesto', () => {
    montar();
    entrar();
    empezar();
    tocar(`[data-pila="${PILA_TRONCO}"] > .blq-cola > button`, 'no hay cola');
    expect(screen.getByTestId('blq-aviso')).toHaveTextContent('Primero toca una pieza de la paleta');
  });

  it('pintar sin poner el nivel enseña «Nivel ?» y no adelanta el encargo', () => {
    montar();
    entrar();
    empezar();
    ponerEnPila(PILA_TRONCO, 'pintar-escena');
    correr();
    expect(screen.getByTestId('jn-nombre')).toHaveTextContent('Nivel ?');
    expect(screen.getByTestId('jn-nivel')).toHaveTextContent('?');
    expect(numeroDeEncargo()).toBe('Encargo 1/8');
  });

  it('armar el juego en el guion de la pantalla final no adelanta nada: ▶ corre el de arriba', () => {
    montar();
    entrar();
    empezar();
    ponerEnPila(PILA_FINAL, 'poner-nivel-1');
    ponerEnPila(PILA_FINAL, 'pintar-escena');
    correr();
    expect(screen.getByTestId('blq-aviso')).toHaveTextContent('El guion está vacío');
    expect(numeroDeEncargo()).toBe('Encargo 1/8');
  });

  it('deshacer lo hecho no borra un encargo ya cumplido', () => {
    montar();
    entrar();
    empezar();
    ponerEnPila(PILA_TRONCO, 'poner-nivel-1');
    ponerEnPila(PILA_TRONCO, 'pintar-escena');
    correr();
    expect(numeroDeEncargo()).toBe('Encargo 2/8');

    vaciarPila(PILA_TRONCO);
    expect(numeroDeEncargo()).toBe('Encargo 2/8');
    expect(encargo()).toBe('Tres pantallas, y salen las tres iguales');
  });

  it('el mundo vuelve al principio en cada ▶: dos corridas iguales dan la misma tira', () => {
    montar();
    entrar();
    empezar();
    ponerEnPila(PILA_TRONCO, 'poner-nivel-1');
    ponerEnPila(PILA_TRONCO, 'pintar-escena');
    ponerEnPila(PILA_TRONCO, 'subir-nivel');
    ponerEnPila(PILA_TRONCO, 'pintar-escena');
    correr();
    const primera = chips();
    expect(primera).toEqual(['bosque', 'rio']);
    correr();
    expect(chips()).toEqual(primera);
  });

  it('un bucle sin «subir de nivel» dentro se corta, avisa, y la clase sigue jugable', () => {
    montar();
    entrar();
    empezar();
    ponerEnPila(PILA_TRONCO, 'poner-nivel-1');
    ponerEnPila(PILA_TRONCO, 'repetir-hasta');
    const hasta = idDe(PILA_TRONCO, 'repetir-hasta');
    ponerPregunta(hasta, 'sin-niveles');
    ponerEnBoca(hasta, 'pintar-escena');
    correr(900000); // hasta que salte el tope de 2 000 pasos

    expect(screen.getByTestId('blq-aviso')).toHaveTextContent('no termina');
    // Se rompió, pero no se castiga con puntos y el encargo 1 quedó hecho igual:
    // se pintó el bosque, que es lo que pedía.
    expect(numeroDeEncargo()).toBe('Encargo 2/8');
    ponerEnBoca(hasta, 'subir-nivel');
    correr();
    expect(chips()).toEqual(['bosque', 'rio', 'torre']);
  });

  it('fallar la pregunta final resta seis puntos, y la misma equivocación no resta dos veces', () => {
    const { onComplete } = montar();
    entrar();
    empezar();
    jugarBien();
    expect(encargo()).toBe('¿Por qué el mismo bloque pintó tres pantallas distintas?');

    fireEvent.click(screen.getByText('Porque cada nivel es un juego distinto'));
    fireEvent.click(screen.getByText('Porque cada nivel es un juego distinto'));
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Porque el juego guarda en qué nivel va y el bloque lo consulta'));
    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(94);
  });

  it('Bit dice lo que se aprendió en cada encargo, no una frase genérica', () => {
    montar();
    entrar();
    empezar();
    ponerEnPila(PILA_TRONCO, 'poner-nivel-1');
    ponerEnPila(PILA_TRONCO, 'pintar-escena');
    correr();
    expect(bitDice()).toMatch(/mira el número guardado en nivel/i);
  });
});
