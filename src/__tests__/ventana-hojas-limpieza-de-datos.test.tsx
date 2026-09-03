/**
 * `n8-limpieza-de-datos` · «La encuesta que llegó sucia» (doc §49.3). Primera
 * parada de N8 · «Datos y análisis», montada sobre `VentanaHojas` tal cual.
 *
 * Se juega **mal a propósito** (regla de la casa) y se recorre la clase entera
 * de principio a fin: teclear el resultado a mano en vez de la fórmula,
 * escribir la cuenta sobre el rango equivocado, corregir una edad con `=13`
 * —una regla donde va un dato—, escribir «25 pesos» otra vez, elegir la opción
 * cómoda del hueco, rellenar la columna de kilómetros a mano en vez de con una
 * regla, teclear el diez final sin haber contado nada, y pulsar el mismo botón
 * veinte veces.
 *
 * Lo que este archivo vigila y no se ve en ninguna otra prueba de la sala: **el
 * tablero de la derecha cambia de valor a cada encargo**, así que un predicado
 * que preguntara por el VALOR de una celda del tablero dejaría los encargos
 * anteriores en falso y la clase sería imposible de terminar con las pruebas
 * unitarias en verde. Es el defecto que el recorrido de punta a punta de la
 * sala de Excel encontró en nueve clases, y por eso aquí la prueba del
 * recorrido completo no es una más: es la que compra la clase.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_BASICO } from '@/components/activities/office/tecniaHojas';
import { FichaDeCalidad } from '@/components/activities/office/excel/limpieza-de-datos/FichaDeCalidad';
import { GUION_LIMPIEZA_DE_DATOS } from '@/components/activities/office/excel/limpieza-de-datos/guion';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

const PANEL = { titulo: 'Ficha de calidad', Cuerpo: FichaDeCalidad };

async function abrir(onTerminado?: jest.Mock) {
  const salida = render(
    <VentanaHojas
      cinta={CINTA_EXCEL_BASICO}
      guion={GUION_LIMPIEZA_DE_DATOS}
      panelFijo={PANEL}
      onTerminado={onTerminado}
    />,
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

/** Cuántas revisiones tiene encendidas la ficha de calidad ahora mismo. */
const revisionesHechas = (): number => document.querySelectorAll('.fcal-item[data-hecho="si"]').length;

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

function marcar(desde: string, hasta: string) {
  fireEvent.mouseDown(celda(desde));
  fireEvent.mouseDown(celda(hasta), { shiftKey: true });
}

/* ── los doce encargos, escritos una vez y usados por todas las pruebas ──────*/

const paso1 = () => teclear('H4', '=PROMEDIO(E4:E21)');

function paso2() {
  teclear('H7', '=PROMEDIO(B4:B21)');
  teclear('H8', '=MAX(B4:B21)');
  teclear('H9', '=MIN(B4:B21)');
}

const paso3 = () => teclear('B7', '13');

function paso4() {
  teclear('H12', '=CONTAR(E4:E21)');
  teclear('H13', '=CONTARA(E4:E21)');
  teclear('H14', '=CONTAR.BLANCO(E4:E21)');
}

const paso5 = () => teclear('E9', '25');

const paso6 = () => fireEvent.click(screen.getByText(/los tres vienen caminando/));

function paso7() {
  teclear('E5', '0');
  teclear('E10', '0');
  teclear('E15', '0');
}

function paso8() {
  teclear('H17', '=MAX(D4:D21)');
  teclear('H18', '=MIN(D4:D21)');
}

/** La regla en F4 y las diecisiete de abajo, copiando y pegando. */
function paso9() {
  teclear('F4', '=SI(D4>100,D4/1000,D4)');
  fireEvent.mouseDown(celda('F4'));
  fireEvent.click(boton('copiar'));
  marcar('F5', 'F21');
  fireEvent.click(boton('pegar'));
}

function paso10() {
  teclear('H19', '=MAX(F4:F21)');
  teclear('H20', '=MIN(F4:F21)');
}

function paso11() {
  teclear('H23', '=CONTAR.SI(C4:C21,"camión")');
  teclear('H24', '=CONTAR.SI(C4:C21,"cami*")');
}

