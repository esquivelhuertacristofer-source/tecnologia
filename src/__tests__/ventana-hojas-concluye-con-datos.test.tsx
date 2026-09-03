/**
 * `n8-concluye-con-datos` · «Del número a la frase» (doc §49.4). La que cierra
 * N8 · «Datos y análisis», y la única clase de las tres salas de Office en la
 * que el alumno no construye nada: los datos ya están bien y lo que se pone a
 * prueba es qué se atreve a afirmar.
 *
 * Se juega **mal a propósito**: eligiendo las frases tramposas —que son las que
 * más gente elige, porque todas son ciertas—, tecleando el resultado en vez de
 * la cuenta, dividiendo al revés, y **cambiando de hoja en mitad de cada
 * encargo**, que es lo que esta clase pide todo el rato y lo que el modo guía
 * bloqueaba antes de que la señal declarara las tres lengüetas.
 *
 * Y se recorre entera hasta la pantalla de cierre: doce encargos, seis de
 * elección, uno de confirmar y cinco de escribir.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_BASICO } from '@/components/activities/office/tecniaHojas';
import { GUION_CONCLUYE_CON_DATOS } from '@/components/activities/office/excel/concluye-con-datos/guion';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

async function abrir(onTerminado?: jest.Mock) {
  const salida = render(
    <VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_CONCLUYE_CON_DATOS} onTerminado={onTerminado} />,
  );
  await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
  return salida;
}

async function abrirYEmpezar(onTerminado?: jest.Mock) {
  const salida = await abrir(onTerminado);
  fireEvent.click(screen.getByText('Abrir el libro'));
  await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());
  return salida;
}

const celda = (direccion: string): HTMLElement =>
  document.querySelector(`[data-celda="${direccion}"]`) as HTMLElement;

const boton = (control: string): HTMLElement =>
  document.querySelector(`[data-control="${control}"]`) as HTMLElement;

const rejilla = (): HTMLElement => document.querySelector('.hjw-rejilla') as HTMLElement;

const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';

/**
 * Las lengüetas de hoja no llevan `data-control`: se buscan por su clase.
 *
 * Y no por su texto, aunque parezca lo obvio: el encargo 10 dice «abre la hoja
 * **Eventos**» y esa palabra en negrita del panel es un segundo elemento con el
 * mismo texto, así que un `getByText('Eventos')` se cae con «found multiple
 * elements» justo en el encargo donde hace falta.
 */
function irAHoja(nombre: string) {
  const tabs = Array.from(document.querySelectorAll('.hjw-hoja-tab'));
  const tab = tabs.find((t) => t.textContent === nombre);
  if (!tab) throw new Error(`no hay lengüeta de hoja llamada «${nombre}»`);
  fireEvent.click(tab);
}

async function celebrar() {
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
}

function teclear(direccion: string, texto: string) {
  fireEvent.mouseDown(celda(direccion));
  fireEvent.keyDown(rejilla(), { key: texto[0] });
  const editor = document.querySelector('.hjw-editor') as HTMLInputElement;
  fireEvent.change(editor, { target: { value: texto } });
  fireEvent.keyDown(editor, { key: 'Enter' });
}

const elegir = (texto: RegExp) => fireEvent.click(screen.getByText(texto));

/* ── los doce encargos ──────────────────────────────────────────────────────*/

function paso1() {
  teclear('F4', '=(Salones!E10-Salones!D10)/Salones!D10');
  teclear('F5', '=Salones!E10-Salones!D10');
}

const paso2 = () => elegir(/pasó de 2 kilos a 4 kilos/);

function paso3() {
  teclear('F7', '=PROMEDIO(Salones!B4:B11)');
  teclear('F8', '=MAX(Salones!B4:B11)');
  teclear('F9', '=MIN(Salones!B4:B11)');
}

const paso4 = () => elegir(/Dos salones juntaron el 76/);

function paso5() {
  teclear('F11', '=Salones!B11/Salones!C11');
  teclear('F12', '=Salones!B9/Salones!C9');
}

const paso6 = () => elegir(/Por alumno, 3°B es el que más juntó/);

function paso7() {
  teclear('F14', '=SUMA(B4:B9)');
  teclear('F15', '=B6/B5');
}

const paso8 = () => elegir(/Febrero fue el mes más flojo/);

function paso9() {
  teclear('F17', '=MAX(B4:B9)');
  teclear('F18', '=PROMEDIO(B4:B9)');
}

