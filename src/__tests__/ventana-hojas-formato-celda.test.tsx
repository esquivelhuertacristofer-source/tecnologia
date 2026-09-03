/**
 * `of-excel-formato-de-celda` · «Que se vea lo que vale» (temario §45.2,
 * bloques 6 · 9 · 10). Cierra el grado Básico de Tecnia Hojas.
 *
 * `guion.ts` ya estaba escrito y compilando; faltaban `Lab.tsx`, `Entrada.tsx`,
 * el registro y esta prueba. Se juega MAL a propósito (regla de la casa): un
 * botón equivocado, un signo de pesos tecleado a mano y la opción de la trampa
 * tienen que **suspender** el encargo, no sólo aprobarlo la buena.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_BASICO } from '@/components/activities/office/tecniaHojas';
import {
  GUION_FORMATO_DE_CELDA,
  CELDA_DE_JUEGOS,
  LO_DE_JUEGOS,
  PRECIO_DEL_CAMION,
} from '@/components/activities/office/excel/formato-de-celda/guion';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

async function abrir() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_FORMATO_DE_CELDA} />);
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

function marcar(desde: string, hasta: string) {
  fireEvent.mouseDown(celda(desde));
  fireEvent.mouseDown(celda(hasta), { shiftKey: true });
}

describe('VentanaHojas · of-excel-formato-de-celda se pinta', () => {
  it('la portada anuncia el tema, y el libro abre con las fórmulas puestas y sin pinta', async () => {
    await abrir();
    expect(screen.getByText('El tipo de la celda y su formato')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda('C4').textContent).toBe(String(PRECIO_DEL_CAMION));
    expect(celda('D4').textContent).toBe('5200');
  });
});

describe('VentanaHojas · of-excel-formato-de-celda, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargo 1 · un botón que no es Moneda no viste nada; Moneda sí, y C4 no cambia de valor', async () => {
    await abrirYEmpezar();
    expect(encargo()).toBe('Que los pesos parezcan pesos');

    // JUGAR MAL · el botón equivocado.
    fireEvent.click(boton('negrita'));
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(encargo()).toBe('Que los pesos parezcan pesos');

    marcar('C4', 'D17');
    fireEvent.click(boton('moneda'));
    await celebrar();
    expect(celda('G4').textContent).toBe(String(PRECIO_DEL_CAMION));
    expect(encargo()).toBe('¿Qué guarda C4 ahora?');
  });

  it('encargo 2 · la opción «se ve como se guarda» avisa; sólo la correcta explica el formato', async () => {
    await abrirYEmpezar();
    marcar('C4', 'D17');
    fireEvent.click(boton('moneda'));
    await celebrar();
    expect(encargo()).toBe('¿Qué guarda C4 ahora?');

    // JUGAR MAL · confundir lo que se ve con lo que se guarda.
    fireEvent.click(screen.getByText(/es lo que se ve escrito en la celda/));
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    expect(encargo()).toBe('¿Qué guarda C4 ahora?');

    fireEvent.click(screen.getByText(/más una instrucción aparte de cómo enseñarlo/));
    await celebrar();
    expect(encargo()).toBe('Y ahora al revés: teclea tú el signo');
  });

  it('encargo 3 · escribir el número limpio se salta la demostración que el encargo pide', async () => {
    await abrirYEmpezar();
    marcar('C4', 'D17');
    fireEvent.click(boton('moneda'));
    await celebrar();
    fireEvent.click(screen.getByText(/más una instrucción aparte de cómo enseñarlo/));
    await celebrar();
    expect(encargo()).toBe('Y ahora al revés: teclea tú el signo');

    // JUGAR MAL · se adelanta y escribe el número limpio: el encargo exige VER
    // el número convertido en texto, y esto no lo provoca.
    teclear(CELDA_DE_JUEGOS, String(LO_DE_JUEGOS));
    expect(encargo()).toBe('Y ahora al revés: teclea tú el signo');

    teclear(CELDA_DE_JUEGOS, '$2,500');
    await waitFor(() => expect(celda('B26').textContent).toBe('3'));
    await celebrar();
    expect(encargo()).toBe('El signo lo pone el botón');
  });

  it('encargo 4 · Moneda no arregla un texto: hay que limpiar el dato primero', async () => {
    await abrirYEmpezar();
    marcar('C4', 'D17');
    fireEvent.click(boton('moneda'));
    await celebrar();
    fireEvent.click(screen.getByText(/más una instrucción aparte de cómo enseñarlo/));
    await celebrar();
    teclear(CELDA_DE_JUEGOS, '$2,500');
    await celebrar();
    expect(encargo()).toBe('El signo lo pone el botón');

    // JUGAR MAL · pintar Moneda sobre B20:B24 sin arreglar antes B22, que sigue
    // siendo texto: el 2500 no se vuelve número sólo por pintarlo.
    marcar('B20', 'B24');
    fireEvent.click(boton('moneda'));
    await celebrar();
    expect(encargo()).toBe('El signo lo pone el botón');

    teclear(CELDA_DE_JUEGOS, String(LO_DE_JUEGOS));
    marcar('B20', 'B24');
    fireEvent.click(boton('moneda'));
    await celebrar();
    expect(celda('B26').textContent).toBe('4');
    expect(encargo()).toBe('La escuela pone una parte');
  });

  it('encargo 5 · un 15 sin el punto decimal da 1500 %, no 15 %', async () => {
    await abrirYEmpezar();
    marcar('C4', 'D17');
    fireEvent.click(boton('moneda'));
    await celebrar();
    fireEvent.click(screen.getByText(/más una instrucción aparte de cómo enseñarlo/));
    await celebrar();
    teclear(CELDA_DE_JUEGOS, '$2,500');
    await celebrar();
    teclear(CELDA_DE_JUEGOS, String(LO_DE_JUEGOS));
    marcar('B20', 'B24');
    fireEvent.click(boton('moneda'));
    await celebrar();
    expect(encargo()).toBe('La escuela pone una parte');

    // JUGAR MAL · el 15 sin convertir a fracción de 1. Entrar confirma y baja
    // la selección una fila, así que hay que volver a pararse en B17 antes de
    // pulsar el botón.
    teclear('B17', '15');
    fireEvent.mouseDown(celda('B17'));
    fireEvent.click(boton('porcentaje'));
    expect(celda('B17').textContent).toBe('1500%');
    expect(encargo()).toBe('La escuela pone una parte');

    teclear('B17', '0.15');
    await celebrar();
    expect(celda('B17').textContent).toBe('15%');
    expect(encargo()).toBe('Que se vea dónde empiezan los datos');
  });
});
