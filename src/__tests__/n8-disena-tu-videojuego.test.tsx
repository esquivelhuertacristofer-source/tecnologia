/**
 * `n8-disena-tu-videojuego` · N8·«Producción multimedia y videojuegos», parada 3.
 * **13–14 años**, leído en `curriculo.ts`. Documento maestro §67.
 *
 * Cómo está repartida esta suite:
 *
 *  · **Lo que corrige se prueba como función.** Cada `comprobarE*` es pura
 *    `(nivel, pruebas) → boolean`; se mide con el guion correcto Y con su
 *    señuelo (el salto sin `si`, la puerta sin condición, el impulso de 12),
 *    para que ninguna sea verde y hueca.
 *  · **La clase se juega entera por la pantalla, sin ratón**: tocar la ficha,
 *    tocar el hueco; tocar una casilla del nivel; mover un deslizador; pulsar
 *    🧪 y esperar a los tres jugadores de prueba de verdad. jsdom no tiene
 *    `PointerEvent`, así que el arrastre no se prueba aquí (`trampas-de-jsdom`).
 *  · **Y se juega MAL a propósito**: ▶ sin guiones, «saltar» sin condición,
 *    la puerta tramposa, cambiar de actor a media edición, cambiar el nivel
 *    después de probarlo (las pruebas caducan y el panel vuelve atrás), la
 *    tercera pista y la respuesta equivocada.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import EntradaDisenaTuVideojuego from '@/components/activities/n8/videojuegos/EntradaDisenaTuVideojuego';
import {
  ENCARGOS,
  TICS_MINIMOS_EXPERTO,
  TOTAL_ENCARGOS,
  comprobar,
  comprobarE1,
  comprobarE2,
  comprobarE3,
  comprobarE6,
  comprobarE7,
  comprobarE8,
  type Pruebas,
} from '@/components/activities/n8/videojuegos/LabDisenaTuVideojuego';
import { ID_HEROE, ID_PUERTA, IDS_MONEDAS, IDS_PINCHOS, nivelLaMina } from '@/components/activities/n8/videojuegos/nivelLaMina';
import {
  cambiarPropiedad,
  meterSi,
  meterVarias,
  perfil,
  ponerActor,
  ponerGuiones,
  ponerLoseta,
  probarNivel,
  type Nivel,
  type PerfilId,
  type ResultadoPrueba,
} from '@/components/simuladores/juego';
import { CURRICULO } from '@/data/curriculo';

/* ───────────────────────── niveles armados sin ratón ──────────────────────── */

function guion(n: Nivel, id: string, sombrero: string, fichas: readonly string[]): Nivel {
  const a = n.actores.find((x) => x.id === id);
  if (!a) throw new Error(`sin ${id}`);
  return ponerGuiones(n, id, meterVarias(a.guiones, id, sombrero, fichas));
}

function conCaminar(n: Nivel): Nivel {
  return guion(guion(n, ID_HEROE, 'mientras-derecha', ['mover-derecha']), ID_HEROE, 'mientras-izquierda', ['mover-izquierda']);
}

function conSaltoBueno(n: Nivel): Nivel {
  const a = n.actores.find((x) => x.id === ID_HEROE);
  if (!a) throw new Error('sin héroe');
  return ponerGuiones(n, ID_HEROE, meterSi(a.guiones, ID_HEROE, 'al-pulsar-espacio', 'en-el-suelo', ['saltar']).programa);
}

function conMonedasYPinchos(n: Nivel): Nivel {
  let m = n;
  for (const id of IDS_MONEDAS) m = guion(m, id, 'al-tocar-heroe', ['sumar-puntos', 'desaparecer']);
  for (const id of IDS_PINCHOS) m = guion(m, id, 'al-tocar-heroe', ['perder-vida', 'volver-al-inicio']);
  return m;
}

function conPuertaBuena(n: Nivel): Nivel {
  const a = n.actores.find((x) => x.id === ID_PUERTA);
  if (!a) throw new Error('sin puerta');
  const g = meterSi(a.guiones, ID_PUERTA, 'al-tocar-heroe', 'todas-las-monedas', ['ganar'], { sino: ['decir'] }).programa;
  return ponerGuiones(n, ID_PUERTA, g);
}

function seisResueltos(): Nivel {
  let n = nivelLaMina();
  n = conCaminar(n);
  n = conSaltoBueno(n);
  n = cambiarPropiedad(n, ID_HEROE, 'impulso', 6.5);
  n = conMonedasYPinchos(n);
  n = conPuertaBuena(n);
  return n;
}