function paso10() {
  irAHoja('Eventos');
  fireEvent.click(screen.getByText('Ya lo leí'));
}

const paso11 = () => elegir(/hay que comprobar si una cosa explica la otra/);
const paso12 = () => elegir(/Nuestra escuela juntó 1050 kilos/);

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7, paso8, paso9, paso10, paso11, paso12];

/**
 * Los encargos de `desde` a `hasta`, jugados bien.
 *
 * Con rango y no con tope, por lo mismo que en `n8-limpieza-de-datos`: seis de
 * los doce son elecciones y volver a pulsar una opción ya pasada no encuentra
 * el botón.
 */
async function jugar(desde: number, hasta: number) {
  for (let i = desde; i <= hasta; i += 1) {
    PASOS[i - 1]();
    await celebrar();
    // Los encargos 10 y 11 dejan al alumno en la hoja Eventos; las cuentas
    // viven todas en Meses, así que se vuelve como volvería él.
    if (i === 10) irAHoja('Meses');
  }
}

const hastaEl = (n: number) => jugar(1, n);

/* ── se pinta ───────────────────────────────────────────────────────────────*/

describe('VentanaHojas · n8-concluye-con-datos se pinta', () => {
  it('la portada anuncia el tema y las tres hojas traen datos correctos', async () => {
    await abrir();
    expect(screen.getByText('Qué se puede afirmar con unos datos, y qué no')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    // Meses: seis, con febrero hundido y abril disparado.
    expect(celda('A4').textContent).toBe('Enero');
    expect(celda('B5').textContent).toBe('95');
    expect(celda('B7').textContent).toBe('310');
    // Y la temperatura, que sube sola de enero a junio: el señuelo.
    expect(celda('C4').textContent).toBe('14');
    expect(celda('C9').textContent).toBe('26');
    // El tablero está rotulado y vacío: las once cuentas las escribe el alumno.
    expect(celda('E4').textContent).toBe('5°C: cuánto subió, en tanto por uno');
    expect(celda('F4').textContent).toBe('');
  });

  it('las otras dos hojas están y se puede llegar a ellas', async () => {
    await abrirYEmpezar();
    irAHoja('Salones');
    expect(celda('A10').textContent).toBe('5°C');
    expect(celda('D10').textContent).toBe('2');
    expect(celda('E10').textContent).toBe('4');
    irAHoja('Eventos');
    expect(celda('B5').textContent).toContain('900 botellas');
  });
});

/* ── jugando mal ────────────────────────────────────────────────────────────*/

describe('VentanaHojas · n8-concluye-con-datos, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('el alumno puede pasearse por las tres hojas en mitad de un encargo sin que se le riña', async () => {
    await abrirYEmpezar();
    expect(encargo()).toBe('Empieza por la frase más impresionante');

    irAHoja('Salones');
    irAHoja('Eventos');
    irAHoja('Meses');
    expect(document.querySelector('.txtw-aviso')).toBeNull();
    expect(encargo()).toBe('Empieza por la frase más impresionante');

    // Y la cinta sigue guardada: pulsar un botón que nadie pidió sí avisa.
    fireEvent.click(boton('negrita'));
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
  });

  it('encargo 1 · el 1 tecleado a mano no vale; la cuenta enseña que el 100 % son dos kilos', async () => {
    await abrirYEmpezar();

    // JUGAR MAL · el resultado sin la cuenta.
    teclear('F4', '1');
    teclear('F5', '2');
    await celebrar();
    expect(encargo()).toBe('Empieza por la frase más impresionante');

    paso1();
    await celebrar();
    expect(celda('F4').textContent).toBe('1');
    expect(celda('F5').textContent).toBe('2');
    expect(encargo()).toBe('¿Cuál de las tres pondrías en el mural?');
  });

  it('encargo 2 · las dos frases ciertas que exageran no pasan', async () => {
    await abrirYEmpezar();
    await hastaEl(1);

    // JUGAR MAL · la más impresionante, y es verdad.
    elegir(/El reciclaje se duplicó en 5°C/);
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    expect(encargo()).toBe('¿Cuál de las tres pondrías en el mural?');

    // JUGAR MAL · la que junta el porcentaje con «más que nadie».
    elegir(/el salón que más creció de toda la escuela/);
    expect(encargo()).toBe('¿Cuál de las tres pondrías en el mural?');

    paso2();
    await celebrar();
    expect(encargo()).toBe('Ahora el promedio por salón, con sus extremos');
  });

  it('encargo 3 y 4 · el promedio describe a un salón que no existe', async () => {
    await abrirYEmpezar();
    await hastaEl(2);

    paso3();
    await celebrar();
    expect(celda('F7').textContent).toBe('131.25');
    expect(celda('F8').textContent).toBe('480');
    expect(celda('F9').textContent).toBe('4');

    // JUGAR MAL · el promedio, que es aritméticamente impecable.
    elegir(/Cada salón juntó 131 kilos de media/);
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    expect(encargo()).toBe('La frase del promedio');

    paso4();
    await celebrar();
    expect(encargo()).toBe('Antes de decir quién es el mejor, divide');
  });

  it('encargo 5 y 6 · dividir al revés da otro número, y el total premia tener más alumnos', async () => {
    await abrirYEmpezar();
    await hastaEl(4);

    // JUGAR MAL · alumnos entre kilos en vez de kilos entre alumnos.
    teclear('F11', '=Salones!C11/Salones!B11');
    await celebrar();
    expect(encargo()).toBe('Antes de decir quién es el mejor, divide');

    paso5();
    await celebrar();
    expect(celda('F11').textContent).toBe('12');
    expect(celda('F12').textContent).toBe('16');

    // JUGAR MAL · premiar el total, que es lo que hace todo el mundo.
    elegir(/6°A es el más comprometido/);
    expect(encargo()).toBe('¿Quién se lleva el reconocimiento?');
    // Y JUGAR MAL por el otro lado: «no se puede saber» también es una afirmación.
    elegir(/Es imposible saber cuál salón se esforzó más/);
    expect(encargo()).toBe('¿Quién se lleva el reconocimiento?');

    paso6();
    await celebrar();
    expect(encargo()).toBe('La comparación que suena a éxito');
  });

  it('encargo 7 y 8 · marzo es el doble exacto de febrero, y aun así la frase no se sostiene', async () => {
    await abrirYEmpezar();
    await hastaEl(6);

    paso7();
    await celebrar();
    expect(celda('F14').textContent).toBe('1050');
    expect(celda('F15').textContent).toBe('2');

    // JUGAR MAL · la frase del éxito, que es verdad al céntimo.
    elegir(/La campaña funcionó/);
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    // JUGAR MAL · y la que se inventa una tendencia que no existe.
    elegir(/creció mes a mes durante todo el semestre/);
    expect(encargo()).toBe('La frase de marzo');

    paso8();
    await celebrar();
    expect(encargo()).toBe('El mes que se sale de la fila');
  });

  it('encargo 10 y 11 · sin leer los eventos, la explicación del calor parece la buena', async () => {
    await abrirYEmpezar();
    await hastaEl(9);
    expect(celda('F17').textContent).toBe('310');
    expect(celda('F18').textContent).toBe('175');
    expect(encargo()).toBe('Antes de decidir: ¿qué más pasó en la escuela?');

    paso10();
    await celebrar();
    expect(encargo()).toBe('La frase de la temperatura');

    // JUGAR MAL · la correlación como causa.
    elegir(/Cuanto más calor hace, más se recicla/);
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    // JUGAR MAL · la trampa fina: cambiar una causa falsa por otra que suena mejor.
    elegir(/La feria del agua hizo que se reciclara más/);
    expect(encargo()).toBe('La frase de la temperatura');

    paso11();
    await celebrar();
    expect(encargo()).toBe('Y ahora sí: la frase del mural');
  });

  it('pulsar veinte veces un botón que nadie pidió no cierra nada ni toca los datos', async () => {
    await abrirYEmpezar();
    for (let i = 0; i < 20; i += 1) fireEvent.click(boton('negrita'));
    await celebrar();
    expect(encargo()).toBe('Empieza por la frase más impresionante');
    expect(celda('B7').textContent).toBe('310');
    expect(celda('F4').textContent).toBe('');
  });
});

/* ── el recorrido completo ──────────────────────────────────────────────────*/

describe('VentanaHojas · n8-concluye-con-datos de punta a punta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina, y la frase que gana el mural es la que dice menos', async () => {
    const onTerminado = jest.fn();
    await abrirYEmpezar(onTerminado);

    await jugar(1, 12);

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: 12, tropiezos: 0 });
  });
});
