/**
 * `n7-referencias` · «El `$` manda al copiar» (temario §45.2, bloques 21 · 22).
 *
 * `guion.ts` ya estaba escrito y compilando; faltaban `Lab.tsx`, `Entrada.tsx`,
 * el registro y esta prueba. Se juega MAL a propósito (regla de la casa): un
 * botón equivocado, una fórmula sin `$` reincidente y la opción de la trampa
 * tienen que **suspender** el encargo.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_BASICO } from '@/components/activities/office/tecniaHojas';
import {
  GUION_REFERENCIAS,
  FILA_PRIMER_RECUERDO,
  CELDA_DEL_IVA,
  IVA,
} from '@/components/activities/office/excel/referencias/guion';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

async function abrir() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_REFERENCIAS} />);
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

describe('VentanaHojas · n7-referencias se pinta', () => {
  it('la portada anuncia el tema, y el libro abre con el IVA viejo puesto', async () => {
    await abrir();
    expect(screen.getByText('Referencias absolutas y rangos con nombre')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda(CELDA_DEL_IVA).textContent).toBe('10%');
    expect(celda(`D${FILA_PRIMER_RECUERDO}`).textContent).toBe('5700');
  });
});

describe('VentanaHojas · n7-referencias, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargo 1 · un número tecleado no es una regla; sólo la fórmula avanza', async () => {
    await abrirYEmpezar();
    expect(encargo()).toBe('El IVA del primer renglón');

    // JUGAR MAL · un botón de la cinta, cuando lo que se pide es escribir.
    fireEvent.click(boton('negrita'));
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(encargo()).toBe('El IVA del primer renglón');

    // JUGAR MAL · escribe el resultado a mano en vez de la fórmula.
    teclear(`E${FILA_PRIMER_RECUERDO}`, '570');
    expect(celda(`E${FILA_PRIMER_RECUERDO}`).textContent).toBe('570');
    expect(encargo()).toBe('El IVA del primer renglón');

    teclear(`E${FILA_PRIMER_RECUERDO}`, `=D${FILA_PRIMER_RECUERDO}*${CELDA_DEL_IVA}`);
    await celebrar();
    expect(encargo()).toBe('Rellena, y mira lo que sale');
  });

  it('encargo 2 · el botón equivocado no rellena nada; «Rellenar hacia abajo» sí rompe la columna', async () => {
    await abrirYEmpezar();
    teclear(`E${FILA_PRIMER_RECUERDO}`, `=D${FILA_PRIMER_RECUERDO}*${CELDA_DEL_IVA}`);
    await celebrar();
    expect(encargo()).toBe('Rellena, y mira lo que sale');

    fireEvent.click(boton('negrita'));
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(celda(`E${FILA_PRIMER_RECUERDO + 1}`).textContent).toBe('');

    marcar(`E${FILA_PRIMER_RECUERDO}`, `E${FILA_PRIMER_RECUERDO + 5}`);
    fireEvent.click(boton('rellenar-abajo'));
    await celebrar();
    expect(celda(`E${FILA_PRIMER_RECUERDO + 1}`).textContent).toBe('0');
    expect(celda(`E${FILA_PRIMER_RECUERDO + 2}`).textContent).toBe('#¡VALOR!');
    expect(encargo()).toBe('¿Qué le pasó a la columna?');
  });

  it('encargo 3 · la opción de la trampa avisa; sólo la correcta explica el `$`', async () => {
    await abrirYEmpezar();
    teclear(`E${FILA_PRIMER_RECUERDO}`, `=D${FILA_PRIMER_RECUERDO}*${CELDA_DEL_IVA}`);
    await celebrar();
    marcar(`E${FILA_PRIMER_RECUERDO}`, `E${FILA_PRIMER_RECUERDO + 5}`);
    fireEvent.click(boton('rellenar-abajo'));
    await celebrar();
    expect(encargo()).toBe('¿Qué le pasó a la columna?');

    // JUGAR MAL · culpar a la papelería en vez de a la fórmula.
    fireEvent.click(screen.getByText(/mandó mal los precios/));
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    expect(encargo()).toBe('¿Qué le pasó a la columna?');

    fireEvent.click(screen.getByText(/una de las dos —la celda del IVA— no había que moverla/));
    await celebrar();
    expect(encargo()).toBe('Clava la celda del IVA');
  });

  it('encargo 4 · sin `$` la columna sigue rota; con `$E$2` rellena bien las seis', async () => {
    await abrirYEmpezar();
    teclear(`E${FILA_PRIMER_RECUERDO}`, `=D${FILA_PRIMER_RECUERDO}*${CELDA_DEL_IVA}`);
    await celebrar();
    marcar(`E${FILA_PRIMER_RECUERDO}`, `E${FILA_PRIMER_RECUERDO + 5}`);
    fireEvent.click(boton('rellenar-abajo'));
    await celebrar();
    fireEvent.click(screen.getByText(/una de las dos —la celda del IVA— no había que moverla/));
    await celebrar();
    expect(encargo()).toBe('Clava la celda del IVA');

    // JUGAR MAL · se le olvida el `$` otra vez: la columna sigue rota.
    teclear(`E${FILA_PRIMER_RECUERDO}`, `=D${FILA_PRIMER_RECUERDO}*${CELDA_DEL_IVA}`);
    marcar(`E${FILA_PRIMER_RECUERDO}`, `E${FILA_PRIMER_RECUERDO + 5}`);
    fireEvent.click(boton('rellenar-abajo'));
    await celebrar();
    expect(encargo()).toBe('Clava la celda del IVA');
    expect(celda(`E${FILA_PRIMER_RECUERDO + 1}`).textContent).toBe('0');

    // Ahora sí, con las dos anclas puestas.
    teclear(`E${FILA_PRIMER_RECUERDO}`, `=D${FILA_PRIMER_RECUERDO}*$E$2`);
    marcar(`E${FILA_PRIMER_RECUERDO}`, `E${FILA_PRIMER_RECUERDO + 5}`);
    fireEvent.click(boton('rellenar-abajo'));
    await celebrar();
    expect(celda(`E${FILA_PRIMER_RECUERDO + 3}`).textContent).toBe('60');
    expect(encargo()).toBe('Un tecleo, doce números');
  });

  it('encargo 5 · un 16 no es 0.16: la escuela sigue en el IVA viejo hasta que se escribe bien', async () => {
    await abrirYEmpezar();
    // 1 · sin `$`, y sale bien porque el IVA sigue en la fila 2
    teclear(`E${FILA_PRIMER_RECUERDO}`, `=D${FILA_PRIMER_RECUERDO}*${CELDA_DEL_IVA}`);
    await celebrar();
    // 2 · rellenar hacia abajo rompe la columna
    marcar(`E${FILA_PRIMER_RECUERDO}`, `E${FILA_PRIMER_RECUERDO + 5}`);
    fireEvent.click(boton('rellenar-abajo'));
    await celebrar();
    // 3 · la eleccion correcta
    fireEvent.click(screen.getByText(/una de las dos —la celda del IVA— no había que moverla/));
    await celebrar();
    // 4 · ahora con las dos anclas puestas
    teclear(`E${FILA_PRIMER_RECUERDO}`, `=D${FILA_PRIMER_RECUERDO}*$E$2`);
    marcar(`E${FILA_PRIMER_RECUERDO}`, `E${FILA_PRIMER_RECUERDO + 5}`);
    fireEvent.click(boton('rellenar-abajo'));
    await celebrar();
    expect(encargo()).toBe('Un tecleo, doce números');

    // JUGAR MAL · escribe 16 en vez de 0.16.
    teclear(CELDA_DEL_IVA, '16');
    expect(celda(CELDA_DEL_IVA).textContent).not.toBe('16%');
    expect(encargo()).toBe('Un tecleo, doce números');

    teclear(CELDA_DEL_IVA, String(IVA));
    await celebrar();
    expect(celda(CELDA_DEL_IVA).textContent).toBe('16%');
    expect(encargo()).toBe('Ahora de lado: ¿a cuánto lo vendemos?');
  });
});