function pruebasDe(nivel: Nivel): Pruebas {
  const cache: Partial<Record<PerfilId, ResultadoPrueba>> = {};
  return {
    vigente: (id) => {
      if (!cache[id]) cache[id] = probarNivel(nivel, perfil(id));
      return cache[id] ?? null;
    },
  };
}

/* ────────────────────────────── el currículo ─────────────────────────────── */

describe('el currículo', () => {
  test('la actividad existe en N8, en la unidad de multimedia y videojuegos, para 13–14 años', () => {
    const n8 = CURRICULO.find((n) => n.n === 8);
    expect(n8?.edad).toMatch(/13/);
    const unidad = n8?.unidades.find((u) => u.actividades.some((a) => a.id === 'n8-disena-tu-videojuego'));
    expect(unidad?.titulo).toMatch(/videojuegos/i);
  });
});

/* ─────────────────────────── las comprobaciones ──────────────────────────── */

describe('las comprobaciones, con el guion correcto y con el señuelo', () => {
  const SIN: Pruebas = { vigente: () => null };

  test('E1 rechaza el nivel vacío y acepta caminar', () => {
    expect(comprobarE1(nivelLaMina(), SIN)).toBe(false);
    expect(comprobarE1(conCaminar(nivelLaMina()), SIN)).toBe(true);
    /* «saltar» bajo «mientras →» no es caminar. */
    expect(comprobarE1(guion(nivelLaMina(), ID_HEROE, 'mientras-derecha', ['saltar']), SIN)).toBe(false);
  });

  test('E2 rechaza el salto sin condición (vuela) y acepta el salto con «si ¿en el suelo?»', () => {
    const base = conCaminar(nivelLaMina());
    expect(comprobarE2(base, SIN)).toBe(false);
    expect(comprobarE2(guion(base, ID_HEROE, 'al-pulsar-espacio', ['saltar']), SIN)).toBe(false);
    expect(comprobarE2(conSaltoBueno(base), SIN)).toBe(true);
  });

  test('E3 rechaza el impulso de fábrica y el de 12; acepta 6,5', () => {
    const base = conSaltoBueno(conCaminar(nivelLaMina()));
    expect(comprobarE3(base, SIN)).toBe(false);
    expect(comprobarE3(cambiarPropiedad(base, ID_HEROE, 'impulso', 12), SIN)).toBe(false);
    expect(comprobarE3(cambiarPropiedad(base, ID_HEROE, 'impulso', 6.5), SIN)).toBe(true);
    /* Y sin saber saltar, ningún número sirve. */
    expect(comprobarE3(cambiarPropiedad(conCaminar(nivelLaMina()), ID_HEROE, 'impulso', 6.5), SIN)).toBe(false);
  });

  test('E6 rechaza la puerta que gana siempre y la que nunca gana; acepta el «si … si no»', () => {
    const base = conMonedasYPinchos(nivelLaMina());
    expect(comprobarE6(base, SIN)).toBe(false);
    expect(comprobarE6(guion(base, ID_PUERTA, 'al-tocar-heroe', ['ganar']), SIN)).toBe(false);
    expect(comprobarE6(guion(base, ID_PUERTA, 'al-tocar-heroe', ['decir']), SIN)).toBe(false);
    expect(comprobarE6(conPuertaBuena(base), SIN)).toBe(true);
  });

  test('E7 exige cambiar La mina y una prueba VIGENTE del jugador medio', () => {
    const resuelta = seisResueltos();
    /* Sin tocar el plano, aunque sea terminable, no es «tu nivel». */
    expect(comprobarE7(resuelta, pruebasDe(resuelta))).toBe(false);
    const propio = ponerLoseta(ponerLoseta(resuelta, 9, 11, 1), 10, 11, 1);
    expect(comprobarE7(propio, SIN)).toBe(false);
    expect(comprobarE7(propio, pruebasDe(propio))).toBe(true);
  });

  test('E8 rechaza el nivel trivial (la puerta pegada al héroe) y acepta el equilibrado', () => {
    const propio = ponerLoseta(ponerLoseta(seisResueltos(), 9, 11, 1), 10, 11, 1);
    expect(comprobarE8(propio, pruebasDe(propio))).toBe(true);
    /* La puerta al lado del héroe: el experto termina en un suspiro, sin saltar. */
    const puerta = propio.actores.find((a) => a.id === ID_PUERTA);
    if (!puerta) throw new Error('sin puerta');
    const sinMonedas = { ...propio, actores: propio.actores.filter((a) => a.tipo !== 'moneda') };
    const trivial = ponerActor(sinMonedas, { ...puerta, cx: 2, cy: 10 });
    const pruebas = pruebasDe(trivial);
    const experto = pruebas.vigente('experto');
    expect(experto?.terminable).toBe(true);
    expect(experto?.ticsRuta ?? 999).toBeLessThan(TICS_MINIMOS_EXPERTO);
    expect(comprobarE8(trivial, pruebas)).toBe(false);
  });

  test('el cierre es una sola pregunta de elección con la respuesta (a)', () => {
    const cierre = ENCARGOS[TOTAL_ENCARGOS - 1];
    expect(ENCARGOS.filter((e) => e.logro.tipo === 'eleccion')).toHaveLength(1);
    expect(comprobar(cierre, nivelLaMina(), undefined, 0)).toBe(true);
    expect(comprobar(cierre, nivelLaMina(), undefined, 1)).toBe(false);
  });
});

