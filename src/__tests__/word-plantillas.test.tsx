/**
 * `of-word-plantillas` · «Lo que sale en todas las hojas» — recorrido de punta a
 * punta. Ocho encargos.
 *
 * ── POR QUÉ ESTA CLASE NECESITA UNA MAQUETA DE MENTIRA ──────────────────────
 *
 * Es la única de las cuatro cuyos dos últimos encargos **no se pueden contestar
 * leyendo el documento**: el 7 pregunta en qué HOJA cayó un renglón y el 8
 * cuenta cuántas HOJAS hay dibujadas. Las dos son preguntas de maquetación, y
 * jsdom no maqueta: `getBoundingClientRect` devuelve ceros y `Range.getClientRects`
 * una lista vacía —eso último ya está tapado en `jest.setup.ts`—, así que el
 * paginador mide un documento de altura cero, dibuja UNA hoja y la clase se
 * queda sin salida por una razón que no es suya.
 *
 * Aquí se le da a jsdom lo único que le falta: un renglón mide 36 px y cada
 * párrafo ocupa uno. Con eso, **el paginador de verdad** reparte las hojas y
 * **los predicados de verdad** de la clase las cuentan; no se ablanda ninguno de
 * los dos. La maqueta es local a este archivo a propósito: es una muleta de este
 * recorrido, no una pieza de la sala.
 *
 * ── LO QUE ENCONTRÓ EL RECORRIDO ────────────────────────────────────────────
 *
 * **Estaba rota, y por el error más previsible de su propio encargo 7.** El
 * encargo manda bajar a la hoja 2 y escribir ahí a mano el nombre que se puso en
 * el encabezado; el cursor, recién montada la plantilla, está arriba del todo.
 * Quien teclea sin bajar lo escribe en la hoja 1 —el encargo no se cierra, y eso
 * está bien—, lee la pista, baja, y lo escribe otra vez donde se le pide… y
 * seguía sin cerrarse: `hojaDelRenglonQueDice` devolvía la hoja del PRIMER
 * renglón que encontraba, y el primero era el de arriba. A partir de ahí no hay
 * salida —el panel pide algo que ya está hecho y nada dice que lo que sobra es el
 * renglón de la hoja 1—. Curado en `plantillas/estado.ts`: la pregunta del
 * encargo no es «¿dónde está la primera vez?» sino «¿lo escribiste en alguna
 * hoja que no sea la primera?», así que ahora devuelve la más abajo. La segunda
 * prueba de aquí es exactamente ese callejón, jugado.
 *
 * Lo otro que faltaba era del entorno, y lo comparte con `coautoria`:
 * `ResizeObserver` no existe en jsdom y la capa de encabezado y pie lo instancia
 * al montarse, así que el laboratorio ni siquiera arrancaba; y `scrollIntoView`
 * tampoco existe, y lo llama al abrir el encabezado. Curados los dos en
 * `jest.setup.ts`, donde ya viven los otros huecos del navegador.
 */

import { act, fireEvent, screen } from '@testing-library/react';
import { TextSelection } from 'prosemirror-state';
import { PASO_PAGINA } from '@/components/office/motor/paginador';
import { LabPlantillas } from '@/components/activities/office/word/plantillas/Lab';
import {
  celebrar,
  cursorAlFinalDe,
  elegir,
  encargo,
  escribir,
  irAPestana,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seTermino,
  teclaEnter,
  textoDelDocumento,
  vista,
} from './ayuda-word';

/**
 * Ctrl + Fin, que es lo que la instrucción del último encargo manda pulsar.
 *
 * No vale `cursorAlFinalDe` con el texto del último bloque: en las tres
 * plantillas el último bloque es una LISTA, y una lista no admite un cursor
 * dentro suyo —«TextSelection endpoint not pointing into a node with inline
 * content»—. Es local a este archivo porque es de esta clase.
 */
function alFinalDelDocumento() {
  const v = vista();
  v.dispatch(v.state.tr.setSelection(TextSelection.atEnd(v.state.doc)));
}

/* ── la maqueta de mentira ──────────────────────────────────────────────────*/

/** Lo que mide un renglón. Con esto las tres plantillas dan tres hojas. */
const ALTO_RENGLON = 36;
const SELECTOR_RENGLON = 'p, h1, h2, h3';

let rectanguloDeVerdad: typeof Element.prototype.getBoundingClientRect;

/**
 * Cada párrafo, un renglón; cada renglón, 36 px. Un bloque que contiene varios
 * —una lista— ocupa la suma de los suyos, que es lo que el paginador espera.
 */
function fingirLaMaqueta() {
  rectanguloDeVerdad = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function medida(this: Element) {
    const flujo = document.querySelector('.txtw-flujo');
    if (!flujo || (this !== flujo && !flujo.contains(this))) return rectanguloDeVerdad.call(this);
    const renglones = Array.from(flujo.querySelectorAll(SELECTOR_RENGLON));
    const mios = renglones
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r === this || this.contains(r));
    const desde = mios.length ? mios[0].i : 0;
    const hasta = mios.length ? mios[mios.length - 1].i + 1 : 0;
    const top = this === flujo ? 0 : desde * ALTO_RENGLON;
    const bottom = this === flujo ? renglones.length * ALTO_RENGLON : hasta * ALTO_RENGLON;
    return { x: 0, y: top, top, bottom, left: 0, right: 0, width: 0, height: bottom - top } as DOMRect;
  };
}

