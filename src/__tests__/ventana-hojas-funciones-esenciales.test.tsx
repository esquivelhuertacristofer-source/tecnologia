/**
 * `n6-funciones-esenciales` · «Sin partir la tabla en cuatro» (temario §45.2,
 * bloques 25 · 29). La tercera clase del grado Intermedio de Tecnia Hojas.
 *
 * `guion.ts`, `Lab.tsx` y `Entrada.tsx` ya estaban escritos y compilando; lo
 * que faltaba era el registro y esta prueba. Se juega MAL a propósito, que es
 * la regla de la casa: un criterio sin comillas, un rango desalineado, una
 * fecha menos un texto y un formato puesto en la celda que no es tienen que
 * **suspender** el encargo, no sólo aprobarlo la buena.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_BASICO } from '@/components/activities/office/tecniaHojas';
import {
  GUION_FUNCIONES_ESENCIALES,
  FILA_TRANSPORTE,
  FILA_COMIDA,
  FILA_ENTRADAS_PROMEDIO,
  FILA_REGALOS,
  FILA_MAS_DE_300,
  FILA_ENTRADAS_TOTAL,
  SERIE_HOY,
  SERIE_SALIDA,
  SERIE_AHORA,
  DIAS_FALTAN,
} from '@/components/activities/office/excel/funciones-esenciales/guion';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

async function abrir() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_FUNCIONES_ESENCIALES} />);
  await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
  return salida;
}

async function abrirYEmpezar() {
  const salida = await abrir();
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

function irAHoja(id: string) {
  fireEvent.click(document.querySelector(`[data-hoja="${id}"]`) as HTMLElement);
}

/** El desplegable «Formato de número»: se abre con el botón y se elige por el nombre del renglón. */
function elegirFormato(nombre: string) {
  fireEvent.click(boton('formato-numero'));
  const opciones = Array.from(document.querySelectorAll('.hjw-tipo')) as HTMLElement[];
  const objetivo = opciones.find((o) => o.querySelector('.hjw-tipo-nombre')?.textContent === nombre);
  if (!objetivo) throw new Error(`no se encontró el tipo de formato «${nombre}»`);
  fireEvent.click(objetivo);
}

const CELDA_TRANSPORTE = `B${FILA_TRANSPORTE}`;
const CELDA_COMIDA = `B${FILA_COMIDA}`;
const CELDA_ENTRADAS_PROMEDIO = `B${FILA_ENTRADAS_PROMEDIO}`;
const CELDA_REGALOS = `B${FILA_REGALOS}`;
const CELDA_MAS_DE_300 = `B${FILA_MAS_DE_300}`;
const CELDA_ENTRADAS_TOTAL = `B${FILA_ENTRADAS_TOTAL}`;

/** Las respuestas correctas, una función por encargo, para avanzar sin repetirlas en cada prueba. */
const hacer = {
  e1: async () => {
    teclear(CELDA_TRANSPORTE, '=SUMAR.SI(B4:B11,"Transporte",E4:E11)');
    await celebrar();
  },
  e2: async () => {
    teclear(CELDA_COMIDA, '=CONTAR.SI(B4:B11,"Comida")');
    await celebrar();
  },
  e3: async () => {
    teclear(CELDA_ENTRADAS_PROMEDIO, '=PROMEDIO.SI(B4:B11,"Entradas",E4:E11)');
    await celebrar();
  },
  e4: async () => {
    teclear(CELDA_REGALOS, '=PROMEDIO.SI(B4:B11,"Regalos",E4:E11)');
    await celebrar();
  },
  e5: async () => {
    teclear(CELDA_MAS_DE_300, '=SUMAR.SI(D4:D11,">300",E4:E11)');
    await celebrar();
  },
  e6: async () => {
    teclear(CELDA_ENTRADAS_TOTAL, '=SUMAR.SI(B4:B11,"Entradas",E4:E11)');
    await celebrar();
  },
  e7: async () => {
    irAHoja('h3');
    teclear('B10', '=HOY()');
    await celebrar();
  },
  e8: async () => {
    fireEvent.mouseDown(celda('B10'));
    elegirFormato('Fecha');
    await celebrar();
  },
  e9: async () => {
    teclear('B12', '=B11-B10');
    await celebrar();
  },
  e10: async () => {
    fireEvent.mouseDown(celda('B11'));
    elegirFormato('General');
    await celebrar();
  },
  e11: async () => {
    fireEvent.mouseDown(celda('B11'));
    elegirFormato('Fecha');
    await celebrar();
  },
};

