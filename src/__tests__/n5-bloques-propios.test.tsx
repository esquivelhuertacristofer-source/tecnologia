/**
 * `n5-bloques-propios` · N5·U4 «Programación en bloques III», parada 1.
 * **10–11 años**, leído en `curriculo.ts`.
 *
 * Cómo está repartida esta suite, y por qué:
 *
 *  · **Lo que es programa se prueba como programa.** Que nueve bloques a mano y
 *    tres llamadas a un bloque propio produzcan EXACTAMENTE el mismo baile es la
 *    lección entera de la clase, y es una función pura de `ejecutarTodo` sobre un
 *    árbol: no hace falta montar nada, y así la prueba no puede pasar por
 *    accidente de pintado.
 *  · **Lo que es la clase se juega, hasta la pantalla de cierre.** El recorrido
 *    completo va por la vía sin arrastre —tocar la pieza y tocar el hueco—,
 *    porque en jsdom `PointerEvent` no existe y toda prueba de arrastre escrita
 *    con `fireEvent.pointerDown` es verde y hueca. La vía de toque es un
 *    `<button>` de verdad, así que aquí se prueba lo mismo que hace un alumno con
 *    el dedo o con el teclado.
 *  · **Y se juega MAL a propósito**: pulsar ▶ con el guion vacío, poner la pieza
 *    en el guion equivocado, borrar lo que ya estaba bien, y contestar mal la
 *    única pregunta de elección para comprobar que resta seis y sólo una vez.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import EntradaBloquesPropios from '@/components/activities/bloques/EntradaBloquesPropios';
import type { ContextoEncargo } from '@/components/activities/bloques/SalaBloques';
import {
  CATALOGO_FESTIVAL,
  CLASE_BLOQUES_PROPIOS,
  MUNDO_INICIAL,
  NOMBRE_BLOQUE_PROPIO,
  PASO_NUEVO,
  PASO_VIEJO,
  PROGRAMA_INICIAL,
  reducirFestival,
  type MundoFestival,
} from '@/components/activities/bloques/LabBloquesPropios';
import {
  ejecutarTodo,
  pilaDe,
  soltarFicha,
  type EventoBloques,
  type Programa,
} from '@/components/simuladores/bloques';
import { CURRICULO } from '@/data/curriculo';
import type { ActivityResult } from '@/types/activity-contract';

/* ─────────────────────────── armar guiones sin ratón ───────────────────────── */

let contador = 0;

/** Añade una ficha al final de una pila, por la misma puerta que el editor. */
function anadir(programa: Programa, pila: string, fichaId: string): Programa {
  const largo = pilaDe(programa, pila)?.bloques.length ?? 0;
  const r = soltarFicha(
    programa,
    CATALOGO_FESTIVAL,
    { donde: 'pila', pila, indice: largo },
    fichaId,
    `t-${(contador += 1)}`,
  );
  if (!r.encaje.ok) throw new Error(`No encajó ${fichaId} en ${pila}: ${r.encaje.aviso}`);
  return r.programa;
}

function anadirTodas(programa: Programa, pila: string, fichas: readonly string[]): Programa {
  return fichas.reduce((p, f) => anadir(p, pila, f), programa);
}

const NUNCA = () => false;

function correrPrograma(programa: Programa) {
  return ejecutarTodo(programa, CATALOGO_FESTIVAL, NUNCA, { pila: 'p-baile' });
}

/* ───────────────────────────── 1 · el currículo ────────────────────────────── */

describe('n5-bloques-propios · el sitio en el currículo', () => {
  it('es la parada 1 de «Programación en bloques III», en 5.º de primaria (10–11)', () => {
    const nivel = CURRICULO.find((n) => n.n === 5);
    expect(nivel?.grado).toBe('5° de Primaria');
    expect(nivel?.edad).toBe('10–11');

    const unidad = nivel?.unidades.find((u) => u.id === 'n5-bloques-3');
    expect(unidad?.eje).toBe('programacion');
    expect(unidad?.temas[0]).toBe('Bloques propios (funciones) y mensajes');
    expect(unidad?.actividades[0].id).toBe('n5-bloques-propios');
  });
});

/* ──────────────────── 2 · la lección, como función pura ────────────────────── */

