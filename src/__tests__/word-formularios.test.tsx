/**
 * `of-word-formularios` · «Una ficha que se rellena sola» — recorrido de punta a
 * punta. Ocho encargos, y el único de la sala en el que el documento se cierra a
 * media clase: a partir del encargo 6 la ficha está protegida y `filterTransaction`
 * rechaza todo lo que no caiga dentro de un hueco gris.
 *
 * Eso la pone justo donde el motor puede retroceder: `primerDeshecho` vuelve a
 * releer los cuatro encargos de tipo `documento` que quedan por debajo —los tres
 * huecos y la protección misma— en cada transacción, y la protección es lo único
 * de la clase que se puede quitar sin tocar el documento.
 *
 * Los gestos de dentro de la hoja se hacen como los haría el teclado y no como
 * los haría el ratón, y no es una comodidad: en jsdom un clic sintético no llega
 * al `handleClick` de ProseMirror, pero un `keydown` sí llega al `handleKeyDown`.
 * La clase tiene los dos caminos escritos a propósito —«sin esto la clase no se
 * puede terminar sin ratón»— así que se juega el que se puede jugar, que es un
 * camino de verdad del alumno y no un atajo de prueba.
 *
 * ── LO QUE ENCONTRÓ EL RECORRIDO ────────────────────────────────────────────
 *
 * La clase se termina entera y una partida limpia saca 100 sin tocarle nada.
 * Aguanta los dos callejones que tenía apuntados de agosto: la protección puesta
 * mal —«Sin cambios (Sólo lectura)», que bloquea hasta los huecos— tiene salida
 * porque el panel dice CÓMO salir, y el recado hace falta de verdad, porque ahí
 * nadie pulsó un botón de la cinta y la pista del maestro no llega sola.
 *
 * Lo único que hay que saber para jugarla: al suspender una protección, el panel
 * **conserva marcada** la casilla de «Permitir sólo este tipo de edición». Es
 * correcto —la pista dice «vuelve a elegir», no «vuelve a marcar»— pero una
 * prueba que la pulse a ciegas la apaga y el botón de aplicar contesta «primero
 * marca…». Por eso `marcarPermitirSoloEsto` mira antes de pulsar: nadie desmarca
 * una casilla que ya está marcada.
 */

import { fireEvent, screen } from '@testing-library/react';
import { TextSelection } from 'prosemirror-state';
import { Lab } from '@/components/activities/office/word/formularios/Lab';
import {
  camposDeLaCelda,
  celdaDeLaFicha,
  formulario,
  OPCIONES_EQUIPO,
} from '@/components/activities/office/word/formularios/formulario';
import {
  celebrar,
  confirmar,
  elegir,
  encargo,
  escribir,
  irAPestana,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seTermino,
  textoDelDocumento,
  vista,
} from './ayuda-word';

/* ── los gestos dentro de la ficha ──────────────────────────────────────────*/

/** Un clic dentro de una casilla de la tabla: el cursor, y nada más. */
function clicEnLaCelda(fila: number, columna: number) {
  const v = vista();
  const celda = celdaDeLaFicha(v.state.doc, fila, columna);
  if (!celda) throw new Error(`la ficha no tiene celda (${fila}, ${columna})`);
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, celda.desde + 2)));
}

/** El cursor dentro del hueco de esa celda, que es de donde lo lee el aparato. */
function cursorEnElHueco(fila: number, columna: number, cual = 0) {
  const v = vista();
  const campo = camposDeLaCelda(v.state.doc, fila, columna)[cual];
  if (!campo) throw new Error(`no hay hueco en la celda (${fila}, ${columna})`);
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, campo.desde, campo.hasta)));
  return campo;
}

/** Teclear encima del «Escribe aquí», que es lo que deja el clic en un hueco. */
function contestarElHueco(fila: number, texto: string) {
  cursorEnElHueco(fila, 1);
  escribir(texto);
}

/** La barra espaciadora sobre un hueco que no se escribe: palomea o abre. */
function teclaEnElHueco(fila: number, tecla: string) {
  const campo = cursorEnElHueco(fila, 1);
  const v = vista();
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, campo.hasta)));
  fireEvent.keyDown(v.dom, { key: tecla });
}

