/**
 * `n7-funcion-si` · «La celda que contesta» (temario §45.2, bloques 23 · 24).
 *
 * `guion.ts` y `Lab.tsx`/`Entrada.tsx` ya estaban escritos y compilando; lo que
 * faltaba era el registro y esta prueba. Se juega MAL a propósito, que es la
 * regla de la casa (§ jugar mal a propósito): un botón equivocado, una fórmula
 * que no decide y una opción de la trampa tienen que **suspender** el encargo,
 * no sólo aprobarlo la buena.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_BASICO } from '@/components/activities/office/tecniaHojas';
import {
  GUION_FUNCION_SI,
  FILA_PRIMERA,
  FILA_DEL_QUE_COMPLETA,
  FILA_DE_LAS_COMILLAS,
  CUOTA,
  LO_QUE_FALTABA,
  YA_PAGO,
  LE_FALTA,
} from '@/components/activities/office/excel/funcion-si/guion';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

async function abrir() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_FUNCION_SI} />);
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

describe('VentanaHojas · n7-funcion-si se pinta', () => {
  it('la portada anuncia el tema, y el libro abre con los doce alumnos y la cuota de 320', async () => {
    await abrir();
    expect(screen.getByText('La función SI, Y/O/NO y el SI anidado')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda('A4').textContent).toBe('Ana Karen Solís');
    expect(celda(`B${FILA_PRIMERA}`).textContent).toBe(String(CUOTA));
    // Ivanna (fila 9) llegó apuntada mal a propósito: pagó y dice que le falta.
    expect(celda('F9').textContent).toBe(LE_FALTA);
  });
});

describe('VentanaHojas · n7-funcion-si, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargo 1 · un botón de la cinta no completa el pago de Emiliano; escribirlo sí', async () => {
    await abrirYEmpezar();
    expect(encargo()).toBe('Emiliano acaba de completar');

    // JUGAR MAL · el encargo pide un dato y se pulsa un botón de formato.
    fireEvent.click(boton('negrita'));
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(encargo()).toBe('Emiliano acaba de completar');
    // Y no se tocó el libro: Emiliano sigue en 200.
    expect(celda(`C${FILA_DEL_QUE_COMPLETA}`).textContent).toBe('200');

    teclear(`C${FILA_DEL_QUE_COMPLETA}`, String(CUOTA));
    await celebrar();
    expect(celda(`C${FILA_DEL_QUE_COMPLETA}`).textContent).toBe(String(CUOTA));
    expect(LO_QUE_FALTABA).toBe(120);
    expect(encargo()).toBe('Tu primera decisión');
  });

  it('encargo 2 · una palabra que no mira C4 no decide; sólo el SI que se entera avanza', async () => {
    await abrirYEmpezar();
    teclear(`C${FILA_DEL_QUE_COMPLETA}`, String(CUOTA));
    await celebrar();
    expect(encargo()).toBe('Tu primera decisión');

    // JUGAR MAL · el atajo que se le ocurre a medio salón: una fórmula que dice
    // la palabra buena pero no compara nada y no se entera si el pago cambia.
    teclear(`F${FILA_PRIMERA}`, `="${YA_PAGO}"`);
    expect(celda(`F${FILA_PRIMERA}`).textContent).toBe(YA_PAGO);
    expect(encargo()).toBe('Tu primera decisión');

    teclear(`F${FILA_PRIMERA}`, `=SI(C${FILA_PRIMERA}>=${CUOTA},"${YA_PAGO}","${LE_FALTA}")`);
    await celebrar();
    expect(encargo()).toBe('A propósito, hazlo mal');
  });

  it('encargos 3 y 4 · arreglar las comillas antes de tiempo no provoca el error que se pedía', async () => {
    await abrirYEmpezar();
    teclear(`C${FILA_DEL_QUE_COMPLETA}`, String(CUOTA));
    await celebrar();
    teclear(`F${FILA_PRIMERA}`, `=SI(C${FILA_PRIMERA}>=${CUOTA},"${YA_PAGO}","${LE_FALTA}")`);
    await celebrar();
    expect(encargo()).toBe('A propósito, hazlo mal');

    const celdaComillas = `F${FILA_DE_LAS_COMILLAS}`;

    // JUGAR MAL · se adelanta y la escribe bien, saltándose la demostración: el
    // encargo exige VER el #¿NOMBRE?, y una fórmula correcta no lo produce.
    teclear(celdaComillas, `=SI(C${FILA_DE_LAS_COMILLAS}>=${CUOTA},"${YA_PAGO}","${LE_FALTA}")`);
    expect(celda(celdaComillas).textContent).not.toBe('#¿NOMBRE?');
    expect(encargo()).toBe('A propósito, hazlo mal');

    // Ahora sí, como manda el encargo: sin comillas.
    teclear(celdaComillas, `=SI(C${FILA_DE_LAS_COMILLAS}>=${CUOTA},${YA_PAGO},No)`);
    await waitFor(() => expect(celda(celdaComillas).textContent).toBe('#¿NOMBRE?'));
    await celebrar();
    expect(encargo()).toBe('Ahora sí, con comillas');

    // Y el encargo 4 la corrige de verdad.
    teclear(celdaComillas, `=SI(C${FILA_DE_LAS_COMILLAS}>=${CUOTA},"${YA_PAGO}","${LE_FALTA}")`);
    await celebrar();
    expect(celda(celdaComillas).textContent).toBe(LE_FALTA);
    expect(encargo()).toBe('¿Por qué salió #¿NOMBRE?');
  });

  it('encargo 5 · la opción de la trampa avisa; sólo la correcta explica el error', async () => {
    await abrirYEmpezar();
    teclear(`C${FILA_DEL_QUE_COMPLETA}`, String(CUOTA));
    await celebrar();
    teclear(`F${FILA_PRIMERA}`, `=SI(C${FILA_PRIMERA}>=${CUOTA},"${YA_PAGO}","${LE_FALTA}")`);
    await celebrar();
    const celdaComillas = `F${FILA_DE_LAS_COMILLAS}`;
    teclear(celdaComillas, `=SI(C${FILA_DE_LAS_COMILLAS}>=${CUOTA},${YA_PAGO},No)`);
    await celebrar();
    teclear(celdaComillas, `=SI(C${FILA_DE_LAS_COMILLAS}>=${CUOTA},"${YA_PAGO}","${LE_FALTA}")`);
    await celebrar();
    expect(encargo()).toBe('¿Por qué salió #¿NOMBRE?');

    // JUGAR MAL · la primera opción es la trampa de siempre: culpar al idioma.
    fireEvent.click(screen.getByText(/no le gustan los acentos/));
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    expect(encargo()).toBe('¿Por qué salió #¿NOMBRE?');

    fireEvent.click(screen.getByText(/creyó que «Sí» era el nombre de una celda/));
    await celebrar();
    expect(encargo()).toBe('Doce decisiones de un botón');
  });

  it('encargo 6 · rellenar hacia abajo corrige sola la equivocación de Ivanna', async () => {
    await abrirYEmpezar();
    teclear(`C${FILA_DEL_QUE_COMPLETA}`, String(CUOTA));
    await celebrar();
    teclear(`F${FILA_PRIMERA}`, `=SI(C${FILA_PRIMERA}>=${CUOTA},"${YA_PAGO}","${LE_FALTA}")`);
    await celebrar();
    const celdaComillas = `F${FILA_DE_LAS_COMILLAS}`;
    teclear(celdaComillas, `=SI(C${FILA_DE_LAS_COMILLAS}>=${CUOTA},${YA_PAGO},No)`);
    await celebrar();
    teclear(celdaComillas, `=SI(C${FILA_DE_LAS_COMILLAS}>=${CUOTA},"${YA_PAGO}","${LE_FALTA}")`);
    await celebrar();
    fireEvent.click(screen.getByText(/creyó que «Sí» era el nombre de una celda/));
    await celebrar();
    expect(encargo()).toBe('Doce decisiones de un botón');
    // Antes de rellenar, Ivanna (fila 9) seguía apuntada a mano y mal.
    expect(celda('F9').textContent).toBe(LE_FALTA);

    fireEvent.mouseDown(celda(`F${FILA_PRIMERA}`));
    fireEvent.mouseDown(celda('F15'), { shiftKey: true });
    fireEvent.click(boton('rellenar-abajo'));
    await celebrar();

    expect(celda('F9').textContent).toBe(YA_PAGO);
    expect(encargo()).toBe('Tres respuestas, no dos');
  });
});