const quitarLaMaqueta = () => {
  Element.prototype.getBoundingClientRect = rectanguloDeVerdad;
};

/** Deja correr el reloj a trozos, para que React repinte entre uno y otro. */
async function respirar(ms = 800) {
  for (let i = 0; i < 8; i += 1) {
    await act(async () => {
      jest.advanceTimersByTime(ms / 8);
    });
  }
}

/** Los bloques de primer nivel tal como los ve el paginador, sin espaciadores. */
const bloquesDelFlujo = (): HTMLElement[] =>
  Array.from(document.querySelector('.txtw-flujo')?.children ?? []).filter(
    (el) => !el.hasAttribute('data-pag-espacio'),
  ) as HTMLElement[];

/** La hoja en la que cae un elemento, con la aritmética del propio paginador. */
const hojaDe = (el: HTMLElement) =>
  Math.floor((el.getBoundingClientRect().top + 6) / PASO_PAGINA) + 1;

const hojasDibujadas = () => document.querySelectorAll('.txtw-pila .txtw-hoja').length;

/* ── los ocho encargos ──────────────────────────────────────────────────────*/

const NOMBRE = 'Cuadernillo Ortega 2026';

function paso1() {
  irAPestana('insertar');
  pulsar('plantilla');
}

async function paso2() {
  fireEvent.click(document.querySelector('[data-plantilla="circular"]') as HTMLElement);
  // La plantilla se monta, el paginador reparte las hojas y la clase se apunta
  // cuántas había: ese último dato llega 350 ms después, y sin él el último
  // encargo nacería imposible.
  await respirar();
}

const paso3 = () => elegir('En el encabezado');
const paso4 = () => pulsar('encabezado');

const paso5 = () =>
  fireEvent.change(screen.getAllByLabelText('Encabezado, se repite en todas las hojas')[0], {
    target: { value: NOMBRE },
  });

const paso6 = () => pulsar('numero');

/** El error del tema, mandado hacer: el mismo nombre, a mano, en la hoja 2. */
function paso7() {
  const enLaDos = bloquesDelFlujo().find((el) => el.tagName === 'P' && hojaDe(el) === 2);
  if (!enLaDos) throw new Error('la plantilla no llegó a tener una hoja 2');
  cursorAlFinalDe((enLaDos.textContent ?? '').slice(0, 24));
  teclaEnter();
  escribir(NOMBRE);
}

/** Enter al final hasta que nazca una hoja más, como dice la instrucción. */
async function paso8() {
  const habia = hojasDibujadas();
  alFinalDelDocumento();
  for (let i = 0; i < 60 && hojasDibujadas() <= habia; i += 1) {
    teclaEnter();
    await respirar(120);
  }
}

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7, paso8];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('of-word-plantillas', () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true });
    fingirLaMaqueta();
  });
  afterEach(() => {
    quitarLaMaqueta();
    jest.useRealTimers();
  });

  it('la clase entera se termina, y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(LabPlantillas);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    // La plantilla se montó de verdad —el borrador de la maestra ya no está— y
    // el nombre quedó escrito a mano una sola vez, dentro del cuerpo.
    expect(textoDelDocumento()).not.toContain('borrador');
    expect(textoDelDocumento()).toContain(NOMBRE);

    expect(partida.onComplete).toHaveBeenCalledTimes(1);
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 7 · escribirlo a mano en la hoja 1 no vale: no habría nada que comparar', async () => {
    await jugarDesdeLaPortada(LabPlantillas);
    await hastaEl(6);
    expect(encargo()).toBe('Ahora hazlo mal a propósito');

    // JUGAR MAL · el nombre escrito arriba del todo, que es donde cae el cursor
    // de quien no ha bajado a la hoja 2.
    const primero = bloquesDelFlujo()[0];
    cursorAlFinalDe((primero.textContent ?? '').slice(0, 24));
    teclaEnter();
    escribir(NOMBRE);
    await respirar();
    expect(encargo()).toBe('Ahora hazlo mal a propósito');

    paso7();
    await respirar();
    await celebrar();
    expect(encargo()).toBe('Haz nacer una hoja más');
  });

  it('el encabezado se puede corregir después sin que la clase retroceda', async () => {
    const partida = await jugarDesdeLaPortada(LabPlantillas);
    await hastaEl(7);
    expect(encargo()).toBe('Haz nacer una hoja más');

    // JUGAR MAL · volver al encabezado y cambiarle el nombre. El encargo 7 se
    // corrige buscando en el documento «el mismo nombre que hay en el
    // encabezado»: con un ancla viva, corregirlo arriba despalomearía abajo y el
    // motor retrocedería un encargo acusando de deshacer lo que nadie deshizo.
    pulsar('encabezado');
    await celebrar();
    fireEvent.change(screen.getAllByLabelText('Encabezado, se repite en todas las hojas')[0], {
      target: { value: 'Escuela Primaria Ignacio Ramírez' },
    });
    await respirar();
    expect(encargo()).toBe('Haz nacer una hoja más');

    // Y desde ahí la clase se sigue terminando, con su único tropiezo cobrado.
    await paso8();
    await celebrar();
    expect(seTermino()).toBe(true);
    expect(partida.nota()).toMatchObject({ score: 94, stars: 3, errores: 1 });
  });
});