describe('VentanaHojas · n6-funciones-esenciales se pinta', () => {
  it('la portada anuncia el tema, y el libro abre con la tabla ya categorizada', async () => {
    await abrir();
    expect(screen.getByText('Funciones condicionales y de fecha')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda('A4').textContent).toBe('Camión de la escuela a Teotihuacán');
    expect(celda('B4').textContent).toBe('Transporte');
    // «Lo pagado» ya es fórmula: 1 × 4800.
    expect(celda('E4').textContent).toBe('4800');
    expect(encargo()).toBe('Cuánto se fue en Transporte');
  });
});

describe('VentanaHojas · n6-funciones-esenciales, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargo 1 · sin comillas la hoja busca una celda llamada Transporte y no la encuentra', async () => {
    await abrirYEmpezar();
    expect(encargo()).toBe('Cuánto se fue en Transporte');

    // JUGAR MAL · el criterio de texto sin comillas.
    teclear(CELDA_TRANSPORTE, '=SUMAR.SI(B4:B11,Transporte,E4:E11)');
    await waitFor(() => expect(celda(CELDA_TRANSPORTE).textContent).toBe('#¿NOMBRE?'));
    expect(encargo()).toBe('Cuánto se fue en Transporte');

    await hacer.e1();
    expect(celda(CELDA_TRANSPORTE).textContent).toBe('4980');
    expect(encargo()).toBe('Cuántos gastos hay en Comida');
  });

  it('encargos 2 y 3 · CONTAR.SI cuenta con un solo rango, PROMEDIO.SI reparte sólo entre los que cumplen', async () => {
    await abrirYEmpezar();
    await hacer.e1();
    expect(encargo()).toBe('Cuántos gastos hay en Comida');

    await hacer.e2();
    expect(celda(CELDA_COMIDA).textContent).toBe('2');
    expect(encargo()).toBe('El gasto promedio en Entradas');

    await hacer.e3();
    expect(celda(CELDA_ENTRADAS_PROMEDIO).textContent).toBe('2155');
    expect(encargo()).toBe('El promedio de una categoría que no existe');
  });

  it('encargo 4 · sin ningún renglón que cumpla, PROMEDIO.SI contesta #¡DIV/0!', async () => {
    await abrirYEmpezar();
    await hacer.e1();
    await hacer.e2();
    await hacer.e3();
    expect(encargo()).toBe('El promedio de una categoría que no existe');

    await hacer.e4();
    expect(celda(CELDA_REGALOS).textContent).toBe('#¡DIV/0!');
    expect(encargo()).toBe('Los gastos de más de 300 pesos');
  });

  it('encargo 5 · el criterio numérico ">300" también lleva comillas', async () => {
    await abrirYEmpezar();
    await hacer.e1();
    await hacer.e2();
    await hacer.e3();
    await hacer.e4();
    expect(encargo()).toBe('Los gastos de más de 300 pesos');

    await hacer.e5();
    expect(celda(CELDA_MAS_DE_300).textContent).toBe('5500');
    expect(encargo()).toBe('El mismo total, bien alineado');
  });

  it('encargo 6 · un rango desalineado da un número y está mal, sin avisar', async () => {
    await abrirYEmpezar();
    await hacer.e1();
    await hacer.e2();
    await hacer.e3();
    await hacer.e4();
    await hacer.e5();
    expect(encargo()).toBe('El mismo total, bien alineado');

    // JUGAR MAL · el rango de lo pagado corrido una fila hacia arriba: no da
    // ningún error, da 3790 en vez de 4310, y el encargo no puede darse por
    // bueno con ese número.
    teclear(CELDA_ENTRADAS_TOTAL, '=SUMAR.SI(B4:B11,"Entradas",E3:E10)');
    await celebrar();
    expect(celda(CELDA_ENTRADAS_TOTAL).textContent).toBe('3790');
    expect(encargo()).toBe('El mismo total, bien alineado');

    await hacer.e6();
    expect(celda(CELDA_ENTRADAS_TOTAL).textContent).toBe('4310');
    expect(encargo()).toBe('Hoy es… ¿un número?');
  });

  it('encargo 7 · =HOY() enseña un número de cinco cifras, no una fecha', async () => {
    await abrirYEmpezar();
    await hacer.e1();
    await hacer.e2();
    await hacer.e3();
    await hacer.e4();
    await hacer.e5();
    await hacer.e6();
    expect(encargo()).toBe('Hoy es… ¿un número?');

    irAHoja('h3');
    teclear('B10', '=HOY()');
    await celebrar();
    expect(celda('B10').textContent).toBe(String(SERIE_HOY));
    expect(encargo()).toBe('Vístela de fecha');
  });

  it('encargo 8 · el mismo dato, ahora vestido de fecha', async () => {
    await abrirYEmpezar();
    await hacer.e1();
    await hacer.e2();
    await hacer.e3();
    await hacer.e4();
    await hacer.e5();
    await hacer.e6();
    await hacer.e7();
    expect(encargo()).toBe('Vístela de fecha');

    // JUGAR MAL · vestir de fecha una celda cualquiera no es lo que se pidió.
    fireEvent.mouseDown(celda('C4'));
    elegirFormato('Fecha');
    await celebrar();
    expect(encargo()).toBe('Vístela de fecha');

    await hacer.e8();
    expect(celda('B10').textContent).not.toBe(String(SERIE_HOY));
    expect(celda('B10').textContent).toContain('/');
    expect(encargo()).toBe('Cuántos días faltan');
  });

  it('encargo 9 · a una fecha no se le puede restar un texto', async () => {
    await abrirYEmpezar();
    await hacer.e1();
    await hacer.e2();
    await hacer.e3();
    await hacer.e4();
    await hacer.e5();
    await hacer.e6();
    await hacer.e7();
    await hacer.e8();
    expect(encargo()).toBe('Cuántos días faltan');

    // JUGAR MAL · restar el nombre de Ana en vez de la fecha de hoy.
    teclear('B12', '=B11-A4');
    await waitFor(() => expect(celda('B12').textContent).toBe('#¡VALOR!'));
    expect(encargo()).toBe('Cuántos días faltan');

    await hacer.e9();
    expect(celda('B12').textContent).toBe(String(DIAS_FALTAN));
    expect(encargo()).toBe('Quítale el disfraz a la salida');
  });

  it('encargos 10 y 11 · a la fecha de la salida se le quita el disfraz, y se le vuelve a poner', async () => {
    await abrirYEmpezar();
    await hacer.e1();
    await hacer.e2();
    await hacer.e3();
    await hacer.e4();
    await hacer.e5();
    await hacer.e6();
    await hacer.e7();
    await hacer.e8();
    await hacer.e9();
    expect(encargo()).toBe('Quítale el disfraz a la salida');

    await hacer.e10();
    expect(celda('B11').textContent).toBe(String(SERIE_SALIDA));
    // Los días que faltan no se movieron: el formato no toca el dato.
    expect(celda('B12').textContent).toBe(String(DIAS_FALTAN));
    expect(encargo()).toBe('Vístela otra vez');

    await hacer.e11();
    expect(celda('B11').textContent).not.toBe(String(SERIE_SALIDA));
    expect(celda('B11').textContent).toContain('/');
    expect(encargo()).toBe('Y ahora mismo, ¿qué hora es?');
  });

  it('encargo 12 · =AHORA() trae también la hora, la parte que HOY() tira', async () => {
    await abrirYEmpezar();
    await hacer.e1();
    await hacer.e2();
    await hacer.e3();
    await hacer.e4();
    await hacer.e5();
    await hacer.e6();
    await hacer.e7();
    await hacer.e8();
    await hacer.e9();
    await hacer.e10();
    await hacer.e11();
    expect(encargo()).toBe('Y ahora mismo, ¿qué hora es?');

    teclear('B13', '=AHORA()');
    await celebrar();
    expect(celda('B13').textContent).toBe(String(SERIE_AHORA));
    // HOY() (B10, ya vestida de fecha) se quedó con el entero; AHORA() trae
    // además la fracción del día, así que su texto lleva un punto decimal.
    expect(celda('B13').textContent).toContain('.');
  });
});