/* ──────────────────────────── jugar por la pantalla ──────────────────────── */

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(<EntradaDisenaTuVideojuego config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
  return { ...utils, onProgress, onScore, onComplete };
}

const entrar = () => fireEvent.click(screen.getByText('Abre Tecnia Juegos'));
const empezar = () => fireEvent.click(screen.getByTestId('blqs-empezar'));

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

function ponerEnPila(pila: string, fichaId: string) {
  tomar(fichaId);
  tocar(`[data-pila="${pila}"] > .blq-cola > button`, `No hay cola en la pila ${pila}`);
}

function ponerEnBoca(bloqueId: string, rama: string, fichaId: string) {
  tomar(fichaId);
  tocar(`[data-bloque="${bloqueId}"] > .blq-boca[data-rama="${rama}"] > .blq-cola > button`, `No hay boca ${rama} en ${bloqueId}`);
}

function ponerPregunta(bloqueId: string, fichaId: string) {
  tomar(fichaId);
  tocar(`[data-sitio="hueco:${bloqueId}"] button`, `No hay hueco libre en ${bloqueId}`);
}

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

function quitarDelTronco(pila: string, indice: number) {
  const bloque = troncoDe(pila)[indice];
  const equis = bloque?.querySelector('.blq-quitar');
  if (!equis) throw new Error(`No hay bloque nº ${indice} en ${pila}`);
  fireEvent.click(equis);
}

const casilla = (cx: number, cy: number) => tocar(`[data-casilla="${cx},${cy}"]`, `No hay casilla ${cx},${cy}`);
const herramienta = (clave: string) => fireEvent.click(screen.getByTestId(`jg-herr-${clave}`));
const encargo = () => screen.getByTestId('blqs-panel').querySelector('.blqs-panel-titulo')?.textContent;
const bitDice = () => document.querySelector('.bit-globo')?.textContent ?? '';
const puntos = () => document.querySelector('.marcador-led')?.textContent ?? '';

async function esperarPruebas() {
  await waitFor(
    () => {
      for (const id of ['novato', 'medio', 'experto']) {
        const estado = screen.getByTestId(`jg-prueba-${id}`).getAttribute('data-estado');
        if (estado !== 'bien' && estado !== 'mal') throw new Error(`${id}: ${estado}`);
      }
    },
    { timeout: 20000 },
  );
}