describe('nueve bloques a mano y tres llamadas hacen el mismo baile', () => {
  it('los nueve bloques copiados a mano bailan el paso tres veces', () => {
    const aMano = anadirTodas(PROGRAMA_INICIAL, 'p-baile', [...PASO_VIEJO, ...PASO_VIEJO, ...PASO_VIEJO]);
    const parte = correrPrograma(aMano);
    expect(parte.acciones).toEqual([...PASO_VIEJO, ...PASO_VIEJO, ...PASO_VIEJO]);
    expect(parte.fin).toBe('termino');
  });

  it('tres llamadas al bloque propio hacen EXACTAMENTE lo mismo con menos bloques', () => {
    const aMano = anadirTodas(PROGRAMA_INICIAL, 'p-baile', [...PASO_VIEJO, ...PASO_VIEJO, ...PASO_VIEJO]);
    const conBloquePropio = anadirTodas(
      anadirTodas(PROGRAMA_INICIAL, 'p-paso', PASO_VIEJO),
      'p-baile',
      ['llamar-paso', 'llamar-paso', 'llamar-paso'],
    );

    expect(correrPrograma(conBloquePropio).acciones).toEqual(correrPrograma(aMano).acciones);
    // Y el guion es más corto: nueve bloques contra seis (tres llamadas y la
    // definición). Es el número que el alumno ve en pantalla.
    expect(correrPrograma(conBloquePropio).bloques).toBeLessThan(correrPrograma(aMano).bloques);
  });

  it('cambiar UN bloque de la definición cambia las tres repeticiones', () => {
    const conNuevoFinal = anadirTodas(
      anadirTodas(PROGRAMA_INICIAL, 'p-paso', PASO_NUEVO),
      'p-baile',
      ['llamar-paso', 'llamar-paso', 'llamar-paso'],
    );
    const parte = correrPrograma(conNuevoFinal);
    expect(parte.acciones.filter((a) => a === 'reverencia')).toHaveLength(3);
    expect(parte.acciones).not.toContain('aplaudir');
  });

  it('el guion de «al recibir» no arranca solo: hace falta enviarle el mensaje', () => {
    const soloRecibe = anadirTodas(PROGRAMA_INICIAL, 'p-luces', ['pintar-arcoiris']);
    expect(correrPrograma(soloRecibe).acciones).toEqual([]);
    expect(correrPrograma(soloRecibe).fin).toBe('vacio');

    const conAviso = anadirTodas(soloRecibe, 'p-baile', ['enviar-luces']);
    expect(correrPrograma(conAviso).acciones).toEqual(['pintar-arcoiris']);
  });

  it('el aviso sale antes del baile cuando el mensaje va arriba', () => {
    const completo = anadirTodas(
      anadirTodas(anadirTodas(PROGRAMA_INICIAL, 'p-luces', ['pintar-arcoiris']), 'p-paso', PASO_VIEJO),
      'p-baile',
      ['enviar-luces', 'llamar-paso', 'llamar-paso', 'llamar-paso'],
    );
    const { acciones } = correrPrograma(completo);
    expect(acciones[0]).toBe('pintar-arcoiris');
    expect(acciones.indexOf('pintar-arcoiris')).toBeLessThan(acciones.indexOf('saltar'));
    expect(acciones).toHaveLength(10);
  });

  it('un bloque propio que se llama a sí mismo se corta y avisa, no cuelga el navegador', () => {
    const recursivo = anadirTodas(
      anadirTodas(PROGRAMA_INICIAL, 'p-paso', ['saltar', 'llamar-paso']),
      'p-baile',
      ['llamar-paso'],
    );
    const parte = correrPrograma(recursivo);
    expect(parte.fin).toBe('tope');
    expect(parte.aviso).toMatch(/se está llamando a sí mismo/i);
  });
});

/* ─────────────────────── 3 · el mundo, como función pura ───────────────────── */