const paso12 = () =>
  teclear(
    'H25',
    '=CONTAR.SI(C4:C21,"camión")+CONTAR.SI(C4:C21,"camion")+CONTAR.SI(C4:C21,"autobús")+CONTAR.SI(C4:C21,"bus")',
  );

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7, paso8, paso9, paso10, paso11, paso12];

/**
 * Los encargos de `desde` a `hasta` (numerados como en el guion, desde 1),
 * jugados bien.
 *
 * Con rango y no sólo con un tope: el encargo 6 es una ELECCIÓN, y volver a
 * pulsar su opción cuando ya está pasado no encuentra el botón. Es la primera
 * versión de este ayudante la que lo enseñó, cayéndose justo ahí.
 */
async function jugar(desde: number, hasta: number) {
  for (let i = desde; i <= hasta; i += 1) {
    PASOS[i - 1]();
    await celebrar();
  }
}

/** Los encargos 1 a n, ya jugados bien. */
const hastaEl = (n: number) => jugar(1, n);

/* ── se pinta ───────────────────────────────────────────────────────────────*/

describe('VentanaHojas · n8-limpieza-de-datos se pinta', () => {
  it('la portada anuncia el tema y el libro abre con las cinco averías puestas', async () => {
    await abrir();
    expect(screen.getByText('Qué le pasa a un conjunto de datos antes de que se pueda usar')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    // 1 · la edad imposible, a la vista y sin ninguna marca que la delate.
    expect(celda('B7').textContent).toBe('130');
    // 2 · el número que es texto.
    expect(celda('E9').textContent).toBe('$25 pesos');
    // 3 · los tres huecos, vacíos de verdad (no un texto vacío).
    expect(celda('E5').textContent).toBe('');
    expect(celda('E10').textContent).toBe('');
    expect(celda('E15').textContent).toBe('');
    // 4 · metros y kilómetros en la misma columna, los dos correctos.
    expect(celda('D21').textContent).toBe('6800');
    expect(celda('D6').textContent).toBe('2.4');
    // 5 · el mismo camión, escrito de cinco maneras.
    expect(celda('C4').textContent).toBe('camión');
    expect(celda('C6').textContent).toBe('Camión');
    expect(celda('C8').textContent).toBe('camion');
    expect(celda('C9').textContent).toBe('autobús');
    expect(celda('C14').textContent).toBe('bus');
    // Y la columna de kilómetros, con su rótulo puesto y sin una sola fórmula.
    expect(celda('F3').textContent).toBe('Distancia (km)');
    expect(celda('F4').textContent).toBe('');
  });

  it('la ficha de calidad abre en 0 de 5 y ninguna revisión miente', async () => {
    await abrirYEmpezar();
    expect(revisionesHechas()).toBe(0);
    expect(document.querySelectorAll('.fcal-item')).toHaveLength(5);
    expect(screen.getByText('0 de 5')).not.toBeNull();
  });
});

/* ── jugando mal ────────────────────────────────────────────────────────────*/

describe('VentanaHojas · n8-limpieza-de-datos, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargo 1 · el resultado tecleado a mano no vale, y el rango equivocado tampoco', async () => {
    await abrirYEmpezar();
    expect(encargo()).toBe('Escribe la cuenta del reporte');

    // JUGAR MAL · el número, sin la cuenta. Da lo mismo en pantalla y no enseña nada.
    teclear('H4', '11.07');
    await celebrar();
    expect(encargo()).toBe('Escribe la cuenta del reporte');

    // JUGAR MAL · la cuenta correcta sobre la columna de al lado.
    teclear('H4', '=PROMEDIO(D4:D21)');
    await celebrar();
    expect(encargo()).toBe('Escribe la cuenta del reporte');

    paso1();
    await celebrar();
    expect(celda('H4').textContent).toContain('11.07');
    expect(encargo()).toBe('Antes del promedio, los extremos');
  });

  it('encargo 2 · con dos de las tres cuentas no se cierra; con las tres, el 130 sale a la luz', async () => {
    await abrirYEmpezar();
    await hastaEl(1);

    // JUGAR MAL · el promedio y el máximo, y dejarse el mínimo.
    teclear('H7', '=PROMEDIO(B4:B21)');
    teclear('H8', '=MAX(B4:B21)');
    await celebrar();
    expect(encargo()).toBe('Antes del promedio, los extremos');

    teclear('H9', '=MIN(B4:B21)');
    await celebrar();
    expect(celda('H7').textContent).toBe('20.5');
    expect(celda('H8').textContent).toBe('130');
    expect(celda('H9').textContent).toBe('13');
    expect(encargo()).toBe('Un dedazo de un cero');
  });

  it('encargo 3 · una edad no se calcula: «=13» da el número y no cierra el encargo', async () => {
    await abrirYEmpezar();
    await hastaEl(2);

    // JUGAR MAL · una regla donde va un dato. El promedio de arriba ya dice 14.
    teclear('B7', '=13');
    await celebrar();
    expect(celda('H7').textContent).toBe('14');
    expect(encargo()).toBe('Un dedazo de un cero');

    paso3();
    await celebrar();
    expect(celda('H7').textContent).toBe('14');
    expect(encargo()).toBe('Tres maneras de contar lo mismo');
  });

  it('encargo 5 · «25 pesos» sigue siendo texto; sólo el número pelado pone de acuerdo a los contadores', async () => {
    await abrirYEmpezar();
    await hastaEl(4);
    expect(celda('H12').textContent).toBe('14');
    expect(celda('H13').textContent).toBe('15');
    expect(celda('H14').textContent).toBe('3');

    // JUGAR MAL · quitarle el signo pero dejarle la palabra.
    teclear('E9', '25 pesos');
    await celebrar();
    expect(celda('H12').textContent).toBe('14');
    expect(encargo()).toBe('El que escribió «pesos»');

    paso5();
    await celebrar();
    expect(celda('H12').textContent).toBe('15');
    expect(celda('H13').textContent).toBe('15');
    // El promedio del reporte se movió solo: 11,07 → 12.
    expect(celda('H4').textContent).toBe('12');
    expect(encargo()).toBe('Y ahora los tres huecos: ¿qué hacemos con ellos?');
  });

  it('encargo 6 · la opción cómoda —inventarse tres datos— no pasa', async () => {
    await abrirYEmpezar();
    await hastaEl(5);

    // JUGAR MAL · rellenar con el promedio de los demás «para no perder tres filas».
    fireEvent.click(screen.getByText(/Escribir el promedio de los demás/));
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    expect(encargo()).toBe('Y ahora los tres huecos: ¿qué hacemos con ellos?');

    // JUGAR MAL · dejarlos vacíos, que es la que parece más prudente.
    fireEvent.click(screen.getByText(/Dejarlos vacíos/));
    expect(encargo()).toBe('Y ahora los tres huecos: ¿qué hacemos con ellos?');

    paso6();
    await celebrar();
    expect(encargo()).toBe('Escribe los tres ceros');
  });

  it('encargo 7 · con dos de los tres huecos no basta, y con los tres el promedio cae a 10', async () => {
    await abrirYEmpezar();
    await hastaEl(6);

    teclear('E5', '0');
    teclear('E10', '0');
    await celebrar();
    expect(encargo()).toBe('Escribe los tres ceros');

    teclear('E15', '0');
    await celebrar();
    expect(celda('H4').textContent).toBe('10');
    expect(celda('H14').textContent).toBe('0');
    expect(encargo()).toBe('Ahora la distancia: mira los extremos otra vez');
  });

  it('encargo 9 · los kilómetros escritos a mano dan los mismos números y no cierran el encargo', async () => {
    await abrirYEmpezar();
    await hastaEl(8);
    expect(celda('H17').textContent).toBe('6800');
    expect(celda('H18').textContent).toBe('1.5');

    // JUGAR MAL · dividir a mano. Los dieciocho números salen bien y no hay regla.
    teclear('F4', '1.2');
    teclear('F5', '0.6');
    await celebrar();
    expect(celda('F4').textContent).toBe('1.2');
    expect(encargo()).toBe('Todo a kilómetros, con una regla');

    paso9();
    await celebrar();
    expect(celda('F4').textContent).toBe('1.2');
    expect(celda('F21').textContent).toBe('6.8');
    expect(celda('F10').textContent).toBe('0.45');
    // Las siete que ya venían en kilómetros no se tocaron.
    expect(celda('F6').textContent).toBe('2.4');
    expect(encargo()).toBe('Los mismos extremos, ahora que se pueden comparar');
  });

  it('encargo 11 y 12 · el comodín da el 10 correcto por accidente, y aun así no cierra el encargo', async () => {
    await abrirYEmpezar();
    await hastaEl(10);

    paso11();
    await celebrar();
    expect(celda('H23').textContent).toBe('6');
    // Diez, que es la respuesta correcta: siete que empiezan por «cami», más
    // los tres que vienen CAMINANDO, menos los tres de «autobús» y «bus».
    expect(celda('H24').textContent).toBe('10');
    expect(encargo()).toBe('Cuéntalos de verdad');

    // JUGAR MAL · el número correcto, sin haber contado nada.
    teclear('H25', '10');
    await celebrar();
    expect(celda('H25').textContent).toBe('10');
    expect(encargo()).toBe('Cuéntalos de verdad');

    // JUGAR MAL · **la trampa de esta clase**: el comodín da 10 y un corrector
    // que sólo mirase el número lo aprobaría. Éste no: le cambia el nombre a la
    // categoría de los que van a pie y la cuenta se queda en siete.
    teclear('H25', '=CONTAR.SI(C4:C21,"cami*")');
    await celebrar();
    expect(celda('H25').textContent).toBe('10');
    expect(encargo()).toBe('Cuéntalos de verdad');

    // JUGAR MAL · contarlos bien pero dejarse una grafía: nueve, no diez.
    teclear('H25', '=CONTAR.SI(C4:C21,"camión")+CONTAR.SI(C4:C21,"autobús")+CONTAR.SI(C4:C21,"bus")');
    await celebrar();
    expect(celda('H25').textContent).toBe('9');
    expect(encargo()).toBe('Cuéntalos de verdad');

    paso12();
    await celebrar();
    expect(celda('H25').textContent).toBe('10');
    expect(screen.getByText('Terminaste')).not.toBeNull();
  });

  it('pulsar el mismo botón veinte veces no cierra ningún encargo ni rompe el libro', async () => {
    await abrirYEmpezar();
    for (let i = 0; i < 20; i += 1) fireEvent.click(boton('negrita'));
    await celebrar();
    expect(encargo()).toBe('Escribe la cuenta del reporte');
    expect(celda('B7').textContent).toBe('130');
    expect(revisionesHechas()).toBe(0);
  });

  it('la ficha de calidad mira los datos, no el avance: sigue en 0 tras las cuatro primeras cuentas', async () => {
    await abrirYEmpezar();
    await hastaEl(2); // encargos 1 y 2: cuatro fórmulas escritas, ni un dato tocado
    expect(revisionesHechas()).toBe(0);

    await jugar(3, 3);
    // Sólo la primera, y sólo porque el dato imposible ya no está.
    expect(revisionesHechas()).toBe(1);
    expect(
      document.querySelector('.fcal-item[data-revision="imposible"]')?.getAttribute('data-hecho'),
    ).toBe('si');
  });
});

/* ── el recorrido completo ──────────────────────────────────────────────────*/

describe('VentanaHojas · n8-limpieza-de-datos de punta a punta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina, y el promedio del reporte cuenta la historia: 11,07 · 12 · 10', async () => {
    const onTerminado = jest.fn();
    await abrirYEmpezar(onTerminado);

    await jugar(1, 1);
    expect(celda('H4').textContent).toContain('11.07');

    await jugar(2, 5);
    expect(celda('H4').textContent).toBe('12');

    await jugar(6, 7);
    expect(celda('H4').textContent).toBe('10');

    await jugar(8, 12);

    // Las cinco revisiones encendidas y la clase cerrada.
    expect(revisionesHechas()).toBe(5);
    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: 12, tropiezos: 0 });
  });
});