/* ── los ocho encargos ──────────────────────────────────────────────────────*/

function paso1() {
  irAPestana('insertar');
  clicEnLaCelda(0, 1);
  pulsar('campo-texto');
}

function paso2() {
  clicEnLaCelda(2, 1);
  pulsar('campo-lista');
}

function paso3() {
  clicEnLaCelda(3, 1);
  pulsar('campo-casilla');
}

const paso4 = () => elegir('Revisar');

function paso5() {
  irAPestana('revisar');
  pulsar('restringir');
}

/**
 * Marca la casilla del panel si no lo estaba ya.
 *
 * Nadie desmarca una casilla que ya está marcada, y aquí importa: al suspender
 * una protección puesta mal, el panel **conserva la casilla marcada**, y volver
 * a pulsarla la apagaría y el botón de aplicar contestaría «primero marca…».
 */
function marcarPermitirSoloEsto() {
  const casilla = screen.getByLabelText(/Permitir sólo este tipo de edición/) as HTMLInputElement;
  if (!casilla.checked) fireEvent.click(casilla);
}

/** Las tres cosas del panel: marcar, elegir la regla y aplicar. */
function aplicarLaRegla(regla: 'formularios' | 'lectura') {
  marcarPermitirSoloEsto();
  fireEvent.change(screen.getByLabelText('Tipo de edición permitida'), { target: { value: regla } });
  fireEvent.click(screen.getByText('Sí, aplicar la protección'));
}

const paso6 = () => aplicarLaRegla('formularios');

const paso7 = () => confirmar('Ya lo vi');

/** Contestar la ficha entera con el candado puesto. */
function paso8() {
  contestarElHueco(0, 'Renata Ibarra Solano');
  contestarElHueco(1, '2º B');
  teclaEnElHueco(2, 'Enter');
  fireEvent.click(screen.getByText(OPCIONES_EQUIPO[1]));
  teclaEnElHueco(3, ' ');
}

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7, paso8];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('of-word-formularios', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina, y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    // La ficha quedó contestada y con el candado de «Rellenar formularios».
    expect(formulario.modo).toBe('formularios');
    expect(textoDelDocumento()).toContain('Renata Ibarra Solano');
    expect(textoDelDocumento()).toContain('Brazos mecánicos');
    expect(textoDelDocumento()).toContain('☒');

    expect(partida.onComplete).toHaveBeenCalledTimes(1);
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 1 · el hueco nace donde está el cursor, y en el título no vale', async () => {
    await jugarDesdeLaPortada(Lab);
    expect(encargo()).toBe('El primer hueco');

    // JUGAR MAL · pulsar el botón sin haber hecho clic dentro de la casilla: el
    // cursor arranca en el membrete y el hueco gris cae en mitad del título.
    irAPestana('insertar');
    pulsar('campo-texto');
    await celebrar();
    expect(encargo()).toBe('El primer hueco');
    expect(textoDelDocumento()).toContain('Escribe aquí');

    pulsar('deshacer');
    await celebrar();
    paso1();
    await celebrar();
    expect(encargo()).toBe('Cuando sólo hay tres respuestas');
  });

  it('la regla que no era deja la ficha muerta, y suspenderla despaloma su encargo', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(5);
    expect(encargo()).toBe('Elige bien la regla');

    // JUGAR MAL · «Sin cambios (Sólo lectura)», que bloquea hasta los huecos.
    aplicarLaRegla('lectura');
    await celebrar();
    expect(encargo()).toBe('Elige bien la regla');
    // El panel dice cómo salir: nadie pulsó un botón de la cinta, así que la
    // pista del maestro no llega sola y sin este recado no hay salida.
    expect(screen.getByText(/sólo lectura/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Suspender la protección'));
    await celebrar();
    paso6();
    await celebrar();
    expect(encargo()).toBe('Antes de confiarte, mira esto');

    // Y quitar el candado despaloma su propio encargo: el motor retrocede al 6.
    fireEvent.click(screen.getByText('Suspender la protección'));
    await celebrar();
    expect(encargo()).toBe('Elige bien la regla');
  });
});