describe('la clase, jugada por la pantalla y jugada mal', () => {
  test('el recorrido completo: nueve encargos, tres actores programados, un nivel probado por tres jugadores', async () => {
    const { onProgress, onComplete } = montar();

    /* El video REGRABADO (12-sep-2026) ya está publicado: la entrada lo
     * muestra y ya no ensena el marcador de «se esta grabando». El de Unity,
     * que era el defecto de `video-contra-laboratorio`, se fue con el guion
     * viejo. */
    expect(screen.queryByText(/todavía se está grabando/)).toBeNull();
    expect(document.querySelector('video')).not.toBeNull();
    entrar();
    expect(screen.getByTestId('blqs-portada')).toHaveTextContent('Diseñadora de niveles');
    empezar();
    expect(encargo()).toBe('Que camine');
    expect(bitDice()).toMatch(/no se mueve/);

    /* ▶ sin guiones: el héroe se queda quieto y Bit lo dice. */
    fireEvent.click(screen.getByTestId('jg-jugar'));
    expect(bitDice()).toMatch(/no tiene guiones/);
    expect(screen.getByTestId('jg-hud')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('jg-parar'));

    /* Sin actor elegido no hay editor de guiones. */
    expect(screen.queryByTestId('blq')).toBeNull();

    /* Las tres pistas de E1: la tercera resta. */
    expect(puntos()).toMatch(/100/);
    fireEvent.click(screen.getByTestId('dv-mas-pista'));
    fireEvent.click(screen.getByTestId('dv-mas-pista'));
    expect(screen.getAllByTestId('dv-pista')).toHaveLength(2);
    expect(puntos()).toMatch(/100/);
    fireEvent.click(screen.getByTestId('dv-mas-pista'));
    expect(screen.getAllByTestId('dv-pista')).toHaveLength(3);
    expect(puntos()).toMatch(/94/);

    /* ── E1: elegir al héroe y caminar ───────────────────────────────── */
    casilla(1, 10);
    expect(screen.getByTestId('jg-props')).toHaveAttribute('data-actor', 'heroe');
    expect(screen.getByTestId('blq')).toBeInTheDocument();
    /* «saltar» bajo → no es caminar: E1 sigue. */
    ponerEnPila('heroe:mientras-derecha', 'saltar');
    expect(encargo()).toBe('Que camine');
    quitarDelTronco('heroe:mientras-derecha', 0);
    ponerEnPila('heroe:mientras-derecha', 'mover-derecha');
    expect(encargo()).toBe('Que camine');
    ponerEnPila('heroe:mientras-izquierda', 'mover-izquierda');
    expect(encargo()).toBe('Que salte, pero una vez');
    expect(bitDice()).toMatch(/Ya camina/);

    /* Cambiar de actor a media edición no pierde el guion del héroe. */
    casilla(3, 10);
    expect(screen.getByTestId('jg-props')).toHaveAttribute('data-actor', 'moneda-1');
    expect(document.querySelector('[data-pila="heroe:mientras-derecha"]')).toBeNull();
    casilla(1, 10);
    expect(fichasDelTronco('heroe:mientras-derecha')).toEqual(['mover-derecha']);

    /* ── E2: el salto infinito, y luego el bueno ─────────────────────── */
    ponerEnPila('heroe:al-pulsar-espacio', 'saltar');
    expect(encargo()).toBe('Que salte, pero una vez');
    quitarDelTronco('heroe:al-pulsar-espacio', 0);
    ponerEnPila('heroe:al-pulsar-espacio', 'si');
    const si = idDe('heroe:al-pulsar-espacio', 'si');
    ponerPregunta(si, 'en-el-suelo');
    expect(encargo()).toBe('Que salte, pero una vez');
    ponerEnBoca(si, 'cuerpo', 'saltar');
    expect(encargo()).toBe('Que llegue a la repisa');

    /* Borrar el «si» después de cumplir: el panel VUELVE a E2. */
    quitarDelTronco('heroe:al-pulsar-espacio', 0);
    expect(encargo()).toBe('Que salte, pero una vez');
    ponerEnPila('heroe:al-pulsar-espacio', 'si');
    const si2 = idDe('heroe:al-pulsar-espacio', 'si');
    ponerPregunta(si2, 'en-el-suelo');
    ponerEnBoca(si2, 'cuerpo', 'saltar');
    expect(encargo()).toBe('Que llegue a la repisa');

    /* ── E3: el impulso ──────────────────────────────────────────────── */
    expect(screen.getByTestId('jg-salto')).toHaveTextContent('1.8');
    const impulso = document.getElementById('jg-prop-heroe-impulso');
    if (!impulso) throw new Error('sin deslizador de impulso');
    fireEvent.change(impulso, { target: { value: '12' } });
    expect(screen.getByTestId('jg-salto')).toHaveTextContent('12.9');
    expect(encargo()).toBe('Que llegue a la repisa');
    fireEvent.change(impulso, { target: { value: '6.5' } });
    expect(screen.getByTestId('jg-salto')).toHaveTextContent('3.8');
    expect(encargo()).toBe('La moneda vale');

    /* ── E4: las cuatro monedas ──────────────────────────────────────── */
    const monedas: [string, number, number][] = [
      ['moneda-1', 3, 10],
      ['moneda-2', 6, 7],
      ['moneda-3', 13, 10],
      ['moneda-4', 18, 7],
    ];
    for (const [id, cx, cy] of monedas) {
      casilla(cx, cy);
      expect(screen.getByTestId('jg-props')).toHaveAttribute('data-actor', id);
      ponerEnPila(`${id}:al-tocar-heroe`, 'sumar-puntos');
      ponerEnPila(`${id}:al-tocar-heroe`, 'desaparecer');
    }
    expect(encargo()).toBe('El pincho duele');

    /* ── E5: el pincho ───────────────────────────────────────────────── */
    casilla(15, 10);
    ponerEnPila('pincho-1:al-tocar-heroe', 'perder-vida');
    expect(encargo()).toBe('El pincho duele');
    ponerEnPila('pincho-1:al-tocar-heroe', 'volver-al-inicio');
    expect(encargo()).toBe('La puerta pide las monedas');

    /* ── E6: la puerta tramposa, y luego la buena ────────────────────── */
    casilla(20, 7);
    ponerEnPila('puerta:al-tocar-heroe', 'ganar');
    expect(encargo()).toBe('La puerta pide las monedas');
    quitarDelTronco('puerta:al-tocar-heroe', 0);
    ponerEnPila('puerta:al-tocar-heroe', 'si-sino');
    const siSino = idDe('puerta:al-tocar-heroe', 'si-sino');
    ponerPregunta(siSino, 'todas-las-monedas');
    ponerEnBoca(siSino, 'cuerpo', 'ganar');
    expect(encargo()).toBe('La puerta pide las monedas');
    ponerEnBoca(siSino, 'sino', 'decir');
    expect(encargo()).toBe('Diseña tu nivel');

    /* Jugar a mano con todo puesto: la partida arranca y se para al editar. */
    fireEvent.click(screen.getByTestId('jg-jugar'));
    expect(screen.getByTestId('jg-escenario')).toHaveAttribute('data-modo', 'jugar');
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowRight' });
    });
    fireEvent.click(screen.getByTestId('jg-parar'));
    expect(screen.getByTestId('jg-escenario')).toHaveAttribute('data-modo', 'editar');

    /* ── E7: tapar el hueco y probar con jugadores ───────────────────── */
    fireEvent.click(screen.getByTestId('jg-probar'));
    await esperarPruebas();
    /* La mina sin cambiar no es «tu nivel», aunque se pueda terminar. */
    expect(screen.getByTestId('jg-prueba-medio')).toHaveAttribute('data-estado', 'bien');
    expect(encargo()).toBe('Diseña tu nivel');

    herramienta('loseta-1');
    casilla(9, 11);
    casilla(10, 11);
    /* El nivel cambió: las pruebas caducan. */
    expect(screen.getByTestId('jg-prueba-medio')).toHaveAttribute('data-estado', 'nada');
    expect(screen.getByTestId('jg-pruebas')).toHaveTextContent(/el nivel cambió/);
    fireEvent.click(screen.getByTestId('jg-probar'));
    await esperarPruebas();
    expect(screen.getByTestId('jg-prueba-experto')).toHaveAttribute('data-estado', 'bien');
    expect(screen.getAllByTestId('jg-calavera').length).toBeGreaterThan(0);

    /* E7 y E8 caen juntos: los tres terminan y al experto le cuesta. */
    expect(encargo()).toMatch(/Por qué se prueba/);

    /* Cambiar el nivel otra vez devuelve el panel a E7. */
    casilla(8, 9);
    expect(encargo()).toBe('Diseña tu nivel');
    fireEvent.click(screen.getByTestId('jg-probar'));
    await esperarPruebas();
    expect(encargo()).toMatch(/Por qué se prueba/);

    /* ── E9: la respuesta equivocada resta; la buena cierra ──────────── */
    expect(puntos()).toMatch(/94/);
    fireEvent.click(screen.getByText('Porque así se ve si los gráficos gustan'));
    expect(puntos()).toMatch(/88/);
    fireEvent.click(screen.getByText(/el autor ya sabe dónde está cada trampa/));

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(screen.getByText(/Insignia · Diseñadora de niveles/)).toBeInTheDocument();
    expect(onProgress).toHaveBeenLastCalledWith(1);
  }, 90000);

  test('Salir desde la práctica vuelve a la portada al reentrar', () => {
    montar();
    entrar();
    empezar();
    expect(screen.getByTestId('jg')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Salir'));
    expect(screen.queryByTestId('jg')).toBeNull();
  });
});