describe('el escenario del festival', () => {
  const accion = (accion: string): EventoBloques => ({
    tipo: 'accion',
    nodoId: 'x',
    ficha: accion,
    accion,
    args: {},
  });

  it('cada movimiento cambia la pose y deja su huella en la cinta', () => {
    const m = [accion('saltar'), accion('girar'), accion('aplaudir')].reduce(reducirFestival, MUNDO_INICIAL);
    expect(m.movimientos).toEqual(['saltar', 'girar', 'aplaudir']);
    expect(m.pose).toBe('aplauso');
    expect(m.luces).toBe('apagadas');
  });

  it('«pintar de arcoíris» enciende los focos y no cambia la pose de Chispa', () => {
    const m = reducirFestival({ ...MUNDO_INICIAL, pose: 'salto' }, accion('pintar-arcoiris'));
    expect(m.luces).toBe('arcoiris');
    expect(m.pose).toBe('salto');
  });

  it('cuenta las llamadas al bloque propio y los mensajes por separado', () => {
    const llama = (nombre: string): EventoBloques => ({
      tipo: 'llama',
      nodoId: 'x',
      ficha: 'f',
      nombre,
      encontrada: true,
    });
    const m = [llama(NOMBRE_BLOQUE_PROPIO), llama(NOMBRE_BLOQUE_PROPIO), llama('¡luces!')].reduce(
      reducirFestival,
      MUNDO_INICIAL,
    );
    expect(m.pasos).toBe(2);
    expect(m.avisos).toBe(1);
  });

  it('devuelve el MISMO mundo cuando el evento no le toca (sin repintar de más)', () => {
    const fin: EventoBloques = { tipo: 'fin', motivo: 'termino', aviso: null };
    expect(reducirFestival(MUNDO_INICIAL, fin)).toBe(MUNDO_INICIAL);
  });

  it('la cinta no crece sin fin: se queda con los últimos movimientos', () => {
    let m: MundoFestival = MUNDO_INICIAL;
    for (let i = 0; i < 60; i += 1) m = reducirFestival(m, accion('saltar'));
    expect(m.movimientos).toHaveLength(24);
  });
});

/* ───────────────── 3 bis · los ocho encargos, juzgados uno a uno ───────────── */

/**
 * Los `comprueba` de cada encargo, contra un contexto armado a mano.
 *
 * El recorrido de la clase juega BIEN y por eso no puede distinguir un juez
 * generoso de uno estricto: si «el aviso salió antes del baile» estuviera
 * escrito al revés, la partida perfecta seguiría en verde. Aquí se le da a cada
 * encargo el caso que debe rechazar.
 */
describe('cada encargo rechaza lo que tiene que rechazar', () => {
  const GUION = CLASE_BLOQUES_PROPIOS.guion;

  function juezDe(id: string) {
    const paso = GUION.find((p) => p.id === id);
    if (!paso || paso.logro.tipo !== 'estado') throw new Error(`Encargo «${id}» sin juez de estado`);
    return paso.logro.comprueba;
  }

  /** El contexto tal como lo arma la sala: el mundo sale de los eventos de la corrida. */
  function contexto(programa: Programa, corre = true): ContextoEncargo<MundoFestival> {
    const parte = corre ? correrPrograma(programa) : null;
    const mundo = parte ? parte.eventos.reduce(reducirFestival, MUNDO_INICIAL) : MUNDO_INICIAL;
    return { programa, corriendo: false, enPausa: false, nodoActivo: null, parte, mundo };
  }

  const conDefinicion = (paso: readonly string[]) => anadirTodas(PROGRAMA_INICIAL, 'p-paso', paso);
  const conLuces = (p: Programa) => anadirTodas(p, 'p-luces', ['pintar-arcoiris']);
  const tresLlamadas = (p: Programa) =>
    anadirTodas(p, 'p-baile', ['llamar-paso', 'llamar-paso', 'llamar-paso']);

  it('los ocho encargos están en el orden documentado y sólo el último es de elección', () => {
    expect(GUION.map((p) => p.id)).toEqual([
      'paso',
      'tres-veces',
      'definir',
      'al-recibir',
      'enviar',
      'llamar',
      'cambiar',
      'por-que',
    ]);
    expect(GUION.filter((p) => p.logro.tipo === 'eleccion')).toHaveLength(1);
    expect(GUION.every((p) => p.pista.length > 0 && p.aprendido.length > 0)).toBe(true);
  });

  it('1 · el paso pide ESE orden: girar antes de saltar no vale', () => {
    const juez = juezDe('paso');
    expect(juez(contexto(anadirTodas(PROGRAMA_INICIAL, 'p-baile', ['girar', 'saltar', 'aplaudir'])))).toBe(false);
    expect(juez(contexto(anadirTodas(PROGRAMA_INICIAL, 'p-baile', PASO_VIEJO)))).toBe(true);
  });

  it('2 · tres veces se cumple a mano, y NO con tres llamadas', () => {
    const juez = juezDe('tres-veces');
    expect(juez(contexto(tresLlamadas(conDefinicion(PASO_VIEJO))))).toBe(false);
    const aMano = anadirTodas(PROGRAMA_INICIAL, 'p-baile', [...PASO_VIEJO, ...PASO_VIEJO, ...PASO_VIEJO]);
    expect(juez(contexto(aMano))).toBe(true);
  });

  it('3 · definir exige el tronco VACÍO: tener la definición y el copia-pega no basta', () => {
    const juez = juezDe('definir');
    const ambos = anadirTodas(conDefinicion(PASO_VIEJO), 'p-baile', PASO_VIEJO);
    expect(juez(contexto(ambos, false))).toBe(false);
    expect(juez(contexto(conDefinicion(PASO_VIEJO), false))).toBe(true);
  });

  it('4 · el guion que espera no se cumple poniendo la luz en el tronco', () => {
    const juez = juezDe('al-recibir');
    expect(juez(contexto(anadirTodas(PROGRAMA_INICIAL, 'p-baile', ['pintar-arcoiris'])))).toBe(false);
    expect(juez(contexto(conLuces(PROGRAMA_INICIAL), false))).toBe(true);
  });

  it('5 · el aviso tiene que salir ANTES del baile, no al final', () => {
    const juez = juezDe('enviar');
    const alFinal = anadirTodas(tresLlamadas(conLuces(conDefinicion(PASO_VIEJO))), 'p-baile', ['enviar-luces']);
    // Las luces acaban encendidas… pero después de bailar: el encargo no se da por hecho.
    expect(contexto(alFinal).mundo.luces).toBe('arcoiris');
    expect(juez(contexto(alFinal))).toBe(false);

    const alPrincipio = tresLlamadas(
      anadirTodas(conLuces(conDefinicion(PASO_VIEJO)), 'p-baile', ['enviar-luces']),
    );
    expect(juez(contexto(alPrincipio))).toBe(true);
  });

  it('6 · llamar pide TRES llamadas: nueve bloques a mano no cuentan', () => {
    const juez = juezDe('llamar');
    const aMano = anadirTodas(PROGRAMA_INICIAL, 'p-baile', [...PASO_VIEJO, ...PASO_VIEJO, ...PASO_VIEJO]);
    expect(juez(contexto(aMano))).toBe(false);
    expect(juez(contexto(tresLlamadas(conDefinicion(PASO_VIEJO))))).toBe(true);
  });

  it('7 · cambiar sólo se cumple cambiando la DEFINICIÓN, no copiando el nuevo paso tres veces', () => {
    const juez = juezDe('cambiar');
    const aMano = anadirTodas(PROGRAMA_INICIAL, 'p-baile', [...PASO_NUEVO, ...PASO_NUEVO, ...PASO_NUEVO]);
    expect(juez(contexto(aMano))).toBe(false);
    expect(juez(contexto(tresLlamadas(conDefinicion(PASO_NUEVO))))).toBe(true);
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
    <EntradaBloquesPropios config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

const entrar = () => fireEvent.click(screen.getByText('Sube al escenario del festival'));
const empezar = () => fireEvent.click(screen.getByTestId('blqs-empezar'));

function irA(categoria: string) {
  const boton = Array.from(document.querySelectorAll('.blq-categoria')).find(
    (b) => b.textContent === categoria,
  );
  if (!boton) throw new Error(`No hay categoría «${categoria}»`);
  fireEvent.click(boton);
}

/** La vía sin arrastre: tocar la pieza de la paleta y después tocar el hueco. */
function poner(pila: string, fichaId: string) {
  const ficha = document.querySelector(`[data-testid="blq-ficha"][data-ficha="${fichaId}"]`);
  if (!ficha) throw new Error(`La ficha «${fichaId}» no está en la paleta visible`);
  fireEvent.click(ficha);
  const largo = document.querySelectorAll(`[data-pila="${pila}"] [data-testid="blq-bloque"]`).length;
  // El sombrero es un bloque más en el guion, pero no en la lista: se descuenta.
  const cola = document.querySelector(`[data-sitio="pila:${pila}:${largo - 1}"] button`);
  if (!cola) throw new Error(`No hay cola en ${pila} con ${largo - 1} bloques`);
  fireEvent.click(cola);
}

function bloquesDelGuion(pila: string): string[] {
  return Array.from(document.querySelectorAll(`[data-pila="${pila}"] [data-testid="blq-bloque"]`))
    .map((b) => b.getAttribute('data-ficha') ?? '')
    .slice(1); // fuera el sombrero
}

function quitarDelGuion(pila: string, indiceEnLaLista: number) {
  const equis = document.querySelectorAll(`[data-pila="${pila}"] .blq-quitar`);
  const boton = equis[indiceEnLaLista];
  if (!boton) throw new Error(`No hay ✕ nº ${indiceEnLaLista} en ${pila}`);
  fireEvent.click(boton);
}

function vaciarGuion(pila: string) {
  for (;;) {
    const equis = document.querySelector(`[data-pila="${pila}"] .blq-quitar`);
    if (!equis) return;
    fireEvent.click(equis);
  }
}

/** ▶ y adelantar el reloj hasta que la corrida termine sola. */
function correr() {
  fireEvent.click(screen.getByLabelText('Correr el programa'));
  act(() => {
    jest.advanceTimersByTime(30000);
  });
}

const encargo = () => screen.getByTestId('blqs-panel').querySelector('.blqs-panel-titulo')?.textContent;
const numeroDeEncargo = () =>
  screen.getByTestId('blqs-panel').querySelector('.blqs-panel-num')?.textContent;
const bitDice = () => document.querySelector('.bit-globo')?.textContent ?? '';

/** Los ocho encargos, en orden, por la vía del dedo. */
function jugarBien() {
  // 1 · el paso de baile
  irA('Baile');
  poner('p-baile', 'saltar');
  poner('p-baile', 'girar');
  poner('p-baile', 'aplaudir');
  correr();

  // 2 · tres veces, a mano
  for (let i = 0; i < 2; i += 1) {
    poner('p-baile', 'saltar');
    poner('p-baile', 'girar');
    poner('p-baile', 'aplaudir');
  }
  correr();

  // 3 · dale un nombre al paso
  vaciarGuion('p-baile');
  poner('p-paso', 'saltar');
  poner('p-paso', 'girar');
  poner('p-paso', 'aplaudir');

  // 4 · el guion que espera
  irA('Luces');
  poner('p-luces', 'pintar-arcoiris');

  // 5 · manda el aviso
  irA('Mensajes');
  poner('p-baile', 'enviar-luces');
  correr();

  // 6 · llámalo tres veces
  irA('Mis bloques');
  poner('p-baile', 'llamar-paso');
  poner('p-baile', 'llamar-paso');
  poner('p-baile', 'llamar-paso');
  correr();

  // 7 · cambia el final en un solo sitio
  quitarDelGuion('p-paso', 2);
  irA('Baile');
  poner('p-paso', 'reverencia');
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
    expect(portada).toHaveTextContent('Bloques propios y mensajes');
    expect(portada).toHaveTextContent('Nivel 5 · Programación en bloques III · Parada 1 de 3');
    expect(portada).toHaveTextContent('Coreógrafa de bloques');
    expect(portada).toHaveTextContent('8');
  });

  it('una partida perfecta se termina, saca 100 y tres estrellas', () => {
    const { onComplete, onScore } = montar();
    entrar();
    empezar();

    expect(numeroDeEncargo()).toBe('Encargo 1/8');
    jugarBien();

    // El octavo es la única pregunta de elección de toda la clase.
    expect(encargo()).toBe('¿Por qué cambiaron las tres?');
    fireEvent.click(screen.getByText('Porque las tres llamadas apuntan al mismo guion'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(100);
    expect(resultado.stars).toBe(3);
    expect(onScore).toHaveBeenLastCalledWith(100);

    expect(screen.getByText('¡El festival salió perfecto!')).toBeInTheDocument();
    expect(screen.getByText(/Coreógrafa de bloques/)).toBeInTheDocument();
    expect(screen.getByText('Se rompió')).toBeInTheDocument();

    // El camino de salida DESDE la pantalla de cierre, que es el que pisa todo
    // alumno que termina — y por donde reventaba una clase de Word.
    fireEvent.click(screen.getByText('Salir'));
    expect(screen.getByText('Sube al escenario del festival')).toBeInTheDocument();
  });

  it('se puede salir a media práctica y volver a entrar', () => {
    montar();
    entrar();
    empezar();
    irA('Baile');
    poner('p-baile', 'saltar');
    fireEvent.click(screen.getByText('Salir'));
    expect(screen.getByText('Sube al escenario del festival')).toBeInTheDocument();

    entrar();
    expect(screen.getByTestId('blqs-portada')).toBeInTheDocument();
  });

  it('el baile de nueve bloques y el de tres llamadas dejan la MISMA cinta', () => {
    montar();
    entrar();
    empezar();

    irA('Baile');
    for (let i = 0; i < 3; i += 1) {
      poner('p-baile', 'saltar');
      poner('p-baile', 'girar');
      poner('p-baile', 'aplaudir');
    }
    correr();
    const conNueve = screen.getByTestId('bp-cinta').textContent;
    expect(screen.getByTestId('bp-cinta').querySelectorAll('.bp-chip')).toHaveLength(9);
    // Quien se adelanta y pone los nueve de una vez cumple 1 y 2 en la misma
    // corrida: los encargos encadenan en vez de atascarse.
    expect(numeroDeEncargo()).toBe('Encargo 3/8');

    // Ahora lo mismo, con el bloque propio.
    vaciarGuion('p-baile');
    poner('p-paso', 'saltar');
    poner('p-paso', 'girar');
    poner('p-paso', 'aplaudir');
    irA('Mis bloques');
    poner('p-baile', 'llamar-paso');
    poner('p-baile', 'llamar-paso');
    poner('p-baile', 'llamar-paso');
    correr();

    expect(screen.getByTestId('bp-cinta').textContent).toBe(conNueve);
    expect(screen.getByTestId('bp-pasos')).toHaveTextContent('3');
    expect(bloquesDelGuion('p-baile')).toHaveLength(3);
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
    fireEvent.click(document.querySelector('[data-sitio="pila:p-baile:0"] button')!);
    expect(screen.getByTestId('blq-aviso')).toHaveTextContent('Primero toca una pieza de la paleta');
  });

  it('poner el paso en el guion equivocado no adelanta el encargo', () => {
    montar();
    entrar();
    empezar();
    irA('Baile');
    poner('p-paso', 'saltar');
    poner('p-paso', 'girar');
    poner('p-paso', 'aplaudir');
    correr();
    // El tronco sigue vacío: no bailó nadie y el encargo 1 sigue puesto.
    expect(numeroDeEncargo()).toBe('Encargo 1/8');
    expect(screen.getByTestId('bp-cinta')).toHaveTextContent('Todavía no se movió');
  });

  it('deshacer lo hecho no borra un encargo ya cumplido', () => {
    montar();
    entrar();
    empezar();
    irA('Baile');
    poner('p-baile', 'saltar');
    poner('p-baile', 'girar');
    poner('p-baile', 'aplaudir');
    correr();
    expect(numeroDeEncargo()).toBe('Encargo 2/8');

    vaciarGuion('p-baile');
    expect(numeroDeEncargo()).toBe('Encargo 2/8');
    expect(encargo()).toBe('Tres veces, a mano');
  });

  it('el mundo vuelve al principio en cada ▶: dos corridas iguales dan la misma cinta', () => {
    montar();
    entrar();
    empezar();
    irA('Baile');
    poner('p-baile', 'saltar');
    poner('p-baile', 'girar');
    poner('p-baile', 'aplaudir');
    correr();
    const primera = screen.getByTestId('bp-cinta').textContent;
    correr();
    expect(screen.getByTestId('bp-cinta').textContent).toBe(primera);
  });

  it('fallar la pregunta final resta seis puntos, y la misma equivocación no resta dos veces', () => {
    const { onComplete } = montar();
    entrar();
    empezar();
    jugarBien();
    expect(encargo()).toBe('¿Por qué cambiaron las tres?');

    fireEvent.click(screen.getByText('Porque Chispa se aprendió el paso de memoria'));
    fireEvent.click(screen.getByText('Porque Chispa se aprendió el paso de memoria'));
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Porque las tres llamadas apuntan al mismo guion'));
    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(94);
  });

  it('Bit dice lo que se aprendió en cada encargo, no una frase genérica', () => {
    montar();
    entrar();
    empezar();
    irA('Baile');
    poner('p-baile', 'saltar');
    poner('p-baile', 'girar');
    poner('p-baile', 'aplaudir');
    correr();
    expect(bitDice()).toMatch(/saltar, girar y aplaudir/);
  });
});
